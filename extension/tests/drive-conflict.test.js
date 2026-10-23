"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  detectDriveConflict,
  reconcileOnConnect,
  shouldPushAfterReconciling
} = require("../lib/drive-conflict.js");

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
  const result = detectDriveConflict({ remoteSavedAt: 300, lastKnownRemoteSavedAt: 100, localSavedAt: 200 });
  assert.equal(result.conflict, true, "device B's stale push must be blocked, not silently overwrite device A's newer data");
});

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
  const remoteSavedAt = 1_000_000;
  const lastKnownRemoteSavedAt = 0;
  const localSavedAt = 5_000_000;
  const { conflict } = detectDriveConflict({ remoteSavedAt, lastKnownRemoteSavedAt, localSavedAt });
  assert.equal(conflict, true, "a never-checked remote still triggers a reconciliation check");
  assert.equal(
    shouldPushAfterReconciling({ remoteSavedAt, localSavedAt }),
    true,
    "but since local is newer, the push must still go through, not get silently dropped"
  );
});

test("new-browser restore scenario: fresh install with no local data pulls the cloud backup instead of pushing over it", () => {
  const remoteSavedAt = 1_000_000;
  const localSavedAt = 0;
  assert.equal(
    shouldPushAfterReconciling({ remoteSavedAt, localSavedAt }),
    false,
    "a fresh install must restore from the cloud backup, not overwrite it with empty local state"
  );
});

test("reconcileOnConnect: first login on a new browser ALWAYS pulls cloud backup even if local was touched before login", () => {
  const remoteSavedAt = 1_700_000_000_000;
  const localSavedAt = 1_700_050_000_000; // user toggled theme or clicked around before signing in
  assert.equal(
    reconcileOnConnect({
      remoteSavedAt,
      localSavedAt,
      hasRemoteFile: true,
      isFirstLoginOrFreshInstall: true
    }),
    "pull",
    "first login must pull existing cloud backup and override initial installed setup"
  );
  assert.equal(
    shouldPushAfterReconciling({
      remoteSavedAt,
      localSavedAt,
      isFirstLoginOrFreshInstall: true
    }),
    false
  );
});

test("reconcileOnConnect: first login when no cloud backup exists pushes local state to seed Drive", () => {
  assert.equal(
    reconcileOnConnect({
      remoteSavedAt: 0,
      localSavedAt: 0,
      hasRemoteFile: false,
      isFirstLoginOrFreshInstall: true
    }),
    "push"
  );
});

test("reconcileOnConnect: already-synced browser compares timestamps accurately", () => {
  assert.equal(
    reconcileOnConnect({
      remoteSavedAt: 2000,
      localSavedAt: 1000,
      hasRemoteFile: true,
      isFirstLoginOrFreshInstall: false
    }),
    "pull"
  );
  assert.equal(
    reconcileOnConnect({
      remoteSavedAt: 1000,
      localSavedAt: 2000,
      hasRemoteFile: true,
      isFirstLoginOrFreshInstall: false
    }),
    "push"
  );
  assert.equal(
    reconcileOnConnect({
      remoteSavedAt: 1500,
      localSavedAt: 1500,
      hasRemoteFile: true,
      isFirstLoginOrFreshInstall: false
    }),
    "noop"
  );
});
