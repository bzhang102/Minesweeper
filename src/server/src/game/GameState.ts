import { join } from "path";
import {
  BoardConfig,
  Coord,
  Cell,
  GameStatus,
  Direction,
} from "../types/gameTypes";

export class GameState {
  private readonly board: Cell[][];
  private status: GameStatus = GameStatus.PLAYING;
  private firstClick = true;
  private flagsLeft: number;
  private readonly width: number;
  private readonly height: number;

  // Array of all possible directions for neighboring cells
  private static readonly DIRECTIONS: Direction[] = [
    { dx: -1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
  ];

  public constructor(config: BoardConfig) {
    this.width = config.width;
    this.height = config.height;
    this.flagsLeft = config.mines;
    this.board = this.initializeBoard(config);
    this.placeMines(config.mines);
    this.calculateAdjacentMines();
  }

  private initializeBoard(config: BoardConfig): Cell[][] {
    return Array(config.height)
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
  }

  private placeMines(mineCount: number): void {
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      if (!this.board[y][x].isMine) {
        this.board[y][x].isMine = true;
        minesPlaced++;
      }
    }
  }

  public click(move: Coord): boolean {
    if (!this.isValidMove(move)) {
      return false;
    }

    const cell = this.board[move.y][move.x];

    if (cell.isFlagged || this.status !== GameStatus.PLAYING) {
      return false;
    }

    if (this.firstClick) {
      this.handleFirstClick(move);
    }

    if (cell.isMine) {
      this.endGame(move);
      return false;
    }

    if (!cell.isRevealed) {
      this.explore(move);
      if (this.checkWin()) {
        this.status = GameStatus.WON;
      }
    } else if (cell.adjMines > 0) {
      this.handleNumberClick(move);
    }

    return true;
  }

  private isValidMove(coord: Coord): boolean {
    return (
      coord.x >= 0 &&
      coord.x < this.width &&
      coord.y >= 0 &&
      coord.y < this.height
    );
  }

  private handleFirstClick(move: Coord): void {
    if (this.board[move.y][move.x].isMine) {
      this.moveMine(move);
    }

    for (const dir of GameState.DIRECTIONS) {
      const newX = move.x + dir.dx;
      const newY = move.y + dir.dy;

      if (!this.isValidMove({ x: newX, y: newY })) {
        continue;
      }

      const adjacentCell = this.board[newY][newX];
      if (adjacentCell.isMine) {
        this.moveMine({ x: newX, y: newY });
      }
    }
    this.firstClick = false;
  }

  private endGame(move: Coord): void {
    this.board[move.y][move.x].isExploded = true;
    this.status = GameStatus.LOST;
  }

  public flag(coord: Coord): boolean {
    if (!this.isValidMove(coord) || this.status !== GameStatus.PLAYING) {
      return false;
    }

    const cell = this.board[coord.y][coord.x];
    if (cell.isRevealed) {
      return false;
    }

    if (cell.isFlagged) {
      cell.isFlagged = false;
      this.flagsLeft++;
      return true;
    }

    if (this.flagsLeft <= 0) {
      return false;
    }

    cell.isFlagged = true;
    this.flagsLeft--;
    return true;
  }

  private checkWin(): boolean {
    return this.board.every((row) =>
      row.every((cell) => cell.isMine || cell.isRevealed)
    );
  }

  private calculateAdjacentMines(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.board[y][x].isMine) {
          this.board[y][x].adjMines = this.getNeighboringMines({ x, y });
        }
      }
    }
  }

  private getNeighboringMines(coord: Coord): number {
    return GameState.DIRECTIONS.reduce((count, dir) => {
      const newY = coord.y + dir.dy;
      const newX = coord.x + dir.dx;

      if (
        this.isValidMove({ x: newX, y: newY }) &&
        this.board[newY][newX].isMine
      ) {
        count++;
      }
      return count;
    }, 0);
  }

  private handleNumberClick(coord: Coord): void {
    const cell = this.board[coord.y][coord.x];
    let flagCount = 0;
    let surroundingCells: Coord[] = [];

    // Count flags and collect unopened cells around the number
    for (const dir of GameState.DIRECTIONS) {
      const newX = coord.x + dir.dx;
      const newY = coord.y + dir.dy;

      if (!this.isValidMove({ x: newX, y: newY })) {
        continue;
      }

      const adjacentCell = this.board[newY][newX];
      if (adjacentCell.isFlagged) {
        flagCount++;
      } else if (!adjacentCell.isRevealed) {
        surroundingCells.push({ x: newX, y: newY });
      }
    }

    // If flags match the number, reveal all other surrounding cells
    if (flagCount === cell.adjMines) {
      for (const surroundingCoord of surroundingCells) {
        const surroundingCell =
          this.board[surroundingCoord.y][surroundingCoord.x];

        // If we hit a mine, end the game
        if (surroundingCell.isMine) {
          surroundingCell.isExploded = true;
          this.status = GameStatus.LOST;
          return;
        }

        // Otherwise reveal the cell and its neighbors if needed
        this.explore(surroundingCoord);
      }

      // Check for win after revealing cells
      if (this.checkWin()) {
        this.status = GameStatus.WON;
      }
    }
  }

  private explore(coord: Coord): void {
    if (!this.isValidMove(coord)) {
      return;
    }

    const cell = this.board[coord.y][coord.x];
    if (cell.isRevealed) {
      return;
    }

    // If the cell was flagged, increment flagsLeft since we're removing the flag
    if (cell.isFlagged) {
      cell.isFlagged = false;
      this.flagsLeft++;
    }

    cell.isRevealed = true;

    if (cell.adjMines === 0) {
      GameState.DIRECTIONS.forEach((dir) => {
        this.explore({
          x: coord.x + dir.dx,
          y: coord.y + dir.dy,
        });
      });
    }
  }

  private moveMine(move: Coord): void {
    this.board[move.y][move.x].isMine = false;

    const newSpot = this.findFirstAvailableSpot(move);
    if (newSpot) {
      this.board[newSpot.y][newSpot.x].isMine = true;
      this.calculateAdjacentMines();
    }
  }

  private findFirstAvailableSpot(excludeCoord: Coord): Coord | null {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (
          !this.board[y][x].isMine &&
          (x !== excludeCoord.x || y !== excludeCoord.y)
        ) {
          return { x, y };
        }
      }
    }
    return null;
  }

  public getGameState() {
    return {
      board: this.board.map((row) =>
        row.map((cell) => ({
          isRevealed: cell.isRevealed,
          isExploded: cell.isExploded,
          isFlagged: cell.isFlagged,
          adjMines: cell.isRevealed ? cell.adjMines : null,
          isMine: this.status !== GameStatus.PLAYING ? cell.isMine : null,
        }))
      ),
      status: this.status,
      flagsLeft: this.flagsLeft,
    };
  }
}
