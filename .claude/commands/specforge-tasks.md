Generate a task list from a feature spec.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: `specforge tasks <spec-id>`

This generates `tasks.md` with [T001]-style task IDs, priority levels (P1/P2/P3), scenario references, dependency tracking, parallel opportunity markers, across 4 phases: Setup > Foundational > User Stories > Polish.

After generation, suggest running `specforge analyze` to check consistency.