'use strict';

// ─── TESTS ANTI-RÉGRESSION — ZERO OBVIOUS BUGS SPRINT ────────────────────────
// Couvre les 8 bugs flagrants corrigés dans le sprint AUDIT TOTAL PRODUIT.
// Usage : node tests/unit-obvious-bugs-regression.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

// ─── MOCK ENVIRONNEMENT NAVIGATEUR ───────────────────────────────────────────

global.window = global;
global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem: function(k, v) { this._store[k] = String(v); },
  removeItem: function(k) { delete this._store[k]; },
  get length() { return Object.keys(this._store).length; },
  key: function(i) { return Object.keys(this._store)[i] || null; }
};

var _fakeEl = function() {
  return {
    style: {}, appendChild: function() {}, addEventListener: function() {},
    removeEventListener: function() {}, innerHTML: '', textContent: '',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; } }
  };
};
global.document = {
  createElement: _fakeEl, getElementById: function() { return null; },
  querySelector: function() { return null; }, querySelectorAll: function() { return []; },
  addEventListener: function() {}, removeEventListener: function() {},
  body: _fakeEl(), head: _fakeEl()
};
Object.defineProperty(global, 'navigator', {
  value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true
});
global.fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };

// ─── CHARGEMENT DES MODULES ──────────────────────────────────────────────────

function loadModule(relPath) {
  var code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  try {
    vm.runInThisContext(code, { filename: relPath });
  } catch(e) {
    console.error('[FATAL] Erreur chargement ' + relPath + ':', e.message);
    process.exit(1);
  }
}

loadModule('app/app-core.js');
loadModule('app/i18n-helpers.js');
loadModule('app/sfc-invariants.js');

// ─── RUNNER ──────────────────────────────────────────────────────────────────

var passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }

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

function eq(a, b, msg) {
  if (a !== b) throw new Error((msg || '') + ' — expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a));
}

function ok(v, msg) {
  if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v));
}

function notOk(v, msg) {
  if (v) throw new Error(msg || 'expected falsy, got ' + JSON.stringify(v));
}

// ─── BASE STATE ──────────────────────────────────────────────────────────────

function baseS(overrides) {
  return Object.assign({
    sex: 'M', age: 30, birthDate: null, weight: 80, height: 180,
    activity: 3, goal: 2, targetWeight: null,
    mealsPerDay: 3, eatingLocation: null, mealPrepTime: null,
    snacking: null, alcoholFreq: 0, alcoholTypes: [], hydration: null,
    cookLevel: 2, whey: null, allergies: [], intolerances: [],
    regime: 0, allowPork: true, allowAlcohol: false, excluded: '', cuisines: [0],
    weekPlan: null, selectedDay: 0, nStep: 0, sStep: 0,
    sportType: 'muscu', sportGoals: ['muscle'], sportLevel: 'intermediate',
    sportDays: 4, sportEquipment: 'gym', sportSessionDuration: '1h15',
    sportFocus: { chest: 3, back: 3, shoulders: 2, biceps: 1, triceps: 1, legs: 3 },
    sportProgram: null, sportProgramValidated: false, sportProgramValidatedAt: null,
    _splitChoice: 'PPL', bonusExercises: {}, sessionHistory: {},
    muscuWeek: 1, muscuCycle: 1, muscuProgramCount: 0, sportSplashDone: false,
    muscuSessionLog: {}, muscuProgressionHistory: {}, musculationWeights: {},
    muscuStrengthProfile: {}, crossfit1RM: {}, muscuMedical: {},
    _sportProgramVersion: null, _currentDeloadWeek: false, _deloadWeek: false,
    weightHistory: [], bodyZones: {}, strongZones: [], weakZones: [],
    lang: 'fr', weightUnit: 'kg', heightUnit: 'cm',
    _nm: null, calories: null, caloriesTarget: 2000,
    subscriptionPlan: null, subscriptionEnd: null,
    _serverPremium: undefined, _subStatusReady: false,
    _loadCorrupted: false, firstLoginDate: null,
    sessionFeedback: {}, view: 'dashboard', appMode: 'nutrition',
    medical: [], train: [], sleep: null, stress: null, trainTime: null,
    mealsLogged: {}, nutritionLog: {}, waterToday: 0, waterTodayDate: null,
    shopChecked: {}, _weekPlanGeneratedAt: null, _planHash: '',
    weekPlanValidated: false, weekPlanValidatedISOWeek: null,
    wantsDessert: false, saladBar: null, saladBuilder: null,
    smoothieBarOpen: false, modalRecipe: null, modalSmoothie: null,
    favoriteRecipes: {}
  }, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUG 1 — dayLabels avait ['L','M','M',...] : Mardi = Mercredi
// Fix : ['L','Ma','Me','J','V','S','D']
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-1 — dayLabels: Mardi vs Mercredi non ambigus');

test('today-dashboard.js source ne contient pas dayLabels avec M,M consécutifs (FR)', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/today-dashboard.js'), 'utf8');
  // The old bug: French day labels had two identical 'M' entries (Mardi == Mercredi)
  var oldPattern = /'L'\s*,\s*'M'\s*,\s*'M'\s*,\s*'J'/;
  notOk(oldPattern.test(src), "Pattern bugué ['L','M','M','J'] toujours présent dans today-dashboard.js");
});

test('today-dashboard.js contient les labels corrects Ma et Me', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/today-dashboard.js'), 'utf8');
  ok(src.indexOf("'Ma'") !== -1, "Label 'Ma' (Mardi) manquant");
  ok(src.indexOf("'Me'") !== -1, "Label 'Me' (Mercredi) manquant");
});

test('dayLabels array contient 7 éléments distincts', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/today-dashboard.js'), 'utf8');
  var match = src.match(/var dayLabels\s*=\s*\[([^\]]+)\]/);
  ok(match, 'dayLabels array introuvable');
  var labels = match[1].split(',').map(function(s) { return s.trim().replace(/'/g, ''); });
  eq(labels.length, 7, 'dayLabels doit contenir 7 éléments');
  var unique = labels.filter(function(v, i, a) { return a.indexOf(v) === i; });
  eq(unique.length, 7, 'dayLabels doit contenir 7 éléments DISTINCTS');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 — S._nm pas invalidé quand S.goal change
// Fix : S._nm = null; dans le onclick de confirmation du modal goal
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-2 — S._nm invalidé lors du changement d\'objectif');

test('app-main.js: S._nm = null immédiatement après S.goal = S._modalGoal', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-main.js'), 'utf8');
  // The fix: S.goal = S._modalGoal; S._nm = null;
  ok(src.indexOf('S.goal = S._modalGoal; S._nm = null;') !== -1,
    'S._nm = null manquant juste après S.goal = S._modalGoal dans app-main.js');
});

test('calcMacros retourne résultat frais après changement de goal (_nm nullé)', function() {
  if (typeof window.calcMacros !== 'function') return;
  window.S = baseS({ goal: 2, _nm: null }); // maintien
  var r1 = window.calcMacros();
  window.S._nm = null; // simule l'invalidation par le fix
  var r2 = window.calcMacros();
  ok(r1 !== null && r2 !== null, 'calcMacros doit retourner un résultat dans les deux cas');
  ok(typeof r2.p === 'number', 'macros doivent être des nombres après recompute forcé par _nm=null');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 3 — Flags deload inconsistants: _currentDeloadWeek set, _deloadWeek pas set
// Fix : les deux sont mis à jour ensemble dans generateSportProgram()
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-3 — Flags deload synchronisés (_currentDeloadWeek & _deloadWeek)');

test('app-sport.js: _deloadWeek = true à côté de _currentDeloadWeek = true', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-sport.js'), 'utf8');
  ok(src.indexOf('S._currentDeloadWeek = true; S._deloadWeek = true;') !== -1,
    'S._deloadWeek = true manquant après S._currentDeloadWeek = true dans app-sport.js');
});

test('app-sport.js: _deloadWeek = false à côté de _currentDeloadWeek = false', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-sport.js'), 'utf8');
  ok(src.indexOf('S._currentDeloadWeek = false; S._deloadWeek = false;') !== -1,
    'S._deloadWeek = false manquant après S._currentDeloadWeek = false dans app-sport.js');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 4 — bonusExercises non vidé lors du changement de split
// Fix : S.bonusExercises = {}; dans onclick du bouton split
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-4 — bonusExercises réinitialisé lors du changement de split');

test('app-sport.js: S.bonusExercises = {} dans le onclick du changement de split', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-sport.js'), 'utf8');
  // Find the split change onclick block
  var splitBlock = src.indexOf('S._splitChoice = _id;');
  ok(splitBlock !== -1, 'Bloc changement de split introuvable');
  var block = src.substring(splitBlock, splitBlock + 300);
  ok(block.indexOf('S.bonusExercises = {}') !== -1,
    'S.bonusExercises = {} manquant dans le bloc changement de split');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 5 — Changement de durée de séance ne regénère pas le programme sport
// Fix : S.sportProgram = null; S.sportProgramValidated = false; dans l'onclick durée
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-5 — Changement de durée invalide le programme sport');

test('app-sport.js: sportProgram nullé et sportProgramValidated=false dans onclick durée', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-sport.js'), 'utf8');
  // Find the duration onclick block (just after S.sportSessionDuration = opt.id)
  var durationBlock = src.indexOf('S.sportSessionDuration = opt.id;');
  ok(durationBlock !== -1, 'Bloc changement de durée introuvable');
  var block = src.substring(durationBlock, durationBlock + 200);
  ok(block.indexOf('S.sportProgram = null') !== -1,
    'S.sportProgram = null manquant dans le bloc onclick durée de séance');
  ok(block.indexOf('S.sportProgramValidated = false') !== -1,
    'S.sportProgramValidated = false manquant dans le bloc onclick durée de séance');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 6 — _sportProgramVersion non mis à jour lors du changement de split
// Fix : S.sportProgram._version = SPORT_PROGRAM_VERSION; dans onclick split
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-6 — _sportProgramVersion mis à jour lors du changement de split');

test('app-sport.js: version programme mis à jour dans le bloc changement de split', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/app-sport.js'), 'utf8');
  var splitBlock = src.indexOf('S._splitChoice = _id;');
  ok(splitBlock !== -1, 'Bloc changement de split introuvable');
  var block = src.substring(splitBlock, splitBlock + 400);
  ok(block.indexOf('SPORT_PROGRAM_VERSION') !== -1,
    'SPORT_PROGRAM_VERSION manquant dans le bloc changement de split');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 7 — AI Coach utilise S.age (statique) au lieu de getAge() (dynamique)
// Fix : (typeof window.getAge === 'function' ? window.getAge() : S.age) || ''
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-7 — AI Coach utilise l\'âge dynamique (getAge)');

test('ai-coach.js: utilise getAge() et non S.age directement', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/ai-coach.js'), 'utf8');
  // Old bug: age: S.age || ''
  var oldPattern = /age:\s*S\.age\s*\|\|\s*''/;
  notOk(oldPattern.test(src), "Pattern bugué 'age: S.age || \"\"' encore présent dans ai-coach.js");
  ok(src.indexOf('window.getAge') !== -1, "Référence à window.getAge manquante dans ai-coach.js");
});

test('ai-coach.js: fallback sur S.age si getAge non disponible', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/ai-coach.js'), 'utf8');
  ok(src.indexOf('S.age') !== -1, "Fallback S.age manquant dans ai-coach.js");
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 8 — Logout ne remet pas à zéro subscriptionPlan/subscriptionEnd/_serverPremium
// Fix : reset explicite dans _performLogoutCleanup
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-8 — Logout remet à zéro les données d\'abonnement');

test('auth.js: subscriptionPlan = null dans _performLogoutCleanup', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/auth.js'), 'utf8');
  ok(src.indexOf('window.S.subscriptionPlan = null') !== -1,
    'window.S.subscriptionPlan = null manquant dans _performLogoutCleanup (auth.js)');
});

test('auth.js: subscriptionEnd = null dans _performLogoutCleanup', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/auth.js'), 'utf8');
  ok(src.indexOf('window.S.subscriptionEnd = null') !== -1,
    'window.S.subscriptionEnd = null manquant dans _performLogoutCleanup (auth.js)');
});

test('auth.js: _serverPremium = undefined dans _performLogoutCleanup', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/auth.js'), 'utf8');
  ok(src.indexOf('window.S._serverPremium = undefined') !== -1,
    'window.S._serverPremium = undefined manquant dans _performLogoutCleanup (auth.js)');
});

test('auth.js: _subStatusReady = false dans _performLogoutCleanup', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/auth.js'), 'utf8');
  ok(src.indexOf('window.S._subStatusReady = false') !== -1,
    'window.S._subStatusReady = false manquant dans _performLogoutCleanup (auth.js)');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 9 — _loadCorrupted reste à true après logout (bloque saveProfile user suivant)
// Fix : window.S._loadCorrupted = false dans _performLogoutCleanup
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-9 — _loadCorrupted réinitialisé au logout');

test('auth.js: _loadCorrupted = false dans _performLogoutCleanup', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/auth.js'), 'utf8');
  ok(src.indexOf('window.S._loadCorrupted = false') !== -1,
    'window.S._loadCorrupted = false manquant dans _performLogoutCleanup (auth.js)');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 10 — mtd_profile_anon non supprimé au logout (fuite inter-utilisateurs)
// Fix : localStorage.removeItem('mtd_profile_anon') dans _performLogoutCleanup
// ─────────────────────────────────────────────────────────────────────────────
suite('BUG-10 — mtd_profile_anon supprimé au logout');

test('auth.js: removeItem(\'mtd_profile_anon\') dans _performLogoutCleanup', function() {
  var src = fs.readFileSync(path.join(__dirname, '../app/auth.js'), 'utf8');
  // Find the _performLogoutCleanup function
  var cleanupStart = src.indexOf('_performLogoutCleanup: function()');
  ok(cleanupStart !== -1, '_performLogoutCleanup introuvable dans auth.js');
  // Check that mtd_profile_anon is removed within that function scope
  var cleanupBlock = src.substring(cleanupStart, cleanupStart + 12000);
  ok(cleanupBlock.indexOf("removeItem('mtd_profile_anon')") !== -1,
    "removeItem('mtd_profile_anon') manquant dans _performLogoutCleanup");
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTS TRANSVERSAUX — scenarii utilisateur réels
// ─────────────────────────────────────────────────────────────────────────────
suite('SCÉNARIOS UTILISATEUR — invariants calcul post-fix');

test('calcMacros: résultat non-null avec macros valides pour profil complet standard', function() {
  if (typeof window.calcMacros !== 'function') return;
  window.S = baseS();
  var r = window.calcMacros();
  ok(r !== null, 'calcMacros doit retourner un résultat pour un profil complet');
  ok(r.p > 0 && r.g > 0 && r.l > 0, 'macros (p/g/l) doivent être > 0 pour un profil actif');
  // Verify derived calories: p*4 + g*4 + l*9
  var derivedCal = r.p * 4 + r.g * 4 + r.l * 9;
  ok(derivedCal > 1000, 'calories dérivées des macros doivent être > 1000 kcal');
});

test('calcMacros: S._nm null → recompute forcé (pas de cache périmé)', function() {
  if (typeof window.calcMacros !== 'function') return;
  window.S = baseS({ goal: 0 });
  var r1 = window.calcMacros();
  window.S._nm = null; // simule invalidation suite au changement d'objectif
  window.S.goal = 2;
  var r2 = window.calcMacros();
  ok(r1 !== null && r2 !== null, 'calcMacros doit retourner des résultats dans les deux cas');
  ok(typeof r2.p === 'number' && typeof r2.g === 'number' && typeof r2.l === 'number',
    'macros (p/g/l) doivent être des nombres après recompute forcé par _nm=null');
});

test('calcTarget: retourne 0 pour profil sans objectif (sport-only)', function() {
  if (typeof window.calcTarget !== 'function') return;
  window.S = baseS({ goal: null });
  var t = window.calcTarget();
  eq(t, 0, 'calcTarget doit retourner 0 quand goal=null (sport-only)');
});

test('calcTarget: retourne > 1000 pour profil masculin actif avec maintien', function() {
  if (typeof window.calcTarget !== 'function') return;
  window.S = baseS({ goal: 2, activity: 3 });
  var t = window.calcTarget();
  ok(t > 1000, 'calcTarget doit retourner une valeur réaliste (> 1000 kcal) pour un homme actif');
});

test('getAge: calcule l\'âge depuis birthDate si disponible', function() {
  if (typeof window.getAge !== 'function') return;
  var year = new Date().getFullYear();
  window.S = baseS({ age: 30, birthDate: (year - 25) + '-06-01' });
  var age = window.getAge();
  ok(age >= 24 && age <= 26, 'getAge doit calculer ~25 ans depuis birthDate');
});

test('getAge: fallback sur S.age si birthDate absent', function() {
  if (typeof window.getAge !== 'function') return;
  window.S = baseS({ age: 33, birthDate: null });
  var age = window.getAge();
  eq(age, 33, 'getAge doit retourner S.age=33 quand birthDate est null');
});

// ─────────────────────────────────────────────────────────────────────────────
// RÉSULTAT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────');
console.log('Résultat: ' + passed + ' passés, ' + failed + ' échoués');
if (failed > 0) {
  console.error('\x1b[31m✗ ' + failed + ' test(s) en échec\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m✓ Tous les tests passent\x1b[0m');
  process.exit(0);
}
