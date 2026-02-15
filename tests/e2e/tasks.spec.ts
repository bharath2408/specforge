import { testWithSpec, expect } from "./fixtures";
import { expectFileExists, expectFileContains, expectStdoutContains } from "./helpers";

testWithSpec.describe("specforge tasks", () => {
  testWithSpec("creates tasks.md from spec", async ({ project, specId }) => {
    const result = await project.run(["tasks", specId]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Generating tasks");
    expectStdoutContains(result, "Total tasks:");
    expectFileExists(project.projectDir, `specs/${specId}/tasks.md`);
  });

  testWithSpec("tasks.md contains task IDs and phases", async ({ project, specId }) => {
    await project.run(["tasks", specId]);

    expectFileContains(project.projectDir, `specs/${specId}/tasks.md`, "[T001]");
    expectFileContains(project.projectDir, `specs/${specId}/tasks.md`, "Setup");
  });

  testWithSpec("outputs priority breakdown", async ({ project, specId }) => {
    const result = await project.run(["tasks", specId]);

    expectStdoutContains(result, "By priority:");
    expectStdoutContains(result, "P1=");
  });

  testWithSpec("fails with invalid spec ID", async ({ project }) => {
    const result = await project.run(["tasks", "nonexistent-spec"]);

    expect(result.exitCode).not.toBe(0);
  });
});
