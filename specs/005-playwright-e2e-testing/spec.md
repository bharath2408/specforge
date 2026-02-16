# Feature Spec: Playwright MCP E2E Testing Command

> Spec ID: 005-playwright-e2e-testing
> Created: 2026-02-15

## Status

Status: draft

## Overview

Add a new `specforge test-e2e` command that uses Playwright MCP to run end-to-end tests against every SpecForge CLI command. Each command (init, constitution, specify, clarify, review, plan, brainstorm, tasks, analyze, generate, diff, update) gets a dedicated Playwright test suite that validates the full input-to-output flow — running the command, checking stdout, and verifying generated files on disk.

## User Scenarios

### [US1] [P1] Run full E2E test suite across all commands

**Given** a SpecForge project with a sample spec in a temporary directory
**When** the developer runs `specforge test-e2e`
**Then** Playwright MCP executes test suites for all CLI commands, reports pass/fail per command, and exits with code 0 if all pass or code 1 if any fail

### [US2] [P1] Run E2E tests for a specific command

**Given** a developer wants to test only the `brainstorm` command
**When** they run `specforge test-e2e --command brainstorm`
**Then** only the brainstorm test suite runs, validating tool selection, report generation, and CLI flags (--offline, --include, --exclude)

### [US3] [P1] Test the full pipeline flow end-to-end

**Given** a clean temporary project directory
**When** the developer runs `specforge test-e2e --suite pipeline`
**Then** the test runs the complete pipeline (init → specify → clarify → review → plan → brainstorm → tasks → analyze → generate → diff) sequentially and verifies each artifact is created correctly

### [US4] [P2] E2E tests validate generated file contents

**Given** a test suite for `specforge generate`
**When** the test runs against a sample `.spec.yaml`
**Then** it verifies that generated files (models, prisma schema, routes, tests, docs) exist, contain expected content patterns, and compile without errors

### [US5] [P2] E2E tests for error handling and edge cases

**Given** a test suite for error scenarios
**When** the developer runs `specforge test-e2e --suite errors`
**Then** it tests missing spec files, invalid spec IDs, malformed YAML, missing plan.md before brainstorm, and verifies proper error messages and non-zero exit codes

### [US6] [P2] Test results output as HTML report via Playwright

**Given** a completed E2E test run
**When** all tests finish
**Then** Playwright generates an HTML report at `test-results/e2e-report.html` showing pass/fail per command, execution time, and stdout/stderr for failed tests

### [US7] [P3] Run E2E tests in CI with GitHub Actions

**Given** a GitHub Actions workflow
**When** a PR is opened or pushed to main
**Then** the E2E test suite runs in CI using `npx playwright test` and the HTML report is uploaded as an artifact

## Functional Requirements

### [FR-001] Playwright MCP Test Runner Command

Add a new CLI command `specforge test-e2e` that:
- Sets up a temporary project directory with `specforge init`
- Discovers and runs Playwright test files from `tests/e2e/`
- Passes CLI options through to Playwright (`--command`, `--suite`, `--headed`, `--workers`)
- Reports results in terminal and generates HTML report

### [FR-002] Test Fixture: Temporary Project Setup

Create a Playwright test fixture that:
- Creates a fresh temp directory before each test suite
- Runs `specforge init` to scaffold the project
- Creates a sample feature spec with known content for deterministic testing
- Cleans up the temp directory after tests complete

### [FR-003] Command Test Suites

Create individual test files for each SpecForge command:

| Test File | Command Tested | Key Assertions |
|-----------|---------------|----------------|
| `init.spec.ts` | `specforge init` | Creates config, spec dir, CLAUDE.md, constitution, slash commands |
| `constitution.spec.ts` | `specforge constitution` | Creates constitution.md with 9 articles, supports --amend |
| `specify.spec.ts` | `specforge specify` | Creates spec dir with spec.md, correct sequence numbering |
| `clarify.spec.ts` | `specforge clarify` | Produces clarification-log.md, coverage table output |
| `review.spec.ts` | `specforge review` | Produces review-report.md, score output, --strict/--ci flags |
| `plan.spec.ts` | `specforge plan` | Creates plan.md + data-model.md, phase count output |
| `brainstorm.spec.ts` | `specforge brainstorm` | Tool selection summary, brainstorm-report.md, --offline/--include/--exclude |
| `tasks.spec.ts` | `specforge tasks` | Creates tasks.md, task count output, dependency ordering |
| `analyze.spec.ts` | `specforge analyze` | Creates analysis-report.md, severity counts output |
| `generate.spec.ts` | `specforge generate` | Generates model/prisma/route/test files from .spec.yaml |
| `diff.spec.ts` | `specforge diff` | Shows file changes without writing, -v verbose output |
| `update.spec.ts` | `specforge update` | Syncs CLAUDE.md and slash commands, --dry-run/--force |

### [FR-004] Pipeline Integration Test

Create `pipeline.spec.ts` that runs the full 10-step pipeline sequentially:
1. `init` → verify project structure
2. `specify user-auth` → verify spec.md created
3. `clarify` → verify clarification-log.md
4. `review` → verify score output and review-report.md
5. `plan` → verify plan.md and data-model.md
6. `brainstorm --offline` → verify brainstorm-report.md and tool selection
7. `tasks` → verify tasks.md
8. `analyze` → verify analysis-report.md
9. `generate` → verify generated source files
10. `diff` → verify no unexpected changes

### [FR-005] CLI Execution Helper

Create a test utility `execSpecforge(command, args, cwd)` that:
- Spawns the SpecForge CLI as a child process
- Captures stdout, stderr, and exit code
- Supports timeout (default 30s per command)
- Returns a structured result: `{ stdout, stderr, exitCode, duration }`

### [FR-006] Assertion Helpers

Create assertion helpers for common checks:
- `expectFileExists(dir, relativePath)` — assert a file was created
- `expectFileContains(dir, relativePath, pattern)` — assert file content matches regex
- `expectStdoutContains(result, text)` — assert command output contains text
- `expectExitCode(result, code)` — assert exit code
- `expectMarkdownSection(dir, file, sectionHeading)` — assert a markdown section exists

### [FR-007] Playwright Configuration

Create `playwright.config.ts` configured for CLI E2E testing:
- No browser needed (CLI testing, not web)
- Workers: 1 for pipeline tests (sequential), parallel for individual command tests
- Timeout: 60s per test, 5min for pipeline suite
- Reporter: HTML + terminal list
- Test directory: `tests/e2e/`

### [FR-008] GitHub Actions Workflow

Create `.github/workflows/e2e.yml` that:
- Triggers on push to main and PRs
- Installs Node.js, pnpm, builds the project
- Runs `npx playwright test`
- Uploads HTML report as artifact on failure

## Key Entities

- **TestSuite** — A collection of Playwright tests for one SpecForge command (e.g., `brainstorm.spec.ts`)
- **TestFixture** — Reusable setup/teardown that creates a temp project directory
- **CommandResult** — Structured output from running a CLI command (stdout, stderr, exitCode, duration)
- **TestReport** — HTML report generated by Playwright after test run

## Success Criteria

- All 12 command test suites pass on a clean machine with Node.js 18+
- Pipeline integration test completes the full 10-step flow without failures
- Each test suite runs in under 30 seconds individually
- Full test suite runs in under 3 minutes
- HTML report is generated with pass/fail details per test
- CI workflow runs successfully on GitHub Actions
- Zero false positives — tests only fail when actual behavior is broken

## Edge Cases

- Command not found (SpecForge not built) — test should fail with clear error message
- Temp directory permissions issue — test should catch and report EACCES errors
- Spec with unicode characters in name — `specforge specify café-menu` should work
- Empty spec.yaml — generate should fail gracefully
- Tests run on macOS, Linux, and Windows (path separators, line endings)
- Multiple test runs in parallel — temp directories should not collide (use unique names)
- Node.js version compatibility — tests should work on Node 18, 20, 22

## Error Handling

- If Playwright is not installed, `specforge test-e2e` prints: "Playwright not found. Run `npm install -D @playwright/test` first."
- If a test command times out (>60s), mark it as failed with timeout error
- If temp directory creation fails, skip test with a warning instead of crashing the suite

## Authentication

Not applicable — all tests run locally against the CLI with no external API calls. Brainstorm tests use `--offline` mode.

## Open Questions

- Should we use Playwright's `@playwright/test` directly or wrap it in a SpecForge-specific runner?
- Should test fixtures pre-populate specs from existing `specs/` examples or generate fresh ones?
- Should the E2E tests be in the monorepo root `tests/e2e/` or in a separate `packages/e2e/` package?
