"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  RENEW_BEFORE_MS,
  KEEPALIVE_MS,
  MIN_DELAY_MS,
  MAX_BACKOFF_MS,
  needsRenewal,
  keepAliveDelay
} = require("../lib/session.js");

const NOW = 1_000_000_000;
const MIN = 60 * 1000;

test("a missing token needs renewal", () => {
  assert.equal(needsRenewal(0, NOW), true);
  assert.equal(needsRenewal(undefined, NOW), true);
});

test("an expired token needs renewal", () => {
  assert.equal(needsRenewal(NOW - 1, NOW), true);
});

test("a token with plenty of time left does not need renewal", () => {
  assert.equal(needsRenewal(NOW + 30 * MIN, NOW), false);
});

test("a token inside the renewal window needs renewal", () => {
  assert.equal(needsRenewal(NOW + RENEW_BEFORE_MS - 1, NOW), true);
});

test("the renewal window starts exactly RENEW_BEFORE_MS before expiry", () => {
  assert.equal(needsRenewal(NOW + RENEW_BEFORE_MS, NOW), true);
  assert.equal(needsRenewal(NOW + RENEW_BEFORE_MS + 1, NOW), false);
});

test("renewal is scheduled before the token expires, not after", () => {
  const expiresAt = NOW + 60 * MIN;
  const delay = keepAliveDelay({ failures: 0, expiresAt, now: NOW });
  assert.equal(delay, 60 * MIN - RENEW_BEFORE_MS);
  assert.ok(NOW + delay < expiresAt);
});

test("a token about to expire is checked after the minimum delay, not instantly", () => {
  const delay = keepAliveDelay({ failures: 0, expiresAt: NOW + RENEW_BEFORE_MS + 1000, now: NOW });
  assert.equal(delay, MIN_DELAY_MS);
});

test("an unknown expiry falls back to the regular keep-alive", () => {
  assert.equal(keepAliveDelay({ failures: 0, expiresAt: 0, now: NOW }), KEEPALIVE_MS);
});

test("an already-expired token falls back to the regular keep-alive", () => {
  assert.equal(keepAliveDelay({ failures: 0, expiresAt: NOW - 1, now: NOW }), KEEPALIVE_MS);
});

test("failed renewals back off 1, 2, 4, 8 minutes", () => {
  assert.equal(keepAliveDelay({ failures: 1, expiresAt: 0, now: NOW }), 1 * MIN);
  assert.equal(keepAliveDelay({ failures: 2, expiresAt: 0, now: NOW }), 2 * MIN);
  assert.equal(keepAliveDelay({ failures: 3, expiresAt: 0, now: NOW }), 4 * MIN);
  assert.equal(keepAliveDelay({ failures: 4, expiresAt: 0, now: NOW }), 8 * MIN);
});

test("backoff is capped", () => {
  assert.equal(keepAliveDelay({ failures: 5, expiresAt: 0, now: NOW }), MAX_BACKOFF_MS);
  assert.equal(keepAliveDelay({ failures: 50, expiresAt: 0, now: NOW }), MAX_BACKOFF_MS);
});

test("backoff wins over a known expiry while renewals are failing", () => {
  assert.equal(keepAliveDelay({ failures: 1, expiresAt: NOW + 60 * MIN, now: NOW }), 1 * MIN);
});
