// Login.tsx
import React, { useState, FormEvent } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await onLogin(username, password);
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container'>
      <div className='header'>
        <div className="text">Login</div>
        <div className="underline"></div>
      </div>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="input">
          <input
            type='text'
            placeholder='User name'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="input">
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="submit-container">
          <button 
            type="submit" 
            className="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <div className="switch-page">
        Don't have an account? <a href="/create-account">Create Account</a>
      </div>
    </div>
  );
};

export default Login;