/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
(function(){
  // NOTE: This gate is a lightweight access control for beta/preview — not a substitute for
  // server-side authentication. The Supabase auth layer is the real security boundary.
  var GATE_KEY='mtd_gate_access';
  // Hash stored as sessionStorage token — not the raw password, and cleared on tab close.
  // Use Web Crypto subtle hash so the password cannot be extracted from source trivially.
  var GATE_HASH='1gs8uk7'; // FNV-based hash — validated via crypto below
  var GATE_HASH_LEGACY='b7e2g90d3f';

  // Use Web Crypto subtle to derive a session token from the entered password.
  // Falls back to simpleHash for browsers without crypto.subtle.
  function simpleHash(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h;}return(h>>>0).toString(36).slice(0,10);}

  function verifyPasswordAsync(pw) {
    // Prefer Web Crypto SHA-256 — if not available, fall back to simpleHash
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      var enc = new window.TextEncoder();
      return window.crypto.subtle.digest('SHA-256', enc.encode(pw + 'sfc_gate_2024'))
        .then(function(buf) {
          var hex = Array.from(new Uint8Array(buf)).map(function(b){ return ('00'+b.toString(16)).slice(-2); }).join('');
          // Check against SHA-256 of correct password — stored as constant, not inline
          return hex === GATE_SHA256;
        }).catch(function() {
          return simpleHash(pw) === GATE_HASH;
        });
    }
    return Promise.resolve(simpleHash(pw) === GATE_HASH);
  }

  // SHA-256 pre-computed hash — do NOT put the raw password in source code
  var GATE_SHA256 = '910a9f0191b598ef2056c288cf9bcb3ae67ec1d94c30349a48ec9025e0743c3b';

  // Brute-force protection: max attempts per session
  var _attempts = 0;
  var MAX_ATTEMPTS = 5;
  var _lockedUntil = 0;

  function checkGate(){
    var stored;
    try { stored=sessionStorage.getItem(GATE_KEY); } catch(e) { stored=null; }
    if(stored===GATE_HASH){unlock();return;}
    // Migrate from legacy localStorage to sessionStorage
    var legacy;
    try { legacy=localStorage.getItem(GATE_KEY); } catch(e) {}
    if(legacy===GATE_HASH||legacy===GATE_HASH_LEGACY){
      try{localStorage.removeItem(GATE_KEY);}catch(e){}
      // Do NOT auto-unlock from old localStorage token — require re-entry for security
    }
    var gateEl=document.getElementById('gate');
    var gateBtnEl=document.getElementById('gate-btn');
    var gatePwEl=document.getElementById('gate-pw');
    if(!gateEl||!gateBtnEl||!gatePwEl){unlock();return;}
    // Bypass gate for Supabase password recovery links — the reset token is the auth proof
    if (window.location.hash && window.location.hash.indexOf('type=recovery') !== -1) { unlock(); return; }
    gateEl.style.display='flex';
    gateBtnEl.addEventListener('click', tryUnlock);
    gatePwEl.addEventListener('keydown',function(e){if(e.key==='Enter')tryUnlock();});
    // Defense: prevent native form submission (which would navigate the page
    // and mask wrong-password errors). CSP blocks inline onsubmit handlers.
    var gateForm=document.getElementById('gate-form');
    if(gateForm){gateForm.addEventListener('submit',function(e){e.preventDefault();tryUnlock();});}
  }

  function tryUnlock(){
    var now = Date.now();
    if (now < _lockedUntil) {
      var err=document.getElementById('gate-error');
      if (err) { err.style.display='block'; err.textContent='Trop de tentatives. Attendez quelques secondes.'; }
      return;
    }
    var _pwEl = document.getElementById('gate-pw');
    if (!_pwEl) return;
    var pw=_pwEl.value;
    if (!pw) return;
    verifyPasswordAsync(pw).then(function(ok) {
      if(ok){
        try { sessionStorage.setItem(GATE_KEY,GATE_HASH); } catch(e){}
        unlock();
      } else {
        _attempts++;
        if (_attempts >= MAX_ATTEMPTS) {
          _lockedUntil = Date.now() + 30000; // 30s lockout
          _attempts = 0;
        }
        var err=document.getElementById('gate-error');
        if (err) { err.style.display='block'; err.textContent='Mot de passe incorrect'; }
        var _pwEl2 = document.getElementById('gate-pw');
        if (_pwEl2) { _pwEl2.value=''; _pwEl2.focus(); }
      }
    });
  }
  function unlock(){
    var g=document.getElementById('gate');
    var a=document.getElementById('app');
    if(g) g.style.display='none';
    if(a) a.style.display='block';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',checkGate);
  else checkGate();
})();
