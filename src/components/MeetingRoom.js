import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import WebSocketManager from '../utils/websocket';
import API from '../utils/api';
import MessageList from './MessageList';
import DebugPanel from './DebugPanel';

const MeetingRoom = ({ meeting, onExit }) => {
  const { user } = useUser();
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [otherStreaming, setOtherStreaming] = useState({});
  const [serverStats, setServerStats] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  
  const wsManagerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Initialize WebSocket manager
    const handlers = {
      onStatusChange: setWsStatus,
      onDebugLog: addDebugLog,
      onStats: setServerStats,
      onMessageSent: (message) => {
        setMessages(prev => [...prev, message]);
      },
      onMessageReceived: (message) => {
        setMessages(prev => [...prev, message]);
        setOtherStreaming(prev => {
          const next = { ...prev };
          delete next[message.speaker];
          return next;
        });
      },
      onStreamingMessage: setStreamingMessage,
      onOtherStreaming: (message) => {
        setOtherStreaming(prev => ({
          ...prev,
          [message.speaker]: message
        }));
      },
      onHistoryReceived: (history) => {
        setMessages(history);
      }
    };

    wsManagerRef.current = new WebSocketManager(meeting.id, user, handlers);
    wsManagerRef.current.connect();

    // Cleanup on unmount
    return () => {
      wsManagerRef.current.disconnect();
    };
  }, [meeting.id, user]);

  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-49), { timestamp, message, type }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const messageToSend = currentMessage;
    setCurrentMessage('');
    await wsManagerRef.current.streamMessage(messageToSend);
  };

  const handleEndMeeting = async () => {
    try {
      await API.endMeeting(meeting.id, user);
      wsManagerRef.current.disconnect();
      onExit();
    } catch (error) {
      addDebugLog(`Failed to end meeting: ${error.message}`, 'error');
    }
  };

  // Set up ping interval
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsManagerRef.current && wsStatus === 'CONNECTED') {
        wsManagerRef.current.ping();
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [wsStatus]);

  return (
    <div className="teams-meeting">
      <div className="main-panel">
        <div className="meeting-header">
          <div className="meeting-info">
            <h2>{meeting.name}</h2>
            <div className="meeting-id-display">
              Meeting ID: {meeting.id}
            </div>
          </div>
          <div className="meeting-actions">
            <div className={`connection-status ${wsStatus.toLowerCase()}`}>
              {wsStatus}
            </div>
            {meeting.creator === user && (
              <button onClick={handleEndMeeting} className="end-meeting">
                End Meeting
              </button>
            )}
          </div>
        </div>

        <MessageList
          messages={messages}
          streamingMessage={streamingMessage}
          otherStreaming={otherStreaming}
        />

        <form onSubmit={handleSubmit} className="message-controls">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={wsStatus !== 'CONNECTED'}
          />
          <button type="submit" disabled={wsStatus !== 'CONNECTED' || !currentMessage.trim()}>
            Send
          </button>
        </form>
      </div>

      <DebugPanel
        wsStatus={wsStatus}
        serverStats={serverStats}
        debugLogs={debugLogs}
        startTime={startTimeRef.current}
      />
    </div>
  );
};

export default MeetingRoom;