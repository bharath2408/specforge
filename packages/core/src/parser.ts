import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";

export interface ParseOptions {
  /** Base directory for resolving relative spec paths */
  basePath?: string;
}

/**
 * Parse a YAML or JSON spec file and return the raw object.
 */
export function parseSpecFile(filePath: string): unknown {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Spec file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === ".yaml" || ext === ".yml") {
    return parseYaml(content);
  }

  if (ext === ".json") {
    return JSON.parse(content);
  }

  // Try YAML first, fall back to JSON
  try {
    return parseYaml(content);
  } catch {
    return JSON.parse(content);
  }
}

/**
 * Parse a YAML or JSON string and return the raw object.
 */
export function parseSpecString(content: string, format: "yaml" | "json" = "yaml"): unknown {
  if (format === "json") {
    return JSON.parse(content);
  }
  return parseYaml(content);
}

/**
 * Discover spec files in a directory.
 */
export function discoverSpecFiles(dir: string): string[] {
  const absoluteDir = path.resolve(dir);

  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const specFiles: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (
      (ext === ".yaml" || ext === ".yml" || ext === ".json") &&
      entry.name.includes(".spec.")
    ) {
      specFiles.push(path.join(absoluteDir, entry.name));
    }
  }

  return specFiles.sort();
}
