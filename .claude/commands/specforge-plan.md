Generate an implementation plan from a feature spec.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: `specforge plan <spec-id>`

This generates `plan.md` (phases, constitutional compliance, file changes) and `data-model.md` (ER diagram + entity details) in the spec directory.

After generation, review the plan with the user and suggest running `specforge brainstorm` to research competitors, or `specforge tasks` to generate a task list.