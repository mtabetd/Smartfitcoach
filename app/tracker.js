/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/* ═══════════════════════════════════════════════════════════════
   TRACKER.JS — Product analytics (fire-and-forget, never blocks UX)
   Sends key events to /api/analytics-track for server-side visibility.
   All calls are best-effort: errors are swallowed silently.
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // Stable anonymous session ID — regenerated per browser session (not per page load)
  var _sessionId = null;
  function _getSessionId() {
    if (_sessionId) return _sessionId;
    try {
      var stored = sessionStorage.getItem('sfc_sid');
      if (stored) { _sessionId = stored; return _sessionId; }
    } catch(_) {}
    // Generate a random session ID (no PII)
    var arr = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(arr);
    } else {
      for (var i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    _sessionId = Array.from(arr).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    try { sessionStorage.setItem('sfc_sid', _sessionId); } catch(_) {}
    return _sessionId;
  }

  function _getUserId() {
    try {
      var u = window.AUTH && window.AUTH.getUser && window.AUTH.getUser();
      return (u && u.id) || null;
    } catch(_) { return null; }
  }

  var _queue = [];
  var _sending = false;

  function _flush() {
    if (_sending || _queue.length === 0) return;
    _sending = true;
    var payload = _queue[0];
    fetch('/.netlify/functions/analytics-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function() {
      _queue.shift();
    }).catch(function() {
      // Leave payload in queue — it will retry on next flush trigger
    }).finally(function() {
      _sending = false;
      if (_queue.length > 0) setTimeout(_flush, 100);
    });
  }

  function track(eventName, properties) {
    try {
      var payload = {
        event: eventName,
        session_id: _getSessionId(),
        user_id: _getUserId(),
        properties: properties || {}
      };
      // Also log locally via BLACKBOX if available
      if (window.BLACKBOX && window.BLACKBOX.log) {
        try { window.BLACKBOX.log(eventName, properties || {}); } catch(_) {}
      }
      _queue.push(payload);
      // Debounce flush to batch rapid events
      setTimeout(_flush, 50);
    } catch(_) {}
  }

  window.TRACKER = { track: track };
})();
