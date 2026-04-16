/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js', {scope: './'}).then(function(reg) {
      // Check for updates every 30 minutes (browser default is 24h)
      setInterval(function() { reg.update(); }, 30 * 60 * 1000);
      // Detect new SW version installed
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — show a discreet banner
            try {
              var banner = document.createElement('div');
              banner.setAttribute('style', 'position:fixed;bottom:0;left:0;right:0;background:#1A1A18;color:#FAF9F6;padding:12px 16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;display:flex;align-items:center;justify-content:space-between;z-index:99999;');
              banner.innerHTML = '<span>Nouvelle version disponible</span>';
              var btn = document.createElement('button');
              btn.setAttribute('style', 'background:#FAF9F6;color:#1A1A18;border:none;padding:8px 16px;font-size:12px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;min-height:44px;');
              btn.textContent = 'Mettre \u00e0 jour';
              btn.addEventListener('click', function() { window.location.reload(); });
              banner.appendChild(btn);
              document.body.appendChild(banner);
            } catch(e) {}
          }
        });
      });
    }).catch(function(err) {
      console.warn('[SW] Registration failed:', err);
    });
  });
  // Auto-reload when new SW takes control
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (document.visibilityState === 'visible') window.location.reload();
  });
}
