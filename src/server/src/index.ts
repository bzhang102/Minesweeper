import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import {
  LobbyState,
  Dictionary,
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types/serverTypes";
import { ServerConfig, serverConfig } from "./config";
import { db } from "./services/DatabaseService";
import { RouteHandler } from "./services/RouteService";
import { SocketHandler } from "./services/SocketService";
import { errorHandler } from "./services/ErrorService";

const PORT = process.env.PORT || 3000;

class GameServer {
  private app: express.Application;
  private server: http.Server;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private gameRooms: Dictionary<LobbyState>;
  private lobbies: Set<string>;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();
    this.server = http.createServer(this.app);
    this.gameRooms = {};
    this.lobbies = new Set();
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(
      this.server,
      {
        cors: {
          origin: this.config.CLIENT_URL,
          methods: ["GET", "POST", "OPTIONS"],
          credentials: true,
          allowedHeaders: ["Content-Type", "Authorization"],
        },
      }
    );

    this.setupMiddleware();
    this.setupServer();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    const corsOptions = {
      origin: this.config.CLIENT_URL,
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupServer(): void {
    // Set up socket handler

    // Set up route handler
    const routeHandler = new RouteHandler(db, this.gameRooms, this.lobbies);
    this.app.use("/", routeHandler.getRouter());

    // Set up socket handler
    const socketHandler = new SocketHandler(
      this.io,
      this.gameRooms,
      this.lobbies
    );
    this.io.on("connection", (socket) =>
      socketHandler.handleConnection(socket)
    );
  }

  private setupErrorHandling(): void {
    // Use the centralized error handling middleware
    this.app.use(errorHandler);

    // Keep the process handlers as they handle different concerns
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      this.gracefulShutdown();
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    process.on("SIGTERM", () => this.gracefulShutdown());
    process.on("SIGINT", () => this.gracefulShutdown());
  }

  private async gracefulShutdown(): Promise<void> {
    console.log("Starting graceful shutdown...");

    // Close database connection
    try {
      await db.close();
      console.log("Database connection closed");
    } catch (err) {
      console.error("Error closing database connection:", err);
    }

    // Close server
    this.server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      console.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 10000);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await db.connect();
      console.log("Connected to database");

      // Start server
      this.server.listen(this.config.PORT, () => {
        console.log(`Server running on port ${this.config.PORT}`);
        console.log(`Environment: ${this.config.NODE_ENV}`);
        console.log(`Client URL: ${this.config.CLIENT_URL}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new GameServer(serverConfig);
server.start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default GameServer;
