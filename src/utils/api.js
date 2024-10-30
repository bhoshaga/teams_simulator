const BASE_URL = 'https://api.stru.ai'

const API = {
  login: async (username) => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  // ... rest of the API methods remain the same but use BASE_URL without /v2
  logout: async (username) => {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },

  getUserMeetings: async (username) => {
    const response = await fetch(`${BASE_URL}/api/meetings/user`, {
      headers: {
        'X-Username': username,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch meetings');
    return response.json();
  },

  createMeeting: async (name, creator) => {
    const response = await fetch(`${BASE_URL}/api/meetings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Username': creator,
      },
      body: JSON.stringify({ name, creator }),
    });
    if (!response.ok) throw new Error('Failed to create meeting');
    return response.json();
  },

  endMeeting: async (meetingId, username) => {
    const response = await fetch(`${BASE_URL}/api/meetings/${meetingId}/end`, {
      method: 'POST',
      headers: {
        'X-Username': username,
      },
    });
    if (!response.ok) throw new Error('Failed to end meeting');
    return response.json();
  },
};

export default API;