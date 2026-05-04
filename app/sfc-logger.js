/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
// SFCLogger — lightweight observability layer.
// Captures errors with context, never logs PII.
(function() {
  var _buf = [];
  var _lastAction = '';

  function _safeStr(v, max) {
    try { return String(v || '').slice(0, max || 200); } catch(e) { return ''; }
  }

  var SFCLogger = {
    capture: function(err, ctx) {
      try {
        var entry = {
          ts: new Date().toISOString(),
          msg: _safeStr(err && (err.message || err), 300),
          stack: _safeStr(err && err.stack, 500),
          module: _safeStr(ctx && ctx.module, 60),
          view: _safeStr((ctx && ctx.view) || (window.S && window.S.view), 40),
          online: typeof navigator !== 'undefined' ? String(navigator.onLine) : 'unknown',
          version: _safeStr(window.APP_VERSION || window.CACHE_VERSION, 30),
          lastAction: _lastAction
        };
        _buf.push(entry);
        if (_buf.length > 50) _buf.shift();
        // Forward to Netlify crash reporter if available (no double-send guard needed — _send deduplicates)
        if (typeof window._sfcCrashSend === 'function') {
          try { window._sfcCrashSend(entry.msg, entry.module, 0, entry.stack); } catch(_) {}
        }
      } catch(_) {}
    },

    trackAction: function(name) {
      try { _lastAction = _safeStr(name, 60); } catch(_) {}
    },

    getLogs: function() { return _buf.slice(); },

    getLastAction: function() { return _lastAction; }
  };

  window.SFCLogger = SFCLogger;
})();
