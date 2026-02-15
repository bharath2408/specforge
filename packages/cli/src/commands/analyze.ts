import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge/core/config";
import { resolveSpecDir } from "@specforge/core/sequence";
import {
  analyzeConsistency,
  generateAnalysisMarkdown,
} from "@specforge/core/analyzer";
import { findSpecDir } from "../utils.js";

export async function analyzeCommand(specId?: string): Promise<void> {
  const config = loadConfig();
  const specsDir = path.resolve(config.specsDir);
  const yamlSpecDir = findSpecDir();

  let specDir: string | undefined;

  if (specId) {
    const resolved = resolveSpecDir(specsDir, specId);
    if (!resolved) {
      console.error(`\n  Spec not found: ${specId}`);
      console.error(
        `  Run 'specforge specify <name>' to create a spec first.\n`
      );
      process.exit(1);
    }
    specDir = resolved;
  }

  const constitutionPath = path.join(
    path.resolve(config.memoryDir),
    "constitution.md"
  );

  console.log(
    `\n  Analyzing consistency${specId ? ` for: ${specId}` : " across all specs"}...\n`
  );

  const report = analyzeConsistency(specsDir, {
    specDir,
    constitutionPath: fs.existsSync(constitutionPath)
      ? constitutionPath
      : undefined,
    yamlSpecDir,
  });

  // Display findings
  if (report.findings.length === 0) {
    console.log("  No issues found. All artifacts are consistent.\n");
  } else {
    const severityColors: Record<string, string> = {
      CRITICAL: "!!",
      HIGH: "! ",
      MEDIUM: "- ",
      LOW: "  ",
    };

    for (const f of report.findings) {
      const prefix = severityColors[f.severity] ?? "  ";
      console.log(
        `  ${prefix}[${f.severity}] [${f.category}] ${f.message}`
      );
      if (f.location) {
        console.log(`      Location: ${f.location}`);
      }
    }
    console.log();
  }

  // Summary table
  console.log("  Summary:");
  console.log("  " + "-".repeat(30));
  console.log(`  CRITICAL: ${report.summary.CRITICAL}`);
  console.log(`  HIGH:     ${report.summary.HIGH}`);
  console.log(`  MEDIUM:   ${report.summary.MEDIUM}`);
  console.log(`  LOW:      ${report.summary.LOW}`);
  console.log("  " + "-".repeat(30));
  console.log(`  Total:    ${report.findings.length}`);

  // Write report if analyzing a specific spec
  if (specDir) {
    const reportMarkdown = generateAnalysisMarkdown(report);
    const reportPath = path.join(specDir, "analysis-report.md");
    fs.writeFileSync(reportPath, reportMarkdown, "utf-8");
    console.log(`\n  Report saved: ${reportPath}`);
  }

  console.log();

  // Exit with error if critical findings
  if (report.summary.CRITICAL > 0) {
    process.exit(1);
  }
}
