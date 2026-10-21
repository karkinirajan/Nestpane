"use strict";
(function (root) {
  /**
   * A debounce wrapper that can also be flushed (run the pending call
   * immediately, synchronously) or cancelled (drop the pending call).
   *
   * This exists because browsers can tear down an extension page's JS
   * context at any time — a tab discard, a forced reload, a crash — and the
   * plain `debounce()` used elsewhere in app.js has no way to force the
   * last pending call to run before that happens. Every long-form text
   * editor in the app (notes, journal) schedules autosaves through one of
   * these, and a page-hide/visibility handler calls `.flush()` on all of
   * them so nothing typed is ever lost to a debounce window that never
   * got to fire naturally.
   */
  function createFlushableDebounce(fn, delayMs) {
    let timer = null;
    let pendingArgs = null;

    function run(args) {
      timer = null;
      pendingArgs = null;
      fn(...args);
    }

    function schedule(...args) {
      pendingArgs = args;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => run(pendingArgs), delayMs);
    }

    // Runs the pending call right now, synchronously, and clears the timer.
    // No-op (returns false) if nothing is pending.
    function flush() {
      if (timer === null) return false;
      clearTimeout(timer);
      const args = pendingArgs;
      timer = null;
      pendingArgs = null;
      fn(...args);
      return true;
    }

    // Drops the pending call without running it.
    function cancel() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      pendingArgs = null;
    }

    function isPending() {
      return timer !== null;
    }

    return { schedule, flush, cancel, isPending };
  }

  /**
   * A registry of flushable debounces so a single page-hide/visibility
   * handler can flush every active autosave without each feature needing
   * to know about the others.
   */
  function createAutosaveRegistry() {
    const all = [];
    return {
      register(flushable) {
        all.push(flushable);
        return flushable;
      },
      flushAll() {
        all.forEach((f) => f.flush());
      }
    };
  }

  const api = { createFlushableDebounce, createAutosaveRegistry };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneAutosave = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
