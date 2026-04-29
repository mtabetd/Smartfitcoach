'use strict';
// ─── TESTS — Daily Decision Engine v1 ────────────────────────────────────────
// Usage : node tests/test-daily-decision-engine.js
// ─────────────────────────────────────────────────────────────────────────────

var DDE = require('../app/daily-decision-engine.js');
var decideDailyPlan   = DDE.decideDailyPlan;
var _effectiveFatigue = DDE._effectiveFatigue;
var _maxIntensity     = DDE._maxIntensity;
var _decision         = DDE._decision;
var _sessionType      = DDE._sessionType;
var _daysSince        = DDE._daysSince;

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
  if (a !== b) throw new Error((msg || '') + ' expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
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

// ── Helper : date relative à aujourd'hui ─────────────────────────────────────
function daysAgo(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 1 : Validation des inputs ─────────────────────────\n');

test('inputs null → TypeError', function () {
  assertThrows(function () { decideDailyPlan(null); }, 'inputs must be a plain object');
});
test('fatigueLevel hors range (0) → RangeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 0, lastSessionIntensity: 'low',
      lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 3 });
  }, 'fatigueLevel');
});
test('fatigueLevel hors range (6) → RangeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 6, lastSessionIntensity: 'low',
      lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 3 });
  }, 'fatigueLevel');
});
test('fatigueLevel décimal → RangeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 2.5, lastSessionIntensity: 'low',
      lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 3 });
  }, 'fatigueLevel');
});
test('lastSessionIntensity invalide → RangeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 2, lastSessionIntensity: 'extreme',
      lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 3 });
  }, 'lastSessionIntensity');
});
test('goal invalide → RangeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 2, lastSessionIntensity: 'low',
      lastSessionDate: daysAgo(1), goal: 'endurance', trainingFrequency: 3 });
  }, 'goal');
});
test('trainingFrequency hors range (8) → RangeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 2, lastSessionIntensity: 'low',
      lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 8 });
  }, 'trainingFrequency');
});
test('sleepQuality invalide (6) → RangeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 2, lastSessionIntensity: 'low',
      lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 3, sleepQuality: 6 });
  }, 'sleepQuality');
});
test('lastSessionDate manquant → TypeError', function () {
  assertThrows(function () {
    decideDailyPlan({ fatigueLevel: 2, lastSessionIntensity: 'low',
      lastSessionDate: null, goal: 'fat_loss', trainingFrequency: 3 });
  }, 'lastSessionDate');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 2 : _daysSince ────────────────────────────────────\n');

test('aujourd\'hui → 0', function () {
  assertEqual(_daysSince(daysAgo(0)), 0);
});
test('hier → 1', function () {
  assertEqual(_daysSince(daysAgo(1)), 1);
});
test('il y a 3 jours → 3', function () {
  assertEqual(_daysSince(daysAgo(3)), 3);
});
test('date future → 0 (clampé)', function () {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  assertEqual(_daysSince(tomorrow), 0);
});
test('timestamp numérique → fonctionne', function () {
  var ts = daysAgo(2).getTime();
  assertEqual(_daysSince(ts), 2);
});
test('string ISO → fonctionne', function () {
  var iso = daysAgo(5).toISOString();
  assertEqual(_daysSince(iso), 5);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 3 : _effectiveFatigue ────────────────────────────\n');

test('pas de sommeil, 0 jours → fatigue brute', function () {
  assertEqual(_effectiveFatigue(3, undefined, 0), 3);
});
test('mauvais sommeil (1/5) → +1 fatigue', function () {
  assertEqual(_effectiveFatigue(3, 1, 0), 4);
});
test('mauvais sommeil (2/5) → +1 fatigue', function () {
  assertEqual(_effectiveFatigue(3, 2, 0), 4);
});
test('bon sommeil (4/5) → pas d\'ajustement', function () {
  assertEqual(_effectiveFatigue(3, 4, 0), 3);
});
test('2 jours de repos → −1 fatigue', function () {
  assertEqual(_effectiveFatigue(3, undefined, 2), 2);
});
test('4 jours de repos → −2 fatigue', function () {
  assertEqual(_effectiveFatigue(4, undefined, 4), 2);
});
test('mauvais sommeil + 2 jours repos → annulation (+1 −1 = 0)', function () {
  assertEqual(_effectiveFatigue(3, 2, 2), 3);
});
test('clamp minimum : fatigue 1 + 4 jours repos → reste à 1', function () {
  assert(_effectiveFatigue(1, undefined, 4) >= 1);
});
test('clamp maximum : fatigue 5 + mauvais sommeil → reste à 5', function () {
  assertEqual(_effectiveFatigue(5, 1, 0), 5);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 4 : _maxIntensity ────────────────────────────────\n');

test('après session high → max moderate', function () {
  assertEqual(_maxIntensity('high', 2, 3), 'moderate');
});
test('après session high + fatigue 2 → max moderate (jamais high)', function () {
  assertEqual(_maxIntensity('high', 2, 3), 'moderate');
});
test('fatigue 4 → max low', function () {
  assertEqual(_maxIntensity('low', 4, 3), 'low');
});
test('fatigue 5 → max low', function () {
  assertEqual(_maxIntensity('moderate', 5, 3), 'low');
});
test('fatigue 3, fréquence normale (3/sem) → max moderate', function () {
  assertEqual(_maxIntensity('low', 3, 3), 'moderate');
});
test('fatigue 3, haute fréquence (4/sem) → max low (règle stricte)', function () {
  assertEqual(_maxIntensity('low', 3, 4), 'low');
});
test('fatigue 3, haute fréquence (5/sem) → max low', function () {
  assertEqual(_maxIntensity('moderate', 3, 5), 'low');
});
test('fatigue 2, dernière session moderate → max high', function () {
  assertEqual(_maxIntensity('moderate', 2, 3), 'high');
});
test('fatigue 1, dernière session low → max high', function () {
  assertEqual(_maxIntensity('low', 1, 3), 'high');
});
test('après session high + fatigue 4 → max low (règle B > règle A)', function () {
  assertEqual(_maxIntensity('high', 4, 3), 'low');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 5 : _decision ────────────────────────────────────\n');

test('daysSince 0 → rest (déjà entraîné aujourd\'hui)', function () {
  assertEqual(_decision(2, 3, 0), 'rest');
});
test('fatigue effective 5 → rest (toujours)', function () {
  assertEqual(_decision(5, 3, 1), 'rest');
});
test('fatigue 5, fréquence 1 → rest (pas d\'exception)', function () {
  assertEqual(_decision(5, 1, 1), 'rest');
});
test('fatigue 4, haute fréquence (3/sem) → rest', function () {
  assertEqual(_decision(4, 3, 1), 'rest');
});
test('fatigue 4, faible fréquence (2/sem) → train (régularité)', function () {
  assertEqual(_decision(4, 2, 1), 'train');
});
test('fatigue 4, fréquence 1/sem → train (régularité prioritaire)', function () {
  assertEqual(_decision(4, 1, 1), 'train');
});
test('fatigue 3 → train', function () {
  assertEqual(_decision(3, 3, 1), 'train');
});
test('fatigue 2 → train', function () {
  assertEqual(_decision(2, 4, 1), 'train');
});
test('fatigue 1 → train', function () {
  assertEqual(_decision(1, 5, 2), 'train');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 6 : _sessionType ─────────────────────────────────\n');

test('rest → recovery', function () {
  assertEqual(_sessionType('rest', 'high', 'muscle_gain'), 'recovery');
});
test('train + low → recovery (intensité trop faible)', function () {
  assertEqual(_sessionType('train', 'low', 'muscle_gain'), 'recovery');
});
test('muscle_gain + moderate → strength', function () {
  assertEqual(_sessionType('train', 'moderate', 'muscle_gain'), 'strength');
});
test('muscle_gain + high → strength', function () {
  assertEqual(_sessionType('train', 'high', 'muscle_gain'), 'strength');
});
test('fat_loss + high → strength (EPOC)', function () {
  assertEqual(_sessionType('train', 'high', 'fat_loss'), 'strength');
});
test('fat_loss + moderate → cardio', function () {
  assertEqual(_sessionType('train', 'moderate', 'fat_loss'), 'cardio');
});
test('maintenance + high → strength', function () {
  assertEqual(_sessionType('train', 'high', 'maintenance'), 'strength');
});
test('maintenance + moderate → cardio', function () {
  assertEqual(_sessionType('train', 'moderate', 'maintenance'), 'cardio');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 7 : decideDailyPlan — règles métier clés ─────────\n');

// Règle 1 : Fatigue haute → repos
test('fatigue 4 + fréquence 3 → rest', function () {
  var out = decideDailyPlan({
    fatigueLevel: 4, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.decision, 'rest');
  assertEqual(out.recommendedSessionType, 'recovery');
});

test('fatigue 5 → rest (toujours, sans exception)', function () {
  var out = decideDailyPlan({
    fatigueLevel: 5, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 1
  });
  assertEqual(out.decision, 'rest');
});

test('fatigue haute → intensity = low', function () {
  var out = decideDailyPlan({
    fatigueLevel: 4, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 5
  });
  assertEqual(out.intensity, 'low');
});

// Règle 2 : High → jamais high le lendemain
test('après session high → intensity max moderate', function () {
  var out = decideDailyPlan({
    fatigueLevel: 1, lastSessionIntensity: 'high',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 4
  });
  assertEqual(out.decision, 'train');
  assert(out.intensity !== 'high', 'intensity should not be high after high session');
});

test('après session high + fatigue 3 → moderate au max', function () {
  var out = decideDailyPlan({
    fatigueLevel: 3, lastSessionIntensity: 'high',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.intensity, 'moderate');
});

// Règle 3 : Fatigue basse après repos → high possible
test('fatigue 1 + 2 jours repos + session moderate → high', function () {
  var out = decideDailyPlan({
    fatigueLevel: 1, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(2), goal: 'muscle_gain', trainingFrequency: 3
  });
  assertEqual(out.decision, 'train');
  assertEqual(out.intensity, 'high');
});

test('fatigue 2 + 3 jours repos + session low → high', function () {
  var out = decideDailyPlan({
    fatigueLevel: 2, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(3), goal: 'maintenance', trainingFrequency: 3
  });
  assertEqual(out.decision, 'train');
  assertEqual(out.intensity, 'high');
});

// Règle 4 : Faible fréquence → priorité régularité
test('fatigue 4 + fréquence 2 → train (régularité)', function () {
  var out = decideDailyPlan({
    fatigueLevel: 4, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 2
  });
  assertEqual(out.decision, 'train');
});

test('fatigue 4 + fréquence 2 + goal fat_loss → low intensity', function () {
  var out = decideDailyPlan({
    fatigueLevel: 4, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 2
  });
  assertEqual(out.intensity, 'low');
  assertEqual(out.recommendedSessionType, 'recovery');
});

// Règle 5 : Haute fréquence → gestion stricte
test('fatigue 3 + fréquence 5 → max low (gestion stricte)', function () {
  var out = decideDailyPlan({
    fatigueLevel: 3, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 5
  });
  assertEqual(out.intensity, 'low');
});

// Déjà entraîné aujourd'hui
test('dernière séance aujourd\'hui → rest', function () {
  var out = decideDailyPlan({
    fatigueLevel: 1, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(0), goal: 'muscle_gain', trainingFrequency: 5
  });
  assertEqual(out.decision, 'rest');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 8 : Sommeil (input optionnel) ────────────────────\n');

test('sommeil 1/5 + fatigue 3 + fréquence 4 → rest (fatigue effective 4)', function () {
  var out = decideDailyPlan({
    fatigueLevel: 3, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 4,
    sleepQuality: 1
  });
  assertEqual(out.decision, 'rest');
  assert(out._debug.effectiveFatigue >= 4, 'effective fatigue should be ≥4');
});

test('sommeil 5/5 + fatigue 3 → pas d\'impact (bon sommeil)', function () {
  var out = decideDailyPlan({
    fatigueLevel: 3, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 3,
    sleepQuality: 5
  });
  assertEqual(out._debug.effectiveFatigue, 3);
  assertEqual(out.decision, 'train');
});

test('sleepQuality absent → pas d\'erreur', function () {
  var out = decideDailyPlan({
    fatigueLevel: 2, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(1), goal: 'maintenance', trainingFrequency: 3
  });
  assert(out.decision !== undefined, 'decision should exist');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 9 : Structure de l\'output ───────────────────────\n');

test('output contient decision, intensity, recommendedSessionType, reason', function () {
  var out = decideDailyPlan({
    fatigueLevel: 2, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 3
  });
  assert(out.decision !== undefined,               'missing: decision');
  assert(out.intensity !== undefined,              'missing: intensity');
  assert(out.recommendedSessionType !== undefined, 'missing: recommendedSessionType');
  assert(typeof out.reason === 'string' && out.reason.length > 0, 'missing: reason');
});

test('decision est toujours train|rest', function () {
  var cases = [
    { fatigueLevel: 1, lastSessionIntensity: 'low',      goal: 'fat_loss',    trainingFrequency: 3 },
    { fatigueLevel: 5, lastSessionIntensity: 'high',     goal: 'muscle_gain', trainingFrequency: 5 },
    { fatigueLevel: 3, lastSessionIntensity: 'moderate', goal: 'maintenance', trainingFrequency: 4 }
  ];
  cases.forEach(function (c) {
    c.lastSessionDate = daysAgo(1);
    var out = decideDailyPlan(c);
    assert(out.decision === 'train' || out.decision === 'rest',
      'decision must be train|rest, got: ' + out.decision);
  });
});

test('intensity est toujours low|moderate|high', function () {
  var out = decideDailyPlan({
    fatigueLevel: 2, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 4
  });
  assert(['low', 'moderate', 'high'].indexOf(out.intensity) !== -1,
    'intensity must be low|moderate|high');
});

test('recommendedSessionType est toujours strength|cardio|recovery', function () {
  var out = decideDailyPlan({
    fatigueLevel: 2, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 3
  });
  assert(['strength', 'cardio', 'recovery'].indexOf(out.recommendedSessionType) !== -1,
    'recommendedSessionType must be strength|cardio|recovery');
});

test('_debug contient effectiveFatigue, daysSinceLastSession, maxAllowedIntensity', function () {
  var out = decideDailyPlan({
    fatigueLevel: 3, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(2), goal: 'maintenance', trainingFrequency: 3
  });
  assert(typeof out._debug.effectiveFatigue === 'number',    'missing _debug.effectiveFatigue');
  assert(typeof out._debug.daysSinceLastSession === 'number', 'missing _debug.daysSinceLastSession');
  assert(typeof out._debug.maxAllowedIntensity === 'string',  'missing _debug.maxAllowedIntensity');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── Section 10 : Cohérence globale (scénarios complets) ──────\n');

test('Scénario A — Débutant (fréq 2), fatigue 3, après moderate → train low', function () {
  var out = decideDailyPlan({
    fatigueLevel: 3, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 2
  });
  // Fréquence 2 → régularité. Fatigue 3 → max moderate. Mais après moderate ok.
  assertEqual(out.decision, 'train');
  assert(out.intensity !== 'high', 'should not be high with fatigue 3');
});

test('Scénario B — Athlète (fréq 5), fatigue 2, semaine lourde → train moderate max', function () {
  var out = decideDailyPlan({
    fatigueLevel: 2, lastSessionIntensity: 'high',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 5
  });
  // Après high → max moderate
  assertEqual(out.decision, 'train');
  assertEqual(out.intensity, 'moderate');
  assertEqual(out.recommendedSessionType, 'strength');
});

test('Scénario C — Récupération (4 jours sans séance), fatigue 4 → fatigue effective 2 → train', function () {
  var out = decideDailyPlan({
    fatigueLevel: 4, lastSessionIntensity: 'moderate',
    lastSessionDate: daysAgo(4), goal: 'maintenance', trainingFrequency: 3
  });
  // 4 jours repos → −2 → effective = 2 → train possible
  assertEqual(out._debug.effectiveFatigue, 2);
  assertEqual(out.decision, 'train');
});

test('Scénario D — Pire cas : tout rouge (fatigue 5, sommeil 1, hier high, fréq 6) → rest', function () {
  var out = decideDailyPlan({
    fatigueLevel: 5, lastSessionIntensity: 'high',
    lastSessionDate: daysAgo(1), goal: 'muscle_gain', trainingFrequency: 6,
    sleepQuality: 1
  });
  assertEqual(out.decision, 'rest');
  assertEqual(out.intensity, 'low');
  assertEqual(out.recommendedSessionType, 'recovery');
});

test('Scénario E — Tout vert (fatigue 1, sommeil 5, 3 jours repos, après low, fréq 3) → train high', function () {
  var out = decideDailyPlan({
    fatigueLevel: 1, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(3), goal: 'muscle_gain', trainingFrequency: 3,
    sleepQuality: 5
  });
  assertEqual(out.decision, 'train');
  assertEqual(out.intensity, 'high');
  assertEqual(out.recommendedSessionType, 'strength');
});

test('Scénario F — fat_loss + high → strength (EPOC)', function () {
  var out = decideDailyPlan({
    fatigueLevel: 1, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(2), goal: 'fat_loss', trainingFrequency: 3
  });
  assertEqual(out.decision, 'train');
  assertEqual(out.intensity, 'high');
  assertEqual(out.recommendedSessionType, 'strength');
});

test('Scénario G — fat_loss + moderate → cardio', function () {
  var out = decideDailyPlan({
    fatigueLevel: 3, lastSessionIntensity: 'low',
    lastSessionDate: daysAgo(1), goal: 'fat_loss', trainingFrequency: 3
  });
  assertEqual(out.decision, 'train');
  assertEqual(out.intensity, 'moderate');
  assertEqual(out.recommendedSessionType, 'cardio');
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
