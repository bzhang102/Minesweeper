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
    localStorage.removeItem("isGuest");
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

  const handleGuestLogin = async (): Promise<void> => {
    try {
      console.log(
        "Attempting guest login to:",
        `${config.SERVER_URL}/guest-login`
      );

      const response = await fetch(`${config.SERVER_URL}/guest-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", response.status, errorText);

        if (response.status === 404) {
          throw new Error(
            "Guest login endpoint not found. Please ensure the server is running and updated."
          );
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(`Request failed: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("Guest login response data:", data);

      if (data.ok) {
        // Store guest authentication state
        localStorage.setItem("authUser", data.username);
        localStorage.setItem("isGuest", "true");
        setAuthenticatedUser(data.username);
        navigate("/join-room");
      } else {
        throw new Error(data.error || "Guest login failed");
      }
    } catch (error) {
      console.error("Error during guest login:", error);

      // Fallback: generate guest username locally if server is unavailable
      if (
        error instanceof Error &&
        (error.message.includes("JSON") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.log("Server unavailable, using local guest login fallback");
        const guestId = Math.random().toString(36).substring(2, 8);
        const guestUsername = `Guest_${guestId}`;

        // Store guest authentication state
        localStorage.setItem("authUser", guestUsername);
        localStorage.setItem("isGuest", "true");
        setAuthenticatedUser(guestUsername);
        navigate("/join-room");
        return;
      }

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
      <Route
        path="/login"
        element={
          <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
        }
      />
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
            <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
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
            <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
          )
        }
      />
      <Route
        path="/"
        element={
          <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
        }
      />
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
