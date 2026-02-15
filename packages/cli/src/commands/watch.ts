import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge-dev/core/config";
import { validateCommand } from "./validate.js";
import { generateCommand } from "./generate.js";

export interface WatchCommandOptions {
  autoGenerate?: boolean;
}

export async function watchCommand(
  opts: WatchCommandOptions = {}
): Promise<void> {
  const config = loadConfig();
  const watchDirs: string[] = [];

  // Collect directories to watch
  const specDir = path.resolve(config.specDir);
  const specsDir = path.resolve(config.specsDir);

  if (fs.existsSync(specDir)) {
    watchDirs.push(specDir);
  }
  if (fs.existsSync(specsDir)) {
    watchDirs.push(specsDir);
  }

  if (watchDirs.length === 0) {
    console.error(
      "\n  No spec directories found to watch.\n" +
        "  Create a 'spec/' or 'specs/' directory first.\n"
    );
    process.exit(1);
  }

  console.log(`\n  Watching for changes...\n`);
  for (const dir of watchDirs) {
    console.log(`    ${dir}`);
  }
  console.log(
    `\n  Auto-generate: ${opts.autoGenerate ? "enabled" : "disabled (use --auto-generate to enable)"}`
  );
  console.log(`  Press Ctrl+C to stop.\n`);

  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 500;

  function handleChange(eventType: string, filename: string | null) {
    if (!filename) return;

    // Only watch relevant file extensions
    const ext = path.extname(filename);
    if (
      ![".yaml", ".yml", ".json", ".md"].includes(ext)
    ) {
      return;
    }

    // Debounce rapid changes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`  [${timestamp}] Change detected: ${filename}`);

      try {
        // Always validate
        console.log(`  [${timestamp}] Running validation...`);
        await validateCommand().catch(() => {
          console.log(`  [${timestamp}] Validation found issues.`);
        });

        // Optionally generate
        if (opts.autoGenerate) {
          console.log(`  [${timestamp}] Running generation...`);
          await generateCommand().catch(() => {
            console.log(`  [${timestamp}] Generation failed.`);
          });
        }

        console.log(`  [${timestamp}] Done.\n`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  [${timestamp}] Error: ${message}\n`);
      }
    }, DEBOUNCE_MS);
  }

  // Watch all directories recursively
  const watchers: fs.FSWatcher[] = [];

  for (const dir of watchDirs) {
    try {
      const watcher = fs.watch(
        dir,
        { recursive: true },
        handleChange
      );
      watchers.push(watcher);
    } catch (err) {
      console.error(`  Warning: Could not watch ${dir}`);
    }
  }

  // Keep the process alive
  process.on("SIGINT", () => {
    console.log("\n  Stopping watch mode...\n");
    for (const watcher of watchers) {
      watcher.close();
    }
    process.exit(0);
  });

  // Prevent Node from exiting
  await new Promise(() => {});
}
