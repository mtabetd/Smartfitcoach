/* ═══════════════════════════════════════════════════════════════
   DASHBOARD.JS — Home Dashboard
   Ivoire / Noir Editorial Luxury Minimalism
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ─── INJECT CSS ─── */
var styleEl = document.createElement('style');
styleEl.textContent = [
  /* Layout */
  '.dash-root { max-width:720px; margin:0 auto; padding:24px 16px 48px; font-family:"Helvetica Neue",Arial,sans-serif; color:var(--black,#181818); }',

  /* Section labels */
  '.dash-label { font-size:9px; letter-spacing:4px; text-transform:uppercase; color:var(--grey,#6B6B65); border-bottom:1px solid var(--border,#D8D8D0); padding-bottom:6px; margin:32px 0 14px; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-label:first-of-type { margin-top:0; }',

  /* Greeting */
  '.dash-greeting { font-family:Georgia,serif; font-size:24px; font-style:italic; line-height:1.25; margin:0 0 2px; color:var(--black,#181818); }',
  '.dash-date { font-size:13px; color:var(--grey,#6B6B65); letter-spacing:1px; margin:0 0 24px; }',

  /* Cards */
  '.dash-card { background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); padding:16px; margin-bottom:12px; }',
  '.dash-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }',
  '.dash-card-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px; }',

  /* Big number */
  '.dash-big { font-family:Georgia,serif; font-style:italic; font-size:26px; line-height:1.1; color:var(--black,#181818); }',
  '.dash-unit { font-size:13px; font-style:normal; color:var(--grey,#6B6B65); margin-left:2px; }',
  '.dash-card-title { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--grey,#6B6B65); margin:0 0 8px; }',

  /* Quick-action cards */
  '.dash-action { background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); padding:20px 16px; cursor:pointer; transition:all .2s ease; text-align:center; }',
  '.dash-action:hover { background:var(--black,#181818); color:var(--ivory,#FAF9F6); border-color:var(--black,#181818); }',
  '.dash-action:hover .dash-action-sub { color:var(--ivory,#FAF9F6); opacity:.7; }',
  '.dash-action:hover .dash-action-icon { color:var(--ivory,#FAF9F6); }',
  '.dash-action-icon { font-size:24px; margin-bottom:8px; display:block; transition:all .2s ease; }',
  '.dash-action-name { font-family:Georgia,serif; font-size:16px; font-style:italic; margin:0 0 4px; transition:all .2s ease; }',
  '.dash-action-sub { font-size:11px; color:var(--grey,#6B6B65); margin:0; transition:all .2s ease; }',

  /* Big nav cards */
  '.dash-nav { background:var(--black,#181818); color:var(--ivory,#FAF9F6); border:1px solid var(--black,#181818); padding:28px 20px; cursor:pointer; transition:all .2s ease; }',
  '.dash-nav:hover { background:var(--ivory,#FAF9F6); color:var(--black,#181818); }',
  '.dash-nav:hover .dash-nav-sub { color:var(--grey,#6B6B65); }',
  '.dash-nav-icon { font-size:18px; margin-bottom:10px; display:block; }',
  '.dash-nav-name { font-family:Georgia,serif; font-size:18px; font-style:italic; margin:0 0 4px; }',
  '.dash-nav-sub { font-size:11px; opacity:.65; margin:0; transition:all .2s ease; }',

  /* Mini badges */
  '.dash-badges-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }',
  '.dash-badge-mini { width:44px; height:44px; border-radius:50%; background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); display:flex; align-items:center; justify-content:center; font-size:18px; }',
  '.dash-badge-link { font-size:11px; color:var(--grey,#6B6B65); cursor:pointer; margin-left:auto; transition:all .2s ease; text-decoration:none; }',
  '.dash-badge-link:hover { color:var(--black,#181818); }',

  /* Session footer */
  '.dash-session { font-size:11px; letter-spacing:1px; color:var(--grey,#6B6B65); text-align:center; margin-top:32px; padding-top:12px; border-top:1px solid var(--border,#D8D8D0); }',

  /* Widget containers */
  '.dash-widget-box { margin-bottom:12px; }',

  /* Quote card */
  '.dash-quote-card { background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); padding:20px; margin-bottom:12px; text-align:center; }',
  '.dash-quote-text { font-family:Georgia,serif; font-style:italic; font-size:15px; line-height:1.5; color:var(--black,#181818); margin:0; }',

  /* Overview mini bar */
  '.dash-minibar-track { height:4px; background:var(--border,#D8D8D0); margin-top:6px; overflow:hidden; }',
  '.dash-minibar-fill { height:100%; background:var(--black,#181818); transition:width .4s ease; }',

  /* Measurements modal overlay */
  '.dash-modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(24,24,24,.45); z-index:9000; display:flex; align-items:center; justify-content:center; }',
  '.dash-modal-box { background:var(--ivory,#FAF9F6); max-width:480px; width:90%; max-height:80vh; overflow-y:auto; padding:28px 24px; position:relative; }',
  '.dash-modal-close { position:absolute; top:12px; right:16px; background:none; border:none; font-size:18px; cursor:pointer; color:var(--grey,#6B6B65); transition:all .2s ease; }',
  '.dash-modal-close:hover { color:var(--black,#181818); }',

  /* Data management buttons */
  '.dash-data-section { margin-top:32px; }',
  '.dash-data-btns { display:flex; flex-direction:column; gap:10px; }',
  '.dash-btn-primary { width:100%; padding:14px; background:var(--black,#181818); color:var(--ivory,#FAF9F6); border:none; font-size:13px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-primary:hover { opacity:.85; }',
  '.dash-btn-secondary { width:100%; padding:14px; background:var(--ivory2,#F4F4F0); color:var(--black,#181818); border:1px solid var(--border,#D8D8D0); font-size:13px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-secondary:hover { background:var(--black,#181818); color:var(--ivory,#FAF9F6); }',
  '.dash-btn-danger { width:100%; padding:14px; background:transparent; color:var(--red,#5A1010); border:1px solid var(--red,#5A1010); font-size:13px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-danger:hover { background:var(--red,#5A1010); color:var(--ivory,#FAF9F6); }',

  /* Responsive */
  '@media(max-width:480px){ .dash-card-grid,.dash-card-grid-3{grid-template-columns:1fr;} .dash-greeting{font-size:24px;} }',
  '@media(min-width:481px) and (max-width:640px){ .dash-card-grid-3{grid-template-columns:1fr 1fr;} }'
].join('\n');
document.head.appendChild(styleEl);


/* ─── HELPERS ─── */
function h(tag, cls, content) {
  if (window._h) return window._h(tag, cls, content);
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  if (typeof content === 'string') el.textContent = content;
  else if (Array.isArray(content)) content.forEach(function(c){ if(c) el.appendChild(c); });
  else if (content && content.nodeType) el.appendChild(content);
  return el;
}

function attr(el, obj) {
  Object.keys(obj).forEach(function(k){ el.setAttribute(k, obj[k]); });
  return el;
}

var MOIS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
var JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

function frenchDate(d) {
  return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
}

function greetingWord() {
  var hr = new Date().getHours();
  if (hr < 5) return window.t('dash.greeting_evening');
  if (hr < 12) return window.t('dash.greeting_morning');
  if (hr < 18) return window.t('dash.greeting_afternoon');
  return window.t('dash.greeting_evening');
}

function firstName(name) {
  if (!name) return '';
  return name.split(' ')[0];
}

function tryGetUser() {
  try { return window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null; } catch(e){ return null; }
}

function tryGetLogs(userId) {
  try { return window.BLACKBOX && window.BLACKBOX.getUserLogs ? window.BLACKBOX.getUserLogs(userId) : []; } catch(e){ return []; }
}

function tryGetSessionMinutes() {
  try { return window.BLACKBOX && window.BLACKBOX.getSessionMinutes ? window.BLACKBOX.getSessionMinutes() : 0; } catch(e){ return 0; }
}

function lastWeight(logs) {
  if (!logs || !logs.length) return null;
  for (var i = logs.length - 1; i >= 0; i--) {
    if (logs[i] && (logs[i].weight !== undefined && logs[i].weight !== null)) return logs[i].weight;
    if (logs[i] && logs[i].type === 'weight' && logs[i].value !== undefined) return logs[i].value;
  }
  return null;
}

function lastCalorieTarget(logs) {
  if (!logs || !logs.length) return null;
  for (var i = logs.length - 1; i >= 0; i--) {
    if (logs[i] && logs[i].targetCalories !== undefined) return logs[i].targetCalories;
    if (logs[i] && logs[i].calorieTarget !== undefined) return logs[i].calorieTarget;
    if (logs[i] && logs[i].calories !== undefined) return logs[i].calories;
  }
  return null;
}

function lastSleep(logs) {
  if (!logs || !logs.length) return null;
  for (var i = logs.length - 1; i >= 0; i--) {
    if (logs[i] && logs[i].type === 'sleep' && logs[i].hours !== undefined) return logs[i].hours;
    if (logs[i] && logs[i].sleep !== undefined) return logs[i].sleep;
    if (logs[i] && logs[i].sleepHours !== undefined) return logs[i].sleepHours;
  }
  return null;
}

function waterProgress(logs) {
  if (!logs || !logs.length) return null;
  for (var i = logs.length - 1; i >= 0; i--) {
    if (logs[i] && logs[i].type === 'water') return { current: logs[i].current || logs[i].value || 0, goal: logs[i].goal || 2000 };
    if (logs[i] && logs[i].waterMl !== undefined) return { current: logs[i].waterMl, goal: logs[i].waterGoal || 2000 };
  }
  return null;
}

function lastVisitDate(logs) {
  if (!logs || !logs.length) return null;
  for (var i = logs.length - 1; i >= 0; i--) {
    if (logs[i] && logs[i].date) {
      var d = new Date(logs[i].date);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function getBadges() {
  try {
    var user = tryGetUser();
    if (user) {
      var key = 'mtd_badges_' + user.id;
      var badges = []; try { badges = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { badges = []; }
      if (Array.isArray(badges)) return badges.slice(-3);
    }
  } catch(e){}
  return [];
}


/* ─── WELCOME SCREEN (jour 0 — avant génération du plan) ─── */
function renderWelcomeScreen(container) {
  var S = window.S || {};
  var user = tryGetUser();
  var root = h('div', 'dash-root');

  /* Greeting */
  var now = new Date();
  var greeting = greetingWord() + (user && user.name ? ', ' + firstName(user.name) : '');
  root.appendChild(h('h1', 'dash-greeting', greeting));
  var dateStr = frenchDate(now).charAt(0).toUpperCase() + frenchDate(now).slice(1);
  root.appendChild(h('p', 'dash-date', dateStr));

  /* Tips toggle */
  if (window.TIPS) TIPS.renderToggle(root);

  /* Welcome card */
  root.appendChild(h('div', 'dash-label', 'Bienvenue sur SmartFitCoach'));

  var welcomeCard = document.createElement('div');
  welcomeCard.className = 'dash-card';
  welcomeCard.style.cssText = 'text-align:center;padding:32px 20px;';

  var icon = document.createElement('div');
  icon.style.cssText = 'font-size:36px;margin-bottom:16px;';
  icon.textContent = '\u25C6';
  welcomeCard.appendChild(icon);

  var title = document.createElement('p');
  title.style.cssText = 'font-family:Georgia,serif;font-style:italic;font-size:18px;margin:0 0 10px;color:var(--black,#181818);';
  title.textContent = 'Votre programme personnalisé vous attend';
  welcomeCard.appendChild(title);

  var sub = document.createElement('p');
  sub.style.cssText = 'font-size:13px;color:var(--grey,#6B6B65);margin:0 0 24px;line-height:1.6;font-family:"Helvetica Neue",Arial,sans-serif;';
  /* Determine message based on onboarding step */
  var nStep = S.nStep || 0;
  if (nStep === 0) {
    sub.textContent = 'Complétez le questionnaire Nutrition pour générer votre plan alimentaire et sportif personnalisé.';
  } else if (nStep > 0 && nStep < 10) {
    sub.textContent = 'Votre questionnaire est en cours (étape ' + nStep + '/9). Terminez-le pour accéder à votre tableau de bord complet.';
  } else {
    sub.textContent = 'Générez votre plan semaine dans Nutrition pour commencer le suivi de vos calories et performances.';
  }
  welcomeCard.appendChild(sub);

  var ctaBtn = document.createElement('button');
  ctaBtn.className = 'dash-btn-primary';
  ctaBtn.style.cssText = 'max-width:320px;margin:0 auto;display:block;';
  ctaBtn.textContent = nStep === 0 ? 'Commencer le questionnaire \u2192' : 'Reprendre le questionnaire \u2192';
  ctaBtn.addEventListener('click', function() {
    if (window.APP_NAVIGATE) window.APP_NAVIGATE('nutrition');
  });
  welcomeCard.appendChild(ctaBtn);

  root.appendChild(welcomeCard);

  /* Quick nav cards — always accessible */
  root.appendChild(h('div', 'dash-label', 'Accès rapide'));
  var navGrid = h('div', 'dash-card-grid');

  var nutCard = h('div', 'dash-nav');
  nutCard.appendChild(h('span', 'dash-nav-icon', '\u25C6'));
  nutCard.appendChild(h('p', 'dash-nav-name', 'Nutrition'));
  nutCard.appendChild(h('p', 'dash-nav-sub', nStep === 0 ? 'Démarrer le questionnaire' : 'Continuer l\'onboarding'));
  nutCard.style.cursor = 'pointer';
  nutCard.addEventListener('click', function() {
    if (window.APP_NAVIGATE) window.APP_NAVIGATE('nutrition');
  });
  navGrid.appendChild(nutCard);

  var sportCard = h('div', 'dash-nav');
  sportCard.appendChild(h('span', 'dash-nav-icon', '\u25C6'));
  sportCard.appendChild(h('p', 'dash-nav-name', 'Sport'));
  sportCard.appendChild(h('p', 'dash-nav-sub', 'Explorer les programmes'));
  sportCard.style.cursor = 'pointer';
  sportCard.addEventListener('click', function() {
    if (window.APP_NAVIGATE) window.APP_NAVIGATE('sport');
  });
  navGrid.appendChild(sportCard);

  root.appendChild(navGrid);

  container.appendChild(root);
}

/* ─── MAIN MODULE ─── */
window.DASHBOARD = {

  render: function(container) {
    if (!container) return;
    container.innerHTML = '';

    var S = window.S || {};

    /* ─── WELCOME SCREEN: afficher uniquement si weekPlan non généré (jour 0 / setup incomplet) ─── */
    var hasPlan = Array.isArray(S.weekPlan) && S.weekPlan.length > 0;
    if (!hasPlan) {
      renderWelcomeScreen(container);
      return;
    }
    /* ─────────────────────────────────────────────────────────────────────────────────────────────── */

    var root = h('div', 'dash-root');
    var user = tryGetUser();
    var userId = user ? user.id : null;
    var logs = tryGetLogs(userId);
    var now = new Date();

    /* ═══ GREETING ═══ */
    var greeting = greetingWord() + (user && user.name ? ', ' + firstName(user.name) : '');
    root.appendChild(h('h1', 'dash-greeting', greeting));
    var dateStr = frenchDate(now).charAt(0).toUpperCase() + frenchDate(now).slice(1);
    root.appendChild(h('p', 'dash-date', dateStr));

    /* ═══ BIRTHDAY BANNER ═══ */
    if (window.isBirthday && window.isBirthday()) {
      var _bdAge = window.getAge ? window.getAge() : null;
      var _bdBanner = h('div', null);
      _bdBanner.style.cssText = 'background:linear-gradient(135deg,#FFD700 0%,#FFA500 100%);border-radius:8px;padding:16px 20px;margin-bottom:16px;text-align:center;position:relative;overflow:hidden';
      _bdBanner.innerHTML = '<div style="font-size:28px;margin-bottom:4px">\uD83C\uDF82\uD83C\uDF89\uD83C\uDF81</div>' +
        '<div style="font-family:Georgia,serif;font-size:18px;color:#0A0A09;font-weight:bold">Joyeux anniversaire' + (_bdAge ? ' — ' + _bdAge + ' ans' : '') + ' !</div>' +
        '<div style="font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:#333;margin-top:4px">Toute l\'\u00e9quipe SmartFitCoach vous souhaite une merveilleuse journ\u00e9e</div>';
      root.appendChild(_bdBanner);
    }

    /* ═══ TIPS TOGGLE ═══ */
    if (window.TIPS) TIPS.renderToggle(root);

    /* ═══ DAILY QUOTE ═══ */
    root.appendChild(h('div', 'dash-label', 'Citation du jour'));
    var quoteBox = h('div', 'dash-widget-box');
    if (window.GAMIFICATION && window.GAMIFICATION.renderDailyQuoteWidget) {
      try { window.GAMIFICATION.renderDailyQuoteWidget(quoteBox); } catch(e) {
        renderFallbackQuote(quoteBox);
      }
    } else {
      renderFallbackQuote(quoteBox);
    }
    root.appendChild(quoteBox);


    /* ═══ STREAK ═══ */
    root.appendChild(h('div', 'dash-label', 'Votre série'));
    if (window.GAMIFICATION && window.GAMIFICATION.updateStreak) {
      try { window.GAMIFICATION.updateStreak(); } catch(e){}
    }
    var streakBox = h('div', 'dash-widget-box');
    if (window.GAMIFICATION && window.GAMIFICATION.renderStreakWidget) {
      try { window.GAMIFICATION.renderStreakWidget(streakBox); } catch(e) {
        renderFallbackStreak(streakBox);
      }
    } else {
      renderFallbackStreak(streakBox);
    }
    root.appendChild(streakBox);


    /* ═══ TODAY'S OVERVIEW ═══ */
    root.appendChild(h('div', 'dash-label', 'Aperçu du jour'));
    var grid = h('div', 'dash-card-grid');

    // Weight
    var wVal = lastWeight(logs);
    var _wUnit = window.UNITS ? window.UNITS.weightLabel() : 'kg';
    var _wDisplay = wVal !== null ? (window.UNITS ? window.UNITS.displayWeightVal(wVal) : wVal) : '--';
    var weightCard = h('div', 'dash-card', [
      h('p', 'dash-card-title', window.t('dash.weight')),
      h('div', 'dash-big', [
        document.createTextNode(_wDisplay),
        h('span', 'dash-unit', _wUnit)
      ])
    ]);
    grid.appendChild(weightCard);

    // Calories
    var cVal = lastCalorieTarget(logs);
    var calCard = h('div', 'dash-card', [
      h('p', 'dash-card-title', window.t('dash.goal')),
      h('div', 'dash-big', [
        document.createTextNode(cVal !== null ? cVal : '--'),
        h('span', 'dash-unit', window.t('common.kcal'))
      ])
    ]);
    grid.appendChild(calCard);

    // Water
    var wProg = waterProgress(logs);
    var waterPct = wProg ? Math.min(100, Math.round((wProg.current / wProg.goal) * 100)) : 0;
    var waterCard = h('div', 'dash-card');
    waterCard.appendChild(h('p', 'dash-card-title', window.t('extras.water')));
    var waterBig = h('div', 'dash-big');
    waterBig.appendChild(document.createTextNode(wProg ? wProg.current : '--'));
    waterBig.appendChild(h('span', 'dash-unit', wProg ? '/ ' + wProg.goal + ' ml' : 'ml'));
    waterCard.appendChild(waterBig);
    var track = h('div', 'dash-minibar-track');
    var fill = h('div', 'dash-minibar-fill');
    fill.style.width = waterPct + '%';
    track.appendChild(fill);
    waterCard.appendChild(track);
    grid.appendChild(waterCard);

    // Sleep
    var sVal = lastSleep(logs);
    var sleepCard = h('div', 'dash-card', [
      h('p', 'dash-card-title', window.t('extras.sleep')),
      h('div', 'dash-big', [
        document.createTextNode(sVal !== null ? sVal : '--'),
        h('span', 'dash-unit', 'h')
      ])
    ]);
    grid.appendChild(sleepCard);

    // Sport burned today — add card if session was validated today
    (function() {
      var S = window.S;
      if (!S || !S.sessionHistory) return;
      var today = new Date().toISOString().slice(0, 10);
      var todaySess = null;
      Object.keys(S.sessionHistory).forEach(function(k) {
        var se = S.sessionHistory[k];
        if (se && se.date && se.date.slice(0, 10) === today) todaySess = se;
      });
      if (!todaySess || !todaySess.kcalTotal) return;
      var burnCard = h('div', 'dash-card', [
        h('p', 'dash-card-title', '\uD83C\uDFCB\uFE0F Brûlées'),
        h('div', 'dash-big', [
          document.createTextNode(todaySess.kcalTotal),
          h('span', 'dash-unit', 'kcal')
        ])
      ]);
      grid.appendChild(burnCard);
      // Net calories (target - burned) — important for recovery nutrition
      var calTarget = window.calcTarget ? window.calcTarget() : 0;
      if (calTarget > 0) {
        var netKcal = calTarget - todaySess.kcalTotal;
        var netCard = h('div', 'dash-card', [
          h('p', 'dash-card-title', '\u26a1 Kcal nettes récupération'),
          h('div', 'dash-big', [
            document.createTextNode(Math.max(0, netKcal)),
            h('span', 'dash-unit', 'kcal')
          ]),
          h('p', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin:4px 0 0;font-family:"Helvetica Neue",Arial,sans-serif'}, 'Objectif \u2212 dépense = disponible récupération')
        ]);
        grid.appendChild(netCard);
      }
    })();

    root.appendChild(grid);


    /* ═══ MACROS P/G/L ═══ */
    var macros = window.calcMacros ? window.calcMacros() : null;
    var macroTarget = window.calcTarget ? window.calcTarget() : 0;
    if (macros && macroTarget > 0) {
      root.appendChild(h('div', 'dash-label', 'Macros du jour'));
      var macroCard = h('div', 'dash-card');
      var macroItems = [
        {label: 'Protéines', val: macros.p, color: '#1A4A1A', kcalPerG: 4},
        {label: 'Glucides',  val: macros.g, color: '#1A3A6A', kcalPerG: 4},
        {label: 'Lipides',   val: macros.l, color: '#6A4A1A', kcalPerG: 9}
      ];
      macroItems.forEach(function(item) {
        var row = document.createElement('div');
        row.style.cssText = 'margin-bottom:10px';
        // Label row
        var labelRow = document.createElement('div');
        labelRow.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;font-family:"Helvetica Neue",Arial,sans-serif';
        var labelSpan = document.createElement('span');
        labelSpan.style.cssText = 'color:var(--grey,#6B6B65)';
        labelSpan.textContent = item.label;
        var valSpan = document.createElement('span');
        valSpan.style.cssText = 'color:var(--black,#181818);font-weight:600';
        valSpan.textContent = item.val + 'g';
        labelRow.appendChild(labelSpan);
        labelRow.appendChild(valSpan);
        row.appendChild(labelRow);
        // Bar
        var barBg = document.createElement('div');
        barBg.style.cssText = 'height:6px;background:rgba(0,0,0,0.08);border-radius:3px;overflow:hidden';
        var pct = Math.min(100, Math.round(item.val * item.kcalPerG / macroTarget * 100));
        var barFill = document.createElement('div');
        barFill.style.cssText = 'height:6px;width:' + pct + '%;background:' + item.color + ';border-radius:3px;transition:width 0.3s';
        barBg.appendChild(barFill);
        row.appendChild(barBg);
        macroCard.appendChild(row);
      });
      root.appendChild(macroCard);
    }


    /* ═══ WIDGET GROSSESSE ═══ */
    if (S.pregnant && S.sex === 'femme') {
      var pregTri = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
      var pregWeightGuide = window.getPregnancyWeightGuideline ? window.getPregnancyWeightGuideline() : null;
      if (pregTri) {
        root.appendChild(h('div', 'dash-label', 'Grossesse — Semaine ' + pregTri.week));
        var pregCard = document.createElement('div');
        pregCard.className = 'dash-card';
        pregCard.style.cssText = 'border-left:4px solid #5A1010;padding:16px;background:rgba(233,30,99,0.03);margin-bottom:12px;';

        var pregTitle = document.createElement('div');
        pregTitle.style.cssText = 'font-family:Georgia,serif;font-size:17px;color:#5A1010;margin-bottom:4px;';
        pregTitle.textContent = '\uD83E\uDD30 ' + pregTri.trimester.name + ' \u2014 ' + pregTri.trimester.desc;
        pregCard.appendChild(pregTitle);

        var pregProgress = document.createElement('div');
        pregProgress.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:10px;';
        pregProgress.textContent = 'Progression : ' + pregTri.progress + '% \u2014 ' + pregTri.weeksLeft + ' semaines restantes';
        pregCard.appendChild(pregProgress);

        // Progress bar
        var pregBarBg = document.createElement('div');
        pregBarBg.style.cssText = 'height:6px;background:rgba(0,0,0,0.08);border-radius:3px;overflow:hidden;margin-bottom:12px;';
        var pregBarFill = document.createElement('div');
        pregBarFill.style.cssText = 'height:6px;width:' + pregTri.progress + '%;background:#5A1010;border-radius:3px;';
        pregBarBg.appendChild(pregBarFill);
        pregCard.appendChild(pregBarBg);

        // Calorie info
        var pregCal = document.createElement('div');
        pregCal.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#5A1010;margin-bottom:6px;';
        var extraKcal = pregTri.trimester.calorieExtra || 0;
        pregCal.textContent = extraKcal > 0 ? '+' + extraKcal + ' kcal/jour (besoins grossesse inclus dans votre cible)' : 'T1 : pas de calories supplémentaires nécessaires';
        pregCard.appendChild(pregCal);

        // Weight guideline
        if (pregWeightGuide) {
          var pregWeight = document.createElement('div');
          pregWeight.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:10px;';
          pregWeight.textContent = 'Poids attendu à SA' + pregTri.week + ' : ' + pregWeightGuide.expectedWeightMin + '\u2013' + pregWeightGuide.expectedWeightMax + ' kg (gain cible : +' + pregWeightGuide.currentExpectedGainMin + '\u2013+' + pregWeightGuide.currentExpectedGainMax + ' kg)';
          pregCard.appendChild(pregWeight);
        }

        // Nutrition tips (top 3)
        var tipsTitle = document.createElement('div');
        tipsTitle.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5A1010;margin-bottom:6px;';
        tipsTitle.textContent = 'Conseils nutrition ce trimestre';
        pregCard.appendChild(tipsTitle);
        (pregTri.trimester.nutritionTips || []).slice(0, 3).forEach(function(tip) {
          var tipEl = document.createElement('div');
          tipEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:3px;padding-left:8px;';
          tipEl.textContent = '\u2022 ' + tip;
          pregCard.appendChild(tipEl);
        });

        // Sport warning
        var pregSportWarn = window.getPregnancySportWarning ? window.getPregnancySportWarning() : null;
        if (pregSportWarn) {
          var warnBox = document.createElement('div');
          warnBox.style.cssText = 'margin-top:10px;padding:8px 10px;background:rgba(233,30,99,0.07);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5A1010;border-radius:2px;';
          warnBox.textContent = pregSportWarn;
          pregCard.appendChild(warnBox);
        }

        root.appendChild(pregCard);
      }
    }


    /* ═══ ALERTES MÉDICALES ═══ */
    if (S.medical && S.medical.length > 0) {
      var hasDiabDash = S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1 || S.medical.indexOf('prediabete') !== -1;
      if (hasDiabDash) {
        root.appendChild(h('div', 'dash-label', 'Suivi médical'));
        var diabWarnCard = document.createElement('div');
        diabWarnCard.style.cssText = 'background:var(--orangebg,rgba(106,74,26,.06));border-left:4px solid #6A4A1A;padding:14px 16px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;line-height:1.6;';
        var diabWarnTitle = document.createElement('div');
        diabWarnTitle.style.cssText = 'font-weight:700;color:#6A4A1A;margin-bottom:6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;';
        diabWarnTitle.textContent = '\u26A0 Diabète — Recommandations importantes';
        diabWarnCard.appendChild(diabWarnTitle);
        var diabWarnMsg = document.createElement('div');
        diabWarnMsg.style.cssText = 'color:#6A4A1A;';
        diabWarnMsg.textContent = 'Consultez votre médecin ou diabétologue avant de modifier votre alimentation ou votre programme sportif. Mesurez votre glycémie régulièrement, notamment avant et après l\'effort. Privilegiez les aliments à index glycémique bas.';
        diabWarnCard.appendChild(diabWarnMsg);
        root.appendChild(diabWarnCard);
      }
    }

    /* ═══ QUICK ACTIONS ═══ */
    root.appendChild(h('div', 'dash-label', 'Accès rapide'));

    // Big nav cards
    var navGrid = h('div', 'dash-card-grid');

    var nutCard = h('div', 'dash-nav');
    nutCard.appendChild(h('span', 'dash-nav-icon', '\u25C6'));
    nutCard.appendChild(h('p', 'dash-nav-name', 'Nutrition'));
    nutCard.appendChild(h('p', 'dash-nav-sub', 'Planifiez vos repas'));
    nutCard.addEventListener('click', function() {
      if (window.APP_NAVIGATE) window.APP_NAVIGATE('nutrition');
    });
    nutCard.style.cursor = 'pointer';
    navGrid.appendChild(nutCard);

    var sportCard = h('div', 'dash-nav');
    sportCard.appendChild(h('span', 'dash-nav-icon', '\u25C6'));
    sportCard.appendChild(h('p', 'dash-nav-name', 'Sport'));
    sportCard.appendChild(h('p', 'dash-nav-sub', 'Votre programme'));
    sportCard.addEventListener('click', function() {
      if (window.APP_NAVIGATE) window.APP_NAVIGATE('sport');
    });
    sportCard.style.cursor = 'pointer';
    navGrid.appendChild(sportCard);

    root.appendChild(navGrid);

    // Smaller action cards
    var actGrid = h('div', 'dash-card-grid-3');

    var weightAction = h('div', 'dash-action');
    weightAction.appendChild(h('span', 'dash-action-icon', '\u2696'));
    weightAction.appendChild(h('p', 'dash-action-name', 'Poids'));
    weightAction.appendChild(h('p', 'dash-action-sub', 'Enregistrer mon poids'));
    weightAction.addEventListener('click', function() {
      openWeightPrompt();
    });
    actGrid.appendChild(weightAction);

    var measAction = h('div', 'dash-action');
    measAction.appendChild(h('span', 'dash-action-icon', '\uD83D\uDCCF'));
    measAction.appendChild(h('p', 'dash-action-name', 'Mensurations'));
    measAction.appendChild(h('p', 'dash-action-sub', 'Mes mensurations'));
    measAction.addEventListener('click', function() {
      openMeasurementsModal();
    });
    actGrid.appendChild(measAction);

    var timerAction = h('div', 'dash-action');
    timerAction.appendChild(h('span', 'dash-action-icon', '\u23F1'));
    timerAction.appendChild(h('p', 'dash-action-name', window.t('extras.timer')));
    timerAction.appendChild(h('p', 'dash-action-sub', 'Timer cuisine'));
    timerAction.addEventListener('click', function() {
      openKitchenTimer();
    });
    actGrid.appendChild(timerAction);

    root.appendChild(actGrid);


    /* ═══ WATER TRACKER ═══ */
    root.appendChild(h('div', 'dash-label', 'Suivi hydratation'));
    var waterWidget = h('div', 'dash-widget-box');
    if (window.WATER_TRACKER && window.WATER_TRACKER.renderWidget) {
      try { window.WATER_TRACKER.renderWidget(waterWidget); } catch(e) {
        waterWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module hydratation indisponible')));
      }
    } else {
      waterWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module hydratation non chargé')));
    }
    root.appendChild(waterWidget);


    /* ═══ SLEEP TRACKER ═══ */
    root.appendChild(h('div', 'dash-label', 'Suivi sommeil'));
    var sleepWidget = h('div', 'dash-widget-box');
    if (window.SLEEP_TRACKER && window.SLEEP_TRACKER.renderWidget) {
      try { window.SLEEP_TRACKER.renderWidget(sleepWidget); } catch(e) {
        sleepWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module sommeil indisponible')));
      }
    } else {
      sleepWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module sommeil non chargé')));
    }
    root.appendChild(sleepWidget);


    /* ═══ WEEKLY SUMMARY ═══ */
    root.appendChild(h('div', 'dash-label', 'Résumé hebdomadaire'));
    var weeklyWidget = h('div', 'dash-widget-box');
    if (window.WEEKLY_SUMMARY && window.WEEKLY_SUMMARY.renderWidget) {
      try { window.WEEKLY_SUMMARY.renderWidget(weeklyWidget); } catch(e) {
        weeklyWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Résumé indisponible')));
      }
    } else {
      weeklyWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module résumé non chargé')));
    }
    root.appendChild(weeklyWidget);


    /* ═══ PROGRESSION ═══ */
    root.appendChild(h('div', 'dash-label', 'Ma progression'));
    var perfWidget = h('div', 'dash-widget-box');
    if (window.PERF_HISTORY && window.PERF_HISTORY.renderProgressionWidget) {
      try { PERF_HISTORY.renderProgressionWidget(perfWidget); } catch(e) {
        perfWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Progression indisponible')));
      }
    } else {
      perfWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module progression non chargé')));
    }
    root.appendChild(perfWidget);

    // Créer canvas Chart.js pour la courbe de poids
    var rawHistCheck = (window.S && window.S.weightHistory ? window.S.weightHistory : []).filter(function(e) {
      if (!e) return false;
      var w = parseFloat(e.weight || e.w || e);
      return !isNaN(w) && w > 0;
    });
    var chartWrap = h('div', {'class': 'card', style: 'margin-bottom:16px'});
    chartWrap.appendChild(h('div', {'class': 'label-caps', style: 'margin-bottom:8px'}, 'PROGRESSION DU POIDS'));
    if (rawHistCheck.length < 2) {
      var weightEmptyState = document.createElement('div');
      weightEmptyState.className = 'empty-state';
      var weightEmptyIcon = document.createElement('span');
      weightEmptyIcon.className = 'empty-state-icon';
      weightEmptyIcon.textContent = '\u2696\ufe0f';
      var weightEmptyTitle = document.createElement('p');
      weightEmptyTitle.className = 'empty-state-title';
      weightEmptyTitle.textContent = 'Aucune courbe disponible';
      var weightEmptyMsg = document.createElement('p');
      weightEmptyMsg.textContent = 'Ajoutez votre premier poids pour voir la courbe de progression.';
      weightEmptyState.appendChild(weightEmptyIcon);
      weightEmptyState.appendChild(weightEmptyTitle);
      weightEmptyState.appendChild(weightEmptyMsg);
      chartWrap.appendChild(weightEmptyState);
    } else {
      var canvas = h('canvas', {id: 'weight-chart', style: 'width:100%;height:180px;max-height:180px'});
      chartWrap.appendChild(canvas);
    }
    root.appendChild(chartWrap);

    // Initialiser le chart après rendu DOM
    requestAnimationFrame(function() {
      if (!window.Chart) return;
      var ctx = document.getElementById('weight-chart');
      if (!ctx || !ctx.getContext) return;
      var rawHist = (window.S && window.S.weightHistory ? window.S.weightHistory : []).slice(-12);
      var filteredLabels = [];
      var filteredData = [];
      (rawHist || []).forEach(function(e) {
        if (!e) return;
        var w = parseFloat(e.weight || e.w || e);
        if (isNaN(w) || w <= 0) return;
        filteredLabels.push(e.date ? e.date.substring(5) : '?');
        filteredData.push(w);
      });
      if (filteredData.length < 2) return;
      if (window._dashWeightChart) { try { window._dashWeightChart.destroy(); } catch(e2) {} window._dashWeightChart = null; }
      var isDark = document.body.classList.contains('dark-mode') || window.matchMedia('(prefers-color-scheme: dark)').matches;
      var chartAccent = isDark ? '#1A4A1A' : '#1A4A1A';
      var chartAccentBg = isDark ? 'rgba(74,186,74,0.08)' : 'rgba(26,74,26,0.08)';
      var chartGrid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
      window._dashWeightChart = (window.createChart ? window.createChart(ctx, {
        type: 'line',
        data: {
          labels: filteredLabels,
          datasets: [{
            data: filteredData,
            borderColor: chartAccent,
            backgroundColor: chartAccentBg,
            pointRadius: 4,
            pointBackgroundColor: chartAccent,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              grid: { color: chartGrid },
              ticks: { font: { size: 10 }, callback: function(v) { return window.UNITS ? window.UNITS.displayWeightVal(v) + ' ' + window.UNITS.weightLabel() : v + ' kg'; } }
            },
            x: { grid: { display: false }, ticks: { font: { size: 9 } } }
          }
        }
      }) : null);
    });

    // Chart kcal semaine
    var kcalWrap = h('div', {'class': 'card', style: 'margin-bottom:16px'});
    kcalWrap.appendChild(h('div', {'class': 'label-caps', style: 'margin-bottom:8px'}, 'CALORIES PAR JOUR — PLAN SEMAINE'));
    if (window.S && window.S.weekPlan && window.S.weekPlan.length === 7) {
      var kcalCanvas = h('canvas', {id: 'kcal-chart', style: 'width:100%;height:140px;max-height:140px'});
      kcalWrap.appendChild(kcalCanvas);
      root.appendChild(kcalWrap);

      requestAnimationFrame(function() {
        if (!window.Chart) return;
        var ctx2 = document.getElementById('kcal-chart');
        if (!ctx2 || !ctx2.getContext) return;
        if (!window.S || !Array.isArray(window.S.weekPlan) || window.S.weekPlan.length !== 7) return;
        var JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
        var target = (window.calcTarget ? window.calcTarget() : 0) || (window.S.calories && window.S.calories > 0 ? window.S.calories : 2000);
        var dayKcals = window.S.weekPlan.map(function(day) {
          if (!day) return 0;
          // weekPlan structure: {breakfast, lunch, snack, dinner} — not {meals:[]}
          function getK(meal) { return (meal && (meal.k || (meal.baseNutrition && meal.baseNutrition.calories) || meal.kcal)) || 0; }
          return getK(day.breakfast) + getK(day.lunch) + getK(day.snack) + getK(day.dinner);
        });
        if (window._dashKcalChart) { try { window._dashKcalChart.destroy(); } catch(e2) {} window._dashKcalChart = null; }
        var isDark2 = document.body.classList.contains('dark-mode') || window.matchMedia('(prefers-color-scheme: dark)').matches;
        var kcalGreen = isDark2 ? 'rgba(74,186,74,0.7)' : 'rgba(26,74,26,0.7)';
        var kcalGreenFull = isDark2 ? 'rgba(74,186,74,0.9)' : 'rgba(26,74,26,0.9)';
        var kcalRed = isDark2 ? 'rgba(218,106,106,0.7)' : 'rgba(180,40,40,0.7)';
        var kcalRedLine = isDark2 ? '#5A1010' : '#5A1010';
        var kcalGrid2 = isDark2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
        window._dashKcalChart = (window.createChart ? window.createChart(ctx2, {
          type: 'bar',
          data: {
            labels: JOURS,
            datasets: [
              {
                label: 'Kcal plan',
                data: dayKcals,
                backgroundColor: dayKcals.map(function(k) {
                  var ratio = k / target;
                  return ratio < 0.92 ? kcalGreen : ratio > 1.08 ? kcalRed : kcalGreenFull;
                }),
                borderRadius: 4
              },
              {
                label: 'Cible',
                data: Array(7).fill(target),
                type: 'line',
                borderColor: kcalRedLine,
                borderDash: [4,3],
                pointRadius: 0,
                borderWidth: 1.5,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                grid: { color: kcalGrid2 },
                ticks: { font: { size: 9 }, callback: function(v) { return v + ' kcal'; } }
              },
              x: { grid: { display: false }, ticks: { font: { size: 9 } } }
            }
          }
        }) : null);
      });
    } else {
      var weekEmptyState = document.createElement('div');
      weekEmptyState.className = 'empty-state';
      var weekEmptyIcon = document.createElement('span');
      weekEmptyIcon.className = 'empty-state-icon';
      weekEmptyIcon.textContent = '\uD83D\uDDD3\ufe0f';
      var weekEmptyTitle = document.createElement('p');
      weekEmptyTitle.className = 'empty-state-title';
      weekEmptyTitle.textContent = 'Aucun plan semaine généré';
      var weekEmptyMsg = document.createElement('p');
      weekEmptyMsg.textContent = 'Générez votre plan semaine dans Nutrition pour commencer à suivre vos calories.';
      weekEmptyState.appendChild(weekEmptyIcon);
      weekEmptyState.appendChild(weekEmptyTitle);
      weekEmptyState.appendChild(weekEmptyMsg);
      kcalWrap.appendChild(weekEmptyState);
      root.appendChild(kcalWrap);
    }


    /* ═══ FOOD JOURNAL ═══ */
    root.appendChild(h('div', 'dash-label', 'Journal alimentaire'));
    var foodJournalWidget = h('div', 'dash-widget-box');
    if (window.FOOD_JOURNAL) {
      try { FOOD_JOURNAL.renderWidget(foodJournalWidget); } catch(e) {}
    }
    root.appendChild(foodJournalWidget);


    /* ═══ PROGRESS PHOTOS ═══ */
    if (window.PHOTO_PROGRESS && window.PHOTO_PROGRESS.renderWidget) {
      var photoWidget = h('div', 'dash-widget-box');
      try { PHOTO_PROGRESS.renderWidget(photoWidget); } catch(e) {}
      root.appendChild(photoWidget);
    }

    /* ═══ BADGES PREVIEW ═══ */
    root.appendChild(h('div', 'dash-label', 'Badges'));
    var badgesCard = h('div', 'dash-card');
    var badgesRow = h('div', 'dash-badges-row');
    var badges = getBadges();
    if (badges.length > 0) {
      badges.forEach(function(b) {
        var def = (window.GAMIFICATION && window.GAMIFICATION.BADGE_DEFS) ? window.GAMIFICATION.BADGE_DEFS.find(function(d){ return d.id === b.id; }) : null;
        var mini = h('div', 'dash-badge-mini', (def && def.icon) || b.icon || b.emoji || '\u2605');
        if (def && def.name) mini.title = def.name;
        else if (b.name) mini.title = b.name;
        badgesRow.appendChild(mini);
      });
    } else {
      var b1 = h('div', 'dash-badge-mini', '\u2605');
      b1.title = 'Premier pas'; b1.style.opacity = '.35';
      var b2 = h('div', 'dash-badge-mini', '\uD83D\uDD25');
      b2.title = 'Série de 7 jours'; b2.style.opacity = '.35';
      var b3 = h('div', 'dash-badge-mini', '\uD83C\uDFC6');
      b3.title = 'Objectif atteint'; b3.style.opacity = '.35';
      badgesRow.appendChild(b1);
      badgesRow.appendChild(b2);
      badgesRow.appendChild(b3);
      var badgeEncouragement = document.createElement('p');
      badgeEncouragement.style.cssText = 'font-size:11px;color:var(--grey,#6B6B65);margin:8px 0 0;font-family:"Helvetica Neue",Arial,sans-serif;line-height:1.5;';
      badgeEncouragement.textContent = 'Continuez \u2014 vos premiers badges vous attendent !';
      badgesCard.appendChild(badgeEncouragement);
    }
    var badgeLink = h('span', 'dash-badge-link', 'Voir tous les badges \u2192');
    badgeLink.addEventListener('click', function() {
      if (window.GAMIFICATION && window.GAMIFICATION.renderBadgesPanel) {
        openBadgesModal();
      }
    });
    badgesRow.appendChild(badgeLink);
    badgesCard.appendChild(badgesRow);
    root.appendChild(badgesCard);


    /* ═══ MES DONNÉES ═══ */
    root.appendChild(h('div', 'dash-label', 'Mes données'));
    var dataSection = h('div', 'dash-data-section');
    var dataBtns = h('div', 'dash-data-btns');

    var exportBtn = document.createElement('button');
    exportBtn.className = 'dash-btn-primary';
    exportBtn.textContent = '\u2B07 Exporter mes données';
    exportBtn.addEventListener('click', function() { exportAllData(); });
    dataBtns.appendChild(exportBtn);

    var importBtn = document.createElement('button');
    importBtn.className = 'dash-btn-secondary';
    importBtn.textContent = '\u2B06 Importer une sauvegarde';
    importBtn.addEventListener('click', function() { importData(); });
    dataBtns.appendChild(importBtn);

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'dash-btn-danger';
    deleteBtn.textContent = 'Supprimer toutes mes données';
    deleteBtn.addEventListener('click', function() { deleteAllData(); });
    dataBtns.appendChild(deleteBtn);

    dataSection.appendChild(dataBtns);
    root.appendChild(dataSection);


    /* ═══ SESSION INFO ═══ */
    var sessionMin = tryGetSessionMinutes();
    var lastDate = lastVisitDate(logs);
    var sessionParts = [];
    sessionParts.push('Session : ' + (sessionMin || 0) + ' min');
    if (lastDate) {
      sessionParts.push('Dernière visite : ' + lastDate.getDate() + ' ' + MOIS[lastDate.getMonth()] + ' ' + lastDate.getFullYear());
    }
    root.appendChild(h('div', 'dash-session', sessionParts.join(' | ')));


    /* ─── MOUNT ─── */
    container.appendChild(root);
  }
};


/* ═══ ACTION MODALS / PROMPTS ═══ */

function openWeightPrompt() {
  var overlay = h('div', 'dash-modal-overlay');
  var box = h('div', 'dash-modal-box');

  var closeBtn = document.createElement('button');
  closeBtn.className = 'dash-modal-close';
  closeBtn.textContent = '\u00D7';
  closeBtn.addEventListener('click', function(){ document.body.removeChild(overlay); });
  box.appendChild(closeBtn);

  box.appendChild(h('div', 'dash-label', 'Enregistrer mon poids'));

  var form = document.createElement('div');
  form.style.cssText = 'margin-top:16px;';

  var input = document.createElement('input');
  input.type = 'number';
  input.step = '0.1';
  input.placeholder = 'Ex : 72.5';
  input.style.cssText = 'width:100%;padding:12px;font-family:Georgia,serif;font-size:18px;font-style:italic;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);color:var(--black,#181818);box-sizing:border-box;outline:none;margin-bottom:12px;';
  form.appendChild(input);

  var unit = h('p', null, window.UNITS ? window.UNITS.weightLabel() : 'kg');
  unit.style.cssText = 'font-size:11px;color:var(--grey,#6B6B65);margin:0 0 16px;';
  form.appendChild(unit);

  var saveBtn = document.createElement('button');
  saveBtn.textContent = 'Enregistrer';
  saveBtn.style.cssText = 'width:100%;padding:12px;background:var(--black,#181818);color:var(--ivory,#FAF9F6);border:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s ease;';
  saveBtn.addEventListener('mouseenter', function(){ saveBtn.style.opacity = '.8'; });
  saveBtn.addEventListener('mouseleave', function(){ saveBtn.style.opacity = '1'; });
  saveBtn.addEventListener('click', function() {
    var val = parseFloat(input.value);
    if (isNaN(val) || val <= 0) { input.style.borderColor = '#c44'; return; }
    // Convert to kg for internal storage
    var valKg = window.UNITS ? window.UNITS.toKg(val) : val;

    // Save to state FIRST (always succeeds)
    if (window.S) window.S.weight = valKg;

    // Log to BLACKBOX
    try { if (window.BLACKBOX) window.BLACKBOX.log('weight_logged', { weight: valKg }); } catch(e){}

    // Save to weight history in localStorage (always in kg internally)
    var user = tryGetUser();
    var userId = user ? user.id : 'anon';
    var whKey = 'mtd_weight_history_' + userId;
    var wh = [];
    try { wh = JSON.parse(localStorage.getItem(whKey) || '[]'); } catch(e){ wh = []; }
    wh.push({ date: new Date().toISOString().split('T')[0], weight: valKg });
    try { localStorage.setItem(whKey, JSON.stringify(wh)); } catch(e){}
    // Sync poids vers Supabase
    if (window.SupaSync) SupaSync.saveWeight(new Date().toISOString().split('T')[0], valKg);

    // Update S.weightHistory for other modules
    if (window.S && Array.isArray(window.S.weightHistory)) {
      window.S.weightHistory.push({ date: new Date().toISOString().split('T')[0], weight: valKg });
    }

    // Toast + badges
    if (window.GAMIFICATION) {
      try {
        GAMIFICATION.showToast('Poids enregistré : ' + (window.UNITS ? window.UNITS.displayWeight(valKg) : valKg + ' kg'));
        GAMIFICATION.unlockBadge('first_weigh');
        if (wh.length >= 10) GAMIFICATION.unlockBadge('weight_10');
      } catch(e){}
    }

    document.body.removeChild(overlay);
    if (window.APP_RENDER) window.APP_RENDER();
  });
  form.appendChild(saveBtn);

  box.appendChild(form);
  overlay.appendChild(box);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
  setTimeout(function(){ input.focus(); }, 100);
}

function openMeasurementsModal() {
  var overlay = h('div', 'dash-modal-overlay');
  var box = h('div', 'dash-modal-box');

  var closeBtn = document.createElement('button');
  closeBtn.className = 'dash-modal-close';
  closeBtn.textContent = '\u00D7';
  closeBtn.addEventListener('click', function(){ document.body.removeChild(overlay); });
  box.appendChild(closeBtn);

  box.appendChild(h('div', 'dash-label', 'Mes mensurations'));

  var formContainer = document.createElement('div');
  formContainer.style.cssText = 'margin-top:16px;';
  if (window.MEASUREMENTS && window.MEASUREMENTS.renderForm) {
    try { window.MEASUREMENTS.renderForm(formContainer); } catch(e) {
      formContainer.appendChild(h('p', null, 'Module mensurations indisponible.'));
      if (formContainer.lastChild) formContainer.lastChild.style.cssText = 'font-size:13px;color:var(--grey,#6B6B65);';
    }
  } else {
    formContainer.appendChild(h('p', null, 'Module mensurations non chargé.'));
    if (formContainer.lastChild) formContainer.lastChild.style.cssText = 'font-size:13px;color:var(--grey,#6B6B65);';
  }
  box.appendChild(formContainer);

  overlay.appendChild(box);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

function openBadgesModal() {
  var overlay = h('div', 'dash-modal-overlay');
  var box = h('div', 'dash-modal-box');

  var closeBtn = document.createElement('button');
  closeBtn.className = 'dash-modal-close';
  closeBtn.textContent = '\u00D7';
  closeBtn.addEventListener('click', function(){ document.body.removeChild(overlay); });
  box.appendChild(closeBtn);

  box.appendChild(h('div', 'dash-label', 'Tous les badges'));

  var panel = document.createElement('div');
  panel.style.cssText = 'margin-top:16px;';
  if (window.GAMIFICATION && window.GAMIFICATION.renderBadgesPanel) {
    try { window.GAMIFICATION.renderBadgesPanel(panel); } catch(e) {
      panel.appendChild(h('p', null, 'Panneau badges indisponible.'));
      if (panel.lastChild) panel.lastChild.style.cssText = 'font-size:13px;color:var(--grey,#6B6B65);';
    }
  }
  box.appendChild(panel);

  overlay.appendChild(box);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

function openKitchenTimer() {
  // Clear any previous kitchen timer interval
  if (window._kitchenTimerInterval) { clearInterval(window._kitchenTimerInterval); window._kitchenTimerInterval = null; }
  var overlay = h('div', 'dash-modal-overlay');
  var box = h('div', 'dash-modal-box');
  box.style.textAlign = 'center';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'dash-modal-close';
  closeBtn.textContent = '\u00D7';
  closeBtn.addEventListener('click', function(){ clearInterval(interval); document.body.removeChild(overlay); });
  box.appendChild(closeBtn);

  box.appendChild(h('div', 'dash-label', 'Timer cuisine'));

  var display = h('div', 'dash-big', '00:00');
  display.style.cssText = 'font-size:48px;margin:24px 0 8px;';
  box.appendChild(display);

  var presets = h('div', null);
  presets.style.cssText = 'margin:12px 0 20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;';
  var presetValues = [
    { label:'1 min', sec:60 },
    { label:'3 min', sec:180 },
    { label:'5 min', sec:300 },
    { label:'10 min', sec:600 },
    { label:'15 min', sec:900 }
  ];
  var totalSeconds = 0;
  var running = false;
  var interval = null;

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function updateDisplay() {
    display.textContent = formatTime(totalSeconds);
  }

  presetValues.forEach(function(p) {
    var btn = document.createElement('button');
    btn.textContent = p.label;
    btn.style.cssText = 'padding:6px 12px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);font-size:11px;cursor:pointer;transition:all .2s ease;font-family:"Helvetica Neue",Arial,sans-serif;';
    btn.addEventListener('mouseenter', function(){ btn.style.background = 'var(--black,#181818)'; btn.style.color = 'var(--ivory,#FAF9F6)'; });
    btn.addEventListener('mouseleave', function(){ btn.style.background = 'var(--ivory2,#F4F4F0)'; btn.style.color = 'var(--black,#181818)'; });
    btn.addEventListener('click', function() {
      if (running) { clearInterval(interval); running = false; }
      totalSeconds = p.sec;
      updateDisplay();
    });
    presets.appendChild(btn);
  });
  box.appendChild(presets);

  var controls = h('div', null);
  controls.style.cssText = 'display:flex;gap:8px;justify-content:center;';

  var startBtn = document.createElement('button');
  startBtn.textContent = window.t('extras.start');
  startBtn.style.cssText = 'padding:10px 24px;background:var(--black,#181818);color:var(--ivory,#FAF9F6);border:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s ease;';
  startBtn.addEventListener('click', function() {
    if (running) return;
    if (totalSeconds <= 0) return;
    running = true;
    startBtn.textContent = 'En cours...';
    interval = window._kitchenTimerInterval = setInterval(function() {
      totalSeconds--;
      updateDisplay();
      if (totalSeconds <= 0) {
        clearInterval(interval);
        running = false;
        startBtn.textContent = window.t('extras.start');
        display.textContent = 'Terminé !';
        display.style.color = 'var(--black,#181818)';
        try { if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([200,100,200]); } catch(e){}
      }
    }, 1000);
  });
  controls.appendChild(startBtn);

  var resetBtn = document.createElement('button');
  resetBtn.textContent = window.t('extras.reset');
  resetBtn.style.cssText = 'padding:10px 24px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s ease;';
  resetBtn.addEventListener('click', function() {
    clearInterval(interval);
    running = false;
    totalSeconds = 0;
    startBtn.textContent = window.t('extras.start');
    updateDisplay();
  });
  controls.appendChild(resetBtn);

  box.appendChild(controls);

  overlay.appendChild(box);
  overlay.addEventListener('click', function(e){ if(e.target === overlay){ clearInterval(interval); document.body.removeChild(overlay); } });
  document.body.appendChild(overlay);
}


/* ═══ DATA EXPORT / IMPORT / DELETE ═══ */

function exportAllData() {
  var user = (window.AUTH && AUTH.getUser) ? AUTH.getUser() : null;
  user = user || {};
  var userId = user.id || 'anon';

  var backup = {
    version: '1.0',
    date: new Date().toISOString(),
    user: { name: user.name, email: user.email },
    data: {}
  };

  // Collect all mtd_ prefixed localStorage keys
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.indexOf('mtd_') === 0) {
      try { backup.data[key] = JSON.parse(localStorage.getItem(key)); }
      catch(e) { backup.data[key] = localStorage.getItem(key); }
    }
  }

  var blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'mtd-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);

  if (window.GAMIFICATION) GAMIFICATION.showToast('Données exportées !');
}

function importData() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var backup = JSON.parse(ev.target.result);
        if (!backup.data || !backup.version) { alert('Fichier invalide'); return; }

        if (!confirm('Cela remplacera vos données actuelles. Continuer ?')) return;

        Object.keys(backup.data).forEach(function(key) {
          localStorage.setItem(key, typeof backup.data[key] === 'string' ? backup.data[key] : JSON.stringify(backup.data[key]));
        });

        if (window.GAMIFICATION) GAMIFICATION.showToast('Données restaurées !');
        setTimeout(function(){ location.reload(); }, 1000);
      } catch(err) {
        alert('Erreur de lecture : ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function deleteAllData() {
  if (!confirm('Êtes-vous sûr ? Toutes vos données seront supprimées définitivement.')) return;
  if (!confirm('Dernière confirmation : cette action est irréversible. Continuer ?')) return;

  var keysToRemove = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.indexOf('mtd_') === 0) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(function(key) {
    localStorage.removeItem(key);
  });

  if (window.AUTH && window.AUTH.logout) {
    try { window.AUTH.logout(); } catch(e){}
  }

  if (window.GAMIFICATION) GAMIFICATION.showToast('Données supprimées.');
  setTimeout(function(){ location.reload(); }, 1000);
}


/* ═══ FALLBACK WIDGETS ═══ */

function renderFallbackQuote(container) {
  var quotes = [
    'Le corps atteint ce que l\'esprit croit.',
    'Chaque jour est une nouvelle occasion de progresser.',
    'La discipline est le pont entre les objectifs et les résultats.',
    'Prenez soin de votre corps, c\'est le seul endroit où vous vivez.',
    'Le succès est la somme de petits efforts répétés jour après jour.'
  ];
  var today = new Date();
  var idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % quotes.length;
  var quoteText = quotes[idx];

  if (window.GAMIFICATION && window.GAMIFICATION.getDailyQuote) {
    try {
      var q = window.GAMIFICATION.getDailyQuote();
      if (q) quoteText = typeof q === 'string' ? q : (q.text || q.quote || quoteText);
    } catch(e){}
  }

  var card = h('div', 'dash-quote-card');
  var p = h('p', 'dash-quote-text', '\u00AB ' + quoteText + ' \u00BB');
  card.appendChild(p);
  container.appendChild(card);
}

function renderFallbackStreak(container) {
  var streak = 0;
  if (window.GAMIFICATION && window.GAMIFICATION.getStreak) {
    try { var s = window.GAMIFICATION.getStreak(); streak = (s && typeof s === 'object') ? (s.current || 0) : (s || 0); } catch(e){}
  }
  var card = h('div', 'dash-card');
  card.appendChild(h('p', 'dash-card-title', 'Série en cours'));
  var big = h('div', 'dash-big');
  big.appendChild(document.createTextNode(streak));
  big.appendChild(h('span', 'dash-unit', streak === 1 ? 'jour' : 'jours'));
  card.appendChild(big);
  container.appendChild(card);
}


})();
