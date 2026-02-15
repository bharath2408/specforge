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

### 4. Generate Plan
```bash
specforge plan <spec-id>
```
Creates `plan.md` + `data-model.md` with implementation phases and file changes.

### 5. Generate Tasks
```bash
specforge tasks <spec-id>
```
Creates `tasks.md` with [T001]-style tasks, dependencies, and parallel markers.

### 6. Analyze Consistency
```bash
specforge analyze [spec-id]
```
Cross-checks spec vs plan vs tasks vs .spec.yaml models.

### 7. Generate Code
```bash
specforge validate
specforge generate
```

### 8. Check Diff
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
3. **Run the full pipeline** — specify > clarify > plan > tasks > analyze > generate
4. **Use analyze** — Run `specforge analyze` to catch inconsistencies

## Project Structure
```
spec/app.spec.yaml          # API spec (models, endpoints, tests)
specs/NNN-feature/           # Feature specs, plans, tasks
memory/constitution.md       # Project principles
docs/                        # Generated API docs + OpenAPI + ER diagram
```
<!-- specforge:end -->
