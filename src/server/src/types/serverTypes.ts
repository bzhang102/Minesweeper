import { Request } from "express";
import { GameState } from "../game/GameState";
import { GameSettings, Coord, BoardConfig } from "./gameTypes";
import { Socket } from "socket.io";

export interface User {
  uuid: string;
  username: string;
  state: {
    x: number;
    y: number;
  };
  squaresCleared: number;
}

export interface Dictionary<T> {
  [key: string]: T;
}

export type LobbyState = {
  board: GameState;
  config: GameSettings;
  connections: Dictionary<Socket>;
  users: Dictionary<User>;
};

export interface ClientToServerEvents {
  cursor_movement: (cursorPosition: User["state"]) => void;
  click: (move: Coord) => void;
  flag: (move: Coord) => void;
  reset: () => void;
  disconnect: () => void;
}

export interface ServerToClientEvents {
  gameState: (state: ReturnType<GameState["getGameState"]>) => void;
  uuid: (id: string) => void;
  lobbies: (lobbies: Set<string>) => void;
  users: (users: Dictionary<User>) => void;
  error: (message: string) => void;
  gameUpdate: (update: {
    gameState: ReturnType<GameState["getGameState"]>;
    users: Dictionary<User>;
  }) => void;
}

export interface CheckLobbyRequest extends Request {
  body: {
    lobby: string;
  };
}

export interface CreateLobbyRequest extends Request {
  body: {
    gameConfig: BoardConfig;
    room: string;
  };
}
