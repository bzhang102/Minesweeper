import { useState, FormEvent, MouseEvent } from "react";
import "../css/JoinRoom.css";
import { config } from "../../config";

interface JoinRoomProps {
  username: string;
  onSubmit: (room: string) => void;
  onLogout: ()=>void
}

export function JoinRoom({ username, onSubmit, onLogout }: JoinRoomProps) {
  const [room, setRoom] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

  function generateRandomFourDigits() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const handleDifficultySelect = async (difficulty: string) => {
    if (isDisabled) return;
    setIsDisabled(true);
    const gameConfigs = {
      easy: { width: 8, height: 8, mines: 10 },
      medium: { width: 16, height: 16, mines: 40 },
      hard: { width: 24, height: 24, mines: 99 },
    };

    const newRoom = generateRandomFourDigits();
    const response = await fetch(`${config.SERVER_URL}/create-lobby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameConfig: gameConfigs[difficulty as keyof typeof gameConfigs],
        room: newRoom,
      }),
    });

    if (response.ok) {
      onSubmit(newRoom);
    } else {
      setError("Failed to create room. Please try again.");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCreatingRoom) return;

    const trimmedRoom = room.trim();
    if (!trimmedRoom) return;

    const response = await fetch(`${config.SERVER_URL}/check-lobbies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobby: trimmedRoom }),
    });
    const data = await response.json();

    if (!data.isInSet) {
      setError("This room does not exist. Please try another room code.");
      return;
    }

    setError("");
    onSubmit(trimmedRoom);
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
            placeholder="Username"
            readOnly
            disabled
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
            <button type="submit" disabled={!room.trim()}>
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
                  disabled={isDisabled}
                >
                  Easy (8x8)
                </button>
                <button
                  type="button"
                  onClick={() => handleDifficultySelect("medium")}
                  disabled={isDisabled}
                >
                  Medium (16x16)
                </button>
                <button
                  type="button"
                  onClick={() => handleDifficultySelect("hard")}
                  disabled={isDisabled}
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
        <button type="button" onClick={onLogout}>Logout</button>

      </div>
    </div>
  );
}
