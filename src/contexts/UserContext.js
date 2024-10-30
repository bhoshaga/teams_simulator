import { createContext, useContext, useState, useCallback } from 'react';
import API from '../utils/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback(async (username) => {
    try {
      const response = await API.login(username);
      if (response.status === 'success') {
        setUser(username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      try {
        await API.logout(user);
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        setUser(null);
      }
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}