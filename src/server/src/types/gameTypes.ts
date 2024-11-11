// src/server/src/types/gameTypes.ts
export interface BoardConfig {
  width: number;
  height: number;
  mines: number;
}

export interface Coord {
  x: number;
  y: number;
}

export interface Cell {
  isMine: boolean;
  isExploded: boolean;
  isRevealed: boolean;
  adjMines: number;
  isFlagged: boolean;
}
