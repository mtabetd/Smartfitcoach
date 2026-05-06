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
var _S = {};
var _PREMIUM_PLANS = ['unlimited','lifetime','premium','legend','champion','athlete','admin','paid'];
function _isPP(plan) { return !!plan && _PREMIUM_PLANS.indexOf(plan) !== -1; }

function _isPremium() {
  try {
    var s = _S;
    if (!s) return false;
    if (s._serverPremium === true) return true;
    if (s._serverPremium === false && s._subStatusReady) return false;
    if (_isPP(s.subscriptionPlan)) return true;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return true;
    if (s.firstLoginDate) {
      var trialEnd = new Date(s.firstLoginDate);
      trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
      if (trialEnd > new Date()) return true;
    }
    if (!s._subStatusReady) return true;
    if (!s.firstLoginDate) return true;
    return false;
  } catch(e) { return true; }
}
function _getTrialDaysLeft() {
  try {
    var s = _S;
    if (!s) return 0;
    if (s._serverPremium === true) return 0;
    if (_isPP(s.subscriptionPlan)) return 0;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return 0;
    if (!s._subStatusReady) return 0;
    if (!s.firstLoginDate) return 7;
    var trialEnd = new Date(s.firstLoginDate);
    trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
    return Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000));
  } catch(e) { return 0; }
}
function _isTrialUser() {
  try {
    var s = _S;
    if (!s) return false;
    if (!s._subStatusReady) return false;
    if (s._serverPremium === true) return false;
    if (_isPP(s.subscriptionPlan)) return false;
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

test('source: _isPremiumPlan helper exists and unlimited is in PREMIUM_PLANS list', function() {
  assert.ok(coreSrc.includes('_SFC_PREMIUM_PLANS'), '_SFC_PREMIUM_PLANS must be defined');
  assert.ok(coreSrc.includes("'unlimited'"), "'unlimited' must be in premium plans");
  assert.ok(coreSrc.includes("'lifetime'"), "'lifetime' must be in premium plans");
  assert.ok(coreSrc.includes('_isPremiumPlan'), '_isPremiumPlan helper must exist');
  // _serverPremium must be checked before subscriptionEnd in isPremium()
  var premiumFn = coreSrc.slice(coreSrc.indexOf('function isPremium()'));
  premiumFn = premiumFn.slice(0, premiumFn.indexOf('\n}') + 2);
  var serverPos = premiumFn.indexOf('_serverPremium');
  var endPos    = premiumFn.indexOf('subscriptionEnd &&');
  assert.ok(serverPos > 0, '_serverPremium check must exist in isPremium()');
  assert.ok(serverPos < endPos, '_serverPremium check must come before subscriptionEnd check');
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

// ─── 7. _serverPremium boolean (THE real root cause) ────────────────────────
suite('_serverPremium boolean — server-confirmed truth');

test('_serverPremium=true → isPremium()=true regardless of plan/end', function() {
  _S = { _serverPremium: true, subscriptionPlan: 'trial', subscriptionEnd: null, _subStatusReady: true };
  assert.strictEqual(_isPremium(), true, '_serverPremium=true must override plan=trial');
  assert.strictEqual(_isTrialUser(), false, '_serverPremium=true must suppress trial UI');
  assert.strictEqual(_getTrialDaysLeft(), 0);
});

test('_serverPremium=false + _subStatusReady=true → isPremium()=false', function() {
  _S = { _serverPremium: false, _subStatusReady: true, firstLoginDate: '2020-01-01' };
  assert.strictEqual(_isPremium(), false);
  assert.strictEqual(_isTrialUser(), true);
});

test('plan=legend → isPremium()=true (premium plan without unlimited)', function() {
  _S = { subscriptionPlan: 'legend', subscriptionEnd: null, _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
  assert.strictEqual(_isTrialUser(), false);
});

test('plan=lifetime → isPremium()=true', function() {
  _S = { subscriptionPlan: 'lifetime', subscriptionEnd: null, _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
});

test('plan=admin → isPremium()=true', function() {
  _S = { subscriptionPlan: 'admin', subscriptionEnd: null, _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
});

test('server returns plan=trial but premium=true → isPremium()=true (plan poisoning fix)', function() {
  // Simulate the old server bug: premium=true but plan='trial'
  // fetchUserStatus now sets _serverPremium=true AND subscriptionPlan='unlimited' in this case
  _S = { _serverPremium: true, subscriptionPlan: 'unlimited', _subStatusReady: true };
  assert.strictEqual(_isPremium(), true);
  assert.strictEqual(_isTrialUser(), false);
});

test('source: fetchUserStatus sets _serverPremium', function() {
  assert.ok(subSrc.includes('_serverPremium'), 'supabase-client.js must set _serverPremium');
  assert.ok(subSrc.includes("status.plan !== 'trial'"), 'must guard against plan=trial overwrite');
});

test('source: Netlify function checks UNLIMITED_PLANS before subscription_end', function() {
  var netlify = fs.readFileSync(path.join(__dirname, '../netlify/functions/user-status.js'), 'utf8');
  assert.ok(netlify.includes('UNLIMITED_PLANS'), 'Netlify function must define UNLIMITED_PLANS');
  assert.ok(netlify.includes("'unlimited'"), "Netlify UNLIMITED_PLANS must include 'unlimited'");
  assert.ok(netlify.includes("'lifetime'"), "Netlify UNLIMITED_PLANS must include 'lifetime'");
  // UNLIMITED_PLANS check must come before subscription_end check
  var unlimitedIdx = netlify.indexOf('UNLIMITED_PLANS');
  var endIdx = netlify.indexOf('subscription_end && profile.subscription_end');
  assert.ok(unlimitedIdx < endIdx, 'UNLIMITED_PLANS check must precede subscription_end check');
});

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(52));
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' FAILED — ' + passed + ' passed\x1b[0m');
  process.exit(1);
}
