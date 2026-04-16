/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// Global error boundary — catch unhandled JS errors and show user-friendly message
// FIX 2026-04-16 — couleurs CSS variables (dark mode compatible), createElement au lieu de innerHTML
function _showErrorPage(msg) {
  var app = document.getElementById('app');
  if (!app) return;
  var wrap = document.createElement('div');
  wrap.style.cssText = 'padding:40px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif';
  var h2 = document.createElement('h2');
  h2.style.cssText = 'font-family:Georgia,serif;color:var(--black,#0A0A09)';
  h2.textContent = 'Une erreur est survenue';
  var p = document.createElement('p');
  p.style.cssText = 'color:var(--grey,#595953);margin:16px 0';
  p.textContent = msg || '';
  var btn = document.createElement('button');
  btn.style.cssText = 'padding:10px 24px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;cursor:pointer;font-size:14px;min-height:44px';
  btn.textContent = 'Recharger';
  btn.addEventListener('click', function(){ location.reload(); });
  wrap.appendChild(h2);
  wrap.appendChild(p);
  wrap.appendChild(btn);
  app.innerHTML = '';
  app.appendChild(wrap);
}
window.onerror = function(msg, url, line, col, err) {
  _showErrorPage(msg);
  console.error('GLOBAL ERROR:', msg, url, line, col, err);
  return true;
};
window.addEventListener('unhandledrejection', function(event) {
  var reason = event.reason;
  var msg = (reason && reason.message) ? reason.message : String(reason || 'Promise rejection');
  console.error('UNHANDLED PROMISE REJECTION:', reason);
  _showErrorPage(msg);
});
