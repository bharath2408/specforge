# Implementation Plan: 002-update-existing-project

> Generated: 2026-02-15

## Constitutional Compliance

- [A1] Library-First — Core update logic lives in `packages/core`, CLI wraps it
- [A2] CLI Mandate — `specforge update` exposes the library function via CLI
- [A4] Simplicity — Single-purpose module, no unnecessary abstractions
- [A8] Single Responsibility — Updater module handles sync, CLI handles user interaction

## Technical Context

- Feature: `specforge update` command to sync existing projects with latest CLI version
- This is a CLI feature — no database, no API routes, no Prisma
- Architecture follows existing patterns: core logic in `packages/core`, command handler in `packages/cli`
- Slash command templates already exist in `packages/cli/src/commands/init.ts` (reuse them)

## Implementation Phases

### Phase 1: Core Logic

Implement the update engine in `packages/core`.

| File | Action | Description |
|------|--------|-------------|
| `packages/core/src/types.ts` | modify | Add `UpdateResult` and `FileChangeEntry` interfaces |
| `packages/core/src/updater.ts` | create | Core update logic: version comparison, slash command diffing, CLAUDE.md section replacement, project detection |
| `packages/core/src/index.ts` | modify | Export updater functions and new types |
| `packages/core/package.json` | modify | Add `"./updater"` to exports map |

### Phase 2: CLI Integration

Wire the update command into the CLI.

| File | Action | Description |
|------|--------|-------------|
| `packages/cli/src/commands/update.ts` | create | CLI handler: parse `--dry-run`/`--force` flags, call core updater, display formatted report |
| `packages/cli/src/commands/init.ts` | modify | Extract CLAUDE.md template and slash command definitions into reusable exports so both `init` and `update` share the same source of truth |
| `packages/cli/src/index.ts` | modify | Register `update` command with Commander.js, add `"update"` to built-in commands list |

### Phase 3: Built-in Command Registration

Ensure the custom-commands feature recognizes `update` as built-in.

| File | Action | Description |
|------|--------|-------------|
| `packages/core/src/custom-commands.ts` | modify | Add `"update"` to `BUILT_IN_COMMANDS` set |

### Phase 4: Init Command Update

Make `init` write version tracking and CLAUDE.md markers from day one.

| File | Action | Description |
|------|--------|-------------|
| `packages/cli/src/commands/init.ts` | modify | Write `.specforge/version.yaml` on init, wrap CLAUDE.md content with `<!-- specforge:start -->` / `<!-- specforge:end -->` markers |

## Key Design Decisions

### Slash command source of truth
The init command currently has slash command content inline. Extract these into a shared constant or template directory so both `init` and `update` use the same definitions. When new commands are added to SpecForge, they only need to be added in one place.

### CLAUDE.md marker strategy
- New projects: `init` wraps SpecForge content in `<!-- specforge:start -->` / `<!-- specforge:end -->`
- Existing projects without markers: `update` replaces the entire file, prints a warning
- Existing projects with markers: `update` replaces only the content between markers

### Version file format
```yaml
# .specforge/version.yaml
version: "1.0.4"
updatedAt: "2026-02-15"
```

### Update algorithm
1. Detect project (check for `spec/` or `CLAUDE.md`)
2. Read `.specforge/version.yaml` (or treat as `0.0.0` if missing)
3. Compare with current CLI version
4. If same version and no `--force` flag → "already up to date"
5. Diff slash commands: compare bundled set vs `.claude/commands/`
6. Diff CLAUDE.md: regenerate managed section
7. If `--dry-run` → print report, exit
8. Write changes, update version file, print report
