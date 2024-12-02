import { useState, useEffect } from "react";
import { Board } from "./components/tsx/Board";
import "./App.css";
import { Login } from "./components/tsx/Login";
import { io, Socket } from "socket.io-client";

// const SERVER_URL = "https://minesweeper-server-o2fa.onrender.com";
const SERVER_URL = "localhost:3000";

function App() {
  const [username, setUsername] = useState("Anonymous");
  const [room, setRoom] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const handleLogin = (newUsername: string, newRoom: string) => {
    setUsername(newUsername);
    setRoom(newRoom);
  };

  useEffect(() => {
    if (username && room) {
      const newSocket = io(`${SERVER_URL}?username=${username}&room=${room}`);
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    }
  }, [username, room]);

  if (username && room && socket) {
    return (
      <div className="app-container">
        <div className="game-container">
          <h1 className="game-title">Co-op Minesweeper</h1>
          <Board username={username} socket={socket} room={room} />
        </div>
      </div>
<<<<<<< HEAD
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
        throw new Error(data.error || 'The username or password is incorrect, please try again');
      }
    } catch (error) {
      console.error('Error during login:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Account creation failed.');
      }
    }
  };

  const handleCreateAccount = async (username: string, password: string): Promise<void> => {
    console.log("REQUEST SENT");
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch('http://localhost:3000/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword }),
      });
  
      // Check if the response was successful
      if (response.status === 201) {
        console.log('Account created successfully:');
        setAuthenticatedUser(username);
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        console.log(errorData)
        console.error('Account creation failed:', errorData.error || 'Unknown error');
        throw new Error(errorData.error || 'Account creation failed.');
      }
    } catch (error) {
      console.error('Error during account creation:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Account creation failed.');
      }    }
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
=======
    );
  } else {
    return <Login onSubmit={handleLogin} />;
  }
>>>>>>> 00fe8c90c064ddf773f576d35c44218083c76bec
}

export default App;
