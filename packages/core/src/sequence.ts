import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Scan a directory for NNN-prefixed entries and return the next sequence number.
 */
export function getNextSequenceNumber(dir: string): number {
  if (!fs.existsSync(dir)) {
    return 1;
  }

  const entries = fs.readdirSync(dir);
  let maxSeq = 0;

  for (const entry of entries) {
    const match = entry.match(/^(\d{3})-/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  return maxSeq + 1;
}

/**
 * Format a sequence number with zero-padding.
 */
export function formatSequence(n: number, width: number = 3): string {
  return String(n).padStart(width, "0");
}

/**
 * Generate a directory name from a sequence number and slug.
 * e.g., formatSpecDirName(1, "add-notifications") => "001-add-notifications"
 */
export function formatSpecDirName(seq: number, slug: string): string {
  return `${formatSequence(seq)}-${slug}`;
}

/**
 * Parse a spec directory name into sequence number and slug.
 */
export function parseSpecDirName(
  dirName: string
): { seq: number; slug: string } | null {
  const match = dirName.match(/^(\d{3})-(.+)$/);
  if (!match) return null;
  return {
    seq: parseInt(match[1], 10),
    slug: match[2],
  };
}

/**
 * Find all spec directories in a specs directory.
 */
export function listSpecDirs(specsDir: string): string[] {
  if (!fs.existsSync(specsDir)) {
    return [];
  }

  return fs
    .readdirSync(specsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{3}-/.test(e.name))
    .map((e) => e.name)
    .sort();
}

/**
 * Resolve a spec-id (like "001-add-notifications" or just "001") to its directory.
 */
export function resolveSpecDir(
  specsDir: string,
  specId: string
): string | null {
  const dirs = listSpecDirs(specsDir);

  // Exact match
  if (dirs.includes(specId)) {
    return path.join(specsDir, specId);
  }

  // Prefix match (e.g., "001" matches "001-add-notifications")
  const match = dirs.find((d) => d.startsWith(specId));
  if (match) {
    return path.join(specsDir, match);
  }

  return null;
}
