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
var _detectProfileType               = DDEv3._detectProfileType;
var _applyAdaptiveCaps               = DDEv3._applyAdaptiveCaps;
var _buildCoachingMessage            = DDEv3._buildCoachingMessage;
var _buildHistoryInsights            = DDEv3._buildHistoryInsights;

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
test('profil de base (adherence=0.75, freq7=3, avgFat=2.5) → beginner (aucune règle forte)', function () {
  assertEqual(decideV3(baseV3()).profileType, 'beginner');
});
test('avec userProfile beginner → adaptationReason non-null (Beginner-friendly)', function () {
  // baseProfile = beginner, momentum = 6 → pas de cap de rang, mais profil beginner → reason toujours set
  var out = decideV3(baseV3());
  assert(out.adaptationReason !== null, 'beginner must always set adaptationReason');
  assertEqual(out.adaptationReason, 'Beginner-friendly intensity applied');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 6 : userProfile valide — décisions inchangées ────\n');
//
// Modules 2–4 actifs — la couche adaptative s'applique après les règles de sécurité V2.
// baseProfile() produit profil 'beginner' + momentum=6 → pas de changement de rang adaptatif
// → recommendedIntensity identique à V2 (seul adaptationReason diffère).

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
console.log('\n── Section 11 : _detectProfileType — règles unitaires ───────\n');

// ── Cas par défaut ────────────────────────────────────────────────────────────
test('null → beginner', function () {
  assertEqual(_detectProfileType(null), 'beginner');
});
test('undefined → beginner', function () {
  assertEqual(_detectProfileType(undefined), 'beginner');
});
test('{} vide → beginner (aucune règle évaluable)', function () {
  assertEqual(_detectProfileType({}), 'beginner');
});
test('momentumScore accepté sans crash (signature cohérente)', function () {
  assertEqual(_detectProfileType(null, 5), 'beginner');
  assertEqual(_detectProfileType({}, 8), 'beginner');
});

// ── overtraining ──────────────────────────────────────────────────────────────
test('overtraining : avgFat=4 + freq7=4 → overtraining', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 4, trainingFrequencyLast7Days: 4 }), 'overtraining');
});
test('overtraining : avgFat=5 + freq7=7 → overtraining', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 5, trainingFrequencyLast7Days: 7 }), 'overtraining');
});
test('overtraining : boundary avgFat=4.0 exact → overtraining', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 4.0, trainingFrequencyLast7Days: 4 }), 'overtraining');
});
test('overtraining : avgFat=3.9 → pas overtraining (boundary)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 3.9, trainingFrequencyLast7Days: 4 });
  assert(r !== 'overtraining', 'avgFat 3.9 must not trigger overtraining');
});
test('overtraining : freq7=3 → pas overtraining (boundary, besoin >=4)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 3 });
  assert(r !== 'overtraining', 'freq7=3 must not trigger overtraining');
});

// ── disciplined ───────────────────────────────────────────────────────────────
test('disciplined : adherence=0.8 + freq7=3 + avgFat=2 → disciplined', function () {
  assertEqual(_detectProfileType({ adherenceScore: 0.8, trainingFrequencyLast7Days: 3, avgFatigueLast7Days: 2 }), 'disciplined');
});
test('disciplined : boundary adherence=0.8 exact', function () {
  assertEqual(_detectProfileType({ adherenceScore: 0.8, trainingFrequencyLast7Days: 3, avgFatigueLast7Days: 1 }), 'disciplined');
  var r = _detectProfileType({ adherenceScore: 0.79, trainingFrequencyLast7Days: 3, avgFatigueLast7Days: 1 });
  assert(r !== 'disciplined', 'adherence=0.79 must not trigger disciplined');
});
test('disciplined : avgFat champ absent → pas disciplined (condition non vérifiable)', function () {
  var r = _detectProfileType({ adherenceScore: 0.9, trainingFrequencyLast7Days: 4 });
  assert(r !== 'disciplined', 'missing avgFat must block disciplined');
});

// ── inconsistent ──────────────────────────────────────────────────────────────
test('inconsistent : adherence=0.49 → inconsistent', function () {
  assertEqual(_detectProfileType({ adherenceScore: 0.49 }), 'inconsistent');
});
test('inconsistent : adherence=0.5 → pas inconsistent (boundary)', function () {
  var r = _detectProfileType({ adherenceScore: 0.5, trainingFrequencyLast7Days: 3, avgFatigueLast7Days: 2 });
  assert(r !== 'inconsistent');
});
test('inconsistent : freq7=1 → inconsistent', function () {
  assertEqual(_detectProfileType({ trainingFrequencyLast7Days: 1 }), 'inconsistent');
});
test('inconsistent : freq7=0 → inconsistent', function () {
  assertEqual(_detectProfileType({ trainingFrequencyLast7Days: 0 }), 'inconsistent');
});
test('inconsistent : freq7=2 → pas inconsistent (boundary)', function () {
  var r = _detectProfileType({ trainingFrequencyLast7Days: 2, avgFatigueLast7Days: 2, adherenceScore: 0.7 });
  assert(r !== 'inconsistent', 'freq7=2 must not trigger inconsistent');
});

// ── cautious ─────────────────────────────────────────────────────────────────
test('cautious : avgFat=3 + freq7=2 → cautious', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 3, trainingFrequencyLast7Days: 2 }), 'cautious');
});
test('cautious : boundary avgFat=3.0 exact', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 3.0, trainingFrequencyLast7Days: 2 }), 'cautious');
});
test('cautious : avgFat=2.9 → pas cautious (boundary)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 2.9, trainingFrequencyLast7Days: 2 });
  assert(r !== 'cautious', 'avgFat=2.9 must not trigger cautious');
});
test('cautious : freq7=3 → pas cautious (boundary, besoin <=2)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 3.5, trainingFrequencyLast7Days: 3 });
  assert(r !== 'cautious', 'freq7=3 must not trigger cautious');
});

// ── Priorités ─────────────────────────────────────────────────────────────────
test('priorité : overtraining > disciplined', function () {
  // avgFat=4.5(overtraining), freq7=5(overtraining + disciplined), adherence=0.9(disciplined)
  assertEqual(_detectProfileType({
    avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5, adherenceScore: 0.9
  }), 'overtraining');
});
test('priorité : overtraining > inconsistent', function () {
  // avgFat=4, freq7=4 (overtraining) ; adherence=0.3 (inconsistent)
  assertEqual(_detectProfileType({
    avgFatigueLast7Days: 4, trainingFrequencyLast7Days: 4, adherenceScore: 0.3
  }), 'overtraining');
});
test('priorité : inconsistent > cautious', function () {
  // adherence=0.3(inconsistent) + avgFat=3.5(cautious) + freq7=1(inconsistent+cautious)
  assertEqual(_detectProfileType({
    adherenceScore: 0.3, avgFatigueLast7Days: 3.5, trainingFrequencyLast7Days: 1
  }), 'inconsistent');
});
test('priorité : inconsistent > disciplined (adherence<0.5 même si freq haute)', function () {
  // adherence=0.3(inconsistent) — freq7=5 et avgFat=2 satisferaient disciplined mais l'adherence casse
  assertEqual(_detectProfileType({
    adherenceScore: 0.3, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2
  }), 'inconsistent');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 12 : Intégration — profileType dans le moteur ────\n');

var V2_FIELDS_ALL = ['decision','recommendedIntensity','recommendedSessionType',
                     'fatigueEffective','priorityApplied','progressionTriggered','reason'];

test('sans userProfile → profileType = "beginner"', function () {
  assertEqual(decideV3(baseV2()).profileType, 'beginner');
});
test('overtraining profile → moteur retourne "overtraining"', function () {
  var out = decideV3(baseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  }));
  assertEqual(out.profileType, 'overtraining');
});
test('disciplined profile → moteur retourne "disciplined"', function () {
  var out = decideV3(baseV2({
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  }));
  assertEqual(out.profileType, 'disciplined');
});
test('inconsistent profile → moteur retourne "inconsistent"', function () {
  var out = decideV3(baseV2({
    userProfile: { adherenceScore: 0.2 }
  }));
  assertEqual(out.profileType, 'inconsistent');
});
test('cautious profile → moteur retourne "cautious"', function () {
  var out = decideV3(baseV2({
    userProfile: { avgFatigueLast7Days: 3.5, trainingFrequencyLast7Days: 2 }
  }));
  assertEqual(out.profileType, 'cautious');
});
test('profileType ne modifie pas decision', function () {
  var v2  = decideV2(baseV2());
  var v3o = decideV3(baseV2({ userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 } }));
  assertEqual(v2.decision, v3o.decision);
});
test('profileType ne modifie pas recommendedIntensity', function () {
  var v2  = decideV2(baseV2());
  var v3d = decideV3(baseV2({ userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 } }));
  assertEqual(v2.recommendedIntensity, v3d.recommendedIntensity);
});
test('overtraining réduit intensity/sessionType — decision/fatigueEff/priority/progression inchangés', function () {
  var v2 = decideV2(baseV2());
  var v3 = decideV3(baseV2({ userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 } }));
  // Module 4 réduit le plafond → intensity et sessionType peuvent différer
  assert(v3.recommendedIntensity !== 'high', 'overtraining must not produce high');
  // Champs non-intensité restent identiques à V2
  ['decision', 'fatigueEffective', 'priorityApplied', 'progressionTriggered'].forEach(function (f) {
    if (v2[f] !== v3[f]) throw new Error(f + ': V2=' + JSON.stringify(v2[f]) + ' V3=' + JSON.stringify(v3[f]));
  });
});
test('momentumScore inchangé par Module 3', function () {
  // Same userProfile before/after Module 3 change → same momentumScore
  var out = decideV3(baseV2({ userProfile: { trainingFrequencyLast7Days: 5, adherenceScore: 0.9 } }));
  // freq7=5(+1) + adherence=0.9(+1) = 5+2 = 7
  assertEqual(out.momentumScore, 7);
});
test('overtraining → adaptationReason non-null (Module 4 actif)', function () {
  var out = decideV3(baseV2({ userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 } }));
  assert(out.adaptationReason !== null, 'overtraining must set adaptationReason');
  assert(typeof out.adaptationReason === 'string', 'adaptationReason must be a string');
});
test('profileType valide dans l\'ensemble attendu', function () {
  var valid = ['beginner','disciplined','inconsistent','overtraining','cautious'];
  [null, baseProfile(), { adherenceScore: 0.2 }, { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }].forEach(function (up) {
    var out = decideV3(baseV2({ userProfile: up || undefined }));
    assert(valid.indexOf(out.profileType) !== -1, 'invalid profileType: ' + out.profileType);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 13 : _applyAdaptiveCaps — règles unitaires ───────\n');

// ── Pas de profil / décision rest ────────────────────────────────────────────
test('hasProfile=false → maxRank inchangé, reason null', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'overtraining', 5, false, 'train');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, null);
});
test('decision=rest + profil → reason = "Rest day — recovery prioritized"', function () {
  var r = _applyAdaptiveCaps(2, 'safety', 'overtraining', 5, true, 'rest');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, 'Rest day — recovery prioritized');
});

// ── overtraining ──────────────────────────────────────────────────────────────
test('overtraining : maxRank=2 → réduit à 1 (high→moderate)', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'overtraining', 5, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Intensity reduced due to overtraining risk');
});
test('overtraining : maxRank=1 → réduit à 0 (moderate→low)', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'overtraining', 5, true, 'train');
  assertEqual(r.maxRank, 0);
  assert(r.adaptationReason !== null);
});
test('overtraining : maxRank=0 → inchangé (clampe à 0), reason non-null', function () {
  var r = _applyAdaptiveCaps(0, 'goal_alignment', 'overtraining', 5, true, 'train');
  assertEqual(r.maxRank, 0);
  assertEqual(r.adaptationReason, 'Intensity reduced due to overtraining risk');
});
test('overtraining + safety priority → réduction toujours appliquée', function () {
  var r = _applyAdaptiveCaps(2, 'safety', 'overtraining', 5, true, 'train');
  assertEqual(r.maxRank, 1);
  assert(r.adaptationReason !== null);
});
test('overtraining : résultat jamais high (maxRank ≤ 1)', function () {
  [0, 1, 2].forEach(function (rank) {
    var r = _applyAdaptiveCaps(rank, 'goal_alignment', 'overtraining', 5, true, 'train');
    assert(r.maxRank <= 1, 'overtraining must never allow high, got rank=' + r.maxRank + ' from input=' + rank);
  });
});

// ── inconsistent ──────────────────────────────────────────────────────────────
test('inconsistent : maxRank=2 → cap à 1 (high→moderate)', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'inconsistent', 3, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Conservative intensity due to inconsistent training pattern');
});
test('inconsistent : maxRank=1 → inchangé, reason non-null (profil actif)', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'inconsistent', 3, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Conservative intensity due to inconsistent training pattern');
});
test('inconsistent : maxRank=0 → inchangé, reason non-null (profil actif)', function () {
  var r = _applyAdaptiveCaps(0, 'goal_alignment', 'inconsistent', 3, true, 'train');
  assertEqual(r.maxRank, 0);
  assertEqual(r.adaptationReason, 'Conservative intensity due to inconsistent training pattern');
});

// ── cautious ─────────────────────────────────────────────────────────────────
test('cautious : maxRank=2 → cap à 1 (high→moderate)', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'cautious', 5, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Moderate intensity for safe progression');
});
test('cautious : maxRank=1 → inchangé, reason non-null (profil actif)', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'cautious', 5, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Moderate intensity for safe progression');
});

// ── disciplined ───────────────────────────────────────────────────────────────
test('disciplined : momentum=7, rank=1, !safety → boost à 2', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'disciplined', 7, true, 'train');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, 'Intensity increased due to strong momentum');
});
test('disciplined : momentum=7, rank=2, !safety → inchangé (déjà high), reason null', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'disciplined', 7, true, 'train');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, null);
});
test('disciplined : momentum=6 → pas de boost (seuil 7)', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'disciplined', 6, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, null);
});
test('disciplined : momentum=7, safety priority → boost interdit', function () {
  var r = _applyAdaptiveCaps(1, 'safety', 'disciplined', 7, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, null);
});
test('disciplined : momentum=7, rank=0 → pas de boost (rank < 1)', function () {
  var r = _applyAdaptiveCaps(0, 'goal_alignment', 'disciplined', 7, true, 'train');
  assertEqual(r.maxRank, 0);
  assertEqual(r.adaptationReason, null);
});
test('disciplined : momentumScore=null → pas de boost', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'disciplined', null, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, null);
});

// ── beginner ─────────────────────────────────────────────────────────────────
test('beginner : momentum=3, rank=2 → cap à 1', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', 3, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});
test('beginner : momentum=4 → pas de cap (boundary), reason non-null', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', 4, true, 'train');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});
test('beginner : momentum=3, rank=1 → pas de cap (rank pas > 1), reason non-null', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'beginner', 3, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});
test('beginner : momentum=null → pas de cap, reason non-null', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', null, true, 'train');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 14 : Intégration — Module 4 adaptive caps ────────\n');

// Scénario de base : lastSessionDate 4 jours ago (Règle A inactive), fatigueLevel 1 → V2 high
function highBaseV2(overrides) {
  return Object.assign(baseV2({
    fatigueLevel:           1,
    last3SessionsIntensity: ['high'],
    lastSessionDate:        daysAgo(4) // daysSince=4 → Règle A inactive (besoin <3)
  }), overrides || {});
}

// ── Test 1 : sans userProfile → parité Module 3 ───────────────────────────────
test('sans userProfile → adaptationReason=null, intensity = V2', function () {
  var v2 = decideV2(highBaseV2());
  var v3 = decideV3(highBaseV2());
  assertEqual(v3.adaptationReason, null);
  assertEqual(v3.recommendedIntensity, v2.recommendedIntensity);
});

// ── Test 2 : overtraining réduit intensity ────────────────────────────────────
test('overtraining : intensity réduite vs V2 (high→moderate)', function () {
  var v2 = decideV2(highBaseV2());
  assertEqual(v2.recommendedIntensity, 'high');
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  }));
  assertEqual(v3.recommendedIntensity, 'moderate');
});

// ── Test 3 : overtraining jamais high ────────────────────────────────────────
test('overtraining : recommendedIntensity jamais "high"', function () {
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  }));
  assert(v3.recommendedIntensity !== 'high', 'overtraining must not produce high');
});

// ── Test 4 : overtraining adaptationReason non-null ──────────────────────────
test('overtraining → adaptationReason = "Intensity reduced due to overtraining risk"', function () {
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  }));
  assertEqual(v3.adaptationReason, 'Intensity reduced due to overtraining risk');
});

// ── Test 5 : inconsistent caps high→moderate ──────────────────────────────────
test('inconsistent : high cappé à moderate', function () {
  var v2 = decideV2(highBaseV2());
  assertEqual(v2.recommendedIntensity, 'high');
  var v3 = decideV3(highBaseV2({ userProfile: { adherenceScore: 0.3 } }));
  assertEqual(v3.recommendedIntensity, 'moderate');
});

// ── Test 6 : inconsistent adaptationReason ────────────────────────────────────
test('inconsistent → adaptationReason = "Conservative intensity due to inconsistent training pattern"', function () {
  var v3 = decideV3(highBaseV2({ userProfile: { adherenceScore: 0.3 } }));
  assertEqual(v3.adaptationReason, 'Conservative intensity due to inconsistent training pattern');
});

// ── Test 7 : cautious caps high→moderate ──────────────────────────────────────
test('cautious : high cappé à moderate', function () {
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 3.5, trainingFrequencyLast7Days: 2 }
  }));
  assertEqual(v3.recommendedIntensity, 'moderate');
  assert(v3.adaptationReason !== null);
});

// ── Test 8 : disciplined + momentum≥7 débloque high en phase taper ───────────
test('disciplined + momentum=7 : moderate (taper) → high débloqué', function () {
  // Taper donne goal_alignment (pas safety) → boost autorisé
  var v2inp = baseV2({
    fatigueLevel:           1,
    last3SessionsIntensity: ['low'],
    lastSessionDate:        daysAgo(2),
    trainingPhase:          'taper'
  });
  var v2 = decideV2(v2inp);
  assertEqual(v2.recommendedIntensity, 'moderate'); // taper cap at moderate
  var v3 = decideV3(Object.assign({}, v2inp, {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
    // momentum: 5 + 1(freq>=3) + 1(adherence>=0.8) = 7 ≥ 7 → boost
  }));
  assertEqual(v3.recommendedIntensity, 'high');
  assert(v3.adaptationReason !== null);
});

// ── Test 9 : disciplined ne peut pas lever safety ─────────────────────────────
test('disciplined + safety priority → pas de boost (Règle A post-high)', function () {
  // Règle A : lastIntensity=high, daysSince=1 → priority=safety, maxRank=1
  var inp = baseV2({
    fatigueLevel:           1,
    last3SessionsIntensity: ['high'],
    lastSessionDate:        daysAgo(1),
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  });
  var v2 = decideV2(Object.assign({}, inp, { userProfile: undefined }));
  assertEqual(v2.priorityApplied, 'safety');
  var v3 = decideV3(inp);
  assertEqual(v3.recommendedIntensity, 'moderate'); // pas de boost
  assertEqual(v3.adaptationReason, null);
});

// ── Test 10 : beginner + low momentum (test direct _applyAdaptiveCaps) ────────
test('beginner + momentum < 4 : rank=2 → cap à 1 (via _applyAdaptiveCaps)', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', 3, true, 'train');
  assertEqual(r.maxRank, 1);
  assert(r.adaptationReason !== null);
});

// ── Test 11 : sessionType cohérent avec l'intensité finale ────────────────────
test('overtraining fat_loss : high→moderate, sessionType=cardio (pas hiit)', function () {
  var v3 = decideV3(Object.assign(highBaseV2({ goal: 'fat_loss' }), {
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  }));
  assertEqual(v3.recommendedIntensity,   'moderate');
  assertEqual(v3.recommendedSessionType, 'cardio');
});
test('disciplined débloque high muscle_gain : sessionType=strength', function () {
  var v3 = decideV3(Object.assign(baseV2({
    fatigueLevel:           1,
    last3SessionsIntensity: ['low'],
    lastSessionDate:        daysAgo(2),
    trainingPhase:          'taper',
    goal:                   'muscle_gain'
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  }));
  assertEqual(v3.recommendedIntensity,   'high');
  assertEqual(v3.recommendedSessionType, 'strength');
});

// ── Test 12 : adaptationReason null quand pas de changement ───────────────────
test('disciplined + momentum=6 → pas de boost, adaptationReason=null', function () {
  // momentum=6 < 7 → no boost
  var v3 = decideV3(highBaseV2({
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: [] }
    // freq(+1) + adherence(+1) = 7... wait, with last7=[] no high → no +1 → 5+1+1=7
    // Hmm, that's 7. Let me use adherence=0.85, freq7=3 → 5+1+1=7
    // Need momentum=6: freq=3(+1) only → 6; adherence<0.8 so no adherence bonus → 6
  }));
  // Recalc: freq7=5(+1), adherence=0.9(+1), last7=[] (no high) → 5+2=7 → boost! Wrong.
  // Use explicit momentum=6 via direct call instead:
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'disciplined', 6, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, null);
});
test('beginner + momentum=5 → pas de cap, adaptationReason="Beginner-friendly intensity applied"', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', 5, true, 'train');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});
test('sans userProfile → adaptationReason=null', function () {
  assertEqual(decideV3(baseV2()).adaptationReason, null);
});

// ── Test 14 : champs V2 stables (decision/fatigue/priority/progression) ────────
test('overtraining : decision/fatigueEffective/priorityApplied/progressionTriggered = V2', function () {
  var v2 = decideV2(highBaseV2());
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  }));
  ['decision', 'fatigueEffective', 'priorityApplied', 'progressionTriggered'].forEach(function (f) {
    if (v2[f] !== v3[f]) throw new Error(f + ': V2=' + JSON.stringify(v2[f]) + ' V3=' + JSON.stringify(v3[f]));
  });
});
test('disciplined boost : decision/fatigueEffective/priorityApplied/progressionTriggered = V2', function () {
  var v2inp = baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2), trainingPhase: 'taper' });
  var v2 = decideV2(v2inp);
  var v3 = decideV3(Object.assign({}, v2inp, {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  }));
  ['decision', 'fatigueEffective', 'priorityApplied', 'progressionTriggered'].forEach(function (f) {
    if (v2[f] !== v3[f]) throw new Error(f + ': V2=' + JSON.stringify(v2[f]) + ' V3=' + JSON.stringify(v3[f]));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 15 : Couverture complète — warnings résiduels ────\n');

// ── Test 1 : rest + profile → adaptationReason = "Rest day — recovery prioritized" ──
test('rest + profil overtraining → adaptationReason="Rest day — recovery prioritized"', function () {
  // fatigueLevel=5 → effectiveFatigue=5 → decision='rest'
  var inp = baseV2({
    fatigueLevel: 5,
    last3SessionsIntensity: ['high'],
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  });
  var out = decideV3(inp);
  assertEqual(out.decision,             'rest');
  assertEqual(out.recommendedIntensity, 'low');
  assertEqual(out.priorityApplied,      'safety');
  assertEqual(out.adaptationReason,     'Rest day — recovery prioritized');
});
test('rest + profil inconsistent → adaptationReason="Rest day — recovery prioritized"', function () {
  var inp = baseV2({
    fatigueLevel: 5,
    last3SessionsIntensity: ['moderate'],
    userProfile: { adherenceScore: 0.3 }
  });
  var out = decideV3(inp);
  assertEqual(out.decision,         'rest');
  assertEqual(out.adaptationReason, 'Rest day — recovery prioritized');
});
test('rest sans userProfile → adaptationReason=null', function () {
  var out = decideV3(baseV2({ fatigueLevel: 5, last3SessionsIntensity: ['moderate'] }));
  assertEqual(out.decision,         'rest');
  assertEqual(out.adaptationReason, null);
});

// ── Test 2 : overtraining + progression triggered → overtraining wins ─────────
test('overtraining + progression triggered → intensity=moderate, progression_logic priority', function () {
  // progression: 2 moderate → triggered, maxRank=2 (override soft cap)
  // overtraining: reduces maxRank 2→1
  var inp = baseV2({
    fatigueLevel:           3,
    last3SessionsIntensity: ['moderate', 'moderate'],
    lastSessionDate:        daysAgo(1),
    userProfile:            { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 }
  });
  var out = decideV3(inp);
  assertEqual(out.decision,             'train');
  assertEqual(out.recommendedIntensity, 'moderate');
  assertEqual(out.priorityApplied,      'progression_logic');
  assertEqual(out.adaptationReason,     'Intensity reduced due to overtraining risk');
});

// ── Test 3 : disciplined + high momentum → intensity increases ────────────────
test('disciplined + momentum=7 (taper) → intensity=high, adaptationReason set', function () {
  var inp = Object.assign(baseV2({
    fatigueLevel:           1,
    last3SessionsIntensity: ['low'],
    lastSessionDate:        daysAgo(2),
    trainingPhase:          'taper'
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  });
  var out = decideV3(inp);
  assertEqual(out.decision,             'train');
  assertEqual(out.recommendedIntensity, 'high');
  assertEqual(out.priorityApplied,      'goal_alignment');
  assertEqual(out.adaptationReason,     'Intensity increased due to strong momentum');
});

// ── Test 4 : beginner + low momentum → cap applies, adaptationReason set ──────
test('beginner + momentum=3, rank=2 → cap à moderate, Beginner-friendly reason', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', 3, true, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});
test('beginner + momentum=6, rank=2 → pas de cap, reason toujours set', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', 6, true, 'train');
  assertEqual(r.maxRank, 2);
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});

// ── Test 5 : missing fields → no crash, stable output ────────────────────────
test('userProfile vide {} → no crash, profileType=beginner, adaptationReason set', function () {
  var out = decideV3(baseV2({ userProfile: {} }));
  assertEqual(out.decision,         'train');
  assert(out.recommendedIntensity   !== undefined, 'missing recommendedIntensity');
  assertEqual(out.profileType,      'beginner');
  assertEqual(out.adaptationReason, 'Beginner-friendly intensity applied');
});
test('userProfile partiel {adherenceScore:0.7} → no crash, stable output', function () {
  var out = decideV3(baseV2({ userProfile: { adherenceScore: 0.7 } }));
  assert(out.recommendedIntensity !== undefined, 'missing recommendedIntensity');
  assert(out.priorityApplied      !== undefined, 'missing priorityApplied');
  assert(out.adaptationReason     !== undefined, 'missing adaptationReason');
});
test('userProfile {trainingFrequencyLast7Days:3} → no crash', function () {
  var out = decideV3(baseV2({ userProfile: { trainingFrequencyLast7Days: 3 } }));
  assert(out.decision !== undefined);
});

// ── Test 6 : adaptationReason exact strings (critical) ───────────────────────
test('strings exactes : overtraining', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'overtraining', 5, true, 'train');
  assertEqual(r.adaptationReason, 'Intensity reduced due to overtraining risk');
});
test('strings exactes : inconsistent', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'inconsistent', 3, true, 'train');
  assertEqual(r.adaptationReason, 'Conservative intensity due to inconsistent training pattern');
});
test('strings exactes : cautious', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'cautious', 5, true, 'train');
  assertEqual(r.adaptationReason, 'Moderate intensity for safe progression');
});
test('strings exactes : disciplined + momentum=7 boost', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'disciplined', 7, true, 'train');
  assertEqual(r.adaptationReason, 'Intensity increased due to strong momentum');
});
test('strings exactes : disciplined + safety blocked → null', function () {
  var r = _applyAdaptiveCaps(1, 'safety', 'disciplined', 7, true, 'train');
  assertEqual(r.adaptationReason, null);
});
test('strings exactes : beginner', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'beginner', 5, true, 'train');
  assertEqual(r.adaptationReason, 'Beginner-friendly intensity applied');
});
test('strings exactes : rest + profil', function () {
  var r = _applyAdaptiveCaps(2, 'safety', 'overtraining', 5, true, 'rest');
  assertEqual(r.adaptationReason, 'Rest day — recovery prioritized');
});
test('strings exactes : no userProfile → null', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'overtraining', 5, false, 'train');
  assertEqual(r.adaptationReason, null);
});

// ── Guards : clamp, missing fields, no double-stack ──────────────────────────
test('momentumScore clamp : toujours 0–10', function () {
  // Direct score computation uses clamp
  var score = _computeMomentumScore({ trainingFrequencyLast7Days: 7, adherenceScore: 1.0,
    last7SessionsIntensity: ['high','high','high'] });
  assert(score >= 0 && score <= 10, 'out of range: ' + score);
});
test('missing userProfile fields → no crash, momentum not penalized', function () {
  // Only avgFatigueLast7Days provided: no freq penalty/bonus, no adherence penalty
  var score = _computeMomentumScore({ avgFatigueLast7Days: 2 });
  assertEqual(score, 5); // baseline only — no bonuses, no penalties (avgFat < 4)
});
test('progression + adaptive : plafond max = high (pas de double-stack)', function () {
  // disciplined boost: min(rank+1, 2) → jamais > 2 (high)
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'disciplined', 7, true, 'train');
  assertEqual(r.maxRank, 2); // déjà high → boost n'empile pas au-delà
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 16 — Module 5 : _buildCoachingMessage
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 16 — Module 5 : _buildCoachingMessage');

var VALID_TONES = ['reassuring', 'motivating', 'protective', 'performance'];
var BANNED_PHRASES = ['crush it', 'beast mode', 'no pain no gain', 'grind', 'hustle',
  'warrior', 'epic', 'absolutely', 'definitely', 'great job', 'amazing'];

function assertHasCoachingFields(result, label) {
  ['headline', 'shortMessage', 'coachingExplanation', 'userAction', 'tone'].forEach(function (k) {
    assert(Object.prototype.hasOwnProperty.call(result, k), label + ': missing field ' + k);
    assert(result[k] !== undefined && result[k] !== null && result[k] !== '',
      label + ': field ' + k + ' is empty');
  });
}

function assertNoBannedPhrases(result, label) {
  var combined = [result.headline, result.shortMessage, result.coachingExplanation,
    result.userAction].join(' ').toLowerCase();
  BANNED_PHRASES.forEach(function (phrase) {
    assert(combined.indexOf(phrase) === -1, label + ': banned phrase found: "' + phrase + '"');
  });
}

// 1. Rest day → protective tone, all 5 fields present, no banned phrases
test('rest day : tone protective, tous les champs présents', function () {
  var r = _buildCoachingMessage({ decision: 'rest', fatigueEffective: 5,
    priorityApplied: 'goal_alignment', momentumScore: 5, profileType: 'disciplined' });
  assertHasCoachingFields(r, 'rest/fatigue5');
  assertEqual(r.tone, 'protective');
  assertNoBannedPhrases(r, 'rest/fatigue5');
});

// 2. Rest day variants : fatigue branching (≥5, ≥4, <4)
test('rest day : fatigue >= 5 → explication fatigue élevée', function () {
  var r = _buildCoachingMessage({ decision: 'rest', fatigueEffective: 5 });
  assert(r.coachingExplanation.indexOf('élevé') !== -1, 'should mention fatigue élevée');
});
test('rest day : fatigue = 4 → explication seuil sécurisé', function () {
  var r = _buildCoachingMessage({ decision: 'rest', fatigueEffective: 4 });
  assert(r.coachingExplanation.indexOf('seuil') !== -1 || r.coachingExplanation.indexOf('sécurisé') !== -1,
    'should mention seuil or sécurisé');
});
test('rest day : fatigue < 4 → explication récupération stratégique', function () {
  var r = _buildCoachingMessage({ decision: 'rest', fatigueEffective: 2 });
  assert(r.coachingExplanation.indexOf('stratégique') !== -1 ||
    r.coachingExplanation.indexOf('récupération') !== -1, 'should mention strategic recovery');
});

// 3. Overtraining → recovery-focused, protective
test('overtraining : tone protective', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'overtraining',
    recommendedIntensity: 'moderate', recommendedSessionType: 'cardio',
    momentumScore: 5, priorityApplied: 'goal_alignment' });
  assertEqual(r.tone, 'protective');
  assertHasCoachingFields(r, 'overtraining');
  assertNoBannedPhrases(r, 'overtraining');
});
test('overtraining : contenu axé récupération / adaptation', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'overtraining',
    recommendedIntensity: 'moderate', recommendedSessionType: 'cardio',
    momentumScore: 5, priorityApplied: 'goal_alignment' });
  var combined = r.coachingExplanation + ' ' + r.headline;
  assert(combined.indexOf('protéger') !== -1 || combined.indexOf('protég') !== -1 ||
    combined.indexOf('adapt') !== -1, 'should mention protection/adaptation');
});

// 4. Inconsistent profile → reassuring tone, restart-friendly
test('inconsistent : tone reassuring', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'inconsistent',
    recommendedIntensity: 'low', recommendedSessionType: 'cardio',
    momentumScore: 3, priorityApplied: 'goal_alignment' });
  assertEqual(r.tone, 'reassuring');
  assertHasCoachingFields(r, 'inconsistent');
  assertNoBannedPhrases(r, 'inconsistent');
});
test('inconsistent : message de relance sans pression de performance', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'inconsistent',
    recommendedIntensity: 'low', recommendedSessionType: 'cardio',
    momentumScore: 3, priorityApplied: 'goal_alignment' });
  var combined = (r.headline + ' ' + r.shortMessage + ' ' + r.coachingExplanation).toLowerCase();
  assert(combined.indexOf('régularité') !== -1 || combined.indexOf('reprise') !== -1 ||
    combined.indexOf('dynamique') !== -1, 'should mention regularity/restart');
});

// 5. Cautious profile → protective tone
test('cautious : tone protective', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'cautious',
    recommendedIntensity: 'moderate', recommendedSessionType: 'strength',
    momentumScore: 5, priorityApplied: 'goal_alignment' });
  assertEqual(r.tone, 'protective');
  assertHasCoachingFields(r, 'cautious');
  assertNoBannedPhrases(r, 'cautious');
});

// 6. Disciplined + high momentum → performance tone
test('disciplined + momentum >= 7 : tone performance', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'disciplined',
    recommendedIntensity: 'high', recommendedSessionType: 'strength',
    momentumScore: 8, priorityApplied: 'goal_alignment' });
  assertEqual(r.tone, 'performance');
  assertHasCoachingFields(r, 'disciplined/momentum8');
  assertNoBannedPhrases(r, 'disciplined/momentum8');
});
test('disciplined + momentum < 7 : tone performance (séance solide)', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'disciplined',
    recommendedIntensity: 'moderate', recommendedSessionType: 'strength',
    momentumScore: 5, priorityApplied: 'goal_alignment' });
  assertEqual(r.tone, 'performance');
  assertHasCoachingFields(r, 'disciplined/momentum5');
});

// 7. Low momentum → no blame, reassuring
test('momentum <= 3 : tone reassuring, sans culpabilisation', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'beginner',
    recommendedIntensity: 'low', recommendedSessionType: 'cardio',
    momentumScore: 2, priorityApplied: 'goal_alignment' });
  assertEqual(r.tone, 'reassuring');
  assertHasCoachingFields(r, 'low-momentum');
  assertNoBannedPhrases(r, 'low-momentum');
  var combined = (r.coachingExplanation + ' ' + r.headline + ' ' + r.shortMessage).toLowerCase();
  assert(combined.indexOf('faute') === -1 && combined.indexOf('honte') === -1,
    'should not blame user');
});

// 8. High momentum (non-disciplined) → motivating tone
test('momentum >= 7 (non disciplined) : tone motivating', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'beginner',
    recommendedIntensity: 'moderate', recommendedSessionType: 'cardio',
    momentumScore: 9, priorityApplied: 'goal_alignment' });
  assertEqual(r.tone, 'motivating');
  assertHasCoachingFields(r, 'high-momentum/non-disciplined');
  assertNoBannedPhrases(r, 'high-momentum/non-disciplined');
});

// 9. Safety priority → protective tone, never aggressive
test('safety priority : tone protective', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'beginner',
    recommendedIntensity: 'moderate', recommendedSessionType: 'cardio',
    momentumScore: 5, priorityApplied: 'safety' });
  assertEqual(r.tone, 'protective');
  assertHasCoachingFields(r, 'safety-priority');
  assertNoBannedPhrases(r, 'safety-priority');
});

// 10. Missing optional fields → no crash, all 5 fields present
test('champs optionnels manquants : pas de crash', function () {
  var r = _buildCoachingMessage({});
  assertHasCoachingFields(r, 'empty-input');
  assert(VALID_TONES.indexOf(r.tone) !== -1, 'tone must be valid enum: ' + r.tone);
});
test('input undefined → pas de crash', function () {
  var r = _buildCoachingMessage(undefined);
  assertHasCoachingFields(r, 'undefined-input');
});
test('input null → pas de crash', function () {
  var r = _buildCoachingMessage(null);
  assertHasCoachingFields(r, 'null-input');
});

// 11. Output always has all 5 fields with valid tone enum
test('tone toujours dans l\'enum valide (rest)', function () {
  var r = _buildCoachingMessage({ decision: 'rest', fatigueEffective: 3 });
  assert(VALID_TONES.indexOf(r.tone) !== -1, 'invalid tone: ' + r.tone);
});
test('tone toujours dans l\'enum valide (default path)', function () {
  var r = _buildCoachingMessage({ decision: 'train', momentumScore: 5,
    profileType: 'beginner', priorityApplied: 'goal_alignment' });
  assert(VALID_TONES.indexOf(r.tone) !== -1, 'invalid tone: ' + r.tone);
});

// 12. V3 engine outputs remain unchanged — _buildCoachingMessage does not modify engineOutput
test('V3 outputs inchangés : _buildCoachingMessage est une fonction pure', function () {
  var engineOut = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, sleepQuality: 4, trainingFrequency: 5,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate', 'moderate', 'high'],
    userProfile: { trainingFrequencyLast7Days: 5, adherenceScore: 0.85,
      avgFatigueLast7Days: 2, last7SessionsIntensity: ['moderate','high','moderate','high','moderate','high','moderate'],
      lastSessionTypeHistory: ['strength','cardio','strength'] }
  });
  var before = JSON.stringify(engineOut);
  _buildCoachingMessage(engineOut);
  var after = JSON.stringify(engineOut);
  assertEqual(before, after, 'engineOutput was mutated by _buildCoachingMessage');
});
test('V3 champs décision inchangés après coaching message', function () {
  var engineOut = decideV3({
    goal: 'fat_loss', fatigueLevel: 3, sleepQuality: 3, trainingFrequency: 3,
    lastSessionDate: '2026-04-27', last3SessionsIntensity: ['low', 'moderate'],
    userProfile: { trainingFrequencyLast7Days: 3, adherenceScore: 0.6,
      avgFatigueLast7Days: 3, last7SessionsIntensity: ['low','moderate','low'],
      lastSessionTypeHistory: ['cardio'] }
  });
  var decisionBefore  = engineOut.decision;
  var intensityBefore = engineOut.recommendedIntensity;
  var priorityBefore  = engineOut.priorityApplied;
  _buildCoachingMessage(engineOut);
  assertEqual(engineOut.decision,             decisionBefore,  'decision mutated');
  assertEqual(engineOut.recommendedIntensity, intensityBefore, 'recommendedIntensity mutated');
  assertEqual(engineOut.priorityApplied,      priorityBefore,  'priorityApplied mutated');
});

// 13. sessionType label mapping
test('sessionType labels : cardio → "cardio" dans userAction', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'inconsistent',
    recommendedSessionType: 'cardio', momentumScore: 3, priorityApplied: 'goal_alignment' });
  assert(r.userAction.indexOf('cardio') !== -1, 'should include session type label');
});
test('sessionType labels : strength → "musculation" dans userAction', function () {
  var r = _buildCoachingMessage({ decision: 'train', profileType: 'inconsistent',
    recommendedSessionType: 'strength', momentumScore: 3, priorityApplied: 'goal_alignment' });
  assert(r.userAction.indexOf('musculation') !== -1, 'should include musculation label');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 17 — Module 6 : _buildHistoryInsights
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 17 — Module 6 : _buildHistoryInsights');

// ── 1. Missing / null userHistory → safe null output ────────────────────────
test('null userHistory → all nulls', function () {
  var r = _buildHistoryInsights(null);
  assertEqual(r.streak, null);
  assertEqual(r.consistencyScore, null);
  assertEqual(r.momentumTrend, null);
  assertEqual(r.weeklySummary, null);
});
test('undefined userHistory → all nulls', function () {
  var r = _buildHistoryInsights(undefined);
  assertEqual(r.streak, null);
  assertEqual(r.consistencyScore, null);
  assertEqual(r.momentumTrend, null);
  assertEqual(r.weeklySummary, null);
});
test('non-object userHistory → all nulls', function () {
  var r = _buildHistoryInsights('bad');
  assertEqual(r.streak, null); assertEqual(r.consistencyScore, null);
});
test('empty object {} → streak null (no decisions), momentumTrend null (no momentum)', function () {
  var r = _buildHistoryInsights({});
  assertEqual(r.streak, null);
  assertEqual(r.consistencyScore, null);
  assertEqual(r.momentumTrend, null);
});

// ── 2. Streak calculation ────────────────────────────────────────────────────
test('streak : all train → streak = length', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train','train','train','train','train','train','train'] });
  assertEqual(r.streak, 7);
});
test('streak : trailing rest breaks count', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train','train','rest','train'] });
  assertEqual(r.streak, 1);
});
test('streak : spec example ["train","train","rest","train"] → 1', function () {
  // most recent = last element = "train", but the one before is "rest" → streak = 1
  var r = _buildHistoryInsights({ last7Decisions: ['train','train','rest','train'] });
  assertEqual(r.streak, 1);
});
test('streak : last 2 train → streak = 2', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','rest','train','train'] });
  assertEqual(r.streak, 2);
});
test('streak : last is rest → streak = 0', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train','train','train','rest'] });
  assertEqual(r.streak, 0);
});
test('streak : empty array → streak = 0', function () {
  var r = _buildHistoryInsights({ last7Decisions: [] });
  assertEqual(r.streak, 0);
});
test('streak : single train → streak = 1', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train'] });
  assertEqual(r.streak, 1);
});
test('streak : single rest → streak = 0', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest'] });
  assertEqual(r.streak, 0);
});

// ── 3. Consistency score mapping ─────────────────────────────────────────────
test('consistencyScore : 0 train → 2', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','rest','rest','rest','rest','rest'] });
  assertEqual(r.consistencyScore, 2);
});
test('consistencyScore : 1 train → 2', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','rest','rest','rest','rest','train'] });
  assertEqual(r.consistencyScore, 2);
});
test('consistencyScore : 2 train → 4', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','rest','rest','rest','train','train'] });
  assertEqual(r.consistencyScore, 4);
});
test('consistencyScore : 3 train → 4', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','rest','rest','train','train','train'] });
  assertEqual(r.consistencyScore, 4);
});
test('consistencyScore : 4 train → 6', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','rest','train','train','train','train'] });
  assertEqual(r.consistencyScore, 6);
});
test('consistencyScore : 5 train → 6', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','train','train','train','train','train'] });
  assertEqual(r.consistencyScore, 6);
});
test('consistencyScore : 6 train → 8', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','train','train','train','train','train','train'] });
  assertEqual(r.consistencyScore, 8);
});
test('consistencyScore : 7 train → 10', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train','train','train','train','train','train','train'] });
  assertEqual(r.consistencyScore, 10);
});

// ── 4. Momentum trend ────────────────────────────────────────────────────────
test('momentumTrend : last >= avg+1 → "up"', function () {
  // avg([5,5,5]) = 5, last = 7 → 7 >= 5+1 → up
  var r = _buildHistoryInsights({ last7Momentum: [5, 5, 5, 7] });
  assertEqual(r.momentumTrend, 'up');
});
test('momentumTrend : last <= avg-1 → "down"', function () {
  // avg([7,7,7]) = 7, last = 5 → 5 <= 7-1 → down
  var r = _buildHistoryInsights({ last7Momentum: [7, 7, 7, 5] });
  assertEqual(r.momentumTrend, 'down');
});
test('momentumTrend : last within ±1 of avg → "stable"', function () {
  // avg([5,6]) = 5.5, last = 6 → not >= 6.5, not <= 4.5 → stable
  var r = _buildHistoryInsights({ last7Momentum: [5, 6, 6] });
  assertEqual(r.momentumTrend, 'stable');
});
test('momentumTrend : exact boundary up (last = avg+1) → "up"', function () {
  // avg([4,6]) = 5, last = 6 → 6 >= 5+1 → up
  var r = _buildHistoryInsights({ last7Momentum: [4, 6, 6] });
  assertEqual(r.momentumTrend, 'up');
});
test('momentumTrend : exact boundary down (last = avg-1) → "down"', function () {
  // avg([6,4]) = 5, last = 4 → 4 <= 5-1 → down
  var r = _buildHistoryInsights({ last7Momentum: [6, 4, 4] });
  assertEqual(r.momentumTrend, 'down');
});
test('momentumTrend : single element → null (insufficient data)', function () {
  var r = _buildHistoryInsights({ last7Momentum: [7] });
  assertEqual(r.momentumTrend, null);
});
test('momentumTrend : empty array → null', function () {
  var r = _buildHistoryInsights({ last7Momentum: [] });
  assertEqual(r.momentumTrend, null);
});
test('momentumTrend : null array (not provided) → null', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train'] });
  assertEqual(r.momentumTrend, null);
});

// ── 5. Weekly summary rules ───────────────────────────────────────────────────
test('weeklySummary : streak >= 4 → contains regularity phrase', function () {
  var r = _buildHistoryInsights({
    last7Decisions: ['train','train','train','train','train']
  });
  assert(typeof r.weeklySummary === 'string' && r.weeklySummary.length > 0,
    'weeklySummary should be a non-empty string');
  assert(r.weeklySummary.indexOf('régularité') !== -1,
    'should mention régularité: ' + r.weeklySummary);
});
test('weeklySummary : consistencyScore >= 8 → "Ton rythme est solide et structuré."', function () {
  // 6 trains → score 8
  var r = _buildHistoryInsights({
    last7Decisions: ['rest','train','train','train','train','train','train']
  });
  assert(r.weeklySummary.indexOf('solide') !== -1, 'should contain solide: ' + r.weeklySummary);
});
test('weeklySummary : consistencyScore <= 4 → "On relance progressivement la dynamique."', function () {
  // 2 trains → score 4
  var r = _buildHistoryInsights({
    last7Decisions: ['rest','rest','rest','rest','rest','train','train']
  });
  assert(r.weeklySummary.indexOf('relance') !== -1, 'should contain relance: ' + r.weeklySummary);
});
test('weeklySummary : momentumTrend up → "Ta dynamique est en progression."', function () {
  var r = _buildHistoryInsights({
    last7Decisions: ['rest','rest','rest'],
    last7Momentum: [4, 4, 4, 7]
  });
  assert(r.weeklySummary && r.weeklySummary.indexOf('progression') !== -1,
    'should contain progression: ' + r.weeklySummary);
});
test('weeklySummary : momentumTrend down → "Légère baisse de rythme..."', function () {
  var r = _buildHistoryInsights({
    last7Decisions: ['rest','rest','rest'],
    last7Momentum: [7, 7, 7, 3]
  });
  assert(r.weeklySummary && r.weeklySummary.indexOf('baisse') !== -1,
    'should contain baisse: ' + r.weeklySummary);
});
test('weeklySummary : max 2 phrases combined (streak + momentum up)', function () {
  var r = _buildHistoryInsights({
    last7Decisions: ['train','train','train','train','train'],
    last7Momentum:  [5, 5, 5, 5, 8]
  });
  // Two applicable: streak >= 4 + momentum up
  var sentences = r.weeklySummary.split('. ').filter(function(s) { return s.length > 0; });
  assert(sentences.length <= 2, 'max 2 phrases, got ' + sentences.length + ': ' + r.weeklySummary);
});
test('weeklySummary : no condition matches → null', function () {
  // 3 trains = score 4... wait, score ≤ 4 triggers "relance". Let me use momentum=stable, score=6
  // 4 trains → score 6 (no rule fires for 6), stable momentum
  var r = _buildHistoryInsights({
    last7Decisions: ['rest','rest','rest','train','train','train','train'],
    last7Momentum:  [5, 5, 5, 5, 5, 5]
  });
  // score=6, streak=4 → streak triggers "régularité"
  // actually streak=4 >= 4, so a phrase fires. Let me pick score=6, streak=3, stable trend
  var r2 = _buildHistoryInsights({
    last7Decisions: ['rest','rest','rest','rest','train','train','train'],
    last7Momentum:  [5, 5, 5, 5, 5, 5]
  });
  // score=4 ≤ 4 → "relance" fires. So null case is actually impossible with decisions provided.
  // With decisions present: score is always 2,4,6,8,10. Score<=4 fires, score>=8 fires, score=6 doesn't.
  // So null weeklySummary happens when: decisions absent AND momentum absent.
  var r3 = _buildHistoryInsights({ last7Decisions: null, last7Momentum: null });
  assertEqual(r3.weeklySummary, null);
});

// ── 6. Partial arrays — no crash ──────────────────────────────────────────────
test('partial : only last7Decisions provided → momentumTrend null, no crash', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train','rest','train'] });
  assert(r.streak !== undefined, 'streak should be defined');
  assertEqual(r.momentumTrend, null);
});
test('partial : only last7Momentum provided → streak null, consistencyScore null, no crash', function () {
  var r = _buildHistoryInsights({ last7Momentum: [5, 6, 7] });
  assertEqual(r.streak, null);
  assertEqual(r.consistencyScore, null);
  assert(r.momentumTrend !== undefined, 'momentumTrend should be defined');
});
test('partial : last7Decisions not array → streak null', function () {
  var r = _buildHistoryInsights({ last7Decisions: 'not-array', last7Momentum: [5, 7] });
  assertEqual(r.streak, null);
  assertEqual(r.consistencyScore, null);
  assert(r.momentumTrend !== null, 'momentumTrend should still be computed');
});
test('partial : last7Momentum not array → momentumTrend null, decisions still processed', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['train','train'], last7Momentum: 'bad' });
  assertEqual(r.streak, 2);
  assertEqual(r.momentumTrend, null);
});

// ── 7. Output validity ────────────────────────────────────────────────────────
test('streak always >= 0 when computed', function () {
  var r = _buildHistoryInsights({ last7Decisions: ['rest','rest','rest'] });
  assert(r.streak >= 0, 'streak should be >= 0, got: ' + r.streak);
});
test('consistencyScore always in {2,4,6,8,10} when computed', function () {
  var valid = [2, 4, 6, 8, 10];
  [0,1,2,3,4,5,6,7].forEach(function(trainN) {
    var dec = [];
    for (var t = 0; t < trainN; t++) dec.push('train');
    for (var r2 = dec.length; r2 < 7; r2++) dec.push('rest');
    var result = _buildHistoryInsights({ last7Decisions: dec });
    assert(valid.indexOf(result.consistencyScore) !== -1,
      trainN + ' trains → score ' + result.consistencyScore + ' not in valid set');
  });
});
test('momentumTrend only in {"up","down","stable",null}', function () {
  var valid = ['up', 'down', 'stable', null];
  [[7,7,7,7], [7,7,3], [5,5,5], [5]].forEach(function(mom) {
    var r = _buildHistoryInsights({ last7Momentum: mom });
    assert(valid.indexOf(r.momentumTrend) !== -1, 'invalid trend: ' + r.momentumTrend);
  });
});

// ── 8. Integration — historyInsights in engine output ─────────────────────────
test('decideDailyPlanV3 sans userHistory → historyInsights all nulls', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, sleepQuality: 4, trainingFrequency: 4,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  assert(out.historyInsights !== undefined, 'historyInsights field must be present');
  assertEqual(out.historyInsights.streak, null);
  assertEqual(out.historyInsights.consistencyScore, null);
  assertEqual(out.historyInsights.momentumTrend, null);
  assertEqual(out.historyInsights.weeklySummary, null);
});
test('decideDailyPlanV3 avec userHistory → historyInsights computed', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, sleepQuality: 4, trainingFrequency: 5,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userHistory: {
      last7Decisions: ['train','train','train','train','train','train','rest'],
      last7Momentum:  [6, 6, 7, 7, 8, 8, 7]
    }
  });
  assertEqual(out.historyInsights.streak, 0); // last is 'rest'
  assertEqual(out.historyInsights.consistencyScore, 8); // 6 trains
  assert(out.historyInsights.momentumTrend !== undefined, 'momentumTrend should be computed');
  assert(typeof out.historyInsights.weeklySummary === 'string', 'weeklySummary should be a string');
});
test('userHistory nu00e2ffecte pas decision/intensity/priorityApplied', function () {
  var base = decideV3({
    goal: 'fat_loss', fatigueLevel: 3, trainingFrequency: 3,
    lastSessionDate: '2026-04-27', last3SessionsIntensity: ['moderate']
  });
  var withHistory = decideV3({
    goal: 'fat_loss', fatigueLevel: 3, trainingFrequency: 3,
    lastSessionDate: '2026-04-27', last3SessionsIntensity: ['moderate'],
    userHistory: { last7Decisions: ['train','rest','train'], last7Momentum: [4, 5, 6] }
  });
  assertEqual(base.decision,             withHistory.decision);
  assertEqual(base.recommendedIntensity, withHistory.recommendedIntensity);
  assertEqual(base.priorityApplied,      withHistory.priorityApplied);
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
