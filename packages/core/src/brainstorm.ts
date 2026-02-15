import type {
  FeatureSpec,
  Plan,
  CompetitorInfo,
  FeatureGap,
  ValueAddSuggestion,
  BrainstormReport,
  CompetitorComparisonRow,
  Priority,
} from "./types.js";

// ──────────────────────────────────────────────────────────────
// Commonly missing patterns for offline heuristic analysis
// ──────────────────────────────────────────────────────────────

const COMMON_PATTERNS: Array<{
  feature: string;
  keywords: string[];
  relevance: "high" | "medium" | "low";
  recommendation: string;
}> = [
  {
    feature: "Pagination",
    keywords: ["paginate", "pagination", "page", "offset", "cursor", "limit"],
    relevance: "high",
    recommendation: "Add cursor-based or offset pagination for list endpoints to handle large datasets.",
  },
  {
    feature: "Search & Filtering",
    keywords: ["search", "filter", "query", "find", "lookup"],
    relevance: "high",
    recommendation: "Add full-text search and field-based filtering for better data discovery.",
  },
  {
    feature: "Caching",
    keywords: ["cache", "caching", "redis", "memoize", "ttl"],
    relevance: "medium",
    recommendation: "Implement caching layer (in-memory or Redis) for frequently accessed data.",
  },
  {
    feature: "Rate Limiting",
    keywords: ["rate limit", "throttle", "rate-limit", "ratelimit"],
    relevance: "high",
    recommendation: "Add rate limiting to protect APIs from abuse and ensure fair usage.",
  },
  {
    feature: "Internationalization (i18n)",
    keywords: ["i18n", "internationalization", "locale", "translation", "language"],
    relevance: "low",
    recommendation: "Consider i18n support for multi-language user interfaces and messages.",
  },
  {
    feature: "Audit Logging",
    keywords: ["audit", "audit log", "activity log", "history", "tracking"],
    relevance: "medium",
    recommendation: "Add audit logging to track who changed what and when for compliance.",
  },
  {
    feature: "Webhooks",
    keywords: ["webhook", "callback", "hook", "event notification"],
    relevance: "medium",
    recommendation: "Expose webhooks so external systems can react to events in real-time.",
  },
  {
    feature: "Export/Import",
    keywords: ["export", "import", "csv", "excel", "download", "upload", "bulk"],
    relevance: "medium",
    recommendation: "Add data export (CSV/JSON) and bulk import capabilities.",
  },
  {
    feature: "Soft Delete",
    keywords: ["soft delete", "archive", "trash", "recycle", "restore"],
    relevance: "medium",
    recommendation: "Use soft delete instead of hard delete to allow data recovery.",
  },
  {
    feature: "Versioning",
    keywords: ["version", "versioning", "revision", "changelog"],
    relevance: "low",
    recommendation: "Add API versioning and/or data versioning for backward compatibility.",
  },
  {
    feature: "Health Check",
    keywords: ["health", "healthcheck", "status", "ping", "readiness", "liveness"],
    relevance: "high",
    recommendation: "Add health check endpoints for monitoring and container orchestration.",
  },
  {
    feature: "Batch Operations",
    keywords: ["batch", "bulk", "mass", "multi"],
    relevance: "medium",
    recommendation: "Support batch create/update/delete to reduce API round-trips.",
  },
  {
    feature: "Notification System",
    keywords: ["notification", "notify", "alert", "email", "push", "sms"],
    relevance: "medium",
    recommendation: "Add a notification system for user-facing alerts (email, push, in-app).",
  },
  {
    feature: "Role-Based Access Control",
    keywords: ["rbac", "role", "permission", "access control", "acl"],
    relevance: "high",
    recommendation: "Implement RBAC for fine-grained authorization beyond basic auth levels.",
  },
  {
    feature: "File Upload/Storage",
    keywords: ["upload", "file", "attachment", "media", "image", "storage", "s3"],
    relevance: "medium",
    recommendation: "Add file upload and cloud storage integration for media/documents.",
  },
  {
    feature: "Real-time Updates",
    keywords: ["realtime", "real-time", "websocket", "sse", "live", "push"],
    relevance: "low",
    recommendation: "Consider WebSocket or SSE for real-time data updates.",
  },
];

/**
 * Extract search keywords from a spec and plan for competitor research.
 */
export function extractSearchKeywords(spec: FeatureSpec, plan: Plan): string[] {
  const keywords = new Set<string>();

  // From spec name (split into meaningful words)
  const nameWords = spec.name
    .split(/[\s-]+/)
    .filter((w) => w.length > 2)
    .map((w) => w.toLowerCase());
  for (const w of nameWords) keywords.add(w);

  // Full name as a phrase
  keywords.add(spec.name.toLowerCase());

  // From entities
  for (const entity of spec.entities) {
    keywords.add(entity.toLowerCase());
  }

  // From requirements (extract key nouns)
  for (const req of spec.requirements) {
    const words = req.description
      .split(/[\s,.()/]+/)
      .filter((w) => w.length > 3)
      .map((w) => w.toLowerCase())
      .filter((w) => !STOP_WORDS.has(w));
    for (const w of words) keywords.add(w);
  }

  // From scenarios
  for (const s of spec.scenarios) {
    const words = s.description
      .split(/[\s,.()/]+/)
      .filter((w) => w.length > 3)
      .map((w) => w.toLowerCase())
      .filter((w) => !STOP_WORDS.has(w));
    for (const w of words) keywords.add(w);
  }

  // From plan tech context
  for (const ctx of plan.techContext) {
    if (ctx.startsWith("Feature:")) {
      continue; // Skip feature name (already included)
    }
    if (ctx.startsWith("Entities:")) {
      continue; // Already included
    }
  }

  return Array.from(keywords);
}

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "have", "will",
  "should", "must", "when", "then", "given", "they", "their", "user",
  "users", "system", "data", "into", "also", "each", "been", "being",
  "does", "done", "doing", "make", "made", "could", "would", "about",
  "more", "some", "other", "than", "only", "very", "just", "over",
  "such", "take", "takes", "action", "perform", "performs", "primary",
  "implements", "implement", "existing", "feature", "functionality",
]);

/**
 * Analyze features for gaps between spec and competitors.
 * Works in offline mode with 0 competitors using heuristic analysis.
 */
export function analyzeFeaturesForGaps(
  spec: FeatureSpec,
  plan: Plan,
  competitors: CompetitorInfo[]
): FeatureGap[] {
  const gaps: FeatureGap[] = [];

  // Combine all spec text for keyword matching
  const specText = buildSpecText(spec, plan);

  // Check each common pattern against the spec
  for (const pattern of COMMON_PATTERNS) {
    const isInSpec = pattern.keywords.some((kw) =>
      specText.includes(kw.toLowerCase())
    );

    if (!isInSpec) {
      // Check if any competitor has this feature
      const competitorsWithFeature = competitors.filter((c) =>
        c.features.some((f) =>
          pattern.keywords.some((kw) => f.toLowerCase().includes(kw))
        )
      );

      gaps.push({
        feature: pattern.feature,
        competitors: competitorsWithFeature.map((c) => c.name),
        relevance: pattern.relevance,
        recommendation: pattern.recommendation,
      });
    }
  }

  // Check competitor-specific features not in the spec
  for (const competitor of competitors) {
    for (const feature of competitor.features) {
      const featureLower = feature.toLowerCase();
      // Skip if already covered by common patterns
      const coveredByPattern = COMMON_PATTERNS.some((p) =>
        p.keywords.some((kw) => featureLower.includes(kw))
      );
      if (coveredByPattern) continue;

      // Check if this feature concept exists in the spec
      const inSpec = specText.includes(featureLower);
      if (!inSpec && feature.length > 3) {
        const existingGap = gaps.find(
          (g) => g.feature.toLowerCase() === featureLower
        );
        if (existingGap) {
          if (!existingGap.competitors.includes(competitor.name)) {
            existingGap.competitors.push(competitor.name);
          }
        } else {
          gaps.push({
            feature,
            competitors: [competitor.name],
            relevance: "medium",
            recommendation: `Consider adding "${feature}" — found in ${competitor.name}.`,
          });
        }
      }
    }
  }

  return gaps;
}

/**
 * Generate value-add suggestions based on spec, plan, and identified gaps.
 */
export function generateBrainstormSuggestions(
  spec: FeatureSpec,
  plan: Plan,
  gaps: FeatureGap[]
): ValueAddSuggestion[] {
  const suggestions: ValueAddSuggestion[] = [];
  let counter = 1;

  // Sort gaps by relevance (high first)
  const sortedGaps = [...gaps].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return order[a.relevance] - order[b.relevance];
  });

  for (const gap of sortedGaps) {
    const id = `VA-${String(counter).padStart(3, "0")}`;
    const priority = relevanceToPriority(gap.relevance);

    // Find related requirements
    const relatedReqs = spec.requirements
      .filter((req) =>
        gap.feature
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.length > 3 && req.description.toLowerCase().includes(w))
      )
      .map((r) => r.id);

    // Find related scenarios
    const relatedScenarios = spec.scenarios
      .filter((s) =>
        gap.feature
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.length > 3 && s.description.toLowerCase().includes(w))
      )
      .map((s) => s.id);

    suggestions.push({
      id,
      title: gap.feature,
      description: gap.recommendation,
      rationale:
        gap.competitors.length > 0
          ? `Found in competitors: ${gap.competitors.join(", ")}. Adding this would improve competitive positioning.`
          : `Common industry pattern not currently addressed in the spec. Adding this would improve robustness.`,
      priority,
      relatedRequirements: relatedReqs,
      relatedScenarios: relatedScenarios,
    });

    counter++;
  }

  // Add suggestions from edge case analysis
  if (spec.edgeCases.length < 3) {
    suggestions.push({
      id: `VA-${String(counter).padStart(3, "0")}`,
      title: "Expand Edge Case Coverage",
      description: "The spec has limited edge cases defined. Consider adding more edge case scenarios.",
      rationale: "Comprehensive edge case coverage reduces production incidents and improves reliability.",
      priority: "P2",
      relatedRequirements: [],
      relatedScenarios: [],
    });
    counter++;
  }

  if (spec.openQuestions.length > 0) {
    suggestions.push({
      id: `VA-${String(counter).padStart(3, "0")}`,
      title: "Resolve Open Questions",
      description: `There are ${spec.openQuestions.length} unresolved questions that should be addressed before implementation.`,
      rationale: "Unresolved questions lead to assumptions in implementation that may not align with actual requirements.",
      priority: "P1",
      relatedRequirements: [],
      relatedScenarios: [],
    });
  }

  return suggestions;
}

/**
 * Build a feature comparison table (feature × competitor matrix).
 */
export function buildComparisonTable(
  spec: FeatureSpec,
  competitors: CompetitorInfo[],
  gaps: FeatureGap[]
): CompetitorComparisonRow[] {
  const rows: CompetitorComparisonRow[] = [];
  const specText = buildSpecTextSimple(spec);

  // Collect all features to compare
  const allFeatures = new Set<string>();

  // Features from spec requirements
  for (const req of spec.requirements) {
    allFeatures.add(req.description);
  }

  // Features from gaps
  for (const gap of gaps) {
    allFeatures.add(gap.feature);
  }

  // Features from competitors
  for (const competitor of competitors) {
    for (const f of competitor.features) {
      allFeatures.add(f);
    }
  }

  for (const feature of allFeatures) {
    const featureLower = feature.toLowerCase();

    // Check if current spec covers it
    let currentSpec: "planned" | "partial" | "missing" = "missing";
    const inReqs = spec.requirements.some((r) =>
      r.description.toLowerCase() === featureLower
    );
    const inSpecText = specText.includes(featureLower);
    if (inReqs) {
      currentSpec = "planned";
    } else if (inSpecText) {
      currentSpec = "partial";
    }

    // Check each competitor
    const competitorStatus: Record<string, "yes" | "no" | "partial" | "unknown"> = {};
    for (const competitor of competitors) {
      const hasFeature = competitor.features.some((f) =>
        f.toLowerCase().includes(featureLower) ||
        featureLower.includes(f.toLowerCase())
      );
      competitorStatus[competitor.name] = hasFeature ? "yes" : "unknown";
    }

    rows.push({
      feature,
      currentSpec,
      competitors: competitorStatus,
    });
  }

  return rows;
}

/**
 * Generate the full brainstorm report markdown.
 */
export function generateBrainstormMarkdown(report: BrainstormReport): string {
  let md = `# Brainstorm Report: ${report.specId}\n\n`;
  md += `> Generated: ${report.generatedAt}\n`;
  md += `> Mode: ${report.mode}\n\n`;

  // Search Keywords (extracted)
  md += `## Search Keywords\n\n`;
  md += `_Keywords used for competitor research._\n\n`;

  // Competitors Analyzed
  md += `## Competitors Analyzed\n\n`;
  if (report.competitors.length === 0) {
    md += `_No competitors analyzed (${report.mode === "offline" ? "offline mode" : "none found"})._\n\n`;
  } else {
    md += `| Name | Source | Description |\n`;
    md += `|------|--------|-------------|\n`;
    for (const c of report.competitors) {
      const link = c.url ? `[${c.name}](${c.url})` : c.name;
      md += `| ${link} | ${c.source} | ${truncate(c.description, 80)} |\n`;
    }
    md += `\n`;
  }

  // Feature Gap Analysis
  md += `## Feature Gap Analysis\n\n`;
  if (report.featureGaps.length === 0) {
    md += `_No feature gaps identified._\n\n`;
  } else {
    md += `| Feature | Relevance | Found In | Recommendation |\n`;
    md += `|---------|-----------|----------|----------------|\n`;
    for (const gap of report.featureGaps) {
      const competitors = gap.competitors.length > 0
        ? gap.competitors.join(", ")
        : "—";
      md += `| ${gap.feature} | ${gap.relevance} | ${competitors} | ${truncate(gap.recommendation, 60)} |\n`;
    }
    md += `\n`;
  }

  // Comparison Table
  if (report.comparisonTable.length > 0 && report.competitors.length > 0) {
    md += `## Feature Comparison Matrix\n\n`;
    const competitorNames = report.competitors.map((c) => c.name);
    md += `| Feature | Current Spec | ${competitorNames.join(" | ")} |\n`;
    md += `|---------|-------------|${competitorNames.map(() => "---").join("|")}|\n`;
    for (const row of report.comparisonTable) {
      const specIcon = statusIcon(row.currentSpec);
      const compCols = competitorNames
        .map((name) => statusIcon(row.competitors[name] ?? "unknown"))
        .join(" | ");
      md += `| ${truncate(row.feature, 40)} | ${specIcon} | ${compCols} |\n`;
    }
    md += `\n`;
  }

  // Value-Add Suggestions
  md += `## Value-Add Suggestions\n\n`;
  if (report.suggestions.length === 0) {
    md += `_No suggestions generated._\n\n`;
  } else {
    for (const s of report.suggestions) {
      md += `### ${s.id}: ${s.title}\n\n`;
      md += `**Priority:** ${s.priority}\n\n`;
      md += `${s.description}\n\n`;
      md += `**Rationale:** ${s.rationale}\n\n`;
      if (s.relatedRequirements.length > 0) {
        md += `**Related Requirements:** ${s.relatedRequirements.join(", ")}\n\n`;
      }
      if (s.relatedScenarios.length > 0) {
        md += `**Related Scenarios:** ${s.relatedScenarios.join(", ")}\n\n`;
      }
    }
  }

  // Competitor Screenshots
  if (report.screenshotsDir) {
    md += `## Competitor Screenshots\n\n`;
    md += `Screenshots saved to: \`${report.screenshotsDir}\`\n\n`;
    for (const c of report.competitors) {
      if (c.screenshotPath) {
        md += `### ${c.name}\n\n`;
        md += `![${c.name}](${c.screenshotPath})\n\n`;
      }
    }
  }

  // Recommendations Summary
  md += `## Recommendations Summary\n\n`;
  const p1 = report.suggestions.filter((s) => s.priority === "P1");
  const p2 = report.suggestions.filter((s) => s.priority === "P2");
  const p3 = report.suggestions.filter((s) => s.priority === "P3");

  if (p1.length > 0) {
    md += `### P1 — Must Have\n\n`;
    for (const s of p1) {
      md += `- **${s.id}**: ${s.title}\n`;
    }
    md += `\n`;
  }

  if (p2.length > 0) {
    md += `### P2 — Should Have\n\n`;
    for (const s of p2) {
      md += `- **${s.id}**: ${s.title}\n`;
    }
    md += `\n`;
  }

  if (p3.length > 0) {
    md += `### P3 — Nice to Have\n\n`;
    for (const s of p3) {
      md += `- **${s.id}**: ${s.title}\n`;
    }
    md += `\n`;
  }

  if (report.suggestions.length > 0) {
    md += `---\n\n`;
    md += `**Total suggestions:** ${report.suggestions.length} `;
    md += `(${p1.length} P1, ${p2.length} P2, ${p3.length} P3)\n`;
  }

  return md;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function buildSpecText(spec: FeatureSpec, plan: Plan): string {
  const parts: string[] = [
    spec.name,
    ...spec.entities,
    ...spec.requirements.map((r) => r.description),
    ...spec.scenarios.map((s) => s.description),
    ...spec.scenarios.map((s) => `${s.given} ${s.when} ${s.then}`),
    ...spec.successCriteria,
    ...spec.edgeCases,
    ...plan.techContext,
    ...plan.phases.map((p) => p.description),
    ...plan.phases.flatMap((p) => p.fileChanges.map((fc) => fc.description)),
  ];
  return parts.join(" ").toLowerCase();
}

function buildSpecTextSimple(spec: FeatureSpec): string {
  const parts: string[] = [
    spec.name,
    ...spec.entities,
    ...spec.requirements.map((r) => r.description),
    ...spec.scenarios.map((s) => s.description),
    ...spec.successCriteria,
    ...spec.edgeCases,
  ];
  return parts.join(" ").toLowerCase();
}

function relevanceToPriority(relevance: "high" | "medium" | "low"): Priority {
  switch (relevance) {
    case "high":
      return "P1";
    case "medium":
      return "P2";
    case "low":
      return "P3";
  }
}

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.substring(0, maxLen - 3) + "...";
}

function statusIcon(status: string): string {
  switch (status) {
    case "planned":
    case "yes":
      return "✅";
    case "partial":
      return "🟡";
    case "missing":
    case "no":
      return "❌";
    default:
      return "❓";
  }
}
