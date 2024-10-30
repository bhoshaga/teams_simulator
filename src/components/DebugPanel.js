import React from 'react';

const DebugPanel = ({ wsStatus, serverStats, debugLogs, startTime }) => {
  const getDuration = () => {
    return ((Date.now() - startTime) / 1000).toFixed(0);
  };

  return (
    <div className="debug-panel">
      <h3>Debug Information</h3>
      <div className="debug-stats">
        <div>Status: <span className={wsStatus.toLowerCase()}>{wsStatus}</span></div>
        {serverStats && (
          <>
            <div>Participants: {serverStats.participant_count}</div>
            <div>Messages: {serverStats.message_count}</div>
            <div>Duration: {getDuration()}s</div>
            <div>Teams Connections: {serverStats.teams_connections}</div>
            <div>Transcript Connections: {serverStats.transcript_connections}</div>
          </>
        )}
      </div>

      <div className="debug-logs">
        {debugLogs.map((log, idx) => (
          <div key={idx} className={`log-entry ${log.type}`}>
            <span className="log-timestamp">{log.timestamp}</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugPanel;