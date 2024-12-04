import { Router, Request, Response, response } from "express";
import { GameState } from "../game/GameState";
import { DatabaseService } from "./DatabaseService";
import {
  LobbyState,
  Dictionary,
  CheckLobbyRequest,
  CreateLobbyRequest,
} from "../types/serverTypes";
import { validate } from "uuid";

export class RouteHandler {
  private router: Router;
  private db: DatabaseService;
  private gameRooms: Dictionary<LobbyState>;
  private lobbies: Set<string>;

  constructor(
    db: DatabaseService,
    gameRooms: Dictionary<LobbyState>,
    lobbies: Set<string>,
  ) {
    this.router = Router();
    this.db = db;
    this.gameRooms = gameRooms;
    this.lobbies = lobbies;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.router.get("/", this.healthCheck.bind(this));

    // Auth routes
    this.router.post("/create-account", this.createAccount.bind(this));
    this.router.post("/login", this.login.bind(this));
    this.router.post("/cookie", this.cookie.bind(this));
    this.router.post("/logout", this.logout.bind(this));
    // Game stats routes
    this.router.post("/update-best-time", this.updateBestTime.bind(this));
    this.router.get("/get-best-time/:username", this.getBestTime.bind(this));

    // Lobby routes
    this.router.post("/check-lobbies", this.checkLobbies.bind(this));
    this.router.post("/create-lobby", this.createLobby.bind(this));
  }

  private healthCheck(req: Request, res: Response): void {
    res.send({
      status: "ok",
      message: "Minesweeper server running",
      timestamp: new Date().toISOString(),
    });
  }

  private async createAccount(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    try {
      const result = await this.db.createAccount(username, password);
      const token = await this.db.addAccessToken(username, password);
      res.cookie("session", token[0], {
        httpOnly: true,
        sameSite: "lax",
        expires: token[1],
        path: "/",
        secure: true,
      });
      res.status(201).json({
        message: "Account created successfully",
        user: result.rows[0],
        ok: true,
      });
    } catch (error: any) {
      if (error.message === "Username Already Taken") {
        res.status(401).json({ error: "Error: Username Already Taken" });
      } else {
        console.error("Error creating account:", error);
        res.status(500).json({ error: "Failed to create account" });
      }
    }
  }
  private async parseCookies(cookieHeader: string): Promise<Record<string, string>> {
    if (!cookieHeader) return {};
    return cookieHeader.split(";").reduce((cookies, cookie) => {
        const [key, value] = cookie.split("=").map((c) => c.trim());
        if (key && value) cookies[key] = value;
        return cookies;
    }, {} as Record<string, string>);
  }

  private async cookie(req: Request, res: Response): Promise<void> {
    const cookies = req.headers.cookie;

    if (!cookies) {
        res.status(400).json({ error: "No cookies found" });
        return;
    }

    // Parse the cookies
    const parsedCookies = await this.parseCookies(cookies);

    // Extract the session cookie
    const sessionCookie = parsedCookies.session;

    if (!sessionCookie) {
        res.status(401).json({ error: "Session cookie not found" });
        return;
    }

    // Validate session
    try {
        const isValid = await this.db.validateSession(sessionCookie);
        const name = await this.db.getUser(sessionCookie)
        if (isValid) {
            res.status(200).json({
                message: "Token found",
                name: name,
                ok: true,
            });
        } else {
            res.status(401).json({ error: "Invalid session token" });
        }
    } catch (error) {
        console.error("Error validating session:", error);
        res.status(500).json({ error: "Failed to validate session" });
    }
  }

  private async logout (req: Request, res: Response): Promise<void> {

    res.clearCookie("session", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    res.status(200).json({ ok: true, message: "Logged out successfully" });
  }
  

  private async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    try {
      const isValid = await this.db.validateLogin(username, password);
      if (isValid) {
        const result = await this.db.addAccessToken(username, password)
        res.cookie("session", result[0], {
          httpOnly: true,
          sameSite: "lax",
          expires: result[1],
          path: "/",
          secure: true,
        });
        res.status(201).json({
          message: "Account found",
          ok: true,
        });
      } else {
        res.status(401).json({
          message: "Account not found",
          ok: false,
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal error" });
    }
  }

  private async updateBestTime(req: Request, res: Response): Promise<void> {
    const { username, solveTime, partners, difficulty } = req.body;

    if (
      !username ||
      solveTime === undefined ||
      !Array.isArray(partners) ||
      !difficulty
    ) {
      res.status(400).json({ error: "Invalid input parameters" });
      return;
    }

    try {
      const result = await this.db.updateBestTime(
        username,
        solveTime,
        partners,
        difficulty,
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating best time:", error);
      res.status(500).json({ error: "Failed to update best time" });
    }
  }

  private async getBestTime(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const { difficulty } = req.query;

    try {
      const result = await this.db.getBestTime(username, difficulty as string);
      res.status(200).json({ data: result });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ error: "User not found" });
      } else {
        console.error("Error retrieving best time:", error);
        res.status(500).json({ error: "Failed to retrieve best time" });
      }
    }
  }

  private checkLobbies(req: CheckLobbyRequest, res: Response): void {
    const { lobby } = req.body;
    const isInSet = this.lobbies.has(lobby);
    res.json({ isInSet });
  }

  private createLobby(req: CreateLobbyRequest, res: Response): void {
    const { gameConfig, room } = req.body;
    console.log(`Creating Room ${room}`);

    this.gameRooms[room] = {
      board: new GameState(gameConfig),
      config: gameConfig,
      users: {},
      connections: {},
    };
    console.log(`Created Room ${room}`);
    console.log(this.gameRooms[room]);
    this.lobbies.add(room);

    res.send({
      status: "ok",
      message: "Minesweeper lobby generated",
      timestamp: new Date().toISOString(),
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}
