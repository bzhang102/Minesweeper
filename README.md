# Minesweeper

## Development Workflow

### Branch Structure
- `main` - Production branch, stable code only
- `dev` - Development branch, features are merged here first
- `feature/[feature-name]` - Individual feature branches

### Workflow Steps
1. **Starting New Work**
   - Create a new branch from `dev`
   - Use naming convention: `feature/game-logic`, `feature/multiplayer`, etc.
   - `git checkout dev`
   - `git pull origin dev`
   - `git checkout -b feature/your-feature`

2. **During Development**
   - Commit frequently with clear messages
   - Keep commits focused and atomic
   - Pull from `dev` regularly to stay updated
   - `git commit -m "descriptive message"`
   - `git pull origin dev`

3. **Submitting Changes**
   - Push your feature branch
   - Create a Pull Request (PR) to `dev`
   - Request review from at least one team member
   - `git push origin feature/your-feature`

4. **Code Review**
   - Team members review code
   - Address feedback and make changes
   - Reviewers approve when ready
   - Changes merged to `dev`

5. **Release Process**
   - Features accumulated in `dev` are tested
   - When stable, `dev` is merged to `main`
   - Create version tag for release

### Commit Message Guidelines
- Start with verb in present tense
- Be descriptive but concise
- Example formats:
  - `Add mine placement logic`
  - `Fix websocket disconnect handler`
  - `Update game settings interface`

### Pull Request Guidelines
- Describe changes clearly
- Reference related issues
- Include testing steps
- List any new dependencies
