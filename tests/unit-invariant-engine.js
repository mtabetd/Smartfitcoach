'use strict';
/**
 * unit-invariant-engine.js
 * Suite de tests pour sfc-invariants.js
 *
 * Couvre :
 *   N-01 … N-14  — Invariants nutrition    (NUT-01…NUT-07)
 *   S-01 … S-10  — Invariants sport        (SPT-01…SPT-05)
 *   Y-01 … Y-08  — Invariants sync         (SYN-01…SYN-04)
 *   P-01 … P-06  — Invariants premium      (PRM-01…PRM-02)
 *   M-01 … M-05  — Mode warn vs throw
 *   C-01 … C-07  — Context / monitoring bridge
 *
 * Usage : node tests/unit-invariant-engine.js
 */

// ─── Chargement du module ─────────────────────────────────────────────────────
// Le module supporte window (browser) et module.exports (Node).
// On force la voie module.exports en supprimant global.window avant le require.
var _savedWindow = global.window;
delete global.window;
var SFCInvariant = require('../app/sfc-invariants.js');
global.window = _savedWindow; // restauration pour les autres tests éventuels

// ─── Harness minimal ─────────────────────────────────────────────────────────
var _passed = 0;
var _failed = 0;
var _errors = [];

function test(name, fn) {
  // Chaque test opère sur une ardoise propre
  SFCInvariant.clearViolations();
  SFCInvariant.setMode('warn'); // reset au mode sûr avant chaque test
  try {
    fn();
    _passed++;
    console.log('  PASS', name);
  } catch (e) {
    _failed++;
    _errors.push({ name: name, error: e.message || String(e) });
    console.error('  FAIL', name, '—', e.message || String(e));
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertThrows(fn, expectedMsg) {
  var threw = false;
  try { fn(); } catch (e) {
    threw = true;
    if (expectedMsg) {
      assert(
        e.message.indexOf(expectedMsg) !== -1,
        'Expected error to contain "' + expectedMsg + '" but got: ' + e.message
      );
    }
  }
  if (!threw) throw new Error('Expected function to throw, but it did not');
}

function assertNoViolations() {
  var v = SFCInvariant.getViolations();
  if (v.length > 0) throw new Error('Unexpected violation: ' + v[0].id + ' — ' + v[0].msg);
}

function assertViolation(expectedId) {
  var v = SFCInvariant.getViolations();
  if (v.length === 0) throw new Error('Expected violation ' + expectedId + ' but none recorded');
  if (expectedId) {
    var found = v.some(function (vi) { return vi.id === expectedId; });
    if (!found) {
      throw new Error('Expected violation ' + expectedId + ' but got: ' + v.map(function (vi) { return vi.id; }).join(', '));
    }
  }
}

// ─── Helpers de profils et résultats ────────────────────────────────────────

function makeResult(overrides) {
  var base = {
    caloriesTarget: 2000,
    proteinGrams:   150,
    fatGrams:       67,    // 67×9 / 2000 = 30.15% ✓
    carbsGrams:     200,
    caloriesCheck:  2000   // exact
  };
  Object.keys(overrides || {}).forEach(function (k) { base[k] = overrides[k]; });
  // Auto-align caloriesCheck to caloriesTarget when caloriesCheck not explicitly given,
  // so tests that only care about one invariant don't accidentally trigger NUT-05.
  if (!(overrides && 'caloriesCheck' in overrides)) {
    base.caloriesCheck = base.caloriesTarget;
  }
  return base;
}

function makeProfile(overrides) {
  var base = {
    sex:        'homme',
    weight:     80,
    pregnant:   false,
    sportGoals: []
  };
  Object.keys(overrides || {}).forEach(function (k) { base[k] = overrides[k]; });
  return base;
}

function makeDay(exerciseCount, rest) {
  if (rest) return { rest: true, exercises: [] };
  var exercises = [];
  for (var i = 0; i < exerciseCount; i++) {
    exercises.push({ n: 'Exercice ' + (i + 1), sets: '3x10' });
  }
  return { exercises: exercises };
}

// ═════════════════════════════════════════════════════════════════════════════
// NUTRITION
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== Invariants Nutrition ===');

// N-01 — NUT-01 : calories minimales homme (ISSN 2017) — cas valide
test('N-01: NUT-01 homme 2000 kcal — aucune violation', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 2000 }), makeProfile({ sex: 'homme' }));
  assertNoViolations();
});

// N-02 — NUT-01 : calories minimales homme — violation si < 1500
test('N-02: NUT-01 homme 1400 kcal < 1500 — violation NUT-01', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1400 }), makeProfile({ sex: 'homme' }));
  assertViolation('NUT-01');
});

// N-03 — NUT-01 : calories minimales femme (ISSN 2017) — cas valide
test('N-03: NUT-01 femme 1400 kcal — aucune violation', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1400 }), makeProfile({ sex: 'femme' }));
  assertNoViolations();
});

// N-04 — NUT-01 : calories minimales femme — violation si < 1400
test('N-04: NUT-01 femme 1300 kcal < 1400 — violation NUT-01', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1300 }), makeProfile({ sex: 'femme' }));
  assertViolation('NUT-01');
});

// N-05 — NUT-01 : grossesse — violation si < 1800
test('N-05: NUT-01 grossesse 1700 kcal < 1800 — violation NUT-01', function () {
  SFCInvariant.checkNutrition(
    makeResult({ caloriesTarget: 1700 }),
    makeProfile({ sex: 'femme', pregnant: true })
  );
  assertViolation('NUT-01');
});

// N-06 — NUT-01 : grossesse — pas de violation à 1800 kcal
test('N-06: NUT-01 grossesse 1800 kcal — aucune violation', function () {
  SFCInvariant.checkNutrition(
    makeResult({ caloriesTarget: 1800, fatGrams: 60 }),
    makeProfile({ sex: 'femme', pregnant: true })
  );
  // Vérifie uniquement NUT-01 (peut y avoir NUT-03 si fat bas)
  var v = SFCInvariant.getViolations();
  assert(!v.some(function (vi) { return vi.id === 'NUT-01'; }), 'NUT-01 ne doit pas déclencher à 1800');
});

// N-07 — NUT-02 : protéines < 1.6 g/kg pour goal muscle → violation
test('N-07: NUT-02 proteines insuffisantes goal muscle — violation NUT-02', function () {
  SFCInvariant.checkNutrition(
    makeResult({ proteinGrams: 100 }), // 100 < 1.6×80=128
    makeProfile({ sex: 'homme', weight: 80, sportGoals: ['muscle'] })
  );
  assertViolation('NUT-02');
});

// N-08 — NUT-02 : protéines suffisantes goal shred → pas de violation
test('N-08: NUT-02 proteines suffisantes goal shred — aucune violation NUT-02', function () {
  SFCInvariant.checkNutrition(
    makeResult({ proteinGrams: 160 }), // 160 >= 1.6×80=128
    makeProfile({ sex: 'homme', weight: 80, sportGoals: ['shred'] })
  );
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'NUT-02'; }), 'NUT-02 ne doit pas déclencher');
});

// N-09 — NUT-03 : lipides < 15% des kcal → violation
test('N-09: NUT-03 lipides 10% < 15% — violation NUT-03', function () {
  // fat=22g, cal=2000 → 22×9/2000=9.9%
  SFCInvariant.checkNutrition(
    makeResult({ fatGrams: 22, caloriesTarget: 2000 }),
    makeProfile()
  );
  assertViolation('NUT-03');
});

// N-10 — NUT-04 : glucides < 130 g → violation (IOM 2005)
test('N-10: NUT-04 glucides 100g < 130g — violation NUT-04', function () {
  SFCInvariant.checkNutrition(
    makeResult({ carbsGrams: 100 }),
    makeProfile()
  );
  assertViolation('NUT-04');
});

// N-11 — NUT-05 : drift calorique > 5% → violation
test('N-11: NUT-05 drift caloriques 8% — violation NUT-05', function () {
  SFCInvariant.checkNutrition(
    makeResult({ caloriesTarget: 2000, caloriesCheck: 2170 }), // 8.5% drift
    makeProfile()
  );
  assertViolation('NUT-05');
});

// N-12 — NUT-05 : drift ≤ 5% → pas de violation
test('N-12: NUT-05 drift 3% — aucune violation NUT-05', function () {
  SFCInvariant.checkNutrition(
    makeResult({ caloriesTarget: 2000, caloriesCheck: 2040 }), // 2% drift
    makeProfile()
  );
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'NUT-05'; }), 'NUT-05 ne doit pas déclencher');
});

// N-13 — NUT-06 : carb cycling heavy — carbsGrams doit augmenter
test('N-13: NUT-06 carb cycling heavy carbsGrams <= base — violation NUT-06', function () {
  SFCInvariant.checkNutrition(
    makeResult({ carbsGrams: 200 }),
    makeProfile(),
    { carbCyclingType: 'heavy', baseCarbsGrams: 210 } // 200 <= 210 → violation
  );
  assertViolation('NUT-06');
});

// N-14 — NUT-07 : carb cycling rest — carbsGrams doit baisser OU valoir 130
test('N-14: NUT-07 carb cycling rest carbsGrams >= base et != 130 — violation NUT-07', function () {
  SFCInvariant.checkNutrition(
    makeResult({ carbsGrams: 200 }),
    makeProfile(),
    { carbCyclingType: 'rest', baseCarbsGrams: 190 } // 200 >= 190 et != 130 → violation
  );
  assertViolation('NUT-07');
});

// ═════════════════════════════════════════════════════════════════════════════
// SPORT
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== Invariants Sport ===');

// S-01 — SPT-01 : double deload → violation
test('S-01: SPT-01 double deload muscu+symbiose — violation SPT-01', function () {
  SFCInvariant.checkSport(
    [makeDay(4)],
    makeProfile({ sportType: 'musculation' }),
    { muscuCycleDeload: true, sfcSymbiosisDeload: true }
  );
  assertViolation('SPT-01');
});

// S-02 — SPT-01 : un seul deload → pas de violation
test('S-02: SPT-01 deload seulement muscu — aucune violation SPT-01', function () {
  SFCInvariant.checkSport(
    [makeDay(4)],
    makeProfile({ sportType: 'musculation' }),
    { muscuCycleDeload: true, sfcSymbiosisDeload: false }
  );
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SPT-01'; }), 'SPT-01 ne doit pas déclencher');
});

// S-03 — SPT-02 : séance 45 min avec 2 exercices → violation
test('S-03: SPT-02 seance 45min 2 exercices < 3 — violation SPT-02', function () {
  SFCInvariant.checkSport(
    [makeDay(2)],
    makeProfile({ sportType: 'musculation', sportSessionDuration: '45min' }),
    { sessionDuration: '45min' }
  );
  assertViolation('SPT-02');
});

// S-04 — SPT-02 : séance 1h avec 3 exercices → violation (min 4 pour 1h)
test('S-04: SPT-02 seance 1h 3 exercices < 4 — violation SPT-02', function () {
  SFCInvariant.checkSport(
    [makeDay(3)],
    makeProfile({ sportType: 'musculation', sportSessionDuration: '1h' }),
    { sessionDuration: '1h' }
  );
  assertViolation('SPT-02');
});

// S-05 — SPT-02 : jour de repos exempt de contrôle volume
test('S-05: SPT-02 jour de repos — aucune violation volume', function () {
  SFCInvariant.checkSport(
    [makeDay(0, true)],
    makeProfile({ sportType: 'musculation' }),
    { sessionDuration: '1h' }
  );
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SPT-02'; }), 'SPT-02 ne doit pas déclencher pour un jour de repos');
});

// S-06 — SPT-03 : grossesse T3, exercice "deadlift" → violation
test('S-06: SPT-03 grossesse T3 deadlift — violation SPT-03', function () {
  SFCInvariant.checkSport(
    [{ exercises: [{ n: 'Deadlift roumain', sets: '3x8' }] }],
    makeProfile({ sex: 'femme', pregnant: true, pregnancyTrimester: 3, pregnancyWeek: 30 })
  );
  assertViolation('SPT-03');
});

// S-07 — SPT-03 : grossesse T3, exercice sans danger → pas de violation
test('S-07: SPT-03 grossesse T3 exercice sans danger — aucune violation SPT-03', function () {
  SFCInvariant.checkSport(
    [{ exercises: [{ n: 'Curl biceps haltère', sets: '3x12' }, { n: 'Shoulder press léger', sets: '3x12' }, { n: 'Leg extension machine', sets: '3x15' }, { n: 'Gainage planaire', sets: '3x30s' }] }],
    makeProfile({ sex: 'femme', pregnant: true, pregnancyTrimester: 3, pregnancyWeek: 30 }),
    { sessionDuration: '1h' }
  );
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SPT-03'; }), 'SPT-03 ne doit pas déclencher');
});

// S-08 — SPT-04 : sportType défini mais programme vide → violation
test('S-08: SPT-04 sportType defini plan vide — violation SPT-04', function () {
  SFCInvariant.checkSport(
    [],
    makeProfile({ sportType: 'musculation' })
  );
  assertViolation('SPT-04');
});

// S-09 — SPT-05 : heavyDayStreak incrémenté sans trainingDay → violation
test('S-09: SPT-05 streak incremente sans trainingDay — violation SPT-05', function () {
  SFCInvariant.checkSport(
    [makeDay(4)],
    makeProfile({ sportType: 'musculation' }),
    {
      sessionDuration:     '1h',
      trainingDay:         false,
      heavyDayStreakPrev:  1,
      heavyDayStreakNew:   2
    }
  );
  assertViolation('SPT-05');
});

// S-10 — SPT-05 : streak inchangé sans trainingDay → pas de violation
test('S-10: SPT-05 streak stable sans trainingDay — aucune violation SPT-05', function () {
  SFCInvariant.checkSport(
    [makeDay(4)],
    makeProfile({ sportType: 'musculation' }),
    {
      sessionDuration:     '1h',
      trainingDay:         false,
      heavyDayStreakPrev:  1,
      heavyDayStreakNew:   0  // remis à zéro (pas d'incrément)
    }
  );
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SPT-05'; }), 'SPT-05 ne doit pas déclencher');
});

// ═════════════════════════════════════════════════════════════════════════════
// SYNC / DATA
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== Invariants Sync/Data ===');

// Y-01 — SYN-01 : saveProfile tentée avec _loadCorrupted=true → violation
test('Y-01: SYN-01 saveProfile avec loadCorrupted=true — violation SYN-01', function () {
  SFCInvariant.checkSync({ _loadCorrupted: true, _attemptingSave: true });
  assertViolation('SYN-01');
});

// Y-02 — SYN-01 : saveProfile avec _loadCorrupted=false → pas de violation
test('Y-02: SYN-01 saveProfile avec loadCorrupted=false — aucune violation SYN-01', function () {
  SFCInvariant.checkSync({ _loadCorrupted: false, _attemptingSave: true });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SYN-01'; }), 'SYN-01 ne doit pas déclencher');
});

// Y-03 — SYN-02 : autosync déclenché avec _profileDirty=false → violation
test('Y-03: SYN-02 autosync profileDirty=false — violation SYN-02', function () {
  SFCInvariant.checkSync({ _profileDirty: false, _attemptingAutosync: true });
  assertViolation('SYN-02');
});

// Y-04 — SYN-02 : autosync avec _profileDirty=true → pas de violation
test('Y-04: SYN-02 autosync profileDirty=true — aucune violation SYN-02', function () {
  SFCInvariant.checkSync({ _profileDirty: true, _attemptingAutosync: true });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SYN-02'; }), 'SYN-02 ne doit pas déclencher');
});

// Y-05 — SYN-03 : first_login_date régresse → violation
test('Y-05: SYN-03 first_login_date regresse — violation SYN-03', function () {
  SFCInvariant.checkSync({
    first_login_date:      '2024-01-01T00:00:00Z',
    first_login_date_prev: '2025-06-01T00:00:00Z'  // plus récent → régression
  });
  assertViolation('SYN-03');
});

// Y-06 — SYN-03 : first_login_date ne régresse pas → pas de violation
test('Y-06: SYN-03 first_login_date stable — aucune violation SYN-03', function () {
  SFCInvariant.checkSync({
    first_login_date:      '2025-06-01T00:00:00Z',
    first_login_date_prev: '2024-01-01T00:00:00Z'  // antérieur → OK
  });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SYN-03'; }), 'SYN-03 ne doit pas déclencher');
});

// Y-07 — SYN-04 : utilisateur premium actif avec subscription_end dans le passé → violation
test('Y-07: SYN-04 premium actif subscription_end passé — violation SYN-04', function () {
  SFCInvariant.checkSync({
    isPremiumActive:  true,
    subscription_end: '2020-01-01T00:00:00Z'  // passé
  });
  assertViolation('SYN-04');
});

// Y-08 — SYN-04 : subscription_end dans le futur → pas de violation
test('Y-08: SYN-04 subscription_end futur — aucune violation SYN-04', function () {
  var future = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(); // +90 jours
  SFCInvariant.checkSync({
    isPremiumActive:  true,
    subscription_end: future
  });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'SYN-04'; }), 'SYN-04 ne doit pas déclencher');
});

// ═════════════════════════════════════════════════════════════════════════════
// PREMIUM
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== Invariants Premium ===');

// P-01 — PRM-01 : isPremium()=true avec _subStatusReady=false et plan non reconnu → violation
test('P-01: PRM-01 isPremium=true sans subStatusReady ni plan — violation PRM-01', function () {
  SFCInvariant.checkPremium({
    _subStatusReady:    false,
    subscriptionPlan:   'inconnu',
    isPremiumResult:    true   // ne devrait pas être vrai
  });
  assertViolation('PRM-01');
});

// P-02 — PRM-01 : isPremium()=false avec _subStatusReady=false et plan non reconnu → pas de violation
test('P-02: PRM-01 isPremium=false sans subStatusReady — aucune violation PRM-01', function () {
  SFCInvariant.checkPremium({
    _subStatusReady:    false,
    subscriptionPlan:   'inconnu',
    isPremiumResult:    false   // fail-closed correct
  });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'PRM-01'; }), 'PRM-01 ne doit pas déclencher');
});

// P-03 — PRM-01 : plan reconnu (premium) même sans _subStatusReady → pas de violation
test('P-03: PRM-01 plan premium reconnu sans subStatusReady — aucune violation PRM-01', function () {
  SFCInvariant.checkPremium({
    _subStatusReady:    false,
    subscriptionPlan:   'premium',   // plan reconnu → exception légitime
    isPremiumResult:    true
  });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'PRM-01'; }), 'PRM-01 ne doit pas déclencher pour plan reconnu');
});

// P-04 — PRM-02 : requirePremium en prod sans admin client → doit renvoyer erreur
test('P-04: PRM-02 prod sans adminClient result!=503 — violation PRM-02', function () {
  SFCInvariant.checkPremium({
    isProduction:            true,
    hasAdminClient:          false,
    requirePremiumResult:    'skip'  // devrait être 503 ou 'error', pas 'skip'
  });
  assertViolation('PRM-02');
});

// P-05 — PRM-02 : requirePremium en prod sans admin client renvoie 503 → correct
test('P-05: PRM-02 prod sans adminClient result=503 — aucune violation PRM-02', function () {
  SFCInvariant.checkPremium({
    isProduction:            true,
    hasAdminClient:          false,
    requirePremiumResult:    503
  });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'PRM-02'; }), 'PRM-02 ne doit pas déclencher');
});

// P-06 — PRM-02 : requirePremium hors prod (local dev) → pas de violation même si pas d'admin
test('P-06: PRM-02 hors prod sans adminClient — aucune violation PRM-02', function () {
  SFCInvariant.checkPremium({
    isProduction:            false,
    hasAdminClient:          false,
    requirePremiumResult:    'skip'  // acceptable en dev
  });
  assert(!SFCInvariant.getViolations().some(function (v) { return v.id === 'PRM-02'; }), 'PRM-02 ne doit pas déclencher hors prod');
});

// ═════════════════════════════════════════════════════════════════════════════
// MODE warn vs throw
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== Mode warn vs throw ===');

// M-01 — mode warn par défaut : violation log sans throw
test('M-01: mode warn par defaut — violation logguee sans throw', function () {
  SFCInvariant.setMode('warn');
  assert(SFCInvariant.getMode() === 'warn', 'mode doit être warn');
  // Cette violation ne doit pas throw
  SFCInvariant.checkNutrition(
    makeResult({ caloriesTarget: 1200 }),
    makeProfile({ sex: 'homme' })
  );
  assertViolation('NUT-01'); // violation enregistrée
});

// M-02 — mode throw : violation génère une erreur
test('M-02: mode throw — violation leve une erreur', function () {
  SFCInvariant.setMode('throw');
  assertThrows(function () {
    SFCInvariant.checkNutrition(
      makeResult({ caloriesTarget: 1200 }),
      makeProfile({ sex: 'homme' })
    );
  }, '[SFCInvariant] NUT-01');
});

// M-03 — mode throw : le message d'erreur contient l'ID d'invariant
test('M-03: mode throw — message contient ID invariant NUT-04', function () {
  SFCInvariant.setMode('throw');
  assertThrows(function () {
    SFCInvariant.checkNutrition(
      makeResult({ carbsGrams: 50 }),
      makeProfile()
    );
  }, 'NUT-');
});

// M-04 — setMode invalide ignoré : mode reste inchangé
test('M-04: setMode valeur invalide — mode reste inchange', function () {
  SFCInvariant.setMode('warn');
  SFCInvariant.setMode('invalid_mode');
  assert(SFCInvariant.getMode() === 'warn', 'mode ne doit pas changer pour une valeur invalide');
});

// M-05 — mode throw n'affecte pas le buffer violations
test('M-05: mode throw — violation quand meme enregistree dans buffer', function () {
  SFCInvariant.setMode('throw');
  var caught = false;
  try {
    SFCInvariant.checkNutrition(
      makeResult({ caloriesTarget: 1200 }),
      makeProfile({ sex: 'homme' })
    );
  } catch (e) { caught = true; }
  assert(caught, 'throw devait se produire');
  assertViolation('NUT-01'); // toujours dans le buffer
});

// ═════════════════════════════════════════════════════════════════════════════
// CONTEXT / MONITORING BRIDGE
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== Context / Monitoring bridge ===');

// C-01 — getViolations retourne copie (pas référence)
test('C-01: getViolations retourne une copie independante', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1200 }), makeProfile({ sex: 'homme' }));
  var v1 = SFCInvariant.getViolations();
  var countBefore = v1.length;
  assert(countBefore > 0, 'il doit y avoir au moins une violation avant la manipulation');
  // Ajouter un élément factice à la copie retournée
  v1.push({ id: 'FAKE', msg: 'fake', ctx: {}, ts: 0 });
  // Le buffer interne ne doit pas avoir changé
  var v2 = SFCInvariant.getViolations();
  assert(v2.length === countBefore, 'modification de la copie ne doit pas affecter le buffer interne (attendu ' + countBefore + ', obtenu ' + v2.length + ')');
});

// C-02 — clearViolations vide le buffer
test('C-02: clearViolations vide le buffer', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1200 }), makeProfile({ sex: 'homme' }));
  assert(SFCInvariant.getViolations().length > 0, 'il doit y avoir des violations avant clear');
  SFCInvariant.clearViolations();
  assert(SFCInvariant.getViolations().length === 0, 'buffer doit être vide après clear');
});

// C-03 — violation contient les champs requis (id, msg, ctx, ts)
test('C-03: violation contient id/msg/ctx/ts', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1200 }), makeProfile({ sex: 'homme' }));
  var v = SFCInvariant.getViolations();
  assert(v.length > 0, 'il doit y avoir au moins une violation');
  var entry = v[0];
  assert(typeof entry.id  === 'string' && entry.id.length  > 0, 'id doit être une string non vide');
  assert(typeof entry.msg === 'string' && entry.msg.length > 0, 'msg doit être une string non vide');
  assert(typeof entry.ctx === 'object' && entry.ctx !== null,   'ctx doit être un objet');
  assert(typeof entry.ts  === 'number' && entry.ts  > 0,        'ts doit être un timestamp positif');
});

// C-04 — violation contient les valeurs mesurées dans ctx
test('C-04: ctx contient les valeurs incriminées', function () {
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1200 }), makeProfile({ sex: 'homme' }));
  var v = SFCInvariant.getViolations().filter(function (vi) { return vi.id === 'NUT-01'; });
  assert(v.length > 0, 'NUT-01 doit être présent');
  assert(v[0].ctx.caloriesTarget === 1200, 'ctx.caloriesTarget doit valoir 1200');
});

// C-05 — SFCMonitor.reportInvariant est appelé si présent (bridge monitoring)
test('C-05: SFCMonitor.reportInvariant appelee si present', function () {
  var reported = [];
  // Simuler SFCMonitor côté navigateur
  global.window = { SFCMonitor: { reportInvariant: function (e) { reported.push(e); } } };
  // Recharger le module pour qu'il voie window.SFCMonitor
  // (le module est déjà chargé, mais _assert appelle window.SFCMonitor dynamiquement)
  SFCInvariant.setMode('warn');
  SFCInvariant.checkNutrition(makeResult({ caloriesTarget: 1200 }), makeProfile({ sex: 'homme' }));
  global.window = _savedWindow; // restaurer
  assert(reported.length > 0, 'SFCMonitor.reportInvariant devrait avoir été appelée');
  assert(reported[0].id === 'NUT-01', 'l\'entrée reportée doit avoir id NUT-01');
});

// C-06 — Plusieurs violations accumulées en mode warn
test('C-06: plusieurs violations accumulees en mode warn', function () {
  SFCInvariant.setMode('warn');
  // carbsGrams=100 (<130) ET fatGrams=10 (<15%) ET caloriesTarget=1200 (<1500)
  SFCInvariant.checkNutrition(
    makeResult({ caloriesTarget: 1200, carbsGrams: 100, fatGrams: 10 }),
    makeProfile({ sex: 'homme' })
  );
  var v = SFCInvariant.getViolations();
  var ids = v.map(function (vi) { return vi.id; });
  assert(ids.indexOf('NUT-01') !== -1, 'NUT-01 attendu');
  assert(ids.indexOf('NUT-03') !== -1, 'NUT-03 attendu');
  assert(ids.indexOf('NUT-04') !== -1, 'NUT-04 attendu');
  assert(v.length >= 3, 'au moins 3 violations attendues');
});

// C-07 — checkNutrition avec profil null → violation NUT-00 générique
test('C-07: checkNutrition profil null — violation NUT-00 defensive guard', function () {
  SFCInvariant.setMode('warn');
  SFCInvariant.checkNutrition(makeResult(), null);
  assertViolation('NUT-00');
});

// ─── Rapport final ────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────────────');
console.log('Résultat : ' + _passed + ' PASS, ' + _failed + ' FAIL');
if (_errors.length > 0) {
  console.error('\nTests échoués :');
  _errors.forEach(function (e) { console.error('  ✗', e.name, '—', e.error); });
}
console.log('─────────────────────────────────────────────────────────────────\n');

if (_failed > 0) process.exit(1);
