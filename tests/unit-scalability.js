'use strict';
/**
 * Test suite — Performance & Scalabilité
 * Couvre : débit NutritionMaster (100 appels), débit sfcBuildMuscuDay (50 appels),
 *          runDryRun full DB, déterminisme sous charge, pas de fuite mémoire,
 *          processCompletedSession (1000 sessions), SFCDecisionCore cache.
 */

var fs   = require('fs');
var path = require('path');
var vm   = require('vm');
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

function loadScript(relPath) {
  var src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  vm.runInThisContext(src, { filename: relPath });
}

// ─── Load modules ────────────────────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js',          'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js',            'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js',          'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js',      'utf8'));
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js',  'utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-symbiosis.js',     'utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-decision-core.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/exercises-db.js',      'utf8'));
loadScript('app/recipe-registry.js');
loadScript('app/recipe-engine.js');
loadScript('app/recipe-ux-engine.js');
loadScript('app/recipe-ux-explainer.js');
loadScript('app/recipe-auto-improver.js');

var NM   = window.NutritionMaster;
var SYM  = window.SFCSymbiosis;
var DC   = window.SFCDecisionCore;
var RE   = window.RecipeEngine;
var RAI  = window.RecipeAutoImprover;
var { sfcBuildMuscuDay } = require(ROOT + '/app/muscu-engine.js');

function resetS() {
  window.S = {
    trainingLoad: null, dailyTrainingLoad: null,
    lastSessionGroups: [], lastSessionDate: null, lastSessionCount: 0,
    sportProgramStart: null, sessionFeedback: null,
    muscuSessionLog: {}, customSessionHistory: [],
    _nm: null, goal: null, sex: 'male', weight: 80,
    _processedSessionIds: {}, trainingWeekContext: []
  };
}
resetS();

// ─── Profils variés pour les tests de charge ─────────────────────────────────
var PROFILES = [
  { gender:'male',   age:25, weightKg:75,  heightCm:178, activityLevel:1.55, goal:'bulk' },
  { gender:'female', age:30, weightKg:60,  heightCm:165, activityLevel:1.375, goal:'cut' },
  { gender:'male',   age:45, weightKg:100, heightCm:185, activityLevel:1.725, goal:'maintain' },
  { gender:'female', age:22, weightKg:50,  heightCm:158, activityLevel:1.2,  goal:'shred' },
  { gender:'male',   age:35, weightKg:85,  heightCm:182, activityLevel:1.55, goal:'lean_bulk' },
  { gender:'female', age:28, weightKg:70,  heightCm:170, activityLevel:1.9,  goal:'recomposition' },
  { gender:'male',   age:60, weightKg:90,  heightCm:175, activityLevel:1.375, goal:'maintain' },
  { gender:'female', age:18, weightKg:55,  heightCm:162, activityLevel:2.0,  goal:'bulk' },
  { gender:'male',   age:40, weightKg:120, heightCm:190, activityLevel:1.55, goal:'cut' },
  { gender:'female', age:50, weightKg:65,  heightCm:168, activityLevel:1.725, goal:'lean_bulk' }
];

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. NutritionMaster — 100 compute() appels < 500ms ===');
// ══════════════════════════════════════════════════════════════════════════════

check('100 appels NutritionMaster.compute < 500ms', function(){
  var t0 = Date.now();
  for (var i = 0; i < 100; i++) {
    var p = PROFILES[i % PROFILES.length];
    NM.compute(Object.assign({}, p, { trainingDay: i % 2 === 0 }));
  }
  var elapsed = Date.now() - t0;
  assert(elapsed < 500, '100 compute() en ' + elapsed + 'ms (limit 500ms)');
  console.log('    → ' + elapsed + 'ms pour 100 appels');
});

check('Chaque compute() < 10ms en moyenne', function(){
  var total = 0;
  for (var i = 0; i < 50; i++) {
    var p = PROFILES[i % PROFILES.length];
    var t0 = Date.now();
    NM.compute(Object.assign({}, p));
    total += Date.now() - t0;
  }
  var avg = total / 50;
  assert(avg < 10, 'moyenne=' + avg.toFixed(2) + 'ms (limit 10ms)');
  console.log('    → moyenne ' + avg.toFixed(2) + 'ms/appel');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. sfcBuildMuscuDay — 50 séances < 500ms ===');
// ══════════════════════════════════════════════════════════════════════════════

var EXERCISES = window.EXERCISES || {};
var GROUP_COMBOS = [
  ['chest','back'],
  ['legs','glutes'],
  ['shoulders','arms'],
  ['chest','shoulders','arms'],
  ['back','legs']
];

check('50 appels sfcBuildMuscuDay < 500ms', function(){
  var t0 = Date.now();
  for (var i = 0; i < 50; i++) {
    var grps = GROUP_COMBOS[i % GROUP_COMBOS.length];
    sfcBuildMuscuDay(grps, { exercises: EXERCISES, durMax: 6, durSets: 4, maxLv: 10 });
  }
  var elapsed = Date.now() - t0;
  assert(elapsed < 500, '50 séances en ' + elapsed + 'ms (limit 500ms)');
  console.log('    → ' + elapsed + 'ms pour 50 séances');
});

check('Chaque sfcBuildMuscuDay retourne un tableau', function(){
  for (var i = 0; i < 20; i++) {
    var grps = GROUP_COMBOS[i % GROUP_COMBOS.length];
    var result = sfcBuildMuscuDay(grps, { exercises: EXERCISES, durMax: 6, durSets: 4, maxLv: 10 });
    assert(Array.isArray(result), 'sfcBuildMuscuDay doit retourner un tableau');
  }
});

check('sfcBuildMuscuDay durMax respecté sur 20 séances', function(){
  for (var i = 0; i < 20; i++) {
    var durMax = (i % 3 === 0) ? 4 : (i % 3 === 1) ? 5 : 6;
    var grps = GROUP_COMBOS[i % GROUP_COMBOS.length];
    var result = sfcBuildMuscuDay(grps, { exercises: EXERCISES, durMax: durMax, durSets: 4, maxLv: 10 });
    assert(result.length <= durMax, 'length=' + result.length + ' > durMax=' + durMax);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. RecipeAutoImprover — runDryRun full DB < 3000ms ===');
// ══════════════════════════════════════════════════════════════════════════════

check('runDryRun sur DB complète < 3000ms', function(){
  var t0 = Date.now();
  var result = RAI.runDryRun({});
  var elapsed = Date.now() - t0;
  assert(elapsed < 3000, 'runDryRun en ' + elapsed + 'ms (limit 3000ms)');
  console.log('    → ' + elapsed + 'ms pour ' + result.analyzed + ' recettes analysées');
});

check('runDryRun.analyzed est un nombre ≥ 0', function(){
  var result = RAI.runDryRun({});
  assert(typeof result.analyzed === 'number' && result.analyzed >= 0, 'analyzed=' + result.analyzed);
});

check('runDryRun 3 appels consécutifs stables (RECIPES_DB non muté)', function(){
  var n1 = RE.RECIPES_DB.length;
  RAI.runDryRun({});
  RAI.runDryRun({});
  RAI.runDryRun({});
  var n2 = RE.RECIPES_DB.length;
  assert(n1 === n2, 'RECIPES_DB changé: ' + n1 + ' → ' + n2);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. NutritionMaster — déterminisme sous charge ===');
// ══════════════════════════════════════════════════════════════════════════════

check('NutritionMaster déterministe sur 100 répétitions (même profil)', function(){
  var inp = { gender:'male', age:35, weightKg:85, heightCm:182, activityLevel:1.55, goal:'lean_bulk' };
  var ref = NM.compute(inp);
  for (var i = 0; i < 100; i++) {
    var r = NM.compute(inp);
    assert(r.caloriesTarget === ref.caloriesTarget &&
           r.proteinGrams   === ref.proteinGrams &&
           r.carbsGrams     === ref.carbsGrams &&
           r.fatGrams       === ref.fatGrams,
      'résultat différent à l\'itération ' + i);
  }
});

check('10 profils différents × 10 répétitions → déterministe', function(){
  var refs = PROFILES.map(function(p){ return NM.compute(p); });
  for (var rep = 0; rep < 10; rep++) {
    PROFILES.forEach(function(p, i) {
      var r = NM.compute(p);
      assert(r.caloriesTarget === refs[i].caloriesTarget,
        'profil ' + i + ' non déterministe à rep=' + rep);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. SFCSymbiosis — processCompletedSession 200 sessions ===');
// ══════════════════════════════════════════════════════════════════════════════

check('200 processCompletedSession < 1000ms', function(){
  resetS();
  var t0 = Date.now();
  for (var i = 0; i < 200; i++) {
    SYM.processCompletedSession({
      sessionId: 'perf-sess-' + i,
      exercises: [{ n:'Squat', tags:['compound'], _grp:'legs' }],
      groups: ['legs'],
      date: new Date(Date.now() - i * 86400000).toISOString()
    });
  }
  var elapsed = Date.now() - t0;
  assert(elapsed < 1000, '200 sessions en ' + elapsed + 'ms (limit 1000ms)');
  console.log('    → ' + elapsed + 'ms pour 200 sessions');
});

check('_processedSessionIds bornée ≤ 365 après 200 sessions', function(){
  resetS();
  for (var i = 0; i < 200; i++) {
    SYM.processCompletedSession({
      sessionId: 'bound-sess-' + i,
      exercises: [{ n:'Bench', tags:['compound'], _grp:'chest' }],
      groups: ['chest'],
      date: new Date().toISOString()
    });
  }
  var ids = window.S._processedSessionIds || {};
  assert(Object.keys(ids).length <= 365, 'taille _processedSessionIds=' + Object.keys(ids).length);
});

check('trainingWeekContext bornée ≤ 14 jours après 200 sessions', function(){
  resetS();
  for (var i = 0; i < 200; i++) {
    SYM.processCompletedSession({
      sessionId: 'ctx-' + i,
      exercises: [{ n:'DL', tags:['compound'], _grp:'back' }],
      groups: ['back'],
      date: new Date(Date.now() - i * 3600000).toISOString()
    });
  }
  var ctx = window.S.trainingWeekContext || [];
  assert(ctx.length <= 14, 'trainingWeekContext.length=' + ctx.length);
});

check('idempotence sur 500 appels même sessionId', function(){
  resetS();
  var sess = {
    sessionId: 'idem-perf-1',
    exercises: [{ n:'OHP', tags:['compound'], _grp:'shoulders' }],
    groups: ['shoulders'],
    date: new Date().toISOString()
  };
  SYM.processCompletedSession(sess);
  var snap1 = JSON.stringify(window.S.trainingWeekContext);
  for (var i = 0; i < 499; i++) SYM.processCompletedSession(sess);
  var snap2 = JSON.stringify(window.S.trainingWeekContext);
  assert(snap1 === snap2, 'trainingWeekContext changé malgré idempotence');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. SFCDecisionCore — cache et invalidation ===');
// ══════════════════════════════════════════════════════════════════════════════

check('getDecision retourne un objet non-null', function(){
  resetS();
  var d = DC.getDecision();
  assert(d !== null && d !== undefined, 'getDecision retourne null');
});

check('invalidate → getDecision recalcule', function(){
  resetS();
  var d1 = DC.getDecision();
  DC.invalidate();
  assert(window.S._decisionCore === null || window.S._decisionCore === undefined,
    '_decisionCore devrait être null après invalidate');
});

check('50 appels getDecision consécutifs < 500ms', function(){
  resetS();
  var t0 = Date.now();
  for (var i = 0; i < 50; i++) {
    DC.getDecision();
  }
  var elapsed = Date.now() - t0;
  assert(elapsed < 500, '50 getDecision en ' + elapsed + 'ms (limit 500ms)');
  console.log('    → ' + elapsed + 'ms pour 50 getDecision');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. NutritionMaster — tous les planchers respectés sous charge ===');
// ══════════════════════════════════════════════════════════════════════════════

check('KCAL plancher respecté sur 100 profils variés', function(){
  for (var i = 0; i < 100; i++) {
    var p = PROFILES[i % PROFILES.length];
    var r = NM.compute(Object.assign({}, p, { goal: 'shred' }));
    var floor = p.gender === 'female' ? 1400 : 1500;
    assert(r.caloriesTarget >= floor,
      'plancher violé profil ' + i + ': ' + r.caloriesTarget + ' < ' + floor);
  }
});

check('carbsGrams ≥ 130g sur 100 profils variés', function(){
  for (var i = 0; i < 100; i++) {
    var p = PROFILES[i % PROFILES.length];
    var r = NM.compute(Object.assign({}, p));
    assert(r.carbsGrams >= 130, 'carbsGrams=' + r.carbsGrams + ' < 130 profil ' + i);
  }
});

check('fatGrams ≥ 0.8×weightKg sur 100 profils variés', function(){
  for (var i = 0; i < 100; i++) {
    var p = PROFILES[i % PROFILES.length];
    var r = NM.compute(Object.assign({}, p, { goal: 'shred' }));
    var minFat = 0.8 * p.weightKg;
    assert(r.fatGrams >= minFat - 0.5,
      'fatGrams=' + r.fatGrams + ' < minFat=' + minFat + ' profil ' + i);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 8. SFCSymbiosis — LOAD_MULTIPLIERS invariants sous 1000 appels ===');
// ══════════════════════════════════════════════════════════════════════════════

check('getLoadMultipliers heavy.cal stable sur 1000 appels', function(){
  var LM = SYM.LOAD_MULTIPLIERS;
  for (var i = 0; i < 1000; i++) {
    var m = SYM.getLoadMultipliers(true, 'heavy');
    assert(m.cal === LM.heavy.cal, 'heavy.cal changé à l\'itération ' + i);
  }
});

check('computeTrainingLoad stable avec même input sur 500 appels', function(){
  var exos = [
    { n:'Squat',    tags:['compound','legs'], _grp:'legs' },
    { n:'DL',       tags:['compound','back'], _grp:'back' },
    { n:'Bench',    tags:['compound','chest'], _grp:'chest' },
    { n:'OHP',      tags:['compound','shoulders'], _grp:'shoulders' },
    { n:'Row',      tags:['compound','back'], _grp:'back' },
    { n:'Pull-up',  tags:['compound','back'], _grp:'back' }
  ];
  var ref = SYM.computeTrainingLoad(exos, ['legs','back','chest','shoulders']);
  for (var i = 0; i < 500; i++) {
    var r = SYM.computeTrainingLoad(exos, ['legs','back','chest','shoulders']);
    assert(r === ref, 'computeTrainingLoad différent à ' + i + ': ' + r + ' vs ' + ref);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 9. RecipeEngine — RECIPES_DB intégrité structurelle ===');
// ══════════════════════════════════════════════════════════════════════════════

check('Toutes les recettes ont un identifiant non-null', function(){
  RE.RECIPES_DB.forEach(function(r, i) {
    var id = r.id !== undefined ? r.id : (r.k !== undefined ? 'k:' + r.k : null);
    assert(id !== null && id !== undefined, 'recette[' + i + '] sans id');
  });
});

check('Toutes les recettes ont des calories > 0', function(){
  RE.RECIPES_DB.forEach(function(r, i) {
    var cal = r.baseNutrition ? r.baseNutrition.calories : (r.k || 0);
    assert(cal > 0, 'recette[' + i + '] calories=' + cal);
  });
});

check('RECIPES_DB.length stable à travers 3 runDryRun', function(){
  var n = RE.RECIPES_DB.length;
  RAI.runDryRun({});
  assert(RE.RECIPES_DB.length === n, 'après run 1: ' + RE.RECIPES_DB.length);
  RAI.runDryRun({});
  assert(RE.RECIPES_DB.length === n, 'après run 2: ' + RE.RECIPES_DB.length);
  RAI.runDryRun({});
  assert(RE.RECIPES_DB.length === n, 'après run 3: ' + RE.RECIPES_DB.length);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 10. sfcBuildMuscuDay — aucun doublon sur 100 séances ===');
// ══════════════════════════════════════════════════════════════════════════════

check('Aucun doublon de nom (e.n) sur 100 séances générées', function(){
  for (var i = 0; i < 100; i++) {
    var grps = GROUP_COMBOS[i % GROUP_COMBOS.length];
    var result = sfcBuildMuscuDay(grps, {
      exercises: EXERCISES, durMax: 6, durSets: 4, maxLv: 10,
      cycleFactor: 0.8 + (i % 3) * 0.1
    });
    var names = result.map(function(e){ return e.n; });
    var uniq  = names.filter(function(n, idx){ return names.indexOf(n) === idx; });
    assert(names.length === uniq.length,
      'doublon dans séance ' + i + ': ' + names.join(','));
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Résultat final
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log('Scalabilité : ' + pass + ' passed, ' + fail + ' failed');
console.log('═'.repeat(60) + '\n');
if (fail > 0) process.exit(1);
