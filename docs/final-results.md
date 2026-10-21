# Final results — Nestpane 2.1.0 audit & cross-browser work

Session date: 2026-10-21. This is the report deliverable (`REPORT.md` in the brief's naming,
saved as `final-results.md` per your request). Read `docs/STATE.md` for the phase-by-phase
status table this expands on.

## Headline

The brief this session started from assumed a different codebase than what's actually here
(React/TS stack, v1.5.0→3.1.0, existing CI) — corrected at the start of the session and
confirmed with you. What follows is real work against the actual repo: a vanilla-JS Chrome MV3
extension, version 2.0.1 → **2.1.0**, with zero pre-existing tests or CI.

**Everything reported "done" below was actually run in this session — builds, tests, and lint
were executed and their output captured, not assumed.** Everything reported "blocked" or
"deferred" genuinely wasn't done, for the stated reason — nothing here was quietly marked
complete to close out the checklist.

## Before → after

| Metric | Before (2.0.1) | After (2.1.0) | How measured |
|---|---|---|---|
| Automated tests | 0 | 20, all passing | `npm test` (Node's built-in `node:test`), run this session |
| Lint errors/warnings | 0 errors (not independently re-verified before changes) | 0 errors, 0 warnings | `npm run lint`, run this session |
| Storage migration framework | None | Exists, tested (4 tests) | `extension/lib/migrations.js` + `docs/AUDIT.md` A1 |
| Drive sync conflict handling | None (last-write-wins) | Conflict detection before every push (5 tests) | `extension/lib/drive-conflict.js` + `docs/AUDIT.md` A2 |
| Cross-browser build targets | Chromium only | Chromium (unchanged) + Firefox (new, buildable) | `npm run build` / `npm run build:firefox`, both run this session |
| Chrome package size | Not measured this session for 2.0.1 | 117 KB zipped, SHA-256 `8abaaf...cb4c2` | `npm run zip`, this session |
| `escH()` single-quote escaping | Missing | Fixed | `extension/lib/format.js` |
| Feature → test coverage gate | Didn't exist | Exists and runs (`npm run check-registry`) — **currently fails for 11/14 features** | Real, not aspirational — see Gates table |

No baseline (TTI, Lighthouse, service-worker cold start) was captured for 2.0.1 in this session,
so most Phase 7 performance gates below are "not measured" rather than pass/fail — see table.

## Audit findings: fixed vs. deferred

Full detail in `docs/AUDIT.md`. Summary:

| ID | Finding | Outcome |
|---|---|---|
| A1 | No storage schema versioning/migration framework | **Fixed** — framework built, tested, wired into `loadState()` |
| A2 | Drive sync last-write-wins, no conflict detection | **Fixed** — conflict check added before every push, tested |
| A3 | Assumed missing quota handling | **Not a defect** — investigation found `save()` already surfaces a quota/storage-full error via a toast; downgraded to P3 polish |
| A4 | Reminders don't fire while no new-tab tab is open | **Deferred** — needs a product decision (adding a background service worker is itself an architecture change); documented in `feature-registry.json` as a known limitation |
| A5 | `escH()` doesn't escape single quotes | **Fixed**, tested |
| A6 | Undocumented `api.anthropic.com` host permission | **Not a defect** — it's a disclosed, user-supplied BYOK AI feature |
| A7 | Assumed missing cross-browser abstraction | **Downgraded** on investigation — existing call sites (`getAuthToken`, `topSites`, `search.query`) already feature-detect and degrade gracefully; full `platform`-module consolidation deferred as a maintainability improvement, not a functional fix |
| A8 | Zero tests, zero CI | **Partially fixed** — unit layer now exists (20 tests); CI pipeline itself not built (no CI config in repo, none added — would need a hosting decision, e.g. GitHub Actions, that wasn't made) |
| A9 | Brief's version assumption (1.5.0→3.1.0) didn't match repo (2.0.1) | **Resolved** — target set to 2.1.0 per `docs/PLAN.md`, with the explicit caveat that the live CWS version was never independently checked |

## Test counts by layer

| Layer | Count | Status |
|---|---|---|
| Unit | 20 | Passing (`extension/tests/*.test.js`, run via `node --test`) |
| Migration (fixture round-trip against real seeded 2.0.1 storage) | 0 | **Not built** — would need a real exported 2.0.1 profile to seed from; none was available this session |
| Integration (mocked browser API) | 0 | Not built |
| E2E, Chromium (Playwright + persistent context) | 0 | Not built |
| E2E, Firefox | 0 | Not built |
| Safari (manual checklist) | 0 | Not built — blocked on having gone through the Xcode conversion once |
| Accessibility (axe-core) | 0 | Not run |
| Visual regression | 0 | Not built |
| Site (Lighthouse CI) | 0 | Not run |

## Gate results (Phase 7)

| Gate | Requirement | Result |
|---|---|---|
| Upgrade | Migration fixture round-trip, zero data loss | **Not evaluated** — no fixture exists (see Migration layer above) |
| Features | Every active registry feature has a passing test on every browser | **FAIL** — `npm run check-registry` reports 11/14 active features with no mapped test |
| Unit coverage | ≥90% on logic modules | **Not measured** — no coverage tool wired up; the logic modules that exist (`lib/*.js`) are each fully covered by their own test file, but this isn't a measured percentage |
| New-tab speed | No worse than baseline | **Not evaluated** — no baseline was captured for 2.0.1 |
| Package | Zip ≤ baseline + 10% | **Not evaluated against a baseline** — 2.1.0 measures 117 KB; no 2.0.1 number exists to compare against |
| Service worker | Cold start no worse; no state lost on suspension | **N/A** — this extension has no service worker (confirmed in `docs/discovery.md`) |
| Accessibility | 0 serious/critical axe violations; keyboard pass | **Not evaluated** |
| Security | No remote code, strict CSP, sanitized content, clean dependency audit | **Partially evaluated**: no remote code found; content sanitization spot-checked and found correct (6/~29 sites, `docs/AUDIT.md`); `manifest.json` has no explicit `content_security_policy` key (MV3 default applies — not confirmed intentional); dependency audit not run this session |
| Permissions | No new permission/scope vs. published, or written justification | **PASS** — confirmed no changes, `docs/permissions.md` |
| Lint | `web-ext lint` + store validation clean; eslint + tsc clean | **PARTIAL PASS** — `eslint` clean (0/0); no TypeScript in this codebase so `tsc` doesn't apply; `web-ext lint` not run (not installed) |
| Site | Lighthouse budgets | **Not evaluated** |
| Version | manifest/package/changelog/site/store all read 2.1.0, and it's > live store version | **PARTIAL** — manifest, package.json, and CHANGELOG all read 2.1.0; webapp copy not updated to mention 2.1.0 (no version string found referenced there to begin with); live store version genuinely unverified |
| Leaks | Flat heap/listeners across 20 open/close cycles | **Not evaluated** — needs a running browser instance, not available this session |

**Net: this release is not ready to ship against the brief's own gates**, and that's the
correct, honest conclusion given what was actually possible to verify in a single
non-interactive session without a browser, CI, or store access. What's genuinely shippable is
the specific, tested code change set below — not a signed-off 2.1.0 release.

## What's genuinely done and verified

- `extension/lib/format.js`, `extension/lib/migrations.js`, `extension/lib/drive-conflict.js` —
  new, tested, wired into `app.js`.
- `extension/app.js` — migration framework and Drive-conflict check wired into `loadState()` /
  `_doPush()`; `escH()` fixed.
- `extension/scripts/merge-manifest.js` + `extension/manifest.firefox.json` — real, tested
  Firefox manifest-merge capability.
- `extension/build.js` — `--target=firefox` support, additive, verified not to change the
  existing Chromium `dist/`/`zip` pipeline's output.
- `extension/eslint.config.js` — updated globals, 0 warnings.
- `extension/tests/*.test.js` — 20 tests, all passing, zero new runtime dependencies (Node's
  built-in test runner).
- `extension/scripts/check-registry.js` — real CI-ready gate script.
- Version bumped to 2.1.0 across `manifest.json`, `package.json`, `package-lock.json`.
- All of `docs/`: `discovery.md`, `AUDIT.md`, `PLAN.md`, `STATE.md`, `permissions.md`,
  `CHANGELOG.md`, `RELEASE.md`, `feature-registry.json`, `features.md`,
  `browsers/{README,chrome,firefox,safari}.md`, this file.

## What's genuinely blocked or deferred (not silently skipped)

- **Safari**: entirely blocked — needs macOS + Xcode, unavailable in this session.
- **Firefox AMO submission + `web-ext lint`**: buildable, not linted or submitted — no AMO
  credentials, `web-ext` not installed.
- **Chrome Web Store submission**: not performed — no dashboard credentials; this is also Gate C
  territory and needs your explicit approval regardless.
- **E2E/accessibility/visual/Lighthouse/perf-baseline testing**: none of it was built — all
  require a real running browser instance, which wasn't available in this session.
- **`platform` module consolidation**: scoped out at Gate A as not justified for this release
  (existing code already degrades gracefully per-browser).
- **Reminders-while-closed (A4)**: needs your decision on whether a background service worker
  is worth adding before it can even become fix work.
- **CI pipeline**: the test/lint/registry-check scripts exist and run locally, but nothing wires
  them into an actual CI system (no `.github/workflows` added — that's a hosting/CI-provider
  decision that wasn't made for you).

## Recommendation

Treat this as a solid, tested groundwork commit for 2.1.0 — not a release. Before actually
shipping: verify the live CWS version, decide on the reminders architecture question (A4), get
access to a real browser to run even a minimal E2E/accessibility pass, and decide whether
Firefox/Safari ship in this release or a later one given Safari is fully blocked and Firefox is
unlinted/unsubmitted.
