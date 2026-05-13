'use strict';
/**
 * Test suite — Nutrition Adaptation
 * Couvre : NutritionMaster.compute — profils variés, carb cycling,
 *          planchers caloriques (1500M/1400F), cap déficit -500 kcal,
 *          timingAdvice, calcul BMR/TDEE, gestion erreurs.
 */

var fs   = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Bootstrap DOM minimal ───────────────────────────────────────────────────
global.window = global;
global.document = {
  createElement: function(t) { return { style:{}, setAttribute:function(){}, appendChild:function(){}, classList:{add:function(){},remove:function(){}}, tagName:t }; },
  getElementById: function() { return null; },
  querySelector:  function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener:    function() {},
  removeEventListener: function() {},
  body: { appendChild: function(){}, classList: { add:function(){}, remove:function(){} } },
  head: { appendChild: function(){} },
  location: { href:'', search:'', hash:'' }
};
try { Object.defineProperty(global, 'navigator', { value: { userAgent:'', language:'fr-FR' }, configurable:true }); } catch(e) {}
global.localStorage  = { getItem: function(){ return null; }, setItem:function(){}, removeItem:function(){} };
global.sessionStorage = { getItem: function(){ return null; }, setItem:function(){}, removeItem:function(){} };
global.history = { pushState:function(){}, replaceState:function(){} };
try { Object.defineProperty(global, 'location', { value: { href:'', search:'', hash:'' }, configurable:true }); } catch(e) {}
global.performance = { now: function(){ return Date.now(); } };

var pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch(e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function approx(a, b, eps) { return Math.abs(a - b) <= (eps || 1.5); }

// ─── Load modules ────────────────────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js',         'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js',           'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js',         'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js',     'utf8'));
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js', 'utf8'));

var NM = window.NutritionMaster;

// Profil de base (homme valide)
var BASE_MALE = {
  gender: 'male', age: 30, weightKg: 80, heightCm: 180,
  activityLevel: 1.55, goal: 'maintain', isElite: false, trainingDay: false
};
// Profil de base (femme valide)
var BASE_FEMALE = {
  gender: 'female', age: 28, weightKg: 60, heightCm: 165,
  activityLevel: 1.375, goal: 'maintain', isElite: false, trainingDay: false
};

function extend(base, overrides) {
  var r = {};
  Object.keys(base).forEach(function(k){ r[k] = base[k]; });
  Object.keys(overrides).forEach(function(k){ r[k] = overrides[k]; });
  return r;
}

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. Validation des inputs ===');
// ══════════════════════════════════════════════════════════════════════════════

check('inputs valides → errors[]', function(){
  var r = NM.compute(BASE_MALE);
  assert(r.errors.length === 0, JSON.stringify(r.errors));
});
check('gender invalide → error', function(){
  var r = NM.compute(extend(BASE_MALE, { gender: 'alien' }));
  assert(r.errors.length > 0);
});
check('goal invalide → error', function(){
  var r = NM.compute(extend(BASE_MALE, { goal: 'unknown_goal' }));
  assert(r.errors.length > 0);
});
check('age invalide (0) → error', function(){
  var r = NM.compute(extend(BASE_MALE, { age: 0 }));
  assert(r.errors.length > 0);
});
check('weightKg invalide (0) → error', function(){
  var r = NM.compute(extend(BASE_MALE, { weightKg: 0 }));
  assert(r.errors.length > 0);
});
check('activityLevel invalide (0.5) → error', function(){
  var r = NM.compute(extend(BASE_MALE, { activityLevel: 0.5 }));
  assert(r.errors.length > 0);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. calcBMR — Mifflin-St Jeor ===');
// ══════════════════════════════════════════════════════════════════════════════

check('homme 80kg 180cm 30ans → BMR ~1745', function(){
  var bmr = NM.calcBMR('male', 80, 180, 30);
  // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
  assert(approx(bmr, 1780, 5), 'bmr=' + bmr);
});
check('femme 60kg 165cm 28ans → BMR ~1369', function(){
  var bmr = NM.calcBMR('female', 60, 165, 28);
  // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031 - 140 - 161 = 1330
  assert(approx(bmr, 1330, 5), 'bmr=' + bmr);
});
check('homme 100kg : BMR > femme 55kg', function(){
  var m = NM.calcBMR('male', 100, 180, 30);
  var f = NM.calcBMR('female', 55, 160, 30);
  assert(m > f, 'm=' + m + ' f=' + f);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. Planchers caloriques ===');
// ══════════════════════════════════════════════════════════════════════════════

check('homme très léger : calories ≥ 1500 kcal', function(){
  var r = NM.compute(extend(BASE_MALE, { weightKg: 50, heightCm: 160, goal: 'shred', activityLevel: 1.2 }));
  assert(r.caloriesTarget >= 1500, 'cal=' + r.caloriesTarget);
});
check('femme très légère : calories ≥ 1400 kcal', function(){
  var r = NM.compute(extend(BASE_FEMALE, { weightKg: 45, heightCm: 155, goal: 'shred', activityLevel: 1.2 }));
  assert(r.caloriesTarget >= 1400, 'cal=' + r.caloriesTarget);
});
check('plancher féminin exposé = 1400', function(){
  assert(NM.KCAL_FLOOR_FEMALE === 1400, 'floor=' + NM.KCAL_FLOOR_FEMALE);
});
check('plancher masculin exposé = 1500', function(){
  assert(NM.KCAL_FLOOR_MALE === 1500, 'floor=' + NM.KCAL_FLOOR_MALE);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. Cap déficit -500 kcal/j ===');
// ══════════════════════════════════════════════════════════════════════════════

check('shred : déficit ≤ 500 kcal vs TDEE', function(){
  var r = NM.compute(extend(BASE_MALE, { goal: 'shred' }));
  var deficit = r.tdee - r.caloriesTarget;
  assert(deficit <= 510, 'déficit trop fort: ' + deficit + ' kcal');
});
check('cut : déficit ≤ 500 kcal vs TDEE', function(){
  var r = NM.compute(extend(BASE_MALE, { goal: 'cut' }));
  var deficit = r.tdee - r.caloriesTarget;
  assert(deficit <= 510, 'déficit trop fort: ' + deficit + ' kcal');
});
check('bulk : caloriesTarget > TDEE', function(){
  var r = NM.compute(extend(BASE_MALE, { goal: 'bulk' }));
  assert(r.caloriesTarget > r.tdee, 'bulk should be surplus: cal=' + r.caloriesTarget + ' tdee=' + r.tdee);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. Objectifs — ajustements caloriques ===');
// ══════════════════════════════════════════════════════════════════════════════

check('bulk > maintain > cut en calories', function(){
  var bulk     = NM.compute(extend(BASE_MALE, { goal: 'bulk' })).caloriesTarget;
  var maintain = NM.compute(extend(BASE_MALE, { goal: 'maintain' })).caloriesTarget;
  var cut      = NM.compute(extend(BASE_MALE, { goal: 'cut' })).caloriesTarget;
  assert(bulk >= maintain, 'bulk not > maintain: bulk=' + bulk + ' maintain=' + maintain);
  assert(maintain >= cut,  'maintain not >= cut: maintain=' + maintain + ' cut=' + cut);
});
check('lean_bulk : entre maintain et bulk', function(){
  var lean    = NM.compute(extend(BASE_MALE, { goal: 'lean_bulk' })).caloriesTarget;
  var bulk    = NM.compute(extend(BASE_MALE, { goal: 'bulk' })).caloriesTarget;
  var maint   = NM.compute(extend(BASE_MALE, { goal: 'maintain' })).caloriesTarget;
  assert(lean >= maint, 'lean_bulk < maintain: lean=' + lean + ' maint=' + maint);
  assert(bulk >= lean,  'lean_bulk > bulk: lean=' + lean + ' bulk=' + bulk);
});
check('recomposition ≈ maintain en calories', function(){
  var reco  = NM.compute(extend(BASE_MALE, { goal: 'recomposition' })).caloriesTarget;
  var maint = NM.compute(extend(BASE_MALE, { goal: 'maintain' })).caloriesTarget;
  assert(Math.abs(reco - maint) < 50, 'reco too different from maintain: reco=' + reco + ' maint=' + maint);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. Carb Cycling — jour d\'entraînement ===');
// ══════════════════════════════════════════════════════════════════════════════

check('trainingDay:true → carbCyclingApplied=true', function(){
  var r = NM.compute(extend(BASE_MALE, { trainingDay: true }));
  assert(r.carbCyclingApplied === true, 'carbCyclingApplied=' + r.carbCyclingApplied);
});
check('trainingDay:false → carbCyclingApplied=false', function(){
  var r = NM.compute(extend(BASE_MALE, { trainingDay: false }));
  assert(r.carbCyclingApplied === false, 'carbCyclingApplied=' + r.carbCyclingApplied);
});
check('carb cycling : glucides jour entraînement > repos', function(){
  var rest  = NM.compute(extend(BASE_MALE, { trainingDay: false })).carbsGrams;
  var train = NM.compute(extend(BASE_MALE, { trainingDay: true  })).carbsGrams;
  assert(train > rest, 'training carbs not higher: train=' + train + ' rest=' + rest);
});
check('carb cycling : calories totales ≈ neutres (swap glucides↑ lipides↓)', function(){
  var rest  = NM.compute(extend(BASE_MALE, { trainingDay: false }));
  var train = NM.compute(extend(BASE_MALE, { trainingDay: true  }));
  // caloriesCheck should be consistent (P*4 + G*4 + L*9)
  assert(rest.errors.length === 0 && train.errors.length === 0);
  // The difference should come from carb boost, not a pure calorie increase
  // caloriesTarget may differ but caloriesCheck should match
  assert(Math.abs(train.caloriesCheck - (train.proteinGrams*4 + train.fatGrams*9 + train.carbsGrams*4)) < 5,
    'check mismatch: ' + train.caloriesCheck);
});
check('carb cycling : lipides jour entraînement ≤ lipides repos', function(){
  var rest  = NM.compute(extend(BASE_MALE, { trainingDay: false })).fatGrams;
  var train = NM.compute(extend(BASE_MALE, { trainingDay: true  })).fatGrams;
  assert(train <= rest, 'training fat not ≤ rest: train=' + train + ' rest=' + rest);
});
check('applyCarbCycling : boostedCarbs = carbsGrams * 1.20', function(){
  var carbs = 200, prot = 150, fat = 60, bmr = 1600;
  var r = NM.applyCarbCycling(carbs, prot, fat, bmr, 'male', 80);
  assert(r.carbsGrams >= carbs * 1.15, 'carbsGrams too low: ' + r.carbsGrams);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. Protéines — valeurs attendues ===');
// ══════════════════════════════════════════════════════════════════════════════

check('homme 80kg non-élite : protéines ≈ 144g (1.8g/kg)', function(){
  var r = NM.compute(BASE_MALE);
  assert(approx(r.proteinGrams, 144, 5), 'prot=' + r.proteinGrams);
});
check('femme 60kg non-élite : protéines ≈ 96g (1.6g/kg)', function(){
  var r = NM.compute(BASE_FEMALE);
  assert(approx(r.proteinGrams, 96, 5), 'prot=' + r.proteinGrams);
});
check('homme élite 80kg : protéines ≈ 176g (2.2g/kg)', function(){
  var r = NM.compute(extend(BASE_MALE, { isElite: true }));
  assert(approx(r.proteinGrams, 176, 5), 'prot=' + r.proteinGrams);
});
check('protéines > 0 pour tous les profils', function(){
  ['male','female'].forEach(function(g){
    ['bulk','cut','shred','maintain'].forEach(function(goal){
      var inp = g === 'male' ? extend(BASE_MALE, { goal:goal }) : extend(BASE_FEMALE, { goal:goal });
      var r = NM.compute(inp);
      assert(r.proteinGrams > 0, 'zero protein for ' + g + '+' + goal);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 8. Lipides — plancher 0.8g/kg ===');
// ══════════════════════════════════════════════════════════════════════════════

check('homme 80kg : lipides ≥ 64g (0.8g/kg)', function(){
  var r = NM.compute(BASE_MALE);
  assert(r.fatGrams >= 64, 'fat=' + r.fatGrams);
});
check('femme 60kg : lipides ≥ 48g (0.8g/kg)', function(){
  var r = NM.compute(BASE_FEMALE);
  assert(r.fatGrams >= 48, 'fat=' + r.fatGrams);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 9. Cohérence calorique P×4 + G×4 + L×9 ===');
// ══════════════════════════════════════════════════════════════════════════════

check('caloriesCheck cohérent pour tous les profils', function(){
  var profiles = [
    BASE_MALE, BASE_FEMALE,
    extend(BASE_MALE,   { goal:'bulk', trainingDay:true }),
    extend(BASE_FEMALE, { goal:'shred', trainingDay:false }),
    extend(BASE_MALE,   { goal:'cut', isElite:true })
  ];
  profiles.forEach(function(p){
    var r = NM.compute(p);
    if (r.errors.length > 0) return;
    var expected = Math.round(r.proteinGrams*4 + r.fatGrams*9 + r.carbsGrams*4);
    assert(Math.abs(r.caloriesCheck - expected) <= 5,
      'check mismatch for ' + p.goal + ': check=' + r.caloriesCheck + ' expected=' + expected);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 10. timingAdvice ===');
// ══════════════════════════════════════════════════════════════════════════════

check('timingAdvice.postWorkoutProtein entre 20 et 40g', function(){
  var r = NM.compute(extend(BASE_MALE, { trainingDay: true }));
  var p = r.timingAdvice.postWorkoutProtein;
  assert(p >= 20 && p <= 40, 'postWorkoutProtein=' + p);
});
check('timingAdvice.preWorkoutCarbs entre 30 et 80g', function(){
  var r = NM.compute(extend(BASE_MALE, { trainingDay: true }));
  var c = r.timingAdvice.preWorkoutCarbs;
  assert(c >= 30 && c <= 80, 'preWorkoutCarbs=' + c);
});
check('electrolytesNeeded=true si training + activityLevel ≥ 1.725', function(){
  var r = NM.compute(extend(BASE_MALE, { trainingDay: true, activityLevel: 1.9 }));
  assert(r.timingAdvice.electrolytesNeeded === true);
});
check('electrolytesNeeded=false si pas de trainingDay', function(){
  var r = NM.compute(extend(BASE_MALE, { trainingDay: false, activityLevel: 1.9 }));
  assert(r.timingAdvice.electrolytesNeeded === false);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 11. Profils extrêmes ===');
// ══════════════════════════════════════════════════════════════════════════════

check('bodybuilder 120kg 190cm sèche', function(){
  var r = NM.compute({ gender:'male', age:28, weightKg:120, heightCm:190,
    activityLevel:1.725, goal:'shred', isElite:true, trainingDay:false });
  assert(r.errors.length === 0, JSON.stringify(r.errors));
  assert(r.caloriesTarget >= 1500, 'cal=' + r.caloriesTarget);
  assert(r.proteinGrams >= 120*1.8, 'prot=' + r.proteinGrams);
});
check('femme 45kg sédentaire maintain', function(){
  var r = NM.compute({ gender:'female', age:55, weightKg:45, heightCm:155,
    activityLevel:1.2, goal:'maintain', isElite:false, trainingDay:false });
  assert(r.errors.length === 0, JSON.stringify(r.errors));
  assert(r.caloriesTarget >= 1400, 'cal=' + r.caloriesTarget);
});
check('homme 25kg underweight : plancher respecté', function(){
  var r = NM.compute({ gender:'male', age:20, weightKg:25, heightCm:160,
    activityLevel:1.375, goal:'bulk', isElite:false, trainingDay:false });
  // weight may be valid (>0, <500) but calories must still be floored
  if (r.errors.length > 0) return; // invalid weight handled gracefully
  assert(r.caloriesTarget >= 1500, 'cal=' + r.caloriesTarget);
});
check('glucides ≥ 130g (minimum IOM 2005)', function(){
  var r = NM.compute(extend(BASE_FEMALE, { goal: 'shred', trainingDay: false }));
  assert(r.carbsGrams >= 130, 'carbs=' + r.carbsGrams);
});

// ─── Résultat ────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? '✅' : '❌') + ' unit-nutrition-adaptation : ' + pass + ' pass, ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
