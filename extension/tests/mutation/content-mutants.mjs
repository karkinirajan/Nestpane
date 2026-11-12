// Deliberate bugs in the code that holds the user's own content (bookmark tree, [[wiki links]], autosave, sidebar order, URL and HTML
// escaping), one at a time: each must make its unit tests fail.
// Run from extension/ (see mutate.mjs; do not edit the tree while it runs; each `old` must occur exactly once):
//   node tests/mutation/mutate.mjs tests/mutation/content-mutants.mjs
//
// Not listed, because they cannot change behaviour or pin behaviour nobody relies on:
//  - wikilinks: dropping `WIKILINK_RE.lastIndex = 0` (a global regex resets itself when exec() returns null, and the loop only ends there);
//    dropping `if (!text) continue` in findBacklinks (mentionsTarget("") is already false);
//  - format: the `if (!trimmed) return ""` in safeUrl (new URL("https://") throws and the catch returns the same ""), and the http/https
//    protocol check (unreachable: the scheme is always http or https by the time it runs; it stays as a second line of defence);
//  - wikilinks: the `!norm` check in findBacklinks (extractWikiLinks never returns an empty link, so a blank target cannot match);
//  - autosave: `pendingArgs = null` after a timer fires (the arguments are only read while a timer is pending, and schedule() replaces them);
//  - sidebar-order: the `targetItemId === itemId` check in moveItem (the later `t < 0` lookup already refuses it, because the item has
//    been taken out of the list being searched);
//  Each of the entries above was run once and survived the full test files, which is what "cannot change behaviour" is checked against.
//  - bookmarks-store: creating `children` on a bookmark that is given a child (insertNode / moveNode). The UI only offers folders as
//    destinations, and chrome.bookmarks refuses such a move, so the behaviour is not worth freezing.

const bookmarks = ["tests/bookmarks-store.test.js", "tests/bookmarks-store.edges.test.js"];
const wikilinks = ["tests/wikilinks.test.js", "tests/wikilinks.edges.test.js"];
const autosave = ["tests/autosave.test.js", "tests/autosave.edges.test.js"];
const sidebar = ["tests/sidebar-order.test.js", "tests/sidebar-order.edges.test.js"];
const format = ["tests/format.test.js", "tests/format.edges.test.js"];

const m = (name, file, tests, old, replacement) => ({ name, file, tests, old, new: replacement });
const BS = "lib/bookmarks-store.js";
const WL = "lib/wikilinks.js";
const AS = "lib/autosave.js";
const SO = "lib/sidebar-order.js";
const FM = "lib/format.js";

export default [
  // --- bookmark tree (the web build's stand-in for chrome.bookmarks)
  m("bookmarks: new ids lose the prefix that keeps them apart from Chrome's", BS, bookmarks, 'return "w" + Date.now()', 'return "" + Date.now()'),
  m("bookmarks: a number matches a string id", BS, bookmarks, "if (node.id === targetId) {", "if (node.id == targetId) {"),
  m("bookmarks: a top-level node reports index 0", BS, bookmarks, "parent.children.indexOf(node) : -1;", "parent.children.indexOf(node) : 0;"),
  m("bookmarks: the reported index is one too high", BS, bookmarks, "const index = parent ? parent.children.indexOf(node) : -1;", "const index = parent ? parent.children.indexOf(node) + 1 : -1;"),
  m("bookmarks: a search walks into a bookmark's missing children", BS, bookmarks, "      if (!Array.isArray(node.children)) return null;\n", ""),
  m("bookmarks: inserting under an unknown parent throws", BS, bookmarks, "    if (!target) return null;\n", ""),
  m("bookmarks: a new node without a title gets undefined", BS, bookmarks, 'title: details.title || "",', "title: details.title,"),
  m("bookmarks: links and folders swap shape", BS, bookmarks, "...details.url ? { url: details.url } : { children: [] }", "...details.url ? { children: [] } : { url: details.url }"),
  m("bookmarks: a new link also gets a children list", BS, bookmarks, "...details.url ? { url: details.url } : { children: [] }", "...details.url ? { url: details.url, children: [] } : { children: [] }"),
  m("bookmarks: updating an unknown id throws", BS, bookmarks, '    if (!found) return null;\n    if (typeof changes.title === "string")', '    if (typeof changes.title === "string")'),
  m("bookmarks: an empty title cannot be set", BS, bookmarks, 'if (typeof changes.title === "string") found.node.title', "if (changes.title) found.node.title"),
  m("bookmarks: an empty url cannot be set", BS, bookmarks, 'if (typeof changes.url === "string") found.node.url', "if (changes.url) found.node.url"),
  m("bookmarks: moving the root is allowed", BS, bookmarks, "if (!found || !destination || !found.parent) return null;", "if (!found || !destination) return null;"),
  m("bookmarks: moving to an unknown folder throws", BS, bookmarks, "if (!found || !destination || !found.parent) return null;", "if (!found || !found.parent) return null;"),
  m("bookmarks: a move leaves a copy behind", BS, bookmarks, "found.parent.children.splice(found.index, 1);\n    if (!Array.isArray(destination.node.children))", "found.parent.children.splice(found.index, 0);\n    if (!Array.isArray(destination.node.children))"),
  m("bookmarks: a folder can move into itself or below itself", BS, bookmarks, "    if (containsNode(found.node, destination.node)) return null;\n", ""),
  m("bookmarks: the folder itself is not 'inside' itself", BS, bookmarks, "if (subtree === target) return true;", "if (subtree === target) return false;"),
  m("bookmarks: only direct children count as 'inside'", BS, bookmarks, "subtree.children.some((child) => containsNode(child, target))", "subtree.children.some((child) => child === target)"),
  m("bookmarks: removing the root is allowed", BS, bookmarks, "if (!found || !found.parent) return false;", "if (!found) return false;"),
  m("bookmarks: removing an unknown id throws", BS, bookmarks, "if (!found || !found.parent) return false;", "if (!found.parent) return false;"),
  m("bookmarks: a removal removes nothing", BS, bookmarks, "found.parent.children.splice(found.index, 1);\n    return true;", "found.parent.children.splice(found.index, 0);\n    return true;"),
  // --- [[wiki links]] between notes, tasks, bookmarks and journal days
  m("wikilinks: a link may span lines", WL, wikilinks, "/\\[\\[([^[\\]\\n]+)\\]\\]/g", "/\\[\\[([^[\\]]+)\\]\\]/g"),
  m("wikilinks: link text keeps its padding", WL, wikilinks, "const raw = match[1].trim();", "const raw = match[1];"),
  m("wikilinks: an empty link is returned", WL, wikilinks, "      if (!raw) continue;\n", ""),
  m("wikilinks: duplicates differ by case", WL, wikilinks, "const key = raw.toLowerCase();", "const key = raw;"),
  m("wikilinks: duplicates are all returned", WL, wikilinks, "if (!seen.has(key)) {", "if (true) {"),
  m("wikilinks: input that is not text is searched anyway", WL, wikilinks, 'if (!text || typeof text !== "string") return [];', ""),
  m("wikilinks: a task list given as an array is ignored", WL, wikilinks, "if (Array.isArray(kanban)) return kanban;", ""),
  m("wikilinks: the separate task list is ignored", WL, wikilinks, "if (Array.isArray(kanbanCards)) return kanbanCards;", ""),
  m("wikilinks: the done column is skipped", WL, wikilinks, '["todo", "doing", "done"]', '["todo", "doing"]'),
  m("wikilinks: a card's own column is overwritten", WL, wikilinks, "column: c.column || col", "column: col"),
  m("wikilinks: a null card in a column crashes the lookup", WL, wikilinks, "if (c) out.push(", "if (true) out.push("),
  m("wikilinks: resolving without a state throws", WL, wikilinks, "if (!targetTitle || !state) return null;", "if (!targetTitle) return null;"),
  m("wikilinks: resolving ignores padding", WL, wikilinks, "if (!targetTitle || !state) return null;\n    const norm = String(targetTitle).trim().toLowerCase();", "if (!targetTitle || !state) return null;\n    const norm = String(targetTitle).toLowerCase();"),
  m("wikilinks: resolving is case-sensitive", WL, wikilinks, "if (!targetTitle || !state) return null;\n    const norm = String(targetTitle).trim().toLowerCase();", "if (!targetTitle || !state) return null;\n    const norm = String(targetTitle).trim();"),
  m("wikilinks: a blank title resolves", WL, wikilinks, "if (!norm) return null;", ""),
  m("wikilinks: a deleted note resolves", WL, wikilinks, "state.notes.find((n) => n && !n._deleted &&", "state.notes.find((n) => n &&"),
  m("wikilinks: a note title is compared untrimmed", WL, wikilinks, 'String(n.title || "").trim().toLowerCase() === norm', 'String(n.title || "").toLowerCase() === norm'),
  m("wikilinks: a note title is compared case-sensitively", WL, wikilinks, 'String(n.title || "").trim().toLowerCase() === norm', 'String(n.title || "").trim() === norm'),
  m("wikilinks: a deleted task resolves", WL, wikilinks, "cards.find((c) => c && !c._deleted && String(c.title", "cards.find((c) => c && String(c.title"),
  m("wikilinks: a task without a column loses its default", WL, wikilinks, 'column: card.column || "todo"', "column: card.column"),
  m("wikilinks: a bookmark is matched on the wrong field", WL, wikilinks, 'String(q.name || "")', 'String(q.title || "")'),
  m("wikilinks: a journal day matches any suffix", WL, wikilinks, "/^\\d{4}-\\d{2}-\\d{2}$/.test(norm)", "/^\\d{4}-\\d{2}-\\d{2}/.test(norm)"),
  m("wikilinks: a journal day matches any prefix", WL, wikilinks, "/^\\d{4}-\\d{2}-\\d{2}$/.test(norm)", "/\\d{4}-\\d{2}-\\d{2}$/.test(norm)"),
  m("wikilinks: a day with no entry resolves", WL, wikilinks, "if (state.journal[norm]) {", "if (true) {"),
  m("backlinks: no state throws", WL, wikilinks, "if (!targetTitle || !state) return [];", "if (!targetTitle) return [];"),
  m("backlinks: padding is not trimmed", WL, wikilinks, "if (!targetTitle || !state) return [];\n    const norm = String(targetTitle).trim().toLowerCase();", "if (!targetTitle || !state) return [];\n    const norm = String(targetTitle).toLowerCase();"),
  m("backlinks: case-sensitive target", WL, wikilinks, "if (!targetTitle || !state) return [];\n    const norm = String(targetTitle).trim().toLowerCase();", "if (!targetTitle || !state) return [];\n    const norm = String(targetTitle).trim();"),
  m("backlinks: link text is compared case-sensitively", WL, wikilinks, "links.some((l) => l.toLowerCase() === norm)", "links.some((l) => l === norm)"),
  m("backlinks: a deleted note is listed", WL, wikilinks, "if (!n || n._deleted) continue;", "if (!n) continue;"),
  m("backlinks: the excluded note is listed", WL, wikilinks, '        if (exType === "note" && n.id === exId) continue;\n', ""),
  m("backlinks: the exclusion ignores the kind", WL, wikilinks, 'exType === "note" && n.id === exId', "n.id === exId"),
  m("backlinks: a note title is not searched", WL, wikilinks, "mentionsTarget(n.content) || mentionsTarget(n.title)", "mentionsTarget(n.content)"),
  m("backlinks: note content is not searched", WL, wikilinks, "mentionsTarget(n.content) || mentionsTarget(n.title)", "mentionsTarget(n.title)"),
  m("backlinks: an untitled note has no name", WL, wikilinks, 'title: n.title || "Untitled Note"', "title: n.title"),
  m("backlinks: a deleted task is listed", WL, wikilinks, "if (!c || c._deleted) continue;", "if (!c) continue;"),
  m("backlinks: the excluded task is listed", WL, wikilinks, '      if (exType === "task" && c.id === exId) continue;\n', ""),
  m("backlinks: the task exclusion ignores the kind", WL, wikilinks, 'exType === "task" && c.id === exId', "c.id === exId"),
  m("backlinks: a task title is not searched", WL, wikilinks, "mentionsTarget(c.title) || mentionsTarget(c.desc) || mentionsTarget(c.description)", "mentionsTarget(c.desc) || mentionsTarget(c.description)"),
  m("backlinks: a task desc is not searched", WL, wikilinks, "mentionsTarget(c.title) || mentionsTarget(c.desc) || mentionsTarget(c.description)", "mentionsTarget(c.title) || mentionsTarget(c.description)"),
  m("backlinks: a task description is not searched", WL, wikilinks, "mentionsTarget(c.title) || mentionsTarget(c.desc) || mentionsTarget(c.description)", "mentionsTarget(c.title) || mentionsTarget(c.desc)"),
  m("backlinks: an untitled task has no name", WL, wikilinks, 'title: c.title || "Task"', "title: c.title"),
  m("backlinks: object journal entries are ignored", WL, wikilinks, '(entry && typeof entry.text === "string" ? entry.text : "")', '""'),
  m("backlinks: the excluded journal day is listed", WL, wikilinks, '        if (exType === "journal" && dateKey === exId) continue;\n', ""),
  m("backlinks: the journal exclusion ignores the kind", WL, wikilinks, 'exType === "journal" && dateKey === exId', "dateKey === exId"),
  // --- debounced autosave
  m("autosave: rescheduling leaves the old timer running", AS, autosave, "      if (timer !== null) clearTimeout(timer);\n      timer = setTimeout", "      timer = setTimeout"),
  m("autosave: the delay is doubled", AS, autosave, "run(pendingArgs), delayMs)", "run(pendingArgs), delayMs * 2)"),
  m("autosave: the delay is ignored", AS, autosave, "run(pendingArgs), delayMs)", "run(pendingArgs), 0)"),
  m("autosave: a fired call stays 'pending'", AS, autosave, "function run(args) {\n      timer = null;", "function run(args) {"),
  m("autosave: flushing nothing calls the function", AS, autosave, "      if (timer === null) return false;\n", ""),
  m("autosave: a flush leaves the timer to fire again", AS, autosave, "      clearTimeout(timer);\n      const args = pendingArgs;", "      const args = pendingArgs;"),
  m("autosave: a flush says it did nothing", AS, autosave, "      fn(...args);\n      return true;", "      fn(...args);\n      return false;"),
  m("autosave: a flush stays pending", AS, autosave, "      const args = pendingArgs;\n      timer = null;", "      const args = pendingArgs;"),
  m("autosave: cancelling leaves the timer running", AS, autosave, "    function cancel() {\n      if (timer !== null) clearTimeout(timer);\n", "    function cancel() {\n"),
  m("autosave: cancelling stays pending", AS, autosave, "clearTimeout(timer);\n      timer = null;\n      pendingArgs = null;\n    }\n\n    function isPending", "clearTimeout(timer);\n      pendingArgs = null;\n    }\n\n    function isPending"),
  m("autosave: pending is always true", AS, autosave, "return timer !== null;", "return true;"),
  m("autosave: the registry returns nothing from register", AS, autosave, "        return flushable;\n", ""),
  m("autosave: flushAll flushes only the first", AS, autosave, "all.forEach((f) => f.flush());", "all.slice(0, 1).forEach((f) => f.flush());"),
  // --- sidebar ordering
  m("sidebar: ids are compared strictly", SO, sidebar, "String(a) === String(b)", "a === b"),
  m("sidebar: a group can move onto itself", SO, sidebar, "|| same(fromId, toId)) return null;\n    const from", ") return null;\n    const from"),
  m("sidebar: an unknown group moves the last one", SO, sidebar, "if (from < 0 || !groups.some", "if (!groups.some"),
  m("sidebar: an unknown target group is accepted", SO, sidebar, "!groups.some((g) => same(g.id, toId))) return null;", "false) return null;"),
  m("sidebar: 'after' puts the group before", SO, sidebar, 'next.splice(position === "after" ? target + 1 : target, 0, moved);', 'next.splice(position === "after" ? target : target, 0, moved);'),
  m("sidebar: the default group position is after", SO, sidebar, 'next.splice(position === "after" ? target + 1 : target, 0, moved);', 'next.splice(position === "before" ? target : target + 1, 0, moved);'),
  m("sidebar: a group move that changes nothing returns a copy", SO, sidebar, "return next.every((g, i) => g === groups[i]) ? null : next;", "return next;"),
  m("sidebar: a missing move description throws", SO, sidebar, "if (!Array.isArray(groups) || !move) return null;", "if (!Array.isArray(groups)) return null;"),
  m("sidebar: items default to going after", SO, sidebar, 'position = "before" } = move;', 'position = "after" } = move;'),
  m("sidebar: an unknown source group is accepted", SO, sidebar, "if (!src || !dst) return null;", "if (!dst) return null;"),
  m("sidebar: an unknown target group is accepted for items", SO, sidebar, "if (!src || !dst) return null;", "if (!src) return null;"),
  m("sidebar: an unknown item is moved anyway", SO, sidebar, "    if (!item) return null;\n", ""),
  m("sidebar: reordering views inside a group is blocked", SO, sidebar, "if (src !== dst && item.kind", "if (item.kind"),
  m("sidebar: any view in the target blocks a view", SO, sidebar, 'it.kind === "view" && it.view === item.view', 'it.kind === "view"'),
  m("sidebar: a duplicate view is allowed", SO, sidebar, 'dst.items.some((it) => it.kind === "view" && it.view === item.view)', "false"),
  m("sidebar: same-group moves keep the moved item twice", SO, sidebar, "const base = src === dst ? srcItems : dst.items.slice();", "const base = dst.items.slice();"),
  m("sidebar: no target means the start", SO, sidebar, "let at = base.length;", "let at = 0;"),
  m("sidebar: an unknown target item is accepted", SO, sidebar, "      if (t < 0) return null;\n", ""),
  m("sidebar: 'after' puts the item before", SO, sidebar, 'at = position === "after" ? t + 1 : t;', 'at = position === "after" ? t : t;'),
  m("sidebar: a no-op item move returns a copy", SO, sidebar, "if (src === dst && dstItems.every((it, i) => it === src.items[i])) return null;", ""),
  m("sidebar: the source group keeps the moved item", SO, sidebar, "return { ...g, items: srcItems };", "return g;"),
  m("sidebar: the target group is not updated", SO, sidebar, "if (g === dst) return { ...g, items: dstItems };", "if (g === dst) return g;"),
  // --- URL and HTML escaping
  m("format: ampersands are not escaped", FM, format, '.replace(/&/g, "&amp;")', ""),
  m("format: less-than is not escaped", FM, format, '.replace(/</g, "&lt;")', ""),
  m("format: greater-than is not escaped", FM, format, '.replace(/>/g, "&gt;")', ""),
  m("format: double quotes are not escaped", FM, format, '.replace(/"/g, "&quot;")', ""),
  m("format: single quotes are not escaped", FM, format, ".replace(/'/g, \"&#39;\")", ""),
  m("format: ampersands are escaped last", FM, format, 'String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")', 'String(s).replace(/</g, "&lt;").replace(/&/g, "&amp;")'),
  m("format: a missing url throws", FM, format, '    if (!raw) return "";\n', ""),
  m("format: a scheme is matched case-sensitively", FM, format, "/^https?:\\/\\//i", "/^https?:\\/\\//"),
  m("format: a scheme-less url gets plain http", FM, format, '"https://" + trimmed', '"http://" + trimmed'),
  m("format: the url is not trimmed", FM, format, "const trimmed = raw.trim();", "const trimmed = raw;"),
  m("format: the url is returned as typed", FM, format, "return u.href;", "return withScheme;"),
  m("format: an unparseable url is returned as typed", FM, format, '} catch {\n      return "";', "} catch {\n      return withScheme;"),
];
