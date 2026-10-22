"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { detectDriveConflict, shouldPushAfterReconciling } = require("../lib/drive-conflict.js");

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

// --- shouldPushAfterReconciling: the "override the cloud unless it's genuinely
// ahead" behavior a user expects from any syncing app ---

test("after reconciling, push proceeds when local is newer than the remote", () => {
  assert.equal(shouldPushAfterReconciling({ remoteSavedAt: 500, localSavedAt: 1000 }), true);
});

test("after reconciling, push proceeds when local exactly ties the remote", () => {
  assert.equal(shouldPushAfterReconciling({ remoteSavedAt: 1000, localSavedAt: 1000 }), true);
});

test("after reconciling, push is skipped only when the remote is strictly newer", () => {
  assert.equal(shouldPushAfterReconciling({ remoteSavedAt: 2000, localSavedAt: 1000 }), false);
});

test("regression: this device's existing, newer local data must still push even on the first sync of a session", () => {
  // This is the exact bug found on review: `_lastKnownRemoteSavedAt` always
  // starts at 0 for a fresh session, so the very first push of any session
  // always looks like a "conflict" against a non-empty remote — even when
  // the remote is just an old backup and the local data is clearly newer.
  // The old code treated every such conflict as "don't push." Confirm the
  // decision function now says to push anyway in that case.
  const remoteSavedAt = 1_000_000;       // an old existing cloud backup
  const lastKnownRemoteSavedAt = 0;      // fresh session, never checked yet
  const localSavedAt = 5_000_000;        // this device's current, newer data
  const { conflict } = detectDriveConflict({ remoteSavedAt, lastKnownRemoteSavedAt, localSavedAt });
  assert.equal(conflict, true, "a never-checked remote still triggers a reconciliation check");
  assert.equal(
    shouldPushAfterReconciling({ remoteSavedAt, localSavedAt }),
    true,
    "but since local is newer, the push must still go through, not get silently dropped"
  );
});

test("new-browser restore scenario: fresh install with no local data pulls the cloud backup instead of pushing over it", () => {
  // A brand-new browser/profile has S._savedAt === 0 (nothing saved yet).
  // The existing cloud backup is unambiguously newer, so the right call is
  // "restore from cloud," never "push my empty state over it."
  const remoteSavedAt = 1_000_000; // existing cloud backup from another device
  const localSavedAt = 0;          // fresh install, nothing saved locally yet
  assert.equal(
    shouldPushAfterReconciling({ remoteSavedAt, localSavedAt }),
    false,
    "a fresh install must restore from the cloud backup, not overwrite it with empty local state"
  );
});
