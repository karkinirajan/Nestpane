# Architecture & Product Plan — Nestpane (v2.1.x & Roadmap)

Updated 2026-10-23.

## 1. Design System Overhaul (Human-Crafted Obsidian & Paper)

- **Goal:** Replace generic, high-saturation "AI-slop" visual patterns (thick 1.5px borders, neon glows, mismatched purple popup vs. orange extension vs. neon marketing site, and fake placeholder widgets on the landing page) with a cohesive, human-crafted architectural aesthetic while keeping the extension and website HTML/DOM structure intact.
- **Typography:**
  - UI & Body: `Inter` with OpenType features `"cv02", "cv03", "cv04", "cv11"`.
  - Editorial Accents & Quotes: `Instrument Serif` / `Playfair Display`.
  - Numeric & Technical Data: `JetBrains Mono` with `font-variant-numeric: tabular-nums` on timers, KPI strips, and keyboard badges.
- **Color & Surface Tokens:**
  - **Obsidian (Dark Default):** `--bg: #0c0d0e`, `--surface: #131517`, `--surface-2: #1a1d20`, `--surface-3: #22262a`, `--border: #23262a` (1px hairline), `--text: #f3f2ee`, `--text-2: #a6a49e`, `--text-3: #6e6c67`, `--accent: #e86c2c` (Terracotta Ember), `--accent-2: #f2935c`.
  - **Paper (Light):** `--bg: #f8f6f2`, `--surface: #ffffff`, `--surface-2: #f1ede6`, `--border: #e2ddd3`, `--text: #161514`, `--accent: #c94f14`.
  - **Curated Presets:** Full surface/border/text CSS token definitions for `nord`, `catppuccin`, `gruvbox`, and `solarized` in `extension/style.css`, synchronized with `THEME_PRESETS` in `extension/app.js` and `extension/fouc.js`.
  - **Toolbar Popup & Website Parity:** Unified `extension/popup.html` and all pages in `webapp/` (`index.html`, `about.html`, `changelog.html`, `privacy.html`, `terms.html`, `dashboard/oauth-callback.html`) onto the exact same Obsidian Dark + Terracotta Ember palette.

## 2. 100% Bulletproof Google OAuth & Google Drive `appDataFolder` Sync

- **Root Causes Identified & Fixed:**
  1. **Pre-Sync `save()` Timestamp Poisoning:** Previously, `_finishSignIn(token)` and `checkGoogleIdentity()` called `save()` *before* `syncWithDriveOnConnect(token)`. Because `save()` sets `S._savedAt = Date.now()`, a fresh browser install signing into Google stamped its default state with the current timestamp and overwrote the user's older cloud backup! Fixed by persisting only the `googleUser` key to `chrome.storage.local` before `syncWithDriveOnConnect`, never bumping `S._savedAt` prior to reconciliation.
  2. **First-Login Cloud Backup Override:** Added `reconcileOnConnect({ remoteSavedAt, localSavedAt, hasRemoteFile, isFirstLoginOrFreshInstall })` in `extension/lib/drive-conflict.js`. Whenever a browser signs in for the first time (`!S._driveHasEverSynced`) and a remote backup exists in Google Drive, Nestpane **unconditionally pulls the cloud backup and overrides the initial installed state**, even if the user clicked around on the fresh install before signing in.
  3. **Legacy Migration Guard:** Restricted `migrateAddSocials()` and `migrateSyncSbLinksToQA()` so they only run when migrating an actual legacy pre-sidebar storage object (`S._hadLegacyWithoutSidebar`), preventing default links from re-injecting and bumping `S._savedAt` on subsequent tab loads.
  4. **Instant Progressive Push & Queueing:** Reduced `scheduleDriveSync()` debounce from `2000ms` to `500ms`. Added `Drive._pendingPush` queueing so local edits made while an upload is in flight are immediately pushed as soon as the active upload completes. Added `_flushPendingDrivePush()` on `visibilitychange` (hidden) and `pagehide` so closing a tab right after an edit immediately flushes to Drive.
  5. **Complete State Coverage & Popup Sync:** Added `_focusSessions`, `_focusMinutes`, `_webBookmarksTree`, and sanitized `ai` preferences (excluding `apiKey`) to `buildDrivePayload()` and `applyCloudData()`, and updated `extension/popup.js` to stamp `_savedAt: Date.now()` so bookmarks saved from the toolbar popup immediately sync to Drive.

## 3. Top 5 Distinguishing Roadmap Features

Documented in detail in [`docs/features.md`](features.md):
1. **Context-Switching "Workspace Spaces"** (Live Tab Hibernation + Chrome Tab Group Sync)
2. **Bidirectional `[[Wiki-Links]]` Across Notes, Tasks, Bookmarks & Journal ("Daily Log")**
3. **Deep-Work "Flow Contracts"** (Task-Bound Focus Timer + Hard Intention Gate)
4. **Global In-Page Command HUD & Instant Clipper** (`Alt+K` / Selection Clip to Workspace)
5. **Time-Machine Version History & Encrypted Workspace Sharing**
