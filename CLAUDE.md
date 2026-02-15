<!-- specforge:start -->
# SpecForge — Spec-Driven Development Workflow

This project uses **SpecForge** for spec-driven development.

## When Working on This Project

Always follow the SpecForge workflow. Spec first, code second.

## The SpecForge Workflow

Follow this order when implementing features:

### 1. Constitution (once per project)
```bash
specforge constitution
```
Creates `memory/constitution.md` with 9 guiding principles. Always check the constitution before making architectural decisions.

### 2. Define Feature Spec
```bash
specforge specify <feature-name>
```
Creates `specs/NNN-feature-name/spec.md`. Edit this file to define:
- User Scenarios (Given-When-Then with P1/P2/P3 priorities)
- Functional Requirements (FR-001, FR-002, ...)
- Key Entities, Success Criteria, Edge Cases

### 3. Clarify Ambiguities
```bash
specforge clarify <spec-id>
```
Scans the spec for 10 categories of ambiguity. Fix findings before proceeding.

### 4. Review Spec Quality
```bash
specforge review <spec-id>
```
Scores the spec on 5 dimensions (completeness, clarity, testability, feasibility, consistency) out of 100. Use `--strict` for stricter thresholds, `--ci --min-score 70` in CI.

### 5. Generate Plan
```bash
specforge plan <spec-id>
```
Creates `plan.md` + `data-model.md` with implementation phases and file changes.

### 6. Brainstorm
```bash
specforge brainstorm <spec-id>
```
Researches competitors and suggests value-add features. Auto-selects which tools (npm, GitHub, screenshots) to trigger based on spec content. Use `--include`/`--exclude` to override.

### 7. Generate Tasks
```bash
specforge tasks <spec-id>
```
Creates `tasks.md` with [T001]-style tasks, dependencies, and parallel markers.

### 8. Analyze Consistency
```bash
specforge analyze [spec-id]
```
Cross-checks spec vs plan vs tasks vs .spec.yaml models.

### 9. Generate Code
```bash
specforge validate
specforge generate
```

### 10. Check Diff
```bash
specforge diff -v
```

## Available Plugins
- `model` — TypeScript interfaces
- `prisma` — Prisma schema
- `fastify` — Fastify routes
- `test` — Vitest test stubs
- `docs` — OpenAPI + ER diagram + API docs
- `middleware` — Auth + validation + error handler

## Key Rules
1. **Spec first, code second** — Always update the spec before writing code
2. **Check the constitution** — Read `memory/constitution.md` before architectural decisions
3. **Run the full pipeline** — specify > clarify > review > plan > brainstorm > tasks > analyze > generate
4. **Use analyze** — Run `specforge analyze` to catch inconsistencies
5. **Use review** — Run `specforge review` to score spec quality before planning
6. **Keep in sync** — Run `specforge update` after upgrading the CLI globally

## Project Structure
```
spec/app.spec.yaml          # API spec (models, endpoints, tests)
specs/NNN-feature/           # Feature specs, plans, tasks
memory/constitution.md       # Project principles
docs/                        # Generated API docs + OpenAPI + ER diagram
```
<!-- specforge:end -->
