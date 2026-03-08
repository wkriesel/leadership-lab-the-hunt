import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SocketContext = createContext();
const socket = io(API_URL);

export const SocketProvider = ({ children }) => {
    // Auth state
    const [token, setToken] = useState(localStorage.getItem('facilitatorToken') || null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('facilitatorUser') || 'null'));

    // Session state (from Socket.IO)
    const [session, setSession] = useState({
        phase: 1,
        groups: [],
        responses: [],
        votes: [],
        nextSteps: []
    });

    // Active session info
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [activeSessionCode, setActiveSessionCode] = useState(null);

    useEffect(() => {
        socket.on('stateUpdate', (newState) => {
            setSession(newState);
        });

        socket.on('error', (data) => {
            console.error('Socket error:', data.message);
        });

        return () => {
            socket.off('stateUpdate');
            socket.off('error');
        };
    }, []);

    // Auth helpers
    const login = useCallback(async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('facilitatorToken', data.token);
        localStorage.setItem('facilitatorUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
    }, []);

    const register = useCallback(async (email, password) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        localStorage.setItem('facilitatorToken', data.token);
        localStorage.setItem('facilitatorUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('facilitatorToken');
        localStorage.removeItem('facilitatorUser');
        setToken(null);
        setUser(null);
        setActiveSessionId(null);
        setActiveSessionCode(null);
    }, []);

    // Session API helpers
    const createSession = useCallback(async (title) => {
        const res = await fetch(`${API_URL}/api/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create session');
        return data.session;
    }, [token]);

    const listSessions = useCallback(async () => {
        const res = await fetch(`${API_URL}/api/sessions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to list sessions');
        return data.sessions;
    }, [token]);

    const getSessionQR = useCallback(async (sessionId) => {
        const res = await fetch(`${API_URL}/api/sessions/${sessionId}/qr`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get QR code');
        return data;
    }, []);

    const exportSession = useCallback(async (sessionId) => {
        const res = await fetch(`${API_URL}/api/sessions/${sessionId}/export`);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI-Explorer-Session-${new Date().toISOString().split('T')[0]}-${data.code || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    // Socket join helpers
    const facilitatorJoinSession = useCallback((sessionId, sessionCode) => {
        setActiveSessionId(sessionId);
        setActiveSessionCode(sessionCode);
        socket.emit('facilitatorJoinSession', { sessionId });
    }, []);

    const participantJoinSession = useCallback((sessionCode, groupName) => {
        setActiveSessionCode(sessionCode);
        socket.emit('joinSession', { sessionCode, groupName });
    }, []);

    return (
        <SocketContext.Provider value={{
            socket,
            session,
            // Auth
            token, user, login, register, logout,
            // Session management
            createSession, listSessions, getSessionQR, exportSession,
            // Active session
            activeSessionId, setActiveSessionId,
            activeSessionCode, setActiveSessionCode,
            // Socket join
            facilitatorJoinSession, participantJoinSession
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
