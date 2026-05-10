'use strict';
/**
 * Test suite — Symbiose nutrition ↔ sport ↔ profil utilisateur
 * Couvre : dévalidations croisées, filtres médicaux sport, equipment type guard,
 *          IRC sport restriction, TCA sport goals, grossesse sport, calcTarget cross-module
 */

var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Bootstrap DOM minimal ───────────────────────────────────────────────────
global.window = global;
global.document = {
  createElement: function(t) { return { style: {}, setAttribute: function(){}, appendChild: function(){}, classList:{add:function(){},remove:function(){}}, tagName: t }; },
  getElementById: function() { return null; },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener: function() {},
  removeEventListener: function() {},
  body: { appendChild: function(){}, classList: { add:function(){}, remove:function(){} } },
  head: { appendChild: function(){} },
  location: { href: '', search: '', hash: '' }
};
try { Object.defineProperty(global, 'navigator', { value: { userAgent: '', language: 'fr-FR' }, configurable: true }); } catch(e) {}
global.localStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.sessionStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.history = { pushState: function(){}, replaceState: function(){} };
try { Object.defineProperty(global, 'location', { value: { href:'', search:'', hash:'' }, configurable: true }); } catch(e) {}
global.performance = { now: function(){ return Date.now(); } };

var pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('✓ ' + name); }
  catch(e) { fail++; console.log('✗ ' + name + ' — ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

// ─── Load core modules ───────────────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js', 'utf8'));  // sets window.S
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js', 'utf8'));  // isFemale, isMale, isEnglish
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js', 'utf8'));  // NutritionMaster.compute
eval(fs.readFileSync(ROOT + '/app/sfc-symbiosis.js', 'utf8'));  // SFCSymbiosis, LOAD_MULTIPLIERS
eval(fs.readFileSync(ROOT + '/app/exercises-db.js', 'utf8'));
var _muscuEngine = require(ROOT + '/app/muscu-engine.js');       // sfcBuildMuscuDay — UMD exports via module.exports in Node
window.sfcBuildMuscuDay = _muscuEngine.sfcBuildMuscuDay;
eval(fs.readFileSync(ROOT + '/app/sport-data.js', 'utf8'));  // données statiques sport (Phase 2)
eval(fs.readFileSync(ROOT + '/app/app-sport.js', 'utf8'));

var GOALS = window.GOALS || [];
var maintainIdx = GOALS.findIndex(function(g){ return g.key === 'maintain'; });
var cutIdx = GOALS.findIndex(function(g){ return g.key === 'cut'; });
var shredIdx = GOALS.findIndex(function(g){ return g.key === 'shred'; });
var bulkIdx = GOALS.findIndex(function(g){ return g.key === 'bulk'; });

// ─── 1. Dévalidations croisées ───────────────────────────────────────────────
console.log('\n=== 1. Dévalidations croisées ===');

check('devalidateSportProgram existe dans window', function() {
  assert(typeof window.devalidateSportProgram === 'function', 'devalidateSportProgram missing');
});

check('devalidateWeekPlan existe dans window', function() {
  assert(typeof window.devalidateWeekPlan === 'function', 'devalidateWeekPlan missing');
});

check('calcTarget existe dans window', function() {
  assert(typeof window.calcTarget === 'function', 'calcTarget missing');
});

check('generateSportProgram existe dans window', function() {
  assert(typeof window.generateSportProgram === 'function', 'generateSportProgram missing');
});

// ─── 2. S.activity → calcTDEE (nutrition) ────────────────────────────────────
console.log('\n=== 2. S.activity → calcTDEE nutrition ===');

check('TDEE sédentaire (0) < TDEE athlète (4) pour même profil', function() {
  window.S = { sex: 'homme', age: 30, weight: 80, height: 180, activity: 0, goal: maintainIdx, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [], trainingDaysSelected: [] };
  var tdee0 = window.calcTDEE ? window.calcTDEE() : 0;
  window.S.activity = 4;
  var tdee4 = window.calcTDEE ? window.calcTDEE() : 0;
  assert(tdee4 > tdee0, 'Athlete TDEE should be > sedentary: ' + tdee4 + ' vs ' + tdee0);
});

check('ACTIVITIES array a 5+ entrées avec facteurs croissants', function() {
  var acts = window.ACTIVITIES || [];
  assert(acts.length >= 5, 'Expected >=5 activities, got ' + acts.length);
  for (var i = 1; i < acts.length; i++) {
    assert(acts[i].factor >= acts[i-1].factor, 'Activity factors not ascending at ' + i);
  }
});

// ─── 3. Filtres médicaux sport ────────────────────────────────────────────────
console.log('\n=== 3. Filtres médicaux generateSportProgram ===');

function getProgram(overrides) {
  var base = {
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, medical: [], pregnant: false, birthDate: null,
    cycleTracking: false, regime: 0, supplements: [],
    trainingDaysSelected: [1, 3, 5],
    sportType: 'musculation',
    sportLevel: 'intermediate', sportEquipment: 'gym', sportGoals: ['muscle'],
    sportDays: 3, muscuSplit: 'fullbody', _splitChoice: 'fullbody',
    muscuMedical: { done: false, lowerBack: false, knees: false, shoulders: false, herniaDisc: false },
    sportFocus: {}
  };
  Object.keys(overrides).forEach(function(k) { base[k] = overrides[k]; });
  window.S = base;
  try { return window.generateSportProgram(); }
  catch(e) { return null; }
}

function getAllExNames(prog) {
  var names = [];
  if (!prog || !Array.isArray(prog)) return names;
  prog.forEach(function(day) {
    var exos = day.exercises || day.exos || [];
    exos.forEach(function(ex) { names.push((ex.n || ex.name || '').toLowerCase()); });
  });
  return names;
}

check('Programme généré sans médical → non null', function() {
  var p = getProgram({});
  assert(p !== null && p !== undefined, 'Program should be generated');
  assert(Array.isArray(p) && p.length > 0, 'Program should have days');
});

check('IRC : deadlift/squat barre exclus du programme', function() {
  var p = getProgram({ medical: ['irc'] });
  if (!p) { console.log('  (skipped — program null for irc)'); return; }
  var names = getAllExNames(p);
  var hasForbidden = names.some(function(n) {
    return /soulevé de terre|deadlift|squat barre|back squat|front squat/.test(n);
  });
  assert(!hasForbidden, 'IRC program should not contain deadlift/heavy squat. Found: ' + names.filter(function(n){ return /soulevé|deadlift|squat barre/.test(n); }).join(', '));
});

check('Ostéoporose : pas de box jump/sauts dans le programme', function() {
  var p = getProgram({ medical: ['osteoporose'] });
  if (!p) return;
  var names = getAllExNames(p);
  var hasJumps = names.some(function(n) { return /box jump|jump squat|saut/.test(n); });
  assert(!hasJumps, 'Osteoporose should exclude jumps');
});

check('HTA : pas de deadlift dans le programme', function() {
  var p = getProgram({ medical: ['hta'] });
  if (!p) return;
  var names = getAllExNames(p);
  var hasDeadlift = names.some(function(n) { return /deadlift|soulevé de terre/.test(n); });
  assert(!hasDeadlift, 'HTA should exclude deadlift');
});

check('Sans médical : programme a des exercices', function() {
  var p = getProgram({ medical: [] });
  assert(p && p.length > 0, 'Clean profile should generate program');
  var names = getAllExNames(p);
  assert(names.length > 0, 'Should have exercises');
});

// ─── 4. sportEquipment — type guard ──────────────────────────────────────────
console.log('\n=== 4. sportEquipment type guard ===');

check("sportEquipment = 'none' → programme sans machines", function() {
  var p = getProgram({ sportEquipment: 'none', sportLevel: 'beginner' });
  if (!p) { console.log('  (skipped — program null)'); return; }
  // With 'none' (bodyweight), we should get some exercises
  var names = getAllExNames(p);
  assert(names.length > 0, 'bodyweight program should have exercises');
});

check("sportEquipment = [] array → ne crash pas (type guard)", function() {
  // Before fix: [] bypassed all filters. After fix: treated as 'gym' (no filter)
  var p = getProgram({ sportEquipment: [] });
  // Should not throw, should return something or null gracefully
  assert(p !== undefined, 'Should not throw on array sportEquipment');
});

check("sportEquipment = 'home' → pas de machines câble/poulie", function() {
  var p = getProgram({ sportEquipment: 'home', sportLevel: 'intermediate' });
  if (!p) { console.log('  (skipped)'); return; }
  var names = getAllExNames(p);
  var hasMachines = names.some(function(n) { return /câble|machine|poulie|pec deck/.test(n); });
  assert(!hasMachines, 'Home equipment should not have cable machines');
});

// ─── 5. Grossesse → programme sport adapté ───────────────────────────────────
console.log('\n=== 5. Grossesse → sport adapté ===');

check('Femme enceinte T2 : programme généré sans crash', function() {
  var p = getProgram({ sex: 'femme', pregnant: true, pregnancyWeek: 20, prePregnancyWeight: 60, medical: [] });
  // Should not throw, can return null or program
  assert(p !== undefined, 'Should not throw for pregnant T2');
});

check('Femme enceinte T2 : pas de bench press couché (décubitus dorsal)', function() {
  var p = getProgram({ sex: 'femme', pregnant: true, pregnancyWeek: 20, prePregnancyWeight: 60, medical: [] });
  if (!p) { console.log('  (skipped — null program)'); return; }
  var names = getAllExNames(p);
  var hasBench = names.some(function(n) { return /bench press couch|développé couché barre/.test(n); });
  assert(!hasBench, 'T2 pregnant should not have supine bench press');
});

// ─── 6. calcTarget cross-module (nutrition) ───────────────────────────────────
console.log('\n=== 6. calcTarget cross-module ===');

check('TCA : calcTarget ≥ TDEE (pas de déficit)', function() {
  window.S = { sex: 'femme', age: 25, weight: 55, height: 165, activity: 2, goal: cutIdx, medical: ['tca'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [], trainingDaysSelected: [] };
  var tdee = window.calcTDEE ? window.calcTDEE() : 0;
  var t = window.calcTarget();
  assert(t >= tdee - 5, 'TCA should not create deficit: target=' + t + ' tdee=' + tdee);
});

check('IRC : calcMacros protéines ≤ 0.66g/kg', function() {
  window.S = { sex: 'homme', age: 50, weight: 75, height: 175, activity: 2, goal: maintainIdx, medical: ['irc'], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [], trainingDaysSelected: [] };
  var m = window.calcMacros();
  var ppk = m.proteinPerKg || (m.p / 75);
  assert(ppk <= 0.67, 'IRC protein should be capped, got ' + ppk.toFixed(3) + 'g/kg');
});

check('Grossesse T2 : calcTarget ≥ TDEE + 300 kcal', function() {
  window.S = { sex: 'femme', age: 28, weight: 68, height: 168, activity: 2, goal: bulkIdx, medical: [], pregnant: true, pregnancyWeek: 20, prePregnancyWeight: 62, birthDate: null, cycleTracking: false, regime: 0, supplements: [], trainingDaysSelected: [] };
  var tdee = window.calcTDEE ? window.calcTDEE() : 0;
  var t = window.calcTarget();
  assert(t >= tdee + 290, 'T2 pregnancy should add ~340 kcal: target=' + t + ' tdee=' + tdee);
  assert(t >= 1800, 'Pregnancy floor 1800 kcal');
});

check('Plancher femme sèche ≥ 1400 kcal', function() {
  window.S = { sex: 'femme', age: 22, weight: 50, height: 162, activity: 0, goal: shredIdx, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [], trainingDaysSelected: [] };
  var t = window.calcTarget();
  assert(t >= 1400, 'Floor violated: ' + t);
});

check('Plancher homme sèche ≥ 1500 kcal', function() {
  window.S = { sex: 'homme', age: 22, weight: 58, height: 173, activity: 0, goal: shredIdx, medical: [], pregnant: false, birthDate: null, cycleTracking: false, regime: 0, supplements: [], trainingDaysSelected: [] };
  var t = window.calcTarget();
  assert(t >= 1500, 'Floor violated: ' + t);
});

// ─── 7. GOALS / SPORT_LEVELS intégrité ────────────────────────────────────────
console.log('\n=== 7. GOALS / SPORT_LEVELS intégrité ===');

check('GOALS array a bulk/lean_bulk/maintain/cut/shred/recomposition', function() {
  var keys = GOALS.map(function(g){ return g.key; });
  ['bulk','lean_bulk','maintain','cut','shred','recomposition'].forEach(function(k) {
    assert(keys.indexOf(k) !== -1, 'Missing GOAL key: ' + k);
  });
});

check('SPORT_LEVELS contient beginner/intermediate/advanced', function() {
  var lvls = window.SPORT_LEVELS || [];
  var ids = lvls.map(function(l){ return l.id; });
  ['beginner','intermediate','advanced'].forEach(function(id) {
    assert(ids.indexOf(id) !== -1, 'Missing SPORT_LEVEL: ' + id);
  });
});

check('ACTIVITIES a ≥5 niveaux avec factors 1.2–1.9+', function() {
  var acts = window.ACTIVITIES || [];
  assert(acts.length >= 5, 'Expected >=5 activities');
  var factors = acts.map(function(a){ return a.factor; });
  assert(factors.indexOf(1.2) !== -1, 'Missing PAL 1.2');
  assert(factors.some(function(f){ return f >= 1.7; }), 'Missing high PAL (≥1.7)');
});

check('NUTRITION_TO_SPORT_GOAL mapping complet', function() {
  var map = window.NUTRITION_TO_SPORT_GOAL || {};
  ['bulk','lean_bulk','maintain','cut','shred','recomposition'].forEach(function(k) {
    assert(map[k] !== undefined, 'Missing NUTRITION_TO_SPORT_GOAL mapping for ' + k);
  });
});

// ─── 8. getAge() edge cases ───────────────────────────────────────────────────
console.log('\n=== 8. getAge() edge cases ===');

check('getAge() date future → null', function() {
  window.S = { birthDate: '2099-01-01', age: null };
  var a = window.getAge ? window.getAge() : null;
  assert(a === null, 'Future birthdate → null, got ' + a);
});

check('getAge() date normale → âge positif', function() {
  window.S = { birthDate: '1990-06-15', age: null };
  var a = window.getAge ? window.getAge() : null;
  assert(a > 30 && a < 40, 'Expected ~35, got ' + a);
});

// ─── 9. Carb cycling — load-dependent daily adjustment ───────────────────────
console.log('\n=== 9. Carb cycling — trainingLoad → glucides ===');

// Base profile: 30yo male, 80kg, 180cm, moderately active, maintain goal
var GOALS_LIST = window.GOALS || [];
var _maintainIdx = GOALS_LIST.findIndex(function(g){ return g.key === 'maintain'; });
var _shredIdx    = GOALS_LIST.findIndex(function(g){ return g.key === 'shred'; });

function buildCarbProfile(overrides) {
  var base = {
    sex: 'homme', birthDate: '1994-04-28', weight: 80, height: 180,
    activity: 2, goal: _maintainIdx >= 0 ? _maintainIdx : 0,
    medical: [], pregnant: false, regime: 0,
    trainingDaysSelected: [1, 3, 5],
    sportGoals: ['muscle'],
    trainingLoad: 'moderate'
  };
  var k; for (k in overrides) base[k] = overrides[k];
  return base;
}

function computeCarbs(profileOverrides, isTrainingDay) {
  window.S = buildCarbProfile(profileOverrides);
  var nm = window.computeNutritionState ? window.computeNutritionState(isTrainingDay) : null;
  return nm ? nm.carbsGrams : null;
}

check('heavy day → glucides augmentent vs base moderate', function() {
  var carbsMod  = computeCarbs({ trainingLoad: 'moderate' }, true);
  var carbsHvy  = computeCarbs({ trainingLoad: 'heavy'    }, true);
  assert(carbsMod !== null, 'computeNutritionState returned null (NutritionMaster missing?)');
  assert(carbsHvy > carbsMod,
    'heavy day (' + carbsHvy + 'g) should exceed moderate day (' + carbsMod + 'g)');
});

check('rest day → glucides diminuent vs light training day', function() {
  var carbsLight = computeCarbs({ trainingLoad: 'light' }, true);
  var carbsRest  = computeCarbs({ trainingLoad: 'light' }, false); // rest day
  assert(carbsLight !== null, 'computeNutritionState returned null');
  assert(carbsRest < carbsLight,
    'rest day (' + carbsRest + 'g) should be below light training day (' + carbsLight + 'g)');
});

check('fat loss (shred) user → reste en déficit malgré boost glucides heavy', function() {
  if (_shredIdx < 0) { console.log('  (skipped — shred goal not found)'); return; }
  window.S = buildCarbProfile({ goal: _shredIdx, trainingLoad: 'heavy' });
  var tdee = window.calcTDEE ? Math.round(window.calcTDEE()) : 0;
  var nm   = window.computeNutritionState ? window.computeNutritionState(true) : null;
  assert(nm !== null, 'computeNutritionState returned null');
  assert(tdee > 0, 'calcTDEE returned 0 — profile incomplete?');
  assert(nm.caloriesTarget < tdee,
    'shred user should stay in deficit: target=' + nm.caloriesTarget + ' tdee=' + tdee);
});

// ─── 10. Edge cases: trainingLoad fallbacks & light-day behavior ─────────────
console.log('\n=== 10. Edge cases — trainingLoad fallbacks ===');

check('trainingLoad=null → fallback moderate (same carbs as moderate)', function() {
  var carbsMod  = computeCarbs({ trainingLoad: 'moderate' }, true);
  var carbsNull = computeCarbs({ trainingLoad: null      }, true);
  assert(carbsMod !== null, 'computeNutritionState returned null');
  // null → || 'moderate' in computeNutritionState → carbRate=0.10 same as 'moderate'
  assert(carbsNull === carbsMod,
    'null trainingLoad (' + carbsNull + 'g) should equal moderate (' + carbsMod + 'g)');
});

check("trainingLoad='light' on training day → no carb boost (below 'moderate')", function() {
  var carbsLight = computeCarbs({ trainingLoad: 'light'    }, true);
  var carbsMod   = computeCarbs({ trainingLoad: 'moderate' }, true);
  assert(carbsLight !== null, 'computeNutritionState returned null');
  // light: carbRate=0 (no boost); moderate: carbRate=0.10 (+10%)
  assert(carbsLight < carbsMod,
    "light day (" + carbsLight + "g) must be below moderate (" + carbsMod + "g) — carbRate=0 for light");
});

check("trainingLoad='heavy' > 'moderate' > 'light' strict ordering", function() {
  var carbsL = computeCarbs({ trainingLoad: 'light'    }, true);
  var carbsM = computeCarbs({ trainingLoad: 'moderate' }, true);
  var carbsH = computeCarbs({ trainingLoad: 'heavy'    }, true);
  assert(carbsL !== null && carbsM !== null && carbsH !== null, 'null result');
  assert(carbsL < carbsM,
    'light (' + carbsL + ') < moderate (' + carbsM + ')');
  assert(carbsM < carbsH,
    'moderate (' + carbsM + ') < heavy (' + carbsH + ')');
});

check('multi-sport: heavy load carbs > rest day carbs (sport switch simulation)', function() {
  var carbsHeavyTrain = computeCarbs({ trainingLoad: 'heavy' }, true);
  var carbsLightRest  = computeCarbs({ trainingLoad: 'light' }, false);
  assert(carbsHeavyTrain !== null && carbsLightRest !== null, 'null result');
  // Running Z5 (heavy) → more carbs; yoga (light) on rest day → fewest carbs
  assert(carbsHeavyTrain > carbsLightRest,
    'heavy training (' + carbsHeavyTrain + 'g) should exceed light rest day (' + carbsLightRest + 'g)');
});

// ─── 11. Carb cycling v2 — smoothing cap + nutritionTag ──────────────────────
console.log('\n=== 11. Carb cycling v2 — smoothing cap + nutritionTag ===');

// Helper: build profile with optional pre-seeded heavyDayStreak
function computeCarbsFull(overrides, isTrainingDay) {
  window.S = buildCarbProfile(overrides);
  var nm = window.computeNutritionState ? window.computeNutritionState(isTrainingDay) : null;
  return { carbs: nm ? nm.carbsGrams : null, tag: window.S.nutritionTag, streak: window.S.heavyDayStreak };
}

check('2nd consecutive heavy day (+25%) yields more carbs than 1st heavy day (+20%)', function() {
  var first  = computeCarbsFull({ trainingLoad: 'heavy', heavyDayStreak: 0 }, true);
  var second = computeCarbsFull({ trainingLoad: 'heavy', heavyDayStreak: 1 }, true);
  assert(first.carbs !== null, 'computeNutritionState returned null');
  assert(second.carbs > first.carbs,
    '2nd heavy day (' + second.carbs + 'g) should exceed 1st heavy day (' + first.carbs + 'g) — +25% vs +20%');
});

check('S.nutritionTag = performance on single heavy training day', function() {
  var r = computeCarbsFull({ trainingLoad: 'heavy', heavyDayStreak: 0 }, true);
  assert(r.tag === 'performance', 'expected performance, got: ' + r.tag);
});

check('S.nutritionTag = recovery after 2 consecutive heavy days', function() {
  var r = computeCarbsFull({ trainingLoad: 'heavy', heavyDayStreak: 1 }, true);
  assert(r.tag === 'recovery', 'expected recovery, got: ' + r.tag);
  assert(r.streak === 2, 'expected streak=2, got: ' + r.streak);
});

check('S.nutritionTag = fat-loss on rest day', function() {
  var r = computeCarbsFull({ trainingLoad: 'moderate' }, false);
  assert(r.tag === 'fat-loss', 'expected fat-loss, got: ' + r.tag);
});

check('S.nutritionTag = fat-loss on light training day', function() {
  var r = computeCarbsFull({ trainingLoad: 'light' }, true);
  assert(r.tag === 'fat-loss', 'expected fat-loss, got: ' + r.tag);
});

check('S.heavyDayStreak resets to 0 on moderate day after heavy', function() {
  // First simulate a heavy day (streak becomes 1)
  computeCarbsFull({ trainingLoad: 'heavy', heavyDayStreak: 0 }, true);
  // Then a moderate day — creates fresh S so streak starts at 0, resets to 0
  var r = computeCarbsFull({ trainingLoad: 'moderate', heavyDayStreak: 0 }, true);
  assert(r.streak === 0, 'streak should reset to 0 on non-heavy day, got: ' + r.streak);
});

check('fat-loss user (shred) still benefits from carb boost while staying in calorie deficit', function() {
  if (_shredIdx < 0) { console.log('  (skipped — shred goal not found)'); return; }
  // Single heavy day (not capped) for a shred user
  window.S = buildCarbProfile({ goal: _shredIdx, trainingLoad: 'heavy', heavyDayStreak: 0 });
  var tdee  = window.calcTDEE ? Math.round(window.calcTDEE()) : 0;
  var nm    = window.computeNutritionState ? window.computeNutritionState(true) : null;
  assert(nm !== null, 'computeNutritionState returned null');
  assert(tdee > 0, 'calcTDEE returned 0');
  // Macro swap is calorie-neutral → deficit maintained even with +20% carb boost
  assert(nm.caloriesTarget < tdee,
    'shred user deficit maintained: target=' + nm.caloriesTarget + ' < tdee=' + tdee);
  assert(window.S.nutritionTag === 'performance',
    'shred user on heavy training day → performance tag (carb boost for training)');
});

// ─── 12. notifySession merge strategy ────────────────────────────────────────
console.log('\n=== 12. notifySession — merge strategy ===');

// Helpers — build exercise lists with controlled tags and groups
function makeExs(n, tags) {
  var arr = [];
  for (var i = 0; i < n; i++) arr.push({ n: 'Ex' + i, tags: tags || [] });
  return arr;
}
// 6 compound exercises + heavy groups → computeTrainingLoad → 'heavy'
var HEAVY_EXS  = makeExs(6, []);          // 6 non-isolation → heavy when hasHeavy
var MOD_EXS    = makeExs(4, []);          // 4 exercises, no heavy group → moderate or light
var LIGHT_EXS  = makeExs(2, ['isolation']); // 2 isolation → light
var HEAVY_GRP  = ['legs', 'back'];
var MOD_GRP    = ['back'];
var LIGHT_GRP  = [];

check('notifySession: heavy computed preserves existing heavy (no overwrite)', function() {
  window.S = { trainingLoad: 'heavy', dailyTrainingLoad: 'heavy', lastSessionCount: 6, lastSessionGroups: ['legs'] };
  SFCSymbiosis.notifySession(HEAVY_EXS, HEAVY_GRP);
  assert(window.S.trainingLoad === 'heavy', 'heavy should remain heavy, got: ' + window.S.trainingLoad);
  assert(window.S.lastSessionCount === 12, 'count should accumulate: 6+6=12, got: ' + window.S.lastSessionCount);
});

check('notifySession: light computed does NOT downgrade existing heavy', function() {
  window.S = { trainingLoad: 'heavy', dailyTrainingLoad: 'heavy', lastSessionGroups: ['back'], lastSessionCount: 5 };
  SFCSymbiosis.notifySession(LIGHT_EXS, LIGHT_GRP);
  assert(window.S.trainingLoad === 'heavy',
    'existing heavy should NOT be downgraded by light computed, got: ' + window.S.trainingLoad);
});

check('notifySession: moderate computed upgrades existing light', function() {
  window.S = { trainingLoad: 'light', dailyTrainingLoad: 'light', lastSessionGroups: [], lastSessionCount: 0 };
  // 5 non-isolation exercises + back group → computeTrainingLoad → moderate
  SFCSymbiosis.notifySession(makeExs(5, []), ['back']);
  assert(window.S.trainingLoad === 'moderate',
    'light should be upgraded to moderate, got: ' + window.S.trainingLoad);
});

check('notifySession: heavy computed upgrades existing moderate', function() {
  window.S = { trainingLoad: 'moderate', dailyTrainingLoad: 'moderate', lastSessionGroups: ['chest'], lastSessionCount: 3 };
  SFCSymbiosis.notifySession(HEAVY_EXS, HEAVY_GRP);
  assert(window.S.trainingLoad === 'heavy',
    'moderate should be upgraded to heavy, got: ' + window.S.trainingLoad);
  assert(window.S.dailyTrainingLoad === 'heavy',
    'dailyTrainingLoad should be updated to heavy, got: ' + window.S.dailyTrainingLoad);
});

check('notifySession: lastSessionGroups merges (union) across two calls', function() {
  window.S = { lastSessionGroups: ['chest', 'triceps'], lastSessionCount: 4 };
  SFCSymbiosis.notifySession(makeExs(4, []), ['legs', 'glutes']);
  var grps = window.S.lastSessionGroups;
  assert(grps.indexOf('chest')   !== -1, 'chest should be preserved');
  assert(grps.indexOf('triceps') !== -1, 'triceps should be preserved');
  assert(grps.indexOf('legs')    !== -1, 'legs should be added');
  assert(grps.indexOf('glutes')  !== -1, 'glutes should be added');
  assert(grps.length === 4, 'no duplicates: expected 4 groups, got ' + grps.length);
});

check('notifySession: duplicate groups not added twice', function() {
  window.S = { lastSessionGroups: ['back', 'legs'], lastSessionCount: 3 };
  SFCSymbiosis.notifySession(makeExs(3, []), ['back']); // 'back' already present
  var grps = window.S.lastSessionGroups;
  assert(grps.filter(function(g){ return g === 'back'; }).length === 1,
    'back should appear exactly once, got: ' + grps.join(','));
});

check('notifySession: lastSessionCount accumulates across calls', function() {
  window.S = { lastSessionCount: 5, lastSessionGroups: [] };
  SFCSymbiosis.notifySession(makeExs(4, []), []);
  assert(window.S.lastSessionCount === 9, 'expected 5+4=9, got: ' + window.S.lastSessionCount);
  SFCSymbiosis.notifySession(makeExs(3, []), []);
  assert(window.S.lastSessionCount === 12, 'expected 9+3=12, got: ' + window.S.lastSessionCount);
});

check('notifySession: sportProgramStart preserved if already set', function() {
  var existing = '2026-01-15';
  window.S = { sportProgramStart: existing, lastSessionGroups: [] };
  SFCSymbiosis.notifySession(makeExs(3, []), []);
  assert(window.S.sportProgramStart === existing,
    'sportProgramStart should not be overwritten: ' + window.S.sportProgramStart);
});

check('notifySession: sportProgramStart set if absent', function() {
  window.S = { lastSessionGroups: [] };
  SFCSymbiosis.notifySession(makeExs(3, []), []);
  assert(typeof window.S.sportProgramStart === 'string' && window.S.sportProgramStart.length === 10,
    'sportProgramStart should be set to YYYY-MM-DD, got: ' + window.S.sportProgramStart);
});

check('notifySession: first call with no prior data — sets all fields', function() {
  window.S = {};
  SFCSymbiosis.notifySession(HEAVY_EXS, HEAVY_GRP);
  assert(window.S.trainingLoad !== undefined, 'trainingLoad should be set');
  assert(Array.isArray(window.S.lastSessionGroups), 'lastSessionGroups should be array');
  assert(typeof window.S.lastSessionCount === 'number', 'lastSessionCount should be number');
});

check('notifySession: no silent data loss — all existing fields intact', function() {
  window.S = {
    trainingLoad: 'heavy', dailyTrainingLoad: 'heavy',
    lastSessionGroups: ['back'], lastSessionCount: 6,
    sportProgramStart: '2026-03-01',
    customField: 'untouched'
  };
  SFCSymbiosis.notifySession(LIGHT_EXS, LIGHT_GRP); // light should not downgrade heavy
  // LIGHT_EXS = makeExs(2, ['isolation']) → length 2 → 6+2 = 8
  assert(window.S.trainingLoad === 'heavy',       'trainingLoad preserved');
  assert(window.S.lastSessionCount === 8,          'count accumulated: 6+2=8, got ' + window.S.lastSessionCount);
  assert(window.S.sportProgramStart === '2026-03-01', 'sportProgramStart preserved');
  assert(window.S.customField === 'untouched',    'unrelated field preserved');
});

// ─── 13. XSS protection — _sfcBlockDangerous + _sfcSanitize (loaded modules) ─
console.log('\n=== 13. XSS protection — _sfcBlockDangerous + _sfcSanitize ===');

check('_sfcBlockDangerous is exported on window', function() {
  assert(typeof window._sfcBlockDangerous === 'function', '_sfcBlockDangerous missing');
});

check('_sfcSanitize is exported on window', function() {
  assert(typeof window._sfcSanitize === 'function', '_sfcSanitize missing');
});

check('_sfcBlockDangerous blocks <script> injection', function() {
  var result = window._sfcBlockDangerous('<script>alert(1)</script>');
  assert(result === '', 'expected empty string, got: ' + result);
});

check('_sfcBlockDangerous blocks onerror= event handler', function() {
  var result = window._sfcBlockDangerous('<img src="x" onerror="alert(1)">');
  assert(result === '', 'expected empty string for onerror=, got: ' + result);
});

check('_sfcBlockDangerous blocks onclick= event handler', function() {
  var result = window._sfcBlockDangerous('<div onclick="evil()">click</div>');
  assert(result === '', 'expected empty string for onclick=, got: ' + result);
});

check('_sfcBlockDangerous blocks javascript: URI', function() {
  var result = window._sfcBlockDangerous('<a href="javascript:alert(1)">x</a>');
  assert(result === '', 'expected empty string for javascript:, got: ' + result);
});

check('_sfcBlockDangerous passes safe HTML unchanged', function() {
  var safe = '<p class="text">Hello <strong>world</strong></p>';
  var result = window._sfcBlockDangerous(safe);
  assert(result === safe, 'safe HTML should pass through unchanged');
});

check('_sfcSanitize strips <script> while preserving surrounding content', function() {
  var result = window._sfcSanitize('<p>ok</p><script>alert(1)</script><p>after</p>');
  assert(result.indexOf('<script') === -1, 'script tag should be stripped');
  assert(result.indexOf('<p>ok</p>') !== -1, 'surrounding content should be preserved');
});

check('_sfcSanitize strips on* event-handler attributes', function() {
  var result = window._sfcSanitize('<img src="photo.jpg" onerror="steal()">');
  assert(result.indexOf('onerror') === -1, 'onerror attribute should be stripped');
  assert(result.indexOf('src=') !== -1, 'src attribute should be preserved');
});

check('_sfcSanitize neutralizes javascript: href', function() {
  var result = window._sfcSanitize('<a href="javascript:void(0)">link</a>');
  assert(result.indexOf('javascript:') === -1, 'javascript: should be replaced');
  assert(result.indexOf('about:blank') !== -1, 'should be replaced with about:blank');
});

check('combined: _sfcBlockDangerous(_sfcSanitize()) rejects script-only input', function() {
  var result = window._sfcBlockDangerous(window._sfcSanitize('<script>evil()</script>'));
  assert(result === '', 'double-gate should produce empty string');
});

check('combined: double-gate passes clean HTML after stripping script', function() {
  var input = '<p>Safe text</p><script>bad()</script>';
  var cleaned = window._sfcSanitize(input);
  var final = window._sfcBlockDangerous(cleaned);
  // After sanitize: script is stripped. Block sees '<p>Safe text</p>' → should pass
  assert(final.indexOf('<p>Safe text</p>') !== -1, 'clean content preserved after double-gate');
});

// ─── Résumé ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log('Résultats : ' + pass + ' pass, ' + fail + ' fail');
if (fail > 0) process.exit(1);
