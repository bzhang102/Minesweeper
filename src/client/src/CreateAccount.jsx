import React, { useState } from 'react';
import './Login.css';

const CreateAccount = ({ onCreateAccount }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await onCreateAccount(username, password);
    } catch (error) {
      setError('Account creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container'>
      <div className='header'>
        <div className="text">Create Account</div>
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
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>
      </form>
      <div className="switch-page">
        Already have an account? <a href="/login">Login</a>
      </div>
    </div>
  );
};

export default CreateAccount;
