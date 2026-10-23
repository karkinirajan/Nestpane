# Release runbook — 2.1.4

History: 2.1.0 → 2.1.1 was a version-only bump after CWS rejected 2.1.0 as a duplicate. 2.1.1 →
2.1.2 added real functionality — the web dashboard support code (bookmarks store, web OAuth,
honest history/downloads degradation, notification/declarativeNetRequest hardening). 2.1.2 →
2.1.3 was a same-day security fix for web dashboard sign-out token revocation. 2.1.3 → 2.1.4
delivers the bulletproof Google Drive first-login override & progressive 500ms sync, the
Obsidian Dark & Warm Paper human-crafted design overhaul across extension + website, and the
Top 5 Distinguishing Features (`[[Wiki-Links]]` & Backlinks, Task-Bound Focus Flow Contracts,
Workspace Tab Stash & Switch, 4-Mode Popup Web Clipper, and 7-Day Rolling Snapshot Time Machine).
See `docs/CHANGELOG.md` for the full breakdown.

## Before anything else

1. **Verify the live Chrome Web Store version manually before uploading.** This repo still
   cannot check it (no dashboard access). If 2.1.4 is also already taken, same pattern: bump
   again, rebuild, re-zip.
2. Confirm `manifest.json` and `package.json` agree on `2.1.4`
   (`grep -r '"version"' extension/manifest.json extension/package.json`).

## Build the Chrome extension, from a clean checkout

```
cd extension
npm install
npm test                 # expect: 52 passing
npm run lint              # expect: 0 errors, 0 warnings (checked at --max-warnings 0)
npm run build              # -> dist/
npm run zip                 # -> nestpane-v2.1.4-chrome.zip
```

All of the above were run on 2026-10-23 and produced the results shown.

## SHA-256 of the Chrome package

```
cdb1d1674b06b7e362d899d4a7e9e86203a4b58d38ab8179fa4ebed8a5c66436  nestpane-v2.1.4-chrome.zip  (123 KB)
```

52/52 tests and `eslint --max-warnings 0` clean at this hash. Regenerate and re-verify at actual
release time.

## Build the web dashboard

```
node scripts/build-dashboard.js   # regenerates webapp/dashboard/ from extension/ source
```

Run in this session on 2026-10-22 — produced a `webapp/dashboard/` tree, every `.js` file
syntax-checked, `index.html` validated as well-formed HTML. **Google sign-in on the dashboard
will not work until a redirect URI is registered in Google Cloud Console** — see
`docs/browsers/dashboard.md` §3; this is a manual console step, not something fixable by
rebuilding. Nothing else about the dashboard needs a server or build step beyond this script —
it's static files, deployed the same way the rest of `webapp/` already is (Vercel, confirmed
earlier this engagement to auto-deploy on push to `main`).

## Chrome Web Store submission

**Not performed this session — stop here and get explicit approval (Gate C) before doing this
for real.** When approved:

1. Build fresh per above.
2. Upload `nestpane-v2.1.3-chrome.zip` via Developer Dashboard → Package.
3. Listing text: no changes required unless `docs/features.md`'s top-5 picks are adopted into
   the public listing copy (currently internal-only).
4. No permission/scope changes — should not trigger re-review, but CWS's own validation is the
   actual authority, not this document.

## Edge / Brave / Opera / Vivaldi / Arc

Install from the same Chrome Web Store listing — no separate package needed
(`docs/browsers/chrome.md`).

## Firefox

Buildable (`npm run build:firefox`, re-verified against 2.1.3 this session). **Not submitted —
left to the project owner**, by their own request: AMO account, `web-ext lint`, and the actual
submission are all still open.

## Safari

**Not started — left to the project owner**, by their own request. Needs a macOS host with
Xcode. See `docs/browsers/safari.md`.

## Staged rollout (Chrome)

Recommendation, not yet put into practice (no dashboard access to actually set a rollout
percentage): 10% → 50% → 100% over a few days, watching:
- Error reports (new ones, specifically around Drive sync, migrations, and now the web
  dashboard's bookmark store and OAuth flow — the things that actually changed behavior)
- Uninstall rate
- Review text for complaints about sync/data loss

**Rollback trigger**: any confirmed report of data loss on upgrade, or a migration error rate
above zero in whatever telemetry is available (none is currently instrumented — see
`docs/discovery.md` telemetry note, which found none exists, and that's intentional per the
privacy policy).

## Rollback procedure

CWS requires a strictly higher version to publish, so a rollback is a forward-fix:
1. Keep the last known-good published zip (2.0.1, or whatever CWS actually has live — still
   unverified from this session) as a release asset. Not currently archived anywhere in this
   repo — add it before shipping 2.1.3.
2. If 2.1.3 needs to be pulled, prepare 2.1.4 reverting the problematic change and publish that.
3. The web dashboard has no version number of its own and no store review — rolling it back
   means re-running `node scripts/build-dashboard.js` against whatever `extension/` commit was
   last known-good, then redeploying `webapp/`.
