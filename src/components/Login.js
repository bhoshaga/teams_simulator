import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const Login = () => {
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (username) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await login(username);
      if (!success) {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="teams-login">
      <h1>Teams Meeting Simulator</h1>
      <div className="login-container">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="user-buttons">
          <button 
            onClick={() => handleLogin('bhoshaga')} 
            disabled={isLoading}
          >
            Login as Bhoshaga
          </button>
          <button 
            onClick={() => handleLogin('garrett')} 
            disabled={isLoading}
          >
            Login as Garrett
          </button>
        </div>
        {isLoading && <div className="loading">Logging in...</div>}
      </div>
    </div>
  );
};

export default Login;