/**
 * Simple line-level diff computation for comparing generated vs on-disk files.
 * No external dependencies — pure string comparison.
 */

export interface DiffLine {
  type: "add" | "remove" | "unchanged";
  lineNumber: number;
  content: string;
}

export interface FileDiff {
  path: string;
  status: "added" | "modified" | "deleted" | "unchanged";
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
}

/**
 * Compute a simple line-level diff between two strings.
 */
export function computeLineDiff(
  oldContent: string,
  newContent: string
): DiffLine[] {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const diff: DiffLine[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);

  // Simple line-by-line comparison (not a proper LCS diff, but sufficient)
  let oi = 0;
  let ni = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (oi >= oldLines.length) {
      // Remaining new lines are additions
      diff.push({
        type: "add",
        lineNumber: ni + 1,
        content: newLines[ni],
      });
      ni++;
    } else if (ni >= newLines.length) {
      // Remaining old lines are removals
      diff.push({
        type: "remove",
        lineNumber: oi + 1,
        content: oldLines[oi],
      });
      oi++;
    } else if (oldLines[oi] === newLines[ni]) {
      diff.push({
        type: "unchanged",
        lineNumber: ni + 1,
        content: newLines[ni],
      });
      oi++;
      ni++;
    } else {
      // Look ahead to see if the old line appears soon in new
      const newIdx = newLines.indexOf(oldLines[oi], ni);
      const oldIdx = oldLines.indexOf(newLines[ni], oi);

      if (newIdx !== -1 && (oldIdx === -1 || newIdx - ni < oldIdx - oi)) {
        // Lines were added before the matching old line
        while (ni < newIdx) {
          diff.push({
            type: "add",
            lineNumber: ni + 1,
            content: newLines[ni],
          });
          ni++;
        }
      } else if (oldIdx !== -1) {
        // Lines were removed before the matching new line
        while (oi < oldIdx) {
          diff.push({
            type: "remove",
            lineNumber: oi + 1,
            content: oldLines[oi],
          });
          oi++;
        }
      } else {
        // Lines changed — show as remove + add
        diff.push({
          type: "remove",
          lineNumber: oi + 1,
          content: oldLines[oi],
        });
        diff.push({
          type: "add",
          lineNumber: ni + 1,
          content: newLines[ni],
        });
        oi++;
        ni++;
      }
    }
  }

  return diff;
}

/**
 * Compute a file diff between generated content and existing file content.
 */
export function computeFileDiff(
  filePath: string,
  generatedContent: string,
  existingContent: string | null
): FileDiff {
  if (existingContent === null) {
    // File doesn't exist on disk — it's an addition
    const lines = generatedContent.split("\n");
    return {
      path: filePath,
      status: "added",
      lines: lines.map((content, i) => ({
        type: "add" as const,
        lineNumber: i + 1,
        content,
      })),
      addedCount: lines.length,
      removedCount: 0,
    };
  }

  if (generatedContent === existingContent) {
    return {
      path: filePath,
      status: "unchanged",
      lines: [],
      addedCount: 0,
      removedCount: 0,
    };
  }

  const lines = computeLineDiff(existingContent, generatedContent);
  const addedCount = lines.filter((l) => l.type === "add").length;
  const removedCount = lines.filter((l) => l.type === "remove").length;

  return {
    path: filePath,
    status: "modified",
    lines,
    addedCount,
    removedCount,
  };
}
