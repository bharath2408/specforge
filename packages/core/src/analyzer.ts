import * as fs from "node:fs";
import * as path from "node:path";
import type {
  AnalysisFinding,
  AnalysisReport,
  Severity,
  ParsedSpec,
} from "./types.js";
import { parseSpecMarkdown } from "./specfile.js";
import { parseSpecDirName, listSpecDirs } from "./sequence.js";
import { parseConstitution } from "./constitution.js";
import { parseTasksMarkdown } from "./tasks.js";
import { discoverSpecFiles, parseSpecFile, validateSpec } from "./index.js";

const MAX_FINDINGS = 50;

/**
 * Analyze consistency across all spec artifacts.
 */
export function analyzeConsistency(
  specsDir: string,
  options: {
    specDir?: string;
    constitutionPath?: string;
    yamlSpecDir?: string;
  } = {}
): AnalysisReport {
  const findings: AnalysisFinding[] = [];
  const specId = options.specDir ? path.basename(options.specDir) : undefined;

  // Check constitution compliance
  if (options.constitutionPath && fs.existsSync(options.constitutionPath)) {
    checkConstitutionConflicts(findings, options.constitutionPath, specsDir, options.specDir);
  }

  // Check spec coverage
  if (options.specDir) {
    checkCoverageGaps(findings, options.specDir);
    checkMissingTests(findings, options.specDir);
    checkNamingIssues(findings, options.specDir);
  } else {
    // Analyze all specs
    const dirs = listSpecDirs(specsDir);
    for (const dir of dirs) {
      const fullDir = path.join(specsDir, dir);
      checkCoverageGaps(findings, fullDir);
      checkMissingTests(findings, fullDir);
      checkNamingIssues(findings, fullDir);
    }
  }

  // Cross-validate with .spec.yaml models
  if (options.yamlSpecDir) {
    crossValidateWithYaml(findings, specsDir, options.yamlSpecDir, options.specDir);
  }

  // Enforce max findings
  const trimmedFindings = findings.slice(0, MAX_FINDINGS);

  // Build summary
  const summary: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const f of trimmedFindings) {
    summary[f.severity]++;
  }

  return { specId, findings: trimmedFindings, summary };
}

function checkConstitutionConflicts(
  findings: AnalysisFinding[],
  constitutionPath: string,
  specsDir: string,
  specDir?: string
): void {
  const content = fs.readFileSync(constitutionPath, "utf-8");
  const constitution = parseConstitution(content);

  const dirs = specDir ? [specDir] : listSpecDirs(specsDir).map((d) => path.join(specsDir, d));

  for (const dir of dirs) {
    const specPath = path.join(dir, "spec.md");
    if (!fs.existsSync(specPath)) continue;

    const specContent = fs.readFileSync(specPath, "utf-8");
    const dirName = path.basename(dir);

    // Check Test-First compliance (A3)
    const hasTestMention =
      /test/i.test(specContent) || /spec/i.test(specContent);
    if (!hasTestMention) {
      findings.push({
        severity: "CRITICAL",
        category: "constitution-conflict",
        message: `[A3] Test-First: Spec "${dirName}" does not mention testing strategy.`,
        location: dirName,
      });
    }

    // Check Spec-Driven (A9)
    const hasScenariosOrReqs =
      /## User Scenarios/i.test(specContent) ||
      /## Functional Requirements/i.test(specContent);
    if (!hasScenariosOrReqs) {
      findings.push({
        severity: "CRITICAL",
        category: "constitution-conflict",
        message: `[A9] Spec-Driven: Spec "${dirName}" missing structured scenarios/requirements.`,
        location: dirName,
      });
    }
  }
}

function checkCoverageGaps(
  findings: AnalysisFinding[],
  specDir: string
): void {
  const specPath = path.join(specDir, "spec.md");
  if (!fs.existsSync(specPath)) return;

  const content = fs.readFileSync(specPath, "utf-8");
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  if (!parsed) return;

  const spec = parseSpecMarkdown(content, parsed.seq, parsed.slug);

  // Check plan exists
  const planPath = path.join(specDir, "plan.md");
  if (!fs.existsSync(planPath)) {
    findings.push({
      severity: "HIGH",
      category: "coverage-gap",
      message: `Spec "${dirName}" has no implementation plan.`,
      location: dirName,
    });
  }

  // Check tasks exist
  const tasksPath = path.join(specDir, "tasks.md");
  if (!fs.existsSync(tasksPath)) {
    findings.push({
      severity: "HIGH",
      category: "coverage-gap",
      message: `Spec "${dirName}" has no task breakdown.`,
      location: dirName,
    });
  } else {
    // Cross-validate tasks with scenarios
    const tasksContent = fs.readFileSync(tasksPath, "utf-8");
    const taskPhases = parseTasksMarkdown(tasksContent);
    const allTasks = taskPhases.flatMap((p) => p.tasks);
    const taskRefs = new Set(allTasks.map((t) => t.scenarioRef));

    for (const scenario of spec.scenarios) {
      if (!taskRefs.has(scenario.id)) {
        findings.push({
          severity: "HIGH",
          category: "coverage-gap",
          message: `Scenario ${scenario.id} in "${dirName}" has no corresponding tasks.`,
          location: `${dirName}/tasks.md`,
        });
      }
    }
  }

  // Check open questions
  if (spec.openQuestions.length > 0 && spec.status !== "draft") {
    findings.push({
      severity: "HIGH",
      category: "coverage-gap",
      message: `Spec "${dirName}" has ${spec.openQuestions.length} unresolved open questions but status is "${spec.status}".`,
      location: dirName,
    });
  }
}

function checkMissingTests(
  findings: AnalysisFinding[],
  specDir: string
): void {
  const specPath = path.join(specDir, "spec.md");
  if (!fs.existsSync(specPath)) return;

  const content = fs.readFileSync(specPath, "utf-8");
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  if (!parsed) return;

  const spec = parseSpecMarkdown(content, parsed.seq, parsed.slug);

  // Check if scenarios have test coverage in tasks
  const tasksPath = path.join(specDir, "tasks.md");
  if (fs.existsSync(tasksPath)) {
    const tasksContent = fs.readFileSync(tasksPath, "utf-8");
    const lowerTasks = tasksContent.toLowerCase();

    for (const scenario of spec.scenarios) {
      const hasTest =
        lowerTasks.includes(`test`) &&
        lowerTasks.includes(scenario.id.toLowerCase());
      if (!hasTest) {
        findings.push({
          severity: "MEDIUM",
          category: "missing-test",
          message: `No test task found for scenario ${scenario.id} in "${dirName}".`,
          location: `${dirName}/tasks.md`,
        });
      }
    }
  }
}

function checkNamingIssues(
  findings: AnalysisFinding[],
  specDir: string
): void {
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);

  if (!parsed) {
    findings.push({
      severity: "LOW",
      category: "naming-issue",
      message: `Directory "${dirName}" doesn't follow NNN-slug naming convention.`,
      location: dirName,
    });
    return;
  }

  // Check slug format
  if (/[A-Z]/.test(parsed.slug)) {
    findings.push({
      severity: "LOW",
      category: "naming-issue",
      message: `Slug "${parsed.slug}" contains uppercase characters. Use lowercase kebab-case.`,
      location: dirName,
    });
  }

  if (/[_\s]/.test(parsed.slug)) {
    findings.push({
      severity: "LOW",
      category: "naming-issue",
      message: `Slug "${parsed.slug}" contains underscores or spaces. Use hyphens.`,
      location: dirName,
    });
  }
}

function crossValidateWithYaml(
  findings: AnalysisFinding[],
  specsDir: string,
  yamlSpecDir: string,
  specDir?: string
): void {
  try {
    const yamlFiles = discoverSpecFiles(yamlSpecDir);
    if (yamlFiles.length === 0) return;

    for (const yamlFile of yamlFiles) {
      const rawSpec = parseSpecFile(yamlFile);
      const result = validateSpec(rawSpec);
      if (!result.success || !result.spec) continue;

      const yamlModels = Object.keys(result.spec.models);

      // Check if entities in feature specs match yaml models
      const dirs = specDir
        ? [specDir]
        : listSpecDirs(specsDir).map((d) => path.join(specsDir, d));

      for (const dir of dirs) {
        const specPath = path.join(dir, "spec.md");
        if (!fs.existsSync(specPath)) continue;

        const content = fs.readFileSync(specPath, "utf-8");
        const dirName = path.basename(dir);
        const parsed = parseSpecDirName(dirName);
        if (!parsed) continue;

        const spec = parseSpecMarkdown(content, parsed.seq, parsed.slug);

        for (const entity of spec.entities) {
          const matchesModel = yamlModels.some(
            (m) => m.toLowerCase() === entity.toLowerCase()
          );
          if (!matchesModel) {
            findings.push({
              severity: "MEDIUM",
              category: "model-mismatch",
              message: `Entity "${entity}" in "${dirName}" does not match any .spec.yaml model (${yamlModels.join(", ")}).`,
              location: `${dirName} vs ${path.basename(yamlFile)}`,
            });
          }
        }
      }
    }
  } catch {
    // Silently skip yaml cross-validation if it fails
  }
}

/**
 * Generate analysis report markdown.
 */
export function generateAnalysisMarkdown(report: AnalysisReport): string {
  let md = `# Analysis Report${report.specId ? `: ${report.specId}` : ""}\n\n`;
  md += `> Generated: ${new Date().toISOString().split("T")[0]}\n\n`;

  md += `## Summary\n\n`;
  md += `| Severity | Count |\n`;
  md += `|----------|-------|\n`;
  md += `| CRITICAL | ${report.summary.CRITICAL} |\n`;
  md += `| HIGH | ${report.summary.HIGH} |\n`;
  md += `| MEDIUM | ${report.summary.MEDIUM} |\n`;
  md += `| LOW | ${report.summary.LOW} |\n`;
  md += `| **Total** | **${report.findings.length}** |\n\n`;

  if (report.findings.length === 0) {
    md += `No issues found. All artifacts are consistent.\n`;
    return md;
  }

  md += `## Findings\n\n`;
  const bySeverity: Record<string, AnalysisFinding[]> = {};
  for (const f of report.findings) {
    (bySeverity[f.severity] ??= []).push(f);
  }

  for (const severity of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]) {
    const items = bySeverity[severity];
    if (!items || items.length === 0) continue;

    md += `### ${severity}\n\n`;
    for (const f of items) {
      md += `- **[${f.category}]** ${f.message}`;
      if (f.location) md += ` _(${f.location})_`;
      md += `\n`;
    }
    md += `\n`;
  }

  return md;
}
