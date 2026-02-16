import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge-dev/core/config";
import { resolveSpecDir, listSpecDirs, parseSpecDirName } from "@specforge-dev/core/sequence";
import { scanForAmbiguities, generateCoverageTable } from "@specforge-dev/core/ambiguity";
import { parseSpecMarkdown } from "@specforge-dev/core/specfile";
import { generateImplementationNotes, generateImplementationMarkdown } from "@specforge-dev/core/implementation";
import { discoverSpecFiles, parseSpecFile, validateSpec } from "@specforge-dev/core";
import type { FeatureSpec, ParsedSpec, ImplementationNotes } from "@specforge-dev/core";

export async function clarifyCommand(specId: string): Promise<void> {
  if (!specId) {
    console.error(
      "\n  Please provide a spec ID.\n  Usage: specforge clarify <spec-id>\n"
    );
    process.exit(1);
  }

  const config = loadConfig();
  const specsDir = path.resolve(config.specsDir);
  const specDir = resolveSpecDir(specsDir, specId);

  if (!specDir) {
    console.error(`\n  Spec not found: ${specId}`);
    console.error(`  Run 'specforge specify <name>' to create a spec first.\n`);
    process.exit(1);
  }

  const specPath = path.join(specDir, "spec.md");
  if (!fs.existsSync(specPath)) {
    console.error(`\n  No spec.md found in: ${specDir}\n`);
    process.exit(1);
  }

  const content = fs.readFileSync(specPath, "utf-8");

  // Parse spec.md into FeatureSpec
  let featureSpec: FeatureSpec | undefined;
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  if (parsed) {
    featureSpec = parseSpecMarkdown(content, parsed.seq, parsed.slug);
  }

  // Try to load .spec.yaml into ParsedSpec
  let parsedSpec: ParsedSpec | undefined;
  try {
    const yamlDir = path.resolve(config.specDir);
    const specFiles = discoverSpecFiles(yamlDir);
    if (specFiles.length > 0) {
      const raw = parseSpecFile(specFiles[0]);
      const result = validateSpec(raw);
      if (result.success && result.spec) {
        parsedSpec = result.spec;
      }
    }
  } catch {
    // Silently skip — .spec.yaml is optional for clarify
  }

  console.log(`\n  Scanning spec for ambiguities: ${specId}\n`);

  // Run ambiguity scan
  const findings = scanForAmbiguities(content, featureSpec, parsedSpec);

  if (findings.length === 0) {
    console.log("  No ambiguities found! Spec looks well-defined.\n");
  } else {
    // Show top 5 findings as questions
    const topFindings = findings.slice(0, 5);

    console.log(`  Found ${findings.length} potential ambiguities:\n`);

    for (let i = 0; i < topFindings.length; i++) {
      const f = topFindings[i];
      console.log(`  ${i + 1}. [${f.category}] ${f.description}`);
      console.log(`     Location: ${f.location}`);
      console.log(`     Suggestion: ${f.suggestion}\n`);
    }

    if (findings.length > 5) {
      console.log(
        `  ... and ${findings.length - 5} more findings.\n`
      );
    }
  }

  // Generate and show coverage table
  const coverage = generateCoverageTable(content, findings);

  console.log("  Coverage Table:");
  console.log("  " + "-".repeat(60));
  console.log(
    "  " +
      "Category".padEnd(30) +
      "Status".padEnd(12) +
      "Details"
  );
  console.log("  " + "-".repeat(60));

  for (const row of coverage) {
    const statusIcon =
      row.status === "covered"
        ? "OK"
        : row.status === "partial"
          ? "WARN"
          : "MISS";
    console.log(
      "  " +
        row.category.padEnd(30) +
        statusIcon.padEnd(12) +
        row.details
    );
  }
  console.log("  " + "-".repeat(60));

  // Write clarification log
  const logPath = path.join(specDir, "clarification-log.md");
  const logContent = generateClarificationLog(specId, findings, coverage);
  fs.writeFileSync(logPath, logContent, "utf-8");
  console.log(`\n  Clarification log saved: ${logPath}`);

  // Generate implementation notes
  const previousNotes = loadPreviousImplementationNotes(specsDir, specDir);
  const implNotes = generateImplementationNotes(
    featureSpec ?? { id: specId, name: specId, slug: specId, status: "draft", scenarios: [], requirements: [], entities: [], successCriteria: [], edgeCases: [], openQuestions: [] },
    findings,
    parsedSpec,
    previousNotes,
  );
  const implPath = path.join(specDir, "implementation.md");
  const implContent = generateImplementationMarkdown(implNotes);
  fs.writeFileSync(implPath, implContent, "utf-8");
  console.log(`  Implementation notes saved: ${implPath}\n`);
}

/**
 * Scan other spec directories for existing implementation.md files
 * and parse them into lightweight ImplementationNotes for pattern reuse.
 */
function loadPreviousImplementationNotes(
  specsDir: string,
  currentSpecDir: string,
): ImplementationNotes[] {
  const notes: ImplementationNotes[] = [];

  try {
    const specDirs = listSpecDirs(specsDir);
    for (const dir of specDirs) {
      const fullDir = path.join(specsDir, dir);
      if (fullDir === currentSpecDir) continue;

      const implPath = path.join(fullDir, "implementation.md");
      if (!fs.existsSync(implPath)) continue;

      const parsed = parseSpecDirName(dir);
      if (!parsed) continue;

      // Parse the implementation.md to extract recommendations
      const implContent = fs.readFileSync(implPath, "utf-8");
      const parsedNotes = parseImplementationMarkdown(implContent, parsed.seq, parsed.slug);
      if (parsedNotes) {
        notes.push(parsedNotes);
      }
    }
  } catch {
    // Silently skip — previous notes are optional
  }

  return notes;
}

/**
 * Lightweight parser to extract recommendations from an existing implementation.md.
 */
function parseImplementationMarkdown(
  content: string,
  seq: number,
  slug: string,
): ImplementationNotes | null {
  const specId = `${String(seq).padStart(3, "0")}-${slug}`;
  const recommendations: ImplementationNotes["recommendations"] = [];

  // Extract recommendations from "### High Priority" section
  const highSection = content.match(
    /### High Priority\n([\s\S]*?)(?=\n### |## |$)/,
  );
  if (highSection) {
    const lines = highSection[1].split("\n").filter((l) => l.startsWith("- **["));
    for (const line of lines) {
      const match = line.match(
        /- \*\*\[(.+?)\]\*\* (.+?) — (.+)/,
      );
      if (match) {
        recommendations.push({
          category: match[1],
          priority: "high",
          action: match[2],
          context: match[3],
        });
      }
    }
  }

  return {
    specId,
    generatedAt: "",
    entityMap: [],
    recommendations,
    openQuestions: [],
    crossReferences: [],
    reusablePatterns: [],
  };
}

function generateClarificationLog(
  specId: string,
  findings: ReturnType<typeof scanForAmbiguities>,
  coverage: ReturnType<typeof generateCoverageTable>
): string {
  let md = `# Clarification Log: ${specId}\n\n`;
  md += `> Generated: ${new Date().toISOString().split("T")[0]}\n\n`;

  md += `## Findings (${findings.length})\n\n`;
  for (const f of findings) {
    md += `- **[${f.category}]** ${f.description}\n`;
    md += `  - Location: ${f.location}\n`;
    md += `  - Suggestion: ${f.suggestion}\n\n`;
  }

  md += `## Coverage\n\n`;
  md += `| Category | Status | Details |\n`;
  md += `|----------|--------|---------|\n`;
  for (const row of coverage) {
    md += `| ${row.category} | ${row.status} | ${row.details} |\n`;
  }

  return md;
}
