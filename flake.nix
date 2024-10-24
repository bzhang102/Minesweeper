{
  description = "A flake for managing the build dependencies for Minesweeper Project";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      pkgs = nixpkgs.legacyPackages."x86_64-linux";
    in
    {
      devShells."x86_64-linux".default = pkgs.mkShell {
        packages = [ pkgs.nodejs ];

        shellHook = ''
          echo "Hello Devs"
        '';
      };
    };
}
