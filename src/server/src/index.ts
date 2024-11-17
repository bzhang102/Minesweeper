// src/server/src/index.ts
import express from "express";
import { Server } from "socket.io";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord, BoardConfig } from "./types/gameTypes";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let config = { width: 16, height: 16, mines: 10 };
let game = new GameState(config);

io.on("connection", (socket) => {
  console.log("player connected");

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

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
