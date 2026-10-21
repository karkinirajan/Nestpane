"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mergeManifest } = require("../scripts/merge-manifest.js");

test("merges new top-level keys from the delta onto the base", () => {
  const base = { name: "Nestpane", version: "2.1.0" };
  const delta = { browser_specific_settings: { gecko: { id: "nestpane@kneeraazon.com" } } };
  const merged = mergeManifest(base, delta);
  assert.equal(merged.name, "Nestpane");
  assert.deepEqual(merged.browser_specific_settings, { gecko: { id: "nestpane@kneeraazon.com" } });
});

test("deep-merges nested objects instead of replacing the whole branch", () => {
  const base = { oauth2: { client_id: "abc", scopes: ["a", "b"] } };
  const delta = { oauth2: { client_id: "xyz" } };
  const merged = mergeManifest(base, delta);
  assert.equal(merged.oauth2.client_id, "xyz");
  assert.deepEqual(merged.oauth2.scopes, ["a", "b"], "untouched nested keys must survive the merge");
});

test("array values in the delta replace the base array, not merge element-wise", () => {
  const base = { permissions: ["tabs", "storage"] };
  const delta = { permissions: ["tabs"] };
  const merged = mergeManifest(base, delta);
  assert.deepEqual(merged.permissions, ["tabs"]);
});

test("keys starting with underscore are dropped (delta-file documentation, not manifest content)", () => {
  const merged = mergeManifest({ name: "Nestpane" }, { _comment: "doc text", version: "2.1.0" });
  assert.equal(merged._comment, undefined);
  assert.equal(merged.version, "2.1.0");
});

test("does not mutate the base object", () => {
  const base = { oauth2: { client_id: "abc" } };
  mergeManifest(base, { oauth2: { client_id: "xyz" } });
  assert.equal(base.oauth2.client_id, "abc");
});
