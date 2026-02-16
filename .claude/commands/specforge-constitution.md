Create or view the project constitution.

Run `specforge constitution` in the current project directory. This creates `memory/constitution.md` with 9 guiding articles:
Library-First, CLI Mandate, Test-First, Simplicity, Anti-Abstraction, Documentation as Code, Backward Compatibility, Single Responsibility, Spec-Driven Development.

If the constitution already exists, show its contents. If the user wants to add an amendment, run:
`specforge constitution --amend "description" --article <article-id>`