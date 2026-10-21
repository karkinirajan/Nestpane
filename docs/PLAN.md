# Plan (Gate A decisions, made autonomously per user instruction to continue through all phases)

Dated 2026-10-21. The user asked to proceed through all phases without further check-ins. These
three decisions were originally slated for Gate A; recorded here with reasoning so they're
auditable, not silently assumed.

## 1. P2/P3 items for this release

- **A5 (escH single-quote gap)** — in. Trivial, zero-risk, one-line fix with a unit test.
- **A7 (platform abstraction + Chromium-only API fallback)** — in, but scoped down. Full
  WXT/Plasmo-style framework migration is not justified (see decision 2). Building a lightweight
  `platform.js` module that wraps the handful of APIs actually used, plus feature-detecting the
  two Chromium-only calls (`chrome.search.query`, `chrome.topSites.get`) so they degrade instead
  of throwing on Firefox/Safari, is in scope for 2.1.0.
- Everything else found in the audit not marked P0/P1 is deferred to a later release; see
  `CHANGELOG.md` deferred section.

## 2. Build tooling for cross-browser

**Decision: Option A** — keep the existing `esbuild`-based `build.js`, add a manifest-merge step
and the thin `platform.js` shim described above.

Reasoning: there is no existing bundler-based framework to migrate *from* (no React, no Vite, no
webpack) and no multi-file component tree — `app.js` is a single file. WXT or Plasmo would be a
net-new framework adoption on top of a from-scratch rewrite, not a migration, for a codebase that
doesn't use any of the patterns those frameworks are built around. That cost isn't justified by
three browser targets' worth of manifest and API differences, which a merge script and a shim
object fully cover. Revisit only if/when the codebase itself grows a component architecture that
would benefit from a bundler-level abstraction.

## 3. Target version

**Decision: 2.1.0.** Live Chrome Web Store version could not be verified in this session (no
dashboard access, no credentials supplied). `manifest.json`/`package.json` both read `2.0.1` in
the repo, which is the only grounded fact available. 2.1.0 is the correct next version *given
that fact* — this is flagged explicitly in `RELEASE.md` as blocked on a manual verification step
before anyone actually bumps and tags: **if the live store version is already ≥ 2.1.0, this
number must be re-derived before release**, not trusted from this document.
