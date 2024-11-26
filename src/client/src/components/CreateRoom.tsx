import { useState } from "react";

interface CreateRoomProps {
  setRoom: (room: string) => void;
}

interface GameSettings {
  width: number;
  height: number;
  mines: number;
}

// TODO Write more code to prevent generating a random room code which is already active
function generateRandomFourDigits() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
export function CreateRoom({ setRoom }: CreateRoomProps) {
  const [customSettings, setCustomSettings] = useState<GameSettings>({
    width: 0,
    height: 0,
    mines: 0,
  });

  async function generateLobby(gameConfig: GameSettings, lobby: string) {
    console.log("generating lobby");
    //TODO change this localhost url with the deployed server url
    return fetch("http://localhost:3000/create-lobby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameConfig: gameConfig, room: lobby }),
    })
      .then((_) => {
        setRoom(lobby);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  const room = generateRandomFourDigits();

  const handleDifficultyClick = (difficulty: string) => {
    const easyConfig = { width: 8, height: 8, mines: 10 };
    const mediumConfig = { width: 16, height: 16, mines: 40 };
    const hardConfig = { width: 24, height: 24, mines: 99 };

    if (difficulty === "easy") {
      generateLobby(easyConfig, room);
    } else if (difficulty === "medium") {
      generateLobby(mediumConfig, room);
    } else if (difficulty === "hard") {
      generateLobby(hardConfig, room);
    }
    // Add your logic for handling difficulty selection here
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomSettings((prev) => ({
      ...prev,
      [name]: parseInt(value, 10),
    }));
  };

  const handleCustomSubmit = () => {
    generateLobby(customSettings, room);
  };

  return (
    <div>
      <h2>Select Difficulty</h2>
      <div>
        <button onClick={() => handleDifficultyClick("easy")}>Easy</button>
        <button onClick={() => handleDifficultyClick("medium")}>Medium</button>
        <button onClick={() => handleDifficultyClick("hard")}>Hard</button>
      </div>

      <h2>Custom Settings</h2>
      <div>
        <input
          type="number"
          name="width"
          value={customSettings.width}
          onChange={handleCustomChange}
          placeholder="width"
        />
        <input
          type="number"
          name="height"
          value={customSettings.height}
          onChange={handleCustomChange}
          placeholder="Height"
        />
        <input
          type="number"
          name="mines"
          value={customSettings.mines}
          onChange={handleCustomChange}
          placeholder="Number of Mines"
        />
        <button onClick={handleCustomSubmit}>Submit</button>
      </div>
    </div>
  );
}
export default CreateRoom;
