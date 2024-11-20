import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { io, Socket } from "socket.io-client";
import Login from './Login';
import CreateAccount from './CreateAccount';
import { Board } from "./components/Board";
import './App.css';

const SERVER_URL = "https://minesweeper-server-o2fa.onrender.com";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

interface LoginResponse {
  ok: boolean;
  username?: string;
  [key: string]: any;
}

interface DashboardProps {
  username: string;
}

const Dashboard: React.FC<DashboardProps> = ({ username }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(`${SERVER_URL}?username=${username}`);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  if (!socket) {
    return <div>Connecting to game server...</div>;
  }

  return (
    <div className="app-container">
      <div className="game-container">
        <h1 className="game-title">Co-op Minesweeper</h1>
        <Board username={username} socket={socket} />
      </div>
    </div>
  );
};

function AppContent(): JSX.Element {
  const navigate = useNavigate();
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);

  const handleLogin = async (username: string, password: string): Promise<void> => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      const data: LoginResponse = await response.json();
      if (data.ok) {
        console.log('Login successful:', data);
        setAuthenticatedUser(username);
        navigate('/dashboard');
      } else {
        console.error('Login failed:', data);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const handleCreateAccount = async (username: string, password: string): Promise<void> => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch('http://localhost:3000/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      const data: LoginResponse = await response.json();
      if (data.ok) {
        console.log('Account created successfully:', data);
        setAuthenticatedUser(username);
        navigate('/dashboard');
      } else {
        console.error('Account creation failed:', data);
      }
    } catch (error) {
      console.error('Error during account creation:', error);
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/create-account" element={<CreateAccount onCreateAccount={handleCreateAccount} />} />
      <Route 
        path="/dashboard" 
        element={
          authenticatedUser ? 
            <Dashboard username={authenticatedUser} /> : 
            <Login onLogin={handleLogin} />
        } 
      />
      <Route path="/" element={<Login onLogin={handleLogin} />} />
    </Routes>
  );
}

function App(): JSX.Element {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;