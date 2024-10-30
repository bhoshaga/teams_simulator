const WS_BASE = process.env.REACT_APP_ENV === 'production'
  ? 'wss://api.stru.ai/ws/meetings'
  : 'ws://localhost:8000/ws/meetings';

class WebSocketManager {
  constructor(meetingId, username, handlers) {
    this.meetingId = meetingId;
    this.username = username;
    this.handlers = handlers;
    this.ws = null;
    this.startTime = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // Start with 2 seconds
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(`${WS_BASE}/${this.meetingId}/teams?user=${this.username}`);
      this.startTime = Date.now();
      this.setupEventListeners();
      this.handlers.onDebugLog('Connecting to WebSocket...', 'info');
    } catch (error) {
      this.handlers.onDebugLog(`WebSocket connection error: ${error.message}`, 'error');
      this.attemptReconnect();
    }
  }

  setupEventListeners() {
    this.ws.onopen = () => {
      this.handlers.onStatusChange('CONNECTED');
      this.handlers.onDebugLog('Connected to meeting', 'success');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.reconnectDelay = 2000; // Reset delay
    };

    this.ws.onclose = (event) => {
      this.handlers.onStatusChange('DISCONNECTED');
      this.handlers.onDebugLog(`Disconnected from meeting. Code: ${event.code}`, 'error');
      
      if (event.code !== 1000) { // 1000 is normal closure
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.handlers.onStatusChange('ERROR');
      this.handlers.onDebugLog(`WebSocket error: ${error.message}`, 'error');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingMessage(data);
      } catch (error) {
        this.handlers.onDebugLog(`Failed to parse message: ${error.message}`, 'error');
      }
    };
  }

  handleIncomingMessage(data) {
    switch (data.type) {
      case 'status':
        this.handlers.onStats(data.data);
        break;
      case 'error':
        this.handlers.onDebugLog(`Server error: ${data.data}`, 'error');
        break;
      case 'stream':
        // Handle incoming stream messages from other participants
        if (data.data?.message && data.data.message.speaker !== this.username) {
          if (data.data.message.isComplete) {
            this.handlers.onMessageReceived(data.data.message);
          } else {
            this.handlers.onOtherStreaming(data.data.message);
          }
        }
        break;
      case 'history':
        this.handlers.onHistoryReceived(data.data);
        break;
      default:
        this.handlers.onDebugLog(`Unknown message type: ${data.type}`, 'warning');
    }
  }

  async streamMessage(message) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.handlers.onDebugLog('Cannot send message - not connected', 'error');
      return;
    }

    const words = message.split(' ');
    let streamedContent = '';
    let startTime = Date.now();
    
    this.handlers.onStreamingMessage({ 
      speaker: this.username, 
      content: '',
      timestamp: new Date().toISOString(),
      duration: 0
    });

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      streamedContent += (i === 0 ? '' : ' ') + word;
      
      const streamData = {
        type: 'stream',
        speaker: this.username,
        content: streamedContent,
        timestamp: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000,
        isComplete: false
      };

      try {
        this.ws.send(JSON.stringify(streamData));
        this.handlers.onStreamingMessage({
          speaker: this.username,
          content: streamedContent,
          timestamp: streamData.timestamp,
          duration: streamData.duration
        });

        // Variable delay to simulate natural speaking
        const delay = this.calculateDelay(word);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        this.handlers.onDebugLog(`Failed to send stream: ${error.message}`, 'error');
        break;
      }
    }

    // Send final message
    try {
      const finalMessage = {
        type: 'stream',
        speaker: this.username,
        content: streamedContent,
        timestamp: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000,
        isComplete: true
      };

      this.ws.send(JSON.stringify(finalMessage));
      this.handlers.onMessageSent(finalMessage);
      this.handlers.onStreamingMessage(null);
      this.handlers.onDebugLog('Message sent successfully', 'success');
    } catch (error) {
      this.handlers.onDebugLog(`Failed to send final message: ${error.message}`, 'error');
    }
  }

  calculateDelay(word) {
    // Calculate dynamic delay based on word length and punctuation
    const baseDelay = 200;
    const perCharacterDelay = 10;
    const punctuationDelay = 400;

    let delay = baseDelay + (word.length * perCharacterDelay);
    
    // Add extra delay for punctuation
    if (/[.,!?]$/.test(word)) {
      delay += punctuationDelay;
    }

    // Add some randomness
    delay += Math.random() * 100;

    return delay;
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handlers.onDebugLog('Max reconnection attempts reached', 'error');
      return;
    }

    this.handlers.onDebugLog(
      `Attempting to reconnect in ${this.reconnectDelay/1000} seconds...`, 
      'warning'
    );

    setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay *= 1.5; // Exponential backoff
      this.connect();
    }, this.reconnectDelay);
  }

  ping() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000); // Normal closure
      this.ws = null;
      this.startTime = null;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 2000;
    }
  }
}

export default WebSocketManager;