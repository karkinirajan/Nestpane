"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { detectDriveConflict } = require("../lib/drive-conflict.js");

test("no conflict on first-ever sync when remote is empty", () => {
  const { conflict } = detectDriveConflict({ remoteSavedAt: 0, lastKnownRemoteSavedAt: 0, localSavedAt: 1000 });
  assert.equal(conflict, false);
});

test("no conflict when remote matches what we last knew about", () => {
  const { conflict } = detectDriveConflict({ remoteSavedAt: 500, lastKnownRemoteSavedAt: 500, localSavedAt: 1000 });
  assert.equal(conflict, false);
});

test("no conflict when remote equals the payload we're about to push (our own echo)", () => {
  const { conflict } = detectDriveConflict({ remoteSavedAt: 1000, lastKnownRemoteSavedAt: 500, localSavedAt: 1000 });
  assert.equal(conflict, false);
});

test("conflict when another device advanced the remote past what we last knew, and it differs from our push", () => {
  const result = detectDriveConflict({ remoteSavedAt: 2000, lastKnownRemoteSavedAt: 500, localSavedAt: 1000 });
  assert.equal(result.conflict, true);
  assert.equal(result.remoteSavedAt, 2000);
});

test("concrete scenario: device A pushes, device B (stale) tries to push over it", () => {
  // Device B pulled at t=100 (lastKnownRemoteSavedAt=100). Device A has since
  // pushed at t=300. Device B now tries to push its own, older edit (t=200).
  const result = detectDriveConflict({ remoteSavedAt: 300, lastKnownRemoteSavedAt: 100, localSavedAt: 200 });
  assert.equal(result.conflict, true, "device B's stale push must be blocked, not silently overwrite device A's newer data");
});
