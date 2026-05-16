# novatab

A productivity-focused new tab page for Chrome and Chromium-based browsers.

---

## What this is and why it was built

novatab replaces Chrome's default new tab with a fully-featured dashboard built on the same browser APIs that extensions already have access to — no server, no subscription, no data leaving your device unless you opt into Drive sync.

The problem it solves is fragmentation: bookmarks live in the browser, tasks live in a separate app, notes live somewhere else. novatab puts all of it in one place that opens every time you open a tab, so the friction of switching contexts disappears.

It is a single-user, offline-first extension. All data lives in `chrome.storage.local`. Google Drive sync is optional and uses only the private `appdata` scope — your data goes into a hidden folder that only this extension can read.

---

## Features

- **Workspaces** — separate bookmark, note, and task environments (Home, AI, Dev, or custom)
- **Quick Access** — icon grid for frequently visited sites, drag-to-reorder
- **Bookmark manager** — import Chrome bookmarks, create folders, search, sort, context-menu actions
- **Notes** — per-workspace notes with tags, pin, full-text search, and a rich editor
- **Tasks** — daily task list with completion tracking
- **Focus Timer** — Pomodoro-style 5/15/25-minute countdown with visual ring
- **Stopwatch** — with lap tracking
- **World Clocks** — add multiple timezones side by side
- **Countdown Timers** — named countdowns to future dates
- **Calendar** — mini monthly calendar with one-time, daily, weekly, and custom-interval events
- **Daily Journal** — date-stamped entries with mood tagging and word count
- **Habit Tracker** — daily habit streaks with completion history
- **Mood Tracker** — daily emoji log with optional notes
- **Kanban Board** — three-column board (To Do / In Progress / Done) per workspace
- **Reading Queue** — save URLs to read later, mark as done
- **Tab Sessions** — save and restore groups of open tabs
- **Browser History viewer** — searchable history list with per-URL delete
- **Downloads viewer** — recent downloads with open-in-Finder support
- **Analytics / Insights** — top visited sites, browsing activity, download stats
- **Weather widget** — current conditions + 3-day forecast via wttr.in (auto-detect or manual city)
- **Motivational quotes** — shuffle from API or write your own
- **Wallpaper** — Unsplash random photo, solid color, or upload your own image
- **Google Drive sync** — backs up all data to your private Drive appdata folder
- **Themes** — Gruvbox-inspired dark and light modes, custom accent color picker
- **Sidebar** — collapsible, with per-group custom link lists
- **Command palette** — `/` opens a search over all bookmarks and notes
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
| Weather | wttr.in JSON API | No API key required |
| Quotes | motivational-spark-api.vercel.app | No API key required |
| Fonts | Inter + Playfair Display via Google Fonts | Loaded via `<link>` with preconnect |
| Icons | Inline SVG | No icon library dependency |
| Build | Custom Node.js copy + validation script (`build.js`) | Validates files, copies to `dist/` |

---

## Project Structure

```
novatab/
├── manifest.json     Chrome Extension Manifest V3 — permissions, icons, OAuth client ID
├── newtab.html       New tab page — full dashboard UI (~1600 lines)
├── app.js            All application logic (~8200 lines)
├── style.css         Design system and all component styles (~1600 lines)
├── fouc.js           Inline script — applies theme and accent color before CSS loads
├── popup.html        Extension popup — save current page as a bookmark to a workspace
├── popup.js          Popup logic
├── favicon.svg       Source brand icon (32×32 SVG)
├── favicon.png       128×128 extension icon (generated from SVG)
├── icon-16.png       16×16 toolbar icon (generated from SVG)
├── icon-48.png       48×48 extension management icon (generated from SVG)
├── build.js          Validation and dist copy script (Node.js, no dependencies)
└── dist/             Production build output — ZIP this folder for Chrome Web Store
```

---

## Prerequisites

- Chrome, Chromium, Edge, Brave, or Arc (any Chromium-based browser)
- Node.js ≥ 18 — only needed to run `build.js`; not needed for local development
- `rsvg-convert` (librsvg) or ImageMagick `convert` — only needed to regenerate PNG icons from `favicon.svg`

---

## Local Development Setup

No build step is required for local development. Edit source files and reload the extension to see changes.

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd novatab
```

**2. Load as an unpacked extension**

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the project root folder (`novatab/`)
4. Open a new tab — the dashboard loads immediately

**3. Make changes**

Edit `app.js`, `style.css`, `newtab.html`, or `popup.js` directly. After saving, go to `chrome://extensions` and click the reload icon (↻) under novatab, then open a new tab.

**4. (Optional) Regenerate PNG icons after editing `favicon.svg`**

```bash
# Using rsvg-convert (recommended):
rsvg-convert -w 128 -h 128 favicon.svg -o favicon.png
rsvg-convert -w 48  -h 48  favicon.svg -o icon-48.png
rsvg-convert -w 16  -h 16  favicon.svg -o icon-16.png

# Or using ImageMagick:
convert -background none -resize 128x128 favicon.svg favicon.png
convert -background none -resize 48x48  favicon.svg icon-48.png
convert -background none -resize 16x16  favicon.svg icon-16.png
```

---

## Environment Variables

This project has no server and no environment variables. All configuration is embedded in source files.

| Config | File | Key | Notes |
|---|---|---|---|
| Google OAuth Client ID | `manifest.json` | `oauth2.client_id` | Public identifier, safe to commit |
| Google OAuth Client ID | `app.js` | `GOOGLE_CLIENT_ID` (line ~8) | Must match `manifest.json` |
| OAuth Scopes | `manifest.json` | `oauth2.scopes` | `userinfo.email`, `userinfo.profile`, `drive.appdata` |
| Weather endpoint | `app.js` | wttr.in URL | No key required |
| Quotes endpoint | `app.js` | motivational-spark-api.vercel.app | No key required |

> The Google OAuth Client ID is a **public** identifier. It is not a secret. Chrome extensions must embed it in source files. Never commit a `client_secret` — the PKCE flow used here does not require one.

---

## Google OAuth Setup

See the step-by-step external configuration guide in [OAUTH_SETUP.md](OAUTH_SETUP.md), or follow the inline instructions in the **Authentication Setup** section below.

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

7. Copy the Client ID (not the secret) into:
   - `manifest.json` → `oauth2.client_id`
   - `app.js` → `GOOGLE_CLIENT_ID` constant (line ~8)

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
3. Copies production files to `dist/`.

**Package for Chrome Web Store:**

```bash
node build.js
cd dist && zip -r ../novatab-v1.1.0-chrome.zip . && cd ..
```

The ZIP must contain the **contents** of `dist/` at its root — not the `dist/` folder itself.

---

## Deployment (Chrome Web Store)

**Step 1 — Ensure icons are generated and up to date**

```bash
rsvg-convert -w 128 -h 128 favicon.svg -o favicon.png
rsvg-convert -w 48  -h 48  favicon.svg -o icon-48.png
rsvg-convert -w 16  -h 16  favicon.svg -o icon-16.png
```

**Step 2 — Build**

```bash
node build.js
```

Verify no errors are reported.

**Step 3 — Package**

```bash
cd dist && zip -r ../novatab-v1.1.0-chrome.zip . && cd ..
```

**Step 4 — Submit**

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **New Item** → upload `novatab-v1.1.0-chrome.zip`.
3. Fill in the listing:
   - **Category**: Productivity
   - **Screenshots**: 1280×800 or 640×400 px (at least one required)
   - **Privacy policy**: required — the extension collects Google account data for Drive sync
4. Submit for review.

**Step 5 — Update an existing listing**

Bump `version` in `manifest.json`, rebuild, re-package, and upload the new ZIP via the **Package** tab in the CWS dashboard.

---

## Required Permissions

| Permission | Why |
|---|---|
| `tabs` | Tab Sessions feature — save and restore groups of open tabs |
| `bookmarks` | Read and write Chrome bookmarks |
| `history` | History viewer, Analytics |
| `downloads` | Downloads viewer |
| `storage` | Persist all user data (local storage) |
| `topSites` | Analytics view — Top Visited Sites card |
| `identity` | Google OAuth sign-in (`launchWebAuthFlow`) |
| `identity.email` | Read signed-in Chrome account email for the sync card |
| `geolocation` | Auto-detect city for weather widget |

| Host | Why |
|---|---|
| `wttr.in` | Weather data |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Google Fonts (Inter, Playfair Display) |
| `www.googleapis.com` | Google user profile API + Drive sync |
| `oauth2.googleapis.com` | Token refresh and revocation |
| `motivational-spark-api.vercel.app` | Daily motivational quotes |
| `ipwho.is` | IP-based city detection for weather |
| `nominatim.openstreetmap.org` | Geocoding city names to coordinates |
| `source.unsplash.com` / `picsum.photos` | Wallpaper photos |

---

## Security Notes

- **Credentials in source.** The OAuth `client_secret` for a Desktop/Web application client is embedded in `app.js`. Per Google's policy, this is acceptable for installed apps — the secret cannot be kept truly private in a client-side extension. Treat it as a low-value credential and rotate it if the extension is compromised.
- **Tokens never leave the device** except to refresh against Google's token endpoint. They are stored in `chrome.storage.local` only — explicitly excluded from `chrome.storage.sync`.
- **All user-generated content is HTML-escaped** via `escH()` before DOM insertion. No `eval`, no `document.write`, no raw `innerHTML` with user input.
- **URL sanitization.** All user-supplied URLs pass through `safeUrl()` which validates the scheme (http/https only), blocking `javascript:`, `data:`, and other dangerous protocols.
- **MV3 CSP.** Chrome Extension pages follow Manifest V3's default Content Security Policy which disallows `eval` and external scripts.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Extension icon is blank or broken | Regenerate `favicon.png`, `icon-16.png`, `icon-48.png` from `favicon.svg` and reload the extension |
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
- [ ] Regenerate PNG icons after any change to `favicon.svg`
- [ ] Run `node build.js` and confirm no errors before packaging
- [ ] Test sign-in, Drive sync, and sign-out after any auth-related changes
- [ ] Verify the extension ID still matches the OAuth redirect URI after any reinstall from a new folder
- [ ] Review `manifest.json` permissions — remove any unused permissions before CWS submission
- [ ] Test on Chrome stable and Edge before submitting to the Chrome Web Store
