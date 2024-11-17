import { useEffect, useState, useRef } from "react";
import { Cursor } from "./Cursor";
import throttle from "lodash.throttle";
import type { GameState, Coord } from "../types/game";
import { Cell } from "./Cell";
import "./Board.css";

/* const socket = io("https://minesweeper-server-o2fa.onrender.com"); */
// const socket = io("http://localhost:3000");

export function Board({ username, socket }: { username: string; socket: any }) {
  const [users, setUsers] = useState<any>({}); // Step 1: State for users
  useEffect(() => {
    socket.on("users", (new_user_data: any) => {
      setUsers(new_user_data); // Update users state on receiving new data
    });

    return () => {
      socket.off("users");
    };
  }, [socket]);

  const renderCursors = (users: any) => {
    console.log("Am trying to render cursors");
    return Object.keys(users).map((uuid) => {
      const user = users[uuid];
      if (user.username === username) return;
      return (
        <Cursor key={uuid} userId={uuid} point={[user.state.x, user.state.y]} />
      );
    });
  };
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    status: 0,
    flagsLeft: 10,
  });

  const updatePosition = (position: object) => {
    socket.emit("cursor_movement", position);
  };

  socket.on("connect", () => {
    console.log("Connected to server!");
  });
  socket.on("connect_error", (error: any) => {
    console.log("Connection error:", error);
  });

  const THROTTLE: number = 50;
  const updatePositionThrottled = useRef(throttle(updatePosition, THROTTLE));

  useEffect(() => {
    socket.on("gameState", (newState: GameState) => {
      setGameState(newState);
    });

    return () => {
      socket.off("gameState");
    };
  }, []);

  useEffect(() => {
    updatePosition({ x: 0, y: 0 });
    window.addEventListener("mousemove", (e) => {
      updatePositionThrottled.current({
        x: e.clientX,
        y: e.clientY,
      });
    });
  }, []);

  const handleLeftClick = (coord: Coord) => {
    socket.emit("click", coord);
  };

  const handleRightClick = (coord: Coord) => {
    socket.emit("flag", coord);
  };

  const handleReset = () => {
    socket.emit("reset");
  };

  return (
    <div className="board-container">
      <div className="game-controls">
        <div className="flags-counter">🚩 {gameState.flagsLeft}</div>
        <button className="reset-button" onClick={handleReset}>
          New Game
        </button>
      </div>

      <div className="game-board">
        {gameState.board.map((row, y) =>
          row.map((cell, x) => (
            <Cell
              key={`${x}-${y}`}
              data={cell}
              coord={{ x, y }}
              onLeftClick={handleLeftClick}
              onRightClick={handleRightClick}
            />
          )),
        )}
      </div>

      {gameState.status !== 0 && (
        <div
          className={`game-status ${gameState.status === 1 ? "won" : "lost"}`}
        >
          {gameState.status === 1 ? "You Won! 🎉" : "Game Over! 💥"}
        </div>
      )}
      <div className="cursors-container">
        {renderCursors(users)} {/* This will run whenever users changes */}
      </div>
    </div>
  );
}
