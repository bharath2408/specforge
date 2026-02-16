# Clarification Log: 001-custom-commands

> Generated: 2026-02-16

## Findings (21)

- **[placeholder-text]** Placeholder text found: "- A `--run` script (shell command string with `{placeholder}` variable support)"
  - Location: Line 52
  - Suggestion: Replace with concrete, specific content.

- **[placeholder-text]** Placeholder text found: "Support placeholder variables in command templates:"
  - Location: Line 82
  - Suggestion: Replace with concrete, specific content.

- **[placeholder-text]** Placeholder text found: "- **CommandVariable** — A variable placeholder within a command template (name, required, default, description)"
  - Location: Line 102
  - Suggestion: Replace with concrete, specific content.

- **[missing-priorities]** Scenario "### [US1]" missing priority level.
  - Location: ### [US1]
  - Suggestion: Add [P1], [P2], or [P3] priority tag.

- **[missing-priorities]** Scenario "### [US2]" missing priority level.
  - Location: ### [US2]
  - Suggestion: Add [P1], [P2], or [P3] priority tag.

- **[missing-priorities]** Scenario "### [US3]" missing priority level.
  - Location: ### [US3]
  - Suggestion: Add [P1], [P2], or [P3] priority tag.

- **[missing-priorities]** Scenario "### [US4]" missing priority level.
  - Location: ### [US4]
  - Suggestion: Add [P1], [P2], or [P3] priority tag.

- **[missing-priorities]** Scenario "### [US5]" missing priority level.
  - Location: ### [US5]
  - Suggestion: Add [P1], [P2], or [P3] priority tag.

- **[missing-error-handling]** No error handling strategy defined.
  - Location: Document
  - Suggestion: Add error handling details: error codes, error response format, retry strategy.

- **[ambiguous-terminology]** Ambiguous term "the system" found.
  - Location: Line 26
  - Suggestion: Specify which component or service.

- **[ambiguous-terminology]** Ambiguous term "the system" found.
  - Location: Line 32
  - Suggestion: Specify which component or service.

- **[ambiguous-terminology]** Ambiguous term "etc" found.
  - Location: Line 97
  - Suggestion: List all items explicitly.

- **[open-question-suggestions]** Open question "Should custom commands support piping output between steps?" has related context in the spec (2 keyword matches).
  - Location: Open Questions
  - Suggestion: Review scenarios and requirements — this question may be answerable from existing spec content.

- **[open-question-suggestions]** Open question "Should there be a `--dry-run` flag to preview resolved commands without executing?" has related context in the spec (2 keyword matches).
  - Location: Open Questions
  - Suggestion: Review scenarios and requirements — this question may be answerable from existing spec content.

- **[open-question-suggestions]** Open question "Should commands support conditional logic (if/else) or just sequential execution?" has related context in the spec (2 keyword matches).
  - Location: Open Questions
  - Suggestion: Review scenarios and requirements — this question may be answerable from existing spec content.

- **[cross-spec-alignment]** Model "User" is in .spec.yaml but missing from spec.md Key Entities.
  - Location: .spec.yaml vs Key Entities
  - Suggestion: Add "User" to Key Entities in spec.md or remove it from .spec.yaml if not needed.

- **[cross-spec-alignment]** Model "Post" is in .spec.yaml but missing from spec.md Key Entities.
  - Location: .spec.yaml vs Key Entities
  - Suggestion: Add "Post" to Key Entities in spec.md or remove it from .spec.yaml if not needed.

- **[scenario-entity-coverage]** Entity "CustomCommand" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "CustomCommand" or remove it from Key Entities if unused.

- **[scenario-entity-coverage]** Entity "CommandVariable" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "CommandVariable" or remove it from Key Entities if unused.

- **[scenario-entity-coverage]** Entity "CommandRegistry" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "CommandRegistry" or remove it from Key Entities if unused.

- **[implicit-entity-detection]** "a Custom" in scenarios/requirements suggests an entity not in Key Entities.
  - Location: User Scenarios / Requirements
  - Suggestion: Consider adding "Custom" to Key Entities if it's a domain object.

## Coverage

| Category | Status | Details |
|----------|--------|---------|
| Placeholder Text | missing | 3 issues found — needs attention |
| Empty Sections | covered | No issues found |
| Missing Priorities | missing | 5 issues found — needs attention |
| Undefined Entities | covered | No issues found |
| Unclear Acceptance Criteria | covered | No issues found |
| Missing Edge Cases | covered | No issues found |
| Undefined Authentication | covered | No issues found |
| Missing Error Handling | partial | 1 issue(s) found |
| Incomplete Data Model | covered | No issues found |
| Ambiguous Terminology | missing | 3 issues found — needs attention |
| Entity Relationships | covered | No issues found |
| Open Question Suggestions | missing | 3 issues found — needs attention |
| Cross-Spec Alignment | partial | 2 issue(s) found |
| Scenario-Entity Coverage | missing | 3 issues found — needs attention |
| Implicit Entity Detection | partial | 1 issue(s) found |
