## What this changes

<!-- A sentence or two. Link the issue it closes, for example "Closes #12". -->

## Why

<!-- The problem this solves, or the behavior it fixes. -->

## How I tested it

<!-- Browser and version, and what you clicked. Add a screenshot for any UI change. -->

## Checklist

- [ ] `npm test` passes in `extension/`
- [ ] `npm run lint` exits 0 with no warnings
- [ ] `npm run build` succeeds
- [ ] I regenerated the web dashboard (`npm run build:dashboard`) if I changed `app.js`, `lib/`, `style.css` or `newtab.html`
- [ ] New or changed logic has tests, or I explained why not
- [ ] No new runtime dependency, permission, or network request (or I opened an issue and linked it)
- [ ] Stored data keeps working for existing users (a migration is included if the shape changed)
- [ ] Docs updated where behavior changed
