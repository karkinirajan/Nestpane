# Release runbook — 2.1.0

## Before anything else

1. **Verify the live Chrome Web Store version manually.** This repo could not check it (no
   dashboard access in this session). If it's already ≥ 2.1.0, stop and re-derive the version
   number before proceeding — `docs/PLAN.md` flags this explicitly.
2. Confirm `manifest.json`, `package.json`, and this changelog all agree on `2.1.0` — they do as
   of this session (`grep -r '"version"' extension/manifest.json extension/package.json`).

## Build, from a clean checkout

```
cd extension
npm install
npm test                 # expect: 20 passing
npm run lint              # expect: 0 errors, 0 warnings
npm run check-registry    # expect: FAILS today — 11/14 active features have no test; this is
                           # the real current state, not something to silence before release
npm run build              # -> dist/
npm run zip                 # -> nestpane-v2.1.0-chrome.zip
npm run build:firefox       # -> dist-firefox/ (not submitted anywhere this release)
```

All of the above were actually run in this session on 2026-10-21 and produced the results shown.

## SHA-256 of the Chrome package

Measured from `dist/` zipped with `zip -r` (re-measured 2026-10-21, same session, regenerated
via `npm run zip` — note the hash changed from the first build earlier in this session purely
from zip-entry timestamps, confirming the "regenerate rather than trust a stale hash" guidance
below is correct in practice, not just theory):

```
aac67a4457738c6c7b6e2ac4108efd46027b2b45d2ea6bfa68260819c2517284  nestpane-v2.1.0-chrome.zip  (117 KB)
```

(Regenerated again after the autosave/flush-on-hide fix below — hash changed again, as expected.)

Regenerate and re-verify this hash at actual release time — it's a snapshot of this session's
build, not a guarantee the exact same bytes come out of a later rebuild (timestamps inside the
zip, toolchain versions, etc. can all shift it).

## Chrome Web Store submission

**Not performed this session — stop here and get explicit approval (Gate C) before doing this
for real.** When approved:

1. Build fresh per above.
2. Upload `nestpane-v2.1.0-chrome.zip` via Developer Dashboard → Package.
3. Listing text: no changes required unless `docs/features.md`'s top-5 picks are adopted into
   the public listing copy (currently internal-only).
4. No permission/scope changes — should not trigger re-review, but CWS's own validation is the
   actual authority, not this document.

## Edge / Brave / Opera / Vivaldi / Arc

Install from the same Chrome Web Store listing — no separate package needed
(`docs/browsers/chrome.md`).

## Firefox

Buildable (`npm run build:firefox`), **not submitted**. No AMO account/credentials available
this session. Before submitting: run `web-ext lint` (not installed/run this session) and resolve
whatever it flags.

## Safari

**Not started.** Needs a macOS host with Xcode. See `docs/browsers/safari.md`.

## Staged rollout (Chrome)

Recommendation, not yet put into practice (no dashboard access to actually set a rollout
percentage): 10% → 50% → 100% over a few days, watching:
- Error reports (new ones, specifically around Drive sync and migrations — the two things that
  actually changed behavior this release)
- Uninstall rate
- Review text for complaints about sync/data loss

**Rollback trigger**: any confirmed report of data loss on upgrade, or a migration error rate
above zero in whatever telemetry is available (none is currently instrumented — see
`docs/discovery.md` telemetry note, which found none exists, and that's intentional per the
privacy policy).

## Rollback procedure

CWS requires a strictly higher version to publish, so a rollback is a forward-fix:
1. Keep the 2.0.1 zip as a release asset (not currently archived anywhere in this repo — add it
   before shipping 2.1.0, from this session's build or the prior published artifact).
2. If 2.1.0 needs to be pulled, prepare 2.1.1 reverting the problematic change and publish that.
