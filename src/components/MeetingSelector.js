import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import API from '../utils/api';

const MeetingSelector = ({ onMeetingSelect }) => {
  const { user, logout } = useUser();
  const [userMeetings, setUserMeetings] = useState([]);
  const [newMeetingName, setNewMeetingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUserMeetings = async () => {
    try {
      setIsLoading(true);
      const meetings = await API.getUserMeetings(user);
      setUserMeetings(meetings);
      setError(null);
    } catch (error) {
      setError('Failed to load meetings');
      console.error('Error loading meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserMeetings();
    // Set up periodic refresh
    const refreshInterval = setInterval(loadUserMeetings, 10000);
    return () => clearInterval(refreshInterval);
  }, [user]);

  const createMeeting = async () => {
    if (!newMeetingName.trim()) return;
    
    try {
      setIsLoading(true);
      const { meeting_id } = await API.createMeeting(newMeetingName, user);
      const newMeeting = { id: meeting_id, name: newMeetingName };
      setNewMeetingName('');
      await loadUserMeetings();
      onMeetingSelect(newMeeting);
    } catch (error) {
      setError('Failed to create meeting');
      console.error('Error creating meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="teams-meeting-selector">
      <div className="user-info">
        <h1>Teams Meeting Simulator</h1>
        <div>
          <span>Logged in as {user}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="meeting-controls">
        <div className="create-meeting">
          <h3>Create New Meeting</h3>
          <div className="input-group">
            <input
              type="text"
              value={newMeetingName}
              onChange={(e) => setNewMeetingName(e.target.value)}
              placeholder="Meeting name"
              disabled={isLoading}
            />
            <button onClick={createMeeting} disabled={isLoading || !newMeetingName.trim()}>
              Create Meeting
            </button>
          </div>
        </div>
      </div>

      <div className="meetings-list">
        <h3>Your Meetings</h3>
        {isLoading && <div className="loading">Loading...</div>}
        {!isLoading && userMeetings.length === 0 && (
          <div className="no-meetings">No meetings found</div>
        )}
        {userMeetings.map((meeting) => (
          <div key={meeting.id} className="meeting-item">
            <div className="meeting-info">
              <h4>{meeting.name}</h4>
              <div className="meeting-details">
                <span className="meeting-id">ID: {meeting.id}</span>
                <span className="meeting-creator">Created by: {meeting.creator}</span>
                <span className={`meeting-status ${meeting.is_active ? 'active' : 'ended'}`}>
                  {meeting.is_active ? 'Active' : 'Ended'}
                </span>
              </div>
            </div>
            {meeting.is_active && (
              <button onClick={() => onMeetingSelect(meeting)}>
                Join Meeting
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingSelector;