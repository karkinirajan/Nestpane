"use strict";
// The edges of HTML escaping and URL cleaning, pinned by mutation testing (see tests/mutation/content-mutants.mjs). Everything the app
// writes into innerHTML or an href goes through these two functions.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { escH, safeUrl } = require("../lib/format.js");

test("escH escapes each of the five characters on its own, and never escapes twice", () => {
  assert.equal(escH("&"), "&amp;");
  assert.equal(escH("<"), "&lt;");
  assert.equal(escH(">"), "&gt;");
  assert.equal(escH('"'), "&quot;");
  assert.equal(escH("'"), "&#39;");
  assert.equal(escH("a & b"), "a &amp; b");
  assert.equal(escH("&lt;"), "&amp;lt;", "text that already looks escaped is escaped as text");
});

test("escH turns a script tag into inert text and passes other values through as text", () => {
  assert.equal(escH("<script>alert('x')</script>"), "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
  assert.equal(escH(42), "42");
  assert.equal(escH("plain"), "plain");
});

test("safeUrl accepts a scheme in any case and a surrounding space", () => {
  assert.equal(safeUrl("HTTPS://Example.com/Path"), "https://example.com/Path");
  assert.equal(safeUrl("HTTP://example.com"), "http://example.com/");
  assert.equal(safeUrl("  example.com  "), "https://example.com/");
});

test("safeUrl returns an empty string for a missing value and for things that are not web addresses", () => {
  for (const bad of [undefined, null, "", "   ", "javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>x</b>", "not a url at all???"]) {
    assert.equal(safeUrl(bad), "", String(bad));
  }
});

test("safeUrl returns the cleaned-up address, not what was typed", () => {
  assert.equal(safeUrl("example.com"), "https://example.com/");
  assert.equal(safeUrl("https://EXAMPLE.com:443/a b"), "https://example.com/a%20b");
});
