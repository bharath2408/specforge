import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline/promises";
import {
  getDefaultArticles,
  generateConstitutionMarkdown,
  addAmendment,
  parseConstitution,
} from "@specforge-dev/core/constitution";
import {
  analyzeProject,
  buildManualProjectAnalysis,
} from "@specforge-dev/core/project-analyzer";
import { loadConfig } from "@specforge-dev/core/config";
import type { Constitution, ProjectAnalysis, ProjectType, ManualProjectInput } from "@specforge-dev/core";

export interface ConstitutionCommandOptions {
  amend?: string;
  article?: string;
  skipAnalysis?: boolean;
}

export async function constitutionCommand(
  opts: ConstitutionCommandOptions = {}
): Promise<void> {
  const config = loadConfig();
  const memoryDir = path.resolve(config.memoryDir);
  const constitutionPath = path.join(memoryDir, "constitution.md");

  // Amend mode
  if (opts.amend) {
    if (!fs.existsSync(constitutionPath)) {
      console.error(
        "\n  No constitution found. Run 'specforge constitution' first to create one.\n"
      );
      process.exit(1);
    }

    const amendment = addAmendment(constitutionPath, {
      description: opts.amend,
      articleId: opts.article,
    });

    console.log(`\n  Amendment added: [${amendment.id}] ${amendment.description}`);
    if (amendment.articleId) {
      console.log(`  Affects article: ${amendment.articleId}`);
    }
    console.log(`  File: ${constitutionPath}\n`);
    return;
  }

  // Create mode
  if (fs.existsSync(constitutionPath)) {
    const existing = fs.readFileSync(constitutionPath, "utf-8");
    const parsed = parseConstitution(existing);
    console.log(`\n  Constitution already exists at: ${constitutionPath}`);
    console.log(`  Articles: ${parsed.articles.length}`);
    console.log(`  Amendments: ${parsed.amendments.length}`);
    console.log(
      `\n  Use --amend "description" to add an amendment.\n`
    );
    return;
  }

  // Generate new constitution
  fs.mkdirSync(memoryDir, { recursive: true });

  const constitution: Constitution = {
    articles: getDefaultArticles(),
    amendments: [],
  };

  // Project analysis
  let projectAnalysis: ProjectAnalysis | undefined;

  if (!opts.skipAnalysis) {
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, "package.json");

    if (fs.existsSync(packageJsonPath)) {
      // Auto-detect from existing project
      console.log("\n  Analyzing project...");
      projectAnalysis = analyzeProject(cwd);

      console.log(`\n  Detected project context:`);
      console.log(`    Type: ${projectAnalysis.projectType}`);
      console.log(`    Language: ${projectAnalysis.techStack.language}`);
      console.log(`    Package Manager: ${projectAnalysis.techStack.packageManager}`);

      const categorized = projectAnalysis.techStack.frameworks.filter(
        (f) => f.category !== "other" && f.category !== "runtime"
      );
      if (categorized.length > 0) {
        console.log(`    Frameworks: ${categorized.map((f) => f.name).join(", ")}`);
      }
      console.log(`    Best Practices: ${projectAnalysis.bestPractices.length} applicable`);
    } else if (process.stdin.isTTY) {
      // Interactive prompts for new projects
      projectAnalysis = await promptForProjectInfo();
    }
  }

  const content = generateConstitutionMarkdown(constitution, projectAnalysis);
  fs.writeFileSync(constitutionPath, content, "utf-8");

  console.log(`\n  Constitution created with ${constitution.articles.length} articles:`);
  for (const article of constitution.articles) {
    console.log(`    [${article.id}] ${article.title}`);
  }
  if (projectAnalysis) {
    console.log(`\n  Project Context: ${projectAnalysis.projectType} (${projectAnalysis.techStack.language})`);
  }
  console.log(`\n  File: ${constitutionPath}`);
  console.log(`  Use --amend "description" to add amendments.\n`);
}

const PROJECT_TYPES: { key: string; label: string; value: ProjectType }[] = [
  { key: "1", label: "Frontend (React, Vue, Angular, etc.)", value: "frontend" },
  { key: "2", label: "Backend (Express, Fastify, NestJS, etc.)", value: "backend" },
  { key: "3", label: "Fullstack (Next.js, Nuxt, Remix, etc.)", value: "fullstack" },
  { key: "4", label: "Library / Package", value: "library" },
  { key: "5", label: "CLI Tool", value: "cli" },
];

async function promptForProjectInfo(): Promise<ProjectAnalysis | undefined> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n  No package.json found. Let's set up your project context.\n");

    const projectName = (await rl.question("  Project name: ")).trim() || "my-project";

    console.log("\n  Project type:");
    for (const pt of PROJECT_TYPES) {
      console.log(`    ${pt.key}. ${pt.label}`);
    }
    const typeChoice = (await rl.question("\n  Choose (1-5): ")).trim();
    const projectType = PROJECT_TYPES.find((pt) => pt.key === typeChoice)?.value ?? "unknown";

    const frameworksRaw = (await rl.question("  Frameworks (comma-separated, e.g. React, Prisma): ")).trim();
    const frameworks = frameworksRaw
      ? frameworksRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const language = (await rl.question("  Language (TypeScript/JavaScript) [TypeScript]: ")).trim() || "TypeScript";

    const projectIdea = (await rl.question("  Brief project description: ")).trim();

    const input: ManualProjectInput = {
      projectName,
      projectType,
      frameworks,
      language,
      projectIdea,
    };

    return buildManualProjectAnalysis(input);
  } catch {
    // Non-interactive environment or user cancelled
    return undefined;
  } finally {
    rl.close();
  }
}
