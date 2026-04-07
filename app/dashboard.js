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
  '.dash-action-icon { display:none; }',
  '.dash-action-name { font-family:Georgia,serif; font-size:16px; font-style:italic; margin:0 0 4px; transition:all .2s ease; }',
  '.dash-action-sub { font-size:11px; color:var(--grey,#6B6B65); margin:0; transition:all .2s ease; }',

  /* Big nav cards */
  '.dash-nav { background:var(--black,#181818); color:var(--ivory,#FAF9F6); border:1px solid var(--black,#181818); padding:28px 20px; cursor:pointer; transition:all .2s ease; }',
  '.dash-nav:hover { background:var(--ivory,#FAF9F6); color:var(--black,#181818); }',
  '.dash-nav:hover .dash-nav-sub { color:var(--grey,#6B6B65); }',
  '.dash-nav-icon { display:none; }',
  '.dash-nav-name { font-family:Georgia,serif; font-size:18px; font-style:italic; margin:0 0 4px; }',
  '.dash-nav-sub { font-size:11px; opacity:.65; margin:0; transition:all .2s ease; }',

  /* Mini badges */
  '.dash-badges-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }',
  '.dash-badge-mini { width:36px; height:36px; border-radius:2px; background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); display:flex; align-items:center; justify-content:center; font-size:14px; }',
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
  '.dash-btn-primary { width:100%; padding:18px 28px; background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); border:1px solid var(--black,#0A0A09); border-radius:2px; font-size:9px; letter-spacing:6px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-primary:hover { background:var(--black2,#181818); }',
  '.dash-btn-secondary { width:100%; padding:12px 24px; background:transparent; color:var(--grey,#6B6B65); border:1px solid var(--border,#D8D8D0); border-radius:2px; font-size:9px; letter-spacing:4px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-secondary:hover { border-color:var(--black,#0A0A09); color:var(--black,#0A0A09); }',
  '.dash-btn-danger { width:100%; padding:12px 24px; background:transparent; color:var(--red,#5A1010); border:1px solid var(--red,#5A1010); border-radius:2px; font-size:9px; letter-spacing:4px; text-transform:uppercase; cursor:pointer; transition:all .2s ease; font-family:"Helvetica Neue",Arial,sans-serif; }',
  '.dash-btn-danger:hover { background:var(--redbg,rgba(90,16,16,.06)); }',

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
  } catch(e) {
    console.error('[dashboard] erreur:', e);
  }
  return [];
}


/* ─── WELCOME SCREEN (jour 0 — avant génération du plan) ─── */
function renderWelcomeScreen(container) {
  var S = window.S || {};
  var user = tryGetUser();
  var root = h('div', 'dash-root');

  /* Greeting */
  var now = new Date();
  var _greetName = (user && user.name ? firstName(user.name) : '') || (S.prenom || '');
  var greeting = greetingWord() + (_greetName ? ', ' + _greetName : '');
  root.appendChild(h('h1', 'dash-greeting', greeting));
  var dateStr = frenchDate(now).charAt(0).toUpperCase() + frenchDate(now).slice(1);
  root.appendChild(h('p', 'dash-date', dateStr));

  // Message motivation du jour
  if (window.MOTIVATION) {
    var motivMsg = document.createElement('p');
    motivMsg.style.cssText = 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--grey,#6B6B65);margin:0 0 20px;line-height:1.6;border-left:2px solid var(--border,#D8D8D0);padding-left:14px;';
    motivMsg.textContent = window.MOTIVATION.getDailySportMessage();
    root.appendChild(motivMsg);
  }

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

    /* ─── WELCOME SCREEN: afficher uniquement si onboarding non complété ─── */
    var hasPlan = Array.isArray(S.weekPlan) && S.weekPlan.length > 0;
    // Returning sport user (a completed sport onboarding) → show dashboard even without weekPlan
    var hasProfile = !!(S.sex || S.goal || S.sportType || S.sStep >= 20);
    if (!hasPlan && !hasProfile) {
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
    var _greetName2 = (user && user.name ? firstName(user.name) : '') || (S.prenom || '');
    var greeting = greetingWord() + (_greetName2 ? ', ' + _greetName2 : '');
    root.appendChild(h('h1', 'dash-greeting', greeting));
    var dateStr = frenchDate(now).charAt(0).toUpperCase() + frenchDate(now).slice(1);
    root.appendChild(h('p', 'dash-date', dateStr));

    // Message motivation du jour
    if (window.MOTIVATION) {
      var motivMsg = document.createElement('p');
      motivMsg.style.cssText = 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--grey,#6B6B65);margin:0 0 20px;line-height:1.6;border-left:2px solid var(--border,#D8D8D0);padding-left:14px;';
      motivMsg.textContent = window.MOTIVATION.getDailySportMessage();
      root.appendChild(motivMsg);
    }

    /* ═══ SPORT DU JOUR ═══ */
    (function() {
      var todayIdx = now.getDay(); // 0=dim, 1=lun, ..., 6=sam
      // weekPlan[0]=lundi ... weekPlan[6]=dimanche
      var planIdx = todayIdx === 0 ? 6 : todayIdx - 1;
      var sportType = S.sportType || '';
      var sportLabels = {
        crossfit: 'Cross Training', running: 'Running', triathlon: 'Triathlon',
        calisthenics: 'Callisthenie', cycling: 'Cyclisme', hyrox: 'Hyrox',
        muscu: 'Musculation', yoga: 'Yoga', padel: 'Padel', golf: 'Golf'
      };
      var sportLabel = sportLabels[sportType] || sportType;
      // Detect rest day from weekPlan structure (check if session is empty/rest)
      var todayPlanDay = Array.isArray(S.weekPlan) && S.weekPlan[planIdx] ? S.weekPlan[planIdx] : null;
      var isRestDay = todayPlanDay && todayPlanDay.type === 'rest';
      // For triathlon users: also check current week's session by day index (triathlon REST sessions)
      if (!isRestDay && sportType === 'triathlon' && Array.isArray(S.triathlonProgram) && S.triathlonProgram.length > 0) {
        var triWeekIdx = Math.max(0, (S.triathlonWeek || 1) - 1);
        var triWeekData = S.triathlonProgram[Math.min(triWeekIdx, S.triathlonProgram.length - 1)];
        if (triWeekData && Array.isArray(triWeekData.sessions) && triWeekData.sessions[planIdx]) {
          var triTodaySess = triWeekData.sessions[planIdx];
          if (triTodaySess.discipline === 'rest') isRestDay = true;
        }
      }
      if (sportType && !isRestDay) {
        // Calcul calories estimées (MET × poids × durée)
        var sportLevel = S.crossfitLevel || S.runningLevel || S.hyroxLevel || S.triathlonLevel || S.cyclingLevel || S.calisthenicsLevel || S.sportLevel || 'intermediaire';
        // Normalize English level keys to French for dashDurMap/dashMET lookups
        var _LEVEL_FR_DASH = { beginner: 'debutant', intermediate: 'intermediaire', advanced: 'avance' };
        var sportLevelFr = _LEVEL_FR_DASH[sportLevel] || sportLevel;
        var dashKcal = (typeof window.estimateKcal === 'function') ? window.estimateKcal(sportType, sportLevel, null) : 0;
        var dashMET = { crossfit: { scaled: 7, inter: 8, rx: 9, rx_plus: 12 }, running: { debutant: 7, intermediaire: 9, avance: 11, elite: 12 }, triathlon: { beginner: 8, intermediate: 10, advanced: 12, elite: 13 }, calisthenics: { debutant: 4, intermediaire: 6, avance: 8, elite: 9 }, cycling: { debutant: 6, intermediaire: 8, avance: 10, elite: 12 }, hyrox: { debutant: 9, intermediaire: 11, avance: 13, elite: 14 }, muscu: { debutant: 4, intermediaire: 5, avance: 6, elite: 7 }, yoga: { debutant: 2.5, intermediaire: 3, avance: 4, elite: 4 }, padel: { debutant: 6, intermediaire: 8, avance: 9, elite: 10 }, golf: { debutant: 3.5, intermediaire: 4, avance: 4.5, elite: 5 } };
        var dashDurMap = { crossfit: { scaled: 60, inter: 70, rx: 75, rx_plus: 90, intermediaire: 75 }, running: { debutant: 45, intermediaire: 60, avance: 75, elite: 90 }, triathlon: { beginner: 75, intermediate: 90, advanced: 105, elite: 120, intermediaire: 90 }, calisthenics: { debutant: 50, intermediaire: 65, avance: 80, elite: 90 }, cycling: { debutant: 60, intermediaire: 75, avance: 90, elite: 120 }, hyrox: { debutant: 60, intermediaire: 75, avance: 90, elite: 105 }, muscu: { debutant: 50, intermediaire: 60, avance: 75, elite: 90 }, yoga: { debutant: 45, intermediaire: 60, avance: 75, elite: 90 }, padel: { debutant: 60, intermediaire: 75, avance: 90, elite: 90 }, golf: { debutant: 90, intermediaire: 120, avance: 150, elite: 180 } };
        if (!dashKcal && dashMET[sportType]) {
          var dashMetVal = dashMET[sportType][sportLevelFr] || dashMET[sportType]['intermediaire'] || 8;
          var dashDurSport = dashDurMap[sportType] ? (dashDurMap[sportType][sportLevelFr] || dashDurMap[sportType]['intermediaire'] || 60) : 60;
          var dashPoids = parseFloat(S.weight) || 75;
          dashKcal = Math.round(dashMetVal * dashPoids * (dashDurSport / 60));
        }
        var dashDurFinal = dashDurMap[sportType] ? (dashDurMap[sportType][sportLevelFr] || dashDurMap[sportType]['intermediaire'] || 60) : 60;
        var sportCard = document.createElement('div');
        sportCard.style.cssText = 'border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);padding:24px 20px;margin-bottom:16px;cursor:pointer;transition:all 0.25s ease;border-left:3px solid var(--black,#0A0A09);';

        sportCard.onmouseenter = function() {
          this.style.background = 'var(--black,#0A0A09)';
          this.style.borderColor = 'var(--black,#0A0A09)';
          this.style.borderLeftColor = 'var(--black,#0A0A09)';
          var sub = this.querySelector('.sport-card-sub');
          if (sub) sub.style.color = 'rgba(250,249,246,0.6)';
          var label = this.querySelector('.sport-card-label');
          if (label) label.style.color = 'rgba(250,249,246,0.5)';
          var title = this.querySelector('.sport-card-title');
          if (title) title.style.color = 'var(--ivory,#FAF9F6)';
          var cta = this.querySelector('.sport-card-cta');
          if (cta) { cta.style.background = 'var(--ivory,#FAF9F6)'; cta.style.color = 'var(--black,#0A0A09)'; }
        };
        sportCard.onmouseleave = function() {
          this.style.background = 'var(--ivory2,#F4F4F0)';
          this.style.borderColor = 'var(--border,#D8D8D0)';
          this.style.borderLeftColor = 'var(--black,#0A0A09)';
          var sub = this.querySelector('.sport-card-sub');
          if (sub) sub.style.color = 'var(--grey,#6B6B65)';
          var label = this.querySelector('.sport-card-label');
          if (label) label.style.color = 'var(--grey,#6B6B65)';
          var title = this.querySelector('.sport-card-title');
          if (title) title.style.color = 'var(--black,#0A0A09)';
          var cta = this.querySelector('.sport-card-cta');
          if (cta) { cta.style.background = 'var(--black,#0A0A09)'; cta.style.color = 'var(--ivory,#FAF9F6)'; }
        };
        // XSS fix: build card via DOM — sportLabel comes from S.sportType (localStorage) and must not be injected via innerHTML
        var _scLabel = document.createElement('div');
        _scLabel.className = 'sport-card-label';
        _scLabel.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px;transition:color 0.25s ease';
        _scLabel.textContent = 'Séance du jour';
        var _scTitle = document.createElement('div');
        _scTitle.className = 'sport-card-title';
        _scTitle.style.cssText = 'font-family:Georgia,serif;font-size:22px;font-style:italic;color:var(--black,#0A0A09);margin-bottom:' + (dashKcal > 0 ? '6px' : '20px') + ';line-height:1.2;transition:color 0.25s ease';
        _scTitle.textContent = sportLabel;
        var _scCta = document.createElement('div');
        _scCta.className = 'sport-card-cta';
        _scCta.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);padding:12px 20px;display:inline-block;border-radius:2px;transition:all 0.25s ease';
        _scCta.textContent = 'Commencer la séance';
        sportCard.appendChild(_scLabel);
        sportCard.appendChild(_scTitle);
        if (dashKcal > 0) {
          var _scSub = document.createElement('div');
          _scSub.className = 'sport-card-sub';
          _scSub.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:20px;letter-spacing:1px;transition:color 0.25s ease';
          _scSub.textContent = '~' + dashKcal + ' kcal · ' + dashDurFinal + ' min';
          sportCard.appendChild(_scSub);
        }
        sportCard.appendChild(_scCta);
        sportCard.addEventListener('click', function() {
          if (window.APP_NAVIGATE) window.APP_NAVIGATE('sport');
        });
        root.appendChild(sportCard);
      } else if (isRestDay) {
        var restCard = document.createElement('div');
        restCard.style.cssText = 'border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);padding:20px;margin-bottom:16px;border-left:2px solid var(--border,#D8D8D0);';
        // Static content — built via DOM for consistency
        var _rcLine1 = document.createElement('div');
        _rcLine1.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px';
        _rcLine1.textContent = 'Aujourd\'hui';
        var _rcLine2 = document.createElement('div');
        _rcLine2.style.cssText = 'font-family:Georgia,serif;font-size:18px;font-style:italic;color:var(--grey,#6B6B65)';
        _rcLine2.textContent = 'Journ\u00e9e de r\u00e9cup\u00e9ration';
        var _rcLine3 = document.createElement('div');
        _rcLine3.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey3,#9A9A90);margin-top:6px;letter-spacing:0.5px';
        _rcLine3.textContent = 'Repos actif \u00b7 Mobilit\u00e9 \u00b7 Hydratation';
        restCard.appendChild(_rcLine1);
        restCard.appendChild(_rcLine2);
        restCard.appendChild(_rcLine3);
        root.appendChild(restCard);
      }
    })();

    /* ═══ NUTRITION CONTEXTUELLE ═══ */
    (function() {
      var hour = now.getHours();
      var mealSlot, mealLabel;
      if (hour >= 6 && hour < 10) { mealSlot = 'breakfast'; mealLabel = 'Petit-dejeuner'; }
      else if (hour >= 11 && hour < 14) { mealSlot = 'lunch'; mealLabel = 'Dejeuner'; }
      else if (hour >= 14 && hour < 18) { mealSlot = 'snack'; mealLabel = 'Collation'; }
      else if (hour >= 18) { mealSlot = 'dinner'; mealLabel = 'Diner ce soir'; }
      else { mealSlot = null; mealLabel = null; }

      if (!mealSlot) return;

      var todayIdx2 = now.getDay();
      var planIdx2 = todayIdx2 === 0 ? 6 : todayIdx2 - 1;
      var todayPlan2 = Array.isArray(S.weekPlan) && S.weekPlan[planIdx2] ? S.weekPlan[planIdx2] : null;
      var meal = todayPlan2 ? todayPlan2[mealSlot] : null;
      if (!meal) return;

      // Rehydrate meal name from recipe engine if needed
      var mealName = meal.n || '';
      if (!mealName && meal._id && window.RecipeEngine && window.RecipeEngine.findRecipe) {
        try { var rf = window.RecipeEngine.findRecipe(meal._id); if (rf) mealName = rf.n || ''; } catch(e) { console.warn('[dashboard] recipe lookup fail:', meal._id, e); }
      }
      if (!mealName) return;

      var kcal = meal.k || 0;
      var nutCard = document.createElement('div');
      nutCard.style.cssText = 'border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);padding:24px 20px;margin-bottom:16px;cursor:pointer;transition:all 0.25s ease;';
      nutCard.onmouseenter = function() {
        this.style.background = 'var(--black,#0A0A09)';
        this.style.borderColor = 'var(--black,#0A0A09)';
        this.querySelectorAll('[data-nut-label]').forEach(function(el){ el.style.color = 'rgba(250,249,246,0.5)'; });
        this.querySelectorAll('[data-nut-title]').forEach(function(el){ el.style.color = 'var(--ivory,#FAF9F6)'; });
        this.querySelectorAll('[data-nut-sub]').forEach(function(el){ el.style.color = 'rgba(250,249,246,0.55)'; });
        this.querySelectorAll('[data-nut-cta]').forEach(function(el){ el.style.color = 'rgba(250,249,246,0.5)'; el.style.borderTopColor = 'rgba(250,249,246,0.15)'; });
      };
      nutCard.onmouseleave = function() {
        this.style.background = 'var(--ivory2,#F4F4F0)';
        this.style.borderColor = 'var(--border,#D8D8D0)';
        this.querySelectorAll('[data-nut-label]').forEach(function(el){ el.style.color = 'var(--grey,#6B6B65)'; });
        this.querySelectorAll('[data-nut-title]').forEach(function(el){ el.style.color = 'var(--black,#0A0A09)'; });
        this.querySelectorAll('[data-nut-sub]').forEach(function(el){ el.style.color = 'var(--grey,#6B6B65)'; });
        this.querySelectorAll('[data-nut-cta]').forEach(function(el){ el.style.color = 'var(--grey,#6B6B65)'; el.style.borderTopColor = 'var(--border,#D8D8D0)'; });
      };
      // XSS fix: build card via DOM — mealName comes from weekPlan (localStorage/Supabase) and mealLabel is a computed string
      var _nutLabelEl = document.createElement('div');
      _nutLabelEl.setAttribute('data-nut-label', '');
      _nutLabelEl.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px;transition:color 0.25s ease';
      _nutLabelEl.textContent = mealLabel;
      var _nutTitleEl = document.createElement('div');
      _nutTitleEl.setAttribute('data-nut-title', '');
      _nutTitleEl.style.cssText = 'font-family:Georgia,serif;font-size:20px;font-style:italic;color:var(--black,#0A0A09);margin-bottom:6px;line-height:1.3;transition:color 0.25s ease';
      _nutTitleEl.textContent = mealName;
      var _nutSubEl = document.createElement('div');
      if (kcal) {
        _nutSubEl.setAttribute('data-nut-sub', '');
        _nutSubEl.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:16px;letter-spacing:1px;transition:color 0.25s ease';
        _nutSubEl.textContent = kcal + ' kcal';
      } else {
        _nutSubEl.style.marginBottom = '16px';
      }
      var _nutCtaEl = document.createElement('div');
      _nutCtaEl.setAttribute('data-nut-cta', '');
      _nutCtaEl.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;color:var(--grey,#6B6B65);letter-spacing:3px;text-transform:uppercase;border-top:1px solid var(--border,#D8D8D0);padding-top:12px;transition:all 0.25s ease';
      _nutCtaEl.textContent = 'Voir le plan nutrition →';
      nutCard.appendChild(_nutLabelEl);
      nutCard.appendChild(_nutTitleEl);
      nutCard.appendChild(_nutSubEl);
      nutCard.appendChild(_nutCtaEl);
      nutCard.addEventListener('click', function() {
        if (window.APP_NAVIGATE) window.APP_NAVIGATE('nutrition');
      });
      root.appendChild(nutCard);

      // Message nutrition contextuelle
      if (window.MOTIVATION) {
        var nutMotiv = document.createElement('p');
        nutMotiv.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin:-8px 0 16px;letter-spacing:0.5px;line-height:1.5;';
        nutMotiv.textContent = window.MOTIVATION.getNutritionSlotMessage(mealSlot);
        root.appendChild(nutMotiv);
      }
    })();

    /* ═══ BIRTHDAY BANNER ═══ */
    if (window.isBirthday && window.isBirthday()) {
      var _bdAge = window.getAge ? window.getAge() : null;
      var _bdBanner = h('div', null);
      _bdBanner.style.cssText = 'background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:20px;margin-bottom:16px;text-align:center';
      // XSS fix: build birthday banner via DOM — _bdAge is derived from localStorage birthDate
      var _bdLine1 = document.createElement('div');
      _bdLine1.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px';
      _bdLine1.textContent = 'Anniversaire';
      var _bdLine2 = document.createElement('div');
      _bdLine2.style.cssText = 'font-family:Georgia,serif;font-size:20px;font-style:italic;color:var(--black,#0A0A09)';
      _bdLine2.textContent = 'Joyeux anniversaire' + (_bdAge ? ' \u2014 ' + parseInt(_bdAge, 10) + ' ans' : '');
      var _bdLine3 = document.createElement('div');
      _bdLine3.style.cssText = 'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:6px';
      _bdLine3.textContent = 'Toute l\'\u00e9quipe SmartFitCoach vous souhaite une merveilleuse journ\u00e9e';
      _bdBanner.appendChild(_bdLine1);
      _bdBanner.appendChild(_bdLine2);
      _bdBanner.appendChild(_bdLine3);
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
      try { window.GAMIFICATION.updateStreak(); } catch(e) { console.error('[dashboard] erreur:', e); }
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
        barBg.style.cssText = 'height:2px;background:var(--ivory3,#EEEDE8);overflow:hidden';
        var pct = Math.min(100, Math.round(item.val * item.kcalPerG / macroTarget * 100));
        var barFill = document.createElement('div');
        barFill.style.cssText = 'height:2px;width:' + pct + '%;background:var(--black,#0A0A09);transition:width 0.3s';
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
        pregCard.style.cssText = 'border:1px solid var(--red,#5A1010);padding:16px;background:var(--redbg,rgba(90,16,16,.06));margin-bottom:12px;';

        var pregTitle = document.createElement('div');
        pregTitle.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--red,#5A1010);margin-bottom:8px;';
        pregTitle.textContent = pregTri.trimester.name + ' \u2014 ' + pregTri.trimester.desc;
        pregCard.appendChild(pregTitle);

        var pregProgress = document.createElement('div');
        pregProgress.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:10px;';
        pregProgress.textContent = 'Progression : ' + pregTri.progress + '% \u2014 ' + pregTri.weeksLeft + ' semaines restantes';
        pregCard.appendChild(pregProgress);

        // Progress bar
        var pregBarBg = document.createElement('div');
        pregBarBg.style.cssText = 'height:2px;background:var(--ivory4,#E5E4DE);overflow:hidden;margin-bottom:12px;';
        var pregBarFill = document.createElement('div');
        pregBarFill.style.cssText = 'height:2px;width:' + pregTri.progress + '%;background:var(--red,#5A1010);';
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
        diabWarnCard.style.cssText = 'background:var(--orangebg,rgba(106,74,26,.06));border:1px solid var(--orange,#6A4A1A);padding:14px 16px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;line-height:1.6;';
        var diabWarnTitle = document.createElement('div');
        diabWarnTitle.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange,#6A4A1A);margin-bottom:6px;';
        diabWarnTitle.textContent = 'Diab\u00e8te \u2014 Recommandations';
        diabWarnCard.appendChild(diabWarnTitle);
        var diabWarnMsg = document.createElement('div');
        diabWarnMsg.style.cssText = 'color:var(--grey,#6B6B65);';
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
      try { FOOD_JOURNAL.renderWidget(foodJournalWidget); } catch(e) { console.error('[dashboard] erreur:', e); }
    }
    root.appendChild(foodJournalWidget);


    /* ═══ PROGRESS PHOTOS ═══ */
    if (window.PHOTO_PROGRESS && window.PHOTO_PROGRESS.renderWidget) {
      var photoWidget = h('div', 'dash-widget-box');
      try { PHOTO_PROGRESS.renderWidget(photoWidget); } catch(e) { console.error('[dashboard] erreur:', e); }
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

    var rgpdBtn = document.createElement('button');
    rgpdBtn.style.cssText = 'margin-top:12px;padding:10px 16px;background:transparent;border:1px solid var(--accent,#ff6b35);color:var(--accent,#ff6b35);border-radius:2px;cursor:pointer;font-size:13px;width:100%;';
    rgpdBtn.textContent = '\u2B07 Exporter mes données (RGPD)';
    rgpdBtn.addEventListener('click', function() { if (typeof exportUserData === 'function') exportUserData(); });
    dataBtns.appendChild(rgpdBtn);

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

    /* ─── SIGNATURE ─── */
    var igWrap = document.createElement('div');
    igWrap.style.cssText = 'text-align:center;margin-top:14px;padding-bottom:8px;';
    var igLink = document.createElement('a');
    igLink.href = 'https://instagram.com/smart.fitcoach';
    igLink.target = '_blank';
    igLink.rel = 'noopener noreferrer';
    igLink.textContent = '@smart.fitcoach';
    igLink.style.cssText = 'font-family:Georgia,serif;font-style:italic;font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;letter-spacing:1px;';
    igWrap.appendChild(igLink);
    root.appendChild(igWrap);


    /* ─── MOUNT ─── */
    container.appendChild(root);
  }
};


/* ═══ ACTION MODALS / PROMPTS ═══ */

function openWeightPrompt() {
  var overlay = h('div', 'dash-modal-overlay');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
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
      } catch(e) {
        console.error('[dashboard] erreur:', e);
      }
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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
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
        try { if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([200,100,200]); } catch(e) { console.error('[dashboard] erreur:', e); }
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
    try { window.AUTH.logout(); } catch(e) { console.error('[dashboard] erreur:', e); }
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
    } catch(e) {
      console.error('[dashboard] erreur:', e);
    }
  }

  var card = h('div', 'dash-quote-card');
  var p = h('p', 'dash-quote-text', '\u00AB ' + quoteText + ' \u00BB');
  card.appendChild(p);
  container.appendChild(card);
}

function renderFallbackStreak(container) {
  var streak = 0;
  if (window.GAMIFICATION && window.GAMIFICATION.getStreak) {
    try { var s = window.GAMIFICATION.getStreak(); streak = (s && typeof s === 'object') ? (s.current || 0) : (s || 0); } catch(e) { console.error('[dashboard] erreur:', e); }
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
