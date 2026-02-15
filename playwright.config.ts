import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 0,
  workers: 4,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  projects: [
    {
      name: "commands",
      testMatch: /^(?!.*pipeline).*\.spec\.ts$/,
    },
    {
      name: "pipeline",
      testMatch: /pipeline\.spec\.ts$/,
      fullyParallel: false,
    },
  ],
});
