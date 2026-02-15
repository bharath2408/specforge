Generate Playwright MCP E2E tests for your application.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: `specforge test-pw <spec-id>`

This generates Playwright E2E tests for the application being developed using SpecForge — NOT tests for SpecForge itself. Tests are derived from:
- Feature spec user scenarios (Given/When/Then) → scenario test files
- .spec.yaml API endpoints → API test files with request/response validation
- .spec.yaml models → test data factories
- Auth configuration → authentication setup helpers

Options:
- `--run` — Run all generated Playwright tests
- `--headed` — Run in headed browser mode (with --run)
- `--api-only` — Only generate API tests (skip UI/page objects)
- `--base-url <url>` — Application base URL (default: http://localhost:3000)

Generated files:
- `tests/e2e/<spec-slug>.spec.ts` — Scenario tests
- `tests/e2e/api/<model>.spec.ts` — API endpoint tests
- `tests/e2e/fixtures/<model>-factory.ts` — Test data factories
- `tests/e2e/pages/<entity>.ts` — Page objects for UI entities
- `tests/e2e/auth-setup.ts` — Authentication helpers
- `playwright.config.ts` — Playwright configuration

After generation, suggest the next step: `specforge test-pw --run` to execute the tests, or `specforge test-e2e` to run CLI E2E tests.