import { BoardProps } from "../../types/clientTypes";
import { MainBoard } from "./MainBoard";
import "../css/Board.css";

export function Board({ socket, username, room, onLogout }: BoardProps) {
  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Co-op Minesweeper</h1>
      </div>
      <MainBoard
        socket={socket}
        username={username}
        room={room}
        onLogout={onLogout}
      />
    </div>
  );
}
