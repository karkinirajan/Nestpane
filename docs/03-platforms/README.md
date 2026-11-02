# Browser support — index

Read in this order: this file → `chrome.md` (primary target, all Chromium browsers) →
`firefox.md` → `safari.md` → `dashboard.md` (the browser-agnostic web version).

## Support matrix

| Browser | Status | Install source | Manifest |
|---|---|---|---|
| Chrome | Shipping (CWS listing; this repo is at 2.1.3, live CWS version still unverified — no dashboard access) | Chrome Web Store | `manifest.json` |
| Edge | Shipping via CWS install | Chrome Web Store (no separate Edge package needed — see `chrome.md`) | `manifest.json` |
| Brave | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Opera | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Vivaldi | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Arc | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Firefox | Buildable (`npm run build:firefox`), **not submitted** — left for the project owner to finish (AMO account, `web-ext lint`, actual submission) | AMO (Mozilla Add-ons) | `manifest.json` + `manifest.firefox.json` delta |
| Safari | **Blocked in this environment** — Safari Web Extensions require Xcode conversion (`safari-web-extension-converter`), which needs a macOS host; left for the project owner | App Store Connect | Not started |
| Any browser, no install | **New** — `nestpane.kneeraazon.com/dashboard/`, a plain web page running the same `app.js`/`lib/*.js` as the extension. See `dashboard.md`. | N/A (it's a web page) | N/A |

Every browser-behavior claim in `chrome.md`/`firefox.md`/`safari.md`/`dashboard.md` is either
cited to an official doc, or explicitly marked "not verified this session" — none are from
memory alone, per the brief's rule.
