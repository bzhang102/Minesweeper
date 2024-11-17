import { useState, useEffect } from "react";
import { Board } from "./components/Board";
import "./App.css";
import { Login } from "./components/Login";
import { io, Socket } from "socket.io-client";

function App() {
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    if (username) {
      const newSocket = io(`http://localhost:3000?username=${username}`);
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
          <h1 className="game-title">Co-Op Minesweeper</h1>
          <Board username={username} socket={socket} />
        </div>
      </div>
    );
  } else {
    return <Login onSubmit={setUsername} />;
  }
}

export default App;
