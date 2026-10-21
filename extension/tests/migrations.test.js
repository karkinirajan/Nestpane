"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { CURRENT_SCHEMA_VERSION, runMigrations } = require("../lib/migrations.js");

test("runMigrations is a no-op when already at the current version", () => {
  const data = { notes: ["a"] };
  const result = runMigrations(data, CURRENT_SCHEMA_VERSION);
  assert.equal(result.version, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(result.applied, []);
  assert.equal(result.rolledBack, false);
  assert.deepEqual(result.data, data);
});

test("runMigrations advances a never-versioned (v0) dataset to current", () => {
  const data = { notes: ["a"], settings: { theme: "dark" } };
  const result = runMigrations(data, 0);
  assert.equal(result.version, CURRENT_SCHEMA_VERSION);
  assert.equal(result.rolledBack, false);
  assert.deepEqual(result.data.notes, ["a"]);
  assert.deepEqual(result.data.settings, { theme: "dark" });
});

test("runMigrations treats a missing fromVersion as 0", () => {
  const result = runMigrations({ x: 1 }, undefined);
  assert.equal(result.version, CURRENT_SCHEMA_VERSION);
});

test("runMigrations rolls back and leaves original data untouched if a step throws", () => {
  const original = { lib: require("../lib/migrations.js") };
  const data = { notes: ["keep-me"] };
  const migrationsModule = original.lib;
  const realMigrations = migrationsModule.MIGRATIONS.slice();
  migrationsModule.MIGRATIONS.length = 0;
  migrationsModule.MIGRATIONS.push({
    toVersion: 1,
    migrate() {
      throw new Error("simulated corrupt migration");
    }
  });
  try {
    const result = migrationsModule.runMigrations(data, 0);
    assert.equal(result.rolledBack, true);
    assert.deepEqual(result.data, data);
    assert.equal(result.version, 0);
    assert.ok(result.error instanceof Error);
  } finally {
    migrationsModule.MIGRATIONS.length = 0;
    migrationsModule.MIGRATIONS.push(...realMigrations);
  }
});
