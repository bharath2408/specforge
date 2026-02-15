import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge/core/config";
import { getNextSequenceNumber, formatSpecDirName } from "@specforge/core/sequence";
import { slugify, generateSpecMarkdown } from "@specforge/core/specfile";
import { getGitContext, createBranch } from "@specforge/core/git";

export interface SpecifyCommandOptions {
  branch?: boolean;
}

export async function specifyCommand(
  name: string,
  opts: SpecifyCommandOptions = {}
): Promise<void> {
  if (!name || name.trim().length === 0) {
    console.error("\n  Please provide a feature name.\n  Usage: specforge specify <name>\n");
    process.exit(1);
  }

  const config = loadConfig();
  const specsDir = path.resolve(config.specsDir);
  const slug = slugify(name);
  const seq = getNextSequenceNumber(specsDir);
  const dirName = formatSpecDirName(seq, slug);
  const specDir = path.join(specsDir, dirName);

  // Create specs directory and spec subdirectory
  fs.mkdirSync(specDir, { recursive: true });

  // Generate the spec markdown
  const specContent = generateSpecMarkdown(name, seq, slug);
  const specPath = path.join(specDir, "spec.md");
  fs.writeFileSync(specPath, specContent, "utf-8");

  console.log(`\n  Feature spec created:`);
  console.log(`    ID: ${dirName}`);
  console.log(`    Path: ${specPath}`);

  // Optionally create a git branch
  const shouldBranch = opts.branch ?? config.git.autoCreateBranch;
  if (shouldBranch) {
    const gitContext = getGitContext();
    if (gitContext.isRepo) {
      const branchName = `${config.git.branchPrefix}${slug}`;
      const created = createBranch(branchName);
      if (created) {
        console.log(`    Branch: ${branchName}`);
      } else {
        console.log(`    Branch creation failed (branch may already exist).`);
      }
    } else {
      console.log(`    Skipping branch creation (not a git repo).`);
    }
  }

  console.log(`\n  Next steps:`);
  console.log(`    1. Edit ${specPath} to fill in details`);
  console.log(`    2. Run 'specforge clarify ${dirName}' to check for ambiguities`);
  console.log(`    3. Run 'specforge plan ${dirName}' to generate an implementation plan\n`);
}
