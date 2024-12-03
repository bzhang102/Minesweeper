import express, { Request, Response } from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord } from "./types/gameTypes";
import { Client } from 'pg';
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

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const corsOptions = {
  origin: serverConfig.CLIENT_URL,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};
// Body parsing middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  host: 'localhost',
  database: 'minesweeper_db',
  port: 5432
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Error connecting to database:', err));

// Validate room ID
const isFourDigits = (room: string): boolean => {
  return /^\d{4}$/.test(room);
};

// Main data structures for game state management
const gameRooms: Dictionary<LobbyState> = {};
let lobbies: Set<string> = new Set();


// Update the create account route
app.post("/create-account", async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required",
    });
  }
  const query = `SELECT * FROM persons WHERE username = $1`;
  const result = await client.query(query, [username]);
  if(result.rows.length != 0){
    return res.status(401).json({
      error: "Error: Username Already Taken",
    });
  }
  //else{console.log("SUCESSSSSSSSS")}

  try {
    const query = `INSERT INTO persons (username, userpassword, accesstoken) VALUES ($1, $2, $3) RETURNING *`;
    const accessToken = "eee"; 
    const values = [username, password, accessToken];

    const result = await client.query(query, values);

    res.status(201).json({
      message: "Account created successfully",
      user: result.rows[0], 
      ok: true
    });
  } catch (error) {
    console.error("Error creating account:", error);


    res.status(500).json({
      error: "Failed to create account",
    });
  }
});

// Update the best time route to handle different difficulties
app.post("/update-best-time", async (req, res) => {
  console.log("Best time update")
  const { username, solveTime, partners, difficulty } = req.body;

  // Validate input
  if (!username || solveTime === undefined || !Array.isArray(partners) || !difficulty) {
    return res.status(400).json({
      error: "Invalid input parameters",
    });
  }

  // Validate difficulty level
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({
      error: "Invalid difficulty level",
    });
  }

  try {
    // Create column names based on difficulty
    const timeColumn = `${difficulty}_solve_time`;
    const partnersColumn = `${difficulty}_solve_partners`;

    // Query to find the current best time for the user at this difficulty
    const currentBestQuery = `
      SELECT ${timeColumn}
      FROM persons 
      WHERE username = $1
    `;
    const currentBestResult = await client.query(currentBestQuery, [username]);

    // If no current best time or new time is faster, update
    const currentBestTime = currentBestResult.rows[0]?.[timeColumn];
    if (currentBestTime === null || solveTime < currentBestTime) {
      const updateQuery = `
        UPDATE persons 
        SET 
          ${timeColumn} = $2, 
          ${partnersColumn} = $3 
        WHERE username = $1 
        RETURNING ${timeColumn}, ${partnersColumn}
      `;
      
      const updateResult = await client.query(updateQuery, [
        username, 
        solveTime, 
        partners
      ]);

      return res.status(200).json({
        message: "Best time updated successfully",
        bestTime: updateResult.rows[0][timeColumn],
        partners: updateResult.rows[0][partnersColumn],
        difficulty: difficulty,
        updated: true
      });
    }

    // If current time is faster or equal, return current best
    res.status(200).json({
      message: "Current best time not beaten",
      bestTime: currentBestTime,
      difficulty: difficulty,
      updated: false
    });
  } catch (error) {
    console.error("Error updating best time:", error);
    res.status(500).json({
      error: "Failed to update best time",
    });
  }
});

// Update the get best time route to handle different difficulties
app.get("/get-best-time/:username", async (req, res) => {
  const { username } = req.params;
  const { difficulty } = req.query;

  try {
    let query;
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty as string)) {
      // If difficulty is specified, return only that difficulty's time and partners
      query = `
        SELECT 
          ${difficulty}_solve_time as solve_time,
          ${difficulty}_solve_partners as solve_partners
        FROM persons 
        WHERE username = $1
      `;
    } else {
      // If no difficulty specified, return all difficulties
      query = `
        SELECT 
          easy_solve_time,
          medium_solve_time,
          hard_solve_time,
          easy_solve_partners,
          medium_solve_partners,
          hard_solve_partners
        FROM persons 
        WHERE username = $1
      `;
    }
    
    const result = await client.query(query, [username]);

    if (result.rows.length > 0) {
      res.status(200).json({
        data: result.rows[0]
      });
    } else {
      res.status(404).json({
        error: "User not found"
      });
    }
  } catch (error) {
    console.error("Error retrieving best time:", error);
    res.status(500).json({
      error: "Failed to retrieve best time",
    });
  }
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

async function findPersonByUsernameAndPassword(username:string, password: string) {
  const query = `SELECT * FROM persons WHERE username = $1 AND userpassword = $2`;

  try {
    const result = await client.query(query, [username, password]);
    if (result.rows.length > 0) {
      console.log('Person found:', result.rows[0]);
      return true 
    } else {
      console.log('No person found wwwith the given username and password.');
      return false; 
    }
  } catch (error) {
    console.error('Error querying the persons table:', error);
    throw error; 
  }
}
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required",
    });
  }

  try {
    // Insert the user into the database
    let t = await findPersonByUsernameAndPassword(username, password)

    // Respond only after the database operation succeeds
    console.log(t)
    if (t){
      res.status(201).json({
        message: "Account found",
        user: t, // Send back the created user (excluding sensitive fields)
        ok: true
      });
    }
    else{
      res.status(401).json({
        message: "Account not found",
        user: false, // Send back the created user (excluding sensitive fields)
      });
    }
  } catch (error) {
    // General error response
    res.status(500).json({
      error: "internal error",
    });
  }
});


// Validate room ID
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: corsOptions,
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
let globalTimerInterval: NodeJS.Timeout | null = null;

const connections: Dictionary<Socket> = {};
const users: Dictionary<User> = {};
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

// Function to start timer if it's not already running
const startGlobalTimer = () => {
  if (!globalTimerInterval) {
    console.log("Starting global timer");
    game.startTimer();
    globalTimerInterval = setInterval(() => {
      //game.getElapsedTime();
      io.emit("gameState", game.getGameState());
    }, 1000);
  }
};

// Function to stop timer if no users are connected
const stopGlobalTimer = () => {
  if (globalTimerInterval && Object.keys(connections).length === 0) {
    console.log("Stopping global timer - no users connected");
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
    game.resetTimer();
  }
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
    socket.emit("gameState", game.getGameState());
    // startGlobalTimer(); // Start timer if it's not running
    console.log(`UUID is ${uuid} and room is ${room}`);
    emitGameUpdate(room);
    socket.emit("uuid", uuid);
    socket.emit("lobbies", lobbies);

    // Various Event Listeners
    socket.on("cursor_movement", (cursorPosition: User["state"]) => {
      handleMovement(cursorPosition, uuid, room);
    });

    socket.on("disconnect", () => {
      handleClose(uuid, room);
      // stopGlobalTimer();
  });

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

    // socket.on("gameEnd", () => {
    //   if (globalTimerInterval) {
    //     clearInterval(globalTimerInterval);
    //   }
    // });
  }
);


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
