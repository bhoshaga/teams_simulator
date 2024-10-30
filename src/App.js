import React, { useState } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import Login from './components/Login';
import MeetingSelector from './components/MeetingSelector';
import MeetingRoom from './components/MeetingRoom';
import './App.css';

function AppContent() {
  const { user } = useUser();
  const [currentMeeting, setCurrentMeeting] = useState(null);

  if (!user) {
    return <Login />;
  }

  if (!currentMeeting) {
    return <MeetingSelector onMeetingSelect={setCurrentMeeting} />;
  }

  return (
    <MeetingRoom 
      meeting={currentMeeting} 
      onExit={() => setCurrentMeeting(null)} 
    />
  );
}

function App() {
  return (
    <UserProvider>
      <div className="app-container">
        <AppContent />
      </div>
    </UserProvider>
  );
}

export default App;