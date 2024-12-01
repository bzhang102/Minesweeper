import { useState, useEffect } from "react";
import { Board } from "./components/tsx/Board";
import { Login } from "./components/tsx/Login";
import { io, Socket } from "socket.io-client";
import "./App.css";

// const SERVER_URL = "https://minesweeper-server-o2fa.onrender.com";
const SERVER_URL = "http://localhost:3000";

function App() {
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    if (username) {
      const newSocket = io(`${SERVER_URL}?username=${username}`);
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    }
  }, [username]);

  if (username && socket) {
    return (
      <div className="app-container">
        <div className="game-container">
          <h1 className="game-title">Co-op Minesweeper</h1>
          <Board uuid={username} socket={socket} />
        </div>
      </div>
    );
  } else {
    return <Login onSubmit={setUsername} />;
  }
}

export default App;
