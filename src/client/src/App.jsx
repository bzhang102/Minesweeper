import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './Login';
import CreateAccount from './CreateAccount';
import './App.css';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create a wrapper component that has access to navigation
function AppContent() {
  const navigate = useNavigate();

  const handleLogin = async (username, password) => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      const data = await response.json();
      if (data.ok) {
        console.log('Login successful:', data);
        navigate('/dashboard'); // Redirect to the dashboard
      } else {
        console.error('Login failed:', data);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const handleCreateAccount = async (username, password) => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch('http://localhost:3000/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      const data = await response.json();
      if (data.ok) {
        console.log('Account created successfully:', data);
        navigate('/dashboard'); // Redirect to the dashboard
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
      <Route path="/dashboard" element={<h1>Welcome to the Game</h1>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;