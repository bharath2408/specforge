import * as path from "node:path";
import {
  parseSpecFile,
  discoverSpecFiles,
  validateSpecOrThrow,
} from "@specforge-dev/core";
import { generate, getBuiltinPlugins } from "@specforge-dev/generator";
import { findSpecDir, writeGeneratedFile } from "../utils.js";

export interface GenerateCommandOptions {
  output?: string;
  plugins?: string[];
  specPath?: string;
}

export async function generateCommand(
  opts: GenerateCommandOptions = {}
): Promise<void> {
  const specDir = findSpecDir();
  const specFiles = opts.specPath ? [opts.specPath] : discoverSpecFiles(specDir);

  if (specFiles.length === 0) {
    console.error(
      "No spec files found. Run 'specforge init' to create a project, or specify a spec file path."
    );
    process.exit(1);
  }

  const outputDir = path.resolve(opts.output ?? process.cwd());
  const pluginNames = opts.plugins ?? getBuiltinPlugins();

  console.log(`\nGenerating code from specs...\n`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Plugins: ${pluginNames.join(", ")}\n`);

  for (const specFile of specFiles) {
    console.log(`  Processing: ${specFile}`);

    try {
      const rawSpec = parseSpecFile(specFile);
      const spec = validateSpecOrThrow(rawSpec);

      const result = generate(spec, {
        outputDir,
        overwrite: true,
        plugins: pluginNames,
      });

      let written = 0;
      let skipped = 0;

      for (const file of result.files) {
        const { written: didWrite, fullPath } = writeGeneratedFile(
          outputDir,
          file.path,
          file.content,
          file.overwrite
        );

        if (didWrite) {
          const relative = path.relative(process.cwd(), fullPath);
          console.log(`    ✓ ${relative}`);
          written++;
        } else {
          skipped++;
        }
      }

      console.log(
        `\n  Generated ${written} file(s)${skipped > 0 ? `, skipped ${skipped}` : ""}`
      );

      // Summary by plugin
      for (const [pluginName, files] of Object.entries(result.pluginResults)) {
        console.log(`    ${pluginName}: ${files.length} file(s)`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Error: ${message}`);
      process.exit(1);
    }
  }

  console.log(`\nDone!\n`);
}
