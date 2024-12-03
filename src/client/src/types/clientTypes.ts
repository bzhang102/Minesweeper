// Game configuration
export interface BoardConfig {
  width: number;
  height: number;
  mines: number;
}

// Coordinate type for moves
export interface Coord {
  x: number;
  y: number;
}

// Individual cell data
export interface Cell {
  isRevealed: boolean;
  isExploded: boolean;
  isFlagged: boolean;
  adjMines: number | null; // null when not revealed
  isMine: boolean | null; // null during gameplay
}

// Game status enum matching server values
export enum GameStatus {
  PLAYING = 0,
  WON = 1,
  LOST = 2,
}

// Overall game state
export interface GameState {
  board: Cell[][];
  status: GameStatus;
  flagsLeft: number;
  elapsedTime: number;
}

// Socket event types
export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
}

export interface ClientToServerEvents {
  click: (coord: Coord) => void;
  flag: (coord: Coord) => void;
  reset: () => void;
}

// Cursor types
export interface CursorProps {
  point: number[];
}

export interface CursorPath {
  shadow: string[];
  base: string[];
  accent: string[];
}

// Board Types
export interface BoardProps {
  socket: any;
  username: string;
  room: string;
}

export interface User {
  username: string;
  uuid: string;
  state: {
    x: number;
    y: number;
  };
  squaresCleared: number;
}

export interface Users {
  [key: string]: User;
}
