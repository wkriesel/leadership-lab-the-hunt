import React from 'react';
import { SocketProvider, useSocket } from './SocketContext';
import ParticipantView from './components/ParticipantView';
import FacilitatorView from './components/FacilitatorView';
import LoginPage from './pages/LoginPage';
import SessionDashboard from './pages/SessionDashboard';

function AppContent() {
  const { token, activeSessionId } = useSocket();
  const isFacilitator = window.location.pathname.startsWith('/facilitator');

  if (isFacilitator) {
    // Facilitator flow: Login → Dashboard → Session
    if (!token) return <LoginPage />;
    if (!activeSessionId) return <SessionDashboard />;
    return <FacilitatorView />;
  }

  // Participant flow: Join screen → Session
  return <ParticipantView />;
}

function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-[#F4E8D1] text-[#06402B] font-inter">
        <AppContent />
      </div>
    </SocketProvider>
  );
}

export default App;
