Sync project integration files with the installed CLI version.

Run: `specforge update`

Options:
- `--dry-run` — Preview changes without writing files
- `--force` — Force re-sync even if versions match

This updates CLAUDE.md and slash commands in `.claude/commands/` to match the currently installed SpecForge CLI version. Run this after upgrading SpecForge globally.

If the user wants to preview first, suggest `specforge update --dry-run`.