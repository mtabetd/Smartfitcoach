/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
// app/sfc-monitor.js
// Monitoring minimal : capture les violations d'invariants, erreurs de sync,
// exceptions non catchées. En prod : envoie à un endpoint configurable.
'use strict';
(function() {

  var _events = [];
  var _maxEvents = 200; // buffer circulaire
  var _endpoint = null; // configurer via SFCMonitor.init({endpoint: '...'})
  var _sessionId = null;

  var SEVERITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };

  function _record(type, severity, data) {
    var ev = {
      type: type,
      severity: severity,
      data: data,
      ts: Date.now(),
      session: _sessionId,
      url: (typeof window !== 'undefined' && window.location) ? window.location.href : null
    };
    _events.push(ev);
    if (_events.length > _maxEvents) _events.shift(); // rolling buffer
    if (severity === SEVERITY.CRITICAL || severity === SEVERITY.HIGH) {
      _flush(ev); // flush immédiat sur erreur critique
    }
  }

  function _flush(ev) {
    if (!_endpoint) return;
    try {
      // navigator.sendBeacon uniquement en environnement navigateur
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(_endpoint, JSON.stringify({ event: ev, app: 'smartfitcoach' }));
      }
    } catch(_) {}
  }

  var SFCMonitor = {
    SEVERITY: SEVERITY,

    init: function(cfg) {
      _endpoint = (cfg && cfg.endpoint) || null;
      _sessionId = (cfg && cfg.sessionId) || ('s_' + Math.random().toString(36).slice(2));
    },

    reportInvariant: function(violation) {
      _record('invariant_violation', SEVERITY.HIGH, violation);
    },

    reportSyncFailure: function(data) {
      _record('sync_failure', SEVERITY.HIGH, data);
    },

    reportSaveFailure: function(data) {
      _record('save_failure', SEVERITY.MEDIUM, data);
    },

    reportNutritionDivergence: function(data) {
      // data: { expected, actual, delta, profile }
      var sev = Math.abs(data.delta) > 100 ? SEVERITY.HIGH : SEVERITY.MEDIUM;
      _record('nutrition_divergence', sev, data);
    },

    reportPremiumInconsistency: function(data) {
      _record('premium_inconsistency', SEVERITY.CRITICAL, data);
    },

    reportCorruption: function(data) {
      _record('data_corruption', SEVERITY.CRITICAL, data);
    },

    reportException: function(err, context) {
      _record('uncaught_exception', SEVERITY.HIGH, {
        message: err && err.message,
        stack: err && err.stack,
        context: context
      });
    },

    getEvents: function() { return _events.slice(); },

    getEventsByType: function(type) {
      return _events.filter(function(e) { return e.type === type; });
    },

    getHighSeverity: function() {
      return _events.filter(function(e) {
        return e.severity === SEVERITY.HIGH || e.severity === SEVERITY.CRITICAL;
      });
    },

    clear: function() { _events = []; }
  };

  // Auto-capture des exceptions globales (navigateur uniquement)
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
      SFCMonitor.reportException(e.error || new Error(e.message), 'window.onerror');
    });
    window.addEventListener('unhandledrejection', function(e) {
      SFCMonitor.reportException(e.reason, 'unhandledrejection');
    });
    window.SFCMonitor = SFCMonitor;
  }

  if (typeof module !== 'undefined') module.exports = SFCMonitor;

})();
