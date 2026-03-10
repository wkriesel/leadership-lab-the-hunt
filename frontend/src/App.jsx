import React, { useState } from 'react';
import { SocketProvider, useSocket } from './SocketContext';
import ParticipantView from './components/ParticipantView';
import FacilitatorView from './components/FacilitatorView';
import LoginPage from './pages/LoginPage';
import SessionDashboard from './pages/SessionDashboard';
import ExpeditionOverview from './components/ExpeditionOverview';

function AppContent() {
  const { token, activeSessionId } = useSocket();
  const [showOverview, setShowOverview] = useState(false);
  const isFacilitator = window.location.pathname.startsWith('/facilitator');

  if (isFacilitator) {
    // Facilitator flow: Login → Dashboard → Overview/Session
    if (!token) return <LoginPage />;
    if (showOverview && !activeSessionId) return <ExpeditionOverview onBack={() => setShowOverview(false)} />;
    if (!activeSessionId) return <SessionDashboard onShowOverview={() => setShowOverview(true)} />;
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
