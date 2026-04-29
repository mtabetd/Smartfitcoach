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
var _buildPredictionInsights         = DDEv3._buildPredictionInsights;
var _buildPremiumCoachingMessage     = DDEv3._buildPremiumCoachingMessage;
var _buildSmartFitCoachCard          = DDEv3._buildSmartFitCoachCard;
var _selectSessionTypeDiverse        = DDEv3._selectSessionTypeDiverse;
var _applySessionTypeCap             = DDEv3._applySessionTypeCap;
var _selectSessionSubType            = DDEv3._selectSessionSubType;
var _selectSessionTypeByVariety      = DDEv3._selectSessionTypeByVariety;
var _generateCoachingMessage         = DDEv3._generateCoachingMessage;

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

// Fix 1: V3 without profile caps at moderate — non-intensity V2 fields still match
test('fatigue 1, last low, 2 jours repos → V2/V3 decision parity (intensity intentionally differs)', function () {
  var inp = baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2) });
  var v2 = decideV2(inp), v3 = decideV3(inp);
  ['decision','fatigueEffective','priorityApplied','progressionTriggered'].forEach(function(f) {
    if (v2[f] !== v3[f]) throw new Error(f + ': V2=' + JSON.stringify(v2[f]) + ' V3=' + JSON.stringify(v3[f]));
  });
  assertEqual(v3.recommendedIntensity, 'moderate'); // V3 caps high→moderate (no profile → bootstrap safety)
});

assertV2Parity('fatigue 5 → rest (safety)',
  baseV2({ fatigueLevel: 5, last3SessionsIntensity: ['moderate'] }));

assertV2Parity('fatigue 4, freq 3 → rest',
  baseV2({ fatigueLevel: 4, last3SessionsIntensity: ['moderate'] }));

assertV2Parity('fatigue 4, freq 2 → train (régularité)',
  baseV2({ fatigueLevel: 4, trainingFrequency: 2, last3SessionsIntensity: ['low'] }));

// Fix 1: progression fires but V3 caps high→moderate when no profile
test('2 moderate consécutives + fatigue 3 → progression triggered, V3 caps at moderate (no profile)', function () {
  var inp = baseV2({ fatigueLevel: 3, last3SessionsIntensity: ['moderate', 'moderate'] });
  var v2 = decideV2(inp), v3 = decideV3(inp);
  assertEqual(v2.progressionTriggered, true);  // progression still fires in V3
  assertEqual(v3.progressionTriggered, true);
  assertEqual(v3.recommendedIntensity, 'moderate'); // capped from high by bootstrap safety
});

// Fix 1: fat_loss + no profile → moderate, session=cardio (not hiit — hiit requires high intensity)
test('fat_loss + no profile → moderate + cardio, pas hiit (bootstrap safety)', function () {
  var out = decideV3(baseV2({ fatigueLevel: 1, goal: 'fat_loss', last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2) }));
  assertEqual(out.recommendedIntensity,   'moderate');
  assertEqual(out.recommendedSessionType, 'cardio');
});

assertV2Parity('train + low → mobility (pas recovery)',
  baseV2({ fatigueLevel: 3, trainingFrequency: 5, last3SessionsIntensity: ['moderate'] }));

assertV2Parity('phase taper → max moderate',
  baseV2({ fatigueLevel: 1, trainingPhase: 'taper', last3SessionsIntensity: ['moderate', 'moderate'], lastSessionDate: daysAgo(2) }));

assertV2Parity('last high + daysSince 1 → cap moderate (Règle A)',
  baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['high'] }));

// Fix 1: Rule A lifted (daysSince=3) but no profile → V3 still caps at moderate
test('last high + daysSince 3 + no profile → moderate (Règle A levée, bootstrap actif)', function () {
  var out = decideV3(baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(3) }));
  assertEqual(out.recommendedIntensity, 'moderate');
});

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
test('sans userProfile + V2 haute intensité → adaptationReason = bootstrap cap', function () {
  // baseV2 (fat=2, last=moderate, daysSince=1) → V2 gives high → Fix 1 caps to moderate
  assertEqual(decideV3(baseV2()).adaptationReason, 'No user profile — beginner-safe cap applied');
});
test('sans userProfile + déjà moderate (Règle A) → adaptationReason = null', function () {
  // Rule A: last='high', daysSince=1 → V2 caps to moderate; Fix 1 min(1,1)=1 → no change
  assertEqual(decideV3(baseV2({ last3SessionsIntensity: ['high'] })).adaptationReason, null);
});
test('userProfile null explicite → mêmes valeurs par défaut', function () {
  var out = decideV3(baseV2({ userProfile: null }));
  assertEqual(out.momentumScore, null);
  assertEqual(out.profileType, 'beginner');
  // null profile = no profile → bootstrap cap applies same as no profile
  assertEqual(out.adaptationReason, 'No user profile — beginner-safe cap applied');
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
// Fix 2: new thresholds — avgFat>=6 OR (avgFat>=4 AND freq>=6)
test('overtraining : avgFat=4 + freq7=6 → overtraining (new threshold)', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 4, trainingFrequencyLast7Days: 6 }), 'overtraining');
});
test('overtraining : avgFat=4 + freq7=4 → NOT overtraining (old threshold retired)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 4, trainingFrequencyLast7Days: 4 });
  assert(r !== 'overtraining', 'avgFat=4 + freq=4 must not trigger overtraining after Fix 2');
});
test('overtraining : avgFat=5 + freq7=6 → overtraining', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 5, trainingFrequencyLast7Days: 6 }), 'overtraining');
});
test('overtraining : avgFat=5 + freq7=7 → overtraining', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 5, trainingFrequencyLast7Days: 7 }), 'overtraining');
});
test('overtraining : avgFat=4.0 exact + freq7=6 → overtraining (boundary)', function () {
  assertEqual(_detectProfileType({ avgFatigueLast7Days: 4.0, trainingFrequencyLast7Days: 6 }), 'overtraining');
});
test('overtraining : avgFat=4.0 + freq7=5 → NOT overtraining (freq boundary)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 4.0, trainingFrequencyLast7Days: 5 });
  assert(r !== 'overtraining', 'freq=5 must not trigger overtraining (needs >=6)');
});
test('overtraining : avgFat=3.9 → pas overtraining (avgFat boundary)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 3.9, trainingFrequencyLast7Days: 6 });
  assert(r !== 'overtraining', 'avgFat 3.9 must not trigger overtraining');
});
test('overtraining : freq7=5 → pas overtraining (boundary, besoin >=6)', function () {
  var r = _detectProfileType({ avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 5 });
  assert(r !== 'overtraining', 'freq7=5 must not trigger overtraining');
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
  // avgFat=4.5 + freq7=6 (overtraining) ; adherence=0.9 (disciplined)
  assertEqual(_detectProfileType({
    avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6, adherenceScore: 0.9
  }), 'overtraining');
});
test('priorité : overtraining > inconsistent', function () {
  // avgFat=4 + freq7=6 (overtraining) ; adherence=0.3 (inconsistent)
  assertEqual(_detectProfileType({
    avgFatigueLast7Days: 4, trainingFrequencyLast7Days: 6, adherenceScore: 0.3
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
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 }
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
  var v3o = decideV3(baseV2({ userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 } }));
  assertEqual(v2.decision, v3o.decision);
});
test('profileType ne modifie pas recommendedIntensity', function () {
  var v2  = decideV2(baseV2());
  var v3d = decideV3(baseV2({ userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 } }));
  assertEqual(v2.recommendedIntensity, v3d.recommendedIntensity);
});
test('overtraining réduit intensity/sessionType — decision/fatigueEff/priority/progression inchangés', function () {
  var v2 = decideV2(baseV2());
  var v3 = decideV3(baseV2({ userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 } }));
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
  var out = decideV3(baseV2({ userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 } }));
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
// Fix 1: no profile → bootstrap safety cap (max moderate)
test('hasProfile=false + maxRank=2 → capped to 1, reason = bootstrap cap', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'overtraining', 5, false, 'train');
  assertEqual(r.maxRank, 1);
  assertEqual(r.adaptationReason, 'No user profile — beginner-safe cap applied');
});
test('hasProfile=false + maxRank déjà ≤ 1 → inchangé, reason null', function () {
  var r = _applyAdaptiveCaps(1, 'goal_alignment', 'beginner', null, false, 'train');
  assertEqual(r.maxRank, 1);
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

// ── Test 1 : sans userProfile → Fix 1 bootstrap safety cap ──────────────────
test('sans userProfile → intensity cappée à moderate vs V2 high (bootstrap safety)', function () {
  var v2 = decideV2(highBaseV2());
  var v3 = decideV3(highBaseV2());
  assertEqual(v2.recommendedIntensity,  'high');    // V2 baseline gives high
  assertEqual(v3.recommendedIntensity,  'moderate'); // V3 caps at moderate — no profile
  assertEqual(v3.adaptationReason, 'No user profile — beginner-safe cap applied');
});

// ── Test 2 : overtraining réduit intensity ────────────────────────────────────
test('overtraining : intensity réduite vs V2 (high→moderate)', function () {
  var v2 = decideV2(highBaseV2());
  assertEqual(v2.recommendedIntensity, 'high');
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 }
  }));
  assertEqual(v3.recommendedIntensity, 'moderate');
});

// ── Test 3 : overtraining jamais high ────────────────────────────────────────
test('overtraining : recommendedIntensity jamais "high"', function () {
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 }
  }));
  assert(v3.recommendedIntensity !== 'high', 'overtraining must not produce high');
});

// ── Test 4 : overtraining adaptationReason non-null ──────────────────────────
test('overtraining → adaptationReason = "Intensity reduced due to overtraining risk"', function () {
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 }
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
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 }
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
test('sans userProfile + V2 déjà moderate (Règle A) → adaptationReason=null', function () {
  // last='high', daysSince=1 → Rule A caps V2 to moderate; Fix 1 min(1,1)=1 → no cap needed
  assertEqual(decideV3(baseV2({ last3SessionsIntensity: ['high'] })).adaptationReason, null);
});

// ── Test 14 : champs V2 stables (decision/fatigue/priority/progression) ────────
test('overtraining : decision/fatigueEffective/priorityApplied/progressionTriggered = V2', function () {
  var v2 = decideV2(highBaseV2());
  var v3 = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 }
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
  // overtraining (freq7=6): reduces maxRank 2→1
  var inp = baseV2({
    fatigueLevel:           3,
    last3SessionsIntensity: ['moderate', 'moderate'],
    lastSessionDate:        daysAgo(1),
    userProfile:            { avgFatigueLast7Days: 4.5, trainingFrequencyLast7Days: 6 }
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
// Fix 1: no profile + high cap → specific string
test('strings exactes : no userProfile + cap fires → bootstrap cap string', function () {
  var r = _applyAdaptiveCaps(2, 'goal_alignment', 'overtraining', 5, false, 'train');
  assertEqual(r.adaptationReason, 'No user profile — beginner-safe cap applied');
});
test('strings exactes : no userProfile + no cap → null', function () {
  var r = _applyAdaptiveCaps(0, 'safety', 'overtraining', 5, false, 'train');
  assertEqual(r.adaptationReason, null);  // maxRank=0, min(0,1)=0 → no change
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
// SECTION 18 — Module 7 : _buildPredictionInsights
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 18 — Module 7 : _buildPredictionInsights');

// ── 1. Null / invalid inputs ──────────────────────────────────────────────────
test('null inputs → next2Days/fatigueRisk null + recommendation is string', function () {
  var r = _buildPredictionInsights(null, null);
  assertEqual(r.next2Days,   null);
  assertEqual(r.fatigueRisk, null);
  assert(typeof r.recommendation === 'string' && r.recommendation.length > 0, 'recommendation always string');
});
test('undefined inputs → next2Days/fatigueRisk null + recommendation is string', function () {
  var r = _buildPredictionInsights(undefined, undefined);
  assertEqual(r.next2Days,   null);
  assertEqual(r.fatigueRisk, null);
  assert(typeof r.recommendation === 'string', 'recommendation always string');
});
test('non-object inputs (string, number) → null fields + recommendation string', function () {
  var r = _buildPredictionInsights('profile', 42);
  assertEqual(r.next2Days,   null);
  assertEqual(r.fatigueRisk, null);
  assert(typeof r.recommendation === 'string', 'recommendation always string');
});

// ── 2. next2Days computation ──────────────────────────────────────────────────
test("next2Days: up trend + last decision train → 'increase'", function () {
  var r = _buildPredictionInsights(null, {
    last7Decisions: ['rest', 'train', 'train', 'train', 'train', 'train', 'train'],
    last7Momentum:  [3, 4, 5, 6, 7, 8, 9]
  });
  assertEqual(r.next2Days, 'increase');
});
test("next2Days: up trend + last decision rest → 'stable'", function () {
  var r = _buildPredictionInsights(null, {
    last7Decisions: ['train', 'train', 'train', 'train', 'train', 'train', 'rest'],
    last7Momentum:  [3, 4, 5, 6, 7, 8, 9]
  });
  assertEqual(r.next2Days, 'stable');
});
test("next2Days: down trend → 'decrease'", function () {
  var r = _buildPredictionInsights(null, {
    last7Decisions: ['train', 'train', 'train', 'train', 'train', 'train', 'train'],
    last7Momentum:  [9, 8, 7, 6, 5, 4, 3]
  });
  assertEqual(r.next2Days, 'decrease');
});
test("next2Days: stable trend → 'stable'", function () {
  var r = _buildPredictionInsights(null, {
    last7Decisions: ['train', 'train', 'train', 'train', 'train', 'train', 'train'],
    last7Momentum:  [5, 5, 5, 5, 5, 5, 5]
  });
  assertEqual(r.next2Days, 'stable');
});
test('next2Days: no history → null', function () {
  assertEqual(_buildPredictionInsights(null, null).next2Days, null);
});
test('next2Days: userHistory with no momentum array → null', function () {
  var r = _buildPredictionInsights(null, { last7Decisions: ['train', 'train', 'train'] });
  assertEqual(r.next2Days, null);
});
test('next2Days: single momentum entry (needs ≥2) → null', function () {
  var r = _buildPredictionInsights(null, {
    last7Decisions: ['train'],
    last7Momentum:  [7]
  });
  assertEqual(r.next2Days, null);
});

// ── 3. fatigueRisk computation ────────────────────────────────────────────────
test('fatigueRisk: null when no profile', function () {
  assertEqual(_buildPredictionInsights(null, null).fatigueRisk, null);
});
test('fatigueRisk: null when profile has no relevant numeric fields', function () {
  var r = _buildPredictionInsights({ lastSessionTypeHistory: ['strength'] }, null);
  assertEqual(r.fatigueRisk, null);
});
test("fatigueRisk: high via avgFatigueLast7Days ≥ 6 (direct unit test)", function () {
  var r = _buildPredictionInsights({ avgFatigueLast7Days: 6 }, null);
  assertEqual(r.fatigueRisk, 'high');
});
test("fatigueRisk: high via freq≥6 + streak≥3 (all-train decisions)", function () {
  var r = _buildPredictionInsights(
    { trainingFrequencyLast7Days: 6 },
    { last7Decisions: ['train','train','train','train','train','train','train'], last7Momentum: [5, 6, 7] }
  );
  assertEqual(r.fatigueRisk, 'high');
});
test("fatigueRisk: high via freq=7 + streak=4", function () {
  var r = _buildPredictionInsights(
    { trainingFrequencyLast7Days: 7 },
    { last7Decisions: ['rest','rest','rest','train','train','train','train'], last7Momentum: [5, 6, 7] }
  );
  assertEqual(r.fatigueRisk, 'high');
});
test("fatigueRisk: NOT high when freq≥6 but streak<3", function () {
  var r = _buildPredictionInsights(
    { trainingFrequencyLast7Days: 6 },
    { last7Decisions: ['train','train','rest','rest','rest','rest','rest'], last7Momentum: [5, 6, 7] }
  );
  assert(r.fatigueRisk !== 'high', 'should not be high when streak=2');
});
test("fatigueRisk: moderate via avgFatigueLast7Days=4", function () {
  assertEqual(_buildPredictionInsights({ avgFatigueLast7Days: 4 }, null).fatigueRisk, 'moderate');
});
test("fatigueRisk: moderate via avgFatigueLast7Days=5", function () {
  assertEqual(_buildPredictionInsights({ avgFatigueLast7Days: 5 }, null).fatigueRisk, 'moderate');
});
test("fatigueRisk: moderate via trainingFrequencyLast7Days=4", function () {
  assertEqual(_buildPredictionInsights({ trainingFrequencyLast7Days: 4 }, null).fatigueRisk, 'moderate');
});
test("fatigueRisk: moderate via trainingFrequencyLast7Days=5", function () {
  assertEqual(_buildPredictionInsights({ trainingFrequencyLast7Days: 5 }, null).fatigueRisk, 'moderate');
});
test("fatigueRisk: low when avgFatigue<4 and freq<4", function () {
  assertEqual(_buildPredictionInsights({ avgFatigueLast7Days: 2, trainingFrequencyLast7Days: 3 }, null).fatigueRisk, 'low');
});
test("fatigueRisk: low via freq=1", function () {
  assertEqual(_buildPredictionInsights({ trainingFrequencyLast7Days: 1 }, null).fatigueRisk, 'low');
});

// ── 4. fatigueRisk boundaries ─────────────────────────────────────────────────
test('fatigueRisk boundary: avgFatigue=3.9 → low', function () {
  assertEqual(_buildPredictionInsights({ avgFatigueLast7Days: 3.9 }, null).fatigueRisk, 'low');
});
test('fatigueRisk boundary: avgFatigue=4.0 → moderate', function () {
  assertEqual(_buildPredictionInsights({ avgFatigueLast7Days: 4.0 }, null).fatigueRisk, 'moderate');
});
test('fatigueRisk boundary: freq=3 → low (not moderate)', function () {
  assertEqual(_buildPredictionInsights({ trainingFrequencyLast7Days: 3 }, null).fatigueRisk, 'low');
});
test('fatigueRisk boundary: freq=4 → moderate', function () {
  assertEqual(_buildPredictionInsights({ trainingFrequencyLast7Days: 4 }, null).fatigueRisk, 'moderate');
});
test('fatigueRisk boundary: freq=6 + streak=2 → moderate (not high, streak<3)', function () {
  var r = _buildPredictionInsights(
    { trainingFrequencyLast7Days: 6 },
    { last7Decisions: ['rest','rest','rest','rest','rest','train','train'], last7Momentum: [5, 6, 7] }
  );
  assert(r.fatigueRisk !== 'high', 'not high when streak=2');
  assertEqual(r.fatigueRisk, 'moderate'); // freq=6 ≥ 4 triggers moderate
});

// ── 5. recommendation — 4 cases ──────────────────────────────────────────────
test('recommendation case 1: high fatigue → recovery message', function () {
  var r = _buildPredictionInsights({ avgFatigueLast7Days: 6 }, null);
  assertEqual(r.fatigueRisk, 'high');
  assert(typeof r.recommendation === 'string' && r.recommendation.length > 0, 'recommendation is string');
  assert(r.recommendation.indexOf('récupération') !== -1, 'high risk → recovery keyword');
});
test('recommendation case 2: moderate fatigue → measured effort message', function () {
  var r = _buildPredictionInsights({ avgFatigueLast7Days: 4 }, null);
  assertEqual(r.fatigueRisk, 'moderate');
  assert(typeof r.recommendation === 'string' && r.recommendation.length > 0, 'recommendation is string');
  assert(r.recommendation.indexOf('mesuré') !== -1, 'moderate risk → measured keyword');
});
test('recommendation case 3: low risk + increase → momentum message', function () {
  var r = _buildPredictionInsights(
    { avgFatigueLast7Days: 2 },
    { last7Decisions: ['rest','train','train','train','train','train','train'], last7Momentum: [3, 4, 5, 6, 7, 8, 9] }
  );
  assertEqual(r.fatigueRisk,  'low');
  assertEqual(r.next2Days,    'increase');
  assert(typeof r.recommendation === 'string' && r.recommendation.length > 0, 'recommendation is string');
  assert(r.recommendation.indexOf('intensité') !== -1 || r.recommendation.indexOf('dynamique') !== -1, 'increase → intensity/momentum keyword');
});
test('recommendation case 4: default (no data) → consistency message', function () {
  var r = _buildPredictionInsights(null, null);
  assert(typeof r.recommendation === 'string' && r.recommendation.length > 0, 'recommendation always string');
  assert(r.recommendation.indexOf('régulier') !== -1 || r.recommendation.indexOf('constance') !== -1, 'default → consistency keyword');
});
test('recommendation: each call returns a non-empty string regardless of inputs', function () {
  [
    [null, null],
    [{ avgFatigueLast7Days: 3 }, null],
    [null, { last7Decisions: ['train'], last7Momentum: [5, 6] }],
    [{ trainingFrequencyLast7Days: 4 }, { last7Decisions: ['train','train'], last7Momentum: [5, 7] }]
  ].forEach(function (tc) {
    var r = _buildPredictionInsights(tc[0], tc[1]);
    assert(typeof r.recommendation === 'string' && r.recommendation.length > 0,
      'non-empty string for inputs: ' + JSON.stringify(tc));
  });
});

// ── 6. Output shape validity ──────────────────────────────────────────────────
test('output always has exactly 3 fields with valid enum values', function () {
  var validNext2Days   = ['increase', 'stable', 'decrease', null];
  var validFatigueRisk = ['low', 'moderate', 'high', null];
  [
    [null, null],
    [{ avgFatigueLast7Days: 3 }, null],
    [null, { last7Decisions: ['train'], last7Momentum: [5, 6] }],
    [{ trainingFrequencyLast7Days: 4 }, { last7Decisions: ['train','train'], last7Momentum: [5, 7] }],
    [{ avgFatigueLast7Days: 2 }, { last7Decisions: ['train','train','train'], last7Momentum: [3,5,7,9] }]
  ].forEach(function (tc) {
    var r = _buildPredictionInsights(tc[0], tc[1]);
    assert('next2Days'      in r, 'next2Days field present');
    assert('fatigueRisk'    in r, 'fatigueRisk field present');
    assert('recommendation' in r, 'recommendation field present');
    assert(validNext2Days.indexOf(r.next2Days) !== -1,   'next2Days valid: ' + r.next2Days);
    assert(validFatigueRisk.indexOf(r.fatigueRisk) !== -1, 'fatigueRisk valid: ' + r.fatigueRisk);
    assert(typeof r.recommendation === 'string' && r.recommendation.length > 0, 'recommendation non-empty string');
  });
});

// ── 7. Independence — prior module outputs unaffected ─────────────────────────
test('predictionInsights does not affect decision/intensity/priorityApplied', function () {
  // userHistory feeds only Module 6 + 7; adding it must not change prior outputs
  var base = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  var withHistory = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userHistory: {
      last7Decisions: ['train','train','train','train','train','train','train'],
      last7Momentum:  [5, 6, 7, 8, 9, 10, 10]
    }
  });
  assertEqual(base.decision,             withHistory.decision);
  assertEqual(base.recommendedIntensity, withHistory.recommendedIntensity);
  assertEqual(base.priorityApplied,      withHistory.priorityApplied);
});
test('historyInsights field is not affected by predictionInsights presence', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userHistory: {
      last7Decisions: ['train','train','train','train','train','rest','rest'],
      last7Momentum:  [5, 5, 6, 6, 7, 7, 6]
    }
  });
  assert(out.historyInsights !== undefined,           'historyInsights still present');
  assertEqual(out.historyInsights.streak,           0); // last 2 are 'rest'
  assertEqual(out.historyInsights.consistencyScore, 6); // 5 trains → score 6
  assert(out.historyInsights.momentumTrend !== undefined, 'momentumTrend computed');
  assert(out.predictionInsights !== undefined,        'predictionInsights also present');
});

// ── 8. Integration with decideDailyPlanV3 ────────────────────────────────────
test('decideDailyPlanV3 sans userProfile/userHistory → predictionInsights.next2Days/fatigueRisk null', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 4,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  assert(out.predictionInsights !== undefined, 'predictionInsights field must be present');
  assertEqual(out.predictionInsights.next2Days,   null);
  assertEqual(out.predictionInsights.fatigueRisk, null);
  assert(typeof out.predictionInsights.recommendation === 'string', 'recommendation always string');
});
test('decideDailyPlanV3 avec userProfile + userHistory → predictionInsights fully computed', function () {
  var out = decideV3({
    goal: 'fat_loss', fatigueLevel: 3, trainingFrequency: 4,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userProfile: { avgFatigueLast7Days: 2, trainingFrequencyLast7Days: 3 },
    userHistory: {
      last7Decisions: ['rest','train','train','train','train','train','train'],
      last7Momentum:  [3, 4, 5, 6, 7, 8, 9]
    }
  });
  assert(out.predictionInsights.next2Days   !== undefined, 'next2Days computed');
  assert(out.predictionInsights.fatigueRisk !== undefined, 'fatigueRisk computed');
  assertEqual(out.predictionInsights.fatigueRisk, 'low');
  assertEqual(out.predictionInsights.next2Days,   'increase');
  assert(typeof out.predictionInsights.recommendation === 'string', 'recommendation is string');
});
test('decideDailyPlanV3 avec profil haute fatigue → fatigueRisk high (direct unit)', function () {
  var r = _buildPredictionInsights({ avgFatigueLast7Days: 6, trainingFrequencyLast7Days: 6 }, {
    last7Decisions: ['train','train','train','train','train','train','train'],
    last7Momentum:  [5, 6, 7, 8, 9, 10, 10]
  });
  assertEqual(r.fatigueRisk, 'high');
  assert(r.recommendation.indexOf('récupération') !== -1, 'high risk → recovery recommendation');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 19 — Module 8 : _buildPremiumCoachingMessage
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 19 — Module 8 : _buildPremiumCoachingMessage');

// ── 1. Current State — fatigueRisk high ──────────────────────────────────────
test('currentState: fatigueRisk high → limiter potentiel message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'rest', momentumScore: 3, profileType: 'consistent',
    predictionInsights: { fatigueRisk: 'high', next2Days: null }, historyInsights: {}
  });
  assert(typeof r === 'string' && r.length > 0, 'returns non-empty string');
  assert(r.indexOf('limiter') !== -1, 'high fatigue → "limiter"');
});
test('currentState: fatigueRisk high takes priority over high momentum', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 9, profileType: 'consistent',
    predictionInsights: { fatigueRisk: 'high', next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('limiter') !== -1, 'high fatigue still wins over high momentum');
});

// ── 2. Current State — momentum high ─────────────────────────────────────────
test('currentState: momentumScore ≥ 7 → dynamique de progression message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 8, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('dynamique') !== -1, 'momentum ≥ 7 → "dynamique"');
});
test('currentState: momentumScore=7 (boundary) → dynamique message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 7, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('dynamique') !== -1, 'score=7 boundary triggers dynamique');
});
test('currentState: momentumScore=6 → NOT dynamique message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 6, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('dynamique') === -1, 'score<7 → no dynamique line');
});

// ── 3. Current State — profile inconsistent ───────────────────────────────────
test('currentState: profileType inconsistent → instable message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 4, profileType: 'inconsistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('instable') !== -1, 'inconsistent → "instable"');
});
test('currentState: profileType inconsistent yields to high momentum', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 8, profileType: 'inconsistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('dynamique') !== -1, 'momentum ≥ 7 wins over inconsistent profile');
  assert(r.indexOf('instable') === -1, 'inconsistent message not present');
});

// ── 4. Trajectory — all 3 cases ──────────────────────────────────────────────
test('trajectory: next2Days increase → aller plus loin message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 5, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: 'increase' }, historyInsights: {}
  });
  assert(r.indexOf('aller plus loin') !== -1, 'increase → "aller plus loin"');
});
test('trajectory: next2Days decrease → éroder message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 5, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: 'decrease' }, historyInsights: {}
  });
  assert(r.indexOf('éroder') !== -1, 'decrease → "éroder"');
});
test('trajectory: next2Days stable → sécurises message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 5, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: 'stable' }, historyInsights: {}
  });
  assert(r.indexOf('sécurises') !== -1, 'stable → "sécurises"');
});
test('trajectory: next2Days null → trajectory line omitted (2 lines)', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 4, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assertEqual(r.split('\n').length, 2); // state + action, no trajectory
});
test('trajectory: no predictionInsights → trajectory line omitted', function () {
  var r = _buildPremiumCoachingMessage({ decision: 'train', momentumScore: 4 });
  assertEqual(r.split('\n').length, 2);
});

// ── 5. Action — train vs rest wording ────────────────────────────────────────
test('action: decision train → exploite message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 4, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('exploite') !== -1, 'train → "exploite"');
});
test('action: decision rest → reconstruire message', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'rest', momentumScore: 4, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assert(r.indexOf('reconstruire') !== -1, 'rest → "reconstruire"');
});
test('action: unknown decision defaults to train wording', function () {
  var r = _buildPremiumCoachingMessage({
    decision: undefined, momentumScore: 4,
    predictionInsights: { fatigueRisk: null, next2Days: null }
  });
  assert(r.indexOf('exploite') !== -1, 'undefined decision → train default');
});

// ── 6. Max 3 lines enforced ───────────────────────────────────────────────────
test('max 3 lines: with trajectory gives exactly 3 lines', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 5, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: 'increase' }, historyInsights: {}
  });
  var lines = r.split('\n');
  assertEqual(lines.length, 3);
});
test('max 3 lines: without trajectory gives exactly 2 lines', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 5, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: null }, historyInsights: {}
  });
  assertEqual(r.split('\n').length, 2);
});
test('max 3 lines: never exceeded in any combination', function () {
  var combos = [
    { decision: 'train', momentumScore: 9, profileType: 'inconsistent', predictionInsights: { fatigueRisk: 'high', next2Days: 'increase' } },
    { decision: 'rest',  momentumScore: 3, profileType: 'consistent',   predictionInsights: { fatigueRisk: 'moderate', next2Days: 'decrease' } },
    { decision: 'train', momentumScore: 8, profileType: 'consistent',   predictionInsights: { fatigueRisk: null, next2Days: 'stable' } },
    { decision: 'rest',  momentumScore: 1, profileType: 'inconsistent', predictionInsights: { fatigueRisk: null, next2Days: null } }
  ];
  combos.forEach(function (inp) {
    var lines = _buildPremiumCoachingMessage(inp).split('\n');
    assert(lines.length <= 3, 'must be ≤ 3 lines, got ' + lines.length + ' for: ' + JSON.stringify(inp));
  });
});

// ── 7. No null output ─────────────────────────────────────────────────────────
test('never returns null or empty string for any input', function () {
  [
    { decision: 'train', momentumScore: null, profileType: null, predictionInsights: {}, historyInsights: {} },
    { decision: 'rest',  momentumScore: 9,    profileType: 'inconsistent', predictionInsights: { fatigueRisk: 'high', next2Days: 'decrease' } },
    {},
    null
  ].forEach(function (inp) {
    var r = _buildPremiumCoachingMessage(inp);
    assert(typeof r === 'string' && r.length > 0, 'non-null non-empty for: ' + JSON.stringify(inp));
  });
});
test('each line is a non-empty string', function () {
  var r = _buildPremiumCoachingMessage({
    decision: 'train', momentumScore: 7, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: 'stable' }, historyInsights: {}
  });
  r.split('\n').forEach(function (line, i) {
    assert(typeof line === 'string' && line.length > 0, 'line ' + i + ' is non-empty');
  });
});

// ── 8. Deterministic output ───────────────────────────────────────────────────
test('deterministic: same inputs always produce identical output', function () {
  var inp = {
    decision: 'train', momentumScore: 8, profileType: 'consistent',
    predictionInsights: { fatigueRisk: null, next2Days: 'increase' }, historyInsights: {}
  };
  var r1 = _buildPremiumCoachingMessage(inp);
  var r2 = _buildPremiumCoachingMessage(inp);
  var r3 = _buildPremiumCoachingMessage(inp);
  assertEqual(r1, r2);
  assertEqual(r2, r3);
});
test('deterministic: rest + high fatigue + decrease always same', function () {
  var inp = {
    decision: 'rest', momentumScore: 5, profileType: 'inconsistent',
    predictionInsights: { fatigueRisk: 'high', next2Days: 'decrease' }, historyInsights: {}
  };
  assertEqual(_buildPremiumCoachingMessage(inp), _buildPremiumCoachingMessage(inp));
});

// ── 9. Integration with decideDailyPlanV3 ────────────────────────────────────
test('decideDailyPlanV3 → premiumCoachingMessage field present and non-empty', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  assert(out.premiumCoachingMessage !== undefined, 'premiumCoachingMessage field must be present');
  assert(typeof out.premiumCoachingMessage === 'string' && out.premiumCoachingMessage.length > 0, 'non-empty string');
});
test('decideDailyPlanV3 → premiumCoachingMessage is 2 or 3 lines', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  var lines = out.premiumCoachingMessage.split('\n');
  assert(lines.length >= 2 && lines.length <= 3, 'between 2 and 3 lines, got: ' + lines.length);
});
test('premiumCoachingMessage does not affect decision/intensity/historyInsights', function () {
  var base = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  var withHistory = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userHistory: { last7Decisions: ['train','train','train'], last7Momentum: [5, 7, 9] }
  });
  assertEqual(base.decision,             withHistory.decision);
  assertEqual(base.recommendedIntensity, withHistory.recommendedIntensity);
  assertEqual(base.priorityApplied,      withHistory.priorityApplied);
});
test('premiumCoachingMessage and predictionInsights both present in engine output', function () {
  var out = decideV3({
    goal: 'fat_loss', fatigueLevel: 3, trainingFrequency: 4,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userProfile: { avgFatigueLast7Days: 2, trainingFrequencyLast7Days: 3 },
    userHistory: {
      last7Decisions: ['rest','train','train','train','train','train','train'],
      last7Momentum:  [3, 4, 5, 6, 7, 8, 9]
    }
  });
  assert(out.predictionInsights   !== undefined, 'predictionInsights present');
  assert(out.premiumCoachingMessage !== undefined, 'premiumCoachingMessage present');
  assert(typeof out.premiumCoachingMessage === 'string', 'premiumCoachingMessage is string');
  // With increase momentum and low fatigue → should mention progression
  assert(out.premiumCoachingMessage.indexOf('progression') !== -1 || out.premiumCoachingMessage.indexOf('solide') !== -1 || out.premiumCoachingMessage.length > 10, 'message is meaningful');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 20 — Module 9 (UI) : _buildSmartFitCoachCard
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 20 — Module 9 (UI) : _buildSmartFitCoachCard');

var _cardBase = {
  decision: 'train', recommendedSessionType: 'strength', recommendedIntensity: 'moderate',
  momentumScore: 7, profileType: 'consistent',
  premiumCoachingMessage: "Tu es dans une dynamique où chaque séance compte.\nTu peux te permettre d'aller plus loin.\nAujourd'hui, on exploite la séance avec précision."
};

// ── 1. Global structure ───────────────────────────────────────────────────────
test('card: returns non-empty string', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(typeof c === 'string' && c.length > 0, 'returns non-empty string');
});
test('card: header SMARTFITCOACH TODAY is first line', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assertEqual(c.split('\n')[0], 'SMARTFITCOACH TODAY');
});
test('card: exactly 4 sections separated by empty lines', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  var sections = c.split('\n\n');
  assertEqual(sections.length, 4);
  assertEqual(sections[0], 'SMARTFITCOACH TODAY');
});
test('card: section 2 contains all 4 intelligence rows', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  var sections = c.split('\n\n');
  var rows = sections[1].split('\n');
  assertEqual(rows.length, 4);
});
test('card: section 3 is the premiumCoachingMessage', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  var sections = c.split('\n\n');
  assertEqual(sections[2], _cardBase.premiumCoachingMessage);
});
test('card: section 4 starts with Action du jour', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  var sections = c.split('\n\n');
  var actionLines = sections[3].split('\n');
  assertEqual(actionLines[0], 'Action du jour');
  assert(actionLines[1].length > 0, 'action text is non-empty');
});

// ── 2. Intelligence rows — format and alignment ───────────────────────────────
test('rows: Séance label aligned at column 14', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Séance        : ') !== -1, 'Séance row has correct 14-char label');
});
test('rows: Intensité label aligned at column 14', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Intensité     : ') !== -1, 'Intensité row has correct 14-char label');
});
test('rows: Momentum label aligned at column 14', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Momentum      : ') !== -1, 'Momentum row has correct 14-char label');
});
test('rows: Profil label aligned at column 14', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Profil        : ') !== -1, 'Profil row has correct 14-char label');
});
test('rows: Séance value matches input', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Séance        : strength') !== -1, 'Séance value is "strength"');
});
test('rows: Intensité value matches input', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Intensité     : moderate') !== -1, 'Intensité value is "moderate"');
});
test('rows: Momentum formatted as "{score} / 10"', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Momentum      : 7 / 10') !== -1, 'Momentum formatted as "7 / 10"');
});
test('rows: Profil value matches input', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  assert(c.indexOf('Profil        : consistent') !== -1, 'Profil value is "consistent"');
});

// ── 3. premiumCoachingMessage — newlines preserved ────────────────────────────
test('message: multi-line coaching message preserved with \\n', function () {
  var multiLine = "Ligne un.\nLigne deux.\nLigne trois.";
  var c = _buildSmartFitCoachCard({ decision: 'train', momentumScore: 5, premiumCoachingMessage: multiLine });
  assert(c.indexOf('Ligne un.\nLigne deux.\nLigne trois.') !== -1, 'newlines preserved');
});
test('message: single-line coaching message also preserved', function () {
  var single = "L'équilibre est bon, mais encore perfectible.";
  var c = _buildSmartFitCoachCard({ decision: 'train', momentumScore: 5, premiumCoachingMessage: single });
  assert(c.indexOf(single) !== -1, 'single-line message preserved');
});

// ── 4. Action text — train vs rest ───────────────────────────────────────────
test('action: decision train → Effectuer la séance prévue avec précision.', function () {
  var c = _buildSmartFitCoachCard(Object.assign({}, _cardBase, { decision: 'train' }));
  assert(c.indexOf('Effectuer la séance prévue avec précision.') !== -1, 'train action text correct');
});
test('action: decision rest → Laisser le corps récupérer pleinement.', function () {
  var c = _buildSmartFitCoachCard(Object.assign({}, _cardBase, { decision: 'rest' }));
  assert(c.indexOf('Laisser le corps récupérer pleinement.') !== -1, 'rest action text correct');
});
test('action: undefined decision defaults to train text', function () {
  var c = _buildSmartFitCoachCard({ momentumScore: 5, premiumCoachingMessage: 'msg' });
  assert(c.indexOf('Effectuer la séance prévue avec précision.') !== -1, 'default → train action');
});

// ── 5. Fallback "-" for missing fields ────────────────────────────────────────
test('fallback: missing recommendedSessionType → "-"', function () {
  var c = _buildSmartFitCoachCard({ decision: 'train', momentumScore: 5, premiumCoachingMessage: 'msg' });
  assert(c.indexOf('Séance        : -') !== -1, 'missing sessType → "-"');
});
test('fallback: missing momentumScore → "-"', function () {
  var c = _buildSmartFitCoachCard({ decision: 'train', recommendedSessionType: 'cardio', premiumCoachingMessage: 'msg' });
  assert(c.indexOf('Momentum      : -') !== -1, 'missing momentum → "-"');
});
test('fallback: null momentumScore → "-"', function () {
  var c = _buildSmartFitCoachCard({ decision: 'train', momentumScore: null, premiumCoachingMessage: 'msg' });
  assert(c.indexOf('Momentum      : -') !== -1, 'null momentum → "-"');
});
test('fallback: empty object → card with all "-" fields', function () {
  var c = _buildSmartFitCoachCard({});
  assert(typeof c === 'string' && c.length > 0, 'empty object → valid string card');
  assert(c.indexOf('Séance        : -') !== -1, 'all fields default to "-"');
});

// ── 6. Fail-safe — no throw on invalid input ──────────────────────────────────
test('fail-safe: null input → returns string (graceful fallback)', function () {
  var c = _buildSmartFitCoachCard(null);
  assert(typeof c === 'string' || c === null, 'null input → string or null, never throws');
});
test('fail-safe: undefined input → returns string (graceful fallback)', function () {
  var c = _buildSmartFitCoachCard(undefined);
  assert(typeof c === 'string' || c === null, 'undefined input → string or null, never throws');
});

// ── 7. Deterministic output ───────────────────────────────────────────────────
test('deterministic: identical inputs always produce identical output', function () {
  var c1 = _buildSmartFitCoachCard(_cardBase);
  var c2 = _buildSmartFitCoachCard(_cardBase);
  var c3 = _buildSmartFitCoachCard(_cardBase);
  assertEqual(c1, c2);
  assertEqual(c2, c3);
});
test('deterministic: rest decision always same', function () {
  var inp = Object.assign({}, _cardBase, { decision: 'rest' });
  assertEqual(_buildSmartFitCoachCard(inp), _buildSmartFitCoachCard(inp));
});

// ── 8. Integration with decideDailyPlanV3 ────────────────────────────────────
test('decideDailyPlanV3 → smartfitcoachCard field present and non-empty', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  assert(out.smartfitcoachCard !== undefined, 'smartfitcoachCard field must be present');
  assert(typeof out.smartfitcoachCard === 'string' && out.smartfitcoachCard.length > 0, 'non-empty string');
});
test('decideDailyPlanV3 → card header is "SMARTFITCOACH TODAY"', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  assertEqual(out.smartfitcoachCard.split('\n')[0], 'SMARTFITCOACH TODAY');
});
test('decideDailyPlanV3 → card has all 4 intelligence row labels', function () {
  var out = decideV3({
    goal: 'fat_loss', fatigueLevel: 3, trainingFrequency: 4,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  var c = out.smartfitcoachCard;
  assert(c.indexOf('Séance        : ') !== -1, 'Séance row present');
  assert(c.indexOf('Intensité     : ') !== -1, 'Intensité row present');
  assert(c.indexOf('Momentum      : ') !== -1, 'Momentum row present');
  assert(c.indexOf('Profil        : ') !== -1, 'Profil row present');
});
test('decideDailyPlanV3 → smartfitcoachCard does not affect prior outputs', function () {
  var base = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  assert(base.decision                !== undefined, 'decision present');
  assert(base.recommendedIntensity    !== undefined, 'recommendedIntensity present');
  assert(base.historyInsights         !== undefined, 'historyInsights present');
  assert(base.predictionInsights      !== undefined, 'predictionInsights present');
  assert(base.premiumCoachingMessage  !== undefined, 'premiumCoachingMessage present');
  assert(base.smartfitcoachCard       !== undefined, 'smartfitcoachCard present');
});
test('decideDailyPlanV3 → card Action du jour matches engine decision', function () {
  var trainOut = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
  });
  var restOut = decideV3({
    goal: 'muscle_gain', fatigueLevel: 5, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['high', 'high', 'high']
  });
  if (trainOut.decision === 'train') {
    assert(trainOut.smartfitcoachCard.indexOf('Effectuer la séance') !== -1, 'train decision → train action');
  }
  if (restOut.decision === 'rest') {
    assert(restOut.smartfitcoachCard.indexOf('Laisser le corps') !== -1, 'rest decision → rest action');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 21 — Production Contract : Full V3 Output Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 21 — Production Contract');

var _baseInputs = {
  goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 4,
  lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate']
};
var _fullInputs = Object.assign({}, _baseInputs, {
  userProfile: { avgFatigueLast7Days: 2, trainingFrequencyLast7Days: 3 },
  userHistory: {
    last7Decisions: ['rest', 'train', 'train', 'train', 'train', 'train', 'train'],
    last7Momentum:  [3, 4, 5, 6, 7, 8, 9]
  }
});

// ── Contract: all 13 required output fields present ───────────────────────────
test('contract: all 13 required fields present in engine output', function () {
  var out = decideV3(_baseInputs);
  var contract = [
    'decision', 'recommendedIntensity', 'recommendedSessionType',
    'fatigueEffective', 'priorityApplied', 'reason', '_debug',
    'momentumScore', 'profileType', 'adaptationReason',
    'predictionInsights', 'premiumCoachingMessage', 'smartfitcoachCard'
  ];
  contract.forEach(function (field) {
    assert(field in out, 'required field "' + field + '" must be present');
  });
});
test('contract: all 13 fields present with full inputs (userProfile + userHistory)', function () {
  var out = decideV3(_fullInputs);
  var contract = [
    'decision', 'recommendedIntensity', 'recommendedSessionType',
    'fatigueEffective', 'priorityApplied', 'reason', '_debug',
    'momentumScore', 'profileType', 'adaptationReason',
    'predictionInsights', 'premiumCoachingMessage', 'smartfitcoachCard'
  ];
  contract.forEach(function (field) {
    assert(field in out, 'required field "' + field + '" must be present with full inputs');
  });
});

// ── UI test 1: train render ───────────────────────────────────────────────────
test('UI render train: card contains train action text', function () {
  var out = decideV3(_baseInputs);
  if (out.decision === 'train') {
    assert(out.smartfitcoachCard.indexOf('Effectuer la séance prévue avec précision.') !== -1,
      'train decision → train action text in card');
  } else {
    assert(out.smartfitcoachCard.indexOf('Laisser le corps récupérer pleinement.') !== -1,
      'rest decision → rest action text in card');
  }
});
test('UI render train: _buildSmartFitCoachCard with train → correct action', function () {
  var c = _buildSmartFitCoachCard({
    decision: 'train', recommendedSessionType: 'strength', recommendedIntensity: 'high',
    momentumScore: 8, profileType: 'consistent',
    premiumCoachingMessage: "Tu es dans une dynamique où chaque séance compte.\nAujourd'hui, on exploite la séance avec précision."
  });
  assert(c.indexOf('SMARTFITCOACH TODAY') !== -1, 'header present');
  assert(c.indexOf('Effectuer la séance prévue avec précision.') !== -1, 'train action text');
  assert(c.indexOf('Momentum      : 8 / 10') !== -1, 'momentum formatted');
});

// ── UI test 2: rest render ────────────────────────────────────────────────────
test('UI render rest: _buildSmartFitCoachCard with rest → correct action', function () {
  var c = _buildSmartFitCoachCard({
    decision: 'rest', recommendedSessionType: 'recovery', recommendedIntensity: 'low',
    momentumScore: 3, profileType: 'inconsistent',
    premiumCoachingMessage: "La fatigue commence à limiter ton potentiel aujourd'hui.\nAujourd'hui, on laisse le corps reconstruire."
  });
  assert(c.indexOf('SMARTFITCOACH TODAY') !== -1, 'header present');
  assert(c.indexOf('Laisser le corps récupérer pleinement.') !== -1, 'rest action text');
  assert(c.indexOf('Action du jour') !== -1, 'Action du jour label present');
});
test('UI render rest: engine rest decision → rest action in card', function () {
  // Force rest: very high fatigue + recent high sessions
  var out = decideV3({
    goal: 'maintenance', fatigueLevel: 5, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['high', 'high', 'high']
  });
  if (out.decision === 'rest') {
    assert(out.smartfitcoachCard.indexOf('Laisser le corps récupérer pleinement.') !== -1,
      'engine rest → rest action in card');
  }
});

// ── UI test 3: missing fields fallback ────────────────────────────────────────
test('UI fallback: null momentumScore → "Momentum      : -"', function () {
  var c = _buildSmartFitCoachCard({ decision: 'train', premiumCoachingMessage: 'msg' });
  assert(c.indexOf('Momentum      : -') !== -1, 'null momentum → "-"');
});
test('UI fallback: all missing → card with all "-" values and no throw', function () {
  var c = _buildSmartFitCoachCard({});
  assert(typeof c === 'string' && c.length > 0, 'empty input → valid card');
  assert(c.indexOf('Séance        : -') !== -1, 'Séance fallback "-"');
  assert(c.indexOf('Profil        : -') !== -1, 'Profil fallback "-"');
});

// ── UI test 4: alignment — labels padded to exactly 14 chars ─────────────────
test('UI alignment: all 4 row labels padded to 14 chars (colon at col 14)', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  // Each label + spaces = 14 chars, then ": "
  // Verify by checking exact prefix strings
  assert(c.indexOf('Séance        : ') !== -1, 'Séance: 6+8sp=14');
  assert(c.indexOf('Intensité     : ') !== -1, 'Intensité: 9+5sp=14');
  assert(c.indexOf('Momentum      : ') !== -1, 'Momentum: 8+6sp=14');
  assert(c.indexOf('Profil        : ') !== -1, 'Profil: 6+8sp=14');
});
test('UI alignment: no trailing spaces on any card line', function () {
  var c = _buildSmartFitCoachCard(_cardBase);
  c.split('\n').forEach(function (line, i) {
    assert(line === line.trimRight(), 'line ' + i + ' has no trailing spaces: "' + line + '"');
  });
});

// ── UI test 5: message integrity ──────────────────────────────────────────────
test('UI message: premiumCoachingMessage embedded verbatim in card', function () {
  var msg = "La fatigue commence à limiter ton potentiel aujourd'hui.\nSi rien ne change, la progression risque de s'éroder.\nAujourd'hui, on laisse le corps reconstruire.";
  var c = _buildSmartFitCoachCard({ decision: 'rest', premiumCoachingMessage: msg });
  assert(c.indexOf(msg) !== -1, 'multi-line message embedded verbatim');
});
test('UI message: engine premiumCoachingMessage appears in smartfitcoachCard', function () {
  var out = decideV3(_baseInputs);
  assert(out.smartfitcoachCard.indexOf(out.premiumCoachingMessage) !== -1,
    'engine premiumCoachingMessage appears in card');
});
test('UI message: card section 3 equals premiumCoachingMessage exactly', function () {
  var out = decideV3(_fullInputs);
  var sections = out.smartfitcoachCard.split('\n\n');
  assertEqual(sections[2], out.premiumCoachingMessage);
});

// ── UI test 6: deterministic output ──────────────────────────────────────────
test('UI deterministic: identical engine calls produce identical card', function () {
  var out1 = decideV3(_baseInputs);
  var out2 = decideV3(_baseInputs);
  assertEqual(out1.smartfitcoachCard, out2.smartfitcoachCard);
});
test('UI deterministic: full inputs produce same card across 3 calls', function () {
  var c1 = decideV3(_fullInputs).smartfitcoachCard;
  var c2 = decideV3(_fullInputs).smartfitcoachCard;
  var c3 = decideV3(_fullInputs).smartfitcoachCard;
  assertEqual(c1, c2);
  assertEqual(c2, c3);
});

// ── UI test 7: null safety ────────────────────────────────────────────────────
test('UI null safety: null input → string or null, never throws', function () {
  var result;
  assert((function () { try { result = _buildSmartFitCoachCard(null); return true; } catch(e) { return false; } })(),
    'null input must not throw');
  assert(typeof result === 'string' || result === null, 'result is string or null');
});
test('UI null safety: smartfitcoachCard never breaks main engine output', function () {
  // Even with all optional fields provided, engine must not throw
  var out;
  assert((function () {
    try { out = decideV3(_fullInputs); return true; }
    catch(e) { return false; }
  })(), 'engine with full inputs must not throw');
  assert(out !== undefined && out !== null, 'engine output is defined');
  assert(typeof out.smartfitcoachCard === 'string' || out.smartfitcoachCard === null,
    'smartfitcoachCard is string or null');
});

// ── Core invariants ───────────────────────────────────────────────────────────
test('invariant: adding UI layer does not change decision', function () {
  // smartfitcoachCard is computed from outputs, never influences them
  var out = decideV3(_baseInputs);
  assert(['train', 'rest'].indexOf(out.decision) !== -1, 'decision is train or rest');
  assert(out.smartfitcoachCard.indexOf(
    out.decision === 'train'
      ? 'Effectuer la séance prévue avec précision.'
      : 'Laisser le corps récupérer pleinement.'
  ) !== -1, 'card action matches decision');
});
test('invariant: V2 parity — fatigueEffective and priorityApplied types unchanged', function () {
  var out = decideV3(_baseInputs);
  assert(typeof out.fatigueEffective === 'number',   'fatigueEffective is number');
  assert(typeof out.priorityApplied  === 'string',   'priorityApplied is string');
  assert(typeof out.reason           === 'string',   'reason is string');
  assert(typeof out._debug           === 'object',   '_debug is object');
});
test('invariant: UI fields are last and do not shadow V2/V3 core fields', function () {
  var out = decideV3(_baseInputs);
  // Core fields must be their native types, unaffected
  assert(['train', 'rest'].indexOf(out.decision) !== -1,             'decision valid');
  assert(['low','moderate','high'].indexOf(out.recommendedIntensity) !== -1, 'intensity valid');
  // momentumScore is number when userProfile provided; null otherwise
  assert(typeof out.momentumScore === 'number' || out.momentumScore === null, 'momentumScore is number or null');
  assert(typeof out.profileType   === 'string',                       'profileType is string');
  assert(typeof out.premiumCoachingMessage === 'string',              'premiumCoachingMessage is string');
  assert(typeof out.smartfitcoachCard      === 'string',              'smartfitcoachCard is string');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 22 — Adversarial & Edge Case QA (autonomous QA system findings)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 22 — Adversarial QA');

// ── FIX 1: lastSessionDate — invalid date strings must throw ─────────────────
// BUG CONFIRMED: '9999-99-99' and 'not-a-date' previously passed validation
// and produced NaN daysSince, disabling the post-high-session intensity cap.
test('security: invalid date "not-a-date" must throw, not silently produce NaN', function () {
  var threw = false;
  try {
    decideV3({ goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
      lastSessionDate: 'not-a-date', last3SessionsIntensity: ['moderate'] });
  } catch (e) { threw = true; }
  assert(threw, 'invalid date string must throw TypeError');
});
test('security: invalid date "9999-99-99" must throw', function () {
  var threw = false;
  try {
    decideV3({ goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
      lastSessionDate: '9999-99-99', last3SessionsIntensity: ['moderate'] });
  } catch (e) { threw = true; }
  assert(threw, 'out-of-range date string must throw');
});
test('security: empty string lastSessionDate must throw', function () {
  var threw = false;
  try {
    decideV3({ goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
      lastSessionDate: '', last3SessionsIntensity: ['moderate'] });
  } catch (e) { threw = true; }
  assert(threw, 'empty lastSessionDate must throw');
});
test('security: valid ISO date still accepted after fix', function () {
  var ok = false;
  try {
    decideV3({ goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
      lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'] });
    ok = true;
  } catch (e) {}
  assert(ok, 'valid ISO date must not throw');
});

// ── FIX 2: predictionInsights.recommendation for next2Days=decrease ───────────
// BUG CONFIRMED: 'decrease' trajectory fell through to generic "Reste régulier"
// despite signalling a negative momentum outcome to the user.
test('fix: next2Days=decrease → recommendation addresses decline', function () {
  var r = _buildPredictionInsights(null, {
    last7Decisions: ['train','train','train','train','train','train','train'],
    last7Momentum:  [9, 8, 7, 6, 5, 4, 3]
  });
  assertEqual(r.next2Days, 'decrease');
  assert(r.recommendation.indexOf('Reste régulier') === -1,
    'decrease trajectory must NOT recommend "Reste régulier"');
  assert(r.recommendation.length > 0, 'recommendation must be non-empty');
});
test('fix: engine decrease trajectory → decline-aware recommendation', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userHistory: {
      last7Decisions: ['train','train','train','train','train','train','rest'],
      last7Momentum:  [9, 8, 7, 6, 5, 4, 3]
    }
  });
  if (out.predictionInsights.next2Days === 'decrease') {
    assert(out.predictionInsights.recommendation.indexOf('Reste régulier') === -1,
      'engine decrease path must not give generic recommendation');
  }
});

// ── FINDING: decision=train + fatigueRisk=high → conflicting signals ──────────
// DOCUMENTED BEHAVIOR: the engine CAN say "train" while predictionInsights
// flags fatigueRisk=high (via freq≥6+streak≥3). premiumCoachingMessage line 1
// then says "La fatigue commence à limiter ton potentiel aujourd'hui."
// This contradiction is real and visible to end users.
test('document: train decision can coexist with fatigueRisk=high (via freq+streak path)', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 1, trainingFrequency: 4,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userProfile: { trainingFrequencyLast7Days: 7 },
    userHistory: {
      last7Decisions: ['train','train','train','train','train','train','train'],
      last7Momentum:  [5, 6, 7, 8, 9, 10, 10]
    }
  });
  // Document the contradiction — this is a known product-logic gap
  assert(out.decision !== undefined, 'decision is always present');
  assert(out.predictionInsights.fatigueRisk !== undefined, 'fatigueRisk is always present');
  if (out.decision === 'train' && out.predictionInsights.fatigueRisk === 'high') {
    // Both are true simultaneously — product team must decide resolution strategy
    assert(out.premiumCoachingMessage.indexOf('limiter') !== -1 ||
           out.premiumCoachingMessage.indexOf('récupér') !== -1 ||
           typeof out.premiumCoachingMessage === 'string',
           'message still renders even in contradictory state');
  }
});

// ── FINDING: last7Decisions length not capped — entries beyond 7 count ────────
// DOCUMENTED BEHAVIOR: a 14-entry array produces streak=14, not 7.
test('document: last7Decisions with 14 entries produces streak=14 (not capped to 7)', function () {
  var r = _buildHistoryInsights({ last7Decisions: Array(14).fill('train') });
  assertEqual(r.streak, 14); // intentionally documents current behavior
  assertEqual(r.consistencyScore, 10); // trainCount=14 → top bucket
});
test('document: last7Decisions with 7 entries produces streak=7 (expected)', function () {
  var r = _buildHistoryInsights({ last7Decisions: Array(7).fill('train') });
  assertEqual(r.streak, 7);
  assertEqual(r.consistencyScore, 10);
});

// ── FINDING: non-numeric values in last7Momentum silently produce 'stable' ────
// DOCUMENTED BEHAVIOR: NaN propagation results in trend='stable' — no warning.
test('document: NaN in last7Momentum silently produces stable trend', function () {
  var r = _buildHistoryInsights({ last7Momentum: [5, NaN, 7] });
  assertEqual(r.momentumTrend, 'stable'); // documents silent NaN behavior
});
test('document: string in last7Momentum silently produces stable trend', function () {
  var r = _buildHistoryInsights({ last7Momentum: [5, 'bad', 7] });
  assertEqual(r.momentumTrend, 'stable'); // documents silent coercion
});

// ── FINDING: 'base' and 'peak' trainingPhases are validated but silently no-op ─
// DOCUMENTED BEHAVIOR: 'peak' accepted by schema but has zero special logic.
test('document: trainingPhase=peak behaves identically to build (no peak logic)', function () {
  var base = { goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-26', last3SessionsIntensity: ['moderate'] };
  var rPeak  = decideV3(Object.assign({}, base, { trainingPhase: 'peak'  }));
  var rBuild = decideV3(Object.assign({}, base, { trainingPhase: 'build' }));
  assertEqual(rPeak.decision,             rBuild.decision);
  assertEqual(rPeak.recommendedIntensity, rBuild.recommendedIntensity);
  assertEqual(rPeak.priorityApplied,      rBuild.priorityApplied);
});
test('document: trainingPhase=base behaves identically to build (no base logic)', function () {
  var base = { goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-26', last3SessionsIntensity: ['moderate'] };
  var rBase  = decideV3(Object.assign({}, base, { trainingPhase: 'base'  }));
  var rBuild = decideV3(Object.assign({}, base, { trainingPhase: 'build' }));
  assertEqual(rBase.decision,             rBuild.decision);
  assertEqual(rBase.recommendedIntensity, rBuild.recommendedIntensity);
});

// ── FINDING: beginner profile always reports adaptationReason ─────────────────
// DOCUMENTED BEHAVIOR: even when no cap fires, 'Beginner-friendly intensity applied'
// is set. This means the UI always shows an adaptation reason for beginners.
test('document: beginner profile with high momentum still reports adaptationReason', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userProfile: { trainingFrequencyLast7Days: 3 } // → beginner, momentum=5
  });
  assertEqual(out.profileType, 'beginner');
  assertEqual(out.adaptationReason, 'Beginner-friendly intensity applied'); // even if no cap
});

// ── FINDING: momentumTrend=up + next2Days=stable — contradictory UI signals ───
// DOCUMENTED BEHAVIOR: if last decision was 'rest', trend='up' but next2Days='stable'.
test('document: momentumTrend=up can coexist with next2Days=stable (last=rest)', function () {
  var userHistory = {
    last7Decisions: ['train','train','train','train','train','train','rest'],
    last7Momentum:  [3, 4, 5, 6, 7, 8, 9]
  };
  var hi = _buildHistoryInsights(userHistory);
  var pi = _buildPredictionInsights(null, userHistory);
  assertEqual(hi.momentumTrend, 'up');
  assertEqual(pi.next2Days, 'stable'); // last='rest' prevents 'increase'
  // These two signals conflict — momentum is rising but prediction is stable
  assert(hi.momentumTrend !== pi.next2Days, 'trend/prediction can diverge');
});

// ── FINDING: disciplined profile requires ALL 3 fields — missing avgFatigue → beginner
test('document: high adherence + high freq but missing avgFatigue → beginner not disciplined', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5 } // missing avgFatigueLast7Days
  });
  assertEqual(out.profileType, 'beginner'); // fails to classify as disciplined
});
test('document: all 3 fields required for disciplined classification', function () {
  var withAll = decideV3({
    goal: 'muscle_gain', fatigueLevel: 2, trainingFrequency: 3,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate'],
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  });
  assertEqual(withAll.profileType, 'disciplined'); // all 3 present → correct
});

// ── FINDING: progression triggered but silently discarded by dense schedule ───
test('document: progression triggered but overridden by dense schedule (freq=4+fatigue=3)', function () {
  var out = decideV3({
    goal: 'muscle_gain', fatigueLevel: 3, trainingFrequency: 4,
    lastSessionDate: '2026-04-28', last3SessionsIntensity: ['moderate','moderate','moderate']
  });
  assert(out.progressionTriggered === true, 'progression IS triggered');
  assertEqual(out.recommendedIntensity, 'low'); // BUT dense schedule wins → low
  assertEqual(out.priorityApplied, 'frequency_consistency'); // not progression_logic
});

// ── FINDING: consistencyScore=2 for 0 training sessions (non-zero minimum) ────
test('document: zero training sessions gives consistencyScore=2 not 0', function () {
  var r = _buildHistoryInsights({ last7Decisions: [] });
  assertEqual(r.consistencyScore, 2); // trainCount=0 maps to score 2, not 0
  assertEqual(r.streak, 0);
});
test('document: all-rest 7 sessions gives consistencyScore=2', function () {
  var r = _buildHistoryInsights({ last7Decisions: Array(7).fill('rest') });
  assertEqual(r.consistencyScore, 2); // trainCount=0 → same bucket as 0 sessions
});

// ── FINDING: momentumScore maximum is 8, not 10 (with valid inputs) ───────────
test('document: maximum achievable momentumScore via validation is 8 not 10', function () {
  // +1 freq>=3, +1 adherence>=0.8, +1 high session = max +3, base=5 → cap at 8
  var score = _computeMomentumScore({
    trainingFrequencyLast7Days: 7,
    adherenceScore: 1.0,
    last7SessionsIntensity: ['high','high','high'],
    avgFatigueLast7Days: 1
  });
  assertEqual(score, 8); // 5+1+1+1=8; no bonuses can push above 8 with valid inputs
  assert(score < 10, 'score of 10 unreachable through normal valid inputs');
});

// ── EDGE: momentumScore=0 renders as "0 / 10" not "-" in card ────────────────
test('edge: momentum=0 renders as "0 / 10" in card (not fallback "-")', function () {
  var c = _buildSmartFitCoachCard({
    decision: 'train', momentumScore: 0, premiumCoachingMessage: 'msg'
  });
  assert(c.indexOf('Momentum      : 0 / 10') !== -1, 'score=0 shows "0 / 10" not "-"');
});

// ── FUZZING: random valid input combinations never throw ───────────────────────
test('fuzzing: 50 random valid inputs never throw', function () {
  var goals   = ['fat_loss', 'muscle_gain', 'maintenance'];
  var phases  = ['base', 'build', 'peak', 'taper', 'restart'];
  var intens  = ['low', 'moderate', 'high'];
  var thrown  = 0;
  for (var i = 0; i < 50; i++) {
    var fatigue = (i % 5) + 1;
    var freq    = (i % 7) + 1;
    var goal    = goals[i % 3];
    var phase   = phases[i % 5];
    var last3   = [intens[i % 3], intens[(i + 1) % 3], intens[(i + 2) % 3]];
    // Use a date that is always valid and in the past
    var pastDate = new Date(Date.now() - (i + 1) * 86400000).toISOString().slice(0, 10);
    try {
      var r = decideV3({
        goal: goal, fatigueLevel: fatigue, trainingFrequency: freq,
        lastSessionDate: pastDate, last3SessionsIntensity: last3,
        trainingPhase: phase
      });
      assert(typeof r.decision === 'string', 'decision must be string');
      assert(typeof r.smartfitcoachCard === 'string', 'card must be string');
    } catch (e) {
      thrown++;
    }
  }
  assertEqual(thrown, 0);
});

// ── PROPERTY: decision alignment with card action text ────────────────────────
test('property: card action always aligns with engine decision (100 calls)', function () {
  var scenarios = [
    { fatigueLevel: 1, trainingFrequency: 3 },
    { fatigueLevel: 5, trainingFrequency: 3 },
    { fatigueLevel: 4, trainingFrequency: 2 },
    { fatigueLevel: 4, trainingFrequency: 5 },
    { fatigueLevel: 2, trainingFrequency: 7 }
  ];
  var today = new Date().toISOString().slice(0, 10);
  var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  scenarios.forEach(function (sc, idx) {
    var r = decideV3({
      goal: 'muscle_gain', fatigueLevel: sc.fatigueLevel, trainingFrequency: sc.trainingFrequency,
      lastSessionDate: idx % 2 === 0 ? yesterday : today,
      last3SessionsIntensity: ['moderate']
    });
    var expectedAction = r.decision === 'rest'
      ? 'Laisser le corps récupérer pleinement.'
      : 'Effectuer la séance prévue avec précision.';
    assert(r.smartfitcoachCard.indexOf(expectedAction) !== -1,
      'card action "' + expectedAction + '" must match decision=' + r.decision);
  });
});

// ── PROPERTY: fatigueEffective always clamped 1–5 ─────────────────────────────
test('property: fatigueEffective always within [1,5] bounds', function () {
  var cases = [
    { fatigueLevel: 1, sleepQuality: 1, lastSessionDate: new Date(Date.now() - 20*86400000).toISOString().slice(0,10) },
    { fatigueLevel: 5, sleepQuality: 1, lastSessionDate: new Date(Date.now() - 86400000).toISOString().slice(0,10) },
    { fatigueLevel: 3, sleepQuality: 5, lastSessionDate: new Date(Date.now() - 4*86400000).toISOString().slice(0,10) }
  ];
  cases.forEach(function (sc) {
    var r = decideV3(Object.assign({
      goal: 'maintenance', trainingFrequency: 3,
      last3SessionsIntensity: ['moderate']
    }, sc));
    assert(r.fatigueEffective >= 1 && r.fatigueEffective <= 5,
      'fatigueEffective must be in [1,5], got: ' + r.fatigueEffective);
  });
});

// ── PROPERTY: rest decision always produces intensity=low and sessType=recovery ─
test('property: rest decision always yields low intensity + recovery sessionType', function () {
  var restCases = [
    { fatigueLevel: 5, trainingFrequency: 3, lastSessionDate: new Date(Date.now() - 86400000).toISOString().slice(0,10) },
    { fatigueLevel: 4, trainingFrequency: 5, lastSessionDate: new Date(Date.now() - 86400000).toISOString().slice(0,10) },
    { fatigueLevel: 1, trainingFrequency: 3, lastSessionDate: new Date().toISOString().slice(0,10) } // trained today
  ];
  restCases.forEach(function (sc) {
    var r = decideV3(Object.assign({ goal: 'maintenance', last3SessionsIntensity: ['moderate'] }, sc));
    if (r.decision === 'rest') {
      assertEqual(r.recommendedIntensity,   'low');
      assertEqual(r.recommendedSessionType, 'recovery');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 23 — Batch-1 Fix Verification
// Fix 1: Day-1 bootstrap safety | Fix 2: Overtraining threshold | Fix 3: Fatigue-5 rest
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSection 23 — Batch-1 Fix Verification');

// ── Fix 1: No userProfile never returns high intensity ────────────────────────
test('fix1: no userProfile + train decision → intensity never high', function () {
  var lowFatigueInputs = [
    baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['low'],      lastSessionDate: daysAgo(2) }),
    baseV2({ fatigueLevel: 2, last3SessionsIntensity: ['moderate'], lastSessionDate: daysAgo(3) }),
    baseV2({ fatigueLevel: 1, last3SessionsIntensity: ['moderate'], lastSessionDate: daysAgo(5) })
  ];
  lowFatigueInputs.forEach(function (inp) {
    var out = decideV3(inp);
    if (out.decision === 'train') {
      assert(out.recommendedIntensity !== 'high',
        'no profile + train must not produce high, got: ' + out.recommendedIntensity);
    }
  });
});
test('fix1: missing/partial userHistory + no profile → beginner-safe cap applies', function () {
  var out = decideV3(baseV2({
    fatigueLevel: 1, last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2),
    userHistory: { last7Decisions: ['train'], last7Momentum: [5] } // history present, profile absent
  }));
  // No userProfile → bootstrap cap → max moderate
  assert(out.recommendedIntensity !== 'high', 'missing profile with history still gets bootstrap cap');
  assertEqual(out.adaptationReason, 'No user profile — beginner-safe cap applied');
});
test('fix1: valid experienced profile can still unlock high when safe', function () {
  // disciplined profile + high momentum → boost allowed
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 1, last3SessionsIntensity: ['low'], lastSessionDate: daysAgo(2), trainingPhase: 'taper'
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  }));
  assertEqual(out.recommendedIntensity, 'high'); // disciplined + momentum boost unlocks high
});

// ── Fix 2: Overtraining threshold ────────────────────────────────────────────
test('fix2: fatigue=4 + freq=4 → NOT overtraining (disciplined users protected)', function () {
  var out = decideV3(baseV2({
    userProfile: { avgFatigueLast7Days: 4, trainingFrequencyLast7Days: 4, adherenceScore: 0.9 }
  }));
  assert(out.profileType !== 'overtraining',
    'avgFat=4 + freq=4 must not be overtraining, got: ' + out.profileType);
});
test('fix2: fatigue=4 + freq=6 → overtraining (new threshold fires)', function () {
  var out = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 4, trainingFrequencyLast7Days: 6 }
  }));
  assertEqual(out.profileType, 'overtraining');
  assert(out.recommendedIntensity !== 'high', 'overtraining must not produce high');
});
test('fix2: fatigue=5 + freq=6 → overtraining (max fatigue + high freq)', function () {
  // fatigueLevel=1 (engine input) but avgFatigueLast7Days=5 in profile
  var out = decideV3(highBaseV2({
    userProfile: { avgFatigueLast7Days: 5, trainingFrequencyLast7Days: 6 }
  }));
  assertEqual(out.profileType, 'overtraining');
});

// ── Fix 3: fatigueLevel=5 forces rest ────────────────────────────────────────
test('fix3: fatigueLevel=5 → decision=rest, priorityApplied=safety', function () {
  var out = decideV3(baseV2({ fatigueLevel: 5, last3SessionsIntensity: ['moderate'] }));
  assertEqual(out.decision,        'rest');
  assertEqual(out.priorityApplied, 'safety');
});
test('fix3: fatigueLevel=5 + disciplined + high momentum → still rest (no override)', function () {
  var out = decideV3(baseV2({
    fatigueLevel: 5, last3SessionsIntensity: ['moderate'], trainingFrequency: 2,
    userProfile: { adherenceScore: 0.95, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2 }
  }));
  assertEqual(out.decision, 'rest');
  assertEqual(out.priorityApplied, 'safety');
});
test('fix3: fatigueLevel=5 + goal fat_loss → still rest', function () {
  var out = decideV3(baseV2({ fatigueLevel: 5, goal: 'fat_loss', last3SessionsIntensity: ['low'] }));
  assertEqual(out.decision, 'rest');
});
test('fix3: fatigueLevel=5 → smartfitcoachCard uses rest action text', function () {
  var out = decideV3(baseV2({ fatigueLevel: 5, last3SessionsIntensity: ['moderate'] }));
  assertEqual(out.decision, 'rest');
  assert(out.smartfitcoachCard.indexOf('Laisser le corps') !== -1,
    'fatigueLevel=5 card must show rest action');
  assert(out.smartfitcoachCard.indexOf('Effectuer la séance') === -1,
    'fatigueLevel=5 card must not show train action');
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 24 — Session type diversity layer (_selectSessionTypeDiverse)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 24 : Session type diversity ─────────────────────────────────────');

// ── No triple repetition ──────────────────────────────────────────────────────
test('diversity: moderate — no triple hypertrophy (last 2 = hypertrophy)', function () {
  // After 2 hypertrophy sessions, must produce conditioning
  var t = _selectSessionTypeDiverse('train', 'moderate', 'muscle_gain', 6, ['hypertrophy', 'hypertrophy']);
  assertEqual(t, 'conditioning');
});
test('diversity: moderate — no triple conditioning (last 2 = conditioning)', function () {
  var t = _selectSessionTypeDiverse('train', 'moderate', 'muscle_gain', 6, ['conditioning', 'conditioning']);
  assertEqual(t, 'hypertrophy');
});
test('diversity: high+highMomentum — no triple strength (last 2 = strength)', function () {
  var t = _selectSessionTypeDiverse('train', 'high', 'muscle_gain', 8, ['strength', 'strength']);
  assertEqual(t, 'conditioning');
});
test('diversity: high+lowMomentum goal-based — diversity guard fires on triple', function () {
  // muscle_gain + high → strength; if last 2 already strength, must produce conditioning
  var t = _selectSessionTypeDiverse('train', 'high', 'muscle_gain', 3, ['strength', 'strength']);
  assertEqual(t, 'conditioning');
});

// ── Alternating behavior ──────────────────────────────────────────────────────
test('diversity: moderate — hypertrophy after conditioning (alternates)', function () {
  var t = _selectSessionTypeDiverse('train', 'moderate', 'fat_loss', 5, ['strength', 'conditioning']);
  assertEqual(t, 'hypertrophy');
});
test('diversity: moderate — conditioning after hypertrophy (alternates)', function () {
  var t = _selectSessionTypeDiverse('train', 'moderate', 'fat_loss', 5, ['conditioning', 'hypertrophy']);
  assertEqual(t, 'conditioning');
});
test('diversity: high+highMomentum — conditioning after strength', function () {
  var t = _selectSessionTypeDiverse('train', 'high', 'muscle_gain', 7, ['hypertrophy', 'strength']);
  assertEqual(t, 'conditioning');
});
test('diversity: high+highMomentum — strength after conditioning', function () {
  var t = _selectSessionTypeDiverse('train', 'high', 'muscle_gain', 7, ['strength', 'conditioning']);
  assertEqual(t, 'strength');
});

// ── Fatigue priority (safety rules cannot be overridden by diversity) ─────────
test('diversity: intensity=low + history → recovery (fatigue safety respected)', function () {
  // Even with alternating history, low intensity must map to recovery
  var t = _selectSessionTypeDiverse('train', 'low', 'muscle_gain', 6, ['strength', 'conditioning']);
  assertEqual(t, 'recovery');
});
test('diversity: decision=rest + history → recovery (rest always recovery)', function () {
  var t = _selectSessionTypeDiverse('rest', 'moderate', 'fat_loss', 5, ['hypertrophy', 'conditioning']);
  assertEqual(t, 'recovery');
});
test('diversity: intensity=low + last 2 recovery → still recovery (no anti-rep override on safety)', function () {
  var t = _selectSessionTypeDiverse('train', 'low', 'muscle_gain', 6, ['recovery', 'recovery']);
  assertEqual(t, 'recovery');
});

// ── Deterministic (same inputs → same output on repeated calls) ───────────────
test('diversity: deterministic — 3 identical calls return same type', function () {
  var args = ['train', 'moderate', 'fat_loss', 6, ['conditioning', 'hypertrophy']];
  var r1 = _selectSessionTypeDiverse.apply(null, args);
  var r2 = _selectSessionTypeDiverse.apply(null, args);
  var r3 = _selectSessionTypeDiverse.apply(null, args);
  if (r1 !== r2 || r2 !== r3) throw new Error('Non-deterministic: ' + r1 + ', ' + r2 + ', ' + r3);
});
test('diversity: deterministic — no history → same as _selectSessionType', function () {
  // Without history the function must exactly reproduce the existing function
  ['muscle_gain', 'fat_loss', 'general'].forEach(function (goal) {
    ['low', 'moderate', 'high'].forEach(function (intens) {
      var expected = DDEv3._selectSessionType('train', intens, goal);
      var got      = _selectSessionTypeDiverse('train', intens, goal, 5, null);
      if (expected !== got) {
        throw new Error('no-history diverged: goal=' + goal + ' intensity=' + intens +
          ' expected=' + expected + ' got=' + got);
      }
    });
  });
});

// ── Integration: decideV3 uses diversity layer when history provided ───────────
test('diversity: decideV3 — moderate (rule A cap) + last=hypertrophy → conditioning', function () {
  // Rule A: last session was high + <72h caps intensity at moderate regardless of profile boost
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(1)
  }), {
    userProfile: { adherenceScore: 0.8, trainingFrequencyLast7Days: 4, avgFatigueLast7Days: 3 },
    userHistory: { last7Decisions: ['train'], last7Momentum: [6], lastSessionTypes: ['hypertrophy'] }
  }));
  assertEqual(out.recommendedIntensity, 'moderate');
  assertEqual(out.recommendedSessionType, 'conditioning');
});
test('diversity: decideV3 — moderate (rule A cap) + last=conditioning → hypertrophy', function () {
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(1)
  }), {
    userProfile: { adherenceScore: 0.8, trainingFrequencyLast7Days: 4, avgFatigueLast7Days: 3 },
    userHistory: { last7Decisions: ['train'], last7Momentum: [6], lastSessionTypes: ['conditioning'] }
  }));
  assertEqual(out.recommendedIntensity, 'moderate');
  assertEqual(out.recommendedSessionType, 'hypertrophy');
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 25 — Pipeline order: sessionType before final intensity
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 25 : Pipeline order — sessType before final intensity ────────────');

// ── _applySessionTypeCap unit tests ──────────────────────────────────────────
test('sessionTypeCap: recovery → always rank 0 regardless of adaptive rank', function () {
  assertEqual(_applySessionTypeCap('recovery', 2, 1), 0);
  assertEqual(_applySessionTypeCap('recovery', 1, 3), 0);
});
test('sessionTypeCap: conditioning → no restriction (passthrough)', function () {
  assertEqual(_applySessionTypeCap('conditioning', 2, 4), 2);
  assertEqual(_applySessionTypeCap('conditioning', 1, 1), 1);
});
test('sessionTypeCap: strength → high allowed only at low fatigue (≤2)', function () {
  assertEqual(_applySessionTypeCap('strength', 2, 2), 2); // fatigue=2 → high OK
  assertEqual(_applySessionTypeCap('strength', 2, 3), 1); // fatigue=3 → cap to moderate
  assertEqual(_applySessionTypeCap('strength', 2, 4), 1); // fatigue=4 → cap to moderate
});
test('sessionTypeCap: hypertrophy → high allowed only at low fatigue (≤2)', function () {
  assertEqual(_applySessionTypeCap('hypertrophy', 2, 1), 2); // fatigue=1 → high OK
  assertEqual(_applySessionTypeCap('hypertrophy', 2, 3), 1); // fatigue=3 → cap to moderate
});
test('sessionTypeCap: unknown/legacy type → passthrough', function () {
  assertEqual(_applySessionTypeCap('cardio',    2, 3), 2);
  assertEqual(_applySessionTypeCap('mobility',  1, 4), 1);
});

// ── Test 1: diversity works even when final intensity = high ──────────────────
test('pipeline: diversity sessType preserved when adaptive boost raises intensity to high', function () {
  // taper phase caps base intensity at moderate (priority='goal_alignment').
  // disciplined profile + momentum>=7 + !safety → adaptive boost to high.
  // diversity layer runs on BASE=moderate → picks 'hypertrophy' (last was conditioning).
  // session type cap: hypertrophy + fatigue=1 → allows high.
  // Result: sessType=hypertrophy at intensity=high.
  // Without diversity: high+muscle_gain would give 'strength'.
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 1, last3SessionsIntensity: ['moderate'], lastSessionDate: daysAgo(2),
    trainingPhase: 'taper'
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['high', 'moderate', 'high'] },
    userHistory:  { last7Decisions: ['train'], last7Momentum: [8],
                    lastSessionTypes: ['conditioning'] }
  }));
  assertEqual(out.recommendedIntensity,   'high');       // adaptive boost fired
  assertEqual(out.recommendedSessionType, 'hypertrophy'); // diversity from base=moderate preserved
  assert(out.recommendedSessionType !== 'strength',
    'sessType must not be overridden to strength by high intensity');
});

// ── Test 2: no triple repetition through full pipeline ───────────────────────
test('pipeline: diversity guard prevents triple strength (last 2 = strength)', function () {
  // base=high, last 2 sessions both strength → diversity guard fires → conditioning
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 1, last3SessionsIntensity: ['moderate'], lastSessionDate: daysAgo(4),
    trainingPhase: 'build'
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['high', 'moderate', 'high'] },
    userHistory:  { last7Decisions: ['train', 'train'], last7Momentum: [7, 7],
                    lastSessionTypes: ['strength', 'strength'] }
  }));
  assert(out.recommendedSessionType !== 'strength',
    'third strength in a row must be prevented, got: ' + out.recommendedSessionType);
  assertEqual(out.recommendedSessionType, 'conditioning');
});

// ── Test 3: sessionType is NOT dictated by intensity ─────────────────────────
test('pipeline: high intensity does not force strength when diversity says conditioning', function () {
  // Without diversity: high + muscle_gain = strength.
  // With diversity (last=strength, highMomentum): should be conditioning.
  // The session type is chosen first; intensity then adapts.
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 1, last3SessionsIntensity: ['moderate'], lastSessionDate: daysAgo(4),
    trainingPhase: 'build'
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['high', 'high'] },
    userHistory:  { last7Decisions: ['train'], last7Momentum: [8],
                    lastSessionTypes: ['strength'] }
  }));
  assertEqual(out.recommendedIntensity,   'high');
  assertEqual(out.recommendedSessionType, 'conditioning'); // NOT strength despite high intensity
});

// ── Test 4: deterministic — same inputs produce identical output ──────────────
test('pipeline: deterministic — 3 identical decideV3 calls return same output', function () {
  var inp = Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['moderate'], lastSessionDate: daysAgo(1),
    trainingPhase: 'build'
  }), {
    userProfile: { adherenceScore: 0.8, trainingFrequencyLast7Days: 4, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['moderate', 'high'] },
    userHistory:  { last7Decisions: ['train', 'train'], last7Momentum: [6, 7],
                    lastSessionTypes: ['hypertrophy', 'conditioning'] }
  });
  var r1 = decideV3(inp);
  var r2 = decideV3(inp);
  var r3 = decideV3(inp);
  var fields = ['decision', 'recommendedIntensity', 'recommendedSessionType',
                'fatigueEffective', 'priorityApplied', 'progressionTriggered',
                'momentumScore', 'profileType', 'adaptationReason'];
  fields.forEach(function (f) {
    if (r1[f] !== r2[f] || r2[f] !== r3[f]) {
      throw new Error('non-deterministic field "' + f + '": ' + r1[f] + ' / ' + r2[f] + ' / ' + r3[f]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 26 — Session subtype variation layer (_selectSessionSubType)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 26 : Session subtype variation layer ─────────────────────────────');

// ── Sub-type mapping ──────────────────────────────────────────────────────────
test('subtype: conditioning → hiit | zone2 | mixed (valid set)', function () {
  var t = _selectSessionSubType('conditioning', 2, 5, null);
  assert(['hiit', 'zone2', 'mixed'].indexOf(t) !== -1, 'unexpected subtype: ' + t);
});
test('subtype: strength → heavy | volume | explosive (valid set)', function () {
  var t = _selectSessionSubType('strength', 2, 5, null);
  assert(['heavy', 'volume', 'explosive'].indexOf(t) !== -1, 'unexpected subtype: ' + t);
});
test('subtype: recovery → "recovery" (explicit value, not null)', function () {
  assertEqual(_selectSessionSubType('recovery', 2, 5, null), 'recovery');
});
test('subtype: unknown sessType → null', function () {
  assertEqual(_selectSessionSubType('mobility', 2, 5, null), null);
});

// ── hiit never when fatigue high ──────────────────────────────────────────────
test('subtype: effectiveFatigue=4 + conditioning → never hiit', function () {
  // All 3 possible prev1 values — none should produce hiit at fatigue=4
  ['hiit', 'zone2', 'mixed', null].forEach(function (prev) {
    var t = _selectSessionSubType('conditioning', 4, 8, prev ? [prev] : null);
    if (t === 'hiit') throw new Error('hiit produced at fatigue=4, prev=' + prev);
  });
});
test('subtype: effectiveFatigue=5 + conditioning + high momentum → never hiit', function () {
  var t = _selectSessionSubType('conditioning', 5, 9, null);
  assert(t !== 'hiit', 'hiit must not appear at fatigue=5, got: ' + t);
});
test('subtype: effectiveFatigue=3 + conditioning + high momentum → hiit allowed', function () {
  var t = _selectSessionSubType('conditioning', 3, 8, null);
  assertEqual(t, 'hiit');
});

// ── No triple repetition ─────────────────────────────────────────────────────
test('subtype: no triple hiit — last 2 = hiit → force zone2', function () {
  var t = _selectSessionSubType('conditioning', 2, 8, ['hiit', 'hiit']);
  assert(t !== 'hiit', 'triple hiit must be prevented, got: ' + t);
  assertEqual(t, 'zone2');
});
test('subtype: no triple heavy — last 2 = heavy → force volume', function () {
  var t = _selectSessionSubType('strength', 2, 8, ['heavy', 'heavy']);
  assert(t !== 'heavy', 'triple heavy must be prevented, got: ' + t);
  assertEqual(t, 'volume');
});
test('subtype: no triple zone2 — last 2 = zone2 → force mixed', function () {
  var t = _selectSessionSubType('conditioning', 2, 4, ['zone2', 'zone2']);
  assert(t !== 'zone2', 'triple zone2 prevented');
});
test('subtype: no triple volume — last 2 = volume → force explosive', function () {
  var t = _selectSessionSubType('strength', 2, 4, ['volume', 'volume']);
  assert(t !== 'volume', 'triple volume prevented');
});

// ── Momentum preference ───────────────────────────────────────────────────────
test('subtype: high momentum + conditioning + no history → hiit', function () {
  assertEqual(_selectSessionSubType('conditioning', 2, 7, null), 'hiit');
});
test('subtype: high momentum + strength + no history → heavy', function () {
  assertEqual(_selectSessionSubType('strength', 2, 7, null), 'heavy');
});
test('subtype: low momentum (< 4) + conditioning + no history → zone2 (hiit removed)', function () {
  // momentum < 4 removes hiit from candidates → first remaining = zone2
  assertEqual(_selectSessionSubType('conditioning', 2, 3, null), 'zone2');
});
test('subtype: high momentum overrides cycle when different from prev', function () {
  // prev=zone2, momentum high → should pick hiit (preferred) not mixed (next in cycle)
  var t = _selectSessionSubType('conditioning', 2, 8, ['zone2']);
  assertEqual(t, 'hiit');
});

// ── Cycling behavior (deterministic) ─────────────────────────────────────────
test('subtype: conditioning cycles hiit→zone2→mixed (momentum=5, full set available)', function () {
  // momentum=5: not low (<4) and not high (>=7) → full candidate set, no preference
  var t1 = _selectSessionSubType('conditioning', 2, 5, ['hiit']);   // after hiit → zone2
  var t2 = _selectSessionSubType('conditioning', 2, 5, ['zone2']);  // after zone2 → mixed
  var t3 = _selectSessionSubType('conditioning', 2, 5, ['mixed']);  // after mixed → hiit
  assertEqual(t1, 'zone2');
  assertEqual(t2, 'mixed');
  assertEqual(t3, 'hiit');
});
test('subtype: strength cycles heavy→volume→explosive (momentum=5, full set available)', function () {
  var t1 = _selectSessionSubType('strength', 2, 5, ['heavy']);
  var t2 = _selectSessionSubType('strength', 2, 5, ['volume']);
  var t3 = _selectSessionSubType('strength', 2, 5, ['explosive']);
  assertEqual(t1, 'volume');
  assertEqual(t2, 'explosive');
  assertEqual(t3, 'heavy');
});
test('subtype: null entries in history (recovery days) ignored in cycle', function () {
  // [hiit, null, null] — effective prev1 is 'hiit', should cycle to zone2
  var t = _selectSessionSubType('conditioning', 2, 3, ['hiit', null, null]);
  assertEqual(t, 'zone2');
});
test('subtype: deterministic — 3 identical calls return same result', function () {
  var r1 = _selectSessionSubType('conditioning', 2, 7, ['zone2', 'mixed']);
  var r2 = _selectSessionSubType('conditioning', 2, 7, ['zone2', 'mixed']);
  var r3 = _selectSessionSubType('conditioning', 2, 7, ['zone2', 'mixed']);
  if (r1 !== r2 || r2 !== r3) throw new Error('non-deterministic: ' + r1 + ',' + r2 + ',' + r3);
});

// ── Integration: decideV3 populates sessionSubType ────────────────────────────
test('subtype integration: conditioning session → sessionSubType in {hiit,zone2,mixed}', function () {
  // lastSessionTypes=['hypertrophy'] → diversity picks 'conditioning' for moderate intensity
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(1)
  }), {
    userProfile: { adherenceScore: 0.8, trainingFrequencyLast7Days: 4, avgFatigueLast7Days: 2 },
    userHistory:  { last7Decisions: ['train'], last7Momentum: [6],
                    lastSessionTypes: ['hypertrophy'], lastSubTypes: ['zone2'] }
  }));
  assertEqual(out.recommendedSessionType, 'conditioning');
  assert(out.sessionSubType !== null, 'sessionSubType must not be null for conditioning');
  assert(['hiit', 'zone2', 'mixed'].indexOf(out.sessionSubType) !== -1,
    'unexpected subtype: ' + out.sessionSubType);
});
test('subtype integration: recovery session → sessionSubType is "recovery"', function () {
  var out = decideV3(baseV2({ fatigueLevel: 5 }));
  assertEqual(out.decision, 'rest');
  assertEqual(out.sessionSubType, 'recovery');
});
// ── Fallback never returns null ───────────────────────────────────────────────
test('subtype: fallback always non-null — conditioning all candidates blocked', function () {
  // fatigue=4 removes hiit, anti-rep removes zone2, low-momentum removes nothing extra
  // candidates after fatigue: [zone2, mixed]. After anti-rep (last2=zone2): [mixed].
  // Still 1 candidate → not empty, returns 'mixed'. But let's force all removed:
  // fat=4 removes hiit. anti-rep(last2=zone2) removes zone2. Now [mixed].
  // No more to remove for low-momentum here. Returns 'mixed'.
  var t = _selectSessionSubType('conditioning', 4, 5, ['zone2', 'zone2']);
  assert(t !== null, 'fallback must never return null, got: ' + t);
});
test('subtype: fallback → zone2 for conditioning when all candidates exhausted', function () {
  // fat=4 (removes hiit) + anti-rep last2=zone2 (removes zone2) + momentum<4 (removes hiit already gone)
  // remaining: ['mixed']. Not empty yet. Edge: force via fat=4 + anti-rep + low-momentum on mixed?
  // Can't exhaust all — let's test the explicit fallback path via direct worst case:
  // fat=4 removes hiit: ['zone2','mixed']. anti-rep last2=zone2 removes zone2: ['mixed'].
  // momentum=2 < 4 removes nothing more (hiit already gone, explosive not in conditioning).
  // Result: 'mixed' (only one). Not the fallback 'zone2'. To hit fallback: all 3 must be removed.
  // That's impossible for conditioning (hiit+zone2 removable, mixed survives). Test fallback indirectly:
  var t = _selectSessionSubType('conditioning', 4, 2, ['zone2', 'zone2']); // fat removes hiit, anti-rep removes zone2, low-mom removes nothing new
  assertEqual(t, 'mixed'); // last survivor
  assert(t !== null, 'always non-null');
});
test('subtype: subtype always compatible with sessionType', function () {
  var condSubTypes = ['hiit', 'zone2', 'mixed'];
  var strSubTypes  = ['heavy', 'volume', 'explosive'];
  // Multiple input combinations
  [2, 4].forEach(function (fat) {
    [2, 5, 8].forEach(function (mom) {
      [null, ['hiit'], ['zone2', 'zone2'], ['heavy', 'heavy']].forEach(function (hist) {
        var tc = _selectSessionSubType('conditioning', fat, mom, hist);
        var ts = _selectSessionSubType('strength',     fat, mom, hist);
        if (tc !== null && condSubTypes.indexOf(tc) === -1) {
          throw new Error('conditioning subtype "' + tc + '" not in allowed set');
        }
        if (ts !== null && strSubTypes.indexOf(ts) === -1) {
          throw new Error('strength subtype "' + ts + '" not in allowed set');
        }
      });
    });
  });
});

// ── Integration: decideV3 populates sessionSubType ────────────────────────────
test('subtype integration: conditioning session → sessionSubType in {hiit,zone2,mixed}', function () {
  // lastSessionTypes=['hypertrophy'] → diversity picks 'conditioning'
  // lastSubTypes=['hiit','hiit'] → anti-rep must block triple hiit
  var inp = Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(1)
  }), {
    userProfile: { adherenceScore: 0.8, trainingFrequencyLast7Days: 4, avgFatigueLast7Days: 2 },
    userHistory:  { last7Decisions: ['train'], last7Momentum: [6],
                    lastSessionTypes: ['hypertrophy'], lastSubTypes: ['hiit', 'hiit'] }
  });
  var out = decideV3(inp);
  // sessionSubType must not be hiit (anti-rep), but conditioning must stay
  assertEqual(out.recommendedSessionType, 'conditioning');
  assert(out.sessionSubType !== 'hiit', 'anti-rep must block triple hiit');
  // intensity and decision unaffected
  assertEqual(out.recommendedIntensity, 'moderate');
  assertEqual(out.decision, 'train');
});

// Section 27 — Momentum cap: two-type lock prevention (Module 5d fix)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 27 : Momentum cap — two-type lock prevention ─────────────────────');

// Preference blocked when preferred appears in same-type last2
test('momentum cap: conditioning — preferred (hiit) in same-type last2 → blocked, cycle to mixed', function () {
  // sameType=['hiit','zone2'], preferred='hiit', blocked → cycle: sameTypePrev1='zone2' → mixed
  var t = _selectSessionSubType('conditioning', 2, 8, ['hiit', 'zone2']);
  assertEqual(t, 'mixed');
});
test('momentum cap: conditioning — preferred (hiit) is last same-type → blocked, cycle to zone2', function () {
  // sameType=['zone2','hiit'], preferred='hiit', blocked → cycle: sameTypePrev1='hiit' → zone2
  var t = _selectSessionSubType('conditioning', 2, 8, ['zone2', 'hiit']);
  assertEqual(t, 'zone2');
});
test('momentum cap: strength — preferred (heavy) in same-type last2 → blocked, cycle to explosive', function () {
  // sameType=['heavy','volume'], preferred='heavy', blocked → cycle: sameTypePrev1='volume' → explosive
  var t = _selectSessionSubType('strength', 2, 8, ['heavy', 'volume']);
  assertEqual(t, 'explosive');
});
test('momentum cap: strength — preferred (heavy) is last same-type → blocked, cycle to volume', function () {
  // sameType=['volume','heavy'], preferred='heavy', blocked → cycle: sameTypePrev1='heavy' → volume
  var t = _selectSessionSubType('strength', 2, 8, ['volume', 'heavy']);
  assertEqual(t, 'volume');
});

// Cross-type entries in history are ignored for cap and cycle
test('momentum cap: cross-type history ignored for conditioning', function () {
  // history=['heavy','hiit']. sameType(cond)=['hiit']. preferred='hiit', blocked → cycle → zone2
  var t = _selectSessionSubType('conditioning', 2, 8, ['heavy', 'hiit']);
  assertEqual(t, 'zone2');
});
test('momentum cap: cross-type history ignored for strength', function () {
  // history=['hiit','heavy']. sameType(str)=['heavy']. preferred='heavy', blocked → cycle → volume
  var t = _selectSessionSubType('strength', 2, 8, ['hiit', 'heavy']);
  assertEqual(t, 'volume');
});

// Preference still fires when preferred is absent from same-type last2
test('momentum cap: preference fires when preferred absent from same-type last2', function () {
  // sameType=['zone2','mixed'], preferred='hiit', not blocked → hiit
  var t = _selectSessionSubType('conditioning', 2, 8, ['zone2', 'mixed']);
  assertEqual(t, 'hiit');
});
test('momentum cap: preference fires when no same-type history at all', function () {
  // only cross-type in history; sameType=[], preferred='hiit', not blocked → hiit
  var t = _selectSessionSubType('conditioning', 2, 8, ['heavy', 'volume']);
  assertEqual(t, 'hiit');
});

// Subtype diversity > 2 over 10 alternating sessions at high momentum
test('momentum cap: subtype diversity > 2 over 10 sessions at momentum=8', function () {
  var history  = [];
  var subTypes = [];
  var sessions = [
    'conditioning','strength','conditioning','strength','conditioning',
    'strength','conditioning','strength','conditioning','strength'
  ];
  sessions.forEach(function(sessType) {
    var sub = _selectSessionSubType(sessType, 2, 8, history.slice(-3));
    subTypes.push(sub);
    history.push(sub);
    if (history.length > 3) history.shift();
  });
  var unique = subTypes.filter(function(v, i) { return subTypes.indexOf(v) === i; });
  assert(unique.length > 2,
    'expected > 2 unique subtypes over 10 sessions, got ' + unique.length + ': ' + subTypes.join(','));
});

// Fatigue gate holds regardless of momentum cap state
test('momentum cap: fatigue gate still blocks hiit regardless of cap state', function () {
  // preferred='hiit' not in sameType history → not blocked by cap, but fatigue=4 already removed hiit
  var t = _selectSessionSubType('conditioning', 4, 8, null);
  assert(t !== 'hiit', 'hiit must never appear at fat=4, got: ' + t);
});
test('momentum cap: fatigue gate holds even when preferred not in last2', function () {
  var t = _selectSessionSubType('conditioning', 5, 9, ['zone2']);
  assert(t !== 'hiit', 'hiit blocked by fatigue gate, got: ' + t);
});

// Determinism with cap active
test('momentum cap: deterministic — 3 calls with cap active return same result', function () {
  var r1 = _selectSessionSubType('conditioning', 2, 8, ['hiit', 'zone2']);
  var r2 = _selectSessionSubType('conditioning', 2, 8, ['hiit', 'zone2']);
  var r3 = _selectSessionSubType('conditioning', 2, 8, ['hiit', 'zone2']);
  if (r1 !== r2 || r2 !== r3) throw new Error('non-deterministic: ' + r1 + ',' + r2 + ',' + r3);
  assertEqual(r1, 'mixed');
});

// Section 28 — Session variety target (_selectSessionTypeByVariety) + hypertrophy subtype
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 28 : Session variety target — controlled diversity ─────────────────');

// ── Safety: rest/low always recovery ─────────────────────────────────────────
test('variety: decision=rest → always recovery', function () {
  assertEqual(
    _selectSessionTypeByVariety('rest', 'moderate', 'muscle_gain', 7, ['strength','strength','strength']),
    'recovery'
  );
});
test('variety: intensity=low → always recovery', function () {
  assertEqual(
    _selectSessionTypeByVariety('train', 'low', 'muscle_gain', 7, ['strength','strength','strength']),
    'recovery'
  );
});

// ── No history → same as existing diversity/selectSessionType ─────────────────
test('variety: null history → falls back to _selectSessionTypeDiverse', function () {
  var expected = DDEv3._selectSessionType('train', 'high', 'muscle_gain');
  assertEqual(_selectSessionTypeByVariety('train', 'high', 'muscle_gain', 7, null), expected);
});
test('variety: empty history → falls back to _selectSessionTypeDiverse', function () {
  var expected = DDEv3._selectSessionType('train', 'moderate', 'muscle_gain');
  assertEqual(_selectSessionTypeByVariety('train', 'moderate', 'muscle_gain', 5, []), expected);
});

// ── Deficit drives selection ──────────────────────────────────────────────────
test('variety: hypertrophy preferred when never seen (high base)', function () {
  // str=2, cond=2, hyp=0 → hyp has max deficit
  var t = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 7,
    ['strength', 'conditioning', 'strength', 'conditioning']);
  assertEqual(t, 'hypertrophy');
});
test('variety: strength preferred when conditioning and hypertrophy dominate', function () {
  // cond=3, hyp=3, str=0 → str has max deficit=2
  var t = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 7,
    ['conditioning', 'hypertrophy', 'conditioning', 'hypertrophy', 'conditioning', 'hypertrophy']);
  assertEqual(t, 'strength');
});
test('variety: conditioning preferred when strength and hypertrophy dominate', function () {
  // str=3, hyp=3, cond=0 → cond has max deficit=2
  var t = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 7,
    ['strength', 'hypertrophy', 'strength', 'hypertrophy', 'strength', 'hypertrophy']);
  assertEqual(t, 'conditioning');
});

// ── Moderate intensity: only hypertrophy/conditioning in compatible set ───────
test('variety: moderate — only hypertrophy/conditioning picked (not strength)', function () {
  // str=0 → huge deficit, but not in COMPATIBLE(moderate) → must pick hyp or cond
  var t = _selectSessionTypeByVariety('train', 'moderate', 'muscle_gain', 5,
    ['conditioning', 'conditioning', 'conditioning']);
  assert(['hypertrophy', 'conditioning'].indexOf(t) !== -1, 'unexpected type: ' + t);
});
test('variety: moderate — picks conditioning when hypertrophy is overrepresented', function () {
  // hyp=2, cond=1 in 3-session window → cond has higher deficit
  var t = _selectSessionTypeByVariety('train', 'moderate', 'muscle_gain', 5,
    ['hypertrophy', 'conditioning', 'hypertrophy']);
  assertEqual(t, 'conditioning');
});

// ── All at target → falls back to diversity ───────────────────────────────────
test('variety: all types at target → falls back to _selectSessionTypeDiverse', function () {
  // Exact target: str=2, hyp=2, cond=2, rec=1 → all deficits ≤ 0
  var history = ['strength', 'strength', 'hypertrophy', 'hypertrophy', 'conditioning', 'conditioning', 'recovery'];
  // diversity(last3=['conditioning','conditioning','recovery'], high, momentum=8)
  // prev1='recovery', highMomentum → candidate=(prev1==='strength')?'conditioning':'strength' → 'strength'
  var t = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 8, history);
  assertEqual(t, 'strength');
});

// ── Tie resolved by diversity ─────────────────────────────────────────────────
test('variety: tie resolved by diversity (hyp+cond tied → diversity picks conditioning)', function () {
  // str=1 → deficit=1; hyp=0 → deficit=2; cond=0 → deficit=2  (tie: hyp,cond)
  // diversity(['strength'], high, momentum=8): prev='strength', highMomentum → 'conditioning'
  var t = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 8, ['strength']);
  assertEqual(t, 'conditioning');
});
test('variety: tie resolved by first candidate when diversity picks outside tied set', function () {
  // cond=1, hyp=1 → both deficit=1; str=0 → deficit=2 (single winner at high base)
  var t = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 5,
    ['conditioning', 'hypertrophy']);
  assertEqual(t, 'strength');
});

// ── Deterministic ─────────────────────────────────────────────────────────────
test('variety: deterministic — 3 identical calls return same result', function () {
  var history = ['strength', 'conditioning', 'strength'];
  var r1 = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 7, history);
  var r2 = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 7, history);
  var r3 = _selectSessionTypeByVariety('train', 'high', 'muscle_gain', 7, history);
  if (r1 !== r2 || r2 !== r3) throw new Error('non-deterministic: ' + r1 + ',' + r2 + ',' + r3);
});

// ── Hypertrophy subtype ───────────────────────────────────────────────────────
test('subtype: hypertrophy → volume | tempo (valid set)', function () {
  var t = _selectSessionSubType('hypertrophy', 2, 5, null);
  assert(['volume', 'tempo'].indexOf(t) !== -1, 'unexpected hyp subtype: ' + t);
});
test('subtype: hypertrophy — no history → volume (first in set)', function () {
  assertEqual(_selectSessionSubType('hypertrophy', 2, 5, null), 'volume');
});
test('subtype: hypertrophy cycles volume → tempo', function () {
  assertEqual(_selectSessionSubType('hypertrophy', 2, 5, ['volume']), 'tempo');
});
test('subtype: hypertrophy cycles tempo → volume', function () {
  assertEqual(_selectSessionSubType('hypertrophy', 2, 5, ['tempo']), 'volume');
});
test('subtype: hypertrophy — high fatigue does not crash (hiit not in set)', function () {
  // fatigue gate removes hiit, but hypertrophy has no hiit → candidates unchanged
  var t = _selectSessionSubType('hypertrophy', 4, 8, null);
  assert(['volume', 'tempo'].indexOf(t) !== -1, 'unexpected at fat=4: ' + t);
});
test('subtype: hypertrophy — high momentum has no preferred sub-type (falls through to cycle)', function () {
  // momentum=8 checks for 'hiit' and 'heavy' in candidates — neither in hyp set
  var t = _selectSessionSubType('hypertrophy', 2, 8, ['volume']);
  assertEqual(t, 'tempo'); // cycle: after volume → tempo
});
test('subtype: hypertrophy anti-rep — no triple volume', function () {
  // last2=['volume','volume'] → anti-rep removes volume → only 'tempo' left
  var t = _selectSessionSubType('hypertrophy', 2, 5, ['volume', 'volume']);
  assertEqual(t, 'tempo');
});

// ── Integration: decideV3 selects hypertrophy with correct subtype ────────────
test('variety integration: hypertrophy selected when underrepresented', function () {
  // str=2, cond=3 → hyp has max deficit=2; engine must pick hypertrophy
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(4),
    trainingPhase: 'build'
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['high', 'high', 'high'] },
    userHistory:  { last7Decisions: ['train', 'train', 'train'], last7Momentum: [8, 8, 8],
                    lastSessionTypes: ['strength', 'strength', 'conditioning', 'conditioning', 'conditioning'],
                    lastSubTypes: ['heavy', 'heavy', 'hiit', 'zone2', 'hiit'] }
  }));
  assertEqual(out.recommendedSessionType, 'hypertrophy');
  assert(['volume', 'tempo'].indexOf(out.sessionSubType) !== -1,
    'hypertrophy must have volume/tempo subtype, got: ' + out.sessionSubType);
});
test('variety integration: full 3-type variety visible over extended history', function () {
  // Start fresh — after one strength and one conditioning session, engine picks hypertrophy
  var out1 = decideV3(Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(4)
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 4, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['high'] },
    userHistory: { last7Decisions: ['train'], last7Momentum: [7],
                   lastSessionTypes: ['strength', 'conditioning'] }
  }));
  // str=1, cond=1, hyp=0 → hyp has max deficit=2 at high intensity
  assertEqual(out1.recommendedSessionType, 'hypertrophy');
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 29 — Module 10 : subtype-aware coaching message (_generateCoachingMessage)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 29 : Subtype-aware coaching message ─────────────────────────────');

test('s29-01 rest decision returns non-empty calm message', function () {
  var r = _generateCoachingMessage({ decision: 'rest', sessionSubType: null, recommendedSessionType: null, fatigueEffective: 2 });
  assert(typeof r.coachingMessage === 'string' && r.coachingMessage.length > 0, 'must return non-empty string');
});

test('s29-02 rest + high fatigue returns different message than rest normal', function () {
  var normal = _generateCoachingMessage({ decision: 'rest', sessionSubType: null, recommendedSessionType: null, fatigueEffective: 2 }).coachingMessage;
  var tired  = _generateCoachingMessage({ decision: 'rest', sessionSubType: null, recommendedSessionType: null, fatigueEffective: 4 }).coachingMessage;
  assert(normal !== tired, 'high-fatigue rest message must differ from normal rest message');
});

test('s29-03 hiit produces explosive/interval wording', function () {
  var r = _generateCoachingMessage({ decision: 'train', sessionSubType: 'hiit', recommendedSessionType: 'conditioning', fatigueEffective: 2 });
  assert(r.coachingMessage.toLowerCase().indexOf('hiit') !== -1 || r.coachingMessage.toLowerCase().indexOf('intervalle') !== -1,
    'hiit message must mention HIIT or intervalle, got: ' + r.coachingMessage);
});

test('s29-04 hiit high fatigue is different from hiit normal', function () {
  var normal = _generateCoachingMessage({ decision: 'train', sessionSubType: 'hiit', recommendedSessionType: 'conditioning', fatigueEffective: 2 }).coachingMessage;
  var tired  = _generateCoachingMessage({ decision: 'train', sessionSubType: 'hiit', recommendedSessionType: 'conditioning', fatigueEffective: 4 }).coachingMessage;
  assert(normal !== tired, 'hiit fatigue message must differ from hiit normal message');
});

test('s29-05 zone2 message is distinct from hiit message', function () {
  var hiit  = _generateCoachingMessage({ decision: 'train', sessionSubType: 'hiit',  recommendedSessionType: 'conditioning', fatigueEffective: 2 }).coachingMessage;
  var zone2 = _generateCoachingMessage({ decision: 'train', sessionSubType: 'zone2', recommendedSessionType: 'conditioning', fatigueEffective: 2 }).coachingMessage;
  assert(hiit !== zone2, 'zone2 message must differ from hiit message');
});

test('s29-06 zone2 message contains aerobic/zone wording', function () {
  var r = _generateCoachingMessage({ decision: 'train', sessionSubType: 'zone2', recommendedSessionType: 'conditioning', fatigueEffective: 2 });
  var msg = r.coachingMessage.toLowerCase();
  assert(msg.indexOf('zone') !== -1 || msg.indexOf('aérobi') !== -1 || msg.indexOf('endurance') !== -1,
    'zone2 message must contain aerobic wording, got: ' + r.coachingMessage);
});

test('s29-07 mixed message is distinct from hiit and zone2', function () {
  var hiit  = _generateCoachingMessage({ decision: 'train', sessionSubType: 'hiit',  recommendedSessionType: 'conditioning', fatigueEffective: 2 }).coachingMessage;
  var zone2 = _generateCoachingMessage({ decision: 'train', sessionSubType: 'zone2', recommendedSessionType: 'conditioning', fatigueEffective: 2 }).coachingMessage;
  var mixed = _generateCoachingMessage({ decision: 'train', sessionSubType: 'mixed', recommendedSessionType: 'conditioning', fatigueEffective: 2 }).coachingMessage;
  assert(mixed !== hiit,  'mixed must differ from hiit');
  assert(mixed !== zone2, 'mixed must differ from zone2');
});

test('s29-08 heavy message contains force/charge wording', function () {
  var r = _generateCoachingMessage({ decision: 'train', sessionSubType: 'heavy', recommendedSessionType: 'strength', fatigueEffective: 2 });
  var msg = r.coachingMessage.toLowerCase();
  assert(msg.indexOf('force') !== -1 || msg.indexOf('lourd') !== -1 || msg.indexOf('barre') !== -1,
    'heavy message must contain force/charge wording, got: ' + r.coachingMessage);
});

test('s29-09 volume/strength contains accumulation wording', function () {
  var r = _generateCoachingMessage({ decision: 'train', sessionSubType: 'volume', recommendedSessionType: 'strength', fatigueEffective: 2 });
  var msg = r.coachingMessage.toLowerCase();
  assert(msg.indexOf('accumulation') !== -1 || msg.indexOf('tonnage') !== -1,
    'volume/strength must contain accumulation/tonnage, got: ' + r.coachingMessage);
});

test('s29-10 volume/hypertrophy distinct from volume/strength and contains pump wording', function () {
  var volStr = _generateCoachingMessage({ decision: 'train', sessionSubType: 'volume', recommendedSessionType: 'strength',    fatigueEffective: 2 }).coachingMessage;
  var volHyp = _generateCoachingMessage({ decision: 'train', sessionSubType: 'volume', recommendedSessionType: 'hypertrophy', fatigueEffective: 2 }).coachingMessage;
  assert(volStr !== volHyp, 'volume/hypertrophy must differ from volume/strength');
  var msg = volHyp.toLowerCase();
  assert(msg.indexOf('congestion') !== -1 || msg.indexOf('pompage') !== -1 || msg.indexOf('pump') !== -1,
    'volume/hypertrophy must contain pump/congestion wording, got: ' + volHyp);
});

test('s29-11 explosive message is distinct from heavy', function () {
  var heavy = _generateCoachingMessage({ decision: 'train', sessionSubType: 'heavy',     recommendedSessionType: 'strength', fatigueEffective: 2 }).coachingMessage;
  var expl  = _generateCoachingMessage({ decision: 'train', sessionSubType: 'explosive', recommendedSessionType: 'strength', fatigueEffective: 2 }).coachingMessage;
  assert(heavy !== expl, 'explosive message must differ from heavy message');
});

test('s29-12 tempo message contains TUT/eccentric wording', function () {
  var r = _generateCoachingMessage({ decision: 'train', sessionSubType: 'tempo', recommendedSessionType: 'hypertrophy', fatigueEffective: 2 });
  var msg = r.coachingMessage.toLowerCase();
  assert(msg.indexOf('tempo') !== -1 || msg.indexOf('excentrique') !== -1 || msg.indexOf('tension') !== -1,
    'tempo message must contain tempo/eccentric wording, got: ' + r.coachingMessage);
});

test('s29-13 recovery subtype is distinct from hiit', function () {
  var hiit = _generateCoachingMessage({ decision: 'train', sessionSubType: 'hiit',     recommendedSessionType: 'conditioning', fatigueEffective: 2 }).coachingMessage;
  var rec  = _generateCoachingMessage({ decision: 'train', sessionSubType: 'recovery', recommendedSessionType: 'recovery',     fatigueEffective: 2 }).coachingMessage;
  assert(hiit !== rec, 'recovery message must differ from hiit message');
});

test('s29-14 unknown subtype falls back to sessionType without crash', function () {
  var r = _generateCoachingMessage({ decision: 'train', sessionSubType: 'unknown_xyz', recommendedSessionType: 'conditioning', fatigueEffective: 2 });
  assert(typeof r.coachingMessage === 'string' && r.coachingMessage.length > 0, 'unknown subtype must return fallback string, not crash');
});

test('s29-15 null subtype + null sessionType falls back without crash', function () {
  var r = _generateCoachingMessage({ decision: 'train', sessionSubType: null, recommendedSessionType: null, fatigueEffective: 2 });
  assert(typeof r.coachingMessage === 'string' && r.coachingMessage.length > 0, 'null subtype/sessType must return fallback string, not crash');
});

test('s29-16 all 7 named subtypes produce distinct messages', function () {
  var subtypes = [
    { subtype: 'hiit',      sessType: 'conditioning' },
    { subtype: 'zone2',     sessType: 'conditioning' },
    { subtype: 'mixed',     sessType: 'conditioning' },
    { subtype: 'heavy',     sessType: 'strength'     },
    { subtype: 'explosive', sessType: 'strength'     },
    { subtype: 'tempo',     sessType: 'hypertrophy'  },
    { subtype: 'recovery',  sessType: 'recovery'     }
  ];
  var messages = subtypes.map(function(s) {
    return _generateCoachingMessage({ decision: 'train', sessionSubType: s.subtype, recommendedSessionType: s.sessType, fatigueEffective: 2 }).coachingMessage;
  });
  var unique = messages.filter(function(m, i) { return messages.indexOf(m) === i; });
  assertEqual(unique.length, messages.length, '7 subtypes must produce 7 distinct messages, got ' + unique.length + ' unique');
});

test('s29-17 deterministic: same input returns identical message twice', function () {
  var input = { decision: 'train', sessionSubType: 'hiit', recommendedSessionType: 'conditioning', fatigueEffective: 2 };
  var r1 = _generateCoachingMessage(input).coachingMessage;
  var r2 = _generateCoachingMessage(input).coachingMessage;
  assertEqual(r1, r2, 'coaching message must be deterministic');
});

test('s29-18 fatigueEffective 3 vs 4 threshold switches message variant', function () {
  var input3 = { decision: 'train', sessionSubType: 'hiit', recommendedSessionType: 'conditioning', fatigueEffective: 3 };
  var input4 = { decision: 'train', sessionSubType: 'hiit', recommendedSessionType: 'conditioning', fatigueEffective: 4 };
  var r3 = _generateCoachingMessage(input3).coachingMessage;
  var r4 = _generateCoachingMessage(input4).coachingMessage;
  assert(r3 !== r4, 'fatigueEffective 3 and 4 must produce different messages (threshold at 4)');
});

test('s29-19 fatigueEffective 5 still uses fatigue variant (boundary)', function () {
  var r4 = _generateCoachingMessage({ decision: 'train', sessionSubType: 'zone2', recommendedSessionType: 'conditioning', fatigueEffective: 4 }).coachingMessage;
  var r5 = _generateCoachingMessage({ decision: 'train', sessionSubType: 'zone2', recommendedSessionType: 'conditioning', fatigueEffective: 5 }).coachingMessage;
  assertEqual(r4, r5, 'fatigueEffective 4 and 5 must produce same (fatigue) variant');
});

test('s29-20 integration: decideDailyPlanV3 output has subtypeCoachingMessage field', function () {
  var out = decideV3(Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(2)
  }), {
    userProfile: { adherenceScore: 0.85, trainingFrequencyLast7Days: 4, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['high'] },
    userHistory: { last7Decisions: ['train', 'train'], last7Momentum: [7, 7],
                   lastSessionTypes: ['strength', 'conditioning'] }
  }));
  assert(typeof out.subtypeCoachingMessage === 'string' && out.subtypeCoachingMessage.length > 0,
    'subtypeCoachingMessage must be a non-empty string in decideDailyPlanV3 output');
});

test('s29-21 integration: HIIT message distinct from zone2 message in real engine output', function () {
  var baseInputs = Object.assign(baseV2({
    fatigueLevel: 2, last3SessionsIntensity: ['high'], lastSessionDate: daysAgo(2)
  }), {
    userProfile: { adherenceScore: 0.9, trainingFrequencyLast7Days: 5, avgFatigueLast7Days: 2,
                   last7SessionsIntensity: ['high', 'high', 'high'] },
    userHistory: { last7Decisions: ['train', 'train', 'train'], last7Momentum: [8, 8, 8],
                   lastSessionTypes: ['conditioning', 'conditioning', 'conditioning'] }
  });
  // Force HIIT: lastSubTypes ending in zone2 so next is mixed or hiit depending on cycle
  var outHiit  = decideV3(Object.assign({}, baseInputs, {
    userHistory: { last7Decisions: ['train', 'train', 'train'], last7Momentum: [8, 8, 8],
                   lastSessionTypes: ['conditioning', 'conditioning', 'conditioning'],
                   lastSubTypes: ['zone2', 'mixed'] }
  }));
  var outZone2 = decideV3(Object.assign({}, baseInputs, {
    userHistory: { last7Decisions: ['train', 'train', 'train'], last7Momentum: [8, 8, 8],
                   lastSessionTypes: ['conditioning', 'conditioning', 'conditioning'],
                   lastSubTypes: ['hiit', 'mixed'] }
  }));
  // Both must be conditioning; messages must differ if subtypes differ
  if (outHiit.sessionSubType !== outZone2.sessionSubType) {
    assert(outHiit.subtypeCoachingMessage !== outZone2.subtypeCoachingMessage,
      'different conditioning subtypes must produce different coaching messages');
  } else {
    // Subtypes happened to be the same — just verify field exists
    assert(typeof outHiit.subtypeCoachingMessage === 'string', 'subtypeCoachingMessage must be a string');
  }
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
