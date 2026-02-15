import { test, expect } from "./fixtures";
import { expectFileExists, expectFileContains } from "./helpers";

test.describe("specforge constitution", () => {
  test("creates constitution.md", async ({ project }) => {
    const result = await project.run(["constitution"]);

    expect(result.exitCode).toBe(0);
    expectFileExists(project.projectDir, "memory/constitution.md");
  });

  test("constitution contains articles", async ({ project }) => {
    await project.run(["constitution"]);

    expectFileContains(project.projectDir, "memory/constitution.md", "Article");
  });
});
