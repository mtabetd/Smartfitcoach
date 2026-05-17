/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
'use strict';

// ─── AUTH BANNER (P1) ────────────────────────────────────────────────────────
// Affiche une bannière persistante invitant à créer un compte si l'utilisateur
// n'est pas connecté via Supabase (session anonyme / localStorage only).
// Expose window.AuthBanner = { render, hide }
// ─────────────────────────────────────────────────────────────────────────────

(function() {

  var DISMISS_KEY   = 'mtd_auth_banner_dismissed';
  var DISMISS_TTL   = 24 * 60 * 60 * 1000; // 24 h en ms
  var _bannerEl     = null;
  var _modalEl      = null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function isDismissed() {
    try {
      var raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      return (Date.now() - ts) < DISMISS_TTL;
    } catch(e) { return false; }
  }

  function setDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch(e) {}
  }

  function clearDismissed() {
    try { localStorage.removeItem(DISMISS_KEY); } catch(e) {}
  }

  // Vérifie si l'utilisateur a une vraie session Supabase (non anonyme)
  function isRealAccount() {
    if (!window.AUTH) return false;
    // AUTH.isLoggedIn() is true only when a real session exists
    // (see auth.js: _currentSession !== null)
    if (!window.AUTH.isLoggedIn()) return false;
    // Make sure it's not an anon fallback session
    var user = window.AUTH.getUser();
    if (!user || !user.email) return false;
    return true;
  }

  // Toast léger
  function showToast(msg) {
    var toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
      'background:var(--ink-900,#0A0A09)', 'color:var(--paper,#FAF9F6)',
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:9px',
      'letter-spacing:3px', 'text-transform:uppercase',
      'padding:12px 24px', 'border-radius:0',
      'border:1px solid var(--ink-900,#0A0A09)',
      'z-index:10100',
      'max-width:90vw', 'text-align:center', 'opacity:0',
      'transition:opacity .3s ease'
    ].join(';');
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.style.opacity = '1'; });
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
    }, 4000);
  }

  // ── Modal signup ──────────────────────────────────────────────────────────

  function openSignupModal() {
    if (_modalEl) return;

    var overlay = document.createElement('div');
    overlay.id = 'auth-banner-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    var _abEN = window.isEnglish && window.isEnglish();
    overlay.setAttribute('aria-label', _abEN ? 'Create an account' : 'Créer un compte');
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(10,10,9,.55)', 'z-index:10050',
      'display:flex', 'align-items:flex-end', 'justify-content:center',
      'opacity:0', 'transition:opacity .2s ease'
    ].join(';');

    var sheet = document.createElement('div');
    sheet.style.cssText = [
      'background:var(--paper,#FAF9F6)', 'width:100%', 'max-width:600px',
      'border-radius:0', 'border-top:1px solid var(--line,#D8D8D0)',
      'padding:32px 24px 40px',
      'transform:translateY(100%)', 'transition:transform .25s ease',
      'max-height:90vh', 'overflow-y:auto'
    ].join(';');

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:24px';

    var title = document.createElement('div');
    title.style.cssText = 'font-family:Georgia,serif;font-size:20px;font-weight:normal';
    title.textContent = _abEN ? 'Create your account' : 'Créer votre compte';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', _abEN ? 'Close' : 'Fermer');
    closeBtn.style.cssText = [
      'width:44px', 'height:44px', 'background:transparent',
      'border:none', 'border-radius:0',
      'cursor:pointer', 'font-size:18px', 'color:var(--ink-500,#6B6B65)',
      'display:flex', 'align-items:center', 'justify-content:center'
    ].join(';');
    closeBtn.textContent = '×';

    header.appendChild(title);
    header.appendChild(closeBtn);
    sheet.appendChild(header);

    // Sous-titre
    var sub = document.createElement('p');
    sub.style.cssText = [
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:11px',
      'color:var(--grey,#6B6B65)', 'margin-bottom:24px', 'line-height:1.6'
    ].join(';');
    sub.textContent = _abEN ? 'Your data will be backed up to the cloud and accessible on all your devices.' : 'Vos données seront sauvegardées sur le cloud et accessibles sur tous vos appareils.';
    sheet.appendChild(sub);

    // Formulaire
    var form = document.createElement('form');
    form.setAttribute('novalidate', '');
    form.style.cssText = 'display:flex;flex-direction:column;gap:0';

    // Champ prénom
    var f1 = _makeField(_abEN ? 'First name' : 'Prénom', 'text', 'given-name', _abEN ? 'Your first name' : 'Votre prénom');
    var nameInput = f1.querySelector('input');
    form.appendChild(f1);

    // Champ email
    var f2 = _makeField('Email', 'email', 'email', 'votre@email.com');
    var emailInput = f2.querySelector('input');
    form.appendChild(f2);

    // Champ mot de passe
    var f3 = _makeField(_abEN ? 'Password' : 'Mot de passe', 'password', 'new-password', 'Ex: Motdepasse1!');
    var pwInput = f3.querySelector('input');
    var pwHint = document.createElement('div');
    pwHint.style.cssText = 'font-size:10px;color:var(--grey,#6B6B65);margin-top:4px;display:none';
    pwHint.textContent = _abEN ? '6 chars min, 1 uppercase, 1 digit, 1 special character' : '6 caractères min, 1 majuscule, 1 chiffre, 1 caractère spécial';
    f3.appendChild(pwHint);
    pwInput.addEventListener('input', function() {
      pwHint.style.display = pwInput.value.length > 0 ? 'block' : 'none';
      var ok = window.isValidPassword && window.isValidPassword(pwInput.value);
      pwHint.style.color = ok ? 'var(--success,#2E7D32)' : 'var(--grey,#6B6B65)';
    });
    form.appendChild(f3);

    // Message d'erreur
    var errEl = document.createElement('div');
    errEl.style.cssText = [
      'display:none', 'font-family:"Helvetica Neue",Arial,sans-serif',
      'font-size:11px', 'color:var(--error,#7A1F1F)', 'padding:8px',
      'border:1px solid var(--error,#7A1F1F)', 'background:var(--redbg,rgba(122,31,31,.06))',
      'margin-bottom:12px', 'border-radius:0'
    ].join(';');
    form.appendChild(errEl);

    // Bouton submit
    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.style.cssText = [
      'width:100%', 'margin-top:8px', 'background:var(--black,#0A0A09)',
      'color:var(--paper,#FAF9F6)', 'font-family:"Helvetica Neue",Arial,sans-serif',
      'font-size:9px', 'letter-spacing:4px', 'text-transform:uppercase',
      'padding:14px', 'border:1px solid var(--black,#0A0A09)', 'border-radius:0',
      'min-height:44px', 'cursor:pointer'
    ].join(';');
    submitBtn.textContent = _abEN ? 'Create my account' : 'Créer mon compte';
    form.appendChild(submitBtn);

    // Submit handler
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name  = nameInput.value.trim();
      var email = emailInput.value.trim();
      var pw    = pwInput.value;

      errEl.style.display = 'none';

      if (!name || !email || !pw) {
        errEl.textContent = _abEN ? 'All fields are required.' : 'Tous les champs sont obligatoires.';
        errEl.style.display = 'block';
        return;
      }
      if (!window.isValidPassword || !window.isValidPassword(pw)) {
        errEl.textContent = _abEN ? 'Password must contain at least 6 characters, one uppercase letter, one digit and one special character.' : 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial.';
        errEl.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = _abEN ? 'Creating...' : 'Création...';

      if (!window.AUTH || !window.AUTH.register) {
        errEl.textContent = _abEN ? 'Authentication service unavailable.' : 'Service d\'authentification indisponible.';
        errEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = _abEN ? 'Create my account' : 'Créer mon compte';
        return;
      }

      window.AUTH.register(name, email, pw).then(function(result) {
        if (result && result.ok) {
          closeModal();
          window.AuthBanner.hide();
          clearDismissed();
          showToast(_abEN ? 'Your data is now backed up to the cloud!' : 'Vos données sont maintenant sauvegardées sur le cloud !');
          if (window.SupaSync) {
            try { window.SupaSync.saveProfile(); } catch(ex) {}
          }
          if (window.render) { try { window.render(); } catch(ex) {} }
        } else {
          var msg = (result && result.error) ? result.error : (_abEN ? 'Error creating account.' : 'Erreur lors de la création du compte.');
          errEl.textContent = msg;
          errEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = _abEN ? 'Create my account' : 'Créer mon compte';
        }
      }).catch(function(err) {
        errEl.textContent = _abEN ? 'Network error. Check your connection.' : 'Erreur réseau. Vérifiez votre connexion.';
        errEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = _abEN ? 'Create my account' : 'Créer mon compte';
      });
    });

    sheet.appendChild(form);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    _modalEl = overlay;

    function closeModal() {
      if (!_modalEl) return;
      _modalEl.style.opacity = '0';
      sheet.style.transform = 'translateY(100%)';
      setTimeout(function() {
        if (_modalEl && _modalEl.parentNode) _modalEl.parentNode.removeChild(_modalEl);
        _modalEl = null;
      }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });

    // Animate in
    requestAnimationFrame(function() {
      overlay.style.opacity = '1';
      sheet.style.transform = 'translateY(0)';
    });

    // Focus first input
    setTimeout(function() { nameInput.focus(); }, 300);
  }

  function _makeField(label, type, autocomplete, placeholder) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom:16px';

    var lbl = document.createElement('label');
    lbl.style.cssText = [
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:9px',
      'letter-spacing:4px', 'text-transform:uppercase',
      'color:var(--grey,#6B6B65)', 'display:block', 'margin-bottom:8px'
    ].join(';');
    lbl.textContent = label;

    var inp = document.createElement('input');
    inp.type = type;
    inp.autocomplete = autocomplete;
    inp.placeholder = placeholder;
    inp.style.cssText = [
      'width:100%', 'background:transparent', 'border:none',
      'border-bottom:1px solid var(--border,#D8D8D0)',
      'color:var(--black,#0A0A09)', 'font-family:"Helvetica Neue",Arial,sans-serif',
      'font-size:16px', 'font-weight:300', 'padding:10px 0', 'outline:none',
      'transition:border-color .2s'
    ].join(';');
    inp.addEventListener('focus', function() {
      inp.style.borderBottomColor = 'var(--black,#0A0A09)';
    });
    inp.addEventListener('blur', function() {
      inp.style.borderBottomColor = 'var(--border,#D8D8D0)';
    });

    var id = 'auth-banner-field-' + label.toLowerCase().replace(/\s/g, '-');
    lbl.setAttribute('for', id);
    inp.id = id;

    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    return wrap;
  }

  // ── Bannière ──────────────────────────────────────────────────────────────

  function createBanner() {
    var bar = document.createElement('div');
    bar.id = 'auth-save-banner';
    bar.setAttribute('role', 'banner');
    bar.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:10010',
      'background:var(--ink-900,#0A0A09)',
      'color:var(--paper,#FAF9F6)', 'display:flex', 'align-items:center',
      'justify-content:space-between', 'gap:12px',
      'padding:10px 16px', 'flex-wrap:wrap',
      'font-family:"Helvetica Neue",Arial,sans-serif',
      'font-size:11px', 'line-height:1.4',
      'border-bottom:1px solid var(--ink-700,#2B2B27)'
    ].join(';');

    // Texte
    var txt = document.createElement('span');
    txt.style.cssText = 'flex:1;min-width:200px';
    txt.textContent = (window.isEnglish && window.isEnglish()) ? 'Your data is only on this device. Create a free account to back it up.' : 'Vos données sont uniquement sur cet appareil. Créez un compte gratuit pour les sauvegarder.';
    bar.appendChild(txt);

    // Actions
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0';

    var ctaBtn = document.createElement('button');
    ctaBtn.type = 'button';
    ctaBtn.style.cssText = [
      'background:var(--paper,#FAF9F6)', 'color:var(--ink-900,#0A0A09)',
      'border:1px solid var(--paper,#FAF9F6)', 'border-radius:0',
      'font-family:"Helvetica Neue",Arial,sans-serif',
      'font-size:9px', 'letter-spacing:4px', 'text-transform:uppercase',
      'padding:8px 14px', 'min-height:36px', 'cursor:pointer', 'white-space:nowrap',
      'font-weight:400'
    ].join(';');
    ctaBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Create my account' : 'Créer mon compte';
    ctaBtn.addEventListener('click', openSignupModal);
    actions.appendChild(ctaBtn);

    var dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.setAttribute('aria-label', (window.isEnglish && window.isEnglish()) ? 'Dismiss banner' : 'Fermer la bannière');
    dismissBtn.style.cssText = [
      'background:transparent', 'border:none', 'color:var(--paper,#FAF9F6)',
      'font-size:18px', 'cursor:pointer', 'padding:4px 6px',
      'min-width:44px', 'min-height:36px', 'line-height:1', 'opacity:.8',
      'display:flex', 'align-items:center', 'justify-content:center'
    ].join(';');
    dismissBtn.textContent = '×';
    dismissBtn.addEventListener('click', function() {
      setDismissed();
      window.AuthBanner.hide();
    });
    actions.appendChild(dismissBtn);

    bar.appendChild(actions);
    return bar;
  }

  // ── API publique ──────────────────────────────────────────────────────────

  window.AuthBanner = {
    render: function(container) {
      // Ne pas afficher si déjà un compte réel
      if (isRealAccount()) return;
      // Ne pas afficher si dismissé récemment
      if (isDismissed()) return;
      // Ne pas afficher si bannière déjà présente
      if (document.getElementById('auth-save-banner')) return;

      _bannerEl = createBanner();
      // Insérer au début de body (avant tout contenu)
      var body = container || document.body;
      body.insertBefore(_bannerEl, body.firstChild);

      // Ajouter un padding-top au #app pour éviter que la bannière recouvre le contenu
      var appEl = document.getElementById('app');
      if (appEl) {
        var bannerH = _bannerEl.offsetHeight || 44;
        appEl.style.paddingTop = (bannerH + 4) + 'px';
      }
    },

    hide: function() {
      var existing = document.getElementById('auth-save-banner');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      _bannerEl = null;
      // Restaurer le padding
      var appEl = document.getElementById('app');
      if (appEl) appEl.style.paddingTop = '';
    },

    refresh: function() {
      window.AuthBanner.hide();
      window.AuthBanner.render(document.body);
    }
  };

})();
