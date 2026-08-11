# Sidebar Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the hardcoded, personal-preference-laden sidebar into a lean, fully CRUD-able (add/rename/delete/reorder groups and items), collapsed-state-correct nav, ship a new icon, and give Calendar/To-Do the same show/hide toggle Notes/Timer already have — without touching auth, sync, or the build pipeline.

**Architecture:** Replace the sidebar's hardcoded HTML groups with a single `S.settings.sidebar` array rendered by one `renderSidebar()` function. A one-time migration synthesizes that array from each existing user's current links so nothing is lost. The workspace switcher (currently secretly living inside the doomed "Projects" group) relocates to the topbar. Two independent CSS/JS bugs (collapsed-group flyout, logo/toggle overlap) are fixed first since they don't depend on the data-model rewrite.

**Tech Stack:** Vanilla JS (`app.js`, ~10.7k lines, no framework), static HTML (`newtab.html`), hand-written CSS (`style.css`), esbuild for bundling (`build.js`), Chrome MV3 extension APIs (`chrome.storage.local`, Drive sync via existing OAuth flow — untouched).

## Global Constraints

- **No test framework exists in this repo** (`package.json` only has `esbuild`/`eslint` — no jest/vitest/mocha, no DOM testing harness). Every task's "test" step is therefore: (a) `node --check app.js` for a fast syntax sanity check, (b) `npm run build` to confirm esbuild bundles cleanly, and (c) a concrete manual verification in a loaded-unpacked Chrome extension (exact clicks/expected results given per task). Do not invent a fake unit-test suite that doesn't match how this codebase is actually built and shipped.
- **Sidebar nesting is 2 levels only**: Group → Items. No third level. (Approved design decision.)
- **Reordering is via up/down buttons, not drag-and-drop.** The one existing drag-drop helper (`_addDragDrop` in `app.js:3651`) is hardcoded to workspace-tab dragging (`data-wsid`, calls `reorderWorkspaces` directly) and isn't generic. Building a new generic drag system is unnecessary complexity for what "editable/reorderable" actually requires — up/down buttons are simpler, more robust, and equally accessible.
- **Groups kept:** Home, Personal, Google, Socials, AI (+ the standalone, non-deletable Dashboard link). Development, Kanban, Projects, Others are removed from the sidebar. The Kanban *feature* and workspaces *feature* are not touched — only their old sidebar entry points.
- **Existing user data is never deleted**, only the default seed constants used on a fresh install change. Migration copies data into the new shape; it never discards the old fields.
- Every code change must keep `npm run lint` clean (existing ESLint config, `eslint.config.js`).
- Brand accent colors stay `#fe8019` / `#fabd2f` (used throughout the existing UI and the new icon) — do not introduce a different accent.

---

## File Structure

- `icons/favicon.svg` — rewritten (new mark), `icons/favicon.png`, `icons/icon-16.png`, `icons/icon-48.png` — regenerated from it.
- `newtab.html` — sidebar `<nav>` gutted to an empty render target; topbar gains the relocated workspace switcher; Settings → Widgets gains two rows; new "Add sidebar item" modal markup added.
- `app.js` — new `DEFAULT_SIDEBAR` constant, `S.settings.sidebar` state, `migrateSidebarToDataModel()`, `renderSidebar()` + CRUD functions, collapsed-flyout logic, `renderTopbarWorkspaces()`, widget-visibility extension, trimmed default seed data. Old per-group render functions (`renderSnavAI`, `renderSnavDev`, `renderSnavGoogle`, `renderSnavProjects`, `renderSnavOthers`, `renderSnavSocials`, `_renderSnavLinks`, `_renderSnavGlobalLinks`, `renderSidebarWorkspaces`, `renderTabsWorkspaces`) are deleted along with their call sites once superseded.
- `style.css` — flyout styles, collapsed logo/toggle fix, topbar workspace-pill styles, group/item CRUD affordance styles.

---

## Task 1: New icon assets

**Files:**
- Modify: `icons/favicon.svg`
- Create/Overwrite: `icons/favicon.png`, `icons/icon-16.png`, `icons/icon-48.png`

**Interfaces:**
- Produces: no code interface — pure asset replacement, same file paths `manifest.json` already references (no manifest change needed).

- [ ] **Step 1: Replace the SVG with the approved "Grin Tab" mark**

Overwrite `icons/favicon.svg` entirely with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fe8019"/>
      <stop offset="100%" stop-color="#fabd2f"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <path d="M8.5 14.8 L11.6 11.2 L14.7 14.8" fill="none" stroke="#1d2021" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17.3 14.8 L20.4 11.2 L23.5 14.8" fill="none" stroke="#1d2021" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 17.6 Q16 16.9 23 17.6 Q22 25.2 16 25.2 Q10 25.2 9 17.6 Z" fill="#1d2021"/>
</svg>
```

- [ ] **Step 2: Regenerate the PNG sizes from the new SVG**

Run:
```bash
rsvg-convert -w 128 -h 128 icons/favicon.svg -o icons/favicon.png
rsvg-convert -w 48 -h 48 icons/favicon.svg -o icons/icon-48.png
rsvg-convert -w 16 -h 16 icons/favicon.svg -o icons/icon-16.png
```
Expected: three PNGs written, no errors. Confirm sizes with `file icons/*.png` — each should report the correct pixel dimensions.

- [ ] **Step 3: Visual sanity check**

Run: `npm run build`, then open `dist/newtab.html` (or `newtab.html` directly) in Chrome and confirm the sidebar's top-left logo (`.sb-logo-img`, sourced from `icons/favicon.png`) shows the new laughing-face mark, not the old nova-burst.

- [ ] **Step 4: Commit**

```bash
git add icons/favicon.svg icons/favicon.png icons/icon-16.png icons/icon-48.png
git commit -m "feat: replace novatab icon with llmaotab Grin Tab mark"
```

---

## Task 2: Collapsed sidebar — hide logo, keep only the toggle

**Files:**
- Modify: `style.css:250` (the `.sidebar-collapsed .sb-logo-img` rule)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new (pure CSS).

- [ ] **Step 1: Hide the logo image when collapsed**

In `style.css`, find:
```css
.sidebar-collapsed .sb-logo-img { margin: 12px 0 11px; }
```
Replace with:
```css
.sidebar-collapsed .sb-logo-img { display: none; }
```

- [ ] **Step 2: Manual verification**

Run `npm run build`, load the unpacked `dist/` folder in `chrome://extensions`, open a new tab, click the sidebar collapse toggle (`#sidebarToggleBtn`). Expected: collapsed rail shows only the toggle button in the brand row (no logo above it); expanding again shows logo + brand name + toggle as before.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "fix: hide sidebar logo in collapsed state, keep only the toggle"
```

---

## Task 3: Collapsed sidebar — flyout for group items

Today, collapsing the sidebar sets `.sb-group-items { max-height: 0 !important }`, which permanently hides every group's items with no alternative way to reach them — clicking a group icon toggles internal state but nothing ever becomes visible. This task adds a floating flyout, keyed purely off the existing `.sb-group` / `.sb-group-btn` / `.sb-group-items` classes so it keeps working unchanged after Task 8 rewrites what's *inside* those groups.

**Files:**
- Modify: `style.css` (add flyout styles near the existing `.sidebar-collapsed` rules, after line 301)
- Modify: `app.js:3595` (`initSidebarTabs`)

**Interfaces:**
- Consumes: `S.settings.sidebarCollapsed` (existing boolean), the `.sb-group` / `.sb-group-btn` / `.sb-group-items` DOM structure (existing today, unchanged by this task).
- Produces: no new state. Existing `initSidebarTabs()` behavior for the expanded case is preserved exactly.

- [ ] **Step 1: Add flyout CSS**

In `style.css`, after the block ending `.sidebar-collapsed .sb-group-items { max-height: 0 !important; }` (line 301), add:

```css
/* Collapsed-sidebar flyout: shows a group's items in a floating panel
   instead of the dead max-height:0 accordion. */
.sb-flyout {
  position: fixed;
  z-index: 250;
  min-width: 190px;
  max-width: 260px;
  background: var(--surface);
  border: 1.5px solid var(--border-2);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 28px rgba(0,0,0,.35);
  padding: 6px;
  display: none;
  flex-direction: column;
  gap: 1px;
}
.sb-flyout.open { display: flex; }
.sb-flyout-title {
  font-size: var(--ty-caption);
  font-weight: var(--fw-bold);
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 6px 8px 4px;
}
```

- [ ] **Step 2: Build the flyout in `initSidebarTabs()`**

In `app.js`, replace the whole `initSidebarTabs` function (currently lines 3595–3606):

```js
function initSidebarTabs() {
  const flyout = document.createElement("div");
  flyout.className = "sb-flyout";
  flyout.id = "sbFlyout";
  document.body.appendChild(flyout);
  let flyoutGroup = null;

  function closeFlyout() {
    flyout.classList.remove("open");
    flyoutGroup = null;
  }

  function openFlyout(group, btn) {
    const itemsEl = group.querySelector(".sb-group-items");
    if (!itemsEl) return;
    flyout.innerHTML =
      `<div class="sb-flyout-title">${escH(btn.dataset.tip || "")}</div>` +
      itemsEl.innerHTML;
    const rect = btn.getBoundingClientRect();
    flyout.style.left = rect.right + 8 + "px";
    flyout.style.top = Math.min(
      rect.top,
      window.innerHeight - flyout.offsetHeight - 12,
    ) + "px";
    flyout.classList.add("open");
    flyoutGroup = group;
  }

  document.querySelectorAll(".sb-group-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".sb-group");
      if (S.settings.sidebarCollapsed) {
        if (flyoutGroup === group) closeFlyout();
        else openFlyout(group, btn);
        return;
      }
      const isOpen = group.classList.contains("open");
      document
        .querySelectorAll(".sb-group")
        .forEach((g) => g.classList.remove("open"));
      if (!isOpen) group.classList.add("open");
    });
  });

  document.addEventListener("click", (e) => {
    if (flyoutGroup && !flyout.contains(e.target) && !e.target.closest(".sb-group-btn")) {
      closeFlyout();
    }
  });
  document.addEventListener("scroll", closeFlyout, true);
}
```

Note: the flyout clones `itemsEl.innerHTML`, so clicks on `<a data-view>` / `.sb-link-main` links inside it work exactly as they do in the expanded accordion (same elements, same delegated listeners on `document`) — nothing else needs to change for links to remain clickable. The one thing that won't carry over automatically is item-level CRUD hover buttons added in Task 10 unless they're delegated at the `document` level too; Task 10 uses delegated listeners for exactly this reason (see its Interfaces note).

- [ ] **Step 3: Manual verification**

Build and load unpacked, collapse the sidebar, click the "Personal" group icon. Expected: a floating panel appears to the right of the icon listing Notes/Journal/etc., clicking an item navigates correctly, clicking elsewhere closes the flyout. Click a *different* group icon while one flyout is open — expected: the old one closes, the new one opens (not both stacked).

- [ ] **Step 4: Commit**

```bash
git add app.js style.css
git commit -m "fix: collapsed sidebar groups now open a flyout instead of nothing"
```

---

## Task 4: Widget visibility parity — Calendar and To-Do toggles

**Files:**
- Modify: `newtab.html:958-968` (Settings → Widgets section)
- Modify: `newtab.html:452-466` (To-Do section — needs a wrapper id to toggle)
- Modify: `app.js:1328-1331` (default `widgets` state)
- Modify: `app.js:7780-7781` and `7808-7809` (`openSettings`/`saveSettings`)
- Modify: `app.js:7897-7905` (`applyWidgetVisibility`)

**Interfaces:**
- Consumes: existing `S.settings.widgets` object, existing `applyWidgetVisibility()` call sites (unchanged — still called from `saveSettings()` and boot).
- Produces: `S.settings.widgets.calendar` and `S.settings.widgets.todo` booleans, read by `applyWidgetVisibility()`.

- [ ] **Step 1: Give the To-Do column an id**

In `newtab.html`, find the To-Do column opening tag (around line 452):
```html
<div class="kanban-dash-wrap">
```
Replace with:
```html
<div class="kanban-dash-wrap" id="widget-todo">
```

- [ ] **Step 2: Add the two settings rows**

In `newtab.html`, inside the existing Widgets `settings-section` (lines 958-968), add two rows before the closing `</div>` of that section — the full block becomes:

```html
<div class="settings-section">
  <div class="settings-section-title">Widgets</div>
  <div class="settings-row">
    <div class="settings-label"><span>Calendar Widget</span></div>
    <label class="switch"><input type="checkbox" id="widgetCalendarToggle" checked><span class="slider"></span></label>
  </div>
  <div class="settings-row">
    <div class="settings-label"><span>Notes Widget</span></div>
    <label class="switch"><input type="checkbox" id="widgetNotesToggle" checked><span class="slider"></span></label>
  </div>
  <div class="settings-row">
    <div class="settings-label"><span>To-Do Widget</span></div>
    <label class="switch"><input type="checkbox" id="widgetTodoToggle" checked><span class="slider"></span></label>
  </div>
  <div class="settings-row">
    <div class="settings-label"><span>Focus Timer Widget</span></div>
    <label class="switch"><input type="checkbox" id="widgetTimerToggle" checked><span class="slider"></span></label>
  </div>
</div>
```

- [ ] **Step 3: Extend default widget state**

In `app.js`, find (line 1328):
```js
    widgets: {
      notes: true,
      timer: true,
    },
```
Replace with:
```js
    widgets: {
      notes: true,
      timer: true,
      calendar: true,
      todo: true,
    },
```

- [ ] **Step 4: Wire the new toggles into open/save**

In `app.js`, in `openSettings()` (line 7780), after:
```js
  el("widgetNotesToggle").checked = S.settings.widgets.notes !== false;
  el("widgetTimerToggle").checked = S.settings.widgets.timer !== false;
```
add:
```js
  el("widgetCalendarToggle").checked = S.settings.widgets.calendar !== false;
  el("widgetTodoToggle").checked = S.settings.widgets.todo !== false;
```

In `saveSettings()` (line 7808), after:
```js
  S.settings.widgets.notes = el("widgetNotesToggle").checked;
  S.settings.widgets.timer = el("widgetTimerToggle").checked;
```
add:
```js
  S.settings.widgets.calendar = el("widgetCalendarToggle").checked;
  S.settings.widgets.todo = el("widgetTodoToggle").checked;
```

- [ ] **Step 5: Apply visibility**

In `app.js`, in `applyWidgetVisibility()` (line 7897), after:
```js
  show("widget-notes", w.notes);
  show("widget-timer", w.timer);
```
add:
```js
  show("widget-calendar", w.calendar);
  show("widget-todo", w.todo);
```

- [ ] **Step 6: Manual verification**

Run `node --check app.js` (expect no output = valid syntax), `npm run build`, load unpacked. Open Settings, toggle "Calendar Widget" off, save. Expected: the calendar widget disappears from the dashboard. Toggle "To-Do Widget" off, save. Expected: the To-Do column disappears. Toggle both back on — both reappear. Reload the extension — both states persist.

- [ ] **Step 7: Commit**

```bash
git add app.js newtab.html
git commit -m "feat: add Calendar and To-Do widget visibility toggles"
```

---

## Task 5: Sidebar data model — constant, state, icon lookup

**Files:**
- Modify: `app.js` (add near `DEFAULT_WORKSPACES`, around line 370)
- Modify: `app.js:1332` (add `sidebar` to `S.settings`)

**Interfaces:**
- Produces:
  - `DEFAULT_SIDEBAR` — array of `{ id, label, icon, items: [{id, label, icon, kind, view?, url?}] }`.
  - `SB_ICONS` — `{ [iconKey]: svgInnerMarkupString }` lookup, consumed by `renderSidebar()` (Task 8) and the group/item "choose an icon" pickers (Task 9/10).
  - `S.settings.sidebar` — the live, mutated-by-CRUD array; same shape as `DEFAULT_SIDEBAR`.

- [ ] **Step 1: Add the icon lookup table**

In `app.js`, directly above `const DEFAULT_WORKSPACES = [...]` (line 370), add:

```js
// ===== SIDEBAR ICON LOOKUP =====
// Inner <svg> markup (no outer <svg> tag) for each icon key, reused by
// renderSidebar() and the group/item icon pickers. Paths are lifted
// verbatim from the icons that used to be hardcoded per-group in
// newtab.html, so the visual language doesn't change.
const SB_ICONS = {
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  google: '<path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M12 12h6.5"/><path d="M12 7v5"/>',
  socials: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  ai: '<path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>',
  bookmark: '<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  sessions: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  notes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  journal: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  reading: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  habits: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6"/><path d="M14 11a5 5 0 0 0-7.07 0L5.5 12.4a5 5 0 0 0 7.07 7.07L14 18"/>',
};
```

- [ ] **Step 2: Add `DEFAULT_SIDEBAR`**

Directly below the `SB_ICONS` block (still above `DEFAULT_WORKSPACES`), add:

```js
// Default sidebar shown on a fresh install. Kept lean on purpose — Google/
// Socials/AI ship empty (users add their own links); Home/Personal ship 3
// broadly-useful items each. Item ids are stable strings so migration and
// "already added" checks can key off them.
const DEFAULT_SIDEBAR = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    items: [
      { id: "bookmarks", label: "Bookmarks", icon: "bookmark", kind: "view", view: "bookmarks" },
      { id: "history", label: "History", icon: "history", kind: "view", view: "history" },
      { id: "downloads", label: "Downloads", icon: "download", kind: "view", view: "downloads" },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    icon: "user",
    items: [
      { id: "notes", label: "Notes", icon: "notes", kind: "view", view: "notes" },
      { id: "journal", label: "Journal", icon: "journal", kind: "view", view: "journal" },
      { id: "reading", label: "Reading Queue", icon: "reading", kind: "view", view: "reading" },
    ],
  },
  { id: "google", label: "Google", icon: "google", items: [] },
  { id: "socials", label: "Socials", icon: "socials", items: [] },
  { id: "ai", label: "AI", icon: "ai", items: [] },
];

// Every "view" kind item that isn't in DEFAULT_SIDEBAR by default but is
// still a real internal view a user might want to add back (Task 9's "Add
// item" picker offers these plus a free-form link option).
const SIDEBAR_ADDABLE_VIEWS = [
  { view: "sessions", label: "Tab Sessions", icon: "sessions" },
  { view: "trash", label: "Trash", icon: "trash" },
  { view: "habits", label: "Habits", icon: "habits" },
];
```

- [ ] **Step 3: Add `sidebar` to the live settings state**

In `app.js`, find the settings object (line 1332, right after `sidebarCollapsed: false,`):
```js
    sidebarCollapsed: false,
```
Replace with:
```js
    sidebarCollapsed: false,
    sidebar: null, // populated by migrateSidebarToDataModel() on first load after this update, or DEFAULT_SIDEBAR on a fresh install
```

- [ ] **Step 4: Verify**

Run `node --check app.js`. Expected: no output (valid syntax). This task only adds constants/state — no behavior change yet, so no browser check is meaningful until Task 6/8 land.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: add sidebar data model constants (DEFAULT_SIDEBAR, SB_ICONS)"
```

---

## Task 6: Migration — synthesize `S.settings.sidebar` for existing users

**Files:**
- Modify: `app.js` (add new function near other `migrate*` functions, e.g. after `migrateAddSocials` — search for `function migrateAddSocials`)
- Modify: `app.js:1436-1439` (boot sequence, where `migrateAddSocials()` etc. are called)

**Interfaces:**
- Consumes: `S.settings.sbLinks.{google,socials}` (existing), `S.wsData[2].quickAccess` (existing AI workspace quick access — copied, not moved), `DEFAULT_SIDEBAR` (Task 5).
- Produces: `S.settings.sidebar` populated exactly once; safe to call on every boot (no-ops if already migrated).

- [ ] **Step 1: Write the migration function**

Add this function in `app.js`, near the other `migrate*` functions:

```js
// One-time: build S.settings.sidebar from whatever the user already has, so
// existing customizations (Google/Socials links, AI tool links) survive the
// move to the new data-driven sidebar. Safe to call every boot — it's a
// no-op once S.settings.sidebar exists. AI items are COPIED from the AI
// workspace's quick access (S.wsData[2].quickAccess), not moved — that
// workspace's own dashboard quick-access grid is untouched.
function migrateSidebarToDataModel() {
  if (S.settings.sidebar) return;

  const toLinkItems = (links) =>
    (links || []).map((l) => ({
      id: `link-${l.id}`,
      label: l.name,
      url: l.url,
      icon: "link",
      kind: "link",
    }));

  const hasAnyExistingLinks =
    (S.settings.sbLinks?.google?.length || 0) > 0 ||
    (S.settings.sbLinks?.socials?.length || 0) > 0 ||
    (S.wsData?.[2]?.quickAccess?.length || 0) > 0;

  if (!hasAnyExistingLinks) {
    // Fresh install (or nothing worth carrying over) — just use the default.
    S.settings.sidebar = JSON.parse(JSON.stringify(DEFAULT_SIDEBAR));
    return;
  }

  S.settings.sidebar = JSON.parse(JSON.stringify(DEFAULT_SIDEBAR));
  const byId = Object.fromEntries(S.settings.sidebar.map((g) => [g.id, g]));
  if (byId.google) byId.google.items = toLinkItems(S.settings.sbLinks?.google);
  if (byId.socials) byId.socials.items = toLinkItems(S.settings.sbLinks?.socials);
  if (byId.ai) byId.ai.items = toLinkItems(S.wsData?.[2]?.quickAccess);
}
```

- [ ] **Step 2: Call it during boot**

In `app.js`, find the boot sequence (line 1436-1439):
```js
  await loadState();
  migrateAddSocials();
  migrateSyncSbLinksToQA();
  migrateAddWorkspaceContent();
```
Add the new call right after `migrateAddSocials()`:
```js
  await loadState();
  migrateAddSocials();
  migrateSidebarToDataModel();
  migrateSyncSbLinksToQA();
  migrateAddWorkspaceContent();
```

- [ ] **Step 3: Manual verification**

Run `node --check app.js`, `npm run build`. In Chrome devtools console (on the extension's new tab page), run `chrome.storage.local.get(null, console.log)` before and after a reload to confirm a `settings.sidebar` array now exists matching `DEFAULT_SIDEBAR`'s shape. For an install with existing Google/Socials/AI links already saved (simulate by manually seeding `chrome.storage.local` via devtools with a fake `sbLinks.google` entry before reload, if no real existing profile is available), confirm those links land in `S.settings.sidebar` under the matching group after reload, and that `S.settings.sbLinks.google` / `S.wsData[2].quickAccess` are still present afterward (nothing deleted).

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: migrate existing sidebar links into the new data model"
```

---

## Task 7: Relocate the workspace switcher to the topbar

**Files:**
- Modify: `newtab.html:301-325` (topbar) and `newtab.html:130-161` (old Projects group — buttons/list move out of here; the group itself is deleted in Task 8)
- Modify: `app.js` — replace `renderSidebarWorkspaces()` (line 3370) and `renderTabsWorkspaces()` (line 3686) with one `renderTopbarWorkspaces()`; update call sites.
- Modify: `style.css` — new `.topbar-ws*` rules (there is currently no styling at all for `.ws-tab`, since it was always hidden).

**Interfaces:**
- Consumes: `S.workspaces`, `S.activeWsId` (existing), `setActiveWorkspace(wsId)` (existing, `app.js:3331`, unchanged signature).
- Produces: `renderTopbarWorkspaces()` — replaces both old render functions; called from every place they used to be called.

- [ ] **Step 1: Move the switcher markup into the topbar**

In `newtab.html`, in the `<header class="topbar">` (starts line 301), right after the `search-trigger` button and before `<div class="topbar-actions">`, add:

```html
    <div class="topbar-ws" id="topbarWorkspaces">
      <div class="topbar-ws-list" id="topbarWorkspacesList"></div>
      <button class="topbar-ws-btn" id="newWorkspaceTabBtn" data-tip="New Workspace">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button class="topbar-ws-btn" id="manageWorkspacesBtn" data-tip="Manage Workspaces">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <button class="topbar-ws-btn" id="smartOrganizeBtn" data-tip="Smart Organize open tabs with AI">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M18.4 5.6l-2.1 2.1m-8.6 8.6-2.1 2.1"/></svg>
      </button>
      <button id="addWorkspaceBtn" style="display:none"></button>
    </div>
```

Now delete the old copies of these four buttons from inside the Projects group (lines 144-158 — the `sidebarWorkspacesList` div, the `flex-wrap` button row with `newWorkspaceTabBtn`/`manageWorkspacesBtn`/`smartOrganizeBtn`, and the hidden `addWorkspaceBtn`). The whole `#sbg-projects` group is deleted in Task 8 anyway; if Task 8 hasn't landed yet in your working tree, just remove these specific child elements now so there are no duplicate ids (duplicate ids would make `el(id)` grab the wrong element).

- [ ] **Step 2: Replace the two old render functions with one**

In `app.js`, delete `renderSidebarWorkspaces()` (line 3370) and `renderTabsWorkspaces()` (line 3686) entirely, and add in their place:

```js
// ===== TOPBAR WORKSPACE SWITCHER =====
// Replaces the old renderSidebarWorkspaces() (which only showed custom
// workspaces, id > 3) and the dead renderTabsWorkspaces() (rendered into a
// display:none container). This shows every workspace, including the 3
// built-in ones, since they previously had no click-to-switch UI at all —
// only Alt+1-9 reached them.
function renderTopbarWorkspaces() {
  const list = el("topbarWorkspacesList");
  if (!list) return;
  list.innerHTML = S.workspaces
    .map(
      (ws) => `
    <button class="topbar-ws-pill ${ws.id === S.activeWsId ? "active" : ""}" data-wsid="${ws.id}" data-tip="${escH(ws.name)}">
      <span class="topbar-ws-icon">${ws.icon}</span>
      <span class="topbar-ws-name">${escH(ws.name)}</span>
    </button>`,
    )
    .join("");
  list.querySelectorAll(".topbar-ws-pill").forEach((btn) => {
    btn.addEventListener("click", () => setActiveWorkspace(btn.dataset.wsid));
  });
}
```

- [ ] **Step 3: Update every call site**

Run `grep -n "renderSidebarWorkspaces()\|renderTabsWorkspaces()" app.js` and replace every call with `renderTopbarWorkspaces()`. Based on the current codebase this touches `setActiveWorkspace()` (line ~3336/3339, collapse the two calls into one `renderTopbarWorkspaces()` call), plus the render-on-load path (~line 3307/3315), plus `reorderWorkspaces()` (~line 3646) and the "add workspace" success handler (~line 3814), and the manage-workspaces list handler (~line 9276). Verify with `grep -n "renderSidebarWorkspaces\|renderTabsWorkspaces" app.js` afterward — expect zero matches.

- [ ] **Step 4: Style the topbar pills**

In `style.css`, add near the existing `.topbar` rules:

```css
.topbar-ws { display: flex; align-items: center; gap: 4px; margin-left: 14px; }
.topbar-ws-list { display: flex; align-items: center; gap: 3px; }
.topbar-ws-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: var(--radius-pill);
  background: none; border: none; color: var(--text-3);
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: background .12s, color .12s;
}
.topbar-ws-pill:hover { background: var(--surface-2); color: var(--text-2); }
.topbar-ws-pill.active { background: var(--accent-bg); color: var(--accent-2); }
.topbar-ws-icon { font-size: 13px; line-height: 1; }
.topbar-ws-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: var(--radius-xs);
  background: none; border: none; color: var(--text-3); cursor: pointer;
  transition: background .1s, color .1s;
}
.topbar-ws-btn:hover { background: var(--surface-2); color: var(--text); }
@media (max-width: 900px) { .topbar-ws-name { display: none; } }
```

- [ ] **Step 5: Manual verification**

Build, load unpacked. Confirm the topbar (next to search) shows pills for Home/AI/Dev plus any custom workspaces, the active one highlighted; clicking a pill switches workspace (dashboard quick access changes); the "+" button opens the new-workspace flow; the manage button opens the existing Manage Workspaces modal; Smart Organize still works. Confirm `Alt+1`...`Alt+9` still switches workspaces and updates the topbar highlight.

- [ ] **Step 6: Commit**

```bash
git add app.js newtab.html style.css
git commit -m "feat: relocate workspace switcher from sidebar to topbar"
```

---

## Task 8: `renderSidebar()` — the core data-driven renderer

This is the task that actually removes Development/Kanban/Projects/Others from the sidebar and makes Home/Personal/Google/Socials/AI render from `S.settings.sidebar` instead of hardcoded HTML.

**Files:**
- Modify: `newtab.html:33-233` (replace the entire `<nav id="sbNav">...</nav>` contents with an empty container)
- Modify: `app.js` — add `renderSidebar()`, delete now-superseded render functions and their call sites.

**Interfaces:**
- Consumes: `S.settings.sidebar` (Task 5/6), `SB_ICONS` (Task 5), the existing `.sb-group`/`.sb-group-btn`/`.sb-group-items`/`.sb-item` CSS classes (unchanged, so Task 3's flyout and all existing `.sidebar-collapsed` CSS keep working against the new markup).
- Produces: `renderSidebar()` — called on load and after every CRUD mutation (Tasks 9/10 call it).

- [ ] **Step 1: Gut the static nav markup**

In `newtab.html`, replace the entire block from `<!-- 0. DASHBOARD — standalone main item -->` (line 36) through the end of `<!-- 8. AI GROUP -->` (line 231) — i.e. everything inside `<nav id="sbNav">` — with just:

```html
      <!-- 0. DASHBOARD — standalone, non-deletable -->
      <a href="#" class="sb-item sb-main-item" data-view="home">
        <svg class="sb-group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span class="sb-group-label">Dashboard</span>
      </a>

      <!-- Data-driven groups render here via renderSidebar() -->
      <div id="sbGroupsContainer"></div>
```

- [ ] **Step 2: Write `renderSidebar()`**

Add to `app.js`, near `renderTopbarWorkspaces()`:

```js
// ===== DATA-DRIVEN SIDEBAR RENDERER =====
function _sbItemInner(item) {
  const icon = SB_ICONS[item.icon] || SB_ICONS.link;
  if (item.kind === "view") {
    return `
    <a href="#" class="sb-item" data-view="${escH(item.view)}" data-sb-item-id="${escH(item.id)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
      <span class="sb-item-label">${escH(item.label)}</span>
    </a>`;
  }
  return `
    <div class="sb-item sb-link-item" data-sb-item-id="${escH(item.id)}" data-tip="${escH(item.label)}">
      <a href="${escH(item.url)}" class="sb-link-main" target="_blank" rel="noopener">
        <img class="sb-fav" src="${favSrc(item.url)}" alt="">
        <span class="sb-item-label">${escH(item.label)}</span>
      </a>
    </div>`;
}

function renderSidebar() {
  const container = el("sbGroupsContainer");
  if (!container || !S.settings.sidebar) return;
  container.innerHTML = S.settings.sidebar
    .map((group) => {
      const icon = SB_ICONS[group.icon] || SB_ICONS.link;
      const itemsHtml = group.items.length
        ? group.items.map(_sbItemInner).join("")
        : `<div class="sb-empty-state">No links yet — click + to add</div>`;
      return `
      <div class="sb-group" id="sbg-${escH(group.id)}" data-sb-group-id="${escH(group.id)}">
        <div class="sb-group-hd">
          <button class="sb-group-btn" data-group="${escH(group.id)}" data-tip="${escH(group.label)}" aria-expanded="false">
            <svg class="sb-group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
            <span class="sb-group-label">${escH(group.label)}</span>
            <svg class="sb-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="sb-gplus" data-addlink="${escH(group.id)}" title="Add link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div class="sb-group-items">${itemsHtml}</div>
      </div>`;
    })
    .join("");
  initSidebarTabs();
  updateSidebarTabActive();
}
```

Note: `initSidebarTabs()` is called again here because it attaches listeners to `.sb-group-btn` elements, which are freshly recreated every render — re-running it is cheap (it just re-queries and re-attaches) and matches how the rest of this codebase already re-runs listener-attaching functions after re-render (e.g. `_addDragDrop` is called fresh inside every `renderSidebarWorkspaces` call today).

- [ ] **Step 3: Wire `data-addlink` to the sidebar's new groups**

Find the existing sidebar "add link" button listener (search for `data-addlink` in `app.js`, around line 9613 per the "Sidebar + (add link) buttons" comment). Confirm it reads `e.target.closest("[data-addlink]").dataset.addlink` and calls `openSbAddLink(group)` — if so, no change needed, since the new `.sb-gplus` buttons carry the same `data-addlink` attribute with the group's `id` (`home`/`personal`/`google`/`socials`/`ai`), and `openSbAddLink`/`saveSbLink` (Task 10) get updated to write into `S.settings.sidebar` instead of `sbLinks`/`wsData`.

- [ ] **Step 4: Call `renderSidebar()` where the old functions used to be called, and delete the superseded functions**

Delete these now-dead functions entirely: `renderSnavAI`, `renderSnavDev`, `renderSnavGoogle`, `renderSnavProjects`, `renderSnavOthers`, `renderSnavSocials`, `_renderSnavLinks`, `_renderSnavGlobalLinks`, `_getSbGlobalLinks`, `removeSbGlobalLink`, `removeSbLink` (all superseded by Task 9/10's item CRUD writing directly to `S.settings.sidebar`).

Run `grep -n "renderSnavAI\|renderSnavDev\|renderSnavGoogle\|renderSnavProjects\|renderSnavOthers\|renderSnavSocials" app.js` and replace every remaining call site with `renderSidebar()`. Also add a `renderSidebar()` call in the main boot sequence right after `migrateSidebarToDataModel()` (Task 6, `app.js:1436-1439` area) and inside `renderAll()` (search for `function renderAll` — add it alongside the existing `renderSidebarWorkspaces()`-turned-`renderTopbarWorkspaces()`/`renderSidebarFolders()` calls there).

- [ ] **Step 5: Delete now-orphaned CSS for removed groups**

In `style.css`, the rule `.sb-folders,.sb-folders-head,.sidebar-folders-wrap,.sidebar-folder-item,.sb-icon-btn { display:none; }` (line 388) and `.sidebar-collapsed #sbg-personal .sb-group-btn { padding-right: 0; }` (line 1600) reference elements/ids tied to the old Projects/folders markup — leave `#sbg-personal` alone (that id still exists), but confirm via `grep -n "sbg-dev\|sbg-projects\|sbg-others\|sidebarWorkspacesList\|snavDevItems\|snavProjectsItems\|snavOthersItems" style.css app.js newtab.html` that nothing still references the removed groups' ids after this task. Clean up any that do.

- [ ] **Step 6: Manual verification**

Run `node --check app.js`, `npm run build`, load unpacked. Confirm: sidebar shows exactly Dashboard, Home, Personal, Google, Socials, AI (no Kanban/Development/Projects/Others). Home shows Bookmarks/History/Downloads and each navigates correctly. Personal shows Notes/Journal/Reading Queue, each navigates correctly. Google/Socials/AI show the empty-state hint on a fresh profile, or carried-over links on a migrated profile (per Task 6's verification). Collapsed-mode flyout (Task 3) still works against these new groups. Clicking a group's `+` opens the add-link modal.

- [ ] **Step 7: Commit**

```bash
git add app.js newtab.html style.css
git commit -m "feat: render sidebar from S.settings.sidebar, remove hardcoded groups"
```

---

## Task 9: Group CRUD — add, rename, delete, reorder

**Files:**
- Modify: `newtab.html` — add an "Edit sidebar" toggle button in `.sb-brand` (next to the collapse toggle) and a small rename-prompt / add-group modal.
- Modify: `app.js` — group CRUD functions.
- Modify: `style.css` — edit-mode affordance styles.

**Interfaces:**
- Consumes: `S.settings.sidebar` (Task 5), `confirm2(title, msg, onOk)` (existing, `app.js:8843`), `showToast` (existing), `renderSidebar()` (Task 8).
- Produces: `S.settings.sidebarEditMode` (boolean, new, transient UI state — not persisted, so it's set directly on `S`, not `S.settings`), `addSidebarGroup()`, `renameSidebarGroup(id, newLabel)`, `deleteSidebarGroup(id)`, `moveSidebarGroup(id, direction)`.

- [ ] **Step 1: Add the edit-mode toggle button**

In `newtab.html`, inside `.sb-brand` (line 23-30), add a new button right before the existing `#sidebarToggleBtn`:

```html
    <button class="sb-edit-btn" id="sbEditModeBtn" data-tip="Edit sidebar" aria-label="Edit sidebar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
```

- [ ] **Step 2: Add group-level edit controls to `renderSidebar()`**

In `app.js`, in `renderSidebar()` (Task 8, Step 2), change the group header template to include rename/delete/reorder controls that only show when `S.sidebarEditMode` is true. Replace:

```js
        <div class="sb-group-hd">
          <button class="sb-group-btn" data-group="${escH(group.id)}" data-tip="${escH(group.label)}" aria-expanded="false">
            <svg class="sb-group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
            <span class="sb-group-label">${escH(group.label)}</span>
            <svg class="sb-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="sb-gplus" data-addlink="${escH(group.id)}" title="Add link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
```

with:

```js
        <div class="sb-group-hd${S.sidebarEditMode ? " sb-group-hd-edit" : ""}">
          <button class="sb-group-btn" data-group="${escH(group.id)}" data-tip="${escH(group.label)}" aria-expanded="false">
            <svg class="sb-group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
            <span class="sb-group-label">${escH(group.label)}</span>
            <svg class="sb-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          ${
            S.sidebarEditMode
              ? `
          <div class="sb-group-edit-actions">
            <button class="sb-icon-mini" data-sb-move-group="${escH(group.id)}" data-dir="up" title="Move up">▲</button>
            <button class="sb-icon-mini" data-sb-move-group="${escH(group.id)}" data-dir="down" title="Move down">▼</button>
            <button class="sb-icon-mini" data-sb-rename-group="${escH(group.id)}" title="Rename">✎</button>
            <button class="sb-icon-mini sb-icon-mini-danger" data-sb-delete-group="${escH(group.id)}" title="Delete group">✕</button>
          </div>`
              : `
          <button class="sb-gplus" data-addlink="${escH(group.id)}" title="Add link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>`
          }
        </div>`;
```

Also add an "Add group" row after the `.map().join("")` in `renderSidebar()` — change the `container.innerHTML = ...` assignment to append it:

```js
  container.innerHTML =
    S.settings.sidebar.map((group) => { /* ...unchanged template body from above... */ }).join("") +
    (S.sidebarEditMode
      ? `<button class="sb-add-group-btn" id="sbAddGroupBtn">+ Add group</button>`
      : "");
```

- [ ] **Step 3: Write the CRUD functions**

Add to `app.js`:

```js
// ===== SIDEBAR GROUP CRUD =====
function toggleSidebarEditMode() {
  S.sidebarEditMode = !S.sidebarEditMode;
  el("sbEditModeBtn")?.classList.toggle("active", S.sidebarEditMode);
  renderSidebar();
}

function addSidebarGroup() {
  const label = prompt("Group name?");
  if (!label || !label.trim()) return;
  const id = `g${Date.now()}`;
  S.settings.sidebar.push({ id, label: label.trim(), icon: "link", items: [] });
  save();
  renderSidebar();
}

function renameSidebarGroup(id) {
  const group = S.settings.sidebar.find((g) => g.id === id);
  if (!group) return;
  const label = prompt("Rename group", group.label);
  if (!label || !label.trim()) return;
  group.label = label.trim();
  save();
  renderSidebar();
}

function deleteSidebarGroup(id) {
  const group = S.settings.sidebar.find((g) => g.id === id);
  if (!group) return;
  confirm2(
    "Delete group?",
    `"${group.label}" and its ${group.items.length} item(s) will be moved to Trash.`,
    () => {
      S.trash.push({ ...group, _type: "sidebarGroup", _deletedAt: Date.now() });
      S.settings.sidebar = S.settings.sidebar.filter((g) => g.id !== id);
      save();
      renderSidebar();
      showToast("Group deleted", "success");
    },
  );
}

function moveSidebarGroup(id, direction) {
  const arr = S.settings.sidebar;
  const idx = arr.findIndex((g) => g.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= arr.length) return;
  [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
  save();
  renderSidebar();
}
```

- [ ] **Step 4: Wire up the click handlers**

In `app.js`, in `setupEventListeners()` (search for `function setupEventListeners`), add near the other sidebar listeners (after the existing `el("sidebarToggleBtn").addEventListener(...)` block):

```js
  el("sbEditModeBtn")?.addEventListener("click", toggleSidebarEditMode);

  // Delegated — sidebar is re-rendered on every CRUD action, so these
  // listeners must be on a stable ancestor (document), not the regenerated
  // buttons themselves.
  document.addEventListener("click", (e) => {
    const addGroupBtn = e.target.closest("#sbAddGroupBtn");
    if (addGroupBtn) return addSidebarGroup();
    const moveBtn = e.target.closest("[data-sb-move-group]");
    if (moveBtn) return moveSidebarGroup(moveBtn.dataset.sbMoveGroup, moveBtn.dataset.dir);
    const renameBtn = e.target.closest("[data-sb-rename-group]");
    if (renameBtn) return renameSidebarGroup(renameBtn.dataset.sbRenameGroup);
    const deleteBtn = e.target.closest("[data-sb-delete-group]");
    if (deleteBtn) return deleteSidebarGroup(deleteBtn.dataset.sbDeleteGroup);
  });
```

- [ ] **Step 5: Style the edit-mode controls**

In `style.css`, add:

```css
.sb-edit-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: var(--radius-xs);
  border: none; background: none; color: var(--text-3); cursor: pointer;
}
.sb-edit-btn:hover, .sb-edit-btn.active { background: var(--surface-2); color: var(--accent-2); }
.sb-group-edit-actions { display: flex; align-items: center; gap: 2px; padding-right: 6px; }
.sb-icon-mini {
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; border: none; background: none; color: var(--text-3);
  font-size: 10px; cursor: pointer;
}
.sb-icon-mini:hover { background: var(--surface-2); color: var(--text); }
.sb-icon-mini-danger:hover { color: #fb4934; }
.sb-add-group-btn {
  margin: 8px 10px 4px; padding: 7px; border-radius: var(--radius-xs);
  border: 1.5px dashed var(--border-2); background: none; color: var(--text-3);
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.sb-add-group-btn:hover { border-color: var(--accent-2); color: var(--accent-2); }
```

- [ ] **Step 6: Manual verification**

Build, load unpacked. Click the new edit-mode button in the brand row. Expected: every group shows ▲▼✎✕ instead of the `+` add-link button. Click "+ Add group", type a name — new empty group appears at the bottom. Click ✎ on a group, rename it — label updates and persists after reload. Click ▲/▼ — group reorders and persists. Click ✕ on a group — confirm dialog appears, confirming deletes it and it's gone after reload; check `chrome.storage.local` (devtools) that it landed in `S.trash` with `_type: "sidebarGroup"`.

- [ ] **Step 7: Commit**

```bash
git add app.js newtab.html style.css
git commit -m "feat: add/rename/delete/reorder CRUD for sidebar groups"
```

---

## Task 10: Item CRUD — add, rename, delete, reorder

**Files:**
- Modify: `app.js` — item CRUD functions, `saveSbLink()`/`openSbAddLink()` rewritten to target `S.settings.sidebar`, "Add item" picker for built-in views.
- Modify: `newtab.html` — extend the existing `sbAddLinkModal` with a small view-picker section, or add a lightweight new modal (see Step 1).
- Modify: `style.css` — item-level edit-mode affordances.

**Interfaces:**
- Consumes: `SIDEBAR_ADDABLE_VIEWS` (Task 5), `S.settings.sidebar`, `openModal`/`closeModal` (existing), `renderSidebar()` (Task 8).
- Produces: `addSidebarLinkItem(groupId, label, url)`, `addSidebarViewItem(groupId, view)`, `renameSidebarItem(groupId, itemId)`, `deleteSidebarItem(groupId, itemId)`, `moveSidebarItem(groupId, itemId, direction)`.

- [ ] **Step 1: Rewrite `openSbAddLink` / `saveSbLink` to target the new model, and add a view picker**

In `app.js`, replace `openSbAddLink` and `saveSbLink` (currently around lines 3527-3560+, search for `function openSbAddLink`) with:

```js
function openSbAddLink(groupId) {
  S._sbAddLinkGroup = groupId;
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  el("sbAddLinkTitle").textContent = `Add to ${group ? group.label : "Sidebar"}`;
  el("sbAddLinkName").value = "";
  el("sbAddLinkUrl").value = "";
  const addableViews = SIDEBAR_ADDABLE_VIEWS.filter(
    (v) => !group?.items.some((it) => it.kind === "view" && it.view === v.view),
  );
  const pickerEl = el("sbAddLinkViewPicker");
  if (pickerEl) {
    pickerEl.innerHTML = addableViews
      .map(
        (v) => `<button type="button" class="sb-view-pick-btn" data-add-view="${escH(v.view)}">${escH(v.label)}</button>`,
      )
      .join("");
    pickerEl.style.display = addableViews.length ? "" : "none";
  }
  openModal("sbAddLinkModal");
  setTimeout(() => el("sbAddLinkName").focus(), 80);
}

function addSidebarViewItem(groupId, view) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  const meta = SIDEBAR_ADDABLE_VIEWS.find((v) => v.view === view);
  if (!group || !meta) return;
  group.items.push({ id: `view-${view}-${Date.now()}`, label: meta.label, icon: meta.icon, kind: "view", view: meta.view });
  save();
  renderSidebar();
  closeModal("sbAddLinkModal");
  showToast(`${meta.label} added`, "success");
}

function saveSbLink() {
  const name = el("sbAddLinkName").value.trim();
  const url = el("sbAddLinkUrl").value.trim();
  if (!name || !url) {
    showToast("Enter a name and URL", "error");
    return;
  }
  const group = S.settings.sidebar.find((g) => g.id === S._sbAddLinkGroup);
  if (!group) return;
  group.items.push({ id: `link-${Date.now()}`, label: name, url: safeUrl(url), icon: "link", kind: "link" });
  save();
  renderSidebar();
  closeModal("sbAddLinkModal");
  showToast("Link added", "success");
}
```

In `newtab.html`, find the existing `sbAddLinkModal` (search for `id="sbAddLinkModal"`) and add a view-picker container inside it, above the name/URL fields:

```html
<div class="sb-view-picker" id="sbAddLinkViewPicker"></div>
```

- [ ] **Step 2: Add item-level edit controls in `_sbItemInner`**

In `app.js`, update `_sbItemInner(item)` (Task 8, Step 2) to accept the owning group id and render edit controls when `S.sidebarEditMode` is on. Replace the function with:

```js
function _sbItemInner(item, groupId) {
  const icon = SB_ICONS[item.icon] || SB_ICONS.link;
  const editControls = S.sidebarEditMode
    ? `
    <div class="sb-item-edit-actions">
      <button class="sb-icon-mini" data-sb-move-item="${escH(item.id)}" data-sb-item-group="${escH(groupId)}" data-dir="up" title="Move up">▲</button>
      <button class="sb-icon-mini" data-sb-move-item="${escH(item.id)}" data-sb-item-group="${escH(groupId)}" data-dir="down" title="Move down">▼</button>
      <button class="sb-icon-mini" data-sb-rename-item="${escH(item.id)}" data-sb-item-group="${escH(groupId)}" title="Rename">✎</button>
      <button class="sb-icon-mini sb-icon-mini-danger" data-sb-delete-item="${escH(item.id)}" data-sb-item-group="${escH(groupId)}" title="Delete">✕</button>
    </div>`
    : "";
  if (item.kind === "view") {
    return `
    <div class="sb-item-row${S.sidebarEditMode ? " sb-item-row-edit" : ""}">
      <a href="#" class="sb-item" data-view="${escH(item.view)}" data-sb-item-id="${escH(item.id)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
        <span class="sb-item-label">${escH(item.label)}</span>
      </a>
      ${editControls}
    </div>`;
  }
  return `
    <div class="sb-item-row${S.sidebarEditMode ? " sb-item-row-edit" : ""}">
      <div class="sb-item sb-link-item" data-sb-item-id="${escH(item.id)}" data-tip="${escH(item.label)}">
        <a href="${escH(item.url)}" class="sb-link-main" target="_blank" rel="noopener">
          <img class="sb-fav" src="${favSrc(item.url)}" alt="">
          <span class="sb-item-label">${escH(item.label)}</span>
        </a>
      </div>
      ${editControls}
    </div>`;
}
```

Update the one call site inside `renderSidebar()` from `group.items.map(_sbItemInner).join("")` to `group.items.map((it) => _sbItemInner(it, group.id)).join("")`.

- [ ] **Step 3: Write item CRUD functions**

Add to `app.js`, next to the group CRUD functions from Task 9:

```js
// ===== SIDEBAR ITEM CRUD =====
function renameSidebarItem(groupId, itemId) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  const item = group?.items.find((it) => it.id === itemId);
  if (!item) return;
  const label = prompt("Rename item", item.label);
  if (!label || !label.trim()) return;
  item.label = label.trim();
  save();
  renderSidebar();
}

function deleteSidebarItem(groupId, itemId) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  const item = group?.items.find((it) => it.id === itemId);
  if (!group || !item) return;
  if (item.kind === "link" && item.url) S._qaDeleted.add(_normUrl(item.url));
  group.items = group.items.filter((it) => it.id !== itemId);
  save();
  renderSidebar();
  showToast("Item removed", "success");
}

function moveSidebarItem(groupId, itemId, direction) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  if (!group) return;
  const idx = group.items.findIndex((it) => it.id === itemId);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= group.items.length) return;
  [group.items[idx], group.items[swapWith]] = [group.items[swapWith], group.items[idx]];
  save();
  renderSidebar();
}
```

- [ ] **Step 4: Wire up click handlers**

In `app.js`'s `setupEventListeners()`, extend the delegated click listener added in Task 9, Step 4 with:

```js
    const addViewBtn = e.target.closest("[data-add-view]");
    if (addViewBtn) return addSidebarViewItem(S._sbAddLinkGroup, addViewBtn.dataset.addView);
    const moveItemBtn = e.target.closest("[data-sb-move-item]");
    if (moveItemBtn) return moveSidebarItem(moveItemBtn.dataset.sbItemGroup, moveItemBtn.dataset.sbMoveItem, moveItemBtn.dataset.dir);
    const renameItemBtn = e.target.closest("[data-sb-rename-item]");
    if (renameItemBtn) return renameSidebarItem(renameItemBtn.dataset.sbItemGroup, renameItemBtn.dataset.sbRenameItem);
    const deleteItemBtn = e.target.closest("[data-sb-delete-item]");
    if (deleteItemBtn) return deleteSidebarItem(deleteItemBtn.dataset.sbItemGroup, deleteItemBtn.dataset.sbDeleteItem);
```
(add these lines inside the same `document.addEventListener("click", (e) => { ... })` block from Task 9 Step 4, before its closing brace)

- [ ] **Step 5: Style item edit rows and the view picker**

In `style.css`, add:

```css
.sb-item-row { display: flex; align-items: center; }
.sb-item-row-edit .sb-item { flex: 1; pointer-events: none; }
.sb-item-edit-actions { display: flex; align-items: center; gap: 1px; padding-right: 4px; }
.sb-view-picker { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.sb-view-pick-btn {
  padding: 5px 10px; border-radius: var(--radius-pill);
  border: 1.5px solid var(--border-2); background: none; color: var(--text-2);
  font-size: 11.5px; font-weight: 600; cursor: pointer;
}
.sb-view-pick-btn:hover { border-color: var(--accent-2); color: var(--accent-2); }
```

Note: `.sb-item-row-edit .sb-item { pointer-events: none; }` intentionally disables navigation while in edit mode so a misclick doesn't navigate away mid-edit — the whole point of edit mode is editing, not browsing.

- [ ] **Step 6: Manual verification**

Build, load unpacked. Turn on edit mode. Confirm each item shows ▲▼✎✕. Rename an item, confirm it persists. Delete an item, confirm it's gone and its removal doesn't error if it was a `link` item with a URL (check `S._qaDeleted` picked it up, matching existing tombstone behavior). Reorder items with ▲▼, confirm persistence. Turn edit mode off, click the `+` on a group with an addable view left (e.g. Home, after deleting Downloads) — confirm the view-picker shows "Downloads" as an option, clicking it adds it back without needing a URL. Add a plain link (name+URL) to Google — confirm it appears with a favicon and opens correctly.

- [ ] **Step 7: Commit**

```bash
git add app.js newtab.html style.css
git commit -m "feat: add/rename/delete/reorder CRUD for sidebar items"
```

---

## Task 11: Trim new-install seed data

**Files:**
- Modify: `app.js:376-427` (`DEFAULT_WS_DATA(1).quickAccess`)
- Modify: `app.js` (`DEFAULT_WS_DATA(1).notes` — find the notes array within the same function, currently 5 personal demo notes)
- Modify: `app.js:1340-1401` (`sbLinks` defaults) — no longer read by `renderSidebar()` after Task 8/6, but still referenced by `migrateSyncSbLinksToQA()` and other migrations for *existing* users, so these stay as-is; this task only touches what's used for genuinely fresh installs, i.e. `DEFAULT_WS_DATA`.

**Interfaces:**
- Consumes/Produces: nothing new — pure data edit to existing constants.

- [ ] **Step 1: Replace the Quick Access default list**

In `app.js`, replace the entire `quickAccess: [...]` array inside `DEFAULT_WS_DATA(id === 1)` (lines 379-427) with:

```js
      quickAccess: [
        { id: 101, name: "Gmail",           url: "https://mail.google.com" },
        { id: 102, name: "Google Calendar", url: "https://calendar.google.com" },
        { id: 103, name: "Google Drive",    url: "https://drive.google.com" },
        { id: 104, name: "YouTube",         url: "https://youtube.com" },
        { id: 105, name: "Google Maps",     url: "https://maps.google.com" },
        { id: 106, name: "Amazon",          url: "https://amazon.com" },
        { id: 107, name: "Wikipedia",       url: "https://wikipedia.org" },
        { id: 108, name: "Reddit",          url: "https://reddit.com" },
        { id: 109, name: "LinkedIn",        url: "https://linkedin.com/feed" },
        { id: 110, name: "Netflix",         url: "https://netflix.com" },
      ],
```

- [ ] **Step 2: Empty the default notes**

In the same `DEFAULT_WS_DATA` function, find `notes: [` (the 5-note array starting around the line right after the `quickAccess` array) and replace the whole array with:

```js
      notes: [],
```

- [ ] **Step 3: Verify no other new-install seed data carries personal bias**

Run `grep -n "Hamro Patro\|Upwork\|n8n\|Cursor\|Bolt\b" app.js` — expect these to now only appear in `sbLinks` (Task 11 explicitly leaves `sbLinks` untouched, since it's migration-only for *existing* profiles, not read for fresh installs after Task 8 deletes the code paths that rendered from it). Confirm via `grep -n "sbLinks" app.js` that the only remaining reads of `S.settings.sbLinks` are inside `migrateSyncSbLinksToQA()` / `migrateSidebarToDataModel()` — i.e. nothing in the live render path reads it anymore.

- [ ] **Step 4: Manual verification**

Clear the extension's storage (`chrome://extensions` → Details → Clear storage, or uninstall/reinstall the unpacked build) to simulate a fresh install. Open a new tab. Expected: Quick Access shows the 10 generic links from Step 1; the Notes widget is empty; Google/Socials/AI sidebar groups show the "No links yet" empty state (per Task 8).

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: replace personal-preference seed data with generic defaults"
```

---

## Task 12: Full QA pass

No code changes — this task is the Phase 6 checklist from the design spec, run end-to-end after Tasks 1-11 land.

**Files:** none.

- [ ] **Step 1: Fresh-install check**

Clear storage, reload. Confirm: new icon shows everywhere (tab strip, `chrome://extensions`, sidebar brand); sidebar shows Dashboard/Home/Personal/Google/Socials/AI only; Home/Personal show their 3 defaults; Google/Socials/AI are empty with the add-link hint; Quick Access shows the 10 generic defaults; Notes widget is empty.

- [ ] **Step 2: Existing-profile migration check**

Using a profile that had custom Google/Socials/AI links before this branch (or a manually-seeded one per Task 6's verification step), confirm after upgrade: those links appear under the matching new sidebar group, nothing is missing, and the original `sbLinks`/`wsData[2].quickAccess` fields are still present in storage (not deleted).

- [ ] **Step 3: CRUD check**

Add a group, rename it, add a link item and a view item to it, reorder both items and groups, delete an item, delete a group (confirm it lands in Trash), reload — everything persists.

- [ ] **Step 4: Collapsed-sidebar check**

Collapse the sidebar. Confirm: only the toggle shows in the brand row (no logo). Click each group icon — a flyout appears with correct items, closes on outside click, doesn't get clipped at the bottom of the viewport for the last group.

- [ ] **Step 5: Widget toggle check**

Toggle Calendar, Notes, To-Do, and Focus Timer widgets off/on from Settings — each shows/hides independently and persists across reload.

- [ ] **Step 6: Workspace switcher check**

Confirm the topbar shows all workspaces (including the 3 built-in ones), switching works, New/Manage/Organize all work, Alt+1–9 still works.

- [ ] **Step 7: Regression check — auth, sync, build**

Sign in with Google (or confirm the sign-in button still opens the OAuth flow if a real account isn't available for testing), confirm Drive push/pull still fires (watch the sync icon state change), confirm `npm run lint` is clean, `npm run build` succeeds, `npm run zip` produces a valid zip.

- [ ] **Step 8: Final commit**

If Step 7 surfaces any fixes, commit them individually with descriptive messages per the pattern used throughout this plan. If everything passes clean, no commit needed for this task.

---

## Task 13: Clean rebuild + version bump to 1.5.0 + release zip

Run after Task 12 passes clean. Produces the deployable artifact.

**Files:**
- Modify: `package.json:3` (`version`)
- Modify: `manifest.json:4` (`version`)
- Delete: any stray root-level `*.zip` files, the existing `dist/` folder (build.js also wipes `dist/` itself at the start of every `npm run build`, but the user asked for an explicit clean pass first).

**Interfaces:** none — build tooling only, no app code touched.

**Constraint:** do NOT touch `manifest.json`'s `permissions`, `host_permissions`, or add back a `key` field — a wrong `key` previously broke a CWS upload and was deliberately removed (see `c9c2daa fix: remove manifest key that didn't match the published CWS item`). `PUBLISHED_EXTENSION_ID` in `build.js` must keep matching the live Chrome Web Store listing (`aokkcpfoompjgeknhbkphogfcjjlbpol`) — version is the only field this task changes.

- [ ] **Step 1: Remove stray build artifacts**

```bash
rm -rf dist
rm -f *.zip
```
(Both are gitignored — this is cleaning local build output, not touching anything tracked by git.)

- [ ] **Step 2: Bump the version in both files**

In `package.json`, change:
```json
  "version": "1.4.0",
```
to:
```json
  "version": "1.5.0",
```

In `manifest.json`, change:
```json
  "version": "1.4.0",
```
to:
```json
  "version": "1.5.0",
```

- [ ] **Step 3: Commit the version bump**

```bash
git add package.json manifest.json
git commit -m "chore: bump version to 1.5.0 for the sidebar overhaul release"
```

- [ ] **Step 4: Fresh build**

```bash
npm run build
```
Expected: `validate()` prints ✓ for every required file (including the new icon files from Task 1), ✓ for manifest permissions, a ⚠ (not ✗) for the missing `key` field (expected — matches the current, intentional post-`c9c2daa` state), then "Name: llmaotab v1.5.0" and "✓ Build complete". If anything prints ✗, stop and fix it before continuing — that means a required file listed in `build.js`'s `REQUIRED_FILES` is missing or a required permission was accidentally dropped from `manifest.json` somewhere in Tasks 1-12.

- [ ] **Step 5: Package the zip**

```bash
npm run zip
```
Expected: produces `llmaotab-v1.5.0-chrome.zip` in the repo root (filename derived from `package.json`'s version, per the existing `zip` script — confirms Step 2 took effect).

- [ ] **Step 6: Spot-check the zip contents**

```bash
unzip -l llmaotab-v1.5.0-chrome.zip
```
Expected: contains exactly `manifest.json`, `newtab.html`, `app.js`, `style.css`, `fouc.js`, `icons/favicon.svg`, `icons/favicon.png`, `icons/icon-16.png`, `icons/icon-48.png`, `popup.html`, `popup.js`, `privacy.html` — the same `REQUIRED_FILES` list `build.js` validates against, nothing extra (no `docs/`, no `.git`, no source-map cruft).

```bash
unzip -p llmaotab-v1.5.0-chrome.zip manifest.json | grep version
```
Expected: `"version": "1.5.0"`.

- [ ] **Step 7: Final smoke test as an unpacked load**

In `chrome://extensions`, remove any previously-loaded unpacked copy of this extension, then "Load unpacked" pointing at the fresh `dist/` folder from Step 4. Open a new tab and re-run the Task 12 checklist once more against this exact build (not a dev server) — this is the build that would actually ship. Confirm no console errors on load (`chrome://extensions` → Details → Inspect views → service worker / the new tab page's devtools console).

This task produces `llmaotab-v1.5.0-chrome.zip`, ready to upload to the Chrome Web Store Developer Dashboard for the existing published item (`aokkcpfoompjgeknhbkphogfcjjlbpol`) — uploading it is a separate, manual, user-initiated step outside this plan's scope (publishing to a live store listing is exactly the kind of external/hard-to-reverse action that needs your explicit go-ahead, not something to automate).

---

## Self-Review Notes

- **Spec coverage:** Icon (Task 1), collapsed z-index/flyout (Task 3), logo/toggle swap (Task 2), data model + migration (Tasks 5-6), workspace-switcher preservation (Task 7), group+item CRUD (Tasks 9-10), Development/Kanban/Projects/Others removal (Task 8), new-install defaults (Task 11), widget parity (Task 4), full QA (Task 12) — every spec section maps to at least one task. Task 13 (clean rebuild, version 1.5.0, release zip) covers the user's post-implementation follow-up request and is deliberately last, gated on Task 12 passing.
- **Type consistency:** item shape `{id, label, icon, kind, view?, url?}` is defined once in Task 5 and used identically in Tasks 6, 8, 9, 10 — `kind` is always `"view"` or `"link"`, `group.items` is always an array, never `undefined` (both `DEFAULT_SIDEBAR` and every CRUD function that creates a group initialize `items: []`).
- **`_sbAddLinkGroup`** is reused from the existing codebase (already declared in initial state, `app.js:1420`) rather than introducing a parallel field — Task 10 relies on this.
