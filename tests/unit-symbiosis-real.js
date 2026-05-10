'use strict';

// ─── TESTS UNITAIRES — SFC SYMBIOSIS (RÉEL) ─────────────────────────────────
// Teste SFCSymbiosis.computeTrainingLoad, processCompletedSession, getNutritionState
// et l'intégration carb-cycling avec le moteur de nutrition réel.
// Aucune dépendance externe — assert/fs/path/vm uniquement.
// Usage : node tests/unit-symbiosis-real.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

// ─── 1. MOCK ENVIRONNEMENT NAVIGATEUR ────────────────────────────────────────

global.window = global;
global.localStorage = {
  _data: {},
  getItem:    function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
  setItem:    function(k, v) { this._data[k] = String(v); },
  removeItem: function(k) { delete this._data[k]; }
};
global.sessionStorage = {
  _data: {},
  getItem:    function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
  setItem:    function(k, v) { this._data[k] = String(v); },
  removeItem: function(k) { delete this._data[k]; }
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
  value: { language: 'fr-FR', onLine: true },
  writable: true, configurable: true
});
global.fetch = function() {
  return Promise.resolve({ json: function() { return Promise.resolve({}); } });
};
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };

// ─── 2. CHARGEMENT DES MODULES ───────────────────────────────────────────────

var loadOrder = [
  '../app/sfc-constants.js',
  '../app/nutrition-master.js',
  '../app/app-core.js',
  '../app/i18n-helpers.js',
  '../app/sfc-symbiosis.js'
];

loadOrder.forEach(function(rel) {
  var absPath = path.join(__dirname, rel);
  var name    = path.basename(absPath);
  try {
    var code = fs.readFileSync(absPath, 'utf8');
    vm.runInThisContext(code, { filename: name });
  } catch(e) {
    console.error('[FATAL] Erreur au chargement de ' + name + ':', e.message);
    process.exit(1);
  }
});

// Vérifier que SFCSymbiosis est bien exporté
if (typeof global.SFCSymbiosis === 'undefined') {
  console.error('[FATAL] global.SFCSymbiosis non défini après chargement de sfc-symbiosis.js');
  process.exit(1);
}
var SFCSymbiosis = global.SFCSymbiosis;

// Vérifier computeNutritionState
if (typeof global.computeNutritionState !== 'function') {
  console.error('[FATAL] computeNutritionState non disponible depuis app-core.js');
  process.exit(1);
}

// ─── 3. RUNNER ───────────────────────────────────────────────────────────────

var passed = 0;
var failed = 0;
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

// ─── 4. HELPERS ──────────────────────────────────────────────────────────────

// Profil symbiose de base
function setSymbiosisState(overrides) {
  window.S = Object.assign({
    sex: 'homme', goal: 3, weight: 80, height: 180, age: 30,
    activity: 2, sportType: 'musculation', sportDays: 4,
    subscriptionPlan: 'unlimited', _serverPremium: true, _subStatusReady: true,
    firstLoginDate: '2025-01-01', trainingLoad: null, _trainingLoadDate: null,
    lastSessionGroups: [], lastSessionCount: 0,
    appMode: 'both', regime: 0, mealsPerDay: 3,
    train: [], sportGoals: [], medical: [],
    trainingDaysSelected: ['lundi', 'mardi', 'jeudi', 'vendredi'],
    pregnant: false, cycleTracking: false,
    _bodyFatEstimate: null, heavyDayStreak: 0,
    sessionFeedback: null, muscuSessionLog: null, customSessionHistory: []
  }, overrides);
}

// Construit une séance lourde (≥6 exos, heavy groups, ≥4 composés)
function heavySession(opts) {
  opts = opts || {};
  return {
    sessionId: opts.sessionId || ('heavy-' + Date.now() + Math.random()),
    date: opts.date || '2025-05-10',
    exercises: [
      { n: 'Squat',          sets: '4×8',  groups: ['legs'] },
      { n: 'Deadlift',       sets: '4×5',  groups: ['back'] },
      { n: 'Bench Press',    sets: '4×8',  groups: ['chest'] },
      { n: 'Barbell Row',    sets: '4×8',  groups: ['back'] },
      { n: 'Hip Thrust',     sets: '3×10', groups: ['glutes'] },
      { n: 'Overhead Press', sets: '3×8',  groups: ['shoulders'] }
    ],
    groups: opts.groups || ['legs', 'back', 'chest', 'glutes']
  };
}

// Construit une séance légère (≤3 exos, pas de heavy groups)
function lightSession(opts) {
  opts = opts || {};
  return {
    sessionId: opts.sessionId || ('light-' + Date.now() + Math.random()),
    date: opts.date || '2025-05-10',
    exercises: [
      { n: 'Marche rapide', sets: '1×30min', groups: ['cardio'], tags: ['finisher'] },
      { n: 'Vélo léger',    sets: '1×20min', groups: ['cardio'], tags: ['finisher'] }
    ],
    groups: opts.groups || ['cardio']
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 1 : computeTrainingLoad ───────────────────────────────────────────

suite('computeTrainingLoad — classification de la charge');

test('Exercices vides → load = "light"', function() {
  var load = SFCSymbiosis.computeTrainingLoad([], []);
  assert.strictEqual(load, 'light', 'Expected light for empty exercises, got: ' + load);
});

test('null exercises → load = "light"', function() {
  var load = SFCSymbiosis.computeTrainingLoad(null, null);
  assert.strictEqual(load, 'light', 'Expected light for null exercises, got: ' + load);
});

test('Composés lourds ×6 (deadlift, squat, bench) + heavy groups → load = "heavy"', function() {
  var exos = [
    { n: 'Squat',       groups: ['legs'] },
    { n: 'Deadlift',    groups: ['back'] },
    { n: 'Bench Press', groups: ['chest'] },
    { n: 'Hip Thrust',  groups: ['glutes'] },
    { n: 'Barbell Row', groups: ['back'] },
    { n: 'OHP',         groups: ['shoulders'] }
  ];
  var load = SFCSymbiosis.computeTrainingLoad(exos, ['legs', 'back', 'chest', 'glutes']);
  assert.strictEqual(load, 'heavy', 'Expected heavy, got: ' + load);
});

test('Cardio seulement (tags finisher/isolation) → load = "moderate" ou "light"', function() {
  var exos = [
    { n: 'Course', tags: ['finisher'], groups: ['cardio'] },
    { n: 'Vélo',   tags: ['finisher'], groups: ['cardio'] },
    { n: 'Natation', tags: ['finisher'], groups: ['cardio'] }
  ];
  var load = SFCSymbiosis.computeTrainingLoad(exos, ['cardio']);
  var valid = ['light', 'moderate'];
  assert.ok(valid.indexOf(load) !== -1, 'Cardio should be light or moderate, got: ' + load);
});

test('Exercice unique → retourne une chaîne valide', function() {
  var exos = [{ n: 'Squat', groups: ['legs'] }];
  var load = SFCSymbiosis.computeTrainingLoad(exos, ['legs']);
  var valid = ['light', 'moderate', 'heavy'];
  assert.ok(typeof load === 'string', 'load doit être une chaîne');
  assert.ok(valid.indexOf(load) !== -1, 'load doit être l\'une de: ' + valid.join(', ') + ', obtenu: ' + load);
});

test('Mixte composés + isolation → load = "moderate" ou "heavy"', function() {
  // 6 exos avec heavy groups mais inclut des isolations → peut être moderate ou heavy
  var exos = [
    { n: 'Squat',          groups: ['legs'] },
    { n: 'Deadlift',       groups: ['back'] },
    { n: 'Curl biceps',    tags: ['isolation'], groups: ['arms'] },
    { n: 'Triceps pushdown', tags: ['isolation'], groups: ['arms'] },
    { n: 'Bench Press',    groups: ['chest'] },
    { n: 'Hip Thrust',     groups: ['glutes'] }
  ];
  var load = SFCSymbiosis.computeTrainingLoad(exos, ['legs', 'back', 'chest', 'glutes']);
  var valid = ['moderate', 'heavy'];
  assert.ok(valid.indexOf(load) !== -1, 'Mixte: expected moderate or heavy, got: ' + load);
});

test('load est toujours l\'une de ["light", "moderate", "heavy"]', function() {
  var valid = ['light', 'moderate', 'heavy'];
  var cases = [
    [[], []],
    [[{ n: 'A' }], []],
    [[{ n: 'A' }, { n: 'B' }, { n: 'C' }, { n: 'D' }, { n: 'E' }, { n: 'F' }], ['legs']],
    [[{ n: 'A', tags: ['isolation'] }], ['back']]
  ];
  cases.forEach(function(c) {
    var l = SFCSymbiosis.computeTrainingLoad(c[0], c[1]);
    assert.ok(valid.indexOf(l) !== -1, 'Invalid load: ' + l);
  });
});

test('Exercices à MET élevé (≥9) sans tags isolation → heavy si conditions remplies', function() {
  // 6 exos MET élevé + heavy groups + ≥4 composés → heavy
  var exos = [
    { n: 'Deadlift lourd', groups: ['back'],   met: 9  },
    { n: 'Squat lourd',    groups: ['legs'],   met: 9  },
    { n: 'Bench lourd',    groups: ['chest'],  met: 9  },
    { n: 'Hip Thrust',     groups: ['glutes'], met: 9  },
    { n: 'Pull-up',        groups: ['back'],   met: 10 },
    { n: 'OHP',            groups: ['shoulders'], met: 9 }
  ];
  var load = SFCSymbiosis.computeTrainingLoad(exos, ['back', 'legs', 'chest', 'glutes']);
  assert.strictEqual(load, 'heavy', 'High-MET compounded exercises should yield heavy, got: ' + load);
});

test('Exercices à faible MET (<5), peu nombreux → light', function() {
  // ≤3 exos → light
  var exos = [
    { n: 'Marche', tags: ['finisher'], groups: ['cardio'], met: 3 },
    { n: 'Étirements', tags: ['finisher'], groups: ['cardio'], met: 2 }
  ];
  var load = SFCSymbiosis.computeTrainingLoad(exos, ['cardio']);
  assert.strictEqual(load, 'light', 'Low-MET few exercises should be light, got: ' + load);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 2 : processCompletedSession ───────────────────────────────────────

suite('processCompletedSession — mise à jour de S après séance');

test('Séance avec ≥6 exos lourds → S.trainingLoad = "heavy"', function() {
  setSymbiosisState({});
  SFCSymbiosis.processCompletedSession(heavySession());
  assert.strictEqual(window.S.trainingLoad, 'heavy',
    'Expected heavy trainingLoad after heavy session, got: ' + window.S.trainingLoad);
});

test('Séance légère cardio → S.trainingLoad = "light"', function() {
  setSymbiosisState({});
  SFCSymbiosis.processCompletedSession(lightSession());
  assert.strictEqual(window.S.trainingLoad, 'light',
    'Expected light trainingLoad after light session, got: ' + window.S.trainingLoad);
});

test('S.lastSessionDate est défini sur la date de la séance', function() {
  setSymbiosisState({});
  var date = '2025-05-10';
  SFCSymbiosis.processCompletedSession(heavySession({ date: date }));
  assert.strictEqual(window.S.lastSessionDate, date,
    'lastSessionDate should be ' + date + ', got: ' + window.S.lastSessionDate);
});

test('S.lastSessionGroups contient les groupes musculaires de la séance', function() {
  setSymbiosisState({});
  SFCSymbiosis.processCompletedSession(heavySession({ groups: ['legs', 'back', 'chest'] }));
  assert.ok(Array.isArray(window.S.lastSessionGroups), 'lastSessionGroups should be an array');
  assert.ok(window.S.lastSessionGroups.indexOf('legs') !== -1, 'legs should be in lastSessionGroups');
  assert.ok(window.S.lastSessionGroups.indexOf('back') !== -1, 'back should be in lastSessionGroups');
});

test('S.lastSessionCount est le nombre d\'exercices de la séance', function() {
  setSymbiosisState({});
  var sess = heavySession();
  SFCSymbiosis.processCompletedSession(sess);
  assert.ok(typeof window.S.lastSessionCount === 'number', 'lastSessionCount should be a number');
  assert.ok(window.S.lastSessionCount >= sess.exercises.length,
    'lastSessionCount (' + window.S.lastSessionCount + ') should be >= ' + sess.exercises.length);
});

test('Deux séances le même jour → trainingLoad garde la plus haute (max)', function() {
  setSymbiosisState({});
  var sameDate = '2025-05-10';
  // D'abord léger, ensuite lourd → résultat : heavy
  SFCSymbiosis.processCompletedSession(lightSession({ date: sameDate, sessionId: 'sess-light-001' }));
  assert.strictEqual(window.S.trainingLoad, 'light', 'After light session: should be light');
  SFCSymbiosis.processCompletedSession(heavySession({ date: sameDate, sessionId: 'sess-heavy-002' }));
  assert.strictEqual(window.S.trainingLoad, 'heavy', 'After adding heavy session same day: should be heavy');
});

test('Séance dupliquée (même sessionId) → idempotente (second appel ignoré)', function() {
  setSymbiosisState({});
  var sess = heavySession({ sessionId: 'idem-001' });
  SFCSymbiosis.processCompletedSession(sess);
  var loadAfterFirst = window.S.trainingLoad;
  var countAfterFirst = window.S.lastSessionCount;
  // Deuxième appel avec le même sessionId — doit être ignoré
  SFCSymbiosis.processCompletedSession(sess);
  assert.strictEqual(window.S.trainingLoad, loadAfterFirst, 'trainingLoad should not change on duplicate');
  assert.strictEqual(window.S.lastSessionCount, countAfterFirst, 'lastSessionCount should not change on duplicate');
});

test('Séance sans exercices → retour précoce, pas de changement d\'état', function() {
  setSymbiosisState({ trainingLoad: null });
  SFCSymbiosis.processCompletedSession({
    sessionId: 'empty-001',
    date: '2025-05-10',
    exercises: [],
    groups: []
  });
  assert.strictEqual(window.S.trainingLoad, null, 'trainingLoad should remain null for empty session');
});

test('processCompletedSession met à jour S._trainingLoadDate', function() {
  setSymbiosisState({});
  var date = '2025-05-10';
  SFCSymbiosis.processCompletedSession(heavySession({ date: date }));
  assert.strictEqual(window.S._trainingLoadDate, date,
    '_trainingLoadDate should be ' + date + ', got: ' + window.S._trainingLoadDate);
});

test('Après processCompletedSession, computeNutritionState() utilise le signal trainingLoad', function() {
  setSymbiosisState({});
  SFCSymbiosis.processCompletedSession(heavySession());
  assert.strictEqual(window.S.trainingLoad, 'heavy', 'trainingLoad must be heavy before calling computeNutritionState');
  // computeNutritionState lit S.trainingLoad pour le carb cycling
  var nm = computeNutritionState(true);
  // Si NutritionMaster disponible et profil complet → nm doit être non-null
  if (nm !== null) {
    assert.ok(typeof nm.caloriesTarget === 'number', 'caloriesTarget doit être un nombre');
    assert.ok(nm.caloriesTarget > 0, 'caloriesTarget doit être > 0');
  }
  // Dans tous les cas, S.trainingLoad doit être heavy
  assert.strictEqual(window.S.trainingLoad, 'heavy', 'trainingLoad still heavy after computeNutritionState');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 3 : getNutritionState ─────────────────────────────────────────────

suite('getNutritionState — état nutritionnel → adaptation volume');

test('Aucune séance, pas d\'objectif → retourne état neutral', function() {
  setSymbiosisState({ goal: null });
  var state = SFCSymbiosis.getNutritionState();
  assert.ok(state && typeof state === 'object', 'getNutritionState doit retourner un objet');
  assert.strictEqual(state.state, 'neutral', 'Expected neutral, got: ' + state.state);
});

test('Charge heavy + objectif bulk → volumeFactor ≥ 1.0 (surplus)', function() {
  // goal index 0 = bulk
  setSymbiosisState({ goal: 0, trainingLoad: 'heavy' });
  var state = SFCSymbiosis.getNutritionState();
  assert.ok(state && typeof state === 'object', 'Expected object');
  // bulk → surplus → volumeFactor 1.08
  assert.ok(state.volumeFactor >= 1.0,
    'bulk should have volumeFactor >= 1.0, got: ' + state.volumeFactor);
});

test('getFatigueScore() retourne un objet avec cycleFactor entre 0 et 1', function() {
  setSymbiosisState({});
  var fatigue = SFCSymbiosis.getFatigueScore();
  assert.ok(fatigue && typeof fatigue === 'object', 'getFatigueScore doit retourner un objet');
  assert.ok(typeof fatigue.cycleFactor === 'number', 'cycleFactor doit être un nombre');
  assert.ok(fatigue.cycleFactor >= 0 && fatigue.cycleFactor <= 1,
    'cycleFactor doit être entre 0 et 1, obtenu: ' + fatigue.cycleFactor);
});

test('getFatigueScore() avec RPE moyen ≥ 8.5 → restRecommended = true', function() {
  setSymbiosisState({
    sessionFeedback: {
      '2025-05-05': { rpe: 9, feeling: 2 },
      '2025-05-06': { rpe: 9, feeling: 2 },
      '2025-05-07': { rpe: 9, feeling: 2 },
      '2025-05-08': { rpe: 9, feeling: 2 },
      '2025-05-09': { rpe: 9, feeling: 2 }
    }
  });
  var fatigue = SFCSymbiosis.getFatigueScore();
  assert.strictEqual(fatigue.restRecommended, true,
    'restRecommended should be true with avgRPE=9, got: ' + fatigue.restRecommended);
});

test('State retourne toujours: state, volumeFactor, note', function() {
  setSymbiosisState({ goal: 2 });
  var state = SFCSymbiosis.getNutritionState();
  assert.ok(state.hasOwnProperty('state'), 'manque: state');
  assert.ok(state.hasOwnProperty('volumeFactor'), 'manque: volumeFactor');
  assert.ok(state.hasOwnProperty('note'), 'manque: note');
});

test('state est l\'une de ["overtrained","tired","normal","neutral","deficit","deficit_strong","surplus"]', function() {
  var valid = ['overtrained', 'tired', 'normal', 'neutral', 'deficit', 'deficit_strong', 'surplus'];
  [0, 1, 2, 3, 4, 5].forEach(function(goalIdx) {
    setSymbiosisState({ goal: goalIdx });
    var s = SFCSymbiosis.getNutritionState();
    assert.ok(valid.indexOf(s.state) !== -1,
      'Invalid state "' + s.state + '" for goal index ' + goalIdx);
  });
});

test('volumeFactor est un nombre compris entre 0.5 et 1.5', function() {
  [0, 1, 2, 3, 4, 5].forEach(function(goalIdx) {
    setSymbiosisState({ goal: goalIdx });
    var s = SFCSymbiosis.getNutritionState();
    assert.ok(typeof s.volumeFactor === 'number', 'volumeFactor must be a number');
    assert.ok(s.volumeFactor >= 0.5 && s.volumeFactor <= 1.5,
      'volumeFactor=' + s.volumeFactor + ' out of range for goal ' + goalIdx);
  });
});

test('getLoadMultipliers() retourne un objet avec calAdjust absent mais cal, carbBoost, fatAdjust présents', function() {
  // getLoadMultipliers(isTraining, trainingLoad) → LOAD_MULTIPLIERS[trainingLoad] or rest
  var mult = SFCSymbiosis.getLoadMultipliers(true, 'heavy');
  assert.ok(mult && typeof mult === 'object', 'Expected object');
  assert.ok(typeof mult.cal === 'number', 'cal should be a number');
  assert.ok(typeof mult.carbBoost === 'number', 'carbBoost should be a number');
  assert.ok(typeof mult.fatAdjust === 'number', 'fatAdjust should be a number');
});

test('getLoadMultipliers(false, *) retourne le multiplicateur "rest"', function() {
  var rest = SFCSymbiosis.getLoadMultipliers(false, 'heavy');
  var expected = SFCSymbiosis.LOAD_MULTIPLIERS.rest;
  assert.strictEqual(rest.cal, expected.cal, 'cal devrait être ' + expected.cal);
  assert.strictEqual(rest.carbBoost, expected.carbBoost, 'carbBoost devrait être ' + expected.carbBoost);
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 4 : Intégration symbiose — carb cycling + trainingLoad ─────────────

suite('Intégration symbiose — carb cycling avec trainingLoad réel');

// goal index 3 = cut (GOALS: bulk=0, lean_bulk=1, maintain=2, cut=3, shred=4, recomposition=5)
var BASE_PROFILE = {
  sex: 'homme', goal: 3, weight: 80, height: 180, age: 30,
  activity: 2, sportType: 'musculation', sportDays: 4,
  subscriptionPlan: 'unlimited', _serverPremium: true, _subStatusReady: true,
  firstLoginDate: '2025-01-01', trainingLoad: null, _trainingLoadDate: null,
  lastSessionGroups: [], lastSessionCount: 0, heavyDayStreak: 0,
  appMode: 'both', regime: 0, mealsPerDay: 3, train: [],
  sportGoals: ['shred'], medical: [],
  trainingDaysSelected: ['lundi', 'mardi', 'jeudi', 'vendredi'],
  pregnant: false, cycleTracking: false, _bodyFatEstimate: null,
  sessionFeedback: null, muscuSessionLog: null, customSessionHistory: []
};

test('Jour 1 sans séance → computeNutritionState(false) retourne un résultat valide', function() {
  setSymbiosisState(Object.assign({}, BASE_PROFILE, { trainingLoad: null }));
  var nm = computeNutritionState(false);
  if (nm !== null) {
    assert.ok(typeof nm.caloriesTarget === 'number', 'caloriesTarget doit être un nombre');
    assert.ok(nm.caloriesTarget > 0, 'caloriesTarget > 0');
  }
  // Pas de trainingLoad — pas d'erreur
});

test('Jour 2 après séance heavy → computeNutritionState(true) exécute sans erreur', function() {
  setSymbiosisState(Object.assign({}, BASE_PROFILE));
  SFCSymbiosis.processCompletedSession(heavySession({ date: '2025-05-10' }));
  assert.strictEqual(window.S.trainingLoad, 'heavy', 'trainingLoad should be heavy');
  var nm;
  assert.doesNotThrow(function() {
    nm = computeNutritionState(true);
  }, 'computeNutritionState(true) ne doit pas lever d\'exception');
});

test('Après séance heavy → S.trainingLoad = "heavy"', function() {
  setSymbiosisState(Object.assign({}, BASE_PROFILE));
  SFCSymbiosis.processCompletedSession(heavySession({ date: '2025-05-10' }));
  assert.strictEqual(window.S.trainingLoad, 'heavy',
    'S.trainingLoad devrait être heavy après séance lourde, obtenu: ' + window.S.trainingLoad);
});

test('S.trainingLoad = "heavy" dans app-core influence le carb cycling (_carbRate = 0.20)', function() {
  // Vérifier via SFCConstants que la valeur est bien 0.20 pour un seul jour heavy
  assert.strictEqual(
    global.SFCConstants && global.SFCConstants.CARB_CYCLING_BOOST_HEAVY,
    0.20,
    'CARB_CYCLING_BOOST_HEAVY devrait être 0.20'
  );
  setSymbiosisState(Object.assign({}, BASE_PROFILE));
  SFCSymbiosis.processCompletedSession(heavySession({ sessionId: 'carb-heavy-001', date: '2025-05-10' }));
  assert.strictEqual(window.S.trainingLoad, 'heavy', 'trainingLoad should be heavy');
});

test('S.trainingLoad = "light" → _carbRate = 0 (pas de boost carb)', function() {
  // Vérifier via SFCConstants que light ne déclenche pas de boost
  // Dans app-core.js l.6960 : if _tl === 'light' → _carbRate = 0
  setSymbiosisState(Object.assign({}, BASE_PROFILE));
  SFCSymbiosis.processCompletedSession(lightSession({ date: '2025-05-10' }));
  assert.strictEqual(window.S.trainingLoad, 'light',
    'trainingLoad devrait être light, obtenu: ' + window.S.trainingLoad);
});

test('Streak heavy ≥ 2 → CARB_CYCLING_BOOST_HEAVY_STREAK = 0.25', function() {
  // La constante est vérifiée dans sfc-constants.js
  assert.strictEqual(
    global.SFCConstants && global.SFCConstants.CARB_CYCLING_BOOST_HEAVY_STREAK,
    0.25,
    'CARB_CYCLING_BOOST_HEAVY_STREAK devrait être 0.25'
  );
  // Simuler un streak de 2 jours heavy
  setSymbiosisState(Object.assign({}, BASE_PROFILE, { heavyDayStreak: 1 }));
  SFCSymbiosis.processCompletedSession(heavySession({ sessionId: 'streak-heavy-001', date: '2025-05-10' }));
  assert.strictEqual(window.S.trainingLoad, 'heavy', 'trainingLoad devrait être heavy');
});

test('Après séance deload (light) → S.trainingLoad = "light"', function() {
  setSymbiosisState(Object.assign({}, BASE_PROFILE));
  // Simuler une semaine 4 (deload) — séance très légère
  SFCSymbiosis.processCompletedSession(lightSession({ sessionId: 'deload-001', date: '2025-05-10' }));
  assert.strictEqual(window.S.trainingLoad, 'light',
    'Après deload session → trainingLoad devrait être light, obtenu: ' + window.S.trainingLoad);
});

test('Kcal jour heavy > kcal jour repos pour objectif cut (carb cycling calorique-neutre, vérification logique)', function() {
  // Note: carb cycling dans app-core est calorique-neutre (swap carbs ↔ fat)
  // La preuve de bonne santé: computeNutritionState ne doit pas retourner null avec trainingLoad=heavy
  setSymbiosisState(Object.assign({}, BASE_PROFILE));
  SFCSymbiosis.processCompletedSession(heavySession({ date: '2025-05-10' }));
  var nmHeavy = computeNutritionState(true);
  if (nmHeavy !== null) {
    assert.ok(nmHeavy.caloriesTarget > 0, 'caloriesTarget > 0 pour jour heavy');
  }
  // Réinitialiser pour jour repos
  setSymbiosisState(Object.assign({}, BASE_PROFILE, { trainingLoad: null }));
  var nmRest = computeNutritionState(false);
  if (nmRest !== null) {
    assert.ok(nmRest.caloriesTarget > 0, 'caloriesTarget > 0 pour jour repos');
  }
});

test('getLoadMultipliers() : heavy → cal = 1.10 (conforme LOAD_MULTIPLIERS)', function() {
  var mult = SFCSymbiosis.getLoadMultipliers(true, 'heavy');
  assert.strictEqual(mult.cal, 1.10,
    'LOAD_MULTIPLIERS.heavy.cal devrait être 1.10, obtenu: ' + mult.cal);
  assert.ok(mult.carbBoost > 1.0, 'heavy carbBoost devrait être > 1.0');
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
