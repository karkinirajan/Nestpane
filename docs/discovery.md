# Discovery (Phase 0) — 2026-10-21

Read-only pass. All of the "verified context" in the original brief that conflicted with
reality has been corrected below from direct repo inspection, not from the brief's notes.

## Repo layout

```
/home/kneeraazon/Nestpane
├── extension/      MV3 extension (the product)
├── webapp/         static marketing site, no build step
├── LICENSE, README.md
└── .remember/      local session-memory tool, not part of the product
```

Git branches: `main` (current), `ext`, `web`. No CI config anywhere in the tree
(no `.github/workflows`, no `.yml`/`.yaml` of any kind).

## Corrections to the brief's assumed context

| Brief assumed | Actual |
|---|---|
| v1.5.0 published, jumping to 3.1.0 | `manifest.json` and `package.json` both say **2.0.1**. No 3.x anywhere in the repo. |
| React/Next.js/TypeScript/Tailwind | **Vanilla JS**, no framework, no TypeScript. `extension/app.js` is a single 7,979-line file. |
| Test runners / lint config (Vitest/Jest/Playwright) | **No tests exist.** `eslint` is configured and used (`npm run lint`), nothing else. |
| Bundler-based build needing a cross-browser framework decision (WXT/Plasmo) | Build is `esbuild` via a 193-line hand-written `extension/build.js`. No existing abstraction to migrate. |
| Site at `nestpane.netlify.app` | `homepage_url` in the manifest and webapp both point to `nestpane.kneeraazon.com`. |
| Extension ID `aokkcpfoompjgeknhbkphogfcjjlbpol` | **Confirmed correct** — hardcoded in `app.js:3-7` as `EXPECTED_EXTENSION_ID`, with a console warning if it doesn't match at runtime. |

## Manifest (`extension/manifest.json`)

- `manifest_version: 3`, no `background` key at all — **this extension has no service worker / background script**. Everything (including the focus-timer reminder loop) runs inside the new-tab page's own JS context.
- `chrome_url_overrides.newtab` → `newtab.html`; `action.default_popup` → `popup.html`.
- `oauth2.scopes`: `userinfo.email`, `userinfo.profile`, `drive.appdata` — matches the brief's "don't touch scopes" constraint; no changes needed here for 2.x.
- `permissions`: `tabs`, `bookmarks`, `history`, `downloads`, `storage`, `topSites`, `declarativeNetRequest`, `search`.
- `optional_permissions`: `identity`, `identity.email`, `notifications`.
- `host_permissions` includes `https://api.anthropic.com/*` — resolved on investigation: powers optional BYOK AI features (`app.js:1485-1555`), fully disclosed in `webapp/privacy.html` §6. Not in the original brief's notes, but not a defect.

## Entry points

- `extension/newtab.html` + `app.js` — the dashboard (bookmarks, notes, tasks, focus timer, history, downloads widgets).
- `extension/popup.js` / `popup.html` — toolbar popup.
- `extension/fouc.js` — inline theme-flash prevention, loaded before first paint.
- No options page, no content scripts, no background service worker.

## `chrome.*` API usage (by call count, `extension/app.js`)

| API | Uses | Portability |
|---|---|---|
| `chrome.storage.{local,sync}` | 8 | Portable (Firefox/Safari support `storage` API under `browser.*`) |
| `chrome.identity.*` (`getAuthToken`, `getProfileUserInfo`, `removeCachedAuthToken`, `launchWebAuthFlow`, `getRedirectURL`) | 6 + fallback path | `getAuthToken` is **Chrome-only**; the code already has a `launchWebAuthFlow` fallback at `app.js:1191-1236` keyed off `chrome.identity.getAuthToken` existing — good sign, needs verification it's actually exercised on Firefox/Safari. |
| `chrome.bookmarks.*` | 6 | Portable across Chromium/Firefox; Safari support is partial — must verify against current Apple docs before claiming parity. |
| `chrome.history.*` | 5 | Portable, same caveat for Safari. |
| `chrome.tabs.*` | ~7 | Portable. |
| `chrome.downloads.*` | 4 | Not supported in Safari App Extensions — needs feature-detection + graceful hide. |
| `chrome.search.query` | 2 | Chromium-only API (no Firefox/Safari equivalent) — needs feature detection. |
| `chrome.topSites.get` | 1 | Chromium-only; no Firefox equivalent. |
| `chrome.declarativeNetRequest.*` | 3 (`app.js:4895-4915`, focus-mode site blocking) | Supported in Firefox 113+ and Safari 15+, but rule-count ceilings differ — must verify current limits per browser, not assume Chrome's `MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES`. |
| `chrome.notifications.*` | 2 | Portable but permission model differs on Safari. |
| `chrome.permissions.*` | 2 | Portable. |

**There is no `platform` abstraction layer today** — every one of these is called directly from `app.js`. A cross-browser pass means introducing one, not refactoring an existing one.

## Storage

- `chrome.storage.sync` is primary (`API.get`/`API.set`, `app.js:9-30`), with a `localStorage` fallback (`"ft2_"` key prefix — a leftover from a predecessor product name, not from "Nestpane") used only when `chrome.storage` isn't available (e.g. the web-preview build).
- `chrome.storage.local` used directly in a few additional call sites (reminders, Drive sync cache — not yet fully enumerated).
- **No `schemaVersion` key, no migration framework, no `onInstalled` migration handler found anywhere in `app.js`.** A 2.0.1 → 2.1.0 upgrade today runs on whatever shape is already in storage, with no versioning or rollback.
- No quota-exceeded handling found (`chrome.storage.sync` has strict per-item/total quotas) — a search for "quota" in the codebase returns nothing.

## Auth / Drive sync

- `getAuthToken()` (`app.js:1236`) tries native `chrome.identity.getAuthToken` first, falls back to `launchWebAuthFlow` — this is exactly the dual-strategy pattern the brief wants for cross-browser, it just needs verification and hardening, not invention.
- `pullFromDrive()` / `pushToDrive()` (`app.js:1797`, `app.js:1838`) — a straight pull-then-push; no conflict detection, no merge logic, no revision/version check visible. Risk: concurrent edits on two devices → silent last-write-wins data loss.
- Push is debounced via `setTimeout` (`app.js:1930`), not `chrome.alarms` — fine since there's no persistent background context for alarms to matter here, but confirm it doesn't miss a push if the newtab page closes mid-debounce.

## Reminders / focus timer

- `setInterval(_checkDueReminders, 6e4)` at `app.js:758` — runs once per minute **only while a new-tab page is open**. Because there's no background service worker, reminders due while every new-tab tab is closed will not fire until one is reopened. This is a real behavioral gap worth flagging in the audit, not a service-worker-suspension bug (there's no service worker to suspend).

## XSS / sanitization

- `escH()` (`app.js:1029`) escapes `& < > "` — **does not escape `'`** (single quote). Low risk today since templates consistently use double-quoted attributes, but worth a lint rule or escaping single quotes too, defensively.
- `safeUrl()` (`app.js:1030`) allowlists `http:`/`https:` only (after assuming `https://` if no scheme) — blocks `javascript:` URIs. Good.
- `_mdRender()` (`app.js:3798`, notes markdown preview) escapes the raw text **before** applying markdown transforms — correctly prevents injection through note content. Verified by reading the implementation, not assumed.
- Spot-checked ~6 of the ~29 `innerHTML = ...map(...)` render sites (bookmarks, folder modal, notes list) — all route user-controlled strings (title, url) through `escH`/`safeUrl` before interpolation. Not all 29 sites were individually verified; flagged in the audit as needing a full sweep rather than claiming full coverage from a sample.

## Webapp (`webapp/`)

- Static HTML/CSS, no build step, no framework, no bundler.
- Pages: `index.html`, `about.html`, `privacy.html`, `terms.html`.
- Contains a Google Search Console verification file (`googleee397e5ec21b3ad7.html`) at the repo root of `webapp/` — fine, just noted for permissions/compliance review.

## Tests / CI

- **Zero automated tests of any kind.** No unit, integration, or e2e tests, no test runner installed.
- **No CI/CD pipeline.** Lint (`eslint`) and build (`esbuild`) are both manual, local-only `npm run` scripts.
- The brief's Phase 6/7 gates (90% unit coverage, Playwright E2E, axe-core, Lighthouse CI) all start from a greenfield testing setup, not an extension of existing infra.

## Baselines

Not measured in this pass — doing so (new-tab TTI/FP, package size, Lighthouse) requires actually building and loading the extension/site, which wasn't done here (read-only discovery). These are real Phase 0 work still outstanding before any gate can be evaluated against them.
