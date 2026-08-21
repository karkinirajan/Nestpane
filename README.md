# Nestpane

Nestpane replaces Chrome's blank new tab page with a local-first productivity dashboard — bookmarks, notes, a Kanban-style task board (Nestodo), a focus timer, habit tracking, and more — plus two entirely optional Google integrations (a read-only Calendar view and an encrypted Drive backup). No account is required, there is no backend server, and all data lives in the browser unless you explicitly turn on Drive sync.

This is a **monorepo** containing two independent, self-contained projects that ship separately:

| Folder | What it is | Deployed to |
|---|---|---|
| [`extension/`](extension/) | The Chrome MV3 extension itself — the actual product | Chrome Web Store |
| [`webapp/`](webapp/) | The public marketing site, privacy policy, and terms of service | Netlify — [nestpane.netlify.app](https://nestpane.netlify.app/) |

They share no build step, no dependencies, and no source code. The link between them is that the extension's OAuth consent screen and Chrome Web Store listing point to the pages hosted from `webapp/` (privacy policy, terms, and the app name/purpose shown on the homepage must stay consistent with what's configured in Google Cloud Console).

- **Chrome Web Store listing:** [chromewebstore.google.com/detail/nestpane](https://chromewebstore.google.com/detail/nestpane/aokkcpfoompjgeknhbkphogfcjjlbpol)
- **Website:** [nestpane.netlify.app](https://nestpane.netlify.app/)

---

## Repository structure

```
nestpane/
├── README.md              ← you are here — repo-wide overview
├── extension/              The Chrome extension (Manifest V3)
│   ├── README.md            Full extension documentation (features, OAuth setup, build, deploy, permissions)
│   ├── manifest.json         Name, version, permissions, OAuth client, icons
│   ├── app.js                 All application logic (~10,500 lines)
│   ├── newtab.html            New tab page — full dashboard markup
│   ├── style.css              Design system and component styles
│   ├── popup.html / popup.js  Toolbar popup — quick-save a bookmark
│   ├── fouc.js                 Applies theme before first paint
│   ├── build.js                 Validates sources, minifies, copies to dist/
│   ├── icons/                    Brand icon (SVG source + generated PNGs)
│   ├── graphics-assets/           Chrome Web Store listing icon/screenshots/promo images
│   ├── privacy.html / terms.html  Bundled copies (also hosted from webapp/)
│   └── dist/                       Build output — zipped for the Chrome Web Store (gitignored)
└── webapp/                  The marketing/legal site (static, Netlify)
    ├── README.md              Full webapp documentation (design system, pages, deploy)
    ├── index.html              Landing page — hero, purpose, features
    ├── about.html               Mission / design philosophy
    ├── privacy.html              Privacy policy
    ├── terms.html                 Terms of service
    ├── favicon.svg / logo.svg / logo.png   Brand icon
    └── googleee397e5ec21b3ad7.html          Google Search Console site-ownership verification file
```

---

## Part 1 — The Extension (`extension/`)

A Manifest V3 Chrome extension. No framework, no backend — vanilla HTML/CSS/JS, built with a small Node script (`build.js` + esbuild) purely to validate sources and minify for release. All state lives in `chrome.storage.local`.

### Features

- **Bookmarks & Quick Access** — import Chrome bookmarks, organize into folders, pin frequently-used sites as one-click shortcuts, search, sort, and manage via context menu
- **Smart Organize** — one click sorts your open tabs into existing bookmark folders using an LLM (requires your own Anthropic API key)
- **Notes** — tagged notes with pin, full-text search, and a rich editor
- **Nestodo** — a Kanban-style task board (To Do / In Progress / Done) with due-date reminders
- **Reminders** — standalone date/time reminders, independent of Nestodo cards
- **Voice Quick-Capture** — speak a note or task using the Web Speech API
- **Focus Timer** — Pomodoro-style 5/15/25-minute timer with an optional distracting-site blocker
- **Calendar** — mini monthly calendar with one-time, daily, weekly, and custom-interval events, plus an optional read-only Google Calendar widget
- **Daily Journal** — date-stamped entries with mood tagging and word count
- **Habit Tracker** — daily habit streaks with completion history
- **Mood Tracker** — daily emoji log with optional notes
- **Reading Queue** — save URLs to read later
- **Tab Sessions** — save and restore groups of open tabs
- **History & Downloads viewers** — searchable browser history and recent downloads
- **Analytics / Insights** — top visited sites, browsing activity, and a 14-day activity trend
- **Weather widget** — current conditions + 3-day forecast (auto-detect or manual city, no API key)
- **AI Daily Briefing** — short LLM-generated morning summary of weather and pending tasks
- **Motivational quotes**, **custom wallpaper**, and a **theme marketplace** (Gruvbox-inspired dark/light, plus Nord, Dracula, Catppuccin, Solarized, and a custom accent color picker)
- **Unified command palette** (`/`) — search bookmarks, notes, tasks, history, open tabs, the reading queue, saved sessions, and journal entries, plus an "Ask AI" action
- **Google Drive sync (optional)** — backs up your data to a private, hidden `drive.appdata` folder only Nestpane can see
- **End-to-end encryption (optional)** — passphrase-based AES-GCM encryption layer on top of Drive backups (PBKDF2, 600,000 iterations)
- **Extension popup** — one-click bookmark save from any page via the toolbar button

### Tech stack

Chrome Extension (Manifest V3) · vanilla JS/HTML/CSS (no framework) · `chrome.identity.getAuthToken()` for Google sign-in (no client secret) · `chrome.storage.local` for all data · Google Drive REST API v3 (`appdata` scope) for optional sync · WebCrypto for optional E2E encryption · Anthropic Messages API for optional AI features · Web Speech API for voice capture · `chrome.declarativeNetRequest` for focus-mode site blocking · esbuild for release minification.

### Quick start (local development)

```bash
cd extension
```

1. Open Chrome → `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** → select the `extension/` folder.
3. Open a new tab — the dashboard loads immediately. No build step needed for local dev; edit `app.js`/`style.css`/`newtab.html` directly and reload the extension to see changes.

### Build & package for the Chrome Web Store

```bash
cd extension
npm install        # only needed once, for build.js / esbuild
npm run build        # validate sources + minify into dist/
npm run zip            # build + zip dist/ into nestpane-v<version>-chrome.zip
```

Upload the resulting ZIP via the **Package** tab in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Full details — OAuth client setup, required permissions, security notes, and troubleshooting — are in **[`extension/README.md`](extension/README.md)**.

---

## Part 2 — The Website (`webapp/`)

A static site (no build step, no framework beyond Tailwind via CDN) serving as Nestpane's public face: the landing page, privacy policy, and terms of service that the Chrome Web Store listing and Google OAuth consent screen both link to.

### Pages

- **`index.html`** — landing page: hero, a "Purpose of Nestpane" section explaining what the extension does and exactly what its two optional Google scopes are used for, and a 6-card feature grid
- **`about.html`** — mission and design philosophy
- **`privacy.html`** — full data-handling disclosure (what's stored, what's optional, what's never collected)
- **`terms.html`** — terms of service
- **`googleee397e5ec21b3ad7.html`** — Google Search Console domain-ownership verification file. **Never delete, rename, or edit this file's contents.** Search Console verified ownership of `https://nestpane.netlify.app/` against it (HTML file method) — removing it, or a deploy that stops serving it at this exact path, silently breaks that verification and reopens the OAuth "home page is not registered to you" review issue. If you ever add a custom domain or otherwise restructure `webapp/`, add a second verification method (DNS TXT record or meta tag, via Search Console → Settings → Ownership verification) before touching this file.

### Design system

Dark-mode-first, built with Tailwind CSS via CDN. Brand accent `#FF6B00`, background `#0F0F0F`/`#1A1A1A`, `Space Grotesk` for display type and `Inter` for body text. Full details in **[`webapp/README.md`](webapp/README.md)**.

### Local development

```bash
cd webapp
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

No build step, no dependencies — plain HTML files.

### Deployment (Netlify)

Netlify auto-deploys from `main` with zero build configuration — pushing to `main` is the entire deploy process. No manual Netlify CLI steps are needed for normal changes.

---

## How the two projects stay in sync

Google's OAuth verification and Chrome Web Store review both cross-check the extension against the website, so these must always agree:

- The **app name** in the OAuth consent screen (Google Cloud Console) must match the name shown on `webapp/index.html`.
- The **logo** should be visually consistent across `extension/icons/`, `extension/graphics-assets/store-icon-128.png`, and `webapp/favicon.svg` / `logo.svg` / `logo.png` — all generated from the same SVG source.
- The **privacy policy** linked from the OAuth consent screen and the Chrome Web Store listing is `webapp/privacy.html` (also bundled as `extension/privacy.html` for offline access from within the extension).
- The **scopes requested** in `extension/manifest.json` (`oauth2.scopes`) must be justified by what `webapp/index.html`'s "Purpose of Nestpane" section and `webapp/privacy.html` actually describe.

If you change the logo, app name, or requested OAuth scopes, update both projects together.

---

## Contributing

Each project has its own detailed README with full setup, environment, permissions, and troubleshooting docs:

- **[`extension/README.md`](extension/README.md)** — features, tech stack, Google OAuth client setup, build/deploy, required permissions, security notes, troubleshooting
- **[`webapp/README.md`](webapp/README.md)** — design system, page inventory, deployment

## License

© 2026 Nestpane. All rights reserved. See [`webapp/terms.html`](webapp/terms.html) for full terms.
