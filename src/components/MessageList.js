import React, { useEffect, useRef } from 'react';

const MessageList = ({ messages, streamingMessage, otherStreaming }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, otherStreaming]);

  const renderMessage = (msg, isStreaming = false) => (
    <div className={`message ${isStreaming ? 'streaming' : ''}`}>
      <div className="message-speaker">{msg.speaker}</div>
      <div className="message-content">{msg.content}</div>
      {!isStreaming && (
        <div className="message-timestamp">
          {new Date(msg.timestamp).toLocaleTimeString()} 
          ({msg.duration.toFixed(1)}s)
        </div>
      )}
    </div>
  );

  return (
    <div className="chat-container">
      {messages.map((msg, idx) => (
        <div key={`msg-${idx}`}>
          {renderMessage(msg)}
        </div>
      ))}
      
      {Object.values(otherStreaming).map((msg, idx) => (
        <div key={`streaming-${idx}`}>
          {renderMessage(msg, true)}
        </div>
      ))}
      
      {streamingMessage && renderMessage(streamingMessage, true)}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;