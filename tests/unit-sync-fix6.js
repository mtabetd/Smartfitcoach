// tests/unit-sync-fix6.js
// P2: sessionStorage persistence pour _savePendingDuringSync
// P6: JSONB merge field-level (null protected keys stripped)

'use strict';

var assert = require('assert');
var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('\x1b[32m✓\x1b[0m', name);
    passed++;
  } catch (e) {
    console.error('\x1b[31m✗\x1b[0m', name);
    console.error('  ', e.message);
    failed++;
  }
}

// ─── Mock sessionStorage (Node.js n'a pas de sessionStorage) ──────────────────

var _sessionStore = {};
var sessionStorage = {
  setItem:    function(k, v) { _sessionStore[k] = String(v); },
  getItem:    function(k)    { return _sessionStore.hasOwnProperty(k) ? _sessionStore[k] : null; },
  removeItem: function(k)    { delete _sessionStore[k]; },
  clear:      function()     { _sessionStore = {}; }
};

// ─── P2 : logique sessionStorage pour _savePendingDuringSync ─────────────────

// Reproduit la logique extraite de supabase-client.js
function setPendingFlag(self) {
  self._savePendingDuringSync = true;
  try { sessionStorage.setItem('_sfc_save_pending', '1'); } catch(_) {}
}

function clearPendingFlag(self) {
  self._savePendingDuringSync = false;
  try { sessionStorage.removeItem('_sfc_save_pending'); } catch(_) {}
}

function readPendingFlag(self) {
  var pending = self._savePendingDuringSync;
  try { pending = pending || sessionStorage.getItem('_sfc_save_pending') === '1'; } catch(_) {}
  return pending;
}

test('P2: flag mis en mémoire ET sessionStorage', function() {
  sessionStorage.clear();
  var self = { _savePendingDuringSync: false };
  setPendingFlag(self);
  assert.strictEqual(self._savePendingDuringSync, true, 'memory flag set');
  assert.strictEqual(sessionStorage.getItem('_sfc_save_pending'), '1', 'sessionStorage flag set');
});

test('P2: readPendingFlag lit la mémoire', function() {
  sessionStorage.clear();
  var self = { _savePendingDuringSync: true };
  assert.strictEqual(readPendingFlag(self), true);
});

test('P2: readPendingFlag lit sessionStorage quand mémoire est false (après reload)', function() {
  sessionStorage.clear();
  sessionStorage.setItem('_sfc_save_pending', '1');
  var self = { _savePendingDuringSync: false }; // mémoire réinitialisée (reload)
  assert.strictEqual(readPendingFlag(self), true, 'survives page reload via sessionStorage');
});

test('P2: clearPendingFlag efface mémoire ET sessionStorage', function() {
  sessionStorage.clear();
  var self = { _savePendingDuringSync: true };
  sessionStorage.setItem('_sfc_save_pending', '1');
  clearPendingFlag(self);
  assert.strictEqual(self._savePendingDuringSync, false, 'memory cleared');
  assert.strictEqual(sessionStorage.getItem('_sfc_save_pending'), null, 'sessionStorage cleared');
});

test('P2: pas de fausse alerte quand aucun flag', function() {
  sessionStorage.clear();
  var self = { _savePendingDuringSync: false };
  assert.strictEqual(readPendingFlag(self), false);
});

// ─── P6 : null/empty protected keys stripping ─────────────────────────────────

var _P6_PROTECTED = [
  'sportProgram', 'runningProgram', 'cyclingProgram', 'triathlonProgram',
  'hyroxProgram', 'padelProgram', 'golfProgram', 'yogaWeek', 'calisthenicsWeek',
  'weekPlan', 'favoriteRecipes', 'nutritionLog',
  'muscuSessionLog', 'musculationWeights', 'muscuProgressionHistory',
  'sessionHistory', 'bonusExercises', 'weightHistory', 'crossfit1RM',
  'muscuStrengthProfile', 'weeklyCalendar', 'aiCoachHistory', 'trainingDaysSelected'
];

function buildSafeData(data) {
  var safeData = Object.assign({}, data);
  delete safeData.subscriptionPlan;
  delete safeData.subscriptionEnd;
  delete safeData.firstLoginDate;
  for (var i = 0; i < _P6_PROTECTED.length; i++) {
    var pk = _P6_PROTECTED[i];
    var pv = safeData[pk];
    var isEmpty = pv === null || pv === undefined ||
      (Array.isArray(pv) && pv.length === 0) ||
      (typeof pv === 'object' && !Array.isArray(pv) && Object.keys(pv).length === 0);
    if (isEmpty) delete safeData[pk];
  }
  return safeData;
}

test('P6 scénario multi-device: Device B (sans weekPlan) ne supprime pas weekPlan cloud', function() {
  // Device B: a sportProgram mais pas weekPlan
  var deviceBData = {
    goal: 'perte_de_poids',
    sportProgram: [{ exercises: [] }],
    weekPlan: null  // jamais reçu du cloud
  };
  var safeData = buildSafeData(deviceBData);
  // weekPlan null → doit être ABSENT du payload (DB merge le préservera)
  assert.ok(!safeData.hasOwnProperty('weekPlan'), 'weekPlan null stripped from payload');
  // sportProgram présent → doit être dans le payload
  assert.ok(safeData.hasOwnProperty('sportProgram'), 'sportProgram preserved');
});

test('P6: weekPlan présent et valide → inclus dans le payload', function() {
  var data = { weekPlan: [{ day: 'lundi', meals: ['riz'] }], sportProgram: null };
  var safeData = buildSafeData(data);
  assert.ok(safeData.hasOwnProperty('weekPlan'), 'non-null weekPlan kept');
  // sportProgram null → stripped (DB preserves cloud value)
  assert.ok(!safeData.hasOwnProperty('sportProgram'), 'null sportProgram stripped');
});

test('P6: tableau vide → stripped (ex. sessionHistory=[])', function() {
  var data = { sessionHistory: [], goal: 'prise_de_masse' };
  var safeData = buildSafeData(data);
  assert.ok(!safeData.hasOwnProperty('sessionHistory'), 'empty array stripped');
  assert.strictEqual(safeData.goal, 'prise_de_masse', 'non-protected keys preserved');
});

test('P6: objet vide → stripped', function() {
  var data = { musculationWeights: {}, name: 'Alice' };
  var safeData = buildSafeData(data);
  assert.ok(!safeData.hasOwnProperty('musculationWeights'), 'empty object stripped');
  assert.strictEqual(safeData.name, 'Alice', 'name preserved');
});

test('P6: clés serveur (subscription, firstLoginDate) toujours supprimées', function() {
  var data = {
    subscriptionPlan: 'premium',
    subscriptionEnd: '2027-01-01',
    firstLoginDate: '2026-05-01',
    goal: 'perte_de_poids'
  };
  var safeData = buildSafeData(data);
  assert.ok(!safeData.hasOwnProperty('subscriptionPlan'), 'subscriptionPlan stripped');
  assert.ok(!safeData.hasOwnProperty('subscriptionEnd'), 'subscriptionEnd stripped');
  assert.ok(!safeData.hasOwnProperty('firstLoginDate'), 'firstLoginDate stripped');
  assert.strictEqual(safeData.goal, 'perte_de_poids', 'goal preserved');
});

test('P6 simulation merge JSONB: Device A weekPlan + Device B sportProgram → aucune perte', function() {
  // Simule l'effet de "profiles.data || p_data" en JS
  function jsonbMerge(existing, newData) {
    return Object.assign({}, existing, newData);
  }

  // Device A sauvegarde
  var cloudAfterA = { weekPlan: [{ day: 'lundi' }], sportProgram: null };

  // Device B envoie sportProgram, weekPlan=null (stripped donc absent)
  var deviceBPayload = buildSafeData({
    weekPlan: null,
    sportProgram: [{ exercises: [{ n: 'Squat' }] }],
    goal: 'prise_de_masse'
  });

  // Merge JSONB
  var cloudAfterB = jsonbMerge(cloudAfterA, deviceBPayload);

  // weekPlan de Device A préservé (Device B l'avait strippé)
  assert.ok(Array.isArray(cloudAfterB.weekPlan) && cloudAfterB.weekPlan.length > 0, 'weekPlan preserved from Device A');
  // sportProgram de Device B présent
  assert.ok(Array.isArray(cloudAfterB.sportProgram) && cloudAfterB.sportProgram.length > 0, 'sportProgram from Device B present');
});

// ─── Résumé ────────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────');
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) / ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
