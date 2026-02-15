import * as fs from "node:fs";
import * as path from "node:path";
import YAML from "yaml";
import type { FileChangeEntry, UpdateResult } from "@specforge-dev/core";
import { CLAUDE_MD, SLASH_COMMANDS, CLI_VERSION } from "./init.js";

const MARKER_START = "<!-- specforge:start -->";
const MARKER_END = "<!-- specforge:end -->";

function detectProject(cwd: string): boolean {
  const hasSpec = fs.existsSync(path.join(cwd, "spec"));
  const hasClaudeMd = fs.existsSync(path.join(cwd, "CLAUDE.md"));
  return hasSpec || hasClaudeMd;
}

function readVersionFile(cwd: string): string {
  const versionPath = path.join(cwd, ".specforge", "version.yaml");
  if (!fs.existsSync(versionPath)) {
    return "0.0.0";
  }
  const content = fs.readFileSync(versionPath, "utf-8");
  const parsed = YAML.parse(content);
  return parsed?.version ?? "0.0.0";
}

function writeVersionFile(version: string, cwd: string): void {
  const specforgeDir = path.join(cwd, ".specforge");
  fs.mkdirSync(specforgeDir, { recursive: true });
  fs.writeFileSync(
    path.join(specforgeDir, "version.yaml"),
    YAML.stringify({ version }),
    "utf-8"
  );
}

function syncSlashCommands(
  targetDir: string,
  dryRun: boolean
): FileChangeEntry[] {
  const commandsDir = path.join(targetDir, ".claude", "commands");
  const changes: FileChangeEntry[] = [];

  if (!dryRun) {
    fs.mkdirSync(commandsDir, { recursive: true });
  }

  for (const [name, content] of Object.entries(SLASH_COMMANDS)) {
    const cmdPath = path.join(commandsDir, `${name}.md`);
    const relativePath = `.claude/commands/${name}.md`;

    if (!fs.existsSync(cmdPath)) {
      if (!dryRun) {
        fs.writeFileSync(cmdPath, content, "utf-8");
      }
      changes.push({ file: relativePath, action: "added" });
    } else {
      const existing = fs.readFileSync(cmdPath, "utf-8");
      if (existing !== content) {
        if (!dryRun) {
          fs.writeFileSync(cmdPath, content, "utf-8");
        }
        changes.push({ file: relativePath, action: "updated" });
      } else {
        changes.push({ file: relativePath, action: "unchanged" });
      }
    }
  }

  return changes;
}

function syncClaudeMd(
  targetDir: string,
  dryRun: boolean
): FileChangeEntry {
  const claudeMdPath = path.join(targetDir, "CLAUDE.md");
  const newContent = `${MARKER_START}\n${CLAUDE_MD}${MARKER_END}\n`;

  if (!fs.existsSync(claudeMdPath)) {
    if (!dryRun) {
      fs.writeFileSync(claudeMdPath, newContent, "utf-8");
    }
    return { file: "CLAUDE.md", action: "added" };
  }

  const existing = fs.readFileSync(claudeMdPath, "utf-8");
  const startIdx = existing.indexOf(MARKER_START);
  const endIdx = existing.indexOf(MARKER_END);

  let updatedContent: string;

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace content between markers
    updatedContent =
      existing.substring(0, startIdx) +
      `${MARKER_START}\n${CLAUDE_MD}${MARKER_END}` +
      existing.substring(endIdx + MARKER_END.length);
  } else {
    // No markers found — replace entire file, user will be warned
    updatedContent = newContent;
    if (!dryRun) {
      console.log(
        "  Warning: CLAUDE.md had no specforge markers — entire file replaced"
      );
    }
  }

  if (existing === updatedContent) {
    return { file: "CLAUDE.md", action: "unchanged" };
  }

  if (!dryRun) {
    fs.writeFileSync(claudeMdPath, updatedContent, "utf-8");
  }
  return { file: "CLAUDE.md", action: "updated" };
}

export async function updateCommand(opts: {
  dryRun?: boolean;
  force?: boolean;
}): Promise<void> {
  const cwd = process.cwd();
  const dryRun = opts.dryRun ?? false;
  const force = opts.force ?? false;

  if (!detectProject(cwd)) {
    console.error(
      "Error: No SpecForge project found in current directory."
    );
    console.error(
      "  Run `specforge init .` to initialize SpecForge in this project."
    );
    process.exit(1);
  }

  const oldVersion = readVersionFile(cwd);

  if (oldVersion === CLI_VERSION && !force) {
    console.log(`Already up to date (v${CLI_VERSION}).`);
    return;
  }

  if (dryRun) {
    console.log("\n  Dry run — no files will be written.\n");
  }

  const fromLabel =
    oldVersion === "0.0.0" ? "unversioned" : `v${oldVersion}`;
  console.log(
    `\n  Updating SpecForge integration: ${fromLabel} → v${CLI_VERSION}\n`
  );

  // Sync files
  const claudeMdChange = syncClaudeMd(cwd, dryRun);
  const slashChanges = syncSlashCommands(cwd, dryRun);
  const allChanges: FileChangeEntry[] = [claudeMdChange, ...slashChanges];

  // Write version file
  if (!dryRun) {
    writeVersionFile(CLI_VERSION, cwd);
  }

  // Build result
  const result: UpdateResult = {
    fromVersion: oldVersion,
    toVersion: CLI_VERSION,
    changes: allChanges,
    dryRun,
  };

  // Print summary
  const added = result.changes.filter((c) => c.action === "added");
  const updated = result.changes.filter((c) => c.action === "updated");
  const unchanged = result.changes.filter((c) => c.action === "unchanged");

  if (added.length > 0) {
    console.log(`  Added (${added.length}):`);
    for (const c of added) {
      console.log(`    + ${c.file}`);
    }
  }

  if (updated.length > 0) {
    console.log(`  Updated (${updated.length}):`);
    for (const c of updated) {
      console.log(`    ~ ${c.file}`);
    }
  }

  if (unchanged.length > 0) {
    console.log(`  Unchanged (${unchanged.length})`);
  }

  console.log();

  if (dryRun) {
    console.log("  Run `specforge update` to apply these changes.");
  } else {
    console.log(
      `  Done! Updated ${added.length + updated.length} file(s).`
    );
  }

  console.log();
}
