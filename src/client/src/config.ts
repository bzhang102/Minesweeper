interface Config {
  SERVER_URL: string;
  CLIENT_URL: string;
}

export const config: Config = {
  SERVER_URL: import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
  CLIENT_URL: import.meta.env.VITE_CLIENT_URL || "http://localhost:5173",
};
