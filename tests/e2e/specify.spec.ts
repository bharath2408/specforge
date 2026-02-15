import { test, expect } from "./fixtures";
import { expectFileExists, expectFileContains, expectStdoutContains } from "./helpers";

test.describe("specforge specify", () => {
  test("creates a new feature spec with correct structure", async ({ project }) => {
    const result = await project.run(["specify", "user-authentication"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "001-user-authentication");
    expectFileExists(project.projectDir, "specs/001-user-authentication/spec.md");
  });

  test("spec.md contains required sections", async ({ project }) => {
    await project.run(["specify", "user-authentication"]);

    expectFileContains(project.projectDir, "specs/001-user-authentication/spec.md", "## User Scenarios");
    expectFileContains(project.projectDir, "specs/001-user-authentication/spec.md", "## Functional Requirements");
    expectFileContains(project.projectDir, "specs/001-user-authentication/spec.md", "## Key Entities");
    expectFileContains(project.projectDir, "specs/001-user-authentication/spec.md", "## Success Criteria");
    expectFileContains(project.projectDir, "specs/001-user-authentication/spec.md", "## Edge Cases");
  });

  test("increments sequence number for second spec", async ({ project }) => {
    await project.run(["specify", "first-feature"]);
    const result = await project.run(["specify", "second-feature"]);

    expect(result.exitCode).toBe(0);
    expectFileExists(project.projectDir, "specs/001-first-feature/spec.md");
    expectFileExists(project.projectDir, "specs/002-second-feature/spec.md");
  });

  test("fails without a feature name", async ({ project }) => {
    const result = await project.run(["specify"]);

    expect(result.exitCode).not.toBe(0);
  });
});
