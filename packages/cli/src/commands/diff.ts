import * as fs from "node:fs";
import * as path from "node:path";
import {
  parseSpecFile,
  discoverSpecFiles,
  validateSpecOrThrow,
} from "@specforge/core";
import { generate, getBuiltinPlugins } from "@specforge/generator";
import { findSpecDir } from "../utils.js";
import { computeFileDiff } from "../diff-utils.js";
import type { FileDiff } from "../diff-utils.js";

export interface DiffCommandOptions {
  plugins?: string[];
  specPath?: string;
  verbose?: boolean;
}

export async function diffCommand(
  opts: DiffCommandOptions = {}
): Promise<void> {
  const specDir = findSpecDir();
  const specFiles = opts.specPath
    ? [opts.specPath]
    : discoverSpecFiles(specDir);

  if (specFiles.length === 0) {
    console.error(
      "No spec files found. Run 'specforge init' to create a project."
    );
    process.exit(1);
  }

  const outputDir = process.cwd();
  const pluginNames = opts.plugins ?? getBuiltinPlugins();

  console.log(`\n  Comparing generated code vs on-disk files...\n`);

  let totalAdded = 0;
  let totalModified = 0;
  let totalDeleted = 0;
  let totalUnchanged = 0;

  for (const specFile of specFiles) {
    try {
      const rawSpec = parseSpecFile(specFile);
      const spec = validateSpecOrThrow(rawSpec);

      const result = generate(spec, {
        outputDir,
        overwrite: true,
        plugins: pluginNames,
      });

      const diffs: FileDiff[] = [];

      for (const file of result.files) {
        const fullPath = path.join(outputDir, file.path);
        const existingContent = fs.existsSync(fullPath)
          ? fs.readFileSync(fullPath, "utf-8")
          : null;

        const diff = computeFileDiff(file.path, file.content, existingContent);
        diffs.push(diff);

        switch (diff.status) {
          case "added":
            totalAdded++;
            break;
          case "modified":
            totalModified++;
            break;
          case "unchanged":
            totalUnchanged++;
            break;
        }
      }

      // Display results
      for (const diff of diffs) {
        if (diff.status === "unchanged") continue;

        const statusLabel =
          diff.status === "added"
            ? "[ADD]"
            : diff.status === "modified"
              ? "[MOD]"
              : "[DEL]";

        console.log(`  ${statusLabel} ${diff.path}`);

        if (opts.verbose && diff.lines.length > 0) {
          // Show up to 10 diff lines
          const displayLines = diff.lines
            .filter((l) => l.type !== "unchanged")
            .slice(0, 10);

          for (const line of displayLines) {
            const prefix = line.type === "add" ? "  +" : "  -";
            console.log(`    ${prefix} ${line.content}`);
          }

          const remaining =
            diff.lines.filter((l) => l.type !== "unchanged").length -
            displayLines.length;
          if (remaining > 0) {
            console.log(`    ... and ${remaining} more changes`);
          }
          console.log();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Error processing ${specFile}: ${message}`);
    }
  }

  // Summary
  console.log(`\n  Summary:`);
  console.log(`    New files:       ${totalAdded}`);
  console.log(`    Modified files:  ${totalModified}`);
  console.log(`    Unchanged files: ${totalUnchanged}`);

  if (totalAdded === 0 && totalModified === 0) {
    console.log(`\n  Everything is up to date.\n`);
  } else {
    console.log(
      `\n  Run 'specforge generate' to apply these changes.\n`
    );
  }
}
