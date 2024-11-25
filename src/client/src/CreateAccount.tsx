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

  const validateInputs = (): boolean => {
    // Username validation
    // if (username.length < 5) {
    //   setError('Username must be at least 5 characters long.');
    //   return false;
    // }

    // // Password validation
    // if (password.length < 8) {
    //   setError('Password must be at least 8 characters long.');
    //   return false;
    // }
    // if (!/[A-Z]/.test(password)) {
    //   setError('Password must contain at least one uppercase letter.');
    //   return false;
    // }
    // if (!/[a-z]/.test(password)) {
    //   setError('Password must contain at least one lowercase letter.');
    //   return false;
    // }
    // if (!/[0-9]/.test(password)) {
    //   setError('Password must contain at least one digit.');
    //   return false;
    // }
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //   setError('Password must contain at least one special character.');
    //   return false;
    // }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Input validation
    if (!validateInputs()) {
      setIsLoading(false);
      return;
    }

    try {
      await onCreateAccount(username, password);
    } catch (error) {
      if (error instanceof Error) {
        console.log("KJNEKJNKJN")
        console.log(error.message)
        setError(error.message);
      }
      else{
      setError('Account creation failed. Please try again.');
      }
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
