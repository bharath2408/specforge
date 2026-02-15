import { test, expect } from "./fixtures";
import { expectStdoutContains, expectFileContains } from "./helpers";

test.describe("specforge update", () => {
  test("--force re-syncs files", async ({ project }) => {
    const result = await project.run(["update", "--force"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Updating SpecForge integration");
  });

  test("--dry-run previews changes without writing", async ({ project }) => {
    const result = await project.run(["update", "--dry-run"]);

    expect(result.exitCode).toBe(0);
  });

  test("syncs CLAUDE.md with current content", async ({ project }) => {
    await project.run(["update", "--force"]);

    expectFileContains(project.projectDir, "CLAUDE.md", "<!-- specforge:start -->");
    expectFileContains(project.projectDir, "CLAUDE.md", "specforge review");
    expectFileContains(project.projectDir, "CLAUDE.md", "specforge brainstorm");
  });
});
