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

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    navigate("/login");
  };
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

  useEffect(() => {
    // Check if user is authenticated from localStorage
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      setAuthenticatedUser(authUser);
      if (
        window.location.pathname === "/login" ||
        window.location.pathname === "/create-account" ||
        window.location.pathname === "/"
      ) {
        navigate("/join-room");
      }
    } else {
      setAuthenticatedUser(null);
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/create-account"
      ) {
        navigate("/login");
      }
    }
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
          authenticatedUser ? (
            <JoinRoom
              username={authenticatedUser}
              onSubmit={handleJoinRoom}
              onLogout={handleLogout}
            />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/game"
        element={
          authenticatedUser && gameRoom && socket ? (
            <div className="app-container">
              <Board
                username={authenticatedUser}
                socket={socket}
                room={gameRoom}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            <Login onLogin={handleLogin} />
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
      <div className="banner">
        <p className="banner-text">
          Built with ❤️ by bored friends who wanted to do something fun together
          <a
            href="https://github.com/bzhang102/Minesweeper"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#fff", textDecoration: "none" }}
          >
            &nbsp;&nbsp;📖 View on GitHub
          </a>
        </p>
      </div>
    </Router>
  );
}

export default App;
