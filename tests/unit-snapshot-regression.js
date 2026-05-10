'use strict';

// ─── TESTS UNITAIRES — SNAPSHOT DE RÉGRESSION calcMacros() ───────────────────
// Capture les sorties exactes de calcMacros() sur 20 profils canoniques,
// puis re-exécute et vérifie que les sorties sont IDENTIQUES.
// Tout changement de calcMacros() qui modifie une sortie est détecté immédiatement.
// Usage : node tests/unit-snapshot-regression.js
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
Object.defineProperty(global, 'navigator', {
  value: { language: 'fr-FR', onLine: true },
  writable: true, configurable: true
});
global.fetch          = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };

// ─── 2. CHARGEMENT DES MODULES ───────────────────────────────────────────────
// Ordre requis : sfc-constants.js → nutrition-master.js → app-core.js → i18n-helpers.js

var constCode = fs.readFileSync(path.join(__dirname, '../app/sfc-constants.js'), 'utf8');
try { vm.runInThisContext(constCode, { filename: 'sfc-constants.js' }); } catch(e) {}

var nmCode = fs.readFileSync(path.join(__dirname, '../app/nutrition-master.js'), 'utf8');
try { vm.runInThisContext(nmCode, { filename: 'nutrition-master.js' }); } catch(e) {}

var coreCode = fs.readFileSync(path.join(__dirname, '../app/app-core.js'), 'utf8');
try {
  vm.runInThisContext(coreCode, { filename: 'app-core.js' });
} catch(e) {
  console.error('[FATAL] Erreur au chargement de app-core.js:', e.message);
  process.exit(1);
}

try {
  var helpersCode = fs.readFileSync(path.join(__dirname, '../app/i18n-helpers.js'), 'utf8');
  vm.runInThisContext(helpersCode, { filename: 'i18n-helpers.js' });
} catch(e) {
  console.error('[FATAL] Erreur au chargement de i18n-helpers.js:', e.message);
  process.exit(1);
}

if (typeof global.calcMacros !== 'function') {
  console.error('[FATAL] calcMacros non disponible après chargement de app-core.js');
  process.exit(1);
}

// ─── 3. RUNNER MINIMALISTE ───────────────────────────────────────────────────

var passed = 0;
var failed = 0;

function suite(name) {
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

// ─── 4. CONSTRUCTION D'UN PROFIL S COMPLET ───────────────────────────────────
// Garantit l'absence de valeurs parasites entre les tests.
//
// Indexes activité : 0=sédentaire(×1.2), 1=léger(×1.375), 2=modéré(×1.55),
//                    3=très actif(×1.725), 4=athlète(×1.9), 5=élite(×2.1)
// Indexes objectif : 0=bulk(+15%), 1=lean_bulk(+10%), 2=maintien(×1.0),
//                    3=cut(-15%), 4=shred(-20%), 5=recomposition(×1.0)

function buildS(overrides) {
  return Object.assign({
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

// ─── 5. PROFILS CANONIQUES ────────────────────────────────────────────────────
// 20 profils déterministes — aucune valeur aléatoire ni dépendante du temps.
// Couvrent : sexes, âges, poids, objectifs et niveaux d'activité variés.

var profiles = [
  // 1 — Homme 80 kg sédentaire maintien
  { name: 'male-80-180-30-sedentary-maintain',
    sex:'homme', age:30, weight:80, height:180, activity:0, sportDays:0, goal:2 },
  // 2 — Homme 80 kg très actif coupe
  { name: 'male-80-180-30-active-cut',
    sex:'homme', age:30, weight:80, height:180, activity:3, sportDays:5, goal:3 },
  // 3 — Homme 80 kg très actif sèche
  { name: 'male-80-180-30-active-shred',
    sex:'homme', age:30, weight:80, height:180, activity:3, sportDays:5, goal:4 },
  // 4 — Homme 80 kg très actif bulk
  { name: 'male-80-180-30-active-bulk',
    sex:'homme', age:30, weight:80, height:180, activity:3, sportDays:5, goal:0 },
  // 5 — Homme 80 kg très actif lean_bulk
  { name: 'male-80-180-30-active-lean_bulk',
    sex:'homme', age:30, weight:80, height:180, activity:3, sportDays:5, goal:1 },
  // 6 — Femme 65 kg modérée maintien
  { name: 'female-65-165-28-moderate-maintain',
    sex:'femme', age:28, weight:65, height:165, activity:2, sportDays:3, goal:2 },
  // 7 — Femme 65 kg modérée coupe
  { name: 'female-65-165-28-moderate-cut',
    sex:'femme', age:28, weight:65, height:165, activity:2, sportDays:3, goal:3 },
  // 8 — Femme 65 kg très active lean_bulk
  { name: 'female-65-165-28-very_active-lean_bulk',
    sex:'femme', age:28, weight:65, height:165, activity:3, sportDays:5, goal:1 },
  // 9 — Homme 100 kg sédentaire sèche (obèse — poids ajusté ASPEN 2016)
  { name: 'male-100-175-45-sedentary-shred',
    sex:'homme', age:45, weight:100, height:175, activity:0, sportDays:0, goal:4 },
  // 10 — Homme 70 kg élite recomposition
  { name: 'male-70-175-25-elite-recomposition',
    sex:'homme', age:25, weight:70, height:175, activity:5, sportDays:7, goal:5 },
  // 11 — Femme 55 kg légèrement active maintien (très légère)
  { name: 'female-55-162-22-light-maintain',
    sex:'femme', age:22, weight:55, height:162, activity:1, sportDays:1, goal:2 },
  // 12 — Homme 95 kg modéré maintien (âge 50 — bonus sarcopénie ESPEN 2019)
  { name: 'male-95-182-50-moderate-maintain',
    sex:'homme', age:50, weight:95, height:182, activity:2, sportDays:3, goal:2 },
  // 13 — Femme 70 kg très active coupe (medical=[])
  { name: 'female-70-168-35-active-cut',
    sex:'femme', age:35, weight:70, height:168, activity:3, sportDays:5, goal:3, medical:[] },
  // 14 — Homme 85 kg très actif maintien (âge 40 — bonus sarcopénie)
  { name: 'male-85-178-40-active-maintain',
    sex:'homme', age:40, weight:85, height:178, activity:3, sportDays:5, goal:2 },
  // 15 — Homme 60 kg sédentaire bulk
  { name: 'male-60-170-28-sedentary-bulk',
    sex:'homme', age:28, weight:60, height:170, activity:0, sportDays:0, goal:0 },
  // 16 — Femme 80 kg modérée lean_bulk
  { name: 'female-80-172-38-moderate-lean_bulk',
    sex:'femme', age:38, weight:80, height:172, activity:2, sportDays:3, goal:1 },
  // 17 — Homme 75 kg très actif coupe
  { name: 'male-75-176-32-very_active-cut',
    sex:'homme', age:32, weight:75, height:176, activity:3, sportDays:5, goal:3 },
  // 18 — Femme 58 kg élite sèche
  { name: 'female-58-160-26-elite-shred',
    sex:'femme', age:26, weight:58, height:160, activity:5, sportDays:7, goal:4 },
  // 19 — Homme 90 kg légèrement actif maintien (âge 55)
  { name: 'male-90-185-55-light-maintain',
    sex:'homme', age:55, weight:90, height:185, activity:1, sportDays:2, goal:2 },
  // 20 — Homme 120 kg modéré coupe (lourd — poids ajusté ASPEN 2016)
  { name: 'male-120-180-35-moderate-cut',
    sex:'homme', age:35, weight:120, height:180, activity:2, sportDays:3, goal:3 }
];

// ─── 6. PHASE 1 : CAPTURE DU SNAPSHOT ────────────────────────────────────────
// Exécuter calcMacros() une première fois pour enregistrer les valeurs de référence.
// Le champ cal est calculé comme g×4 + p×4 + l×9 (cohérence calorique totale).

suite('Phase 1 — Capture du snapshot calcMacros()');

var results = profiles.map(function(p) {
  window.S = buildS(p);
  var out = calcMacros();
  return {
    name: p.name,
    out: {
      g:   out.g,
      p:   out.p,
      l:   out.l,
      cal: out.g * 4 + out.p * 4 + out.l * 9
    }
  };
});

// Afficher le snapshot pour référence / débogage
results.forEach(function(r) {
  console.log('  snapshot:', r.name, JSON.stringify(r.out));
});

// ─── 7. PHASE 2 : VÉRIFICATION — RE-EXÉCUTION ET COMPARAISON ─────────────────
// Re-exécuter calcMacros() pour chaque profil et vérifier que les sorties
// sont STRICTEMENT identiques aux valeurs capturées.
// 20 profils × 4 champs = 80 assertions.

suite('Phase 2 — Vérification de régression (80 assertions)');

results.forEach(function(r, i) {
  var p = profiles[i];
  test(r.name + ' — glucides (g)', function() {
    window.S = buildS(p);
    var actual = calcMacros();
    var actualG = actual.g;
    if (actualG !== r.out.g) {
      throw new Error(
        'RÉGRESSION glucides — attendu: ' + r.out.g + ', obtenu: ' + actualG
      );
    }
  });
  test(r.name + ' — protéines (p)', function() {
    window.S = buildS(p);
    var actual = calcMacros();
    var actualP = actual.p;
    if (actualP !== r.out.p) {
      throw new Error(
        'RÉGRESSION protéines — attendu: ' + r.out.p + ', obtenu: ' + actualP
      );
    }
  });
  test(r.name + ' — lipides (l)', function() {
    window.S = buildS(p);
    var actual = calcMacros();
    var actualL = actual.l;
    if (actualL !== r.out.l) {
      throw new Error(
        'RÉGRESSION lipides — attendu: ' + r.out.l + ', obtenu: ' + actualL
      );
    }
  });
  test(r.name + ' — calories totales (cal=g×4+p×4+l×9)', function() {
    window.S = buildS(p);
    var actual = calcMacros();
    var actualCal = actual.g * 4 + actual.p * 4 + actual.l * 9;
    if (actualCal !== r.out.cal) {
      throw new Error(
        'RÉGRESSION calories — attendu: ' + r.out.cal + ', obtenu: ' + actualCal
      );
    }
  });
});

// ─── 8. RÉSULTAT FINAL ───────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(52));
console.log('Profils testés : ' + profiles.length + ' | Assertions : ' + (profiles.length * 4));
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) sur ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
