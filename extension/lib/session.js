"use strict";
(function (root) {
  /**
   * Timing rules for keeping a Google sign-in alive. Pure functions — no
   * timers, no storage, no network.
   *
   * Google's browser-only OAuth flow hands out access tokens that last about
   * an hour and no refresh token, so "staying signed in" means quietly
   * fetching a new token before the old one runs out. These rules decide
   * when to do that.
   */

  // Renew this long before a token expires, so a tab never holds a dead token.
  const RENEW_BEFORE_MS = 5 * 60 * 1000;
  // How often to check in when the token's expiry is unknown (Chrome's own
  // token cache manages its expiry itself).
  const KEEPALIVE_MS = 45 * 60 * 1000;
  // Never check sooner than this, so a token close to expiry can't cause a busy loop.
  const MIN_DELAY_MS = 30 * 1000;
  // After failed renewals, back off 1, 2, 4, 8 minutes … up to this cap.
  const MAX_BACKOFF_MS = 15 * 60 * 1000;
  const FIRST_BACKOFF_MS = 60 * 1000;

  /**
   * True when a token is missing, expired, or close enough to expiry that it
   * should be replaced now.
   */
  function needsRenewal(expiresAt, now) {
    if (!expiresAt) return true;
    return now >= expiresAt - RENEW_BEFORE_MS;
  }

  /**
   * How long to wait before the next keep-alive check.
   * - failures:  renewals that have failed in a row
   * - expiresAt: when the current token expires, or 0 if unknown
   * - now:       the current time
   */
  function keepAliveDelay({ failures, expiresAt, now }) {
    if (failures > 0) {
      return Math.min(FIRST_BACKOFF_MS * 2 ** (failures - 1), MAX_BACKOFF_MS);
    }
    if (expiresAt && expiresAt > now) {
      return Math.max(expiresAt - RENEW_BEFORE_MS - now, MIN_DELAY_MS);
    }
    return KEEPALIVE_MS;
  }

  const api = {
    RENEW_BEFORE_MS,
    KEEPALIVE_MS,
    MIN_DELAY_MS,
    MAX_BACKOFF_MS,
    needsRenewal,
    keepAliveDelay
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneSession = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
