# Feature Spec: Smart Brainstorm Triggers

> Spec ID: 004-smart-brainstorm-triggers
> Created: 2026-02-15

## Status

Status: draft

## Overview

Currently `specforge brainstorm` runs all research tools (npm search, GitHub search, URL fetch, screenshots) every time, regardless of what the spec actually needs. This wastes time and produces noise. The feature adds a requirement-based tool selection engine that analyzes the spec content and user prompt to decide which research tools to trigger.

## User Scenarios

### [US1] [P1] Brainstorm auto-selects relevant tools based on spec content

**Given** a feature spec for "user-authentication" with entities like Session, Token, and requirements mentioning JWT and OAuth
**When** the developer runs `specforge brainstorm 001-user-authentication`
**Then** the tool analyzes the spec and automatically enables npm search (auth libraries exist on npm), GitHub search (open-source auth implementations), and skips screenshots (not a UI feature)

### [US2] [P1] Brainstorm skips npm/GitHub for internal-only features

**Given** a feature spec for "internal-database-migration" with entities like MigrationLog and requirements about schema versioning
**When** the developer runs `specforge brainstorm 002-database-migration`
**Then** the tool detects this is an internal/infrastructure concern, skips npm and GitHub search, and only runs the offline heuristic gap analysis (checking for missing patterns like rollback, dry-run, logging)

### [US3] [P2] Brainstorm triggers screenshots only for UI/frontend specs

**Given** a feature spec with entities like Dashboard, Chart, Widget and requirements mentioning "display", "render", "layout"
**When** the developer runs `specforge brainstorm 003-analytics-dashboard`
**Then** screenshots are enabled because the spec is UI-related, and competitor URLs with visual interfaces are prioritized

### [US4] [P2] Developer overrides auto-selection with explicit flags

**Given** the auto-selector decides to skip GitHub search for a spec
**When** the developer runs `specforge brainstorm 001-feature --include github` or `--include all`
**Then** the overridden tools are included regardless of what auto-selection decided

### [US5] [P2] Brainstorm explains which tools were selected and why

**Given** any spec being brainstormed
**When** the tool selection engine runs
**Then** it prints a summary before research starts showing which tools are enabled/skipped and a one-line reason for each decision

### [US6] [P3] Developer excludes specific tools

**Given** a developer wants to skip a specific tool that was auto-selected
**When** they run `specforge brainstorm 001-feature --exclude npm,screenshots`
**Then** those tools are skipped even if auto-selection would have enabled them

## Functional Requirements

### [FR-001] Spec Content Analyzer

Analyze the parsed `FeatureSpec` to extract signals that determine tool relevance:
- **Domain category**: Classify the spec as UI/frontend, API/backend, infrastructure, library, or CLI based on entity names, requirement keywords, and scenario descriptions
- **External dependency likelihood**: Score how likely the feature has existing npm packages or GitHub repos (auth=high, custom business logic=low)
- **Visual component**: Detect if the feature has UI elements that would benefit from screenshot comparison

### [FR-002] Tool Selection Engine

Based on the spec analysis, decide which tools to enable:

| Tool | Enable when | Skip when |
|------|------------|-----------|
| npm search | External dependency likelihood is medium-high, OR entities match known library patterns (auth, validation, email, payment, queue, cache, i18n) | Purely internal logic, infrastructure, or custom business rules |
| GitHub search | Feature has open-source equivalents likely, OR spec mentions protocols/standards (OAuth, GraphQL, WebSocket, gRPC, MQTT) | Tightly coupled to project internals |
| URL fetch | User provides `--urls`, OR spec mentions specific competitor products | No URLs provided and no competitor signals |
| Screenshots | Domain is UI/frontend AND competitor URLs are available | Backend/CLI/infrastructure features, OR no URLs found |
| Offline heuristics | Always enabled | Never skipped (always runs gap analysis for 16 common patterns) |

### [FR-003] Keyword-Based Signal Detection

Define keyword sets that signal tool relevance:
- **npm-likely keywords**: auth, validation, email, payment, queue, cache, search, logging, monitoring, i18n, rate-limit, upload, encryption, compression, websocket
- **UI keywords**: dashboard, chart, form, button, modal, page, layout, render, display, widget, component, theme, responsive
- **Infrastructure keywords**: migration, deploy, CI, pipeline, container, kubernetes, terraform, database, schema, backup, cron
- **Protocol keywords**: OAuth, JWT, GraphQL, REST, WebSocket, gRPC, MQTT, AMQP

### [FR-004] Tool Selection Override via CLI Flags

New flags for the brainstorm command:
- `--include <tools...>` — Force-enable specific tools: `npm`, `github`, `screenshots`, `all`
- `--exclude <tools...>` — Force-disable specific tools: `npm`, `github`, `screenshots`
- `--include` and `--exclude` take precedence over auto-selection
- `--offline` continues to work as a shortcut for `--exclude npm,github,screenshots`

### [FR-005] Selection Summary Output

Before research begins, print a tool selection summary:
```
  Tool selection for 001-user-authentication:
    npm search:    ON  (auth-related entities detected: Session, Token)
    GitHub search: ON  (protocol keywords found: JWT, OAuth)
    URL fetch:     OFF (no competitor URLs provided)
    Screenshots:   OFF (backend feature, no UI elements detected)
    Heuristics:    ON  (always enabled)
```

### [FR-006] Selection Result Type

Return a structured `ToolSelection` object from the analyzer so the brainstorm command can use it programmatically:
```
{ npm: boolean, github: boolean, urls: boolean, screenshots: boolean, heuristics: true, reasons: Record<string, string> }
```

## Key Entities

- **ToolSelection** — The result of the spec analysis: which tools to enable, with reasons
- **SpecSignals** — Extracted signals from spec content: domain category, dependency likelihood, visual component flag, detected keywords
- **ToolOverride** — User-provided include/exclude overrides from CLI flags

## Success Criteria

- npm and GitHub search are skipped for at least 40% of infrastructure/internal specs (compared to always-on today)
- UI specs correctly trigger screenshots while backend specs skip them
- `--include` and `--exclude` flags override auto-selection in all cases
- Tool selection summary is printed before research starts
- No regression: specs that previously got good brainstorm results still get them
- Selection runs in under 100ms (pure keyword analysis, no I/O)

## Edge Cases

- Spec with mixed signals (e.g., "admin dashboard for database migrations") — should enable both UI and infrastructure tools
- Spec with no entities and minimal content — should fall back to enabling all tools (insufficient signal to filter)
- Spec with only 1 scenario — should still produce useful tool selection
- User passes both `--include npm` and `--exclude npm` — `--exclude` should take precedence
- Empty keyword extraction — fall back to all tools enabled
- Spec mentions competitor names in requirements — should trigger URL fetch if URLs can be inferred

## Error Handling

- If spec.md cannot be parsed or has no content, fall back to enabling all tools (safe default)
- If keyword extraction finds zero matches across all categories, enable all tools with a warning: "Insufficient signal to filter tools — running all"
- Invalid `--include` or `--exclude` values print an error listing valid tool names: npm, github, screenshots, all

## Authentication

Not applicable — this is a local CLI command with no API calls or user authentication.

## Open Questions

- Should the tool selection be configurable in `specforge.config.yaml` (e.g., default-disabled tools)?
- Should previous brainstorm results influence tool selection for re-runs?
