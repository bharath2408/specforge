import * as fs from "node:fs";
import * as path from "node:path";
import type {
  Plan,
  PlanPhase,
  DataModelEntity,
  FeatureSpec,
  Constitution,
} from "./types.js";
import { parseConstitution } from "./constitution.js";
import { parseSpecMarkdown } from "./specfile.js";
import { parseSpecDirName } from "./sequence.js";

/**
 * Generate an implementation plan from a feature spec.
 */
export function generatePlan(
  specDir: string,
  constitutionPath?: string
): Plan {
  const specPath = path.join(specDir, "spec.md");
  const content = fs.readFileSync(specPath, "utf-8");
  const dirName = path.basename(specDir);
  const parsed = parseSpecDirName(dirName);
  const seq = parsed?.seq ?? 0;
  const slug = parsed?.slug ?? dirName;
  const spec = parseSpecMarkdown(content, seq, slug);

  // Check constitutional compliance
  const compliance = checkConstitutionalCompliance(spec, constitutionPath);

  // Extract tech context
  const techContext = extractTechContext(spec);

  // Generate phases
  const phases = generatePhases(spec);

  // Generate data model
  const dataModel = generateDataModel(spec);

  return {
    specId: spec.id,
    constitutionCompliance: compliance,
    techContext,
    phases,
    dataModel,
  };
}

function checkConstitutionalCompliance(
  spec: FeatureSpec,
  constitutionPath?: string
): string[] {
  const compliance: string[] = [];

  if (constitutionPath && fs.existsSync(constitutionPath)) {
    const content = fs.readFileSync(constitutionPath, "utf-8");
    const constitution = parseConstitution(content);

    for (const article of constitution.articles) {
      compliance.push(
        `[${article.id}] ${article.title}: Plan should adhere to "${article.description.substring(0, 80)}..."`
      );
    }
  } else {
    compliance.push("No constitution found — using default compliance checks.");
  }

  // Basic checks based on spec content
  if (spec.scenarios.length === 0) {
    compliance.push(
      "WARNING: No user scenarios defined — violates Spec-Driven Development."
    );
  }
  if (spec.requirements.length === 0) {
    compliance.push(
      "WARNING: No functional requirements — implementation scope is unclear."
    );
  }

  return compliance;
}

function extractTechContext(spec: FeatureSpec): string[] {
  const context: string[] = [];
  context.push(`Feature: ${spec.name}`);
  context.push(`Scenarios: ${spec.scenarios.length} user scenarios defined`);
  context.push(
    `Requirements: ${spec.requirements.length} functional requirements`
  );
  context.push(`Entities: ${spec.entities.join(", ") || "None defined"}`);
  context.push(`Status: ${spec.status}`);
  return context;
}

function generatePhases(spec: FeatureSpec): PlanPhase[] {
  const phases: PlanPhase[] = [];

  // Phase 1: Setup
  phases.push({
    name: "Phase 1: Setup & Configuration",
    description:
      "Set up project structure, dependencies, and configuration for the feature.",
    fileChanges: [
      {
        path: "spec/*.spec.yaml",
        action: "modify",
        description: "Update spec file with new models/endpoints",
      },
      {
        path: "package.json",
        action: "modify",
        description: "Add any new dependencies",
      },
    ],
  });

  // Phase 2: Data Model
  if (spec.entities.length > 0) {
    phases.push({
      name: "Phase 2: Data Model",
      description: "Implement data models and database schema changes.",
      fileChanges: spec.entities.map((entity) => ({
        path: `src/models/${entity.toLowerCase()}.ts`,
        action: "create" as const,
        description: `Create ${entity} model`,
      })),
    });
  }

  // Phase 3: Core Logic (from requirements)
  phases.push({
    name: `Phase ${spec.entities.length > 0 ? 3 : 2}: Core Implementation`,
    description: "Implement core business logic for each functional requirement.",
    fileChanges: spec.requirements.map((req) => ({
      path: `src/features/${spec.slug}/${req.id.toLowerCase().replace(/-/g, "_")}.ts`,
      action: "create" as const,
      description: `Implement ${req.id}: ${req.description}`,
    })),
  });

  // Phase 4: API Routes
  phases.push({
    name: `Phase ${spec.entities.length > 0 ? 4 : 3}: API Routes`,
    description: "Create API endpoints for the feature.",
    fileChanges: [
      {
        path: `src/routes/${spec.slug}.ts`,
        action: "create",
        description: "Feature route handlers",
      },
    ],
  });

  // Phase 5: Tests
  phases.push({
    name: `Phase ${spec.entities.length > 0 ? 5 : 4}: Testing`,
    description: "Implement tests for all user scenarios.",
    fileChanges: spec.scenarios.map((s) => ({
      path: `tests/${spec.slug}/${s.id.toLowerCase()}.test.ts`,
      action: "create" as const,
      description: `Test: ${s.description}`,
    })),
  });

  return phases;
}

function generateDataModel(spec: FeatureSpec): DataModelEntity[] {
  return spec.entities.map((entity) => ({
    name: entity,
    fields: [
      { name: "id", type: "uuid", constraints: "PRIMARY KEY" },
      { name: "createdAt", type: "datetime", constraints: "NOT NULL DEFAULT NOW()" },
      { name: "updatedAt", type: "datetime", constraints: "NOT NULL DEFAULT NOW()" },
    ],
    relationships: [],
  }));
}

/**
 * Generate plan markdown output.
 */
export function generatePlanMarkdown(plan: Plan): string {
  let md = `# Implementation Plan: ${plan.specId}\n\n`;
  md += `> Generated: ${new Date().toISOString().split("T")[0]}\n\n`;

  md += `## Constitutional Compliance\n\n`;
  for (const c of plan.constitutionCompliance) {
    md += `- ${c}\n`;
  }

  md += `\n## Technical Context\n\n`;
  for (const t of plan.techContext) {
    md += `- ${t}\n`;
  }

  md += `\n## Implementation Phases\n\n`;
  for (const phase of plan.phases) {
    md += `### ${phase.name}\n\n`;
    md += `${phase.description}\n\n`;
    md += `| File | Action | Description |\n`;
    md += `|------|--------|-------------|\n`;
    for (const fc of phase.fileChanges) {
      md += `| \`${fc.path}\` | ${fc.action} | ${fc.description} |\n`;
    }
    md += `\n`;
  }

  return md;
}

/**
 * Generate data model markdown output.
 */
export function generateDataModelMarkdown(
  entities: DataModelEntity[]
): string {
  let md = `# Data Model\n\n`;
  md += `> Generated: ${new Date().toISOString().split("T")[0]}\n\n`;

  if (entities.length === 0) {
    md += `_No entities defined in the spec._\n`;
    return md;
  }

  // Mermaid ER diagram
  md += `## ER Diagram\n\n`;
  md += "```mermaid\nerDiagram\n";
  for (const entity of entities) {
    md += `    ${entity.name} {\n`;
    for (const field of entity.fields) {
      md += `        ${field.type} ${field.name}\n`;
    }
    md += `    }\n`;
  }
  md += "```\n\n";

  // Entity details
  md += `## Entities\n\n`;
  for (const entity of entities) {
    md += `### ${entity.name}\n\n`;
    md += `| Field | Type | Constraints |\n`;
    md += `|-------|------|-------------|\n`;
    for (const field of entity.fields) {
      md += `| ${field.name} | ${field.type} | ${field.constraints} |\n`;
    }
    if (entity.relationships.length > 0) {
      md += `\n**Relationships:** ${entity.relationships.join(", ")}\n`;
    }
    md += `\n`;
  }

  return md;
}
