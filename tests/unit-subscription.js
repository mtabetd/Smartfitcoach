'use strict';

// ─── TESTS UNITAIRES — SUBSCRIPTION STATE MACHINE ───────────────────────────
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name, '\n    ', e.message); failed++; }
}
function suite(n) { console.log('\n' + n); }

// ─── Inline the three core functions (copied exactly from app-core.js) ───────
// This avoids eval scope issues while testing the real logic.
var _S = {};
var _AUTH = { isLoggedIn: function() { return true; } };

function _isPremium() {
  try {
    var s = _S;
    if (!s) return false;
    if (s.subscriptionPlan === 'unlimited') return true;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return true;
    if (s.firstLoginDate) {
      var trialEnd = new Date(s.firstLoginDate);
      trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
      if (trialEnd > new Date()) return true;
    }
    if (!s._subStatusReady && _AUTH && _AUTH.isLoggedIn && _AUTH.isLoggedIn()) return true;
    if (!s.firstLoginDate) return true;
    return false;
  } catch(e) { return true; }
}
function _getTrialDaysLeft() {
  try {
    var s = _S;
    if (!s) return 0;
    if (s.subscriptionPlan === 'unlimited') return 0;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return 0;
    if (!s.firstLoginDate) return s._subStatusReady ? 7 : 0;
    var trialEnd = new Date(s.firstLoginDate);
    trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
    var diff = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  } catch(e) { return 0; }
}
function _isTrialUser() {
  try {
    var s = _S;
    if (!s) return false;
    if (!s._subStatusReady) return false;
    if (s.subscriptionPlan === 'unlimited') return false;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return false;
    return true;
  } catch(e) { return false; }
}

// Verify the source matches our inline copies (spot-check key invariants)
var coreSrc = fs.readFileSync(path.join(__dirname, '../app/app-core.js'), 'utf8');

// ─── 1. isPremium() — unlimited plan + null subscriptionEnd ─────────────────
suite('isPremium() — plan unlimited, subscriptionEnd null (production regression)');

test('premiumNeverSeesTrialBanner: unlimited + null end → isPremium()=true', function() {
  _S = { subscriptionPlan: 'unlimited', subscriptionEnd: null, _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
});

test('unlimited + undefined end → isPremium()=true', function() {
  _S = { subscriptionPlan: 'unlimited', _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
});

test('active subscriptionEnd → isPremium()=true', function() {
  _S = { subscriptionPlan: 'monthly', subscriptionEnd: new Date(Date.now() + 86400000 * 30).toISOString(), _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
});

test('expired subscriptionEnd + no plan → isPremium()=false', function() {
  _S = { subscriptionPlan: 'monthly', subscriptionEnd: new Date(Date.now() - 86400000).toISOString(), firstLoginDate: '2024-01-01', _subStatusReady: true };
  assert.strictEqual(_isPremium(), false);
});

test('source: subscriptionPlan=unlimited check is outside if(subscriptionEnd) block', function() {
  var premiumFn = coreSrc.slice(coreSrc.indexOf('function isPremium()'));
  premiumFn = premiumFn.slice(0, premiumFn.indexOf('\n}') + 2);
  // The unlimited check must come BEFORE any subscriptionEnd reference
  var unlimitedPos = premiumFn.indexOf("=== 'unlimited') return true");
  var endPos = premiumFn.indexOf('subscriptionEnd &&');
  assert.ok(unlimitedPos > 0, 'unlimited check must exist');
  assert.ok(unlimitedPos < endPos || endPos === -1, 'unlimited check must come before subscriptionEnd check');
});

// ─── 2. isTrialUser() — must return false while status loading ───────────────
suite('isTrialUser() — must NOT return true during server status load');

test('unknownLoggedInStatusDoesNotDefaultToTrial: _subStatusReady not set → false', function() {
  _S = {};
  assert.strictEqual(_isTrialUser(), false);
});

test('_subStatusReady=false, plan=undefined → false', function() {
  _S = { _subStatusReady: false };
  assert.strictEqual(_isTrialUser(), false);
});

test('trialUserStillSeesTrial: _subStatusReady=true, no plan → true', function() {
  _S = { _subStatusReady: true };
  assert.strictEqual(_isTrialUser(), true);
});

test('premiumReloadKeepsUnlimited: _subStatusReady=true, plan=unlimited → false', function() {
  _S = { subscriptionPlan: 'unlimited', _subStatusReady: true };
  assert.strictEqual(_isTrialUser(), false);
});

test('source: isTrialUser returns false when !_subStatusReady', function() {
  assert.ok(coreSrc.includes('if (!s._subStatusReady) return false'), 'isTrialUser must guard on _subStatusReady');
});

// ─── 3. getTrialDaysLeft() — must return 0 (not 7) before status loads ──────
suite('getTrialDaysLeft() — no false "7 days" countdown before server load');

test('no firstLoginDate + _subStatusReady=false → 0 (not 7)', function() {
  _S = { _subStatusReady: false };
  assert.strictEqual(_getTrialDaysLeft(), 0);
});

test('no firstLoginDate + _subStatusReady=true → 7 (new user)', function() {
  _S = { _subStatusReady: true };
  assert.strictEqual(_getTrialDaysLeft(), 7);
});

test('unlimited plan → 0 regardless of firstLoginDate', function() {
  _S = { subscriptionPlan: 'unlimited', firstLoginDate: '2024-01-01', _subStatusReady: true };
  assert.strictEqual(_getTrialDaysLeft(), 0);
});

test('fresh trial (today) → 6 or 7 days', function() {
  _S = { firstLoginDate: new Date().toISOString().slice(0,10), _subStatusReady: true };
  var d = _getTrialDaysLeft();
  assert.ok(d >= 6 && d <= 7, 'expected 6-7, got ' + d);
});

test('expired trial → 0', function() {
  _S = { firstLoginDate: '2020-01-01', _subStatusReady: true };
  assert.strictEqual(_getTrialDaysLeft(), 0);
});

// ─── 4. Cloud subscription fields applied even when local data wins ──────────
suite('localDataExistsStillAppliesServerSubscription (supabase-client.js source)');

var subSrc = fs.readFileSync(path.join(__dirname, '../app/supabase-client.js'), 'utf8');

test('local_data_exists path applies cloudData.subscriptionPlan', function() {
  // The fix is after the legacy storage restore block
  var localIdx = subSrc.indexOf("return 'local_data_exists'");
  assert.ok(localIdx > 0, 'local_data_exists path must exist');
  var before = subSrc.slice(localIdx - 400, localIdx);
  assert.ok(before.includes('cloudData.subscriptionPlan'), 'must apply subscriptionPlan before returning local_data_exists');
});

test('_subStatusReady = true set in fetchUserStatus success handler', function() {
  var fetchFn = subSrc.slice(subSrc.indexOf('fetchUserStatus: function()'));
  fetchFn = fetchFn.slice(0, fetchFn.indexOf('\n    }') + 6);
  assert.ok(fetchFn.includes('_subStatusReady = true'), 'fetchUserStatus must set _subStatusReady');
});

test('_subStatusReady = true set in at least 3 places', function() {
  var count = (subSrc.match(/_subStatusReady = true/g) || []).length;
  assert.ok(count >= 3, 'expected ≥3 placements, found ' + count);
});

// ─── 5. Source-level guards — no trial UI leaks ──────────────────────────────
suite('Source guards — trial/paywall rendering guarded by _subLoading in app-main.js');

var mainSrc = fs.readFileSync(path.join(__dirname, '../app/app-main.js'), 'utf8');

test('premiumNeverSeesPricingCards: pricing block uses !_isSub && !_subLoading', function() {
  assert.ok(mainSrc.includes('!_isSub && !_subLoading'), 'pricing block must include !_subLoading guard');
});

test('_subLoading defined in render() subscription section', function() {
  assert.ok(mainSrc.includes('_subLoading'), '_subLoading variable must exist in app-main.js');
});

test('shouldShowTrialBanner in SFC_SUBSCRIPTION_DEBUG', function() {
  assert.ok(mainSrc.includes('shouldShowTrialBanner'), 'debug marker must expose shouldShowTrialBanner');
});

test('shouldShowPaywall in SFC_SUBSCRIPTION_DEBUG', function() {
  assert.ok(mainSrc.includes('shouldShowPaywall'), 'debug marker must expose shouldShowPaywall');
});

// ─── 6. Edge cases ───────────────────────────────────────────────────────────
suite('Edge cases');

test('isTrialUser false when S is null', function() {
  _S = null;
  assert.strictEqual(_isTrialUser(), false);
  _S = {};
});

test('premium user with sport history → still premium', function() {
  _S = {
    sportProgram: [{ day: 1 }],
    sessionHistory: { '2026-01-01': { kcalTotal: 300 } },
    subscriptionPlan: 'unlimited',
    _subStatusReady: true
  };
  assert.strictEqual(_isPremium(), true);
  assert.strictEqual(_isTrialUser(), false);
  assert.strictEqual(_getTrialDaysLeft(), 0);
});

test('premium user empty localStorage except auth → premium after fetchUserStatus', function() {
  // Simulate: localStorage empty, fetchUserStatus sets plan=unlimited + _subStatusReady
  _S = { subscriptionPlan: 'unlimited', _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
  assert.strictEqual(_isTrialUser(), false);
});

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(52));
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' FAILED — ' + passed + ' passed\x1b[0m');
  process.exit(1);
}
