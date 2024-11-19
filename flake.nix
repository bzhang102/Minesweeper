{
  description = "A flake for managing the build dependencies for Minesweeper Project";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
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
            echo "Hello Devs"

            # Set up PostgreSQL environment variables
            export PGDATA="$PWD/.postgres"
            export DATABASE_URL="postgresql:///minesweeper_db"
            export PGHOST=/tmp

            # Initialize PostgreSQL if it hasn't been initialized yet
            if [ ! -d $PGDATA ]; then
              echo "Initializing PostgreSQL database..."
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
              if ! psql -lqt | cut -d \| -f 1 | grep -qw minesweeper_db; then
                createdb minesweeper_db
                echo "Created minesweeper_db database"
                
                # Apply schema.sql if it exists
                if [ -f "$PWD/schema.sql" ]; then
                  echo "Applying schema from schema.sql..."
                  psql -d minesweeper_db -f "$PWD/schema.sql"
                  echo "Schema applied successfully."
                else
                  echo "No schema.sql file found. Skipping schema setup."
                fi
              fi
            fi

            echo "PostgreSQL is running with database: minesweeper_db"

            # Clean up PostgreSQL on exit
            trap "pg_ctl -D $PGDATA stop" EXIT
          '';
        };
      }
    );
}
