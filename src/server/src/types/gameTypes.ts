// src/server/src/types/gameTypes.ts
export interface BoardConfig {
    size: number;
    mines: number;
  }
  
  export interface Move {
    x: number;
    y: number;
  }