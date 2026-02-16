import type {
  AmbiguityFinding,
  FeatureSpec,
  ParsedSpec,
  ImplementationNotes,
  EntityMapEntry,
  EntityRelationship,
  ImplementationRecommendation,
  OpenQuestionContext,
  CrossReferenceNote,
  ReusablePattern,
} from "./types.js";

// ── Priority mapping for finding categories ──────────────────

const HIGH_PRIORITY_CATEGORIES = new Set([
  "undefined-auth",
  "missing-error-handling",
  "entity-relationships",
  "cross-spec-alignment",
]);

const MEDIUM_PRIORITY_CATEGORIES = new Set([
  "incomplete-data-model",
  "undefined-entities",
  "scenario-entity-coverage",
]);

// Everything else maps to low priority

/**
 * Generate structured implementation notes from clarify scan results.
 */
export function generateImplementationNotes(
  spec: FeatureSpec,
  findings: AmbiguityFinding[],
  parsedSpec?: ParsedSpec,
  previousNotes?: ImplementationNotes[],
): ImplementationNotes {
  const entityMap = buildEntityMap(spec, findings, parsedSpec);
  const recommendations = buildRecommendations(findings);
  const openQuestions = buildOpenQuestionContexts(spec);
  const crossReferences = buildCrossReferences(spec, findings, parsedSpec);
  const reusablePatterns = buildReusablePatterns(previousNotes);

  return {
    specId: spec.id,
    generatedAt: new Date().toISOString().split("T")[0],
    entityMap,
    recommendations,
    openQuestions,
    crossReferences,
    reusablePatterns,
  };
}

// ── Entity Map Builder ───────────────────────────────────────

function buildEntityMap(
  spec: FeatureSpec,
  findings: AmbiguityFinding[],
  parsedSpec?: ParsedSpec,
): EntityMapEntry[] {
  const yamlModels = new Set(
    parsedSpec ? Object.keys(parsedSpec.models).map((m) => m.toLowerCase()) : [],
  );

  const allScenarioText = spec.scenarios
    .map((s) => `${s.description} ${s.given} ${s.when} ${s.then}`)
    .join(" ")
    .toLowerCase();

  // Collect all entities: declared + implicit
  const entityNames = new Set<string>(spec.entities);

  // Add implicitly detected entities from findings
  const implicitEntities = new Set<string>();
  for (const f of findings) {
    if (f.category === "implicit-entity-detection") {
      const match = f.description.match(/"([^"]+)"/);
      if (match) {
        implicitEntities.add(match[1]);
        entityNames.add(match[1]);
      }
    }
  }

  // Add yaml models not in spec
  if (parsedSpec) {
    for (const model of Object.keys(parsedSpec.models)) {
      entityNames.add(model);
    }
  }

  // Build relationships from entity-relationships findings
  const relationships: EntityRelationship[] = [];
  for (const f of findings) {
    if (f.category === "entity-relationships") {
      const match = f.description.match(/"([^"]+)" and "([^"]+)"/);
      if (match) {
        relationships.push({
          entityA: match[1],
          entityB: match[2],
          type: "co-occurrence",
          evidence: f.description,
        });
      }
      const verbMatch = f.description.match(/Verb pattern "(.+?)"/);
      if (verbMatch) {
        // Extract entity names from the verb pattern finding
        const entities = Array.from(entityNames).filter((e) =>
          f.description.toLowerCase().includes(e.toLowerCase()),
        );
        if (entities.length >= 2) {
          relationships.push({
            entityA: entities[0],
            entityB: entities[1],
            type: "verb-pattern",
            evidence: verbMatch[1],
          });
        }
      }
    }
  }

  // Build entries
  return Array.from(entityNames).map((name) => {
    const entityRelationships = relationships.filter(
      (r) =>
        r.entityA.toLowerCase() === name.toLowerCase() ||
        r.entityB.toLowerCase() === name.toLowerCase(),
    );

    return {
      name,
      relationships: entityRelationships,
      mentionedInScenarios: allScenarioText.includes(name.toLowerCase()),
      definedInYaml: yamlModels.has(name.toLowerCase()),
      implicitlyDetected: implicitEntities.has(name),
    };
  });
}

// ── Recommendations Builder ──────────────────────────────────

function buildRecommendations(
  findings: AmbiguityFinding[],
): ImplementationRecommendation[] {
  const recommendations: ImplementationRecommendation[] = [];

  for (const f of findings) {
    let priority: "high" | "medium" | "low";
    if (HIGH_PRIORITY_CATEGORIES.has(f.category)) {
      priority = "high";
    } else if (MEDIUM_PRIORITY_CATEGORIES.has(f.category)) {
      priority = "medium";
    } else {
      priority = "low";
    }

    recommendations.push({
      category: f.category,
      priority,
      action: f.suggestion,
      context: `${f.description} (${f.location})`,
    });
  }

  // Sort: high first, then medium, then low
  const order = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

  return recommendations;
}

// ── Open Question Context Builder ────────────────────────────

function buildOpenQuestionContexts(
  spec: FeatureSpec,
): OpenQuestionContext[] {
  if (spec.openQuestions.length === 0) return [];

  const stopWords = new Set([
    "about", "should", "would", "could", "there", "their", "which",
    "where", "these", "those", "being", "after", "before", "what",
    "when", "does", "have", "will", "with", "from", "that", "this",
  ]);

  // Build searchable snippets
  const snippetSources: Array<{ label: string; text: string }> = [
    ...spec.scenarios.map((s) => ({
      label: `Scenario ${s.id}`,
      text: `${s.description} ${s.given} ${s.when} ${s.then}`,
    })),
    ...spec.requirements.map((r) => ({
      label: `Requirement ${r.id}`,
      text: r.description,
    })),
    ...spec.successCriteria.map((c, i) => ({
      label: `Criterion ${i + 1}`,
      text: c,
    })),
  ];

  return spec.openQuestions.map((question) => {
    const keywords = question
      .replace(/[?.,!;:'"]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w.toLowerCase()))
      .map((w) => w.toLowerCase());

    // Find related snippets
    const relatedSnippets: string[] = [];
    for (const src of snippetSources) {
      const srcLower = src.text.toLowerCase();
      const matchCount = keywords.filter((kw) => srcLower.includes(kw)).length;
      if (matchCount >= 1) {
        relatedSnippets.push(`[${src.label}] ${src.text.substring(0, 120)}`);
      }
    }

    // Build a suggested answer if there's enough context
    let suggestedAnswer = "";
    if (relatedSnippets.length >= 2) {
      suggestedAnswer = `May be answerable from existing spec — ${relatedSnippets.length} related sections found. Review the matched snippets below.`;
    } else if (relatedSnippets.length === 1) {
      suggestedAnswer = "Partially addressed in spec — review the matched snippet for context.";
    } else {
      suggestedAnswer = "No matching context found in spec — requires external input.";
    }

    return {
      question,
      relatedKeywords: keywords,
      specContextSnippets: relatedSnippets.slice(0, 5),
      suggestedAnswer,
    };
  });
}

// ── Cross-Reference Builder ──────────────────────────────────

function buildCrossReferences(
  spec: FeatureSpec,
  findings: AmbiguityFinding[],
  parsedSpec?: ParsedSpec,
): CrossReferenceNote[] {
  const notes: CrossReferenceNote[] = [];

  // From cross-spec-alignment findings
  for (const f of findings) {
    if (f.category === "cross-spec-alignment") {
      if (f.description.includes("in spec.md but missing from .spec.yaml")) {
        const match = f.description.match(/"([^"]+)"/);
        notes.push({
          type: "missing-in-yaml",
          entity: match?.[1] ?? "unknown",
          details: f.description,
        });
      } else if (f.description.includes("in .spec.yaml but missing from spec.md")) {
        const match = f.description.match(/"([^"]+)"/);
        notes.push({
          type: "missing-in-spec",
          entity: match?.[1] ?? "unknown",
          details: f.description,
        });
      }
    }
  }

  // Add alignment-ok entries for entities that match between spec and yaml
  if (parsedSpec) {
    const yamlModels = new Set(
      Object.keys(parsedSpec.models).map((m) => m.toLowerCase()),
    );
    for (const entity of spec.entities) {
      if (yamlModels.has(entity.toLowerCase())) {
        notes.push({
          type: "alignment-ok",
          entity,
          details: `"${entity}" exists in both spec.md and .spec.yaml`,
        });
      }
    }
  }

  return notes;
}

// ── Reusable Patterns Builder ────────────────────────────────

function buildReusablePatterns(
  previousNotes?: ImplementationNotes[],
): ReusablePattern[] {
  if (!previousNotes || previousNotes.length === 0) return [];

  const patterns: ReusablePattern[] = [];
  const seen = new Set<string>();

  for (const notes of previousNotes) {
    // Extract high-priority recommendations as reusable patterns
    const highPriority = notes.recommendations.filter((r) => r.priority === "high");
    for (const rec of highPriority) {
      const key = `${rec.category}:${rec.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        patterns.push({
          specId: notes.specId,
          pattern: rec.action,
          category: rec.category,
        });
      }
    }
  }

  return patterns;
}

// ── Markdown Generator ───────────────────────────────────────

/**
 * Generate implementation.md markdown from structured notes.
 */
export function generateImplementationMarkdown(
  notes: ImplementationNotes,
): string {
  let md = `# Implementation Notes: ${notes.specId}\n\n`;
  md += `> Generated: ${notes.generatedAt}\n`;
  md += `> Source: clarify scan results\n\n`;

  // ── Entity Map ──
  md += `## Entity Map\n\n`;
  if (notes.entityMap.length === 0) {
    md += `_No entities detected._\n\n`;
  } else {
    md += `| Entity | In YAML | Implicit | Scenarios | Relationships |\n`;
    md += `|--------|---------|----------|-----------|---------------|\n`;
    for (const entry of notes.entityMap) {
      const inYaml = entry.definedInYaml ? "Yes" : "No";
      const implicit = entry.implicitlyDetected ? "Yes" : "No";
      const scenarios = entry.mentionedInScenarios ? "Yes" : "No";
      const relCount = entry.relationships.length;
      md += `| **${entry.name}** | ${inYaml} | ${implicit} | ${scenarios} | ${relCount} |\n`;
    }
    md += `\n`;

    // Discovered relationships
    const allRels = notes.entityMap.flatMap((e) => e.relationships);
    const seen = new Set<string>();
    const uniqueRels: EntityRelationship[] = [];
    for (const rel of allRels) {
      const key = [rel.entityA, rel.entityB].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRels.push(rel);
      }
    }

    if (uniqueRels.length > 0) {
      md += `### Discovered Relationships\n\n`;
      for (const rel of uniqueRels) {
        md += `- **${rel.entityA}** <-> **${rel.entityB}** (${rel.type}) — ${rel.evidence}\n`;
      }
      md += `\n`;
    }
  }

  // ── Recommendations ──
  md += `## Implementation Recommendations\n\n`;
  if (notes.recommendations.length === 0) {
    md += `_No actionable recommendations._\n\n`;
  } else {
    const grouped: Record<string, ImplementationRecommendation[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const rec of notes.recommendations) {
      grouped[rec.priority].push(rec);
    }

    const labels: Record<string, string> = {
      high: "High Priority",
      medium: "Medium Priority",
      low: "Low Priority",
    };

    for (const priority of ["high", "medium", "low"] as const) {
      if (grouped[priority].length === 0) continue;
      md += `### ${labels[priority]}\n\n`;
      for (const rec of grouped[priority]) {
        md += `- **[${rec.category}]** ${rec.action} — ${rec.context}\n`;
      }
      md += `\n`;
    }
  }

  // ── Open Questions ──
  md += `## Open Questions & Context\n\n`;
  if (notes.openQuestions.length === 0) {
    md += `_No open questions in spec._\n\n`;
  } else {
    for (let i = 0; i < notes.openQuestions.length; i++) {
      const q = notes.openQuestions[i];
      md += `### Q${i + 1}: ${q.question}\n\n`;
      md += `**Keywords:** ${q.relatedKeywords.join(", ") || "none"}\n\n`;
      if (q.specContextSnippets.length > 0) {
        md += `**Related Spec Snippets:**\n`;
        for (const snippet of q.specContextSnippets) {
          md += `- ${snippet}\n`;
        }
        md += `\n`;
      }
      md += `**Suggested Answer:** ${q.suggestedAnswer}\n\n`;
    }
  }

  // ── Cross-References ──
  md += `## Cross-Reference Notes\n\n`;
  if (notes.crossReferences.length === 0) {
    md += `_No .spec.yaml available for cross-referencing._\n\n`;
  } else {
    md += `| Entity | Status | Details |\n`;
    md += `|--------|--------|---------|\n`;
    for (const ref of notes.crossReferences) {
      const statusLabel =
        ref.type === "alignment-ok"
          ? "Aligned"
          : ref.type === "missing-in-yaml"
            ? "Missing in YAML"
            : "Missing in Spec";
      md += `| **${ref.entity}** | ${statusLabel} | ${ref.details} |\n`;
    }
    md += `\n`;
  }

  // ── Reusable Patterns ──
  md += `## Reference for Next Spec\n\n`;
  if (notes.reusablePatterns.length === 0) {
    md += `_No previous implementation notes found._\n\n`;
  } else {
    md += `| Source Spec | Category | Pattern |\n`;
    md += `|------------|----------|---------|\n`;
    for (const p of notes.reusablePatterns) {
      md += `| ${p.specId} | ${p.category} | ${p.pattern} |\n`;
    }
    md += `\n`;
  }

  return md;
}
