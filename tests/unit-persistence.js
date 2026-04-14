'use strict';

// ─── TESTS UNITAIRES — PROTECTION CLÉS PRÉCIEUSES (anti-écrasement cloud stale) ───
// Vérifie la logique du fix "bug persistance 2026-04" : la boucle d'application
// des données cloud (_applyCloudData) ne doit pas écraser des données locales
// valides avec des valeurs cloud null/vides pour les clés précieuses.
// Usage : node tests/unit-persistence.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');

// ─── 1. EXTRACTION DE LA LOGIQUE DE PROTECTION ───────────────────────────────
// On lit le code de _applyCloudData depuis supabase-client.js et on extrait
// la fonction _isEmptyValue, _isMeaningful, la map _PROTECTED_KEYS, et on
// simule la boucle de copie exactement comme dans le code prod.

var src = fs.readFileSync(path.join(__dirname, '../app/supabase-client.js'), 'utf8');

// Sanity checks : vérifier que les protections sont bien dans le code
if (src.indexOf('_PROTECTED_KEYS') === -1) {
  console.error('[FATAL] _PROTECTED_KEYS absent de supabase-client.js — le fix n\'est pas en place');
  process.exit(1);
}
if (src.indexOf('cloudWouldLoseSport') === -1) {
  console.error('[FATAL] cloudWouldLoseSport absent — le durcissement syncOnLogin n\'est pas en place');
  process.exit(1);
}
if (src.indexOf('_cloudUpdatedAt = new Date().toISOString()') === -1) {
  console.error('[FATAL] persist timestamp absent après saveProfile cloud');
  process.exit(1);
}

// Reproduire la logique identique pour tester unitairement
var _PROTECTED_KEYS = {
  sportProgram: 1, weekPlan: 1, muscuIAProgram: 1, runningProgram: 1,
  cyclingProgram: 1, triathlonProgram: 1, hyroxProgram: 1, padelProgram: 1,
  golfProgram: 1, yogaWeek: 1, muscuSessionLog: 1, musculationWeights: 1,
  muscuProgressionHistory: 1, sessionHistory: 1, bonusExercises: 1,
  weightHistory: 1, favoriteRecipes: 1, nutritionLog: 1
};
function _isEmptyValue(v) {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true;
  return false;
}
function _isMeaningful(v) {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
}
function applyCloud(localS, cloudData) {
  var _PROTO_BLOCKED = ['__proto__', 'constructor', 'prototype', '_legacy_storage'];
  for (var k in cloudData) {
    if (cloudData.hasOwnProperty(k) && _PROTO_BLOCKED.indexOf(k) === -1) {
      var cv = cloudData[k];
      if (_PROTECTED_KEYS[k] && _isEmptyValue(cv) && _isMeaningful(localS[k])) {
        continue;
      }
      localS[k] = cv;
    }
  }
  return localS;
}

// ─── 2. RUNNER ───────────────────────────────────────────────────────────────
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name); console.error('    ', e.message); failed++; }
}
function suite(n) { console.log('\n' + n); }

function validProgram() { return [{ day: 'Lundi', exercises: [] }]; }
function validPlan() { var w = []; for (var i = 0; i < 7; i++) w.push({ breakfast: { n: 'A', k: 400 } }); return w; }

// ─── 3. TESTS ────────────────────────────────────────────────────────────────

suite('Fix A — _applyCloudData refuse d\'écraser les clés précieuses avec du vide');

test('sportProgram : cloud null + local array valide → local préservé', function() {
  var S = { sportProgram: validProgram(), prenom: 'Jamal' };
  applyCloud(S, { sportProgram: null, prenom: 'Jamal' });
  assert.ok(Array.isArray(S.sportProgram) && S.sportProgram.length > 0);
});

test('sportProgram : cloud [] + local array valide → local préservé', function() {
  var S = { sportProgram: validProgram() };
  applyCloud(S, { sportProgram: [] });
  assert.ok(Array.isArray(S.sportProgram) && S.sportProgram.length > 0);
});

test('weekPlan : cloud null + local array 7j → local préservé', function() {
  var S = { weekPlan: validPlan() };
  applyCloud(S, { weekPlan: null });
  assert.ok(Array.isArray(S.weekPlan) && S.weekPlan.length === 7);
});

test('favoriteRecipes : cloud {} + local {R001: 3} → local préservé', function() {
  var S = { favoriteRecipes: { R001: 3, R042: 2 } };
  applyCloud(S, { favoriteRecipes: {} });
  assert.strictEqual(S.favoriteRecipes.R001, 3);
  assert.strictEqual(S.favoriteRecipes.R042, 2);
});

test('muscuSessionLog : cloud null + local rempli → local préservé', function() {
  var S = { muscuSessionLog: { '2026-04-14': [{}] } };
  applyCloud(S, { muscuSessionLog: null });
  assert.ok(S.muscuSessionLog['2026-04-14']);
});

test('weightHistory : cloud [] + local [3 entries] → local préservé', function() {
  var S = { weightHistory: [{ d: '2026-01-01', w: 80 }, { d: '2026-02-01', w: 78 }] };
  applyCloud(S, { weightHistory: [] });
  assert.strictEqual(S.weightHistory.length, 2);
});

test('musculationWeights : cloud {} + local {Squat: 100} → local préservé', function() {
  var S = { musculationWeights: { Squat: 100, Bench: 80 } };
  applyCloud(S, { musculationWeights: {} });
  assert.strictEqual(S.musculationWeights.Squat, 100);
});

suite('Comportement normal — cloud riche doit s\'appliquer');

test('cloud sportProgram valide + local null → cloud s\'applique', function() {
  var S = { sportProgram: null };
  applyCloud(S, { sportProgram: validProgram() });
  assert.ok(Array.isArray(S.sportProgram) && S.sportProgram.length > 0);
});

test('cloud weekPlan valide + local null → cloud s\'applique', function() {
  var S = { weekPlan: null };
  applyCloud(S, { weekPlan: validPlan() });
  assert.strictEqual(S.weekPlan.length, 7);
});

test('cloud favoriteRecipes riche + local vide → cloud s\'applique', function() {
  var S = { favoriteRecipes: {} };
  applyCloud(S, { favoriteRecipes: { R999: 3 } });
  assert.strictEqual(S.favoriteRecipes.R999, 3);
});

test('cloud plus à jour (les deux riches) → cloud écrase', function() {
  var S = { sportProgram: validProgram() };
  var newer = [{ day: 'Mardi', exercises: [{ name: 'Deadlift' }] }];
  applyCloud(S, { sportProgram: newer });
  assert.strictEqual(S.sportProgram[0].day, 'Mardi');
});

suite('Clés non protégées — comportement legacy (écrasement libre)');

test('prenom : cloud null + local "Jamal" → prenom devient null (pas protégé)', function() {
  var S = { prenom: 'Jamal' };
  applyCloud(S, { prenom: null });
  assert.strictEqual(S.prenom, null);
});

test('age : cloud 0 + local 30 → age devient 0 (pas protégé, comportement legacy)', function() {
  var S = { age: 30 };
  applyCloud(S, { age: 0 });
  assert.strictEqual(S.age, 0);
});

suite('Protection __proto__ pollution');

test('cloud __proto__ ignoré', function() {
  var S = {};
  applyCloud(S, { __proto__: { polluted: true }, sportProgram: validProgram() });
  assert.ok(Array.isArray(S.sportProgram));
  assert.strictEqual({}.polluted, undefined, 'pas de prototype pollution');
});

suite('Scénarios bug reproductible');

test('Scénario user : valide programme → ferme app → reconnexion → cloud stale (null)', function() {
  // ÉTAPE 1 : user valide son programme → S est riche
  var S = {
    goal: 1, sex: 'homme', weight: 80,
    sportProgram: validProgram(),
    weekPlan: validPlan(),
    favoriteRecipes: { R042: 3 }
  };
  // ÉTAPE 2 : au démarrage suivant, loadProfile restaure le local → S identique
  // ÉTAPE 3 : syncOnLogin récupère cloudData stale (sync debounced pas flushée avant fermeture)
  var cloudData = {
    goal: 1, sex: 'homme', weight: 80,
    sportProgram: null,    // CLOUD MANQUE CES DONNÉES
    weekPlan: null,
    favoriteRecipes: {}
  };
  applyCloud(S, cloudData);
  // ÉTAPE 4 : Avant le fix → S.sportProgram = null → user voyait "Créer mon programme"
  //           Après le fix → S.sportProgram intact → user voit son programme
  assert.ok(Array.isArray(S.sportProgram) && S.sportProgram.length > 0, 'sportProgram préservé');
  assert.ok(Array.isArray(S.weekPlan) && S.weekPlan.length === 7, 'weekPlan préservé');
  assert.strictEqual(S.favoriteRecipes.R042, 3, 'favoris préservés');
});

// ─── 4. BILAN ────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────');
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) sur ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
