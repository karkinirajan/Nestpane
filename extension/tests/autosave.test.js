"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createFlushableDebounce, createAutosaveRegistry } = require("../lib/autosave.js");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("schedule fires exactly once after the delay elapses", async () => {
  let calls = 0;
  const d = createFlushableDebounce(() => { calls++; }, 10);
  d.schedule();
  assert.equal(calls, 0, "must not fire synchronously");
  await wait(30);
  assert.equal(calls, 1);
});

test("rapid repeated scheduling collapses to a single trailing call with the latest args", async () => {
  const seen = [];
  const d = createFlushableDebounce((v) => seen.push(v), 10);
  d.schedule("a");
  d.schedule("b");
  d.schedule("c");
  await wait(30);
  assert.deepEqual(seen, ["c"], "only the last scheduled call should ever run");
});

test("flush runs the pending call immediately and prevents the timer from firing again", async () => {
  let calls = 0;
  const d = createFlushableDebounce(() => { calls++; }, 1000);
  d.schedule();
  const didRun = d.flush();
  assert.equal(didRun, true);
  assert.equal(calls, 1, "flush must run synchronously, not wait for the 1000ms delay");
  await wait(1100);
  assert.equal(calls, 1, "the original timer must not fire a second time after flush");
});

test("flush with nothing scheduled is a safe no-op", () => {
  let calls = 0;
  const d = createFlushableDebounce(() => { calls++; }, 10);
  const didRun = d.flush();
  assert.equal(didRun, false);
  assert.equal(calls, 0);
});

test("cancel drops the pending call without ever running it", async () => {
  let calls = 0;
  const d = createFlushableDebounce(() => { calls++; }, 10);
  d.schedule();
  d.cancel();
  await wait(30);
  assert.equal(calls, 0);
});

test("isPending reflects whether a call is currently scheduled", async () => {
  const d = createFlushableDebounce(() => {}, 10);
  assert.equal(d.isPending(), false);
  d.schedule();
  assert.equal(d.isPending(), true);
  await wait(30);
  assert.equal(d.isPending(), false);
});

test("the exact failure scenario this was built for: a tab torn down mid-edit still persists the last edit", async () => {
  // Simulates: user types into a note; before the debounce window elapses,
  // the browser hides/discards the tab. The page-hide handler calls
  // flushAll() on the registry, which must run the commit synchronously —
  // this is the guarantee that the bug report ("changes discarded on next
  // refresh") must no longer happen.
  let lastCommitted = null;
  const registry = createAutosaveRegistry();
  const noteAutosave = registry.register(createFlushableDebounce((text) => { lastCommitted = text; }, 800));
  noteAutosave.schedule("unsaved note content the user just typed");
  // Simulate the browser tearing down the page well before the 800ms debounce would fire.
  registry.flushAll();
  assert.equal(lastCommitted, "unsaved note content the user just typed");
});

test("registry.flushAll flushes every registered debounce, not just the first", () => {
  const results = [];
  const registry = createAutosaveRegistry();
  const a = registry.register(createFlushableDebounce(() => results.push("a"), 1000));
  const b = registry.register(createFlushableDebounce(() => results.push("b"), 1000));
  a.schedule();
  b.schedule();
  registry.flushAll();
  assert.deepEqual(results.sort(), ["a", "b"]);
});

test("registry.flushAll is harmless when nothing is pending anywhere", () => {
  const registry = createAutosaveRegistry();
  registry.register(createFlushableDebounce(() => { throw new Error("must not run"); }, 10));
  assert.doesNotThrow(() => registry.flushAll());
});
