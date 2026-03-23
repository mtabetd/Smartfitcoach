// gamification.js — Motivation & Engagement System
(function(){
'use strict';

var BADGES_KEY = 'mtd_badges_';
var STREAK_KEY = 'mtd_streak_';
var ACHIEVEMENTS_KEY = 'mtd_achievements_';

// ─── DAILY QUOTES (French, motivational, nutrition/health themed) ───
var QUOTES = [
  {text: "La nourriture que vous mangez peut être la forme de médecine la plus sûre ou la plus lente forme de poison.", author: "Ann Wigmore"},
  {text: "Que ton aliment soit ta seule médecine.", author: "Hippocrate"},
  {text: "Le corps est le serviteur de l'esprit.", author: "James Allen"},
  {text: "Prends soin de ton corps, c'est le seul endroit où tu es obligé de vivre.", author: "Jim Rohn"},
  {text: "La santé n'est pas tout, mais sans la santé tout n'est rien.", author: "Schopenhauer"},
  {text: "Le succès, c'est la somme de petits efforts répétés jour après jour.", author: "Robert Collier"},
  {text: "La discipline est le pont entre les objectifs et l'accomplissement.", author: "Jim Rohn"},
  {text: "Votre corps peut résister à presque tout. C'est votre esprit qu'il faut convaincre.", author: "Inconnu"},
  {text: "Le meilleur moment pour commencer était hier. Le deuxième meilleur moment, c'est maintenant.", author: "Proverbe"},
  {text: "Chaque journée est une nouvelle chance de changer votre vie.", author: "Inconnu"},
  {text: "La force ne vient pas de la capacité physique. Elle vient d'une volonté indomptable.", author: "Gandhi"},
  {text: "Le seul mauvais entraînement est celui que vous n'avez pas fait.", author: "Inconnu"},
  {text: "Manger sainement est une forme de respect envers soi-même.", author: "Inconnu"},
  {text: "Le voyage de mille lieues commence par un pas.", author: "Lao Tseu"},
  {text: "N'abandonnez pas. Souffrez maintenant et vivez le reste de votre vie comme un champion.", author: "Muhammad Ali"},
  {text: "Le corps accomplit ce que l'esprit croit.", author: "Inconnu"},
  {text: "La persévérance n'est pas une longue course, c'est plusieurs courtes courses l'une après l'autre.", author: "Walter Elliot"},
  {text: "Un objectif sans plan n'est qu'un souhait.", author: "Antoine de Saint-Exupéry"},
  {text: "Cuisiner est un acte d'amour envers soi-même et les autres.", author: "Inconnu"},
  {text: "Le changement ne viendra pas si nous attendons une autre personne ou un autre moment.", author: "Barack Obama"},
  {text: "La constance vaut mieux que l'intensité.", author: "Inconnu"},
  {text: "Manger est une nécessité. Manger intelligemment est un art.", author: "La Rochefoucauld"},
  {text: "Les limites n'existent que dans votre esprit.", author: "Inconnu"},
  {text: "Ce n'est pas le nombre de fois où l'on tombe qui compte, mais le nombre de fois où l'on se relève.", author: "Inconnu"},
  {text: "La meilleure version de vous-même attend de l'autre côté de l'effort.", author: "Inconnu"},
  {text: "Chaque repas est une opportunité de nourrir votre corps avec excellence.", author: "Inconnu"},
  {text: "La motivation vous met en route. L'habitude vous fait continuer.", author: "Jim Ryun"},
  {text: "Investir dans votre santé produira d'énormes dividendes.", author: "Inconnu"},
  {text: "Les champions ne sont pas faits dans les salles de sport. Ils sont faits à partir de quelque chose de profond.", author: "Muhammad Ali"},
  {text: "Votre santé est un investissement, pas une dépense.", author: "Inconnu"}
];

// ─── ACHIEVEMENTS/BADGES ───
var BADGE_DEFS = [
  // Onboarding
  {id: 'first_login', name: 'Premier Pas', desc: 'Première connexion', icon: '◆', category: 'onboarding'},
  {id: 'profile_complete', name: 'Profil Complet', desc: 'Toutes les informations renseignées', icon: '◇', category: 'onboarding'},
  {id: 'first_plan', name: 'Planificateur', desc: 'Premier planning généré', icon: '□', category: 'onboarding'},

  // Consistency
  {id: 'streak_3', name: '3 Jours', desc: 'Connecté 3 jours de suite', icon: '▲', category: 'streak'},
  {id: 'streak_7', name: 'Semaine Parfaite', desc: '7 jours consécutifs', icon: '▲', category: 'streak'},
  {id: 'streak_14', name: 'Deux Semaines', desc: '14 jours consécutifs', icon: '▲', category: 'streak'},
  {id: 'streak_30', name: 'Mois Complet', desc: '30 jours consécutifs', icon: '★', category: 'streak'},
  {id: 'streak_90', name: 'Transformation', desc: '90 jours consécutifs', icon: '★', category: 'streak'},

  // Weight tracking
  {id: 'first_weigh', name: 'Suivi Lancé', desc: 'Premier poids enregistré', icon: '○', category: 'tracking'},
  {id: 'weight_10', name: 'Régulier', desc: '10 pesées enregistrées', icon: '○', category: 'tracking'},
  {id: 'weight_goal', name: 'Objectif Atteint', desc: 'Poids objectif atteint !', icon: '●', category: 'tracking'},
  {id: 'first_kg_lost', name: 'Premier Kilo', desc: 'Premier kg perdu', icon: '▽', category: 'tracking'},
  {id: 'five_kg', name: '-5 kg', desc: '5 kg perdus', icon: '▽', category: 'tracking'},

  // Exploration
  {id: 'recipes_10', name: 'Curieux', desc: '10 recettes consultées', icon: '◆', category: 'explore'},
  {id: 'recipes_50', name: 'Gastronome', desc: '50 recettes consultées', icon: '◆', category: 'explore'},
  {id: 'swap_master', name: 'Swap Master', desc: '20 repas échangés', icon: '◇', category: 'explore'},
  {id: 'all_cuisines', name: 'Tour du Monde', desc: 'Goûté toutes les cuisines', icon: '●', category: 'explore'},

  // Sport
  {id: 'first_workout', name: 'Sportif', desc: 'Premier programme sport', icon: '△', category: 'sport'},
  {id: 'exercises_20', name: 'Athlète', desc: '20 exercices consultés', icon: '△', category: 'sport'},

  // Photos
  {id: 'first_photo', name: 'Selfie', desc: 'Première photo de progression', icon: '□', category: 'photos'},
  {id: 'both_photos', name: 'Analyse Complète', desc: 'Photos face + dos', icon: '□', category: 'photos'}
];

// ─── STREAK TRACKING ───
function getStreak() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return {current: 0, best: 0, lastDate: null};
  var data = JSON.parse(localStorage.getItem(STREAK_KEY + user.id) || '{"current":0,"best":0,"lastDate":null,"dates":[]}');
  return data;
}

function updateStreak() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return;
  var data = getStreak();
  var today = new Date().toISOString().split('T')[0];

  if (data.lastDate === today) return; // Already logged today

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var yesterdayStr = yesterday.toISOString().split('T')[0];

  if (data.lastDate === yesterdayStr) {
    data.current++;
  } else {
    data.current = 1;
  }

  if (data.current > data.best) data.best = data.current;
  data.lastDate = today;
  if (!data.dates) data.dates = [];
  data.dates.push(today);

  localStorage.setItem(STREAK_KEY + user.id, JSON.stringify(data));

  // Check streak badges
  if (data.current >= 3) unlockBadge('streak_3');
  if (data.current >= 7) unlockBadge('streak_7');
  if (data.current >= 14) unlockBadge('streak_14');
  if (data.current >= 30) unlockBadge('streak_30');
  if (data.current >= 90) unlockBadge('streak_90');
}

// ─── BADGE SYSTEM ───
function getUserBadges() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return [];
  return JSON.parse(localStorage.getItem(BADGES_KEY + user.id) || '[]');
}

function unlockBadge(badgeId) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return;
  var badges = getUserBadges();
  if (badges.some(function(b){ return b.id === badgeId; })) return; // Already unlocked

  var def = BADGE_DEFS.find(function(b){ return b.id === badgeId; });
  if (!def) return;

  badges.push({id: badgeId, unlockedAt: Date.now()});
  localStorage.setItem(BADGES_KEY + user.id, JSON.stringify(badges));

  // Show toast notification
  showToast(def.icon + ' ' + def.name + ' débloqué !');

  if (window.BLACKBOX) window.BLACKBOX.log('badge_unlocked', {badge: badgeId, name: def.name});
}

function hasBadge(badgeId) {
  return getUserBadges().some(function(b){ return b.id === badgeId; });
}

// ─── TOAST NOTIFICATIONS ───
function showToast(message, duration) {
  duration = duration || 3000;
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(function(){ toast.classList.add('show'); }, 10);
  setTimeout(function(){
    toast.classList.remove('show');
    setTimeout(function(){ toast.remove(); }, 300);
  }, duration);
}

// ─── DAILY QUOTE ───
function getDailyQuote() {
  var today = new Date();
  var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// ─── COUNTERS (for badge tracking) ───
function incrementCounter(counterName) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return 0;
  var key = 'mtd_counter_' + counterName + '_' + user.id;
  var count = parseInt(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, String(count));
  return count;
}

function getCounter(counterName) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return 0;
  return parseInt(localStorage.getItem('mtd_counter_' + counterName + '_' + user.id) || '0');
}

// ─── RENDER HELPERS ───
// These use a simple h() function. If window.h is available, use it. Otherwise provide fallback.
function _h(tag, className, content) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (typeof content === 'string') el.textContent = content;
  else if (content && content.nodeType) el.appendChild(content);
  else if (Array.isArray(content)) content.forEach(function(c){ if(c) el.appendChild(c); });
  return el;
}

function renderBadgesPanel(container) {
  var unlocked = getUserBadges();
  var unlockedIds = unlocked.map(function(b){ return b.id; });

  var section = _h('div', 'badges-panel');

  // Header
  var header = _h('div', '', '');
  header.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#6B6B65;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #D8D8D0';
  header.textContent = 'Badges — ' + unlocked.length + ' / ' + BADGE_DEFS.length;
  section.appendChild(header);

  // Badge grid
  var grid = _h('div', '');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-bottom:16px';

  BADGE_DEFS.forEach(function(def) {
    var isUnlocked = unlockedIds.indexOf(def.id) !== -1;
    var badge = _h('div', '');
    badge.style.cssText = 'text-align:center;padding:12px 8px;border:1px solid ' + (isUnlocked ? '#1A4A1A' : '#D8D8D0') + ';background:' + (isUnlocked ? 'rgba(26,74,26,.06)' : '#F4F4F0') + ';opacity:' + (isUnlocked ? '1' : '0.5');

    var icon = _h('div', '');
    icon.style.cssText = 'font-size:20px;margin-bottom:4px';
    icon.textContent = def.icon;
    badge.appendChild(icon);

    var name = _h('div', '');
    name.style.cssText = 'font-family:Georgia;font-size:12px;margin-bottom:2px';
    name.textContent = def.name;
    badge.appendChild(name);

    var desc = _h('div', '');
    desc.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:8px;color:#9A9A94;letter-spacing:1px';
    desc.textContent = isUnlocked ? '✓ Débloqué' : def.desc;
    badge.appendChild(desc);

    grid.appendChild(badge);
  });

  section.appendChild(grid);
  container.appendChild(section);
}

function renderStreakWidget(container) {
  var streak = getStreak();

  var widget = _h('div', '');
  widget.style.cssText = 'display:flex;align-items:center;gap:16px;padding:12px 16px;border:1px solid #D8D8D0;background:#F4F4F0;margin-bottom:12px';

  // Streak number
  var num = _h('div', '');
  num.style.cssText = 'font-family:Georgia;font-size:32px;font-style:italic;min-width:60px;text-align:center';
  num.textContent = String(streak.current);
  widget.appendChild(num);

  // Info
  var info = _h('div', '');
  var label = _h('div', '');
  label.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#6B6B65';
  label.textContent = 'Jours consécutifs';
  info.appendChild(label);

  var best = _h('div', '');
  best.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:#9A9A94;margin-top:2px';
  best.textContent = 'Record : ' + streak.best + ' jours';
  info.appendChild(best);

  widget.appendChild(info);

  // Flame icon if streak > 0
  if (streak.current > 0) {
    var flame = _h('div', '');
    flame.style.cssText = 'margin-left:auto;font-size:24px';
    flame.textContent = streak.current >= 7 ? '🔥' : '◆';
    widget.appendChild(flame);
  }

  container.appendChild(widget);
}

function renderDailyQuoteWidget(container) {
  var quote = getDailyQuote();

  var widget = _h('div', '');
  widget.style.cssText = 'border-left:2px solid #0A0A09;padding:12px 16px;margin:16px 0;background:rgba(10,10,9,0.02)';

  var text = _h('div', '');
  text.style.cssText = 'font-family:Georgia;font-size:14px;font-style:italic;line-height:1.7;color:#0A0A09';
  text.textContent = '"' + quote.text + '"';
  widget.appendChild(text);

  var author = _h('div', '');
  author.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#9A9A94;margin-top:6px';
  author.textContent = '— ' + quote.author;
  widget.appendChild(author);

  container.appendChild(widget);
}

// ─── PUBLIC API ───
window.GAMIFICATION = {
  updateStreak: updateStreak,
  unlockBadge: unlockBadge,
  hasBadge: hasBadge,
  getStreak: getStreak,
  getDailyQuote: getDailyQuote,
  incrementCounter: incrementCounter,
  getCounter: getCounter,
  showToast: showToast,
  renderBadgesPanel: renderBadgesPanel,
  renderStreakWidget: renderStreakWidget,
  renderDailyQuoteWidget: renderDailyQuoteWidget,
  BADGE_DEFS: BADGE_DEFS,
  QUOTES: QUOTES
};

})();
