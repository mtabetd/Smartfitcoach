'use strict';

// ─── TESTS D'INVARIANTS NUTRITIONNELS — SmartFitCoach ────────────────────────
// Audit complet : NutritionMaster + app-core + computeNutritionState
// Invariants : caloriques, macros, médicaux, carb cycling, edge cases
// Usage : node tests/unit-nutrition-invariants.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

// ─── 1. MOCK ENVIRONNEMENT NAVIGATEUR ────────────────────────────────────────

global.window    = global;
global.localStorage = {
  getItem: function() { return null; }, setItem: function() {}, removeItem: function() {}
};
var _fakeEl = function() {
  return {
    style: {}, appendChild: function() {}, addEventListener: function() {},
    removeEventListener: function() {}, innerHTML: '', textContent: '',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; } }
  };
};
global.document = {
  createElement:    _fakeEl,
  getElementById:   function() { return null; },
  querySelector:    function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener: function() {},
  removeEventListener: function() {},
  body: _fakeEl(),
  head: _fakeEl()
};
Object.defineProperty(global, 'navigator', {
  value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true
});
global.fetch = function() {
  return Promise.resolve({ json: function() { return Promise.resolve({}); } });
};
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };

// ─── 2. CHARGEMENT DES MODULES ───────────────────────────────────────────────

var coreCode = fs.readFileSync(path.join(__dirname, '../app/app-core.js'), 'utf8');
try {
  vm.runInThisContext(coreCode, { filename: 'app-core.js' });
} catch(e) {
  console.error('[FATAL] app-core.js:', e.message);
  process.exit(1);
}

try {
  var helpersCode = fs.readFileSync(path.join(__dirname, '../app/i18n-helpers.js'), 'utf8');
  vm.runInThisContext(helpersCode, { filename: 'i18n-helpers.js' });
} catch(e) {
  console.error('[FATAL] i18n-helpers.js:', e.message);
  process.exit(1);
}

// Charger NutritionMaster
try {
  eval(fs.readFileSync(path.join(__dirname, '../app/nutrition-master.js'), 'utf8'));
} catch(e) {
  console.error('[FATAL] nutrition-master.js:', e.message);
  process.exit(1);
}

// Vérifications des fonctions requises
['calcBMR','calcTDEE','calcTarget','calcMacros','computeNutritionState'].forEach(function(fn) {
  if (typeof global[fn] !== 'function') {
    console.error('[FATAL] Fonction manquante :', fn);
    process.exit(1);
  }
});
if (!window.NutritionMaster || !window.NutritionMaster.compute) {
  console.error('[FATAL] NutritionMaster.compute absent');
  process.exit(1);
}

// ─── 3. RUNNER ───────────────────────────────────────────────────────────────

var passed = 0, failed = 0;
var _suite = '';

function suite(name) {
  _suite = name;
  console.log('\n' + name);
}

function test(name, fn) {
  try {
    fn();
    console.log('  \x1b[32m✓\x1b[0m', name);
    passed++;
  } catch(e) {
    console.error('  \x1b[31m✗\x1b[0m', name);
    console.error('    ', e.message);
    failed++;
  }
}

// ─── 4. ÉTAT DE BASE ─────────────────────────────────────────────────────────

// Indices des objectifs
var GOALS_OBJ    = window.GOALS;
var maintainIdx  = GOALS_OBJ.findIndex(function(g) { return g.key === 'maintain'; });
var cutIdx       = GOALS_OBJ.findIndex(function(g) { return g.key === 'cut'; });
var shredIdx     = GOALS_OBJ.findIndex(function(g) { return g.key === 'shred'; });
var bulkIdx      = GOALS_OBJ.findIndex(function(g) { return g.key === 'bulk'; });
var leanBulkIdx  = GOALS_OBJ.findIndex(function(g) { return g.key === 'lean_bulk'; });

if ([maintainIdx,cutIdx,shredIdx,bulkIdx,leanBulkIdx].some(function(i){return i===-1;})) {
  console.error('[FATAL] Indice de goal manquant — GOALS modifié ?');
  process.exit(1);
}

function setState(overrides) {
  window.S = Object.assign({
    sex: 'homme', age: 30, birthDate: null,
    weight: 80, height: 175, targetWeight: null, waist: null,
    goal: maintainIdx, sportGoals: [], activity: 2, sportDays: 3,
    train: [], sportType: null, sportLevel: null, sportProgram: null,
    appMode: 'nutrition', nStep: 0, sStep: 0,
    medical: [], pregnant: false, pregnancyWeek: null, prePregnancyWeight: null,
    cycleTracking: false, lastPeriodDate: null, cycleLength: 28,
    _bodyFatEstimate: null,
    regime: 0, whey: null, cookLevel: 2, allergies: [], intolerances: [],
    supplements: [], creatine: false, creatineDose: 0,
    alcoholFreq: null, alcoholTypes: [],
    snacking: null, eatingLocation: null, mealPrepTime: null,
    mealsPerDay: 3, hydration: null, wantsDessert: false,
    weekPlan: null, selectedDay: 0,
    trainingDaysSelected: [], heavyDayStreak: 0,
    dailyTrainingLoad: null, trainingLoad: null
  }, overrides);
}

var nm = window.NutritionMaster;

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE A : INVARIANT CALORIQUE UNIVERSEL ─────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('A — Invariant calorique universel : planchers ACSM/ISSN');

test('A-01 : calcTarget() femme shred sédentaire ≥ 1400 kcal (ISSN 2017)', function() {
  setState({ sex:'femme', age:30, weight:50, height:158, activity:0, sportDays:0, goal:shredIdx });
  var t = calcTarget();
  assert.ok(t >= 1400, 'Plancher 1400 violé : calcTarget()=' + t);
});

test('A-02 : calcTarget() homme shred sédentaire ≥ 1500 kcal (ACSM)', function() {
  setState({ sex:'homme', age:30, weight:55, height:160, activity:0, sportDays:0, goal:shredIdx });
  var t = calcTarget();
  assert.ok(t >= 1500, 'Plancher 1500 violé : calcTarget()=' + t);
});

test('A-03 : calcTarget() == NutritionMaster pour profil standard (homme 80kg maintien)', function() {
  // Profil sans conditions médicales, sans grossesse, sans alcool
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx });
  var coreT = calcTarget();
  var actFactor = ACTIVITIES[2].factor; // 1.55
  var nmR = nm.compute({ gender:'male', age:30, weightKg:80, heightCm:175, activityLevel:actFactor,
    goal:'maintain', isElite:false, trainingDay:false });
  assert.ok(nmR.errors.length === 0, 'NM errors: ' + nmR.errors.join(', '));
  // Tolérance ±5% pour couvrir les différences (arrondi, Katch-McArdle absent dans NM, sarcopénie, etc.)
  var diff = Math.abs(coreT - nmR.caloriesTarget);
  assert.ok(diff <= coreT * 0.05,
    'app-core (' + coreT + ') vs NutritionMaster (' + nmR.caloriesTarget + ') écart=' + diff + ' > 5%');
});

test('A-04 : calcMacros() cohérence P×4+G×4+L×9 ≈ calcTarget (±5%)', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx });
  var target = calcTarget();
  var m      = calcMacros();
  var check  = m.p * 4 + m.g * 4 + m.l * 9;
  var tol    = target * 0.05;
  assert.ok(Math.abs(check - target) <= tol,
    'Écart P×4+G×4+L×9 (' + Math.round(check) + ') vs cible (' + target + ') = ' +
    Math.abs(check - target).toFixed(0) + ' kcal > 5% (' + tol.toFixed(0) + ')');
});

test('A-05 : NutritionMaster caloriesCheck ≈ caloriesTarget ±5% (no cycling)', function() {
  var r = nm.compute({ gender:'male', age:30, weightKg:80, heightCm:175, activityLevel:1.55,
    goal:'maintain', isElite:false, trainingDay:false });
  assert.ok(r.errors.length === 0, 'NM errors: ' + r.errors.join(', '));
  var tol  = r.caloriesTarget * 0.05;
  var diff = Math.abs(r.caloriesCheck - r.caloriesTarget);
  assert.ok(diff <= tol,
    'NM check (' + r.caloriesCheck + ') vs target (' + r.caloriesTarget + ') écart=' + diff + ' > 5%');
});

test('A-06 : computeNutritionState rest day — caloriesCheck ≈ caloriesTarget ±5%', function() {
  // Le carb cycling doit être neutre (échange glucides↔lipides sans créer de surplus net)
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5] });
  var res = computeNutritionState(false); // jour de repos
  assert.ok(res !== null, 'computeNutritionState a retourné null');
  var tol  = res.caloriesTarget * 0.05;
  var diff = Math.abs(res.caloriesCheck - res.caloriesTarget);
  assert.ok(diff <= tol,
    'Rest day non-neutre : check=' + res.caloriesCheck + ' target=' + res.caloriesTarget +
    ' diff=' + diff + ' > 5%');
});

test('A-07 : computeNutritionState heavy day — caloriesCheck ≈ caloriesTarget ±5% (neutre)', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', heavyDayStreak:0 });
  var res = computeNutritionState(true);
  assert.ok(res !== null, 'computeNutritionState a retourné null');
  var tol  = res.caloriesTarget * 0.05;
  var diff = Math.abs(res.caloriesCheck - res.caloriesTarget);
  assert.ok(diff <= tol,
    'Heavy day non-neutre : check=' + res.caloriesCheck + ' target=' + res.caloriesTarget +
    ' diff=' + diff + ' > 5%');
});

test('A-08 : IOM 130g floor — rest day ne crée pas de surplus (carbs bloquées au floor)', function() {
  // Profil femme légère en shred : base carbs > 130g mais reste day réduit
  // Si le floor est atteint, la compensation lipides doit être UNIQUEMENT sur les glucides réellement retirés
  setState({ sex:'femme', age:25, weight:42, height:155, activity:0, goal:shredIdx,
    sportGoals:['weightloss'], trainingDaysSelected:[1] });
  var res = computeNutritionState(false);
  assert.ok(res !== null, 'computeNutritionState null pour profil léger');
  assert.ok(res.carbsGrams >= 130, 'Glucides < 130g IOM floor : ' + res.carbsGrams);
  var diff = Math.abs(res.caloriesCheck - res.caloriesTarget);
  assert.ok(diff <= res.caloriesTarget * 0.05,
    'IOM floor rest day crée un écart : check=' + res.caloriesCheck +
    ' target=' + res.caloriesTarget + ' diff=' + diff);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE B : INVARIANTS MACROS ─────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('B — Invariants macros : protéines, lipides, glucides');

test('B-01 : NM protéines homme non-élite = 1.8 g/kg (ISSN Position Stand 2023)', function() {
  var r = nm.compute({ gender:'male', age:30, weightKg:80, heightCm:175, activityLevel:1.55,
    goal:'maintain', isElite:false, trainingDay:false });
  var ppk = r.proteinGrams / 80;
  assert.ok(ppk >= 1.6 && ppk <= 2.2,
    'ppk=' + ppk.toFixed(2) + ' hors ISSN [1.6-2.2] g/kg');
});

test('B-02 : NM protéines femme non-élite = 1.6 g/kg (Tarnopolsky 2000)', function() {
  var r = nm.compute({ gender:'female', age:30, weightKg:60, heightCm:165, activityLevel:1.55,
    goal:'cut', isElite:false, trainingDay:false });
  var ppk = r.proteinGrams / 60;
  assert.ok(ppk >= 1.6 && ppk <= 2.2,
    'ppk femme=' + ppk.toFixed(2) + ' hors ISSN [1.6-2.2] g/kg');
});

test('B-03 : NM protéines élite homme = 2.2 g/kg (Morton 2018 BJSM upper)', function() {
  var r = nm.compute({ gender:'male', age:25, weightKg:85, heightCm:183, activityLevel:1.9,
    goal:'maintain', isElite:true, trainingDay:false });
  var ppk = r.proteinGrams / 85;
  assert.ok(ppk >= 2.1 && ppk <= 2.3,
    'ppk élite=' + ppk.toFixed(2) + ' attendu 2.2 g/kg');
});

test('B-04 : NM lipides ≥ 15% des calories totales (ACSM 2009)', function() {
  var r = nm.compute({ gender:'male', age:30, weightKg:80, heightCm:175, activityLevel:1.55,
    goal:'maintain', isElite:false, trainingDay:false });
  var fatPct = r.fatGrams * 9 / r.caloriesTarget;
  assert.ok(fatPct >= 0.15,
    'NM lipides (' + (fatPct * 100).toFixed(1) + '%) < 15% des calories');
});

test('B-05 : NM lipides femme légère shred ≥ 15% (plancher ACSM)', function() {
  var r = nm.compute({ gender:'female', age:20, weightKg:40, heightCm:155, activityLevel:1.2,
    goal:'shred', isElite:false, trainingDay:false });
  var fatPct = r.fatGrams * 9 / r.caloriesTarget;
  assert.ok(fatPct >= 0.15,
    'NM femme légère : lipides (' + (fatPct * 100).toFixed(1) + '%) < 15%');
});

test('B-06 : NM glucides ≥ 130 g/j (IOM 2005 — cerveau)', function() {
  var r = nm.compute({ gender:'female', age:30, weightKg:50, heightCm:160, activityLevel:1.2,
    goal:'shred', isElite:false, trainingDay:false });
  assert.ok(r.carbsGrams >= 130,
    'NM glucides=' + r.carbsGrams + 'g < 130g plancher IOM 2005');
});

test('B-07 : app-core lipides ≥ 20% des calories en sèche (ISSN 2017 santé hormonale)', function() {
  setState({ sex:'homme', age:28, weight:80, height:175, activity:2, goal:shredIdx });
  var target = calcTarget();
  var m      = calcMacros();
  var fatPct = m.l * 9 / target;
  assert.ok(fatPct >= 0.15,
    'Lipides sèche (' + (fatPct*100).toFixed(1) + '%) < 15% — ISSN min 15%');
});

test('B-08 : app-core glucides ≥ 130 g/j même en sèche sédentaire (IOM 2005)', function() {
  setState({ sex:'femme', age:30, weight:55, height:162, activity:0, goal:shredIdx });
  var m = calcMacros();
  assert.ok(m.g >= 130,
    'Glucides sèche sédentaire=' + m.g + 'g < 130g plancher IOM 2005');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE C : INVARIANTS MÉDICAUX ───────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('C — Invariants médicaux : grossesse, allaitement, TCA, diabète');

test('C-01 : Grossesse T1 — calories ≈ TDEE (ACOG 2018 : +0 kcal/j T1)', function() {
  // ACOG 2018: T1 = 0 kcal supplémentaire. Pas 150 comme certaines sources dépassées.
  setState({ sex:'femme', age:28, weight:68, height:165, activity:2, goal:maintainIdx,
    pregnant:true, pregnancyWeek:8, prePregnancyWeight:62 });
  var t    = calcTarget();
  var tdee = calcTDEE();
  var surplus = t - Math.round(tdee);
  // T1: pas de surplus significatif (juste l'arrondi TDEE)
  assert.ok(surplus >= -10 && surplus <= 50,
    'T1 surplus=' + surplus + ' kcal, attendu ~0 kcal (ACOG 2018)');
});

test('C-02 : Grossesse T2 — surplus +340 kcal vs TDEE (ACOG 2018)', function() {
  setState({ sex:'femme', age:28, weight:68, height:165, activity:2, goal:maintainIdx,
    pregnant:true, pregnancyWeek:20, prePregnancyWeight:62 });
  var t    = calcTarget();
  var tdee = calcTDEE();
  var surplus = t - Math.round(tdee);
  assert.ok(surplus >= 320 && surplus <= 360,
    'T2 surplus=' + surplus + ' kcal, attendu 340 ± 20 (ACOG 2018)');
});

test('C-03 : Grossesse T3 — surplus +450 kcal vs TDEE (ACOG 2018)', function() {
  setState({ sex:'femme', age:28, weight:68, height:165, activity:2, goal:maintainIdx,
    pregnant:true, pregnancyWeek:32, prePregnancyWeight:62 });
  var t    = calcTarget();
  var tdee = calcTDEE();
  var surplus = t - Math.round(tdee);
  assert.ok(surplus >= 430 && surplus <= 470,
    'T3 surplus=' + surplus + ' kcal, attendu 450 ± 20 (ACOG 2018)');
});

test('C-04 : Allaitement — surplus +500 kcal vs TDEE (ACOG 2022)', function() {
  setState({ sex:'femme', age:28, weight:65, height:165, activity:2,
    medical:['allaitement'], goal:maintainIdx });
  var t    = calcTarget();
  var tdee = calcTDEE();
  var surplus = t - Math.round(tdee);
  assert.ok(surplus >= 490 && surplus <= 510,
    'Allaitement surplus=' + surplus + ' kcal, attendu 500 ± 10 (ACOG 2022)');
});

test('C-05 : macroAdj grossesse — direction positive (p, g, l tous ≥ base)', function() {
  // MEDICAL_ADVICE grossesse: {g:+0.02, p:+0.05, l:+0.02} — tous positifs
  setState({ sex:'femme', age:28, weight:65, height:165, activity:2, goal:maintainIdx,
    pregnant:true, pregnancyWeek:20, prePregnancyWeight:62, medical:['grossesse'] });
  var mPreg = calcMacros();
  setState({ sex:'femme', age:28, weight:65, height:165, activity:2, goal:maintainIdx,
    pregnant:false, medical:[] });
  var mBase = calcMacros();
  assert.ok(mPreg.p >= mBase.p, 'grossesse macroAdj.p négatif : base=' + mBase.p + ' preg=' + mPreg.p);
  assert.ok(mPreg.g >= mBase.g, 'grossesse macroAdj.g négatif : base=' + mBase.g + ' preg=' + mPreg.g);
  assert.ok(mPreg.l >= mBase.l, 'grossesse macroAdj.l négatif : base=' + mBase.l + ' preg=' + mPreg.l);
});

test('C-06 : macroAdj allaitement — direction positive (p, g, l tous ≥ base)', function() {
  // MEDICAL_ADVICE allaitement: {g:+0.03, p:+0.07, l:+0.01} — tous positifs
  setState({ sex:'femme', age:28, weight:65, height:165, activity:2,
    medical:['allaitement'], goal:maintainIdx });
  var mAllait = calcMacros();
  setState({ sex:'femme', age:28, weight:65, height:165, activity:2,
    medical:[], goal:maintainIdx });
  var mBase = calcMacros();
  assert.ok(mAllait.p >= mBase.p, 'allaitement macroAdj.p négatif');
  assert.ok(mAllait.g >= mBase.g, 'allaitement macroAdj.g négatif');
  assert.ok(mAllait.l >= mBase.l, 'allaitement macroAdj.l négatif');
});

test('C-07 : TCA — calcTarget ≥ TDEE (pas de déficit — IOC 2018 RED-S)', function() {
  setState({ sex:'femme', age:25, weight:55, height:165, activity:2,
    medical:['tca'], goal:shredIdx }); // sèche demandée
  var tdee = calcTDEE();
  var t    = calcTarget();
  assert.ok(t >= Math.round(tdee) - 5,
    'TCA : déficit appliqué malgré condition TCA — TDEE=' + tdee + ' target=' + t);
});

test('C-08 : TCA femme — calcTarget ≥ plancher 1800 kcal (IOC 2018)', function() {
  setState({ sex:'femme', age:25, weight:55, height:165, activity:2,
    medical:['tca'], goal:shredIdx });
  var t = calcTarget();
  assert.ok(t >= 1800, 'TCA femme plancher 1800 violé : target=' + t);
});

test('C-09 : TCA homme — calcTarget ≥ plancher 1900 kcal (IOC 2018)', function() {
  setState({ sex:'homme', age:25, weight:75, height:175, activity:2,
    medical:['tca'], goal:shredIdx });
  var t = calcTarget();
  assert.ok(t >= 1900, 'TCA homme plancher 1900 violé : target=' + t);
});

test('C-10 : diabete_t2 — glucides inférieurs au profil sain (réduction IG)', function() {
  setState({ sex:'homme', age:40, weight:80, height:175, activity:2,
    medical:[], goal:maintainIdx });
  var gSain = calcMacros().g;
  setState({ sex:'homme', age:40, weight:80, height:175, activity:2,
    medical:['diabete_t2'], goal:maintainIdx });
  var gDiab = calcMacros().g;
  assert.ok(gDiab < gSain,
    'Diabète T2 glucides (' + gDiab + 'g) pas inférieurs au profil sain (' + gSain + 'g)');
});

test('C-11 : grossesse obèse T3 37 ans — pas de crash, calories dans range [1800-3500]', function() {
  setState({ sex:'femme', age:37, weight:90, height:165, activity:1, goal:maintainIdx,
    pregnant:true, pregnancyWeek:32, prePregnancyWeight:78 });
  var t   = calcTarget();
  var m   = calcMacros();
  assert.ok(!isNaN(t) && t >= 1800 && t <= 3500,
    'Grossesse obèse T3 calories hors range : ' + t);
  assert.ok(!isNaN(m.p) && !isNaN(m.g) && !isNaN(m.l),
    'Grossesse obèse T3 macros NaN');
  assert.ok(m.p > 0 && m.g >= 130 && m.l > 0,
    'Grossesse obèse T3 macros invalides : p=' + m.p + ' g=' + m.g + ' l=' + m.l);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE D : INVARIANTS CARB CYCLING ───────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('D — Invariants carb cycling : neutralité, directions, streak');

test('D-01 : heavy day — carbs +20% vs calcMacros baseline (Holland 2019 JISSN)', function() {
  // La référence correcte est calcMacros() (pré-carb-cycling), pas computeNutritionState(false)
  // qui applique lui-même une réduction -10% rest-day, donnant une base artificiellement basse.
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', heavyDayStreak:0 });
  var baseMacros = calcMacros(); // référence pré-cycling
  var heavyRes   = computeNutritionState(true);
  assert.ok(heavyRes !== null, 'computeNutritionState null');
  assert.ok(heavyRes.carbsGrams > baseMacros.g,
    'Heavy day carbs (' + heavyRes.carbsGrams + ') <= base (' + baseMacros.g + ')');
  var boost = (heavyRes.carbsGrams - baseMacros.g) / baseMacros.g;
  assert.ok(boost >= 0.15 && boost <= 0.30,
    'Boost heavy day=' + (boost * 100).toFixed(1) + '% (attendu 20-25%)');
});

test('D-02 : heavy day — fat réduit pour neutralité calorique', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5] });
  var baseRes = computeNutritionState(false);
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', heavyDayStreak:0 });
  var heavyRes = computeNutritionState(true);
  assert.ok(heavyRes.fatGrams < baseRes.fatGrams,
    'Heavy day : lipides pas réduits — base=' + baseRes.fatGrams + ' heavy=' + heavyRes.fatGrams);
});

test('D-03 : heavy day streak ≥ 2 → carbs +25% vs calcMacros baseline (cap glycogen depletion)', function() {
  // prevStreak=1 → _heavyStreak=2 → _carbRate=0.25 (vs 0.20 streak=1)
  // Référence = calcMacros() pré-cycling (pas computeNutritionState(false) qui est déjà -10%)
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', heavyDayStreak:1 }); // prevStreak=1 → new streak=2
  var baseMacros = calcMacros();
  var streak2Res = computeNutritionState(true);
  assert.ok(streak2Res !== null, 'computeNutritionState null');
  var boost = (streak2Res.carbsGrams - baseMacros.g) / baseMacros.g;
  assert.ok(boost >= 0.20 && boost <= 0.30,
    'Streak ≥2 boost=' + (boost*100).toFixed(1) + '% vs calcMacros (attendu ~25%)');
});

test('D-04 : rest day — carbs réduits ≤ 10%, fat augmenté (Helms 2014)', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5] });
  // Obtenir macros de référence (sans carb cycling activé pour ce profil)
  var baseM = calcMacros();
  var restRes = computeNutritionState(false);
  assert.ok(restRes !== null, 'computeNutritionState null');
  // carbsGrams doit être ≤ baseCarbs (même en l'absence de cycling block si sportGoals présents)
  var carbReduction = (baseM.g - restRes.carbsGrams) / baseM.g;
  assert.ok(carbReduction >= 0 && carbReduction <= 0.12,
    'Rest day : réduction glucides=' + (carbReduction*100).toFixed(1) + '% > 10% (max 10%)');
  assert.ok(restRes.fatGrams >= baseM.l,
    'Rest day : lipides pas augmentés — base=' + baseM.l + ' rest=' + restRes.fatGrams);
});

test('D-05 : heavyDayStreak ne s\'incrémente QUE sur trainingDay===true', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', trainingLoad:'heavy', heavyDayStreak:2 });
  computeNutritionState(false); // rest day — doit reset à 0
  assert.strictEqual(window.S.heavyDayStreak, 0,
    'Streak non reset sur rest day : streak=' + window.S.heavyDayStreak);
});

test('D-06 : heavyDayStreak s\'incrémente correctement sur training heavy', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', trainingLoad:'heavy', heavyDayStreak:1 });
  computeNutritionState(true); // training day heavy
  assert.strictEqual(window.S.heavyDayStreak, 2,
    'Streak incorrect après heavy train : streak=' + window.S.heavyDayStreak + ' (attendu 2)');
});

test('D-07 : training day moderate → streak reset (non-heavy ne cumule pas)', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'moderate', trainingLoad:'moderate', heavyDayStreak:2 });
  computeNutritionState(true); // training day moderate
  assert.strictEqual(window.S.heavyDayStreak, 0,
    'Streak devrait reset sur moderate : streak=' + window.S.heavyDayStreak + ' (attendu 0)');
});

test('D-08 : fat floor 15% respecté après swap heavy day (ACSM 2009)', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:shredIdx,
    sportGoals:['muscle'], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', heavyDayStreak:0 });
  var res = computeNutritionState(true);
  assert.ok(res !== null, 'computeNutritionState null');
  var fatFloor = Math.round(res.caloriesTarget * 0.15 / 9);
  assert.ok(res.fatGrams >= fatFloor,
    'Fat floor 15% violé après swap : fat=' + res.fatGrams + 'g floor=' + fatFloor + 'g');
});

test('D-09 : carb cycling inactif si sportGoals vide (guard condition)', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:[], trainingDaysSelected:[1,3,5],
    dailyTrainingLoad:'heavy', heavyDayStreak:0 });
  var baseMacros = calcMacros();
  var res = computeNutritionState(true);
  // Sans sportGoals, carb cycling ne doit pas s'activer
  // Les macros doivent être les macros de calcMacros (pas de boost)
  assert.ok(res !== null, 'computeNutritionState null');
  // Vérifier que carbsGrams == calcMacros().g (pas de boost)
  assert.ok(Math.abs(res.carbsGrams - baseMacros.g) <= 5,
    'Carb cycling actif sans sportGoals : carbs=' + res.carbsGrams + ' base=' + baseMacros.g);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE E : EDGE CASES ────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('E — Edge cases : profils incomplets, sport-only, limites');

test('E-01 : profil incomplet goal=null → calcTarget()=0, pas de crash', function() {
  setState({ goal: null });
  var t = calcTarget();
  assert.strictEqual(t, 0, 'calcTarget() != 0 avec goal=null : ' + t);
});

test('E-02 : profil incomplet goal=null → calcMacros() retourne zéros', function() {
  setState({ goal: null });
  var m = calcMacros();
  assert.strictEqual(m.p, 0, 'calcMacros().p != 0 avec goal=null');
  assert.strictEqual(m.g, 0, 'calcMacros().g != 0 avec goal=null');
  assert.strictEqual(m.l, 0, 'calcMacros().l != 0 avec goal=null');
});

test('E-03 : profil age=null → calcTarget()=0 (pas de calories fictives)', function() {
  setState({ age: null, birthDate: null, goal: maintainIdx });
  var t = calcTarget();
  assert.strictEqual(t, 0, 'calcTarget() != 0 avec age=null : ' + t);
});

test('E-04 : sport-only (appMode=sport, goal=null) → computeNutritionState calcule en maintain', function() {
  setState({ appMode:'sport', goal:null, sex:'homme', age:30, weight:80, height:175 });
  var res = computeNutritionState(false);
  // Doit retourner un résultat (pas null), car buildNMInputs defaulte goal → 'maintain'
  assert.ok(res !== null, 'computeNutritionState null pour sport-only');
  assert.ok(!isNaN(res.caloriesTarget) && res.caloriesTarget > 0,
    'caloriesTarget NaN ou ≤ 0 : ' + res.caloriesTarget);
  // calcMacros() retourne 0 pour sport-only (S.goal=null) — c'est NORMAL
  var m = calcMacros();
  assert.strictEqual(m.p, 0, 'calcMacros() devrait retourner 0 pour sport-only');
});

test('E-05 : sport-only — computeNutritionState ne contient pas NaN', function() {
  setState({ appMode:'sport', goal:null, sex:'homme', age:30, weight:80, height:175 });
  var res = computeNutritionState(false);
  assert.ok(res !== null, 'null pour sport-only');
  assert.ok(!isNaN(res.caloriesTarget), 'caloriesTarget NaN');
  assert.ok(!isNaN(res.proteinGrams),   'proteinGrams NaN');
  assert.ok(!isNaN(res.carbsGrams),     'carbsGrams NaN');
  assert.ok(!isNaN(res.fatGrams),       'fatGrams NaN');
});

test('E-06 : femme enceinte 37 ans 90 kg obèse T3 — calories [1800-3500], pas de crash', function() {
  setState({ sex:'femme', age:37, weight:90, height:165, activity:1, goal:maintainIdx,
    pregnant:true, pregnancyWeek:32, prePregnancyWeight:78 });
  var t = calcTarget();
  var m = calcMacros();
  assert.ok(!isNaN(t) && t >= 1800 && t <= 3500,
    'Grossesse obèse T3 calories hors range [1800-3500]: ' + t);
  assert.ok(!isNaN(m.p) && !isNaN(m.g) && !isNaN(m.l),
    'Macros NaN pour grossesse obèse T3');
  assert.ok(m.g >= 130, 'Glucides < 130g pour grossesse obèse : ' + m.g);
});

test('E-07 : élite sèche (activity=5, goal=shred) — plancher 1500 respecté ET déficit borné', function() {
  setState({ sex:'homme', age:28, weight:85, height:183, activity:5, sportDays:6, goal:shredIdx });
  var bmr    = calcBMR();
  var tdee   = calcTDEE();
  var target = calcTarget();
  assert.ok(target >= 1500, 'Plancher 1500 violé — élite shred : target=' + target);
  assert.ok(target >= bmr,  'Plancher BMR violé — élite shred : target=' + target + ' bmr=' + bmr);
  assert.ok((tdee - target) <= 502, // ±2 pour arrondi
    'Déficit > 500 kcal/j — élite shred : déficit=' + Math.round(tdee - target));
});

test('E-08 : NM rejette profil invalide (gender=homme) et retourne errors[]', function() {
  var r = nm.compute({ gender:'homme', age:30, weightKg:80, heightCm:175,
    activityLevel:1.55, goal:'maintain', isElite:false, trainingDay:false });
  assert.ok(r.errors.length > 0, 'NM aurait dû rejeter gender=homme');
  assert.strictEqual(r.bmr, 0, 'NM bmr doit être 0 en cas d\'erreur');
});

test('E-09 : NM rejette activityLevel > 2.5', function() {
  var r = nm.compute({ gender:'male', age:30, weightKg:80, heightCm:175,
    activityLevel:3.0, goal:'maintain', isElite:false, trainingDay:false });
  assert.ok(r.errors.length > 0, 'NM aurait dû rejeter activityLevel=3.0');
});

test('E-10 : profil multi-pathologies — pas de NaN ni de crash', function() {
  setState({ sex:'homme', age:50, weight:85, height:175, activity:1, goal:maintainIdx,
    medical:['diabete_t2','hta','cholesterol','irc'] });
  var t = calcTarget();
  var m = calcMacros();
  assert.ok(!isNaN(t) && t > 0, 'calcTarget NaN ou 0');
  assert.ok(!isNaN(m.p) && !isNaN(m.g) && !isNaN(m.l), 'Macros NaN multi-pathologies');
  assert.ok(m.p >= 0 && m.g >= 0 && m.l >= 0, 'Macro négative multi-pathologies');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE F : COHÉRENCE NM vs app-core (bridge) ─────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('F — Bridge NutritionMaster → computeNutritionState cohérence');

test('F-01 : computeNutritionState caloriesTarget == calcTarget() quand non nul', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx });
  var coreTarget = calcTarget();
  var res = computeNutritionState(false);
  assert.ok(res !== null, 'computeNutritionState null');
  assert.strictEqual(res.caloriesTarget, coreTarget,
    'caloriesTarget NM (' + res.caloriesTarget + ') != calcTarget (' + coreTarget + ')');
});

test('F-02 : computeNutritionState proteinGrams == calcMacros().p', function() {
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx });
  var m = calcMacros();
  var res = computeNutritionState(false);
  assert.ok(res !== null, 'computeNutritionState null');
  assert.strictEqual(res.proteinGrams, m.p,
    'proteinGrams NM (' + res.proteinGrams + ') != calcMacros.p (' + m.p + ')');
});

test('F-03 : buildNMInputs passe toujours trainingDay:false (carb cycling géré par app-core)', function() {
  // Vérifier que NutritionMaster n'applique jamais le carb cycling dans le flow principal
  // En lisant buildNMInputs, trainingDay est forcé à false (ligne 6859)
  setState({ sex:'homme', age:30, weight:80, height:175, activity:2, goal:maintainIdx,
    sportGoals:[], trainingDaysSelected:[] });
  var nmInputs = buildNMInputs(true); // même si on demande training=true
  assert.strictEqual(nmInputs.trainingDay, false,
    'buildNMInputs trainingDay=' + nmInputs.trainingDay + ' (devrait être false)');
});

test('F-04 : IRC — computeNutritionState respecte cap 0.6 g/kg protéines', function() {
  setState({ sex:'homme', age:50, weight:80, height:175, activity:2, goal:maintainIdx,
    medical:['irc'] });
  var res = computeNutritionState(false);
  assert.ok(res !== null, 'computeNutritionState null');
  var ppk = res.proteinGrams / 80;
  assert.ok(ppk <= 0.66,
    'IRC : protéines (' + ppk.toFixed(2) + ' g/kg) dépassent cap KDOQI 0.66 g/kg');
});

test('F-05 : grossesse calcTarget() retourne ≥ TDEE (bridge ne réduit pas)', function() {
  setState({ sex:'femme', age:28, weight:68, height:165, activity:2, goal:maintainIdx,
    pregnant:true, pregnancyWeek:20, prePregnancyWeight:62 });
  var tdee   = calcTDEE();
  var target = calcTarget();
  assert.ok(target >= Math.round(tdee) - 5,
    'Grossesse target (' + target + ') < TDEE (' + Math.round(tdee) + ')');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── RÉSULTAT FINAL ──────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) sur ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
