import * as fs from "node:fs";
import * as path from "node:path";
import type { FeatureSpec, Priority } from "./types.js";
import {
  getNextSequenceNumber,
  formatSequence,
  listSpecDirs,
  parseSpecDirName,
} from "./sequence.js";

/**
 * List all feature specs in the specs directory.
 */
export function listSpecs(specsDir: string): FeatureSpec[] {
  const dirs = listSpecDirs(specsDir);
  const specs: FeatureSpec[] = [];

  for (const dir of dirs) {
    const specPath = path.join(specsDir, dir, "spec.md");
    if (fs.existsSync(specPath)) {
      const content = fs.readFileSync(specPath, "utf-8");
      const parsed = parseSpecDirName(dir);
      if (parsed) {
        const spec = parseSpecMarkdown(content, parsed.seq, parsed.slug);
        specs.push(spec);
      }
    }
  }

  return specs;
}

/**
 * Get the next spec ID (formatted sequence number).
 */
export function getNextSpecId(specsDir: string): string {
  const next = getNextSequenceNumber(specsDir);
  return formatSequence(next);
}

/**
 * Convert a human-readable name into a URL-safe slug.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse a feature spec from markdown content.
 */
export function parseSpecMarkdown(
  content: string,
  seq: number,
  slug: string
): FeatureSpec {
  const spec: FeatureSpec = {
    id: `${formatSequence(seq)}-${slug}`,
    name: slug.replace(/-/g, " "),
    slug,
    status: "draft",
    scenarios: [],
    requirements: [],
    entities: [],
    successCriteria: [],
    edgeCases: [],
    openQuestions: [],
  };

  const lines = content.split("\n");
  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section headers
    if (line.startsWith("## ")) {
      currentSection = line.replace("## ", "").trim().toLowerCase();
      continue;
    }

    // Parse based on section
    if (currentSection.includes("status") && line.startsWith("Status:")) {
      const status = line.replace("Status:", "").trim().toLowerCase();
      if (
        ["draft", "clarified", "planned", "in-progress", "complete"].includes(
          status
        )
      ) {
        spec.status = status as FeatureSpec["status"];
      }
    }

    if (
      currentSection.includes("user scenarios") ||
      currentSection.includes("scenarios")
    ) {
      const scenarioMatch = line.match(
        /^### \[(US\d+)\] \[(P[123])\]\s+(.+)$/
      );
      if (scenarioMatch) {
        const scenario = {
          id: scenarioMatch[1],
          priority: scenarioMatch[2] as Priority,
          description: scenarioMatch[3],
          given: "",
          when: "",
          then: "",
        };
        // Look ahead for Given/When/Then
        for (let j = i + 1; j < lines.length && !lines[j].startsWith("###"); j++) {
          const gMatch = lines[j].match(/^\*\*Given\*\*\s+(.+)/);
          const wMatch = lines[j].match(/^\*\*When\*\*\s+(.+)/);
          const tMatch = lines[j].match(/^\*\*Then\*\*\s+(.+)/);
          if (gMatch) scenario.given = gMatch[1];
          if (wMatch) scenario.when = wMatch[1];
          if (tMatch) scenario.then = tMatch[1];
        }
        spec.scenarios.push(scenario);
      }
    }

    if (currentSection.includes("functional requirements")) {
      const reqMatch = line.match(/^### \[(FR-\d+)\]\s+(.+)$/);
      if (reqMatch) {
        spec.requirements.push({
          id: reqMatch[1],
          description: reqMatch[2],
          scenarios: [],
        });
      }
    }

    if (currentSection.includes("key entities")) {
      const entityMatch = line.match(/^- \*\*(.+?)\*\*/);
      if (entityMatch) {
        spec.entities.push(entityMatch[1]);
      }
    }

    if (currentSection.includes("success criteria")) {
      if (line.startsWith("- ")) {
        spec.successCriteria.push(line.replace("- ", "").trim());
      }
    }

    if (currentSection.includes("edge cases")) {
      if (line.startsWith("- ")) {
        spec.edgeCases.push(line.replace("- ", "").trim());
      }
    }

    if (currentSection.includes("open questions")) {
      if (line.startsWith("- ")) {
        spec.openQuestions.push(line.replace("- ", "").trim());
      }
    }
  }

  return spec;
}

/**
 * Generate the feature spec markdown content.
 */
export function generateSpecMarkdown(
  name: string,
  seq: number,
  slug: string
): string {
  const id = `${formatSequence(seq)}-${slug}`;

  return `# Feature Spec: ${name}

> Spec ID: ${id}
> Created: ${new Date().toISOString().split("T")[0]}

## Status

Status: draft

## User Scenarios

### [US1] [P1] ${name} - Primary Flow

**Given** a user is in the system
**When** they perform the primary action
**Then** the expected outcome occurs

### [US2] [P2] ${name} - Secondary Flow

**Given** a user is in the system
**When** they perform a secondary action
**Then** an alternative outcome occurs

### [US3] [P3] ${name} - Edge Case Flow

**Given** a user encounters an unusual situation
**When** they perform an edge case action
**Then** the system handles it gracefully

## Functional Requirements

### [FR-001] Core Functionality

Implements the primary feature behavior.

### [FR-002] Validation

Input validation and error handling for the feature.

### [FR-003] Integration

Integration with existing system components.

## Key Entities

- **Entity1** — Primary entity for this feature
- **Entity2** — Supporting entity

## Success Criteria

- All P1 scenarios pass acceptance testing
- API response times under 200ms
- Error rates below 0.1%
- All functional requirements implemented

## Edge Cases

- Empty or missing input data
- Concurrent access by multiple users
- Network timeout handling
- Invalid or malformed data

## Open Questions

- What are the rate limiting requirements?
- How should the feature handle backward compatibility?
- What monitoring/alerting is needed?
`;
}
