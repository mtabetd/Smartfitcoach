/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
'use strict';
// ─── SESSION HISTORY ──────────────────────────────────────────────────────────
// Persists the last N workout IDs so WorkoutSelector can avoid repetition.
// Uses localStorage; falls back to in-memory if unavailable (private browsing,
// storage quota exceeded, or Node.js test environment).
// ─────────────────────────────────────────────────────────────────────────────

(function (root) {

  var STORAGE_KEY = 'sfc_wh';
  var MAX_HISTORY = 10;

  // In-memory fallback when localStorage is unavailable
  var _memory = null;

  function _load() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return _memory || [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(function (id) { return typeof id === 'string' && id.length > 0; })
        : [];
    } catch (_) {
      return _memory || [];
    }
  }

  function _persist(arr) {
    try {
      root.localStorage && root.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (_) {
      _memory = arr;
    }
  }

  function saveSession(workoutId) {
    if (!workoutId || typeof workoutId !== 'string') return;
    var history = _load();
    if (history.indexOf(workoutId) !== -1) history.splice(history.indexOf(workoutId), 1);
    history.unshift(workoutId);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    _persist(history);
    // Keep memory in sync so Node.js tests work without localStorage
    _memory = history;
  }

  function getSessionHistory() {
    return _load();
  }

  function clearSessionHistory() {
    _memory = [];
    try {
      root.localStorage && root.localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  var API = {
    saveSession:        saveSession,
    getSessionHistory:  getSessionHistory,
    clearSessionHistory: clearSessionHistory
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    root.SFCSessionHistory = API;
  }

}(typeof globalThis !== 'undefined' ? globalThis : this));
