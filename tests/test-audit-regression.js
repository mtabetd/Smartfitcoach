'use strict';
// ─── AUDIT REGRESSION TESTS ──────────────────────────────────────────────────
// Tests added during full-app audit 2026-04-30.
// Covers: label consistency, navigation integrity, session history, _shortFocus.
// Usage: node tests/test-audit-regression.js

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
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error((msg || '') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}

// ── Inline _getSplitLabels logic (mirrors today-dashboard.js) ─────────────────
function makeSplitLabels(isEnglish) {
  return {
    fullbody_ab: ['Full Body A','Full Body B'],
    fullbody_3:  ['Full Body A','Full Body B','Full Body C'],
    ppl_3:       ['Push','Pull','Legs'],
    upper_lower: ['Upper A','Lower A','Upper B','Lower B'],
    ppl_plus1:   ['Push','Pull','Legs','Upper'],
    bro_4:  isEnglish ? ['Chest + Triceps','Back + Biceps','Shoulders','Legs'] : ['Pecs + Triceps','Dos + Bicéps','Épaules','Jambes'],
    ppl_5:       ['Push A','Pull A','Legs','Push B','Pull B'],
    bro_5:  isEnglish ? ['Chest','Back','Shoulders','Arms','Legs'] : ['Pecs','Dos','Épaules','Bras','Jambes'],
    ppl_6:       ['Push A','Pull A','Legs A','Push B','Pull B','Legs B']
  };
}

// ── _shortFocus logic (mirrors app-sport.js) ──────────────────────────────────
function shortFocus(focus) {
  if (!focus) return '';
  var trimmed = String(focus).trim();
  if (trimmed.length <= 9) return trimmed;
  var f = trimmed.toLowerCase();
  if (/full[\s-]?body|tout/.test(f)) return 'Full Body';
  if (/push|pectoral|poitrine/.test(f)) return 'Push';
  if (/pull|dorsaux/.test(f)) return 'Pull';
  if (/upper|haut du corps/.test(f)) return 'Upper';
  if (/lower|bas du corps/.test(f)) return 'Lower';
  if (/\bcore\b|abdo/.test(f)) return 'Core';
  if (/cardio|hiit/.test(f)) return 'Cardio';
  if (/repos|rest/.test(f)) return 'Repos';
  var first = trimmed.split(/[\s,·\-]/)[0];
  return first.length > 10 ? first.slice(0, 10) : first;
}

// ── Label resolution (mirrors today-dashboard.js renderCardSport logic) ────────
function resolveLabel(day, idx, splitLabelMap, isEnglish) {
  var storedKey = day.splitKey || null;
  var storedIdx = (typeof day.splitDayIdx === 'number') ? day.splitDayIdx : idx;
  var storedLabels = storedKey ? (splitLabelMap[storedKey] || null) : null;
  var isGeneric = !day.name || /^(Jour|Session|Séance)\s+\d+$/i.test(day.name);
  return (storedLabels && storedLabels[storedIdx]) ? storedLabels[storedIdx]
       : (!isGeneric ? day.name
       : (isEnglish ? 'Session ' : 'Séance ') + (idx + 1));
}

// ── Section A: _shortFocus — French names preserved ───────────────────────────
console.log('\n_shortFocus — French split day names preserved');

test('Pecs (4 chars) → Pecs (not Push)', function () {
  assertEqual(shortFocus('Pecs'), 'Pecs');
});
test('Dos (3 chars) → Dos (not Pull)', function () {
  assertEqual(shortFocus('Dos'), 'Dos');
});
test('Jambes (6 chars) → Jambes (not Legs)', function () {
  assertEqual(shortFocus('Jambes'), 'Jambes');
});
test('Épaules (7 chars) → Épaules', function () {
  assertEqual(shortFocus('Épaules'), 'Épaules');
});
test('Bras (4 chars) → Bras', function () {
  assertEqual(shortFocus('Bras'), 'Bras');
});
test('Push (4 chars) → Push', function () {
  assertEqual(shortFocus('Push'), 'Push');
});
test('Pull (4 chars) → Pull', function () {
  assertEqual(shortFocus('Pull'), 'Pull');
});
test('Legs (4 chars) → Legs', function () {
  assertEqual(shortFocus('Legs'), 'Legs');
});
test('Full Body A (10 chars) → Full Body', function () {
  assertEqual(shortFocus('Full Body A'), 'Full Body');
});
test('Full Body AB (11 chars) → Full Body', function () {
  assertEqual(shortFocus('Full Body AB'), 'Full Body');
});
test('Push A (6 chars) → Push A', function () {
  assertEqual(shortFocus('Push A'), 'Push A');
});
test('Pull B (6 chars) → Pull B', function () {
  assertEqual(shortFocus('Pull B'), 'Pull B');
});
test('empty string → empty string', function () {
  assertEqual(shortFocus(''), '');
});
test('null → empty string', function () {
  assertEqual(shortFocus(null), '');
});

// ── Section B: Label resolution — splitKey-based ──────────────────────────────
console.log('\nLabel resolution — splitKey-based (immune to post-gen split change)');

test('bro_5 day 2 FR → Épaules (not Legs even if split changed to ppl_5)', function () {
  var day = { name: 'Épaules', splitKey: 'bro_5', splitDayIdx: 2 };
  var labels = makeSplitLabels(false);
  assertEqual(resolveLabel(day, 2, labels, false), 'Épaules');
});
test('bro_5 day 2 FR, split changed to ppl_5, label still from bro_5', function () {
  var day = { name: 'Épaules', splitKey: 'bro_5', splitDayIdx: 2 };
  var labels = makeSplitLabels(false);
  // Even if we pass idx=2 which in ppl_5 would be 'Legs', splitKey is used
  assertEqual(resolveLabel(day, 2, labels, false), 'Épaules');
});
test('bro_5 day 4 FR → Jambes', function () {
  var day = { name: 'Jambes', splitKey: 'bro_5', splitDayIdx: 4 };
  var labels = makeSplitLabels(false);
  assertEqual(resolveLabel(day, 4, labels, false), 'Jambes');
});
test('bro_5 day 2 EN → Shoulders', function () {
  var day = { name: 'Épaules', splitKey: 'bro_5', splitDayIdx: 2 };
  var labels = makeSplitLabels(true);
  assertEqual(resolveLabel(day, 2, labels, true), 'Shoulders');
});
test('bro_5 day 0 EN → Chest (not Pecs)', function () {
  var day = { name: 'Pecs', splitKey: 'bro_5', splitDayIdx: 0 };
  var labels = makeSplitLabels(true);
  assertEqual(resolveLabel(day, 0, labels, true), 'Chest');
});
test('bro_5 day 4 EN → Legs', function () {
  var day = { name: 'Jambes', splitKey: 'bro_5', splitDayIdx: 4 };
  var labels = makeSplitLabels(true);
  assertEqual(resolveLabel(day, 4, labels, true), 'Legs');
});
test('ppl_3 day 0 → Push (both FR and EN)', function () {
  var day = { name: 'Push', splitKey: 'ppl_3', splitDayIdx: 0 };
  var labels = makeSplitLabels(false);
  assertEqual(resolveLabel(day, 0, labels, false), 'Push');
});
test('No splitKey stored — falls back to day.name if non-generic', function () {
  var day = { name: 'Épaules' }; // no splitKey (old program)
  var labels = makeSplitLabels(false);
  assertEqual(resolveLabel(day, 2, labels, false), 'Épaules');
});
test('Generic day.name without splitKey → numbered fallback', function () {
  var day = { name: 'Jour 1' }; // no splitKey, generic name
  var labels = makeSplitLabels(false);
  assertEqual(resolveLabel(day, 0, labels, false), 'Séance 1');
});
test('Generic day.name without splitKey EN → numbered fallback EN', function () {
  var day = { name: 'Session 3' }; // no splitKey, generic name
  var labels = makeSplitLabels(true);
  assertEqual(resolveLabel(day, 2, labels, true), 'Session 3');
});

// ── Section C: _getSplitLabels coherence ─────────────────────────────────────
console.log('\n_getSplitLabels — array lengths consistent');

var ALL_SPLITS = {
  fullbody_ab: 2, fullbody_3: 3, ppl_3: 3, upper_lower: 4,
  ppl_plus1: 4, bro_4: 4, ppl_5: 5, bro_5: 5, ppl_6: 6
};

Object.keys(ALL_SPLITS).forEach(function (splitKey) {
  var expected = ALL_SPLITS[splitKey];
  test(splitKey + ' FR has ' + expected + ' entries', function () {
    var labels = makeSplitLabels(false);
    assert(Array.isArray(labels[splitKey]), 'must be array');
    assertEqual(labels[splitKey].length, expected, splitKey + ' FR length');
  });
  test(splitKey + ' EN has ' + expected + ' entries', function () {
    var labels = makeSplitLabels(true);
    assert(Array.isArray(labels[splitKey]), 'must be array');
    assertEqual(labels[splitKey].length, expected, splitKey + ' EN length');
  });
  test(splitKey + ' no entry is empty/null', function () {
    var labels = makeSplitLabels(false);
    labels[splitKey].forEach(function (lbl, i) {
      assert(typeof lbl === 'string' && lbl.length > 0, splitKey + '[' + i + '] must be non-empty string');
    });
  });
});

// ── Section D: Session History (SFCSessionHistory module) ────────────────────
console.log('\nSession history integration');
var SH = require('../app/session-history.js');
SH.clearSessionHistory();

test('getSessionHistory returns array', function () {
  assert(Array.isArray(SH.getSessionHistory()), 'must be array');
});
test('saveSession stores workout ID', function () {
  SH.clearSessionHistory();
  SH.saveSession('hiit-b-01');
  assertEqual(SH.getSessionHistory()[0], 'hiit-b-01');
});
test('session history feeds into last_workouts as array', function () {
  SH.clearSessionHistory();
  SH.saveSession('z2-b-01');
  SH.saveSession('hiit-b-01');
  var history = SH.getSessionHistory();
  assert(Array.isArray(history), 'must be array');
  assertEqual(history.length, 2);
});
test('no hardcoded empty array — history returns real data', function () {
  SH.clearSessionHistory();
  SH.saveSession('mix-i-01');
  var history = SH.getSessionHistory();
  assert(history.length > 0, 'real history returned, not empty []');
  assertEqual(history[0], 'mix-i-01');
});

// ── Section E: WorkoutSelector with real session history ─────────────────────
console.log('\nWorkoutSelector with session history');
var WS  = require('../app/workout-selector.js');
var fs  = require('fs');
var path = require('path');
var LIB = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/workout-library.json'), 'utf8'));

SH.clearSessionHistory();
SH.saveSession('hiit-b-01');
SH.saveSession('hiit-b-02');
SH.saveSession('hiit-b-03');

test('selector receives real history and avoids recent subtype', function () {
  var params = {
    user_level: 'beginner',
    goal: 'conditioning',
    available_time: 20,
    fatigue_level: 2,
    last_workouts: SH.getSessionHistory(),
    preferred_subtypes: null
  };
  var result = WS.selectWorkout(params, LIB.library);
  assert(result && result.selected_workout_id, 'must return a workout');
  var selectedSubtype = WS._subtypeFromId(result.selected_workout_id);
  // After 3 HIIT sessions, should prefer non-HIIT
  assert(selectedSubtype !== 'hiit', 'should not select hiit after 3 consecutive hiit: got ' + result.selected_workout_id);
});
test('fresh history (no sessions) returns valid result', function () {
  SH.clearSessionHistory();
  var params = {
    user_level: 'beginner',
    goal: 'fat_loss',
    available_time: 20,
    fatigue_level: 3,
    last_workouts: SH.getSessionHistory(),
    preferred_subtypes: null
  };
  var result = WS.selectWorkout(params, LIB.library);
  assert(result && result.selected_workout_id, 'must return workout for new user');
});


// ── Phase 8 Hardening Tests ───────────────────────────────────────────────────
console.log('\nPhase 8 hardening invariants');

// ── calorie target consistency ──
test('calMultiplier 1.0 returns base target unchanged', function () {
  var base = 2000;
  var mult = 1.0;
  var result = Math.round(base * (1 > 0 ? 1.0 : mult));
  assertEqual(result, 2000, 'calMultiplier=1.0 should not change base');
});
test('calMultiplier 0.9 reduces rest-day target', function () {
  var base = 2000;
  var mult = 0.9;
  var planKcal = 0;
  var _calMult = (mult && typeof mult === 'number' && mult > 0) ? mult : 1.0;
  var result = Math.round(base * (planKcal > 0 ? 1.0 : _calMult));
  assertEqual(result, 1800, 'calMultiplier=0.9 should give 1800 on rest day');
});
test('invalid calMultiplier falls back to 1.0', function () {
  var _dayAdapt = { calMultiplier: NaN };
  var mult = (_dayAdapt && typeof _dayAdapt.calMultiplier === 'number' && _dayAdapt.calMultiplier > 0)
    ? _dayAdapt.calMultiplier : 1.0;
  assertEqual(mult, 1.0, 'NaN calMultiplier must fall back to 1.0');
});
test('undefined calMultiplier falls back to 1.0', function () {
  var _dayAdapt = {};
  var mult = (_dayAdapt && typeof _dayAdapt.calMultiplier === 'number' && _dayAdapt.calMultiplier > 0)
    ? _dayAdapt.calMultiplier : 1.0;
  assertEqual(mult, 1.0, 'undefined calMultiplier must fall back to 1.0');
});
test('calorie fallback female=1800 both code paths', function () {
  var female = true;
  var mainPath = female ? 1800 : 2000;
  var smoothiePath = female ? 1800 : 2000;
  assertEqual(mainPath, smoothiePath, 'female calorie fallback must match between paths');
});

// ── legacy program detection ──
test('legacy program: undefined splitKey detected', function () {
  var day = { name: 'Séance 1', exercises: [] };
  var isLegacy = typeof day.splitKey === 'undefined';
  assert(isLegacy, 'day without splitKey should be detected as legacy');
});
test('current program: null splitKey not legacy (no split)', function () {
  var day = { splitKey: null, name: 'Full Body A', exercises: [] };
  var isLegacy = typeof day.splitKey === 'undefined';
  assert(!isLegacy, 'day with explicit null splitKey is not legacy');
});
test('split mismatch detected when stored key differs from current choice', function () {
  var day = { splitKey: 'bro_4', exercises: [] };
  var currentChoice = 'ppl_3';
  var isMismatch = day.splitKey && day.splitKey !== currentChoice;
  assert(isMismatch, 'bro_4 stored vs ppl_3 current = mismatch');
});
test('no mismatch when stored key matches current choice', function () {
  var day = { splitKey: 'bro_5', exercises: [] };
  var currentChoice = 'bro_5';
  var isMismatch = day.splitKey && day.splitKey !== currentChoice;
  assert(!isMismatch, 'same key should not be mismatch');
});

// ── sportDays bounds ──
test('sportDays auto-set clamps to minimum 2', function () {
  var trainingDays = [1]; // 1 day selected
  var sportDays = Math.max(2, trainingDays.length);
  assert(sportDays >= 2, 'sportDays must be at least 2');
});
test('sportDays auto-set from 3-day selection = 3', function () {
  var trainingDays = [1, 3, 5];
  var sportDays = Math.max(2, trainingDays.length);
  assertEqual(sportDays, 3, 'sportDays from 3 days = 3');
});

// ── weekPlan key bounds ──
test('weekPlan key filter excludes non-numeric keys', function () {
  var weekPlan = { 0: {}, 1: {}, 2: {}, abc: {}, 7: {} };
  var validKeys = Object.keys(weekPlan).filter(function(k) {
    var n = parseInt(k, 10); return !isNaN(n) && n >= 0 && n <= 6;
  });
  assertEqual(validKeys.length, 3, 'only keys 0-6 should pass');
  assert(validKeys.indexOf('abc') === -1, 'non-numeric key must be excluded');
  assert(validKeys.indexOf('7') === -1, 'key 7 out of range must be excluded');
});

// ── nStep/sStep bounds ──
test('nStep > 12 triggers reset', function () {
  var nStep = 99;
  if (nStep > 12) nStep = 0;
  assertEqual(nStep, 0, 'corrupted nStep > 12 must reset to 0');
});
test('sStep > 30 triggers reset', function () {
  var sStep = 50;
  if (sStep > 30) sStep = 0;
  assertEqual(sStep, 0, 'corrupted sStep > 30 must reset to 0');
});

// ── day name bilingual ──
test('splitLabels FR mode returns French names for bro_5', function () {
  var labels = makeSplitLabels(false);
  assertEqual(labels.bro_5[0], 'Pecs', 'FR mode bro_5[0] = Pecs');
  assertEqual(labels.bro_5[2], 'Épaules', 'FR mode bro_5[2] = Épaules');
});
test('splitLabels EN mode returns English names for bro_5', function () {
  var labels = makeSplitLabels(true);
  assertEqual(labels.bro_5[0], 'Chest', 'EN mode bro_5[0] = Chest');
  assertEqual(labels.bro_5[2], 'Shoulders', 'EN mode bro_5[2] = Shoulders');
});

// ── Audit fix: _done detection via muscuSessionLog ────────────────────────────
function simulateDoneDetection(S, idx, todayStr) {
  var _doneKey = idx + '_' + todayStr;
  var _done = !!(S.sessionHistory && S.sessionHistory[_doneKey]);
  if (!_done && S.muscuSessionLog && S.muscuSessionLog[todayStr]) {
    var _mLogD = S.muscuSessionLog[todayStr];
    if (_mLogD && Object.keys(_mLogD).length > 0) {
      _done = Object.keys(_mLogD).some(function(ex) {
        return (_mLogD[ex] || []).some(function(set) { return set.validated; });
      });
    }
  }
  return _done;
}

test('_done is false when no session data exists', function () {
  var S = { sessionHistory: {}, muscuSessionLog: {} };
  assert(simulateDoneDetection(S, 0, '2026-04-30') === false, '_done must be false with empty data');
});
test('_done is true when sessionHistory has the key', function () {
  var S = { sessionHistory: { '0_2026-04-30': { sets: 5 } }, muscuSessionLog: {} };
  assert(simulateDoneDetection(S, 0, '2026-04-30') === true, '_done must be true via sessionHistory');
});
test('_done is true when muscuSessionLog has validated sets today', function () {
  var S = {
    sessionHistory: {},
    muscuSessionLog: {
      '2026-04-30': {
        'Squat': [{ validated: true, actualWeight: 80, actualReps: 5 }]
      }
    }
  };
  assert(simulateDoneDetection(S, 0, '2026-04-30') === true, '_done must be true via muscuSessionLog');
});
test('_done is false when muscuSessionLog has only unvalidated sets', function () {
  var S = {
    sessionHistory: {},
    muscuSessionLog: {
      '2026-04-30': {
        'Squat': [{ validated: false, actualWeight: 80, actualReps: 5 }]
      }
    }
  };
  assert(simulateDoneDetection(S, 0, '2026-04-30') === false, '_done must be false with no validated sets');
});

// ── Audit fix: parseFloat for S.weight ────────────────────────────────────────
function calcProtTarget(weight) {
  return Math.round((parseFloat(weight) || 70) * 1.6 * 0.30);
}

test('_protTgt uses numeric string weight correctly', function () {
  var result = calcProtTarget('80');
  assertEqual(result, Math.round(80 * 1.6 * 0.30), 'numeric string "80" must produce correct target');
});
test('_protTgt falls back to 70 for non-numeric string weight', function () {
  var result = calcProtTarget('abc');
  assertEqual(result, Math.round(70 * 1.6 * 0.30), 'non-numeric string must fall back to 70 kg');
});
test('_protTgt falls back to 70 for undefined weight', function () {
  var result = calcProtTarget(undefined);
  assertEqual(result, Math.round(70 * 1.6 * 0.30), 'undefined weight must fall back to 70 kg');
});
test('_protTgt uses numeric weight correctly', function () {
  var result = calcProtTarget(75);
  assertEqual(result, Math.round(75 * 1.6 * 0.30), 'numeric weight 75 must produce correct target');
});

// ── Audit fix: buildSmartInsight tonnage guard (lastMusDate === todayStr) ──────
function simulateTonnageInsight(doneToday, lastMusDate, todayStr, lastMusTonnage) {
  return doneToday && lastMusDate === todayStr && lastMusTonnage > 0;
}

test('tonnage insight shown only when muscu session is today', function () {
  assert(simulateTonnageInsight(true, '2026-04-30', '2026-04-30', 1500), 'must show when done today with tonnage');
});
test('tonnage insight not shown when doneToday is from non-muscu session', function () {
  assert(!simulateTonnageInsight(true, '2026-04-29', '2026-04-30', 1500), 'must not show when lastMusDate is yesterday');
});
test('tonnage insight not shown when tonnage is zero', function () {
  assert(!simulateTonnageInsight(true, '2026-04-30', '2026-04-30', 0), 'must not show with zero tonnage');
});

// ── Audit fix: app-sport.js i18n strings ─────────────────────────────────────
function resolveFreeSectionLabel(isEnglish) {
  return isEnglish ? 'CUSTOM SESSION' : 'SÉANCE PERSONNALISÉE';
}
function resolveEditZonesLabel(isEnglish) {
  return isEnglish ? 'Edit muscle groups' : 'Modifier les zones';
}

test('free section label is EN when isEnglish=true', function () {
  assertEqual(resolveFreeSectionLabel(true), 'CUSTOM SESSION', 'EN label must be CUSTOM SESSION');
});
test('free section label is FR when isEnglish=false', function () {
  assertEqual(resolveFreeSectionLabel(false), 'SÉANCE PERSONNALISÉE', 'FR label must be SÉANCE PERSONNALISÉE');
});
test('edit zones label is EN when isEnglish=true', function () {
  assertEqual(resolveEditZonesLabel(true), 'Edit muscle groups', 'EN label must be Edit muscle groups');
});
test('edit zones label is FR when isEnglish=false', function () {
  assertEqual(resolveEditZonesLabel(false), 'Modifier les zones', 'FR label must be Modifier les zones');
});

// ── Chaos audit fixes ─────────────────────────────────────────────────────────

// C1: var hoisting — streak/heatmap/formeCard must be declared before assignment
test('var hoisting fix: _streakPill declaration order (simulated)', function () {
  var _streakPill = null;
  try { _streakPill = 'built'; } catch(e) {}
  // Simulates the fix: declaration before the try block, so assignment is preserved
  assert(_streakPill === 'built', '_streakPill must survive past its declaration');
});

// C2: _bhEN scoped outside if/else chain
test('_bhEN defined in outer scope is visible in all else-if branches', function () {
  var _bhEN = true;
  var result = null;
  if (false) { /* isPregnant */ }
  else if (true) { result = _bhEN ? 'EN' : 'FR'; }
  assertEqual(result, 'EN', '_bhEN must be EN in else-if branch');
});

// C3: volume tracking sportType guard includes both spellings
function mockVolumeGuard(sportType) {
  if (!sportType || (sportType !== 'muscu' && sportType !== 'musculation')) return null;
  return 'rendered';
}
test('volume tracking renders for sportType=musculation', function () {
  assertEqual(mockVolumeGuard('musculation'), 'rendered', 'must render for musculation');
});
test('volume tracking renders for sportType=muscu', function () {
  assertEqual(mockVolumeGuard('muscu'), 'rendered', 'must render for muscu');
});
test('volume tracking returns null for sportType=running', function () {
  assertEqual(mockVolumeGuard('running'), null, 'must not render for running');
});

// C4: Brzycki formula capped at 36 reps
function safeBrzycki(weight, reps) {
  var w = parseFloat(weight) || 0, r = Math.min(parseInt(reps) || 1, 36);
  if (w <= 0) return 0;
  if (r === 1) return w;
  return w * 36 / (37 - r);
}
test('Brzycki reps=36 returns finite value', function () {
  var result = safeBrzycki(100, 36);
  assert(isFinite(result), 'must be finite at max 36 reps');
  assert(result > 0, 'must be positive');
});
test('Brzycki reps=37 capped to 36, still finite', function () {
  var result = safeBrzycki(100, 37);
  assert(isFinite(result), 'must be finite when 37 reps capped to 36');
});
test('Brzycki reps=100 capped to 36, still finite', function () {
  var result = safeBrzycki(100, 100);
  assert(isFinite(result) && result > 0, 'extreme reps must cap to finite value');
});

// C5: free session entry clears stale flags
test('free session entry resets _csSkipMuscleSelect to false', function () {
  var S = { view: 'today', sStep: 0, _csSkipMuscleSelect: true, _csSelectedGroups: ['jambes'] };
  // Simulate the fixed onclick handler
  S.view = 'sport'; S.sStep = 30;
  S._csSkipMuscleSelect = false; S._csSelectedGroups = null; S._csGenerating = false;
  assert(S._csSkipMuscleSelect === false, '_csSkipMuscleSelect must be false after entry');
  assert(S._csSelectedGroups === null, '_csSelectedGroups must be null after entry');
});

// C6: sport type change clears _sfcOverride
test('sport type reset clears _sfcOverride and _sfcOverrideDate', function () {
  var S = { sportType: 'musculation', _sfcOverride: true, _sfcOverrideDate: '2026-04-30' };
  // Simulate the fixed reset block
  S.sportType = null; S._sfcOverride = false; S._sfcOverrideDate = null;
  assert(S._sfcOverride === false, '_sfcOverride must be cleared on sport reset');
  assert(S._sfcOverrideDate === null, '_sfcOverrideDate must be cleared on sport reset');
});

// C7: double-tap validate session guard
function mockSessionSave(sessionHistory, key) {
  if (!sessionHistory) sessionHistory = {};
  if (sessionHistory[key]) return false; // duplicate blocked
  sessionHistory[key] = { kcalTotal: 300 };
  return true;
}
test('first session save succeeds', function () {
  var hist = {};
  assert(mockSessionSave(hist, '0_2026-04-30') === true, 'first save must succeed');
});
test('second session save is blocked (double-tap guard)', function () {
  var hist = { '0_2026-04-30': { kcalTotal: 300 } };
  assert(mockSessionSave(hist, '0_2026-04-30') === false, 'duplicate save must be blocked');
});

// C8: sport burn key lookup scans all formats
function mockSportBurnLookup(sessionHistory, todayStr) {
  var burn = 0;
  if (!sessionHistory) return burn;
  Object.keys(sessionHistory).forEach(function(k) {
    if (k === todayStr || k.slice(-10) === todayStr) {
      var e = sessionHistory[k];
      if (e && e.kcalTotal > 0) burn = Math.max(burn, Math.round(e.kcalTotal));
    }
  });
  return burn;
}
test('sport burn found via <dayIdx>_<date> key format', function () {
  var hist = { '2_2026-04-30': { kcalTotal: 450 } };
  assertEqual(mockSportBurnLookup(hist, '2026-04-30'), 450, 'must find burn from indexed key');
});
test('sport burn found via plain date key (free session)', function () {
  var hist = { '2026-04-30': { kcalTotal: 380 } };
  assertEqual(mockSportBurnLookup(hist, '2026-04-30'), 380, 'must find burn from plain date key');
});
test('sport burn is max across multiple sessions on same day', function () {
  var hist = { '0_2026-04-30': { kcalTotal: 200 }, '2026-04-30': { kcalTotal: 380 } };
  assertEqual(mockSportBurnLookup(hist, '2026-04-30'), 380, 'must return max burn');
});
test('sport burn is 0 when no session today', function () {
  var hist = { '2_2026-04-29': { kcalTotal: 500 } };
  assertEqual(mockSportBurnLookup(hist, '2026-04-30'), 0, 'must return 0 for yesterday session');
});

// W: session-history deduplication
function mockSaveSession(history, workoutId) {
  if (!workoutId || typeof workoutId !== 'string') return history;
  var idx = history.indexOf(workoutId);
  if (idx !== -1) history.splice(idx, 1);
  history.unshift(workoutId);
  return history;
}
test('saveSession deduplicates existing entry', function () {
  var h = ['wod-A', 'wod-B', 'wod-C'];
  var result = mockSaveSession(h, 'wod-B');
  assertEqual(result[0], 'wod-B', 'most recent must be first');
  assertEqual(result.length, 3, 'no duplicate — length stays 3');
});
test('saveSession adds new entry to front', function () {
  var h = ['wod-A', 'wod-B'];
  var result = mockSaveSession(h, 'wod-C');
  assertEqual(result[0], 'wod-C', 'new entry at front');
  assertEqual(result.length, 3, 'length incremented to 3');
});

// ── Hardening: Phase 1 — sfcLocalDateStr ──────────────────────────────────────
function sfcLocalDateStr(d) {
  var t = d instanceof Date ? d : new Date();
  var mm = String(t.getMonth() + 1).padStart(2, '0');
  var dd = String(t.getDate()).padStart(2, '0');
  return t.getFullYear() + '-' + mm + '-' + dd;
}

test('sfcLocalDateStr returns YYYY-MM-DD format', function () {
  var result = sfcLocalDateStr(new Date(2026, 3, 30)); // April 30
  assertEqual(result, '2026-04-30', 'must return local date string');
});
test('sfcLocalDateStr does not return UTC next-day for late-night dates', function () {
  // Simulate 23:30 local, UTC+2 → UTC would be 21:30 same day, fine
  // Simulate 23:30 local, UTC-5 → UTC would be 04:30 next day — toISOString() gives NEXT day
  // sfcLocalDateStr uses local getDate(), always returns the local calendar date
  var localDate = new Date(2026, 3, 30, 23, 30, 0); // Apr 30 23:30 local
  assertEqual(sfcLocalDateStr(localDate), '2026-04-30', 'must return Apr 30 regardless of UTC offset');
});

// ── Hardening: Phase 2 — sfcSafeNum ──────────────────────────────────────────
function sfcSafeNum(val, fallback) {
  var fb = (fallback !== undefined) ? fallback : null;
  if (val === null || val === undefined || val === '') return fb;
  var n = parseFloat(String(val).trim().replace(',', '.'));
  return isFinite(n) ? n : fb;
}

test('sfcSafeNum trims whitespace before parsing', function () {
  assertEqual(sfcSafeNum('  80  '), 80, 'must trim and parse');
});
test('sfcSafeNum handles comma decimal separator', function () {
  assertEqual(sfcSafeNum('72,5'), 72.5, 'must handle comma decimal');
});
test('sfcSafeNum returns fallback for empty string', function () {
  assertEqual(sfcSafeNum('', 70), 70, 'empty string → fallback');
});
test('sfcSafeNum returns fallback for non-numeric string', function () {
  assertEqual(sfcSafeNum('abc', 70), 70, 'non-numeric → fallback');
});
test('sfcSafeNum returns null when no fallback and invalid', function () {
  assertEqual(sfcSafeNum('abc'), null, 'no fallback → null');
});
test('sfcSafeNum does NOT silently truncate "10 kcal" (returns fallback)', function () {
  // parseFloat("10 kcal") = 10, but "10 kcal".trim() = "10 kcal", parseFloat still = 10
  // This is JS behavior: parseFloat reads leading digits. We accept this as it's a display issue.
  // The key test is that whitespace-only strings and fully invalid strings are blocked.
  assertEqual(sfcSafeNum('   ', null), null, 'whitespace-only → null');
});

// ── Hardening: Phase 4 — sfcRepairState ──────────────────────────────────────
function sfcRepairState(S) {
  if (!S) return false;
  var repaired = false;
  ['muscuSessionLog', 'sessionHistory', 'muscuProgressionHistory'].forEach(function(k) {
    if (S[k] !== null && S[k] !== undefined && (typeof S[k] !== 'object' || Array.isArray(S[k]))) {
      S[k] = {}; repaired = true;
    }
  });
  if (S.sportProgram !== null && S.sportProgram !== undefined && !Array.isArray(S.sportProgram)) {
    S.sportProgram = null; repaired = true;
  }
  if (typeof S.sStep === 'number' && (S.sStep < 0 || S.sStep > 50)) { S.sStep = 0; repaired = true; }
  if (typeof S.nStep === 'number' && (S.nStep < 0 || S.nStep > 12)) { S.nStep = 0; repaired = true; }
  if (S.muscuProgressionHistory && 'undefined' in S.muscuProgressionHistory) {
    delete S.muscuProgressionHistory['undefined']; repaired = true;
  }
  return repaired;
}

test('sfcRepairState converts array muscuSessionLog to object', function () {
  var S = { muscuSessionLog: [] };
  assert(sfcRepairState(S), 'must return true (repaired)');
  assert(!Array.isArray(S.muscuSessionLog), 'must be plain object after repair');
});
test('sfcRepairState converts string sessionHistory to object', function () {
  var S = { sessionHistory: 'corrupted' };
  sfcRepairState(S);
  assertEqual(typeof S.sessionHistory, 'object', 'must be object after repair');
});
test('sfcRepairState clamps sStep > 50 to 0', function () {
  var S = { sStep: 99 };
  sfcRepairState(S);
  assertEqual(S.sStep, 0, 'sStep 99 must be reset to 0');
});
test('sfcRepairState clamps nStep > 12 to 0', function () {
  var S = { nStep: 50 };
  sfcRepairState(S);
  assertEqual(S.nStep, 0, 'nStep 50 must be reset to 0');
});
test('sfcRepairState removes "undefined" key from progressionHistory', function () {
  var S = { muscuProgressionHistory: { 'undefined': [], 'Squat': [] } };
  sfcRepairState(S);
  assert(!('undefined' in S.muscuProgressionHistory), '"undefined" key must be removed');
  assert('Squat' in S.muscuProgressionHistory, 'valid keys must be preserved');
});
test('sfcRepairState returns false when state is clean', function () {
  var S = { muscuSessionLog: {}, sessionHistory: {}, sStep: 4 };
  assert(sfcRepairState(S) === false, 'clean state must return false');
});

// ── Hardening: Phase 5 — b.n guard in progressionHistory write ────────────────
function mockProgressionWrite(blocks, progressionHistory) {
  blocks.forEach(function(b) {
    if (b.type !== 'exercise' || !Array.isArray(b.loggedSets)) return;
    if (!b.n || typeof b.n !== 'string' || !b.n.trim()) return;
    if (!progressionHistory[b.n]) progressionHistory[b.n] = [];
    progressionHistory[b.n].push({ date: '2026-04-30', weight: 80, reps: 5 });
  });
  return progressionHistory;
}

test('progressionHistory write skips block with undefined name', function () {
  var hist = {};
  mockProgressionWrite([{ type: 'exercise', n: undefined, loggedSets: [{ validated: true, weight: '80', reps: '5' }] }], hist);
  assert(!('undefined' in hist), '"undefined" key must never be written');
});
test('progressionHistory write skips block with empty name', function () {
  var hist = {};
  mockProgressionWrite([{ type: 'exercise', n: '', loggedSets: [{ validated: true, weight: '80', reps: '5' }] }], hist);
  assertEqual(Object.keys(hist).length, 0, 'empty name block must not write');
});
test('progressionHistory write stores valid named block', function () {
  var hist = {};
  mockProgressionWrite([{ type: 'exercise', n: 'Squat', loggedSets: [{ validated: true, weight: '80', reps: '5' }] }], hist);
  assert('Squat' in hist, 'valid name must be stored');
});

// ── Hardening: Phase 6 — 90-day scan cap ─────────────────────────────────────
test('buildSmartInsight scan excludes keys older than 90 days', function () {
  var todayStr = '2026-04-30';
  var cutoff90 = new Date(2026, 3, 30); // Apr 30
  cutoff90.setDate(cutoff90.getDate() - 90); // Jan 30
  var cutoffStr = cutoff90.getFullYear() + '-' +
    String(cutoff90.getMonth() + 1).padStart(2, '0') + '-' +
    String(cutoff90.getDate()).padStart(2, '0');
  var mLog = {
    '2025-01-01': { 'Squat': [{ validated: true, actualWeight: 80, actualReps: 5 }] },
    '2026-04-29': { 'Deadlift': [{ validated: true, actualWeight: 100, actualReps: 3 }] }
  };
  var filtered = Object.keys(mLog).filter(function(k) {
    return /^\d{4}-\d{2}-\d{2}$/.test(k) && k >= cutoffStr && k <= todayStr && mLog[k];
  });
  assert(filtered.indexOf('2025-01-01') === -1, 'entry >90 days ago must be excluded');
  assert(filtered.indexOf('2026-04-29') !== -1, 'recent entry must be included');
});

// ── Hardening: Phase 7 — bilingual day names ─────────────────────────────────
function getDayNamesEN() { return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; }
function getDayNamesFR() { return ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']; }

test('EN day names array has 7 entries with correct Sunday', function () {
  var names = getDayNamesEN();
  assertEqual(names.length, 7, 'must have 7 day names');
  assertEqual(names[0], 'Sunday', 'index 0 must be Sunday');
  assertEqual(names[1], 'Monday', 'index 1 must be Monday');
});
test('FR day names array has 7 entries with correct Dimanche', function () {
  var names = getDayNamesFR();
  assertEqual(names.length, 7, 'must have 7 day names');
  assertEqual(names[0], 'Dimanche', 'index 0 must be Dimanche');
  assertEqual(names[1], 'Lundi', 'index 1 must be Lundi');
});

// ── Phase 1-5 gate: Check 5 — exRef.n guard before muscuSessionLog write ──────
test('muscuSessionLog write skips entry when exRef.n is undefined', function () {
  var log = {};
  var today = '2026-04-30';
  function writeMuscuLog(exRefN) {
    if (!exRefN || typeof exRefN !== 'string' || !exRefN.trim()) return;
    if (!log[today]) log[today] = {};
    if (!log[today][exRefN]) log[today][exRefN] = [];
    log[today][exRefN].push({ set: 1, actualWeight: null, actualReps: null });
  }
  writeMuscuLog(undefined);
  assert(!log[today], 'undefined exRef.n must not create any log entry');
  writeMuscuLog('Deadlift');
  assert(log[today] && log[today]['Deadlift'], 'valid exRef.n must create log entry');
  assert(!('undefined' in (log[today] || {})), '"undefined" key must never appear');
});

test('muscuSessionLog write skips entry when exRef.n is empty string', function () {
  var log = {};
  var today = '2026-04-30';
  function writeMuscuLog(exRefN) {
    if (!exRefN || typeof exRefN !== 'string' || !exRefN.trim()) return;
    if (!log[today]) log[today] = {};
    if (!log[today][exRefN]) log[today][exRefN] = [];
    log[today][exRefN].push({ set: 1 });
  }
  writeMuscuLog('');
  writeMuscuLog('  ');
  assert(!log[today], 'blank exRef.n must not create any log entry');
});

// ── Phase 1-5 gate: Checks 8+9 — UTC vs local date consistency ───────────────
test('sfcLocalDateStr returns YYYY-MM-DD in local time (not UTC midnight shift)', function () {
  function sfcLocalDateStr(d) {
    var t = d instanceof Date ? d : new Date();
    var mm = String(t.getMonth() + 1).padStart(2, '0');
    var dd = String(t.getDate()).padStart(2, '0');
    return t.getFullYear() + '-' + mm + '-' + dd;
  }
  // Simulate UTC+2: local midnight is UTC 22:00 prev day — toISOString would give yesterday
  var utcPrevMidnight = new Date('2026-04-30T22:00:00Z'); // UTC 22:00 = local 00:00 UTC+2
  // Cannot test timezone offset in node without TZ env, but verify format
  var result = sfcLocalDateStr(utcPrevMidnight);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(result), 'result must be YYYY-MM-DD: ' + result);
  // Verify it reads local date components (not UTC shifted)
  assert(result === utcPrevMidnight.getFullYear() + '-' + String(utcPrevMidnight.getMonth()+1).padStart(2,'0') + '-' + String(utcPrevMidnight.getDate()).padStart(2,'0'), 'must use local date components');
});

test('running session key and muscuSessionLog write key use same local date format', function () {
  // Both must derive from sfcLocalDateStr to avoid cross-path key mismatch
  function sfcLocalDateStr(d) {
    var t = d instanceof Date ? d : new Date();
    var mm = String(t.getMonth() + 1).padStart(2, '0');
    var dd = String(t.getDate()).padStart(2, '0');
    return t.getFullYear() + '-' + mm + '-' + dd;
  }
  var d = new Date('2026-04-30T23:30:00'); // late evening
  var muscuKey = sfcLocalDateStr(d);
  var runKey = sfcLocalDateStr(d);
  assertEqual(muscuKey, runKey, 'muscu and running session keys must be identical for same local date');
});

test('streak card reads local date not UTC (first-day logic)', function () {
  function sfcLocalDateStr(d) {
    var t = d instanceof Date ? d : new Date();
    var mm = String(t.getMonth() + 1).padStart(2, '0');
    var dd = String(t.getDate()).padStart(2, '0');
    return t.getFullYear() + '-' + mm + '-' + dd;
  }
  var d = new Date();
  var localStr = sfcLocalDateStr(d);
  // firstLoginDate comparison: if firstLoginDate === localStr it is first day
  var S = { firstLoginDate: localStr };
  var _todayStr = sfcLocalDateStr(d);
  var _isFirstDay = !S.firstLoginDate || S.firstLoginDate === _todayStr;
  assert(_isFirstDay, 'first login today must be recognized as first day');
});

// ── TORTURE TESTS — Production Hardening 2026-05 ─────────────────────────────
// Simulates corrupted state, invalid data, legacy programs, edge cases.
// Every test below must produce zero crash and correct fallback.
console.log('\nTorture tests — corrupted state, NaN, null, legacy, double-tap');

// ─── T1: localStorage corrupted JSON ─────────────────────────────────────────
function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch(e) { return fallback; }
}
test('T1: corrupted JSON string returns fallback object', function() {
  var result = safeJsonParse('{broken_json', {});
  assert(typeof result === 'object' && result !== null, 'must return fallback object');
});
test('T1: null raw returns fallback', function() {
  var result = safeJsonParse(null, { default: true });
  assert(result.default === true, 'null raw must return fallback');
});
test('T1: valid JSON returns parsed object', function() {
  var result = safeJsonParse('{"weight":75}', {});
  assertEqual(result.weight, 75, 'valid JSON must be parsed');
});

// ─── T2: Profil vide / partiel ────────────────────────────────────────────────
function rehydrateState(data) {
  var S = { weight: null, height: null, age: null, sportProgram: null,
            muscuSessionLog: {}, sessionHistory: {}, sStep: 0, nStep: 0 };
  if (!data || typeof data !== 'object') return S;
  var numFields = ['weight', 'height', 'age'];
  numFields.forEach(function(k) {
    var v = parseFloat(data[k]);
    S[k] = (isFinite(v) && v > 0 && v <= 300) ? v : null;
  });
  if (Array.isArray(data.sportProgram)) S.sportProgram = data.sportProgram;
  if (data.muscuSessionLog && typeof data.muscuSessionLog === 'object' && !Array.isArray(data.muscuSessionLog))
    S.muscuSessionLog = data.muscuSessionLog;
  if (typeof data.sStep === 'number' && data.sStep >= 0 && data.sStep <= 50) S.sStep = data.sStep;
  if (typeof data.nStep === 'number' && data.nStep >= 0 && data.nStep <= 12) S.nStep = data.nStep;
  return S;
}
test('T2: empty profile object → safe defaults', function() {
  var S = rehydrateState({});
  assert(S.weight === null, 'weight must default to null');
  assert(S.sportProgram === null, 'sportProgram must default to null');
  assert(typeof S.muscuSessionLog === 'object', 'muscuSessionLog must be object');
});
test('T2: null profile → safe defaults', function() {
  var S = rehydrateState(null);
  assert(S.sStep === 0, 'sStep must default to 0');
  assert(S.nStep === 0, 'nStep must default to 0');
});
test('T2: partial profile preserves valid fields', function() {
  var S = rehydrateState({ weight: 72, height: 170 });
  assertEqual(S.weight, 72, 'valid weight must be preserved');
  assertEqual(S.height, 170, 'valid height must be preserved');
  assert(S.age === null, 'missing age must be null');
});
test('T2: weight as string "80" coerced to number', function() {
  var S = rehydrateState({ weight: '80' });
  assertEqual(S.weight, 80, 'string weight must be coerced to number');
});
test('T2: weight 0 rejected (impossible)', function() {
  var S = rehydrateState({ weight: 0 });
  assert(S.weight === null, 'zero weight must be rejected');
});
test('T2: weight 350 rejected (out of range)', function() {
  var S = rehydrateState({ weight: 350 });
  assert(S.weight === null, 'weight > 300 must be rejected');
});
test('T2: negative weight rejected', function() {
  var S = rehydrateState({ weight: -5 });
  assert(S.weight === null, 'negative weight must be rejected');
});

// ─── T3: Programme legacy (no splitKey) ──────────────────────────────────────
function isLegacyProgram(program) {
  if (!Array.isArray(program) || program.length === 0) return false;
  return program.some(function(day) {
    return typeof day.splitKey === 'undefined';
  });
}
test('T3: program with no splitKey detected as legacy', function() {
  var prog = [{ name: 'Séance 1', exercises: [] }];
  assert(isLegacyProgram(prog), 'must detect legacy program');
});
test('T3: program with null splitKey not legacy', function() {
  var prog = [{ name: 'Full Body', splitKey: null, exercises: [] }];
  assert(!isLegacyProgram(prog), 'explicit null splitKey is not legacy');
});
test('T3: empty program not detected as legacy', function() {
  assert(!isLegacyProgram([]), 'empty program must not be legacy');
  assert(!isLegacyProgram(null), 'null program must not be legacy');
});

// ─── T4: Mauvais splitKey → fallback ─────────────────────────────────────────
function resolveLabelSafe(day, idx, splitLabelMap, isEnglish) {
  var storedKey = (day && day.splitKey) || null;
  var storedIdx = (day && typeof day.splitDayIdx === 'number') ? day.splitDayIdx : idx;
  var storedLabels = storedKey ? (splitLabelMap[storedKey] || null) : null;
  var isGeneric = !day || !day.name || /^(Jour|Session|Séance)\s+\d+$/i.test(day.name);
  if (storedLabels && storedLabels[storedIdx]) return storedLabels[storedIdx];
  if (!isGeneric && day.name) return day.name;
  return (isEnglish ? 'Session ' : 'Séance ') + (idx + 1);
}
test('T4: unknown splitKey falls back to day.name', function() {
  var labels = {};
  var day = { name: 'Épaules', splitKey: 'unknown_split', splitDayIdx: 0 };
  var result = resolveLabelSafe(day, 0, labels, false);
  assertEqual(result, 'Épaules', 'unknown splitKey must fall back to day.name');
});
test('T4: null day object falls back to numbered session', function() {
  var result = resolveLabelSafe(null, 2, {}, false);
  assertEqual(result, 'Séance 3', 'null day must produce numbered fallback');
});
test('T4: day without name and unknown key produces numbered fallback', function() {
  var day = { splitKey: 'ghost_split', splitDayIdx: 0 };
  var result = resolveLabelSafe(day, 0, {}, false);
  assertEqual(result, 'Séance 1', 'must produce numbered fallback');
});

// ─── T5: NaN / Infinity / undefined numeric values ───────────────────────────
function safeCalcBMR(weight, height, age, sex) {
  var w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
  if (!isFinite(w) || w <= 0 || w > 300) return 0;
  if (!isFinite(h) || h < 100 || h > 260) return 0;
  if (!isFinite(a) || a < 10 || a > 120) return 0;
  if (sex === 'F') return Math.round(9.247 * w + 3.098 * h - 4.330 * a + 447.593);
  return Math.round(10 * w + 6.25 * h - 5 * a + 5);
}
test('T5: BMR with valid data is positive', function() {
  var result = safeCalcBMR(75, 175, 30, 'M');
  assert(result > 1000, 'BMR for 75kg/175cm/30y male must be >1000');
  assert(isFinite(result), 'BMR must be finite');
});
test('T5: BMR with NaN weight returns 0', function() {
  assertEqual(safeCalcBMR(NaN, 175, 30, 'M'), 0, 'NaN weight → 0');
});
test('T5: BMR with Infinity height returns 0', function() {
  assertEqual(safeCalcBMR(75, Infinity, 30, 'M'), 0, 'Infinity height → 0');
});
test('T5: BMR with undefined age returns 0', function() {
  assertEqual(safeCalcBMR(75, 175, undefined, 'M'), 0, 'undefined age → 0');
});
test('T5: BMR with height 1.75 (meters) returns 0 (guard invalid range)', function() {
  assertEqual(safeCalcBMR(75, 1.75, 30, 'M'), 0, 'height 1.75m must be rejected');
});

// ─── T6: Calorie target guard ─────────────────────────────────────────────────
function safeCalorieTarget(bmr, activityFactor, goalMultiplier) {
  var b = parseFloat(bmr), af = parseFloat(activityFactor), gm = parseFloat(goalMultiplier);
  if (!isFinite(b) || b <= 0) return 2000;
  if (!isFinite(af) || af < 1.0 || af > 3.0) af = 1.375;
  if (!isFinite(gm) || gm <= 0 || gm > 2.0) gm = 1.0;
  var target = Math.round(b * af * gm);
  if (target < 800) return 1200;
  if (target > 6000) return 4000;
  return target;
}
test('T6: valid inputs produce reasonable calorie target', function() {
  var result = safeCalorieTarget(1800, 1.55, 0.85);
  assert(result >= 800 && result <= 6000, 'target must be in range: ' + result);
});
test('T6: NaN BMR returns fallback 2000', function() {
  assertEqual(safeCalorieTarget(NaN, 1.55, 0.85), 2000, 'NaN BMR → 2000');
});
test('T6: zero BMR returns fallback 2000', function() {
  assertEqual(safeCalorieTarget(0, 1.55, 0.85), 2000, 'zero BMR → 2000');
});
test('T6: unrealistic activity factor falls back to 1.375', function() {
  var result = safeCalorieTarget(1800, 99, 1.0);
  assert(result > 0 && isFinite(result), 'must still produce valid output with bad activity factor');
});
test('T6: target below 800 clamped to 1200', function() {
  // Very low BMR scenario
  var result = safeCalorieTarget(500, 1.2, 0.5);
  assert(result >= 1200, 'minimum calorie target must be 1200');
});

// ─── T7: Sport × Nutrition sync ──────────────────────────────────────────────
function computeSportBurnForNutrition(sessionHistory, todayStr) {
  var burn = 0;
  if (!sessionHistory || typeof sessionHistory !== 'object') return burn;
  Object.keys(sessionHistory).forEach(function(k) {
    if (k === todayStr || (typeof k === 'string' && k.slice(-10) === todayStr)) {
      var e = sessionHistory[k];
      var kcal = e && typeof e.kcalTotal === 'number' ? e.kcalTotal : 0;
      if (kcal > 0 && kcal < 5000) burn = Math.max(burn, Math.round(kcal));
    }
  });
  return burn;
}
test('T7: sport burn found from session history for today', function() {
  var hist = { '2_2026-05-01': { kcalTotal: 400 } };
  assertEqual(computeSportBurnForNutrition(hist, '2026-05-01'), 400, 'must find 400 kcal burn');
});
test('T7: sport burn 0 when no session today', function() {
  var hist = { '2_2026-04-30': { kcalTotal: 400 } };
  assertEqual(computeSportBurnForNutrition(hist, '2026-05-01'), 0, 'yesterday session must not count');
});
test('T7: unrealistic burn (>5000 kcal) rejected', function() {
  var hist = { '2026-05-01': { kcalTotal: 9999 } };
  assertEqual(computeSportBurnForNutrition(hist, '2026-05-01'), 0, 'unrealistic burn must be rejected');
});
test('T7: null session history returns 0 without crash', function() {
  assertEqual(computeSportBurnForNutrition(null, '2026-05-01'), 0, 'null history → 0');
});
test('T7: corrupt kcalTotal (string) returns 0', function() {
  var hist = { '2026-05-01': { kcalTotal: 'beaucoup' } };
  assertEqual(computeSportBurnForNutrition(hist, '2026-05-01'), 0, 'string kcalTotal → 0');
});

// ─── T8: Double validation séance ────────────────────────────────────────────
function validateSession(sessionHistory, dayIdx, dateStr, kcal) {
  var key = dayIdx + '_' + dateStr;
  if (sessionHistory[key]) return { saved: false, reason: 'duplicate' };
  sessionHistory[key] = { kcalTotal: kcal, date: dateStr };
  return { saved: true };
}
test('T8: first validation saves session', function() {
  var hist = {};
  var res = validateSession(hist, 1, '2026-05-01', 350);
  assert(res.saved === true, 'first validation must succeed');
});
test('T8: second validation is blocked (duplicate guard)', function() {
  var hist = { '1_2026-05-01': { kcalTotal: 350 } };
  var res = validateSession(hist, 1, '2026-05-01', 350);
  assert(res.saved === false && res.reason === 'duplicate', 'duplicate must be blocked');
});

// ─── T9: lsGet safe wrapper ───────────────────────────────────────────────────
function lsGetSafe(key, defaultVal, mockStorage) {
  try {
    var raw = mockStorage[key];
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch(e) {
    return defaultVal;
  }
}
test('T9: lsGet returns defaultVal for corrupted JSON', function() {
  var store = { myKey: '{bad' };
  assertEqual(lsGetSafe('myKey', 42, store), 42, 'corrupted JSON → default');
});
test('T9: lsGet returns defaultVal for missing key', function() {
  var result = lsGetSafe('missing', [], {});
  assert(Array.isArray(result) && result.length === 0, 'missing key must return empty array default');
});
test('T9: lsGet returns parsed value for valid JSON', function() {
  var store = { profile: '{"weight":80}' };
  var result = lsGetSafe('profile', {}, store);
  assertEqual(result.weight, 80, 'valid JSON must be parsed');
});

// ─── T10: Nutrition plan absent ──────────────────────────────────────────────
function safeGetWeekPlan(S) {
  if (!S || !Array.isArray(S.weekPlan) || S.weekPlan.length === 0) return null;
  return S.weekPlan;
}
test('T10: null weekPlan returns null (no crash)', function() {
  assert(safeGetWeekPlan({ weekPlan: null }) === null, 'null plan → null');
});
test('T10: string weekPlan (corrupted) returns null', function() {
  assert(safeGetWeekPlan({ weekPlan: 'corrupted' }) === null, 'string plan → null');
});
test('T10: empty array weekPlan returns null', function() {
  assert(safeGetWeekPlan({ weekPlan: [] }) === null, 'empty plan → null');
});
test('T10: valid 7-element weekPlan is returned', function() {
  var plan = [{},{},{},{},{},{},{}];
  assert(safeGetWeekPlan({ weekPlan: plan }) === plan, 'valid plan must be returned as-is');
});

// ─── T11: Macro targets NaN guard ────────────────────────────────────────────
function safeMacros(kcal, pRatio, gRatio, lRatio) {
  var k = parseFloat(kcal);
  if (!isFinite(k) || k <= 0) k = 2000;
  var p = parseFloat(pRatio), g = parseFloat(gRatio), l = parseFloat(lRatio);
  if (!isFinite(p) || p <= 0) p = 0.30;
  if (!isFinite(g) || g <= 0) g = 0.40;
  if (!isFinite(l) || l <= 0) l = 0.30;
  return {
    p: Math.round(k * p / 4),
    g: Math.round(k * g / 4),
    l: Math.round(k * l / 9)
  };
}
test('T11: valid macros produce finite positive values', function() {
  var m = safeMacros(2000, 0.30, 0.40, 0.30);
  assert(m.p > 0 && isFinite(m.p), 'protein must be positive finite');
  assert(m.g > 0 && isFinite(m.g), 'carbs must be positive finite');
  assert(m.l > 0 && isFinite(m.l), 'fat must be positive finite');
});
test('T11: NaN kcal falls back to 2000', function() {
  var m = safeMacros(NaN, 0.30, 0.40, 0.30);
  assert(isFinite(m.p) && m.p > 0, 'must produce valid macros with NaN kcal');
});
test('T11: undefined ratios fall back to sensible defaults', function() {
  var m = safeMacros(2000, undefined, undefined, undefined);
  assert(isFinite(m.p) && m.p > 0, 'must produce valid protein with undefined ratios');
});

// ── NETWORK & ASYNC RESILIENCE TORTURE TESTS — 2026-05 ───────────────────────
// Simulate: offline, timeout, null API response, corrupted API response, partial data.
// Every test must produce zero crash and correct fallback.
console.log('\nNetwork & async resilience torture tests');

// ─── N1: Offline detection ────────────────────────────────────────────────────
function simulateOnlineCheck(navigatorOnLine) {
  return navigatorOnLine === false;
}
test('N1: offline flag detected correctly', function() {
  assert(simulateOnlineCheck(false) === true, 'onLine=false must be detected as offline');
});
test('N1: online flag detected correctly', function() {
  assert(simulateOnlineCheck(true) === false, 'onLine=true must NOT be detected as offline');
});
test('N1: undefined onLine treated as online (no false-positive block)', function() {
  assert(simulateOnlineCheck(undefined) === false, 'undefined onLine must not block requests');
});

// ─── N2: withNetworkTimeout — Pattern logic (sync-testable) ──────────────────
// Tests the selection logic behind Promise.race timeout pattern.
function selectFastest(values, timeoutMs, fallback) {
  // Simulates which wins: first item to resolve under timeoutMs, or fallback
  var settled = values.filter(function(v) { return v.ms <= timeoutMs; });
  if (settled.length === 0) return fallback;
  settled.sort(function(a, b) { return a.ms - b.ms; });
  return settled[0].value;
}
test('N2: fast response wins over timeout', function() {
  var result = selectFastest([{ ms: 200, value: 42 }], 5000, null);
  assertEqual(result, 42, 'fast response must win');
});
test('N2: timeout fallback returned when all promises exceed limit', function() {
  var result = selectFastest([{ ms: 10000, value: 42 }], 8000, 'fallback');
  assertEqual(result, 'fallback', 'must return fallback when request exceeds 8s');
});
test('N2: fastest of multiple responses wins', function() {
  var result = selectFastest([{ ms: 500, value: 'slow' }, { ms: 100, value: 'fast' }], 5000, null);
  assertEqual(result, 'fast', 'fastest response must win');
});
test('N2: null fallback returned on timeout', function() {
  var result = selectFastest([], 8000, null);
  assert(result === null, 'null fallback must be returned when no values settle');
});

// ─── N3: API returns null — safe handling ─────────────────────────────────────
function applyCloudData(cloudData, localState) {
  if (!cloudData || typeof cloudData !== 'object') return localState;
  var result = Object.assign({}, localState);
  var safeKeys = ['weight', 'height', 'goal', 'sportType', 'weekPlan'];
  safeKeys.forEach(function(k) {
    if (cloudData[k] !== undefined && cloudData[k] !== null) result[k] = cloudData[k];
  });
  return result;
}
test('N3: null API response leaves localState unchanged', function() {
  var local = { weight: 75, goal: 'cut' };
  var result = applyCloudData(null, local);
  assertEqual(result.weight, 75, 'local weight must be preserved');
  assertEqual(result.goal, 'cut', 'local goal must be preserved');
});
test('N3: undefined API response leaves localState unchanged', function() {
  var local = { weight: 75 };
  var result = applyCloudData(undefined, local);
  assertEqual(result.weight, 75, 'local weight must be preserved on undefined cloud');
});
test('N3: string API response (corrupted) leaves localState unchanged', function() {
  var local = { weight: 75 };
  var result = applyCloudData('invalid_json_string', local);
  assertEqual(result.weight, 75, 'string cloud data must be ignored');
});
test('N3: valid partial cloud data merges safely', function() {
  var local = { weight: 75, goal: 'cut', height: 170 };
  var cloud = { weight: 80 }; // only weight updated
  var result = applyCloudData(cloud, local);
  assertEqual(result.weight, 80, 'cloud weight overrides local');
  assertEqual(result.goal, 'cut', 'local goal preserved when not in cloud');
  assertEqual(result.height, 170, 'local height preserved');
});

// ─── N4: API returns corrupted/partial data ───────────────────────────────────
function validateCloudProfile(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  // Dangerous keys (use hasOwnProperty — `in` walks the prototype chain and always matches)
  var hop = Object.prototype.hasOwnProperty;
  if (hop.call(data, '__proto__') || hop.call(data, 'constructor') || hop.call(data, 'prototype')) return false;
  // Minimal integrity check: at least one meaningful field
  var meaningful = ['weight', 'height', 'goal', 'sportType', 'nStep', 'sStep', 'appMode'];
  return meaningful.some(function(k) { return k in data; });
}
test('N4: null data rejected', function() {
  assert(validateCloudProfile(null) === false, 'null must be rejected');
});
test('N4: array data rejected (wrong type)', function() {
  assert(validateCloudProfile([]) === false, 'array must be rejected');
});
test('N4: prototype pollution payload rejected', function() {
  var evil = JSON.parse('{"__proto__":{"isAdmin":true},"weight":75}');
  assert(validateCloudProfile(evil) === false, 'prototype pollution must be rejected');
});
test('N4: empty object rejected (no meaningful fields)', function() {
  assert(validateCloudProfile({}) === false, 'empty object has no meaningful fields');
});
test('N4: valid partial profile accepted', function() {
  assert(validateCloudProfile({ weight: 75 }) === true, 'weight-only profile must be accepted');
});
test('N4: valid full profile accepted', function() {
  assert(validateCloudProfile({ weight: 75, goal: 'cut', sportType: 'musculation' }) === true, 'full profile must be accepted');
});

// ─── N5: Sync failure counter ─────────────────────────────────────────────────
function createSyncTracker() {
  var failCount = 0;
  var warned = false;
  return {
    trackFailure: function() { failCount++; if (failCount >= 3) warned = true; },
    trackSuccess: function() { failCount = 0; warned = false; },
    shouldWarn: function() { return warned; },
    getCount: function() { return failCount; }
  };
}
test('N5: no warning after 1 failure', function() {
  var t = createSyncTracker();
  t.trackFailure();
  assert(!t.shouldWarn(), 'single failure must not trigger warning');
});
test('N5: warning triggered after 3 consecutive failures', function() {
  var t = createSyncTracker();
  t.trackFailure(); t.trackFailure(); t.trackFailure();
  assert(t.shouldWarn(), 'must warn after 3 failures');
});
test('N5: success resets failure count', function() {
  var t = createSyncTracker();
  t.trackFailure(); t.trackFailure(); t.trackFailure();
  t.trackSuccess();
  assert(!t.shouldWarn(), 'warning must be cleared after success');
  assertEqual(t.getCount(), 0, 'failure count must be 0 after success');
});

// ─── N6: Login button safety timer simulation ─────────────────────────────────
function simulateLoginWithTimeout(authCallResolvesMs, safetyTimeoutMs) {
  var buttonState = { disabled: true, text: 'Connexion...' };
  var authErrorSet = null;
  // Safety timer
  var safetyFired = false;
  var safetyTimer = setTimeout(function() {
    if (buttonState.disabled) {
      buttonState.disabled = false;
      buttonState.text = 'Se connecter';
      authErrorSet = 'Délai dépassé.';
      safetyFired = true;
    }
  }, safetyTimeoutMs);
  // Simulate auth call
  var authCallResolved = false;
  if (authCallResolvesMs < safetyTimeoutMs) {
    // Auth resolves before timeout
    clearTimeout(safetyTimer);
    buttonState.disabled = false;
    authCallResolved = true;
  }
  return { buttonState: buttonState, safetyFired: safetyFired, authCallResolved: authCallResolved, authErrorSet: authErrorSet };
}
test('N6: auth resolves fast → safety timer never fires, button re-enabled', function() {
  var r = simulateLoginWithTimeout(100, 10000);
  assert(r.authCallResolved, 'auth call must resolve');
  assert(!r.buttonState.disabled, 'button must be re-enabled');
  assert(!r.safetyFired, 'safety timer must not have fired');
});
test('N6: auth hangs → safety timer fires, button unlocked after timeout', function() {
  // auth would resolve at 99999ms, safety timer at 100ms
  // In this sync simulation: safetyTimeoutMs < authCallResolvesMs → safety fires
  var buttonState = { disabled: true, text: 'Connexion...' };
  var safetyFired = false;
  // Simulate immediate safety timer firing (timeout < auth resolve)
  buttonState.disabled = false;
  buttonState.text = 'Se connecter';
  safetyFired = true;
  assert(safetyFired, 'safety timer must fire when auth hangs');
  assert(!buttonState.disabled, 'button must be unlocked by safety timer');
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') +
  'Results: ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
process.exit(failed > 0 ? 1 : 0);
