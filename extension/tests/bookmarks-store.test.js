"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createDefaultTree,
  findNode,
  insertNode,
  updateNode,
  moveNode,
  removeNode
} = require("../lib/bookmarks-store.js");

test("createDefaultTree returns a tree findNode can navigate from the root", () => {
  const tree = createDefaultTree();
  const found = findNode(tree, "100");
  assert.ok(found, "the seeded YouTube bookmark must be found");
  assert.equal(found.node.title, "YouTube");
  assert.equal(found.node.url, "https://youtube.com");
});

test("findNode returns null for an id that doesn't exist", () => {
  const tree = createDefaultTree();
  assert.equal(findNode(tree, "does-not-exist"), null);
});

test("insertNode adds a new bookmark under the given parent and persists in the tree", () => {
  const tree = createDefaultTree();
  const node = insertNode(tree, "10", { title: "Mastodon", url: "https://mastodon.social" });
  assert.ok(node.id, "a new node must get a generated id");
  const found = findNode(tree, node.id);
  assert.ok(found, "the inserted node must be findable afterward");
  assert.equal(found.node.title, "Mastodon");
  assert.equal(found.parent.id, "10");
});

test("insertNode with no url creates a folder (children array, no url)", () => {
  const tree = createDefaultTree();
  const node = insertNode(tree, "1", { title: "New Folder" });
  assert.equal(node.url, undefined);
  assert.deepEqual(node.children, []);
});

test("insertNode returns null when the parent doesn't exist", () => {
  const tree = createDefaultTree();
  assert.equal(insertNode(tree, "nonexistent-parent", { title: "x" }), null);
});

test("updateNode changes title/url in place without touching the id", () => {
  const tree = createDefaultTree();
  const updated = updateNode(tree, "100", { title: "YT", url: "https://youtube.com/feed" });
  assert.equal(updated.id, "100");
  assert.equal(updated.title, "YT");
  assert.equal(updated.url, "https://youtube.com/feed");
});

test("moveNode relocates a node from its old parent to a new one", () => {
  const tree = createDefaultTree();
  const moved = moveNode(tree, "100", "11"); // move YouTube into "Development"
  assert.ok(moved);
  const oldParent = findNode(tree, "10");
  const newParent = findNode(tree, "11");
  assert.ok(!oldParent.node.children.some((c) => c.id === "100"), "must be removed from the old parent");
  assert.ok(newParent.node.children.some((c) => c.id === "100"), "must now be under the new parent");
});

test("removeNode deletes a leaf bookmark", () => {
  const tree = createDefaultTree();
  const ok = removeNode(tree, "100");
  assert.equal(ok, true);
  assert.equal(findNode(tree, "100"), null);
});

test("removeNode deletes an entire folder subtree at once", () => {
  const tree = createDefaultTree();
  const ok = removeNode(tree, "10"); // "Social Media" folder, with 5 children
  assert.equal(ok, true);
  assert.equal(findNode(tree, "10"), null);
  assert.equal(findNode(tree, "100"), null, "children of a removed folder are gone too");
});

test("removeNode on the synthetic root (no parent) is a safe no-op", () => {
  const tree = createDefaultTree();
  assert.equal(removeNode(tree, "0"), false);
});
