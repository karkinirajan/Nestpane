"use strict";
// The edges of drag-and-drop ordering in the sidebar, pinned by mutation testing (see tests/mutation/content-mutants.mjs). Both functions
// return a new list, or null when the move would change nothing or is not allowed; they never modify what they are given.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { moveGroup, moveItem } = require("../lib/sidebar-order.js");

const link = (id) => ({ id, kind: "link" });
const view = (id, name) => ({ id, kind: "view", view: name });
const ids = (list) => list.map((x) => x.id);

// --- moveGroup
test("moveGroup puts a group before or after another, and 'before' is the default", () => {
  const groups = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(ids(moveGroup(groups, "a", "c", "after")), ["b", "c", "a"]);
  assert.deepEqual(ids(moveGroup(groups, "a", "c", "before")), ["b", "a", "c"]);
  assert.deepEqual(ids(moveGroup(groups, "c", "a")), ["c", "a", "b"]);
});

test("moveGroup returns a new list and leaves the one it was given alone", () => {
  const groups = [{ id: "a" }, { id: "b" }];
  const result = moveGroup(groups, "a", "b", "after");
  assert.notEqual(result, groups);
  assert.deepEqual(ids(groups), ["a", "b"]);
  assert.equal(result[1], groups[0], "the group objects themselves are reused");
});

test("moveGroup returns null for a move that changes nothing, or that cannot happen", () => {
  const groups = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(moveGroup(groups, "a", "a"), null, "onto itself");
  assert.equal(moveGroup(groups, "a", "b", "before"), null, "already just before it");
  assert.equal(moveGroup(groups, "b", "a", "after"), null, "already just after it");
  assert.equal(moveGroup(groups, "zzz", "a"), null, "unknown group");
  assert.equal(moveGroup(groups, "a", "zzz"), null, "unknown target");
  assert.equal(moveGroup(null, "a", "b"), null, "not a list");
});

test("moveGroup compares ids as text, so a number and its string are the same id", () => {
  const groups = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(ids(moveGroup(groups, "1", 2, "after")), [2, 1]);
});

// --- moveItem
const fixture = () => [
  { id: "A", items: [link("x"), link("y"), view("z", "tasks")] },
  { id: "B", items: [link("p"), view("q", "notes")] },
  { id: "C", items: [view("w", "tasks")] }
];
const itemIds = (groups, id) => ids(groups.find((g) => g.id === id).items);

test("moveItem appends to the end of the target group when no target item is named", () => {
  const result = moveItem(fixture(), { fromGroupId: "A", itemId: "x", toGroupId: "B" });
  assert.deepEqual(itemIds(result, "B"), ["p", "q", "x"]);
  assert.deepEqual(itemIds(result, "A"), ["y", "z"]);
});

test("moveItem puts an item before or after a target item, and 'before' is the default", () => {
  const move = { fromGroupId: "A", itemId: "x", toGroupId: "B", targetItemId: "q" };
  assert.deepEqual(itemIds(moveItem(fixture(), move), "B"), ["p", "x", "q"]);
  assert.deepEqual(itemIds(moveItem(fixture(), { ...move, position: "before" }), "B"), ["p", "x", "q"]);
  assert.deepEqual(itemIds(moveItem(fixture(), { ...move, position: "after" }), "B"), ["p", "q", "x"]);
});

test("moveItem reorders inside one group without duplicating or dropping anything", () => {
  const result = moveItem(fixture(), { fromGroupId: "A", itemId: "x", toGroupId: "A", targetItemId: "z", position: "after" });
  assert.deepEqual(itemIds(result, "A"), ["y", "z", "x"]);
  const toStart = moveItem(fixture(), { fromGroupId: "A", itemId: "z", toGroupId: "A", targetItemId: "x" });
  assert.deepEqual(itemIds(toStart, "A"), ["z", "x", "y"], "a view can be reordered within its own group");
});

test("moveItem returns null for a reorder that changes nothing", () => {
  assert.equal(moveItem(fixture(), { fromGroupId: "A", itemId: "x", toGroupId: "A", targetItemId: "y", position: "before" }), null);
  assert.equal(moveItem(fixture(), { fromGroupId: "A", itemId: "z", toGroupId: "A" }), null, "already last");
  assert.equal(moveItem(fixture(), { fromGroupId: "A", itemId: "x", toGroupId: "A", targetItemId: "x" }), null, "onto itself");
});

test("moveItem returns null for an unknown group, item or target item, and for a missing or invalid request", () => {
  const groups = fixture();
  assert.equal(moveItem(groups, { fromGroupId: "nope", itemId: "x", toGroupId: "B" }), null);
  assert.equal(moveItem(groups, { fromGroupId: "A", itemId: "x", toGroupId: "nope" }), null);
  assert.equal(moveItem(groups, { fromGroupId: "A", itemId: "nope", toGroupId: "B" }), null);
  assert.equal(moveItem(groups, { fromGroupId: "A", itemId: "x", toGroupId: "B", targetItemId: "nope" }), null);
  assert.equal(moveItem(groups, undefined), null);
  assert.equal(moveItem(groups, null), null);
  assert.equal(moveItem("not a list", { fromGroupId: "A", itemId: "x", toGroupId: "B" }), null);
});

test("moveItem will not put a second copy of a view into a group that already shows it, but allows a different view", () => {
  assert.equal(moveItem(fixture(), { fromGroupId: "A", itemId: "z", toGroupId: "C" }), null, "C already has the tasks view");
  const result = moveItem(fixture(), { fromGroupId: "A", itemId: "z", toGroupId: "B" });
  assert.deepEqual(itemIds(result, "B"), ["p", "q", "z"], "B has the notes view, not the tasks view");
});

test("moveItem changes only the two groups involved, and never the lists it was given", () => {
  const groups = fixture();
  const before = structuredClone(groups);
  const result = moveItem(groups, { fromGroupId: "A", itemId: "x", toGroupId: "B" });
  assert.deepEqual(groups, before);
  assert.notEqual(result[0], groups[0]);
  assert.notEqual(result[1], groups[1]);
  assert.equal(result[2], groups[2], "the untouched group is the same object");
  assert.deepEqual(result.map((g) => g.id), ["A", "B", "C"]);
});

test("moveItem compares ids as text", () => {
  const groups = [{ id: 1, items: [{ id: 10, kind: "link" }] }, { id: 2, items: [] }];
  const result = moveItem(groups, { fromGroupId: "1", itemId: "10", toGroupId: "2" });
  assert.deepEqual(result.map((g) => g.items.length), [0, 1]);
});
