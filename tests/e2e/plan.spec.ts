import { testWithSpec, expect } from "./fixtures";
import { expectFileExists, expectFileContains, expectStdoutContains } from "./helpers";

testWithSpec.describe("specforge plan", () => {
  testWithSpec("creates plan.md and data-model.md", async ({ project, specId }) => {
    const result = await project.run(["plan", specId]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Generating implementation plan");
    expectFileExists(project.projectDir, `specs/${specId}/plan.md`);
    expectFileExists(project.projectDir, `specs/${specId}/data-model.md`);
  });

  testWithSpec("plan.md contains phases", async ({ project, specId }) => {
    await project.run(["plan", specId]);

    expectFileContains(project.projectDir, `specs/${specId}/plan.md`, "Phase");
  });

  testWithSpec("outputs phase count", async ({ project, specId }) => {
    const result = await project.run(["plan", specId]);

    expectStdoutContains(result, "Phases:");
    expectStdoutContains(result, "File changes:");
  });

  testWithSpec("fails with invalid spec ID", async ({ project }) => {
    const result = await project.run(["plan", "nonexistent-spec"]);

    expect(result.exitCode).not.toBe(0);
  });
});
