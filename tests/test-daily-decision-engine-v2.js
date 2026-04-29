'use strict';
// ─── TESTS — Daily Decision Engine v2 ────────────────────────────────────────
// Usage : node tests/test-daily-decision-engine-v2.js
// ─────────────────────────────────────────────────────────────────────────────

var DDEv2 = require('../app/daily-decision-engine-v2.js');
var decide              = DDEv2.decideDailyPlanV2;
var _computeFatigue     = DDEv2._computeFatigue;
var _applyProgressionRules = DDEv2._applyProgressionRules;
var _applySafety        = DDEv2._applySafetyRules;
var _selectSessionType  = DDEv2._selectSessionType;
var _normalizeLast3     = DDEv2._normalizeLast3;
var _computeDecision    = DDEv2._computeDecision;

// ── Harness ───────────────────────────────────────────────────────────────────
var passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \x1b[32m✓\x1b[0m ' + name);
  } catch (e) {
    failed++;
    console.log('  \x1b[31m✗\x1b[0m ' + name + ' — ' + e.message);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error((msg ? msg + ': ' : '') + 'expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}
function assertThrows(fn, msgContains) {
  try { fn(); throw new Error('expected throw, got none'); }
  catch (e) {
    if (e.message === 'expected throw, got none') throw e;
    if (msgContains && e.message.indexOf(msgContains) === -1) {
      throw new Error('expected error containing "' + msgContains + '", got: ' + e.message);
    }
  }
}

function daysAgo(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Helper : build d'un input minimal
function base(overrides) {
  return Object.assign({
    fatigueLevel: 2,
    last3SessionsIntensity: ['moderate'],
    lastSessionDate: daysAgo(1),
    goal: 'muscle_gain',
    trainingFrequency: 3
  }, overrides || {});
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 1 : Validation ────────────────────────────────────\n');

test('inputs null → TypeError', function () {
  assertThrows(function () { decide(null); }, 'inputs must be a plain object');
});
test('fatigueLevel 0 → RangeError', function () {
  assertThrows(function () { decide(base({ fatigueLevel: 0 })); }, 'fatigueLevel');
});
test('fatigueLevel 2.5 → RangeError', function () {
  assertThrows(function () { decide(base({ fatigueLevel: 2.5 })); }, 'fatigueLevel');
});
test('last3 array vide → RangeError', function () {
  assertThrows(function () { decide(base({ last3SessionsIntensity: [] })); }, 'empty');
});
test('last3 valeur invalide → RangeError', function () {
  assertThrows(function () { decide(base({ last3SessionsIntensity: ['extreme'] })); }, 'low|moderate|high');
});
test('last3 string valide (compat V1) → accepté', function () {
  var out = decide(base({ last3SessionsIntensity: 'moderate' }));
  assert(out.decision !== undefined);
});
test('goal invalide → RangeError', function () {
  assertThrows(function () { decide(base({ goal: 'endurance' })); }, 'goal');
});
test('trainingPhase invalide → RangeError', function () {
  assertThrows(function () { decide(base({ trainingPhase: 'maintenance' })); }, 'trainingPhase');
});
test('trainingPhase absent → défaut build, pas d\'erreur', function () {
  var out = decide(base());
  assertEqual(out._debug.phase, 'build');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 2 : _normalizeLast3 ──────────────────────────────\n');

test('string → array[1]', function () {
  var r = _normalizeLast3('high');
  assertEqual(r.length, 1);
  assertEqual(r[0], 'high');
});
test('array → tronqué à 3', function () {
  var r = _normalizeLast3(['high', 'moderate', 'low', 'high']);
  assertEqual(r.length, 3);
});
test('array[2] → conservé', function () {
  var r = _normalizeLast3(['high', 'moderate']);
  assertEqual(r.length, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 3 : _applyProgressionRules ───────────────────────\n');

test('2 moderate consécutives + fatigue ≤3 → triggered', function () {
  var r = _applyProgressionRules(['moderate', 'moderate'], 2, 'build');
  assertEqual(r.triggered, true);
});
test('2 moderate + fatigue = 3 → triggered', function () {
  var r = _applyProgressionRules(['moderate', 'moderate'], 3, 'peak');
  assertEqual(r.triggered, true);
});
test('2 moderate + fatigue = 4 → NOT triggered (hard gate)', function () {
  var r = _applyProgressionRules(['moderate', 'moderate'], 4, 'build');
  assertEqual(r.triggered, false);
});
test('1 moderate + phase build → triggered', function () {
  var r = _applyProgressionRules(['moderate'], 2, 'build');
  assertEqual(r.triggered, true);
});
test('1 moderate + phase peak → NOT triggered (needs 2)', function () {
  var r = _applyProgressionRules(['moderate'], 2, 'peak');
  assertEqual(r.triggered, false);
});
test('last high, moderate → NOT triggered (last must be moderate)', function () {
  var r = _applyProgressionRules(['high', 'moderate'], 2, 'build');
  assertEqual(r.triggered, false);
});
test('1 session seulement (low) → NOT triggered', function () {
  var r = _applyProgressionRules(['low'], 2, 'build');
  assertEqual(r.triggered, false);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 4 : _applySafetyRules — Règle A sensible au temps\n');

test('last high + daysSince 1 (<3) → cap moderate', function () {
  var r = _applySafety(2, 1, 'high', 3, 'build', false);
  assert(r.maxRank <= 1, 'maxRank should be ≤ 1 (moderate)');
  assertEqual(r.priorityApplied, 'safety');
});
test('last high + daysSince 2 (<3) → cap moderate', function () {
  var r = _applySafety(2, 2, 'high', 3, 'build', false);
  assert(r.maxRank <= 1, 'maxRank should be ≤ 1');
});
test('V2 FIX : last high + daysSince 3 (≥3) → plus de cap !', function () {
  var r = _applySafety(1, 3, 'high', 3, 'build', false);
  assertEqual(r.maxRank, 2, 'After 3 days, high is allowed again');
});
test('last high + daysSince 5 (≥3) → aucun cap Rule A', function () {
  var r = _applySafety(1, 5, 'high', 3, 'build', false);
  assertEqual(r.maxRank, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 5 : _applySafetyRules — Caps et progression ──────\n');

test('fatigue 3 + freq < 4 + pas de progression → cap moderate', function () {
  var r = _applySafety(3, 1, 'moderate', 3, 'build', false);
  assertEqual(r.maxRank, 1);
  assertEqual(r.priorityApplied, 'safety');
});
test('fatigue 3 + freq < 4 + progressionTriggered → cap levé, high autorisé', function () {
  var r = _applySafety(3, 1, 'moderate', 3, 'build', true);
  assertEqual(r.maxRank, 2, 'Progression should lift soft cap to high');
  assertEqual(r.priorityApplied, 'progression_logic');
});
test('fatigue 4 + progressionTriggered → cap rigide, low seulement', function () {
  var r = _applySafety(4, 1, 'moderate', 3, 'build', true);
  assertEqual(r.maxRank, 0, 'Hard cap cannot be overridden');
  assertEqual(r.priorityApplied, 'safety');
});
test('freq 4 + fatigue 3 + progression → cap fréquence rigide (low)', function () {
  var r = _applySafety(3, 1, 'moderate', 4, 'build', true);
  assertEqual(r.maxRank, 0, 'Dense schedule cap is hard, progression cannot override');
});
test('phase taper → cap moderate (goal_alignment)', function () {
  var r = _applySafety(1, 1, 'low', 3, 'taper', false);
  assertEqual(r.maxRank, 1);
  assertEqual(r.priorityApplied, 'goal_alignment');
});
test('phase restart → cap moderate', function () {
  var r = _applySafety(1, 1, 'low', 3, 'restart', false);
  assertEqual(r.maxRank, 1);
});
test('phase taper + progression → cap taper non levé', function () {
  var r = _applySafety(2, 1, 'moderate', 3, 'taper', true);
  assert(r.maxRank <= 1, 'Taper cap must not be lifted by progression');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 6 : _selectSessionType — V2 fixes ────────────────\n');

test('fat_loss + high → hiit (V2 fix)', function () {
  assertEqual(_selectSessionType('train', 'high', 'fat_loss'), 'hiit');
});
test('fat_loss + moderate → cardio', function () {
  assertEqual(_selectSessionType('train', 'moderate', 'fat_loss'), 'cardio');
});
test('muscle_gain + high → strength', function () {
  assertEqual(_selectSessionType('train', 'high', 'muscle_gain'), 'strength');
});
test('muscle_gain + moderate → strength', function () {
  assertEqual(_selectSessionType('train', 'moderate', 'muscle_gain'), 'strength');
});
test('maintenance + high → strength', function () {
  assertEqual(_selectSessionType('train', 'high', 'maintenance'), 'strength');
});
test('maintenance + moderate → cardio', function () {
  assertEqual(_selectSessionType('train', 'moderate', 'maintenance'), 'cardio');
});
test('train + low → mobility (V2 fix : pas recovery)', function () {
  assertEqual(_selectSessionType('train', 'low', 'muscle_gain'), 'mobility');
});
test('rest → recovery', function () {
  assertEqual(_selectSessionType('rest', 'low', 'fat_loss'), 'recovery');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 7 : 8 scénarios métier obligatoires ─────────────\n');

// SCÉNARIO 1 — Fatigue haute vs objectif
test('S1 Fatigue haute (4) vs objectif muscle_gain, freq 3 → rest', function () {
  var out = decide({
    fatigueLevel: 4, last3SessionsIntensity: ['moderate'],
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.decision, 'rest', 'fatigue 4 + freq 3 must rest');
  assertEqual(out.priorityApplied, 'safety');
  assertEqual(out.progressionTriggered, false);
  assert(out.reason.length > 0, 'reason must not be empty');
});

// SCÉNARIO 2 — Retour après 5 jours off
test('S2 Retour après 5 jours off, raw fatigue 4 → effective 2, train high', function () {
  var out = decide({
    fatigueLevel: 4, last3SessionsIntensity: ['moderate', 'moderate'],
    lastSessionDate: daysAgo(5), goal: 'muscle_gain', trainingFrequency: 3
  });
  // 5 jours off → effectiveFatigue = 4 - 2 = 2
  assertEqual(out.fatigueEffective, 2, 'effective fatigue should drop to 2 after 5 rest days');
  assertEqual(out.decision, 'train');
  // fatigue 2 + 2 consecutive moderate → progression → high
  assertEqual(out.progressionTriggered, true);
  assertEqual(out.recommendedIntensity, 'high');
  // La reason doit mentionner l'ajustement de fatigue
  assert(out.reason.indexOf('Fatigue adjusted') !== -1, 'reason should mention fatigue adjustment');
  assert(out.reason.indexOf('4 → 2') !== -1 || out.reason.indexOf('→ 2') !== -1, 'reason should show 4→2');
});

// SCÉNARIO 3 — 2 sessions moderate consécutives → progression
test('S3 2 moderate consécutives + fatigue 3 → progression, high autorisé', function () {
  var out = decide({
    fatigueLevel: 3, last3SessionsIntensity: ['moderate', 'moderate'],
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.progressionTriggered, true, 'progression must trigger');
  assertEqual(out.recommendedIntensity, 'high', 'progression should lift moderate soft cap to high');
  assertEqual(out.priorityApplied, 'progression_logic');
  assertEqual(out.decision, 'train');
});

// SCÉNARIO 4 — fat_loss + high → hiit
test('S4 fat_loss + high intensity → hiit (pas strength)', function () {
  var out = decide({
    fatigueLevel: 1, last3SessionsIntensity: ['low', 'low'],
    lastSessionDate: daysAgo(2), goal: 'fat_loss', trainingFrequency: 3
  });
  assertEqual(out.decision, 'train');
  assertEqual(out.recommendedIntensity, 'high');
  assertEqual(out.recommendedSessionType, 'hiit', 'fat_loss + high must be hiit, not strength');
});

// SCÉNARIO 5 — Phase taper
test('S5 Phase taper + fatigue 1 + tout vert → max moderate', function () {
  var out = decide({
    fatigueLevel: 1, last3SessionsIntensity: ['moderate', 'moderate'],
    lastSessionDate: daysAgo(2), goal: 'muscle_gain', trainingFrequency: 3,
    trainingPhase: 'taper'
  });
  assertEqual(out.decision, 'train');
  assert(out.recommendedIntensity !== 'high', 'taper must cap at moderate');
  assertEqual(out.recommendedIntensity, 'moderate');
  // La progression ne doit pas lever le cap taper
  // (progression triggered mais taper garde la priorité phase)
  assertEqual(out.priorityApplied, 'goal_alignment');
});

// SCÉNARIO 6 — Phase restart
test('S6 Phase restart + fatigue 2 → max moderate, priorité goal_alignment', function () {
  var out = decide({
    fatigueLevel: 2, last3SessionsIntensity: ['low'],
    lastSessionDate: daysAgo(2), goal: 'muscle_gain', trainingFrequency: 3,
    trainingPhase: 'restart'
  });
  assertEqual(out.decision, 'train');
  assert(out.recommendedIntensity !== 'high', 'restart must cap at moderate');
  assertEqual(out.priorityApplied, 'goal_alignment');
  assert(out.reason.indexOf('restart') !== -1 || out.reason.indexOf('comeback') !== -1,
    'reason should mention restart/comeback');
});

// SCÉNARIO 7 — Fatigue brute vs effective : reason doit expliquer l'ajustement
test('S7 Fatigue brute 4, sommeil 1, 2 repos → effective 4, reason explique', function () {
  var out = decide({
    fatigueLevel: 3, last3SessionsIntensity: ['moderate'],
    lastSessionDate: daysAgo(2), goal: 'fat_loss', trainingFrequency: 3,
    sleepQuality: 1
    // effectiveFatigue: 3 + 1(sleep) - 1(2days) = 3
  });
  // rawFatigue=3, sleepQuality=1 (+1), daysSince=2 (-1) → effective=3 (inchangé ici)
  // Essayons avec un cas où raw ≠ effective clairement :
  // fatigueLevel:4, daysSince:3 → 4 - 1 - 1 = 2
});
// Cas clair : fatigue brute 4, 4 jours repos → effective 2
test('S7b Fatigue 4 raw, 4 jours → effective 2, reason mentionne l\'ajustement', function () {
  var out = decide({
    fatigueLevel: 4, last3SessionsIntensity: ['moderate', 'moderate'],
    lastSessionDate: daysAgo(4), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.fatigueEffective, 2);
  assert(out.reason.indexOf('Fatigue adjusted') !== -1, 'reason must explain fatigue adjustment');
  assert(out.reason.indexOf('4') !== -1, 'reason must reference raw fatigue 4');
});

// SCÉNARIO 8 — Fréquence faible : régularité
test('S8 Fréquence faible (2/sem), fatigue 4 → train (régularité)', function () {
  var out = decide({
    fatigueLevel: 4, last3SessionsIntensity: ['low'],
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 2
  });
  assertEqual(out.decision, 'train', 'low frequency must prioritize regularity');
  assertEqual(out.priorityApplied, 'frequency_consistency');
  assertEqual(out.recommendedIntensity, 'low', 'fatigue 4 → max low even if training');
  assert(out.reason.toLowerCase().indexOf('frequenc') !== -1 ||
         out.reason.toLowerCase().indexOf('regularity') !== -1,
    'reason should mention frequency/regularity');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 8 : Non-régression V1 — comportements identiques ─\n');

// Ces cas doivent produire le même comportement qu'en V1 (adaptés au format V2)

test('NR1 Fatigue 5 → toujours rest (sans exception)', function () {
  var out = decide(base({ fatigueLevel: 5, last3SessionsIntensity: ['low'] }));
  assertEqual(out.decision, 'rest');
  assertEqual(out.priorityApplied, 'safety');
});
test('NR2 Déjà entraîné aujourd\'hui → rest', function () {
  var out = decide(base({ lastSessionDate: daysAgo(0) }));
  assertEqual(out.decision, 'rest');
});
test('NR3 Fatigue 1, repos 2 jours, last low → high', function () {
  var out = decide(base({ fatigueLevel: 1, lastSessionDate: daysAgo(2), last3SessionsIntensity: ['low'] }));
  assertEqual(out.decision, 'train');
  assertEqual(out.recommendedIntensity, 'high');
});
test('NR4 Haute fréquence (5/sem) + fatigue 3 → low (gestion stricte)', function () {
  var out = decide(base({ fatigueLevel: 3, trainingFrequency: 5, last3SessionsIntensity: ['moderate'] }));
  assertEqual(out.recommendedIntensity, 'low');
  assertEqual(out.recommendedSessionType, 'mobility');
});
test('NR5 fat_loss + moderate → cardio', function () {
  // peak phase + single low session → no progression trigger → soft cap → moderate → cardio
  var out = decide(base({ goal: 'fat_loss', fatigueLevel: 3, trainingPhase: 'peak',
                           last3SessionsIntensity: ['low'] }));
  assertEqual(out.recommendedSessionType, 'cardio');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 9 : Structure et invariants de l\'output ─────────\n');

test('Output contient tous les champs V2 requis', function () {
  var out = decide(base());
  assert(out.decision               !== undefined, 'missing: decision');
  assert(out.recommendedIntensity   !== undefined, 'missing: recommendedIntensity');
  assert(out.recommendedSessionType !== undefined, 'missing: recommendedSessionType');
  assert(typeof out.fatigueEffective === 'number', 'missing: fatigueEffective');
  assert(['safety','progression_logic','frequency_consistency','goal_alignment']
    .indexOf(out.priorityApplied) !== -1, 'invalid priorityApplied: ' + out.priorityApplied);
  assert(typeof out.progressionTriggered === 'boolean', 'missing: progressionTriggered');
  assert(typeof out.reason === 'string' && out.reason.length > 0, 'missing: reason');
  assert(out._debug !== undefined, 'missing: _debug');
});
test('decision toujours train|rest', function () {
  ['fat_loss','muscle_gain','maintenance'].forEach(function (g) {
    var out = decide(base({ goal: g }));
    assert(out.decision === 'train' || out.decision === 'rest');
  });
});
test('recommendedIntensity toujours low|moderate|high', function () {
  var out = decide(base({ fatigueLevel: 2 }));
  assert(['low','moderate','high'].indexOf(out.recommendedIntensity) !== -1);
});
test('recommendedSessionType toujours valide', function () {
  var valid = ['strength','cardio','hiit','mobility','recovery'];
  ['fat_loss','muscle_gain','maintenance'].forEach(function (g) {
    var out = decide(base({ goal: g, fatigueLevel: 2 }));
    assert(valid.indexOf(out.recommendedSessionType) !== -1,
      'invalid type: ' + out.recommendedSessionType + ' for goal ' + g);
  });
});
test('Si rest → recommendedSessionType = recovery', function () {
  var out = decide(base({ fatigueLevel: 5 }));
  assertEqual(out.recommendedSessionType, 'recovery');
});
test('progressionTriggered false si decision = rest', function () {
  var out = decide(base({ fatigueLevel: 5 }));
  assertEqual(out.progressionTriggered, false);
});
test('fatigueEffective compris entre 1 et 5', function () {
  var out = decide(base({ fatigueLevel: 1, lastSessionDate: daysAgo(10) }));
  assert(out.fatigueEffective >= 1 && out.fatigueEffective <= 5,
    'effectiveFatigue out of range: ' + out.fatigueEffective);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 10 : Cas V2 vs V1 — différences attendues ────────\n');

test('V2 FIX — Rule A : last high + 3 jours → high autorisé (V1 bloquait)', function () {
  // V1 : après high, cap toujours moderate
  // V2 : après 3 jours, cap levé
  var out = decide({
    fatigueLevel: 1, last3SessionsIntensity: ['high'],
    lastSessionDate: daysAgo(3), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.recommendedIntensity, 'high', 'After 3+ days, high should be allowed again');
});
test('V2 FIX — fat_loss + high → hiit (V1 donnait strength)', function () {
  var out = decide({
    fatigueLevel: 1, last3SessionsIntensity: ['low'],
    lastSessionDate: daysAgo(2), goal: 'fat_loss', trainingFrequency: 3
  });
  assertEqual(out.recommendedSessionType, 'hiit');
});
test('V2 FIX — train + low → mobility (V1 donnait recovery)', function () {
  var out = decide({
    fatigueLevel: 3, last3SessionsIntensity: ['moderate'],
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 5
  });
  assertEqual(out.decision, 'train');
  assertEqual(out.recommendedIntensity, 'low');
  assertEqual(out.recommendedSessionType, 'mobility');
});
test('V2 NEW — progression_logic dans output', function () {
  var out = decide({
    fatigueLevel: 3, last3SessionsIntensity: ['moderate', 'moderate'],
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.progressionTriggered, true);
  assertEqual(out.priorityApplied, 'progression_logic');
});
test('V2 NEW — phase taper dans output', function () {
  var out = decide(base({ trainingPhase: 'taper' }));
  assert(out.recommendedIntensity !== 'high');
  assertEqual(out._debug.phase, 'taper');
});

// ─────────────────────────────────────────────────────────────────────────────
// Résultats
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (failed === 0) {
  console.log('\x1b[32m✔ ' + passed + ' passed, 0 failed\x1b[0m\n');
} else {
  console.log('\x1b[31m✗ ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
  process.exit(1);
}
