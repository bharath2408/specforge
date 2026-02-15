import { testWithSpec, expect } from "./fixtures";
import { expectFileExists, expectStdoutContains } from "./helpers";

testWithSpec.describe("specforge analyze", () => {
  testWithSpec("creates analysis-report.md", async ({ project, specId }) => {
    const result = await project.run(["analyze", specId]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Analyzing consistency");
    expectFileExists(project.projectDir, `specs/${specId}/analysis-report.md`);
  });

  testWithSpec("outputs severity summary", async ({ project, specId }) => {
    const result = await project.run(["analyze", specId]);

    expectStdoutContains(result, "CRITICAL:");
    expectStdoutContains(result, "HIGH:");
    expectStdoutContains(result, "MEDIUM:");
    expectStdoutContains(result, "LOW:");
  });

  testWithSpec("analyze all specs when no spec-id given", async ({ project }) => {
    // Create a spec first
    await project.run(["specify", "some-feature"]);

    const result = await project.run(["analyze"]);

    expect(result.exitCode).toBe(0);
  });
});
