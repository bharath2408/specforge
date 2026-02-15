Manage custom command shortcuts.

Available subcommands:
- `specforge command add <name> --run <command>` — Register a new custom command
- `specforge command list` — List all custom commands
- `specforge command edit <name> --run <command>` — Update an existing command
- `specforge command remove <name>` — Remove a custom command
- `specforge command show <name>` — Show details of a command

Custom commands support variables: `specforge command add deploy --run "git push {remote} {branch}"`
Variables are substituted from positional args or --name flags when the command is run.

Help the user manage their custom commands based on what they want to do.