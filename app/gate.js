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
  var _lockedUntil = (function(){ try { return parseInt(sessionStorage.getItem('_gateLockedUntil')||'0',10)||0; } catch(e){ return 0; } })();
  var _isEN = (function(){ try { var p = JSON.parse(localStorage.getItem('sfc_profile') || '{}'); return (p.lang || 'fr') === 'en'; } catch(e) { return false; } })();

  // Capacitor bridge retry counter — the bridge initialises asynchronously when the
  // WebView loads from a remote server.url; window.Capacitor may not yet exist at
  // DOMContentLoaded. We retry up to 10 × 50 ms (= 500 ms) before falling back to
  // the normal web gate flow.
  var _capRetries = 0;

  function checkGate(){
    // Capacitor bridge not yet ready — retry
    if (typeof window.Capacitor === 'undefined' && _capRetries < 10) {
      _capRetries++;
      setTimeout(checkGate, 50);
      return;
    }
    // Skip beta gate entirely when running inside Capacitor (iOS/Android native app)
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
      unlock(); return;
    }
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
    // Bypass gate for Supabase password recovery links — validate JWT format (3 base64url segments)
    if (window.location.hash && window.location.hash.indexOf('type=recovery') !== -1) {
      var _atIdx = window.location.hash.indexOf('access_token=');
      if (_atIdx !== -1) {
        var _atVal = window.location.hash.slice(_atIdx + 13).split('&')[0];
        if (/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(_atVal)) { unlock(); return; }
      }
    }
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
    try { var _stored = parseInt(sessionStorage.getItem('_gateLockedUntil')||'0',10)||0; if (_stored > _lockedUntil) _lockedUntil = _stored; } catch(e) {}
    if (now < _lockedUntil) {
      var err=document.getElementById('gate-error');
      if (err) { err.style.display='block'; err.textContent=_isEN ? 'Too many attempts. Please wait a few seconds.' : 'Trop de tentatives. Attendez quelques secondes.'; }
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
          try { sessionStorage.setItem('_gateLockedUntil', _lockedUntil); } catch(e) {}
          _attempts = 0;
        }
        var err=document.getElementById('gate-error');
        if (err) { err.style.display='block'; err.textContent=_isEN ? 'Incorrect password' : 'Mot de passe incorrect'; }
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

  // ─── Pré-inscription early-member (overlay popup) ─────────────────
  // Complètement isolé du flow mot-de-passe. Tout échec ici n'affecte
  // jamais la gate principale ni l'app (try/catch systématiques).
  var _preLock = false; // anti double-submit
  function setupPreregister(){
    try {
      var link    = document.getElementById('gate-preregister-link');
      var overlay = document.getElementById('gate-preregister-overlay');
      var modal   = document.getElementById('gate-preregister-modal');
      var closeBtn= document.getElementById('gate-preregister-close');
      var form    = document.getElementById('gate-preregister-form');
      var success = document.getElementById('gate-preregister-success');
      var errBox  = document.getElementById('gate-preregister-error');
      var submit  = document.getElementById('gate-preregister-submit');
      if(!link||!overlay||!modal||!form) return; // pas de popup sur cette page

      function showErr(msg){
        if(!errBox) return;
        errBox.textContent = msg;
        errBox.style.display = 'block';
      }
      function clearErr(){ if(errBox) errBox.style.display='none'; }

      function openModal(e){
        if(e) e.preventDefault();
        overlay.style.display='block';
        modal.style.display='block';
        // Force reflow avant transition pour que opacity:0 soit bien appliqué
        void modal.offsetWidth;
        requestAnimationFrame(function(){
          overlay.style.opacity='1';
          modal.style.opacity='1';
          modal.style.transform='translate(-50%,-50%) scale(1)';
        });
        var firstInput = document.getElementById('gate-pre-first');
        if(firstInput) setTimeout(function(){ try{firstInput.focus();}catch(_){}}, 380);
      }
      function closeModal(){
        overlay.style.opacity='0';
        modal.style.opacity='0';
        modal.style.transform='translate(-50%,-48%) scale(0.98)';
        setTimeout(function(){
          overlay.style.display='none';
          modal.style.display='none';
        }, 360);
      }

      link.addEventListener('click', openModal);
      if(closeBtn) closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', closeModal);
      document.addEventListener('keydown', function(e){
        if(e.key==='Escape' && modal.style.display==='block') closeModal();
      });

      // Focus style fin Hermès : underline noir au focus
      var inputs = form.querySelectorAll('input');
      for(var i=0;i<inputs.length;i++){
        (function(inp){
          inp.addEventListener('focus', function(){ inp.style.borderBottomColor = '#1A1A1A'; });
          inp.addEventListener('blur',  function(){ inp.style.borderBottomColor = '#E0E0DA'; });
        })(inputs[i]);
      }

      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(_preLock) return;
        clearErr();

        var data = {
          first_name: (document.getElementById('gate-pre-first').value||'').trim(),
          last_name:  (document.getElementById('gate-pre-last').value||'').trim(),
          email:      (document.getElementById('gate-pre-email').value||'').trim(),
          phone:      (document.getElementById('gate-pre-phone').value||'').trim()
        };

        // Validation côté client — minimaliste, la function Netlify revalide
        if(!data.first_name || !data.last_name){ showErr(_isEN ? 'First name and last name are required.' : 'Prénom et nom requis.'); return; }
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){ showErr(_isEN ? 'Invalid email address.' : 'Adresse email invalide.'); return; }

        _preLock = true;
        if(submit){
          submit.disabled = true;
          submit.textContent = 'Envoi en cours…';
          submit.style.opacity = '0.7';
        }

        fetch('/.netlify/functions/preregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function(res){
          return res.json().then(function(body){ return { ok: res.ok, body: body, status: res.status }; });
        }).then(function(r){
          if(r.ok){
            form.style.display = 'none';
            if(success) success.style.display = 'block';
          } else {
            _preLock = false;
            if(submit){ submit.disabled=false; submit.textContent=_isEN ? 'Join the circle' : 'Rejoindre le cercle'; submit.style.opacity='1'; }
            var msg = (r.body && r.body.error) || (_isEN ? 'An error occurred. Please try again.' : 'Une erreur est survenue. Merci de réessayer.');
            if(r.status===409) msg = _isEN ? 'You are already among the first registered.' : 'Vous figurez déjà parmi les premiers inscrits.';
            showErr(msg);
          }
        }).catch(function(){
          _preLock = false;
          if(submit){ submit.disabled=false; submit.textContent=_isEN ? 'Join the circle' : 'Rejoindre le cercle'; submit.style.opacity='1'; }
          showErr(_isEN ? 'Connection failed. Check your network.' : 'Connexion impossible. Vérifiez votre réseau.');
        });
      });
    } catch(err) {
      // Log silencieux — ne doit jamais bloquer la gate
      try { console.warn('[gate-preregister] init failed:', err && err.message); } catch(_){}
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', function(){ checkGate(); setupPreregister(); });
  } else {
    checkGate();
    setupPreregister();
  }
})();
