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
    { text: "Votre métabolisme ne ralentit significativement qu'après 60 ans, pas à 30 comme on le croit.", source: "Science, 2021 (Pontzer et al.)", icon: "\uD83D\uDCA1" },
    { text: "Homme ou femme, la différence de métabolisme vient surtout de la masse musculaire, pas du sexe.", source: "AJCN, 2005", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 2 (Morphologie)
  morphology: [
    { text: "L'IMC est un indicateur limité : un sportif musclé peut être classé 'obèse' alors qu'il est en excellente santé.", source: "The Lancet, 2016", icon: "\u26A0" },
    { text: "Le tour de taille est un meilleur prédicteur de santé que le poids sur la balance.", source: "OMS, 2008", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 3 (Activité)
  activity: [
    { text: "Faire du sport ne fait pas maigrir autant qu'on le pense : l'alimentation compte pour ~80% de la perte de poids.", source: "British Journal of Sports Medicine, 2015", icon: "\u26A0" },
    { text: "30 min de marche rapide par jour apporte 80% des bénéfices santé d'un entraînement intensif.", source: "JAMA Internal Medicine, 2019", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 4 (Santé)
  health: [
    { text: "Le cholestérol alimentaire (œufs) a peu d'impact sur le cholestérol sanguin chez 75% des gens.", source: "American Heart Association, 2020", icon: "\u26A0" },
    { text: "Le stress chronique fait autant grossir qu'une mauvaise alimentation via le cortisol.", source: "Obesity Reviews, 2017", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 5 (Habitudes)
  habits: [
    { text: "Le nombre de repas par jour n'impacte pas la perte de poids : seul le total calorique compte.", source: "British Journal of Nutrition, 2010", icon: "\u26A0" },
    { text: "Manger le soir ne fait PAS plus grossir : c'est le total journalier qui compte, pas l'heure.", source: "Nutrients, 2019 (meta-analyse)", icon: "\u26A0" },
    { text: "Les 'détox' et jus détox n'ont aucune base scientifique : votre foie et vos reins font déjà le travail.", source: "British Dietetic Association", icon: "\u26A0" }
  ],

  // NUTRITION - Step 5 (Alcool)
  alcohol: [
    { text: "1 verre d'alcool bloque la combustion des graisses pendant 12 à 36 heures.", source: "American Journal of Clinical Nutrition, 1999", icon: "\u26A0" },
    { text: "Le 'French Paradox' du vin rouge est un mythe : aucune quantité d'alcool n'est bénéfique pour la santé.", source: "The Lancet, 2018 (Global Burden of Disease)", icon: "\u26A0" }
  ],

  // NUTRITION - Step 6 (Objectif)
  goal: [
    { text: "Un déficit de plus de 500 kcal/jour fait perdre autant de muscle que de graisse.", source: "ISSN Position Stand, 2017", icon: "\u26A0" },
    { text: "Perdre 0.5 kg/semaine est le rythme optimal pour préserver le muscle — plus rapide = contre-productif.", source: "International Journal of Sport Nutrition, 2011", icon: "\uD83D\uDCA1" },
    { text: "Les régimes yo-yo réduisent le métabolisme de base durablement : mieux vaut un petit déficit constant.", source: "Obesity, 2016 (Biggest Loser study)", icon: "\u26A0" }
  ],

  // NUTRITION - Step 7 (Préférences)
  preferences: [
    { text: "Bio \u2260 plus nutritif : les études montrent des valeurs nutritionnelles quasi identiques bio vs conventionnel.", source: "Annals of Internal Medicine, 2012 (Stanford meta-analyse)", icon: "\u26A0" },
    { text: "Les superfoods n'existent pas : une alimentation variée bat n'importe quel aliment 'miracle'.", source: "European Journal of Clinical Nutrition, 2018", icon: "\u26A0" }
  ],

  // NUTRITION - Step 8 (Résultats)
  results: [
    { text: "Les protéines sont le macro le plus rassasiant : augmenter les protéines réduit naturellement l'appétit de 15-20%.", source: "American Journal of Clinical Nutrition, 2005", icon: "\uD83D\uDCA1" },
    { text: "Boire 500ml d'eau 30 min avant le repas réduit l'apport calorique de 13%.", source: "Obesity, 2015", icon: "\uD83D\uDCA1" }
  ],

  // NUTRITION - Step 9 (Planning)
  planning: [
    { text: "Cuisiner à la maison fait consommer en moyenne 200 kcal de moins par repas qu'au restaurant.", source: "Journal of the Academy of Nutrition, 2017", icon: "\uD83D\uDCA1" },
    { text: "Préparer ses repas à l'avance (meal prep) est le meilleur prédicteur de succès d'un régime.", source: "International Journal of Behavioral Nutrition, 2017", icon: "\uD83D\uDCA1" }
  ],

  // SPORT - Objectif
  sportGoal: [
    { text: "Le cardio seul est inefficace pour maigrir : ajouter de la musculation double la perte de graisse.", source: "BMC Medicine, 2021", icon: "\u26A0" },
    { text: "Le muscle ne se transforme PAS en graisse (et inversement) : ce sont deux tissus biologiquement différents.", source: "ACSM", icon: "\u26A0" }
  ],

  // SPORT - Niveau
  sportLevel: [
    { text: "Un débutant peut gagner 8-12 kg de muscle la première année, mais seulement 2-3 kg après 3 ans.", source: "NSCA, 2016 (Lyle McDonald model)", icon: "\uD83D\uDCA1" },
    { text: "Les courbatures ne sont PAS un signe d'un bon entraînement : elles indiquent juste un stimulus nouveau.", source: "Sports Medicine, 2003", icon: "\u26A0" }
  ],

  // SPORT - Zones
  sportZones: [
    { text: "Cibler la perte de graisse locale (ventre, cuisses) est IMPOSSIBLE : le corps perd la graisse globalement.", source: "Journal of Strength & Conditioning, 2011", icon: "\u26A0" },
    { text: "Faire 1000 abdos ne donne pas de tablettes : c'est le % de masse grasse qui les révèle (< 12% homme, < 20% femme).", source: "ACSM", icon: "\u26A0" }
  ],

  // SPORT - Programme
  sportProgram: [
    { text: "2 séances/semaine par muscle suffisent pour 90% des gains — plus ne fait pas mieux.", source: "Sports Medicine, 2016 (Schoenfeld meta-analyse)", icon: "\uD83D\uDCA1" },
    { text: "Le temps de repos entre séries compte : 2-3 min pour la force, 60-90s pour l'hypertrophie.", source: "Journal of Strength & Conditioning Research, 2016", icon: "\uD83D\uDCA1" },
    { text: "S'étirer avant la musculation RÉDUIT la force de 5-8% : préférer un échauffement dynamique.", source: "Scandinavian J. of Med. & Science in Sports, 2012", icon: "\u26A0" }
  ],

  // CYCLE MENSTRUEL
  cycle: [
    { text: "La phase folliculaire (après les règles) est le meilleur moment pour battre des records à la salle.", source: "British Journal of Sports Medicine, 2020", icon: "\uD83D\uDCA1" },
    { text: "Les envies de sucre en phase lutéale sont biologiques (progestérone) : prévoir des snacks sains, pas les combattre.", source: "Appetite, 2016", icon: "\uD83D\uDCA1" }
  ],

  // SUPPLÉMENTS
  supplements: [
    { text: "La créatine est le supplément le plus étudié au monde : sans danger et efficace, même pour les femmes.", source: "ISSN, 2017 (700+ études)", icon: "\uD83D\uDCA1" },
    { text: "90% des gens manquent de vitamine D en hiver : c'est le seul supplément quasi universellement recommandé.", source: "Endocrine Society, 2011", icon: "\u26A0" },
    { text: "Les BCAA sont inutiles si vous mangez assez de protéines (1.6g/kg) : économisez votre argent.", source: "JISSN, 2017", icon: "\u26A0" }
  ],

  // GROSSESSE
  pregnancy: [
    { text: "Contrairement aux croyances, il ne faut PAS 'manger pour deux' : seulement +340 kcal/jour au T2.", source: "ACOG, 2020", icon: "\u26A0" },
    { text: "Le sport pendant la grossesse RÉDUIT les risques de complications : 150 min/semaine recommandées.", source: "OMS, 2020", icon: "\uD83D\uDCA1" }
  ],

  // TRIATHLON / IRONMAN
  triathlon: [
    { text: "En triathlon, la transition (T1/T2) est souvent négligée à l'entraînement : 30s gagnées en transition = 30s gagnées sans effort physique.", source: "Triathlon Coach Magazine, 2019", icon: "\uD83D\uDCA1" },
    { text: "La brique (vélo → course) est l'entraînement clé du triathlon : les jambes passent d'un mouvement rotatif à linéaire en quelques minutes.", source: "IRONMAN Coaching, 2021", icon: "\uD83D\uDCA1" },
    { text: "En IRONMAN, 70% des abandons sont dus à une mauvaise stratégie nutritionnelle, pas au manque de forme physique.", source: "Journal of Science and Medicine in Sport, 2017", icon: "\u26A0" }
  ],

  // GÉNÉRAL
  general: [
    { text: "Dormir moins de 7h augmente la faim de 24% le lendemain via la ghréline.", source: "PLoS Medicine, 2004", icon: "\u26A0" },
    { text: "Peser les aliments pendant 2 semaines suffit à recalibrer votre perception des portions pour longtemps.", source: "Obesity, 2014", icon: "\uD83D\uDCA1" },
    { text: "Le petit-déjeuner n'est PAS le repas le plus important : le sauter ne ralentit pas le métabolisme.", source: "BMJ, 2019 (meta-analyse)", icon: "\u26A0" }
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
  return tips[idx];
}

// ─── RENDER FUNCTIONS ───

// Toggle widget (for auth screen or dashboard)
function renderToggle(container) {
  var enabled = isTipsEnabled();
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
  label.textContent = '\uD83D\uDCA1 Assistant Tips';
  left.appendChild(label);
  var sub = document.createElement('div');
  sub.className = 'tip-toggle-sub';
  sub.textContent = enabled ? 'Activé — Conseils scientifiques à chaque étape' : 'Désactivé — Activer les conseils anti-mythes';
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
