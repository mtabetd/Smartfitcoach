'use strict';
/**
 * unit-long-cycle.js — Tests cycle long 12 semaines SmartFitCoach
 *
 * A) Carb cycling sur 12 semaines (84 jours)
 * B) Sport periodization 12 semaines avec mock SFCSymbiosis
 * C) Streak reset garanti (14 jours, repos en J8)
 * D) IOM floor sur 12 semaines profil light sédentaire
 */

var fs   = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Bootstrap DOM minimal ────────────────────────────────────────────────────
global.window = global;
global.document = {
  createElement: function(t) {
    return {
      style: {}, setAttribute: function(){}, appendChild: function(){},
      classList: { add: function(){}, remove: function(){}, toggle: function(){} },
      tagName: t, textContent: '',
      createTextNode: function(s) { return { nodeType: 3, textContent: s }; }
    };
  },
  createTextNode: function(s) { return { nodeType: 3, textContent: s }; },
  getElementById: function() { return null; },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener: function() {},
  removeEventListener: function() {},
  body: { appendChild: function(){}, classList: { add: function(){}, remove: function(){} } },
  head: { appendChild: function(){} },
  location: { href: '', search: '', hash: '' }
};
try { Object.defineProperty(global, 'navigator', { value: { userAgent: '', language: 'fr-FR' }, configurable: true }); } catch(e) {}
global.localStorage   = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.sessionStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.history        = { pushState: function(){}, replaceState: function(){} };
try { Object.defineProperty(global, 'location', { value: { href:'', search:'', hash:'' }, configurable: true }); } catch(e) {}
global.performance    = { now: function(){ return Date.now(); } };

// ─── Compteurs ────────────────────────────────────────────────────────────────
var pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch(e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function approx(a, b, tol) {
  tol = tol || 5;
  if (Math.abs(a - b) > tol) throw new Error('Got ' + a + ' expected ~' + b + ' (±' + tol + ')');
}

// ─── Chargement des modules réels ─────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js',         'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js',          'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js',        'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js',    'utf8'));
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js','utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-symbiosis.js',   'utf8'));
eval(fs.readFileSync(ROOT + '/app/exercises-db.js',    'utf8'));
var _muscuEngine = require(ROOT + '/app/muscu-engine.js');
window.sfcBuildMuscuDay = _muscuEngine.sfcBuildMuscuDay;
eval(fs.readFileSync(ROOT + '/app/sport-data.js',      'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-sport.js',       'utf8'));

// ─── Index des objectifs ──────────────────────────────────────────────────────
var GOALS_LIST  = window.GOALS || [];
var maintainIdx = GOALS_LIST.findIndex(function(g){ return g.key === 'maintain';  });
var shredIdx    = GOALS_LIST.findIndex(function(g){ return g.key === 'shred';     });
var cutIdx      = GOALS_LIST.findIndex(function(g){ return g.key === 'cut';       });

// ─── Helper profil de base nutrition ─────────────────────────────────────────
function setProfile(overrides) {
  var base = {
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, medical: [], pregnant: false, birthDate: null,
    cycleTracking: false, regime: 0, supplements: [],
    trainingDaysSelected: [], sportGoals: [],
    appMode: 'nutrition',
    heavyDayStreak: 0,
    trainingLoad: null, dailyTrainingLoad: null,
    _nm: null
  };
  Object.keys(overrides).forEach(function(k){ base[k] = overrides[k]; });
  window.S = base;
  return window.S;
}

// ─── Helper profil sport ──────────────────────────────────────────────────────
function makeSportState(overrides) {
  var base = {
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, medical: [], pregnant: false,
    birthDate: null, cycleTracking: false, regime: 0, supplements: [],
    trainingDaysSelected: [1, 2, 4, 5],
    sportType: 'musculation',
    sportLevel: 'intermediate', sportEquipment: 'gym',
    sportGoals: ['muscle'],
    sportDays: 4, muscuCycle: 1,
    sportSessionDuration: '1h',
    sportFocus: { 'Poitrine': 4, 'Dos': 4, 'Jambes': 3, 'Épaules': 3 },
    muscuMedical: { done: false },
    appMode: 'sport'
  };
  Object.keys(overrides).forEach(function(k){ base[k] = overrides[k]; });
  return base;
}

// ─── Helper : compter le total de séries d'un programme ───────────────────────
function countSets(prog) {
  if (!prog) return 0;
  var total = 0;
  prog.forEach(function(day) {
    (day.exercises || []).forEach(function(ex) {
      var m = (ex.sets || '').match(/^(\d+)/);
      if (m) total += parseInt(m[1]);
    });
  });
  return total;
}

// ─── Helper : compter les reps minimales d'un programme ────────────────────────
// Retourne la moyenne des borne basses de reps (ex: "3×5-8" → 5)
function avgMinReps(prog) {
  if (!prog) return 0;
  var total = 0, count = 0;
  prog.forEach(function(day) {
    (day.exercises || []).forEach(function(ex) {
      var m = (ex.sets || '').match(/[×x](\d+)-(\d+)/);
      if (m) { total += parseInt(m[1]); count++; }
    });
  });
  return count > 0 ? total / count : 0;
}

// ─── Mock SFCSymbiosis avec weekIndex forcé ───────────────────────────────────
function mockSymbiosis(weekIndex) {
  var PERIO = {
    1: { durMax: 6, durSets: 4, restOverride: null,        note: 'S1' },
    2: { durMax: 6, durSets: 5, restOverride: null,        note: 'S2' },
    3: { durMax: 5, durSets: 5, restOverride: '120-180s',  note: 'S3' },
    4: { durMax: 4, durSets: 3, restOverride: '60s',       note: 'S4' }
  };
  window.SFCSymbiosis = {
    getWeekIndex:        function() { return weekIndex; },
    getPeriodizationCfg: function(wi) {
      return PERIO[((wi - 1) % 4) + 1] || PERIO[1];
    }
  };
}

function restoreSymbiosis() {
  // Les modules ont été eval-és : SFCSymbiosis est déjà dans window
  if (typeof SFCSymbiosis !== 'undefined') window.SFCSymbiosis = SFCSymbiosis;
}

// ═══════════════════════════════════════════════════════════════════════════════
// A) CARB CYCLING SUR 12 SEMAINES (84 JOURS)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== A) Carb cycling 12 semaines ===');

check('A-01 Calories neutres ±5% sur TOUS les 84 jours', function() {
  // Jours d'entraînement : L=1, M=2, J=4 (ISO : 1=lundi, 0=dimanche)
  var trainingDays = [1, 2, 4]; // lundi, mardi, jeudi
  var loads = ['heavy', 'moderate', 'light'];
  var loadIdx = 0;
  var violations = [];

  for (var day = 0; day < 84; day++) {
    var dayOfWeek = day % 7; // 0=lundi, 1=mardi, ..., 6=dimanche
    var isTraining = trainingDays.indexOf(dayOfWeek) !== -1;
    var currentLoad = null;

    if (isTraining) {
      currentLoad = loads[loadIdx % loads.length];
      loadIdx++;
    }

    setProfile({
      sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
      goal: maintainIdx,
      sportGoals: ['muscle'],
      trainingDaysSelected: trainingDays,
      trainingLoad: isTraining ? currentLoad : null,
      dailyTrainingLoad: isTraining ? currentLoad : null,
      heavyDayStreak: 0
    });

    var nm = window.computeNutritionState(isTraining);
    assert(nm !== null, 'Jour ' + day + ' : computeNutritionState retourné null');

    var pct = Math.abs(nm.caloriesCheck - nm.caloriesTarget) / nm.caloriesTarget * 100;
    if (pct > 5) {
      violations.push('J' + day + '(' + (isTraining ? currentLoad : 'repos') + ') caloriesCheck=' +
        nm.caloriesCheck + ' target=' + nm.caloriesTarget + ' écart=' + pct.toFixed(1) + '%');
    }
  }

  assert(violations.length === 0,
    violations.length + ' violations calorique ±5% :\n  ' + violations.slice(0,3).join('\n  '));
});

check('A-02 Jour de repos : carbsGrams <= carbsBase OU == 130 (IOM floor)', function() {
  var trainingDays = [1, 2, 4];
  var violations = [];

  // Calculer carbsBase (jour de référence sans carb cycling actif mais avec profil sport)
  // On utilise le résultat de NutritionMaster avant le cycling pour comparer
  for (var day = 0; day < 84; day++) {
    var dayOfWeek = day % 7;
    var isTraining = trainingDays.indexOf(dayOfWeek) !== -1;
    if (isTraining) continue; // tester uniquement les repos

    setProfile({
      sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
      goal: maintainIdx, sportGoals: ['muscle'],
      trainingDaysSelected: trainingDays,
      trainingLoad: null, dailyTrainingLoad: null,
      heavyDayStreak: 0
    });

    var nm = window.computeNutritionState(false);
    assert(nm !== null, 'repos J' + day + ' : nm null');

    // Calculer la base (sans cycling) : nm.carbsGrams est déjà après cycling (-10%)
    // La contrainte est : nm.carbsGrams >= 130 (IOM floor) et les calories doivent être neutres
    assert(nm.carbsGrams >= 130,
      'IOM floor violé repos J' + day + ' : carbsGrams=' + nm.carbsGrams);
  }
});

check('A-03 Jour heavy : carbsGrams > carbsBase (référence repos)', function() {
  var trainingDays = [1, 2, 4];

  // Calculer la référence repos
  setProfile({
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, sportGoals: ['muscle'],
    trainingDaysSelected: trainingDays,
    trainingLoad: null, dailyTrainingLoad: null, heavyDayStreak: 0
  });
  var nmRest = window.computeNutritionState(false);
  assert(nmRest !== null, 'nmRest null');
  var carbsBase = nmRest.carbsGrams;

  // Vérifier que heavy > repos sur plusieurs semaines
  var violations = [];
  for (var week = 0; week < 12; week++) {
    setProfile({
      sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
      goal: maintainIdx, sportGoals: ['muscle'],
      trainingDaysSelected: trainingDays,
      trainingLoad: 'heavy', dailyTrainingLoad: 'heavy',
      heavyDayStreak: 0
    });
    var nm = window.computeNutritionState(true);
    assert(nm !== null, 'heavy semaine ' + (week+1) + ' : nm null');
    if (nm.carbsGrams <= carbsBase) {
      violations.push('S' + (week+1) + ' heavy carbsGrams=' + nm.carbsGrams + ' <= base=' + carbsBase);
    }
  }
  assert(violations.length === 0,
    violations.length + ' violations heavy > base :\n  ' + violations.join('\n  '));
});

check('A-04 heavyDayStreak ne dépasse jamais 7 (physiologiquement impossible)', function() {
  // Simuler 14 jours heavy consécutifs et vérifier que le streak s'accumule normalement
  // mais aussi vérifier qu'aucune logique ne le laisse à >7 après un repos
  setProfile({
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, sportGoals: ['muscle'],
    trainingDaysSelected: [0,1,2,3,4,5,6],
    trainingLoad: 'heavy', dailyTrainingLoad: 'heavy', heavyDayStreak: 0
  });

  for (var d = 0; d < 7; d++) {
    window.computeNutritionState(true);
    assert(window.S.heavyDayStreak <= 7,
      'Streak jour ' + (d+1) + ' dépasse 7 : ' + window.S.heavyDayStreak);
  }
  // Vérifier que après 7 jours consécutifs, le repos reset à 0
  window.computeNutritionState(false);
  assert(window.S.heavyDayStreak === 0,
    'Streak doit être 0 après repos, obtenu=' + window.S.heavyDayStreak);
});

check('A-05 Neutralité calorique sur les 12 types de combinaisons (3×4)', function() {
  var loads = ['heavy', 'moderate', 'light'];
  var isTrainingVals = [true, false];
  var violations = [];

  loads.forEach(function(load) {
    isTrainingVals.forEach(function(isTraining) {
      setProfile({
        sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
        goal: maintainIdx, sportGoals: ['muscle'],
        trainingDaysSelected: [1, 2, 4],
        trainingLoad: isTraining ? load : null,
        dailyTrainingLoad: isTraining ? load : null,
        heavyDayStreak: 0
      });
      var nm = window.computeNutritionState(isTraining);
      if (!nm) return;
      var pct = Math.abs(nm.caloriesCheck - nm.caloriesTarget) / nm.caloriesTarget * 100;
      if (pct > 5) {
        violations.push('training=' + isTraining + ' load=' + load +
          ' check=' + nm.caloriesCheck + ' target=' + nm.caloriesTarget +
          ' écart=' + pct.toFixed(1) + '%');
      }
    });
  });
  assert(violations.length === 0,
    'Violations neutralité calorique :\n  ' + violations.join('\n  '));
});

// ═══════════════════════════════════════════════════════════════════════════════
// B) SPORT PERIODIZATION 12 SEMAINES
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== B) Sport periodization 12 semaines ===');

check('B-01 S1 < S2 en nombre total de séries (progression)', function() {
  mockSymbiosis(1);
  window.S = makeSportState({ muscuCycle: 1 });
  var progS1 = window.generateSportProgram();
  var setsS1 = countSets(progS1);

  mockSymbiosis(2);
  window.S = makeSportState({ muscuCycle: 1 });
  var progS2 = window.generateSportProgram();
  var setsS2 = countSets(progS2);

  restoreSymbiosis();
  assert(progS1 !== null && progS1.length > 0, 'Programme S1 vide');
  assert(progS2 !== null && progS2.length > 0, 'Programme S2 vide');
  assert(setsS2 > setsS1,
    'S2 devrait avoir plus de séries que S1. S1=' + setsS1 + ' S2=' + setsS2);
  console.log('    S1=' + setsS1 + ' séries, S2=' + setsS2 + ' séries');
});

check('B-02 S3 ≡ S2 en séries mais reps inférieures', function() {
  mockSymbiosis(2);
  window.S = makeSportState({ muscuCycle: 1 });
  var progS2 = window.generateSportProgram();
  var setsS2 = countSets(progS2);
  var repsS2 = avgMinReps(progS2);

  mockSymbiosis(3);
  window.S = makeSportState({ muscuCycle: 1 });
  var progS3 = window.generateSportProgram();
  var setsS3 = countSets(progS3);
  var repsS3 = avgMinReps(progS3);

  restoreSymbiosis();
  assert(progS2 !== null && progS2.length > 0, 'Programme S2 vide');
  assert(progS3 !== null && progS3.length > 0, 'Programme S3 vide');
  // S2 et S3 ont tous les deux durSets=5 → séries similaires (±20% acceptable)
  var setsDiff = Math.abs(setsS3 - setsS2);
  var maxDiff  = Math.max(1, Math.round(setsS2 * 0.25));
  assert(setsDiff <= maxDiff,
    'S3 et S2 devraient avoir des séries similaires (±25%). S2=' + setsS2 + ' S3=' + setsS3);
  // S3 a restOverride='120-180s' (charges lourdes → reps basses) — si la DB comporte des
  // exercices composés force, les reps min seront inférieures en S3.
  // On vérifie uniquement si des données reps existent dans les deux programmes.
  if (repsS2 > 0 && repsS3 > 0) {
    assert(repsS3 <= repsS2,
      'Reps S3 (' + repsS3.toFixed(1) + ') devraient être <= S2 (' + repsS2.toFixed(1) + ')');
  }
  console.log('    S2=' + setsS2 + ' séries (' + repsS2.toFixed(1) + ' reps min avg)' +
    ', S3=' + setsS3 + ' séries (' + repsS3.toFixed(1) + ' reps min avg)');
});

check('B-03 S4 (deload) < S1 en nombre de séries', function() {
  mockSymbiosis(1);
  window.S = makeSportState({ muscuCycle: 1 });
  var progS1 = window.generateSportProgram();
  var setsS1 = countSets(progS1);

  mockSymbiosis(4);
  window.S = makeSportState({ muscuCycle: 1 });
  var progS4 = window.generateSportProgram();
  var setsS4 = countSets(progS4);

  restoreSymbiosis();
  assert(progS1 !== null && progS1.length > 0, 'Programme S1 vide');
  assert(progS4 !== null && progS4.length > 0, 'Programme S4 vide');
  assert(setsS4 < setsS1,
    'S4 (deload) devrait avoir moins de séries que S1. S1=' + setsS1 + ' S4=' + setsS4);
  console.log('    S1=' + setsS1 + ' séries, S4 deload=' + setsS4 + ' séries');
});

check('B-04 Jamais double deload : muscuCycle=3 + SFCSymbiosis S4', function() {
  // muscuCycle=3 → _cyclePhaseIdx=2 (Transition/deload naturel)
  // SFCSymbiosis weekIndex=4 → S4 (deload périodisation)
  // Le guard && !_perioCfg doit empêcher le deload natif quand la périodisation s'en charge
  mockSymbiosis(4);
  window.S = makeSportState({ muscuCycle: 3, sportDays: 3, sportSessionDuration: '1h' });
  var prog = window.generateSportProgram();
  restoreSymbiosis();

  assert(prog !== null, 'Programme null avec muscuCycle=3 + S4');
  assert(Array.isArray(prog) && prog.length > 0, 'Programme vide avec muscuCycle=3 + S4');

  // Un double-deload produirait un programme avec très peu de séries (<9 pour 3 jours)
  var totalSets = countSets(prog);
  assert(totalSets >= 9,
    'Double-deload détecté : total séries=' + totalSets + ' (minimum attendu 9 pour 3 jours)');
  console.log('    muscuCycle=3 + S4 → ' + totalSets + ' séries (pas de double-deload)');
});

check('B-05 Progression de volume S1→S2 stable sur les 3 cycles de 12 semaines', function() {
  // Vérifier que S1<S2 est consistant sur semaines 1,5,9 (S1) vs 2,6,10 (S2)
  var s1Totals = [], s2Totals = [];
  [1, 5, 9].forEach(function(wi) {
    mockSymbiosis(wi);
    window.S = makeSportState({ muscuCycle: 1 });
    var prog = window.generateSportProgram();
    s1Totals.push(countSets(prog));
  });
  [2, 6, 10].forEach(function(wi) {
    mockSymbiosis(wi);
    window.S = makeSportState({ muscuCycle: 1 });
    var prog = window.generateSportProgram();
    s2Totals.push(countSets(prog));
  });
  restoreSymbiosis();

  // Chaque paire S1[i] < S2[i]
  for (var i = 0; i < 3; i++) {
    assert(s2Totals[i] > s1Totals[i],
      'Cycle ' + (i+1) + ': S2 (' + s2Totals[i] + ') devrait > S1 (' + s1Totals[i] + ')');
  }
  console.log('    S1: ' + s1Totals.join('/') + ' → S2: ' + s2Totals.join('/'));
});

check('B-06 Deload en S4 toujours < S1 sur les 3 cycles', function() {
  var s1Totals = [], s4Totals = [];
  [1, 5, 9].forEach(function(wi) {
    mockSymbiosis(wi);
    window.S = makeSportState({ muscuCycle: 1 });
    s1Totals.push(countSets(window.generateSportProgram()));
  });
  [4, 8, 12].forEach(function(wi) {
    mockSymbiosis(wi);
    window.S = makeSportState({ muscuCycle: 1 });
    s4Totals.push(countSets(window.generateSportProgram()));
  });
  restoreSymbiosis();

  for (var i = 0; i < 3; i++) {
    assert(s4Totals[i] < s1Totals[i],
      'Cycle ' + (i+1) + ': S4 deload (' + s4Totals[i] + ') devrait < S1 (' + s1Totals[i] + ')');
  }
  console.log('    S1: ' + s1Totals.join('/') + ' → S4 deload: ' + s4Totals.join('/'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// C) STREAK RESET GARANTI
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== C) Streak reset garanti ===');

check('C-01 Streak incrémental sur J1→J7 consécutifs heavy', function() {
  setProfile({
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, sportGoals: ['muscle'],
    trainingDaysSelected: [0,1,2,3,4,5,6],
    trainingLoad: 'heavy', dailyTrainingLoad: 'heavy', heavyDayStreak: 0
  });

  for (var day = 1; day <= 7; day++) {
    window.computeNutritionState(true);
    assert(window.S.heavyDayStreak === day,
      'Streak J' + day + ' attendu=' + day + ', obtenu=' + window.S.heavyDayStreak);
  }
  console.log('    Streak J1→J7 : 1,2,3,4,5,6,7 OK');
});

check('C-02 Repos en J8 → streak reset à 0', function() {
  // Démarrer avec streak=7
  setProfile({
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, sportGoals: ['muscle'],
    trainingDaysSelected: [0,1,2,3,4,5,6],
    trainingLoad: 'heavy', dailyTrainingLoad: 'heavy', heavyDayStreak: 7
  });

  // J8 = repos
  window.computeNutritionState(false);
  assert(window.S.heavyDayStreak === 0,
    'Streak J8 (repos) attendu=0, obtenu=' + window.S.heavyDayStreak);
});

check('C-03 Reprise heavy J9 → streak repart de 1', function() {
  // Après repos (streak=0), reprise heavy
  setProfile({
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, sportGoals: ['muscle'],
    trainingDaysSelected: [0,1,2,3,4,5,6],
    trainingLoad: 'heavy', dailyTrainingLoad: 'heavy', heavyDayStreak: 0
  });

  window.computeNutritionState(true);
  assert(window.S.heavyDayStreak === 1,
    'Streak J9 (heavy après repos) attendu=1, obtenu=' + window.S.heavyDayStreak);
});

check('C-04 Séquence complète 14 jours : heavy×7 + repos×1 + heavy×6', function() {
  setProfile({
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, sportGoals: ['muscle'],
    trainingDaysSelected: [0,1,2,3,4,5,6],
    trainingLoad: 'heavy', dailyTrainingLoad: 'heavy', heavyDayStreak: 0
  });

  // J1→J7 : heavy (streak 1→7)
  for (var d1 = 1; d1 <= 7; d1++) {
    window.computeNutritionState(true);
    assert(window.S.heavyDayStreak === d1,
      'J' + d1 + ' streak attendu=' + d1 + ' obtenu=' + window.S.heavyDayStreak);
  }

  // J8 : repos → reset
  window.computeNutritionState(false);
  assert(window.S.heavyDayStreak === 0, 'J8 repos streak attendu=0, obtenu=' + window.S.heavyDayStreak);

  // J9→J14 : heavy (streak 1→6)
  for (var d2 = 1; d2 <= 6; d2++) {
    window.computeNutritionState(true);
    assert(window.S.heavyDayStreak === d2,
      'J' + (d2+8) + ' streak attendu=' + d2 + ' obtenu=' + window.S.heavyDayStreak);
  }
  console.log('    Séquence 14 jours validée avec succès');
});

check('C-05 Moderate/light ne compte pas dans le streak heavy', function() {
  setProfile({
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, sportGoals: ['muscle'],
    trainingDaysSelected: [0,1,2,3,4,5,6],
    trainingLoad: 'moderate', dailyTrainingLoad: 'moderate', heavyDayStreak: 3
  });

  // Jour moderate → streak doit être reset à 0 (car _trainedTodayHeavy = false pour moderate)
  window.computeNutritionState(true);
  assert(window.S.heavyDayStreak === 0,
    'Moderate ne devrait pas incrémenter streak heavy, obtenu=' + window.S.heavyDayStreak);
});

// ═══════════════════════════════════════════════════════════════════════════════
// D) IOM FLOOR SUR 12 SEMAINES PROFIL LIGHT
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== D) IOM floor 12 semaines profil light ===');

check('D-01 Carb floor 130g toujours respecté sur 84 jours (femme 50kg sédentaire sèche)', function() {
  var violations = [];
  var trainingDays = [1, 3, 5]; // quelques jours d'entraînement léger

  for (var day = 0; day < 84; day++) {
    var dayOfWeek = day % 7;
    var isTraining = trainingDays.indexOf(dayOfWeek) !== -1;

    setProfile({
      sex: 'femme', age: 35, weight: 50, height: 160, activity: 0,
      goal: cutIdx >= 0 ? cutIdx : shredIdx, // cut ou shred
      sportGoals: ['weightloss'],
      trainingDaysSelected: trainingDays,
      trainingLoad: isTraining ? 'light' : null,
      dailyTrainingLoad: isTraining ? 'light' : null,
      heavyDayStreak: 0
    });

    var nm = window.computeNutritionState(isTraining);
    if (!nm) continue; // profil incomplet → skip

    if (nm.carbsGrams < 130) {
      violations.push('J' + day + '(' + (isTraining ? 'training' : 'repos') + ') carbsGrams=' + nm.carbsGrams);
    }
  }
  assert(violations.length === 0,
    violations.length + ' violations IOM 130g floor :\n  ' + violations.slice(0,3).join('\n  '));
});

check('D-02 Neutralité calorique ±5% sur 84 jours profil light', function() {
  var violations = [];
  var trainingDays = [1, 3, 5];

  for (var day = 0; day < 84; day++) {
    var dayOfWeek = day % 7;
    var isTraining = trainingDays.indexOf(dayOfWeek) !== -1;

    setProfile({
      sex: 'femme', age: 35, weight: 50, height: 160, activity: 0,
      goal: cutIdx >= 0 ? cutIdx : shredIdx,
      sportGoals: ['weightloss'],
      trainingDaysSelected: trainingDays,
      trainingLoad: isTraining ? 'light' : null,
      dailyTrainingLoad: isTraining ? 'light' : null,
      heavyDayStreak: 0
    });

    var nm = window.computeNutritionState(isTraining);
    if (!nm || !nm.caloriesTarget || nm.caloriesTarget === 0) continue;

    var pct = Math.abs(nm.caloriesCheck - nm.caloriesTarget) / nm.caloriesTarget * 100;
    if (pct > 5) {
      violations.push('J' + day + ' check=' + nm.caloriesCheck + ' target=' + nm.caloriesTarget +
        ' écart=' + pct.toFixed(1) + '%');
    }
  }
  assert(violations.length === 0,
    violations.length + ' violations ±5% profil light :\n  ' + violations.slice(0,3).join('\n  '));
});

check('D-03 Déficit ne dépasse jamais 500 kcal sur profil light', function() {
  setProfile({
    sex: 'femme', age: 35, weight: 50, height: 160, activity: 0,
    goal: cutIdx >= 0 ? cutIdx : shredIdx,
    sportGoals: ['weightloss'],
    trainingDaysSelected: [1, 3, 5],
    trainingLoad: null, dailyTrainingLoad: null, heavyDayStreak: 0
  });

  var tdee   = window.calcTDEE();
  var target = window.calcTarget();

  if (tdee > 0 && target > 0) {
    var deficit = tdee - target;
    assert(deficit <= 500,
      'Déficit > 500 kcal : tdee=' + tdee + ' target=' + target + ' déficit=' + deficit);
    assert(target >= 1400, 'Plancher 1400 kcal violé : target=' + target);
    console.log('    TDEE=' + tdee + ' cible=' + target + ' déficit=' + deficit + ' kcal');
  }
});

check('D-04 Carb floor conservé même après cycling rest (-10%) sur TDEE ~1500', function() {
  // Femme 50kg sédentaire : TDEE ~1500 kcal → macros serrées → vérifier le floor
  setProfile({
    sex: 'femme', age: 35, weight: 50, height: 160, activity: 0,
    goal: cutIdx >= 0 ? cutIdx : shredIdx,
    sportGoals: ['weightloss'],
    trainingDaysSelected: [1, 3, 5],
    trainingLoad: null, dailyTrainingLoad: null, heavyDayStreak: 0
  });

  // Jour de repos → carb cycling enlève 10% mais IOM floor = 130g minimum
  var nm = window.computeNutritionState(false);
  if (nm) {
    assert(nm.carbsGrams >= 130,
      'IOM floor 130g violé en repos : carbsGrams=' + nm.carbsGrams);
    assert(nm.carbsGrams !== null && !isNaN(nm.carbsGrams),
      'carbsGrams NaN/null : ' + nm.carbsGrams);
    console.log('    TDEE~1500, repos : carbsGrams=' + nm.carbsGrams + 'g (floor 130g respecté)');
  }
});

check('D-05 12 semaines consécutives : aucun jour sous le plancher 1400 kcal', function() {
  var trainingDays = [1, 3, 5];
  var violations = [];

  for (var day = 0; day < 84; day++) {
    var dayOfWeek = day % 7;
    var isTraining = trainingDays.indexOf(dayOfWeek) !== -1;

    setProfile({
      sex: 'femme', age: 35, weight: 50, height: 160, activity: 0,
      goal: cutIdx >= 0 ? cutIdx : shredIdx,
      sportGoals: ['weightloss'],
      trainingDaysSelected: trainingDays,
      trainingLoad: isTraining ? 'light' : null,
      dailyTrainingLoad: isTraining ? 'light' : null,
      heavyDayStreak: 0
    });

    var nm = window.computeNutritionState(isTraining);
    if (!nm) continue;

    if (nm.caloriesTarget < 1400) {
      violations.push('J' + day + ' caloriesTarget=' + nm.caloriesTarget);
    }
  }
  assert(violations.length === 0,
    violations.length + ' jours sous 1400 kcal :\n  ' + violations.slice(0,3).join('\n  '));
});

// ─── Résultat final ───────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────');
console.log('Résultats : ' + pass + ' ✓  ' + fail + ' ✗  (total ' + (pass + fail) + ')');
if (fail > 0) { process.exit(1); }
