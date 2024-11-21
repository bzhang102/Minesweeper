import { useState } from "react";
import { JoinRoom } from "./JoinRoom";
import { CreateRoom } from "./CreateRoom";

interface WelcomeProps {
  setRoom: (room: string) => void;
}

export function WelcomePage({ setRoom }: WelcomeProps) {
  const [joinRoom, setJoinRoom] = useState(false);
  const [createRoom, setCreateRoom] = useState(false);
  const handleJoinRoom = () => setJoinRoom(true);
  const handleCreateRoom = () => setCreateRoom(true);
  if (joinRoom) {
    return <JoinRoom setRoom={setRoom} />;
  } else if (createRoom) {
    return <CreateRoom setRoom={setRoom} />;
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
