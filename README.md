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
| **Governance** | `constitution` | — | `constitution.md` | Define 9 guiding principles with auto-detected project context |
| **Define** | `specify` | Feature name | `spec.md` | Create structured feature spec with scenarios |
| **Clarify** | `clarify` | `spec.md` | `clarification-log.md`, `implementation.md` | Scan for 15 categories of ambiguity and generate implementation notes |
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

# Define project principles (auto-detects tech stack)
specforge constitution

# Define your feature
specforge specify user-authentication

# Walk through the pipeline
specforge clarify 001-user-authentication
specforge review 001-user-authentication
specforge plan 001-user-authentication
specforge brainstorm 001-user-authentication
specforge tasks 001-user-authentication
specforge analyze 001-user-authentication

# Generate code
specforge validate
specforge generate

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

Scaffold a new SpecForge project with example spec and Claude Code integration (CLAUDE.md + slash commands).

```bash
specforge init my-api
specforge init .    # Initialize in current directory
```

Creates:
- `spec/app.spec.yaml` — Example API spec with models, endpoints, and tests
- `CLAUDE.md` — Claude Code integration with workflow instructions
- `.claude/commands/` — 16 slash commands for Claude Code
- `.specforge/version.yaml` — CLI version tracking for `specforge update`

When creating a new project (not init in-place), also scaffolds `package.json`, `tsconfig.json`, and `src/` directory structure.

#### `specforge constitution [options]`

Create or amend the project constitution — 9 guiding principles that govern the project, with auto-detected project context.

```bash
specforge constitution                          # Create with auto project analysis
specforge constitution --skip-analysis          # Skip project analysis
specforge constitution --amend "Add rate limiting rule" --article A2
```

**Auto-analysis** (enabled by default): Detects your project's tech stack (frameworks, ORM, testing, bundler, CSS), classifies the project type (frontend/backend/fullstack/library/CLI/monorepo), and generates a "Project Context" section with architecture flow and best practices. Use `--skip-analysis` to skip. For new projects without `package.json`, interactive prompts ask for project details.

**Options:**

| Option | Description |
|--------|-------------|
| `--amend <description>` | Add an amendment to the constitution |
| `--article <id>` | Article ID affected by the amendment |
| `--skip-analysis` | Skip project analysis and create constitution without Project Context |

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

Scan a spec for ambiguities across 15 categories and generate implementation notes.

```bash
specforge clarify 001-user-authentication
```

**15 ambiguity categories:**

| Category | What it checks |
|----------|---------------|
| Placeholder text | Detects TODO, TBD, placeholder content |
| Empty sections | Sections with no content |
| Missing priorities | Scenarios without P1/P2/P3 |
| Undefined entities | Referenced but not listed in Key Entities |
| Unclear acceptance criteria | Vague success criteria |
| Missing edge cases | Scenarios without edge case coverage |
| Undefined auth | Auth-related actions without auth rules |
| Missing error handling | No error/failure scenarios |
| Incomplete data model | Entities missing field definitions |
| Ambiguous terminology | Terms used inconsistently |
| Entity relationships | Implicit relationships from scenario verb patterns (adds X to Y, belongs to, contains) |
| Open question suggestions | Open questions that may be answerable from existing spec content |
| Cross-spec alignment | Key Entities vs `.spec.yaml` model mismatches |
| Scenario-entity coverage | Entities not appearing in any scenario |
| Implicit entity detection | PascalCase words and article+Capitalized patterns in scenarios not listed in Key Entities |

**Outputs:**
- `clarification-log.md` — Flat log of all findings with coverage table
- `implementation.md` — Structured implementation notes with entity map, prioritized recommendations, open question context, cross-references (spec vs `.spec.yaml`), and reusable patterns from previous specs

#### `specforge review <spec-id> [options]`

Score a feature spec on 5 quality dimensions (0–20 each, totaling 0–100).

```bash
specforge review 001-user-authentication
specforge review 001-user-authentication --strict
specforge review 001-user-authentication --ci --min-score 70
specforge review 001-user-authentication --focus completeness clarity
```

**Dimensions:**

| Dimension | What it measures |
|-----------|-----------------|
| Completeness | Are all sections present and populated? |
| Clarity | Are descriptions specific and unambiguous? |
| Testability | Can requirements be verified? |
| Feasibility | Is scope realistic? |
| Consistency | Do sections cross-reference correctly? |

**Verdicts:** EXCELLENT (≥80), GOOD (≥60), NEEDS_WORK (≥40), POOR (<40)

**Options:**

| Option | Description |
|--------|-------------|
| `--focus <areas...>` | Only score specific dimensions |
| `--strict` | Use stricter scoring thresholds |
| `--ci` | CI mode: exit with code 1 if below `--min-score` or verdict is POOR |
| `--min-score <n>` | Minimum passing score for `--ci` mode |

Outputs `review-report.md` with score table and top suggestions for improvement.

### Planning & Analysis

#### `specforge plan <spec-id>`

Generate an implementation plan with phases, file changes, and data model from the feature spec.

```bash
specforge plan 001-user-authentication
```

Produces:
- `plan.md` — Phased implementation plan (Setup, Data Model, Core Logic, API Routes, Testing) with constitutional compliance
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

Produces `tasks.md` with tasks organized across 4 phases (Setup > Foundational > User Stories > Polish), each with:
- Task ID (`[T001]`) and priority (P1/P2/P3)
- Scenario reference
- Dependencies
- Parallel execution markers

#### `specforge analyze [spec-id]`

Run cross-artifact consistency checks across spec, plan, tasks, constitution, and `.spec.yaml` models.

```bash
specforge analyze 001-user-authentication    # Analyze one spec
specforge analyze                            # Analyze all specs
```

Reports findings by severity:
- **CRITICAL** — Constitution compliance violations
- **HIGH** — Coverage gaps
- **MEDIUM** — Missing tests
- **LOW** — Naming issues, entity mismatches

Writes `analysis-report.md`. Exits with code 1 if critical issues found.

### Code Generation

#### `specforge validate [spec-path]`

Validate `.spec.yaml` files against the schema. Shows model, endpoint, and test counts.

```bash
specforge validate
specforge validate spec/app.spec.yaml
```

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

Shows `[ADD]`, `[MOD]`, and unchanged file counts with optional line-level diffs.

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
specforge test-e2e                        # Run all tests
specforge test-e2e --command brainstorm   # Test a specific command
specforge test-e2e --suite pipeline       # Run the full pipeline test
specforge test-e2e --suite errors         # Run error handling tests
specforge test-e2e --workers 1            # Single worker (sequential)
```

**Options:**

| Option | Description |
|--------|-------------|
| `--command <name>` | Test a specific command (e.g., brainstorm, review, init) |
| `--suite <name>` | Run a test suite: `pipeline`, `errors`, or a command name |
| `--workers <n>` | Number of parallel workers |

Tests run in temporary directories, validate stdout/stderr, exit codes, and generated file contents. The pipeline suite runs all steps sequentially to verify the full workflow.

### Pipeline & Integration

#### `specforge implement <spec-id> [options]`

Run the full implementation pipeline in one command.

```bash
specforge implement 001-user-authentication
specforge implement 001-user-authentication --skip-generate
specforge implement 001-user-authentication -p model prisma fastify
```

**Pipeline steps** (auto-skips if artifacts already exist):

1. **Clarify** — Scan for ambiguities (skipped if `clarification-log.md` exists)
2. **Plan** — Generate implementation plan (skipped if `plan.md` exists)
3. **Tasks** — Generate task list (skipped if `tasks.md` exists)
4. **Analyze** — Cross-artifact consistency check (always runs)
5. **Validate** — Check `.spec.yaml` (unless `--skip-generate`)
6. **Generate** — Generate code via plugins (unless `--skip-generate`)
7. **Status Update** — Updates spec status to `in-progress`

Shows a full implementation summary with task execution order, file changes, dependency graph, and next steps.

**Options:**

| Option | Description |
|--------|-------------|
| `--skip-generate` | Skip code generation step |
| `-p, --plugins <plugins...>` | Plugins to use for generation |

#### `specforge issues <spec-id> [options]`

Create GitHub Issues from the generated task list. Requires the GitHub CLI (`gh`).

```bash
specforge issues 001-user-authentication
specforge issues 001-user-authentication --dry-run    # Preview without creating
```

Each issue includes task ID, priority, phase, scenario reference, and dependencies as labels.

#### `specforge watch [options]`

Watch spec files and auto-validate on changes. Watches `spec/` and `specs/` directories with debounced validation.

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

Removes: `spec/`, `specs/`, `memory/`, `CLAUDE.md`, `.claude/commands/specforge-*.md`, `.specforge/`

### Custom Commands

#### `specforge command add <name>`

Register a custom command shortcut with variable support.

```bash
specforge command add deploy --run "git push {remote} {branch}" --description "Push to remote"
specforge command add lint --run "eslint src/" --alias l
```

Variables use `{name}` syntax and are substituted from positional args or `--name` flags when the command is run.

#### `specforge command list`

List all registered custom commands with aliases and descriptions.

```bash
specforge command list
```

#### `specforge command edit <name>`

Update an existing custom command.

```bash
specforge command edit deploy --run "git push {remote} {branch} --force"
specforge command edit deploy --description "Force push to remote"
specforge command edit deploy --alias d
```

#### `specforge command remove <name>`

Remove a custom command.

```bash
specforge command remove deploy
```

#### `specforge command show <name>`

Show details of a custom command including its run string, alias, description, and variables.

```bash
specforge command show deploy
```

Custom commands are stored in `.specforge/custom-commands.yaml`. Built-in commands are protected and cannot be overridden.

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

## Claude Code Integration

SpecForge includes first-class Claude Code integration. Running `specforge init` creates:

- **`CLAUDE.md`** — Project instructions with the full SpecForge workflow, managed between `<!-- specforge:start -->` / `<!-- specforge:end -->` markers
- **16 slash commands** in `.claude/commands/` for Claude Code:

| Slash Command | Purpose |
|---------------|---------|
| `/specforge-init` | Initialize SpecForge in current project |
| `/specforge-constitution` | Create or view the project constitution |
| `/specforge-specify` | Create a new feature spec |
| `/specforge-clarify` | Scan spec for ambiguities |
| `/specforge-review` | Score spec quality |
| `/specforge-plan` | Generate implementation plan |
| `/specforge-brainstorm` | Research competitors and suggest features |
| `/specforge-tasks` | Generate task list |
| `/specforge-analyze` | Run consistency analysis |
| `/specforge-generate` | Generate code from spec |
| `/specforge-diff` | Preview code generation changes |
| `/specforge-implement` | Run full pipeline |
| `/specforge-pipeline` | Interactive step-by-step workflow |
| `/specforge-command` | Manage custom commands |
| `/specforge-update` | Sync integration files after CLI upgrade |
| `/specforge-test-pw` | Generate Playwright E2E tests |

Run `specforge update` after upgrading the CLI to sync these files with the latest version.

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
├── CLAUDE.md                      # Claude Code integration (managed by SpecForge)
├── .claude/
│   └── commands/
│       └── specforge-*.md         # 16 slash commands for Claude Code
├── .specforge/
│   ├── version.yaml               # CLI version tracking
│   └── custom-commands.yaml       # Custom command definitions
├── spec/
│   └── app.spec.yaml              # API spec for code generation
├── memory/
│   └── constitution.md            # Project constitution (9 articles + project context)
├── specs/
│   └── 001-user-auth/
│       ├── spec.md                # Feature specification
│       ├── clarification-log.md   # Ambiguity scan results
│       ├── implementation.md      # Implementation notes (entity map, recommendations)
│       ├── review-report.md       # Spec quality score (5 dimensions)
│       ├── plan.md                # Implementation plan
│       ├── data-model.md          # ER diagram and entity details
│       ├── brainstorm-report.md   # Competitor analysis and suggestions
│       ├── tasks.md               # Prioritized task list
│       └── analysis-report.md     # Consistency check report
├── src/                           # Generated source code
│   ├── models/                    # TypeScript interfaces (model plugin)
│   ├── routes/                    # Fastify routes (fastify plugin)
│   └── middleware/                # Auth, validation, error handler (middleware plugin)
├── prisma/
│   └── schema.prisma              # Generated Prisma schema
├── tests/
│   ├── *.test.ts                  # Generated Vitest tests
│   └── e2e/                       # Generated Playwright E2E tests
└── docs/
    ├── openapi.json               # Generated OpenAPI 3.0 spec
    ├── er-diagram.md              # Generated Mermaid ER diagram
    └── API.md                     # Generated API documentation
```

## Monorepo Structure

SpecForge is built as a pnpm monorepo with 4 packages:

```
packages/
├── core/              — Types, parsing, validation, planning, brainstorm, review, project analysis
├── cli/               — Commander.js CLI with 20 commands + 5 subcommands
├── generator/         — Handlebars-based code generation with 7 plugins
└── create-specforge/  — Project scaffolding (npx create-specforge)
```

All packages are published under the `@specforge-dev` scope on npm.

### Version Management

The version number is defined once in `packages/core/src/version.ts` and used everywhere at runtime. To bump the version:

1. Edit the `VERSION` constant in `packages/core/src/version.ts`
2. Run `pnpm version:sync` to update all 4 `package.json` files
3. Rebuild with `pnpm build`

```bash
# After editing packages/core/src/version.ts
pnpm version:sync   # syncs VERSION → all package.json files
pnpm build          # rebuilds all packages
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Increases GitHub API rate limit for `brainstorm` research (optional) |

## License

ISC
