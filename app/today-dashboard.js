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
// Module-level split label lookup — language-aware, single source of truth.
// Used by renderCardSport and renderSmartFitCoachToday.
function _getSplitLabels() {
  var EN = window.isEnglish && window.isEnglish();
  return {
    fullbody_ab: ['Full Body A','Full Body B'],
    fullbody_3:  ['Full Body A','Full Body B','Full Body C'],
    ppl_3:       ['Push','Pull','Legs'],
    upper_lower: ['Upper A','Lower A','Upper B','Lower B'],
    ppl_plus1:   ['Push','Pull','Legs','Upper'],
    bro_4:  EN ? ['Chest + Triceps','Back + Biceps','Shoulders','Legs'] : ['Pecs + Triceps','Dos + Bicéps','Épaules','Jambes'],
    ppl_5:       ['Push A','Pull A','Legs','Push B','Pull B'],
    bro_5:  EN ? ['Chest','Back','Shoulders','Arms','Legs'] : ['Pecs','Dos','Épaules','Bras','Jambes'],
    ppl_6:       ['Push A','Pull A','Legs A','Push B','Pull B','Legs B']
  };
}

// Returns true when S.sportProgram cannot guarantee correct labels or exercise selection.
function _isLegacySportProgram() {
  var S = window.S;
  if (!S || S.sportType !== 'musculation' || !S._splitChoice) return false;
  if (!Array.isArray(S.sportProgram) || S.sportProgram.length === 0) return false;
  var d = S.sportProgram[0];
  if (!d) return false;
  return typeof d.splitKey === 'undefined' || (d.splitKey && d.splitKey !== S._splitChoice);
}

// ─── QUOTES LOCALES (sport/motivation) ───
var _isEN = window.isEnglish && window.isEnglish();
var TODAY_QUOTES = _isEN ? [
  { text: "Consistency is the key to all transformation.", author: "" },
  { text: "The body knows things the mind refuses to admit.", author: "Paul Valéry" },
  { text: "Discipline is remembering what you really want.", author: "David Campbell" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Gandhi" },
  { text: "Success is the sum of small efforts repeated day after day.", author: "Robert Collier" },
  { text: "Don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
  { text: "Your body can withstand almost anything. It's your mind you have to convince.", author: "" },
  { text: "Fatigue is temporary. The pride of effort lasts forever.", author: "" },
  { text: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary" },
  { text: "Movement is life. Life is movement.", author: "Moshe Feldenkrais" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "" },
  { text: "A champion is someone who gets up when they can't.", author: "Jack Dempsey" },
  { text: "Nobody remembers the training. Everybody remembers the result.", author: "" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
  { text: "The only bad workout is the one that didn't happen.", author: "" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Health is real wealth, not pieces of gold and silver.", author: "Gandhi" },
  { text: "Eat to fuel your ambition, not to quiet your emotions.", author: "" },
  { text: "Your body hears everything your mind says.", author: "" },
  { text: "Consistency beats intensity over the long term.", author: "" },
  { text: "Every session is a conversation with your future self.", author: "" },
  { text: "Great things are never done by impulse, but by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "The body adapts to what you demand of it. Demand greatness.", author: "" },
  { text: "Will can do almost anything.", author: "Honoré de Balzac" },
  { text: "The moment you want to stop is exactly the moment you need to keep going.", author: "" },
  { text: "What doesn't kill you makes you stronger.", author: "Friedrich Nietzsche" },
  { text: "Work hard in silence. Let success make the noise.", author: "" },
  { text: "Muscles don't grow during training. They grow during recovery.", author: "" },
  { text: "Rest is part of training.", author: "" },
  { text: "Nutrition is 80% of the work. Training is 20%.", author: "" },
  { text: "What you eat in private, you wear in public.", author: "" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "Suffering is temporary. Quitting lasts forever.", author: "Lance Armstrong" },
  { text: "Performance is not an accident. It's the result of high commitment.", author: "" },
  { text: "Train your mind as hard as you train your body.", author: "" },
  { text: "Every rep counts. Every meal counts. Every night of sleep counts.", author: "" },
  { text: "Consistency turns the ordinary into the extraordinary.", author: "" },
  { text: "Your body is your most precious instrument. Tune it.", author: "" },
  { text: "A good plan today is better than a perfect plan tomorrow.", author: "George Patton" },
  { text: "You don't have to be extreme. Just consistent.", author: "" },
  { text: "The standard doesn't exist.", author: "SmartFitCoach" },
  { text: "Progress, not perfection.", author: "" },
  { text: "You become what you do regularly.", author: "Aristotle" },
  { text: "The best version of you comes from a thousand small decisions, not one single effort.", author: "" },
  { text: "When you feel like quitting, remember why you started.", author: "" },
  { text: "The true athlete is not the one who wins. It's the one who refuses to stop.", author: "" },
  { text: "Excellence is not an isolated act. It's a habit.", author: "Aristotle" },
  { text: "The difference between the impossible and the possible lies in determination.", author: "Tommy Lasorda" },
  { text: "If it doesn't challenge you, it doesn't change you.", author: "" },
  { text: "Your health is an investment, not an expense.", author: "" },
  { text: "Don't aim to be the best. Aim to be better than yesterday.", author: "" },
  { text: "Time spent taking care of yourself is never time wasted.", author: "" },
  { text: "A body in motion stays in motion. Start.", author: "" },
  { text: "Confidence comes from proof. Prove something to yourself every day.", author: "" },
  { text: "Silent victories are the most beautiful.", author: "" },
  { text: "Every hard session builds a stronger mind.", author: "" },
  { text: "What you do today decides who you'll be tomorrow.", author: "" },
  { text: "Sleep is performance. Recovery is a discipline.", author: "" },
  { text: "Changing your body starts with changing your habits.", author: "" },
  { text: "Nutrition is the invisible architecture of your performance.", author: "" },
  { text: "The body always adapts. Don't give it time to get used to less.", author: "" },
  { text: "Every morning is a new chance to become better.", author: "" },
  { text: "Today's discipline is tomorrow's freedom.", author: "" },
  { text: "Effort without direction is waste. Follow the plan.", author: "" },
  { text: "Habits shape destiny, not intentions.", author: "" },
  { text: "Make your ordinary days extraordinary.", author: "" }
] : [
  { text: "La constance est la clé de toute transformation.", author: "" },
  { text: "Le corps sait des choses que l'esprit refuse d'admettre.", author: "Paul Valéry" },
  { text: "La discipline, c'est se souvenir de ce que l'on veut vraiment.", author: "David Campbell" },
  { text: "La force ne vient pas de la capacité physique. Elle vient d'une volonté indomptable.", author: "Gandhi" },
  { text: "Le succès, c'est la somme de petits efforts répétés jour après jour.", author: "Robert Collier" },
  { text: "N'abandonnez pas. Souffrez maintenant et vivez le reste de votre vie comme un champion.", author: "Muhammad Ali" },
  { text: "Votre corps peut résister à presque tout. C'est votre esprit qu'il faut convaincre.", author: "" },
  { text: "La fatigue est temporaire. La fierté de l'effort dure toujours.", author: "" },
  { text: "Ce n'est pas la montagne que nous conquérons, mais nous-mêmes.", author: "Edmund Hillary" },
  { text: "Le mouvement est la vie. La vie est le mouvement.", author: "Moshe Feldenkrais" },
  { text: "La douleur que vous ressentez aujourd'hui sera la force que vous ressentirez demain.", author: "" },
  { text: "Un champion, c'est quelqu'un qui se relève quand il ne peut plus.", author: "Jack Dempsey" },
  { text: "Personne ne se souvient de l'entraînement. Tout le monde se souvient du résultat.", author: "" },
  { text: "Il n'y a pas de raccourci vers un endroit qui vaut le déplacement.", author: "Beverly Sills" },
  { text: "Le seul mauvais entraînement est celui qui n'a pas eu lieu.", author: "" },
  { text: "Prenez soin de votre corps. C'est le seul endroit où vous devez vivre.", author: "Jim Rohn" },
  { text: "La santé est la vraie richesse, pas les pièces d'or et d'argent.", author: "Gandhi" },
  { text: "Mangez pour nourrir votre ambition, pas pour calmer vos émotions.", author: "" },
  { text: "Votre corps entend tout ce que vous dites à votre esprit.", author: "" },
  { text: "La régularité bat l'intensité sur le long terme.", author: "" },
  { text: "Chaque séance est une conversation avec votre futur vous.", author: "" },
  { text: "Les grandes choses ne sont jamais faites par impulsion, mais par une série de petits gestes réunis.", author: "Vincent van Gogh" },
  { text: "Le corps s'adapte à ce qu'on lui impose. Imposez-lui la grandeur.", author: "" },
  { text: "La volonté peut faire presque tout.", author: "Honoré de Balzac" },
  { text: "Le moment où vous voulez arrêter est exactement le moment où vous devez continuer.", author: "" },
  { text: "Ce qui ne vous tue pas vous rend plus fort.", author: "Friedrich Nietzsche" },
  { text: "Travaillez dur en silence. Laissez le succès faire du bruit.", author: "" },
  { text: "Les muscles ne grandissent pas pendant l'entraînement. Ils grandissent pendant la récupération.", author: "" },
  { text: "Le repos fait partie de l'entraînement.", author: "" },
  { text: "La nutrition, c'est 80% du travail. L'entraînement, c'est 20%.", author: "" },
  { text: "Ce que vous mangez en privé, vous le portez en public.", author: "" },
  { text: "Ne comptez pas les jours. Faites que les jours comptent.", author: "Muhammad Ali" },
  { text: "La souffrance est temporaire. L'abandon est pour toujours.", author: "Lance Armstrong" },
  { text: "La performance n'est pas un accident. C'est le résultat d'un engagement élevé.", author: "" },
  { text: "Entraînez votre esprit aussi dur que vous entraînez votre corps.", author: "" },
  { text: "Chaque répétition compte. Chaque repas compte. Chaque nuit de sommeil compte.", author: "" },
  { text: "La cohérence transforme l'ordinaire en extraordinaire.", author: "" },
  { text: "Votre corps est votre instrument le plus précieux. Accordez-le.", author: "" },
  { text: "Un bon plan aujourd'hui vaut mieux qu'un plan parfait demain.", author: "George Patton" },
  { text: "Vous n'avez pas à être extrême. Juste constant.", author: "" },
  { text: "Le standard n'existe pas.", author: "SmartFitCoach" },
  { text: "Le progrès, pas la perfection.", author: "" },
  { text: "Vous devenez ce que vous faites régulièrement.", author: "Aristote" },
  { text: "La meilleure version de vous vient de mille petites décisions, pas d'un seul effort.", author: "" },
  { text: "Quand tu penses abandonner, rappelle-toi pourquoi tu as commencé.", author: "" },
  { text: "Le vrai athlète n'est pas celui qui gagne. C'est celui qui refuse d'arrêter.", author: "" },
  { text: "L'excellence n'est pas un acte isolé. C'est une habitude.", author: "Aristote" },
  { text: "La différence entre l'impossible et le possible tient à la détermination.", author: "Tommy Lasorda" },
  { text: "Si ça ne vous challenge pas, ça ne vous change pas.", author: "" },
  { text: "Votre santé est un investissement, pas une dépense.", author: "" },
  { text: "Ne cherchez pas à être le meilleur. Cherchez à être meilleur qu'hier.", author: "" },
  { text: "Le temps passé à prendre soin de soi n'est jamais du temps perdu.", author: "" },
  { text: "Un corps en mouvement reste en mouvement. Commencez.", author: "" },
  { text: "La confiance naît de la preuve. Prouvez-vous quelque chose chaque jour.", author: "" },
  { text: "Les victoires silencieuses sont les plus belles.", author: "" },
  { text: "Chaque séance difficile construit un mental plus fort.", author: "" },
  { text: "Ce que vous faites aujourd'hui décide de ce que vous serez demain.", author: "" },
  { text: "Dormir, c'est performer. La récupération est une discipline.", author: "" },
  { text: "Changer son corps commence par changer ses habitudes.", author: "" },
  { text: "La nutrition est l'architecture invisible de votre performance.", author: "" },
  { text: "Le corps s'adapte toujours. Ne lui laissez pas le temps de s'habituer à moins.", author: "" },
  { text: "Chaque matin est une nouvelle chance de devenir meilleur.", author: "" },
  { text: "La discipline d'aujourd'hui est la liberté de demain.", author: "" },
  { text: "L'effort sans direction est du gaspillage. Suivez le plan.", author: "" },
  { text: "Les habitudes forgent le destin, pas les intentions.", author: "" },
  { text: "Faites de vos journées ordinaires des journées extraordinaires.", author: "" }
];

function getDailyCitationObj() {
  var doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var q = TODAY_QUOTES[doy % TODAY_QUOTES.length];
  if (!q) return { text: '', author: '' };
  return { text: typeof q === 'string' ? q : (q.text || ''), author: typeof q === 'object' ? (q.author || '') : '' };
}

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
    // FIX bible Hermès §3.3 : eyebrows 10px / letter-spacing 3px (avant 9/4 → aliasing HiDPI)
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-500,#6B6B65);margin-bottom:8px;font-weight:500;'
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

// Tooltips pour les labels macros (title HTML natif — zero-JS, accessible)
var _mtEN = window.isEnglish && window.isEnglish();
var MACRO_TOOLTIPS = {
  'Prot.':    _mtEN ? 'Protein — muscle building and recovery' : 'Protéines — construction et récupération musculaire',
  'Gluc.':    _mtEN ? 'Carbs — energy for your sessions' : 'Glucides — énergie pour vos séances',
  'Lip.':     _mtEN ? 'Fats — hormones and vitamin absorption' : 'Lipides — hormones et absorption des vitamines',
  'Protéines': _mtEN ? 'Protein — muscle building and recovery' : 'Protéines — construction et récupération musculaire',
  'Glucides': _mtEN ? 'Carbs — energy for your sessions' : 'Glucides — énergie pour vos séances',
  'Lipides':  _mtEN ? 'Fats — hormones and vitamin absorption' : 'Lipides — hormones et absorption des vitamines'
};

function macroRow(label, val, max) {
  var row = h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' });
  var tooltip = MACRO_TOOLTIPS[label] || null;
  var labelEl;
  if (tooltip) {
    labelEl = h('span', {
      title: tooltip,
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);width:68px;flex-shrink:0;border-bottom:1px dotted var(--grey);cursor:help;'
    }, label);
  } else {
    labelEl = h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);width:68px;flex-shrink:0;' }, label);
  }
  row.appendChild(labelEl);
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

// ─── BADGE ICON MAP — Bible Hermès §13.1 : PAS d'emoji. ───
// Remplacé par monogrammes Georgia (initiales typographiques).
// `emoji` conservé pour backward compat mais ignoré côté rendu (voir badgeIcon()).
var _beEN = window.isEnglish && window.isEnglish();
var BADGE_EMOJI = {
  // Onboarding
  'first_login':      { emoji: '\u25CB', label: _beEN ? 'First Step'       : 'Premier Pas',        desc: _beEN ? 'First login'                    : 'Première connexion' },
  'profile_complete': { emoji: '\u25CE', label: _beEN ? 'Complete Profile'  : 'Profil Complet',     desc: _beEN ? 'All info filled in'             : 'Toutes les infos renseignées' },
  'first_plan':       { emoji: '\u25A3', label: _beEN ? 'Planner'           : 'Planificateur',      desc: _beEN ? 'First plan generated'           : 'Premier planning généré' },
  // Streak
  'streak_3':         { emoji: 'III',    label: _beEN ? '3-day streak'      : '3 jours d\'affilée', desc: _beEN ? 'Logged in 3 days in a row'  : 'Connecté 3 jours de suite' },
  'streak_7':         { emoji: 'VII',    label: _beEN ? 'Perfect Week'      : 'Semaine Parfaite',   desc: _beEN ? '7 consecutive days'             : '7 jours consécutifs' },
  'streak_14':        { emoji: 'XIV',    label: _beEN ? 'Two Weeks'         : 'Deux Semaines',      desc: _beEN ? '14 consecutive days'            : '14 jours consécutifs' },
  'streak_30':        { emoji: 'XXX',    label: _beEN ? 'Full Month'        : 'Mois Complet',       desc: _beEN ? '30 consecutive days'            : '30 jours consécutifs' },
  'streak_90':        { emoji: 'XC',     label: _beEN ? 'Transformation'    : 'Transformation',     desc: _beEN ? '90 consecutive days'            : '90 jours consécutifs' },
  // Weight tracking
  'first_weigh':      { emoji: 'W',      label: _beEN ? 'Tracking Started'  : 'Suivi Lancé',        desc: _beEN ? 'First weight recorded'      : 'Premier poids enregistré' },
  'weight_10':        { emoji: 'W\u00b710', label: _beEN ? 'Consistent'    : 'Régulier',        desc: _beEN ? '10 weigh-ins recorded'          : '10 pesées enregistrées' },
  'weight_goal':      { emoji: '\u25CE', label: _beEN ? 'Goal Reached'     : 'Objectif Atteint',   desc: _beEN ? 'Target weight reached.'         : 'Poids objectif atteint.' },
  'first_kg_lost':    { emoji: '-1',     label: _beEN ? 'First Kilo'        : 'Premier Kilo',       desc: _beEN ? 'First kg lost'                  : 'Premier kg perdu' },
  'five_kg':          { emoji: '-5',     label: '-5 kg',                                             desc: _beEN ? '5 kg lost'                      : '5 kg perdus' },
  // Exploration
  'recipes_10':       { emoji: 'R\u00b710', label: _beEN ? 'Curious'       : 'Curieux',         desc: _beEN ? '10 recipes viewed'              : '10 recettes consultées' },
  'recipes_50':       { emoji: 'R\u00b750', label: _beEN ? 'Foodie'        : 'Gastronome',      desc: _beEN ? '50 recipes viewed'              : '50 recettes consultées' },
  'swap_master':      { emoji: '\u21C4', label: 'Swap Master',                                     desc: _beEN ? '20 meals swapped'               : '20 repas échangés' },
  'all_cuisines':     { emoji: 'W',      label: _beEN ? 'World Tour'        : 'Tour du Monde',      desc: _beEN ? 'All cuisines tried'             : 'Toutes les cuisines goûtées' },
  // Sport
  'first_workout':    { emoji: 'S',      label: _beEN ? 'Athlete'           : 'Sportif',            desc: _beEN ? 'First sport program'            : 'Premier programme sport' },
  'exercises_20':     { emoji: 'E\u00b720', label: _beEN ? 'Athlete'       : 'Athlète',         desc: _beEN ? '20 exercises viewed'        : '20 exercices consultés' },
  // Calisthenics
  'calisth_first_session': { emoji: 'C', label: _beEN ? 'Calisthenist'      : 'Callisthéniste',      desc: _beEN ? 'First calisthenics program'     : 'Premier programme callisthénie' },
  'calisth_week_4':        { emoji: 'IV', label: _beEN ? 'Calisthenics Month' : 'Mois Callisthénie',  desc: _beEN ? '4 weeks completed'          : '4 semaines complétées' },
  'calisth_week_12':       { emoji: 'XII', label: _beEN ? 'Calisth. Quarter' : 'Trimestriel Calisth.', desc: _beEN ? '12 weeks completed'         : '12 semaines complétées' },
  'calisth_first_pullup':  { emoji: 'P', label: _beEN ? 'First Pull-up'     : 'Première Traction',   desc: _beEN ? 'First strict pull-up'       : 'Première traction stricte' },
  'calisth_muscle_up':     { emoji: 'M', label: 'Muscle-Up',                                         desc: _beEN ? 'Strict muscle-up mastered'      : 'Muscle-up strict maîtrisé' },
  // Muscu
  'bench_100':    { emoji: '100',  label: _beEN ? 'Centenarian'   : 'Centenaire',     desc: _beEN ? 'Bench press: 100 kg'                : 'Développé couché : 100 kg' },
  'bench_120':    { emoji: '120',  label: 'Power Chest',                               desc: _beEN ? 'Bench press: 120 kg'                : 'Développé couché : 120 kg' },
  'squat_100':    { emoji: 'S100', label: _beEN ? 'Squatter'      : 'Squatteur',       desc: 'Squat : 100 kg' },
  'squat_140':    { emoji: 'S140', label: _beEN ? 'Iron Legs'     : 'Jambes de Fer',   desc: 'Squat : 140 kg' },
  'deadlift_100': { emoji: 'D100', label: _beEN ? 'Ground Breaker': 'Terrasseur',      desc: _beEN ? 'Deadlift: 100 kg'                   : 'Soulevé de terre : 100 kg' },
  'deadlift_160': { emoji: 'D160', label: _beEN ? 'Raw Force'     : 'Force Brute',     desc: _beEN ? 'Deadlift: 160 kg'                   : 'Soulevé de terre : 160 kg' },
  'overhead_70':  { emoji: 'OHP',  label: _beEN ? 'Arms High'     : 'Bras au Ciel',    desc: _beEN ? 'Overhead press: 70 kg'              : 'Développé militaire : 70 kg' },
  'total_300':    { emoji: '300',  label: 'Powerlifter',                                desc: _beEN ? 'Total bench+squat+dl ≥ 300 kg'  : 'Total bench+squat+dl ≥ 300 kg' },
  'total_400':    { emoji: '400',  label: 'Elite Force',                                desc: _beEN ? 'Total bench+squat+dl ≥ 400 kg'  : 'Total bench+squat+dl ≥ 400 kg' },
  'muscu_sessions_10': { emoji: 'X',  label: _beEN ? 'Iron Regularity' : 'Régularité Fer', desc: _beEN ? '10 strength sessions'     : '10 séances muscu' },
  'muscu_sessions_50': { emoji: 'L',  label: _beEN ? 'Dedication'     : 'Dédicace',       desc: _beEN ? '50 strength sessions'           : '50 séances muscu' },
  'first_pr':          { emoji: 'PR', label: _beEN ? 'First PR'       : 'Premier PR',     desc: _beEN ? 'First personal record'            : 'Premier record personnel' },
  // Photos
  'first_photo':  { emoji: '\u25A1', label: 'Selfie',                                  desc: _beEN ? 'First progress photo'               : 'Première photo de progression' },
  'both_photos':  { emoji: '\u25A3', label: _beEN ? 'Full Analysis'  : 'Analyse Complète', desc: _beEN ? 'Front + back photos'        : 'Photos face + dos' },
  // Hyrox
  'hyrox_first_program': { emoji: 'H',   label: 'Hyrox Starter',                       desc: _beEN ? 'First Hyrox program'                : 'Premier programme Hyrox' },
  'hyrox_week_4':        { emoji: 'H4',  label: _beEN ? 'Hyrox Month'  : 'Mois Hyrox',     desc: _beEN ? '4 weeks of prep'              : '4 semaines de préparation' },
  'hyrox_week_12':       { emoji: 'H12', label: _beEN ? 'Full Prep'    : 'Prépa Complète', desc: _beEN ? '12 weeks completed'        : '12 semaines terminées' },
  'hyrox_sub90':         { emoji: '90',  label: 'Sub 1h30',                             desc: _beEN ? 'Sub 1h30 goal reached'              : 'Objectif sub 1h30 atteint' },
  'hyrox_sub60':         { emoji: '60',  label: 'Sub 1h00',                             desc: _beEN ? 'Sub 1h00 goal reached'              : 'Objectif sub 1h00 atteint' },
  'hyrox_pro':           { emoji: 'PRO', label: _beEN ? 'Hyrox Elite'  : 'Élite Hyrox',    desc: _beEN ? 'Pro/Elite level program'       : 'Programme niveau Pro/Élite' }
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
          // FIX Hermès : fallback '★' (étoile unicode safe) au lieu de 🏆 décoratif
          var emoji = (BADGE_EMOJI[badgeId] && BADGE_EMOJI[badgeId].emoji) || defU.emoji || '\u2605';
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
    var _now = new Date(); var today = _now.getFullYear() + '-' + String(_now.getMonth()+1).padStart(2,'0') + '-' + String(_now.getDate()).padStart(2,'0');
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
// Chemin primaire : SFCDecisionCore (symbiose bidirectionnelle training↔nutrition).
// Fallback : getAdaptedMealSplit() + bonus intensité exercices force (comportement précédent).
function getCalorieTarget() {
  if (!window.calcTarget) return 0;
  var t = window.calcTarget();
  if (t <= 0) return 0;

  // ── Chemin primaire : moteur décisionnel central ──────────────────────────
  if (window.SFCDecisionCore) {
    try {
      var _mod = window.SFCDecisionCore.getNutritionModulators();
      if (_mod && typeof _mod.calMultiplier === 'number') {
        return Math.round(t * _mod.calMultiplier);
      }
    } catch(e) {}
  }

  // ── Fallback : getAdaptedMealSplit + bonus composés force ─────────────────
  if (window.getAdaptedMealSplit) {
    var _todayIdxCal = (new Date().getDay() + 6) % 7;
    try {
      var _splitCal = window.getAdaptedMealSplit(_todayIdxCal);
      if (_splitCal && typeof _splitCal.calMultiplier === 'number') {
        var _intensityBonus = 1.0;
        try {
          var _Sp = window.S && window.S.sportProgram;
          var _todayDayObj = null;
          if (Array.isArray(_Sp) && _Sp.length > 0) {
            var _sdIdx = window.S.selectedSportDay;
            _todayDayObj = (_sdIdx != null && _Sp[_sdIdx]) ? _Sp[_sdIdx] : _Sp[0];
          }
          if (_todayDayObj && Array.isArray(_todayDayObj.exercises)) {
            var _t0 = _todayDayObj.exercises.filter(function(ex) {
              var _tg = ex.tags || [];
              return _tg.indexOf('compose') !== -1 &&
                (_tg.indexOf('force') !== -1 || _tg.indexOf('powerlifting') !== -1);
            }).length;
            if (_t0 >= 2) _intensityBonus = 1.10;
            else if (_t0 === 1) _intensityBonus = 1.05;
          }
        } catch(e2) {}
        return Math.round(t * _splitCal.calMultiplier * _intensityBonus);
      }
    } catch(e) {}
  }

  return t;
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

  // FIX DASHBOARD IA 2026-04 : si programme IA muscu existe MAIS sportProgram local aussi,
  // utiliser le sportProgram pour l'aperçu exercices (premier 3 exos visibles sur dashboard).
  // Ancien code retournait exercises:[] → dashboard montrait "Programme sur mesure" sans détail.
  // Désormais : si sportProgram a des exercices, l'utiliser pour l'aperçu même sans validation.
  // La validation reste requise pour les actions (démarrer séance, etc.), pas pour l'affichage.
  if (S.sportType === 'musculation' && typeof S.muscuIAProgram === 'string' && S.muscuIAProgram.length > 100) {
    var _hasLocalProg = Array.isArray(S.sportProgram) && S.sportProgram.length > 0;
    if (!_hasLocalProg) {
      // Aucun programme local : afficher nom générique sans exercices (comportement précédent)
      return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'Custom program' : 'Programme sur mesure'), exercises: [] }, kind: 'ia' };
    }
    // Programme local disponible → utiliser pour l'aperçu (fall through au code normal)
  }

  // FIX 2026-04-16 : CrossFit WOD du jour — les WODs sont dans CF_WODS_FULL (global),
  // pas dans S.sportProgram. On retourne le WOD courant pour l'afficher sur le dashboard.
  if (S.sportType === 'crossfit') {
    var cfDay = S.cfCurrentDay || 1;
    var allWods = window.CF_WODS_FULL || window.CF_WODS || [];
    var todayWod = null;
    for (var wi = 0; wi < allWods.length; wi++) {
      if (allWods[wi] && allWods[wi].day === cfDay) { todayWod = allWods[wi]; break; }
    }
    if (todayWod) {
      // Build exercises list from WOD movements for the card preview
      var cfExercises = [];
      if (todayWod.wod && Array.isArray(todayWod.wod.movements)) {
        todayWod.wod.movements.forEach(function(m) {
          cfExercises.push({ n: m.name || '', sets: '', reps: m.reps || '' });
        });
      }
      return {
        index: cfDay - 1,
        day: {
          name: (todayWod.name || 'WOD') + (todayWod.theme ? ' — ' + todayWod.theme : ''),
          exercises: cfExercises
        },
        kind: 'crossfit',
        wod: todayWod
      };
    }
    // CF user but WODs not loaded yet — return placeholder
    return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'CrossFit — Day ' : 'CrossFit — Jour ') + cfDay, exercises: [] }, kind: 'crossfit' };
  }

  // FIX D1 COHÉRENCE MULTI-SPORTS 2026-04 : dispatcher par sportType
  // Chaque sport retourne la séance du jour avec ses données réelles
  // (description pour les endurance, exercices pour les skills).
  var todayIdx = (new Date().getDay() + 6) % 7;

  // ── RUNNING ──
  if (S.sportType === 'running') {
    try {
      var _rProg = S.runningProgram;
      if (Array.isArray(_rProg) && _rProg.length > 0) {
        var _rWeekIdx = Math.max(0, Math.min((S.runningWeek || 1) - 1, _rProg.length - 1));
        var _rWeek = _rProg[_rWeekIdx];
        if (_rWeek && Array.isArray(_rWeek.sessions) && _rWeek.sessions.length > 0) {
          var _rDayIdx = Math.max(0, Math.min(S.selectedRunDay || 0, _rWeek.sessions.length - 1));
          var _rSess = _rWeek.sessions[_rDayIdx];
          return {
            index: _rDayIdx,
            day: {
              name: (_rSess.name || 'Running') + (_rSess.zone ? ' — ' + _rSess.zone : ''),
              exercises: [],
              _desc: _rSess.desc || '',
              _distance: _rSess.distance || '',
              _phase: _rWeek.phase || ''
            },
            kind: 'running',
            _weekLabel: 'Semaine ' + (S.runningWeek || 1) + ' / ' + _rProg.length
          };
        }
        return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'Running — Week ' : 'Running — Semaine ') + (S.runningWeek || 1), exercises: [] }, kind: 'running' };
      }
    } catch(_eRun) {}
  }

  // ── HYROX ──
  if (S.sportType === 'hyrox') {
    try {
      var _hProg = S.hyroxProgram;
      if (Array.isArray(_hProg) && _hProg.length > 0) {
        var _hWeekIdx = Math.max(0, Math.min((S.hyroxWeek || 1) - 1, _hProg.length - 1));
        var _hWeek = _hProg[_hWeekIdx];
        if (_hWeek && Array.isArray(_hWeek.sessions) && _hWeek.sessions.length > 0) {
          var _hDayIdx = Math.max(0, Math.min(S.selectedHyroxDay || 0, _hWeek.sessions.length - 1));
          var _hSess = _hWeek.sessions[_hDayIdx];
          var _hExos = [];
          if (Array.isArray(_hSess.exercises)) {
            _hSess.exercises.slice(0, 5).forEach(function(ex) {
              _hExos.push({ n: ex.name || '', sets: '', reps: ex.detail || '' });
            });
          }
          return {
            index: _hDayIdx,
            day: {
              name: _hSess.name || ('Hyrox — ' + (window.isEnglish && window.isEnglish() ? 'Day ' : 'Jour ') + (_hDayIdx + 1)),
              exercises: _hExos,
              _focus: _hSess.focus || ''
            },
            kind: 'hyrox',
            _weekLabel: 'Semaine ' + (S.hyroxWeek || 1) + ' / ' + _hProg.length
          };
        }
        return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'Hyrox — Week ' : 'Hyrox — Semaine ') + (S.hyroxWeek || 1), exercises: [] }, kind: 'hyrox' };
      }
    } catch(_eHyrox) {}
  }

  // ── TRIATHLON ──
  if (S.sportType === 'triathlon') {
    try {
      var _tProg = S.triathlonProgram;
      if (Array.isArray(_tProg) && _tProg.length > 0) {
        var _tWeekIdx = Math.max(0, Math.min((S.triathlonWeek || 1) - 1, _tProg.length - 1));
        var _tWeek = _tProg[_tWeekIdx];
        if (_tWeek && Array.isArray(_tWeek.sessions) && _tWeek.sessions.length > 0) {
          var _tDayIdx = Math.max(0, Math.min(S.selectedTriDay || 0, _tWeek.sessions.length - 1));
          var _tSess = _tWeek.sessions[_tDayIdx];
          var _dtEN = window.isEnglish && window.isEnglish();
          var _discLabel = { swim: _dtEN ? 'Swimming' : 'Natation', bike: _dtEN ? 'Cycling' : 'Vélo', run: _dtEN ? 'Running' : 'Course', brick: 'Brick', rest: _dtEN ? 'Rest' : 'Repos' };
          return {
            index: _tDayIdx,
            day: {
              name: (_tSess.name || 'Triathlon') + (_tSess.discipline ? ' — ' + (_discLabel[_tSess.discipline] || _tSess.discipline) : ''),
              exercises: [],
              _desc: _tSess.desc || '',
              _duration: _tSess.duration || '',
              _discipline: _tSess.discipline || ''
            },
            kind: 'triathlon',
            _weekLabel: (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + (S.triathlonWeek || 1) + ' / ' + _tProg.length
          };
        }
        return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'Triathlon — Week ' : 'Triathlon — Semaine ') + (S.triathlonWeek || 1), exercises: [] }, kind: 'triathlon' };
      }
    } catch(_eTri) {}
  }

  // ── CYCLING ──
  if (S.sportType === 'cycling') {
    try {
      var _cProg = S.cyclingProgram;
      if (Array.isArray(_cProg) && _cProg.length > 0) {
        var _cWeekIdx = Math.max(0, Math.min((S.cyclingWeek || 1) - 1, _cProg.length - 1));
        var _cWeek = _cProg[_cWeekIdx];
        if (_cWeek && Array.isArray(_cWeek.sessions) && _cWeek.sessions.length > 0) {
          var _cDayIdx = Math.max(0, Math.min(S.selectedCyclingDay || 0, _cWeek.sessions.length - 1));
          var _cSess = _cWeek.sessions[_cDayIdx];
          var _zoneStr = Array.isArray(_cSess.zone) ? 'Z' + _cSess.zone.join('-Z') : (_cSess.zone ? 'Z' + _cSess.zone : '');
          return {
            index: _cDayIdx,
            day: {
              name: (_cSess.type || 'Cycling') + (_zoneStr ? ' — ' + _zoneStr : ''),
              exercises: [],
              _desc: _cSess.desc || '',
              _duration: _cSess.duration ? _cSess.duration + ' min' : ''
            },
            kind: 'cycling',
            _weekLabel: (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + (S.cyclingWeek || 1) + ' / ' + _cProg.length
          };
        }
        return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'Cycling — Week ' : 'Cycling — Semaine ') + (S.cyclingWeek || 1), exercises: [] }, kind: 'cycling' };
      }
    } catch(_eCyc) {}
  }

  // ── PADEL ──
  if (S.sportType === 'padel') {
    try {
      var _pProg = S.padelProgram;
      if (Array.isArray(_pProg) && _pProg.length > 0) {
        var _pWeekIdx = Math.max(0, Math.min((S.padelWeek || 1) - 1, _pProg.length - 1));
        var _pWeek = _pProg[_pWeekIdx];
        if (_pWeek && Array.isArray(_pWeek.sessions) && _pWeek.sessions.length > 0) {
          var _pDayIdx = Math.max(0, Math.min(S.selectedPadelDay || 0, _pWeek.sessions.length - 1));
          var _pSess = _pWeek.sessions[_pDayIdx];
          var _pExos = [];
          if (Array.isArray(_pSess.exercises)) {
            _pSess.exercises.slice(0, 5).forEach(function(ex) {
              _pExos.push({ n: ex.name || '', sets: '', reps: ex.detail || '' });
            });
          }
          return {
            index: _pDayIdx,
            day: { name: _pSess.name || ((window.isEnglish && window.isEnglish() ? 'Padel — Day ' : 'Padel — Jour ') + (_pDayIdx + 1)), exercises: _pExos },
            kind: 'padel',
            _weekLabel: (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + (S.padelWeek || 1) + ' / ' + _pProg.length
          };
        }
        return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'Padel — Week ' : 'Padel — Semaine ') + (S.padelWeek || 1), exercises: [] }, kind: 'padel' };
      }
    } catch(_ePadel) {}
  }

  // ── GOLF ──
  if (S.sportType === 'golf') {
    try {
      var _gProg = S.golfProgram;
      if (Array.isArray(_gProg) && _gProg.length > 0) {
        var _gWeekIdx = Math.max(0, Math.min((S.golfWeek || 1) - 1, _gProg.length - 1));
        var _gWeek = _gProg[_gWeekIdx];
        if (_gWeek && Array.isArray(_gWeek.sessions) && _gWeek.sessions.length > 0) {
          var _gDayIdx = Math.max(0, Math.min(S.selectedGolfDay || 0, _gWeek.sessions.length - 1));
          var _gSess = _gWeek.sessions[_gDayIdx];
          var _gExos = [];
          if (Array.isArray(_gSess.exercises)) {
            _gSess.exercises.slice(0, 5).forEach(function(ex) {
              _gExos.push({ n: ex.name || '', sets: '', reps: ex.detail || '' });
            });
          }
          return {
            index: _gDayIdx,
            day: { name: _gSess.name || ((window.isEnglish && window.isEnglish() ? 'Golf — Day ' : 'Golf — Jour ') + (_gDayIdx + 1)), exercises: _gExos },
            kind: 'golf',
            _weekLabel: (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + (S.golfWeek || 1) + ' / ' + _gProg.length
          };
        }
        return { index: 0, day: { name: (window.isEnglish && window.isEnglish() ? 'Golf — Week ' : 'Golf — Semaine ') + (S.golfWeek || 1), exercises: [] }, kind: 'golf' };
      }
    } catch(_eGolf) {}
  }

  // ── CALISTHENICS ──
  if (S.sportType === 'calisthenics') {
    try {
      // Calisthenics generates plan on-the-fly; check if config exists
      if (S.calisthenicsLevel && typeof window.generateCalisthenicsPlan === 'function') {
        var _calPlan = window.generateCalisthenicsPlan(
          S.calisthenicsLevel,
          Array.isArray(S.calisthenicsGoal) ? S.calisthenicsGoal : [],
          parseInt(S.calisthPullups) || 0,
          parseInt(S.calisthPushups) || 0,
          parseInt(S.calisthenicsdays) || 3,
          Array.isArray(S.calisthenicsEquipment) ? S.calisthenicsEquipment : ['bar'],
          parseInt(S.calisthDips) || 0
        );
        if (_calPlan && Array.isArray(_calPlan.plan) && _calPlan.plan.length > 0) {
          var _calWeekIdx = Math.max(0, Math.min((S.calisthCurrentWeek || 1) - 1, _calPlan.plan.length - 1));
          var _calWeekData = _calPlan.plan[_calWeekIdx];
          var _calDayIdx = S.selectedCalisthDay || 0;
          var _calSessData = null;
          // plan[w].sessions = array of sessions (one per training day)
          if (_calWeekData && Array.isArray(_calWeekData.sessions) && _calWeekData.sessions.length > 0) {
            _calDayIdx = Math.min(_calDayIdx, _calWeekData.sessions.length - 1);
            _calSessData = _calWeekData.sessions[_calDayIdx];
          }
          var _calExos = [];
          if (_calSessData && Array.isArray(_calSessData.exercises)) {
            _calSessData.exercises.slice(0, 5).forEach(function(ex) {
              _calExos.push({ n: ex.name || '', sets: ex.sets || '', reps: ex.reps || '' });
            });
          }
          return {
            index: _calDayIdx,
            day: {
              name: (_calSessData && _calSessData.name) ? _calSessData.name : ('Calisthenics — ' + (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + (S.calisthCurrentWeek || 1)),
              exercises: _calExos
            },
            kind: 'calisthenics',
            _weekLabel: 'Semaine ' + (S.calisthCurrentWeek || 1) + ' / ' + _calPlan.totalWeeks
          };
        }
      }
      // Fallback: config exists but generator not loaded
      if (S.calisthenicsLevel) {
        return { index: 0, day: { name: 'Calisthenics — ' + (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + (S.calisthCurrentWeek || 1), exercises: [] }, kind: 'calisthenics' };
      }
    } catch(_eCal) {}
  }

  // ── YOGA ──
  if (S.sportType === 'yoga') {
    try {
      if (S.yogaLevel) {
        var _yWeekIdx = Math.max(0, Math.min((S.yogaWeek || 1) - 1, 3));
        var _yDayIdx = Math.max(0, Math.min(S.yogaDay || 0, (S.yogaDays || 3) - 1));
        var _yPhase = '';
        // YOGA_WEEKS is local to app-sport.js, we read the phase from a simple lookup
        var _YOGA_PHASES = (window.isEnglish && window.isEnglish()) ? ['Foundations', 'Balance & Strength', 'Hip Opening & Twists', 'Backbends & Inversions'] : ['Fondations', '\u00c9quilibre et Force', 'Ouverture des Hanches & Torsions', 'Backbends & Inversions'];
        _yPhase = _YOGA_PHASES[_yWeekIdx] || '';
        return {
          index: _yDayIdx,
          day: {
            name: 'Yoga — ' + _yPhase,
            exercises: [],
            _desc: (S.yogaDuration || '') + (S.yogaStyle ? ' \u00b7 ' + S.yogaStyle : '')
          },
          kind: 'yoga',
          _weekLabel: 'Semaine ' + (S.yogaWeek || 1) + ' / 4'
        };
      }
    } catch(_eYoga) {}
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
    { key: 'breakfast', label: window.t ? window.t('nutrition.meal_breakfast') : ((window.isEnglish && window.isEnglish()) ? 'Breakfast' : 'Petit-déjeuner'), time: mt.breakfast || '08:00' },
    { key: 'lunch',     label: window.t ? window.t('nutrition.meal_lunch')      : ((window.isEnglish && window.isEnglish()) ? 'Lunch' : 'Déjeuner'),       time: mt.lunch     || '12:30' },
    { key: 'snack',     label: window.t ? window.t('nutrition.meal_snack')      : ((window.isEnglish && window.isEnglish()) ? 'Snack' : 'Collation'),      time: mt.snack     || '16:00' },
    { key: 'dinner',    label: window.t ? window.t('nutrition.meal_dinner')     : ((window.isEnglish && window.isEnglish()) ? 'Dinner' : 'Dîner'),         time: mt.dinner    || '19:30' }
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
    c2.appendChild(eyebrow((window.isEnglish && window.isEnglish()) ? 'TOMORROW' : 'DEMAIN'));
    var t2Row = h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;' });
    t2Row.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:18px;' }, (window.isEnglish && window.isEnglish()) ? 'Breakfast' : 'Petit-déjeuner'));
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
  var _tEN = window.isEnglish && window.isEnglish();
  if (minutesUntil <= 0) {
    timeLabel = _tEN ? "now" : "maintenant";
  } else if (minutesUntil < 60) {
    timeLabel = _tEN ? ("in " + minutesUntil + "\u00a0min") : ("dans " + minutesUntil + "\u00a0min");
  } else {
    var h2 = Math.floor(minutesUntil / 60);
    var m2 = minutesUntil % 60;
    timeLabel = _tEN ? ("in " + h2 + "h" + (m2 > 0 ? String(m2).padStart(2, '0') : '')) : ("dans " + h2 + "h" + (m2 > 0 ? String(m2).padStart(2, '0') : ''));
  }

  // COSMÉTIQUE 2026-04 : carte Prochain repas avec chip "dans Xh" premium
  var c = card('border-left:3px solid var(--black,#0A0A09);background:var(--ivory,#FAF9F6);position:relative;');
  // Bible Hermès §13.2 : max 2 eyebrows par écran — titre Georgia suffit.

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
    var detailsEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-300,#A8A8A0);margin-bottom:14px;' });
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
  }, (window.isEnglish && window.isEnglish()) ? 'View meal \u2192' : 'Voir le repas \u2192');
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
    // FIX Hermès : SVG camera monochrome au lieu de 📷 (cohérence avec mic ai-coach).
    var _scanSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    _scanSvg.setAttribute('width', '16'); _scanSvg.setAttribute('height', '16');
    _scanSvg.setAttribute('viewBox', '0 0 24 24'); _scanSvg.setAttribute('fill', 'none');
    _scanSvg.setAttribute('stroke', 'currentColor'); _scanSvg.setAttribute('stroke-width', '1.5');
    _scanSvg.setAttribute('stroke-linecap', 'round'); _scanSvg.setAttribute('stroke-linejoin', 'round');
    _scanSvg.innerHTML = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';
    scanBtn.appendChild(_scanSvg);
    scanBtn.appendChild(h('span', {}, (window.isEnglish && window.isEnglish()) ? 'Scan my meal' : 'Scanner mon repas'));
    c.appendChild(scanBtn);
  }

  return c;
}

// ─── WELCOME BANNER — Bon retour parmi nous ───
function renderWelcomeBanner(S) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  // FIX P0 stability 2026-04-17 : guard typeof user.name avant .split() (crash si name non-string)
  var _userFirst = '';
  if (user && typeof user.name === 'string' && user.name.trim()) {
    var _parts = user.name.trim().split(/\s+/);
    _userFirst = _parts[0] || '';
  }
  var firstName = (window.getDisplayFirstName ? window.getDisplayFirstName() : (S.prenom || _userFirst || ''));

  var _wbEN = window.isEnglish && window.isEnglish();
  var days = _wbEN ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] : ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  var months = _wbEN ? ['January','February','March','April','May','June','July','August','September','October','November','December'] : ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  var now = new Date();
  var dateStr = days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()];

  var banner = h('div', {
    style: 'padding:20px 0;border-bottom:1px solid var(--border);margin-bottom:0;'
  });

  var greeting = h('div', {
    style: 'font-family:Georgia,serif;font-style:italic;font-size:15px;color:var(--grey);line-height:1.5;'
  });
  greeting.textContent = ((window.isEnglish && window.isEnglish()) ? 'Welcome back' : 'Bon retour parmi nous') + (firstName ? ', ' + firstName : '') + ' \u2726';

  var sub = h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:1px;margin-top:4px;opacity:0.75;'
  });
  sub.textContent = dateStr + ' \u00B7 ' + ((window.isEnglish && window.isEnglish()) ? 'Your program is waiting' : 'Votre programme vous attend');

  banner.appendChild(greeting);
  banner.appendChild(sub);
  return banner;
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO CONTEXTUEL HORAIRE — Bible Hermès §1, §7
// ═══════════════════════════════════════════════════════════════════════════
// Remplace renderCardBonjour + renderCardHeroKcal.
// Affiche 3 moments : Matin (6h-11h) / Midi (11h-17h) / Soir (17h-23h).
// Composition typographique (pas de ring statique), 2 chiffres clés max.
// Règle d'or : jamais plus de 3 données chiffrées simultanément.
// ═══════════════════════════════════════════════════════════════════════════
function renderHeroContextuel() {
  var S = window.S;
  if (!S) return null;

  var hour = new Date().getHours();
  var _greetEN = window.isEnglish && window.isEnglish();
  var momentKey, eyebrowWord, helloWord;
  if (hour >= 6 && hour < 11) { momentKey = 'matin'; eyebrowWord = _greetEN ? 'MORNING' : 'MATIN'; helloWord = _greetEN ? 'Good morning' : 'Bonjour'; }
  else if (hour >= 11 && hour < 17) { momentKey = 'midi'; eyebrowWord = _greetEN ? 'MIDDAY' : 'MIDI'; helloWord = null; }
  else if (hour >= 17 && hour < 23) { momentKey = 'soir'; eyebrowWord = _greetEN ? 'EVENING' : 'SOIR'; helloWord = _greetEN ? 'Good evening' : 'Bonsoir'; }
  else { momentKey = 'veille'; eyebrowWord = _greetEN ? 'NIGHT' : 'NUIT'; helloWord = null; }

  var now = new Date();
  var _locale = _greetEN ? 'en-US' : 'fr-FR';
  var dayName = now.toLocaleDateString(_locale, {weekday:'long'}).toUpperCase();
  var dateStr = now.toLocaleDateString(_locale, {weekday:'long', day:'numeric', month:'long'});
  var firstName = (window.getDisplayFirstName ? window.getDisplayFirstName() : (S.prenom || '')) || '';

  // Conteneur hero — full-bleed, alignement gauche, fond paper
  var hero = h('div', {
    style: 'margin:0 -24px;padding:48px 24px 40px;border-bottom:1px solid var(--line,#D8D8D0);background:var(--paper,#FAF9F6);'
  });
  var inner = h('div', { style: 'max-width:560px;margin:0 auto;' });

  // ── Row 1 : eyebrow horodaté ──
  inner.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3.2px;text-transform:uppercase;color:var(--ink-500,#6B6B65);font-weight:500;margin-bottom:24px;'
  }, dayName + ' \u00b7 ' + eyebrowWord));

  // ── Row 2 : hello ──
  if (helloWord || firstName) {
    var helloText = helloWord
      ? (helloWord + (firstName ? ', ' + firstName : '') + '.')
      : (firstName ? firstName + '.' : '');
    inner.appendChild(h('h1', {
      style: 'font-family:Georgia,serif;font-size:30px;font-weight:normal;line-height:1.15;color:var(--ink-900,#0A0A09);margin:0 0 6px;font-feature-settings:"onum" 1,"liga" 1;'
    }, helloText));
  }

  // ── Row 3 : date ──
  inner.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;letter-spacing:0.4px;color:var(--ink-500,#6B6B65);font-weight:300;line-height:1.4;margin-bottom:32px;'
  }, dateStr));

  // ── Row 4 : corps contextuel (quote italic + 2 chiffres) ──
  var context = buildContextualHero(momentKey, S);

  // Phrase italic éditoriale + auteur
  if (context.quote) {
    var _qBlock = h('div', { style: 'margin:0 0 32px;' });
    _qBlock.appendChild(h('p', {
      style: 'font-family:Georgia,serif;' + (context.isDirective ? 'font-style:normal;font-size:14px;' : 'font-style:italic;font-size:15px;') + 'line-height:1.6;color:var(--ink-700,#2B2B27);margin:0;font-weight:normal;'
    }, context.isDirective ? context.quote : ('\u00AB ' + context.quote + ' \u00BB')));
    if (context.quoteAuthor) {
      _qBlock.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink-500,#6B6B65);margin-top:8px;'
      }, '\u2014 ' + context.quoteAuthor));
    }
    inner.appendChild(_qBlock);
  }

  // Re-supervision Hermès v2 : stack VERTICAL, 1 KPI primaire max dans le hero.
  // Le 2e KPI devient un complément discret sur la ligne suivante, jamais accolé.
  // Bible §7 : règle d'or — jamais plus de 3 données chiffrées, mais PAS deux accolées.
  if (context.stats && context.stats.length > 0) {
    var primary = context.stats[0];
    var secondary = context.stats[1];

    var primaryBlock = h('div', { style: 'margin-bottom:' + (secondary ? '24px' : '32px') + ';' });
    primaryBlock.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-size:44px;font-weight:normal;line-height:1.05;letter-spacing:-0.5px;color:' + (primary.highlight ? 'var(--orange,#E86F1E)' : 'var(--ink-900,#0A0A09)') + ';font-feature-settings:"tnum" 1,"onum" 1;margin-bottom:8px;white-space:nowrap;'
    }, String(primary.value)));
    primaryBlock.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:0.3px;color:var(--ink-500,#6B6B65);font-weight:400;line-height:1.5;'
    }, primary.label));
    inner.appendChild(primaryBlock);

    // KPI secondaire : sur ligne dédiée, typographie plus discrète (Georgia 22px au lieu de 44)
    if (secondary) {
      var secBlock = h('div', {
        style: 'display:flex;align-items:baseline;gap:12px;padding-top:20px;border-top:1px solid var(--line,#D8D8D0);margin-bottom:32px;'
      });
      secBlock.appendChild(h('div', {
        style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;line-height:1;color:var(--ink-900,#0A0A09);font-feature-settings:"tnum" 1,"onum" 1;white-space:nowrap;'
      }, String(secondary.value)));
      secBlock.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:0.3px;color:var(--ink-500,#6B6B65);font-weight:400;'
      }, secondary.label));
      inner.appendChild(secBlock);
    }
  }

  // ── Row 4b : mini sparkline poids (SVG inline, pas de Chart.js) ──
  // Audit Hermès : glisser un micro-indicateur de tendance dans le hero
  // pour donner de la profondeur sans quitter la page. Discret, trait 1px.
  try {
    var _wHist = (S.weightHistory || []).filter(function(e) {
      if (!e) return false;
      var w = parseFloat(e.weight || e.w || e);
      return !isNaN(w) && w > 0;
    }).slice(-8);
    if (_wHist.length >= 3) {
      var _wVals = _wHist.map(function(e) { return parseFloat(e.weight || e.w || e); });
      var _wMin = Math.min.apply(null, _wVals);
      var _wMax = Math.max.apply(null, _wVals);
      var _wRange = _wMax - _wMin || 1;
      var _sparkW = 120, _sparkH = 28, _sparkPad = 2;
      var _sparkPts = _wVals.map(function(v, i) {
        var x = _sparkPad + (i / (_wVals.length - 1)) * (_sparkW - 2 * _sparkPad);
        var y = _sparkPad + (1 - (v - _wMin) / _wRange) * (_sparkH - 2 * _sparkPad);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      var _lastW = _wVals[_wVals.length - 1];
      var _firstW = _wVals[0];
      var _wDelta = _lastW - _firstW;
      var _wDeltaLabel = (_wDelta > 0 ? '+' : '') + _wDelta.toFixed(1) + (window.UNITS ? ' ' + window.UNITS.weightLabel() : ' kg');
      var _sparkRow = h('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:28px;padding-top:16px;border-top:1px solid var(--line,#D8D8D0);' });
      var _sparkSvgNs = 'http://www.w3.org/2000/svg';
      var _sparkSvg = document.createElementNS(_sparkSvgNs, 'svg');
      _sparkSvg.setAttribute('width', String(_sparkW)); _sparkSvg.setAttribute('height', String(_sparkH));
      _sparkSvg.setAttribute('viewBox', '0 0 ' + _sparkW + ' ' + _sparkH);
      _sparkSvg.setAttribute('fill', 'none');
      _sparkSvg.innerHTML = '<polyline points="' + _sparkPts + '" stroke="#3E5C3A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      _sparkRow.appendChild(_sparkSvg);
      var _sparkMeta = h('div', {});
      _sparkMeta.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;color:var(--ink-900,#0A0A09);line-height:1.2;' }, (window.UNITS ? window.UNITS.displayWeightVal(_lastW) : _lastW.toFixed(1)) + (window.UNITS ? ' ' + window.UNITS.weightLabel() : ' kg')));
      _sparkMeta.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--ink-500,#6B6B65);margin-top:2px;' }, _wDeltaLabel + ' ' + ((window.isEnglish && window.isEnglish()) ? 'over ' + _wVals.length + ' weigh-ins' : 'sur ' + _wVals.length + ' pesées')));
      _sparkRow.appendChild(_sparkMeta);
      inner.appendChild(_sparkRow);
    }
  } catch(_sparkErr) { /* sparkline optionnel — silencieux */ }

  // ── Row 5 : action primaire — lien Georgia italic, pas d'uppercase tracking ──
  // Bible Hermès v2 supervision : réduire les éléments uppercase (eyebrows)
  // à 2 max par écran. L'action du hero passe en Georgia italic souligné.
  if (context.action) {
    var actionLink = h('a', {
      href: '#',
      style: 'font-family:Georgia,serif;font-style:italic;font-size:15px;color:var(--ink-900,#0A0A09);text-decoration:none;border-bottom:1px solid var(--ink-900,#0A0A09);padding-bottom:4px;cursor:pointer;display:inline-block;min-height:44px;line-height:44px;',
      onclick: function(e) {
        e.preventDefault();
        if (context.action.onclick) context.action.onclick();
      }
    }, context.action.labelLower || (context.action.label.charAt(0).toUpperCase() + context.action.label.slice(1).toLowerCase()) + '  \u2192');
    inner.appendChild(actionLink);
  }

  hero.appendChild(inner);
  return hero;
}

// Construit le contenu contextuel du hero selon moment et profil utilisateur.
// Retourne : { quote, stats: [{value, label, highlight?}], action: {label, onclick} }
function buildContextualHero(moment, S) {
  var ctx = { quote: null, quoteAuthor: '', stats: [], action: null };
  var totals = (typeof getTodayTotals === 'function') ? getTodayTotals() : { kcal: 0, p: 0, g: 0, l: 0 };
  var target = (typeof getCalorieTarget === 'function') ? getCalorieTarget() : 2000;
  var todayIdx = (new Date().getDay() + 6) % 7;
  var weekPlanDay = (Array.isArray(S.weekPlan) && S.weekPlan[todayIdx]) ? S.weekPlan[todayIdx] : null;
  var isPregnant = S.pregnant && typeof S.pregnancyWeek === 'number' && S.pregnancyWeek >= 12;
  var hasMedical = Array.isArray(S.medical) && S.medical.length > 0;
  var isCFUser = S.sportType === 'crossfit';
  // FIX SPRINT P1.7 — Détection user muscu pour brancher les hero contextuels
  // FIX BUG-MUSCU-HERO 2026-04 : le fallback (S.appMode === 'sport' && !isCFUser) capturait
  // yoga/running/padel/triathlon → leur affichait le hero "musculation" (exos, séance muscu…).
  // Maintenant : isMuscu est strict (sportType uniquement), le else-branch générique couvre le reste.
  var isMuscuUser = S.sportType === 'muscu' || S.sportType === 'musculation' || S.sportType === 'calisthenics';
  // Récup séance du jour si user a un programme sport
  var todaySportSession = null;
  try {
    if (window.getNextSportDay) {
      var nxt = window.getNextSportDay();
      if (nxt && nxt.day) {
        var _nk = nxt.day.splitKey || (S._splitChoice && S.sportType === 'musculation' ? S._splitChoice : null);
        var _nl = _nk ? (_getSplitLabels()[_nk] || null) : null;
        var _ni = typeof nxt.day.splitDayIdx === 'number' ? nxt.day.splitDayIdx : nxt.index;
        var _ng = !nxt.day.name || /^(Jour|Session|S\u00e9ance)\s+\d+$/i.test(nxt.day.name);
        var _nn = (_nl && _nl[_ni]) ? _nl[_ni] : (!_ng ? nxt.day.name : ((window.isEnglish && window.isEnglish() ? 'Session ' : 'S\u00e9ance ') + (nxt.index + 1)));
        todaySportSession = { name: nxt.day.label || _nn, exoCount: Array.isArray(nxt.day.exercises) ? nxt.day.exercises.length : 0 };
      }
    }
  } catch(eS) {}

  // Format kcal avec espace insécable pour les milliers (2 200 kcal)
  var fmtKcal = function(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); };

  if (moment === 'matin') {
    // Matin : orienter petit-déj + cap énergétique
    var hier = fmtKcal(target - 380); // placeholder; à remplacer par vraie donnée J-1
    // 2026-04 FIX INCOHÉRENCE : si une recette petit-déj est déjà proposée dans le weekPlan,
    // afficher SES kcal réelles (pas un target théorique 22%) — sinon l'user voyait
    // "Vise 503 kcal" puis on lui proposait un Bowl 572 kcal → frustration
    var _bf = weekPlanDay && weekPlanDay.breakfast;
    var _bfKcalReal = _bf && (typeof _bf.k === 'number' ? _bf.k : (typeof _bf.kcal === 'number' ? _bf.kcal : null));
    var _bfProtReal = _bf && (typeof _bf.p === 'number' ? _bf.p : (typeof _bf.protein === 'number' ? _bf.protein : null));
    var petitDejTarget = (_bfKcalReal && _bfKcalReal > 0) ? Math.round(_bfKcalReal) : Math.round(target * 0.22);
    var protTarget = (_bfProtReal && _bfProtReal > 0) ? Math.round(_bfProtReal) : Math.round((parseFloat(S.weight) || 70) * 1.6 * 0.25);

    var _bhEN = window.isEnglish && window.isEnglish();
    if (isPregnant) {
      ctx.quote = _bhEN ? 'Week ' + S.pregnancyWeek + '. Need +340 kcal/day. Prioritize omega-3s at breakfast.' : 'Semaine ' + S.pregnancyWeek + '. Besoin +340 kcal/jour. Privilégie les oméga-3 au petit-déj.';
      ctx.stats = [
        { value: fmtKcal(target) + '\u00a0kcal', label: _bhEN ? 'Daily target' : 'Cible du jour' },
        { value: 'S' + S.pregnancyWeek + ' \u00b7 T2', label: _bhEN ? 'Trimester' : 'Trimestre' }
      ];
    } else if (hasMedical && S.medical.indexOf('irc') !== -1) {
      var kCap = 800;
      ctx.quote = _bhEN ? 'Reminder: ' + kCap + ' mg potassium max today. Avoid banana at breakfast.' : 'Rappel : ' + kCap + ' mg de potassium max aujourd\'hui. Évite la banane au petit-déj.';
      ctx.stats = [
        { value: fmtKcal(target) + '\u00a0kcal', label: _bhEN ? 'Daily target' : 'Cible du jour' },
        { value: kCap + '\u00a0mg K\u207a', label: _bhEN ? 'Max potassium' : 'Potassium max' }
      ];
    } else if (isCFUser) {
      ctx.isDirective = true; ctx.quote = _bhEN ? 'Load up on carbs today: 500 kcal at breakfast including 70 g carbs.' : 'Chargez-vous en glucides aujourd\'hui : 500 kcal au petit-déj dont 70 g glucides.';
      ctx.stats = [
        { value: fmtKcal(500), label: _bhEN ? 'Breakfast kcal' : 'Kcal petit-déj' },
        { value: '70\u00a0g', label: _bhEN ? 'Targeted carbs' : 'Glucides visés' }
      ];
    } else if (isMuscuUser && todaySportSession) {
      var _sNameLow = todaySportSession.name.toLowerCase();
      var _isLegDay  = /jamb|legs?|lower|squat|quad|hamstr|fessier|glut/i.test(_sNameLow);
      var _isPushDay = /push|pec|chest|tricep|press/i.test(_sNameLow);
      var _isPullDay = /pull|dos|back|bicep|tirage/i.test(_sNameLow);
      var _carbTgt   = _isLegDay ? Math.round(petitDejTarget * 1.1) : petitDejTarget;
      var _protTgt   = Math.round((parseFloat(S.weight) || 70) * 1.6 * 0.30);
      if (_isLegDay) {
        ctx.isDirective = true; ctx.quote = _bhEN
          ? 'Leg day · Prioritise carbs at breakfast. Aim for ' + fmtKcal(_carbTgt) + ' kcal and ' + _protTgt + ' g protein to maximise the session.'
          : 'Séance Jambes · Priorité glucides au petit-déj. Vise ' + fmtKcal(_carbTgt) + ' kcal et ' + _protTgt + ' g protéines pour charger les muscles.';
      } else if (_isPushDay) {
        ctx.isDirective = true; ctx.quote = _bhEN
          ? todaySportSession.name + ' · ' + todaySportSession.exoCount + ' exercises. Fuel with ' + fmtKcal(petitDejTarget) + ' kcal and ' + _protTgt + ' g protein at breakfast.'
          : 'Séance ' + todaySportSession.name + ' · ' + todaySportSession.exoCount + ' exercices. Vise ' + fmtKcal(petitDejTarget) + ' kcal et ' + _protTgt + ' g protéines au petit-déj.';
      } else if (_isPullDay) {
        ctx.isDirective = true; ctx.quote = _bhEN
          ? todaySportSession.name + ' · Hydration and protein first. Aim for ' + fmtKcal(petitDejTarget) + ' kcal and ' + _protTgt + ' g protein.'
          : 'Séance ' + todaySportSession.name + ' · Hydratation et protéines en priorité. Vise ' + fmtKcal(petitDejTarget) + ' kcal et ' + _protTgt + ' g protéines.';
      } else {
        ctx.isDirective = true; ctx.quote = _bhEN
          ? 'Today: ' + todaySportSession.name + '. ' + todaySportSession.exoCount + ' exercises. Aim for ' + fmtKcal(petitDejTarget) + ' kcal at breakfast to fuel up.'
          : 'Aujourd\'hui : ' + todaySportSession.name + '. ' + todaySportSession.exoCount + ' exos. Vise ' + fmtKcal(petitDejTarget) + ' kcal au petit-déj pour bien charger.';
      }
      ctx.stats = [
        { value: fmtKcal(_isLegDay ? _carbTgt : petitDejTarget), label: _bhEN ? 'Breakfast kcal' : 'Kcal petit-déj' },
        { value: _protTgt + ' g', label: _bhEN ? 'Target protein' : 'Protéines ciblées' }
      ];
    } else {
      var _citMatin = getDailyCitationObj(); ctx.quote = _citMatin.text; ctx.quoteAuthor = _citMatin.author;
      ctx.stats = [
        { value: fmtKcal(petitDejTarget), label: _bhEN ? 'Breakfast kcal' : 'Kcal petit-déj' },
        { value: protTarget + '\u00a0g', label: _bhEN ? 'Target protein' : 'Protéines visées' }
      ];
    }

    ctx.action = {
      labelLower: _bhEN ? 'View my suggested breakfast' : 'Voir mon petit-déjeuner proposé', label: _bhEN ? 'VIEW MY SUGGESTED BREAKFAST' : 'VOIR MON PETIT-DÉJEUNER PROPOSÉ',
      onclick: function() {
        // HYPERSTAB 2026-04-17 — aligné sur l'action midi : cibler explicitement
        // la vue Planning semaine (nStep=12 → renderStep9) + jour courant.
        // Avant : S.view='nutrition' seul → user atterrissait sur l'étape où il était
        // la dernière fois (souvent nStep=0 = onboarding). Label renommé "Voir … proposé"
        // (au lieu de "Logger") pour aligner sur la destination réelle (planning/recette),
        // le geste "logger / marquer pris" se fait ensuite sur la carte du repas.
        S.view = 'nutrition';
        S.nStep = 12;
        S.selectedDay = todayIdx;
        if (window.render) window.render();
      }
    };

  } else if (moment === 'midi') {
    // Midi : cadrer le déjeuner / préparer la séance
    var remaining = Math.max(0, target - totals.kcal);
    // FIX COHÉRENCE CALENDRIER 2026-04 : getDayType() retourne un objet {isTraining,...},
    // toujours truthy même pour un jour de repos → hasSessionToday était TOUJOURS true.
    // Corrigé : lire explicitement .isTraining.
    var _dayTypeInfo = (typeof window.getDayType === 'function') ? window.getDayType(todayIdx) : null;
    var hasSessionToday = !!(_dayTypeInfo && _dayTypeInfo.isTraining);

    if (isPregnant) {
      ctx.quote = _bhEN ? 'Iron-rich lunch recommended. Lentils or spinach?' : 'Déjeuner riche en fer recommandé. Lentilles ou épinards ?';
      ctx.stats = [
        { value: fmtKcal(remaining) + '\u00a0kcal', label: _bhEN ? 'Available kcal' : 'Kcal disponibles' },
        { value: '27\u00a0mg', label: _bhEN ? 'Targeted iron' : 'Fer ciblé' }
      ];
    } else if (isMuscuUser && hasSessionToday && todaySportSession && remaining > 100) {
      var _mLunch = Math.round(remaining * 0.55);
      var _mProt  = Math.round((parseFloat(S.weight) || 70) * 1.6 * 0.30);
      ctx.isDirective = true; ctx.quote = _bhEN
        ? todaySportSession.name + ' session ahead \u00b7 Last meal before effort. Aim for ' + fmtKcal(_mLunch) + ' kcal now, save the rest post-workout.'
        : 'Séance ' + todaySportSession.name + ' à venir \u00b7 Dernier repas avant l\'effort. Vise ' + fmtKcal(_mLunch) + ' kcal maintenant, garde le reste pour après.';
      ctx.stats = [
        { value: fmtKcal(_mLunch) + '\u00a0kcal', label: _bhEN ? 'Lunch target' : 'Cible déjeuner' },
        { value: _mProt + '\u00a0g', label: _bhEN ? 'Protein target' : 'Protéines ciblées' }
      ];
    } else {
      var _citMidi = getDailyCitationObj(); ctx.quote = _citMidi.text; ctx.quoteAuthor = _citMidi.author;
      ctx.stats = [
        { value: fmtKcal(remaining) + '\u00a0kcal', label: _bhEN ? 'Available kcal' : 'Kcal disponibles' },
        hasSessionToday
          ? { value: _bhEN ? 'Upcoming' : '\u00c0 venir', label: _bhEN ? 'Today\'s session' : 'Séance du jour' }
          : { value: _bhEN ? 'Rest' : 'Repos', label: _bhEN ? 'Rest day' : 'Jour de repos' }
      ];
    }

    ctx.action = {
      labelLower: _bhEN ? 'View the suggested lunch' : 'Voir le déjeuner proposé', label: _bhEN ? 'VIEW THE SUGGESTED LUNCH' : 'VOIR LE DÉJEUNER PROPOSÉ',
      onclick: function() {
        S.view = 'nutrition';
        S.nStep = 12;
        S.selectedDay = todayIdx;
        if (window.render) window.render();
      }
    };

  } else if (moment === 'soir') {
    // Soir : clôturer la journée, poser la suivante
    var delta = totals.kcal - target;
    var overflow = delta > target * 0.10;

    // FIX SPRINT P1.7 — Récap muscu si user a fait sa séance aujourd'hui
    var muscuToday = null;
    try {
      var _mRecapToday = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
      if (isMuscuUser && S.muscuSessionLog && S.muscuSessionLog[_mRecapToday]) {
        var todayLog = S.muscuSessionLog[_mRecapToday];
        var totalTonnage = 0;
        var setsValidated = 0;
        Object.keys(todayLog).forEach(function(exName) {
          var sets = todayLog[exName] || [];
          sets.forEach(function(s) {
            if (s.validated && s.actualWeight && s.actualReps) {
              totalTonnage += s.actualWeight * s.actualReps;
              setsValidated++;
            }
          });
        });
        if (totalTonnage > 0) muscuToday = { tonnage: Math.round(totalTonnage), sets: setsValidated };
      }
    } catch(eM) {}

    if (overflow) {
      ctx.quote = _bhEN ? 'Over by ' + fmtKcal(delta) + ' kcal. Nothing dramatic. Tomorrow, aim for ' + fmtKcal(target - 200) + '.' : 'Dépassement de ' + fmtKcal(delta) + ' kcal. Rien de dramatique. Demain, pars sur ' + fmtKcal(target - 200) + '.';
    } else if (muscuToday) {
      ctx.isDirective = true; ctx.quote = _bhEN ? 'You moved ' + fmtKcal(muscuToday.tonnage) + ' kg across ' + muscuToday.sets + ' sets today. ' + fmtKcal(totals.kcal) + ' kcal · ' + Math.round(totals.p) + ' g protein. Tomorrow, we build on it.' : 'Tu as soulevé ' + fmtKcal(muscuToday.tonnage) + ' kg en ' + muscuToday.sets + ' séries. ' + fmtKcal(totals.kcal) + ' kcal · ' + Math.round(totals.p) + ' g protéines. Demain, on construit dessus.';
    } else if (totals.kcal >= target * 0.85) {
      var _citSoir1 = getDailyCitationObj(); ctx.quote = _citSoir1.text; ctx.quoteAuthor = _citSoir1.author;
    } else {
      var _citSoir2 = getDailyCitationObj(); ctx.quote = _citSoir2.text; ctx.quoteAuthor = _citSoir2.author;
    }

    ctx.stats = muscuToday
      ? [
          { value: fmtKcal(muscuToday.tonnage) + '\u00a0kg', label: _bhEN ? 'Tonnage lifted' : 'Tonnage soulevé' },
          { value: fmtKcal(totals.kcal) + '\u00a0kcal', label: _bhEN ? 'Day kcal' : 'Kcal journée', highlight: overflow }
        ]
      : [
          { value: fmtKcal(totals.kcal) + '\u00a0kcal', label: _bhEN ? 'Day kcal' : 'Kcal journée', highlight: overflow },
          { value: Math.round(totals.p) + '\u00a0g', label: _bhEN ? 'Protein' : 'Protéines' }
        ];

    ctx.action = {
      labelLower: _bhEN ? 'View detailed summary' : 'Voir le bilan détaillé', label: _bhEN ? 'DETAILED SUMMARY' : 'BILAN DÉTAILLÉ',
      onclick: function() { S._dashExtOpen = true; if (window.render) window.render(); }
    };

  } else {
    // Veille (nuit) — hero minimaliste, pas de proactivité
    var _citLate = getDailyCitationObj(); ctx.quote = _citLate.text; ctx.quoteAuthor = _citLate.author;
    ctx.stats = [];
  }

  return ctx;
}
window.renderHeroContextuel = renderHeroContextuel;

// ─── RENDER CARD 1 — Bonjour ───
function renderCardBonjour(S) {
  var c = card();
  var user = window.AUTH ? window.AUTH.getUser() : null;
  // FIX P0 stability 2026-04-17 : guard typeof user.name avant .split() (crash si name non-string)
  var _userFirst = '';
  if (user && typeof user.name === 'string' && user.name.trim()) {
    var _parts = user.name.trim().split(/\s+/);
    _userFirst = _parts[0] || '';
  }
  var firstName = (window.getDisplayFirstName ? window.getDisplayFirstName() : (S.prenom || _userFirst || ''));

  // Random daily quote — seeded by day of year for consistency
  var allQuotes = (window.SPORT_QUOTES && window.SPORT_QUOTES.length) ? window.SPORT_QUOTES : TODAY_QUOTES;
  var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var quote = allQuotes[dayOfYear % allQuotes.length];
  var quoteText = typeof quote === 'string' ? quote : (quote && quote.text ? quote.text : '');
  var quoteAuthor = (quote && quote.author) ? quote.author : '';

  var eyebrow_el = eyebrow((window.isEnglish && window.isEnglish()) ? 'TODAY' : 'AUJOURD\'HUI');
  c.appendChild(eyebrow_el);

  // Salutation selon l'heure de la journée
  var _hour = new Date().getHours();
  var _greetWord = (window.isEnglish && window.isEnglish())
    ? (_hour >= 18 ? 'Good evening' : (_hour >= 12 ? 'Good afternoon' : 'Good morning'))
    : (_hour >= 18 ? 'Bonsoir' : (_hour >= 12 ? 'Bon après-midi' : 'Bonjour'));
  var title = h('div', { style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;margin-bottom:4px;' });
  title.textContent = _greetWord + (firstName ? ', ' + firstName : '') + '.';
  c.appendChild(title);

  // Date permanente sous le titre
  (function() {
    var _now2 = new Date();
    var _localeCard = (window.isEnglish && window.isEnglish()) ? 'en-US' : 'fr-FR';
    var _dateStr = _now2.toLocaleDateString(_localeCard, {weekday:'long', day:'numeric', month:'long'});
    var _dateEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:0.5px;margin-bottom:12px;' });
    _dateEl.textContent = _dateStr;
    c.appendChild(_dateEl);
  })();

  // ── Bandeau Trial ──
  if (window.isTrialUser && window.isTrialUser() && !(window.S && window.S._serverPremium) && !(window.isPremium && window.isPremium())) {
    var _trialDays = window.getTrialDaysLeft ? window.getTrialDaysLeft() : 0;
    var _trialUrgent = _trialDays <= 2;
    var _trialBorderColor = _trialUrgent ? '#C0390E' : 'var(--orange,#E86F1E)';
    var _trialBg = _trialUrgent ? 'rgba(192,57,14,0.07)' : 'rgba(232,111,30,0.06)';
    var _trialBanner = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:12px;border:1px solid ' + _trialBorderColor + ';background:' + _trialBg + ';border-radius:0;cursor:pointer;'});
    _trialBanner.onclick = function() {
      if (window.showPaywall) window.showPaywall('premium');
      else { S.view = 'profil'; if (window.render) window.render(); }
    };
    var _trialLeft = h('div', {style: 'flex:1;min-width:0;'});
    _trialLeft.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange-ink,#7A3B0E);font-weight:400;margin-bottom:2px;'}, (window.isEnglish && window.isEnglish()) ? 'TRIAL VERSION' : 'VERSION D\u2019ESSAI'));
    var _trEN = window.isEnglish && window.isEnglish();
    var _trialCopy = _trialDays <= 0 ? (_trEN ? 'Trial ended \u2014 Unlock access \u2192' : 'Essai termin\u00e9 \u2014 D\u00e9bloquez l\u2019acc\u00e8s \u2192')
      : _trialDays === 1 ? (_trEN ? 'Last day \u2014 Subscribe to continue \u2192' : 'Dernier jour \u2014 Abonnez-vous pour continuer \u2192')
      : _trialUrgent ? (_trEN ? 'Only ' + _trialDays + ' days left \u2014 Continue without interruption \u2192' : 'Plus que ' + _trialDays + ' jours \u2014 Continuez sans interruption \u2192')
      : _trialDays + ' ' + window.locPlural(_trialDays, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + (_trEN ? ' to explore everything \u2014 Subscribe \u2192' : ' pour tout explorer \u2014 S\u2019abonner \u2192');
    _trialLeft.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + (_trialUrgent ? '#7A1F1F' : 'var(--grey,#6B6B65)') + ';'}, _trialCopy));
    _trialBanner.appendChild(_trialLeft);
    _trialBanner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;color:' + (_trialUrgent ? '#C0390E' : 'var(--orange,#E86F1E)') + ';'}, _trialDays > 0 ? _trialDays + ((window.isEnglish && window.isEnglish()) ? 'd' : 'j') : '!'));
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
  hero.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:14px;'}, (window.isEnglish && window.isEnglish()) ? 'Today' : "Aujourd'hui"));

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

  // Delta ligne — calories restantes avec pourcentage et zones de couleur
  var netRem = Math.round(calorieTarget - kcalConsumed);
  var kcalPct = calorieTarget > 0 ? Math.round((kcalConsumed / calorieTarget) * 100) : 0;
  var deltaStyle = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-top:12px;font-weight:500;';
  var subStyle = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;margin-top:4px;font-weight:400;';
  var deltaText, deltaColor, statusText, statusColor;
  if (kcalPct >= 85 && kcalPct <= 105) {
    // Zone verte : 85-105%
    deltaColor = 'var(--accent,#1A4A1A)';
    statusColor = 'var(--accent,#1A4A1A)';
    if (netRem > 0) {
      deltaText = kcalPct + '% · ' + kcalConsumed + '/' + Math.round(calorieTarget) + ' kcal';
    } else if (netRem === 0) {
      deltaText = '100% · ' + kcalConsumed + '/' + Math.round(calorieTarget) + ' kcal';
    } else {
      deltaText = kcalPct + '% · ' + kcalConsumed + '/' + Math.round(calorieTarget) + ' kcal';
    }
    statusText = (window.isEnglish && window.isEnglish()) ? 'Daily goal reached' : 'Objectif du jour atteint';
  } else if (kcalPct < 70) {
    // Zone orange : sous-alimenté
    deltaColor = 'var(--orange,#E86F1E)';
    statusColor = 'var(--orange,#E86F1E)';
    deltaText = kcalPct + '% · ' + kcalConsumed + '/' + Math.round(calorieTarget) + ' kcal';
    statusText = (window.isEnglish && window.isEnglish()) ? 'Consider adding a snack' : 'Pensez à ajouter une collation';
  } else if (kcalPct > 115) {
    // Zone rouge : dépassement
    deltaColor = 'var(--red,#C0392B)';
    statusColor = 'var(--red,#C0392B)';
    deltaText = kcalPct + '% · ' + kcalConsumed + '/' + Math.round(calorieTarget) + ' kcal';
    statusText = (window.isEnglish && window.isEnglish()) ? 'Moderate overshoot' : 'Dépassement modéré';
  } else if (netRem > 0) {
    // Zone neutre : 70-84% (sous la cible mais pas critique)
    deltaColor = 'var(--grey,#6B6B65)';
    statusColor = 'var(--grey,#6B6B65)';
    deltaText = kcalPct + '% · ' + kcalConsumed + '/' + Math.round(calorieTarget) + ' kcal';
    statusText = (window.isEnglish && window.isEnglish()) ? (netRem + ' kcal remaining') : (netRem + ' kcal restantes');
  } else {
    // Zone neutre : 106-115% (léger dépassement)
    deltaColor = 'var(--orange,#E86F1E)';
    statusColor = 'var(--orange,#E86F1E)';
    deltaText = kcalPct + '% · ' + kcalConsumed + '/' + Math.round(calorieTarget) + ' kcal';
    statusText = (window.isEnglish && window.isEnglish()) ? 'Moderate overshoot' : 'Dépassement modéré';
  }
  hero.appendChild(h('div', {style: deltaStyle + 'color:' + deltaColor + ';'}, deltaText));
  hero.appendChild(h('div', {style: subStyle + 'color:' + statusColor + ';'}, statusText));

  // Mini-rings macros (P / G / L) en ligne, 48px chacun
  if (macroTargets && (macroTargets.p > 0 || macroTargets.g > 0 || macroTargets.l > 0) && window.svgRing) {
    var rings = h('div', {style: 'display:flex;justify-content:center;gap:20px;margin-top:18px;'});
    if (macroTargets.p > 0) {
      var pPct = Math.min(100, totals.p > 0 ? Math.round(totals.p / macroTargets.p * 100) : 0);
      var _mEN = window.isEnglish && window.isEnglish();
      rings.appendChild(window.svgRing(52, 5, pPct, '#0A0A09', _mEN ? 'Protein' : 'Protéines', Math.round(totals.p)));
    }
    if (macroTargets.g > 0) {
      var _mEN2 = window.isEnglish && window.isEnglish();
      var gPct = Math.min(100, totals.g > 0 ? Math.round(totals.g / macroTargets.g * 100) : 0);
      rings.appendChild(window.svgRing(52, 5, gPct, '#6B6B65', _mEN2 ? 'Carbs' : 'Glucides', Math.round(totals.g)));
    }
    if (macroTargets.l > 0) {
      var _mEN3 = window.isEnglish && window.isEnglish();
      var lPct = Math.min(100, totals.l > 0 ? Math.round(totals.l / macroTargets.l * 100) : 0);
      rings.appendChild(window.svgRing(52, 5, lPct, 'var(--orange,#E86F1E)', _mEN3 ? 'Fat' : 'Lipides', Math.round(totals.l)));
    }
    hero.appendChild(rings);
  }

  // Bouton "+ Ajouter un repas" — accès direct au quick-add sans ouvrir le FAB
  if (S.appMode !== 'sport' && typeof getDefaultMealSlot === 'function') {
    var _qaRow = h('div', { style: 'margin-top:20px;text-align:center;' });
    _qaRow.appendChild(h('button', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);background:transparent;border:1px solid var(--line,#D8D8D0);padding:9px 24px;cursor:pointer;min-height:36px;',
      onclick: function() { var _S = window.S; if (!_S) return; _S._quickAddSlot = getDefaultMealSlot(); if (window.render) window.render(); }
    }, (window.isEnglish && window.isEnglish()) ? '+ Add a meal' : '+ Ajouter un repas'));
    hero.appendChild(_qaRow);
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
    emptyMacro.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:normal;margin-bottom:8px;color:var(--grey);'}, (window.isEnglish && window.isEnglish()) ? 'No goal defined' : 'Aucun objectif défini'));
    emptyMacro.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.6;margin-bottom:14px;'}, (window.isEnglish && window.isEnglish()) ? 'Define your nutritional goals to track your daily macros.' : 'Définissez vos objectifs nutritionnels pour suivre vos macros quotidiens.'));
    emptyMacro.appendChild(h('button', {
      style: 'padding:10px 16px;background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:1px solid var(--ink-900,#0A0A09);border-radius:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;min-height:44px;',
      onclick: function() { if (!window.S) return; window.S.view = 'nutrition'; window.S.nStep = 1; if (window.render) window.render(); }
    }, (window.isEnglish && window.isEnglish()) ? 'Configure my profile →' : 'Configurer mon profil →'));
    return emptyMacro;
  }

  var totals = getTodayTotals();
  var macroTargets = macroTargetsOverride || getMacroTargets();

  // ── Sport burn du jour ──
  // Sessions are keyed as "<dayIdx>_<date>" (regular) or "<date>" (free sessions).
  // Scan all keys ending with today's date to catch both formats.
  var _todayKey = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
  var _S = window.S || {};
  var _sportBurn = 0;
  if (_S.sessionHistory) {
    Object.keys(_S.sessionHistory).forEach(function(k) {
      if (k === _todayKey || k.slice(-10) === _todayKey) {
        var _e = _S.sessionHistory[k];
        if (_e && _e.kcalTotal > 0) _sportBurn = Math.max(_sportBurn, Math.round(_e.kcalTotal));
      }
    });
  }

  var c = card();
  c.appendChild(eyebrow('NUTRITION'));
  c.appendChild(cardTitle((window.isEnglish && window.isEnglish()) ? "Today's macros" : 'Macros du jour'));

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
    // Bible Hermès §13.1 : pas d'emoji. Tiret typographique + tutoiement.
    var _burnEl = document.createElement('div');
    _burnEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-bottom:6px;font-weight:500;color:var(--success,#3E5C3A);';
    _burnEl.textContent = (window.isEnglish && window.isEnglish()) ? ('Sport · ' + _sportBurn + ' kcal — factored into your plan') : ('Sport · ' + _sportBurn + ' kcal — intégrées dans ton plan');
    c.appendChild(_burnEl);
  }

  // Calories restantes = target - mangé (sans ajouter _sportBurn — BUG D fix)
  var _netRemaining = Math.round(calorieTarget - totals.kcal);
  var _remEl = document.createElement('div');
  _remEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-bottom:10px;font-weight:500;';
  // Bible Hermès §13.1 : pas d'emoji (⚡ ✓ ⚠). Typographie sobre.
  if (_netRemaining > 0) {
    _remEl.style.color = 'var(--success,#3E5C3A)';
    _remEl.textContent = (window.isEnglish && window.isEnglish()) ? (_netRemaining + ' kcal remaining') : (_netRemaining + ' kcal restantes');
  } else if (_netRemaining === 0) {
    _remEl.style.color = 'var(--success,#3E5C3A)';
    _remEl.textContent = (window.isEnglish && window.isEnglish()) ? 'Target reached. Well done.' : 'Objectif atteint. Bien joué.';
  } else {
    _remEl.style.color = 'var(--orange,#E86F1E)';
    _remEl.textContent = (window.isEnglish && window.isEnglish()) ? ('You exceeded by ' + Math.abs(_netRemaining) + ' kcal.') : ('Vous avez dépassé de ' + Math.abs(_netRemaining) + ' kcal.');
  }
  c.appendChild(_remEl);

  if (macroTargets && (macroTargets.p > 0 || macroTargets.g > 0 || macroTargets.l > 0)) {
    var _macEN = window.isEnglish && window.isEnglish();
    c.appendChild(macroRow(_macEN ? 'Protein' : 'Protéines', Math.round(totals.p), Math.round(macroTargets.p)));
    c.appendChild(macroRow(_macEN ? 'Carbs' : 'Glucides', Math.round(totals.g), Math.round(macroTargets.g)));
    c.appendChild(macroRow(_macEN ? 'Fat' : 'Lipides', Math.round(totals.l), Math.round(macroTargets.l)));

    // Anneaux SVG — progression macros
    var ringsRow = document.createElement('div');
    ringsRow.style.cssText = 'display:flex;justify-content:space-around;align-items:flex-start;margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#E8E6DF);flex-wrap:wrap;gap:8px;';
    if (macroTargets.p > 0 && window.svgRing) {
      var pPct = Math.min(100, totals.p > 0 ? Math.round(totals.p / macroTargets.p * 100) : 0);
      ringsRow.appendChild(window.svgRing(72, 7, pPct, 'var(--green,#3E5C3A)', _macEN ? 'Protein' : 'Protéines', Math.round(totals.p)));
    }
    if (macroTargets.g > 0 && window.svgRing) {
      var gPct = Math.min(100, totals.g > 0 ? Math.round(totals.g / macroTargets.g * 100) : 0);
      ringsRow.appendChild(window.svgRing(72, 7, gPct, 'var(--blue,#1A3A6A)', _macEN ? 'Carbs' : 'Glucides', Math.round(totals.g)));
    }
    if (macroTargets.l > 0 && window.svgRing) {
      var lPct = Math.min(100, totals.l > 0 ? Math.round(totals.l / macroTargets.l * 100) : 0);
      ringsRow.appendChild(window.svgRing(72, 7, lPct, 'var(--orange,#E86F1E)', _macEN ? 'Fat' : 'Lipides', Math.round(totals.l)));
    }
    if (ringsRow.children.length > 0) c.appendChild(ringsRow);
  }

  return c;
}

// ═══════════════════════════════════════════════════════════════
// ─── JOURNAL DU JOUR — MyFitnessPal-like (2026-04) ───
// Recherche aliment → choix repas → grammage → calcul auto
// Favoris en étoile, cumul journalier avec cibles macros.
// ═══════════════════════════════════════════════════════════════
var _fjState = {
  meal: 'breakfast',
  query: '',
  qty: 100,
  selectedFood: null,
  showFavs: false,
  showSavedMeals: false,   // Phase 3 M
  multiSelected: {}
};

function _fjGetUid() {
  try { var u = window.AUTH && window.AUTH.getUser(); return u ? u.id : 'anon'; } catch(e) { return 'anon'; }
}
function _fjGetFavs() {
  try {
    var k = 'mtd_food_favorites_' + _fjGetUid();
    return JSON.parse(localStorage.getItem(k) || '[]');
  } catch(e) { return []; }
}
function _fjSaveFavs(arr) {
  try {
    var k = 'mtd_food_favorites_' + _fjGetUid();
    localStorage.setItem(k, JSON.stringify(arr));
  } catch(e) {}
}
function _fjIsFav(name) {
  var favs = _fjGetFavs();
  for (var i = 0; i < favs.length; i++) { if (favs[i].name === name) return true; }
  return false;
}
function _fjToggleFav(food) {
  var favs = _fjGetFavs();
  var idx = -1;
  for (var i = 0; i < favs.length; i++) { if (favs[i].name === food.name) { idx = i; break; } }
  if (idx >= 0) favs.splice(idx, 1);
  else favs.unshift({ name: food.name, kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat });
  if (favs.length > 50) favs.length = 50;
  _fjSaveFavs(favs);
}

// ─── MES REPAS SAUVEGARDÉS ───
function _fjGetSavedMeals() {
  try {
    var v = JSON.parse(localStorage.getItem('mtd_saved_meals_' + _fjGetUid()) || '[]');
    return Array.isArray(v) ? v : [];
  } catch(e) { return []; }
}
function _fjSaveMeal(name, entries) {
  var meals = _fjGetSavedMeals();
  meals.unshift({ id: Date.now(), name: name, entries: entries });
  if (meals.length > 20) meals.length = 20;
  try { localStorage.setItem('mtd_saved_meals_' + _fjGetUid(), JSON.stringify(meals)); } catch(e) {}
}
function _fjDeleteSavedMeal(id) {
  var meals = _fjGetSavedMeals().filter(function(m) { return m.id !== id; });
  try { localStorage.setItem('mtd_saved_meals_' + _fjGetUid(), JSON.stringify(meals)); } catch(e) {}
}

// ─── COPIER D'HIER ───
function _fjYesterdayEntries(mealKey) {
  try {
    var key = 'mtd_food_journal_' + _fjGetUid();
    var journal = JSON.parse(localStorage.getItem(key) || '{}');
    var d = new Date(); d.setDate(d.getDate() - 1);
    var yKey = d.toISOString().slice(0, 10);
    var all = journal[yKey] || [];
    return all.filter(function(e) { return e && e.meal === mealKey; });
  } catch(e) { return []; }
}

// ─── CUSTOM FOODS — Création et injection dans FOOD_CALC._DB ───
var _fjCustomLoaded = false;
function _fjLoadCustomFoods() {
  if (_fjCustomLoaded) return;
  _fjCustomLoaded = true;
  try {
    var uid = _fjGetUid();
    var stored = JSON.parse(localStorage.getItem('mtd_custom_foods_' + uid) || '[]');
    if (!Array.isArray(stored) || !window.FOOD_CALC || !Array.isArray(window.FOOD_CALC._DB)) return;
    stored.forEach(function(cf) {
      if (!cf || !cf.name) return;
      // Avoid injecting duplicates
      for (var i = 0; i < window.FOOD_CALC._DB.length; i++) {
        if (window.FOOD_CALC._DB[i][0] === cf.name) return;
      }
      window.FOOD_CALC._DB.push([cf.name, cf.kcal || 0, cf.p || 0, cf.g || 0, cf.l || 0]);
    });
  } catch(e) {}
}

function _fjOpenCreateFoodModal() {
  todayModal((window.isEnglish && window.isEnglish()) ? 'Create a food' : 'Créer un aliment', function(box) {
    var fields = [
      { id: 'cf-name', label: (window.isEnglish && window.isEnglish()) ? 'Name' : 'Nom', placeholder: (window.isEnglish && window.isEnglish()) ? 'e.g. My home blend' : 'ex: Mon mélange maison', inputmode: 'text' },
      { id: 'cf-kcal', label: 'Kcal / 100g', placeholder: '0', inputmode: 'decimal' },
      { id: 'cf-p',    label: (window.isEnglish && window.isEnglish()) ? 'Protein / 100g (g)' : 'Protéines / 100g (g)', placeholder: '0', inputmode: 'decimal' },
      { id: 'cf-g',    label: (window.isEnglish && window.isEnglish()) ? 'Carbs / 100g (g)' : 'Glucides / 100g (g)', placeholder: '0', inputmode: 'decimal' },
      { id: 'cf-l',    label: (window.isEnglish && window.isEnglish()) ? 'Fat / 100g (g)' : 'Lipides / 100g (g)', placeholder: '0', inputmode: 'decimal' }
    ];
    var inputs = {};

    // Barcode prefill — top of modal so discoverable
    if (window.SCANNER && typeof window.SCANNER.renderWidget === 'function') {
      var scanBtn = h('button', {
        type: 'button',
        style: 'width:100%;padding:12px 14px;min-height:44px;margin-bottom:14px;background:transparent;border:1px solid var(--black,#0A0A09);border-radius:2px;cursor:pointer;'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--black,#0A0A09);'
          + 'display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;'
      });
      scanBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M3 3 L3 13 M5 3 L5 13 M7.5 3 L7.5 13 M10 3 L10 13 M13 3 L13 13"/></svg><span>' + ((window.isEnglish && window.isEnglish()) ? 'Scan a barcode' : 'Scanner un code-barres') + '</span>';
      scanBtn.addEventListener('click', function() {
        try {
          todayModal((window.isEnglish && window.isEnglish()) ? 'Scan a barcode' : 'Scanner un code-barres', function(scanBox, scanOverlay) {
            var scanContainer = h('div', { style: 'margin-top:8px;' });
            try { window.SCANNER.renderWidget(scanContainer, { onPrefill: function(p) {
              if (!p) return;
              if (inputs['cf-name']) inputs['cf-name'].value = p.name || '';
              if (inputs['cf-kcal']) inputs['cf-kcal'].value = (p.kcal != null ? p.kcal : '');
              if (inputs['cf-p'])    inputs['cf-p'].value    = (p.protein != null ? p.protein : '');
              if (inputs['cf-g'])    inputs['cf-g'].value    = (p.carbs != null ? p.carbs : '');
              if (inputs['cf-l'])    inputs['cf-l'].value    = (p.fat != null ? p.fat : '');
              try { if (window.SCANNER && window.SCANNER.stopCamera) window.SCANNER.stopCamera(); } catch(e) {}
              try { if (scanOverlay && scanOverlay.parentNode) scanOverlay.parentNode.removeChild(scanOverlay); } catch(e) {}
              if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Pre-filled values — verify before saving.' : 'Valeurs pré-remplies — vérifiez avant d\'enregistrer.', 'success', 2500);
            } }); }
            catch(e) { scanContainer.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, (window.isEnglish && window.isEnglish()) ? 'Scanner unavailable on this browser.' : 'Scanner indisponible sur ce navigateur.')); }
            scanBox.appendChild(scanContainer);
          });
        } catch(e) { console.warn('[create-food] scanner open failed:', e); }
      });
      box.appendChild(scanBtn);
    }

    fields.forEach(function(f) {
      var wrap = h('div', { style: 'margin-bottom:10px;' });
      var lbl = h('label', {
        style: 'display:block;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:4px;'
      }, f.label);
      lbl.setAttribute('for', f.id);
      var inp = h('input', {
        id: f.id,
        type: 'text',
        placeholder: f.placeholder || '',
        style: 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--line,#D8D8D0);border-radius:2px;'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;background:var(--ivory,#FAF9F6);min-height:44px;'
      });
      inp.setAttribute('inputmode', f.inputmode || 'text');
      inputs[f.id] = inp;
      wrap.appendChild(lbl);
      wrap.appendChild(inp);
      box.appendChild(wrap);
    });

    var errEl = h('div', { style: 'color:var(--error,#7A1F1F);font-size:12px;margin-bottom:8px;display:none;font-family:"Helvetica Neue",Arial,sans-serif;' });
    box.appendChild(errEl);

    var saveBtn = h('button', {
      style: 'width:100%;padding:12px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;cursor:pointer;'
        + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;min-height:44px;margin-top:4px;'
    }, (window.isEnglish && window.isEnglish()) ? 'Create food item' : 'Créer l\'aliment');

    saveBtn.addEventListener('click', function() {
      var _sfn = window.sfcSafeNum || function(v, fb) { var n = parseFloat(String(v||'').trim().replace(',','.')); return isFinite(n) ? n : (fb !== undefined ? fb : null); };
      var EN2 = window.isEnglish && window.isEnglish();
      var name = (inputs['cf-name'].value || '').trim();
      var kcal  = _sfn(inputs['cf-kcal'].value, null);
      var prot  = _sfn(inputs['cf-p'].value,   null);
      var carbs = _sfn(inputs['cf-g'].value,   null);
      var fat   = _sfn(inputs['cf-l'].value,   null);

      if (!name) {
        errEl.textContent = EN2 ? 'Name is required.' : 'Le nom est obligatoire.';
        errEl.style.display = '';
        inputs['cf-name'].focus();
        return;
      }
      if (kcal === null || kcal < 0) {
        errEl.textContent = EN2 ? 'Invalid kcal value (must be ≥ 0).' : 'Valeur kcal invalide (doit être ≥ 0).';
        errEl.style.display = '';
        return;
      }
      if (prot === null || prot < 0 || carbs === null || carbs < 0 || fat === null || fat < 0) {
        errEl.textContent = EN2 ? 'Macro values must be numbers ≥ 0.' : 'Les macros doivent être des nombres ≥ 0.';
        errEl.style.display = '';
        return;
      }
      kcal = kcal; prot = prot; carbs = carbs; fat = fat;

      // Persist
      var uid = _fjGetUid();
      var key = 'mtd_custom_foods_' + uid;
      var stored = [];
      try { stored = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { stored = []; }
      if (!Array.isArray(stored)) stored = [];
      stored.push({ name: name, kcal: kcal, p: prot, g: carbs, l: fat });
      localStorage.setItem(key, JSON.stringify(stored));

      // Inject into FOOD_CALC immediately
      if (window.FOOD_CALC && Array.isArray(window.FOOD_CALC._DB)) {
        var dup = false;
        for (var i = 0; i < window.FOOD_CALC._DB.length; i++) {
          if (window.FOOD_CALC._DB[i][0] === name) { dup = true; break; }
        }
        if (!dup) window.FOOD_CALC._DB.push([name, kcal, prot, carbs, fat]);
      }

      // Close modal
      var overlay = document.body.lastChild;
      while (overlay && overlay.getAttribute && !overlay.getAttribute('role')) overlay = overlay.previousSibling;
      if (overlay && overlay.getAttribute && overlay.getAttribute('role') === 'dialog') {
        try { document.body.removeChild(overlay); } catch(e) {}
      }

      _fjState.query = name;
      _fjState.selectedFood = null;
      _fjRefreshResults();
      if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? '\u00ab ' + name + ' \u00bb added to your database.' : '\u00ab ' + name + ' \u00bb ajouté à votre base.', 'success', 2500);
    });

    box.appendChild(saveBtn);
    setTimeout(function() { try { inputs['cf-name'].focus(); } catch(e) {} }, 80);
  });
}

function renderFoodJournalCard() {
  _fjLoadCustomFoods();
  var S = window.S;
  if (!S) return null;
  // Sport-only : masquer (pas de suivi nutrition)
  if (S.appMode === 'sport') return null;

  var c = card();
  c.id = 'fj-card-root'; // Phase 2 K: stable anchor for targeted re-render

  // Titre standard Georgia 20px (cohérent avec renderCardSport / renderCardRepas)
  c.appendChild(cardTitle((window.isEnglish && window.isEnglish()) ? "Today's journal" : 'Journal du jour'));

  // ─── Totaux du jour ───
  var totals = (window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal)
    ? window.FOOD_JOURNAL.getDayTotal()
    : { kcal: 0, p: 0, g: 0, l: 0, count: 0 };
  var kcalTarget = (typeof getCalorieTarget === 'function') ? getCalorieTarget() : 0;
  var macroT = (typeof getMacroTargets === 'function') ? getMacroTargets() : { p: 0, g: 0, l: 0 };

  var totalsBox = h('div', {
    style: 'display:flex;justify-content:space-between;gap:8px;padding:12px;background:transparent;border:1px solid var(--line,#D8D8D0);border-radius:2px;margin-bottom:14px;'
  });
  function totCell(lbl, val, tgt, unit) {
    var cell = h('div', { style: 'flex:1;text-align:center;' });
    cell.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:4px;'
    }, lbl));
    var valColor = 'var(--black,#0A0A09)';
    if (tgt > 0) {
      var ratio = val / tgt;
      if (ratio > 1.1) valColor = '#C0392B';       // over 110%: rouge
      else if (ratio >= 0.9) valColor = '#27AE60';  // 90–110%: vert
      else if (ratio >= 0.6) valColor = '#E67E22';  // 60–90%: orange
    }
    var displayVal = tgt > 0 ? Math.round(val) + ' / ' + Math.round(tgt) : (val > 0 ? Math.round(val) : '---');
    cell.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-size:15px;color:' + valColor + ';'
    }, displayVal + (unit || '')));
    if (tgt > 0) {
      var pctVal = Math.round(val / tgt * 100);
      cell.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:' + valColor + ';opacity:0.75;margin-top:2px;' }, pctVal + '%'));
    }
    return cell;
  }
  totalsBox.appendChild(totCell('Kcal', totals.kcal, kcalTarget, ''));
  totalsBox.appendChild(totCell('Prot.', totals.p, macroT.p, 'g'));
  totalsBox.appendChild(totCell('Gluc.', totals.g, macroT.g, 'g'));
  totalsBox.appendChild(totCell('Lip.', totals.l, macroT.l, 'g'));
  c.appendChild(totalsBox);

  // ─── Métrique urgente — langage humain, 1 phrase claire ───────────────────
  // Traduction des chiffres bruts en message actionnable (Competitor agent rec.)
  try {
    if (kcalTarget > 0 && totals.count >= 0) {
      var _kcalLeft = Math.round(kcalTarget - totals.kcal);
      var _pLeft = Math.round((macroT.p || 0) - totals.p);
      var _msgUrgent = '';
      var _colUrgent = 'var(--grey,#6B6B65)';
      if (totals.kcal === 0) {
        _msgUrgent = (window.isEnglish && window.isEnglish()) ? 'Start by logging your first meal of the day.' : 'Commencez par logger votre premier repas du jour.';
      } else if (_kcalLeft > 200) {
        _msgUrgent = (window.isEnglish && window.isEnglish()) ? (_kcalLeft + ' kcal remaining — ' + (_pLeft > 10 ? 'prioritize protein (' + _pLeft + 'g left).' : 'almost there.')) : ('Il vous reste  ' + _kcalLeft + ' kcal — ' + (_pLeft > 10 ? 'privilégiez les protéines (' + _pLeft + 'g restants).' : 'objectif presque atteint.'));
        _colUrgent = '#1A3A6A';
      } else if (_kcalLeft >= -100) {
        _msgUrgent = (window.isEnglish && window.isEnglish()) ? 'Calorie goal reached. Excellent day.' : 'Budget calorique atteint. Excellente journée.';
        _colUrgent = '#27AE60';
      } else {
        _msgUrgent = (window.isEnglish && window.isEnglish()) ? ('Over by ' + Math.abs(_kcalLeft) + ' kcal. Adjust tomorrow.') : ('Budget dépassé de ' + Math.abs(_kcalLeft) + ' kcal. Ajustez demain.');
        _colUrgent = '#C0392B';
      }
      if (_msgUrgent) {
        c.appendChild(h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + _colUrgent + ';' +
                 'line-height:1.5;padding:6px 0 10px;border-bottom:1px solid var(--line,#D8D8D0);margin-bottom:12px;'
        }, _msgUrgent));
      }
    }
  } catch(_eUrgent) {}

  // ─── Tabs repas ───
  var _fjEN = window.isEnglish && window.isEnglish();
  var MEALS = [
    { key: 'breakfast', label: _fjEN ? 'Breakfast' : 'Petit-d\u00e9j' },
    { key: 'lunch',     label: _fjEN ? 'Lunch'     : 'D\u00e9jeuner' },
    { key: 'snack',     label: _fjEN ? 'Snack'     : 'Collation' },
    { key: 'dinner',    label: _fjEN ? 'Dinner'    : 'D\u00eener' }
  ];
  var MEAL_LABELS_FULL = _fjEN
    ? { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }
    : { breakfast: 'Petit-d\u00e9jeuner', lunch: 'D\u00e9jeuner', snack: 'Collation', dinner: 'D\u00eener' };

  var tabs = h('div', { style: 'display:flex;gap:0;margin-bottom:0;border-bottom:1px solid var(--line,#D8D8D0);' });
  MEALS.forEach(function(m) {
    var active = _fjState.meal === m.key;
    var btn = h('button', {
      style: 'flex:1;padding:10px 4px;min-height:44px;cursor:pointer;border:none;border-bottom:' + (active ? '2px solid var(--black,#0A0A09)' : '2px solid transparent') + ';'
        + 'background:' + (active ? 'var(--black,#0A0A09)' : 'transparent') + ';'
        + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;'
        + 'color:' + (active ? 'var(--ivory,#FAF9F6)' : 'var(--grey,#6B6B65)') + ';'
        + 'transition:background 0.15s,color 0.15s;'
    }, m.label);
    btn.addEventListener('click', function() {
      _fjState.meal = m.key;
      _fjState.multiSelected = {};
      _fjState.showSavedMeals = false;
      _reRenderFJCard();
    });
    tabs.appendChild(btn);
  });
  c.appendChild(tabs);

  // Banner "Ajouter à : [Repas]" — contexte toujours visible
  c.appendChild(h('div', {
    style: 'display:flex;align-items:center;gap:6px;padding:7px 12px;background:var(--ivory,#FAF9F6);border-left:2px solid var(--black,#0A0A09);margin-bottom:10px;'
  }, [
    h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);'
    }, (window.isEnglish && window.isEnglish()) ? 'Adding to:' : 'Ajouter\u00a0\u00e0\u00a0:'),
    h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--black,#0A0A09);font-weight:400;'
    }, MEAL_LABELS_FULL[_fjState.meal])
  ]));

  // ─── Barre de recherche + toggle favoris ───
  var searchRow = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;' });
  var input = h('input', {
    type: 'text',
    placeholder: 'Rechercher un aliment',
    value: _fjState.query,
    inputmode: 'search',
    enterkeyhint: 'search',
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    'aria-label': 'Rechercher un aliment',
    style: 'flex:1;padding:12px 14px;min-height:44px;border:1px solid var(--line,#D8D8D0);border-radius:2px;background:var(--ivory,#FAF9F6);'
      + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:var(--black,#0A0A09);outline:none;box-sizing:border-box;'
  });
  // 2026-04 R4-B1 : debounce 180ms pour éviter spam fetch OFF + churn DOM
  var _fjSearchDebounce = null;
  input.addEventListener('input', function(e) {
    _fjState.query = e.target.value;
    _fjState.showFavs = false;
    if (_fjSearchDebounce) clearTimeout(_fjSearchDebounce);
    _fjSearchDebounce = setTimeout(function() {
      _fjSearchDebounce = null;
      _fjRefreshResults();
    }, 180);
  });
  searchRow.appendChild(input);

  // Clear × button — visible only when query is non-empty
  if (_fjState.query) {
    var clearBtn = h('button', {
      type: 'button',
      'aria-label': 'Effacer la recherche',
      style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;background:transparent;border:1px solid var(--line,#D8D8D0);border-radius:2px;cursor:pointer;box-sizing:border-box;flex-shrink:0;font-size:16px;color:var(--grey,#6B6B65);'
    }, '\u00d7');
    clearBtn.addEventListener('click', function() {
      _fjState.query = '';
      _fjState.showFavs = false;
      _reRenderFJCard();
    });
    searchRow.appendChild(clearBtn);
  }

  var favBtn = h('button', {
    'aria-label': _fjState.showFavs ? 'Masquer les favoris' : 'Afficher les favoris',
    style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;'
      + 'background:' + (_fjState.showFavs ? 'var(--black,#0A0A09)' : 'transparent') + ';'
      + 'border:1px solid var(--black,#0A0A09);border-radius:2px;cursor:pointer;box-sizing:border-box;flex-shrink:0;'
  });
  // SVG étoile 14×14 trait 1.2px (cohérent avec la charte Hermès)
  var favSvgColor = _fjState.showFavs ? 'var(--ivory,#FAF9F6)' : 'var(--black,#0A0A09)';
  favBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="' + (_fjState.showFavs ? favSvgColor : 'none') + '" stroke="' + favSvgColor + '" stroke-width="1.2" stroke-linejoin="round"><path d="M7 1.5 L8.6 5.3 L12.7 5.7 L9.5 8.5 L10.5 12.5 L7 10.3 L3.5 12.5 L4.5 8.5 L1.3 5.7 L5.4 5.3 Z"/></svg>';
  favBtn.addEventListener('click', function() {
    _fjState.showFavs = !_fjState.showFavs;
    _fjState.query = '';
    input.value = '';
    _reRenderFJCard();
  });
  searchRow.appendChild(favBtn);

  // 2026-04 C-1 : bouton scanner repas par IA (PLATE_SCAN) visible dans la barre
  // (les personas Marc/Sarah ne trouvaient pas cette feature dans le menu distant)
  if (window.PLATE_SCAN && typeof window.PLATE_SCAN.open === 'function') {
    var plateScanBtn = h('button', {
      type: 'button',
      'aria-label': 'Scanner un repas par photo IA',
      title: 'Scanner un repas (photo IA)',
      style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;'
        + 'background:transparent;border:1px solid var(--black,#0A0A09);border-radius:2px;cursor:pointer;box-sizing:border-box;flex-shrink:0;'
    });
    // SVG caméra 16x16 trait 1.4
    plateScanBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 5 L4.5 5 L5.5 3.5 L10.5 3.5 L11.5 5 L13.5 5 L13.5 12 L2.5 12 Z"/><circle cx="8" cy="8.5" r="2.3"/></svg>';
    plateScanBtn.addEventListener('click', function() {
      try { window.PLATE_SCAN.open(_fjState.meal || 'lunch'); } catch(e) { console.warn('[journal] plate scan open failed:', e); }
    });
    searchRow.appendChild(plateScanBtn);
  }

  // 2026-04 R5 : bouton scanner code-barres (était orphelin dans scanner.js)
  if (window.SCANNER && typeof window.SCANNER.renderWidget === 'function') {
    var barcodeBtn = h('button', {
      type: 'button',
      'aria-label': 'Scanner un code-barres',
      title: 'Scanner un code-barres',
      style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;'
        + 'background:transparent;border:1px solid var(--black,#0A0A09);border-radius:2px;cursor:pointer;box-sizing:border-box;flex-shrink:0;'
    });
    // SVG code-barres 16x16 trait 1.4
    barcodeBtn.style.cssText += 'gap:6px;padding:0 10px;min-width:unset;';
    barcodeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M3 3 L3 13 M5 3 L5 13 M7.5 3 L7.5 13 M10 3 L10 13 M13 3 L13 13"/></svg><span style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;">Code-barres</span>';
    barcodeBtn.addEventListener('click', function() {
      try {
        todayModal((window.isEnglish && window.isEnglish()) ? 'Scan a barcode' : 'Scanner un code-barres', function(box) {
          var scanContainer = h('div', { style: 'margin-top:8px;' });
          try { window.SCANNER.renderWidget(scanContainer); }
          catch(e) { scanContainer.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, (window.isEnglish && window.isEnglish()) ? 'Scanner unavailable on this browser.' : 'Scanner indisponible sur ce navigateur.')); }
          box.appendChild(scanContainer);
        });
      } catch(e) { console.warn('[journal] barcode scan open failed:', e); }
    });
    searchRow.appendChild(barcodeBtn);
  }

  // Phase 2 L : bouton "Créer un aliment personnalisé"
  var createFoodBtn = h('button', {
    type: 'button',
    'aria-label': (window.isEnglish && window.isEnglish()) ? 'Create a custom food' : 'Créer un aliment personnalisé',
    title: (window.isEnglish && window.isEnglish()) ? 'Create a food' : 'Créer un aliment',
    style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;'
      + 'background:transparent;border:1px solid var(--black,#0A0A09);border-radius:2px;cursor:pointer;box-sizing:border-box;flex-shrink:0;'
  });
  createFoodBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>';
  createFoodBtn.addEventListener('click', function() { _fjOpenCreateFoodModal(); });
  searchRow.appendChild(createFoodBtn);

  c.appendChild(searchRow);

  // Phase 3 M : pill "Mes Repas" sous la barre de recherche
  var pillRow = h('div', { style: 'display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;' });
  var pillSaved = h('button', {
    type: 'button',
    style: 'padding:5px 12px;min-height:32px;border-radius:0;cursor:pointer;box-sizing:border-box;'
      + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;'
      + (_fjState.showSavedMeals
        ? 'background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:1px solid var(--ink-900,#0A0A09);'
        : 'background:transparent;color:var(--ink-500,#6B6B65);border:1px solid var(--line,#D8D8D0);')
  }, (window.isEnglish && window.isEnglish()) ? 'My meals' : 'Mes repas');
  pillSaved.addEventListener('click', function() {
    _fjState.showSavedMeals = !_fjState.showSavedMeals;
    _fjState.showFavs = false;
    _fjState.query = '';
    _fjState.selectedFood = null;
    _reRenderFJCard();
  });
  pillRow.appendChild(pillSaved);

  // Pill "Plan du jour" — charge le plan de la semaine dans le journal d'un clic
  (function() {
    var S2 = window.S;
    if (!S2 || !S2.weekPlan) return;
    var todayIdx = (new Date().getDay() + 6) % 7;
    var dayPlan = S2.weekPlan[todayIdx];
    var hasPlan = dayPlan && (dayPlan.breakfast || dayPlan.lunch || dayPlan.dinner);
    if (!hasPlan) return;
    var pillPlan = h('button', {
      type: 'button',
      'aria-label': (window.isEnglish && window.isEnglish()) ? 'Load today\'s meal plan into journal' : 'Charger le plan repas du jour dans le journal',
      style: 'padding:5px 12px;min-height:32px;border-radius:0;cursor:pointer;box-sizing:border-box;'
        + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;'
        + 'background:transparent;color:var(--ink-500,#6B6B65);border:1px solid var(--line,#D8D8D0);'
    }, (window.isEnglish && window.isEnglish()) ? '+ Today\'s plan' : '+ Plan du jour');
    pillPlan.addEventListener('click', function() {
      if (!window.FOOD_JOURNAL) return;
      try {
        var existing = window.FOOD_JOURNAL.getDayTotal ? window.FOOD_JOURNAL.getDayTotal() : null;
        var hasEntries = existing && existing.count > 0;
        var doLoad = function() {
          var user = window.AUTH ? window.AUTH.getUser() : null;
          var loadedKey = 'mtd_journal_loaded_' + (user ? user.id : 'anon');
          localStorage.removeItem(loadedKey);
          window.FOOD_JOURNAL.loadFromPlan();
          if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Today\'s plan loaded in the journal' : 'Plan du jour chargé dans le journal', 'success', 2200);
          _reRenderFJCard();
        };
        var _fjConfirmMsg = (window.isEnglish && window.isEnglish()) ? 'There are already meals in your journal. Do you still want to add today\'s plan?' : 'Des repas sont déjà dans votre journal. Voulez-vous quand même ajouter le plan du jour ?';
        if (hasEntries && (window.sfcConfirm ? window.sfcConfirm(_fjConfirmMsg) : window.confirm(_fjConfirmMsg))) {
          doLoad();
        } else if (!hasEntries) {
          doLoad();
        }
      } catch(e) {}
    });
    pillRow.appendChild(pillPlan);
  })();

  c.appendChild(pillRow);

  // ─── Résultats de recherche (liste) ───
  var resultsBox = h('div', { id: 'fj-results', style: 'max-height:360px;overflow-y:auto;margin-bottom:12px;' });
  c.appendChild(resultsBox);

  // ─── Multi-ajout CTA (Phase 2 N) ───
  var multiCtaBox = h('div', { id: 'fj-multi-cta', style: 'display:none;' });
  c.appendChild(multiCtaBox);

  // ─── Zone sélection + grammage ───
  var selBox = h('div', { id: 'fj-selected', style: 'display:none;padding:12px;background:transparent;border:1px solid var(--line,#D8D8D0);border-radius:2px;margin-bottom:12px;' });
  c.appendChild(selBox);

  // ─── Liste des entrées du jour pour le repas sélectionné ───
  var entriesBox = h('div', { style: 'margin-top:8px;' });
  _fjBuildEntriesList(entriesBox);
  c.appendChild(entriesBox);

  // Trigger initial results render
  setTimeout(_fjRefreshResults, 0);

  return c;
}

// ─── Helpers de rendu dynamique ───
function _reRenderFJCard() {
  var _sy = (typeof window !== 'undefined' && typeof window.scrollY === 'number') ? window.scrollY : 0;
  function _restoreScroll() {
    if (_sy <= 0) return;
    var fn = function() { try { window.scrollTo(0, _sy); } catch(e) {} };
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(fn);
    else setTimeout(fn, 0);
  }

  // Phase 2 K : targeted re-render — remplace uniquement la card fj, pas toute la page
  var existing = document.getElementById('fj-card-root');
  if (existing && existing.parentNode) {
    try {
      var fresh = renderFoodJournalCard();
      if (fresh) {
        existing.parentNode.replaceChild(fresh, existing);
        _restoreScroll();
        return;
      }
    } catch(e) {
      console.warn('[fj] targeted re-render failed, fallback full render', e);
    }
  }

  // Fallback : full page render (premier rendu ou DOM inattendu)
  if (window.render) window.render();
  _restoreScroll();
}

// OpenFoodFacts state (module-level)
var _fjOFF = { loading: false, results: null, lastQuery: '', ctrl: null };

// Phase 2 N : update the multi-add CTA bar without re-rendering results
function _fjUpdateMultiCTA() {
  var box = document.getElementById('fj-multi-cta');
  if (!box) return;
  box.innerHTML = '';
  var names = Object.keys(_fjState.multiSelected);
  if (names.length === 0) { box.style.display = 'none'; return; }
  box.style.display = 'block';

  var _mfEN = window.isEnglish && window.isEnglish();
  var MEAL_FULL = _mfEN
    ? { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }
    : { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', snack: 'Collation', dinner: 'Dîner' };
  var ctaBtn = h('button', {
    style: 'width:100%;padding:12px 16px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;cursor:pointer;'
      + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;min-height:44px;margin-bottom:8px;'
  }, ((window.isEnglish && window.isEnglish()) ? 'Add ' : 'Ajouter ') + names.length + ' ' + window.locPlural(names.length, {fr:{one:'aliment',other:'aliments'},en:{one:'item',other:'items'}}) + ' · ' + (MEAL_FULL[_fjState.meal] || _fjState.meal));

  ctaBtn.addEventListener('click', function() {
    if (!window.FOOD_JOURNAL || !window.FOOD_JOURNAL.addEntry) return;
    names.forEach(function(nm) {
      var food = _fjState.multiSelected[nm];
      if (!food) return;
      var defP = (window.FOOD_PORTIONS && window.FOOD_PORTIONS.getDefaultPortion)
        ? window.FOOD_PORTIONS.getDefaultPortion(food.name) : null;
      var grams = defP ? defP.g : 100;
      var fac = grams / 100;
      var label = defP ? defP.label + ' (' + grams + 'g)' : '100g';
      window.FOOD_JOURNAL.addEntry(
        _fjState.meal,
        food.name,
        Math.round(food.kcal * fac),
        Math.round(food.protein * fac * 10) / 10,
        Math.round(food.carbs * fac * 10) / 10,
        Math.round(food.fat * fac * 10) / 10,
        label
      );
    });
    var count = names.length;
    _fjState.multiSelected = {};
    _fjState.query = '';
    _fjState.selectedFood = null;
    _reRenderFJCard();
    if (window.showToast) window.showToast(count + ' ' + window.locPlural(count, {fr:{one:'aliment ajouté',other:'aliments ajoutés'},en:{one:'item added',other:'items added'}}) + ' !', 'success', 2000);
  });

  box.appendChild(ctaBtn);
}

function _fjRenderFoodRow(food, source) {
  var isChecked = !!_fjState.multiSelected[food.name];
  var row = h('div', {
    style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 4px;border-bottom:1px solid var(--line,#D8D8D0);'
      + (isChecked ? 'background:rgba(10,10,9,0.04);' : '')
  });

  // Phase 2 N : checkbox de sélection multi-ajout
  var chk = h('button', {
    type: 'button',
    'aria-label': (window.isEnglish && window.isEnglish()) ? (isChecked ? 'Deselect ' + food.name : 'Select ' + food.name) : (isChecked ? 'Déselectionner ' + food.name : 'Sélectionner ' + food.name),
    style: 'display:inline-flex;align-items:center;justify-content:center;min-width:32px;min-height:32px;width:32px;height:32px;flex-shrink:0;'
      + 'border-radius:2px;cursor:pointer;padding:0;box-sizing:border-box;margin-right:4px;'
      + (isChecked
        ? 'background:var(--black,#0A0A09);border:1.5px solid var(--black,#0A0A09);'
        : 'background:transparent;border:1.5px solid var(--line,#D8D8D0);')
  });
  chk.innerHTML = isChecked
    ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--ivory,#FAF9F6)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6 L5 9 L10 3"/></svg>'
    : '';
  chk.addEventListener('click', function(e) {
    e.stopPropagation();
    if (_fjState.multiSelected[food.name]) {
      delete _fjState.multiSelected[food.name];
    } else {
      _fjState.multiSelected[food.name] = food;
      // Fermer la sélection détaillée si on revient au mode multi
      _fjState.selectedFood = null;
      var selBox = document.getElementById('fj-selected');
      if (selBox) selBox.style.display = 'none';
    }
    _fjUpdateMultiCTA();
    // Mettre à jour visuellement la row sans rebuild complet
    row.style.background = _fjState.multiSelected[food.name] ? 'rgba(10,10,9,0.04)' : '';
    if (_fjState.multiSelected[food.name]) {
      chk.style.background = 'var(--black,#0A0A09)';
      chk.style.borderColor = 'var(--black,#0A0A09)';
      chk.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--ivory,#FAF9F6)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6 L5 9 L10 3"/></svg>';
    } else {
      chk.style.background = 'transparent';
      chk.style.borderColor = 'var(--line,#D8D8D0)';
      chk.innerHTML = '';
    }
  });
  row.appendChild(chk);

  var info = h('div', { style: 'flex:1;min-width:0;cursor:pointer;' });
  info.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
  }, food.name));
  // 2026-04 UX : si une portion "naturelle" existe (1 burger, 1 part, 1 c. à soupe...),
  // afficher les macros pour 1 portion plutôt que par 100g.
  // « On mange 1 Whopper, pas 100 g de Whopper. »
  var _defP = (window.FOOD_PORTIONS && window.FOOD_PORTIONS.getDefaultPortion)
    ? window.FOOD_PORTIONS.getDefaultPortion(food.name) : null;
  var metaLine;
  if (_defP && _defP.g) {
    var _f = _defP.g / 100;
    metaLine = _defP.label + ' \u00b7 ' + Math.round(food.kcal * _f) + ' kcal \u00b7 P '
      + (Math.round(food.protein * _f * 10) / 10) + 'g \u00b7 G '
      + (Math.round(food.carbs * _f * 10) / 10) + 'g \u00b7 L '
      + (Math.round(food.fat * _f * 10) / 10) + 'g';
  } else {
    metaLine = Math.round(food.kcal) + ' kcal/100g \u00b7 P ' + food.protein + 'g \u00b7 G ' + food.carbs + 'g \u00b7 L ' + food.fat + 'g';
  }
  if (source === 'off' && food.brand) metaLine = food.brand + ' \u00b7 ' + metaLine;
  info.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;'
  }, metaLine));
  row.appendChild(info);

  var isFav = _fjIsFav(food.name);
  var favStarColor = isFav ? 'var(--black,#0A0A09)' : 'var(--line,#D8D8D0)';
  var favStar = h('button', {
    'aria-label': (window.isEnglish && window.isEnglish()) ? (isFav ? 'Remove from favorites' : 'Add to favorites') : (isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'),
    style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;'
      + 'background:none;border:none;cursor:pointer;flex-shrink:0;'
  });
  favStar.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="' + (isFav ? favStarColor : 'none') + '" stroke="' + favStarColor + '" stroke-width="1.2" stroke-linejoin="round"><path d="M7 1.5 L8.6 5.3 L12.7 5.7 L9.5 8.5 L10.5 12.5 L7 10.3 L3.5 12.5 L4.5 8.5 L1.3 5.7 L5.4 5.3 Z"/></svg>';
  favStar.addEventListener('click', function(e) {
    e.stopPropagation();
    _fjToggleFav(food);
    _fjRefreshResults();
  });
  row.appendChild(favStar);

  info.addEventListener('click', function() {
    _fjState.selectedFood = food;
    // 2026-04 : si une portion par défaut existe pour cet aliment, on initialise
    // qty avec la portion (en grammes) et count = 1 (1 portion).
    // Sinon, mode "100g" classique.
    var defaultPortion = (window.FOOD_PORTIONS && window.FOOD_PORTIONS.getDefaultPortion)
      ? window.FOOD_PORTIONS.getDefaultPortion(food.name) : null;
    if (defaultPortion) {
      _fjState.portion = defaultPortion;     // {label, g}
      _fjState.portionCount = 1;
      _fjState.qty = defaultPortion.g;       // grammes effectifs
      _fjState.unitMode = 'portion';         // 'portion' ou 'grams'
    } else {
      _fjState.portion = null;
      _fjState.portionCount = 1;
      _fjState.qty = 100;
      _fjState.unitMode = 'grams';
    }
    _fjShowSelection();
  });

  return row;
}

function _fjFetchOFF(query) {
  // Already fetching same query — skip
  if (_fjOFF.loading && _fjOFF.lastQuery === query) return;
  // Same query cached — skip
  if (_fjOFF.results && _fjOFF.lastQuery === query) {
    _fjAppendOFFResults();
    return;
  }
  _fjOFF.loading = true;
  _fjOFF.lastQuery = query;
  _fjOFF.results = null;
  _fjAppendOFFResults(); // show spinner

  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function() { try { ctrl.abort(); } catch(e) {} }, 8000) : null;
  _fjOFF.ctrl = ctrl;  // 2026-04 N2 : expose pour bouton Annuler manuel

  try {
    // 2026-04 R5 : lc=fr + cc=fr pour prioriser noms français + produits FR
    window.fetch(
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(query) +
      '&search_simple=1&action=process&json=1&page_size=14&lc=fr&cc=fr' +
      '&fields=product_name,brands,nutriments',
      { signal: ctrl ? ctrl.signal : undefined }
    ).then(function(r) {
      if (timer) clearTimeout(timer);
      return r.json();
    }).then(function(data) {
      // Guard : if the user has changed the query during fetch, discard these results
      if (_fjOFF.lastQuery !== query) return;
      var results = [];
      if (data && Array.isArray(data.products)) {
        for (var i = 0; i < data.products.length && results.length < 12; i++) {
          var p = data.products[i];
          if (!p || !p.product_name) continue;
          var n = p.nutriments || {};
          // OFF uses various field names; fallback kJ→kcal when kcal missing
          var kcal = Number(n['energy-kcal_100g']) || Number(n['energy-kcal']) || 0;
          if (kcal <= 0) {
            var kj = Number(n['energy_100g']) || Number(n['energy-kj_100g']) || Number(n['energy']) || 0;
            if (kj > 0) kcal = Math.round(kj / 4.184);
          }
          if (kcal < 0 || kcal > 1500) continue; // skip negative or implausible
          if (kcal === 0) {
            // Accept 0-kcal products (e.g. water, some spices) but require at least some nutriment info
            var hasMacros = Number(n['proteins_100g']) > 0 || Number(n['carbohydrates_100g']) > 0 || Number(n['fat_100g']) > 0;
            if (!hasMacros) continue;
          }
          var prot = Number(n['proteins_100g']) || 0;
          var carbs = Number(n['carbohydrates_100g']) || 0;
          var fat = Number(n['fat_100g']) || 0;
          results.push({
            name: String(p.product_name).slice(0, 80),
            brand: p.brands ? String(p.brands).split(',')[0].slice(0, 30) : '',
            kcal: Math.round(kcal),
            protein: Math.round(prot * 10) / 10,
            carbs: Math.round(carbs * 10) / 10,
            fat: Math.round(fat * 10) / 10,
            _off: true
          });
        }
      }
      _fjOFF.results = results;
      _fjOFF.loading = false;
      _fjAppendOFFResults();
    }).catch(function(err) {
      if (timer) clearTimeout(timer);
      if (_fjOFF.lastQuery !== query) return;
      _fjOFF.results = [];
      _fjOFF.loading = false;
      _fjAppendOFFResults();
    });
  } catch(e) {
    _fjOFF.loading = false;
    _fjOFF.results = [];
  }
}

function _fjAppendOFFResults() {
  var box = document.getElementById('fj-results');
  if (!box) return;
  // Remove any existing OFF section to avoid duplicates
  var old = document.getElementById('fj-off-section');
  if (old) old.parentNode.removeChild(old);

  var sec = h('div', { id: 'fj-off-section' });

  // Separator + label
  sec.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:12px;padding:8px 4px 6px;border-top:1px solid var(--line,#D8D8D0);'
  }, 'Base mondiale OpenFoodFacts'));

  if (_fjOFF.loading) {
    // 2026-04 N2 : spinner + bouton Annuler pour sortir d'un fetch bloqué
    var loadRow = h('div', {
      style: 'padding:10px 4px;display:flex;align-items:center;justify-content:space-between;gap:8px;'
    });
    loadRow.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'
    }, (window.isEnglish && window.isEnglish()) ? 'Searching online products\u2026' : 'Recherche de produits en ligne\u2026'));
    var cancelBtn = h('button', {
      type: 'button',
      style: 'background:none;border:1px solid var(--line,#D8D8D0);padding:6px 12px;min-height:32px;cursor:pointer;'
        + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);border-radius:2px;'
    }, (window.isEnglish && window.isEnglish()) ? 'Cancel' : 'Annuler');
    cancelBtn.addEventListener('click', function() {
      try { if (_fjOFF.ctrl) _fjOFF.ctrl.abort(); } catch(e) {}
      _fjOFF.loading = false;
      _fjOFF.results = [];
      _fjOFF.ctrl = null;
      _fjAppendOFFResults();
    });
    loadRow.appendChild(cancelBtn);
    sec.appendChild(loadRow);
  } else if (Array.isArray(_fjOFF.results)) {
    // 2026-04 R5 : déduplication vs résultats locaux par nom normalisé
    var _normFn = (window.FOOD_PORTIONS && window.FOOD_PORTIONS._normalize) ? window.FOOD_PORTIONS._normalize : function(s){return String(s||'').toLowerCase();};
    var localSet = _fjOFF.localNames || {};
    var filtered = _fjOFF.results.filter(function(f) {
      if (!f || !f.name) return false;
      var n = _normFn(f.name);
      if (!n) return true; // garde l'entrée si la normalisation échoue (défense)
      return !localSet[n];
    });
    if (filtered.length === 0) {
      sec.appendChild(h('div', {
        style: 'padding:8px 4px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'
      }, _fjOFF.results.length > 0 ? ((window.isEnglish && window.isEnglish()) ? 'Already in SmartFitCoach database.' : 'D\u00e9j\u00e0 dans la base SmartFitCoach.') : ((window.isEnglish && window.isEnglish()) ? 'No matching product online.' : 'Aucun produit correspondant en ligne.')));
    } else {
      filtered.forEach(function(food) {
        sec.appendChild(_fjRenderFoodRow(food, 'off'));
      });
    }
  }
  box.appendChild(sec);
  _fjUpdateMultiCTA();
}

function _fjRenderSavedMeals(box) {
  var saved = _fjGetSavedMeals();
  if (saved.length === 0) {
    box.appendChild(h('div', {
      style: 'padding:20px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;'
    }, (window.isEnglish && window.isEnglish()) ? 'No saved meals.\nLog a meal and tap \u00ab Save this meal \u00bb.' : 'Aucun repas sauvegardé.\nLoggez un repas puis touchez « Sauvegarder ce repas ».'));
    return;
  }
  box.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);padding:4px 4px 8px;'
  }, ((window.isEnglish && window.isEnglish()) ? 'My meals · ' : 'Mes repas · ') + saved.length + ' ' + window.locPlural(saved.length, {fr:{one:'sauvegardé',other:'sauvegardés'},en:{one:'saved',other:'saved'}})));

  saved.forEach(function(meal) {
    if (!meal || !meal.entries) return;
    var totalKcal = meal.entries.reduce(function(s, e) { return s + (Number(e.kcal) || 0); }, 0);
    var row = h('div', {
      style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 4px;border-bottom:1px solid var(--line,#D8D8D0);'
    });
    var info = h('div', { style: 'flex:1;min-width:0;cursor:pointer;' });
    info.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
    }, meal.name));
    info.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;'
    }, meal.entries.length + ' ' + window.locPlural(meal.entries.length, {fr:{one:'aliment',other:'aliments'},en:{one:'item',other:'items'}}) + ' \u00b7 ' + Math.round(totalKcal) + ' kcal'));
    row.appendChild(info);

    // Bouton re-logger
    var logBtn = h('button', {
      type: 'button',
      'aria-label': 'Re-logger ' + meal.name,
      style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0 10px;'
        + 'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;cursor:pointer;flex-shrink:0;'
        + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;margin-left:6px;'
    }, '+');
    logBtn.addEventListener('click', function() {
      if (!window.FOOD_JOURNAL || !window.FOOD_JOURNAL.addEntry) return;
      meal.entries.forEach(function(e) {
        window.FOOD_JOURNAL.addEntry(
          _fjState.meal, e.name,
          e.kcal || 0, e.p || 0, e.g || 0, e.l || 0,
          e.qty || '100g'
        );
      });
      _fjState.showSavedMeals = false;
      _reRenderFJCard();
      if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? '\u00ab ' + meal.name + ' \u00bb added!' : '\u00ab ' + meal.name + ' \u00bb ajouté !', 'success', 2000);
    });
    row.appendChild(logBtn);

    // Bouton supprimer
    var delBtn = h('button', {
      type: 'button',
      'aria-label': (window.isEnglish && window.isEnglish()) ? 'Remove ' + meal.name : 'Supprimer ' + meal.name,
      style: 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;min-height:44px;padding:0;'
        + 'background:none;border:none;cursor:pointer;color:var(--grey,#6B6B65);flex-shrink:0;margin-left:2px;'
    });
    delBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M2 2 L10 10 M10 2 L2 10"/></svg>';
    delBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var _delMealMsg = (window.isEnglish && window.isEnglish()) ? ('Delete "' + meal.name + '"?') : ('Supprimer « ' + meal.name + ' » ?');
      if (!(window.sfcConfirm ? window.sfcConfirm(_delMealMsg) : window.confirm(_delMealMsg))) return;
      _fjDeleteSavedMeal(meal.id);
      _fjRefreshResults();
    });
    row.appendChild(delBtn);
    box.appendChild(row);
  });
}

function _fjRefreshResults() {
  var box = document.getElementById('fj-results');
  if (!box) return;
  box.innerHTML = '';

  // Phase 3 M : mode "Mes Repas"
  if (_fjState.showSavedMeals) {
    _fjRenderSavedMeals(box);
    return;
  }

  var list = [];
  var allowOFF = false;

  if (_fjState.showFavs) {
    list = _fjGetFavs();
    if (list.length === 0) {
      box.appendChild(h('div', {
        style: 'padding:16px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);'
      }, (window.isEnglish && window.isEnglish()) ? 'No favorites yet. Tap the star on a result to add one.' : 'Aucun favori pour l\'instant. Touchez l\'\u00e9toile d\'un r\u00e9sultat pour en ajouter.'));
      return;
    }
  } else if (_fjState.query && _fjState.query.length >= 2) {
    list = (window.FOOD_CALC && window.FOOD_CALC.search) ? window.FOOD_CALC.search(_fjState.query) : [];
    if (list.length > 40) list = list.slice(0, 40);
    // 2026-04 R5 : OFF seulement >= 3 chars (évite spam fetch sur saisie courte)
    allowOFF = (_fjState.query.length >= 3);
    // 2026-04 R5 : mémoriser noms locaux normalisés pour déduplication OFF
    _fjOFF.localNames = {};
    var _normFn = (window.FOOD_PORTIONS && window.FOOD_PORTIONS._normalize) ? window.FOOD_PORTIONS._normalize : function(s){return String(s||'').toLowerCase();};
    for (var li = 0; li < list.length; li++) {
      var ln = _normFn(list[li].name || '');
      if (ln) _fjOFF.localNames[ln] = 1;
    }
  } else {
    // 2026-04 SIMPL-A : au lieu d'un écran vide "saisissez…", afficher les aliments
    // récemment loggés comme quick-add (Sarah : "pas de raccourci pour les aliments courants")
    var recentFoods = [];
    try {
      var uid = (window.AUTH && window.AUTH.getUser) ? (window.AUTH.getUser() || {}).id : 'anon';
      var journalKey = 'mtd_food_journal_' + (uid || 'anon');
      var journal = JSON.parse(localStorage.getItem(journalKey) || '{}');
      // Parcourir les 7 derniers jours, collecter les aliments uniques par nom
      var days = Object.keys(journal).sort().reverse().slice(0, 7);
      var seen = {};
      for (var d = 0; d < days.length; d++) {
        var entries = journal[days[d]] || [];
        // Parcourir du plus récent au plus ancien
        for (var ei = entries.length - 1; ei >= 0; ei--) {
          var e = entries[ei];
          if (!e || !e.name || seen[e.name]) continue;
          seen[e.name] = true;
          recentFoods.push({
            name: e.name,
            kcal: e.kcal || 0,
            protein: e.p || 0,
            carbs: e.g || 0,
            fat: e.l || 0
          });
          if (recentFoods.length >= 8) break;
        }
        if (recentFoods.length >= 8) break;
      }
    } catch(e) { recentFoods = []; }

    if (recentFoods.length > 0) {
      box.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);padding:4px 4px 6px;'
      }, (window.isEnglish && window.isEnglish()) ? 'Recent · quick add' : 'Récents · ajout rapide'));
      recentFoods.forEach(function(food) {
        box.appendChild(_fjRenderFoodRow(food, 'recent'));
      });
      box.appendChild(h('div', {
        style: 'padding:12px 4px 4px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);'
      }, (window.isEnglish && window.isEnglish()) ? 'Or enter 2+ characters to search the database.' : 'Ou saisissez 2+ caractères pour rechercher dans la base.'));
    } else {
      box.appendChild(h('div', {
        style: 'padding:12px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);'
      }, (window.isEnglish && window.isEnglish()) ? 'Enter at least two characters to search for a food.' : 'Saisissez au moins deux caractères pour chercher un aliment.'));
    }
    _fjOFF.results = null;
    return;
  }

  // Local results header (only if we'll also show OFF)
  if (list.length > 0 && allowOFF) {
    box.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);padding:4px 4px 6px;'
    }, ((window.isEnglish && window.isEnglish()) ? 'Curated database \u00b7 ' : 'Base cur\u00e9e \u00b7 ') + list.length + ' ' + window.locPlural(list.length, {fr:{one:'r\u00e9sultat',other:'r\u00e9sultats'},en:{one:'result',other:'results'}})));
  } else if (list.length === 0 && allowOFF) {
    box.appendChild(h('div', {
      style: 'padding:12px 4px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'
    }, (window.isEnglish && window.isEnglish()) ? 'No result in curated database. Searching online\u2026' : 'Aucun r\u00e9sultat dans la base cur\u00e9e. Recherche en ligne en cours\u2026'));
  }

  list.forEach(function(food) {
    box.appendChild(_fjRenderFoodRow(food, 'local'));
  });

  // Phase 2 N : update multi-add CTA after results rendered
  _fjUpdateMultiCTA();

  // Fire OFF fetch if we are searching a query (not favs)
  if (allowOFF) {
    _fjFetchOFF(_fjState.query);
  }
}

// 2026-04 FIX FOCUS CRITIQUE : update live macros SANS rebuild DOM
// (sinon l'input perd le focus → clavier mobile se ferme entre chaque chiffre)
function _fjUpdateMacrosLive() {
  if (!_fjState.selectedFood) return;
  var food = _fjState.selectedFood;
  var qty = _fjState.qty;
  // Recalculer qty si mode portion (au cas où portionCount a changé)
  if (_fjState.unitMode === 'portion' && _fjState.portion) {
    qty = Math.round(_fjState.portion.g * (_fjState.portionCount || 1));
    _fjState.qty = qty;
  }
  var fac = qty / 100;
  var kcal = Math.round(food.kcal * fac);
  var p = Math.round(food.protein * fac * 10) / 10;
  var g = Math.round(food.carbs * fac * 10) / 10;
  var l = Math.round(food.fat * fac * 10) / 10;
  var el = document.getElementById('fj-live-macros');
  if (el) el.textContent = kcal + ' kcal \u00b7 Prot ' + p + 'g \u00b7 Gluc ' + g + 'g \u00b7 Lip ' + l + 'g';
  // MAJ aussi le label "X g total" du compteur portions s'il existe
  var totalEl = document.getElementById('fj-portion-total');
  if (totalEl && _fjState.unitMode === 'portion' && _fjState.portion) {
    totalEl.textContent = _fjState.portion.label + ' \u00b7 ' + qty + ' g total';
  }
  // MAJ aussi le label du bouton CTA "Ajouter à X" (recalcule pour preview avant click)
}

function _fjShowSelection() {
  var box = document.getElementById('fj-selected');
  if (!box || !_fjState.selectedFood) return;
  box.style.display = 'block';
  box.innerHTML = '';

  var food = _fjState.selectedFood;
  var qty = _fjState.qty;
  // 2026-04 : calcul intelligent selon unitMode (portion ou grams)
  // qty est TOUJOURS en grammes effectifs (calculé depuis portionCount × portion.g si mode portion)
  var unitMode = _fjState.unitMode || 'grams';
  var portion = _fjState.portion;
  var portionCount = _fjState.portionCount || 1;
  if (unitMode === 'portion' && portion) {
    qty = Math.round(portion.g * portionCount);
    _fjState.qty = qty;
  }
  var factor = qty / 100;
  var kcal = Math.round(food.kcal * factor);
  var p = Math.round(food.protein * factor * 10) / 10;
  var g = Math.round(food.carbs * factor * 10) / 10;
  var l = Math.round(food.fat * factor * 10) / 10;

  box.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:14px;color:var(--black,#0A0A09);margin-bottom:8px;'
  }, food.name));

  // ─── SÉLECTEUR DE PORTION (si dispo) ───
  var allPortions = (window.FOOD_PORTIONS && window.FOOD_PORTIONS.getPortions)
    ? window.FOOD_PORTIONS.getPortions(food.name) : null;

  if (allPortions && allPortions.length && unitMode === 'portion') {
    // Sélecteur de format si plus d'une portion
    if (allPortions.length > 1) {
      var formatRow = h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' });
      formatRow.appendChild(h('label', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);min-width:48px;'
      }, 'Format'));
      var formatSelect = h('select', {
        style: 'flex:1;padding:8px 10px;min-height:40px;border:1px solid var(--line,#D8D8D0);border-radius:2px;background:var(--ivory,#FAF9F6);'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black,#0A0A09);outline:none;'
      });
      allPortions.forEach(function(opt, i) {
        var optEl = h('option', { value: String(i) }, opt.label + ' (' + opt.g + ' g)');
        if (portion && opt.label === portion.label && opt.g === portion.g) optEl.selected = true;
        formatSelect.appendChild(optEl);
      });
      formatSelect.addEventListener('change', function(e) {
        var idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && allPortions[idx]) {
          _fjState.portion = allPortions[idx];
          _fjShowSelection();
        }
      });
      formatRow.appendChild(formatSelect);
      box.appendChild(formatRow);
    }

    // Compteur de portions
    var pluralLabel = portion.label;
    if (portionCount > 1 && /^1\s/.test(pluralLabel)) {
      // Remplacer "1 X" par "N X(s)"
      var rest = pluralLabel.replace(/^1\s+/, '');
      // Pluriel basique : ajout 's' si pas déjà
      if (!/s$/i.test(rest.split(' ')[0])) rest = rest.replace(/^(\S+)/, '$1s');
      pluralLabel = portionCount + ' ' + rest;
    }

    // ─── Compteur portions avec STEPPER -/+ et input décimal (UX 2026-04) ───
    var countRow = h('div', { style: 'display:flex;align-items:center;gap:6px;margin-bottom:8px;' });
    countRow.appendChild(h('label', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);min-width:48px;'
    }, 'Combien'));
    // Stepper - large (44×44 mobile-friendly)
    var minusBtn = h('button', {
      type: 'button', 'aria-label': 'Diminuer',
      style: 'width:44px;height:40px;border:1px solid var(--line,#D8D8D0);background:transparent;cursor:pointer;border-radius:2px;font-size:18px;line-height:1;color:var(--black,#0A0A09);font-family:Georgia,serif;'
    }, '\u2212');
    // 2026-04 R4-M2 : type=text + inputmode=decimal pour accepter virgule FR ("2,5")
    var countInput = h('input', {
      type: 'text', inputmode: 'decimal',
      pattern: '[0-9]*[.,]?[0-9]*',
      autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false',
      'aria-label': 'Nombre de portions',
      value: String(portionCount),
      style: 'width:64px;padding:8px 6px;min-height:40px;border:1px solid var(--line,#D8D8D0);border-radius:2px;background:var(--ivory,#FAF9F6);'
        + 'font-family:Georgia,serif;font-size:16px;text-align:center;outline:none;font-weight:500;'
    });
    // 2026-04 R4-B2 : update countInput.value au lieu de re-render → focus stepper préservé
    minusBtn.addEventListener('click', function() {
      var v = (_fjState.portionCount || 1) - 0.5;
      if (v < 0.5) v = 0.5;
      _fjState.portionCount = v;
      countInput.value = String(v);
      _fjUpdateMacrosLive();
    });
    countRow.appendChild(minusBtn);
    countInput.addEventListener('input', function(e) {
      var raw = String(e.target.value || '').replace(',', '.');
      var v = parseFloat(raw);
      if (isNaN(v) || v < 0.5) v = 0.5;
      if (v > 20) {
        v = 20;
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Maximum 20 portions. For more, switch to grams mode.' : 'Maximum 20 portions. Pour plus, passez en mode grammes.', 'warning', 3000);
      }
      _fjState.portionCount = v;
      _fjUpdateMacrosLive();
    });
    countRow.appendChild(countInput);
    var plusBtn = h('button', {
      type: 'button', 'aria-label': 'Augmenter',
      style: 'width:44px;height:40px;border:1px solid var(--line,#D8D8D0);background:transparent;cursor:pointer;border-radius:2px;font-size:18px;line-height:1;color:var(--black,#0A0A09);font-family:Georgia,serif;'
    }, '+');
    plusBtn.addEventListener('click', function() {
      var v = (_fjState.portionCount || 1) + 0.5;
      if (v > 20) v = 20;
      _fjState.portionCount = v;
      countInput.value = String(v);
      _fjUpdateMacrosLive();
    });
    countRow.appendChild(plusBtn);
    // 2026-04 FIX FOCUS : id pour update live (sans rebuild input qui kill le focus mobile)
    countRow.appendChild(h('span', {
      id: 'fj-portion-total',
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);flex:1;text-align:right;'
    }, portion.label + ' \u00b7 ' + qty + ' g total'));
    box.appendChild(countRow);

    // Bascule mode (chip plus visible que lien underline)
    var switchToGrams = h('button', {
      type: 'button',
      style: 'background:transparent;border:1px solid var(--line,#D8D8D0);padding:6px 12px;cursor:pointer;color:var(--grey,#6B6B65);'
        + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;margin-bottom:10px;'
    }, 'Mode grammes');
    switchToGrams.addEventListener('click', function() {
      _fjState.unitMode = 'grams';
      _fjShowSelection();
    });
    box.appendChild(switchToGrams);
  } else {
    // Mode grammes : input + presets rapides 50/100/150/200g (UX 2026-04)
    var qtyRow = h('div', { style: 'display:flex;align-items:center;gap:6px;margin-bottom:8px;' });
    qtyRow.appendChild(h('label', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);min-width:48px;'
    }, (window.isEnglish && window.isEnglish()) ? 'Quantity' : 'Quantit\u00e9'));
    var minusG = h('button', { type: 'button', 'aria-label': '-10g',
      style: 'width:44px;height:40px;border:1px solid var(--line,#D8D8D0);background:transparent;cursor:pointer;border-radius:2px;font-size:18px;line-height:1;color:var(--black,#0A0A09);font-family:Georgia,serif;'
    }, '\u2212');
    qtyRow.appendChild(minusG);
    var qtyInput = h('input', {
      type: 'text', inputmode: 'numeric',
      pattern: '[0-9]*',
      autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false',
      'aria-label': (window.isEnglish && window.isEnglish()) ? 'Quantity in grams' : 'Quantit\u00e9 en grammes',
      value: String(qty),
      style: 'width:80px;padding:8px 6px;min-height:40px;border:1px solid var(--line,#D8D8D0);border-radius:2px;background:var(--ivory,#FAF9F6);'
        + 'font-family:Georgia,serif;font-size:16px;text-align:center;outline:none;font-weight:500;'
    });
    minusG.addEventListener('click', function() {
      var v = (_fjState.qty || 100) - 10;
      if (v < 1) v = 1;
      _fjState.qty = v; _fjState.unitMode = 'grams';
      qtyInput.value = String(v);
      _fjUpdateMacrosLive();
    });
    qtyInput.addEventListener('input', function(e) {
      var raw = String(e.target.value || '').replace(',', '.');
      var v = parseInt(raw, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 2000) v = 2000;
      _fjState.qty = v;
      _fjState.unitMode = 'grams';
      _fjUpdateMacrosLive();
    });
    qtyRow.appendChild(qtyInput);
    var plusG = h('button', { type: 'button', 'aria-label': '+10g',
      style: 'width:44px;height:40px;border:1px solid var(--line,#D8D8D0);background:transparent;cursor:pointer;border-radius:2px;font-size:18px;line-height:1;color:var(--black,#0A0A09);font-family:Georgia,serif;'
    }, '+');
    plusG.addEventListener('click', function() {
      var v = (_fjState.qty || 100) + 10;
      if (v > 2000) v = 2000;
      _fjState.qty = v; _fjState.unitMode = 'grams';
      qtyInput.value = String(v);
      _fjUpdateMacrosLive();
    });
    qtyRow.appendChild(plusG);
    qtyRow.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'
    }, 'g'));
    box.appendChild(qtyRow);

    // Quick presets grammes (50, 100, 150, 200, 250)
    var presetRow = h('div', { style: 'display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;' });
    [50, 100, 150, 200, 250].forEach(function(preset) {
      var isActive = qty === preset;
      var pBtn = h('button', {
        type: 'button',
        style: 'flex:1;min-width:50px;padding:6px 4px;cursor:pointer;border:1px solid var(--line,#D8D8D0);'
          + 'background:' + (isActive ? 'var(--black,#0A0A09)' : 'transparent') + ';'
          + 'color:' + (isActive ? 'var(--ivory,#FAF9F6)' : 'var(--black,#0A0A09)') + ';'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;border-radius:2px;'
      }, preset + ' g');
      pBtn.addEventListener('click', function() {
        _fjState.qty = preset; _fjState.unitMode = 'grams'; _fjShowSelection();
      });
      presetRow.appendChild(pBtn);
    });
    box.appendChild(presetRow);

    // Bouton retour aux portions si dispo (chip visible)
    if (allPortions && allPortions.length) {
      var switchToPortion = h('button', {
        type: 'button',
        style: 'background:transparent;border:1px solid var(--line,#D8D8D0);padding:6px 12px;cursor:pointer;color:var(--grey,#6B6B65);'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;margin-bottom:10px;'
      }, 'Mode portion');
      switchToPortion.addEventListener('click', function() {
        _fjState.unitMode = 'portion';
        if (!_fjState.portion) _fjState.portion = allPortions[0];
        _fjState.portionCount = 1;
        _fjState.qty = _fjState.portion.g;
        _fjShowSelection();
      });
      box.appendChild(switchToPortion);
    }
  }

  // 2026-04 FIX FOCUS : id sur le bloc macros pour update live SANS re-render
  // (avant : _fjShowSelection() rebuilt tout → input perdait le focus → clavier mobile se fermait à chaque keystroke)
  box.appendChild(h('div', {
    id: 'fj-live-macros',
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black,#0A0A09);margin-bottom:12px;line-height:1.6;font-weight:400;'
  }, kcal + ' kcal \u00b7 Prot ' + p + 'g \u00b7 Gluc ' + g + 'g \u00b7 Lip ' + l + 'g'));

  var _sfEN = window.isEnglish && window.isEnglish();
  var MEAL_FULL = _sfEN
    ? { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }
    : { breakfast: 'Petit-d\u00e9jeuner', lunch: 'D\u00e9jeuner', snack: 'Collation', dinner: 'D\u00eener' };
  var addBtn = h('button', {
    style: 'width:100%;padding:12px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;cursor:pointer;'
      + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;min-height:44px;'
  }, (_sfEN ? 'Add to ' : 'Ajouter \u00e0 ') + (MEAL_FULL[_fjState.meal] || (_sfEN ? 'this meal' : 'ce repas')));
  addBtn.addEventListener('click', function() {
    if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.addEntry) {
      // 2026-04 R4-B2 : recompute LIVE au click (closure stale après refacto +/- sans rebuild)
      var qtyNow = _fjState.qty;
      if (_fjState.unitMode === 'portion' && _fjState.portion) {
        qtyNow = Math.round(_fjState.portion.g * (_fjState.portionCount || 1));
      }
      var facNow = qtyNow / 100;
      var kcalNow = Math.round(food.kcal * facNow);
      var pNow = Math.round(food.protein * facNow * 10) / 10;
      var gNow = Math.round(food.carbs * facNow * 10) / 10;
      var lNow = Math.round(food.fat * facNow * 10) / 10;
      // 2026-04 : libellé lisible si on est en mode portion (ex "1 burger" au lieu de "215g")
      var label = qtyNow + 'g';
      if (_fjState.unitMode === 'portion' && _fjState.portion) {
        var pCount = _fjState.portionCount || 1;
        var pLab = _fjState.portion.label;
        if (pCount === 1) label = pLab + ' (' + qtyNow + 'g)';
        else {
          // Pluralisation simple
          var rest = pLab.replace(/^1\s+/, '');
          if (!/s$/i.test(rest.split(' ')[0])) rest = rest.replace(/^(\S+)/, '$1s');
          label = pCount + ' ' + rest + ' (' + qtyNow + 'g)';
        }
      }
      window.FOOD_JOURNAL.addEntry(
        _fjState.meal,
        food.name,
        kcalNow, pNow, gNow, lNow,
        label
      );
      _fjState.selectedFood = null;
      _fjState.query = '';
      _fjState.portion = null;
      _fjState.portionCount = 1;
      _fjState.unitMode = 'grams';
      _reRenderFJCard();
    }
  });
  box.appendChild(addBtn);
}

function _fjBuildEntriesList(container) {
  container.innerHTML = '';
  var entries = (window.FOOD_JOURNAL && window.FOOD_JOURNAL.getToday) ? window.FOOD_JOURNAL.getToday() : [];
  var mealEntries = entries.filter(function(e) { return e && e.meal === _fjState.meal; });

  var _blEN = window.isEnglish && window.isEnglish();
  var MEAL_LABELS = _blEN
    ? { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }
    : { breakfast: 'Petit-d\u00e9jeuner', lunch: 'D\u00e9jeuner', snack: 'Collation', dinner: 'D\u00eener' };
  var header = h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;padding-top:8px;border-top:1px solid var(--line,#D8D8D0);'
  }, MEAL_LABELS[_fjState.meal] + ' \u00b7 ' + mealEntries.length + ' ' + window.locPlural(mealEntries.length, {fr:{one:'aliment',other:'aliments'},en:{one:'item',other:'items'}}));
  container.appendChild(header);

  if (mealEntries.length === 0) {
    container.appendChild(h('div', {
      style: 'padding:8px 4px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);'
    }, (window.isEnglish && window.isEnglish()) ? 'No food logged for this meal.' : 'Aucun aliment consign\u00e9 pour ce repas.'));
    return;
  }

  // Build index map to safely delete by absolute index
  var allEntries = entries;
  mealEntries.forEach(function(entry) {
    var absIdx = allEntries.indexOf(entry);
    var row = h('div', {
      style: 'display:flex;align-items:center;justify-content:space-between;padding:6px 4px;border-bottom:1px solid var(--line,#D8D8D0);'
    });
    var info = h('div', { style: 'flex:1;min-width:0;' });
    info.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-size:12px;color:var(--black,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
    }, entry.name + (entry.qty ? ' (' + entry.qty + ')' : '')));
    info.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);'
    }, Math.round(entry.kcal || 0) + ' kcal'));
    row.appendChild(info);

    var del = h('button', {
      'aria-label': (window.isEnglish && window.isEnglish()) ? 'Remove this food' : 'Retirer cet aliment',
      style: 'display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;'
        + 'background:none;border:none;cursor:pointer;color:var(--grey,#6B6B65);flex-shrink:0;'
    });
    // SVG croix 12×12 trait 1.2px
    del.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M2 2 L10 10 M10 2 L2 10"/></svg>';
    del.addEventListener('click', function() {
      if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.removeEntry) {
        // 2026-04 NIVEAU 1 : confirmation avant suppression aliment du journal
        var entryName = (entry && entry.name) || 'cet aliment';
        var _rmEntryMsg = (window.isEnglish && window.isEnglish()) ? ('Remove "' + entryName + '" from the journal?') : ('Retirer « ' + entryName + ' » du journal ?');
        if (!(window.sfcConfirm ? window.sfcConfirm(_rmEntryMsg) : window.confirm(_rmEntryMsg))) return;
        var today = new Date().toISOString().slice(0, 10);
        window.FOOD_JOURNAL.removeEntry(today, absIdx);
        _reRenderFJCard();
      }
    });
    row.appendChild(del);
    container.appendChild(row);
  });

  // ─── Actions contextuelles (bas de liste) ───
  var actionsRow = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;' });

  // Phase 3 O : Copier d'hier (si hier a des entrées pour ce repas)
  var yesterdayItems = _fjYesterdayEntries(_fjState.meal);
  if (yesterdayItems.length > 0) {
    var copyBtn = h('button', {
      type: 'button',
      style: 'padding:6px 14px;min-height:36px;border:1px solid var(--line,#D8D8D0);border-radius:2px;cursor:pointer;background:transparent;'
        + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);'
    }, (window.isEnglish && window.isEnglish()) ? ('Copy from yesterday (' + yesterdayItems.length + ')') : ('Copier d\'hier (' + yesterdayItems.length + ')'));
    copyBtn.addEventListener('click', function() {
      if (!window.FOOD_JOURNAL || !window.FOOD_JOURNAL.addEntry) return;
      yesterdayItems.forEach(function(e) {
        window.FOOD_JOURNAL.addEntry(
          _fjState.meal, e.name,
          e.kcal || 0, e.p || 0, e.g || 0, e.l || 0,
          e.qty || '100g'
        );
      });
      _reRenderFJCard();
      if (window.showToast) window.showToast(yesterdayItems.length + ' ' + window.locPlural(yesterdayItems.length, {fr:{one:'aliment copié',other:'aliments copiés'},en:{one:'item copied',other:'items copied'}}) + ' !', 'success', 2000);
    });
    actionsRow.appendChild(copyBtn);
  }

  // Phase 3 M : Sauvegarder ce repas
  var saveBtn = h('button', {
    type: 'button',
    style: 'padding:6px 14px;min-height:36px;border:1px solid var(--line,#D8D8D0);border-radius:2px;cursor:pointer;background:transparent;'
      + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);'
  }, (window.isEnglish && window.isEnglish()) ? 'Save this meal' : 'Sauvegarder ce repas');
  saveBtn.addEventListener('click', function() {
    var _savTitle = (window.isEnglish && window.isEnglish()) ? 'Save this meal' : 'Sauvegarder ce repas';
    todayModal(_savTitle, function(box, overlay) {
      var _ml2EN = window.isEnglish && window.isEnglish();
      var MEAL_LABELS2 = _ml2EN
        ? { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }
        : { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', snack: 'Collation', dinner: 'Dîner' };
      var defaultName = MEAL_LABELS2[_fjState.meal] || (_ml2EN ? 'My meal' : 'Mon repas');
      box.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin-bottom:10px;'
      }, mealEntries.length + ' ' + window.locPlural(mealEntries.length, {fr:{one:'aliment',other:'aliments'},en:{one:'item',other:'items'}}) + ((window.isEnglish && window.isEnglish()) ? ' — name this meal' : ' — donnez un nom à ce repas')));
      var inp = h('input', {
        type: 'text',
        placeholder: defaultName,
        value: defaultName,
        style: 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--line,#D8D8D0);border-radius:2px;'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;background:var(--ivory,#FAF9F6);min-height:44px;margin-bottom:12px;'
      });
      box.appendChild(inp);
      var confirmBtn = h('button', {
        style: 'width:100%;padding:12px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;cursor:pointer;'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;min-height:44px;'
      }, (window.isEnglish && window.isEnglish()) ? 'Save' : 'Sauvegarder');
      confirmBtn.addEventListener('click', function() {
        var name = (inp.value || '').trim() || defaultName;
        _fjSaveMeal(name, mealEntries.map(function(e) {
          return { name: e.name, kcal: e.kcal, p: e.p, g: e.g, l: e.l, qty: e.qty };
        }));
        document.body.removeChild(overlay);
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? '\u00ab ' + name + ' \u00bb saved!' : '\u00ab ' + name + ' \u00bb sauvegardé !', 'success', 2000);
      });
      box.appendChild(confirmBtn);
      setTimeout(function() { try { inp.select(); } catch(e2) {} }, 80);
    });
  });
  actionsRow.appendChild(saveBtn);

  if (actionsRow.children.length > 0) container.appendChild(actionsRow);
}

// ─── RENDER CARD 3 — Repas du jour ───
function renderCardRepas() {
  var S = window.S;
  if (!S) return null;
  // Sport-only : pas de plan nutritionnel, masquer la carte
  if (S.appMode === 'sport') return null;

  var c = card();
  // Bible Hermès §13.2 : pas d'eyebrow redondant — titre Georgia suffit.

  if (!Array.isArray(S.weekPlan) || S.weekPlan.length < 7) {
    // No plan — empty state engageant (Hermès : vouvoiement, micro-caps, tap target ≥ 48px)
    var _emptyCard = h('div', {style: 'text-align:center;padding:36px 16px 28px;'});
    _emptyCard.appendChild(emptyIllu('nutrition'));
    _emptyCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin:4px 0 10px;font-weight:normal;color:var(--black,#0A0A09);line-height:1.3;max-width:240px;margin-left:auto;margin-right:auto;'}, (window.isEnglish && window.isEnglish()) ? 'Your nutrition plan awaits' : 'Votre plan nutritionnel vous attend'));
    _emptyCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);margin-bottom:20px;line-height:1.55;max-width:260px;margin-left:auto;margin-right:auto;'}, (window.isEnglish && window.isEnglish()) ? 'Calibrated to your body, your goals, and your lifestyle.' : 'Calibré sur votre corps, vos objectifs et votre quotidien.'));
    _emptyCard.appendChild(h('button', {
      style: 'padding:14px 24px;min-height:48px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
      onclick: function() { if (!window.S) return; window.S.view = 'nutrition'; if (window.render) window.render(); }
    }, (window.isEnglish && window.isEnglish()) ? 'Build my plan' : 'Composer mon plan'));
    _emptyCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:14px;'}, (window.isEnglish && window.isEnglish()) ? '5 min \u00b7 Free \u00b7 Personalized' : '5 min \u00b7 Gratuit \u00b7 Personnalis\u00e9'));
    c.appendChild(_emptyCard);
    return c;
  }

  var todayIdx = (new Date().getDay() + 6) % 7;
  if (todayIdx >= S.weekPlan.length) { todayIdx = 0; }
  var dayData = S.weekPlan[todayIdx];
  if (!dayData) return null;

  var _slotsEN = window.isEnglish && window.isEnglish();
  var SLOTS = [
    { key: 'breakfast', label: _slotsEN ? 'Breakfast' : 'Petit-déjeuner' },
    { key: 'lunch', label: _slotsEN ? 'Lunch' : 'Déjeuner' },
    { key: 'snack', label: _slotsEN ? 'Snack' : 'Collation' },
    { key: 'dinner', label: _slotsEN ? 'Dinner' : 'Dîner' }
  ];

  var _tlNow = new Date(); var todayKey = _tlNow.getFullYear() + '-' + String(_tlNow.getMonth()+1).padStart(2,'0') + '-' + String(_tlNow.getDate()).padStart(2,'0');
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
        ? 'background:var(--green,#3E5C3A);border:1px solid var(--green,#3E5C3A);color:var(--ivory,#FAF9F6);font-size:10px;padding:6px 10px;min-height:44px;cursor:pointer;margin-left:8px;flex-shrink:0;font-family:"Helvetica Neue",Arial,sans-serif;border-radius:2px;'
        : 'background:transparent;border:1px solid var(--border);color:var(--grey);font-size:10px;padding:6px 10px;min-height:44px;cursor:pointer;margin-left:8px;flex-shrink:0;font-family:"Helvetica Neue",Arial,sans-serif;border-radius:2px;',
      title: isLogged ? ((window.isEnglish && window.isEnglish()) ? 'Click to uncheck' : 'Cliquer pour d\u00e9cocher') : ((window.isEnglish && window.isEnglish()) ? 'Mark as taken' : 'Marquer comme pris'),
      onclick: function(e) {
        e.stopPropagation();
        S.mealsLogged = S.mealsLogged || {};
        var _tkNow = new Date(); var tk = _tkNow.getFullYear() + '-' + String(_tkNow.getMonth()+1).padStart(2,'0') + '-' + String(_tkNow.getDate()).padStart(2,'0');
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
    }, isLogged ? ((window.isEnglish && window.isEnglish()) ? '\u2713 Taken' : '\u2713 Pris') : ((window.isEnglish && window.isEnglish()) ? 'Mark taken' : 'Marquer pris'));

    row.appendChild(left);
    row.appendChild(kcalEl);

    // FIX 2026-04-16 : bouton scanner par slot (ouvre PLATE_SCAN pour ce repas)
    if (window.PLATE_SCAN) {
      var _scanSlotBtn = h('button', {
        style: 'background:none;border:1px solid var(--border,#E8E6DF);border-radius:2px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-left:4px;flex-shrink:0;padding:0;',
        title: 'Scanner un repas pour remplacer',
        'aria-label': 'Scanner ' + slot.label,
        onclick: (function(_sk) { return function(e) { e.stopPropagation(); window.PLATE_SCAN.open(_sk); }; })(slotKey)
      });
      var _ssv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      _ssv.setAttribute('width','14'); _ssv.setAttribute('height','14');
      _ssv.setAttribute('viewBox','0 0 24 24'); _ssv.setAttribute('fill','none');
      _ssv.setAttribute('stroke','currentColor'); _ssv.setAttribute('stroke-width','1.5');
      _ssv.innerHTML = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';
      _scanSlotBtn.appendChild(_ssv);
      row.appendChild(_scanSlotBtn);
    }

    row.appendChild(prisBtn);
    c.appendChild(row);
  });

  if (!hasAny) return null;

  // ── Daily planned calorie total + micro progress bar ──
  var _rpEN = window.isEnglish && window.isEnglish();
  var _dayTotalK = 0;
  SLOTS.forEach(function(s2) { var m2 = dayData[s2.key]; if (m2 && m2.k) _dayTotalK += (m2.k || 0); });
  if (_dayTotalK > 0) {
    var _dayTarget = (typeof getCalorieTarget === 'function') ? getCalorieTarget() : 0;
    var _pct2 = _dayTarget > 0 ? Math.min(100, Math.round((_dayTotalK / _dayTarget) * 100)) : 0;
    var _barColor2 = (_dayTarget > 0 && _dayTotalK > _dayTarget * 1.1) ? '#C0392B' : ((_dayTarget > 0 && _dayTotalK < _dayTarget * 0.85) ? '#E67E22' : '#3E5C3A');
    var _totalDiv = h('div', { style: 'margin-top:12px;padding-top:10px;border-top:1px solid var(--line,#D8D8D0);' });
    var _totalRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;' });
    _totalRow.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);' }, _rpEN ? 'PLANNED TOTAL' : 'TOTAL PRÉVU'));
    _totalRow.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;color:var(--ink-900,#0A0A09);' }, Math.round(_dayTotalK) + (_dayTarget > 0 ? ' / ' + Math.round(_dayTarget) : '') + ' kcal'));
    _totalDiv.appendChild(_totalRow);
    if (_dayTarget > 0) {
      var _outerBar2 = h('div', { style: 'height:3px;background:var(--line,#D8D8D0);border-radius:0;overflow:hidden;' });
      _outerBar2.appendChild(h('div', { style: 'height:3px;background:' + _barColor2 + ';width:' + _pct2 + '%;transition:width .3s ease;' }));
      _totalDiv.appendChild(_outerBar2);
    }
    c.appendChild(_totalDiv);
  }


  // Compteur repas pris aujourd'hui
  var loggedCount = SLOTS.filter(function(slot) {
    return dayData[slot.key] && dayData[slot.key].n && mealsLoggedToday[slot.key] === true;
  }).length;
  var totalSlots = SLOTS.filter(function(slot) { return dayData[slot.key] && dayData[slot.key].n; }).length;
  var counterEl = h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:8px;'
  }, loggedCount + '/' + totalSlots + ' ' + ((window.isEnglish && window.isEnglish()) ? 'meals today' : 'repas aujourd\u2019hui'));
  c.appendChild(counterEl);

  // Plan revalidation nudge
  if (S.weekPlan && S.weekPlanValidated === false) {
    var _revalDiv = h('div', {
      style: 'margin-top:10px;padding:8px 12px;border-left:2px solid var(--orange,#E86F1E);background:rgba(232,111,30,0.05);display:flex;align-items:center;justify-content:space-between;cursor:pointer;',
      onclick: function() { S.view = 'nutrition'; S.nStep = 12; if (window.render) window.render(); }
    });
    _revalDiv.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--ink-700,#2B2B27);line-height:1.4;' }, _rpEN ? 'Settings changed — update your plan' : 'Paramètres modifiés — recalibrez votre plan'));
    _revalDiv.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;color:var(--orange,#E86F1E);white-space:nowrap;margin-left:8px;' }, _rpEN ? 'Update →' : 'Recalibrer →'));
    c.appendChild(_revalDiv);
  }

  // Footer link
  var link = h('div', {
    style: 'margin-top:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:right;cursor:pointer;',
    onclick: function() {
      S.view = 'nutrition';
      S.nStep = 12;
      S.selectedDay = todayIdx;
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? 'View my plan →' : 'Voir mon programme →');
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
  ctx.fillStyle = '#3E5C3A';
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
  var _canEN = window.isEnglish && window.isEnglish();
  var _dn = _canEN ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  var _mn = _canEN ? ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'] : ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
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

  // ── Monogramme Hermès §13.1 : pas d'emoji, chiffres romains Georgia ──
  ctx.font = '56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0A0A09';
  var monogram = streak >= 30 ? 'XXX+' : streak >= 7 ? 'VII+' : 'III';
  ctx.fillText(monogram, CX, 365);

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
  ctx.fillText((window.isEnglish && window.isEnglish()) ? 'CONSECUTIVE  DAYS' : 'JOURS  CONSÉCUTIFS', CX, 598);
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
  if (S.pregnant && window.isFemale(S)) {
    // Femme enceinte : afficher "Grossesse" même si S.goal est cut/shred (calcTarget() corrige les calories)
    goalLabel = 'Grossesse';
  } else if (window.GOALS && typeof S.goal === 'number' && window.GOALS[S.goal]) {
    goalLabel = window.GOALS[S.goal].name;
  } else if (S.appMode === 'sport') {
    goalLabel = (window.isEnglish && window.isEnglish()) ? 'Sports program' : 'Programme sportif';
  } else if (S.appMode === 'nutrition') {
    goalLabel = (window.isEnglish && window.isEnglish()) ? 'Custom nutrition' : 'Nutrition personnalisée';
  }
  if (goalLabel) {
    ctx.fillStyle = '#9A9A94';
    ctx.font = 'italic 24px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText((window.isEnglish && window.isEnglish() ? 'Goal \u00b7 ' : 'Objectif \u00b7 ') + goalLabel, CX, 740);
  }

  // ── Delta poids (si disponible) ──
  try {
    var _user = window.AUTH ? window.AUTH.getUser() : null;
    var _uid = _user ? _user.id : 'anon';
    var _wh = (Array.isArray(S.weightHistory) && S.weightHistory.length) ? S.weightHistory : [];
    if (!_wh.length) { try { _wh = JSON.parse(localStorage.getItem('mtd_weight_history_' + _uid) || '[]'); } catch(e2) {} }
    if (Array.isArray(_wh) && _wh.length >= 2) {
      _wh.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
      var _fw = parseFloat(_wh[0].weight);
      var _lw = parseFloat(_wh[_wh.length - 1].weight);
      if (!isNaN(_fw) && !isNaN(_lw) && _fw !== _lw) {
        var _d = _lw - _fw;
        ctx.fillStyle = _d < 0 ? '#4A8A5A' : '#C47A3A';
        ctx.font = '22px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((_d > 0 ? '+' : '') + _d.toFixed(1) + (window.isEnglish && window.isEnglish() ? ' kg since start' : ' kg depuis le départ'), CX, 790);
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
  var _todayStr = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
  var _isFirstDay = !_S.firstLoginDate || _S.firstLoginDate === _todayStr;
  if (streak === 1 && _isFirstDay && !lastBadge) {
    var _d1 = card();
    _d1.appendChild(eyebrow('PROGRESSION'));
    _d1.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1A1A1A;margin-bottom:8px;'}, (window.isEnglish && window.isEnglish()) ? 'Day 1' : 'Jour 1'));
    _d1.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:300;color:#888;line-height:1.6;'}, (window.isEnglish && window.isEnglish()) ? 'Build the habit. Come back tomorrow.' : 'La régularité commence aujourd\'hui. À demain.'));
    return _d1;
  }

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
    streakLabel.textContent = streak > 1 ? ((window.isEnglish && window.isEnglish()) ? 'Streak' : 'Séquence') : ((window.isEnglish && window.isEnglish()) ? 'Day 1' : 'Jour 1');

    streakWrap.appendChild(streakNum);
    streakWrap.appendChild(streakLabel);
    c.appendChild(streakWrap);

    // Message perte d'aversion — si streak ≥ 3 jours, rappelle l'enjeu
    if (streak >= 3) {
      var _lossMsg = h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange,#E86F1E);margin-top:6px;margin-bottom:4px;font-weight:500;'
      });
      _lossMsg.textContent = ((window.isEnglish && window.isEnglish()) ? ('Don\'t break your ' + streak + '-' + window.locPlural(streak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'day'}}) + ' streak!') : ('Ne cassez pas votre série de ' + streak + ' ' + window.locPlural(streak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + ' !'));
      c.appendChild(_lossMsg);
    }

    // Streak freeze badge
    var _sfS = window.S || {};
    if (_sfS.streakFreezeAvailable !== false) {
      var _freezeTag = h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);border:1px solid var(--border,#D8D8D0);background:transparent;padding:4px 10px;display:inline-block;margin-top:-4px;margin-bottom:8px;border-radius:2px;'
      }, (window.isEnglish && window.isEnglish()) ? '\u2744 1 freeze available' : '\u2744 1 joker disponible');
      c.appendChild(_freezeTag);
    }
  }

  // ── Last badge block ──
  if (lastBadge) {
    var badgeIcon = lastBadge.icon || '\u2605'; // ★ unicode safe (pas ⭐ emoji)
    var badgeName = lastBadge.name || lastBadge.id || 'Badge';
    var badgeDesc = lastBadge.desc || '';

    // Section label
    var badgeEyebrow = h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px;'
    });
    badgeEyebrow.textContent = (window.isEnglish && window.isEnglish()) ? 'LAST BADGE' : 'DERNIER BADGE';
    c.appendChild(badgeEyebrow);

    // Badge card — accent-tinted background, left accent border
    var badgeEl = h('div', {
      style: [
        'display:flex;',
        'align-items:center;',
        'gap:14px;',
        'padding:12px 14px;',
        'border:1px solid var(--line,#D8D8D0);',
        'border-left:3px solid var(--ink-900,#0A0A09);',
        'background:var(--paper-2,#F4F1EA);',
        'border-radius:0;'
      ].join('')
    });

    // Emoji icon in a small circle
    var iconWrap = h('div', {
      style: [
        'width:38px;height:38px;',
        'flex-shrink:0;',
        'display:flex;align-items:center;justify-content:center;',
        'background:var(--paper-3,#EEEAE0);',
        'border-radius:0;',
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
        'font-size:11px;',
        'letter-spacing:2px;',
        'text-transform:uppercase;',
        'color:var(--ink-900,#0A0A09);',
        'border:1px solid var(--line,#D8D8D0);',
        'padding:3px 6px;',
        'border-radius:2px;',
        'white-space:nowrap;'
      ].join('')
    });
    tagEl.textContent = (window.isEnglish && window.isEnglish()) ? 'Unlocked' : 'Débloqué';

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
    }, (window.isEnglish && window.isEnglish()) ? '\u2197\u2003Share my progress' : '\u2197\u2003Partager ma progression');
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
  // FIX 2026-04-16 — Ne PAS afficher la carte programme IA si un programme local est validé.
  // L'user ne suit pas 2 programmations en parallèle. Le programme IA est une ALTERNATIVE,
  // pas un complément. Il s'affiche UNIQUEMENT si aucun programme local n'existe.
  // FIX RÉGRESSION 2026-04 : ancienne condition incluait !sportProgramValidated → carte IA
  // s'affichait EN MÊME TEMPS que la carte normale quand sportProgram existait mais non validé.
  // Correction : dès que sportProgram a des données, on passe directement à la carte normale.
  if (S.muscuIAProgram && S.sportType === 'musculation' && !(Array.isArray(S.sportProgram) && S.sportProgram.length > 0)) {
    var _iaCard = card('border-left:4px solid var(--green,#3E5C3A);');
    _iaCard.appendChild(eyebrow(window.isEnglish && window.isEnglish() ? 'YOUR PROGRAM' : 'VOTRE PROGRAMME'));
    _iaCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:8px;'}, (window.isEnglish && window.isEnglish() ? 'Active custom program' : 'Programme sur mesure actif')));
    var _iaDate = S.muscuIAProgramDate ? ((window.isEnglish && window.isEnglish() ? 'Generated on ' : 'G\u00e9n\u00e9r\u00e9 le ') + window.formatDate(S.muscuIAProgramDate)) : '';
    if (_iaDate) _iaCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px;'}, _iaDate));
    // Aper\u00e7u exercices du jour si programme local disponible (m\u00eame non valid\u00e9)
    try {
      var _iaSp = S.sportProgram;
      var _iaDayIdx = S.selectedSportDay || 0;
      var _iaDayObj = Array.isArray(_iaSp) && _iaSp.length > 0 ? (_iaSp[_iaDayIdx] || _iaSp[0]) : null;
      if (_iaDayObj && Array.isArray(_iaDayObj.exercises) && _iaDayObj.exercises.length > 0) {
        var _iaExPrev = h('div', {style: 'margin:8px 0 12px;padding:10px 0;border-top:1px solid var(--line,#D8D8D0);'});
        _iaDayObj.exercises.slice(0, 3).forEach(function(ex, _ei) {
          var _r = h('div', {style: 'display:flex;justify-content:space-between;padding:5px 0;font-family:Georgia,serif;font-size:13px;'});
          _r.appendChild(h('span', {style: 'flex:1;font-style:italic;'}, (_ei + 1) + '. ' + (ex.n || ex.name || '')));
          _r.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--ink-500,#6B6B65);margin-left:8px;'}, ex.sets || ''));
          _iaExPrev.appendChild(_r);
        });
        if (_iaDayObj.exercises.length > 3) {
          _iaExPrev.appendChild(h('div', {style: 'font-size:10px;color:var(--ink-500,#6B6B65);text-align:center;margin-top:4px;letter-spacing:1px;'}, '+ ' + (_iaDayObj.exercises.length - 3) + ' ' + ((window.isEnglish && window.isEnglish()) ? 'more exercises' : 'autres exos')));
        }
        _iaCard.appendChild(_iaExPrev);
      }
    } catch(_e2) {}
    _iaCard.appendChild(h('button', {style: 'padding:10px 16px;background:var(--green,#3E5C3A);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;min-height:44px;', onclick: function() { S.view = 'sport'; S.sStep = 4; if (window.render) window.render(); }}, (window.isEnglish && window.isEnglish() ? 'View my program \u2192' : 'Voir mon programme \u2192')));
    return _iaCard;
  }

  if (!hasSportProgram) {
    // No sport program — empty state (Hermès : vouvoiement, micro-caps, tap target ≥ 48px)
    if (S && (S.appMode === 'nutrition')) return null; // nutrition-only mode: ne pas afficher
    var _sportEmptyCard = card();
    _sportEmptyCard.appendChild(eyebrow('SPORT'));
    var _sportEmpty = h('div', {style: 'text-align:center;padding:28px 0 16px;'});
    _sportEmpty.appendChild(emptyIllu('sport'));
    _sportEmpty.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin:4px 0 10px;font-weight:normal;color:var(--black,#0A0A09);line-height:1.3;max-width:240px;margin-left:auto;margin-right:auto;'}, (window.isEnglish && window.isEnglish()) ? 'Your tailor-made program awaits' : 'Votre programme sur mesure vous attend'));
    _sportEmpty.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);margin-bottom:20px;line-height:1.55;max-width:260px;margin-left:auto;margin-right:auto;'}, (window.isEnglish && window.isEnglish()) ? 'Choose your sport, your level and your schedule.' : 'Choisissez votre sport, votre niveau et votre agenda.'));
    _sportEmpty.appendChild(h('button', {
      style: 'padding:14px 24px;min-height:48px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
      onclick: function() { if (!window.S) return; window.S.view = 'sport'; if (window.render) window.render(); }
    }, (window.isEnglish && window.isEnglish()) ? 'Build my program' : 'Composer mon programme'));
    _sportEmpty.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:14px;'}, (window.isEnglish && window.isEnglish()) ? '3 min \u00b7 Free \u00b7 Personalized' : '3 min \u00b7 Gratuit \u00b7 Personnalis\u00e9'));
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
            'background:rgba(232,111,30,0.06);',
            'border:1px solid var(--orange,#E86F1E);',
            'border-left:3px solid var(--orange,#E86F1E);',
            'border-radius:0;',
            'font-family:"Helvetica Neue",Arial,sans-serif;',
            'font-size:11px;',
            'color:var(--orange-ink,#7A3B0E);',
            'line-height:1.5;'
          ].join('')
        }, (window.isEnglish && window.isEnglish()) ? 'Insufficient recovery detected \u00b7 Lighter session recommended' : 'R\u00e9cup\u00e9ration insuffisante d\u00e9tect\u00e9e \u00b7 S\u00e9ance all\u00e9g\u00e9e recommand\u00e9e');
      }
    }
  } catch(e) {}

  if (S.sportType === 'musculation' && _isLegacySportProgram()) {
    var _lgCard = card('');
    _lgCard.appendChild(eyebrow(window.isEnglish && window.isEnglish() ? 'PROGRAM' : 'PROGRAMME'));
    _lgCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:8px;font-weight:normal;color:var(--black,#0A0A09);'}, (window.isEnglish && window.isEnglish() ? 'Program needs updating' : 'Programme \u00e0 mettre \u00e0 jour')));
    _lgCard.appendChild(h('p', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin-bottom:16px;line-height:1.55;'}, (window.isEnglish && window.isEnglish() ? 'This program was generated with an older version. It must be regenerated for accurate results.' : 'Ce programme a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 avec une ancienne version. Il doit \u00eatre r\u00e9g\u00e9n\u00e9r\u00e9 pour garantir des r\u00e9sultats coh\u00e9rents.')));
    _lgCard.appendChild(h('button', {style: 'padding:12px 20px;min-height:48px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;', onclick: function() { if (!window.S) return; window.S.view = 'sport'; window.S.sStep = 4; if (window.render) window.render(); }}, (window.isEnglish && window.isEnglish() ? '\u21bb REGENERATE MY PROGRAM' : '\u21bb R\u00c9G\u00c9N\u00c9RER MON PROGRAMME')));
    return _lgCard;
  }

  var day = next.day;
  var idx = next.index;
  // ═══ FIX P0 SPRINT 2026-04-16 — NOMS JOURS DASHBOARD BASÉS SUR LE SPLIT RÉEL ═══
  // Avant : day.name pouvait être "Legs" (hardcodé isPPL5) alors que le split réel était
  // bro_5 (jour 2 = épaules). Maintenant : on lit le dayLabel depuis _splitChoice.
  var _DASH_SPLIT_LABELS = {
    'fullbody_ab': ['Full Body A','Full Body B'],
    'fullbody_3':  ['Full Body A','Full Body B','Full Body C'],
    'ppl_3':       ['Push','Pull','Legs'],
    'upper_lower': ['Upper A','Lower A','Upper B','Lower B'],
    'ppl_plus1':   ['Push','Pull','Legs','Upper'],
    'bro_4':       (window.isEnglish && window.isEnglish()) ? ['Chest + Triceps','Back + Biceps','Shoulders','Legs'] : ['Pecs + Triceps','Dos + Biceps','Épaules','Jambes'],
    'ppl_5':       ['Push A','Pull A','Legs','Push B','Pull B'],
    'bro_5':       (window.isEnglish && window.isEnglish()) ? ['Chest','Back','Shoulders','Arms','Legs'] : ['Pecs','Dos','Épaules','Bras','Jambes'],
    'ppl_6':       ['Push A','Pull A','Legs A','Push B','Pull B','Legs B']
  };
  var _splitLabelMap = _getSplitLabels();
  var _storedKeyA = day.splitKey || (S._splitChoice && S.sportType === 'musculation' ? S._splitChoice : null);
  var _storedIdxA = (typeof day.splitDayIdx === 'number') ? day.splitDayIdx : idx;
  var _storedLabelsA = _storedKeyA ? (_splitLabelMap[_storedKeyA] || null) : null;
  var _isGenericDayName = !day.name || /^(Jour|Session|S\u00e9ance)\s+\d+$/i.test(day.name);
  var dayName = (_storedLabelsA && _storedLabelsA[_storedIdxA]) ? _storedLabelsA[_storedIdxA]
              : (!_isGenericDayName ? day.name
              : ((window.isEnglish && window.isEnglish() ? 'Session ' : 'S\u00e9ance ') + (idx + 1)));
  var exCount = Array.isArray(day.exercises) ? day.exercises.length : 0;

  // Duration: profile setting first (what the user chose), then calcSessionDuration, then heuristic
  var _estMins = null;
  if (exCount > 0) {
    var _durMap = { '45min': 45, '1h': 60, '1h15': 75, '1h30': 90 };
    if (S.sportSessionDuration && _durMap[S.sportSessionDuration]) {
      _estMins = _durMap[S.sportSessionDuration];
    } else if (typeof calcSessionDuration === 'function' && Array.isArray(day.exercises) && day.exercises.length > 0) {
      _estMins = calcSessionDuration(day.exercises);
    } else {
      _estMins = exCount <= 4 ? 30 : exCount <= 6 ? 45 : 60;
    }
  }

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
  var _weekTarget = (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length > 0) ? S.trainingDaysSelected.length : (S.sportDays || 3);

  var c = card();
  if (_recoveryBanner) c.appendChild(_recoveryBanner);
  // Bible Hermès §13.2 : titre Georgia suffit, pas d'eyebrow "SÉANCE DU JOUR".
  c.appendChild(cardTitle((window.isEnglish && window.isEnglish()) ? 'Training' : 'Entraînement'));

  // FIX UX — Badge "Actif" permanent : confirmation visuelle programme en cours
  c.appendChild(h('div', {
    style: 'display:inline-flex;align-items:center;gap:5px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--success,#3E5C3A);margin-bottom:8px;'
  }, '● ' + ((window.isEnglish && window.isEnglish()) ? 'Active' : 'Actif')));

  var nameEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:6px;' });
  var _dashDayAbbr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  var _dashWeekday = (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length > idx && typeof S.trainingDaysSelected[idx] === 'number') ? _dashDayAbbr[S.trainingDaysSelected[idx]] : ('Jour\u00a0' + (idx + 1));
  nameEl.textContent = _dashWeekday + '\u00a0\u2014\u00a0' + dayName;
  c.appendChild(nameEl);

  // FIX 2026-04-16 : CrossFit WOD type badge (AMRAP/For Time/EMOM etc.)
  if (next.kind === 'crossfit' && next.wod && next.wod.wod && next.wod.wod.type) {
    c.appendChild(h('div', {
      style: 'display:inline-block;padding:4px 10px;background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;margin-bottom:10px;'
    }, next.wod.wod.type));
  }

  // FIX MULTI-SPORTS 2026-04 : week label pour les sports avec semaines
  if (next._weekLabel) {
    c.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-500,#6B6B65);margin-bottom:8px;'
    }, next._weekLabel));
  }

  // FIX MULTI-SPORTS 2026-04 : description pour les sports endurance (running/triathlon/cycling/yoga)
  // Ces sports n'ont pas de liste d'exercices mais une description de séance.
  var _isEnduranceSport = next.kind === 'running' || next.kind === 'triathlon' || next.kind === 'cycling' || next.kind === 'yoga';
  if (_isEnduranceSport && day._desc) {
    c.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-style:italic;font-size:14px;color:var(--grey,#6B6B65);margin:8px 0 12px;line-height:1.5;'
    }, day._desc));
  }
  if (_isEnduranceSport && (day._distance || day._duration)) {
    var _metaEl = h('div', {
      style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);'
    });
    if (day._distance) _metaEl.appendChild(h('span', {}, day._distance));
    if (day._duration) _metaEl.appendChild(h('span', {}, day._duration));
    if (day._phase) _metaEl.appendChild(h('span', {}, day._phase));
    c.appendChild(_metaEl);
  }
  // Focus badge pour hyrox
  if (next.kind === 'hyrox' && day._focus) {
    c.appendChild(h('div', {
      style: 'display:inline-block;padding:4px 10px;background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;margin-bottom:10px;'
    }, day._focus));
  }

  // COSMÉTIQUE 2026-04 : Grid 3-stats Georgia (ex / durée / semaine) — signature premium
  // FIX MULTI-SPORTS : les sports endurance n'ont pas d'exercices → adapter les labels
  var _showStatsGrid = exCount > 0 || _estMins || _weekTarget > 0 || _isEnduranceSport;
  if (_showStatsGrid) {
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
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-500,#6B6B65);margin-top:4px;'
      }, label));
      return cell;
    }
    if (_isEnduranceSport) {
      // Endurance sports: show duration/distance, discipline, and week progress instead of exercise count
      var _endurDur = (day._duration || day._distance || '—');
      var _sportLabels = { running: 'Running', triathlon: 'Triathlon', cycling: 'Cycling', yoga: 'Yoga' };
      _statsRow.appendChild(_statCell(_endurDur, (window.isEnglish && window.isEnglish()) ? 'Session' : 'Séance', false));
      _statsRow.appendChild(_statCell(_sportLabels[next.kind] || next.kind, 'Sport', false));
      _statsRow.appendChild(_statCell(_weekTarget > 0 ? (_weekDone + '/' + _weekTarget) : '—', (window.isEnglish && window.isEnglish()) ? 'Week' : 'Semaine', true));
    } else {
      // Bible Hermès §3.4 : accord singulier/pluriel correct ("1 EXERCICE" pas "1 EXERCICES")
      _statsRow.appendChild(_statCell(exCount || '—', window.locPlural(exCount, {fr:{one:'Exercice',other:'Exercices'},en:{one:'Exercise',other:'Exercises'}}), false));
      _statsRow.appendChild(_statCell(_estMins ? ('~' + _estMins + "'") : '—', (window.isEnglish && window.isEnglish()) ? 'Duration' : 'Durée', false));
      _statsRow.appendChild(_statCell(_weekTarget > 0 ? (_weekDone + '/' + _weekTarget) : '—', (window.isEnglish && window.isEnglish()) ? 'Week' : 'Semaine', true));
    }
    c.appendChild(_statsRow);
  }

  // FIX SPRINT P1.3 — Mini-aperçu des 3 premiers exos (audit UX flow)
  // Avant : user devait cliquer "Commencer" pour voir les exos. Maintenant : aperçu direct.
  if (Array.isArray(day.exercises) && day.exercises.length > 0) {
    var _exosPreview = h('div', { style: 'margin:12px 0 16px;padding:12px 0;border-top:1px solid var(--line,#D8D8D0);' });
    day.exercises.slice(0, 3).forEach(function(ex, exIdx) {
      var exRow = h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;font-family:Georgia,serif;font-size:13px;color:var(--ink-900,#0A0A09);' });
      exRow.appendChild(h('span', { style: 'flex:1;font-style:italic;' }, (exIdx + 1) + '. ' + (ex.n || ex.name || '')));
      var setsRepsTxt = ex.sets ? (String(ex.sets) + (ex.reps ? ' \u00d7 ' + ex.reps : '')) : (ex.reps ? String(ex.reps) + ' reps' : '');
      exRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--ink-500,#6B6B65);letter-spacing:0.5px;margin-left:8px;' }, setsRepsTxt));
      _exosPreview.appendChild(exRow);
    });
    if (day.exercises.length > 3) {
      _exosPreview.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--ink-500,#6B6B65);text-align:center;margin-top:6px;letter-spacing:1px;' }, '+ ' + (day.exercises.length - 3) + ' ' + ((window.isEnglish && window.isEnglish()) ? 'more exercises' : 'autres exos')));
    }
    c.appendChild(_exosPreview);
  }

  // FIX SPRINT P1.9 — Détecter séance interrompue (au moins 1 set validé aujourd'hui)
  var todayKey = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
  var hasInProgressSession = false;
  // FIX COHÉRENCE CALENDRIER 2026-04 : détecter aussi séance 100% terminée.
  // sessionHistory est keyed par "<dayIdx>_<date>" (format app-sport.js ligne 8886).
  var sessionDoneKey = idx + '_' + todayKey;
  var hasSessionDoneToday = !!(S.sessionHistory && S.sessionHistory[sessionDoneKey]);
  try {
    if (!hasSessionDoneToday && S.muscuSessionLog && S.muscuSessionLog[todayKey]) {
      var dayLog = S.muscuSessionLog[todayKey];
      var anyValidated = false, anyUnvalidated = false;
      Object.keys(dayLog).forEach(function(exName) {
        (dayLog[exName] || []).forEach(function(set) {
          if (set.validated) anyValidated = true;
          else anyUnvalidated = true;
        });
      });
      // Tous les sets validés et aucun non-validé → séance terminée
      if (anyValidated && !anyUnvalidated) hasSessionDoneToday = true;
      else hasInProgressSession = anyValidated && anyUnvalidated;
    }
  } catch(eIp) {}

  // FIX SPRINT P1.3 + P1.9 — bouton "Commencer/Continuer" prominent
  // FIX MULTI-SPORTS : adapter le libellé pour les sports endurance
  // FIX COHÉRENCE 2026-04 : si séance déjà terminée → bouton "✔ Séance terminée" désactivé
  var _bEN = window.isEnglish && window.isEnglish();
  var btnLabel = hasSessionDoneToday
    ? '\u2714 ' + (_bEN ? 'Session complete' : 'S\u00e9ance termin\u00e9e')
    : (hasInProgressSession ? '\u2192 ' + (_bEN ? 'Continue session' : 'Continuer la s\u00e9ance') : (_isEnduranceSport ? '\u2192 ' + (_bEN ? 'View my program' : 'Voir mon programme') : '\u2192 ' + (_bEN ? 'Start session' : 'Commencer la s\u00e9ance')));
  // FIX COHÉRENCE 2026-04 : style du bouton adapté selon l'état de la séance
  var _btnStyle = hasSessionDoneToday
    ? 'display:block;width:100%;padding:16px;background:rgba(62,92,58,0.08);color:var(--success,#3E5C3A);border:1px solid var(--success,#3E5C3A);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;cursor:default;border-radius:2px;min-height:52px;font-weight:500;'
    : 'display:block;width:100%;padding:16px;background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;border-radius:2px;min-height:52px;font-weight:500;';
  var btn = h('button', {
    style: _btnStyle,
    onclick: function() {
      // Séance déjà terminée → naviguer quand même pour voir le bilan
      var S2 = window.S;
      if (!S2) return;
      S2.view = 'sport';
      S2.selectedSportDay = Math.max(0, Math.min(idx, (Array.isArray(S2.sportProgram) ? S2.sportProgram.length - 1 : 0)));
      if (window.render) window.render();
    }
  }, btnLabel);
  c.appendChild(btn);
  if (hasInProgressSession) {
    c.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-style:italic;font-size:12px;color:var(--ink-500,#6B6B65);text-align:center;margin-top:8px;'
    }, (window.isEnglish && window.isEnglish()) ? 'Pick up where you left off.' : 'Vous reprenez où vous en étiez.'));
  }

  // ── Séance Libre ──
  c.appendChild(h('button', {
    style: 'display:block;width:100%;padding:12px;margin-top:10px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--ink-900,#0A0A09);min-height:44px;',
    onclick: function() {
      var S2 = window.S;
      if (!S2) return;
      S2.view = 'sport';
      S2.sStep = 30;
      S2._csSkipMuscleSelect = false;
      S2._csSelectedGroups = null;
      S2._csGenerating = false;
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? '+ Free session' : '+ Séance libre'));

  return c;
}

// ─── SMARTFITCOACH TODAY — Unified AI decision block ─────────────────────────
// Single source of truth for the daily session recommendation.
// Replaces renderCardSport() + renderV3CoachingCard() in the render pipeline.
// Priority: AI recommendation (primary) → user's static program (secondary/override).
function renderSmartFitCoachToday() {
  var S   = window.S;
  if (!S || S.appMode === 'nutrition') return null;

  var EN     = window.isEnglish && window.isEnglish();
  var selAPI = window.WorkoutSelector;
  var wlData = window.WorkoutLibraryData;

  if (!selAPI || !wlData) return renderCardSport();

  var todayIdx = (new Date().getDay() + 6) % 7;
  var next     = getNextSportDay();
  var hasProg  = next && next.day;

  if (hasProg && window.getDayType) {
    var _di = null;
    try { _di = window.getDayType(todayIdx); } catch(e) {}
    if (_di && !_di.isTraining) return renderCardRestDay(S);
  }

  if (!hasProg) return renderCardSport();

  if (S.sportType === 'musculation' && _isLegacySportProgram()) return renderCardSport();

  var todayStr = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);

  // Override mode: user chose their static program today
  if (S._sfcOverride && S._sfcOverrideDate === todayStr) {
    var _ow = h('div', { style: 'display:flex;flex-direction:column;gap:12px;' });
    _ow.appendChild(h('div', {
      style: 'padding:12px 16px;border-left:2px solid #1A1A1A;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#555;line-height:1.65;'
    }, EN
      ? 'You chose your original program. SmartFitCoach adapts the session accordingly.'
      : 'Tu choisis ton programme initial. SmartFitCoach adapte la séance en conséquence.'));
    var _pc = renderCardSport();
    if (_pc) _ow.appendChild(_pc);
    return _ow;
  }

  // Gather inputs
  var v3In;
  try { v3In = _v3GatherInputs(S); } catch(e) { return renderCardSport(); }

  var sel2;
  try {
    sel2 = selAPI.selectWorkout({
      user_level:        ({ beginner:'beginner', intermediate:'intermediate', advanced:'intermediate', pro:'intermediate', expert:'intermediate' })[S.sportLevel] || 'beginner',
      goal:              ({ muscle_gain:'strength', maintenance:'conditioning', fat_loss:'fat_loss' })[v3In.goal] || 'conditioning',
      available_time:    ({ '45min':45, '1h':60, '1h15':75, '1h30':90 })[S.sportSessionDuration] || 60,
      fatigue_level:     v3In.fatigueLevel,
      last_workouts:     (window.SFCSessionHistory ? window.SFCSessionHistory.getSessionHistory() : []),
      preferred_subtypes: null
    }, wlData.library);
  } catch(eSel) {
    console.warn('[SmartFitCoachToday]', eSel.message);
    return renderCardSport();
  }

  // Secondary label
  var day  = next.day;
  var idx  = next.index;
  var _SLABELS = {
    fullbody_ab: ['Full Body A','Full Body B'],
    fullbody_3:  ['Full Body A','Full Body B','Full Body C'],
    ppl_3:       ['Push','Pull','Legs'],
    upper_lower: ['Upper A','Lower A','Upper B','Lower B'],
    ppl_plus1:   ['Push','Pull','Legs','Upper'],
    bro_4:  EN ? ['Chest + Triceps','Back + Biceps','Shoulders','Legs'] : ['Pecs + Triceps','Dos + Biceps','Épaules','Jambes'],
    ppl_5:       ['Push A','Pull A','Legs','Push B','Pull B'],
    bro_5:  EN ? ['Chest','Back','Shoulders','Arms','Legs'] : ['Pecs','Dos','Épaules','Bras','Jambes'],
    ppl_6:       ['Push A','Pull A','Legs A','Push B','Pull B','Legs B']
  };
  var _splitLabelMap2 = _getSplitLabels();
  var _storedKeyB = day.splitKey || (S._splitChoice && S.sportType === 'musculation' ? S._splitChoice : null);
  var _storedIdxB = (typeof day.splitDayIdx === 'number') ? day.splitDayIdx : idx;
  var _storedLabelsB = _storedKeyB ? (_splitLabelMap2[_storedKeyB] || null) : null;
  var _isGenericDN = !day.name || /^(Jour|Session|S\u00e9ance)\s+\d+$/i.test(day.name);
  var _dname = (_storedLabelsB && _storedLabelsB[_storedIdxB]) ? _storedLabelsB[_storedIdxB]
             : (!_isGenericDN ? day.name
             : (EN ? 'Session ' + (idx + 1) : 'S\u00e9ance ' + (idx + 1)));
  var _stl   = ({ musculation:'Muscu', crossfit:'CrossFit', running:'Running', cycling:'Cycling', triathlon:'Triathlon', yoga:'Yoga', hyrox:'Hyrox' })[S.sportType] || '';
  var _secCtx   = [_stl, _dname].filter(Boolean).join(' — '); // kept for potential tooltip use

  // Session done today?
  var _doneKey = idx + '_' + todayStr;
  var _done    = !!(S.sessionHistory && S.sessionHistory[_doneKey]);
  // Muscu sessions may be written to muscuSessionLog without a sessionHistory entry
  if (!_done && S.muscuSessionLog && S.muscuSessionLog[todayStr]) {
    var _mLogD = S.muscuSessionLog[todayStr];
    if (_mLogD && Object.keys(_mLogD).length > 0) {
      _done = Object.keys(_mLogD).some(function(ex) {
        return (_mLogD[ex] || []).some(function(set) { return set.validated; });
      });
    }
  }

  // Badge style: PEAK/LOCKED IN filled; BUILDING/RECOVERING outlined
  var _filled = sel2.momentum_tag === 'Peak' || sel2.momentum_tag === 'Locked In';
  var _tagSt  = 'display:inline-block;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:400;letter-spacing:2px;text-transform:uppercase;padding:6px 12px;' +
    (_filled
      ? 'background:#1A1A1A;color:#F5F3EF;border:none;'
      : 'background:transparent;color:#666;border:1px solid #9A9A9A;');

  // Nutrition guidance: short, forward-looking, projection
  var _nutMap = {
    'Peak':       EN ? 'Protein and clean carbs now. Your body is asking for it.'
                     : 'Protéines et glucides propres · Le corps est en demande.',
    'Locked In':  EN ? 'Eat clean and consistent. Stability builds the gains.'
                     : 'Alimentation stable · La constance accumule les gains.',
    'Building':   EN ? 'Structure your meals. Every one prepares the next session.'
                     : 'Structure tes repas · Chaque repas prépare la prochaine séance.',
    'Recovering': EN ? 'Protein and hydration. Recovery is built tonight.'
                     : 'Protéines et hydratation · La récupération se construit ce soir.'
  };
    var _nutGuidance = _nutMap[sel2.momentum_tag] || _nutMap['Building'];

  // ── Contextual hook: references history + momentum for pre-session narrative ──
  var _hookMsg = null;
  try {
    var _wkCountH = 0, _lastDateH = null;
    var _mLogH = S.muscuSessionLog || {};
    var _sHistH = S.sessionHistory || {};
    var _nowH = new Date();
    var _dowH = (_nowH.getDay() + 6) % 7;
    var _monH = new Date(_nowH); _monH.setDate(_nowH.getDate() - _dowH);
    for (var _diH = 0; _diH <= _dowH; _diH++) {
      var _dH = new Date(_monH); _dH.setDate(_monH.getDate() + _diH);
      var _dsH = _dH.toISOString().slice(0, 10);
      var _hMH = _mLogH[_dsH] && Object.keys(_mLogH[_dsH]).length > 0;
      var _hSH = Object.keys(_sHistH).some(function(k) { return k.indexOf('_' + _dsH) !== -1; });
      if (_hMH || _hSH) { _wkCountH++; if (!_lastDateH || _dsH > _lastDateH) _lastDateH = _dsH; }
    }
    if (!_lastDateH) {
      var _allDH = Object.keys(_mLogH).filter(function(k) {
        return /^\d{4}-\d{2}-\d{2}$/.test(k) && _mLogH[k] && Object.keys(_mLogH[k]).length > 0;
      });
      Object.keys(_sHistH).forEach(function(k) {
        var _mH = k.match(/^(\d+)_(\d{4}-\d{2}-\d{2})$/); if (_mH) _allDH.push(_mH[2]);
      });
      if (_allDH.length) { _allDH.sort(); _lastDateH = _allDH[_allDH.length - 1]; }
    }
    var _dslH = _lastDateH ? Math.floor((new Date(todayStr) - new Date(_lastDateH)) / 86400000) : null;
    var _wktH = (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length) ? S.trainingDaysSelected.length : (S.sportDays || 3);
    // Last week session count — enables "best week" progress signal
    var _lwCountH = 0;
    try {
      var _lwMonH = new Date(_monH); _lwMonH.setDate(_monH.getDate() - 7);
      for (var _lwI = 0; _lwI < 7; _lwI++) {
        var _lwD = new Date(_lwMonH); _lwD.setDate(_lwMonH.getDate() + _lwI);
        var _lwS = _lwD.toISOString().slice(0, 10);
        if ((_mLogH[_lwS] && Object.keys(_mLogH[_lwS]).length > 0) ||
            Object.keys(_sHistH).some(function(k) { return k.indexOf('_' + _lwS) !== -1; })) {
          _lwCountH++;
        }
      }
    } catch(e) {}
    if (sel2.momentum_tag === 'Peak' && _wkCountH >= 3) {
      _hookMsg = _wkCountH > _lwCountH
        ? (EN ? _wkCountH + ' sessions · Your best week so far' : _wkCountH + ' séances · Ta meilleure semaine')
        : (EN ? _wkCountH + ' sessions · On pace' : _wkCountH + ' séances · Rythme maintenu');
    } else if (sel2.momentum_tag === 'Peak') {
      _hookMsg = EN ? 'Full recovery · Best conditions of the week' : 'Récupération complète · Meilleure condition du moment';
    } else if (sel2.momentum_tag === 'Locked In' && _wkCountH >= 2) {
      _hookMsg = EN ? _wkCountH + ' / ' + _wktH + ' this week · Consistency confirmed' : _wkCountH + ' / ' + _wktH + ' cette semaine · Régularité confirmée';
    } else if (sel2.momentum_tag === 'Recovering' && _dslH === 1) {
      _hookMsg = EN ? 'Supercompensation window active · Load adjusted for today' : 'Surcompensation active · Charge ajustée pour aujourd\'hui';
    } else if (_dslH !== null && _dslH >= 5) {
      _hookMsg = EN ? _dslH + ' days off · You come back stronger' : _dslH + ' jours de repos · Tu reviens plus fort';
    } else if (_wkCountH === 0) {
      _hookMsg = EN ? 'First session · The week starts now' : 'Première séance · La semaine commence maintenant';
    } else if (_dslH !== null && _dslH >= 2) {
      _hookMsg = EN ? _dslH + ' days recovery · Peak form' : _dslH + ' jours de récupération · Forme au pic';
    }
  } catch(e) {}

  // ── Smart adjustment: instruction + micro-dopamine projection in one line ──
  var _adjMap = {
    'Peak':       EN ? 'Add 2.5 kg · Volume is up this week'
                     : 'Ajoute 2,5 kg · Volume en hausse cette semaine',
    'Locked In':  EN ? 'Hold the load · Consistency compounds'
                     : 'Maintiens les charges · La régularité paie',
    'Building':   EN ? '+1 rep per set · Progress shows session after session'
                     : '+1 répétition · La progression se voit séance après séance',
    'Recovering': EN ? 'Drop 1 set · Load harder tomorrow'
                     : 'Retire 1 série · Pour charger plus fort demain'
  };
  var _adj = _adjMap[sel2.momentum_tag] || _adjMap['Building'];

  // ── Today's logged tonnage (for post-session display) ──
  var _todayTon = 0, _todaySets = 0;
  try {
    var _todayLog = S.muscuSessionLog && S.muscuSessionLog[todayStr];
    if (_todayLog) {
      Object.keys(_todayLog).forEach(function(ex) {
        (_todayLog[ex] || []).forEach(function(set) {
          if (set.validated && typeof set.actualWeight === 'number' && set.actualWeight > 0
              && typeof set.actualReps === 'number' && set.actualReps > 0) {
            _todayTon += set.actualWeight * set.actualReps;
            _todaySets++;
          }
        });
      });
    }
  } catch(e) {}

  // ── Next session name (for post-session preview) ──
  var _nextSessName = null;
  try {
    if (Array.isArray(S.sportProgram) && S.sportProgram.length > 1) {
      var _niNext = (idx + 1) % S.sportProgram.length;
      var _ndNext = S.sportProgram[_niNext];
      var _nkNext = _ndNext.splitKey || (S._splitChoice && S.sportType === 'musculation' ? S._splitChoice : null);
      var _nlNext = _nkNext ? (_getSplitLabels()[_nkNext] || null) : null;
      var _nxIdx  = (typeof _ndNext.splitDayIdx === 'number') ? _ndNext.splitDayIdx : _niNext;
      var _nxGen  = !_ndNext.name || /^(Jour|Session|Séance)\s+\d+$/i.test(_ndNext.name);
      _nextSessName = (_nlNext && _nlNext[_nxIdx]) ? _nlNext[_nxIdx]
        : (!_nxGen ? _ndNext.name : (EN ? 'Session ' + (_niNext + 1) : 'Séance ' + (_niNext + 1)));
    }
  } catch(e) {}

  var c = card('');

  // Brand mark: quiet watermark, not a banner
  c.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C0BDB8;margin-bottom:20px;font-weight:400;'
  }, 'SMARTFITCOACH'));

  if (_done) {
    // ─── POST-SESSION ───
    c.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#3E5C3A;margin-bottom:10px;'
    }, EN ? '✔ Session complete' : '✔ Séance terminée'));
    if (_todayTon > 0) {
      var _tonFmt = _todayTon >= 1000 ? (Math.round(_todayTon / 100) / 10).toFixed(1) + ' t' : Math.round(_todayTon) + ' kg';
      c.appendChild(h('div', {
        style: 'font-family:Georgia,serif;font-size:28px;font-weight:400;line-height:1.15;color:#1A1A1A;margin-bottom:4px;'
      }, _tonFmt));
      c.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#AAA;margin-bottom:22px;font-weight:300;'
      }, _todaySets + ' sets · ' + _dname));
    } else {
      c.appendChild(h('div', {
        style: 'font-family:Georgia,serif;font-size:22px;font-weight:400;line-height:1.3;color:#1A1A1A;margin-bottom:22px;'
      }, _dname));
    }
    if (_nextSessName) {
      c.appendChild(h('div', { style: 'height:1px;background:#E8E6E0;margin-bottom:16px;' }));
      c.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#AAA;margin-bottom:6px;letter-spacing:0.5px;'
      }, EN ? 'Next' : 'Ensuite'));
      c.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;font-weight:400;color:#333;margin-bottom:16px;'
      }, _nextSessName));
      c.appendChild(h('button', {
        style: 'padding:0;background:transparent;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#999;cursor:pointer;min-height:36px;text-decoration:underline;text-underline-offset:3px;',
        onclick: function() {
          var S2 = window.S;
          if (!S2) return;
          S2.view = 'sport';
          S2.selectedSportDay = Math.max(0, Math.min((idx + 1) % (Array.isArray(S2.sportProgram) ? S2.sportProgram.length : 1), (Array.isArray(S2.sportProgram) ? S2.sportProgram.length - 1 : 0)));
          if (window.render) window.render();
        }
      }, EN ? '→ Preview' : '→ Voir'));
    }
    c.appendChild(h('div', {
      style: 'margin-top:20px;padding:14px 0;border-top:1px solid #E8E6E0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#3E5C3A;letter-spacing:1px;'
    }, EN ? 'Recovery starts now. Come back stronger.' : 'La récupération commence. Reviens plus fort.'));
  } else {
    // ─── PRE-SESSION ───
    // Hook: context without a label — the text IS the label
    if (_hookMsg) {
      c.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:300;line-height:1.55;color:#888;margin-bottom:18px;'
      }, _hookMsg));
    }
    // Session name: the single headline — get full attention
    c.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-size:24px;font-weight:400;line-height:1.2;color:#1A1A1A;margin-bottom:12px;'
    }, sel2.session_focus));
    c.appendChild(h('div', { style: 'margin-bottom:14px;' },
      h('span', { style: _tagSt }, sel2.momentum_tag.toUpperCase())
    ));
    c.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C0BDB8;margin-bottom:18px;font-weight:400;'}, (window.isEnglish && window.isEnglish()) ? 'Adapted for you.' : 'Adapté pour toi.'));
    c.appendChild(h('div', { style: 'height:1px;background:#E8E6E0;margin-bottom:20px;' }));
    // Coach message: no section header — the text speaks for itself
    c.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:300;line-height:1.7;color:#444;margin-bottom:14px;'
    }, sel2.coach_message));
    // Adjustment: left-border note — visually subordinate, no header needed
    c.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:300;line-height:1.5;color:#777;margin-bottom:22px;padding-left:12px;border-left:2px solid #D8D6D0;'
    }, _adj));
    // Nutrition: supporting context, whisper weight
    c.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:300;line-height:1.6;color:#AAA;margin-bottom:26px;'
    }, _nutGuidance));
    // CTA: shorter verb = more decisive
    c.appendChild(h('button', {
      style: 'display:block;width:100%;padding:16px;background:#1A1A1A;color:#F5F3EF;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;min-height:52px;box-sizing:border-box;',
      onclick: function() {
        var S2 = window.S;
        if (!S2) return;
        if (window.SFCSessionHistory) window.SFCSessionHistory.saveSession(sel2.selected_workout_id);
        S2.view = 'sport';
        S2.selectedSportDay = Math.max(0, Math.min(idx, (Array.isArray(S2.sportProgram) ? S2.sportProgram.length - 1 : 0)));
        if (window.render) window.render();
      }
    }, EN ? '→ START' : '→ COMMENCER'));
    // Secondary: no parenthetical, just a clean link
    c.appendChild(h('button', {
      style: 'display:block;width:100%;padding:12px 0;margin-top:10px;background:transparent;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#AAA;cursor:pointer;text-align:left;min-height:44px;',
      onclick: function() {
        var S2 = window.S;
        if (!S2) return;
        S2._sfcOverride     = true;
        S2._sfcOverrideDate = todayStr;
        if (window.save) window.save();
        if (window.render) window.render();
      }
    }, EN ? '→ Follow my program' : '→ Suivre mon programme'));
  }

  return c;
}

// ─── RENDER CARD — Jour de repos (premium) ───
function renderCardRestDay(S) {
  var today = new Date().toISOString().slice(0, 10);
  var mood = (S.restDayMood && S.restDayMood.date === today) ? S.restDayMood.emoji : null;

  // Adapt content by sport level
  var _lvl = S.sportLevel || 'beginner';
  if (_lvl !== 'intermediate' && _lvl !== 'advanced') _lvl = 'beginner';

  var _rEN = window.isEnglish && window.isEnglish();
  var _restMsg = {
    beginner:     _rEN ? 'Muscles are built at rest. Today is part of the plan.' : 'Les muscles se construisent au repos. Aujourd\u2019hui fait partie du plan.',
    intermediate: _rEN ? 'Recovery is training. Your fibers rebuild stronger.' : 'La r\u00e9cup\u00e9ration est un entra\u00eenement. Vos fibres se reconstruisent plus fortes.',
    advanced:     _rEN ? 'Supercompensation happens in the 24-48h post-session. Optimize this rest.' : 'La surcompensation se joue dans les 24\u201348h post-s\u00e9ance. Optimise ce repos.'
  }[_lvl];

  var weightKg = (S && S.weight) ? parseFloat(S.weight) : 70;
  // 35 ml/kg (EFSA 2010 / ANSES) + plancher EFSA : 2.0 L femme, 2.5 L homme (cohérent avec calcHydration())
  var _efsa_floor = window.isMale(S) ? 2.5 : 2.0;
  var waterGoal = Math.max(_efsa_floor, Math.round(weightKg * 0.035 * 10) / 10);

  var _rtEN = window.isEnglish && window.isEnglish();
  var _restTips = {
    beginner: _rtEN ? [
      '\u2014 Light walk or gentle stretching',
      '\u2014 Hydration: goal ' + waterGoal + '\u00a0L',
      '\u2014 Sleep 7-9h tonight'
    ] : [
      '\u2014 Marche l\u00e9g\u00e8re ou \u00e9tirements doux',
      '\u2014 Hydratation\u00a0: objectif\u00a0' + waterGoal + '\u00a0L',
      '\u2014 Sommeil\u00a07\u20139h cette nuit'
    ],
    intermediate: _rtEN ? [
      '\u2014 Foam roller \u00b7 10 min on worked muscle groups',
      '\u2014 Hydration: ' + waterGoal + '\u00a0L + electrolytes',
      '\u2014 Sleep 8h \u00b7 optimize deep sleep phases'
    ] : [
      '\u2014 Foam roller \u00b7 10\u202fmin sur les groupes travaill\u00e9s',
      '\u2014 Hydratation\u00a0: ' + waterGoal + '\u00a0L + \u00e9lectrolytes',
      '\u2014 Sommeil\u00a08h \u00b7 optimisez les phases profondes'
    ],
    advanced: _rtEN ? [
      '\u2014 Hot/cold contrast \u00b7 3 cycles of 2 min',
      '\u2014 Hydration: ' + waterGoal + '\u00a0L + sodium post-effort',
      '\u2014 Sleep 8-9h \u00b7 avoid screens 1h before'
    ] : [
      '\u2014 Contraste chaud\u2009/\u2009froid \u00b7 3 cycles de 2\u202fmin',
      '\u2014 Hydratation\u00a0: ' + waterGoal + '\u00a0L + sodium post-effort',
      '\u2014 Sommeil\u00a08\u20139h \u00b7 \u00e9vitez les \u00e9crans 1h avant'
    ]
  }[_lvl];

  var c = card('background:var(--ivory,#FAF9F6);border-color:var(--border);');

  // Header
  // Bible Hermès §13.2 : pas d'eyebrow — titre Georgia suffit.
  c.appendChild(cardTitle((window.isEnglish && window.isEnglish()) ? 'Rest day' : 'Jour de repos'));

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
  moodLabel.textContent = (window.isEnglish && window.isEnglish()) ? (mood ? 'How you feel today' : 'How are you feeling?') : (mood ? 'Votre ressenti aujourd\'hui' : 'Comment vous sentez-vous ?');
  c.appendChild(moodLabel);

  // Bible Hermès §13.1 : pas d'emoji. Labels typographiques à la place.
  var moods = [
    { key: 'apathique', label: (window.isEnglish && window.isEnglish()) ? 'Apathetic' : 'Apathique' },
    { key: 'neutre',    label: (window.isEnglish && window.isEnglish()) ? 'Neutral' : 'Neutre' },
    { key: 'energique', label: (window.isEnglish && window.isEnglish()) ? 'Energetic' : 'Énergique' }
  ];
  var moodRow = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;' });
  moods.forEach(function(m) {
    var isSelected = mood === m.key;
    var moodBtn = h('button', {
      style: 'flex:1;min-height:44px;padding:12px 8px;border:1px solid ' + (isSelected ? 'var(--ink-900,#0A0A09)' : 'var(--line,#D8D8D0)') + ';background:' + (isSelected ? 'var(--ink-900,#0A0A09)' : 'transparent') + ';color:' + (isSelected ? 'var(--paper,#FAF9F6)' : 'var(--ink-900,#0A0A09)') + ';border-radius:2px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:500;transition:all .15s;',
      onclick: function() {
        S.restDayMood = { date: today, emoji: m.key, label: m.label };
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        if (window.render) window.render();
      }
    }, m.label);
    moodRow.appendChild(moodBtn);
  });
  c.appendChild(moodRow);

  // ── Séance Libre (jour de repos) ──
  c.appendChild(h('button', {
    style: 'display:block;width:100%;padding:12px;margin-top:14px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--ink-900,#0A0A09);min-height:44px;',
    onclick: function() {
      var S2 = window.S;
      if (!S2) return;
      S2.view = 'sport';
      S2.sStep = 30;
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? '+ Free session' : '+ Séance libre'));

  return c;
}

// ─── RENDER CARD — Suivi hydratation (via WATER_TRACKER — même source que FAB EAU) ───
function renderCardWater() {
  var S = window.S;
  if (!S) return null;
  if (!window.WATER_TRACKER) return null;

  var EN = window.isEnglish && window.isEnglish();
  var _data = window.WATER_TRACKER.getToday();
  var _glasses = _data.glasses;
  var _target = _data.target;
  var _pct = _data.percent;
  var _liters = Math.round(_glasses * 250) / 1000;
  var _goalL = Math.round(_target * 250) / 1000;
  var _barColor = _glasses >= _target ? '#3E5C3A' : (_glasses >= _target * 0.5 ? 'var(--orange,#E86F1E)' : '#C0392B');

  var c = card('background:var(--ivory,#FAF9F6);border-color:var(--border);');
  c.appendChild(eyebrow(EN ? 'HYDRATION' : 'HYDRATATION'));

  var _headRow = h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;' });
  var _numWrap = h('div', { style: 'display:flex;align-items:baseline;gap:6px;' });
  _numWrap.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:26px;color:var(--ink-900,#0A0A09);line-height:1;' }, _liters.toFixed(1)));
  _numWrap.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);letter-spacing:0.5px;' }, '/ ' + _goalL.toFixed(1) + ' L'));
  _headRow.appendChild(_numWrap);
  if (_pct > 0) {
    _headRow.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + _barColor + ';letter-spacing:1px;' }, _pct + '%'));
  }
  c.appendChild(_headRow);

  var _barOuter = h('div', { style: 'height:3px;background:var(--line,#D8D8D0);border-radius:0;margin-bottom:14px;overflow:hidden;' });
  _barOuter.appendChild(h('div', { style: 'height:3px;background:' + _barColor + ';width:' + _pct + '%;transition:width .3s ease;' }));
  c.appendChild(_barOuter);

  var _btns = h('div', { style: 'display:flex;gap:8px;' });

  var _add1 = h('button', {
    style: 'flex:1;min-height:44px;padding:10px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
    onclick: function() {
      if (window.WATER_TRACKER) window.WATER_TRACKER.addGlass();
      if (window.render) window.render();
    }
  }, '+ 250 ml');
  _btns.appendChild(_add1);

  var _add2 = h('button', {
    style: 'flex:1;min-height:44px;padding:10px;background:transparent;color:var(--ink-900,#0A0A09);border:1px solid var(--line,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
    onclick: function() {
      if (window.WATER_TRACKER) { window.WATER_TRACKER.addGlass(); window.WATER_TRACKER.addGlass(); }
      if (window.render) window.render();
    }
  }, '+ 500 ml');
  _btns.appendChild(_add2);

  if (_glasses > 0) {
    var _undo = h('button', {
      style: 'min-height:44px;padding:10px 16px;background:transparent;color:var(--grey,#6B6B65);border:1px solid var(--line,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;cursor:pointer;',
      onclick: function() {
        if (window.WATER_TRACKER) window.WATER_TRACKER.removeGlass();
        if (window.render) window.render();
      }
    }, '−');
    _btns.appendChild(_undo);
  }
  c.appendChild(_btns);

  if (_glasses >= _target && _target > 0) {
    c.appendChild(h('div', { style: 'margin-top:10px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#3E5C3A;letter-spacing:0.3px;' },
      EN ? 'Daily goal reached' : 'Objectif journalier atteint'));
  }

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
  // Bible Hermès §13.2 : pas d'eyebrow — "Comment vous sentez-vous ?" est le titre direct.
  c.appendChild(cardTitle((window.isEnglish && window.isEnglish()) ? 'How are you feeling?' : 'Comment vous sentez-vous ?'));

  var desc = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px;' });
  desc.textContent = (window.isEnglish && window.isEnglish()) ? 'Sleep \u00b7 Muscles \u00b7 Energy' : 'Sommeil \u00b7 Muscles \u00b7 \u00c9nergie';
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
  }, (window.isEnglish && window.isEnglish()) ? 'Quick check-in' : 'Faire le checkin rapide');
  c.appendChild(btn);

  return c;
}

// ─── RENDER CARD 6 — Raccourcis rapides ───
function renderCardShortcuts() {
  var c = card();
  // Bible Hermès §13.2 : titre Georgia 17px au lieu d'eyebrow uppercase.
  c.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:17px;font-weight:normal;color:var(--ink-900,#0A0A09);margin-bottom:14px;line-height:1.25;'
  }, (window.isEnglish && window.isEnglish()) ? 'Quick actions' : 'Actions rapides'));

  var row = h('div', { style: 'display:flex;gap:8px;margin-top:4px;' });

  var btnMeal = h('button', {
    style: 'flex:1;background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;padding:14px 8px;border:1px solid var(--border);border-radius:2px;cursor:pointer;transition:all .2s;',
    'aria-label': (window.isEnglish && window.isEnglish()) ? 'Add a meal' : 'Ajouter un repas',
    onclick: function() {
      var S = window.S;
      if (!S) return;
      S.view = 'nutrition';
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? '+ Add a meal' : '+ Ajouter un repas');

  var btnSport = h('button', {
    style: 'flex:1;background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;padding:14px 8px;border:1px solid var(--border);border-radius:2px;cursor:pointer;transition:all .2s;',
    'aria-label': (window.isEnglish && window.isEnglish()) ? 'View my sport plan' : 'Voir mon programme sportif',
    onclick: function() {
      var S = window.S;
      if (!S) return;
      S.view = 'sport';
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? 'View my plan' : 'Voir mon programme');

  row.appendChild(btnMeal);
  row.appendChild(btnSport);
  c.appendChild(row);

  return c;
}

// ─── SECTION LABEL ───
function sectionLabel(text) {
  // Re-supervision Hermès v2 : sectionLabel du drawer passe en Georgia roman
  // (pas uppercase, pas tracking). Bible §13.2 : budget eyebrow 2 max / écran.
  return h('div', {
    style: 'font-family:Georgia,serif;font-size:17px;font-weight:normal;color:var(--ink-900,#0A0A09);border-bottom:1px solid var(--line,#D8D8D0);padding-bottom:10px;margin:32px 0 20px;line-height:1.25;'
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
  function _closeModal() {
    try { if (window.SCANNER && window.SCANNER.stopCamera) window.SCANNER.stopCamera(); } catch(e) {}
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
  var closeBtn = h('button', {
    style: 'position:absolute;top:12px;right:16px;background:none;border:none;font-size:18px;cursor:pointer;color:var(--grey);',
    'aria-label': (window.isEnglish && window.isEnglish()) ? 'Close' : 'Fermer',
    onclick: _closeModal
  }, '\u00D7');
  box.appendChild(closeBtn);
  box.appendChild(h('div', {
    style: 'font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);border-bottom:1px solid var(--border);padding-bottom:6px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;'
  }, title));
  buildFn(box, overlay);
  overlay.appendChild(box);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) _closeModal(); });
  document.body.appendChild(overlay);
}

// ─── WEIGHT PROMPT ───
function openTodayWeightPrompt() {
  todayModal((window.isEnglish && window.isEnglish()) ? 'Record my weight' : 'Enregistrer mon poids', function(box, overlay) {
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
        // 2026-04 NIVEAU 1 : validation plausible (évite saisies absurdes comme -50 ou 500)
        // Bornes en kg après conversion éventuelle depuis lbs.
        var valKg = window.UNITS ? window.UNITS.toKg(val) : val;
        if (isNaN(val) || val <= 0 || valKg < 20 || valKg > 300) {
          input.style.borderColor = '#c44';
          // Toast explicite pour expliquer POURQUOI refusé
          if (window.showToast) {
            var unitTxt = window.UNITS ? window.UNITS.weightLabel() : 'kg';
            window.showToast((window.isEnglish && window.isEnglish()) ? ('Invalid weight. Enter a value between 20 and 300 kg (44-660 ' + (unitTxt === 'lbs' ? 'lbs' : 'kg') + ').') : ('Poids invalide. Entrez une valeur entre 20 et 300 kg (44-660 ' + (unitTxt === 'lbs' ? 'lbs' : 'kg') + ').'), 'error', 4000);
          }
          return;
        }
        input.style.borderColor = 'var(--border)'; // reset si valide après erreur précédente
        if (window.S) { window.S.weight = valKg; window.S._nm = null; }
        // 2026-04 SYMBIOSE : forcer le recompute des macros (avant, _nm restait stale et macros basées sur l'ancien poids)
        if (window.computeNutritionState) {
          try {
            var _isTrainDay = false;
            if (window.getDayType) {
              var _td = (new Date()).getDay(); // 0=dim, 1=lun...
              var _dayIdx = _td === 0 ? 6 : _td - 1; // convertir : 0=lun..6=dim
              var _di = window.getDayType(_dayIdx);
              _isTrainDay = !!(_di && _di.isTraining);
            }
            window.computeNutritionState(_isTrainDay);
          } catch(e) { /* fallback : _nm=null forcera recompute au prochain render */ }
        }
        // 2026-04 FIX UX : NE PAS dévalider le plan hebdo pour une simple mise à jour de poids
        // (avant : chaque saisie de poids forçait l'user à re-cliquer "Valider mon programme",
        //  même pour une variation de 0.2 kg — frustrant). _nm=null suffit pour recalculer
        //  les macros cibles au prochain render. Le plan reste valide pour la semaine.
        try { if (window.BLACKBOX) window.BLACKBOX.log('weight_logged', { weight: valKg }); } catch(e) {}
        var user = window.AUTH ? window.AUTH.getUser() : null;
        var userId = user ? user.id : 'anon';
        var whKey = 'mtd_weight_history_' + userId;
        var wh = (window.S && Array.isArray(window.S.weightHistory) && window.S.weightHistory.length)
          ? window.S.weightHistory
          : [];
        if (!wh.length) { try { wh = JSON.parse(localStorage.getItem(whKey) || '[]'); } catch(e) { wh = []; } }
        var _newEntry = { date: new Date().toISOString().split('T')[0], weight: valKg };
        wh.push(_newEntry);
        try { localStorage.setItem(whKey, JSON.stringify(wh)); } catch(e) {}
        if (window.SupaSync) SupaSync.saveWeight(new Date().toISOString().split('T')[0], valKg);
        if (window.TRACKER) window.TRACKER.track('weight_logged', { weight_kg: valKg });
        if (window.S) window.S.weightHistory = wh;
        // Persister le nouveau poids dans le profil (évite la perte de données si l'utilisateur ferme l'app)
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        var _wLabel = (window.isEnglish && window.isEnglish()) ? ('Weight saved: ' + (window.UNITS ? window.UNITS.displayWeight(valKg) : valKg + ' kg')) : ('Poids enregistré : ' + (window.UNITS ? window.UNITS.displayWeight(valKg) : valKg + ' kg'));
        if (window.GAMIFICATION) {
          try {
            window.GAMIFICATION.showToast(_wLabel);
            window.GAMIFICATION.unlockBadge('first_weigh');
            if (wh.length >= 10) window.GAMIFICATION.unlockBadge('weight_10');
          } catch(e) {
            if (window.showToast) { try { window.showToast(_wLabel, 'success', 2500); } catch(_){} }
          }
        } else if (window.showToast) {
          try { window.showToast(_wLabel, 'success', 2500); } catch(_){}
        }
        document.body.removeChild(overlay);
        if (window.APP_RENDER) window.APP_RENDER();
      }
    }, (window.isEnglish && window.isEnglish()) ? 'Save' : 'Enregistrer');
    box.appendChild(saveBtn);
    setTimeout(function() { input.focus(); }, 100);
  });
}

// ─── MEASUREMENTS MODAL ───
function openTodayMeasurementsModal() {
  todayModal((window.isEnglish && window.isEnglish()) ? 'My measurements' : 'Mes mensurations', function(box) {
    var formContainer = h('div', { style: 'margin-top:8px;' });
    if (window.MEASUREMENTS && window.MEASUREMENTS.renderForm) {
      try { window.MEASUREMENTS.renderForm(formContainer); } catch(e) {
        formContainer.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, 'Module mensurations indisponible.'));
      }
    } else {
      formContainer.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, (window.isEnglish && window.isEnglish()) ? 'Measurements module not loaded.' : 'Module mensurations non chargé.'));
    }
    box.appendChild(formContainer);
  });
}

// ─── BADGES MODAL ───
function openTodayBadgesModal() {
  var _bEN = window.isEnglish && window.isEnglish();
  todayModal(_bEN ? 'All badges' : 'Tous les badges', function(box) {
    var panel = h('div', { style: 'margin-top:8px;' });
    if (window.GAMIFICATION && window.GAMIFICATION.renderBadgesPanel) {
      try { window.GAMIFICATION.renderBadgesPanel(panel); } catch(e) {
        panel.appendChild(h('p', { style: 'font-size:13px;color:var(--grey);' }, _bEN ? 'Badges panel unavailable.' : 'Panneau badges indisponible.'));
      }
    }
    box.appendChild(panel);
  });
}

// ─── KITCHEN TIMER MODAL ───
function openTodayKitchenTimer() {
  if (window._kitchenTimerInterval) { clearInterval(window._kitchenTimerInterval); window._kitchenTimerInterval = null; }
  todayModal((window.isEnglish && window.isEnglish()) ? 'Kitchen timer' : 'Timer cuisine', function(box, overlay) {
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
        startBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Running...' : 'En cours...';
        interval = window._kitchenTimerInterval = setInterval(function() {
          // 2026-04 P1 FIX : suicide si l'overlay est detached du DOM (fermeture non-orthodoxe)
          if (!overlay || !overlay.parentNode || !document.body.contains(overlay)) {
            clearInterval(interval); window._kitchenTimerInterval = null; running = false;
            return;
          }
          totalSeconds--;
          display.textContent = formatTime(totalSeconds);
          if (totalSeconds <= 0) {
            clearInterval(interval); window._kitchenTimerInterval = null; running = false;
            startBtn.textContent = window.t ? window.t('extras.start') : 'Démarrer';
            display.textContent = (window.isEnglish && window.isEnglish()) ? 'Done!' : 'Terminé !';
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
    var _closeEl = box.querySelector('[aria-label="Fermer"]') || box.querySelector('[aria-label="Close"]');
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
  if (window.GAMIFICATION) window.GAMIFICATION.showToast((window.isEnglish && window.isEnglish()) ? 'Data exported!' : 'Données exportées !');
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
        if (!backup.data || !backup.version) { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Invalid file' : 'Fichier invalide', 'error', 3000); return; }
        var _restoreMsg = (window.isEnglish && window.isEnglish()) ? 'This will replace your current data. Continue?' : 'Cela remplacera vos données actuelles. Continuer ?';
        if (!(window.sfcConfirm ? window.sfcConfirm(_restoreMsg) : window.confirm(_restoreMsg))) return;
        Object.keys(backup.data).forEach(function(key) {
          localStorage.setItem(key, typeof backup.data[key] === 'string' ? backup.data[key] : JSON.stringify(backup.data[key]));
        });
        if (window.GAMIFICATION) window.GAMIFICATION.showToast((window.isEnglish && window.isEnglish()) ? 'Data restored!' : 'Données restaurées !');
        setTimeout(function() { location.reload(); }, 1000);
      } catch(err) { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? 'Read error: ' : 'Erreur de lecture : ') + err.message, 'error', 4000); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function todayDeleteAllData() {
  var _deleteMsg = (window.isEnglish && window.isEnglish()) ? 'Irreversible action. All your data will be permanently deleted. Continue?' : 'Action irr\u00e9versible. Toutes vos donn\u00e9es seront supprim\u00e9es d\u00e9finitivement. Continuer ?';
  if (!(window.sfcConfirm ? window.sfcConfirm(_deleteMsg) : window.confirm(_deleteMsg))) return;
  var keysToRemove = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.indexOf('mtd_') === 0) keysToRemove.push(key);
  }
  keysToRemove.forEach(function(key) { localStorage.removeItem(key); });
  if (window.AUTH && window.AUTH.logout) { try { window.AUTH.logout(); } catch(e) {} }
  if (window.GAMIFICATION) window.GAMIFICATION.showToast((window.isEnglish && window.isEnglish()) ? 'Data deleted.' : 'Données supprimées.');
  setTimeout(function() { location.reload(); }, 1000);
}

// ─── RENDER EXTENDED SECTIONS (ex-Dashboard) ───
function renderExtendedSections(wrapper, S) {
  if (!S || typeof S !== 'object') return;
  var _exEN = window.isEnglish && window.isEnglish();
  wrapper.appendChild(sectionLabel(_exEN ? 'Quick actions' : 'Actions rapides'));
  var actCard = card();
  var navRow = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;' });

  // Re-supervision Hermès v2 : suppression pavés NOIRS (hors charte ivoire).
  // Bible §13 : pas de cartes noires remplies. Remplacement par filets ivoire + italic Georgia.
  var nutNavBtn = h('div', {
    style: 'background:transparent;border:1px solid var(--line,#D8D8D0);padding:24px 20px;cursor:pointer;transition:background .15s ease;',
    onmouseover: function(e) { e.currentTarget.style.background = 'var(--paper-3,#EEEAE0)'; },
    onmouseout: function(e) { e.currentTarget.style.background = 'transparent'; },
    onclick: function() { if (window.APP_NAVIGATE) window.APP_NAVIGATE('nutrition'); else { S.view = 'nutrition'; if (window.render) window.render(); } }
  });
  nutNavBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:17px;font-weight:normal;color:var(--ink-900,#0A0A09);margin-bottom:6px;' }, 'Nutrition'));
  nutNavBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-style:italic;font-size:13px;color:var(--ink-500,#6B6B65);line-height:1.4;' }, _exEN ? 'Plan your meals.' : 'Planifiez vos repas.'));
  navRow.appendChild(nutNavBtn);

  var sportNavBtn = h('div', {
    style: 'background:transparent;border:1px solid var(--line,#D8D8D0);padding:24px 20px;cursor:pointer;transition:background .15s ease;',
    onmouseover: function(e) { e.currentTarget.style.background = 'var(--paper-3,#EEEAE0)'; },
    onmouseout: function(e) { e.currentTarget.style.background = 'transparent'; },
    onclick: function() { if (window.APP_NAVIGATE) window.APP_NAVIGATE('sport'); else { S.view = 'sport'; if (window.render) window.render(); } }
  });
  sportNavBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:17px;font-weight:normal;color:var(--ink-900,#0A0A09);margin-bottom:6px;' }, 'Sport'));
  sportNavBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-style:italic;font-size:13px;color:var(--ink-500,#6B6B65);line-height:1.4;' }, (window.isEnglish && window.isEnglish() ? 'Your program.' : 'Votre programme.')));
  navRow.appendChild(sportNavBtn);
  actCard.appendChild(navRow);

  var btnRow = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;' });
  var weightActBtn = h('div', {
    style: 'background:var(--ivory2);border:1px solid var(--border);padding:16px;cursor:pointer;text-align:center;transition:all .2s ease;',
    onclick: function() { openTodayWeightPrompt(); }
  });
  weightActBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;margin:0 0 4px;' }, _exEN ? 'Weight' : 'Poids'));
  weightActBtn.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);' }, _exEN ? 'Log it' : 'Enregistrer'));
  btnRow.appendChild(weightActBtn);

  var measActBtn = h('div', {
    style: 'background:var(--ivory2);border:1px solid var(--border);padding:16px;cursor:pointer;text-align:center;transition:all .2s ease;',
    onclick: function() { openTodayMeasurementsModal(); }
  });
  measActBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;margin:0 0 4px;' }, _exEN ? 'Meas.' : 'Mensur.'));
  measActBtn.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);' }, _exEN ? 'My measures' : 'Mes mesures'));
  btnRow.appendChild(measActBtn);

  var timerActBtn = h('div', {
    style: 'background:var(--ivory2);border:1px solid var(--border);padding:16px;cursor:pointer;text-align:center;transition:all .2s ease;',
    onclick: function() { openTodayKitchenTimer(); }
  });
  timerActBtn.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;margin:0 0 4px;' }, 'Timer'));
  timerActBtn.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);' }, _exEN ? 'Kitchen' : 'Cuisine'));
  btnRow.appendChild(timerActBtn);
  actCard.appendChild(btnRow);
  wrapper.appendChild(actCard);

  // Water Tracker
  wrapper.appendChild(sectionLabel(_exEN ? 'Hydration tracking' : 'Suivi hydratation'));
  var waterBox = card();
  if (window.WATER_TRACKER && window.WATER_TRACKER.renderWidget) {
    try { window.WATER_TRACKER.renderWidget(waterBox); } catch(e) {
      waterBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, _exEN ? 'Hydration tracking unavailable at the moment.' : 'Suivi hydratation non disponible pour le moment.'));
    }
  } else {
    waterBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, _exEN ? 'Track your water intake using the hydration tracker.' : 'Enregistrez votre consommation d\u2019eau via le suivi hydratation.'));
  }
  wrapper.appendChild(waterBox);

  // Sleep Tracker
  wrapper.appendChild(sectionLabel(_exEN ? 'Sleep tracking' : 'Suivi sommeil'));
  var sleepBox = card();
  if (window.SLEEP_TRACKER && window.SLEEP_TRACKER.renderWidget) {
    try { window.SLEEP_TRACKER.renderWidget(sleepBox); } catch(e) {
      sleepBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, _exEN ? 'Sleep tracking unavailable at the moment.' : 'Suivi sommeil non disponible pour le moment.'));
    }
  } else {
    sleepBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, (window.isEnglish && window.isEnglish()) ? 'Record your nights to track your sleep quality.' : 'Enregistrez vos nuits pour suivre la qualit\u00e9 de votre sommeil.'));
  }
  wrapper.appendChild(sleepBox);

  // ── Advanced metrics (progressive disclosure — available here via "Voir ma progression") ──

  // Volume tracking MEV/MAV/MRV (muscu users)
  try {
    var _extVolume = renderCardVolumeTracking();
    if (_extVolume) {
      wrapper.appendChild(sectionLabel(_exEN ? 'Volume tracking' : 'Suivi du volume'));
      var _extVtDiv = document.createElement('div');
      _extVtDiv.innerHTML = _extVolume;
      if (_extVtDiv.firstElementChild) wrapper.appendChild(_extVtDiv.firstElementChild);
    }
  } catch(_eExtVt) {}

  // TDEE adaptatif
  try {
    var _extTDEE = renderCardTDEEAdaptatif(S);
    if (_extTDEE) {
      wrapper.appendChild(sectionLabel(_exEN ? 'Adaptive caloric needs' : 'Besoins caloriques adaptatifs'));
      wrapper.appendChild(_extTDEE);
    }
  } catch(_eExtTDEE) {}

  // Weekly Summary
  wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Weekly summary' : 'Résumé hebdomadaire'));
  var weeklyBox = card();
  if (window.WEEKLY_SUMMARY && window.WEEKLY_SUMMARY.renderWidget) {
    try { window.WEEKLY_SUMMARY.renderWidget(weeklyBox); } catch(e) {
      weeklyBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, (window.isEnglish && window.isEnglish()) ? 'Weekly summary not available at the moment.' : 'R\u00e9sum\u00e9 hebdomadaire non disponible pour le moment.'));
    }
  } else {
    weeklyBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, (window.isEnglish && window.isEnglish()) ? 'The weekly summary will appear after your first complete week.' : 'Le r\u00e9sum\u00e9 hebdomadaire apparaîtra après votre premi\u00e8re semaine compl\u00e8te.'));
  }
  wrapper.appendChild(weeklyBox);

  // Progression
  wrapper.appendChild(sectionLabel(_exEN ? 'My progress' : 'Ma progression'));
  var perfBox = card();
  if (window.PERF_HISTORY && window.PERF_HISTORY.renderProgressionWidget) {
    try { window.PERF_HISTORY.renderProgressionWidget(perfBox); } catch(e) {
      perfBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, _exEN ? 'Progress chart unavailable at the moment.' : 'Graphique de progression non disponible pour le moment.'));
    }
  } else {
    perfBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, (window.isEnglish && window.isEnglish()) ? 'Your progress will appear here as you complete sessions.' : 'Votre progression s\u2019affichera ici au fil de vos s\u00e9ances.'));
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
      wrapper.appendChild(sectionLabel(_exEN ? '7-day summary' : 'Bilan 7 jours'));
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
      statsGrid.appendChild(insightStat(sessions, (window.isEnglish && window.isEnglish()) ? 'Sessions' : 'Séances'));
      statsGrid.appendChild(insightStat(kcal > 0 ? window.formatNumber(kcal) : '—', (window.isEnglish && window.isEnglish()) ? 'Kcal burned' : 'Kcal dépensées'));
      var sleep = (typeof insights.sleepAvg === 'number') ? insights.sleepAvg.toFixed(1) + '/5' : '—';
      statsGrid.appendChild(insightStat(sleep, (window.isEnglish && window.isEnglish()) ? 'Avg sleep' : 'Sommeil moyen'));
      var rpe = (typeof insights.rpeAvg === 'number') ? insights.rpeAvg.toFixed(1) + '/10' : '—';
      statsGrid.appendChild(insightStat(rpe, (window.isEnglish && window.isEnglish()) ? 'Avg RPE' : 'RPE moyen'));
      insightsBox.appendChild(statsGrid);

      // Bar chart jours actifs (micro, visuel minimaliste) — affiché UNIQUEMENT si
      // au moins une séance sur la semaine (sinon toutes les barres sont grises = bruit visuel).
      // FIX CONTRE-AUDIT : éviter l'UX confuse quand seul wellness est loggé sans session.
      if (Array.isArray(insights.byDay) && insights.byDay.length === 7 && (insights.sessions || 0) > 0) {
        var dayLabels = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
        var max = Math.max.apply(null, insights.byDay.concat([1]));
        var barsWrap = h('div', { style: 'display:flex;gap:4px;align-items:flex-end;height:32px;margin-bottom:12px;padding:0 4px;' });
        insights.byDay.forEach(function(cnt, i) {
          var col = h('div', { style: 'flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;' });
          var heightPct = cnt > 0 ? Math.max(8, Math.round((cnt / max) * 100)) : 6;
          var bar = h('div', {
            style: 'width:100%;height:' + heightPct + '%;background:' + (cnt > 0 ? 'var(--green,#3E5C3A)' : 'var(--border,#D8D8D0)') + ';border-radius:1px;transition:height 0.3s ease;'
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
          var colorByS = { info: 'var(--green,#3E5C3A)', warning: 'var(--orange,#E86F1E)', alert: 'var(--error,#7A1F1F)' };
          var bgBySeverity = { info: 'rgba(62,92,58,0.06)', warning: 'rgba(232,111,30,0.06)', alert: 'rgba(122,31,31,0.06)' };
          var col = colorByS[p.severity] || 'var(--grey,#6B6B65)';
          var bg = bgBySeverity[p.severity] || 'transparent';
          var pChip = h('div', {
            'class': 'sfc-pattern-chip',
            style: 'padding:10px 12px;background:' + bg + ';border-left:3px solid ' + col + ';'
          });
          pChip.appendChild(h('div', {
            style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:400;color:' + col + ';margin-bottom:3px;'
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
        wrapper.appendChild(sectionLabel(_exEN ? 'Weekly goals' : 'Objectifs cette semaine'));
        var goalsBox = card();

        // Helper : row progress avec label + progress bar + valeur
        function goalRow(label, current, target, pct, unit, colorByPct) {
          var row = h('div', { 'class': 'sfc-goal-row', style: 'padding:10px 4px;border-bottom:1px solid var(--border,#D8D8D0);' });
          var top = h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;' });
          top.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, label));
          var rightTxt = current + (unit ? ' ' + unit : '') + (target !== null && target !== undefined ? ' / ' + target + (unit ? ' ' + unit : '') : '');
          var rightEl = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);font-weight:400;' }, rightTxt);
          top.appendChild(rightEl);
          row.appendChild(top);
          // Progress bar
          var trackStyle = 'width:100%;height:6px;background:var(--border,#D8D8D0);border-radius:0;overflow:hidden;';
          var track = h('div', { style: trackStyle });
          var fillColor = colorByPct || 'var(--green,#3E5C3A)';
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
          var sCol = 'var(--green,#3E5C3A)';
          if (goals.sessions.pct !== null && goals.sessions.pct < 50) sCol = 'var(--orange,#E86F1E)';
          goalsBox.appendChild(goalRow(
            (window.isEnglish && window.isEnglish()) ? 'Sessions' : 'Séances',
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
          var kCol = 'var(--green,#3E5C3A)';
          // Si >110% ou <90% → warning orange, >125% ou <75% → rouge
          if (goals.kcalAvg.pct !== null) {
            var kDiff = Math.abs(goals.kcalAvg.pct - 100);
            if (kDiff > 25) kCol = 'var(--error,#7A1F1F)';
            else if (kDiff > 10) kCol = 'var(--orange,#E86F1E)';
          }
          goalsBox.appendChild(goalRow(
            (window.isEnglish && window.isEnglish()) ? 'Calories (7d avg)' : 'Calories (moy. 7j)',
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
          var pCol = 'var(--green,#3E5C3A)';
          if (goals.proteinAvg.pct !== null && goals.proteinAvg.pct < 80) pCol = 'var(--orange,#E86F1E)';
          goalsBox.appendChild(goalRow(
            (window.isEnglish && window.isEnglish()) ? 'Protein (7d avg)' : 'Protéines (moy. 7j)',
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
          var wCol = 'var(--green,#3E5C3A)';
          if (goals.wellnessLogged.pct < 50) wCol = 'var(--orange,#E86F1E)';
          goalsBox.appendChild(goalRow(
            (window.isEnglish && window.isEnglish()) ? 'Wellness log' : 'Bilan forme',
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
        wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Sleep & energy (30 days)' : 'Sommeil & énergie (30 jours)'));
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
          box.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:2px;' }, label));
          return box;
        }
        statsRow.appendChild(trendStat(
          _sleepAvg !== null ? _sleepAvg.toFixed(1) + '/5' : '—',
          (window.isEnglish && window.isEnglish()) ? 'Avg sleep' : 'Sommeil moyen'
        ));
        statsRow.appendChild(trendStat(
          _energyAvg !== null ? _energyAvg.toFixed(1) + '/3' : '—',
          (window.isEnglish && window.isEnglish()) ? 'Avg energy' : 'Énergie moyenne'
        ));
        statsRow.appendChild(trendStat(
          trend.loggedDays + '/30',
          ((window.isEnglish && window.isEnglish()) ? 'Logged days' : 'Jours loggés')
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
                    label: (window.isEnglish && window.isEnglish()) ? 'Sleep (1-5)' : 'Sommeil (1-5)',
                    data: trend.sleep,
                    borderColor: '#3E5C3A',
                    backgroundColor: 'rgba(62,92,58,0.08)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    spanGaps: true,
                    yAxisID: 'ySleep'
                  },
                  {
                    label: (window.isEnglish && window.isEnglish()) ? 'Energy (low/medium/high)' : 'Énergie (bas/moyen/haut)',
                    data: trend.energyScore,
                    borderColor: '#E86F1E',
                    backgroundColor: 'rgba(232,111,30,0.06)',
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
        wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Load progression (30 days)' : 'Progression charges (30 jours)'));
        var strengthBox = card();

        // Header : delta par exo (Georgia)
        var deltaRow = h('div', { style: 'display:flex;flex-direction:column;gap:6px;margin-bottom:12px;' });
        strengthTrend.datasets.forEach(function(ds, idx) {
          var delta = (ds.lastValue !== null && ds.firstValue !== null) ? (ds.lastValue - ds.firstValue) : null;
          var deltaPct = (delta !== null && ds.firstValue > 0) ? (delta / ds.firstValue) * 100 : null;
          var colorByDelta = (delta === null) ? 'var(--grey,#6B6B65)'
                              : (delta > 0 ? 'var(--green,#3E5C3A)'
                              : (delta < 0 ? 'var(--error,#7A1F1F)' : 'var(--grey,#6B6B65)'));
          var signTxt = (delta === null) ? '' : (delta > 0 ? '+' : '') + delta.toFixed(1) + ' kg';
          var pctTxt = (deltaPct !== null) ? ' (' + (deltaPct > 0 ? '+' : '') + deltaPct.toFixed(1) + '%)' : '';
          var line = h('div', { 'class': 'sfc-delta-row', style: 'display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--border,#D8D8D0);' });
          line.appendChild(h('span', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, ds.name));
          var right = h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:0.5px;color:' + colorByDelta + ';font-weight:400;' }, signTxt + pctTxt);
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
            // Palette alignee sur les tokens Hermes :root
            var palette = [
              { border: '#3E5C3A', bg: 'rgba(62, 92, 58, 0.07)' },   // --success / --green
              { border: '#B07A2A', bg: 'rgba(176, 122, 42, 0.07)' },  // --warning (ambre)
              { border: '#0A0A09', bg: 'rgba(10, 10, 9, 0.05)' }     // --ink-900 (encre)
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
                    borderWidth: 1.5,
                    tension: 0.35,
                    pointRadius: 2.5,
                    pointHoverRadius: 4,
                    pointBorderColor: color.border,
                    pointBackgroundColor: color.border,
                    fill: true,
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
                    grid: { color: 'rgba(216,216,208,0.25)' },
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
        wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Personal records' : 'Records personnels'));
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
            (window.isEnglish && window.isEnglish()) ? 'Weight range' : 'Plage de poids',
            wr.min + '–' + wr.max + ' kg',
            null
          ));
          hasContent = true;
        }

        // 3) Séance la plus longue
        if (records.longestSession) {
          var ls = records.longestSession;
          var lsDetail = [];
          if (ls.kcalTotal) lsDetail.push(ls.kcalTotal + ' ' + ((window.isEnglish && window.isEnglish()) ? 'kcal burned' : 'kcal brûlées'));
          if (ls.date) lsDetail.push(fmtDate(ls.date));
          recordsBox.appendChild(recordLine(
            (window.isEnglish && window.isEnglish()) ? 'Longest session' : 'Séance la plus longue',
            ls.duration + ' min',
            lsDetail.join(' · ')
          ));
          hasContent = true;
        }

        // 4) Streak max
        if (typeof records.maxStreak === 'number' && records.maxStreak > 0) {
          recordsBox.appendChild(recordLine(
            (window.isEnglish && window.isEnglish()) ? 'Longest streak' : 'Plus longue série',
            records.maxStreak + ' ' + window.locPlural(records.maxStreak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}),
            (window.isEnglish && window.isEnglish()) ? 'Consecutive days' : 'Jours consécutifs'
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
        wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Nutrition (30 days)' : 'Nutrition (30 jours)'));
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
          box.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:2px;' }, label));
          return box;
        }
        nStatsRow.appendChild(nutStat(
          kcalAvg !== null ? window.formatNumber(Math.round(kcalAvg)) : '—',
          ((window.isEnglish && window.isEnglish()) ? 'Avg kcal' : 'Kcal moy.')
        ));
        nStatsRow.appendChild(nutStat(
          pAvg !== null ? pAvg + ' g' : '—',
          ((window.isEnglish && window.isEnglish()) ? 'Avg protein' : 'Protéines moy.')
        ));
        nStatsRow.appendChild(nutStat(
          adherencePct !== null ? adherencePct + '%' : '—',
          ((window.isEnglish && window.isEnglish()) ? 'Target adherence' : 'Adhérence cible')
        ));
        nStatsRow.appendChild(nutStat(
          nutTrend.loggedDays + '/30',
          (window.isEnglish && window.isEnglish()) ? 'Logged days' : 'Jours loggés'
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
                label: (window.isEnglish && window.isEnglish()) ? 'Calories (kcal)' : 'Calories (kcal)',
                data: nutTrend.kcal,
                borderColor: '#3E5C3A',
                backgroundColor: 'rgba(62,92,58,0.08)',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 4,
                spanGaps: true,
                yAxisID: 'yKcal'
              },
              {
                label: (window.isEnglish && window.isEnglish()) ? 'Protein (g)' : 'Protéines (g)',
                data: nutTrend.protein,
                borderColor: '#E86F1E',
                backgroundColor: 'rgba(232,111,30,0.06)',
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
                label: (window.isEnglish && window.isEnglish()) ? 'Target kcal' : 'Cible kcal',
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
  wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Weight curve' : 'Courbe de poids'));
  var rawHistCheck = (S.weightHistory || []).filter(function(e) {
    if (!e) return false;
    var w = parseFloat(e.weight || e.w || e);
    return !isNaN(w) && w > 0;
  });
  var chartWrap = card();
  if (rawHistCheck.length < 2) {
    var _weightEmpty = h('div', { style: 'text-align:center;padding:32px 24px 20px;' });
    // SVG : mini balance stylisée (monochrome trait 1px)
    var _wSvgNs = 'http://www.w3.org/2000/svg';
    var _wSvg = document.createElementNS(_wSvgNs, 'svg');
    _wSvg.setAttribute('width', '48'); _wSvg.setAttribute('height', '48');
    _wSvg.setAttribute('viewBox', '0 0 56 56'); _wSvg.setAttribute('fill', 'none');
    _wSvg.setAttribute('stroke', '#A8A8A0'); _wSvg.setAttribute('stroke-width', '1');
    _wSvg.setAttribute('stroke-linecap', 'round');
    _wSvg.innerHTML = '<line x1="28" y1="12" x2="28" y2="44"/><line x1="16" y1="44" x2="40" y2="44"/><line x1="12" y1="22" x2="44" y2="22"/><polyline points="12,22 18,32 24,22"/><polyline points="32,22 38,32 44,22"/>';
    var _wSvgWrap = h('div', { style: 'display:flex;justify-content:center;margin-bottom:16px;opacity:0.6;' });
    _wSvgWrap.appendChild(_wSvg);
    _weightEmpty.appendChild(_wSvgWrap);
    _weightEmpty.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:15px;color:var(--ink-900,#0A0A09);margin-bottom:8px;line-height:1.3;' }, (window.isEnglish && window.isEnglish()) ? 'No data yet' : 'Pas encore de courbe'));
    _weightEmpty.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);line-height:1.6;max-width:220px;margin:0 auto;' }, (window.isEnglish && window.isEnglish()) ? 'Add at least two weigh-ins to see your progress.' : 'Ajoutez au moins deux pes\u00e9es pour voir votre progression.'));
    chartWrap.appendChild(_weightEmpty);
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
        data: { labels: labels, datasets: [{ data: data, borderColor: '#3E5C3A', backgroundColor: 'rgba(62,92,58,0.06)', pointRadius: 2.5, pointHoverRadius: 4, pointBackgroundColor: '#3E5C3A', pointBorderColor: '#3E5C3A', tension: 0.35, fill: true, borderWidth: 1.5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0A0A09', titleFont: { family: 'Georgia, serif', size: 11 }, bodyFont: { family: 'Helvetica Neue, Arial, sans-serif', size: 11 }, padding: 8, callbacks: { label: function(c) { var v = c.parsed.y; return window.UNITS ? window.UNITS.displayWeightVal(v) + ' ' + window.UNITS.weightLabel() : v.toFixed(1) + ' kg'; } } } }, scales: { y: { ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 10 }, callback: function(v) { return window.UNITS ? window.UNITS.displayWeightVal(v) + ' ' + window.UNITS.weightLabel() : v + ' kg'; } }, grid: { color: 'rgba(216,216,208,0.25)' } }, x: { grid: { display: false }, ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 } } } } }
      }) : null;
    });
  }
  wrapper.appendChild(chartWrap);

  // Kcal chart (Chart.js)
  if (Array.isArray(S.weekPlan) && S.weekPlan.length === 7) {
    wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Calories per day — weekly plan' : 'Calories par jour — plan semaine'));
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
      var JOURS_CH = (window.isEnglish && window.isEnglish()) ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
      var target = (window.calcTarget ? window.calcTarget() : 0) || (S.calories && S.calories > 0 ? S.calories : 2000);
      var dayKcals = S.weekPlan.map(function(day) {
        if (!day) return 0;
        function getK(meal) { return (meal && (meal.k || (meal.baseNutrition && meal.baseNutrition.calories) || meal.kcal)) || 0; }
        return getK(day.breakfast) + getK(day.lunch) + getK(day.snack) + getK(day.dinner);
      });
      // Empty state : si tous les kcals sont a 0, afficher un message plutot qu'un chart vide
      var _allZero = dayKcals.every(function(k) { return k === 0; });
      if (_allZero) {
        var kcalEmpty = h('div', { style: 'text-align:center;padding:32px 24px 20px;' });
        // SVG : mini assiette (cohérent avec emptyIllu('nutrition'))
        var _kSvgNs = 'http://www.w3.org/2000/svg';
        var _kSvg = document.createElementNS(_kSvgNs, 'svg');
        _kSvg.setAttribute('width', '40'); _kSvg.setAttribute('height', '40');
        _kSvg.setAttribute('viewBox', '0 0 56 56'); _kSvg.setAttribute('fill', 'none');
        _kSvg.setAttribute('stroke', '#A8A8A0'); _kSvg.setAttribute('stroke-width', '1');
        _kSvg.setAttribute('stroke-linecap', 'round');
        _kSvg.innerHTML = '<circle cx="28" cy="28" r="20"/><circle cx="28" cy="28" r="12" stroke-dasharray="3 3"/>';
        var _kSvgWrap = h('div', { style: 'display:flex;justify-content:center;margin-bottom:14px;opacity:0.5;' });
        _kSvgWrap.appendChild(_kSvg);
        kcalEmpty.appendChild(_kSvgWrap);
        kcalEmpty.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;color:var(--ink-900,#0A0A09);margin-bottom:6px;line-height:1.3;' }, (window.isEnglish && window.isEnglish()) ? 'Plan pending' : 'Plan en attente'));
        kcalEmpty.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);line-height:1.6;max-width:220px;margin:0 auto;' }, (window.isEnglish && window.isEnglish()) ? 'Calories will appear here once the plan is filled.' : 'Les calories apparaitront ici lorsque le plan sera rempli.'));
        ctx2.style.display = 'none';
        ctx2.parentNode.appendChild(kcalEmpty);
        return;
      }
      if (window._todayKcalChart) { try { window._todayKcalChart.destroy(); } catch(e2) {} window._todayKcalChart = null; }
      window._todayKcalChart = window.createChart ? window.createChart(ctx2, {
        type: 'bar',
        data: { labels: JOURS_CH, datasets: [
          { label: 'Kcal plan', data: dayKcals, backgroundColor: dayKcals.map(function(k) { var r = k / target; return r < 0.92 ? 'rgba(62,92,58,0.55)' : r > 1.08 ? 'rgba(122,31,31,0.50)' : 'rgba(62,92,58,0.75)'; }), borderColor: dayKcals.map(function(k) { var r = k / target; return r < 0.92 ? 'rgba(62,92,58,0.25)' : r > 1.08 ? 'rgba(122,31,31,0.25)' : 'rgba(62,92,58,0.35)'; }), borderWidth: 1, borderRadius: 0 },
          { label: 'Cible', data: Array(7).fill(target), type: 'line', borderColor: '#7A1F1F', borderDash: [4,3], pointRadius: 0, borderWidth: 1.2, fill: false }
        ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0A0A09', titleFont: { family: 'Georgia, serif', size: 11 }, bodyFont: { family: 'Helvetica Neue, Arial, sans-serif', size: 11 }, padding: 8, callbacks: { label: function(c) { return c.dataset.label + ' : ' + Math.round(c.parsed.y) + ' kcal'; } } } }, scales: { y: { ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 }, callback: function(v) { return v + ' kcal'; } }, grid: { color: 'rgba(216,216,208,0.25)' } }, x: { grid: { display: false }, ticks: { font: { family: 'Helvetica Neue, Arial, sans-serif', size: 9 } } } } }
      }) : null;
    });
  }

  // Food Journal
  wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Food journal' : 'Journal alimentaire'));
  var foodBox = card();
  if (window.FOOD_JOURNAL) {
    try { window.FOOD_JOURNAL.renderWidget(foodBox); } catch(e) {
      foodBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, (window.isEnglish && window.isEnglish()) ? 'Food journal unavailable at the moment.' : 'Journal alimentaire non disponible pour le moment.'));
    }
  } else {
    foodBox.appendChild(h('div', { style: 'font-size:11px;color:var(--grey);text-align:center;padding:12px 0;' }, (window.isEnglish && window.isEnglish()) ? 'Log your meals to track your daily nutritional intake.' : 'Notez vos repas pour suivre vos apports nutritionnels au quotidien.'));
  }
  wrapper.appendChild(foodBox);

  // Progress Photos
  if (window.PHOTO_PROGRESS && window.PHOTO_PROGRESS.renderWidget) {
    var photoBox = h('div', {});
    try { window.PHOTO_PROGRESS.renderWidget(photoBox); } catch(e) {}
    if (photoBox.children.length > 0) wrapper.appendChild(photoBox);
  }

  // Badges preview
  wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Badges' : 'Badges'));
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
  // Bible Hermès §13.1 : monogrammes typographiques, pas d'emoji.
  if (badgesData.length > 0) {
    badgesData.forEach(function(b) {
      var badgeId = typeof b === 'string' ? b : (b && b.id ? b.id : null);
      if (!badgeId) return;
      var def = (window.GAMIFICATION && window.GAMIFICATION.BADGE_DEFS) ? window.GAMIFICATION.BADGE_DEFS.find(function(d){ return d.id === badgeId; }) : null;
      // Monogramme : emoji filtré des défs legacy, on prend label initiales ou icon custom texte court.
      var monogram = (BADGE_EMOJI[badgeId] && BADGE_EMOJI[badgeId].emoji) || '';
      // Filtrer les emoji Unicode (range étendu)
      if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(monogram)) monogram = '';
      if (!monogram) {
        var label = (def && def.name) || (typeof b === 'object' && b.name) || badgeId;
        monogram = String(label).charAt(0).toUpperCase();
      }
      var mini = h('div', {
        style: 'width:40px;height:40px;border:1px solid var(--line,#D8D8D0);background:transparent;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:13px;color:var(--ink-900,#0A0A09);font-feature-settings:"onum" 1;',
        title: (def && def.name) || (typeof b === 'object' && b.name) || ''
      }, monogram.slice(0, 3));
      badgesRow.appendChild(mini);
    });
  } else {
    // Placeholder : 3 cercles vides
    ['I', 'II', 'III'].forEach(function(txt) {
      var mini = h('div', { style: 'width:40px;height:40px;border:1px dashed var(--line,#D8D8D0);background:transparent;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:13px;color:var(--ink-300,#A8A8A0);' }, txt);
      badgesRow.appendChild(mini);
    });
    badgesCard.appendChild(h('p', { style: 'font-size:12px;color:var(--ink-500,#6B6B65);margin:12px 0 0;font-family:Georgia,serif;line-height:1.55;font-style:italic;' }, (window.isEnglish && window.isEnglish()) ? 'Your first milestones await.' : 'Vos premiers paliers vous attendent.'));
  }
  var badgeLink = h('span', {
    style: 'font-size:11px;color:var(--grey);cursor:pointer;margin-left:auto;',
    onclick: function() { if (window.GAMIFICATION && window.GAMIFICATION.renderBadgesPanel) openTodayBadgesModal(); }
  }, (window.isEnglish && window.isEnglish()) ? 'See all badges \u2192' : 'Voir tous les badges \u2192');
  badgesRow.appendChild(badgeLink);
  badgesCard.insertBefore(badgesRow, badgesCard.firstChild);
  wrapper.appendChild(badgesCard);

  // Mes données
  wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'My data' : 'Mes données'));
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
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'PDF export unavailable. Reload the page.' : 'Export PDF indisponible. Rechargez la page.', 'error', 3500);
      }
    }
  }, (window.isEnglish && window.isEnglish()) ? '\u2193 Download my PDF report' : '\u2193 Télécharger mon rapport PDF');
  dataBtns.appendChild(pdfBtn);

  var exportBtn = h('button', {
    'class': 'sfc-data-btn sfc-data-btn-primary',
    onclick: function() { todayExportAllData(); }
  }, (window.isEnglish && window.isEnglish()) ? '\u2B07 Export my data' : '\u2B07 Exporter mes données');
  dataBtns.appendChild(exportBtn);

  var importBtn = h('button', {
    'class': 'sfc-data-btn sfc-data-btn-outline',
    onclick: function() { todayImportData(); }
  }, (window.isEnglish && window.isEnglish()) ? '\u2B06 Import a backup' : '\u2B06 Importer une sauvegarde');
  dataBtns.appendChild(importBtn);

  var deleteBtn = h('button', {
    'class': 'sfc-data-btn sfc-data-btn-danger',
    onclick: function() { todayDeleteAllData(); }
  }, (window.isEnglish && window.isEnglish()) ? 'Delete all my data' : 'Supprimer toutes mes données');
  dataBtns.appendChild(deleteBtn);

  dataCard.appendChild(dataBtns);
  wrapper.appendChild(dataCard);

  // POLISH 2026-04 (NOTIFS) : toggle rappels push PWA
  if ('Notification' in window) {
    wrapper.appendChild(sectionLabel((window.isEnglish && window.isEnglish()) ? 'Reminders & notifications' : 'Rappels & notifications'));
    var notifsCard = card();
    var currentEnabled = (typeof S.pushNotifsEnabled === 'boolean') ? S.pushNotifsEnabled : true;
    var permState = (typeof Notification !== 'undefined') ? Notification.permission : 'unknown';

    // Ligne 1 : toggle principal
    var toggleRow = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:6px 0;' });
    var toggleLabel = h('div');
    toggleLabel.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, (window.isEnglish && window.isEnglish()) ? 'Enable reminders' : 'Activer les rappels'));
    toggleLabel.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:3px;line-height:1.4;' }, (window.isEnglish && window.isEnglish()) ? 'Daily motivation, meals, re-engagement after inactivity' : 'Motivation quotidienne, repas, relance après inactivité'));
    toggleRow.appendChild(toggleLabel);

    // Switch visuel (track + thumb)
    var switchTrack = h('div', {
      style: 'position:relative;width:48px;height:24px;background:' + (currentEnabled ? 'var(--black,#0A0A09)' : 'var(--line,#D8D8D0)') + ';border-radius:2px;cursor:pointer;transition:background 0.2s ease;flex-shrink:0;',
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
      style: 'position:absolute;top:2px;left:' + (currentEnabled ? '22px' : '2px') + ';width:20px;height:20px;background:var(--paper,#FAF9F6);border-radius:2px;transition:left 0.22s cubic-bezier(0.4, 0, 0.2, 1);'
    });
    switchTrack.appendChild(switchThumb);
    toggleRow.appendChild(switchTrack);
    notifsCard.appendChild(toggleRow);

    // Ligne 2 : état permission (info)
    if (currentEnabled) {
      var stateText = '';
      var stateColor = 'var(--grey,#6B6B65)';
      if (permState === 'granted') { stateText = (window.isEnglish && window.isEnglish()) ? 'Permission granted ✓' : 'Permission accordée ✓'; stateColor = 'var(--green,#3E5C3A)'; }
      else if (permState === 'denied') { stateText = (window.isEnglish && window.isEnglish()) ? 'Permission denied — enable in browser settings' : 'Permission refusée — autoriser dans les paramètres du navigateur'; stateColor = 'var(--error,#7A1F1F)'; }
      else { stateText = (window.isEnglish && window.isEnglish()) ? 'Permission not requested — will be prompted on next use' : 'Permission non demandée — demande apparaîtra au prochain usage'; }
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
  var weightHistory = (window.S && Array.isArray(window.S.weightHistory)) ? window.S.weightHistory : [];
  if (!weightHistory.length) { try { weightHistory = JSON.parse(localStorage.getItem('mtd_weight_history_' + uid) || '[]'); } catch(e) {} }

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
  var _minSafe = window.isFemale(_S) ? 1500 : 1800;
  // Adoucir aussi : pas plus de ±300 kcal/j d'ajustement vs TDEE actuel (anti-yoyo)
  var _maxStep = 300;
  if (Math.abs(kcalAdjust) > _maxStep) kcalAdjust = (kcalAdjust > 0 ? _maxStep : -_maxStep);
  var newTDEE = Math.max(_minSafe, tdee - kcalAdjust);
  var diffKcal = Math.abs(tdee - newTDEE);
  if (diffKcal < 50) return null; // Ajustement trop faible, ignorer

  var c = card('border-left:3px solid var(--orange,#E86F1E);');
  c.appendChild(eyebrow((window.isEnglish && window.isEnglish()) ? 'Recommended adjustment' : 'Ajustement recommandé'));

  var _tdeeEN = window.isEnglish && window.isEnglish();
  var title = delta > 0
    ? (_tdeeEN ? 'Your body is responding less to the deficit' : 'Votre corps répond moins bien au déficit')
    : (_tdeeEN ? 'Faster loss than expected' : 'Perte plus rapide que prévu');
  c.appendChild(cardTitle(title));

  var actualStr = (actualChange >= 0 ? '+' : '') + actualChange.toFixed(1) + ' kg';
  var expectedStr = (expectedChange >= 0 ? '+' : '') + expectedChange.toFixed(1) + ' kg';

  c.appendChild(h('p', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin:8px 0;line-height:1.5;' },
    (_tdeeEN ? 'Over ' + daysDiff + ' days: you lost/gained ' + actualStr + ' (expected: ' + expectedStr + ').' : 'Sur ' + daysDiff + ' jours\u00a0: vous avez perdu/pris ' + actualStr + ' (attendu\u00a0: ' + expectedStr + ').')
  ));

  var _adjEN = window.isEnglish && window.isEnglish();
  var adjustMsg = delta > 0
    ? (_adjEN ? 'Reduce your intake by ' + diffKcal + '\u00a0kcal/day (target: ' + newTDEE + '\u00a0kcal)' : 'R\u00e9duisez vos apports de ' + diffKcal + '\u00a0kcal/jour (cible\u00a0: ' + newTDEE + '\u00a0kcal)')
    : (_adjEN ? 'You can increase your intake by ' + diffKcal + '\u00a0kcal/day (target: ' + newTDEE + '\u00a0kcal)' : 'Vous pouvez augmenter vos apports de ' + diffKcal + '\u00a0kcal/jour (cible\u00a0: ' + newTDEE + '\u00a0kcal)');

  c.appendChild(h('p', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:400;color:var(--orange-ink,#7A3B0E);margin:8px 0 0;line-height:1.5;' }, adjustMsg));

  // FIX FAIL-2 : avertissement explicite si on touche le plancher (perte trop rapide → médecin)
  if (newTDEE === _minSafe && delta < -1.5) {
    c.appendChild(h('p', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--error,#7A1F1F);margin:8px 0 0;line-height:1.5;' },
      (window.isEnglish && window.isEnglish()) ? '⚠ Rapid loss detected. Safe kcal floor reached. Consult a doctor/dietitian before continuing.' : '⚠ Perte rapide détectée. Plancher kcal sécuritaire atteint. Consulte un médecin/diététicien avant de poursuivre.'
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
  }, (window.isEnglish && window.isEnglish()) ? 'Got it' : 'OK, j\'ai compris');
  c.appendChild(dismissBtn);

  return c;
}

// ─── BILAN HEBDOMADAIRE (dimanche) ───
function renderCardSundayReview(S) {
  var now = new Date();
  var isSunday = now.getDay() === 0;
  if (!isSunday && !S._forceWeeklyReview) return null;

  // Ne pas construire le DOM si déjà dismissé aujourd'hui — clé isolée par userId (fix 2026-04-19)
  var uid = (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';
  var _wrDismissKey = 'mtd_weekly_review_dismissed_' + uid + '_' + now.toISOString().slice(0, 10);
  try { if (localStorage.getItem(_wrDismissKey) === '1') return null; } catch(e) {}

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
  c.appendChild(eyebrow((window.isEnglish && window.isEnglish()) ? 'WEEKLY REVIEW' : 'Bilan de la semaine'));
  c.appendChild(cardTitle((window.isEnglish && window.isEnglish()) ? 'Your week' : 'Votre semaine'));

  // Stats row
  var statsRow = h('div', { style: 'display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;' });

  // Séances
  var seancesBox = h('div', { style: 'flex:1;min-width:80px;padding:12px;background:var(--ivory2);border:1px solid var(--border);border-radius:2px;text-align:center;' });
  seancesBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:24px;color:var(--green,#3E5C3A);' }, String(seancesDone)));
  seancesBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px;' }, (window.isEnglish && window.isEnglish()) ? 'Sessions' : 'Séances'));
  statsRow.appendChild(seancesBox);

  // Calories moyennes
  if (avgKcal > 0) {
    var kcalBox = h('div', { style: 'flex:1;min-width:80px;padding:12px;background:var(--ivory2);border:1px solid var(--border);border-radius:2px;text-align:center;' });
    kcalBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:24px;color:var(--blue,#1A3A6A);' }, String(avgKcal)));
    kcalBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px;' }, (window.isEnglish && window.isEnglish()) ? 'Avg kcal' : 'Kcal moy.'));
    statsRow.appendChild(kcalBox);
  }

  // Poids
  if (currentWeight > 0) {
    var weightBox = h('div', { style: 'flex:1;min-width:80px;padding:12px;background:var(--ivory2);border:1px solid var(--border);border-radius:2px;text-align:center;' });
    weightBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:24px;color:var(--orange,#E86F1E);' }, currentWeight + ' kg'));
    weightBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px;' }, (window.isEnglish && window.isEnglish()) ? 'Weight' : 'Poids'));
    statsRow.appendChild(weightBox);
  }

  c.appendChild(statsRow);

  // Message de motivation — Bible Hermès §4 : tutoiement, pas de ponctuation émotionnelle.
  var motivMsg;
  var _sEN = window.isEnglish && window.isEnglish();
  if (seancesDone >= 4) motivMsg = _sEN ? 'Strong week. Consistency is the key.' : 'Semaine tenue. La régularité, c\'est la clé.';
  else if (seancesDone >= 2) motivMsg = _sEN ? 'Good week. Keep up the momentum.' : 'Bonne semaine. Vous continuez sur cette lancée.';
  else if (seancesDone >= 1) motivMsg = _sEN ? 'A start. Next week, aim for 3 sessions.' : 'Un début. La semaine prochaine, vise 3 séances.';
  else motivMsg = _sEN ? 'No session this week. Back at it tomorrow.' : 'Pas de séance cette semaine. Vous reprenez demain.';

  c.appendChild(h('p', { style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--grey);margin:12px 0 0;line-height:1.6;' }, motivMsg));

  // Bouton dismiss
  var dismissBtn = h('button', {
    style: 'margin-top:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);background:transparent;border:none;cursor:pointer;padding:12px 0;min-height:44px;display:block;width:100%;text-align:left;',
    onclick: function() {
      S._forceWeeklyReview = false;
      // Stocker le dismiss dans localStorage avec userId pour isolation multi-compte (fix 2026-04-19)
      var _dismissUid = (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';
      try { localStorage.setItem('mtd_weekly_review_dismissed_' + _dismissUid + '_' + new Date().toISOString().slice(0, 10), '1'); } catch(e) {}
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? 'Close review' : 'Fermer le bilan');
  c.appendChild(dismissBtn);

  // Ne pas réafficher si déjà fermé aujourd'hui (isolation userId)
  try {
    if (localStorage.getItem(_wrDismissKey) === '1') return null;
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

  // Calcul état nutritionnel (goalConflict, hydratation, macros contexte) à chaque rendu
  // si le mode inclut la nutrition et que _nm est périmé ou absent.
  if (S.appMode !== 'sport' && !S._nm && window.computeNutritionState) {
    try { window.computeNutritionState(false); } catch(e) {}
  }

  // Moteur décisionnel central : rafraîchit la décision quotidienne (cache 5 min).
  // Doit s'exécuter APRÈS computeNutritionState (besoin de S._nm pour le signal nutrition→training).
  if (window.SFCDecisionCore) {
    try { window.SFCDecisionCore.decide(); } catch(e) {}
  }

  p.innerHTML = '';

  // FIX 2026-04-16 — FAB Logger bouton POIDS : le flag était set mais jamais lu
  if (S._modalQuickWeight) {
    S._modalQuickWeight = false;
    if (typeof openTodayWeightPrompt === 'function') { setTimeout(function() { openTodayWeightPrompt(); }, 50); }
  }

  // ─── BILAN DE FORME — card inline (non bloquant depuis 2026-04-22) ───
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
  // _wellnessCard est injecté après le hero — pas de return, dashboard visible en même temps
  var _wellnessCard = null;
  if (_needCheckin && _hasSport && !_isFirstDay && window.renderWellnessCheckin) {
    var _wc = h('div', { style: 'max-width:560px;margin:0 auto;' });
    try {
      window.renderWellnessCheckin(_wc, function() {
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        renderTodayDashboard(p);
      });
      _wellnessCard = _wc;
    } catch(_eWc) { console.warn('[wellness card inline]', _eWc); }
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

  // ═══ BANDEAU VERSION D'ESSAI (Hermès — ruban tabac discret au-dessus du hero) ═══
  // FIX 2026-04-16 : le bandeau trial de renderCardBonjour n'était plus appelé
  // depuis la migration vers renderHeroContextuel → invisible. On le remet ici.
  try {
    if (window.isTrialUser && window.isTrialUser() && !(window.S && window.S._serverPremium) && !(window.isPremium && window.isPremium())) {
      var _td = (typeof window.getTrialDaysLeft === 'function') ? window.getTrialDaysLeft() : 0;
      var _tdUrgent = _td <= 2;
      var _tBorder = _tdUrgent ? '#C0390E' : 'var(--orange,#E86F1E)';
      var _tBg = _tdUrgent ? 'rgba(192,57,14,0.07)' : 'rgba(232,111,30,0.05)';
      var _tBar = h('div', {
        style:
          'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
          'max-width:560px;margin:0 auto 0;padding:12px 16px;' +
          'border:1px solid ' + _tBorder + ';background:' + _tBg + ';' +
          'border-radius:0;cursor:pointer;'
      });
      _tBar.addEventListener('click', function() {
        if (window.showPaywall) window.showPaywall('premium');
        else { S.view = 'profil'; if (window.render) window.render(); }
      });
      var _tL = h('div', {style: 'flex:1;min-width:0;'});
      var _trEN = window.isEnglish && window.isEnglish();
      _tL.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--orange-ink,#7A3B0E);font-weight:500;margin-bottom:3px;'
      }, _trEN ? 'TRIAL VERSION' : 'VERSION D\u2019ESSAI'));
      var _tCopy = _td <= 0 ? (_trEN ? 'Trial ended \u2014 Unlock access \u2192' : 'Essai terminé \u2014 Débloquez l\u2019accès \u2192')
        : _td === 1 ? (_trEN ? 'Last day \u2014 Subscribe to continue \u2192' : 'Dernier jour \u2014 Abonnez-vous pour continuer \u2192')
        : _td <= 3 ? (_trEN ? 'Only ' + _td + ' days left \u2014 Continue without interruption \u2192' : 'Plus que ' + _td + ' jours \u2014 Continuez sans interruption \u2192')
        : (_trEN ? _td + ' days to explore everything \u2014 Subscribe \u2192' : _td + ' jours pour tout explorer \u2014 S\u2019abonner \u2192');
      _tL.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + (_tdUrgent ? '#7A1F1F' : 'var(--grey,#6B6B65)') + ';line-height:1.4;'
      }, _tCopy));
      _tBar.appendChild(_tL);
      var _tR = h('div', {
        style: 'font-family:Georgia,serif;font-size:22px;color:' + (_tdUrgent ? '#C0390E' : 'var(--orange-ink,#7A3B0E)') + ';flex-shrink:0;line-height:1;'
      }, _td > 0 ? String(_td) + (_trEN ? 'd' : 'j') : '!');
      _tBar.appendChild(_tR);
      wrapper.appendChild(_tBar);
    }
  } catch(_eTr) { console.warn('[trial banner hero]', _eTr); }

  // ── SmartFitCoach Today — première décision visible dès l'ouverture ──
  try {
    var _cardToday = renderSmartFitCoachToday();
    if (_cardToday) wrapper.appendChild(_cardToday);
  } catch (_eSFC) { console.warn('[SmartFitCoachToday]', _eSFC); }

  // ── AI Insight — contextual intelligence surfaced from training history ──
  try {
    var _cardInsight = buildSmartInsight();
    if (_cardInsight) wrapper.appendChild(_cardInsight);
  } catch (_eIns) { console.warn('[AIInsight]', _eIns); }

  // ── Wellness check-in inline (non bloquant) ──
  if (_wellnessCard) wrapper.appendChild(_wellnessCard);

  // ═══ HERO CONTEXTUEL HORAIRE (Bible Hermès §1, §7) ═══
  // Matin (6h-11h) / Midi (11h-17h) / Soir (17h-23h).
  var hero = renderHeroContextuel();
  if (hero) wrapper.appendChild(hero);

  // ── Mini-pill Séquence (streak) — visible immédiatement sous le hero ──
  var _streakPill = null; var _heatmap = null; var _formeCard = null;
  try {
    var _muid = (window.AUTH && window.AUTH.getUser) ? ((window.AUTH.getUser()) || {}).id : null;
    var _msd = _muid ? JSON.parse(localStorage.getItem('mtd_streak_' + _muid) || '{}') : {};
    var _msc = (typeof _msd.current === 'number') ? _msd.current : 0;
    var _todayStr2 = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
    var _isFirstDay2 = !S.firstLoginDate || S.firstLoginDate === _todayStr2;
    if (_msc >= 1 && !_isFirstDay2) {
      var _jTotals = (window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal) ? window.FOOD_JOURNAL.getDayTotal() : { kcal: 0, count: 0 };
      var _actionDone = (_jTotals.count > 0) || (_jTotals.kcal > 0);
      var _miniStreak = h('div', {
        style: 'max-width:560px;margin:6px auto 0;padding:8px 16px;' +
               'display:flex;align-items:center;justify-content:space-between;' +
               'background:var(--paper-2,#F4F1EA);border:1px solid var(--line,#D8D8D0);'
      });
      _miniStreak.appendChild(h('span', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;' +
               'letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);'
      }, (window.isEnglish && window.isEnglish()) ? 'Streak' : 'Séquence'));
      _miniStreak.appendChild(h('span', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;' +
               'text-transform:uppercase;color:' + (_actionDone ? '#27AE60' : 'var(--grey,#6B6B65)') + ';'
      }, _actionDone ? ((window.isEnglish && window.isEnglish()) ? '✓ done' : '✓ validée') : ((window.isEnglish && window.isEnglish()) ? '○ pending' : '○ en attente')));
      var _mRight = h('div', { style: 'display:flex;align-items:baseline;gap:4px;' });
      _mRight.appendChild(h('span', {
        style: 'font-family:Georgia,serif;font-size:20px;font-style:italic;color:var(--black,#0A0A09);'
      }, String(_msc)));
      _mRight.appendChild(h('span', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;' +
               'letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);'
      }, window.locPlural(_msc, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}})));
      _miniStreak.appendChild(_mRight);
      _streakPill = _miniStreak;
    }
  } catch(_eMini) {}

  // ── Heatmap 7 jours — visualisation perte de momentum (loss aversion) ──
  // 7 cercles L M M J V S D : remplis si repas loggé ce jour-là.
  // Affiché uniquement à partir de J+2 pour ne pas perturber le tout premier jour.
  try {
    if (_muid && !_isFirstDay2) {
      var _fjKey = 'mtd_food_journal_' + _muid;
      var _fjData = {};
      try { _fjData = JSON.parse(localStorage.getItem(_fjKey) || '{}'); } catch(e) {}
      // Construire la liste des 7 derniers jours (lundi→dimanche de la semaine courante)
      var _hmToday = new Date();
      var _hmDow = _hmToday.getDay(); // 0=dim, 1=lun, ...
      var _hmMonday = new Date(_hmToday);
      _hmMonday.setDate(_hmToday.getDate() - ((_hmDow + 6) % 7));
      var _hmDays = (window.isEnglish && window.isEnglish()) ? ['M','Tu','W','Th','F','Sa','Su'] : ['L','Ma','Me','J','V','S','D'];
      var _hmHasAny = false;
      var _hmDots = [];
      for (var _hi = 0; _hi < 7; _hi++) {
        var _hmD = new Date(_hmMonday);
        _hmD.setDate(_hmMonday.getDate() + _hi);
        var _hmStr = _hmD.getFullYear() + '-' + String(_hmD.getMonth()+1).padStart(2,'0') + '-' + String(_hmD.getDate()).padStart(2,'0');
        var _hmFuture = _hmD > _hmToday;
        var _hmLogged = !_hmFuture && _fjData[_hmStr] && Array.isArray(_fjData[_hmStr]) && _fjData[_hmStr].length > 0;
        if (_hmLogged) _hmHasAny = true;
        _hmDots.push({ label: _hmDays[_hi], logged: _hmLogged, today: _hmStr === _todayStr2, future: _hmFuture });
      }
      if (_hmHasAny || _msc >= 1) {
        var _hmWrap = h('div', {
          style: 'max-width:560px;margin:4px auto 0;padding:8px 16px;' +
                 'background:var(--paper-2,#F4F1EA);border:1px solid var(--line,#D8D8D0);' +
                 'display:flex;align-items:center;justify-content:space-between;'
        });
        _hmWrap.appendChild(h('span', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);'
        }, (window.isEnglish && window.isEnglish()) ? 'Week' : 'Semaine'));
        var _hmRow = h('div', { style: 'display:flex;gap:6px;align-items:center;' });
        _hmDots.forEach(function(_hd) {
          var _dot = h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:2px;' });
          _dot.appendChild(h('span', {
            style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;letter-spacing:0;text-transform:uppercase;color:var(--grey,#6B6B65);'
          }, _hd.label));
          _dot.appendChild(h('div', {
            style: 'width:10px;height:10px;border-radius:50%;' + (
              _hd.future ? 'background:transparent;border:1px solid var(--line,#D8D8D0);' :
              _hd.today && !_hd.logged ? 'background:transparent;border:1.5px solid var(--orange,#E86F1E);' :
              _hd.logged ? 'background:var(--black,#0A0A09);' :
              'background:transparent;border:1px dashed var(--grey,#6B6B65);opacity:0.4;'
            )
          }));
          _hmRow.appendChild(_dot);
        });
        _hmWrap.appendChild(_hmRow);
        _heatmap = _hmWrap;
      }
    }
  } catch(_eHm) {}

  // ── Carte Forme du Jour — affichée quand le bilan est déjà complété aujourd'hui ──
  if (!_needCheckin && _hasSport && !_isFirstDay && window.getWellnessAdaptation) {
    try {
      var _adapt = window.getWellnessAdaptation();
      if (_adapt && _adapt.level) {
        var _afEN = window.isEnglish && window.isEnglish();
        var _adaptLabels = {
          recovery: _afEN ? 'Recovery session recommended' : 'Séance de récupération conseillée',
          reduced: _afEN ? 'Reduced intensity recommended' : 'Intensité réduite conseillée',
          peak: _afEN ? 'Peak condition' : 'Forme optimale',
          normal: _afEN ? 'Daily form — good' : 'Forme du jour — correcte'
        };
        var _adaptAdvice = {
          recovery: _afEN ? 'Your condition requires a light session. Intensity reduced by 40%.' : 'Votre état de forme nécessite une séance légère. Intensité réduite de 40 %.',
          reduced: _afEN ? 'Slight fatigue detected. Intensity reduced by 20%. Listen to your body.' : 'Légère fatigue détectée. Intensité réduite de 20 %. Écoutez votre corps.',
          peak: _afEN ? 'Excellent form. You can push on the heavy sets.' : 'Excellent état de forme. Vous pouvez pousser sur les sets lourds.',
          normal: _afEN ? 'Good session ahead. Respect the rest times.' : 'Bonne séance en perspective. Respectez les temps de repos.'
        };
        var _recCard = h('div', {
          style: 'max-width:560px;margin:6px auto 0;padding:10px 16px;' +
                 'display:flex;align-items:flex-start;gap:10px;' +
                 'background:var(--paper-2,#F4F1EA);border:1px solid var(--line,#D8D8D0);' +
                 'border-left:3px solid ' + _adapt.color + ';'
        });
        var _recInner = h('div', { style: 'flex:1;min-width:0;' });
        _recInner.appendChild(h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;' +
                 'text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:3px;'
        }, _afEN ? 'Daily form' : 'Forme du jour'));
        _recInner.appendChild(h('div', {
          style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);'
        }, _adaptLabels[_adapt.level] || _adapt.label));
        _recInner.appendChild(h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;line-height:1.5;'
        }, _adaptAdvice[_adapt.level] || _adapt.advice));
        _recCard.appendChild(_recInner);
        _formeCard = _recCard;
      }
    } catch(_eRec) {}
  }

  // ═══ PENSÉE DU JOUR (Hermès — citation de motivation, change chaque jour) ═══
  // FIX 2026-04-16 : les citations motivantes vivaient dans renderCardBonjour (code
  // mort depuis la migration hero contextuel). On réinjecte ici la plus belle source
  // MOTIVATION_LIBRARY (300+ phrases, rotation déterministe jour/weekday/streak).
  // FIX UX 2026-04-17 : la Pensée du Jour est construite ici mais appendChild() est
  // reporté après les cartes Séance + Repas (data first, motivation ensuite — UX audit).
  var _pensee = null;
  try {
    var _dailyQuote = null;
    var _qAuthor = '';
    if (window.MOTIVATION_LIBRARY && typeof window.MOTIVATION_LIBRARY.getDailyMotivation === 'function') {
      var _mprofile = {
        prenom: (window.getDisplayFirstName ? window.getDisplayFirstName() : (S.prenom || '')) || '',
        streak: 0,
        isTrainingDay: null
      };
      try {
        var _uidM = (window.AUTH && window.AUTH.getUser && window.AUTH.getUser()) ? window.AUTH.getUser().id : null;
        if (_uidM) {
          var _sRaw = localStorage.getItem('mtd_streak_' + _uidM);
          if (_sRaw) { var _so = JSON.parse(_sRaw); if (_so && typeof _so.current === 'number') _mprofile.streak = _so.current; }
        }
      } catch(_eStrk) {}
      try {
        if (typeof window.getDayType === 'function') {
          var _ti = (new Date().getDay() + 6) % 7;
          var _dt = window.getDayType(_ti);
          if (_dt) _mprofile.isTrainingDay = !!_dt.isTraining;
        }
      } catch(_eDt) {}
      var _m = window.MOTIVATION_LIBRARY.getDailyMotivation(_mprofile);
      if (_m && _m.body) _dailyQuote = _m.body;
    }
    // Fallback sur TODAY_QUOTES (rotation par jour de l'année)
    if (!_dailyQuote && Array.isArray(TODAY_QUOTES) && TODAY_QUOTES.length) {
      var _doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      var _q = TODAY_QUOTES[_doy % TODAY_QUOTES.length];
      if (_q) { _dailyQuote = _q.text || _q; _qAuthor = _q.author || ''; }
    }

    if (_dailyQuote) {
      var _qWrap = h('div', { style:
        'max-width:560px;margin:24px auto 8px;padding:28px 24px;text-align:center;' +
        'background:transparent;position:relative;'
      });
      // Filet horizontal + label Hermès
      var _qLabel = h('div', { style:
        'display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:20px;'
      });
      _qLabel.appendChild(h('span', {style: 'flex:1;max-width:56px;height:1px;background:var(--line,#D8D8D0);'}));
      _qLabel.appendChild(h('span', {style:
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;' +
        'text-transform:uppercase;color:var(--ink-500,#6B6B65);font-weight:400;'
      }, (window.isEnglish && window.isEnglish()) ? 'Thought of the day' : 'Pensée du jour'));
      _qLabel.appendChild(h('span', {style: 'flex:1;max-width:56px;height:1px;background:var(--line,#D8D8D0);'}));
      _qWrap.appendChild(_qLabel);

      // Guillemet ouvrant Georgia XL (signature éditoriale Hermès)
      _qWrap.appendChild(h('div', { style:
        'font-family:Georgia,serif;font-size:48px;line-height:0.4;color:var(--accent,var(--ink-900,#0A0A09));' +
        'margin-bottom:4px;user-select:none;'
      }, '\u201C'));

      // La citation — Georgia italic, 17px, élégante
      _qWrap.appendChild(h('p', { style:
        'font-family:Georgia,serif;font-style:italic;font-size:17px;line-height:1.55;' +
        'color:var(--ink-900,#0A0A09);margin:0 12px 14px;font-weight:normal;' +
        'letter-spacing:0.2px;'
      }, _dailyQuote));

      // Auteur (si présent) — Helvetica micro caps
      if (_qAuthor) {
        _qWrap.appendChild(h('div', { style:
          'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;' +
          'text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:6px;'
        }, '\u2014 ' + _qAuthor));
      }

      // Filet final bas — simple trait vert sapin centré (signature maison)
      _qWrap.appendChild(h('div', { style:
        'width:32px;height:1px;background:var(--accent,var(--ink-900,#0A0A09));margin:16px auto 0;'
      }));

      _pensee = _qWrap; // Différé : append après les cartes data (Séance + Repas)
    }
  } catch(_eQ) { console.warn('[pensée du jour]', _eQ); }

  // ═══ SECTION "AUJOURD'HUI" — Séance + Repas en priorité (redesign 2026-04-16) ═══
  // Benchmark MFP/Strong/Hevy : séance + nutrition toujours en haut du dashboard.

  // ── Banners de validation (si plans non validés) ──
  try {
    var _isoWeek = window.currentISOWeek ? window.currentISOWeek() : null;
    // FIX 2026-04-16 : auto-revalidation silencieuse.
    // Bug : chaque lundi (changement ISO week) le bandeau "valider mon plan" réapparaît
    //       même si le plan n'a pas changé (mêmes ingrédients, mêmes recettes). Très chiant.
    // Règle : si le plan est déjà validé ET que son hash n'a pas changé, on revalide en silence
    //         pour la nouvelle semaine. Le bandeau ne s'affiche que si quelque chose a changé.
    if (_isoWeek && S.weekPlanValidated && S.weekPlanValidatedISOWeek && S.weekPlanValidatedISOWeek !== _isoWeek) {
      var _currentHash = window.getPlanHash ? window.getPlanHash() : '';
      if (S._planHash && S._planHash === _currentHash) {
        S.weekPlanValidatedISOWeek = _isoWeek;
        if (window.saveProfile) window.saveProfile();
        console.log('[dashboard] auto-revalidation silencieuse semaine ISO ' + _isoWeek + ' (plan inchangé)');
      } else {
        S._planHash = _currentHash;
      }
    } else if (_isoWeek && S.weekPlanValidated && !S._planHash && S.weekPlan) {
      S._planHash = window.getPlanHash ? window.getPlanHash() : '';
      if (window.saveProfile) window.saveProfile();
    }
    var _nutNeedsValidation = S.weekPlan && Array.isArray(S.weekPlan) && S.weekPlan.length >= 7
      && (!S.weekPlanValidated || (S.weekPlanValidatedISOWeek && _isoWeek && S.weekPlanValidatedISOWeek !== _isoWeek));
    // FIX 2026-04-16 : ne pas afficher le bandeau si AUCUN programme n'existe encore.
    // Bug : un user sans programme généré voyait le bandeau "Confirme ton programme" alors
    //       qu'il n'y avait rien à confirmer. Maintenant on attend qu'un programme existe
    //       (sportProgram, muscuIAProgram, ou autres programmes spécifiques au sport choisi).
    var _hasAnyProgram = (Array.isArray(S.sportProgram) && S.sportProgram.length > 0)
      || S.muscuIAProgram || S.runningProgram || S.cyclingProgram
      || S.triathlonProgram || S.hyroxProgram || S.padelProgram
      || S.golfProgram || S.yogaWeek || S.calisthenicsWeek;
    var _sportNeedsValidation = S.sportType && !S.sportProgramValidated && _hasAnyProgram
      && (S.appMode === 'sport' || S.appMode === 'both');

    // P2 HYPERSTAB 2026-04-17 — Bannière fusionnée quand les DEUX plans sont à valider.
    // Préserve intégralement la logique individuelle quand un seul plan est concerné.
    var _bothNeedValidation = _nutNeedsValidation && _sportNeedsValidation;

    // Auto-activation silencieuse — zéro friction pour l'utilisateur.
    // Un plan généré est prêt à l'emploi : pas besoin d'une confirmation manuelle.
    // Toast discret uniquement lors de la première activation de la semaine.
    var _autoActivated = false;
    if (_bothNeedValidation) {
      try {
        S.weekPlanValidated = true;
        if (_isoWeek) S.weekPlanValidatedISOWeek = _isoWeek;
        S._planHash = window.getPlanHash ? window.getPlanHash() : '';
        S.sportProgramValidated = true;
        S.sportProgramValidatedAt = new Date().toISOString();
        if (window.saveProfile) window.saveProfile();
        _autoActivated = true;
      } catch(_eBoth) { console.warn('[auto-activate both]', _eBoth); }
    } else {
      if (_nutNeedsValidation) {
        try {
          S.weekPlanValidated = true;
          if (_isoWeek) S.weekPlanValidatedISOWeek = _isoWeek;
          S._planHash = window.getPlanHash ? window.getPlanHash() : '';
          if (window.saveProfile) window.saveProfile();
          _autoActivated = true;
        } catch(_eNut) { console.warn('[auto-activate nut]', _eNut); }
      }
      if (_sportNeedsValidation) {
        try {
          S.sportProgramValidated = true;
          S.sportProgramValidatedAt = new Date().toISOString();
          if (window.saveProfile) window.saveProfile();
          _autoActivated = true;
        } catch(_eSp) { console.warn('[auto-activate sport]', _eSp); }
      }
    }
    if (_autoActivated) {
      setTimeout(function() {
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Programs activated for the week' : 'Programmes activés pour la semaine', 'success', 1600);
      }, 300);
    }
  } catch(_eVal) { console.warn('[validation banners]', _eVal); }

  // ── Streak inline — juste sous la séance pour la motivation immédiate ──
  // UX fix: était après les cartes nutrition → invisible. Maintenant sous la séance.
  if (_streakPill) wrapper.appendChild(_streakPill);

  // ── Card 2 — REPAS DU JOUR (juste après la séance) ──
  var cardRepas = renderCardRepas();
  if (cardRepas) wrapper.appendChild(cardRepas);

  // ── Card 2b — JOURNAL DU JOUR (ajout manuel d'aliments, style MFP) ──
  try {
    var cardFoodJournal = renderFoodJournalCard();
    if (cardFoodJournal) wrapper.appendChild(cardFoodJournal);
  } catch(_eFJ) { console.warn('[today] renderFoodJournalCard error', _eFJ); }

  // ── Card 2c — HYDRATATION ──
  try {
    var cardWater = renderCardWater();
    if (cardWater) wrapper.appendChild(cardWater);
  } catch(_eWat) { console.warn('[today] renderCardWater error', _eWat); }

  // ── Éléments secondaires différés — visibles après le contenu actionnable ──
  if (_formeCard) wrapper.appendChild(_formeCard);
  if (_heatmap) wrapper.appendChild(_heatmap);

  // ── Pensée du jour (différée : après les cartes data, avant progression) ──
  if (_pensee) wrapper.appendChild(_pensee);

  // ═══ SECTION "PROGRESSION" ═══

  // Card 3 — Streak & badges
  var cardStreak = renderCardStreak();
  if (cardStreak) wrapper.appendChild(cardStreak);

  // Card 3b — Volume tracking MEV/MAV/MRV : moved to progression drawer (→ "Voir ma progression")
  // Rationale: advanced metric — cognitive overload for most users on the main today view.

  // ═══ SECTION "CONTEXTE & SECONDAIRE" ═══

  // PREMIERS PAS : pour les users sans AUCUN plan (onboarding incomplet)
  try {
    var _hasNutritionPlan = Array.isArray(S.weekPlan) && S.weekPlan.length >= 7;
    var _hasSportPlan = (Array.isArray(S.sportProgram) && S.sportProgram.length > 0)
                        || (S.muscuIAProgram && typeof S.muscuIAProgram === 'string' && S.muscuIAProgram.length > 100)
                        || (S.activeProgram && Array.isArray(S.activeProgram.weekProgram) && S.activeProgram.weekProgram.length > 0)
                        || (S.sportType === 'crossfit' && S.sStep === 0)
                        || (S.sportType === 'running' && S.runningProgram)
                        || (S.sportType === 'triathlon' && S.triathlonProgram)
                        || (S.sportType === 'hyrox' && S.hyroxProgram)
                        || (S.sportType === 'padel' && S.padelProgram)
                        || (S.sportType === 'golf' && S.golfProgram)
                        || (S.sportType === 'cycling' && S.cyclingProgram)
                        || (S.sportType === 'calisthenics')
                        || (S.sportType === 'musculation' && !!S.sportType);
    if (!_hasNutritionPlan && !_hasSportPlan) {
      var _firstStepCard = card();
      _firstStepCard.appendChild(eyebrow((window.isEnglish && window.isEnglish()) ? 'GET STARTED' : 'COMMENCER'));
      _firstStepCard.appendChild(h('div', {style:'font-family:Georgia,serif;font-size:22px;margin-bottom:12px;font-weight:normal;line-height:1.25;'}, (window.isEnglish && window.isEnglish()) ? 'Your first plan awaits.' : 'Votre premier plan vous attend.'));
      _firstStepCard.appendChild(h('div', {style:'font-family:Georgia,serif;font-style:italic;font-size:15px;color:var(--ink-700,#2B2B27);line-height:1.55;margin-bottom:24px;'}, (window.isEnglish && window.isEnglish()) ? 'Start your personalized assessment \u2014 nutrition, sport, health.' : 'Commencez votre bilan personnalis\u00e9 \u2014 nutrition, sport, sant\u00e9.'));
      var _btnRow = h('div', {style:'display:flex;gap:12px;flex-wrap:wrap;'});
      if (S.appMode !== 'nutrition') {
        _btnRow.appendChild(h('button', {
          'class': 'btn-primary',
          onclick: function() { S.view = 'sport'; if (window.render) window.render(); }
        }, (window.isEnglish && window.isEnglish()) ? 'CREATE MY SPORT PROGRAM' : 'CR\u00c9ER MON PROGRAMME SPORT'));
      }
      if (S.appMode !== 'sport') {
        _btnRow.appendChild(h('button', {
          'class': 'btn-secondary',
          onclick: function() { S.view = 'nutrition'; if (window.render) window.render(); }
        }, (window.isEnglish && window.isEnglish()) ? 'CREATE MY NUTRITION PLAN' : 'CR\u00c9ER MON PLAN NUTRITION'));
      }
      _firstStepCard.appendChild(_btnRow);
      wrapper.appendChild(_firstStepCard);
    }
  } catch(e) { console.warn('[FirstStepCard]', e); }

  // Card — "Aujourd'hui pour toi" (pathologies, conditions spéciales)
  var cardToday = renderCardTodayForYou();
  if (cardToday) wrapper.appendChild(cardToday);

  // Card — CrossFit 1RM (CF users only)
  var cardCF = renderCardCrossfit1RM();
  if (cardCF) wrapper.appendChild(cardCF);

  // Card — Macros du jour (seulement si pas de hero)
  var cardMacros = renderCardMacros(); if (cardMacros && !hero) wrapper.appendChild(cardMacros);

  // Warning — Conflit objectif nutrition × sport (mode nutrition ou both uniquement)
  var _nm = window.S && window.S._nm;
  if (_nm && _nm.goalConflict && S.appMode !== 'sport') {
    var _gcWrap = h('div', { style: 'margin:0 0 16px;padding:12px 14px;border-left:3px solid var(--orange,#E86F1E);background:rgba(232,111,30,0.05);border-radius:0 2px 2px 0;' });
    _gcWrap.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange,#E86F1E);font-weight:500;margin-bottom:6px;' }, (window.isEnglish && window.isEnglish()) ? 'GOAL CONFLICT' : 'CONFLIT D’OBJECTIF'));
    _gcWrap.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--ink-900,#0A0A09);line-height:1.6;' }, _nm.goalConflict));
    wrapper.appendChild(_gcWrap);
  }

  // Card — TDEE adaptatif : moved to progression drawer (→ "Voir ma progression")
  // Rationale: highly technical metric — surfaced on demand, not by default.

  // Card — Bilan hebdo (dimanche uniquement)
  var cardWeekly = renderCardSundayReview(S);
  if (cardWeekly) wrapper.appendChild(cardWeekly);

  // Card — Raccourcis rapides
  var cardShortcuts = renderCardShortcuts(); if (cardShortcuts) wrapper.appendChild(cardShortcuts);

  // ═══ DRAWER PROGRESSION (Bible Hermès §10) ═══
  // Bottom sheet fullscreen avec animation translateY — rendu via document.body.
  // Bible §13.2 : trigger drawer en Georgia italic, pas d'uppercase tracking.
  var drawerTrigger = h('button', {
    style: 'display:flex;align-items:center;justify-content:space-between;width:100%;margin:36px 0 4px;padding:20px 16px;background:var(--paper-2,#F4F1EA);border:1px solid var(--line,#D8D8D0);border-radius:2px;color:var(--ink-900,#0A0A09);font-family:Georgia,serif;font-style:italic;font-size:15px;cursor:pointer;text-align:left;min-height:56px;',
    onclick: function() {
      S._dashExtOpen = true;
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? 'View my progress  \u2192' : 'Voir ma progression  \u2192');
  wrapper.appendChild(drawerTrigger);

  p.appendChild(wrapper);
}

// ─── EXPOSE GLOBALLY ───
window.TODAY = {
  render: renderTodayDashboard,
  shareProgression: shareProgression
};
// Exposé séparément pour gamification.js (share nudge sur badge unlock)
window.shareProgression = shareProgression;
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

// ═══════════════════════════════════════════════════════════════════════════
// COACH IA BARRE PERSISTANTE — Bible Hermès §6
// ═══════════════════════════════════════════════════════════════════════════
// Barre bottom-sticky, 64px repos, masquée sur onboarding/scanner.
// Placeholder rotatif contextuel (matin/midi/soir).
// ═══════════════════════════════════════════════════════════════════════════
// FIX SPRINT P2.8 — Prompts du coach IA enrichis et muscu-aware.
// Selon le profil (muscu vs nutrition) + moment + état (séance prévue, fatigue),
// on propose un placeholder pertinent (pas du nutrition-centric pour user muscu).
var _cpEN = window.isEnglish && window.isEnglish();
var COACH_PROMPTS = {
  matin: _cpEN ? [
    'Tell me what\'s holding you back today.',
    'What do you want to eat for lunch?',
    'How are you feeling this morning?'
  ] : [
    'Dites-moi ce qui vous freine aujourd\'hui.',
    'Que voulez-vous manger ce midi ?',
    'Comment vous sentez-vous au réveil ?'
  ],
  midi: _cpEN ? [
    'Your lunch, shall we talk about it?',
    'Want to adjust your evening session?',
    'What\'s your question right now?'
  ] : [
    'Votre déjeuner, on en parle ?',
    'Voulez-vous adapter votre séance de ce soir ?',
    'Quelle est votre question du moment ?'
  ],
  soir: _cpEN ? [
    'Day recap?',
    'Want to plan tomorrow?',
    'How did the session go?'
  ] : [
    'Bilan de la journée ?',
    'Voulez-vous préparer demain ?',
    'Comment s\'est passée la séance ?'
  ],
  veille: _cpEN ? [
    'Need advice before sleep?',
    'A question about your recovery?'
  ] : [
    'Besoin d\'un conseil avant de dormir ?',
    'Une question sur votre récupération ?'
  ]
};
var COACH_PROMPTS_MUSCU = {
  matin: _cpEN ? [
    'Want to adjust today\'s session?',
    'Which exercise do you want to prioritize?',
    'Did you recover well?'
  ] : [
    'Voulez-vous ajuster votre séance d\'aujourd\'hui ?',
    'Quel exo voulez-vous travailler en priorité ?',
    'Avez-vous bien récupéré ?'
  ],
  midi: _cpEN ? [
    'How was your bench yesterday?',
    'Do you feel ready for a squat PR?',
    'Want to swap an exercise?'
  ] : [
    'Comment était votre bench hier ?',
    'Vous sentez-vous prêt pour un PR au squat ?',
    'Voulez-vous remplacer un exo ?'
  ],
  soir: _cpEN ? [
    'How did the session go?',
    'Want to log a PR?',
    'Tomorrow: rest or next session?'
  ] : [
    'Comment s\'est passée la séance ?',
    'Voulez-vous logger un PR ?',
    'Demain : repos ou séance suivante ?'
  ],
  veille: _cpEN ? [
    'Need a recovery tip?',
    'Want to plan your next session?'
  ] : [
    'Besoin d\'un conseil récup ?',
    'Voulez-vous préparer votre prochaine séance ?'
  ]
};
var COACH_PROMPTS_FATIGUE = _cpEN ? [
  'You seem tired. Shall we lighten the session?',
  'Rest or gentle mobility today?',
  'Want me to suggest a shorter session?'
] : [
  'Vous semblez fatigué. On allège la séance ?',
  'Repos ou mobilité douce aujourd\'hui ?',
  'Voulez-vous que je propose une séance plus courte ?'
];

function renderCoachBar() {
  var S = window.S;
  if (!S) return null;
  // Conditions pour afficher : user connecté + onboarding complet + pas en mode scanner/modal
  if (!S.appMode) return null;
  // Masquer pendant édition modales lourdes
  if (S.modalRecipe || S.modalSmoothie || S.shopArMode || S._goalModal) return null;

  var hour = new Date().getHours();
  var momentKey = (hour >= 6 && hour < 11) ? 'matin'
               : (hour >= 11 && hour < 17) ? 'midi'
               : (hour >= 17 && hour < 23) ? 'soir' : 'veille';
  // FIX SPRINT P2.8 — Coach bar muscu-aware
  // Détection user muscu + état fatigue → prompts adaptés.
  // FIX BUG-MUSCU-COACHBAR 2026-04 : (S.appMode === 'sport') capturait yoga/running/padel →
  // leur affichait les prompts musculation dans la coach bar. Maintenant : strict sur sportType.
  var _isMuscuUser = S.sportType === 'muscu' || S.sportType === 'musculation' || S.sportType === 'calisthenics';
  var _isFatigued = false;
  try {
    var _w = S.todayWellness;
    if (_w && _w.date === new Date().toISOString().slice(0,10)) {
      _isFatigued = (typeof _w.energy === 'number' && _w.energy <= 2)
                 || (typeof _w.muscle === 'number' && _w.muscle <= 2);
    }
  } catch(eF) {}
  var prompts;
  if (_isFatigued && _isMuscuUser) {
    prompts = COACH_PROMPTS_FATIGUE;
  } else if (_isMuscuUser && COACH_PROMPTS_MUSCU[momentKey]) {
    // Mix : 70% prompts muscu + 30% prompts généraux pour variété
    prompts = COACH_PROMPTS_MUSCU[momentKey].concat((COACH_PROMPTS[momentKey] || []).slice(0, 1));
  } else {
    prompts = COACH_PROMPTS[momentKey] || COACH_PROMPTS.midi;
  }
  var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var currentPrompt = prompts[dayOfYear % prompts.length];

  var bar = h('div', {
    id: 'coach-bar',
    style: 'position:fixed;left:0;right:0;bottom:0;height:64px;background:rgba(250,249,246,0.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-top:1px solid var(--line,#D8D8D0);z-index:900;padding:0 20px;padding-bottom:env(safe-area-inset-bottom);display:flex;align-items:center;gap:12px;'
  });

  // Puce H (coach) — 24px cercle avec lettre Georgia
  var chip = h('div', {
    style: 'width:28px;height:28px;border:1px solid var(--ink-900,#0A0A09);border-radius:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:Georgia,serif;font-size:13px;color:var(--ink-900,#0A0A09);'
  }, 'H');
  bar.appendChild(chip);

  // Input transparent
  var input = h('input', {
    type: 'text',
    placeholder: currentPrompt,
    style: 'flex:1;min-width:0;border:none;border-bottom:1px solid var(--line,#D8D8D0);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:var(--ink-900,#0A0A09);padding:10px 0;outline:none;font-style:italic;',
    onfocus: function(e) {
      e.target.style.borderBottomColor = 'var(--ink-900,#0A0A09)';
      e.target.style.fontStyle = 'normal';
    },
    onblur: function(e) {
      e.target.style.borderBottomColor = 'var(--line,#D8D8D0)';
      if (!e.target.value) e.target.style.fontStyle = 'italic';
    },
    onkeydown: function(e) {
      if (e.key === 'Enter' && e.target.value.trim()) {
        var msg = e.target.value.trim();
        e.target.value = '';
        // FIX 2026-04-16 : ouvrir le panel AI Coach overlay (pas S.view='coach' qui n'existe pas)
        if (window.AI_COACH) {
          window.AI_COACH.open();
          // Pré-remplir le message et l'envoyer automatiquement
          setTimeout(function() {
            var coachInput = document.getElementById('ai-coach-input');
            if (coachInput) { coachInput.value = msg; }
            if (window.AI_COACH.send) window.AI_COACH.send();
          }, 300);
        }
      }
    }
  });
  bar.appendChild(input);

  // Bouton envoyer (flèche)
  var sendBtn = h('button', {
    style: 'width:36px;height:36px;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink-900,#0A0A09);padding:0;flex-shrink:0;',
    'aria-label': (window.isEnglish && window.isEnglish()) ? 'Send to coach' : 'Envoyer au coach',
    onclick: function() {
      var val = input.value.trim();
      // FIX 2026-04-16 : ouvrir le panel AI Coach overlay directement
      if (window.AI_COACH) {
        window.AI_COACH.open();
        if (val) {
          input.value = '';
          setTimeout(function() {
            var coachInput = document.getElementById('ai-coach-input');
            if (coachInput) { coachInput.value = val; }
            if (window.AI_COACH.send) window.AI_COACH.send();
          }, 300);
        }
      }
    }
  });
  // SVG flèche droite stroke 1.2
  sendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  bar.appendChild(sendBtn);

  return bar;
}

// ═══════════════════════════════════════════════════════════════════════════
// FAB "+ LOGGER" — Bible Hermès §8
// ═══════════════════════════════════════════════════════════════════════════
// Cercle 56×56 noir, fixed bottom-right 20px, au-dessus coach bar (+20px).
// Tap → menu radial 4 items (Repas / Poids / Eau / Séance).
// ═══════════════════════════════════════════════════════════════════════════

function getDefaultMealSlot() {
  var h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  return 'dinner';
}

function renderQuickAddDrawer() {
  var S = window.S;
  var slot = S._quickAddSlot || getDefaultMealSlot();
  var _qaEN = window.isEnglish && window.isEnglish();
  var MEAL_LABELS = { breakfast: _qaEN ? 'Breakfast' : 'Petit-déj', lunch: _qaEN ? 'Lunch' : 'Déjeuner', snack: _qaEN ? 'Snack' : 'Collation', dinner: _qaEN ? 'Dinner' : 'Dîner' };
  var MEAL_FULL = { breakfast: _qaEN ? 'Breakfast' : 'Petit-déjeuner', lunch: _qaEN ? 'Lunch' : 'Déjeuner', snack: _qaEN ? 'Snack' : 'Collation', dinner: _qaEN ? 'Dinner' : 'Dîner' };

  // Récupérer les aliments récents (même logique que le journal)
  var recentFoods = [];
  try {
    var _qaUid = (window.AUTH && window.AUTH.getUser) ? ((window.AUTH.getUser()) || {}).id : 'anon';
    var _qaJournalKey = 'mtd_food_journal_' + (_qaUid || 'anon');
    var _qaJournal = JSON.parse(localStorage.getItem(_qaJournalKey) || '{}');
    var _qaDays = Object.keys(_qaJournal).sort().reverse().slice(0, 7);
    var _qaSeen = {};
    for (var _qaD = 0; _qaD < _qaDays.length; _qaD++) {
      var _qaEntries = _qaJournal[_qaDays[_qaD]] || [];
      for (var _qaEi = _qaEntries.length - 1; _qaEi >= 0; _qaEi--) {
        var _qaE = _qaEntries[_qaEi];
        if (!_qaE || !_qaE.name || _qaSeen[_qaE.name]) continue;
        _qaSeen[_qaE.name] = true;
        recentFoods.push({ name: _qaE.name, kcal: _qaE.kcal || 0, p: _qaE.p || 0, g: _qaE.g || 0, l: _qaE.l || 0 });
        if (recentFoods.length >= 6) break;
      }
      if (recentFoods.length >= 6) break;
    }
  } catch(_eQaLoad) { recentFoods = []; }

  var wrapper = h('div', { id: 'quick-add-drawer-wrapper' });

  // Backdrop
  var backdrop = h('div', {
    style: 'position:fixed;inset:0;background:rgba(10,10,9,0.4);z-index:960;',
    onclick: function() { S._quickAddSlot = null; if (window.render) window.render(); }
  });
  wrapper.appendChild(backdrop);

  // Drawer panel
  var panel = h('div', {
    style: 'position:fixed;left:0;right:0;bottom:0;z-index:970;background:var(--paper,#FAF9F6);border-top:1px solid var(--line,#D8D8D0);padding:0 0 calc(64px + env(safe-area-inset-bottom));max-height:80vh;overflow-y:auto;'
  });

  // Handle bar
  var handle = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;border-bottom:1px solid var(--line,#D8D8D0);' });
  handle.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);' }, (window.isEnglish && window.isEnglish()) ? 'Add a meal' : 'Ajouter un repas'));
  var closeBtn = h('button', {
    style: 'background:none;border:none;cursor:pointer;padding:4px;color:var(--grey,#6B6B65);font-size:18px;line-height:1;min-height:32px;min-width:32px;',
    onclick: function() { S._quickAddSlot = null; if (window.render) window.render(); }
  }, '×');
  handle.appendChild(closeBtn);
  panel.appendChild(handle);

  // Meal slot selector
  var slotWrap = h('div', { style: 'display:flex;gap:8px;padding:12px 16px;overflow-x:auto;' });
  ['breakfast', 'lunch', 'snack', 'dinner'].forEach(function(key) {
    var active = slot === key;
    var chip = h('button', {
      style: 'flex-shrink:0;padding:6px 14px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;cursor:pointer;min-height:36px;'
        + (active
          ? 'background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:1px solid var(--ink-900,#0A0A09);'
          : 'background:transparent;color:var(--grey,#6B6B65);border:1px solid var(--line,#D8D8D0);'),
      onclick: function() { S._quickAddSlot = key; if (window.render) window.render(); }
    }, MEAL_LABELS[key]);
    slotWrap.appendChild(chip);
  });
  panel.appendChild(slotWrap);

  if (recentFoods.length > 0) {
    panel.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);padding:4px 20px 8px;'
    }, (window.isEnglish && window.isEnglish()) ? 'Recent' : 'Récents'));

    recentFoods.forEach(function(food) {
      var defP = (window.FOOD_PORTIONS && window.FOOD_PORTIONS.getDefaultPortion) ? window.FOOD_PORTIONS.getDefaultPortion(food.name) : null;
      var grams = defP ? defP.g : 100;
      var fac = grams / 100;
      var portionLabel = defP ? defP.label : '100g';

      var row = h('div', {
        style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-bottom:1px solid var(--line,#D8D8D0);cursor:pointer;',
        onclick: function() {
          if (!window.FOOD_JOURNAL || !window.FOOD_JOURNAL.addEntry) return;
          window.FOOD_JOURNAL.addEntry(
            slot,
            food.name,
            Math.round(food.kcal * fac),
            Math.round(food.p * fac * 10) / 10,
            Math.round(food.g * fac * 10) / 10,
            Math.round(food.l * fac * 10) / 10,
            portionLabel
          );
          S._quickAddSlot = null;
          if (window.showToast) window.showToast('✓ ' + food.name + ' ' + (_qaEN ? 'added to ' : 'ajouté au ') + MEAL_FULL[slot].toLowerCase(), 'success', 2000);
          if (window.render) window.render();
        }
      });

      var info = h('div', { style: 'flex:1;min-width:0;' });
      info.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--ink-900,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, food.name));
      info.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;' }, portionLabel + ' · ' + Math.round(food.kcal * fac) + ' kcal'));
      row.appendChild(info);

      var addBtn = h('div', {
        style: 'width:32px;height:32px;border-radius:2px;background:var(--ink-900,#0A0A09);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:12px;'
      });
      addBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--paper,#FAF9F6)" stroke-width="1.5" stroke-linecap="round"><path d="M7 2v10M2 7h10"/></svg>';
      row.appendChild(addBtn);
      panel.appendChild(row);
    });
  } else {
    panel.appendChild(h('div', {
      style: 'padding:20px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);'
    }, (window.isEnglish && window.isEnglish()) ? 'No recent food — use the search below.' : 'Aucun aliment récent — utilisez la recherche ci-dessous.'));
  }

  // Bouton "Rechercher dans la base →"
  var searchBtn = h('button', {
    style: 'display:block;width:calc(100% - 32px);margin:12px 16px;padding:12px;background:transparent;border:1px solid var(--line,#D8D8D0);color:var(--grey,#6B6B65);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;text-align:center;min-height:44px;',
    onclick: function() {
      S._quickAddSlot = null;
      S._fabOpen = false;
      // Naviguer vers le journal nutritionnel
      setTimeout(function() {
        var jc = document.getElementById('fj-card-root');
        if (jc) { jc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else { S.view = 'nutrition'; S.nStep = 12; if (window.render) window.render(); }
      }, 80);
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish()) ? 'Search in the database →' : 'Rechercher dans la base →');
  panel.appendChild(searchBtn);

  wrapper.appendChild(panel);
  return wrapper;
}

function renderFabLogger() {
  var S = window.S;
  if (!S) return null;
  if (!S.appMode) return null; // Onboarding
  if (S.modalRecipe || S.modalSmoothie || S.shopArMode) return null;

  var isOpen = !!S._fabOpen;

  // Quick Add Drawer — prioritaire sur le FAB normal
  if (S._quickAddSlot) {
    return renderQuickAddDrawer();
  }

  // FIX 2026-04-16 : restructuré le FAB pour que les boutons ne soient PAS bloqués
  // par le backdrop. Avant : backdrop position:fixed+inset:0 DANS le container → les
  // boutons (position:absolute sans z-index) étaient derrière le backdrop → aucun clic
  // ne passait. Maintenant : wrapper externe contient backdrop + container séparés.
  var wrapper = h('div', { id: 'fab-logger-wrapper' });

  // Backdrop SÉPARÉ — derrière le container, couvre l'écran pour fermer au tap
  if (isOpen) {
    var backdrop = h('div', {
      style: 'position:fixed;inset:0;background:rgba(10,10,9,0.35);z-index:940;',
      onclick: function() { S._fabOpen = false; if (window.render) window.render(); }
    });
    wrapper.appendChild(backdrop);
  }

  var container = h('div', {
    style: 'position:fixed;right:20px;bottom:calc(64px + 36px + env(safe-area-inset-bottom));z-index:950;'
  });

  // Items radiaux (au-dessus du backdrop grâce au z-index du container)
  if (isOpen) {
    var items = [
      // Assistant IA — chatbot + scan corporel
      { label: 'ASSISTANT', icon: 'M2 3h12v7H6l-3 3v-3H2V3zM5 6h1M8 6h1M11 6h1', action: function() {
          S._fabOpen = false;
          if (window.AI_COACH) window.AI_COACH.open();
          if (window.render) window.render();
        } },
      { label: (window.isEnglish && window.isEnglish()) ? 'MEAL' : 'REPAS', icon: 'M4 5h8M4 8h8M4 11h8', action: function() {
          S._fabOpen = false;
          S._quickAddSlot = getDefaultMealSlot();
          if (window.render) window.render();
        } },
      { label: (window.isEnglish && window.isEnglish()) ? 'WEIGHT' : 'POIDS', icon: 'M3 7h10v6H3zM6 7V4h4v3', action: function() {
          S._modalQuickWeight = true; S._fabOpen = false;
          if (window.render) window.render();
        } },
      { label: (window.isEnglish && window.isEnglish()) ? 'WATER' : 'EAU', icon: 'M8 2C8 2 4 7 4 10a4 4 0 1 0 8 0c0-3-4-8-4-8z', action: function() {
          S._fabOpen = false;
          if (window.WATER_TRACKER) {
            var _wd = WATER_TRACKER.addGlass();
            if (_wd && window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? '+1 glass — ' + _wd.glasses + ' / ' + _wd.target : '+1 verre — ' + _wd.glasses + ' / ' + _wd.target, 'success', 1800);
          }
          if (window.render) window.render();
        } }
    ];
    if (S.appMode !== 'nutrition') {
      items.push({ label: (window.isEnglish && window.isEnglish()) ? 'SESSION' : 'SÉANCE', icon: 'M2 8h2M12 8h2M5 5v6M11 5v6', action: function() {
          S.view = 'sport'; S._fabOpen = false;
          if (window.render) window.render();
        } });
    }

    // FIX 2026-04-16 : stack vertical aligné droite au lieu d'arc radial.
    // Avant : 5 items sur arc 120° → labels se chevauchent + "SÉANCE" tronqué hors écran.
    // Maintenant : colonne verticale au-dessus du FAB, chaque pill = [LABEL · bouton].
    // Espace constant 66px entre items, labels blancs lisibles, bouton cercle ivoire.
    var itemSpacing = 66; // 48px bouton + 18px gap
    var itemsReversed = items.slice().reverse(); // premier item = plus proche du FAB
    itemsReversed.forEach(function(item, idx) {
      var pill = h('div', {
        style:
          'position:absolute;right:4px;bottom:' + (76 + idx * itemSpacing) + 'px;' +
          'display:flex;align-items:center;gap:14px;opacity:0;z-index:960;' +
          'animation:fabItemIn 240ms cubic-bezier(0.2,0.8,0.2,1) ' + (idx * 35) + 'ms forwards;'
      });
      var label = h('div', {
        style:
          'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;' +
          'letter-spacing:3px;text-transform:uppercase;color:var(--paper,#FAF9F6);font-weight:400;' +
          'white-space:nowrap;'
      }, item.label);
      var btn = h('button', {
        style:
          'width:48px;height:48px;border-radius:0;background:var(--paper,#FAF9F6);' +
          'border:1px solid var(--line,#D8D8D0);cursor:pointer;' +
          'display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;',
        'aria-label': item.label,
        onclick: item.action
      });
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink-900,#0A0A09)"><path d="' + item.icon + '"/></svg>';
      pill.appendChild(label);
      pill.appendChild(btn);
      container.appendChild(pill);
    });
  }

  // FAB central
  var fab = h('button', {
    style: 'position:relative;width:56px;height:56px;border-radius:0;background:var(--ink-900,#0A0A09);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 120ms ease-out;transform:rotate(' + (isOpen ? '45deg' : '0deg') + ');',
    'aria-label': (window.isEnglish && window.isEnglish()) ? (isOpen ? 'Close logger menu' : 'Open logger menu') : (isOpen ? 'Fermer le menu logger' : 'Ouvrir le menu logger'),
    onclick: function() { S._fabOpen = !S._fabOpen; if (window.render) window.render(); }
  });
  // Croix SVG stroke 1.5
  fab.innerHTML = '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="var(--paper,#FAF9F6)" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>';
  container.appendChild(fab);

  wrapper.appendChild(container);
  return wrapper;
}

// CSS animation pour les items du FAB
if (!document.getElementById('hermes-fab-styles')) {
  var styleEl = document.createElement('style');
  styleEl.id = 'hermes-fab-styles';
  styleEl.textContent = '@keyframes fabItemIn { from { opacity:0; transform:scale(0.6) translate(0,20px); } to { opacity:1; transform:scale(1) translate(0,0); } }';
  document.head.appendChild(styleEl);
}

window.renderCoachBar = renderCoachBar;
window.renderFabLogger = renderFabLogger;

// ═══════════════════════════════════════════════════════════════════════════
// CARTE "AUJOURD'HUI POUR TOI" — Bible Hermès §9
// ═══════════════════════════════════════════════════════════════════════════
// Juste sous le hero, si pathologie/état spécial déclaré.
// Rotation jour par jour si plusieurs pathologies.
// ═══════════════════════════════════════════════════════════════════════════
function renderCardTodayForYou() {
  var S = window.S;
  if (!S) return null;

  // Identifier les conditions à gérer
  var conditions = [];
  var isPregnant = S.pregnant && typeof S.pregnancyWeek === 'number' && S.pregnancyWeek >= 12;
  if (isPregnant) conditions.push('pregnant');
  if (Array.isArray(S.medical)) {
    if (S.medical.indexOf('irc') !== -1) conditions.push('irc');
    if (S.medical.indexOf('menopause') !== -1) conditions.push('menopause');
    if (S.medical.indexOf('hta') !== -1) conditions.push('hta');
    if (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1) conditions.push('diabete');
  }
  // FIX SPRINT P2.9 — Branches muscu : detect deload semaine
  // (2026-04 : branche 'muscu_pr' retirée — conseils génériques peu actionnables selon
  //  feedback utilisateur, les pathologies médicales restent prioritaires)
  var _isMuscu = S.sportType === 'muscu' || S.sportType === 'musculation';
  if (_isMuscu) {
    // Détection deload : muscuWeek dans (4, 8, 12) → fin de mésocycle
    if (typeof S.muscuWeek === 'number' && (S.muscuWeek % 4 === 0)) conditions.push('muscu_deload');
  }
  if (conditions.length === 0) return null;

  // Rotation : hash user.id + dayOfYear
  var user = window.AUTH ? window.AUTH.getUser() : null;
  var uidHash = 0;
  if (user && user.id) { for (var i = 0; i < user.id.length; i++) uidHash = (uidHash * 31 + user.id.charCodeAt(i)) | 0; }
  var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var selectedCondition = conditions[Math.abs(uidHash + dayOfYear) % conditions.length];

  var content = { title: '', body: '', items: [], ctaLabel: '', ctaFn: null, critical: false };
  if (selectedCondition === 'pregnant') {
    var _cEN = window.isEnglish && window.isEnglish(); content.title = _cEN ? 'Week ' + S.pregnancyWeek + ' \u00b7 omega-3 focus' : 'Semaine ' + S.pregnancyWeek + ' \u00b7 focus oméga-3';
    content.body = _cEN ? 'Your baby\'s brain is building synapses this week. Aim for 300 mg of DHA today. Salmon, mackerel or supplement recommended.' : 'Le cerveau de votre bébé construit ses synapses cette semaine. Visez 300 mg de DHA aujourd\'hui. Saumon, maquereau ou supplément recommandé.';
    content.items = [
      { name: _cEN ? 'Fresh salmon (100 g)' : 'Saumon frais (100 g)', detail: '1 500 mg DHA' },
      { name: 'Maquereau (100 g)', detail: '2 000 mg DHA' },
      { name: _cEN ? 'Omega-3 supplement' : 'Supplément oméga-3', detail: '300 mg DHA' }
    ];
    content.ctaLabel = _cEN ? 'VIEW PREGNANCY PLAN WEEK ' + S.pregnancyWeek : 'VOIR LE PLAN GROSSESSE SEMAINE ' + S.pregnancyWeek;
    content.ctaFn = function() { S.view = 'nutrition'; if (window.render) window.render(); };
    content.critical = true;
  } else if (selectedCondition === 'irc') {
    content.title = _cEN ? 'Potassium reminder' : 'Rappel potassium';
    content.body = _cEN ? 'Your kidneys prefer staying under 800 mg of potassium today. Banana, dried apricot and potato are to watch.' : 'Vos reins préfèrent rester sous 800 mg de potassium aujourd\'hui. La banane, l\'abricot sec et la pomme de terre sont à surveiller.';
    content.items = [
      { name: _cEN ? 'Plain yogurt' : 'Yaourt nature', detail: '120 mg K\u207a' },
      { name: _cEN ? 'Cooked basmati rice' : 'Riz basmati cuit', detail: '55 mg K\u207a' },
      { name: _cEN ? 'Apple (1)' : 'Pomme (1)', detail: '107 mg K\u207a' }
    ];
    content.ctaLabel = _cEN ? 'VIEW MY COMPATIBLE FOODS' : 'VOIR MES ALIMENTS COMPATIBLES';
    content.ctaFn = function() { S.view = 'nutrition'; if (window.render) window.render(); };
    content.critical = true;
  } else if (selectedCondition === 'menopause') {
    content.title = _cEN ? 'Calcium and magnesium' : 'Calcium et magnésium';
    content.body = _cEN ? 'Your bone density is built every day. Aim for 1,200 mg of calcium and 320 mg of magnesium. Almonds and Greek yogurt are your allies.' : 'Votre densité osseuse se joue chaque jour. Visez 1 200 mg de calcium et 320 mg de magnésium. Les amandes et le yaourt grec sont vos alliés.';
    content.items = [
      { name: _cEN ? 'Greek yogurt (200 g)' : 'Yaourt grec (200 g)', detail: '280 mg Ca' },
      { name: _cEN ? 'Almonds (30 g)' : 'Amandes (30 g)', detail: '75 mg Mg' },
      { name: _cEN ? 'Cooked spinach' : 'Épinards cuits', detail: '245 mg Mg' }
    ];
    content.ctaLabel = _cEN ? 'VIEW ADAPTED RECIPES' : 'VOIR LES RECETTES ADAPTÉES';
    content.ctaFn = function() { S.view = 'nutrition'; if (window.render) window.render(); };
  } else if (selectedCondition === 'hta') {
    content.title = _cEN ? 'Sodium under control' : 'Sodium sous contrôle';
    content.body = _cEN ? 'DASH diet: sodium ≤ 2.3 g/day. Potassium 4,700 mg. Green vegetables and legumes are priorities today.' : 'Régime DASH : sodium ≤ 2,3 g/jour. Potassium 4 700 mg. Les légumes verts et les légumineuses sont prioritaires aujourd\'hui.';
    content.items = [
      { name: _cEN ? 'Cooked spinach' : 'Épinards cuits', detail: '800 mg K\u207a' },
      { name: _cEN ? 'White beans' : 'Haricots blancs', detail: '600 mg K\u207a' },
      { name: _cEN ? 'Banana (1)' : 'Banane (1)', detail: '420 mg K\u207a' }
    ];
    content.ctaLabel = _cEN ? 'VIEW MY HTA ADVICE' : 'VOIR MES CONSEILS HTA';
    content.ctaFn = function() { S.view = 'nutrition'; if (window.render) window.render(); };
  } else if (selectedCondition === 'diabete') {
    content.title = _cEN ? 'Low glycemic index' : 'Index glycémique bas';
    content.body = _cEN ? 'Prioritize low GI foods today: whole grains, legumes, vegetables. Avoid fast sugars.' : 'Privilégiez les aliments IG bas aujourd\'hui : céréales complètes, légumineuses, légumes. Évitez les sucres rapides.';
    content.items = [
      { name: _cEN ? 'Oat flakes' : 'Flocons d\'avoine', detail: 'IG 55' },
      { name: _cEN ? 'Cooked quinoa' : 'Quinoa cuit', detail: 'IG 53' },
      { name: _cEN ? 'Green lentils' : 'Lentilles vertes', detail: 'IG 30' }
    ];
    content.ctaLabel = _cEN ? 'VIEW LOW GI RECIPES' : 'VOIR LES RECETTES IG BAS';
    content.ctaFn = function() { S.view = 'nutrition'; if (window.render) window.render(); };
  } else if (selectedCondition === 'muscu_deload') {
    // FIX SPRINT P2.9 — Branche muscu deload (semaine 4, 8, 12 du mésocycle)
    content.title = _cEN ? 'Deload week' : 'Semaine de décharge';
    content.body = _cEN ? 'You are in week ' + S.muscuWeek + ' — end of mesocycle. Volume reduction −50%, intensity −15%. This is a real training phase, not rest. Post-deload supercompensation is your driver.' : 'Vous êtes en semaine ' + S.muscuWeek + ' — fin de mésocycle. Réduction volume −50%, intensité −15%. C\'est une vraie phase d\'entraînement, pas un repos. La super-compensation post-deload est votre moteur de progression.';
    content.items = [
      { name: 'Volume',    detail: '−50% sets' },
      { name: _cEN ? 'Intensity' : 'Intensité', detail: '−15% ' + (_cEN ? 'weight (RIR 4)' : 'charges (RIR 4)') },
      { name: _cEN ? 'Sleep' : 'Sommeil',   detail: '8h+ ' + (_cEN ? 'recommended' : 'recommandées') }
    ];
    content.ctaLabel = _cEN ? 'VIEW MY LIGHT SESSION' : 'VOIR MA SÉANCE ALLÉGÉE';
    content.ctaFn = function() { S.view = 'sport'; if (window.render) window.render(); };
  }

  var c = h('div', {
    style: 'margin-bottom:24px;padding:24px;background:var(--paper-2,#F4F1EA);border:1px solid var(--line,#D8D8D0);' + (content.critical ? 'border-left:3px solid var(--orange,#E86F1E);' : '')
  });

  c.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-500,#6B6B65);font-weight:500;margin-bottom:16px;'
  }, (window.isEnglish && window.isEnglish()) ? 'TODAY FOR YOU' : 'AUJOURD\'HUI POUR VOUS'));

  c.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:22px;line-height:1.25;color:var(--ink-900,#0A0A09);margin-bottom:12px;'
  }, content.title));

  c.appendChild(h('p', {
    style: 'font-family:Georgia,serif;font-style:italic;font-size:15px;line-height:1.55;color:var(--ink-700,#2B2B27);margin:0 0 20px;'
  }, content.body));

  // Liste items avec filets
  content.items.forEach(function(it, idx) {
    var row = h('div', {
      style: 'display:flex;justify-content:space-between;align-items:center;padding:10px 0;' + (idx < content.items.length - 1 ? 'border-bottom:1px solid var(--line,#D8D8D0);' : '')
    });
    row.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--ink-900,#0A0A09);'
    }, it.name));
    row.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);letter-spacing:0.2px;'
    }, it.detail));
    c.appendChild(row);
  });

  if (content.ctaLabel) {
    // Bible §13.2 : CTA en Georgia italic souligné, pas en uppercase tracking.
    var ctaRow = h('div', { style: 'margin-top:20px;' });
    var prettyCta = content.ctaLabel.charAt(0).toUpperCase() + content.ctaLabel.slice(1).toLowerCase();
    ctaRow.appendChild(h('a', {
      href: '#',
      style: 'font-family:Georgia,serif;font-style:italic;font-size:14px;color:var(--ink-900,#0A0A09);text-decoration:none;border-bottom:1px solid var(--ink-900,#0A0A09);padding-bottom:4px;cursor:pointer;display:inline-block;min-height:44px;line-height:44px;',
      onclick: function(e) { e.preventDefault(); if (content.ctaFn) content.ctaFn(); }
    }, prettyCta + '  \u2192'));
    c.appendChild(ctaRow);
  }

  return c;
}
window.renderCardTodayForYou = renderCardTodayForYou;

// ═══════════════════════════════════════════════════════════════════════════
// CARTE CROSSFIT — Records 1RM visibles (correction supervision Hermès Karim)
// ═══════════════════════════════════════════════════════════════════════════
// S'affiche uniquement pour sportType='crossfit' avec au moins 1 valeur crossfit1RM.
// Monogrammes typographiques (pas d'emoji). Respect §3, §5, §13.
function renderCardCrossfit1RM() {
  var S = window.S;
  if (!S || S.sportType !== 'crossfit' || !S.crossfit1RM) return null;
  var lifts = window.CF_1RM_LIFTS || [];
  var hasAny = Object.keys(S.crossfit1RM).some(function(k) { return S.crossfit1RM[k] > 0; });
  if (!hasAny) return null;

  var c = h('div', {
    style: 'margin-bottom:24px;padding:24px;background:var(--paper-2,#F4F1EA);border:1px solid var(--line,#D8D8D0);'
  });

  // Bible §13.2 : pas d'eyebrow redondant — le titre Georgia suffit.
  c.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:22px;line-height:1.25;color:var(--ink-900,#0A0A09);margin-bottom:20px;'
  }, (window.isEnglish && window.isEnglish()) ? 'Your CrossFit weights' : 'Tes charges CrossFit'));

  var levelLabel = S.crossfitLevel === 'scaled' ? 'Scaled'
                 : S.crossfitLevel === 'inter' ? 'Intermediate'
                 : S.crossfitLevel === 'rx' ? 'RX'
                 : S.crossfitLevel === 'rx_plus' ? 'RX+'
                 : 'Intermediate';
  c.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--ink-500,#6B6B65);letter-spacing:0.3px;margin-bottom:16px;'
  }, ((window.isEnglish && window.isEnglish()) ? 'Level: ' : 'Niveau : ') + levelLabel));

  // Liste des 1RM renseignés
  var liftsWithValues = lifts.filter(function(lift) {
    return S.crossfit1RM[lift.key] && S.crossfit1RM[lift.key] > 0;
  });
  liftsWithValues.slice(0, 6).forEach(function(lift, idx) {
    var row = h('div', {
      style: 'display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;' + (idx < liftsWithValues.length - 1 ? 'border-bottom:1px solid var(--line,#D8D8D0);' : '')
    });
    row.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--ink-900,#0A0A09);'
    }, lift.name));
    row.appendChild(h('span', {
      style: 'font-family:Georgia,serif;font-size:18px;color:var(--ink-900,#0A0A09);font-feature-settings:"tnum" 1;'
    }, S.crossfit1RM[lift.key] + '\u00a0kg'));
    c.appendChild(row);
  });

  // CTA Georgia italic (Bible §13.2 : réduire uppercase/tracking)
  var cta = h('a', {
    href: '#',
    style: 'font-family:Georgia,serif;font-style:italic;font-size:14px;color:var(--ink-900,#0A0A09);text-decoration:none;border-bottom:1px solid var(--ink-900,#0A0A09);padding-bottom:4px;cursor:pointer;display:inline-block;min-height:44px;line-height:44px;margin-top:16px;',
    onclick: function(e) { e.preventDefault(); S.view = 'sport'; if (window.render) window.render(); }
  }, (window.isEnglish && window.isEnglish()) ? 'Update my weights  \u2192' : 'Mettre à jour mes charges  \u2192');
  c.appendChild(cta);

  return c;
}
window.renderCardCrossfit1RM = renderCardCrossfit1RM;

// ─── AI INSIGHT ENGINE ───────────────────────────────────────────────────────
// Reads muscuSessionLog, sessionHistory, todayWellness to surface 1-2 data-driven
// messages that make the app feel alive. Injected on the home dashboard.
function buildSmartInsight() {
  var S = window.S;
  if (!S || S.appMode === 'nutrition') return null;
  var EN = window.isEnglish && window.isEnglish();
  var todayStr = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
  var insights = [];

  var lastMusDate = null, lastMusMuscles = [], lastMusTonnage = 0, lastMusSets = 0;
  try {
    var mLog = S.muscuSessionLog || {};
    var _cutoff90 = new Date(); _cutoff90.setDate(_cutoff90.getDate() - 90);
    var _cutoffStr = (window.sfcLocalDateStr && window.sfcLocalDateStr(_cutoff90)) || _cutoff90.toISOString().slice(0, 10);
    var mKeys = Object.keys(mLog).filter(function(k) {
      return /^\d{4}-\d{2}-\d{2}$/.test(k) && k >= _cutoffStr && k <= todayStr && mLog[k] && Object.keys(mLog[k]).length > 0;
    }).sort();
    if (mKeys.length > 0) {
      lastMusDate = mKeys[mKeys.length - 1];
      var dayLog = mLog[lastMusDate];
      var muscleMap = {};
      Object.keys(dayLog).forEach(function(exName) {
        var mg = _classifyMuscleGroup(exName);
        if (mg) muscleMap[mg] = true;
        (dayLog[exName] || []).forEach(function(set) {
          if (set.validated && typeof set.actualWeight === 'number' && set.actualWeight > 0
              && typeof set.actualReps === 'number' && set.actualReps > 0) {
            lastMusTonnage += set.actualWeight * set.actualReps;
            lastMusSets++;
          }
        });
      });
      lastMusMuscles = Object.keys(muscleMap);
    }
  } catch(e) {}

  var daysSinceLast = null;
  try {
    var allDates = [];
    var _mL2 = S.muscuSessionLog || {};
    Object.keys(_mL2).forEach(function(k) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && k >= _cutoffStr && _mL2[k] && Object.keys(_mL2[k]).length > 0) allDates.push(k);
    });
    var _sH2 = S.sessionHistory || {};
    Object.keys(_sH2).forEach(function(k) {
      var m = k.match(/^(\d+)_(\d{4}-\d{2}-\d{2})$/);
      if (m && m[2] >= _cutoffStr) allDates.push(m[2]);
    });
    if (allDates.length > 0) {
      allDates.sort();
      var _ld = allDates[allDates.length - 1];
      daysSinceLast = Math.floor((new Date(todayStr) - new Date(_ld)) / 86400000);
    }
  } catch(e) {}

  var thisWeekTon = 0, lastWeekTon = 0;
  try {
    var _now3 = new Date();
    var _mL3 = S.muscuSessionLog || {};
    for (var dOff = 0; dOff <= 13; dOff++) {
      var _dd = new Date(_now3.getFullYear(), _now3.getMonth(), _now3.getDate() - dOff);
      var _dk = _dd.toISOString().slice(0, 10);
      var _dl = _mL3[_dk];
      if (!_dl) continue;
      var _wb = dOff <= 6 ? 0 : 1;
      Object.keys(_dl).forEach(function(ex) {
        (_dl[ex] || []).forEach(function(set) {
          if (set.validated && typeof set.actualWeight === 'number' && set.actualWeight > 0
              && typeof set.actualReps === 'number' && set.actualReps > 0) {
            if (_wb === 0) thisWeekTon += set.actualWeight * set.actualReps;
            else lastWeekTon += set.actualWeight * set.actualReps;
          }
        });
      });
    }
  } catch(e) {}

  var doneToday = false;
  try {
    if (lastMusDate === todayStr && lastMusSets > 0) doneToday = true;
    if (!doneToday) {
      var _sH4 = S.sessionHistory || {};
      Object.keys(_sH4).forEach(function(k) {
        var m = k.match(/^(\d+)_(\d{4}-\d{2}-\d{2})$/);
        if (m && m[2] === todayStr) doneToday = true;
      });
    }
  } catch(e) {}

  var energy = null, muscleSoreness = null;
  try {
    var _w5 = S.todayWellness;
    if (_w5 && _w5.date === todayStr && typeof _w5.energy === 'number' && typeof _w5.muscle === 'number') {
      energy = _w5.energy; muscleSoreness = _w5.muscle;
    }
  } catch(e) {}

  var muscShort = {
    pectoraux: EN ? 'Chest' : 'Pecs', dos: EN ? 'Back' : 'Dos',
    epaules: EN ? 'Shoulders' : 'Épaules', jambes: EN ? 'Legs' : 'Jambes',
    fessiers: 'Glutes', bras: EN ? 'Arms' : 'Bras', abdos: 'Abs'
  };

  if (doneToday && lastMusDate === todayStr && lastMusTonnage > 0) {
    var _ton = lastMusTonnage >= 1000
      ? (Math.round(lastMusTonnage / 100) / 10).toFixed(1) + ' t'
      : Math.round(lastMusTonnage) + ' kg';
    var _ms1 = lastMusMuscles.slice(0, 2).map(function(m) { return muscShort[m] || m; }).join(' + ');
    insights.push({ icon: '✦', text: (_ms1 ? (EN ? _ms1 + ' session · ' : 'Séance ' + _ms1 + ' · ') : '') + _ton + (EN ? ' moved · ' : ' soulevés · ') + lastMusSets + (EN ? ' sets' : ' sets validés') });
  } else if (doneToday) {
    var _trajMsg = mKeys.length >= 10
      ? (EN ? 'Session complete · Consistency confirmed · Progression on track' : 'Séance validée · Régularité confirmée · Ta progression est en marche')
      : mKeys.length >= 4
      ? (EN ? 'Session complete · Your base is building · Keep going' : 'Séance validée · Ta base est en train de se construire')
      : mKeys.length >= 2
      ? (EN ? 'Session complete · You\'re on the right track' : 'Séance validée · Tu continues sur la bonne trajectoire')
      : (EN ? 'Session complete · Protein and hydration lock it in · Back stronger' : 'Séance validée · Protéines et hydratation ce soir · Tu reviens plus fort');
    insights.push({ icon: '✦', text: _trajMsg });
  }

  if (!doneToday && lastMusDate && daysSinceLast !== null) {
    var _ms2 = lastMusMuscles.slice(0, 2).map(function(m) { return muscShort[m] || m; }).join(' + ');
    var _recMsg = null;
    if (daysSinceLast === 1 && _ms2) {
      _recMsg = EN ? 'Yesterday: ' + _ms2 + ' · Supercompensation window active (24-48h)' : 'Hier : ' + _ms2 + ' · Fenêtre de surcompensation active (24-48h)';
    } else if (daysSinceLast === 2 && _ms2) {
      _recMsg = EN ? 'Well recovered since your ' + _ms2 + ' session · Ready to go' : 'Bien récupéré depuis ta séance ' + _ms2 + ' · Prêt pour la suite';
    } else if (daysSinceLast >= 3 && daysSinceLast <= 4 && _ms2) {
      _recMsg = EN ? 'Full recovery from ' + _ms2 + ' · Optimal readiness today' : 'Récupération complète après ' + _ms2 + ' · Forme optimale aujourd\'hui';
    } else if (daysSinceLast >= 5) {
      _recMsg = EN ? daysSinceLast + ' days without training · Motivation returns after rest' : daysSinceLast + ' jours sans entraînement · La motivation revient après le repos';
    }
    if (_recMsg) insights.push({ icon: '◈', text: _recMsg });
  }

  if (thisWeekTon > 0 && lastWeekTon > 200) {
    var _delta = thisWeekTon - lastWeekTon;
    var _pct = Math.round((_delta / lastWeekTon) * 100);
    if (Math.abs(_pct) >= 3) {
      var _sign = _pct >= 0 ? '+' : '';
      insights.push({ icon: '▲', text: _pct >= 3
        ? (EN ? 'Volume ' + _sign + _pct + '% vs last week · Progressive overload on track' : 'Volume ' + _sign + _pct + '% vs sem. préc. · Surcharge progressive en bonne voie')
        : (EN ? 'Volume ' + _sign + _pct + '% vs last week · Consider a gradual increase' : 'Volume ' + _sign + _pct + '% vs sem. préc. · Envisage une progression graduelle')
      });
    }
  }

  if (!doneToday && energy !== null && muscleSoreness !== null && energy >= 4 && muscleSoreness >= 4) {
    insights.push({ icon: '●', text: EN ? 'Energy and recovery green · Optimal conditions for today\'s session' : 'Énergie et récupération au vert · Conditions optimales pour ta séance' });
  }

  if (insights.length === 0) {
    var _wkCount = 0;
    try {
      var _now6 = new Date();
      var _dow6 = (_now6.getDay() + 6) % 7;
      var _mon6 = new Date(_now6); _mon6.setDate(_now6.getDate() - _dow6);
      var _mL6 = S.muscuSessionLog || {};
      var _sH6 = S.sessionHistory || {};
      for (var _di6 = 0; _di6 <= _dow6; _di6++) {
        var _d6 = new Date(_mon6); _d6.setDate(_mon6.getDate() + _di6);
        var _ds6 = _d6.toISOString().slice(0, 10);
        var _hM6 = _mL6[_ds6] && Object.keys(_mL6[_ds6]).length > 0;
        var _hS6 = Object.keys(_sH6).some(function(k) { return k.indexOf('_' + _ds6) !== -1; });
        if (_hM6 || _hS6) _wkCount++;
      }
    } catch(e) {}
    if (_wkCount >= 2) {
      var _wkTraj = _wkCount >= 5
        ? (EN ? _wkCount + ' sessions this week · Exceptional · Keep it.' : _wkCount + ' séances cette semaine · Semaine exceptionnelle · Continue.')
        : _wkCount >= 4
        ? (EN ? _wkCount + ' sessions this week · Solid · Build on it.' : _wkCount + ' séances cette semaine · Solide · On construit dessus.')
        : _wkCount >= 3
        ? (EN ? _wkCount + ' sessions this week · Consistency confirmed.' : _wkCount + ' séances cette semaine · Régularité confirmée.')
        : (EN ? _wkCount + ' sessions this week · The habit is forming.' : _wkCount + ' séances cette semaine · L\'habitude se construit.');
      insights.push({ icon: '✦', text: _wkTraj });
    }
  }

  if (insights.length === 0) return null;

  var _ic = h('div', {
    style: 'max-width:560px;margin:0 auto;padding:14px 16px;background:var(--paper,#FAF9F6);border:1px solid var(--line,#D8D8D0);border-top:2px solid var(--black,#1A1A1A);'
  });
  insights.slice(0, 2).forEach(function(ins, i) {
    _ic.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:300;line-height:1.6;color:#555;' + (i > 0 ? 'margin-top:10px;padding-top:10px;border-top:1px solid rgba(10,10,9,0.07);' : '')
    }, ins.text));
  });
  return _ic;
}
window.buildSmartInsight = buildSmartInsight;

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// FIX SPRINT P2.7 — TONNAGE HEBDO MUSCU
// Calcule Σ (charge × reps × sets validés) sur les 7 derniers jours.
// Affiché pour user muscu/CrossFit (data-driven, pas de bullshit).
// ═══════════════════════════════════════════════════════════════════════════
function getWeeklyTonnage(daysBack) {
  var S = window.S;
  if (!S || !S.muscuSessionLog) return { tonnage: 0, sets: 0, days: 0 };
  daysBack = daysBack || 7;
  var now = new Date();
  var totalTonnage = 0, totalSets = 0, daysWithSession = 0;
  for (var d = 0; d < daysBack; d++) {
    var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    var key = date.toISOString().slice(0, 10);
    var dayLog = S.muscuSessionLog[key];
    if (!dayLog) continue;
    var dayHadSession = false;
    Object.keys(dayLog).forEach(function(exName) {
      (dayLog[exName] || []).forEach(function(set) {
        if (set.validated && typeof set.actualWeight === 'number' && set.actualWeight > 0
            && typeof set.actualReps === 'number' && set.actualReps > 0) {
          totalTonnage += set.actualWeight * set.actualReps;
          totalSets++;
          dayHadSession = true;
        }
      });
    });
    if (dayHadSession) daysWithSession++;
  }
  return { tonnage: Math.round(totalTonnage), sets: totalSets, days: daysWithSession };
}
window.getWeeklyTonnage = getWeeklyTonnage;

// ═══════════════════════════════════════════════════════════════════════════
// FIX SPRINT P3 #7 — VOLUME TRACKING MEV/MAV/MRV (Israetel / Renaissance Periodization)
// Référence : Dr Mike Israetel, RP Strength, "Scientific Principles of Hypertrophy"
// Comptage de sets hard (validés) par muscle × 7 derniers jours vs landmarks théoriques.
// Zones :
//   below-MEV : sous-volume (pas de stimulus suffisant pour hypertrophie)
//   MEV-MAV   : volume productif (sweet spot progression)
//   MAV-MRV   : volume limite (proche du seuil de récupération)
//   above-MRV : surentraînement probable (signaux : stagnation, douleurs)
// ═══════════════════════════════════════════════════════════════════════════
var MUSCLE_VOLUME_LANDMARKS = {
  // Sets hard par semaine (Schoenfeld + Israetel 2020)
  pectoraux: { mev: 8,  mav: [12, 20], mrv: 22 },
  dos:       { mev: 10, mav: [14, 22], mrv: 25 },
  epaules:   { mev: 8,  mav: [16, 22], mrv: 26 },
  jambes:    { mev: 8,  mav: [12, 18], mrv: 20 },
  fessiers:  { mev: 2,  mav: [6, 14],  mrv: 16 },
  bras:      { mev: 6,  mav: [10, 18], mrv: 22 },
  abdos:     { mev: 0,  mav: [12, 20], mrv: 25 }
};
window.MUSCLE_VOLUME_LANDMARKS = MUSCLE_VOLUME_LANDMARKS;

// Mapping regex nom exo → groupe musculaire principal (standard RP)
function _classifyMuscleGroup(exName) {
  var n = String(exName || '').toLowerCase();
  // Ordre important : motifs spécifiques avant génériques.
  if (/bench\s*press|d[eé]velopp[eé]\s+couch|d[eé]velopp[eé]\s+incl|pec\s+deck|écarté|ecarte|pompes?|chest|fly|cross|spoto|floor\s+press|svend|dip/.test(n)) return 'pectoraux';
  if (/tirage|tractions?|rowing|row\b|pulldown|lat\s+pull|pull.?over|deadlift|soulev[eé]\s+de\s+terre|pendlay|meadows|rack\s+pull|face\s+pull|shrug|t.?bar|yates|bent.?over/.test(n)) return 'dos';
  if (/press\s+(?:militaire|shoulder|overhead|z[-\s])|d[eé]velopp[eé]\s+militaire|d[eé]velopp[eé]\s+[eé]paules?|arnold|landmine\s+press|push\s+press|strict\s+press|[eé]l[eé]vations?\s+(?:lat|frontal|ant[eé]rieur|post|arrière|arriere)|élévations|elevations|rear\s+delt|oiseau|cuban|overhead\s+squat/.test(n)) return 'epaules';
  if (/curl|biceps|preacher|spider|hammer|skull|tri[cç]eps|extension\s+triceps|pushdown|kickback|tate|bradford|chin.?up/.test(n)) return 'bras';
  if (/squat|fente|lunge|leg\s+press|hack|belt\s+squat|pendulum|leg\s+ext|leg\s+curl|nordic|calf|mollet|tibialis|step.?up/.test(n)) return 'jambes';
  if (/hip\s+thrust|glute\s+bridge|kickback|clamshell|fire\s+hydrant|fessier|abduction|b.?stance/.test(n)) return 'fessiers';
  if (/crunch|plank|planche|leg\s+raise|sit.?up|ab\s+wheel|pallof|dead\s+bug|bird\s+dog|hollow|l.?sit|copenhagen|dragon|windshield|woodchopper|knee\s+raise|sclapular|obliques?/.test(n)) return 'abdos';
  return null;
}

function getWeeklyVolumeByMuscle(daysBack) {
  var S = window.S;
  if (!S || !S.muscuSessionLog) return {};
  daysBack = daysBack || 7;
  var now = new Date();
  var volumeByMuscle = {};
  for (var d = 0; d < daysBack; d++) {
    var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    var key = date.toISOString().slice(0, 10);
    var dayLog = S.muscuSessionLog[key];
    if (!dayLog) continue;
    Object.keys(dayLog).forEach(function(exName) {
      var muscleGroup = _classifyMuscleGroup(exName);
      if (!muscleGroup) return;
      var validatedSets = (dayLog[exName] || []).filter(function(set) {
        return set.validated && typeof set.actualReps === 'number' && set.actualReps > 0;
      }).length;
      if (validatedSets > 0) {
        volumeByMuscle[muscleGroup] = (volumeByMuscle[muscleGroup] || 0) + validatedSets;
      }
    });
  }
  return volumeByMuscle;
}
window.getWeeklyVolumeByMuscle = getWeeklyVolumeByMuscle;

function getVolumeZone(muscle, sets, level) {
  var lm = MUSCLE_VOLUME_LANDMARKS[muscle];
  if (!lm) return { zone: 'unknown', target: '' };
  if (!Array.isArray(lm.mav) || lm.mav.length < 2) return { zone: 'unknown', target: '' };
  // Scale landmarks par niveau (beginner plus bas, advanced plus haut).
  var scale = 1.0;
  if (level === 'beginner') scale = 0.75;
  else if (level === 'advanced' || level === 'pro' || level === 'expert') scale = 1.1;
  var mev = Math.round(lm.mev * scale);
  var mavLow = Math.round(lm.mav[0] * scale);
  var mavHigh = Math.round(lm.mav[1] * scale);
  var mrv = Math.round(lm.mrv * scale);
  var zone, target;
  var _vzEN = window.isEnglish && window.isEnglish();
  if (sets < mev)       { zone = 'below-mev'; target = _vzEN ? 'Aim for ' + mev + ' sets (MEV)' : 'Vise ' + mev + ' sets (MEV)'; }
  else if (sets < mavLow) { zone = 'mev-mav'; target = _vzEN ? 'Productive zone — aim for ' + mavLow + '-' + mavHigh + ' sets (MAV)' : 'Zone productive — vise ' + mavLow + '-' + mavHigh + ' sets (MAV)'; }
  else if (sets <= mavHigh) { zone = 'mev-mav-optimal'; target = _vzEN ? 'Sweet spot — keep up this pace' : 'Sweet spot — continue à ce rythme'; }
  else if (sets <= mrv)  { zone = 'mav-mrv'; target = _vzEN ? 'Limit volume — watch your recovery (MRV ' + mrv + ')' : 'Volume limite — surveille la récupération (MRV ' + mrv + ')'; }
  else                   { zone = 'above-mrv'; target = _vzEN ? 'Above MRV (' + mrv + ') — overtraining risk' : 'Au-dessus du MRV (' + mrv + ') — risque surentraînement'; }
  return { zone: zone, sets: sets, mev: mev, mavLow: mavLow, mavHigh: mavHigh, mrv: mrv, target: target };
}
window.getVolumeZone = getVolumeZone;

function renderCardVolumeTracking() {
  var S = window.S;
  if (!S || !S.muscuSessionLog || (S.sportType !== 'muscu' && S.sportType !== 'musculation')) return null;
  var volumes = getWeeklyVolumeByMuscle(7);
  if (!volumes || Object.keys(volumes).length === 0) return null;
  var level = S.sportLevel || 'intermediate';

  var muscleOrder = ['pectoraux', 'dos', 'epaules', 'jambes', 'fessiers', 'bras', 'abdos'];
  var _mlEN = window.isEnglish && window.isEnglish();
  var muscleLabels = {
    pectoraux: _mlEN ? 'Chest' : 'Pectoraux', dos: _mlEN ? 'Back' : 'Dos', epaules: _mlEN ? 'Shoulders' : 'Épaules',
    jambes: _mlEN ? 'Legs' : 'Jambes', fessiers: _mlEN ? 'Glutes' : 'Fessiers', bras: _mlEN ? 'Arms' : 'Bras', abdos: _mlEN ? 'Abs' : 'Abdos'
  };

  var rows = muscleOrder.map(function(m) {
    var sets = volumes[m] || 0;
    if (sets === 0) return ''; // n'affiche pas les muscles sans volume
    var z = getVolumeZone(m, sets, level);
    // Couleur selon zone (charte sobre Hermès — pas de signaux flashy)
    var color = '#0A0A09', bg = '#FAF9F6';
    if (z.zone === 'below-mev')        { color = '#8B7355'; bg = '#F5EFE3'; }       // sable — sous-stim
    else if (z.zone === 'mev-mav-optimal') { color = '#4A6B3C'; bg = '#EDF2E4'; }   // vert olive — optimal
    else if (z.zone === 'mav-mrv')      { color = '#A65D3D'; bg = '#F5E6DB'; }      // terracotta — limite
    else if (z.zone === 'above-mrv')    { color = '#8B3A2F'; bg = '#F0DED9'; }      // brique — surpasse
    // Barre de progression proportionnelle (0-MRV)
    var pctOfMrv = Math.min(100, (sets / z.mrv) * 100);
    return (
      '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(10,10,9,0.06);">' +
        '<div style="flex:0 0 84px;font-size:13px;font-weight:400;color:var(--ink-900,#0A0A09);">' + muscleLabels[m] + '</div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:4px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(10,10,9,0.6);">' +
            '<span>' + sets + ' sets</span>' +
            '<span>MEV ' + z.mev + ' · MAV ' + z.mavLow + '-' + z.mavHigh + ' · MRV ' + z.mrv + '</span>' +
          '</div>' +
          '<div style="position:relative;height:4px;background:rgba(10,10,9,0.08);border-radius:2px;overflow:hidden;">' +
            '<div style="position:absolute;left:0;top:0;height:100%;width:' + pctOfMrv + '%;background:' + color + ';"></div>' +
          '</div>' +
          '<div style="font-size:11px;color:' + color + ';font-weight:500;">' + z.target + '</div>' +
        '</div>' +
      '</div>'
    );
  }).filter(function(r) { return r; }).join('');

  if (!rows) return null;

  var html = (
    '<div style="background:var(--paper,#FAF9F6);border:1px solid var(--line,#D8D8D0);border-radius:0;padding:20px;margin-bottom:16px;">' +
      '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(10,10,9,0.45);margin-bottom:4px;">' + ((window.isEnglish && window.isEnglish()) ? 'Weekly volume' : 'Volume hebdo') + '</div>' +
      '<div style="font-size:16px;font-weight:400;color:var(--ink-900,#0A0A09);margin-bottom:2px;">' + ((window.isEnglish && window.isEnglish()) ? 'Load by muscle group' : 'Charge par groupe musculaire') + '</div>' +
      '<div style="font-size:12px;color:rgba(10,10,9,0.55);margin-bottom:16px;">' + ((window.isEnglish && window.isEnglish()) ? 'Last 7 days \u00b7 Renaissance Periodization landmarks (Dr Mike Israetel)' : '7 derniers jours \u00b7 landmarks Renaissance Periodization (Dr Mike Israetel)') + '</div>' +
      rows +
    '</div>'
  );
  return html;
}
window.renderCardVolumeTracking = renderCardVolumeTracking;
// ═══════════════════════════════════════════════════════════════════════════

// FIX SPRINT P1.8 — CARD "Mes records muscu" (audit dashboard widgets)
// Avant : muscuStrengthProfile + 1RM Epley calculés mais cachés dans drawer.
// Maintenant : carte en surface dashboard pour user muscu (sportType='muscu').
// Symétrique avec renderCardCrossfit1RM (CF only).
// ═══════════════════════════════════════════════════════════════════════════
function renderCardMuscu1RM() {
  var S = window.S;
  if (!S) return null;
  // Affichée pour user muscu (pas CF — CF a sa propre card)
  var isMuscuPure = S.sportType === 'muscu' || S.sportType === 'musculation';
  if (!isMuscuPure) return null;
  var sp = S.muscuStrengthProfile || {};
  var _kl2EN = window.isEnglish && window.isEnglish();
  var KEY_LIFTS = [
    { key: 'bench_press',     name: _kl2EN ? 'Bench press' : 'Développé couché' },
    { key: 'squat',           name: 'Squat' },
    { key: 'deadlift',        name: 'Deadlift' },
    { key: 'overhead_press',  name: _kl2EN ? 'Overhead press' : 'Développé militaire' },
    { key: 'barbell_row',     name: _kl2EN ? 'Barbell row' : 'Rowing barre' },
    { key: 'hip_thrust',      name: 'Hip thrust' }
  ];
  var liftsWithValues = KEY_LIFTS.filter(function(l) { return sp[l.key] && sp[l.key] > 0; });
  if (liftsWithValues.length === 0) return null;

  var c = h('div', {
    style: 'margin-bottom:24px;padding:24px;background:var(--paper-2,#F4F1EA);border:1px solid var(--line,#D8D8D0);'
  });

  c.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:22px;line-height:1.25;color:var(--ink-900,#0A0A09);margin-bottom:6px;'
  }, (window.isEnglish && window.isEnglish()) ? 'Your records' : 'Tes records'));
  c.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-style:italic;font-size:13px;color:var(--ink-500,#6B6B65);margin-bottom:18px;'
  }, (window.isEnglish && window.isEnglish()) ? '1RM estimated using Epley (weight × reps)' : '1RM estimé selon Epley (charge × reps)'));

  // FIX SPRINT P2.7 — Tonnage hebdo affiché si user a entraîné cette semaine
  var weeklyTonnage = getWeeklyTonnage(7);
  if (weeklyTonnage.tonnage > 0) {
    var tonnageRow = h('div', {
      style: 'display:flex;justify-content:space-between;align-items:baseline;padding:12px 0;border-bottom:1px solid var(--line,#D8D8D0);background:var(--paper-3,#EEEAE0);margin:0 -24px 8px;padding-left:24px;padding-right:24px;'
    });
    var tonnageLeft = h('div', {});
    tonnageLeft.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink-500,#6B6B65);font-weight:500;margin-bottom:2px;'
    }, (window.isEnglish && window.isEnglish()) ? '7-day tonnage' : 'Tonnage 7 jours'));
    tonnageLeft.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-style:italic;font-size:11px;color:var(--ink-500,#6B6B65);'
    }, weeklyTonnage.sets + ' ' + window.locPlural(weeklyTonnage.sets, {fr:{one:'série',other:'séries'},en:{one:'set',other:'sets'}}) + ' · ' + weeklyTonnage.days + ' ' + window.locPlural(weeklyTonnage.days, {fr:{one:'jour actif',other:'jours actifs'},en:{one:'active day',other:'active days'}})));
    tonnageRow.appendChild(tonnageLeft);
    tonnageRow.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-size:24px;color:var(--ink-900,#0A0A09);font-feature-settings:"tnum" 1;line-height:1;'
    }, String(weeklyTonnage.tonnage).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0kg'));
    c.appendChild(tonnageRow);
  }

  liftsWithValues.slice(0, 6).forEach(function(lift, idx) {
    var weight = sp[lift.key];
    var reps = sp[lift.key + '_reps'] || 8;
    var oneRM = Math.round(weight * (1 + reps / 30));
    var row = h('div', {
      style: 'display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;' + (idx < liftsWithValues.length - 1 ? 'border-bottom:1px solid var(--line,#D8D8D0);' : '')
    });
    var leftCol = h('div', {});
    leftCol.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--ink-900,#0A0A09);margin-bottom:2px;'
    }, lift.name));
    leftCol.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--ink-500,#6B6B65);'
    }, weight + ' kg × ' + reps + ' reps'));
    row.appendChild(leftCol);
    var rightCol = h('div', { style: 'text-align:right;' });
    rightCol.appendChild(h('div', {
      style: 'font-family:Georgia,serif;font-size:22px;color:var(--ink-900,#0A0A09);font-feature-settings:"tnum" 1;line-height:1;'
    }, oneRM + '\u00a0kg'));
    rightCol.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-500,#6B6B65);margin-top:4px;'
    }, '1RM est.'));
    row.appendChild(rightCol);
    c.appendChild(row);
  });

  var cta = h('a', {
    href: '#',
    style: 'font-family:Georgia,serif;font-style:italic;font-size:14px;color:var(--ink-900,#0A0A09);text-decoration:none;border-bottom:1px solid var(--ink-900,#0A0A09);padding-bottom:4px;cursor:pointer;display:inline-block;min-height:44px;line-height:44px;margin-top:16px;',
    onclick: function(e) { e.preventDefault(); S.view = 'sport'; if (window.render) window.render(); }
  }, (window.isEnglish && window.isEnglish()) ? 'Update my weights  \u2192' : 'Mettre à jour mes charges  \u2192');
  c.appendChild(cta);

  return c;
}
window.renderCardMuscu1RM = renderCardMuscu1RM;

// ═══════════════════════════════════════════════════════════════════════════
// DRAWER PROGRESSION — Bottom sheet fullscreen (Bible Hermès §10)
// ═══════════════════════════════════════════════════════════════════════════
// Affiché sur document.body si S._dashExtOpen=true. Animation translateY spring iOS.
// Tabs internes : Records / Tendances / Charges / Objectifs.
// ═══════════════════════════════════════════════════════════════════════════
// Cleanup post-render : strip emoji ET Unicode décoratifs (bible §13.1).
// Couvre : emoji standard, symboles décoratifs (flèches, flocons), pictogrammes.
function _hermesCleanupDrawerEmoji() {
  var drawer = document.getElementById('progression-drawer');
  if (!drawer) return;
  // Ranges : emoji classique + symboles étoiles/flèches/flocons décoratifs utilisés
  // comme icônes (↓ ⬇ ↗ ❄ ★ ◆ — sans les supprimer ailleurs, juste dans le drawer).
  var emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2730}-\u{27BF}\u{2B00}-\u{2BFF}]/gu;
  var walker = document.createTreeWalker(drawer, NodeFilter.SHOW_TEXT, null, false);
  var node;
  var textNodes = [];
  while (node = walker.nextNode()) textNodes.push(node);
  textNodes.forEach(function(n) {
    if (emojiRegex.test(n.nodeValue)) {
      n.nodeValue = n.nodeValue.replace(emojiRegex, '').replace(/\s+/g, ' ').trim();
    }
  });
}

function renderProgressionDrawer() {
  var S = window.S;
  if (!S || !S._dashExtOpen) return null;

  var activeTab = S._progressionTab || 'records';

  var sheet = h('div', {
    id: 'progression-drawer',
    style: 'position:fixed;inset:0;background:var(--paper,#FAF9F6);z-index:1000;overflow-y:auto;animation:drawerSlideUp 380ms cubic-bezier(0.32,0.72,0,1);will-change:transform,opacity;'
  });

  // Header sticky
  var header = h('div', {
    style: 'position:sticky;top:0;background:var(--paper,#FAF9F6);border-bottom:1px solid var(--line,#D8D8D0);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;z-index:2;'
  });
  header.appendChild(h('button', {
    style: 'background:transparent;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-900,#0A0A09);cursor:pointer;padding:10px 0;font-weight:500;min-height:44px;',
    'aria-label': (window.isEnglish && window.isEnglish()) ? 'Close' : 'Fermer',
    onclick: function() { S._dashExtOpen = false; if (window.render) window.render(); }
  }, (window.isEnglish && window.isEnglish()) ? '\u2190 CLOSE' : '\u2190 FERMER'));
  header.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-500,#6B6B65);font-weight:500;'
  }, (window.isEnglish && window.isEnglish()) ? 'PROGRESSION' : 'PROGRESSION'));
  header.appendChild(h('div', { style: 'width:80px;' })); // spacer pour centrage
  sheet.appendChild(header);

  // Tabs scrollable
  var _drEN = window.isEnglish && window.isEnglish();
  var tabs = [
    { key: 'records',   label: 'Records' },
    { key: 'tendances', label: _drEN ? 'Trends \u00b7 30 d' : 'Tendances \u00b7 30 j' },
    { key: 'charges',   label: _drEN ? 'Load \u00b7 30 d' : 'Charges \u00b7 30 j' },
    { key: 'objectifs', label: _drEN ? 'Weekly goals' : 'Objectifs semaine' }
  ];
  var tabsBar = h('div', {
    style: 'display:flex;overflow-x:auto;border-bottom:1px solid var(--line,#D8D8D0);padding:0 24px;gap:4px;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory;scrollbar-width:none;'
  });
  tabs.forEach(function(tab) {
    var isActive = activeTab === tab.key;
    tabsBar.appendChild(h('button', {
      style: 'background:transparent;border:none;padding:16px 20px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:' + (isActive ? 'var(--ink-900,#0A0A09)' : 'var(--ink-500,#6B6B65)') + ';font-weight:500;border-bottom:2px solid ' + (isActive ? 'var(--ink-900,#0A0A09)' : 'transparent') + ';white-space:nowrap;min-height:44px;',
      onclick: function() { S._progressionTab = tab.key; if (window.render) window.render(); }
    }, tab.label));
  });
  sheet.appendChild(tabsBar);

  // Contenu par tab
  var content = h('div', { style: 'padding:32px 24px 96px;max-width:720px;margin:0 auto;' });

  // Rendre les sections existantes dans le drawer
  try {
    if (typeof window.renderExtendedSections === 'function' || typeof renderExtendedSections === 'function') {
      // L'ancienne fonction renderExtendedSections rend TOUT — on la garde par compat
      // mais dans le drawer on filtre visuellement selon l'onglet actif en utilisant des IDs.
      var fn = window.renderExtendedSections || renderExtendedSections;
      fn(content, S);
    }
  } catch(e) { console.warn('[ProgressionDrawer] renderExtendedSections failed:', e); }

  sheet.appendChild(content);
  // Post-render : strip emoji (§13.1)
  setTimeout(_hermesCleanupDrawerEmoji, 10);
  return sheet;
}
window.renderProgressionDrawer = renderProgressionDrawer;

// CSS scopé au drawer — force la conformité Bible Hermès sur tout le contenu legacy.
// §13.3 pas de font-weight 700+ · §13.5 radius max 2px · §13.6 une seule ombre · §13.1 pas d'emoji dans les boutons noirs.
if (!document.getElementById('hermes-drawer-styles')) {
  var drawerStyleEl = document.createElement('style');
  drawerStyleEl.id = 'hermes-drawer-styles';
  drawerStyleEl.textContent = [
    '@keyframes drawerSlideUp { from { transform:translateY(100%);opacity:0.6; } to { transform:translateY(0);opacity:1; } }',
    /* Tous les éléments du drawer : poids typographique borné, radius max 2, pas d\'ombre décorative */
    '#progression-drawer * { font-weight: normal !important; border-radius: 2px !important; box-shadow: none !important; }',
    /* Cartes noires/sombres héritées → ivoire */
    '#progression-drawer [style*="background:var(--black"],' +
    '#progression-drawer [style*="background: var(--black"],' +
    '#progression-drawer [style*="background:#181818"],' +
    '#progression-drawer [style*="background: #181818"],' +
    '#progression-drawer [style*="background:#0A0A09"] {',
    '  background: var(--paper-2,#F4F1EA) !important;',
    '  color: var(--ink-900,#0A0A09) !important;',
    '  border: 1px solid var(--line,#D8D8D0) !important;',
    '}',
    /* Labels "opacity:.65" des boutons noirs ex-sombres → contraste correct */
    '#progression-drawer [style*="opacity:.65"],' +
    '#progression-drawer [style*="opacity: .65"] { opacity: 1 !important; color: var(--ink-500,#6B6B65) !important; }',
    /* Boutons uppercase letter-spacing → Georgia italic roman */
    '#progression-drawer button[style*="text-transform:uppercase"],' +
    '#progression-drawer button[style*="text-transform: uppercase"] {',
    '  text-transform: none !important;',
    '  letter-spacing: 0 !important;',
    '  font-family: Georgia, serif !important;',
    '  font-style: italic !important;',
    '  font-size: 14px !important;',
    '}',
    /* Classes legacy avec fond noir ink-900 (non détectables via style*=) */
    '#progression-drawer .sleep-btn,' +
    '#progression-drawer .fj-add-btn,' +
    '#progression-drawer .sfc-data-btn-primary,' +
    '#progression-drawer .sfc-data-btn,' +
    '#progression-drawer .week-dot.active,' +
    '#progression-drawer .week-dot.today {',
    '  background: transparent !important;',
    '  color: var(--ink-900,#0A0A09) !important;',
    '  border: 1px solid var(--ink-900,#0A0A09) !important;',
    '  letter-spacing: 0 !important;',
    '  text-transform: none !important;',
    '  font-family: Georgia, serif !important;',
    '  font-style: italic !important;',
    '  font-size: 13px !important;',
    '  font-weight: normal !important;',
    '}',
    /* Tous les boutons du drawer : pas de tracking uppercase */
    '#progression-drawer button, #progression-drawer .btn {',
    '  letter-spacing: 0 !important;',
    '  text-transform: none !important;',
    '}'
  ].join('\n');
  document.head.appendChild(drawerStyleEl);
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP JARGON — Bible Hermès §4.2.6 + §13 (explication inline des termes techniques)
// ═══════════════════════════════════════════════════════════════════════════
// Usage : jargonTooltip('TDEE') → span avec (?) cliquable, tap ouvre un popover.
var _jgEN = window.isEnglish && window.isEnglish();
var JARGON_DEFS = {
  'TDEE': { title: 'TDEE', text: _jgEN ? 'Total daily caloric need. Calculated from your basal metabolic rate (BMR) × a physical activity coefficient. Unit: kcal/day.' : 'Besoin calorique quotidien total. Calculé à partir de votre métabolisme de base (BMR) × un coefficient d\'activité physique. Unité : kcal/jour.' },
  'BMR': { title: 'BMR', text: _jgEN ? 'Basal Metabolic Rate — energy burned at rest to maintain vital functions. Mifflin-St Jeor formula.' : 'Métabolisme de base — énergie brûlée au repos pour maintenir vos fonctions vitales. Formule Mifflin-St Jeor.' },
  '1RM': { title: '1RM', text: _jgEN ? 'Maximum load you can lift once on a given movement. Reference for calculating working weights.' : 'Charge maximale que vous pouvez soulever une seule fois sur un mouvement donné. Référence pour calculer vos charges de travail.' },
  'RPE': { title: 'RPE', text: _jgEN ? 'Rate of Perceived Exertion — felt effort from 1 to 10. 7 = hard but controlled, 10 = impossible one more rep.' : 'Rate of Perceived Exertion — effort ressenti de 1 à 10. 7 = dur mais contrôlé, 10 = impossible une rep de plus.' },
  'RIR': { title: 'RIR', text: _jgEN ? 'Reps In Reserve — how many more reps you could have done before failure. RIR 2 = 2 reps left in the tank.' : 'Reps In Reserve — combien de répétitions vous auriez pu faire en plus avant l\'échec. RIR 2 = il vous en restait 2.' },
  'VO2max': { title: 'VO2 max', text: _jgEN ? 'Maximum oxygen capacity your body uses during exercise. Key cardio endurance indicator.' : 'Capacité maximale d\'oxygène que votre corps utilise à l\'effort. Indicateur clé d\'endurance cardio.' },
  'K⁺': { title: _jgEN ? 'Potassium' : 'Potassium', text: _jgEN ? 'Essential mineral. With kidney disease, intake must be monitored (≤ 2,000 mg/day depending on stage).' : 'Minéral essentiel. En cas d\'insuffisance rénale, votre apport doit être surveillé (≤ 2 000 mg/j selon stade).' },
  'DASH': { title: 'DASH', text: _jgEN ? 'Dietary Approaches to Stop Hypertension diet. Reduces sodium, increases potassium/magnesium/calcium. Lowers BP by 5-8 mmHg.' : 'Régime Dietary Approaches to Stop Hypertension. Réduit le sodium, augmente le potassium/magnésium/calcium. Baisse la PA de 5-8 mmHg.' },
  'macros': { title: _jgEN ? 'Macronutrients' : 'Macronutriments', text: _jgEN ? 'The 3 main caloric families: protein (4 kcal/g), carbohydrates (4 kcal/g), fats (9 kcal/g).' : 'Les 3 grandes familles caloriques : protéines (4 kcal/g), glucides (4 kcal/g), lipides (9 kcal/g).' },
  // 2026-04 UX-4 : compléter pour les termes CrossFit / cycling / training
  'AMRAP': { title: 'AMRAP', text: _jgEN ? 'As Many Rounds/Reps As Possible — do as many rounds/reps as possible in the allotted time. Example: AMRAP 15 = 15 min of max effort.' : 'As Many Rounds/Reps As Possible — faites le plus de tours/répétitions possible dans le temps imparti. Exemple : AMRAP 15 = 15 min d\'effort max.' },
  'EMOM': { title: 'EMOM', text: _jgEN ? 'Every Minute On the Minute — at the start of each minute, perform a prescribed set, then rest until the next minute.' : 'Every Minute On the Minute — au début de chaque minute, vous faites une série prescrite, puis reposez jusqu\'à la minute suivante.' },
  'WOD': { title: 'WOD', text: _jgEN ? 'Workout of the Day — the CrossFit session of the day, combining multiple movements in a timed format (AMRAP, EMOM, For Time…).' : 'Workout of the Day — séance CrossFit du jour, combinant plusieurs mouvements en format chronométré (AMRAP, EMOM, For Time…).' },
  'PAL': { title: 'PAL', text: _jgEN ? 'Physical Activity Level — multiplier estimating your energy expenditure based on physical activity. Sedentary = 1.2, Very active = 1.9.' : 'Physical Activity Level — multiplicateur qui estime votre dépense énergétique selon votre activité physique. Sédentaire = 1.2, Très actif = 1.9.' },
  'FTP': { title: 'FTP', text: _jgEN ? 'Functional Threshold Power — maximum power you can sustain for 1 hour on a bike (in watts). Basis for calculating cycling zones.' : 'Functional Threshold Power — puissance maximale que vous pouvez soutenir 1 heure en vélo (en watts). Base de calcul de vos zones cyclistes.' },
  'Z1': { title: _jgEN ? 'Zone 1' : 'Zone 1', text: _jgEN ? 'Active recovery zone (56-75% FTP / 50-60% HRmax). Very light effort, easy conversation.' : 'Zone de récupération active (56-75% FTP / 50-60% FCmax). Effort très léger, conversation aisée.' },
  'Z2': { title: _jgEN ? 'Zone 2' : 'Zone 2', text: _jgEN ? 'Aerobic endurance zone (76-90% FTP / 60-70% HRmax). Moderate effort, conversation possible. Ideal for base training.' : 'Zone d\'endurance aérobie (76-90% FTP / 60-70% FCmax). Effort modéré, conversation possible. Idéale pour le fond.' },
  'Z3': { title: _jgEN ? 'Zone 3' : 'Zone 3', text: _jgEN ? 'Aerobic threshold zone (91-105% FTP / 70-80% HRmax). Sustained effort, short phrases only.' : 'Zone seuil aérobie (91-105% FTP / 70-80% FCmax). Effort soutenu, phrases courtes seulement.' },
  'Z4': { title: _jgEN ? 'Zone 4' : 'Zone 4', text: _jgEN ? 'Anaerobic threshold zone (106-120% FTP / 80-90% HRmax). Intense effort, very little conversation.' : 'Zone seuil anaérobie (106-120% FTP / 80-90% FCmax). Effort intense, très peu de conversation.' },
  'Z5': { title: _jgEN ? 'Zone 5' : 'Zone 5', text: _jgEN ? 'VO2 max zone (>120% FTP / >90% HRmax). Maximum effort, total breathlessness. Short durations only.' : 'Zone VO2 max (>120% FTP / >90% FCmax). Effort maximal, essoufflement total. Courtes durées uniquement.' },
  'EPOC': { title: 'EPOC', text: _jgEN ? 'Excess Post-exercise Oxygen Consumption — calories burned after exercise (the "afterburn" effect). The higher the intensity, the greater the EPOC.' : 'Excess Post-exercise Oxygen Consumption — calories brûlées après l\'effort (effet « afterburn »). Plus l\'intensité est élevée, plus l\'EPOC est important.' },
  'Atwater': { title: 'Atwater', text: _jgEN ? 'Calorie calculation system by macronutrient: 4 kcal/g for protein and carbs, 9 kcal/g for fats, 7 kcal/g for alcohol.' : 'Système de calcul des calories par macronutriment : 4 kcal/g pour protéines et glucides, 9 kcal/g pour lipides, 7 kcal/g pour alcool.' }
};

function jargonTooltip(term, displayText) {
  var def = JARGON_DEFS[term];
  if (!def) return h('span', {}, displayText || term);

  var id = 'jargon-' + term.replace(/[^a-z0-9]/gi, '') + '-' + Math.random().toString(36).slice(2, 8);
  var wrap = h('span', {
    style: 'position:relative;display:inline-block;'
  });
  var label = h('span', {}, displayText || term);
  var helper = h('button', {
    style: 'display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-left:4px;border:1px solid var(--ink-500,#6B6B65);border-radius:0;background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--ink-500,#6B6B65);cursor:pointer;padding:0;line-height:1;vertical-align:middle;',
    'aria-label': ((window.isEnglish && window.isEnglish()) ? 'Definition: ' : 'Définition : ') + def.title,
    'aria-describedby': id,
    onclick: function(e) {
      e.preventDefault(); e.stopPropagation();
      var existing = document.getElementById(id);
      if (existing) { existing.parentNode.removeChild(existing); return; }
      var pop = h('div', {
        id: id,
        role: 'tooltip',
        style: 'position:absolute;top:100%;left:0;margin-top:8px;width:260px;max-width:calc(100vw - 40px);padding:16px;background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border-radius:0;z-index:1100;'
      });
      pop.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--paper,#FAF9F6);margin-bottom:8px;font-weight:500;opacity:0.7;'
      }, def.title));
      pop.appendChild(h('div', {
        style: 'font-family:Georgia,serif;font-size:13px;line-height:1.55;color:var(--paper,#FAF9F6);'
      }, def.text));
      wrap.appendChild(pop);
      // Close on outside click
      setTimeout(function() {
        var closeOnOutside = function(evt) {
          if (!pop.contains(evt.target) && evt.target !== helper) {
            if (pop.parentNode) pop.parentNode.removeChild(pop);
            document.removeEventListener('click', closeOnOutside, true);
          }
        };
        document.addEventListener('click', closeOnOutside, true);
      }, 0);
    }
  }, '?');
  wrap.appendChild(label);
  wrap.appendChild(helper);
  return wrap;
}
window.jargonTooltip = jargonTooltip;
window.JARGON_DEFS = JARGON_DEFS;

})();
