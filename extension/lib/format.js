"use strict";
(function (root) {
  const escH = (s) => s ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") : "";
  const safeUrl = (raw) => {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
    try {
      const u = new URL(withScheme);
      if (u.protocol !== "https:" && u.protocol !== "http:") return "";
      return u.href;
    } catch {
      return "";
    }
  };
  const api = { escH, safeUrl };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneFormat = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
