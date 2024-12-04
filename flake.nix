{
  description = "A flake for managing the build dependencies for Minesweeper Project";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            postgresql
          ];
          shellHook = ''
            echo "Starting Minesweeper Development Environment..."

            # Hardcoded environment variables
            export PORT=3000
            export CLIENT_URL="http://localhost:5173"
            export NODE_ENV="development"
            export DB_HOST="localhost"
            export DB_PORT=5432
            export DB_NAME="minesweeper_db"
            export DB_USER=$(whoami)
            export DB_PASSWORD=""

            # Set up PostgreSQL environment variables
            export PGDATA="$PWD/src/database/data"
            export PGHOST="127.0.0.1"
            export PGPORT=$DB_PORT
            export PGUSER=$DB_USER

            # Clean up any stale pid file
            if [ -f "$PGDATA/postmaster.pid" ]; then
              rm "$PGDATA/postmaster.pid"
            fi

            # Initialize PostgreSQL if it hasn't been initialized yet
            if [ ! -d "$PGDATA" ]; then
              echo "Initializing PostgreSQL database..."
              mkdir -p "$PGDATA"
              chmod 700 "$PGDATA"
              initdb -D "$PGDATA" --auth=trust --no-locale --encoding=UTF8 --username=$DB_USER
              
              # Modify postgresql.conf
              echo "port = $PGPORT" >> "$PGDATA/postgresql.conf"
              echo "unix_socket_directories = '$PGDATA'" >> "$PGDATA/postgresql.conf"
            fi

            # Start PostgreSQL if it's not already running
            if ! pg_ctl status -D "$PGDATA" > /dev/null 2>&1; then
              echo "Starting PostgreSQL..."
              pg_ctl -D "$PGDATA" -l "$PGDATA/postgresql.log" start

              # Wait for PostgreSQL to start
              for i in {1..30}; do
                if pg_isready -h $PGHOST -p $PGPORT; then
                  break
                fi
                echo "Waiting for PostgreSQL to start..."
                sleep 1
              done
              
              if ! pg_isready -h $PGHOST -p $PGPORT; then
                echo "Failed to start PostgreSQL. Check logs at $PGDATA/postgresql.log"
                exit 1
              fi

              # Create database if it doesn't exist
              if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
                createdb "$DB_NAME"
                echo "Created database: $DB_NAME"
                
                # Apply schema if it exists
                if [ -f "$PWD/src/database/schema.sql" ]; then
                  echo "Applying schema from schema.sql..."
                  psql -d "$DB_NAME" -f "$PWD/src/database/schema.sql"
                  echo "Schema applied successfully."
                else
                  echo "No schema.sql found in database directory. Skipping schema setup."
                fi
              fi
            fi

            echo "PostgreSQL is running with database: $DB_NAME"

            # Start client and server in the background
            echo "Starting client and server..."
            (cd src/client && npm run dev) &
            CLIENT_PID=$!
            (cd src/server && npm run dev) &
            SERVER_PID=$!

            # Function to cleanup all processes
            cleanup() {
              echo "Shutting down services..."
              kill $CLIENT_PID 2>/dev/null || true
              kill $SERVER_PID 2>/dev/null || true
              pg_ctl -D "$PGDATA" stop -m fast || true
              exit
            }

            # Set up cleanup on script exit
            trap cleanup EXIT INT TERM

            # Keep shell active
            echo "Development environment is ready! Press Ctrl+C to stop all services."
            tail -f "$PGDATA/postgresql.log"
          '';
        };
      }
    );
}