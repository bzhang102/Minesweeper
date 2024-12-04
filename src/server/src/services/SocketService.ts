import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { GameState } from "../game/GameState";
import {
  LobbyState,
  User,
  Dictionary,
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/serverTypes";
import { Coord } from "../types/gameTypes";

export class SocketHandler {
  private gameRooms: Dictionary<LobbyState>;
  private lobbies: Set<string>;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    gameRooms: Dictionary<LobbyState>,
    lobbies: Set<string>,
  ) {
    this.io = io;
    this.gameRooms = gameRooms;
    this.lobbies = lobbies;
  }

  public handleConnection(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  ): void {
    const username = String(socket.handshake.query["username"]);
    const room = String(socket.handshake.query["room"]);
    const uuid = uuidv4();

    if (!this.validateRoom(socket, room)) return;
    socket.join(room);

    this.initializeUser(socket, room, username, uuid);
    this.setupEventListeners(socket, room, uuid);
  }

  private validateRoom(socket: Socket, room: string): boolean {
    if (!this.gameRooms[room]) {
      console.log(`Room ${room} does not exist. Disconnecting client.`);
      socket.emit("error", "Room does not exist");
      socket.disconnect(true);
      return false;
    }
    return true;
  }

  private initializeUser(
    socket: Socket,
    room: string,
    username: string,
    uuid: string,
  ): void {
    console.log(`User connected with uuid ${uuid} to room ${room}`);

    this.gameRooms[room].connections[uuid] = socket;
    this.gameRooms[room].users[uuid] = {
      uuid,
      username,
      state: { x: -30, y: -30 },
      squaresCleared: 0,
    };

    this.emitInitialState(socket, room, uuid);
  }

  private emitInitialState(socket: Socket, room: string, uuid: string): void {
    this.emitGameUpdate(room);
    socket.emit("uuid", uuid);
  }

  private setupEventListeners(
    socket: Socket,
    room: string,
    uuid: string,
  ): void {
    socket.on("cursor_movement", (cursorPosition: User["state"]) =>
      this.handleMovement(cursorPosition, uuid, room),
    );

    socket.on("disconnect", () => this.handleClose(uuid, room));

    socket.on("click", (move: Coord, username: string) =>
      this.handleClick(move, username, uuid, room),
    );

    socket.on("flag", (move: Coord) => this.handleFlag(move, room));

    socket.on("reset", () => this.handleReset(room));
  }

  private handleMovement(
    cursorPosition: User["state"],
    uuid: string,
    room: string,
  ): void {
    if (!this.gameRooms[room]?.users[uuid]) return;

    this.gameRooms[room].users[uuid] = {
      ...this.gameRooms[room].users[uuid],
      state: cursorPosition,
    };
    this.emitGameUpdate(room);
  }

  private handleClose(uuid: string, room: string): void {
    if (!this.gameRooms[room]?.users[uuid]) return;

    console.log(`Disconnecting ${this.gameRooms[room].users[uuid].uuid}`);
    delete this.gameRooms[room].connections[uuid];
    delete this.gameRooms[room].users[uuid];

    if (Object.keys(this.gameRooms[room].users).length === 0) {
      this.lobbies.delete(room);
      delete this.gameRooms[room];
    }

    this.emitGameUpdate(room);
  }

  private handleClick(
    move: Coord,
    username: string,
    uuid: string,
    room: string,
  ): void {
    if (!this.gameRooms[room]) return;

    const game = this.gameRooms[room].board;
    const squaresCleared = game.click(move, username);

    if (squaresCleared > 0) {
      this.gameRooms[room].users[uuid] = {
        ...this.gameRooms[room].users[uuid],
        squaresCleared:
          (this.gameRooms[room].users[uuid].squaresCleared || 0) +
          squaresCleared,
      };
      this.emitGameUpdate(room);
    }
  }

  private handleFlag(move: Coord, room: string): void {
    if (!this.gameRooms[room]) return;

    const game = this.gameRooms[room].board;
    game.flag(move);
    this.emitGameUpdate(room);
  }

  private handleReset(room: string): void {
    if (!this.gameRooms[room]) return;

    this.gameRooms[room].board = new GameState(this.gameRooms[room].config);
    Object.keys(this.gameRooms[room].users).forEach((userUuid) => {
      this.gameRooms[room].users[userUuid] = {
        ...this.gameRooms[room].users[userUuid],
        squaresCleared: 0,
      };
    });

    this.emitGameUpdate(room);
  }

  private emitGameUpdate(room: string): void {
    if (!this.gameRooms[room]) return;

    this.io.to(room).emit("gameUpdate", {
      gameState: this.gameRooms[room].board.getGameState(),
      users: this.gameRooms[room].users,
    });
  }
}
