"use strict";
(function (root) {
  const CURRENT_SCHEMA_VERSION = 1;

  // Ordered, idempotent migrations. Each entry's migrate(data) receives the
  // storage object as it stood after every prior migration ran, and must
  // return the next shape. Add new entries here as the storage schema
  // changes; never edit a migration that has already shipped.
  const MIGRATIONS = [
    // v0 -> v1: no data transformation needed. Nestpane 2.0.x never tagged a
    // schema version at all, so this entry only establishes the baseline —
    // it exists so runMigrations() has at least one real step to apply and
    // so `_schemaVersion` starts getting written going forward.
    {
      toVersion: 1,
      migrate(data) {
        return data;
      }
    }
  ];

  /**
   * Runs every migration whose toVersion is greater than fromVersion, in
   * order. On any thrown error, returns the ORIGINAL data unchanged with
   * rolledBack: true — the caller must not persist a partial migration.
   */
  function runMigrations(data, fromVersion) {
    const startVersion = typeof fromVersion === "number" && fromVersion >= 0 ? fromVersion : 0;
    if (startVersion >= CURRENT_SCHEMA_VERSION) {
      return { data, version: startVersion, applied: [], error: null, rolledBack: false };
    }
    let working = { ...data };
    const applied = [];
    for (const step of MIGRATIONS) {
      if (step.toVersion <= startVersion) continue;
      try {
        working = step.migrate(working) || working;
        applied.push(step.toVersion);
      } catch (error) {
        return { data, version: startVersion, applied: [], error, rolledBack: true };
      }
    }
    const finalVersion = applied.length ? Math.max(...applied) : startVersion;
    return { data: working, version: finalVersion, applied, error: null, rolledBack: false };
  }

  const api = { CURRENT_SCHEMA_VERSION, MIGRATIONS, runMigrations };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NestpaneMigrations = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
