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
  var isProd = (typeof location !== 'undefined' &&
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

  if (isProd) {
    var devtoolsOpen = false;
    function detectDevTools() {
      var widthThreshold = window.outerWidth - window.innerWidth > 160;
      var heightThreshold = window.outerHeight - window.innerHeight > 160;
      if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
        devtoolsOpen = true;
        // Silent detection — no console output in production
      } else if (!widthThreshold && !heightThreshold) {
        devtoolsOpen = false;
      }
    }
    setInterval(detectDevTools, 1000);
  }
})();
