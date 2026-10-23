# Changelog

## 2.1.4 — 2026-10-23

### Added — Top 5 Distinguishing Features
- **Workspace Tab Stash & 1-Click Context Switch:** Added **Stash & Clear Tabs** (`#stashSessionBtn`) and **Switch Here** (`data-action="switch-session"`) in Tab Sessions (`extension/app.js`, `extension/newtab.html`), allowing users to stash all open unpinned tabs into a timestamped session and switch their browser window to another saved session in one click.
- **Bidirectional `[[Wiki-Links]]` & Live Backlinks:** Added `extension/lib/wikilinks.js` (`NestpaneWikiLinks`, 3 unit tests) and wired `_mdRender()`, the Note Editor (`#noteBacklinksBar`), and the Daily Journal (`#journalBacklinksBar`) so `[[Note Title]]`, `[[Task Title]]`, `[[Bookmark]]`, and `[[YYYY-MM-DD]]` render as interactive pills and display live incoming backlinks.
- **Task-Bound Focus Flow Contracts:** Added 1-click `🎯` Focus triggers on To-Do widget items and Nestodo Kanban cards (`startFocusOnTask`), binding the active task to the Pomodoro timer (`#timerModeBadge`) and automatically logging completed focus minutes (`⏱ Xm`) onto the task card.
- **4-Mode Instant Web Clipper in Toolbar Popup:** Upgraded `extension/popup.html` and `extension/popup.js` so any active tab can be clipped not only to **Quick Access** or a **Bookmark Folder**, but also directly as a **Kanban Task** (`kanban.todo`) or **Reading Queue + Markdown Note** (`readingQueue` + `notes`), stamping `_savedAt` for instant Drive sync.
- **Rolling 7-Day Snapshot Time Machine:** Added `extension/lib/snapshots.js` (`NestpaneSnapshots`, 2 unit tests) and Settings → Data Management → **Daily Snapshot Time Machine** (`#snapshotsList`), automatically recording up to 7 daily restore points (`S._snapshots`, synced to Google Drive) with 1-click full workspace restore.

### Fixed — Google OAuth & Google Drive Backup/Sync
- **Fixed fresh installs overwriting existing Google Drive backups on first sign-in:** Previously, `_finishSignIn()` and `checkGoogleIdentity()` called `save()` *before* `syncWithDriveOnConnect()`, stamping the default fresh-install state with `S._savedAt = Date.now()` and causing the fresh install to overwrite the user's cloud backup. Pre-sync profile updates now write only `googleUser` without bumping `S._savedAt`, and `reconcileOnConnect()` (`extension/lib/drive-conflict.js`) unconditionally pulls and applies the remote cloud backup when `!S._driveHasEverSynced` and a backup exists in Google Drive.
- **Fixed legacy migration re-seeding default links on every second tab load:** `migrateAddSocials()` and `migrateSyncSbLinksToQA()` now only run when migrating an actual legacy pre-sidebar storage object (`S._hadLegacyWithoutSidebar`), preventing deleted default shortcuts from re-appearing or bumping `S._savedAt`.
- **Made progressive Google Drive sync near-instant and lossless:**
  - Reduced `scheduleDriveSync()` debounce from `2000ms` to `500ms`.
  - Added in-flight push queueing (`Drive._syncing` + `Drive._pendingPush`) so edits made while a Drive upload is in progress are never dropped and immediately trigger a follow-up push.
  - Added `_flushPendingDrivePush()` on `visibilitychange` (hidden) and `pagehide` so closing a tab immediately flushes pending Drive changes.
  - Persisted `_driveLastRemoteSavedAt` and `_driveHasEverSynced` in `chrome.storage.local` across tab loads.
  - Added pre-POST `findDriveFiles()` verification and automatic 404 file recreation retry in `_doPush()`.
- **Complete Drive backup payload coverage:** `buildDrivePayload()` and `applyCloudData()` now include `_focusSessions`, `_focusMinutes`, `_webBookmarksTree`, and `ai` preferences (with `apiKey` stripped so keys stay device-local), and refresh all active views immediately after applying cloud state.
- **Toolbar popup Drive sync & habit counter fix:** Saving a bookmark from `popup.js` now stamps `_savedAt: Date.now()` so open tabs and subsequent sessions push the change to Google Drive; fixed the popup's today-habits counter to check `completedDates.includes(today)`.

### Changed — Human-Crafted Design & Color System (Extension + Website)
- **Obsidian Dark & Warm Paper Design System:** Refined `extension/style.css`, `extension/newtab.html`, `extension/fouc.js`, and `extension/popup.html` with warm mineral neutrals (`#0c0d0e` canvas, `#131517` card surface, `#23262a` 1px architectural hairlines, `#f3f2ee` warm alabaster text, and `#e86c2c` Terracotta Ember accent), Warm Paper light mode (`#f8f6f2`), and complete CSS token sets for `nord`, `catppuccin`, `gruvbox`, and `solarized`.
- **Typography:** Paired `Inter` (`cv02`, `cv03`, `cv04`, `cv11`) with `Instrument Serif` and `JetBrains Mono` (`tabular-nums` on timers, KPI counters, and shortcut badges).
- **Website Overhaul (`webapp/`):** Redesigned `index.html`, `about.html`, `changelog.html`, `privacy.html`, `terms.html`, and `dashboard/oauth-callback.html` to match the Obsidian Dark + Terracotta Ember system, replacing the placeholder hero mockup with an authentic architectural workspace preview while preserving all Google OAuth verification requirements.

## 2.1.3 — 2026-10-22

### Fixed
- **Security: signing out of the web dashboard didn't actually revoke or clear the Google OAuth
  token.** `_revokeGoogleAccess()`'s revoke-and-clear logic was guarded by `IS_CHROME`, which is
  false on the web dashboard — so clicking "sign out" there cleared the UI/profile state but
  left a fully valid token sitting in `localStorage` and never told Google to revoke it. Anyone
  with access to that browser profile could keep syncing with it until it expired naturally
  (~55 minutes). Caught by an automated security review right after 2.1.2 shipped the web OAuth
  flow this applies to. Fixed: sign-out now revokes and clears the token unconditionally, on
  every platform, not just when `chrome.identity` exists. No test added — this path depends on
  real browser storage and a live token, which couldn't be exercised in this session the same
  way the pure-logic fixes elsewhere in this release were.

## 2.1.2 — 2026-10-22

### Added
- **Web dashboard** at `nestpane.kneeraazon.com/dashboard/` — the same `app.js`/`lib/*.js` the
  extension uses, served as a plain web page so people can try Nestpane with no install. Built
  by `node scripts/build-dashboard.js` from the extension source (not a hand-duplicated copy).
  See `docs/browsers/dashboard.md` for exactly what's identical to the extension and what can't
  be (bookmarks/history/downloads/tab-sessions/site-blocking are extension-only browser
  privileges on every browser, not a Nestpane limitation).
- A real, persisted bookmark store for contexts without `chrome.bookmarks` (the web dashboard):
  `extension/lib/bookmarks-store.js`, 10 unit tests. Previously, Add/Edit/Move/Delete bookmark
  silently no-op'd outside the extension — now it actually works, against Nestpane's own
  localStorage-backed tree (not the browser's native bookmarks, which no web page can access).
- Google sign-in / Drive backup on the web dashboard, via a standard OAuth2 redirect flow
  (`_plainWebOAuthToken` in `app.js`, `webapp/dashboard/oauth-callback.html`) since
  `chrome.identity` doesn't exist outside an extension. **Needs one manual step before it
  actually works**: a redirect URI for the dashboard's own origin must be registered in Google
  Cloud Console — not something this session could do. Full detail in `dashboard.md` §3.
- Reminders and habit notifications now fall back to the standard Web Notifications API when
  `chrome.notifications` isn't available, instead of just doing nothing.

### Fixed
- **History and Downloads views previously showed fake placeholder data** (a hardcoded
  "GitHub, Stack Overflow, YouTube…" list) whenever `chrome.history`/`chrome.downloads` weren't
  available, which would have been actively misleading once this ran as a real web page. Both
  now return empty and show "Requires the browser extension," matching the pattern already used
  elsewhere in the app for Chromium-only features.
- Hardened a handful of `chrome.*` references that weren't guarded as consistently as the rest
  of the codebase (`FOCUS_RULE_CEILING`'s top-level initializer, Tab Sessions save/restore) —
  harmless inside the real extension, but would throw once the same file started running as a
  plain web page on a browser with no `chrome` global at all. No functional change for the
  extension itself.

### Site
- `webapp/`: added the missing AI-features and Journal cards to the public feature list (they
  existed in the product but not on the site), a `robots.txt`, a `sitemap.xml`, a JSON-LD
  `SoftwareApplication` block (no invented ratings/install counts), and a public `changelog.html`
  derived from this file. Nav/footer links updated across every page.

## 2.1.1 — 2026-10-22

Version-only bump. The Chrome Web Store rejected uploading 2.1.0 (already present there in some
form). No code changes beyond the version number itself — everything listed under 2.1.0 below
(migrations, Drive-conflict handling, autosave/flush-on-hide, Brave auth-token persistence, and
the Drive-sync override-vs-restore fix) is included in this build; see that section for details.
`manifest.json`, `package.json`, and `package-lock.json` all bumped together. Rebuilt, re-tested
(34/34 passing), re-linted (`eslint --max-warnings 0` clean), and re-zipped —
`nestpane-v2.1.1-chrome.zip`, SHA-256 `28180997858f59619507f0fd89cfa95e53f39f834b490c62b6ed9a1d545282a2`.

## 2.1.0 — 2026-10-21 (updated 2026-10-22)

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
- **Google sign-in appearing logged-out on every new tab in Brave.** Root cause, confirmed by
  reading the code: there's no background service worker, so every new-tab page is a fresh JS
  context. On Chrome, `chrome.identity.getAuthToken` papers over this because Chrome caches the
  token itself at the OS/profile level. But `_isBrave()` (`app.js`) deliberately skips that
  native call on Brave and uses the `launchWebAuthFlow` fallback instead — and that fallback's
  token was only ever held in a plain in-memory variable (`_webAuthToken`), never written to
  `chrome.storage.local`. So on Brave, every single new tab started from zero, with nothing to
  fall back on but a silent `prompt: "none"` re-auth — which can itself fail quietly if Brave's
  stricter third-party-cookie/storage-partitioning blocks the hidden auth iframe from seeing the
  existing Google session. Either way, the user saw "logged out" far more often than intended.
  Fixed by persisting the web-auth-flow token (`_waToken`/`_waTokenExp`) to
  `chrome.storage.local` and rehydrating it on first use in a new tab, so a token obtained once
  survives across new-tab loads until it actually expires (~55 minutes), instead of being
  thrown away the instant the tab closes. Cleared correctly on sign-out
  (`_forgetToken`/`_clearPersistedWebAuthToken`). Never included in the Drive sync payload
  (`buildDrivePayload()` doesn't reference it) — confirmed by reading that function's full field
  list. **This does not fix the underlying ~55-minute-expiry re-auth if Brave's cookie
  partitioning blocks the silent `prompt:"none"` flow** — that's a Brave privacy-policy
  interaction the extension can't fully control from inside `launchWebAuthFlow`; it only fixes
  the far more common "logged out on literally every refresh" symptom. Verified by static code
  review, lint, and syntax-checking the minified build — not by running it in an actual Brave
  session (none available this session).
- **Drive sync could get stuck never pushing local changes (regression in 2.1.0's own A2 fix,
  caught and fixed same day).** The conflict check added earlier in this release
  (`detectDriveConflict`) treats the very first push of any session as a "conflict" against any
  pre-existing cloud backup, since `Drive._lastKnownRemoteSavedAt` always starts at 0. The old
  handling treated every such conflict as "don't push, period" — so a device with genuinely
  newer local data, syncing against an older cloud backup, would pull (a no-op, since cloud was
  older), then simply stop, leaving its own newer changes stranded locally until the user's next
  edit happened to retrigger a sync. Fixed with a new `shouldPushAfterReconciling()` check
  (`extension/lib/drive-conflict.js`): after reconciling against the remote, the push still goes
  ahead if local is at least as new as the remote — it's only actually skipped when the remote
  is strictly newer. This is what makes "override the cloud with local changes unless the cloud
  is genuinely ahead (new browser/device restores from it instead)" work the way any other
  syncing app behaves. 5 new unit tests, including the exact regression scenario and an explicit
  "fresh install restores from an existing cloud backup instead of overwriting it" case. 34/34
  tests pass total.

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
