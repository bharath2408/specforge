import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge-dev/core/config";
import { resolveSpecDir } from "@specforge-dev/core/sequence";
import { generateTasks, generateTasksMarkdown } from "@specforge-dev/core/tasks";

export async function tasksCommand(specId: string): Promise<void> {
  if (!specId) {
    console.error(
      "\n  Please provide a spec ID.\n  Usage: specforge tasks <spec-id>\n"
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

  console.log(`\n  Generating tasks for: ${specId}\n`);

  const taskPhases = generateTasks(specDir);

  // Generate markdown
  const dirName = path.basename(specDir);
  const markdown = generateTasksMarkdown(dirName, taskPhases);
  const tasksPath = path.join(specDir, "tasks.md");
  fs.writeFileSync(tasksPath, markdown, "utf-8");
  console.log(`  Tasks generated: ${tasksPath}`);

  // Summary
  let totalTasks = 0;
  let parallelTasks = 0;
  const priorityCounts: Record<string, number> = { P1: 0, P2: 0, P3: 0 };

  for (const phase of taskPhases) {
    totalTasks += phase.tasks.length;
    for (const task of phase.tasks) {
      if (task.parallel) parallelTasks++;
      priorityCounts[task.priority]++;
    }
  }

  console.log(`\n  Task summary:`);
  console.log(`    Phases: ${taskPhases.length}`);
  console.log(`    Total tasks: ${totalTasks}`);
  console.log(
    `    By priority: P1=${priorityCounts.P1} P2=${priorityCounts.P2} P3=${priorityCounts.P3}`
  );
  console.log(`    Parallel opportunities: ${parallelTasks}`);

  console.log(`\n  Phases:`);
  for (const phase of taskPhases) {
    console.log(`    ${phase.name}: ${phase.tasks.length} tasks`);
  }

  console.log(
    `\n  Next: Run 'specforge analyze ${dirName}' to check consistency.\n`
  );
}
