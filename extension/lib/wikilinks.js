"use strict";
(function (root) {
  const WIKILINK_RE = /\[\[([^[\]\n]+)\]\]/g;

  function extractWikiLinks(text) {
    if (!text || typeof text !== "string") return [];
    const seen = new Set();
    const out = [];
    let match;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(text)) !== null) {
      const raw = match[1].trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(raw);
      }
    }
    return out;
  }

  function _flattenKanban(kanban, kanbanCards) {
    if (Array.isArray(kanban)) return kanban;
    if (Array.isArray(kanbanCards)) return kanbanCards;
    if (kanban && typeof kanban === "object") {
      const out = [];
      for (const col of ["todo", "doing", "done"]) {
        if (Array.isArray(kanban[col])) {
          for (const c of kanban[col]) {
            if (c) out.push({ ...c, column: c.column || col });
          }
        }
      }
      return out;
    }
    return [];
  }

  function resolveWikiLink(targetTitle, state) {
    if (!targetTitle || !state) return null;
    const norm = String(targetTitle).trim().toLowerCase();
    if (!norm) return null;

    if (Array.isArray(state.notes)) {
      const note = state.notes.find((n) => n && !n._deleted && String(n.title || "").trim().toLowerCase() === norm);
      if (note) return { type: "note", id: note.id, title: note.title };
    }

    const cards = _flattenKanban(state.kanban, state.kanbanCards);
    const card = cards.find((c) => c && !c._deleted && String(c.title || "").trim().toLowerCase() === norm);
    if (card) return { type: "task", id: card.id, title: card.title, column: card.column || "todo" };

    if (Array.isArray(state.quickAccess)) {
      const qa = state.quickAccess.find((q) => q && String(q.name || "").trim().toLowerCase() === norm);
      if (qa) return { type: "bookmark", id: qa.id, title: qa.name, url: qa.url };
    }

    if (state.journal && typeof state.journal === "object" && /^\d{4}-\d{2}-\d{2}$/.test(norm)) {
      if (state.journal[norm]) {
        return { type: "journal", id: norm, title: norm };
      }
    }

    return null;
  }

  function findBacklinks(targetTitle, state, exclude) {
    if (!targetTitle || !state) return [];
    const norm = String(targetTitle).trim().toLowerCase();
    if (!norm) return [];
    const exType = exclude && exclude.type;
    const exId = exclude && exclude.id;
    const results = [];

    const mentionsTarget = (text) => {
      const links = extractWikiLinks(text);
      return links.some((l) => l.toLowerCase() === norm);
    };

    if (Array.isArray(state.notes)) {
      for (const n of state.notes) {
        if (!n || n._deleted) continue;
        if (exType === "note" && n.id === exId) continue;
        if (mentionsTarget(n.content) || mentionsTarget(n.title)) {
          results.push({ type: "note", id: n.id, title: n.title || "Untitled Note" });
        }
      }
    }

    const cards = _flattenKanban(state.kanban, state.kanbanCards);
    for (const c of cards) {
      if (!c || c._deleted) continue;
      if (exType === "task" && c.id === exId) continue;
      if (mentionsTarget(c.title) || mentionsTarget(c.desc) || mentionsTarget(c.description)) {
        results.push({ type: "task", id: c.id, title: c.title || "Task" });
      }
    }

    if (state.journal && typeof state.journal === "object") {
      for (const [dateKey, entry] of Object.entries(state.journal)) {
        const text = typeof entry === "string" ? entry : (entry && typeof entry.text === "string" ? entry.text : "");
        if (!text) continue;
        if (exType === "journal" && dateKey === exId) continue;
        if (mentionsTarget(text)) {
          results.push({ type: "journal", id: dateKey, title: `Journal (${dateKey})` });
        }
      }
    }

    return results;
  }

  const api = { extractWikiLinks, resolveWikiLink, findBacklinks };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneWikiLinks = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
