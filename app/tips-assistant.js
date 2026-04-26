/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// tips-assistant.js — Smart Tips Assistant
(function(){
'use strict';

// Inject CSS
var style = document.createElement('style');
style.textContent = `
  .tip-toggle { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border:1px solid var(--border,#D8D8D0); background:var(--ivory2,#F4F4F0); margin-bottom:16px; cursor:pointer; transition:all 0.2s; }
  .tip-toggle:hover { border-color:var(--black,#0A0A09); }
  .tip-toggle.on { border-color:var(--green,#1A4A1A); background:rgba(26,74,26,.04); }
  .tip-toggle-label { font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; }
  .tip-toggle-sub { font-family:'Helvetica Neue',Arial,sans-serif; font-size:9px; color:var(--grey,#6B6B65); margin-top:2px; }
  .tip-toggle-switch { width:36px; height:20px; border-radius:2px; background:var(--grey3,#C8C8C0); position:relative; transition:background 0.2s; }
  .tip-toggle.on .tip-toggle-switch { background:var(--green,#1A4A1A); }
  .tip-toggle-switch::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:white; transition:transform 0.2s; }
  .tip-toggle.on .tip-toggle-switch::after { transform:translateX(16px); }

  .tip-bubble { display:flex; gap:12px; align-items:flex-start; padding:12px 16px; margin:8px 0 16px; border-left:2px solid var(--blue,#1A3A6A); background:var(--bluebg,rgba(26,58,106,.06)); animation:tipIn 0.2s ease; }
  @keyframes tipIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
  .tip-icon { font-size:13px; flex-shrink:0; margin-top:1px; }
  .tip-text { font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; color:var(--black2,#181818); line-height:1.5; }
  .tip-source { font-family:'Helvetica Neue',Arial,sans-serif; font-size:9px; color:var(--grey2,#9A9A90); margin-top:3px; letter-spacing:1px; }
`;
document.head.appendChild(style);

// ─── TIPS DATABASE ───
// ONLY counter-intuitive, myth-busting, surprising facts backed by science
// Each tip is ONE sentence max + source

var TIPS = {
  // NUTRITION - Step 1 (Identité)
  identity: [
    { text: "Votre m\u00e9tabolisme ne ralentit significativement qu'apr\u00e8s 60 ans, pas \u00e0 30 comme on le croit.", text_en: "Your metabolism doesn't significantly slow down until after 60 \u2014 not at 30 as commonly believed.", source: "Science, 2021 (Pontzer et al.)", icon: "\uD83D\uDCA1" },
    { text: "Homme ou femme, la diff\u00e9rence de m\u00e9tabolisme vient surtout de la masse musculaire, pas du sexe.", text_en: "For both men and women, metabolic differences come mainly from muscle mass, not sex.", source: "AJCN, 2005", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 2 (Morphologie)
  morphology: [
    { text: "L'IMC est un indicateur limit\u00e9 : un sportif muscl\u00e9 peut \u00eatre class\u00e9 'ob\u00e8se' alors qu'il est en excellente sant\u00e9.", text_en: "BMI is a limited indicator: a muscular athlete can be classified 'obese' while in excellent health.", source: "The Lancet, 2016", icon: "\u26A0" },
    { text: "Le tour de taille est un meilleur pr\u00e9dicteur de sant\u00e9 que le poids sur la balance.", text_en: "Waist circumference is a better health predictor than scale weight.", source: "OMS, 2008", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 3 (Activit\u00e9)
  activity: [
    { text: "Faire du sport ne fait pas maigrir autant qu'on le pense : l'alimentation compte pour ~80% de la perte de poids.", text_en: "Exercise alone doesn't cause as much weight loss as you'd think: diet accounts for ~80% of weight loss.", source: "British Journal of Sports Medicine, 2015", icon: "\u26A0" },
    { text: "30 min de marche rapide par jour apporte 80% des b\u00e9n\u00e9fices sant\u00e9 d'un entra\u00eenement intensif.", text_en: "30 minutes of brisk walking per day provides 80% of the health benefits of intense training.", source: "JAMA Internal Medicine, 2019", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 4 (Sant\u00e9)
  health: [
    { text: "Le cholest\u00e9rol alimentaire (\u0153ufs) a peu d'impact sur le cholest\u00e9rol sanguin chez 75% des gens.", text_en: "Dietary cholesterol (eggs) has little effect on blood cholesterol in 75% of people.", source: "American Heart Association, 2020", icon: "\u26A0" },
    { text: "Le stress chronique fait autant grossir qu'une mauvaise alimentation via le cortisol.", text_en: "Chronic stress causes as much weight gain as a poor diet, through cortisol.", source: "Obesity Reviews, 2017", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 5 (Habitudes)
  habits: [
    { text: "Le nombre de repas par jour n'impacte pas la perte de poids : seul le total calorique compte.", text_en: "Meal frequency doesn't impact weight loss: only total daily calories count.", source: "British Journal of Nutrition, 2010", icon: "\u26A0" },
    { text: "Manger le soir ne fait PAS plus grossir : c'est le total journalier qui compte, pas l'heure.", text_en: "Eating at night does NOT make you gain more weight: total daily intake matters, not meal timing.", source: "Nutrients, 2019 (meta-analyse)", icon: "\u26A0" },
    { text: "Les 'd\u00e9tox' et jus d\u00e9tox n'ont aucune base scientifique : votre foie et vos reins font d\u00e9j\u00e0 le travail.", text_en: "'Detox' diets and juices have no scientific basis: your liver and kidneys already handle that.", source: "British Dietetic Association", icon: "\u26A0" }
  ],

  // NUTRITION - Step 5 (Alcool)
  alcohol: [
    { text: "1 verre d'alcool bloque la combustion des graisses pendant 12 \u00e0 36 heures.", text_en: "1 alcoholic drink blocks fat burning for 12 to 36 hours.", source: "American Journal of Clinical Nutrition, 1999", icon: "\u26A0" },
    { text: "Le 'French Paradox' du vin rouge est un mythe : aucune quantit\u00e9 d'alcool n'est b\u00e9n\u00e9fique pour la sant\u00e9.", text_en: "The 'French Paradox' of red wine is a myth: no amount of alcohol is beneficial to health.", source: "The Lancet, 2018 (Global Burden of Disease)", icon: "\u26A0" }
  ],

  // NUTRITION - Step 6 (Objectif)
  goal: [
    { text: "Un d\u00e9ficit de plus de 500 kcal/jour fait perdre autant de muscle que de graisse.", text_en: "A deficit of more than 500 kcal/day causes as much muscle loss as fat loss.", source: "ISSN Position Stand, 2017", icon: "\u26A0" },
    { text: "Perdre 0.5 kg/semaine est le rythme optimal pour pr\u00e9server le muscle \u2014 plus rapide = contre-productif.", text_en: "Losing 0.5 kg/week is the optimal rate to preserve muscle \u2014 faster is counterproductive.", source: "International Journal of Sport Nutrition, 2011", icon: "\uD83D\uDCA1" },
    { text: "Les r\u00e9gimes yo-yo r\u00e9duisent le m\u00e9tabolisme de base durablement : mieux vaut un petit d\u00e9ficit constant.", text_en: "Yo-yo dieting durably reduces your basal metabolic rate: a small consistent deficit is better.", source: "Obesity, 2016 (Biggest Loser study)", icon: "\u26A0" }
  ],

  // NUTRITION - Step 7 (Pr\u00e9f\u00e9rences)
  preferences: [
    { text: "Bio \u2260 plus nutritif : les \u00e9tudes montrent des valeurs nutritionnelles quasi identiques bio vs conventionnel.", text_en: "Organic \u2260 more nutritious: studies show near-identical nutritional values for organic vs. conventional.", source: "Annals of Internal Medicine, 2012 (Stanford meta-analyse)", icon: "\u26A0" },
    { text: "Les superfoods n'existent pas : une alimentation vari\u00e9e bat n'importe quel aliment 'miracle'.", text_en: "Superfoods don't exist: a varied diet beats any single 'miracle' food.", source: "European Journal of Clinical Nutrition, 2018", icon: "\u26A0" }
  ],

  // NUTRITION - Step 8 (R\u00e9sultats)
  results: [
    { text: "Les prot\u00e9ines sont le macro le plus rassasiant : augmenter les prot\u00e9ines r\u00e9duit naturellement l'app\u00e9tit de 15-20%.", text_en: "Protein is the most satiating macronutrient: increasing protein naturally reduces appetite by 15-20%.", source: "American Journal of Clinical Nutrition, 2005", icon: "\uD83D\uDCA1" },
    { text: "Boire 500ml d'eau 30 min avant le repas r\u00e9duit l'apport calorique de 13%.", text_en: "Drinking 500ml of water 30 minutes before a meal reduces calorie intake by 13%.", source: "Obesity, 2015", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 9 (Planning)
  planning: [
    { text: "Cuisiner \u00e0 la maison fait consommer en moyenne 200 kcal de moins par repas qu'au restaurant.", text_en: "Cooking at home results in consuming an average of 200 fewer kcal per meal than eating out.", source: "Journal of the Academy of Nutrition, 2017", icon: "\uD83D\uDCA1" },
    { text: "Pr\u00e9parer ses repas \u00e0 l'avance (meal prep) est le meilleur pr\u00e9dicteur de succ\u00e8s d'un r\u00e9gime.", text_en: "Meal prepping is the strongest predictor of diet success.", source: "International Journal of Behavioral Nutrition, 2017", icon: "\uD83D\uDCA1" }
  ],

  // SPORT - Objectif
  sportGoal: [
    { text: "Le cardio seul est inefficace pour maigrir : ajouter de la musculation double la perte de graisse.", text_en: "Cardio alone is ineffective for fat loss: adding strength training doubles fat loss.", source: "BMC Medicine, 2021", icon: "\u26A0" },
    { text: "Le muscle ne se transforme PAS en graisse (et inversement) : ce sont deux tissus biologiquement diff\u00e9rents.", text_en: "Muscle does NOT turn into fat (or vice versa): they are two biologically different tissues.", source: "ACSM", icon: "\u26A0" }
  ],

  // SPORT - Niveau
  sportLevel: [
    { text: "Un d\u00e9butant peut gagner 8-12 kg de muscle la premi\u00e8re ann\u00e9e, mais seulement 2-3 kg apr\u00e8s 3 ans.", text_en: "A beginner can gain 8-12 kg of muscle in the first year, but only 2-3 kg after 3 years.", source: "NSCA, 2016 (Lyle McDonald model)", icon: "\uD83D\uDCA1" },
    { text: "Les courbatures ne sont PAS un signe d'un bon entra\u00eenement : elles indiquent juste un stimulus nouveau.", text_en: "Soreness is NOT a sign of a good workout: it just indicates a new stimulus.", source: "Sports Medicine, 2003", icon: "\u26A0" }
  ],

  // SPORT - Zones
  sportZones: [
    { text: "Cibler la perte de graisse locale (ventre, cuisses) est IMPOSSIBLE : le corps perd la graisse globalement.", text_en: "Targeting local fat loss (belly, thighs) is IMPOSSIBLE: the body loses fat globally.", source: "Journal of Strength & Conditioning, 2011", icon: "\u26A0" },
    { text: "Faire 1000 abdos ne donne pas de tablettes : c'est le % de masse grasse qui les r\u00e9v\u00e8le (< 12% homme, < 20% femme).", text_en: "1000 sit-ups won't reveal abs: it's body fat % that shows them (< 12% men, < 20% women).", source: "ACSM", icon: "\u26A0" }
  ],

  // SPORT - Programme
  sportProgram: [
    { text: "2 s\u00e9ances/semaine par muscle suffisent pour 90% des gains \u2014 plus ne fait pas mieux.", text_en: "2 sessions/week per muscle group is enough for 90% of gains \u2014 more doesn't help.", source: "Sports Medicine, 2016 (Schoenfeld meta-analyse)", icon: "\uD83D\uDCA1" },
    { text: "Le temps de repos entre s\u00e9ries compte : 2-3 min pour la force, 60-90s pour l'hypertrophie.", text_en: "Rest time between sets matters: 2-3 min for strength, 60-90s for hypertrophy.", source: "Journal of Strength & Conditioning Research, 2016", icon: "\uD83D\uDCA1" },
    { text: "S'\u00e9tirer avant la musculation R\u00c9DUIT la force de 5-8% : pr\u00e9f\u00e9rer un \u00e9chauffement dynamique.", text_en: "Static stretching before lifting REDUCES strength by 5-8%: prefer a dynamic warm-up.", source: "Scandinavian J. of Med. & Science in Sports, 2012", icon: "\u26A0" }
  ],

  // CYCLE MENSTRUEL
  cycle: [
    { text: "La phase folliculaire (apr\u00e8s les r\u00e8gles) est le meilleur moment pour battre des records \u00e0 la salle.", text_en: "The follicular phase (after menstruation) is the best time to hit new PRs at the gym.", source: "British Journal of Sports Medicine, 2020", icon: "\uD83D\uDCA1" },
    { text: "Les envies de sucre en phase lut\u00e9ale sont biologiques (progest\u00e9rone) : pr\u00e9voir des snacks sains, pas les combattre.", text_en: "Sugar cravings in the luteal phase are biological (progesterone): plan healthy snacks, don't fight them.", source: "Appetite, 2016", icon: "\uD83D\uDCA1" }
  ],

  // SUPPL\u00c9MENTS
  supplements: [
    { text: "La cr\u00e9atine est le suppl\u00e9ment le plus \u00e9tudi\u00e9 au monde : sans danger et efficace, m\u00eame pour les femmes.", text_en: "Creatine is the most studied supplement in the world: safe and effective, even for women.", source: "ISSN, 2017 (700+ \u00e9tudes)", icon: "\uD83D\uDCA1" },
    { text: "90% des gens manquent de vitamine D en hiver : c'est le seul suppl\u00e9ment quasi universellement recommand\u00e9.", text_en: "90% of people are deficient in vitamin D in winter: it's the only supplement nearly universally recommended.", source: "Endocrine Society, 2011", icon: "\u26A0" },
    { text: "Les BCAA sont inutiles si vous mangez assez de prot\u00e9ines (1.6g/kg) : \u00e9conomisez votre argent.", text_en: "BCAAs are useless if you eat enough protein (1.6g/kg): save your money.", source: "JISSN, 2017", icon: "\u26A0" }
  ],

  // GROSSESSE
  pregnancy: [
    { text: "Contrairement aux croyances, il ne faut PAS 'manger pour deux' : seulement +340 kcal/jour au T2.", text_en: "Contrary to belief, you do NOT need to 'eat for two': only +340 kcal/day in the 2nd trimester.", source: "ACOG, 2020", icon: "\u26A0" },
    { text: "Le sport pendant la grossesse R\u00c9DUIT les risques de complications : 150 min/semaine recommand\u00e9es.", text_en: "Exercise during pregnancy REDUCES complication risks: 150 min/week is recommended.", source: "OMS, 2020", icon: "\uD83D\uDCA1" }
  ],

  // TRIATHLON / IRONMAN
  triathlon: [
    { text: "En triathlon, la transition (T1/T2) est souvent n\u00e9glig\u00e9e \u00e0 l'entra\u00eenement : 30s gagn\u00e9es en transition = 30s gagn\u00e9es sans effort physique.", text_en: "In triathlon, transitions (T1/T2) are often neglected in training: 30s saved in transition = 30s gained with no physical effort.", source: "Triathlon Coach Magazine, 2019", icon: "\uD83D\uDCA1" },
    { text: "La brique (v\u00e9lo \u2192 course) est l'entra\u00eenement cl\u00e9 du triathlon : les jambes passent d'un mouvement rotatif \u00e0 lin\u00e9aire en quelques minutes.", text_en: "The brick session (bike \u2192 run) is the key triathlon workout: legs shift from rotational to linear movement in minutes.", source: "IRONMAN Coaching, 2021", icon: "\uD83D\uDCA1" },
    { text: "En IRONMAN, 70% des abandons sont dus \u00e0 une mauvaise strat\u00e9gie nutritionnelle, pas au manque de forme physique.", text_en: "In IRONMAN, 70% of DNFs are due to poor nutrition strategy, not lack of fitness.", source: "Journal of Science and Medicine in Sport, 2017", icon: "\u26A0" }
  ],

  // G\u00c9N\u00c9RAL
  general: [
    { text: "Dormir moins de 7h augmente la faim de 24% le lendemain via la ghr\u00e9line.", text_en: "Sleeping less than 7 hours increases hunger by 24% the next day via ghrelin.", source: "PLoS Medicine, 2004", icon: "\u26A0" },
    { text: "Peser les aliments pendant 2 semaines suffit \u00e0 recalibrer votre perception des portions pour longtemps.", text_en: "Weighing food for 2 weeks is enough to recalibrate your portion perception for a long time.", source: "Obesity, 2014", icon: "\uD83D\uDCA1" },
    { text: "Le petit-d\u00e9jeuner n'est PAS le repas le plus important : le sauter ne ralentit pas le m\u00e9tabolisme.", text_en: "Breakfast is NOT the most important meal: skipping it doesn't slow your metabolism.", source: "BMJ, 2019 (meta-analyse)", icon: "\u26A0" }
  ]
};

// ─── STATE ───
var TIPS_KEY = 'mtd_tips_enabled';

function isTipsEnabled() {
  try { return localStorage.getItem(TIPS_KEY) === 'true'; } catch(e) { return false; }
}

function setTipsEnabled(val) {
  try { localStorage.setItem(TIPS_KEY, val ? 'true' : 'false'); } catch(e) {}
}

// ─── GET TIP FOR CONTEXT ───
// Returns one random tip for the given context, different each render
function getTip(context) {
  if (!isTipsEnabled()) return null;
  var tips = TIPS[context];
  if (!tips || !tips.length) return null;
  // Use a daily seed + context hash for consistency within a session
  var today = new Date().toISOString().split('T')[0];
  var seed = 0;
  for (var i = 0; i < (today + context).length; i++) {
    seed = ((seed << 5) - seed) + (today + context).charCodeAt(i);
    seed = seed & seed;
  }
  var idx = Math.abs(seed) % tips.length;
  var tip = tips[idx];
  var _tipEN = window.isEnglish && window.isEnglish();
  return { text: (_tipEN && tip.text_en) ? tip.text_en : tip.text, source: tip.source, icon: tip.icon };
}

// ─── RENDER FUNCTIONS ───

// Toggle widget (for auth screen or dashboard)
function renderToggle(container) {
  var enabled = isTipsEnabled();
  var _tEN = window.isEnglish && window.isEnglish();
  var toggle = document.createElement('div');
  toggle.className = 'tip-toggle' + (enabled ? ' on' : '');
  toggle.onclick = function() {
    setTipsEnabled(!isTipsEnabled());
    if (window.render) window.render();
    else { toggle.className = 'tip-toggle' + (isTipsEnabled() ? ' on' : ''); }
  };

  var left = document.createElement('div');
  var label = document.createElement('div');
  label.className = 'tip-toggle-label';
  label.textContent = 'Assistant Tips';
  left.appendChild(label);
  var sub = document.createElement('div');
  sub.className = 'tip-toggle-sub';
  sub.textContent = enabled ? (_tEN ? 'On — Scientific tips at every step' : 'Activé — Conseils scientifiques à chaque étape') : (_tEN ? 'Off — Enable anti-myth tips' : 'Désactivé — Activer les conseils anti-mythes');
  left.appendChild(sub);
  toggle.appendChild(left);

  var sw = document.createElement('div');
  sw.className = 'tip-toggle-switch';
  toggle.appendChild(sw);

  container.appendChild(toggle);
}

// Show a tip bubble for a given context
function renderTip(container, context) {
  var tip = getTip(context);
  if (!tip) return;

  var bubble = document.createElement('div');
  bubble.className = 'tip-bubble';

  var icon = document.createElement('span');
  icon.className = 'tip-icon';
  icon.textContent = tip.icon;
  bubble.appendChild(icon);

  var content = document.createElement('div');
  var text = document.createElement('div');
  text.className = 'tip-text';
  text.textContent = tip.text;
  content.appendChild(text);

  var source = document.createElement('div');
  source.className = 'tip-source';
  source.textContent = tip.source;
  content.appendChild(source);

  bubble.appendChild(content);
  container.appendChild(bubble);
}

// ─── PUBLIC API ───
window.TIPS = {
  isEnabled: isTipsEnabled,
  setEnabled: setTipsEnabled,
  getTip: getTip,
  renderToggle: renderToggle,
  renderTip: renderTip,
  TIPS_DB: TIPS
};

})();
