import React, { useState } from 'react';
import { SocketProvider } from './SocketContext';
import ParticipantView from './components/ParticipantView';
import FacilitatorView from './components/FacilitatorView';

function App() {
  const isFacilitator = window.location.pathname === '/facilitator';

  return (
    <SocketProvider>
      <div className="min-h-screen bg-[#F4E8D1] text-[#06402B] font-inter">
        {isFacilitator ? <FacilitatorView /> : <ParticipantView />}
      </div>
    </SocketProvider>
  );
}

export default App;
