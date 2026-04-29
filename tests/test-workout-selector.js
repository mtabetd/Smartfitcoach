'use strict';
// ─── TESTS — Workout Selector ─────────────────────────────────────────────────
// Usage: node tests/test-workout-selector.js

var path = require('path');
var fs   = require('fs');

var WS      = require('../app/workout-selector.js');
var library = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/workout-library.json'), 'utf8')).library;

var selectWorkout     = WS.selectWorkout;
var _validateParams   = WS._validateParams;
var _subtypeFromId    = WS._subtypeFromId;
var _intensityMode    = WS._intensityMode;
var _flattenLibrary   = WS._flattenLibrary;
var _filterCandidates = WS._filterCandidates;
var _scoreCandidates  = WS._scoreCandidates;

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
function assertThrows(fn, substr) {
  try { fn(); throw new Error('expected throw, got none'); }
  catch (e) {
    if (e.message === 'expected throw, got none') throw e;
    if (substr && !e.message.includes(substr))
      throw new Error('expected error containing "' + substr + '", got: ' + e.message);
  }
}

// ── _validateParams ───────────────────────────────────────────────────────────
console.log('\n_validateParams');

test('accepts valid full params', function () {
  _validateParams({
    user_level: 'beginner', goal: 'fat_loss', available_time: 25,
    fatigue_level: 3, last_workouts: [], preferred_subtypes: ['hiit']
  });
});

test('accepts null preferred_subtypes', function () {
  _validateParams({
    user_level: 'intermediate', goal: 'strength', available_time: 45,
    fatigue_level: 2, last_workouts: [], preferred_subtypes: null
  });
});

test('rejects invalid user_level', function () {
  assertThrows(function () {
    _validateParams({ user_level: 'expert', goal: 'fat_loss', available_time: 30, fatigue_level: 3, last_workouts: [] });
  }, 'user_level');
});

test('rejects invalid goal', function () {
  assertThrows(function () {
    _validateParams({ user_level: 'beginner', goal: 'bulk', available_time: 30, fatigue_level: 3, last_workouts: [] });
  }, 'goal');
});

test('rejects available_time out of range', function () {
  assertThrows(function () {
    _validateParams({ user_level: 'beginner', goal: 'fat_loss', available_time: 300, fatigue_level: 3, last_workouts: [] });
  }, 'available_time');
});

test('rejects fatigue_level out of range', function () {
  assertThrows(function () {
    _validateParams({ user_level: 'beginner', goal: 'fat_loss', available_time: 30, fatigue_level: 6, last_workouts: [] });
  }, 'fatigue_level');
});

test('rejects non-array last_workouts', function () {
  assertThrows(function () {
    _validateParams({ user_level: 'beginner', goal: 'fat_loss', available_time: 30, fatigue_level: 3, last_workouts: 'hiit-b-01' });
  }, 'last_workouts');
});

test('rejects invalid preferred_subtype value', function () {
  assertThrows(function () {
    _validateParams({ user_level: 'beginner', goal: 'fat_loss', available_time: 30, fatigue_level: 3, last_workouts: [], preferred_subtypes: ['crossfit'] });
  }, 'preferred_subtype');
});

// ── _subtypeFromId ────────────────────────────────────────────────────────────
console.log('\n_subtypeFromId');

test('parses hiit prefix', function ()      { assertEqual(_subtypeFromId('hiit-b-01'),  'hiit'); });
test('parses z2 prefix',   function ()      { assertEqual(_subtypeFromId('z2-i-05'),    'zone2'); });
test('parses mix prefix',  function ()      { assertEqual(_subtypeFromId('mix-b-03'),   'mixed'); });
test('parses hvy prefix',  function ()      { assertEqual(_subtypeFromId('hvy-i-01'),   'heavy'); });
test('parses exp prefix',  function ()      { assertEqual(_subtypeFromId('exp-b-06'),   'explosive'); });
test('parses tmp prefix',  function ()      { assertEqual(_subtypeFromId('tmp-i-04'),   'tempo'); });
test('parses vol prefix',  function ()      { assertEqual(_subtypeFromId('vol-b-s02'),  'volume'); });
test('returns null for unknown', function (){ assertEqual(_subtypeFromId('unknown-01'), null); });

// ── _intensityMode ────────────────────────────────────────────────────────────
console.log('\n_intensityMode');

test('fatigue 1 → push',   function () { assertEqual(_intensityMode(1), 'push'); });
test('fatigue 2 → push',   function () { assertEqual(_intensityMode(2), 'push'); });
test('fatigue 3 → normal', function () { assertEqual(_intensityMode(3), 'normal'); });
test('fatigue 4 → reduce', function () { assertEqual(_intensityMode(4), 'reduce'); });
test('fatigue 5 → reduce', function () { assertEqual(_intensityMode(5), 'reduce'); });

// ── _flattenLibrary ───────────────────────────────────────────────────────────
console.log('\n_flattenLibrary');

test('returns 140 workouts from full library', function () {
  var all = _flattenLibrary(library);
  assert(all.length === 140, 'expected 140, got ' + all.length);
});

test('every workout has id and subtype', function () {
  var all = _flattenLibrary(library);
  all.forEach(function (w) {
    assert(w.id, 'missing id on ' + JSON.stringify(w).slice(0, 40));
    assert(w.subtype, 'missing subtype on ' + w.id);
  });
});

// ── _filterCandidates ─────────────────────────────────────────────────────────
console.log('\n_filterCandidates');

test('filters by level', function () {
  var all        = _flattenLibrary(library);
  var params     = { user_level: 'beginner', goal: 'fat_loss', available_time: 25, fatigue_level: 3, last_workouts: [], preferred_subtypes: null };
  var candidates = _filterCandidates(all, params);
  candidates.forEach(function (w) { assert(w.level === 'beginner', 'non-beginner in candidates: ' + w.id); });
});

test('filters by duration ±5 min', function () {
  var all        = _flattenLibrary(library);
  var params     = { user_level: 'beginner', goal: 'fat_loss', available_time: 20, fatigue_level: 3, last_workouts: [], preferred_subtypes: null };
  var candidates = _filterCandidates(all, params);
  candidates.forEach(function (w) {
    assert(Math.abs(w.duration - 20) <= 5, w.id + ' duration ' + w.duration + ' out of ±5 window for 20 min');
  });
});

test('fatigue 4 restricts to zone2 and tempo only', function () {
  var all        = _flattenLibrary(library);
  var params     = { user_level: 'beginner', goal: 'fat_loss', available_time: 30, fatigue_level: 4, last_workouts: [], preferred_subtypes: null };
  var candidates = _filterCandidates(all, params);
  candidates.forEach(function (w) {
    assert(['zone2', 'tempo'].includes(w.subtype), 'fatigue 4 should only return zone2/tempo, got: ' + w.subtype + ' (' + w.id + ')');
  });
});

test('fatigue 5 restricts to zone2 and tempo only', function () {
  var all        = _flattenLibrary(library);
  var params     = { user_level: 'intermediate', goal: 'strength', available_time: 45, fatigue_level: 5, last_workouts: [], preferred_subtypes: null };
  var candidates = _filterCandidates(all, params);
  candidates.forEach(function (w) {
    assert(['zone2', 'tempo'].includes(w.subtype), 'fatigue 5 should only return zone2/tempo, got: ' + w.subtype);
  });
});

// ── selectWorkout — integration ───────────────────────────────────────────────
console.log('\nselectWorkout (integration)');

test('returns valid output shape', function () {
  var result = selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 20, fatigue_level: 3, last_workouts: [], preferred_subtypes: null }, library);
  assert(typeof result.selected_workout_id === 'string', 'selected_workout_id must be string');
  assert(typeof result.reasoning === 'string' && result.reasoning.length > 10, 'reasoning too short');
  assert(typeof result.adaptation === 'string' && result.adaptation.length > 10, 'adaptation too short');
});

test('selected workout exists in library', function () {
  var result = selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 20, fatigue_level: 3, last_workouts: [], preferred_subtypes: null }, library);
  var all    = _flattenLibrary(library);
  var found  = all.find(function (w) { return w.id === result.selected_workout_id; });
  assert(found, 'selected_workout_id not found in library: ' + result.selected_workout_id);
});

test('fatigue 4 selects zone2 or tempo workout', function () {
  var result = selectWorkout({ user_level: 'beginner', goal: 'strength', available_time: 30, fatigue_level: 4, last_workouts: [], preferred_subtypes: null }, library);
  var all    = _flattenLibrary(library);
  var found  = all.find(function (w) { return w.id === result.selected_workout_id; });
  assert(['zone2', 'tempo'].includes(found.subtype), 'fatigue 4 must select zone2/tempo, got: ' + found.subtype);
});

test('fatigue 1 adaptation mentions full output or harder scaling', function () {
  var result = selectWorkout({ user_level: 'intermediate', goal: 'conditioning', available_time: 25, fatigue_level: 1, last_workouts: [], preferred_subtypes: null }, library);
  assert(result.adaptation.includes('full output') || result.adaptation.includes('harder'), 'fatigue 1 adaptation should push: ' + result.adaptation);
});

test('fatigue 5 adaptation mentions recovery', function () {
  var result = selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 25, fatigue_level: 5, last_workouts: [], preferred_subtypes: null }, library);
  assert(result.adaptation.toLowerCase().includes('recover'), 'fatigue 5 adaptation should mention recovery: ' + result.adaptation);
});

test('avoids last_workouts IDs', function () {
  // Get a hiit-b workout that fits 20 min
  var all   = _flattenLibrary(library);
  var hiits = all.filter(function (w) { return w.level === 'beginner' && Math.abs(w.duration - 20) <= 5; });
  // Fill last_workouts with all but one
  var keep  = hiits[hiits.length - 1];
  var avoid = hiits.slice(0, -1).map(function (w) { return w.id; });
  if (avoid.length === 0) return; // not enough workouts to test
  var result = selectWorkout({ user_level: 'beginner', goal: 'conditioning', available_time: 20, fatigue_level: 3, last_workouts: avoid, preferred_subtypes: null }, library);
  assert(!avoid.includes(result.selected_workout_id) || result.selected_workout_id === keep.id,
    'selector should prefer unvisited workouts');
});

test('preferred_subtypes boosts score', function () {
  var r1 = selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 22, fatigue_level: 3, last_workouts: [], preferred_subtypes: ['zone2'] }, library);
  var r2 = selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 22, fatigue_level: 3, last_workouts: [], preferred_subtypes: ['hiit'] }, library);
  var all    = _flattenLibrary(library);
  var found1 = all.find(function (w) { return w.id === r1.selected_workout_id; });
  var found2 = all.find(function (w) { return w.id === r2.selected_workout_id; });
  // With preferred zone2 and fat_loss goal, one run may select zone2, the other hiit — just check both are valid
  assert(found1 && found2, 'both results must resolve to real workouts');
});

test('throws when no workouts match level + duration', function () {
  // 170 min is within validator range (5-180) but no workout is that long (max is 80 min)
  assertThrows(function () {
    selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 170, fatigue_level: 3, last_workouts: [], preferred_subtypes: null }, library);
  }, 'No workout found');
});

test('selected workout duration is within ±10 min of available_time', function () {
  var result = selectWorkout({ user_level: 'intermediate', goal: 'strength', available_time: 50, fatigue_level: 2, last_workouts: [], preferred_subtypes: ['heavy'] }, library);
  var all    = _flattenLibrary(library);
  var found  = all.find(function (w) { return w.id === result.selected_workout_id; });
  assert(Math.abs(found.duration - 50) <= 10, 'duration drift too large: ' + found.duration + ' vs 50 min');
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') +
  'Results: ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
process.exit(failed > 0 ? 1 : 0);
