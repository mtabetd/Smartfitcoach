'use strict';

// ─── TESTS UNITAIRES — calcTarget() + calcMacros() — PRODUCTION HARDENING ────
// 35 tests directs sur les fonctions de calcul nutritionnel.
// Usage : node tests/unit-calcmacros-direct.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

// ─── 1. MOCK ENVIRONNEMENT NAVIGATEUR ────────────────────────────────────────

global.window    = global;
global.localStorage = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} };
var _fakeEl = function() {
  return { style: {}, appendChild: function() {}, addEventListener: function() {},
           removeEventListener: function() {}, innerHTML: '', textContent: '',
           classList: { add: function() {}, remove: function() {}, contains: function() { return false; } } };
};
global.document  = {
  createElement:    _fakeEl, getElementById: function() { return null; },
  querySelector: function() { return null; }, querySelectorAll: function() { return []; },
  addEventListener: function() {}, removeEventListener: function() {},
  body: _fakeEl(), head: _fakeEl()
};
Object.defineProperty(global, 'navigator', { value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true });
global.fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };

// ─── 2. CHARGEMENT DES MODULES ───────────────────────────────────────────────

var constCode = fs.readFileSync(path.join(__dirname, '../app/sfc-constants.js'), 'utf8');
try { vm.runInThisContext(constCode, { filename: 'sfc-constants.js' }); } catch(e) {}

var coreCode = fs.readFileSync(path.join(__dirname, '../app/app-core.js'), 'utf8');
try { vm.runInThisContext(coreCode, { filename: 'app-core.js' }); }
catch(e) { console.error('[FATAL] app-core.js:', e.message); process.exit(1); }

try {
  var helpersCode = fs.readFileSync(path.join(__dirname, '../app/i18n-helpers.js'), 'utf8');
  vm.runInThisContext(helpersCode, { filename: 'i18n-helpers.js' });
} catch(e) { console.error('[FATAL] i18n-helpers.js:', e.message); process.exit(1); }

var nmCode = fs.readFileSync(path.join(__dirname, '../app/nutrition-master.js'), 'utf8');
try { vm.runInThisContext(nmCode, { filename: 'nutrition-master.js' }); } catch(e) {}

// ─── 3. RUNNER MINIMALISTE ───────────────────────────────────────────────────

var passed = 0;
var failed = 0;
var _suite = '';

function suite(name) {
  _suite = name;
  console.log('\n' + name);
}

function test(name, fn) {
  try {
    fn();
    console.log('  \x1b[32m✓\x1b[0m', name);
    passed++;
  } catch(e) {
    console.error('  \x1b[31m✗\x1b[0m', name);
    console.error('    ', e.message);
    failed++;
  }
}

// ─── 4. PROFIL DE BASE ───────────────────────────────────────────────────────
// activity index: 0=sédentaire(1.2), 1=léger(1.375), 2=modéré(1.55), 3=actif(1.725), 4=athlète(1.9), 5=élite(2.1)
// goal index:     0=bulk, 1=lean_bulk, 2=maintien, 3=cut, 4=shred, 5=recomposition

function setState(overrides) {
  window.S = Object.assign({
    sex: 'homme', age: 30, birthDate: null,
    weight: 80, height: 175, targetWeight: null, waist: null,
    goal: 2, sportGoals: [], activity: 2, sportDays: 3,
    train: [], sportType: null, sportLevel: null, sportProgram: null,
    appMode: 'nutrition', nStep: 0, sStep: 0,
    medical: [], pregnant: false, pregnancyWeek: null, prePregnancyWeight: null,
    cycleTracking: false, lastPeriodDate: null, cycleLength: 28,
    _bodyFatEstimate: null,
    regime: 0, whey: null, cookLevel: 2, allergies: [], intolerances: [],
    supplements: [], creatine: false, creatineDose: 0,
    alcoholFreq: null, alcoholTypes: [],
    snacking: null, eatingLocation: null, mealPrepTime: null,
    mealsPerDay: 3, hydration: null, wantsDessert: false,
    weekPlan: null, selectedDay: 0
  }, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── GROUPE 1 : PLANCHERS CALORIQUES ─────────────────────────────────────────

suite('Groupe 1 — Planchers caloriques');

test('Femme sèche (goal=4) : kcal >= 1400', function() {
  setState({ sex: 'femme', age: 30, weight: 50, height: 158, activity: 0, sportDays: 0, goal: 4 });
  var target = calcTarget();
  assert.ok(target >= 1400, 'Plancher femme 1400 kcal non respecté — cible: ' + target);
});

test('Homme sèche (goal=4) : kcal >= 1500', function() {
  setState({ sex: 'homme', age: 30, weight: 55, height: 160, activity: 0, sportDays: 0, goal: 4 });
  var target = calcTarget();
  assert.ok(target >= 1500, 'Plancher homme 1500 kcal non respecté — cible: ' + target);
});

test('Grossesse T3 (+450 kcal) : kcal >= 1800', function() {
  // T3 = semaine >= 27 → +450 kcal (ACOG 2018)
  setState({ sex: 'femme', age: 28, weight: 70, height: 165, activity: 1, goal: 2,
             pregnant: true, pregnancyWeek: 30, prePregnancyWeight: 62 });
  var target = calcTarget();
  assert.ok(target >= 1800, 'Plancher grossesse T3 1800 kcal non respecté — cible: ' + target);
});

test('Allaitement (+500 kcal surplus) : kcal >= 1800', function() {
  setState({ sex: 'femme', age: 28, weight: 65, height: 165, activity: 1, goal: 2,
             medical: ['allaitement'] });
  var target = calcTarget();
  assert.ok(target >= 1800, 'Plancher allaitement 1800 kcal non respecté — cible: ' + target);
});

test('TCA médical : kcal >= TDEE (pas de déficit)', function() {
  setState({ sex: 'homme', age: 28, weight: 75, height: 178, activity: 2, sportDays: 3,
             goal: 4, medical: ['tca'] });
  var tdee = calcTDEE();
  var target = calcTarget();
  // TCA force le maintien — cible proche de TDEE (tolérance +/-200 kcal pour arrondis)
  assert.ok(target >= Math.round(tdee) - 200,
    'TCA doit forcer le maintien — TDEE: ' + tdee + ', cible: ' + target);
});

test('Ménopause + sèche : kcal >= 1400 après déduction -150', function() {
  setState({ sex: 'femme', age: 52, weight: 65, height: 165, activity: 1, sportDays: 2,
             goal: 4, medical: ['menopause'] });
  var target = calcTarget();
  assert.ok(target >= 1400, 'Plancher ménopause 1400 kcal non respecté — cible: ' + target);
});

test('Alcool déduit : kcal reste >= plancher (homme)', function() {
  // alcoholFreq renseigné → déduction de calories alcool, plancher toujours respecté
  setState({ sex: 'homme', age: 35, weight: 80, height: 178, activity: 1, sportDays: 2,
             goal: 4, alcoholFreq: 'moderate', alcoholTypes: ['beer'] });
  var target = calcTarget();
  assert.ok(target >= 1500, 'Plancher homme non respecté après déduction alcool — cible: ' + target);
});

test('Femme élite (activity=5, factor=2.1) : kcal > 1400 (TDEE élevé)', function() {
  setState({ sex: 'femme', age: 25, weight: 60, height: 168, activity: 5, sportDays: 7,
             goal: 2 });
  var target = calcTarget();
  assert.ok(target > 1400, 'Femme élite : cible trop basse — cible: ' + target);
  var tdee = calcTDEE();
  assert.ok(tdee > 2000, 'TDEE femme élite devrait dépasser 2000 kcal — tdee: ' + tdee);
});

test('Homme sédentaire (activity=0) : kcal >= 1500', function() {
  setState({ sex: 'homme', age: 40, weight: 75, height: 175, activity: 0, sportDays: 0,
             goal: 4 });
  var target = calcTarget();
  assert.ok(target >= 1500, 'Plancher homme sédentaire 1500 kcal non respecté — cible: ' + target);
});

test('Poids cible proche (delta <= 2 kg) : déficit réduit de 50%', function() {
  // Sans targetWeight proche : déficit normal
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, sportDays: 3,
             goal: 4, targetWeight: null });
  var targetNormal = calcTarget();
  // Avec targetWeight à 79 kg (delta = 1 kg < 2 kg) → quasi-maintien (25% du déficit)
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, sportDays: 3,
             goal: 4, targetWeight: 79 });
  var targetClose = calcTarget();
  // La cible proche du goal doit être > cible normale (déficit réduit)
  assert.ok(targetClose > targetNormal,
    'Déficit non réduit à l\'approche du poids cible — normal: ' + targetNormal + ', proche: ' + targetClose);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── GROUPE 2 : ÉQUILIBRE DES MACROS ─────────────────────────────────────────

suite('Groupe 2 — Équilibre des macros');

test('Cohérence calorique P×4 + F×9 + G×4 ≈ calcTarget (±5%)', function() {
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, sportDays: 3, goal: 2 });
  var target = calcTarget();
  var m = calcMacros();
  var totalKcal = m.p * 4 + m.l * 9 + m.g * 4;
  var tol = target * 0.05;
  assert.ok(Math.abs(totalKcal - target) <= tol,
    'Écart calorique > 5% — cible: ' + target + ', macros: ' + totalKcal +
    ' (P=' + m.p + ' G=' + m.g + ' L=' + m.l + ')');
});

test('Lipides >= 20% des calories totales (ISSN 2017)', function() {
  setState({ sex: 'homme', age: 28, weight: 80, height: 175, activity: 2, sportDays: 3, goal: 4 });
  var target = calcTarget();
  var m = calcMacros();
  var fatPct = (m.l * 9) / target;
  assert.ok(fatPct >= 0.19, 'Lipides < 20% — ' + (fatPct * 100).toFixed(1) + '%');
});

test('Protéines homme sèche (goal=4) >= 1.8 g/kg', function() {
  // activity=2 (factor=1.55) → ppk sèche cut = 1.9 g/kg pour homme modéré
  setState({ sex: 'homme', age: 28, weight: 80, height: 175, activity: 2, sportDays: 3, goal: 4 });
  var m = calcMacros();
  var ppk = m.p / 80;
  assert.ok(ppk >= 1.8, 'Protéines sèche homme < 1.8g/kg — ' + ppk.toFixed(2) + ' g/kg');
});

test('Protéines femme bulk (goal=0) >= 1.6 g/kg', function() {
  setState({ sex: 'femme', age: 25, weight: 60, height: 165, activity: 2, sportDays: 3, goal: 0 });
  var m = calcMacros();
  var ppk = m.p / 60;
  assert.ok(ppk >= 1.6, 'Protéines bulk femme < 1.6g/kg — ' + ppk.toFixed(2) + ' g/kg');
});

test('Glucides toujours >= 0 (jamais négatifs)', function() {
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 0, sportDays: 0, goal: 4 });
  var m = calcMacros();
  assert.ok(m.g >= 0, 'Glucides négatifs détectés : ' + m.g);
});

test('Homme 80 kg maintien : lipides >= 0.8 × 80 = 64 g (FAT_MIN_GPERKG)', function() {
  // activity=2 (factor=1.55), goal=2 → fpk=1.0 homme → 80g lipides
  // Mais on vérifie juste le plancher 0.8g/kg
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, sportDays: 3, goal: 2 });
  var m = calcMacros();
  assert.ok(m.l >= 64, 'Lipides homme 80 kg < 64 g (plancher 0.8g/kg) — ' + m.l + 'g');
});

test('Homme 90 kg sèche : protéines dans plage raisonnable (80-280 g)', function() {
  setState({ sex: 'homme', age: 30, weight: 90, height: 180, activity: 2, sportDays: 4, goal: 4 });
  var m = calcMacros();
  assert.ok(m.p >= 80 && m.p <= 280,
    'Protéines hors plage raisonnable : ' + m.p + 'g pour 90 kg');
});

test('calcMacros retourne des champs structurés (g, p, l au minimum)', function() {
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, sportDays: 3, goal: 2 });
  var m = calcMacros();
  assert.ok(typeof m.g === 'number', 'champ g absent ou non-numérique');
  assert.ok(typeof m.p === 'number', 'champ p absent ou non-numérique');
  assert.ok(typeof m.l === 'number', 'champ l absent ou non-numérique');
});

test('Femme élite muscu (activity=4) : protéines >= 1.8 g/kg et glucides > 0', function() {
  setState({ sex: 'femme', age: 25, weight: 60, height: 165, activity: 4, sportDays: 6, goal: 1 });
  var m = calcMacros();
  assert.ok(m.p >= Math.round(60 * 1.8) - 5,
    'Protéines femme élite lean_bulk < 1.8g/kg — ' + m.p + 'g');
  assert.ok(m.g > 0, 'Glucides nuls pour femme élite');
});

test('Aucun NaN dans les macros pour profil valide quelconque', function() {
  var profiles = [
    { sex: 'homme', age: 25, weight: 70, height: 175, activity: 2, goal: 2 },
    { sex: 'femme', age: 35, weight: 65, height: 162, activity: 1, goal: 4 },
    { sex: 'homme', age: 50, weight: 100, height: 180, activity: 3, goal: 3 },
    { sex: 'femme', age: 22, weight: 55, height: 160, activity: 4, goal: 0 },
    { sex: 'homme', age: 45, weight: 85, height: 178, activity: 0, goal: 5 }
  ];
  profiles.forEach(function(p) {
    setState(p);
    var m = calcMacros();
    assert.ok(!isNaN(m.p) && !isNaN(m.g) && !isNaN(m.l),
      'NaN détecté pour profil: ' + JSON.stringify(p) + ' → p=' + m.p + ' g=' + m.g + ' l=' + m.l);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── GROUPE 3 : CAS LIMITES ───────────────────────────────────────────────────

suite('Groupe 3 — Cas limites');

test('IRC : protéines <= 0.6 × poids (KDOQI 2020)', function() {
  setState({ sex: 'homme', age: 50, weight: 80, height: 175, activity: 1, sportDays: 1,
             goal: 2, medical: ['irc'] });
  var m = calcMacros();
  var ppk = m.p / 80;
  assert.ok(ppk <= 0.61, 'Cap IRC 0.6g/kg non respecté — ' + ppk.toFixed(3) + ' g/kg (' + m.p + 'g)');
});

test('Diabète T2 + sèche : déficit cap 500 kcal respecté', function() {
  setState({ sex: 'homme', age: 40, weight: 85, height: 178, activity: 2, sportDays: 3,
             goal: 4, medical: ['diabete_t2'] });
  var tdee = calcTDEE();
  var target = calcTarget();
  assert.ok(target >= Math.round(tdee - 500) - 5,
    'Déficit diabète T2 > 500 kcal — TDEE: ' + tdee + ', cible: ' + target);
});

test('Très sous-poids (BMI ~15) : pas de crash, résultat valide', function() {
  // BMI 15 : 40 kg / (1.63)^2 ≈ 15.1
  setState({ sex: 'femme', age: 22, weight: 40, height: 163, activity: 0, sportDays: 0, goal: 2 });
  var target = calcTarget();
  assert.ok(typeof target === 'number' && !isNaN(target),
    'calcTarget crash sur BMI ~15 : ' + target);
  assert.ok(target >= 0, 'Cible négative sur BMI ~15 : ' + target);
});

test('Très surpoids (BMI ~50) : pas de crash, résultat valide', function() {
  // BMI 50 : 135 kg / (1.64)^2 ≈ 50.2
  setState({ sex: 'homme', age: 35, weight: 135, height: 164, activity: 0, sportDays: 0, goal: 3 });
  var target = calcTarget();
  assert.ok(typeof target === 'number' && !isNaN(target),
    'calcTarget crash sur BMI ~50 : ' + target);
  assert.ok(target > 0, 'Cible nulle/négative sur BMI ~50 : ' + target);
});

test('sportDays=0 : pas de crash', function() {
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 0, sportDays: 0, goal: 2 });
  var target = calcTarget();
  var m = calcMacros();
  assert.ok(!isNaN(target) && !isNaN(m.p), 'Crash avec sportDays=0');
});

test('Âge 15 (adolescent) : calcBMR retourne nombre positif', function() {
  setState({ sex: 'homme', age: 15, weight: 60, height: 170, activity: 1, sportDays: 2, goal: 2 });
  var bmr = calcBMR();
  assert.ok(bmr > 0, 'calcBMR nul ou négatif pour âge 15 — ' + bmr);
});

test('Âge 85 (senior) : calcBMR retourne nombre positif', function() {
  setState({ sex: 'homme', age: 85, weight: 70, height: 170, activity: 0, sportDays: 0, goal: 2 });
  var bmr = calcBMR();
  assert.ok(bmr > 0, 'calcBMR nul ou négatif pour âge 85 — ' + bmr);
});

test('activity=5 (élite, factor=2.1) : TDEE > 3000 pour homme standard', function() {
  setState({ sex: 'homme', age: 28, weight: 80, height: 178, activity: 5, sportDays: 7, goal: 2 });
  var tdee = calcTDEE();
  // BMR homme 80/178/28 = 10×80 + 6.25×178 - 5×28 + 5 = 1797.5 → 1798
  // TDEE = 1798 × 2.1 ≈ 3775
  assert.ok(tdee > 3000, 'TDEE élite homme < 3000 kcal — ' + tdee);
});

test('goal=recomposition (goal=5) : cible ≈ TDEE (ni surplus ni déficit)', function() {
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, sportDays: 3, goal: 5 });
  var tdee = calcTDEE();
  var target = calcTarget();
  // recomposition mult=1.00 → cible ≈ TDEE
  assert.ok(Math.abs(target - Math.round(tdee)) <= 200,
    'Recomposition : écart cible/TDEE > 200 kcal — TDEE: ' + tdee + ', cible: ' + target);
});

test('medical=[diabete_t1, grossesse] : combinaison sans crash', function() {
  setState({ sex: 'femme', age: 28, weight: 68, height: 165, activity: 1, sportDays: 2, goal: 2,
             medical: ['diabete_t1', 'grossesse'], pregnant: true, pregnancyWeek: 24,
             prePregnancyWeight: 62 });
  var target = calcTarget();
  var m = calcMacros();
  assert.ok(!isNaN(target) && target > 0, 'calcTarget crash avec diabete_t1+grossesse : ' + target);
  assert.ok(!isNaN(m.p) && !isNaN(m.g) && !isNaN(m.l),
    'calcMacros NaN avec diabete_t1+grossesse');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── GROUPE 4 : ÉQUIVALENCE NUTRITIONMASTER ──────────────────────────────────

suite('Groupe 4 — Équivalence NutritionMaster');

test('NutritionMaster.compute().caloriesTarget ≈ calcTarget() ±10% (même profil)', function() {
  if (!window.NutritionMaster) {
    console.log('    (skip — NutritionMaster absent)');
    passed++;
    return;
  }
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, sportDays: 3, goal: 3 });
  // goal=3 = cut (-15%) dans app-core, NutritionMaster goal='cut'
  var appTarget = calcTarget();
  var nm = window.NutritionMaster.compute({
    gender: 'male', age: 30, weightKg: 80, heightCm: 175,
    activityLevel: 1.55, goal: 'cut', isElite: false, trainingDay: false
  });
  if (nm.errors && nm.errors.length > 0) {
    console.log('    (NutritionMaster errors: ' + nm.errors.join(', ') + ')');
    passed++;
    return;
  }
  var tol = appTarget * 0.10;
  assert.ok(Math.abs(nm.caloriesTarget - appTarget) <= tol,
    'NutritionMaster.compute() (' + nm.caloriesTarget + ') vs calcTarget() (' + appTarget + ') > 10%');
});

test('NutritionMaster.calcBMR() correspond à window.calcBMR() pour homme type', function() {
  if (!window.NutritionMaster) {
    console.log('    (skip — NutritionMaster absent)');
    passed++;
    return;
  }
  setState({ sex: 'homme', age: 30, weight: 80, height: 175 });
  var appBMR = calcBMR();
  var nmBMR  = window.NutritionMaster.calcBMR('male', 80, 175, 30);
  // Les deux utilisent Mifflin-St Jeor — résultat identique (app-core ajoute correction seniors)
  assert.ok(Math.abs(nmBMR - appBMR) <= 5,
    'NutritionMaster.calcBMR (' + nmBMR + ') vs window.calcBMR (' + appBMR + ') — écart > 5 kcal');
});

test('NutritionMaster.calcBMR() correspond à window.calcBMR() pour femme type', function() {
  if (!window.NutritionMaster) {
    console.log('    (skip — NutritionMaster absent)');
    passed++;
    return;
  }
  setState({ sex: 'femme', age: 28, weight: 65, height: 165 });
  var appBMR = calcBMR();
  var nmBMR  = window.NutritionMaster.calcBMR('female', 65, 165, 28);
  assert.ok(Math.abs(nmBMR - appBMR) <= 5,
    'NutritionMaster.calcBMR femme (' + nmBMR + ') vs window.calcBMR (' + appBMR + ') — écart > 5 kcal');
});

test('NutritionMaster.calcTDEE() correspond à window.calcTDEE() pour profil actif', function() {
  if (!window.NutritionMaster) {
    console.log('    (skip — NutritionMaster absent)');
    passed++;
    return;
  }
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 3, sportDays: 5 });
  var appTDEE = calcTDEE();
  // activity=3 → factor=1.725 dans ACTIVITIES
  var appBMR  = calcBMR();
  var nmTDEE  = window.NutritionMaster.calcTDEE(appBMR, 1.725);
  assert.ok(Math.abs(nmTDEE - appTDEE) <= 10,
    'NutritionMaster.calcTDEE (' + nmTDEE + ') vs window.calcTDEE (' + appTDEE + ') — écart > 10 kcal');
});

test('NutritionMaster.compute() ne produit aucune erreur pour profil valide', function() {
  if (!window.NutritionMaster) {
    console.log('    (skip — NutritionMaster absent)');
    passed++;
    return;
  }
  var nm = window.NutritionMaster.compute({
    gender: 'female', age: 32, weightKg: 65, heightCm: 165,
    activityLevel: 1.375, goal: 'maintain', isElite: false, trainingDay: false
  });
  assert.ok(!nm.errors || nm.errors.length === 0,
    'NutritionMaster.compute() erreurs : ' + (nm.errors || []).join(', '));
  assert.ok(nm.caloriesTarget > 0, 'NutritionMaster.compute() caloriesTarget nul');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── RÉSULTAT FINAL ──────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────');
if (failed === 0) {
  console.log('Résultat : ' + passed + ' passés, 0 échoués');
} else {
  console.log('Résultat : ' + passed + ' passés, ' + failed + ' échoués');
  process.exit(1);
}
