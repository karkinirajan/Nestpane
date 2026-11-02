#!/usr/bin/env node
"use strict";
/**
 * Dependency-free, reproducible ZIP writer for the Chrome Web Store package.
 * Same inputs always give the same bytes: entries are sorted, timestamps are
 * fixed, and no host-specific attributes are stored.
 *
 *   node scripts/zip-dist.js [distDir] [outFile]
 *
 * Defaults: dist/ -> nestpane-v<package.json version>-chrome.zip
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const DOS_DATE = (0 << 9) | (1 << 5) | 1;
const DOS_TIME = 0;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out.sort();
}

function createZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const stored = deflated.length >= data.length;
    const body = stored ? data : deflated;
    const method = stored ? 0 : 8;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(((0o100644 << 16) >>> 0), 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

function zipDirectory(distDir, outFile) {
  if (!fs.existsSync(distDir)) throw new Error(`${distDir} does not exist - run "npm run build" first`);
  const names = listFiles(distDir);
  if (!names.length) throw new Error(`${distDir} is empty`);
  const entries = names.map((name) => ({ name, data: fs.readFileSync(path.join(distDir, name)) }));
  fs.writeFileSync(outFile, createZip(entries));
  return { files: names.length, bytes: fs.statSync(outFile).size };
}

module.exports = { createZip, zipDirectory, crc32, listFiles };

if (require.main === module) {
  const root = path.join(__dirname, "..");
  const distDir = path.resolve(process.argv[2] || path.join(root, "dist"));
  const version = require(path.join(root, "package.json")).version;
  const outFile = path.resolve(process.argv[3] || path.join(root, `nestpane-v${version}-chrome.zip`));
  const { files, bytes } = zipDirectory(distDir, outFile);
  console.log(`✓ ${path.basename(outFile)} — ${files} files, ${(bytes / 1024).toFixed(1)} kB`);
}
