import { testWithSpec, expect } from "./fixtures";
import { expectFileExists, expectStdoutContains } from "./helpers";

testWithSpec.describe("specforge review", () => {
  testWithSpec("produces review-report.md with score", async ({ project, specId }) => {
    const result = await project.run(["review", specId]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Reviewing spec");
    expectStdoutContains(result, "Verdict:");
    expectStdoutContains(result, "Completeness");
    expectStdoutContains(result, "Clarity");
    expectStdoutContains(result, "Testability");
    expectStdoutContains(result, "Feasibility");
    expectStdoutContains(result, "Consistency");
    expectFileExists(project.projectDir, `specs/${specId}/review-report.md`);
  });

  testWithSpec("--strict uses stricter thresholds", async ({ project, specId }) => {
    const result = await project.run(["review", specId, "--strict"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Verdict:");
  });

  testWithSpec("--ci --min-score exits with code 1 when below threshold", async ({ project, specId }) => {
    const result = await project.run(["review", specId, "--ci", "--min-score", "99"]);

    // Score is unlikely to be 99+, so this should fail
    expect(result.exitCode).toBe(1);
  });

  testWithSpec("fails with invalid spec ID", async ({ project }) => {
    const result = await project.run(["review", "nonexistent-spec"]);

    expect(result.exitCode).not.toBe(0);
  });
});
