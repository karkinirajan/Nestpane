"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarizePayload, recordDailySnapshot, formatSnapshotLabel } = require("../lib/snapshots.js");

test("summarizePayload counts active notes, tasks, bookmarks, habits, and journal entries", () => {
  const summary = summarizePayload({
    notes: [{ id: "1", title: "A" }, { id: "2", _deleted: true }],
    kanban: [{ id: "k1", title: "T1" }, { id: "k2", title: "T2" }],
    quickAccess: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
    habits: [{ id: "h1" }],
    journal: { "2026-10-23": { text: "Entry" }, "2026-10-22": { text: "" } }
  });
  assert.deepEqual(summary, {
    notes: 1,
    tasks: 2,
    bookmarks: 3,
    habits: 1,
    journalDays: 1
  });
});

test("recordDailySnapshot deduplicates same-day snapshots and caps at maxSnapshots", () => {
  let snaps = [];
  for (let i = 1; i <= 9; i++) {
    snaps = recordDailySnapshot(
      snaps,
      { _savedAt: i * 1000, notes: [{ id: `n${i}` }], kanban: [], quickAccess: [] },
      `2026-10-0${i}`,
      7
    );
  }
  assert.equal(snaps.length, 7);
  assert.equal(snaps[0].dateKey, "2026-10-09");
  assert.equal(snaps[6].dateKey, "2026-10-03");

  snaps = recordDailySnapshot(
    snaps,
    { _savedAt: 99000, notes: [{ id: "n1" }, { id: "n2" }], kanban: [], quickAccess: [] },
    "2026-10-09",
    7
  );
  assert.equal(snaps.length, 7);
  assert.equal(snaps[0].summary.notes, 2);
  assert.match(formatSnapshotLabel(snaps[0]), /2026-10-09/);
});
