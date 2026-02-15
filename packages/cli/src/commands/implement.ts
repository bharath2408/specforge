import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge/core/config";
import { resolveSpecDir, parseSpecDirName } from "@specforge/core/sequence";
import { parseSpecMarkdown } from "@specforge/core/specfile";
import { parseTasksMarkdown } from "@specforge/core/tasks";
import { clarifyCommand } from "./clarify.js";
import { planCommand } from "./plan.js";
import { tasksCommand } from "./tasks.js";
import { analyzeCommand } from "./analyze.js";
import { generateCommand } from "./generate.js";
import { validateCommand } from "./validate.js";

export interface ImplementCommandOptions {
  skipGenerate?: boolean;
  plugins?: string[];
}

export async function implementCommand(
  specId: string,
  opts: ImplementCommandOptions = {}
): Promise<void> {
  if (!specId) {
    console.error(
      "\n  Please provide a spec ID.\n  Usage: specforge implement <spec-id>\n"
    );
    process.exit(1);
  }

  const config = loadConfig();
  const specsDir = path.resolve(config.specsDir);
  const specDir = resolveSpecDir(specsDir, specId);

  if (!specDir) {
    console.error(`\n  Spec not found: ${specId}`);
    console.error(`  Run 'specforge specify <name>' to create a spec first.\n`);
    process.exit(1);
  }

  const specPath = path.join(specDir, "spec.md");
  if (!fs.existsSync(specPath)) {
    console.error(`\n  No spec.md found in: ${specDir}\n`);
    process.exit(1);
  }

  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  if (!parsed) {
    console.error(`\n  Invalid spec directory name: ${dirName}\n`);
    process.exit(1);
  }

  const content = fs.readFileSync(specPath, "utf-8");
  const spec = parseSpecMarkdown(content, parsed.seq, parsed.slug);

  console.log(`\n  SpecForge Implement: ${dirName}`);
  console.log(`  ${"=".repeat(50)}\n`);

  // ── Step 1: Check prerequisites and run missing steps ──
  let step = 1;

  // Clarification log
  const clarifyPath = path.join(specDir, "clarification-log.md");
  if (!fs.existsSync(clarifyPath)) {
    console.log(`  [${step}] Running clarify (no clarification log found)...\n`);
    await clarifyCommand(dirName);
    console.log();
  } else {
    console.log(`  [${step}] Clarify: already done`);
  }
  step++;

  // Plan
  const planPath = path.join(specDir, "plan.md");
  if (!fs.existsSync(planPath)) {
    console.log(`  [${step}] Running plan (no plan.md found)...\n`);
    await planCommand(dirName);
    console.log();
  } else {
    console.log(`  [${step}] Plan: already done`);
  }
  step++;

  // Tasks
  const tasksPath = path.join(specDir, "tasks.md");
  if (!fs.existsSync(tasksPath)) {
    console.log(`  [${step}] Running tasks (no tasks.md found)...\n`);
    await tasksCommand(dirName);
    console.log();
  } else {
    console.log(`  [${step}] Tasks: already done`);
  }
  step++;

  // Analyze
  console.log(`  [${step}] Running consistency check...\n`);
  await analyzeCommand(dirName);
  console.log();
  step++;

  // ── Step 2: Show implementation summary ──
  console.log(`  [${step}] Implementation Summary`);
  console.log(`  ${"-".repeat(50)}`);

  // Read tasks
  const tasksContent = fs.readFileSync(tasksPath, "utf-8");
  const taskPhases = parseTasksMarkdown(tasksContent);
  const allTasks = taskPhases.flatMap((p) => p.tasks);
  const pendingTasks = allTasks.filter((t) => !t.done);
  const p1Tasks = pendingTasks.filter((t) => t.priority === "P1");
  const p2Tasks = pendingTasks.filter((t) => t.priority === "P2");
  const p3Tasks = pendingTasks.filter((t) => t.priority === "P3");

  console.log(`\n  Feature: ${spec.name}`);
  console.log(`  Status: ${spec.status}`);
  console.log(`  Scenarios: ${spec.scenarios.length}`);
  console.log(`  Requirements: ${spec.requirements.length}`);
  console.log(`  Entities: ${spec.entities.join(", ") || "none"}`);
  console.log(`\n  Tasks: ${pendingTasks.length} pending (P1:${p1Tasks.length} P2:${p2Tasks.length} P3:${p3Tasks.length})`);
  console.log(`  Phases: ${taskPhases.map((p) => p.name).join(" → ")}`);
  step++;

  // ── Step 3: Show task execution order ──
  console.log(`\n  [${step}] Execution Order (P1 first)`);
  console.log(`  ${"-".repeat(50)}\n`);

  // Show P1 tasks first, then P2, then P3
  for (const task of p1Tasks) {
    const deps = task.dependencies.length > 0 ? ` (after ${task.dependencies.join(", ")})` : "";
    const parallel = task.parallel ? " ⚡" : "";
    console.log(`    [${task.id}] [${task.priority}] ${task.description}${deps}${parallel}`);
  }
  if (p2Tasks.length > 0) {
    console.log();
    for (const task of p2Tasks) {
      const deps = task.dependencies.length > 0 ? ` (after ${task.dependencies.join(", ")})` : "";
      const parallel = task.parallel ? " ⚡" : "";
      console.log(`    [${task.id}] [${task.priority}] ${task.description}${deps}${parallel}`);
    }
  }
  if (p3Tasks.length > 0) {
    console.log();
    for (const task of p3Tasks) {
      const deps = task.dependencies.length > 0 ? ` (after ${task.dependencies.join(", ")})` : "";
      const parallel = task.parallel ? " ⚡" : "";
      console.log(`    [${task.id}] [${task.priority}] ${task.description}${deps}${parallel}`);
    }
  }
  step++;

  // ── Step 4: Read plan for file changes ──
  const planContent = fs.readFileSync(planPath, "utf-8");
  const fileChanges = extractFileChanges(planContent);

  if (fileChanges.length > 0) {
    console.log(`\n  [${step}] Files to Create/Modify`);
    console.log(`  ${"-".repeat(50)}\n`);
    for (const fc of fileChanges) {
      const icon = fc.action === "create" ? "+" : fc.action === "modify" ? "~" : "-";
      console.log(`    ${icon} ${fc.path}  (${fc.description})`);
    }
    step++;
  }

  // ── Step 5: Validate and generate ──
  if (!opts.skipGenerate) {
    console.log(`\n  [${step}] Validating spec...\n`);
    try {
      await validateCommand();
    } catch {
      console.log(`\n  Validation had issues — fix spec/app.spec.yaml and re-run.\n`);
    }
    step++;

    console.log(`\n  [${step}] Generating code...\n`);
    try {
      await generateCommand({
        plugins: opts.plugins,
      });
    } catch {
      console.log(`\n  Generation had issues — check the output above.\n`);
    }
    step++;
  }

  // ── Step 6: Update spec status ──
  const updatedContent = content.replace(
    /^Status:\s*.+$/m,
    "Status: in-progress"
  );
  if (updatedContent !== content) {
    fs.writeFileSync(specPath, updatedContent, "utf-8");
    console.log(`\n  [${step}] Spec status updated to: in-progress`);
    step++;
  }

  // ── Done ──
  console.log(`\n  ${"=".repeat(50)}`);
  console.log(`  Implementation started for: ${dirName}`);
  console.log(`  ${pendingTasks.length} tasks to complete.`);
  console.log(`\n  Artifacts:`);
  console.log(`    Spec:     ${specPath}`);
  console.log(`    Plan:     ${planPath}`);
  console.log(`    Tasks:    ${tasksPath}`);
  console.log(`\n  Follow the task list in tasks.md to implement each item.\n`);
}

interface FileChangeEntry {
  path: string;
  action: string;
  description: string;
}

function extractFileChanges(planContent: string): FileChangeEntry[] {
  const changes: FileChangeEntry[] = [];
  const lines = planContent.split("\n");

  for (const line of lines) {
    // Match table rows like: | `src/models/entity.ts` | create | Create Entity model |
    const match = line.match(
      /^\|\s*`(.+?)`\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|$/
    );
    if (match && match[1] !== "File") {
      changes.push({
        path: match[1],
        action: match[2],
        description: match[3],
      });
    }
  }

  return changes;
}
