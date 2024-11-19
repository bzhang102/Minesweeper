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
    // origin: "http://localhost:5173",
    origin: "https://coopminesweeper.netlify.app",
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

let config = { width: 16, height: 16, mines: 40 };
let game = new GameState(config);

const connections: Dictionary<Socket> = {};
const users: Dictionary<User> = {};

const handleMovement = (cursorPosition: User["state"], uuid: string) => {
  users[uuid] = {
    ...users[uuid],
    state: cursorPosition,
  };
  io.emit("users", users);
  console.log(cursorPosition.x, cursorPosition.y);
};

const handleClose = (uuid: string) => {
  console.log(`Disconnecting ${users[uuid].username}`);
  delete connections[uuid];
  delete users[uuid];
  console.log(users);
  io.emit("users", users);
};

io.on("connection", (socket) => {
  const username = String(socket.handshake.query["username"]);
  const uuid: string = uuidv4();
  console.log(`${username} connected with uuid ${uuid}`);
  connections[uuid] = socket;
  users[uuid] = {
    username,
    state: {
      x: -30,
      y: -30,
    },
  };

  console.log(users);

  // Send current game state to new player
  socket.emit("gameState", game.getGameState());

  // Handle cursor movement
  socket.on("cursor_movement", (cursorPosition: User["state"]) =>
    handleMovement(cursorPosition, uuid)
  );

  // Handle disconnect
  socket.on("disconnect", () => handleClose(uuid));

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
