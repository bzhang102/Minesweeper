export interface ServerConfig {
  PORT: number;
  CLIENT_URL: string;
  NODE_ENV: string;
  DB: DatabaseConfig;
}

export interface DatabaseConfig {
  HOST: string;
  PORT: number;
  NAME: string;
  USER: string;
  PASSWORD: string;
  URL: string;
}

export const serverConfig = {
  PORT: Number(process.env.PORT) || 3000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: Number(process.env.DB_PORT) || 5432,
    NAME: process.env.DB_NAME || "minesweeper_db",
    USER: process.env.DB_USER || "",
    PASSWORD: process.env.DB_PASSWORD || "",
    URL: process.env.DATABASE_URL || "",
  },
};
