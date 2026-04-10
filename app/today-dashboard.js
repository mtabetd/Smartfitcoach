// today-dashboard.js — Vue "Aujourd'hui" : landing page quotidienne
(function() {
'use strict';

// ─── QUOTES LOCALES (sport/motivation) ───
var TODAY_QUOTES = [
  { text: "La constance est la clé de toute transformation.", author: "" },
  { text: "Chaque séance est un pas vers la meilleure version de toi.", author: "" },
  { text: "Le corps sait des choses que l'esprit refuse d'admettre.", author: "Paul Valéry" },
  { text: "La discipline, c'est se souvenir de ce que l'on veut vraiment.", author: "David Campbell" },
  { text: "Chaque journée est une nouvelle chance de changer ta vie.", author: "" },
  { text: "La force ne vient pas de la capacité physique. Elle vient d'une volonté indomptable.", author: "Gandhi" },
  { text: "Le succès, c'est la somme de petits efforts répétés jour après jour.", author: "Robert Collier" },
  { text: "N'abandonne pas. Souffre maintenant et vis le reste de ta vie comme un champion.", author: "Muhammad Ali" },
  { text: "Ton corps peut résister à presque tout. C'est ton esprit qu'il faut convaincre.", author: "" },
  { text: "La fatigue est temporaire. La fierté de l'effort dure toujours.", author: "" },
  { text: "Respecter son corps, c'est respecter la vie.", author: "" },
  { text: "Chaque repas est une opportunité de nourrir ton corps avec excellence.", author: "" },
  { text: "La nutrition est l'architecture invisible de ta performance.", author: "" },
  { text: "Le mouvement est la vie. La vie est le mouvement.", author: "Moshe Feldenkrais" },
  { text: "Ce n'est pas la montagne que nous conquérons, mais nous-mêmes.", author: "Edmund Hillary" }
];

// ─── HELPERS ───
function h(tag, attrs, children) {
  var el = document.createElement(tag);
  if (attrs && typeof attrs === 'object') {
    Object.keys(attrs).forEach(function(k) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'style') el.style.cssText = attrs[k];
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
  }
  if (typeof children === 'string') el.textContent = children;
  else if (Array.isArray(children)) children.forEach(function(c) { if (c) el.appendChild(c); });
  else if (children && children.nodeType) el.appendChild(children);
  return el;
}

function card(extraStyle) {
  return h('div', {
    style: 'border:1px solid var(--border);padding:16px;margin-bottom:12px;background:var(--ivory2);border-radius:2px;' + (extraStyle || '')
  });
}

function eyebrow(text) {
  return h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:8px;'
  }, text);
}

function cardTitle(text) {
  return h('div', {
    style: 'font-family:Georgia,serif;font-size:20px;font-weight:normal;margin-bottom:4px;'
  }, text);
}

function progressBar(val, max, color) {
  var pct = max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0;
  var outer = h('div', { style: 'height:4px;background:var(--border);border-radius:0;flex:1;overflow:hidden;' });
  var inner = h('div', { style: 'height:4px;background:' + (color || 'var(--accent)') + ';width:' + pct + '%;transition:width .3s ease;' });
  outer.appendChild(inner);
  return outer;
}

function macroRow(label, val, max) {
  var row = h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' });
  row.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);width:68px;flex-shrink:0;' }, label));
  row.appendChild(progressBar(val, max));
  row.appendChild(h('span', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);white-space:nowrap;'
  }, val + ' / ' + max + 'g'));
  return row;
}

// ─── GET STREAK ───
function getStreakValue() {
  try {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var uid = user ? user.id : 'anon';
    var key = 'mtd_streak_' + uid;
    var raw = localStorage.getItem(key);
    if (!raw) return 0;
    var data = JSON.parse(raw);
    return data && data.current ? data.current : 0;
  } catch(e) { return 0; }
}

// ─── BADGE ICON MAP (emoji overrides for richer display) ───
var BADGE_EMOJI = {
  // Onboarding
  'first_login':      { emoji: '⭐', label: 'Premier Pas',        desc: 'Première connexion' },
  'profile_complete': { emoji: '✅', label: 'Profil Complet',     desc: 'Toutes les infos renseignées' },
  'first_plan':       { emoji: '📋', label: 'Planificateur',      desc: 'Premier planning généré' },
  // Streak
  'streak_3':         { emoji: '🔥', label: '3 jours d\'affilée', desc: 'Connecté 3 jours de suite' },
  'streak_7':         { emoji: '🔥', label: 'Semaine Parfaite',   desc: '7 jours consécutifs' },
  'streak_14':        { emoji: '🔥', label: 'Deux Semaines',      desc: '14 jours consécutifs' },
  'streak_30':        { emoji: '🏆', label: 'Mois Complet',       desc: '30 jours consécutifs' },
  'streak_90':        { emoji: '🏆', label: 'Transformation',     desc: '90 jours consécutifs' },
  // Weight tracking
  'first_weigh':      { emoji: '⚖️', label: 'Suivi Lancé',        desc: 'Premier poids enregistré' },
  'weight_10':        { emoji: '⚖️', label: 'Régulier',           desc: '10 pesées enregistrées' },
  'weight_goal':      { emoji: '🎯', label: 'Objectif Atteint',   desc: 'Poids objectif atteint !' },
  'first_kg_lost':    { emoji: '📉', label: 'Premier Kilo',       desc: 'Premier kg perdu' },
  'five_kg':          { emoji: '📉', label: '-5 kg',              desc: '5 kg perdus' },
  // Exploration
  'recipes_10':       { emoji: '🍽️', label: 'Curieux',            desc: '10 recettes consultées' },
  'recipes_50':       { emoji: '🍽️', label: 'Gastronome',         desc: '50 recettes consultées' },
  'swap_master':      { emoji: '🔄', label: 'Swap Master',        desc: '20 repas échangés' },
  'all_cuisines':     { emoji: '🌍', label: 'Tour du Monde',      desc: 'Toutes les cuisines goûtées' },
  // Sport
  'first_workout':    { emoji: '💪', label: 'Sportif',            desc: 'Premier programme sport' },
  'exercises_20':     { emoji: '💪', label: 'Athlète',            desc: '20 exercices consultés' },
  // Calisthenics
  'calisth_first_session': { emoji: '🤸', label: 'Callisthéniste',      desc: 'Premier programme callisthénie' },
  'calisth_week_4':        { emoji: '🤸', label: 'Mois Callisthénie',   desc: '4 semaines complétées' },
  'calisth_week_12':       { emoji: '🤸', label: 'Trimestriel Calisth.', desc: '12 semaines complétées' },
  'calisth_first_pullup':  { emoji: '🏅', label: 'Première Traction',   desc: 'Première traction stricte' },
  'calisth_muscle_up':     { emoji: '🏅', label: 'Muscle-Up',           desc: 'Muscle-up strict maîtrisé' },
  // Muscu
  'bench_100':    { emoji: '🏋️', label: 'Centenaire',     desc: 'Développé couché : 100 kg' },
  'bench_120':    { emoji: '🏋️', label: 'Power Chest',    desc: 'Développé couché : 120 kg' },
  'squat_100':    { emoji: '🏋️', label: 'Squatteur',      desc: 'Squat : 100 kg' },
  'squat_140':    { emoji: '🏋️', label: 'Jambes de Fer',  desc: 'Squat : 140 kg' },
  'deadlift_100': { emoji: '🏋️', label: 'Terrasseur',     desc: 'Soulevé de terre : 100 kg' },
  'deadlift_160': { emoji: '🏋️', label: 'Force Brute',    desc: 'Soulevé de terre : 160 kg' },
  'overhead_70':  { emoji: '🏋️', label: 'Bras au Ciel',   desc: 'Développé militaire : 70 kg' },
  'total_300':    { emoji: '🥇', label: 'Powerlifter',    desc: 'Total bench+squat+dl ≥ 300 kg' },
  'total_400':    { emoji: '🥇', label: 'Elite Force',    desc: 'Total bench+squat+dl ≥ 400 kg' },
  'muscu_sessions_10': { emoji: '💪', label: 'Régularité Fer', desc: '10 séances muscu' },
  'muscu_sessions_50': { emoji: '💪', label: 'Dédicace',       desc: '50 séances muscu' },
  'first_pr':          { emoji: '🎖️', label: 'Premier PR',     desc: 'Premier record personnel' },
  // Photos
  'first_photo':  { emoji: '📸', label: 'Selfie',           desc: 'Première photo de progression' },
  'both_photos':  { emoji: '📸', label: 'Analyse Complète', desc: 'Photos face + dos' },
  // Hyrox
  'hyrox_first_program': { emoji: '🏃', label: 'Hyrox Starter',  desc: 'Premier programme Hyrox' },
  'hyrox_week_4':        { emoji: '🏃', label: 'Mois Hyrox',     desc: '4 semaines de préparation' },
  'hyrox_week_12':       { emoji: '🏃', label: 'Prépa Complète', desc: '12 semaines terminées' },
  'hyrox_sub90':         { emoji: '⏱️', label: 'Sub 1h30',       desc: 'Objectif sub 1h30 atteint' },
  'hyrox_sub60':         { emoji: '⏱️', label: 'Sub 1h00',       desc: 'Objectif sub 1h00 atteint' },
  'hyrox_pro':           { emoji: '⭐', label: 'Élite Hyrox',    desc: 'Programme niveau Pro/Élite' }
};

// ─── GET LAST BADGE ───
function getLastBadge() {
  try {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var uid = user ? user.id : 'anon';
    var key = 'mtd_badges_' + uid;
    var raw = localStorage.getItem(key);
    if (!raw) return null;
    var badges = JSON.parse(raw);
    if (!Array.isArray(badges) || badges.length === 0) return null;
    var last = badges[badges.length - 1];

    // Resolve badge ID — stored entries can be plain strings OR objects {id, unlockedAt}
    var badgeId = typeof last === 'string' ? last : (last && last.id ? last.id : null);
    if (!badgeId) return null;

    // 1. Try local BADGE_EMOJI map (always available, most reliable)
    if (BADGE_EMOJI[badgeId]) {
      var em = BADGE_EMOJI[badgeId];
      return { id: badgeId, name: em.label, icon: em.emoji, desc: em.desc };
    }

    // 2. Try window.GAMIFICATION.BADGE_DEFS (array keyed by .id)
    if (window.GAMIFICATION) {
      var defs = window.GAMIFICATION.BADGE_DEFS || window.GAMIFICATION.BADGES;
      if (Array.isArray(defs)) {
        var def = defs.find(function(b) { return b && b.id === badgeId; });
        if (def) return { id: def.id, name: def.name, icon: def.icon, desc: def.desc };
      } else if (defs && typeof defs === 'object') {
        // Object keyed by id
        var defObj = defs[badgeId];
        if (defObj) return { id: badgeId, name: defObj.name, icon: defObj.icon, desc: defObj.desc };
      }
    }

    // 3. Fallback: return readable id
    return { id: badgeId, name: badgeId, icon: '◆', desc: '' };
  } catch(e) { return null; }
}

// ─── GET TODAY FOOD TOTALS ───
function getTodayTotals() {
  if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal) {
    return window.FOOD_JOURNAL.getDayTotal();
  }
  // Fallback: read localStorage directly
  try {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var uid = user ? user.id : 'anon';
    var key = 'mtd_food_journal_' + uid;
    var journal = JSON.parse(localStorage.getItem(key) || '{}');
    var today = new Date().toISOString().split('T')[0];
    var entries = journal[today] || [];
    return entries.filter(function(e) { return e && typeof e === 'object'; }).reduce(function(acc, e) {
      acc.kcal += (e.kcal || 0);
      acc.p += (e.p || 0);
      acc.g += (e.g || 0);
      acc.l += (e.l || 0);
      return acc;
    }, { kcal: 0, p: 0, g: 0, l: 0 });
  } catch(e) { return { kcal: 0, p: 0, g: 0, l: 0 }; }
}

// ─── GET CALORIE TARGET ───
function getCalorieTarget() {
  if (window.calcTarget) {
    var t = window.calcTarget();
    if (t > 0) return t;
  }
  return 0;
}

// ─── GET MACRO TARGETS ───
function getMacroTargets() {
  if (window.calcMacros) {
    var m = window.calcMacros();
    if (m && (m.p > 0 || m.g > 0 || m.l > 0)) return m;
  }
  return null;
}

// ─── GET NEXT SPORT DAY ───
function getNextSportDay() {
  var S = window.S;
  if (!S) return null;
  var program = S.sportProgram;
  if (!program || !program.length) return null;

  // Find next uncompleted day — simplified: just return current selected day + its name
  var idx = typeof S.selectedSportDay === 'number' ? S.selectedSportDay : 0;

  if (idx < program.length) {
    return { index: idx, day: program[idx] };
  }
  return { index: 0, day: program[0] };
}

// ─── GET NEXT MEAL (time-aware) ───
function getNextMeal() {
  var S = window.S;
  if (!S || !Array.isArray(S.weekPlan) || S.weekPlan.length < 7) return null;
  var todayIdx = (new Date().getDay() + 6) % 7;
  if (todayIdx >= S.weekPlan.length) return null;
  var dayData = S.weekPlan[todayIdx];
  if (!dayData) return null;

  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var mt = (S.mealTimes && typeof S.mealTimes === 'object') ? S.mealTimes : {};
  var SLOTS = [
    { key: 'breakfast', label: 'Petit-déjeuner', time: mt.breakfast || '08:00' },
    { key: 'lunch',     label: 'Déjeuner',       time: mt.lunch     || '12:30' },
    { key: 'snack',     label: 'Collation',      time: mt.snack     || '16:00' },
    { key: 'dinner',    label: 'Dîner',          time: mt.dinner    || '19:30' }
  ];

  var TOLERANCE = 45; // minutes de tolérance après l'heure prévue (ex: petit-déj à 8h visible jusqu'à 8h45)
  for (var i = 0; i < SLOTS.length; i++) {
    var slot = SLOTS[i];
    var meal = dayData[slot.key];
    if (!meal || !meal.n) continue;
    var parts = slot.time.split(':');
    var slotMin = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    if (slotMin + TOLERANCE >= nowMin) {
      var minutesUntil = slotMin - nowMin;
      return { meal: meal, slot: slot, slotMin: slotMin, minutesUntil: minutesUntil };
    }
  }
  return null; // tous les repas de la journée sont passés
}

// ─── RENDER CARD — Prochain repas (hero) ───
function renderCardNextMeal() {
  var S = window.S;
  if (!S || !Array.isArray(S.weekPlan) || S.weekPlan.length < 7) return null;
  var info = getNextMeal();

  // Fallback soirée : tous les repas sont passés → afficher le premier repas de demain
  if (!info) {
    var mt2 = (S.mealTimes && typeof S.mealTimes === 'object') ? S.mealTimes : {};
    var firstTime = mt2.breakfast || '08:00';
    var tomorrowIdx = ((new Date().getDay() + 6 + 1) % 7);
    var tomorrowData = S.weekPlan[tomorrowIdx] || {};
    var tomorrowMeal = tomorrowData.breakfast;
    if (!tomorrowMeal || !tomorrowMeal.n) return null;

    var c2 = card('background:var(--ivory,#FAF9F6);opacity:0.85;');
    c2.appendChild(eyebrow('DEMAIN'));
    var t2Row = h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;' });
    t2Row.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:18px;' }, 'Petit-déjeuner'));
    t2Row.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);' }, firstTime));
    c2.appendChild(t2Row);
    var n2 = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);' });
    n2.textContent = tomorrowMeal.n + (tomorrowMeal.k ? '\u00a0\u00b7\u00a0' + Math.round(tomorrowMeal.k) + '\u00a0kcal' : '');
    c2.appendChild(n2);
    return c2;
  }

  var meal = info.meal;
  var slot = info.slot;
  var minutesUntil = info.minutesUntil;

  // Formater le temps restant
  var timeLabel;
  if (minutesUntil <= 0) {
    timeLabel = "maintenant";
  } else if (minutesUntil < 60) {
    timeLabel = "dans " + minutesUntil + "\u00a0min";
  } else {
    var h2 = Math.floor(minutesUntil / 60);
    var m2 = minutesUntil % 60;
    timeLabel = "dans " + h2 + "h" + (m2 > 0 ? String(m2).padStart(2, '0') : '');
  }

  var c = card('border-left:3px solid var(--black,#0A0A09);background:var(--ivory,#FAF9F6);');
  c.appendChild(eyebrow('PROCHAIN REPAS'));

  var titleRow = h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;' });
  var titleEl = h('div', { style: 'font-family:Georgia,serif;font-size:20px;font-weight:normal;' });
  titleEl.textContent = slot.label;
  var timeEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:0.5px;white-space:nowrap;margin-left:8px;' });
  timeEl.textContent = timeLabel + ' \u00b7 ' + slot.time;
  titleRow.appendChild(titleEl);
  titleRow.appendChild(timeEl);
  c.appendChild(titleRow);

  var nameEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:12px;line-height:1.4;' });
  nameEl.textContent = meal.n;
  c.appendChild(nameEl);

  if (meal.k) {
    var kcalEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey2,#9A9A90);margin-bottom:12px;' });
    kcalEl.textContent = Math.round(meal.k) + '\u00a0kcal' +
      (meal.p ? '\u00a0\u00b7\u00a0' + Math.round(meal.p) + 'g prot.' : '') +
      (meal.g ? '\u00a0\u00b7\u00a0' + Math.round(meal.g) + 'g glucides' : '');
    c.appendChild(kcalEl);
  }

  var todayIdx = (new Date().getDay() + 6) % 7;
  var btn = h('button', {
    style: 'padding:10px 16px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
    onclick: function() {
      var S2 = window.S;
      if (!S2) return;
      S2.view = 'nutrition'; S2.nStep = 12; S2.selectedDay = todayIdx;
      if (window.render) window.render();
    }
  }, 'Voir le repas \u2192');
  c.appendChild(btn);

  return c;
}

// ─── WELCOME BANNER — Bon retour parmi nous ───
function renderWelcomeBanner(S) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  var firstName = S.prenom || (user && user.name ? user.name.split(' ')[0] : '') || '';

  var days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  var months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  var now = new Date();
  var dateStr = days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()];

  var banner = h('div', {
    style: 'padding:20px 0;border-bottom:1px solid var(--border);margin-bottom:0;'
  });

  var greeting = h('div', {
    style: 'font-family:Georgia,serif;font-style:italic;font-size:15px;color:var(--grey);line-height:1.5;'
  });
  greeting.textContent = 'Bon retour parmi nous' + (firstName ? ', ' + firstName : '') + ' \u2726';

  var sub = h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:1px;margin-top:4px;opacity:0.75;'
  });
  sub.textContent = dateStr + ' \u00B7 Ton programme t\'attend';

  banner.appendChild(greeting);
  banner.appendChild(sub);
  return banner;
}

// ─── RENDER CARD 1 — Bonjour ───
function renderCardBonjour(S) {
  var c = card();
  var user = window.AUTH ? window.AUTH.getUser() : null;
  var firstName = S.prenom || (user && user.name ? user.name.split(' ')[0] : '') || '';

  // Random daily quote — seeded by day of year for consistency
  var allQuotes = (window.SPORT_QUOTES && window.SPORT_QUOTES.length) ? window.SPORT_QUOTES : TODAY_QUOTES;
  var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var quote = allQuotes[dayOfYear % allQuotes.length];
  var quoteText = typeof quote === 'string' ? quote : (quote && quote.text ? quote.text : '');
  var quoteAuthor = (quote && quote.author) ? quote.author : '';

  var eyebrow_el = eyebrow('AUJOURD\'HUI');
  c.appendChild(eyebrow_el);

  // Salutation selon l'heure de la journée
  var _hour = new Date().getHours();
  var _greetWord = _hour >= 18 ? 'Bonsoir' : (_hour >= 12 ? 'Bon après-midi' : 'Bonjour');
  var title = h('div', { style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;margin-bottom:4px;' });
  title.textContent = _greetWord + (firstName ? ', ' + firstName : '') + '.';
  c.appendChild(title);

  // Date permanente sous le titre
  (function() {
    var _days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    var _months = ['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
    var _now2 = new Date();
    var _dateStr = _days[_now2.getDay()] + ' ' + _now2.getDate() + ' ' + _months[_now2.getMonth()];
    var _dateEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:0.5px;margin-bottom:12px;' });
    _dateEl.textContent = _dateStr;
    c.appendChild(_dateEl);
  })();

  if (quoteText) {
    var qEl = h('div', { style: 'font-family:Georgia,serif;font-style:italic;font-size:14px;color:var(--grey);line-height:1.6;border-left:2px solid var(--border);padding-left:12px;margin-top:8px;' });
    qEl.textContent = '\u201C' + quoteText + '\u201D';
    if (quoteAuthor) {
      var authorEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey2);margin-top:4px;' });
      authorEl.textContent = '\u2014 ' + quoteAuthor;
      qEl.appendChild(authorEl);
    }
    c.appendChild(qEl);
  }

  return c;
}

// ─── RENDER CARD 2 — Macros du jour ───
function renderCardMacros() {
  // Sport-only : pas de données nutrition, masquer la carte entièrement
  var _S2 = window.S || {};
  if (_S2.appMode === 'sport') return null;

  var calorieTarget = getCalorieTarget();
  var macroTargetsOverride = null;
  // Priorité aux macros du plan du jour si weekPlan disponible
  if (Array.isArray(_S2.weekPlan) && _S2.weekPlan.length >= 7) {
    var _todayIdx = (new Date().getDay() + 6) % 7; // 0=Lun … 6=Dim
    var _dayPlan = _S2.weekPlan[_todayIdx];
    if (_dayPlan && typeof _dayPlan.kcal === 'number' && _dayPlan.kcal > 0) {
      calorieTarget = _dayPlan.kcal;
      // N'utiliser l'override que si au moins une macro est définie — évite d'écraser getMacroTargets() avec des zéros
      if ((_dayPlan.p || 0) > 0 || (_dayPlan.g || 0) > 0 || (_dayPlan.l || 0) > 0) {
        macroTargetsOverride = { p: _dayPlan.p || 0, g: _dayPlan.g || 0, l: _dayPlan.l || 0 };
      }
    }
  }
  if (calorieTarget <= 0) {
    var emptyMacro = card();
    emptyMacro.appendChild(eyebrow('NUTRITION'));
    emptyMacro.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:normal;margin-bottom:8px;color:var(--grey);'}, 'Aucun objectif défini'));
    emptyMacro.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.6;margin-bottom:14px;'}, 'Définis tes objectifs nutritionnels pour suivre tes macros quotidiens.'));
    emptyMacro.appendChild(h('button', {
      style: 'padding:10px 16px;background:var(--black,#0A0A09);color:#fff;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
      onclick: function() { if (!window.S) return; window.S.view = 'nutrition'; window.S.nStep = 1; if (window.render) window.render(); }
    }, 'Configurer mon profil →'));
    return emptyMacro;
  }

  var totals = getTodayTotals();
  var macroTargets = macroTargetsOverride || getMacroTargets();

  // ── Sport burn du jour ──
  var _todayKey = new Date().toISOString().slice(0, 10);
  var _S = window.S || {};
  var _sportBurn = 0;
  if (_S.sessionHistory && _S.sessionHistory[_todayKey] && _S.sessionHistory[_todayKey].kcalTotal > 0) {
    _sportBurn = Math.round(_S.sessionHistory[_todayKey].kcalTotal);
  }

  var c = card();
  c.appendChild(eyebrow('NUTRITION'));
  c.appendChild(cardTitle('Macros du jour'));

  // Calorie bar
  var kcalRow = h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:12px;' });
  kcalRow.appendChild(progressBar(totals.kcal, calorieTarget));
  kcalRow.appendChild(h('span', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey2);white-space:nowrap;font-weight:500;'
  }, Math.round(totals.kcal) + ' / ' + Math.round(calorieTarget) + ' kcal'));
  c.appendChild(kcalRow);

  // Sport burn badge (si séance validée aujourd'hui)
  if (_sportBurn > 0) {
    var _burnEl = document.createElement('div');
    _burnEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-bottom:6px;font-weight:500;color:var(--green,#1A4A1A);';
    _burnEl.textContent = '🏃 +' + _sportBurn + ' kcal brûlées (sport)';
    c.appendChild(_burnEl);
  }

  // Calories restantes (nettes : target - mangé + brûlé)
  var _netRemaining = Math.round(calorieTarget - totals.kcal + _sportBurn);
  var _remEl = document.createElement('div');
  _remEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-bottom:10px;font-weight:500;';
  if (_sportBurn > 0) {
    // Afficher la formule nette
    _remEl.style.color = _netRemaining >= 0 ? 'var(--green,#1A4A1A)' : 'var(--orange,#6A4A1A)';
    _remEl.textContent = _netRemaining >= 0
      ? '⚡ ' + _netRemaining + ' kcal nettes restantes'
      : '⚠ ' + Math.abs(_netRemaining) + ' kcal au-dessus (net sport)';
  } else if (_netRemaining > 0) {
    _remEl.style.color = 'var(--green,#1A4A1A)';
    _remEl.textContent = '⚡ ' + _netRemaining + ' kcal restantes';
  } else if (_netRemaining === 0) {
    _remEl.style.color = 'var(--grey,#6B6B65)';
    _remEl.textContent = '✓ Objectif calorique atteint';
  } else {
    _remEl.style.color = 'var(--orange,#6A4A1A)';
    _remEl.textContent = '⚠ ' + Math.abs(_netRemaining) + ' kcal au-dessus de l\'objectif';
  }
  c.appendChild(_remEl);

  if (macroTargets && (macroTargets.p > 0 || macroTargets.g > 0 || macroTargets.l > 0)) {
    c.appendChild(macroRow('Protéines', Math.round(totals.p), Math.round(macroTargets.p)));
    c.appendChild(macroRow('Glucides', Math.round(totals.g), Math.round(macroTargets.g)));
    c.appendChild(macroRow('Lipides', Math.round(totals.l), Math.round(macroTargets.l)));

    // Anneaux SVG — progression macros
    var ringsRow = document.createElement('div');
    ringsRow.style.cssText = 'display:flex;justify-content:space-around;align-items:flex-start;margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#E8E6DF);flex-wrap:wrap;gap:8px;';
    if (macroTargets.p > 0 && window.svgRing) {
      var pPct = Math.min(100, totals.p > 0 ? Math.round(totals.p / macroTargets.p * 100) : 0);
      ringsRow.appendChild(window.svgRing(72, 7, pPct, 'var(--green,#1A4A1A)', 'Protéines', Math.round(totals.p)));
    }
    if (macroTargets.g > 0 && window.svgRing) {
      var gPct = Math.min(100, totals.g > 0 ? Math.round(totals.g / macroTargets.g * 100) : 0);
      ringsRow.appendChild(window.svgRing(72, 7, gPct, 'var(--blue,#1A3A6A)', 'Glucides', Math.round(totals.g)));
    }
    if (macroTargets.l > 0 && window.svgRing) {
      var lPct = Math.min(100, totals.l > 0 ? Math.round(totals.l / macroTargets.l * 100) : 0);
      ringsRow.appendChild(window.svgRing(72, 7, lPct, 'var(--orange,#6A4A1A)', 'Lipides', Math.round(totals.l)));
    }
    if (ringsRow.children.length > 0) c.appendChild(ringsRow);
  }

  return c;
}

// ─── RENDER CARD 3 — Repas du jour ───
function renderCardRepas() {
  var S = window.S;
  if (!S) return null;
  // Sport-only : pas de plan nutritionnel, masquer la carte
  if (S.appMode === 'sport') return null;

  var c = card();
  c.appendChild(eyebrow('REPAS DU JOUR'));

  if (!Array.isArray(S.weekPlan) || S.weekPlan.length < 7) {
    // No plan — empty state engageant
    var _emptyCard = h('div', {style: 'text-align:center;padding:24px 16px;'});
    _emptyCard.appendChild(h('div', {style: 'font-size:28px;margin-bottom:8px;'}, '🍽'));
    _emptyCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:6px;'}, 'Aucun plan nutritionnel'));
    _emptyCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin-bottom:16px;line-height:1.5;'}, 'Crée ton programme personnalisé\nen 5 minutes'));
    _emptyCard.appendChild(h('button', {
      style: 'padding:12px 20px;background:var(--black,#0A0A09);color:#fff;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
      onclick: function() { var S = window.S; S.view = 'nutrition'; if (window.render) window.render(); }
    }, 'Créer mon plan'));
    c.appendChild(_emptyCard);
    return c;
  }

  var todayIdx = (new Date().getDay() + 6) % 7;
  if (todayIdx >= S.weekPlan.length) { todayIdx = 0; }
  var dayData = S.weekPlan[todayIdx];
  if (!dayData) return null;

  var SLOTS = [
    { key: 'breakfast', label: 'Petit-déjeuner' },
    { key: 'lunch', label: 'Déjeuner' },
    { key: 'snack', label: 'Collation' },
    { key: 'dinner', label: 'Dîner' }
  ];

  var todayKey = new Date().toISOString().slice(0, 10);
  var mealsLoggedToday = (S.mealsLogged && S.mealsLogged[todayKey]) ? S.mealsLogged[todayKey] : {};

  var hasAny = false;
  SLOTS.forEach(function(slot) {
    var meal = dayData[slot.key];
    if (!meal || !meal.n) return;
    hasAny = true;

    var isLogged = mealsLoggedToday[slot.key] === true;

    var row = h('div', {
      style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#E8E6DF);'
    });

    var left = h('div', { style: 'flex:1;cursor:pointer;', onclick: function() {
      S.view = 'nutrition';
      S.nStep = 12;
      S.selectedDay = todayIdx;
      if (window.render) window.render();
    }});
    var slotLabel = h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:2px;'
    }, slot.label);
    var mealName = h('div', {
      style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#1A1A18);'
    }, meal.n);
    left.appendChild(slotLabel);
    left.appendChild(mealName);

    var kcalEl = h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);white-space:nowrap;margin-left:8px;cursor:pointer;',
      onclick: function() {
        S.view = 'nutrition';
        S.nStep = 12;
        S.selectedDay = todayIdx;
        if (window.render) window.render();
      }
    }, (meal.k ? Math.round(meal.k) + ' kcal' : ''));

    var slotKey = slot.key;
    var slotLabel2 = slot.label;
    var mealRef = meal;
    var prisBtn = h('button', {
      style: isLogged
        ? 'background:var(--green,#1A4A1A);border:1px solid var(--green,#1A4A1A);color:var(--ivory,#FAF9F6);font-size:10px;padding:6px 10px;min-height:44px;cursor:pointer;margin-left:8px;flex-shrink:0;font-family:"Helvetica Neue",Arial,sans-serif;border-radius:2px;'
        : 'background:transparent;border:1px solid var(--border);color:var(--grey);font-size:10px;padding:6px 10px;min-height:44px;cursor:pointer;margin-left:8px;flex-shrink:0;font-family:"Helvetica Neue",Arial,sans-serif;border-radius:2px;',
      title: isLogged ? 'Cliquer pour d\u00e9cocher' : 'Marquer comme pris',
      onclick: function(e) {
        e.stopPropagation();
        S.mealsLogged = S.mealsLogged || {};
        var tk = new Date().toISOString().slice(0, 10);
        S.mealsLogged[tk] = S.mealsLogged[tk] || {};
        var wasLogged = S.mealsLogged[tk][slotKey] === true;
        if (wasLogged) {
          S.mealsLogged[tk][slotKey] = false;
          if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.getToday) {
            var entries = window.FOOD_JOURNAL.getToday();
            for (var i = entries.length - 1; i >= 0; i--) {
              if (entries[i].meal === slotKey && entries[i].source === 'plan') {
                window.FOOD_JOURNAL.removeEntry(tk, i);
                break;
              }
            }
          }
        } else {
          S.mealsLogged[tk][slotKey] = true;
          if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.addEntry && mealRef) {
            window.FOOD_JOURNAL.addEntry(
              slotKey,
              mealRef.n || slotLabel2,
              mealRef.k || 0,
              mealRef.p || 0,
              mealRef.g || 0,
              mealRef.l || 0,
              '1 portion',
              'plan'
            );
          }
        }
        if (window.saveProfile) window.saveProfile();
        if (window.render) window.render();
      }
    }, isLogged ? '\u2713 Pris' : 'Marquer pris');

    row.appendChild(left);
    row.appendChild(kcalEl);
    row.appendChild(prisBtn);
    c.appendChild(row);
  });

  if (!hasAny) return null;

  // Compteur repas pris aujourd'hui
  var loggedCount = SLOTS.filter(function(slot) {
    return dayData[slot.key] && dayData[slot.key].n && mealsLoggedToday[slot.key] === true;
  }).length;
  var totalSlots = SLOTS.filter(function(slot) { return dayData[slot.key] && dayData[slot.key].n; }).length;
  var counterEl = h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:8px;'
  }, loggedCount + '/' + totalSlots + ' repas aujourd\u2019hui');
  c.appendChild(counterEl);

  // Footer link
  var link = h('div', {
    style: 'margin-top:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:right;cursor:pointer;',
    onclick: function() {
      S.view = 'nutrition';
      S.nStep = 12;
      S.selectedDay = todayIdx;
      if (window.render) window.render();
    }
  }, 'Voir mon programme →');
  c.appendChild(link);

  return c;
}

// ─── SHARE — Carte de progression (Canvas API) ───
function buildShareCanvas() {
  var SIZE = 1080;
  var canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  var ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  var S = window.S || {};
  var streak = getStreakValue();

  // Fond noir
  ctx.fillStyle = '#0A0A09';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Bande verte signature en haut
  ctx.fillStyle = '#1A4A1A';
  ctx.fillRect(0, 0, SIZE, 6);

  var PAD = 80;
  var CX = SIZE / 2;

  // ── Logo wordmark — ivory + letter-spacing 10px (signature charte) ──
  ctx.fillStyle = '#FAF9F6';
  ctx.font = '13px "Helvetica Neue", Helvetica, Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SMARTFITCOACH', PAD, 64);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // ── Date (droite) — gris clair lisible sur fond noir ──
  var _dn = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  var _mn = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  var _nd = new Date();
  ctx.fillStyle = '#9A9A94';
  ctx.font = '13px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(_dn[_nd.getDay()] + ' ' + _nd.getDate() + ' ' + _mn[_nd.getMonth()], SIZE - PAD, 64);

  // Filet séparateur haut
  ctx.strokeStyle = '#242422';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 100);
  ctx.lineTo(SIZE - PAD, 100);
  ctx.stroke();

  // ── Emoji flamme / trophée (grand) ──
  ctx.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
  ctx.textAlign = 'center';
  ctx.fillText(streak >= 7 ? '🏆' : '🔥', CX, 365);

  // ── Nombre de jours (héro) ──
  ctx.fillStyle = '#F5F4F1';
  ctx.font = '400 148px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(streak), CX, 548);

  // ── "JOURS CONSÉCUTIFS" — eyebrow charte : letter-spacing 6px ──
  ctx.fillStyle = '#9A9A94';
  ctx.font = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
  ctx.textAlign = 'center';
  ctx.fillText('JOURS  CONSÉCUTIFS', CX, 598);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Filet séparateur bas
  ctx.strokeStyle = '#242422';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 680);
  ctx.lineTo(SIZE - PAD, 680);
  ctx.stroke();

  // ── Objectif ──
  var goalLabel = '';
  if (window.GOALS && typeof S.goal === 'number' && window.GOALS[S.goal]) {
    goalLabel = window.GOALS[S.goal].name;
  } else if (S.appMode === 'sport') {
    goalLabel = 'Programme sportif';
  } else if (S.appMode === 'nutrition') {
    goalLabel = 'Nutrition personnalisée';
  }
  if (goalLabel) {
    ctx.fillStyle = '#9A9A94';
    ctx.font = 'italic 24px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Objectif \u00b7 ' + goalLabel, CX, 740);
  }

  // ── Delta poids (si disponible) ──
  try {
    var _user = window.AUTH ? window.AUTH.getUser() : null;
    var _uid = _user ? _user.id : 'anon';
    var _wh = [];
    try { _wh = JSON.parse(localStorage.getItem('mtd_weight_history_' + _uid) || '[]'); } catch(e2) {}
    if (!_wh.length && Array.isArray(S.weightHistory)) _wh = S.weightHistory;
    if (Array.isArray(_wh) && _wh.length >= 2) {
      _wh.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
      var _fw = parseFloat(_wh[0].weight);
      var _lw = parseFloat(_wh[_wh.length - 1].weight);
      if (!isNaN(_fw) && !isNaN(_lw) && _fw !== _lw) {
        var _d = _lw - _fw;
        ctx.fillStyle = _d < 0 ? '#4A8A5A' : '#C47A3A';
        ctx.font = '22px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((_d > 0 ? '+' : '') + _d.toFixed(1) + ' kg depuis le départ', CX, 790);
      }
    }
  } catch(e3) {}

  // ── Pied de page — contraste suffisant + letter-spacing éditorial ──
  ctx.fillStyle = '#6B6B65';
  ctx.font = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.textAlign = 'center';
  ctx.fillText('smartfitcoach.app', CX, SIZE - 80);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  return canvas;
}

function shareProgression() {
  var canvas;
  try { canvas = buildShareCanvas(); } catch(e) { return; }
  if (!canvas) return;
  canvas.toBlob(function(blob) {
    if (!blob) return;
    var filename = 'smartfitcoach-' + new Date().toISOString().slice(0, 10) + '.png';
    var file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Ma progression SmartFitCoach'
      }).catch(function() {});
    } else {
      // Fallback : téléchargement direct
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      if (document.body) {
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    }
  }, 'image/png');
}

// ─── RENDER CARD 4 — Streak & badges ───
function renderCardStreak() {
  var streak = getStreakValue();
  var lastBadge = getLastBadge();
  if (streak <= 0 && !lastBadge) return null;

  var c = card();
  c.appendChild(eyebrow('PROGRESSION'));

  // ── Streak block ──
  if (streak > 0) {
    var streakWrap = h('div', {
      style: 'display:flex;align-items:center;gap:12px;margin-bottom:' + (lastBadge ? '16px' : '0') + ';'
    });

    // Flame emoji
    var flameEl = h('div', {
      style: 'font-size:28px;line-height:1;flex-shrink:0;'
    });
    flameEl.textContent = streak >= 7 ? '🏆' : '🔥';

    // Streak info
    var streakInfo = h('div', { style: 'flex:1;' });

    var streakNum = h('div', {
      style: 'font-family:Georgia,serif;font-size:26px;font-weight:normal;line-height:1;letter-spacing:-0.5px;color:var(--black);'
    });
    streakNum.textContent = streak + ' jour' + (streak > 1 ? 's' : '');

    var streakLabel = h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:2px;'
    });
    streakLabel.textContent = 'consécutif' + (streak > 1 ? 's' : '');

    streakInfo.appendChild(streakNum);
    streakInfo.appendChild(streakLabel);

    streakWrap.appendChild(flameEl);
    streakWrap.appendChild(streakInfo);
    c.appendChild(streakWrap);

    // Message perte d'aversion — si streak ≥ 3 jours, rappelle l'enjeu
    if (streak >= 3) {
      var _lossMsg = h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange,#6A4A1A);margin-top:6px;margin-bottom:4px;font-weight:500;'
      });
      _lossMsg.textContent = 'Ne casse pas ta série de ' + streak + ' jour' + (streak > 1 ? 's' : '') + ' !';
      c.appendChild(_lossMsg);
    }

    // Streak freeze badge
    var _sfS = window.S || {};
    if (_sfS.streakFreezeAvailable !== false) {
      var _freezeTag = h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#4A7A8A;border:1px solid #B0D4E0;background:rgba(176,212,224,0.15);padding:4px 10px;display:inline-block;margin-top:-4px;margin-bottom:8px;'
      }, '\u2744 1 joker disponible');
      c.appendChild(_freezeTag);
    }
  }

  // ── Last badge block ──
  if (lastBadge) {
    var badgeIcon = lastBadge.icon || '⭐';
    var badgeName = lastBadge.name || lastBadge.id || 'Badge';
    var badgeDesc = lastBadge.desc || '';

    // Section label
    var badgeEyebrow = h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px;'
    });
    badgeEyebrow.textContent = 'DERNIER BADGE';
    c.appendChild(badgeEyebrow);

    // Badge card — accent-tinted background, left accent border
    var badgeEl = h('div', {
      style: [
        'display:flex;',
        'align-items:center;',
        'gap:14px;',
        'padding:12px 14px;',
        'border:1px solid rgba(26,74,26,0.18);',
        'border-left:3px solid var(--accent);',
        'background:rgba(26,74,26,0.04);',
        'border-radius:2px;'
      ].join('')
    });

    // Emoji icon in a small circle
    var iconWrap = h('div', {
      style: [
        'width:38px;height:38px;',
        'flex-shrink:0;',
        'display:flex;align-items:center;justify-content:center;',
        'background:rgba(26,74,26,0.09);',
        'border-radius:2px;',
        'font-size:20px;',
        'line-height:1;'
      ].join('')
    });
    iconWrap.textContent = badgeIcon;

    // Text block
    var textEl = h('div', { style: 'flex:1;min-width:0;' });

    var nameEl = h('div', {
      style: 'font-family:Georgia,serif;font-size:15px;font-weight:normal;color:var(--black);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
    });
    nameEl.textContent = badgeName;

    textEl.appendChild(nameEl);

    if (badgeDesc) {
      var descEl = h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:3px;'
      });
      descEl.textContent = badgeDesc;
      textEl.appendChild(descEl);
    }

    // Small "débloqué" pill tag
    var tagEl = h('div', {
      style: [
        'flex-shrink:0;',
        'font-family:"Helvetica Neue",Arial,sans-serif;',
        'font-size:8px;',
        'letter-spacing:2px;',
        'text-transform:uppercase;',
        'color:var(--accent);',
        'border:1px solid rgba(26,74,26,0.3);',
        'padding:3px 6px;',
        'border-radius:2px;',
        'white-space:nowrap;'
      ].join('')
    });
    tagEl.textContent = 'Débloqué';

    badgeEl.appendChild(iconWrap);
    badgeEl.appendChild(textEl);
    badgeEl.appendChild(tagEl);
    c.appendChild(badgeEl);
  }

  // ── Bouton "Partager ma progression" ──
  if (streak > 0) {
    var shareBtn = h('button', {
      style: 'margin-top:16px;width:100%;padding:12px;border:1px solid var(--border,#E8E6DF);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);cursor:pointer;',
      onclick: function() { shareProgression(); }
    }, '\u2197\u2003Partager ma progression');
    c.appendChild(shareBtn);
  }

  return c;
}

// ─── RENDER CARD 4 — Séance du jour / Repos ───
function renderCardSport() {
  var S = window.S;
  var todayIdx = (new Date().getDay() + 6) % 7;
  var next = getNextSportDay();
  var hasSportProgram = next && next.day;

  // ── Jour de repos premium (si programme sport actif) ──
  if (hasSportProgram && window.getDayType) {
    var _dayInfo = null;
    try { _dayInfo = window.getDayType(todayIdx); } catch(e) {}
    if (_dayInfo && !_dayInfo.isTraining) {
      return renderCardRestDay(S);
    }
  }

  if (!hasSportProgram) {
    // No sport program — empty state
    if (S && (S.appMode === 'nutrition')) return null; // nutrition-only mode: ne pas afficher
    var _sportEmptyCard = card();
    _sportEmptyCard.appendChild(eyebrow('SPORT'));
    var _sportEmpty = h('div', {style: 'text-align:center;padding:8px 0 4px;'});
    _sportEmpty.appendChild(h('div', {style: 'font-size:24px;margin-bottom:8px;'}, '\uD83C\uDFCB'));
    _sportEmpty.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:6px;'}, 'Aucun programme sportif'));
    _sportEmpty.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin-bottom:14px;line-height:1.5;'}, 'Choisis ton sport et obtiens\nun programme sur mesure'));
    _sportEmpty.appendChild(h('button', {
      style: 'padding:12px 20px;background:var(--black,#0A0A09);color:#fff;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
      onclick: function() { var S2 = window.S; S2.view = 'sport'; if (window.render) window.render(); }
    }, 'Créer mon programme'));
    _sportEmptyCard.appendChild(_sportEmpty);
    return _sportEmptyCard;
  }

  // ── Bandeau récupération insuffisante (basé sur todayWellness) ──
  var _recoveryBanner = null;
  try {
    var _todayStr = new Date().toISOString().slice(0, 10);
    var _wData = S.todayWellness;
    if (_wData && _wData.date === _todayStr) {
      var _energy = typeof _wData.energy === 'number' ? _wData.energy : 5;
      var _muscle = typeof _wData.muscle === 'number' ? _wData.muscle : 5;
      if (_energy <= 2 || _muscle <= 2) {
        _recoveryBanner = h('div', {
          style: [
            'padding:10px 14px;',
            'margin-bottom:12px;',
            'background:var(--orangebg,rgba(106,74,26,.06));',
            'border:1px solid var(--orange,#6A4A1A);',
            'border-left:3px solid var(--orange,#6A4A1A);',
            'border-radius:2px;',
            'font-family:"Helvetica Neue",Arial,sans-serif;',
            'font-size:11px;',
            'color:var(--orange,#6A4A1A);',
            'line-height:1.5;'
          ].join('')
        }, 'R\u00e9cup\u00e9ration insuffisante d\u00e9tect\u00e9e \u00b7 S\u00e9ance all\u00e9g\u00e9e recommand\u00e9e');
      }
    }
  } catch(e) {}

  var day = next.day;
  var idx = next.index;
  var dayName = day.name || ('Séance ' + (idx + 1));
  var exCount = Array.isArray(day.exercises) ? day.exercises.length : 0;

  // Estimated duration heuristic
  var _estMins = exCount <= 0 ? null : (exCount <= 4 ? 30 : exCount <= 6 ? 45 : 60);

  // Week progress: count logged sessions this week vs weekly target
  var _weekDone = 0;
  try {
    var _log = S.muscuSessionLog || {};
    var _now = new Date();
    var _dow = (_now.getDay() + 6) % 7;
    var _mon = new Date(_now); _mon.setDate(_now.getDate() - _dow);
    for (var _di = 0; _di <= _dow; _di++) {
      var _d = new Date(_mon); _d.setDate(_mon.getDate() + _di);
      var _ds = _d.toISOString().slice(0, 10);
      if (_log[_ds] && Object.keys(_log[_ds]).length > 0) _weekDone++;
    }
  } catch(e) {}
  var _weekTarget = (S.trainingDaysSelected && S.trainingDaysSelected.length > 0) ? S.trainingDaysSelected.length : (S.sportDays || 3);

  var c = card();
  if (_recoveryBanner) c.appendChild(_recoveryBanner);
  c.appendChild(eyebrow('SÉANCE DU JOUR'));
  c.appendChild(cardTitle('Entraînement'));

  var nameEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:6px;' });
  nameEl.textContent = 'Jour\u00a0' + (idx + 1) + '\u00a0\u2014\u00a0' + dayName;
  c.appendChild(nameEl);

  // Stats row: exercices · durée · semaine
  var _statsRow = h('div', { style: 'display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap;' });
  if (exCount > 0) {
    var _exEl = h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey2,#9A9A90);letter-spacing:0.5px;' });
    _exEl.textContent = exCount + ' ex.';
    _statsRow.appendChild(_exEl);
  }
  if (_estMins) {
    var _sep1 = h('span', { style: 'font-size:9px;color:var(--border);' }, '\u00b7');
    var _durEl = h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey2,#9A9A90);' });
    _durEl.textContent = '~' + _estMins + ' min';
    _statsRow.appendChild(_sep1);
    _statsRow.appendChild(_durEl);
  }
  if (_weekTarget > 0) {
    var _sep2 = h('span', { style: 'font-size:9px;color:var(--border);' }, '\u00b7');
    var _wkEl = h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey2,#9A9A90);' });
    _wkEl.textContent = _weekDone + '/' + _weekTarget + ' cette semaine';
    _statsRow.appendChild(_sep2);
    _statsRow.appendChild(_wkEl);
  }
  if (_statsRow.children.length > 0) c.appendChild(_statsRow);

  var btn = h('button', {
    style: 'padding:12px 16px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
    onclick: function() {
      var S2 = window.S;
      if (!S2) return;
      S2.view = 'sport';
      S2.selectedSportDay = idx;
      if (window.render) window.render();
    }
  }, '\u2192 Commencer la séance');
  c.appendChild(btn);

  return c;
}

// ─── RENDER CARD — Jour de repos (premium) ───
function renderCardRestDay(S) {
  var today = new Date().toISOString().slice(0, 10);
  var mood = (S.restDayMood && S.restDayMood.date === today) ? S.restDayMood.emoji : null;

  // Adapt content by sport level
  var _lvl = S.sportLevel || 'beginner';
  if (_lvl !== 'intermediate' && _lvl !== 'advanced') _lvl = 'beginner';

  var _restMsg = {
    beginner:     'Les muscles se construisent au repos. Aujourd\u2019hui fait partie du plan.',
    intermediate: 'La r\u00e9cup\u00e9ration est un entra\u00eenement. Tes fibres se reconstruisent plus fortes.',
    advanced:     'La surcompensation se joue dans les 24\u201348h post-s\u00e9ance. Optimise ce repos.'
  }[_lvl];

  var weightKg = (S && S.weight) ? parseFloat(S.weight) : 70;
  var waterGoal = Math.round(weightKg * 0.033 * 10) / 10;

  var _restTips = {
    beginner: [
      '\u2014 Marche l\u00e9g\u00e8re ou \u00e9tirements doux',
      '\u2014 Hydratation\u00a0: objectif\u00a0' + waterGoal + '\u00a0L',
      '\u2014 Sommeil\u00a07\u20139h cette nuit'
    ],
    intermediate: [
      '\u2014 Foam roller \u00b7 10\u202fmin sur les groupes travaill\u00e9s',
      '\u2014 Hydratation\u00a0: ' + waterGoal + '\u00a0L + \u00e9lectrolytes',
      '\u2014 Sommeil\u00a08h \u00b7 optimisez les phases profondes'
    ],
    advanced: [
      '\u2014 Contraste chaud\u2009/\u2009froid \u00b7 3 cycles de 2\u202fmin',
      '\u2014 Hydratation\u00a0: ' + waterGoal + '\u00a0L + sodium post-effort',
      '\u2014 Sommeil\u00a08\u20139h \u00b7 \u00e9vitez les \u00e9crans 1h avant'
    ]
  }[_lvl];

  var c = card('background:var(--ivory,#FAF9F6);border-color:var(--border);');

  // Header
  c.appendChild(eyebrow('RÉCUPÉRATION'));
  c.appendChild(cardTitle('Jour de repos'));

  // Subtitle message
  var msgEl = h('div', { style: 'font-family:Georgia,serif;font-style:italic;font-size:13px;color:var(--grey);margin-bottom:16px;line-height:1.6;' });
  msgEl.textContent = _restMsg;
  c.appendChild(msgEl);

  // Recovery tips
  var tipsWrap = h('div', { style: 'margin-bottom:16px;' });
  _restTips.forEach(function(tip) {
    var tipEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);padding:4px 0;letter-spacing:0.3px;' });
    tipEl.textContent = tip;
    tipsWrap.appendChild(tipEl);
  });
  c.appendChild(tipsWrap);

  // Mood check-in
  var moodLabel = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px;' });
  moodLabel.textContent = mood ? 'Ton ressenti aujourd\'hui' : 'Comment tu te sens ?';
  c.appendChild(moodLabel);

  var moods = ['\uD83D\uDE34', '\uD83D\uDE0A', '\uD83D\uDCAA']; // 😴 😊 💪
  var moodRow = h('div', { style: 'display:flex;gap:12px;' });
  moods.forEach(function(emoji) {
    var isSelected = mood === emoji;
    var moodBtn = h('button', {
      style: 'width:44px;height:44px;font-size:22px;border:1px solid ' + (isSelected ? 'var(--black)' : 'var(--border)') + ';background:' + (isSelected ? 'var(--black)' : 'transparent') + ';border-radius:3px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .15s,background .15s;',
      onclick: function() {
        S.restDayMood = { date: today, emoji: emoji };
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        if (window.render) window.render();
      }
    });
    moodBtn.textContent = emoji;
    moodRow.appendChild(moodBtn);
  });
  c.appendChild(moodRow);

  return c;
}

// ─── RENDER CARD 5 — Checkin bien-être ───
function renderCardWellness(S) {
  var today = new Date().toISOString().split('T')[0];
  var w = S.todayWellness;
  if (w && w.date === today) return null; // déjà fait aujourd'hui

  var c = card();
  c.appendChild(eyebrow('BIEN-ÊTRE'));
  c.appendChild(cardTitle('Comment tu te sens ?'));

  var desc = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px;' });
  desc.textContent = 'Sommeil \u00b7 Muscles \u00b7 \u00c9nergie';
  c.appendChild(desc);

  var btn = h('button', {
    class: 'btn-primary',
    style: 'margin-top:4px;',
    onclick: function() {
      if (!S.sportType && S.appMode === 'nutrition') return;
      S.view = 'sport';
      // Ne pas forcer sStep=20 (musculation-only) — laisser le dispatcher sport gérer le bon step
      if (window.render) window.render();
    }
  }, 'Faire le checkin rapide');
  c.appendChild(btn);

  return c;
}

// ─── RENDER CARD 6 — Raccourcis rapides ───
function renderCardShortcuts() {
  var c = card();
  c.appendChild(eyebrow('ACTIONS RAPIDES'));

  var row = h('div', { style: 'display:flex;gap:8px;margin-top:4px;' });

  var btnMeal = h('button', {
    style: 'flex:1;background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;padding:14px 8px;border:1px solid var(--border);border-radius:2px;cursor:pointer;transition:all .2s;',
    'aria-label': 'Ajouter un repas',
    onclick: function() {
      var S = window.S;
      if (!S) return;
      S.view = 'nutrition';
      if (window.render) window.render();
    }
  }, '+ Ajouter un repas');

  var btnSport = h('button', {
    style: 'flex:1;background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;padding:14px 8px;border:1px solid var(--border);border-radius:2px;cursor:pointer;transition:all .2s;',
    'aria-label': 'Voir mon programme sportif',
    onclick: function() {
      var S = window.S;
      if (!S) return;
      S.view = 'sport';
      if (window.render) window.render();
    }
  }, 'Voir mon programme');

  row.appendChild(btnMeal);
  row.appendChild(btnSport);
  c.appendChild(row);

  return c;
}

// ─── SECTION LABEL ───
function sectionLabel(text) {
  return h('div', {
    style: 'font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);border-bottom:1px solid var(--border);padding-bottom:6px;margin:28px 0 14px;font-family:"Helvetica Neue",Arial,sans-serif;'
  }, text);
}

// ─── MODAL OVERLAY HELPERS ───
function todayModal(title, buildFn) {
  var overlay = h('div', {
    style: 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(24,24,24,.45);z-index:9000;display:flex;align-items:center;justify-content:center;'
  });
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  var box = h('div', {
    style: 'background:var(--ivory,#FAF9F6);max-width:480px;width:90%;max-height:80vh;overflow-y:auto;padding:28px 24px;position:relative;'
  });
  var closeBtn = h('button', {
    style: 'position:absolute;top:12px;right:16px;background:none;border:none;font-size:18px;cursor:pointer;color:var(--grey);',
    'aria-label': 'Fermer',
    onclick: function() { document.body.removeChild(overlay); }
  }, '\u00D7');
  box.appendChild(closeBtn);
  box.appendChild(h('div', {
    style: 'font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);border-bottom:1px solid var(--border);padding-bottom:6px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;'
  }, title));
  buildFn(box, overlay);
  overlay.appendChild(box);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

// ─── WEIGHT PROMPT ───
function openTodayWeightPrompt() {
  todayModal('Enregistrer mon poids', function(box, overlay) {
    var input = h('input', {
      type: 'number', step: '0.1',
      style: 'width:100%;padding:12px;font-family:Georgia,serif;font-size:18px;font-style:italic;border:1px solid var(--border);background:var(--ivory,#FAF9F6);color:var(--black);box-sizing:border-box;outline:none;margin-bottom:12px;',
      placeholder: 'Ex : 72.5'
    });
    box.appendChild(input);
    var unitLabel = h('p', { style: 'font-size:11px;color:var(--grey);margin:0 0 16px;' }, window.UNITS ? window.UNITS.weightLabel() : 'kg');
    box.appendChild(unitLabel);
    var saveBtn = h('button', {
      style: 'width:100%;padding:12px;background:var(--black,#181818);color:var(--ivory,#FAF9F6);border:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
      onclick: function() {
        var val = parseFloat(input.value);
        if (isNaN(val) || val <= 0) { input.style.borderColor = '#c44'; return; }
        var valKg = window.UNITS ? window.UNITS.toKg(val) : val;
        if (window.S) window.S.weight = valKg;
        try { if (window.BLACKBOX) window.BLACKBOX.log('weight_logged', { weight: valKg }); } catch(e) {}
        var user = window.AUTH ? window.AUTH.getUser() : null;
        var userId = user ? user.id : 'anon';
        var whKey = 'mtd_weight_history_' + userId;
        var wh = [];
        try { wh = JSON.parse(localStorage.getItem(whKey) || '[]'); } catch(e) { wh = []; }
        wh.push({ date: new Date().toISOString().split('T')[0], weight: valKg });
        try { localStorage.setItem(whKey, JSON.stringify(wh)); } catch(e) {}
        if (window.SupaSync) SupaSync.saveWeight(new Date().toISOString().split('T')[0], valKg);
        if (window.S && Array.isArray(window.S.weightHistory)) {
          window.S.weightHistory.push({ date: new Date().toISOString().split('T')[0], weight: valKg });
        }
        if (window.GAMIFICATION) {
          try {
            window.GAMIFICATION.showToast('Poids enregistré : ' + (window.UNITS ? window.UNITS.displayWeight(valKg) : valKg + ' kg'));
            window.GAMIFICATION.unlockBadge('first_weigh');
            if (wh.length >= 10) window.GAMIFICATION.unlockBadge('weight_10');
          } catch(e) {}
        }
        document.body.removeChild(overlay);
        if (window.APP_RENDER) window.APP_RENDER();
      }
    }, 'Enregistrer');
    box.appendChild(saveBtn);
    setTimeout(function() { input.focus(); }, 100);
  });
}

// ─── MEASUREMENTS MODAL ───
function openTodayMeasurementsModal() {
  todayModal('Mes mensurations', function(box) {
    var formContainer = h('div', { style: 'margin-top:8px;' });
    if (window.MEASUREMENTS && window.MEASUREMENTS.renderForm) {
      try { window.MEASUREMENTS.renderForm(formContainer); } catch(e) {
        formContainer.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, 'Module mensurations indisponible.'));
      }
    } else {
      formContainer.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, 'Module mensurations non chargé.'));
    }
    box.appendChild(formContainer);
  });
}

// ─── BADGES MODAL ───
function openTodayBadgesModal() {
  todayModal('Tous les badges', function(box) {
    var panel = h('div', { style: 'margin-top:8px;' });
    if (window.GAMIFICATION && window.GAMIFICATION.renderBadgesPanel) {
      try { window.GAMIFICATION.renderBadgesPanel(panel); } catch(e) {
        panel.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, 'Panneau badges indisponible.'));
      }
    }
    box.appendChild(panel);
  });
}

// ─── KITCHEN TIMER MODAL ───
function openTodayKitchenTimer() {
  if (window._kitchenTimerInterval) { clearInterval(window._kitchenTimerInterval); window._kitchenTimerInterval = null; }
  todayModal('Timer cuisine', function(box, overlay) {
    box.style.textAlign = 'center';
    var display = h('div', {
      style: 'font-family:Georgia,serif;font-style:italic;font-size:48px;margin:24px 0 8px;line-height:1.1;color:var(--black);'
    }, '00:00');
    box.appendChild(display);

    var presets = h('div', { style: 'margin:12px 0 20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;' });
    var presetValues = [
      { label:'1 min', sec:60 }, { label:'3 min', sec:180 }, { label:'5 min', sec:300 },
      { label:'10 min', sec:600 }, { label:'15 min', sec:900 }
    ];
    var totalSeconds = 0;
    var running = false;
    var interval = null;

    function formatTime(s) {
      var m = Math.floor(s / 60);
      var sec = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    presetValues.forEach(function(pv) {
      var btn = h('button', {
        style: 'padding:6px 12px;background:var(--ivory2);border:1px solid var(--border);font-size:11px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;',
        onclick: function() {
          if (running) { clearInterval(interval); running = false; }
          totalSeconds = pv.sec;
          display.textContent = formatTime(totalSeconds);
        }
      }, pv.label);
      presets.appendChild(btn);
    });
    box.appendChild(presets);

    var controls = h('div', { style: 'display:flex;gap:8px;justify-content:center;' });
    var startBtn = h('button', {
      style: 'padding:10px 24px;background:var(--black,#181818);color:var(--ivory,#FAF9F6);border:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
      onclick: function() {
        if (running || totalSeconds <= 0) return;
        running = true;
        startBtn.textContent = 'En cours...';
        interval = window._kitchenTimerInterval = setInterval(function() {
          totalSeconds--;
          display.textContent = formatTime(totalSeconds);
          if (totalSeconds <= 0) {
            clearInterval(interval); running = false;
            startBtn.textContent = window.t ? window.t('extras.start') : 'Démarrer';
            display.textContent = 'Terminé !';
            try { if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([200,100,200]); } catch(e) {}
          }
        }, 1000);
      }
    }, window.t ? window.t('extras.start') : 'Démarrer');
    controls.appendChild(startBtn);

    var resetBtn = h('button', {
      style: 'padding:10px 24px;background:var(--ivory2);border:1px solid var(--border);font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
      onclick: function() {
        clearInterval(interval); running = false; totalSeconds = 0;
        startBtn.textContent = window.t ? window.t('extras.start') : 'Démarrer';
        display.textContent = '00:00';
      }
    }, window.t ? window.t('extras.reset') : 'Réinitialiser');
    controls.appendChild(resetBtn);
    box.appendChild(controls);

    overlay.addEventListener('click', function(e) { if (e.target === overlay) { clearInterval(interval); window._kitchenTimerInterval = null; } });
    // Étendre le bouton ✕ du modal générique pour nettoyer l'interval
    var _closeEl = box.querySelector('[aria-label="Fermer"]');
    if (_closeEl) {
      var _origClose = _closeEl.onclick;
      _closeEl.onclick = function() { clearInterval(interval); window._kitchenTimerInterval = null; if (_origClose) _origClose(); };
    }
  });
}

// ─── DATA FUNCTIONS ───
function todayExportAllData() {
  var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
  user = user || {};
  var backup = { version: '1.0', date: new Date().toISOString(), user: { name: user.name, email: user.email }, data: {} };
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.indexOf('mtd_') === 0) {
      try { backup.data[key] = JSON.parse(localStorage.getItem(key)); } catch(e) { backup.data[key] = localStorage.getItem(key); }
    }
  }
  var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'mtd-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
  if (window.GAMIFICATION) window.GAMIFICATION.showToast('Données exportées !');
}

function todayImportData() {
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
        if (!confirm('Cela remplacera tes données actuelles. Continuer ?')) return;
        Object.keys(backup.data).forEach(function(key) {
          localStorage.setItem(key, typeof backup.data[key] === 'string' ? backup.data[key] : JSON.stringify(backup.data[key]));
        });
        if (window.GAMIFICATION) window.GAMIFICATION.showToast('Données restaurées !');
        setTimeout(function() { location.reload(); }, 1000);
      } catch(err) { alert('Erreur de lecture : ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function todayDeleteAllData() {
  if (!confirm('Es-tu sûr(e) ? Toutes tes données seront supprimées définitivement.')) return;
  if (!confirm('Dernière confirmation : cette action est irréversible. Continuer ?')) return;
  var keysToRemove = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.indexOf('mtd_') === 0) keysToRemove.push(key);
  }
  keysToRemove.forEach(function(key) { localStorage.removeItem(key); });
  if (window.AUTH && window.AUTH.logout) { try { window.AUTH.logout(); } catch(e) {} }
  if (window.GAMIFICATION) window.GAMIFICATION.showToast('Données supprimées.');
  setTimeout(function() { location.reload(); }, 1000);
}

// ─── RENDER EXTENDED SECTIONS (ex-Dashboard) ───
function renderExtendedSections(wrapper, S) {
  if (!S || typeof S !== 'object') return;
  // Actions rapides
  wrapper.appendChild(sectionLabel('Actions rapides'));
  var actCard = card();
  var navRow = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;' });

  var nutNavBtn = h('div', {
    style: 'background:var(--black,#181818);color:var(--ivory,#FAF9F6);padding:20px 16px;cursor:pointer;transition:all .2s ease;',
    onclick: function() { if (window.APP_NAVIGATE) window.APP_NAVIGATE('nutrition'); else { S.view = 'nutrition'; if (window.render) window.render(); } }
  });
  nutNavBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:16px;font-style:italic;margin:0 0 4px;' }, 'Nutrition'));
  nutNavBtn.appendChild(h('div', { style: 'font-size:11px;opacity:.65;' }, 'Planifie tes repas'));
  navRow.appendChild(nutNavBtn);

  var sportNavBtn = h('div', {
    style: 'background:var(--black,#181818);color:var(--ivory,#FAF9F6);padding:20px 16px;cursor:pointer;transition:all .2s ease;',
    onclick: function() { if (window.APP_NAVIGATE) window.APP_NAVIGATE('sport'); else { S.view = 'sport'; if (window.render) window.render(); } }
  });
  sportNavBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:16px;font-style:italic;margin:0 0 4px;' }, 'Sport'));
  sportNavBtn.appendChild(h('div', { style: 'font-size:11px;opacity:.65;' }, 'Ton programme'));
  navRow.appendChild(sportNavBtn);
  actCard.appendChild(navRow);

  var btnRow = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;' });
  var weightActBtn = h('div', {
    style: 'background:var(--ivory2);border:1px solid var(--border);padding:16px;cursor:pointer;text-align:center;transition:all .2s ease;',
    onclick: function() { openTodayWeightPrompt(); }
  });
  weightActBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;margin:0 0 4px;' }, 'Poids'));
  weightActBtn.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);' }, 'Enregistrer'));
  btnRow.appendChild(weightActBtn);

  var measActBtn = h('div', {
    style: 'background:var(--ivory2);border:1px solid var(--border);padding:16px;cursor:pointer;text-align:center;transition:all .2s ease;',
    onclick: function() { openTodayMeasurementsModal(); }
  });
  measActBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;margin:0 0 4px;' }, 'Mensur.'));
  measActBtn.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);' }, 'Mes mesures'));
  btnRow.appendChild(measActBtn);

  var timerActBtn = h('div', {
    style: 'background:var(--ivory2);border:1px solid var(--border);padding:16px;cursor:pointer;text-align:center;transition:all .2s ease;',
    onclick: function() { openTodayKitchenTimer(); }
  });
  timerActBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;margin:0 0 4px;' }, 'Timer'));
  timerActBtn.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);' }, 'Cuisine'));
  btnRow.appendChild(timerActBtn);
  actCard.appendChild(btnRow);
  wrapper.appendChild(actCard);

  // Water Tracker
  wrapper.appendChild(sectionLabel('Suivi hydratation'));
  var waterBox = card();
  if (window.WATER_TRACKER && window.WATER_TRACKER.renderWidget) {
    try { window.WATER_TRACKER.renderWidget(waterBox); } catch(e) {
      waterBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Suivi hydratation non disponible pour le moment.'));
    }
  } else {
    waterBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Enregistre ta consommation d\u2019eau via le suivi hydratation.'));
  }
  wrapper.appendChild(waterBox);

  // Sleep Tracker
  wrapper.appendChild(sectionLabel('Suivi sommeil'));
  var sleepBox = card();
  if (window.SLEEP_TRACKER && window.SLEEP_TRACKER.renderWidget) {
    try { window.SLEEP_TRACKER.renderWidget(sleepBox); } catch(e) {
      sleepBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Suivi sommeil non disponible pour le moment.'));
    }
  } else {
    sleepBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Enregistre tes nuits pour suivre la qualit\u00e9 de ton sommeil.'));
  }
  wrapper.appendChild(sleepBox);

  // Weekly Summary
  wrapper.appendChild(sectionLabel('Résumé hebdomadaire'));
  var weeklyBox = card();
  if (window.WEEKLY_SUMMARY && window.WEEKLY_SUMMARY.renderWidget) {
    try { window.WEEKLY_SUMMARY.renderWidget(weeklyBox); } catch(e) {
      weeklyBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'R\u00e9sum\u00e9 hebdomadaire non disponible pour le moment.'));
    }
  } else {
    weeklyBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Le r\u00e9sum\u00e9 hebdomadaire apparaîtra après ta premi\u00e8re semaine compl\u00e8te.'));
  }
  wrapper.appendChild(weeklyBox);

  // Progression
  wrapper.appendChild(sectionLabel('Ma progression'));
  var perfBox = card();
  if (window.PERF_HISTORY && window.PERF_HISTORY.renderProgressionWidget) {
    try { window.PERF_HISTORY.renderProgressionWidget(perfBox); } catch(e) {
      perfBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Graphique de progression non disponible pour le moment.'));
    }
  } else {
    perfBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Ta progression s\u2019affichera ici au fil de tes s\u00e9ances.'));
  }
  wrapper.appendChild(perfBox);

  // Weight chart (Chart.js)
  wrapper.appendChild(sectionLabel('Courbe de poids'));
  var rawHistCheck = (S.weightHistory || []).filter(function(e) {
    if (!e) return false;
    var w = parseFloat(e.weight || e.w || e);
    return !isNaN(w) && w > 0;
  });
  var chartWrap = card();
  if (rawHistCheck.length < 2) {
    chartWrap.appendChild(h('div', {
      style: 'font-size:11px;color:var(--grey);text-align:center;padding:16px 0;'
    }, 'Ajoute ton premier poids pour voir la courbe de progression.'));
  } else {
    var canvas = document.createElement('canvas');
    canvas.id = 'today-weight-chart';
    canvas.style.cssText = 'width:100%;height:180px;max-height:180px;';
    chartWrap.appendChild(canvas);
    requestAnimationFrame(function() {
      if (!window.Chart) return;
      var ctx = document.getElementById('today-weight-chart');
      if (!ctx || !ctx.getContext) return;
      var rawHist = (S.weightHistory || []).slice(-12);
      var labels = [], data = [];
      rawHist.forEach(function(e) {
        if (!e) return;
        var w = parseFloat(e.weight || e.w || e);
        if (isNaN(w) || w <= 0) return;
        labels.push(e.date ? e.date.substring(5) : '?');
        data.push(w);
      });
      if (data.length < 2) return;
      if (window._todayWeightChart) { try { window._todayWeightChart.destroy(); } catch(e2) {} window._todayWeightChart = null; }
      window._todayWeightChart = window.createChart ? window.createChart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ data: data, borderColor: '#1A4A1A', backgroundColor: 'rgba(26,74,26,0.08)', pointRadius: 4, pointBackgroundColor: '#1A4A1A', tension: 0.3, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 }, callback: function(v) { return window.UNITS ? window.UNITS.displayWeightVal(v) + ' ' + window.UNITS.weightLabel() : v + ' kg'; } } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }
      }) : null;
    });
  }
  wrapper.appendChild(chartWrap);

  // Kcal chart (Chart.js)
  if (Array.isArray(S.weekPlan) && S.weekPlan.length === 7) {
    wrapper.appendChild(sectionLabel('Calories par jour — plan semaine'));
    var kcalWrap = card();
    var kcalCanvas = document.createElement('canvas');
    kcalCanvas.id = 'today-kcal-chart';
    kcalCanvas.style.cssText = 'width:100%;height:140px;max-height:140px;';
    kcalWrap.appendChild(kcalCanvas);
    wrapper.appendChild(kcalWrap);
    requestAnimationFrame(function() {
      if (!window.Chart) return;
      var ctx2 = document.getElementById('today-kcal-chart');
      if (!ctx2 || !ctx2.getContext) return;
      if (!Array.isArray(S.weekPlan) || S.weekPlan.length !== 7) return;
      var JOURS_CH = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
      var target = (window.calcTarget ? window.calcTarget() : 0) || (S.calories && S.calories > 0 ? S.calories : 2000);
      var dayKcals = S.weekPlan.map(function(day) {
        if (!day) return 0;
        function getK(meal) { return (meal && (meal.k || (meal.baseNutrition && meal.baseNutrition.calories) || meal.kcal)) || 0; }
        return getK(day.breakfast) + getK(day.lunch) + getK(day.snack) + getK(day.dinner);
      });
      if (window._todayKcalChart) { try { window._todayKcalChart.destroy(); } catch(e2) {} window._todayKcalChart = null; }
      window._todayKcalChart = window.createChart ? window.createChart(ctx2, {
        type: 'bar',
        data: { labels: JOURS_CH, datasets: [
          { label: 'Kcal plan', data: dayKcals, backgroundColor: dayKcals.map(function(k) { var r = k / target; return r < 0.92 ? 'rgba(26,74,26,0.7)' : r > 1.08 ? 'rgba(180,40,40,0.7)' : 'rgba(26,74,26,0.9)'; }), borderRadius: 4 },
          { label: 'Cible', data: Array(7).fill(target), type: 'line', borderColor: '#5A1010', borderDash: [4,3], pointRadius: 0, borderWidth: 1.5, fill: false }
        ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 9 }, callback: function(v) { return v + ' kcal'; } } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }
      }) : null;
    });
  }

  // Food Journal
  wrapper.appendChild(sectionLabel('Journal alimentaire'));
  var foodBox = card();
  if (window.FOOD_JOURNAL) {
    try { window.FOOD_JOURNAL.renderWidget(foodBox); } catch(e) {
      foodBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Journal alimentaire non disponible pour le moment.'));
    }
  } else {
    foodBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, 'Note tes repas pour suivre tes apports nutritionnels au quotidien.'));
  }
  wrapper.appendChild(foodBox);

  // Progress Photos
  if (window.PHOTO_PROGRESS && window.PHOTO_PROGRESS.renderWidget) {
    var photoBox = h('div', {});
    try { window.PHOTO_PROGRESS.renderWidget(photoBox); } catch(e) {}
    if (photoBox.children.length > 0) wrapper.appendChild(photoBox);
  }

  // Badges preview
  wrapper.appendChild(sectionLabel('Badges'));
  var badgesCard = card();
  var badgesRow = h('div', { style: 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;' });
  var badgesData = (function() {
    try {
      var _bu = window.AUTH ? window.AUTH.getUser() : null;
      if (_bu) {
        var _bKey = 'mtd_badges_' + _bu.id;
        var _bArr = JSON.parse(localStorage.getItem(_bKey) || '[]');
        if (Array.isArray(_bArr)) return _bArr.slice(-3);
      }
    } catch(e) {}
    return [];
  })();
  if (badgesData.length > 0) {
    badgesData.forEach(function(b) {
      var badgeId = typeof b === 'string' ? b : (b && b.id ? b.id : null);
      if (!badgeId) return;
      var def = (window.GAMIFICATION && window.GAMIFICATION.BADGE_DEFS) ? window.GAMIFICATION.BADGE_DEFS.find(function(d){ return d.id === badgeId; }) : null;
      var mini = h('div', {
        style: 'width:36px;height:36px;border-radius:2px;background:var(--ivory2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;',
        title: (def && def.name) || (typeof b === 'object' && b.name) || ''
      }, (def && def.icon) || (typeof b === 'object' && (b.icon || b.emoji)) || '\u2605');
      badgesRow.appendChild(mini);
    });
  } else {
    ['\u2605','\uD83D\uDD25','\uD83C\uDFC6'].forEach(function(icon) {
      var mini = h('div', { style: 'width:36px;height:36px;border-radius:2px;background:var(--ivory2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;opacity:.35;' }, icon);
      badgesRow.appendChild(mini);
    });
    badgesCard.appendChild(h('p', { style: 'font-size:11px;color:var(--grey);margin:8px 0 0;font-family:"Helvetica Neue",Arial,sans-serif;line-height:1.5;' }, 'Continue \u2014 tes premiers badges t\u2019attendent !'));
  }
  var badgeLink = h('span', {
    style: 'font-size:11px;color:var(--grey);cursor:pointer;margin-left:auto;',
    onclick: function() { if (window.GAMIFICATION && window.GAMIFICATION.renderBadgesPanel) openTodayBadgesModal(); }
  }, 'Voir tous les badges \u2192');
  badgesRow.appendChild(badgeLink);
  badgesCard.insertBefore(badgesRow, badgesCard.firstChild);
  wrapper.appendChild(badgesCard);

  // Mes données
  wrapper.appendChild(sectionLabel('Mes données'));
  var dataCard = card();
  var dataBtns = h('div', { style: 'display:flex;flex-direction:column;gap:10px;' });

  var exportBtn = h('button', {
    style: 'width:100%;padding:18px 28px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09);border-radius:2px;font-size:9px;letter-spacing:6px;text-transform:uppercase;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;',
    onclick: function() { todayExportAllData(); }
  }, '\u2B07 Exporter mes données');
  dataBtns.appendChild(exportBtn);

  var importBtn = h('button', {
    style: 'width:100%;padding:12px 24px;background:transparent;color:var(--grey);border:1px solid var(--border);border-radius:2px;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;',
    onclick: function() { todayImportData(); }
  }, '\u2B06 Importer une sauvegarde');
  dataBtns.appendChild(importBtn);

  var deleteBtn = h('button', {
    style: 'width:100%;padding:12px 24px;background:transparent;color:var(--red,#5A1010);border:1px solid var(--red,#5A1010);border-radius:2px;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;',
    onclick: function() { todayDeleteAllData(); }
  }, 'Supprimer toutes mes données');
  dataBtns.appendChild(deleteBtn);

  dataCard.appendChild(dataBtns);
  wrapper.appendChild(dataCard);
}

// ─── TDEE ADAPTATIF ───
function renderCardTDEEAdaptatif(S) {
  // Requis : weight history + nutrition history
  if (!S || !S.weight) return null;

  var uid = (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';

  // Charger l'historique du poids (mtd_weight_history_{uid})
  var weightHistory = [];
  try { weightHistory = JSON.parse(localStorage.getItem('mtd_weight_history_' + uid) || '[]'); } catch(e) {}

  // Besoin d'au moins 2 entrées avec 7 jours d'écart
  if (!Array.isArray(weightHistory) || weightHistory.length < 2) return null;

  // Trier par date
  weightHistory.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });

  var latest = weightHistory[weightHistory.length - 1];
  var oldest = weightHistory[0];
  if (!latest || !oldest || latest.date === oldest.date) return null;

  // Calculer le nombre de jours entre les deux entrées
  var msPerDay = 86400000;
  var daysDiff = Math.round((new Date(latest.date) - new Date(oldest.date)) / msPerDay);
  if (daysDiff < 7) return null; // Pas assez de données

  var actualChange = (parseFloat(latest.weight) || 0) - (parseFloat(oldest.weight) || 0);

  // Calculer le TDEE actuel via calcTarget
  var tdee = 0;
  try {
    if (window.calcTarget) {
      var targets = window.calcTarget();
      tdee = (typeof targets === 'number' && targets > 0) ? targets : 0;
    }
  } catch(e) {}
  if (tdee <= 0) return null;

  // Calculer le déficit/surplus moyen sur la période
  // Pour simplifier : si objectif perte de poids, le déficit cible est ~500 kcal/j → -0.5kg/semaine
  // Variation attendue : (déficit * jours) / 7700 kcal/kg
  var _goalKey = (window.GOALS && typeof S.goal === 'number' && window.GOALS[S.goal]) ? window.GOALS[S.goal].key : 'maintain';
  var isLoss = _goalKey === 'cut' || _goalKey === 'shred';
  var isGain = _goalKey === 'bulk' || _goalKey === 'lean_bulk';

  var expectedChangePerWeek = isLoss ? -0.5 : isGain ? 0.25 : 0;
  var expectedChange = (expectedChangePerWeek / 7) * daysDiff;

  var delta = actualChange - expectedChange; // positif = prend plus que prévu

  // Seuil de tolérance : ±0.3 kg → pas de recommandation
  if (Math.abs(delta) < 0.3) return null;

  // Calculer la recommandation TDEE ajustée
  // 7700 kcal = 1 kg de graisse corporelle (approx)
  var kcalAdjust = Math.round((delta / daysDiff) * 7700);
  var newTDEE = Math.max(1200, tdee - kcalAdjust);
  var diffKcal = Math.abs(tdee - newTDEE);
  if (diffKcal < 50) return null; // Ajustement trop faible, ignorer

  var c = card('border-left:3px solid var(--orange,#6A4A1A);');
  c.appendChild(eyebrow('Ajustement recommandé'));

  var title = delta > 0
    ? 'Ton corps répond moins bien au déficit'
    : 'Perte plus rapide que prévu';
  c.appendChild(cardTitle(title));

  var actualStr = (actualChange >= 0 ? '+' : '') + actualChange.toFixed(1) + ' kg';
  var expectedStr = (expectedChange >= 0 ? '+' : '') + expectedChange.toFixed(1) + ' kg';

  c.appendChild(h('p', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin:8px 0;line-height:1.5;' },
    'Sur ' + daysDiff + ' jours\u00a0: tu as perdu/pris ' + actualStr + ' (attendu\u00a0: ' + expectedStr + ').'
  ));

  var adjustMsg = delta > 0
    ? 'Réduis tes apports de ' + diffKcal + '\u00a0kcal/jour (cible\u00a0: ' + newTDEE + '\u00a0kcal)'
    : 'Tu peux augmenter tes apports de ' + diffKcal + '\u00a0kcal/jour (cible\u00a0: ' + newTDEE + '\u00a0kcal)';

  c.appendChild(h('p', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:700;color:var(--orange,#6A4A1A);margin:8px 0 0;line-height:1.5;' }, adjustMsg));

  // Bouton dismiss
  var dismissKey = 'mtd_tdee_adapt_dismissed_' + new Date().toISOString().slice(0, 7); // 1 fois par mois
  try { if (localStorage.getItem(dismissKey) === '1') return null; } catch(e) {}

  var dismissBtn = h('button', {
    style: 'margin-top:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);background:transparent;border:none;cursor:pointer;padding:12px 0;min-height:44px;display:block;width:100%;text-align:left;',
    onclick: function() {
      try { localStorage.setItem(dismissKey, '1'); } catch(e) {}
      if (window.render) window.render();
    }
  }, 'OK, j\'ai compris');
  c.appendChild(dismissBtn);

  return c;
}

// ─── BILAN HEBDOMADAIRE (dimanche) ───
function renderCardSundayReview(S) {
  var now = new Date();
  var isSunday = now.getDay() === 0;
  if (!isSunday && !S._forceWeeklyReview) return null;

  // Ne pas construire le DOM si déjà dismissé aujourd'hui (optimisation)
  try { if (localStorage.getItem('mtd_weekly_review_dismissed_' + now.toISOString().slice(0, 10)) === '1') return null; } catch(e) {}
  var uid = (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';

  // Charger le log séances de la semaine
  var muscuLog = {};
  try { muscuLog = JSON.parse(localStorage.getItem('mtd_muscu_session_' + uid) || '{}'); } catch(e) {}

  // Calculer les 7 derniers jours
  var seancesDone = 0;
  var weekKcalArr = [];
  var _nutritionHistory = (window.PERF_HISTORY && window.PERF_HISTORY.loadNutritionHistory) ? window.PERF_HISTORY.loadNutritionHistory() : [];
  for (var d = 6; d >= 0; d--) {
    var dd = new Date(now); dd.setDate(dd.getDate() - d);
    var dateStr = dd.toISOString().slice(0, 10);
    // Séances muscu
    if (muscuLog[dateStr] && Object.keys(muscuLog[dateStr]).length > 0) {
      var _hasValidated = false;
      Object.values(muscuLog[dateStr]).forEach(function(sets) {
        if (Array.isArray(sets) && sets.some(function(s){ return s.validated; })) _hasValidated = true;
      });
      if (_hasValidated) seancesDone++;
    }
    // Calories depuis l'historique nutrition
    try {
      var _ph = _nutritionHistory;
      var _dayNut = _ph.find(function(e){ return e.date === dateStr; });
      if (_dayNut && _dayNut.kcal > 0) weekKcalArr.push(_dayNut.kcal);
    } catch(e) {}
  }

  var avgKcal = weekKcalArr.length > 0 ? Math.round(weekKcalArr.reduce(function(a,b){ return a+b; }, 0) / weekKcalArr.length) : 0;

  // Poids actuel
  var currentWeight = S.currentWeight || S.weight || 0;

  var c = card();
  c.appendChild(eyebrow('Bilan de la semaine'));
  c.appendChild(cardTitle('Ta semaine'));

  // Stats row
  var statsRow = h('div', { style: 'display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;' });

  // Séances
  var seancesBox = h('div', { style: 'flex:1;min-width:80px;padding:12px;background:var(--ivory2);border:1px solid var(--border);border-radius:2px;text-align:center;' });
  seancesBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:24px;color:var(--green,#1A4A1A);' }, String(seancesDone)));
  seancesBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px;' }, 'Séances'));
  statsRow.appendChild(seancesBox);

  // Calories moyennes
  if (avgKcal > 0) {
    var kcalBox = h('div', { style: 'flex:1;min-width:80px;padding:12px;background:var(--ivory2);border:1px solid var(--border);border-radius:2px;text-align:center;' });
    kcalBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:24px;color:var(--blue,#1A3A6A);' }, String(avgKcal)));
    kcalBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px;' }, 'Kcal moy.'));
    statsRow.appendChild(kcalBox);
  }

  // Poids
  if (currentWeight > 0) {
    var weightBox = h('div', { style: 'flex:1;min-width:80px;padding:12px;background:var(--ivory2);border:1px solid var(--border);border-radius:2px;text-align:center;' });
    weightBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:24px;color:var(--orange,#6A4A1A);' }, currentWeight + ' kg'));
    weightBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px;' }, 'Poids'));
    statsRow.appendChild(weightBox);
  }

  c.appendChild(statsRow);

  // Message de motivation
  var motivMsg;
  if (seancesDone >= 4) motivMsg = 'Excellente semaine ! La régularité, c\'est la clé.';
  else if (seancesDone >= 2) motivMsg = 'Bonne semaine. Continuez sur cette lancée !';
  else if (seancesDone >= 1) motivMsg = 'Un début. La semaine prochaine, visez 3 séances.';
  else motivMsg = 'Pas de séance cette semaine. Recommencez dès demain !';

  c.appendChild(h('p', { style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--grey);margin:12px 0 0;line-height:1.6;' }, motivMsg));

  // Bouton dismiss
  var dismissBtn = h('button', {
    style: 'margin-top:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);background:transparent;border:none;cursor:pointer;padding:12px 0;min-height:44px;display:block;width:100%;text-align:left;',
    onclick: function() {
      S._forceWeeklyReview = false;
      // Stocker le dismiss dans localStorage pour ne pas réafficher aujourd'hui
      try { localStorage.setItem('mtd_weekly_review_dismissed_' + new Date().toISOString().slice(0, 10), '1'); } catch(e) {}
      if (window.render) window.render();
    }
  }, 'Fermer le bilan');
  c.appendChild(dismissBtn);

  // Ne pas réafficher si déjà fermé aujourd'hui
  try {
    if (localStorage.getItem('mtd_weekly_review_dismissed_' + now.toISOString().slice(0, 10)) === '1') return null;
  } catch(e) {}

  return c;
}

// ─── MAIN RENDER ───
function renderTodayDashboard(p) {
  if (!p || !p.nodeType) return;
  var S = window.S;
  if (!S) return;

  // Mettre à jour le streak à chaque affichage du tableau de bord
  if (window.GAMIFICATION && window.GAMIFICATION.updateStreak) {
    try { window.GAMIFICATION.updateStreak(); } catch(e) {}
  }

  p.innerHTML = '';

  // ─── BILAN DE FORME — plein écran à la connexion ───
  // Seulement pour les utilisateurs ayant le sport (sport ou both)
  var _todayDate = new Date().toISOString().slice(0, 10);
  var _w = S.todayWellness;
  // Valider structure todayWellness
  if (_w && (typeof _w.date !== 'string' || typeof _w.sleep !== 'number')) {
    _w = null; // réinitialiser si corrompu
    S.todayWellness = null;
  }
  var _needCheckin = (!_w || _w.date !== _todayDate);
  var _hasSport = (S.appMode === 'sport' || S.appMode === 'both');
  // Bilan de forme uniquement à partir de J+1 (pas le jour même de l'inscription)
  var _isFirstDay = !S.firstLoginDate || S.firstLoginDate === _todayDate;
  if (_needCheckin && _hasSport && !_isFirstDay) {
    if (window.renderWellnessCheckin) {
      var wellnessWrap = h('div', { style: 'padding:32px 20px;max-width:480px;margin:0 auto;' });
      window.renderWellnessCheckin(wellnessWrap, function() {
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        renderTodayDashboard(p);
      });
      p.appendChild(wellnessWrap);
      return;
    }
    // Fallback : renderWellnessCheckin indisponible → afficher le dashboard directement
  }

  var wrapper = h('div', { style: 'padding-bottom:16px;' });

  // Welcome banner — Bon retour parmi nous (shown only after login, then cleared)
  if (S.justLoggedIn) {
    wrapper.appendChild(renderWelcomeBanner(S));
    S.justLoggedIn = false;
    if (window.saveProfile) { try { window.saveProfile(); } catch(e) { console.warn('[saveProfile] failed:', e); } }
  }

  // Card 1 — Bonjour
  wrapper.appendChild(renderCardBonjour(S));

  // Card 1b — Prochain repas (hero, time-aware)
  var cardNextMeal = renderCardNextMeal();
  if (cardNextMeal) wrapper.appendChild(cardNextMeal);

  // Card 1c — Bilan hebdo (dimanche uniquement)
  var cardWeekly = renderCardSundayReview(S);
  if (cardWeekly) wrapper.appendChild(cardWeekly);

  // Card 2 — Séance du jour / Jour de repos
  var cardSport = renderCardSport();
  if (cardSport) wrapper.appendChild(cardSport);

  // Card 3 — Macros du jour
  var cardMacros = renderCardMacros(); if (cardMacros) wrapper.appendChild(cardMacros);

  // Card 3b — TDEE adaptatif
  var cardTDEE = renderCardTDEEAdaptatif(S);
  if (cardTDEE) wrapper.appendChild(cardTDEE);

  // Card 4 — Repas du jour (plan complet)
  var cardRepas = renderCardRepas();
  if (cardRepas) wrapper.appendChild(cardRepas);

  // Card 5 — Streak & badges
  var cardStreak = renderCardStreak();
  if (cardStreak) wrapper.appendChild(cardStreak);

  // Card 6 — Checkin bien-être supprimée : fait en plein écran à l'arrivée

  // Card 7 — Raccourcis rapides
  var cardShortcuts = renderCardShortcuts(); if (cardShortcuts) wrapper.appendChild(cardShortcuts);

  // Sections étendues (ex-Dashboard) — masquées par défaut, dépliables
  var _extOpen = S._dashExtOpen || false;
  var extToggle = h('button', {
    style: 'display:block;width:100%;margin:16px 0 4px;padding:12px;background:transparent;border:1px solid var(--border,#E8E6DF);color:var(--grey,#6B6B65);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
    onclick: function() {
      S._dashExtOpen = !S._dashExtOpen;
      if (window.render) window.render();
    }
  }, _extOpen ? '▲ Réduire' : '▼ Suivi · Progression · Données');
  wrapper.appendChild(extToggle);

  if (_extOpen) {
    renderExtendedSections(wrapper, S);
  }

  p.appendChild(wrapper);
}

// ─── EXPOSE GLOBALLY ───
window.TODAY = {
  render: renderTodayDashboard
};

// ─── DÉTECTION CHANGEMENT DE JOUR ───
// Re-render quand l'app redevient visible (ex: lendemain matin, app gardée ouverte)
var _todayLastRenderDate = new Date().toISOString().slice(0, 10);
document.addEventListener('visibilitychange', function() {
  if (document.hidden) return;
  var _currentDate = new Date().toISOString().slice(0, 10);
  if (_currentDate !== _todayLastRenderDate) {
    _todayLastRenderDate = _currentDate;
    if (window.render) { try { window.render(); } catch(e) {} }
  }
});

})();
