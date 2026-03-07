import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();
const socket = io('http://localhost:3001');

export const SocketProvider = ({ children }) => {
    const [session, setSession] = useState({
        phase: 1,
        groups: [],
        responses: [],
        votes: [],
        nextSteps: []
    });

    useEffect(() => {
        socket.on('stateUpdate', (newState) => {
            setSession(newState);
        });

        return () => {
            socket.off('stateUpdate');
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, session }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
