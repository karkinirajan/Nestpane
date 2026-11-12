"use strict";
// The edges of the rolling daily snapshots, pinned by mutation testing: each case failed to fail when the matching rule was deliberately
// broken. Snapshots are the safety net behind a bad sync or an accidental delete, so a silent mistake here is found only when it is needed.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarizePayload, recordDailySnapshot, formatSnapshotLabel } = require("../lib/snapshots.js");

const withNotes = (n, extra = {}) => ({ _savedAt: 1000, notes: Array.from({ length: n }, (_, i) => ({ id: `n${i}` })), ...extra });

test("a day is recorded when it has notes, tasks, links or journal entries, and skipped when it has none of them", () => {
  assert.equal(recordDailySnapshot([], withNotes(1), "2026-11-01").length, 1, "notes only");
  assert.equal(recordDailySnapshot([], { _savedAt: 1, kanban: [{ id: "t" }] }, "2026-11-01").length, 1, "tasks only");
  assert.equal(recordDailySnapshot([], { _savedAt: 1, quickAccess: [{ id: "q" }] }, "2026-11-01").length, 1, "links only");
  assert.equal(recordDailySnapshot([], { _savedAt: 1, journal: { "2026-11-01": "a note" } }, "2026-11-01").length, 1, "journal only");
  assert.equal(recordDailySnapshot([], { _savedAt: 1, notes: [], kanban: [], quickAccess: [], journal: {} }, "2026-11-01").length, 0);
  assert.equal(recordDailySnapshot([], { _savedAt: 1, notes: [{ id: "x", _deleted: true }] }, "2026-11-01").length, 0, "deleted notes do not count");
});

test("a snapshot never contains the snapshot list, so they cannot nest", () => {
  const earlier = recordDailySnapshot([], withNotes(1), "2026-10-31");
  const next = recordDailySnapshot(earlier, withNotes(1, { _snapshots: earlier }), "2026-11-01");
  assert.equal(next[0].data._snapshots, undefined);
  assert.equal(next.length, 2);
});

test("recording a day twice keeps one snapshot for that day, the latest", () => {
  let list = recordDailySnapshot([], withNotes(1, { _savedAt: 1000 }), "2026-10-31");
  list = recordDailySnapshot(list, withNotes(1, { _savedAt: 2000 }), "2026-11-01");
  list = recordDailySnapshot(list, withNotes(3, { _savedAt: 3000 }), "2026-11-01");
  assert.equal(list.length, 2);
  assert.equal(list.filter((s) => s.dateKey === "2026-11-01").length, 1);
  assert.equal(list[0].summary.notes, 3);
});

test("snapshots are newest first", () => {
  let list = [];
  for (const [day, savedAt] of [["2026-10-30", 1000], ["2026-11-02", 4000], ["2026-10-31", 2000]]) {
    list = recordDailySnapshot(list, withNotes(1, { _savedAt: savedAt }), day);
  }
  assert.deepEqual(list.map((s) => s.dateKey), ["2026-11-02", "2026-10-31", "2026-10-30"]);
});

test("seven snapshots are kept by default, and the limit never drops below one", () => {
  let list = [];
  for (let day = 1; day <= 9; day += 1) list = recordDailySnapshot(list, withNotes(1, { _savedAt: day * 1000 }), `2026-10-0${day}`);
  assert.equal(list.length, 7);
  assert.equal(recordDailySnapshot([], withNotes(1), "2026-11-01", 0).length, 1);
  assert.equal(recordDailySnapshot([], withNotes(1), "2026-11-01", -3).length, 1);
  assert.equal(recordDailySnapshot(list, withNotes(1, { _savedAt: 99000 }), "2026-11-01", 2).length, 2);
});

test("without a date key, or a payload, nothing is recorded and the list comes back as a copy", () => {
  const list = recordDailySnapshot([], withNotes(1), "2026-10-31");
  for (const key of ["", null, undefined]) {
    const result = recordDailySnapshot(list, withNotes(1), key);
    assert.deepEqual(result, list);
    assert.notEqual(result, list, "a copy, not the caller's array");
  }
  assert.deepEqual(recordDailySnapshot(list, null, "2026-11-01"), list);
  assert.deepEqual(recordDailySnapshot(undefined, null, "2026-11-01"), []);
  assert.deepEqual(recordDailySnapshot("not a list", withNotes(1), ""), []);
});

test("a snapshot is stamped with the payload's own save time, and 'now' only when it has none", () => {
  assert.equal(recordDailySnapshot([], withNotes(1, { _savedAt: 12345 }), "2026-11-01")[0].savedAt, 12345);
  const before = Date.now();
  const stamped = recordDailySnapshot([], { notes: [{ id: "n" }] }, "2026-11-01")[0].savedAt;
  assert.ok(stamped >= before && stamped <= Date.now());
});

test("tasks are counted in both board shapes, without deleted ones, and including the done column", () => {
  assert.equal(summarizePayload({ kanban: [{ id: "1" }, { id: "2", _deleted: true }, null] }).tasks, 1);
  assert.equal(
    summarizePayload({ kanban: { todo: [{ id: "1" }, { id: "2", _deleted: true }], doing: [{ id: "3" }], done: [{ id: "4" }, { id: "5" }] } }).tasks,
    4
  );
  assert.equal(summarizePayload({ kanban: { todo: "nope" } }).tasks, 0);
  assert.equal(summarizePayload({ kanban: 7 }).tasks, 0);
});

test("a journal day counts only when it has text", () => {
  const journal = { a: "   ", b: "text", c: { text: "x" }, d: {}, e: null, f: "", g: { text: "" } };
  assert.equal(summarizePayload({ journal }).journalDays, 2);
});

test("a payload that is not an object summarises to zeros", () => {
  for (const bad of [null, undefined, "text", 5]) {
    assert.deepEqual(summarizePayload(bad), { notes: 0, tasks: 0, bookmarks: 0, habits: 0, journalDays: 0 });
  }
});

test("the label names the day and the counts, and falls back to 'Snapshot' without a summary", () => {
  assert.equal(formatSnapshotLabel({ dateKey: "2026-10-09", summary: { notes: 2, tasks: 3, bookmarks: 4 } }), "2026-10-09 — 2 notes, 3 tasks, 4 links");
  assert.equal(formatSnapshotLabel(null), "Snapshot");
  assert.equal(formatSnapshotLabel({ dateKey: "2026-10-09" }), "Snapshot");
});
