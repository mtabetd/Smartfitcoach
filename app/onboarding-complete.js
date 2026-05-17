/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
'use strict';

// ─── ONBOARDING COMPLETE v2 (P10) ────────────────────────────────────────────
// 3-slide personalized welcome carousel shown ONCE after profile is complete.
// Slide 0: persona-adapted "Finally, an app that understands me" moment.
// Slide 1: plan summary (goal + nutrition + sport).
// Slide 2: feature teasers (Scanner, AI Coach, Calendar) + CTA.
//
// Stores mtd_onboarding_done = true in localStorage when dismissed.
// Exposes window.OnboardingComplete = { check }
// ─────────────────────────────────────────────────────────────────────────────

(function() {

  var DONE_KEY = 'mtd_onboarding_done';
  var _showing = false;

  // Returns true if the user has the minimum profile data to trigger the welcome
  function hasMinProfile() {
    var s = window.S;
    if (!s) return false;
    var hasGoal = (s.goal !== null && s.goal !== undefined) || (s.appMode === 'sport' && !!s.sportType);
    var _hasNutritionPlan = Array.isArray(s.weekPlan) && s.weekPlan.length > 0;
    var _hasSportPlan = (Array.isArray(s.sportProgram)     && s.sportProgram.length > 0) ||
      (Array.isArray(s.runningProgram)    && s.runningProgram.length > 0) ||
      (Array.isArray(s.hyroxProgram)      && s.hyroxProgram.length > 0) ||
      (Array.isArray(s.padelProgram)      && s.padelProgram.length > 0) ||
      (Array.isArray(s.golfProgram)       && s.golfProgram.length > 0) ||
      (Array.isArray(s.triathlonProgram)  && s.triathlonProgram.length > 0) ||
      (Array.isArray(s.cyclingProgram)    && s.cyclingProgram.length > 0) ||
      (Array.isArray(s.calisthenicsProgram) && s.calisthenicsProgram.length > 0) ||
      (s.sportType === 'yoga'     && !!s.yogaLevel    && !!s.yogaObjectif) ||
      (s.sportType === 'crossfit' && !!s.crossfitLevel);
    return hasGoal && (_hasNutritionPlan || _hasSportPlan);
  }

  function getFirstName() {
    var s = window.S;
    if (s && s.prenom) return s.prenom;
    var user = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null;
    if (user && typeof user.name === 'string' && user.name.trim()) {
      var parts = user.name.trim().split(/\s+/);
      if (parts[0]) return parts[0];
    }
    return '';
  }

  function getGoalName() {
    var s = window.S;
    if (!s || s.goal === null || s.goal === undefined) return '';
    var goals = window.GOALS;
    if (goals && goals[s.goal]) return goals[s.goal].name;
    return '';
  }

  function getCaloriesTarget() {
    if (window.calcTarget) {
      try { var c = window.calcTarget(); if (c && c > 0) return c; } catch(e) {}
    }
    var s = window.S;
    if (s) {
      if (s._nm && s._nm.caloriesTarget > 0) return s._nm.caloriesTarget;
      if (s.caloriesTarget && s.caloriesTarget > 0) return s.caloriesTarget;
    }
    return 0;
  }

  function getProteinTarget() {
    if (window.calcMacros) {
      try { var m = window.calcMacros(); if (m && m.p > 0) return Math.round(m.p); } catch(e) {}
    }
    var s = window.S;
    if (s && s._nm && s._nm.protein > 0) return Math.round(s._nm.protein);
    return 0;
  }

  function getSportTypeName() {
    var s = window.S;
    if (!s || !s.sportType) return '';
    var EN = window.isEnglish && window.isEnglish();
    var MAP = {
      'musculation':  (EN ? 'Weight Training' : 'Musculation'),
      'crossfit':     'CrossFit',
      'running':      'Running',
      'hyrox':        'Hyrox',
      'padel':        'Padel',
      'golf':         'Golf',
      'triathlon':    'Triathlon',
      'cycling':      (EN ? 'Cycling' : 'Cyclisme'),
      'calisthenics': 'Calisthenics',
      'yoga':         'Yoga'
    };
    return MAP[s.sportType] || s.sportType;
  }

  // Detect persona for slide 0 personalization (mirrors SFC_OB._persona logic)
  function _detectPersona() {
    var s = window.S;
    if (!s) return 'default';
    var goals   = window.GOALS;
    var goalKey = (goals && goals[s.goal]) ? goals[s.goal].key : null;
    if (!s.sportLevel || s.sportLevel === 'beginner') return 'beginner';
    if (s.sportType === 'running'  || s.sportType === 'triathlon') return 'endurance';
    if (s.sportType === 'crossfit' || s.sportType === 'hyrox')     return 'crossfit';
    if (goalKey === 'shred' || goalKey === 'cut')                  return 'weightloss';
    if (goalKey === 'bulk'  || goalKey === 'lean_bulk')            return 'muscle';
    return 'default';
  }

  // ── Carousel CSS (injected once) ────────────────────────────────────────────
  function _injectCarouselCSS() {
    if (document.getElementById('sfc-oc-style')) return;
    var style = document.createElement('style');
    style.id = 'sfc-oc-style';
    style.textContent = [
      '.sfc-oc-slides{display:flex;transition:transform .35s cubic-bezier(.4,0,.2,1);will-change:transform;}',
      '.sfc-oc-slide{flex:0 0 100%;min-width:0;box-sizing:border-box;}',
      '.sfc-oc-dots{display:flex;gap:8px;justify-content:center;margin:20px 0 0;}',
      '.sfc-oc-dot{width:6px;height:6px;border-radius:50%;background:var(--grey,#6B6B65);opacity:.3;',
      'transition:opacity .25s,transform .25s;border:none;padding:0;cursor:pointer;}',
      '.sfc-oc-dot--active{opacity:1;transform:scale(1.5);background:var(--black,#0A0A09);}',
      '.sfc-oc-feat-card{display:flex;align-items:center;gap:12px;margin-bottom:14px;text-align:left;',
      'padding:12px 14px;border-radius:8px;background:rgba(0,0,0,.04);}',
      '@media(prefers-color-scheme:dark){.sfc-oc-feat-card{background:rgba(255,255,255,.06);}}',
      '@media(prefers-reduced-motion:reduce){.sfc-oc-slides,.sfc-oc-dot{transition:none;}}'
    ].join('');
    document.head.appendChild(style);
  }

  // ── Slide builders ──────────────────────────────────────────────────────────

  // Slide 0 — Persona-adapted "Finally, an app that understands me" moment
  function _buildSlide0(persona, EN, firstName) {
    var div = document.createElement('div');
    div.className = 'sfc-oc-slide';
    div.style.cssText = 'text-align:center;padding:0 8px';

    // Persona icon
    var icons = { beginner:'🌱', endurance:'🏃', crossfit:'💪', weightloss:'🔥', muscle:'⚡', default:'✦' };
    var iconEl = document.createElement('div');
    iconEl.style.cssText = 'font-size:36px;margin-bottom:20px;line-height:1';
    iconEl.textContent = icons[persona] || icons.default;
    div.appendChild(iconEl);

    // Headline — bilingual persona-adapted
    var FR_HEADLINES = {
      beginner:    'Votre aventure sportive commence ici.',
      endurance:   'Conçu pour les athlètes d\'endurance comme vous.',
      crossfit:    'Conçu pour l\'intensité CrossFit et Hyrox.',
      weightloss:  'Nutrition de précision pour de vrais résultats durables.',
      muscle:      'Gains maximaux, calculés au gramme près.',
      default:     'Votre système d\'intelligence fitness personnel.'
    };
    var EN_HEADLINES = {
      beginner:    'Your fitness journey starts here.',
      endurance:   'Built for endurance athletes like you.',
      crossfit:    'Engineered for CrossFit and Hyrox intensity.',
      weightloss:  'Precision nutrition for real, lasting results.',
      muscle:      'Maximum gains, calculated to the gram.',
      default:     'Your personal fitness intelligence system.'
    };
    var headlines = EN ? EN_HEADLINES : FR_HEADLINES;

    var greeting = firstName
      ? ((EN ? 'Welcome, ' : 'Bienvenue, ') + firstName + '.')
      : (EN ? 'Welcome.' : 'Bienvenue.');

    var greetEl = document.createElement('div');
    greetEl.style.cssText = 'font-family:Georgia,serif;font-size:13px;letter-spacing:1px;color:var(--grey,#6B6B65);margin-bottom:10px';
    greetEl.textContent = greeting;
    div.appendChild(greetEl);

    var h = document.createElement('div');
    h.style.cssText = [
      'font-family:Georgia,serif', 'font-size:21px', 'line-height:1.35',
      'margin-bottom:14px', 'color:var(--black,#0A0A09)', 'letter-spacing:-0.3px'
    ].join(';');
    h.textContent = headlines[persona] || headlines.default;
    div.appendChild(h);

    // Tagline
    var FR_TAGLINES = {
      beginner:   'Étape par étape, nous rendons la science du sport accessible.',
      endurance:  'Nutrition et entraînement en parfaite synchronisation.',
      crossfit:   'Chaque rep compte. Chaque macro optimisé.',
      weightloss: 'Durable. Basé sur la science. Entièrement le vôtre.',
      muscle:     'Hypertrophie et précision nutritionnelle réunies.',
      default:    'Simple en surface. Extraordinairement puissant en profondeur.'
    };
    var EN_TAGLINES = {
      beginner:   'Step by step, we make sports science accessible.',
      endurance:  'Nutrition and training in perfect synchronization.',
      crossfit:   'Every rep counted. Every macro optimized.',
      weightloss: 'Sustainable. Science-backed. Entirely yours.',
      muscle:     'Hypertrophy meets nutritional precision.',
      default:    'Simple on the surface. Extraordinarily powerful beneath.'
    };
    var taglines = EN ? EN_TAGLINES : FR_TAGLINES;

    var tag = document.createElement('div');
    tag.style.cssText = 'font-family:Georgia,serif;font-style:italic;font-size:13px;color:var(--grey,#6B6B65);line-height:1.65';
    tag.textContent = taglines[persona] || taglines.default;
    div.appendChild(tag);

    return div;
  }

  // Slide 1 — Plan summary (goal, nutrition, sport)
  function _buildSlide1(EN) {
    var div = document.createElement('div');
    div.className = 'sfc-oc-slide';
    div.style.cssText = 'text-align:center;padding:0 8px';

    var label = document.createElement('div');
    label.style.cssText = [
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:9px',
      'letter-spacing:4px', 'text-transform:uppercase',
      'color:var(--grey,#6B6B65)', 'margin-bottom:22px'
    ].join(';');
    label.textContent = EN ? 'YOUR PLAN' : 'VOTRE PLAN';
    div.appendChild(label);

    var goalName = getGoalName();
    if (goalName) div.appendChild(_makeBlock(EN ? 'YOUR GOAL' : 'VOTRE OBJECTIF', goalName));

    var kcal      = getCaloriesTarget();
    var protein   = getProteinTarget();
    var sport     = getSportTypeName();
    var sportDays = (window.S && window.S.sportDays) ? window.S.sportDays : 0;
    var progLines = [];

    if (kcal > 0) {
      var nLine = kcal + (EN ? ' kcal/day' : ' kcal/jour');
      if (protein > 0) nLine += ' · ' + protein + 'g ' + (EN ? 'protein' : 'protéines');
      progLines.push((EN ? 'Nutrition: ' : 'Nutrition : ') + nLine);
    }
    if (sport) {
      var sLine = sport;
      if (sportDays > 0) {
        var sessWord = sportDays > 1 ? (EN ? 'workouts' : 'séances') : (EN ? 'workout' : 'séance');
        sLine = sportDays + ' ' + sessWord + '/' + (EN ? 'week' : 'semaine') + ' · ' + sport;
      }
      progLines.push((EN ? 'Training: ' : 'Sport : ') + sLine);
    }
    if (progLines.length > 0) {
      div.appendChild(_makeBlock(EN ? 'YOUR PROGRAM' : 'VOTRE PROGRAMME', progLines.join('\n')));
    }

    div.appendChild(_makeDivider());

    var quote = document.createElement('div');
    quote.style.cssText = 'font-family:Georgia,serif;font-style:italic;font-size:13px;color:var(--grey,#6B6B65);line-height:1.7';
    quote.textContent = EN ? '"There is no standard."' : '"Le standard n\'existe pas."';
    div.appendChild(quote);

    return div;
  }

  // Slide 2 — Feature teasers + CTA
  function _buildSlide2(EN) {
    var div = document.createElement('div');
    div.className = 'sfc-oc-slide';
    div.style.cssText = 'text-align:center;padding:0 8px';

    var label = document.createElement('div');
    label.style.cssText = [
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:9px',
      'letter-spacing:4px', 'text-transform:uppercase',
      'color:var(--grey,#6B6B65)', 'margin-bottom:18px'
    ].join(';');
    label.textContent = EN ? 'DISCOVER THE APP' : 'DÉCOUVREZ L\'APP';
    div.appendChild(label);

    var features = EN ? [
      { icon: '📸', name: 'Meal Scanner',    desc: 'Photograph any meal — macros auto-logged' },
      { icon: '🤖', name: 'AI Coach',        desc: 'Ask anything about training or nutrition' },
      { icon: '📅', name: 'Smart Calendar',  desc: 'Your full training plan at a glance' }
    ] : [
      { icon: '📸', name: 'Scanner repas',   desc: 'Photographiez vos repas — macros ajoutés' },
      { icon: '🤖', name: 'IA Coach',        desc: 'Posez toutes vos questions sport & nutrition' },
      { icon: '📅', name: 'Calendrier',      desc: 'Votre planning d\'entraînement complet' }
    ];

    features.forEach(function(f) {
      var card = document.createElement('div');
      card.className = 'sfc-oc-feat-card';

      var ico = document.createElement('div');
      ico.style.cssText = 'font-size:22px;flex-shrink:0;line-height:1';
      ico.textContent = f.icon;
      card.appendChild(ico);

      var txt = document.createElement('div');
      var nm = document.createElement('div');
      nm.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--black,#0A0A09);margin-bottom:2px';
      nm.textContent = f.name;
      txt.appendChild(nm);

      var dc = document.createElement('div');
      dc.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.4';
      dc.textContent = f.desc;
      txt.appendChild(dc);

      card.appendChild(txt);
      div.appendChild(card);
    });

    return div;
  }

  // ── Shared element builders ──────────────────────────────────────────────────

  function _makeDivider() {
    var d = document.createElement('div');
    d.style.cssText = 'width:40px;height:1px;background:var(--black,#0A0A09);margin:18px auto';
    return d;
  }

  function _makeBlock(eyebrow, content) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom:20px;text-align:center';

    var ey = document.createElement('div');
    ey.style.cssText = [
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:9px',
      'letter-spacing:4px', 'text-transform:uppercase',
      'color:var(--grey,#6B6B65)', 'margin-bottom:6px'
    ].join(';');
    ey.textContent = eyebrow;
    wrap.appendChild(ey);

    content.split('\n').forEach(function(line) {
      var p = document.createElement('div');
      p.style.cssText = 'font-family:Georgia,serif;font-size:14px;color:var(--black,#0A0A09);line-height:1.6;margin-bottom:3px';
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
    }, 400);
  }

  // ── 3-slide carousel welcome screen ─────────────────────────────────────────
  function showOnboardingScreen() {
    _injectCarouselCSS();

    var EN      = window.isEnglish && window.isEnglish();
    var persona = _detectPersona();
    var firstName = getFirstName();

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'onboarding-complete-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'z-index:9000', 'background:var(--ivory,#FAF9F6)',
      'display:flex', 'flex-direction:column', 'align-items:center',
      'justify-content:center', 'padding:env(safe-area-inset-top,20px) 0 env(safe-area-inset-bottom,20px)',
      'overflow:hidden', 'opacity:0', 'transition:opacity .4s ease'
    ].join(';');

    // Inner constrained
    var inner = document.createElement('div');
    inner.style.cssText = 'width:100%;max-width:480px;display:flex;flex-direction:column;align-items:center;padding:0 24px;box-sizing:border-box';

    // Logo
    var logo = document.createElement('div');
    logo.style.cssText = [
      'font-family:Georgia,serif', 'font-size:10px', 'letter-spacing:8px',
      'text-transform:uppercase', 'color:var(--black,#0A0A09)',
      'margin-bottom:28px', 'opacity:1'
    ].join(';');
    logo.textContent = 'SMARTFITCOACH';
    inner.appendChild(logo);

    // Clipping viewport for slides
    var clipWrap = document.createElement('div');
    clipWrap.style.cssText = 'overflow:hidden;width:100%;';

    // Slides wrapper
    var slidesWrap = document.createElement('div');
    slidesWrap.className = 'sfc-oc-slides';
    slidesWrap.style.transform = 'translateX(0%)';

    var slide0 = _buildSlide0(persona, EN, firstName);
    var slide1 = _buildSlide1(EN);
    var slide2 = _buildSlide2(EN);
    slidesWrap.appendChild(slide0);
    slidesWrap.appendChild(slide1);
    slidesWrap.appendChild(slide2);
    clipWrap.appendChild(slidesWrap);
    inner.appendChild(clipWrap);

    // Progress dots
    var dotsEl = document.createElement('div');
    dotsEl.className = 'sfc-oc-dots';
    dotsEl.setAttribute('role', 'tablist');
    var dots = [0, 1, 2].map(function(i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'sfc-oc-dot' + (i === 0 ? ' sfc-oc-dot--active' : '');
      dot.setAttribute('aria-label', (EN ? 'Slide ' : 'Étape ') + (i + 1));
      dotsEl.appendChild(dot);
      return dot;
    });
    inner.appendChild(dotsEl);

    // Navigation row
    var navRow = document.createElement('div');
    navRow.style.cssText = 'display:flex;gap:10px;margin-top:22px;width:100%;';

    var backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.style.cssText = [
      'flex:0 0 auto', 'background:none', 'border:1px solid var(--grey,#6B6B65)',
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:11px',
      'letter-spacing:1px', 'color:var(--grey,#6B6B65)', 'cursor:pointer',
      'padding:12px 16px', 'border-radius:2px', 'min-height:44px', 'display:none'
    ].join(';');
    backBtn.textContent = EN ? '← Back' : '← Retour';

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.style.cssText = [
      'flex:1', 'background:var(--accent,#1A4A1A)', 'color:var(--ivory,#FAF9F6)',
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:11px',
      'letter-spacing:2px', 'text-transform:uppercase',
      'padding:14px', 'border:none', 'border-radius:2px', 'cursor:pointer', 'min-height:44px'
    ].join(';');
    nextBtn.textContent = EN ? 'Next →' : 'Suivant →';

    navRow.appendChild(backBtn);
    navRow.appendChild(nextBtn);
    inner.appendChild(navRow);

    // Skip button — always visible
    var skipLink = document.createElement('button');
    skipLink.type = 'button';
    skipLink.style.cssText = [
      'display:block', 'background:none', 'border:none',
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:11px',
      'color:var(--grey,#6B6B65)', 'cursor:pointer',
      'margin:10px auto 0', 'padding:8px', 'letter-spacing:0.5px', 'min-height:36px'
    ].join(';');
    skipLink.textContent = EN ? 'Skip' : 'Passer';
    skipLink.addEventListener('click', function() { _markDone(); _closeOverlay(overlay); });
    inner.appendChild(skipLink);

    // Help & Tutorials link (wires into SFC_OB)
    var helpLink = document.createElement('button');
    helpLink.type = 'button';
    helpLink.style.cssText = [
      'display:block', 'background:none', 'border:none',
      'font-family:"Helvetica Neue",Arial,sans-serif', 'font-size:10px',
      'letter-spacing:1.5px', 'text-transform:uppercase',
      'color:var(--grey,#6B6B65)', 'cursor:pointer',
      'margin:4px auto 0', 'padding:6px', 'min-height:32px'
    ].join(';');
    helpLink.textContent = EN ? 'Help & Tutorials' : 'Aide & Tutoriels';
    helpLink.addEventListener('click', function() {
      _markDone();
      _closeOverlay(overlay);
      setTimeout(function() {
        if (window.SFC_OB && window.SFC_OB.openHelp) window.SFC_OB.openHelp();
      }, 450);
    });
    inner.appendChild(helpLink);

    // ── Carousel state machine ──────────────────────────────────────────────
    var _slide = 0;

    function _goSlide(n) {
      _slide = n;
      slidesWrap.style.transform = 'translateX(-' + (n * 100) + '%)';
      dots.forEach(function(d, i) {
        d.classList.toggle('sfc-oc-dot--active', i === n);
      });
      backBtn.style.display = n === 0 ? 'none' : '';
      if (n === 2) {
        nextBtn.textContent = EN ? 'Start now →' : 'Commencer →';
      } else {
        nextBtn.textContent = EN ? 'Next →' : 'Suivant →';
      }
    }

    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() { _goSlide(i); });
    });

    backBtn.addEventListener('click', function() {
      if (_slide > 0) _goSlide(_slide - 1);
    });

    nextBtn.addEventListener('click', function() {
      if (_slide < 2) {
        _goSlide(_slide + 1);
      } else {
        _markDone();
        _closeOverlay(overlay);
      }
    });

    // Touch swipe support
    var _touchStartX = 0;
    clipWrap.addEventListener('touchstart', function(e) {
      _touchStartX = e.touches[0].clientX;
    }, { passive: true });
    clipWrap.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - _touchStartX;
      if (dx < -50 && _slide < 2) _goSlide(_slide + 1);
      else if (dx > 50 && _slide > 0) _goSlide(_slide - 1);
    }, { passive: true });

    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    // Fade in
    requestAnimationFrame(function() { overlay.style.opacity = '1'; });
  }

  // ── API publique ──────────────────────────────────────────────────────────

  window.OnboardingComplete = {
    check: function() {
      if (!window.AUTH || !window.AUTH.isLoggedIn || !window.AUTH.isLoggedIn()) return;
      try { if (localStorage.getItem(DONE_KEY) === 'true') return; } catch(e) { return; }
      if (!hasMinProfile()) return;
      // Dedup guard — prevent stacking on rapid renders
      if (_showing || document.getElementById('onboarding-complete-overlay')) return;
      _showing = true;
      showOnboardingScreen();
    }
  };

})();
