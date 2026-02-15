import * as fs from "node:fs";
import * as path from "node:path";

export async function removeCommand(
  opts: { force?: boolean } = {}
): Promise<void> {
  const cwd = process.cwd();

  // Check if this is a SpecForge project
  const specDir = path.join(cwd, "spec");
  const claudeMd = path.join(cwd, "CLAUDE.md");
  const claudeCommands = path.join(cwd, ".claude", "commands");

  const hasSpec = fs.existsSync(specDir);
  const hasClaude = fs.existsSync(claudeMd) || fs.existsSync(claudeCommands);

  if (!hasSpec && !hasClaude) {
    console.log("\n  No SpecForge files found in this project.\n");
    return;
  }

  if (!opts.force) {
    console.log(`\n  This will remove the following from: ${cwd}\n`);
    const toRemove: string[] = [];
    if (fs.existsSync(specDir)) toRemove.push("  spec/                (spec YAML files)");
    if (fs.existsSync(path.join(cwd, "specs"))) toRemove.push("  specs/               (feature specs, plans, tasks)");
    if (fs.existsSync(path.join(cwd, "memory"))) toRemove.push("  memory/              (constitution)");
    if (fs.existsSync(claudeMd)) toRemove.push("  CLAUDE.md            (Claude Code instructions)");
    if (fs.existsSync(claudeCommands)) toRemove.push("  .claude/commands/    (slash commands)");

    for (const item of toRemove) {
      console.log(`    ${item}`);
    }
    console.log(`\n  Run with --force to confirm removal.\n`);
    return;
  }

  // Remove everything
  console.log(`\n  Removing SpecForge from: ${cwd}\n`);

  const removed: string[] = [];

  // Remove spec/
  if (fs.existsSync(specDir)) {
    fs.rmSync(specDir, { recursive: true });
    removed.push("spec/");
  }

  // Remove specs/
  const specsDir = path.join(cwd, "specs");
  if (fs.existsSync(specsDir)) {
    fs.rmSync(specsDir, { recursive: true });
    removed.push("specs/");
  }

  // Remove memory/
  const memoryDir = path.join(cwd, "memory");
  if (fs.existsSync(memoryDir)) {
    fs.rmSync(memoryDir, { recursive: true });
    removed.push("memory/");
  }

  // Remove CLAUDE.md
  if (fs.existsSync(claudeMd)) {
    fs.rmSync(claudeMd);
    removed.push("CLAUDE.md");
  }

  // Remove .claude/commands/specforge-*.md (only specforge files, not other commands)
  if (fs.existsSync(claudeCommands)) {
    const files = fs.readdirSync(claudeCommands);
    for (const file of files) {
      if (file.startsWith("specforge-") && file.endsWith(".md")) {
        fs.rmSync(path.join(claudeCommands, file));
        removed.push(`.claude/commands/${file}`);
      }
    }

    // Remove .claude/commands/ if empty
    const remaining = fs.readdirSync(claudeCommands);
    if (remaining.length === 0) {
      fs.rmSync(claudeCommands, { recursive: true });
      // Remove .claude/ if empty
      const claudeDir = path.join(cwd, ".claude");
      if (fs.existsSync(claudeDir) && fs.readdirSync(claudeDir).length === 0) {
        fs.rmSync(claudeDir, { recursive: true });
      }
    }
  }

  for (const item of removed) {
    console.log(`    Removed ${item}`);
  }

  console.log(`\n  SpecForge removed. ${removed.length} items deleted.\n`);
}
