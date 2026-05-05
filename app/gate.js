/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// Beta gate removed — SmartFitCoach is now publicly accessible.
// This stub ensures #app is always visible regardless of HTML defaults.
// The real security boundary is Supabase auth + server-side requirePremium().
(function() {
  function showApp() {
    var app = document.getElementById('app');
    if (app) app.style.display = 'block';
    var gate = document.getElementById('gate');
    if (gate) gate.style.display = 'none';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showApp);
  } else {
    showApp();
  }
})();
