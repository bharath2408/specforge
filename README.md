# SpecForge

Spec-Driven Development Kit — Define features with structured specs, generate production-ready code, and ship with confidence.

## What is SpecForge?

SpecForge is a complete spec-driven development toolkit that takes you from idea to implementation through a structured pipeline. You define your features as structured markdown specs, and SpecForge guides you through clarification, planning, competitive analysis, task generation, consistency checks, and code generation.

## Development Lifecycle

SpecForge follows a phased workflow. Each phase produces a markdown artifact that feeds into the next:

```
init → constitution → specify → clarify → plan → brainstorm → tasks → analyze → generate
                                                                                     │
                                                                    issues ← implement ← test
```

| Phase | Command | Input | Output | Purpose |
|-------|---------|-------|--------|---------|
| **Setup** | `init` | — | Project scaffold | Create project structure with example spec |
| **Governance** | `constitution` | — | `constitution.md` | Define 9 guiding principles for the project |
| **Define** | `specify` | Feature name | `spec.md` | Create structured feature spec with scenarios |
| **Clarify** | `clarify` | `spec.md` | `clarification-log.md` | Scan for ambiguities and coverage gaps |
| **Plan** | `plan` | `spec.md` | `plan.md`, `data-model.md` | Generate implementation plan with phases |
| **Brainstorm** | `brainstorm` | `spec.md`, `plan.md` | `brainstorm-report.md` | Research competitors and suggest value-add features |
| **Tasks** | `tasks` | `spec.md` | `tasks.md` | Generate prioritized, dependency-ordered task list |
| **Analyze** | `analyze` | All artifacts | `analysis-report.md` | Cross-artifact consistency check |
| **Generate** | `generate` | `.spec.yaml` | Source code | Generate models, routes, tests, schemas |
| **Implement** | `implement` | `spec.md` | All of the above | Run the full pipeline end-to-end |

## Quick Start

```bash
# Create a new project
npx create-specforge my-app
cd my-app

# Or initialize in an existing project
npx specforge init .

# Define your feature
specforge specify user-authentication

# Walk through the pipeline
specforge clarify 001-user-authentication
specforge plan 001-user-authentication
specforge brainstorm 001-user-authentication
specforge tasks 001-user-authentication
specforge analyze 001-user-authentication

# Or run everything at once
specforge implement 001-user-authentication
```

## Installation

```bash
# Install globally
pnpm add -g @specforge-dev/cli

# Or use npx
npx specforge <command>
```

## Commands

### Project Setup

#### `specforge init [project-name]`

Scaffold a new SpecForge project with example spec, config file, constitution, and Claude Code integration.

```bash
specforge init my-api
specforge init .    # Initialize in current directory
```

Creates:
- `spec/app.spec.yaml` — Example API spec
- `specforge.config.yaml` — Project configuration
- `memory/constitution.md` — Project constitution
- `CLAUDE.md` — Claude Code integration

#### `specforge constitution [options]`

Create or amend the project constitution — 9 guiding principles that govern the project.

```bash
specforge constitution                          # Create default constitution
specforge constitution --amend "Add rate limiting rule" --article A2
```

The 9 default articles: Library-First, CLI Mandate, Test-First, Simplicity, Anti-Abstraction, Documentation as Code, Backward Compatibility, Single Responsibility, Spec-Driven Development.

### Feature Specification

#### `specforge specify <name>`

Create a structured feature spec with user scenarios (Given/When/Then), functional requirements, entities, success criteria, edge cases, and open questions.

```bash
specforge specify user-authentication
specforge specify payment-processing -b    # Also create a git branch
```

Creates `specs/001-user-authentication/spec.md` with:
- User Scenarios (`[US1] [P1]`, `[US2] [P2]`, `[US3] [P3]`)
- Functional Requirements (`[FR-001]`, `[FR-002]`, etc.)
- Key Entities, Success Criteria, Edge Cases, Open Questions

#### `specforge clarify <spec-id>`

Scan a spec for ambiguities across 10 categories and generate clarification questions.

```bash
specforge clarify 001-user-authentication
```

Checks for: placeholder text, empty sections, missing priorities, undefined entities, unclear acceptance criteria, missing edge cases, undefined auth rules, missing error handling, incomplete data models, and ambiguous terminology.

Outputs a coverage table and writes `clarification-log.md`.

### Planning & Analysis

#### `specforge plan <spec-id>`

Generate an implementation plan with phases, file changes, and data model from the feature spec.

```bash
specforge plan 001-user-authentication
```

Produces:
- `plan.md` — Phased implementation plan (Setup, Data Model, Core Logic, API Routes, Testing)
- `data-model.md` — Entity details with Mermaid ER diagram

#### `specforge brainstorm <spec-id> [options]`

Analyze the spec and plan, research competitors on npm and GitHub, identify feature gaps, and generate value-add suggestions.

```bash
specforge brainstorm 001-user-authentication                    # Full online mode
specforge brainstorm 001-user-authentication --offline          # Heuristics only
specforge brainstorm 001-user-authentication --urls https://auth0.com https://clerk.com
specforge brainstorm 001-user-authentication --skip-screenshots
specforge brainstorm 001-user-authentication --npm-keywords oauth jwt
```

**Options:**

| Option | Description |
|--------|-------------|
| `--offline` | Skip web research and screenshots, use heuristic analysis only |
| `--urls <urls...>` | Competitor URLs to analyze |
| `--skip-screenshots` | Skip taking screenshots (still does research) |
| `--npm-keywords <kw...>` | Additional npm search keywords |

**What it does:**

1. Extracts search keywords from spec entities, requirements, and scenarios
2. Searches npm registry and GitHub for similar/competing projects
3. Fetches and analyzes user-provided competitor URLs
4. Captures competitor screenshots (requires Chrome/Chromium installed)
5. Generates side-by-side comparison image
6. Checks for 16 commonly missing patterns (pagination, caching, rate limiting, RBAC, i18n, audit logging, webhooks, export/import, etc.)
7. Produces prioritized suggestions (P1/P2/P3) with rationale

**Output:** `brainstorm-report.md` with sections:
- Competitors Analyzed (table)
- Feature Gap Analysis (matrix)
- Feature Comparison Matrix (spec vs competitors)
- Value-Add Suggestions (VA-001, VA-002, etc.)
- Competitor Screenshots (if captured)
- Recommendations Summary (P1/P2/P3)

**Edge cases handled:**
- Offline mode works with 0 competitors using heuristic analysis
- Network failures auto-fallback to offline
- Chrome not found: skips screenshots with warning
- GitHub rate limit (403/429): warns and suggests `GITHUB_TOKEN`
- Invalid user URLs: logs per-URL errors, continues with others

#### `specforge tasks <spec-id>`

Generate a dependency-ordered, prioritized task list from the spec.

```bash
specforge tasks 001-user-authentication
```

Produces `tasks.md` with tasks organized by phase, each with:
- Task ID and priority (P1/P2/P3)
- Scenario reference
- Dependencies
- Parallel execution flag

#### `specforge analyze [spec-id]`

Run cross-artifact consistency checks across spec, plan, tasks, and constitution.

```bash
specforge analyze 001-user-authentication    # Analyze one spec
specforge analyze                            # Analyze all specs
```

Reports findings by severity (CRITICAL, HIGH, MEDIUM, LOW) and writes `analysis-report.md`. Exits with code 1 if critical issues found.

### Code Generation

#### `specforge generate [options]`

Generate production-ready code from `.spec.yaml` files using plugins.

```bash
specforge generate
specforge generate -p model prisma fastify
specforge generate -s spec/app.spec.yaml -o ./output
```

**Options:**

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Output directory (default: `.`) |
| `-p, --plugins <plugins...>` | Plugins to use |
| `-s, --spec <path>` | Path to spec file |

#### `specforge diff [options]`

Preview what `generate` would change compared to existing files.

```bash
specforge diff
specforge diff -v              # Verbose line-level diffs
specforge diff -p model prisma
```

#### `specforge test`

Run generated test suites.

```bash
specforge test
```

### Pipeline & Integration

#### `specforge implement <spec-id> [options]`

Run the full implementation pipeline in one command: clarify → plan → tasks → analyze → generate.

```bash
specforge implement 001-user-authentication
specforge implement 001-user-authentication --skip-generate
specforge implement 001-user-authentication -p model prisma fastify
```

Skips steps that have already been completed (checks for existing artifacts). Updates spec status to `in-progress`.

#### `specforge issues <spec-id> [options]`

Create GitHub Issues from the generated task list. Requires the GitHub CLI (`gh`).

```bash
specforge issues 001-user-authentication
specforge issues 001-user-authentication --dry-run    # Preview without creating
```

Each issue includes task ID, priority, phase, scenario reference, and dependencies as labels.

#### `specforge watch [options]`

Watch spec files and auto-validate on changes.

```bash
specforge watch
specforge watch --auto-generate    # Also auto-generate on changes
```

#### `specforge update [options]`

Sync project integration files (CLAUDE.md, slash commands) with the currently installed CLI version. Run this after upgrading SpecForge globally to receive new slash commands and updated CLAUDE.md content.

```bash
specforge update             # Sync files to current CLI version
specforge update --dry-run   # Preview changes without writing files
specforge update --force     # Force re-sync even if versions match
```

**Options:**

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview what would change without writing files |
| `--force` | Force update even if the project version matches the CLI version |

**How it works:**

1. Checks for `.specforge/version.yaml` to determine the project's current integration version
2. Compares against the installed CLI version — skips if already up to date
3. Syncs slash commands in `.claude/commands/` — adds new, updates changed, skips matching
4. Updates the managed section of `CLAUDE.md` between `<!-- specforge:start -->` / `<!-- specforge:end -->` markers
5. Writes the new version to `.specforge/version.yaml`

#### `specforge remove [options]`

Remove SpecForge integration from the current project.

```bash
specforge remove             # Preview what will be removed
specforge remove --force     # Remove without confirmation
```

## Generator Plugins

| Plugin | Output | Description |
|--------|--------|-------------|
| **model** | `src/models/*.ts` | TypeScript interfaces and Zod schemas |
| **prisma** | `prisma/schema.prisma` | Prisma schema models |
| **fastify** | `src/routes/*.ts` | Fastify route handlers |
| **test** | `tests/*.test.ts` | Vitest test suites |
| **docs** | `docs/` | OpenAPI 3.0 spec, Mermaid ER diagrams, API README |
| **middleware** | `src/middleware/*.ts` | JWT auth, request validation, error handler |

## Spec File Format

### Feature Spec (`spec.md`)

Created by `specforge specify`. Structured markdown with:

```markdown
# Feature Spec: User Authentication

> Spec ID: 001-user-authentication

## Status
Status: draft

## User Scenarios
### [US1] [P1] User Login
**Given** a registered user
**When** they submit valid credentials
**Then** they receive an access token

## Functional Requirements
### [FR-001] Credential Validation
Validates email/password against stored credentials.

## Key Entities
- **User** — Registered user account
- **Session** — Active user session

## Success Criteria
- All P1 scenarios pass acceptance testing

## Edge Cases
- Invalid credentials after 5 attempts

## Open Questions
- What are the session timeout requirements?
```

### API Spec (`.spec.yaml`)

Used by `specforge generate` for code generation:

```yaml
specforge: "1.0"
name: my-app
version: "0.1.0"

models:
  User:
    fields:
      id:
        type: uuid
        primary: true
      email:
        type: string
        unique: true
        validate: email
      name:
        type: string
        min: 2
        max: 100

api:
  basePath: /api/v1
  endpoints:
    - path: /users
      model: User
      actions: [list, get, create, update, delete]
      auth:
        list: authenticated
        create: admin
```

## Configuration

`specforge.config.yaml` in the project root:

```yaml
specDir: spec          # Directory for .spec.yaml files
outputDir: .           # Code generation output directory
memoryDir: memory      # Constitution and project memory
specsDir: specs        # Feature spec directories
plugins:
  - model
  - prisma
  - fastify
  - test
git:
  autoCreateBranch: false
  branchPrefix: "spec/"
```

## Project Structure

After initialization, your project looks like:

```
my-app/
├── specforge.config.yaml
├── spec/
│   └── app.spec.yaml          # API spec for code generation
├── memory/
│   └── constitution.md        # Project constitution
├── specs/
│   └── 001-user-auth/
│       ├── spec.md              # Feature specification
│       ├── clarification-log.md # Ambiguity scan results
│       ├── plan.md              # Implementation plan
│       ├── data-model.md        # ER diagram and entity details
│       ├── brainstorm-report.md # Competitor analysis and suggestions
│       ├── tasks.md             # Prioritized task list
│       └── analysis-report.md   # Consistency check report
└── CLAUDE.md                    # Claude Code integration
```

## Monorepo Structure

SpecForge is built as a pnpm monorepo with 4 packages:

```
packages/
├── core/              — Types, parsing, validation, planning, brainstorm analysis
├── cli/               — Commander.js CLI with 17 commands
├── generator/         — Handlebars-based code generation with 6 plugins
└── create-specforge/  — Project scaffolding (npx create-specforge)
```

All packages are published under the `@specforge-dev` scope on npm.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Increases GitHub API rate limit for `brainstorm` research (optional) |

## License

ISC
