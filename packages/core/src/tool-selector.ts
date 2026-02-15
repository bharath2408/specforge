/**
 * Smart Brainstorm Tool Selector
 *
 * Analyzes spec content to determine which research tools
 * (npm, GitHub, URLs, screenshots) to trigger during brainstorm.
 */

import type {
  FeatureSpec,
  SpecSignals,
  ToolSelection,
  ToolOverride,
  DomainCategory,
} from "./types.js";

// ──────────────────────────────────────────────────────────────
// Keyword sets (FR-003)
// ──────────────────────────────────────────────────────────────

const NPM_KEYWORDS = [
  "auth", "authentication", "authorization",
  "validation", "validator", "validate",
  "email", "smtp", "mailer",
  "payment", "stripe", "billing",
  "queue", "worker", "job",
  "cache", "caching", "redis",
  "search", "elasticsearch", "algolia",
  "logging", "logger", "winston", "pino",
  "monitoring", "metrics", "prometheus",
  "i18n", "internationalization", "locale",
  "rate-limit", "ratelimit", "throttle",
  "upload", "multer", "formidable",
  "encryption", "crypto", "bcrypt", "hash",
  "compression", "gzip", "deflate",
  "websocket", "socket.io", "ws",
  "markdown", "parser",
  "csv", "excel", "pdf",
  "orm", "database", "prisma", "sequelize", "typeorm",
  "testing", "jest", "vitest", "mocha",
];

const UI_KEYWORDS = [
  "dashboard", "chart", "graph",
  "form", "input", "textarea",
  "button", "click", "tap",
  "modal", "dialog", "popup",
  "page", "screen", "view",
  "layout", "grid", "flexbox",
  "render", "display", "show",
  "widget", "component", "element",
  "theme", "dark mode", "light mode",
  "responsive", "mobile", "desktop",
  "navigation", "navbar", "sidebar",
  "table", "list", "card",
  "icon", "image", "avatar",
  "animation", "transition",
  "css", "style", "tailwind",
  "react", "vue", "angular", "svelte",
  "frontend", "front-end", "ui", "ux",
];

const INFRASTRUCTURE_KEYWORDS = [
  "migration", "migrate", "schema",
  "deploy", "deployment", "release",
  "ci", "cd", "pipeline", "workflow",
  "container", "docker", "dockerfile",
  "kubernetes", "k8s", "helm",
  "terraform", "infrastructure",
  "database", "postgres", "mysql", "mongo",
  "backup", "restore", "snapshot",
  "cron", "scheduler", "job",
  "config", "configuration", "env",
  "server", "cluster", "node",
  "load balancer", "proxy", "nginx",
  "ssl", "tls", "certificate",
  "dns", "domain",
];

const PROTOCOL_KEYWORDS = [
  "oauth", "oauth2",
  "jwt", "json web token",
  "graphql", "gql",
  "rest", "restful",
  "websocket", "wss",
  "grpc", "protobuf",
  "mqtt",
  "amqp", "rabbitmq",
  "openapi", "swagger",
  "saml",
  "ldap",
  "oidc", "openid",
];

// ──────────────────────────────────────────────────────────────
// Spec Content Analyzer (FR-001)
// ──────────────────────────────────────────────────────────────

/**
 * Analyze a feature spec to extract signals for tool selection.
 */
export function analyzeSpecSignals(spec: FeatureSpec, content: string): SpecSignals {
  const allText = buildAllText(spec, content).toLowerCase();

  // Detect keywords in each category
  const npmMatches = findMatches(allText, NPM_KEYWORDS);
  const uiMatches = findMatches(allText, UI_KEYWORDS);
  const infraMatches = findMatches(allText, INFRASTRUCTURE_KEYWORDS);
  const protocolMatches = findMatches(allText, PROTOCOL_KEYWORDS);

  // Classify domain category
  const domainCategory = classifyDomain(uiMatches.length, infraMatches.length, npmMatches.length);

  // Score external dependency likelihood
  const externalDependencyLikelihood = scoreExternalLikelihood(
    npmMatches.length,
    protocolMatches.length,
    domainCategory,
    allText
  );

  // Detect visual component
  const hasVisualComponent = uiMatches.length >= 2 || domainCategory === "ui";

  return {
    domainCategory,
    externalDependencyLikelihood,
    hasVisualComponent,
    detectedKeywords: {
      npm: npmMatches,
      ui: uiMatches,
      infrastructure: infraMatches,
      protocol: protocolMatches,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Tool Selection Engine (FR-002)
// ──────────────────────────────────────────────────────────────

/**
 * Select which brainstorm tools to enable based on spec signals and overrides.
 */
export function selectTools(
  signals: SpecSignals,
  overrides?: ToolOverride,
  hasUrls: boolean = false
): ToolSelection {
  const totalKeywords =
    signals.detectedKeywords.npm.length +
    signals.detectedKeywords.ui.length +
    signals.detectedKeywords.infrastructure.length +
    signals.detectedKeywords.protocol.length;

  // Fall back to all tools if insufficient signal
  if (totalKeywords === 0) {
    const selection: ToolSelection = {
      npm: true,
      github: true,
      urls: hasUrls,
      screenshots: false,
      heuristics: true,
      reasons: {
        npm: "Insufficient signal to filter — running all tools",
        github: "Insufficient signal to filter — running all tools",
        urls: hasUrls ? "URLs provided by user" : "No URLs provided",
        screenshots: "No visual signals detected",
        heuristics: "Always enabled",
      },
    };
    return applyOverrides(selection, overrides);
  }

  // npm search decision
  const npmOn =
    signals.externalDependencyLikelihood !== "low" ||
    signals.detectedKeywords.npm.length >= 2;
  const npmReason = npmOn
    ? signals.detectedKeywords.npm.length > 0
      ? `npm-likely keywords detected: ${signals.detectedKeywords.npm.slice(0, 3).join(", ")}`
      : `External dependency likelihood is ${signals.externalDependencyLikelihood}`
    : signals.domainCategory === "infrastructure"
      ? "Infrastructure/internal feature — npm search unlikely to help"
      : "Low external dependency likelihood — skipping npm";

  // GitHub search decision
  const githubOn =
    signals.detectedKeywords.protocol.length > 0 ||
    signals.externalDependencyLikelihood === "high" ||
    (signals.domainCategory !== "infrastructure" && signals.detectedKeywords.npm.length >= 2);
  const githubReason = githubOn
    ? signals.detectedKeywords.protocol.length > 0
      ? `Protocol keywords found: ${signals.detectedKeywords.protocol.slice(0, 3).join(", ")}`
      : "Feature likely has open-source equivalents"
    : "Tightly coupled to project internals — skipping GitHub";

  // URL fetch decision
  const urlsOn = hasUrls;
  const urlsReason = hasUrls
    ? "URLs provided by user"
    : "No competitor URLs provided";

  // Screenshots decision
  const screenshotsOn = signals.hasVisualComponent && hasUrls;
  const screenshotsReason = screenshotsOn
    ? `UI feature detected (${signals.detectedKeywords.ui.slice(0, 3).join(", ")}) and URLs available`
    : !signals.hasVisualComponent
      ? `Backend/CLI/infrastructure feature — no UI elements detected`
      : "No competitor URLs available for screenshots";

  const selection: ToolSelection = {
    npm: npmOn,
    github: githubOn,
    urls: urlsOn,
    screenshots: screenshotsOn,
    heuristics: true,
    reasons: {
      npm: npmReason,
      github: githubReason,
      urls: urlsReason,
      screenshots: screenshotsReason,
      heuristics: "Always enabled",
    },
  };

  return applyOverrides(selection, overrides);
}

// ──────────────────────────────────────────────────────────────
// Selection Summary (FR-005)
// ──────────────────────────────────────────────────────────────

/**
 * Format a human-readable tool selection summary.
 */
export function formatToolSelectionSummary(specId: string, selection: ToolSelection): string {
  const lines: string[] = [];
  lines.push(`  Tool selection for ${specId}:`);

  const tools: Array<{ name: string; key: keyof ToolSelection }> = [
    { name: "npm search", key: "npm" },
    { name: "GitHub search", key: "github" },
    { name: "URL fetch", key: "urls" },
    { name: "Screenshots", key: "screenshots" },
    { name: "Heuristics", key: "heuristics" },
  ];

  for (const tool of tools) {
    const enabled = selection[tool.key];
    const status = enabled ? "ON " : "OFF";
    const reason = selection.reasons[tool.key as string] ?? "";
    const paddedName = tool.name.padEnd(15);
    lines.push(`    ${paddedName}${status}  (${reason})`);
  }

  return lines.join("\n");
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const VALID_TOOL_NAMES = ["npm", "github", "screenshots", "all"];

/**
 * Apply user overrides (--include/--exclude) to auto-selection.
 * --exclude takes precedence over --include (FR-004 edge case).
 */
function applyOverrides(selection: ToolSelection, overrides?: ToolOverride): ToolSelection {
  if (!overrides) return selection;

  const result = { ...selection, reasons: { ...selection.reasons } };

  // Apply includes
  if (overrides.include) {
    for (const tool of overrides.include) {
      if (tool === "all") {
        result.npm = true;
        result.github = true;
        result.screenshots = true;
        result.reasons.npm = "Force-enabled via --include all";
        result.reasons.github = "Force-enabled via --include all";
        result.reasons.screenshots = "Force-enabled via --include all";
      } else if (tool === "npm") {
        result.npm = true;
        result.reasons.npm = "Force-enabled via --include npm";
      } else if (tool === "github") {
        result.github = true;
        result.reasons.github = "Force-enabled via --include github";
      } else if (tool === "screenshots") {
        result.screenshots = true;
        result.reasons.screenshots = "Force-enabled via --include screenshots";
      }
    }
  }

  // Apply excludes (takes precedence over includes)
  if (overrides.exclude) {
    for (const tool of overrides.exclude) {
      if (tool === "npm") {
        result.npm = false;
        result.reasons.npm = "Force-disabled via --exclude npm";
      } else if (tool === "github") {
        result.github = false;
        result.reasons.github = "Force-disabled via --exclude github";
      } else if (tool === "screenshots") {
        result.screenshots = false;
        result.reasons.screenshots = "Force-disabled via --exclude screenshots";
      }
    }
  }

  return result;
}

/**
 * Build all searchable text from spec and raw content.
 */
function buildAllText(spec: FeatureSpec, content: string): string {
  const parts: string[] = [
    spec.name,
    ...spec.entities,
    ...spec.requirements.map((r) => r.description),
    ...spec.scenarios.map((s) => `${s.description} ${s.given} ${s.when} ${s.then}`),
    ...spec.successCriteria,
    ...spec.edgeCases,
    content,
  ];
  return parts.join(" ");
}

/**
 * Find keywords that appear in the text.
 */
function findMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((kw) => text.includes(kw.toLowerCase()));
}

/**
 * Classify the spec's domain category based on keyword counts.
 */
function classifyDomain(
  uiCount: number,
  infraCount: number,
  npmCount: number
): DomainCategory {
  // Mixed if significant signals in both UI and infra
  if (uiCount >= 3 && infraCount >= 3) return "mixed";

  // Clear UI dominance
  if (uiCount >= 3 && uiCount > infraCount * 2) return "ui";

  // Clear infrastructure dominance
  if (infraCount >= 3 && infraCount > uiCount * 2) return "infrastructure";

  // API/backend if npm keywords but neither UI nor infra dominant
  if (npmCount >= 2 && uiCount < 3 && infraCount < 3) return "api";

  // CLI if mentions cli-related terms (handled by keyword detection)
  // Default to library if some keywords but no clear domain
  if (npmCount >= 1 || uiCount >= 1 || infraCount >= 1) return "library";

  return "api";
}

/**
 * Score how likely the feature has existing external packages.
 */
function scoreExternalLikelihood(
  npmKeywordCount: number,
  protocolKeywordCount: number,
  domain: DomainCategory,
  _text: string
): "high" | "medium" | "low" {
  // High: many npm-related keywords or protocols referenced
  if (npmKeywordCount >= 3 || protocolKeywordCount >= 2) return "high";

  // Low: infrastructure/internal with few external signals
  if (domain === "infrastructure" && npmKeywordCount === 0 && protocolKeywordCount === 0) {
    return "low";
  }

  // Medium: some signals
  if (npmKeywordCount >= 1 || protocolKeywordCount >= 1) return "medium";

  return "low";
}

export { VALID_TOOL_NAMES };
