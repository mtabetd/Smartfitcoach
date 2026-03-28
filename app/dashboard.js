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
  '.dash-greeting { font-family:Georgia,serif; font-size:28px; font-style:italic; line-height:1.25; margin:0 0 2px; color:var(--black,#181818); }',
  '.dash-date { font-size:12px; color:var(--grey,#6B6B65); letter-spacing:1px; margin:0 0 24px; }',

  /* Cards */
  '.dash-card { background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); padding:16px; margin-bottom:12px; }',
  '.dash-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }',
  '.dash-card-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px; }',

  /* Big number */
  '.dash-big { font-family:Georgia,serif; font-style:italic; font-size:26px; line-height:1.1; color:var(--black,#181818); }',
  '.dash-unit { font-size:12px; font-style:normal; color:var(--grey,#6B6B65); margin-left:2px; }',
  '.dash-card-title { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--grey,#6B6B65); margin:0 0 8px; }',

  /* Quick-action cards */
  '.dash-action { background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); padding:20px 16px; cursor:pointer; transition:all .2s ease; text-align:center; }',
  '.dash-action:hover { background:var(--black,#181818); color:var(--ivory,#FAF9F6); border-color:var(--black,#181818); }',
  '.dash-action:hover .dash-action-sub { color:var(--ivory,#FAF9F6); opacity:.7; }',
  '.dash-action:hover .dash-action-icon { color:var(--ivory,#FAF9F6); }',
  '.dash-action-icon { font-size:22px; margin-bottom:8px; display:block; transition:all .2s ease; }',
  '.dash-action-name { font-family:Georgia,serif; font-size:16px; font-style:italic; margin:0 0 4px; transition:all .2s ease; }',
  '.dash-action-sub { font-size:11px; color:var(--grey,#6B6B65); margin:0; transition:all .2s ease; }',

  /* Big nav cards */
  '.dash-nav { background:var(--black,#181818); color:var(--ivory,#FAF9F6); border:1px solid var(--black,#181818); padding:28px 20px; cursor:pointer; transition:all .2s ease; }',
  '.dash-nav:hover { background:var(--ivory,#FAF9F6); color:var(--black,#181818); }',
  '.dash-nav:hover .dash-nav-sub { color:var(--grey,#6B6B65); }',
  '.dash-nav-icon { font-size:18px; margin-bottom:10px; display:block; }',
  '.dash-nav-name { font-family:Georgia,serif; font-size:20px; font-style:italic; margin:0 0 4px; }',
  '.dash-nav-sub { font-size:11px; opacity:.65; margin:0; transition:all .2s ease; }',

  /* Mini badges */
  '.dash-badges-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }',
  '.dash-badge-mini { width:44px; height:44px; border-radius:50%; background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); display:flex; align-items:center; justify-content:center; font-size:18px; }',
  '.dash-badge-link { font-size:11px; color:var(--grey,#6B6B65); cursor:pointer; margin-left:auto; transition:all .2s ease; text-decoration:none; }',
  '.dash-badge-link:hover { color:var(--black,#181818); }',

  /* Session footer */
  '.dash-session { font-size:10px; letter-spacing:1px; color:var(--grey,#6B6B65); text-align:center; margin-top:32px; padding-top:12px; border-top:1px solid var(--border,#D8D8D0); }',

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
  '.dash-modal-close { position:absolute; top:12px; right:16px; background:none; border:none; font-size:20px; cursor:pointer; color:var(--grey,#6B6B65); transition:all .2s ease; }',
  '.dash-modal-close:hover { color:var(--black,#181818); }',

  /* Data management buttons */
  '.dash-data-section { margin-top:32px; }',
  '.dash-data-btns { display:flex; flex-direction:column; gap:10px; }',
  '.dash-btn-primary { width:100%; padding:14px; background:var(--black,#181818); color:var(--ivory,#FAF9F6); border:none; font-size:12px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-primary:hover { opacity:.85; }',
  '.dash-btn-secondary { width:100%; padding:14px; background:var(--ivory2,#F4F4F0); color:var(--black,#181818); border:1px solid var(--border,#D8D8D0); font-size:12px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-secondary:hover { background:var(--black,#181818); color:var(--ivory,#FAF9F6); }',
  '.dash-btn-danger { width:100%; padding:14px; background:transparent; color:#c0392b; border:1px solid #c0392b; font-size:12px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-danger:hover { background:#c0392b; color:#fff; }',

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
  if (hr < 5) return 'Bonne nuit';
  if (hr < 12) return 'Bonjour';
  if (hr < 18) return 'Bon apres-midi';
  return 'Bonsoir';
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


/* ─── MAIN MODULE ─── */
window.DASHBOARD = {

  render: function(container) {
    if (!container) return;
    container.innerHTML = '';

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
    root.appendChild(h('div', 'dash-label', 'Votre serie'));
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
    root.appendChild(h('div', 'dash-label', 'Apercu du jour'));
    var grid = h('div', 'dash-card-grid');

    // Weight
    var wVal = lastWeight(logs);
    var weightCard = h('div', 'dash-card', [
      h('p', 'dash-card-title', 'Poids'),
      h('div', 'dash-big', [
        document.createTextNode(wVal !== null ? wVal : '--'),
        h('span', 'dash-unit', 'kg')
      ])
    ]);
    grid.appendChild(weightCard);

    // Calories
    var cVal = lastCalorieTarget(logs);
    var calCard = h('div', 'dash-card', [
      h('p', 'dash-card-title', 'Objectif calories'),
      h('div', 'dash-big', [
        document.createTextNode(cVal !== null ? cVal : '--'),
        h('span', 'dash-unit', 'kcal')
      ])
    ]);
    grid.appendChild(calCard);

    // Water
    var wProg = waterProgress(logs);
    var waterPct = wProg ? Math.min(100, Math.round((wProg.current / wProg.goal) * 100)) : 0;
    var waterCard = h('div', 'dash-card');
    waterCard.appendChild(h('p', 'dash-card-title', 'Hydratation'));
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
      h('p', 'dash-card-title', 'Sommeil'),
      h('div', 'dash-big', [
        document.createTextNode(sVal !== null ? sVal : '--'),
        h('span', 'dash-unit', 'h')
      ])
    ]);
    grid.appendChild(sleepCard);

    root.appendChild(grid);


    /* ═══ QUICK ACTIONS ═══ */
    root.appendChild(h('div', 'dash-label', 'Acces rapide'));

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
    timerAction.appendChild(h('p', 'dash-action-name', 'Timer'));
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
      waterWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module hydratation non charge')));
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
      sleepWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module sommeil non charge')));
    }
    root.appendChild(sleepWidget);


    /* ═══ WEEKLY SUMMARY ═══ */
    root.appendChild(h('div', 'dash-label', 'Resume hebdomadaire'));
    var weeklyWidget = h('div', 'dash-widget-box');
    if (window.WEEKLY_SUMMARY && window.WEEKLY_SUMMARY.renderWidget) {
      try { window.WEEKLY_SUMMARY.renderWidget(weeklyWidget); } catch(e) {
        weeklyWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Resume indisponible')));
      }
    } else {
      weeklyWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module resume non charge')));
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
      perfWidget.appendChild(h('div', 'dash-card', h('p', 'dash-card-title', 'Module progression non charge')));
    }
    root.appendChild(perfWidget);


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
        var mini = h('div', 'dash-badge-mini', b.icon || b.emoji || '\u2605');
        if (b.name) mini.title = b.name;
        badgesRow.appendChild(mini);
      });
    } else {
      var b1 = h('div', 'dash-badge-mini', '\u2605');
      b1.title = 'Premier pas'; b1.style.opacity = '.35';
      var b2 = h('div', 'dash-badge-mini', '\uD83D\uDD25');
      b2.title = 'Serie de 7 jours'; b2.style.opacity = '.35';
      var b3 = h('div', 'dash-badge-mini', '\uD83C\uDFC6');
      b3.title = 'Objectif atteint'; b3.style.opacity = '.35';
      badgesRow.appendChild(b1);
      badgesRow.appendChild(b2);
      badgesRow.appendChild(b3);
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
    root.appendChild(h('div', 'dash-label', 'Mes donnees'));
    var dataSection = h('div', 'dash-data-section');
    var dataBtns = h('div', 'dash-data-btns');

    var exportBtn = document.createElement('button');
    exportBtn.className = 'dash-btn-primary';
    exportBtn.textContent = '\u2B07 Exporter mes donnees';
    exportBtn.addEventListener('click', function() { exportAllData(); });
    dataBtns.appendChild(exportBtn);

    var importBtn = document.createElement('button');
    importBtn.className = 'dash-btn-secondary';
    importBtn.textContent = '\u2B06 Importer une sauvegarde';
    importBtn.addEventListener('click', function() { importData(); });
    dataBtns.appendChild(importBtn);

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'dash-btn-danger';
    deleteBtn.textContent = 'Supprimer toutes mes donnees';
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
      sessionParts.push('Derniere visite : ' + lastDate.getDate() + ' ' + MOIS[lastDate.getMonth()] + ' ' + lastDate.getFullYear());
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
  input.style.cssText = 'width:100%;padding:12px;font-family:Georgia,serif;font-size:20px;font-style:italic;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);color:var(--black,#181818);box-sizing:border-box;outline:none;margin-bottom:12px;';
  form.appendChild(input);

  var unit = h('p', null, 'kg');
  unit.style.cssText = 'font-size:11px;color:var(--grey,#6B6B65);margin:0 0 16px;';
  form.appendChild(unit);

  var saveBtn = document.createElement('button');
  saveBtn.textContent = 'Enregistrer';
  saveBtn.style.cssText = 'width:100%;padding:12px;background:var(--black,#181818);color:var(--ivory,#FAF9F6);border:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s ease;';
  saveBtn.addEventListener('mouseenter', function(){ saveBtn.style.opacity = '.8'; });
  saveBtn.addEventListener('mouseleave', function(){ saveBtn.style.opacity = '1'; });
  saveBtn.addEventListener('click', function() {
    var val = parseFloat(input.value);
    if (isNaN(val) || val <= 0) { input.style.borderColor = '#c44'; return; }

    // Save to state FIRST (always succeeds)
    if (window.S) window.S.weight = val;

    // Log to BLACKBOX
    try { if (window.BLACKBOX) window.BLACKBOX.log('weight_logged', { weight: val }); } catch(e){}

    // Save to weight history in localStorage
    var user = tryGetUser();
    var userId = user ? user.id : 'anon';
    var whKey = 'mtd_weight_history_' + userId;
    var wh = [];
    try { wh = JSON.parse(localStorage.getItem(whKey) || '[]'); } catch(e){ wh = []; }
    wh.push({ date: new Date().toISOString().split('T')[0], weight: val });
    try { localStorage.setItem(whKey, JSON.stringify(wh)); } catch(e){}

    // Update S.weightHistory for other modules
    if (window.S && Array.isArray(window.S.weightHistory)) {
      window.S.weightHistory.push({ date: new Date().toISOString().split('T')[0], weight: val });
    }

    // Toast + badges
    if (window.GAMIFICATION) {
      try {
        GAMIFICATION.showToast('Poids enregistré : ' + val + ' kg');
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
      formContainer.lastChild.style.cssText = 'font-size:12px;color:var(--grey,#6B6B65);';
    }
  } else {
    formContainer.appendChild(h('p', null, 'Module mensurations non charge.'));
    formContainer.lastChild.style.cssText = 'font-size:12px;color:var(--grey,#6B6B65);';
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
      panel.lastChild.style.cssText = 'font-size:12px;color:var(--grey,#6B6B65);';
    }
  }
  box.appendChild(panel);

  overlay.appendChild(box);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

function openKitchenTimer() {
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
  startBtn.textContent = 'Demarrer';
  startBtn.style.cssText = 'padding:10px 24px;background:var(--black,#181818);color:var(--ivory,#FAF9F6);border:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s ease;';
  startBtn.addEventListener('click', function() {
    if (running) return;
    if (totalSeconds <= 0) return;
    running = true;
    startBtn.textContent = 'En cours...';
    interval = setInterval(function() {
      totalSeconds--;
      updateDisplay();
      if (totalSeconds <= 0) {
        clearInterval(interval);
        running = false;
        startBtn.textContent = 'Demarrer';
        display.textContent = 'Termine !';
        display.style.color = 'var(--black,#181818)';
        try { if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([200,100,200]); } catch(e){}
      }
    }, 1000);
  });
  controls.appendChild(startBtn);

  var resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reinitialiser';
  resetBtn.style.cssText = 'padding:10px 24px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s ease;';
  resetBtn.addEventListener('click', function() {
    clearInterval(interval);
    running = false;
    totalSeconds = 0;
    startBtn.textContent = 'Demarrer';
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

  if (window.GAMIFICATION) GAMIFICATION.showToast('Donnees exportees !');
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

        if (!confirm('Cela remplacera vos donnees actuelles. Continuer ?')) return;

        Object.keys(backup.data).forEach(function(key) {
          localStorage.setItem(key, typeof backup.data[key] === 'string' ? backup.data[key] : JSON.stringify(backup.data[key]));
        });

        if (window.GAMIFICATION) GAMIFICATION.showToast('Donnees restaurees !');
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
  if (!confirm('Etes-vous sur ? Toutes vos donnees seront supprimees definitivement.')) return;
  if (!confirm('Derniere confirmation : cette action est irreversible. Continuer ?')) return;

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

  if (window.GAMIFICATION) GAMIFICATION.showToast('Donnees supprimees.');
  setTimeout(function(){ location.reload(); }, 1000);
}


/* ═══ FALLBACK WIDGETS ═══ */

function renderFallbackQuote(container) {
  var quotes = [
    'Le corps atteint ce que l\'esprit croit.',
    'Chaque jour est une nouvelle occasion de progresser.',
    'La discipline est le pont entre les objectifs et les resultats.',
    'Prenez soin de votre corps, c\'est le seul endroit ou vous vivez.',
    'Le succes est la somme de petits efforts repetes jour apres jour.'
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
  card.appendChild(h('p', 'dash-card-title', 'Serie en cours'));
  var big = h('div', 'dash-big');
  big.appendChild(document.createTextNode(streak));
  big.appendChild(h('span', 'dash-unit', streak === 1 ? 'jour' : 'jours'));
  card.appendChild(big);
  container.appendChild(card);
}


})();
