import { useEffect, useState, useRef, useCallback } from "react";
import { Cursor } from "./Cursor";
import { Cell } from "./Cell";
import { GameState, Coord, BoardProps, Users } from "../types/clientTypes";
import "./Board.css";

const INITIAL_GAME_STATE: GameState = {
  board: [],
  status: 0,
  flagsLeft: 40,
};

const THROTTLE_MS = 5;

const throttle = (fn: Function, throttle: number) => {
  let lastTime = 0;
  return (...args: any[]) => {
    const now = new Date().getTime();
    if (now - lastTime < throttle) return;
    lastTime = now;
    fn(...args);
  };
};

const debounce = (fn: Function, delay: number) => {
  let id: any;
  return (...args: any[]) => {
    if (id) clearTimeout(id);
    id = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

export function Board({ socket, uuid }: BoardProps) {
  const [users, setUsers] = useState<Users>({});
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const boardRef = useRef<HTMLDivElement>(null);

  // Socket event handlers
  const handleGameState = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  /* const handleUUID = useCallback((newUUID: String) => {
   *   console.log(`UUID is ${newUUID}`);
   *   setUUID(newUUID);
   * }, []); */

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
    /* console.log("Scanning for uuid"); */
    socket.on("gameState", handleGameState);
    socket.on("users", handleUsersUpdate);
    /* socket.on("uuid", handleUUID); */

    return () => {
      socket.off("gameState");
      socket.off("users");
      /* socket.off("uuid"); */
    };
  }, [socket /* handleUUID */, , handleGameState, handleUsersUpdate]);

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
      console.log(uuid);
      if (user.uuid === uuid) {
        return;
      }
      return <Cursor key={user_uuid} point={[user.state.x, user.state.y]} />;
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
