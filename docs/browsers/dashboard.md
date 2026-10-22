# Web dashboard (`nestpane.kneeraazon.com/dashboard/`)

Not a browser target in the usual sense — this is the *same* `app.js`/`lib/*.js` served as a
plain web page, so people can try Nestpane with zero install. It works in any modern browser
(Chrome, Firefox, Safari, Brave, Edge, etc.) because it uses none of `chrome.*`'s extension-only
APIs directly — `app.js` already branches on `IS_CHROME` for every one of them.

## 1. What's identical to the extension

Notes, tasks/Nestodo, habits, journal, the focus timer countdown, settings/themes, quick access,
command palette web search (falls back to a Google search URL, same as it already does for any
non-Chromium browser), and the AI features (Ask AI / Smart Organize is tab-scanning only, see
below / daily briefing) all run unmodified. Local storage persistence, the schema-migration
framework, and autosave/flush-on-hide all apply exactly as they do in the extension, because it's
the same code.

## 2. What's genuinely different, and why

These aren't bugs — they're platform limits no web page can get around, the same reasoning that
already applies to Firefox/Safari lacking Chromium-only APIs:

- **Bookmarks**: no web page can read or write the browser's *real* bookmark store — that's an
  extension-only privilege on every browser. The dashboard now has its own, separate, persisted
  bookmark tree (`extension/lib/bookmarks-store.js`, localStorage-backed) so Add/Edit/Delete
  actually work and persist — it just isn't the same list as your browser's native bookmarks bar.
- **History / Downloads**: same root cause — no web API exists to read either on any browser.
  These views now honestly show "Requires the browser extension" instead of fabricated demo
  data (previous behavior, fixed this session — see `docs/CHANGELOG.md`).
- **Tab Sessions** (save/restore open tabs): same root cause (`chrome.tabs`). Guarded with a
  clear message; a tab-session synced in from another device via Drive backup won't try to open
  tabs and silently fail.
- **Focus Mode site-blocking**: `declarativeNetRequest` is extension-only — a web page cannot
  block navigation in other tabs on any browser, full stop. The timer itself still works; the
  blocking half doesn't, and the ceiling constant that reads this API was hardened this session
  so it no longer throws when `chrome` doesn't exist at all (previously an unguarded top-level
  reference — a real crash risk once this was deployed as a plain page, not just a hypothetical).
- **Reminders / habit notifications**: now use the standard Web Notifications API as a real
  (not degraded) equivalent — permission is requested the first time a notification would fire,
  not on page load.

## 3. Google sign-in / Drive backup — needs one manual step before it works

`chrome.identity` doesn't exist on a plain web page at all, on any browser. The dashboard now
implements a standard OAuth2 implicit-flow redirect instead (`_plainWebOAuthToken` in `app.js`,
`webapp/dashboard/oauth-callback.html`):

1. Clicking "sign in" redirects the whole page to Google's consent screen.
2. Google redirects back to `oauth-callback.html` with the token in the URL fragment (fragments
   never reach a server).
3. That page hands the token to `localStorage` and sends the user back to `/dashboard/`.
4. `app.js` picks it up on load and finishes sign-in the same way the extension does.

**Sign-out security (fixed in 2.1.3):** the first version of this shipped in 2.1.2 with a bug —
`_revokeGoogleAccess()`'s revoke-and-clear step was guarded by `IS_CHROME`, which is false on
the dashboard, so clicking "sign out" cleared the profile UI but left the token fully valid in
`localStorage` and never told Google to revoke it. Caught by an automated security review
immediately after 2.1.2 shipped. Fixed: sign-out now revokes with Google and clears the local
copy unconditionally, on every platform.

**This needs a redirect URI registered in Google Cloud Console before it will work**:
`https://nestpane.kneeraazon.com/dashboard/oauth-callback.html`. The existing `WEB_AUTH_CLIENT_ID`
was created for `chrome.identity.launchWebAuthFlow`, whose redirect URIs are always the
extension's `*.chromiumapp.org` shape — OAuth client *types* in Google Cloud Console restrict
which redirect URI shapes they accept, so this plain `https://` redirect likely needs its own
"Web application"-type client rather than reusing that one. Until that's registered, sign-in on
the dashboard will fail with the same `redirect_uri_mismatch` error seen earlier this session for
the unpacked-extension case — same cause, different redirect URI. **Not something this session
can do — it's a Google Cloud Console action only the account owner can take.**

## 4. Build and deploy

```
node scripts/build-dashboard.js    # regenerates webapp/dashboard/ from extension/ source
```

Run this any time `extension/app.js`, `extension/lib/*.js`, `extension/style.css`,
`extension/fouc.js`, or `extension/newtab.html` change — it is **not** wired into any CI/deploy
hook yet, so the dashboard can silently drift from the extension if someone forgets to re-run it.
`webapp/dashboard/oauth-callback.html` is hand-written, not generated, and untouched by this
script.

## 5. Verification record

| Date | What | How |
|---|---|---|
| 2026-10-22 | Generator script runs clean; every output `.js` file (minified) syntax-checked with `node --check`; `index.html` validated as well-formed HTML | This session |
| 2026-10-22 | Google sign-in on the dashboard | **Not verified** — needs the Cloud Console redirect URI above, which wasn't done this session, and a real browser, which also wasn't available |
| 2026-10-22 | Bookmarks/notes/tasks/habits/journal actually working end-to-end in a browser | **Not verified** — same reason, no browser available |
| 2026-10-22 | Sign-out revoke/clear fix (security review finding, same day) | Code reviewed and corrected; re-generated via `node scripts/build-dashboard.js`, minified output syntax-checked. The actual revoke-with-Google round trip **still not verified** — no browser available. |
