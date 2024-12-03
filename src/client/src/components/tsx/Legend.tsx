import { Users } from "../../types/clientTypes";
import "../css/Legend.css";

interface UserLegendProps {
  users: Users;
  userColors: { [uuid: string]: string };
  currentUsername: string;
}

export function UserLegend({
  users,
  userColors,
  currentUsername,
}: UserLegendProps) {
  return (
    <div className="users-legend">
      <h3>Players</h3>
      <div className="user-list">
        {Object.entries(users).map(([userUuid, user]) => (
          <div key={userUuid} className="user-item">
            <div
              className="user-color"
              style={{ backgroundColor: userColors[userUuid] }}
            />
            <span className="user-name">
              {user.username}
              {user.username === currentUsername && (
                <span className="you-label"> (you)</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
