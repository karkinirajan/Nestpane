# Project State — 2026-11-02

| Area | Status | Notes |
|---|---|---|
| **Version** | 3.1.0 | `extension/manifest.json` and `extension/package.json` agree; package `extension/nestpane-v3.1.0-chrome.zip` (SHA-256 in `release-runbook.md`). |
| **Google sign-in persistence** | Fixed, verified with Google stubbed | Root cause (saves writing `googleUser: null` before the login was loaded) reproduced on the 2.2.0 code and fixed; silent token refresh, cross-tab sign-out, and refusal handling checked in a headless browser. Not exercised against live Google. |
| **Theme dropdown** | Done, verified | All six themes selectable by mouse and keyboard; persisted across reloads. |
| **Sidebar CRUD and drag-and-drop** | Done, verified | Group and link add/edit/delete, URL editing, reorder, and moves between groups checked in a headless browser, on both source and minified `dist/`. |
| **Responsive layout** | Done for ≥ 640 px | No horizontal overflow at 640/768/1024/1280/1536/1920 px across 11 views; sidebar folds to an icon rail below 900 px. Below 640 px is out of scope. |
| **Unit tests** | 65/65 passing | `npm test` in `extension/`. |
| **Lint** | Clean | `npm run lint`, exit 0, no warnings (now also covers `scripts/` and `tests/`). |
| **Feature-registry gate** | Still failing (pre-existing) | `npm run check-registry` reports 12 problems: most registered features have no unit tests mapped. The new `sidebar-customization` entry is fully mapped. |
| **Chrome Web Store upload** | Pending — manual step | Needs the project owner to upload the zip in the Developer Dashboard. |
| **Web dashboard silent sign-in** | Pending — unverified against live Google | The iframe `prompt=none` flow relies on Google allowing it for the dashboard's OAuth client; if refused, the account stays signed in and shows Connect Drive. |
