// src/server/src/game/GameState.ts
import { BoardConfig } from '../types/gameTypes';

export class GameState {
  board: boolean[][];

  constructor(config: BoardConfig) {
    this.board = Array(config.size).fill(null)
      .map(() => Array(config.size).fill(false));
    
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      const x = Math.floor(Math.random() * config.size);
      const y = Math.floor(Math.random() * config.size);
      if (!this.board[y][x]) {
        this.board[y][x] = true;
        minesPlaced++;
      }
    }
  }

  click(x: number, y: number): boolean {
    return !this.board[y][x]; // true if safe, false if mine
  }
}