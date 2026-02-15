import { testWithSpec, expect } from "./fixtures";
import { expectFileExists, expectStdoutContains } from "./helpers";

testWithSpec.describe("specforge clarify", () => {
  testWithSpec("produces clarification-log.md", async ({ project, specId }) => {
    const result = await project.run(["clarify", specId]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Scanning spec for ambiguities");
    expectFileExists(project.projectDir, `specs/${specId}/clarification-log.md`);
  });

  testWithSpec("outputs coverage table", async ({ project, specId }) => {
    const result = await project.run(["clarify", specId]);

    expectStdoutContains(result, "Coverage Table");
    expectStdoutContains(result, "Placeholder Text");
    expectStdoutContains(result, "Missing Priorities");
  });

  testWithSpec("fails with invalid spec ID", async ({ project }) => {
    const result = await project.run(["clarify", "nonexistent-spec"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Spec not found");
  });
});
