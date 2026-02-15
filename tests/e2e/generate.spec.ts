import { test, expect } from "./fixtures";

test.describe("specforge generate", () => {
  test("generates files from app.spec.yaml", async ({ project }) => {
    const result = await project.run(["generate"]);

    // generate should succeed or warn about no plugins
    expect(result.exitCode).toBe(0);
    expect(result.stdout + result.stderr).not.toContain("Cannot find");
  });

  test("generates with specific plugins", async ({ project }) => {
    const result = await project.run(["generate", "-p", "model", "prisma"]);

    expect(result.exitCode).toBe(0);
  });

  test("validate passes on valid spec", async ({ project }) => {
    const result = await project.run(["validate"]);

    expect(result.exitCode).toBe(0);
  });
});
