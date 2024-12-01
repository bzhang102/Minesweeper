// Login.tsx
import { useState, FormEvent, MouseEvent } from "react";
import "../css/Login.css";

interface LoginProps {
  onSubmit: (username: string, room: string) => void;
}

export function Login({ onSubmit }: LoginProps) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState("");

  function generateRandomFourDigits() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const handleDifficultySelect = async (difficulty: string) => {
    if (!username.trim()) return;

    const gameConfigs = {
      easy: { width: 8, height: 8, mines: 10 },
      medium: { width: 16, height: 16, mines: 40 },
      hard: { width: 24, height: 24, mines: 99 },
    };

    const newRoom = generateRandomFourDigits();
    // const response = await fetch("http://localhost:3000/create-lobby", {
    const response = await fetch(
      "https://minesweeper-server-o2fa.onrender.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameConfig: gameConfigs[difficulty as keyof typeof gameConfigs],
          room: newRoom,
        }),
      }
    );

    if (response.ok) {
      onSubmit(username, newRoom);
    } else {
      setError("Failed to create room. Please try again.");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCreatingRoom) return; // Don't handle submit for create mode

    const trimmedUsername = username.trim();
    const trimmedRoom = room.trim();
    if (!trimmedUsername || !trimmedRoom) return;

    // const response = await fetch("http://localhost:3000/check-lobbies", {
    const response = await fetch(
      "https://minesweeper-server-o2fa.onrender.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobby: trimmedRoom }),
      }
    );
    const data = await response.json();

    if (!data.isInSet) {
      setError("This room does not exist. Please try another room code.");
      return;
    }

    setError("");
    onSubmit(trimmedUsername, trimmedRoom);
  };

  const handleSwitchMode = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsCreatingRoom(!isCreatingRoom);
    setError("");
    setRoom("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to Co-op Minesweeper</h1>
        <p>{isCreatingRoom ? "Create a new room" : "Join an existing room"}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            minLength={2}
            maxLength={20}
            required
          />

          {!isCreatingRoom && (
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Room Code"
              minLength={4}
              maxLength={4}
              required
            />
          )}

          {!isCreatingRoom && (
            <button type="submit" disabled={!username.trim() || !room.trim()}>
              Join Room
            </button>
          )}

          {isCreatingRoom && (
            <div className="difficulty-selection">
              <h2>Select Difficulty</h2>
              <div className="difficulty-buttons">
                <button
                  type="button"
                  onClick={() => handleDifficultySelect("easy")}
                  disabled={!username.trim()}
                >
                  Easy (8x8)
                </button>
                <button
                  type="button"
                  onClick={() => handleDifficultySelect("medium")}
                  disabled={!username.trim()}
                >
                  Medium (16x16)
                </button>
                <button
                  type="button"
                  onClick={() => handleDifficultySelect("hard")}
                  disabled={!username.trim()}
                >
                  Hard (24x24)
                </button>
              </div>
            </div>
          )}
        </form>

        {error && <p className="error-message">{error}</p>}

        <p className="switch-mode-link">
          <a href="#" onClick={handleSwitchMode}>
            {isCreatingRoom ? "Switch to Join Room" : "Switch to Create Room"}
          </a>
        </p>
      </div>
    </div>
  );
}
