// src/server/src/index.ts
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { GameState, LobbyState } from "./game/GameState";
import { Coord } from "./types/gameTypes";
import { User, Dictionary } from "./types/serverTypes";

const PORT = process.env.PORT || 3000; // Add this line
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());

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

// let config = { width: 24, height: 16, mines: 70 };

const isFourDigits = (room: string) => {
  return /^\d{4}$/.test(room);
};
// Hold game states across all rooms.
// The room ID will be the game's key.
const gameStore: Dictionary<LobbyState> = {};
let lobbies: Set<string> = new Set();

app.post("/check-lobbies", (req, res) => {
  const { lobby } = req.body;
  const isInSet = lobbies.has(lobby);
  res.json({ isInSet });
});

// Whenever a new room is created, create a game instance for players in that room
app.post("/create-lobby", (req, res) => {
  const { gameConfig, room } = req.body;
  console.log(req.body);
  console.log(`Creating Room ${room}`);
  gameStore[room] = {
    board: new GameState(gameConfig),
    config: gameConfig,
    users: {},
    connections: {},
  };
  lobbies.add(room);
  res.send({
    status: "ok",
    message: "Minesweeper lobby generated",
    timestamp: new Date().toISOString(),
  });
});

// io.of("/").adapter.on("create-room", (room) => {
//   // Prevent rooms created when a browser connects to the server to create game instances
//   if (!isFourDigits(room)) return;
//   gameStore[room] = {
//     board: new GameState(config),
//     users: {},
//     connections: {},
//   };
//   lobbies.add(room);
// });

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
  console.log(`Disconnecting ${gameStore[room].users[uuid].uuid}`);
  delete gameStore[room].connections[uuid];
  delete gameStore[room].users[uuid];
  console.log(gameStore[room].users);
  io.to(room).emit("users", gameStore[room].users);
};

io.on("connection", (socket) => {
  const room = String(socket.handshake.query["room"]);
  const uuid: string = uuidv4();

  socket.join(room);

  let game = gameStore[room].board;

  console.log(`User connected with uuid ${uuid} to room ${room}`);
  console.log(lobbies);
  gameStore[room].connections[uuid] = socket;
  gameStore[room].users[uuid] = {
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
  socket.emit("lobbies", lobbies);

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
    gameStore[room].board = new GameState(gameStore[room].config);
    game = gameStore[room].board;
    io.to(room).emit("gameState", game.getGameState());
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
