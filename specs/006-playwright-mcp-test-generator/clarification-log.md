# Clarification Log: 006-playwright-mcp-test-generator

> Generated: 2026-02-16

## Findings (29)

- **[placeholder-text]** Placeholder text found: "**Then** the tests use Playwright MCP patterns — `page.goto()`, `page.fill()`, `page.click()`, `expect(page.locator(...))` — with proper selectors based on entity names and form fields"
  - Location: Line 32
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

- **[missing-priorities]** Scenario "### [US6]" missing priority level.
  - Location: ### [US6]
  - Suggestion: Add [P1], [P2], or [P3] priority tag.

- **[missing-priorities]** Scenario "### [US7]" missing priority level.
  - Location: ### [US7]
  - Suggestion: Add [P1], [P2], or [P3] priority tag.

- **[open-question-suggestions]** Open question "Should generated tests use `@playwright/test` API testing directly or go through the browser for API calls too?" has related context in the spec (3 keyword matches).
  - Location: Open Questions
  - Suggestion: Review scenarios and requirements — this question may be answerable from existing spec content.

- **[open-question-suggestions]** Open question "Should we support generating tests for GraphQL endpoints in addition to REST?" has related context in the spec (2 keyword matches).
  - Location: Open Questions
  - Suggestion: Review scenarios and requirements — this question may be answerable from existing spec content.

- **[open-question-suggestions]** Open question "Should the test data factories use a library like `faker` or generate simple static data?" has related context in the spec (2 keyword matches).
  - Location: Open Questions
  - Suggestion: Review scenarios and requirements — this question may be answerable from existing spec content.

- **[cross-spec-alignment]** Entity "PlaywrightTestFile" is in spec.md but missing from .spec.yaml models.
  - Location: Key Entities vs .spec.yaml
  - Suggestion: Add a "PlaywrightTestFile" model to .spec.yaml or remove it from Key Entities if not needed.

- **[cross-spec-alignment]** Entity "ScenarioTestCase" is in spec.md but missing from .spec.yaml models.
  - Location: Key Entities vs .spec.yaml
  - Suggestion: Add a "ScenarioTestCase" model to .spec.yaml or remove it from Key Entities if not needed.

- **[cross-spec-alignment]** Entity "PageObject" is in spec.md but missing from .spec.yaml models.
  - Location: Key Entities vs .spec.yaml
  - Suggestion: Add a "PageObject" model to .spec.yaml or remove it from Key Entities if not needed.

- **[cross-spec-alignment]** Entity "DataFactory" is in spec.md but missing from .spec.yaml models.
  - Location: Key Entities vs .spec.yaml
  - Suggestion: Add a "DataFactory" model to .spec.yaml or remove it from Key Entities if not needed.

- **[cross-spec-alignment]** Entity "AuthFixture" is in spec.md but missing from .spec.yaml models.
  - Location: Key Entities vs .spec.yaml
  - Suggestion: Add a "AuthFixture" model to .spec.yaml or remove it from Key Entities if not needed.

- **[cross-spec-alignment]** Entity "TestConfig" is in spec.md but missing from .spec.yaml models.
  - Location: Key Entities vs .spec.yaml
  - Suggestion: Add a "TestConfig" model to .spec.yaml or remove it from Key Entities if not needed.

- **[cross-spec-alignment]** Model "User" is in .spec.yaml but missing from spec.md Key Entities.
  - Location: .spec.yaml vs Key Entities
  - Suggestion: Add "User" to Key Entities in spec.md or remove it from .spec.yaml if not needed.

- **[cross-spec-alignment]** Model "Post" is in .spec.yaml but missing from spec.md Key Entities.
  - Location: .spec.yaml vs Key Entities
  - Suggestion: Add "Post" to Key Entities in spec.md or remove it from .spec.yaml if not needed.

- **[cross-spec-alignment]** Model "CustomCommand" is in .spec.yaml but missing from spec.md Key Entities.
  - Location: .spec.yaml vs Key Entities
  - Suggestion: Add "CustomCommand" to Key Entities in spec.md or remove it from .spec.yaml if not needed.

- **[cross-spec-alignment]** Model "CommandVariable" is in .spec.yaml but missing from spec.md Key Entities.
  - Location: .spec.yaml vs Key Entities
  - Suggestion: Add "CommandVariable" to Key Entities in spec.md or remove it from .spec.yaml if not needed.

- **[cross-spec-alignment]** Model "CommandRegistry" is in .spec.yaml but missing from spec.md Key Entities.
  - Location: .spec.yaml vs Key Entities
  - Suggestion: Add "CommandRegistry" to Key Entities in spec.md or remove it from .spec.yaml if not needed.

- **[scenario-entity-coverage]** Entity "PlaywrightTestFile" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "PlaywrightTestFile" or remove it from Key Entities if unused.

- **[scenario-entity-coverage]** Entity "ScenarioTestCase" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "ScenarioTestCase" or remove it from Key Entities if unused.

- **[scenario-entity-coverage]** Entity "PageObject" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "PageObject" or remove it from Key Entities if unused.

- **[scenario-entity-coverage]** Entity "DataFactory" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "DataFactory" or remove it from Key Entities if unused.

- **[scenario-entity-coverage]** Entity "AuthFixture" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "AuthFixture" or remove it from Key Entities if unused.

- **[scenario-entity-coverage]** Entity "TestConfig" is not mentioned in any user scenario.
  - Location: Key Entities
  - Suggestion: Add a scenario that exercises "TestConfig" or remove it from Key Entities if unused.

- **[implicit-entity-detection]** "the Playwright" in scenarios/requirements suggests an entity not in Key Entities.
  - Location: User Scenarios / Requirements
  - Suggestion: Consider adding "Playwright" to Key Entities if it's a domain object.

## Coverage

| Category | Status | Details |
|----------|--------|---------|
| Placeholder Text | partial | 1 issue(s) found |
| Empty Sections | covered | No issues found |
| Missing Priorities | missing | 7 issues found — needs attention |
| Undefined Entities | covered | No issues found |
| Unclear Acceptance Criteria | covered | No issues found |
| Missing Edge Cases | covered | No issues found |
| Undefined Authentication | covered | No issues found |
| Missing Error Handling | covered | No issues found |
| Incomplete Data Model | covered | No issues found |
| Ambiguous Terminology | covered | No issues found |
| Entity Relationships | covered | No issues found |
| Open Question Suggestions | missing | 3 issues found — needs attention |
| Cross-Spec Alignment | missing | 11 issues found — needs attention |
| Scenario-Entity Coverage | missing | 6 issues found — needs attention |
| Implicit Entity Detection | partial | 1 issue(s) found |
