// src/server/src/index.ts
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import routes from './routes';
import { GameState } from './game/GameState';
import { Move } from './types/gameTypes';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Use routes
app.use('/', routes);

// Game logic
const game = new GameState({ size: 8, mines: 10 });

io.on('connection', (socket) => {
  console.log('player connected');
  
  socket.emit('gameState', { board: game.board });

  socket.on('move', (move: Move) => {
    const result = game.click(move.x, move.y);
    io.emit('moveResult', {
      x: move.x,
      y: move.y,
      safe: result
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});