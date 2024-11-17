import { useState } from "react";
import { Board } from "./components/Board";
import "./App.css";
import { Login } from "./components/Login";
import { io } from "socket.io-client";

function App() {
  const [username, setUsername] = useState("");

  if (username) {
    return (
      <div className="app-container">
        <div className="game-container">
          <h1 className="game-title">Co-Op Minesweeper</h1>
          <Board
            username={username}
            socket={io(`http://localhost:3000?username=${username}`)}
          />
        </div>
      </div>
    );
  } else {
    return <Login onSubmit={setUsername} />;
  }
}

export default App;
