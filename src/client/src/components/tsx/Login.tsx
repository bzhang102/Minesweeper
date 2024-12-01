import { useState, FormEvent, ChangeEvent } from "react";
import "../css/Login.css";

interface LoginProps {
  onSubmit: (username: string) => void;
}

export function Login({ onSubmit }: LoginProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;
    onSubmit(trimmedUsername);
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to Co-op Minesweeper</h1>
        <p>Enter a username to join a game</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Username"
            minLength={2}
            maxLength={20}
            required
          />

          <button type="submit" disabled={!username.trim()}>
            Start Playing
          </button>
        </form>
      </div>
    </div>
  );
}
