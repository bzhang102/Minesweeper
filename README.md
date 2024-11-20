# Multiplayer Minesweeper

A real-time cooperative Minesweeper game where multiple players can work together to clear the board.

## Project Structure

- **Core Game Logic**: Minesweeper engine, game rules, difficulty settings
- **Frontend**: Game board UI, settings interface, real-time updates
- **Multiplayer**: WebSocket handling, game state synchronization
- **Database**: User authentication, leaderboards, game history

## Technology Stack

- **Backend**: Node.js, hosted on Render
- **Frontend**: React, hosted on Netlify
- **WebSockets**: Socket.io
- **Development**: Nix for reproducible environments

## Development Setup

### Prerequisites
1. Install Nix:
```bash
sh <(curl -L https://nixos.org/nix/install)
```
2. Enable Flakes
```bash
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```
3. Enter Dev Environment:
```bash
nix develop
```
## Development Workflow

### Branch Structure
- `main` - Main development branch
- `feature/[feature-name]` - Individual feature branches

### Workflow Steps
#### 1. Starting New Work
- Create a new branch from `main`
- Use naming convention: `feature/game-logic`, `feature/multiplayer`, etc.
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature
```
#### 2. During Development
- Commit regularly with clear messages
- Keep pulls from main to stay updated
```bash
git commit -m "descriptive message"
git pull origin main
```
#### 3. Submitting Changes
- Push your feature branch
- Create a Pull Request (PR) to main
- ***GET A REVIEW BEFORE MERGING***

```bash
git push origin feature/your-feature
```
### Commit Messages
- Start with verb (add, fix, update)
- Be descriptive but concise
- Examples:
   - Add mine placement logic
   - Fix websocket disconnect issue
   - Update game settings UI

### Setup Instructions
1. Clone the repository
```bash
git clone https://github.com/bzhang102/Minesweeper.git
cd multiplayer-minesweeper
```
2. Enter Nix development environment
```bash
nix develop
```
3. Install dependencies
```bash
npm install
