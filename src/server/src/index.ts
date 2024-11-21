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
<<<<<<< HEAD

// for testing
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <style>
          .board {
            display: grid;
            grid-template-columns: repeat(16, 30px);
            gap: 1px;
            background: #ccc;
            padding: 10px;
          }
          .cell {
            width: 30px;
            height: 30px;
            background: #eee;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .revealed { background: #fff; }
          .mine { background: red; }
          .flag { background: yellow; }
        </style>
      </head>
      <body>
        <div id="controls">
          <button id="resetBtn">Reset Board</button>
        </div>
        <div id="board" class="board"></div>
        <div id="status"></div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
          const socket = io();
          const board = document.getElementById('board');
          const status = document.getElementById('status');
          const resetBtn = document.getElementById('resetBtn');

          resetBtn.addEventListener('click', () => {
            socket.emit('reset');
          });

          function updateBoard(gameState) {
            board.innerHTML = '';
            gameState.board.forEach((row, y) => {
              row.forEach((cell, x) => {
                const div = document.createElement('div');
                div.className = 'cell';
                if (cell.isRevealed) {
                  div.className += ' revealed';
                  div.textContent = cell.adjMines || '';
                }
                if (cell.isExploded) {
                  div.className += ' mine';
                  div.textContent = '💥';
                }
                if (cell.isFlagged) {
                  div.className += ' flag';
                  div.textContent = '🚩';
                }

                div.addEventListener('click', () => {
                  socket.emit('click', { x, y });
                });
                div.addEventListener('contextmenu', (e) => {
                  e.preventDefault();
                  socket.emit('flag', { x, y });
                });
                board.appendChild(div);
              });
            });
            status.textContent = 'Game Status: ' + gameState.status;
          }

          socket.on('gameState', updateBoard);
          socket.on('connect', () => {
            console.log('Connected to server');
          });
        </script>
      </body>
    </html>
  `);
});
=======
>>>>>>> 3364e8afd033ac2bdf2f9d16af5a4e80bf3540b9
