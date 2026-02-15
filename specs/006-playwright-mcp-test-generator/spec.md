# Feature Spec: Playwright MCP Test Generator

> Spec ID: 006-playwright-mcp-test-generator
> Created: 2026-02-15

## Status

Status: draft

## Overview

Add a new SpecForge generator plugin (`playwright`) and a new CLI command (`specforge test-pw`) that generates Playwright MCP E2E tests for the application being developed using SpecForge. The tests are derived from the feature spec's user scenarios (Given/When/Then), functional requirements, and API endpoints defined in `.spec.yaml`. This allows developers to get production-ready E2E test suites automatically from their specs — testing their actual application, not SpecForge itself.

## User Scenarios

### [US1] [P1] Generate Playwright tests from user scenarios

**Given** a feature spec `001-user-authentication/spec.md` with 3 user scenarios (login, logout, expired token)
**When** the developer runs `specforge test-pw 001-user-authentication`
**Then** Playwright test files are generated in `tests/e2e/001-user-authentication.spec.ts` with test cases mapped to each Given/When/Then scenario

### [US2] [P1] Generate API E2E tests from .spec.yaml endpoints

**Given** an `app.spec.yaml` with `/api/v1/users` endpoint (CRUD actions: list, get, create, update, delete)
**When** the developer runs `specforge generate -p playwright`
**Then** Playwright API test files are generated in `tests/e2e/api/users.spec.ts` that test each endpoint action with request/response validation

### [US3] [P1] Generated tests use Playwright MCP for browser interactions

**Given** a feature spec for a UI feature like "admin dashboard" with scenarios involving page navigation, form submission, and data display
**When** Playwright tests are generated
**Then** the tests use Playwright MCP patterns — `page.goto()`, `page.fill()`, `page.click()`, `expect(page.locator(...))` — with proper selectors based on entity names and form fields

### [US4] [P2] Generate test fixtures and page objects from entities

**Given** a feature spec with entities Session, Token, and User
**When** tests are generated
**Then** a `fixtures/` directory is created with test data factories for each entity, and a `pages/` directory with page object models for UI entities

### [US5] [P2] Tests include authentication setup from spec auth rules

**Given** a `.spec.yaml` with auth strategy `jwt` and endpoints requiring `authenticated` or `admin` access
**When** Playwright tests are generated
**Then** the tests include `beforeAll` hooks that authenticate as the required role, store the auth token, and pass it in request headers

### [US6] [P2] Developer runs generated tests with a single command

**Given** generated Playwright tests in `tests/e2e/`
**When** the developer runs `specforge test-pw --run`
**Then** the Playwright test runner executes all generated tests against the running application and reports results

### [US7] [P3] Generate tests for edge cases from spec

**Given** a feature spec with edge cases listed (e.g., "invalid credentials return 401", "concurrent sessions")
**When** tests are generated
**Then** each edge case gets a dedicated test case with descriptive name and the expected error behavior

## Functional Requirements

### [FR-001] Playwright Generator Plugin

Create a new generator plugin `playwright` that plugs into the existing `specforge generate` system:
- Reads `.spec.yaml` models and endpoints
- Generates API test files for each endpoint with all CRUD actions
- Generates request/response type assertions based on model fields
- Outputs to `tests/e2e/api/` directory

### [FR-002] Feature Spec to Playwright Test Mapper

Create a mapper that converts feature spec user scenarios into Playwright tests:
- Each `[US]` scenario becomes a `test()` block
- `Given` maps to `beforeEach` setup or test preconditions
- `When` maps to the action (API call, page interaction)
- `Then` maps to `expect()` assertions
- Priority determines test order: P1 first, then P2, then P3

### [FR-003] Playwright MCP Page Object Generator

For UI-related specs (detected by entity names and keywords like form, page, dashboard):
- Generate page object classes in `tests/e2e/pages/`
- Each UI entity gets a page object with locators derived from field names
- Methods generated for common actions: `fill()`, `submit()`, `navigate()`, `waitForLoad()`

### [FR-004] Test Data Factory Generator

Generate test data factories in `tests/e2e/fixtures/`:
- One factory per model entity from `.spec.yaml`
- Factories produce valid test data based on field types, constraints (min/max, unique, enum values)
- Support `override()` pattern for custom test data
- Handle relations between entities (e.g., Post needs a valid User)

### [FR-005] Auth Setup Generator

When `.spec.yaml` defines auth strategy:
- Generate `tests/e2e/auth-setup.ts` with login helper
- Generate auth fixtures that provide authenticated contexts
- Map endpoint auth levels to test setup: `public` (no auth), `authenticated` (regular user token), `admin` (admin token), `owner` (resource owner token)

### [FR-006] CLI Command `specforge test-pw`

New command with options:
- `specforge test-pw <spec-id>` — Generate Playwright tests from a feature spec
- `specforge test-pw --run` — Run all generated Playwright tests
- `specforge test-pw --run --headed` — Run in headed browser mode
- `specforge test-pw --api-only` — Only generate API tests (skip UI/page objects)
- `specforge test-pw --base-url <url>` — Set the application base URL (default: `http://localhost:3000`)

### [FR-007] Playwright Config Generator

Generate `playwright.config.ts` if not exists:
- Base URL from `--base-url` or default
- Test directory: `tests/e2e/`
- Projects: `api` (no browser) and `ui` (chromium)
- Reporter: HTML + list
- Timeout: 30s per test
- Retries: 1 in CI, 0 locally

### [FR-008] Test Template System

Use Handlebars templates (like existing plugins) for test generation:
- `api-test.hbs` — API endpoint test template
- `scenario-test.hbs` — User scenario test template
- `page-object.hbs` — Page object class template
- `data-factory.hbs` — Test data factory template
- `auth-setup.hbs` — Authentication setup template

## Key Entities

- **PlaywrightTestFile** — Generated test file with imports, describe blocks, and test cases
- **ScenarioTestCase** — A single test derived from a user scenario (Given/When/Then)
- **PageObject** — Generated page object class for UI entity interaction
- **DataFactory** — Test data factory for generating valid entity instances
- **AuthFixture** — Authentication setup for protected endpoint testing
- **TestConfig** — Generated Playwright configuration

## Success Criteria

- Running `specforge generate -p playwright` produces compilable Playwright test files
- Each user scenario in spec.md maps to exactly one test case
- Each CRUD endpoint in .spec.yaml gets test coverage for all actions
- Generated tests pass type checking with `npx tsc --noEmit`
- Auth setup correctly generates tokens for each auth level
- Data factories produce valid data that passes model validation
- Generated playwright.config.ts works with `npx playwright test` without modification

## Edge Cases

- Spec with no endpoints (only feature spec) — generate scenario tests only, skip API tests
- Spec with no user scenarios — generate API tests only from .spec.yaml
- Endpoint with no auth — skip auth setup for those tests
- Model with relation fields — data factory creates related entities first
- Enum fields — factory generates random valid enum value
- Spec with UI and API scenarios mixed — generate both page objects and API tests
- Empty spec.yaml models section — skip data factory generation
- Existing tests directory — don't overwrite, add alongside existing tests

## Error Handling

- If playwright is not installed, print: "Install Playwright first: `npm install -D @playwright/test`"
- If no `.spec.yaml` exists, print: "No spec file found. Run `specforge init` first."
- If feature spec has no scenarios and no endpoints exist, print: "Nothing to generate — add scenarios to spec.md or endpoints to .spec.yaml"

## Authentication

Not applicable — this is a local code generation tool. Generated auth tests use mock/test credentials.

## Open Questions

- Should generated tests use `@playwright/test` API testing directly or go through the browser for API calls too?
- Should we support generating tests for GraphQL endpoints in addition to REST?
- Should the test data factories use a library like `faker` or generate simple static data?
