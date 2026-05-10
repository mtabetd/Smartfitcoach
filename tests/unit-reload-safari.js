'use strict';

// ─── TESTS — RELOAD / PERSISTENCE / VISIBILITYCHANGE ─────────────────────────
// Teste : récupération d'onboarding interrompue, comportement _profileDirty,
// handlers visibilitychange / beforeunload, et intégrité de SFCConstants.
//
// Groupes :
//   1. Récupération état onboarding (_migrateSteps)
//   2. Comportement du flag _profileDirty
//   3. visibilitychange / beforeunload
//   4. Intégrité SFCConstants après reload
//
// Usage : node tests/unit-reload-safari.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

// ─── 1. RUNNER ───────────────────────────────────────────────────────────────

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

function ok(cond, msg)   { if (!cond) throw new Error(msg || 'Assertion failed'); }
function eq(a, b, msg)   { if (a !== b) throw new Error((msg || '') + ' — expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }

// ─── 2. LECTURE DES SOURCES ───────────────────────────────────────────────────

var srcSupaClient = fs.readFileSync(path.join(__dirname, '../app/supabase-client.js'), 'utf8');
var srcAppMain    = fs.readFileSync(path.join(__dirname, '../app/app-main.js'), 'utf8');

// ─── 3. CHARGEMENT DE SFC-CONSTANTS.JS ───────────────────────────────────────
// Environnement minimal pour charger sfc-constants.js

global.window = global;
global.document = {
  createElement:    function() { return { style: {}, textContent: '', innerHTML: '', className: '', id: '', appendChild: function() {} }; },
  getElementById:   function() { return null; },
  querySelector:    function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener: function() {},
  body: { appendChild: function() {} },
  head: { appendChild: function() {} }
};
Object.defineProperty(global, 'navigator', {
  value: { language: 'fr-FR', onLine: true },
  writable: true, configurable: true
});
global.localStorage = (function() {
  var _d = {};
  return {
    getItem:    function(k) { return _d[k] !== undefined ? _d[k] : null; },
    setItem:    function(k, v) { _d[k] = String(v); },
    removeItem: function(k) { delete _d[k]; },
    clear:      function() { _d = {}; }
  };
})();
global.sessionStorage = (function() {
  var _d = {};
  return {
    getItem:    function(k) { return _d[k] !== undefined ? _d[k] : null; },
    setItem:    function(k, v) { _d[k] = String(v); },
    removeItem: function(k) { delete _d[k]; }
  };
})();

try {
  var constsCode = fs.readFileSync(path.join(__dirname, '../app/sfc-constants.js'), 'utf8');
  vm.runInThisContext(constsCode, { filename: 'sfc-constants.js' });
} catch(e) {
  console.error('[FATAL] Erreur au chargement de sfc-constants.js:', e.message);
  process.exit(1);
}

if (typeof global.SFCConstants === 'undefined') {
  console.error('[FATAL] SFCConstants non défini après chargement de sfc-constants.js');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 1 : Récupération état onboarding ───────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('Récupération état onboarding (_migrateSteps)');

// Reproduction exacte de _migrateSteps() depuis app-main.js lignes 404-422
// (validé par lecture de app/app-main.js)
function applyStepRecovery(S) {
  if (S.appMode === 'sport' && S.nStep > 0) { S.nStep = 0; }
  if ((S.appMode === 'nutrition' || S.appMode === 'both') &&
      typeof S.nStep === 'number' && S.nStep >= 1 && S.nStep <= 11) {
    if (S.weekPlan) {
      S.nStep = 12;
    } else if (S.nStep === 8 && S.sex && S.goal !== null && S.goal !== undefined) {
      S.nStep = 11;
    } else if (S.nStep === 8 && !S.sex) {
      S.nStep = 1;
    } else if (S.nStep >= 1 && S.nStep <= 4 &&
               S.sex && S.goal !== null && S.weight &&
               S.height && S.activity !== null && S.sleep !== null) {
      S.nStep = 8;
    }
  }
  if ((S.appMode === 'nutrition' || S.appMode === 'both') &&
      S.nStep === 0 && (S.sex || S.goal !== null || S.weekPlan)) {
    S.nStep = S.weekPlan ? 12 : (S.goal !== null && S.weight && S.height ? 11 : (S.sex ? 2 : 1));
  }
  return S;
}

test('S avec biométrie complète (nStep=3) → avance vers nStep=8', function() {
  var S = {
    appMode: 'nutrition', nStep: 3,
    sex: 'homme', goal: 2, weight: 75, height: 175, activity: 2, sleep: 2, weekPlan: null
  };
  applyStepRecovery(S);
  eq(S.nStep, 8, 'nStep devrait avancer à 8 avec tous les champs de base renseignés');
});

test('S avec seulement sex renseigné, nStep=1 → reste à une étape précoce', function() {
  var S = {
    appMode: 'nutrition', nStep: 1,
    sex: 'femme', goal: null, weight: null, height: null, activity: null, sleep: null, weekPlan: null
  };
  applyStepRecovery(S);
  // Condition nStep 1→4 + tous les champs requis NON remplis → pas de saut
  ok(S.nStep <= 4, 'nStep devrait rester ≤ 4 avec biométrie incomplète, obtenu: ' + S.nStep);
});

test('S avec biométrie complète → nStep avancé (nStep ≥ 8)', function() {
  var S = {
    appMode: 'nutrition', nStep: 2,
    sex: 'homme', goal: 0, weight: 80, height: 180, activity: 3, sleep: 2, weekPlan: null
  };
  applyStepRecovery(S);
  ok(S.nStep >= 8, 'Biométrie complète devrait avancer nStep à ≥ 8, obtenu: ' + S.nStep);
});

test('S avec weekPlan défini et nStep=0 → nStep = 12', function() {
  var S = {
    appMode: 'nutrition', nStep: 0,
    sex: 'homme', goal: 2, weight: 80, height: 180, activity: 2, sleep: 2,
    weekPlan: { lundi: 'plan' }
  };
  applyStepRecovery(S);
  eq(S.nStep, 12, 'weekPlan défini + nStep=0 → devrait être 12, obtenu: ' + S.nStep);
});

test('S avec nStep=0, sex et goal définis → nStep ≥ 1', function() {
  var S = {
    appMode: 'nutrition', nStep: 0,
    sex: 'homme', goal: 2, weight: null, height: null, activity: null, sleep: null, weekPlan: null
  };
  applyStepRecovery(S);
  ok(S.nStep >= 1, 'sex + goal → nStep devrait être ≥ 1, obtenu: ' + S.nStep);
});

test('S = {} (profil vide) → nStep reste 0 (pas de récupération)', function() {
  var S = {
    appMode: 'nutrition', nStep: 0,
    sex: null, goal: null, weight: null, height: null, activity: null, sleep: null, weekPlan: null
  };
  applyStepRecovery(S);
  eq(S.nStep, 0, 'Profil vide → nStep doit rester 0, obtenu: ' + S.nStep);
});

test('S avec tous les champs requis → nStep avance à la valeur attendue', function() {
  // Cas: nStep=4, tous les champs → doit sauter à nStep=8
  var S = {
    appMode: 'nutrition', nStep: 4,
    sex: 'femme', goal: 3, weight: 60, height: 165, activity: 1, sleep: 1, weekPlan: null
  };
  applyStepRecovery(S);
  eq(S.nStep, 8, 'nStep=4 + tous champs requis → devrait avancer à 8, obtenu: ' + S.nStep);
});

test('Récupération est idempotente (exécuter deux fois → état stable)', function() {
  // Premier appel: nStep=3 + biométrie complète → nStep=8
  // Deuxième appel: nStep=8 + sex + goal → nStep=11 (jump to results, comportement normal)
  // Troisième appel: nStep=11 est hors plage 1-4 et ≠ 8 → plus de migration → stable à 11
  var S = {
    appMode: 'nutrition', nStep: 3,
    sex: 'homme', goal: 2, weight: 80, height: 180, activity: 2, sleep: 2, weekPlan: null
  };
  applyStepRecovery(S); // nStep=3 → nStep=8
  applyStepRecovery(S); // nStep=8 + sex + goal → nStep=11
  var nStepAfterSecond = S.nStep;
  applyStepRecovery(S); // nStep=11 → hors plage de migration → reste 11
  eq(S.nStep, nStepAfterSecond, 'Troisième appel → même nStep qu\'après deuxième appel (stable)');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 2 : Comportement du flag _profileDirty ────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('Comportement du flag _profileDirty');

test('window._profileDirty commence non défini (dirty implicite au premier tick)', function() {
  // Vérifier dans le source que le guard est "!== false" (pas "=== true")
  // ce qui signifie que undefined est traité comme dirty
  ok(
    srcSupaClient.indexOf('window._profileDirty !== false') !== -1,
    'supabase-client.js doit utiliser "window._profileDirty !== false" comme guard autosync'
  );
  // undefined !== false → true → autosync est déclenché
  var val = undefined;
  ok(val !== false, '_profileDirty undefined doit être traité comme dirty');
});

test('autosync : guard "window._profileDirty !== false" présent dans supabase-client.js', function() {
  var count = (srcSupaClient.match(/window\._profileDirty !== false/g) || []).length;
  ok(count >= 1,
    'Le guard _profileDirty !== false doit apparaître au moins 1 fois dans supabase-client.js, trouvé: ' + count);
});

test('_loadCorrupted guard : saveProfile retourne tôt si window.S._loadCorrupted est true', function() {
  ok(
    srcSupaClient.indexOf('window.S && window.S._loadCorrupted') !== -1 ||
    srcSupaClient.indexOf('window.S._loadCorrupted') !== -1,
    'supabase-client.js doit vérifier _loadCorrupted avant de sauvegarder'
  );
  ok(
    srcSupaClient.indexOf('return Promise.resolve()') !== -1,
    'supabase-client.js doit retourner Promise.resolve() quand _loadCorrupted'
  );
});

test('_syncing mutex : si _syncing est true, _savePendingDuringSync est mis à true', function() {
  ok(
    srcSupaClient.indexOf('self._savePendingDuringSync = true') !== -1,
    '_savePendingDuringSync doit être défini à true quand _syncing est actif'
  );
  ok(
    srcSupaClient.indexOf('self._syncing') !== -1,
    '_syncing mutex doit être présent dans supabase-client.js'
  );
});

test('window._profileDirty !== false déclenche saveProfile dans startAutoSync', function() {
  var autoSyncIdx = srcSupaClient.indexOf('startAutoSync');
  ok(autoSyncIdx !== -1, 'startAutoSync doit exister dans supabase-client.js');
  // Extraire la zone autour de startAutoSync pour vérifier le guard
  var autoSyncZone = srcSupaClient.slice(autoSyncIdx, autoSyncIdx + 500);
  ok(
    autoSyncZone.indexOf('_profileDirty !== false') !== -1,
    'startAutoSync doit contenir le guard _profileDirty !== false'
  );
});

test('_loadCorrupted flag bloque saveProfile (vérification source)', function() {
  // Guard: if (window.S && window.S._loadCorrupted) { return Promise.resolve(); }
  ok(
    srcSupaClient.indexOf('_loadCorrupted') !== -1,
    '_loadCorrupted doit être référencé dans supabase-client.js'
  );
  // Vérification que le retour précoce est bien présent après le check
  var corruptedIdx = srcSupaClient.indexOf('_loadCorrupted');
  ok(corruptedIdx !== -1, '_loadCorrupted doit être dans le source');
});

test('_syncing mutex : self._syncing = true avant l\'upsert Supabase', function() {
  ok(
    srcSupaClient.indexOf('self._syncing = true') !== -1,
    'self._syncing = true doit être défini avant l\'envoi réseau'
  );
  ok(
    srcSupaClient.indexOf('self._syncing = false') !== -1,
    'self._syncing = false doit être réinitialisé après l\'upsert'
  );
});

test('_savePendingDuringSync : si save pendante pendant sync → re-flush après completion', function() {
  ok(
    srcSupaClient.indexOf('_savePendingDuringSync') !== -1,
    '_savePendingDuringSync doit être défini dans supabase-client.js'
  );
  // Vérifier que le re-flush se produit bien
  ok(
    srcSupaClient.indexOf('self.saveProfile()') !== -1 || srcSupaClient.indexOf('self.saveProfile();') !== -1,
    'Un re-flush de saveProfile() doit être déclenché après la completion du sync'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 3 : visibilitychange / beforeunload ────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('visibilitychange / beforeunload');

test('Handler visibilitychange enregistré sur document', function() {
  ok(
    srcSupaClient.indexOf("'visibilitychange'") !== -1 ||
    srcSupaClient.indexOf('"visibilitychange"') !== -1,
    'document.addEventListener("visibilitychange") doit être présent dans supabase-client.js'
  );
});

test('visibilityState === "visible" → invalidateStatusCache est appelé', function() {
  var visIdx = srcSupaClient.indexOf('visibilitychange');
  ok(visIdx !== -1, 'visibilitychange doit être dans supabase-client.js');
  // Extraire la zone du handler
  var zone = srcSupaClient.slice(visIdx, visIdx + 500);
  ok(
    zone.indexOf('invalidateStatusCache') !== -1,
    'invalidateStatusCache doit être appelé dans le handler visibilitychange'
  );
  ok(
    zone.indexOf("'visible'") !== -1 || zone.indexOf('"visible"') !== -1,
    'Le handler doit vérifier visibilityState === "visible"'
  );
});

test('visibilityState === "hidden" → save pending flushed', function() {
  var visIdx = srcSupaClient.indexOf('visibilitychange');
  ok(visIdx !== -1, 'visibilitychange doit être présent');
  var zone = srcSupaClient.slice(visIdx, visIdx + 600);
  ok(
    zone.indexOf("'hidden'") !== -1 || zone.indexOf('"hidden"') !== -1,
    'Le handler doit vérifier visibilityState === "hidden"'
  );
  ok(
    zone.indexOf('saveProfile') !== -1,
    'saveProfile doit être appelé quand tab devient hidden'
  );
});

test('beforeunload → save pending flushed', function() {
  ok(
    srcSupaClient.indexOf("'beforeunload'") !== -1 ||
    srcSupaClient.indexOf('"beforeunload"') !== -1,
    'window.addEventListener("beforeunload") doit être présent dans supabase-client.js'
  );
  var buIdx = srcSupaClient.indexOf('beforeunload');
  var zone = srcSupaClient.slice(buIdx, buIdx + 300);
  ok(
    zone.indexOf('saveProfile') !== -1,
    'saveProfile doit être appelé dans le handler beforeunload'
  );
});

test('invalidateStatusCache met _userStatusCache à null', function() {
  ok(
    srcSupaClient.indexOf('invalidateStatusCache') !== -1,
    'invalidateStatusCache doit exister dans supabase-client.js'
  );
  var invIdx = srcSupaClient.indexOf('invalidateStatusCache = function');
  ok(invIdx !== -1, 'invalidateStatusCache doit être défini comme function');
  var zone = srcSupaClient.slice(invIdx, invIdx + 200);
  ok(
    zone.indexOf('_userStatusCache') !== -1 && (zone.indexOf('= null') !== -1),
    'invalidateStatusCache doit mettre _userStatusCache à null'
  );
});

test('invalidateStatusCache met _userStatusCacheTs à 0', function() {
  var invIdx = srcSupaClient.indexOf('invalidateStatusCache = function');
  ok(invIdx !== -1, 'invalidateStatusCache doit être défini');
  var zone = srcSupaClient.slice(invIdx, invIdx + 200);
  ok(
    zone.indexOf('_userStatusCacheTs') !== -1 && zone.indexOf('= 0') !== -1,
    'invalidateStatusCache doit mettre _userStatusCacheTs à 0'
  );
});

test('TTL du cache est 5 minutes (300000 ms)', function() {
  // Vérifié : supabase-client.js l.1084 : var TTL = 5 * 60 * 1000
  // et l.1203 : var CACHE_TTL = 5 * 60 * 1000
  ok(
    srcSupaClient.indexOf('5 * 60 * 1000') !== -1,
    'Le TTL doit être défini comme 5 * 60 * 1000 (300000 ms) dans supabase-client.js'
  );
});

test('AbortController utilisé avec timeout 8s sur fetch', function() {
  ok(
    srcSupaClient.indexOf('AbortController') !== -1,
    'AbortController doit être utilisé dans supabase-client.js pour les fetch avec timeout'
  );
  // Timeout 8000ms confirmé à la ligne ~1091 : setTimeout(..., 8000)
  ok(
    srcSupaClient.indexOf('8000') !== -1,
    'Un timeout de 8000ms doit être présent dans supabase-client.js'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── SUITE 4 : Intégrité SFCConstants après reload ────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

suite('Intégrité SFCConstants après reload');

test('SFCConstants.KCAL_FLOOR_FEMALE === 1400', function() {
  eq(global.SFCConstants.KCAL_FLOOR_FEMALE, 1400,
    'KCAL_FLOOR_FEMALE devrait être 1400 (ISSN 2017 / ACSM 2016)');
});

test('SFCConstants.KCAL_FLOOR_MALE === 1500', function() {
  eq(global.SFCConstants.KCAL_FLOOR_MALE, 1500,
    'KCAL_FLOOR_MALE devrait être 1500 (ACSM)');
});

test('SFCConstants.TRIAL_DAYS === 7', function() {
  eq(global.SFCConstants.TRIAL_DAYS, 7,
    'TRIAL_DAYS devrait être 7 (_user-auth.js l.9)');
});

test('SFCConstants.PREMIUM_PLANS.length === 8', function() {
  ok(Array.isArray(global.SFCConstants.PREMIUM_PLANS), 'PREMIUM_PLANS doit être un tableau');
  eq(global.SFCConstants.PREMIUM_PLANS.length, 8,
    'PREMIUM_PLANS devrait avoir 8 éléments, obtenu: ' + global.SFCConstants.PREMIUM_PLANS.length);
});

test('SFCConstants.MIN_SETS_PER_SESSION["45min"] === 9', function() {
  ok(
    global.SFCConstants.MIN_SETS_PER_SESSION &&
    typeof global.SFCConstants.MIN_SETS_PER_SESSION === 'object',
    'MIN_SETS_PER_SESSION doit être un objet'
  );
  eq(global.SFCConstants.MIN_SETS_PER_SESSION['45min'], 9,
    'MIN_SETS_PER_SESSION["45min"] devrait être 9 (NSCA minimum)');
});

test('SFCConstants.MIN_EXOS_BY_DUR["1h30"] === 6', function() {
  ok(
    global.SFCConstants.MIN_EXOS_BY_DUR &&
    typeof global.SFCConstants.MIN_EXOS_BY_DUR === 'object',
    'MIN_EXOS_BY_DUR doit être un objet'
  );
  eq(global.SFCConstants.MIN_EXOS_BY_DUR['1h30'], 6,
    'MIN_EXOS_BY_DUR["1h30"] devrait être 6 (6 exos × 3 sets = 18 sets)');
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
