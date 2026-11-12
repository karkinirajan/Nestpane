"use strict";
// The edges of the schema migrations, pinned by mutation testing: each case failed to fail when the matching rule was deliberately
// broken. The one real migration is an identity, so these swap in steps of their own (the exported list is mutable, which the rollback
// test in migrations.test.js already relies on) to exercise the failure and ordering paths that a real migration will need.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const migrations = require("../lib/migrations.js");

function withSteps(steps, run) {
  const real = migrations.MIGRATIONS.slice();
  migrations.MIGRATIONS.length = 0;
  migrations.MIGRATIONS.push(...steps);
  try {
    return run();
  } finally {
    migrations.MIGRATIONS.length = 0;
    migrations.MIGRATIONS.push(...real);
  }
}

test("a dataset already at the current version comes back as the same object, untouched", () => {
  const data = { notes: ["a"] };
  const result = migrations.runMigrations(data, migrations.CURRENT_SCHEMA_VERSION);
  assert.equal(result.data, data);
});

test("a version that is not a non-negative number is treated as never-versioned", () => {
  const ran = [];
  withSteps([{ toVersion: 1, migrate(d) { ran.push(1); return d; } }], () => {
    for (const bad of ["1", "x", null, NaN, {}, [], true]) {
      ran.length = 0;
      const result = migrations.runMigrations({ x: 1 }, bad);
      assert.deepEqual(result.applied, [1], `from ${String(bad)}`);
      assert.deepEqual(ran, [1], `from ${String(bad)}`);
    }
  });
});

test("a negative version is treated as 0, and a failed run reports 0 as the version it fell back to", () => {
  withSteps([{ toVersion: 1, migrate() { throw new Error("boom"); } }], () => {
    const result = migrations.runMigrations({ x: 1 }, -5);
    assert.equal(result.version, 0);
    assert.equal(result.rolledBack, true);
  });
});

test("a step is skipped when its target version is not above the version the data is at", () => {
  const calls = [];
  withSteps(
    [
      { toVersion: 0, migrate(d) { calls.push(0); return d; } },
      { toVersion: 1, migrate(d) { calls.push(1); return d; } }
    ],
    () => {
      const result = migrations.runMigrations({ x: 1 }, 0);
      assert.deepEqual(calls, [1]);
      assert.deepEqual(result.applied, [1]);
    }
  );
});

test("a step that returns nothing leaves the data as it was", () => {
  withSteps([{ toVersion: 1, migrate() {} }], () => {
    const result = migrations.runMigrations({ notes: ["keep"] }, 0);
    assert.deepEqual(result.data, { notes: ["keep"] });
    assert.deepEqual(result.applied, [1]);
  });
});

test("when a later step fails, nothing from the earlier steps survives and the original data comes back", () => {
  const original = { notes: ["keep"] };
  withSteps(
    [
      { toVersion: 1, migrate(d) { d.addedByStepOne = true; return d; } },
      { toVersion: 2, migrate() { throw new Error("step two is broken"); } }
    ],
    () => {
      const result = migrations.runMigrations(original, 0);
      assert.equal(result.rolledBack, true);
      assert.equal(result.data, original);
      assert.equal("addedByStepOne" in result.data, false);
      assert.deepEqual(result.applied, []);
      assert.equal(result.version, 0);
      assert.match(result.error.message, /step two/);
    }
  );
});

test("migrating never changes the object that was passed in", () => {
  const input = { notes: ["a"] };
  withSteps([{ toVersion: 1, migrate(d) { d.added = true; return d; } }], () => {
    const result = migrations.runMigrations(input, 0);
    assert.equal(result.data.added, true);
    assert.equal("added" in input, false);
  });
});

test("steps run in order and the final version is the highest one applied", () => {
  const order = [];
  withSteps(
    [
      { toVersion: 1, migrate(d) { order.push(1); return d; } },
      { toVersion: 2, migrate(d) { order.push(2); return d; } },
      { toVersion: 3, migrate(d) { order.push(3); return d; } }
    ],
    () => {
      const result = migrations.runMigrations({ x: 1 }, 0);
      assert.deepEqual(order, [1, 2, 3]);
      assert.deepEqual(result.applied, [1, 2, 3]);
      assert.equal(result.version, 3);
    }
  );
});
