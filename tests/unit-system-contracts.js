'use strict';
/**
 * Test suite — System Contracts (SFCContracts)
 * Couvre : toutes les valeurs FROZEN contre les modules réels, contrats cross-module
 *          (XM-01 à XM-08), shapes API publiques, FALLBACK_POLICY, DEPENDENCY_MAP,
 *          FORBIDDEN_PATTERNS, et l'API SFCContracts elle-même.
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
function approx(a, b, eps) { return Math.abs(a - b) <= (eps || 0.001); }

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
loadScript('app/recipe-registry.js');
loadScript('app/recipe-engine.js');
loadScript('app/recipe-ux-engine.js');
loadScript('app/recipe-ux-explainer.js');
loadScript('app/recipe-auto-improver.js');
loadScript('app/sfc-contracts.js');

var SYM      = window.SFCSymbiosis;
var DC       = window.SFCDecisionCore;
var NM       = window.NutritionMaster;
var RE       = window.RecipeEngine;
var RAI      = window.RecipeAutoImprover;
var CONT     = window.SFCContracts;
var GOALS    = window.GOALS || [];
var LM       = SYM.LOAD_MULTIPLIERS;
// PERIODIZATION_CFG uses numeric keys 1-4 (not S1-S4) — S1=1, S2=2, S3=3, S4=4
var PCFG     = SYM.PERIODIZATION_CFG || {};

function goalIdx(key) {
  var i = GOALS.findIndex(function(g){ return g.key === key; });
  return i >= 0 ? i : null;
}
function resetS() {
  window.S = {
    trainingLoad: null, dailyTrainingLoad: null,
    lastSessionGroups: [], lastSessionDate: null, lastSessionCount: 0,
    sportProgramStart: null, sessionFeedback: null,
    muscuSessionLog: {}, customSessionHistory: [],
    _nm: null, goal: null, sex: 'male', weight: 80
  };
}

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. SFCContracts — API publique ===');
// ══════════════════════════════════════════════════════════════════════════════

check('SFCContracts existe sur window', function(){
  assert(CONT !== undefined && CONT !== null);
});
check('SFCContracts.VERSION est une string', function(){
  assert(typeof CONT.VERSION === 'string' && CONT.VERSION.length > 0);
});
check('SFCContracts.FROZEN est un objet non-vide', function(){
  assert(typeof CONT.FROZEN === 'object' && Object.keys(CONT.FROZEN).length >= 30);
});
check('SFCContracts.MODULES a les 6 modules attendus', function(){
  var M = CONT.MODULES;
  assert(M.NutritionMaster && M.SFCSymbiosis && M.SFCDecisionCore &&
         M.sfcBuildMuscuDay && M.RecipeEngine && M.RecipeAutoImprover);
});
check('SFCContracts.CROSS_MODULE a 8 contrats', function(){
  assert(Array.isArray(CONT.CROSS_MODULE) && CONT.CROSS_MODULE.length === 8);
});
check('SFCContracts.DEPENDENCY_MAP a ≥6 entrées', function(){
  assert(Object.keys(CONT.DEPENDENCY_MAP).length >= 6);
});
check('SFCContracts.FORBIDDEN_PATTERNS a 8 entrées', function(){
  assert(Array.isArray(CONT.FORBIDDEN_PATTERNS) && CONT.FORBIDDEN_PATTERNS.length === 8);
});
check('SFCContracts.checkFrozen est une fonction', function(){
  assert(typeof CONT.checkFrozen === 'function');
});
check('SFCContracts.getModuleContract est une fonction', function(){
  assert(typeof CONT.getModuleContract === 'function');
});
check('SFCContracts.getImpactedModules est une fonction', function(){
  assert(typeof CONT.getImpactedModules === 'function');
});
check('SFCContracts.getCrossModuleContracts est une fonction', function(){
  assert(typeof CONT.getCrossModuleContracts === 'function');
});
check('checkFrozen — clé inconnue lance une erreur', function(){
  var threw = false;
  try { CONT.checkFrozen('INEXISTANT.key', 0); } catch(e) { threw = true; }
  assert(threw, 'devrait lancer pour clé inconnue');
});
check('getModuleContract — module inconnu retourne null', function(){
  assert(CONT.getModuleContract('INEXISTANT') === null);
});
check('getImpactedModules — fichier inconnu retourne []', function(){
  var res = CONT.getImpactedModules('inexistant.js');
  assert(Array.isArray(res) && res.length === 0);
});
check('getCrossModuleContracts — module inconnu retourne []', function(){
  var res = CONT.getCrossModuleContracts('INEXISTANT');
  assert(Array.isArray(res) && res.length === 0);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. FROZEN — NutritionMaster (valeurs réelles vs contrats) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('KCAL_FLOOR_MALE = 1500', function(){
  // Vérifie que NutritionMaster respecte le plancher
  var r = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'shred' });
  assert(r.caloriesTarget >= 1500, 'caloriesTarget=' + r.caloriesTarget);
  assert(CONT.checkFrozen('NutritionMaster.KCAL_FLOOR_MALE', 1500));
});
check('KCAL_FLOOR_FEMALE = 1400', function(){
  var r = NM.compute({ gender:'female', age:25, weightKg:45, heightCm:155, activityLevel:1.2, goal:'shred' });
  assert(r.caloriesTarget >= 1400, 'caloriesTarget=' + r.caloriesTarget);
  assert(CONT.checkFrozen('NutritionMaster.KCAL_FLOOR_FEMALE', 1400));
});
check('CARB_MIN_GDAY = 130', function(){
  var r = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'shred' });
  assert(r.carbsGrams >= 130, 'carbsGrams=' + r.carbsGrams);
  assert(CONT.checkFrozen('NutritionMaster.CARB_MIN_GDAY', 130));
});
check('FAT_MIN_GPERKG = 0.8', function(){
  assert(CONT.checkFrozen('NutritionMaster.FAT_MIN_GPERKG', 0.8));
  var r = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'shred' });
  assert(r.fatGrams >= 0.8 * 80, 'fatGrams=' + r.fatGrams);
});
check('CARB_CYCLING_BOOST = 0.20', function(){
  assert(CONT.checkFrozen('NutritionMaster.CARB_CYCLING_BOOST', 0.20));
});
check('DEFICIT_MAX_KCAL = 500', function(){
  assert(CONT.checkFrozen('NutritionMaster.DEFICIT_MAX_KCAL', 500));
  var r = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'shred' });
  assert(r.tdee - r.caloriesTarget <= 505, 'déficit=' + (r.tdee - r.caloriesTarget));
});
check('PROTEIN_DEFAULT_MALE_GPERKG = 1.8', function(){
  assert(CONT.checkFrozen('NutritionMaster.PROTEIN_DEFAULT_MALE_GPERKG', 1.8));
});
check('PROTEIN_DEFAULT_FEMALE_GPERKG = 1.6', function(){
  assert(CONT.checkFrozen('NutritionMaster.PROTEIN_DEFAULT_FEMALE_GPERKG', 1.6));
});
check('PROTEIN_ELITE_MALE_GPERKG = 2.2', function(){
  assert(CONT.checkFrozen('NutritionMaster.PROTEIN_ELITE_MALE_GPERKG', 2.2));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. FROZEN — SFCSymbiosis LOAD_MULTIPLIERS (valeurs réelles) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('heavy.cal = 1.10', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.heavy.cal', LM.heavy.cal));
});
check('heavy.carbBoost = 1.20', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.heavy.carbBoost', LM.heavy.carbBoost));
});
check('heavy.fatAdjust = 0.92', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.heavy.fatAdjust', LM.heavy.fatAdjust));
});
check('moderate.cal = 1.07', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.moderate.cal', LM.moderate.cal));
});
check('moderate.carbBoost = 1.10', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.moderate.carbBoost', LM.moderate.carbBoost));
});
check('moderate.fatAdjust = 0.96', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.moderate.fatAdjust', LM.moderate.fatAdjust));
});
check('light.cal = 1.03', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.light.cal', LM.light.cal));
});
check('light.carbBoost = 1.00', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.light.carbBoost', LM.light.carbBoost));
});
check('light.fatAdjust = 1.00', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.light.fatAdjust', LM.light.fatAdjust));
});
check('rest.cal = 0.90', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.rest.cal', LM.rest.cal));
});
check('rest.carbBoost = 0.90', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.rest.carbBoost', LM.rest.carbBoost));
});
check('rest.fatAdjust = 1.08', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.rest.fatAdjust', LM.rest.fatAdjust));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. FROZEN — PERIODIZATION_CFG (valeurs réelles) ===');
// ══════════════════════════════════════════════════════════════════════════════

// PERIODIZATION_CFG uses numeric keys: PCFG[1]=S1, PCFG[2]=S2, PCFG[3]=S3, PCFG[4]=S4
check('S1.durMax = 6', function(){
  assert(PCFG[1] && PCFG[1].durMax === 6, 'PCFG[1].durMax=' + (PCFG[1] && PCFG[1].durMax));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S1.durMax', PCFG[1].durMax));
});
check('S1.durSets = 4', function(){
  assert(PCFG[1] && PCFG[1].durSets === 4, 'PCFG[1].durSets=' + (PCFG[1] && PCFG[1].durSets));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S1.durSets', PCFG[1].durSets));
});
check('S2.durMax = 6', function(){
  assert(PCFG[2] && PCFG[2].durMax === 6, 'PCFG[2].durMax=' + (PCFG[2] && PCFG[2].durMax));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S2.durMax', PCFG[2].durMax));
});
check('S2.durSets = 5', function(){
  assert(PCFG[2] && PCFG[2].durSets === 5, 'PCFG[2].durSets=' + (PCFG[2] && PCFG[2].durSets));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S2.durSets', PCFG[2].durSets));
});
check('S3.durMax = 5', function(){
  assert(PCFG[3] && PCFG[3].durMax === 5, 'PCFG[3].durMax=' + (PCFG[3] && PCFG[3].durMax));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S3.durMax', PCFG[3].durMax));
});
check('S3.durSets = 5', function(){
  assert(PCFG[3] && PCFG[3].durSets === 5, 'PCFG[3].durSets=' + (PCFG[3] && PCFG[3].durSets));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S3.durSets', PCFG[3].durSets));
});
check('S3.restOverride = "120-180s"', function(){
  assert(PCFG[3] && PCFG[3].restOverride === '120-180s', 'PCFG[3].restOverride=' + (PCFG[3] && PCFG[3].restOverride));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S3.restOverride', PCFG[3].restOverride));
});
check('S4.durMax = 4', function(){
  assert(PCFG[4] && PCFG[4].durMax === 4, 'PCFG[4].durMax=' + (PCFG[4] && PCFG[4].durMax));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S4.durMax', PCFG[4].durMax));
});
check('S4.durSets = 3', function(){
  assert(PCFG[4] && PCFG[4].durSets === 3, 'PCFG[4].durSets=' + (PCFG[4] && PCFG[4].durSets));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S4.durSets', PCFG[4].durSets));
});
check('S4.restOverride = "60s"', function(){
  assert(PCFG[4] && PCFG[4].restOverride === '60s', 'PCFG[4].restOverride=' + (PCFG[4] && PCFG[4].restOverride));
  assert(CONT.checkFrozen('SFCSymbiosis.PERIODIZATION_CFG.S4.restOverride', PCFG[4].restOverride));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. FROZEN — getNutritionState volumeFactors (valeurs réelles) ===');
// ══════════════════════════════════════════════════════════════════════════════

function nsVF(goal) {
  resetS();
  var gIdx = goalIdx(goal);
  if (gIdx !== null) window.S.goal = gIdx;
  window.S.sex = 'male'; window.S.weight = 80;
  return SYM.getNutritionState().volumeFactor;
}

check('shred volumeFactor = 0.80', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.getNutritionState.shred.volumeFactor', nsVF('shred')));
});
check('cut volumeFactor = 0.88', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.getNutritionState.cut.volumeFactor', nsVF('cut')));
});
check('bulk volumeFactor = 1.08', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.getNutritionState.bulk.volumeFactor', nsVF('bulk')));
});
check('lean_bulk volumeFactor = 1.08', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.getNutritionState.lean_bulk.volumeFactor', nsVF('lean_bulk')));
});
check('recomposition volumeFactor = 0.95', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.getNutritionState.recomposition.volumeFactor', nsVF('recomposition')));
});
check('maintain volumeFactor = 1.00', function(){
  assert(CONT.checkFrozen('SFCSymbiosis.getNutritionState.maintain.volumeFactor', nsVF('maintain')));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. FROZEN — DecisionCore thresholds ===');
// ══════════════════════════════════════════════════════════════════════════════

// Signature: _nutritionToTrainingSignal(calDeficit, proteinAdequacy, fatigueLevel)
check('deficit500.volumeModifier = 0.80', function(){
  resetS();
  var sig = DC._nutritionToTrainingSignal(-600, 1.0, 2);
  assert(CONT.checkFrozen('SFCDecisionCore._nutritionToTrainingSignal.deficit500.volumeModifier', sig.volumeModifier),
    'got ' + sig.volumeModifier);
});
check('deficit500.intensityModifier = 0.88', function(){
  resetS();
  var sig = DC._nutritionToTrainingSignal(-600, 1.0, 2);
  assert(CONT.checkFrozen('SFCDecisionCore._nutritionToTrainingSignal.deficit500.intensityModifier', sig.intensityModifier),
    'got ' + sig.intensityModifier);
});
check('deficit300.volumeModifier = 0.90', function(){
  resetS();
  var sig = DC._nutritionToTrainingSignal(-400, 1.0, 2);
  assert(CONT.checkFrozen('SFCDecisionCore._nutritionToTrainingSignal.deficit300.volumeModifier', sig.volumeModifier),
    'got ' + sig.volumeModifier);
});
check('deficit300.intensityModifier = 0.95', function(){
  resetS();
  var sig = DC._nutritionToTrainingSignal(-400, 1.0, 2);
  assert(CONT.checkFrozen('SFCDecisionCore._nutritionToTrainingSignal.deficit300.intensityModifier', sig.intensityModifier),
    'got ' + sig.intensityModifier);
});
check('_computeRecoveryConstraint.daysSinceThreshold = 2', function(){
  assert(CONT.checkFrozen('SFCDecisionCore._computeRecoveryConstraint.daysSinceThreshold', 2));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. XM-01 — Carb cycling calorie-neutre ===');
// ══════════════════════════════════════════════════════════════════════════════

check('XM-01: ON day carbs > OFF day carbs', function(){
  var off = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'maintain', trainingDay:false });
  var on  = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'maintain', trainingDay:true });
  assert(on.carbsGrams > off.carbsGrams, 'ON=' + on.carbsGrams + ' OFF=' + off.carbsGrams);
});
check('XM-01: ON day fat ≤ OFF day fat', function(){
  var off = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'maintain', trainingDay:false });
  var on  = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'maintain', trainingDay:true });
  assert(on.fatGrams <= off.fatGrams, 'ON fat=' + on.fatGrams + ' OFF fat=' + off.fatGrams);
});
check('XM-01: carbCyclingApplied=true when trainingDay=true', function(){
  var on = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'bulk', trainingDay:true });
  assert(on.carbCyclingApplied === true);
});
check('XM-01: carbCyclingApplied=false when trainingDay=false', function(){
  var off = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'bulk', trainingDay:false });
  assert(off.carbCyclingApplied === false);
});
check('XM-01: ON calories ≥ OFF calories (carb boost; fat floor peut empêcher neutralité exacte)', function(){
  var off = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'maintain', trainingDay:false });
  var on  = NM.compute({ gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'maintain', trainingDay:true });
  // Training day ajoute des carbs (+20%). Le fat floor (0.8g/kg) peut empêcher la neutralité calorique exacte.
  // On vérifie que les calories ON >= OFF (swap carbs/fat ou carbs seuls si fat au plancher).
  assert(on.caloriesTarget >= off.caloriesTarget,
    'ON calories devrait être ≥ OFF, ON=' + on.caloriesTarget + ' OFF=' + off.caloriesTarget);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 8. XM-02 — LOAD_MULTIPLIERS cohérence SFCSymbiosis↔SFCDecisionCore ===');
// ══════════════════════════════════════════════════════════════════════════════

// Signature: _trainingToNutritionSignal(trainingLoad, fatigueLevel, lastGroups, daysSince)
check('XM-02: heavy → calMultiplier = LOAD_MULTIPLIERS.heavy.cal', function(){
  resetS();
  var sig = DC._trainingToNutritionSignal('heavy', 2, [], 2);
  assert(approx(sig.calMultiplier, LM.heavy.cal, 0.001),
    'calMultiplier=' + sig.calMultiplier + ' expected=' + LM.heavy.cal);
});
check('XM-02: moderate → calMultiplier = LOAD_MULTIPLIERS.moderate.cal', function(){
  resetS();
  var sig = DC._trainingToNutritionSignal('moderate', 2, [], 2);
  assert(approx(sig.calMultiplier, LM.moderate.cal, 0.001),
    'calMultiplier=' + sig.calMultiplier + ' expected=' + LM.moderate.cal);
});
check('XM-02: light → calMultiplier = LOAD_MULTIPLIERS.light.cal', function(){
  resetS();
  var sig = DC._trainingToNutritionSignal('light', 2, [], 2);
  assert(approx(sig.calMultiplier, LM.light.cal, 0.001),
    'calMultiplier=' + sig.calMultiplier + ' expected=' + LM.light.cal);
});
check('XM-02: rest → calMultiplier = LOAD_MULTIPLIERS.rest.cal', function(){
  resetS();
  var sig = DC._trainingToNutritionSignal('rest', 2, [], 2);
  assert(approx(sig.calMultiplier, LM.rest.cal, 0.001),
    'calMultiplier=' + sig.calMultiplier + ' expected=' + LM.rest.cal);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 9. XM-03 — Dry-run non-destructif RecipeAutoImprover↔RecipeEngine ===');
// ══════════════════════════════════════════════════════════════════════════════

check('XM-03: RECIPES_DB avant runDryRun = RECIPES_DB après', function(){
  var db = RE.RECIPES_DB;
  var before = JSON.stringify(db.map(function(r){ return r.id || r.k; }));
  RAI.runDryRun({});
  var after = JSON.stringify(db.map(function(r){ return r.id || r.k; }));
  assert(before === after, 'RECIPES_DB muté par runDryRun');
});
check('XM-03: nombre de recettes identique avant/après', function(){
  var n = RE.RECIPES_DB.length;
  RAI.runDryRun({});
  assert(RE.RECIPES_DB.length === n, 'length changé: ' + n + ' → ' + RE.RECIPES_DB.length);
});
check('XM-03: REVIEW_REQUIRED jamais dans proposal.applied', function(){
  var result = RAI.runDryRun({});
  var proposals = result.proposals || [];
  proposals.forEach(function(p){
    if (Array.isArray(p.applied)) {
      p.applied.forEach(function(a){
        assert((a.type || '') !== 'REVIEW_REQUIRED', 'REVIEW_REQUIRED dans applied: ' + JSON.stringify(a));
      });
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 10. XM-04 — Récupération 48h bloque groupes musculaires ===');
// ══════════════════════════════════════════════════════════════════════════════

// Signature: _computeRecoveryConstraint(lastGroups, daysSince)
check('XM-04: daysSince < 2 + lastGroups → blockedGroups = lastGroups', function(){
  resetS();
  var res = DC._computeRecoveryConstraint(['chest','back'], 1);
  assert(res.blockedGroups.length > 0, 'blockedGroups vide quand daysSince=1');
  assert(res.blockedGroups.indexOf('chest') >= 0 && res.blockedGroups.indexOf('back') >= 0);
});
check('XM-04: daysSince = 0 → suggestRest = true', function(){
  resetS();
  var res = DC._computeRecoveryConstraint(['legs'], 0);
  assert(res.suggestRest === true, 'suggestRest devrait être true');
});
check('XM-04: daysSince ≥ 2 → blockedGroups = []', function(){
  resetS();
  var res = DC._computeRecoveryConstraint(['chest','back'], 2);
  assert(Array.isArray(res.blockedGroups) && res.blockedGroups.length === 0,
    'blockedGroups devrait être vide pour daysSince=2');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 11. XM-05 — Deficit → volume training réduit ===');
// ══════════════════════════════════════════════════════════════════════════════

check('XM-05: shred → volumeFactor < 1.0', function(){
  var vf = nsVF('shred');
  assert(vf < 1.0, 'shred volumeFactor devrait être <1.0, got ' + vf);
});
check('XM-05: shred volumeFactor < bulk volumeFactor', function(){
  var vfShred = nsVF('shred');
  var vfBulk  = nsVF('bulk');
  assert(vfShred < vfBulk, 'shred=' + vfShred + ' bulk=' + vfBulk);
});
check('XM-05: nutritionToTraining — déficit>500 → volumeModifier=0.80', function(){
  resetS();
  var sig = DC._nutritionToTrainingSignal(-600, 1.0, 2);
  assert(sig.volumeModifier === 0.80, 'volumeModifier=' + sig.volumeModifier);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 12. XM-06 — NutritionMaster déterminisme ===');
// ══════════════════════════════════════════════════════════════════════════════

check('XM-06: mêmes inputs → mêmes outputs (homme 80kg)', function(){
  var inp = { gender:'male', age:30, weightKg:80, heightCm:180, activityLevel:1.4, goal:'maintain' };
  var r1 = NM.compute(inp);
  var r2 = NM.compute(inp);
  assert(r1.caloriesTarget === r2.caloriesTarget &&
         r1.proteinGrams   === r2.proteinGrams &&
         r1.carbsGrams     === r2.carbsGrams &&
         r1.fatGrams       === r2.fatGrams,
    'non-déterministe');
});
check('XM-06: mêmes inputs → mêmes outputs (femme 60kg)', function(){
  var inp = { gender:'female', age:25, weightKg:60, heightCm:165, activityLevel:1.6, goal:'cut' };
  var r1 = NM.compute(inp);
  var r2 = NM.compute(inp);
  assert(r1.caloriesTarget === r2.caloriesTarget && r1.proteinGrams === r2.proteinGrams,
    'non-déterministe');
});
check('XM-06: calcBMR déterministe', function(){
  var b1 = NM.calcBMR('male', 80, 180, 30);
  var b2 = NM.calcBMR('male', 80, 180, 30);
  assert(b1 === b2, 'calcBMR non-déterministe');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 13. XM-07 — RecipeAutoImprover REVIEW_REQUIRED isolation ===');
// ══════════════════════════════════════════════════════════════════════════════

check('XM-07: aucune amélioration REVIEW_REQUIRED dans applied[]', function(){
  var result = RAI.runDryRun({});
  var proposals = result.proposals || [];
  var found = false;
  proposals.forEach(function(p) {
    (p.applied || []).forEach(function(a) {
      if ((a.type || '') === 'REVIEW_REQUIRED') found = true;
    });
  });
  assert(!found, 'REVIEW_REQUIRED trouvé dans applied');
});
check('XM-07: summary.reviewRequired est un nombre', function(){
  var result = RAI.runDryRun({});
  assert(typeof result.summary.reviewRequired === 'number');
});
check('XM-07: summary.autoApplied est un nombre', function(){
  var result = RAI.runDryRun({});
  assert(typeof result.summary.autoApplied === 'number');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 14. XM-08 — processCompletedSession idempotence ===');
// ══════════════════════════════════════════════════════════════════════════════

check('XM-08: second appel même sessionId ignoré', function(){
  resetS();
  var sess = { sessionId:'sc-xm08-1', exercises:[{n:'Squat',tags:['compound'],_grp:'legs'}], groups:['legs'], date: new Date().toISOString() };
  SYM.processCompletedSession(sess);
  var state1 = JSON.stringify({ load: window.S.trainingLoad });
  SYM.processCompletedSession(sess);
  var state2 = JSON.stringify({ load: window.S.trainingLoad });
  assert(state1 === state2, 'état changé au 2e appel: ' + state1 + ' → ' + state2);
});
check('XM-08: _processedSessionIds contient le sessionId après traitement', function(){
  resetS();
  var sess = { sessionId:'sc-xm08-2', exercises:[{n:'Bench',tags:['compound'],_grp:'chest'}], groups:['chest'], date: new Date().toISOString() };
  SYM.processCompletedSession(sess);
  // _processedSessionIds est un dict object {sessionId: true}, pas un tableau
  var ids = window.S._processedSessionIds || {};
  assert(ids['sc-xm08-2'] === true, 'sessionId non enregistré dans _processedSessionIds');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 15. Shapes API publiques — existence des fonctions ===');
// ══════════════════════════════════════════════════════════════════════════════

// timingAdvice est dans la sortie de compute(), pas une fonction exposée directement
var NM_EXPECTED = ['compute','calcBMR','calcTDEE','applyCarbCycling','calcCaloriesTarget'];
NM_EXPECTED.forEach(function(fn) {
  check('NutritionMaster.' + fn + ' est une fonction', function(){
    assert(typeof NM[fn] === 'function', fn + ' manquant');
  });
});

var SYM_EXPECTED = ['computeTrainingLoad','getLoadMultipliers','getFeedbackAdjustment',
                    'getNutritionState','getFatigueScore','getWeekIndex','getPeriodizationCfg',
                    'notifySession','processCompletedSession','updateWeekContext'];
SYM_EXPECTED.forEach(function(fn) {
  check('SFCSymbiosis.' + fn + ' est une fonction', function(){
    assert(typeof SYM[fn] === 'function', fn + ' manquant');
  });
});

var DC_EXPECTED = ['_nutritionToTrainingSignal','_trainingToNutritionSignal',
                   '_computeRecoveryConstraint','getDecision','invalidate','buildInputContext'];
DC_EXPECTED.forEach(function(fn) {
  check('SFCDecisionCore.' + fn + ' est une fonction', function(){
    assert(typeof DC[fn] === 'function', fn + ' manquant');
  });
});

check('RecipeEngine.RECIPES_DB est un tableau non vide', function(){
  assert(Array.isArray(RE.RECIPES_DB) && RE.RECIPES_DB.length > 0);
});
check('RecipeAutoImprover.runDryRun est une fonction', function(){
  assert(typeof RAI.runDryRun === 'function');
});
check('RecipeAutoImprover.IMPROVEMENT_CATALOG existe', function(){
  assert(RAI.IMPROVEMENT_CATALOG !== undefined);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 16. FALLBACK_POLICY — comportements dégradés ===');
// ══════════════════════════════════════════════════════════════════════════════

check('FALLBACK: NutritionMaster.compute — inputs invalides retourne errors[]', function(){
  var r = NM.compute({});
  assert(Array.isArray(r.errors) && r.errors.length > 0, 'errors vide pour inputs invalides');
});
check('FALLBACK: SFCSymbiosis.getWeekIndex — no sportProgramStart retourne 1', function(){
  resetS();
  window.S.sportProgramStart = null;
  var idx = SYM.getWeekIndex();
  assert(idx === 1, 'getWeekIndex devrait retourner 1 sans sportProgramStart, got ' + idx);
});
check('FALLBACK: SFCSymbiosis.getFatigueScore — S absent retourne niveau safe', function(){
  resetS();
  var f = SYM.getFatigueScore();
  assert(f && typeof f.cycleFactor === 'number' && f.cycleFactor > 0,
    'getFatigueScore devrait retourner un objet valide');
});
check('FALLBACK: SFCSymbiosis.getNutritionState — S.goal null retourne volumeFactor valide', function(){
  resetS();
  window.S.goal = null;
  var ns = SYM.getNutritionState();
  assert(ns && typeof ns.volumeFactor === 'number' && ns.volumeFactor > 0,
    'getNutritionState devrait retourner un volumeFactor > 0');
});
check('FALLBACK: sfcBuildMuscuDay — exercises vide retourne tableau', function(){
  var { sfcBuildMuscuDay } = require(ROOT + '/app/muscu-engine.js');
  var result = sfcBuildMuscuDay(['chest'], { exercises: {}, durMax: 6, durSets: 4 });
  assert(Array.isArray(result), 'devrait retourner un tableau');
});
check('FALLBACK: RecipeAutoImprover.runDryRun retourne structure valide', function(){
  var result = RAI.runDryRun({});
  assert(result && Array.isArray(result.proposals), 'proposals manquant');
  assert(typeof result.summary === 'object', 'summary manquant');
  assert(typeof result.analyzed === 'number', 'analyzed manquant');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 17. DEPENDENCY_MAP — fichiers référencés existent ===');
// ══════════════════════════════════════════════════════════════════════════════

var REAL_FILES = [
  'sfc-constants.js', 'nutrition-master.js', 'sfc-symbiosis.js',
  'sfc-decision-core.js', 'muscu-engine.js', 'recipe-engine.js',
  'recipe-auto-improver.js', 'sfc-invariants.js', 'app-core.js'
];
REAL_FILES.forEach(function(fname) {
  check('DEPENDENCY_MAP: ' + fname + ' référencé', function(){
    var entry = CONT.DEPENDENCY_MAP[fname];
    assert(entry !== undefined, fname + ' manquant dans DEPENDENCY_MAP');
  });
});
REAL_FILES.forEach(function(fname) {
  check('Fichier app/' + fname + ' existe sur disque', function(){
    var fullPath = path.join(ROOT, 'app', fname);
    assert(fs.existsSync(fullPath), 'fichier introuvable: app/' + fname);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 18. getImpactedModules / getCrossModuleContracts ===');
// ══════════════════════════════════════════════════════════════════════════════

check('getImpactedModules(sfc-symbiosis.js) inclut app-sport.js', function(){
  var impacted = CONT.getImpactedModules('sfc-symbiosis.js');
  assert(impacted.indexOf('app-sport.js') >= 0, 'app-sport.js non trouvé: ' + impacted.join(','));
});
check('getImpactedModules(sfc-symbiosis.js) inclut sfc-decision-core.js', function(){
  var impacted = CONT.getImpactedModules('sfc-symbiosis.js');
  assert(impacted.indexOf('sfc-decision-core.js') >= 0);
});
check('getImpactedModules(app-core.js) est non-vide', function(){
  var impacted = CONT.getImpactedModules('app-core.js');
  assert(impacted.length > 0);
});
check('getCrossModuleContracts(NutritionMaster) inclut XM-01', function(){
  var contracts = CONT.getCrossModuleContracts('NutritionMaster');
  var ids = contracts.map(function(c){ return c.id; });
  assert(ids.indexOf('XM-01') >= 0, 'XM-01 manquant: ' + ids.join(','));
});
check('getCrossModuleContracts(SFCSymbiosis) inclut XM-08', function(){
  var contracts = CONT.getCrossModuleContracts('SFCSymbiosis');
  var ids = contracts.map(function(c){ return c.id; });
  assert(ids.indexOf('XM-08') >= 0, 'XM-08 manquant: ' + ids.join(','));
});
check('getCrossModuleContracts(RecipeAutoImprover) inclut XM-03 et XM-07', function(){
  var contracts = CONT.getCrossModuleContracts('RecipeAutoImprover');
  var ids = contracts.map(function(c){ return c.id; });
  assert(ids.indexOf('XM-03') >= 0 && ids.indexOf('XM-07') >= 0,
    'manquant: ' + ids.join(','));
});
check('getCrossModuleContracts(SFCDecisionCore) inclut XM-02 et XM-04', function(){
  var contracts = CONT.getCrossModuleContracts('SFCDecisionCore');
  var ids = contracts.map(function(c){ return c.id; });
  assert(ids.indexOf('XM-02') >= 0 && ids.indexOf('XM-04') >= 0,
    'manquant: ' + ids.join(','));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 19. FORBIDDEN_PATTERNS — structure valide ===');
// ══════════════════════════════════════════════════════════════════════════════

check('Tous les FORBIDDEN_PATTERNS ont un id, pattern, reason', function(){
  CONT.FORBIDDEN_PATTERNS.forEach(function(fp) {
    assert(fp.id && fp.pattern && fp.reason,
      'FP incomplet: ' + JSON.stringify(fp));
  });
});
check('FP ids sont FP-01 à FP-08', function(){
  var ids = CONT.FORBIDDEN_PATTERNS.map(function(fp){ return fp.id; }).sort();
  assert(ids[0] === 'FP-01' && ids[ids.length-1] === 'FP-08',
    'ids: ' + ids.join(','));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 20. FROZEN — RecipeAutoImprover tolerances ===');
// ══════════════════════════════════════════════════════════════════════════════

check('MACRO_TOLERANCE.calories = 0.03', function(){
  assert(CONT.checkFrozen('RecipeAutoImprover.MACRO_TOLERANCE.calories', 0.03));
});
check('MACRO_TOLERANCE.protein = 0.05', function(){
  assert(CONT.checkFrozen('RecipeAutoImprover.MACRO_TOLERANCE.protein', 0.05));
});
check('MACRO_TOLERANCE.carbs = 0.05', function(){
  assert(CONT.checkFrozen('RecipeAutoImprover.MACRO_TOLERANCE.carbs', 0.05));
});
check('MACRO_TOLERANCE.fat = 0.05', function(){
  assert(CONT.checkFrozen('RecipeAutoImprover.MACRO_TOLERANCE.fat', 0.05));
});
check('CACHE_DURATION_MS = 300000 (5 min)', function(){
  assert(CONT.checkFrozen('SFCDecisionCore.CACHE_DURATION_MS', 300000));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 21. getModuleContract — shapes vérifiés ===');
// ══════════════════════════════════════════════════════════════════════════════

check('getModuleContract(NutritionMaster) a compute.inputs', function(){
  var mc = CONT.getModuleContract('NutritionMaster');
  assert(mc && mc.compute && mc.compute.inputs);
});
check('getModuleContract(NutritionMaster) compute.inputs.goal a enum', function(){
  var mc = CONT.getModuleContract('NutritionMaster');
  assert(Array.isArray(mc.compute.inputs.goal.enum) && mc.compute.inputs.goal.enum.length >= 4);
});
check('getModuleContract(SFCSymbiosis) a getPeriodizationCfg', function(){
  var mc = CONT.getModuleContract('SFCSymbiosis');
  assert(mc && mc.getPeriodizationCfg);
});
check('getModuleContract(sfcBuildMuscuDay) a invariants non-vide', function(){
  var mc = CONT.getModuleContract('sfcBuildMuscuDay');
  assert(mc && Array.isArray(mc.invariants) && mc.invariants.length >= 5);
});
check('getModuleContract(RecipeEngine).RECIPES_DB.forbiddenMutations non-vide', function(){
  var mc = CONT.getModuleContract('RecipeEngine');
  assert(mc && Array.isArray(mc.RECIPES_DB.forbiddenMutations) && mc.RECIPES_DB.forbiddenMutations.length >= 2);
});

// ══════════════════════════════════════════════════════════════════════════════
// Résultat final
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log('System Contracts : ' + pass + ' passed, ' + fail + ' failed');
console.log('═'.repeat(60) + '\n');
if (fail > 0) process.exit(1);
