/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// motivation.js — Bibliothèque de messages de soutien SmartFitCoach
(function() {
'use strict';

// Messages rotatifs par jour de la semaine (index 0=dim...6=sam)
var DAILY_SPORT = [
  'La régularité fait plus que l\'intensité. Chaque séance compte.',
  'La progression n\'est pas linéaire — elle est certaine.',
  'Le meilleur athlète est celui qui revient, encore et encore.',
  'Ce que vous faites aujourd\'hui, votre corps s\'en souviendra dans six mois.',
  'La douleur est temporaire. La progression, elle, reste.',
  'Chaque répétition est une décision. Choisissez de progresser.',
  'Le corps s\'adapte à ce qu\'on lui impose. Imposez-lui le meilleur.'
];

var DAILY_NUTRITION = [
  'Ce que vous mangez est la fondation de ce que vous devenez.',
  'La nutrition n\'est pas une contrainte — c\'est un avantage compétitif.',
  'Chaque repas est une opportunité de progresser.',
  'Manger juste n\'est pas une privation. C\'est une précision.',
  'Le plan nutrition que vous respectez aujourd\'hui est la performance de demain.',
  'Nourrir votre corps correctement est la forme la plus haute de discipline.',
  'La cohérence nutritionnelle bat l\'intensité de l\'entraînement.'
];

// Messages par sport (appelés avant la séance)
var SPORT_MESSAGES = {
  crossfit: [
    'Vous allez vous dépasser. C\'est le seul objectif qui compte.',
    'Chaque WOD est un test de caractère autant que d\'endurance.',
    'L\'inconfort d\'aujourd\'hui construit la force de demain.',
    'Le chrono ne ment pas. Donnez tout.'
  ],
  muscu: [
    'La force se construit dans les détails — tempo, charge, récupération.',
    'Chaque série exécutée avec précision est une série gagnée.',
    'Le muscle ne pousse pas pendant l\'effort. Il pousse pendant le repos. Restez cohérent.',
    'Progresser de 2,5 kg par mois, c\'est 30 kg par an. La constance est une stratégie.'
  ],
  running: [
    'Le rythme juste aujourd\'hui, c\'est la puissance demain.',
    'Chaque kilomètre parcouru est une certitude que vous pouvez en faire un de plus.',
    'La course enseigne une chose : vous êtes capable de continuer quand vous pensez ne plus pouvoir.',
    'Courir est une méditation en mouvement. Soyez présent, soyez précis.'
  ],
  triathlon: [
    'Trois disciplines, une seule philosophie : ne jamais céder.',
    'L\'endurance se construit session après session, sans exception.',
    'En triathlon, celui qui gagne est celui qui s\'est le mieux préparé. Vous vous préparez.',
    'Nager, pédaler, courir — et le faire mieux qu\'hier.'
  ],
  cycling: [
    'Chaque watt produit est du travail réel. Produisez-en davantage.',
    'Le peloton récompense la constance, pas les à-coups.',
    'La route ne s\'adapte pas à vous. Adaptez-vous à la route.',
    'Pédaler avec intention — c\'est là que la progression commence.'
  ],
  hyrox: [
    'Force et endurance. Les deux ensemble. C\'est Hyrox.',
    'La souffrance est temporaire. Le chrono final, lui, est permanent.',
    'Chaque station franchie est une preuve de ce dont vous êtes capable.',
    'Hyrox ne pardonne pas les approximations. Soyez précis.'
  ],
  calisthenics: [
    'Votre corps est le seul équipement dont vous avez besoin. Maîtrisez-le.',
    'La callisthénie enseigne le contrôle avant la puissance.',
    'Une répétition parfaite vaut dix répétitions bâclées.',
    'La progression en callisthénie est une question de patience et de rigueur.'
  ],
  yoga: [
    'La force sans souplesse est incomplète. Vous construisez les deux.',
    'Chaque respiration est une décision de rester présent.',
    'Le yoga n\'est pas une pratique douce — c\'est une discipline exigeante.',
    'L\'équilibre du corps commence par l\'équilibre de l\'esprit.'
  ],
  padel: [
    'Le padel récompense la lecture du jeu autant que l\'athlétisme.',
    'Chaque point perdu est une information. Utilisez-la.',
    'La régularité sur le court crée l\'instinct. Entraînez-vous.',
    'Jouez avec intention, chaque échange.'
  ],
  golf: [
    'Au golf, la précision naît de la répétition. Répétez.',
    'Chaque swing est une opportunité d\'affiner votre technique.',
    'Le mental fait 80% du golf. Travaillez les 100%.',
    'La patience est la technique la plus importante au golf.'
  ],
  'default': [
    'La progression est la seule direction qui compte.',
    'Chaque séance vous rapproche de la version de vous que vous construisez.',
    'Vous vous êtes engagé envers vous-même. Honorez cet engagement.',
    'La discipline d\'aujourd\'hui est la liberté de demain.'
  ]
};

// Messages wellness selon le niveau de forme
var WELLNESS_MESSAGES = {
  peak: [
    'Votre corps est prêt. Votre tête aussi. C\'est le moment de tout donner.',
    'Forme optimale. Les meilleures séances naissent de moments comme celui-ci.',
    'Vous êtes en forme. Exploitez-le intelligemment.'
  ],
  normal: [
    'Une bonne séance vous attend. Restez concentré sur l\'exécution.',
    'La régularité prime sur l\'intensité. Aujourd\'hui, soyez régulier.',
    'Pas besoin d\'être parfait pour progresser. Soyez simplement là.'
  ],
  reduced: [
    'Écouter son corps est une compétence. Vous l\'appliquez aujourd\'hui.',
    'Une séance allégée faite est infiniment mieux qu\'une séance intense évitée.',
    'La récupération intelligente fait partie de la progression.'
  ],
  recovery: [
    'Les champions récupèrent aussi sérieusement qu\'ils s\'entraînent.',
    'Aujourd\'hui, la récupération est votre entraînement. Traitez-la avec le même sérieux.',
    'Le repos actif est une technique, pas une faiblesse.'
  ]
};

// Messages nutrition contextuelle (selon le repas)
var NUTRITION_SLOT_MESSAGES = {
  breakfast: 'Le petit-déjeuner conditionne votre énergie pour les prochaines heures.',
  lunch: 'Un déjeuner équilibré maintient votre concentration et vos performances.',
  snack: 'Une collation précise évite les pics glycémiques et soutient la récupération.',
  dinner: 'Le dîner prépare votre sommeil et la récupération musculaire de la nuit.'
};

// Sélectionner un message selon le jour ou un index aléatoire
function getDailyMessage(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  var idx = new Date().getDay();
  return arr[idx % arr.length];
}

function getRandomMessage(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSportMessage(sportType) {
  var msgs = SPORT_MESSAGES[sportType] || SPORT_MESSAGES['default'];
  return getRandomMessage(msgs);
}

function getWellnessMessage(level) {
  var msgs = WELLNESS_MESSAGES[level] || WELLNESS_MESSAGES['normal'];
  return getRandomMessage(msgs);
}

function getDailySportMessage() {
  return getDailyMessage(DAILY_SPORT);
}

function getDailyNutritionMessage() {
  return getDailyMessage(DAILY_NUTRITION);
}

function getNutritionSlotMessage(slot) {
  return NUTRITION_SLOT_MESSAGES[slot] || '';
}

// Exposer globalement
window.MOTIVATION = {
  getSportMessage: getSportMessage,
  getWellnessMessage: getWellnessMessage,
  getDailySportMessage: getDailySportMessage,
  getDailyNutritionMessage: getDailyNutritionMessage,
  getNutritionSlotMessage: getNutritionSlotMessage
};

})();
