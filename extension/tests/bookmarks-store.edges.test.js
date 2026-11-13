"use strict";
// The edges of the bookmark tree that stands in for chrome.bookmarks on the web, pinned by mutation testing: each case failed to fail
// when the matching rule was deliberately broken (see tests/mutation/content-mutants.mjs).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createDefaultTree, generateId, findNode, insertNode, updateNode, moveNode, removeNode } = require("../lib/bookmarks-store.js");

const childIds = (tree, id) => findNode(tree, id).node.children.map((c) => c.id);
const countOf = (tree, id) => {
  let n = 0;
  const walk = (node) => {
    if (node.id === id) n += 1;
    (node.children || []).forEach(walk);
  };
  tree.forEach(walk);
  return n;
};

test("generated ids start with 'w', which keeps them apart from Chrome's numeric ids, and differ from call to call", () => {
  const a = generateId();
  assert.ok(a.startsWith("w"), a);
  assert.notEqual(a, generateId());
});

test("findNode matches ids exactly: a number does not find a string id, and a missing id finds nothing", () => {
  const tree = createDefaultTree();
  assert.equal(findNode(tree, 100), null);
  assert.equal(findNode(tree, "no-such-id"), null);
  assert.equal(findNode(tree, "100").node.title, "YouTube");
});

test("findNode reports the parent and the position among its siblings, and -1 for a top-level node", () => {
  const tree = createDefaultTree();
  const root = findNode(tree, "0");
  assert.equal(root.parent, null);
  assert.equal(root.index, -1);
  const instagram = findNode(tree, "102");
  assert.equal(instagram.parent.id, "10");
  assert.equal(instagram.index, 2);
  assert.equal(findNode(tree, "2").index, 1);
});

test("insertNode into an unknown parent returns null and changes nothing", () => {
  const tree = createDefaultTree();
  const before = structuredClone(tree);
  assert.equal(insertNode(tree, "no-such-id", { title: "x", url: "https://x.test" }), null);
  assert.deepEqual(tree, before);
});

test("insertNode makes a link (title and url, no children) or a folder (title and an empty list), and appends it last", () => {
  const tree = createDefaultTree();
  const link = insertNode(tree, "11", { title: "Docs", url: "https://docs.test" });
  assert.deepEqual(Object.keys(link).sort(), ["id", "title", "url"]);
  const folder = insertNode(tree, "11", { title: "Archive" });
  assert.deepEqual(Object.keys(folder).sort(), ["children", "id", "title"]);
  assert.deepEqual(folder.children, []);
  assert.deepEqual(childIds(tree, "11").slice(-2), [link.id, folder.id]);
  assert.equal(findNode(tree, link.id).parent.id, "11");
});

test("insertNode gives a node with no title an empty title, not undefined", () => {
  const tree = createDefaultTree();
  assert.equal(insertNode(tree, "11", { url: "https://x.test" }).title, "");
  assert.equal(insertNode(tree, "11", {}).title, "");
});

test("updateNode on an unknown id returns null", () => {
  assert.equal(updateNode(createDefaultTree(), "no-such-id", { title: "x" }), null);
});

test("updateNode sets a title or url, including an empty string, and ignores values that are not strings", () => {
  const tree = createDefaultTree();
  assert.equal(updateNode(tree, "100", { title: "" }).title, "");
  assert.equal(updateNode(tree, "100", { url: "" }).url, "");
  const node = updateNode(tree, "101", { title: 5, url: null });
  assert.equal(node.title, "Twitter / X");
  assert.equal(node.url, "https://twitter.com");
  assert.equal(updateNode(tree, "101", { title: "Renamed", url: "https://new.test" }), findNode(tree, "101").node);
  assert.equal(findNode(tree, "101").node.url, "https://new.test");
});

test("moveNode takes a bookmark out of its old folder, appends it to the new one, and never leaves a copy", () => {
  const tree = createDefaultTree();
  const moved = moveNode(tree, "100", "11");
  assert.equal(moved.id, "100");
  assert.deepEqual(childIds(tree, "10"), ["101", "102", "103", "104"]);
  assert.equal(childIds(tree, "11").at(-1), "100");
  assert.equal(countOf(tree, "100"), 1);
});

test("moveNode refuses an unknown source or destination, and the top-level node, without changing anything", () => {
  const tree = createDefaultTree();
  const before = structuredClone(tree);
  assert.equal(moveNode(tree, "no-such-id", "11"), null);
  assert.equal(moveNode(tree, "100", "no-such-id"), null);
  assert.deepEqual(tree, before);
  // a tree can have several top-level nodes, and none of them can be moved
  const forest = [{ id: "a", title: "A", children: [] }, { id: "b", title: "B", children: [] }];
  assert.equal(moveNode(forest, "a", "b"), null);
  assert.deepEqual(forest.map((r) => r.id), ["a", "b"]);
});

test("moveNode refuses to move a folder into itself or into anything below it, so a subtree is never lost", () => {
  const tree = createDefaultTree();
  const before = structuredClone(tree);
  assert.equal(moveNode(tree, "10", "10"), null, "into itself");
  assert.equal(moveNode(tree, "1", "10"), null, "into its own child");
  assert.equal(moveNode(tree, "1", "100"), null, "into its own grandchild");
  assert.deepEqual(tree, before);
  assert.ok(findNode(tree, "100"), "and a search still ends");
});

test("moveNode moves a whole folder, with its contents, into a sibling folder", () => {
  const tree = createDefaultTree();
  moveNode(tree, "10", "11");
  assert.equal(findNode(tree, "10").parent.id, "11");
  assert.deepEqual(childIds(tree, "10"), ["100", "101", "102", "103", "104"]);
  assert.deepEqual(childIds(tree, "1"), ["11", "12"]);
  assert.equal(countOf(tree, "10"), 1);
});

test("removeNode returns false for an unknown id and for a top-level node, and changes nothing", () => {
  const tree = createDefaultTree();
  const before = structuredClone(tree);
  assert.equal(removeNode(tree, "no-such-id"), false);
  assert.equal(removeNode(tree, "0"), false);
  assert.deepEqual(tree, before);
});

test("removeNode removes exactly the node asked for and keeps its siblings in order", () => {
  const tree = createDefaultTree();
  assert.equal(removeNode(tree, "101"), true);
  assert.deepEqual(childIds(tree, "10"), ["100", "102", "103", "104"]);
  assert.equal(findNode(tree, "101"), null);
});
