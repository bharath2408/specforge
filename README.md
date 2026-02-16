# SpecForge

Spec-Driven Development Kit — Define features with structured specs, generate production-ready code, and ship with confidence.

## What is SpecForge?

SpecForge is a complete spec-driven development toolkit that takes you from idea to implementation through a structured pipeline. You define your features as structured markdown specs, and SpecForge guides you through clarification, planning, competitive analysis, task generation, consistency checks, and code generation.

## Development Lifecycle

SpecForge follows a phased workflow. Each phase produces a markdown artifact that feeds into the next:

```
init → constitution → specify → clarify → review → plan → brainstorm → tasks → analyze → generate → test-pw → test-e2e
                                                                                                                          │
                                                                                                         issues ← implement
```

| Phase | Command | Input | Output | Purpose |
|-------|---------|-------|--------|---------|
| **Setup** | `init` | — | Project scaffold | Create project structure with example spec |
| **Governance** | `constitution` | — | `constitution.md` | Define 9 guiding principles for the project |
| **Define** | `specify` | Feature name | `spec.md` | Create structured feature spec with scenarios |
| **Clarify** | `clarify` | `spec.md` | `clarification-log.md`, `implementation.md` | Scan for ambiguities and generate implementation notes |
| **Review** | `review` | `spec.md` | `review-report.md` | Score spec quality on 5 dimensions (0–100) |
| **Plan** | `plan` | `spec.md` | `plan.md`, `data-model.md` | Generate implementation plan with phases |
| **Brainstorm** | `brainstorm` | `spec.md`, `plan.md` | `brainstorm-report.md` | Research competitors and suggest value-add features |
| **Tasks** | `tasks` | `spec.md` | `tasks.md` | Generate prioritized, dependency-ordered task list |
| **Analyze** | `analyze` | All artifacts | `analysis-report.md` | Cross-artifact consistency check |
| **Generate** | `generate` | `.spec.yaml` | Source code | Generate models, routes, tests, schemas |
| **App Tests** | `test-pw` | `spec.md`, `.spec.yaml` | Playwright tests | Generate Playwright MCP E2E tests for your app |
| **CLI Tests** | `test-e2e` | All commands | HTML report | Playwright E2E tests for all CLI commands |
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

Scan a spec for ambiguities across 15 categories and generate clarification questions.

```bash
specforge clarify 001-user-authentication
```

Checks for: placeholder text, empty sections, missing priorities, undefined entities, unclear acceptance criteria, missing edge cases, undefined auth rules, missing error handling, incomplete data models, ambiguous terminology, entity relationships, open question suggestions, cross-spec alignment, scenario-entity coverage, and implicit entity detection.

Outputs a coverage table and writes two files:
- `clarification-log.md` — flat log of all findings and coverage table
- `implementation.md` — structured implementation notes with entity map, prioritized recommendations, open question context, cross-references (spec vs .spec.yaml), and reusable patterns from previous specs

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

**Smart tool selection:** The brainstorm command automatically analyzes spec content (entities, requirements, keywords) to decide which research tools to trigger. Infrastructure specs skip npm/GitHub search, UI specs enable screenshots, and specs with protocol keywords (OAuth, JWT, GraphQL) trigger GitHub search. A tool selection summary is printed before research starts.

```bash
specforge brainstorm 001-user-authentication                    # Auto-select tools based on spec
specforge brainstorm 001-user-authentication --offline          # Heuristics only
specforge brainstorm 001-user-authentication --urls https://auth0.com https://clerk.com
specforge brainstorm 001-user-authentication --include all      # Force all tools on
specforge brainstorm 001-user-authentication --exclude npm,github  # Force specific tools off
specforge brainstorm 001-user-authentication --npm-keywords oauth jwt
```

**Options:**

| Option | Description |
|--------|-------------|
| `--offline` | Skip web research and screenshots, use heuristic analysis only |
| `--urls <urls...>` | Competitor URLs to analyze |
| `--skip-screenshots` | Skip taking screenshots (still does research) |
| `--npm-keywords <kw...>` | Additional npm search keywords |
| `--include <tools...>` | Force-enable tools: `npm`, `github`, `screenshots`, `all` |
| `--exclude <tools...>` | Force-disable tools: `npm`, `github`, `screenshots` |

**What it does:**

1. Analyzes spec content for keyword signals across 4 categories (npm, UI, infrastructure, protocol)
2. Auto-selects which research tools to enable based on spec domain and signals
3. Prints a tool selection summary showing ON/OFF for each tool with reasons
4. Extracts search keywords from spec entities, requirements, and scenarios
5. Searches npm registry and GitHub for similar/competing projects (when selected)
6. Fetches and analyzes user-provided competitor URLs
7. Captures competitor screenshots (when selected, requires Chrome/Chromium)
8. Generates side-by-side comparison image
9. Checks for 16 commonly missing patterns (pagination, caching, rate limiting, RBAC, i18n, audit logging, webhooks, export/import, etc.)
10. Produces prioritized suggestions (P1/P2/P3) with rationale

**Tool selection logic:**

| Tool | Auto-enabled when | Auto-skipped when |
|------|-------------------|-------------------|
| npm search | Auth, validation, payment, or other library keywords detected | Infrastructure/internal features |
| GitHub search | Protocol keywords (OAuth, JWT, GraphQL) or high external dependency likelihood | Tightly coupled to project internals |
| URL fetch | User provides `--urls` | No URLs provided |
| Screenshots | UI/frontend spec AND competitor URLs available | Backend/CLI/infrastructure features |
| Heuristics | Always | Never |

**Output:** `brainstorm-report.md` with sections:
- Competitors Analyzed (table)
- Feature Gap Analysis (matrix)
- Feature Comparison Matrix (spec vs competitors)
- Value-Add Suggestions (VA-001, VA-002, etc.)
- Competitor Screenshots (if captured)
- Recommendations Summary (P1/P2/P3)

**Edge cases handled:**
- Insufficient keyword signals: falls back to enabling all tools
- Offline mode works with 0 competitors using heuristic analysis
- Network failures auto-fallback to offline
- Chrome not found: skips screenshots with warning
- GitHub rate limit (403/429): warns and suggests `GITHUB_TOKEN`
- `--include` and `--exclude` both specified for same tool: `--exclude` wins

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

#### `specforge test-pw [spec-id] [options]`

Generate Playwright MCP E2E tests for your application from feature specs and `.spec.yaml` endpoints.

```bash
specforge test-pw 001-user-auth           # Generate tests from a feature spec
specforge test-pw --api-only              # Only generate API tests
specforge test-pw --run                   # Run all generated tests
specforge test-pw --run --headed          # Run in headed browser mode
specforge test-pw --base-url http://localhost:4000
```

**Options:**

| Option | Description |
|--------|-------------|
| `--run` | Run all generated Playwright tests |
| `--headed` | Run in headed browser mode (with --run) |
| `--api-only` | Only generate API tests (skip UI/page objects) |
| `--base-url <url>` | Application base URL (default: `http://localhost:3000`) |

**What it generates:**

- `tests/e2e/<spec-slug>.spec.ts` — Scenario tests from Given/When/Then
- `tests/e2e/api/<model>.spec.ts` — API endpoint tests with request/response validation
- `tests/e2e/fixtures/<model>-factory.ts` — Test data factories for each model
- `tests/e2e/pages/<entity>.ts` — Page objects for UI entities
- `tests/e2e/auth-setup.ts` — Authentication helpers (when spec has auth strategy)
- `playwright.config.ts` — Playwright configuration

Also available as a generator plugin: `specforge generate -p playwright`

#### `specforge test-e2e [options]`

Run Playwright E2E tests against all SpecForge CLI commands.

```bash
specforge test-e2e                        # Run all 51 tests
specforge test-e2e --command brainstorm   # Test a specific command
specforge test-e2e --suite pipeline       # Run the 10-step pipeline test
specforge test-e2e --suite errors         # Run error handling tests
specforge test-e2e --workers 1            # Single worker (sequential)
```

**Options:**

| Option | Description |
|--------|-------------|
| `--command <name>` | Test a specific command (e.g., brainstorm, review, init) |
| `--suite <name>` | Run a test suite: `pipeline`, `errors`, or a command name |
| `--workers <n>` | Number of parallel workers |

Tests run in temporary directories, validate stdout/stderr, exit codes, and generated file contents. The pipeline suite runs all 10 steps sequentially to verify the full workflow.

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
| **playwright** | `tests/e2e/` | Playwright MCP E2E tests, data factories, auth setup |

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
│       ├── implementation.md    # Implementation notes (entity map, recommendations)
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
├── cli/               — Commander.js CLI with 19 commands
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
