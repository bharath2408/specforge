import * as fs from "node:fs";
import * as path from "node:path";
import {
  loadConfig,
  resolveSpecDir,
  parseSpecDirName,
  parseSpecMarkdown,
  reviewSpec,
  generateReviewMarkdown,
} from "@specforge-dev/core";
import type { ReviewDimension } from "@specforge-dev/core";

export interface ReviewCommandOptions {
  focus?: string[];
  strict?: boolean;
  ci?: boolean;
  minScore?: number;
}

export async function reviewCommand(
  specId: string,
  options: ReviewCommandOptions
): Promise<void> {
  if (!specId) {
    console.error(
      "\n  Please provide a spec ID.\n  Usage: specforge review <spec-id>\n"
    );
    process.exit(1);
  }

  const config = loadConfig();
  const specsDir = path.resolve(config.specsDir);
  const specDir = resolveSpecDir(specsDir, specId);

  if (!specDir) {
    console.error(`\n  Spec not found: ${specId}`);
    console.error(
      `  Run 'specforge specify <name>' to create a spec first.\n`
    );
    process.exit(1);
  }

  const specPath = path.join(specDir, "spec.md");
  if (!fs.existsSync(specPath)) {
    console.error(`\n  No spec.md found in: ${specDir}\n`);
    process.exit(1);
  }

  const content = fs.readFileSync(specPath, "utf-8");
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  if (!parsed) {
    console.error(`\n  Could not parse spec directory: ${dirName}\n`);
    process.exit(1);
  }

  const spec = parseSpecMarkdown(content, parsed.seq, parsed.slug);

  // Validate focus dimensions
  const validDimensions: ReviewDimension[] = [
    "completeness",
    "clarity",
    "testability",
    "feasibility",
    "consistency",
  ];
  let focus: ReviewDimension[] | undefined;
  if (options.focus && options.focus.length > 0) {
    for (const f of options.focus) {
      if (!validDimensions.includes(f as ReviewDimension)) {
        console.error(
          `\n  Invalid dimension: ${f}\n  Valid dimensions: ${validDimensions.join(", ")}\n`
        );
        process.exit(1);
      }
    }
    focus = options.focus as ReviewDimension[];
  }

  console.log(`\n  Reviewing spec: ${spec.id}\n`);

  const report = reviewSpec(spec, content, {
    focus,
    strict: options.strict,
    minScore: options.minScore,
  });

  // Print score table
  console.log(`  Verdict: ${report.verdict}  (${report.totalScore}/100)\n`);
  console.log("  " + "-".repeat(60));
  console.log(
    "  " +
      "Dimension".padEnd(18) +
      "Score".padStart(6) +
      "  " +
      "Summary"
  );
  console.log("  " + "-".repeat(60));

  for (const dim of report.dimensions) {
    const label =
      dim.dimension.charAt(0).toUpperCase() + dim.dimension.slice(1);
    console.log(
      "  " +
        label.padEnd(18) +
        `${dim.score}/${dim.maxScore}`.padStart(6) +
        "  " +
        dim.summary
    );
  }
  console.log("  " + "-".repeat(60));
  console.log();

  // Print top suggestions
  if (report.topSuggestions.length > 0) {
    console.log("  Top suggestions:");
    for (let i = 0; i < report.topSuggestions.length; i++) {
      console.log(`  ${i + 1}. ${report.topSuggestions[i]}`);
    }
    console.log();
  }

  // Write review report
  const reportPath = path.join(specDir, "review-report.md");
  const markdown = generateReviewMarkdown(report);
  fs.writeFileSync(reportPath, markdown, "utf-8");
  console.log(`  Report saved: ${reportPath}\n`);

  // CI mode: exit with error if score below threshold or verdict is POOR
  if (options.ci) {
    const minScore = options.minScore ?? 0;
    if (report.totalScore < minScore) {
      console.error(
        `  CI FAIL: Score ${report.totalScore} is below minimum ${minScore}\n`
      );
      process.exit(1);
    }
    if (report.verdict === "POOR") {
      console.error(`  CI FAIL: Verdict is POOR\n`);
      process.exit(1);
    }
  }
}
