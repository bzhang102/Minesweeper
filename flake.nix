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

            # Load environment variables from .env.development
            if [ -f src/server/.env.development ]; then
              export $(cat src/server/.env.development | xargs)
            fi

            # Set up PostgreSQL environment variables
            export PGDATA="$PWD/src/database/data"
            export DATABASE_URL="postgresql:///$DB_NAME"
            export PGHOST=/tmp

            # Initialize PostgreSQL if it hasn't been initialized yet
            if [ ! -d $PGDATA ]; then
              echo "Initializing PostgreSQL database..."
              mkdir -p $PGDATA
              initdb -D $PGDATA --auth=trust --no-locale --encoding=UTF8
            fi

            # Start PostgreSQL if it's not already running
            if ! pg_ctl status -D $PGDATA; then
              pg_ctl -D $PGDATA -l "$PGDATA/postgresql.log" -o "-k/tmp" start

              # Wait for PostgreSQL to start
              until pg_isready; do
                echo "Waiting for PostgreSQL to start..."
                sleep 1
              done

              # Create database if it doesn't exist
              if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
                createdb $DB_NAME
                echo "Created database: $DB_NAME"
                
                # Apply schema if it exists
                if [ -f "$PWD/src/database/schema.sql" ]; then
                  echo "Applying schema from schema.sql..."
                  psql -d $DB_NAME -f "$PWD/src/database/schema.sql"
                  echo "Schema applied successfully."
                else
                  echo "No schema.sql found in database directory. Skipping schema setup."
                fi
              fi
            fi

            echo "PostgreSQL is running with database: $DB_NAME"

            # Start client and server in the background
            echo "Starting client and server..."
            (cd src/client && npm run dev &)
            (cd src/server && npm run dev &)

            # Store PIDs for cleanup
            CLIENT_PID=$!
            SERVER_PID=$!

            # Function to cleanup all processes
            cleanup() {
              echo "Shutting down services..."
              # Kill client and server
              kill $CLIENT_PID 2>/dev/null
              kill $SERVER_PID 2>/dev/null
              # Stop PostgreSQL
              pg_ctl -D $PGDATA stop
              exit
            }

            # Set up cleanup on script exit
            trap cleanup EXIT INT TERM

            # Keep shell active
            echo "Development environment is ready! Press Ctrl+C to stop all services."
            tail -f $PGDATA/postgresql.log
          '';
        };
      }
    );
}