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

const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin: ['http://localhost:5173', "https://coopminesweeper.netlify.app"],
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
