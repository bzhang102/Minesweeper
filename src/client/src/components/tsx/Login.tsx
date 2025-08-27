import React, { useState, FormEvent } from "react";
import "../css/Login.css";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onGuestLogin: () => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGuestLogin }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGuestLoading, setIsGuestLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await onLogin(username, password);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setError("");

    try {
      await onGuestLogin();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="input-field"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />

          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          className="guest-button"
          onClick={handleGuestLogin}
          disabled={isGuestLoading}
        >
          {isGuestLoading ? "Joining as Guest..." : "Play as Guest"}
        </button>

        <div className="switch-page">
          Don't have an account? <a href="/create-account">Create Account</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
