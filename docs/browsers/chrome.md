# Chrome (and all Chromium browsers)

## 1. Support matrix and minimum versions

- Chrome Web Store (CWS) is the primary distribution channel for all Chromium browsers below.
- Minimum Chrome version: not pinned in `manifest.json` (no `minimum_chrome_version` key). Build
  targets esbuild's `chrome110` for minification (`build.js:141`), so Chrome 110+ is the de facto
  floor; not independently re-verified against current CWS requirements this session.
- **Edge Add-ons**: Edge can install directly from the Chrome Web Store (Microsoft allows this);
  a separate Edge-store listing is optional, not required. Not independently re-verified against
  the current Edge Add-ons docs this session — do that before claiming parity in a store listing.
- **Brave**: installs from CWS. `declarativeNetRequest` (used by Focus Mode) and
  `chrome.identity.getAuthToken` behavior under Brave's aggressive privacy defaults were not
  re-tested this session — `app.js:1225` already calls `_isBrave()` to skip native
  `getAuthToken` and go straight to the `launchWebAuthFlow` fallback, suggesting this was already
  hit and worked around in a prior release; not independently re-verified here.
- **Opera, Vivaldi, Arc**: all install from CWS; no Nestpane-specific caveats found in the code
  or docs. Not independently tested in this session.

## 2. Manifest delta from the shared base

None — `manifest.json` *is* the Chromium manifest; there is no delta file for this target.

## 3. API differences and how they're handled

All `chrome.*` calls in `app.js` target Chromium's API surface directly (see
`docs/discovery.md` for the full usage table). No abstraction layer exists for this target
because none is needed — Chromium is the native surface the code was written against.

## 4. Build and package commands

```
npm install
npm run build        # -> dist/
npm run zip           # -> nestpane-v<version>-chrome.zip
```

`npm run build` validates required files, manifest permissions, and the manifest `key` (if
present) against the published extension ID before writing `dist/` (`build.js:52-110`).

## 5. Test procedure for this browser

```
npm test             # unit tests — 20 passing as of 2.1.0, see docs/REPORT.md
npm run lint          # eslint — 0 errors, 0 warnings as of 2.1.0
npm run check-registry # feature-registry.json coverage gate — currently FAILS, see docs/REPORT.md
```

No E2E suite exists yet for this target (Playwright + persistent context with the unpacked
extension loaded) — not built this session; tracked as an open item in `docs/RELEASE.md`.

## 6. Submission and deployment steps

Not executed this session (no CWS dashboard credentials supplied). Checklist for whoever runs
it:

1. Confirm the live CWS version for Nestpane (this repo could not check it) — 2.1.0 must be
   strictly greater than whatever that is.
2. Upload `nestpane-v2.1.0-chrome.zip` via the Developer Dashboard's Package tab.
3. Update listing text/screenshots if `docs/features.md`'s top-5 changed.
4. No permission changes in 2.1.0 (`docs/permissions.md`) — no re-review trigger expected, but
   that's a belief, not something CWS confirms until actually submitted.

## 7. Known review rejections and how to avoid them

From the repo's own history (git log), prior rejections involved OAuth branding/logo consistency
and privacy-policy completeness (see commits `0824c0d`, `4232d42`). Both were resolved in prior
releases; nothing in this session's changes touches OAuth branding or privacy copy, so no new
rejection risk identified — not independently re-verified against current CWS policy pages this
session.

## 8. Rollback procedure

Re-publish the previous accepted package (2.0.1) via the Dashboard. CWS requires a *higher*
version number to publish, so a same-version rollback isn't directly possible — prepare a
2.1.1 "rollback-by-forward-fix" build that simply reverts the problematic change, per
`docs/RELEASE.md`.

## 9. Verification record

| Date | Version | Who | Evidence |
|---|---|---|---|
| 2026-10-21 | 2.1.0 | automated session | `npm run build`, `npm test` (20/20 pass), `npm run lint` (clean), `npm run zip` all run and confirmed in this session. CWS submission **not** performed — no credentials. |
