# Firefox

## 1. Support matrix and minimum versions

`manifest.firefox.json` sets `strict_min_version: "121.0"`. This is a conservative placeholder,
not an independently confirmed floor: a 2026 web search found MDN stating Firefox does not
support `background.service_worker` and that "from Firefox 121, the background page starts as
expected regardless of the presence of service_worker" ([MDN: Background scripts](https://developer.mozilla.org/Add-ons/WebExtensions/Background_scripts),
[MDN: manifest.json/background](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background))
— but Nestpane has **no background script at all** in either manifest, so this specific
caveat may not even apply here. Re-verify the actual minimum against the current MDN
compatibility table before shipping; 121.0 is a safe-side guess, not a measured requirement.

## 2. Manifest delta from the shared base

`extension/manifest.firefox.json`, merged onto `manifest.json` by
`node build.js --target=firefox` (`extension/scripts/merge-manifest.js`, unit tested —
5 passing tests in `extension/tests/merge-manifest.test.js`):

```json
{
  "browser_specific_settings": {
    "gecko": { "id": "nestpane@kneeraazon.com", "strict_min_version": "121.0" }
  }
}
```

AMO requires an explicit extension id for Firefox (Chrome/Edge derive one from the key or the
store listing instead) — this is why `gecko.id` is the one mandatory addition.

No other key differs. `chrome_url_overrides.newtab` is supported by Firefox per MDN
([chrome_url_overrides](https://developer.mozilla.org/Add-ons/WebExtensions/manifest.json/chrome_url_overrides)),
with a caveat worth testing manually: a 2017 Firefox bug report describes an overridden new-tab
page being unable to redirect back to `about:newtab` — not expected to matter for Nestpane
(it never redirects there), but not re-tested in this session.

## 3. API differences and how the `platform` module handles each

There is no consolidated `platform` module (see `docs/AUDIT.md` A7 — scoped down this release).
Per-call-site handling that already exists and is relevant to Firefox:

- `chrome.identity.getAuthToken` does not exist in Firefox. `getAuthToken()` (`app.js:1223-1233`)
  already checks for it and falls through to `_webAuthFlowToken()` (`launchWebAuthFlow` +
  `getRedirectURL`) when absent — this is the correct cross-browser pattern and needs no change.
- `chrome.topSites` and `chrome.search.query` don't exist in Firefox. Both call sites already
  feature-detect and degrade (empty-state text / URL-open fallback) — see `docs/AUDIT.md` A7.
- `chrome.declarativeNetRequest` (Focus Mode) is supported in Firefox 113+ per the brief's own
  premise — **not independently re-verified against Mozilla's current docs this session**; do
  that before claiming Focus Mode works identically on Firefox in a store listing.
- 2026-10-22: line-numbers above have shifted since this file was first written (new `lib/*.js`
  modules were added earlier in `app.js`) — treat the specific `app.js:NNN` references in this
  file as approximate pointers to re-find by function name, not exact anymore. The underlying
  behavior they describe is unchanged.
- Also fixed this session, independent of Firefox specifically: a couple of `chrome.*`
  references (`FOCUS_RULE_CEILING`'s initializer, Tab Sessions save/restore) weren't guarded the
  same way every other call site is, and would throw if `chrome` were ever genuinely absent. Not
  expected to matter for a real Firefox extension (Firefox's WebExtension `chrome.*` compat
  alias means `chrome` exists there too), but it's now consistent everywhere regardless.

## 4. Build and package commands

```
npm run build:firefox   # -> dist-firefox/ (merged manifest, same JS/CSS as Chromium)
cd dist-firefox && zip -r ../nestpane-v$(node -p "require('../package.json').version")-firefox.zip .
```

Verified on 2026-10-21 (version 2.1.0), re-verified on 2026-10-22 against 2.1.2 (which added the
web dashboard support code — bookmarks store, notification/declarativeNetRequest hardening, web
OAuth for the dashboard only), and once more against 2.1.3 (a same-day security fix to that web
OAuth sign-out flow): `npm run build:firefox` runs cleanly each time, `dist-firefox/manifest.json`
reads the current version and carries the merged `browser_specific_settings`, every other file
matches the Chromium build. The output wasn't zipped or submitted — that's left for the project
owner, per their own request.

## 5. Test procedure for this browser

`web-ext lint` was **not run this session** — `web-ext` isn't installed and installing/running
it against a real Firefox profile wasn't done. This is a real gap, not a pass — do not treat
the clean `eslint` run as a substitute; `web-ext lint` checks Firefox-specific manifest/API
issues `eslint` doesn't know about.

## 6. Submission and deployment steps

Not executed — no AMO account/credentials in this session. If the build is minified (it is,
via `esbuild.transform`, `build.js:141`), AMO's source-code submission requirement likely
applies — not independently confirmed against current AMO policy this session; check before
submitting.

## 7. Known review rejections and how to avoid them

Not applicable — Nestpane has never been submitted to AMO. No history to draw on.

## 8. Rollback procedure

Not applicable — nothing has shipped to AMO yet to roll back from.

## 9. Verification record

| Date | Version | Who | Evidence |
|---|---|---|---|
| 2026-10-21 | 2.1.0 | automated session | `npm run build:firefox` run and confirmed producing a correctly-merged manifest in `dist-firefox/`. `web-ext lint`, AMO submission, and manual Firefox smoke-testing **not performed** — flagged, not silently skipped. |
| 2026-10-22 | 2.1.2 | automated session | `npm run build:firefox` re-run and confirmed clean against the current source; output deleted without zipping/submitting, left for the project owner per their own request. `web-ext lint`, AMO submission, and manual smoke-testing still **not performed**. |
| 2026-10-22 | 2.1.3 | automated session | Re-run once more after the web-dashboard sign-out security fix; `dist-firefox/manifest.json` confirmed reading `2.1.3`, output deleted without zipping/submitting. |
