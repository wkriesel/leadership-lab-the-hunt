const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate a unique 6-character session code
async function generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;

    while (!isUnique) {
        code = Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
        const result = await pool.query('SELECT id FROM sessions WHERE code = $1', [code]);
        isUnique = result.rows.length === 0;
    }

    return code;
}

// Helper to fetch full session with all data
async function getSessionData(sessionId) {
    try {
        const sessionRes = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) return null;

        const session = sessionRes.rows[0];

        const groupsRes = await pool.query('SELECT id, name, created_at FROM groups WHERE session_id = $1 ORDER BY created_at', [sessionId]);
        const responsesRes = await pool.query('SELECT * FROM responses WHERE session_id = $1 ORDER BY created_at', [sessionId]);
        const votesRes = await pool.query('SELECT * FROM votes WHERE session_id = $1 ORDER BY created_at', [sessionId]);
        const nextStepsRes = await pool.query('SELECT * FROM next_steps WHERE session_id = $1 ORDER BY created_at', [sessionId]);

        return {
            id: session.id,
            code: session.code,
            title: session.title,
            phase: session.phase,
            response_format: session.response_format,
            activeScenario: session.active_scenario_id,
            groups: groupsRes.rows.map(g => g.name),
            responses: responsesRes.rows,
            votes: votesRes.rows,
            nextSteps: nextStepsRes.rows,
            created_at: session.created_at,
            updated_at: session.updated_at
        };
    } catch (error) {
        console.error('Error fetching session data:', error);
        throw error;
    }
}

// Create a new session
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, isTest = false } = req.body;
        const code = await generateUniqueCode();

        const result = await pool.query(
            'INSERT INTO sessions (facilitator_id, code, title, is_test) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.userId, code, title || 'Untitled Session', isTest]
        );

        const session = result.rows[0];
        res.status(201).json({
            success: true,
            session: {
                id: session.id,
                code: session.code,
                title: session.title,
                phase: session.phase,
                isTest: session.is_test
            }
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// List all sessions for the authenticated user
router.get('/', verifyToken, async (req, res) => {
    try {
        const includeTest = req.query.includeTest === 'true';
        let query = 'SELECT id, code, title, phase, is_test, created_at, updated_at FROM sessions WHERE facilitator_id = $1';
        if (!includeTest) {
            query += ' AND is_test = FALSE';
        }
        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, [req.userId]);

        res.json({
            success: true,
            sessions: result.rows.map(s => ({ ...s, isTest: s.is_test }))
        });
    } catch (error) {
        console.error('List sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get full session data
router.get('/:sessionId', async (req, res) => {
    try {
        const sessionData = await getSessionData(req.params.sessionId);
        if (!sessionData) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            success: true,
            session: sessionData
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// Export session data as JSON
router.get('/:sessionId/export', async (req, res) => {
    try {
        const sessionData = await getSessionData(req.params.sessionId);
        if (!sessionData) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const filename = `AI-Explorer-Session-${new Date().toISOString().split('T')[0]}-${sessionData.code}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(sessionData);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export session' });
    }
});

// Generate QR code for session
router.get('/:sessionId/qr', async (req, res) => {
    try {
        const sessionRes = await pool.query('SELECT code FROM sessions WHERE id = $1', [req.params.sessionId]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const code = sessionRes.rows[0].code;
        const qrDataUrl = await QRCode.toDataURL(code);

        res.json({
            success: true,
            qr: qrDataUrl,
            code: code
        });
    } catch (error) {
        console.error('QR code error:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Update session phase (for facilitator)
router.put('/:sessionId/phase', verifyToken, async (req, res) => {
    try {
        const { phase } = req.body;

        // Verify user owns this session
        const checkRes = await pool.query('SELECT facilitator_id FROM sessions WHERE id = $1', [req.params.sessionId]);
        if (checkRes.rows.length === 0 || checkRes.rows[0].facilitator_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query(
            'UPDATE sessions SET phase = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [phase, req.params.sessionId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Update phase error:', error);
        res.status(500).json({ error: 'Failed to update phase' });
    }
});

// Aggregate data across multiple sessions
router.post('/aggregate', verifyToken, async (req, res) => {
    try {
        const { sessionIds } = req.body;
        if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
            return res.status(400).json({ error: 'sessionIds array is required' });
        }

        // Verify user owns all requested sessions
        const sessionsRes = await pool.query(
            'SELECT id, code, title, phase, is_test, created_at FROM sessions WHERE id = ANY($1) AND facilitator_id = $2 ORDER BY created_at DESC',
            [sessionIds, req.userId]
        );

        if (sessionsRes.rows.length === 0) {
            return res.status(404).json({ error: 'No matching sessions found' });
        }

        const validIds = sessionsRes.rows.map(s => s.id);

        // Fetch all data across selected sessions
        const [groupsRes, responsesRes, votesRes, nextStepsRes] = await Promise.all([
            pool.query('SELECT g.*, s.title as session_title FROM groups g JOIN sessions s ON g.session_id = s.id WHERE g.session_id = ANY($1) ORDER BY g.created_at', [validIds]),
            pool.query('SELECT r.*, g.name as "groupName", s.title as session_title FROM responses r LEFT JOIN groups g ON r.group_id = g.id JOIN sessions s ON r.session_id = s.id WHERE r.session_id = ANY($1) ORDER BY r.created_at', [validIds]),
            pool.query('SELECT v.*, g.name as "groupName", s.title as session_title FROM votes v LEFT JOIN groups g ON v.group_id = g.id JOIN sessions s ON v.session_id = s.id WHERE v.session_id = ANY($1) ORDER BY v.created_at', [validIds]),
            pool.query('SELECT n.*, g.name as "groupName", s.title as session_title FROM next_steps n LEFT JOIN groups g ON n.group_id = g.id JOIN sessions s ON n.session_id = s.id WHERE n.session_id = ANY($1) ORDER BY n.created_at', [validIds]),
        ]);

        // Build per-session breakdown
        const sessionBreakdown = sessionsRes.rows.map(s => {
            const sid = s.id;
            return {
                id: sid,
                title: s.title,
                code: s.code,
                isTest: s.is_test,
                createdAt: s.created_at,
                groups: groupsRes.rows.filter(g => g.session_id === sid).length,
                responses: responsesRes.rows.filter(r => r.session_id === sid).length,
                votes: votesRes.rows.filter(v => v.session_id === sid).length,
                nextSteps: nextStepsRes.rows.filter(n => n.session_id === sid).length,
            };
        });

        res.json({
            success: true,
            aggregate: {
                sessionCount: sessionsRes.rows.length,
                sessions: sessionBreakdown,
                groups: [...new Set(groupsRes.rows.map(g => g.name))],
                responses: responsesRes.rows.map(r => ({
                    id: r.id,
                    sessionTitle: r.session_title,
                    groupName: r.groupName,
                    promptId: r.prompt_id,
                    text: r.text,
                    tags: r.tags || [],
                    created_at: r.created_at,
                })),
                votes: votesRes.rows.map(v => ({
                    id: v.id,
                    sessionTitle: v.session_title,
                    groupName: v.groupName,
                    answer: v.answer,
                    created_at: v.created_at,
                })),
                nextSteps: nextStepsRes.rows.map(n => ({
                    id: n.id,
                    sessionTitle: n.session_title,
                    groupName: n.groupName,
                    text: n.text,
                    tags: n.tags || [],
                    created_at: n.created_at,
                })),
            }
        });
    } catch (error) {
        console.error('Aggregate error:', error);
        res.status(500).json({ error: 'Failed to aggregate session data' });
    }
});

module.exports = router;
