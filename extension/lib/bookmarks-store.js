"use strict";
(function (root) {
  /**
   * A self-contained virtual bookmark tree, used only when `chrome.bookmarks`
   * isn't available (the web dashboard, or any future non-Chromium target).
   * Mirrors the shape chrome.bookmarks.getTree() returns — an array with one
   * root node, whose descendants are folders ({id, title, children}) and
   * bookmarks ({id, title, url}) — so the exact same rendering code in
   * app.js works unmodified against either source.
   *
   * This is NOT a substitute for the browser's real bookmarks — it's
   * Nestpane's own, separate, local store. It exists so "Add/Edit/Delete
   * bookmark" on the web dashboard actually persists instead of silently
   * doing nothing, which is what happened before this module existed.
   */
  function createDefaultTree() {
    return [
      {
        id: "0",
        title: "",
        children: [
          {
            id: "1",
            title: "Bookmarks bar",
            children: [
              {
                id: "10",
                title: "Social Media",
                children: [
                  { id: "100", title: "YouTube", url: "https://youtube.com" },
                  { id: "101", title: "Twitter / X", url: "https://twitter.com" },
                  { id: "102", title: "Instagram", url: "https://instagram.com" },
                  { id: "103", title: "Facebook", url: "https://facebook.com" },
                  { id: "104", title: "TikTok", url: "https://tiktok.com" }
                ]
              },
              {
                id: "11",
                title: "Development",
                children: [
                  { id: "110", title: "GitHub", url: "https://github.com" },
                  { id: "111", title: "Stack Overflow", url: "https://stackoverflow.com" },
                  { id: "112", title: "MDN Web Docs", url: "https://developer.mozilla.org" },
                  { id: "113", title: "CodePen", url: "https://codepen.io" }
                ]
              },
              {
                id: "12",
                title: "Design Resources",
                children: [
                  { id: "120", title: "Figma", url: "https://figma.com" },
                  { id: "121", title: "Dribbble", url: "https://dribbble.com" },
                  { id: "122", title: "Behance", url: "https://behance.net" }
                ]
              }
            ]
          },
          {
            id: "2",
            title: "Other bookmarks",
            children: [
              {
                id: "20",
                title: "Tools",
                children: [
                  { id: "200", title: "Notion", url: "https://notion.so" },
                  { id: "201", title: "Trello", url: "https://trello.com" },
                  { id: "202", title: "Google Drive", url: "https://drive.google.com" }
                ]
              }
            ]
          }
        ]
      }
    ];
  }

  function generateId() {
    return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Depth-first search across every root. Returns {node, parent, index} or null. */
  function findNode(tree, id) {
    for (const root of tree) {
      const found = _search(root, id, null);
      if (found) return found;
    }
    return null;

    function _search(node, targetId, parent) {
      if (node.id === targetId) {
        const index = parent ? parent.children.indexOf(node) : -1;
        return { node, parent, index };
      }
      if (!Array.isArray(node.children)) return null;
      for (const child of node.children) {
        const found = _search(child, targetId, node);
        if (found) return found;
      }
      return null;
    }
  }

  function insertNode(tree, parentId, details) {
    const target = findNode(tree, parentId);
    if (!target) return null;
    if (!Array.isArray(target.node.children)) target.node.children = [];
    const node = {
      id: generateId(),
      title: details.title || "",
      ...details.url ? { url: details.url } : { children: [] }
    };
    target.node.children.push(node);
    return node;
  }

  function updateNode(tree, id, changes) {
    const found = findNode(tree, id);
    if (!found) return null;
    if (typeof changes.title === "string") found.node.title = changes.title;
    if (typeof changes.url === "string") found.node.url = changes.url;
    return found.node;
  }

  function moveNode(tree, id, newParentId) {
    const found = findNode(tree, id);
    const destination = findNode(tree, newParentId);
    if (!found || !destination || !found.parent) return null;
    found.parent.children.splice(found.index, 1);
    if (!Array.isArray(destination.node.children)) destination.node.children = [];
    destination.node.children.push(found.node);
    return found.node;
  }

  function removeNode(tree, id) {
    const found = findNode(tree, id);
    if (!found || !found.parent) return false;
    found.parent.children.splice(found.index, 1);
    return true;
  }

  const api = { createDefaultTree, generateId, findNode, insertNode, updateNode, moveNode, removeNode };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneBookmarksStore = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
