import { Users } from "../../types/clientTypes";
import { Cursor } from "./Cursor";
import "../css/PlayersPanel.css";

interface PlayersPanelProps {
  users: Users;
  userColors: { [uuid: string]: string };
  currentUsername: string;
  boardRef: React.RefObject<HTMLDivElement>;
}

export function PlayersPanel({
  users,
  userColors,
  currentUsername,
  boardRef,
}: PlayersPanelProps) {
  const renderCursors = () => {
    return Object.entries(users).map(([userUuid, user]) => {
      if (user.username === currentUsername) {
        return null;
      }
      return (
        <Cursor
          key={userUuid}
          color={userColors[userUuid]}
          x={user.state.x}
          y={user.state.y}
        />
      );
    });
  };

  return (
    <>
      <div className="users-legend">
        <h3>Players</h3>
        <div className="user-list">
          {Object.entries(users).map(([userUuid, user]) => (
            <div key={userUuid} className="user-item">
              <div
                className="user-color"
                style={{ backgroundColor: userColors[userUuid] }}
              />
              <div className="user-info">
                <span className="user-name">
                  {user.username}
                  {user.username === currentUsername && (
                    <span className="you-label"> (you)</span>
                  )}
                </span>
                <div className="user-stats">
                  <span className="squares-cleared">
                    Cleared: {user.squaresCleared || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {boardRef.current && (
        <div className="cursors-container">{renderCursors()}</div>
      )}
    </>
  );
}
