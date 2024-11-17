// src/server/src/index.ts
import express from "express";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord, BoardConfig } from "./types/gameTypes";

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

const connections = {};
const users = {};

io.on("connection", (socket) => {
  const username = socket.handshake.query["username"];
  const uuid = uuidv4();
  console.log(`${username} connected`);

  // Send current game state to new player
  socket.emit("gameState", game.getGameState());

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
