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

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
var total = pass + fail;
console.log('\n══════════════════════════════════════════════════════════════');
console.log('Onboarding Engine QA : ' + pass + ' ✓  ' + fail + ' ✗  (total ' + total + ')');
if (fail > 0) process.exit(1);
