/**
 * SmartFitCoach — Performance Monitor
 * Lightweight instrumentation for render/network/storage/auth events.
 * Enabled only when window._sfcDevMode === true (never in production by default).
 * Data accumulates in window.SFCPerf and can be read in the console.
 */
(function() {
  'use strict';

  var _active = false;
  var _metrics = {
    render:   { count: 0, totalMs: 0, long: [] },   // renders > 16ms
    network:  { saves: 0, retries: 0, failures: 0, collisions: 0 },
    storage:  { writes: 0, failures: 0, quotaHits: 0, pendingFlag: 0 },
    auth:     { premiumChecks: 0, cacheHits: 0, staleUsed: 0, transitions: [] },
    memory:   { listeners: 0, timers: 0, intervals: 0 }
  };

  // ── Render instrumentation ──────────────────────────────────────────────────
  function _wrapRender() {
    var _orig = window.render;
    if (!_orig || _orig._sfcPerfWrapped) return;
    window.render = function _sfcInstrumentedRender() {
      var _t0 = Date.now();
      try {
        _orig.apply(this, arguments);
      } finally {
        var _dur = Date.now() - _t0;
        _metrics.render.count++;
        _metrics.render.totalMs += _dur;
        if (_dur > 16) {
          _metrics.render.long.push({ ts: new Date().toISOString(), ms: _dur });
          if (_dur > 50) {
            console.warn('[SFCPerf] FREEZE render ' + _dur + 'ms — potential keyboard lag');
          }
        }
      }
    };
    window.render._sfcPerfWrapped = true;
    // Preserve original properties (e.g. render._lock)
    Object.keys(_orig).forEach(function(k) {
      if (!(k in window.render)) window.render[k] = _orig[k];
    });
  }

  // ── Network / SupaSync instrumentation ─────────────────────────────────────
  function _wrapSupaSync() {
    var sync = window.SupaSync;
    if (!sync || sync._sfcPerfWrapped) return;
    var _origSave = sync.saveProfile;
    sync.saveProfile = function() {
      _metrics.network.saves++;
      if (sync._syncing) _metrics.network.collisions++;
      return _origSave.apply(this, arguments);
    };
    var _origLoad = sync.loadProfile;
    sync.loadProfile = function() {
      return _origLoad.apply(this, arguments).catch(function(e) {
        _metrics.network.failures++;
        throw e;
      });
    };
    sync._sfcPerfWrapped = true;
  }

  // ── Storage instrumentation ─────────────────────────────────────────────────
  function _wrapSafeStorage() {
    var ss = window.safeStorage;
    if (!ss || ss._sfcPerfWrapped) return;
    var _origLocalSet = ss.local.setItem;
    ss.local.setItem = function(k, v) {
      _metrics.storage.writes++;
      var result = _origLocalSet.call(this, k, v);
      if (!result) _metrics.storage.failures++;
      if (k === '_sfc_save_pending') _metrics.storage.pendingFlag++;
      return result;
    };
    ss._sfcPerfWrapped = true;
  }

  // ── Auth / Premium instrumentation ─────────────────────────────────────────
  function _wrapPremiumCheck() {
    var _origCheck = window.safeUserStatusCheck;
    if (!_origCheck || _origCheck._sfcPerfWrapped) return;
    window.safeUserStatusCheck = function(opts) {
      _metrics.auth.premiumChecks++;
      return _origCheck.apply(this, arguments).then(function(result) {
        if (result && result.source === 'cache') _metrics.auth.cacheHits++;
        if (result && result.source === 'fallback') _metrics.auth.staleUsed++;
        return result;
      });
    };
    window.safeUserStatusCheck._sfcPerfWrapped = true;
  }

  // ── Memory: count active timers / intervals / listeners ────────────────────
  function _snapshotMemory() {
    // Approximate by checking known SFC timers
    var timerCount = 0;
    if (window._saveProfileTimer) timerCount++;
    if (window._renderDebounceTimer) timerCount++;
    if (window.SupaSync && window.SupaSync._debounceTimer) timerCount++;
    _metrics.memory.timers = timerCount;
    if (window.SupaSync && window.SupaSync._syncInterval) _metrics.memory.intervals = 1;
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  window.SFCPerf = {
    start: function() {
      if (_active) return;
      _active = true;
      _wrapRender();
      // Delay sync/storage wrapping until after app modules load
      setTimeout(function() {
        _wrapSupaSync();
        _wrapSafeStorage();
        _wrapPremiumCheck();
      }, 2000);
      setInterval(_snapshotMemory, 10000);
      console.log('[SFCPerf] Performance monitoring active. Access via window.SFCPerf.report()');
    },

    report: function() {
      _snapshotMemory();
      var avg = _metrics.render.count > 0 ? Math.round(_metrics.render.totalMs / _metrics.render.count) : 0;
      console.group('[SFCPerf] Performance Report');
      console.log('RENDER  — count:', _metrics.render.count, '| avg:', avg + 'ms | long renders:', _metrics.render.long.length);
      if (_metrics.render.long.length) console.table(_metrics.render.long.slice(-10));
      console.log('NETWORK — saves:', _metrics.network.saves, '| retries:', _metrics.network.retries, '| failures:', _metrics.network.failures, '| collisions:', _metrics.network.collisions);
      console.log('STORAGE — writes:', _metrics.storage.writes, '| failures:', _metrics.storage.failures, '| quota hits:', _metrics.storage.quotaHits, '| pending flag sets:', _metrics.storage.pendingFlag);
      console.log('AUTH    — premium checks:', _metrics.auth.premiumChecks, '| cache hits:', _metrics.auth.cacheHits, '| stale used:', _metrics.auth.staleUsed);
      console.log('MEMORY  — timers:', _metrics.memory.timers, '| intervals:', _metrics.memory.intervals);
      console.groupEnd();
      return JSON.parse(JSON.stringify(_metrics));
    },

    reset: function() {
      _metrics = {
        render:  { count: 0, totalMs: 0, long: [] },
        network: { saves: 0, retries: 0, failures: 0, collisions: 0 },
        storage: { writes: 0, failures: 0, quotaHits: 0, pendingFlag: 0 },
        auth:    { premiumChecks: 0, cacheHits: 0, staleUsed: 0, transitions: [] },
        memory:  { listeners: 0, timers: 0, intervals: 0 }
      };
      console.log('[SFCPerf] Metrics reset');
    },

    get metrics() { return _metrics; }
  };

  // Auto-start in dev mode
  if (window._sfcDevMode === true) {
    window.SFCPerf.start();
  }
})();
