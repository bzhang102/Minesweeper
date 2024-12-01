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
    );
  } else {
    return <Login onSubmit={handleLogin} />;
  }
}

export default App;
