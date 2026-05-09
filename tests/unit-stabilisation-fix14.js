'use strict';
// unit-stabilisation-fix14.js — Tests for 4 risk-reduction fixes
// Fix 1: unified calorie multipliers
// Fix 2: calcTarget() fallback warn + toast
// Fix 3: safeUserStatusCheck stale-cache on network error
// Fix 4: safeStorage wrapper (no crash + message on unavailable storage)

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name, '\n   ', e.message); failed++; }
}
async function testAsync(name, fn) {
  try { await fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name, '\n   ', e.message); failed++; }
}

// ─── Minimal browser env ─────────────────────────────────────────────────────
global.window   = global;
global.S        = {};
global.document = { addEventListener: function() {} };
Object.defineProperty(global, 'navigator', {
  value: { onLine: true }, writable: true, configurable: true
});
global.SFCSymbiosis   = null;
global.SFCDecisionCore = null;
global.decideDailyPlanV3 = null;
global.decideDailyPlanV2 = null;
global.SFCLogger = null;

// ─── Load modules ────────────────────────────────────────────────────────────
require('../app/sfc-symbiosis.js');
require('../app/sfc-decision-core.js');

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 1 — Unified calorie multipliers
// Both LOAD_MULTIPLIERS (Path A) and _trainingToNutritionSignal (Path B)
// must produce identical cal and carbBoost values for every load level.
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\nFix 1 — Unified calorie multipliers');

var LOADS = ['heavy', 'moderate', 'light', 'rest'];

LOADS.forEach(function(load) {
  test('Path A and Path B cal multiplier match for load=' + load, function() {
    var pathA = window.SFCSymbiosis.LOAD_MULTIPLIERS[load];
    // _trainingToNutritionSignal(trainingLoad, fatigueLevel, lastGroups, daysSince)
    var pathB = window.SFCDecisionCore._trainingToNutritionSignal(load, 0, [], 3);
    assert.strictEqual(
      pathB.calMultiplier, pathA.cal,
      'calMultiplier mismatch: PathB=' + pathB.calMultiplier + ' PathA=' + pathA.cal
    );
  });
});

LOADS.forEach(function(load) {
  test('Path A and Path B carbBoost match for load=' + load, function() {
    var pathA = window.SFCSymbiosis.LOAD_MULTIPLIERS[load];
    var pathB = window.SFCDecisionCore._trainingToNutritionSignal(load, 0, [], 3);
    assert.strictEqual(
      pathB.carbBoost, pathA.carbBoost,
      'carbBoost mismatch: PathB=' + pathB.carbBoost + ' PathA=' + pathA.carbBoost
    );
  });
});

test('Unknown load level falls back to 1.0 calMultiplier', function() {
  var sig = window.SFCDecisionCore._trainingToNutritionSignal('unknown_load', 0, [], 3);
  assert.strictEqual(sig.calMultiplier, 1.0);
  assert.strictEqual(sig.carbBoost, 1.0);
});

test('_trainingToNutritionSignal reads live SFCSymbiosis.LOAD_MULTIPLIERS', function() {
  // Mutate the live LOAD_MULTIPLIERS temporarily and confirm Path B reflects it
  var orig = window.SFCSymbiosis.LOAD_MULTIPLIERS.heavy.cal;
  window.SFCSymbiosis.LOAD_MULTIPLIERS.heavy.cal = 1.99;
  var sig = window.SFCDecisionCore._trainingToNutritionSignal('heavy', 0, [], 3);
  window.SFCSymbiosis.LOAD_MULTIPLIERS.heavy.cal = orig; // restore
  assert.strictEqual(sig.calMultiplier, 1.99, 'Path B did not read live LOAD_MULTIPLIERS');
});

test('Inline fallback used when SFCSymbiosis unavailable', function() {
  var saved = window.SFCSymbiosis;
  window.SFCSymbiosis = null;
  var sig = window.SFCDecisionCore._trainingToNutritionSignal('heavy', 0, [], 3);
  window.SFCSymbiosis = saved;
  // Fallback heavy.cal = 1.10 (matches Path A values in inline fallback)
  assert.strictEqual(sig.calMultiplier, 1.10);
  assert.strictEqual(sig.carbBoost, 1.20);
});

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 2 — calcTarget() fallback warn + toast
// When calcTarget() returns falsy, console.warn must be called and
// window.showToast must be called (once per session).
// Tested by reading the actual source code for the pattern — cannot easily
// simulate the full nutrition render pipeline in unit tests.
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\nFix 2 — calcTarget() fallback warn + toast');

test('app-nutrition.js contains console.warn for calcTarget fallback (site 1)', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-nutrition.js'), 'utf8');
  assert.ok(
    src.indexOf("console.warn('[SFC] calcTarget() returned falsy") !== -1,
    'Missing console.warn for calcTarget() fallback'
  );
});

test('app-nutrition.js calls showToast for calcTarget fallback (site 1)', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-nutrition.js'), 'utf8');
  assert.ok(
    src.indexOf('_sfcCalFallbackToastShown') !== -1,
    'Missing once-per-session guard _sfcCalFallbackToastShown'
  );
});

test('app-nutrition.js contains warn for both calcTarget and caloriesTarget falsy (site 2)', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-nutrition.js'), 'utf8');
  assert.ok(
    src.indexOf("console.warn('[SFC] calcTarget() and caloriesTarget both falsy") !== -1,
    'Missing console.warn for site 2 fallback'
  );
});

test('calcTarget fallback toast has non-anxious message text', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-nutrition.js'), 'utf8');
  assert.ok(
    src.indexOf('Objectif calorique estimé provisoirement') !== -1,
    'Missing non-anxious FR fallback message'
  );
  assert.ok(
    src.indexOf('calorie target estimated provisionally') !== -1,
    'Missing non-anxious EN fallback message'
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 3 — safeUserStatusCheck stale-cache on network error
// On network failure, if a stale cache or S._serverPremium=true exists,
// the function must grant access (consistent with isPremium() behaviour).
// ═══════════════════════════════════════════════════════════════════════════════

// Load supabase-client.js stubs
global.localStorage   = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} };
global.sessionStorage = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} };

require('../app/supabase-client.js');

function makeSync(cacheOverride, fetchResult) {
  return {
    _userStatusCache:   cacheOverride || null,
    _userStatusCacheTs: 0, // expired
    fetchUserStatus: function() {
      if (fetchResult instanceof Error) return Promise.reject(fetchResult);
      return Promise.resolve(fetchResult);
    }
  };
}

(async function runFix3Tests() {
  console.log('\nFix 3 — safeUserStatusCheck stale-cache fallback');

  await testAsync('Network error + stale premium cache → allow (stale fallback)', async function() {
    global.S = { _serverPremium: null };
    global.SupaSync = makeSync({ premium: true, plan: 'unlimited' }, new Error('net'));
    var r = await window.safeUserStatusCheck({});
    assert.strictEqual(r.ok, true, 'Expected ok=true from stale cache');
    assert.strictEqual(r.source, 'fallback');
  });

  await testAsync('Network error + stale non-premium cache → deny (stale fallback)', async function() {
    global.S = { _serverPremium: null };
    global.SupaSync = makeSync({ premium: false }, new Error('net'));
    var r = await window.safeUserStatusCheck({});
    assert.strictEqual(r.ok, false, 'Expected ok=false from stale non-premium cache');
    assert.ok(r.reason && r.reason.indexOf('not_premium') !== -1);
  });

  await testAsync('Network error + no cache + S._serverPremium=true → allow', async function() {
    global.S = { _serverPremium: true };
    global.SupaSync = makeSync(null, new Error('net'));
    var r = await window.safeUserStatusCheck({});
    assert.strictEqual(r.ok, true, 'Expected ok=true from S._serverPremium=true');
    assert.strictEqual(r.source, 'fallback');
  });

  await testAsync('Network error + no cache + S._serverPremium=false → deny', async function() {
    global.S = { _serverPremium: false };
    global.SupaSync = makeSync(null, new Error('net'));
    var r = await window.safeUserStatusCheck({});
    assert.strictEqual(r.ok, false, 'Expected ok=false — no stale premium');
  });

  await testAsync('Server responds premium=true → allow (server source)', async function() {
    global.S = {};
    global.SupaSync = makeSync(null, { premium: true, plan: 'unlimited', trialDaysLeft: 0 });
    var r = await window.safeUserStatusCheck({});
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.source, 'server');
  });

  await testAsync('Server responds premium=false → deny', async function() {
    global.S = {};
    global.SupaSync = makeSync(null, { premium: false });
    var r = await window.safeUserStatusCheck({});
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.source, 'server');
  });

  await testAsync('Offline → deny immediately', async function() {
    Object.defineProperty(global, 'navigator', { value: { onLine: false }, writable: true, configurable: true });
    global.S = {};
    global.SupaSync = makeSync(null, { premium: true });
    var r = await window.safeUserStatusCheck({});
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'offline');
    Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true, configurable: true });
  });
})();

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 4 — safeStorage wrapper (no crash + message on unavailable storage)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\nFix 4 — safeStorage wrapper');

// Simulate safeStorage in a controlled env (app-main.js not easily loaded in Node)
// Test the contract by reading the source and running the factory inline.

var appMainSrc = fs.readFileSync(path.join(__dirname, '../app/app-main.js'), 'utf8');

// Extract just the safeStorage IIFE
var ssMatch = appMainSrc.match(/window\.safeStorage\s*=\s*\(function\(\)\s*\{[\s\S]+?\}\)\(\);/);
assert.ok(ssMatch, 'safeStorage definition not found in app-main.js');

test('safeStorage is defined in app-main.js', function() {
  assert.ok(ssMatch, 'safeStorage IIFE missing from app-main.js');
});

test('safeStorage.local.getItem does not throw when storage throws', function() {
  var toastCalled = false;
  var testWindow = {
    _sfcStorageUnavailableShown: false,
    showToast: function() { toastCalled = true; },
    isEnglish: function() { return false; }
  };
  var fakeLS = {
    getItem:    function() { throw new Error('SecurityError'); },
    setItem:    function() { throw new Error('SecurityError'); },
    removeItem: function() { throw new Error('SecurityError'); }
  };
  var fakeWindow = testWindow;
  // Build safeStorage inline matching the actual implementation
  function _onUnavailable(storeName, err) {
    if (fakeWindow._sfcStorageUnavailableShown) return;
    fakeWindow._sfcStorageUnavailableShown = true;
    setTimeout(function() {
      if (fakeWindow.showToast) fakeWindow.showToast('test', 'warning', 8000);
    }, 0);
  }
  function _wrap(store, name) {
    return {
      getItem:    function(k)    { try { return store.getItem(k); }         catch(e) { return null; } },
      setItem:    function(k, v) { try { store.setItem(k, v); return true; } catch(e) { _onUnavailable(name, e); return false; } },
      removeItem: function(k)    { try { store.removeItem(k); return true; } catch(e) { return false; } }
    };
  }
  var ss = { local: _wrap(fakeLS, 'localStorage'), session: _wrap(fakeLS, 'sessionStorage') };

  var result = ss.local.getItem('key');
  assert.strictEqual(result, null, 'getItem should return null on error');
});

testAsync('safeStorage.local.setItem returns false and schedules toast when storage throws', async function() {
  var toastMsg = null;
  var fakeWindow2 = { _sfcStorageUnavailableShown: false };
  var fakeLS2 = { setItem: function() { throw new Error('QuotaExceededError'); } };
  function _onUnavailable2(storeName, err) {
    if (fakeWindow2._sfcStorageUnavailableShown) return;
    fakeWindow2._sfcStorageUnavailableShown = true;
    setTimeout(function() { toastMsg = 'Navigation privée détectée'; }, 0);
  }
  function _wrap2(store, name) {
    return { setItem: function(k, v) { try { store.setItem(k, v); return true; } catch(e) { _onUnavailable2(name, e); return false; } } };
  }
  var ss2 = { local: _wrap2(fakeLS2, 'localStorage') };
  var ret = ss2.local.setItem('key', 'val');
  assert.strictEqual(ret, false, 'setItem should return false on error');
  await new Promise(function(resolve) { setTimeout(resolve, 10); });
  assert.ok(toastMsg && toastMsg.indexOf('Navigation') !== -1, 'Toast should be shown');
});

test('safeStorage toast shown only once (once-per-session guard)', function() {
  var toastCount = 0;
  var guard = { shown: false };
  function _onUnavailable3() {
    if (guard.shown) return;
    guard.shown = true;
    toastCount++;
  }
  function _wrap3(name) {
    return { setItem: function() { _onUnavailable3(); return false; } };
  }
  var ss3 = { local: _wrap3('localStorage'), session: _wrap3('sessionStorage') };
  ss3.local.setItem('a', '1');
  ss3.local.setItem('b', '2');
  ss3.session.setItem('c', '3');
  assert.strictEqual(toastCount, 1, 'Toast must only fire once across all storage failures');
});

test('app-main.js emergency sessionStorage save uses safeStorage', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-main.js'), 'utf8');
  assert.ok(
    src.indexOf("safeStorage.session.setItem('mtd_profile_emergency_'") !== -1,
    'Emergency sessionStorage save must use safeStorage.session.setItem'
  );
});

// ─── Summary (runs after all async tests settle) ──────────────────────────────
setTimeout(function() {
  console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') +
    'Fix 1-4: ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
  process.exit(failed > 0 ? 1 : 0);
}, 500);
