'use strict';

// ─── TESTS RECIPE INTELLIGENCE LAYER ─────────────────────────────────────────
// Couvre : coherence, scoring premium, diversité, portions humaines.
// Usage  : node tests/unit-recipe-intelligence.js
// ─────────────────────────────────────────────────────────────────────────────

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
var _fakeEl = function() {
  return { style: {}, appendChild: function() {}, addEventListener: function() {},
    removeEventListener: function() {}, innerHTML: '', textContent: '',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; } } };
};
global.document = { createElement: _fakeEl, getElementById: function() { return null; },
  querySelector: function() { return null; }, querySelectorAll: function() { return []; },
  addEventListener: function() {}, removeEventListener: function() {},
  body: _fakeEl(), head: _fakeEl() };
Object.defineProperty(global, 'navigator', { value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true });
global.fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };
global.isEnglish = function() { return false; };

// ── LOADER ────────────────────────────────────────────────────────────────────
function loadFile(rel) {
  var code = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  try { vm.runInThisContext(code, { filename: rel }); }
  catch(e) { console.error('[FATAL] ' + rel + ' : ' + e.message); process.exit(1); }
}
loadFile('app/recipe-registry.js');
loadFile('app/recipe-engine.js');
loadFile('app/recipe-intelligence.js');

var RI = window.RecipeIntelligence;
var RE = window.RecipeEngine;
if (!RI) { console.error('[FATAL] RecipeIntelligence not exported'); process.exit(1); }
if (!RE) { console.error('[FATAL] RecipeEngine not exported');       process.exit(1); }

// ── RUNNER ────────────────────────────────────────────────────────────────────
var passed = 0, failed = 0;
function suite(name) { console.log('\n' + name); }
function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name); console.error('    ', e.message); failed++; }
}
function ok(v, msg)    { if (!v)      throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' — got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
function near(a, b, tol, msg) { tol = tol || 5; if (Math.abs(a - b) > tol) throw new Error((msg || '') + ' — got ' + a + ' expected ~' + b + ' ±' + tol); }
function hasFlag(flags, type, msg) {
  if (!flags.some(function(f) { return f.type === type; }))
    throw new Error((msg || 'expected flag ' + type) + ' — got: ' + JSON.stringify(flags.map(function(f){return f.type;})));
}
function noFlag(flags, type, msg) {
  if (flags.some(function(f) { return f.type === type; }))
    throw new Error((msg || 'unexpected flag ' + type));
}

// ── FIXTURES ──────────────────────────────────────────────────────────────────
var PERFECT_LUNCH = {
  id: 'T01', name: 'Poulet riz légumes express', mealTypes: ['lunch'], servings: 1,
  prepTime: 10, cookTime: 15, difficulty: 1,
  baseNutrition: { calories: 520, proteinGrams: 40, carbsGrams: 55, fatGrams: 10 },
  ingredients: [
    { name: 'Blanc de poulet', qty: 150, unit: 'g' },
    { name: 'Riz',             qty: 80,  unit: 'g' },
    { name: 'Brocoli',         qty: 150, unit: 'g' },
    { name: "Huile d'olive",   qty: 10,  unit: 'ml' }
  ],
  steps: ['Cuire poulet', 'Cuire riz', 'Cuire brocoli', 'Assembler'],
  tags: ['high-protein', 'meal-prep'], emoji: '🍗', origin: '🇫🇷'
};

var LOW_PROTEIN = {
  id: 'T02', name: 'Salade verte', mealTypes: ['lunch'], servings: 1,
  prepTime: 5, cookTime: 0, difficulty: 1,
  baseNutrition: { calories: 80, proteinGrams: 2, carbsGrams: 8, fatGrams: 4 },
  ingredients: [
    { name: 'Laitue', qty: 100, unit: 'g' },
    { name: 'Tomate', qty: 80,  unit: 'g' },
    { name: 'Vinaigrette', qty: 15, unit: 'ml' }
  ],
  steps: ['Laver', 'Couper', 'Mélanger']
};

var COMBO_BAD = {
  id: 'T03', name: 'Chocolat-thon fusion', mealTypes: ['lunch'], servings: 1,
  baseNutrition: { calories: 400, proteinGrams: 30, carbsGrams: 30, fatGrams: 15 },
  ingredients: [
    { name: 'Thon en conserve', qty: 150, unit: 'g' },
    { name: 'Chocolat noir',    qty: 50,  unit: 'g' },
    { name: 'Laitue',           qty: 80,  unit: 'g' }
  ]
};

var COMPLEX_RECIPE = {
  id: 'T04', name: 'Bouillabaisse revisitée ultra-complexe', mealTypes: ['dinner'], servings: 4,
  prepTime: 60, cookTime: 90, difficulty: 3,
  baseNutrition: { calories: 2800, proteinGrams: 180, carbsGrams: 120, fatGrams: 160 },
  ingredients: [
    { name: 'Saumon',       qty: 200, unit: 'g' },
    { name: 'Crevettes',    qty: 150, unit: 'g' },
    { name: 'Moules',       qty: 200, unit: 'g' },
    { name: 'Fenouil',      qty: 150, unit: 'g' },
    { name: 'Tomates',      qty: 400, unit: 'g' },
    { name: 'Vin blanc',    qty: 200, unit: 'ml' },
    { name: 'Safran',       qty: 1,   unit: 'pincee' },
    { name: 'Rouille',      qty: 60,  unit: 'g' },
    { name: 'Pain grillé',  qty: 80,  unit: 'g' },
    { name: 'Ail',          qty: 20,  unit: 'g' },
    { name: 'Oignon',       qty: 100, unit: 'g' },
    { name: 'Céleri',       qty: 80,  unit: 'g' },
    { name: 'Pastis',       qty: 30,  unit: 'ml' },
    { name: 'Huile olive',  qty: 30,  unit: 'ml' },
    { name: 'Laurier',      qty: 2,   unit: 'pce' },
    { name: 'Thym',         qty: 5,   unit: 'g' }
  ]
};

var BREAKFAST_RECIPE = {
  id: 'T05', name: 'Overnight oats banane', mealTypes: ['breakfast'], servings: 1,
  prepTime: 5, cookTime: 0,
  baseNutrition: { calories: 420, proteinGrams: 18, carbsGrams: 58, fatGrams: 12 },
  ingredients: [
    { name: "Flocons d'avoine", qty: 80,  unit: 'g' },
    { name: 'Lait écrémé',      qty: 200, unit: 'ml' },
    { name: 'Banane',           qty: 100, unit: 'g' },
    { name: 'Miel',             qty: 10,  unit: 'g' }
  ],
  steps: ['Mélanger avoine et lait', 'Réfrigérer', 'Garnir banane et miel'],
  emoji: '🥣', origin: '🇺🇸'
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. EXPORTS ET STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
suite('INTELLIGENCE — exports');

test('window.RecipeIntelligence exporté avec toutes les fonctions', function() {
  ok(RI.checkCoherence,          'checkCoherence manquante');
  ok(RI.scorePremium,            'scorePremium manquante');
  ok(RI.analyzeRecipe,           'analyzeRecipe manquante');
  ok(RI.analyzeDatabase,         'analyzeDatabase manquante');
  ok(RI.analyzeDiversity,        'analyzeDiversity manquante');
  ok(RI.generateIntelligenceReport, 'generateIntelligenceReport manquante');
  ok(RI.KCAL_TARGETS,            'KCAL_TARGETS manquante');
  ok(RI.SCORE_WEIGHTS,           'SCORE_WEIGHTS manquante');
});

test('KCAL_TARGETS couvre breakfast/lunch/dinner/snack', function() {
  ['breakfast','lunch','dinner','snack'].forEach(function(t) {
    ok(RI.KCAL_TARGETS[t], t + ' manquant dans KCAL_TARGETS');
    ok(RI.KCAL_TARGETS[t].min < RI.KCAL_TARGETS[t].ideal, t + ': min < ideal');
    ok(RI.KCAL_TARGETS[t].ideal < RI.KCAL_TARGETS[t].max, t + ': ideal < max');
  });
});

test('SCORE_WEIGHTS somme ≈ 1.0', function() {
  var sum = Object.keys(RI.SCORE_WEIGHTS).reduce(function(s, k) { return s + RI.SCORE_WEIGHTS[k]; }, 0);
  near(sum, 1.0, 0.01, 'somme des poids');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CULINARY COHERENCE
// ─────────────────────────────────────────────────────────────────────────────
suite('COHERENCE — checkCoherence');

test('Recette saine : aucun flag', function() {
  var flags = RI.checkCoherence(PERFECT_LUNCH);
  noFlag(flags, 'NO_PROTEIN_SOURCE', 'pas de NO_PROTEIN_SOURCE pour recette avec poulet');
  noFlag(flags, 'NO_VEGETABLES',     'pas de NO_VEGETABLES pour recette avec brocoli');
});

test('Combo chocolat + poisson : flag COMBO_INCOHERENT', function() {
  var flags = RI.checkCoherence(COMBO_BAD);
  hasFlag(flags, 'COMBO_INCOHERENT', 'doit détecter chocolat+thon');
});

test('Salade verte sans protéine : flag NO_PROTEIN_SOURCE', function() {
  var flags = RI.checkCoherence(LOW_PROTEIN);
  hasFlag(flags, 'NO_PROTEIN_SOURCE', 'doit détecter absence protéine au déjeuner');
});

test('Breakfast sans protéine ne flag pas NO_PROTEIN_SOURCE', function() {
  var recipe = { id: 'T_B', name: 'Toast confiture', mealTypes: ['breakfast'], servings: 1,
    baseNutrition: { calories: 200, proteinGrams: 3, carbsGrams: 40, fatGrams: 2 },
    ingredients: [{ name: 'Pain blanc', qty: 80, unit: 'g' }, { name: 'Confiture', qty: 20, unit: 'g' }] };
  var flags = RI.checkCoherence(recipe);
  noFlag(flags, 'NO_PROTEIN_SOURCE', 'breakfast avec peu de protéines ne doit pas flaguer');
});

test('Repas très faible calories : flag INSUFFICIENT_SATIETY', function() {
  var recipe = { id: 'T_S', name: 'Bouillon léger', mealTypes: ['dinner'], servings: 1,
    baseNutrition: { calories: 90, proteinGrams: 5, carbsGrams: 8, fatGrams: 2 },
    ingredients: [{ name: 'Bouillon', qty: 300, unit: 'ml' }, { name: 'Légumes', qty: 50, unit: 'g' },
                  { name: 'Vermicelles', qty: 20, unit: 'g' }] };
  var flags = RI.checkCoherence(recipe);
  hasFlag(flags, 'INSUFFICIENT_SATIETY', 'doit flaguer 90 kcal au dîner');
});

test('checkCoherence ne crashe pas avec recette minimale', function() {
  var flags = RI.checkCoherence({ id: 'T_MIN', name: 'Test' });
  ok(Array.isArray(flags), 'doit retourner un tableau');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SCORING INDIVIDUAL
// ─────────────────────────────────────────────────────────────────────────────
suite('SCORING — scoreProteinDensity');

test('Recette haute protéine (40g/520kcal) : score ≥ 75', function() {
  var s = RI.scoreProteinDensity(PERFECT_LUNCH);
  ok(s >= 75, 'score doit être ≥ 75, got ' + s);
});

test('Recette faible protéine (2g/80kcal) : score ≤ 45', function() {
  var s = RI.scoreProteinDensity(LOW_PROTEIN);
  ok(s <= 45, 'score doit être ≤ 45, got ' + s);
});

test('scoreProteinDensity sans baseNutrition : retourne 50 (neutre)', function() {
  var s = RI.scoreProteinDensity({ id: 'X' });
  eq(s, 50, 'défaut doit être 50');
});

suite('SCORING — scoreSatiety');

test('Poulet+riz+brocoli : score satiété ≥ 70', function() {
  var s = RI.scoreSatiety(PERFECT_LUNCH);
  ok(s >= 70, 'score satiété doit être ≥ 70, got ' + s);
});

test('Salade verte : score satiété ≤ 55', function() {
  var s = RI.scoreSatiety(LOW_PROTEIN);
  ok(s <= 55, 'score satiété doit être ≤ 55, got ' + s);
});

suite('SCORING — scorePortionRealism');

test('Déjeuner 520 kcal (idéal ~550) : score ≥ 80', function() {
  var s = RI.scorePortionRealism(PERFECT_LUNCH);
  ok(s >= 80, 'score portion doit être ≥ 80, got ' + s);
});

test('Déjeuner 80 kcal : score très bas (< 40)', function() {
  var s = RI.scorePortionRealism(LOW_PROTEIN);
  ok(s < 40, 'portion frustrante doit avoir score < 40, got ' + s);
});

test('Breakfast 420 kcal : score portion bon', function() {
  var s = RI.scorePortionRealism(BREAKFAST_RECIPE);
  ok(s >= 60, 'breakfast 420 kcal doit avoir bon score, got ' + s);
});

suite('SCORING — scorePrepFeasibility');

test('Recette 25min, 4 ingrédients : score ≥ 80', function() {
  var s = RI.scorePrepFeasibility(PERFECT_LUNCH);
  ok(s >= 80, 'score faisabilité doit être ≥ 80, got ' + s);
});

test('Recette 150min, 16 ingrédients : score ≤ 40', function() {
  var s = RI.scorePrepFeasibility(COMPLEX_RECIPE);
  ok(s <= 40, 'recette complexe doit avoir score ≤ 40, got ' + s);
});

test('Breakfast 5min : score ≥ 90', function() {
  var s = RI.scorePrepFeasibility(BREAKFAST_RECIPE);
  ok(s >= 90, 'overnight oats 5min doit avoir score ≥ 90, got ' + s);
});

suite('SCORING — scoreSimplicity');

test('4 ingrédients : score ≥ 85', function() {
  var s = RI.scoreSimplicity(PERFECT_LUNCH);
  ok(s >= 85, 'score simplicity doit être ≥ 85, got ' + s);
});

test('16 ingrédients : score ≤ 40', function() {
  var s = RI.scoreSimplicity(COMPLEX_RECIPE);
  ok(s <= 40, 'score simplicity doit être ≤ 40, got ' + s);
});

suite('SCORING — scoreReadability');

test('Recette avec nom, emoji, steps : score ≥ 70', function() {
  var s = RI.scoreReadability(PERFECT_LUNCH);
  ok(s >= 70, 'score readability doit être ≥ 70, got ' + s);
});

test('Recette sans nom : score ≤ 25', function() {
  var s = RI.scoreReadability({ id: 'X', name: '' });
  ok(s <= 25, 'score readability sans nom doit être ≤ 25, got ' + s);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. SCORE PREMIUM AGRÉGÉ
// ─────────────────────────────────────────────────────────────────────────────
suite('PREMIUM — scorePremium agrégé');

test('scorePremium retourne scores + premium', function() {
  var r = RI.scorePremium(PERFECT_LUNCH);
  ok(r.scores && typeof r.premium === 'number', 'structure attendue');
  ok(Object.keys(r.scores).length >= 5, 'au moins 5 dimensions de score');
});

test('Recette premium (poulet+riz+légumes) : score ≥ 68', function() {
  var r = RI.scorePremium(PERFECT_LUNCH);
  ok(r.premium >= 68, 'recette healthy doit avoir premium ≥ 68, got ' + r.premium);
});

test('Salade verte insuffisante : premium < recette saine', function() {
  var rGood = RI.scorePremium(PERFECT_LUNCH);
  var rBad  = RI.scorePremium(LOW_PROTEIN);
  ok(rBad.premium < rGood.premium, 'salade (' + rBad.premium + ') doit être < recette saine (' + rGood.premium + ')');
});

test('Recette ultra-complexe : premium < recette simple', function() {
  var rSimple  = RI.scorePremium(BREAKFAST_RECIPE);
  var rComplex = RI.scorePremium(COMPLEX_RECIPE);
  ok(rComplex.premium < rSimple.premium, 'complexe (' + rComplex.premium + ') doit être < simple (' + rSimple.premium + ')');
});

test('Tous les scores sont entre 0 et 100', function() {
  [PERFECT_LUNCH, LOW_PROTEIN, COMPLEX_RECIPE, BREAKFAST_RECIPE].forEach(function(recipe) {
    var r = RI.scorePremium(recipe);
    Object.keys(r.scores).forEach(function(k) {
      ok(r.scores[k] >= 0 && r.scores[k] <= 100, recipe.id + ': ' + k + ' hors [0,100]: ' + r.scores[k]);
    });
    ok(r.premium >= 0 && r.premium <= 100, recipe.id + ': premium hors [0,100]: ' + r.premium);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ASSESS PORTIONS
// ─────────────────────────────────────────────────────────────────────────────
suite('PORTIONS — assessPortions');

test('Déjeuner 80 kcal : flag PORTION_FRUSTRATING', function() {
  var flags = RI.assessPortions(LOW_PROTEIN);
  hasFlag(flags, 'PORTION_FRUSTRATING', 'doit détecter portion frustrante');
});

test('Déjeuner 520 kcal : aucun flag portion', function() {
  var flags = RI.assessPortions(PERFECT_LUNCH);
  ok(flags.length === 0, 'aucun flag pour portion normale, got: ' + JSON.stringify(flags.map(function(f){return f.type;})));
});

test('Dîner 2g protéines : flag LOW_PROTEIN_PORTION', function() {
  var recipe = { id: 'T_LP', name: 'Test', mealTypes: ['dinner'], servings: 1,
    baseNutrition: { calories: 400, proteinGrams: 2, carbsGrams: 80, fatGrams: 5 },
    ingredients: [{ name: 'Riz', qty: 200, unit: 'g' }] };
  var flags = RI.assessPortions(recipe);
  hasFlag(flags, 'LOW_PROTEIN_PORTION', 'doit détecter protéines insuffisantes');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ANALYZE RECIPE
// ─────────────────────────────────────────────────────────────────────────────
suite('ANALYZE — analyzeRecipe');

test('analyzeRecipe retourne structure complète', function() {
  var r = RI.analyzeRecipe(PERFECT_LUNCH);
  ok(r.id,            'id manquant');
  ok(r.name,          'name manquant');
  ok(typeof r.premiumScore === 'number', 'premiumScore doit être un nombre');
  ok(['A','B','C','D'].indexOf(r.grade) >= 0, 'grade invalide: ' + r.grade);
  ok(Array.isArray(r.coherenceFlags), 'coherenceFlags doit être un tableau');
  ok(Array.isArray(r.portionFlags),   'portionFlags doit être un tableau');
  ok(r.scores,        'scores manquant');
});

test('Bonne recette : grade A ou B', function() {
  var r = RI.analyzeRecipe(PERFECT_LUNCH);
  ok(r.grade === 'A' || r.grade === 'B', 'recette saine doit avoir grade A ou B, got ' + r.grade);
});

test('Salade verte insuffisante : grade C ou D', function() {
  var r = RI.analyzeRecipe(LOW_PROTEIN);
  ok(r.grade === 'C' || r.grade === 'D', 'recette faible doit avoir grade C ou D, got ' + r.grade);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. ANALYZE DIVERSITY
// ─────────────────────────────────────────────────────────────────────────────
suite('DIVERSITY — analyzeDiversity');

var DB = RE.RECIPES_DB;

test('analyzeDiversity retourne structure correcte', function() {
  var d = RI.analyzeDiversity(DB);
  ok(typeof d.totalAnalyzed === 'number',    'totalAnalyzed manquant');
  ok(typeof d.diversityScore === 'number',   'diversityScore manquant');
  ok(Array.isArray(d.topIngredients),        'topIngredients doit être un tableau');
  ok(typeof d.proteinSourceDistribution === 'object', 'proteinSourceDistribution manquant');
  ok(typeof d.mealTypeDistribution === 'object',      'mealTypeDistribution manquant');
});

test('diversityScore entre 0 et 100', function() {
  var d = RI.analyzeDiversity(DB);
  ok(d.diversityScore >= 0 && d.diversityScore <= 100, 'score hors [0,100]: ' + d.diversityScore);
});

test('totalAnalyzed > 400 recettes R-format', function() {
  var d = RI.analyzeDiversity(DB);
  ok(d.totalAnalyzed > 400, 'doit avoir > 400 recettes R-format, got ' + d.totalAnalyzed);
});

test('Sources protéiques détectées : ≥ 3 catégories', function() {
  var d = RI.analyzeDiversity(DB);
  var cats = Object.keys(d.proteinSourceDistribution);
  ok(cats.length >= 3, 'doit avoir ≥ 3 catégories protéiques, got ' + cats.join(', '));
});

test('analyzeDiversity sur DB vide : ne crashe pas', function() {
  var d = RI.analyzeDiversity([]);
  eq(d.totalAnalyzed, 0, 'totalAnalyzed doit être 0');
  eq(d.diversityScore, 100, 'diversityScore doit être 100 pour DB vide');
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. ANALYZE DATABASE
// ─────────────────────────────────────────────────────────────────────────────
suite('DATABASE — analyzeDatabase');

test('analyzeDatabase ne crashe pas sur la DB complète', function() {
  var a = RI.analyzeDatabase(DB);
  ok(a, 'doit retourner un résultat');
  ok(typeof a.analyzed === 'number', 'analyzed doit être un nombre');
});

test('avgPremiumScore entre 40 et 90 (réaliste)', function() {
  var a = RI.analyzeDatabase(DB);
  ok(a.avgPremiumScore >= 40, 'score moyen ≥ 40, got ' + a.avgPremiumScore);
  ok(a.avgPremiumScore <= 90, 'score moyen ≤ 90 (pas tous parfaits), got ' + a.avgPremiumScore);
});

test('topRecipes a un score > bottomRecipes', function() {
  var a = RI.analyzeDatabase(DB);
  ok(a.topRecipes.length > 0,    'topRecipes non vide');
  ok(a.bottomRecipes.length > 0, 'bottomRecipes non vide');
  var topMin    = Math.min.apply(null, a.topRecipes.map(function(r){return r.score;}));
  var bottomMax = Math.max.apply(null, a.bottomRecipes.map(function(r){return r.score;}));
  ok(topMin >= bottomMax, 'top score min (' + topMin + ') doit être ≥ bottom max (' + bottomMax + ')');
});

test('gradeDistribution : somme = analyzed', function() {
  var a = RI.analyzeDatabase(DB);
  var g = a.gradeDistribution;
  eq(g.A + g.B + g.C + g.D, a.analyzed, 'somme grades doit égaler analyzed');
});

test('Majorité des recettes en grade A ou B (DB de qualité)', function() {
  var a = RI.analyzeDatabase(DB);
  var g = a.gradeDistribution;
  var top = g.A + g.B;
  ok(top >= a.analyzed * 0.55, 'au moins 55% A/B attendu, got ' + top + '/' + a.analyzed);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. GENERATE REPORT
// ─────────────────────────────────────────────────────────────────────────────
suite('RAPPORT — generateIntelligenceReport');

test('generateIntelligenceReport retourne une chaîne non vide', function() {
  var a   = RI.analyzeDatabase(DB.slice(0, 20));
  var rep = RI.generateIntelligenceReport(a);
  ok(typeof rep === 'string' && rep.length > 100, 'rapport doit être une chaîne non triviale');
});

test('Rapport contient les sections clés', function() {
  var a   = RI.analyzeDatabase(DB.slice(0, 20));
  var rep = RI.generateIntelligenceReport(a);
  ok(rep.indexOf('RECIPE INTELLIGENCE') >= 0, 'titre manquant');
  ok(rep.indexOf('Score premium') >= 0,       'score manquant');
  ok(rep.indexOf('RECOMMANDATIONS') >= 0,     'section recommandations manquante');
});

// ─────────────────────────────────────────────────────────────────────────────
// RÉSULTAT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────');
console.log('Résultat: ' + passed + ' passés, ' + failed + ' échoués');
if (failed > 0) {
  console.error('\x1b[31m✗ ' + failed + ' test(s) en échec\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m✓ Tous les ' + passed + ' tests passent\x1b[0m');
}
