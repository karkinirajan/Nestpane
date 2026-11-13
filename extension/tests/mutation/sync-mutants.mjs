// Deliberate bugs in the data-integrity code, one at a time: each must make its unit tests fail.
// Run from extension/ (see mutate.mjs; do not edit the tree while it runs; each `old` must occur exactly once):
//   node tests/mutation/mutate.mjs tests/mutation/sync-mutants.mjs
//
// Not listed, because they cannot change behaviour:
//  - drive-conflict: dropping `if (!remote) return { conflict: false };` (a remote of 0 is already <= the last known save time, which is never below 0);
//  - migrations: `fromVersion >= 0` -> `fromVersion > 0` (a start of 0 and the fallback of 0 are the same value).

const conflict = ["tests/drive-conflict.test.js", "tests/drive-conflict.edges.test.js"];
const snapshots = ["tests/snapshots.test.js", "tests/snapshots.edges.test.js"];
const migrations = ["tests/migrations.test.js", "tests/migrations.edges.test.js"];

const m = (name, file, tests, old, replacement) => ({ name, file, tests, old, new: replacement });
const DC = "lib/drive-conflict.js";
const SN = "lib/snapshots.js";
const MG = "lib/migrations.js";
const SE = "lib/session.js";
const session = ["tests/session.test.js"];

export default [
  // --- when the cloud copy and the local copy disagree
  m("conflict: an unchanged remote is a conflict", DC, conflict, "if (remote <= lastKnown) return { conflict: false };", "if (remote < lastKnown) return { conflict: false };"),
  m("conflict: a remote equal to local is a conflict", DC, conflict, "    if (remote === local) return { conflict: false };\n", ""),
  m("conflict: a real conflict is not reported", DC, conflict, "return { conflict: true, remoteSavedAt: remote };", "return { conflict: false, remoteSavedAt: remote };"),
  m("connect: no file pushes only if it is missing or zero", DC, conflict, "if (!hasRemoteFile && remote <= 0) {", "if (!hasRemoteFile || remote <= 0) {"),
  m("connect: a negative remote counts as none", DC, conflict, "if (!hasRemoteFile && remote <= 0) {", "if (!hasRemoteFile && remote < 0) {"),
  m("connect: a fresh install pulls only with both signs", DC, conflict, "(hasRemoteFile || remote > 0)) {", "(hasRemoteFile && remote > 0)) {"),
  m("connect: a fresh install does not pull", DC, conflict, '    if (isFirstLoginOrFreshInstall && (hasRemoteFile || remote > 0)) {\n      return "pull";\n    }\n', ""),
  m("connect: an equal time pulls", DC, conflict, "if (remote > local) {", "if (remote >= local) {"),
  m("connect: an equal time pushes", DC, conflict, "if (local > remote) {", "if (local >= remote) {"),
  m("connect: nothing to do pushes", DC, conflict, 'return "noop";', 'return "push";'),
  m("after reconcile: a fresh install with a zero remote does not push", DC, conflict, "if (isFirstLoginOrFreshInstall && remote > 0) {", "if (isFirstLoginOrFreshInstall && remote >= 0) {"),
  m("after reconcile: any fresh install does not push", DC, conflict, "if (isFirstLoginOrFreshInstall && remote > 0) {", "if (isFirstLoginOrFreshInstall || remote > 0) {"),
  m("after reconcile: an equal time does not push", DC, conflict, "return local >= remote;", "return local > remote;"),
  // --- the rolling daily snapshots
  m("snapshots: an empty-looking day with journal entries is skipped", SN, snapshots, " && summary.journalDays === 0) {", ") {"),
  m("snapshots: a day with only notes is skipped", SN, snapshots, "summary.notes === 0 && summary.tasks === 0", "summary.tasks === 0"),
  m("snapshots: a day with only tasks is skipped", SN, snapshots, "summary.tasks === 0 && summary.bookmarks === 0", "summary.bookmarks === 0"),
  m("snapshots: a day with only links is skipped", SN, snapshots, "summary.bookmarks === 0 && summary.journalDays === 0", "summary.journalDays === 0"),
  m("snapshots: snapshots nest inside snapshots", SN, snapshots, "    delete slimPayload._snapshots;\n", ""),
  m("snapshots: a day can be stored twice", SN, snapshots, "list.filter((s) => s && s.dateKey !== entry.dateKey)", "list.filter((s) => s)"),
  m("snapshots: the oldest snapshot comes first", SN, snapshots, "(b.savedAt || 0) - (a.savedAt || 0)", "(a.savedAt || 0) - (b.savedAt || 0)"),
  m("snapshots: the limit may reach zero", SN, snapshots, "Math.max(1, maxSnapshots)", "Math.max(0, maxSnapshots)"),
  m("snapshots: eight are kept by default", SN, snapshots, "maxSnapshots = 7", "maxSnapshots = 8"),
  m("snapshots: no date key is still recorded", SN, snapshots, '|| typeof payload !== "object" || !dateKey) {', '|| typeof payload !== "object") {'),
  m("snapshots: the save time is always now", SN, snapshots, "savedAt: payload._savedAt || Date.now(),", "savedAt: Date.now(),"),
  m("snapshots: deleted notes are counted", SN, snapshots, "payload.notes.filter((n) => n && !n._deleted).length", "payload.notes.length"),
  m("snapshots: deleted tasks are counted (list form)", SN, snapshots, "return kanban.filter((c) => c && !c._deleted).length;", "return kanban.length;"),
  m("snapshots: deleted tasks are counted (column form)", SN, snapshots, "count += kanban[col].filter((c) => c && !c._deleted).length;", "count += kanban[col].length;"),
  m("snapshots: the done column is not counted", SN, snapshots, '["todo", "doing", "done"]', '["todo", "doing"]'),
  m("snapshots: a blank journal day counts", SN, snapshots, "v.trim().length > 0", "v.length > 0"),
  m("snapshots: a journal day without text counts", SN, snapshots, "Boolean(v && v.text)", "Boolean(v)"),
  m("snapshots: a snapshot with no summary gets a label", SN, snapshots, 'if (!snapshot || !snapshot.summary) return "Snapshot";', ""),
  // --- schema migrations
  m("migrations: the current version is migrated again", MG, migrations, "if (startVersion >= CURRENT_SCHEMA_VERSION) {", "if (startVersion > CURRENT_SCHEMA_VERSION) {"),
  m("migrations: a non-number version is trusted", MG, migrations, 'typeof fromVersion === "number" && fromVersion >= 0', "fromVersion >= 0"),
  m("migrations: a negative version is trusted", MG, migrations, 'typeof fromVersion === "number" && fromVersion >= 0 ? fromVersion : 0', 'typeof fromVersion === "number" ? fromVersion : 0'),
  m("migrations: a step to the start version runs again", MG, migrations, "if (step.toVersion <= startVersion) continue;", "if (step.toVersion < startVersion) continue;"),
  m("migrations: a step that returns nothing erases the data", MG, migrations, "working = step.migrate(working) || working;", "working = step.migrate(working);"),
  m("migrations: a failed run is not marked rolled back", MG, migrations, "applied: [], error, rolledBack: true };", "applied: [], error, rolledBack: false };"),
  m("migrations: a failed run returns the half-migrated data", MG, migrations, "return { data, version: startVersion, applied: [], error, rolledBack: true };", "return { data: working, version: startVersion, applied: [], error, rolledBack: true };"),
  m("migrations: the input is migrated in place", MG, migrations, "let working = { ...data };", "let working = data;"),
  m("migrations: the final version is the lowest applied", MG, migrations, "Math.max(...applied)", "Math.min(...applied)"),
  m("migrations: the current version is two", MG, migrations, "const CURRENT_SCHEMA_VERSION = 1;", "const CURRENT_SCHEMA_VERSION = 2;"),
  // --- keeping the Google sign-in alive
  m("session: a missing token does not need renewal", SE, session, "if (!expiresAt) return true;", "if (!expiresAt) return false;"),
  m("session: the renewal window is ignored", SE, session, "return now >= expiresAt - RENEW_BEFORE_MS;", "return now >= expiresAt;"),
  m("session: the renewal window boundary is off by one", SE, session, "return now >= expiresAt - RENEW_BEFORE_MS;", "return now > expiresAt - RENEW_BEFORE_MS;"),
  m("session: renewal is scheduled at expiry, not before", SE, session, "return Math.max(expiresAt - RENEW_BEFORE_MS - now, MIN_DELAY_MS);", "return Math.max(expiresAt - now, MIN_DELAY_MS);"),
  m("session: no minimum delay", SE, session, "return Math.max(expiresAt - RENEW_BEFORE_MS - now, MIN_DELAY_MS);", "return expiresAt - RENEW_BEFORE_MS - now;"),
  m("session: an expired token is scheduled from its expiry", SE, session, "if (expiresAt && expiresAt > now) {", "if (expiresAt) {"),
  m("session: backoff does not grow", SE, session, "FIRST_BACKOFF_MS * 2 ** (failures - 1)", "FIRST_BACKOFF_MS * failures"),
  m("session: backoff has no cap", SE, session, "return Math.min(FIRST_BACKOFF_MS * 2 ** (failures - 1), MAX_BACKOFF_MS);", "return FIRST_BACKOFF_MS * 2 ** (failures - 1);"),
  m("session: failures are ignored", SE, session, "if (failures > 0) {", "if (failures > 1) {"),
];
