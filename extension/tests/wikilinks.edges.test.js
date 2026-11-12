"use strict";
// The edges of [[wiki link]] extraction, resolution and backlinks, pinned by mutation testing: each case failed to fail when the
// matching rule was deliberately broken (see tests/mutation/content-mutants.mjs).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { extractWikiLinks, resolveWikiLink, findBacklinks } = require("../lib/wikilinks.js");

// --- extractWikiLinks
test("extractWikiLinks trims each link and keeps the first spelling of links that differ only by case", () => {
  assert.deepEqual(extractWikiLinks("[[ Alpha ]] then [[alpha]] and [[ALPHA]], also [[Beta]]"), ["Alpha", "Beta"]);
});

test("extractWikiLinks skips blank links and links that run over a line break", () => {
  assert.deepEqual(extractWikiLinks("[[   ]] [[real]]"), ["real"]);
  assert.deepEqual(extractWikiLinks("[[split\nover]] [[ok]]"), ["ok"]);
});

test("extractWikiLinks gives the same answer when it is called again on the same text", () => {
  const text = "[[a]] [[b]]";
  assert.deepEqual(extractWikiLinks(text), ["a", "b"]);
  assert.deepEqual(extractWikiLinks(text), ["a", "b"]);
});

test("extractWikiLinks returns nothing for input that is not text", () => {
  for (const bad of [null, undefined, "", 5, {}, ["[[a]]"]]) assert.deepEqual(extractWikiLinks(bad), []);
});

// --- resolveWikiLink
test("resolveWikiLink returns null without a title or without a state", () => {
  assert.equal(resolveWikiLink("x", null), null);
  assert.equal(resolveWikiLink("x", undefined), null);
  assert.equal(resolveWikiLink("", { notes: [{ id: "n", title: "" }] }), null);
  assert.equal(resolveWikiLink(null, { notes: [] }), null);
});

test("resolveWikiLink ignores padding and case on both sides, and does not match a blank title to an untitled note", () => {
  const state = { notes: [{ id: "n1", title: " Alpha " }, { id: "n2", title: "" }] };
  assert.deepEqual(resolveWikiLink("  ALPHA ", state), { type: "note", id: "n1", title: " Alpha " });
  assert.equal(resolveWikiLink("   ", state), null);
});

test("resolveWikiLink does not resolve deleted notes or deleted tasks", () => {
  assert.equal(resolveWikiLink("a", { notes: [{ id: "n", title: "A", _deleted: true }] }), null);
  assert.equal(resolveWikiLink("a", { kanban: [{ id: "t", title: "A", _deleted: true }] }), null);
});

test("resolveWikiLink finds tasks in every shape the board has been stored in, with a column", () => {
  assert.deepEqual(resolveWikiLink("ship it", { kanban: [{ id: "t1", title: "Ship it", column: "doing" }] }), {
    type: "task",
    id: "t1",
    title: "Ship it",
    column: "doing"
  });
  assert.deepEqual(resolveWikiLink("plan", { kanbanCards: [{ id: "t2", title: "Plan" }] }), {
    type: "task",
    id: "t2",
    title: "Plan",
    column: "todo"
  });
  const columns = { kanban: { todo: [{ id: "a", title: "Todo one" }], doing: [{ id: "b", title: "Doing one" }], done: [null, { id: "c", title: "Done one" }, { id: "d", title: "Moved", column: "doing" }] } };
  assert.equal(resolveWikiLink("todo one", columns).column, "todo");
  assert.equal(resolveWikiLink("doing one", columns).column, "doing");
  assert.equal(resolveWikiLink("done one", columns).column, "done");
  assert.equal(resolveWikiLink("moved", columns).column, "doing", "a card's own column wins over the one it is listed under");
});

test("resolveWikiLink matches a bookmark on its name, not its title", () => {
  const state = { quickAccess: [{ id: "q1", name: "GitHub", url: "https://github.com" }, { id: "q2", title: "Zed" }] };
  assert.deepEqual(resolveWikiLink("github", state), { type: "bookmark", id: "q1", title: "GitHub", url: "https://github.com" });
  assert.equal(resolveWikiLink("zed", state), null);
});

test("resolveWikiLink prefers a note, then a task, then a bookmark, then a journal day", () => {
  const state = {
    notes: [{ id: "n", title: "Same" }],
    kanban: [{ id: "t", title: "Same" }],
    quickAccess: [{ id: "q", name: "Same" }]
  };
  assert.equal(resolveWikiLink("same", state).type, "note");
  assert.equal(resolveWikiLink("same", { ...state, notes: [] }).type, "task");
  assert.equal(resolveWikiLink("same", { ...state, notes: [], kanban: [] }).type, "bookmark");
});

test("resolveWikiLink links to a journal day only for an exact date that has an entry", () => {
  const journal = { "2026-11-12": "wrote something", "2026-11-13": "", "2026-11-14x": "no", "x2026-11-15": "no" };
  assert.deepEqual(resolveWikiLink("2026-11-12", { journal }), { type: "journal", id: "2026-11-12", title: "2026-11-12" });
  assert.equal(resolveWikiLink("2026-11-13", { journal }), null, "an empty entry");
  assert.equal(resolveWikiLink("2026-11-20", { journal }), null, "no entry");
  assert.equal(resolveWikiLink("2026-11-14x", { journal }), null, "text after the date");
  assert.equal(resolveWikiLink("x2026-11-15", { journal }), null, "text before the date");
});

// --- findBacklinks
test("findBacklinks returns nothing without a target or a state", () => {
  assert.deepEqual(findBacklinks("", { notes: [] }), []);
  assert.deepEqual(findBacklinks("x", null), []);
});

test("findBacklinks ignores padding and case in the target and in the link text", () => {
  const state = { notes: [{ id: "n1", title: "One", content: "see [[ALPHA]]" }] };
  assert.deepEqual(findBacklinks("  alpha  ", state), [{ type: "note", id: "n1", title: "One" }]);
  assert.deepEqual(findBacklinks("ALPHA", { notes: [{ id: "n1", title: "One", content: "see [[ alpha ]]" }] }).length, 1);
});

test("findBacklinks searches a note's content and its title, skips deleted notes, and names an untitled note", () => {
  const state = {
    notes: [
      { id: "a", title: "Mentions [[Target]] in the title", content: "" },
      { id: "b", title: "", content: "and [[Target]] in the body" },
      { id: "c", title: "Gone", content: "[[Target]]", _deleted: true },
      { id: "d", title: "Unrelated", content: "[[Other]]" }
    ]
  };
  assert.deepEqual(findBacklinks("target", state), [
    { type: "note", id: "a", title: "Mentions [[Target]] in the title" },
    { type: "note", id: "b", title: "Untitled Note" }
  ]);
});

test("findBacklinks searches a task's title, desc and description, skips deleted tasks, and names an untitled task", () => {
  const state = {
    kanban: [
      { id: "1", title: "About [[Target]]" },
      { id: "2", title: "", desc: "see [[Target]]" },
      { id: "3", title: "Third", description: "see [[Target]]" },
      { id: "4", title: "Gone", desc: "[[Target]]", _deleted: true },
      { id: "5", title: "Unrelated", desc: "[[Other]]" }
    ]
  };
  assert.deepEqual(findBacklinks("target", state), [
    { type: "task", id: "1", title: "About [[Target]]" },
    { type: "task", id: "2", title: "Task" },
    { type: "task", id: "3", title: "Third" }
  ]);
});

test("findBacklinks searches journal entries written as text or as { text }, and ignores an entry with no text", () => {
  const state = { journal: { "2026-11-10": "met [[Target]]", "2026-11-11": { text: "again [[Target]]" }, "2026-11-12": { other: "[[Target]]" }, "2026-11-13": "nothing" } };
  assert.deepEqual(findBacklinks("target", state), [
    { type: "journal", id: "2026-11-10", title: "Journal (2026-11-10)" },
    { type: "journal", id: "2026-11-11", title: "Journal (2026-11-11)" }
  ]);
});

test("findBacklinks lists notes, then tasks, then journal days", () => {
  const state = {
    journal: { "2026-11-10": "[[Target]]" },
    kanban: [{ id: "t", title: "[[Target]]" }],
    notes: [{ id: "n", title: "N", content: "[[Target]]" }]
  };
  assert.deepEqual(findBacklinks("target", state).map((r) => r.type), ["note", "task", "journal"]);
});

test("findBacklinks leaves out the item being viewed, and only that item, whatever else shares its id", () => {
  const state = {
    notes: [{ id: "1", title: "Note", content: "[[T]]" }],
    kanban: [{ id: "1", title: "Task", desc: "[[T]]" }],
    journal: { "1": "[[T]]" }
  };
  const types = (exclude) => findBacklinks("t", state, exclude).map((r) => r.type);
  assert.deepEqual(types(undefined), ["note", "task", "journal"]);
  assert.deepEqual(types({ type: "note", id: "1" }), ["task", "journal"]);
  assert.deepEqual(types({ type: "task", id: "1" }), ["note", "journal"]);
  assert.deepEqual(types({ type: "journal", id: "1" }), ["note", "task"]);
});
