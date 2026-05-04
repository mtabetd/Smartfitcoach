/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
// safeRemoteCall — universal Supabase/async call wrapper with timeout, retry, validation, fallback.
// SFCLastGood — validated "last known good" state snapshots.
// SFCLock — lightweight action locks to prevent double-tap / concurrent mutations.
(function() {

  // ─── safeRemoteCall ────────────────────────────────────────────────────────
  // opts: { timeout=8000, retries=1, backoffMs=2000, validate, fallback, module }
  function safeRemoteCall(name, fn, opts) {
    opts = opts || {};
    var timeout   = opts.timeout   || 8000;
    var retries   = typeof opts.retries === 'number' ? opts.retries : 1;
    var backoffMs = opts.backoffMs || 2000;
    var validate  = typeof opts.validate  === 'function' ? opts.validate  : null;
    var fallback  = 'fallback' in opts ? opts.fallback : null;
    var module_   = opts.module || name;

    function _attempt(left) {
      var _tp = new Promise(function(_, reject) {
        setTimeout(function() { reject(new Error(name + ' timeout (' + timeout + 'ms)')); }, timeout);
      });
      return Promise.race([fn(), _tp]).then(function(result) {
        if (validate && !validate(result)) {
          throw new Error(name + ': payload validation failed');
        }
        return result;
      }).catch(function(e) {
        if (window.SFCLogger) window.SFCLogger.capture(e, { module: module_ });
        if (left > 0) {
          return new Promise(function(resolve) {
            setTimeout(function() { resolve(_attempt(left - 1)); }, backoffMs);
          });
        }
        console.warn('[safeRemoteCall] ' + name + ' failed:', e && e.message || e);
        return fallback;
      });
    }
    return _attempt(retries);
  }

  // ─── SFCLastGood ───────────────────────────────────────────────────────────
  var _HOP = Object.prototype.hasOwnProperty;
  var _DANGEROUS = ['__proto__', 'constructor', 'prototype'];

  function _safeObject(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    for (var i = 0; i < _DANGEROUS.length; i++) {
      if (_HOP.call(data, _DANGEROUS[i])) return false;
    }
    return true;
  }

  function _noNaNInf(data) {
    try {
      var keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) {
        var v = data[keys[i]];
        if (typeof v === 'number' && !isFinite(v)) return false;
      }
    } catch(e) {}
    return true;
  }

  var SFCLastGood = {
    save: function(key, data) {
      try {
        if (!_safeObject(data) || !_noNaNInf(data)) return;
        localStorage.setItem('sfc_lkg_' + key, JSON.stringify({ ts: Date.now(), data: data }));
      } catch(e) {
        if (window.SFCLogger) window.SFCLogger.capture(e, { module: 'SFCLastGood.save/' + key });
      }
    },

    get: function(key) {
      try {
        var raw = localStorage.getItem('sfc_lkg_' + key);
        if (!raw) return null;
        var payload = JSON.parse(raw);
        if (!payload || !_safeObject(payload.data)) return null;
        return payload.data;
      } catch(e) { return null; }
    },

    clear: function(key) {
      try { localStorage.removeItem('sfc_lkg_' + key); } catch(e) {}
    }
  };

  // ─── SFCLock ───────────────────────────────────────────────────────────────
  var _locks = {};

  var SFCLock = {
    acquire: function(name, autoReleaseMs) {
      if (_locks[name]) return false;
      _locks[name] = true;
      if (autoReleaseMs > 0) {
        setTimeout(function() { delete _locks[name]; }, autoReleaseMs);
      }
      return true;
    },
    release:   function(name)  { delete _locks[name]; },
    isLocked:  function(name)  { return !!_locks[name]; },
    releaseAll: function()      { _locks = {}; }
  };

  window.safeRemoteCall = safeRemoteCall;
  window.SFCLastGood    = SFCLastGood;
  window.SFCLock        = SFCLock;
})();
