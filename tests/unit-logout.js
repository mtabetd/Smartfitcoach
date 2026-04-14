'use strict';

// ─── TESTS UNITAIRES — LOGOUT NE DOIT PAS DÉTRUIRE LE PROFIL ────────────────
// Vérifie que auth.js logout() :
//   1. NE SUPPRIME PLUS les clés mtd_* du localStorage (fix bug 2026-04)
//   2. SUPPRIME UNIQUEMENT les tokens Supabase sb-*
//   3. Appelle SupaSync.saveProfile() pour flusher avant (fire-and-forget)
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var src = fs.readFileSync(path.join(__dirname, '../app/auth.js'), 'utf8');

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name); console.error('    ', e.message); failed++; }
}
function suite(n) { console.log('\n' + n); }

// ─── 1. FIX VERIFICATION ─────────────────────────────────────────────────────
suite('Fix logout 2026-04 — NE DÉTRUIT PLUS le profil local');

test('auth.js ne contient plus la ligne destructive "mtd_*" dans logout', function() {
  // La ligne problématique était : _k.indexOf('mtd_') === 0 && (_uid ? ...)
  // Elle doit être SUPPRIMÉE
  var destructive = /_k\.indexOf\('mtd_'\)\s*===\s*0\s*&&\s*\(_uid/;
  assert.ok(!destructive.test(src), 'Ligne destructive mtd_* détectée dans auth.js — fix non appliqué');
});

test('auth.js ne supprime que les tokens sb-*', function() {
  // On cherche la boucle qui ne contient QUE sb-*
  var sbOnly = src.indexOf("_k.indexOf('sb-') === 0");
  assert.ok(sbOnly > 0, 'Clean-up sb-* absent');
});

test('auth.js appelle SupaSync.saveProfile() avec attente avant cleanup (FIX V6)', function() {
  // Depuis le FIX V6 2026-04 : logout() est devenu async — saveProfile retourne une
  // promesse qu'on attend (ou timeout 5s) AVANT _performLogoutCleanup.
  var flushPattern = /FLUSH BLOQUANT|FIX V6 2026-04/;
  assert.ok(flushPattern.test(src), 'FIX V6 absent — flush non-bloquant détecté');
  // Vérifier la présence du helper _performLogoutCleanup (split du body)
  assert.ok(src.indexOf('_performLogoutCleanup') > 0, 'Helper _performLogoutCleanup absent');
  // Vérifier la présence du timeout 5s
  assert.ok(src.indexOf('setTimeout(_runCleanup, 5000)') > 0, 'Timeout 5s absent');
});

test('Commentaire "FIX BUG PERSISTANCE 2026-04" présent', function() {
  assert.ok(src.indexOf('FIX BUG PERSISTANCE 2026-04') !== -1, 'Commentaire de traçabilité absent');
});

// ─── 2. _PROTECTED_KEYS VERIFICATION ─────────────────────────────────────────
suite('_PROTECTED_KEYS — toutes les clés critiques protégées');

var srcSupa = fs.readFileSync(path.join(__dirname, '../app/supabase-client.js'), 'utf8');

var REQUIRED_PROTECTED = [
  'sportProgram', 'weekPlan', 'favoriteRecipes', 'nutritionLog',
  'mealTimes', 'mealsLogged', 'shopChecked',
  'muscuSessionLog', 'musculationWeights', 'muscuProgressionHistory',
  'sessionHistory', 'bonusExercises', 'sportFocus',
  'weightHistory',
  'crossfit1RM', 'muscuStrengthProfile',
  'hyroxBenchmarks', 'crossfitBenchmarks',
  'cfProgress',
  'weeklyCalendar',
  'aiCoachHistory', 'trainingDaysSelected',
  'installations', 'sportHobbies',
  'runningProgram', 'cyclingProgram', 'triathlonProgram',
  'hyroxProgram', 'padelProgram', 'golfProgram',
  'yogaWeek', 'calisthenicsWeek'
];

REQUIRED_PROTECTED.forEach(function(key) {
  test('_PROTECTED_KEYS inclut "' + key + '"', function() {
    // regex stricte : doit matcher "key: 1" dans la map
    var re = new RegExp('\\b' + key + ':\\s*1');
    assert.ok(re.test(srcSupa), 'Clé "' + key + '" absente de _PROTECTED_KEYS');
  });
});

// ─── 3. BILAN ────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────');
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) sur ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
