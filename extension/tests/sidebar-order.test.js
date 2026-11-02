"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { moveGroup, moveItem } = require("../lib/sidebar-order.js");

const mk = () => [
  { id: "a", label: "A", items: [{ id: 1, kind: "link" }, { id: 2, kind: "link" }, { id: 3, kind: "link" }] },
  { id: "b", label: "B", items: [{ id: 4, kind: "view", view: "notes" }, { id: 5, kind: "link" }] },
  { id: "c", label: "C", items: [] }
];
const ids = (g) => g.items.map((i) => i.id).join(",");

test("moveGroup places the group before or after the target", () => {
  assert.deepEqual(moveGroup(mk(), "a", "c", "after").map((g) => g.id), ["b", "c", "a"]);
  assert.deepEqual(moveGroup(mk(), "a", "c", "before").map((g) => g.id), ["b", "a", "c"]);
  assert.deepEqual(moveGroup(mk(), "c", "a", "before").map((g) => g.id), ["c", "a", "b"]);
  assert.deepEqual(moveGroup(mk(), "c", "a", "after").map((g) => g.id), ["a", "c", "b"]);
});

test("moveGroup returns null for no-ops and unknown ids", () => {
  assert.equal(moveGroup(mk(), "a", "a", "before"), null);
  assert.equal(moveGroup(mk(), "a", "b", "before"), null);
  assert.equal(moveGroup(mk(), "b", "a", "after"), null);
  assert.equal(moveGroup(mk(), "zzz", "a", "before"), null);
  assert.equal(moveGroup(mk(), "a", "zzz", "before"), null);
});

test("moveGroup does not mutate its input", () => {
  const groups = mk();
  const snapshot = JSON.stringify(groups);
  moveGroup(groups, "a", "c", "after");
  assert.equal(JSON.stringify(groups), snapshot);
});

test("moveItem reorders within a group in both directions", () => {
  const down = moveItem(mk(), { fromGroupId: "a", itemId: 1, toGroupId: "a", targetItemId: 3, position: "after" });
  assert.equal(ids(down[0]), "2,3,1");
  const up = moveItem(mk(), { fromGroupId: "a", itemId: 3, toGroupId: "a", targetItemId: 1, position: "before" });
  assert.equal(ids(up[0]), "3,1,2");
  const mid = moveItem(mk(), { fromGroupId: "a", itemId: 1, toGroupId: "a", targetItemId: 3, position: "before" });
  assert.equal(ids(mid[0]), "2,1,3");
});

test("moveItem returns null when the position does not change", () => {
  assert.equal(moveItem(mk(), { fromGroupId: "a", itemId: 1, toGroupId: "a", targetItemId: 2, position: "before" }), null);
  assert.equal(moveItem(mk(), { fromGroupId: "a", itemId: 2, toGroupId: "a", targetItemId: 1, position: "after" }), null);
  assert.equal(moveItem(mk(), { fromGroupId: "a", itemId: 3, toGroupId: "a" }), null);
  assert.equal(moveItem(mk(), { fromGroupId: "a", itemId: 1, toGroupId: "a", targetItemId: 1 }), null);
});

test("moveItem moves across groups: before, after, append, and into an empty group", () => {
  const before = moveItem(mk(), { fromGroupId: "a", itemId: 2, toGroupId: "b", targetItemId: 5, position: "before" });
  assert.equal(ids(before[0]), "1,3");
  assert.equal(ids(before[1]), "4,2,5");
  const after = moveItem(mk(), { fromGroupId: "a", itemId: 2, toGroupId: "b", targetItemId: 5, position: "after" });
  assert.equal(ids(after[1]), "4,5,2");
  const append = moveItem(mk(), { fromGroupId: "a", itemId: 1, toGroupId: "b" });
  assert.equal(ids(append[1]), "4,5,1");
  const empty = moveItem(mk(), { fromGroupId: "a", itemId: 3, toGroupId: "c" });
  assert.equal(ids(empty[2]), "3");
  assert.equal(ids(empty[0]), "1,2");
});

test("moveItem refuses to duplicate a view item inside a group that already has it", () => {
  const groups = mk();
  groups[2].items.push({ id: 9, kind: "view", view: "notes" });
  assert.equal(moveItem(groups, { fromGroupId: "b", itemId: 4, toGroupId: "c" }), null);
});

test("moveItem rejects unknown groups, items, and targets, and never mutates input", () => {
  const groups = mk();
  const snapshot = JSON.stringify(groups);
  assert.equal(moveItem(groups, { fromGroupId: "x", itemId: 1, toGroupId: "a" }), null);
  assert.equal(moveItem(groups, { fromGroupId: "a", itemId: 99, toGroupId: "b" }), null);
  assert.equal(moveItem(groups, { fromGroupId: "a", itemId: 1, toGroupId: "b", targetItemId: 99 }), null);
  moveItem(groups, { fromGroupId: "a", itemId: 1, toGroupId: "b" });
  assert.equal(JSON.stringify(groups), snapshot);
});

test("moveItem treats string and numeric ids as equal (DOM dataset values are strings)", () => {
  const next = moveItem(mk(), { fromGroupId: "a", itemId: "1", toGroupId: "a", targetItemId: "3", position: "after" });
  assert.equal(ids(next[0]), "2,3,1");
});
