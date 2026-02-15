import * as fs from "node:fs";
import * as path from "node:path";

const EXAMPLE_SPEC = `specforge: "1.0"
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
      role:
        type: enum
        values: [admin, user, moderator]
        default: user
      createdAt:
        type: datetime
        auto: true

  Post:
    fields:
      id:
        type: uuid
        primary: true
      title:
        type: string
        min: 1
        max: 200
      body:
        type: text
      published:
        type: boolean
        default: false
      authorId:
        type: relation
        model: User
        kind: many-to-one

api:
  basePath: /api/v1
  auth:
    strategy: jwt

  endpoints:
    - path: /users
      model: User
      actions: [list, get, create, update, delete]
      auth:
        list: public
        get: public
        create: admin
        update: [admin, owner]
        delete: admin

    - path: /posts
      model: Post
      actions: [list, get, create, update, delete]
      auth:
        list: public
        get: public
        create: authenticated
        update: [admin, owner]
        delete: [admin, owner]

tests:
  User:
    - name: "should create a user"
      action: create
      input:
        email: "test@example.com"
        name: "Test User"
      expect:
        status: 201
        body:
          email: "test@example.com"

    - name: "should reject invalid email"
      action: create
      input:
        email: "not-an-email"
        name: "Test"
      expect:
        status: 400
`;

const PACKAGE_JSON_TEMPLATE = (name: string) =>
  JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      scripts: {
        "spec:validate": "specforge validate",
        "spec:generate": "specforge generate",
        build: "tsc",
        dev: "tsx src/server.ts",
      },
      dependencies: {
        fastify: "^5.0.0",
        "@prisma/client": "^6.0.0",
      },
      devDependencies: {
        "@specforge/cli": "^0.1.0",
        typescript: "^5.7.0",
        prisma: "^6.0.0",
        vitest: "^3.0.0",
        tsx: "^4.0.0",
      },
    },
    null,
    2
  );

const TSCONFIG_TEMPLATE = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "Node16",
      moduleResolution: "Node16",
      declaration: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: "dist",
      rootDir: "src",
    },
    include: ["src"],
  },
  null,
  2
);

// ──────────────────────────────────────────────────────────────
// Claude Code Integration — CLAUDE.md + Slash Commands
// ──────────────────────────────────────────────────────────────

const CLAUDE_MD = `# SpecForge — Spec-Driven Development Workflow

This project uses **SpecForge** for spec-driven development.

## When Working on This Project

Always follow the SpecForge workflow. Spec first, code second.

## The SpecForge Workflow

Follow this order when implementing features:

### 1. Constitution (once per project)
\`\`\`bash
specforge constitution
\`\`\`
Creates \`memory/constitution.md\` with 9 guiding principles. Always check the constitution before making architectural decisions.

### 2. Define Feature Spec
\`\`\`bash
specforge specify <feature-name>
\`\`\`
Creates \`specs/NNN-feature-name/spec.md\`. Edit this file to define:
- User Scenarios (Given-When-Then with P1/P2/P3 priorities)
- Functional Requirements (FR-001, FR-002, ...)
- Key Entities, Success Criteria, Edge Cases

### 3. Clarify Ambiguities
\`\`\`bash
specforge clarify <spec-id>
\`\`\`
Scans the spec for 10 categories of ambiguity. Fix findings before proceeding.

### 4. Generate Plan
\`\`\`bash
specforge plan <spec-id>
\`\`\`
Creates \`plan.md\` + \`data-model.md\` with implementation phases and file changes.

### 5. Generate Tasks
\`\`\`bash
specforge tasks <spec-id>
\`\`\`
Creates \`tasks.md\` with [T001]-style tasks, dependencies, and parallel markers.

### 6. Analyze Consistency
\`\`\`bash
specforge analyze [spec-id]
\`\`\`
Cross-checks spec vs plan vs tasks vs .spec.yaml models.

### 7. Generate Code
\`\`\`bash
specforge validate
specforge generate
\`\`\`

### 8. Check Diff
\`\`\`bash
specforge diff -v
\`\`\`

## Available Plugins
- \`model\` — TypeScript interfaces
- \`prisma\` — Prisma schema
- \`fastify\` — Fastify routes
- \`test\` — Vitest test stubs
- \`docs\` — OpenAPI + ER diagram + API docs
- \`middleware\` — Auth + validation + error handler

## Key Rules
1. **Spec first, code second** — Always update the spec before writing code
2. **Check the constitution** — Read \`memory/constitution.md\` before architectural decisions
3. **Run the full pipeline** — specify > clarify > plan > tasks > analyze > generate
4. **Use analyze** — Run \`specforge analyze\` to catch inconsistencies

## Project Structure
\`\`\`
spec/app.spec.yaml          # API spec (models, endpoints, tests)
specs/NNN-feature/           # Feature specs, plans, tasks
memory/constitution.md       # Project principles
docs/                        # Generated API docs + OpenAPI + ER diagram
\`\`\`
`;

const SLASH_COMMANDS: Record<string, string> = {
  "specforge-init": `Initialize SpecForge in the current project.

Run \`specforge init .\` to add a \`spec/\` directory with an example \`app.spec.yaml\` to this project. Do NOT create a new subdirectory — init in-place.

After init, show the user what was created and suggest next steps:
1. \`specforge constitution\` to define project principles
2. Edit \`spec/app.spec.yaml\` to define their models and endpoints
3. \`specforge validate\` to check the spec`,

  "specforge-constitution": `Create or view the project constitution.

Run \`specforge constitution\` in the current project directory. This creates \`memory/constitution.md\` with 9 guiding articles:
Library-First, CLI Mandate, Test-First, Simplicity, Anti-Abstraction, Documentation as Code, Backward Compatibility, Single Responsibility, Spec-Driven Development.

If the constitution already exists, show its contents. If the user wants to add an amendment, run:
\`specforge constitution --amend "description" --article <article-id>\``,

  "specforge-specify": `Create a new feature spec using SpecForge.

Ask the user for a feature name if not provided as $ARGUMENTS, then run:
\`specforge specify <feature-name>\`

This creates \`specs/NNN-feature-name/spec.md\` with structured sections:
User Scenarios (Given-When-Then with P1/P2/P3), Functional Requirements (FR-001, FR-002), Key Entities, Success Criteria, Edge Cases, Open Questions.

After creation, help the user fill in the spec with real details for their feature, then suggest running \`specforge clarify\` to check for ambiguities.`,

  "specforge-clarify": `Scan a feature spec for ambiguities.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs in the \`specs/\` directory and ask which one to clarify.

Run: \`specforge clarify <spec-id>\`

This scans across 10 ambiguity categories: placeholder text, empty sections, missing priorities, undefined entities, unclear acceptance criteria, missing edge cases, undefined auth, missing error handling, incomplete data model, ambiguous terminology.

After showing findings, help the user fix the ambiguities by editing the spec.md file.`,

  "specforge-plan": `Generate an implementation plan from a feature spec.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: \`specforge plan <spec-id>\`

This generates \`plan.md\` (phases, constitutional compliance, file changes) and \`data-model.md\` (ER diagram + entity details) in the spec directory.

After generation, review the plan with the user and suggest running \`specforge tasks\` next.`,

  "specforge-tasks": `Generate a task list from a feature spec.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: \`specforge tasks <spec-id>\`

This generates \`tasks.md\` with [T001]-style task IDs, priority levels (P1/P2/P3), scenario references, dependency tracking, parallel opportunity markers, across 4 phases: Setup > Foundational > User Stories > Polish.

After generation, suggest running \`specforge analyze\` to check consistency.`,

  "specforge-analyze": `Run consistency analysis across all SpecForge artifacts.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, analyze all specs.

Run: \`specforge analyze [spec-id]\`

This cross-validates: constitution compliance (CRITICAL), coverage gaps (HIGH), missing tests (MEDIUM), naming issues (LOW), entity mismatches with .spec.yaml models.

Show findings and help the user resolve any issues found.`,

  "specforge-generate": `Generate code from the spec.

First run \`specforge validate\` to check the spec is valid.
If $ARGUMENTS is provided, use it as plugin filter (e.g., "docs", "middleware").

Run: \`specforge generate\` or \`specforge generate -p <plugins>\`

Available plugins: model, prisma, fastify, test, docs, middleware.

Show the user what was generated and suggest reviewing the output.`,

  "specforge-diff": `Show what \`specforge generate\` would change compared to files on disk.

Run: \`specforge diff --verbose\`

This compares generated output against existing files and shows [ADD], [MOD] with line diffs, and unchanged file count.

Help the user decide whether to run \`specforge generate\` to apply the changes.`,

  "specforge-implement": `Run the full implementation pipeline for an existing feature spec.

If $ARGUMENTS is provided, use it as the spec-id. Otherwise, list available specs and ask which one.

Run: \`specforge implement <spec-id>\`

This runs the entire pipeline automatically:
1. Clarify — scan for ambiguities (skipped if already done)
2. Plan — generate implementation plan (skipped if already done)
3. Tasks — generate task list (skipped if already done)
4. Analyze — consistency check
5. Validate — check .spec.yaml
6. Generate — generate all code
7. Updates spec status to "in-progress"

It then shows a full implementation summary with task execution order, file changes, and next steps.

Use \`--skip-generate\` to skip code generation. Use \`-p docs middleware\` to select specific plugins.`,

  "specforge-pipeline": `Run the full SpecForge spec-driven development pipeline for a new feature.

Ask the user for a feature name if not provided as $ARGUMENTS.

Execute these steps in order:
1. Check if SpecForge is initialized (\`spec/\` exists). If not, run \`specforge init .\`
2. Check if constitution exists (\`memory/constitution.md\`). If not, run \`specforge constitution\`
3. Run \`specforge specify <feature-name>\`
4. Help the user fill in spec.md with real details
5. Run \`specforge clarify <spec-id>\` and fix ambiguities
6. Run \`specforge plan <spec-id>\`
7. Run \`specforge tasks <spec-id>\`
8. Run \`specforge analyze <spec-id>\`
9. Update \`spec/app.spec.yaml\` if needed
10. Run \`specforge validate\` then \`specforge generate\`
11. Start implementing code following the plan and tasks

This is the complete Constitution > Specify > Clarify > Plan > Tasks > Analyze > Implement workflow.`,
};

/**
 * Write Claude Code integration files (CLAUDE.md + slash commands).
 */
function writeClaudeIntegration(targetDir: string): number {
  let count = 0;

  // Write CLAUDE.md
  const claudeMdPath = path.join(targetDir, "CLAUDE.md");
  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, CLAUDE_MD, "utf-8");
    count++;
    const relative = path.relative(process.cwd(), claudeMdPath);
    console.log(`  Created ${relative}`);
  } else {
    console.log(`  Skipped CLAUDE.md (already exists)`);
  }

  // Write slash commands
  const commandsDir = path.join(targetDir, ".claude", "commands");
  fs.mkdirSync(commandsDir, { recursive: true });

  for (const [name, content] of Object.entries(SLASH_COMMANDS)) {
    const cmdPath = path.join(commandsDir, `${name}.md`);
    if (!fs.existsSync(cmdPath)) {
      fs.writeFileSync(cmdPath, content, "utf-8");
      count++;
      const relative = path.relative(process.cwd(), cmdPath);
      console.log(`  Created ${relative}`);
    }
  }

  return count;
}

export async function initCommand(projectName?: string): Promise<void> {
  // "." or no name with existing project = init in current directory
  const initInPlace = projectName === ".";
  const name = initInPlace ? path.basename(process.cwd()) : (projectName ?? "my-specforge-app");
  const targetDir = initInPlace ? process.cwd() : path.resolve(process.cwd(), name);

  if (!initInPlace && fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${name}" already exists. Use 'specforge init .' to init inside an existing project.`);
    process.exit(1);
  }

  if (initInPlace) {
    console.log(`\nInitializing SpecForge in current project: ${name}\n`);
  } else {
    console.log(`\nCreating SpecForge project: ${name}\n`);
  }

  // Create spec directory
  const specDir = path.join(targetDir, "spec");
  fs.mkdirSync(specDir, { recursive: true });

  // Write spec file
  const specFile = path.join(specDir, "app.spec.yaml");
  if (fs.existsSync(specFile)) {
    console.log(`  Skipped spec/app.spec.yaml (already exists)`);
  } else {
    fs.writeFileSync(specFile, EXAMPLE_SPEC, "utf-8");
    const relative = path.relative(process.cwd(), specFile);
    console.log(`  Created ${relative}`);
  }

  // Write Claude Code integration
  console.log();
  console.log(`  Setting up Claude Code integration...`);
  const claudeFileCount = writeClaudeIntegration(targetDir);
  console.log(`  Claude Code: ${claudeFileCount} files created (CLAUDE.md + ${Object.keys(SLASH_COMMANDS).length} slash commands)`);

  if (initInPlace) {
    console.log(`\nDone! SpecForge initialized in your project.\n`);
    console.log(`  Next steps:\n`);
    console.log(`  specforge validate            # validate the spec`);
    console.log(`  specforge constitution         # define project principles`);
    console.log(`  specforge generate             # generate code from spec`);
    console.log(`  specforge specify <feature>    # create a feature spec`);
    console.log();
    console.log(`  Claude Code slash commands available:`);
    console.log(`    /specforge-pipeline <feature>  # run full workflow`);
    console.log(`    /specforge-constitution        # create project principles`);
    console.log(`    /specforge-specify <feature>   # create feature spec`);
    console.log(`    /specforge-generate            # generate code`);
    console.log();
    return;
  }

  // For new projects, create full scaffolding
  const dirs = [
    path.join(targetDir, "src"),
    path.join(targetDir, "src", "models"),
    path.join(targetDir, "src", "routes"),
    path.join(targetDir, "tests"),
    path.join(targetDir, "prisma"),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const files: [string, string][] = [
    [path.join(targetDir, "package.json"), PACKAGE_JSON_TEMPLATE(name)],
    [path.join(targetDir, "tsconfig.json"), TSCONFIG_TEMPLATE],
    [
      path.join(targetDir, ".gitignore"),
      "node_modules/\ndist/\n.env\n",
    ],
  ];

  for (const [filePath, content] of files) {
    fs.writeFileSync(filePath, content, "utf-8");
    const relative = path.relative(process.cwd(), filePath);
    console.log(`  Created ${relative}`);
  }

  console.log(`\nDone! Next steps:\n`);
  console.log(`  cd ${name}`);
  console.log(`  npm install`);
  console.log(`  specforge validate`);
  console.log(`  specforge generate`);
  console.log();
  console.log(`  Claude Code slash commands available — type / in Claude Code:`);
  console.log(`    /specforge-pipeline <feature>  # run full workflow`);
  console.log(`    /specforge-constitution        # create project principles`);
  console.log(`    /specforge-specify <feature>   # create feature spec`);
  console.log(`    /specforge-generate            # generate code`);
  console.log();
}
