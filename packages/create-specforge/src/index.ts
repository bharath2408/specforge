#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";

const EXAMPLE_SPEC = `specforge: "1.0"
name: {{name}}
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
`;

function createProject(projectName: string): void {
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  console.log(`\nCreating SpecForge project: ${projectName}\n`);

  // Create directories
  const dirs = [
    targetDir,
    path.join(targetDir, "spec"),
    path.join(targetDir, "src"),
    path.join(targetDir, "src", "models"),
    path.join(targetDir, "src", "routes"),
    path.join(targetDir, "tests"),
    path.join(targetDir, "prisma"),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write spec file
  const spec = EXAMPLE_SPEC.replace(/\{\{name\}\}/g, projectName);
  const files: [string, string][] = [
    [path.join(targetDir, "spec", "app.spec.yaml"), spec],
    [
      path.join(targetDir, "package.json"),
      JSON.stringify(
        {
          name: projectName,
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
      ),
    ],
    [
      path.join(targetDir, "tsconfig.json"),
      JSON.stringify(
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
      ),
    ],
    [path.join(targetDir, ".gitignore"), "node_modules/\ndist/\n.env\n"],
  ];

  for (const [filePath, content] of files) {
    fs.writeFileSync(filePath, content, "utf-8");
    const relative = path.relative(process.cwd(), filePath);
    console.log(`  Created ${relative}`);
  }

  console.log(`\nDone! Next steps:\n`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  npx specforge validate`);
  console.log(`  npx specforge generate\n`);
}

const program = new Command();

program
  .name("create-specforge")
  .description("Scaffold a new SpecForge project")
  .version("0.1.0")
  .argument("<project-name>", "Name of the project to create")
  .action((projectName: string) => {
    createProject(projectName);
  });

program.parse();
