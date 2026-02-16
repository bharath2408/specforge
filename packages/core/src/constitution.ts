import * as fs from "node:fs";
import * as path from "node:path";
import type { Article, Amendment, Constitution, ProjectAnalysis } from "./types.js";
import { generateProjectContextMarkdown } from "./project-analyzer.js";

/**
 * Get the 9 default articles of the SpecForge constitution.
 */
export function getDefaultArticles(): Article[] {
  return [
    {
      id: "A1",
      title: "Library-First",
      description:
        "All features must be implemented as importable library functions before any CLI or UI wrapper is added. The library is the source of truth.",
    },
    {
      id: "A2",
      title: "CLI Mandate",
      description:
        "Every library function that a developer would invoke must be exposed through the CLI. No hidden functionality.",
    },
    {
      id: "A3",
      title: "Test-First",
      description:
        "All features must have tests defined before implementation begins. Tests are part of the specification, not an afterthought.",
    },
    {
      id: "A4",
      title: "Simplicity",
      description:
        "Prefer simple, readable code over clever abstractions. A developer should understand any module in under 5 minutes.",
    },
    {
      id: "A5",
      title: "Anti-Abstraction",
      description:
        "Do not create abstractions until you have at least 3 concrete use cases. Premature abstraction is worse than duplication.",
    },
    {
      id: "A6",
      title: "Documentation as Code",
      description:
        "Documentation is generated from specs, not written separately. If it's not in the spec, it doesn't exist.",
    },
    {
      id: "A7",
      title: "Backward Compatibility",
      description:
        "Breaking changes require an explicit migration path. Existing specs must continue to work after upgrades.",
    },
    {
      id: "A8",
      title: "Single Responsibility",
      description:
        "Each module, function, and file has one clear purpose. If you need 'and' to describe it, split it.",
    },
    {
      id: "A9",
      title: "Spec-Driven Development",
      description:
        "The spec is the single source of truth. Code is generated from specs. Changes start with spec changes.",
    },
  ];
}

/**
 * Parse a constitution from a markdown file.
 */
export function parseConstitution(content: string): Constitution {
  const articles: Article[] = [];
  const amendments: Amendment[] = [];

  const lines = content.split("\n");
  let currentSection: "articles" | "amendments" | null = null;
  let currentArticle: Partial<Article> | null = null;
  let currentAmendment: Partial<Amendment> | null = null;
  let skipSection = false;

  for (const line of lines) {
    if (line.startsWith("## Project Context")) {
      skipSection = true;
      currentSection = null;
      continue;
    }
    if (line.startsWith("## Articles")) {
      skipSection = false;
      currentSection = "articles";
      continue;
    }
    if (line.startsWith("## Amendments")) {
      skipSection = false;
      currentSection = "amendments";
      continue;
    }
    if (skipSection) continue;

    if (currentSection === "articles") {
      const articleMatch = line.match(
        /^### \[([A-Z]\d+)\]\s+(.+)$/
      );
      if (articleMatch) {
        if (currentArticle?.id) {
          articles.push(currentArticle as Article);
        }
        currentArticle = {
          id: articleMatch[1],
          title: articleMatch[2],
          description: "",
        };
        continue;
      }
      if (currentArticle && line.trim() && !line.startsWith("#")) {
        currentArticle.description =
          (currentArticle.description ? currentArticle.description + " " : "") +
          line.trim();
      }
    }

    if (currentSection === "amendments") {
      const amendMatch = line.match(
        /^### \[AMD-(\d+)\]\s+\((.+?)\)\s+(.+)$/
      );
      if (amendMatch) {
        if (currentAmendment?.id) {
          amendments.push(currentAmendment as Amendment);
        }
        currentAmendment = {
          id: `AMD-${amendMatch[1]}`,
          date: amendMatch[2],
          description: amendMatch[3],
        };
        continue;
      }
      if (currentAmendment && line.trim() && !line.startsWith("#")) {
        const refMatch = line.match(/^Affects: \[([A-Z]\d+)\]/);
        if (refMatch) {
          currentAmendment.articleId = refMatch[1];
        }
      }
    }
  }

  // Push final items
  if (currentArticle?.id) articles.push(currentArticle as Article);
  if (currentAmendment?.id) amendments.push(currentAmendment as Amendment);

  return { articles, amendments };
}

/**
 * Add an amendment to the constitution file.
 */
export function addAmendment(
  constitutionPath: string,
  amendment: Omit<Amendment, "id" | "date">
): Amendment {
  const content = fs.existsSync(constitutionPath)
    ? fs.readFileSync(constitutionPath, "utf-8")
    : "";

  const existing = parseConstitution(content);
  const nextId = existing.amendments.length + 1;
  const newAmendment: Amendment = {
    id: `AMD-${String(nextId).padStart(3, "0")}`,
    date: new Date().toISOString().split("T")[0],
    description: amendment.description,
    articleId: amendment.articleId,
  };

  let newContent = content;
  if (!content.includes("## Amendments")) {
    newContent += "\n\n## Amendments\n";
  }

  const amendmentBlock = `\n### [${newAmendment.id}] (${newAmendment.date}) ${newAmendment.description}${newAmendment.articleId ? `\nAffects: [${newAmendment.articleId}]` : ""}\n`;

  newContent += amendmentBlock;
  fs.writeFileSync(constitutionPath, newContent, "utf-8");

  return newAmendment;
}

/**
 * Generate the full constitution markdown content.
 */
export function generateConstitutionMarkdown(
  constitution: Constitution,
  projectAnalysis?: ProjectAnalysis
): string {
  let md = "# Project Constitution\n\n";
  md +=
    "> This document defines the core principles governing this project.\n";
  md += "> Amendments are tracked at the bottom.\n\n";

  md += "## Articles\n\n";
  for (const article of constitution.articles) {
    md += `### [${article.id}] ${article.title}\n\n`;
    md += `${article.description}\n\n`;
  }

  if (projectAnalysis) {
    md += generateProjectContextMarkdown(projectAnalysis);
  }

  md += "## Amendments\n\n";
  if (constitution.amendments.length === 0) {
    md += "_No amendments yet._\n";
  } else {
    for (const amendment of constitution.amendments) {
      md += `### [${amendment.id}] (${amendment.date}) ${amendment.description}\n`;
      if (amendment.articleId) {
        md += `Affects: [${amendment.articleId}]\n`;
      }
      md += "\n";
    }
  }

  return md;
}
