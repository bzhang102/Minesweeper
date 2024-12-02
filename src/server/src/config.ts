interface ServerConfig {
  PORT: number;
  CLIENT_URL: string;
  NODE_ENV: string;
}

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
};
