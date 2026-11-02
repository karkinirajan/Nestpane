# Release runbook — 3.1.0

History: 2.1.0 → 2.1.1 was a version-only bump after CWS rejected 2.1.0 as a duplicate. 2.1.1 →
2.1.2 added the web dashboard support code. 2.1.2 → 2.1.3 was a same-day security fix for web
dashboard sign-out token revocation. 2.1.3 → 2.2.0 delivered the first-login Drive override,
progressive 500 ms sync, the design overhaul, and the top-5 features. 2.2.0 → 3.1.0 makes the
Google sign-in persistent (saves can no longer erase it, tokens refresh silently), adds the theme
dropdown, rewrites sidebar drag-and-drop and editing, makes the layout responsive from 640 px up,
and cleans up the repo.
See `docs/05-release/changelog.md` for the full breakdown.

## Before anything else

1. **Verify the live Chrome Web Store version manually before uploading.** This repo cannot
   check it (no dashboard access). CWS needs a strictly higher version than the live one; if
   3.1.0 is somehow taken, bump `extension/manifest.json` and `extension/package.json`,
   rebuild, and re-zip.
2. Confirm `manifest.json` and `package.json` agree on `3.1.0`
   (`grep -r '"version"' extension/manifest.json extension/package.json`).

## Build the Chrome extension, from a clean checkout

```
cd extension
npm ci
npm test                 # expect: 65 passing
npm run lint              # expect: exit 0, no warnings
npm run build              # -> dist/
npm run zip                 # -> nestpane-v3.1.0-chrome.zip (reproducible; no `zip` binary needed)
```

All of the above were run on 2026-11-02 and produced the results shown. `npm run zip` builds
`dist/` first, then packs it with `scripts/zip-dist.js`; running it twice produced byte-identical
files.

## SHA-256 of the Chrome package

```
84887f2a27351046dab5ee3f65d323788b003d4ad15d7b14244016cd74b59b7d  nestpane-v3.1.0-chrome.zip  (125816 bytes, 21 files)
```

65/65 tests and `eslint` clean at this hash. Regenerate and re-verify at actual release time.

## Build the web dashboard

```
node scripts/build-dashboard.js   # regenerates webapp/dashboard/ from extension/ source
```

Re-run on 2026-11-02 — regenerated the `webapp/dashboard/` tree for 3.1.0. **Google sign-in on the dashboard
will not work until a redirect URI is registered in Google Cloud Console** — see
`docs/03-platforms/dashboard.md` §3; this is a manual console step, not something fixable by
rebuilding. Nothing else about the dashboard needs a server or build step beyond this script —
it's static files, deployed the same way the rest of `webapp/` already is (Vercel, confirmed
earlier this engagement to auto-deploy on push to `main`).

## Chrome Web Store submission

**Not performed this session — stop here and get explicit approval (Gate C) before doing this
for real.** When approved:

1. Build fresh per above.
2. Upload `nestpane-v3.1.0-chrome.zip` via Developer Dashboard → Package.
3. Listing text: no changes required unless `docs/01-overview/features.md`'s top-5 picks are adopted into
   the public listing copy (currently internal-only).
4. No permission/scope changes — should not trigger re-review, but CWS's own validation is the
   actual authority, not this document.

## Edge / Brave / Opera / Vivaldi / Arc

Install from the same Chrome Web Store listing — no separate package needed
(`docs/03-platforms/chrome.md`).

## Firefox

Buildable (`npm run build:firefox`, builds cleanly at 3.1.0). **Not submitted —
left to the project owner**, by their own request: AMO account, `web-ext lint`, and the actual
submission are all still open.

## Safari

**Not started — left to the project owner**, by their own request. Needs a macOS host with
Xcode. See `docs/03-platforms/safari.md`.

## Staged rollout (Chrome)

Recommendation, not yet put into practice (no dashboard access to actually set a rollout
percentage): 10% → 50% → 100% over a few days, watching:
- Error reports (new ones, specifically around Drive sync, migrations, and now the web
  dashboard's bookmark store and OAuth flow — the things that actually changed behavior)
- Uninstall rate
- Review text for complaints about sync/data loss

**Rollback trigger**: any confirmed report of data loss on upgrade, or a migration error rate
above zero in whatever telemetry is available (none is currently instrumented — see
`docs/02-architecture/codebase-discovery.md` telemetry note, which found none exists, and that's intentional per the
privacy policy).

## Rollback procedure

CWS requires a strictly higher version to publish, so a rollback is a forward-fix:
1. Keep the last known-good published zip (2.0.1, or whatever CWS actually has live — still
   unverified from this session) as a release asset. Not currently archived anywhere in this
   repo — add it before shipping 3.1.0.
2. If 3.1.0 needs to be pulled, prepare 3.1.1 reverting the problematic change and publish that.
3. The web dashboard has no version number of its own and no store review — rolling it back
   means re-running `node scripts/build-dashboard.js` against whatever `extension/` commit was
   last known-good, then redeploying `webapp/`.
