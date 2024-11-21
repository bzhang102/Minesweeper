import { useState } from "react";
import { JoinRoom } from "./JoinRoom";

interface WelcomeProps {
  setRoom: (room: string) => void;
}

function generateRandomFourDigits() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function WelcomePage({ setRoom }: WelcomeProps) {
  const [joinRoom, setJoinRoom] = useState(false);
  const [createRoom, setCreateRoom] = useState(false);
  const room = generateRandomFourDigits();
  const handleJoinRoom = () => setJoinRoom(true);
  const handleCreateRoom = () => setCreateRoom(true);
  if (joinRoom) {
    return <JoinRoom setRoom={setRoom} />;
  } else if (createRoom) {
    console.log("creating room");
  } else {
    return (
      <div>
        <div>
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
        <div>
          <button onClick={handleCreateRoom}>Create Room</button>
        </div>
      </div>
    );
  }
}

export default WelcomePage;
