# Feature Spec: custom-commands

> Spec ID: 001-custom-commands
> Created: 2026-02-15

## Status

Status: draft

## Summary

Allow users to define, register, and execute their own custom commands within SpecForge. Users can create reusable command shortcuts that wrap existing SpecForge operations or run custom shell scripts, enabling personalized workflows.

## User Scenarios

### [US1] [P1] Register a Custom Command

**Given** a user has a repetitive workflow (e.g., always running clarify + plan + tasks in sequence)
**When** they run `specforge command add my-pipeline --run "specforge clarify {spec} && specforge plan {spec} && specforge tasks {spec}"`
**Then** a custom command `my-pipeline` is registered and persisted in the project config

### [US2] [P1] Execute a Custom Command

**Given** a user has registered a custom command `my-pipeline`
**When** they run `specforge my-pipeline 001-custom-commands`
**Then** the system resolves the command, substitutes `{spec}` with `001-custom-commands`, and executes the underlying operations in sequence

### [US3] [P2] List and Manage Custom Commands

**Given** a user has registered multiple custom commands
**When** they run `specforge command list`
**Then** the system displays all registered commands with their names, descriptions, and underlying scripts

### [US4] [P2] Edit or Remove a Custom Command

**Given** a user wants to update or remove an existing custom command
**When** they run `specforge command edit my-pipeline --run "new script"` or `specforge command remove my-pipeline`
**Then** the command is updated or removed from the project config

### [US5] [P3] Share Custom Commands via Config

**Given** a team wants to share common workflows
**When** they commit the `.specforge/commands.yaml` config file to version control
**Then** other team members get access to the same custom commands after pulling

## Functional Requirements

### [FR-001] Command Registration

Users can register a custom command with:
- A unique name (alphanumeric + hyphens)
- A `--run` script (shell command string with `{placeholder}` variable support)
- An optional `--description` for documentation
- An optional `--alias` for shorthand invocation

### [FR-002] Command Storage

Custom commands are persisted in `.specforge/commands.yaml` at the project root. The file uses the following structure:
```yaml
commands:
  my-pipeline:
    description: "Run full pipeline for a spec"
    run: "specforge clarify {spec} && specforge plan {spec} && specforge tasks {spec}"
    alias: mp
    variables:
      - name: spec
        required: true
        description: "The spec ID to process"
```

### [FR-003] Command Resolution and Execution

When a user runs a custom command:
1. Check if the command name matches a built-in command first (built-ins take priority)
2. Look up the command in `.specforge/commands.yaml`
3. Validate all required variables are provided as positional or named args
4. Substitute variables into the `run` template
5. Execute the resolved command string via shell

### [FR-004] Variable Substitution

Support placeholder variables in command templates:
- `{name}` — positional or `--name value` argument
- Default values via `default` field in variable definition
- Validation that required variables are provided before execution

### [FR-005] Command Management CLI

- `specforge command add <name>` — Register a new command
- `specforge command list` — List all custom commands
- `specforge command edit <name>` — Update an existing command
- `specforge command remove <name>` — Delete a command
- `specforge command show <name>` — Show details of a single command

### [FR-006] Built-in Command Protection

Built-in SpecForge commands (specify, clarify, plan, tasks, analyze, generate, etc.) cannot be overridden by custom commands. Attempting to register a conflicting name returns an error.

## Key Entities

- **CustomCommand** — A user-defined command with name, run script, description, alias, and variables
- **CommandVariable** — A variable placeholder within a command template (name, required, default, description)
- **CommandRegistry** — The in-memory representation of all registered commands loaded from config

## Success Criteria

- Users can register, list, edit, remove, and execute custom commands
- Variable substitution works correctly with positional and named arguments
- Built-in commands cannot be overridden
- Commands persist across sessions via `.specforge/commands.yaml`
- Error messages are clear when commands fail or variables are missing

## Edge Cases

- Registering a command with a name that conflicts with a built-in command
- Executing a command with missing required variables
- Running a command whose underlying script fails mid-execution
- Circular command references (custom command calling itself)
- Empty or malformed `commands.yaml` file
- Command names with special characters
- Very long command scripts exceeding shell limits

## Open Questions

- Should custom commands support piping output between steps?
- Should there be a `--dry-run` flag to preview resolved commands without executing?
- Should commands support conditional logic (if/else) or just sequential execution?
