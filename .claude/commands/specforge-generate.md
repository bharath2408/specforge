Generate code from the spec.

First run `specforge validate` to check the spec is valid.
If $ARGUMENTS is provided, use it as plugin filter (e.g., "docs", "middleware").

Run: `specforge generate` or `specforge generate -p <plugins>`

Available plugins: model, prisma, fastify, test, docs, middleware, playwright.

Show the user what was generated. Then suggest the next step: `specforge test-pw <spec-id>` to generate Playwright E2E tests for the application.