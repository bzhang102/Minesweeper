# Multiplayer Minesweeper

A real-time cooperative Minesweeper game where multiple players can work together to clear the board.

## Features

- **Guest Login**: Play without creating an account using the guest login option
- **User Accounts**: Create persistent accounts to save your best times and game history
- **Real-time Multiplayer**: Join rooms with friends or other players
- **Multiple Difficulties**: Easy (8x8), Medium (16x16), and Hard (24x24) game modes
- **Leaderboards**: Track your best completion times across all difficulties

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

- `main` - Deployed branch
- `dev` - Development branch
- `feature/[feature-name]` - Individual feature branches

### Workflow Steps

#### 1. Starting New Work

- Create a new branch from `dev`
- Use naming convention: `feature/game-logic`, `feature/multiplayer`, etc.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature
```

#### 2. During Development

- Commit regularly with clear messages
- Keep pulls from dev to stay updated

```bash
git commit -m "descriptive message"
git pull origin dev
```

#### 3. Submitting Changes

- Push your feature branch
- Create a Pull Request (PR) to dev
- **_GET A REVIEW BEFORE MERGING_**

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

```

### Running the Application

#### Start the Server

```bash
cd src/server
npm install
npm start
```

The server will run on `http://localhost:3000`

#### Start the Client

```bash
cd src/client
npm install
npm run dev
```

The client will run on `http://localhost:5173`

#### Guest Login

- Click the "Play as Guest" button on the login page
- A unique guest username will be generated for you
- You can play immediately without creating an account
- Note: Guest users won't have persistent game statistics

#### Creating an Account

- Click "Create Account" to register a new user
- Your game statistics and best times will be saved
- You can log in with your credentials on future visits
