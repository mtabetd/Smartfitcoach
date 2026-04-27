/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
/* ── SECURITY: Production hardening ── */
(function(){
  'use strict';
  // On Capacitor Android, hostname is 'localhost' (androidScheme: "https") — detect it via Capacitor API.
  var _isCapacitorNative = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  var isProd = _isCapacitorNative || (typeof location !== 'undefined' &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1' &&
    location.hostname !== '');
  if (isProd) {
    var noop = function(){};
    if (typeof console !== 'undefined') {
      console.log = noop;
      console.debug = noop;
      console.info = noop;
    }
  }

  // Removed the 1 s devtools-detection setInterval. It did nothing — the
  // "Silent detection" branch had no side effects — while permanently
  // waking the main thread every second on low-end iPhones. Pure cost,
  // zero security value (dedicated users open devtools regardless).
})();
