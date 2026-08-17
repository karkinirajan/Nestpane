# Nestpane

A local-first new tab dashboard for Chrome, plus its marketing/legal site. This repo holds two independently-built projects:

- **[`extension/`](extension/)** — the Chrome extension itself (Manifest V3). See [`extension/README.md`](extension/README.md) for setup, development, OAuth configuration, and Chrome Web Store deployment.
- **[`webapp/`](webapp/)** — the static site deployed to Netlify (`nestpane.netlify.app`): landing page, privacy policy, and terms of service that the OAuth consent screen and CWS listing link to.

They share no build step, dependencies, or version number — build and deploy each from its own folder.
