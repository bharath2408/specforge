#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { generateCommand } from "./commands/generate.js";
import { testCommand } from "./commands/test.js";
import { diffCommand } from "./commands/diff.js";
import { constitutionCommand } from "./commands/constitution.js";
import { specifyCommand } from "./commands/specify.js";
import { clarifyCommand } from "./commands/clarify.js";
import { planCommand } from "./commands/plan.js";
import { tasksCommand } from "./commands/tasks.js";
import { analyzeCommand } from "./commands/analyze.js";
import { watchCommand } from "./commands/watch.js";
import { issuesCommand } from "./commands/issues.js";
import { removeCommand } from "./commands/remove.js";
import { implementCommand } from "./commands/implement.js";

const program = new Command();

program
  .name("specforge")
  .description("SpecForge — Spec-Driven Development Kit by d2railabs")
  .version("0.1.0");

program
  .command("init [project-name]")
  .description("Scaffold a new SpecForge project with example spec")
  .action(async (projectName?: string) => {
    await initCommand(projectName);
  });

program
  .command("validate [spec-path]")
  .description("Validate spec files against the schema")
  .action(async (specPath?: string) => {
    await validateCommand(specPath);
  });

program
  .command("generate")
  .description("Generate code from specs (models, routes, tests, prisma, docs, middleware)")
  .option("-o, --output <dir>", "Output directory", ".")
  .option("-p, --plugins <plugins...>", "Plugins to use")
  .option("-s, --spec <path>", "Path to spec file")
  .action(async (opts) => {
    await generateCommand({
      output: opts.output,
      plugins: opts.plugins,
      specPath: opts.spec,
    });
  });

program
  .command("test")
  .description("Run generated tests")
  .action(async () => {
    await testCommand();
  });

program
  .command("diff")
  .description("Show what generate would change compared to on-disk files")
  .option("-p, --plugins <plugins...>", "Plugins to compare")
  .option("-s, --spec <path>", "Path to spec file")
  .option("-v, --verbose", "Show line-level diffs")
  .action(async (opts) => {
    await diffCommand({
      plugins: opts.plugins,
      specPath: opts.spec,
      verbose: opts.verbose,
    });
  });

// ──────────────────────────────────────────────────────────────
// Spec Workflow Commands
// ──────────────────────────────────────────────────────────────

program
  .command("constitution")
  .description("Create or amend the project constitution")
  .option("--amend <description>", "Add an amendment")
  .option("--article <id>", "Article ID affected by amendment")
  .action(async (opts) => {
    await constitutionCommand({
      amend: opts.amend,
      article: opts.article,
    });
  });

program
  .command("specify <name>")
  .description("Create a structured feature spec")
  .option("-b, --branch", "Create a git branch for this feature")
  .action(async (name: string, opts) => {
    await specifyCommand(name, { branch: opts.branch });
  });

program
  .command("clarify <spec-id>")
  .description("Scan a spec for ambiguities and generate clarification questions")
  .action(async (specId: string) => {
    await clarifyCommand(specId);
  });

program
  .command("plan <spec-id>")
  .description("Generate an implementation plan from a feature spec")
  .action(async (specId: string) => {
    await planCommand(specId);
  });

program
  .command("tasks <spec-id>")
  .description("Generate a dependency-ordered task list from a feature spec")
  .action(async (specId: string) => {
    await tasksCommand(specId);
  });

program
  .command("analyze [spec-id]")
  .description("Cross-artifact consistency check")
  .action(async (specId?: string) => {
    await analyzeCommand(specId);
  });

program
  .command("watch")
  .description("Watch spec files and auto-validate on changes")
  .option("--auto-generate", "Also auto-generate on changes")
  .action(async (opts) => {
    await watchCommand({ autoGenerate: opts.autoGenerate });
  });

program
  .command("issues <spec-id>")
  .description("Create GitHub Issues from generated tasks")
  .option("--dry-run", "Preview issues without creating them")
  .action(async (specId: string, opts) => {
    await issuesCommand(specId, { dryRun: opts.dryRun });
  });

program
  .command("implement <spec-id>")
  .description("Run full implementation pipeline: clarify → plan → tasks → analyze → generate")
  .option("--skip-generate", "Skip code generation step")
  .option("-p, --plugins <plugins...>", "Plugins to use for generation")
  .action(async (specId: string, opts) => {
    await implementCommand(specId, {
      skipGenerate: opts.skipGenerate,
      plugins: opts.plugins,
    });
  });

program
  .command("remove")
  .description("Remove SpecForge and Claude Code integration from current project")
  .option("--force", "Confirm removal without preview")
  .action(async (opts) => {
    await removeCommand({ force: opts.force });
  });

program.parse();
