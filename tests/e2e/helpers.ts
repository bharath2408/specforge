import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { expect } from "@playwright/test";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

const CLI_PATH = path.resolve(__dirname, "../../packages/cli/dist/index.js");

/**
 * Execute a SpecForge CLI command and capture output.
 */
export function execSpecforge(
  args: string[],
  cwd: string,
  timeoutMs: number = 30_000
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = execFile(
      process.execPath,
      [CLI_PATH, ...args],
      { cwd, timeout: timeoutMs, env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } },
      (error, stdout, stderr) => {
        let exitCode = 0;
        if (error) {
          // node child_process puts the exit code in error.code as a number, or as a string like 'ERR_...'
          if (typeof (error as NodeJS.ErrnoException).code === "number") {
            exitCode = (error as NodeJS.ErrnoException).code as unknown as number;
          } else if ((error as Record<string, unknown>).status !== undefined) {
            exitCode = (error as Record<string, unknown>).status as number;
          } else {
            exitCode = 1;
          }
        }
        resolve({
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          exitCode,
          duration: Date.now() - start,
        });
      }
    );
  });
}

// ──────────────────────────────────────────────────────────────
// Assertion helpers
// ──────────────────────────────────────────────────────────────

/** Assert a file exists in the project directory. */
export function expectFileExists(dir: string, relativePath: string): void {
  const fullPath = path.join(dir, relativePath);
  expect(fs.existsSync(fullPath), `Expected file to exist: ${relativePath}`).toBe(true);
}

/** Assert a file does NOT exist. */
export function expectFileNotExists(dir: string, relativePath: string): void {
  const fullPath = path.join(dir, relativePath);
  expect(fs.existsSync(fullPath), `Expected file NOT to exist: ${relativePath}`).toBe(false);
}

/** Assert file content matches a regex or contains a string. */
export function expectFileContains(dir: string, relativePath: string, pattern: string | RegExp): void {
  const fullPath = path.join(dir, relativePath);
  expect(fs.existsSync(fullPath), `File not found: ${relativePath}`).toBe(true);
  const content = fs.readFileSync(fullPath, "utf-8");
  if (typeof pattern === "string") {
    expect(content).toContain(pattern);
  } else {
    expect(content).toMatch(pattern);
  }
}

/** Assert command stdout contains text. */
export function expectStdoutContains(result: CommandResult, text: string): void {
  expect(result.stdout).toContain(text);
}

/** Assert command exit code. */
export function expectExitCode(result: CommandResult, code: number): void {
  expect(result.exitCode).toBe(code);
}

/** Assert a markdown file has a specific section heading. */
export function expectMarkdownSection(dir: string, relativePath: string, heading: string): void {
  const fullPath = path.join(dir, relativePath);
  expect(fs.existsSync(fullPath), `File not found: ${relativePath}`).toBe(true);
  const content = fs.readFileSync(fullPath, "utf-8");
  const pattern = new RegExp(`^#+\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
  expect(content).toMatch(pattern);
}

/** Read a file from the project directory. */
export function readFile(dir: string, relativePath: string): string {
  return fs.readFileSync(path.join(dir, relativePath), "utf-8");
}
