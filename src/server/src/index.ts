// src/server/src/index.ts
import express from "express";
import { Socket, Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { GameState } from "./game/GameState";
import { Coord } from "./types/gameTypes";
import { User, Dictionary } from "./types/serverTypes";
import cors from "cors";
import { Client } from 'pg';

const PORT = process.env.PORT || 3000; // Add this line
const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://coopminesweeper.netlify.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);

const client = new Client({
  host: 'localhost',
  database: 'minesweeper_db',
  port: 5432
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Error connecting to database:', err));



// Update the create account route
app.post("/create-account", async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required",
    });
  }

  try {
    // Insert the user into the database with default solve time and partners
    const query = `
      INSERT INTO persons 
      (username, userpassword, accesstoken, quickest_solve_time, solve_partners) 
      VALUES ($1, $2, $3, NULL, ARRAY[]::TEXT[]) 
      RETURNING *
    `;
    const accessToken = "eee"; // Replace this with actual token generation logic
    const values = [username, password, accessToken];

    const result = await client.query(query, values);

    // Respond only after the database operation succeeds
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

// New route to update quickest solve time
app.post("/update-best-time", async (req, res) => {
  const { username, solveTime, partners } = req.body;

  // Validate input
  if (!username || solveTime === undefined || !Array.isArray(partners)) {
    return res.status(400).json({
      error: "Invalid input parameters",
    });
  }

  try {
    // Query to find the current best time for the user
    const currentBestQuery = `
      SELECT quickest_solve_time 
      FROM persons 
      WHERE username = $1
    `;
    const currentBestResult = await client.query(currentBestQuery, [username]);

    // If no current best time or new time is faster, update
    const currentBestTime = currentBestResult.rows[0]?.quickest_solve_time;
    if (currentBestTime === null || solveTime < currentBestTime) {
      const updateQuery = `
        UPDATE persons 
        SET 
          quickest_solve_time = $2, 
          solve_partners = $3 
        WHERE username = $1 
        RETURNING quickest_solve_time, solve_partners
      `;
      
      const updateResult = await client.query(updateQuery, [
        username, 
        solveTime, 
        partners
      ]);

      return res.status(200).json({
        message: "Best time updated successfully",
        bestTime: updateResult.rows[0].quickest_solve_time,
        partners: updateResult.rows[0].solve_partners,
        updated: true
      });
    }

    // If current time is faster or equal, return current best
    res.status(200).json({
      message: "Current best time not beaten",
      bestTime: currentBestTime,
      updated: false
    });
  } catch (error) {
    console.error("Error updating best time:", error);
    res.status(500).json({
      error: "Failed to update best time",
    });
  }
});

// New route to get user's best time
app.get("/get-best-time/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const query = `
      SELECT quickest_solve_time, solve_partners 
      FROM persons 
      WHERE username = $1
    `;
    const result = await client.query(query, [username]);

    if (result.rows.length > 0) {
      res.status(200).json({
        bestTime: result.rows[0].quickest_solve_time,
        partners: result.rows[0].solve_partners
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

async function findPersonByUsernameAndPassword(username:string, password: string) {
  // Define the SQL query
  const query = `SELECT * FROM persons WHERE username = $1 AND userpassword = $2`;

  try {
    // Execute the query with username and password as parameters
    const result = await client.query(query, [username, password]);
    // Check if a record was found
    if (result.rows.length > 0) {
      console.log('Person found:', result.rows[0]);
      return true // Return the found person
    } else {
      console.log('No person found wwwith the given username and password.');
      return false; // No match found
    }
  } catch (error) {
    console.error('Error querying the persons table:', error);
    throw error; // Re-throw the error for handling elsewhere
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

const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin: ['*', "https://coopminesweeper.netlify.app"],
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
