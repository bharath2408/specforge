# Implementation Plan: 004-smart-brainstorm-triggers

> Generated: 2026-02-15

## Constitutional Compliance

- No constitution found — using default compliance checks.

## Technical Context

- Feature: smart brainstorm triggers
- Scenarios: 6 user scenarios defined
- Requirements: 6 functional requirements
- Entities: ToolSelection, SpecSignals, ToolOverride
- Status: draft

## Implementation Phases

### Phase 1: Setup & Configuration

Set up project structure, dependencies, and configuration for the feature.

| File | Action | Description |
|------|--------|-------------|
| `spec/*.spec.yaml` | modify | Update spec file with new models/endpoints |
| `package.json` | modify | Add any new dependencies |

### Phase 2: Data Model

Implement data models and database schema changes.

| File | Action | Description |
|------|--------|-------------|
| `src/models/toolselection.ts` | create | Create ToolSelection model |
| `src/models/specsignals.ts` | create | Create SpecSignals model |
| `src/models/tooloverride.ts` | create | Create ToolOverride model |

### Phase 3: Core Implementation

Implement core business logic for each functional requirement.

| File | Action | Description |
|------|--------|-------------|
| `src/features/smart-brainstorm-triggers/fr_001.ts` | create | Implement FR-001: Spec Content Analyzer |
| `src/features/smart-brainstorm-triggers/fr_002.ts` | create | Implement FR-002: Tool Selection Engine |
| `src/features/smart-brainstorm-triggers/fr_003.ts` | create | Implement FR-003: Keyword-Based Signal Detection |
| `src/features/smart-brainstorm-triggers/fr_004.ts` | create | Implement FR-004: Tool Selection Override via CLI Flags |
| `src/features/smart-brainstorm-triggers/fr_005.ts` | create | Implement FR-005: Selection Summary Output |
| `src/features/smart-brainstorm-triggers/fr_006.ts` | create | Implement FR-006: Selection Result Type |

### Phase 4: API Routes

Create API endpoints for the feature.

| File | Action | Description |
|------|--------|-------------|
| `src/routes/smart-brainstorm-triggers.ts` | create | Feature route handlers |

### Phase 5: Testing

Implement tests for all user scenarios.

| File | Action | Description |
|------|--------|-------------|
| `tests/smart-brainstorm-triggers/us1.test.ts` | create | Test: Brainstorm auto-selects relevant tools based on spec content |
| `tests/smart-brainstorm-triggers/us2.test.ts` | create | Test: Brainstorm skips npm/GitHub for internal-only features |
| `tests/smart-brainstorm-triggers/us3.test.ts` | create | Test: Brainstorm triggers screenshots only for UI/frontend specs |
| `tests/smart-brainstorm-triggers/us4.test.ts` | create | Test: Developer overrides auto-selection with explicit flags |
| `tests/smart-brainstorm-triggers/us5.test.ts` | create | Test: Brainstorm explains which tools were selected and why |
| `tests/smart-brainstorm-triggers/us6.test.ts` | create | Test: Developer excludes specific tools |

