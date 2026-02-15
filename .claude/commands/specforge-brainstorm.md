Analyze a feature spec, research competitors, and generate value-add suggestions.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: `specforge brainstorm <spec-id>`

Options:
- `--offline` — Skip web research, use heuristic analysis only
- `--urls <urls...>` — Competitor URLs to analyze
- `--skip-screenshots` — Skip taking screenshots
- `--npm-keywords <keywords...>` — Additional npm search keywords

This searches npm/GitHub for competitors, analyzes feature gaps, checks for 16 commonly missing patterns (pagination, caching, rate limiting, RBAC, i18n, audit logging, webhooks, etc.), and produces prioritized suggestions.

After generation, review the brainstorm report with the user and help incorporate high-priority suggestions into the spec.