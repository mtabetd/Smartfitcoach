'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// SmartFitCoach — Onboarding Engine v1.0
// World-class contextual tutorial, progressive discovery & help ecosystem.
//
// Exposes: window.SFC_OB = {
//   init, showTip, openHelp, replayWelcome, trackEvent, reset,
//   getAnalytics, getSessionCount, dismissTip
// }
// ═══════════════════════════════════════════════════════════════════════════

(function(W) {

  // ── § CONSTANTS ─────────────────────────────────────────────────────────────
  var VER = '1.0';
  var KEYS = {
    tips:     function(u) { return 'sfc_ob_tips_'    + (u || 'anon'); },
    events:   function(u) { return 'sfc_ob_events_'  + (u || 'anon'); },
    sessions: function(u) { return 'sfc_ob_sessions_' + (u || 'anon'); }
  };
  var MAX_EVENTS      = 50;
  var TIP_DURATION    = 8000;   // ms — auto-dismiss tip
  var TIP_DELAY       = 1400;   // ms — delay after view change (premium feel)
  var FRUST_WINDOW    = 12000;  // ms — window for frustration detection
  var FRUST_THRESHOLD = 5;      // nav events in window → frustrated

  // ── § INLINE BILINGUAL DICTIONARY ───────────────────────────────────────────
  var DICT = {
    fr: {
      // Contextual tips (max 12 words — never overwhelming)
      'tip.today':       'Votre tableau de bord personnel. Tout se passe ici.',
      'tip.nutrition':   'Votre plan nutritionnel s\'adapte à vous, chaque jour.',
      'tip.sport':       'Vos séances générées selon votre niveau et vos objectifs.',
      'tip.calendar':    'Visualisez votre charge d\'entraînement sur les prochaines semaines.',
      'tip.analytics':   'Suivez votre progression semaine après semaine.',
      'tip.ai_coach':    'Posez n\'importe quelle question sport ou nutrition à votre coach.',
      'tip.scanner':     'Photographiez votre repas — vos macros s\'ajoutent automatiquement.',
      'tip.symbiose':    'Symbiose : votre nutrition s\'adapte automatiquement à vos séances.',
      'tip.premium':     'Débloquez l\'IA Coach et les analyses avancées pour aller plus loin.',
      'tip.adaptation':  'Votre plan évolue avec vous. Chaque semaine, automatiquement.',
      'tip.recovery':    'Récupération intégrée — votre corps progresse aussi pendant le repos.',
      'tip.frustration': 'Besoin d\'aide ? Accédez à votre Profil puis "Aide & Tutoriels".',
      // Discovery
      'disc.scanner':    '📸 Scanner de repas',
      'disc.scanner.sub':'Photographiez n\'importe quel repas',
      'disc.ai':         '🤖 IA Coach',
      'disc.ai.sub':     'Posez toutes vos questions',
      'disc.calendar':   '📅 Calendrier intelligent',
      'disc.calendar.sub':'Visualisez votre charge d\'entraînement',
      // Help center
      'help.title':      'Aide & Tutoriels',
      'help.close':      'Fermer',
      'help.replay':     '↻ Revoir l\'introduction',
      'help.reset_tips': 'Réinitialiser les conseils',
      'help.tips_reset': 'Conseils réinitialisés.',
      // Generic UI
      'got_it': 'Compris',
      'dismiss': '✕',
      // Help center FAQ — 4 sections × 3 items
      'sections': [
        { key: 'start', title: 'Démarrage', items: [
          ['Qu\'est-ce que SmartFitCoach ?',
           'Une app de coaching sport et nutrition personnalisée, alimentée par l\'IA.'],
          ['Comment modifier mon profil ?',
           'Accédez à votre Profil (icône utilisateur) pour modifier vos données à tout moment.'],
          ['Comment changer mon objectif ?',
           'Profil → votre objectif. Votre plan se régénère automatiquement.']
        ]},
        { key: 'nutrition', title: 'Nutrition', items: [
          ['Comment voir mes macros ?',
           'L\'onglet Nutrition affiche vos protéines, glucides et lipides du jour.'],
          ['Puis-je scanner mes repas ?',
           'Oui — appuyez sur l\'icône scanner dans le journal alimentaire.'],
          ['Mes calories sont-elles exactes ?',
           'Elles sont calculées selon votre profil, objectif et niveau d\'activité (normes ACSM).']
        ]},
        { key: 'sport', title: 'Sport', items: [
          ['Comment voir mon programme ?',
           'L\'onglet Sport affiche vos séances de la semaine.'],
          ['Puis-je modifier une séance ?',
           'Oui — appuyez sur l\'exercice pour personnaliser les séries et répétitions.'],
          ['Mon programme change-t-il ?',
           'Oui, il évolue avec votre niveau, vos résultats et votre récupération.']
        ]},
        { key: 'ai', title: 'IA Coach', items: [
          ['Comment accéder à l\'IA Coach ?',
           'Depuis le tableau de bord, appuyez sur le bouton "Coach IA".'],
          ['Quelles questions puis-je poser ?',
           'Sport, nutrition, récupération — tout ce qui concerne votre entraînement.'],
          ['Combien de questions ai-je par mois ?',
           'Selon votre abonnement : Athlète (10/mois), Champion (60/mois), Légende (illimité).']
        ]}
      ]
    },
    en: {
      'tip.today':       'Your personal dashboard. Everything starts here.',
      'tip.nutrition':   'Your nutrition plan tailored to you, every single day.',
      'tip.sport':       'Workouts generated to match your level and your goals.',
      'tip.calendar':    'Visualize your training load over the coming weeks.',
      'tip.analytics':   'Track your progress week after week.',
      'tip.ai_coach':    'Ask your AI Coach anything about sport or nutrition.',
      'tip.scanner':     'Photograph your meal — macros are logged automatically.',
      'tip.symbiose':    'Symbiosis: your nutrition adapts automatically to your training.',
      'tip.premium':     'Unlock AI Coach and advanced analytics to go further.',
      'tip.adaptation':  'Your plan evolves with you. Every week, automatically.',
      'tip.recovery':    'Recovery built in — your body also progresses during rest.',
      'tip.frustration': 'Need help? Go to Profile → Help & Tutorials.',
      'disc.scanner':    '📸 Meal Scanner',
      'disc.scanner.sub':'Photograph any meal',
      'disc.ai':         '🤖 AI Coach',
      'disc.ai.sub':     'Ask any question',
      'disc.calendar':   '📅 Smart Calendar',
      'disc.calendar.sub':'Visualize your training load',
      'help.title':      'Help & Tutorials',
      'help.close':      'Close',
      'help.replay':     '↻ Replay the introduction',
      'help.reset_tips': 'Reset contextual tips',
      'help.tips_reset': 'Tips reset.',
      'got_it': 'Got it',
      'dismiss': '✕',
      'sections': [
        { key: 'start', title: 'Getting Started', items: [
          ['What is SmartFitCoach?',
           'A personalized sport and nutrition coaching app powered by AI.'],
          ['How do I edit my profile?',
           'Access your Profile (user icon) to update your information at any time.'],
          ['How do I change my goal?',
           'Profile → your goal. Your plan regenerates automatically.']
        ]},
        { key: 'nutrition', title: 'Nutrition', items: [
          ['How do I see my macros?',
           'The Nutrition tab shows your daily protein, carbs, and fat targets.'],
          ['Can I scan my meals?',
           'Yes — tap the scanner icon in the food journal.'],
          ['Are my calories accurate?',
           'They\'re calculated from your profile, goal, and activity level (ACSM standards).']
        ]},
        { key: 'sport', title: 'Sport', items: [
          ['How do I see my program?',
           'The Sport tab shows your weekly workouts.'],
          ['Can I modify a workout?',
           'Yes — tap any exercise to adjust sets and reps.'],
          ['Does my program change?',
           'Yes, it evolves with your level, results, and recovery.']
        ]},
        { key: 'ai', title: 'AI Coach', items: [
          ['How do I access AI Coach?',
           'From the dashboard, tap the "AI Coach" button.'],
          ['What can I ask?',
           'Sport, nutrition, recovery — anything related to your training.'],
          ['How many questions per month?',
           'Depending on your plan: Athlete (10/mo), Champion (60/mo), Legend (unlimited).']
        ]}
      ]
    }
  };

  // ── § TRANSLATION HELPER ────────────────────────────────────────────────────
  function _lang() {
    return (W.currentLang && W.currentLang()) || (W.S && W.S.lang) || 'fr';
  }
  function t(key) {
    var d = DICT[_lang()] || DICT.fr;
    return (d[key] !== undefined ? d[key] : (DICT.fr[key] !== undefined ? DICT.fr[key] : key));
  }
  function sections() {
    var d = DICT[_lang()] || DICT.fr;
    return d.sections || DICT.fr.sections;
  }

  // ── § STORAGE HELPERS ────────────────────────────────────────────────────────
  function _uid() {
    try {
      var u = W.AUTH && W.AUTH.getUser && W.AUTH.getUser();
      return (u && u.id) ? u.id : 'anon';
    } catch(e) { return 'anon'; }
  }
  function _read(key) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
  }
  function _write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }

  // ── § TIP STATE ──────────────────────────────────────────────────────────────
  function _seenTips() { return _read(KEYS.tips(_uid())) || {}; }
  function _hasSeen(id) { return !!_seenTips()[id]; }
  function _markSeen(id) {
    var tips = _seenTips();
    tips[id] = Date.now();
    _write(KEYS.tips(_uid()), tips);
  }
  function _resetTips() { _write(KEYS.tips(_uid()), {}); }

  // ── § ANALYTICS ──────────────────────────────────────────────────────────────
  function _logEvent(name, data) {
    try {
      var key = KEYS.events(_uid());
      var evs = _read(key) || [];
      evs.push({ e: name, ts: Date.now(), d: data || null });
      if (evs.length > MAX_EVENTS) evs = evs.slice(-MAX_EVENTS);
      _write(key, evs);
    } catch(e) {}
  }

  // ── § SESSION COUNTER ────────────────────────────────────────────────────────
  function _getSessionCount() {
    var key = KEYS.sessions(_uid());
    var data = _read(key) || { count: 0, last: null };
    var today = new Date().toISOString().slice(0, 10);
    if (data.last !== today) {
      data.count = (data.count || 0) + 1;
      data.last = today;
      _write(key, data);
    }
    return data.count;
  }

  // ── § PERSONALIZATION ────────────────────────────────────────────────────────
  function _persona() {
    var s = W.S;
    if (!s) return 'default';
    var goals = W.GOALS;
    var goalKey = (goals && goals[s.goal]) ? goals[s.goal].key : null;
    if (!s.sportLevel || s.sportLevel === 'beginner') return 'beginner';
    if (s.sportType === 'running' || s.sportType === 'triathlon') return 'endurance';
    if (s.sportType === 'crossfit' || s.sportType === 'hyrox') return 'crossfit';
    if (goalKey === 'shred' || goalKey === 'cut') return 'weightloss';
    if (goalKey === 'bulk' || goalKey === 'lean_bulk') return 'muscle';
    return 'default';
  }

  // ── § TIP BAR ENGINE ─────────────────────────────────────────────────────────
  var _tipEl       = null;
  var _tipTimer    = null;
  var _tipQueue    = [];
  var _currentTip  = null;

  function _ensureTipBar() {
    if (_tipEl && document.body.contains(_tipEl)) return;
    var bar = document.createElement('div');
    bar.id = 'sfc-tip-bar';
    bar.className = 'sfc-tip-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-atomic', 'true');

    var inner = document.createElement('div');
    inner.className = 'sfc-tip-bar__inner';

    var text = document.createElement('span');
    text.id = 'sfc-tip-text';
    text.className = 'sfc-tip-bar__text';
    inner.appendChild(text);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sfc-tip-bar__dismiss';
    btn.setAttribute('aria-label', t('dismiss'));
    btn.textContent = t('dismiss');
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      _dismissTip();
    });
    inner.appendChild(btn);

    bar.appendChild(inner);
    bar.addEventListener('click', _dismissTip);
    document.body.appendChild(bar);
    _tipEl = bar;
  }

  function _showTipNow(tipId, msg) {
    _ensureTipBar();
    var textEl = document.getElementById('sfc-tip-text');
    if (textEl) textEl.textContent = msg;
    _tipEl.classList.remove('sfc-tip-bar--visible');
    void _tipEl.offsetWidth; // reflow for transition
    _tipEl.classList.add('sfc-tip-bar--visible');
    _currentTip = tipId;
    _markSeen(tipId);
    _logEvent('tip_shown', { id: tipId });
    clearTimeout(_tipTimer);
    _tipTimer = setTimeout(_dismissTip, TIP_DURATION);
  }

  function _dismissTip() {
    clearTimeout(_tipTimer);
    _currentTip = null;
    if (_tipEl) _tipEl.classList.remove('sfc-tip-bar--visible');
    // Process queue after transition settles
    setTimeout(function() {
      if (_tipQueue.length > 0) {
        var next = _tipQueue.shift();
        _showTipNow(next.id, next.msg);
      }
    }, 500);
  }

  function showTip(tipId, customMsg) {
    if (!tipId || _hasSeen(tipId)) return;
    var msg = customMsg || t(tipId);
    if (!msg || msg === tipId) return; // No translation available
    if (_currentTip) {
      _tipQueue.push({ id: tipId, msg: msg });
    } else {
      _showTipNow(tipId, msg);
    }
  }

  // ── § VIEW-BASED TRIGGERS ────────────────────────────────────────────────────
  var _lastView      = null;
  var _navTimestamps = [];

  function _onViewChange(view) {
    if (!view) return;

    // Frustration detection — rapid tab switching
    var now = Date.now();
    _navTimestamps.push(now);
    _navTimestamps = _navTimestamps.filter(function(ts) { return now - ts < FRUST_WINDOW; });
    if (_navTimestamps.length >= FRUST_THRESHOLD && !_hasSeen('tip.frustration')) {
      setTimeout(function() { showTip('tip.frustration'); }, 500);
      _logEvent('frustration_detected', { view: view, navCount: _navTimestamps.length });
    }

    if (view === _lastView) return;
    _lastView = view;
    _logEvent('view_change', { view: view });

    var tipMap = {
      'today':     'tip.today',
      'dashboard': 'tip.today',
      'nutrition': 'tip.nutrition',
      'sport':     'tip.sport',
      'calendar':  'tip.calendar',
      'analytics': 'tip.analytics'
    };
    var tipId = tipMap[view];
    if (tipId) setTimeout(function() { showTip(tipId); }, TIP_DELAY);

    // Inject help row when profile view is rendered
    if (view === 'profil' || view === 'profile') {
      setTimeout(_injectHelpInProfile, 300);
    }
  }

  // ── § PROGRESSIVE FEATURE DISCOVERY ─────────────────────────────────────────
  var _DISC_FEATURES = ['scanner', 'ai', 'calendar'];

  function showDiscovery() {
    // Only after 2+ sessions, only on dashboard, only once per feature
    var sessions = _getSessionCount();
    if (sessions < 2) return;
    var currentView = (W.S && W.S.view) || 'today';
    if (currentView !== 'today' && currentView !== 'dashboard') return;
    if (document.getElementById('sfc-discovery')) return;

    var unseen = _DISC_FEATURES.filter(function(f) { return !_hasSeen('disc.' + f); });
    if (unseen.length === 0) return;

    var featureKey = unseen[0];
    var disc = document.createElement('div');
    disc.id = 'sfc-discovery';
    disc.className = 'sfc-discovery';

    var textWrap = document.createElement('div');
    textWrap.className = 'sfc-discovery__text';

    var label = document.createElement('div');
    label.className = 'sfc-discovery__label';
    label.textContent = t('disc.' + featureKey);
    textWrap.appendChild(label);

    var sub = document.createElement('div');
    sub.className = 'sfc-discovery__sub';
    sub.textContent = t('disc.' + featureKey + '.sub');
    textWrap.appendChild(sub);

    disc.appendChild(textWrap);

    var gotIt = document.createElement('button');
    gotIt.type = 'button';
    gotIt.className = 'sfc-discovery__btn';
    gotIt.textContent = t('got_it');
    gotIt.addEventListener('click', function() {
      _markSeen('disc.' + featureKey);
      _logEvent('discovery_dismissed', { feature: featureKey });
      disc.style.opacity = '0';
      setTimeout(function() {
        if (disc.parentNode) disc.parentNode.removeChild(disc);
      }, 350);
    });
    disc.appendChild(gotIt);

    disc.style.opacity = '0';
    disc.style.transition = 'opacity 0.4s ease';

    var container = document.getElementById('app') || document.body;
    container.appendChild(disc);
    requestAnimationFrame(function() { disc.style.opacity = '1'; });
    _logEvent('discovery_shown', { feature: featureKey });
  }

  // ── § HELP CENTER ────────────────────────────────────────────────────────────
  function openHelp() {
    if (document.getElementById('sfc-help-modal')) return;
    _logEvent('help_opened');

    var backdrop = document.createElement('div');
    backdrop.id = 'sfc-help-modal';
    backdrop.className = 'sfc-help-backdrop';
    backdrop.setAttribute('aria-hidden', 'false');

    var modal = document.createElement('div');
    modal.className = 'sfc-help-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', t('help.title'));

    // Header
    var header = document.createElement('div');
    header.className = 'sfc-help-modal__header';

    var titleEl = document.createElement('div');
    titleEl.className = 'sfc-help-modal__title';
    titleEl.textContent = t('help.title');
    header.appendChild(titleEl);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sfc-help-modal__close';
    closeBtn.textContent = t('help.close');
    closeBtn.setAttribute('aria-label', t('help.close'));
    closeBtn.addEventListener('click', function() { _closeHelp(backdrop); });
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'sfc-help-modal__body';

    sections().forEach(function(sec) {
      var sEl = document.createElement('div');
      sEl.className = 'sfc-help-section';

      var sTitle = document.createElement('div');
      sTitle.className = 'sfc-help-section__title';
      sTitle.textContent = sec.title;
      sEl.appendChild(sTitle);

      sec.items.forEach(function(item) {
        var q = item[0], a = item[1];
        var itemEl = document.createElement('div');
        itemEl.className = 'sfc-help-item';

        var qEl = document.createElement('div');
        qEl.className = 'sfc-help-item__q';
        qEl.textContent = q;
        qEl.setAttribute('role', 'button');
        qEl.setAttribute('tabindex', '0');
        qEl.setAttribute('aria-expanded', 'false');

        var aEl = document.createElement('div');
        aEl.className = 'sfc-help-item__a';
        aEl.textContent = a;
        aEl.hidden = true;

        function toggle() {
          var open = !aEl.hidden;
          aEl.hidden = open;
          qEl.setAttribute('aria-expanded', String(!open));
          qEl.classList.toggle('sfc-help-item__q--open', !open);
          if (!open) _logEvent('help_faq', { q: q.slice(0, 40) });
        }
        qEl.addEventListener('click', toggle);
        qEl.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });

        itemEl.appendChild(qEl);
        itemEl.appendChild(aEl);
        sEl.appendChild(itemEl);
      });
      body.appendChild(sEl);
    });

    // Action buttons
    var actions = document.createElement('div');
    actions.className = 'sfc-help-modal__actions';

    var replayBtn = document.createElement('button');
    replayBtn.type = 'button';
    replayBtn.className = 'sfc-help-modal__action-btn';
    replayBtn.textContent = t('help.replay');
    replayBtn.addEventListener('click', function() {
      _closeHelp(backdrop);
      setTimeout(replayWelcome, 400);
    });
    actions.appendChild(replayBtn);

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'sfc-help-modal__action-btn sfc-help-modal__action-btn--ghost';
    resetBtn.textContent = t('help.reset_tips');
    resetBtn.addEventListener('click', function() {
      _resetTips();
      _logEvent('tips_reset');
      _closeHelp(backdrop);
      if (W.showToast) W.showToast(t('help.tips_reset'), 'success', 2000);
    });
    actions.appendChild(resetBtn);
    body.appendChild(actions);
    modal.appendChild(body);

    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) _closeHelp(backdrop);
    });
    document.addEventListener('keydown', function _esc(e) {
      if (e.key === 'Escape') { _closeHelp(backdrop); document.removeEventListener('keydown', _esc); }
    });

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Animate in (bottom sheet)
    requestAnimationFrame(function() {
      backdrop.classList.add('sfc-help-backdrop--visible');
    });

    // Trap focus on first interactive element
    setTimeout(function() { closeBtn.focus(); }, 350);
  }

  function _closeHelp(backdrop) {
    backdrop.classList.remove('sfc-help-backdrop--visible');
    setTimeout(function() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }, 380);
  }

  // ── § PROFILE VIEW INJECTION ─────────────────────────────────────────────────
  function _injectHelpInProfile() {
    // Find the profile content container — try multiple selectors
    var prof = document.querySelector('[data-section="profil"]') ||
               document.querySelector('.profil-content') ||
               document.getElementById('profil-content');

    // Fallback: look for the #app and check if profil view
    if (!prof) {
      var app = document.getElementById('app');
      if (!app) return;
      // Find the last scrollable div inside app (profile tends to be the deepest scroll container)
      var divs = app.querySelectorAll('div');
      for (var i = divs.length - 1; i >= 0; i--) {
        if (divs[i].scrollHeight > divs[i].clientHeight + 20) { prof = divs[i]; break; }
      }
    }
    if (!prof || prof.dataset.sfcHelp) return;
    prof.dataset.sfcHelp = '1';

    var row = document.createElement('div');
    row.className = 'sfc-profile-help-row';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');

    var rowText = document.createElement('span');
    rowText.textContent = _lang() === 'en' ? 'Help & Tutorials' : 'Aide & Tutoriels';
    row.appendChild(rowText);

    var arrow = document.createElement('span');
    arrow.textContent = '›';
    arrow.setAttribute('aria-hidden', 'true');
    row.appendChild(arrow);

    row.addEventListener('click', openHelp);
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHelp(); }
    });

    prof.appendChild(row);
  }

  // ── § REPLAY WELCOME ─────────────────────────────────────────────────────────
  function replayWelcome() {
    try { localStorage.removeItem('mtd_onboarding_done'); } catch(e) {}
    if (W.OnboardingComplete && W.OnboardingComplete.check) {
      W.OnboardingComplete.check();
    }
    _logEvent('welcome_replayed');
  }

  // ── § RENDER HOOK ────────────────────────────────────────────────────────────
  var _hookDone = false;

  function _installHook() {
    if (_hookDone || typeof W.render !== 'function') return;
    var _orig = W.render;
    W.render = function() {
      var r = _orig.apply(this, arguments);
      try {
        var s = W.S;
        var inOB = s && ((s.nStep > 0 && s.nStep < 12) || s.sStep > 0);
        if (!inOB && s) {
          var view = s.view || 'today';
          setTimeout(function() { _onViewChange(view); }, 120);
        }
      } catch(e) {}
      return r;
    };
    _hookDone = true;
  }

  // ── § INIT ───────────────────────────────────────────────────────────────────
  function init() {
    try {
      _getSessionCount();
      _logEvent('session_start', { v: VER, persona: _persona() });

      if (typeof W.render === 'function') {
        _installHook();
      } else {
        // Retry until render is defined (app-main.js loads after us)
        var _wait = setInterval(function() {
          if (typeof W.render === 'function') { clearInterval(_wait); _installHook(); }
        }, 150);
        setTimeout(function() { clearInterval(_wait); }, 8000);
      }

      // Show discovery after app settles (3 seconds)
      setTimeout(function() { try { showDiscovery(); } catch(e) {} }, 3000);

    } catch(e) {}
  }

  // ── § PUBLIC API ─────────────────────────────────────────────────────────────
  W.SFC_OB = {
    init:            init,
    showTip:         showTip,
    openHelp:        openHelp,
    replayWelcome:   replayWelcome,
    trackEvent:      _logEvent,
    dismissTip:      function(id) { _markSeen(id); _dismissTip(); },
    reset: function() {
      _resetTips();
      try { localStorage.removeItem('mtd_onboarding_done'); } catch(e) {}
      _logEvent('full_reset');
    },
    getAnalytics:    function() { return _read(KEYS.events(_uid())) || []; },
    getSessionCount: _getSessionCount,
    // Expose for profile page — called externally
    injectProfileHelp: _injectHelpInProfile,
    // Internal access for tests
    _hasSeen:  _hasSeen,
    _markSeen: _markSeen,
    _lang:     _lang,
    _persona:  _persona
  };

  // ── § AUTO-INIT ──────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    setTimeout(init, 0);
  }

})(window);
