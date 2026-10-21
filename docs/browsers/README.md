# Browser support — index

Read in this order: this file → `chrome.md` (primary target, all Chromium browsers) →
`firefox.md` → `safari.md`.

## Support matrix

| Browser | Status | Install source | Manifest |
|---|---|---|---|
| Chrome | Shipping (CWS listing, v2.0.1 live per repo; 2.1.0 pending Gate C) | Chrome Web Store | `manifest.json` |
| Edge | Shipping via CWS install | Chrome Web Store (no separate Edge package needed — see `chrome.md`) | `manifest.json` |
| Brave | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Opera | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Vivaldi | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Arc | Shipping via CWS install | Chrome Web Store | `manifest.json` |
| Firefox | Buildable this session (`npm run build:firefox`), **not submitted** — no AMO account/credentials in this session | AMO (Mozilla Add-ons) | `manifest.json` + `manifest.firefox.json` delta |
| Safari | **Blocked** — Safari Web Extensions require Xcode conversion (`safari-web-extension-converter`), which needs a macOS host. Not available in this session. | App Store Connect | Not started |

Every browser-behavior claim in `chrome.md`/`firefox.md`/`safari.md` is either cited to an
official doc fetched this session, or explicitly marked "not verified this session" — none are
from memory alone, per the brief's rule.
