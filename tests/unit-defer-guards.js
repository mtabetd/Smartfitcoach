'use strict';
// Step 2: verify all SFCSymbiosis/SFCEngine call sites are guarded
// so defer on those scripts is safe (engines may not be loaded yet).

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0;
var failed = 0;

function test(name, fn) {
  try { fn(); console.log('\x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('\x1b[31m✗\x1b[0m', name); console.error('  ', e.message); failed++; }
}

var appDir = path.join(__dirname, '..', 'app');

function readFile(name) {
  return fs.readFileSync(path.join(appDir, name), 'utf8');
}

// Finds lines that call symbol.method() but have no guard for `symbol` within
// the preceding 8 lines (covering multi-line if blocks).
function findUnguardedCalls(src, symbol) {
  var lines = src.split('\n');
  var bad = [];
  var methodCallRe = new RegExp('window\\.' + symbol + '\\s*\\.\\s*\\w+\\s*[\\(]');
  var ternaryGuardRe = new RegExp('window\\.' + symbol + '\\s*\\?');
  var guardRe = new RegExp('window\\.' + symbol + '\\s*&&');

  lines.forEach(function(line, i) {
    if (!/window\./.test(line)) return;
    if (!methodCallRe.test(line)) return;
    if (/^\s*\/\//.test(line)) return;
    // Ternary guard on same line
    if (ternaryGuardRe.test(line)) return;
    // Guard on same line
    if (guardRe.test(line)) return;
    // Check up to 8 preceding lines for a guard block
    var start = Math.max(0, i - 8);
    var ctx = lines.slice(start, i).join('\n');
    if (guardRe.test(ctx)) return;
    bad.push((i + 1) + ': ' + line.trim().slice(0, 100));
  });
  return bad;
}

test('SFCSymbiosis calls in app-sport.js are guarded', function() {
  var src = readFile('app-sport.js');
  var bad = findUnguardedCalls(src, 'SFCSymbiosis');
  assert.strictEqual(bad.length, 0,
    'Unguarded SFCSymbiosis calls:\n' + bad.join('\n'));
});

test('SFCEngine calls in app-sport.js are guarded', function() {
  var src = readFile('app-sport.js');
  var bad = findUnguardedCalls(src, 'SFCEngine');
  assert.strictEqual(bad.length, 0,
    'Unguarded SFCEngine calls:\n' + bad.join('\n'));
});

test('SFCSymbiosis guard simulation: safe when window.SFCSymbiosis is undefined', function() {
  var window = {};
  var result = null;
  if (window.SFCSymbiosis && window.SFCSymbiosis.getPeriodizationCfg) {
    result = window.SFCSymbiosis.getPeriodizationCfg();
  }
  assert.strictEqual(result, null, 'no crash when SFCSymbiosis not loaded');
});

test('SFCSymbiosis guard simulation: works when loaded', function() {
  var window = {
    SFCSymbiosis: {
      getPeriodizationCfg: function() { return { phases: [] }; }
    }
  };
  var result = null;
  if (window.SFCSymbiosis && window.SFCSymbiosis.getPeriodizationCfg) {
    result = window.SFCSymbiosis.getPeriodizationCfg();
  }
  assert.ok(result && Array.isArray(result.phases), 'works when SFCSymbiosis loaded');
});

test('SFCEngine guard simulation: safe when not loaded', function() {
  var window = {};
  var result = null;
  if (window.SFCEngine && window.SFCEngine.sanitizeSessionInput) {
    result = window.SFCEngine.sanitizeSessionInput({});
  }
  assert.strictEqual(result, null, 'no crash when SFCEngine not loaded');
});

console.log('\n─────────────────────────────────────────');
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) / ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
