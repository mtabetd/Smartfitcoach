'use strict';
// ─── TESTS — Daily Decision Engine v3 — Module 1 ─────────────────────────────
// Usage : node tests/test-daily-decision-engine-v3.js
//
// Covers:
//   · _validateUserProfile — all field constraints
//   · _normalizeLast7SessionsIntensity / _normalizeLastSessionTypeHistory
//   · Strict V2 parity — identical output on shared fields when no userProfile
//   · V3 stub fields (momentumScore=null, profileType='beginner', adaptationReason=null)
//   · Engine accepts valid userProfile without changing decisions
//   · Engine rejects invalid userProfile before running
// ─────────────────────────────────────────────────────────────────────────────

var DDEv2 = require('../app/daily-decision-engine-v2.js');
var DDEv3 = require('../app/daily-decision-engine-v3.js');

var decideV2 = DDEv2.decideDailyPlanV2;
var decideV3 = DDEv3.decideDailyPlanV3;

var _validateUserProfile             = DDEv3._validateUserProfile;
var _normalizeLast7SessionsIntensity = DDEv3._normalizeLast7SessionsIntensity;
var _normalizeLastSessionTypeHistory = DDEv3._normalizeLastSessionTypeHistory;
var _computeMomentumScore            = DDEv3._computeMomentumScore;

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
function assertDeepEqual(a, b, label) {
  var sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((label ? label + ': ' : '') + 'expected ' + sb + ', got ' + sa);
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

// Minimal valid V2-compatible input (no userProfile)
function baseV2(overrides) {
  return Object.assign({
    fatigueLevel:            2,
    last3SessionsIntensity:  ['moderate'],
    lastSessionDate:         daysAgo(1),
    goal:                    'muscle_gain',
    trainingFrequency:       3
  }, overrides || {});
}

// Minimal valid userProfile
function baseProfile(overrides) {
  return Object.assign({
    avgFatigueLast7Days:           2.5,
    trainingFrequencyLast7Days:    3,
    last7SessionsIntensity:        ['moderate', 'low', 'moderate'],
    adherenceScore:                0.75,
    lastSessionTypeHistory:        ['strength', 'cardio']
  }, overrides || {});
}

// V3 input with valid userProfile
function baseV3(overrides) {
  return Object.assign(baseV2(), { userProfile: baseProfile() }, overrides || {});
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 1 : _validateUserProfile ─────────────────────────\n');

test('null → TypeError', function () {
  assertThrows(function () { _validateUserProfile(null); }, 'must be a plain object');
});
test('string → TypeError', function () {
  assertThrows(function () { _validateUserProfile('data'); }, 'must be a plain object');
});
test('avgFatigueLast7Days = 0 → RangeError', function () {
  assertThrows(function () { _validateUserProfile({ avgFatigueLast7Days: 0 }); }, 'avgFatigueLast7Days');
});
test('avgFatigueLast7Days = 6 → RangeError', function () {
  assertThrows(function () { _validateUserProfile({ avgFatigueLast7Days: 6 }); }, 'avgFatigueLast7Days');
});
test('avgFatigueLast7Days = 4.5 → valide (float accepté)', function () {
  _validateUserProfile({ avgFatigueLast7Days: 4.5 }); // must not throw
  assert(true);
});
test('trainingFrequencyLast7Days = -1 → RangeError', function () {
  assertThrows(function () { _validateUserProfile({ trainingFrequencyLast7Days: -1 }); }, 'trainingFrequencyLast7Days');
});
test('trainingFrequencyLast7Days = 8 → RangeError', function () {
  assertThrows(function () { _validateUserProfile({ trainingFrequencyLast7Days: 8 }); }, 'trainingFrequencyLast7Days');
});
test('trainingFrequencyLast7Days = 0 → valide (zéro autorisé)', function () {
  _validateUserProfile({ trainingFrequencyLast7Days: 0 });
  assert(true);
});
test('trainingFrequencyLast7Days = 2.5 → RangeError (non-entier)', function () {
  assertThrows(function () { _validateUserProfile({ trainingFrequencyLast7Days: 2.5 }); }, 'trainingFrequencyLast7Days');
});
test('adherenceScore = -0.1 → RangeError', function () {
  assertThrows(function () { _validateUserProfile({ adherenceScore: -0.1 }); }, 'adherenceScore');
});
test('adherenceScore = 1.1 → RangeError', function () {
  assertThrows(function () { _validateUserProfile({ adherenceScore: 1.1 }); }, 'adherenceScore');
});
test('adherenceScore = 0 → valide (boundary)', function () {
  _validateUserProfile({ adherenceScore: 0 });
  assert(true);
});
test('adherenceScore = 1 → valide (boundary)', function () {
  _validateUserProfile({ adherenceScore: 1 });
  assert(true);
});
test('last7SessionsIntensity non-array → TypeError', function () {
  assertThrows(function () { _validateUserProfile({ last7SessionsIntensity: 'moderate' }); }, 'must be an array');
});
test('last7SessionsIntensity valeur invalide → RangeError', function () {
  assertThrows(function () { _validateUserProfile({ last7SessionsIntensity: ['extreme'] }); }, 'low|moderate|high');
});
test('last7SessionsIntensity = 7 éléments valides → ok', function () {
  _validateUserProfile({
    last7SessionsIntensity: ['low','moderate','high','moderate','low','moderate','high']
  });
  assert(true);
});
test('lastSessionTypeHistory non-array → TypeError', function () {
  assertThrows(function () { _validateUserProfile({ lastSessionTypeHistory: 'strength' }); }, 'must be an array');
});
test('lastSessionTypeHistory absent → valide (optionnel)', function () {
  _validateUserProfile({ adherenceScore: 0.5 }); // no lastSessionTypeHistory
  assert(true);
});
test('profil entièrement vide {} → valide (tous les champs sont optionnels)', function () {
  _validateUserProfile({});
  assert(true);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 2 : _normalizeLast7SessionsIntensity ─────────────\n');

test('array de 3 → retourné intact', function () {
  var r = _normalizeLast7SessionsIntensity(['high', 'moderate', 'low']);
  assertEqual(r.length, 3);
  assertEqual(r[0], 'high');
});
test('array de 9 → tronqué à 7', function () {
  var r = _normalizeLast7SessionsIntensity(
    ['high','moderate','low','high','moderate','low','high','moderate','low']
  );
  assertEqual(r.length, 7);
});
test('array de 7 → conservé à 7', function () {
  var r = _normalizeLast7SessionsIntensity(['low','low','low','low','low','low','low']);
  assertEqual(r.length, 7);
});
test('non-array → [] (pas de crash)', function () {
  assertDeepEqual(_normalizeLast7SessionsIntensity('moderate'), []);
  assertDeepEqual(_normalizeLast7SessionsIntensity(null), []);
  assertDeepEqual(_normalizeLast7SessionsIntensity(undefined), []);
});
test('array vide → []', function () {
  assertDeepEqual(_normalizeLast7SessionsIntensity([]), []);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 3 : _normalizeLastSessionTypeHistory ─────────────\n');

test('array de 5 → retourné intact', function () {
  var r = _normalizeLastSessionTypeHistory(['strength','cardio','hiit','mobility','recovery']);
  assertEqual(r.length, 5);
});
test('array de 10 → tronqué à 7', function () {
  var r = _normalizeLastSessionTypeHistory(new Array(10).fill('strength'));
  assertEqual(r.length, 7);
});
test('non-array → [] (pas de crash)', function () {
  assertDeepEqual(_normalizeLastSessionTypeHistory(null), []);
  assertDeepEqual(_normalizeLastSessionTypeHistory(42), []);
});
test('array vide → []', function () {
  assertDeepEqual(_normalizeLastSessionTypeHistory([]), []);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 4 : Parité stricte V2 (sans userProfile) ─────────\n');
//
// Pour chaque scénario, V3 sans userProfile DOIT produire des champs V2 IDENTIQUES.
// Seuls momentumScore, profileType, adaptationReason diffèrent.

var V2_FIELDS = [
  'decision', 'recommendedIntensity', 'recommendedSessionType',
  'fatigueEffective', 'priorityApplied', 'progressionTriggered', 'reason'
];

function assertV2Parity(label, inputs) {
  test(label, function () {
    var v2 = decideV2(inputs);
    var v3 = decideV3(inputs);
    V2_FIELDS.forEach(function (field) {
      if (v2[field] !== v3[field]) {
        throw new Error(field + ': V2=' + JSON.stringify(v2[field]) + ' V3=' + JSON.stringify(v3[field]));
      }
    });
    // _debug fields must also match
    var debugFields = ['rawFatigue','effectiveFatigue','daysSince','phase','maxAllowedIntensity','capReason','progressionSignal'];
    debugFields.forEach(function (f) {
      if (JSON.stringify(v2._debug[f]) !== JSON.stringify(v3._debug[f])) {
        throw new Error('_debug.' + f + ': V2=' + JSON.stringify(v2._debug[f]) + ' V3=' + JSON.stringify(v3._debug[f]));
      }
    });
  });
}

assertV2Parity('fatigue 1, last low, 2 jours repos → train high',
  baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2) }));

assertV2Parity('fatigue 5 → rest (safety)',
  baseV2({ fatigueLevel: 5, last3SessionsIntensity: ['moderate'] }));

assertV2Parity('fatigue 4, freq 3 → rest',
  baseV2({ fatigueLevel: 4, last3SessionsIntensity: ['moderate'] }));

assertV2Parity('fatigue 4, freq 2 → train (régularité)',
  baseV2({ fatigueLevel: 4, trainingFrequency: 2, last3SessionsIntensity: ['low'] }));

assertV2Parity('2 moderate consécutives + fatigue 3 → progression, high',
  baseV2({ fatigueLevel: 3, last3SessionsIntensity: ['moderate', 'moderate'] }));

assertV2Parity('fat_loss + high → hiit (pas strength)',
  baseV2({ fatigueLevel: 1, goal: 'fat_loss', last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2) }));

assertV2Parity('train + low → mobility (pas recovery)',
  baseV2({ fatigueLevel: 3, trainingFrequency: 5, last3SessionsIntensity: ['moderate'] }));

assertV2Parity('phase taper → max moderate',
  baseV2({ fatigueLevel: 1, trainingPhase: 'taper', last3SessionsIntensity: ['moderate', 'moderate'], lastSessionDate: daysAgo(2) }));

assertV2Parity('last high + daysSince 1 → cap moderate (Règle A)',
  baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['high'] }));

assertV2Parity('last high + daysSince 3 → high autorisé (Règle A levée)',
  baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(3) }));

assertV2Parity('déjà entraîné aujourd\'hui → rest',
  baseV2({ lastSessionDate: daysAgo(0) }));

assertV2Parity('sommeil 1 + fatigue 3 → effective 4, rest',
  baseV2({ fatigueLevel: 3, sleepQuality: 1, trainingFrequency: 3, last3SessionsIntensity: ['moderate'] }));

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 5 : Champs V3 — valeurs par défaut ───────────────\n');

test('sans userProfile → momentumScore = null', function () {
  assertEqual(decideV3(baseV2()).momentumScore, null);
});
test('sans userProfile → profileType = "beginner"', function () {
  assertEqual(decideV3(baseV2()).profileType, 'beginner');
});
test('sans userProfile → adaptationReason = null', function () {
  assertEqual(decideV3(baseV2()).adaptationReason, null);
});
test('userProfile null explicite → mêmes valeurs par défaut', function () {
  var out = decideV3(baseV2({ userProfile: null }));
  assertEqual(out.momentumScore, null);
  assertEqual(out.profileType, 'beginner');
  assertEqual(out.adaptationReason, null);
});
test('avec userProfile valide → momentumScore est un nombre 0–10', function () {
  var out = decideV3(baseV3());
  assert(typeof out.momentumScore === 'number', 'expected number, got ' + typeof out.momentumScore);
  assert(out.momentumScore >= 0 && out.momentumScore <= 10, 'out of range: ' + out.momentumScore);
});
test('avec userProfile valide → profileType toujours "beginner" (Module 3)', function () {
  assertEqual(decideV3(baseV3()).profileType, 'beginner');
});
test('avec userProfile valide → adaptationReason toujours null (Module 4)', function () {
  assertEqual(decideV3(baseV3()).adaptationReason, null);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 6 : userProfile valide — décisions inchangées ────\n');
//
// Quand userProfile est fourni mais que Module 2–4 ne sont pas encore actifs,
// la décision doit rester IDENTIQUE à V2.

function assertV2ParityWithProfile(label, v2inputs) {
  test(label, function () {
    var v2  = decideV2(v2inputs);
    // Same inputs + a valid userProfile for V3
    var v3inp = Object.assign({}, v2inputs, { userProfile: baseProfile() });
    var v3  = decideV3(v3inp);
    V2_FIELDS.forEach(function (field) {
      if (v2[field] !== v3[field]) {
        throw new Error(field + ': V2=' + JSON.stringify(v2[field]) + ' V3=' + JSON.stringify(v3[field]));
      }
    });
  });
}

assertV2ParityWithProfile('avec profil : fatigue 2, last moderate → train',
  baseV2());

assertV2ParityWithProfile('avec profil : fatigue 5 → rest',
  baseV2({ fatigueLevel: 5, last3SessionsIntensity: ['low'] }));

assertV2ParityWithProfile('avec profil : 2 moderate → progression high',
  baseV2({ fatigueLevel: 3, last3SessionsIntensity: ['moderate', 'moderate'] }));

assertV2ParityWithProfile('avec profil : fat_loss high → hiit',
  baseV2({ fatigueLevel: 1, goal: 'fat_loss', last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2) }));

assertV2ParityWithProfile('avec profil : phase taper → moderate',
  baseV2({ fatigueLevel: 1, trainingPhase: 'taper', last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2) }));

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 7 : userProfile invalide — erreur avant exécution ─\n');
//
// Un userProfile invalide doit lever une erreur AVANT que le moteur
// ne produise un résultat — le moteur ne doit jamais crasher silencieusement.

test('avgFatigueLast7Days invalide → RangeError levée par le moteur', function () {
  assertThrows(function () {
    decideV3(baseV2({ userProfile: baseProfile({ avgFatigueLast7Days: 0 }) }));
  }, 'avgFatigueLast7Days');
});
test('adherenceScore invalide → RangeError levée par le moteur', function () {
  assertThrows(function () {
    decideV3(baseV2({ userProfile: baseProfile({ adherenceScore: 1.5 }) }));
  }, 'adherenceScore');
});
test('trainingFrequencyLast7Days hors-limites → RangeError levée par le moteur', function () {
  assertThrows(function () {
    decideV3(baseV2({ userProfile: baseProfile({ trainingFrequencyLast7Days: 8 }) }));
  }, 'trainingFrequencyLast7Days');
});
test('last7SessionsIntensity valeur invalide → RangeError levée par le moteur', function () {
  assertThrows(function () {
    decideV3(baseV2({ userProfile: baseProfile({ last7SessionsIntensity: ['extreme'] }) }));
  }, 'low|moderate|high');
});
test('lastSessionTypeHistory non-array → TypeError levée par le moteur', function () {
  assertThrows(function () {
    decideV3(baseV2({ userProfile: baseProfile({ lastSessionTypeHistory: 'strength' }) }));
  }, 'must be an array');
});
test('userProfile = chaîne → TypeError levée par le moteur', function () {
  assertThrows(function () {
    decideV3(baseV2({ userProfile: 'profile data' }));
  }, 'must be a plain object');
});
test('inputs V2 invalides toujours rejetés même avec userProfile valide', function () {
  assertThrows(function () {
    decideV3({ fatigueLevel: 0, last3SessionsIntensity: ['low'],
               lastSessionDate: daysAgo(1), goal: 'muscle_gain',
               trainingFrequency: 3, userProfile: baseProfile() });
  }, 'fatigueLevel');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 8 : Structure de sortie ──────────────────────────\n');

test('tous les champs V2 présents', function () {
  var out = decideV3(baseV2());
  V2_FIELDS.forEach(function (f) {
    assert(f in out, 'missing field: ' + f);
  });
});
test('champs V3 tous présents (stubs)', function () {
  var out = decideV3(baseV2());
  assert('momentumScore'    in out, 'missing: momentumScore');
  assert('profileType'      in out, 'missing: profileType');
  assert('adaptationReason' in out, 'missing: adaptationReason');
});
test('_debug contient les 7 champs V2 standards', function () {
  var out = decideV3(baseV2());
  var dbg = out._debug;
  ['rawFatigue','effectiveFatigue','daysSince','last3','phase',
   'maxAllowedIntensity','capReason','progressionSignal'].forEach(function (f) {
    assert(f in dbg, '_debug missing: ' + f);
  });
});
test('userProfile valide → profil stocké sans modifier la décision', function () {
  var v2 = decideV2(baseV2());
  var v3 = decideV3(baseV3());
  assertEqual(v2.decision,             v3.decision);
  assertEqual(v2.recommendedIntensity, v3.recommendedIntensity);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 9 : _computeMomentumScore — règles unitaires ─────\n');

test('null → null', function () {
  assertEqual(_computeMomentumScore(null), null);
});
test('undefined → null', function () {
  assertEqual(_computeMomentumScore(undefined), null);
});
test('profil vide {} → baseline 5 (aucun champ, aucun delta)', function () {
  assertEqual(_computeMomentumScore({}), 5);
});

// ── Bonifications ────────────────────────────────────────────────────────────
test('+1 si trainingFrequencyLast7Days >= 3', function () {
  var with3 = _computeMomentumScore({ trainingFrequencyLast7Days: 3 });
  var with2 = _computeMomentumScore({ trainingFrequencyLast7Days: 2 });
  assertEqual(with3, 6);
  assertEqual(with2, 5);
});
test('+1 : boundary exacte freq=3 (pas freq=2)', function () {
  assertEqual(_computeMomentumScore({ trainingFrequencyLast7Days: 3 }), 6);
  assertEqual(_computeMomentumScore({ trainingFrequencyLast7Days: 2 }), 5);
});
test('+1 si adherenceScore >= 0.8', function () {
  assertEqual(_computeMomentumScore({ adherenceScore: 0.8 }), 6);
  assertEqual(_computeMomentumScore({ adherenceScore: 0.79 }), 5);
});
test('+1 : boundary exacte adherence=0.8', function () {
  assertEqual(_computeMomentumScore({ adherenceScore: 0.8  }), 6);
  assertEqual(_computeMomentumScore({ adherenceScore: 0.799 }), 5);
});
test('+1 si last7SessionsIntensity contient au moins un "high"', function () {
  assertEqual(_computeMomentumScore({ last7SessionsIntensity: ['moderate', 'high', 'low'] }), 6);
  assertEqual(_computeMomentumScore({ last7SessionsIntensity: ['moderate', 'low'] }), 5);
});
test('+1 high : un seul high suffit', function () {
  assertEqual(_computeMomentumScore({ last7SessionsIntensity: ['low', 'low', 'low', 'low', 'low', 'low', 'high'] }), 6);
});

// ── Pénalités ────────────────────────────────────────────────────────────────
test('-1 si adherenceScore < 0.5', function () {
  assertEqual(_computeMomentumScore({ adherenceScore: 0.49 }), 4);
  assertEqual(_computeMomentumScore({ adherenceScore: 0.5  }), 5); // boundary: no penalty
});
test('-1 si avgFatigueLast7Days >= 4', function () {
  assertEqual(_computeMomentumScore({ avgFatigueLast7Days: 4   }), 4);
  assertEqual(_computeMomentumScore({ avgFatigueLast7Days: 3.9 }), 5);
});
test('-1 avgFat : boundary exacte 4.0', function () {
  assertEqual(_computeMomentumScore({ avgFatigueLast7Days: 4.0 }), 4);
  assertEqual(_computeMomentumScore({ avgFatigueLast7Days: 3.99 }), 5);
});
test('-2 si trainingFrequencyLast7Days === 0', function () {
  assertEqual(_computeMomentumScore({ trainingFrequencyLast7Days: 0 }), 3);
  assertEqual(_computeMomentumScore({ trainingFrequencyLast7Days: 1 }), 5); // freq=1: no +1, no -2
});
test('-2 freq=0 et +1 freq>=3 ne s\'appliquent pas simultanément', function () {
  // freq=0 → -2 mais pas de +1 (0 < 3) → 5 - 2 = 3
  assertEqual(_computeMomentumScore({ trainingFrequencyLast7Days: 0 }), 3);
});

// ── Combinaisons et bornes ────────────────────────────────────────────────────
test('profil discipliné → score élevé (8)', function () {
  // freq=5(+1) + adherence=0.9(+1) + has high(+1) → 5+3 = 8
  var score = _computeMomentumScore({
    trainingFrequencyLast7Days: 5,
    adherenceScore:             0.9,
    last7SessionsIntensity:     ['high', 'moderate', 'high']
  });
  assertEqual(score, 8);
});
test('profil inconstant → score bas (2)', function () {
  // freq=0(-2) + adherence=0.3(-1) → 5-3 = 2
  var score = _computeMomentumScore({
    trainingFrequencyLast7Days: 0,
    adherenceScore:             0.3
  });
  assertEqual(score, 2);
});
test('profil haute fatigue → score réduit (4)', function () {
  // avgFat=4.5(-1) → 5-1 = 4
  var score = _computeMomentumScore({
    avgFatigueLast7Days: 4.5
  });
  assertEqual(score, 4);
});
test('pire cas possible → score ≥ 0 (jamais négatif)', function () {
  // freq=0(-2) + adherence=0.1(-1) + avgFat=5(-1) → 5-4 = 1 (min sans high)
  var score = _computeMomentumScore({
    trainingFrequencyLast7Days: 0,
    adherenceScore:             0.1,
    avgFatigueLast7Days:        5
  });
  assert(score >= 0, 'score must be ≥ 0, got: ' + score);
  assertEqual(score, 1);
});
test('meilleur cas possible → score ≤ 10 (jamais au-dessus)', function () {
  // freq=7(+1) + adherence=1.0(+1) + has high(+1) → 5+3 = 8 (max théorique)
  var score = _computeMomentumScore({
    trainingFrequencyLast7Days: 7,
    adherenceScore:             1.0,
    last7SessionsIntensity:     ['high', 'high', 'high']
  });
  assert(score <= 10, 'score must be ≤ 10, got: ' + score);
  assertEqual(score, 8);
});
test('champs absents ignorés — pas de crash', function () {
  // adherenceScore absent → pas de +1, pas de -1
  var score = _computeMomentumScore({ trainingFrequencyLast7Days: 3 });
  assertEqual(score, 6); // only freq bonus
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 10 : Intégration — momentum dans le moteur ───────\n');

var V2_FIELDS = ['decision','recommendedIntensity','recommendedSessionType',
                 'fatigueEffective','priorityApplied','progressionTriggered','reason'];

test('sans userProfile → momentumScore null', function () {
  assertEqual(decideV3(baseV2()).momentumScore, null);
});
test('userProfile null explicite → momentumScore null', function () {
  assertEqual(decideV3(baseV2({ userProfile: null })).momentumScore, null);
});
test('avec userProfile valide → momentumScore est un entier 0–10', function () {
  var score = decideV3(baseV3()).momentumScore;
  assert(typeof score === 'number' && score === Math.floor(score), 'should be integer');
  assert(score >= 0 && score <= 10);
});
test('momentum ne modifie pas decision', function () {
  var v2 = decideV2(baseV2());
  var v3 = decideV3(baseV3()); // same inputs + userProfile
  assertEqual(v2.decision, v3.decision);
});
test('momentum ne modifie pas recommendedIntensity', function () {
  var v2 = decideV2(baseV2());
  var v3 = decideV3(baseV3());
  assertEqual(v2.recommendedIntensity, v3.recommendedIntensity);
});
test('momentum ne modifie pas recommendedSessionType', function () {
  var v2 = decideV2(baseV2());
  var v3 = decideV3(baseV3());
  assertEqual(v2.recommendedSessionType, v3.recommendedSessionType);
});
test('tous les champs V2 inchangés même avec userProfile (parity check)', function () {
  var v2 = decideV2(baseV2());
  var v3 = decideV3(baseV3());
  V2_FIELDS.forEach(function (f) {
    if (v2[f] !== v3[f]) throw new Error(f + ': V2=' + JSON.stringify(v2[f]) + ' V3=' + JSON.stringify(v3[f]));
  });
});
test('profil discipliné → momentum 8', function () {
  var out = decideV3(baseV2({
    userProfile: {
      trainingFrequencyLast7Days: 5,
      adherenceScore:             0.9,
      last7SessionsIntensity:     ['high', 'moderate', 'high']
    }
  }));
  assertEqual(out.momentumScore, 8);
});
test('profil inconstant → momentum 2', function () {
  var out = decideV3(baseV2({
    userProfile: {
      trainingFrequencyLast7Days: 0,
      adherenceScore:             0.3
    }
  }));
  assertEqual(out.momentumScore, 2);
});
test('haute fatigue → momentum 4', function () {
  var out = decideV3(baseV2({
    userProfile: { avgFatigueLast7Days: 4.5 }
  }));
  assertEqual(out.momentumScore, 4);
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
