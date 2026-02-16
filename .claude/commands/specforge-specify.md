Create a new feature spec using SpecForge.

Ask the user for a feature name if not provided as $ARGUMENTS, then run:
`specforge specify <feature-name>`

This creates `specs/NNN-feature-name/spec.md` with structured sections:
User Scenarios (Given-When-Then with P1/P2/P3), Functional Requirements (FR-001, FR-002), Key Entities, Success Criteria, Edge Cases, Open Questions.

After creation, help the user fill in the spec with real details for their feature, then suggest running `specforge clarify` to check for ambiguities.