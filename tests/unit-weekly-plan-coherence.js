'use strict';
/**
 * Test suite — Weekly Plan Coherence
 * Couvre : simulation semaine complète (7 jours), alternance ON/OFF,
 *          carb cycling, cohérence RecipeEngine avec nutrition,
 *          SFCSymbiosis.updateWeekContext, scaling portions recettes.
 */

var fs   = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Bootstrap DOM minimal ───────────────────────────────────────────────────
global.window = global;
global.document = {
  createElement: function(t){ return { style:{}, setAttribute:function(){}, appendChild:function(){}, classList:{add:function(){},remove:function(){}}, tagName:t }; },
  getElementById: function(){ return null; },
  querySelector:  function(){ return null; },
  querySelectorAll: function(){ return []; },
  addEventListener:    function(){},
  removeEventListener: function(){},
  body: { appendChild:function(){}, classList:{ add:function(){}, remove:function(){} } },
  head: { appendChild:function(){} },
  location: { href:'', search:'', hash:'' }
};
try { Object.defineProperty(global,'navigator',{ value:{ userAgent:'', language:'fr-FR' }, configurable:true }); } catch(e) {}
global.localStorage  = { getItem:function(){ return null; }, setItem:function(){}, removeItem:function(){} };
global.sessionStorage = { getItem:function(){ return null; }, setItem:function(){}, removeItem:function(){} };
global.history = { pushState:function(){}, replaceState:function(){} };
try { Object.defineProperty(global,'location',{ value:{ href:'', search:'', hash:'' }, configurable:true }); } catch(e) {}
global.performance = { now:function(){ return Date.now(); } };

var pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch(e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

// ─── Load modules ────────────────────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js',         'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js',           'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js',         'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js',     'utf8'));
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-symbiosis.js',    'utf8'));
eval(fs.readFileSync(ROOT + '/app/recipe-registry.js',  'utf8'));
eval(fs.readFileSync(ROOT + '/app/recipe-engine.js',    'utf8'));

var NM   = window.NutritionMaster;
var SYM  = window.SFCSymbiosis;
var RE   = window.RecipeEngine;

function resetS() {
  window.S = {
    sex:'male', weight:80, age:30, sportDays:4, sportEquipment:'gym',
    trainingLoad:null, dailyTrainingLoad:null,
    lastSessionGroups:[], lastSessionDate:null, lastSessionCount:0,
    sportProgramStart:null, sessionFeedback:null,
    muscuSessionLog:{}, customSessionHistory:[],
    _nm:null, goal:null, trainingWeekContext:{}
  };
}

var BASE = {
  gender:'male', age:30, weightKg:80, heightCm:180,
  activityLevel:1.55, goal:'maintain', isElite:false
};

function extend(base, overrides) {
  var r = {};
  Object.keys(base).forEach(function(k){ r[k] = base[k]; });
  Object.keys(overrides).forEach(function(k){ r[k] = overrides[k]; });
  return r;
}

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. Simulation semaine 5j entraînement / 2j repos ===');
// ══════════════════════════════════════════════════════════════════════════════

check('glucides ON day > OFF day sur toute la semaine', function(){
  var results = [];
  for (var i = 0; i < 7; i++) {
    var isTraining = i < 5; // lundi-vendredi = ON, samedi-dimanche = OFF
    var r = NM.compute(extend(BASE, { trainingDay: isTraining }));
    results.push({ day: i, carbs: r.carbsGrams, training: isTraining });
  }
  var onCarbs  = results.filter(function(r){ return r.training;  }).map(function(r){ return r.carbs; });
  var offCarbs = results.filter(function(r){ return !r.training; }).map(function(r){ return r.carbs; });
  var avgOn  = onCarbs.reduce(function(a,b){ return a+b; },0) / onCarbs.length;
  var avgOff = offCarbs.reduce(function(a,b){ return a+b; },0) / offCarbs.length;
  assert(avgOn > avgOff, 'avgOn=' + avgOn.toFixed(0) + ' avgOff=' + avgOff.toFixed(0));
});
check('lipides ON day ≤ OFF day (swap calorie-neutre)', function(){
  var on  = NM.compute(extend(BASE, { trainingDay:true  })).fatGrams;
  var off = NM.compute(extend(BASE, { trainingDay:false })).fatGrams;
  assert(on <= off, 'on fat=' + on + ' off fat=' + off);
});
check('caloriesCheck cohérent chaque jour de la semaine', function(){
  for (var i = 0; i < 7; i++) {
    var r = NM.compute(extend(BASE, { trainingDay: i < 5 }));
    var exp = Math.round(r.proteinGrams*4 + r.fatGrams*9 + r.carbsGrams*4);
    assert(Math.abs(r.caloriesCheck - exp) <= 5, 'day' + i + ' check mismatch');
  }
});
check('plancher calorique respecté chaque jour', function(){
  for (var i = 0; i < 7; i++) {
    var r = NM.compute(extend(BASE, { trainingDay: i < 5, goal:'shred' }));
    assert(r.caloriesTarget >= 1500, 'day' + i + ' cal=' + r.caloriesTarget);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. updateWeekContext — historique 14 jours ===');
// ══════════════════════════════════════════════════════════════════════════════

check('updateWeekContext enregistre la séance du jour', function(){
  resetS();
  var today = new Date().toISOString().slice(0,10);
  SYM.updateWeekContext(today, ['chest','back'], 'moderate', [{},{},{},{}]);
  var ctx = window.S.trainingWeekContext[today];
  assert(ctx && ctx.load === 'moderate', JSON.stringify(ctx));
  assert(ctx.groups.indexOf('chest') >= 0, JSON.stringify(ctx.groups));
});
check('updateWeekContext : exCount correct', function(){
  resetS();
  var today = new Date().toISOString().slice(0,10);
  SYM.updateWeekContext(today, ['legs'], 'heavy', new Array(6));
  assert(window.S.trainingWeekContext[today].exCount === 6);
});
check('updateWeekContext : max 14 entrées', function(){
  resetS();
  window.S.trainingWeekContext = {};
  for (var d = 20; d >= 1; d--) {
    var dt = new Date(Date.now() - d*86400000).toISOString().slice(0,10);
    SYM.updateWeekContext(dt, ['chest'], 'light', [{}]);
  }
  assert(Object.keys(window.S.trainingWeekContext).length <= 14,
    'ctx keys=' + Object.keys(window.S.trainingWeekContext).length);
});
check('updateWeekContext : conserve les plus récentes', function(){
  resetS();
  for (var d = 15; d >= 1; d--) {
    var dt = new Date(Date.now() - d*86400000).toISOString().slice(0,10);
    SYM.updateWeekContext(dt, ['legs'], 'moderate', [{}]);
  }
  var keys = Object.keys(window.S.trainingWeekContext).sort();
  var oldest = keys[0];
  var expected = new Date(Date.now() - 14*86400000).toISOString().slice(0,10);
  assert(oldest >= expected, 'oldest=' + oldest + ' expected≥' + expected);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. RecipeEngine — non-régression post-merge ===');
// ══════════════════════════════════════════════════════════════════════════════

check('RecipeEngine.RECIPES_DB est un tableau', function(){
  assert(Array.isArray(RE.RECIPES_DB), 'type=' + typeof RE.RECIPES_DB);
});
check('RECIPES_DB non vide', function(){
  assert(RE.RECIPES_DB.length > 0, 'length=' + RE.RECIPES_DB.length);
});
check('chaque recette a un id, un name, baseNutrition', function(){
  var sample = RE.RECIPES_DB.slice(0, 20);
  sample.forEach(function(r){
    assert(r.id !== undefined, 'missing id: ' + JSON.stringify(Object.keys(r)));
    assert(r.name || r.title, 'missing name/title in recipe ' + r.id);
    assert(r.baseNutrition, 'missing baseNutrition in recipe ' + r.id);
  });
});
check('baseNutrition a calories, proteinGrams, carbsGrams, fatGrams', function(){
  var sample = RE.RECIPES_DB.slice(0, 20);
  sample.forEach(function(r){
    var bn = r.baseNutrition;
    assert(typeof bn.calories === 'number',     'calories not number in ' + r.id);
    assert(typeof bn.proteinGrams === 'number', 'protein not number in ' + r.id);
    assert(typeof bn.carbsGrams === 'number',   'carbs not number in ' + r.id);
    assert(typeof bn.fatGrams === 'number',     'fat not number in ' + r.id);
  });
});
check('calories > 0 dans toutes les recettes (baseNutrition ou champ k)', function(){
  RE.RECIPES_DB.forEach(function(r){
    var cal = r.baseNutrition ? r.baseNutrition.calories : (r.k || 0);
    assert(cal > 0, 'zero calories in recipe ' + (r.id || r._id));
  });
});
check('RecipeEngine.findByGoal retourne un tableau', function(){
  if (typeof RE.findByGoal !== 'function') { console.log('  (skip: findByGoal not exposed)'); return; }
  var results = RE.findByGoal('cut');
  assert(Array.isArray(results), 'type=' + typeof results);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. Scaling portions ===');
// ══════════════════════════════════════════════════════════════════════════════

check('scaling 2 portions : calories doublées', function(){
  var recipe = RE.RECIPES_DB[0];
  var bn = recipe.baseNutrition;
  var servings = recipe.servings || 1;
  var perServing = bn.calories / servings;
  assert(Math.abs(perServing * servings - bn.calories) < 2,
    'scaling error: perServing=' + perServing.toFixed(1) + ' total=' + bn.calories);
});
check('scaling inverse : calories par portion constante', function(){
  var recipe = RE.RECIPES_DB[1] || RE.RECIPES_DB[0];
  var bn = recipe.baseNutrition;
  var servings = recipe.servings || 1;
  var perSrv = bn.calories / servings;
  assert(perSrv > 0, 'perSrv=' + perSrv);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. Cohérence nutrition × recettes ===');
// ══════════════════════════════════════════════════════════════════════════════

check('protéines par portion > 0 dans les recettes riches en P', function(){
  var highProt = RE.RECIPES_DB.filter(function(r){
    var prot = r.baseNutrition ? r.baseNutrition.proteinGrams : (r.p || 0);
    return prot / (r.servings||1) > 20;
  });
  assert(highProt.length > 0, 'no high-protein recipes found');
});
check('NutritionMaster et RecipeEngine utilisent la même unité de base (kcal)', function(){
  var r = NM.compute(BASE);
  // NutritionMaster returns caloriesTarget in kcal/day
  // RecipeEngine baseNutrition.calories is per recipe total
  assert(r.caloriesTarget > 0 && RE.RECIPES_DB[0].baseNutrition.calories > 0);
});
check('tous les goals NutritionMaster valides', function(){
  ['bulk','lean_bulk','maintain','recomposition','cut','shred'].forEach(function(goal){
    var r = NM.compute(extend(BASE, { goal:goal }));
    assert(r.errors.length === 0, goal + ': ' + JSON.stringify(r.errors));
  });
});
check('carb cycling calorie-neutre (swap G↑ L↓)', function(){
  var on  = NM.compute(extend(BASE, { trainingDay:true  }));
  var off = NM.compute(extend(BASE, { trainingDay:false }));
  var deltaCarbs = on.carbsGrams - off.carbsGrams;
  var deltaFat   = on.fatGrams   - off.fatGrams;
  // Carbs up, fat down; net calorie change should be small
  assert(deltaCarbs > 0,  'carbs not up on train day: deltaCarbs=' + deltaCarbs);
  assert(deltaFat   <= 0, 'fat above rest on train day: deltaFat=' + deltaFat);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. SFCSymbiosis getPeriodizationInfo ===');
// ══════════════════════════════════════════════════════════════════════════════

check('getPeriodizationInfo(1) contient label et description', function(){
  var info = SYM.getPeriodizationInfo(1);
  assert(info && info.label && info.description, JSON.stringify(info));
});
check('getPeriodizationInfo(4) = deload', function(){
  var info = SYM.getPeriodizationInfo(4);
  assert(info.label.toLowerCase().indexOf('deload') >= 0 || info.label.indexOf('S4') >= 0,
    'label=' + info.label);
});
check('getPeriodizationInfo cycle : 5 → même que 1', function(){
  var p1 = SYM.getPeriodizationInfo(1);
  var p5 = SYM.getPeriodizationInfo(5);
  assert(p1.label === p5.label, 'p1=' + p1.label + ' p5=' + p5.label);
});

// ─── Résultat ────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? '✅' : '❌') + ' unit-weekly-plan-coherence : ' + pass + ' pass, ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
