import { useEffect, useState, useRef, useCallback } from "react";
import { throttle } from "lodash";
import { Socket } from "socket.io-client";
import { Cell } from "./Cell";
import { config } from "../../config";
import { BestTimesPanel } from "./BestTimesPanel";
import { PlayersPanel } from "./PlayersPanel";
import { GameState, Coord, Users, GameStatus } from "../../types/clientTypes";
import "../css/MainBoard.css";

const INITIAL_GAME_STATE: GameState = {
  board: [],
  status: 0,
  flagsLeft: 40,
  elapsedTime: 0,
  idiot: "",
};

const THROTTLE_MS = 120;

interface MainBoardProps {
  socket: Socket;
  username: string;
  room: string;
}

export function MainBoard({ socket, username, room }: MainBoardProps) {
  const [users, setUsers] = useState<Users>({});
  const [userColors, setUserColors] = useState<{ [uuid: string]: string }>({});
  const [rows, setRows] = useState(0);
  const [columns, setColumns] = useState(0);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isFirstConnection, setIsFirstConnection] = useState<boolean>(true);
  const [timer, setTimer] = useState("00:00:00");
  const [bestTimes, setBestTimes] = useState<{ [key: string]: number }>({});
  const [bestTimePartners, setBestTimePartners] = useState<{
    [key: string]: string[];
  }>({});
  const [start, setStart] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const hasProcessedWin = useRef(false);

  type Difficulty = "easy" | "medium" | "hard";

  const getBoardDifficulty = (rows: number, columns: number): Difficulty => {
    if (rows === 8 && columns === 8) return "easy";
    if (rows === 16 && columns === 16) return "medium";
    if (rows === 24 && columns === 24) return "hard";
    return "medium"; // default fallback
  };

  // Fetch and update best times
  const fetchBestTimes = useCallback(async () => {
    try {
      const response = await fetch(
        `${config.SERVER_URL}/get-best-time/${username}`,
      );
      const result = await response.json();
      if (result.data) {
        setBestTimes({
          easy: result.data.easy_solve_time,
          medium: result.data.medium_solve_time,
          hard: result.data.hard_solve_time,
        });
        setBestTimePartners({
          easy: result.data.easy_solve_partners || [],
          medium: result.data.medium_solve_partners || [],
          hard: result.data.hard_solve_partners || [],
        });
      }
    } catch (error) {
      console.error("Error fetching best times:", error);
    }
  }, [username]);

  // Timer logic
  const formatTime = (seconds: number): void => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds / 60) % 60);
    const secondss = seconds % 60;
    setTimer(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secondss.toString().padStart(2, "0")}`,
    );
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (gameState.status === GameStatus.PLAYING) {
        formatTime(Math.floor((Date.now() - start) / 1000));
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [start, gameState.status]);

  const updateBestTime = useCallback(
    async (difficulty: Difficulty, time: number) => {
      try {
        const currentBestTime = bestTimes[difficulty];
        // Only update if there's no best time or if the new time is better
        if (!currentBestTime || time < currentBestTime) {
          // Get the list of unique usernames from the users object, excluding the current user
          const partners = Object.values(users)
            .map((user) => user.username)
            .filter((name) => name !== username);

          const response = await fetch(
            `${config.SERVER_URL}/update-best-time`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username,
                difficulty,
                solveTime: time,
                partners,
              }),
            },
          );

          if (response.ok) {
            // Refresh best times after successful update
            await fetchBestTimes();
          } else {
            console.error("Failed to update best time");
          }
        }
      } catch (error) {
        console.error("Error updating best time:", error);
      }
    },
    [username, users, bestTimes, fetchBestTimes],
  );

  // Add effect to handle game win and best time updates
  useEffect(() => {
    if (
      gameState.status === GameStatus.WON &&
      !hasProcessedWin.current &&
      rows > 0 &&
      columns > 0
    ) {
      const difficulty = getBoardDifficulty(rows, columns);
      const finalTime = Math.floor((Date.now() - start) / 1000);

      // Update best time
      updateBestTime(difficulty, finalTime);

      // Mark this win as processed
      hasProcessedWin.current = true;
    } else if (gameState.status !== GameStatus.WON) {
      // Reset the processed flag when game is not in won state
      hasProcessedWin.current = false;
    }
  }, [gameState.status, rows, columns, start, updateBestTime]);

  // Mouse movement
  const updatePositionThrottled = useRef(
    throttle(
      (position: object) => socket.emit("cursor_movement", position),
      THROTTLE_MS,
    ),
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updatePositionThrottled.current({ x, y });
    },
    [updatePositionThrottled],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Game actions
  const handleLeftClick = useCallback(
    (coord: Coord) => socket.emit("click", coord, username),
    [socket, username],
  );

  const handleRightClick = useCallback(
    (coord: Coord) => socket.emit("flag", coord),
    [socket],
  );

  const handleReset = useCallback(() => {
    socket.emit("reset");
  }, [socket]);

  // Socket update handlers
  const handleGameState = useCallback(
    (newState: GameState) => {
      setGameState(newState);
      setStart(newState.elapsedTime);
      if (isFirstConnection) {
        setRows(newState.board.length);
        setColumns(newState.board[0].length);
        setIsFirstConnection(false);
      }
    },
    [isFirstConnection],
  );

  useEffect(() => {
    socket.on(
      "gameUpdate",
      (update: { gameState: GameState; users: Users }) => {
        handleGameState(update.gameState);
        setUsers(update.users);
      },
    );

    return () => {
      socket.off("gameUpdate");
    };
  }, [socket, handleGameState]);

  // User colors
  useEffect(() => {
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

    const newUserColors = { ...userColors };
    Object.keys(users).forEach((userUuid) => {
      if (!newUserColors[userUuid]) {
        newUserColors[userUuid] = getColorFromUuid(userUuid);
      }
    });
    setUserColors(newUserColors);
  }, [users]);

  // Initial fetch of best times
  useEffect(() => {
    fetchBestTimes();
  }, [fetchBestTimes]);

  const gameBoardStyle: React.CSSProperties = {
    background: "#ddd",
    padding: "1px",
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 30px)`,
    gridTemplateRows: `repeat(${rows}, 30px)`,
    gap: "1px",
    position: "relative",
  };

  return (
    <div className="board-container">
      <div className="game-controls">
        <div className="flags-counter">🚩 {gameState.flagsLeft}</div>
        <div className="game-timer">{timer}</div>
        <div className="room-id">Room: {room}</div>
        <button className="reset-button" onClick={handleReset}>
          New Game
        </button>
      </div>

      <div className="game-area">
        <BestTimesPanel
          bestTimes={bestTimes}
          bestTimePartners={bestTimePartners}
        />

        <div ref={boardRef} className="game-board" style={gameBoardStyle}>
          {gameState.board.map((row, y) =>
            row.map((cell, x) => (
              <Cell
                key={`${x}-${y}`}
                data={cell}
                coord={{ x, y }}
                over={gameState.status !== GameStatus.PLAYING}
                onLeftClick={handleLeftClick}
                onRightClick={handleRightClick}
              />
            )),
          )}

          {gameState.status !== GameStatus.PLAYING && (
            <div
              className={`game-status ${
                gameState.status === GameStatus.WON ? "won" : "lost"
              }`}
            >
              {gameState.status === GameStatus.WON
                ? "You Won! 🎉"
                : `Game Over 💥 Blame ${gameState.idiot}`}
            </div>
          )}
        </div>

        <PlayersPanel
          users={users}
          userColors={userColors}
          currentUsername={username}
          boardRef={boardRef}
        />
      </div>
    </div>
  );
}
