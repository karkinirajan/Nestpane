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

  /**
   * After a detected conflict has been reconciled (the newer remote copy,
   * if any, has been pulled in), decides whether the push that triggered
   * the conflict check should still go ahead.
   *
   * This is what makes "override the cloud unless it's genuinely behind"
   * work: a conflict only means "go check the remote before assuming
   * you're first" — it must not mean "never push this round." If what we
   * were about to push is still at least as new as the remote, local wins
   * and the push proceeds; only a remote that's strictly newer blocks it.
   */
  function shouldPushAfterReconciling({ remoteSavedAt, localSavedAt }) {
    const remote = remoteSavedAt || 0;
    const local = localSavedAt || 0;
    return local >= remote;
  }

  const api = { detectDriveConflict, shouldPushAfterReconciling };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneDriveConflict = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
