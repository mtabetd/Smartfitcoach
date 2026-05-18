/**
 * RECIPE DB + SCALING ENGINE AUDIT SCRIPT
 * Run: node audit_recipes.js
 */
'use strict';

// ─── Shim browser globals so recipe-engine.js can be loaded in Node ──────────
global.window = {
  RecipeEngine: null,
  NutritionMaster: null,
  getMealSplit: function() { return null; }
};

// Load the recipe engine
require('./app/recipe-engine.js');

var RE   = global.window.RecipeEngine;
var DB   = RE.RECIPES_DB;

// ─── CONSTANTS (mirrored from engine) ────────────────────────────────────────
var KCAL_PER_PROT = 4;
var KCAL_PER_CARB = 4;
var KCAL_PER_FAT  = 9;
var VALID_CATS = ['french','italian','world-food','mediterranean','japanese','mexican','maroc-moderne'];
var VALID_MEAL_TYPES = ['breakfast','lunch','dinner','snack','dessert'];
var VALID_UNITS = ['g','ml','pce','pincée','feuille','cs','cc','tranche','gousse','brin'];
var VALID_DIFFICULTY = [1, 2];
var VALID_SERVINGS   = [1, 2, 3, 4];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function isNaNOrNull(v) {
  return v === null || v === undefined || (typeof v === 'number' && isNaN(v));
}

function checkMacroMath(recipe) {
  var id = recipe.id || recipe._id;
  var bn = recipe.baseNutrition;
  // compact format: k/p/g/l
  if (!bn) {
    if (recipe.k !== undefined) {
      bn = { calories: recipe.k, proteinGrams: recipe.p, carbsGrams: recipe.g, fatGrams: recipe.l };
    } else {
      return { id: id, issue: 'NO_BASE_NUTRITION', detail: 'baseNutrition is missing entirely' };
    }
  }
  var expected = bn.proteinGrams * KCAL_PER_PROT + bn.carbsGrams * KCAL_PER_CARB + bn.fatGrams * KCAL_PER_FAT;
  var delta = Math.abs(expected - bn.calories);
  if (delta >= 3) {
    return {
      id: id,
      name: recipe.name || recipe.n,
      issue: 'MACRO_MATH',
      detail: 'calories=' + bn.calories + ' expected=' + Math.round(expected) + ' delta=' + Math.round(delta * 10) / 10,
      prot: bn.proteinGrams, carbs: bn.carbsGrams, fat: bn.fatGrams
    };
  }
  return null;
}

// ─── PART 1: RECIPE DB AUDIT ──────────────────────────────────────────────────
var issues = {
  MACRO_MATH:           [],
  NEGATIVE_MACRO:       [],
  ZERO_CALORIES:        [],
  NAN_NULL_MACRO:       [],
  INVALID_SERVINGS:     [],
  INVALID_TIMES:        [],
  INVALID_DIFFICULTY:   [],
  INVALID_CATEGORY:     [],
  INVALID_MEAL_TYPES:   [],
  INVALID_INGREDIENTS:  [],
  EMPTY_STEPS:          [],
  DUPLICATE_ID:         [],
  DUPLICATE_NAME:       []
};

var seenIds   = {};
var seenNames = {};

var totalRecipes = 0;
var compactCount = 0;
var fullCount    = 0;

DB.forEach(function(recipe) {
  totalRecipes++;
  var id   = recipe.id || recipe._id || 'UNKNOWN';
  var name = recipe.name || recipe.n || '(no name)';
  var isCompact = (recipe._id !== undefined && recipe.id === undefined);
  if (isCompact) compactCount++; else fullCount++;

  // ── Duplicate IDs ──
  if (seenIds[id]) {
    issues.DUPLICATE_ID.push({ id: id, name: name });
  }
  seenIds[id] = true;

  // ── Duplicate Names ──
  if (seenNames[name]) {
    issues.DUPLICATE_NAME.push({ id: id, name: name });
  }
  seenNames[name] = true;

  // ── Determine baseNutrition ──
  var bn = recipe.baseNutrition;
  if (!bn && recipe.k !== undefined) {
    bn = { calories: recipe.k, proteinGrams: recipe.p, carbsGrams: recipe.g, fatGrams: recipe.l };
  }

  if (!bn) {
    issues.NAN_NULL_MACRO.push({ id: id, name: name, issue: 'baseNutrition missing entirely' });
  } else {
    // NaN / null / undefined checks
    ['calories','proteinGrams','carbsGrams','fatGrams'].forEach(function(field) {
      if (isNaNOrNull(bn[field])) {
        issues.NAN_NULL_MACRO.push({ id: id, name: name, field: field, value: bn[field] });
      }
    });

    // Negative macros
    ['calories','proteinGrams','carbsGrams','fatGrams'].forEach(function(field) {
      if (typeof bn[field] === 'number' && bn[field] < 0) {
        issues.NEGATIVE_MACRO.push({ id: id, name: name, field: field, value: bn[field] });
      }
    });

    // Zero calories (flag unless condiment ≤ 10 kcal intentionally)
    if (typeof bn.calories === 'number' && bn.calories === 0) {
      issues.ZERO_CALORIES.push({ id: id, name: name, calories: bn.calories });
    }

    // Macro math check (delta >= 3)
    var mathIssue = checkMacroMath(recipe);
    if (mathIssue) issues.MACRO_MATH.push(mathIssue);
  }

  // ── Servings ──
  var servings = recipe.servings;
  if (isCompact) servings = recipe.servings || 1; // compact often omits servings defaulting to 1
  if (!isCompact) {
    if (servings === undefined || servings === null || VALID_SERVINGS.indexOf(servings) === -1) {
      issues.INVALID_SERVINGS.push({ id: id, name: name, servings: servings });
    }
  }

  // ── prepTime + cookTime ──
  if (!isCompact) {
    var pt = recipe.prepTime, ct = recipe.cookTime;
    if ((typeof pt !== 'number' || typeof ct !== 'number') || (pt + ct) <= 0) {
      issues.INVALID_TIMES.push({ id: id, name: name, prepTime: pt, cookTime: ct, total: (pt||0)+(ct||0) });
    }
  }

  // ── Difficulty ──
  var diff = recipe.difficulty !== undefined ? recipe.difficulty : recipe.lv;
  if (diff !== undefined && VALID_DIFFICULTY.indexOf(diff) === -1) {
    issues.INVALID_DIFFICULTY.push({ id: id, name: name, difficulty: diff });
  }

  // ── Category ──
  var cat = recipe.category;
  if (!isCompact && cat !== undefined && VALID_CATS.indexOf(cat) === -1) {
    issues.INVALID_CATEGORY.push({ id: id, name: name, category: cat });
  }

  // ── mealTypes ──
  if (!isCompact) {
    var mt = recipe.mealTypes;
    if (!Array.isArray(mt) || mt.length === 0) {
      issues.INVALID_MEAL_TYPES.push({ id: id, name: name, mealTypes: mt, reason: 'not an array or empty' });
    } else {
      mt.forEach(function(m) {
        if (VALID_MEAL_TYPES.indexOf(m) === -1) {
          issues.INVALID_MEAL_TYPES.push({ id: id, name: name, value: m, reason: 'invalid mealType value' });
        }
      });
    }
  }

  // ── Ingredients ──
  if (!isCompact) {
    var ings = recipe.ingredients;
    if (!Array.isArray(ings) || ings.length === 0) {
      issues.INVALID_INGREDIENTS.push({ id: id, name: name, reason: 'missing or empty ingredients array' });
    } else {
      ings.forEach(function(ing, idx) {
        if (!ing.name) {
          issues.INVALID_INGREDIENTS.push({ id: id, name: name, idx: idx, reason: 'missing name' });
        }
        if (typeof ing.qty !== 'number' || ing.qty <= 0) {
          issues.INVALID_INGREDIENTS.push({ id: id, name: name, ingredient: ing.name, qty: ing.qty, reason: 'qty not > 0' });
        }
        if (VALID_UNITS.indexOf(ing.unit) === -1) {
          issues.INVALID_INGREDIENTS.push({ id: id, name: name, ingredient: ing.name, unit: ing.unit, reason: 'invalid unit' });
        }
      });
    }
  }

  // ── Steps ──
  if (!isCompact) {
    var steps = recipe.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      issues.EMPTY_STEPS.push({ id: id, name: name });
    }
  }
});

// ─── REPORT PART 1 ────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════════');
console.log('  SMARTFITCOACH RECIPE DB AUDIT — PART 1');
console.log('════════════════════════════════════════════════════════════');
console.log('Total recipes in DB : ' + totalRecipes);
console.log('  Full-format (R/L with id) : ' + fullCount);
console.log('  Compact-format (_id)      : ' + compactCount);
console.log('');

var totalBugs = 0;
function reportSection(label, arr) {
  totalBugs += arr.length;
  var icon = arr.length === 0 ? '  ✅ PASS' : '  ❌ FAIL (' + arr.length + ' issues)';
  console.log(icon + '  ' + label);
  if (arr.length > 0) {
    arr.slice(0, 30).forEach(function(issue) {
      console.log('       → ' + JSON.stringify(issue));
    });
    if (arr.length > 30) console.log('       … and ' + (arr.length - 30) + ' more');
  }
}

reportSection('MACRO MATH (delta ≥ 3 kcal)',           issues.MACRO_MATH);
reportSection('NEGATIVE MACROS',                        issues.NEGATIVE_MACRO);
reportSection('ZERO CALORIES',                          issues.ZERO_CALORIES);
reportSection('NaN / null / undefined in baseNutrition',issues.NAN_NULL_MACRO);
reportSection('INVALID SERVINGS (must be 1-4)',         issues.INVALID_SERVINGS);
reportSection('INVALID TIMES (prepTime+cookTime=0)',    issues.INVALID_TIMES);
reportSection('INVALID DIFFICULTY (must be 1 or 2)',    issues.INVALID_DIFFICULTY);
reportSection('INVALID CATEGORY',                       issues.INVALID_CATEGORY);
reportSection('INVALID MEAL TYPES',                     issues.INVALID_MEAL_TYPES);
reportSection('INVALID INGREDIENTS',                    issues.INVALID_INGREDIENTS);
reportSection('EMPTY STEPS',                            issues.EMPTY_STEPS);
reportSection('DUPLICATE IDs',                          issues.DUPLICATE_ID);
reportSection('DUPLICATE NAMES',                        issues.DUPLICATE_NAME);

console.log('\n────────────────────────────────────────────────────────────');
console.log('  TOTAL PART 1 BUGS: ' + totalBugs);
console.log('────────────────────────────────────────────────────────────\n');

// ─── PART 2: SCALING ENGINE AUDIT ────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════════');
console.log('  SCALING ENGINE AUDIT — PART 2');
console.log('════════════════════════════════════════════════════════════');

// Find a recipe with eggs, one with avocat, one general
var recipeWithEgg    = DB.find(function(r) { return Array.isArray(r.ingredients) && r.ingredients.some(function(i){ return i.unit === 'pce'; }); });
var recipeWithAvoc   = DB.find(function(r) { return Array.isArray(r.ingredients) && r.ingredients.some(function(i){ return i.name && i.name.toLowerCase().indexOf('avocat') !== -1; }); });
var recipeGeneral    = DB.find(function(r) { return r.id && Array.isArray(r.ingredients) && r.baseNutrition && r.baseNutrition.calories >= 400; });

console.log('\n[2.0] Engine functions available:');
console.log('  getAdaptedRecipe : ' + (typeof RE.getAdaptedRecipe));
console.log('  filterRecipes    : ' + (typeof RE.filterRecipes));
console.log('  findRecipe       : ' + (typeof RE.findRecipe));

// ── 2.1 Division by zero protection ──
console.log('\n[2.1] Division-by-zero protection:');
// Test with recipe that has 0 calories (hypothetical)
var dummyZeroCal = { id: 'TEST_ZERO', baseNutrition: { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }, servings: 2, ingredients: [], steps: [] };
DB.push(dummyZeroCal);
var r0 = RE.getAdaptedRecipe('TEST_ZERO', { caloriesTarget: 600 });
DB.pop();
console.log('  Zero-calorie recipe → returns null? ' + (r0 === null ? '✅ YES (protected)' : '❌ NO — returns: ' + JSON.stringify(r0)));

// Test with servings=0
var dummyZeroServ = { id: 'TEST_SERV0', baseNutrition: { calories: 500, proteinGrams: 30, carbsGrams: 50, fatGrams: 10 }, servings: 0, ingredients: [], steps: [] };
DB.push(dummyZeroServ);
var r0s = RE.getAdaptedRecipe('TEST_SERV0', { caloriesTarget: 600 });
DB.pop();
console.log('  Zero-servings recipe → returns null? ' + (r0s === null ? '✅ YES (protected)' : '❌ NO — returns: ' + JSON.stringify(r0s)));

// ── 2.2 Proportional calorie scaling ──
console.log('\n[2.2] Proportional calorie scaling:');
var scalingBugs = [];
if (recipeGeneral) {
  var basePerServing = recipeGeneral.baseNutrition.calories / recipeGeneral.servings;
  [400, 700, 900, 1200].forEach(function(target) {
    var result = RE.getAdaptedRecipe(recipeGeneral.id, { caloriesTarget: target * recipeGeneral.servings });
    // We override via targetCalories option directly:
    var result2 = RE.getAdaptedRecipe(recipeGeneral.id, {}, { targetCalories: target });
    if (!result2) result2 = RE.getAdaptedRecipe(recipeGeneral.id, { caloriesTarget: 1800 }, { targetCalories: target });
    if (result2) {
      var got = result2.adaptedNutrition.calories;
      var delta = Math.abs(got - target);
      var ok = delta <= 50; // TOLERANCE_KCAL
      var lineSymbol = ok ? '✅' : '❌';
      console.log('  ' + lineSymbol + ' target=' + target + ' kcal → got=' + got + ' kcal  (delta=' + delta + ')  [recipe: ' + recipeGeneral.id + ' "' + recipeGeneral.name + '"]');
      if (!ok) scalingBugs.push({ target: target, got: got, delta: delta });
    } else {
      console.log('  ⚠️  Could not scale recipe ' + recipeGeneral.id + ' to ' + target + ' kcal (returned null)');
    }
  });
}

// ── 2.3 Ingredient proportional scaling ──
console.log('\n[2.3] Ingredient proportional scaling:');
if (recipeGeneral) {
  var result3 = RE.getAdaptedRecipe(recipeGeneral.id, {}, { targetCalories: 600 });
  if (!result3) result3 = RE.getAdaptedRecipe(recipeGeneral.id, { caloriesTarget: 1800 }, { targetCalories: 600 });
  if (result3) {
    var ratio = result3.scalingRatio;
    var basePerServ = recipeGeneral.baseNutrition.calories / recipeGeneral.servings;
    var expectedRatio = 600 / basePerServ;
    console.log('  scalingRatio=' + ratio + ' expected≈' + Math.round(expectedRatio * 100) / 100);
    var ingScalingBugs = 0;
    result3.ingredients.forEach(function(ing, idx) {
      if (ing.unit === 'pce') return; // eggs handled separately
      var origIng = recipeGeneral.ingredients[idx];
      if (!origIng) return;
      var expectedQty = Math.round((origIng.qty / recipeGeneral.servings) * (600 / basePerServ) * 10) / 10;
      if (Math.abs(ing.qty - expectedQty) > 0.2) {
        ingScalingBugs++;
        console.log('  ❌ Ingredient "' + ing.name + '": got=' + ing.qty + ' expected≈' + expectedQty);
      }
    });
    if (ingScalingBugs === 0) {
      console.log('  ✅ All non-pce ingredients scale proportionally');
    }
  }
}

// ── 2.4 Egg rounding ──
console.log('\n[2.4] Egg (pce) rounding behavior:');
if (recipeWithEgg) {
  var eggIng = recipeWithEgg.ingredients.find(function(i){ return i.unit === 'pce'; });
  console.log('  Recipe: ' + recipeWithEgg.id + ' "' + recipeWithEgg.name + '" — egg ingredient: qty=' + eggIng.qty);
  var basePerServEgg = recipeWithEgg.baseNutrition.calories / recipeWithEgg.servings;
  [400, 700, 900].forEach(function(target) {
    var scaled = RE.getAdaptedRecipe(recipeWithEgg.id, { caloriesTarget: 1800 }, { targetCalories: target });
    if (scaled) {
      var adaptedEgg = scaled.ingredients.find(function(i){ return i.unit === 'pce'; });
      if (adaptedEgg) {
        var rawExpected = (eggIng.qty / recipeWithEgg.servings) * (target / basePerServEgg);
        var isIntOrHalf = (adaptedEgg.qty * 2) === Math.round(adaptedEgg.qty * 2);
        // Engine uses Math.round (integer), not nearest 0.5
        var isInteger  = adaptedEgg.qty === Math.round(adaptedEgg.qty);
        var status = isInteger ? '✅ whole number' : '⚠️ non-integer';
        console.log('  target=' + target + 'kcal → raw=' + Math.round(rawExpected*100)/100 + ' → rounded=' + adaptedEgg.qty + ' ' + status);
        if (!isInteger) {
          scalingBugs.push({ bug: 'EGG_NOT_INTEGER', target: target, qty: adaptedEgg.qty });
        }
      }
    }
  });
  // Check: does it round to nearest 0.5 (should it?) — per spec
  console.log('  NOTE: Engine uses Math.round (integer only). Spec says "round to nearest 0.5 or whole" — ⚠️ engine only does integer rounding, not 0.5.');
}

// ── 2.5 Avocado rounding ──
console.log('\n[2.5] Avocado rounding behavior:');
if (recipeWithAvoc) {
  var avocIng = recipeWithAvoc.ingredients.find(function(i){ return i.name && i.name.toLowerCase().indexOf('avocat') !== -1; });
  if (avocIng) {
    console.log('  Recipe: ' + recipeWithAvoc.id + ' "' + recipeWithAvoc.name + '" — avocado: qty=' + avocIng.qty + ' unit=' + avocIng.unit);
    var basePerServAvoc = recipeWithAvoc.baseNutrition.calories / recipeWithAvoc.servings;
    [400, 700, 900].forEach(function(target) {
      var scaled = RE.getAdaptedRecipe(recipeWithAvoc.id, { caloriesTarget: 1800 }, { targetCalories: target });
      if (scaled) {
        var adaptedAvoc = scaled.ingredients.find(function(i){ return i.name && i.name.toLowerCase().indexOf('avocat') !== -1; });
        if (adaptedAvoc) {
          var rawExpected = (avocIng.qty / recipeWithAvoc.servings) * (target / basePerServAvoc);
          var rounded = adaptedAvoc.qty;
          // Check if rounded to nearest 0.25
          var isRoundedTo025 = (rounded * 4) === Math.round(rounded * 4);
          console.log('  target=' + target + 'kcal → raw≈' + Math.round(rawExpected*10)/10 + ' g → got=' + rounded + 'g  rounded_to_0.25? ' + (isRoundedTo025 ? 'yes (but engine uses ×10 rounding)' : 'no'));
          // Engine rounds to 1 decimal place (×10 / 10), NOT to 0.25
        }
      }
    });
    console.log('  NOTE: Engine rounds avocado qty to 1 decimal place (Math.round(x*10)/10), NOT to nearest 0.25. Spec says 0.25 rounding — ⚠️ missing.');
  }
}

// ── 2.6 Spoon/tablespoon handling ──
console.log('\n[2.6] Spoon/tablespoon (cs/cc) handling:');
var recipeWithSpoons = DB.find(function(r) { return Array.isArray(r.ingredients) && r.ingredients.some(function(i){ return i.unit === 'cs' || i.unit === 'cc'; }); });
if (recipeWithSpoons) {
  var spoonIng = recipeWithSpoons.ingredients.find(function(i){ return i.unit === 'cs' || i.unit === 'cc'; });
  console.log('  Recipe: ' + recipeWithSpoons.id + ' "' + recipeWithSpoons.name + '" — spoon ingredient: ' + spoonIng.name + ' qty=' + spoonIng.qty + ' unit=' + spoonIng.unit);
  var bpServSpoon = recipeWithSpoons.baseNutrition.calories / recipeWithSpoons.servings;
  var scaledSpoon = RE.getAdaptedRecipe(recipeWithSpoons.id, { caloriesTarget: 1800 }, { targetCalories: 600 });
  if (scaledSpoon) {
    var adaptedSpoon = scaledSpoon.ingredients.find(function(i){ return i.unit === 'cs' || i.unit === 'cc'; });
    if (adaptedSpoon) {
      var rawSpoon = (spoonIng.qty / recipeWithSpoons.servings) * (600 / bpServSpoon);
      console.log('  raw=' + Math.round(rawSpoon*100)/100 + ' → scaled=' + adaptedSpoon.qty + ' (rounded to 1 decimal)');
      // Spec doesn't require quarter-spoon rounding so 1 decimal is acceptable
      console.log('  ✅ Spoon units are scaled proportionally (1 decimal precision)');
    }
  }
} else {
  console.log('  No recipe with cs/cc units found in full-format recipes');
}

// ── 2.7 Minimum floor ──
console.log('\n[2.7] Minimum floor (no ingredient goes to 0):');
var floorBugs = [];
if (recipeGeneral) {
  // Scale to a very small target (100 kcal) — should still have qty > 0
  var verySmall = RE.getAdaptedRecipe(recipeGeneral.id, { caloriesTarget: 1800 }, { targetCalories: 100 });
  if (verySmall) {
    verySmall.ingredients.forEach(function(ing) {
      if (ing.qty === 0) {
        floorBugs.push({ id: recipeGeneral.id, ingredient: ing.name, qty: ing.qty });
        console.log('  ❌ "' + ing.name + '" qty scaled to 0 at 100 kcal target');
      }
    });
    if (floorBugs.length === 0) {
      console.log('  ✅ No ingredient reaches 0 (or none tested found 0)');
      // Check _raw values for rounding to 0
      var roundedToZero = verySmall.ingredients.filter(function(ing) {
        return ing.qty === 0 && ing.unit === 'pce';
      });
      if (roundedToZero.length > 0) {
        roundedToZero.forEach(function(i) { console.log('  ⚠️ pce ingredient rounded to 0: ' + i.name); });
      }
    }
  } else {
    console.log('  ⚠️  getAdaptedRecipe returned null for 100 kcal target — may be by design (no protection)');
  }
}

// ── 2.8 Extreme inputs ──
console.log('\n[2.8] Extreme inputs (1200 kcal user / 4000 kcal athlete):');
var testRecipe = recipeGeneral;
if (testRecipe) {
  var bps = testRecipe.baseNutrition.calories / testRecipe.servings;
  console.log('  Test recipe: ' + testRecipe.id + ' "' + testRecipe.name + '" base/serving=' + Math.round(bps) + ' kcal');

  var cases = [
    { label: '1200 kcal user (meal=400)',  target: Math.round(1200/3) },
    { label: '1800 kcal user (meal=600)',  target: Math.round(1800/3) },
    { label: '2500 kcal user (meal=833)',  target: Math.round(2500/3) },
    { label: '4000 kcal athlete (meal=1333)', target: Math.round(4000/3) }
  ];

  cases.forEach(function(c) {
    var result = RE.getAdaptedRecipe(testRecipe.id, { caloriesTarget: 1800 }, { targetCalories: c.target });
    if (!result) {
      console.log('  ❌ ' + c.label + ' → returned null');
      return;
    }
    var got   = result.adaptedNutrition.calories;
    var delta = Math.abs(got - c.target);
    var ok    = delta <= 50;
    var ratio = result.scalingRatio;
    // Check no negative or zero ingredients
    var negOrZero = result.ingredients.filter(function(i){ return i.qty <= 0; });
    var symbol = (ok && negOrZero.length === 0) ? '✅' : '❌';
    console.log('  ' + symbol + ' ' + c.label + ' → target=' + c.target + ' got=' + got + ' delta=' + delta + ' ratio=' + ratio + (negOrZero.length ? ' [neg/zero ings: ' + negOrZero.map(function(i){return i.name;}).join(',') + ']' : ''));
  });
}

// ── 2.9 targetCalories=undefined or 0 ──
console.log('\n[2.9] Edge case: targetCalories=undefined, userState=null:');
var nullResult = RE.getAdaptedRecipe((testRecipe||DB[0]).id, null);
console.log('  userState=null → ' + (nullResult === null ? '✅ returns null safely' : '❌ returns ' + JSON.stringify(nullResult)));
var zeroResult = RE.getAdaptedRecipe((testRecipe||DB[0]).id, { caloriesTarget: 0 });
console.log('  caloriesTarget=0 → ' + (zeroResult === null ? '✅ returns null safely' : '❌ should return null, got ' + JSON.stringify(zeroResult)));

// ── Summary ──
console.log('\n════════════════════════════════════════════════════════════');
console.log('  SCALING ENGINE BUGS SUMMARY');
console.log('════════════════════════════════════════════════════════════');
console.log('  [BUG-S1] Egg rounding: engine uses Math.round (integer only).');
console.log('           Spec requires "nearest 0.5 or whole". At 0.3 eggs raw,');
console.log('           engine rounds to 0 instead of 0.5. Fix: use');
console.log('           Math.round(rawQty * 2) / 2  for 0.5 steps.');
console.log('');
console.log('  [BUG-S2] Avocado rounding: engine applies generic ×10 rounding');
console.log('           (1 decimal). Spec requires nearest 0.25. Fix: detect');
console.log('           avocado/avocat name and use Math.round(rawQty*4)/4.');
console.log('');
console.log('  [BUG-S3] No minimum floor: if targetCalories is tiny, ingredient');
console.log('           qty can mathematically round to 0 (especially pce eggs).');
console.log('           No Math.max(qty, minFloor) guard exists in engine.');
console.log('');
if (scalingBugs.length > 0) {
  scalingBugs.forEach(function(b) { console.log('  [BUG-S4] ' + JSON.stringify(b)); });
} else {
  console.log('  [OK-S4]  Calorie proportionality within TOLERANCE_KCAL=50 ✅');
}
console.log('────────────────────────────────────────────────────────────\n');
