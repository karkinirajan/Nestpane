# Nestpane Feature Strategy & Roadmap

Nestpane is live in production on the Chrome Web Store with **130+ active users**. This document records:
1. **Top 5 Distinguishing Roadmap Features** — high-leverage capabilities designed to make Nestpane an unmistakably differentiated, human-crafted browser workspace rather than a generic new-tab extension.
2. **Current Production Core Pillars** — the battle-tested local-first features and Google Drive `appDataFolder` sync architecture already shipping in v2.1.x.

---

## Part 1 — Top 5 Distinguishing Features to Set Nestpane Apart

Most new-tab extensions fail because they are passive wallpaper-and-clock screens or bloated AI-slop templates. Because Nestpane already owns `tabs`, `bookmarks`, `history`, `declarativeNetRequest`, `storage`, and `drive.appdata` in a zero-latency local-first architecture, these **5 distinguishing features** turn Nestpane into an irreplaceable browser command center:

### 1. Context-Switching "Workspace Spaces" (Live Tab Hibernation + Chrome Tab Group Sync)
- **Why it distinguishes Nestpane:** Right now, switching workspaces in Nestpane switches the bookmark/task view on the new tab page, while Tab Sessions are saved manually in a separate view. By binding each **Workspace** (`Personal`, `Engineering`, `Client X`, `Research`) directly to the user's **active browser window tabs and native Chrome Tab Groups**, clicking a Workspace can optionally hibernate the current workspace's open tabs into a zero-RAM snapshot and open/focus the target workspace's tabs.
- **User impact:** Turns Nestpane into an Arc/Workona-grade spatial browser manager without requiring users to abandon Chrome or Brave, and without eating RAM.
- **Technical fit:** Uses existing `tabs` permission + `S.workspaces` + `S.sessions` state, automatically backed up to Google Drive `appDataFolder`.

### 2. Bidirectional `[[Wiki-Links]]` Across Notes, Tasks, Bookmarks & Journal ("Daily Log")
- **Why it distinguishes Nestpane:** In almost every productivity extension, Notes, Kanban cards (Nestodo), Bookmarks, and Journal entries live in isolated silos. Adding lightweight `[[Wiki-Links]]` and `#tag` backlinks across entities lets a user type `[[PR #142]]` or `@Design-System` inside their Daily Journal or a Note and link directly to a Nestodo Kanban card, a saved Bookmark, or a Reading Queue article.
- **User impact:** Opening a new tab shows a unified **Today's Thread** — tasks completed today, focus sessions logged, bookmarks saved today, and today's journal entry — giving Obsidian/Logseq-level connected thought with zero setup.
- **Technical fit:** Pure client-side index over `S.notes`, `S.kanban`, `S.journal`, and `S.readingQueue` in `extension/app.js`.

### 3. Deep-Work "Flow Contracts" (Task-Bound Focus Timer + Hard Intention Gate)
- **Why it distinguishes Nestpane:** Most new-tab timers are passive countdown clocks. Nestpane already uses `chrome.declarativeNetRequest` for site blocking. Upgrading Focus Mode into a **Task-Bound Flow Contract** lets users click **"Focus on this card (25m)"** directly on any Nestodo task:
  1. Pins the active task title to the top of every new tab and the extension popup.
  2. Activates `declarativeNetRequest` distraction rules for blocked domains.
  3. Replaces blocked sites with a calm, local Nestpane **Intention Gate** (*"You're 14 minutes into 'Finish OAuth Review'. Unlock for 2 minutes by typing why, or return to work"*).
  4. Automatically logs the completed focus minutes directly onto that specific Kanban card's history.
- **User impact:** Replaces separate paid blockers (Freedom, Cold Turkey, Opal) directly inside the user's task board.

### 4. Global In-Page Command HUD & Instant Clipper (`Alt+K` / Selection Clip to Workspace)
- **Why it distinguishes Nestpane:** Currently, the Command Palette (`/`) only works when the user is on the New Tab page, and the toolbar popup only bookmarks the full URL. Adding a keyboard-triggered **Quick Capture & Clip action** allows users on *any* webpage to highlight a code snippet, quote, or paragraph, press a shortcut (or right-click context menu), and clip the highlighted markdown + source URL + timestamp straight into a Nestpane Note, Nestodo Task, or Reading Queue item.
- **User impact:** Eliminates the need to open a new tab just to jot down a thought or save a quote while researching.

### 5. Time-Machine Version History & Encrypted Workspace Sharing
- **Why it distinguishes Nestpane:** Local-first power users care deeply about data durability. Building on Nestpane's Google Drive `appDataFolder` sync and AES-GCM encryption:
  1. **Rolling Cloud & Local Snapshots:** Maintain a 7-day rolling ring buffer of daily snapshots in `appDataFolder` (`nestpane-snapshot-YYYY-MM-DD.json`) with a visual diff viewer ("Restore 3 deleted notes from Tuesday without rolling back today's tasks").
  2. **One-Click Curated Workspace Bundles:** Export a single Workspace (e.g., *"Frontend Engineering Bookmarks + Starter Notes"*) as a clean, shareable JSON/URL bundle that teammates or community members can import into their own Nestpane in one click — creating a built-in viral growth loop.

---

## Part 2 — Current Production Core Pillars (v2.1.x)

| Pillar | Value | Differentiation | Demo (<10s) | Reliability | Local-First Fit | Total |
|---|---|---|---|---|---|---|
| **Bulletproof Google Drive `appDataFolder` Sync + E2E Encryption** | 5 | 5 | 4 | 5 | 5 | 24 |
| **Focus Timer + On-Device `declarativeNetRequest` Site Blocking** | 5 | 4 | 5 | 4 | 5 | 23 |
| **BYOK AI (Ask AI / Smart Organize / Daily Briefing)** | 4 | 5 | 4 | 4 | 5 | 22 |
| **Markdown Notes + Instant Tab-Hide Autosave** | 4 | 3 | 5 | 5 | 5 | 22 |
| **Human-Crafted Obsidian & Paper Design System (6 Themes)** | 5 | 4 | 5 | 5 | 5 | 24 |

### 1. Bulletproof Google OAuth & Google Drive `appDataFolder` Backup/Sync
- **First-Login Cloud Override:** When a user installs Nestpane on a new browser or signs in for the first time (`!S._driveHasEverSynced`), `reconcileOnConnect` in `extension/lib/drive-conflict.js` guarantees that an existing cloud backup in Google Drive **always pulls and overrides** the initial default installed state — even if the user clicked around on the fresh install before signing in.
- **Instant Progressive Sync (500ms Debounce + In-Flight Queue + Tab-Hide Flush):** Local edits trigger `scheduleDriveSync()` after 500ms. If a push is already in flight (`Drive._syncing`), subsequent edits queue via `Drive._pendingPush` and flush immediately upon completion. Closing or hiding a tab (`visibilitychange` / `pagehide`) immediately flushes any pending Drive upload.
- **Complete State Coverage & Deduplication:** `buildDrivePayload()` and `applyCloudData()` cover 100% of user state (workspaces, quick access, deleted default tombstone IDs `_qaDeleted`, sidebar groups/links, notes, Nestodo tasks, reminders, habits, reading queue, tab sessions, journal, calendar events, focus session stats, web bookmarks tree, and theme/accent settings) while keeping the user's Anthropic API key strictly device-local and automatically cleaning up duplicate `nestpane-data.json` files in `appDataFolder`.
- **Files:** `extension/app.js`, `extension/lib/drive-conflict.js`, `extension/tests/drive-conflict.test.js` (11 passing unit tests).

### 2. Human-Crafted Obsidian & Warm Paper Design System
- **Visual Restraint & Precision:** Designed with warm mineral neutrals (`#0c0d0e` Obsidian Dark canvas, `#131517` elevated surfaces, `#23262a` 1px architectural hairlines, `#f3f2ee` warm alabaster typography, and `#e86c2c` Terracotta Ember accent) plus a daylight Warm Paper theme (`#f8f6f2`) and 4 complete classic palettes (`Nord`, `Catppuccin Mocha`, `Gruvbox`, `Solarized`).
- **Editorial & Technical Typography:** Pairs `Inter` (`cv02`, `cv03`, `cv04`, `cv11`) with `Instrument Serif` and `JetBrains Mono` (`tabular-nums` on all timers, KPI counters, and badges).
- **Files:** `extension/style.css`, `extension/newtab.html`, `extension/popup.html`, `extension/fouc.js`, `webapp/*.html`.

### 3. Focus Timer with On-Device Site Blocking
- Starts a timed Pomodoro focus session that blocks distracting domains via `chrome.declarativeNetRequest` dynamic rules, evaluated strictly on-device by the browser.
- **File:** `extension/app.js`

### 4. Bring-Your-Own-Key (BYOK) AI Features
- "Ask AI" in the Command Palette, Smart Organize for open tabs, and AI Task Breakdown — powered by the user's own Anthropic API key stored only in local storage (`_aiApiKey`) and sent directly from the browser to `api.anthropic.com`.
- **File:** `extension/app.js`

### 5. Markdown Notes & Journal with Tab-Hide Autosave
- Safe HTML-escaped Markdown rendering with live preview, debounced autosave (`extension/lib/autosave.js`), and immediate flush on `visibilitychange` / `pagehide`.
- **Files:** `extension/app.js`, `extension/lib/autosave.js`, `extension/lib/format.js`.
