{pkgs}: {
  deps = [
    pkgs.elmPackages.elm-format
    pkgs.elmPackages.elm-test
    pkgs.snowflake
  ];
}
