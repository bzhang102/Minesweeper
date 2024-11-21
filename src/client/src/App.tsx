import { useState, useEffect } from "react";
import { Board } from "./components/Board";
import "./App.css";
import { WelcomePage } from "./components/WelcomePage";
import { io, Socket } from "socket.io-client";

/* const SERVER_URL = "https://minesweeper-server-o2fa.onrender.com"; */
const SERVER_URL = "http://localhost:3000";

function App() {
  const [room, setRoom] = useState("");
  const [uuid, setUUID] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    if (room) {
      const newSocket = io(`${SERVER_URL}?room=${room}`);
      newSocket.on("uuid", (uuid) => setUUID(uuid));
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [room]);

  if (room && socket) {
    return (
      <div className="app-container">
        <div className="game-container">
          <h1 className="game-title">Co-op Minesweeper</h1>
          <h1>Room: {room}</h1>
          <Board socket={socket} uuid={uuid} />
        </div>
      </div>
    );
  } else {
    return <WelcomePage setRoom={setRoom} />;
  }
}

export default App;
