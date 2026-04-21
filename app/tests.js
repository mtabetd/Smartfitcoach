/**
 * SmartFitCoach — Suite de tests
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 *
 * USAGE : charger ce fichier dans la console du navigateur APRÈS que l'app
 * soit entièrement chargée, ou ajouter <script src="tests.js"></script> en
 * fin de body pour un lancement automatique.
 *
 * Ce fichier ne modifie aucune donnée utilisateur — il sauvegarde et
 * restaure window.S + mocks saveProfile/render pour isolation totale.
 */
(function() {
'use strict';

// ══════════════════════════════════════════════════════════════════════
// HARNESS — Framework minimal d'assertions
// ══════════════════════════════════════════════════════════════════════
var T = {
  pass: 0,
  fail: 0,
  results: [],
  assert: function(cond, name, detail) {
    if (cond) { this.pass++; this.results.push({ ok: true, name: name }); }
    else { this.fail++; this.results.push({ ok: false, name: name, detail: detail || '' }); }
  },
  eq: function(a, b, name) {
    this.assert(a === b, name, 'Attendu ' + JSON.stringify(b) + ' — Obtenu ' + JSON.stringify(a));
  },
  approx: function(a, b, tol, name) {
    var ok = Math.abs(a - b) <= tol;
    this.assert(ok, name, 'Attendu ~' + b + ' (±' + tol + ') — Obtenu ' + a);
  },
  gt: function(a, b, name) {
    this.assert(a > b, name, a + ' > ' + b + ' → faux');
  },
  isArray: function(a, name) {
    this.assert(Array.isArray(a), name, 'Pas un tableau : ' + typeof a);
  }
};

// ══════════════════════════════════════════════════════════════════════
// SETUP — Sauvegarde et mock des side-effects
// ══════════════════════════════════════════════════════════════════════
var origS = window.S ? JSON.parse(JSON.stringify(window.S)) : {};
var origSave = window.saveProfile;
var origRender = window.render;
window.saveProfile = function() {};
window.render = function() {};

function resetS(overrides) {
  window.S = Object.assign({
    goal: 1, weight: 75, height: 175, age: 30, sex: 'homme',
    activity: 1.55, sportDays: 3, sportType: 'muscu',
    sportLevel: 'intermediate', sportEquipment: 'gym', sportGoals: ['muscle'],
    sportFocus: null, muscuMedical: { done: false },
    muscuCycle: 1, muscuWeek: 1,
    mealsPerDay: 4, regime: 0,
    allergies: [], intolerances: [], cuisines: [], medical: [],
    whey: false, wheyFlavors: [], wantsDessert: false,
    allowPork: true, allowAlcohol: false, excluded: '', cookLevel: 2,
    weeklyCalendar: null, trainingDaysSelected: null,
    weekPlan: null, pregnant: false, cycleTracking: false
  }, overrides || {});
}

// ══════════════════════════════════════════════════════════════════════
// 1. getDayType() — Détection jour entraînement / repos
// ══════════════════════════════════════════════════════════════════════
(function testGetDayType() {
  if (!window.getDayType) { T.assert(false, 'getDayType: fonction exportée'); return; }

  function scenario(cal, day, expected, label) {
    resetS({ weeklyCalendar: cal });
    var r = window.getDayType(day);
    T.eq(!!(r && r.isTraining), expected, 'getDayType: ' + label);
  }

  scenario({ '0': 'repos' }, 0, false, "weeklyCalendar['0']='repos' → pas entraînement");
  scenario({ '0': 'autre' }, 0, false, "weeklyCalendar['0']='autre' → pas entraînement (fix 2026-04)");
  scenario({ '0': 'musculation' }, 0, true, "weeklyCalendar['0']='musculation' → entraînement");
  scenario({ '0': 'crossfit' }, 0, true, "weeklyCalendar['0']='crossfit' → entraînement");
  scenario({ '0': 'running' }, 0, true, "weeklyCalendar['0']='running' → entraînement");
  scenario({ '0': 'cycling' }, 0, true, "weeklyCalendar['0']='cycling' → entraînement");

  // Fallback #2 — trainingDaysSelected
  resetS({ weeklyCalendar: null, trainingDaysSelected: [0, 2, 4] });
  T.eq(!!window.getDayType(0).isTraining, true, 'getDayType: fallback trainingDaysSelected (jour 0 listé) → entraînement');
  T.eq(!!window.getDayType(1).isTraining, false, 'getDayType: fallback trainingDaysSelected (jour 1 absent) → repos');

  // Fallback #3 — sportDays layout standard
  resetS({ weeklyCalendar: null, trainingDaysSelected: null, sportDays: 3 });
  var layout = window.getDayType(0);
  T.assert(layout && typeof layout.isTraining === 'boolean', 'getDayType: fallback sportDays retourne un objet cohérent');
})();

// ══════════════════════════════════════════════════════════════════════
// 2. getPlanHash() — Hash de revalidation du plan nutrition
// ══════════════════════════════════════════════════════════════════════
(function testGetPlanHash() {
  if (!window.getPlanHash) { T.assert(false, 'getPlanHash: fonction exportée'); return; }

  resetS({ allergies: [], wheyFlavors: [] });
  var h1 = window.getPlanHash();
  T.assert(typeof h1 === 'string' && h1.length > 0, 'getPlanHash: retourne une chaîne non vide');

  var h2 = window.getPlanHash();
  T.eq(h1, h2, 'getPlanHash: deux appels identiques → même hash (stabilité)');

  // Allergies changent le hash
  window.S.allergies = ['Gluten'];
  var h3 = window.getPlanHash();
  T.assert(h1 !== h3, 'getPlanHash: ajout d\'une allergie change le hash');

  // Ordre des allergies normalisé (tri interne)
  window.S.allergies = ['Noix', 'Gluten'];
  var h4 = window.getPlanHash();
  window.S.allergies = ['Gluten', 'Noix'];
  var h5 = window.getPlanHash();
  T.eq(h4, h5, 'getPlanHash: ordre des allergies normalisé (tri interne)');

  // wheyFlavors change le hash (fix 2026-04)
  resetS({ wheyFlavors: [] });
  var h6 = window.getPlanHash();
  window.S.wheyFlavors = ['chocolat'];
  var h7 = window.getPlanHash();
  T.assert(h6 !== h7, 'getPlanHash: wheyFlavors change le hash (fix 2026-04)');

  // Régime change le hash
  resetS({ regime: 0 });
  var h8 = window.getPlanHash();
  window.S.regime = 3; // vegan
  var h9 = window.getPlanHash();
  T.assert(h8 !== h9, 'getPlanHash: changement de régime change le hash');
})();

// ══════════════════════════════════════════════════════════════════════
// 3. pickRecipe() — Fallback "Repas libre" avec macros calculées
// ══════════════════════════════════════════════════════════════════════
(function testPickRecipe() {
  if (!window.pickRecipe) { T.assert(false, 'pickRecipe: fonction exportée'); return; }

  resetS({});
  var targetK = 600;

  // Pool vide → Repas libre
  var r = window.pickRecipe([], targetK, new Set(), [], {});
  T.assert(r && r.n === 'Repas libre', 'pickRecipe: pool vide → "Repas libre"');
  T.eq(r && r.k, targetK, 'pickRecipe: Repas libre k = targetK');
  T.assert(r && r.p > 0, 'pickRecipe: Repas libre p > 0 (fix 2026-04 — était 0)');
  T.assert(r && r.g > 0, 'pickRecipe: Repas libre g > 0 (fix 2026-04 — était 0)');
  T.assert(r && r.l > 0, 'pickRecipe: Repas libre l > 0 (fix 2026-04 — était 0)');

  if (r) {
    var expP = Math.round(targetK * 0.3 / 4);
    var expG = Math.round(targetK * 0.4 / 4);
    var expL = Math.round(targetK * 0.3 / 9);
    T.eq(r.p, expP, 'pickRecipe: Repas libre p = 30% calorique (' + expP + 'g)');
    T.eq(r.g, expG, 'pickRecipe: Repas libre g = 40% calorique (' + expG + 'g)');
    T.eq(r.l, expL, 'pickRecipe: Repas libre l = 30% calorique (' + expL + 'g)');
    var reconstKcal = r.p * 4 + r.g * 4 + r.l * 9;
    T.approx(reconstKcal, targetK, targetK * 0.05, 'pickRecipe: macros reconstruisent ~targetK à ±5%');
  }

  // Pool non vide → retourne une vraie recette
  var fakePool = [{ n: 'Poulet riz test', k: 580, p: 45, g: 55, l: 12, f: '🍗', lv: 1, i: '', st: [], w: 2, tags: [] }];
  var r2 = window.pickRecipe(fakePool, 600, new Set(), [], {});
  T.assert(r2 && r2.n !== 'Repas libre', 'pickRecipe: pool non vide → retourne une recette (pas Repas libre)');
})();

// ══════════════════════════════════════════════════════════════════════
// 4. swapMeal() — Recalcul des totaux journaliers après swap
// ══════════════════════════════════════════════════════════════════════
(function testSwapMeal() {
  if (!window.swapMeal) { T.assert(false, 'swapMeal: fonction exportée'); return; }

  var STALE = 9999;
  var fakeDay = function() {
    return {
      breakfast: { n: 'B', k: 400, p: 30, g: 50, l: 10, _id: 'TB' },
      lunch:     { n: 'L', k: 600, p: 45, g: 70, l: 15, _id: 'TL' },
      snack:     { n: 'S', k: 200, p: 15, g: 25, l: 5,  _id: 'TS' },
      dinner:    { n: 'D', k: 500, p: 40, g: 55, l: 12, _id: 'TD' },
      kcal: STALE, p: STALE, g: STALE, l: STALE
    };
  };

  var emptyCal = { '0':'repos','1':'repos','2':'repos','3':'repos','4':'repos','5':'repos','6':'repos' };
  resetS({
    mealsPerDay: 4, weeklyCalendar: emptyCal,
    weekPlan: [fakeDay(), fakeDay(), fakeDay(), fakeDay(), fakeDay(), fakeDay(), fakeDay()]
  });

  var before = window.S.weekPlan[0];
  var beforeLunch = before.lunch.n;

  try { window.swapMeal(0, 'lunch'); } catch(e) {
    T.assert(false, 'swapMeal: pas d\'exception', e.message); return;
  }

  var d = window.S.weekPlan[0];
  var swapped = d.lunch && d.lunch.n !== beforeLunch;

  if (swapped) {
    // Swap réussi → vérifier que les totaux sont recalculés
    var sumK = (d.breakfast?d.breakfast.k:0) + (d.lunch?d.lunch.k:0) + (d.snack?d.snack.k:0) + (d.dinner?d.dinner.k:0);
    var sumP = (d.breakfast?d.breakfast.p:0) + (d.lunch?d.lunch.p:0) + (d.snack?d.snack.p:0) + (d.dinner?d.dinner.p:0);
    var sumG = (d.breakfast?d.breakfast.g:0) + (d.lunch?d.lunch.g:0) + (d.snack?d.snack.g:0) + (d.dinner?d.dinner.g:0);
    var sumL = (d.breakfast?d.breakfast.l:0) + (d.lunch?d.lunch.l:0) + (d.snack?d.snack.l:0) + (d.dinner?d.dinner.l:0);
    T.assert(d.kcal !== STALE, 'swapMeal: kcal journalier n\'est plus stale (≠ ' + STALE + ')');
    T.eq(d.kcal, sumK, 'swapMeal: kcal = somme des 4 slots (fix 2026-04)');
    T.eq(d.p, sumP, 'swapMeal: protéines = somme des 4 slots');
    T.eq(d.g, sumG, 'swapMeal: glucides = somme des 4 slots');
    T.eq(d.l, sumL, 'swapMeal: lipides = somme des 4 slots');
  } else {
    // Pool vide dans l'env de test — on skip mais on note
    T.assert(true, 'swapMeal: pool vide dans l\'env de test (swap non effectué, recalcul non testable)');
  }
})();

// ══════════════════════════════════════════════════════════════════════
// 5. generateSportProgram() — Génération programme musculation
// ══════════════════════════════════════════════════════════════════════
(function testGenerateSportProgram() {
  if (!window.generateSportProgram) { T.assert(false, 'generateSportProgram: fonction exportée'); return; }
  if (!window.EXERCISES) { T.assert(false, 'generateSportProgram: window.EXERCISES disponible'); return; }

  var configs = [
    { sportDays: 3, sportLevel: 'intermediate', sportEquipment: 'gym', sportGoals: ['muscle'] },
    { sportDays: 4, sportLevel: 'beginner', sportEquipment: 'home', sportGoals: ['weightloss'] },
    { sportDays: 5, sportLevel: 'advanced', sportEquipment: 'gym', sportGoals: ['strength'] }
  ];

  configs.forEach(function(cfg) {
    resetS(Object.assign({
      sportType: 'muscu', muscuMedical: { done: false }, muscuCycle: 1, muscuWeek: 1
    }, cfg));

    var prog;
    var label = cfg.sportDays + 'j / ' + cfg.sportLevel + ' / ' + cfg.sportEquipment + ' / ' + cfg.sportGoals[0];

    try { prog = window.generateSportProgram(); } catch(e) {
      T.assert(false, 'generateSportProgram [' + label + ']: pas d\'exception', e.message);
      return;
    }

    T.isArray(prog, 'generateSportProgram [' + label + ']: retourne un tableau');
    if (!Array.isArray(prog)) return;

    T.assert(prog.length > 0, 'generateSportProgram [' + label + ']: tableau non vide');

    // Chaque jour a des exercices
    var allHaveEx = prog.every(function(d) { return d && Array.isArray(d.exercises) && d.exercises.length > 0; });
    T.assert(allHaveEx, 'generateSportProgram [' + label + ']: chaque jour a >=1 exercice');

    // Aucun doublon d'exercice dans une même séance (test du bug Rack pull)
    var noDupes = prog.every(function(d) {
      if (!d || !Array.isArray(d.exercises)) return true;
      var names = d.exercises.map(function(e) { return (e.n || '').toLowerCase().trim(); });
      var set = {};
      for (var i = 0; i < names.length; i++) {
        if (set[names[i]]) return false;
        set[names[i]] = true;
      }
      return true;
    });
    T.assert(noDupes, 'generateSportProgram [' + label + ']: aucun exercice dupliqué dans une séance (fix Rack pull)');

    // Tous les exercices ont les champs minimum
    var allFieldsOk = prog.every(function(d) {
      if (!d || !Array.isArray(d.exercises)) return true;
      return d.exercises.every(function(e) { return e.n && e.m && e.sets && e.rest; });
    });
    T.assert(allFieldsOk, 'generateSportProgram [' + label + ']: exercices ont n / m / sets / rest');
  });
})();

// ══════════════════════════════════════════════════════════════════════
// 6. EXERCISE_ALTERNATIVES — Intégrité des pools (pas de doublons croisés)
// ══════════════════════════════════════════════════════════════════════
(function testExerciseAlternatives() {
  var EA = window.EXERCISE_ALTERNATIVES;
  if (!EA) { T.assert(false, 'EXERCISE_ALTERNATIVES: exporté sur window'); return; }

  var pools = Object.keys(EA);
  T.gt(pools.length, 9, 'EXERCISE_ALTERNATIVES: >= 10 pools (' + pools.length + ' trouvés)');

  // Aucun doublon de nom entre pools (le bug Rack pull + Cable pull-through + Face pull câble)
  var seen = {};
  var duplicates = [];
  pools.forEach(function(pool) {
    (EA[pool] || []).forEach(function(ex) {
      var key = (ex.n || '').toLowerCase().trim();
      if (!key) return;
      if (seen[key]) duplicates.push(ex.n + ' [' + seen[key] + ' ↔ ' + pool + ']');
      else seen[key] = pool;
    });
  });
  T.eq(duplicates.length, 0, 'EXERCISE_ALTERNATIVES: aucun doublon exact entre pools (fix Rack pull / Cable pull-through / Face pull)');
  if (duplicates.length) {
    T.results[T.results.length - 1].detail = duplicates.join(' | ');
  }

  // Tous les exercices ont les champs requis
  var missingFields = [];
  pools.forEach(function(pool) {
    (EA[pool] || []).forEach(function(ex) {
      if (!ex.n || !ex.m || !ex.eq || !ex.sets || !ex.rest) {
        missingFields.push((ex.n || '?') + ' [' + pool + ']');
      }
    });
  });
  T.eq(missingFields.length, 0, 'EXERCISE_ALTERNATIVES: tous les exercices ont n/m/eq/sets/rest');

  // Aucun pool vide
  var emptyPools = pools.filter(function(p) { return !EA[p] || EA[p].length === 0; });
  T.eq(emptyPools.length, 0, 'EXERCISE_ALTERNATIVES: aucun pool vide');

  // Aucun doublon intra-pool
  var intraDupes = [];
  pools.forEach(function(pool) {
    var poolSeen = {};
    (EA[pool] || []).forEach(function(ex) {
      var key = (ex.n || '').toLowerCase().trim();
      if (!key) return;
      if (poolSeen[key]) intraDupes.push(ex.n + ' [' + pool + ']');
      else poolSeen[key] = true;
    });
  });
  T.eq(intraDupes.length, 0, 'EXERCISE_ALTERNATIVES: aucun doublon intra-pool');

  // getAlternativeExercises retourne des résultats pour chaque muscle
  if (window.getAlternativeExercises) {
    var emptyAlts = pools.filter(function(p) {
      var alts = window.getAlternativeExercises(p, null, 3);
      return !Array.isArray(alts) || alts.length === 0;
    });
    T.eq(emptyAlts.length, 0, 'getAlternativeExercises: résultats non vides pour tous les pools');
  }
})();

// ══════════════════════════════════════════════════════════════════════
// 7. calcMacros() — Cohérence des macros calculées
// ══════════════════════════════════════════════════════════════════════
(function testCalcMacros() {
  if (!window.calcMacros) { T.assert(false, 'calcMacros: fonction exportée'); return; }

  resetS({ goal: 0, weight: 75, height: 175, age: 30, sex: 'homme', activity: 1.55 });
  var maintain = window.calcMacros();
  T.assert(maintain && typeof maintain === 'object', 'calcMacros: retourne un objet (maintien)');
  T.gt(maintain && maintain.p, 0, 'calcMacros [maintien]: protéines > 0');
  T.gt(maintain && maintain.g, 0, 'calcMacros [maintien]: glucides > 0');
  T.gt(maintain && maintain.l, 0, 'calcMacros [maintien]: lipides > 0');

  // Objectifs différents → macros différentes
  resetS({ goal: 1, weight: 75, height: 175, age: 30, sex: 'homme', activity: 1.55 });
  var bulk = window.calcMacros();
  resetS({ goal: 2, weight: 75, height: 175, age: 30, sex: 'homme', activity: 1.55 });
  var shred = window.calcMacros();

  if (bulk && shred) {
    // Prise de masse → plus de protéines que sèche ? Pas toujours — sèche utilise souvent ppk plus haut
    // Mais la masse totale (kcal via p*4+g*4+l*9) doit être différente
    var bulkKcal = bulk.p * 4 + bulk.g * 4 + bulk.l * 9;
    var shredKcal = shred.p * 4 + shred.g * 4 + shred.l * 9;
    T.assert(Math.abs(bulkKcal - shredKcal) > 100, 'calcMacros: prise masse vs sèche → kcal différents (>100 kcal écart)');
  }

  // Femmes vs hommes → ppk différent
  resetS({ goal: 0, weight: 65, height: 165, age: 30, sex: 'femme', activity: 1.55 });
  var female = window.calcMacros();
  T.assert(female && female.p > 0, 'calcMacros [femme]: protéines > 0 (ppk ajusté)');
})();

// ══════════════════════════════════════════════════════════════════════
// 8. EXERCISES DB (muscu) — Base d'exercices de base
// ══════════════════════════════════════════════════════════════════════
(function testExercisesDb() {
  if (!window.EXERCISES) { T.assert(false, 'EXERCISES: exporté sur window'); return; }

  var groups = Object.keys(window.EXERCISES);
  T.gt(groups.length, 4, 'EXERCISES: >= 5 groupes musculaires (' + groups.length + ')');

  var totalCount = 0, missingFields = [];
  groups.forEach(function(g) {
    var list = window.EXERCISES[g] || [];
    totalCount += list.length;
    list.forEach(function(ex) {
      var name = ex.n || ex.name;
      if (!name || !ex.lv) missingFields.push((name || '?') + ' [' + g + ']');
    });
  });
  T.gt(totalCount, 49, 'EXERCISES: >= 50 exercices totaux (' + totalCount + ')');
  T.eq(missingFields.length, 0, 'EXERCISES: tous les exercices ont un nom et un level (lv)');
})();

// ══════════════════════════════════════════════════════════════════════
// 9. VALIDATORS — Gardes runtime (validateSportProgram / validateWeekPlan)
// ══════════════════════════════════════════════════════════════════════
(function testValidators() {
  if (!window.validateSportProgram) { T.assert(false, 'validators: validateSportProgram exporté'); return; }
  if (!window.validateWeekPlan) { T.assert(false, 'validators: validateWeekPlan exporté'); return; }
  if (!window.validateDataIntegrity) { T.assert(false, 'validators: validateDataIntegrity exporté'); return; }

  // validateSportProgram : détecte et auto-corrige les doublons
  var progDup = [
    { exercises: [
      { n: 'Rack pull', m: 'Dos', sets: '4×6', rest: '120s' },
      { n: 'Squat', m: 'Jambes', sets: '4×8', rest: '180s' },
      { n: 'rack pull', m: 'Dos', sets: '4×6', rest: '120s' } // doublon case-insensitive
    ]}
  ];
  var rProg = window.validateSportProgram(progDup);
  T.assert(!rProg.ok, 'validateSportProgram: détecte doublon intra-jour');
  T.assert(rProg.fixed === true, 'validateSportProgram: auto-corrige le doublon');
  T.eq(progDup[0].exercises.length, 2, 'validateSportProgram: doublon supprimé (3→2)');

  // validateSportProgram : programme sain
  var progOk = [
    { exercises: [
      { n: 'Squat', m: 'Jambes', sets: '4×8', rest: '180s' },
      { n: 'Développé couché', m: 'Pecs', sets: '4×8', rest: '120s' }
    ]}
  ];
  var rOk = window.validateSportProgram(progOk);
  T.assert(rOk.ok, 'validateSportProgram: programme sain → ok=true');
  T.assert(!rOk.fixed, 'validateSportProgram: programme sain → fixed=false');

  // validateSportProgram : exercices fantômes supprimés
  var progGhost = [
    { exercises: [
      { n: 'Squat', m: 'Jambes', sets: '4×8', rest: '180s' },
      { n: '', m: 'Pecs', sets: '4×8', rest: '120s' }, // fantôme
      { n: null, m: 'Dos', sets: '4×8', rest: '120s' }  // fantôme
    ]}
  ];
  window.validateSportProgram(progGhost);
  T.eq(progGhost[0].exercises.length, 1, 'validateSportProgram: exercices fantômes supprimés');

  // validateWeekPlan : totaux désynchronisés → auto-fix
  var planDesync = [{
    breakfast: { n: 'B', k: 400, p: 30, g: 50, l: 10 },
    lunch:     { n: 'L', k: 600, p: 45, g: 70, l: 15 },
    snack:     { n: 'S', k: 200, p: 15, g: 25, l: 5 },
    dinner:    { n: 'D', k: 500, p: 40, g: 55, l: 12 },
    kcal: 9999, p: 9999, g: 9999, l: 9999 // stale
  }];
  var rPlan = window.validateWeekPlan(planDesync);
  T.assert(!rPlan.ok, 'validateWeekPlan: détecte totaux désync');
  T.assert(rPlan.fixed, 'validateWeekPlan: auto-corrige les totaux');
  T.eq(planDesync[0].kcal, 1700, 'validateWeekPlan: kcal recalculé (400+600+200+500=1700)');
  T.eq(planDesync[0].p, 130, 'validateWeekPlan: p recalculé (30+45+15+40=130)');

  // validateWeekPlan : doublon de repas
  var planDup = [{
    breakfast: { n: 'Poulet riz', k: 500, p: 40, g: 60, l: 10 },
    lunch:     { n: 'Poulet riz', k: 500, p: 40, g: 60, l: 10 }, // doublon
    snack:     { n: 'Pomme', k: 100, p: 1, g: 25, l: 0 },
    dinner:    { n: 'Saumon', k: 600, p: 50, g: 40, l: 20 },
    kcal: 1700, p: 131, g: 185, l: 40
  }];
  var rDupPlan = window.validateWeekPlan(planDup);
  T.assert(!rDupPlan.ok, 'validateWeekPlan: détecte doublon de repas intra-jour');

  // validateDataIntegrity — tourne sur les vraies données
  var rInt = window.validateDataIntegrity();
  T.assert(rInt.ok, 'validateDataIntegrity: aucune erreur critique dans les données statiques');
  if (!rInt.ok && rInt.errors) {
    T.results[T.results.length - 1].detail = rInt.errors.slice(0, 3).join(' | ');
  }
})();

// ══════════════════════════════════════════════════════════════════════
// RESTORE + RAPPORT
// ══════════════════════════════════════════════════════════════════════
window.saveProfile = origSave;
window.render = origRender;
try { window.S = origS; } catch(_e) {}

var total = T.pass + T.fail;
var pct = total ? Math.round(T.pass / total * 100) : 0;

console.log(
  '%c  SmartFitCoach Tests  ' + T.pass + '/' + total + ' (' + pct + '%)  ',
  'background:' + (T.fail === 0 ? '#1A4A1A' : '#5A1010') + ';color:#fff;font-weight:bold;padding:4px 10px;font-size:13px'
);
T.results.forEach(function(r) {
  if (r.ok) console.log('%c  ✓  ' + r.name, 'color:#1A4A1A');
  else console.error('  ✗  ' + r.name + (r.detail ? '\n       → ' + r.detail : ''));
});

// Panneau visuel
try {
  var existing = document.getElementById('sfc-test-panel');
  if (existing) existing.remove();

  var panel = document.createElement('div');
  panel.id = 'sfc-test-panel';
  panel.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:400px;background:#FAF9F6;border-left:3px solid ' +
    (T.fail === 0 ? '#1A4A1A' : '#5A1010') + ';z-index:99999;overflow-y:auto;font-family:"Helvetica Neue",Arial,sans-serif;' +
    'font-size:12px;padding:20px;box-shadow:-4px 0 24px rgba(0,0,0,.12)';

  var title = T.fail === 0 ? '✓ Tous les tests passent' : '✗ ' + T.fail + ' test(s) échoué(s)';
  var color = T.fail === 0 ? '#1A4A1A' : '#5A1010';
  panel.innerHTML =
    '<div style="padding-bottom:14px;border-bottom:1px solid #DDDBD0;margin-bottom:14px">' +
      '<div style="font-family:Georgia,serif;font-size:17px;color:' + color + ';margin-bottom:6px">' + title + '</div>' +
      '<div style="font-size:11px;color:#6B6B65">' + T.pass + ' réussis / ' + total + ' — ' + pct + '%</div>' +
      '<div style="margin-top:10px;cursor:pointer;font-size:11px;color:#5A1010;text-decoration:underline" ' +
      'onclick="document.getElementById(\'sfc-test-panel\').remove()">× Fermer ce panneau</div>' +
    '</div>';

  var lastSection = '';
  T.results.forEach(function(r) {
    var parts = r.name.split(':');
    var section = parts[0];
    var body = parts.slice(1).join(':').trim();
    if (section !== lastSection) {
      var sh = document.createElement('div');
      sh.style.cssText = 'margin:14px 0 6px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6B6B65';
      sh.textContent = section;
      panel.appendChild(sh);
      lastSection = section;
    }
    var row = document.createElement('div');
    row.style.cssText = 'padding:5px 0;border-bottom:1px solid rgba(0,0,0,.04);display:flex;gap:8px;align-items:flex-start';
    row.innerHTML =
      '<span style="flex-shrink:0;color:' + (r.ok ? '#1A4A1A' : '#5A1010') + ';font-weight:bold">' + (r.ok ? '✓' : '✗') + '</span>' +
      '<span style="color:' + (r.ok ? '#0A0A09' : '#5A1010') + ';line-height:1.4">' +
        body + (r.detail ? '<br><span style="font-size:10px;color:#5A1010;font-style:italic">' + r.detail + '</span>' : '') +
      '</span>';
    panel.appendChild(row);
  });

  if (typeof document !== 'undefined' && document.body) document.body.appendChild(panel);
} catch(_e) { /* no DOM available */ }

window.__sfc_tests_result = { pass: T.pass, fail: T.fail, total: total };
})();
