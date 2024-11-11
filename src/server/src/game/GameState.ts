// src/server/src/game/GameState.ts
import { BoardConfig, Coord, Cell } from "../types/gameTypes";

enum GameStatus {
  PLAYING,
  WON,
  LOST,
}

export class GameState {
  private board: Cell[][];
  private status: GameStatus = GameStatus.PLAYING;
  private firstClick = true;

  // init board
  public constructor(config: BoardConfig) {
    this.board = Array(config.height)
      .fill(null)
      .map(() =>
        Array(config.width)
          .fill(null)
          .map(() => ({
            isMine: false,
            isExploded: false,
            isRevealed: false,
            adjMines: 0,
            isFlagged: false,
          }))
      );

    // place mines at random
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      const x = Math.floor(Math.random() * config.width);
      const y = Math.floor(Math.random() * config.height);

      if (!this.board[y][x].isMine) {
        this.board[y][x].isMine = true;
        minesPlaced++;
      }
    }

    // count number of mines adjacent to each square
    this.calculateAdjacentMines();
  }

  // update board with a move
  public click(move: Coord) {
    // if game isn't in play return
    if (this.status !== GameStatus.PLAYING) return false;

    let cell = this.board[move.y][move.x];

    // allow for safe first clicks
    if (this.firstClick) {
      if (cell.isMine) {
        this.moveMine(move);
      }
      this.firstClick = false;
    }

    if (cell.isMine) {
      cell.isExploded = true;
      this.status = GameStatus.LOST;
      return false;
    }
    if (!cell.isRevealed) {
      this.explore(move);
    }

    if (this.checkWin()) {
      this.status = GameStatus.WON;
    }
    return true;
  }

  // update flags
  public flag(coord: Coord) {
    const cell = this.board[coord.y][coord.x];
    if (!cell.isRevealed && this.status === GameStatus.PLAYING) {
      cell.isFlagged = !cell.isFlagged;
      return true;
    }
    return false;
  }

  private checkWin(): boolean {
    for (const row of this.board) {
      for (const cell of row) {
        if (!cell.isMine && !cell.isRevealed) {
          return false;
        }
      }
    }
    return true;
  }

  private calculateAdjacentMines() {
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[0].length; x++) {
        if (!this.board[y][x].isMine) {
          this.board[y][x].adjMines = this.getNeighboringMines({ x, y });
        }
      }
    }
  }

  // helper to count adjacent mines
  private getNeighboringMines(coord: Coord): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const newY = coord.y + dy;
        const newX = coord.x + dx;

        if (
          newY >= 0 &&
          newY < this.board.length &&
          newX >= 0 &&
          newX < this.board[0].length &&
          this.board[newY][newX].isMine
        ) {
          count++;
        }
      }
    }
    return count;
  }

  // helper to help propogate a click on an empty square recursively
  private explore(coord: Coord) {
    // check bounds
    if (
      coord.x < 0 ||
      coord.x >= this.board[0].length ||
      coord.y < 0 ||
      coord.y >= this.board.length
    ) {
      return;
    }

    let cell = this.board[coord.y][coord.x];

    // check to see if already explored
    if (cell.isRevealed) {
      return;
    }
    // reveal this cell
    cell.isRevealed = true;

    // recursively explore neighbors
    if (cell.adjMines == 0) {
      this.explore({ x: coord.x + 1, y: coord.y + 1 });
      this.explore({ x: coord.x + 1, y: coord.y });
      this.explore({ x: coord.x + 1, y: coord.y - 1 });
      this.explore({ x: coord.x - 1, y: coord.y + 1 });
      this.explore({ x: coord.x - 1, y: coord.y });
      this.explore({ x: coord.x - 1, y: coord.y - 1 });
      this.explore({ x: coord.x, y: coord.y + 1 });
      this.explore({ x: coord.x, y: coord.y - 1 });
    }
  }

  // helper to move mine on first click
  private moveMine(move: Coord) {
    this.board[move.y][move.x].isMine = false;

    // Find first available non-mine spot
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[0].length; x++) {
        if (!this.board[y][x].isMine && (x !== move.x || y !== move.y)) {
          this.board[y][x].isMine = true;
          // recalculate mine counts
          this.calculateAdjacentMines();
          return;
        }
      }
    }
  }

  // for debugging
  public debugPrint() {
    for (const row of this.board) {
      console.log(
        row
          .map((cell) => {
            if (cell.isMine) return "M";
            if (cell.isFlagged) return "F";
            if (!cell.isRevealed) return ".";
            return cell.adjMines.toString();
          })
          .join(" ")
      );
    }
  }

  // sends data to players
  public getGameState() {
    return {
      board: this.board.map((row) =>
        row.map((cell) => ({
          isRevealed: cell.isRevealed,
          isExploded: cell.isExploded,
          isFlagged: cell.isFlagged,
          // Only send adjMines if cell is revealed
          adjMines: cell.isRevealed ? cell.adjMines : null,
          // Only show mine if game is over
          isMine: this.status !== GameStatus.PLAYING ? cell.isMine : null,
        }))
      ),
      status: this.status,
    };
  }
}
