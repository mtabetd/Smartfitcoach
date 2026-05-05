/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// Global error boundary — catch unhandled JS errors and show user-friendly message
function _getLang() {
  try {
    if (window.S && window.S.lang) return window.S.lang;
    var _uid = localStorage.getItem('mtd_uid') || '';
    var _key = _uid ? ('mtd_profile_' + _uid) : null;
    if (_key) { var p = JSON.parse(localStorage.getItem(_key) || '{}'); if (p.lang) return p.lang; }
    return 'fr';
  } catch(e) { return 'fr'; }
}
function _showErrorPage(msg) {
  var app = document.getElementById('app');
  if (!app) return;
  var _isEN = _getLang() === 'en';
  var wrap = document.createElement('div');
  wrap.style.cssText = [
    'min-height:100vh;display:flex;align-items:center;justify-content:center;',
    'background:var(--ivory,#FAF9F6);padding:40px 24px;box-sizing:border-box;'
  ].join('');
  var inner = document.createElement('div');
  inner.style.cssText = 'max-width:360px;width:100%;text-align:center;';
  var eyebrow = document.createElement('div');
  eyebrow.style.cssText = [
    'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;',
    'text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:24px;'
  ].join('');
  eyebrow.textContent = _isEN ? 'SESSION' : 'SESSION';
  var h2 = document.createElement('h2');
  h2.style.cssText = [
    'font-family:Georgia,serif;font-size:26px;font-weight:400;line-height:1.25;',
    'color:var(--black,#0A0A09);margin:0 0 16px;'
  ].join('');
  h2.textContent = _isEN ? 'An interruption occurred' : 'Une interruption est survenue';
  var p = document.createElement('p');
  p.style.cssText = [
    'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:300;',
    'color:var(--grey,#6B6B65);line-height:1.65;margin:0 0 32px;'
  ].join('');
  p.textContent = _isEN
    ? 'Your session has been secured. You can retry or return to the home screen.'
    : 'Nous avons sécurisé votre session. Vous pouvez réessayer ou revenir à l\'accueil.';
  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
  var btnPrimary = document.createElement('button');
  btnPrimary.style.cssText = [
    'padding:14px 24px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);',
    'border:none;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;',
    'font-size:9px;letter-spacing:3px;text-transform:uppercase;min-height:44px;border-radius:0;'
  ].join('');
  btnPrimary.textContent = _isEN ? 'Retry' : 'Réessayer';
  btnPrimary.addEventListener('click', function() { location.reload(); });
  var btnSecondary = document.createElement('button');
  btnSecondary.style.cssText = [
    'padding:14px 24px;background:transparent;color:var(--grey,#6B6B65);',
    'border:1px solid var(--border,#D8D8D0);cursor:pointer;',
    'font-family:"Helvetica Neue",Arial,sans-serif;',
    'font-size:9px;letter-spacing:3px;text-transform:uppercase;min-height:44px;border-radius:0;'
  ].join('');
  btnSecondary.textContent = _isEN ? 'Back to home' : 'Retour à l\'accueil';
  btnSecondary.addEventListener('click', function() {
    try {
      if (window.S) window.S.view = 'today';
      if (window.render) window.render();
      else location.href = '/';
    } catch(e) { location.href = '/'; }
  });
  btnRow.appendChild(btnPrimary);
  btnRow.appendChild(btnSecondary);
  inner.appendChild(eyebrow);
  inner.appendChild(h2);
  inner.appendChild(p);
  inner.appendChild(btnRow);
  wrap.appendChild(inner);
  app.innerHTML = '';
  app.appendChild(wrap);
}
// Preserve any previously-installed onerror (e.g. crash-reporter.js). Without
// this chain, the assignment below silently drops crash telemetry from every
// subsequent error — reporter.js just gets overwritten.
var _prevOnError = window.onerror;
var _BENIGN_ERRORS = /ResizeObserver loop|Script error\.|Non-Error promise rejection|Loading chunk|Loading CSS chunk/i;
window.onerror = function(msg, url, line, col, err) {
  if (typeof _prevOnError === 'function') {
    try { _prevOnError.call(this, msg, url, line, col, err); } catch (_) {}
  }
  if (_BENIGN_ERRORS.test(String(msg))) { console.warn('[error-boundary] benign error suppressed:', msg); return false; }
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
