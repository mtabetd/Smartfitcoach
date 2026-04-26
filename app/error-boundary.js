/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// Global error boundary — catch unhandled JS errors and show user-friendly message
function _getLang() {
  try { var p = JSON.parse(localStorage.getItem('sfc_profile') || '{}'); return p.lang || 'fr'; } catch(e) { return 'fr'; }
}
function _showErrorPage(msg) {
  var app = document.getElementById('app');
  if (!app) return;
  var _isEN = _getLang() === 'en';
  var wrap = document.createElement('div');
  wrap.style.cssText = 'padding:40px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif';
  var h2 = document.createElement('h2');
  h2.style.cssText = 'font-family:Georgia,serif;color:var(--black,#0A0A09)';
  h2.textContent = _isEN ? 'An error occurred' : 'Une erreur est survenue';
  var p = document.createElement('p');
  p.style.cssText = 'color:var(--grey,#595953);margin:16px 0';
  p.textContent = _isEN ? 'An unexpected error occurred. Please reload the page.' : 'Une erreur inattendue s\'est produite. Rechargez la page.';
  var btn = document.createElement('button');
  btn.style.cssText = 'padding:10px 24px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;cursor:pointer;font-size:14px;min-height:44px';
  btn.textContent = _isEN ? 'Reload' : 'Recharger';
  btn.addEventListener('click', function(){ location.reload(); });
  wrap.appendChild(h2);
  wrap.appendChild(p);
  wrap.appendChild(btn);
  app.innerHTML = '';
  app.appendChild(wrap);
}
// Preserve any previously-installed onerror (e.g. crash-reporter.js). Without
// this chain, the assignment below silently drops crash telemetry from every
// subsequent error — reporter.js just gets overwritten.
var _prevOnError = window.onerror;
window.onerror = function(msg, url, line, col, err) {
  if (typeof _prevOnError === 'function') {
    try { _prevOnError.call(this, msg, url, line, col, err); } catch (_) {}
  }
  _showErrorPage(msg);
  console.error('GLOBAL ERROR:', msg, url, line, col, err);
  return true;
};
window.addEventListener('unhandledrejection', function(event) {
  var reason = event.reason;
  var msg = (reason && reason.message) ? reason.message : String(reason || 'Promise rejection');
  console.error('UNHANDLED PROMISE REJECTION:', reason);
  try { _showErrorPage(msg); } catch(e) { console.error('[error-boundary] _showErrorPage failed:', e); }
  event.preventDefault();
});

// Skip-nav accessibility — moved from inline handlers (CSP compliance)
(function() {
  var _initSkipNav = function() {
    var skip = document.getElementById('skip-nav-link');
    if (!skip) return;
    skip.addEventListener('focus', function() {
      skip.style.position = 'fixed';
      skip.style.left = '0';
      skip.style.top = '0';
      skip.style.width = 'auto';
      skip.style.height = 'auto';
      skip.style.overflow = 'visible';
    });
    skip.addEventListener('blur', function() {
      skip.style.position = 'absolute';
      skip.style.left = '-9999px';
      skip.style.width = '1px';
      skip.style.height = '1px';
      skip.style.overflow = 'hidden';
    });
  };
  // Update data-fr/data-en elements based on detected language
  var _initI18nStatic = function() {
    var isEN = _getLang() === 'en';
    var attr = isEN ? 'data-en' : 'data-fr';
    var els = document.querySelectorAll('[data-fr][data-en]');
    for (var i = 0; i < els.length; i++) {
      var val = els[i].getAttribute(attr);
      if (val) els[i].textContent = val;
    }
  };
  var _init = function() { _initSkipNav(); _initI18nStatic(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }
})();
