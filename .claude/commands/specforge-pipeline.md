Run the SpecForge spec-driven development pipeline one step at a time.

Ask the user for a feature name if not provided as $ARGUMENTS.

Run ONE step at a time. After each step completes, show the result and suggest the next step — do NOT run the next step automatically. Wait for the user to confirm before proceeding.

Pipeline steps:
1. Check if SpecForge is initialized (`spec/` exists). If not, suggest: `specforge init .`
2. Check if constitution exists (`memory/constitution.md`). If not, suggest: `specforge constitution`
3. Suggest: `specforge specify <feature-name>`
4. Help the user fill in spec.md with real details
5. Suggest: `specforge clarify <spec-id>`
6. Suggest: `specforge review <spec-id>`
7. Suggest: `specforge plan <spec-id>`
8. Suggest: `specforge brainstorm <spec-id>`
9. Suggest: `specforge tasks <spec-id>`
10. Suggest: `specforge analyze <spec-id>`
11. Suggest: `specforge generate`
12. Suggest: `specforge test-pw <spec-id>`

After each step, tell the user what was produced and ask if they want to continue to the next step.