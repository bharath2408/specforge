import { testWithSpec, expect } from "./fixtures";
import { expectFileExists, expectStdoutContains } from "./helpers";

testWithSpec.describe("specforge brainstorm", () => {
  testWithSpec("requires plan.md first", async ({ project, specId }) => {
    // brainstorm without plan should fail
    const result = await project.run(["brainstorm", specId, "--offline"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("plan");
  });

  testWithSpec("produces brainstorm-report.md in offline mode", async ({ project, specId }) => {
    // First generate the plan
    await project.run(["plan", specId]);

    const result = await project.run(["brainstorm", specId, "--offline"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Brainstorming for");
    expectStdoutContains(result, "Tool selection for");
    expectFileExists(project.projectDir, `specs/${specId}/brainstorm-report.md`);
  });

  testWithSpec("shows tool selection summary", async ({ project, specId }) => {
    await project.run(["plan", specId]);

    const result = await project.run(["brainstorm", specId, "--offline"]);

    expectStdoutContains(result, "npm search");
    expectStdoutContains(result, "GitHub search");
    expectStdoutContains(result, "Heuristics");
    expectStdoutContains(result, "ON");
    expectStdoutContains(result, "OFF");
  });

  testWithSpec("--exclude disables specific tools", async ({ project, specId }) => {
    await project.run(["plan", specId]);

    const result = await project.run(["brainstorm", specId, "--exclude", "npm,github"]);

    expectStdoutContains(result, "Force-disabled via --exclude npm");
    expectStdoutContains(result, "Force-disabled via --exclude github");
  });

  testWithSpec("--include all enables all tools", async ({ project, specId }) => {
    await project.run(["plan", specId]);

    // Use --include all but also --exclude to avoid actual network calls
    const result = await project.run(["brainstorm", specId, "--include", "all", "--exclude", "npm,github,screenshots"]);

    // --exclude wins over --include
    expectStdoutContains(result, "Force-disabled via --exclude");
  });
});
