/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
'use strict';

// ─── ONBOARDING COMPLETE (P10) ───────────────────────────────────────────────
// Affiche un écran de bienvenue personnalisé UNE SEULE FOIS, après que
// l'utilisateur a renseigné au moins : prénom, objectif, et un programme.
// Stocke mtd_onboarding_done = true en localStorage quand terminé.
// Expose window.OnboardingComplete = { check }
// ─────────────────────────────────────────────────────────────────────────────

(function() {

  var DONE_KEY = 'mtd_onboarding_done';
  var _showing = false;

  // Retourne true si l'utilisateur a les données minimales pour l'onboarding
  function hasMinProfile() {
    var s = window.S;
    if (!s) return false;
    var hasName    = true; // Prénom optionnel — ne bloque pas l'overlay de fin d'onboarding
    // Mode sport-only : pas de S.goal (concept nutrition) — accepter si sportType + sportProgram
    var hasGoal    = (s.goal !== null && s.goal !== undefined) || (s.appMode === 'sport' && !!s.sportType);
    // FIX P1 contre-audit : `!!s.weekPlan` considérait `[]` comme truthy → overlay s'affichait
    // avec plan nutrition vide. Vérification explicite de length.
    var _hasNutritionPlan = Array.isArray(s.weekPlan) && s.weekPlan.length > 0;
    var _hasSportPlan = Array.isArray(s.sportProgram) && s.sportProgram.length > 0;
    var hasPlan = _hasNutritionPlan || _hasSportPlan;
    return hasName && hasGoal && hasPlan;
  }

  // Retourne le prénom à afficher
  function getFirstName() {
    var s = window.S;
    if (s && s.prenom) return s.prenom;
    var user = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null;
    // FIX P0 stability 2026-04-17 : guard typeof avant .split()
    if (user && typeof user.name === 'string' && user.name.trim()) {
      var _parts = user.name.trim().split(/\s+/);
      if (_parts[0]) return _parts[0];
    }
    return '';
  }

  // Retourne le nom de l'objectif
  function getGoalName() {
    var s = window.S;
    if (!s || s.goal === null || s.goal === undefined) return '';
    var goals = window.GOALS;
    if (goals && goals[s.goal]) return goals[s.goal].name;
    return '';
  }

  // Retourne les calories cibles
  function getCaloriesTarget() {
    // Essayer calcTarget global d'abord
    if (window.calcTarget) {
      try { var c = window.calcTarget(); if (c && c > 0) return c; } catch(e) {}
    }
    // Fallback sur S._nm
    var s = window.S;
    if (s) {
      if (s._nm && s._nm.caloriesTarget > 0) return s._nm.caloriesTarget;
      if (s.caloriesTarget && s.caloriesTarget > 0) return s.caloriesTarget;
    }
    return 0;
  }

  // Retourne les protéines cibles (g)
  function getProteinTarget() {
    if (window.calcMacros) {
      try { var m = window.calcMacros(); if (m && m.p > 0) return Math.round(m.p); } catch(e) {}
    }
    var s = window.S;
    if (s && s._nm && s._nm.protein > 0) return Math.round(s._nm.protein);
    return 0;
  }

  // Retourne le nom du sport
  function getSportTypeName() {
    var s = window.S;
    if (!s || !s.sportType) return '';
    var MAP = {
      'musculation': 'Musculation',
      'crossfit':    'CrossFit',
      'running':     'Running',
      'hyrox':       'Hyrox',
      'padel':       'Padel',
      'golf':        'Golf',
      'triathlon':   'Triathlon',
      'cycling':     'Cyclisme',
      'calisthenics':'Calisthenics',
      'yoga':        'Yoga'
    };
    return MAP[s.sportType] || s.sportType;
  }

  // Construit et affiche l'overlay
  function showOnboardingScreen() {
    var overlay = document.createElement('div');
    overlay.id = 'onboarding-complete-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'z-index:9000', 'background:var(--ivory,#FAF9F6)',
      'display:flex', 'flex-direction:column', 'align-items:center',
      'justify-content:center', 'padding:40px 24px',
      'overflow-y:auto', '-webkit-overflow-scrolling:touch',
      'opacity:0', 'transition:opacity .4s ease'
    ].join(';');

    var inner = document.createElement('div');
    inner.style.cssText = [
      'width:100%', 'max-width:480px', 'text-align:center'
    ].join(';');

    // Logo
    var logo = document.createElement('div');
    logo.className = 'splash-logo';
    logo.style.cssText = [
      'font-family:Georgia,serif', 'font-size:11px', 'letter-spacing:8px',
      'text-transform:uppercase', 'color:var(--black,#0A0A09)',
      'margin-bottom:40px', 'opacity:1', 'animation:none'
    ].join(';');
    logo.textContent = 'SMARTFITCOACH';
    inner.appendChild(logo);

    // Titre de bienvenue
    var firstName = getFirstName();
    var welcome = document.createElement('div');
    welcome.style.cssText = [
      'font-family:Georgia,serif', 'font-size:24px', 'font-weight:normal',
      'letter-spacing:-0.5px', 'line-height:1.3', 'margin-bottom:8px',
      'color:var(--black,#0A0A09)'
    ].join(';');
    var _ocEN = window.isEnglish && window.isEnglish();
    welcome.textContent = firstName ? ((_ocEN ? 'Welcome, ' : 'Bienvenue, ') + firstName + '.') : (_ocEN ? 'Welcome.' : 'Bienvenue.');
    inner.appendChild(welcome);

    var subtitle = document.createElement('div');
    subtitle.style.cssText = [
      'font-family:Georgia,serif', 'font-style:italic', 'font-size:16px',
      'color:var(--grey,#6B6B65)', 'margin-bottom:40px'
    ].join(';');
    subtitle.textContent = _ocEN ? 'Your plan is ready.' : 'Votre plan est prêt.';
    inner.appendChild(subtitle);

    // Ligne séparatrice
    inner.appendChild(_makeDivider());

    // Bloc objectif
    var goalName = getGoalName();
    if (goalName) {
      var goalBlock = _makeBlock(_ocEN ? 'YOUR GOAL' : 'VOTRE OBJECTIF', goalName);
      inner.appendChild(goalBlock);
    }

    // Bloc programme
    var kcal     = getCaloriesTarget();
    var protein  = getProteinTarget();
    var sport    = getSportTypeName();
    var sportDays = (window.S && window.S.sportDays) ? window.S.sportDays : 0;

    var progLines = [];
    if (kcal > 0) {
      var nutritionLine = kcal + ' kcal/jour';
      if (protein > 0) nutritionLine += ' · ' + protein + 'g ' + (_ocEN ? 'protein' : 'protéines');
      progLines.push((_ocEN ? 'Nutrition: ' : 'Nutrition : ') + nutritionLine);
    }
    if (sport) {
      var sportLine = sport;
      if (sportDays > 0) sportLine = sportDays + ' ' + (window.locPlural ? window.locPlural(sportDays, {fr:{one:'séance',other:'séances'},en:{one:'workout',other:'workouts'}}) : (sportDays > 1 ? 'séances' : 'séance')) + '/' + (window.isEnglish && window.isEnglish() ? 'week' : 'semaine') + ' · ' + sport;
      progLines.push((_ocEN ? 'Training: ' : 'Sport : ') + sportLine);
    }

    if (progLines.length > 0) {
      var progBlock = _makeBlock(_ocEN ? 'YOUR PROGRAM' : 'VOTRE PROGRAMME', progLines.join('\n'));
      inner.appendChild(progBlock);
    }

    // Citation
    var quote = document.createElement('div');
    quote.style.cssText = [
      'font-family:Georgia,serif', 'font-style:italic', 'font-size:14px',
      'color:var(--grey,#6B6B65)', 'margin:24px 0', 'line-height:1.7'
    ].join(';');
    quote.textContent = _ocEN ? '"There is no standard."' : '"Le standard n\'existe pas."';
    inner.appendChild(quote);

    // Ligne séparatrice basse
    inner.appendChild(_makeDivider());

    // Bouton CTA
    var cta = document.createElement('button');
    cta.type = 'button';
    cta.style.cssText = [
      'display:block', 'width:100%', 'max-width:320px',
      'margin:32px auto 0',
      'background:var(--accent,#1A4A1A)', 'color:var(--ivory,#FAF9F6)',
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:11px',
      'letter-spacing:2px', 'text-transform:uppercase',
      'padding:14px', 'border:none',
      'border-radius:2px', 'cursor:pointer'
    ].join(';');
    cta.textContent = _ocEN ? 'Start now →' : 'Commencer maintenant →';
    cta.addEventListener('click', function() {
      _markDone();
      _closeOverlay(overlay);
    });
    inner.appendChild(cta);

    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    // Fade in
    requestAnimationFrame(function() {
      overlay.style.opacity = '1';
    });
  }

  function _makeDivider() {
    var d = document.createElement('div');
    d.style.cssText = [
      'width:48px', 'height:1px',
      'background:var(--black,#0A0A09)',
      'margin:0 auto 32px'
    ].join(';');
    return d;
  }

  function _makeBlock(eyebrow, content) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom:24px;text-align:center';

    var ey = document.createElement('div');
    ey.style.cssText = [
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:9px',
      'letter-spacing:4px', 'text-transform:uppercase',
      'color:var(--grey,#6B6B65)', 'margin-bottom:8px'
    ].join(';');
    ey.textContent = eyebrow;
    wrap.appendChild(ey);

    var lines = content.split('\n');
    lines.forEach(function(line) {
      var p = document.createElement('div');
      p.style.cssText = [
        'font-family:Georgia,serif', 'font-size:15px',
        'color:var(--black,#0A0A09)', 'line-height:1.6', 'margin-bottom:4px'
      ].join(';');
      p.textContent = line;
      wrap.appendChild(p);
    });

    return wrap;
  }

  function _markDone() {
    try { localStorage.setItem(DONE_KEY, 'true'); } catch(e) {}
  }

  function _closeOverlay(overlay) {
    _showing = false;
    overlay.style.opacity = '0';
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 450);
  }

  // ── API publique ──────────────────────────────────────────────────────────

  window.OnboardingComplete = {
    check: function() {
      // Doit être authentifié — évite l'affichage après suppression de compte
      if (!window.AUTH || !window.AUTH.isLoggedIn || !window.AUTH.isLoggedIn()) return;
      // Déjà vu ?
      try { if (localStorage.getItem(DONE_KEY) === 'true') return; } catch(e) { return; }
      // Profil insuffisant ?
      if (!hasMinProfile()) return;
      // FIX CRITIQUE 2026-04-15 : bug user report "repas pris s'additionne au besoin calorique".
      // Cause : cet overlay s'empile à CHAQUE render (ex: clic "Marquer pris" → render).
      // Après 4 clics : 5 overlays superposés avec "VOTRE OBJECTIF — Nutrition : X kcal/jour"
      // répétés verticalement. L'user perçoit "ça s'additionne".
      // Fix : dédup par ID avant de monter.
      if (_showing || document.getElementById('onboarding-complete-overlay')) return;
      _showing = true;
      // Afficher l'écran
      showOnboardingScreen();
    }
  };

})();
