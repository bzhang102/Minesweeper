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

export enum GameStatus {
  PLAYING,
  WON,
  LOST,
}

export type Direction = {
  dx: number;
  dy: number;
};

export type GameSettings = {
  width: number;
  height: number;
  mines: number;
};
