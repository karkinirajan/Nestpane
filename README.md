# Nestpane

A local-first new tab dashboard for Chrome and other Chromium browsers. Bookmarks, notes, a task board, a focus timer, habits and a journal on the page that opens when you press Ctrl+T, with no account, no server and no tracking.

[Chrome Web Store](https://chromewebstore.google.com/detail/nestpane/aokkcpfoompjgeknhbkphogfcjjlbpol) ·
[Website](https://nestpane.kneeraazon.com/) ·
[Try it in a browser tab](https://nestpane.kneeraazon.com/dashboard/)

Current version: **3.1.0**. Open source under the [GPL-3.0](LICENSE).

---

## What it does

| Area | What you get |
|---|---|
| Home | Quick Access tiles, a calendar, reminders, a notes widget, a To-Do widget and a focus timer |
| Bookmarks | Your browser's real bookmarks with search, folders and sorting |
| Notes | Markdown notes with tags, pins, `[[wiki-links]]` and backlinks |
| Tasks | Nestodo, a To Do / In Progress / Done board, plus standalone reminders |
| Focus | 25, 15 and 5 minute sessions, breaks, and an optional site blocker |
| Habits and journal | Daily habits with streaks, and a dated journal with a mood |
| Tabs | Saved tab sessions with stash and switch, a reading queue, History and Downloads views |
| Search | One command palette for bookmarks, notes, tasks, history, open tabs and more, plus optional AI answers |
| Sidebar | Groups of views and links you can add, edit, reorder and drag between groups |
| Themes | Six themes in a dropdown, and an accent color |
| Safety net | A trash for deleted items and seven rolling daily snapshots |
| Backup | Optional Google Drive backup into a private app folder, with optional passphrase encryption |

The AI features (Ask AI, the daily briefing, Smart Organize, adding tasks from text) are off until you paste your own Anthropic API key.

## How it works

- **Manifest V3 extension, plain JavaScript.** No framework and no runtime dependencies. The new tab page is one app (`extension/app.js`) with small tested modules in `extension/lib/`.
- **Local first.** Everything is stored in `chrome.storage.local`. There is no Nestpane server, no analytics and no telemetry.
- **Optional backup.** Drive backup writes one JSON file to the hidden `appDataFolder`. With encryption on, it is wrapped with AES-GCM, using a key derived from your passphrase with PBKDF2 (600,000 iterations).
- **Stays signed in.** The saved Google account is removed only by Sign out. A keep-alive renews the access token in the background.
- **One codebase, two targets.** The same app runs as the extension and, in a normal tab, as the web version at `/dashboard/`, which is generated from the extension source.

Two things still reach Google by default: the web fonts and the site icons on Quick Access tiles.

## Repository

```
nestpane/
├── extension/        The Chrome extension (Manifest V3)
│   ├── app.js          The app
│   ├── newtab.html     New tab page markup
│   ├── style.css       Design tokens, themes and components
│   ├── popup.html/js   Toolbar popup that saves the current page
│   ├── lib/            Small modules, each unit tested
│   ├── tests/          node --test suites
│   ├── scripts/        Zip writer, Firefox manifest merge, web dashboard generator
│   └── build.js        Validates and minifies into dist/
├── webapp/           The website, privacy policy, terms, changelog and the web version
│   └── dashboard/      Generated from extension/, never edited by hand
├── .github/          Issue forms and the pull request template
├── CONTRIBUTING.md   How to set up, what to check, and what needs an issue first
└── LICENSE           GPL-3.0
```

More detail lives in [`extension/README.md`](extension/README.md) (build, OAuth setup, permissions, store submission) and [`webapp/README.md`](webapp/README.md) (site, deployment).

## Develop

You need Node.js 18 or newer and Chrome.

```bash
cd extension
npm ci
```

Load the extension: open `chrome://extensions`, turn on Developer mode, choose Load unpacked and select `extension/`. There is no build step in development.

| Command | What it does |
|---|---|
| `npm test` | Unit tests |
| `npm run lint` | ESLint, must exit 0 with no warnings |
| `npm run build` | Validates and minifies into `dist/` |
| `npm run build:firefox` | Builds the Firefox variant into `dist-firefox/` |
| `npm run build:dashboard` | Regenerates `webapp/dashboard/` from the extension source |
| `npm run zip` | Builds, then writes `nestpane-v<version>-chrome.zip` (reproducible) |

Run `npm run build:dashboard` and commit the result whenever `app.js`, `lib/`, `style.css` or `newtab.html` change.

Google sign-in is tied to the extension ID and the OAuth client IDs. On a fork, or if either changes, follow [Google OAuth setup](extension/README.md#google-oauth-setup). Everything else works offline.

## Release

1. Check the version currently live on the Chrome Web Store. A new upload needs a higher one.
2. Set the new version in `extension/manifest.json` and `extension/package.json` (and the lockfile's root entry).
3. Add an entry to `webapp/changelog.html`.
4. In `extension/`: `npm ci`, `npm test`, `npm run lint`, `npm run build:dashboard`, `npm run zip`.
5. Unpack the zip into a clean folder and check it in a browser before uploading.
6. Upload the zip on the Package tab of the Chrome Web Store developer dashboard. This step is manual.
7. Push. The website deploys to Vercel from the repository, with no build step.

## Contributing

Bug reports, ideas and pull requests are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first. It covers setup, the checks to run before a pull request, and the few changes (permissions, network requests, storage shape, sign-in) that need an issue before code.

## Known limits

- Reminders only fire while a Nestpane new tab page is open, because there is no background worker.
- Firefox builds but is not published. Safari is not started.
- Google Drive backup on the web version is not verified.
- Quick Access icons and fonts load from Google.

## License

[GNU General Public License v3.0](LICENSE). Anyone may use, study, modify and redistribute Nestpane under those terms, and a distributed derivative work must stay open source under the GPL-3.0. The Nestpane name and logo are not covered by the license. The terms for using the extension and the website are in the [Terms of Service](https://nestpane.kneeraazon.com/terms.html).
