"use strict";
(function (root) {
  /**
   * Decides whether a push to Drive would silently clobber a newer write
   * made by another device. Pure function — no fetch, no storage.
   *
   * - remoteSavedAt:        `_savedAt` currently stored in the remote file
   * - lastKnownRemoteSavedAt: the remote `_savedAt` this device last
   *                           observed (via a prior pull or push)
   * - localSavedAt:         this device's own `_savedAt` about to be pushed
   *
   * A conflict means: the remote moved past what we last knew about, and
   * that movement isn't just an echo of our own last push.
   */
  function detectDriveConflict({ remoteSavedAt, lastKnownRemoteSavedAt, localSavedAt }) {
    const remote = remoteSavedAt || 0;
    const lastKnown = lastKnownRemoteSavedAt || 0;
    const local = localSavedAt || 0;
    if (!remote) return { conflict: false };
    if (remote <= lastKnown) return { conflict: false };
    if (remote === local) return { conflict: false };
    return { conflict: true, remoteSavedAt: remote };
  }

  const api = { detectDriveConflict };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneDriveConflict = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
