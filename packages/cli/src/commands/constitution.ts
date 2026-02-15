import * as fs from "node:fs";
import * as path from "node:path";
import {
  getDefaultArticles,
  generateConstitutionMarkdown,
  addAmendment,
  parseConstitution,
} from "@specforge/core/constitution";
import { loadConfig } from "@specforge/core/config";
import type { Constitution } from "@specforge/core";

export interface ConstitutionCommandOptions {
  amend?: string;
  article?: string;
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

  const content = generateConstitutionMarkdown(constitution);
  fs.writeFileSync(constitutionPath, content, "utf-8");

  console.log(`\n  Constitution created with ${constitution.articles.length} articles:`);
  for (const article of constitution.articles) {
    console.log(`    [${article.id}] ${article.title}`);
  }
  console.log(`\n  File: ${constitutionPath}`);
  console.log(`  Use --amend "description" to add amendments.\n`);
}
