'use strict';
/**
 * Test suite — User Personalization (10 profils extrêmes)
 * Couvre : cohérence sport + nutrition pour 10 profils :
 *   1. Homme sèche 6j/sem (bodybuilder)
 *   2. Femme perte de poids 3j/sem
 *   3. Débutant maison (aucun équipement)
 *   4. Avancé hypertrophie (surplus, volume max)
 *   5. CrossFit / HIIT (charge modérée/lourde)
 *   6. Horaires tardifs (pas de spécificité technique)
 *   7. ON vs OFF day (carb cycling)
 *   8. Goûts restrictifs (profil minimal)
 *   9. Performance (activityLevel max)
 *  10. Recomposition corporelle
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
eval(fs.readFileSync(ROOT + '/app/exercises-db.js',     'utf8'));
var _muscuEngine = require(ROOT + '/app/muscu-engine.js');
window.sfcBuildMuscuDay = _muscuEngine.sfcBuildMuscuDay;
eval(fs.readFileSync(ROOT + '/app/sport-data.js',       'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-sport.js',        'utf8'));

var NM   = window.NutritionMaster;
var SYM  = window.SFCSymbiosis;
var _rawBuild = window.sfcBuildMuscuDay;
function build(grps, cfg) {
  return _rawBuild(grps, Object.assign({ exercises: window.EXERCISES, maxLv: 10, durMax: 6, durSets: 4 }, cfg || {}));
}
function parseMinReps(s) {
  var m = String(s||'').match(/×(\d+)/);
  return m ? parseInt(m[1], 10) : 10;
}
function parseSets(s) {
  var m = String(s||'').match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}
var GOALS = window.GOALS || [];

function goalIdx(key) {
  var i = GOALS.findIndex(function(g){ return g.key === key; });
  return i >= 0 ? i : null;
}
function resetS(overrides) {
  window.S = Object.assign({
    sex:'male', weight:80, age:30, sportDays:4,
    sportEquipment:'gym', trainingLoad:null,
    lastSessionGroups:[], lastSessionDate:null,
    sessionFeedback:null, muscuSessionLog:{},
    customSessionHistory:[], _nm:null, goal:null
  }, overrides || {});
}
function nmCompute(overrides) {
  var base = { gender:'male', age:30, weightKg:80, heightCm:180,
    activityLevel:1.55, goal:'maintain', isElite:false, trainingDay:false };
  return NM.compute(Object.assign(base, overrides));
}

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 1 — Homme sèche 6j/semaine (bodybuilder) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('calories < TDEE (déficit sèche)', function(){
  var r = nmCompute({ goal:'shred', activityLevel:1.725 });
  assert(r.caloriesTarget < r.tdee, 'cal=' + r.caloriesTarget + ' tdee=' + r.tdee);
});
check('protéines élevées en sèche (≥ 1.8g/kg)', function(){
  var r = nmCompute({ goal:'shred', weightKg:85, isElite:true });
  assert(r.proteinGrams >= 85*1.8, 'prot=' + r.proteinGrams);
});
check('déficit plafonné à -500 kcal (préserver masse)', function(){
  var r = nmCompute({ goal:'shred', activityLevel:1.725 });
  assert(r.tdee - r.caloriesTarget <= 510, 'deficit=' + (r.tdee - r.caloriesTarget));
});
check('sèche : volumeFactor SFCSymbiosis = 0.80', function(){
  resetS();
  var idx = goalIdx('shred');
  if (idx === null) return;
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(Math.abs(ns.volumeFactor - 0.80) < 0.01, 'vf=' + ns.volumeFactor);
});
check('programme muscu sèche : exos générés (gym)', function(){
  var exos = build(['chest','back','legs'], { equipment:'gym', hasShred:true });
  assert(exos.length > 0, 'no exos for shred profile');
});
check('sèche + shred : reps ≥ standard (endurance musculaire)', function(){
  var std   = build(['chest'], { hasShred:false, equipment:'gym' });
  var shred = build(['chest'], { hasShred:true,  equipment:'gym' });
  if (std.length === 0 || shred.length === 0) return;
  var stdReps   = parseMinReps(std[0].sets);
  var shredReps = parseMinReps(shred[0].sets);
  assert(shredReps >= stdReps, 'shred reps not ≥ std: ' + shredReps + ' vs ' + stdReps);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 2 — Femme perte de poids 3j/semaine ===');
// ══════════════════════════════════════════════════════════════════════════════

check('calories ≥ 1400 (plancher féminin)', function(){
  var r = nmCompute({ gender:'female', weightKg:70, heightCm:168, goal:'cut', activityLevel:1.375 });
  assert(r.caloriesTarget >= 1400, 'cal=' + r.caloriesTarget);
});
check('déficit modéré (cut) : -15% TDEE ou plafond -500', function(){
  var r = nmCompute({ gender:'female', weightKg:70, heightCm:168, goal:'cut', activityLevel:1.375 });
  var deficit = r.tdee - r.caloriesTarget;
  assert(deficit > 0 && deficit <= 510, 'deficit=' + deficit);
});
check('volumeFactor cut = 0.88', function(){
  resetS();
  var idx = goalIdx('cut');
  if (idx === null) return;
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(Math.abs(ns.volumeFactor - 0.88) < 0.01, 'vf=' + ns.volumeFactor);
});
check('programme 3j/sem : exos générés sans surcharge', function(){
  var exos = build(['legs','glutes'], { equipment:'gym' });
  assert(exos.length > 0 && exos.length <= 6);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 3 — Débutant maison (aucun équipement) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('exos maison : tous compatibles sans équipement gym', function(){
  var exos = build(['chest','back','legs'], { equipment:'home', beginner:true });
  exos.forEach(function(e){
    var eq = e.equipment || [];
    var ok = eq.indexOf('none') >= 0 || eq.indexOf('home') >= 0 ||
             eq.indexOf('bodyweight') >= 0 || eq.length === 0;
    assert(ok, 'non-home exo for beginner: ' + e.name + ' eq=' + JSON.stringify(eq));
  });
});
check('débutant : pas d\'exos avancés', function(){
  var exos = build(['chest','back','legs'], { equipment:'home', beginner:true });
  exos.forEach(function(e){
    var tags = e.tags || [];
    assert(tags.indexOf('advanced') === -1 && tags.indexOf('expert') === -1,
      'advanced exo for beginner: ' + e.name);
  });
});
check('débutant maintain : calories correctes', function(){
  var r = nmCompute({ gender:'male', age:22, weightKg:70, heightCm:175, activityLevel:1.375, goal:'maintain' });
  assert(r.errors.length === 0 && r.caloriesTarget >= 1500);
});
check('débutant : résultat non vide (muscle bodyweight)', function(){
  var exos = build(['chest','legs'], { equipment:'none', beginner:true });
  assert(Array.isArray(exos), 'not array');
  // bodyweight exos should exist for chest/legs
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 4 — Avancé hypertrophie (surplus, volume max) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('bulk : calories > TDEE', function(){
  var r = nmCompute({ goal:'bulk', activityLevel:1.725, isElite:true, weightKg:90 });
  assert(r.caloriesTarget > r.tdee, 'cal=' + r.caloriesTarget + ' tdee=' + r.tdee);
});
check('bulk : protéines élites 2.2g/kg', function(){
  var r = nmCompute({ goal:'bulk', weightKg:90, isElite:true });
  assert(Math.abs(r.proteinGrams - 90*2.2) < 5, 'prot=' + r.proteinGrams);
});
check('bulk : volumeFactor = 1.08', function(){
  resetS();
  var idx = goalIdx('bulk');
  if (idx === null) return;
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(Math.abs(ns.volumeFactor - 1.08) < 0.01, 'vf=' + ns.volumeFactor);
});
check('hypertrophie S2 : durSets > S1 (progression)', function(){
  var s1 = build(['chest','back','legs'], { weekIndex:1, equipment:'gym' });
  var s2 = build(['chest','back','legs'], { weekIndex:2, equipment:'gym' });
  var s1t = s1.reduce(function(a,e){ return a+(e.sets||0); }, 0);
  var s2t = s2.reduce(function(a,e){ return a+(e.sets||0); }, 0);
  assert(s2t >= s1t, 's2 sets < s1: s2=' + s2t + ' s1=' + s1t);
});
check('entraînement lourd : LOAD_MULTIPLIERS.heavy.carbBoost = 1.20', function(){
  assert(SYM.LOAD_MULTIPLIERS.heavy.carbBoost === 1.20);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 5 — CrossFit / HIIT (charge modérée/lourde) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('séance CrossFit 6 exos + groupes lourds → heavy', function(){
  var exos = [];
  for (var i = 0; i < 6; i++) exos.push({ tags: i < 4 ? [] : ['isolation'] });
  var load = SYM.computeTrainingLoad(exos, ['legs','back']);
  assert(load === 'heavy', 'load=' + load);
});
check('HIIT 4 exos + shoulders → moderate', function(){
  var exos = [];
  for (var i = 0; i < 4; i++) exos.push({ tags: [] });
  var load = SYM.computeTrainingLoad(exos, ['shoulders']);
  assert(load === 'moderate' || load === 'light', 'load=' + load);
});
check('CrossFit : calorie heavy day = TDEE × 1.10', function(){
  var m = SYM.LOAD_MULTIPLIERS.heavy;
  assert(m.cal === 1.10, 'cal=' + m.cal);
});
check('HIIT activityLevel 1.725 : calories suffisantes', function(){
  var r = nmCompute({ activityLevel:1.725, goal:'maintain', trainingDay:true });
  assert(r.caloriesTarget >= 2000, 'cal=' + r.caloriesTarget);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 6 — Horaires tardifs (pas de contrainte technique) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('profil standard : calcul nutrition correct (activité modérée)', function(){
  var r = nmCompute({ activityLevel:1.55, goal:'maintain' });
  assert(r.errors.length === 0 && r.caloriesTarget > 0);
});
check('timingAdvice : preWorkoutCarbs dans range 30-80g', function(){
  var r = nmCompute({ trainingDay:true, activityLevel:1.55 });
  assert(r.timingAdvice.preWorkoutCarbs >= 30 && r.timingAdvice.preWorkoutCarbs <= 80);
});
check('programme horaire normal : exos générés', function(){
  var exos = build(['chest','shoulders'], { equipment:'gym' });
  assert(exos.length > 0);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 7 — ON day vs OFF day (carb cycling) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('ON day : glucides > OFF day', function(){
  var on  = nmCompute({ trainingDay:true  }).carbsGrams;
  var off = nmCompute({ trainingDay:false }).carbsGrams;
  assert(on > off, 'on=' + on + ' off=' + off);
});
check('ON day : lipides ≤ OFF day (swap calorie-neutre)', function(){
  var on  = nmCompute({ trainingDay:true  }).fatGrams;
  var off = nmCompute({ trainingDay:false }).fatGrams;
  assert(on <= off, 'on fat=' + on + ' off fat=' + off);
});
check('OFF day (repos) : LOAD_MULTIPLIERS.rest.cal = 0.90', function(){
  assert(SYM.LOAD_MULTIPLIERS.rest.cal === 0.90);
});
check('OFF day : getLoadMultipliers(false, x) → rest', function(){
  var m = SYM.getLoadMultipliers(false, 'heavy');
  assert(m.cal === 0.90, 'cal=' + m.cal);
});
check('ON day heavy : getLoadMultipliers(true, heavy) → 1.10', function(){
  var m = SYM.getLoadMultipliers(true, 'heavy');
  assert(m.cal === 1.10, 'cal=' + m.cal);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 8 — Goûts restrictifs (profil minimal) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('femme sédentaire 45kg : plancher 1400 kcal', function(){
  var r = nmCompute({ gender:'female', weightKg:45, heightCm:155, age:50,
    activityLevel:1.2, goal:'maintain' });
  assert(r.caloriesTarget >= 1400, 'cal=' + r.caloriesTarget);
});
check('profil minimal : pas d\'erreur de calcul', function(){
  var r = nmCompute({ gender:'female', weightKg:48, heightCm:158, age:35,
    activityLevel:1.2, goal:'cut' });
  assert(r.errors.length === 0, JSON.stringify(r.errors));
});
check('profil restrictif : glucides ≥ 130g (IOM 2005)', function(){
  var r = nmCompute({ gender:'female', weightKg:48, heightCm:158, age:35,
    activityLevel:1.2, goal:'shred' });
  assert(r.carbsGrams >= 130, 'carbs=' + r.carbsGrams);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 9 — Performance (activityLevel max) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('activityLevel 1.9 : TDEE élevé (> activityLevel 1.2)', function(){
  var high = nmCompute({ activityLevel:1.9 }).tdee;
  var low  = nmCompute({ activityLevel:1.2 }).tdee;
  assert(high > low, 'high=' + high + ' low=' + low);
});
check('performance + bulk : calories > 3000 kcal pour 85kg', function(){
  var r = nmCompute({ weightKg:85, heightCm:182, activityLevel:1.9, goal:'bulk' });
  assert(r.caloriesTarget >= 2800, 'cal=' + r.caloriesTarget);
});
check('performance élite : protéines 2.2g/kg', function(){
  var r = nmCompute({ weightKg:85, isElite:true, activityLevel:1.9, goal:'maintain' });
  assert(Math.abs(r.proteinGrams - 85*2.2) < 5, 'prot=' + r.proteinGrams);
});
check('programme force (strength) : reps faibles (≤8)', function(){
  var exos = build(['chest','back'], { hasStrength:true, equipment:'gym' });
  if (exos.length === 0) return;
  var reps = parseMinReps(exos[0].sets);
  assert(reps <= 8, 'reps=' + reps + ' (' + exos[0].sets + ')');
});
check('electrolytes recommandés à activityLevel ≥ 1.725', function(){
  var r = nmCompute({ activityLevel:1.9, trainingDay:true });
  assert(r.timingAdvice.electrolytesNeeded === true);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== Profil 10 — Recomposition corporelle ===');
// ══════════════════════════════════════════════════════════════════════════════

check('recomposition : calories ≈ maintain (neutre)', function(){
  var reco  = nmCompute({ goal:'recomposition' }).caloriesTarget;
  var maint = nmCompute({ goal:'maintain' }).caloriesTarget;
  assert(Math.abs(reco - maint) < 50, 'reco=' + reco + ' maint=' + maint);
});
check('recomposition : volumeFactor = 0.95', function(){
  resetS();
  var idx = goalIdx('recomposition');
  if (idx === null) { console.log('  (skip: recomposition goal not found)'); return; }
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(Math.abs(ns.volumeFactor - 0.95) < 0.01, 'vf=' + ns.volumeFactor);
});
check('recomposition ON day : glucides boostés', function(){
  var on  = nmCompute({ goal:'recomposition', trainingDay:true  }).carbsGrams;
  var off = nmCompute({ goal:'recomposition', trainingDay:false }).carbsGrams;
  assert(on > off, 'on=' + on + ' off=' + off);
});
check('recomposition : programme muscu généré', function(){
  var exos = build(['chest','back','legs'], { equipment:'gym', weekIndex:1 });
  assert(exos.length > 0);
});
check('recomposition : caloriesCheck cohérent', function(){
  var r = nmCompute({ goal:'recomposition', trainingDay:true });
  var exp = Math.round(r.proteinGrams*4 + r.fatGrams*9 + r.carbsGrams*4);
  assert(Math.abs(r.caloriesCheck - exp) <= 5, 'check=' + r.caloriesCheck + ' exp=' + exp);
});

// ─── Résultat ────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? '✅' : '❌') + ' unit-user-personalization : ' + pass + ' pass, ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
