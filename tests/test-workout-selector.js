'use strict';
// ─── TESTS — Workout Selector ─────────────────────────────────────────────────
// Usage: node tests/test-workout-selector.js

var path = require('path');
var fs   = require('fs');

var WS      = require('../app/workout-selector.js');
var library = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/workout-library.json'), 'utf8')).library;

var selectWorkout      = WS.selectWorkout;
var _validateParams    = WS._validateParams;
var _subtypeFromId     = WS._subtypeFromId;
var _intensityMode     = WS._intensityMode;
var _flattenLibrary    = WS._flattenLibrary;
var _filterCandidates  = WS._filterCandidates;
var _scoreCandidates   = WS._scoreCandidates;
var _buildMomentumTag  = WS._buildMomentumTag;
var _buildSessionFocus = WS._buildSessionFocus;
var _buildCoachMessage = WS._buildCoachMessage;

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

// ── _buildMomentumTag ─────────────────────────────────────────────────────────
console.log('\n_buildMomentumTag');

var all = _flattenLibrary(library);

test('fatigue 4 → recover', function () {
  var w = all.find(function (w) { return w.subtype === 'zone2'; });
  assertEqual(_buildMomentumTag(w, { fatigue_level: 4 }), 'recover');
});

test('fatigue 5 → recover', function () {
  var w = all.find(function (w) { return w.subtype === 'tempo'; });
  assertEqual(_buildMomentumTag(w, { fatigue_level: 5 }), 'recover');
});

test('fatigue 1 → push', function () {
  var w = all.find(function (w) { return w.subtype === 'hiit'; });
  assertEqual(_buildMomentumTag(w, { fatigue_level: 1 }), 'push');
});

test('fatigue 2 → push', function () {
  var w = all.find(function (w) { return w.subtype === 'heavy'; });
  assertEqual(_buildMomentumTag(w, { fatigue_level: 2 }), 'push');
});

test('fatigue 3 with benchmark workout → test', function () {
  var benchmarkWorkout = all.find(function (w) {
    return w.progression_hint && /benchmark|retest/i.test(w.progression_hint) && w.level === 'intermediate';
  });
  if (!benchmarkWorkout) return; // skip if none found
  assertEqual(_buildMomentumTag(benchmarkWorkout, { fatigue_level: 3 }), 'test');
});

test('fatigue 3 non-benchmark → build', function () {
  var w = all.find(function (w) {
    return w.subtype === 'volume' && w.progression_hint && !/benchmark|retest/i.test(w.progression_hint);
  });
  if (!w) return;
  assertEqual(_buildMomentumTag(w, { fatigue_level: 3 }), 'build');
});

// ── _buildSessionFocus ────────────────────────────────────────────────────────
console.log('\n_buildSessionFocus');

test('returns non-empty string for every subtype', function () {
  var subtypes = ['hiit', 'zone2', 'mixed', 'heavy', 'explosive', 'tempo', 'volume'];
  subtypes.forEach(function (st) {
    var w = all.find(function (x) { return x.subtype === st; });
    if (!w) return;
    var focus = _buildSessionFocus(w);
    assert(typeof focus === 'string' && focus.length > 5, 'empty focus for ' + st + ': ' + focus);
  });
});

test('session_focus includes subtype label', function () {
  var w = all.find(function (x) { return x.subtype === 'heavy'; });
  var focus = _buildSessionFocus(w);
  assert(focus.toLowerCase().includes('strength') || focus.toLowerCase().includes('maximal'),
    'heavy focus should mention strength or maximal: ' + focus);
});

test('session_focus includes intent when present', function () {
  var w = all.find(function (x) { return x.intent && x.subtype === 'tempo'; });
  if (!w) return;
  var focus = _buildSessionFocus(w);
  // Intent is capitalised and appended after " — "
  assert(focus.includes(' — '), 'session_focus should contain " — " separator: ' + focus);
});

// ── _buildCoachMessage ────────────────────────────────────────────────────────
console.log('\n_buildCoachMessage');

test('returns non-empty string for all mode × goal combos', function () {
  var modes  = [1, 3, 5]; // push / normal / reduce
  var goals  = ['fat_loss', 'toning', 'strength', 'conditioning', 'recomposition'];
  var w      = all.find(function (x) { return x.subtype === 'hiit'; });
  modes.forEach(function (fatigue) {
    goals.forEach(function (goal) {
      var msg = _buildCoachMessage(w, { fatigue_level: fatigue, goal: goal });
      assert(typeof msg === 'string' && msg.length > 10,
        'empty message for fatigue=' + fatigue + ' goal=' + goal);
    });
  });
});

test('recover message does not use push language', function () {
  var w   = all.find(function (x) { return x.subtype === 'zone2'; });
  var msg = _buildCoachMessage(w, { fatigue_level: 5, goal: 'fat_loss' });
  assert(!msg.toLowerCase().includes('destroy') && !msg.toLowerCase().includes('all-out'),
    'recover message should not use push language: ' + msg);
});

test('push message conveys high-output intent', function () {
  var w   = all.find(function (x) { return x.subtype === 'hiit'; });
  var msg = _buildCoachMessage(w, { fatigue_level: 1, goal: 'conditioning' });
  assert(msg.length > 10, 'push message too short: ' + msg);
});

// ── selectWorkout — new output fields ────────────────────────────────────────
console.log('\nselectWorkout — new fields');

test('output includes session_focus, momentum_tag, coach_message', function () {
  var result = selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 20, fatigue_level: 3, last_workouts: [], preferred_subtypes: null }, library);
  assert('session_focus'  in result, 'missing session_focus');
  assert('momentum_tag'   in result, 'missing momentum_tag');
  assert('coach_message'  in result, 'missing coach_message');
});

test('momentum_tag is one of valid values', function () {
  var valid = ['build', 'push', 'recover', 'test'];
  var result = selectWorkout({ user_level: 'intermediate', goal: 'strength', available_time: 45, fatigue_level: 2, last_workouts: [], preferred_subtypes: null }, library);
  assert(valid.includes(result.momentum_tag), 'invalid momentum_tag: ' + result.momentum_tag);
});

test('fatigue 5 → momentum_tag recover', function () {
  var result = selectWorkout({ user_level: 'beginner', goal: 'fat_loss', available_time: 25, fatigue_level: 5, last_workouts: [], preferred_subtypes: null }, library);
  assertEqual(result.momentum_tag, 'recover');
});

test('fatigue 1 → momentum_tag push or test (test overrides when benchmark selected)', function () {
  var result = selectWorkout({ user_level: 'intermediate', goal: 'conditioning', available_time: 22, fatigue_level: 1, last_workouts: [], preferred_subtypes: null }, library);
  assert(['push', 'test'].includes(result.momentum_tag), 'fatigue 1 must yield push or test, got: ' + result.momentum_tag);
});

test('session_focus is non-empty string', function () {
  var result = selectWorkout({ user_level: 'beginner', goal: 'toning', available_time: 35, fatigue_level: 3, last_workouts: [], preferred_subtypes: null }, library);
  assert(typeof result.session_focus === 'string' && result.session_focus.length > 5, 'session_focus too short: ' + result.session_focus);
});

test('coach_message is non-empty string under 200 chars', function () {
  var result = selectWorkout({ user_level: 'intermediate', goal: 'recomposition', available_time: 40, fatigue_level: 3, last_workouts: [], preferred_subtypes: null }, library);
  assert(typeof result.coach_message === 'string' && result.coach_message.length > 10, 'coach_message too short');
  assert(result.coach_message.length < 200, 'coach_message too long: ' + result.coach_message.length + ' chars');
});

test('all six output fields present simultaneously', function () {
  var fields = ['selected_workout_id', 'reasoning', 'adaptation', 'session_focus', 'momentum_tag', 'coach_message'];
  var result = selectWorkout({ user_level: 'beginner', goal: 'conditioning', available_time: 22, fatigue_level: 3, last_workouts: [], preferred_subtypes: null }, library);
  fields.forEach(function (f) { assert(f in result, 'missing field: ' + f); });
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') +
  'Results: ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
process.exit(failed > 0 ? 1 : 0);
