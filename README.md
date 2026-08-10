# llmaotab

A Manifest V3 extension that replaces the new tab page with a local-first productivity dashboard, for Chrome and Chromium-based browsers.

---

## What this is and why it was built

llmaotab overrides `chrome_url_overrides.newtab` with a single-page dashboard built entirely on browser extension APIs — no backend, no account, no subscription, and no data leaving the device unless Drive sync is explicitly enabled.

The problem it solves is fragmentation: bookmarks live in the browser, tasks live in a separate app, notes live somewhere else. llmaotab consolidates them onto the surface you already open dozens of times a day, so the context switch disappears.

It is single-user and offline-first. All state lives in `chrome.storage.local`. Google Drive sync is optional and scoped to `drive.appdata` alone — backups are written to a per-extension folder that is hidden from the Drive UI and unreadable by any other application.

---

## Features

- **Workspaces** — separate bookmark, note, and task environments (Home, AI, Dev, or custom)
- **Shareable Workspaces** — export any workspace (bookmarks, notes, tasks) as a JSON file and import it elsewhere
- **Quick Access** — icon grid for frequently visited sites, drag-to-reorder
- **Bookmark manager** — import Chrome bookmarks, create folders, search, sort, context-menu actions
- **Smart Organize** — AI sorts your open tabs into existing workspaces with one click
- **Notes** — per-workspace notes with tags, pin, full-text search, and a rich editor
- **Tasks** — daily task list with completion tracking
- **Voice Quick-Capture** — speak a note, task, or journal entry using the Web Speech API
- **Focus Mode** — Pomodoro-style 5/15/25-minute timer with visual ring, plus optional distracting-site blocking
- **Calendar** — mini monthly calendar with one-time, daily, weekly, and custom-interval events
- **Daily Journal** — date-stamped entries with mood tagging and word count
- **Habit Tracker** — daily habit streaks with completion history
- **Mood Tracker** — daily emoji log with optional notes
- **Kanban Board** — three-column board (To Do / In Progress / Done) per workspace
- **Reading Queue** — save URLs to read later, mark as done
- **Tab Sessions** — save and restore groups of open tabs
- **Browser History viewer** — searchable history list with per-URL delete
- **Downloads viewer** — recent downloads with open-in-Finder support
- **Analytics / Insights** — top visited sites, browsing activity, download stats, and a 14-day site-activity trend chart
- **Weather widget** — current conditions + 3-day forecast via wttr.in (auto-detect or manual city)
- **AI Daily Briefing** — short LLM-generated morning summary covering weather and your top pending tasks
- **Motivational quotes** — shuffle from API or write your own
- **Wallpaper** — random photo (via Picsum), solid color, or upload your own image
- **Google Drive sync** — backs up all data to your private Drive appdata folder
- **End-to-end encrypted sync** — optional passphrase-based AES-GCM encryption layer on top of Drive backups
- **Theme marketplace** — Gruvbox-inspired dark/light modes plus Nord, Dracula, Catppuccin, and Solarized presets, with a custom accent color picker
- **Sidebar** — collapsible, with per-group custom link lists
- **Unified command palette / omni-search** — `/` searches bookmarks, notes, tasks, browser history, open tabs, the reading queue, saved sessions, and journal entries, plus an "Ask AI" action for direct LLM answers
- **Extension popup** — one-click bookmark save from any page via the toolbar button

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Chrome Extension (Manifest V3) | Extension host, permissions, storage |
| UI | Vanilla HTML, CSS, JavaScript (ES2022) | No framework, no build transpiler |
| Auth | Google OAuth 2.0 PKCE via `chrome.identity.launchWebAuthFlow` | Sign in with a Web application OAuth client |
| Storage | `chrome.storage.local` | All user data and tokens, local only |
| Sync | Google Drive REST API v3 (`appdata` scope) | Optional cloud backup |
| End-to-end encryption | WebCrypto (`crypto.subtle`, PBKDF2 + AES-GCM) | Optional passphrase-based encryption of cloud backups |
| AI | Anthropic Messages API (`api.anthropic.com`) | Command bar "Ask AI", daily briefing, smart organize — requires a user-supplied API key |
| Voice | Web Speech API (`SpeechRecognition`) | Voice quick-capture, transcribed locally by the browser |
| Site blocking | `chrome.declarativeNetRequest` | Focus mode — blocks chosen sites while a focus session is running |
| Weather | wttr.in JSON API | No API key required |
| Quotes | motivational-spark-api.vercel.app | No API key required |
| Fonts | Inter + Playfair Display via Google Fonts | Loaded via `<link>` with preconnect |
| Icons | Inline SVG | No icon library dependency |
| Build | Node.js script (`build.js`) + esbuild | Validates sources and manifest, copies static files to `dist/`, minifies JS/CSS |

---

## Project Structure

```
llmaotab/
├── manifest.json     Manifest V3 — name, version, permissions, host permissions, icons
├── newtab.html       New tab page — full dashboard markup (~1800 lines)
├── app.js            All application logic, including the OAuth client ID (~10800 lines)
├── style.css         Design system and all component styles (~2150 lines)
├── fouc.js           Runs before CSS loads — applies theme and accent color to avoid a flash
├── popup.html        Extension popup — save current page as a bookmark to a workspace
├── popup.js          Popup logic
├── build.js          Validates sources, copies static files, minifies JS/CSS via esbuild
├── icons/            Brand & extension icons
│   ├── favicon.svg   Source brand icon (32×32 SVG)
│   ├── favicon.png   128×128 extension icon (generated from SVG)
│   ├── icon-16.png   16×16 toolbar icon (generated from SVG)
│   └── icon-48.png   48×48 extension management icon (generated from SVG)
├── docs/             Additional setup guides (e.g. OAUTH_SETUP.md)
└── dist/             Production build output — ZIP this folder for Chrome Web Store
```

---

## Prerequisites

- Chrome, Chromium, Edge, Brave, or Arc (any Chromium-based browser)
- Node.js ≥ 18 plus `npm install` — needed only to run `build.js` and `eslint`; local development loads the unpacked sources directly and needs neither
- `rsvg-convert` (librsvg) or ImageMagick `convert` — only needed to regenerate PNG icons from `icons/favicon.svg`

---

## Local Development Setup

No build step is required for local development. Edit source files and reload the extension to see changes.

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd llmaotab
```

**2. Load as an unpacked extension**

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the project root folder (`llmaotab/`)
4. Open a new tab — the dashboard loads immediately

**3. Make changes**

Edit `app.js`, `style.css`, `newtab.html`, or `popup.js` directly. After saving, go to `chrome://extensions` and click the reload icon (↻) under llmaotab, then open a new tab.

**4. (Optional) Regenerate PNG icons after editing `icons/favicon.svg`**

```bash
# Using rsvg-convert (recommended):
cd icons
rsvg-convert -w 128 -h 128 favicon.svg -o favicon.png
rsvg-convert -w 48  -h 48  favicon.svg -o icon-48.png
rsvg-convert -w 16  -h 16  favicon.svg -o icon-16.png

# Or using ImageMagick:
convert -background none -resize 128x128 favicon.svg favicon.png
convert -background none -resize 48x48  favicon.svg icon-48.png
convert -background none -resize 16x16  favicon.svg icon-16.png
cd ..
```

---

## Environment Variables

This project has no server and no environment variables. All configuration is embedded in source files.

| Config | File | Key | Notes |
|---|---|---|---|
| Google OAuth Client ID | `app.js` | `GOOGLE_CLIENT_ID` (line ~8) | Public identifier, safe to commit. There is no `oauth2` block in `manifest.json` — auth runs through `chrome.identity.launchWebAuthFlow`, so the client ID lives in source only |
| OAuth Scopes | `app.js` | `OAUTH_SCOPES` (line ~2085) | `userinfo.email`, `userinfo.profile`, `drive.appdata` |
| Expected extension ID | `app.js` / `build.js` | `EXPECTED_EXTENSION_ID` / `PUBLISHED_EXTENSION_ID` | The CWS-assigned item ID; a mismatch only logs a warning, it never blocks sign-in |
| Weather endpoint | `app.js` | wttr.in URL | No key required |
| Quotes endpoint | `app.js` | motivational-spark-api.vercel.app | No key required |
| Anthropic API key | Settings → AI Assistant (`aiApiKey`) | User-supplied, optional | Entered by each user at runtime, stored only in `chrome.storage.local` on their device — never embedded in source or synced |

> The Google OAuth Client ID is a **public** identifier. It is not a secret. Chrome extensions must embed it in source files. Never commit a `client_secret` — the PKCE flow used here does not require one.
>
> The Anthropic API key is **not** a build-time secret — it's entered per-user in Settings to power "Ask AI", the daily briefing, and Smart Organize. Get a key at [console.anthropic.com](https://console.anthropic.com/settings/keys). AI features are entirely optional and disabled by default.

---

## Google OAuth Setup

See the step-by-step external configuration guide in [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md), or follow the inline instructions in the **Authentication Setup** section below.

### How the auth flow works

1. User clicks **Sign in with Google** in the sidebar.
2. `chrome.identity.launchWebAuthFlow` opens Google's OAuth consent screen.
3. PKCE (Proof Key for Code Exchange) exchanges the auth code for tokens — **no client secret required**.
4. Access token is stored in `chrome.storage.local` with an expiry timestamp.
5. Refresh token is stored in `chrome.storage.local` and used for silent re-authentication.
6. On token expiry, a silent refresh is attempted. If refresh fails, the user sees "Session expired. Sign in again."

### Setting up your own OAuth Client

If you fork this project, you must create your own Google OAuth client. The client ID in this repo belongs to the original author's GCP project.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Enable the **Google Drive API**.
3. Configure the **OAuth consent screen** (External, add `drive.appdata`, `userinfo.email`, `userinfo.profile` scopes, add yourself as a test user).
4. Create an **OAuth 2.0 Client ID** → Application type: **Chrome Extension**.
5. Add your extension ID to the **Application ID** field. Your extension ID appears on `chrome://extensions`.
6. Under **Authorised redirect URIs**, add (trailing slash required):

   ```
   https://<YOUR_EXTENSION_ID>.chromiumapp.org/
   ```

7. Copy the Client ID into `app.js` → `GOOGLE_CLIENT_ID` constant (line ~8). This is the only place it is declared; `manifest.json` has no `oauth2` block.

### Finding your Extension ID

Load the extension unpacked (see setup above). Your ID appears on `chrome://extensions` beneath the extension name — a 32-character lowercase string. The ID changes if you load from a different folder; the published Chrome Web Store ID is permanent.

---

## Production Build

```bash
node build.js
```

This script:

1. Validates all required source files exist in the project root.
2. Validates that required manifest permissions are declared.
3. Warns if `manifest.json` no longer matches the published CWS extension ID.
4. Copies static files (manifest, HTML, icons) to `dist/`.
5. Minifies `app.js`, `fouc.js`, `popup.js`, and `style.css` into `dist/` with esbuild.

**Package for Chrome Web Store:**

```bash
npm run zip
```

This builds and writes `llmaotab-v<version>-chrome.zip` to the project root, reading `<version>` from `package.json` so it always matches the current release. The ZIP contains the **contents** of `dist/` at its root — not the `dist/` folder itself.

---

## Deployment (Chrome Web Store)

**Step 1 — Ensure icons are generated and up to date**

```bash
cd icons
rsvg-convert -w 128 -h 128 favicon.svg -o favicon.png
rsvg-convert -w 48  -h 48  favicon.svg -o icon-48.png
rsvg-convert -w 16  -h 16  favicon.svg -o icon-16.png
cd ..
```

**Step 2 — Build and package**

```bash
npm run zip
```

Verify no errors are reported. This produces `llmaotab-v<version>-chrome.zip` in the project root.

**Step 3 — Submit**

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **New Item** → upload `llmaotab-v<version>-chrome.zip`.
3. Fill in the listing:
   - **Category**: Productivity
   - **Screenshots**: 1280×800 or 640×400 px (at least one required)
   - **Privacy policy**: required — host [`privacy.html`](privacy.html) (e.g. via GitHub Pages) and link it here
4. Complete the **Privacy practices** tab using [docs/CWS_SUBMISSION.md](docs/CWS_SUBMISSION.md) — it has copy-paste permission justifications and data-usage answers for every permission this extension requests.
5. Submit for review.

**Step 4 — Update an existing listing**

Bump `version` in both `manifest.json` and `package.json` (they must match — the ZIP filename comes from `package.json`, the published version from `manifest.json`), run `npm run zip`, and upload the new ZIP via the **Package** tab in the CWS dashboard.

---

## Required Permissions

| Permission | Why |
|---|---|
| `tabs` | Tab Sessions, Smart Organize, and Omni-Search (open-tabs lookup) |
| `bookmarks` | Read and write Chrome bookmarks |
| `history` | History viewer, Analytics, Omni-Search |
| `downloads` | Downloads viewer |
| `storage` | Persist all user data (local storage) |
| `topSites` | Analytics view — Top Visited Sites card |
| `identity` | Google OAuth sign-in (`launchWebAuthFlow`) |
| `identity.email` | Read signed-in Chrome account email for the sync card |
| `geolocation` | Auto-detect city for weather widget |
| `declarativeNetRequest` | Focus Mode — blocks chosen sites while a focus session is active |
| `notifications` | Focus-session-complete and habit-reminder desktop notifications |
| `search` | Runs a plain search query through the user's own default search engine via `chrome.search.query` |

| Host | Why |
|---|---|
| `wttr.in` | Weather data |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Google Fonts (Inter, Playfair Display) |
| `www.googleapis.com` | Google user profile API + Drive sync |
| `oauth2.googleapis.com` | Token refresh and revocation |
| `motivational-spark-api.vercel.app` | Daily motivational quotes |
| `ipwho.is` | IP-based city detection for weather |
| `nominatim.openstreetmap.org` | Geocoding city names to coordinates |
| `picsum.photos` | Wallpaper photos |
| `api.anthropic.com` | AI command bar, daily briefing, and smart organize (only used if you add an Anthropic API key in Settings) |

---

## Security Notes

- **Credentials in source.** The OAuth `client_secret` for a Desktop/Web application client is embedded in `app.js`. Per Google's policy, this is acceptable for installed apps — the secret cannot be kept truly private in a client-side extension. Treat it as a low-value credential and rotate it if the extension is compromised.
- **Tokens never leave the device** except to refresh against Google's token endpoint. They are stored in `chrome.storage.local` only — explicitly excluded from `chrome.storage.sync`.
- **All user-generated content is HTML-escaped** via `escH()` before DOM insertion. No `eval`, no `document.write`, no raw `innerHTML` with user input.
- **URL sanitization.** All user-supplied URLs pass through `safeUrl()` which validates the scheme (http/https only), blocking `javascript:`, `data:`, and other dangerous protocols.
- **MV3 CSP.** Chrome Extension pages follow Manifest V3's default Content Security Policy which disallows `eval` and external scripts.
- **AI API key.** If you enable AI features, your Anthropic API key is stored only in `chrome.storage.local` on your device, excluded from both Drive sync and the E2E-encrypted payload, and sent only to `https://api.anthropic.com` with each AI request.
- **End-to-end encryption.** When enabled, Drive backups are encrypted client-side with AES-GCM using a key derived from your passphrase via PBKDF2. The passphrase itself is never stored or transmitted — if you lose it, encrypted backups cannot be recovered.
- **Privacy policy.** See [`privacy.html`](privacy.html) for the full data-handling disclosure (required for Chrome Web Store and OAuth consent screen verification — see [docs/CWS_SUBMISSION.md](docs/CWS_SUBMISSION.md)).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Extension icon is blank or broken | Regenerate `icons/favicon.png`, `icons/icon-16.png`, `icons/icon-48.png` from `icons/favicon.svg` and reload the extension |
| "Sign in" button does nothing | Confirm your OAuth client's redirect URI includes `https://<extension-id>.chromiumapp.org/` (trailing slash required) |
| Sign-in shows "access_denied" | Add your Google account as a Test User on the OAuth consent screen in Google Cloud Console |
| "Session expired. Sign in again." | Token refresh failed. Click Sign in again to re-authenticate interactively |
| Weather shows "--°C" | Check that `wttr.in` is reachable; verify `host_permissions` in `manifest.json` |
| Data not syncing | Confirm you are signed in; check that the Drive API is enabled in your Google Cloud project |
| Popup shows "No workspaces found" | Open a new tab first to initialise extension data, then try the popup |
| Changes not reflected after edit | Reload the extension on `chrome://extensions` → click the reload icon (↻) |
| Build validation fails | Run `node build.js` from the project root and check which file is listed as MISSING |

---

## Maintenance Checklist

- [ ] Bump `version` in `manifest.json` before each release
- [ ] Regenerate PNG icons after any change to `icons/favicon.svg`
- [ ] Run `node build.js` and confirm no errors before packaging
- [ ] Test sign-in, Drive sync, and sign-out after any auth-related changes
- [ ] Verify the extension ID still matches the OAuth redirect URI after any reinstall from a new folder
- [ ] Review `manifest.json` permissions — remove any unused permissions before CWS submission
- [ ] Test on Chrome stable and Edge before submitting to the Chrome Web Store
