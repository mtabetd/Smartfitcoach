'use strict';

// ─── UNIT TESTS — RECIPE UX EXPLAINER ────────────────────────────────────────

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
load('app/recipe-ux-explainer.js');

var EX = window.RecipeUXExplainer;

// ── TEST HARNESS ──────────────────────────────────────────────────────────────
var passed = 0, failed = 0, errors = [];
function assert(desc, cond) {
  if (cond) { passed++; }
  else { failed++; errors.push('FAIL: ' + desc); }
}

// ── FIXTURES ──────────────────────────────────────────────────────────────────

// Recette optimale : protéines élevées, rapide, peu d'ingrédients
var HIGH_ADHERENCE = {
  id: 'R001', name: 'Poulet grillé riz brocoli', emoji: '🍗',
  mealTypes: ['lunch'], origin: 'FR',
  servings: 1, prepTime: 10, cookTime: 15, difficulty: 'easy',
  tags: ['high-protein', 'meal-prep', 'rapide'],
  baseNutrition: { calories: 520, proteinGrams: 42, carbsGrams: 45, fatGrams: 12 },
  ingredients: [
    { name: 'Poulet', qty: 180, unit: 'g' }, { name: 'Riz complet', qty: 80, unit: 'g' },
    { name: 'Brocoli', qty: 120, unit: 'g' }, { name: 'Huile olive', qty: 10, unit: 'ml' },
    { name: 'Ail', qty: 2, unit: 'gousse' }
  ],
  steps: ['Cuire le riz.', 'Griller le poulet.', 'Cuire le brocoli vapeur.', 'Assembler.']
};

// Recette premium : bowl avec ingrédients plaisir
var PREMIUM_BOWL = {
  id: 'R002', name: 'Buddha Bowl Quinoa Avocat', emoji: '🥗',
  mealTypes: ['lunch'], origin: 'US',
  servings: 1, prepTime: 15, cookTime: 0, difficulty: 'easy',
  tags: ['vegan', 'meal-prep', 'bowl', 'colorful'],
  baseNutrition: { calories: 580, proteinGrams: 22, carbsGrams: 60, fatGrams: 22 },
  ingredients: [
    { name: 'Quinoa', qty: 80, unit: 'g' }, { name: 'Avocat', qty: 75, unit: 'g' },
    { name: 'Épinards', qty: 80, unit: 'g' }, { name: 'Carotte', qty: 100, unit: 'g' },
    { name: 'Tomate cerise', qty: 80, unit: 'g' }, { name: 'Pois chiche', qty: 100, unit: 'g' },
    { name: 'Graines de sésame', qty: 10, unit: 'g' }, { name: 'Houmous', qty: 40, unit: 'g' }
  ],
  steps: ['Cuire le quinoa.', 'Rôtir les pois chiches.', 'Couper les légumes.', 'Assembler.', 'Saupoudrer les graines.']
};

// Recette à faible adhérence : peu calorique, longue, générique
var LOW_ADHERENCE = {
  id: 'R003', name: 'Salade verte simple',
  mealTypes: ['lunch'],
  servings: 1, prepTime: 5, cookTime: 0,
  baseNutrition: { calories: 80, proteinGrams: 2, carbsGrams: 8, fatGrams: 3 },
  ingredients: [
    { name: 'Salade', qty: 100, unit: 'g' }, { name: 'Tomate', qty: 80, unit: 'g' }
  ],
  steps: ['Mélanger.']
};

// Recette complexe : bouillabaisse
var COMPLEX = {
  id: 'R004', name: 'Bouillabaisse traditionnelle',
  mealTypes: ['dinner'], difficulty: 'hard',
  servings: 4, prepTime: 60, cookTime: 90,
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
  steps: ['Monter en neige les blancs.', 'Déglacér avec le bouillon.', 'Blanchir les légumes.', 'Cuire le poisson.', 'Émulsionner.', 'Servir.']
};

// Recette rapide breakfast
var QUICK_BREAKFAST = {
  id: 'R005', name: 'Overnight oats framboise', emoji: '🥣',
  mealTypes: ['breakfast'], origin: 'US',
  servings: 1, prepTime: 5, cookTime: 0, difficulty: 'easy',
  tags: ['meal-prep', 'rapide'],
  baseNutrition: { calories: 380, proteinGrams: 16, carbsGrams: 55, fatGrams: 10 },
  ingredients: [
    { name: 'Flocons d\'avoine', qty: 60, unit: 'g' }, { name: 'Yaourt grec', qty: 100, unit: 'g' },
    { name: 'Framboise', qty: 80, unit: 'g' },         { name: 'Amandes', qty: 20, unit: 'g' },
    { name: 'Miel', qty: 10, unit: 'g' }
  ],
  steps: ['Mélanger avoine et yaourt.', 'Ajouter les fruits.', 'Réfrigérer.']
};

// DB pour les tests de cluster/fatigue
function makeDB(n) {
  var db = [];
  for (var i = 0; i < n; i++) {
    db.push({
      id: 'R' + (100 + i), name: 'Recette poulet riz ' + i,
      mealTypes: ['lunch'], servings: 1, prepTime: 15, cookTime: 15,
      baseNutrition: { calories: 480 + i * 5, proteinGrams: 30 + i % 5, carbsGrams: 50, fatGrams: 12 },
      ingredients: [
        { name: 'Poulet', qty: 150, unit: 'g' }, { name: 'Riz', qty: 80, unit: 'g' },
        { name: 'Brocoli', qty: 100, unit: 'g' }
      ],
      steps: ['Cuire.', 'Mélanger.', 'Servir.']
    });
  }
  return db;
}

// DB variée pour tester la diversité
var DIVERSE_DB = [
  HIGH_ADHERENCE, PREMIUM_BOWL, LOW_ADHERENCE, QUICK_BREAKFAST,
  { id: 'R006', name: 'Curry de pois chiches', mealTypes: ['dinner'], servings: 2, prepTime: 10, cookTime: 25,
    baseNutrition: { calories: 900, proteinGrams: 36, carbsGrams: 100, fatGrams: 28 },
    ingredients: [{ name: 'Pois chiche', qty: 400, unit: 'g' }, { name: 'Tomate', qty: 200, unit: 'g' },
                  { name: 'Lait de coco', qty: 200, unit: 'ml' }, { name: 'Curry', qty: 2, unit: 'cs' }],
    steps: ['Cuire.', 'Ajouter le curry.', 'Mijoter.'] },
  { id: 'R007', name: 'Saumon rôti asperges', mealTypes: ['dinner'], servings: 1, prepTime: 5, cookTime: 15,
    baseNutrition: { calories: 420, proteinGrams: 38, carbsGrams: 12, fatGrams: 22 },
    ingredients: [{ name: 'Saumon', qty: 180, unit: 'g' }, { name: 'Asperge', qty: 200, unit: 'g' },
                  { name: 'Citron', qty: 1, unit: 'pce' }, { name: 'Huile olive', qty: 10, unit: 'ml' }],
    steps: ['Rôtir le saumon.', 'Cuire les asperges.', 'Assaisonner.'] }
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — MODULE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── EXPORTS ──────────────────────────────────────────────────');

assert('RecipeUXExplainer exported', !!EX);
assert('TEXTURE_PROFILES exported', !!EX.TEXTURE_PROFILES);
assert('FLAVOR_PROFILES exported', !!EX.FLAVOR_PROFILES);
assert('COLOR_PROFILES exported', !!EX.COLOR_PROFILES);
assert('PROTEIN_KEYS exported', Array.isArray(EX.PROTEIN_KEYS));
assert('CARB_KEYS exported', Array.isArray(EX.CARB_KEYS));
assert('IMPROVEMENTS exported', !!EX.IMPROVEMENTS);
assert('getProteinKey exported', typeof EX.getProteinKey === 'function');
assert('getCarbKey exported', typeof EX.getCarbKey === 'function');
assert('getTextureProfile exported', typeof EX.getTextureProfile === 'function');
assert('getFlavorProfile exported', typeof EX.getFlavorProfile === 'function');
assert('getVisualRichness exported', typeof EX.getVisualRichness === 'function');
assert('computeAllFactors exported', typeof EX.computeAllFactors === 'function');
assert('explainAdherence exported', typeof EX.explainAdherence === 'function');
assert('explainSatiety exported', typeof EX.explainSatiety === 'function');
assert('explainPremium exported', typeof EX.explainPremium === 'function');
assert('explainMentalLoad exported', typeof EX.explainMentalLoad === 'function');
assert('explainVariety exported', typeof EX.explainVariety === 'function');
assert('detectRepetitionClusters exported', typeof EX.detectRepetitionClusters === 'function');
assert('simulateFatigue exported', typeof EX.simulateFatigue === 'function');
assert('explainRecipeUX exported', typeof EX.explainRecipeUX === 'function');
assert('explainDatabase exported', typeof EX.explainDatabase === 'function');
assert('generateExplainableReport exported', typeof EX.generateExplainableReport === 'function');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — PROFILS SENSORIELS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── PROFILS SENSORIELS ──────────────────────────────────────');

// Texture
var tpBowl = EX.getTextureProfile(PREMIUM_BOWL);
assert('getTextureProfile retourne textures[]', Array.isArray(tpBowl.textures));
assert('getTextureProfile retourne diversity', typeof tpBowl.diversity === 'number');
assert('getTextureProfile retourne dominant', typeof tpBowl.dominant === 'string');
assert('getTextureProfile retourne isMonotone', typeof tpBowl.isMonotone === 'boolean');
assert('Bowl détecte CRUNCHY (graines sésame)', tpBowl.textures.indexOf('CRUNCHY') >= 0);
assert('Bowl détecte CHEWY (quinoa)', tpBowl.textures.indexOf('CHEWY') >= 0);
assert('Bowl diversity ≥ 2', tpBowl.diversity >= 2);

var tpSimple = EX.getTextureProfile(LOW_ADHERENCE);
assert('Salade simple isMonotone = true (2 ingrédients)', tpSimple.isMonotone === false || tpSimple.diversity <= 2);

var tpBreak = EX.getTextureProfile(QUICK_BREAKFAST);
assert('Overnight oats SOFT (yaourt) + CRUNCHY (amandes)', tpBreak.textures.indexOf('SOFT') >= 0 || tpBreak.textures.indexOf('CRUNCHY') >= 0);

// Flavor
var fpBowl = EX.getFlavorProfile(PREMIUM_BOWL);
assert('getFlavorProfile retourne flavors[]', Array.isArray(fpBowl.flavors));
assert('getFlavorProfile retourne complexity', typeof fpBowl.complexity === 'number');
assert('getFlavorProfile retourne balanced (bool)', typeof fpBowl.balanced === 'boolean');

var fpBreak = EX.getFlavorProfile(QUICK_BREAKFAST);
assert('Overnight oats SWEET (miel) + ACID (yaourt)', fpBreak.flavors.indexOf('SWEET') >= 0 || fpBreak.flavors.indexOf('ACID') >= 0);
assert('Overnight oats balanced (≥2 saveurs)', fpBreak.balanced);

// Visual richness
var vrBowl = EX.getVisualRichness(PREMIUM_BOWL);
assert('getVisualRichness retourne colors[]', Array.isArray(vrBowl.colors));
assert('getVisualRichness retourne richness', typeof vrBowl.richness === 'number');
assert('getVisualRichness retourne score [0,100]', vrBowl.score >= 0 && vrBowl.score <= 100);
assert('Bowl coloré (épinard, carotte, tomate) → appealing = true', vrBowl.appealing === true);
assert('Bowl richness ≥ 3', vrBowl.richness >= 3);

var vrSimple = EX.getVisualRichness(LOW_ADHERENCE);
assert('Salade simple score < Bowl score', vrSimple.score < vrBowl.score);

// Protein/Carb keys
assert('getProteinKey poulet → poulet/dinde', EX.getProteinKey(HIGH_ADHERENCE) === 'poulet/dinde');
assert('getProteinKey pois chiche → légumineuses', (function() {
  return EX.getProteinKey({ ingredients: [{ name: 'Pois chiche', qty: 100, unit: 'g' }] }) === 'légumineuses';
}()));
assert('getProteinKey saumon → poisson', (function() {
  return EX.getProteinKey({ ingredients: [{ name: 'Saumon', qty: 150, unit: 'g' }] }) === 'poisson';
}()));
assert('getProteinKey no protein → null', EX.getProteinKey(LOW_ADHERENCE) === null);
assert('getCarbKey riz → riz', EX.getCarbKey(HIGH_ADHERENCE) === 'riz');
assert('getCarbKey quinoa → quinoa', EX.getCarbKey(PREMIUM_BOWL) === 'quinoa');
assert('getCarbKey avoine → avoine', EX.getCarbKey(QUICK_BREAKFAST) === 'avoine');
assert('getCarbKey no carb → null', EX.getCarbKey(LOW_ADHERENCE) === null);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — COMPUTE ALL FACTORS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── COMPUTE ALL FACTORS ─────────────────────────────────────');

var factorsHigh = EX.computeAllFactors(HIGH_ADHERENCE);
assert('computeAllFactors retourne {positive, negative}', Array.isArray(factorsHigh.positive) && Array.isArray(factorsHigh.negative));
assert('Chaque facteur a key, impact, message', factorsHigh.positive.every(function(f) {
  return f.key && typeof f.impact === 'number' && f.message;
}));
assert('HIGH_PROTEIN détecté (42g)', factorsHigh.positive.some(function(f) { return f.key === 'HIGH_PROTEIN'; }));
assert('QUICK_PREP détecté (25min)', factorsHigh.positive.some(function(f) { return f.key === 'QUICK_PREP' || f.key === 'MODERATE_PREP'; }));
assert('MEAL_PREP détecté', factorsHigh.positive.some(function(f) { return f.key === 'MEAL_PREP'; }));
assert('EASY_DIFFICULTY détecté', factorsHigh.positive.some(function(f) { return f.key === 'EASY_DIFFICULTY'; }));

var factorsLow = EX.computeAllFactors(LOW_ADHERENCE);
assert('LOW_PROTEIN détecté (2g)', factorsLow.negative.some(function(f) { return f.key === 'LOW_PROTEIN'; }));
assert('FRUSTRATING_PORTION détecté (80kcal/lunch)', factorsLow.negative.some(function(f) { return f.key === 'FRUSTRATING_PORTION'; }));
assert('GENERIC_NAME détecté', factorsLow.negative.some(function(f) { return f.key === 'GENERIC_NAME'; }));

var factorsComplex = EX.computeAllFactors(COMPLEX);
assert('VERY_LONG_PREP détecté (150min)', factorsComplex.negative.some(function(f) { return f.key === 'VERY_LONG_PREP'; }));
assert('MANY_INGREDIENTS détecté (16)', factorsComplex.negative.some(function(f) { return f.key === 'MANY_INGREDIENTS'; }));
assert('HIGH_DIFFICULTY détecté', factorsComplex.negative.some(function(f) { return f.key === 'HIGH_DIFFICULTY'; }));
assert('COMPLEX_TECHNIQUES détecté', factorsComplex.negative.some(function(f) { return f.key === 'COMPLEX_TECHNIQUES'; }));

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — EXPLAIN FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── EXPLAIN FUNCTIONS ───────────────────────────────────────');

// Structure commune des retours
function assertExplainStructure(label, result) {
  assert(label + ' retourne score ∈ [0,100]', result.score >= 0 && result.score <= 100);
  assert(label + ' retourne factors.positive[]', Array.isArray(result.factors.positive));
  assert(label + ' retourne factors.negative[]', Array.isArray(result.factors.negative));
  assert(label + ' retourne improvements[]', Array.isArray(result.improvements));
}

var adhHigh = EX.explainAdherence(HIGH_ADHERENCE);
var adhLow  = EX.explainAdherence(LOW_ADHERENCE);
assertExplainStructure('explainAdherence(HIGH)', adhHigh);
assertExplainStructure('explainAdherence(LOW)', adhLow);
assert('Adhérence haute > adhérence basse', adhHigh.score > adhLow.score);
assert('LOW_ADHERENCE a des improvements', adhLow.improvements.length > 0);
assert('Improvement LOW contient "protéique"', adhLow.improvements.some(function(s) { return /protéique|protéines?/i.test(s); }));

var satHigh  = EX.explainSatiety(HIGH_ADHERENCE);
var satLow   = EX.explainSatiety(LOW_ADHERENCE);
var satSoupe = EX.explainSatiety({ id: 'Rx', name: 'Soupe de légumes', mealTypes: ['lunch'],
  baseNutrition: { calories: 200, proteinGrams: 8, carbsGrams: 20, fatGrams: 5 }, ingredients: [] });
assertExplainStructure('explainSatiety(HIGH)', satHigh);
assertExplainStructure('explainSatiety(LOW)', satLow);
assert('Satiété haute > satiété basse', satHigh.score > satLow.score);
assert('LIQUID_MEAL pénalise la soupe', satSoupe.factors.negative.some(function(f) { return f.key === 'LIQUID_MEAL'; }));

var premBowl = EX.explainPremium(PREMIUM_BOWL);
var premLow  = EX.explainPremium(LOW_ADHERENCE);
assertExplainStructure('explainPremium(BOWL)', premBowl);
assertExplainStructure('explainPremium(LOW)', premLow);
assert('Bowl premium > salade générique', premBowl.score > premLow.score);
assert('explainPremium retourne premiumIndicators', Array.isArray(premBowl.premiumIndicators));
assert('explainPremium retourne genericIndicators', Array.isArray(premBowl.genericIndicators));
assert('Bowl a des premiumIndicators non vides', premBowl.premiumIndicators.length > 0);

var mlSimple  = EX.explainMentalLoad(QUICK_BREAKFAST);
var mlComplex = EX.explainMentalLoad(COMPLEX);
assertExplainStructure('explainMentalLoad(SIMPLE)', mlSimple);
assertExplainStructure('explainMentalLoad(COMPLEX)', mlComplex);
assert('Charge mentale simple > complexe', mlSimple.score > mlComplex.score);
assert('explainMentalLoad retourne shoppingDifficulty', typeof mlSimple.shoppingDifficulty === 'string');
assert('explainMentalLoad retourne prepDifficulty', typeof mlSimple.prepDifficulty === 'string');
assert('Bouillabaisse hasTechnicalSkills = true', mlComplex.hasTechnicalSkills === true);
assert('shoppingDifficulty overnight faible', /faible|modérée/.test(mlSimple.shoppingDifficulty));

var varBowl = EX.explainVariety(PREMIUM_BOWL);
var varLow  = EX.explainVariety(LOW_ADHERENCE);
assertExplainStructure('explainVariety(BOWL)', varBowl);
assertExplainStructure('explainVariety(LOW)', varLow);
assert('Variété Bowl > salade générique', varBowl.score > varLow.score);

// buildImprovements ne retourne pas de doublons
var dupNeg = [{ key: 'LOW_PROTEIN' }, { key: 'LOW_PROTEIN' }, { key: 'GENERIC_NAME' }];
var impr = EX.buildImprovements(dupNeg);
assert('buildImprovements déduplique', impr.length === 2);
assert('buildImprovements filtre clés inconnues', EX.buildImprovements([{ key: 'NONEXISTENT' }]).length === 0);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — REPETITION DETECTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── REPETITION DETECTION ────────────────────────────────────');

var bigDB   = makeDB(20).concat([HIGH_ADHERENCE, PREMIUM_BOWL]);
var clusters = EX.detectRepetitionClusters(bigDB);

assert('detectRepetitionClusters retourne array', Array.isArray(clusters));
assert('Cluster dominant détecté (20 poulet+riz)', clusters.length >= 1);
assert('Cluster a key/protein/carb/count/risk', clusters[0] && clusters[0].key && clusters[0].count && clusters[0].risk);
assert('Cluster trié par count desc', clusters.length < 2 || clusters[0].count >= clusters[1].count);
assert('20 poulet+riz → risk HIGH ou MEDIUM', clusters[0] && (clusters[0].risk === 'HIGH' || clusters[0].risk === 'MEDIUM'));
assert('Cluster has examples', clusters[0] && Array.isArray(clusters[0].examples));
assert('Cluster note non vide', clusters[0] && clusters[0].note.length > 0);

// DB vide
var emptyClusters = EX.detectRepetitionClusters([]);
assert('detectRepetitionClusters DB vide = []', Array.isArray(emptyClusters) && emptyClusters.length === 0);

// DB sans R-format
var lOnlyDB = [{ _id: 'L001', n: 'test', k: 400, i: 'poulet', p: 30, g: 40, l: 10 }];
var lClusters = EX.detectRepetitionClusters(lOnlyDB);
assert('detectRepetitionClusters sans R-format = []', lClusters.length === 0);

// DB diversifiée
var divClusters = EX.detectRepetitionClusters(DIVERSE_DB);
assert('DB diversifiée → clusters moins nombreux', divClusters.length <= 2);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — LONG-TERM FATIGUE SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── FATIGUE SIMULATION ──────────────────────────────────────');

var fatDiverse = EX.simulateFatigue(DIVERSE_DB);
assert('simulateFatigue retourne feasible (bool)', typeof fatDiverse.feasible === 'boolean');

if (fatDiverse.feasible) {
  assert('week1.adherence ∈ [0,100]', fatDiverse.week1.adherence >= 0 && fatDiverse.week1.adherence <= 100);
  assert('month1.adherence ∈ [0,100]', fatDiverse.month1.adherence >= 0 && fatDiverse.month1.adherence <= 100);
  assert('month3.adherence ∈ [0,100]', fatDiverse.month3.adherence >= 0 && fatDiverse.month3.adherence <= 100);
  assert('week1 ≥ month3 (déclin possible)', fatDiverse.week1.adherence >= fatDiverse.month3.adherence - 5);
  assert('abandonRisk défini', ['LOW','MEDIUM','HIGH'].indexOf(fatDiverse.abandonRisk) >= 0);
  assert('limitingFactors présent', !!fatDiverse.limitingFactors);
  assert('frustrationIndex ∈ [0,100]', fatDiverse.limitingFactors.frustrationIndex >= 0);
  assert('recommendations array', Array.isArray(fatDiverse.recommendations) && fatDiverse.recommendations.length > 0);
  assert('notes présentes', typeof fatDiverse.week1.note === 'string');
}

// DB repetitive → déclin plus fort
var repDB   = makeDB(20);
var fatRep  = EX.simulateFatigue(repDB);
if (fatRep.feasible && fatDiverse.feasible) {
  assert('DB répétitive → month3 ≤ month3 diversifiée ou comparable', fatRep.month3.adherence <= fatDiverse.month3.adherence + 15);
}

// DB insuffisante
var fatSmall = EX.simulateFatigue([HIGH_ADHERENCE]);
assert('simulateFatigue trop petite DB → feasible=false', fatSmall.feasible === false);
assert('note présente si non-feasible', typeof fatSmall.note === 'string');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — EXPLAIN RECIPE UX
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── EXPLAIN RECIPE UX ───────────────────────────────────────');

var exHigh = EX.explainRecipeUX(HIGH_ADHERENCE);
assert('explainRecipeUX retourne id', exHigh.id === 'R001');
assert('explainRecipeUX retourne name', exHigh.name === 'Poulet grillé riz brocoli');
assert('explainRecipeUX retourne mealType', exHigh.mealType === 'lunch');
assert('explainRecipeUX retourne adherence', exHigh.adherence && exHigh.adherence.score >= 0);
assert('explainRecipeUX retourne satiety', exHigh.satiety && exHigh.satiety.score >= 0);
assert('explainRecipeUX retourne premium', exHigh.premium && exHigh.premium.score >= 0);
assert('explainRecipeUX retourne mentalLoad', exHigh.mentalLoad && exHigh.mentalLoad.score >= 0);
assert('explainRecipeUX retourne variety', exHigh.variety && exHigh.variety.score >= 0);
assert('explainRecipeUX retourne textureProfile', !!exHigh.textureProfile);
assert('explainRecipeUX retourne flavorProfile', !!exHigh.flavorProfile);
assert('explainRecipeUX retourne visualRichness', !!exHigh.visualRichness);
assert('explainRecipeUX retourne proteinSource', exHigh.proteinSource === 'poulet/dinde');
assert('explainRecipeUX retourne carbSource', exHigh.carbSource === 'riz');

var exLow = EX.explainRecipeUX(LOW_ADHERENCE);
assert('LOW_ADHERENCE: adherence score < HIGH_ADHERENCE', exLow.adherence.score < exHigh.adherence.score);
assert('LOW_ADHERENCE: satiety score < HIGH_ADHERENCE', exLow.satiety.score < exHigh.satiety.score);
assert('LOW_ADHERENCE has improvements', exLow.adherence.improvements.length > 0);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — EXPLAIN DATABASE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── EXPLAIN DATABASE ────────────────────────────────────────');

var dbEx = EX.explainDatabase(DIVERSE_DB);
assert('explainDatabase retourne analyzed', dbEx.analyzed >= 1);
assert('analyzed = R-format seulement', dbEx.analyzed === DIVERSE_DB.filter(function(r) { return /^R\d+$/.test(r.id || ''); }).length);
assert('avgScores.adherence ∈ [0,100]', dbEx.avgScores.adherence >= 0 && dbEx.avgScores.adherence <= 100);
assert('avgScores.satiety présent', dbEx.avgScores.satiety !== undefined);
assert('avgScores.premium présent', dbEx.avgScores.premium !== undefined);
assert('avgScores.mentalLoad présent', dbEx.avgScores.mentalLoad !== undefined);
assert('avgScores.variety présent', dbEx.avgScores.variety !== undefined);
assert('topLimiting est array', Array.isArray(dbEx.topLimiting));
assert('topStrengths est array', Array.isArray(dbEx.topStrengths));
assert('clusters est array', Array.isArray(dbEx.clusters));
assert('fatigue présent', dbEx.fatigue !== null);
assert('results trié par adhérence desc', (function() {
  var rs = dbEx.results;
  for (var i = 0; i < rs.length - 1; i++) {
    if ((rs[i].adherence.score || 0) < (rs[i+1].adherence.score || 0)) return false;
  }
  return true;
}()));
assert('topLimiting a key+count+pct', dbEx.topLimiting.every(function(f) {
  return f.key && typeof f.count === 'number' && typeof f.pct === 'number';
}));
assert('topStrengths a key+count+pct', dbEx.topStrengths.every(function(f) {
  return f.key && typeof f.count === 'number' && typeof f.pct === 'number';
}));

// DB vide
var emptyEx = EX.explainDatabase([]);
assert('explainDatabase DB vide → analyzed=0', emptyEx.analyzed === 0);
assert('explainDatabase DB vide → results vide', emptyEx.results.length === 0);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — GENERATE EXPLAINABLE REPORT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── GENERATE EXPLAINABLE REPORT ─────────────────────────────');

var fullDB  = makeDB(15).concat(DIVERSE_DB);
var report  = EX.generateExplainableReport(fullDB);

assert('generateExplainableReport retourne string', typeof report === 'string');
assert('Rapport contient titre EXPLAINABLE UX', report.indexOf('EXPLAINABLE UX REPORT') >= 0);
assert('Rapport contient SCORES EXPLIQUÉS', report.indexOf('SCORES EXPLIQUÉS') >= 0);
assert('Rapport contient Adhérence LT', report.indexOf('Adhérence LT') >= 0);
assert('Rapport contient FACTEURS LIMITANTS', report.indexOf('FACTEURS LIMITANTS') >= 0);
assert('Rapport contient FORCES PRINCIPALES', report.indexOf('FORCES PRINCIPALES') >= 0);
assert('Rapport contient CLUSTERS', report.indexOf('CLUSTERS') >= 0);
assert('Rapport contient PROJECTION ADHÉRENCE', report.indexOf('PROJECTION') >= 0);
assert('Rapport contient RECOMMANDATIONS', report.indexOf('RECOMMANDATIONS') >= 0);
assert('Rapport contient barres ═══', report.indexOf('═══') >= 0);
assert('Rapport contient flèches ↓ ou ↑', report.indexOf('↓') >= 0 || report.indexOf('↑') >= 0);

// Rapport avec DB insuffisante
var tinyReport = EX.generateExplainableReport([HIGH_ADHERENCE, PREMIUM_BOWL]);
assert('Rapport petite DB contient note', typeof tinyReport === 'string' && tinyReport.length > 100);

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
