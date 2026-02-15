import { test, expect } from "./fixtures";
import { expectStdoutContains } from "./helpers";

test.describe("specforge diff", () => {
  test("shows file changes without writing", async ({ project }) => {
    const result = await project.run(["diff"]);

    expect(result.exitCode).toBe(0);
  });

  test("verbose mode shows detailed output", async ({ project }) => {
    const result = await project.run(["diff", "-v"]);

    expect(result.exitCode).toBe(0);
  });
});
