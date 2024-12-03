import express, { Request, Response } from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord } from "./types/gameTypes";
import {
  LobbyState,
  User,
  Dictionary,
  ClientToServerEvents,
  ServerToClientEvents,
  CheckLobbyRequest,
  CreateLobbyRequest,
} from "./types/serverTypes";
import { serverConfig } from "./config";

// Server configuration
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const corsOptions = {
  origin: serverConfig.CLIENT_URL,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: corsOptions,
});

// Main data structures for game state management
const gameRooms: Dictionary<LobbyState> = {};
let lobbies: Set<string> = new Set();

// Heath check endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    status: "ok",
    message: "Minesweeper server running",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint to check if a lobby exists
app.post("/check-lobbies", (req: CheckLobbyRequest, res: Response) => {
  const { lobby } = req.body;
  const isInSet = lobbies.has(lobby);
  res.json({ isInSet });
});

// Endpoint to create a new game lobby
app.post("/create-lobby", (req: CreateLobbyRequest, res: Response) => {
  const { gameConfig, room } = req.body;
  console.log(`Creating Room ${room}`);

  // Initialize game state for the new room
  gameRooms[room] = {
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

// Helper for socket emissions
const emitGameUpdate = (room: string) => {
  io.to(room).emit("gameUpdate", {
    gameState: gameRooms[room].board.getGameState(),
    users: gameRooms[room].users,
  });
};

// Handler for cursor movement updates
const handleMovement = (
  cursorPosition: User["state"],
  uuid: string,
  room: string
): void => {
  // Update user's cursor position in game state
  gameRooms[room].users[uuid] = {
    ...gameRooms[room].users[uuid],
    state: cursorPosition,
  };

  emitGameUpdate(room);
};

// Handler for closed connection
const handleClose = (uuid: string, room: string): void => {
  console.log(`Disconnecting ${gameRooms[room].users[uuid].uuid}`);
  delete gameRooms[room].connections[uuid];
  delete gameRooms[room].users[uuid];

  if (Object.keys(gameRooms[room].users).length === 0) {
    lobbies.delete(room);
    delete gameRooms[room];
  }

  emitGameUpdate(room);
};

// Socket.IO connection handler
io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    // Extract username from connection query
    const username = String(socket.handshake.query["username"]);
    // Extract room ID from connection query
    const room = String(socket.handshake.query["room"]);
    // Generate unique ID for new user
    const uuid: string = uuidv4();

    socket.join(room);

    if (!gameRooms[room]) {
      console.log(`Room ${room} does not exist. Disconnecting client.`);
      socket.emit("error", "Room does not exist");
      socket.disconnect(true);
      return;
    }

    // Get reference to game instance for this room
    let game = gameRooms[room].board;

    console.log(`User connected with uuid ${uuid} to room ${room}`);
    // Store user's connection and initialize their state as off screen
    gameRooms[room].connections[uuid] = socket;
    gameRooms[room].users[uuid] = {
      uuid,
      username,
      state: {
        x: -30,
        y: -30,
      },
      squaresCleared: 0,
    };

    // Send initial game state to new user
    emitGameUpdate(room);
    socket.emit("uuid", uuid);
    socket.emit("lobbies", lobbies);

    // Various Event Listeners
    socket.on("cursor_movement", (cursorPosition: User["state"]) => {
      handleMovement(cursorPosition, uuid, room);
    });

    socket.on("disconnect", () => handleClose(uuid, room));

    socket.on("click", (move: Coord) => {
      game = gameRooms[room].board;
      const squaresCleared = game.click(move);

      if (squaresCleared > 0) {
        gameRooms[room].users[uuid] = {
          ...gameRooms[room].users[uuid],
          squaresCleared:
            (gameRooms[room].users[uuid].squaresCleared || 0) + squaresCleared,
        };

        emitGameUpdate(room);
      }
    });

    socket.on("flag", (move: Coord) => {
      game = gameRooms[room].board;
      game.flag(move);
      emitGameUpdate(room);
    });

    socket.on("reset", () => {
      gameRooms[room].board = new GameState(gameRooms[room].config);
      game = gameRooms[room].board;

      Object.keys(gameRooms[room].users).forEach((userUuid) => {
        gameRooms[room].users[userUuid] = {
          ...gameRooms[room].users[userUuid],
          squaresCleared: 0,
        };
      });

      emitGameUpdate(room);
    });
  }
);

// On server start
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
