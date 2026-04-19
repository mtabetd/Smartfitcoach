/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
if ('serviceWorker' in navigator) {
  var _reloadedForSW = false;
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js', {scope: './'}).then(function(reg) {
      // Vérifier maj immédiatement au load
      try { reg.update(); } catch(e) {}
      // Puis toutes les 10 min (plus agressif que 30min)
      setInterval(function() { try { reg.update(); } catch(e) {} }, 10 * 60 * 1000);
      // Nouveau SW installé → activation automatique sans interaction utilisateur
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version prête → demander skipWaiting (active immédiatement)
            try { newWorker.postMessage({ type: 'SKIP_WAITING' }); } catch(e) {}
          }
        });
      });
    }).catch(function(err) {
      console.warn('[SW] Registration failed:', err);
    });
  });
  // Auto-reload silencieux quand le nouveau SW prend le contrôle
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (_reloadedForSW) return;
    _reloadedForSW = true;
    window.location.reload();
  });
}
