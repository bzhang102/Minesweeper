import { useEffect, useState, useRef, useCallback } from "react";
import { add, min, set, throttle } from "lodash";
import { Cursor } from "./Cursor";
import { Cell } from "./Cell";
import { GameState, Coord, BoardProps, Users } from "../types/clientTypes";
import "./Board.css";

const INITIAL_GAME_STATE: GameState = {
  board: [],
  status: 0,
  flagsLeft: 40,
  elapsedTime: 0
};

const THROTTLE_MS = 50;

export function Board({ username, socket }: BoardProps) {
  const [users, setUsers] = useState<Users>({});
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const boardRef = useRef<HTMLDivElement>(null);
  const [timer, setTimer] = useState("00:00:00");

  const formatTime = (seconds: number): void => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds / 60) % 60);
    const secondss = seconds % 60;
    setTimer(
      `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${secondss.toString().padStart(2, "0")}`
    );
  }

  const updateBestTime = useCallback(async () => {
    // Only update if game is won and there are other players
    if (gameState.status === 1 && Object.keys(users).length > 1) {
      const partners = Object.values(users)
        .filter(user => user.username !== username)
        .map(user => user.username);

      try {
        const response = await fetch('http://localhost:3000/update-best-time', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            solveTime: gameState.elapsedTime,
            partners
          })
        });

        const result = await response.json();
        console.log('Best time update result:', result);
      } catch (error) {
        console.error('Error updating best time:', error);
      }
    }
  }, [gameState, users, username]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Game State:", gameState);
      formatTime(gameState.elapsedTime);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [gameState.elapsedTime]);

  useEffect(() => {
    // Check if the game is won and update best time
    if (gameState.status === 1) {
      updateBestTime();
    }
  }, [gameState.status, updateBestTime]);

  const handleGameState = useCallback((newState: GameState) => {
    setGameState(newState);
    formatTime(newState.elapsedTime);
  }, []);

  const handleUsersUpdate = useCallback((newUserData: Users) => {
    setUsers(newUserData);
  }, []);

  // throttle mouse movement
  const updatePositionThrottled = useRef(
    throttle(
      (position: object) => socket.emit("cursor_movement", position),
      THROTTLE_MS
    )
  ).current;

  // Mouse movement handler
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      updatePositionThrottled({
        x,
        y,
      });
    },
    [updatePositionThrottled]
  );

  // Game action handlers
  const handleLeftClick = useCallback(
    (coord: Coord) => {
      socket.emit("click", coord);
    },
    [socket]
  );

  const handleRightClick = useCallback(
    (coord: Coord) => {
      socket.emit("flag", coord);
    },
    [socket]
  );

  const handleReset = useCallback(() => {
    socket.emit("reset");
  }, [socket]);

  // Socket connection setup
  useEffect(() => {
    socket.on("connect", () => console.log("Connected to server!"));
    socket.on("connect_error", (error: any) =>
      console.log("Connection error:", error)
    );

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket]);

  // Game state and users setup
  useEffect(() => {
    socket.on("gameState", handleGameState);
    socket.on("users", handleUsersUpdate);

    return () => {
      socket.off("gameState");
      socket.off("users");
    };
  }, [socket, handleGameState, handleUsersUpdate]);

  // Mouse movement setup - now using window event listener
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Render cursors for other users
  const renderCursors = useCallback(() => {
    return Object.entries(users).map(([uuid, user]) => {
      if (user.username === username) return null;
      return <Cursor key={uuid} point={[user.state.x, user.state.y]} />;
    });
  }, [users, username]);

  return (
    <div className="board-container">
      <div className="game-controls">
        <div className="flags-counter">🚩 {gameState.flagsLeft}</div>
        <div className="game-timer">{timer}</div>
        <button className="reset-button" onClick={handleReset}>
          New Game
        </button>
      </div>

      <div ref={boardRef} className="game-board">
        {gameState.board.map((row, y) =>
          row.map((cell, x) => (
            <Cell
              key={`${x}-${y}`}
              data={cell}
              coord={{ x, y }}
              onLeftClick={handleLeftClick}
              onRightClick={handleRightClick}
            />
          ))
        )}

        {gameState.status !== 0 && (
          <div
            className={`game-status ${gameState.status === 1 ? "won" : "lost"}`}
          >
            {gameState.status === 1 ? "You Won! 🎉" : "Game Over! 💥"}
          </div>
        )}

        <div className="cursors-container">{renderCursors()}</div>
      </div>
    </div>
  );
}