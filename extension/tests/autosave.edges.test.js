"use strict";
// The timing edges of the debounced autosave, pinned by mutation testing (see tests/mutation/content-mutants.mjs). These use node:test's
// mock timers, so they check exact millisecond boundaries without waiting for real time.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createFlushableDebounce, createAutosaveRegistry } = require("../lib/autosave.js");

function setup(t, delay = 100) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const debounce = createFlushableDebounce((...args) => calls.push(args), delay);
  return { calls, debounce, tick: (ms) => t.mock.timers.tick(ms) };
}

test("a call fires once, exactly one delay after the last schedule, with the latest arguments", (t) => {
  const { calls, debounce, tick } = setup(t);
  debounce.schedule("first");
  tick(99);
  assert.equal(calls.length, 0, "not yet, one millisecond early");
  debounce.schedule("second"); // restarts the wait
  tick(99);
  assert.equal(calls.length, 0, "the first timer must not fire");
  tick(1);
  assert.deepEqual(calls, [["second"]]);
  tick(1000);
  assert.equal(calls.length, 1, "and never again");
});

test("isPending is true from schedule until the call fires, is flushed or is cancelled", (t) => {
  const { debounce, tick } = setup(t);
  assert.equal(debounce.isPending(), false);
  debounce.schedule();
  assert.equal(debounce.isPending(), true);
  tick(100);
  assert.equal(debounce.isPending(), false, "after it fired");
  debounce.schedule();
  debounce.flush();
  assert.equal(debounce.isPending(), false, "after a flush");
  debounce.schedule();
  debounce.cancel();
  assert.equal(debounce.isPending(), false, "after a cancel");
});

test("flush runs the pending call now with the latest arguments, says so, and the timer never fires it again", (t) => {
  const { calls, debounce, tick } = setup(t);
  debounce.schedule("a");
  debounce.schedule("b");
  assert.equal(debounce.flush(), true);
  assert.deepEqual(calls, [["b"]]);
  tick(1000);
  assert.deepEqual(calls, [["b"]]);
});

test("flush with nothing pending does nothing and says so", (t) => {
  const { calls, debounce } = setup(t);
  assert.equal(debounce.flush(), false);
  assert.equal(calls.length, 0);
  debounce.schedule("x");
  debounce.flush();
  assert.equal(debounce.flush(), false, "a second flush has nothing left to run");
  assert.equal(calls.length, 1);
});

test("cancel drops the pending call for good", (t) => {
  const { calls, debounce, tick } = setup(t);
  debounce.schedule("x");
  debounce.cancel();
  tick(1000);
  assert.equal(calls.length, 0);
  debounce.cancel(); // and cancelling when idle is harmless
  assert.equal(debounce.flush(), false);
});

test("the registry hands back what was registered and flushAll runs every pending call", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const registry = createAutosaveRegistry();
  const seen = [];
  const one = registry.register(createFlushableDebounce((v) => seen.push(`one:${v}`), 50));
  const two = registry.register(createFlushableDebounce((v) => seen.push(`two:${v}`), 50));
  assert.equal(typeof one.schedule, "function");
  assert.notEqual(one, two);
  one.schedule(1);
  two.schedule(2);
  registry.flushAll();
  assert.deepEqual(seen, ["one:1", "two:2"]);
  registry.flushAll(); // nothing pending: harmless
  assert.equal(seen.length, 2);
});
