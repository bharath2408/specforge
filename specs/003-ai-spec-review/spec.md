# Feature Spec: AI Spec Review

> Spec ID: 003-ai-spec-review
> Created: 2026-02-15

## Status

Status: draft

## Overview

Add an LLM-powered `specforge review <spec-id>` command that analyzes feature specs for completeness, quality, and actionability. Produces a scored review report with specific suggestions — going beyond the existing `clarify` command (which only checks for structural ambiguities) to evaluate the *substance* of what's written.

## User Scenarios

### [US1] [P1] Developer reviews a spec before planning

**Given** a developer has written `specs/001-user-auth/spec.md` with scenarios, requirements, and entities
**When** they run `specforge review 001-user-auth`
**Then** they receive a review report with:
  - An overall quality score (0–100)
  - Category scores (completeness, clarity, testability, feasibility, consistency)
  - Specific findings with severity levels and actionable suggestions
  - Missing scenarios that should be considered
  - A summary verdict (Ready for Planning / Needs Work / Incomplete)

### [US2] [P1] Developer reviews a spec with custom focus areas

**Given** a developer wants to focus the review on specific concerns
**When** they run `specforge review 001-user-auth --focus security,performance`
**Then** the review emphasizes those areas with deeper analysis, including checks for auth flows, injection vectors, N+1 queries, caching strategy, pagination gaps, and rate limiting needs

### [US3] [P2] Developer reviews a spec in strict mode for production readiness

**Given** a developer is preparing a spec for a production feature
**When** they run `specforge review 001-user-auth --strict`
**Then** the scoring thresholds are raised, minor issues become warnings, and the report includes a production-readiness checklist (error handling, monitoring, rollback plan, load estimation)

### [US4] [P2] Developer auto-fixes review findings

**Given** a review report has been generated with actionable suggestions
**When** the developer runs `specforge review 001-user-auth --fix`
**Then** the tool applies safe auto-fixes to the spec (adding missing sections, expanding placeholder text, adding suggested edge cases) and shows a diff of changes

### [US5] [P3] Developer reviews all specs at once

**Given** a project has multiple feature specs
**When** they run `specforge review` (no spec-id)
**Then** all specs are reviewed and a summary table is printed with scores and verdicts for each

### [US6] [P3] Developer runs review in CI pipeline

**Given** a CI pipeline includes spec quality checks
**When** `specforge review --ci --min-score 70` is run
**Then** the command exits with code 1 if any spec scores below the threshold, outputting machine-readable JSON

## Functional Requirements

### [FR-001] Spec Quality Scoring Engine

Analyze a feature spec across 5 dimensions, each scored 0–20 (total 0–100):

1. **Completeness** (0–20): Are all sections filled? Are scenarios covering happy path, error paths, and edge cases? Are entities defined with relationships?
2. **Clarity** (0–20): Are descriptions specific and unambiguous? Do scenarios have concrete Given/When/Then (not placeholder text)? Are requirements testable as written?
3. **Testability** (0–20): Can each requirement be verified? Are success criteria measurable? Do scenarios include expected outcomes with specific values?
4. **Feasibility** (0–20): Are requirements technically realistic? Are there implicit dependencies? Is scope appropriate for a single feature?
5. **Consistency** (0–20): Do scenarios align with requirements? Do entities match what's referenced in scenarios? Are priorities consistent with the feature's scope and complexity?

### [FR-002] Finding Generation

Each finding includes:
- Severity: `critical` | `major` | `minor` | `suggestion`
- Category: one of the 5 scoring dimensions
- Location: section and line reference in spec.md
- Message: what's wrong
- Suggestion: specific text or action to fix it

### [FR-003] Missing Scenario Detection

Based on the entities, requirements, and existing scenarios, suggest additional scenarios the spec should cover:
- Error/failure paths for each happy-path scenario
- Authorization edge cases if auth entities exist
- Data validation scenarios for each entity field
- Concurrency/race condition scenarios if applicable

### [FR-004] Review Report Output

Generate `review-report.md` in the spec directory with:
- Score summary table (dimension + score + grade)
- Verdict banner (Ready for Planning / Needs Work / Incomplete)
- Findings grouped by severity
- Suggested scenarios section
- Comparison with previous review (if one exists)

### [FR-005] Focus Area Deep-Dive

When `--focus <areas>` is provided, add specialized checks:
- `security`: auth gaps, injection vectors, data exposure, OWASP patterns
- `performance`: N+1 risks, missing pagination, caching needs, batch operations
- `scalability`: stateful assumptions, single-point-of-failure, queue needs
- `ux`: error messages, loading states, empty states, accessibility
- `data`: migration needs, backup strategy, data integrity, GDPR

### [FR-006] Auto-Fix Mode

When `--fix` is provided:
- Only apply safe, additive changes (never remove user content)
- Add missing section headers with TODO markers
- Expand detected placeholder text with suggested content
- Append suggested edge cases to the Edge Cases section
- Show a unified diff before and after

### [FR-007] CI Mode

When `--ci` is provided:
- Output JSON to stdout (no markdown)
- Exit code 0 if all specs meet `--min-score` threshold
- Exit code 1 with failing spec IDs if any are below threshold
- Support `--format json` for programmatic consumption

### [FR-008] Offline Analysis Engine

The review MUST work fully offline without any API calls. Use heuristic-based analysis:
- Regex patterns for placeholder detection ("TBD", "TODO", "example", generic nouns)
- Section completeness checks (word count thresholds, structural markers)
- Cross-reference validation (entity names in scenarios, requirement IDs in test criteria)
- Keyword analysis for specificity scoring
- Pattern matching for testability (measurable values, concrete assertions)

## Key Entities

- **ReviewReport** — The full review output: scores, findings, suggestions, verdict
- **ReviewFinding** — A single issue found during review with severity, category, location, and suggestion
- **ScoreCard** — The 5-dimension scoring breakdown with individual and total scores
- **SuggestedScenario** — An auto-generated scenario suggestion based on gap analysis
- **ReviewConfig** — Configuration for focus areas, strict mode, thresholds

## Success Criteria

- All P1 scenarios pass acceptance testing
- Review of a well-written spec scores 80+ with no critical findings
- Review of a placeholder/template spec scores below 30 with clear guidance to improve
- `--fix` mode produces valid spec.md that scores higher than the original
- `--ci` mode correctly gates on `--min-score` threshold
- Full review completes in under 2 seconds for a typical spec (offline mode)
- Review findings are actionable — each finding tells the developer exactly what to change

## Edge Cases

- Empty spec file (only headers, no content) — should score 0 and list all sections as missing
- Spec with only P1 scenarios — should suggest P2/P3 scenarios
- Spec with no entities section — should flag as critical and suggest entities from scenario text
- Spec with circular requirement references — should detect and flag
- Very large spec (50+ scenarios) — should still complete in reasonable time
- Spec in non-English language — should handle gracefully, skip language-specific heuristics
- Running review before clarify — should work independently, suggest running clarify too
- Previously reviewed spec with no changes — should note "no changes since last review"

## Authentication

Not applicable — this is a local CLI command with no API calls or user authentication.

## Open Questions

- Should the review score be stored in the spec metadata for tracking over time?
- Should there be a `--watch` mode that re-reviews on spec file changes?
- Should review findings integrate with `specforge issues` to create GitHub issues?
