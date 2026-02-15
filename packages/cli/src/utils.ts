import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Write a generated file to disk, creating directories as needed.
 */
export function writeGeneratedFile(
  basePath: string,
  filePath: string,
  content: string,
  overwrite: boolean
): { written: boolean; fullPath: string } {
  const fullPath = path.join(basePath, filePath);
  const dir = path.dirname(fullPath);

  if (!overwrite && fs.existsSync(fullPath)) {
    return { written: false, fullPath };
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
  return { written: true, fullPath };
}

/**
 * Find the spec directory for the current project.
 */
export function findSpecDir(cwd: string = process.cwd()): string {
  const specDir = path.join(cwd, "spec");
  if (fs.existsSync(specDir)) {
    return specDir;
  }
  return cwd;
}

/**
 * Check if we're inside a specforge project.
 */
export function isSpecForgeProject(cwd: string = process.cwd()): boolean {
  const specDir = path.join(cwd, "spec");
  return fs.existsSync(specDir);
}

/**
 * Simple colored output helpers (fallback if chalk isn't loaded).
 */
export function formatSuccess(msg: string): string {
  return `✓ ${msg}`;
}

export function formatError(msg: string): string {
  return `✗ ${msg}`;
}

export function formatInfo(msg: string): string {
  return `ℹ ${msg}`;
}
