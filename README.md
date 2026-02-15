# SpecForge

Spec-Driven Development Kit by **d2railabs** — Define your API with YAML specs, generate production-ready code.

## Features

- **Spec-first workflow**: Define models and endpoints in `.spec.yaml` files
- **Code generation**: Generate models, Prisma schemas, Fastify routes, tests, docs, and middleware
- **Full development lifecycle**: Constitution → Specify → Clarify → Plan → Tasks → Analyze → Implement
- **Diff & Watch**: See what would change before generating, auto-validate on spec changes
- **GitHub integration**: Create issues from generated tasks
- **Claude Code integration**: Auto-configures CLAUDE.md and slash commands on init

## Quick Start

```bash
# Install globally
pnpm add -g specforge

# Create a new project
npx create-specforge my-app
cd my-app

# Or initialize in an existing project
specforge init .

# Define your spec in spec/*.spec.yaml, then:
specforge validate
specforge generate
```

## Commands

| Command | Description |
|---------|-------------|
| `specforge init [name]` | Scaffold a new project or init in existing one |
| `specforge validate` | Validate spec YAML files |
| `specforge generate` | Generate code from specs |
| `specforge constitution` | Create/amend project constitution |
| `specforge specify <name>` | Create a structured feature spec |
| `specforge clarify <spec-id>` | Scan spec for ambiguities |
| `specforge plan <spec-id>` | Generate implementation plan |
| `specforge tasks <spec-id>` | Generate dependency-ordered task list |
| `specforge analyze [spec-id]` | Cross-artifact consistency check |
| `specforge implement <spec-id>` | Run full pipeline (clarify → plan → tasks → analyze → generate) |
| `specforge diff` | Show what generate would change |
| `specforge watch` | Watch specs and auto-validate |
| `specforge issues <spec-id>` | Create GitHub Issues from tasks |
| `specforge remove` | Remove SpecForge from project |

## Spec File Format

```yaml
name: User
tableName: users
fields:
  - name: id
    type: uuid
    primary: true
  - name: email
    type: string
    unique: true
    validations:
      - type: email
  - name: name
    type: string
    validations:
      - type: minLength
        value: 2

endpoints:
  - method: GET
    path: /users
    description: List all users
  - method: POST
    path: /users
    description: Create a new user
    body:
      - field: email
        required: true
      - field: name
        required: true
```

## Generator Plugins

- **model** — TypeScript interfaces and Zod schemas
- **prisma** — Prisma schema models
- **fastify** — Fastify route handlers
- **test** — Vitest test suites
- **docs** — OpenAPI 3.0 spec, Mermaid ER diagrams, API README
- **middleware** — JWT auth, request validation, error handler

## Monorepo Structure

```
packages/
  core/        — Types, validation, spec parsing, planning logic
  cli/         — Commander.js CLI with 15 commands
  generator/   — Handlebars-based code generation with 6 plugins
  create-specforge/ — Project scaffolding (npx create-specforge)
```

## License

ISC
