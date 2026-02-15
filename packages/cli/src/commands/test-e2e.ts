import { execFileSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

interface TestE2eOptions {
  command?: string;
  suite?: string;
  headed?: boolean;
  workers?: string;
}

export async function testE2eCommand(options: TestE2eOptions = {}): Promise<void> {
  // Check if playwright is installed
  const rootDir = findMonorepoRoot();
  const playwrightConfig = path.join(rootDir, "playwright.config.ts");

  if (!fs.existsSync(playwrightConfig)) {
    console.error("\n  Playwright config not found.");
    console.error("  Run `npm install -D @playwright/test` and create playwright.config.ts first.\n");
    process.exit(1);
  }

  // Build playwright args
  const args: string[] = ["playwright", "test"];

  // Filter by command or suite
  if (options.command) {
    args.push(`tests/e2e/${options.command}.spec.ts`);
  } else if (options.suite) {
    if (options.suite === "pipeline") {
      args.push("--project", "pipeline");
    } else if (options.suite === "errors") {
      args.push("--grep", "fails|error|invalid");
    } else {
      args.push(`tests/e2e/${options.suite}.spec.ts`);
    }
  }

  if (options.workers) {
    args.push("--workers", options.workers);
  }

  console.log(`\n  Running E2E tests...\n`);
  console.log(`  Command: npx ${args.join(" ")}\n`);

  try {
    execFileSync("npx", args, {
      cwd: rootDir,
      stdio: "inherit",
      env: { ...process.env, NO_COLOR: "1" },
    });
    console.log("\n  All E2E tests passed.\n");
  } catch {
    console.error("\n  Some E2E tests failed. Check the report above.\n");
    process.exit(1);
  }
}

function findMonorepoRoot(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "playwright.config.ts"))) {
      return dir;
    }
    // Check if this is the monorepo root (has packages/ dir)
    if (fs.existsSync(path.join(dir, "packages")) && fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}
