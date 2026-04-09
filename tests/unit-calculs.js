'use strict';

// ─── TESTS UNITAIRES — CALCULS NUTRITIONNELS ─────────────────────────────────
// Teste calcBMR, calcTDEE, calcTarget, calcMacros depuis app-core.js
// Aucune modification du code de prod — lecture seule.
// Usage : node tests/unit-calculs.js
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
  createElement:    _fakeEl,
  getElementById:   function() { return null; },
  querySelector:    function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener: function() {},
  removeEventListener: function() {},
  body: _fakeEl(),
  head: _fakeEl()
};
// navigator est read-only en Node 22 — définir via Object.defineProperty
Object.defineProperty(global, 'navigator', {
  value: { language: 'fr-FR', onLine: true },
  writable: true, configurable: true
});
global.fetch          = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };

// ─── 2. CHARGEMENT DE APP-CORE.JS ────────────────────────────────────────────

var coreCode = fs.readFileSync(path.join(__dirname, '../app/app-core.js'), 'utf8');
try {
  vm.runInThisContext(coreCode, { filename: 'app-core.js' });
} catch(e) {
  console.error('[FATAL] Erreur au chargement de app-core.js:', e.message);
  process.exit(1);
}

// Vérifier que les fonctions sont bien exportées
var required = ['calcBMR', 'calcTDEE', 'calcTarget', 'calcMacros', 'calcBMI', 'getAge'];
required.forEach(function(fn) {
  if (typeof global[fn] !== 'function') {
    console.error('[FATAL] Fonction manquante :', fn);
    process.exit(1);
  }
});

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

// ─── 4. PROFIL DE BASE ────────────────────────────────────────────────────────
// setState() réinitialise window.S avec des valeurs complètes + les overrides fournis.
// Cela garantit qu'aucune valeur parasite d'un test précédent ne pollue le suivant.

function setState(overrides) {
  window.S = Object.assign({
    // Identité
    sex: 'homme', age: 30, birthDate: null,
    weight: 80, height: 175, targetWeight: null, waist: null,
    // Objectifs
    goal: 2, sportGoals: [], activity: 2, sportDays: 3,
    // Programme
    train: [], sportType: null, sportLevel: null, sportProgram: null,
    appMode: 'nutrition', nStep: 0, sStep: 0,
    // Santé
    medical: [], pregnant: false, pregnancyWeek: null, prePregnancyWeight: null,
    cycleTracking: false, lastPeriodDate: null, cycleLength: 28,
    _bodyFatEstimate: null,
    // Nutrition
    regime: 0, whey: null, cookLevel: 2, allergies: [], intolerances: [],
    supplements: [], creatine: false, creatineDose: 0,
    alcoholFreq: null, alcoholTypes: [],
    snacking: null, eatingLocation: null, mealPrepTime: null,
    mealsPerDay: 3, hydration: null, wantsDessert: false,
    // Plan
    weekPlan: null, selectedDay: 0
  }, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 1 : calcBMR ───────────────────────────────────────────────────────

suite('calcBMR — Mifflin-St Jeor + Katch-McArdle');

test('homme 30 ans, 80 kg, 175 cm → ~1749 kcal', function() {
  setState({});
  var bmr = calcBMR();
  // Mifflin-St Jeor homme : 10×80 + 6.25×175 - 5×30 + 5 = 1748.75 → 1749
  assert.strictEqual(bmr, 1749, 'BMR attendu : 1749, obtenu : ' + bmr);
});

test('femme 28 ans, 65 kg, 165 cm → ~1380 kcal', function() {
  setState({ sex: 'femme', age: 28, weight: 65, height: 165 });
  var bmr = calcBMR();
  // Mifflin-St Jeor femme : 10×65 + 6.25×165 - 5×28 - 161 = 1380.25 → 1380
  assert.strictEqual(bmr, 1380, 'BMR attendu : 1380, obtenu : ' + bmr);
});

test('senior 70 ans → correction -5% appliquée', function() {
  // Amirkalali 2008 : Mifflin-St Jeor surestime le BMR de ~5% après 65 ans
  setState({ age: 70 });
  var bmrSenior = calcBMR();
  setState({ age: 40 });
  var bmrAdulte = calcBMR();
  // Le BMR senior doit être < adulte (même profil, age différent)
  // ET la correction -5% doit s'appliquer (vérifier via un profil proche)
  setState({ age: 66, weight: 75, height: 175 });
  var bmr66 = calcBMR();
  setState({ age: 66, weight: 75, height: 175 }); // recalc pour vérif
  var bmrRaw66 = (10*75 + 6.25*175 - 5*66 + 5); // sans correction
  var bmrCorr66 = Math.round(bmrRaw66 * 0.95);
  assert.strictEqual(bmr66, bmrCorr66, 'Correction senior -5% attendue : ' + bmrCorr66 + ', obtenu : ' + bmr66);
});

test('Katch-McArdle activé si _bodyFatEstimate renseigné', function() {
  setState({ weight: 85, _bodyFatEstimate: 15 });
  var bmrKM = calcBMR();
  // LBM = 85 × (1 - 0.15) = 72.25 kg
  // Katch-McArdle : 370 + 21.6 × 72.25 = 370 + 1560.6 = 1930.6 → 1931
  var lbm = 85 * (1 - 15/100);
  var expected = Math.round(370 + 21.6 * lbm);
  assert.strictEqual(bmrKM, expected, 'Katch-McArdle attendu : ' + expected + ', obtenu : ' + bmrKM);
});

test('guard sex=null → 0', function() {
  setState({ sex: null });
  assert.strictEqual(calcBMR(), 0, 'calcBMR doit retourner 0 si sex est null');
});

test('guard weight=0 → 0', function() {
  setState({ weight: 0 });
  assert.strictEqual(calcBMR(), 0);
});

test('guard height=99 (sous plancher 100) → 0', function() {
  setState({ height: 99 });
  assert.strictEqual(calcBMR(), 0);
});

test('guard age=10 (sous plancher 13) → 0', function() {
  setState({ age: 10 });
  assert.strictEqual(calcBMR(), 0);
});

test('guard age=105 (au-dessus plafond 100) → 0', function() {
  setState({ age: 105 });
  assert.strictEqual(calcBMR(), 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 2 : calcTDEE ──────────────────────────────────────────────────────

suite('calcTDEE — facteur activité + auto-correction sportDays');

test('guard activity=null → 0', function() {
  setState({ activity: null });
  assert.strictEqual(calcTDEE(), 0);
});

test('guard activity=undefined → 0', function() {
  setState({ activity: undefined });
  assert.strictEqual(calcTDEE(), 0);
});

test('activity=0 (sédentaire, ×1.2) → BMR × 1.2', function() {
  setState({ activity: 0, sportDays: 0 });
  var tdee = calcTDEE();
  var bmr  = calcBMR();
  var expected = Math.round(bmr * 1.2 * 100) / 100; // facteur exact
  // calcTDEE retourne BMR * effectiveFactor (non arrondi)
  assert(Math.abs(tdee - bmr * 1.2) < 1, 'TDEE attendu : ~' + (bmr * 1.2).toFixed(0) + ', obtenu : ' + tdee);
});

test('sportDays=5 → auto-correction : facteur monte à 1.725 si activity < 1.725', function() {
  // Utilisateur sédentaire (factor 1.2) mais s'entraîne 5 jours/semaine
  // → le système corrige à max(1.2, 1.725) = 1.725
  setState({ activity: 0, sportDays: 5 });
  var tdee = calcTDEE();
  var bmr  = calcBMR();
  var expected = bmr * 1.725;
  assert(Math.abs(tdee - expected) < 1, 'Auto-correction sportDays=5 attendue : ~' + expected.toFixed(0) + ', obtenu : ' + tdee);
});

test('TDEE > BMR dans tous les cas avec activité valide', function() {
  setState({});
  assert(calcTDEE() > calcBMR(), 'TDEE doit toujours être > BMR avec une activité valide');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 3 : calcTarget — Caps, planchers, objectifs ───────────────────────

suite('calcTarget — multiplicateurs, cap ±500 kcal, planchers');

test('guard goal=null → 0', function() {
  setState({ goal: null });
  assert.strictEqual(calcTarget(), 0);
});

test('maintien (goal=2, ×1.0) → cible ≈ TDEE', function() {
  setState({ goal: 2 });
  var tdee = calcTDEE();
  var target = calcTarget();
  assert(Math.abs(target - tdee) < 200, 'Maintien : écart TDEE/cible > 200 kcal — TDEE: ' + tdee + ', cible: ' + target);
});

test('bulk (goal=0) : cap surplus à +500 kcal/j — athlète élite (Helms 2014)', function() {
  // Athlète élite TDEE ~3587 → bulk +15% = 4125 > TDEE+500 (4087) → cap à 4087
  setState({ sex: 'homme', age: 22, weight: 70, height: 178, activity: 5, sportDays: 5, goal: 0 });
  var tdee = calcTDEE();
  var target = calcTarget();
  assert(target <= Math.round(tdee + 500) + 1, 'Cap bulk +500 kcal non respecté — TDEE: ' + tdee + ', cible: ' + target);
});

test('shred (goal=4) : cap déficit à -500 kcal/j — athlète musclé (Helms 2014)', function() {
  // TDEE ~3314 → shred -20% = 2651 < TDEE-500 (2814) → cap à 2814
  setState({ sex: 'homme', age: 28, weight: 90, height: 185, activity: 3, sportDays: 5, goal: 4 });
  var tdee = calcTDEE();
  var target = calcTarget();
  assert(target >= Math.round(tdee - 500) - 1, 'Cap shred -500 kcal non respecté — TDEE: ' + tdee + ', cible: ' + target);
});

test('plancher homme : minimum 1500 kcal/j (ACSM)', function() {
  // Profil qui générerait une cible très basse
  setState({ sex: 'homme', age: 30, weight: 55, height: 160, activity: 0, sportDays: 0, goal: 4 });
  var target = calcTarget();
  assert(target >= 1500, 'Plancher homme 1500 kcal non respecté — cible: ' + target);
});

test('plancher femme : minimum 1400 kcal/j (ISSN 2017)', function() {
  setState({ sex: 'femme', age: 30, weight: 50, height: 158, activity: 0, sportDays: 0, goal: 4 });
  var target = calcTarget();
  assert(target >= 1400, 'Plancher femme 1400 kcal non respecté — cible: ' + target);
});

test('plancher BMR : cible jamais inférieure au métabolisme de base', function() {
  setState({ sex: 'femme', age: 25, weight: 52, height: 162, activity: 0, sportDays: 0, goal: 4 });
  var bmr = calcBMR();
  var target = calcTarget();
  assert(target >= bmr, 'Plancher BMR non respecté — BMR: ' + bmr + ', cible: ' + target);
});

test('TCA (medical) → force le maintien (IOC 2018 RED-S)', function() {
  setState({ medical: ['tca'], goal: 4 }); // sèche demandée
  var tdee = calcTDEE();
  var target = calcTarget();
  assert(Math.abs(target - Math.round(tdee)) < 200, 'TCA doit forcer le maintien — TDEE: ' + tdee + ', cible: ' + target);
});

test('allaitement → cible ≥ TDEE + 500 kcal (ACOG 2022)', function() {
  setState({ sex: 'femme', age: 28, weight: 65, height: 165, medical: ['allaitement'], goal: 2 });
  var tdee = calcTDEE();
  var target = calcTarget();
  assert(target >= Math.round(tdee) + 499, 'Allaitement : bonus +500 kcal non appliqué — TDEE: ' + tdee + ', cible: ' + target);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 4 : calcMacros — Cohérence calorique + protéines ──────────────────

suite('calcMacros — cohérence calorique, protéines g/kg, guards');

test('guard goal=null → {g:0, p:0, l:0}', function() {
  setState({ goal: null });
  var m = calcMacros();
  assert.strictEqual(m.p, 0);
  assert.strictEqual(m.g, 0);
  assert.strictEqual(m.l, 0);
});

test('cohérence calorique : P×4 + G×4 + L×9 ≈ calcTarget (±15 kcal)', function() {
  setState({ sex: 'homme', age: 30, weight: 80, height: 175, activity: 2, goal: 2 });
  var target = calcTarget();
  var m = calcMacros();
  var totalKcal = m.p * 4 + m.g * 4 + m.l * 9;
  assert(Math.abs(totalKcal - target) <= 15,
    'Écart calorique trop large — cible: ' + target + ' kcal, macros: ' + totalKcal + ' kcal (P=' + m.p + ' G=' + m.g + ' L=' + m.l + ')');
});

test('cohérence calorique mode sèche (goal=4)', function() {
  setState({ sex: 'homme', age: 28, weight: 85, height: 180, activity: 2, goal: 4 });
  var target = calcTarget();
  var m = calcMacros();
  var totalKcal = m.p * 4 + m.g * 4 + m.l * 9;
  assert(Math.abs(totalKcal - target) <= 15,
    'Écart calorique sèche trop large — cible: ' + target + ', macros: ' + totalKcal);
});

test('cohérence calorique mode bulk (goal=0)', function() {
  setState({ sex: 'homme', age: 25, weight: 75, height: 178, activity: 2, goal: 0 });
  var target = calcTarget();
  var m = calcMacros();
  var totalKcal = m.p * 4 + m.g * 4 + m.l * 9;
  assert(Math.abs(totalKcal - target) <= 15,
    'Écart calorique bulk trop large — cible: ' + target + ', macros: ' + totalKcal);
});

test('protéines bulk homme actif ≥ 1.6 g/kg (ISSN 2017)', function() {
  setState({ sex: 'homme', age: 25, weight: 75, height: 178, activity: 2, goal: 0 });
  var m = calcMacros();
  var ppk = m.p / 75;
  assert(ppk >= 1.6, 'Protéines bulk insuffisantes : ' + ppk.toFixed(2) + ' g/kg (minimum 1.6)');
});

test('protéines sèche ≥ protéines maintien (déficit → catabolisme)', function() {
  // En sèche, les protéines doivent être ≥ à celles du maintien (ISSN 2017 — préservation masse musculaire)
  setState({ sex: 'homme', age: 28, weight: 80, height: 175, activity: 2, goal: 2 });
  var pMaintien = calcMacros().p;
  setState({ sex: 'homme', age: 28, weight: 80, height: 175, activity: 2, goal: 4 });
  var pSeche = calcMacros().p;
  assert(pSeche >= pMaintien, 'Protéines sèche (' + pSeche + 'g) < maintien (' + pMaintien + 'g) — anomalie');
});

test('lipides ≥ 20% des calories (ISSN 2017 — santé hormonale)', function() {
  setState({ sex: 'homme', age: 28, weight: 80, height: 175, activity: 2, goal: 4 });
  var target = calcTarget();
  var m = calcMacros();
  var fatPct = (m.l * 9) / target;
  assert(fatPct >= 0.19, 'Lipides < 20% des calories : ' + (fatPct * 100).toFixed(1) + '% (minimum 20%)');
});

test('glucides ≥ 130 g/j (IOM 2005 — cerveau + SNC)', function() {
  // Même en sèche ou avec peu de calories, les glucides ne doivent pas descendre sous 130g
  setState({ sex: 'femme', age: 30, weight: 55, height: 162, activity: 0, goal: 4 });
  var m = calcMacros();
  assert(m.g >= 130, 'Glucides < 130g/j : ' + m.g + 'g (minimum IOM 2005)');
});

test('IRC (medical) → protéines plafonnées à 0.6 g/kg (KDOQI 2020)', function() {
  setState({ sex: 'homme', age: 50, weight: 80, height: 175, activity: 1, goal: 2, medical: ['irc'] });
  var m = calcMacros();
  var ppk = m.p / 80;
  assert(ppk <= 0.61, 'Cap IRC 0.6g/kg non respecté : ' + ppk.toFixed(2) + ' g/kg');
});

test('végan → protéines augmentées +10% (DIAAS correction — FAO 2013)', function() {
  setState({ regime: 0 }); // omnivore
  var pOmni = calcMacros().p;
  setState({ regime: 3 }); // végan
  var pVegan = calcMacros().p;
  assert(pVegan > pOmni, 'Protéines végan (' + pVegan + 'g) doivent être > omnivore (' + pOmni + 'g)');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 5 : Stabilité — pas de NaN ni de valeurs aberrantes ───────────────

suite('Stabilité — NaN, valeurs aberrantes, profils limites');

[
  { label: 'adolescent 13 ans',    s: { age: 13, weight: 50, height: 160, activity: 1, goal: 2 } },
  { label: 'senior 80 ans',        s: { age: 80, weight: 70, height: 165, activity: 0, goal: 2 } },
  { label: 'obèse 150 kg',         s: { weight: 150, height: 175, activity: 0, goal: 3 } },
  { label: 'très petit 45 kg',     s: { weight: 45, height: 158, activity: 0, goal: 2 } },
  { label: 'femme enceinte T2',    s: { sex: 'femme', age: 28, weight: 70, height: 165, pregnant: true, pregnancyWeek: 20, prePregnancyWeight: 62, goal: 2 } },
  { label: 'multi-pathologies',    s: { medical: ['diabete_t2', 'hta', 'cholesterol'], goal: 2 } }
].forEach(function(tc) {
  test('pas de NaN ni de valeur négative — ' + tc.label, function() {
    setState(tc.s);
    var bmr    = calcBMR();
    var tdee   = calcTDEE();
    var target = calcTarget();
    var m      = calcMacros();
    assert(!isNaN(bmr),    'calcBMR NaN');
    assert(!isNaN(tdee),   'calcTDEE NaN');
    assert(!isNaN(target), 'calcTarget NaN');
    assert(!isNaN(m.p) && !isNaN(m.g) && !isNaN(m.l), 'calcMacros NaN');
    if (bmr > 0) {
      assert(tdee >= bmr,   'TDEE < BMR');
      assert(target >= bmr, 'cible < BMR');
      assert(m.p >= 0 && m.g >= 0 && m.l >= 0, 'macro négative');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── RÉSULTAT FINAL ──────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(52));
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) sur ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
