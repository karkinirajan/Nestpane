# Nestpane extension

A Manifest V3 extension that replaces the new tab page with a local-first productivity dashboard, for Chrome and Chromium-based browsers.

---

## What this is

Nestpane overrides `chrome_url_overrides.newtab` with a single-page dashboard built on browser extension APIs. There is no backend, no account and no analytics. Data leaves the device only if you turn on Drive backup or the optional AI features.

All state lives in `chrome.storage.local`. Google Drive backup is optional and scoped to `drive.appdata`, so backups go to a per-app folder that is hidden from the Drive UI and unreadable by other applications.

## Features

- **Quick Access.** An icon grid of favorite sites with three display modes. Tiles can be added, edited, pinned from bookmarks and removed (to Trash).
- **Bookmarks.** The browser's real bookmarks: search, folder filter, sorting, create, edit, move and delete.
- **Sidebar.** Groups of views and links. In edit mode you can add, rename, re-URL and delete groups and links, drag to reorder, and drag a link into another group. It folds into an icon rail below 900 px.
- **Notes.** Markdown with tags, pins, autosave, `[[wiki-links]]` that resolve to notes, tasks, bookmarks and journal dates, and a "Linked from" backlinks row.
- **Nestodo.** A To Do / In Progress / Done board with reminders, drag between columns, and optional AI task parsing. A To-Do widget mirrors it on the home page.
- **Reminders.** Standalone date and time reminders with desktop notifications. They fire only while a Nestpane page is open.
- **Focus timer.** 25, 15 and 5 minute sessions, short and long breaks, daily totals, "focus on this task", and Focus Mode, which blocks listed sites with `declarativeNetRequest` while the timer runs.
- **Habits, journal and mood.** Daily habits with streaks, a dated journal with a mood and word count.
- **Calendar.** A mini monthly calendar with one-time, daily, weekly and custom-interval events.
- **Tab sessions.** Save the tabs in a window, stash and clear them, open them all again, or switch the window to a saved session.
- **Reading queue, History and Downloads.** Pages to read later, searchable history with per-URL delete, and recent downloads.
- **Insights.** Top sites, activity, download stats and a 14 day site-activity trend.
- **Command palette.** `/` searches bookmarks, notes, tasks, history, open tabs, the reading queue, sessions and journal entries, and offers Ask AI.
- **Smart Organize and Ask AI.** Optional, with your own Anthropic key: bookmark open tabs into folders, answer questions, write a daily briefing.
- **Voice capture.** Speak a note or task using the Web Speech API.
- **Themes.** Obsidian, Paper, Nord, Mocha, Gruvbox and Solarized in a keyboard-accessible dropdown, plus an accent color.
- **Backup.** Optional Drive backup that pushes changes within 500 ms, with optional end-to-end encryption (12+ character passphrase, AES-GCM, PBKDF2 with 600,000 iterations).
- **Safety net.** A Trash for deleted items, seven rolling daily snapshots, and JSON export and import.
- **Toolbar popup.** Saves the current page to Quick Access, a bookmark folder, Nestodo, the reading queue or a note.

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Chrome Extension (Manifest V3) | Host, permissions, storage |
| UI | Vanilla HTML, CSS, JavaScript | No framework, no runtime dependencies |
| Auth | `chrome.identity.getAuthToken()`, falling back to `chrome.identity.launchWebAuthFlow()` | Google sign-in with no client secret. The fallback covers Brave, Vivaldi, Opera, Arc and others |
| Storage | `chrome.storage.local` | All user data |
| Backup | Google Drive REST API v3, `appdata` scope | Optional cloud backup |
| Encryption | WebCrypto (PBKDF2 and AES-GCM) | Optional encryption of backups |
| AI | Anthropic Messages API | Optional, needs a user-supplied key |
| Voice | Web Speech API | Voice capture, transcribed by the browser |
| Site blocking | `chrome.declarativeNetRequest` | Focus Mode |
| Fonts | Inter, Instrument Serif and JetBrains Mono via Google Fonts | Loaded with a preconnect and a non-blocking stylesheet |
| Icons | Inline SVG, plus site icons from Google's favicon service | Quick Access tiles |
| Build | Node.js (`build.js`) and esbuild | Validates sources and the manifest, minifies into `dist/` |

## Project structure

This repo has two independently deployed parts: this extension, and the static website and web version in [`webapp/`](../webapp/), served at `nestpane.kneeraazon.com`. The domain is custom because Google's OAuth verification rejects homepages on shared platform subdomains.

```
extension/
├── manifest.json      Manifest V3: name, version, permissions, OAuth client, icons
├── manifest.firefox.json  Delta merged onto the manifest for the Firefox build
├── newtab.html        New tab page markup
├── app.js             All application logic, including the OAuth client IDs
├── style.css          Design tokens, themes and components
├── fouc.js            Applies the theme and accent before first paint
├── popup.html/js      Toolbar popup
├── lib/               Small dependency-free modules, each unit tested
├── tests/             node --test suites for lib/ and the build scripts; tests/mutation/ holds the deliberate-bug checks
├── scripts/           Zip writer, Firefox manifest merge, web dashboard generator
├── build.js           Validates, copies and minifies into dist/
├── privacy.html       Privacy policy (bundled copy, also hosted from webapp/)
├── terms.html         Terms of service (bundled copy, also hosted from webapp/)
├── graphics-assets/   Chrome Web Store listing images
└── icons/             favicon.svg (source), favicon.png (128), icon-48.png, icon-16.png
```

`dist/`, `dist-firefox/` and `nestpane-v<version>-chrome.zip` are build output and git-ignored.

## Prerequisites

- Chrome, or another Chromium browser
- Node.js 22 or newer (26 is pinned in `.nvmrc`), for the build, the tests and ESLint. Local development loads the sources directly and needs none of them
- `rsvg-convert` (librsvg) or ImageMagick `convert`, only to regenerate the PNG icons from `icons/favicon.svg`

## Local development

1. Run `npm ci` in this folder.
2. Open `chrome://extensions`, turn on Developer mode, choose Load unpacked and select this `extension/` folder.
3. Open a new tab. After editing a file, reload the extension on `chrome://extensions` and open a new tab again.

| Command | What it does |
|---|---|
| `npm test` | Unit tests (`node --test`) |
| `npm run test:mutation` | Mutation checks: each deliberate bug in `lib/` must make a test fail. See [docs/01-testing-and-quality.md](../docs/01-testing-and-quality.md) |
| `npm run lint` | ESLint, must exit 0 with no warnings |
| `npm run build` | Validates and minifies into `dist/` |
| `npm run build:firefox` | Firefox variant into `dist-firefox/` |
| `npm run build:dashboard` | Regenerates `../webapp/dashboard/` from this source |
| `npm run zip` | Builds and writes `nestpane-v<version>-chrome.zip` |

The same app also runs as a plain web page. Serve this folder over HTTP (`python3 -m http.server`) and open `newtab.html`. `chrome.*` APIs are missing there, so storage falls back to `localStorage` and history and downloads show empty states. That is also how the web version works, and it is the easiest way to test the real UI with a headless browser.

To regenerate the PNG icons after editing `icons/favicon.svg`:

```bash
cd icons
rsvg-convert -w 128 -h 128 favicon.svg -o favicon.png
rsvg-convert -w 48  -h 48  favicon.svg -o icon-48.png
rsvg-convert -w 16  -h 16  favicon.svg -o icon-16.png
```

## Configuration

There is no server and there are no environment variables. Configuration lives in source.

| Config | File | Key | Notes |
|---|---|---|---|
| OAuth client (Chrome) | `manifest.json` | `oauth2.client_id` | Public identifier. Chrome Extension type, which has no client secret |
| OAuth client (other browsers and the web version) | `app.js` | `WEB_AUTH_CLIENT_ID` | Public identifier. Web application type, used with the implicit grant |
| OAuth scopes | `manifest.json` | `oauth2.scopes` | `userinfo.email`, `userinfo.profile`, `drive.appdata` |
| Extension ID | `app.js`, `build.js` | `EXPECTED_EXTENSION_ID`, `PUBLISHED_EXTENSION_ID` | The Chrome Web Store item ID. A mismatch only logs a warning in the app, and fails the build if `manifest.json` has a `key` that does not match |
| Anthropic API key | Settings, AI Assistant | `_aiApiKey` in storage | Entered by each user, stored only on their device, never synced |

## Google OAuth setup

### How sign-in works

`getAuthToken(interactive)` picks one of three paths.

1. **Chrome (native).** `chrome.identity.getAuthToken` shows Chrome's account picker. Chrome caches and refreshes the token itself. This works only in Google Chrome. Brave is detected up front with `navigator.brave.isBrave()` and skips straight to the fallback.
2. **Other Chromium browsers (fallback).** `chrome.identity.launchWebAuthFlow` opens Google's consent page and reads the token from the redirect to `https://<extension-id>.chromiumapp.org/`. It uses the implicit grant (`response_type=token`) against the second, Web application client, so no client secret or backend is involved.
3. **The web version.** A full-page redirect through `webapp/dashboard/oauth-callback.html`, using the same implicit grant.

Implicit-grant tokens have no refresh token and last about an hour. They are stored in `_waToken` and `_waTokenExp`, so a new tab reuses them.

**Staying signed in.** The account (`googleUser`) is removed only by Sign out or Clear All Data. Saves never write an empty value over it, other tabs cannot clear it, and a keep-alive (`_armSessionKeepAlive`) renews the token shortly after it expires, on tab focus and when the browser comes back online, backing off from 1 to 15 minutes on failure. On the web, the renewal is a hidden iframe with `prompt=none`. If Google refuses, the account stays and the sidebar shows Connect Drive until a silent or manual reconnect succeeds. A true "never reconnect" would need a code flow with a client secret on a server, which this project deliberately does not have.

Sign out revokes the grant at `oauth2.googleapis.com/revoke` and clears the cached tokens.

### Setting up your own OAuth clients

The client IDs in this repo belong to the current Google Cloud project. On a fork, or if the project or the extension ID changes, create your own. You need both clients.

1. Open [Google Cloud Console](https://console.cloud.google.com/), then APIs & Services, then Credentials.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen (External). Add the `drive.appdata`, `userinfo.email` and `userinfo.profile` scopes, and add yourself as a test user.
4. **Native client.** Create an OAuth client ID of type Chrome Extension. Put your extension ID in Application ID (shown on `chrome://extensions`). Copy the client ID into `manifest.json` as `oauth2.client_id`.
5. **Fallback client.** Create a second client ID of type Web application. Add these Authorized redirect URIs:
   - `https://<your-extension-id>.chromiumapp.org/` for other Chromium browsers (trailing slash included)
   - `https://nestpane.kneeraazon.com/dashboard/oauth-callback.html` for the web version
   Copy the client ID into `WEB_AUTH_CLIENT_ID` in `app.js`.
6. Both client IDs are public identifiers. Neither type used here has a client secret, so both are safe to commit.

The extension ID changes if you load it from a different folder. The published Chrome Web Store ID is permanent.

## Build and package

```bash
npm run build
```

`build.js` validates that every file in `REQUIRED_FILES` exists, that the manifest declares the required permissions, and that a `key` field (if present) produces the published extension ID. It then copies static files into `dist/` and minifies the HTML, JavaScript (esbuild, target `chrome110`) and CSS.

```bash
npm run zip
```

This builds, then `scripts/zip-dist.js` packs the contents of `dist/` into `nestpane-v<version>-chrome.zip` using no external tools. The output is reproducible: entries are sorted and timestamps are fixed, so the same inputs give the same bytes.

`npm run build:firefox` merges `manifest.firefox.json` onto the manifest (add-on ID and minimum Firefox version) and writes `dist-firefox/`. It builds, but it has not been published.

## Deployment (Chrome Web Store)

1. Run `npm run zip` and fix anything it reports.
2. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). For a new item choose New Item and upload the zip. For an update, upload it on the Package tab.
3. Fill in the listing: category Productivity, at least one 1280×800 or 640×400 screenshot, and the privacy policy URL (`https://nestpane.kneeraazon.com/privacy.html`).
4. Complete Privacy practices by checking the `permissions`, `optional_permissions` and `host_permissions` arrays against the table below.
5. Submit for review.

To release an update, set the same new `version` in `manifest.json` and `package.json` (the zip name comes from `package.json`, the published version from `manifest.json`), and make sure it is higher than the version live on the store.

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Tab sessions, Smart Organize, open-tab search |
| `bookmarks` | Read and write the browser's bookmarks |
| `history` | History view, Insights, search |
| `downloads` | Downloads view |
| `storage` | All user data, in `chrome.storage.local` |
| `topSites` | Most visited sites in Insights |
| `declarativeNetRequest` | Focus Mode site blocking while a session runs |
| `search` | `chrome.search.query`, to search with the user's default search engine |
| `identity`, `identity.email` (optional) | Google sign-in for Drive backup, requested when the user signs in |
| `notifications` (optional) | Reminder, habit and focus notifications |

| Host | Why |
|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` | Web fonts |
| `www.googleapis.com` | Google profile and the Drive API, including uploads |
| `oauth2.googleapis.com` | Token revocation on sign-out |
| `api.anthropic.com` | Optional AI features, only with a key the user adds |

Quick Access tile icons are loaded as images from Google's favicon service (`t3.gstatic.com`). That needs no host permission, but the request includes the site's domain, and it is listed in the privacy policy.

## Security notes

- **No client secret anywhere.** Neither OAuth client type used here has one.
- **Tokens.** Native tokens are cached by Chrome. The fallback and web paths store an access token and its expiry in `chrome.storage.local` (or `localStorage` on the web). Tokens are excluded from backups.
- **Escaping.** User-generated content is escaped with `escH()` before it reaches `innerHTML`. There is no `eval` and no `document.write`.
- **URLs.** User-supplied URLs go through `safeUrl()`, which accepts only `http` and `https`.
- **CSP.** Extension pages use Manifest V3's default policy, which disallows `eval` and remote scripts.
- **AI key.** Stored only in `chrome.storage.local`, excluded from Drive backups, and sent only to `https://api.anthropic.com`.
- **Encryption.** With Encrypt Cloud Backups on (passphrase of 12 or more characters), backups are encrypted in the browser with AES-GCM using a PBKDF2 key (600,000 iterations). The passphrase is stored only in `chrome.storage.local` and never uploaded. Without it, encrypted backups cannot be recovered.
- **Privacy policy.** [`privacy.html`](privacy.html) is the full disclosure, required for the Web Store and for OAuth verification.

## Troubleshooting

| Problem | Solution |
|---|---|
| Sidebar shows Connect Drive with a name | The silent token renewal was refused. Click it to reconnect. Data and account details are untouched |
| Sign in does nothing, or shows a permission toast | The `identity` optional permission was not granted. Try again and approve the prompt |
| Sign-in fails immediately every time | The Chrome Extension OAuth client is bound to one extension ID. Compare `EXPECTED_EXTENSION_ID` with `chrome://extensions` |
| Sign-in shows `access_denied` | Add your Google account as a test user on the OAuth consent screen |
| Sign-in fails on Brave, Vivaldi, Opera or Arc | Check that `WEB_AUTH_CLIENT_ID` is your own Web application client and that its redirect URI is exactly `https://<extension-id>.chromiumapp.org/` |
| Data not syncing | Confirm you are signed in and that the Drive API is enabled in your Google Cloud project |
| Quick Access icons are blank | Offline, or the favicon request is blocked |
| Changes not reflected after an edit | Reload the extension on `chrome://extensions`, then open a new tab |
| Build validation fails | Run `npm run build` and look for the file marked MISSING |

## Maintenance checklist

- [ ] Bump `version` in `manifest.json` and `package.json` before each release
- [ ] Regenerate the PNG icons after any change to `icons/favicon.svg`
- [ ] Run `npm test`, `npm run lint`, `npm run test:mutation` and `npm run build`, and confirm no errors
- [ ] Run `npm run build:dashboard` if shared files changed
- [ ] Test sign-in, Drive sync and sign-out after any auth change
- [ ] Review `manifest.json` permissions and remove any that are unused
- [ ] Test on Chrome stable and Edge before submitting

## License

[GNU General Public License v3.0](../LICENSE). The Nestpane name and logo are not covered by the license.
