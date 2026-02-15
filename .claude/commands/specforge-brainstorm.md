Analyze a feature spec, research competitors, and generate value-add suggestions.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: `specforge brainstorm <spec-id>`

Smart tool selection: The brainstorm command automatically analyzes the spec content (entities, requirements, keywords) to decide which research tools to trigger. For example, infrastructure specs skip npm/GitHub search, while UI specs enable screenshots. A tool selection summary is printed before research starts.

Options:
- `--offline` — Skip web research, use heuristic analysis only
- `--urls <urls...>` — Competitor URLs to analyze
- `--skip-screenshots` — Skip taking screenshots
- `--npm-keywords <keywords...>` — Additional npm search keywords
- `--include <tools...>` — Force-enable tools: npm, github, screenshots, all
- `--exclude <tools...>` — Force-disable tools: npm, github, screenshots

This searches npm/GitHub for competitors (when auto-selected or forced), analyzes feature gaps, checks for 16 commonly missing patterns (pagination, caching, rate limiting, RBAC, i18n, audit logging, webhooks, etc.), and produces prioritized suggestions.

After generation, review the brainstorm report with the user and help incorporate high-priority suggestions into the spec. Then suggest running `specforge tasks` to generate a task list.
