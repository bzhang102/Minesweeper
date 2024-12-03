import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { io, Socket } from "socket.io-client";
import { config } from "./config";
import Login from './components/tsx/Login';
import CreateAccount from './components/tsx/CreateAccount';
import { JoinRoom } from './components/tsx/JoinRoom';
import { Board } from "./components/tsx/Board";
import './App.css';

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

function AppContent(): JSX.Element {
  const navigate = useNavigate();
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [gameRoom, setGameRoom] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const handleLogin = async (username: string, password: string): Promise<void> => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch(`${config.SERVER_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      const data: LoginResponse = await response.json();
      if (data.ok) {
        setAuthenticatedUser(username);
        navigate('/join-room');
      } else {
        throw new Error(data.error || 'The username or password is incorrect, please try again');
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const handleCreateAccount = async (username: string, password: string): Promise<void> => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch(`${config.SERVER_URL}/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword }),
      });
  
      if (response.status === 201) {
        setAuthenticatedUser(username);
        navigate('/join-room');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Account creation failed.');
      }
    } catch (error) {
      console.error('Error during account creation:', error);
      throw error;
    }
  };

  const handleJoinRoom = (room: string) => {
    setGameRoom(room);
    const newSocket = io(`${config.SERVER_URL}?username=${authenticatedUser}&room=${room}`);
    setSocket(newSocket);
    navigate('/game');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/create-account" element={<CreateAccount onCreateAccount={handleCreateAccount} />} />
      <Route 
        path="/join-room" 
        element={
          authenticatedUser ? 
            <JoinRoom 
              username={authenticatedUser} 
              onSubmit={handleJoinRoom} 
            /> : 
            <Login onLogin={handleLogin} />
        } 
      />
      <Route 
        path="/game" 
        element={
          authenticatedUser && gameRoom && socket ? 
            <div className="app-container">
              <div className="game-container">
                <h1 className="game-title">Co-op Minesweeper</h1>
                <Board username={authenticatedUser} socket={socket} room={gameRoom} />
              </div>
            </div> : 
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