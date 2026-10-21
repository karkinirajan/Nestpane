# Changelog

## 2.1.0 — 2026-10-21

### Added
- Storage schema versioning + migration framework (`extension/lib/migrations.js`). All existing
  2.0.1 data is tagged `_schemaVersion: 1` on first load; a pre-migration backup is written to
  `_preMigrationBackup` before any migration runs, and a throwing migration rolls back to the
  original, unmodified data rather than persisting a partial result. No data transformation was
  needed for this release — the framework itself is the deliverable, so the next real schema
  change has somewhere safe to land.
- Drive-sync conflict detection (`extension/lib/drive-conflict.js`). Before pushing to Drive, the
  extension now checks whether the remote file has advanced past what this device last knew
  about; if another device pushed in between, it pulls and merges that newer data instead of
  silently overwriting it.
- Firefox build target: `npm run build:firefox` merges `manifest.firefox.json` onto the base
  manifest (`extension/scripts/merge-manifest.js`) and writes a separate `dist-firefox/` tree
  that cannot collide with or affect the existing Chromium `dist/` pipeline.
- A real automated test suite for the first time: 20 unit tests (Node's built-in `node:test`,
  zero new dependencies) covering HTML escaping, URL sanitizing, the migration framework, the
  Drive-conflict logic, and the manifest-merge logic. `npm test` runs them.
- `docs/feature-registry.json` + `extension/scripts/check-registry.js`: a real, runnable gate
  that fails when an `active` feature has no mapped test. **It currently fails** for 11 of 14
  registered features — see `docs/REPORT.md` for the honest current state; this is the gate
  doing its job, not a regression introduced by 2.1.0.

### Fixed
- `escH()` (`extension/lib/format.js`) now also escapes single quotes, closing a latent
  attribute-breakout gap (audit finding A5).
- **Unsaved edits lost on tab teardown (reported in Brave; same underlying gap in any browser).**
  Notes and Journal entries previously only persisted when the user explicitly clicked Save —
  there was no autosave and no flush-before-unload, so a tab discarded by the browser (e.g.
  Brave's more aggressive tab/memory management, or a stuck auth popup forcing a reload) lost
  anything typed since the last click. Fixed with a debounced autosave
  (`extension/lib/autosave.js`, 800ms) on both editors, plus an immediate flush on
  `visibilitychange`→hidden and `pagehide` so nothing is ever waiting on a debounce window that
  never gets to fire. Also flushes before switching to a different note/journal day, so the
  previous one's edits are never silently dropped by the context switch. 9 new unit tests cover
  the debounce/flush/registry mechanics directly, including the exact "tab torn down mid-edit"
  scenario. The DOM-level wiring (which editors call it, when) was verified by static code
  review and a clean build/lint pass, not by running it in an actual browser — no Brave or
  Chrome instance was available in this session to reproduce the original report or confirm the
  fix live. Treat this as a confident, tested fix to the mechanism, not a confirmed field fix
  until it's been run in a real Brave session.

### Changed
- `escH`/`safeUrl` moved out of `app.js` into a shared, dependency-free `extension/lib/format.js`
  module (loaded via `<script>` before `app.js` in `newtab.html`) so they could be unit tested
  without pulling the entire 8,000-line application into a test harness.

### Not changed (deliberately)
- **No OAuth scope changes.** `userinfo.email`, `userinfo.profile`, `drive.appdata` are
  unchanged from 2.0.1, per the standing constraint against re-triggering Google's branding
  verification review.
- **No new permissions.**

### Migration notes
- Upgrading from 2.0.1: on first load after the update, existing storage is read, backed up to
  `_preMigrationBackup`, tagged `_schemaVersion: 1`, and otherwise left exactly as it was — no
  data shape actually changes in this release.
- No action needed from users; nothing to configure.

### Deferred to a later release
- Full consolidation of `chrome.*` call sites into a single `platform` abstraction module
  (`docs/AUDIT.md` A7) — the existing call sites already degrade gracefully per-browser; this is
  a maintainability improvement, not a functional fix, and refactoring ~40 untested call sites
  wasn't justified for this release.
- Full accessibility (WCAG 2.2 AA) audit, performance baselines, i18n readiness, and CSP-key
  review — not started this session (`docs/discovery.md` "Not yet covered").
- Safari support — blocked on a macOS host (`docs/browsers/safari.md`).
- Firefox AMO submission and `web-ext lint` — buildable this session, not submitted or linted
  (no AMO credentials, `web-ext` not installed).
- Reminders not firing while no new-tab tab is open (`docs/AUDIT.md` A4) — this needs a product
  decision (likely a background service worker + `chrome.alarms`, which is itself an
  architecture change) rather than a quick fix; deferred pending that decision.
