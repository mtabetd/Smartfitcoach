'use strict';
/**
 * Test suite — Regression Post-Merge
 * Couvre : toutes les API publiques encore présentes après la fusion,
 *          RecipeAutoImprover dry-run non-destructif, LOAD_MULTIPLIERS inchangés,
 *          NutritionMaster déterministe, snapshot caloriques stables.
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
eval(fs.readFileSync(ROOT + '/app/food-db.js',         'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js',           'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js',         'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js',     'utf8'));
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-symbiosis.js',    'utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-decision-core.js','utf8'));
loadScript('app/recipe-registry.js');
loadScript('app/recipe-engine.js');
loadScript('app/recipe-ux-engine.js');
loadScript('app/recipe-ux-explainer.js');
loadScript('app/recipe-auto-improver.js');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. API publiques — présence des exports ===');
// ══════════════════════════════════════════════════════════════════════════════

check('window.NutritionMaster existe', function(){
  assert(window.NutritionMaster !== undefined && window.NutritionMaster !== null);
});
check('NutritionMaster.compute est une fonction', function(){
  assert(typeof window.NutritionMaster.compute === 'function');
});
check('NutritionMaster.calcBMR est une fonction', function(){
  assert(typeof window.NutritionMaster.calcBMR === 'function');
});
check('NutritionMaster.applyCarbCycling est une fonction', function(){
  assert(typeof window.NutritionMaster.applyCarbCycling === 'function');
});
check('window.SFCSymbiosis existe', function(){
  assert(window.SFCSymbiosis !== undefined && window.SFCSymbiosis !== null);
});
check('SFCSymbiosis.computeTrainingLoad est une fonction', function(){
  assert(typeof window.SFCSymbiosis.computeTrainingLoad === 'function');
});
check('SFCSymbiosis.getLoadMultipliers est une fonction', function(){
  assert(typeof window.SFCSymbiosis.getLoadMultipliers === 'function');
});
check('SFCSymbiosis.LOAD_MULTIPLIERS est un objet', function(){
  assert(typeof window.SFCSymbiosis.LOAD_MULTIPLIERS === 'object');
});
check('SFCSymbiosis.PERIODIZATION_CFG est un objet', function(){
  assert(typeof window.SFCSymbiosis.PERIODIZATION_CFG === 'object');
});
check('window.SFCDecisionCore existe', function(){
  assert(window.SFCDecisionCore !== undefined && window.SFCDecisionCore !== null);
});
check('SFCDecisionCore._nutritionToTrainingSignal est une fonction', function(){
  assert(typeof window.SFCDecisionCore._nutritionToTrainingSignal === 'function');
});
check('SFCDecisionCore._trainingToNutritionSignal est une fonction', function(){
  assert(typeof window.SFCDecisionCore._trainingToNutritionSignal === 'function');
});
check('SFCDecisionCore._computeRecoveryConstraint est une fonction', function(){
  assert(typeof window.SFCDecisionCore._computeRecoveryConstraint === 'function');
});
check('window.RecipeEngine existe', function(){
  assert(window.RecipeEngine !== undefined && window.RecipeEngine !== null);
});
check('RecipeEngine.RECIPES_DB est un tableau non vide', function(){
  assert(Array.isArray(window.RecipeEngine.RECIPES_DB) && window.RecipeEngine.RECIPES_DB.length > 0);
});
check('window.RecipeAutoImprover existe', function(){
  assert(window.RecipeAutoImprover !== undefined && window.RecipeAutoImprover !== null);
});
check('RecipeAutoImprover.runDryRun est une fonction', function(){
  assert(typeof window.RecipeAutoImprover.runDryRun === 'function');
});
check('RecipeAutoImprover.IMPROVEMENT_CATALOG est un tableau', function(){
  assert(Array.isArray(window.RecipeAutoImprover.IMPROVEMENT_CATALOG));
});
check('RecipeAutoImprover.IMPROVEMENT_CATALOG contient ≥ 5 améliorations', function(){
  assert(window.RecipeAutoImprover.IMPROVEMENT_CATALOG.length >= 5,
    'catalog length=' + window.RecipeAutoImprover.IMPROVEMENT_CATALOG.length);
});
check('RecipeAutoImprover.generateImprovementReport est une fonction', function(){
  assert(typeof window.RecipeAutoImprover.generateImprovementReport === 'function');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. RecipeAutoImprover — dry-run non-destructif ===');
// ══════════════════════════════════════════════════════════════════════════════

check('runDryRun ne modifie pas RECIPES_DB', function(){
  var DB = window.RecipeEngine.RECIPES_DB;
  var snapshots = DB.slice(0, 10).map(function(r){
    return { id:r.id, cal:r.baseNutrition.calories, prot:r.baseNutrition.proteinGrams };
  });
  window.RecipeAutoImprover.runDryRun(DB, { top: 10 });
  snapshots.forEach(function(snap){
    var r = DB.find(function(x){ return x.id === snap.id; });
    assert(r, 'recipe ' + snap.id + ' disappeared');
    assert(r.baseNutrition.calories === snap.cal,
      'calories mutated for ' + snap.id + ': ' + r.baseNutrition.calories + ' !== ' + snap.cal);
    assert(r.baseNutrition.proteinGrams === snap.prot,
      'protein mutated for ' + snap.id);
  });
});
check('runDryRun retourne un objet avec summary et proposals', function(){
  var DB = window.RecipeEngine.RECIPES_DB;
  var result = window.RecipeAutoImprover.runDryRun(DB, { top: 5 });
  assert(result.summary !== undefined, 'no summary');
  assert(Array.isArray(result.proposals), 'proposals not array');
});
check('runDryRun summary a autoApplied, reviewRequired, rejected', function(){
  var DB = window.RecipeEngine.RECIPES_DB;
  var result = window.RecipeAutoImprover.runDryRun(DB, { top: 5 });
  var s = result.summary;
  assert(typeof s.autoApplied    === 'number', 'no autoApplied');
  assert(typeof s.reviewRequired === 'number', 'no reviewRequired');
  assert(typeof s.rejected       === 'number', 'no rejected');
});
check('REVIEW_REQUIRED jamais dans proposal.applied', function(){
  var DB = window.RecipeEngine.RECIPES_DB;
  var result = window.RecipeAutoImprover.runDryRun(DB, { top: 20 });
  result.proposals.forEach(function(p){
    var applied = p.applied || [];
    applied.forEach(function(a){
      var cat = window.RecipeAutoImprover.IMPROVEMENT_CATALOG.find(function(c){
        return c.id === a.improvementId;
      });
      if (cat) {
        assert(cat.type !== 'REVIEW_REQUIRED',
          'REVIEW_REQUIRED applied for improvement ' + a.improvementId + ' in recipe ' + p.recipeId);
      }
    });
  });
});
check('generateImprovementReport retourne une chaîne non vide', function(){
  var DB = window.RecipeEngine.RECIPES_DB;
  var result = window.RecipeAutoImprover.runDryRun(DB, { top: 3 });
  var report = window.RecipeAutoImprover.generateImprovementReport(result);
  assert(typeof report === 'string' && report.length > 0, 'report empty or not string');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. LOAD_MULTIPLIERS — valeurs de référence inchangées ===');
// ══════════════════════════════════════════════════════════════════════════════

var LM = window.SFCSymbiosis.LOAD_MULTIPLIERS;

check('heavy.cal = 1.10 (Helms 2014)', function(){
  assert(LM.heavy.cal === 1.10);
});
check('heavy.carbBoost = 1.20 (ISSN 2023)', function(){
  assert(LM.heavy.carbBoost === 1.20);
});
check('heavy.fatAdjust = 0.92', function(){
  assert(LM.heavy.fatAdjust === 0.92);
});
check('moderate.cal = 1.07', function(){
  assert(LM.moderate.cal === 1.07);
});
check('moderate.carbBoost = 1.10', function(){
  assert(LM.moderate.carbBoost === 1.10);
});
check('light.cal = 1.03', function(){
  assert(LM.light.cal === 1.03);
});
check('light.carbBoost = 1.00', function(){
  assert(LM.light.carbBoost === 1.00);
});
check('rest.cal = 0.90', function(){
  assert(LM.rest.cal === 0.90);
});
check('rest.carbBoost = 0.90', function(){
  assert(LM.rest.carbBoost === 0.90);
});
check('rest.fatAdjust = 1.08', function(){
  assert(LM.rest.fatAdjust === 1.08);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. NutritionMaster — déterminisme (même entrée = même sortie) ===');
// ══════════════════════════════════════════════════════════════════════════════

var NM = window.NutritionMaster;
var FIXED_INPUT = {
  gender:'male', age:30, weightKg:80, heightCm:180,
  activityLevel:1.55, goal:'maintain', isElite:false, trainingDay:false
};

check('calcBMR déterministe', function(){
  var bmr1 = NM.calcBMR('male', 80, 180, 30);
  var bmr2 = NM.calcBMR('male', 80, 180, 30);
  assert(bmr1 === bmr2, 'bmr1=' + bmr1 + ' bmr2=' + bmr2);
});
check('compute déterministe (même input → même output)', function(){
  var r1 = NM.compute(FIXED_INPUT);
  var r2 = NM.compute(FIXED_INPUT);
  assert(r1.caloriesTarget === r2.caloriesTarget, 'cal1=' + r1.caloriesTarget + ' cal2=' + r2.caloriesTarget);
  assert(r1.proteinGrams   === r2.proteinGrams,   'prot1=' + r1.proteinGrams);
  assert(r1.carbsGrams     === r2.carbsGrams,     'carb1=' + r1.carbsGrams);
});
check('calcBMR homme 80kg 180cm 30ans = 1780', function(){
  var bmr = NM.calcBMR('male', 80, 180, 30);
  // 10*80 + 6.25*180 - 5*30 + 5 = 800+1125-150+5 = 1780
  assert(bmr === 1780, 'bmr=' + bmr);
});
check('calcBMR femme 60kg 165cm 28ans = 1330', function(){
  var bmr = NM.calcBMR('female', 60, 165, 28);
  // 10*60 + 6.25*165 - 5*28 - 161 = 600+1031-140-161 = 1330
  assert(bmr === 1330, 'bmr=' + bmr);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. Snapshot calorique — valeurs stables ===');
// ══════════════════════════════════════════════════════════════════════════════

check('homme 80kg 180cm 30ans 1.55 maintain : cal ≈ TDEE (aucun ajustement)', function(){
  var r = NM.compute(FIXED_INPUT);
  var tdee = NM.calcTDEE(NM.calcBMR('male',80,180,30), 1.55);
  assert(Math.abs(r.caloriesTarget - tdee) < 50, 'cal=' + r.caloriesTarget + ' tdee=' + tdee);
});
check('protéines 80kg non-élite = 144g (1.8 × 80)', function(){
  var r = NM.compute(FIXED_INPUT);
  assert(r.proteinGrams === 144, 'prot=' + r.proteinGrams);
});
check('lipides 80kg = 64g (0.8 × 80)', function(){
  var r = NM.compute(FIXED_INPUT);
  assert(r.fatGrams === 64, 'fat=' + r.fatGrams);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. PERIODIZATION_CFG — snapshot valeurs stables ===');
// ══════════════════════════════════════════════════════════════════════════════

var PC = window.SFCSymbiosis.PERIODIZATION_CFG;

check('S1 : durMax=6, durSets=4', function(){
  assert(PC[1].durMax === 6 && PC[1].durSets === 4, JSON.stringify(PC[1]));
});
check('S2 : durMax=6, durSets=5', function(){
  assert(PC[2].durMax === 6 && PC[2].durSets === 5, JSON.stringify(PC[2]));
});
check('S3 : durMax=5, durSets=5, restOverride=120-180s', function(){
  assert(PC[3].durMax === 5 && PC[3].durSets === 5 && PC[3].restOverride === '120-180s', JSON.stringify(PC[3]));
});
check('S4 : durMax=4, durSets=3, restOverride=60s', function(){
  assert(PC[4].durMax === 4 && PC[4].durSets === 3 && PC[4].restOverride === '60s', JSON.stringify(PC[4]));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. package.json — test script inclut tous les fichiers clés ===');
// ══════════════════════════════════════════════════════════════════════════════

var pkg = JSON.parse(fs.readFileSync(ROOT + '/package.json', 'utf8'));
var testScript = pkg.scripts.test || '';

[
  'unit-calculs.js',
  'unit-hardening-p0p1.js',
  'unit-persistence.js',
  'test-safety-medical.js',
  'unit-recipe-auto-improver.js',
  'unit-snapshot-regression.js',
  'unit-symbiosis-real.js',
  'unit-recipe-ux-engine.js',
  'unit-recipe-auto-improver.js'
].forEach(function(f){
  check('package.json test inclut ' + f, function(){
    assert(testScript.indexOf(f) >= 0, f + ' manquant dans test script');
  });
});

// ─── Résultat ────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? '✅' : '❌') + ' unit-regression-post-merge : ' + pass + ' pass, ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
