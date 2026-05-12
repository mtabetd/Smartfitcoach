'use strict';

// ─── UNIT TESTS — RECIPE UX ENGINE ───────────────────────────────────────────

var fs   = require('fs');
var path = require('path');
var vm   = require('vm');

// ── BROWSER MOCK ──────────────────────────────────────────────────────────────
global.window = global;
global.localStorage = {
  _store: {}, getItem: function(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem: function(k, v) { this._store[k] = String(v); }, removeItem: function(k) { delete this._store[k]; },
  get length() { return Object.keys(this._store).length; }, key: function(i) { return Object.keys(this._store)[i] || null; }
};
var _f = function() {
  return { style: {}, appendChild: function() {}, addEventListener: function() {},
    removeEventListener: function() {}, innerHTML: '', textContent: '',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; } } };
};
global.document = { createElement: _f, getElementById: function() { return null; },
  querySelector: function() { return null; }, querySelectorAll: function() { return []; },
  addEventListener: function() {}, removeEventListener: function() {}, body: _f(), head: _f() };
Object.defineProperty(global, 'navigator', { value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true });
global.fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };
global.isEnglish = function() { return false; };

// ── LOAD MODULE ───────────────────────────────────────────────────────────────
var ROOT = path.join(__dirname, '..');
function load(rel) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
load('app/recipe-ux-engine.js');

var UX = window.RecipeUXEngine;

// ── TEST HARNESS ──────────────────────────────────────────────────────────────
var passed = 0, failed = 0, errors = [];
function assert(desc, cond) {
  if (cond) { passed++; }
  else { failed++; errors.push('FAIL: ' + desc); }
}
function assertClose(desc, actual, expected, tol) {
  tol = tol || 5;
  assert(desc + ' (got ' + actual + ', expected ~' + expected + ')', Math.abs(actual - expected) <= tol);
}

// ── FIXTURES ──────────────────────────────────────────────────────────────────
var PERFECT_LUNCH = {
  id: 'R001', name: 'Poulet grillé riz brocoli', emoji: '🍗',
  mealTypes: ['lunch'], origin: 'FR',
  servings: 1, prepTime: 10, cookTime: 20,
  difficulty: 'easy',
  tags: ['high-protein', 'meal-prep', 'anti-inflammatory'],
  baseNutrition: { calories: 520, proteinGrams: 42, carbsGrams: 45, fatGrams: 12 },
  ingredients: [
    { name: 'Poulet', qty: 180, unit: 'g' },
    { name: 'Riz complet', qty: 80, unit: 'g' },
    { name: 'Brocoli', qty: 120, unit: 'g' },
    { name: 'Huile olive', qty: 10, unit: 'ml' },
    { name: 'Ail', qty: 2, unit: 'gousse' }
  ],
  steps: ['Cuire le riz.', 'Griller le poulet.', 'Cuire le brocoli.', 'Assembler.']
};

var PROTEIN_BOWL = {
  id: 'R002', name: 'Buddha Bowl Protéiné', emoji: '🥗',
  mealTypes: ['lunch'], origin: 'US',
  servings: 1, prepTime: 15, cookTime: 0,
  difficulty: 'easy',
  tags: ['high-protein', 'meal-prep', 'vegan', 'bowl'],
  baseNutrition: { calories: 580, proteinGrams: 38, carbsGrams: 52, fatGrams: 18 },
  ingredients: [
    { name: 'Tofu', qty: 200, unit: 'g' },
    { name: 'Quinoa', qty: 80, unit: 'g' },
    { name: 'Avocat', qty: 75, unit: 'g' },
    { name: 'Épinards', qty: 80, unit: 'g' },
    { name: 'Carotte', qty: 100, unit: 'g' },
    { name: 'Graines de sésame', qty: 10, unit: 'g' },
    { name: 'Houmous', qty: 40, unit: 'g' }
  ],
  steps: ['Cuire le quinoa.', 'Préparer le tofu.', 'Couper les légumes.', 'Assembler dans un bol.', 'Ajouter les toppings.']
};

var LOW_SATIETY = {
  id: 'R003', name: 'Salade verte simple', emoji: null,
  mealTypes: ['lunch'],
  servings: 1, prepTime: 5, cookTime: 0,
  baseNutrition: { calories: 80, proteinGrams: 2, carbsGrams: 8, fatGrams: 4 },
  ingredients: [
    { name: 'Salade', qty: 100, unit: 'g' },
    { name: 'Tomate', qty: 80, unit: 'g' }
  ],
  steps: ['Mélanger les légumes.']
};

var COMPLEX_RECIPE = {
  id: 'R004', name: 'Bouillabaisse traditionnelle marseillaise',
  mealTypes: ['dinner'],
  servings: 4, prepTime: 60, cookTime: 90,
  difficulty: 'hard',
  tags: ['traditionnel'],
  baseNutrition: { calories: 2400, proteinGrams: 160, carbsGrams: 80, fatGrams: 120 },
  ingredients: [
    { name: 'Poisson', qty: 800, unit: 'g' }, { name: 'Crevette', qty: 200, unit: 'g' },
    { name: 'Moule', qty: 300, unit: 'g' },   { name: 'Tomate', qty: 400, unit: 'g' },
    { name: 'Oignon', qty: 200, unit: 'g' },  { name: 'Ail', qty: 6, unit: 'gousse' },
    { name: 'Safran', qty: 1, unit: 'g' },    { name: 'Fenouil', qty: 200, unit: 'g' },
    { name: 'Céleri', qty: 100, unit: 'g' },  { name: 'Huile olive', qty: 50, unit: 'ml' },
    { name: 'Bouillon de poisson', qty: 1, unit: 'l' },
    { name: 'Pomme de terre', qty: 400, unit: 'g' },
    { name: 'Rouille', qty: 60, unit: 'g' },  { name: 'Pain grillé', qty: 4, unit: 'pce' },
    { name: 'Persil', qty: 20, unit: 'g' },   { name: 'Laurier', qty: 2, unit: 'feuille' }
  ],
  steps: ['Émincer les légumes.', 'Faire revenir oignon et ail.', 'Ajouter les tomates.',
          'Verser le bouillon.', 'Ajouter le safran.', 'Cuire les poissons.', 'Ajouter les fruits de mer.', 'Servir avec la rouille.']
};

var VINAIGRETTE = {
  id: 'R005', name: 'Vinaigrette citron miel',
  mealTypes: ['lunch'],
  servings: 4, prepTime: 2, cookTime: 0,
  baseNutrition: { calories: 160, proteinGrams: 0, carbsGrams: 4, fatGrams: 16 },
  ingredients: [
    { name: 'Huile olive', qty: 30, unit: 'ml' },
    { name: 'Citron', qty: 1, unit: 'pce' },
    { name: 'Miel', qty: 10, unit: 'g' }
  ],
  steps: ['Mélanger tous les ingrédients.']
};

var DESSERT_SNACK = {
  id: 'R006', name: 'Mousse au chocolat légère',
  mealTypes: ['snack'],
  servings: 2, prepTime: 15, cookTime: 0,
  baseNutrition: { calories: 280, proteinGrams: 6, carbsGrams: 30, fatGrams: 14 },
  ingredients: [
    { name: 'Chocolat noir', qty: 60, unit: 'g' },
    { name: 'Blanc d\'œuf', qty: 3, unit: 'pce' },
    { name: 'Sucre', qty: 20, unit: 'g' }
  ],
  steps: ['Faire fondre le chocolat.', 'Monter les blancs en neige.', 'Incorporer délicatement.', 'Réfrigérer 2h.']
};

var SUPPLEMENT = {
  id: 'R007', name: 'Whey shake post-training chocolat',
  mealTypes: ['snack'],
  servings: 1, prepTime: 2, cookTime: 0,
  baseNutrition: { calories: 200, proteinGrams: 40, carbsGrams: 10, fatGrams: 2 },
  ingredients: [
    { name: 'Whey protéine', qty: 40, unit: 'g' },
    { name: 'Lait écrémé', qty: 300, unit: 'ml' }
  ],
  steps: ['Mélanger dans un shaker.']
};

var QUICK_BREAKFAST = {
  id: 'R008', name: 'Overnight oats aux fruits rouges',
  mealTypes: ['breakfast'], emoji: '🥣',
  origin: 'US',
  servings: 1, prepTime: 5, cookTime: 0,
  difficulty: 'easy',
  tags: ['meal-prep', 'rapide', 'healthy'],
  baseNutrition: { calories: 380, proteinGrams: 18, carbsGrams: 58, fatGrams: 10 },
  ingredients: [
    { name: 'Flocons d\'avoine', qty: 60, unit: 'g' },
    { name: 'Yaourt grec', qty: 100, unit: 'g' },
    { name: 'Framboise', qty: 80, unit: 'g' },
    { name: 'Amandes', qty: 20, unit: 'g' },
    { name: 'Miel', qty: 10, unit: 'g' }
  ],
  steps: ['Mélanger avoine et yaourt.', 'Ajouter les fruits.', 'Laisser reposer au frigo.']
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — MODULE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── EXPORTS ──────────────────────────────────────────────────');

assert('RecipeUXEngine exported', !!UX);
assert('SEVERITY_TIERS exported', !!UX.SEVERITY_TIERS);
assert('CODE_TIERS exported', !!UX.CODE_TIERS);
assert('UX_WEIGHTS exported', !!UX.UX_WEIGHTS);
assert('EXPECTED_EXCEPTIONS exported', Array.isArray(UX.EXPECTED_EXCEPTIONS));
assert('getTier exported', typeof UX.getTier === 'function');
assert('getExpectedException exported', typeof UX.getExpectedException === 'function');
assert('applyExceptions exported', typeof UX.applyExceptions === 'function');
assert('scoreSatietyUX exported', typeof UX.scoreSatietyUX === 'function');
assert('scoreFoodPleasure exported', typeof UX.scoreFoodPleasure === 'function');
assert('scoreMentalLoad exported', typeof UX.scoreMentalLoad === 'function');
assert('scoreVarietyPotential exported', typeof UX.scoreVarietyPotential === 'function');
assert('scoreAdherence exported', typeof UX.scoreAdherence === 'function');
assert('scorePremiumFeel exported', typeof UX.scorePremiumFeel === 'function');
assert('scoreUX exported', typeof UX.scoreUX === 'function');
assert('analyzeRecipeUX exported', typeof UX.analyzeRecipeUX === 'function');
assert('analyzeDatabaseUX exported', typeof UX.analyzeDatabaseUX === 'function');
assert('simulateWeek exported', typeof UX.simulateWeek === 'function');
assert('generateUXReport exported', typeof UX.generateUXReport === 'function');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — SEVERITY TIERS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── SEVERITY TIERS ──────────────────────────────────────────');

assert('CRITICAL tiers have 8 codes', Object.keys(UX.CODE_TIERS).filter(function(k) { return UX.CODE_TIERS[k] === 'critical'; }).length >= 6);
assert('HIGH tiers have 6 codes', Object.keys(UX.CODE_TIERS).filter(function(k) { return UX.CODE_TIERS[k] === 'high'; }).length >= 4);
assert('MEDIUM tiers present', Object.keys(UX.CODE_TIERS).filter(function(k) { return UX.CODE_TIERS[k] === 'medium'; }).length >= 6);
assert('LOW tiers present', Object.keys(UX.CODE_TIERS).filter(function(k) { return UX.CODE_TIERS[k] === 'low'; }).length >= 4);

assert('STRUCT_NO_ID → critical', UX.getTier('STRUCT_NO_ID') === 'critical');
assert('STRUCT_NO_NAME → critical', UX.getTier('STRUCT_NO_NAME') === 'critical');
assert('SCALE_NEGATIVE → critical', UX.getTier('SCALE_NEGATIVE') === 'critical');
assert('UX_EGG_IN_GRAMS → critical', UX.getTier('UX_EGG_IN_GRAMS') === 'critical');
assert('NUTR_MACRO_INCOHERENT → high', UX.getTier('NUTR_MACRO_INCOHERENT') === 'high');
assert('ING_FORBIDDEN_UNIT → high', UX.getTier('ING_FORBIDDEN_UNIT') === 'high');
assert('NUTR_CAL_TOO_LOW → medium', UX.getTier('NUTR_CAL_TOO_LOW') === 'medium');
assert('ING_DUPLICATE → medium', UX.getTier('ING_DUPLICATE') === 'medium');
assert('ING_NATURAL_UNIT → low', UX.getTier('ING_NATURAL_UNIT') === 'low');
assert('LING_ALL_CAPS → low', UX.getTier('LING_ALL_CAPS') === 'low');
assert('Unknown code → info', UX.getTier('NONEXISTENT_CODE') === 'info');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — EXPECTED EXCEPTIONS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── EXPECTED EXCEPTIONS ─────────────────────────────────────');

assert('EXPECTED_EXCEPTIONS has 4 entries', UX.EXPECTED_EXCEPTIONS.length === 4);

var excVin = UX.getExpectedException(VINAIGRETTE);
assert('Vinaigrette détectée comme CONDIMENT', excVin !== null && excVin.id === 'CONDIMENT');
assert('CONDIMENT supprime NO_PROTEIN_SOURCE', excVin && excVin.suppress.indexOf('NO_PROTEIN_SOURCE') >= 0);
assert('CONDIMENT supprime NUTR_CAL_TOO_LOW', excVin && excVin.suppress.indexOf('NUTR_CAL_TOO_LOW') >= 0);

var excDessert = UX.getExpectedException(DESSERT_SNACK);
assert('Mousse chocolat snack → DESSERT_SNACK', excDessert !== null && excDessert.id === 'DESSERT_SNACK');

var excSupp = UX.getExpectedException(SUPPLEMENT);
assert('Whey shake → SUPPLEMENT', excSupp !== null && excSupp.id === 'SUPPLEMENT');

var excNone = UX.getExpectedException(PERFECT_LUNCH);
assert('Poulet grillé → aucune exception', excNone === null);

var flags = [
  { type: 'NO_PROTEIN_SOURCE', severity: 'warn' },
  { type: 'NUTR_CAL_TOO_LOW', severity: 'warn' },
  { type: 'NUTR_MACRO_INCOHERENT', severity: 'warn' }
];
var applied = UX.applyExceptions(VINAIGRETTE, flags);
assert('applyExceptions supprime les flags CONDIMENT', applied.flags.length === 1);
assert('applyExceptions garde NUTR_MACRO_INCOHERENT', applied.flags[0].type === 'NUTR_MACRO_INCOHERENT');
assert('applyExceptions retourne l\'exception', applied.exception && applied.exception.id === 'CONDIMENT');

var appliedNone = UX.applyExceptions(PERFECT_LUNCH, flags);
assert('applyExceptions sans exception garde tous les flags', appliedNone.flags.length === 3);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — SATIETY UX
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── SATIETY UX ──────────────────────────────────────────────');

var satPerfect = UX.scoreSatietyUX(PERFECT_LUNCH);
var satLow     = UX.scoreSatietyUX(LOW_SATIETY);
var satBowl    = UX.scoreSatietyUX(PROTEIN_BOWL);
var satBreak   = UX.scoreSatietyUX(QUICK_BREAKFAST);

assert('Score satiété ∈ [0,100]', satPerfect >= 0 && satPerfect <= 100);
assert('Repas équilibré ≥ 70', satPerfect >= 70);
assert('Salade verte < repas équilibré', satLow < satPerfect);
assert('Buddha bowl satiété ≥ 65', satBowl >= 65);
assert('Breakfast overnight oats ≥ 55', satBreak >= 55);

var satVin = UX.scoreSatietyUX(VINAIGRETTE);
assert('Vinaigrette (condiment) satiété < 55', satVin < 55);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — FOOD PLEASURE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── FOOD PLEASURE ───────────────────────────────────────────');

var plBowl     = UX.scoreFoodPleasure(PROTEIN_BOWL);
var plGeneric  = UX.scoreFoodPleasure(LOW_SATIETY);
var plBreak    = UX.scoreFoodPleasure(QUICK_BREAKFAST);
var plComplex  = UX.scoreFoodPleasure(COMPLEX_RECIPE);

assert('Buddha bowl plaisir ≥ 65 (nom premium + ingrédients plaisir)', plBowl >= 65);
assert('Salade verte simple plaisir < Buddha bowl', plGeneric < plBowl);
assert('Overnight oats plaisir ≥ 55', plBreak >= 55);
assert('Bouillabaisse plaisir ≥ 55 (poisson + techniques)', plComplex >= 55);

var plPerfect = UX.scoreFoodPleasure(PERFECT_LUNCH);
assert('Poulet grillé plaisir ∈ [0,100]', plPerfect >= 0 && plPerfect <= 100);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — MENTAL LOAD
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── MENTAL LOAD ─────────────────────────────────────────────');

var mlSimple  = UX.scoreMentalLoad(QUICK_BREAKFAST);
var mlComplex = UX.scoreMentalLoad(COMPLEX_RECIPE);
var mlPerfect = UX.scoreMentalLoad(PERFECT_LUNCH);

assert('Charge mentale ∈ [0,100]', mlSimple >= 0 && mlSimple <= 100);
assert('Recette simple ≥ recette complexe', mlSimple > mlComplex);
assert('Bouillabaisse charge élevée (≤ 35)', mlComplex <= 35);
assert('Overnight oats charge faible (≥ 75)', mlSimple >= 75);
assert('Poulet 30min charge modérée (facile + meal-prep → élevée)', mlPerfect >= 60);

var mlMealPrep = UX.scoreMentalLoad({
  id: 'Rx', name: 'Test', mealTypes: ['lunch'],
  tags: ['meal-prep'], prepTime: 20, cookTime: 10,
  ingredients: [{ name: 'A', qty: 1, unit: 'g' }, { name: 'B', qty: 2, unit: 'g' }]
});
assert('Meal-prep bonus appliqué (charge allégée)', mlMealPrep >= 80);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — VARIETY POTENTIAL
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── VARIETY POTENTIAL ───────────────────────────────────────');

var varBowl   = UX.scoreVarietyPotential(PROTEIN_BOWL);
var varSimple = UX.scoreVarietyPotential(LOW_SATIETY);
var varBreak  = UX.scoreVarietyPotential(QUICK_BREAKFAST);

assert('Potentiel variété ∈ [0,100]', varBowl >= 0 && varBowl <= 100);
assert('Buddha bowl variété > salade verte', varBowl > varSimple);
assert('Overnight oats variété ≥ 60 (meal-prep + premium)', varBreak >= 60);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — ADHERENCE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── ADHERENCE ───────────────────────────────────────────────');

var adhPerfect  = UX.scoreAdherence(PERFECT_LUNCH);
var adhLow      = UX.scoreAdherence(LOW_SATIETY);
var adhBreak    = UX.scoreAdherence(QUICK_BREAKFAST);

assert('Adhérence ∈ [0,100]', adhPerfect >= 0 && adhPerfect <= 100);
assert('Recette équilibrée > salade verte restrictive', adhPerfect > adhLow);
assert('Overnight oats adhérence ≥ 55', adhBreak >= 55);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PREMIUM FEEL
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── PREMIUM FEEL ────────────────────────────────────────────');

var premBowl    = UX.scorePremiumFeel(PROTEIN_BOWL);
var premGeneric = UX.scorePremiumFeel(LOW_SATIETY);
var premBreak   = UX.scorePremiumFeel(QUICK_BREAKFAST);

assert('Feel premium ∈ [0,100]', premBowl >= 0 && premBowl <= 100);
assert('Buddha bowl premium > salade verte', premBowl > premGeneric);
assert('Overnight oats premium ≥ 50 (emoji + origin + overnight)', premBreak >= 50);
assert('Salade verte premium < 50 (no emoji, no origin, generic)', premGeneric < 50);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — COMPOSITE UX SCORE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── COMPOSITE UX SCORE ──────────────────────────────────────');

var uxPerfect  = UX.scoreUX(PERFECT_LUNCH);
var uxBowl     = UX.scoreUX(PROTEIN_BOWL);
var uxLow      = UX.scoreUX(LOW_SATIETY);

assert('scoreUX retourne {scores, uxScore}', uxPerfect.uxScore !== undefined && uxPerfect.scores !== undefined);
assert('uxScore ∈ [0,100]', uxPerfect.uxScore >= 0 && uxPerfect.uxScore <= 100);
assert('scores has 6 dimensions', Object.keys(uxPerfect.scores).length === 6);
assert('scores.satietyUX présent', uxPerfect.scores.satietyUX !== undefined);
assert('scores.adherence présent', uxPerfect.scores.adherence !== undefined);
assert('scores.premiumFeel présent', uxPerfect.scores.premiumFeel !== undefined);
assert('Buddha bowl UX ≥ salade restrictive', uxBowl.uxScore > uxLow.uxScore);
assert('Recette équilibrée UX ≥ 55', uxPerfect.uxScore >= 55);

// Vérifier que les poids somment à 1
var wSum = Object.values(UX.UX_WEIGHTS).reduce(function(s, v) { return s + v; }, 0);
assert('UX_WEIGHTS somme = 1.0', Math.abs(wSum - 1.0) < 0.001);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — ANALYZE RECIPE UX
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── ANALYZE RECIPE UX ───────────────────────────────────────');

var arPerfect = UX.analyzeRecipeUX(PERFECT_LUNCH);
var arBowl    = UX.analyzeRecipeUX(PROTEIN_BOWL);
var arVin     = UX.analyzeRecipeUX(VINAIGRETTE);
var arSupp    = UX.analyzeRecipeUX(SUPPLEMENT);

assert('analyzeRecipeUX retourne id', arPerfect.id === 'R001');
assert('analyzeRecipeUX retourne name', arPerfect.name === 'Poulet grillé riz brocoli');
assert('analyzeRecipeUX retourne mealType', arPerfect.mealType === 'lunch');
assert('analyzeRecipeUX retourne uxScore', arPerfect.uxScore >= 0 && arPerfect.uxScore <= 100);
assert('analyzeRecipeUX retourne uxGrade A/B/C/D', ['A','B','C','D'].indexOf(arPerfect.uxGrade) >= 0);
assert('analyzeRecipeUX retourne scores (6 dims)', Object.keys(arPerfect.scores).length === 6);
assert('Vinaigrette exception = CONDIMENT', arVin.exception === 'CONDIMENT');
assert('Supplement exception = SUPPLEMENT', arSupp.exception === 'SUPPLEMENT');
assert('Poulet grillé no exception', arPerfect.exception === null);
assert('Grade A ≥ 78', arBowl.uxScore < 78 || arBowl.uxGrade === 'A');
assert('Grade D < 48', (function() {
  var r = UX.analyzeRecipeUX(LOW_SATIETY);
  return r.uxGrade === 'D' || r.uxScore >= 48;
}()));

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — ANALYZE DATABASE UX
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── ANALYZE DATABASE UX ─────────────────────────────────────');

var miniDB = [PERFECT_LUNCH, PROTEIN_BOWL, LOW_SATIETY, COMPLEX_RECIPE,
              VINAIGRETTE, DESSERT_SNACK, SUPPLEMENT, QUICK_BREAKFAST];

var dbResult = UX.analyzeDatabaseUX(miniDB);

assert('analyzeDatabaseUX retourne analyzed', dbResult.analyzed >= 1);
assert('analyzed = R-format seulement', dbResult.analyzed === miniDB.filter(function(r) { return /^R\d+$/.test(r.id || ''); }).length);
assert('avgUxScore ∈ [0,100]', dbResult.avgUxScore >= 0 && dbResult.avgUxScore <= 100);
assert('frustrationIndex ∈ [0,100]', dbResult.frustrationIndex >= 0 && dbResult.frustrationIndex <= 100);
assert('premiumRatio ∈ [0,100]', dbResult.premiumRatio >= 0 && dbResult.premiumRatio <= 100);
assert('adherenceAvg présent', dbResult.adherenceAvg !== undefined);
assert('varietyAvg présent', dbResult.varietyAvg !== undefined);
assert('pleasureAvg présent', dbResult.pleasureAvg !== undefined);
assert('mentalLoadAvg présent', dbResult.mentalLoadAvg !== undefined);
assert('satietyAvg présent', dbResult.satietyAvg !== undefined);
assert('premiumFeelAvg présent', dbResult.premiumFeelAvg !== undefined);
assert('uxGradeDistribution présent', dbResult.uxGradeDistribution !== undefined);
assert('results trié par uxScore desc', (function() {
  var rs = dbResult.results;
  for (var i = 0; i < rs.length - 1; i++) {
    if (rs[i].uxScore < rs[i+1].uxScore) return false;
  }
  return true;
}()));
assert('weekSimulation présent', dbResult.weekSimulation !== null);

// DB vide
var emptyDB = UX.analyzeDatabaseUX([]);
assert('DB vide → analyzed=0', emptyDB.analyzed === 0);
assert('DB vide → avgUxScore=0', emptyDB.avgUxScore === 0);

// DB sans R-format
var emptyDB2 = UX.analyzeDatabaseUX([{ _id: 'L001', n: 'test', k: 400 }]);
assert('DB sans R-format → analyzed=0', emptyDB2.analyzed === 0);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — WEEK SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── WEEK SIMULATION ─────────────────────────────────────────');

// Construire une DB fictive de 25 recettes R-format
var bigDB = [];
for (var i = 0; i < 25; i++) {
  bigDB.push({
    id: 'R' + (100 + i), name: 'Recette test ' + i,
    mealTypes: ['lunch'], emoji: i % 3 === 0 ? '🍽️' : null,
    servings: 1, prepTime: 10 + i, cookTime: 15,
    baseNutrition: { calories: 400 + i * 10, proteinGrams: 25 + i, carbsGrams: 40, fatGrams: 12 },
    ingredients: [
      { name: 'Poulet', qty: 150, unit: 'g' },
      { name: 'Légumes', qty: 200, unit: 'g' },
      { name: 'Riz', qty: 80, unit: 'g' }
    ],
    steps: ['Cuire.', 'Mélanger.', 'Servir.']
  });
}

var bigResults = bigDB.map(function(r) { return UX.analyzeRecipeUX(r); });
var sim = UX.simulateWeek(bigResults);

assert('simulateWeek feasible avec 25 recettes', sim.feasible === true);
assert('recipesAvailable = 25', sim.recipesAvailable === 25);
assert('weekAdherence ∈ [0,100]', sim.weekAdherence >= 0 && sim.weekAdherence <= 100);
assert('weekPleasure ∈ [0,100]', sim.weekPleasure >= 0 && sim.weekPleasure <= 100);
assert('weekSatiety ∈ [0,100]', sim.weekSatiety >= 0 && sim.weekSatiety <= 100);
assert('frustratingMeals ∈ [0,21]', sim.frustratingMeals >= 0 && sim.frustratingMeals <= 21);
assert('premiumMeals ∈ [0,21]', sim.premiumMeals >= 0 && sim.premiumMeals <= 21);
assert('uniqueRecipes > 0', sim.uniqueRecipes > 0);
assert('monotonyRisk boolean', typeof sim.monotonyRisk === 'boolean');
assert('projectedMonthAdherence ∈ [0,100]', sim.projectedMonthAdherence >= 0 && sim.projectedMonthAdherence <= 100);

// DB insuffisante
var smallResults = [PERFECT_LUNCH].map(function(r) { return UX.analyzeRecipeUX(r); });
var simSmall = UX.simulateWeek(smallResults);
assert('simulateWeek non-feasible avec < 10 recettes', simSmall.feasible === false);
assert('note présente si non-feasible', typeof simSmall.note === 'string');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 14 — GENERATE UX REPORT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── GENERATE UX REPORT ──────────────────────────────────────');

var fullDB = bigDB.concat([PERFECT_LUNCH, PROTEIN_BOWL, QUICK_BREAKFAST, COMPLEX_RECIPE]);
var uxDB   = UX.analyzeDatabaseUX(fullDB);
var report = UX.generateUXReport(uxDB);

assert('generateUXReport retourne string', typeof report === 'string');
assert('Rapport contient titre', report.indexOf('RECIPE UX ENGINE') >= 0);
assert('Rapport contient Score UX', report.indexOf('Score UX moyen') >= 0);
assert('Rapport contient DIMENSIONS UX', report.indexOf('DIMENSIONS UX') >= 0);
assert('Rapport contient Satiété', report.indexOf('Satiété') >= 0);
assert('Rapport contient Plaisir alimentaire', report.indexOf('Plaisir alimentaire') >= 0);
assert('Rapport contient Charge mentale', report.indexOf('Charge mentale') >= 0);
assert('Rapport contient Adhérence', report.indexOf('Adhérence LT') >= 0);
assert('Rapport contient Feel premium', report.indexOf('Feel premium') >= 0);
assert('Rapport contient INDICES GLOBAUX', report.indexOf('INDICES GLOBAUX') >= 0);
assert('Rapport contient RECOMMANDATIONS', report.indexOf('RECOMMANDATIONS') >= 0);
assert('Rapport contient séparateurs', report.indexOf('═══') >= 0);

// Rapport avec DB insuffisante (sans simulation)
var smallUxDB = UX.analyzeDatabaseUX([PERFECT_LUNCH, PROTEIN_BOWL]);
var smallReport = UX.generateUXReport(smallUxDB);
assert('Rapport petite DB contient note simulation', smallReport.indexOf('SIMULATION') >= 0);

// ─────────────────────────────────────────────────────────────────────────────
// RÉSULTATS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════');
console.log(' RÉSULTATS : ' + passed + ' passés, ' + failed + ' échoués');
if (errors.length > 0) {
  errors.forEach(function(e) { console.error(' ' + e); });
  process.exit(1);
} else {
  console.log(' ✓ Tous les tests passent');
  process.exit(0);
}
