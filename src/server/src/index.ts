// src/server/src/index.ts
import express from "express";
import { Socket, Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord, BoardConfig } from "./types/gameTypes";
import { User } from "./types/serverTypes";

interface Dictionary<T> {
  [key: string]: T;
}

const PORT = process.env.PORT || 3000; // Add this line
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let config = { width: 16, height: 16, mines: 10 };
let game = new GameState(config);

const connections: Dictionary<Socket> = {};
const users: Dictionary<User> = {};

const handleMovement = (message: object, uuid: string, socket: Socket) => {
  let user: User = users[uuid];
  user.state = message;
  io.emit("users", users);
  console.log(
    `${user.username} updated their updated state: ${JSON.stringify(user.state)}`,
  );
};
const handleClose = (uuid: string, socket: Socket) => {
  console.log(`Disconnecting ${users[uuid].username}`);
  delete connections[uuid];
  delete users[uuid];
  console.log(users);
  socket.broadcast.emit("users", users);
};

io.on("connection", (socket) => {
  const username = socket.handshake.query["username"];
  const uuid: string = uuidv4();
  console.log(`${username} connected with uuid ${uuid}`);
  connections[uuid] = socket;
  users[uuid] = {
    username,
    state: {},
  };

  console.log(users);

  // Send current game state to new player
  socket.emit("gameState", game.getGameState());

  socket.on("cursor_movement", (message) =>
    handleMovement(message, uuid, socket),
  );
  socket.on("disconnect", () => handleClose(uuid, socket));

  // Handle left clicks
  socket.on("click", (move: Coord) => {
    game.click(move);
    // Broadcast new state to all players
    io.emit("gameState", game.getGameState());
  });

  // Handle right clicks (flags)
  socket.on("flag", (move: Coord) => {
    game.flag(move);
    // Broadcast new state to all players
    io.emit("gameState", game.getGameState());
  });

  socket.on("reset", () => {
    game = new GameState(config);
    io.emit("gameState", game.getGameState());
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
