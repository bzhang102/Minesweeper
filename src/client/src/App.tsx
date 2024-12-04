import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { config } from "./config";
import Login from "./components/tsx/Login";
import CreateAccount from "./components/tsx/CreateAccount";
import { JoinRoom } from "./components/tsx/JoinRoom";
import { Board } from "./components/tsx/Board";
import "./App.css";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function AppContent(): JSX.Element {
  const navigate = useNavigate();
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(
    null
  );
  const [gameRoom, setGameRoom] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const handleLogin = async (
    username: string,
    password: string
  ): Promise<void> => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch(`${config.SERVER_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      const data = await response.json();
      if (data.ok) {
        // Store authentication state
        localStorage.setItem("authUser", username);
        setAuthenticatedUser(username);
        navigate("/join-room");
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  };

  const handleCreateAccount = async (
    username: string,
    password: string
  ): Promise<void> => {
    try {
      const hashedPassword = await hashPassword(password);
      const response = await fetch(`${config.SERVER_URL}/create-account`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      const data = await response.json();

      if (response.status === 201 && data.ok) {
        await handleLogin(username, password);
      } else {
        throw new Error(data.error || "Account creation failed.");
      }
    } catch (error) {
      console.error("Error during account creation:", error);
      throw error;
    }
  };

  const handleJoinRoom = (room: string) => {
    setGameRoom(room);
    const newSocket = io(`${config.SERVER_URL}`, {
      withCredentials: true,
      query: {
        username: authenticatedUser,
        room: room,
      },
    });
    setSocket(newSocket);
    navigate("/game");
  };
  const handleLogout = async () => {
    console.log("here")
    try {
        const response = await fetch(`${config.SERVER_URL}/logout`, {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
            console.log(data.message); // Optional: log the server message
            setAuthenticatedUser(null); // Clear user state
            localStorage.removeItem("authUser"); // Clear local storage
            navigate("/login"); // Redirect to login page
        } else {
            console.error("Logout failed:", data.error || "Unknown error");
        }
    } catch (error) {
        console.error("Error during logout:", error);
    }
  };
  useEffect(() => {
    const sendAuthRequest = async () =>{
    // Check if user is authenticated from localStorage
      const response = await fetch(`${config.SERVER_URL}/cookie`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log(data)

      if (response.status === 200) {
          console.log("HERE")
          setAuthenticatedUser(data.name)
          if (
            window.location.pathname === "/login" ||
            window.location.pathname === "/create-account" ||
            window.location.pathname === "/"
          ) {
            navigate("/join-room");
          }        
      } else {
        setAuthenticatedUser(null)
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/create-account"
        ) {
          navigate("/login");
        }
      }
    }
    sendAuthRequest()
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/create-account"
        element={<CreateAccount onCreateAccount={handleCreateAccount} />}
      />
      <Route
        path="/join-room"
        element={
          <JoinRoom
            username={authenticatedUser || "Guest"}
            onSubmit={handleJoinRoom}
            onLogout = {handleLogout}
          />
        }
      />
      <Route
        path="/game"
        element={
          gameRoom && socket ? (
            <div className="app-container">
              <div className="game-container">
                <div className="game-header">
                  <h1 className="game-title">Co-op Minesweeper</h1>
                </div>
                <Board
                  username={authenticatedUser || "Guest"}
                  socket={socket}
                  room={gameRoom}
                />
              </div>
            </div>
          ) : (
            <div>Please join a room to start playing.</div>
          )
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
