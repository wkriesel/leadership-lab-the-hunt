const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./db');
const runMigrations = require('./migrations/migrate');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const sessionsRoutes = require('./routes/sessions');

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://leadership-lab-the-hunt.web.app',
    'https://leadership-lab-the-hunt.firebaseapp.com'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// REST API Routes
app.use('/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Socket.IO
// Store active session connections
const sessionConnections = {}; // { sessionId: [socket1, socket2, ...] }

// Helper to get/update session state from database
async function getSessionState(sessionId) {
    try {
        const sessionRes = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) return null;

        const session = sessionRes.rows[0];
        const groupsRes = await pool.query('SELECT id, name FROM groups WHERE session_id = $1', [sessionId]);
        const responsesRes = await pool.query('SELECT r.*, g.name as groupName FROM responses r LEFT JOIN groups g ON r.group_id = g.id WHERE r.session_id = $1', [sessionId]);
        const votesRes = await pool.query('SELECT v.*, g.name as groupName FROM votes v LEFT JOIN groups g ON v.group_id = g.id WHERE v.session_id = $1', [sessionId]);
        const nextStepsRes = await pool.query('SELECT ns.*, g.name as groupName FROM next_steps ns LEFT JOIN groups g ON ns.group_id = g.id WHERE ns.session_id = $1', [sessionId]);

        return {
            id: session.id,
            code: session.code,
            phase: session.phase,
            groups: groupsRes.rows.map(g => g.name),
            responses: responsesRes.rows.map(r => ({
                id: r.id,
                groupName: r.groupname,
                promptId: r.prompt_id,
                text: r.text,
                tags: r.tags || []
            })),
            votes: votesRes.rows.map(v => ({
                id: v.id,
                groupName: v.groupname,
                answer: v.answer
            })),
            nextSteps: nextStepsRes.rows.map(ns => ({
                id: ns.id,
                groupName: ns.groupname,
                text: ns.text,
                tags: ns.tags || []
            })),
            activeScenario: session.active_scenario_id,
            responseFormat: session.response_format
        };
    } catch (error) {
        console.error('Error getting session state:', error);
        return null;
    }
}

// Helper to fetch group ID by session and name
async function getOrCreateGroup(sessionId, groupName) {
    try {
        const existingRes = await pool.query(
            'SELECT id FROM groups WHERE session_id = $1 AND name = $2',
            [sessionId, groupName]
        );

        if (existingRes.rows.length > 0) {
            return existingRes.rows[0].id;
        }

        const newRes = await pool.query(
            'INSERT INTO groups (session_id, name) VALUES ($1, $2) RETURNING id',
            [sessionId, groupName]
        );

        return newRes.rows[0].id;
    } catch (error) {
        console.error('Error getting/creating group:', error);
        return null;
    }
}

// Helper to broadcast session state to all clients in a session
async function broadcastSessionState(sessionId) {
    const state = await getSessionState(sessionId);
    if (state && sessionConnections[sessionId]) {
        sessionConnections[sessionId].forEach(socket => {
            socket.emit('stateUpdate', state);
        });
    }
}

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Participant joins a session with code + group name
    socket.on('joinSession', async (data) => {
        try {
            const { sessionCode, groupName } = data;

            // Find session by code
            const sessionRes = await pool.query('SELECT id FROM sessions WHERE code = $1', [sessionCode]);
            if (sessionRes.rows.length === 0) {
                socket.emit('error', { message: 'Invalid session code' });
                return;
            }

            const sessionId = sessionRes.rows[0].id;

            // Get or create group
            const groupId = await getOrCreateGroup(sessionId, groupName);
            if (!groupId) {
                socket.emit('error', { message: 'Failed to join group' });
                return;
            }

            // Store session info in socket
            socket.sessionId = sessionId;
            socket.groupId = groupId;
            socket.groupName = groupName;

            // Add socket to session connections
            if (!sessionConnections[sessionId]) {
                sessionConnections[sessionId] = [];
            }
            sessionConnections[sessionId].push(socket);

            // Join Socket.IO room for this session
            socket.join(`session-${sessionId}`);

            // Send initial state
            const state = await getSessionState(sessionId);
            socket.emit('stateUpdate', state);

            // Broadcast to all in session
            await broadcastSessionState(sessionId);
        } catch (error) {
            console.error('Join session error:', error);
            socket.emit('error', { message: 'Failed to join session' });
        }
    });

    // Facilitator joins a session for management
    socket.on('facilitatorJoinSession', async (data) => {
        try {
            const { sessionId } = data;

            socket.sessionId = sessionId;
            socket.isFacilitator = true;

            // Add socket to session connections
            if (!sessionConnections[sessionId]) {
                sessionConnections[sessionId] = [];
            }
            sessionConnections[sessionId].push(socket);

            // Join Socket.IO room
            socket.join(`session-${sessionId}`);

            // Send initial state
            const state = await getSessionState(sessionId);
            socket.emit('stateUpdate', state);
        } catch (error) {
            console.error('Facilitator join error:', error);
            socket.emit('error', { message: 'Failed to join session' });
        }
    });

    // Participant submits Phase 1 response
    socket.on('submitResponse', async (data) => {
        try {
            if (!socket.sessionId || !socket.groupId) {
                socket.emit('error', { message: 'Not in a session' });
                return;
            }

            const { promptId, text } = data;

            await pool.query(
                'INSERT INTO responses (session_id, group_id, prompt_id, text) VALUES ($1, $2, $3, $4)',
                [socket.sessionId, socket.groupId, promptId, text]
            );

            await broadcastSessionState(socket.sessionId);
        } catch (error) {
            console.error('Submit response error:', error);
            socket.emit('error', { message: 'Failed to submit response' });
        }
    });

    // Participant tags response in Phase 2
    socket.on('tagResponse', async (data) => {
        try {
            const { id, tags } = data;

            await pool.query(
                'UPDATE responses SET tags = $1 WHERE id = $2',
                [tags, id]
            );

            // Get the response to find session
            const res = await pool.query('SELECT session_id FROM responses WHERE id = $1', [id]);
            if (res.rows.length > 0) {
                await broadcastSessionState(res.rows[0].session_id);
            }
        } catch (error) {
            console.error('Tag response error:', error);
            socket.emit('error', { message: 'Failed to tag response' });
        }
    });

    // Facilitator changes phase
    socket.on('setPhase', async (data) => {
        try {
            const { sessionId, phase } = data;

            await pool.query(
                'UPDATE sessions SET phase = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [phase, sessionId]
            );

            await broadcastSessionState(sessionId);
        } catch (error) {
            console.error('Set phase error:', error);
            socket.emit('error', { message: 'Failed to change phase' });
        }
    });

    // Facilitator pushes scenario
    socket.on('setScenario', async (data) => {
        try {
            const { sessionId, scenario, format } = data;

            await pool.query(
                'UPDATE sessions SET active_scenario_id = $1, response_format = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                [scenario.id, format, sessionId]
            );

            // Clear votes for new scenario
            await pool.query('DELETE FROM votes WHERE session_id = $1', [sessionId]);

            await broadcastSessionState(sessionId);
        } catch (error) {
            console.error('Set scenario error:', error);
            socket.emit('error', { message: 'Failed to set scenario' });
        }
    });

    // Participant submits Phase 3 vote
    socket.on('submitVote', async (data) => {
        try {
            if (!socket.sessionId || !socket.groupId) {
                socket.emit('error', { message: 'Not in a session' });
                return;
            }

            const { answer } = data;

            // Check if vote exists
            const existingRes = await pool.query(
                'SELECT id FROM votes WHERE session_id = $1 AND group_id = $2',
                [socket.sessionId, socket.groupId]
            );

            if (existingRes.rows.length > 0) {
                // Update existing vote
                await pool.query(
                    'UPDATE votes SET answer = $1 WHERE session_id = $2 AND group_id = $3',
                    [answer, socket.sessionId, socket.groupId]
                );
            } else {
                // Create new vote
                await pool.query(
                    'INSERT INTO votes (session_id, group_id, answer) VALUES ($1, $2, $3)',
                    [socket.sessionId, socket.groupId, answer]
                );
            }

            await broadcastSessionState(socket.sessionId);
        } catch (error) {
            console.error('Submit vote error:', error);
            socket.emit('error', { message: 'Failed to submit vote' });
        }
    });

    // Participant submits Phase 4 next step
    socket.on('submitNextStep', async (data) => {
        try {
            if (!socket.sessionId || !socket.groupId) {
                socket.emit('error', { message: 'Not in a session' });
                return;
            }

            const { text, tags } = data;

            await pool.query(
                'INSERT INTO next_steps (session_id, group_id, text, tags) VALUES ($1, $2, $3, $4)',
                [socket.sessionId, socket.groupId, text, tags]
            );

            await broadcastSessionState(socket.sessionId);
        } catch (error) {
            console.error('Submit next step error:', error);
            socket.emit('error', { message: 'Failed to submit next step' });
        }
    });

    // Facilitator resets session
    socket.on('resetSession', async (data) => {
        try {
            const { sessionId } = data;

            // Delete all data for session
            await pool.query('DELETE FROM votes WHERE session_id = $1', [sessionId]);
            await pool.query('DELETE FROM next_steps WHERE session_id = $1', [sessionId]);
            await pool.query('DELETE FROM responses WHERE session_id = $1', [sessionId]);
            await pool.query('DELETE FROM groups WHERE session_id = $1', [sessionId]);

            // Reset session
            await pool.query(
                'UPDATE sessions SET phase = 1, active_scenario_id = NULL, response_format = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['multiple_choice', sessionId]
            );

            await broadcastSessionState(sessionId);
        } catch (error) {
            console.error('Reset session error:', error);
            socket.emit('error', { message: 'Failed to reset session' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Remove socket from session connections
        if (socket.sessionId && sessionConnections[socket.sessionId]) {
            sessionConnections[socket.sessionId] = sessionConnections[socket.sessionId].filter(s => s.id !== socket.id);
            if (sessionConnections[socket.sessionId].length === 0) {
                delete sessionConnections[socket.sessionId];
            }
        }
    });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
    // Run migrations on startup (creates tables if they don't exist)
    try {
        await runMigrations();
    } catch (err) {
        console.error('Migration warning:', err.message);
        // Continue anyway - tables may already exist
    }

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Socket.IO server ready`);
    });
}

startServer();
