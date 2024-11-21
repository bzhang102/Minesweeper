// src/server/src/index.ts
import express from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { GameState, LobbyState } from "./game/GameState";
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
const gameStore: Dictionary<LobbyState> = {};
// Whenever a new room is created, create a game instance for players in that room
// HACK Note this function leaks memory, as every instance created will create a second game state which is represented by the user connection.
// TODO Find a way to systematically delete rooms which don't have any users, without deleting games that just got initialized.
io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
  gameStore[room] = {
    board: new GameState(config),
    users: {},
    connections: {},
  };
});

const handleMovement = (
  cursorPosition: User["state"],
  uuid: string,
  room: string,
) => {
  gameStore[room].users[uuid] = {
    ...gameStore[room].users[uuid],
    state: cursorPosition,
  };

  io.to(room).emit("users", gameStore[room].users);
};

const handleClose = (uuid: string, room: string) => {
  console.log(`Disconnecting ${gameStore[room].users[uuid].username}`);
  delete gameStore[room].connections[uuid];
  delete gameStore[room].users[uuid];
  console.log(gameStore[room].users);
  io.to(room).emit("users", gameStore[room].users);
};

io.on("connection", (socket) => {
  const username = String(socket.handshake.query["username"]);
  const room = String(socket.handshake.query["room"]);
  const uuid: string = uuidv4();

  console.log(`Creating Room ${room}`);

  socket.join(room);

  let game = gameStore[room].board;

  console.log(`${username} connected with uuid ${uuid} to room ${room}`);
  gameStore[room].connections[uuid] = socket;
  gameStore[room].users[uuid] = {
    username,
    uuid,
    // This makes cursor default position off of board
    state: {
      x: -30,
      y: -30,
    },
  };

  console.log(gameStore);
  console.log(gameStore[room].users);

  // Send current game state to new player
  socket.emit("gameState", game.getGameState());
  // Send UUID of current player to client
  console.log(`UUID is ${uuid} and room is ${room}`);
  socket.emit("uuid", uuid);

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
    gameStore[room].board = new GameState(config);
    game = gameStore[room].board;
    io.to(room).emit("gameState", game.getGameState());
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
