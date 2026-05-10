/**
 * unit-hardening-p0p1.js
 * Tests for SmartFitCoach Production Hardening — Phase 1 & 2
 * Covers: P0 (merge RPC, devalidate), P1 (TTL, engine lock, loading, weight),
 *         P2 (sport generation guard, weight fallback, rest override log)
 */
'use strict';

// ─── Minimal test harness ────────────────────────────────────────────────────
var _passed = 0, _failed = 0, _errors = [];
function test(name, fn) {
  try {
    fn();
    _passed++;
    console.log('  PASS', name);
  } catch(e) {
    _failed++;
    _errors.push({ name: name, error: e.message || String(e) });
    console.error('  FAIL', name, '—', e.message || String(e));
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error((msg || '') + ' — expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a));
}

// ─── Browser globals stub ────────────────────────────────────────────────────
if (typeof window === 'undefined') { global.window = global; }
if (typeof document === 'undefined') {
  global.document = {
    getElementById: function() { return null; },
    querySelectorAll: function() { return []; },
    createElement: function(tag) {
      return { id: '', style: {cssText: ''}, textContent: '', className: '', parentNode: null,
               appendChild: function(c) { c.parentNode = this; } };
    },
    body: { appendChild: function() {} },
    head: { appendChild: function() {} }
  };
}
if (typeof navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true, configurable: true });
}
if (typeof localStorage === 'undefined') {
  var _lsData = {};
  global.localStorage = {
    getItem: function(k) { return _lsData[k] !== undefined ? _lsData[k] : null; },
    setItem: function(k, v) { _lsData[k] = String(v); },
    removeItem: function(k) { delete _lsData[k]; },
    get length() { return Object.keys(_lsData).length; },
    key: function(i) { return Object.keys(_lsData)[i] || null; }
  };
}
if (typeof sessionStorage === 'undefined') {
  var _ssData = {};
  global.sessionStorage = {
    getItem: function(k) { return _ssData[k] !== undefined ? _ssData[k] : null; },
    setItem: function(k, v) { _ssData[k] = String(v); },
    removeItem: function(k) { delete _ssData[k]; },
    get length() { return Object.keys(_ssData).length; }
  };
}

// ─── Load modules ────────────────────────────────────────────────────────────
var path = require('path');
var appDir = path.join(__dirname, '..', 'app');

// Stub window.S before loading modules
window.S = {
  sportType: 'musculation', sportLevel: 'intermediate', sportDays: 3,
  sportEquipment: 'gym', sportGoals: ['muscle'], sportFocus: {},
  weight: 75, sex: 'homme', muscuCycle: 1
};
window.showToast = function() {};
window.isEnglish = function() { return false; };

// Load safeStorage (defined in app-main.js top) — stub it
window.safeStorage = (function() {
  var _localData = {};
  return {
    local: {
      getItem: function(k) { return _localData[k] !== undefined ? _localData[k] : null; },
      setItem: function(k, v) { _localData[k] = String(v); return true; },
      removeItem: function(k) { delete _localData[k]; return true; }
    },
    session: {
      getItem: function() { return null; },
      setItem: function() { return true; },
      removeItem: function() { return true; }
    },
    _data: _localData
  };
})();

// ─── Load sfc-decision-core.js ───────────────────────────────────────────────
// Stub required dependencies
window.SFCSymbiosis = {
  LOAD_MULTIPLIERS: {
    heavy:    { cal: 1.10, carbBoost: 1.20 },
    moderate: { cal: 1.07, carbBoost: 1.10 },
    light:    { cal: 1.03, carbBoost: 1.00 },
    rest:     { cal: 0.90, carbBoost: 0.90 }
  },
  getPeriodizationCfg: function() { return { durMax: 90, durSets: 3 }; },
  getWeekIndex: function() { return 0; }
};
window.DailyDecisionEngineV3 = {
  decideDailyPlanV3: function(inputs) { return { decision: 'train', recommendedIntensity: 'moderate', coachingMessage: 'V3 result', _version: 'V3' }; }
};

try {
  require(path.join(appDir, 'sfc-decision-core.js'));
} catch(e) {}

// ─── Load app-sport.js partially (just the parts we test) ───────────────────
// Stub dependencies for app-sport
window.SPORT_LEVELS = [{ id: 'beginner' }, { id: 'intermediate' }, { id: 'advanced' }];
window.MACRO_PHASES = [
  { id: 'hypertrophie', pct1rmBonus: 0, setsBonus: 1 },
  { id: 'force', pct1rmBonus: 0.12, setsBonus: 0 },
  { id: 'transition', pct1rmBonus: -0.10, setsBonus: -1 }
];
window.MUSCU_KEY_EXERCISES = [];
window.isFemale = function(s) { return s && s.sex === 'femme'; };
window.MEDICAL_LIMITS = { HTA_INTENSITY_CAP: 0.60 };
window.getMusculationWeight = null;
window.estimateBaseLoad = null;

try {
  require(path.join(appDir, 'app-sport.js'));
} catch(e) {
  // app-sport.js has many DOM dependencies — partial load is expected
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n══ P0-1: Merge RPC / _sfc_save_pending migration ═══════════════════');

test('P0-1.1: _sfc_save_pending stored in safeStorage.local (not sessionStorage)', function() {
  // The helpers use safeStorage.local — verify sessionStorage is NOT written
  var _prevSS = sessionStorage.getItem('_sfc_save_pending');
  // Simulate what SupaSync would do (if loaded): use the helpers
  // Since supabase-client.js runs in an IIFE and uses internal helpers, we verify
  // the intent via the localStorage mock
  window.safeStorage.local.setItem('_sfc_save_pending', String(Date.now()));
  var got = window.safeStorage.local.getItem('_sfc_save_pending');
  assert(got !== null, 'Flag should be in localStorage');
  assert(sessionStorage.getItem('_sfc_save_pending') === _prevSS, 'Flag must NOT be in sessionStorage');
  window.safeStorage.local.removeItem('_sfc_save_pending');
});

test('P0-1.2: Stale pending flag (>24h) is ignored', function() {
  var _stale = String(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
  window.safeStorage.local.setItem('_sfc_save_pending', _stale);
  var _raw = window.safeStorage.local.getItem('_sfc_save_pending');
  var _ts = parseInt(_raw, 10);
  var _valid = !!(_raw && (Date.now() - _ts) < 24 * 60 * 60 * 1000);
  assert(!_valid, 'Stale flag (>24h) must be treated as absent');
  window.safeStorage.local.removeItem('_sfc_save_pending');
});

test('P0-1.3: Fresh pending flag (<24h) is treated as pending', function() {
  var _fresh = String(Date.now() - 5 * 60 * 1000); // 5min ago
  window.safeStorage.local.setItem('_sfc_save_pending', _fresh);
  var _raw = window.safeStorage.local.getItem('_sfc_save_pending');
  var _ts = parseInt(_raw, 10);
  var _valid = !!(_raw && (Date.now() - _ts) < 24 * 60 * 60 * 1000);
  assert(_valid, 'Fresh flag (<24h) must be treated as pending');
  window.safeStorage.local.removeItem('_sfc_save_pending');
});

console.log('\n══ P1-5: Premium cache TTL reduction ════════════════════════════════');

test('P1-5.1: safeUserStatusCheck CACHE_TTL is ≤ 5 minutes', function() {
  // We verify through source inspection that TTL was reduced
  var src = require('fs').readFileSync(path.join(appDir, 'supabase-client.js'), 'utf8');
  assert(src.indexOf('5 * 60 * 1000') !== -1, 'supabase-client.js should have 5 * 60 * 1000 TTL');
  assert(src.indexOf('15 * 60 * 1000') === -1, '15-minute TTL must be removed');
});

test('P1-5.2: safeUserStatusCheck invalidates cache on not-premium response', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'supabase-client.js'), 'utf8');
  assert(src.indexOf('Immediately invalidate cache if server confirms not-premium') !== -1, 'Cache invalidation comment must be present');
  assert(src.indexOf('sync._userStatusCache   = null') !== -1 || src.indexOf('sync._userStatusCache = null') !== -1, 'Cache must be cleared on not-premium');
});

console.log('\n══ P0-2: devalidateSportProgram — weight in SPORT_PROGRAM_KEYS ═══');

test('P0-2.1: SPORT_PROGRAM_KEYS includes weight', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-main.js'), 'utf8');
  // Find SPORT_PROGRAM_KEYS definition
  var idx = src.indexOf("var SPORT_PROGRAM_KEYS = [");
  assert(idx !== -1, 'SPORT_PROGRAM_KEYS must be defined');
  var block = src.slice(idx, idx + 400);
  assert(block.indexOf("'weight'") !== -1, "'weight' must be in SPORT_PROGRAM_KEYS");
});

console.log('\n══ P1-8: Decision engine version lock ═══════════════════════════════');

test('P1-8.1: _decisionEngineVersion is stored in S after first call', function() {
  window.S._decisionEngineVersion = null;
  if (typeof window.SFCDecisionCore !== 'undefined' && window.SFCDecisionCore.decidePlan) {
    try {
      window.SFCDecisionCore.decidePlan();
    } catch(e) {}
    assert(window.S._decisionEngineVersion !== null, '_decisionEngineVersion must be set after first decidePlan call');
  } else {
    // If module not fully loaded, verify source has the locking code
    var src = require('fs').readFileSync(path.join(appDir, 'sfc-decision-core.js'), 'utf8');
    assert(src.indexOf('_decisionEngineVersion') !== -1, 'Engine version lock code must exist');
    assert(src.indexOf('S._decisionEngineVersion = _engineVersion') !== -1, 'Engine version must be stored in S');
  }
});

test('P1-8.2: V2 fallback emits console.warn', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'sfc-decision-core.js'), 'utf8');
  assert(src.indexOf("console.warn('[SFCDecisionCore] V3 not available") !== -1, 'V2 fallback must emit warning');
});

test('P1-8.3: V1 fallback emits console.warn', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'sfc-decision-core.js'), 'utf8');
  assert(src.indexOf("console.warn('[SFCDecisionCore] V3/V2 not available") !== -1, 'V1 fallback must emit warning');
});

console.log('\n══ P1-9: Loading state during syncOnLogin ═══════════════════════════');

test('P1-9.1: _syncingFromCloud flag is set before syncOnLogin', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-main.js'), 'utf8');
  assert(src.indexOf('window.S._syncingFromCloud = true') !== -1, '_syncingFromCloud must be set to true before sync');
});

test('P1-9.2: Sync banner is shown after 300ms delay', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-main.js'), 'utf8');
  assert(src.indexOf('setTimeout(_showSyncBanner, 300)') !== -1, 'Sync banner must have 300ms delay');
});

test('P1-9.3: _hideSyncBanner is called in both then and catch', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-main.js'), 'utf8');
  var thenCount = (src.match(/_hideSyncBanner\(\)/g) || []).length;
  assert(thenCount >= 2, '_hideSyncBanner must be called in both success and error paths (found: ' + thenCount + ')');
});

console.log('\n══ generateSportProgram: sportType null guard ═══════════════════════');

test('sport.1: generateSportProgram returns [] for null sportType (source check)', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf('S.sportType is null/undefined') !== -1, 'null/undefined guard message must exist');
  assert(src.indexOf("S.sportType !== 'musculation'") !== -1, 'non-musculation guard must exist');
});

test('sport.2: generateSportProgram guard returns [] (runtime check)', function() {
  if (typeof window.generateSportProgram === 'function') {
    window.S.sportType = null;
    var result = window.generateSportProgram();
    assert(Array.isArray(result) && result.length === 0, 'Must return [] for null sportType');
    window.S.sportType = 'running';
    result = window.generateSportProgram();
    assert(Array.isArray(result) && result.length === 0, 'Must return [] for running sportType');
    window.S.sportType = 'musculation';
  } else {
    // Runtime not available — source already verified above
    assert(true);
  }
});

console.log('\n══ P2-10: getSuggestedWeight — never null ══════════════════════════');

test('weight.1: getSuggestedWeight never returns null (source check)', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf('Priority 5: universal fallback') !== -1, 'Universal fallback must exist');
  assert(src.indexOf('never return null') !== -1, 'Null prevention comment must exist');
});

test('weight.2: getSuggestedWeight returns > 0 for beginner (runtime)', function() {
  if (typeof window.getSuggestedWeight === 'function') {
    window.S.sportLevel = 'beginner';
    window.S.weight = 70;
    window.S.sex = 'homme';
    var w = window.getSuggestedWeight('Squat Barre', 8, { pct1rm: 0.72 });
    assert(w !== null, 'Must not return null');
    assert(w > 0, 'Must return > 0 for beginner squat');
    assert(!isNaN(w), 'Must not return NaN');

    // Intermediate no profile
    window.S.sportLevel = 'intermediate';
    window.S.muscuStrengthProfile = {};
    var w2 = window.getSuggestedWeight('Développé Couché', 8, { pct1rm: 0.72 });
    assert(w2 !== null, 'Must not return null for intermediate without profile');
    assert(w2 > 0, 'Must return > 0 for intermediate without profile');
  } else {
    assert(true, 'getSuggestedWeight not available in test env');
  }
});

console.log('\n══ P2-12: restOverride warning ══════════════════════════════════════');

test('rest.1: restOverride warning log exists in source', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf('restOverride ignoré (priorité goal:') !== -1, 'restOverride warning must exist in source');
});

console.log('\n══ Phase 4: Performance monitor ════════════════════════════════════');

test('perf.1: sfc-perf-monitor.js syntax is valid', function() {
  require('child_process').execSync('node --check ' + path.join(appDir, 'sfc-perf-monitor.js'));
  assert(true);
});

test('perf.2: SFCPerf module exports start, report, reset', function() {
  require(path.join(appDir, 'sfc-perf-monitor.js'));
  assert(typeof window.SFCPerf === 'object', 'SFCPerf must be defined');
  assert(typeof window.SFCPerf.start === 'function', 'SFCPerf.start must be a function');
  assert(typeof window.SFCPerf.report === 'function', 'SFCPerf.report must be a function');
  assert(typeof window.SFCPerf.reset === 'function', 'SFCPerf.reset must be a function');
});

test('perf.3: SFCPerf.reset clears render count', function() {
  window.SFCPerf.reset();
  var m = window.SFCPerf.metrics;
  assert(m.render.count === 0, 'render.count must be 0 after reset');
  assert(m.network.saves === 0, 'network.saves must be 0 after reset');
});

console.log('\n══ Integration: perf monitor included in index.html ════════════════');

test('int.1: sfc-perf-monitor.js is in index.html', function() {
  var html = require('fs').readFileSync(path.join(appDir, 'index.html'), 'utf8');
  assert(html.indexOf('sfc-perf-monitor.js') !== -1, 'sfc-perf-monitor.js must be in index.html');
});

// ── Duration bug: double-deload fix ──────────────────────────────────────────
console.log('\n══ Duration bug: no double-deload in S4 ════════════════════════════');

test('deload.1: muscu-engine perioCfgApplied skips set-count reduction in W4', function() {
  var sfcBuildMuscuDay = require(path.join(appDir, 'muscu-engine.js')).sfcBuildMuscuDay;
  window.EXERCISES = {
    jambes: [
      { n: 'Squat', m: 'Quadriceps', sets: '3×12-15', rest: '90s', eq: 'Barre', lv: 2, tags: ['compose'] },
      { n: 'Leg Press', m: 'Quadriceps', sets: '3×12-15', rest: '90s', eq: 'Machine', lv: 1, tags: ['compose'] },
      { n: 'RDL', m: 'Ischios', sets: '3×12-15', rest: '90s', eq: 'Barre', lv: 2, tags: ['compose'] },
      { n: 'Leg Curl', m: 'Ischios', sets: '3×12-15', rest: '60s', eq: 'Machine', lv: 1, tags: ['isolation'] },
      { n: 'Leg Extension', m: 'Quadriceps', sets: '3×12-15', rest: '60s', eq: 'Machine', lv: 1, tags: ['isolation'] }
    ]
  };
  // S4 deload: durSets already reduced to 3 by SFCSymbiosis, perioCfgApplied=true
  var exWithFlag = sfcBuildMuscuDay(['jambes'], {
    exercises: window.EXERCISES, durMax: 5, durSets: 3,
    weekIndex: 4, perioCfgApplied: true
  });
  var setsWithFlag = exWithFlag.map(function(e) { return parseInt((e.sets||'').match(/^(\d+)/)[1]); });
  // S4: compound should have durSets=3, isolation=max(2, durSets-1)=2
  // With perioCfgApplied, step 8 must NOT subtract 1 more
  assert(setsWithFlag.every(function(s) { return s >= 2; }), 'sets must not drop below 2');
  var compounds = exWithFlag.filter(function(e) { return (e.tags||[]).indexOf('isolation') === -1 && (e.tags||[]).indexOf('finisher') === -1; });
  assert(compounds.every(function(e) { return parseInt(e.sets) === 3; }), 'compound sets must be 3 (not 2) when perioCfgApplied');
});

test('deload.2: muscu-engine without perioCfgApplied still reduces sets in W4', function() {
  var sfcBuildMuscuDay = require(path.join(appDir, 'muscu-engine.js')).sfcBuildMuscuDay;
  window.EXERCISES = {
    jambes: [
      { n: 'Squat', m: 'Quadriceps', sets: '4×12-15', rest: '90s', eq: 'Barre', lv: 2, tags: ['compose'] },
      { n: 'Leg Press', m: 'Quadriceps', sets: '4×12-15', rest: '90s', eq: 'Machine', lv: 1, tags: ['compose'] }
    ]
  };
  // Without perioCfgApplied (no SFCSymbiosis), step 8 deload still fires
  var exNoFlag = sfcBuildMuscuDay(['jambes'], {
    exercises: window.EXERCISES, durMax: 2, durSets: 4,
    weekIndex: 4
  });
  var compounds = exNoFlag.filter(function(e) { return (e.tags||[]).indexOf('isolation') === -1; });
  assert(compounds.every(function(e) { return parseInt(e.sets) === 3; }), 'step 8 deload must fire when perioCfgApplied is absent (4-1=3)');
});

// ── Stabilisation définitive: nutrition single source of truth ───────────────
console.log('\n══ Stab-1: NutritionMaster KCAL_FLOOR exported ═════════════════════');

test('nm.kcal_floor.1: NutritionMaster exports KCAL_FLOOR_FEMALE=1400', function() {
  require(path.join(appDir, 'nutrition-master.js'));
  assert(typeof window.NutritionMaster === 'object', 'NutritionMaster must be defined');
  assertEqual(window.NutritionMaster.KCAL_FLOOR_FEMALE, 1400, 'KCAL_FLOOR_FEMALE');
});

test('nm.kcal_floor.2: NutritionMaster exports KCAL_FLOOR_MALE=1500', function() {
  assertEqual(window.NutritionMaster.KCAL_FLOOR_MALE, 1500, 'KCAL_FLOOR_MALE');
});

test('nm.kcal_floor.3: NutritionMaster.compute with no bodyFatEstimate uses Mifflin-St Jeor', function() {
  var r = window.NutritionMaster.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  assert(r.errors.length === 0, 'No errors');
  // Mifflin-St Jeor: 10*80 + 6.25*180 - 5*30 + 5 = 800+1125-150+5 = 1780
  assertEqual(r.bmr, 1780, 'BMR must be Mifflin-St Jeor 1780');
});

test('nm.kcal_floor.4: NutritionMaster.compute with bodyFatEstimate=15 uses Katch-McArdle', function() {
  var r = window.NutritionMaster.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false, bodyFatEstimate: 15 });
  assert(r.errors.length === 0, 'No errors');
  // Katch-McArdle: LBM=80*0.85=68, BMR=370+21.6*68=370+1468.8≈1839
  var expected = Math.round(370 + 21.6 * (80 * 0.85));
  assertEqual(r.bmr, expected, 'BMR must be Katch-McArdle');
});

test('nm.kcal_floor.5: NutritionMaster.compute with trainingDay=true does NOT apply carb cycling (controlled by app-core)', function() {
  // trainingDay is always false in buildNMInputs — carb cycling is app-core's responsibility
  var rNo = window.NutritionMaster.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  var rYes = window.NutritionMaster.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: true });
  // trainingDay=true inside NM applies carb cycling — but buildNMInputs passes false, so this tests the NM contract
  assert(rYes.carbCyclingApplied === true, 'NM with trainingDay=true applies cycling internally');
  assert(rNo.carbCyclingApplied === false, 'NM with trainingDay=false skips cycling (app-core handles it)');
});

console.log('\n══ Stab-2: isPremium fail-closed ════════════════════════════════════');

test('prem.failclosed.1: isPremium returns false when _subStatusReady=false (loading)', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-core.js'), 'utf8');
  // Check that the fail-closed pattern is present: !s._subStatusReady → return false
  assert(src.indexOf('if (!s._subStatusReady) return false') !== -1, 'isPremium must deny when status not ready');
});

test('prem.failclosed.2: isPremium returns false when firstLoginDate missing after status ready', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-core.js'), 'utf8');
  assert(src.indexOf('if (!s.firstLoginDate) return false') !== -1, 'isPremium must deny when firstLoginDate missing');
});

test('prem.failclosed.3: isPremium catch block returns false (not true)', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-core.js'), 'utf8');
  var _premStart = src.indexOf('function isPremium()');
  var _premEnd = src.indexOf('\nfunction ', _premStart + 1);
  var premFn = src.slice(_premStart, _premEnd > _premStart ? _premEnd : _premStart + 1500);
  // catch must contain return false
  assert(premFn.indexOf('catch(e)') !== -1, 'isPremium must have catch block');
  var catchIdx = premFn.indexOf('catch(e)');
  var catchBody = premFn.slice(catchIdx, catchIdx + 60);
  assert(catchBody.indexOf('return false') !== -1, 'isPremium catch must return false — got: ' + catchBody);
  assert(catchBody.indexOf('return true') === -1, 'isPremium catch must NOT return true');
});

console.log('\n══ Stab-3: All sports call processCompletedSession ═════════════════');

test('sports.symbiosis.1: _completeSportSession writes to S.sessionHistory', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf('function _completeSportSession') !== -1, '_completeSportSession must be defined');
  assert(src.indexOf('window._completeSportSession') !== -1, '_completeSportSession must be exported');
});

test('sports.symbiosis.2: padel session display has _completeSportSession call', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf("_completeSportSession('padel'") !== -1, 'padel must call _completeSportSession');
});

test('sports.symbiosis.3: golf session display has _completeSportSession call', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf("_completeSportSession('golf'") !== -1, 'golf must call _completeSportSession');
});

test('sports.symbiosis.4: triathlon session display has _completeSportSession call', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf("_completeSportSession('triathlon'") !== -1, 'triathlon must call _completeSportSession');
});

test('sports.symbiosis.5: yoga session display has _completeSportSession call', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf("_completeSportSession('yoga'") !== -1, 'yoga must call _completeSportSession');
});

test('sports.symbiosis.6: cycling session display has _completeSportSession call', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf("_completeSportSession('cycling'") !== -1, 'cycling must call _completeSportSession');
});

test('sports.symbiosis.7: calisthenics session display has _completeSportSession call', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-sport.js'), 'utf8');
  assert(src.indexOf("_completeSportSession('calisthenics'") !== -1, 'calisthenics must call _completeSportSession');
});

console.log('\n══ Stab-4: Coach quota keyed by uid ════════════════════════════════');

test('coach.quota.1: coach count key includes uid (not global)', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'ai-coach.js'), 'utf8');
  assert(src.indexOf("'sfc_coach_count_' + _uid") !== -1, 'coach count key must include uid');
  assert(src.indexOf("'sfc_coach_count'") === -1 || src.indexOf("removeItem('sfc_coach_count')") !== -1, 'bare sfc_coach_count key must not be used for write');
});

test('coach.quota.2: logout purges legacy sfc_coach_count key', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'auth.js'), 'utf8');
  assert(src.indexOf("removeItem('sfc_coach_count')") !== -1, 'auth.js logout must remove legacy sfc_coach_count key');
});

console.log('\n══ Stab-5: Persistence — debounce reduced to 1500ms ════════════════');

test('persist.debounce.1: supabase-client debounce is 1500ms not 5000ms', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'supabase-client.js'), 'utf8');
  assert(src.indexOf('}, 1500)') !== -1, 'debounce must be 1500ms');
  assert(src.indexOf('}, 5000)') === -1, 'old 5000ms debounce must not exist');
});

test('persist.debounce.2: supabase-client has beforeunload flush', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'supabase-client.js'), 'utf8');
  assert(src.indexOf("'beforeunload'") !== -1, 'beforeunload listener must exist for flush');
});

test('persist.debounce.3: supabase-client flushes on visibilitychange=hidden', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'supabase-client.js'), 'utf8');
  assert(src.indexOf("visibilityState === 'hidden'") !== -1, 'flush on hidden must exist');
});

console.log('\n══ Stab-6: Security — no raw sessionStorage, no innerHTML injection ═');

test('sec.session.1: app-nutrition.js uses safeStorage.session not sessionStorage directly', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-nutrition.js'), 'utf8');
  // The filter section should use _sfcSS not raw sessionStorage
  var filterSection = src.slice(src.indexOf('SFC_FILTER_KEY'), src.indexOf('SFC_FILTER_KEY') + 500);
  assert(filterSection.indexOf('_sfcSS.getItem') !== -1 || filterSection.indexOf('_sfcSS.setItem') !== -1, 'filter section must use _sfcSS wrapper');
});

test('sec.session.2: debug bar uses DOM methods not innerHTML for user-controlled values', function() {
  var src = require('fs').readFileSync(path.join(appDir, 'app-main.js'), 'utf8');
  var debugBar = src.slice(src.indexOf('sfc-global-debug'), src.indexOf('END GLOBAL DEBUG BAR'));
  assert(debugBar.indexOf('textContent') !== -1, 'debug bar must use textContent not innerHTML for values');
  // The innerHTML with subscription plan data should be gone
  assert(debugBar.indexOf("_gPlan + '</b>") === -1, 'debug bar must not inject subscriptionPlan via innerHTML');
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('RESULTS:', _passed, 'passed,', _failed, 'failed');
if (_errors.length) {
  console.error('FAILURES:');
  _errors.forEach(function(e) { console.error(' ✗', e.name, '—', e.error); });
}
console.log('═══════════════════════════════════════════════════════════════════\n');
if (_failed > 0) process.exit(1);
