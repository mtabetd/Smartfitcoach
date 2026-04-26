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
var DAILY_SPORT = window.isEnglish && window.isEnglish() ? [
  'Consistency does more than intensity. Every session counts.',
  'Progress is not linear — it is certain.',
  'The best athlete is the one who comes back, again and again.',
  'What you do today, your body will remember in six months.',
  'Pain is temporary. Progress stays.',
  'Every rep is a decision. Choose to improve.',
  'The body adapts to what you demand of it. Demand the best.'
] : [
  'La régularité fait plus que l\'intensité. Chaque séance compte.',
  'La progression n\'est pas linéaire — elle est certaine.',
  'Le meilleur athlète est celui qui revient, encore et encore.',
  'Ce que vous faites aujourd\'hui, votre corps s\'en souviendra dans six mois.',
  'La douleur est temporaire. La progression, elle, reste.',
  'Chaque répétition est une décision. Choisissez de progresser.',
  'Le corps s\'adapte à ce qu\'on lui impose. Imposez-lui le meilleur.'
];

var DAILY_NUTRITION = window.isEnglish && window.isEnglish() ? [
  'What you eat is the foundation of who you become.',
  'Nutrition is not a constraint — it is a competitive advantage.',
  'Every meal is an opportunity to improve.',
  'Eating right is not deprivation. It is precision.',
  'The nutrition plan you follow today is tomorrow\'s performance.',
  'Fueling your body correctly is the highest form of discipline.',
  'Nutritional consistency beats training intensity.'
] : [
  'Ce que vous mangez est la fondation de ce que vous devenez.',
  'La nutrition n\'est pas une contrainte — c\'est un avantage compétitif.',
  'Chaque repas est une opportunité de progresser.',
  'Manger juste n\'est pas une privation. C\'est une précision.',
  'Le plan nutrition que vous respectez aujourd\'hui est la performance de demain.',
  'Nourrir votre corps correctement est la forme la plus haute de discipline.',
  'La cohérence nutritionnelle bat l\'intensité de l\'entraînement.'
];

// Messages par sport (appelés avant la séance)
var SPORT_MESSAGES = window.isEnglish && window.isEnglish() ? {
  crossfit: [
    'You are going to surpass yourself. That is the only goal that counts.',
    'Every WOD is a test of character as much as endurance.',
    'Today\'s discomfort builds tomorrow\'s strength.',
    'The clock doesn\'t lie. Give everything.'
  ],
  muscu: [
    'Strength is built in the details — tempo, load, recovery.',
    'Every set executed with precision is a set won.',
    'Muscle doesn\'t grow during effort. It grows during rest. Stay consistent.',
    'Improving 2.5 kg per month is 30 kg per year. Consistency is a strategy.'
  ],
  running: [
    'The right pace today is power tomorrow.',
    'Every kilometer run is proof you can do one more.',
    'Running teaches one thing: you can keep going when you think you can\'t.',
    'Running is meditation in motion. Be present, be precise.'
  ],
  triathlon: [
    'Three disciplines, one philosophy: never give up.',
    'Endurance is built session by session, without exception.',
    'In triathlon, the winner is the one who prepared best. You are preparing.',
    'Swim, bike, run — and do it better than yesterday.'
  ],
  cycling: [
    'Every watt produced is real work. Produce more.',
    'The peloton rewards consistency, not bursts.',
    'The road doesn\'t adapt to you. Adapt to the road.',
    'Pedal with intention — that\'s where progress begins.'
  ],
  hyrox: [
    'Strength and endurance. Both together. That\'s Hyrox.',
    'The suffering is temporary. The final time is permanent.',
    'Every station crossed is proof of what you\'re capable of.',
    'Hyrox doesn\'t forgive approximations. Be precise.'
  ],
  calisthenics: [
    'Your body is the only equipment you need. Master it.',
    'Calisthenics teaches control before power.',
    'One perfect rep is worth ten sloppy reps.',
    'Progress in calisthenics is a matter of patience and rigor.'
  ],
  yoga: [
    'Strength without flexibility is incomplete. You are building both.',
    'Every breath is a decision to stay present.',
    'Yoga is not a gentle practice — it is a demanding discipline.',
    'Body balance starts with mental balance.'
  ],
  padel: [
    'Padel rewards reading the game as much as athleticism.',
    'Every lost point is information. Use it.',
    'Consistency on the court creates instinct. Train.',
    'Play with intention, every rally.'
  ],
  golf: [
    'In golf, precision comes from repetition. Repeat.',
    'Every swing is an opportunity to refine your technique.',
    'The mental game is 80% of golf. Work on all 100%.',
    'Patience is the most important technique in golf.'
  ],
  'default': [
    'Progress is the only direction that counts.',
    'Every session brings you closer to the version of yourself you are building.',
    'You made a commitment to yourself. Honor it.',
    'Today\'s discipline is tomorrow\'s freedom.'
  ]
} : {
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
var WELLNESS_MESSAGES = window.isEnglish && window.isEnglish() ? {
  peak: [
    'Your body is ready. Your mind too. This is the moment to give everything.',
    'Peak form. The best sessions come from moments like this.',
    'You are in shape. Use it wisely.'
  ],
  normal: [
    'A good session awaits you. Stay focused on execution.',
    'Consistency beats intensity. Today, be consistent.',
    'You don\'t need to be perfect to improve. Just show up.'
  ],
  reduced: [
    'Listening to your body is a skill. You are applying it today.',
    'A lighter session done is infinitely better than an intense session avoided.',
    'Smart recovery is part of progress.'
  ],
  recovery: [
    'Champions recover as seriously as they train.',
    'Today, recovery is your training. Treat it with the same seriousness.',
    'Active rest is a technique, not a weakness.'
  ]
} : {
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
var NUTRITION_SLOT_MESSAGES = window.isEnglish && window.isEnglish() ? {
  breakfast: 'Breakfast sets your energy for the next few hours.',
  lunch: 'A balanced lunch maintains your focus and performance.',
  snack: 'A precise snack prevents blood sugar spikes and supports recovery.',
  dinner: 'Dinner prepares your sleep and overnight muscle recovery.'
} : {
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
