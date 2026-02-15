Scan a feature spec for ambiguities.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs in the `specs/` directory and ask which one to clarify.

Run: `specforge clarify <spec-id>`

This scans across 10 ambiguity categories: placeholder text, empty sections, missing priorities, undefined entities, unclear acceptance criteria, missing edge cases, undefined auth, missing error handling, incomplete data model, ambiguous terminology.

After showing findings, help the user fix the ambiguities by editing the spec.md file. Then suggest running `specforge review` to score spec quality, or `specforge plan` to generate an implementation plan.