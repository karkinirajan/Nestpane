"use strict";
// The edges of the push / pull / conflict decisions, pinned by mutation testing: each case failed to fail when the matching rule was
// deliberately broken. A wrong answer here overwrites somebody's data, in one direction or the other.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { reconcileOnConnect, shouldPushAfterReconciling, detectDriveConflict } = require("../lib/drive-conflict.js");

test("a cloud file that has not changed since it was last seen is not a conflict, even when it differs from local", () => {
  assert.deepEqual(detectDriveConflict({ remoteSavedAt: 100, lastKnownRemoteSavedAt: 100, localSavedAt: 50 }), { conflict: false });
  assert.deepEqual(detectDriveConflict({ remoteSavedAt: 90, lastKnownRemoteSavedAt: 100, localSavedAt: 50 }), { conflict: false });
});

test("a cloud file that is newer than last seen, and not what local already has, is a conflict", () => {
  assert.deepEqual(detectDriveConflict({ remoteSavedAt: 200, lastKnownRemoteSavedAt: 100, localSavedAt: 50 }), {
    conflict: true,
    remoteSavedAt: 200
  });
});

test("a cloud file that is newer than last seen but identical in time to local is not a conflict", () => {
  assert.deepEqual(detectDriveConflict({ remoteSavedAt: 200, lastKnownRemoteSavedAt: 100, localSavedAt: 200 }), { conflict: false });
});

test("on connect, no cloud file means push, but a named cloud file with a time is not 'no file'", () => {
  assert.equal(reconcileOnConnect({ remoteSavedAt: 0, localSavedAt: 100 }), "push");
  // an explicit hasRemoteFile: false with a real time is still a file to compare against
  assert.equal(reconcileOnConnect({ remoteSavedAt: 500, localSavedAt: 100, hasRemoteFile: false }), "pull");
  // a file that exists but has no usable time, against an empty local, has nothing to push or pull
  assert.equal(reconcileOnConnect({ remoteSavedAt: 0, localSavedAt: 0, hasRemoteFile: true }), "noop");
});

test("on connect, a first login or fresh install always pulls whatever the cloud has", () => {
  const fresh = { isFirstLoginOrFreshInstall: true };
  // newer local data must not overwrite the cloud copy on a fresh install
  assert.equal(reconcileOnConnect({ ...fresh, remoteSavedAt: 500, localSavedAt: 900 }), "pull");
  // a file with no usable time still counts as a file
  assert.equal(reconcileOnConnect({ ...fresh, remoteSavedAt: 0, localSavedAt: 100, hasRemoteFile: true }), "pull");
  // a time without a file flag still counts as a file
  assert.equal(reconcileOnConnect({ ...fresh, remoteSavedAt: 500, localSavedAt: 900, hasRemoteFile: false }), "pull");
  // nothing in the cloud at all: push what is local
  assert.equal(reconcileOnConnect({ ...fresh, remoteSavedAt: 0, localSavedAt: 900 }), "push");
});

test("on connect, otherwise the newer side wins, and equal times do nothing", () => {
  assert.equal(reconcileOnConnect({ remoteSavedAt: 200, localSavedAt: 100 }), "pull");
  assert.equal(reconcileOnConnect({ remoteSavedAt: 100, localSavedAt: 200 }), "push");
  assert.equal(reconcileOnConnect({ remoteSavedAt: 100, localSavedAt: 100 }), "noop");
});

test("after reconciling, push unless this is a fresh install that just pulled a real cloud file", () => {
  assert.equal(shouldPushAfterReconciling({ remoteSavedAt: 100, localSavedAt: 200 }), true);
  assert.equal(shouldPushAfterReconciling({ remoteSavedAt: 100, localSavedAt: 100 }), true, "an equal time still pushes");
  assert.equal(shouldPushAfterReconciling({ remoteSavedAt: 200, localSavedAt: 100 }), false);
  assert.equal(shouldPushAfterReconciling({ isFirstLoginOrFreshInstall: true, remoteSavedAt: 200, localSavedAt: 900 }), false);
  // a fresh install with nothing in the cloud has nothing to protect
  assert.equal(shouldPushAfterReconciling({ isFirstLoginOrFreshInstall: true, remoteSavedAt: 0, localSavedAt: 5 }), true);
  // the fresh-install rule does not apply to an ordinary session
  assert.equal(shouldPushAfterReconciling({ isFirstLoginOrFreshInstall: false, remoteSavedAt: 100, localSavedAt: 200 }), true);
});
