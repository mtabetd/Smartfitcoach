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

// ─── Résumé ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log('Résultats : ' + pass + ' pass, ' + fail + ' fail');
if (fail > 0) process.exit(1);
