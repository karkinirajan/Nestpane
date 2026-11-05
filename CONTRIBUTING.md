# Contributing to Nestpane

Thanks for taking a look. Bug reports, ideas, documentation fixes and code are all welcome. This page covers how to get set up, what a good change looks like here, and the few rules that keep the project small and its users' data private.

## Ways to help

- Report a bug or ask for a feature using the [issue forms](https://github.com/karkinirajan/Nestpane/issues/new/choose).
- Tell us what you use your new tab for, or what you expected and didn't find. The "Feedback and ideas" form is for that.
- Pick up an issue labeled `good first issue`.
- Add tests. Much of the interface logic has none yet (see [Tests](#tests)).
- Improve the README files.

If you plan a large change, open an issue first so we can agree on the approach before you spend the time.

## Repo layout

| Folder | What it is |
|---|---|
| `extension/` | The Chrome extension (Manifest V3). `app.js` holds the app, `lib/` holds small tested modules, `tests/` holds the unit tests |
| `webapp/` | The marketing site, privacy policy and terms, plus `webapp/dashboard/`, a browser-only copy of the dashboard |
| `.github/` | Issue forms and the pull request template |

`extension/` and `webapp/` ship separately. `webapp/dashboard/` is generated from `extension/` by `extension/scripts/build-dashboard.js`, so don't edit it by hand.

## Set up

You need Chrome (or another Chromium browser) and Node.js 18 or newer.

```bash
git clone https://github.com/karkinirajan/Nestpane.git
cd Nestpane/extension
npm ci
```

Run it:

1. Open `chrome://extensions` and turn on Developer mode.
2. Choose Load unpacked and select the `extension/` folder.
3. Open a new tab. After editing a file, reload the extension and open a new tab again.

You don't need a build step to develop. `npm run build` only validates the sources and minifies them into `dist/` for release.

Google sign-in and Drive backup won't work on a fork until you register your own OAuth clients. See [`extension/README.md`](extension/README.md#google-oauth-setup). Everything else works offline with no setup.

## Before you open a pull request

From `extension/`:

```bash
npm test          # unit tests (node --test)
npm run lint      # must exit 0 with no warnings
npm run build     # sources validate and minify
```

If you changed anything in `extension/` that the web dashboard also runs (`app.js`, `lib/`, `style.css`, `newtab.html`), regenerate the dashboard and commit the result:

```bash
npm run build:dashboard
```

Then check your change in a real browser. A passing build doesn't prove the screen looks right. For UI work, include a screenshot in the pull request.

## Conventions

- Plain JavaScript, no framework, no TypeScript, no bundler for development. Two-space indent, double quotes, semicolons.
- No new runtime dependencies. Dev dependencies need a good reason too.
- Reuse what exists. Look for a helper or component before writing a new one, and don't duplicate logic.
- Keep logic that has edge cases in `lib/` as a pure function and test it. `lib/sidebar-order.js` and `tests/sidebar-order.test.js` are a good model.
- Escape anything user-supplied before it reaches `innerHTML`, and validate URLs (`safeUrl` in `lib/format.js`).
- Commit messages follow the existing style: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, with an optional scope, then a short summary in the imperative.

### Adding a module to `lib/`

A new file needs to be registered in four places, or it won't load or ship:

1. A `<script src="lib/your-module.js">` tag in `extension/newtab.html`, before `app.js`
2. `REQUIRED_FILES` in `extension/build.js`
3. `LIB_FILES` in `extension/scripts/build-dashboard.js`
4. The global name in `extension/eslint.config.js`

Follow the existing pattern: an IIFE that exports for Node tests (`module.exports`) and attaches a `Nestpane...` global in the browser.

## Things that need a conversation first

These change what the project promises to users, so please open an issue before sending code.

- **New permissions or host permissions.** They can trigger a re-review in the Chrome Web Store and they widen what the extension can see. Every permission is explained in the permissions section of [`extension/README.md`](extension/README.md).
- **New network requests.** Nestpane has no server, no analytics and no telemetry, and that is a feature. Anything that contacts a third party must be optional, off by default, and documented in the privacy policy.
- **Changes to storage shape.** Stored data needs a migration (see `extension/lib/migrations.js`) so existing users keep their data.
- **Changes to sign-in or Drive backup.** These touch OAuth and user data. Include the steps you used to test them.

## Tests

Tests use Node's built-in runner and live in `extension/tests/`. Name a test after the behavior it proves.

New and changed logic should come with tests, and adding tests for logic that has none is a welcome first contribution.

## Releases

Maintainers bump the version, build the Chrome Web Store package and publish it. Please don't change version numbers in a pull request. The steps are in the Release section of the [README](README.md#release).

## Reporting a security problem

Please don't put exploit details in a public issue. Use the Security tab on the GitHub repository and choose Report a vulnerability. If that option isn't available, open an issue that says you have a security report and leave out the details, and a maintainer will arrange a private channel.

## Be kind

Be respectful in issues and reviews. Assume good intent, give specific feedback, and keep it about the code. Maintainers may edit or remove comments that aren't.

## License

By contributing, you agree that your work is released under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE). The Nestpane name and logo are not covered by that license.
