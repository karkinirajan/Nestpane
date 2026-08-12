# Sidebar Overhaul — Design Spec

Date: 2026-08-11
Status: Approved by user, pending written-spec review

## Summary

Rebuild the sidebar from a hardcoded HTML nav into a fully data-driven,
user-editable structure (add/rename/delete/reorder both groups and their
items), fix two real collapsed-sidebar UX bugs, redesign the extension icon
for the `Nestpane` rebrand, strip personal-preference demo data out of new
installs, and bring the dashboard's widget-visibility system (currently only
covering Notes and Focus Timer) up to also cover Calendar and To-Do.

Existing auth (Google sign-in / Drive sync) and the build/deploy pipeline are
not touched — the new sidebar data lives inside `S.settings`, which is
already fully covered by the existing local-storage save + debounced Drive
push, so "instant backup" of the new structure is inherited for free.

## Goals

- Sidebar groups and their items are both first-class CRUD objects: add,
  rename, delete, reorder. No third level of nesting.
- Remove the Projects, Development, Kanban, and Others groups/links from the
  sidebar. Remaining groups: **Home, Personal, Google, Socials, AI** (plus
  the standalone **Dashboard** link, which isn't a group).
- Each remaining group ships with **at most 3 default items** — lean
  defaults useful to technical and non-technical users alike, not a hard cap
  (users can add more via CRUD).
- New installs: sidebar link groups (Google/Socials/AI) start **empty**;
  Quick Access ships a **small generic starter set** instead of the current
  personal/dev-heavy list.
- Fix the collapsed sidebar so group items are actually reachable (currently
  they are not — see Phase 1) and so the logo doesn't double up with the
  collapse toggle.
- New icon reflecting `llm + lmao + tab` (Concept "Grin Tab", approved).
- Calendar and To-Do widgets get the same show/hide toggle that Notes and
  Focus Timer already have.
- Existing users' current sidebar customizations, links, notes, and all other
  data are preserved via a one-time migration — nothing is deleted from
  installed users, only from the *default seed* used for fresh installs.

## Workspace switcher relocation

The current "Projects" sidebar group secretly does double duty: besides a
bookmark-links list, it's the **only visible UI** for the workspace
switcher (`sidebarWorkspacesList` + New/Manage/Organize buttons) — the
`#workspaceTabs` alternative in `home-content` is `display:none`, dead
code. Deleting "Projects" outright would silently kill the ability to
switch, create, rename, or delete a workspace through the UI (Alt+1–9
would still work blindly, with no visual indicator).

Decision: relocate the workspace switcher into the **topbar**, next to the
search trigger. `renderTabsWorkspaces()` already renders into `#workspaceTabs`
using `S.workspaces`/`S.activeWsId` with click-to-switch and drag-to-reorder
wired up — the fix is markup relocation (move `#workspaceTabs` out of its
`display:none` wrapper into the topbar, move the `newWorkspaceTabBtn` /
`manageWorkspacesBtn` / `smartOrganizeBtn` buttons alongside it) plus new
topbar-appropriate CSS (`.ws-tab` currently has no styling at all, since it
was always hidden). No JS logic changes needed — all handlers are already
id-based. The "Projects" *group* (its accordion header + the
`snavProjectsItems` bookmark-links list) is removed from the sidebar
entirely, same as Development/Kanban/Others.

## Non-goals

- Not changing auth, Drive sync, or the build/zip/deploy scripts.
- Not touching the Kanban board *feature* itself (the board view and its
  data keep working — only its sidebar entry point is removed, per the
  approved "remove from sidebar" decision). It stays reachable from the
  dashboard's To-Do widget, which already reads from the same `S.kanban`
  data.
- Not redesigning the settings panel beyond adding the two new widget
  toggles.

## Current state (for reference)

- `newtab.html` hardcodes 9 sidebar groups/items directly in markup
  (`#sbg-home`, standalone `Kanban` link, `#sbg-dev`, `#sbg-personal`,
  `#sbg-projects`, `#sbg-google`, `#sbg-socials`, `#sbg-others`, `#sbg-ai`).
- Groups like Google/Socials/AI/Dev/Others already render their *items* from
  `S.settings.sbLinks[group]` via `snav*Items` containers — that pattern is
  reused, not reinvented.
- Home and Personal groups' items are static `<a>` tags in HTML, not data.
- `.sidebar { overflow: hidden }` plus `.sidebar-collapsed .sb-group-items {
  max-height: 0 !important }` means clicking a group while collapsed
  silently does nothing — there is no flyout, so items are unreachable, not
  just visually clipped.
- `.sidebar-collapsed .sb-brand` stacks the 22px logo image directly above
  the full-width collapse-toggle button — both remain visible, doubling the
  header height in the narrow rail.
- `S.settings.widgets = { notes, timer }` — Calendar (`#widget-calendar`)
  and the To-Do column (`.kanban-dash-wrap`) have no visibility flag or
  settings row.
- `DEFAULT_WS_DATA(1).quickAccess` and `S.settings.sbLinks.*` are seeded with
  the developer's personal picks (Hamro Patro, Upwork, n8n, Cursor, personal
  notes about "Meeting Notes — Product Sync", etc.) — this is what ships to
  every new install today.
- `icons/favicon.svg` is the old "novatab" nova-burst mark, unrelated to the
  `Nestpane` name.

## Phase 0 — Icon

Replace `icons/favicon.svg` with the approved **Concept A "Grin Tab"**: same
32×32 rounded-square badge convention as today (radius 8, orange→gold
gradient `#fe8019 → #fabd2f`), containing a two-stroke squint-eye + solid
laugh-mouth face. Regenerate `icons/favicon.png`, `icons/icon-16.png`,
`icons/icon-48.png` from the new SVG via `rsvg-convert` (available locally).
No manifest changes needed — file names/paths stay the same.

## Phase 1 — Collapsed sidebar UX fixes

1. **Flyout for collapsed groups.** When `sidebar-collapsed` and a
   `.sb-group-btn` is clicked/hovered, show that group's items in a
   `position: fixed` panel anchored to the right of the icon (same
   `getBoundingClientRect()`-based positioning already used for the
   tooltip system), with `z-index: 250` (above `.main` content, below
   modals/command-palette). This replaces the current dead
   `max-height: 0 !important` behavior — items become genuinely reachable
   instead of just invisible.
2. **Logo/toggle swap.** `.sidebar-collapsed .sb-logo-img { display: none }`
   — only the collapse-toggle button occupies the brand row when collapsed.
   Expanded state is unchanged (logo + name + toggle visible together).

This phase is CSS/JS-only and independent of the data-model rework, so it
ships first and is easy to verify in isolation.

## Phase 2 — Data model

New state shape, `S.settings.sidebar`:

```js
sidebar: [
  {
    id: "home",           // stable string id, never reused
    label: "Home",
    icon: "home",         // key into a small named icon-path lookup (reuses existing inline SVGs)
    items: [
      { id: "bookmarks", label: "Bookmarks", kind: "view", view: "bookmarks", icon: "bookmark" },
      { id: "history",   label: "History",   kind: "view", view: "history",   icon: "history" },
      { id: "downloads", label: "Downloads", kind: "view", view: "downloads", icon: "download" },
    ],
  },
  { id: "personal", label: "Personal", icon: "user", items: [ /* Notes, Journal, Reading Queue */ ] },
  { id: "google",   label: "Google",   icon: "google",  items: [] },
  { id: "socials",  label: "Socials",  icon: "socials", items: [] },
  { id: "ai",       label: "AI",       icon: "ai",      items: [] },
]
```

Two item `kind`s:
- `"view"` — navigates to an internal view (`data-view` target), used for
  built-in features like Bookmarks/History/Notes.
- `"link"` — a plain external URL (`{ id, label, url, icon: "link" }`),
  used for anything the user adds themselves (Google/Socials/AI items).

The standalone `Dashboard` link at the top is not part of this array (it's
not a group) and stays a fixed, non-deletable entry — same for the sidebar
footer (Settings/Insights/Sync), which isn't in scope here.

**Rendering:** `newtab.html`'s `<nav id="sbNav">` becomes a single empty
container; all groups/items render from `S.settings.sidebar` through one
`renderSidebar()` function, replacing the current mix of static HTML +
`snav*Items` dynamic lists. `renderSidebar()` is called on load and after
every CRUD action, same pattern as the existing `renderSidebarFolders()` /
`renderSidebarWorkspaces()` calls.

**Migration** (runs once on load, guarded by a `_sidebarMigrated` flag next
to the existing `_cloudResetDone` flag): if `S.settings.sidebar` doesn't
exist yet, synthesize it from whatever the user currently has —
`sbLinks.google/socials/ai` become that group's items, the static
Home/Personal items become their group's items — so an existing user's
customized links are carried over exactly, never dropped. Projects,
Development, Kanban, and Others entries are *not* carried into the new
array (per the approved decision), but their underlying data
(`S.wsData`, `S.kanban`, any Others links) is left untouched in storage in
case a future feature wants it — only the nav entry disappears.

## Phase 3 — CRUD UI

- **Groups:** an "Edit sidebar" mode (toggled from a new footer or
  brand-row control) reveals per-group rename / delete / drag-to-reorder
  controls, plus an "Add group" action at the bottom of the nav. Deleting a
  group asks for confirmation (matching the existing `showConfirmDialog`-
  style pattern already used for e.g. clearing Quick Access) and moves it to
  `S.trash` rather than a hard delete, consistent with how bookmarks/notes
  deletion already works in this app.
- **Items:** each item gets an edit/delete affordance on hover (reusing the
  existing `.sb-gplus`-style add button already present on every group
  header). Editing a `"link"` item reuses the existing add-link modal
  pattern; editing a `"view"` item only allows rename/reorder/delete (its
  target view can't be changed, but not to be confused with the underlying
  feature being deleted — deleting the sidebar item just removes the nav
  entry, e.g. re-adding "Trash" back to Home is always available from
  "Add item" even though it's not a default).
- No hard 3-item ceiling is enforced in the UI — the "max 3" rule only
  governs what ships by default; the "Add item" picker lists any not-yet-
  added built-in views for that group plus a free-form link option.

## Phase 4 — New-install defaults

- **Home** defaults to Bookmarks, History, Downloads (Tab Sessions and Trash
  drop from the default set but stay addable).
- **Personal** defaults to Notes, Journal, Reading Queue (Habits drops from
  the default set but stays addable).
- **Google, Socials, AI** default to **zero items** — same empty-state
  hint (`No links yet — click + to add`) the "Others" group already uses
  today.
- **Quick Access** ships a small, demographically generic starter set
  instead of the current 38-item dev-heavy list:
  Gmail, Google Calendar, Google Drive, YouTube, Google Maps, Amazon,
  Wikipedia, Reddit, LinkedIn, Netflix (10 items, spanning
  productivity/media/reference/shopping/social — nothing dev-tool-specific).
- `DEFAULT_WS_DATA(1).notes` (the 5 personal demo notes) is emptied to `[]`
  for new installs.
- These changes only affect the `DEFAULT_*` constants used when
  `chrome.storage` is empty (first run) — existing installs are unaffected,
  since `loadState()` only falls back to defaults when no saved data exists.

## Phase 5 — Widget visibility parity

Extend `S.settings.widgets` to `{ notes, timer, calendar, todo }` (from
today's `{ notes, timer }`), add two rows to the Settings → Widgets section
("Calendar Widget", "To-Do Widget"), and extend `applyWidgetVisibility()`
with `show("widget-calendar", w.calendar)` and a `show()` call for the
to-do column (`.kanban-dash-wrap`, currently not id'd for this — needs an
id added, e.g. `#widget-todo` wrapping the existing markup).

## Phase 6 — QA pass

Manual verification checklist before calling this done:
- Every remaining sidebar item (default and newly-added) navigates/opens
  correctly, in both expanded and collapsed states.
- Flyout appears/dismisses correctly on hover and click, doesn't get clipped
  at the viewport bottom edge for the last group.
- Group/item add, rename, delete, reorder all persist across a reload.
- A pre-existing (pre-migration) profile loads with all its current links
  intact and merged into the new structure — no data loss.
- Fresh install (cleared `chrome.storage`) shows the new lean defaults.
- Google sign-in, Drive push/pull, and `npm run build` / `npm run zip` all
  still work unmodified.
- Calendar/To-Do/Notes/Timer widget toggles all show/hide correctly and
  persist.
- New icon renders correctly in `chrome://extensions`, the omnibox/tab strip,
  and the CWS listing size (128px).

## Open items flagged for spec review

- Exact default item picks for Home/Personal (Bookmarks/History/Downloads
  and Notes/Journal/Reading Queue) and the exact 10-item Quick Access
  starter set are my proposal, not something you specified item-by-item —
  easy to swap before or after implementation since they're just seed data.
