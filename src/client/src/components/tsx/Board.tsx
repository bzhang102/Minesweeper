import { useEffect, useState, useRef, useCallback, useReducer } from "react";
import { throttle } from "lodash";
import { Cursor } from "./Cursor";
import { Cell } from "./Cell";
import { config } from "../../config";
import { UserLegend } from "./Legend";
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
  const [bestTimes, setBestTimes] = useState<{
    easy?: number;
    medium?: number;
    hard?: number;
  }>({});
  const [bestTimePartners, setBestTimePartners] = useState<{
    easy?: string[];
    medium?: string[];
    hard?: string[];
  }>({});
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const getDifficulty = (rows: number): string => {
    switch (rows) {
      case 8:
        return 'easy';
      case 16:
        return 'medium';
      case 24:
        return 'hard';
      default:
        return 'easy';
    }
  };
  const [start, setStart] = useState(0);

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

  const fetchBestTimes = useCallback(async () => {
    try {
      const response = await fetch(`${config.SERVER_URL}/get-best-time/${username}`);
      const result = await response.json();
      
      if (result.data) {
        setBestTimes({
          easy: result.data.easy_solve_time,
          medium: result.data.medium_solve_time,
          hard: result.data.hard_solve_time
        });
        setBestTimePartners({
          easy: result.data.easy_solve_partners || [],
          medium: result.data.medium_solve_partners || [],
          hard: result.data.hard_solve_partners || []
        });
      }
    } catch (error) {
      console.error('Error fetching best times:', error);
    }
  }, [username]);

  const updateBestTime = useCallback(async () => {
    console.log(Object.keys(users))
    if (gameState.status === 1 && Object.keys(users).length >= 1) {
      console.log("got in function")

      const partners = Object.values(users)
        .filter(user => user.username !== username)
        .map(user => user.username);

      const difficulty = getDifficulty(rows);

      try {
        const response = await fetch(`${config.SERVER_URL}/update-best-time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            solveTime: Math.floor((Date.now() - start) / 1000),
            partners,
            difficulty
          })
        });

        const result = await response.json();
        console.log('Best time update result:', result);
        
        // Refresh best times after update
        fetchBestTimes();
      } catch (error) {
        console.error('Error updating best time:', error);
      }
    }
  }, [gameState, users, username, rows, fetchBestTimes]);

  // Fetch best times on component mount
  useEffect(() => {
    fetchBestTimes();
  }, [fetchBestTimes]);

  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     formatTime(gameState.elapsedTime);
  //     //console.log("Game State:", gameState.elapsedTime);
  //     //console.log("Gayheze")

  //   }, 1000);

  //   return () => clearTimeout(timeoutId);
  // }, [gameState.elapsedTime]);

  useEffect(() => {
    if (gameState.status === 1) {
      console.log("got here")
      updateBestTime();
    }
  }, [gameState.status]);

  const gameBoardStyle: React.CSSProperties = {
    background: "#ddd",
    padding: "1px",
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 30px)`,
    gridTemplateRows: `repeat(${rows}, 30px)`,
    gap: "1px",
    position: "relative",
  };

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
    console.log(newState.elapsedTime)
    setStart(newState.elapsedTime)
    console.log(start)
    if (isFirstConnection) {
      setRows(newState.board.length);
      setColumns(newState.board[0].length);
      setIsFirstConnection(false);
    }
  }, []);
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log(gameState.status)
      if(gameState.status == GameStatus.PLAYING){
      formatTime(Math.floor((Date.now() - start) / 1000));
      console.log(gameState.elapsedTime);
      }
    }, 1000);
  
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [start, gameState.elapsedTime, gameState.status]);


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
    forceUpdate();
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

  // Socket updates
  useEffect(() => {
    socket.on(
      "gameUpdate",
      (update: { gameState: GameState; users: Users }) => {
        setGameState(update.gameState);
        setUsers(update.users);
        handleGameState(update.gameState);
        handleUsersUpdate(update.users)

        if (isFirstConnection) {
          setRows(update.gameState.board.length);
          setColumns(update.gameState.board[0].length);
          setIsFirstConnection(false);
        }
      }
    );

    return () => {
      socket.off("gameUpdate");
    };
  }, [socket, isFirstConnection]);

  const [, forceUpdate] = useReducer(x => x + 1, 0);

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

  // Format best time for display
  const formatBestTime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds / 60) % 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Render partners list
  const renderPartners = (partners?: string[]) => {
    return partners && partners.length > 0 
      ? partners.join(', ') 
      : 'No partners';
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
        <div className="best-times-dropdown">
          <select 
            value={selectedDifficulty || ""} 
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="difficulty-select"
          >
            <option value="">Best Times</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {selectedDifficulty && (
            <div className="best-time-details">
              <div>Best Time: {formatBestTime(bestTimes[selectedDifficulty as keyof typeof bestTimes])}</div>
              <div>Partners: {renderPartners(bestTimePartners[selectedDifficulty as keyof typeof bestTimePartners])}</div>
            </div>
          )}
        </div>
      </div>

      <div className="game-area">
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

          {/* Game status overlay */}
          {gameState.status !== 0 && (
            <div
              className={`game-status ${
                gameState.status === 1 ? "won" : "lost"
              }`}
            >
              {gameState.status === 1 ? "You Won! 🎉" : "Game Over! 💥"}
            </div>
          )}

          <div className="cursors-container">{renderCursors()}</div>
        </div>

        <UserLegend
          users={users}
          userColors={userColors}
          currentUsername={username}
        />
      </div>
    </div>
  );
}