/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
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

// ─── EMPTY STATE ILLUSTRATIONS (COSMÉTIQUE 2026-04) ────────────────
// SVG monochrome trait 1px noir — remplace les emojis qui cassent la charte Hermès.
function emptyIllu(type) {
  var ns = 'http://www.w3.org/2000/svg';
  var wrap = h('div', {style: 'display:flex;justify-content:center;margin-bottom:12px;'});
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '72'); svg.setAttribute('height', '72');
  svg.setAttribute('viewBox', '0 0 72 72');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', '#0A0A09');
  svg.setAttribute('stroke-width', '1.2');
  svg.setAttribute('stroke-linecap', 'round');

  if (type === 'nutrition') {
    // Assiette vide : cercle extérieur + cercle intérieur grisé + 4 repères
    var paths = [
      '<circle cx="36" cy="36" r="26"/>',
      '<circle cx="36" cy="36" r="18" stroke="#D8D8D0"/>',
      '<line x1="36" y1="10" x2="36" y2="16"/>',
      '<line x1="36" y1="56" x2="36" y2="62"/>',
      '<line x1="10" y1="36" x2="16" y2="36"/>',
      '<line x1="56" y1="36" x2="62" y2="36"/>'
    ];
    svg.innerHTML = paths.join('');
  } else if (type === 'sport') {
    // Haltère : barre centrale + 4 blocs (poids)
    var paths2 = [
      '<line x1="8" y1="36" x2="64" y2="36" stroke-width="1.4"/>',
      '<rect x="13" y="28" width="5" height="16" rx="1"/>',
      '<rect x="54" y="28" width="5" height="16" rx="1"/>',
      '<rect x="22" y="24" width="4" height="24" rx="1"/>',
      '<rect x="46" y="24" width="4" height="24" rx="1"/>'
    ];
    svg.innerHTML = paths2.join('');
  }
  wrap.appendChild(svg);
  return wrap;
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

    // FIX D9 COHÉRENCE BADGES 2026-04 : GAMIFICATION.BADGE_DEFS est la source UNIQUE.
    // Avant : on priorisait BADGE_EMOJI local → toast GAMIFICATION disait "3 Jours" (BADGE_DEFS.name)
    //         mais dashboard affichait "3 jours d'affilée" (BADGE_EMOJI.label) pour le même badge.
    //         L'user voyait 2 noms pour 1 badge.
    // Maintenant : GAMIFICATION.BADGE_DEFS d'abord (source unique), BADGE_EMOJI uniquement
    //              pour l'emoji d'affichage (fallback desc/label).
    // 1. GAMIFICATION.BADGE_DEFS (source unique du .name)
    if (window.GAMIFICATION) {
      var defs = window.GAMIFICATION.BADGE_DEFS || window.GAMIFICATION.BADGES;
      if (Array.isArray(defs)) {
        var defU = defs.find(function(b) { return b && b.id === badgeId; });
        if (defU) {
          var emoji = (BADGE_EMOJI[badgeId] && BADGE_EMOJI[badgeId].emoji) || defU.emoji || '🏆';
          return { id: badgeId, name: defU.name, icon: emoji, desc: defU.desc || (BADGE_EMOJI[badgeId] && BADGE_EMOJI[badgeId].desc) || '' };
        }
      }
    }
    // 2. Fallback BADGE_EMOJI si GAMIFICATION.BADGE_DEFS absent
    if (BADGE_EMOJI[badgeId]) {
      var em = BADGE_EMOJI[badgeId];
      return { id: badgeId, name: em.label, icon: em.emoji, desc: em.desc };
    }

    // 3. Legacy path (array keyed by .id)
    if (window.GAMIFICATION) {
      var defs2 = window.GAMIFICATION.BADGE_DEFS || window.GAMIFICATION.BADGES;
      if (Array.isArray(defs2)) {
        var def = defs2.find(function(b) { return b && b.id === badgeId; });
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
// Utilise getAdaptedMealSplit() pour appliquer le calMultiplier correct selon objectif et type de jour.
// Cohérence avec generateWeek() qui utilise la même fonction — BUG B symbiose sport/nutrition.
function getCalorieTarget() {
  if (window.calcTarget) {
    var t = window.calcTarget();
    if (t > 0) {
      if (window.getAdaptedMealSplit) {
        var _todayIdxCal = (new Date().getDay() + 6) % 7;
        try {
          var _splitCal = window.getAdaptedMealSplit(_todayIdxCal);
          if (_splitCal && typeof _splitCal.calMultiplier === 'number') {
            return Math.round(t * _splitCal.calMultiplier);
          }
        } catch(e) {}
      }
      return t;
    }
  }
  return 0;
}

// ─── GET MACRO TARGETS ───
// Applique le calMultiplier sur les glucides (carb cycling) quand weekPlan absent.
// Les protéines et lipides restent stables — seuls les glucides absorbent la variation
// (ISSN 2017, Helms 2014 — carb cycling : protéines stables, glucides cyclés).
function getMacroTargets() {
  // FIX D14 COHÉRENCE CAL MULTIPLIER 2026-04 : si weekPlan du jour existe avec macros > 0,
  // on utilise directement la somme (le plan a DÉJÀ été calibré par generateWeek avec
  // le bon calMultiplier). Sinon fallback sur calcMacros + application manuelle.
  // Avant : getMacroTargets appliquait TOUJOURS calMultiplier, même si l'appelant
  //         (renderCardHeroKcal) ré-override ensuite avec le plan → risque double appli.
  try {
    var _Sx = window.S || {};
    if (Array.isArray(_Sx.weekPlan) && _Sx.weekPlan.length >= 7) {
      var _tiM = (new Date().getDay() + 6) % 7;
      var _dpM = _Sx.weekPlan[_tiM];
      if (_dpM) {
        var _pM = 0, _gM = 0, _lM = 0;
        ['breakfast','lunch','snack','dinner'].forEach(function(sl) {
          var r = _dpM[sl];
          if (r) { _pM += (r.p || 0); _gM += (r.g || 0); _lM += (r.l || 0); }
        });
        if (_pM > 0 || _gM > 0 || _lM > 0) {
          return { p: Math.round(_pM), g: Math.round(_gM), l: Math.round(_lM) };
        }
      }
    }
  } catch(eMM) {}
  if (window.calcMacros) {
    var m = window.calcMacros();
    if (m && (m.p > 0 || m.g > 0 || m.l > 0)) {
      if (window.getAdaptedMealSplit) {
        var _todayIdxMacro = (new Date().getDay() + 6) % 7;
        try {
          var _splitMacro = window.getAdaptedMealSplit(_todayIdxMacro);
          if (_splitMacro && typeof _splitMacro.calMultiplier === 'number' && _splitMacro.calMultiplier !== 1.0) {
            var _mult = _splitMacro.calMultiplier;
            var _pCal = m.p * 4;
            var _lCal = m.l * 9;
            var _totalTarget = Math.round((m.p * 4 + m.g * 4 + m.l * 9) * _mult);
            var _gCal = Math.max(520, _totalTarget - _pCal - _lCal); // plancher 130g glucides × 4
            return { p: m.p, g: Math.round(_gCal / 4), l: m.l };
          }
        } catch(e) {}
      }
      return m;
    }
  }
  return null;
}

// ─── GET NEXT SPORT DAY ───
function getNextSportDay() {
  var S = window.S;
  if (!S) return null;

  // FIX COHÉRENCE SPORT 2026-04 : bug #2 — si un programme IA muscu existe, il prévaut
  // sur le sportProgram statique (vue sport l'affiche, dashboard doit l'afficher aussi).
  if (S.sportType === 'musculation' && typeof S.muscuIAProgram === 'string' && S.muscuIAProgram.length > 100) {
    return { index: 0, day: { name: 'Programme sur mesure', exercises: [] }, kind: 'ia' };
  }

  // FIX D1 COHÉRENCE MULTI-SPORTS 2026-04 : dispatcher par sportType
  // Avant : le dashboard ne lisait QUE S.sportProgram (= muscu/crossfit statique).
  //         Pour running/hyrox/triathlon/cycling/calisthenics → affichait "Aucun programme"
  //         alors que la vue sport dédiée avait bien un programme.
  // Maintenant : si sportType a un programme dédié → on retourne un placeholder
  //             { kind: <sport> } pour que la carte affiche "Voir mon programme →"
  var todayIdx = (new Date().getDay() + 6) % 7;
  var sportsWithOwnProgram = {
    running:       { key: 'runningProgram',      label: 'running' },
    hyrox:         { key: 'hyroxProgram',        label: 'Hyrox' },
    triathlon:     { key: 'triathlonProgram',    label: 'triathlon' },
    cycling:       { key: 'cyclingProgram',      label: 'cycling' },
    calisthenics:  { key: 'calisthenicsProgram', label: 'calisthenics' },
    padel:         { key: 'padelProgram',        label: 'padel' },
    golf:          { key: 'golfProgram',         label: 'golf' },
    yoga:          { key: 'yogaWeek',            label: 'yoga' }
  };
  var sportInfo = sportsWithOwnProgram[S.sportType];
  if (sportInfo) {
    var prog = S[sportInfo.key];
    var hasProg = Array.isArray(prog) ? prog.length > 0 : !!prog;
    if (hasProg) {
      return {
        index: todayIdx,
        day: { name: 'Programme ' + sportInfo.label, exercises: [] },
        kind: S.sportType
      };
    }
  }

  var program = S.sportProgram;
  if (!program || !program.length) return null;

  // FIX COHÉRENCE SPORT 2026-04 : bug #1 — calcul du jour COURANT (pas selectedSportDay).
  var idx = 0;
  if (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length > 0) {
    var pos = S.trainingDaysSelected.indexOf(todayIdx);
    idx = pos >= 0 ? Math.min(pos, program.length - 1) : 0;
  } else {
    idx = Math.min(todayIdx, program.length - 1);
  }

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

  // COSMÉTIQUE 2026-04 : carte Prochain repas avec chip "dans Xh" premium
  var c = card('border-left:3px solid var(--black,#0A0A09);background:var(--ivory,#FAF9F6);position:relative;');
  c.appendChild(eyebrow('PROCHAIN REPAS'));

  // Chip "DANS Xh" en position absolue top-right (signature Hermès)
  var chipEl = h('div', {
    style: 'position:absolute;top:14px;right:14px;padding:4px 10px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;border-radius:2px;'
  });
  chipEl.textContent = timeLabel;
  c.appendChild(chipEl);

  // Titre du slot en Georgia 22px (premium)
  var titleEl = h('div', { style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;margin-bottom:2px;padding-right:80px;' });
  titleEl.textContent = slot.label;
  c.appendChild(titleEl);

  // Nom du plat en Georgia italique 14px (ton menu Bocuse)
  var nameEl = h('div', { style: 'font-family:Georgia,serif;font-style:italic;font-size:14px;color:var(--grey,#6B6B65);margin-bottom:10px;line-height:1.4;' });
  nameEl.textContent = meal.n;
  c.appendChild(nameEl);

  // Heure prévue + kcal/macros sur une ligne discrète
  if (meal.k || slot.time) {
    var detailsEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey2,#9A9A90);margin-bottom:14px;' });
    var parts = [];
    if (slot.time) parts.push(slot.time);
    if (meal.k) parts.push(Math.round(meal.k) + ' kcal');
    if (meal.p) parts.push(Math.round(meal.p) + 'g prot.');
    detailsEl.textContent = parts.join('  ·  ');
    c.appendChild(detailsEl);
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

  // Bouton scanner repas par IA
  if (window.PLATE_SCAN) {
    var scanBtn = h('button', {
      style: 'display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:8px;padding:10px 16px;background:transparent;border:1.5px solid var(--black,#0A0A09);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer;transition:all 0.2s ease;min-height:44px;',
      onclick: function() {
        var slotKey = slot.key || 'lunch';
        window.PLATE_SCAN.open(slotKey);
      }
    });
    scanBtn.appendChild(h('span', {style: 'font-size:14px'}, '\uD83D\uDCF7'));
    scanBtn.appendChild(h('span', {}, 'Scanner mon repas'));
    c.appendChild(scanBtn);
  }

  return c;
}

// ─── WELCOME BANNER — Bon retour parmi nous ───
function renderWelcomeBanner(S) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  var firstName = (window.getDisplayFirstName ? window.getDisplayFirstName() : (S.prenom || (user && user.name ? user.name.split(' ')[0] : '') || ''));

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
  var firstName = (window.getDisplayFirstName ? window.getDisplayFirstName() : (S.prenom || (user && user.name ? user.name.split(' ')[0] : '') || ''));

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

  // ── Bandeau Trial ──
  if (window.isTrialUser && window.isTrialUser()) {
    var _trialDays = window.getTrialDaysLeft ? window.getTrialDaysLeft() : 0;
    var _trialBanner = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:12px;border:1px solid var(--orange,#6A4A1A);background:var(--orangebg,rgba(106,74,26,0.06));border-radius:2px;'});
    var _trialLeft = h('div', {});
    _trialLeft.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange,#6A4A1A);font-weight:600;margin-bottom:2px;'}, 'VERSION D\u2019ESSAI'));
    if (_trialDays > 0) {
      _trialLeft.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'}, _trialDays + ' jour' + (_trialDays > 1 ? 's' : '') + ' restant' + (_trialDays > 1 ? 's' : '') + ' \u2014 Profitez de toutes les fonctionnalit\u00e9s'));
    } else {
      _trialLeft.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--red,#5A1010);'}, 'P\u00e9riode d\u2019essai termin\u00e9e'));
    }
    _trialBanner.appendChild(_trialLeft);
    _trialBanner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;color:var(--orange,#6A4A1A);'}, _trialDays > 0 ? _trialDays + 'j' : '!'));
    c.appendChild(_trialBanner);
  }

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
// ─── CARTE HERO KCAL — ring XXL Georgia (FIX COSMÉTIQUE 2026-04) ──────────
// Affiche un ring 120px avec le nombre de kcal consommées du jour en Georgia 28px
// au centre, et les 3 anneaux macros (P/G/L) 48px en dessous.
// Signature éditoriale en pleine largeur — pas de carte bordée.
function renderCardHeroKcal() {
  var _S3 = window.S || {};
  // Hide si mode sport pur (pas de donnée nutrition à afficher)
  if (_S3.appMode === 'sport') return null;

  var calorieTarget = getCalorieTarget();
  if (calorieTarget <= 0) return null; // pas encore onboarded

  // Calculer totals + macros (logique alignée avec renderCardMacros)
  var totals = getTodayTotals();
  var macroTargets = getMacroTargets();
  // Si un weekPlan du jour existe, préférer ses macros (plan nutrition)
  if (Array.isArray(_S3.weekPlan) && _S3.weekPlan.length >= 7) {
    var _ti = (new Date().getDay() + 6) % 7;
    var _dp = _S3.weekPlan[_ti];
    if (_dp && typeof _dp.kcal === 'number' && _dp.kcal > 0) {
      calorieTarget = _dp.kcal;
      var _p=0,_g=0,_l=0;
      ['breakfast','lunch','snack','dinner'].forEach(function(sl) {
        var r = _dp[sl]; if (r) { _p += (r.p||0); _g += (r.g||0); _l += (r.l||0); }
      });
      if (_p>0 || _g>0 || _l>0) macroTargets = { p: Math.round(_p), g: Math.round(_g), l: Math.round(_l) };
    }
  }

  var kcalConsumed = Math.round(totals.kcal);
  var pct = calorieTarget > 0 ? Math.min(100, Math.round((kcalConsumed / calorieTarget) * 100)) : 0;

  // Container pleine largeur, signature éditoriale (pas de carte bordée)
  var hero = h('div', {style: 'padding:24px 0 16px;margin-bottom:16px;text-align:center;border-bottom:1px solid var(--border,#D8D8D0);'});

  // Label top
  hero.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:14px;'}, "Aujourd'hui"));

  // Ring SVG XXL (120px)
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '132'); svg.setAttribute('height', '132');
  svg.setAttribute('viewBox', '0 0 132 132');
  svg.setAttribute('style', 'display:block;margin:0 auto;');

  var r = 58, c = 2 * Math.PI * r, off = c - (pct/100)*c;
  var bg = document.createElementNS(ns, 'circle');
  bg.setAttribute('cx','66'); bg.setAttribute('cy','66'); bg.setAttribute('r', r);
  bg.setAttribute('fill','none'); bg.setAttribute('stroke','#E5E4DE'); bg.setAttribute('stroke-width','3');
  svg.appendChild(bg);

  var fg = document.createElementNS(ns, 'circle');
  fg.setAttribute('cx','66'); fg.setAttribute('cy','66'); fg.setAttribute('r', r);
  fg.setAttribute('fill','none'); fg.setAttribute('stroke','#0A0A09'); fg.setAttribute('stroke-width','3');
  fg.setAttribute('stroke-linecap','butt');
  fg.setAttribute('stroke-dasharray', c); fg.setAttribute('stroke-dashoffset', c);
  fg.setAttribute('transform','rotate(-90 66 66)');
  fg.style.transition = 'stroke-dashoffset 0.8s ease';
  svg.appendChild(fg);

  // Chiffre central Georgia 28px
  var tNum = document.createElementNS(ns, 'text');
  tNum.setAttribute('x','66'); tNum.setAttribute('y','64');
  tNum.setAttribute('text-anchor','middle'); tNum.setAttribute('dominant-baseline','middle');
  tNum.setAttribute('fill','#0A0A09'); tNum.setAttribute('font-family','Georgia,serif');
  tNum.setAttribute('font-size','32'); tNum.setAttribute('font-weight','normal');
  tNum.textContent = String(kcalConsumed);
  svg.appendChild(tNum);

  // Subtitle "/ 2200 kcal"
  var tSub = document.createElementNS(ns, 'text');
  tSub.setAttribute('x','66'); tSub.setAttribute('y','84');
  tSub.setAttribute('text-anchor','middle'); tSub.setAttribute('dominant-baseline','middle');
  tSub.setAttribute('fill','#6B6B65'); tSub.setAttribute('font-family','Helvetica Neue,Arial,sans-serif');
  tSub.setAttribute('font-size','9'); tSub.setAttribute('letter-spacing','2');
  tSub.textContent = '/ ' + Math.round(calorieTarget) + ' KCAL';
  svg.appendChild(tSub);

  hero.appendChild(svg);
  // Animer l'anneau après render (50ms) — même pattern que svgRing existant
  setTimeout(function() { fg.setAttribute('stroke-dashoffset', off); }, 50);

  // Delta ligne — calories restantes (accent vert si positif, orange si dépassement)
  var netRem = Math.round(calorieTarget - kcalConsumed);
  var deltaStyle = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-top:12px;font-weight:500;';
  var deltaText, deltaColor;
  if (netRem > 0) {
    deltaColor = 'var(--accent,#1A4A1A)';
    deltaText = netRem + ' kcal restantes';
  } else if (netRem === 0) {
    deltaColor = 'var(--grey,#6B6B65)';
    deltaText = 'Objectif atteint';
  } else {
    deltaColor = 'var(--orange,#6A4A1A)';
    deltaText = Math.abs(netRem) + ' kcal au-dessus';
  }
  hero.appendChild(h('div', {style: deltaStyle + 'color:' + deltaColor + ';'}, deltaText));

  // Mini-rings macros (P / G / L) en ligne, 48px chacun
  if (macroTargets && (macroTargets.p > 0 || macroTargets.g > 0 || macroTargets.l > 0) && window.svgRing) {
    var rings = h('div', {style: 'display:flex;justify-content:center;gap:20px;margin-top:18px;'});
    if (macroTargets.p > 0) {
      var pPct = Math.min(100, totals.p > 0 ? Math.round(totals.p / macroTargets.p * 100) : 0);
      rings.appendChild(window.svgRing(52, 5, pPct, '#0A0A09', 'Protéines', Math.round(totals.p)));
    }
    if (macroTargets.g > 0) {
      var gPct = Math.min(100, totals.g > 0 ? Math.round(totals.g / macroTargets.g * 100) : 0);
      rings.appendChild(window.svgRing(52, 5, gPct, '#6B6B65', 'Glucides', Math.round(totals.g)));
    }
    if (macroTargets.l > 0) {
      var lPct = Math.min(100, totals.l > 0 ? Math.round(totals.l / macroTargets.l * 100) : 0);
      rings.appendChild(window.svgRing(52, 5, lPct, '#6A4A1A', 'Lipides', Math.round(totals.l)));
    }
    hero.appendChild(rings);
  }

  return hero;
}

function renderCardMacros() {
  // Sport-only : pas de données nutrition, masquer la carte entièrement
  var _S2 = window.S || {};
  if (_S2.appMode === 'sport') return null;

  var calorieTarget = getCalorieTarget();
  var macroTargetsOverride = null;
  // Priorité aux macros du plan du jour si weekPlan disponible
  // Les macros sont aggrégées à la volée depuis les recettes (robuste aux swaps)
  if (Array.isArray(_S2.weekPlan) && _S2.weekPlan.length >= 7) {
    var _todayIdx = (new Date().getDay() + 6) % 7; // 0=Lun … 6=Dim
    var _dayPlan = _S2.weekPlan[_todayIdx];
    if (_dayPlan && typeof _dayPlan.kcal === 'number' && _dayPlan.kcal > 0) {
      calorieTarget = _dayPlan.kcal;
      // Recalculer macros depuis les recettes actuelles (évite les agrégats périmés après swap)
      var _planP = 0, _planG = 0, _planL = 0;
      ['breakfast','lunch','snack','dinner'].forEach(function(sl) {
        var r = _dayPlan[sl];
        if (r) { _planP += (r.p || 0); _planG += (r.g || 0); _planL += (r.l || 0); }
      });
      if (_planP > 0 || _planG > 0 || _planL > 0) {
        macroTargetsOverride = { p: Math.round(_planP), g: Math.round(_planG), l: Math.round(_planL) };
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

  // Sport burn badge (informatif uniquement — déjà inclus dans le TDEE via PAL)
  // BUG D : Ne PAS ajouter _sportBurn à _netRemaining — le TDEE inclut déjà la dépense sportive
  // via le facteur d'activité PAL (Mifflin-St Jeor × PAL). L'ajouter créerait un double-comptage.
  // Le badge est conservé à titre informatif (confirmation de la dépense réelle de séance).
  if (_sportBurn > 0) {
    var _burnEl = document.createElement('div');
    _burnEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-bottom:6px;font-weight:500;color:var(--green,#1A4A1A);';
    _burnEl.textContent = '🏃 ' + _sportBurn + ' kcal dépensées (incluses dans votre TDEE)';
    c.appendChild(_burnEl);
  }

  // Calories restantes = target - mangé (sans ajouter _sportBurn — BUG D fix)
  var _netRemaining = Math.round(calorieTarget - totals.kcal);
  var _remEl = document.createElement('div');
  _remEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-bottom:10px;font-weight:500;';
  if (_netRemaining > 0) {
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
    var _emptyCard = h('div', {style: 'text-align:center;padding:32px 16px;'});
    _emptyCard.appendChild(emptyIllu('nutrition'));
    _emptyCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:8px;font-weight:normal;'}, 'Aucun plan nutritionnel'));
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
  if (S.pregnant && S.sex === 'femme') {
    // Femme enceinte : afficher "Grossesse" même si S.goal est cut/shred (calcTarget() corrige les calories)
    goalLabel = 'Grossesse';
  } else if (window.GOALS && typeof S.goal === 'number' && window.GOALS[S.goal]) {
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
  // FIX WARN-1 audit dashboard 2026-04-15 : "1 / Premier jour" prématuré
  // (s'affichait dès le 1er render avant que l'user ait fait quoi que ce soit).
  // On n'affiche le streak qu'à partir de J+1 (firstLoginDate < today) OU si streak >= 2.
  var _S = window.S || {};
  var _todayStr = new Date().toISOString().slice(0, 10);
  var _isFirstDay = !_S.firstLoginDate || _S.firstLoginDate === _todayStr;
  if (streak === 1 && _isFirstDay && !lastBadge) return null;

  var c = card();
  c.appendChild(eyebrow('PROGRESSION'));

  // ── Streak block ──
  if (streak > 0) {
    // COSMÉTIQUE 2026-04 : streak chiffre XXL Georgia centré (hero typo)
    var streakWrap = h('div', {
      style: 'text-align:center;margin-bottom:' + (lastBadge ? '18px' : '8px') + ';padding:8px 0;'
    });

    // Chiffre XXL Georgia 64px — le hero
    var streakNum = h('div', {
      style: 'font-family:Georgia,serif;font-size:64px;font-weight:normal;line-height:0.95;letter-spacing:-2px;color:var(--black);margin-bottom:4px;'
    });
    streakNum.textContent = String(streak);

    // Label discret sous le chiffre
    var streakLabel = h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey);'
    });
    streakLabel.textContent = streak > 1 ? 'Jours consécutifs' : 'Premier jour';

    streakWrap.appendChild(streakNum);
    streakWrap.appendChild(streakLabel);
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
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);border:1px solid var(--border,#D8D8D0);background:transparent;padding:4px 10px;display:inline-block;margin-top:-4px;margin-bottom:8px;border-radius:2px;'
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

  // Programme IA personnalisé actif → afficher un lien vers Sport
  // FIX COHÉRENCE SPORT 2026-04 : le sportType réel est 'musculation' (pas 'muscu')
  // Avant : cette carte ne s'affichait JAMAIS (sportType ne matchait jamais 'muscu')
  //         → utilisateur ne voyait pas que son programme IA était actif sur le dashboard
  // Maintenant : check contre 'musculation' (valeur réelle dans S.sportType)
  if (S.muscuIAProgram && S.sportType === 'musculation') {
    var _iaCard = card('border-left:4px solid var(--green,#1A4A1A);');
    _iaCard.appendChild(eyebrow('VOTRE PROGRAMME'));
    _iaCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:8px;'}, 'Programme sur mesure actif'));
    var _iaDate = S.muscuIAProgramDate ? 'G\u00e9n\u00e9r\u00e9 le ' + new Date(S.muscuIAProgramDate).toLocaleDateString('fr-FR') : '';
    if (_iaDate) _iaCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px;'}, _iaDate));
    _iaCard.appendChild(h('button', {style: 'padding:10px 16px;background:var(--green,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;min-height:44px;', onclick: function() { S.view = 'sport'; S.sStep = 4; if (window.render) window.render(); }}, 'Voir mon programme \u2192'));
    return _iaCard;
  }

  if (!hasSportProgram) {
    // No sport program — empty state
    if (S && (S.appMode === 'nutrition')) return null; // nutrition-only mode: ne pas afficher
    var _sportEmptyCard = card();
    _sportEmptyCard.appendChild(eyebrow('SPORT'));
    var _sportEmpty = h('div', {style: 'text-align:center;padding:24px 0 12px;'});
    _sportEmpty.appendChild(emptyIllu('sport'));
    _sportEmpty.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:8px;font-weight:normal;'}, 'Aucun programme sportif'));
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

  // FIX D11 COHÉRENCE SESSION COUNT 2026-04 : scanner muscuSessionLog + sessionHistory
  // Avant : comptait UNIQUEMENT S.muscuSessionLog → runner/triathlète/crossfit voyait 0/3
  //         car leurs sessions vont dans S.sessionHistory (voir app-sport.js:6929+).
  // Maintenant : union des deux → le dashboard compte TOUTES les sessions loggées.
  var _weekDone = 0;
  try {
    var _log = S.muscuSessionLog || {};
    var _history = S.sessionHistory || {};
    var _now = new Date();
    var _dow = (_now.getDay() + 6) % 7;
    var _mon = new Date(_now); _mon.setDate(_now.getDate() - _dow);
    for (var _di = 0; _di <= _dow; _di++) {
      var _d = new Date(_mon); _d.setDate(_mon.getDate() + _di);
      var _ds = _d.toISOString().slice(0, 10);
      var hasMuscu = _log[_ds] && Object.keys(_log[_ds]).length > 0;
      var hasSession = _history[_ds] && _history[_ds].date === _ds;
      if (hasMuscu || hasSession) _weekDone++;
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

  // COSMÉTIQUE 2026-04 : Grid 3-stats Georgia (ex / durée / semaine) — signature premium
  if (exCount > 0 || _estMins || _weekTarget > 0) {
    var _statsRow = h('div', {
      style: 'display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid var(--border,#D8D8D0);border-radius:2px;margin:12px 0;background:var(--ivory,#FAF9F6);'
    });
    function _statCell(val, label, isLast) {
      var cell = h('div', {
        style: 'padding:12px 8px;text-align:center;' + (isLast ? '' : 'border-right:1px solid var(--border,#D8D8D0);')
      });
      cell.appendChild(h('div', {
        style: 'font-family:Georgia,serif;font-size:22px;color:var(--black,#0A0A09);line-height:1;font-weight:normal;'
      }, String(val)));
      cell.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:4px;'
      }, label));
      return cell;
    }
    _statsRow.appendChild(_statCell(exCount || '—', 'Exercices', false));
    _statsRow.appendChild(_statCell(_estMins ? ('~' + _estMins + "'") : '—', 'Durée', false));
    _statsRow.appendChild(_statCell(_weekTarget > 0 ? (_weekDone + '/' + _weekTarget) : '—', 'Semaine', true));
    c.appendChild(_statsRow);
  }

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
  // 35 ml/kg (EFSA 2010 / ANSES) + plancher EFSA : 2.0 L femme, 2.5 L homme (cohérent avec calcHydration())
  var _efsa_floor = (S && S.sex === 'homme') ? 2.5 : 2.0;
  var waterGoal = Math.max(_efsa_floor, Math.round(weightKg * 0.035 * 10) / 10);

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
  // FIX UI #2 2026-04 : en mode nutrition pure (pas de sportType), le checkin
  // wellness n'a pas de sens (la donnée n'est utilisée que par le moteur sport
  // pour adapter le programme). On masque la card complètement au lieu d'afficher
  // un bouton mort qui faisait early-return silencieux.
  if (!S.sportType && S.appMode === 'nutrition') return null;

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
      // Mode 'sport' ou 'both' : on bascule sur la vue sport pour le checkin
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
        // Persister le nouveau poids dans le profil (évite la perte de données si l'utilisateur ferme l'app)
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
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

  // POLISH 2026-04 (INSIGHTS) : Bilan 7 jours — stats + patterns détectés.
  // Affiché uniquement si l'user a déjà au moins 1 donnée (session, wellness ou feedback).
  try {
    var insights = (typeof window.getWeekInsights === 'function') ? window.getWeekInsights() : null;
    var hasAnyData = insights && (
      (insights.sessions && insights.sessions > 0) ||
      (insights.wellnessDaysLogged && insights.wellnessDaysLogged > 0) ||
      (insights.patterns && insights.patterns.length > 0)
    );
    if (hasAnyData) {
      wrapper.appendChild(sectionLabel('Bilan 7 jours'));
      var insightsBox = card();

      // Stats principales — grille 2x2 sobre
      var statsGrid = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;' });
      function insightStat(value, label, color) {
        var box = h('div', { 'class': 'sfc-stat-box', style: 'padding:10px 12px;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);border-radius:2px;text-align:center;' });
        box.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;color:' + (color || 'var(--black,#0A0A09)') + ';' }, String(value)));
        box.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:2px;' }, label));
        return box;
      }
      var sessions = (insights.sessions || 0);
      var kcal = (insights.kcalTotal || 0);
      statsGrid.appendChild(insightStat(sessions, 'Séances'));
      statsGrid.appendChild(insightStat(kcal > 0 ? kcal.toLocaleString('fr-FR') : '—', 'Kcal dépensées'));
      var sleep = (typeof insights.sleepAvg === 'number') ? insights.sleepAvg.toFixed(1) + '/5' : '—';
      statsGrid.appendChild(insightStat(sleep, 'Sommeil moyen'));
      var rpe = (typeof insights.rpeAvg === 'number') ? insights.rpeAvg.toFixed(1) + '/10' : '—';
      statsGrid.appendChild(insightStat(rpe, 'RPE moyen'));
      insightsBox.appendChild(statsGrid);

      // Bar chart jours actifs (micro, visuel minimaliste) — affiché UNIQUEMENT si
      // au moins une séance sur la semaine (sinon toutes les barres sont grises = bruit visuel).
      // FIX CONTRE-AUDIT : éviter l'UX confuse quand seul wellness est loggé sans session.
      if (Array.isArray(insights.byDay) && insights.byDay.length === 7 && (insights.sessions || 0) > 0) {
        var dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        var max = Math.max.apply(null, insights.byDay.concat([1]));
        var barsWrap = h('div', { style: 'display:flex;gap:4px;align-items:flex-end;height:32px;margin-bottom:12px;padding:0 4px;' });
        insights.byDay.forEach(function(cnt, i) {
          var col = h('div', { style: 'flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;' });
          var heightPct = cnt > 0 ? Math.max(8, Math.round((cnt / max) * 100)) : 6;
          var bar = h('div', {
            style: 'width:100%;height:' + heightPct + '%;background:' + (cnt > 0 ? 'var(--green,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';border-radius:1px;transition:height 0.3s ease;'
          });
          col.appendChild(bar);
          col.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey,#6B6B65);' }, dayLabels[i]));
          barsWrap.appendChild(col);
        });
        insightsBox.appendChild(barsWrap);
      }

      // Patterns détectés — chips informatifs
      if (Array.isArray(insights.patterns) && insights.patterns.length > 0) {
        var patternsWrap = h('div', { style: 'display:flex;flex-direction:column;gap:8px;' });
        insights.patterns.slice(0, 3).forEach(function(p) {
          var colorByS = { info: 'var(--green,#1A4A1A)', warning: 'var(--orange,#6A4A1A)', alert: 'var(--red,#5A1010)' };
          var bgBySeverity = { info: 'var(--greenbg,rgba(26,74,26,0.06))', warning: 'var(--orangebg,rgba(106,74,26,0.06))', alert: 'var(--redbg,rgba(90,16,16,0.06))' };
          var col = colorByS[p.severity] || 'var(--grey,#6B6B65)';
          var bg = bgBySeverity[p.severity] || 'transparent';
          var pChip = h('div', {
            'class': 'sfc-pattern-chip',
            style: 'padding:10px 12px;background:' + bg + ';border-left:3px solid ' + col + ';'
          });
          pChip.appendChild(h('div', {
            style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:600;color:' + col + ';margin-bottom:3px;'
          }, p.label || ''));
          if (p.advice) {
            pChip.appendChild(h('div', {
              style: 'font-family:Georgia,serif;font-size:12px;font-style:italic;color:var(--grey,#6B6B65);line-height:1.5;'
            }, p.advice));
          }
          patternsWrap.appendChild(pChip);
        });
        insightsBox.appendChild(patternsWrap);
      }

      wrapper.appendChild(insightsBox);
    }
  } catch(_iErr) {
    // Widget optionnel — silencieux si helpers indispos
  }

  // POLISH 2026-04 (OBJECTIFS SEMAINE) : progression vs objectifs (séances,
  // kcal, protéines, wellness). Affiché si au moins 1 métrique disponible.
  try {
    if (typeof window.getWeeklyGoalsProgress === 'function') {
      var goals = window.getWeeklyGoalsProgress();
      if (goals) {
        wrapper.appendChild(sectionLabel('Objectifs cette semaine'));
        var goalsBox = card();

        // Helper : row progress avec label + progress bar + valeur
        function goalRow(label, current, target, pct, unit, colorByPct) {
          var row = h('div', { 'class': 'sfc-goal-row', style: 'padding:10px 4px;border-bottom:1px solid var(--border,#D8D8D0);' });
          var top = h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;' });
          top.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, label));
          var rightTxt = current + (unit ? ' ' + unit : '') + (target !== null && target !== undefined ? ' / ' + target + (unit ? ' ' + unit : '') : '');
          var rightEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);font-weight:600;' }, rightTxt);
          top.appendChild(rightEl);
          row.appendChild(top);
          // Progress bar
          var trackStyle = 'width:100%;height:6px;background:var(--border,#D8D8D0);border-radius:3px;overflow:hidden;';
          var track = h('div', { style: trackStyle });
          var fillColor = colorByPct || 'var(--green,#1A4A1A)';
          var fillWidth = pct !== null ? Math.min(100, Math.max(0, pct)) : 0;
          var fill = h('div', { style: 'width:' + fillWidth + '%;height:100%;background:' + fillColor + ';transition:width 0.4s ease;' });
          track.appendChild(fill);
          row.appendChild(track);
          // Pct textuel à droite sous la barre
          if (pct !== null) {
            var pctLbl = h('div', { style: 'text-align:right;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;color:var(--grey,#6B6B65);margin-top:3px;' }, pct + '%');
            row.appendChild(pctLbl);
          }
          return row;
        }

        var hasGoals = false;

        // 1) Séances
        if (goals.sessions) {
          var sCol = 'var(--green,#1A4A1A)';
          if (goals.sessions.pct !== null && goals.sessions.pct < 50) sCol = 'var(--orange,#6A4A1A)';
          goalsBox.appendChild(goalRow(
            'Séances',
            goals.sessions.done,
            goals.sessions.planned,
            goals.sessions.pct,
            '',
            sCol
          ));
          hasGoals = true;
        }

        // 2) Kcal
        if (goals.kcalAvg) {
          var kCol = 'var(--green,#1A4A1A)';
          // Si >110% ou <90% → warning orange, >125% ou <75% → rouge
          if (goals.kcalAvg.pct !== null) {
            var kDiff = Math.abs(goals.kcalAvg.pct - 100);
            if (kDiff > 25) kCol = 'var(--red,#5A1010)';
            else if (kDiff > 10) kCol = 'var(--orange,#6A4A1A)';
          }
          goalsBox.appendChild(goalRow(
            'Calories (moy. 7j)',
            goals.kcalAvg.current,
            goals.kcalAvg.target,
            goals.kcalAvg.pct,
            'kcal',
            kCol
          ));
          hasGoals = true;
        }

        // 3) Protéines
        if (goals.proteinAvg) {
          var pCol = 'var(--green,#1A4A1A)';
          if (goals.proteinAvg.pct !== null && goals.proteinAvg.pct < 80) pCol = 'var(--orange,#6A4A1A)';
          goalsBox.appendChild(goalRow(
            'Protéines (moy. 7j)',
            goals.proteinAvg.current,
            goals.proteinAvg.target,
            goals.proteinAvg.pct,
            'g',
            pCol
          ));
          hasGoals = true;
        }

        // 4) Wellness loggés
        if (goals.wellnessLogged) {
          var wCol = 'var(--green,#1A4A1A)';
          if (goals.wellnessLogged.pct < 50) wCol = 'var(--orange,#6A4A1A)';
          goalsBox.appendChild(goalRow(
            'Bilan forme',
            goals.wellnessLogged.count,
            goals.wellnessLogged.target,
            goals.wellnessLogged.pct,
            'j',
            wCol
          ));
          hasGoals = true;
        }

        // Finition : dernière row sans border-bottom
        if (hasGoals) {
          var allGoalRows = goalsBox.querySelectorAll('div[style*="border-bottom"]');
          if (allGoalRows.length) allGoalRows[allGoalRows.length - 1].style.borderBottom = 'none';
          wrapper.appendChild(goalsBox);
        }
      }
    }
  } catch(_gErr) {
    // Widget optionnel — silencieux
  }

  // POLISH 2026-04 (GRAPHES) : courbes sommeil + énergie sur 30 jours.
  // Utilise Chart.js (déjà chargé) + window.getSleepEnergyTrend.
  // Affiché UNIQUEMENT si au moins 3 jours loggés (évite graphique vide).
  try {
    if (typeof window.getSleepEnergyTrend === 'function') {
      var trend = window.getSleepEnergyTrend(30);
      if (trend && trend.loggedDays >= 3) {
        wrapper.appendChild(sectionLabel('Sommeil & énergie (30 jours)'));
        var trendBox = card();

        // Stats rapides au-dessus du graphique
        var _sleepValues = trend.sleep.filter(function(v) { return typeof v === 'number'; });
        var _sleepAvg = _sleepValues.length ? (_sleepValues.reduce(function(a,b){return a+b;}, 0) / _sleepValues.length) : null;
        var _energyValues = trend.energyScore.filter(function(v) { return typeof v === 'number'; });
        var _energyAvg = _energyValues.length ? (_energyValues.reduce(function(a,b){return a+b;}, 0) / _energyValues.length) : null;

        var statsRow = h('div', { style: 'display:flex;gap:8px;margin-bottom:12px;justify-content:space-between;' });
        function trendStat(value, label) {
          var box = h('div', { 'class': 'sfc-stat-box', style: 'flex:1;text-align:center;padding:10px 12px;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);border-radius:2px;' });
          box.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:18px;color:var(--black,#0A0A09);' }, value));
          box.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:2px;' }, label));
          return box;
        }
        statsRow.appendChild(trendStat(
          _sleepAvg !== null ? _sleepAvg.toFixed(1) + '/5' : '—',
          'Sommeil moyen'
        ));
        statsRow.appendChild(trendStat(
          _energyAvg !== null ? _energyAvg.toFixed(1) + '/3' : '—',
          'Énergie moyenne'
        ));
        statsRow.appendChild(trendStat(
          trend.loggedDays + '/30',
          'Jours loggés'
        ));
        trendBox.appendChild(statsRow);

        // Canvas Chart.js
        var chartWrap = h('div', { style: 'position:relative;height:180px;' });
        var canvas = document.createElement('canvas');
        canvas.id = 'today-wellness-trend-chart';
        canvas.style.cssText = 'width:100%;height:180px;max-height:180px;';
        chartWrap.appendChild(canvas);
        trendBox.appendChild(chartWrap);

        // Rendu différé pour laisser DOM stabiliser
        requestAnimationFrame(function() {
          try {
            var ctx = document.getElementById('today-wellness-trend-chart');
            if (!ctx || typeof window.createChart !== 'function' || typeof Chart === 'undefined') return;
            // Labels courts : "15/04" (jour/mois) pour lisibilité
            var shortLabels = trend.labels.map(function(iso) {
              var parts = iso.split('-');
              return parts.length === 3 ? parts[2] + '/' + parts[1] : iso;
            });
            window.createChart(ctx, {
              type: 'line',
              data: {
                labels: shortLabels,
                datasets: [
                  {
                    label: 'Sommeil (1-5)',
                    data: trend.sleep,
                    borderColor: '#1A4A1A',
                    backgroundColor: 'rgba(26,74,26,0.08)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    spanGaps: true,
                    yAxisID: 'ySleep'
                  },
                  {
                    label: 'Énergie (bas/moyen/haut)',
                    data: trend.energyScore,
                    borderColor: '#6A4A1A',
                    backgroundColor: 'rgba(106,74,26,0.06)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    spanGaps: true,
                    borderDash: [4, 3],
                    yAxisID: 'yEnergy'
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 10 }, boxWidth: 12, padding: 10 }
                  },
                  tooltip: {
                    backgroundColor: '#0A0A09',
                    titleFont: { family: 'Georgia, serif', size: 11 },
                    bodyFont: { family: 'Helvetica Neue, Arial, sans-serif', size: 11 },
                    padding: 8
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 },
                      maxRotation: 0,
                      autoSkip: true,
                      maxTicksLimit: 7
                    },
                    grid: { display: false }
                  },
                  ySleep: {
                    type: 'linear',
                    position: 'left',
                    min: 0, max: 5,
                    ticks: { stepSize: 1, font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 } },
                    grid: { color: 'rgba(216,216,208,0.3)' }
                  },
                  yEnergy: {
                    type: 'linear',
                    position: 'right',
                    min: 0, max: 3,
                    ticks: { stepSize: 1, font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 } },
                    grid: { display: false }
                  }
                }
              }
            });
          } catch(_cErr) { /* Chart.js crash silencieux — widget pas cassant */ }
        });

        wrapper.appendChild(trendBox);
      }
    }
  } catch(_tErr) {
    // Widget optionnel — silencieux
  }

  // POLISH 2026-04 (GRAPH CHARGES) : courbes progression charges 30j.
  // Exploite S.muscuProgressionHistory + getStrengthTrend (top 3 compound).
  // Affiché UNIQUEMENT si au moins 1 exo a ≥2 points sur 30j.
  try {
    if (typeof window.getStrengthTrend === 'function') {
      var strengthTrend = window.getStrengthTrend(30);
      if (strengthTrend && strengthTrend.datasets.length > 0) {
        wrapper.appendChild(sectionLabel('Progression charges (30 jours)'));
        var strengthBox = card();

        // Header : delta par exo (Georgia)
        var deltaRow = h('div', { style: 'display:flex;flex-direction:column;gap:6px;margin-bottom:12px;' });
        strengthTrend.datasets.forEach(function(ds, idx) {
          var delta = (ds.lastValue !== null && ds.firstValue !== null) ? (ds.lastValue - ds.firstValue) : null;
          var deltaPct = (delta !== null && ds.firstValue > 0) ? (delta / ds.firstValue) * 100 : null;
          var colorByDelta = (delta === null) ? 'var(--grey,#6B6B65)'
                              : (delta > 0 ? 'var(--green,#1A4A1A)'
                              : (delta < 0 ? 'var(--red,#5A1010)' : 'var(--grey,#6B6B65)'));
          var signTxt = (delta === null) ? '' : (delta > 0 ? '+' : '') + delta.toFixed(1) + ' kg';
          var pctTxt = (deltaPct !== null) ? ' (' + (deltaPct > 0 ? '+' : '') + deltaPct.toFixed(1) + '%)' : '';
          var line = h('div', { 'class': 'sfc-delta-row', style: 'display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--border,#D8D8D0);' });
          line.appendChild(h('span', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, ds.name));
          var right = h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:0.5px;color:' + colorByDelta + ';font-weight:600;' }, signTxt + pctTxt);
          line.appendChild(right);
          deltaRow.appendChild(line);
        });
        strengthBox.appendChild(deltaRow);

        // Canvas Chart.js
        var sChartWrap = h('div', { style: 'position:relative;height:180px;' });
        var sCanvas = document.createElement('canvas');
        sCanvas.id = 'today-strength-trend-chart';
        sCanvas.style.cssText = 'width:100%;height:180px;max-height:180px;';
        sChartWrap.appendChild(sCanvas);
        strengthBox.appendChild(sChartWrap);

        requestAnimationFrame(function() {
          try {
            var sCtx = document.getElementById('today-strength-trend-chart');
            if (!sCtx || typeof window.createChart !== 'function' || typeof Chart === 'undefined') return;
            // Palette sobre cohérente avec le reste
            // FIX CONTRE-AUDIT : pair HEX/RGBA (la tentative précédente de convertir
            // HEX → RGBA via .replace() ne fonctionnait PAS → fill opaque = bordure).
            // Maintenant : valeurs RGBA explicites avec alpha 0.08 (fill discret).
            var palette = [
              { border: '#1A4A1A', bg: 'rgba(26, 74, 26, 0.08)' },   // vert sombre
              { border: '#6A4A1A', bg: 'rgba(106, 74, 26, 0.08)' },  // orange profond
              { border: '#5A3A7A', bg: 'rgba(90, 58, 122, 0.08)' }   // violet
            ];
            var shortLabels = strengthTrend.labels.map(function(iso) {
              var parts = iso.split('-');
              return parts.length === 3 ? parts[2] + '/' + parts[1] : iso;
            });
            window.createChart(sCtx, {
              type: 'line',
              data: {
                labels: shortLabels,
                datasets: strengthTrend.datasets.map(function(ds, i) {
                  var color = palette[i % palette.length];
                  return {
                    label: ds.name + ' (kg)',
                    data: ds.data,
                    borderColor: color.border,
                    backgroundColor: color.bg,
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    spanGaps: true
                  };
                })
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 10 }, boxWidth: 12, padding: 10 }
                  },
                  tooltip: {
                    backgroundColor: '#0A0A09',
                    titleFont: { family: 'Georgia, serif', size: 11 },
                    bodyFont: { family: 'Helvetica Neue, Arial, sans-serif', size: 11 },
                    padding: 8,
                    callbacks: {
                      label: function(ctx) {
                        var v = ctx.parsed.y;
                        return ctx.dataset.label + ' : ' + (v === null ? '—' : v.toFixed(1) + ' kg');
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 },
                      maxRotation: 0, autoSkip: true, maxTicksLimit: 7
                    },
                    grid: { display: false }
                  },
                  y: {
                    ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 } },
                    grid: { color: 'rgba(216,216,208,0.3)' },
                    title: {
                      display: true,
                      text: 'kg',
                      font: { family: 'Georgia, serif', size: 10 }
                    }
                  }
                }
              }
            });
          } catch(_scErr) { /* silencieux */ }
        });

        wrapper.appendChild(strengthBox);
      }
    }
  } catch(_stErr) {
    // Widget optionnel — silencieux
  }

  // POLISH 2026-04 (RECORDS) : meilleurs résultats historiques de l'user.
  // Exploite window.getPersonalRecords() qui agrège charges max, poids milestone,
  // séance plus longue, streak max. Affiché uniquement si ≥1 record collecté.
  try {
    if (typeof window.getPersonalRecords === 'function') {
      var records = window.getPersonalRecords();
      if (records) {
        wrapper.appendChild(sectionLabel('Records personnels'));
        var recordsBox = card();

        // Helper : ligne record (label gauche, valeur droite)
        function recordLine(label, value, detail) {
          var row = h('div', { 'class': 'sfc-record-row', style: 'display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border,#D8D8D0);' });
          var left = h('div', { style: 'flex:1;min-width:0;' });
          left.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, label));
          if (detail) {
            left.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:4px;letter-spacing:0.3px;line-height:1.4;' }, detail));
          }
          var right = h('div', { style: 'font-family:Georgia,serif;font-size:17px;color:var(--black,#0A0A09);font-weight:normal;white-space:nowrap;' }, value);
          row.appendChild(left);
          row.appendChild(right);
          return row;
        }

        // Helper : formater date ISO en "jj/mm/aaaa".
        // FIX CONTRE-AUDIT : slice(0,10) AVANT split pour éviter la corruption
        // si on reçoit un timestamp ISO complet "2026-04-15T14:30:00Z"
        // (sinon parts[2] = '15T14:30:00Z' → affichage cassé).
        function fmtDate(iso) {
          if (!iso) return '';
          var shortIso = String(iso).slice(0, 10);
          var parts = shortIso.split('-');
          if (parts.length !== 3) return String(iso).slice(0, 30);
          return parts[2] + '/' + parts[1] + '/' + parts[0];
        }

        var hasContent = false;

        // 1) Charges max (top 3)
        if (Array.isArray(records.maxLifts) && records.maxLifts.length > 0) {
          records.maxLifts.forEach(function(lift) {
            var valueStr = lift.weight + ' kg';
            var detailParts = [];
            if (lift.reps) detailParts.push(lift.reps + ' reps');
            if (lift.oneRepMax) detailParts.push('1RM ≈ ' + lift.oneRepMax + ' kg');
            if (lift.date) detailParts.push(fmtDate(lift.date));
            recordsBox.appendChild(recordLine(lift.exercise, valueStr, detailParts.join(' · ')));
            hasContent = true;
          });
        }

        // 2) Poids milestone ou range
        if (records.weightMilestone) {
          var wm = records.weightMilestone;
          recordsBox.appendChild(recordLine(
            wm.goalLabel,
            wm.weight + ' kg',
            wm.date ? fmtDate(wm.date) : null
          ));
          hasContent = true;
        } else if (records.weightRange) {
          var wr = records.weightRange;
          recordsBox.appendChild(recordLine(
            'Plage de poids',
            wr.min + '–' + wr.max + ' kg',
            null
          ));
          hasContent = true;
        }

        // 3) Séance la plus longue
        if (records.longestSession) {
          var ls = records.longestSession;
          var lsDetail = [];
          if (ls.kcalTotal) lsDetail.push(ls.kcalTotal + ' kcal brûlées');
          if (ls.date) lsDetail.push(fmtDate(ls.date));
          recordsBox.appendChild(recordLine(
            'Séance la plus longue',
            ls.duration + ' min',
            lsDetail.join(' · ')
          ));
          hasContent = true;
        }

        // 4) Streak max
        if (typeof records.maxStreak === 'number' && records.maxStreak > 0) {
          recordsBox.appendChild(recordLine(
            'Plus longue série',
            records.maxStreak + ' jour' + (records.maxStreak > 1 ? 's' : ''),
            'Jours consécutifs'
          ));
          hasContent = true;
        }

        // Retirer le border-bottom du dernier élément pour finition propre
        if (hasContent) {
          var allRows = recordsBox.querySelectorAll('div > div[style*="border-bottom"]');
          if (allRows.length) allRows[allRows.length - 1].style.borderBottom = 'none';
        }

        // Safety : si finalement rien affiché, ne pas ajouter de card vide
        if (hasContent) {
          wrapper.appendChild(recordsBox);
        }
      }
    }
  } catch(_rErr) {
    // Widget optionnel — silencieux
  }

  // POLISH 2026-04 (GRAPH NUTRITION) : courbes calories + protéines 30j.
  // Exploite mtd_food_journal_<uid> via window.getNutritionTrend.
  // Affiché uniquement si ≥3 jours loggés (cohérence avec graphe sommeil).
  try {
    if (typeof window.getNutritionTrend === 'function') {
      var nutTrend = window.getNutritionTrend(30);
      if (nutTrend && nutTrend.loggedDays >= 3) {
        wrapper.appendChild(sectionLabel('Nutrition (30 jours)'));
        var nutBox = card();

        // Stats header : moyenne kcal + adhérence cible
        var kcalVals = nutTrend.kcal.filter(function(v) { return typeof v === 'number'; });
        var kcalAvg = kcalVals.length ? (kcalVals.reduce(function(a,b){return a+b;},0) / kcalVals.length) : null;
        var adherencePct = null;
        if (kcalAvg !== null && nutTrend.targets && nutTrend.targets.kcal > 0) {
          adherencePct = Math.round((kcalAvg / nutTrend.targets.kcal) * 100);
        }
        var pVals = nutTrend.protein.filter(function(v) { return typeof v === 'number'; });
        var pAvg = pVals.length ? Math.round(pVals.reduce(function(a,b){return a+b;},0) / pVals.length) : null;

        var nStatsRow = h('div', { style: 'display:flex;gap:8px;margin-bottom:12px;' });
        function nutStat(value, label) {
          var box = h('div', { 'class': 'sfc-stat-box', style: 'flex:1;text-align:center;padding:10px 8px;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);border-radius:2px;' });
          box.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:17px;color:var(--black,#0A0A09);' }, value));
          box.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:2px;' }, label));
          return box;
        }
        nStatsRow.appendChild(nutStat(
          kcalAvg !== null ? Math.round(kcalAvg).toLocaleString('fr-FR') : '—',
          'Kcal moy.'
        ));
        nStatsRow.appendChild(nutStat(
          pAvg !== null ? pAvg + ' g' : '—',
          'Protéines moy.'
        ));
        nStatsRow.appendChild(nutStat(
          adherencePct !== null ? adherencePct + '%' : '—',
          'Adhérence cible'
        ));
        nStatsRow.appendChild(nutStat(
          nutTrend.loggedDays + '/30',
          'Jours loggés'
        ));
        nutBox.appendChild(nStatsRow);

        // Canvas Chart.js
        var nChartWrap = h('div', { style: 'position:relative;height:180px;' });
        var nCanvas = document.createElement('canvas');
        nCanvas.id = 'today-nutrition-trend-chart';
        nCanvas.style.cssText = 'width:100%;height:180px;max-height:180px;';
        nChartWrap.appendChild(nCanvas);
        nutBox.appendChild(nChartWrap);

        requestAnimationFrame(function() {
          try {
            var nCtx = document.getElementById('today-nutrition-trend-chart');
            if (!nCtx || typeof window.createChart !== 'function' || typeof Chart === 'undefined') return;
            var shortLabels = nutTrend.labels.map(function(iso) {
              var parts = iso.split('-');
              return parts.length === 3 ? parts[2] + '/' + parts[1] : iso;
            });
            var datasets = [
              {
                label: 'Calories (kcal)',
                data: nutTrend.kcal,
                borderColor: '#1A4A1A',
                backgroundColor: 'rgba(26, 74, 26, 0.08)',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 4,
                spanGaps: true,
                yAxisID: 'yKcal'
              },
              {
                label: 'Protéines (g)',
                data: nutTrend.protein,
                borderColor: '#6A4A1A',
                backgroundColor: 'rgba(106, 74, 26, 0.06)',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 4,
                spanGaps: true,
                borderDash: [4, 3],
                yAxisID: 'yProtein'
              }
            ];
            // Ligne pointillée de cible kcal si dispo
            if (nutTrend.targets && nutTrend.targets.kcal > 0) {
              datasets.push({
                label: 'Cible kcal',
                data: nutTrend.labels.map(function() { return nutTrend.targets.kcal; }),
                borderColor: 'rgba(10,10,9,0.35)',
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderDash: [2, 4],
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0,
                yAxisID: 'yKcal'
              });
            }
            window.createChart(nCtx, {
              type: 'line',
              data: { labels: shortLabels, datasets: datasets },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 10 }, boxWidth: 12, padding: 10 }
                  },
                  tooltip: {
                    backgroundColor: '#0A0A09',
                    titleFont: { family: 'Georgia, serif', size: 11 },
                    bodyFont: { family: 'Helvetica Neue, Arial, sans-serif', size: 11 },
                    padding: 8
                  }
                },
                scales: {
                  x: {
                    ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
                    grid: { display: false }
                  },
                  yKcal: {
                    type: 'linear', position: 'left',
                    beginAtZero: false,
                    ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 } },
                    grid: { color: 'rgba(216,216,208,0.3)' },
                    title: { display: true, text: 'kcal', font: { family: 'Georgia, serif', size: 10 } }
                  },
                  yProtein: {
                    type: 'linear', position: 'right',
                    beginAtZero: true,
                    ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 } },
                    grid: { display: false },
                    title: { display: true, text: 'g', font: { family: 'Georgia, serif', size: 10 } }
                  }
                }
              }
            });
          } catch(_ncErr) { /* silencieux */ }
        });

        wrapper.appendChild(nutBox);
      }
    }
  } catch(_nErr) {
    // Widget optionnel — silencieux
  }

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

  // POLISH 2026-04 — boutons "Mes données" unifiés (audit designer luxe).
  // Primary : PDF + Export (actions principales)
  // Outline : Import (secondaire)
  // Danger : Delete (rouge, border rouge)
  var pdfBtn = h('button', {
    'class': 'sfc-data-btn sfc-data-btn-primary',
    onclick: function() {
      if (typeof window.exportWeeklyReportPDF === 'function') {
        window.exportWeeklyReportPDF();
      } else {
        alert('Export PDF indisponible. Rechargez la page.');
      }
    }
  }, '\u2193 Télécharger mon rapport PDF');
  dataBtns.appendChild(pdfBtn);

  var exportBtn = h('button', {
    'class': 'sfc-data-btn sfc-data-btn-primary',
    onclick: function() { todayExportAllData(); }
  }, '\u2B07 Exporter mes données');
  dataBtns.appendChild(exportBtn);

  var importBtn = h('button', {
    'class': 'sfc-data-btn sfc-data-btn-outline',
    onclick: function() { todayImportData(); }
  }, '\u2B06 Importer une sauvegarde');
  dataBtns.appendChild(importBtn);

  var deleteBtn = h('button', {
    'class': 'sfc-data-btn sfc-data-btn-danger',
    onclick: function() { todayDeleteAllData(); }
  }, 'Supprimer toutes mes données');
  dataBtns.appendChild(deleteBtn);

  dataCard.appendChild(dataBtns);
  wrapper.appendChild(dataCard);

  // POLISH 2026-04 (NOTIFS) : toggle rappels push PWA
  if ('Notification' in window) {
    wrapper.appendChild(sectionLabel('Rappels & notifications'));
    var notifsCard = card();
    var currentEnabled = (typeof S.pushNotifsEnabled === 'boolean') ? S.pushNotifsEnabled : true;
    var permState = (typeof Notification !== 'undefined') ? Notification.permission : 'unknown';

    // Ligne 1 : toggle principal
    var toggleRow = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:6px 0;' });
    var toggleLabel = h('div');
    toggleLabel.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, 'Activer les rappels'));
    toggleLabel.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:3px;line-height:1.4;' }, 'Motivation quotidienne, repas, relance après inactivité'));
    toggleRow.appendChild(toggleLabel);

    // Switch visuel (track + thumb)
    var switchTrack = h('div', {
      style: 'position:relative;width:48px;height:28px;background:' + (currentEnabled ? 'var(--black,#0A0A09)' : 'var(--border,#D8D8D0)') + ';border-radius:14px;cursor:pointer;transition:background 0.2s ease;flex-shrink:0;',
      onclick: function() {
        var newState = !S.pushNotifsEnabled && S.pushNotifsEnabled !== false ? false : !S.pushNotifsEnabled;
        // Si jamais défini, on le set selon toggle → de true défaut à false (désactivation)
        if (typeof S.pushNotifsEnabled !== 'boolean') {
          S.pushNotifsEnabled = false; // user toggle off depuis état par défaut activé
        } else {
          S.pushNotifsEnabled = !S.pushNotifsEnabled;
        }
        if (window.saveProfile) try { window.saveProfile(); } catch(e) {}
        try {
          if (S.pushNotifsEnabled && window.SFCPushManager) window.SFCPushManager.enable();
          else if (!S.pushNotifsEnabled && window.SFCPushManager) window.SFCPushManager.disable();
        } catch(_ex) {}
        if (window.render) window.render();
      }
    });
    var switchThumb = h('div', {
      style: 'position:absolute;top:2px;left:' + (currentEnabled ? '22px' : '2px') + ';width:24px;height:24px;background:var(--ivory,#FAF9F6);border-radius:50%;box-shadow:0 1px 3px rgba(10,10,9,0.2);transition:left 0.22s cubic-bezier(0.4, 0, 0.2, 1);'
    });
    switchTrack.appendChild(switchThumb);
    toggleRow.appendChild(switchTrack);
    notifsCard.appendChild(toggleRow);

    // Ligne 2 : état permission (info)
    if (currentEnabled) {
      var stateText = '';
      var stateColor = 'var(--grey,#6B6B65)';
      if (permState === 'granted') { stateText = 'Permission accordée ✓'; stateColor = 'var(--green,#1A4A1A)'; }
      else if (permState === 'denied') { stateText = 'Permission refusée — autoriser dans les paramètres du navigateur'; stateColor = 'var(--red,#5A1010)'; }
      else { stateText = 'Permission non demandée — demande apparaîtra au prochain usage'; }
      notifsCard.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + stateColor + ';margin-top:10px;padding-top:10px;border-top:1px solid var(--border,#D8D8D0);letter-spacing:0.3px;' }, stateText));
    }

    wrapper.appendChild(notifsCard);
  }
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
  // FIX FAIL-2 audit dashboard 2026-04-15 : plancher médicalement responsable
  // (avant : 1200 kcal pour homme 70kg = irresponsable, peut induire carences).
  // OMS / EFSA : minimum sécuritaire 1500 kcal femme, 1800 kcal homme.
  var _S = window.S || {};
  var _minSafe = _S.sex === 'femme' ? 1500 : 1800;
  // Adoucir aussi : pas plus de ±300 kcal/j d'ajustement vs TDEE actuel (anti-yoyo)
  var _maxStep = 300;
  if (Math.abs(kcalAdjust) > _maxStep) kcalAdjust = (kcalAdjust > 0 ? _maxStep : -_maxStep);
  var newTDEE = Math.max(_minSafe, tdee - kcalAdjust);
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

  // FIX FAIL-2 : avertissement explicite si on touche le plancher (perte trop rapide → médecin)
  if (newTDEE === _minSafe && delta < -1.5) {
    c.appendChild(h('p', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--red,#5A1010);margin:8px 0 0;line-height:1.5;' },
      '⚠ Perte rapide détectée. Plancher kcal sécuritaire atteint. Consulte un médecin/diététicien avant de poursuivre.'
    ));
  }

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
  var currentWeight = S.weight || 0;

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

  // Smart Calendar banner — utilisateurs existants avant 11/04/2026
  try {
    var _calBannerDate = S.firstLoginDate || '';
    if (_calBannerDate && _calBannerDate < '2026-04-11' && !S.smartCalendarDismissed && S.appMode && S.appMode !== 'nutrition' && window.SMART_CALENDAR && window.SMART_CALENDAR.renderBanner) {
      var _calBanner = window.SMART_CALENDAR.renderBanner();
      if (_calBanner) wrapper.appendChild(_calBanner);
    }
  } catch(e) { console.warn('[SmartCalendar banner]', e); }

  // Card 1 — Bonjour
  wrapper.appendChild(renderCardBonjour(S));

  // FIX P1 audit user Thomas (débutant) : carte "Premiers pas" très visible
  // si aucun plan n'existe encore → évite l'effet "page blanche" au 1er lancement.
  // Affiché UNIQUEMENT si utilisateur n'a NI plan nutrition NI plan sport.
  try {
    var _hasNutritionPlan = Array.isArray(S.weekPlan) && S.weekPlan.length >= 7;
    // FIX audit dashboard 2026-04-15 : S.sportProgram est un Array, PAS un objet {week:[]}.
    // Ma version précédente affichait PREMIERS PAS même quand programme sport existait.
    var _hasSportPlan = (Array.isArray(S.sportProgram) && S.sportProgram.length > 0)
                        || (S.muscuIAProgram && Array.isArray(S.muscuIAProgram.weekProgram) && S.muscuIAProgram.weekProgram.length > 0)
                        || (S.activeProgram && Array.isArray(S.activeProgram.weekProgram) && S.activeProgram.weekProgram.length > 0);
    if (!_hasNutritionPlan && !_hasSportPlan) {
      var _firstStepCard = card('border-left:3px solid var(--black,#0A0A09);background:var(--cream,#F5F1E8);');
      _firstStepCard.appendChild(eyebrow('PREMIERS PAS'));
      _firstStepCard.appendChild(h('div', {style:'font-family:Georgia,serif;font-size:20px;margin-bottom:6px;font-weight:normal;'}, 'Bienvenue ' + (S.prenom || 'sur SmartFitCoach') + '.'));
      _firstStepCard.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:14px;'}, 'Pour commencer, génère ton programme personnalisé. On te guide en 2-3 minutes.'));
      var _btnRow = h('div', {style:'display:flex;gap:8px;flex-wrap:wrap;'});
      if (S.appMode !== 'nutrition') {
        _btnRow.appendChild(h('button', {
          style:'padding:12px 20px;background:var(--black,#0A0A09);color:#fff;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;min-height:44px;',
          onclick: function() { S.view = 'sport'; if (window.render) window.render(); }
        }, '→ Créer mon programme sport'));
      }
      if (S.appMode !== 'sport') {
        _btnRow.appendChild(h('button', {
          style:'padding:12px 20px;background:transparent;color:var(--black,#0A0A09);border:1px solid var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;min-height:44px;',
          onclick: function() { S.view = 'nutrition'; if (window.render) window.render(); }
        }, '→ Créer mon plan nutrition'));
      }
      _firstStepCard.appendChild(_btnRow);
      wrapper.appendChild(_firstStepCard);
    }
  } catch(e) { console.warn('[FirstStepCard]', e); }

  // Card 1.5 — HERO KCAL (ring XXL Georgia, COSMÉTIQUE 2026-04)
  // Affiché juste après le Bonjour — info la plus importante en priorité visuelle
  var cardHeroKcal = renderCardHeroKcal();
  if (cardHeroKcal) wrapper.appendChild(cardHeroKcal);

  // Card 1b — Prochain repas (hero, time-aware)
  var cardNextMeal = renderCardNextMeal();
  if (cardNextMeal) wrapper.appendChild(cardNextMeal);

  // Card 1c — Bilan hebdo (dimanche uniquement)
  var cardWeekly = renderCardSundayReview(S);
  if (cardWeekly) wrapper.appendChild(cardWeekly);

  // Card 2 — Séance du jour / Jour de repos
  var cardSport = renderCardSport();
  if (cardSport) wrapper.appendChild(cardSport);

  // Card 3 — Macros du jour (seconde source, détail : macro bars + progress)
  // NOTE : l'info "kcal restantes" est désormais dans le hero ci-dessus.
  //        On garde cette carte pour le détail (macro bars) uniquement quand
  //        le hero ne couvre pas (ex: legacy users qui n'ont pas encore vu le hero).
  var cardMacros = renderCardMacros(); if (cardMacros && !cardHeroKcal) wrapper.appendChild(cardMacros);

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
// FIX F1 COHÉRENCE PROFIL 2026-04 : exposer getCalorieTarget + getMacroTargets en window
// pour que app-main.js renderProfilePage puisse les utiliser (source unique).
// Avant : ces fonctions étaient dans l'IIFE de today-dashboard.js, inaccessibles depuis
// app-main.js → le profil utilisait calcTarget() brut sans calMultiplier.
window.getCalorieTarget = getCalorieTarget;
window.getMacroTargets = getMacroTargets;
window.getTodayTotals = getTodayTotals;

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
