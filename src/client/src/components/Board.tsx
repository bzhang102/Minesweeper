import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { GameState, Coord } from "../types/game";
import { Cell } from "./Cell";
import "./Board.css";

const socket = io("https://minesweeper-server-o2fa.onrender.com");

export function Board() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    status: 0,
    flagsLeft: 10,
  });

  useEffect(() => {
    socket.on("gameState", (newState: GameState) => {
      setGameState(newState);
    });

    return () => {
      socket.off("gameState");
    };
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
          ))
        )}
      </div>

      {gameState.status !== 0 && (
        <div
          className={`game-status ${gameState.status === 1 ? "won" : "lost"}`}
        >
          {gameState.status === 1 ? "You Won! 🎉" : "Game Over! 💥"}
        </div>
      )}
    </div>
  );
}
