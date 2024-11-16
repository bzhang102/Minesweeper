import { useState } from 'react'
import './App.css'
import Login from './Login'

function App() {
  const handleLogin = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Handle successful login
        console.log('Login successful:', data);
        // You can add additional logic here (e.g., storing token, redirecting)
      } else {
        // Handle login error
        console.error('Login failed:', data);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <>
      <Login onLogin={handleLogin} />
    </>
  );
}

export default App;