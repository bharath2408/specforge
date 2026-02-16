# Data Model: 002-update-existing-project

> Generated: 2026-02-15

## Note

This is a CLI feature — no database tables or Prisma models. The "data model" consists of TypeScript interfaces and a YAML file on disk.

## TypeScript Interfaces

### FileChangeEntry

Tracks what happened to a single file during an update.

| Field | Type | Description |
|-------|------|-------------|
| path | string | Relative file path from project root |
| action | "added" \| "updated" \| "unchanged" | What happened to this file |

### UpdateResult

Returned by the core updater after running (or dry-running) an update.

| Field | Type | Description |
|-------|------|-------------|
| oldVersion | string | Version before update (or "0.0.0" if none) |
| newVersion | string | Current CLI version |
| files | FileChangeEntry[] | List of all files checked |
| dryRun | boolean | Whether this was a dry run |

## On-Disk File

### `.specforge/version.yaml`

```yaml
version: "1.0.4"
updatedAt: "2026-02-15"
```
