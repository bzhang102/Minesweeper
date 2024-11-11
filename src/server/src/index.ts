// src/server/src/index.ts
import express from "express";
import { Server } from "socket.io";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord } from "./types/gameTypes";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Game logic
let game = new GameState({ width: 16, height: 16, mines: 40 });

io.on("connection", (socket) => {
  console.log("player connected");

  // Send current game state to new player
  socket.emit("gameState", game.getGameState());

  // Handle left clicks
  socket.on("click", (move: Coord) => {
    const result = game.click(move);
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
    game = new GameState({ width: 16, height: 16, mines: 40 });
    io.emit("gameState", game.getGameState());
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});

// // for testing
// app.get("/", (req, res) => {
//   res.send(`
//     <html>
//       <head>
//         <style>
//           .board {
//             display: grid;
//             grid-template-columns: repeat(16, 30px);
//             gap: 1px;
//             background: #ccc;
//             padding: 10px;
//           }
//           .cell {
//             width: 30px;
//             height: 30px;
//             background: #eee;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             cursor: pointer;
//           }
//           .revealed { background: #fff; }
//           .mine { background: red; }
//           .flag { background: yellow; }
//         </style>
//       </head>
//       <body>
//         <div id="controls">
//           <button id="resetBtn">Reset Board</button>
//         </div>
//         <div id="board" class="board"></div>
//         <div id="status"></div>

//         <script src="/socket.io/socket.io.js"></script>
//         <script>
//           const socket = io();
//           const board = document.getElementById('board');
//           const status = document.getElementById('status');
//           const resetBtn = document.getElementById('resetBtn');

//           resetBtn.addEventListener('click', () => {
//             socket.emit('reset');
//           });

//           function updateBoard(gameState) {
//             board.innerHTML = '';
//             gameState.board.forEach((row, y) => {
//               row.forEach((cell, x) => {
//                 const div = document.createElement('div');
//                 div.className = 'cell';
//                 if (cell.isRevealed) {
//                   div.className += ' revealed';
//                   div.textContent = cell.adjMines || '';
//                 }
//                 if (cell.isExploded) {
//                   div.className += ' mine';
//                   div.textContent = '💥';
//                 }
//                 if (cell.isFlagged) {
//                   div.className += ' flag';
//                   div.textContent = '🚩';
//                 }

//                 div.addEventListener('click', () => {
//                   socket.emit('click', { x, y });
//                 });
//                 div.addEventListener('contextmenu', (e) => {
//                   e.preventDefault();
//                   socket.emit('flag', { x, y });
//                 });
//                 board.appendChild(div);
//               });
//             });
//             status.textContent = 'Game Status: ' + gameState.status;
//           }

//           socket.on('gameState', updateBoard);
//           socket.on('connect', () => {
//             console.log('Connected to server');
//           });
//         </script>
//       </body>
//     </html>
//   `);
// });
