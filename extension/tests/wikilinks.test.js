"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { extractWikiLinks, resolveWikiLink, findBacklinks } = require("../lib/wikilinks.js");

test("extractWikiLinks parses unique [[Target]] references in order", () => {
  const links = extractWikiLinks("Working on [[OAuth Sync]] and [[Design System]], see [[oauth sync]] again.");
  assert.deepEqual(links, ["OAuth Sync", "Design System"]);
});

test("resolveWikiLink resolves notes, tasks, bookmarks, and journal dates case-insensitively", () => {
  const state = {
    notes: [{ id: "n1", title: "Architecture Spec", content: "Details" }],
    kanban: [{ id: "k1", title: "Ship v2.1.4", column: "doing" }],
    quickAccess: [{ id: "q1", name: "GitHub Repo", url: "https://github.com/karkinirajan/Nestpane" }],
    journal: { "2026-10-23": { text: "Productive day" } }
  };
  assert.deepEqual(resolveWikiLink("architecture spec", state), {
    type: "note",
    id: "n1",
    title: "Architecture Spec"
  });
  assert.deepEqual(resolveWikiLink("Ship v2.1.4", state), {
    type: "task",
    id: "k1",
    title: "Ship v2.1.4",
    column: "doing"
  });
  assert.deepEqual(resolveWikiLink("github repo", state), {
    type: "bookmark",
    id: "q1",
    title: "GitHub Repo",
    url: "https://github.com/karkinirajan/Nestpane"
  });
  assert.deepEqual(resolveWikiLink("2026-10-23", state), {
    type: "journal",
    id: "2026-10-23",
    title: "2026-10-23"
  });
  assert.equal(resolveWikiLink("Nonexistent", state), null);
});

test("findBacklinks finds all notes, tasks, and journal entries referencing a target title", () => {
  const state = {
    notes: [
      { id: "n1", title: "OAuth Sync", content: "Core spec" },
      { id: "n2", title: "Release Checklist", content: "Verify [[OAuth Sync]] before shipping" }
    ],
    kanban: [
      { id: "k1", title: "Test [[oauth sync]] on Brave", column: "todo" }
    ],
    journal: {
      "2026-10-23": { text: "Finished [[OAuth Sync]] implementation today." }
    }
  };
  const backlinks = findBacklinks("OAuth Sync", state, { type: "note", id: "n1" });
  assert.equal(backlinks.length, 3);
  assert.deepEqual(backlinks.map((b) => b.type), ["note", "task", "journal"]);
});
