import type {
  FeatureSpec,
  ReviewDimension,
  ReviewFinding,
  DimensionScore,
  ReviewVerdict,
  ReviewReport,
  ReviewOptions,
  Severity,
} from "./types.js";
import { scanForAmbiguities } from "./ambiguity.js";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function finding(
  dimension: ReviewDimension,
  severity: Severity,
  message: string,
  suggestion: string,
  location?: string
): ReviewFinding {
  return { dimension, severity, message, suggestion, location };
}

const VAGUE_TERMS = [
  "should work",
  "reasonable",
  "fast enough",
  "appropriate",
  "as needed",
  "properly",
  "correctly",
  "good enough",
  "adequate",
];

// ──────────────────────────────────────────────────────────────
// A. Completeness (0–20)
// ──────────────────────────────────────────────────────────────

function scoreCompleteness(spec: FeatureSpec): DimensionScore {
  const dim: ReviewDimension = "completeness";
  let score = 0;
  const findings: ReviewFinding[] = [];

  // Has ≥1 scenario (3 pts)
  if (spec.scenarios.length >= 1) {
    score += 3;
  } else {
    findings.push(finding(dim, "CRITICAL", "No user scenarios defined.", "Add at least one Given-When-Then scenario.", "User Scenarios"));
  }

  // Has ≥3 scenarios (2 pts)
  if (spec.scenarios.length >= 3) {
    score += 2;
  } else if (spec.scenarios.length >= 1) {
    findings.push(finding(dim, "MEDIUM", `Only ${spec.scenarios.length} scenario(s) defined.`, "Add more scenarios to cover primary, secondary, and edge case flows.", "User Scenarios"));
  }

  // Has ≥1 requirement (3 pts)
  if (spec.requirements.length >= 1) {
    score += 3;
  } else {
    findings.push(finding(dim, "CRITICAL", "No functional requirements defined.", "Add at least one FR-NNN requirement.", "Functional Requirements"));
  }

  // Has ≥3 requirements (2 pts)
  if (spec.requirements.length >= 3) {
    score += 2;
  } else if (spec.requirements.length >= 1) {
    findings.push(finding(dim, "MEDIUM", `Only ${spec.requirements.length} requirement(s) defined.`, "Add more requirements for comprehensive coverage.", "Functional Requirements"));
  }

  // Has ≥1 entity (2 pts)
  if (spec.entities.length >= 1) {
    score += 2;
  } else {
    findings.push(finding(dim, "HIGH", "No key entities defined.", "Add domain entities in the Key Entities section.", "Key Entities"));
  }

  // Has ≥2 success criteria (2 pts)
  if (spec.successCriteria.length >= 2) {
    score += 2;
  } else {
    findings.push(finding(dim, "HIGH", `Only ${spec.successCriteria.length} success criteria defined.`, "Add at least 2 measurable success criteria.", "Success Criteria"));
  }

  // Has ≥3 edge cases (2 pts)
  if (spec.edgeCases.length >= 3) {
    score += 2;
  } else {
    findings.push(finding(dim, "MEDIUM", `Only ${spec.edgeCases.length} edge case(s) defined.`, "Add at least 3 edge cases covering boundary conditions.", "Edge Cases"));
  }

  // All scenarios have Given/When/Then (2 pts)
  const incompleteScenarios = spec.scenarios.filter(
    (s) => !s.given || !s.when || !s.then
  );
  if (incompleteScenarios.length === 0 && spec.scenarios.length > 0) {
    score += 2;
  } else if (incompleteScenarios.length > 0) {
    findings.push(finding(dim, "HIGH", `${incompleteScenarios.length} scenario(s) missing Given/When/Then clauses.`, "Complete all scenarios with Given, When, and Then clauses.", "User Scenarios"));
  }

  // Has at least 1 P1 scenario (2 pts)
  if (spec.scenarios.some((s) => s.priority === "P1")) {
    score += 2;
  } else if (spec.scenarios.length > 0) {
    findings.push(finding(dim, "HIGH", "No P1 (critical priority) scenarios found.", "Mark at least one must-have scenario as P1.", "User Scenarios"));
  }

  return {
    dimension: dim,
    score,
    maxScore: 20,
    findings,
    summary: score >= 16 ? "Spec sections are well-populated." : score >= 10 ? "Some sections need more content." : "Major sections are missing or incomplete.",
  };
}

// ──────────────────────────────────────────────────────────────
// B. Clarity (0–20)
// ──────────────────────────────────────────────────────────────

function scoreClarity(spec: FeatureSpec, content: string): DimensionScore {
  const dim: ReviewDimension = "clarity";
  let score = 0;
  const findings: ReviewFinding[] = [];

  const ambiguities = scanForAmbiguities(content);
  const placeholderFindings = ambiguities.filter((a) => a.category === "placeholder-text");
  const ambiguousTermFindings = ambiguities.filter((a) => a.category === "ambiguous-terminology");

  // No placeholder text (4 pts)
  if (placeholderFindings.length === 0) {
    score += 4;
  } else {
    const deduction = Math.min(4, placeholderFindings.length);
    score += Math.max(0, 4 - deduction);
    findings.push(finding(dim, "HIGH", `${placeholderFindings.length} placeholder text instance(s) found (TODO, TBD, etc.).`, "Replace all placeholder text with concrete content.", "Content"));
  }

  // No ambiguous terminology (3 pts)
  if (ambiguousTermFindings.length === 0) {
    score += 3;
  } else {
    const deduction = Math.min(3, ambiguousTermFindings.length);
    score += Math.max(0, 3 - deduction);
    findings.push(finding(dim, "MEDIUM", `${ambiguousTermFindings.length} ambiguous term(s) found.`, "Replace vague terms with specific language.", "Content"));
  }

  // Scenarios have specific clauses ≥5 words each (4 pts)
  const shortClauses = spec.scenarios.filter(
    (s) => wordCount(s.given) < 5 || wordCount(s.when) < 5 || wordCount(s.then) < 5
  );
  if (shortClauses.length === 0 && spec.scenarios.length > 0) {
    score += 4;
  } else if (spec.scenarios.length > 0) {
    const ratio = shortClauses.length / spec.scenarios.length;
    score += Math.max(0, Math.round(4 * (1 - ratio)));
    findings.push(finding(dim, "MEDIUM", `${shortClauses.length} scenario(s) have short Given/When/Then clauses (< 5 words).`, "Make scenario clauses more descriptive (at least 5 words each).", "User Scenarios"));
  }

  // Requirements have adequate descriptions ≥8 words (3 pts)
  const shortReqs = spec.requirements.filter((r) => wordCount(r.description) < 8);
  if (shortReqs.length === 0 && spec.requirements.length > 0) {
    score += 3;
  } else if (spec.requirements.length > 0) {
    const ratio = shortReqs.length / spec.requirements.length;
    score += Math.max(0, Math.round(3 * (1 - ratio)));
    findings.push(finding(dim, "MEDIUM", `${shortReqs.length} requirement(s) have short descriptions (< 8 words).`, "Expand requirement descriptions to be more specific.", "Functional Requirements"));
  }

  // Entity definitions include descriptions (3 pts)
  const entityDescPattern = /\*\*\w+.*?\*\*\s*[—–-]/g;
  const entityDescs = content.match(entityDescPattern) ?? [];
  if (spec.entities.length > 0 && entityDescs.length >= spec.entities.length) {
    score += 3;
  } else if (spec.entities.length > 0) {
    const missing = spec.entities.length - entityDescs.length;
    if (missing > 0) {
      score += Math.max(0, Math.round(3 * (entityDescs.length / spec.entities.length)));
      findings.push(finding(dim, "LOW", `${missing} entity/entities missing descriptions.`, "Add descriptions using the **Name** — description format.", "Key Entities"));
    } else {
      score += 3;
    }
  }

  // Few/no open questions (3 pts)
  if (spec.openQuestions.length === 0) {
    score += 3;
  } else if (spec.openQuestions.length <= 2) {
    score += 1;
    findings.push(finding(dim, "LOW", `${spec.openQuestions.length} open question(s) remain.`, "Resolve open questions before implementation.", "Open Questions"));
  } else {
    findings.push(finding(dim, "MEDIUM", `${spec.openQuestions.length} open questions remain unresolved.`, "Resolve open questions to improve spec clarity.", "Open Questions"));
  }

  return {
    dimension: dim,
    score,
    maxScore: 20,
    findings,
    summary: score >= 16 ? "Spec language is clear and specific." : score >= 10 ? "Some areas need clearer descriptions." : "Significant clarity issues found.",
  };
}

// ──────────────────────────────────────────────────────────────
// C. Testability (0–20)
// ──────────────────────────────────────────────────────────────

function scoreTestability(spec: FeatureSpec): DimensionScore {
  const dim: ReviewDimension = "testability";
  let score = 0;
  const findings: ReviewFinding[] = [];

  const measurablePattern = /\d+|under|below|above|at least|at most|%|ms|seconds?|minutes?/i;

  // Success criteria are measurable (5 pts)
  const measurableCriteria = spec.successCriteria.filter((c) => measurablePattern.test(c));
  if (spec.successCriteria.length > 0) {
    const ratio = measurableCriteria.length / spec.successCriteria.length;
    const pts = Math.round(5 * ratio);
    score += pts;
    if (pts < 5) {
      const nonMeasurable = spec.successCriteria.length - measurableCriteria.length;
      findings.push(finding(dim, "HIGH", `${nonMeasurable} success criteria lack measurable targets.`, "Add specific numbers, thresholds, or comparisons to success criteria.", "Success Criteria"));
    }
  } else {
    findings.push(finding(dim, "CRITICAL", "No success criteria defined.", "Add measurable success criteria.", "Success Criteria"));
  }

  // Scenarios have concrete Then clauses ≥5 words, no vague terms (5 pts)
  const vagueThens = spec.scenarios.filter((s) => {
    if (wordCount(s.then) < 5) return true;
    return VAGUE_TERMS.some((v) => s.then.toLowerCase().includes(v));
  });
  if (spec.scenarios.length > 0) {
    const ratio = 1 - vagueThens.length / spec.scenarios.length;
    const pts = Math.round(5 * ratio);
    score += pts;
    if (vagueThens.length > 0) {
      findings.push(finding(dim, "MEDIUM", `${vagueThens.length} scenario(s) have vague or short Then clauses.`, "Make Then clauses specific and verifiable.", "User Scenarios"));
    }
  }

  // Each requirement maps to ≥1 scenario (4 pts)
  const unmappedReqs = spec.requirements.filter(
    (r) => !r.scenarios || r.scenarios.length === 0
  );
  if (spec.requirements.length > 0) {
    const ratio = 1 - unmappedReqs.length / spec.requirements.length;
    const pts = Math.round(4 * ratio);
    score += pts;
    if (unmappedReqs.length > 0) {
      findings.push(finding(dim, "MEDIUM", `${unmappedReqs.length} requirement(s) not mapped to any scenario.`, "Link requirements to scenarios for traceability.", "Functional Requirements"));
    }
  }

  // Edge cases are actionable ≥5 words, conditional language (3 pts)
  const actionableEdgeCases = spec.edgeCases.filter(
    (e) => wordCount(e) >= 5 && /\b(when|if|while|during|after|before)\b/i.test(e)
  );
  if (spec.edgeCases.length > 0) {
    const ratio = actionableEdgeCases.length / spec.edgeCases.length;
    const pts = Math.round(3 * ratio);
    score += pts;
    if (pts < 3) {
      findings.push(finding(dim, "LOW", "Some edge cases lack conditional language or are too brief.", "Use 'when/if' phrasing and provide enough detail to be actionable.", "Edge Cases"));
    }
  }

  // No vague terms in success criteria (3 pts)
  const vagueSuccessCriteria = spec.successCriteria.filter((c) =>
    VAGUE_TERMS.some((v) => c.toLowerCase().includes(v))
  );
  if (vagueSuccessCriteria.length === 0 && spec.successCriteria.length > 0) {
    score += 3;
  } else if (vagueSuccessCriteria.length > 0) {
    findings.push(finding(dim, "HIGH", `${vagueSuccessCriteria.length} success criteria contain vague terms.`, "Replace vague language with measurable targets.", "Success Criteria"));
  }

  return {
    dimension: dim,
    score,
    maxScore: 20,
    findings,
    summary: score >= 16 ? "Requirements are verifiable and testable." : score >= 10 ? "Some areas could be more testable." : "Many requirements lack testable criteria.",
  };
}

// ──────────────────────────────────────────────────────────────
// D. Feasibility (0–20)
// ──────────────────────────────────────────────────────────────

function scoreFeasibility(spec: FeatureSpec): DimensionScore {
  const dim: ReviewDimension = "feasibility";
  let score = 0;
  const findings: ReviewFinding[] = [];

  // Reasonable requirement count ≤15 (4 pts)
  if (spec.requirements.length <= 15) {
    score += 4;
  } else {
    findings.push(finding(dim, "HIGH", `${spec.requirements.length} requirements is excessive for a single feature.`, "Consider splitting into multiple feature specs.", "Functional Requirements"));
  }

  // Reasonable scenario count ≤20 (3 pts)
  if (spec.scenarios.length <= 20) {
    score += 3;
  } else {
    findings.push(finding(dim, "HIGH", `${spec.scenarios.length} scenarios is excessive for a single feature.`, "Consider splitting into multiple feature specs.", "User Scenarios"));
  }

  // No contradictory requirements (4 pts)
  const contradictionPairs = [
    ["real-time", "batch"],
    ["synchronous", "asynchronous"],
    ["public", "private"],
    ["online", "offline"],
    ["stateless", "stateful"],
  ];
  let contradictions = 0;
  const reqTexts = spec.requirements.map((r) => r.description.toLowerCase());
  const allReqText = reqTexts.join(" ");
  for (const [a, b] of contradictionPairs) {
    if (allReqText.includes(a) && allReqText.includes(b)) {
      contradictions++;
      findings.push(finding(dim, "HIGH", `Potentially contradictory terms: "${a}" vs "${b}" in requirements.`, "Clarify whether both are intentional or if one should be removed.", "Functional Requirements"));
    }
  }
  if (contradictions === 0) {
    score += 4;
  } else {
    score += Math.max(0, 4 - contradictions * 2);
  }

  // Edge cases cover error conditions (3 pts)
  const errorKeywords = /\b(error|fail|invalid|timeout|missing|empty|null|unauthorized|forbidden|overflow|duplicate)\b/i;
  const errorEdgeCases = spec.edgeCases.filter((e) => errorKeywords.test(e));
  if (errorEdgeCases.length >= 2) {
    score += 3;
  } else if (errorEdgeCases.length === 1) {
    score += 2;
    findings.push(finding(dim, "LOW", "Only 1 edge case covers error conditions.", "Add more error-condition edge cases (timeout, invalid input, etc.).", "Edge Cases"));
  } else if (spec.edgeCases.length > 0) {
    findings.push(finding(dim, "MEDIUM", "No edge cases cover error conditions.", "Add edge cases for error, failure, and invalid input scenarios.", "Edge Cases"));
  }

  // Requirements don't reference undefined entities (3 pts)
  if (spec.entities.length > 0 && spec.requirements.length > 0) {
    // Look for capitalized words in requirements that could be entity references
    const entitySet = new Set(spec.entities.map((e) => e.toLowerCase()));
    let allReferencesValid = true;
    // This checks that entity mentions in requirements actually match defined entities
    // We check the reverse: requirements mentioning known entities is a plus
    const reqsReferencingEntities = spec.requirements.filter((r) =>
      spec.entities.some((e) => r.description.toLowerCase().includes(e.toLowerCase()))
    );
    if (reqsReferencingEntities.length > 0 || spec.entities.length > 0) {
      score += 3;
    }
  } else {
    score += 3; // No entities to check against, pass by default
  }

  // Status appropriate for content level (3 pts)
  if (spec.status === "planned" && spec.openQuestions.length > 2) {
    findings.push(finding(dim, "MEDIUM", "Status is 'planned' but has many open questions.", "Resolve open questions or change status to 'draft'.", "Status"));
  } else {
    score += 3;
  }

  return {
    dimension: dim,
    score,
    maxScore: 20,
    findings,
    summary: score >= 16 ? "Scope is realistic and well-bounded." : score >= 10 ? "Some feasibility concerns to address." : "Scope or consistency concerns need attention.",
  };
}

// ──────────────────────────────────────────────────────────────
// E. Consistency (0–20)
// ──────────────────────────────────────────────────────────────

function scoreConsistency(spec: FeatureSpec): DimensionScore {
  const dim: ReviewDimension = "consistency";
  let score = 0;
  const findings: ReviewFinding[] = [];

  // Entity names appear in scenarios (5 pts)
  if (spec.entities.length > 0 && spec.scenarios.length > 0) {
    const scenarioText = spec.scenarios
      .map((s) => `${s.description} ${s.given} ${s.when} ${s.then}`)
      .join(" ")
      .toLowerCase();
    const referencedEntities = spec.entities.filter((e) => {
      const pattern = new RegExp(`\\b${e.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return pattern.test(scenarioText);
    });
    const ratio = referencedEntities.length / spec.entities.length;
    const pts = Math.round(5 * ratio);
    score += pts;
    if (pts < 5) {
      const unreferenced = spec.entities.filter((e) => !referencedEntities.includes(e));
      findings.push(finding(dim, "MEDIUM", `Entity/entities not referenced in scenarios: ${unreferenced.join(", ")}.`, "Ensure all entities appear in at least one scenario.", "Key Entities / User Scenarios"));
    }
  } else if (spec.entities.length === 0) {
    findings.push(finding(dim, "HIGH", "No entities defined to cross-reference.", "Add key entities for consistency checking.", "Key Entities"));
  } else {
    score += 5;
  }

  // Requirements reference valid scenario IDs (4 pts)
  if (spec.requirements.length > 0) {
    const validScenarioIds = new Set(spec.scenarios.map((s) => s.id));
    const reqsWithScenarios = spec.requirements.filter(
      (r) => r.scenarios && r.scenarios.length > 0
    );
    if (reqsWithScenarios.length === 0) {
      findings.push(finding(dim, "MEDIUM", "No requirements have scenario mappings.", "Link requirements to scenarios using scenario IDs.", "Functional Requirements"));
    } else {
      const invalidRefs = reqsWithScenarios.filter((r) =>
        r.scenarios.some((sid) => !validScenarioIds.has(sid))
      );
      if (invalidRefs.length === 0) {
        score += 4;
      } else {
        findings.push(finding(dim, "HIGH", `${invalidRefs.length} requirement(s) reference invalid scenario IDs.`, "Fix scenario ID references in requirements.", "Functional Requirements"));
        score += Math.max(0, Math.round(4 * (1 - invalidRefs.length / reqsWithScenarios.length)));
      }
    }
  }

  // P1 scenarios have corresponding requirements (4 pts)
  const p1Scenarios = spec.scenarios.filter((s) => s.priority === "P1");
  if (p1Scenarios.length > 0 && spec.requirements.length > 0) {
    const reqScenarioIds = new Set(spec.requirements.flatMap((r) => r.scenarios ?? []));
    const coveredP1 = p1Scenarios.filter((s) => reqScenarioIds.has(s.id));
    if (coveredP1.length === p1Scenarios.length) {
      score += 4;
    } else if (reqScenarioIds.size === 0) {
      // No scenario mappings at all — check by keyword overlap instead
      const reqText = spec.requirements.map((r) => r.description.toLowerCase()).join(" ");
      const p1Covered = p1Scenarios.filter((s) => {
        const keywords = s.description.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
        return keywords.some((kw) => reqText.includes(kw));
      });
      const ratio = p1Covered.length / p1Scenarios.length;
      score += Math.round(4 * ratio);
      if (ratio < 1) {
        findings.push(finding(dim, "HIGH", "Some P1 scenarios may not have corresponding requirements.", "Ensure every P1 scenario has at least one backing requirement.", "User Scenarios / Functional Requirements"));
      }
    } else {
      const ratio = coveredP1.length / p1Scenarios.length;
      score += Math.round(4 * ratio);
      findings.push(finding(dim, "HIGH", `${p1Scenarios.length - coveredP1.length} P1 scenario(s) not covered by any requirement.`, "Ensure every P1 scenario has at least one backing requirement.", "User Scenarios / Functional Requirements"));
    }
  } else if (p1Scenarios.length === 0) {
    // No P1 scenarios at all — already flagged in completeness
    score += 4;
  } else {
    score += 4;
  }

  // Success criteria keyword overlap with scenarios (4 pts)
  if (spec.successCriteria.length > 0 && spec.scenarios.length > 0) {
    const scenarioTokens = new Set(
      spec.scenarios
        .flatMap((s) => `${s.description} ${s.given} ${s.when} ${s.then}`.toLowerCase().split(/\s+/))
        .filter((w) => w.length > 4)
    );
    const criteriaWithOverlap = spec.successCriteria.filter((c) => {
      const tokens = c.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      return tokens.some((t) => scenarioTokens.has(t));
    });
    const ratio = criteriaWithOverlap.length / spec.successCriteria.length;
    const pts = Math.round(4 * ratio);
    score += pts;
    if (pts < 4) {
      findings.push(finding(dim, "LOW", "Some success criteria have little keyword overlap with scenarios.", "Ensure success criteria relate to defined scenarios.", "Success Criteria / User Scenarios"));
    }
  } else {
    score += 4;
  }

  // Edge cases reference known entities/concepts (3 pts)
  if (spec.edgeCases.length > 0 && spec.entities.length > 0) {
    const edgeCaseText = spec.edgeCases.join(" ").toLowerCase();
    const referencedInEdge = spec.entities.filter((e) =>
      edgeCaseText.includes(e.toLowerCase())
    );
    if (referencedInEdge.length > 0) {
      score += 3;
    } else {
      score += 1; // Some credit for having edge cases
      findings.push(finding(dim, "LOW", "Edge cases don't reference any defined entities.", "Tie edge cases to specific entities for traceability.", "Edge Cases / Key Entities"));
    }
  } else {
    score += 3;
  }

  return {
    dimension: dim,
    score,
    maxScore: 20,
    findings,
    summary: score >= 16 ? "Sections cross-reference each other well." : score >= 10 ? "Some cross-reference gaps found." : "Significant consistency gaps between sections.",
  };
}

// ──────────────────────────────────────────────────────────────
// Main entry
// ──────────────────────────────────────────────────────────────

const ALL_SCORERS: Record<ReviewDimension, (spec: FeatureSpec, content: string) => DimensionScore> = {
  completeness: (spec) => scoreCompleteness(spec),
  clarity: (spec, content) => scoreClarity(spec, content),
  testability: (spec) => scoreTestability(spec),
  feasibility: (spec) => scoreFeasibility(spec),
  consistency: (spec) => scoreConsistency(spec),
};

function getVerdict(totalScore: number, strict: boolean): ReviewVerdict {
  if (strict) {
    if (totalScore >= 90) return "EXCELLENT";
    if (totalScore >= 75) return "GOOD";
    if (totalScore >= 55) return "NEEDS_WORK";
    return "POOR";
  }
  if (totalScore >= 80) return "EXCELLENT";
  if (totalScore >= 60) return "GOOD";
  if (totalScore >= 40) return "NEEDS_WORK";
  return "POOR";
}

export function reviewSpec(
  spec: FeatureSpec,
  content: string,
  options?: ReviewOptions
): ReviewReport {
  const focus = options?.focus;
  const strict = options?.strict ?? false;

  const dimensionsToScore: ReviewDimension[] = focus && focus.length > 0
    ? focus
    : ["completeness", "clarity", "testability", "feasibility", "consistency"];

  const dimensions: DimensionScore[] = dimensionsToScore.map((dim) =>
    ALL_SCORERS[dim](spec, content)
  );

  // If focusing on specific dimensions, scale total score proportionally
  const rawTotal = dimensions.reduce((sum, d) => sum + d.score, 0);
  const maxPossible = dimensions.length * 20;
  const totalScore = Math.round((rawTotal / maxPossible) * 100);

  const verdict = getVerdict(totalScore, strict);

  // Collect top suggestions from highest-severity findings
  const allFindings = dimensions.flatMap((d) => d.findings);
  const severityOrder: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const topSuggestions = allFindings
    .slice(0, 5)
    .map((f) => f.suggestion);

  return {
    specId: spec.id,
    generatedAt: new Date().toISOString().split("T")[0],
    totalScore,
    verdict,
    dimensions,
    topSuggestions,
  };
}

// ──────────────────────────────────────────────────────────────
// Markdown generation
// ──────────────────────────────────────────────────────────────

const VERDICT_BANNERS: Record<ReviewVerdict, string> = {
  EXCELLENT: "EXCELLENT — Spec is well-defined and ready for implementation.",
  GOOD: "GOOD — Spec is solid with minor improvements possible.",
  NEEDS_WORK: "NEEDS WORK — Several areas require attention before implementation.",
  POOR: "POOR — Spec needs significant improvement across multiple dimensions.",
};

export function generateReviewMarkdown(report: ReviewReport): string {
  let md = `# Review Report: ${report.specId}\n\n`;
  md += `> Generated: ${report.generatedAt}\n\n`;

  // Verdict banner
  md += `## Verdict: ${report.verdict}\n\n`;
  md += `**${VERDICT_BANNERS[report.verdict]}**\n\n`;
  md += `**Total Score: ${report.totalScore}/100**\n\n`;

  // Score table
  md += `## Dimension Scores\n\n`;
  md += `| Dimension | Score | Max | Summary |\n`;
  md += `|-----------|------:|----:|:--------|\n`;
  for (const dim of report.dimensions) {
    md += `| ${dim.dimension.charAt(0).toUpperCase() + dim.dimension.slice(1)} | ${dim.score} | ${dim.maxScore} | ${dim.summary} |\n`;
  }
  md += `\n`;

  // Findings by dimension
  md += `## Findings\n\n`;
  for (const dim of report.dimensions) {
    if (dim.findings.length === 0) continue;
    md += `### ${dim.dimension.charAt(0).toUpperCase() + dim.dimension.slice(1)}\n\n`;
    for (const f of dim.findings) {
      md += `- **[${f.severity}]** ${f.message}\n`;
      if (f.location) {
        md += `  - Location: ${f.location}\n`;
      }
      md += `  - Suggestion: ${f.suggestion}\n\n`;
    }
  }

  // Top suggestions
  if (report.topSuggestions.length > 0) {
    md += `## Top Suggestions\n\n`;
    for (let i = 0; i < report.topSuggestions.length; i++) {
      md += `${i + 1}. ${report.topSuggestions[i]}\n`;
    }
    md += `\n`;
  }

  return md;
}
