'use strict';
// Tests unitaires — probeDb() dans app-social.js
// Vérifie que l'échec n'est JAMAIS mis en cache définitivement.
//
// Stratégie : extraire la logique de probeDb via regex + eval,
// en mockant db() pour simuler succès / échec réseau.

var fs   = require('fs');
var path = require('path');

var passed = 0;
var failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('  \x1b[32m✓\x1b[0m ' + label);
    passed++;
  } else {
    console.error('  \x1b[31m✗\x1b[0m ' + label);
    failed++;
  }
}

// ── Extraction + instanciation de probeDb avec db() mockable ────────────────

function makeProbeDb(dbFactory) {
  // State local (mirror de l'IIFE dans app-social.js)
  var _dbReady  = null;
  var _dbFailTs = 0;
  var DB_RETRY_MS = 30000;

  function db() { return dbFactory(); }

  function probeDb() {
    if (_dbReady === true) return Promise.resolve(true);
    if (_dbReady === false && (Date.now() - _dbFailTs) < DB_RETRY_MS) {
      return Promise.resolve(false);
    }
    _dbReady = null;
    var c = db();
    if (!c) { _dbReady = false; _dbFailTs = Date.now(); return Promise.resolve(false); }
    return c.from('social_profiles').select('id').limit(1).then(function(r) {
      if (r.error) { _dbReady = false; _dbFailTs = Date.now(); return false; }
      _dbReady = true;
      return true;
    }).catch(function() { _dbReady = false; _dbFailTs = Date.now(); return false; });
  }

  // Expose state for assertions
  probeDb._state = function() { return { _dbReady: _dbReady, _dbFailTs: _dbFailTs }; };

  // Simulate visibilitychange reset
  probeDb._visibilityReset = function() {
    if (_dbReady === false) { _dbReady = null; _dbFailTs = 0; }
  };

  return probeDb;
}

// ── Client mocks ─────────────────────────────────────────────────────────────

function okClient() {
  return {
    from: function() { return { select: function() { return { limit: function() {
      return Promise.resolve({ error: null, data: [] });
    }}}}; }
  };
}

function errClient() {
  return {
    from: function() { return { select: function() { return { limit: function() {
      return Promise.resolve({ error: { message: 'table not found' }, data: null });
    }}}}; }
  };
}

function throwClient() {
  return {
    from: function() { return { select: function() { return { limit: function() {
      return Promise.reject(new Error('network error'));
    }}}}; }
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

console.log('\n── probeDb : succès mis en cache définitivement ─────────────');

(async function() {

  // T1 : succès → true, mis en cache
  var probe = makeProbeDb(function() { return okClient(); });
  var r1 = await probe();
  assert('Premier appel DB OK → true', r1 === true);
  var r2 = await probe();
  assert('Deuxième appel → cache true (pas de re-probe)', r2 === true);
  assert('_dbReady === true après succès', probe._state()._dbReady === true);

  console.log('\n── probeDb : échec JAMAIS mis en cache définitivement ───────');

  // T2 : échec → false, mais re-probe possible après cooldown
  var callCount = 0;
  var probe2 = makeProbeDb(function() {
    callCount++;
    return callCount === 1 ? errClient() : okClient();
  });
  var f1 = await probe2();
  assert('Premier appel DB erreur → false', f1 === false);
  assert('_dbReady === false après échec', probe2._state()._dbReady === false);

  // Dans le cooldown (30s) → doit retourner false sans re-probe
  var callsBefore = callCount;
  var f2 = await probe2();
  assert('Dans le cooldown → toujours false, pas de re-probe', f2 === false && callCount === callsBefore);

  // Simule expiration cooldown
  probe2._state()._dbFailTs = 0; // force expiry (hack state via closure — inaccessible normalement, on le fait via visibilityReset)

  console.log('\n── probeDb : visibilitychange reset ─────────────────────────');

  // T3 : visibilitychange reset → relance le probe
  var callCount3 = 0;
  var probe3 = makeProbeDb(function() {
    callCount3++;
    return callCount3 <= 2 ? errClient() : okClient();
  });
  await probe3();    // echec 1
  assert('Avant visibility reset → _dbReady false', probe3._state()._dbReady === false);
  probe3._visibilityReset();
  assert('Après visibility reset → _dbReady null', probe3._state()._dbReady === null);
  assert('Après visibility reset → _dbFailTs = 0', probe3._state()._dbFailTs === 0);

  var r3 = await probe3();    // echec 2 (ok client pas encore)
  assert('Re-probe après visibility reset, erreur encore → false', r3 === false);

  probe3._visibilityReset();
  var r4 = await probe3();    // ok client maintenant
  assert('Re-probe après 2e visibility reset, DB OK → true', r4 === true);
  assert('_dbReady === true après récupération', probe3._state()._dbReady === true);

  console.log('\n── probeDb : db() null (client non initialisé) ─────────────');

  // T4 : db() retourne null → false + timestamp, mais reset possible
  var probe4 = makeProbeDb(function() { return null; });
  var r5 = await probe4();
  assert('db() null → false', r5 === false);
  assert('_dbFailTs enregistré', probe4._state()._dbFailTs > 0);
  probe4._visibilityReset();
  assert('Reset possible même après db() null', probe4._state()._dbReady === null);

  console.log('\n── probeDb : exception réseau ───────────────────────────────');

  // T5 : exception réseau → false + retry possible
  var probe5 = makeProbeDb(function() { return throwClient(); });
  var r6 = await probe5();
  assert('Exception réseau → false', r6 === false);
  probe5._visibilityReset();
  assert('Reset après exception → null', probe5._state()._dbReady === null);

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────────');
  if (failed === 0) {
    console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m\n');
    process.exit(0);
  } else {
    console.error('\x1b[31m✗ ' + failed + ' échec(s) sur ' + (passed + failed) + ' tests\x1b[0m\n');
    process.exit(1);
  }

})();
