"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { escH, safeUrl } = require("../lib/format.js");

test("escH escapes all five HTML-significant characters", () => {
  assert.equal(escH(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

test("escH returns empty string for falsy input", () => {
  assert.equal(escH(""), "");
  assert.equal(escH(null), "");
  assert.equal(escH(undefined), "");
});

test("escH neutralizes an attribute-breakout attempt using single quotes", () => {
  const malicious = `' onmouseover='alert(1)`;
  const escaped = escH(malicious);
  assert.ok(!escaped.includes("'"), "no raw single quote should survive escaping");
});

test("safeUrl allows http/https and assumes https when no scheme given", () => {
  assert.equal(safeUrl("example.com"), "https://example.com/");
  assert.equal(safeUrl("http://example.com"), "http://example.com/");
});

test("safeUrl rejects javascript: URIs", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "");
});

test("safeUrl rejects empty/garbage input", () => {
  assert.equal(safeUrl(""), "");
  assert.equal(safeUrl("   "), "");
  assert.equal(safeUrl("not a url at all???"), "");
});
