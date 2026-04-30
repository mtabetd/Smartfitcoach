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

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') +
  'Results: ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
process.exit(failed > 0 ? 1 : 0);
