#!/usr/bin/env node

/**
 * Reads VERSION from packages/core/src/version.ts and syncs it
 * into all package.json files across the monorepo.
 *
 * Usage: node scripts/sync-version.js
 */

const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");

// Read VERSION from the single source of truth
const versionTs = readFileSync(
  join(root, "packages/core/src/version.ts"),
  "utf-8"
);
const match = versionTs.match(/VERSION\s*=\s*"([^"]+)"/);
if (!match) {
  console.error("Could not parse VERSION from packages/core/src/version.ts");
  process.exit(1);
}
const version = match[1];

// All package.json files to sync
const packagePaths = [
  "packages/core/package.json",
  "packages/cli/package.json",
  "packages/generator/package.json",
  "packages/create-specforge/package.json",
];

let updated = 0;
for (const rel of packagePaths) {
  const abs = join(root, rel);
  const pkg = JSON.parse(readFileSync(abs, "utf-8"));
  if (pkg.version !== version) {
    pkg.version = version;
    writeFileSync(abs, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    console.log(`  Updated ${rel} → ${version}`);
    updated++;
  } else {
    console.log(`  ${rel} already at ${version}`);
  }
}

console.log(`\nDone. ${updated} file(s) updated to v${version}.`);
