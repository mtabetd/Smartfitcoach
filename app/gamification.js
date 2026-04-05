// gamification.js — Motivation & Engagement System
(function(){
'use strict';

var BADGES_KEY = 'mtd_badges_';
var STREAK_KEY = 'mtd_streak_';
var ACHIEVEMENTS_KEY = 'mtd_achievements_';

// ─── DAILY QUOTES (French, motivational, nutrition/health themed) ───
var QUOTES = [
  {text: "La nourriture que vous mangez peut \u00eatre la forme de m\u00e9decine la plus s\u00fbre ou la plus lente forme de poison.", author: "Ann Wigmore"},
  {text: "Que ton aliment soit ta seule m\u00e9decine.", author: "Hippocrate"},
  {text: "Le corps est le serviteur de l'esprit.", author: "James Allen"},
  {text: "Prends soin de ton corps, c'est le seul endroit o\u00f9 tu es oblig\u00e9 de vivre.", author: "Jim Rohn"},
  {text: "La sant\u00e9 n'est pas tout, mais sans la sant\u00e9 tout n'est rien.", author: "Schopenhauer"},
  {text: "Le succ\u00e8s, c'est la somme de petits efforts r\u00e9p\u00e9t\u00e9s jour apr\u00e8s jour.", author: "Robert Collier"},
  {text: "La discipline est le pont entre les objectifs et l'accomplissement.", author: "Jim Rohn"},
  {text: "Votre corps peut r\u00e9sister \u00e0 presque tout. C'est votre esprit qu'il faut convaincre.", author: ""},
  {text: "Chaque journ\u00e9e est une nouvelle chance de changer votre vie.", author: ""},
  {text: "La force ne vient pas de la capacit\u00e9 physique. Elle vient d'une volont\u00e9 indomptable.", author: "Gandhi"},
  {text: "Manger sainement est une forme de respect envers soi-m\u00eame.", author: ""},
  {text: "Le voyage de mille lieues commence par un pas.", author: "Lao Tseu"},
  {text: "N'abandonnez pas. Souffrez maintenant et vivez le reste de votre vie comme un champion.", author: "Muhammad Ali"},
  {text: "La pers\u00e9v\u00e9rance n'est pas une longue course, c'est plusieurs courtes courses l'une apr\u00e8s l'autre.", author: "Walter Elliot"},
  {text: "Un objectif sans plan n'est qu'un souhait.", author: "Antoine de Saint-Exup\u00e9ry"},
  {text: "Le changement ne viendra pas si nous attendons une autre personne ou un autre moment.", author: "Barack Obama"},
  {text: "Manger est une n\u00e9cessit\u00e9. Manger intelligemment est un art.", author: "La Rochefoucauld"},
  {text: "La meilleure version de vous-m\u00eame attend de l'autre c\u00f4t\u00e9 de l'effort.", author: ""},
  {text: "Chaque repas est une opportunit\u00e9 de nourrir votre corps avec excellence.", author: ""},
  {text: "La motivation vous met en route. L'habitude vous fait continuer.", author: "Jim Ryun"},
  {text: "Les champions ne sont pas faits dans les salles de sport. Ils sont faits \u00e0 partir de quelque chose de profond.", author: "Muhammad Ali"},
  {text: "La perfection n'est pas atteignable, mais en la poursuivant nous atteignons l'excellence.", author: "Vince Lombardi"},
  {text: "Le corps humain est le meilleur tableau de bord que nous ayons.", author: "Arbuthnot Lane"},
  {text: "Mange pour vivre, ne vis pas pour manger.", author: "Socrate"},
  {text: "La sant\u00e9 est la plus grande des richesses.", author: "Virgile"},
  {text: "Nul ne peut atteindre l'aube sans passer par le chemin de la nuit.", author: "Khalil Gibran"},
  {text: "Ce que nous sommes est le r\u00e9sultat de ce que nous avons pens\u00e9.", author: "Bouddha"},
  {text: "Le mouvement est la vie. La vie est le mouvement.", author: "Moshe Feldenkrais"},
  {text: "Le corps sait des choses que l'esprit refuse d'admettre.", author: "Paul Val\u00e9ry"},
  {text: "Chaque victoire commence dans les profondeurs d'un esprit qui dit : je peux.", author: "Mary Kay Ash"},
  {text: "Ce n'est pas la montagne que nous conqu\u00e9rons, mais nous-m\u00eames.", author: "Edmund Hillary"},
  {text: "La force n'est pas dans les muscles. Elle est dans la d\u00e9cision.", author: ""},
  {text: "Manger est un besoin. Savoir choisir ce que l'on mange est une sagesse.", author: ""},
  {text: "L'alimentation est la pharmacologie la plus ancienne.", author: ""},
  {text: "Chaque s\u00e9ance d'entra\u00eenement est un rendez-vous avec la meilleure version de soi.", author: ""},
  {text: "La fatigue est temporaire. La fiert\u00e9 de l'effort dure toujours.", author: ""},
  {text: "Respecter son corps, c'est respecter la vie.", author: ""},
  {text: "Le changement est difficile au d\u00e9but, d\u00e9sordonn\u00e9 au milieu, magnifique \u00e0 la fin.", author: "Robin Sharma"},
  {text: "Un gramme de pr\u00e9vention vaut mieux qu'un kilogramme de rem\u00e8de.", author: ""},
  {text: "Votre sant\u00e9 n'attend pas. Commencez maintenant.", author: ""},
  {text: "Le sommeil est la r\u00e9cup\u00e9ration active de l'esprit et du corps.", author: "Matthew Walker"},
  {text: "L'entra\u00eenement te donnera ce que tu lui donnes.", author: ""},
  {text: "La nutrition est l'architecture invisible de votre performance.", author: ""},
  {text: "Tout exc\u00e8s est un ennemi de l'\u00e9quilibre.", author: ""},
  {text: "Courir n'est pas une fuite. C'est un retour \u00e0 soi-m\u00eame.", author: ""},
  {text: "Le poids que vous soulevez dans la salle n'a rien \u00e0 voir avec le poids que vous portez en sortant.", author: ""},
  {text: "Les habitudes forment le corps avant m\u00eame que l'esprit s'en aper\u00e7oive.", author: ""},
  {text: "La sant\u00e9 mentale et la sant\u00e9 physique ne font qu'un.", author: "Ren\u00e9 Dubos"},
  {text: "Ton corps est ton instrument. Prends soin de lui comme un musicien prend soin du sien.", author: ""},
  {text: "La discipline, c'est se souvenir de ce que l'on veut vraiment.", author: "David Campbell"},
  {text: "Le seul mauvais entra\u00eenement est celui que vous n'avez pas fait.", author: ""},
  {text: "La constance vaut mieux que l'intensit\u00e9.", author: ""},
  {text: "Cuisiner est un acte d'amour envers soi-m\u00eame et les autres.", author: ""},
  {text: "Votre sant\u00e9 est un investissement, pas une d\u00e9pense.", author: ""},
  {text: "L'effort d'aujourd'hui est la facilit\u00e9 de demain.", author: ""},
  {text: "Le corps accomplit ce que l'esprit choisit de nourrir.", author: ""},
  {text: "On ne r\u00e9colte que ce que l'on a sem\u00e9. Nourrissez-vous avec intention.", author: ""},
  {text: "L'\u00e9quilibre n'est pas une destination, c'est une pratique quotidienne.", author: ""},
  {text: "Chaque bouchon de soin que tu prends aujourd'hui est un cadeau \u00e0 ton futur.", author: ""},
  {text: "La v\u00e9ritable force est celle qui permet de se lever demain matin avec \u00e9nergie.", author: ""},
  {text: "Un esprit sain dans un corps sain \u2014 non pas l'un ou l'autre, mais les deux.", author: ""},
  {text: "Ce que l'on mange en priv\u00e9 se voit en public.", author: ""},
  {text: "La r\u00e9gularit\u00e9 construit ce que l'intensit\u00e9 seule ne peut pas.", author: ""}
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

  // Calisthenics progression badges
  {id: 'calisth_first_session', name: 'Callisthéniste', desc: 'Premier programme callisthénie généré', icon: '◇', category: 'calisthenics'},
  {id: 'calisth_week_4', name: 'Mois Callisthénie', desc: '4 semaines de callisthénie complétées', icon: '△', category: 'calisthenics'},
  {id: 'calisth_week_12', name: 'Trimestriel Calisth.', desc: '12 semaines de callisthénie complétées', icon: '◆', category: 'calisthenics'},
  {id: 'calisth_first_pullup', name: 'Première Traction', desc: 'Première traction stricte réalisée', icon: '★', category: 'calisthenics'},
  {id: 'calisth_muscle_up', name: 'Muscle-Up', desc: 'Muscle-up strict maîtrisé', icon: '★', category: 'calisthenics'},

  // Musculation PR badges
  {id: 'bench_100', name: 'Centenaire', desc: 'Développé couché : 100 kg', icon: '◆', category: 'muscu'},
  {id: 'bench_120', name: 'Power Chest', desc: 'Développé couché : 120 kg', icon: '◆', category: 'muscu'},
  {id: 'squat_100', name: 'Squatteur', desc: 'Squat : 100 kg', icon: '◆', category: 'muscu'},
  {id: 'squat_140', name: 'Jambes de Fer', desc: 'Squat : 140 kg', icon: '★', category: 'muscu'},
  {id: 'deadlift_100', name: 'Terrasseur', desc: 'Soulevé de terre : 100 kg', icon: '◆', category: 'muscu'},
  {id: 'deadlift_160', name: 'Force Brute', desc: 'Soulevé de terre : 160 kg', icon: '★', category: 'muscu'},
  {id: 'overhead_70', name: 'Bras au Ciel', desc: 'Développé militaire : 70 kg', icon: '◆', category: 'muscu'},
  {id: 'total_300', name: 'Powerlifter', desc: 'Total (bench+squat+dl) ≥ 300 kg', icon: '★', category: 'muscu'},
  {id: 'total_400', name: 'Elite Force', desc: 'Total (bench+squat+dl) ≥ 400 kg', icon: '★', category: 'muscu'},
  {id: 'muscu_sessions_10', name: 'Régularité Fer', desc: '10 séances muscu enregistrées', icon: '△', category: 'muscu'},
  {id: 'muscu_sessions_50', name: 'Dédicace', desc: '50 séances muscu enregistrées', icon: '★', category: 'muscu'},
  {id: 'first_pr', name: 'Premier PR', desc: 'Premier record personnel établi', icon: '◇', category: 'muscu'},

  // Photos
  {id: 'first_photo', name: 'Selfie', desc: 'Première photo de progression', icon: '□', category: 'photos'},
  {id: 'both_photos', name: 'Analyse Complète', desc: 'Photos face + dos', icon: '□', category: 'photos'},

  // Hyrox badges
  {id: 'hyrox_first_program', name: 'Hyrox Starter', desc: 'Premier programme Hyrox généré', icon: '◇', category: 'hyrox'},
  {id: 'hyrox_week_4', name: 'Mois Hyrox', desc: '4 semaines de préparation Hyrox', icon: '△', category: 'hyrox'},
  {id: 'hyrox_week_12', name: 'Prépa Complète', desc: '12 semaines de préparation Hyrox terminées', icon: '◆', category: 'hyrox'},
  {id: 'hyrox_sub90', name: 'Sub 1h30', desc: 'Objectif Hyrox sub 1h30 atteint', icon: '★', category: 'hyrox'},
  {id: 'hyrox_sub60', name: 'Sub 1h00', desc: 'Objectif Hyrox sub 1h00 atteint', icon: '★', category: 'hyrox'},
  {id: 'hyrox_pro', name: 'Élite Hyrox', desc: 'Programme niveau Pro/Élite', icon: '★', category: 'hyrox'}
];

// ─── STREAK TRACKING ───
function getStreak() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return {current: 0, best: 0, lastDate: null};
  var data = {}; try { data = JSON.parse(localStorage.getItem(STREAK_KEY + user.id) || '{"current":0,"best":0,"lastDate":null,"dates":[]}'); } catch(e) { data = {current:0,best:0,lastDate:null,dates:[]}; }
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
  if (data.dates.length > 400) data.dates = data.dates.slice(-400);

  try { localStorage.setItem(STREAK_KEY + user.id, JSON.stringify(data)); } catch(e) {}
  // Sync streak vers Supabase
  if (window.SupaSync) SupaSync.saveStreak({current: data.current, best: data.best, lastDate: data.lastDate, dates: data.dates});

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
  try { return JSON.parse(localStorage.getItem(BADGES_KEY + user.id) || '[]'); } catch(e) { return []; }
}

function unlockBadge(badgeId) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return;
  var badges = getUserBadges();
  if (badges.some(function(b){ return b.id === badgeId; })) return; // Already unlocked

  var def = BADGE_DEFS.find(function(b){ return b.id === badgeId; });
  if (!def) return;

  badges.push({id: badgeId, unlockedAt: Date.now()});
  try { localStorage.setItem(BADGES_KEY + user.id, JSON.stringify(badges)); } catch(e) {}
  // Sync badge vers Supabase
  if (window.SupaSync) SupaSync.saveBadge(badgeId);

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
  try { localStorage.setItem(key, String(count)); } catch(e) {}
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
  header.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border,#D8D8D0)';
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
    icon.style.cssText = 'font-size:18px;margin-bottom:4px';
    icon.textContent = def.icon;
    badge.appendChild(icon);

    var name = _h('div', '');
    name.style.cssText = 'font-family:Georgia;font-size:13px;margin-bottom:2px';
    name.textContent = def.name;
    badge.appendChild(name);

    var desc = _h('div', '');
    desc.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:#9A9A90;letter-spacing:1px';
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
  widget.style.cssText = 'display:flex;align-items:center;gap:16px;padding:12px 16px;border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);margin-bottom:12px';

  // Streak number
  var num = _h('div', '');
  num.style.cssText = 'font-family:Georgia;font-size:24px;font-style:italic;min-width:60px;text-align:center';
  num.textContent = String(streak.current);
  widget.appendChild(num);

  // Info
  var info = _h('div', '');
  var label = _h('div', '');
  label.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65)';
  label.textContent = 'Jours consécutifs';
  info.appendChild(label);

  var best = _h('div', '');
  best.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#9A9A90;margin-top:2px';
  best.textContent = 'Record : ' + streak.best + ' jours';
  info.appendChild(best);

  widget.appendChild(info);

  // Flame icon if streak > 0
  if (streak.current > 0) {
    var flame = _h('div', '');
    flame.style.cssText = 'margin-left:auto;font-size:24px';
    flame.textContent = streak.current >= 7 ? '◆' : '◇';
    widget.appendChild(flame);
  }

  container.appendChild(widget);
}

function renderDailyQuoteWidget(container) {
  var quote = getDailyQuote();

  var widget = _h('div', '');
  widget.style.cssText = 'border-left:2px solid var(--black,#0A0A09);padding:12px 16px;margin:16px 0;background:rgba(10,10,9,0.02)';

  var text = _h('div', '');
  text.style.cssText = 'font-family:Georgia;font-size:13px;font-style:italic;line-height:1.7;color:var(--black,#0A0A09)';
  text.textContent = '"' + quote.text + '"';
  widget.appendChild(text);

  if (quote.author) {
    var author = _h('div', '');
    author.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#9A9A90;margin-top:6px';
    author.textContent = '\u2014 ' + quote.author;
    widget.appendChild(author);
  }

  container.appendChild(widget);
}

// ─── MUSCU BADGE CHECKER ───
// Call after each muscu session or weight update to unlock PR badges.
// profile: { bench_press, squat, deadlift, overhead_press } in kg (1RM estimated)
function checkMuscuBadges(profile) {
  if (!profile) return;
  var bench = parseFloat(profile.bench_press) || 0;
  var squat = parseFloat(profile.squat) || 0;
  var dl = parseFloat(profile.deadlift) || 0;
  var ohp = parseFloat(profile.overhead_press) || 0;
  var total = bench + squat + dl;

  if (bench >= 100) unlockBadge('bench_100');
  if (bench >= 120) unlockBadge('bench_120');
  if (squat >= 100) unlockBadge('squat_100');
  if (squat >= 140) unlockBadge('squat_140');
  if (dl >= 100) unlockBadge('deadlift_100');
  if (dl >= 160) unlockBadge('deadlift_160');
  if (ohp >= 70) unlockBadge('overhead_70');
  if (total >= 300) unlockBadge('total_300');
  if (total >= 400) unlockBadge('total_400');
  // First PR: any lift > 0
  if (bench > 0 || squat > 0 || dl > 0 || ohp > 0) unlockBadge('first_pr');
}

// ─── CALISTHENICS BADGE CHECKER ───
// Call when calisthenics program is generated or week advances.
// profile: { currentWeek, pullups } from S state
function checkCalisthenicsBadges(profile) {
  if (!profile) return;
  unlockBadge('calisth_first_session');
  unlockBadge('first_workout');
  var week = parseInt(profile.currentWeek) || 1;
  if (week >= 4)  unlockBadge('calisth_week_4');
  if (week >= 12) unlockBadge('calisth_week_12');
  var pullups = parseInt(profile.pullups) || 0;
  if (pullups > 0) unlockBadge('calisth_first_pullup');
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
  checkMuscuBadges: checkMuscuBadges,
  checkCalisthenicsBadges: checkCalisthenicsBadges,
  renderBadgesPanel: renderBadgesPanel,
  renderStreakWidget: renderStreakWidget,
  renderDailyQuoteWidget: renderDailyQuoteWidget,
  BADGE_DEFS: BADGE_DEFS,
  QUOTES: QUOTES
};

})();
