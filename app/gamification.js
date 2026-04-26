/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
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
  {id: 'first_login', name: 'Premier Pas', name_en: 'First Step', desc: 'Première connexion', desc_en: 'First login', icon: '◆', category: 'onboarding'},
  {id: 'profile_complete', name: 'Profil Complet', name_en: 'Complete Profile', desc: 'Toutes les informations renseignées', desc_en: 'All information filled in', icon: '◇', category: 'onboarding'},
  {id: 'first_plan', name: 'Planificateur', name_en: 'Planner', desc: 'Premier planning généré', desc_en: 'First plan generated', icon: '□', category: 'onboarding'},

  // Consistency
  {id: 'streak_3', name: '3 Jours', name_en: '3 Days', desc: 'Connecté 3 jours de suite', desc_en: '3 days in a row', icon: '▲', category: 'streak'},
  {id: 'streak_7', name: 'Semaine Parfaite', name_en: 'Perfect Week', desc: '7 jours consécutifs', desc_en: '7 consecutive days', icon: '▲', category: 'streak'},
  {id: 'streak_14', name: 'Deux Semaines', name_en: 'Two Weeks', desc: '14 jours consécutifs', desc_en: '14 consecutive days', icon: '▲', category: 'streak'},
  {id: 'streak_30', name: 'Mois Complet', name_en: 'Full Month', desc: '30 jours consécutifs', desc_en: '30 consecutive days', icon: '★', category: 'streak'},
  {id: 'streak_90', name: 'Transformation', name_en: 'Transformation', desc: '90 jours consécutifs', desc_en: '90 consecutive days', icon: '★', category: 'streak'},

  // Weight tracking
  {id: 'first_weigh', name: 'Suivi Lancé', name_en: 'Tracking Started', desc: 'Premier poids enregistré', desc_en: 'First weight logged', icon: '○', category: 'tracking'},
  {id: 'weight_10', name: 'Régulier', name_en: 'Consistent', desc: '10 pesées enregistrées', desc_en: '10 weigh-ins recorded', icon: '○', category: 'tracking'},
  {id: 'weight_goal', name: 'Objectif Atteint', name_en: 'Goal Achieved', desc: 'Poids objectif atteint !', desc_en: 'Target weight reached!', icon: '●', category: 'tracking'},
  {id: 'first_kg_lost', name: 'Premier Kilo', name_en: 'First Kilo', desc: 'Premier kg perdu', desc_en: 'First kg lost', icon: '▽', category: 'tracking'},
  {id: 'five_kg', name: '-5 kg', name_en: '-5 kg', desc: '5 kg perdus', desc_en: '5 kg lost', icon: '▽', category: 'tracking'},

  // Nutrition streak
  {id: 'nutrition_streak_7', name: 'Semaine Nutritionnelle', name_en: 'Nutrition Week', desc: '7 jours de repas loggés consécutifs', desc_en: '7 consecutive days of meals logged', icon: '▲', category: 'nutrition'},
  {id: 'nutrition_streak_14', name: 'Quinzaine Nutrition', name_en: 'Nutrition Fortnight', desc: '14 jours de repas loggés consécutifs', desc_en: '14 consecutive days of meals logged', icon: '▲', category: 'nutrition'},
  {id: 'nutrition_streak_30', name: 'Expert Nutrition', name_en: 'Nutrition Expert', desc: '30 jours de repas loggés consécutifs', desc_en: '30 consecutive days of meals logged', icon: '★', category: 'nutrition'},
  {id: 'meals_logged_50', name: 'Maître Cuisinier', name_en: 'Master Chef', desc: '50 repas enregistrés', desc_en: '50 meals recorded', icon: '◆', category: 'nutrition'},

  // Exploration
  {id: 'recipes_10', name: 'Curieux', name_en: 'Curious', desc: '10 recettes consultées', desc_en: '10 recipes viewed', icon: '◆', category: 'explore'},
  {id: 'recipes_50', name: 'Gastronome', name_en: 'Gourmet', desc: '50 recettes consultées', desc_en: '50 recipes viewed', icon: '◆', category: 'explore'},
  {id: 'swap_master', name: 'Swap Master', name_en: 'Swap Master', desc: '20 repas échangés', desc_en: '20 meals swapped', icon: '◇', category: 'explore'},
  {id: 'all_cuisines', name: 'Tour du Monde', name_en: 'World Tour', desc: 'Goûté toutes les cuisines', desc_en: 'Tasted all cuisines', icon: '●', category: 'explore'},

  // Sport
  {id: 'first_workout', name: 'Sportif', name_en: 'Active', desc: 'Premier programme sport', desc_en: 'First sport program', icon: '△', category: 'sport'},
  {id: 'exercises_20', name: 'Athlète', name_en: 'Athlete', desc: '20 exercices consultés', desc_en: '20 exercises viewed', icon: '△', category: 'sport'},

  // Calisthenics progression badges
  {id: 'calisth_first_session', name: 'Callisthéniste', name_en: 'Calisthenics', desc: 'Premier programme callisthénie généré', desc_en: 'First calisthenics program generated', icon: '◇', category: 'calisthenics'},
  {id: 'calisth_week_4', name: 'Mois Callisthénie', name_en: 'Calisthenics Month', desc: '4 semaines de callisthénie complétées', desc_en: '4 weeks of calisthenics completed', icon: '△', category: 'calisthenics'},
  {id: 'calisth_week_12', name: 'Trimestriel Calisth.', name_en: 'Quarterly Calisth.', desc: '12 semaines de callisthénie complétées', desc_en: '12 weeks of calisthenics completed', icon: '◆', category: 'calisthenics'},
  {id: 'calisth_first_pullup', name: 'Première Traction', name_en: 'First Pull-up', desc: 'Première traction stricte réalisée', desc_en: 'First strict pull-up achieved', icon: '★', category: 'calisthenics'},
  {id: 'calisth_muscle_up', name: 'Muscle-Up', name_en: 'Muscle Up', desc: 'Muscle-up strict maîtrisé', desc_en: 'First muscle-up achieved', icon: '★', category: 'calisthenics'},

  // Musculation PR badges
  {id: 'bench_100', name: 'Centenaire', name_en: 'Centurion', desc: 'Développé couché : 100 kg', desc_en: 'Bench press: 100 kg', icon: '◆', category: 'muscu'},
  {id: 'bench_120', name: 'Power Chest', name_en: 'Power Chest', desc: 'Développé couché : 120 kg', desc_en: 'Bench press: 120 kg', icon: '◆', category: 'muscu'},
  {id: 'squat_100', name: 'Squatteur', name_en: 'Squatter', desc: 'Squat : 100 kg', desc_en: 'Squat: 100 kg', icon: '◆', category: 'muscu'},
  {id: 'squat_140', name: 'Jambes de Fer', name_en: 'Iron Legs', desc: 'Squat : 140 kg', desc_en: 'Squat: 140 kg', icon: '★', category: 'muscu'},
  {id: 'deadlift_100', name: 'Terrasseur', name_en: 'Lifter', desc: 'Soulevé de terre : 100 kg', desc_en: 'Deadlift: 100 kg', icon: '◆', category: 'muscu'},
  {id: 'deadlift_160', name: 'Force Brute', name_en: 'Brute Force', desc: 'Soulevé de terre : 160 kg', desc_en: 'Deadlift: 160 kg', icon: '★', category: 'muscu'},
  {id: 'overhead_70', name: 'Bras au Ciel', name_en: 'Arms Overhead', desc: 'Développé militaire : 70 kg', desc_en: 'Military press: 70 kg', icon: '◆', category: 'muscu'},
  {id: 'total_300', name: 'Powerlifter', name_en: 'Powerlifter', desc: 'Total (bench+squat+dl) ≥ 300 kg', desc_en: 'Total (bench+squat+dl) ≥ 300 kg', icon: '★', category: 'muscu'},
  {id: 'total_400', name: 'Elite Force', name_en: 'Elite Force', desc: 'Total (bench+squat+dl) ≥ 400 kg', desc_en: 'Total (bench+squat+dl) ≥ 400 kg', icon: '★', category: 'muscu'},
  {id: 'muscu_sessions_10', name: 'Régularité Fer', name_en: 'Iron Consistency', desc: '10 séances muscu enregistrées', desc_en: '10 weight training sessions recorded', icon: '△', category: 'muscu'},
  {id: 'muscu_sessions_50', name: 'Dédicace', name_en: 'Dedication', desc: '50 séances muscu enregistrées', desc_en: '50 weight training sessions recorded', icon: '★', category: 'muscu'},
  {id: 'first_custom_session', name: 'Séance Libre', name_en: 'Free Session', desc: 'Première séance personnalisée complétée', desc_en: 'First custom session completed', icon: '◇', category: 'muscu'},
  {id: 'first_pr', name: 'Premier PR', name_en: 'First PR', desc: 'Premier record personnel établi', desc_en: 'First personal record set', icon: '◇', category: 'muscu'},

  // Photos
  {id: 'first_photo', name: 'Selfie', name_en: 'Selfie', desc: 'Première photo de progression', desc_en: 'First progress photo', icon: '□', category: 'photos'},
  {id: 'both_photos', name: 'Analyse Complète', name_en: 'Complete Analysis', desc: 'Photos face + dos', desc_en: 'Front + back photos', icon: '□', category: 'photos'},

  // Hyrox badges
  {id: 'hyrox_first_program', name: 'Hyrox Starter', name_en: 'Hyrox Starter', desc: 'Premier programme Hyrox généré', desc_en: 'First Hyrox program generated', icon: '◇', category: 'hyrox'},
  {id: 'hyrox_week_4', name: 'Mois Hyrox', name_en: 'Hyrox Month', desc: '4 semaines de préparation Hyrox', desc_en: '4 weeks of Hyrox preparation', icon: '△', category: 'hyrox'},
  {id: 'hyrox_week_12', name: 'Prépa Complète', name_en: 'Full Prep', desc: '12 semaines de préparation Hyrox terminées', desc_en: '12 weeks of Hyrox preparation completed', icon: '◆', category: 'hyrox'},
  {id: 'hyrox_sub90', name: 'Sub 1h30', name_en: 'Sub 1h30', desc: 'Objectif Hyrox sub 1h30 atteint', desc_en: 'Hyrox sub 1h30 goal achieved', icon: '★', category: 'hyrox'},
  {id: 'hyrox_sub60', name: 'Sub 1h00', name_en: 'Sub 1h00', desc: 'Objectif Hyrox sub 1h00 atteint', desc_en: 'Hyrox sub 1h00 goal achieved', icon: '★', category: 'hyrox'},
  {id: 'hyrox_pro', name: 'Élite Hyrox', name_en: 'Hyrox Elite', desc: 'Programme niveau Pro/Élite', desc_en: 'Pro/Elite level program', icon: '★', category: 'hyrox'}
];

// ─── STREAK TRACKING ───
function getStreak() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return {current: 0, best: 0, lastDate: null};
  var data = {}; try { data = JSON.parse(localStorage.getItem(STREAK_KEY + user.id) || '{"current":0,"best":0,"lastDate":null,"dates":[]}'); } catch(e) { data = {current:0,best:0,lastDate:null,dates:[]}; }
  // Defensive: normalize missing/non-numeric keys (valid JSON {} would have undefined 'current')
  if (typeof data.current !== 'number') data.current = 0;
  if (typeof data.best !== 'number') data.best = 0;
  if (!('lastDate' in data)) data.lastDate = null;
  if (!Array.isArray(data.dates)) data.dates = [];
  return data;
}

function updateStreak() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return;
  var data = getStreak();
  // Helper timezone-safe : évite le décalage UTC/local (ex. UTC+2 à 23h → jour UTC suivant)
  function _localDateStr(d) {
    var dt = d || new Date();
    return dt.getFullYear() + '-' +
      String(dt.getMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getDate()).padStart(2, '0');
  }
  var today = _localDateStr();

  if (data.lastDate === today) return; // Already logged today

  var _yd = new Date();
  _yd.setDate(_yd.getDate() - 1);
  var yesterdayStr = _localDateStr(_yd);

  if (data.lastDate === yesterdayStr) {
    data.current++;
  } else if (data.lastDate && data.lastDate !== today) {
    // Un ou plusieurs jours manqués — vérifier le streak freeze
    var _lastDateObj = new Date(data.lastDate);
    if (isNaN(_lastDateObj.getTime())) {
      data.current = 1; // date corrompue → reset, pas de freeze
    } else {
      var _missedDays = Math.round((new Date(today) - _lastDateObj) / 86400000);
      var thisMonth = today.slice(0, 7); // 'YYYY-MM'
      var _freezeS = window.S || {};
      var freezeAvailable = _freezeS.streakFreezeAvailable !== false; // true par défaut
      var freezeUsedMonth = _freezeS.streakFreezeUsedMonth || '';
      // Freeze uniquement pour exactement 1 jour manqué (diff === 2 signifie 1 jour sauté)
      if (freezeAvailable && freezeUsedMonth !== thisMonth && (data.current || 0) >= 3 && _missedDays === 2) {
        // Activer le freeze : protéger le streak
        if (window.S) {
          window.S.streakFreezeUsedMonth = thisMonth;
          window.S.streakFreezeAvailable = false;
          if (window.saveProfile) { try { window.saveProfile(); } catch(e2) {} }
        }
        showToast((window.isEnglish && window.isEnglish())
          ? ('\u2744 Streak Freeze activated \u2014 your ' + data.current + '-day streak is protected!')
          : ('\u2744 Streak Freeze activ\u00e9 \u2014 ton streak de ' + data.current + ' ' + window.locPlural(data.current, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + ' est prot\u00e9g\u00e9\u00a0!'));
        // On reprend le streak normalement sans reset
        data.current++;
      } else {
        data.current = 1;
      }
    }
  } else {
    data.current = 1;
  }

  if (data.current > data.best) data.best = data.current;
  data.lastDate = today;
  if (!data.dates) data.dates = [];
  if (data.dates.indexOf(today) === -1) data.dates.push(today);
  if (data.dates.length > 400) data.dates = data.dates.slice(-400);

  // Reset mensuel du streak freeze (1er du mois suivant)
  var S2 = window.S || {};
  var thisMonth2 = today.slice(0, 7);
  if (window.S && S2.streakFreezeAvailable === false && (S2.streakFreezeUsedMonth || '') !== thisMonth2) {
    // Nouveau mois — remettre le freeze à disposition
    window.S.streakFreezeAvailable = true;
    if (window.saveProfile) { try { window.saveProfile(); } catch(e3) {} }
  }

  try { localStorage.setItem(STREAK_KEY + user.id, JSON.stringify(data)); } catch(e) {}
  // Sync streak vers Supabase
  if (window.SupaSync) SupaSync.saveStreak({current: data.current, best: data.best, lastDate: data.lastDate, dates: data.dates});

  // Check streak badges + identity progression
  if (data.current >= 3) unlockBadge('streak_3');
  if (data.current >= 7)  { unlockBadge('streak_7');  celebrateIdentity(data.current); }
  if (data.current >= 14) { unlockBadge('streak_14'); celebrateIdentity(data.current); }
  if (data.current >= 30) { unlockBadge('streak_30'); celebrateIdentity(data.current); }
  if (data.current >= 90) { unlockBadge('streak_90'); celebrateIdentity(data.current); }

  // Partage social aux jalons clés (7, 14, 30, 90 jours) — une seule fois par jalon
  var _socialMilestones = [7, 14, 30, 90];
  if (_socialMilestones.indexOf(data.current) !== -1 && window.SOCIAL && window.SOCIAL.shareStreak) {
    try { window.SOCIAL.shareStreak({ days: data.current }); } catch(e) {}
  }
}

// ─── IDENTITY PROGRESSION — messages narratifs aux jalons clés ───────────────
// Affichés 2.5s après le badge toast pour laisser l'utilisateur lire le badge d'abord.
// Basés sur la psychologie comportementale de Fogg : l'identité précède le comportement.
var _IDENTITY_SHOWN = {}; // { '7': true } — évite de réafficher dans la même session

function celebrateIdentity(days) {
  try {
    var _key = String(days);
    if (_IDENTITY_SHOWN[_key]) return;
    var _isEN = window.isEnglish && window.isEnglish();
    var _messages = {
      7:  { title: _isEN ? 'You are consistent.' : 'Vous êtes régulier(e).', body: _isEN ? '7 days in a row — you are among the 15% who truly keep their commitments.' : '7 jours de suite — vous faites partie des 15 % qui tiennent vraiment leurs engagements.' },
      14: { title: _isEN ? 'Discipline confirmed.' : 'Discipline confirmée.', body: _isEN ? '2 weeks without interruption. That\'s the mark of serious intent, not a passing whim.' : '2 semaines sans interruption. C\'est la marque d\'une intention sérieuse, pas d\'un caprice.' },
      30: { title: _isEN ? 'Transformation underway.' : 'Transformation en cours.', body: _isEN ? '30 days — a physiological change is now measurable in your body.' : '30 jours — un changement physiologique est désormais mesurable dans votre corps.' },
      90: { title: _isEN ? 'You are exceptional.' : 'Vous êtes exceptionnel(le).', body: _isEN ? '90 days of consistency. Fewer than 3% of users reach this milestone.' : '90 jours de constance. Moins de 3 % des utilisateurs atteignent ce palier.' }
    };
    var _thresholds = [7, 14, 30, 90];
    var _match = null;
    for (var _i = 0; _i < _thresholds.length; _i++) {
      if (days === _thresholds[_i]) { _match = _messages[_thresholds[_i]]; break; }
    }
    if (!_match) return;
    _IDENTITY_SHOWN[_key] = true;
    setTimeout(function() {
      try {
        var _existing = document.querySelector('.sfc-identity-card');
        if (_existing) _existing.remove();
        var _card = document.createElement('div');
        _card.className = 'sfc-identity-card';
        _card.style.cssText = [
          'position:fixed;left:50%;transform:translateX(-50%)',
          'bottom:calc(80px + env(safe-area-inset-bottom))',
          'max-width:340px;width:calc(100% - 32px)',
          'background:var(--ink-900,#0A0A09);color:var(--ivory,#FAF9F6)',
          'padding:16px 20px;z-index:9800',
          'border-left:3px solid #C9A84C',
          'font-family:"Helvetica Neue",Arial,sans-serif'
        ].join(';');
        var _t = document.createElement('div');
        _t.style.cssText = 'font-family:Georgia,serif;font-size:15px;font-style:italic;margin-bottom:6px;color:#C9A84C;';
        _t.textContent = _match.title;
        var _b = document.createElement('div');
        _b.style.cssText = 'font-size:11px;line-height:1.6;letter-spacing:0.3px;color:rgba(250,249,246,0.82);';
        _b.textContent = _match.body;
        _card.appendChild(_t);
        _card.appendChild(_b);
        document.body.appendChild(_card);
        setTimeout(function() { if (_card.parentNode) _card.remove(); }, 5500);
      } catch(e) {}
    }, 2500);
  } catch(e) {}
}

// ─── NUTRITION STREAK ───
var NUTR_STREAK_KEY = 'mtd_nutrition_streak_';

function updateNutritionStreak() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return;
  var key = NUTR_STREAK_KEY + user.id;
  var data = {}; try { data = JSON.parse(localStorage.getItem(key) || '{"current":0,"lastDate":null}'); } catch(e) { data = {current:0,lastDate:null}; }
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  if (data.lastDate === todayStr) return;
  var yd = new Date(); yd.setDate(yd.getDate()-1);
  var ydStr = yd.getFullYear() + '-' + String(yd.getMonth()+1).padStart(2,'0') + '-' + String(yd.getDate()).padStart(2,'0');
  data.current = (data.lastDate === ydStr) ? (data.current || 0) + 1 : 1;
  data.lastDate = todayStr;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  // Sync nutrition streak via next profile save (backed up in _legacy_storage)
  if (window.SupaSync) SupaSync.scheduleSave();
  if (data.current >= 7)  unlockBadge('nutrition_streak_7');
  if (data.current >= 14) unlockBadge('nutrition_streak_14');
  if (data.current >= 30) unlockBadge('nutrition_streak_30');
}

// ─── VARIABLE REWARD — récompense surprise 30% du temps sur les repas loggés ───
// Pool de messages positifs variés, jamais deux fois le même dans la même journée.
// Le délai de 400ms évite la collision avec le toast principal de l'action.
// ─── VARIABLE REWARD — ratio 30%, 1×/jour, pools par niveau de streak ────────
// Hook Model (Nir Eyal) : la variabilité de la récompense crée l'addiction.
// Pools distincts : utilisateur débutant vs. confirmé vs. élite — messages adaptés.
var _VR_POOLS = {
  beginner: [ // streak 0-6
    'Vous construisez quelque chose de solide.',
    'Chaque repas loggé est une décision consciente.',
    'Un repas de plus dans le bon sens.',
    'La régularité fait plus que l\'intensité.',
    'Bien noté. Votre corps vous remercie.'
  ],
  regular: [ // streak 7-20
    'Une semaine de suite. Votre futur vous remercie.',
    'Votre constance se voit. Vous êtes sur le bon chemin.',
    'Ce geste simple change tout sur le long terme.',
    'Précis. Constant. C\'est ça la méthode.',
    'Votre corps retient tout ce que vous lui enseignez.',
    'Chaque entrée compte. Vous le savez déjà.'
  ],
  elite: [ // streak 21+
    'Vous êtes dans les 5 % qui font vraiment le travail.',
    'Les champions font exactement ce que vous venez de faire.',
    'Pas de génie. Juste de la rigueur. Vous l\'avez.',
    'Une brique de plus sur votre transformation.',
    '30 % des gens craquent avant J+15. Pas vous.',
    'Votre discipline est visible — dans vos habitudes, dans vos résultats.'
  ]
};
var _VR_LAST_DATE = '';
var _VR_FIRED_TODAY = false;

function triggerVariableReward() {
  try {
    var _today = new Date().toISOString().slice(0, 10);
    if (_VR_LAST_DATE !== _today) { _VR_LAST_DATE = _today; _VR_FIRED_TODAY = false; }
    if (_VR_FIRED_TODAY) return;
    if (Math.random() > 0.30) return;
    _VR_FIRED_TODAY = true;
    var _user = window.AUTH ? window.AUTH.getUser() : null;
    var _streak = 0;
    if (_user) {
      try { _streak = (JSON.parse(localStorage.getItem('mtd_streak_' + _user.id) || '{}')).current || 0; } catch(e) {}
    }
    var _pool = _streak >= 21 ? _VR_POOLS.elite : (_streak >= 7 ? _VR_POOLS.regular : _VR_POOLS.beginner);
    var _doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    var _msg = _pool[(_doy + Math.floor(Math.random() * 2)) % _pool.length];
    setTimeout(function() {
      if (window.showToast) window.showToast(_msg, 'info', 3200);
    }, 700);
  } catch(e) {}
}

// ─── PREMIER REPAS DU JOUR — célébration immédiate ────────────────────────────
// Déclenchée quand getDayTotal().count ≤ 1 = c'est la toute première entrée du jour.
// Toast premium distinct du variable reward (pas de conflit : le VR a un délai de 700ms,
// le first-meal a 500ms mais ne fire qu'une fois par jour via _FM_LAST_DATE).
var _FM_LAST_DATE = '';

function triggerFirstMealCelebration() {
  try {
    var _today = new Date().toISOString().slice(0, 10);
    if (_FM_LAST_DATE === _today) return;
    var _jt = (window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal) ? window.FOOD_JOURNAL.getDayTotal() : { count: 0 };
    if ((_jt.count || 0) > 1) return; // Pas le premier
    _FM_LAST_DATE = _today;
    var _user = window.AUTH ? window.AUTH.getUser() : null;
    var _streak = 0;
    if (_user) {
      try { _streak = (JSON.parse(localStorage.getItem('mtd_streak_' + _user.id) || '{}')).current || 0; } catch(e) {}
    }
    var _msg = _streak >= 2
      ? 'Jour ' + _streak + ' — votre régularité se renforce'
      : 'Premier repas du jour — votre journée commence';
    setTimeout(function() {
      if (window.showToast) window.showToast(_msg, 'success', 2800);
    }, 500);
  } catch(e) {}
}

function incrementMealsLogged() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return;
  var count = incrementCounter('meals_logged');
  if (count >= 50) unlockBadge('meals_logged_50');
  triggerFirstMealCelebration();
  updateNutritionStreak();
  triggerVariableReward();
}

// ─── SHARE WORTHY BADGES — déclenche un nudge de partage post-unlock ───
var SHARE_WORTHY_BADGES = {
  streak_7: true, streak_14: true, streak_30: true, streak_90: true,
  weight_goal: true, five_kg: true, first_kg_lost: true,
  bench_100: true, squat_100: true, deadlift_100: true, total_300: true, total_400: true,
  calisth_muscle_up: true, hyrox_sub90: true, hyrox_sub60: true,
  nutrition_streak_30: true, muscu_sessions_50: true
};

// Nudge discret "Partager cette progression →" qui apparaît après la disparition du toast badge
function showShareNudge() {
  if (typeof window === 'undefined') return;
  setTimeout(function() {
    try {
      var existing = document.querySelector('.sfc-share-nudge');
      if (existing) existing.remove();
      var nudge = document.createElement('div');
      nudge.className = 'sfc-share-nudge';
      nudge.style.cssText = [
        'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);',
        'z-index:10100;display:flex;align-items:center;gap:10px;',
        'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);',
        'padding:11px 18px;border-radius:2px;white-space:nowrap;',
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;',
        'cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.35);',
        'opacity:0;transition:opacity .3s ease;'
      ].join('');
      var _txt = document.createElement('span');
      _txt.textContent = (window.isEnglish && window.isEnglish()) ? 'Share this progress' : 'Partager cette progression';
      nudge.appendChild(_txt);
      var _arr = document.createElement('span');
      _arr.style.cssText = 'font-family:Georgia,serif;font-size:14px;';
      _arr.textContent = ' →';
      nudge.appendChild(_arr);
      nudge.addEventListener('click', function() {
        nudge.remove();
        if (window.shareProgression) { try { window.shareProgression(); } catch(e) {} }
      }, { once: true });
      document.body.appendChild(nudge);
      setTimeout(function() { nudge.style.opacity = '1'; }, 30);
      // Auto-dismiss après 8 secondes
      setTimeout(function() {
        nudge.style.opacity = '0';
        setTimeout(function() { if (nudge.parentNode) nudge.parentNode.removeChild(nudge); }, 300);
      }, 8000);
    } catch(e) {}
  }, 3800); // Après disparition du badge toast (3500ms)
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

  // Show badge celebration toast — wording premium
  var _isEN = window.isEnglish && window.isEnglish();
  var _badgeToastMsg = def.icon + ' ' + (_isEN && def.name_en ? def.name_en : def.name) + ' — ' + (_isEN ? 'personal achievements' : 'palmarès personnel');
  if (window.showToast) {
    window.showToast(_badgeToastMsg, 'badge', 3500);
  } else {
    showToast(_badgeToastMsg);
  }

  // Share nudge pour les badges marquants (après disparition du toast)
  if (SHARE_WORTHY_BADGES[badgeId]) { showShareNudge(); }

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

// FIX SPRINT P1.5 — exposer showToast sur window pour usage cross-module
// (logger série muscu, valider repas, save profil, etc.).
// Signature étendue : showToast(message, type, duration). type ∈ {success, error, info}
if (typeof window !== 'undefined') {
  window.showToast = function(message, typeOrDuration, duration) {
    var typ = (typeof typeOrDuration === 'string') ? typeOrDuration : null;
    var dur = (typeof typeOrDuration === 'number') ? typeOrDuration : (duration || 2200);
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    // FIX UX 2026-04-17 : ajoute toast-long pour les messages > 40 char (micro-caps illisible sinon)
    var isLong = typeof message === 'string' && message.length > 40;
    toast.className = 'toast' + (typ ? ' toast-' + typ : '') + (isLong ? ' toast-long' : '');
    toast.setAttribute('role', typ === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', typ === 'error' ? 'assertive' : 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function(){ toast.classList.add('show'); }, 10);
    setTimeout(function(){
      toast.classList.remove('show');
      setTimeout(function(){ toast.remove(); }, 300);
    }, dur);
  };
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
  var count = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
  try { localStorage.setItem(key, String(count)); } catch(e) {}
  if (window.SupaSync) SupaSync.saveCounter(counterName, count);
  return count;
}

function getCounter(counterName) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  if (!user) return 0;
  return (parseInt(localStorage.getItem('mtd_counter_' + counterName + '_' + user.id) || '0', 10) || 0);
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

    var _bEN = window.isEnglish && window.isEnglish();
    var name = _h('div', '');
    name.style.cssText = 'font-family:Georgia;font-size:13px;margin-bottom:2px';
    name.textContent = (_bEN && def.name_en ? def.name_en : def.name);
    badge.appendChild(name);

    var desc = _h('div', '');
    desc.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:#9A9A90;letter-spacing:1px';
    desc.textContent = isUnlocked ? (_bEN ? '✓ Unlocked' : '✓ Débloqué') : (_bEN && def.desc_en ? def.desc_en : def.desc);
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
  var _swEN = window.isEnglish && window.isEnglish();
  var label = _h('div', '');
  label.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65)';
  label.textContent = _swEN ? 'Streak' : 'Séquence';
  info.appendChild(label);

  var best = _h('div', '');
  best.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#9A9A90;margin-top:2px';
  best.textContent = _swEN ? ('Best: ' + streak.best + ' days') : ('Record : ' + streak.best + ' jours');
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

  // Streak freeze badge
  var S = window.S || {};
  if (S.streakFreezeAvailable !== false) {
    var freezeBadge = _h('div', '');
    freezeBadge.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#4A7A8A;border:1px solid #B0D4E0;background:rgba(176,212,224,0.15);padding:4px 10px;display:inline-block;margin-top:6px;';
    freezeBadge.textContent = _swEN ? '\u2744 1 streak freeze available' : '\u2744 1 joker disponible';
    container.appendChild(freezeBadge);
  }
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

// ─── HYROX BADGE CHECKER ───
// Call when Hyrox program is generated or week advances.
// profile: { currentWeek, level, goal } from S state (S.hyroxWeek, S.hyroxLevel, S.hyroxGoal)
function checkHyroxBadges(profile) {
  if (!profile) return;
  unlockBadge('hyrox_first_program');
  unlockBadge('first_workout');
  var week = parseInt(profile.currentWeek) || 1;
  if (week >= 4)  unlockBadge('hyrox_week_4');
  if (week >= 12) unlockBadge('hyrox_week_12');
  if (profile.level === 'pro') unlockBadge('hyrox_pro');
  var goal = profile.goal || '';
  if (goal === 'sub90' || goal === 'sub75' || goal === 'sub60' || goal === 'podium') unlockBadge('hyrox_sub90');
  if (goal === 'sub60' || goal === 'podium') unlockBadge('hyrox_sub60');
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
  updateNutritionStreak: updateNutritionStreak,
  incrementMealsLogged: incrementMealsLogged,
  checkMuscuBadges: checkMuscuBadges,
  checkCalisthenicsBadges: checkCalisthenicsBadges,
  checkHyroxBadges: checkHyroxBadges,
  renderBadgesPanel: renderBadgesPanel,
  renderStreakWidget: renderStreakWidget,
  renderDailyQuoteWidget: renderDailyQuoteWidget,
  BADGE_DEFS: BADGE_DEFS,
  QUOTES: QUOTES
};

})();
