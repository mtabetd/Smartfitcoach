'use strict';
// ─── TESTS — Session History ──────────────────────────────────────────────────
// Usage: node tests/test-session-history.js

var SH = require('../app/session-history.js');

// ── Harness ───────────────────────────────────────────────────────────────────
var passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write('  \x1b[32m✓\x1b[0m ' + name + '\n');
  } catch (e) {
    failed++;
    process.stdout.write('  \x1b[31m✗\x1b[0m ' + name + ' — ' + e.message + '\n');
  }
}
function assert(cond, msg)  { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error((msg || '') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}

// Reset between tests
function reset() { SH.clearSessionHistory(); }

// ── Basic API ─────────────────────────────────────────────────────────────────
console.log('\ngetSessionHistory');

test('returns empty array when no history', function () {
  reset();
  var h = SH.getSessionHistory();
  assert(Array.isArray(h), 'must return array');
  assertEqual(h.length, 0, 'length');
});

test('returns array after save', function () {
  reset();
  SH.saveSession('hiit-b-01');
  var h = SH.getSessionHistory();
  assert(Array.isArray(h) && h.length === 1, 'expected 1 entry, got ' + h.length);
});

// ── saveSession ───────────────────────────────────────────────────────────────
console.log('\nsaveSession');

test('stores workout ID at position 0 (most recent first)', function () {
  reset();
  SH.saveSession('hiit-b-01');
  SH.saveSession('z2-b-02');
  var h = SH.getSessionHistory();
  assertEqual(h[0], 'z2-b-02', 'most recent must be first');
  assertEqual(h[1], 'hiit-b-01', 'second entry');
});

test('caps history at 10 entries', function () {
  reset();
  for (var i = 1; i <= 12; i++) {
    SH.saveSession('hiit-b-' + String(i).padStart(2, '0'));
  }
  var h = SH.getSessionHistory();
  assert(h.length === 10, 'expected 10 entries, got ' + h.length);
  assertEqual(h[0], 'hiit-b-12', 'most recent must be first after cap');
});

test('preserves order across consecutive saves', function () {
  reset();
  var ids = ['hiit-b-01', 'z2-b-01', 'mix-b-01', 'hvy-i-01'];
  ids.forEach(function (id) { SH.saveSession(id); });
  var h = SH.getSessionHistory();
  assertEqual(h[0], 'hvy-i-01');
  assertEqual(h[1], 'mix-b-01');
  assertEqual(h[2], 'z2-b-01');
  assertEqual(h[3], 'hiit-b-01');
});

test('same ID can be stored twice (represents two sessions)', function () {
  reset();
  SH.saveSession('hiit-b-01');
  SH.saveSession('hiit-b-01');
  var h = SH.getSessionHistory();
  assertEqual(h.length, 2, 'two separate session entries');
  assertEqual(h[0], 'hiit-b-01');
  assertEqual(h[1], 'hiit-b-01');
});

test('ignores empty string', function () {
  reset();
  SH.saveSession('');
  assertEqual(SH.getSessionHistory().length, 0, 'empty string must not be stored');
});

test('ignores null and undefined', function () {
  reset();
  SH.saveSession(null);
  SH.saveSession(undefined);
  assertEqual(SH.getSessionHistory().length, 0, 'null/undefined must not be stored');
});

// ── clearSessionHistory ───────────────────────────────────────────────────────
console.log('\nclearSessionHistory');

test('resets history to empty', function () {
  reset();
  SH.saveSession('hiit-b-01');
  SH.saveSession('z2-b-01');
  SH.clearSessionHistory();
  assertEqual(SH.getSessionHistory().length, 0, 'history must be empty after clear');
});

test('save after clear works normally', function () {
  reset();
  SH.saveSession('vol-b-01');
  SH.clearSessionHistory();
  SH.saveSession('tmp-i-01');
  var h = SH.getSessionHistory();
  assertEqual(h.length, 1);
  assertEqual(h[0], 'tmp-i-01');
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') +
  'Results: ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
process.exit(failed > 0 ? 1 : 0);
