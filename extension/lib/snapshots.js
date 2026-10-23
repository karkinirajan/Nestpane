"use strict";
(function (root) {
  function _countKanbanTasks(kanban) {
    if (Array.isArray(kanban)) {
      return kanban.filter((c) => c && !c._deleted).length;
    }
    if (kanban && typeof kanban === "object") {
      let count = 0;
      for (const col of ["todo", "doing", "done"]) {
        if (Array.isArray(kanban[col])) {
          count += kanban[col].filter((c) => c && !c._deleted).length;
        }
      }
      return count;
    }
    return 0;
  }

  function summarizePayload(payload) {
    if (!payload || typeof payload !== "object") {
      return { notes: 0, tasks: 0, bookmarks: 0, habits: 0, journalDays: 0 };
    }
    const notes = Array.isArray(payload.notes) ? payload.notes.filter((n) => n && !n._deleted).length : 0;
    const tasks = _countKanbanTasks(payload.kanban);
    const bookmarks = Array.isArray(payload.quickAccess) ? payload.quickAccess.length : 0;
    const habits = Array.isArray(payload.habits) ? payload.habits.length : 0;
    const journalDays = payload.journal && typeof payload.journal === "object"
      ? Object.keys(payload.journal).filter((k) => {
          const v = payload.journal[k];
          return typeof v === "string" ? v.trim().length > 0 : Boolean(v && v.text);
        }).length
      : 0;
    return { notes, tasks, bookmarks, habits, journalDays };
  }

  function recordDailySnapshot(existingSnapshots, payload, dateKey, maxSnapshots = 7) {
    if (!payload || typeof payload !== "object" || !dateKey) {
      return Array.isArray(existingSnapshots) ? existingSnapshots.slice() : [];
    }
    const list = Array.isArray(existingSnapshots) ? existingSnapshots.slice() : [];
    const summary = summarizePayload(payload);
    if (summary.notes === 0 && summary.tasks === 0 && summary.bookmarks === 0 && summary.journalDays === 0) {
      return list;
    }
    const slimPayload = { ...payload };
    delete slimPayload._snapshots;
    const entry = {
      dateKey: String(dateKey),
      savedAt: payload._savedAt || Date.now(),
      summary,
      data: slimPayload
    };
    const filtered = list.filter((s) => s && s.dateKey !== entry.dateKey);
    filtered.unshift(entry);
    filtered.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    return filtered.slice(0, Math.max(1, maxSnapshots));
  }

  function formatSnapshotLabel(snapshot) {
    if (!snapshot || !snapshot.summary) return "Snapshot";
    const s = snapshot.summary;
    return `${snapshot.dateKey} \u2014 ${s.notes} notes, ${s.tasks} tasks, ${s.bookmarks} links`;
  }

  const api = { summarizePayload, recordDailySnapshot, formatSnapshotLabel };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneSnapshots = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
