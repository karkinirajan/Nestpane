"use strict";
(function (root) {
  /**
   * Decides whether a push to Drive would silently clobber a newer write
   * made by another device. Pure function — no fetch, no storage.
   *
   * - remoteSavedAt:          `_savedAt` currently stored in the remote file
   * - lastKnownRemoteSavedAt: the remote `_savedAt` this device last
   *                           observed (via a prior pull or push)
   * - localSavedAt:           this device's own `_savedAt` about to be pushed
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
   * Decides what action to take when connecting / signing in to Google Drive:
   * - "pull": load the cloud backup and override local state
   * - "push": upload local state to Google Drive
   * - "noop": local and remote are already at the exact same timestamp
   *
   * Crucial rule for new browsers & first logins (`isFirstLoginOrFreshInstall`):
   * If a remote backup exists in Drive (`remote > 0` or `hasRemoteFile`), it
   * MUST always be pulled to override the initial installed state — even if
   * the user clicked around on the fresh install before signing in (which
   * would otherwise give `localSavedAt` a newer timestamp than the backup).
   */
  function reconcileOnConnect({
    remoteSavedAt,
    localSavedAt,
    hasRemoteFile = Boolean(remoteSavedAt),
    isFirstLoginOrFreshInstall = false
  }) {
    const remote = remoteSavedAt || 0;
    const local = localSavedAt || 0;
    if (!hasRemoteFile && remote <= 0) {
      return "push";
    }
    if (isFirstLoginOrFreshInstall && (hasRemoteFile || remote > 0)) {
      return "pull";
    }
    if (remote > local) {
      return "pull";
    }
    if (local > remote) {
      return "push";
    }
    return "noop";
  }

  /**
   * After a detected conflict has been reconciled (the newer remote copy,
   * if any, has been pulled in), decides whether the push that triggered
   * the conflict check should still go ahead.
   *
   * If `isFirstLoginOrFreshInstall` is true and a remote backup exists,
   * never push over it — the remote backup must be restored first.
   */
  function shouldPushAfterReconciling({
    remoteSavedAt,
    localSavedAt,
    isFirstLoginOrFreshInstall = false
  }) {
    const remote = remoteSavedAt || 0;
    const local = localSavedAt || 0;
    if (isFirstLoginOrFreshInstall && remote > 0) {
      return false;
    }
    return local >= remote;
  }

  const api = {
    detectDriveConflict,
    reconcileOnConnect,
    shouldPushAfterReconciling
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneDriveConflict = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
