import { GameState } from "../game/GameState";
import { GameSettings } from "./gameTypes";
import { Socket } from "socket.io";

export interface User {
  uuid: string;
  username: string;
  state: {
    x: number;
    y: number;
  };
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
