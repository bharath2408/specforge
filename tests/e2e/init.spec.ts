import { test as base, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execSpecforge, expectFileExists, expectFileContains } from "./helpers";

base.describe("specforge init", () => {
  let tmpDir: string;

  base.beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "specforge-e2e-init-"));
  });

  base.afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  base("creates project structure with expected files", async () => {
    const result = await execSpecforge(["init", "."], tmpDir);

    expect(result.exitCode).toBe(0);
    expectFileExists(tmpDir, "spec/app.spec.yaml");
    expectFileExists(tmpDir, "CLAUDE.md");
    expectFileExists(tmpDir, ".specforge/version.yaml");
  });

  base("creates CLAUDE.md with specforge markers", async () => {
    await execSpecforge(["init", "."], tmpDir);

    expectFileContains(tmpDir, "CLAUDE.md", "<!-- specforge:start -->");
    expectFileContains(tmpDir, "CLAUDE.md", "<!-- specforge:end -->");
    expectFileContains(tmpDir, "CLAUDE.md", "SpecForge");
  });

  base("creates slash command files", async () => {
    await execSpecforge(["init", "."], tmpDir);

    expectFileExists(tmpDir, ".claude/commands/specforge-specify.md");
    expectFileExists(tmpDir, ".claude/commands/specforge-clarify.md");
    expectFileExists(tmpDir, ".claude/commands/specforge-plan.md");
    expectFileExists(tmpDir, ".claude/commands/specforge-brainstorm.md");
    expectFileExists(tmpDir, ".claude/commands/specforge-review.md");
  });

  base("creates version file with version", async () => {
    await execSpecforge(["init", "."], tmpDir);

    expectFileExists(tmpDir, ".specforge/version.yaml");
    expectFileContains(tmpDir, ".specforge/version.yaml", "version:");
  });
});
