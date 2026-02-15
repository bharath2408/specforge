import { parseSpecFile, discoverSpecFiles, validateSpec } from "@specforge-dev/core";
import { findSpecDir } from "../utils.js";

export async function validateCommand(specPath?: string): Promise<void> {
  let specFiles: string[];

  if (specPath) {
    specFiles = [specPath];
  } else {
    const specDir = findSpecDir();
    specFiles = discoverSpecFiles(specDir);
  }

  if (specFiles.length === 0) {
    console.error(
      "No spec files found. Run 'specforge init' to create a project, or specify a spec file path."
    );
    process.exit(1);
  }

  let hasErrors = false;

  for (const file of specFiles) {
    console.log(`\nValidating: ${file}`);

    try {
      const rawSpec = parseSpecFile(file);
      const result = validateSpec(rawSpec);

      if (result.success) {
        console.log(`  ✓ Valid`);
        console.log(`    Models: ${Object.keys(result.spec!.models).join(", ")}`);
        console.log(`    Endpoints: ${result.spec!.api.endpoints.length}`);
        const testCount = Object.values(result.spec!.tests).reduce(
          (sum, tests) => sum + tests.length,
          0
        );
        if (testCount > 0) {
          console.log(`    Tests: ${testCount}`);
        }
      } else {
        hasErrors = true;
        console.log(`  ✗ Invalid`);
        for (const error of result.errors) {
          const location = error.path ? ` at ${error.path}` : "";
          console.log(`    - ${error.message}${location}`);
        }
      }
    } catch (err) {
      hasErrors = true;
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ Error: ${message}`);
    }
  }

  console.log();

  if (hasErrors) {
    process.exit(1);
  }
}
