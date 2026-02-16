import type { AmbiguityFinding, CoverageTable, FeatureSpec, ParsedSpec } from "./types.js";

export interface ScannerContext {
  content: string;
  featureSpec?: FeatureSpec;
  parsedSpec?: ParsedSpec;
}

// 15 ambiguity categories
const AMBIGUITY_CATEGORIES = [
  "placeholder-text",
  "empty-sections",
  "missing-priorities",
  "undefined-entities",
  "unclear-acceptance-criteria",
  "missing-edge-cases",
  "undefined-auth",
  "missing-error-handling",
  "incomplete-data-model",
  "ambiguous-terminology",
  "entity-relationships",
  "open-question-suggestions",
  "cross-spec-alignment",
  "scenario-entity-coverage",
  "implicit-entity-detection",
] as const;

type AmbiguityCategory = (typeof AMBIGUITY_CATEGORIES)[number];

interface Scanner {
  category: AmbiguityCategory;
  label: string;
  scan: (ctx: ScannerContext) => AmbiguityFinding[];
}

const PLACEHOLDER_PATTERNS = [
  /TODO/gi,
  /TBD/gi,
  /FIXME/gi,
  /placeholder/gi,
  /lorem ipsum/gi,
  /\[insert .+?\]/gi,
  /\.\.\./g,
  /xxx/gi,
];

const scanners: Scanner[] = [
  {
    category: "placeholder-text",
    label: "Placeholder Text",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const pattern of PLACEHOLDER_PATTERNS) {
          pattern.lastIndex = 0;
          if (pattern.test(lines[i])) {
            findings.push({
              category: "placeholder-text",
              description: `Placeholder text found: "${lines[i].trim()}"`,
              location: `Line ${i + 1}`,
              suggestion: "Replace with concrete, specific content.",
            });
            break;
          }
        }
      }
      return findings;
    },
  },
  {
    category: "empty-sections",
    label: "Empty Sections",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const sections = content.split(/^## /m);
      for (const section of sections.slice(1)) {
        const lines = section.split("\n");
        const header = lines[0].trim();
        const body = lines
          .slice(1)
          .filter((l) => l.trim() && !l.startsWith("###"))
          .join("")
          .trim();
        if (!body || body.length < 10) {
          findings.push({
            category: "empty-sections",
            description: `Section "${header}" appears empty or has minimal content.`,
            location: `Section: ${header}`,
            suggestion: `Add detailed content to the "${header}" section.`,
          });
        }
      }
      return findings;
    },
  },
  {
    category: "missing-priorities",
    label: "Missing Priorities",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const scenarioMatches = content.match(/^### \[US\d+\]/gm);
      if (scenarioMatches) {
        for (const match of scenarioMatches) {
          if (!/\[P[123]\]/.test(match)) {
            findings.push({
              category: "missing-priorities",
              description: `Scenario "${match}" missing priority level.`,
              location: match,
              suggestion: "Add [P1], [P2], or [P3] priority tag.",
            });
          }
        }
      }
      if (!content.includes("[P1]")) {
        findings.push({
          category: "missing-priorities",
          description: "No P1 (critical) priority scenarios found.",
          location: "User Scenarios",
          suggestion:
            "At least one scenario should be marked P1 for must-have functionality.",
        });
      }
      return findings;
    },
  },
  {
    category: "undefined-entities",
    label: "Undefined Entities",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const entitySection = content.match(
        /## Key Entities\n([\s\S]*?)(?=\n## |$)/
      );
      if (!entitySection) {
        findings.push({
          category: "undefined-entities",
          description: "No Key Entities section found.",
          location: "Document",
          suggestion:
            "Add a Key Entities section listing all domain objects.",
        });
      } else {
        const entities = entitySection[1].match(/\*\*(.+?)\*\*/g);
        if (!entities || entities.length === 0) {
          findings.push({
            category: "undefined-entities",
            description: "Key Entities section has no defined entities.",
            location: "Key Entities",
            suggestion: "Define entities with **EntityName** format.",
          });
        }
      }
      return findings;
    },
  },
  {
    category: "unclear-acceptance-criteria",
    label: "Unclear Acceptance Criteria",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const successSection = content.match(
        /## Success Criteria\n([\s\S]*?)(?=\n## |$)/
      );
      if (!successSection) {
        findings.push({
          category: "unclear-acceptance-criteria",
          description: "No Success Criteria section found.",
          location: "Document",
          suggestion: "Add measurable success criteria.",
        });
      } else {
        const criteria = successSection[1]
          .split("\n")
          .filter((l) => l.startsWith("- "));
        if (criteria.length < 2) {
          findings.push({
            category: "unclear-acceptance-criteria",
            description: "Fewer than 2 success criteria defined.",
            location: "Success Criteria",
            suggestion:
              "Define at least 3 measurable acceptance criteria.",
          });
        }
        const vague = [
          "should work",
          "should be good",
          "fast enough",
          "reasonable",
          "appropriate",
        ];
        for (const criterion of criteria) {
          for (const v of vague) {
            if (criterion.toLowerCase().includes(v)) {
              findings.push({
                category: "unclear-acceptance-criteria",
                description: `Vague criterion: "${criterion.trim()}"`,
                location: "Success Criteria",
                suggestion:
                  "Replace with measurable, specific criteria (e.g., 'response time < 200ms').",
              });
            }
          }
        }
      }
      return findings;
    },
  },
  {
    category: "missing-edge-cases",
    label: "Missing Edge Cases",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const edgeCaseSection = content.match(
        /## Edge Cases\n([\s\S]*?)(?=\n## |$)/
      );
      if (!edgeCaseSection) {
        findings.push({
          category: "missing-edge-cases",
          description: "No Edge Cases section found.",
          location: "Document",
          suggestion: "Add an Edge Cases section covering boundary conditions.",
        });
      } else {
        const cases = edgeCaseSection[1]
          .split("\n")
          .filter((l) => l.startsWith("- "));
        if (cases.length < 3) {
          findings.push({
            category: "missing-edge-cases",
            description: `Only ${cases.length} edge cases defined.`,
            location: "Edge Cases",
            suggestion: "Define at least 3-5 edge cases for robustness.",
          });
        }
      }
      return findings;
    },
  },
  {
    category: "undefined-auth",
    label: "Undefined Authentication",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const hasAuth =
        /auth/i.test(content) ||
        /permission/i.test(content) ||
        /role/i.test(content) ||
        /access control/i.test(content);
      const hasAuthDetails =
        /JWT/i.test(content) ||
        /OAuth/i.test(content) ||
        /session/i.test(content) ||
        /token/i.test(content) ||
        /\bpublic\b/i.test(content);

      if (hasAuth && !hasAuthDetails) {
        findings.push({
          category: "undefined-auth",
          description:
            "Authentication mentioned but not defined in detail.",
          location: "Document",
          suggestion:
            "Specify authentication strategy (JWT, OAuth, session, etc.).",
        });
      }
      return findings;
    },
  },
  {
    category: "missing-error-handling",
    label: "Missing Error Handling",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const hasError =
        /error/i.test(content) || /fail/i.test(content);
      const hasErrorStrategy =
        /error handling/i.test(content) ||
        /error response/i.test(content) ||
        /4\d\d/i.test(content) ||
        /5\d\d/i.test(content);

      if (!hasErrorStrategy) {
        findings.push({
          category: "missing-error-handling",
          description: "No error handling strategy defined.",
          location: "Document",
          suggestion:
            "Add error handling details: error codes, error response format, retry strategy.",
        });
      }
      return findings;
    },
  },
  {
    category: "incomplete-data-model",
    label: "Incomplete Data Model",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const entitySection = content.match(
        /## Key Entities\n([\s\S]*?)(?=\n## |$)/
      );
      if (entitySection) {
        const entities = entitySection[1].match(/\*\*(.+?)\*\*/g) ?? [];
        for (const entity of entities) {
          const name = entity.replace(/\*\*/g, "");
          // Check if entity has description after the name
          const entityLine = entitySection[1]
            .split("\n")
            .find((l) => l.includes(entity));
          if (entityLine && entityLine.split("--").length < 2 && entityLine.split("—").length < 2) {
            findings.push({
              category: "incomplete-data-model",
              description: `Entity "${name}" has no description.`,
              location: "Key Entities",
              suggestion: `Add a description for "${name}" using "— description" format.`,
            });
          }
        }
      }
      return findings;
    },
  },
  {
    category: "ambiguous-terminology",
    label: "Ambiguous Terminology",
    scan({ content }) {
      const findings: AmbiguityFinding[] = [];
      const ambiguousTerms = [
        { term: /\bthe system\b/gi, suggestion: "Specify which component or service." },
        { term: /\bthe user\b/gi, suggestion: "Specify user role or type." },
        { term: /\bappropriate\b/gi, suggestion: "Define what is appropriate." },
        { term: /\bas needed\b/gi, suggestion: "Specify when it's needed." },
        { term: /\betc\.?\b/gi, suggestion: "List all items explicitly." },
        { term: /\bvarious\b/gi, suggestion: "Enumerate the specific items." },
      ];

      for (const { term, suggestion } of ambiguousTerms) {
        term.lastIndex = 0;
        let match: RegExpExecArray | null;
        let count = 0;
        while ((match = term.exec(content)) !== null && count < 3) {
          count++;
          const lineNum =
            content.substring(0, match.index).split("\n").length;
          findings.push({
            category: "ambiguous-terminology",
            description: `Ambiguous term "${match[0]}" found.`,
            location: `Line ${lineNum}`,
            suggestion,
          });
        }
      }
      return findings;
    },
  },
  // ── New enhanced scanners (11–15) ──────────────────────────
  {
    category: "entity-relationships",
    label: "Entity Relationships",
    scan({ featureSpec }) {
      if (!featureSpec) return [];
      const findings: AmbiguityFinding[] = [];
      const entities = featureSpec.entities;
      if (entities.length < 2) return findings;

      const scenarioTexts = featureSpec.scenarios.map(
        (s) => `${s.given} ${s.when} ${s.then}`
      );

      const reported = new Set<string>();

      // Co-occurrence: both entity names in same scenario
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const a = entities[i];
          const b = entities[j];
          const key = [a, b].sort().join("|");
          if (reported.has(key)) continue;

          for (const text of scenarioTexts) {
            const lower = text.toLowerCase();
            if (lower.includes(a.toLowerCase()) && lower.includes(b.toLowerCase())) {
              reported.add(key);
              findings.push({
                category: "entity-relationships",
                description: `"${a}" and "${b}" appear together in a scenario, suggesting a relationship.`,
                location: "User Scenarios",
                suggestion: `Define the relationship between "${a}" and "${b}" in the data model (e.g., one-to-many, many-to-many).`,
              });
              break;
            }
          }
        }
      }

      // Verb patterns: "adds X to Y", "belongs to", "contains", "has"
      const verbPatterns = [
        /(\w+)\s+adds\s+(\w+)\s+to\s+(\w+)/gi,
        /(\w+)\s+creates?\s+(?:a\s+)?(\w+)/gi,
        /(\w+)\s+belongs?\s+to\s+(\w+)/gi,
        /(\w+)\s+contains?\s+(\w+)/gi,
        /(\w+)\s+has\s+(?:a\s+|an\s+)?(\w+)/gi,
      ];

      const allScenarioText = scenarioTexts.join(" ");
      const entityNamesLower = new Set(entities.map((e) => e.toLowerCase()));

      for (const pattern of verbPatterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(allScenarioText)) !== null) {
          const words = match.slice(1).filter((w) => entityNamesLower.has(w.toLowerCase()));
          if (words.length >= 2) {
            const key = words.map((w) => w.toLowerCase()).sort().join("|");
            if (!reported.has(key)) {
              reported.add(key);
              findings.push({
                category: "entity-relationships",
                description: `Verb pattern "${match[0].trim()}" implies a relationship between entities.`,
                location: "User Scenarios",
                suggestion: `Model the relationship suggested by "${match[0].trim()}" in Key Entities or data model.`,
              });
            }
          }
        }
      }

      return findings;
    },
  },
  {
    category: "open-question-suggestions",
    label: "Open Question Suggestions",
    scan({ featureSpec }) {
      if (!featureSpec) return [];
      const findings: AmbiguityFinding[] = [];
      if (featureSpec.openQuestions.length === 0) return findings;

      // Build searchable text from scenarios, requirements, criteria
      const searchable = [
        ...featureSpec.scenarios.map((s) => `${s.description} ${s.given} ${s.when} ${s.then}`),
        ...featureSpec.requirements.map((r) => r.description),
        ...featureSpec.successCriteria,
        ...featureSpec.edgeCases,
      ]
        .join(" ")
        .toLowerCase();

      for (const question of featureSpec.openQuestions) {
        // Extract significant keywords (length > 4, not common words)
        const stopWords = new Set(["about", "should", "would", "could", "there", "their", "which", "where", "these", "those", "being", "after", "before"]);
        const keywords = question
          .replace(/[?.,!;:'"]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 4 && !stopWords.has(w.toLowerCase()))
          .map((w) => w.toLowerCase());

        const matchCount = keywords.filter((kw) => searchable.includes(kw)).length;

        if (matchCount >= 2) {
          findings.push({
            category: "open-question-suggestions",
            description: `Open question "${question}" has related context in the spec (${matchCount} keyword matches).`,
            location: "Open Questions",
            suggestion: "Review scenarios and requirements — this question may be answerable from existing spec content.",
          });
        }
      }

      return findings;
    },
  },
  {
    category: "cross-spec-alignment",
    label: "Cross-Spec Alignment",
    scan({ featureSpec, parsedSpec }) {
      if (!featureSpec || !parsedSpec) return [];
      const findings: AmbiguityFinding[] = [];

      const specEntities = new Set(featureSpec.entities.map((e) => e.toLowerCase()));
      const yamlModels = new Set(Object.keys(parsedSpec.models).map((m) => m.toLowerCase()));

      // Entities in spec.md but missing from .spec.yaml
      for (const entity of featureSpec.entities) {
        if (!yamlModels.has(entity.toLowerCase())) {
          findings.push({
            category: "cross-spec-alignment",
            description: `Entity "${entity}" is in spec.md but missing from .spec.yaml models.`,
            location: "Key Entities vs .spec.yaml",
            suggestion: `Add a "${entity}" model to .spec.yaml or remove it from Key Entities if not needed.`,
          });
        }
      }

      // Models in .spec.yaml but missing from spec.md
      for (const model of Object.keys(parsedSpec.models)) {
        if (!specEntities.has(model.toLowerCase())) {
          findings.push({
            category: "cross-spec-alignment",
            description: `Model "${model}" is in .spec.yaml but missing from spec.md Key Entities.`,
            location: ".spec.yaml vs Key Entities",
            suggestion: `Add "${model}" to Key Entities in spec.md or remove it from .spec.yaml if not needed.`,
          });
        }
      }

      return findings;
    },
  },
  {
    category: "scenario-entity-coverage",
    label: "Scenario-Entity Coverage",
    scan({ featureSpec }) {
      if (!featureSpec) return [];
      const findings: AmbiguityFinding[] = [];
      if (featureSpec.entities.length === 0 || featureSpec.scenarios.length === 0) return findings;

      const allScenarioText = featureSpec.scenarios
        .map((s) => `${s.description} ${s.given} ${s.when} ${s.then}`)
        .join(" ")
        .toLowerCase();

      for (const entity of featureSpec.entities) {
        if (!allScenarioText.includes(entity.toLowerCase())) {
          findings.push({
            category: "scenario-entity-coverage",
            description: `Entity "${entity}" is not mentioned in any user scenario.`,
            location: "Key Entities",
            suggestion: `Add a scenario that exercises "${entity}" or remove it from Key Entities if unused.`,
          });
        }
      }

      return findings;
    },
  },
  {
    category: "implicit-entity-detection",
    label: "Implicit Entity Detection",
    scan({ content, featureSpec }) {
      if (!featureSpec) return [];
      const findings: AmbiguityFinding[] = [];

      const knownEntities = new Set(featureSpec.entities.map((e) => e.toLowerCase()));

      // Collect scenario and requirement text
      const textToScan = [
        ...featureSpec.scenarios.map((s) => `${s.description} ${s.given} ${s.when} ${s.then}`),
        ...featureSpec.requirements.map((r) => r.description),
      ].join("\n");

      const found = new Set<string>();

      // PascalCase words (2+ capital-started segments, e.g., UserProfile, ShoppingCart)
      const pascalCasePattern = /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g;
      let match: RegExpExecArray | null;
      while ((match = pascalCasePattern.exec(textToScan)) !== null) {
        const word = match[1];
        if (!knownEntities.has(word.toLowerCase()) && !found.has(word.toLowerCase())) {
          found.add(word.toLowerCase());
          findings.push({
            category: "implicit-entity-detection",
            description: `PascalCase word "${word}" found in scenarios/requirements but not in Key Entities.`,
            location: "User Scenarios / Requirements",
            suggestion: `Consider adding "${word}" to Key Entities if it's a domain object.`,
          });
        }
      }

      // "the/a/an + Capitalized" patterns (e.g., "the Order", "a Product")
      const articlePattern = /\b(?:the|a|an)\s+([A-Z][a-z]{2,})\b/g;
      while ((match = articlePattern.exec(textToScan)) !== null) {
        const word = match[1];
        if (!knownEntities.has(word.toLowerCase()) && !found.has(word.toLowerCase())) {
          found.add(word.toLowerCase());
          findings.push({
            category: "implicit-entity-detection",
            description: `"${match[0]}" in scenarios/requirements suggests an entity not in Key Entities.`,
            location: "User Scenarios / Requirements",
            suggestion: `Consider adding "${word}" to Key Entities if it's a domain object.`,
          });
        }
      }

      return findings;
    },
  },
];

/**
 * Scan spec content for ambiguities across all 15 categories.
 */
export function scanForAmbiguities(
  content: string,
  featureSpec?: FeatureSpec,
  parsedSpec?: ParsedSpec,
): AmbiguityFinding[] {
  const findings: AmbiguityFinding[] = [];
  const ctx: ScannerContext = { content, featureSpec, parsedSpec };

  for (const scanner of scanners) {
    findings.push(...scanner.scan(ctx));
  }

  return findings;
}

/**
 * Generate a coverage table showing status of each ambiguity category.
 */
export function generateCoverageTable(
  content: string,
  findings: AmbiguityFinding[]
): CoverageTable[] {
  const findingsByCategory = new Map<string, AmbiguityFinding[]>();
  for (const f of findings) {
    const existing = findingsByCategory.get(f.category) ?? [];
    existing.push(f);
    findingsByCategory.set(f.category, existing);
  }

  return scanners.map((s) => {
    const categoryFindings = findingsByCategory.get(s.category) ?? [];
    let status: CoverageTable["status"];
    let details: string;

    if (categoryFindings.length === 0) {
      status = "covered";
      details = "No issues found";
    } else if (categoryFindings.length <= 2) {
      status = "partial";
      details = `${categoryFindings.length} issue(s) found`;
    } else {
      status = "missing";
      details = `${categoryFindings.length} issues found — needs attention`;
    }

    return {
      category: s.label,
      status,
      details,
    };
  });
}

export { AMBIGUITY_CATEGORIES, scanners };
