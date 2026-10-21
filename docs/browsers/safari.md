# Safari

**Blocked this session — no macOS host available.** Everything below is planning, not
execution; none of it was run or verified against a real Safari install.

## 1. Support matrix and minimum versions

Safari Web Extensions require macOS + Xcode for packaging. Minimum supported Safari version not
researched this session — needs a dedicated pass against current Apple Developer docs before
committing to a floor.

## 2. Manifest delta from the shared base

Not created. Safari Web Extensions are generated from a web-extension manifest via Apple's
`safari-web-extension-converter` CLI (part of Xcode command-line tools), which produces an Xcode
project rather than consuming a plain delta-merged `manifest.json` the way Firefox does. A
`manifest.safari.json` delta file may still be useful as input to that converter, but designing
it requires actually running the converter once to see what it expects — not done this session.

## 3. API differences and how the `platform` module handles each

Known from general Safari Web Extension documentation (not independently re-verified against
current Apple docs this session):

- No service worker — Nestpane already has none, so this isn't a new constraint.
- `chrome.identity.getAuthToken` doesn't exist — `getAuthToken()`'s existing
  `launchWebAuthFlow` fallback (`app.js:1223-1233`) should apply, but has never been tested
  against Safari's actual `launchWebAuthFlow`/redirect-URL behavior.
- `chrome.topSites`, `chrome.search.query`, `chrome.downloads` are not expected to exist on
  Safari — the topSites/search call sites already degrade gracefully (`docs/AUDIT.md` A7); the
  Downloads *view* (`app.js:3609-3648`) has not been audited for a Safari-specific fallback.
- `declarativeNetRequest` support/limits on Safari — not researched this session.

## 4. Build and package commands

Not available — requires `xcrun safari-web-extension-converter` on macOS, which this session's
Linux environment cannot run.

## 5. Test procedure for this browser

Not available for the same reason. The brief calls for "a manual checklist... with a recorded
result" when scripted testing isn't possible — that checklist isn't written yet either, because
writing a meaningful one requires having gone through the conversion once to know what to check.

## 6. Submission and deployment steps

Not available — needs App Store Connect access and a signed build, neither available here.

## 7. Known review rejections and how to avoid them

Not researched this session.

## 8. Rollback procedure

Not applicable — nothing has ever shipped to Safari.

## 9. Verification record

| Date | Version | Who | Evidence |
|---|---|---|---|
| 2026-10-21 | — | automated session | **No verification performed.** This entire file is unexecuted planning, explicitly marked as such per the "no silent skips" rule rather than presented as done. |
