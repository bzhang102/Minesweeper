import { useState, useEffect, FormEvent, ChangeEvent } from "react";

interface JoinRoomProps {
  setRoom: (room: string) => void;
}

// TODO prevent user from joining room that isn't established

export function JoinRoom({ setRoom }: JoinRoomProps) {
  const [roomID, setRoomID] = useState("");
  const [validRoomID, setValidRoomId] = useState(false);

  function checkLobbies(str: string) {
    return fetch("http://localhost:3000/check-lobbies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lobby: str }),
    })
      .then((response) => response.json())
      .then((data) => setValidRoomId(data.isInSet))
      .catch((error) => {
        console.error("Error:", error);
        return false;
      });
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedRoomID = roomID.trim();
    if (!validRoomID) return;
    setRoom(trimmedRoomID);
  };

  const handleRoomIDChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newRoomID = e.target.value;
    setRoomID(newRoomID);
    if (newRoomID.length === 4) {
      checkLobbies(newRoomID);
    } else {
      setValidRoomId(false);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <p>Enter a 4 digit code to join the room</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roomID}
            onChange={handleRoomIDChange}
            placeholder="Room ID"
            minLength={4}
            maxLength={4}
            required
          />

          <button type="submit" disabled={!validRoomID}>
            Start Playing
          </button>
        </form>
      </div>
    </div>
  );
}
export default JoinRoom;
