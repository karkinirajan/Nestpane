#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const manifest = require("./manifest.json");
const VERSION = manifest.version;

const REQUIRED_FILES = [
  "manifest.json",
  "newtab.html",
  "app.js",
  "style.css",
  "fouc.js",
  "favicon.svg",
  "favicon.png",
  "icon-16.png",
  "icon-48.png",
  "popup.html",
  "popup.js",
];

const REQUIRED_PERMISSIONS = [
  "tabs",
  "bookmarks",
  "storage",
  "history",
  "downloads",
];

let ok = true;

console.log("Validating source files...");
REQUIRED_FILES.forEach((file) => {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src)) {
    console.log("  ✓", file);
  } else {
    console.error("  ✗", file, "(MISSING)");
    ok = false;
  }
});

const manifestPermissions = Array.isArray(manifest.permissions)
  ? manifest.permissions
  : [];
const missingPermissions = REQUIRED_PERMISSIONS.filter(
  (p) => !manifestPermissions.includes(p),
);
if (missingPermissions.length) {
  console.error("\n✗ Missing manifest permissions:", missingPermissions.join(", "));
  ok = false;
} else {
  console.log("\n✓ Manifest permissions OK (" + manifestPermissions.join(", ") + ")");
}
console.log("  Name:", manifest.name, "v" + VERSION);

if (!ok) {
  console.error("\nBuild validation failed. Fix the issues above before packaging.");
  process.exit(1);
}

if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST);
} else {
  fs.readdirSync(DIST).forEach((f) => {
    const fp = path.join(DIST, f);
    if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
  });
}

console.log("\nCopying to dist/...");
REQUIRED_FILES.forEach((file) => {
  fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
  console.log("  ✓", file);
});

console.log("\n✓ Build complete — files ready in dist/");
console.log("\nTo package for Chrome / Edge / Brave / Arc:");
console.log("  cd dist && zip -r ../novatab-v" + VERSION + "-chrome.zip . && cd ..");
