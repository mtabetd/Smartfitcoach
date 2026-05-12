'use strict';

// ─── TESTS RECIPE INTEGRITY SYSTEM ───────────────────────────────────────────
// Couvre : RecipeRegistry, RecipeValidator, pipeline QA, snapshots.
// Usage  : node tests/unit-recipe-integrity.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

// ── BROWSER MOCK ──────────────────────────────────────────────────────────────
global.window = global;
global.localStorage = {
  _store: {},
  getItem:    function(k)    { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem:    function(k, v) { this._store[k] = String(v); },
  removeItem: function(k)    { delete this._store[k]; },
  get length() { return Object.keys(this._store).length; },
  key:        function(i)    { return Object.keys(this._store)[i] || null; }
};
var _fakeEl = function() {
  return { style: {}, appendChild: function() {}, addEventListener: function() {},
    removeEventListener: function() {}, innerHTML: '', textContent: '',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; } } };
};
global.document = {
  createElement: _fakeEl, getElementById: function() { return null; },
  querySelector: function() { return null; }, querySelectorAll: function() { return []; },
  addEventListener: function() {}, removeEventListener: function() {},
  body: _fakeEl(), head: _fakeEl()
};
Object.defineProperty(global, 'navigator', {
  value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true
});
global.fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };
global.isEnglish = function() { return false; };

// ── LOADER ────────────────────────────────────────────────────────────────────
function loadFile(relPath) {
  var code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  try { vm.runInThisContext(code, { filename: relPath }); }
  catch(e) { console.error('[FATAL] ' + relPath + ' : ' + e.message); process.exit(1); }
}

loadFile('app/recipe-registry.js');
loadFile('app/recipe-engine.js');
loadFile('app/recipe-validator.js');

var RRg = window.RecipeRegistry;
var RE  = window.RecipeEngine;
var RV  = window.RecipeValidator;

if (!RRg) { console.error('[FATAL] RecipeRegistry not exported'); process.exit(1); }
if (!RE)  { console.error('[FATAL] RecipeEngine not exported');   process.exit(1); }
if (!RV)  { console.error('[FATAL] RecipeValidator not exported'); process.exit(1); }

// ── RUNNER ────────────────────────────────────────────────────────────────────
var passed = 0, failed = 0;
function suite(name) { console.log('\n' + name); }
function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name); console.error('    ', e.message); failed++; }
}
function ok(v, msg)   { if (!v)       throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function eq(a, b, msg){ if (a !== b)  throw new Error((msg || '') + ' — got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
function hasErr(result, code, msg) {
  var found = result.errors.some(function(e) { return !code || e.code === code; });
  if (!found) throw new Error((msg || 'expected error') + (code ? ' [' + code + ']' : '') + ' — got: ' + JSON.stringify(result.errors));
}
function hasWarn(result, code, msg) {
  var found = result.issues.some(function(i) { return i.severity === 'warn' && (!code || i.code === code); });
  if (!found) throw new Error((msg || 'expected warning') + (code ? ' [' + code + ']' : '') + ' — got: ' + JSON.stringify(result.warnings));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. REGISTRY — exports et structure
// ─────────────────────────────────────────────────────────────────────────────
suite('REGISTRY — structure et exports');

test('INGREDIENT_REGISTRY exporté', function() {
  ok(RRg.INGREDIENT_REGISTRY, 'INGREDIENT_REGISTRY doit être défini');
  ok(typeof RRg.INGREDIENT_REGISTRY === 'object', 'doit être un objet');
});

test('UNIT_TYPES et CATEGORIES exportés', function() {
  ok(RRg.UNIT_TYPES.WEIGHT,   'UNIT_TYPES.WEIGHT manquant');
  ok(RRg.UNIT_TYPES.COUNT,    'UNIT_TYPES.COUNT manquant');
  ok(RRg.CATEGORIES.PROTEIN,  'CATEGORIES.PROTEIN manquant');
  ok(RRg.CATEGORIES.VEGETABLE,'CATEGORIES.VEGETABLE manquant');
});

test('Registry contient ≥ 20 ingrédients canoniques', function() {
  var count = Object.keys(RRg.INGREDIENT_REGISTRY).length;
  ok(count >= 20, 'Registry doit avoir ≥ 20 entrées, a ' + count);
});

test('Chaque entrée possède les champs obligatoires', function() {
  var missing = [];
  Object.keys(RRg.INGREDIENT_REGISTRY).forEach(function(id) {
    var e = RRg.INGREDIENT_REGISTRY[id];
    if (!e.id)       missing.push(id + ': id');
    if (!e.canonical) missing.push(id + ': canonical');
    if (!e.aliases || !e.aliases.length) missing.push(id + ': aliases');
    if (!e.unit)     missing.push(id + ': unit');
    if (!e.category) missing.push(id + ': category');
  });
  if (missing.length) throw new Error('Champs manquants: ' + missing.slice(0, 5).join(', '));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. REGISTRY — lookupIngredient
// ─────────────────────────────────────────────────────────────────────────────
suite('REGISTRY — lookupIngredient');

test('Lookup par alias exact : "œuf" → id oeuf', function() {
  var spec = RRg.lookupIngredient('œuf');
  ok(spec, 'doit trouver l\'ingrédient');
  eq(spec.id, 'oeuf', 'id doit être oeuf');
});

test('Lookup insensible à la casse : "AVOCAT" → id avocat', function() {
  var spec = RRg.lookupIngredient('AVOCAT');
  ok(spec && spec.id === 'avocat', 'doit trouver avocat');
});

test('Lookup sans ligature : "oeuf entier" → id oeuf', function() {
  var spec = RRg.lookupIngredient('oeuf entier');
  ok(spec && spec.id === 'oeuf', 'oeuf entier → oeuf');
});

test('Lookup alias complet : "Blanc de poulet" → blanc-poulet', function() {
  var spec = RRg.lookupIngredient('Blanc de poulet');
  ok(spec && spec.id === 'blanc-poulet', 'doit trouver blanc-poulet');
});

test('Lookup ingrédient inconnu retourne null', function() {
  var spec = RRg.lookupIngredient('Ingrédient XYZ inconnu 99999');
  eq(spec, null, 'doit retourner null');
});

test('Lookup null/undefined ne crashe pas', function() {
  eq(RRg.lookupIngredient(null),      null, 'null → null');
  eq(RRg.lookupIngredient(undefined), null, 'undefined → null');
  eq(RRg.lookupIngredient(''),        null, 'vide → null');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. REGISTRY — validateIngredientSpec
// ─────────────────────────────────────────────────────────────────────────────
suite('REGISTRY — validateIngredientSpec');

test('Œuf en pce : valide', function() {
  var r = RRg.validateIngredientSpec('Œuf', 2, 'pce');
  ok(r.known, 'doit être connu');
  ok(r.valid, 'doit être valide');
  eq(r.errors.length, 0, 'aucune erreur');
});

test('Œuf en g : erreur unité interdite', function() {
  var r = RRg.validateIngredientSpec('Œuf', 100, 'g');
  ok(r.known, 'doit être connu');
  ok(!r.valid, 'doit être invalide');
  ok(r.errors.length > 0, 'doit avoir une erreur');
});

test('Huile d\'olive 10ml : valide', function() {
  var r = RRg.validateIngredientSpec("Huile d'olive", 10, 'ml');
  ok(r.known && r.valid, 'doit être valide');
});

test('Ingrédient inconnu : known=false, valid=true (pas bloquant)', function() {
  var r = RRg.validateIngredientSpec('Épice exotique inconnue', 5, 'g');
  eq(r.known, false, 'doit être inconnu');
  ok(r.valid, 'doit être valide (pas bloquant pour les inconnus)');
});

test('Avocat 5g : warning qty trop faible', function() {
  var r = RRg.validateIngredientSpec('Avocat', 5, 'g');
  ok(r.known, 'doit être connu');
  ok(r.warnings.length > 0, 'doit avoir un warning qty');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. VALIDATOR — structure
// ─────────────────────────────────────────────────────────────────────────────
suite('VALIDATOR — validateStructure');

test('Recette R-format complète : pas d\'erreur structurelle', function() {
  var r = RV.validateStructure({
    id: 'R999', name: 'Test', baseNutrition: { calories: 400, proteinGrams: 30, carbsGrams: 40, fatGrams: 10 },
    ingredients: [{ name: 'Poulet', qty: 100, unit: 'g' }],
    steps: ['Cuire'], mealTypes: ['lunch'], servings: 1
  });
  var errors = r.filter(function(i) { return i.severity === 'error'; });
  eq(errors.length, 0, 'aucune erreur structurelle attendue');
});

test('Recette sans name : erreur STRUCT_NO_NAME', function() {
  var r = RV.validateStructure({
    id: 'R998', baseNutrition: { calories: 400 },
    ingredients: [], servings: 1
  });
  ok(r.some(function(i) { return i.code === 'STRUCT_NO_NAME'; }), 'erreur STRUCT_NO_NAME attendue');
});

test('Recette sans id : erreur STRUCT_NO_ID', function() {
  var r = RV.validateStructure({ name: 'Orphelin' });
  ok(r.some(function(i) { return i.code === 'STRUCT_NO_ID'; }), 'erreur STRUCT_NO_ID attendue');
});

test('Recette servings=0 : erreur STRUCT_BAD_SERVINGS', function() {
  var r = RV.validateStructure({
    id: 'R997', name: 'Test', baseNutrition: { calories: 400 },
    ingredients: [], steps: ['x'], mealTypes: ['lunch'], servings: 0
  });
  ok(r.some(function(i) { return i.code === 'STRUCT_BAD_SERVINGS'; }), 'erreur STRUCT_BAD_SERVINGS attendue');
});

test('L-compact valide : pas d\'erreur structurelle', function() {
  var r = RV.validateStructure({
    _id: 'L999', n: 'Salade', k: 350, p: 20, g: 40, l: 8,
    i: 'Laitue 100g, tomate 80g'
  });
  var errors = r.filter(function(i) { return i.severity === 'error'; });
  eq(errors.length, 0, 'aucune erreur pour L-compact valide');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. VALIDATOR — nutrition
// ─────────────────────────────────────────────────────────────────────────────
suite('VALIDATOR — validateNutrition');

test('Macros cohérentes : pas de warning', function() {
  // P=30, G=40, L=10 → 30×4 + 40×4 + 10×9 = 120+160+90 = 370 ≈ 370
  var r = RV.validateNutrition({
    id: 'R1', servings: 1,
    baseNutrition: { calories: 370, proteinGrams: 30, carbsGrams: 40, fatGrams: 10 }
  });
  ok(!r.some(function(i) { return i.code === 'NUTR_MACRO_INCOHERENT'; }), 'pas de warning macro incohérente');
});

test('Macros incohérentes : warning NUTR_MACRO_INCOHERENT', function() {
  // P=0, G=0, L=0 → 0 kcal calculé vs 400 déclaré → >15%
  var r = RV.validateNutrition({
    id: 'R2', servings: 1,
    baseNutrition: { calories: 400, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
  });
  ok(r.some(function(i) { return i.code === 'NUTR_MACRO_INCOHERENT'; }), 'warning macro incohérente attendu');
});

test('Calories = 0 : erreur NUTR_ZERO_CAL', function() {
  var r = RV.validateNutrition({
    id: 'R3', servings: 1,
    baseNutrition: { calories: 0, proteinGrams: 10, carbsGrams: 20, fatGrams: 5 }
  });
  ok(r.some(function(i) { return i.code === 'NUTR_ZERO_CAL'; }), 'erreur NUTR_ZERO_CAL attendue');
});

test('Macros négatives : erreur NUTR_NEGATIVE_MACRO', function() {
  var r = RV.validateNutrition({
    id: 'R4', servings: 1,
    baseNutrition: { calories: 400, proteinGrams: -5, carbsGrams: 40, fatGrams: 10 }
  });
  ok(r.some(function(i) { return i.code === 'NUTR_NEGATIVE_MACRO'; }), 'erreur NUTR_NEGATIVE_MACRO attendue');
});

test('Calories /portion trop faible : warning NUTR_CAL_TOO_LOW', function() {
  var r = RV.validateNutrition({
    id: 'R5', servings: 1,
    baseNutrition: { calories: 20, proteinGrams: 2, carbsGrams: 3, fatGrams: 0.5 }
  });
  ok(r.some(function(i) { return i.code === 'NUTR_CAL_TOO_LOW'; }), 'warning NUTR_CAL_TOO_LOW attendu');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. VALIDATOR — ingrédients
// ─────────────────────────────────────────────────────────────────────────────
suite('VALIDATOR — validateIngredients');

test('Unité "pièce" : erreur ING_FORBIDDEN_UNIT', function() {
  var r = RV.validateIngredients({
    id: 'R10',
    ingredients: [{ name: 'Œuf', qty: 2, unit: 'pièce' }]
  });
  ok(r.some(function(i) { return i.code === 'ING_FORBIDDEN_UNIT'; }), 'erreur ING_FORBIDDEN_UNIT attendue');
});

test('Unité "pce" : valide', function() {
  var r = RV.validateIngredients({
    id: 'R11',
    ingredients: [{ name: 'Œuf', qty: 2, unit: 'pce' }]
  });
  ok(!r.some(function(i) { return i.severity === 'error'; }), 'pas d\'erreur pour pce');
});

test('Qty négative : erreur ING_NEGATIVE_QTY', function() {
  var r = RV.validateIngredients({
    id: 'R12',
    ingredients: [{ name: 'Poulet', qty: -50, unit: 'g' }]
  });
  ok(r.some(function(i) { return i.code === 'ING_NEGATIVE_QTY'; }), 'erreur ING_NEGATIVE_QTY attendue');
});

test('Name vide : erreur ING_EMPTY_NAME', function() {
  var r = RV.validateIngredients({
    id: 'R13',
    ingredients: [{ name: '', qty: 50, unit: 'g' }]
  });
  ok(r.some(function(i) { return i.code === 'ING_EMPTY_NAME'; }), 'erreur ING_EMPTY_NAME attendue');
});

test('Ingrédient dupliqué : warning ING_DUPLICATE', function() {
  var r = RV.validateIngredients({
    id: 'R14',
    ingredients: [
      { name: 'Poulet', qty: 100, unit: 'g' },
      { name: 'Poulet', qty: 50,  unit: 'g' }
    ]
  });
  ok(r.some(function(i) { return i.code === 'ING_DUPLICATE'; }), 'warning ING_DUPLICATE attendu');
});

test('Unité invalide : erreur ING_INVALID_UNIT', function() {
  var r = RV.validateIngredients({
    id: 'R15',
    ingredients: [{ name: 'Sel', qty: 2, unit: 'cuillere' }]
  });
  ok(r.some(function(i) { return i.code === 'ING_INVALID_UNIT'; }), 'erreur ING_INVALID_UNIT attendue');
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. VALIDATOR — UX
// ─────────────────────────────────────────────────────────────────────────────
suite('VALIDATOR — validateUX');

test('Œuf en grammes : erreur UX_EGG_IN_GRAMS', function() {
  var r = RV.validateUX({
    id: 'R20',
    ingredients: [{ name: 'Œuf', qty: 150, unit: 'g' }]
  });
  ok(r.some(function(i) { return i.code === 'UX_EGG_IN_GRAMS'; }), 'erreur UX_EGG_IN_GRAMS attendue');
});

test('oeuf sans ligature : warning UX_LIGATURE', function() {
  var r = RV.validateUX({
    id: 'R21',
    ingredients: [{ name: 'oeuf', qty: 2, unit: 'pce' }]
  });
  ok(r.some(function(i) { return i.code === 'UX_LIGATURE'; }), 'warning UX_LIGATURE attendu');
});

test('Œuf en pce avec quantité entière : pas d\'UX error', function() {
  var r = RV.validateUX({
    id: 'R22',
    ingredients: [{ name: 'Œuf', qty: 3, unit: 'pce' }]
  });
  ok(!r.some(function(i) { return i.severity === 'error' && i.code === 'UX_EGG_IN_GRAMS'; }), 'pas d\'erreur');
});

test('Huile 1ml : warning UX_TINY_OIL', function() {
  var r = RV.validateUX({
    id: 'R23',
    ingredients: [{ name: "Huile d'olive", qty: 1, unit: 'ml' }]
  });
  ok(r.some(function(i) { return i.code === 'UX_TINY_OIL'; }), 'warning UX_TINY_OIL attendu');
});

test('Fraction pce habituelle 0.5 : pas de warning weird fraction', function() {
  var r = RV.validateUX({
    id: 'R24',
    ingredients: [{ name: 'Avocat', qty: 0.5, unit: 'pce' }]
  });
  ok(!r.some(function(i) { return i.code === 'UX_WEIRD_FRACTION'; }), 'pas de warning pour 0.5 pce');
});

test('Fraction pce 0.73 : warning UX_WEIRD_FRACTION', function() {
  var r = RV.validateUX({
    id: 'R25',
    ingredients: [{ name: 'Tomate', qty: 0.73, unit: 'pce' }]
  });
  ok(r.some(function(i) { return i.code === 'UX_WEIRD_FRACTION'; }), 'warning UX_WEIRD_FRACTION attendu');
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. VALIDATOR — AUTO-FIX
// ─────────────────────────────────────────────────────────────────────────────
suite('VALIDATOR — autoFix');

test('autoFix corrige unit pièce → pce', function() {
  var recipe = { id: 'R30', ingredients: [{ name: 'Tomate', qty: 1, unit: 'pièce' }] };
  var result = RV.autoFix(recipe);
  eq(result.recipe.ingredients[0].unit, 'pce', 'pièce → pce');
  ok(result.changes.length > 0, 'doit avoir des changements');
});

test('autoFix corrige unit pièces → pce', function() {
  var recipe = { id: 'R31', ingredients: [{ name: 'Tomate', qty: 2, unit: 'pièces' }] };
  var result = RV.autoFix(recipe);
  eq(result.recipe.ingredients[0].unit, 'pce', 'pièces → pce');
});

test('autoFix corrige pincées → pincee', function() {
  var recipe = { id: 'R32', ingredients: [{ name: 'Sel', qty: 1, unit: 'pincées' }] };
  var result = RV.autoFix(recipe);
  eq(result.recipe.ingredients[0].unit, 'pincee', 'pincées → pincee');
});

test('autoFix corrige oeuf → Œuf', function() {
  var recipe = { id: 'R33', ingredients: [{ name: 'oeuf', qty: 2, unit: 'pce' }] };
  var result = RV.autoFix(recipe);
  eq(result.recipe.ingredients[0].name, 'Œuf', 'oeuf → Œuf');
});

test('autoFix corrige oeufs → Œufs', function() {
  var recipe = { id: 'R34', ingredients: [{ name: 'oeufs', qty: 3, unit: 'pce' }] };
  var result = RV.autoFix(recipe);
  eq(result.recipe.ingredients[0].name, 'Œufs', 'oeufs → Œufs');
});

test('autoFix : recette propre ne génère aucun changement', function() {
  var recipe = { id: 'R35', ingredients: [{ name: 'Poulet', qty: 150, unit: 'g' }] };
  var result = RV.autoFix(recipe);
  eq(result.changes.length, 0, 'aucun changement pour recette propre');
});

test('autoFix ne modifie pas la recette originale (immutabilité)', function() {
  var recipe = { id: 'R36', ingredients: [{ name: 'oeuf', qty: 2, unit: 'pièce' }] };
  RV.autoFix(recipe);
  eq(recipe.ingredients[0].name, 'oeuf',   'original name non modifié');
  eq(recipe.ingredients[0].unit, 'pièce',  'original unit non modifié');
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. VALIDATOR — validateRecipe (agrégé)
// ─────────────────────────────────────────────────────────────────────────────
suite('VALIDATOR — validateRecipe (pipeline complet)');

test('Recette parfaite : valid=true, score=100', function() {
  var r = RV.validateRecipe({
    id: 'R40', name: 'Poulet riz parfait', servings: 1,
    baseNutrition: { calories: 370, proteinGrams: 35, carbsGrams: 35, fatGrams: 5 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 150, unit: 'g' },
      { name: 'Riz',             qty: 80,  unit: 'g' },
      { name: "Huile d'olive",   qty: 5,   unit: 'ml' }
    ],
    steps: ['Cuire le poulet', 'Cuire le riz'],
    mealTypes: ['lunch']
  });
  ok(r.valid, 'doit être valide');
  ok(r.score > 80, 'score doit être > 80, got ' + r.score);
});

test('Recette avec erreurs : valid=false', function() {
  var r = RV.validateRecipe({
    id: 'R41', name: 'Recette cassée', servings: 0,
    baseNutrition: { calories: -10, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
    ingredients: [{ name: '', qty: -5, unit: 'pièce' }],
    steps: [], mealTypes: []
  });
  ok(!r.valid, 'doit être invalide');
  ok(r.errors.length > 0, 'doit avoir des erreurs');
  ok(r.score < 100, 'score doit être < 100');
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. VALIDATOR — validateDatabase sur RECIPES_DB réelle
// ─────────────────────────────────────────────────────────────────────────────
suite('VALIDATOR — validateDatabase (DB production)');

var DB = RE.RECIPES_DB;

test('validateDatabase ne crashe pas sur la DB complète', function() {
  var v = RV.validateDatabase(DB);
  ok(v, 'doit retourner un résultat');
  ok(typeof v.totalRecipes === 'number', 'totalRecipes doit être un nombre');
});

test('DB production : zéro erreur critique', function() {
  var v = RV.validateDatabase(DB);
  if (v.totalErrors > 0) {
    var sample = v.results.filter(function(r) { return r.errors.length > 0; })
      .slice(0, 3).map(function(r) { return r.id + ': ' + r.errors[0].message; }).join('; ');
    throw new Error(v.totalErrors + ' erreur(s) critique(s) en DB — exemples: ' + sample);
  }
});

test('DB production : tous les R-format ont baseNutrition > 0', function() {
  var bad = DB.filter(function(r) {
    return /^R\d+$/.test(r.id || '') &&
           (!r.baseNutrition || r.baseNutrition.calories <= 0);
  });
  if (bad.length > 0) throw new Error(bad.length + ' recettes R sans calories: ' + bad.slice(0,3).map(function(r){return r.id;}).join(', '));
});

test('DB production : aucun unit "pièce" ou "pièces"', function() {
  var found = [];
  DB.forEach(function(r) {
    (r.ingredients || []).forEach(function(ing) {
      if (ing.unit === 'pièce' || ing.unit === 'pièces' || ing.unit === 'piece') {
        found.push((r.id || r._id) + ': ' + ing.name + '=' + ing.unit);
      }
    });
  });
  if (found.length > 0) throw new Error('unit pièce trouvé: ' + found.slice(0,5).join(', '));
});

test('DB production : aucun name "Oeuf" sans ligature', function() {
  var found = [];
  DB.forEach(function(r) {
    (r.ingredients || []).forEach(function(ing) {
      if (ing.name && /^oeuf/i.test(ing.name) && !/^[Œœ]/.test(ing.name)) {
        found.push((r.id || r._id) + ': ' + ing.name);
      }
    });
  });
  if (found.length > 0) throw new Error('oeuf sans ligature: ' + found.slice(0,5).join(', '));
});

test('generateReport retourne une chaîne non vide', function() {
  var v   = RV.validateDatabase(DB.slice(0, 10));
  var rep = RV.generateReport(v);
  ok(typeof rep === 'string' && rep.length > 50, 'rapport doit être une chaîne non triviale');
  ok(rep.indexOf('RECIPE INTEGRITY') >= 0, 'rapport doit contenir le titre');
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. SNAPSHOT REGRESSION
// ─────────────────────────────────────────────────────────────────────────────
suite('SNAPSHOT — régression recettes');

var SNAP_PATH = path.join(__dirname, 'snapshots', 'recipe-snapshot.json');

test('Snapshot existant est lisible et structuré', function() {
  if (!fs.existsSync(SNAP_PATH)) return; // pas de snapshot encore → skip
  var snap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
  ok(typeof snap.totalRecipes === 'number', 'snap.totalRecipes doit être un nombre');
  ok(typeof snap.rFormatCount === 'number', 'snap.rFormatCount doit être un nombre');
  ok(snap.generated, 'snap.generated doit exister');
});

test('Snapshot totalRecipes cohérent avec DB actuelle (±50)', function() {
  if (!fs.existsSync(SNAP_PATH)) return;
  var snap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
  var diff = Math.abs(snap.totalRecipes - DB.length);
  ok(diff <= 50, 'DB a ' + DB.length + ' recettes vs snapshot ' + snap.totalRecipes + ' (diff=' + diff + ')');
});

// ─────────────────────────────────────────────────────────────────────────────
// RÉSULTAT FINAL
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────');
console.log('Résultat: ' + passed + ' passés, ' + failed + ' échoués');
if (failed > 0) {
  console.error('\x1b[31m✗ ' + failed + ' test(s) en échec\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m✓ Tous les ' + passed + ' tests passent\x1b[0m');
}
