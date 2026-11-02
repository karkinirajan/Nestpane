"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createZip, zipDirectory, crc32 } = require("../scripts/zip-dist.js");

function readZip(buf) {
  const eocd = buf.length - 22;
  assert.equal(buf.readUInt32LE(eocd), 0x06054b50, "end-of-central-directory signature");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50, "central directory signature");
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const usize = buf.readUInt32LE(p + 24);
    const nlen = buf.readUInt16LE(p + 28);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nlen).toString("utf8");
    const lnlen = buf.readUInt16LE(off + 26);
    const raw = buf.subarray(off + 30 + lnlen, off + 30 + lnlen + csize);
    const data = method === 8 ? zlib.inflateRawSync(raw) : raw;
    assert.equal(data.length, usize, `${name} size`);
    assert.equal(crc32(data), crc, `${name} crc`);
    files[name] = data.toString("utf8");
    p += 46 + nlen;
  }
  return files;
}

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

test("createZip round-trips files, including compressed and stored entries", () => {
  const text = "hello nestpane ".repeat(200);
  const zip = createZip([
    { name: "a.txt", data: Buffer.from(text) },
    { name: "lib/b.js", data: Buffer.from("x") },
    { name: "emoji-✓.txt", data: Buffer.from("ok") }
  ]);
  assert.deepEqual(readZip(zip), { "a.txt": text, "lib/b.js": "x", "emoji-✓.txt": "ok" });
});

test("zipDirectory is reproducible and sorts entries with forward slashes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nestpane-zip-"));
  try {
    fs.mkdirSync(path.join(dir, "icons"));
    fs.writeFileSync(path.join(dir, "manifest.json"), "{}");
    fs.writeFileSync(path.join(dir, "icons", "a.png"), "png");
    const out1 = path.join(dir, "..", `n1-${process.pid}.zip`);
    const out2 = path.join(dir, "..", `n2-${process.pid}.zip`);
    zipDirectory(dir, out1);
    zipDirectory(dir, out2);
    assert.ok(fs.readFileSync(out1).equals(fs.readFileSync(out2)), "identical bytes on repeat runs");
    assert.deepEqual(Object.keys(readZip(fs.readFileSync(out1))), ["icons/a.png", "manifest.json"]);
    fs.rmSync(out1);
    fs.rmSync(out2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("zipDirectory refuses a missing or empty directory", () => {
  assert.throws(() => zipDirectory(path.join(os.tmpdir(), "nestpane-does-not-exist"), "x.zip"), /run "npm run build"/);
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "nestpane-empty-"));
  try {
    assert.throws(() => zipDirectory(empty, "x.zip"), /empty/);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});
