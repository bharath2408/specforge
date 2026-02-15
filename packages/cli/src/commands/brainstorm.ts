import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge-dev/core/config";
import { resolveSpecDir } from "@specforge-dev/core/sequence";
import { parseSpecMarkdown } from "@specforge-dev/core/specfile";
import { generatePlan } from "@specforge-dev/core/planner";
import {
  extractSearchKeywords,
  analyzeFeaturesForGaps,
  generateBrainstormSuggestions,
  buildComparisonTable,
  generateBrainstormMarkdown,
} from "@specforge-dev/core/brainstorm";
import type { CompetitorInfo, BrainstormReport } from "@specforge-dev/core";
import { parseSpecDirName } from "@specforge-dev/core/sequence";
import { searchNpm, searchGitHub, fetchCompetitorPage, buildCompetitorList } from "../research.js";

interface BrainstormOptions {
  offline?: boolean;
  urls?: string[];
  skipScreenshots?: boolean;
  npmKeywords?: string[];
}

export async function brainstormCommand(
  specId: string,
  options: BrainstormOptions = {}
): Promise<void> {
  if (!specId) {
    console.error(
      "\n  Please provide a spec ID.\n  Usage: specforge brainstorm <spec-id>\n"
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

  // Check spec.md exists
  const specPath = path.join(specDir, "spec.md");
  if (!fs.existsSync(specPath)) {
    console.error(`\n  No spec.md found in: ${specDir}\n`);
    process.exit(1);
  }

  // Check plan.md exists
  const planPath = path.join(specDir, "plan.md");
  if (!fs.existsSync(planPath)) {
    console.error(`\n  No plan.md found in: ${specDir}`);
    console.error(`  Run 'specforge plan ${specId}' first.\n`);
    process.exit(1);
  }

  const ora = (await import("ora")).default;

  console.log(`\n  Brainstorming for: ${specId}\n`);

  // 1. Parse spec
  const spinner = ora("  Loading spec and plan...").start();
  const specContent = fs.readFileSync(specPath, "utf-8");
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  const seq = parsed?.seq ?? 0;
  const slug = parsed?.slug ?? dirName;
  const spec = parseSpecMarkdown(specContent, seq, slug);

  // Generate plan data (reuse planner logic)
  const constitutionPath = path.join(
    path.resolve(config.memoryDir),
    "constitution.md"
  );
  const plan = generatePlan(
    specDir,
    fs.existsSync(constitutionPath) ? constitutionPath : undefined
  );
  spinner.succeed("  Loaded spec and plan");

  // 2. Extract search keywords
  spinner.start("  Extracting search keywords...");
  const keywords = extractSearchKeywords(spec, plan);
  const allKeywords = options.npmKeywords
    ? [...keywords, ...options.npmKeywords]
    : keywords;
  spinner.succeed(`  Extracted ${allKeywords.length} search keywords`);

  // 3. Research competitors (online mode)
  let competitors: CompetitorInfo[] = [];
  const isOnline = !options.offline;

  if (isOnline) {
    // Search npm
    spinner.start("  Searching npm registry...");
    let npmResults: CompetitorInfo[] = [];
    try {
      npmResults = await searchNpm(allKeywords);
      spinner.succeed(`  Found ${npmResults.length} npm packages`);
    } catch {
      spinner.warn("  npm search failed, continuing...");
    }

    // Search GitHub
    spinner.start("  Searching GitHub repositories...");
    let githubResults: CompetitorInfo[] = [];
    try {
      githubResults = await searchGitHub(allKeywords);
      spinner.succeed(`  Found ${githubResults.length} GitHub repositories`);
    } catch {
      spinner.warn("  GitHub search failed, continuing...");
    }

    // Fetch user-provided URLs
    const urlResults: CompetitorInfo[] = [];
    if (options.urls && options.urls.length > 0) {
      spinner.start(`  Fetching ${options.urls.length} competitor URL(s)...`);
      for (const url of options.urls) {
        const result = await fetchCompetitorPage(url);
        if (result) {
          urlResults.push(result);
        }
      }
      spinner.succeed(`  Fetched ${urlResults.length} competitor page(s)`);
    }

    competitors = buildCompetitorList(npmResults, githubResults, urlResults);

    // Auto-fallback to offline if all searches failed
    if (competitors.length === 0 && npmResults.length === 0 && githubResults.length === 0) {
      console.log("  No competitors found online. Falling back to offline heuristics.\n");
    }
  } else {
    console.log("  Running in offline mode — skipping web research.\n");
  }

  // 4. Screenshots (if online and not skipped)
  let screenshotsDir: string | undefined;
  if (isOnline && !options.skipScreenshots && competitors.some((c) => c.url)) {
    const screenshotDirPath = path.join(specDir, "brainstorm-screenshots");
    spinner.start("  Capturing competitor screenshots...");

    let capturedCount = 0;
    try {
      const { captureScreenshot, generateComparisonImage } = await import("../screenshot.js");

      const screenshotData: Array<{ name: string; path: string }> = [];

      for (const competitor of competitors) {
        if (!competitor.url) continue;
        const result = await captureScreenshot(competitor.url, screenshotDirPath);
        if (result) {
          competitor.screenshotPath = path.relative(specDir, result);
          screenshotData.push({ name: competitor.name, path: result });
          capturedCount++;
        }
      }

      // Generate comparison image
      if (screenshotData.length > 1) {
        const comparisonPath = path.join(screenshotDirPath, "comparison.png");
        await generateComparisonImage(screenshotData, comparisonPath);
      }

      if (capturedCount > 0) {
        screenshotsDir = path.relative(specDir, screenshotDirPath);
      }

      spinner.succeed(`  Captured ${capturedCount} screenshot(s)`);
    } catch {
      spinner.warn("  Screenshot capture skipped (Chrome/puppeteer not available)");
    }
  }

  // 5. Analyze feature gaps
  spinner.start("  Analyzing feature gaps...");
  const gaps = analyzeFeaturesForGaps(spec, plan, competitors);
  spinner.succeed(`  Found ${gaps.length} feature gap(s)`);

  // 6. Generate suggestions
  spinner.start("  Generating value-add suggestions...");
  const suggestions = generateBrainstormSuggestions(spec, plan, gaps);
  spinner.succeed(`  Generated ${suggestions.length} suggestion(s)`);

  // 7. Build comparison table
  const comparisonTable = buildComparisonTable(spec, competitors, gaps);

  // 8. Build report
  const report: BrainstormReport = {
    specId: spec.id,
    generatedAt: new Date().toISOString().split("T")[0],
    mode: isOnline ? "online" : "offline",
    competitors,
    featureGaps: gaps,
    suggestions,
    comparisonTable,
    screenshotsDir,
  };

  // 9. Write report
  spinner.start("  Writing brainstorm report...");
  const reportMarkdown = generateBrainstormMarkdown(report);
  const reportPath = path.join(specDir, "brainstorm-report.md");
  fs.writeFileSync(reportPath, reportMarkdown, "utf-8");
  spinner.succeed(`  Report written: ${reportPath}`);

  // 10. Print summary
  const p1 = suggestions.filter((s) => s.priority === "P1").length;
  const p2 = suggestions.filter((s) => s.priority === "P2").length;
  const p3 = suggestions.filter((s) => s.priority === "P3").length;

  console.log(`\n  Brainstorm summary:`);
  console.log(`    Mode: ${report.mode}`);
  console.log(`    Competitors analyzed: ${competitors.length}`);
  console.log(`    Feature gaps found: ${gaps.length}`);
  console.log(`    Suggestions: ${suggestions.length} (${p1} P1, ${p2} P2, ${p3} P3)`);
  if (screenshotsDir) {
    console.log(`    Screenshots: ${screenshotsDir}`);
  }

  console.log(`\n  Next steps:`);
  console.log(`    1. Review report at: ${reportPath}`);
  console.log(`    2. Incorporate P1 suggestions into spec`);
  console.log(`    3. Run 'specforge plan ${path.basename(specDir)}' to update plan\n`);
}
