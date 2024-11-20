// src/server/src/index.ts
import express from "express";
import { Socket, Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord } from "./types/gameTypes";
import { User, Dictionary } from "./types/serverTypes";

const PORT = process.env.PORT || 3000; // Add this line
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    // origin: "https://coopminesweeper.netlify.app",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send({
    status: "ok",
    message: "Minesweeper server running",
    timestamp: new Date().toISOString(),
  });
});

let config = { width: 24, height: 16, mines: 70 };

// Hold game states across all rooms.
// The room ID will be the game's key.
const gameStore: Dictionary<GameState> = {};
const connections: Dictionary<Socket> = {};
const users: Dictionary<User> = {};

// Whenever a new room is created, create a game instance for players in that room
io.of("/").adapter.on("create-room", (room) => {
  gameStore[room] = new GameState(config);
});

const handleMovement = (
  cursorPosition: User["state"],
  uuid: string,
  room: string,
) => {
  users[uuid] = {
    ...users[uuid],
    state: cursorPosition,
  };

  io.to(room).emit("users", users);
};

const handleClose = (uuid: string, room: string) => {
  console.log(`Disconnecting ${users[uuid].username}`);
  delete connections[uuid];
  delete users[uuid];
  console.log(users);
  io.to(room).emit("users", users);
};

io.on("connection", (socket) => {
  const username = String(socket.handshake.query["username"]);
  const room = String(socket.handshake.query["room"]);
  const uuid: string = uuidv4();
  let game = gameStore[room];

  console.log(`${username} connected with uuid ${uuid} to room ${room}`);
  connections[uuid] = socket;
  users[uuid] = {
    username,
    uuid,
    state: {
      x: -30,
      y: -30,
    },
  };

  console.log(users);

  // Send current game state to new player
  socket.to(room).emit("gameState", game.getGameState());
  // Send UUID of current player to client
  socket.to(room).emit("uuid", uuid);

  // Handle cursor movement
  socket.on("cursor_movement", (cursorPosition: User["state"]) => {
    handleMovement(cursorPosition, uuid, room);
  });

  // Handle disconnect
  socket.on("disconnect", () => handleClose(uuid, room));

  // Handle left clicks
  socket.on("click", (move: Coord) => {
    game.click(move);
    // Broadcast new state to all players
    io.to(room).emit("gameState", game.getGameState());
  });

  // Handle right clicks (flags)
  socket.on("flag", (move: Coord) => {
    game.flag(move);
    // Broadcast new state to all players
    io.to(room).emit("gameState", game.getGameState());
  });

  socket.on("reset", () => {
    gameStore[room] = new GameState(config);
    game = gameStore[room];
    io.to(room).emit("gameState", game.getGameState());
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
