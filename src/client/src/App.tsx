import { Board } from "./components/Board";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <div className="game-container">
        <h1 className="game-title">Co-Op Minesweeper</h1>
        <Board />
      </div>
    </div>
  );
}

export default App;
