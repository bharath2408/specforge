import * as fs from "node:fs";
import * as path from "node:path";
import type {
  ProjectType,
  DetectedFramework,
  TechStack,
  BestPractice,
  ProjectFlowStep,
  ProjectFlow,
  ProjectAnalysis,
  ManualProjectInput,
} from "./types.js";

// ──────────────────────────────────────────────────────────────
// Framework Detection Map (60+ entries)
// ──────────────────────────────────────────────────────────────

const FRAMEWORK_MAP: Record<string, { name: string; category: DetectedFramework["category"] }> = {
  // Frontend frameworks
  react: { name: "React", category: "framework" },
  "react-dom": { name: "React", category: "framework" },
  vue: { name: "Vue.js", category: "framework" },
  "@angular/core": { name: "Angular", category: "framework" },
  svelte: { name: "Svelte", category: "framework" },
  "solid-js": { name: "SolidJS", category: "framework" },
  preact: { name: "Preact", category: "framework" },
  lit: { name: "Lit", category: "framework" },
  alpine: { name: "Alpine.js", category: "framework" },
  htmx: { name: "htmx", category: "framework" },

  // Fullstack frameworks
  next: { name: "Next.js", category: "framework" },
  nuxt: { name: "Nuxt", category: "framework" },
  "@remix-run/node": { name: "Remix", category: "framework" },
  "@remix-run/react": { name: "Remix", category: "framework" },
  astro: { name: "Astro", category: "framework" },
  "@sveltejs/kit": { name: "SvelteKit", category: "framework" },
  gatsby: { name: "Gatsby", category: "framework" },

  // Backend frameworks
  express: { name: "Express", category: "framework" },
  fastify: { name: "Fastify", category: "framework" },
  "@nestjs/core": { name: "NestJS", category: "framework" },
  hono: { name: "Hono", category: "framework" },
  koa: { name: "Koa", category: "framework" },
  "hapi": { name: "Hapi", category: "framework" },
  "@hapi/hapi": { name: "Hapi", category: "framework" },
  restify: { name: "Restify", category: "framework" },
  "socket.io": { name: "Socket.IO", category: "framework" },
  trpc: { name: "tRPC", category: "api" },
  "@trpc/server": { name: "tRPC", category: "api" },
  graphql: { name: "GraphQL", category: "api" },
  "@apollo/server": { name: "Apollo Server", category: "api" },

  // ORM / Database
  prisma: { name: "Prisma", category: "orm" },
  "@prisma/client": { name: "Prisma", category: "orm" },
  drizzle: { name: "Drizzle", category: "orm" },
  "drizzle-orm": { name: "Drizzle", category: "orm" },
  typeorm: { name: "TypeORM", category: "orm" },
  sequelize: { name: "Sequelize", category: "orm" },
  knex: { name: "Knex", category: "orm" },
  mongoose: { name: "Mongoose", category: "orm" },
  pg: { name: "PostgreSQL (pg)", category: "database" },
  mysql2: { name: "MySQL", category: "database" },
  "better-sqlite3": { name: "SQLite", category: "database" },
  redis: { name: "Redis", category: "database" },
  ioredis: { name: "Redis (ioredis)", category: "database" },

  // Testing
  vitest: { name: "Vitest", category: "testing" },
  jest: { name: "Jest", category: "testing" },
  mocha: { name: "Mocha", category: "testing" },
  "@playwright/test": { name: "Playwright", category: "testing" },
  cypress: { name: "Cypress", category: "testing" },
  "@testing-library/react": { name: "Testing Library", category: "testing" },
  supertest: { name: "Supertest", category: "testing" },

  // Bundlers
  vite: { name: "Vite", category: "bundler" },
  webpack: { name: "Webpack", category: "bundler" },
  esbuild: { name: "esbuild", category: "bundler" },
  rollup: { name: "Rollup", category: "bundler" },
  tsup: { name: "tsup", category: "bundler" },
  turbo: { name: "Turborepo", category: "bundler" },
  "@swc/core": { name: "SWC", category: "bundler" },
  parcel: { name: "Parcel", category: "bundler" },

  // CSS
  tailwindcss: { name: "Tailwind CSS", category: "css" },
  "styled-components": { name: "styled-components", category: "css" },
  "@emotion/react": { name: "Emotion", category: "css" },
  sass: { name: "Sass", category: "css" },
  less: { name: "Less", category: "css" },
  "postcss": { name: "PostCSS", category: "css" },

  // UI Libraries
  "@mui/material": { name: "Material UI", category: "ui-library" },
  "@chakra-ui/react": { name: "Chakra UI", category: "ui-library" },
  "antd": { name: "Ant Design", category: "ui-library" },
  "@radix-ui/react-dialog": { name: "Radix UI", category: "ui-library" },
  "@headlessui/react": { name: "Headless UI", category: "ui-library" },
  "shadcn-ui": { name: "shadcn/ui", category: "ui-library" },

  // Auth
  "next-auth": { name: "NextAuth.js", category: "auth" },
  passport: { name: "Passport.js", category: "auth" },
  jsonwebtoken: { name: "JWT", category: "auth" },
  bcrypt: { name: "bcrypt", category: "auth" },
  "lucia": { name: "Lucia Auth", category: "auth" },

  // Runtime / CLI
  commander: { name: "Commander.js", category: "other" },
  yargs: { name: "Yargs", category: "other" },
  inquirer: { name: "Inquirer", category: "other" },
  chalk: { name: "Chalk", category: "other" },
  zod: { name: "Zod", category: "other" },
  tsx: { name: "tsx", category: "runtime" },
  "ts-node": { name: "ts-node", category: "runtime" },
};

const FRONTEND_FRAMEWORKS = new Set([
  "React", "Vue.js", "Angular", "Svelte", "SolidJS", "Preact", "Lit", "Alpine.js",
]);

const BACKEND_FRAMEWORKS = new Set([
  "Express", "Fastify", "NestJS", "Hono", "Koa", "Hapi", "Restify",
]);

const FULLSTACK_FRAMEWORKS = new Set([
  "Next.js", "Nuxt", "Remix", "Astro", "SvelteKit", "Gatsby",
]);

const FRONTEND_DIRS = new Set([
  "pages", "components", "views", "layouts", "public", "app", "styles",
]);

const BACKEND_DIRS = new Set([
  "routes", "controllers", "services", "middleware", "migrations", "prisma", "api",
]);

// ──────────────────────────────────────────────────────────────
// Main Entry Point
// ──────────────────────────────────────────────────────────────

export function analyzeProject(projectDir: string): ProjectAnalysis {
  const packageJsonPath = path.join(projectDir, "package.json");
  const tsconfigPath = path.join(projectDir, "tsconfig.json");

  let packageJson: Record<string, unknown> = {};
  if (fs.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  }

  let tsconfig: Record<string, unknown> = {};
  if (fs.existsSync(tsconfigPath)) {
    tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
  }

  const frameworks = detectFrameworks(packageJson);
  const dirs = scanDirectoryStructure(projectDir);
  const projectType = classifyProjectType(frameworks, dirs, packageJson, projectDir);
  const packageManager = detectPackageManager(projectDir);

  const compilerOptions = (tsconfig.compilerOptions ?? {}) as Record<string, unknown>;
  const hasTypeScript =
    frameworks.some((f) => f.name === "tsx" || f.name === "ts-node") ||
    !!(
      (packageJson.devDependencies as Record<string, string>)?.typescript ||
      (packageJson.dependencies as Record<string, string>)?.typescript
    ) ||
    fs.existsSync(tsconfigPath);

  const techStack: TechStack = {
    language: hasTypeScript ? "TypeScript" : "JavaScript",
    runtime: "Node.js",
    frameworks,
    packageManager,
    hasTypeScript,
    tsTarget: compilerOptions.target as string | undefined,
    tsModule: compilerOptions.module as string | undefined,
  };

  const bestPractices = generateBestPractices(projectType, frameworks);
  const architectureFlow = mapArchitectureFlow(projectType, frameworks);

  return {
    projectName: (packageJson.name as string) ?? path.basename(projectDir),
    projectType,
    techStack,
    directoryPatterns: dirs,
    bestPractices,
    architectureFlow,
    detectedAt: new Date().toISOString().split("T")[0],
    source: "auto",
  };
}

// ──────────────────────────────────────────────────────────────
// Framework Detection
// ──────────────────────────────────────────────────────────────

export function detectFrameworks(
  packageJson: Record<string, unknown>
): DetectedFramework[] {
  const deps = {
    ...(packageJson.dependencies as Record<string, string> | undefined),
    ...(packageJson.devDependencies as Record<string, string> | undefined),
  };

  const seen = new Set<string>();
  const frameworks: DetectedFramework[] = [];

  for (const [pkg, version] of Object.entries(deps)) {
    const entry = FRAMEWORK_MAP[pkg];
    if (entry && !seen.has(entry.name)) {
      seen.add(entry.name);
      frameworks.push({
        name: entry.name,
        version: version ?? undefined,
        category: entry.category,
      });
    }
  }

  return frameworks;
}

// ──────────────────────────────────────────────────────────────
// Project Type Classification
// ──────────────────────────────────────────────────────────────

export function classifyProjectType(
  frameworks: DetectedFramework[],
  dirs: string[],
  packageJson: Record<string, unknown> = {},
  projectDir?: string
): ProjectType {
  const names = new Set(frameworks.map((f) => f.name));
  const dirSet = new Set(dirs.map((d) => d.replace(/\/$/, "")));
  const baseDir = projectDir ?? process.cwd();

  // Check monorepo first
  if (
    packageJson.workspaces ||
    dirSet.has("packages") ||
    fs.existsSync(path.join(baseDir, "pnpm-workspace.yaml")) ||
    dirSet.has("apps")
  ) {
    return "monorepo";
  }

  // Check fullstack frameworks
  for (const fw of FULLSTACK_FRAMEWORKS) {
    if (names.has(fw)) return "fullstack";
  }

  const hasFrontend =
    [...FRONTEND_FRAMEWORKS].some((fw) => names.has(fw)) ||
    [...FRONTEND_DIRS].some((d) => dirSet.has(d));
  const hasBackend =
    [...BACKEND_FRAMEWORKS].some((fw) => names.has(fw)) ||
    [...BACKEND_DIRS].some((d) => dirSet.has(d));

  if (hasFrontend && hasBackend) return "fullstack";
  if (hasFrontend) return "frontend";
  if (hasBackend) return "backend";

  // Check CLI
  if (
    names.has("Commander.js") ||
    names.has("Yargs") ||
    packageJson.bin
  ) {
    return "cli";
  }

  // Check library
  if (packageJson.main || packageJson.exports || packageJson.types) {
    return "library";
  }

  return "unknown";
}

// ──────────────────────────────────────────────────────────────
// Package Manager Detection
// ──────────────────────────────────────────────────────────────

export function detectPackageManager(projectDir: string): string {
  if (fs.existsSync(path.join(projectDir, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(projectDir, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(projectDir, "bun.lockb")) || fs.existsSync(path.join(projectDir, "bun.lock"))) return "bun";
  if (fs.existsSync(path.join(projectDir, "package-lock.json"))) return "npm";
  return "npm";
}

// ──────────────────────────────────────────────────────────────
// Directory Structure Scan
// ──────────────────────────────────────────────────────────────

const IGNORED_DIRS = new Set([
  "node_modules", "dist", ".git", ".next", ".nuxt", ".svelte-kit",
  ".cache", "coverage", ".turbo", ".vercel", ".output",
  "playwright-report", "test-results",
]);

export function scanDirectoryStructure(projectDir: string): string[] {
  const patterns: string[] = [];

  try {
    const entries = fs.readdirSync(projectDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      patterns.push(entry.name + "/");

      // One-level deep scan
      const subDir = path.join(projectDir, entry.name);
      try {
        const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
        for (const sub of subEntries) {
          if (!sub.isDirectory()) continue;
          if (IGNORED_DIRS.has(sub.name) || sub.name.startsWith(".")) continue;
          patterns.push(entry.name + "/" + sub.name + "/");
        }
      } catch {
        // Permission denied or other errors — skip
      }
    }
  } catch {
    // Directory unreadable — return empty
  }

  return patterns;
}

// ──────────────────────────────────────────────────────────────
// Best Practices Database
// ──────────────────────────────────────────────────────────────

const BEST_PRACTICES_DB: BestPractice[] = [
  // React
  { id: "BP-001", category: "Components", title: "Component Architecture", description: "Use functional components with hooks; avoid class components", applicableTo: ["React", "Preact"] },
  { id: "BP-002", category: "State", title: "State Management", description: "Co-locate state near usage; lift state only when shared between siblings", applicableTo: ["React", "Vue.js", "Svelte"] },
  { id: "BP-003", category: "Routing", title: "App Router", description: "Use App Router with server components by default", applicableTo: ["Next.js"] },
  { id: "BP-004", category: "Data Fetching", title: "Server-Side Data", description: "Fetch data in server components; use React Server Components for data-heavy pages", applicableTo: ["Next.js"] },
  { id: "BP-005", category: "Components", title: "Composition API", description: "Use Composition API with <script setup> for new components", applicableTo: ["Vue.js", "Nuxt"] },

  // Backend
  { id: "BP-010", category: "API Design", title: "REST Conventions", description: "Use plural nouns for resources, proper HTTP methods, and consistent error responses", applicableTo: ["Express", "Fastify", "Hono", "Koa", "NestJS", "Hapi"] },
  { id: "BP-011", category: "Middleware", title: "Middleware Ordering", description: "Apply auth, validation, and error handling as middleware in the correct order", applicableTo: ["Express", "Fastify", "Koa", "Hono"] },
  { id: "BP-012", category: "Error Handling", title: "Centralized Error Handler", description: "Use a centralized error handler middleware; never swallow errors silently", applicableTo: ["Express", "Fastify", "NestJS", "Koa", "Hono"] },
  { id: "BP-013", category: "Validation", title: "Input Validation", description: "Validate all user input at the API boundary using schema validation (Zod, Joi)", applicableTo: ["Express", "Fastify", "NestJS", "Koa", "Hono"] },
  { id: "BP-014", category: "Architecture", title: "Modular Architecture", description: "Use modules with controllers, services, and providers", applicableTo: ["NestJS"] },

  // ORM / Database
  { id: "BP-020", category: "Database", title: "Schema Migrations", description: "Use Prisma migrations for all schema changes; never edit the database directly", applicableTo: ["Prisma"] },
  { id: "BP-021", category: "Database", title: "Query Builder", description: "Use Drizzle query builder with type-safe schemas; define schemas alongside queries", applicableTo: ["Drizzle"] },
  { id: "BP-022", category: "Database", title: "Connection Pooling", description: "Configure connection pooling for production; limit max connections", applicableTo: ["Prisma", "Drizzle", "TypeORM", "Sequelize", "Knex"] },
  { id: "BP-023", category: "Database", title: "Schema Validation", description: "Define Mongoose schemas with validation rules; use lean() for read-only queries", applicableTo: ["Mongoose"] },

  // Testing
  { id: "BP-030", category: "Testing", title: "Test Organization", description: "Co-locate unit tests with source files; keep integration tests in a separate directory", applicableTo: ["Vitest", "Jest"] },
  { id: "BP-031", category: "Testing", title: "E2E Testing", description: "Write E2E tests for critical user flows; use page object pattern for maintainability", applicableTo: ["Playwright", "Cypress"] },
  { id: "BP-032", category: "Testing", title: "API Testing", description: "Test API endpoints with supertest; validate response schemas", applicableTo: ["Supertest"] },

  // TypeScript
  { id: "BP-040", category: "Type Safety", title: "Strict Mode", description: "Enable strict mode in tsconfig.json; avoid 'any' types", applicableTo: ["TypeScript"] },
  { id: "BP-041", category: "Type Safety", title: "Type Inference", description: "Leverage type inference; only annotate when the compiler cannot infer", applicableTo: ["TypeScript"] },

  // CSS / Styling
  { id: "BP-050", category: "Styling", title: "Utility-First CSS", description: "Use utility classes for styling; extract components for repeated patterns", applicableTo: ["Tailwind CSS"] },
  { id: "BP-051", category: "Styling", title: "Component Styles", description: "Co-locate styles with components using CSS-in-JS", applicableTo: ["styled-components", "Emotion"] },

  // Build / Bundling
  { id: "BP-060", category: "Build", title: "Fast Dev Server", description: "Use Vite for instant HMR and fast builds", applicableTo: ["Vite"] },
  { id: "BP-061", category: "Build", title: "Bundle Analysis", description: "Monitor bundle size; use code splitting for large applications", applicableTo: ["Vite", "Webpack", "esbuild", "Rollup"] },

  // General
  { id: "BP-070", category: "Security", title: "Environment Variables", description: "Store secrets in environment variables; never commit .env files", applicableTo: ["*"] },
  { id: "BP-071", category: "Security", title: "Dependency Audit", description: "Regularly audit dependencies for vulnerabilities", applicableTo: ["*"] },
  { id: "BP-072", category: "Code Quality", title: "Linting & Formatting", description: "Use ESLint and Prettier with consistent configuration", applicableTo: ["*"] },
  { id: "BP-073", category: "Version Control", title: "Conventional Commits", description: "Use conventional commit messages for clear history", applicableTo: ["*"] },
  { id: "BP-074", category: "Performance", title: "Caching Strategy", description: "Implement appropriate caching at each layer (CDN, API, database)", applicableTo: ["*"] },
];

export function generateBestPractices(
  projectType: ProjectType,
  frameworks: DetectedFramework[]
): BestPractice[] {
  const names = new Set(frameworks.map((f) => f.name));

  // Always include TypeScript if detected
  const hasTS = frameworks.some((f) => f.name === "tsx" || f.name === "ts-node") ||
    names.has("TypeScript");

  return BEST_PRACTICES_DB.filter((bp) => {
    if (bp.applicableTo.includes("*")) return true;
    if (hasTS && bp.applicableTo.includes("TypeScript")) return true;
    return bp.applicableTo.some((tech) => names.has(tech));
  });
}

// ──────────────────────────────────────────────────────────────
// Architecture Flow Mapping
// ──────────────────────────────────────────────────────────────

export function mapArchitectureFlow(
  projectType: ProjectType,
  frameworks: DetectedFramework[]
): ProjectFlow {
  const names = new Set(frameworks.map((f) => f.name));
  const layers: ProjectFlowStep[] = [];
  const dataFlow: string[] = [];
  const deploymentNotes: string[] = [];

  // Determine UI layer
  const uiFramework =
    [...FULLSTACK_FRAMEWORKS, ...FRONTEND_FRAMEWORKS]
      .find((fw) => names.has(fw)) ?? null;

  // Determine server layer
  const serverFramework =
    [...BACKEND_FRAMEWORKS]
      .find((fw) => names.has(fw)) ?? null;

  // Determine ORM/DB layer
  const orm = frameworks.find((f) => f.category === "orm");
  const db = frameworks.find((f) => f.category === "database");

  if (projectType === "frontend" || projectType === "fullstack") {
    if (uiFramework) {
      layers.push({
        name: "Client",
        description: "User interface and interaction layer",
        technology: uiFramework,
      });
    }
  }

  if (projectType === "fullstack" && FULLSTACK_FRAMEWORKS.has(uiFramework ?? "")) {
    layers.push({
      name: "Server",
      description: "Server-side rendering and API routes",
      technology: `${uiFramework} API Routes`,
    });
  } else if (
    projectType === "backend" ||
    projectType === "fullstack"
  ) {
    if (serverFramework) {
      layers.push({
        name: "Server",
        description: "HTTP server and request handling",
        technology: serverFramework,
      });
    }
  }

  if (projectType === "backend" || projectType === "fullstack") {
    layers.push({
      name: "Services",
      description: "Business logic layer",
      technology: "Business Logic",
    });
  }

  if (orm) {
    layers.push({
      name: "Data Access",
      description: "Database ORM and query layer",
      technology: orm.name,
    });
  }

  if (db) {
    layers.push({
      name: "Database",
      description: "Data persistence",
      technology: db.name,
    });
  } else if (orm) {
    layers.push({
      name: "Database",
      description: "Data persistence",
      technology: "Database",
    });
  }

  if (projectType === "cli") {
    layers.push(
      { name: "CLI", description: "Command-line interface", technology: names.has("Commander.js") ? "Commander.js" : names.has("Yargs") ? "Yargs" : "CLI" },
      { name: "Core", description: "Core library logic", technology: "Library" }
    );
  }

  if (projectType === "library") {
    layers.push(
      { name: "Public API", description: "Exported functions and types", technology: "Library" },
      { name: "Internal", description: "Implementation details", technology: "Modules" }
    );
  }

  if (projectType === "monorepo") {
    layers.push(
      { name: "Packages", description: "Workspace packages", technology: "Monorepo" }
    );
  }

  // Generate data flow
  for (let i = 0; i < layers.length - 1; i++) {
    dataFlow.push(`${layers[i].name} (${layers[i].technology}) -> ${layers[i + 1].name} (${layers[i + 1].technology})`);
  }

  // Deployment notes
  if (names.has("Next.js")) deploymentNotes.push("Deploy to Vercel or self-host with Node.js");
  if (names.has("Fastify") || names.has("Express") || names.has("NestJS")) {
    deploymentNotes.push("Deploy server with Docker or cloud platform");
  }
  if (orm) deploymentNotes.push(`Run ${orm.name} migrations before deployment`);

  return { layers, dataFlow, deploymentNotes };
}

// ──────────────────────────────────────────────────────────────
// Manual Project Analysis (from prompts)
// ──────────────────────────────────────────────────────────────

export function buildManualProjectAnalysis(
  input: ManualProjectInput
): ProjectAnalysis {
  const frameworks: DetectedFramework[] = input.frameworks.map((name) => {
    // Try to find in framework map by name
    for (const [, entry] of Object.entries(FRAMEWORK_MAP)) {
      if (entry.name.toLowerCase() === name.toLowerCase()) {
        return { name: entry.name, category: entry.category };
      }
    }
    return { name, category: "framework" as const };
  });

  const isTS = input.language.toLowerCase().startsWith("t");

  const techStack: TechStack = {
    language: isTS ? "TypeScript" : "JavaScript",
    runtime: "Node.js",
    frameworks,
    packageManager: "npm",
    hasTypeScript: isTS,
  };

  return {
    projectName: input.projectName,
    projectType: input.projectType,
    techStack,
    directoryPatterns: [],
    bestPractices: generateBestPractices(input.projectType, frameworks),
    architectureFlow: mapArchitectureFlow(input.projectType, frameworks),
    detectedAt: new Date().toISOString().split("T")[0],
    source: "manual",
  };
}

// ──────────────────────────────────────────────────────────────
// Markdown Generation
// ──────────────────────────────────────────────────────────────

export function generateProjectContextMarkdown(
  analysis: ProjectAnalysis
): string {
  let md = "## Project Context\n\n";
  md += `> ${analysis.source === "auto" ? "Auto-detected" : "Manually configured"} on ${analysis.detectedAt}\n\n`;

  // Classification
  md += "### Project Classification\n";
  md += `- **Type:** ${analysis.projectType}\n`;
  md += `- **Language:** ${analysis.techStack.language}`;
  if (analysis.techStack.tsTarget || analysis.techStack.tsModule) {
    const parts: string[] = [];
    if (analysis.techStack.tsTarget) parts.push(analysis.techStack.tsTarget);
    if (analysis.techStack.tsModule) parts.push(analysis.techStack.tsModule);
    md += ` (${parts.join(", ")})`;
  }
  md += "\n";
  md += `- **Package Manager:** ${analysis.techStack.packageManager}\n\n`;

  // Tech Stack table
  const categorized = analysis.techStack.frameworks.filter(
    (f) => f.category !== "other" && f.category !== "runtime"
  );
  if (categorized.length > 0) {
    md += "### Tech Stack\n";
    md += "| Category | Technology | Version |\n";
    md += "|----------|-----------|--------|\n";
    for (const fw of categorized) {
      const cat = fw.category.charAt(0).toUpperCase() + fw.category.slice(1);
      const ver = fw.version ?? "-";
      md += `| ${cat} | ${fw.name} | ${ver} |\n`;
    }
    md += "\n";
  }

  // Directory structure
  if (analysis.directoryPatterns.length > 0) {
    const topLevel = analysis.directoryPatterns.filter(
      (d) => !d.includes("/") || d.indexOf("/") === d.length - 1
    );
    if (topLevel.length > 0) {
      md += "### Directory Structure\n";
      md += `Detected patterns: ${topLevel.join(", ")}\n\n`;
    }
  }

  // Architecture flow
  if (analysis.architectureFlow.layers.length > 0) {
    md += "### Architecture Flow\n";
    md += "```\n";
    for (let i = 0; i < analysis.architectureFlow.layers.length; i++) {
      const layer = analysis.architectureFlow.layers[i];
      const indent = "  ".repeat(i);
      const arrow = i > 0 ? "-> " : "";
      md += `${indent}${arrow}${layer.name} (${layer.technology})\n`;
    }
    md += "```\n\n";
  }

  // Best practices
  if (analysis.bestPractices.length > 0) {
    md += "### Best Practices for This Stack\n";
    for (const bp of analysis.bestPractices) {
      md += `- **[${bp.id}] ${bp.category}:** ${bp.description}\n`;
    }
    md += "\n";
  }

  return md;
}
