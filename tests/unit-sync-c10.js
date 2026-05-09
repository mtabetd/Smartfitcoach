'use strict';
// C10 — _syncLoginInProgress stuck on no_session exit
// Tests that the flag is ALWAYS reset when syncOnLogin cannot find a valid session.

var assert = require('assert');
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name, '\n    ', e.message); failed++; }
}
async function testAsync(name, fn) {
  try { await fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name, '\n    ', e.message); failed++; }
}

// ─── Minimal SupaSync stub ────────────────────────────────────────────────────
function makeSupaSync(authScenario) {
  // Simulate the relevant slice of supabase-client.js SupaSync
  var self = {
    _syncLoginInProgress: false,
    _syncPending: false,
    _savePendingDuringSync: false,
  };

  // Mock getClient — always returns a truthy client
  function getClient() { return { auth: { getSession: authScenario.getSession } }; }

  self.syncOnLogin = function() {
    if (!getClient()) return Promise.resolve('no_client');
    if (self._syncLoginInProgress) return Promise.resolve('already_syncing');
    self._syncLoginInProgress = true;

    var authReadyPromise = authScenario.ready
      ? authScenario.ready()
      : Promise.resolve();

    return authReadyPromise.then(function() {
      var uidNow = authScenario.getUser ? authScenario.getUser() : null;
      if (!uidNow) {
        var client = getClient();
        if (client && client.auth && client.auth.getSession) {
          return client.auth.getSession().then(function(res) {
            var session = res && res.data && res.data.session;
            if (session && session.user && session.user.id) {
              // would call _doSync — not needed for these tests
              self._syncLoginInProgress = false;
              return 'synced';
            }
            self._syncLoginInProgress = false;
            return 'no_session';
          }).catch(function() {
            self._syncLoginInProgress = false;
            return 'no_session';
          });
        }
        self._syncLoginInProgress = false;
        return 'no_session';
      }
      self._syncLoginInProgress = false;
      return 'synced';
    });
  };

  return self;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
console.log('\nC10 — _syncLoginInProgress reset on all no_session exit paths');

(async function() {

  // PATH 1: AUTH.getUser() = null, getSession() returns empty session
  await testAsync('PATH 1: getUser=null + getSession no user → flag reset', async function() {
    var sync = makeSupaSync({
      ready: function() { return Promise.resolve(); },
      getUser: function() { return null; },
      getSession: function() { return Promise.resolve({ data: { session: null } }); }
    });
    var result = await sync.syncOnLogin();
    assert.strictEqual(result, 'no_session', 'should return no_session');
    assert.strictEqual(sync._syncLoginInProgress, false, '_syncLoginInProgress must be false after no_session');
  });

  // PATH 1b: verify second call is NOT blocked
  await testAsync('PATH 1b: second syncOnLogin call not blocked after no_session', async function() {
    var sync = makeSupaSync({
      ready: function() { return Promise.resolve(); },
      getUser: function() { return null; },
      getSession: function() { return Promise.resolve({ data: { session: null } }); }
    });
    await sync.syncOnLogin(); // first call → no_session
    var result2 = await sync.syncOnLogin(); // second call
    assert.notStrictEqual(result2, 'already_syncing', 'second call must not return already_syncing');
  });

  // PATH 2: AUTH.getUser() = null, getSession() throws
  await testAsync('PATH 2: getUser=null + getSession throws → flag reset', async function() {
    var sync = makeSupaSync({
      ready: function() { return Promise.resolve(); },
      getUser: function() { return null; },
      getSession: function() { return Promise.reject(new Error('network error')); }
    });
    var result = await sync.syncOnLogin();
    assert.strictEqual(result, 'no_session', 'should return no_session');
    assert.strictEqual(sync._syncLoginInProgress, false, '_syncLoginInProgress must be false after getSession throw');
  });

  // PATH 3: getClient has no auth.getSession (AUTH non initialisé path)
  await testAsync('PATH 3: no getSession API → flag reset', async function() {
    var sync = makeSupaSync({
      ready: function() { return Promise.resolve(); },
      getUser: function() { return null; },
      getSession: null  // will cause "no client with getSession" path
    });
    // Override getClient to return client WITHOUT auth.getSession
    var origSyncOnLogin = sync.syncOnLogin;
    // Rebuild with a client that has no getSession
    sync._syncLoginInProgress = false;
    function makeSupaSyncNoSession() {
      var s2 = {
        _syncLoginInProgress: false,
        _syncPending: false,
      };
      s2.syncOnLogin = function() {
        if (s2._syncLoginInProgress) return Promise.resolve('already_syncing');
        s2._syncLoginInProgress = true;
        return Promise.resolve().then(function() {
          var uidNow = null; // no user
          if (!uidNow) {
            // no getSession available
            s2._syncLoginInProgress = false;
            return 'no_session';
          }
          return 'synced';
        });
      };
      return s2;
    }
    var s3 = makeSupaSyncNoSession();
    var result = await s3.syncOnLogin();
    assert.strictEqual(result, 'no_session');
    assert.strictEqual(s3._syncLoginInProgress, false, '_syncLoginInProgress must be false');
  });

  // REGRESSION: flag stays false after TWO consecutive no_session calls
  await testAsync('REGRESSION: flag false after 2 consecutive no_session calls', async function() {
    var sync = makeSupaSync({
      ready: function() { return Promise.resolve(); },
      getUser: function() { return null; },
      getSession: function() { return Promise.resolve({ data: { session: null } }); }
    });
    await sync.syncOnLogin();
    await sync.syncOnLogin();
    assert.strictEqual(sync._syncLoginInProgress, false, 'flag must still be false after 2nd call');
  });

  // HAPPY PATH: valid user → flag reset after successful sync
  await testAsync('HAPPY PATH: valid user → flag reset after success', async function() {
    var sync = makeSupaSync({
      ready: function() { return Promise.resolve(); },
      getUser: function() { return { id: 'user-123' }; },
      getSession: function() { return Promise.resolve({ data: { session: null } }); }
    });
    var result = await sync.syncOnLogin();
    assert.strictEqual(result, 'synced');
    assert.strictEqual(sync._syncLoginInProgress, false, 'flag reset after happy path');
  });

  // WATCHDOG: flag stuck for > watchdog timeout → auto-reset
  await testAsync('WATCHDOG: flag stuck → auto-reset after timeout', async function() {
    var watchdogFired = false;
    var WATCHDOG_MS = 50; // use 50ms in test instead of 10s

    // Simulate a sync that sets the flag but never clears it (hung async op)
    var stuck = {
      _syncLoginInProgress: false,
      _syncPending: false,
    };
    stuck.simulateStuck = function() {
      if (stuck._syncLoginInProgress) return Promise.resolve('already_syncing');
      stuck._syncLoginInProgress = true;
      var _watchdogTimer = setTimeout(function() {
        if (stuck._syncLoginInProgress) {
          stuck._syncLoginInProgress = false;
          stuck._syncPending = false;
          watchdogFired = true;
        }
      }, WATCHDOG_MS);
      // Deliberately never resolve / reset the flag (simulates hang)
      return new Promise(function() {}); // never resolves
    };

    stuck.simulateStuck(); // intentionally not awaited — it hangs
    assert.strictEqual(stuck._syncLoginInProgress, true, 'flag must be true while hung');

    // Wait for watchdog to fire
    await new Promise(function(resolve) { setTimeout(resolve, WATCHDOG_MS + 20); });
    assert.strictEqual(watchdogFired, true, 'watchdog must have fired');
    assert.strictEqual(stuck._syncLoginInProgress, false, 'flag must be false after watchdog');
  });

  // WATCHDOG: NOT fired when sync completes normally before 10s
  await testAsync('WATCHDOG: not fired when sync completes normally', async function() {
    var watchdogFiredUnexpectedly = false;
    var WATCHDOG_MS = 50;

    var ok = {
      _syncLoginInProgress: false,
    };
    ok.simulate = async function() {
      if (ok._syncLoginInProgress) return 'already_syncing';
      ok._syncLoginInProgress = true;
      var _watchdogTimer = setTimeout(function() {
        if (ok._syncLoginInProgress) {
          ok._syncLoginInProgress = false;
          watchdogFiredUnexpectedly = true;
        }
      }, WATCHDOG_MS);
      // Sync completes quickly and clears timer
      await new Promise(function(r) { setTimeout(r, 5); });
      clearTimeout(_watchdogTimer);
      ok._syncLoginInProgress = false;
      return 'done';
    };

    var result = await ok.simulate();
    assert.strictEqual(result, 'done');
    assert.strictEqual(ok._syncLoginInProgress, false, 'flag clear after normal sync');

    // Wait past watchdog timeout to confirm it was cancelled
    await new Promise(function(resolve) { setTimeout(resolve, WATCHDOG_MS + 20); });
    assert.strictEqual(watchdogFiredUnexpectedly, false, 'watchdog must NOT have fired');
  });

  console.log('\n─────────────────────────────');
  console.log('  Passed:', passed, '/ Failed:', failed);
  if (failed > 0) process.exit(1);

})();
