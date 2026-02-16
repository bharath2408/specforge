Run the full implementation pipeline for an existing feature spec.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: `specforge implement <spec-id>`

This runs the entire pipeline automatically:
1. Clarify — scan for ambiguities (skipped if already done)
2. Plan — generate implementation plan (skipped if already done)
3. Tasks — generate task list (skipped if already done)
4. Analyze — consistency check
5. Validate — check .spec.yaml
6. Generate — generate all code
7. Updates spec status to "in-progress"

It then shows a full implementation summary with task execution order, file changes, and next steps.

Use `--skip-generate` to skip code generation. Use `-p docs middleware` to select specific plugins.