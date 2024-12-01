import { useEffect, useState, useRef, useCallback } from "react";
import { Cursor } from "./Cursor";
import { Cell } from "./Cell";
import { GameState, Coord, BoardProps, Users } from "../types/clientTypes";
import { throttle } from "lodash";
import "./Board.css";

const INITIAL_GAME_STATE: GameState = {
  board: [],
  status: 0,
  flagsLeft: 40,
};

const THROTTLE_MS = 120;

export function Board({ socket, uuid }: BoardProps) {
  const [users, setUsers] = useState<Users>({});
  const [rows, setRows] = useState(0);
  const [columns, setColumns] = useState(0);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isFirstConnection, setIsFirstConnection] = useState<boolean>(true);
  const boardRef = useRef<HTMLDivElement>(null);

  const gameBoardStyle: React.CSSProperties = {
    background: "#ddd",
    padding: "1px",
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 30px)`,
    gridTemplateRows: `repeat(${rows}, 30px)`,
    gap: "1px",
    position: "relative",
  };
  // Socket event handlers
  const handleGameState = useCallback((newState: GameState) => {
    setGameState(newState);
    // The following code is probably useless
    // But I hate the idea that the app would continuously set the rows and cols
    // Even though those variables would never change.
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
      THROTTLE_MS,
    ),
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
    [updatePositionThrottled],
  );

  // Game action handlers
  const handleLeftClick = useCallback(
    (coord: Coord) => {
      socket.emit("click", coord);
    },
    [socket],
  );

  const handleRightClick = useCallback(
    (coord: Coord) => {
      socket.emit("flag", coord);
    },
    [socket],
  );

  const handleReset = useCallback(() => {
    socket.emit("reset");
  }, [socket]);

  // Socket connection setup
  useEffect(() => {
    socket.on("connect", () => console.log("Connected to server!"));
    socket.on("connect_error", (error: any) =>
      console.log("Connection error:", error),
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
    return Object.entries(users).map(([user_uuid, user]) => {
      if (user.uuid === uuid) {
        return;
      }
      return (
        <Cursor key={user_uuid} color="red" x={user.state.x} y={user.state.y} />
      );
    });
  }, [users]);

  return (
    <div className="board-container">
      <div className="game-controls">
        <div className="flags-counter">🚩 {gameState.flagsLeft}</div>
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
              onLeftClick={handleLeftClick}
              onRightClick={handleRightClick}
            />
          )),
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
