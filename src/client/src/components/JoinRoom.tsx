import { useState, FormEvent, ChangeEvent } from "react";

interface JoinRoomProps {
  setRoom: (room: string) => void;
}

// TODO prevent user from joining room that isn't established

export function JoinRoom({ setRoom }: JoinRoomProps) {
  const [roomID, setRoomID] = useState("");
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedRoomID = roomID.trim();
    if (!trimmedRoomID) return;
    setRoom(trimmedRoomID);
  };

  const handleRoomIDChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRoomID(e.target.value);
  };

  const isFourDigits = () => {
    return /^\d{4}$/.test(roomID);
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

          <button type="submit" disabled={!isFourDigits}>
            Start Playing
          </button>
        </form>
      </div>
    </div>
  );
}
export default JoinRoom;
