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

2026-10-22: audited every `chrome.*` reference in `app.js` for a latent crash risk once the same
file started shipping as a plain web page too (`webapp/dashboard/`, see
`docs/browsers/dashboard.md`) — a handful of call sites (`FOCUS_RULE_CEILING`'s top-level
initializer, Tab Sessions save/restore) referenced `chrome.*` without the `IS_CHROME` guard every
other call site already has, which is harmless inside the real extension (where `chrome` always
exists) but would throw a `ReferenceError` on Firefox/Safari viewing a page with no `chrome`
global at all. All now guarded consistently. No functional change for the Chrome extension
itself — purely defensive.

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
npm test             # unit tests — 44 passing as of 2.1.3, see docs/final-results.md
npm run lint          # eslint --max-warnings 0 — 0 errors, 0 warnings as of 2.1.3
npm run check-registry # feature-registry.json coverage gate — currently FAILS, see docs/final-results.md
```

No E2E suite exists yet for this target (Playwright + persistent context with the unpacked
extension loaded) — not built this session; tracked as an open item in `docs/RELEASE.md`.

## 6. Submission and deployment steps

Not executed this session (no CWS dashboard credentials supplied). Checklist for whoever runs
it:

1. Confirm the live CWS version for Nestpane (this repo could not check it) — 2.1.3 must be
   strictly greater than whatever that is. 2.1.0 was already rejected as a duplicate during this
   engagement; bump again if 2.1.3 also collides with something already uploaded.
2. Upload `nestpane-v2.1.3-chrome.zip` via the Developer Dashboard's Package tab.
3. Update listing text/screenshots if `docs/features.md`'s top-5 changed.
4. No permission changes in 2.1.3 (`docs/permissions.md`) — no re-review trigger expected, but
   that's a belief, not something CWS confirms until actually submitted.

## 7. Known review rejections and how to avoid them

From the repo's own history (git log), prior rejections involved OAuth branding/logo consistency
and privacy-policy completeness (see commits `0824c0d`, `4232d42`). Both were resolved in prior
releases; nothing in this session's changes touches OAuth branding or privacy copy, so no new
rejection risk identified — not independently re-verified against current CWS policy pages this
session.

## 8. Rollback procedure

Re-publish the previous accepted package via the Dashboard (likely 2.0.1, still unverified from
this session). CWS requires a *higher* version number to publish, so a same-version rollback
isn't directly possible — prepare a 2.1.3 "rollback-by-forward-fix" build that simply reverts
the problematic change, per `docs/RELEASE.md`.

## 9. Verification record

| Date | Version | Who | Evidence |
|---|---|---|---|
| 2026-10-21 | 2.1.0 | automated session | `npm run build`, `npm test` (20/20 pass), `npm run lint` (clean), `npm run zip` all run and confirmed in this session. CWS submission **not** performed — no credentials. |
| 2026-10-22 | 2.1.1 | automated session | Version-only bump after CWS rejected 2.1.0 as a duplicate. Same checks re-run and passing. |
| 2026-10-22 | 2.1.2 | automated session | Bumped again after adding the web dashboard support code (bookmarks store, web OAuth, notification/declarativeNetRequest hardening, fake-data removal from history/downloads). 44/44 tests pass, `eslint --max-warnings 0` clean, `npm run zip` produces a 119 KB archive that passes `unzip -t`. CWS submission **not** performed this session either — still no credentials. |
| 2026-10-22 | 2.1.3 | automated session | Same-day security fix: sign-out on the web dashboard wasn't revoking/clearing the OAuth token (caught by automated review). 44/44 tests pass, lint clean, rebuilt and re-zipped (119 KB, `unzip -t` clean). CWS submission still not performed. |
