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
};

const THROTTLE_MS = 50;

export function Board({ username, socket }: BoardProps) {
  const [users, setUsers] = useState<Users>({});
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const boardRef = useRef<HTMLDivElement>(null);

  const Ref = useRef<NodeJS.Timeout | null>(null);

  // The state for our timer
  const [timer, setTimer] = useState("00:00:00");



  const startTimer = (e:Date) => {

    let newTime = new Date()
    let hours = newTime.getHours() - e.getHours()
    let minutes = newTime.getMinutes() - e.getMinutes()
    let seconds =newTime.getSeconds() - e.getSeconds()
          // update the timer
          // check if less than 10 then we need to
          // add '0' at the beginning of the variable
      setTimer(
          `${hours}
          :
          ${minutes}
          :
          ${seconds}`
      );
  };
  const addSecond = (e:Number) =>{

  }

  const clearTimer = (e:Date) => {
      // If you adjust it you should also need to
      // adjust the Endtime formula we are about
      // to code next
      

      // If you try to remove this line the
      // updating of timer Variable will be
      // after 1000ms or 1sec
      if (Ref.current) clearInterval(Ref.current);
      let count = 0
      
      const id = setInterval(() => {
        // Calculate hours, minutes, and seconds
        const hours = Math.floor(count / 3600);
        const minutes = Math.floor((count / 60) % 60);
        const seconds = count % 60;

        // Update the timer in `hh:mm:ss` format
        setTimer(
            `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );

        count += 1; // Increment the counter
      }, 1000);
      Ref.current = id;
  };

  useEffect(() => {
    clearTimer(new Date());
}, []);
  // Socket event handlers
  const handleGameState = useCallback((newState: GameState) => {
    setGameState(newState);
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
      {timer}
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
