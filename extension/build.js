#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const manifest = require("./manifest.json");
const VERSION = manifest.version;
const WATCH = process.argv.includes("--watch");
const MINIFY = !WATCH; // full minification on build, skipped in watch for speed

const REQUIRED_FILES = [
  "manifest.json",
  "newtab.html",
  "app.js",
  "style.css",
  "fouc.js",
  "icons/favicon.svg",
  "icons/favicon.png",
  "icons/icon-16.png",
  "icons/icon-48.png",
  "popup.html",
  "popup.js",
  "privacy.html",
  "terms.html",
];

const REQUIRED_PERMISSIONS = [
  "tabs",
  "bookmarks",
  "storage",
  "history",
  "downloads",
  "declarativeNetRequest",
  "search",
];

// Sensitive permissions requested just-in-time via chrome.permissions.request()
// rather than at install — must be in optional_permissions, not permissions.
const REQUIRED_OPTIONAL_PERMISSIONS = [
  "identity",
  "identity.email",
  "geolocation",
  "notifications",
];

// The real, CWS-assigned ID for this item (confirmed from a rejection email's
// "Item ID" field — do not trust a manifest "key" over this without checking
// the Developer Dashboard first: a prior "key" in this repo computed to a
// DIFFERENT id and caused an upload rejection, "key field value in the
// manifest doesn't match the current item"). Keep this in sync with
// app.js's EXPECTED_EXTENSION_ID.
const PUBLISHED_EXTENSION_ID = "aokkcpfoompjgeknhbkphogfcjjlbpol";

// Chrome extension ID derivation: SHA-256 of the DER public key, first 16
// bytes, each nibble mapped through 0-15 -> 'a'-'p'. Lets us print the ID a
// given manifest "key" will produce so it can be diff'd against the live
// Chrome Web Store listing before packaging.
function extensionIdFromKey(base64Key) {
  const der = Buffer.from(base64Key, "base64");
  const digest = crypto.createHash("sha256").update(der).digest();
  const map = "abcdefghijklmnop";
  let id = "";
  for (const byte of digest.subarray(0, 16)) {
    id += map[byte >> 4] + map[byte & 0x0f];
  }
  return id;
}

function validate() {
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
  const manifestPermissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  const manifestOptionalPermissions = Array.isArray(manifest.optional_permissions)
    ? manifest.optional_permissions
    : [];
  const missingOptionalPermissions = REQUIRED_OPTIONAL_PERMISSIONS.filter(
    (p) => !manifestOptionalPermissions.includes(p),
  );
  if (missingOptionalPermissions.length) {
    console.error(
      "\n✗ Missing manifest optional_permissions:",
      missingOptionalPermissions.join(", "),
    );
    ok = false;
  }
  const missingPermissions = REQUIRED_PERMISSIONS.filter((p) => !manifestPermissions.includes(p));
  if (missingPermissions.length) {
    console.error("\n✗ Missing manifest permissions:", missingPermissions.join(", "));
    ok = false;
  } else {
    console.log("\n✓ Manifest permissions OK (" + manifestPermissions.join(", ") + ")");
  }
  // The "key" field is OPTIONAL on CWS updates to an already-published item
  // — the store keeps using its own assigned ID regardless of what's here,
  // and only rejects the upload if a key IS present and computes to a
  // DIFFERENT id than the live listing. So the dangerous state is a WRONG
  // key, not a missing one: fail loudly only on a mismatch, since that's
  // what actually breaks an upload (confirmed by a real CWS rejection).
  // A present+missing key still affects unpacked/local-dev testing, where
  // the ID is what the Chrome Extension-type OAuth client is bound to —
  // that's a dev-convenience concern, not a packaging blocker, so it's a warning.
  if (typeof manifest.key !== "string" || !manifest.key.trim()) {
    console.warn("\n⚠ manifest.json has no \"key\" field.");
    console.warn(`  CWS will still publish this update under its existing id (${PUBLISHED_EXTENSION_ID}).`);
    console.warn("  Unpacked/local dev loads will get a different, machine-dependent id instead —");
    console.warn("  fine for CWS uploads, but Google sign-in (chrome.identity.getAuthToken) won't work");
    console.warn("  locally until the real public key (Dashboard → Package tab) is added back here.");
  } else {
    try {
      const id = extensionIdFromKey(manifest.key);
      if (id !== PUBLISHED_EXTENSION_ID) {
        console.error(`\n✗ manifest "key" computes to "${id}", but the published item is "${PUBLISHED_EXTENSION_ID}".`);
        console.error("  Uploading this will be rejected by CWS: \"key field value in the manifest");
        console.error("  doesn't match the current item.\" Remove the key, or replace it with the");
        console.error("  real public key from Developer Dashboard → your item → Package tab.");
        ok = false;
      } else {
        console.log(`\n✓ manifest key present — computed extension ID matches published item: ${id}`);
      }
    } catch (e) {
      console.error("\n✗ manifest.json \"key\" is not valid base64:", e.message);
      ok = false;
    }
  }
  console.log("  Name:", manifest.name, "v" + VERSION);
  return ok;
}

async function build() {
  if (!validate()) {
    console.error("\nBuild validation failed. Fix the issues above before packaging.");
    process.exit(1);
  }

  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST);

  // Copy non-JS/CSS files verbatim
  const staticFiles = REQUIRED_FILES.filter((f) => !f.endsWith(".js") && !f.endsWith(".css"));
  console.log("\nCopying static files to dist/...");
  staticFiles.forEach((file) => {
    const dest = path.join(DIST, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), dest);
    console.log("  ✓", file);
  });

  // Try esbuild minification for JS/CSS; fall back to raw copy if not installed
  let esbuild;
  try { esbuild = require("esbuild"); } catch { /* not installed */ }

  const jsFiles = REQUIRED_FILES.filter((f) => f.endsWith(".js"));
  const cssFiles = REQUIRED_FILES.filter((f) => f.endsWith(".css"));

  if (esbuild && MINIFY) {
    console.log("\nMinifying JS/CSS with esbuild...");
    for (const file of jsFiles) {
      const result = await esbuild.transform(fs.readFileSync(path.join(ROOT, file), "utf8"), {
        minify: true,
        target: "chrome110",
        loader: "js",
      });
      fs.writeFileSync(path.join(DIST, file), result.code);
      const orig = fs.statSync(path.join(ROOT, file)).size;
      const min = result.code.length;
      console.log(`  ✓ ${file} (${(orig/1024).toFixed(1)}kB → ${(min/1024).toFixed(1)}kB, ${Math.round((1-min/orig)*100)}% smaller)`);
    }
    for (const file of cssFiles) {
      const result = await esbuild.transform(fs.readFileSync(path.join(ROOT, file), "utf8"), {
        minify: true,
        loader: "css",
      });
      fs.writeFileSync(path.join(DIST, file), result.code);
      const orig = fs.statSync(path.join(ROOT, file)).size;
      const min = result.code.length;
      console.log(`  ✓ ${file} (${(orig/1024).toFixed(1)}kB → ${(min/1024).toFixed(1)}kB, ${Math.round((1-min/orig)*100)}% smaller)`);
    }
  } else {
    if (!esbuild) console.log("\nNote: esbuild not installed — run `npm install` to enable minification. Copying files verbatim.");
    [...jsFiles, ...cssFiles].forEach((file) => {
      fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
      console.log("  ✓", file);
    });
  }

  // Copy icons dir
  const iconsDir = path.join(ROOT, "icons");
  const distIconsDir = path.join(DIST, "icons");
  if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir);
  fs.readdirSync(iconsDir).forEach((f) => {
    fs.copyFileSync(path.join(iconsDir, f), path.join(distIconsDir, f));
  });

  console.log("\n✓ Build complete — files ready in dist/");
  console.log("To package: npm run zip");

  if (WATCH) {
    console.log("\nWatch mode: re-running on file change...");
    const chokidar = require("chokidar");
    chokidar.watch([
      path.join(ROOT, "app.js"),
      path.join(ROOT, "style.css"),
      path.join(ROOT, "newtab.html"),
      path.join(ROOT, "popup.js"),
      path.join(ROOT, "manifest.json"),
    ]).on("change", (filePath) => {
      console.log(`\n[${new Date().toLocaleTimeString()}] Changed: ${path.basename(filePath)} — rebuilding...`);
      fs.copyFileSync(filePath, path.join(DIST, path.basename(filePath)));
      console.log("  ✓ Done");
    });
  }
}

build().catch((err) => {
  console.error("Build error:", err);
  process.exit(1);
});
