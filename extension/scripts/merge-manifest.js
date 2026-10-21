"use strict";
/**
 * Deep-merges a per-browser manifest delta onto the base (Chromium) manifest.
 * Plain objects merge key-by-key (recursively); arrays and scalars in the
 * delta replace the base value outright. Keys starting with "_" (like
 * "_comment") are dropped from the result — they're delta-file documentation,
 * not manifest content.
 */
function mergeManifest(base, delta) {
  const result = { ...base };
  for (const [key, value] of Object.entries(delta)) {
    if (key.startsWith("_")) continue;
    const baseValue = result[key];
    const bothPlainObjects =
      value && typeof value === "object" && !Array.isArray(value) &&
      baseValue && typeof baseValue === "object" && !Array.isArray(baseValue);
    result[key] = bothPlainObjects ? mergeManifest(baseValue, value) : value;
  }
  return result;
}

module.exports = { mergeManifest };
