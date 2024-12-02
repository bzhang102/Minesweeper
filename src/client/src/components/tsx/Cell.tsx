import type { Cell as CellType, Coord } from "../../types/clientTypes";
import "../css/Cell.css";

interface CellProps {
  data: CellType;
  coord: Coord;
  over: boolean;
  onLeftClick: (coord: Coord) => void;
  onRightClick: (coord: Coord) => void;
}

export function Cell({
  data,
  coord,
  over,
  onLeftClick,
  onRightClick,
}: CellProps) {
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRightClick(coord);
  };

  const getContent = () => {
    if (data.isFlagged) return "🚩";
    if (data.isExploded) return "💥";
    if (data.isMine && over) return "💣";
    if (!data.isRevealed) return "";
    return data.adjMines || "";
  };

  const getCellClassName = () => {
    const classes = ["cell"];

    if (!data.isRevealed) {
      classes.push("cell-hidden");
    } else if (data.isExploded) {
      classes.push("cell-exploded");
    } else {
      classes.push("cell-revealed");
      if (data.adjMines) {
        classes.push(`cell-${data.adjMines}`);
      }
    }

    return classes.join(" ");
  };

  return (
    <button
      className={getCellClassName()}
      onClick={() => onLeftClick(coord)}
      onContextMenu={handleRightClick}
    >
      {getContent()}
    </button>
  );
}
