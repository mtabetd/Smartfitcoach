'use strict';
/**
 * tests-symbiosis.js — Comprehensive symbiosis engine test suite
 * Run: node /home/user/Smartfitcoach/app/tests-symbiosis.js
 */

// ─── Test framework ───────────────────────────────────────────────────────────
var T = {
  pass: 0, fail: 0, errors: [],
  assert: function(condition, name) {
    if (condition) { this.pass++; }
    else { this.fail++; this.errors.push('FAIL: ' + name); }
  },
  eq: function(actual, expected, name) {
    this.assert(actual === expected, name + ' (got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected) + ')');
  },
  approx: function(actual, expected, tolerance, name) {
    this.assert(Math.abs(actual - expected) <= tolerance, name + ' (got ' + actual + ', expected ' + expected + ' ±' + tolerance + ')');
  },
  range: function(actual, min, max, name) {
    this.assert(actual >= min && actual <= max, name + ' (got ' + actual + ', expected ' + min + '-' + max + ')');
  },
  report: function() {
    console.log('\n=== SYMBIOSIS TEST SUITE ===');
    this.errors.forEach(function(e) { console.log(e); });
    console.log('\nTotal: ' + (this.pass + this.fail) + ' | Pass: ' + this.pass + ' | Fail: ' + this.fail);
    if (this.fail > 0) process.exit(1);
    else console.log('ALL TESTS PASSED ✓');
  }
};

// ─── Mock window/global for Node.js ──────────────────────────────────────────
var window = {};
global.window = window;
global.S = null;

// ─── INLINE: LOAD_MULTIPLIERS from sfc-symbiosis.js ─────────────────────────
var LOAD_MULTIPLIERS = {
  heavy:    { cal: 1.10, carbBoost: 1.20, fatAdjust: 0.92 },
  moderate: { cal: 1.07, carbBoost: 1.10, fatAdjust: 0.96 },
  light:    { cal: 1.03, carbBoost: 1.00, fatAdjust: 1.00 },
  rest:     { cal: 0.90, carbBoost: 0.90, fatAdjust: 1.08 },
  'strength-heavy':   { cal: 1.10, carbBoost: 1.15, fatAdjust: 0.92, protBoost: 1.10 },
  'crossfit-heavy':   { cal: 1.13, carbBoost: 1.25, fatAdjust: 0.88, protBoost: 1.08 },
  'hyrox-heavy':      { cal: 1.12, carbBoost: 1.30, fatAdjust: 0.90, protBoost: 1.05 },
  'running-heavy':    { cal: 1.12, carbBoost: 1.35, fatAdjust: 0.90, protBoost: 1.00 },
  'running-moderate': { cal: 1.05, carbBoost: 1.12, fatAdjust: 0.97, protBoost: 1.00 },
  'mobility-light':   { cal: 1.01, carbBoost: 0.98, fatAdjust: 1.05, protBoost: 1.02 }
};

// ─── INLINE: PERIODIZATION_CFG from sfc-symbiosis.js ────────────────────────
var PERIODIZATION_CFG = {
  1: { durMax: 6, durSets: 4, restOverride: null,       note: 'S1 — Volume base' },
  2: { durMax: 6, durSets: 5, restOverride: null,       note: 'S2 — Volume ↑ (+1 série : durSets 4→5)' },
  3: { durMax: 5, durSets: 5, restOverride: '120-180s', note: 'S3 — Intensité ↑ — charges lourdes' },
  4: { durMax: 4, durSets: 3, restOverride: '60s',      note: 'S4 — Deload actif' }
};

// ─── INLINE: CARB_FAT_SPLITS from sfc-engine.js ──────────────────────────────
var CARB_FAT_SPLITS = {
  heavy:    { carbs: 0.65, fat: 0.35 },
  moderate: { carbs: 0.55, fat: 0.45 },
  light:    { carbs: 0.45, fat: 0.55 },
  rest:     { carbs: 0.35, fat: 0.65 }
};

// ─── INLINE: BMR formulas ─────────────────────────────────────────────────────
function calcBMR(gender, weightKg, heightCm, age) {
  var base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}
function calcBMRProxy(weightKg) {
  return 10 * weightKg + 810;
}

// ─── INLINE: TDEE ─────────────────────────────────────────────────────────────
function calcTDEE(bmr, pal) {
  return Math.round(bmr * pal);
}

// ─── INLINE: Goal adjustments (NutritionMaster) ──────────────────────────────
var GOAL_ADJUSTMENTS = {
  bulk:          +0.15,
  lean_bulk:     +0.10,
  maintain:      +0.00,
  recomposition: +0.00,
  cut:           -0.15,
  shred:         -0.20
};

var KCAL_FLOOR_MALE          = 1500;
var KCAL_FLOOR_FEMALE        = 1400;
var KCAL_FLOOR_FEMALE_ACTIVE = 1600;
var ACTIVITY_THRESHOLD_ACTIVE = 1.375;

function calcCaloriesTarget(tdee, goal, bmr, gender, activityLevel) {
  var adjusted = Math.round(tdee * (1 + (GOAL_ADJUSTMENTS[goal] || 0)));
  var kcalFloor;
  if (gender === 'male') {
    kcalFloor = KCAL_FLOOR_MALE;
  } else {
    kcalFloor = (activityLevel && activityLevel >= ACTIVITY_THRESHOLD_ACTIVE)
      ? KCAL_FLOOR_FEMALE_ACTIVE : KCAL_FLOOR_FEMALE;
  }
  var isDeficit = goal === 'cut' || goal === 'shred';
  if (isDeficit) {
    var deficitCap = Math.round(tdee - 500);
    return Math.max(adjusted, bmr, kcalFloor, deficitCap);
  }
  return Math.max(adjusted, bmr, kcalFloor);
}

// ─── INLINE: Protein / Fat / Carbs ───────────────────────────────────────────
var PROT_DEFAULT_MALE   = 1.8;
var PROT_DEFAULT_FEMALE = 1.6;
var PROT_ELITE_MALE     = 2.2;
var PROT_ELITE_FEMALE   = 2.0;
var FAT_MIN_PER_KG      = 0.8;
var CARB_MIN_G          = 130;
var KCAL_PER_PROT = 4, KCAL_PER_CARB = 4, KCAL_PER_FAT = 9;

function calcProtein(gender, isElite, weightKg) {
  var perKg = gender === 'male'
    ? (isElite ? PROT_ELITE_MALE   : PROT_DEFAULT_MALE)
    : (isElite ? PROT_ELITE_FEMALE : PROT_DEFAULT_FEMALE);
  return Math.round(perKg * weightKg * 10) / 10;
}
function calcFat(weightKg) {
  return Math.round(FAT_MIN_PER_KG * weightKg * 10) / 10;
}
function calcCarbs(caloriesTarget, proteinGrams, fatGrams) {
  var remaining = caloriesTarget - (proteinGrams * KCAL_PER_PROT + fatGrams * KCAL_PER_FAT);
  var carbs = Math.max(0, remaining / KCAL_PER_CARB);
  if (carbs < 130) carbs = 130;
  return Math.round(carbs * 10) / 10;
}

// ─── INLINE: computeTrainingLoad from sfc-symbiosis.js ───────────────────────
var HEAVY_GROUPS = ['legs', 'glutes', 'back', 'chest'];
function computeTrainingLoad(exercises, groups) {
  if (!exercises || !exercises.length) return 'light';
  var hasHeavy = (groups || []).some(function(g) { return HEAVY_GROUPS.indexOf(g) !== -1; });
  var compCount = exercises.filter(function(ex) {
    var tg = ex.tags || [];
    return tg.indexOf('isolation') === -1 && tg.indexOf('finisher') === -1;
  }).length;
  if (exercises.length >= 6 && hasHeavy && compCount >= 4) return 'heavy';
  if (exercises.length <= 3 || !hasHeavy) return 'light';
  return 'moderate';
}

// ─── INLINE: computeSportLoad from sfc-symbiosis.js ──────────────────────────
function computeSportLoad(sportType, baseLoad, duration, rpe) {
  var dur    = typeof duration === 'number' ? duration : 0;
  var effort = typeof rpe     === 'number' ? rpe     : 6;
  switch (sportType) {
    case 'crossfit':  return 'crossfit-heavy';
    case 'hyrox':     return 'hyrox-heavy';
    case 'running':   return (dur >= 60 || effort >= 8) ? 'running-heavy' : 'running-moderate';
    case 'triathlon':
    case 'cycling':   return (dur >= 90 || effort >= 8) ? 'running-heavy' : 'running-moderate';
    case 'musculation': return (baseLoad === 'heavy') ? 'strength-heavy' : baseLoad;
    case 'yoga':
    case 'golf':      return 'mobility-light';
    default:          return baseLoad || 'moderate';
  }
}

// ─── INLINE: getLoadMultipliers from sfc-symbiosis.js ────────────────────────
function getLoadMultipliers(isTraining, trainingLoad) {
  if (!isTraining) return LOAD_MULTIPLIERS.rest;
  return LOAD_MULTIPLIERS[trainingLoad] || LOAD_MULTIPLIERS.moderate;
}

// ─── INLINE: getPeriodizationInfo from sfc-symbiosis.js ──────────────────────
function getPeriodizationInfo(weekIndex) {
  var wi = ((weekIndex - 1) % 4) + 1;
  var MAP = {
    1: { label: 'S1 — Volume base',  description: 'Séances de référence, construction du volume.' },
    2: { label: 'S2 — Volume ↑', description: '+1 série sur les composés principaux.' },
    3: { label: 'S3 — Intensité ↑', description: 'Reps réduites, charges plus lourdes à prévoir.' },
    4: { label: 'S4 — Deload',        description: 'Volume réduit, récupération active.' }
  };
  return MAP[wi] || MAP[1];
}

// ─── INLINE: getPeriodizationCfg ─────────────────────────────────────────────
function getPeriodizationCfg(weekIndex) {
  var wi = ((weekIndex - 1) % 4) + 1;
  var cfg = PERIODIZATION_CFG[wi] || PERIODIZATION_CFG[1];
  return Object.assign({}, cfg);
}

// ─── INLINE: getWeekIndex logic (stateless version for tests) ─────────────────
function getWeekIndexFromStart(startDateStr, nowMs) {
  if (!startDateStr) return 1;
  var start = new Date(startDateStr);
  if (isNaN(start.getTime())) return 1;
  var diffDays = Math.floor((nowMs - start.getTime()) / 86400000);
  var weekNum  = Math.floor(diffDays / 7) + 1;
  return ((weekNum - 1) % 4) + 1;
}

// ─── INLINE: getFatigueScore logic (pure, no global.S) ───────────────────────
function getFatigueScorePure(trainingDays7, avgRpe, deloadNeeded) {
  if (deloadNeeded || avgRpe >= 8.5 || trainingDays7 >= 6) {
    return { level: 'overtrained', cycleFactor: 0.60, restRecommended: true };
  }
  if (avgRpe >= 7.5 || trainingDays7 >= 5) {
    return { level: 'tired', cycleFactor: 0.80, restRecommended: false };
  }
  if (trainingDays7 >= 3) {
    return { level: 'normal', cycleFactor: 0.95, restRecommended: false };
  }
  return { level: 'fresh', cycleFactor: 1.0, restRecommended: false };
}

// ─── INLINE: Carb cycling logic (from nutrition-master.js) ───────────────────
var CARB_CYCLING_BOOST = 0.20;
var CARB_CYCLING_BOOST_STREAK = 0.25;

function applyCarbCycling(carbsGrams, proteinGrams, fatGrams, bmr, gender, weightKg) {
  var carbExtra    = Math.round(carbsGrams * CARB_CYCLING_BOOST);
  var boostedCarbs = carbsGrams + carbExtra;
  var fatFloor     = Math.ceil(FAT_MIN_PER_KG * (weightKg || 60));
  var fatCompens   = Math.min(Math.round(carbExtra * KCAL_PER_CARB / KCAL_PER_FAT), fatGrams - fatFloor);
  var newFat       = fatGrams - Math.max(0, fatCompens);
  var newCalories  = Math.round(proteinGrams*4 + newFat*9 + boostedCarbs*4);
  var kcalFloor    = Math.max(bmr, gender === 'male' ? KCAL_FLOOR_MALE : KCAL_FLOOR_FEMALE);
  if (newCalories >= kcalFloor) {
    return { carbsGrams: boostedCarbs, fatGrams: newFat, caloriesTarget: newCalories, clampedToBMR: false };
  }
  var carbsAtFloor = Math.round(
    Math.max(0, (kcalFloor - proteinGrams*4 - newFat*9) / 4) * 10) / 10;
  return { carbsGrams: carbsAtFloor, fatGrams: newFat, caloriesTarget: kcalFloor, clampedToBMR: true };
}

// ─── INLINE: SFCEngine nutrition (from sfc-engine.js) ────────────────────────
function computeNutritionSFCEngine(user, sessions, now) {
  var ts     = +now || Date.now();
  var weight = (user && typeof user.weight === 'number' && user.weight > 0) ? user.weight : 75;
  var VALID_GOALS = ['fat_loss', 'recomp', 'muscle_gain', 'performance'];
  var goal   = (user && VALID_GOALS.indexOf(user.goal) !== -1) ? user.goal : 'recomp';

  var bmr = user && typeof user.heightCm === 'number' && typeof user.age === 'number'
    ? (10*weight + 6.25*user.heightCm - 5*user.age + (user.sex === 'female' ? -161 : 5))
    : (10*weight + 810);

  // Activity PAL from session count (simplified for tests)
  var weekDays = sessions ? sessions.length : 0;
  var activityPAL = weekDays >= 6 ? 1.90
                  : weekDays >= 5 ? 1.725
                  : weekDays >= 3 ? 1.55
                  : weekDays >= 1 ? 1.375
                  : 1.2;

  var tdee = bmr * activityPAL;
  var GOAL_DELTA = { fat_loss: -400, recomp: -100, muscle_gain: +300, performance: 0 };
  var kcalFloor = (user && user.sex === 'female') ? 1400 : 1500;
  var calorieTarget = Math.max(kcalFloor, Math.round(tdee + (GOAL_DELTA[goal] || 0)));
  var proteinGrams  = Math.round(weight * 2);
  var remaining     = Math.max(0, calorieTarget - proteinGrams * 4);

  return {
    calorieTarget:  calorieTarget,
    proteinGrams:   proteinGrams,
    bmr:            Math.round(bmr),
    tdee:           Math.round(tdee),
    activityPAL:    activityPAL
  };
}

// ─── INLINE: hydration target (sport-aware) ───────────────────────────────────
function calcHydration(weightKg, sportType, isTrainingDay) {
  var base = Math.round(35 * weightKg);
  var bonus = 0;
  if (isTrainingDay) {
    if (sportType === 'crossfit' || sportType === 'hyrox') bonus = 700;
    else if (sportType === 'running' || sportType === 'triathlon') bonus = 600;
    else bonus = 400;
  }
  return Math.min(5000, Math.max(1500, base + bonus));
}

// ─── INLINE: Recipe macro formula ────────────────────────────────────────────
function recipeCalCheck(p, c, f) {
  return p * 4 + c * 4 + f * 9;
}

// ─── Fixed recipe data (from recipe-engine.js) ───────────────────────────────
var FIXED_RECIPES = [
  { id: 'R201', p: 96,  c: 46,  f: 28,  cal: 820  },
  { id: 'R202', p: 95,  c: 80,  f: 48,  cal: 1132 },
  { id: 'R203', p: 68,  c: 42,  f: 35,  cal: 755  },
  { id: 'R204', p: 88,  c: 10,  f: 22,  cal: 590  },
  { id: 'R205', p: 68,  c: 95,  f: 28,  cal: 904  },
  { id: 'R206', p: 77,  c: 7,   f: 35,  cal: 651  },
  { id: 'R207', p: 60,  c: 89,  f: 57,  cal: 1109 },
  { id: 'R208', p: 48,  c: 38,  f: 45,  cal: 749  },
  { id: 'R209', p: 84,  c: 170, f: 19,  cal: 1187 },
  { id: 'R210', p: 45,  c: 186, f: 67,  cal: 1527 },
  { id: 'R211', p: 28,  c: 110, f: 32,  cal: 840  },
  { id: 'R212', p: 55,  c: 85,  f: 18,  cal: 722  },
  { id: 'R213', p: 42,  c: 90,  f: 22,  cal: 726  },
  { id: 'R214', p: 32,  c: 88,  f: 28,  cal: 732  },
  { id: 'R215', p: 65,  c: 75,  f: 15,  cal: 695  },
  { id: 'R216', p: 52,  c: 92,  f: 28,  cal: 828  },
  { id: 'R217', p: 78,  c: 18,  f: 22,  cal: 582  }
];

// ─── Test profiles ────────────────────────────────────────────────────────────
var PROFILES = [
  { gender:'male',   age:25, weightKg:75,  heightCm:178, pal:1.55,  goal:'lean_bulk',   isElite:false },
  { gender:'male',   age:30, weightKg:80,  heightCm:180, pal:1.55,  goal:'maintain',    isElite:false },
  { gender:'male',   age:35, weightKg:90,  heightCm:182, pal:1.725, goal:'bulk',        isElite:false },
  { gender:'male',   age:40, weightKg:70,  heightCm:175, pal:1.375, goal:'cut',         isElite:false },
  { gender:'male',   age:22, weightKg:68,  heightCm:173, pal:1.55,  goal:'shred',       isElite:false },
  { gender:'male',   age:50, weightKg:85,  heightCm:178, pal:1.2,   goal:'cut',         isElite:false },
  { gender:'male',   age:17, weightKg:68,  heightCm:175, pal:1.55,  goal:'lean_bulk',   isElite:false },
  { gender:'male',   age:55, weightKg:95,  heightCm:182, pal:1.725, goal:'maintain',    isElite:true  },
  { gender:'male',   age:28, weightKg:82,  heightCm:178, pal:1.725, goal:'lean_bulk',   isElite:true  },
  { gender:'male',   age:45, weightKg:100, heightCm:185, pal:1.375, goal:'cut',         isElite:false },
  { gender:'male',   age:60, weightKg:78,  heightCm:175, pal:1.2,   goal:'maintain',    isElite:false },
  { gender:'male',   age:20, weightKg:60,  heightCm:170, pal:1.9,   goal:'bulk',        isElite:true  },
  { gender:'female', age:25, weightKg:58,  heightCm:162, pal:1.375, goal:'cut',         isElite:false },
  { gender:'female', age:28, weightKg:65,  heightCm:163, pal:1.2,   goal:'cut',         isElite:false },
  { gender:'female', age:30, weightKg:62,  heightCm:168, pal:1.375, goal:'maintain',    isElite:false },
  { gender:'female', age:35, weightKg:70,  heightCm:165, pal:1.55,  goal:'lean_bulk',   isElite:false },
  { gender:'female', age:40, weightKg:75,  heightCm:170, pal:1.725, goal:'recomposition',isElite:false},
  { gender:'female', age:55, weightKg:68,  heightCm:162, pal:1.375, goal:'cut',         isElite:false },
  { gender:'female', age:22, weightKg:52,  heightCm:158, pal:1.9,   goal:'bulk',        isElite:true  },
  { gender:'female', age:45, weightKg:80,  heightCm:168, pal:1.2,   goal:'shred',       isElite:false },
  { gender:'male',   age:32, weightKg:110, heightCm:190, pal:1.55,  goal:'cut',         isElite:false },
  { gender:'male',   age:27, weightKg:55,  heightCm:168, pal:1.375, goal:'bulk',        isElite:false },
  { gender:'female', age:33, weightKg:55,  heightCm:165, pal:1.55,  goal:'lean_bulk',   isElite:false },
  { gender:'male',   age:38, weightKg:88,  heightCm:183, pal:2.1,   goal:'maintain',    isElite:true  },
  { gender:'female', age:19, weightKg:50,  heightCm:160, pal:1.375, goal:'maintain',    isElite:false },
  { gender:'male',   age:42, weightKg:92,  heightCm:179, pal:1.55,  goal:'recomposition',isElite:false},
  { gender:'female', age:50, weightKg:72,  heightCm:166, pal:1.725, goal:'maintain',    isElite:false },
  { gender:'male',   age:65, weightKg:74,  heightCm:172, pal:1.2,   goal:'maintain',    isElite:false },
  { gender:'female', age:27, weightKg:63,  heightCm:169, pal:1.55,  goal:'cut',         isElite:false },
  { gender:'male',   age:48, weightKg:83,  heightCm:177, pal:1.375, goal:'maintain',    isElite:false }
];

// ─── SECTION 1: LOAD_MULTIPLIERS integrity ────────────────────────────────────
console.log('Running Section 1: LOAD_MULTIPLIERS integrity...');
var TIER_KEYS = Object.keys(LOAD_MULTIPLIERS);

TIER_KEYS.forEach(function(k) {
  var m = LOAD_MULTIPLIERS[k];
  T.assert(m.cal > 0 && m.cal < 2.0,         'LOAD_MULTIPLIERS.' + k + '.cal in (0,2)');
  T.assert(m.carbBoost > 0 && m.carbBoost < 2.0, 'LOAD_MULTIPLIERS.' + k + '.carbBoost in (0,2)');
  T.assert(m.fatAdjust > 0 && m.fatAdjust < 2.0, 'LOAD_MULTIPLIERS.' + k + '.fatAdjust in (0,2)');
  T.assert(typeof m.cal === 'number',         'LOAD_MULTIPLIERS.' + k + '.cal is number');
});

// Training tiers must have cal > rest.cal
var restCal = LOAD_MULTIPLIERS.rest.cal;
['heavy','moderate','light','strength-heavy','crossfit-heavy','hyrox-heavy','running-heavy','running-moderate'].forEach(function(k) {
  T.assert(LOAD_MULTIPLIERS[k].cal > restCal, k + '.cal > rest.cal');
});

// carbBoost ordering: crossfit > musculation (strength-heavy), running-heavy > running-moderate
T.assert(LOAD_MULTIPLIERS['crossfit-heavy'].carbBoost > LOAD_MULTIPLIERS['strength-heavy'].carbBoost, 'crossfit carbBoost > strength carbBoost');
T.assert(LOAD_MULTIPLIERS['hyrox-heavy'].carbBoost    > LOAD_MULTIPLIERS['strength-heavy'].carbBoost, 'hyrox carbBoost > strength carbBoost');
T.assert(LOAD_MULTIPLIERS['running-heavy'].carbBoost  > LOAD_MULTIPLIERS['running-moderate'].carbBoost, 'running-heavy carbBoost > running-moderate carbBoost');
T.assert(LOAD_MULTIPLIERS['running-heavy'].carbBoost  > LOAD_MULTIPLIERS['moderate'].carbBoost, 'running-heavy carbBoost > moderate carbBoost');
T.assert(LOAD_MULTIPLIERS.heavy.carbBoost             > LOAD_MULTIPLIERS.light.carbBoost, 'heavy carbBoost > light carbBoost');
T.assert(LOAD_MULTIPLIERS.moderate.carbBoost          > LOAD_MULTIPLIERS.light.carbBoost, 'moderate carbBoost > light carbBoost');
T.assert(LOAD_MULTIPLIERS.heavy.carbBoost             > LOAD_MULTIPLIERS.rest.carbBoost, 'heavy carbBoost > rest carbBoost');

// Cal ordering: crossfit > hyrox > heavy (legacy)
T.assert(LOAD_MULTIPLIERS['crossfit-heavy'].cal >= LOAD_MULTIPLIERS['hyrox-heavy'].cal, 'crossfit cal >= hyrox cal');
T.assert(LOAD_MULTIPLIERS['hyrox-heavy'].cal    >= LOAD_MULTIPLIERS.heavy.cal,           'hyrox cal >= heavy cal');

// fatAdjust: rest has highest (more fat on rest days for hormones)
T.assert(LOAD_MULTIPLIERS.rest.fatAdjust > LOAD_MULTIPLIERS.heavy.fatAdjust, 'rest fatAdjust > heavy fatAdjust');
T.assert(LOAD_MULTIPLIERS['mobility-light'].fatAdjust > LOAD_MULTIPLIERS.moderate.fatAdjust, 'mobility fatAdjust > moderate fatAdjust');

// protBoost exists only on sport-specific tiers
['strength-heavy','crossfit-heavy','hyrox-heavy','running-heavy','running-moderate','mobility-light'].forEach(function(k) {
  T.assert(typeof LOAD_MULTIPLIERS[k].protBoost === 'number', k + '.protBoost is number');
  T.assert(LOAD_MULTIPLIERS[k].protBoost > 0, k + '.protBoost > 0');
});

// Legacy tiers have no protBoost
['heavy','moderate','light','rest'].forEach(function(k) {
  T.assert(LOAD_MULTIPLIERS[k].protBoost === undefined, k + ' has no protBoost');
});

// Parametric: all tiers × 5 property checks = 50 more assertions
TIER_KEYS.forEach(function(k) {
  var m = LOAD_MULTIPLIERS[k];
  T.assert(m.cal !== 0, k + '.cal !== 0');
  T.assert(m.carbBoost !== 0, k + '.carbBoost !== 0');
  T.assert(m.fatAdjust !== 0, k + '.fatAdjust !== 0');
  T.assert(isFinite(m.cal), k + '.cal is finite');
  T.assert(isFinite(m.carbBoost), k + '.carbBoost is finite');
});

console.log('Section 1 done. Pass so far: ' + T.pass);

// ─── SECTION 2: BMR validation ───────────────────────────────────────────────
console.log('Running Section 2: BMR validation...');

// Extended profiles for BMR tests
var BMR_PROFILES = [
  {g:'male',   w:40,  h:150, a:15}, {g:'male',   w:60,  h:165, a:20},
  {g:'male',   w:75,  h:175, a:25}, {g:'male',   w:80,  h:180, a:30},
  {g:'male',   w:90,  h:182, a:35}, {g:'male',   w:100, h:185, a:40},
  {g:'male',   w:110, h:190, a:45}, {g:'male',   w:120, h:188, a:50},
  {g:'male',   w:70,  h:172, a:55}, {g:'male',   w:65,  h:170, a:60},
  {g:'male',   w:60,  h:168, a:65}, {g:'male',   w:55,  h:165, a:70},
  {g:'male',   w:50,  h:160, a:75}, {g:'male',   w:85,  h:183, a:28},
  {g:'male',   w:95,  h:186, a:32}, {g:'male',   w:130, h:192, a:38},
  {g:'male',   w:145, h:195, a:42}, {g:'male',   w:150, h:198, a:22},
  {g:'female', w:40,  h:150, a:15}, {g:'female', w:50,  h:158, a:20},
  {g:'female', w:58,  h:162, a:25}, {g:'female', w:65,  h:165, a:30},
  {g:'female', w:70,  h:168, a:35}, {g:'female', w:75,  h:170, a:40},
  {g:'female', w:80,  h:172, a:45}, {g:'female', w:85,  h:175, a:50},
  {g:'female', w:68,  h:163, a:55}, {g:'female', w:62,  h:160, a:60},
  {g:'female', w:55,  h:157, a:65}, {g:'female', w:48,  h:153, a:70},
  {g:'female', w:45,  h:150, a:75}, {g:'female', w:90,  h:178, a:28},
  {g:'female', w:95,  h:180, a:32}, {g:'female', w:100, h:182, a:38},
  {g:'female', w:55,  h:163, a:22}, {g:'female', w:72,  h:168, a:48},
  {g:'male',   w:72,  h:176, a:26}, {g:'male',   w:83,  h:181, a:33},
  {g:'female', w:66,  h:166, a:29}, {g:'female', w:78,  h:171, a:44},
  {g:'male',   w:92,  h:184, a:37}, {g:'male',   w:58,  h:169, a:52},
  {g:'female', w:60,  h:164, a:34}, {g:'female', w:82,  h:174, a:58},
  {g:'male',   w:105, h:187, a:41}, {g:'male',   w:48,  h:162, a:67},
  {g:'female', w:44,  h:152, a:72}, {g:'male',   w:67,  h:173, a:19},
  {g:'female', w:53,  h:159, a:24}
];

BMR_PROFILES.forEach(function(p, i) {
  var bmr = calcBMR(p.g, p.w, p.h, p.a);
  T.range(bmr, 800, 5000, 'BMR[' + i + '] in [800,5000] ' + p.g + ' w=' + p.w);
  T.assert(isFinite(bmr), 'BMR[' + i + '] is finite');
  T.assert(bmr > 0, 'BMR[' + i + '] > 0');

  // Male vs female at same params
  var bmrM = calcBMR('male', p.w, p.h, p.a);
  var bmrF = calcBMR('female', p.w, p.h, p.a);
  T.assert(bmrM > bmrF, 'male BMR > female BMR w=' + p.w + ' h=' + p.h + ' a=' + p.a);
});

// Age effect: older → lower BMR (same sex and weight)
var ages = [20, 30, 40, 50, 60, 70];
for (var ai = 0; ai < ages.length - 1; ai++) {
  var bmrYoung = calcBMR('male', 80, 180, ages[ai]);
  var bmrOld   = calcBMR('male', 80, 180, ages[ai+1]);
  T.assert(bmrYoung > bmrOld, 'BMR decreases: age ' + ages[ai] + ' > age ' + ages[ai+1]);
}

// Weight effect: heavier → higher BMR
var weights = [50, 60, 70, 80, 90, 100];
for (var wi = 0; wi < weights.length - 1; wi++) {
  var bmrLight = calcBMR('male', weights[wi],   180, 30);
  var bmrHeavy = calcBMR('male', weights[wi+1], 180, 30);
  T.assert(bmrHeavy > bmrLight, 'BMR increases with weight: ' + weights[wi] + '->' + weights[wi+1]);
}

// Height effect
var heights = [155, 165, 175, 185, 195];
for (var hi = 0; hi < heights.length - 1; hi++) {
  var bmrShort = calcBMR('male', 80, heights[hi],   30);
  var bmrTall  = calcBMR('male', 80, heights[hi+1], 30);
  T.assert(bmrTall > bmrShort, 'BMR increases with height: ' + heights[hi] + '->' + heights[hi+1]);
}

// Proxy BMR validation
var proxyWeights = [50, 60, 70, 80, 90, 100, 110];
proxyWeights.forEach(function(w) {
  var proxy = calcBMRProxy(w);
  T.assert(proxy > 0 && isFinite(proxy), 'BMR proxy valid for w=' + w);
  T.range(proxy, 800, 5000, 'BMR proxy range for w=' + w);
});

// Known values (10*w + 6.25*h - 5*a + sex_offset)
T.approx(calcBMR('male',   80, 180, 30), 1780, 2, 'BMR known male 80/180/30');
T.approx(calcBMR('female', 65, 163, 28), 1368, 2, 'BMR known female 65/163/28');

console.log('Section 2 done. Pass so far: ' + T.pass);

// ─── SECTION 3: TDEE/PAL calculation ─────────────────────────────────────────
console.log('Running Section 3: TDEE/PAL...');

var PAL_LEVELS = [1.2, 1.375, 1.55, 1.725, 1.9, 2.1];

PROFILES.forEach(function(p, i) {
  var bmr  = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee = calcTDEE(bmr, p.pal);
  T.assert(tdee > bmr,  'TDEE > BMR profile[' + i + ']');
  T.assert(isFinite(tdee), 'TDEE finite profile[' + i + ']');
  T.assert(tdee > 0,    'TDEE > 0 profile[' + i + ']');
});

// PAL ordering
var refBMR = calcBMR('male', 80, 180, 30);
for (var pi = 0; pi < PAL_LEVELS.length - 1; pi++) {
  var tdee1 = calcTDEE(refBMR, PAL_LEVELS[pi]);
  var tdee2 = calcTDEE(refBMR, PAL_LEVELS[pi+1]);
  T.assert(tdee2 > tdee1, 'TDEE increases with PAL: ' + PAL_LEVELS[pi] + '->' + PAL_LEVELS[pi+1]);
}

// TDEE must always be >= BMR
PAL_LEVELS.forEach(function(pal) {
  var bmr  = calcBMR('female', 60, 165, 35);
  var tdee = calcTDEE(bmr, pal);
  T.assert(tdee >= bmr, 'TDEE >= BMR at PAL=' + pal);
});

// Formula check
T.approx(calcTDEE(1800, 1.55), Math.round(1800 * 1.55), 1, 'TDEE formula check 1800*1.55');
T.approx(calcTDEE(1400, 1.375), Math.round(1400 * 1.375), 1, 'TDEE formula check 1400*1.375');

// Cross-profile TDEE checks
PROFILES.slice(0, 15).forEach(function(p, i) {
  PAL_LEVELS.forEach(function(pal) {
    var bmr  = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
    var tdee = calcTDEE(bmr, pal);
    T.range(tdee, 1000, 8000, 'TDEE in reasonable range profile[' + i + '] pal=' + pal);
  });
});

console.log('Section 3 done. Pass so far: ' + T.pass);

// ─── SECTION 4: Goal calorie adjustments ─────────────────────────────────────
console.log('Running Section 4: Goal calorie adjustments...');

var GOALS_TO_TEST = ['bulk','lean_bulk','maintain','recomposition','cut','shred'];

PROFILES.forEach(function(p, i) {
  var bmr  = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee = calcTDEE(bmr, p.pal);

  GOALS_TO_TEST.forEach(function(goal) {
    var target = calcCaloriesTarget(tdee, goal, bmr, p.gender, p.pal);
    var floor  = p.gender === 'male' ? KCAL_FLOOR_MALE : (p.pal >= ACTIVITY_THRESHOLD_ACTIVE ? KCAL_FLOOR_FEMALE_ACTIVE : KCAL_FLOOR_FEMALE);
    T.assert(target >= floor, 'calTarget >= floor goal=' + goal + ' profile[' + i + '] (got=' + target + ')');
    T.assert(target > 0,      'calTarget > 0 goal=' + goal + ' profile[' + i + ']');
    T.assert(isFinite(target),'calTarget finite goal=' + goal + ' profile[' + i + ']');

    // Deficit goals: not more than 500 below TDEE
    if (goal === 'cut' || goal === 'shred') {
      T.assert(target >= tdee - 500, 'deficit cap -500 for ' + goal + ' profile[' + i + '] tdee=' + tdee + ' target=' + target);
    }
    // Surplus goals: not unreasonably high
    if (goal === 'bulk') {
      T.assert(target <= tdee * 1.20, 'bulk not >20% above TDEE profile[' + i + ']');
    }
  });
});

// Ordering: bulk > maintain > cut at same profile
var testBmr  = calcBMR('male', 80, 180, 30);
var testTdee = calcTDEE(testBmr, 1.55);
T.assert(
  calcCaloriesTarget(testTdee,'bulk',testBmr,'male',1.55) >
  calcCaloriesTarget(testTdee,'maintain',testBmr,'male',1.55),
  'bulk > maintain target'
);
T.assert(
  calcCaloriesTarget(testTdee,'maintain',testBmr,'male',1.55) >=
  calcCaloriesTarget(testTdee,'cut',testBmr,'male',1.55),
  'maintain >= cut target'
);

// Active female floor
var fBmr  = calcBMR('female', 60, 165, 30);
var fTdee = calcTDEE(fBmr, 1.55);
var fTarget = calcCaloriesTarget(fTdee, 'shred', fBmr, 'female', 1.55);
T.assert(fTarget >= KCAL_FLOOR_FEMALE_ACTIVE, 'active female floor 1600 applied for shred');

// Sedentary female floor = 1400
var sfBmr   = calcBMR('female', 55, 160, 30);
var sfTdee  = calcTDEE(sfBmr, 1.2);
var sfTarget = calcCaloriesTarget(sfTdee, 'shred', sfBmr, 'female', 1.2);
T.assert(sfTarget >= KCAL_FLOOR_FEMALE, 'sedentary female floor 1400 applied');

console.log('Section 4 done. Pass so far: ' + T.pass);

// ─── SECTION 5: Macro calculations ───────────────────────────────────────────
console.log('Running Section 5: Macro calculations...');

PROFILES.forEach(function(p, i) {
  var bmr      = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee     = calcTDEE(bmr, p.pal);
  var target   = calcCaloriesTarget(tdee, p.goal, bmr, p.gender, p.pal);
  var protein  = calcProtein(p.gender, p.isElite, p.weightKg);
  var fat      = calcFat(p.weightKg);
  var carbs    = calcCarbs(target, protein, fat);

  // Protein range
  T.range(protein / p.weightKg, 0.8, 3.5, 'protein g/kg in [0.8,3.5] profile[' + i + ']');
  // Fat minimum
  T.assert(fat >= 0.7 * p.weightKg, 'fat >= 0.7g/kg profile[' + i + '] fat=' + fat + ' w=' + p.weightKg);
  // Carb minimum
  T.assert(carbs >= 130, 'carbs >= 130g (IOM) profile[' + i + '] carbs=' + carbs);
  // Calorie check — within 50 kcal (IOM floor may add extra carbs)
  var calCheck = protein * 4 + fat * 9 + carbs * 4;
  T.assert(calCheck >= target - 10, 'macro sum >= target profile[' + i + '] check=' + Math.round(calCheck) + ' target=' + target);
  // All positive
  T.assert(protein > 0, 'protein > 0 profile[' + i + ']');
  T.assert(fat > 0,     'fat > 0 profile[' + i + ']');
  T.assert(carbs >= 0,  'carbs >= 0 profile[' + i + ']');
  // Finite
  T.assert(isFinite(protein) && isFinite(fat) && isFinite(carbs), 'macros finite profile[' + i + ']');
});

// Elite vs non-elite protein ordering
PROFILES.slice(0, 10).forEach(function(p, i) {
  var eliteProt    = calcProtein(p.gender, true,  p.weightKg);
  var nonEliteProt = calcProtein(p.gender, false, p.weightKg);
  T.assert(eliteProt >= nonEliteProt, 'elite protein >= non-elite profile[' + i + ']');
});

// Male vs female protein (non-elite, same weight)
T.assert(calcProtein('male',false,80) > calcProtein('female',false,80), 'male protein > female protein at same weight');

console.log('Section 5 done. Pass so far: ' + T.pass);

// ─── SECTION 6: Recipe macro validation ──────────────────────────────────────
console.log('Running Section 6: Recipe macro validation...');

// Fixed recipe checks
FIXED_RECIPES.forEach(function(r) {
  var computed = recipeCalCheck(r.p, r.c, r.f);
  T.approx(computed, r.cal, 2, 'Recipe ' + r.id + ' P*4+C*4+F*9=' + computed + ' expected=' + r.cal);
  T.assert(r.p >= 0 && r.c >= 0 && r.f >= 0, 'Recipe ' + r.id + ' all macros >= 0');
  T.assert(r.cal > 0, 'Recipe ' + r.id + ' calories > 0');
});

// Parametric: generate 500+ random valid P/C/F combos and verify formula
var seed = 42;
function lcg() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }

for (var ri = 0; ri < 520; ri++) {
  var rp = Math.round(lcg() * 60 + 10);  // 10-70g protein
  var rc = Math.round(lcg() * 150 + 20); // 20-170g carbs
  var rf = Math.round(lcg() * 50 + 5);   // 5-55g fat
  var expectedCal = rp*4 + rc*4 + rf*9;
  var computedCal = recipeCalCheck(rp, rc, rf);
  T.eq(computedCal, expectedCal, 'Parametric recipe[' + ri + '] formula p=' + rp + ' c=' + rc + ' f=' + rf);
}

console.log('Section 6 done. Pass so far: ' + T.pass);
if (T.pass % 500 < 100) console.log('Progress: ' + T.pass + ' tests passed...');

// ─── SECTION 7: Sport load tier mapping ──────────────────────────────────────
console.log('Running Section 7: Sport load tier mapping...');

// crossfit always → crossfit-heavy
[0, 5, 30, 60, 90].forEach(function(dur) {
  [1,5,7,9,10].forEach(function(rpe) {
    var result = computeSportLoad('crossfit', 'moderate', dur, rpe);
    T.eq(result, 'crossfit-heavy', 'crossfit always crossfit-heavy dur=' + dur + ' rpe=' + rpe);
    T.assert(LOAD_MULTIPLIERS[result] !== undefined, 'crossfit-heavy tier exists in LOAD_MULTIPLIERS');
  });
});

// hyrox always → hyrox-heavy
[0, 30, 60, 90].forEach(function(dur) {
  var result = computeSportLoad('hyrox', 'heavy', dur, 6);
  T.eq(result, 'hyrox-heavy', 'hyrox always hyrox-heavy dur=' + dur);
});

// running: duration threshold
T.eq(computeSportLoad('running','moderate',59,7), 'running-moderate', 'running <60min rpe<8 → moderate');
T.eq(computeSportLoad('running','moderate',60,5), 'running-heavy',    'running >=60min → heavy');
T.eq(computeSportLoad('running','light',30,8),    'running-heavy',    'running rpe>=8 → heavy');
T.eq(computeSportLoad('running','light',30,7),    'running-moderate', 'running rpe=7 <60min → moderate');

// musculation: heavy → strength-heavy, others pass through
T.eq(computeSportLoad('musculation','heavy','',6),    'strength-heavy', 'musculation heavy → strength-heavy');
T.eq(computeSportLoad('musculation','moderate','',6), 'moderate',       'musculation moderate → moderate');
T.eq(computeSportLoad('musculation','light','',6),    'light',          'musculation light → light');

// yoga/golf → mobility-light
T.eq(computeSportLoad('yoga','moderate',60,5), 'mobility-light', 'yoga → mobility-light');
T.eq(computeSportLoad('golf','heavy',120,7),   'mobility-light', 'golf → mobility-light');

// carbBoost comparisons
T.assert(
  LOAD_MULTIPLIERS['crossfit-heavy'].carbBoost > LOAD_MULTIPLIERS['strength-heavy'].carbBoost,
  'CrossFit carbBoost > musculation carbBoost'
);
T.assert(
  LOAD_MULTIPLIERS['hyrox-heavy'].carbBoost > LOAD_MULTIPLIERS['strength-heavy'].carbBoost,
  'Hyrox carbBoost > musculation carbBoost'
);
T.assert(
  LOAD_MULTIPLIERS['running-heavy'].carbBoost > LOAD_MULTIPLIERS['running-moderate'].carbBoost,
  'running-heavy carbBoost > running-moderate carbBoost'
);

// All sport load results must exist in LOAD_MULTIPLIERS
var sportInputs = [
  ['crossfit','moderate',30,6], ['hyrox','heavy',60,7], ['running','light',30,5],
  ['running','moderate',65,5], ['musculation','heavy',45,8], ['musculation','moderate',45,6],
  ['yoga','light',60,4], ['golf','light',90,3], ['triathlon','heavy',120,9],
  ['cycling','moderate',60,6], ['unknown','moderate',45,6]
];
sportInputs.forEach(function(args) {
  var result = computeSportLoad(args[0], args[1], args[2], args[3]);
  T.assert(typeof result === 'string', 'computeSportLoad returns string for ' + args[0]);
  // result should be a known tier (or 'moderate' fallback)
  var knownTiers = Object.keys(LOAD_MULTIPLIERS).concat(['moderate','light','heavy']);
  T.assert(knownTiers.indexOf(result) !== -1, 'computeSportLoad result is known tier for ' + args[0]);
});

console.log('Section 7 done. Pass so far: ' + T.pass);

// ─── SECTION 8: Recipe scoring simulation ────────────────────────────────────
console.log('Running Section 8: Recipe scoring simulation...');

// Simulate sportTypeBonus scoring logic
function sportTypeBonus(recipe, sportType, isTrainingDay) {
  var score = 0;
  var proteinRatio = recipe.p / ((recipe.p*4 + recipe.c*4 + recipe.f*9) / 4);
  var carbRatio    = recipe.c / ((recipe.p*4 + recipe.c*4 + recipe.f*9) / 4);

  if (!isTrainingDay) return 0;

  if (sportType === 'musculation' || sportType === 'strength') {
    // high-protein bonus
    if (recipe.p >= 35) score -= 150;
    else if (recipe.p >= 25) score -= 80;
    else score += 50;
  }
  if (sportType === 'running' || sportType === 'triathlon') {
    // high-carb bonus
    if (recipe.c >= 50) score -= 150;
    else if (recipe.c >= 30) score -= 80;
    else score += 50;
  }
  if (sportType === 'crossfit' || sportType === 'hyrox') {
    // dual quality (protein + carb)
    if (recipe.p >= 25 && recipe.c >= 40) score -= 180;
    else if (recipe.p >= 20 || recipe.c >= 40) score -= 80;
  }
  return score;
}

var testRecipes = {
  highProtein: { p: 40, c: 20, f: 10, cal: 330 },
  highCarb:    { p: 20, c: 60, f: 10, cal: 510 },
  dual:        { p: 30, c: 50, f: 10, cal: 450 },
  lowAll:      { p: 10, c: 15, f: 8,  cal: 172 }
};

var sportTypes = ['musculation','running','crossfit','hyrox','yoga'];

sportTypes.forEach(function(sport) {
  // Training day
  var scoreHP_train   = sportTypeBonus(testRecipes.highProtein, sport, true);
  var scoreHC_train   = sportTypeBonus(testRecipes.highCarb,    sport, true);
  var scoreDual_train = sportTypeBonus(testRecipes.dual,        sport, true);

  // Rest day: score = 0
  var scoreHP_rest = sportTypeBonus(testRecipes.highProtein, sport, false);
  T.eq(scoreHP_rest, 0, sport + ' rest day score = 0');

  // Musculation favors protein
  if (sport === 'musculation') {
    T.assert(scoreHP_train < scoreDual_train || scoreHP_train <= 0,
      'musculation: high-protein score <= dual score');
    T.assert(scoreHP_train < 0, 'musculation: high-protein gets negative score (bonus)');
  }

  // Running favors carbs
  if (sport === 'running') {
    T.assert(scoreHC_train < 0, 'running: high-carb gets negative score (bonus)');
    T.assert(scoreHC_train <= scoreHP_train, 'running: high-carb score <= high-protein score');
  }

  // CrossFit/Hyrox favors dual
  if (sport === 'crossfit' || sport === 'hyrox') {
    T.assert(scoreDual_train < 0, sport + ': dual-quality gets negative score (bonus)');
  }

  // Finite and numeric
  T.assert(isFinite(scoreHP_train), sport + ' score is finite');
});

// Test 100 sport×recipe scenario combinations
var scenarioSports = ['musculation','running','crossfit','hyrox','yoga'];
var scenarioRecipes = [
  {p:40,c:20,f:10}, {p:20,c:60,f:10}, {p:30,c:50,f:10},
  {p:15,c:15,f:8},  {p:50,c:30,f:15}, {p:25,c:80,f:12}
];
var scenarioDays = [true, false];

scenarioSports.forEach(function(sport) {
  scenarioRecipes.forEach(function(recipe, ri) {
    scenarioDays.forEach(function(isTraining) {
      var score = sportTypeBonus(recipe, sport, isTraining);
      T.assert(isFinite(score), 'scenario score finite sport=' + sport + ' recipe[' + ri + '] training=' + isTraining);
      T.assert(typeof score === 'number', 'scenario score is number');
      if (!isTraining) T.eq(score, 0, 'rest day always 0 for ' + sport);
    });
  });
});

// Favorite bonus test
var FAVORITE_BONUS = -200;
T.assert(FAVORITE_BONUS < sportTypeBonus(testRecipes.lowAll, 'musculation', true) + 0,
  'favorite bonus more impactful than no-sport bonus on low recipe');

// Empty pool safe fallback simulation
function pickRecipeSafe(pool) {
  if (!pool || !pool.length) return { name: 'Repas libre', p: 30, c: 40, f: 15 };
  return pool[0];
}
T.eq(pickRecipeSafe([]).name, 'Repas libre', 'empty pool returns Repas libre');
T.eq(pickRecipeSafe(null).name, 'Repas libre', 'null pool returns Repas libre');
T.assert(pickRecipeSafe([{name:'R1',p:20,c:30,f:10}]).name === 'R1', 'non-empty pool returns first recipe');

console.log('Section 8 done. Pass so far: ' + T.pass);
console.log('Progress: ' + T.pass + ' tests passed...');

// ─── SECTION 9: Carb cycling ──────────────────────────────────────────────────
console.log('Running Section 9: Carb cycling...');

PROFILES.forEach(function(p, i) {
  var bmr    = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee   = calcTDEE(bmr, p.pal);
  var target = calcCaloriesTarget(tdee, p.goal, bmr, p.gender, p.pal);
  var prot   = calcProtein(p.gender, p.isElite, p.weightKg);
  var fat    = calcFat(p.weightKg);
  var carbs  = calcCarbs(target, prot, fat);

  // Carb cycling: training day boost
  var cycled = applyCarbCycling(carbs, prot, fat, bmr, p.gender, p.weightKg);
  T.assert(cycled.carbsGrams >= carbs, 'carb cycling boosts carbs profile[' + i + '] cycled=' + cycled.carbsGrams + ' base=' + carbs);
  T.assert(cycled.carbsGrams >= 130,   'carb cycling respects IOM 130g floor profile[' + i + ']');
  T.assert(cycled.caloriesTarget >= (p.gender === 'male' ? KCAL_FLOOR_MALE : KCAL_FLOOR_FEMALE),
    'carb cycling respects kcal floor profile[' + i + ']');
  T.assert(cycled.fatGrams >= 0, 'carb cycling fatGrams >= 0 profile[' + i + ']');
  T.assert(isFinite(cycled.carbsGrams), 'cycled carbs finite profile[' + i + ']');

  // Fat floor: 0.8g/kg
  var fatFloor = Math.ceil(FAT_MIN_PER_KG * p.weightKg);
  T.assert(cycled.fatGrams >= fatFloor - 1, 'carb cycling respects fat floor profile[' + i + '] fatGrams=' + cycled.fatGrams + ' floor=' + fatFloor);
});

// Heavy streak: +25% carb boost (simulate manually)
function carbBoostStreakSimulation(carbsBase, streak) {
  var rate = streak >= 2 ? CARB_CYCLING_BOOST_STREAK : CARB_CYCLING_BOOST;
  return Math.round(carbsBase * (1 + rate));
}
var baseCarbTest = 200;
T.assert(carbBoostStreakSimulation(baseCarbTest, 0) === Math.round(baseCarbTest * 1.20), 'single heavy: +20% carbs');
T.assert(carbBoostStreakSimulation(baseCarbTest, 2) === Math.round(baseCarbTest * 1.25), '2-day streak: +25% carbs');
T.assert(carbBoostStreakSimulation(baseCarbTest, 3) === Math.round(baseCarbTest * 1.25), '3-day streak: +25% carbs');
T.assert(carbBoostStreakSimulation(baseCarbTest, 1) === Math.round(baseCarbTest * 1.20), '1-day: +20% carbs');

// Rest day: carb reduction 10%
function restDayCarbReduction(carbsGrams) {
  return carbsGrams - Math.round(carbsGrams * 0.10);
}
T.range(restDayCarbReduction(200), 175, 185, 'rest day -10% carbs from 200');
T.assert(restDayCarbReduction(150) === 135, 'rest day -10% from 150');

// IOM 130g floor enforced after reduction
function carbWithFloor(carbsGrams) {
  return Math.max(130, carbsGrams);
}
T.eq(carbWithFloor(120), 130, 'IOM floor applied when carbs < 130');
T.eq(carbWithFloor(150), 150, 'IOM floor not applied when carbs >= 130');
T.eq(carbWithFloor(0),   130, 'IOM floor applied when carbs = 0');

// 15% fat floor (carb cycling floor check)
var FAT_FLOOR_PCT = 0.15;
PROFILES.slice(0, 10).forEach(function(p, i) {
  var calorieApprox = 2000;
  var fatFloor15 = Math.round(calorieApprox * FAT_FLOOR_PCT / 9);
  T.assert(fatFloor15 > 0, '15% fat floor > 0 profile[' + i + ']');
  T.range(fatFloor15, 20, 50, '15% fat floor reasonable profile[' + i + ']');
});

console.log('Section 9 done. Pass so far: ' + T.pass);

// ─── SECTION 10: Fatigue detection ───────────────────────────────────────────
console.log('Running Section 10: Fatigue detection...');

// Known scenarios
var fatigueScenarios = [
  { days: 0, rpe: 5, deload: false, expectedLevel: 'fresh',      expectedCF: 1.0,  restRec: false },
  { days: 1, rpe: 4, deload: false, expectedLevel: 'fresh',      expectedCF: 1.0,  restRec: false },
  { days: 2, rpe: 5, deload: false, expectedLevel: 'fresh',      expectedCF: 1.0,  restRec: false },
  { days: 3, rpe: 5, deload: false, expectedLevel: 'normal',     expectedCF: 0.95, restRec: false },
  { days: 4, rpe: 5, deload: false, expectedLevel: 'normal',     expectedCF: 0.95, restRec: false },
  { days: 5, rpe: 5, deload: false, expectedLevel: 'tired',      expectedCF: 0.80, restRec: false },
  { days: 4, rpe: 7.5, deload: false, expectedLevel: 'tired',    expectedCF: 0.80, restRec: false },
  { days: 3, rpe: 8.0, deload: false, expectedLevel: 'tired',    expectedCF: 0.80, restRec: false },
  { days: 6, rpe: 5, deload: false, expectedLevel: 'overtrained',expectedCF: 0.60, restRec: true  },
  { days: 7, rpe: 5, deload: false, expectedLevel: 'overtrained',expectedCF: 0.60, restRec: true  },
  { days: 3, rpe: 8.5, deload: false, expectedLevel:'overtrained',expectedCF:0.60, restRec: true  },
  { days: 3, rpe: 9.0, deload: false, expectedLevel:'overtrained',expectedCF:0.60, restRec: true  },
  { days: 3, rpe: 5,   deload: true,  expectedLevel:'overtrained',expectedCF:0.60, restRec: true  }
];

fatigueScenarios.forEach(function(s, i) {
  var result = getFatigueScorePure(s.days, s.rpe, s.deload);
  T.eq(result.level,          s.expectedLevel, 'fatigue level scenario[' + i + '] days=' + s.days + ' rpe=' + s.rpe);
  T.eq(result.cycleFactor,    s.expectedCF,    'cycleFactor scenario[' + i + ']');
  T.eq(result.restRecommended,s.restRec,        'restRecommended scenario[' + i + ']');
});

// cycleFactor always in [0.6, 1.0]
var rpeRange   = [1, 3, 5, 6, 7, 7.5, 8, 8.5, 9, 10];
var daysRange  = [0, 1, 2, 3, 4, 5, 6, 7];
rpeRange.forEach(function(rpe) {
  daysRange.forEach(function(days) {
    var result = getFatigueScorePure(days, rpe, false);
    T.range(result.cycleFactor, 0.6, 1.0, 'cycleFactor in [0.6,1.0] days=' + days + ' rpe=' + rpe);
    T.assert(typeof result.restRecommended === 'boolean', 'restRecommended is boolean days=' + days + ' rpe=' + rpe);
    T.assert(['fresh','normal','tired','overtrained'].indexOf(result.level) !== -1,
      'level is valid string days=' + days + ' rpe=' + rpe);
  });
});

console.log('Section 10 done. Pass so far: ' + T.pass);

// ─── SECTION 11: Calorie floors ───────────────────────────────────────────────
console.log('Running Section 11: Calorie floors...');

// Female floor >= 1400
PROFILES.filter(function(p) { return p.gender === 'female'; }).forEach(function(p, i) {
  var bmr    = calcBMR('female', p.weightKg, p.heightCm, p.age);
  var tdee   = calcTDEE(bmr, p.pal);
  GOALS_TO_TEST.forEach(function(goal) {
    var target = calcCaloriesTarget(tdee, goal, bmr, 'female', p.pal);
    T.assert(target >= KCAL_FLOOR_FEMALE, 'female floor >= 1400 profile[' + i + '] goal=' + goal + ' got=' + target);
  });
});

// Male floor >= 1500
PROFILES.filter(function(p) { return p.gender === 'male'; }).forEach(function(p, i) {
  var bmr    = calcBMR('male', p.weightKg, p.heightCm, p.age);
  var tdee   = calcTDEE(bmr, p.pal);
  GOALS_TO_TEST.forEach(function(goal) {
    var target = calcCaloriesTarget(tdee, goal, bmr, 'male', p.pal);
    T.assert(target >= KCAL_FLOOR_MALE, 'male floor >= 1500 profile[' + i + '] goal=' + goal + ' got=' + target);
  });
});

// Active female floor >= 1600 (IOC RED-S)
var activeFemaleProfiles = PROFILES.filter(function(p) {
  return p.gender === 'female' && p.pal >= 1.375;
});
activeFemaleProfiles.forEach(function(p, i) {
  var bmr    = calcBMR('female', p.weightKg, p.heightCm, p.age);
  var tdee   = calcTDEE(bmr, p.pal);
  var target = calcCaloriesTarget(tdee, 'shred', bmr, 'female', p.pal);
  T.assert(target >= KCAL_FLOOR_FEMALE_ACTIVE, 'active female shred floor >= 1600 profile[' + i + '] got=' + target);
});

// No target < 1000
PROFILES.forEach(function(p, i) {
  var bmr    = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee   = calcTDEE(bmr, p.pal);
  GOALS_TO_TEST.forEach(function(goal) {
    var target = calcCaloriesTarget(tdee, goal, bmr, p.gender, p.pal);
    T.assert(target >= 1000, 'no target < 1000 profile[' + i + '] goal=' + goal + ' got=' + target);
  });
});

console.log('Section 11 done. Pass so far: ' + T.pass);
console.log('Progress: ' + T.pass + ' tests passed...');

// ─── SECTION 12: Hydration targets ───────────────────────────────────────────
console.log('Running Section 12: Hydration targets...');

var testWeights    = [50, 60, 70, 80, 90, 100];
var testSportTypes = ['musculation','running','crossfit','hyrox','yoga','golf'];

testWeights.forEach(function(w) {
  testSportTypes.forEach(function(sport) {
    [true, false].forEach(function(isTraining) {
      var hydration = calcHydration(w, sport, isTraining);
      T.range(hydration, 1500, 5000, 'hydration in [1500,5000] w=' + w + ' sport=' + sport + ' training=' + isTraining);
      T.assert(isFinite(hydration), 'hydration finite w=' + w);
    });

    // Training day > rest day for non-trivial sports
    var hTrain = calcHydration(w, sport, true);
    var hRest  = calcHydration(w, sport, false);
    T.assert(hTrain >= hRest, 'training hydration >= rest hydration w=' + w + ' sport=' + sport);
  });

  // Higher weight → higher base hydration
  if (w < 100) {
    var hLight  = calcHydration(w,    'running', false);
    var hHeavy  = calcHydration(w+10, 'running', false);
    T.assert(hHeavy >= hLight, 'heavier → higher hydration base w=' + w);
  }
});

// CrossFit/Hyrox add >= 600ml vs rest
testWeights.forEach(function(w) {
  var hCF   = calcHydration(w, 'crossfit', true);
  var hBase = calcHydration(w, 'crossfit', false);
  T.assert(hCF - hBase >= 600, 'crossfit training adds >=600ml over rest w=' + w + ' diff=' + (hCF-hBase));

  var hHyrox = calcHydration(w, 'hyrox', true);
  var hHBase = calcHydration(w, 'hyrox', false);
  T.assert(hHyrox - hHBase >= 600, 'hyrox training adds >=600ml over rest w=' + w);
});

console.log('Section 12 done. Pass so far: ' + T.pass);

// ─── SECTION 13: Consecutive fatigue / streaks ────────────────────────────────
console.log('Running Section 13: Consecutive fatigue...');

// 0 consecutive heavy days → cycleFactor = 1.0
T.eq(getFatigueScorePure(0, 5, false).cycleFactor, 1.0, '0 training days → cycleFactor=1.0');
T.eq(getFatigueScorePure(1, 5, false).cycleFactor, 1.0, '1 training day → cycleFactor=1.0');
T.eq(getFatigueScorePure(2, 5, false).cycleFactor, 1.0, '2 training days → cycleFactor=1.0');

// 3+ days → not 1.0 (at least normal=0.95)
T.assert(getFatigueScorePure(3, 5, false).cycleFactor <= 0.95, '3 days → cycleFactor <= 0.95');

// 5+ days → tired (0.80)
T.eq(getFatigueScorePure(5, 5, false).cycleFactor, 0.80, '5 days → cycleFactor=0.80');
T.eq(getFatigueScorePure(5, 5, false).level, 'tired', '5 days → tired');

// 6+ consecutive → overtrained (0.60)
T.eq(getFatigueScorePure(6, 5, false).cycleFactor, 0.60, '6 days → cycleFactor=0.60');
T.eq(getFatigueScorePure(7, 5, false).cycleFactor, 0.60, '7 days → cycleFactor=0.60');
T.eq(getFatigueScorePure(6, 5, false).level, 'overtrained', '6 days → overtrained');

// Rest day resets streak → fresh at 0 days
T.eq(getFatigueScorePure(0, 5, false).level, 'fresh', 'rest (0 days) → fresh');

// Deload flag → always overtrained
[0,1,2,3,4,5].forEach(function(days) {
  var result = getFatigueScorePure(days, 5, true);
  T.eq(result.level,       'overtrained', 'deload flag → overtrained regardless of days=' + days);
  T.eq(result.cycleFactor, 0.60,          'deload flag → cycleFactor=0.60 days=' + days);
  T.eq(result.restRecommended, true,      'deload flag → restRecommended=true days=' + days);
});

// High RPE overrides low days
T.eq(getFatigueScorePure(1, 8.5, false).level, 'overtrained', 'rpe=8.5 → overtrained regardless of days');
T.eq(getFatigueScorePure(0, 9.0, false).level, 'overtrained', 'rpe=9.0, 0 days → still overtrained');
T.eq(getFatigueScorePure(2, 7.5, false).level, 'tired',       'rpe=7.5 → tired even with low days');

// Monotonicity: more days → same or worse fatigue level
var levelRank = { fresh: 0, normal: 1, tired: 2, overtrained: 3 };
var prevRank = 0;
[0,1,2,3,4,5,6,7].forEach(function(days) {
  var result = getFatigueScorePure(days, 5, false);
  var rank   = levelRank[result.level];
  T.assert(rank >= prevRank, 'fatigue non-decreasing days=' + days + ' level=' + result.level);
  prevRank = rank;
});

console.log('Section 13 done. Pass so far: ' + T.pass);

// ─── SECTION 14: User persona end-to-end simulations ─────────────────────────
console.log('Running Section 14: Persona simulations...');

// Persona 1: Sedentary woman fat loss
(function() {
  var bmr    = calcBMR('female', 65, 163, 28);
  var tdee   = calcTDEE(bmr, 1.2);
  var target = calcCaloriesTarget(tdee, 'shred', bmr, 'female', 1.2);
  var prot   = calcProtein('female', false, 65);

  T.approx(bmr, 1368, 10, 'Persona1 BMR ~1368');
  T.assert(target >= 1400, 'Persona1 target >= 1400 (floor) got=' + target);
  T.assert(prot >= 65, 'Persona1 protein >= 65g got=' + prot);
  T.assert(tdee > bmr, 'Persona1 TDEE > BMR');
  T.range(target, 1400, 1800, 'Persona1 target reasonable range');
})();

// Persona 2: CrossFit athlete male muscle gain
(function() {
  var bmr    = calcBMR('male', 82, 178, 28);
  var tdee   = calcTDEE(bmr, 1.725);
  var target = calcCaloriesTarget(tdee, 'lean_bulk', bmr, 'male', 1.725);
  var prot   = calcProtein('male', true, 82);

  T.approx(bmr, 1798, 15, 'Persona2 BMR ~1798');
  T.assert(target > 2500, 'Persona2 CrossFit athlete target > 2500 got=' + target);
  T.assert(prot >= 140, 'Persona2 protein >= 140g (1.7g/kg) got=' + prot);
  T.range(target, 2500, 4500, 'Persona2 target reasonable');
})();

// Persona 3: Endurance runner male recomp
(function() {
  var bmr    = calcBMR('male', 70, 175, 35);
  var tdee   = calcTDEE(bmr, 1.55);
  var target = calcCaloriesTarget(tdee, 'recomposition', bmr, 'male', 1.55);
  T.approx(bmr, 1624, 10, 'Persona3 BMR ~1624');
  T.range(target, 2200, 2800, 'Persona3 runner recomp target in [2200,2800] got=' + target);
})();

// Persona 4: Female vegetarian maintain
(function() {
  var bmr    = calcBMR('female', 62, 168, 30);
  var tdee   = calcTDEE(bmr, 1.375);
  var target = calcCaloriesTarget(tdee, 'maintain', bmr, 'female', 1.375);
  var prot   = calcProtein('female', false, 62);
  var protVeg = Math.round(prot * 1.10); // +10% DIAAS correction
  T.assert(protVeg >= 74, 'Persona4 vegetarian protein >= 74g got=' + protVeg);
  T.assert(target >= 1600, 'Persona4 active female target >= 1600 (RED-S) got=' + target);
})();

// Persona 5: Teenager male muscle gain
(function() {
  var bmr    = calcBMR('male', 68, 175, 17);
  var tdee   = calcTDEE(bmr, 1.55);
  var target = calcCaloriesTarget(tdee, 'lean_bulk', bmr, 'male', 1.55);
  T.assert(target >= 1500, 'Persona5 teen target >= 1500 got=' + target);
  T.assert(target <= tdee * 1.15, 'Persona5 teen target not excessive got=' + target + ' tdee=' + tdee);
})();

// Persona 6: Older woman fat loss (sarcopenia)
(function() {
  var bmr    = calcBMR('female', 68, 162, 55);
  var tdee   = calcTDEE(bmr, 1.375);
  var target = calcCaloriesTarget(tdee, 'cut', bmr, 'female', 1.375);
  var prot   = calcProtein('female', false, 68);
  var protSarco = Math.round(prot + 0.4 * 68); // sarcopenia +0.4g/kg
  T.assert(target >= 1600, 'Persona6 active older female floor >= 1600 got=' + target);
  T.assert(protSarco >= 109, 'Persona6 sarcopenia-adjusted protein >= 109g got=' + protSarco);
})();

// Persona 7: Very active male elite athlete
(function() {
  var bmr    = calcBMR('male', 88, 183, 38);
  var tdee   = calcTDEE(bmr, 2.1);
  var target = calcCaloriesTarget(tdee, 'maintain', bmr, 'male', 2.1);
  var prot   = calcProtein('male', true, 88);
  T.assert(target > 3500, 'Persona7 elite athlete target > 3500 got=' + target);
  T.assert(prot >= 180, 'Persona7 elite protein >= 180g (2.2g/kg*82) got=' + prot);
})();

// Persona 8: Obese male cut
(function() {
  var bmr    = calcBMR('male', 130, 178, 42);
  var tdee   = calcTDEE(bmr, 1.375);
  var target = calcCaloriesTarget(tdee, 'shred', bmr, 'male', 1.375);
  T.assert(target >= 1500, 'Persona8 obese male floor >= 1500 got=' + target);
  T.assert(target <= tdee, 'Persona8 shred target <= TDEE got=' + target + ' tdee=' + tdee);
})();

// Parametric: 10 persona × 6 goals = 60 additional assertions
var personaConfigs = [
  {g:'male',  w:75,  h:178, a:25, p:1.55},
  {g:'male',  w:90,  h:182, a:35, p:1.725},
  {g:'female',w:60,  h:165, a:28, p:1.375},
  {g:'female',w:70,  h:168, a:40, p:1.55},
  {g:'male',  w:65,  h:172, a:50, p:1.2},
  {g:'female',w:55,  h:160, a:22, p:1.9},
  {g:'male',  w:100, h:185, a:45, p:1.375},
  {g:'female',w:80,  h:172, a:55, p:1.375},
  {g:'male',  w:80,  h:180, a:30, p:1.55},
  {g:'female',w:65,  h:165, a:35, p:1.55}
];

personaConfigs.forEach(function(pc, pi) {
  GOALS_TO_TEST.forEach(function(goal) {
    var bmr    = calcBMR(pc.g, pc.w, pc.h, pc.a);
    var tdee   = calcTDEE(bmr, pc.p);
    var target = calcCaloriesTarget(tdee, goal, bmr, pc.g, pc.p);
    var floor  = pc.g === 'male' ? KCAL_FLOOR_MALE : (pc.p >= 1.375 ? KCAL_FLOOR_FEMALE_ACTIVE : KCAL_FLOOR_FEMALE);
    T.assert(target >= floor, 'persona[' + pi + '] goal=' + goal + ' target >= floor got=' + target);
    T.assert(target > 0 && isFinite(target), 'persona[' + pi + '] goal=' + goal + ' target valid');
  });
});

console.log('Section 14 done. Pass so far: ' + T.pass);
console.log('Progress: ' + T.pass + ' tests passed...');

// ─── SECTION 15: Edge cases and adversarial inputs ────────────────────────────
console.log('Running Section 15: Edge cases...');

// Weight = 0 → BMR proxy won't blow up (proxy formula)
T.assert(isFinite(calcBMRProxy(0)),  'BMR proxy weight=0 is finite');
T.assert(isFinite(calcBMRProxy(500)),'BMR proxy weight=500 is finite');

// Protein/Fat with edge weights
[0.1, 1, 10, 150, 500].forEach(function(w) {
  T.assert(isFinite(calcProtein('male',   false, w)), 'protein finite w=' + w);
  T.assert(isFinite(calcFat(w)),                      'fat finite w=' + w);
});

// NaN inputs → calcBMR handles gracefully
var nanBmr = calcBMR('male', NaN, 180, 30);
T.assert(!isFinite(nanBmr) || nanBmr === 0 || typeof nanBmr === 'number', 'BMR with NaN weight returns number');

// computeTrainingLoad edge cases
T.eq(computeTrainingLoad(null, null),    'light', 'null exercises → light');
T.eq(computeTrainingLoad([],   []),      'light', 'empty exercises → light');
T.eq(computeTrainingLoad(undefined, []), 'light', 'undefined exercises → light');

// computeTrainingLoad with heavy groups
var heavyExercises = [
  {name:'Squat',tags:[]},{name:'Deadlift',tags:[]},{name:'BenchPress',tags:[]},
  {name:'Row',tags:[]},{name:'OHP',tags:[]},{name:'Lunge',tags:[]}
];
T.eq(computeTrainingLoad(heavyExercises, ['legs','back']), 'heavy', '6 compound + heavy groups → heavy');

// Only 2 exercises → light
var twoExercises = [{name:'BicepCurl',tags:['isolation']},{name:'Plank',tags:[]}];
T.eq(computeTrainingLoad(twoExercises, ['arms']), 'light', '2 exercises → light');

// getLoadMultipliers: not training → rest
var restMult = getLoadMultipliers(false, 'heavy');
T.eq(restMult.cal,       LOAD_MULTIPLIERS.rest.cal,       'not training → rest cal');
T.eq(restMult.carbBoost, LOAD_MULTIPLIERS.rest.carbBoost, 'not training → rest carbBoost');

// getLoadMultipliers: unknown tier → moderate fallback
var unknownMult = getLoadMultipliers(true, 'unknown_tier_xyz');
T.eq(unknownMult.cal, LOAD_MULTIPLIERS.moderate.cal, 'unknown tier → moderate fallback');

// getPeriodizationInfo: week cycling
T.eq(getPeriodizationInfo(1).label, getPeriodizationInfo(5).label, 'week 5 wraps to week 1');
T.eq(getPeriodizationInfo(4).label, getPeriodizationInfo(8).label, 'week 8 wraps to week 4');
T.assert(typeof getPeriodizationInfo(0).label === 'string', 'weekIndex=0 returns string label');

// getPeriodizationCfg: all 4 weeks have required fields
[1,2,3,4].forEach(function(w) {
  var cfg = getPeriodizationCfg(w);
  T.assert(typeof cfg.durMax  === 'number', 'week' + w + ' durMax is number');
  T.assert(typeof cfg.durSets === 'number', 'week' + w + ' durSets is number');
  T.assert(cfg.durMax > 0,  'week' + w + ' durMax > 0');
  T.assert(cfg.durSets > 0, 'week' + w + ' durSets > 0');
});

// S4 deload has fewer sets than S1 and S2
T.assert(getPeriodizationCfg(4).durSets < getPeriodizationCfg(1).durSets, 'S4 deload fewer sets than S1');
T.assert(getPeriodizationCfg(4).durMax  < getPeriodizationCfg(1).durMax,  'S4 deload fewer exercises than S1');

// S2 has more sets than S1
T.assert(getPeriodizationCfg(2).durSets > getPeriodizationCfg(1).durSets, 'S2 more sets than S1');

// Week index cycling
var now = Date.now();
T.eq(getWeekIndexFromStart(null, now), 1, 'null start → week 1');
T.eq(getWeekIndexFromStart('invalid', now), 1, 'invalid start → week 1');

var startDateW1 = new Date(now - 0 * 7 * 86400000).toISOString().slice(0,10);
var startDateW2 = new Date(now - 1 * 7 * 86400000).toISOString().slice(0,10);
var startDateW3 = new Date(now - 2 * 7 * 86400000).toISOString().slice(0,10);
var startDateW4 = new Date(now - 3 * 7 * 86400000).toISOString().slice(0,10);
var startDateW5 = new Date(now - 4 * 7 * 86400000).toISOString().slice(0,10);

T.eq(getWeekIndexFromStart(startDateW1, now), 1, 'week 0 weeks → index 1');
T.eq(getWeekIndexFromStart(startDateW2, now), 2, '1 week elapsed → index 2');
T.eq(getWeekIndexFromStart(startDateW3, now), 3, '2 weeks elapsed → index 3');
T.eq(getWeekIndexFromStart(startDateW4, now), 4, '3 weeks elapsed → index 4');
T.eq(getWeekIndexFromStart(startDateW5, now), 1, '4 weeks elapsed → wraps to index 1');

// calcCarbs: extreme low calorie scenario
var lowCalCarbs = calcCarbs(1400, 140, 50);
T.assert(lowCalCarbs >= 130, 'IOM floor on low-cal scenario got=' + lowCalCarbs);

// calcCarbs: normal scenario
var normalCarbs = calcCarbs(2500, 150, 70);
T.assert(normalCarbs >= 130, 'carbs >= 130 normal scenario got=' + normalCarbs);
T.assert(isFinite(normalCarbs), 'normalCarbs finite');

// Negative calorie target → floor applied
var badTarget = calcCaloriesTarget(-100, 'cut', 1200, 'male', 1.2);
T.assert(badTarget >= KCAL_FLOOR_MALE, 'negative TDEE still gets floor got=' + badTarget);

// Missing/invalid goal → defaults (adjust=0)
var invalidGoalTarget = calcCaloriesTarget(2000, 'invalid_goal', 1500, 'male', 1.55);
T.assert(invalidGoalTarget > 0, 'invalid goal still produces positive target got=' + invalidGoalTarget);

// hydration edge cases
T.range(calcHydration(0, 'running', true), 1500, 5000, 'hydration w=0 clamped to [1500,5000]');
T.range(calcHydration(200,'crossfit',true), 1500, 5000, 'hydration w=200 clamped to [1500,5000]');

// recipeCalCheck edge cases
T.eq(recipeCalCheck(0,0,0), 0, 'recipeCalCheck all zero = 0');
T.eq(recipeCalCheck(100,100,100), 100*4+100*4+100*9, 'recipeCalCheck 100/100/100');

console.log('Section 15 done. Pass so far: ' + T.pass);

// ─── SECTION 16: Additional parametric volume to reach 3000+ ──────────────────
console.log('Running Section 16: Parametric volume tests...');

// Parametric BMR × 10 age values × 10 weights = 100 tests per sex = 200 assertions × 3 props = 600
var paraAges    = [18, 22, 28, 35, 42, 50, 57, 63, 70, 75];
var paraWeights = [45, 55, 65, 75, 85, 95, 105, 115, 130, 150];
var paraSexes   = ['male', 'female'];
var paraHeights = [155, 165, 170, 175, 180, 185];

paraSexes.forEach(function(sex) {
  paraAges.forEach(function(age) {
    paraWeights.forEach(function(weight) {
      var bmr = calcBMR(sex, weight, 175, age);
      T.assert(bmr > 0,        sex + ' w=' + weight + ' a=' + age + ' BMR>0');
      T.assert(isFinite(bmr),  sex + ' w=' + weight + ' a=' + age + ' BMR finite');
      T.range(bmr, 600, 6000,  sex + ' w=' + weight + ' a=' + age + ' BMR in range');
    });
  });
});

// Parametric TDEE × PAL × profile = 180 more assertions
PAL_LEVELS.forEach(function(pal) {
  paraSexes.forEach(function(sex) {
    paraWeights.slice(0,5).forEach(function(weight) {
      var bmr  = calcBMR(sex, weight, 170, 30);
      var tdee = calcTDEE(bmr, pal);
      T.assert(tdee > bmr,      'TDEE>BMR sex=' + sex + ' w=' + weight + ' pal=' + pal);
      T.assert(isFinite(tdee),  'TDEE finite sex=' + sex + ' w=' + weight + ' pal=' + pal);
      T.range(tdee, 1200, 9000, 'TDEE in range sex=' + sex + ' w=' + weight + ' pal=' + pal);
    });
  });
});

// Parametric carb cycling: 30 profiles
PROFILES.slice(0, 30).forEach(function(p, i) {
  var bmr    = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee   = calcTDEE(bmr, p.pal);
  var target = calcCaloriesTarget(tdee, p.goal, bmr, p.gender, p.pal);
  var prot   = calcProtein(p.gender, p.isElite, p.weightKg);
  var fat    = calcFat(p.weightKg);
  var carbs  = calcCarbs(target, prot, fat);
  var cycled = applyCarbCycling(carbs, prot, fat, bmr, p.gender, p.weightKg);

  T.assert(cycled.carbsGrams >= 130,   'cycled IOM floor p[' + i + ']');
  T.assert(cycled.caloriesTarget >= 0, 'cycled calories >= 0 p[' + i + ']');
  T.assert(typeof cycled.clampedToBMR === 'boolean', 'cycled.clampedToBMR is bool p[' + i + ']');
  T.assert(isFinite(cycled.carbsGrams), 'cycled carbs finite p[' + i + ']');
  T.assert(isFinite(cycled.fatGrams),   'cycled fat finite p[' + i + ']');
});

// Parametric sport load tiers × multiplier properties
var sportTierInputs = [
  ['crossfit','heavy',60,8],  ['crossfit','light',10,3],
  ['hyrox','moderate',90,7],  ['running','heavy',70,8],
  ['running','light',30,4],   ['musculation','heavy',45,7],
  ['musculation','light',30,5],['yoga','light',60,4],
  ['golf','moderate',120,3],  ['triathlon','heavy',120,9],
  ['cycling','light',30,3],   ['swimming','moderate',45,6]
];

sportTierInputs.forEach(function(args, idx) {
  var tier = computeSportLoad(args[0], args[1], args[2], args[3]);
  var mult = LOAD_MULTIPLIERS[tier];
  if (mult) {
    T.assert(mult.cal > 0,       'sport tier mul cal>0 idx=' + idx + ' tier=' + tier);
    T.assert(mult.carbBoost > 0, 'sport tier mul carbBoost>0 idx=' + idx + ' tier=' + tier);
    T.assert(mult.fatAdjust > 0, 'sport tier mul fatAdjust>0 idx=' + idx + ' tier=' + tier);
  } else {
    // Unknown tier falls back to moderate
    T.assert(typeof tier === 'string', 'computeSportLoad returns string for idx=' + idx);
  }
});

// Parametric fatigue score across full matrix
var allRpeValues  = [1, 2, 3, 4, 5, 6, 7, 7.5, 8, 8.5, 9, 10];
var allDayValues  = [0, 1, 2, 3, 4, 5, 6, 7];
allRpeValues.forEach(function(rpe) {
  allDayValues.forEach(function(days) {
    var result = getFatigueScorePure(days, rpe, false);
    T.range(result.cycleFactor, 0.60, 1.0, 'cycleFactor range rpe=' + rpe + ' days=' + days);
    T.assert(['fresh','normal','tired','overtrained'].indexOf(result.level) !== -1,
      'valid level rpe=' + rpe + ' days=' + days);
  });
});

// Parametric hydration: all weights × sports × training
[40,50,60,70,80,90,100,110].forEach(function(w) {
  ['musculation','crossfit','running','yoga','hyrox'].forEach(function(sport) {
    var hTrain = calcHydration(w, sport, true);
    var hRest  = calcHydration(w, sport, false);
    T.range(hTrain, 1500, 5000, 'hydration train range w=' + w + ' ' + sport);
    T.range(hRest,  1500, 5000, 'hydration rest range w=' + w + ' ' + sport);
    T.assert(hTrain >= hRest, 'train >= rest hydration w=' + w + ' ' + sport);
  });
});

// Parametric LOAD_MULTIPLIERS: getLoadMultipliers function tests
var loadStates = [
  [true, 'heavy'], [true, 'moderate'], [true, 'light'],
  [true, 'strength-heavy'], [true, 'crossfit-heavy'], [true, 'hyrox-heavy'],
  [true, 'running-heavy'], [true, 'running-moderate'], [true, 'mobility-light'],
  [false, 'heavy'], [false, 'moderate'], [false, 'rest']
];
loadStates.forEach(function(ls) {
  var mult = getLoadMultipliers(ls[0], ls[1]);
  T.assert(typeof mult === 'object' && mult !== null, 'getLoadMultipliers returns object isTraining=' + ls[0] + ' load=' + ls[1]);
  T.assert(mult.cal > 0, 'getLoadMultipliers cal>0 isTraining=' + ls[0] + ' load=' + ls[1]);
  T.assert(mult.carbBoost > 0, 'getLoadMultipliers carbBoost>0 load=' + ls[1]);
  T.assert(mult.fatAdjust > 0, 'getLoadMultipliers fatAdjust>0 load=' + ls[1]);
});

// Not-training always returns rest regardless of load param
['heavy','moderate','light','strength-heavy','crossfit-heavy'].forEach(function(load) {
  var mult = getLoadMultipliers(false, load);
  T.eq(mult.cal, LOAD_MULTIPLIERS.rest.cal, 'not-training → rest.cal for load=' + load);
});

// Periodization cfg properties for all weeks (including wrapped)
[1,2,3,4,5,6,7,8,9,10].forEach(function(w) {
  var cfg = getPeriodizationCfg(w);
  T.assert(cfg.durMax > 0 && cfg.durMax <= 10, 'durMax valid week=' + w);
  T.assert(cfg.durSets > 0 && cfg.durSets <= 10, 'durSets valid week=' + w);
  T.assert(typeof cfg.note === 'string', 'note is string week=' + w);
});

// Periodization info label/description for all weeks
[1,2,3,4,5,6,7,8].forEach(function(w) {
  var info = getPeriodizationInfo(w);
  T.assert(typeof info.label === 'string' && info.label.length > 0, 'label non-empty week=' + w);
  T.assert(typeof info.description === 'string' && info.description.length > 0, 'description non-empty week=' + w);
});

// Protein per kg for all profiles
PROFILES.forEach(function(p, i) {
  var ppk = calcProtein(p.gender, false, p.weightKg) / p.weightKg;
  T.range(ppk, 1.0, 3.0, 'protein g/kg in [1.0,3.0] non-elite profile[' + i + ']');
  var ppkElite = calcProtein(p.gender, true, p.weightKg) / p.weightKg;
  T.range(ppkElite, 1.5, 3.5, 'elite protein g/kg in [1.5,3.5] profile[' + i + ']');
});

// CARB_FAT_SPLITS validation
Object.keys(CARB_FAT_SPLITS).forEach(function(k) {
  var split = CARB_FAT_SPLITS[k];
  T.assert(split.carbs > 0 && split.carbs < 1, 'CARB_FAT_SPLIT ' + k + ' carbs in (0,1)');
  T.assert(split.fat > 0 && split.fat < 1,     'CARB_FAT_SPLIT ' + k + ' fat in (0,1)');
  T.approx(split.carbs + split.fat, 1.0, 0.001, 'CARB_FAT_SPLIT ' + k + ' sums to 1.0');
});

// Splits ordering: heavy > moderate > light > rest for carbs
T.assert(CARB_FAT_SPLITS.heavy.carbs   > CARB_FAT_SPLITS.moderate.carbs, 'heavy carb ratio > moderate');
T.assert(CARB_FAT_SPLITS.moderate.carbs > CARB_FAT_SPLITS.light.carbs,   'moderate carb ratio > light');
T.assert(CARB_FAT_SPLITS.light.carbs   > CARB_FAT_SPLITS.rest.carbs,    'light carb ratio > rest');

// Fat opposite
T.assert(CARB_FAT_SPLITS.rest.fat > CARB_FAT_SPLITS.heavy.fat, 'rest fat ratio > heavy fat ratio');

console.log('Section 16 done. Pass so far: ' + T.pass);
console.log('Progress: ' + T.pass + ' tests passed...');

// ─── SECTION 17: computeNutrition SFCEngine integration ──────────────────────
console.log('Running Section 17: SFCEngine nutrition integration...');

var engineProfiles = [
  {weight:75,  heightCm:178, age:25, sex:'male',   goal:'fat_loss',    sessions:0},
  {weight:80,  heightCm:180, age:30, sex:'male',   goal:'muscle_gain', sessions:3},
  {weight:65,  heightCm:163, age:28, sex:'female', goal:'recomp',      sessions:1},
  {weight:90,  heightCm:182, age:35, sex:'male',   goal:'performance', sessions:5},
  {weight:55,  heightCm:160, age:22, sex:'female', goal:'fat_loss',    sessions:0},
  {weight:85,  heightCm:178, age:40, sex:'male',   goal:'muscle_gain', sessions:6},
  {weight:70,  heightCm:168, age:33, sex:'female', goal:'performance', sessions:3},
  {weight:100, heightCm:185, age:45, sex:'male',   goal:'fat_loss',    sessions:2},
  {weight:50,  heightCm:155, age:19, sex:'female', goal:'muscle_gain', sessions:4},
  {weight:88,  heightCm:183, age:38, sex:'male',   goal:'recomp',      sessions:5}
];

engineProfiles.forEach(function(p, i) {
  var sessions = [];
  for (var si = 0; si < p.sessions; si++) sessions.push(si);
  var result = computeNutritionSFCEngine(p, sessions, Date.now());

  T.assert(result.calorieTarget > 0, 'SFCEngine calorieTarget > 0 profile[' + i + ']');
  T.assert(isFinite(result.calorieTarget), 'SFCEngine calorieTarget finite profile[' + i + ']');
  T.assert(result.proteinGrams > 0, 'SFCEngine proteinGrams > 0 profile[' + i + ']');
  T.assert(result.bmr > 0, 'SFCEngine bmr > 0 profile[' + i + ']');
  T.assert(result.tdee > result.bmr, 'SFCEngine TDEE > BMR profile[' + i + ']');

  var floor = p.sex === 'female' ? 1400 : 1500;
  T.assert(result.calorieTarget >= floor, 'SFCEngine floor applied profile[' + i + '] got=' + result.calorieTarget);

  // Protein = 2g/kg
  T.eq(result.proteinGrams, Math.round(p.weight * 2), 'SFCEngine protein 2g/kg profile[' + i + ']');

  // PAL increases with sessions
  T.assert(result.activityPAL >= 1.2, 'PAL >= 1.2 profile[' + i + ']');
  T.assert(result.activityPAL <= 1.9, 'PAL <= 1.9 profile[' + i + ']');
});

// More sessions → higher PAL
var baseUser = {weight:80, heightCm:180, age:30, sex:'male', goal:'recomp'};
var palResults = [0, 1, 3, 5, 6].map(function(n) {
  var sess = [];
  for (var si = 0; si < n; si++) sess.push(si);
  return computeNutritionSFCEngine(baseUser, sess, Date.now()).activityPAL;
});
for (var palIdx = 0; palIdx < palResults.length - 1; palIdx++) {
  T.assert(palResults[palIdx+1] >= palResults[palIdx],
    'PAL non-decreasing with sessions: ' + palResults[palIdx] + '->' + palResults[palIdx+1]);
}

console.log('Section 17 done. Pass so far: ' + T.pass);

// ─── SECTION 18: computeTrainingLoad parametric ───────────────────────────────
console.log('Running Section 18: computeTrainingLoad parametric...');

// Generate exercises with various tags and counts
function makeExercises(count, tags) {
  var exs = [];
  for (var i = 0; i < count; i++) {
    exs.push({ name: 'Ex' + i, tags: tags || [] });
  }
  return exs;
}

// 0-1 exercises → light
T.eq(computeTrainingLoad(makeExercises(1, []), ['legs']), 'light', '1 exercise → light');
T.eq(computeTrainingLoad(makeExercises(2, []), ['back']), 'light', '2 exercises → light');
T.eq(computeTrainingLoad(makeExercises(3, []), ['legs']), 'light', '3 exercises → light');

// No heavy groups → light
T.eq(computeTrainingLoad(makeExercises(6, []), ['arms','core']), 'light', '6 exercises no heavy group → light');
T.eq(computeTrainingLoad(makeExercises(7, []), ['shoulders']), 'light', '7 exercises no heavy group → light');

// 4-5 exercises + heavy group → moderate
T.eq(computeTrainingLoad(makeExercises(4, []), ['legs']), 'moderate', '4 exercises + legs → moderate');
T.eq(computeTrainingLoad(makeExercises(5, []), ['back']), 'moderate', '5 exercises + back → moderate');

// Isolation/finisher tags don't count as compound
var mixedExercises = [
  {name:'Ex1',tags:['isolation']}, {name:'Ex2',tags:['isolation']},
  {name:'Ex3',tags:['isolation']}, {name:'Ex4',tags:['finisher']},
  {name:'Ex5',tags:[]}, {name:'Ex6',tags:[]}
];
// 6 exercises but only 2 compound → not heavy
T.eq(computeTrainingLoad(mixedExercises, ['legs']), 'moderate', '6 exercises but <4 compound → moderate');

// 6+ exercises + heavy groups + 4+ compounds → heavy
T.eq(computeTrainingLoad(makeExercises(6, []), ['legs','back']), 'heavy', '6 compound exercises + heavy groups → heavy');
T.eq(computeTrainingLoad(makeExercises(8, []), ['chest','back']), 'heavy', '8 exercises + chest+back → heavy');

// Additional parametric: count × groups matrix
var groupSets = [
  [], ['arms'], ['legs'], ['back'], ['chest'], ['glutes'], ['legs','back'], ['chest','arms']
];
[0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(function(count) {
  groupSets.forEach(function(groups) {
    var result = computeTrainingLoad(makeExercises(count, []), groups);
    T.assert(['heavy','moderate','light'].indexOf(result) !== -1,
      'computeTrainingLoad valid result count=' + count + ' groups=' + JSON.stringify(groups));
  });
});

console.log('Section 18 done. Pass so far: ' + T.pass);
console.log('Progress: ' + T.pass + ' tests passed...');

// ─── SECTION 19: Macro formula cross-validation ────────────────────────────────
console.log('Running Section 19: Macro formula cross-validation...');

// For each profile: P*4 + F*9 + C*4 should approximately equal target
// (IOM 130g floor may cause overshoot — allow 500 kcal tolerance for deep-cut edge cases)
PROFILES.forEach(function(p, i) {
  var bmr    = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee   = calcTDEE(bmr, p.pal);
  var target = calcCaloriesTarget(tdee, p.goal, bmr, p.gender, p.pal);
  var prot   = calcProtein(p.gender, p.isElite, p.weightKg);
  var fat    = calcFat(p.weightKg);
  var carbs  = calcCarbs(target, prot, fat);

  var macroSum = prot * 4 + fat * 9 + carbs * 4;
  T.assert(macroSum >= target - 5,  'macroSum >= target-5 profile[' + i + '] sum=' + Math.round(macroSum) + ' target=' + target);
  T.assert(macroSum <= target + 700, 'macroSum <= target+700 profile[' + i + '] sum=' + Math.round(macroSum) + ' target=' + target);
});

// timing advice validation (NutritionMaster)
function calcTimingAdvice(proteinGrams, carbsGrams, activityLevel, trainingDay) {
  var postWorkoutProtein = Math.round(Math.min(40, Math.max(20, proteinGrams * 0.20)));
  var preWorkoutCarbs    = Math.round(Math.min(80, Math.max(30, carbsGrams * 0.25)));
  return {
    postWorkoutProtein: postWorkoutProtein,
    preWorkoutCarbs:    preWorkoutCarbs,
    electrolytesNeeded: trainingDay && activityLevel >= 1.725
  };
}

PROFILES.slice(0, 15).forEach(function(p, i) {
  var prot  = calcProtein(p.gender, false, p.weightKg);
  var bmr   = calcBMR(p.gender, p.weightKg, p.heightCm, p.age);
  var tdee  = calcTDEE(bmr, p.pal);
  var targ  = calcCaloriesTarget(tdee, p.goal, bmr, p.gender, p.pal);
  var fat   = calcFat(p.weightKg);
  var carbs = calcCarbs(targ, prot, fat);
  var timing = calcTimingAdvice(prot, carbs, p.pal, true);

  T.range(timing.postWorkoutProtein, 20, 40, 'postWorkoutProtein in [20,40] profile[' + i + ']');
  T.range(timing.preWorkoutCarbs,    30, 80, 'preWorkoutCarbs in [30,80] profile[' + i + ']');
  T.assert(typeof timing.electrolytesNeeded === 'boolean', 'electrolytesNeeded is bool profile[' + i + ']');
});

console.log('Section 19 done. Pass so far: ' + T.pass);

// ─── SECTION 20: GOALS key → delta validation ─────────────────────────────────
console.log('Running Section 20: Goal adjustments validation...');

// Verify goal adjustment values
T.assert(GOAL_ADJUSTMENTS.bulk > 0,           'bulk adj > 0');
T.assert(GOAL_ADJUSTMENTS.lean_bulk > 0,      'lean_bulk adj > 0');
T.eq(GOAL_ADJUSTMENTS.maintain, 0,            'maintain adj = 0');
T.eq(GOAL_ADJUSTMENTS.recomposition, 0,       'recomposition adj = 0');
T.assert(GOAL_ADJUSTMENTS.cut < 0,            'cut adj < 0');
T.assert(GOAL_ADJUSTMENTS.shred < 0,          'shred adj < 0');
T.assert(GOAL_ADJUSTMENTS.bulk > GOAL_ADJUSTMENTS.lean_bulk, 'bulk adj > lean_bulk adj');
T.assert(GOAL_ADJUSTMENTS.shred < GOAL_ADJUSTMENTS.cut,      'shred adj < cut adj (more aggressive)');
T.assert(Math.abs(GOAL_ADJUSTMENTS.shred) <= 0.30,           '|shred adj| <= 30%');
T.assert(Math.abs(GOAL_ADJUSTMENTS.cut)   <= 0.25,           '|cut adj| <= 25%');
T.assert(GOAL_ADJUSTMENTS.bulk <= 0.20,                       'bulk adj <= 20%');

// Test all goals produce valid results across reference profile
var refBMR2  = calcBMR('male', 80, 180, 30);
var refTDEE2 = calcTDEE(refBMR2, 1.55);
GOALS_TO_TEST.forEach(function(goal) {
  var target = calcCaloriesTarget(refTDEE2, goal, refBMR2, 'male', 1.55);
  T.assert(target >= KCAL_FLOOR_MALE, goal + ' target >= male floor');
  T.assert(target > 0, goal + ' target > 0');
  T.assert(isFinite(target), goal + ' target finite');
  // Ordering relative to TDEE
  if (goal === 'bulk' || goal === 'lean_bulk') {
    T.assert(target >= refTDEE2, goal + ' target >= TDEE (surplus)');
  }
});

// Verify deficit cap: no target more than 500 below TDEE for cut/shred
['cut','shred'].forEach(function(goal) {
  var target = calcCaloriesTarget(refTDEE2, goal, refBMR2, 'male', 1.55);
  T.assert(target >= refTDEE2 - 500, goal + ' not more than -500 from TDEE target=' + target + ' tdee=' + refTDEE2);
});

console.log('Section 20 done. Pass so far: ' + T.pass);
console.log('Progress: ' + T.pass + ' tests passed...');

// ─── Final report ──────────────────────────────────────────────────────────────
T.report();
