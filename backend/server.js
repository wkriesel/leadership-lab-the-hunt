const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

let sessionState = {
    phase: 1,
    groups: [],
    responses: [], // Phase 1 & 2
    votes: [],     // Phase 3
    nextSteps: [], // Phase 4
    activeScenario: null, // Track currently pushed scenario
    responseFormat: 'multiple_choice', // 'multiple_choice' or 'open_ended'
};

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial state
    socket.emit('stateUpdate', sessionState);

    // Facilitator controls
    socket.on('setPhase', (phase) => {
        sessionState.phase = phase;
        io.emit('stateUpdate', sessionState);
    });

    socket.on('resetSession', () => {
        sessionState = {
            phase: 1,
            groups: [],
            responses: [],
            votes: [],
            nextSteps: [],
            activeScenario: null,
            responseFormat: 'multiple_choice',
        };
        io.emit('stateUpdate', sessionState);
    });

    // Participant actions
    socket.on('joinGroup', (groupName) => {
        if (!sessionState.groups.includes(groupName)) {
            sessionState.groups.push(groupName);
            io.emit('stateUpdate', sessionState);
        }
    });

    socket.on('submitResponse', (data) => {
        // Phase 1 submission (like, wish, wonder)
        sessionState.responses.push({
            id: Date.now().toString(),
            groupName: data.groupName,
            promptId: data.promptId,
            text: data.text,
            tags: [] // For phase 2
        });
        io.emit('stateUpdate', sessionState);
    });

    socket.on('tagResponse', (data) => {
        // Phase 2 tagging
        const response = sessionState.responses.find(r => r.id === data.id);
        if (response) {
            response.tags = data.tags; // ['technical', 'relational', 'both']
            io.emit('stateUpdate', sessionState);
        }
    });

    // Facilitator controls scenario
    socket.on('setScenario', (data) => {
        sessionState.activeScenario = data.scenario;
        sessionState.responseFormat = data.format;
        sessionState.votes = []; // Clear votes when a new scenario is pushed
        io.emit('stateUpdate', sessionState);
    });

    socket.on('submitVote', (data) => {
        // Phase 3 scenario responses
        const existingVote = sessionState.votes.find(v => v.groupName === data.groupName);
        if (existingVote) {
            existingVote.answer = data.answer; // Holds A/B/C/D or text
        } else {
            sessionState.votes.push({
                groupName: data.groupName,
                answer: data.answer
            });
        }
        io.emit('stateUpdate', sessionState);
    });

    socket.on('submitNextStep', (data) => {
        // Phase 4 submission
        sessionState.nextSteps.push({
            id: Date.now().toString(),
            groupName: data.groupName,
            text: data.text,
            tags: data.tags || []
        });
        io.emit('stateUpdate', sessionState);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
