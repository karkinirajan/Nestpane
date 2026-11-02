"use strict";
(function (root) {
  const same = (a, b) => String(a) === String(b);

  function moveGroup(groups, fromId, toId, position) {
    if (!Array.isArray(groups) || same(fromId, toId)) return null;
    const from = groups.findIndex((g) => same(g.id, fromId));
    if (from < 0 || !groups.some((g) => same(g.id, toId))) return null;
    const next = groups.slice();
    const [moved] = next.splice(from, 1);
    const target = next.findIndex((g) => same(g.id, toId));
    next.splice(position === "after" ? target + 1 : target, 0, moved);
    return next.every((g, i) => g === groups[i]) ? null : next;
  }

  function moveItem(groups, move) {
    if (!Array.isArray(groups) || !move) return null;
    const { fromGroupId, itemId, toGroupId, targetItemId = null, position = "before" } = move;
    const src = groups.find((g) => same(g.id, fromGroupId));
    const dst = groups.find((g) => same(g.id, toGroupId));
    if (!src || !dst) return null;
    const item = src.items.find((it) => same(it.id, itemId));
    if (!item) return null;
    if (targetItemId != null && same(targetItemId, itemId)) return null;
    if (src !== dst && item.kind === "view" && dst.items.some((it) => it.kind === "view" && it.view === item.view)) {
      return null;
    }
    const srcItems = src.items.filter((it) => it !== item);
    const base = src === dst ? srcItems : dst.items.slice();
    let at = base.length;
    if (targetItemId != null) {
      const t = base.findIndex((it) => same(it.id, targetItemId));
      if (t < 0) return null;
      at = position === "after" ? t + 1 : t;
    }
    const dstItems = base.slice();
    dstItems.splice(at, 0, item);
    if (src === dst && dstItems.every((it, i) => it === src.items[i])) return null;
    return groups.map((g) => {
      if (g === dst) return { ...g, items: dstItems };
      if (g === src) return { ...g, items: srcItems };
      return g;
    });
  }

  const api = { moveGroup, moveItem };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneSidebarOrder = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
