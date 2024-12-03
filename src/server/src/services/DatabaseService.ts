import { Client } from "pg";
import { serverConfig } from "../config";
import crypto from "crypto";

export class DatabaseService {
  private client: Client;
  private static instance: DatabaseService;

  private constructor() {
    // First connect to default postgres database to ensure we can create our target database
    this.client = new Client({
      host: serverConfig.DB.HOST,
      port: serverConfig.DB.PORT,
      database: "postgres", // Connect to postgres database first
      user: serverConfig.DB.USER,
      password: serverConfig.DB.PASSWORD,
      ssl:
        serverConfig.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();

      // Check if our target database exists
      const result = await this.client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [serverConfig.DB.NAME]
      );

      // If database doesn't exist, create it
      if (result.rows.length === 0) {
        // Need to use template0 to avoid encoding issues
        await this.client.query(
          `CREATE DATABASE ${serverConfig.DB.NAME} TEMPLATE template0`
        );
        console.log(`Created database ${serverConfig.DB.NAME}`);
      }

      // Close the connection to postgres database
      await this.client.end();

      // Reconnect to our target database
      this.client = new Client({
        host: serverConfig.DB.HOST,
        port: serverConfig.DB.PORT,
        database: serverConfig.DB.NAME,
        user: serverConfig.DB.USER,
        password: serverConfig.DB.PASSWORD,
        ssl:
          serverConfig.NODE_ENV === "production"
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
      });

      await this.client.connect();
      console.log(`Connected to database ${serverConfig.DB.NAME}`);

      // Test the connection
      const testResult = await this.client.query("SELECT NOW()");
      console.log("Database connection test successful:", testResult.rows[0]);
    } catch (err) {
      console.error("Database connection error:", err);
      throw err;
    }
  }

  public async createAccount(username: string, password: string): Promise<any> {
    const checkQuery = `SELECT * FROM persons WHERE username = $1`;
    const result = await this.client.query(checkQuery, [username]);

    if (result.rows.length !== 0) {
      throw new Error("Username Already Taken");
    }

    // generate access token
    const accessToken = crypto.randomBytes(32).toString("hex");
    const insertQuery = `
      INSERT INTO persons (username, userpassword, accesstoken) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const values = [username, password, accessToken];

    return await this.client.query(insertQuery, values);
  }

  public async validateLogin(
    username: string,
    password: string
  ): Promise<boolean> {
    const query = `SELECT * FROM persons WHERE username = $1 AND userpassword = $2`;

    try {
      const result = await this.client.query(query, [username, password]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error querying the persons table:", error);
      throw error;
    }
  }

  public async updateBestTime(
    username: string,
    solveTime: number,
    partners: string[],
    difficulty: string
  ): Promise<any> {
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      throw new Error("Invalid difficulty level");
    }

    const timeColumn = `${difficulty}_solve_time`;
    const partnersColumn = `${difficulty}_solve_partners`;

    const currentBestQuery = `
      SELECT ${timeColumn}
      FROM persons 
      WHERE username = $1
    `;
    const currentBestResult = await this.client.query(currentBestQuery, [
      username,
    ]);
    const currentBestTime = currentBestResult.rows[0]?.[timeColumn];

    if (currentBestTime === null || solveTime < currentBestTime) {
      const updateQuery = `
        UPDATE persons 
        SET ${timeColumn} = $2, ${partnersColumn} = $3 
        WHERE username = $1 
        RETURNING ${timeColumn}, ${partnersColumn}
      `;

      const result = await this.client.query(updateQuery, [
        username,
        solveTime,
        partners,
      ]);

      return {
        bestTime: result.rows[0][timeColumn],
        partners: result.rows[0][partnersColumn],
        difficulty,
        updated: true,
      };
    }

    return {
      bestTime: currentBestTime,
      difficulty,
      updated: false,
    };
  }

  public async getBestTime(
    username: string,
    difficulty?: string
  ): Promise<any> {
    let query;
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      query = `
        SELECT 
          ${difficulty}_solve_time as solve_time,
          ${difficulty}_solve_partners as solve_partners
        FROM persons 
        WHERE username = $1
      `;
    } else {
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

    const result = await this.client.query(query, [username]);
    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return result.rows[0];
  }

  public async close(): Promise<void> {
    await this.client.end();
  }
}

export const db = DatabaseService.getInstance();
