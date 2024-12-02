import { useEffect, useState, useRef, useCallback } from "react";
import { add, min, set, throttle } from "lodash";
import { Cursor } from "./Cursor";
import { Cell } from "./Cell";
import {
  GameState,
  Coord,
  BoardProps,
  Users,
  GameStatus,
} from "../../types/clientTypes";
import "../css/Board.css";

const INITIAL_GAME_STATE: GameState = {
  board: [],
  status: 0,
  flagsLeft: 40,
  elapsedTime: 0
};

const THROTTLE_MS = 120;

export function Board({ socket, username, room }: BoardProps) {
  const [users, setUsers] = useState<Users>({});
  const [userColors, setUserColors] = useState<{ [uuid: string]: string }>({});
  const [rows, setRows] = useState(0);
  const [columns, setColumns] = useState(0);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isFirstConnection, setIsFirstConnection] = useState<boolean>(true);
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

  const gameBoardStyle: React.CSSProperties = {
    background: "#ddd",
    padding: "1px",
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 30px)`,
    gridTemplateRows: `repeat(${rows}, 30px)`,
    gap: "1px",
    position: "relative",
  };

  // Hash uuid to get user's color
  const getColorFromUuid = (uuid: string) => {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = uuid.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  };

  // Socket event handlers
  const handleGameState = useCallback((newState: GameState) => {
    setGameState(newState);

    if (isFirstConnection) {
      setRows(newState.board.length);
      setColumns(newState.board[0].length);
      setIsFirstConnection(false);
    }
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
  );

  // Mouse movement handler
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      updatePositionThrottled.current({
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
    return Object.entries(users).map(([userUuid, user]) => {
      if (user.username == username) {
        return null;
      }
      return (
        <Cursor
          key={userUuid}
          color={userColors[userUuid]}
          x={user.state.x}
          y={user.state.y}
        />
      );
    });
  }, [users, userColors, username]);

  // User color differentiation
  useEffect(() => {
    const newUserColors = { ...userColors };
    Object.keys(users).forEach((userUuid) => {
      if (!newUserColors[userUuid]) {
        newUserColors[userUuid] = getColorFromUuid(userUuid);
      }
    });
    setUserColors(newUserColors);
  }, [users]);

  return (
    <div className="board-container">
      <div className="game-controls">
        <div className="flags-counter">🚩 {gameState.flagsLeft}</div>
        <div className="game-timer">{timer}</div>
        <div className="room-id">Room: {room}</div> {/* Display the room ID */}
        <button className="reset-button" onClick={handleReset}>
          New Game
        </button>
      </div>

      <div ref={boardRef} className="game-board" style={gameBoardStyle}>
        {gameState.board.map((row, y) =>
          row.map((cell, x) => (
            <Cell
              key={`${x}-${y}`}
              data={cell}
              coord={{ x, y }}
              over={gameState.status != GameStatus.PLAYING}
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