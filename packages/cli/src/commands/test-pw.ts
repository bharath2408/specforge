import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import {
  loadConfig,
  resolveSpecDir,
  parseSpecMarkdown,
  parseSpecDirName,
  parseSpecFile,
  validateSpecOrThrow,
  discoverSpecFiles,
} from "@specforge-dev/core";
import type { FeatureSpec, UserScenario } from "@specforge-dev/core";
import { generate } from "@specforge-dev/generator";
import { findSpecDir, writeGeneratedFile } from "../utils.js";
import { renderTemplate } from "@specforge-dev/generator";

export interface TestPwOptions {
  run?: boolean;
  headed?: boolean;
  apiOnly?: boolean;
  baseUrl?: string;
}

// Keywords that suggest a UI/browser interaction scenario
const UI_KEYWORDS = [
  "page", "form", "click", "button", "dashboard", "navigate",
  "display", "input", "submit", "modal", "dialog", "tab",
  "menu", "dropdown", "checkbox", "radio", "upload", "screenshot",
];

// Keywords that suggest an API/request scenario
const API_KEYWORDS = [
  "api", "endpoint", "post", "get", "put", "delete", "patch",
  "request", "response", "json", "status", "header", "token",
  "payload", "body",
];

function isUiScenario(scenario: UserScenario): boolean {
  const text =
    `${scenario.given} ${scenario.when} ${scenario.then} ${scenario.description}`.toLowerCase();
  return UI_KEYWORDS.some((kw) => text.includes(kw));
}

function isApiScenario(scenario: UserScenario): boolean {
  const text =
    `${scenario.given} ${scenario.when} ${scenario.then} ${scenario.description}`.toLowerCase();
  return API_KEYWORDS.some((kw) => text.includes(kw));
}

function extractHttpMethod(scenario: UserScenario): string {
  const text = `${scenario.when}`.toLowerCase();
  if (text.includes("post")) return "post";
  if (text.includes("put")) return "put";
  if (text.includes("patch")) return "patch";
  if (text.includes("delete")) return "delete";
  return "get";
}

function extractPath(scenario: UserScenario): string {
  const text = `${scenario.when} ${scenario.then}`;
  const pathMatch = text.match(/\/[a-z0-9/_-]+/i);
  return pathMatch ? pathMatch[0] : "/";
}

function isUiEntity(entityName: string): boolean {
  const lower = entityName.toLowerCase();
  return UI_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function testPwCommand(
  specId?: string,
  options: TestPwOptions = {}
): Promise<void> {
  const baseUrl = options.baseUrl ?? "http://localhost:3000";

  // If --run, execute playwright tests
  if (options.run) {
    return runPlaywrightTests(options);
  }

  const config = loadConfig();
  const outputDir = path.resolve(process.cwd());
  let scenarioFilesWritten = 0;
  let apiFilesWritten = 0;

  // Generate scenario tests from feature spec
  if (specId) {
    const specsDir = path.resolve(config.specsDir);
    const specDir = resolveSpecDir(specsDir, specId);

    if (!specDir) {
      console.error(`\n  Spec not found: ${specId}`);
      console.error(
        "  Run 'specforge specify <name>' to create a spec first.\n"
      );
      process.exit(1);
    }

    const specPath = path.join(specDir, "spec.md");
    if (!fs.existsSync(specPath)) {
      console.error(`\n  No spec.md found in: ${specDir}\n`);
      process.exit(1);
    }

    const content = fs.readFileSync(specPath, "utf-8");
    const parsed = parseSpecDirName(path.basename(specDir));
    if (!parsed) {
      console.error(`\n  Invalid spec directory: ${specDir}\n`);
      process.exit(1);
    }

    const spec = parseSpecMarkdown(content, parsed.seq, parsed.slug);

    console.log(`\n  Generating Playwright tests for: ${specId}\n`);

    if (spec.scenarios.length === 0 && !options.apiOnly) {
      console.log(
        "  No user scenarios found in spec.md. Skipping scenario tests.\n"
      );
    }

    if (!options.apiOnly && spec.scenarios.length > 0) {
      // Generate scenario tests
      scenarioFilesWritten += generateScenarioTests(
        spec,
        outputDir
      );
    }

    if (!options.apiOnly) {
      // Generate page objects from entities
      const pageObjectCount = generatePageObjects(spec, outputDir);
      if (pageObjectCount > 0) {
        console.log(
          `  Generated ${pageObjectCount} page object(s)`
        );
      }
    }
  }

  // Generate API tests from .spec.yaml via playwright plugin
  if (!specId || !options.apiOnly || options.apiOnly) {
    const specDir = findSpecDir();
    const specFiles = discoverSpecFiles(specDir);

    if (specFiles.length > 0) {
      for (const specFile of specFiles) {
        try {
          const rawSpec = parseSpecFile(specFile);
          const parsedSpec = validateSpecOrThrow(rawSpec);

          if (parsedSpec.api.endpoints.length === 0) continue;

          const result = generate(parsedSpec, {
            outputDir,
            overwrite: true,
            plugins: ["playwright"],
          });

          for (const file of result.files) {
            const { written: didWrite, fullPath } = writeGeneratedFile(
              outputDir,
              file.path,
              file.content,
              file.overwrite
            );
            if (didWrite) {
              const relative = path.relative(process.cwd(), fullPath);
              console.log(`  ✓ ${relative}`);
              apiFilesWritten++;
            }
          }
        } catch {
          // Skip invalid spec files
        }
      }
    }
  }

  // Generate playwright config if not exists
  const configPath = path.join(outputDir, "playwright.config.ts");
  if (!fs.existsSync(configPath)) {
    const configContent = renderTemplate("playwright/config.hbs", {
      baseUrl,
      hasApiTests: apiFilesWritten > 0,
      hasUiTests: scenarioFilesWritten > 0,
    });
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, configContent, "utf-8");
    console.log("  ✓ playwright.config.ts");
  }

  const totalFiles = scenarioFilesWritten + apiFilesWritten;

  if (totalFiles === 0) {
    console.error(
      "\n  Nothing to generate — add scenarios to spec.md or endpoints to .spec.yaml\n"
    );
    process.exit(1);
  }

  console.log(
    `\n  Generated ${totalFiles} test file(s):`
  );
  if (scenarioFilesWritten > 0)
    console.log(`    Scenario tests: ${scenarioFilesWritten}`);
  if (apiFilesWritten > 0)
    console.log(`    API tests + fixtures: ${apiFilesWritten}`);
  console.log(`\n  Next steps:`);
  console.log(`    specforge test-pw --run              # Run the generated tests`);
  console.log(`    specforge test-pw --run --headed     # Run in headed browser mode`);
  console.log(`    specforge test-e2e                   # Run SpecForge CLI E2E tests`);
  console.log(``);
}

function generateScenarioTests(
  spec: FeatureSpec,
  outputDir: string
): number {
  // Sort scenarios by priority
  const sorted = [...spec.scenarios].sort((a, b) => {
    const order = { P1: 0, P2: 1, P3: 2 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  const hasUiScenarios = sorted.some((s) => isUiScenario(s));
  const testArg = hasUiScenarios ? "page, request" : "request";

  // Build page imports for UI entities
  const pageImports = spec.entities
    .filter((e) => isUiEntity(e))
    .map((e) => ({
      className: `${e}Page`,
      fileName: e.toLowerCase(),
    }));

  const scenarios = sorted.map((s) => ({
    ...s,
    isApiScenario: isApiScenario(s),
    isUiScenario: isUiScenario(s),
    httpMethod: extractHttpMethod(s),
    suggestedPath: extractPath(s),
  }));

  const content = renderTemplate("playwright/scenario-test.hbs", {
    specName: spec.name.replace(/-/g, " "),
    specId: spec.id,
    scenarios,
    testArg,
    hasAuth: false,
    pageImports,
  });

  const filePath = `tests/e2e/${spec.slug}.spec.ts`;
  const fullPath = path.join(outputDir, filePath);
  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.replace(/\n{3,}/g, "\n\n"), "utf-8");
  console.log(`  ✓ ${filePath}`);

  return 1;
}

function generatePageObjects(
  spec: FeatureSpec,
  outputDir: string
): number {
  let count = 0;

  for (const entityName of spec.entities) {
    // Generate page objects for entities that look like UI entities
    // or for all entities (they'll be useful for navigation)
    const content = renderTemplate("playwright/page-object.hbs", {
      entityName,
      locators: [
        {
          name: `${entityName.charAt(0).toLowerCase() + entityName.slice(1)}List`,
          selector: `[data-testid='${entityName.toLowerCase()}-list']`,
        },
        {
          name: `${entityName.charAt(0).toLowerCase() + entityName.slice(1)}Form`,
          selector: `[data-testid='${entityName.toLowerCase()}-form']`,
        },
        {
          name: "submitButton",
          selector: "button[type='submit']",
        },
      ],
      actions: [
        {
          name: `fill${entityName}Form`,
          params: `data: Record<string, string>`,
          body: `for (const [key, value] of Object.entries(data)) {\n      await this.page.fill(\`[name="\${key}"]\`, value);\n    }`,
        },
        {
          name: "submit",
          params: "",
          body: `await this.submitButton.click();`,
        },
      ],
    });

    const filePath = `tests/e2e/pages/${entityName.toLowerCase()}.ts`;
    const fullPath = path.join(outputDir, filePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content.replace(/\n{3,}/g, "\n\n"), "utf-8");
    console.log(`  ✓ ${filePath}`);
    count++;
  }

  return count;
}

async function runPlaywrightTests(options: TestPwOptions): Promise<void> {
  const args = ["playwright", "test"];

  if (options.headed) {
    args.push("--headed");
  }

  if (options.apiOnly) {
    args.push("--project", "api");
  }

  console.log(`\n  Running Playwright tests...\n`);
  console.log(`  Command: npx ${args.join(" ")}\n`);

  try {
    execFileSync("npx", args, {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    console.log("\n  All Playwright tests passed.\n");
  } catch {
    console.error(
      "\n  Some tests failed. Check the report above.\n"
    );
    process.exit(1);
  }
}
