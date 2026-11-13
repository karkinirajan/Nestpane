# Versions

What this project is built and tested with, where each version was checked, and what was left alone on purpose. Checked on **2026-11-12**. Where something could not be verified, it says so.

The extension itself has **no runtime dependencies**: everything below is build and test tooling, or a service the extension talks to.

## Runtimes and tooling

| Component | Version | Pinned in | Why this one |
| --- | --- | --- | --- |
| Node.js | 26 (26.13.0 locally, 26.13.1 in CI images) | `extension/.nvmrc`, `extension/package.json` `engines` (`>=22`), `.github/workflows/ci.yml` | Active LTS since 2026-10-28, supported until 2029-04-30 (`nodejs/Release` `schedule.json`). 24 and 22 are in maintenance until 2028-04-30 and 2027-04-30. 20 reached end of life on 2026-04-30; the old README's "Node.js 18 or newer" is gone. |
| npm | 10.9.9 (Node 22), 11.19.1 (Node 24), 11.20.0 (Node 26) | Ships with Node | The lockfile installs with `npm ci` on all three. |
| GitHub Actions | `checkout@v7`, `setup-node@v7`, `upload-artifact@v7` | `.github/workflows/ci.yml` | Latest releases on 2026-11-12 (v7.0.1, v7.1.0, v7.0.2). |

## Where it was actually run

| What | Result |
| --- | --- |
| `npm ci`, `npm test`, `npm run lint`, `npm run build`, both mutation lists, on Node 22.23.5, 24.22.3 and 26.13.1 | 146 tests pass on each; lint clean; build succeeds; 153 of 153 mutants killed. Run in `node:*-slim` containers against a copy of `extension/`. |
| `npm run build:firefox`, `npm run zip` | Succeed. The zip is byte-identical on a second run (same SHA-256). |
| `npm audit --audit-level=high` | Exit 0. |
| The generated web dashboard in Chromium (Playwright) | Loads and renders; all eight `Nestpane*` modules are present; the moved-folder guard works in the minified code. The only console error is a 404 for a Google favicon, one of the third-party requests the README lists. |
| `.github/workflows/ci.yml` | Passes `actionlint`; each step was run locally. **It has not run on GitHub.** |

**Not run:** the unpacked extension inside Chrome (the `chrome.*` APIs, Drive sign-in and sync, notifications, Focus Mode blocking); Firefox; Edge; any AI call with a real key.

## Dependencies (`extension/package-lock.json`)

| Package | Locked | Declared | Used for |
| --- | --- | --- | --- |
| `esbuild` | 0.25.12 | `^0.25.12` | Minifying into `dist/` and `webapp/dashboard/` |
| `eslint` | 10.14.0 | `^10.14.0` | Linting |
| `globals` | 17.14.0 | `^17.14.0` | Browser and Node globals for the ESLint config |

The declared floors equal the versions that were tested, so an install cannot resolve to something this pass did not run.

## Deliberately not upgraded

| Package | Latest seen | Why not |
| --- | --- | --- |
| `esbuild` | 0.28.2 | A new minifier rewrites every generated file in `webapp/dashboard/` and `dist/` for no functional gain, and the minified output can only be fully checked in a real browser with the extension APIs. Do it as its own change. |
| `eslint` to 9 | 9.39.5 | The only fix `npm audit` offers for the advisory below is `--force`, which downgrades ESLint 10 to 9. That trades a current major for a dev-only glob-matching issue. |

## Known advisories (`npm audit`)

| Before | After |
| --- | --- |
| 4: 1 high (`brace-expansion`), 3 moderate | 3, all moderate |

The three that remain are one issue, a `minimatch` denial of service through glob patterns (GHSA-g3hv-75wg-m249), reached through `eslint` and `@eslint/config-array`. It affects only the linter, which reads this repository's own file globs; none of it ships in the extension. CI fails on high or critical advisories (`npm audit --audit-level=high`). **Revisit** when ESLint publishes a release that depends on a fixed `minimatch`.

## Services the extension talks to

| Service | What the code uses | Checked against |
| --- | --- | --- |
| Anthropic Messages API | Model `claude-haiku-4-5-20251001` (`AI_MODEL` in `extension/app.js`), header `anthropic-version: 2023-06-01`, `max_tokens` of 1024 and 2048 | The Claude API reference available on 2026-11-12 (cached 2026-11-03) lists `claude-haiku-4-5-20251001` as **Active**, a previous-generation model with no retirement date. The current Haiku is `claude-haiku-5-5`. `2023-06-01` is still accepted; the newer API version `2026-10-21` is opt-in, and its breaking changes (sampling parameters removed) do not affect these requests. |
| Anthropic browser-access header | `anthropic-dangerous-direct-browser-access: true` on every request | The API's CORS preflight still lists it in `access-control-allow-headers` (checked 2026-11-12). Whether a request without it would be refused was **not determined**: a request with an invalid key is rejected for the key before any origin rule shows. It is harmless to keep, and the extension has host permission for `api.anthropic.com`. |
| Google Drive API v3 | `drive.appdata` scope, one JSON file | Not re-checked in this pass. |

The model default was **not changed**. Moving to `claude-haiku-5-5` would change the cost and behaviour of people's own API keys, and the current ID is not shut down. The model was **not exercised** with a real key.

## Things to watch

- The manifest does not declare `minimum_chrome_version`. Which Chrome release the extension needs was not determined in this pass.
- `webapp/dashboard/` is generated. CI regenerates it and fails if it differs from what is committed.
