/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
// pwa-install.js — Prompt d'installation PWA
// Module isolé : écoute l'événement navigateur, affiche un bandeau élégant
(function() {
'use strict';

var _deferredPrompt = null;
var _dismissed = false;

// Capturer l'événement beforeinstallprompt (Chrome/Edge/Samsung)
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _deferredPrompt = e;
  // Attendre 30 secondes avant d'afficher (pas agressif)
  setTimeout(function() {
    if (!_dismissed && _deferredPrompt) showBanner();
  }, 30000);
});

function showBanner() {
  if (document.getElementById('pwa-install-banner')) return;

  var banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);max-width:360px;width:90%;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border-radius:2px;padding:16px 20px;box-shadow:0 8px 24px rgba(10,10,9,0.2);z-index:9200;opacity:0;transition:opacity 0.3s ease;font-family:"Helvetica Neue",Arial,sans-serif;';

  var text = document.createElement('div');
  text.style.cssText = 'font-size:13px;line-height:1.5;margin-bottom:12px;';
  text.textContent = 'Ajoutez SmartFitCoach \u00e0 votre \u00e9cran d\u2019accueil pour un acc\u00e8s rapide.';
  banner.appendChild(text);

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;';

  var installBtn = document.createElement('button');
  installBtn.style.cssText = 'flex:1;padding:10px;background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;cursor:pointer;min-height:44px;';
  installBtn.textContent = 'Installer';
  installBtn.onclick = function() {
    if (_deferredPrompt) {
      _deferredPrompt.prompt();
      _deferredPrompt.userChoice.then(function() {
        _deferredPrompt = null;
        removeBanner();
      });
    }
  };
  btnRow.appendChild(installBtn);

  var dismissBtn = document.createElement('button');
  dismissBtn.style.cssText = 'padding:10px 16px;background:transparent;color:var(--ivory,#FAF9F6);border:1px solid rgba(250,249,246,0.3);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;cursor:pointer;min-height:44px;';
  dismissBtn.textContent = 'Plus tard';
  dismissBtn.onclick = function() {
    _dismissed = true;
    removeBanner();
  };
  btnRow.appendChild(dismissBtn);

  banner.appendChild(btnRow);
  document.body.appendChild(banner);

  requestAnimationFrame(function() { banner.style.opacity = '1'; });
}

function removeBanner() {
  var b = document.getElementById('pwa-install-banner');
  if (b) {
    b.style.opacity = '0';
    setTimeout(function() { if (b.parentNode) b.parentNode.removeChild(b); }, 300);
  }
}

})();
