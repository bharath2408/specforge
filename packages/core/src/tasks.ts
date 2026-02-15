import * as fs from "node:fs";
import * as path from "node:path";
import type {
  TaskItem,
  TaskPhase,
  TaskPriority,
  FeatureSpec,
  Plan,
} from "./types.js";
import { parseSpecMarkdown } from "./specfile.js";
import { generatePlan } from "./planner.js";
import { parseSpecDirName } from "./sequence.js";

/**
 * Generate tasks from a feature spec and its plan.
 */
export function generateTasks(specDir: string): TaskPhase[] {
  const specPath = path.join(specDir, "spec.md");
  const content = fs.readFileSync(specPath, "utf-8");
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  const seq = parsed?.seq ?? 0;
  const slug = parsed?.slug ?? dirName;
  const spec = parseSpecMarkdown(content, seq, slug);

  const plan = generatePlan(specDir);

  return buildTaskPhases(spec, plan);
}

function buildTaskPhases(spec: FeatureSpec, plan: Plan): TaskPhase[] {
  let taskCounter = 0;

  function nextTaskId(): string {
    taskCounter++;
    return `T${String(taskCounter).padStart(3, "0")}`;
  }

  const phases: TaskPhase[] = [];

  // Phase 1: Setup
  const setupTasks: TaskItem[] = [
    {
      id: nextTaskId(),
      priority: "P1",
      scenarioRef: "-",
      description: "Set up project structure and dependencies",
      done: false,
      dependencies: [],
      parallel: false,
    },
    {
      id: nextTaskId(),
      priority: "P1",
      scenarioRef: "-",
      description: "Update spec file with new models/endpoints",
      done: false,
      dependencies: [`T001`],
      parallel: false,
    },
  ];
  phases.push({ name: "Setup", tasks: setupTasks });

  // Phase 2: Foundational (data models)
  const foundationalTasks: TaskItem[] = [];
  for (const entity of spec.entities) {
    foundationalTasks.push({
      id: nextTaskId(),
      priority: "P1",
      scenarioRef: "-",
      description: `Create ${entity} data model and migration`,
      done: false,
      dependencies: [`T002`],
      parallel: true,
    });
  }
  if (foundationalTasks.length === 0) {
    foundationalTasks.push({
      id: nextTaskId(),
      priority: "P1",
      scenarioRef: "-",
      description: "Define and implement data models",
      done: false,
      dependencies: [`T002`],
      parallel: false,
    });
  }
  phases.push({ name: "Foundational", tasks: foundationalTasks });

  // Phase 3: User Stories (implementation per scenario)
  const storyTasks: TaskItem[] = [];
  for (const scenario of spec.scenarios) {
    const priority = scenario.priority as TaskPriority;
    storyTasks.push({
      id: nextTaskId(),
      priority,
      scenarioRef: scenario.id,
      description: `Implement ${scenario.id}: ${scenario.description}`,
      done: false,
      dependencies:
        foundationalTasks.length > 0
          ? [foundationalTasks[foundationalTasks.length - 1].id]
          : [`T002`],
      parallel: priority !== "P1",
    });
    // Add test task for each scenario
    storyTasks.push({
      id: nextTaskId(),
      priority,
      scenarioRef: scenario.id,
      description: `Write tests for ${scenario.id}: ${scenario.description}`,
      done: false,
      dependencies: [storyTasks[storyTasks.length - 1].id],
      parallel: false,
    });
  }
  phases.push({ name: "User Stories", tasks: storyTasks });

  // Phase 4: Polish
  const polishTasks: TaskItem[] = [
    {
      id: nextTaskId(),
      priority: "P2",
      scenarioRef: "-",
      description: "Add error handling and edge case coverage",
      done: false,
      dependencies: storyTasks.length > 0 ? [storyTasks[storyTasks.length - 1].id] : [],
      parallel: false,
    },
    {
      id: nextTaskId(),
      priority: "P2",
      scenarioRef: "-",
      description: "Update documentation and API docs",
      done: false,
      dependencies: [],
      parallel: true,
    },
    {
      id: nextTaskId(),
      priority: "P3",
      scenarioRef: "-",
      description: "Performance optimization and final review",
      done: false,
      dependencies: [],
      parallel: true,
    },
  ];
  phases.push({ name: "Polish", tasks: polishTasks });

  return phases;
}

/**
 * Parse tasks from a tasks.md markdown file.
 */
export function parseTasksMarkdown(content: string): TaskPhase[] {
  const phases: TaskPhase[] = [];
  let currentPhase: TaskPhase | null = null;

  for (const line of content.split("\n")) {
    const phaseMatch = line.match(/^## (.+)/);
    if (phaseMatch) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = { name: phaseMatch[1], tasks: [] };
      continue;
    }

    if (!currentPhase) continue;

    const taskMatch = line.match(
      /^- \[([ x])\] \[(T\d+)\] \[(P[123])\] \[([^\]]*)\]\s+(.+)/
    );
    if (taskMatch) {
      const deps: string[] = [];
      const parallel = line.includes("⚡");
      // Extract dependencies from end of line
      const depMatch = line.match(/deps:\s*\[([^\]]*)\]/);
      if (depMatch) {
        deps.push(
          ...depMatch[1]
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        );
      }

      currentPhase.tasks.push({
        id: taskMatch[2],
        priority: taskMatch[3] as TaskPriority,
        scenarioRef: taskMatch[4],
        description: taskMatch[5].replace(/\s*deps:.*$/, "").replace(/\s*⚡\s*$/, ""),
        done: taskMatch[1] === "x",
        dependencies: deps,
        parallel,
      });
    }
  }

  if (currentPhase) phases.push(currentPhase);
  return phases;
}

/**
 * Generate tasks markdown output.
 */
export function generateTasksMarkdown(
  specId: string,
  phases: TaskPhase[]
): string {
  let md = `# Tasks: ${specId}\n\n`;
  md += `> Generated: ${new Date().toISOString().split("T")[0]}\n\n`;

  let totalTasks = 0;
  let completedTasks = 0;

  for (const phase of phases) {
    totalTasks += phase.tasks.length;
    completedTasks += phase.tasks.filter((t) => t.done).length;
  }

  md += `Progress: ${completedTasks}/${totalTasks} tasks complete\n\n`;

  for (const phase of phases) {
    md += `## ${phase.name}\n\n`;

    for (const task of phase.tasks) {
      const check = task.done ? "x" : " ";
      const parallel = task.parallel ? " ⚡" : "";
      const deps =
        task.dependencies.length > 0
          ? ` deps: [${task.dependencies.join(", ")}]`
          : "";
      md += `- [${check}] [${task.id}] [${task.priority}] [${task.scenarioRef}] ${task.description}${parallel}${deps}\n`;
    }

    md += `\n`;
  }

  md += `---\n`;
  md += `Legend: ⚡ = can run in parallel | deps: [T001] = depends on T001\n`;

  return md;
}
