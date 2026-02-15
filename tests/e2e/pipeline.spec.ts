import { test as base, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execSpecforge, expectFileExists, expectFileContains, expectStdoutContains } from "./helpers";

/**
 * Pipeline integration test — runs the full 10-step SpecForge workflow sequentially.
 * Uses a single temp directory across all steps to verify artifacts chain together.
 */
base.describe("specforge pipeline", () => {
  let tmpDir: string;

  const run = (args: string[], timeout?: number) => execSpecforge(args, tmpDir, timeout);

  base.beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "specforge-e2e-pipeline-"));
  });

  base.afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  base("step 1: init creates project structure", async () => {
    const result = await run(["init", "."]);

    expect(result.exitCode).toBe(0);
    expectFileExists(tmpDir, "spec/app.spec.yaml");
    expectFileExists(tmpDir, "CLAUDE.md");
    expectFileExists(tmpDir, ".specforge/version.yaml");
  });

  base("step 2: specify creates feature spec", async () => {
    const result = await run(["specify", "user-auth"]);

    expect(result.exitCode).toBe(0);
    expectFileExists(tmpDir, "specs/001-user-auth/spec.md");

    // Fill in spec with real content for downstream steps
    const specContent = `# Feature Spec: User Auth

> Spec ID: 001-user-auth
> Created: 2026-01-01

## Status

Status: draft

## Overview

User authentication with JWT tokens and session management.

## User Scenarios

### [US1] [P1] User logs in

**Given** a registered user with valid credentials
**When** they POST to /api/auth/login with email and password
**Then** they receive a 200 response with a JWT access token

### [US2] [P2] User logs out

**Given** an authenticated user with a valid session
**When** they POST to /api/auth/logout with their token
**Then** the session is invalidated and returns 200

## Functional Requirements

### [FR-001] JWT Token Generation

Generate JWT tokens with user ID, email, role claims. Token expires in 1 hour.

### [FR-002] Session Storage

Store sessions in database with user ID, token hash, created at, expires at.

## Key Entities

- **Session** — Active user session
- **Token** — JWT access token

## Success Criteria

- Login returns valid JWT within 200ms
- Logout invalidates session immediately

## Edge Cases

- Invalid credentials return 401
- Expired token returns 401
- Concurrent sessions per user

## Open Questions

- Should refresh tokens be supported?
`;

    fs.writeFileSync(path.join(tmpDir, "specs/001-user-auth/spec.md"), specContent, "utf-8");
  });

  base("step 3: clarify checks for ambiguities", async () => {
    const result = await run(["clarify", "001-user-auth"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Scanning spec for ambiguities");
    expectFileExists(tmpDir, "specs/001-user-auth/clarification-log.md");
  });

  base("step 4: review scores spec quality", async () => {
    const result = await run(["review", "001-user-auth"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Verdict:");
    expectStdoutContains(result, "Completeness");
    expectFileExists(tmpDir, "specs/001-user-auth/review-report.md");
  });

  base("step 5: plan generates implementation plan", async () => {
    const result = await run(["plan", "001-user-auth"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Phases:");
    expectFileExists(tmpDir, "specs/001-user-auth/plan.md");
    expectFileExists(tmpDir, "specs/001-user-auth/data-model.md");
  });

  base("step 6: brainstorm researches competitors (offline)", async () => {
    const result = await run(["brainstorm", "001-user-auth", "--offline"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Tool selection for");
    expectStdoutContains(result, "Heuristics");
    expectFileExists(tmpDir, "specs/001-user-auth/brainstorm-report.md");
  });

  base("step 7: tasks generates task list", async () => {
    const result = await run(["tasks", "001-user-auth"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Total tasks:");
    expectFileExists(tmpDir, "specs/001-user-auth/tasks.md");
  });

  base("step 8: analyze checks consistency", async () => {
    const result = await run(["analyze", "001-user-auth"]);

    expect(result.exitCode).toBe(0);
    expectStdoutContains(result, "Analyzing consistency");
    expectFileExists(tmpDir, "specs/001-user-auth/analysis-report.md");
  });

  base("step 9: generate produces code from spec.yaml", async () => {
    const result = await run(["generate"]);

    expect(result.exitCode).toBe(0);
  });

  base("step 10: diff shows changes", async () => {
    const result = await run(["diff"]);

    expect(result.exitCode).toBe(0);
  });
});
