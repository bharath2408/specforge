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
import { brainstormCommand } from "./commands/brainstorm.js";
import { updateCommand } from "./commands/update.js";
import { reviewCommand } from "./commands/review.js";
import { testE2eCommand } from "./commands/test-e2e.js";
import { testPwCommand } from "./commands/test-pw.js";
import {
  commandAddHandler,
  commandListHandler,
  commandEditHandler,
  commandRemoveHandler,
  commandShowHandler,
} from "./commands/command.js";
import { isBuiltInCommand, getCustomCommand } from "@specforge-dev/core";
import { executeCustomCommand } from "./custom-command-runner.js";

const program = new Command();

program
  .name("specforge")
  .description("SpecForge — Spec-Driven Development Kit")
  .version("1.0.5");

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
  .command("brainstorm <spec-id>")
  .description("Analyze spec and plan, research competitors, and generate value-add suggestions")
  .option("--offline", "Skip web research and screenshots")
  .option("--urls <urls...>", "Competitor URLs to analyze")
  .option("--skip-screenshots", "Skip taking screenshots")
  .option("--npm-keywords <keywords...>", "Additional npm search keywords")
  .option("--include <tools...>", "Force-enable tools: npm, github, screenshots, all")
  .option("--exclude <tools...>", "Force-disable tools: npm, github, screenshots")
  .action(async (specId: string, opts) => {
    await brainstormCommand(specId, {
      offline: opts.offline,
      urls: opts.urls,
      skipScreenshots: opts.skipScreenshots,
      npmKeywords: opts.npmKeywords,
      include: opts.include,
      exclude: opts.exclude,
    });
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
  .command("review <spec-id>")
  .description("Score a feature spec on 5 quality dimensions (completeness, clarity, testability, feasibility, consistency)")
  .option("--focus <areas...>", "Only score specific dimensions")
  .option("--strict", "Use stricter scoring thresholds")
  .option("--ci", "CI mode: exit with code 1 if below --min-score or verdict is POOR")
  .option("--min-score <n>", "Minimum passing score for --ci mode", parseInt)
  .action(async (specId: string, opts) => {
    await reviewCommand(specId, {
      focus: opts.focus,
      strict: opts.strict,
      ci: opts.ci,
      minScore: opts.minScore,
    });
  });

program
  .command("test-e2e")
  .description("Run Playwright E2E tests against all SpecForge CLI commands")
  .option("--command <name>", "Test a specific command (e.g., brainstorm, review)")
  .option("--suite <name>", "Run a test suite: pipeline, errors, or a command name")
  .option("--workers <n>", "Number of parallel workers")
  .action(async (opts) => {
    await testE2eCommand({
      command: opts.command,
      suite: opts.suite,
      workers: opts.workers,
    });
  });

program
  .command("test-pw [spec-id]")
  .description("Generate Playwright MCP E2E tests from feature specs and .spec.yaml")
  .option("--run", "Run all generated Playwright tests")
  .option("--headed", "Run in headed browser mode (with --run)")
  .option("--api-only", "Only generate API tests (skip UI/page objects)")
  .option("--base-url <url>", "Application base URL (default: http://localhost:3000)")
  .action(async (specId: string | undefined, opts) => {
    await testPwCommand(specId, {
      run: opts.run,
      headed: opts.headed,
      apiOnly: opts.apiOnly,
      baseUrl: opts.baseUrl,
    });
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

program
  .command("update")
  .description("Sync project integration files (CLAUDE.md, slash commands) with installed CLI version")
  .option("--dry-run", "Preview changes without writing files")
  .option("--force", "Force update even if versions match")
  .action(async (opts) => {
    await updateCommand({ dryRun: opts.dryRun, force: opts.force });
  });

// ──────────────────────────────────────────────────────────────
// Custom Commands
// ──────────────────────────────────────────────────────────────

const commandGroup = program
  .command("command")
  .description("Manage custom command shortcuts");

commandGroup
  .command("add <name>")
  .description("Register a new custom command")
  .requiredOption("--run <command>", "Command string to execute")
  .option("--description <text>", "Description of the command")
  .option("--alias <alias>", "Short alias for the command")
  .action(async (name: string, opts) => {
    await commandAddHandler(name, {
      run: opts.run,
      description: opts.description,
      alias: opts.alias,
    });
  });

commandGroup
  .command("list")
  .description("List all custom commands")
  .action(async () => {
    await commandListHandler();
  });

commandGroup
  .command("edit <name>")
  .description("Update an existing custom command")
  .option("--run <command>", "New command string")
  .option("--description <text>", "New description")
  .option("--alias <alias>", "New alias")
  .action(async (name: string, opts) => {
    await commandEditHandler(name, {
      run: opts.run,
      description: opts.description,
      alias: opts.alias,
    });
  });

commandGroup
  .command("remove <name>")
  .description("Remove a custom command")
  .action(async (name: string) => {
    await commandRemoveHandler(name);
  });

commandGroup
  .command("show <name>")
  .description("Show details of a custom command")
  .action(async (name: string) => {
    await commandShowHandler(name);
  });

// ──────────────────────────────────────────────────────────────
// Entry point with custom command interception
// ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const subcommand = process.argv[2];

  // If no subcommand or it's a built-in, let Commander handle it
  if (!subcommand || subcommand.startsWith("-") || isBuiltInCommand(subcommand)) {
    await program.parseAsync();
    return;
  }

  // Check if it's a custom command or alias
  const custom = getCustomCommand(subcommand);
  if (custom) {
    const exitCode = executeCustomCommand(subcommand, process.argv.slice(3));
    process.exit(exitCode);
  }

  // Fall through to Commander (will show help/error for unknown commands)
  await program.parseAsync();
}

main();
