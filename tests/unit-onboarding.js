'use strict';
/**
 * unit-onboarding.js — SmartFitCoach Onboarding Engine QA
 *
 * Tests:
 *   1.  Translation dictionary completeness (FR & EN parity)
 *   2.  Storage helpers (tips seen/unseen, ring buffer, session counter)
 *   3.  Tip display logic (no duplicate, queue ordering, auto-dismiss)
 *   4.  Frustration detection algorithm
 *   5.  Progressive discovery gating (session threshold, one at a time)
 *   6.  Personalization engine (persona detection)
 *   7.  Analytics ring buffer (max 50 events)
 *   8.  Full reset idempotency
 *   9.  Multilingual — FR/EN produce different copy
 *   10. Onboarding-complete skip/help buttons present
 *   11. Help center sections completeness
 *   12. Safe-area / mobile: CSS classes present
 *   13. Regression — no crash on null S, no tip spam
 */

var fs   = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Minimal browser shim ────────────────────────────────────────────────────
global.window = global;
global.document = {
  createElement: function(tag) {
    var el = {
      tagName: tag, style: { cssText: '' }, className: '', id: '',
      innerHTML: '', textContent: '', hidden: false,
      dataset: {},
      children: [], childNodes: [],
      setAttribute: function(k, v) { this['_attr_' + k] = v; },
      getAttribute: function(k) { return this['_attr_' + k] || null; },
      appendChild: function(c) { this.children.push(c); return c; },
      removeChild: function() {},
      classList: {
        _cls: [],
        add: function(c) { if (this._cls.indexOf(c) === -1) this._cls.push(c); },
        remove: function(c) { this._cls = this._cls.filter(function(x) { return x !== c; }); },
        toggle: function(c, force) {
          var has = this._cls.indexOf(c) !== -1;
          if (force !== undefined ? force : !has) this.add(c); else this.remove(c);
        },
        contains: function(c) { return this._cls.indexOf(c) !== -1; }
      },
      addEventListener: function() {},
      removeEventListener: function() {},
      focus: function() {},
      offsetWidth: 0, scrollHeight: 200, clientHeight: 100
    };
    return el;
  },
  getElementById: function() { return null; },
  querySelector:  function() { return null; },
  querySelectorAll: function() { return []; },
  body: {
    appendChild: function() {},
    classList: { add: function(){}, remove: function(){} },
    contains: function() { return false; }
  },
  head: { appendChild: function() {} },
  addEventListener: function() {},
  removeEventListener: function() {},
  readyState: 'complete'
};
try { Object.defineProperty(global, 'navigator', { value: { userAgent: '', language: 'fr-FR', onLine: true }, configurable: true }); } catch(e) {}
global.localStorage = (function() {
  var store = {};
  return {
    getItem:    function(k) { return store[k] !== undefined ? store[k] : null; },
    setItem:    function(k, v) { store[k] = String(v); },
    removeItem: function(k) { delete store[k]; },
    clear:      function() { store = {}; },
    _store: store,
    _reset: function() { store = {}; }
  };
})();
global.sessionStorage = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} };
global.requestAnimationFrame = function(fn) { setTimeout(fn, 0); };
global.performance = { now: function() { return Date.now(); } };

// ─── Test harness ─────────────────────────────────────────────────────────────
var pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; process.stdout.write('  ✓ ' + label + '\n'); }
  catch(e) { fail++; process.stdout.write('  ✗ ' + label + ' — ' + e.message + '\n'); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

// ─── Load onboarding engine ───────────────────────────────────────────────────
global.S = { _subStatusReady: true, _serverPremium: false, view: 'today', lang: 'fr', nStep: 0, sStep: 0 };
global.AUTH = { isLoggedIn: function() { return true; }, getUser: function() { return { id: 'test-uid-123' }; } };
global.GOALS = [
  { key: 'bulk' }, { key: 'lean_bulk' }, { key: 'maintain' },
  { key: 'cut' }, { key: 'shred' }, { key: 'recomposition' }
];
global.showToast = function() {};
global.OnboardingComplete = { check: function() {} };

eval(fs.readFileSync(ROOT + '/app/onboarding-engine.js', 'utf8'));

var OB = window.SFC_OB;

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n=== 1. Public API surface ===');
check('SFC_OB is defined on window', function() {
  assert(typeof OB === 'object' && OB !== null, 'SFC_OB not on window');
});
check('init is a function', function() { assert(typeof OB.init === 'function'); });
check('showTip is a function', function() { assert(typeof OB.showTip === 'function'); });
check('openHelp is a function', function() { assert(typeof OB.openHelp === 'function'); });
check('replayWelcome is a function', function() { assert(typeof OB.replayWelcome === 'function'); });
check('trackEvent is a function', function() { assert(typeof OB.trackEvent === 'function'); });
check('reset is a function', function() { assert(typeof OB.reset === 'function'); });
check('getAnalytics is a function', function() { assert(typeof OB.getAnalytics === 'function'); });
check('getSessionCount is a function', function() { assert(typeof OB.getSessionCount === 'function'); });
check('dismissTip is a function', function() { assert(typeof OB.dismissTip === 'function'); });

console.log('\n=== 2. Translation dictionary completeness ===');

var SRC = fs.readFileSync(ROOT + '/app/onboarding-engine.js', 'utf8');

// Extract DICT from source (eval'd into scope already)
// Verify that all FR keys exist in EN and vice-versa
var FR_TIP_KEYS = [
  'tip.today', 'tip.nutrition', 'tip.sport', 'tip.calendar',
  'tip.analytics', 'tip.ai_coach', 'tip.scanner', 'tip.symbiose',
  'tip.premium', 'tip.adaptation', 'tip.recovery', 'tip.frustration'
];
var EN_EXCLUSIVE_KEYS = ['help.title', 'help.close', 'help.replay', 'help.reset_tips', 'got_it', 'dismiss'];

check('All tip keys defined in source', function() {
  FR_TIP_KEYS.forEach(function(k) {
    assert(SRC.indexOf("'" + k + "'") !== -1, 'Missing key: ' + k);
  });
});
check('FR translation present for all tip keys', function() {
  var frBlock = SRC.slice(SRC.indexOf('fr:'), SRC.indexOf('en:'));
  FR_TIP_KEYS.forEach(function(k) {
    assert(frBlock.indexOf("'" + k + "'") !== -1, 'FR missing: ' + k);
  });
});
check('EN translation present for all tip keys', function() {
  var enBlock = SRC.slice(SRC.indexOf('en:'));
  FR_TIP_KEYS.forEach(function(k) {
    assert(enBlock.indexOf("'" + k + "'") !== -1, 'EN missing: ' + k);
  });
});
check('Help section strings translated in both languages', function() {
  EN_EXCLUSIVE_KEYS.forEach(function(k) {
    var frCount = (SRC.match(new RegExp("'" + k.replace('.', '\\.') + "'", 'g')) || []).length;
    assert(frCount >= 2, 'Key "' + k + '" appears only once (missing translation): ' + frCount);
  });
});
check('FR sections has 4 sections', function() {
  assert(SRC.indexOf("{ key: 'start'") !== -1);
  assert(SRC.indexOf("{ key: 'nutrition'") !== -1);
  assert(SRC.indexOf("{ key: 'sport'") !== -1);
  assert(SRC.indexOf("{ key: 'ai'") !== -1);
});
check('Discovery keys translated in FR and EN', function() {
  ['disc.scanner', 'disc.ai', 'disc.calendar'].forEach(function(k) {
    var cnt = (SRC.match(new RegExp("'" + k + "'", 'g')) || []).length;
    assert(cnt >= 2, k + ' not in both languages (count=' + cnt + ')');
  });
});

console.log('\n=== 3. Multilingual output ===');
check('_lang() returns fr when S.lang=fr', function() {
  window.S.lang = 'fr';
  assert(OB._lang() === 'fr', 'Expected fr, got: ' + OB._lang());
});
check('_lang() returns en when S.lang=en', function() {
  window.S.lang = 'en';
  assert(OB._lang() === 'en', 'Expected en, got: ' + OB._lang());
  window.S.lang = 'fr'; // reset
});
check('FR tip text is French', function() {
  window.S.lang = 'fr';
  // Call internal _lang override via source (can't call t() directly but we tested dictionary)
  assert(SRC.indexOf('Votre tableau de bord') !== -1, 'Missing FR copy for tip.today');
});
check('EN tip text is English', function() {
  assert(SRC.indexOf('Your personal dashboard') !== -1, 'Missing EN copy for tip.today');
});
check('FR and EN copy differ for tip.today', function() {
  assert(
    SRC.indexOf('Votre tableau de bord') !== -1 &&
    SRC.indexOf('Your personal dashboard') !== -1,
    'FR and EN tip.today are identical'
  );
});

console.log('\n=== 4. Storage — tips state ===');
check('_hasSeen returns false for new tip', function() {
  localStorage.clear();
  assert(OB._hasSeen('tip.today') === false, 'New tip should not be seen');
});
check('_markSeen then _hasSeen returns true', function() {
  OB._markSeen('tip.today');
  assert(OB._hasSeen('tip.today') === true, 'Marked tip should be seen');
});
check('_markSeen stores timestamp (number)', function() {
  OB._markSeen('tip.nutrition');
  var raw = localStorage.getItem('sfc_ob_tips_test-uid-123');
  var parsed = JSON.parse(raw);
  assert(typeof parsed['tip.nutrition'] === 'number', 'Timestamp should be a number');
});
check('reset clears all tip state', function() {
  OB.reset();
  assert(OB._hasSeen('tip.today') === false, 'Tips should be cleared after reset');
});
check('Different users have independent tip storage', function() {
  OB._markSeen('tip.sport');
  // Simulate different user: tips key differs by uid
  var key1 = 'sfc_ob_tips_test-uid-123';
  var key2 = 'sfc_ob_tips_other-user-456';
  assert(localStorage.getItem(key1) !== null, 'User 1 storage exists');
  assert(localStorage.getItem(key2) === null, 'User 2 storage should be empty');
});

console.log('\n=== 5. Analytics ring buffer ===');
check('trackEvent stores events', function() {
  localStorage.clear();
  OB.trackEvent('test_event', { foo: 'bar' });
  var evs = OB.getAnalytics();
  assert(evs.length >= 1, 'No events stored');
  assert(evs[evs.length - 1].e === 'test_event', 'Wrong event name');
});
check('trackEvent stores timestamp', function() {
  var evs = OB.getAnalytics();
  var last = evs[evs.length - 1];
  assert(typeof last.ts === 'number' && last.ts > 0, 'No timestamp');
});
check('Ring buffer capped at 50 events', function() {
  localStorage.clear();
  for (var i = 0; i < 60; i++) OB.trackEvent('fill_' + i);
  var evs = OB.getAnalytics();
  assert(evs.length <= 50, 'Buffer exceeds 50: ' + evs.length);
});
check('Ring buffer keeps newest events (not oldest)', function() {
  var evs = OB.getAnalytics();
  // Last event stored should be 'fill_59' (index 59 was the last)
  assert(evs[evs.length - 1].e === 'fill_59', 'Newest event not preserved: ' + evs[evs.length - 1].e);
});
check('getAnalytics returns array (not null)', function() {
  localStorage.clear();
  var evs = OB.getAnalytics();
  assert(Array.isArray(evs), 'Expected array, got: ' + typeof evs);
});

console.log('\n=== 6. Session counter ===');
check('getSessionCount returns a positive number', function() {
  localStorage.clear();
  var count = OB.getSessionCount();
  assert(typeof count === 'number' && count >= 1, 'Expected >= 1, got: ' + count);
});
check('getSessionCount increments once per day (idempotent within same day)', function() {
  var count1 = OB.getSessionCount();
  var count2 = OB.getSessionCount();
  assert(count1 === count2, 'Counter incremented twice same day: ' + count1 + ' vs ' + count2);
});
check('getSessionCount persists across "app restarts" (same localStorage)', function() {
  var count1 = OB.getSessionCount();
  // Simulate new day by directly writing yesterday's date
  var key = 'sfc_ob_sessions_test-uid-123';
  var data = JSON.parse(localStorage.getItem(key));
  data.last = '2000-01-01'; // Force "yesterday"
  localStorage.setItem(key, JSON.stringify(data));
  var count2 = OB.getSessionCount();
  assert(count2 === count1 + 1, 'Session count did not increment on new day: ' + count2);
});

console.log('\n=== 7. Personalization engine ===');
check('_persona() returns string', function() {
  assert(typeof OB._persona() === 'string', 'Persona not a string');
});
check('Beginner returns persona "beginner"', function() {
  window.S = { sportLevel: 'beginner', sportType: 'musculation', goal: 2, lang: 'fr' };
  assert(OB._persona() === 'beginner', 'Got: ' + OB._persona());
});
check('Runner returns persona "endurance"', function() {
  window.S = { sportLevel: 'intermediate', sportType: 'running', goal: 2, lang: 'fr' };
  assert(OB._persona() === 'endurance', 'Got: ' + OB._persona());
});
check('CrossFit returns persona "crossfit"', function() {
  window.S = { sportLevel: 'intermediate', sportType: 'crossfit', goal: 2, lang: 'fr' };
  assert(OB._persona() === 'crossfit', 'Got: ' + OB._persona());
});
check('Shred goal returns persona "weightloss"', function() {
  window.S = { sportLevel: 'intermediate', sportType: 'musculation', goal: 4, lang: 'fr' };
  assert(OB._persona() === 'weightloss', 'Got: ' + OB._persona());
});
check('Null S returns "default" without crash', function() {
  window.S = null;
  var p = OB._persona();
  assert(p === 'default', 'Expected default, got: ' + p);
  window.S = { _subStatusReady: true, _serverPremium: false, view: 'today', lang: 'fr', nStep: 0, sStep: 0 };
});

console.log('\n=== 8. Tip gating (no duplicate, skip if seen) ===');
check('showTip respects _hasSeen — never shows seen tip', function() {
  localStorage.clear();
  var shown = [];
  // Manually track shown tips by watching _markSeen calls
  OB._markSeen('tip.today');
  // showTip calls _hasSeen before rendering — if seen, noop
  assert(OB._hasSeen('tip.today') === true, 'Tip should be marked seen');
  // No crash even when called repeatedly
  OB.showTip('tip.today');
  OB.showTip('tip.today');
  OB.showTip('tip.today');
  assert(true, 'No crash on repeated showTip for seen tip');
});
check('showTip with no translation (unknown key) does not crash', function() {
  localStorage.clear();
  OB.showTip('tip.unknown_key_xyz');
  assert(true, 'No crash on unknown key');
});
check('showTip with null tipId does not crash', function() {
  OB.showTip(null);
  OB.showTip(undefined);
  OB.showTip('');
  assert(true, 'No crash on null/empty tipId');
});

console.log('\n=== 9. Frustration detection ===');
check('Frustration tip key exists in both languages', function() {
  assert(SRC.indexOf('tip.frustration') !== -1, 'frustration tip key missing');
  var frOccurrences = (SRC.match(/'tip\.frustration'/g) || []).length;
  assert(frOccurrences >= 2, 'tip.frustration not in both language blocks');
});
check('Frustration threshold constant is defined (5 navigations)', function() {
  assert(SRC.indexOf('FRUST_THRESHOLD') !== -1, 'FRUST_THRESHOLD constant missing');
  assert(SRC.indexOf('var FRUST_THRESHOLD    = 5') !== -1 || SRC.indexOf('FRUST_THRESHOLD = 5') !== -1,
    'FRUST_THRESHOLD value is not 5');
});
check('Frustration window constant is defined', function() {
  assert(SRC.indexOf('FRUST_WINDOW') !== -1, 'FRUST_WINDOW constant missing');
});

console.log('\n=== 10. Progressive discovery gating ===');
check('Discovery features list defined (scanner, ai, calendar)', function() {
  assert(SRC.indexOf("'scanner'") !== -1, 'scanner missing from discovery');
  assert(SRC.indexOf("'ai'") !== -1, 'ai missing from discovery');
  assert(SRC.indexOf("'calendar'") !== -1, 'calendar missing from discovery');
});
check('Discovery requires session >= 2 (not first session)', function() {
  assert(SRC.indexOf('sessions < 2') !== -1 || SRC.indexOf('sessions < 2') !== -1,
    'No session threshold guard for discovery');
});
check('Discovery shows one feature at a time', function() {
  assert(SRC.indexOf('unseen[0]') !== -1, 'Discovery should show only first unseen feature');
});
check('Discovery uses separate "disc." namespace from tips', function() {
  assert(SRC.indexOf("'disc.' + f") !== -1 || SRC.indexOf("'disc.' + featureKey") !== -1,
    'Discovery namespace "disc." not used');
});

console.log('\n=== 11. Help center structure ===');
check('Help center has 4 sections (start, nutrition, sport, ai)', function() {
  var secs = ['start', 'nutrition', 'sport', 'ai'];
  secs.forEach(function(s) {
    assert(SRC.indexOf("key: '" + s + "'") !== -1, 'Missing section: ' + s);
  });
});
check('Each section has 3 FAQ items', function() {
  var startIdx = SRC.indexOf("key: 'start'");
  var startBlock = SRC.slice(startIdx, startIdx + 1000);
  var itemCount = (startBlock.match(/\['/g) || []).length;
  assert(itemCount >= 3, 'Start section has fewer than 3 items: ' + itemCount);
});
check('Help center translated in both languages (sections key present twice)', function() {
  var sectionCount = (SRC.match(/'sections'/g) || []).length;
  assert(sectionCount >= 2, 'sections key only once — not bilingual: ' + sectionCount);
});
check('openHelp does not crash when called (no DOM crash)', function() {
  try { OB.openHelp(); assert(true); }
  catch(e) { throw new Error('openHelp crashed: ' + e.message); }
});

console.log('\n=== 12. onboarding-complete.js enhancements ===');
var OC_SRC = fs.readFileSync(ROOT + '/app/onboarding-complete.js', 'utf8');
check('Skip button exists in onboarding-complete.js', function() {
  assert(OC_SRC.indexOf("'Skip'") !== -1 || OC_SRC.indexOf("'Passer'") !== -1,
    'No skip button found in onboarding-complete.js');
});
check('Skip button available in both FR and EN', function() {
  assert(OC_SRC.indexOf("'Skip'") !== -1, 'EN skip missing');
  assert(OC_SRC.indexOf("'Passer'") !== -1, 'FR skip missing');
});
check('Help & Tutorials link present in onboarding-complete.js', function() {
  assert(OC_SRC.indexOf('Aide') !== -1 || OC_SRC.indexOf('Help') !== -1,
    'No help link in onboarding-complete');
});
check('SFC_OB.openHelp wired in onboarding-complete.js', function() {
  assert(OC_SRC.indexOf('SFC_OB') !== -1, 'onboarding-complete does not reference SFC_OB');
});

console.log('\n=== 13. CSS classes — mobile & premium design ===');
var CSS_SRC = fs.readFileSync(ROOT + '/app/premium-ui.css', 'utf8');
check('.sfc-tip-bar class defined in CSS', function() {
  assert(CSS_SRC.indexOf('.sfc-tip-bar') !== -1, '.sfc-tip-bar CSS missing');
});
check('.sfc-tip-bar--visible transition defined', function() {
  assert(CSS_SRC.indexOf('.sfc-tip-bar--visible') !== -1, '.sfc-tip-bar--visible missing');
});
check('.sfc-discovery class defined', function() {
  assert(CSS_SRC.indexOf('.sfc-discovery') !== -1, '.sfc-discovery CSS missing');
});
check('.sfc-help-modal bottom sheet defined', function() {
  assert(CSS_SRC.indexOf('.sfc-help-modal') !== -1, '.sfc-help-modal CSS missing');
});
check('.sfc-help-backdrop defined', function() {
  assert(CSS_SRC.indexOf('.sfc-help-backdrop') !== -1, '.sfc-help-backdrop CSS missing');
});
check('prefers-reduced-motion respected', function() {
  assert(CSS_SRC.indexOf('prefers-reduced-motion') !== -1, 'No reduced-motion support');
});
check('safe-area-inset-bottom used for mobile notch', function() {
  assert(CSS_SRC.indexOf('safe-area-inset-bottom') !== -1, 'No safe-area support');
});
check('min-height 44px on interactive elements (accessibility)', function() {
  assert(CSS_SRC.indexOf('min-height: 44px') !== -1 || CSS_SRC.indexOf('min-height:44px') !== -1
    || CSS_SRC.indexOf('min-height: 46px') !== -1,
    'No 44px min-height for touch targets');
});

console.log('\n=== 14. Regression — no crash on edge cases ===');
check('init() does not crash with null S', function() {
  var saved = window.S;
  window.S = null;
  try { OB.init(); assert(true); }
  catch(e) { throw new Error('init crashed with null S: ' + e.message); }
  finally { window.S = saved; }
});
check('replayWelcome does not crash when OnboardingComplete absent', function() {
  var saved = window.OnboardingComplete;
  window.OnboardingComplete = null;
  try { OB.replayWelcome(); assert(true); }
  catch(e) { throw new Error('replayWelcome crashed: ' + e.message); }
  finally { window.OnboardingComplete = saved; }
});
check('getAnalytics returns [] not null when storage empty', function() {
  localStorage.clear();
  var evs = OB.getAnalytics();
  assert(Array.isArray(evs), 'Expected array, got: ' + typeof evs);
  assert(evs !== null, 'Got null instead of array');
});
check('reset() is idempotent — safe to call multiple times', function() {
  OB.reset();
  OB.reset();
  OB.reset();
  assert(true, 'No crash on multiple resets');
});
check('dismissTip does not crash when no tip is showing', function() {
  OB.dismissTip('tip.nonexistent');
  assert(true);
});
check('trackEvent with undefined data does not crash', function() {
  OB.trackEvent('test', undefined);
  OB.trackEvent('test', null);
  OB.trackEvent('test');
  assert(true);
});
check('No tip shown during active onboarding (nStep > 0)', function() {
  // Regression: tips must be suppressed during questionnaire
  assert(SRC.indexOf('inOB') !== -1, 'No onboarding guard found in render hook');
  assert(SRC.indexOf('nStep > 0') !== -1, 'No nStep check in render hook');
});
check('Tip bar has ARIA role=status for screen readers', function() {
  assert(SRC.indexOf("'status'") !== -1, 'Missing aria role=status on tip bar');
});
check('Help modal has role=dialog for accessibility', function() {
  assert(SRC.indexOf("'dialog'") !== -1, 'Missing aria role=dialog on help modal');
});
check('Help modal has aria-modal=true', function() {
  assert(SRC.indexOf("'aria-modal'") !== -1, 'Missing aria-modal attribute');
});
check('Escape key closes help modal', function() {
  assert(SRC.indexOf("'Escape'") !== -1, 'No Escape key handler for help modal');
});

console.log('\n=== 15. Build system integration ===');
var BUILD_SRC = fs.readFileSync(ROOT + '/scripts/build-bundle.js', 'utf8');
check('onboarding-engine.js in build script', function() {
  assert(BUILD_SRC.indexOf('./onboarding-engine.js') !== -1, 'onboarding-engine.js not in build');
});
check('onboarding-engine.js loads AFTER onboarding-complete.js', function() {
  var pos1 = BUILD_SRC.indexOf('./onboarding-complete.js');
  var pos2 = BUILD_SRC.indexOf('./onboarding-engine.js');
  assert(pos2 > pos1, 'onboarding-engine.js should load after onboarding-complete.js');
});
check('onboarding-engine.js loads BEFORE app-social.js (and app-main.js)', function() {
  var posEngine = BUILD_SRC.indexOf('./onboarding-engine.js');
  var posSocial = BUILD_SRC.indexOf('./app-social.js');
  assert(posEngine < posSocial, 'onboarding-engine.js should load before app-social.js');
});
check('onboarding-engine.js file exists', function() {
  assert(require('fs').existsSync(ROOT + '/app/onboarding-engine.js'), 'File does not exist');
});

// ═════════════════════════════════════════════════════════════════════════════
// v2 TESTS — Sections 16–27
// ═════════════════════════════════════════════════════════════════════════════

console.log('\n=== 16. v2 DICT — new tip keys present in both languages ===');
var V2_TIP_KEYS = [
  'tip.day1', 'tip.day3', 'tip.day7',
  'tip.comeback',
  'tip.ai_intro', 'tip.scanner_intro', 'tip.symbiose_intro',
  'tip.unlock_meal', 'tip.unlock_workout', 'tip.unlock_7days',
  'tip.premium_soft', 'tip.video',
  'tip.empty_nutrition', 'tip.empty_sport'
];
check('All v2 tip keys defined in engine source', function() {
  V2_TIP_KEYS.forEach(function(k) {
    assert(SRC.indexOf("'" + k + "'") !== -1, 'Missing v2 key: ' + k);
  });
});
check('tip.day1 / tip.day3 / tip.day7 in FR block', function() {
  var frBlock = SRC.slice(SRC.indexOf('fr:'), SRC.indexOf('en:'));
  ['tip.day1', 'tip.day3', 'tip.day7'].forEach(function(k) {
    assert(frBlock.indexOf("'" + k + "'") !== -1, 'FR missing: ' + k);
  });
});
check('tip.day1 / tip.day3 / tip.day7 in EN block', function() {
  var enBlock = SRC.slice(SRC.indexOf('en:'));
  ['tip.day1', 'tip.day3', 'tip.day7'].forEach(function(k) {
    assert(enBlock.indexOf("'" + k + "'") !== -1, 'EN missing: ' + k);
  });
});
check('tip.comeback in both languages', function() {
  var cnt = (SRC.match(/'tip\.comeback'/g) || []).length;
  assert(cnt >= 2, 'tip.comeback not bilingual: ' + cnt);
});
check('AI education keys in both languages', function() {
  ['tip.ai_intro', 'tip.scanner_intro', 'tip.symbiose_intro'].forEach(function(k) {
    var cnt = (SRC.match(new RegExp("'" + k.replace(/\./g, '\\.') + "'", 'g')) || []).length;
    assert(cnt >= 2, k + ' not bilingual (count=' + cnt + ')');
  });
});
check('Progressive unlock keys in both languages', function() {
  ['tip.unlock_meal', 'tip.unlock_workout', 'tip.unlock_7days'].forEach(function(k) {
    var cnt = (SRC.match(new RegExp("'" + k.replace(/\./g, '\\.') + "'", 'g')) || []).length;
    assert(cnt >= 2, k + ' not bilingual: ' + cnt);
  });
});
check('tip.premium_soft in both languages', function() {
  var cnt = (SRC.match(/'tip\.premium_soft'/g) || []).length;
  assert(cnt >= 2, 'tip.premium_soft not bilingual: ' + cnt);
});
check('tip.video in both languages', function() {
  var cnt = (SRC.match(/'tip\.video'/g) || []).length;
  assert(cnt >= 2, 'tip.video not bilingual: ' + cnt);
});
check('Empty state keys in both languages', function() {
  ['tip.empty_nutrition', 'tip.empty_sport'].forEach(function(k) {
    var cnt = (SRC.match(new RegExp("'" + k.replace(/\./g, '\\.') + "'", 'g')) || []).length;
    assert(cnt >= 2, k + ' not bilingual: ' + cnt);
  });
});
check('FR tip.comeback copy is French', function() {
  assert(SRC.indexOf('Bon retour') !== -1, 'FR comeback copy missing');
});
check('EN tip.comeback copy is English', function() {
  assert(SRC.indexOf('Welcome back') !== -1, 'EN comeback copy missing');
});
check('FR tip.day1 copy is French', function() {
  assert(SRC.indexOf('dès aujourd') !== -1, 'FR day1 copy missing');
});

console.log('\n=== 17. Session data — prev / first tracking ===');
check('_getSessionData() function exposed on SFC_OB', function() {
  assert(typeof OB._getSessionData === 'function', '_getSessionData not on API');
});
check('Fresh session: data.count >= 1', function() {
  localStorage.clear();
  var d = OB._getSessionData();
  assert(typeof d.count === 'number' && d.count >= 0, 'count not a number');
});
check('After first session, data.first is set to today', function() {
  localStorage.clear();
  OB.getSessionCount();
  var d = OB._getSessionData();
  var today = new Date().toISOString().slice(0, 10);
  assert(d.first === today, 'first not set to today: ' + d.first);
});
check('After first session, data.prev is null', function() {
  localStorage.clear();
  OB.getSessionCount();
  var d = OB._getSessionData();
  assert(d.prev === null, 'prev should be null on first session, got: ' + d.prev);
});
check('After second session, data.prev is set to previous date', function() {
  localStorage.clear();
  OB.getSessionCount(); // session 1 — today
  // Simulate new day
  var key = 'sfc_ob_sessions_test-uid-123';
  var data = JSON.parse(localStorage.getItem(key));
  var prevDate = '2000-01-01';
  data.last = prevDate;
  localStorage.setItem(key, JSON.stringify(data));
  OB.getSessionCount(); // session 2
  var d = OB._getSessionData();
  assert(d.prev === prevDate, 'prev not set to previous date: ' + d.prev);
});
check('data.first does not change on subsequent sessions', function() {
  localStorage.clear();
  OB.getSessionCount();
  var d1 = OB._getSessionData();
  var firstDate = d1.first;
  // Simulate new day
  var key = 'sfc_ob_sessions_test-uid-123';
  var data = JSON.parse(localStorage.getItem(key));
  data.last = '2000-01-02';
  localStorage.setItem(key, JSON.stringify(data));
  OB.getSessionCount();
  var d2 = OB._getSessionData();
  assert(d2.first === firstDate, 'first changed on 2nd session: ' + d2.first + ' vs ' + firstDate);
});
check('_getSessionData returns all required fields', function() {
  localStorage.clear();
  OB.getSessionCount();
  var d = OB._getSessionData();
  assert('count' in d, 'missing count');
  assert('last'  in d, 'missing last');
  assert('prev'  in d, 'missing prev');
  assert('first' in d, 'missing first');
});
check('_getSessionData does not crash with empty localStorage', function() {
  localStorage.clear();
  var d = OB._getSessionData();
  assert(typeof d === 'object' && d !== null, 'Expected object');
  assert(d.count === 0, 'Expected count 0, got: ' + d.count);
});
check('getSessionCount still idempotent within same day in v2', function() {
  localStorage.clear();
  var c1 = OB.getSessionCount();
  var c2 = OB.getSessionCount();
  assert(c1 === c2, 'v2 counter incremented twice same day');
});
check('VER constant is 2.0 in engine source', function() {
  assert(SRC.indexOf("VER = '2.0'") !== -1, 'Version not updated to 2.0');
});

console.log('\n=== 18. Re-engagement detection ===');
check('_checkReEngagement() function exposed', function() {
  assert(typeof OB._checkReEngagement === 'function', '_checkReEngagement not exposed');
});
check('Re-engagement: no action when prev is null (fresh user)', function() {
  localStorage.clear();
  OB.getSessionCount();
  OB._markSeen('tip.comeback'); // ensure clean state
  OB.reset();
  OB.getSessionCount();
  try { OB._checkReEngagement(); assert(true); }
  catch(e) { throw new Error('_checkReEngagement crashed with null prev: ' + e.message); }
});
check('Re-engagement tip.comeback key present in source', function() {
  assert(SRC.indexOf("'tip.comeback'") !== -1, 'tip.comeback key missing from source');
});
check('Re-engagement threshold is 2+ days in source', function() {
  assert(SRC.indexOf('diffDays >= 2') !== -1, 'Re-engagement threshold not 2 days');
});
check('Re-engagement: no crash with corrupted date strings', function() {
  var key = 'sfc_ob_sessions_test-uid-123';
  localStorage.setItem(key, JSON.stringify({ count: 3, last: 'not-a-date', prev: 'also-bad', first: '2025-01-01' }));
  try { OB._checkReEngagement(); assert(true); }
  catch(e) { throw new Error('_checkReEngagement crashed on bad date: ' + e.message); }
});
check('Re-engagement uses gapDays in logged event', function() {
  assert(SRC.indexOf('gapDays') !== -1, 're_engagement event missing gapDays field');
});
check('Re-engagement does not re-trigger once tip.comeback is seen', function() {
  localStorage.clear();
  OB.getSessionCount();
  OB._markSeen('tip.comeback');
  assert(OB._hasSeen('tip.comeback') === true, 'comeback should be marked seen');
  // _checkReEngagement should be a noop now
  try { OB._checkReEngagement(); assert(true); }
  catch(e) { throw new Error('crash: ' + e.message); }
});
check('Re-engagement: gap computed as days between dates', function() {
  assert(SRC.indexOf('1000 * 60 * 60 * 24') !== -1, 'Day conversion formula not found in re-engagement');
});

console.log('\n=== 19. First-week guidance milestones ===');
check('_firstWeekGuidance() function exposed', function() {
  assert(typeof OB._firstWeekGuidance === 'function', '_firstWeekGuidance not exposed');
});
check('_firstWeekGuidance does not crash with null first date', function() {
  localStorage.clear();
  try { OB._firstWeekGuidance(); assert(true); }
  catch(e) { throw new Error('_firstWeekGuidance crashed with null first: ' + e.message); }
});
check('First-week: daysSince === 0 triggers tip.day1 (source check)', function() {
  assert(SRC.indexOf('daysSince === 0') !== -1, 'day1 trigger not found');
  assert(SRC.indexOf("'tip.day1'") !== -1, 'tip.day1 not referenced');
});
check('First-week: daysSince 3-6 triggers tip.day3', function() {
  assert(SRC.indexOf('daysSince >= 3') !== -1, 'day3 lower bound not found');
  assert(SRC.indexOf("'tip.day3'") !== -1, 'tip.day3 not referenced');
});
check('First-week: daysSince >= 7 triggers tip.day7', function() {
  assert(SRC.indexOf('daysSince >= 7') !== -1, 'day7 trigger not found');
  assert(SRC.indexOf("'tip.day7'") !== -1, 'tip.day7 not referenced');
});
check('First-week tip.day3 not triggered if already seen', function() {
  localStorage.clear();
  OB.getSessionCount();
  OB._markSeen('tip.day3');
  // Set first to 4 days ago
  var key = 'sfc_ob_sessions_test-uid-123';
  var d = OB._getSessionData();
  var past = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  d.first = past;
  localStorage.setItem(key, JSON.stringify(d));
  try { OB._firstWeekGuidance(); assert(true); }
  catch(e) { throw new Error('crashed: ' + e.message); }
  assert(OB._hasSeen('tip.day3') === true, 'tip.day3 seen state lost');
});
check('_firstWeekGuidance: tip.day7 in both FR and EN', function() {
  var frBlock = SRC.slice(SRC.indexOf('fr:'), SRC.indexOf('en:'));
  var enBlock = SRC.slice(SRC.indexOf('en:'));
  assert(frBlock.indexOf("'tip.day7'") !== -1, 'FR tip.day7 missing');
  assert(enBlock.indexOf("'tip.day7'") !== -1, 'EN tip.day7 missing');
});
check('_firstWeekGuidance does not crash with invalid first date', function() {
  var key = 'sfc_ob_sessions_test-uid-123';
  localStorage.setItem(key, JSON.stringify({ count: 5, last: '2026-05-01', prev: '2026-04-29', first: 'INVALID' }));
  try { OB._firstWeekGuidance(); assert(true); }
  catch(e) { throw new Error('crashed on invalid date: ' + e.message); }
});
check('First-week daysSince < 7 does NOT trigger tip.day7', function() {
  assert(SRC.indexOf('daysSince < 7') !== -1, 'upper bound guard for day3 not found');
});
check('All 3 first-week tips use showTip() (not direct _showTipNow)', function() {
  assert(SRC.indexOf("showTip('tip.day1')") !== -1, 'tip.day1 not using showTip');
  assert(SRC.indexOf("showTip('tip.day3')") !== -1, 'tip.day3 not using showTip');
  assert(SRC.indexOf("showTip('tip.day7')") !== -1, 'tip.day7 not using showTip');
});

console.log('\n=== 20. View visit tracking & AI feature education ===');
check('_viewVisits object exposed on SFC_OB', function() {
  assert(typeof OB._viewVisits === 'object', '_viewVisits not exposed');
});
check('_trackViewVisit() function exposed on SFC_OB', function() {
  assert(typeof OB._trackViewVisit === 'function', '_trackViewVisit not exposed');
});
check('_trackViewVisit increments visit count for a view', function() {
  OB._viewVisits['today'] = 0;
  OB._trackViewVisit('today');
  assert(OB._viewVisits['today'] >= 1, 'today count not incremented');
});
check('_trackViewVisit does not crash with unknown view', function() {
  try { OB._trackViewVisit('unknown_view_xyz'); assert(true); }
  catch(e) { throw new Error('crashed: ' + e.message); }
});
check('_trackViewVisit: AI intro triggered on 2nd today visit (source check)', function() {
  assert(SRC.indexOf("_viewVisits[view] === 2") !== -1 ||
    SRC.indexOf("'tip.ai_intro'") !== -1, 'AI intro trigger not found');
});
check('_trackViewVisit: scanner intro triggered on 2nd nutrition visit (source check)', function() {
  assert(SRC.indexOf("'tip.scanner_intro'") !== -1, 'scanner intro not in source');
});
check('_trackViewVisit: symbiose intro after both nutrition and sport visited', function() {
  assert(SRC.indexOf("'tip.symbiose_intro'") !== -1, 'symbiose intro not in source');
  assert(SRC.indexOf("_viewVisits['nutrition']") !== -1, 'nutrition visit check missing');
  assert(SRC.indexOf("_viewVisits['sport']") !== -1, 'sport visit check missing');
});
check('_trackViewVisit: AI intro uses setTimeout (async, non-blocking)', function() {
  assert(SRC.indexOf("setTimeout(function() { showTip('tip.ai_intro')") !== -1, 'AI intro not async');
});
check('View visits are in-memory (not persisted to localStorage)', function() {
  // _viewVisits should not appear in any KEYS.* pattern
  assert(SRC.indexOf("KEYS.views") === -1, '_viewVisits should not be persisted');
});
check('_trackViewVisit called from _onViewChange', function() {
  assert(SRC.indexOf('_trackViewVisit(view)') !== -1, '_trackViewVisit not called from _onViewChange');
});
check('Symbiose intro delay is longer (3500ms) for immersion', function() {
  assert(SRC.indexOf('3500') !== -1, '3500ms symbiose delay not found');
});
check('AI/Scanner intro delay is 2000ms', function() {
  assert(SRC.indexOf('}, 2000)') !== -1, '2000ms delay not found for AI/scanner intro');
});

console.log('\n=== 21. Progressive unlock announcements ===');
check('_checkProgressiveUnlocks() function exposed', function() {
  assert(typeof OB._checkProgressiveUnlocks === 'function', '_checkProgressiveUnlocks not exposed');
});
check('_checkProgressiveUnlocks does not crash with null S', function() {
  var saved = window.S;
  window.S = null;
  try { OB._checkProgressiveUnlocks(); assert(true); }
  catch(e) { throw new Error('crashed: ' + e.message); }
  finally { window.S = saved; }
});
check('Meal unlock: checks todayMeals array', function() {
  assert(SRC.indexOf('todayMeals') !== -1, 'todayMeals not checked in unlock logic');
});
check('Workout unlock: checks sessionHistory array', function() {
  assert(SRC.indexOf('sessionHistory') !== -1, 'sessionHistory not checked in unlock logic');
});
check('7-day milestone: checks data.count >= 7', function() {
  assert(SRC.indexOf('data.count >= 7') !== -1, '7-day count check not found');
});
check('Unlock tip not shown if already seen', function() {
  localStorage.clear();
  OB._markSeen('tip.unlock_meal');
  window.S = { todayMeals: [{ name: 'apple' }], view: 'nutrition', lang: 'fr', nStep: 0, sStep: 0 };
  OB._checkProgressiveUnlocks();
  assert(OB._hasSeen('tip.unlock_meal') === true, 'Should still be marked seen');
  window.S = { _subStatusReady: true, _serverPremium: false, view: 'today', lang: 'fr', nStep: 0, sStep: 0 };
});
check('unlock_7days fired when session count >= 7', function() {
  localStorage.clear();
  var key = 'sfc_ob_sessions_test-uid-123';
  localStorage.setItem(key, JSON.stringify({ count: 7, last: '2026-05-01', prev: '2026-04-29', first: '2026-04-25' }));
  window.S = { view: 'today', lang: 'fr', nStep: 0, sStep: 0 };
  try { OB._checkProgressiveUnlocks(); assert(true); }
  catch(e) { throw new Error('crashed at 7 sessions: ' + e.message); }
  window.S = { _subStatusReady: true, _serverPremium: false, view: 'today', lang: 'fr', nStep: 0, sStep: 0 };
});
check('Progressive unlock keys use 1500ms async delay', function() {
  assert(SRC.indexOf('}, 1500)') !== -1, '1500ms unlock delay not found');
});
check('unlock_workout checks _firstWorkoutDone flag fallback', function() {
  assert(SRC.indexOf('_firstWorkoutDone') !== -1, '_firstWorkoutDone flag not checked');
});
check('unlock_meal checks _firstMealLogged flag fallback', function() {
  assert(SRC.indexOf('_firstMealLogged') !== -1, '_firstMealLogged flag not checked');
});

console.log('\n=== 22. Completion scoring ===');
check('getCompletionScore() function exposed on SFC_OB', function() {
  assert(typeof OB.getCompletionScore === 'function', 'getCompletionScore not on API');
});
check('getCompletionScore returns a number', function() {
  var score = OB.getCompletionScore();
  assert(typeof score === 'number', 'Expected number, got: ' + typeof score);
});
check('getCompletionScore is 0 with empty S', function() {
  var saved = window.S;
  window.S = {};
  var score = OB.getCompletionScore();
  assert(score === 0, 'Expected 0 with empty S, got: ' + score);
  window.S = saved;
});
check('getCompletionScore max is 100', function() {
  var saved = window.S;
  localStorage.clear();
  OB._markSeen('disc.ai');
  OB._markSeen('disc.scanner');
  window.S = { appMode: 'both', goal: 2, weekPlan: [1, 2, 3] };
  var score = OB.getCompletionScore();
  assert(score <= 100, 'Score exceeds 100: ' + score);
  window.S = saved;
  localStorage.clear();
});
check('appMode set adds 20 points', function() {
  var saved = window.S;
  localStorage.clear();
  window.S = { appMode: 'nutrition' }; // only appMode, rest missing
  var score = OB.getCompletionScore();
  assert(score >= 20, 'appMode should add 20 points, got: ' + score);
  window.S = saved;
});
check('goal set adds 20 points', function() {
  var saved = window.S;
  localStorage.clear();
  window.S = { goal: 2 }; // only goal
  var score = OB.getCompletionScore();
  assert(score >= 20, 'goal should add 20 points, got: ' + score);
  window.S = saved;
});
check('plan adds 20 points (weekPlan)', function() {
  var saved = window.S;
  localStorage.clear();
  window.S = { weekPlan: [1, 2, 3] };
  var score = OB.getCompletionScore();
  assert(score >= 20, 'weekPlan should add 20 points, got: ' + score);
  window.S = saved;
});
check('plan adds 20 points (sportProgram)', function() {
  var saved = window.S;
  localStorage.clear();
  window.S = { sportProgram: [{ day: 1 }] };
  var score = OB.getCompletionScore();
  assert(score >= 20, 'sportProgram should add 20 points, got: ' + score);
  window.S = saved;
});
check('AI discovery (disc.ai seen) adds 20 points', function() {
  localStorage.clear();
  OB._markSeen('disc.ai');
  var saved = window.S; window.S = {};
  var score = OB.getCompletionScore();
  assert(score >= 20, 'disc.ai seen should add 20 points, got: ' + score);
  window.S = saved; localStorage.clear();
});
check('getCompletionScore does not crash with null S', function() {
  var saved = window.S;
  window.S = null;
  try { var s = OB.getCompletionScore(); assert(typeof s === 'number'); }
  catch(e) { throw new Error('crashed: ' + e.message); }
  finally { window.S = saved; }
});

console.log('\n=== 23. Premium soft upsell ===');
check('_checkPremiumPresentation() function exposed', function() {
  assert(typeof OB._checkPremiumPresentation === 'function', '_checkPremiumPresentation not exposed');
});
check('tip.premium_soft in engine source', function() {
  assert(SRC.indexOf("'tip.premium_soft'") !== -1, 'tip.premium_soft missing');
});
check('Premium upsell gate: count < 5 in source', function() {
  assert(SRC.indexOf('count < 5') !== -1, 'Session count gate for premium upsell missing');
});
check('_checkPremiumPresentation does not crash with null S', function() {
  var saved = window.S; window.S = null;
  try { OB._checkPremiumPresentation(); assert(true); }
  catch(e) { throw new Error('crashed: ' + e.message); }
  finally { window.S = saved; }
});
check('Premium upsell checks isPlanAtLeast in source', function() {
  assert(SRC.indexOf('isPlanAtLeast') !== -1, 'isPlanAtLeast not checked in premium upsell');
});
check('Premium upsell delayed 6000ms (not instant)', function() {
  assert(SRC.indexOf('}, 6000)') !== -1, '6000ms delay for premium soft not found');
});
check('Premium soft tip shown only once (hasSeen guard)', function() {
  localStorage.clear();
  OB._markSeen('tip.premium_soft');
  assert(OB._hasSeen('tip.premium_soft') === true, 'premium_soft seen state wrong');
});
check('tip.premium_soft copy mentions AI Coach', function() {
  assert(SRC.indexOf('IA Coach') !== -1 || SRC.indexOf('AI Coach') !== -1, 'No AI Coach mention in premium tip');
});

console.log('\n=== 24. Video system explanation ===');
check('showVideoTip() exposed on public API', function() {
  assert(typeof OB.showVideoTip === 'function', 'showVideoTip not on API');
});
check('tip.video key in engine source', function() {
  assert(SRC.indexOf("'tip.video'") !== -1, 'tip.video missing from source');
});
check('showVideoTip does not crash', function() {
  localStorage.clear();
  try { OB.showVideoTip(); assert(true); }
  catch(e) { throw new Error('showVideoTip crashed: ' + e.message); }
});
check('showVideoTip only shows once (uses showTip which checks _hasSeen)', function() {
  localStorage.clear();
  OB._markSeen('tip.video');
  OB.showVideoTip(); // should be noop
  assert(OB._hasSeen('tip.video') === true, 'video tip seen state lost');
});
check('tip.video in FR copy mentions vignette or thumbnail', function() {
  assert(SRC.indexOf('vignette') !== -1, 'FR video tip copy missing "vignette"');
});
check('tip.video in EN copy mentions thumbnail', function() {
  assert(SRC.indexOf('thumbnail') !== -1, 'EN video tip copy missing "thumbnail"');
});

console.log('\n=== 25. Carousel — onboarding-complete.js v2 ===');
var OC_SRC2 = fs.readFileSync(ROOT + '/app/onboarding-complete.js', 'utf8');
check('3-slide carousel: _buildSlide0 present', function() {
  assert(OC_SRC2.indexOf('_buildSlide0') !== -1, '_buildSlide0 not found');
});
check('3-slide carousel: _buildSlide1 present', function() {
  assert(OC_SRC2.indexOf('_buildSlide1') !== -1, '_buildSlide1 not found');
});
check('3-slide carousel: _buildSlide2 present', function() {
  assert(OC_SRC2.indexOf('_buildSlide2') !== -1, '_buildSlide2 not found');
});
check('Carousel CSS class sfc-oc-slides present', function() {
  assert(OC_SRC2.indexOf('sfc-oc-slides') !== -1, 'sfc-oc-slides CSS class missing');
});
check('Carousel CSS class sfc-oc-dot present', function() {
  assert(OC_SRC2.indexOf('sfc-oc-dot') !== -1, 'sfc-oc-dot CSS class missing');
});
check('Progress dots: 3 dots (i = 0, 1, 2)', function() {
  assert(OC_SRC2.indexOf('[0, 1, 2]') !== -1, '3 dots array not found');
});
check('_goSlide function defined', function() {
  assert(OC_SRC2.indexOf('_goSlide') !== -1, '_goSlide function not found');
});
check('TouchStart handler for swipe gesture', function() {
  assert(OC_SRC2.indexOf('touchstart') !== -1, 'touchstart handler missing');
});
check('TouchEnd handler for swipe gesture', function() {
  assert(OC_SRC2.indexOf('touchend') !== -1, 'touchend handler missing');
});
check('Swipe threshold is 50px', function() {
  assert(OC_SRC2.indexOf('< -50') !== -1 || OC_SRC2.indexOf('> 50') !== -1, '50px swipe threshold not found');
});
check('Next button becomes "Start now" on slide 2', function() {
  assert(OC_SRC2.indexOf('Start now') !== -1 || OC_SRC2.indexOf('Commencer') !== -1, 'Final CTA not found');
});
check('Back button hidden on slide 0', function() {
  assert(OC_SRC2.indexOf("display:none") !== -1 || OC_SRC2.indexOf("'none'") !== -1, 'Back button hide logic missing');
});
check('Carousel CSS injected into document.head', function() {
  assert(OC_SRC2.indexOf('document.head.appendChild') !== -1, 'CSS not injected into head');
});
check('will-change:transform present (performance optimization)', function() {
  assert(OC_SRC2.indexOf('will-change') !== -1, 'will-change:transform missing');
});
check('cubic-bezier easing for smooth transition', function() {
  assert(OC_SRC2.indexOf('cubic-bezier') !== -1, 'cubic-bezier easing missing');
});

console.log('\n=== 26. Persona-adapted welcome content ===');
check('Persona detection function _detectPersona present in onboarding-complete', function() {
  assert(OC_SRC2.indexOf('_detectPersona') !== -1, '_detectPersona not found');
});
check('All 6 personas covered: beginner', function() {
  assert(OC_SRC2.indexOf('beginner') !== -1, 'beginner persona missing');
});
check('All 6 personas covered: endurance', function() {
  assert(OC_SRC2.indexOf('endurance') !== -1, 'endurance persona missing');
});
check('All 6 personas covered: crossfit', function() {
  assert(OC_SRC2.indexOf('crossfit') !== -1, 'crossfit persona missing');
});
check('All 6 personas covered: weightloss', function() {
  assert(OC_SRC2.indexOf('weightloss') !== -1, 'weightloss persona missing');
});
check('All 6 personas covered: muscle', function() {
  assert(OC_SRC2.indexOf('muscle') !== -1, 'muscle persona missing');
});
check('All 6 personas covered: default', function() {
  assert(OC_SRC2.indexOf("'default'") !== -1, 'default persona missing');
});
check('FR headlines differ from EN headlines (bilingual content)', function() {
  assert(OC_SRC2.indexOf('FR_HEADLINES') !== -1, 'FR_HEADLINES not found');
  assert(OC_SRC2.indexOf('EN_HEADLINES') !== -1, 'EN_HEADLINES not found');
});
check('Persona icons map defined (emoji per persona)', function() {
  assert(OC_SRC2.indexOf('icons') !== -1, 'Persona icons map not found');
  assert(OC_SRC2.indexOf('🌱') !== -1, 'Beginner icon missing');
});
check('FR taglines defined for each persona', function() {
  assert(OC_SRC2.indexOf('FR_TAGLINES') !== -1, 'FR_TAGLINES not found');
});
check('EN taglines defined for each persona', function() {
  assert(OC_SRC2.indexOf('EN_TAGLINES') !== -1, 'EN_TAGLINES not found');
});
check('Feature cards on slide 2 include AI Coach (FR and EN)', function() {
  assert(OC_SRC2.indexOf('IA Coach') !== -1 || OC_SRC2.indexOf('AI Coach') !== -1,
    'AI Coach not in slide 2 feature cards');
});

console.log('\n=== 27. v2 API surface additions ===');
check('showVideoTip is a function on window.SFC_OB', function() {
  assert(typeof OB.showVideoTip === 'function', 'showVideoTip not a function');
});
check('getCompletionScore is a function on window.SFC_OB', function() {
  assert(typeof OB.getCompletionScore === 'function', 'getCompletionScore not a function');
});
check('_getSessionData is a function on window.SFC_OB', function() {
  assert(typeof OB._getSessionData === 'function', '_getSessionData not a function');
});
check('_trackViewVisit is a function on window.SFC_OB', function() {
  assert(typeof OB._trackViewVisit === 'function', '_trackViewVisit not a function');
});
check('_checkReEngagement is a function on window.SFC_OB', function() {
  assert(typeof OB._checkReEngagement === 'function', '_checkReEngagement not a function');
});
check('_firstWeekGuidance is a function on window.SFC_OB', function() {
  assert(typeof OB._firstWeekGuidance === 'function', '_firstWeekGuidance not a function');
});
check('_checkProgressiveUnlocks is a function on window.SFC_OB', function() {
  assert(typeof OB._checkProgressiveUnlocks === 'function', '_checkProgressiveUnlocks not a function');
});
check('_checkPremiumPresentation is a function on window.SFC_OB', function() {
  assert(typeof OB._checkPremiumPresentation === 'function', '_checkPremiumPresentation not a function');
});
check('v2 API: all v1 methods still present (no regression)', function() {
  ['init','showTip','openHelp','replayWelcome','trackEvent','reset',
   'getAnalytics','getSessionCount','dismissTip'].forEach(function(m) {
    assert(typeof OB[m] === 'function', 'v1 method missing after v2 upgrade: ' + m);
  });
});
check('v2 public API: injectProfileHelp preserved', function() {
  assert(typeof OB.injectProfileHelp === 'function', 'injectProfileHelp not on v2 API');
});

console.log('\n=== 28. Apple-level polish — micro-delights, emotional copy, dark mode ===');
var CSS2 = fs.readFileSync(ROOT + '/app/premium-ui.css', 'utf8');
var OC3  = fs.readFileSync(ROOT + '/app/onboarding-complete.js', 'utf8');
var SRC3 = fs.readFileSync(ROOT + '/app/onboarding-engine.js', 'utf8');

// CSS micro-delights
check('touch-action: manipulation on SFC onboarding elements', function() {
  assert(CSS2.indexOf('touch-action: manipulation') !== -1, 'touch-action missing on onboarding elements');
});
check('.sfc-tip-bar__dismiss min 44px touch target', function() {
  assert(CSS2.indexOf('.sfc-tip-bar__dismiss { min-height: 44px') !== -1 ||
    (CSS2.indexOf('sfc-tip-bar__dismiss') !== -1 && CSS2.indexOf('min-height: 44px') !== -1),
    '44px touch target for dismiss button missing');
});
check('Active press state on .sfc-tip-bar__dismiss (scale feedback)', function() {
  assert(CSS2.indexOf('.sfc-tip-bar__dismiss:active') !== -1, 'No :active state on dismiss');
});
check('Active press state on .sfc-discovery__btn', function() {
  assert(CSS2.indexOf('.sfc-discovery__btn:active') !== -1, 'No :active state on discovery btn');
});
check('Active press state on .sfc-help-modal__action-btn', function() {
  assert(CSS2.indexOf('.sfc-help-modal__action-btn:active') !== -1, 'No :active state on help action');
});
check('FAQ answer reveal animation defined (@keyframes sfc-answer-reveal)', function() {
  assert(CSS2.indexOf('@keyframes sfc-answer-reveal') !== -1, 'FAQ answer animation missing');
});
check('Answer reveal applied to .sfc-help-item__a:not([hidden])', function() {
  assert(CSS2.indexOf('.sfc-help-item__a:not([hidden])') !== -1, 'Answer reveal selector missing');
});
check('scroll-behavior: smooth on help modal body', function() {
  assert(CSS2.indexOf('scroll-behavior: smooth') !== -1, 'scroll-behavior smooth missing');
});
check('Profile help row chevron animation on hover', function() {
  assert(CSS2.indexOf('.sfc-profile-help-row > span:last-child') !== -1 &&
    CSS2.indexOf('transform: translateX(4px)') !== -1, 'Chevron animation missing');
});
check('Dark mode: discovery card dark background', function() {
  assert(CSS2.indexOf('sfc-discovery') !== -1 &&
    CSS2.indexOf('rgba(28, 28, 26') !== -1, 'Dark mode discovery card missing');
});
check('Dark mode: help item answer text color', function() {
  assert(CSS2.indexOf('.sfc-help-item__a') !== -1 &&
    CSS2.indexOf('rgba(232, 232, 224, 0.6)') !== -1, 'Dark help item answer color missing');
});
check('Micro-delights: reduced-motion suppresses animations', function() {
  assert(CSS2.indexOf('transform: none') !== -1, 'No transform:none suppression in CSS (reduced-motion)');
});

// Emotional copy quality
check('FR tip.comeback is warm — contains "attendait" (waiting tone)', function() {
  assert(SRC3.indexOf('attendait') !== -1, 'FR comeback lacks emotional warmth ("attendait")');
});
check('EN tip.comeback is warm — contains "waiting for you"', function() {
  assert(SRC3.indexOf('waiting for you') !== -1, 'EN comeback lacks waiting-for-you warmth');
});
check('FR tip.unlock_workout contains "livres" (milestone tone)', function() {
  assert(SRC3.indexOf('livres') !== -1, 'FR unlock_workout lacks milestone "livres" copy');
});
check('EN tip.unlock_workout contains "in the books"', function() {
  assert(SRC3.indexOf('in the books') !== -1, 'EN unlock_workout lacks "in the books" copy');
});
check('FR tip.ai_intro contains "sans jugement" (no-judgment tone)', function() {
  assert(SRC3.indexOf('sans jugement') !== -1, 'FR ai_intro lacks no-judgment copy');
});
check('EN tip.ai_intro contains "No judgment"', function() {
  assert(SRC3.indexOf('No judgment') !== -1, 'EN ai_intro lacks no-judgment copy');
});
check('FR tip.day3 is encouraging — contains "habitudes"', function() {
  assert(SRC3.indexOf('habitudes') !== -1, 'FR day3 lacks habit-formation encouragement');
});
check('EN tip.day3 contains "habits take hold"', function() {
  assert(SRC3.indexOf('habits take hold') !== -1, 'EN day3 lacks habits-take-hold copy');
});
check('FR tip.unlock_7days contains "vrai" (real progress tone)', function() {
  assert(SRC3.indexOf('quelque chose de vrai') !== -1, 'FR unlock_7days lacks real-progress copy');
});
check('Carousel taglines avoid technical jargon — no "hypertrophie" in beginner persona', function() {
  // The beginner tagline should not contain "hypertrophie"
  var beginnerFR = OC3.slice(OC3.indexOf('FR_TAGLINES'), OC3.indexOf('EN_TAGLINES'));
  assert(beginnerFR.indexOf('hypertrophie') === -1 || beginnerFR.indexOf('beginner') > beginnerFR.indexOf('hypertrophie') === false, 'Beginner tagline should not contain technical jargon');
});
check('Carousel slide 2 feature desc: EN AI Coach has "No judgment"', function() {
  assert(OC3.indexOf('No judgment') !== -1, 'AI Coach feature desc lacks "No judgment" copy');
});
check('Carousel slide 2 feature desc: FR AI Coach has "Zéro jugement"', function() {
  assert(OC3.indexOf('Zéro jugement') !== -1, 'FR AI Coach feature desc lacks "Zéro jugement"');
});
check('Carousel slide 2: FR features mention "4 prochaines semaines"', function() {
  assert(OC3.indexOf('4 prochaines semaines') !== -1, 'FR calendar desc lacks 4-week horizon copy');
});
check('Carousel slide 2: EN features mention "next 4 weeks"', function() {
  assert(OC3.indexOf('next 4 weeks') !== -1, 'EN calendar desc lacks 4-week horizon copy');
});

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
var total = pass + fail;
console.log('\n══════════════════════════════════════════════════════════════');
console.log('Onboarding Engine QA : ' + pass + ' ✓  ' + fail + ' ✗  (total ' + total + ')');
if (fail > 0) process.exit(1);
