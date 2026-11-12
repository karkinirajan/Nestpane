# 1. Testing and quality

Nestpane has no framework and no runtime dependencies, so its checks are a handful of Node scripts. This chapter says what each one proves, what is not covered, and how to add a module without leaving a gap.

## 1.1 The checks

Run these from `extension/`. CI runs the same commands (`.github/workflows/ci.yml`).

| Command | What it proves | CI job |
| --- | --- | --- |
| `npm test` | The unit tests in `tests/*.test.js` pass (`node --test`) | `test`, on Node 22, 24 and 26 |
| `npm run lint` | ESLint finds nothing, warnings included (`--max-warnings=0`) | `verify` |
| `npm run test:mutation` | Every deliberate bug in `tests/mutation/` makes a test fail | `verify` |
| `npm run build` and `npm run build:firefox` | The sources and manifests validate and minify | `verify` |
| `npm run build:dashboard`, then no change under `webapp/dashboard/` | The committed web version is what the generator produces from the current source | `verify` |
| `npm audit --audit-level=high` | No high or critical advisory in the build tooling | `verify` |
| `npm run zip` | The Web Store package is written (and is byte-identical when written twice) | `verify`, uploaded as an artifact |

A green run is necessary, not sufficient. `app.js` (about 8,800 lines: every screen) has **no automated tests**, and neither do `popup.js` or the `chrome.*` calls. Anything that changes what a screen looks like or does needs a look in a real browser; see [CONTRIBUTING.md](../CONTRIBUTING.md#before-you-open-a-pull-request).

## 1.2 What is tested

The logic that has edge cases lives in `extension/lib/` as small pure modules. Each has two test files: the original, which covers the common path, and `*.edges.test.js`, which pins the edges that mutation testing showed were unchecked.

| Module | What it decides | Tests | Mutants |
| --- | --- | --- | --- |
| `drive-conflict.js` | Push, pull, or conflict when the cloud copy and the local copy differ | 13 + 7 | 13 |
| `snapshots.js` | Which days get a rolling snapshot, and how many are kept | 2 + 11 | 18 |
| `migrations.js` | Moving stored data to the current schema, and rolling back on failure | 4 + 8 | 10 |
| `bookmarks-store.js` | The web version's bookmark tree (stand-in for `chrome.bookmarks`) | 10 + 14 | 21 |
| `wikilinks.js` | `[[links]]` between notes, tasks, bookmarks and journal days, and backlinks | 3 + 18 | 44 |
| `autosave.js` | The debounced, flushable autosave | 9 + 6 | 13 |
| `sidebar-order.js` | Drag-and-drop ordering of sidebar groups and items | 9 + 12 | 22 |
| `format.js` | HTML escaping (`escH`) and URL cleaning (`safeUrl`) | 6 + 5 | 12 |

The build scripts have tests too: `merge-manifest.test.js` (5) and `zip-dist.test.js` (4). `build.js` and `build-dashboard.js` are checked by running them in CI.

## 1.3 Mutation checks

Passing tests only show that the code agrees with them. A mutation check asks the opposite question: if the code were wrong, would a test notice?

`tests/mutation/mutate.mjs` takes a list of mutants. Each one is a plain text substitution in one file: the driver applies it, runs the tests that should catch it, and requires them to fail. It restores the file afterwards.

```bash
npm run test:mutation                         # both lists, about 30 seconds
node tests/mutation/mutate.mjs tests/mutation/content-mutants.mjs wikilinks   # only names containing "wikilinks"
```

The output is one line per mutant, `killed` or `SURVIVED`, then `N/N killed; restored: true`. The exit status is 0 when everything was killed, 1 when a mutant survived or a pattern did not match exactly once, and 2 when the tests already fail before any mutation.

| List | Covers |
| --- | --- |
| `tests/mutation/sync-mutants.mjs` | `drive-conflict`, `snapshots`, `migrations`: the code that decides whether somebody's data is overwritten |
| `tests/mutation/content-mutants.mjs` | `bookmarks-store`, `wikilinks`, `autosave`, `sidebar-order`, `format` |

**Do not edit the working tree while it runs.** The files are changed in place and put back at the end; killing the run half-way can leave a mutant behind (`git diff` will show it, and `git checkout -- extension/lib` restores it).

### A mutant

```js
m("snapshots: the limit may reach zero", SN, snapshots,
  "Math.max(1, maxSnapshots)",   // `old`: must occur exactly once in the file
  "Math.max(0, maxSnapshots)")   // `new`: the deliberate bug
```

`snapshots` is the list of test files to run. **Put the `*.edges.test.js` file in that list**, or the new tests will never run and the mutant will look alive.

### A survivor

A mutant that is not killed means one of two things:

1. **A missing test.** Write one that fails on the mutant and passes on the real code. This is the usual case: the first run of this project's lists left 85 of 153 alive against the original tests, which only exercised the common path.
2. **Behaviour nobody can observe.** A guard that a later check repeats, or a reset the platform already does. Take it out of the list and say why in the list's header comment, as the existing ones do. Check the claim by running the mutant once and confirming it survives: two changes that were first assumed to be unobservable turned out to matter.

Never delete a mutant just because it survives.

## 1.4 Adding a module to `lib/`

1. Register it in the four places listed in [CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-module-to-lib).
2. Write `tests/<module>.test.js`, and `tests/<module>.edges.test.js` for the edges.
3. Add mutants to the matching list under `tests/mutation/`, one per rule the module enforces, with both test files in each mutant's list.
4. Run `npm run test:mutation`. Fix every survivor or document it.
5. Run `npm run build:dashboard` and commit the regenerated `webapp/dashboard/`.

## 1.5 When CI fails

| Failure | Meaning | Fix |
| --- | --- | --- |
| `test` fails on one Node version only | Something relies on behaviour that differs between Node 22, 24 and 26 | Reproduce with that version (`nvm use 22`, or `docker run node:22`) |
| `Lint` | A warning counts as a failure | Fix it; do not add a disable comment without a reason |
| `Mutation checks`: `SURVIVED` | A test that should have failed did not | See 1.3 |
| `Mutation checks`: `PATTERN?` | A mutant's `old` text no longer occurs exactly once, usually after the source was edited | Update the mutant |
| `webapp/dashboard is out of date` | `app.js`, `lib/`, `style.css` or `newtab.html` changed without regenerating | `npm run build:dashboard`, commit the result |
| `npm audit` | A high or critical advisory in a dev dependency | Upgrade it; the known moderate ones are listed in [VERSIONS.md](../VERSIONS.md) |
