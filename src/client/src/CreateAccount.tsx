import React, { useState, FormEvent } from 'react';
import './Login.css';

interface CreateAccountProps {
  onCreateAccount: (username: string, password: string) => Promise<void>;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ onCreateAccount }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="input">
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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