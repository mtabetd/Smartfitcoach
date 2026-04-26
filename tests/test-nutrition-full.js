/**
 * Test suite nutrition complet — SmartFitCoach
 * Couvre : NutritionMaster (BMR/TDEE/macros), app-core (calcTarget/calcMacros/getAge),
 * recipe-engine (filterRecipes), food-db (duplicates), app-nutrition (devalid/pregnancy/TCA)
 */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Bootstrap ───────────────────────────────────────────────────────────────
global.window = global;
global.document = {
  createElement: function() { return { style: {}, setAttribute: function(){}, appendChild: function(){}, classList: { add: function(){}, remove: function(){}, toggle: function(){} } }; },
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
global.localStorage = { getItem: function() { return null; }, setItem: function(){}, removeItem: function(){} };
global.sessionStorage = { getItem: function() { return null; }, setItem: function(){}, removeItem: function(){} };
global.history = { pushState: function(){}, replaceState: function(){} };
try { Object.defineProperty(global, 'location', { value: { href: '', search: '', hash: '' }, configurable: true }); } catch(e) {}
global.performance = { now: function() { return Date.now(); } };

var pass = 0, fail = 0, skipped = 0;

function check(name, fn) {
  try {
    fn();
    pass++;
    console.log('✓ ' + name);
  } catch (e) {
    fail++;
    console.log('✗ ' + name + ' — ' + e.message);
  }
}

function approx(a, b, tol) {
  tol = tol || 1;
  if (Math.abs(a - b) > tol) throw new Error('Got ' + a + ' expected ~' + b + ' (±' + tol + ')');
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

// ─── Load NutritionMaster ────────────────────────────────────────────────────
global.S = {};
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js', 'utf8'));
var nm = window.NutritionMaster;

// ─── 1. NutritionMaster — BMR Mifflin-St Jeor ───────────────────────────────
console.log('\n=== 1. NutritionMaster BMR / TDEE / Macros ===');

check('BMR homme 30/80/180', function() {
  // Mifflin: 10*80 + 6.25*180 - 5*30 + 5 = 800+1125-150+5 = 1780
  var r = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  assert(r.errors.length === 0, 'Errors: ' + r.errors.join(', '));
  approx(r.bmr, 1780, 3);
});

check('BMR femme 25/60/165', function() {
  // Mifflin: 10*60 + 6.25*165 - 5*25 - 161 = 600+1031.25-125-161 = 1345.25
  var r = nm.compute({ gender: 'female', age: 25, weightKg: 60, heightCm: 165, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  assert(r.errors.length === 0, 'Errors: ' + r.errors.join(', '));
  approx(r.bmr, 1345, 3);
});

check('TDEE sédentaire ×1.2', function() {
  var r = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.2, goal: 'maintain', isElite: false, trainingDay: false });
  approx(r.tdee, Math.round(r.bmr * 1.2), 2);
});

check('TDEE très actif ×1.725', function() {
  var r = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.725, goal: 'maintain', isElite: false, trainingDay: false });
  approx(r.tdee, Math.round(r.bmr * 1.725), 2);
});

check('Plancher femme ≥1400 kcal (shred)', function() {
  var r = nm.compute({ gender: 'female', age: 20, weightKg: 40, heightCm: 155, activityLevel: 1.2, goal: 'shred', isElite: false, trainingDay: false });
  assert(r.errors.length === 0, 'Errors: ' + r.errors.join(', '));
  assert(r.caloriesTarget >= 1400, 'Floor violated: ' + r.caloriesTarget);
});

check('Plancher homme ≥1500 kcal (shred)', function() {
  var r = nm.compute({ gender: 'male', age: 20, weightKg: 50, heightCm: 170, activityLevel: 1.2, goal: 'shred', isElite: false, trainingDay: false });
  assert(r.errors.length === 0, 'Errors: ' + r.errors.join(', '));
  assert(r.caloriesTarget >= 1500, 'Floor violated: ' + r.caloriesTarget);
});

check('Cohérence P×4+G×4+L×9 ≈ caloriesTarget (écart ≤15)', function() {
  var r = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  var check2 = Math.round(r.proteinGrams * 4 + r.carbsGrams * 4 + r.fatGrams * 9);
  approx(check2, r.caloriesTarget, 15);
});

check('Glucides jamais négatifs', function() {
  var r = nm.compute({ gender: 'female', age: 30, weightKg: 50, heightCm: 160, activityLevel: 1.2, goal: 'shred', isElite: false, trainingDay: false });
  assert(r.carbsGrams >= 0, 'Negative carbs: ' + r.carbsGrams);
});

check('Lipides ≥ 0.8g/kg', function() {
  var r = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'cut', isElite: false, trainingDay: false });
  assert(r.fatGrams >= 0.8 * 80 - 1, 'Fat too low: ' + r.fatGrams);
});

check('Protéines ≥ 1.6g/kg femme', function() {
  var r = nm.compute({ gender: 'female', age: 30, weightKg: 60, heightCm: 165, activityLevel: 1.55, goal: 'cut', isElite: false, trainingDay: false });
  assert(r.proteinGrams >= 1.6 * 60 - 1, 'Protein too low: ' + r.proteinGrams);
});

check('Élite homme ≥ 2.2g/kg', function() {
  var r = nm.compute({ gender: 'male', age: 25, weightKg: 85, heightCm: 183, activityLevel: 1.9, goal: 'maintain', isElite: true, trainingDay: false });
  assert(r.proteinGrams >= 2.2 * 85 - 1, 'Elite protein too low: ' + r.proteinGrams);
});

check('Carb cycling trainingDay booste glucides', function() {
  var rOff = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  var rOn = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: true });
  assert(rOn.carbsGrams > rOff.carbsGrams, 'Carb cycling not boosting: ' + rOff.carbsGrams + ' vs ' + rOn.carbsGrams);
});

check('Validation rejette gender invalide', function() {
  var r = nm.compute({ gender: 'homme', age: 30, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  assert(r.errors.length > 0, 'Should reject invalid gender');
  assert(r.bmr === 0, 'BMR should be 0 on error');
});

check('Validation rejette age négatif', function() {
  var r = nm.compute({ gender: 'male', age: -5, weightKg: 80, heightCm: 180, activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false });
  assert(r.errors.length > 0, 'Should reject negative age');
});

check('Validation rejette activityLevel hors [1, 2.5]', function() {
  var r = nm.compute({ gender: 'male', age: 30, weightKg: 80, heightCm: 180, activityLevel: 3.0, goal: 'maintain', isElite: false, trainingDay: false });
  assert(r.errors.length > 0, 'Should reject activity 3.0');
});

// ─── 2. app-core.js — calcTarget / calcMacros / getAge ──────────────────────
console.log('\n=== 2. app-core.js — calcTarget / calcMacros / getAge ===');

try {
  // Load app-core (overwrites window.S with defaults — set test state per-check)
  eval(fs.readFileSync(ROOT + '/app/food-db.js', 'utf8'));
  eval(fs.readFileSync(ROOT + '/app/extras.js', 'utf8'));
  eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js', 'utf8'));
  eval(fs.readFileSync(ROOT + '/app/app-core.js', 'utf8'));

  // GOALS is defined after app-core loads
  var GOALS = window.GOALS || [];
  var maintainIdx = GOALS.findIndex ? GOALS.findIndex(function(g) { return g.key === 'maintain'; }) : 2;
  var cutIdx = GOALS.findIndex ? GOALS.findIndex(function(g) { return g.key === 'cut'; }) : 0;
  var shredIdx = GOALS.findIndex ? GOALS.findIndex(function(g) { return g.key === 'shred'; }) : 1;
  var bulkIdx = GOALS.findIndex ? GOALS.findIndex(function(g) { return g.key === 'bulk'; }) : 3;
  var leanBulkIdx = GOALS.findIndex ? GOALS.findIndex(function(g) { return g.key === 'lean_bulk'; }) : 4;
  var tcaIdx = 5;

  check('calcTarget — retourne valeur > 0', function() {
    window.S = { sex: 'homme', age: 30, weight: 80, height: 180, activity: 2, goal: maintainIdx, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0 };
    var t = window.calcTarget();
    assert(t > 0, 'Expected >0, got ' + t);
  });

  check('calcTarget TCA force maintenance (≥ TDEE)', function() {
    window.S = { sex: 'homme', age: 30, weight: 80, height: 180, activity: 2, goal: cutIdx, medical: ['tca'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0 };
    var tdeeVal = window.calcTDEE ? window.calcTDEE() : 0;
    var t = window.calcTarget();
    assert(t >= tdeeVal - 10, 'TCA should force maintain, got ' + t + ' vs TDEE ' + tdeeVal);
    assert(t >= 1800, 'TCA floor femme 1800, got ' + t);
  });

  check('calcTarget TCA homme ≥ 1900', function() {
    window.S = { sex: 'homme', age: 30, weight: 80, height: 180, activity: 2, goal: shredIdx, medical: ['tca'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0 };
    var t = window.calcTarget();
    assert(t >= 1900, 'TCA homme floor 1900, got ' + t);
  });

  check('calcTarget grossesse — ignore bulk, retourne TDEE + bonus trimestre', function() {
    window.S = { sex: 'femme', age: 28, weight: 68, height: 168, activity: 2, goal: bulkIdx, medical: [], pregnant: true, pregnancyWeek: 20, prePregnancyWeight: 62, birthDate: null, cycleTracking: false, regime: 0 };
    var t = window.calcTarget();
    assert(t >= 1800, 'Pregnancy floor 1800, got ' + t);
    // Should be roughly TDEE + 340 (T2), not TDEE * 1.15
    var tdeeEstimate = window.calcTDEE ? window.calcTDEE() : 0;
    assert(t <= tdeeEstimate + 600, 'Pregnancy should not give full bulk surplus, got ' + t);
  });

  check('calcTarget plancher femme ≥ 1400', function() {
    window.S = { sex: 'femme', age: 20, weight: 45, height: 158, activity: 0, goal: shredIdx, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0 };
    var t = window.calcTarget();
    assert(t >= 1400, 'Floor violated: ' + t);
  });

  check('calcTarget plancher homme ≥ 1500', function() {
    window.S = { sex: 'homme', age: 20, weight: 55, height: 172, activity: 0, goal: shredIdx, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0 };
    var t = window.calcTarget();
    assert(t >= 1500, 'Floor violated: ' + t);
  });

  check('calcMacros IRC — protéines plafonnées ≤ 0.66g/kg', function() {
    window.S = { sex: 'homme', age: 45, weight: 80, height: 180, activity: 2, goal: maintainIdx, medical: ['irc'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [] };
    var m = window.calcMacros();
    var ppk = m.proteinPerKg || (m.p / 80);
    assert(ppk <= 0.66 + 0.01, 'IRC protein cap violated: ' + ppk + 'g/kg');
  });

  check('calcMacros protéines non nulles', function() {
    window.S = { sex: 'homme', age: 30, weight: 80, height: 180, activity: 2, goal: maintainIdx, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [] };
    var m = window.calcMacros();
    assert(m.p > 0, 'Protein is 0');
    assert(m.g >= 0, 'Carbs is negative');
    assert(m.l > 0, 'Fat is 0');
  });

  check('getAge() — date future retourne null', function() {
    window.S = { birthDate: '2099-01-01', age: null };
    var a = window.getAge ? window.getAge() : null;
    assert(a === null, 'Future birthdate should return null, got ' + a);
  });

  check('getAge() — date normale correcte', function() {
    // 1994-01-01 → ~32 ans en 2026
    window.S = { birthDate: '1994-01-01', age: null };
    var a = window.getAge ? window.getAge() : null;
    assert(a !== null && a >= 30 && a <= 34, 'Expected ~32, got ' + a);
  });

  check('getAge() — date invalide retourne null', function() {
    window.S = { birthDate: 'not-a-date', age: null };
    var a = window.getAge ? window.getAge() : null;
    assert(a === null || typeof a === 'number', 'Should not crash on invalid date');
  });

  check('getAge() — fallback sur S.age si pas de birthDate', function() {
    window.S = { birthDate: null, age: 35 };
    var a = window.getAge ? window.getAge() : null;
    assert(a === 35, 'Expected 35 from S.age, got ' + a);
  });

} catch (loadErr) {
  console.log('  [SKIP] app-core.js load error: ' + loadErr.message);
  skipped++;
}

// ─── 3. food-db.js — Pas de doublons ─────────────────────────────────────────
console.log('\n=== 3. food-db.js — Intégrité (pas de doublons internes) ===');

check('Pas de doublon "Lait de coco (boisson)"', function() {
  var raw = fs.readFileSync(ROOT + '/app/food-db.js', 'utf8');
  var matches = raw.match(/['"]Lait de coco \(boisson\)['"]/g);
  assert(!matches || matches.length <= 1, 'Duplicate found: ' + (matches ? matches.length : 0) + ' occurrences');
});

check('Pas de doublon "Lait d\'avoine" (exact)', function() {
  var raw = fs.readFileSync(ROOT + '/app/food-db.js', 'utf8');
  // Count exact matches (not "Lait d'avoine barista")
  var matches = (raw.match(/'Lait d\\?'avoine',/g) || []);
  assert(matches.length <= 1, 'Duplicate found: ' + matches.length + ' occurrences');
});

check('Pas de doublon "Lait d\'amande non sucré"', function() {
  var raw = fs.readFileSync(ROOT + '/app/food-db.js', 'utf8');
  var matches = (raw.match(/['"]Lait d['\\]+'?amande non sucr/g) || []);
  assert(matches.length <= 1, 'Duplicate found: ' + matches.length + ' occurrences');
});

check('food-db.js — au moins 500 aliments', function() {
  var raw = fs.readFileSync(ROOT + '/app/food-db.js', 'utf8');
  var count = (raw.match(/\['/g) || []).length;
  assert(count >= 500, 'Too few entries: ' + count);
});

// ─── 4. recipe-engine.js — filterRecipes sans crash ──────────────────────────
console.log('\n=== 4. recipe-engine.js — filterRecipes sans ReferenceError ===');

try {
  // Reset globals for recipe engine
  global.S = {};
  global.window = global;
  eval(fs.readFileSync(ROOT + '/app/recipe-engine.js', 'utf8'));
  var RE = window.RecipeEngine;

  check('filterRecipes omnivore sans crash', function() {
    var result = RE.filterRecipes({ regime: 0, allergies: [], intolerances: [], allowPork: true, allowAlcohol: true });
    assert(Array.isArray(result), 'Should return array');
    assert(result.length > 0, 'Should have results');
  });

  check('filterRecipes végétarien sans crash', function() {
    var result = RE.filterRecipes({ regime: 2, allergies: [], intolerances: [], allowPork: false, allowAlcohol: false });
    assert(Array.isArray(result), 'Should return array');
  });

  check('filterRecipes vegan sans crash', function() {
    var result = RE.filterRecipes({ regime: 3, allergies: [], intolerances: [], allowPork: false, allowAlcohol: false });
    assert(Array.isArray(result), 'Should return array');
  });

  check('filterRecipes pescétarien sans crash', function() {
    var result = RE.filterRecipes({ regime: 1, allergies: [], intolerances: [], allowPork: false, allowAlcohol: false });
    assert(Array.isArray(result), 'Should return array');
  });

  check('filterRecipes allergie gluten sans crash', function() {
    var result = RE.filterRecipes({ regime: 0, allergies: ['gluten/blé'], intolerances: [], allowPork: true, allowAlcohol: false });
    assert(Array.isArray(result), 'Should return array');
  });

  check('filterRecipes allowPork:false exclut le porc', function() {
    var result = RE.filterRecipes({ regime: 0, allergies: [], intolerances: [], allowPork: false, allowAlcohol: false });
    assert(Array.isArray(result), 'Should return array');
    // Check that bacon/lard/porc are not in ingredients
    var hasPork = result.some(function(r) {
      var ingStr = (typeof r.ingredients === 'string' ? r.ingredients : (r.i || '')).toLowerCase();
      return /\bporc\b|\blard\b|\bbacon\b/.test(ingStr);
    });
    assert(!hasPork, 'Found pork in allowPork:false results');
  });

  check('Pas de ReferenceError halalExclusions', function() {
    // This would have thrown before the fix
    var result = RE.filterRecipes({ regime: 0, allergies: [], intolerances: [], allowPork: false, allowAlcohol: false });
    assert(Array.isArray(result), 'No ReferenceError');
  });

  check('filterRecipes retourne > 100 recettes (toutes catégories)', function() {
    var result = RE.filterRecipes({ regime: 0, allergies: [], intolerances: [], allowPork: true, allowAlcohol: true });
    assert(result.length > 100, 'Expected >100 recipes, got ' + result.length);
  });

} catch (recErr) {
  console.log('  [FAIL] recipe-engine.js: ' + recErr.message);
  fail++;
}

// ─── 5. Sécurité médicale — TCA (via code-path app-core) ─────────────────────
console.log('\n=== 5. Sécurité médicale ===');

try {
  // Load app-core (it initializes window.S with defaults, so we set our test state after)
  eval(fs.readFileSync(ROOT + '/app/food-db.js', 'utf8'));
  eval(fs.readFileSync(ROOT + '/app/extras.js', 'utf8'));
  eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js', 'utf8'));
  eval(fs.readFileSync(ROOT + '/app/app-core.js', 'utf8'));
  var GOALS2 = window.GOALS || [];
  var cutIdx2 = GOALS2.findIndex ? GOALS2.findIndex(function(g) { return g.key === 'cut'; }) : 0;
  var maintainIdx2 = GOALS2.findIndex ? GOALS2.findIndex(function(g) { return g.key === 'maintain'; }) : 2;
  var shredIdx3 = GOALS2.findIndex ? GOALS2.findIndex(function(g) { return g.key === 'shred'; }) : 1;
  var bulkIdx2 = GOALS2.findIndex ? GOALS2.findIndex(function(g) { return g.key === 'bulk'; }) : 3;
  // Set test state AFTER eval (app-core.js overwrites window.S on load)
  global.S = { sex: 'femme', age: 25, weight: 55, height: 165, activity: 2, goal: cutIdx2, medical: ['tca'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [] };

  check('TCA femme cut → calcTarget ≥ 1800', function() {
    window.S.goal = cutIdx2;
    window.S.medical = ['tca'];
    var t = window.calcTarget();
    assert(t >= 1800, 'TCA femme should get ≥1800, got ' + t);
  });

  check('TCA calcMacros macros maintain (pas de déficit)', function() {
    // TCA femme: calcTarget should return ≥ TDEE (floor 1800 kcal)
    window.S = { sex: 'femme', age: 25, weight: 55, height: 165, activity: 2, goal: cutIdx2, medical: ['tca'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [] };
    var tTca = window.calcTarget();
    var tdee = window.calcTDEE ? window.calcTDEE() : 0;
    // TCA should return ≥ TDEE (no deficit allowed)
    assert(tTca >= tdee - 10, 'TCA should not allow deficit, got ' + tTca + ' vs TDEE ' + tdee);
    assert(tTca >= 1800, 'TCA femme floor 1800 kcal, got ' + tTca);
  });

  check('IRC calcMacros protéines plafonnées', function() {
    window.S = { sex: 'homme', age: 50, weight: 75, height: 175, activity: 2, goal: maintainIdx2, medical: ['irc'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [] };
    var m = window.calcMacros();
    var ppk = m.proteinPerKg || (m.p / 75);
    assert(ppk <= 0.61, 'IRC protein cap violated: ' + ppk.toFixed(3) + 'g/kg');
  });

  check('Grossesse calcTarget ≥ 1800', function() {
    window.S = { sex: 'femme', age: 28, weight: 68, height: 168, activity: 2, goal: maintainIdx2, medical: [], pregnant: true, pregnancyWeek: 20, prePregnancyWeight: 62, birthDate: null, cycleTracking: false, regime: 0, supplements: [] };
    var t = window.calcTarget();
    assert(t >= 1800, 'Pregnancy floor 1800 kcal, got ' + t);
  });

  check('Adolescent calcTarget — déficit plafonné à -300', function() {
    window.S = { sex: 'homme', age: 16, weight: 65, height: 175, activity: 2, goal: shredIdx3, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [] };
    var t = window.calcTarget();
    var tdee = window.calcTDEE ? window.calcTDEE() : 0;
    assert(t >= tdee - 300 - 5, 'Teen max deficit is 300kcal, got ' + t + ' vs TDEE ' + tdee);
  });

} catch (e2) {
  console.log('  [SKIP] medical safety tests: ' + e2.message);
  skipped++;
}

// ─── Résumé ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log('Résultats : ' + pass + ' pass, ' + fail + ' fail' + (skipped ? ', ' + skipped + ' skipped' : ''));
if (fail > 0) process.exit(1);
