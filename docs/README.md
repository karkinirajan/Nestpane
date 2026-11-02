# Nestpane documentation

Read the chapters in order. Each one builds on the last.

| # | Chapter | What's inside |
|---|---|---|
| 1 | [Overview](01-overview/) | What the product does and what it asks permission for |
| 2 | [Architecture](02-architecture/) | How the code is organised, the design plan, and the feature registry |
| 3 | [Platforms](03-platforms/) | Per-browser support: Chrome and Chromium browsers, Firefox, Safari, the web dashboard |
| 4 | [Quality](04-quality/) | Audit findings and the last full production-readiness report |
| 5 | [Release](05-release/) | The release runbook, the changelog, and the current project state |

## Chapter contents

### 1. Overview
- [`features.md`](01-overview/features.md): feature inventory
- [`permissions.md`](01-overview/permissions.md): every manifest permission and why it is needed

### 2. Architecture
- [`codebase-discovery.md`](02-architecture/codebase-discovery.md): repo layout, stack, and conventions
- [`plan.md`](02-architecture/plan.md): design-system and product plan
- [`feature-registry.json`](02-architecture/feature-registry.json): machine-readable feature list used by `npm run check-registry`

### 3. Platforms
- [`README.md`](03-platforms/README.md): support matrix (start here)
- [`chrome.md`](03-platforms/chrome.md), [`firefox.md`](03-platforms/firefox.md), [`safari.md`](03-platforms/safari.md), [`dashboard.md`](03-platforms/dashboard.md)

### 4. Quality
- [`audit.md`](04-quality/audit.md): findings from the code audit
- [`v2.2.0-final-report.md`](04-quality/v2.2.0-final-report.md): historical production-readiness report for 2.2.0

### 5. Release
- [`release-runbook.md`](05-release/release-runbook.md): how to build, verify, and ship a release
- [`changelog.md`](05-release/changelog.md): what changed in each version
- [`project-state.md`](05-release/project-state.md): where the project stands now

## Where the other documentation lives

- [`../README.md`](../README.md): repo overview and quick start
- [`../extension/README.md`](../extension/README.md): extension setup, OAuth, build, deploy
- [`../webapp/README.md`](../webapp/README.md): marketing site and web dashboard
