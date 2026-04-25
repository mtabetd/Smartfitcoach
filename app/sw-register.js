/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(function() {});
}
if ('serviceWorker' in navigator) {
  var _reloadingForSW = false;

  function _doReload() {
    if (_reloadingForSW) return;
    _reloadingForSW = true;
    // Flush le debounce saveProfile (750ms) avant le rechargement pour ne pas perdre
    // l'étape d'onboarding en cours si le SW se met à jour pendant la saisie.
    if (window._saveProfileTimer) { clearTimeout(window._saveProfileTimer); window._saveProfileTimer = null; }
    try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
    window.location.reload();
  }

  function _activateWaiting(reg) {
    if (!reg || !reg.waiting) return;
    try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch(e) {}
  }

  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function(reg) {
      // Vérifier MAJ immédiatement, puis toutes les 10 min
      try { reg.update(); } catch(e) {}
      setInterval(function() { try { reg.update(); } catch(e) {} }, 10 * 60 * 1000);

      // SW déjà en attente au démarrage (ex : onglet rouvert après une MAJ)
      if (reg.waiting) {
        _activateWaiting(reg);
      }

      // Nouveau SW détecté en cours d'installation
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            _activateWaiting(reg);
          }
        });
      });
    }).catch(function(err) {
      console.warn('[SW] Registration failed:', err);
    });
  });

  // Nouveau SW prend le contrôle → reload silencieux
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    _doReload();
  });

  // FIX PRINCIPAL : retour au premier plan (PWA minimisée puis rouverte)
  // Android gèle le JS en arrière-plan → controllerchange peut avoir été manqué.
  // On vérifie s'il y a un SW en attente et on force l'activation + reload.
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState !== 'visible' || _reloadingForSW) return;
    navigator.serviceWorker.getRegistration('./').then(function(reg) {
      if (!reg) return;
      if (reg.waiting) {
        // SW installé en arrière-plan, en attente d'activation
        _activateWaiting(reg);
      } else {
        // Vérifier si une nouvelle version est disponible
        try { reg.update(); } catch(e) {}
      }
    }).catch(function() {});
  });

  // FIX bfcache : Android restaure la page depuis un snapshot mémoire
  // pageshow(persisted=true) = page remise en avant depuis le cache navigateur
  window.addEventListener('pageshow', function(e) {
    if (!e.persisted || _reloadingForSW) return;
    navigator.serviceWorker.getRegistration('./').then(function(reg) {
      if (reg && reg.waiting) {
        _activateWaiting(reg);
      }
    }).catch(function() {});
  });
}
