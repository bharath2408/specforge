import { execSync } from "node:child_process";
import type { GitContext } from "./types.js";

/**
 * Get the current git context for a directory.
 */
export function getGitContext(cwd: string = process.cwd()): GitContext {
  const isRepo = isGitRepo(cwd);
  if (!isRepo) {
    return { isRepo: false, currentBranch: "", remoteUrl: "", isDirty: false };
  }

  return {
    isRepo: true,
    currentBranch: getCurrentBranch(cwd),
    remoteUrl: getRemoteUrl(cwd),
    isDirty: isWorkingTreeDirty(cwd),
  };
}

/**
 * Check if a directory is inside a git repository.
 */
export function isGitRepo(cwd: string = process.cwd()): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current git branch name.
 */
export function getCurrentBranch(cwd: string = process.cwd()): string {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Get the remote URL (origin).
 */
export function getRemoteUrl(cwd: string = process.cwd()): string {
  try {
    return execSync("git remote get-url origin", {
      cwd,
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Check if the working tree has uncommitted changes.
 */
export function isWorkingTreeDirty(cwd: string = process.cwd()): boolean {
  try {
    const output = execSync("git status --porcelain", {
      cwd,
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();
    return output.length > 0;
  } catch {
    return false;
  }
}

/**
 * Create a new git branch from the current HEAD.
 */
export function createBranch(
  name: string,
  cwd: string = process.cwd()
): boolean {
  try {
    execSync(`git checkout -b ${name}`, {
      cwd,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}
