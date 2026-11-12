# Work done: modernisation pass

Done on 2026-11-12 on the local branch `chore/modernize`. Nothing has been pushed, published to the Chrome Web Store, or deployed. This is the plain record: what changed, how each change was checked, what was **not** checked, and what it leaves for you to decide.

## What was wrong, and what changed

| Area | Found | Change |
| --- | --- | --- |
| Bookmark tree | In the web version's bookmark tree, `moveNode` could detach a folder and attach it below itself. The folder was then unreachable from the root, so everything in it vanished; a move into itself made a cycle that `findNode` followed forever. Chrome's own `bookmarks.move` refuses both. | `moveNode` returns `null` and leaves the tree unchanged. No screen reaches this today (the edit dialog moves single bookmarks), so it is a latent defect, now closed. |
| Tests | 65 tests, none of them able to say whether a wrong rule would be noticed. | 146 tests. A second test file per `lib/` module pins the edges. |
| Mutation checks | None. | 153 deliberate bugs in 8 modules (`tests/mutation/`). Against the original tests alone, 68 of them were caught and 85 were not (3 of the 85 concern the new guard, which had no test because it did not exist). All 153 are caught now. Seven further changes were run and confirmed unobservable, and are documented in the list headers. |
| CI | No workflow. | `.github/workflows/ci.yml`: tests on Node 22, 24 and 26; then lint, both mutation lists, both builds, the dashboard check, the audit and the zip. |
| Generated dashboard | `webapp/dashboard/` is generated and the README says to commit it after every change, but nothing checked that it was current. | CI regenerates it and fails if the result differs from what is committed. |
| Node | README and CONTRIBUTING said "Node.js 18 or newer" (end of life), with no pin. | `extension/.nvmrc` is 26; `engines` is `>=22`; run on 22, 24 and 26. |
| Lint | The README said lint "must exit 0 with no warnings", but the script did not enforce it. | `--max-warnings=0`; the mutation scripts are linted too. |
| Dependencies | `npm audit`: 4 advisories, one high. | Refreshed within the declared ranges: 3 moderate remain, dev-only (see `VERSIONS.md`). Floors now equal the tested versions. |
| Versions | Nothing recorded them. | `VERSIONS.md`. |
| Docs | Setup and test instructions out of date; no testing guide. | README, CONTRIBUTING, `extension/README.md` and the pull request template updated; this `docs/` folder added. |

## How it was checked

| Check | Result |
| --- | --- |
| `npm test` | 146 passed on Node 22.23.5, 24.22.3 and 26.13.1 (containers) and 26.13.0 (local) |
| `npm run lint` | clean, zero warnings |
| `npm run test:mutation` | 153 of 153 killed on all three Node versions; each run restores every file |
| Mutation driver checked against itself | The 7 changes documented as unobservable were run and all 7 survived; 2 more that were first assumed unobservable were killed, so they are in the lists |
| `npm run build`, `build:firefox`, `zip` | succeed; the zip is byte-identical when written twice |
| `npm audit --audit-level=high` | exit 0 |
| Dashboard check | Regenerating after the fix changed one file; regenerating again changes nothing; a hand-edited generated file is detected and repaired by regenerating |
| Web dashboard in Chromium | Loads and renders; all eight `Nestpane*` modules present; both unsafe moves return `null` in the minified code, a normal move works. One console error: a 404 from a Google favicon request |
| `.github/workflows/ci.yml` | `actionlint` clean; each step run locally |

## Not checked

- **The workflow on GitHub.** It has not run there.
- **The extension inside Chrome.** Everything that uses `chrome.*`: Drive sign-in and sync, bookmarks, history, notifications, Focus Mode blocking. The web dashboard was loaded in Chromium; the unpacked extension was not.
- **`app.js`, `popup.js`.** They have no automated tests, and this pass added none.
- **AI features.** No request was made to the Anthropic API; there is no key here. The model ID and the browser-access header were checked against documentation and the CORS preflight only (see `VERSIONS.md`).
- **Firefox and Edge.** The Firefox package builds; neither browser was run.

## Decisions for you

1. **The AI model default was not changed.** It is `claude-haiku-4-5-20251001`. The Claude API reference lists it as Active and previous-generation with no retirement date; the current Haiku is `claude-haiku-5-5`. Moving changes the cost and behaviour of people's own API keys, so say if you want it. It is one constant (`AI_MODEL` in `extension/app.js`).
2. **`safeUrl` turns other schemes into a wrong https link.** It only ever returns `http` or `https`, so it is safe, but `chrome://settings` becomes `https://chrome//settings`, `ftp://example.com/file` becomes `https://ftp//example.com/file`, and `mailto:a@b.co` becomes a link to `b.co`. A Quick Access tile for any of these goes nowhere useful. Rejecting them, or keeping chosen schemes, is a product choice, so it is untouched.
3. **`esbuild` stays on 0.25** (0.28.2 is out). A new minifier rewrites every generated file; do it as its own change, with the extension loaded in a browser. Details in `VERSIONS.md`.
4. **Three moderate advisories remain** in the linter's dependencies. The only offered fix downgrades ESLint to 9.
5. **No version bump and no changelog entry.** The fix is not visible to anyone today, and CONTRIBUTING reserves version changes for maintainers.
6. **Nothing is pushed.** To publish: `git push -u origin chore/modernize`. After the first CI run, check the `verify` job's zip artifact before trusting it as a release candidate.
