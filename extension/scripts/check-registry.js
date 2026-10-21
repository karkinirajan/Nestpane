#!/usr/bin/env node
"use strict";
/**
 * Fails if any `active` feature in docs/feature-registry.json has no test,
 * or lists a test name that doesn't actually exist in extension/tests/.
 * This is meant to run in CI once CI exists (see docs/RELEASE.md) — today
 * it's run manually via `node scripts/check-registry.js` and is EXPECTED to
 * fail for most 2.1.0 features, because most of them have no tests yet.
 * That failure is the correct, honest signal — see docs/REPORT.md.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const registryPath = path.join(ROOT, "..", "docs", "feature-registry.json");
const testsDir = path.join(ROOT, "tests");

function collectDeclaredTestNames() {
  const names = new Set();
  for (const file of fs.readdirSync(testsDir)) {
    if (!file.endsWith(".test.js")) continue;
    const src = fs.readFileSync(path.join(testsDir, file), "utf8");
    const re = /\btest\(\s*(["'`])((?:(?!\1).)*)\1/g;
    let m;
    while ((m = re.exec(src))) names.add(m[2]);
  }
  return names;
}

function main() {
  const { features } = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const declared = collectDeclaredTestNames();
  const problems = [];
  for (const f of features) {
    if (f.status !== "active") continue;
    if (!f.tests || f.tests.length === 0) {
      problems.push(`${f.id}: no tests mapped`);
      continue;
    }
    for (const t of f.tests) {
      if (!declared.has(t)) problems.push(`${f.id}: test "${t}" not found in extension/tests/`);
    }
  }
  if (problems.length) {
    console.error(`Registry check failed — ${problems.length} problem(s):`);
    problems.forEach((p) => console.error("  - " + p));
    process.exit(1);
  }
  console.log(`Registry check passed — all ${features.length} active features have a real, mapped test.`);
}

main();
