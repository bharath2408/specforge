# Feature Spec: update-existing-project

> Spec ID: 002-update-existing-project
> Created: 2026-02-15

## Status

Status: draft

## User Scenarios

### [US1] [P1] Sync project with latest SpecForge CLI version

**Given** a developer has a project initialized with SpecForge v1.0.4 and has updated the CLI globally to v1.1.0
**When** they run `specforge update` in the project root
**Then** the `.claude/commands/` directory receives any new slash command files, existing slash commands are updated to match the latest CLI, CLAUDE.md is refreshed with current workflow docs, and `.specforge/version.yaml` is updated to `1.1.0`

### [US2] [P1] Preview update changes with dry-run

**Given** a developer wants to see what `specforge update` would change before applying
**When** they run `specforge update --dry-run`
**Then** a summary is displayed listing files to be added, updated, or left unchanged, without writing anything to disk

### [US3] [P2] Already up-to-date project

**Given** a developer runs `specforge update` on a project already at the current CLI version
**When** all integration files match the installed SpecForge version
**Then** the CLI displays "Project is already up to date (v1.1.0)" and exits with code 0

### [US4] [P3] Non-initialized project error

**Given** a developer runs `specforge update` in a directory without `spec/` or `.claude/commands/`
**When** the CLI detects no SpecForge project markers
**Then** an error is shown: "No SpecForge project found. Run 'specforge init' first." and the process exits with code 1

## Functional Requirements

### [FR-001] Version tracking via `.specforge/version.yaml`

Store the SpecForge CLI version used to initialize or last update the project in `.specforge/version.yaml`. On `specforge update`, compare this stored version against the currently installed CLI version. If no version file exists (pre-tracking projects), treat as needing a full update.

### [FR-002] Slash command sync

Compare `.claude/commands/` against the set of slash commands bundled in the currently installed CLI. Add new command files, update existing command files whose content differs from the bundled version, and leave any user-created command files (not part of the SpecForge set) untouched. Never delete user files.

### [FR-003] CLAUDE.md managed-section update

Regenerate the SpecForge-managed portion of CLAUDE.md. Use `<!-- specforge:start -->` and `<!-- specforge:end -->` marker comments to delimit the managed section. Content outside these markers is preserved. If no markers exist (old-style init), replace the entire file and warn the developer.

### [FR-004] Dry-run mode (`--dry-run`)

Display a summary of planned changes (files to add, update, or skip) without writing to disk. Exit with code 0.

### [FR-005] Update report

After a successful update, display a summary: files added count, files updated count, files unchanged count, plus the version transition (e.g., "v1.0.4 → v1.1.0").

### [FR-006] Project detection

Before running, verify the project has SpecForge markers: `spec/` directory or `CLAUDE.md` containing SpecForge content. If neither exists, exit with code 1 and a helpful error.

## Key Entities

- **VersionFile** — `.specforge/version.yaml` storing `{ version: string }` for the last init/update version
- **ManagedFile** — A file owned by SpecForge that can be added or updated (slash commands, CLAUDE.md managed section)
- **UpdateReport** — Summary object: `{ added: string[], updated: string[], unchanged: string[], oldVersion: string, newVersion: string }`

## Success Criteria

- `specforge update` after a CLI upgrade adds all new slash commands to an existing project
- CLAUDE.md is refreshed without losing user content outside the managed markers
- `--dry-run` accurately previews changes without modifying disk
- Already up-to-date projects are detected and skip writes
- Non-SpecForge directories get a clear error message
- The update is idempotent — running twice produces the same result
- User-created files in `.claude/commands/` are never deleted

## Edge Cases

- No `.specforge/` directory exists (pre-version-tracking init) — treat as needing full update, create the directory
- User has manually edited a SpecForge-managed slash command — overwrite with latest version (slash commands are CLI-owned)
- CLAUDE.md has no marker comments (old-style init) — replace entire file, print warning about the replacement
- `.claude/commands/` contains custom user commands not from SpecForge — leave them untouched
- Filesystem permission errors when writing files — catch and report the specific file path and error
- Running update in a subdirectory of the project — walk up to find the project root

## Open Questions

- Should `specforge update --force` skip the version check and always overwrite all managed files?
- Should modified files be backed up before overwriting (e.g., `CLAUDE.md.bak`)?
