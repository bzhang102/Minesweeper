import { useEffect, useState, useRef, useCallback } from "react";
import { throttle } from "lodash";
import { Cursor } from "./Cursor";
import { Cell } from "./Cell";
import { GameState, Coord, BoardProps, Users } from "../types/clientTypes";
import "./Board.css";

const INITIAL_GAME_STATE: GameState = {
  board: [],
  status: 0,
  flagsLeft: 40,
};

const THROTTLE_MS = 50;

export function Board({ username, socket }: BoardProps) {
  const [users, setUsers] = useState<Users>({});
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [timer, setTimer] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format timer to MM:SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Submit best time to server
  const submitBestTime = useCallback(() => {
    if (timer === 0) return;

    const partners = Object.entries(users)
      .filter(([_, user]) => user.username !== username)
      .map(([_, user]) => user.username);

    fetch('/update-best-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        solveTime: timer,
        partners
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.updated) {
        console.log('New best time set!', data);
        // Optionally show a notification or update UI
      }
    })
    .catch(error => {
      console.error('Error submitting best time:', error);
    });
  }, [timer, username, users]);

  // Start timer
  const startTimer = useCallback(() => {
    setIsGameRunning(true);
    setTimer(0);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsGameRunning(false);
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
    stopTimer();
  }, [socket, stopTimer]);

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
    socket.on("gameState", (newState: GameState) => {
      setGameState(newState);

      // Start timer on first move
      if (!isGameRunning && newState.board.some(row => row.some(cell => cell.isRevealed))) {
        startTimer();
      }

      // Check for game completion
      if (newState.status === 1 || newState.status === 2) {
        stopTimer();
        submitBestTime();
      }
    });

    socket.on("users", (newUserData: Users) => {
      setUsers(newUserData);
    });

    return () => {
      socket.off("gameState");
      socket.off("users");
    };
  }, [socket, isGameRunning, startTimer, stopTimer, submitBestTime]);

  // Mouse movement setup - now using window event listener
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
        <div className="game-timer">⏱️ {formatTime(timer)}</div>
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