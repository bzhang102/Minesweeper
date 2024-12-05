import { useState } from "react";
import "../css/BestTimesPanel.css";

interface BestTimesPanelProps {
  bestTimes: {
    [key: string]: number | undefined;
  };
  bestTimePartners: {
    [key: string]: string[] | undefined;
  };
}

interface DifficultyLabels {
  [key: string]: string;
}

const formatBestTime = (seconds?: number): string => {
  if (typeof seconds !== "number") return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds / 60) % 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function BestTimesPanel({
  bestTimes,
  bestTimePartners,
}: BestTimesPanelProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  const difficultyLabels: DifficultyLabels = {
    easy: "Easy (8x8)",
    medium: "Medium (16x16)",
    hard: "Hard (24x24)",
  };

  const handleDifficultyChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedDifficulty(event.target.value);
  };

  const partners = bestTimePartners[selectedDifficulty];
  const partnerText =
    partners && partners.length > 0
      ? `With: ${partners.join(", ")}`
      : "No partners yet";

  return (
    <div className="best-times-panel">
      <h3>Best Times</h3>
      <div className="best-times-content">
        <select
          className="difficulty-select"
          value={selectedDifficulty}
          onChange={handleDifficultyChange}
          aria-label="Select difficulty"
        >
          <option value="">Select a Difficulty</option>
          {Object.entries(difficultyLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {selectedDifficulty && (
          <div className="time-section">
            <div className="time-label">Time</div>
            <div className="time-display">
              {formatBestTime(bestTimes[selectedDifficulty])}
            </div>
            <div className="partners-list">{partnerText}</div>
          </div>
        )}
      </div>
    </div>
  );
}
