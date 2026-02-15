import { test as base } from "@playwright/test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execSpecforge } from "./helpers";

export interface ProjectFixture {
  /** Path to the temporary project directory. */
  projectDir: string;
  /** Run a specforge command in the project directory. */
  run: (args: string[], timeout?: number) => ReturnType<typeof execSpecforge>;
}

/**
 * Playwright test fixture that creates a fresh temp project with `specforge init .`.
 */
export const test = base.extend<{ project: ProjectFixture }>({
  project: async ({}, use) => {
    // Create unique temp directory
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "specforge-e2e-"));

    // Initialize project in-place with "init ."
    await execSpecforge(["init", "."], tmpDir);

    const fixture: ProjectFixture = {
      projectDir: tmpDir,
      run: (args: string[], timeout?: number) => execSpecforge(args, tmpDir, timeout),
    };

    await use(fixture);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  },
});

/**
 * Fixture with a pre-created feature spec for commands that need one.
 */
export const testWithSpec = base.extend<{ project: ProjectFixture; specId: string }>({
  project: async ({}, use) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "specforge-e2e-"));
    await execSpecforge(["init", "."], tmpDir);

    const fixture: ProjectFixture = {
      projectDir: tmpDir,
      run: (args: string[], timeout?: number) => execSpecforge(args, tmpDir, timeout),
    };

    await use(fixture);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  },

  specId: async ({ project }, use) => {
    // Create a sample spec
    await project.run(["specify", "test-feature"]);

    const specDir = path.join(project.projectDir, "specs", "001-test-feature");
    const specPath = path.join(specDir, "spec.md");

    // Fill in the spec with real content for deterministic testing
    const specContent = `# Feature Spec: Test Feature

> Spec ID: 001-test-feature
> Created: 2026-01-01

## Status

Status: draft

## Overview

A sample feature for E2E testing. Manages user sessions with login and logout flows.

## User Scenarios

### [US1] [P1] User logs in with valid credentials

**Given** a registered user with email "test@example.com"
**When** they submit valid credentials to the login endpoint
**Then** they receive a JWT access token and a session is created

### [US2] [P2] User logs out and session is invalidated

**Given** a user with an active session
**When** they call the logout endpoint with their token
**Then** the session is deleted and the token is invalidated

### [US3] [P3] System rejects expired tokens

**Given** a user with an expired JWT token
**When** they attempt to access a protected endpoint
**Then** the system returns a 401 Unauthorized error

## Functional Requirements

### [FR-001] JWT Token Generation

Generate a JWT access token upon successful authentication. Token includes user ID, email, and role. Expires in 1 hour.

### [FR-002] Session Management

Create a session record on login, delete on logout. Track session creation time, last activity, and IP address.

### [FR-003] Token Validation Middleware

Validate JWT tokens on protected routes. Check expiration, signature, and that the session exists.

## Key Entities

- **Session** — Active user session with token, creation time, and expiry
- **Token** — JWT access token with user claims and expiration
- **User** — Registered user account with email and hashed password

## Success Criteria

- Login returns a valid JWT token within 200ms
- Logout invalidates the session immediately
- Expired tokens are rejected with 401 status code
- All P1 scenarios pass acceptance testing

## Edge Cases

- Multiple concurrent sessions for the same user
- Token refresh during active session
- Login with incorrect password returns 401
- Session cleanup for inactive sessions after 24 hours

## Open Questions

- Should we support refresh tokens?
- What is the maximum number of concurrent sessions per user?
`;

    fs.writeFileSync(specPath, specContent, "utf-8");

    await use("001-test-feature");
  },
});

export { expect } from "@playwright/test";
