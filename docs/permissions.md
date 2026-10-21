# Permissions — 2.1.0

No permission or OAuth scope changes versus the published 2.0.1. This file documents what's
already in `manifest.json`, per the brief's "no new permission without justification" rule.

## `permissions`

| Permission | Why |
|---|---|
| `tabs` | Read tab URLs/titles for the tab-session widget and to open links from bookmarks/history/search in the right tab. |
| `bookmarks` | The Bookmarks view reads/writes the browser's native bookmark tree (`chrome.bookmarks.*`, `app.js:2501-2875`). |
| `history` | The History view (`app.js:3516-3567`) and quick-access/top-sites widgets. |
| `downloads` | The Downloads view (`app.js:3609-3637`). |
| `storage` | All local state and settings (`chrome.storage.local`); `chrome.storage.sync` used only as a one-time legacy-data fallback on first load after an old version (`app.js:892-898`). |
| `topSites` | The "Top Visited Sites" insights card (`app.js:5357-5380`). Chromium-only API — already feature-detected; shows "Requires Chrome extension." on browsers without it. |
| `declarativeNetRequest` | Focus Mode's site-blocking rules (`app.js:4895-4920`). |
| `search` | `chrome.search.query` for the search-bar "search the web" action (`app.js:5782-5790`); falls back to opening a Google search URL when unavailable. |

## `optional_permissions`

| Permission | Why requested lazily rather than upfront |
|---|---|
| `identity` | Only needed if the user turns on Google sign-in / Drive sync. |
| `identity.email` | Same — only to read the signed-in email for the account UI. |
| `notifications` | Only needed if the user enables reminder/habit notifications. |

## `host_permissions`

| Host | Why |
|---|---|
| `https://fonts.googleapis.com/*`, `https://fonts.gstatic.com/*` | Self-hosted-adjacent font loading (see `discovery.md` i18n/font note — not yet verified whether fonts are actually bundled or fetched live; flagged for the next audit pass). |
| `https://www.googleapis.com/*`, `.../upload/drive/v3/*` | Google Drive sync (`app.js:1709-1930`). |
| `https://oauth2.googleapis.com/*` | Token exchange for the Drive sign-in flow. |
| `https://api.anthropic.com/*` | Optional, user-enabled BYOK AI features (`app.js:1485-1560`). The user's own Anthropic API key, entered in Settings, is sent directly from the browser to Anthropic — Nestpane's own servers never see it. Disclosed in `webapp/privacy.html` §6. |

## `oauth2` scopes

Unchanged from 2.0.1 — `userinfo.email`, `userinfo.profile`, `drive.appdata`. **Not touched in
2.1.0**, per the standing constraint that any scope change re-triggers Google's branding
verification review.

## Manifest deltas (Firefox)

`manifest.firefox.json` (merged at build time, see `browsers/firefox.md`) adds only
`browser_specific_settings.gecko.id` / `strict_min_version` — no permission differs between
targets.
