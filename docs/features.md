# Top 5 selling features — 2.1.0

Selection method (per the brief): scored on user-visible value, differentiation vs. a typical
new-tab extension, demo-ability in <10s, reliability (test evidence), and fit with the
local-first positioning. Scores below are out of 5 each; ties broken toward stronger test
evidence since that's the gate that actually matters at release time.

| Candidate | Value | Differentiation | Demo | Reliability | Fit | Total |
|---|---|---|---|---|---|---|
| **Focus timer + site blocking** | 5 | 4 | 5 | 3 | 5 | 22 |
| **BYOK AI (Ask AI / Smart Organize / briefing)** | 4 | 5 | 4 | 3 | 5 | 21 |
| **Notes with markdown preview** | 4 | 2 | 5 | 4 | 4 | 19 |
| **Optional E2E-encrypted Drive sync** | 4 | 4 | 3 | 4 | 5 | 20 |
| Habit tracking | 3 | 3 | 4 | 2 | 4 | 16 |
| Kanban tasks | 3 | 2 | 4 | 2 | 3 | 14 |
| Journal | 3 | 2 | 3 | 2 | 4 | 14 |
| History/Downloads views | 2 | 1 | 3 | 2 | 3 | 11 |

Top 4 by score, plus Drive sync edges out habit tracking on differentiation+reliability — both
chosen from direct score, not reordered by hand. **Habit tracking is the 5th by raw rank** but
scores close enough to Drive sync that either is defensible; picking Drive sync because its
conflict-detection logic now has direct test evidence (A2 fix) and habit tracking has none.

## 1. Focus timer with real site-blocking

Starts a timed focus session that actually blocks distracting sites via
`declarativeNetRequest`, not just a countdown — most new-tab extensions only show a timer.

- File: `extension/app.js:4771-4920`
- Tests: none yet (flagged in `feature-registry.json`)
- Screenshot: not captured this session — needs a real browser load; see `docs/RELEASE.md`.

## 2. AI features, bring-your-own-key

"Ask AI," Smart Organize, and a daily briefing, powered by the user's own Anthropic API key —
calls go straight from the browser to `api.anthropic.com`, Nestpane's own infra never sees the
key or the content. A direct answer to "is my data going through someone else's server."

- File: `extension/app.js:1485-1560`
- Tests: none yet
- Privacy disclosure: `webapp/privacy.html` §6

## 3. Notes with live markdown preview

Markdown notes rendered safely — the renderer escapes raw text *before* applying any markdown
transform (verified in the audit, `app.js:3798`), so pasted HTML/script can't execute.

- File: `extension/app.js:3798-3986`
- Tests: `escH` (the escaping primitive the renderer is built on) has 3 passing unit tests in
  `extension/tests/format.test.js`; the renderer itself is not yet directly tested.

## 4. Optional end-to-end encrypted Drive sync

Cross-device sync through the user's own Google Drive `appdata` folder (not a Nestpane server),
with an optional passphrase that encrypts the backup before it leaves the device
(`S.settings.e2e`, `app.js:1888`), and now (2.1.0) a conflict check that refuses to let one
device silently overwrite another device's newer changes.

- Files: `extension/app.js:1709-1975`, `extension/lib/drive-conflict.js`
- Tests: 5 passing unit tests in `extension/tests/drive-conflict.test.js`

## 5. Habit tracking

Daily habit grid with streaks, visible directly on the new tab page.

- File: `app.js` (`S.habits` read/write paths — not yet given explicit line-range documentation)
- Tests: none yet

All five screenshots for the store listing are a manual capture step against the built
extension in a real browser — not done in this session (no running browser instance available);
tracked as an open item in `docs/RELEASE.md`.
