// app-core.js — MTD Macro Calculator: Core State, Constants, Helpers, Formulas
(function(){
'use strict';

// ─── DOM HELPERS ───
function h(tag,attrs,ch){var el=document.createElement(tag);if(attrs)for(var k in attrs){if(attrs[k]===null||attrs[k]===undefined)continue;if(k==='class')el.className=attrs[k];else if(k==='html')el.innerHTML=attrs[k];else if(k==='disabled'){if(attrs[k]===true)el.setAttribute('disabled','')}else if(k.indexOf('on')===0)el.addEventListener(k.slice(2),attrs[k]);else el.setAttribute(k,attrs[k])}if(ch!=null){if(typeof ch==='string'||typeof ch==='number')el.textContent=ch;else if(Array.isArray(ch))for(var i=0;i<ch.length;i++){if(ch[i])el.appendChild(ch[i])}else if(ch.nodeType)el.appendChild(ch)}return el}
function txt(s){return document.createTextNode(s)}

function svgRing(size,stroke,pct,color,label,value){
  var r=(size-stroke)/2,c=2*Math.PI*r,off=c-(pct/100)*c;
  var ns='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(ns,'svg');svg.setAttribute('width',size);svg.setAttribute('height',size);svg.setAttribute('viewBox','0 0 '+size+' '+size);
  var bg=document.createElementNS(ns,'circle');bg.setAttribute('cx',size/2);bg.setAttribute('cy',size/2);bg.setAttribute('r',r);bg.setAttribute('fill','none');bg.setAttribute('stroke','#E5E4DE');bg.setAttribute('stroke-width',stroke);svg.appendChild(bg);
  var fg=document.createElementNS(ns,'circle');fg.setAttribute('cx',size/2);fg.setAttribute('cy',size/2);fg.setAttribute('r',r);fg.setAttribute('fill','none');fg.setAttribute('stroke',color);fg.setAttribute('stroke-width',stroke);fg.setAttribute('stroke-linecap','square');fg.setAttribute('stroke-dasharray',c);fg.setAttribute('stroke-dashoffset',c);fg.setAttribute('transform','rotate(-90 '+size/2+' '+size/2+')');fg.style.transition='stroke-dashoffset 0.7s ease';svg.appendChild(fg);
  var t=document.createElementNS(ns,'text');t.setAttribute('x',size/2);t.setAttribute('y',size/2+1);t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','middle');t.setAttribute('fill','#0A0A09');t.setAttribute('font-family','Georgia');t.setAttribute('font-weight','normal');t.setAttribute('font-size','16');t.textContent=value;svg.appendChild(t);
  var w=h('div',{'class':'ring-wrap'},[svg,h('div',{'class':'ring-label'},label),h('div',{'class':'ring-val'},value+'g')]);
  setTimeout(function(){fg.setAttribute('stroke-dashoffset',off)},50);
  return w;
}

// ─── Chart instance tracking (prevent "Canvas already in use" errors) ───
window._chartInstances = [];
window.createChart = function(canvas, config) {
  if (typeof Chart === 'undefined') return null;
  // Destroy any existing chart on this canvas
  for (var i = window._chartInstances.length - 1; i >= 0; i--) {
    try {
      if (window._chartInstances[i].canvas === canvas) {
        window._chartInstances[i].destroy();
        window._chartInstances.splice(i, 1);
      }
    } catch(e) {}
  }
  var chart = new Chart(canvas.getContext('2d'), config);
  window._chartInstances.push(chart);
  return chart;
};
window.destroyAllCharts = function() {
  for (var i = 0; i < window._chartInstances.length; i++) {
    try { window._chartInstances[i].destroy(); } catch(e) {}
  }
  window._chartInstances = [];
};

// ─── Make helpers globally available ───
window.h = h;
window.txt = txt;
window.svgRing = svgRing;

// ─── SECURITY: Input Sanitization ───
window.sanitizeHTML = function(str) {
  if (typeof str !== 'string') return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// ─── CONSTANTS ───
var STEPS=['Accueil','Identité','Morphologie','Activité','Santé','Objectif','Préférences','Résultats','Planning'];
var ACTIVITIES=[
  {icon:'\u{1FA91}',name:'Sédentaire',desc:'Pas d\'exercice',factor:1.2},
  {icon:'\u{1F6B6}',name:'Légèrement actif',desc:'1-2x / semaine',factor:1.375},
  {icon:'\u{1F3C3}',name:'Modérément actif',desc:'3-4x / semaine',factor:1.55},
  {icon:'\u{1F3CB}\uFE0F',name:'Très actif',desc:'5-6x / semaine',factor:1.725},
  {icon:'⚡',name:'Athlète',desc:'2x / jour',factor:1.9},
  {icon:'🏆',name:'Athlète élite',desc:'>10h / semaine (IRONMAN, pro)',factor:2.1}
];
var TRAINS=[{icon:'\u{1F3CB}\uFE0F',name:'Musculation'},{icon:'\u{1FAC0}',name:'Cardio'},{icon:'💪',name:'Mixte'},{icon:'⚽',name:'Sport co.'},{icon:'\u{1F3C3}',name:'Running'}];
var SLEEPS=['< 6h','6-7h','7-8h','8h+'];
var GOALS=[
  {icon:'↗',name:'Prise de masse',desc:'+15% calories',mult:1.15,key:'bulk'},
  {icon:'=',name:'Maintien',desc:'= TDEE',mult:1.0,key:'maintain'},
  {icon:'↘',name:'Perte de poids',desc:'-15% calories',mult:0.85,key:'cut'},
  {icon:'↓',name:'Sèche',desc:'-25% calories',mult:0.75,key:'shred'}
];
// RATIOS : distribution calorique indicative par objectif (pour affichage uniquement)
// ATTENTION : calcMacros() utilise la méthode g/kg (ISSN 2017), pas ces ratios
// Ces valeurs ne sont PAS utilisées pour le calcul des macros — elles servent uniquement à l'affichage indicatif
// Note : l'approche g/kg est cliniquement supérieure aux % de calories (ISSN 2017, Helms 2014)
var RATIOS={bulk:{g:.55,p:.25,l:.20},maintain:{g:.50,p:.30,l:.20},cut:{g:.40,p:.35,l:.25},shred:{g:.30,p:.40,l:.30}};
var COOK_LEVELS=[{name:'Facile',desc:'5-10 min',val:1},{name:'Moyen',desc:'15-20 min',val:2},{name:'Avancé',desc:'30 min',val:3},{name:'Chef',desc:'45+ min',val:4}];
var ALLERGIES=['Aucune','Fruits à coque','Arachides','Oeufs','Poisson','Crustacés','Soja','Lait/Produits laitiers','Gluten/Blé','Sésame','Moutarde'];
var INTOLERANCES=['Aucune','Lactose','Gluten','Fructose','Histamine'];
var REGIMES=[{icon:'♦',name:'Omnivore'},{icon:'♦',name:'Pescétarien'},{icon:'♦',name:'Végétarien'},{icon:'♦',name:'Végan'}];
var CUISINES=[{f:'🌍',name:'Toutes'},{f:'🇫🇷',name:'Française'},{f:'🇺🇸',name:'Américaine'},{f:'🇯🇵',name:'Japonaise'},{f:'🇲🇦',name:'Marocaine'},{f:'🇮🇹',name:'Italienne'},{f:'🇹🇭',name:'Thaïlandaise'},{f:'🇮🇳',name:'Indienne'},{f:'🇰🇷',name:'Coréenne'},{f:'🇲🇽',name:'Mexicaine'},{f:'🇱🇧',name:'Libanaise'},{f:'🇻🇳',name:'Vietnamienne'}];
var CUISINE_FLAGS={'Toutes':null,'Française':'🇫🇷','Américaine':'🇺🇸','Japonaise':'🇯🇵','Marocaine':'🇲🇦','Italienne':'🇮🇹','Thaïlandaise':'🇹🇭','Indienne':'🇮🇳','Coréenne':'🇰🇷','Mexicaine':'🇲🇽','Libanaise':'🇱🇧','Vietnamienne':'🇻🇳'};
var MEDICAL=[
  {cat:'MÉTABOLIQUES',items:[
    {id:'diabete_t2',name:'Diabète type 2',desc:'Réduction glucides simples, IG bas',icon:'◆'},
    {id:'diabete_t1',name:'Diabète type 1',desc:'Comptage glucides précis',icon:'◆'},
    {id:'prediabete',name:'Pré-diabète / Résistance insuline',desc:'Limiter sucres rapides, favoriser fibres',icon:'◆'},
    {id:'cholesterol',name:'Hypercholestérolémie',desc:'Réduction graisses saturées',icon:'◆'},
    {id:'triglycerides',name:'Hypertriglycéridémie',desc:'Limiter sucres et alcool',icon:'◆'},
    {id:'goutte',name:'Goutte / Hyper-uricémie',desc:'Éviter purines (abats, sardines)',icon:'◆'}
  ]},
  {cat:'CARDIOVASCULAIRES',items:[
    {id:'hta',name:'Hypertension artérielle',desc:'Régime hyposodé, DASH',icon:'◇'},
    {id:'cardio',name:'Maladie cardiovasculaire',desc:'Réduction sodium et graisses saturées',icon:'◇'},
    {id:'insuffisance_card',name:'Insuffisance cardiaque',desc:'Restriction sodique stricte',icon:'◇'}
  ]},
  {cat:'RÉNALES',items:[
    {id:'irc',name:'Insuffisance rénale chronique',desc:'Contrôle protéines, potassium, phosphore',icon:'○'},
    {id:'calculs',name:'Calculs rénaux',desc:'Hydratation, limiter oxalates et sodium',icon:'○'}
  ]},
  {cat:'DIGESTIVES',items:[
    {id:'rgo',name:'Reflux gastro-œsophagien (RGO)',desc:'Éviter acides, café, épices fortes',icon:'□'},
    {id:'sii',name:'Syndrome intestin irritable (SII)',desc:'Régime pauvre en FODMAP',icon:'□'},
    {id:'crohn',name:'Maladie de Crohn',desc:'Fibres adaptées, éviter irritants',icon:'□'},
    {id:'rch',name:'Rectocolite hémorragique',desc:'Alimentation anti-inflammatoire',icon:'□'},
    {id:'coeliaque',name:'Maladie cœliaque',desc:'Zéro gluten strict',icon:'□'},
    {id:'nash',name:'Stéatose hépatique (NASH)',desc:'Réduction sucres et graisses',icon:'□'}
  ]},
  {cat:'HORMONALES & AUTO-IMMUNES',items:[
    {id:'hypothyroidie',name:'Hypothyroïdie',desc:'Iode, sélénium, éviter excès soja',icon:'△'},
    {id:'hyperthyroidie',name:'Hyperthyroïdie',desc:'Apport calorique adapté, calcium',icon:'△'},
    {id:'sopk',name:'SOPK',desc:'IG bas, anti-inflammatoire',icon:'△'},
    {id:'menopause',name:'Ménopause / Post-ménopause',desc:'Calcium, vit D, protéines + , kcal réduits',icon:'△'},
    {id:'hashimoto',name:'Thyroïdite de Hashimoto',desc:'Anti-inflammatoire, sans gluten optionnel',icon:'△'}
  ]},
  {cat:'OS & ARTICULATIONS',items:[
    {id:'osteoporose',name:'Ostéoporose',desc:'Calcium, vitamine D, protéines',icon:'▽'},
    {id:'polyarthrite',name:'Polyarthrite rhumatoïde',desc:'Oméga-3, anti-inflammatoire',icon:'▽'}
  ]},
  {cat:'CARENCES & AUTRES',items:[
    {id:'anemie',name:'Anémie ferriprive',desc:'Fer héminique, vitamine C',icon:'●'},
    {id:'anemie_b12',name:'Carence B12 / Folates',desc:'Sources animales ou supplémentation',icon:'●'},
    {id:'obesity',name:'Obésité (IMC > 30)',desc:'Déficit calorique contrôlé',icon:'●'},
    {id:'tca',name:'Troubles du comportement alimentaire',desc:'Suivi médical recommandé',icon:'●'},
    {id:'grossesse',name:'Grossesse',desc:'Folates, fer, calcium, protéines +',icon:'●'},
    {id:'allaitement',name:'Allaitement',desc:'+500 kcal/j, calcium, vitamine D, iode',icon:'●'},
    {id:'insomnia',name:'Troubles du sommeil',desc:'Magnésium, tryptophane, éviter excitants',icon:'●'}
  ]}
];
var MEDICAL_ADVICE={
  diabete_t2:{warn:'Glucides simples limités. Privilégiez les céréales complètes et légumineuses.',macroAdj:{g:-.10,p:.05,l:.05}},
  diabete_t1:{warn:'Comptage glucidique essentiel. Consultez votre diabétologue.',macroAdj:{g:-.05,p:.03,l:.02}},
  prediabete:{warn:'Favorisez les aliments à index glycémique bas et les fibres.',macroAdj:{g:-.08,p:.04,l:.04}},
  // AHA/ESC 2019 : hypercholestérolémie → réduire graisses SATURÉES (qualité, pas quantité totale)
  // Ne PAS réduire les lipides totaux : MUFA (olive) et PUFA (oméga-3) sont cardioprotecteurs
  // macroAdj.l supprimé (réduire lipides totaux = contre-productif si on supprime les bons)
  cholesterol:{warn:'Réduisez les graisses saturées (charcuteries, beurre, fromages gras). Privilégiez MUFA (huile d\'olive) et oméga-3 (poisson gras, noix, lin). Fibres solubles (avoine, psyllium) réduisent LDL de 5-10% (AHA 2019).',macroAdj:{g:.02,p:.02,l:0}},
  // ESC/EAS 2016 : hypertriglycéridémie → réduire glucides ET alcool (principal levier)
  // Les oméga-3 EPA/DHA à 2-4g/j réduisent TG de 20-50% (ESC 2016) → pas d'augmentation lipides totaux
  // macroAdj.l corrigé à 0 (les lipides omega-3 sont déjà recommandés via suppléments)
  triglycerides:{warn:'Réduisez les glucides rapides et l\'alcool — premier levier. Oméga-3 (EPA+DHA 2-4g/j) réduisent les TG de 20-50% (ESC 2016). Évitez jus de fruits, sodas, miel, sirop d\'agave.',macroAdj:{g:-.10,p:.03,l:0}},
  goutte:{warn:'Évitez les abats, sardines, anchois. Buvez 2L+ d\'eau/jour.',macroAdj:null},
  hta:{warn:'Régime hyposodé (< 5g sel/jour). Augmentez potassium (banane, épinard).',macroAdj:null},
  cardio:{warn:'Réduisez sodium et graisses saturées. Plus d\'oméga-3.',macroAdj:{g:.03,p:.02,l:-.05}},
  insuffisance_card:{warn:'Restriction sodique stricte. Consultez votre cardiologue pour les apports hydriques.',macroAdj:null},
  irc:{warn:'Contrôlez les protéines (0.55-0.60g/kg — KDOQI 2020). Limitez potassium et phosphore. Glucides complexes pour compenser l\'énergie.',macroAdj:{g:.08,p:0,l:.02}},
  calculs:{warn:'Buvez 2.5L+ d\'eau/jour. Limitez les oxalates (épinards, chocolat).',macroAdj:null},
  rgo:{warn:'Évitez café, chocolat, tomates, épices fortes. Repas fractionnez.',macroAdj:null},
  sii:{warn:'Régime pauvre en FODMAP en phase d\'exclusion. Réintroduction progressive.',macroAdj:null},
  crohn:{warn:'Fibres solubles préférées. Évitez les aliments irritants en poussée.',macroAdj:null},
  rch:{warn:'Alimentation anti-inflammatoire. Oméga-3, curcuma.',macroAdj:null},
  coeliaque:{warn:'Exclusion totale du gluten (blé, orge, seigle, avoine contaminée).',macroAdj:null},
  nash:{warn:'Réduction des sucres ajoutés et graisses saturées. Perte de poids progressive.',macroAdj:{g:-.08,p:.03,l:.05}},
  hypothyroidie:{warn:'Assurez iode et sélénium. Évitez excès de soja et crucifères crus.',macroAdj:null},
  hyperthyroidie:{warn:'Apport calorique augmenté. Calcium et vitamine D importants.',macroAdj:null},
  sopk:{warn:'Index glycémique bas, anti-inflammatoire. Oméga-3 et magnésium.',macroAdj:{g:-.08,p:.04,l:.04}},
  // NAMS 2022 + ESPEN 2019 : ménopause → +10% protéines (résistance anabolique + perte musculaire)
  // Lipides : pas de réduction totale — oméga-3 protecteurs cardiovasculaires (ESC 2021)
  // macroAdj.p corrigé à +0.10 (cohérence avec description "+10%") | macroAdj.l corrigé à 0
  menopause:{warn:'Ménopause : métabolisme réduit ~100-150 kcal/j (NAMS 2022). Calcium 1200mg/j + Vitamine D. Protéines +10% contre la perte musculaire (ESPEN 2019). Oméga-3 pour santé cardiovasculaire et os.',macroAdj:{g:-.05,p:.10,l:0}},
  hashimoto:{warn:'Anti-inflammatoire. Certains patients bénéficient du sans gluten.',macroAdj:null},
  osteoporose:{warn:'Calcium (1200mg/j), vitamine D, protéines adéquates.',macroAdj:{g:-.03,p:.05,l:-.02}},
  polyarthrite:{warn:'Oméga-3 (poissons gras). Réduisez oméga-6 et aliments pro-inflammatoires.',macroAdj:null},
  anemie:{warn:'Fer héminique (viande rouge), vitamine C pour absorption. Évitez thé/café aux repas.',macroAdj:null},
  anemie_b12:{warn:'Sources B12 : viande, poisson, œufs. Supplémentation si végétalien.',macroAdj:null},
  obesity:{warn:'Déficit calorique modéré (-500 kcal/j max). Protéines hautes pour préserver la masse maigre.',macroAdj:{g:-.08,p:.10,l:-.02}},
  tca:{warn:'Un suivi médical et psychologique est fortement recommandé.',macroAdj:null},
  grossesse:{warn:'Acide folique, fer, calcium. +300 kcal/j au 2e trimestre, +450 au 3e.',macroAdj:{g:.02,p:.05,l:-.02}},
  allaitement:{warn:'Allaitement : +500 kcal/j (ACOG 2022). Calcium 1200mg/j, iode 290µg/j, vitamine D 600 UI. Évitez caféine >200mg/j et alcool.',macroAdj:{g:.03,p:.07,l:-.01}},
  insomnia:{warn:'Magnésium, tryptophane (dinde, banane). Évitez caféine après 14h.',macroAdj:null}
};
var MEAL_SPLIT={pctBreak:.25,pctLunch:.40,pctSnack:.05,pctDinner:.30}; // défaut 3 repas
// getMealSplit() : distribution dynamique selon activité et nombre de repas (vs MEAL_SPLIT fixe)
// Base : ADA 2023, ISSN 2017, Ivy 2004 (post-workout nutrition window)
function getMealSplit(){
  var s=window.S;
  var meals=s.mealsPerDay||3;
  var actFactor=s.activity!==null&&ACTIVITIES[s.activity]?ACTIVITIES[s.activity].factor:1.2;
  var isAthlete=actFactor>=1.725; // Très actif ou Athlète
  if(meals<=2){
    // Jeûne intermittent : 2 repas principaux, pas de collation
    return{pctBreak:.40,pctLunch:.60,pctSnack:0,pctDinner:0,
      note:'Jeûne intermittent : 2 repas — assurez un apport protéique suffisant à chaque repas (≥0.4g/kg/repas — Norton 2012)'};
  }
  if(meals===3){
    if(isAthlete){
      // Athlète 3 repas : collation post-entraînement essentielle → redistribuer légèrement
      return{pctBreak:.25,pctLunch:.38,pctSnack:.07,pctDinner:.30,
        note:'Athlète 3 repas : collation post-entraînement recommandée (+glucides/protéines dans les 30-45min — Ivy 2004)'};
    }
    return MEAL_SPLIT; // Standard 3 repas
  }
  if(meals===4){
    if(isAthlete){
      // Athlète 4 repas : collation sportive 10% (250-400 kcal — fenêtre anabolique Ivy 2004)
      return{pctBreak:.25,pctLunch:.35,pctSnack:.10,pctDinner:.30,
        note:'4 repas athlète : collation post-entraînement 10% des calories — mix glucides:protéines 3:1 optimal (Ivy 2004, ISSN 2017)'};
    }
    return{pctBreak:.25,pctLunch:.38,pctSnack:.07,pctDinner:.30,
      note:'4 repas : petite collation équilibrée en milieu d\'après-midi'};
  }
  if(meals>=5){
    if(isAthlete){
      // Athlète 5 repas : 2 collations (pré + post entraînement)
      return{pctBreak:.20,pctLunch:.30,pctSnack:.15,pctDinner:.25,
        note:'5 repas athlète : 2 collations (pré + post entraînement) — fractionner l\'apport protéique toutes les 3-4h pour maximiser la synthèse protéique (Moore 2012, Churchward-Venne 2016)'};
    }
    return{pctBreak:.22,pctLunch:.33,pctSnack:.12,pctDinner:.28,
      note:'5 repas : fractionnement modéré — améliore satiété et glycémie'};
  }
  return MEAL_SPLIT;
}
window.getMealSplit=getMealSplit;
var DAY_NAMES=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
var SHOPPING=[
  {cat:'FRÉQUENCE',items:[
    {id:'daily',name:'Tous les jours',desc:'Produits frais quotidiens'},
    {id:'2x_week',name:'2-3x par semaine',desc:'Mix frais et conservation'},
    {id:'weekly',name:'1x par semaine',desc:'Courses groupées'},
    {id:'biweekly',name:'Toutes les 2 semaines',desc:'Stock et surgelés'}
  ]},
  {cat:'MAGASINS HABITUELS',items:[
    {id:'supermarket',name:'Supermarché',desc:'Carrefour, Marjane, Auchan...'},
    {id:'market',name:'Marché / Souk',desc:'Fruits, légumes, viande fraîche'},
    {id:'organic',name:'Bio / Spécialisé',desc:'Magasin bio, diététique'},
    {id:'online',name:'En ligne',desc:'Livraison à domicile'},
    {id:'bulk',name:'Grossiste',desc:'Costco, Atacadao, gros volumes'}
  ]},
  {cat:'BUDGET ALIMENTAIRE',items:[
    {id:'budget_low',name:'Économique',desc:'Je fais attention au budget'},
    {id:'budget_mid',name:'Moyen',desc:'Bon rapport qualité-prix'},
    {id:'budget_high',name:'Confort',desc:'Qualité sans restriction'}
  ]},
  {cat:'PRÉFÉRENCES PRODUITS',items:[
    {id:'pref_fresh',name:'Produits frais',desc:'Viande, poisson, légumes fraîs'},
    {id:'pref_frozen',name:'Surgelés acceptés',desc:'Légumes, poisson, fruits surgelés'},
    {id:'pref_canned',name:'Conserves acceptées',desc:'Légumineuses, thon, tomates'},
    {id:'pref_batch',name:'Batch cooking',desc:'Je prépare en avance pour la semaine'},
    {id:'pref_quick',name:'Repas rapides',desc:'Moins de 15 min de préparation'}
  ]}
];
var STAPLES=[
  {cat:'PROTÉINES',items:['Blancs de poulet','Oeufs (x30)','Thon en conserve','Boeuf haché 5%','Saumon / Pavés poisson','Lentilles corail','Pois chiches','Dinde escalopes','Fromage blanc 0%','Whey protéine']},
  {cat:'GLUCIDES',items:['Riz basmati','Flocons d\'avoine','Pain complet','Patate douce','Pâtes complètes','Semoule','Quinoa','Bananes','Dattes']},
  {cat:'LIPIDES',items:['Huile d\'olive extra vierge','Avocat','Amandes / Noix','Beurre de cacahuète','Graines de chia','Graines de lin']},
  {cat:'LÉGUMES',items:['Brocoli','Courgettes','Épinards','Tomates','Oignon','Ail','Poivrons','Carottes','Salade verte','Concombre']},
  {cat:'ESSENTIELS',items:['Sel, poivre, cumin, paprika','Citrons','Miel','Sauce soja','Vinaigre balsamique','Yaourt nature','Lait (vache/amande)','Café / Thé vert']}
];

// ─── Make constants globally available ───
window.STEPS = STEPS;
window.ACTIVITIES = ACTIVITIES;
window.TRAINS = TRAINS;
window.SLEEPS = SLEEPS;
window.GOALS = GOALS;
window.RATIOS = RATIOS;
window.COOK_LEVELS = COOK_LEVELS;
window.ALLERGIES = ALLERGIES;
window.INTOLERANCES = INTOLERANCES;
window.REGIMES = REGIMES;
window.CUISINES = CUISINES;
window.CUISINE_FLAGS = CUISINE_FLAGS;
window.MEDICAL = MEDICAL;
window.MEDICAL_ADVICE = MEDICAL_ADVICE;
window.MEAL_SPLIT = MEAL_SPLIT;
window.DAY_NAMES = DAY_NAMES;
window.SHOPPING = SHOPPING;
window.STAPLES = STAPLES;

// ─── NEW CONSTANTS ───
var ALCOHOL_DB = [
  {name:'Bière (33cl)', kcal:150, gl:13, alc:5},
  {name:'Bière forte (33cl)', kcal:200, gl:16, alc:8},
  {name:'Vin rouge (15cl)', kcal:125, gl:4, alc:13},
  {name:'Vin blanc (15cl)', kcal:120, gl:4, alc:12},
  {name:'Vin rosé (15cl)', kcal:115, gl:4, alc:11},
  {name:'Champagne (15cl)', kcal:120, gl:5, alc:12},
  {name:'Vodka (4cl)', kcal:95, gl:0, alc:40},
  {name:'Whisky (4cl)', kcal:105, gl:0, alc:40},
  {name:'Rhum (4cl)', kcal:100, gl:0, alc:40},
  {name:'Gin (4cl)', kcal:95, gl:0, alc:40},
  {name:'Tequila (4cl)', kcal:100, gl:0, alc:40},
  {name:'Mojito (25cl)', kcal:220, gl:26, alc:10},
  {name:'Margarita (25cl)', kcal:280, gl:18, alc:13},
  {name:'Piña Colada (25cl)', kcal:320, gl:40, alc:10},
  {name:'Spritz (20cl)', kcal:170, gl:12, alc:8},
  {name:'Cidre (25cl)', kcal:120, gl:15, alc:5},
  {name:'Pastis (2cl+eau)', kcal:60, gl:2, alc:45},
  {name:'Sangria (25cl)', kcal:200, gl:24, alc:8}
];
window.ALCOHOL_DB = ALCOHOL_DB;

var ALCOHOL_FREQS = [
  {id:'never', name:'Jamais', icon:'🚫', desc:'0 verre/semaine'},
  {id:'rarely', name:'Rarement', icon:'🍷', desc:'1-2 verres/semaine'},
  {id:'weekly', name:'Régulièrement', icon:'🍺', desc:'3-7 verres/semaine'},
  {id:'daily', name:'Quotidien', icon:'⚠', desc:'7+ verres/semaine'}
];
window.ALCOHOL_FREQS = ALCOHOL_FREQS;

var FOOD_HABITS_MEALS = [
  {val:2, name:'2 repas', desc:'Jeûne intermittent'},
  {val:3, name:'3 repas', desc:'PDJ, déjeuner, dîner'},
  {val:4, name:'4 repas', desc:'3 repas + 1 collation'},
  {val:5, name:'5 repas', desc:'3 repas + 2 collations'}
];
window.FOOD_HABITS_MEALS = FOOD_HABITS_MEALS;

var EATING_LOCATIONS = [
  {id:'home', name:'Maison', desc:'Je cuisine chez moi', icon:'🏠'},
  {id:'office', name:'Bureau', desc:'Je mange au travail', icon:'🏢'},
  {id:'mix', name:'Mix', desc:'Moitié-moitié', icon:'🔄'}
];
window.EATING_LOCATIONS = EATING_LOCATIONS;

var BODY_ZONES = ['Poitrine','Dos','Épaules','Bras','Abdominaux','Jambes','Fessiers','Cardio'];
window.BODY_ZONES = BODY_ZONES;

var SPORT_GOALS = [
  {id:'muscle', name:'Prise de muscle', desc:'Hypertrophie et force', icon:'💪'},
  {id:'endurance', name:'Endurance', desc:'Cardio et stamina', icon:'🫀'},
  {id:'flexibility', name:'Souplesse', desc:'Mobilité et stretching', icon:'🧘'},
  {id:'weightloss', name:'Perte de poids', desc:'Brûler des calories', icon:'🔥'},
  {id:'general', name:'Forme générale', desc:'Un peu de tout', icon:'⚡'},
  {id:'shred', name:'Sèche', desc:'Perdre du gras, garder le muscle', icon:'🔥'}
];
window.SPORT_GOALS = SPORT_GOALS;

var SPORT_LEVELS = [
  {id:'beginner', name:'Débutant', desc:'< 6 mois', factor:0.7},
  {id:'intermediate', name:'Intermédiaire', desc:'6 mois - 2 ans', factor:1.0},
  {id:'advanced', name:'Avancé', desc:'2+ ans', factor:1.3}
];
window.SPORT_LEVELS = SPORT_LEVELS;

// ─── CROSSFIT CONSTANTS ───
var CROSSFIT_LEVELS = [
  {id: 'scaled', name: 'Scaled', desc: 'Débutant / Adapté — Mouvements simplifiés, charges légères', icon: '🟢'},
  {id: 'inter', name: 'Intermédiaire', desc: 'Mouvements maîtrisés — Charges modérées', icon: '🟡'},
  {id: 'rx', name: 'RX (Prescrit)', desc: 'Standards compétition — Charges et mouvements avancés', icon: '🔴'}
];
window.CROSSFIT_LEVELS = CROSSFIT_LEVELS;

var CF_STANDARDS = {
  clean: { m: [40, 60, 80], f: [25, 40, 55] },
  snatch: { m: [30, 50, 70], f: [20, 35, 50] },
  deadlift: { m: [60, 90, 110], f: [40, 60, 80] },
  squat_clean: { m: [40, 60, 80], f: [25, 40, 55] },
  thruster: { m: [30, 43, 60], f: [20, 30, 43] },
  front_squat: { m: [40, 60, 80], f: [25, 40, 55] },
  overhead_squat: { m: [25, 40, 60], f: [15, 25, 40] },
  push_press: { m: [30, 43, 60], f: [20, 30, 43] },
  power_clean: { m: [40, 60, 80], f: [25, 40, 55] },
  hang_clean: { m: [35, 55, 75], f: [20, 35, 50] },
  shoulder_to_oh: { m: [30, 43, 60], f: [20, 30, 43] },
  back_squat: { m: [50, 70, 100], f: [30, 50, 70] },
  sumo_dl_hp: { m: [35, 50, 70], f: [20, 35, 50] },
  pullups: { scaled: 'Ring Rows', inter: 'Pull-ups', rx: 'Chest-to-bar' },
  muscle_ups_bar: { scaled: 'Pull-ups + Dips', inter: 'Bar Muscle-ups (tentatives)', rx: 'Bar Muscle-ups' },
  muscle_ups_ring: { scaled: 'Ring Rows + Ring Dips', inter: 'Ring Muscle-ups (tentatives)', rx: 'Ring Muscle-ups' },
  hspu: { scaled: 'Pike Push-ups', inter: 'HSPU (abmat)', rx: 'Strict/Kipping HSPU' },
  handstand_walk: { scaled: 'Bear Crawl 2x distance', inter: 'Wall Walk', rx: 'Handstand Walk' },
  pistols: { scaled: 'Air Squats', inter: 'Pistols (assistés)', rx: 'Pistols' },
  toes_to_bar: { scaled: 'Hanging Knee Raises', inter: 'Toes-to-bar (kipping)', rx: 'Toes-to-bar (strict ou kipping)' },
  rope_climb: { scaled: 'Rope Pull (allongé)', inter: '1 Rope Climb', rx: 'Legless Rope Climb' },
  double_unders: { scaled: 'Single Unders (x3)', inter: 'Double Unders', rx: 'Double Unders' },
  box_jump: { scaled: 'Step-ups 50cm', inter: 'Box Jump 50/60cm', rx: 'Box Jump 60/75cm' },
  wall_ball: { scaled: '4/6kg → 2.7/3m', inter: '6/9kg → 2.7/3m', rx: '9/14kg → 3/3.5m' },
  kb_swing: { scaled: '12/16kg', inter: '16/24kg', rx: '24/32kg' },
  burpee: { scaled: 'Burpees (step)', inter: 'Burpees', rx: 'Burpees over bar / Burpee Box Jump Over' },
  row_cal: { cal: [12, 15, 20] },
  assault_bike: { cal: [8, 12, 15] }
};
window.CF_STANDARDS = CF_STANDARDS;

var CF_1RM_LIFTS = [
  {key: 'clean', name: 'Clean (Épaulé)', icon: '🏋️', placeholder: 'kg', desc: 'Votre meilleur clean à 1 rep'},
  {key: 'snatch', name: 'Snatch (Arraché)', icon: '🏋️', placeholder: 'kg', desc: 'Votre meilleur snatch à 1 rep'},
  {key: 'deadlift', name: 'Deadlift (Soulevé de terre)', icon: '🦬', placeholder: 'kg', desc: 'Votre meilleur deadlift'},
  {key: 'front_squat', name: 'Front Squat', icon: '🦵', placeholder: 'kg', desc: 'Votre meilleur front squat'},
  {key: 'back_squat', name: 'Back Squat', icon: '🦵', placeholder: 'kg', desc: 'Votre meilleur back squat'},
  {key: 'push_press', name: 'Push Press / Shoulder to OH', icon: '💪', placeholder: 'kg', desc: 'Votre meilleur push press'},
  {key: 'overhead_squat', name: 'Overhead Squat', icon: '🏋️', placeholder: 'kg', desc: 'Votre meilleur OHS'},
  {key: 'thruster', name: 'Thruster', icon: '🔥', placeholder: 'kg', desc: 'Votre meilleur thruster'}
];
window.CF_1RM_LIFTS = CF_1RM_LIFTS;

// Returns the working weight for a given movement
// Uses user's 1RM if available, otherwise falls back to CF_STANDARDS
function getCFWorkingWeight(standardsKey, percentage) {
  var s = window.S;
  var sexKey = s.sex === 'homme' ? 'm' : 'f';
  var lvlIdx = s.crossfitLevel === 'scaled' ? 0 : s.crossfitLevel === 'inter' ? 1 : 2;

  // Check if user has a 1RM for this lift
  if (s.crossfit1RM && s.crossfit1RM[standardsKey]) {
    var rm = s.crossfit1RM[standardsKey];
    if (percentage) return Math.round(rm * percentage / 100);
    // For WODs, use typical percentages by level
    var wodPct = lvlIdx === 0 ? 0.55 : lvlIdx === 1 ? 0.65 : 0.75;
    return Math.round(rm * wodPct);
  }

  // Fallback to CF_STANDARDS
  var standards = window.CF_STANDARDS;
  if (standards && standards[standardsKey] && standards[standardsKey][sexKey]) {
    return standards[standardsKey][sexKey][lvlIdx];
  }
  return '?';
}
window.getCFWorkingWeight = getCFWorkingWeight;

var CF_WODS = [
  {
    day: 1, name: 'FORGE',
    haltero: { name: 'Clean Complex', desc: '1 Power Clean + 1 Hang Clean + 1 Full Clean', scheme: 'E2MOM 12min — Build to heavy complex', weights: 'clean' },
    wod: { name: 'FORGE', type: 'AMRAP 15', movements: [
      {name: 'Thrusters', reps: 10, weight: 'thruster'},
      {name: 'Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'},
      {name: 'Box Jumps', reps: 14, gymnastics: 'box_jump'},
      {name: 'Cal Row', reps: null, special: 'row_cal'}
    ], notes: 'Score = rounds + reps. Pacing: 70-80% effort.' },
    gym: { name: 'Skill: Kipping / Butterfly Pull-ups', drills: ['3x5 Strict Pull-ups (lesté si possible)', '3x8 Kipping Pull-ups (focus rythme)', '3x Max Butterfly attempts', '2min Hollow Hold accumulation'] }
  },
  {
    day: 2, name: 'THUNDER',
    haltero: { name: 'Snatch Progression', desc: '1 Hang Snatch + 1 Power Snatch + 1 OHS', scheme: 'Every 90s x 10 — Build progressively', weights: 'snatch' },
    wod: { name: 'THUNDER', type: 'For Time (cap 18min)', movements: [
      {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
      {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
      {name: 'Power Snatches', reps: 30, weight: 'snatch'},
      {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
      {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'}
    ], notes: 'Chipper style. Briser les séries: Walls 25-25 / Snatches 10-10-10.' },
    gym: { name: 'Skill: Handstand', drills: ['5x30s Wall-Facing Handstand Hold', '3x5 Wall Walk (slow control)', '5x3m Handstand Walk attempts (ou Bear Crawl)', 'Finisher: 3x20 Shoulder Taps en position HS'] }
  },
  {
    day: 3, name: 'BLITZ',
    haltero: { name: 'Front Squat', desc: 'Front Squat 5-5-3-3-1-1', scheme: '15min — Build to 1RM or heavy single', weights: 'front_squat' },
    wod: { name: 'BLITZ', type: '5 Rounds For Time (cap 20min)', movements: [
      {name: 'Deadlift', reps: 12, weight: 'deadlift'},
      {name: 'Burpees over bar', reps: 9, gymnastics: 'burpee'},
      {name: 'Pull-ups', reps: 6, gymnastics: 'pullups'},
      {name: 'Assault Bike Cal', reps: null, special: 'assault_bike'}
    ], notes: 'Sprint les burpees, steady sur les deadlifts. Grip management!' },
    gym: { name: 'Skill: Ring Muscle-ups', drills: ['3x5 Strict Ring Dips', '3x3 Kipping Swing to Hip (ring)', '5x1-3 Ring Muscle-up attempts', '3x8 Banded Transitions (si nécessaire)', 'Accumulate 1min L-sit on rings'] }
  },
  {
    day: 4, name: 'MAYHEM',
    haltero: { name: 'Clean & Jerk', desc: '1 Squat Clean + 1 Push Jerk + 1 Split Jerk', scheme: 'E2MOM 14min — Build to heavy', weights: 'squat_clean' },
    wod: { name: 'MAYHEM TRIBUTE', type: 'AMRAP 20', movements: [
      {name: 'KB Swings', reps: 15, gymnastics: 'kb_swing'},
      {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
      {name: 'Thrusters', reps: 9, weight: 'thruster'},
      {name: 'Bar Muscle-ups', reps: 3, gymnastics: 'muscle_ups_bar'}
    ], notes: 'Inspiré de Mayhem. Respirez sur les KB swings, explosive sur les BMU.' },
    gym: { name: 'Skill: HSPU / Pike Push-ups', drills: ['3x5 Strict HSPU (ou pike push-ups)', '3x5 Kipping HSPU (ou abmat)', 'Max unbroken HSPU test', '3x15 DB Strict Press léger (épaule santé)'] }
  },
  {
    day: 5, name: 'INFERNO',
    haltero: { name: 'Overhead Squat', desc: 'OHS 3-3-3-2-2-1', scheme: '15min — Mobilité + force overhead', weights: 'overhead_squat' },
    wod: { name: 'INFERNO', type: 'For Time (cap 25min)', movements: [
      {name: 'Cal Row', reps: null, special: 'row_cal', note: '40/35 cal'},
      {name: 'Power Cleans', reps: 30, weight: 'power_clean'},
      {name: 'Toes-to-bar', reps: 30, gymnastics: 'toes_to_bar'},
      {name: 'Push Press', reps: 30, weight: 'push_press'},
      {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
      {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'}
    ], notes: 'Descending energy. Partez contrôlé sur le row, finissez fort.' },
    gym: { name: 'Skill: Rope Climb + Core', drills: ['3x1-2 Rope Climb (legless si RX)', '4x8 Strict Toes-to-bar', '3x15 GHD Sit-ups (ou AbMat)', '3x20 Hollow Rocks'] }
  },
  {
    day: 6, name: 'ENDURE',
    haltero: { name: 'Hang Snatch + Snatch Pull', desc: '1 Hang Snatch + 2 Snatch Pulls', scheme: 'E90s x 8 sets', weights: 'snatch' },
    wod: { name: 'ENDURE', type: '3 Rounds For Time (cap 22min)', movements: [
      {name: 'Assault Bike Cal', reps: null, special: 'assault_bike', note: '20/15 cal'},
      {name: 'Hang Cleans', reps: 10, weight: 'hang_clean'},
      {name: 'HSPU', reps: 8, gymnastics: 'hspu'},
      {name: 'Pistols', reps: 12, gymnastics: 'pistols'}
    ], notes: 'Pacing crucial. Ne partez pas en sprint sur le bike.' },
    gym: { name: 'Skill: Pistol Squat + Balance', drills: ['3x5 Pistols (par jambe, assisté si nécessaire)', '3x10 Bulgarian Split Squats', '3x30s Single Leg Balance (yeux fermés)', '3x8 Box Pistols'] }
  },
  {
    day: 7, name: 'TITAN',
    haltero: { name: 'Back Squat', desc: 'Back Squat 5x5 @75-85%', scheme: 'Every 3min x 5 sets', weights: 'back_squat' },
    wod: { name: 'TITAN', type: 'EMOM 24 (6 rounds)', movements: [
      {name: 'Min 1: Deadlift', reps: 8, weight: 'deadlift'},
      {name: 'Min 2: Burpees', reps: 10, gymnastics: 'burpee'},
      {name: 'Min 3: Wall Balls', reps: 15, gymnastics: 'wall_ball'},
      {name: 'Min 4: Cal Row', reps: null, special: 'row_cal'}
    ], notes: 'EMOM = chaque minute commence un nouveau mouvement. Max effort, max rest.' },
    gym: { name: 'Skill: Bar Muscle-up Progression', drills: ['3x5 Strict Pull-ups (supination)', '3x5 Kipping Pull-ups agressifs', '5x1-3 Bar Muscle-up (ou transitions)', '3x8 Chest-to-bar Pull-ups'] }
  },
  {
    day: 8, name: 'PHOENIX',
    haltero: { name: 'Push Jerk', desc: '1 Push Press + 1 Push Jerk + 1 Split Jerk', scheme: 'E2MOM 12min', weights: 'push_press' },
    wod: { name: 'PHOENIX', type: 'For Time (cap 16min)', movements: [
      {name: 'Thrusters', reps: 21, weight: 'thruster'},
      {name: 'Pull-ups', reps: 21, gymnastics: 'pullups'},
      {name: 'Thrusters', reps: 15, weight: 'thruster'},
      {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'},
      {name: 'Thrusters', reps: 9, weight: 'thruster'},
      {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}
    ], notes: 'Hommage au FRAN. Format 21-15-9 classique. Allez-y !' },
    gym: { name: 'Skill: Double Unders', drills: ['5x30s Max Double Unders', '3x50 Single-Single-Double drill', '3min unbroken DU attempt', 'Finisher: 3x Tabata DU (20s on / 10s off)'] }
  },
  {
    day: 9, name: 'STORM',
    haltero: { name: 'Snatch Balance + OHS', desc: '3 Snatch Balance + 2 OHS', scheme: 'Every 2:30 x 6 sets', weights: 'overhead_squat' },
    wod: { name: 'STORM', type: 'AMRAP 12', movements: [
      {name: 'Sumo DL High Pull', reps: 8, weight: 'sumo_dl_hp'},
      {name: 'KB Swings', reps: 12, gymnastics: 'kb_swing'},
      {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
      {name: 'Toes-to-bar', reps: 8, gymnastics: 'toes_to_bar'}
    ], notes: 'Pace constant. Objectif: 5-6 rounds minimum.' },
    gym: { name: 'Skill: L-sit + Core Strength', drills: ['5x10s L-sit on Parallettes', '3x12 V-ups', '3x15 GHD Hip Extensions', '3x20s Ring Support Hold', 'Accumulate 2min Plank on Rings'] }
  },
  {
    day: 10, name: 'NEMESIS',
    haltero: { name: 'Squat Clean Complex', desc: '2 Squat Cleans + 1 Front Squat + 1 Jerk', scheme: 'E2:30 x 6 — Heavy intent', weights: 'squat_clean' },
    wod: { name: 'NEMESIS', type: '4 Rounds For Time (cap 20min)', movements: [
      {name: 'Shoulder to Overhead', reps: 10, weight: 'shoulder_to_oh'},
      {name: 'Rope Climb', reps: 2, gymnastics: 'rope_climb'},
      {name: 'Double Unders', reps: 50, gymnastics: 'double_unders'},
      {name: 'Assault Bike Cal', reps: null, special: 'assault_bike'}
    ], notes: 'Mouvement élégant sur le S2OH. Cordes = technique > vitesse.' },
    gym: { name: 'Skill: Ring Dip + Transition', drills: ['3x8 Ring Dips (strict)', '3x5 Ring Dips (kipping)', '5x Transition drills (false grip)', '3x5 Ring Push-ups (deep)', '2x15 Band Pull-aparts (épaule santé)'] }
  },
  {
    day: 11, name: 'VALOR',
    haltero: { name: 'Power Clean + Front Squat', desc: '2 Power Cleans + 3 Front Squats', scheme: 'E2MOM 10min', weights: 'power_clean' },
    wod: { name: 'VALOR', type: 'For Time (cap 15min)', movements: [
      {name: 'Power Cleans', reps: 15, weight: 'power_clean'},
      {name: 'Burpee Box Jump Over', reps: 15, gymnastics: 'burpee'},
      {name: 'Power Cleans', reps: 12, weight: 'power_clean'},
      {name: 'Burpee Box Jump Over', reps: 12, gymnastics: 'burpee'},
      {name: 'Power Cleans', reps: 9, weight: 'power_clean'},
      {name: 'Burpee Box Jump Over', reps: 9, gymnastics: 'burpee'}
    ], notes: 'Format descendant 15-12-9. Explosivité requise.' },
    gym: { name: 'Skill: Toes-to-bar Efficiency', drills: ['3x10 Kipping Toes-to-bar', '3x5 Strict Toes-to-bar', 'Max unbroken TTB test', '3x15 V-ups (transfer de skill)', '3x20 Hollow Rocks'] }
  },
  {
    day: 12, name: 'LEGACY',
    haltero: { name: 'Snatch from Blocks', desc: 'Snatch from knee + 1 OHS', scheme: 'Every 90s x 10', weights: 'snatch' },
    wod: { name: 'LEGACY (Hero WOD style)', type: 'For Time (cap 30min)', movements: [
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'Wall Balls', reps: 30, gymnastics: 'wall_ball'},
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'KB Swings', reps: 30, gymnastics: 'kb_swing'},
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'Thrusters', reps: 20, weight: 'thruster'},
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'}
    ], notes: 'Hero WOD. Endurance + mental. Respectez le pacing du run.' },
    gym: { name: 'Skill: Wall Walk + HS Hold', drills: ['5x1 Wall Walk (slow, controlled)', '5x20s HS Hold (wall facing)', '3x5m HS Walk attempts', '3x10 Strict Press léger (shoulder prep)'] }
  },
  {
    day: 13, name: 'APEX',
    haltero: { name: 'Deadlift', desc: 'Deadlift 3-3-3-1-1-1', scheme: '15min — Build to heavy single', weights: 'deadlift' },
    wod: { name: 'APEX', type: 'EMOM 20 (4 rounds)', movements: [
      {name: 'Min 1: Hang Snatch', reps: 5, weight: 'snatch'},
      {name: 'Min 2: HSPU', reps: 8, gymnastics: 'hspu'},
      {name: 'Min 3: Assault Bike Cal', reps: null, special: 'assault_bike'},
      {name: 'Min 4: Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'},
      {name: 'Min 5: Rest', reps: null, note: 'REST'}
    ], notes: '4 rounds of 5-min blocks. Le rest est votre ami. Sprint chaque minute.' },
    gym: { name: 'Skill: Rope + Gymnastics Combo', drills: ['3x1-2 Rope Climb', '3x3 Ring Muscle-up (ou transitions)', '3x5 Strict Ring Dips', '3x30s Ring Support Hold', 'Accumulate 90s L-sit'] }
  },
  {
    day: 14, name: 'REDEMPTION',
    haltero: { name: 'Hang Clean + Jerk', desc: '1 Hang Clean + 2 Jerks (1 push + 1 split)', scheme: 'E2MOM 12min', weights: 'hang_clean' },
    wod: { name: 'REDEMPTION', type: 'AMRAP 18', movements: [
      {name: 'Deadlift', reps: 8, weight: 'deadlift'},
      {name: 'Bar Muscle-ups', reps: 4, gymnastics: 'muscle_ups_bar'},
      {name: 'Front Squats', reps: 6, weight: 'front_squat'},
      {name: 'Wall Balls', reps: 12, gymnastics: 'wall_ball'},
      {name: 'Cal Row', reps: null, special: 'row_cal'}
    ], notes: 'Dernier WOD du cycle. Tout donner. Games mindset.' },
    gym: { name: 'Skill: Competition Prep', drills: ['2x Max Unbroken Pull-ups', '2x Max Unbroken HSPU', '2x Max Unbroken Double Unders', 'Finisher: 3 min AMRAP Burpees (test yourself)'] }
  }
];
window.CF_WODS = window.CF_WODS_FULL || CF_WODS; // Use 100 WODs if available, fallback to 14 inline

// ─── GLOBAL STATE ───
window.S = {
  // Routing
  view: 'auth', // 'auth','authRegister','dashboard','nutrition','sport'
  authError: '',
  // Nutrition wizard
  nStep: 0, sex: null, age: 28, weight: 75, height: 175,
  activity: null, train: [], sleep: null, medical: [], goal: null,
  cookLevel: 2, whey: null, allergies: [], intolerances: [],
  regime: 0, excluded: '', cuisines: [0],
  shopFreq: null, shopStores: [], shopBudget: null, shopPrefs: [],
  weekPlan: null, selectedDay: 0, modalRecipe: null, showList: false,
  // Food habits
  mealsPerDay: 3, eatingLocation: null, mealPrepTime: null,
  snacking: null,
  // Alcohol
  alcoholFreq: null, alcoholTypes: [],
  // Weight
  targetWeight: null, weightHistory: [],
  // Food habits extended
  hydration: null, bodyZones: {},
  // Photos
  photoFront: null, photoBack: null, strongZones: [], weakZones: [],
  // Sport
  sStep: 0, sportGoals: [], sportLevel: null, sportDays: 3,
  sportSessionDuration: null, // '45min','1h','1h15','1h30'
  sportFocus: {}, sportProgram: null, selectedSportDay: 0,
  sportModalExercise: null,
  // Cross Training
  sportType: null, // 'musculation', 'crossfit', 'running', 'hyrox'
  crossfitLevel: null, // 'scaled', 'inter', 'rx'
  crossfitProgram: null, // generated daily program
  selectedCrossfitDay: 0,
  crossfitCycleWeek: 1,
  crossfitWeek: 1,
  // Cycle menstruel (femmes uniquement)
  cycleLength: 28,
  lastPeriodDate: null,
  cycleTracking: false,
  // Grossesse
  pregnant: false,
  pregnancyWeek: null,
  prePregnancyWeight: null,
  dueDate: null,
  // Supplémentation
  creatine: false,
  creatineDose: 0,
  supplements: [],
  // Musculation weight tracking
  musculationWeights: {},  // { exerciseName: { weight: Number, type: 'barre'|'haltere'|'machine'|'kb'|'bodyweight' } },
  muscuWeek: 1, muscuCycle: 1, muscuProgramStart: null, sportSplashDone: false,
  // CrossFit 1RM
  crossfit1RM: {},  // { 'clean': 80, 'snatch': 60, 'deadlift': 140, ... } in kg
  // Strength assessment profile
  muscuStrengthProfile: {},  // { 'bench_press': 60, 'squat': 80, 'deadlift': 100, ... }
  // Running
  runningLevel: null,        // 'beginner','intermediate','advanced'
  runningGoal: null,         // '5k','10k','semi','marathon','trail'
  runningDays: 3,            // 3-6
  runningPace: null,         // current pace in min/km (e.g., '5:30')
  runningVO2max: null,       // estimated VO2max
  runningProgram: null,
  runningWeek: 1,
  selectedRunDay: 0,
  // Hyrox
  hyroxLevel: null,          // 'beginner','intermediate','advanced','pro'
  hyroxGoal: null,           // 'finish','sub90','sub75','sub60','podium'
  hyroxDays: 4,              // 3-6
  hyroxProgram: null,
  hyroxWeek: 1,
  selectedHyroxDay: 0,
  hyroxBenchmarks: {},        // {skiErg: time, sled_push: time, etc.}
  // Padel
  padelLevel: null, padelGoal: null, padelDays: 3, padelProgram: null, padelWeek: 1, selectedPadelDay: 0, padelProfile: {},
  // Golf
  golfLevel: null, golfGoal: null, golfDays: 3, golfProgram: null, golfWeek: 1, selectedGolfDay: 0, golfHandicap: null, golfProfile: {},
  // Triathlon / IRONMAN
  triathlonGoal: null, triathlonLevel: null, triathlonWeak: null,
  triathlonSwimPace: null, triathlonBikePace: null, triathlonRunPace: null,
  triathlonProgram: null, triathlonWeek: 1, selectedTriDay: 0
};

// ─── MUSCULATION KEY EXERCISES (Strength Assessment) ───
var MUSCU_KEY_EXERCISES = [
  {key: 'bench_press', name: 'Développé couché', muscle: 'Poitrine', icon: '🏋️', unit: 'kg', desc: 'Charge max pour 1 série de 8-10 reps'},
  {key: 'squat', name: 'Squat', muscle: 'Jambes', icon: '🦵', unit: 'kg', desc: 'Charge max pour 1 série de 8-10 reps'},
  {key: 'deadlift', name: 'Soulevé de terre', muscle: 'Dos', icon: '🦬', unit: 'kg', desc: 'Charge max pour 1 série de 8-10 reps'},
  {key: 'overhead_press', name: 'Développé militaire', muscle: 'Épaules', icon: '💪', unit: 'kg', desc: 'Charge max debout, 8-10 reps'},
  {key: 'barbell_row', name: 'Rowing barre', muscle: 'Dos', icon: '🏋️', unit: 'kg', desc: 'Charge pour 8-10 reps propres'},
  {key: 'barbell_curl', name: 'Curl barre', muscle: 'Biceps', icon: '💪', unit: 'kg', desc: 'Charge pour 10-12 reps'},
  {key: 'hip_thrust', name: 'Hip Thrust', muscle: 'Fessiers', icon: '🍑', unit: 'kg', desc: 'Charge pour 10-12 reps'},
  {key: 'leg_press', name: 'Presse à cuisses', muscle: 'Jambes', icon: '🦵', unit: 'kg', desc: 'Charge totale pour 10-12 reps'}
];
window.MUSCU_KEY_EXERCISES = MUSCU_KEY_EXERCISES;

// ─── ESTIMATE WORKING WEIGHTS FROM STRENGTH PROFILE ───
function getMusculationWeight(exerciseName, sets, reps) {
  var s = window.S;
  var profile = s.muscuStrengthProfile || {};

  var exerciseLower = exerciseName.toLowerCase();
  var baseWeight = null;
  var ratio = 1.0;

  // Chest exercises: based on bench press
  if (/développé couché|bench|développé.*haltère|écarté|chest press/i.test(exerciseLower)) {
    baseWeight = profile.bench_press;
    if (/haltère|dumbbell/i.test(exerciseLower)) ratio = 0.4;
    else if (/incliné/i.test(exerciseLower)) ratio = 0.85;
    else if (/écarté/i.test(exerciseLower)) ratio = 0.3;
  }
  // Back exercises: based on deadlift/row
  else if (/rowing|tirage|pull/i.test(exerciseLower)) {
    baseWeight = profile.barbell_row || (profile.deadlift ? profile.deadlift * 0.6 : null);
    if (/haltère/i.test(exerciseLower)) ratio = 0.5;
    else if (/vertical|lat/i.test(exerciseLower)) ratio = 0.8;
  }
  else if (/soulevé|deadlift/i.test(exerciseLower)) {
    baseWeight = profile.deadlift;
    if (/roumain|romanian/i.test(exerciseLower)) ratio = 0.7;
  }
  // Shoulder exercises: based on overhead press
  else if (/militaire|overhead|épaule|latéral|press.*épaule/i.test(exerciseLower)) {
    baseWeight = profile.overhead_press;
    if (/latéral|élévation/i.test(exerciseLower)) ratio = 0.25;
    else if (/arnold/i.test(exerciseLower)) ratio = 0.7;
  }
  // Leg exercises: based on squat
  else if (/squat|fente|lunge|presse|leg/i.test(exerciseLower)) {
    baseWeight = profile.squat;
    if (/presse/i.test(exerciseLower)) { baseWeight = profile.leg_press || (profile.squat ? profile.squat * 2.5 : null); ratio = 1; }
    else if (/fente|lunge|bulgare/i.test(exerciseLower)) ratio = 0.5;
    else if (/extension|curl.*jambe/i.test(exerciseLower)) ratio = 0.4;
  }
  // Biceps: based on curl
  else if (/curl|biceps/i.test(exerciseLower)) {
    baseWeight = profile.barbell_curl;
    if (/haltère|marteau|concentré/i.test(exerciseLower)) ratio = 0.5;
  }
  // Glutes: based on hip thrust
  else if (/hip.*thrust|fessier|glute/i.test(exerciseLower)) {
    baseWeight = profile.hip_thrust;
    if (/kick|abduction/i.test(exerciseLower)) ratio = 0.2;
  }

  if (!baseWeight) return null;

  // Adjust for rep range (higher reps = lower weight)
  var repStr = reps || '8-12';
  var targetReps = parseInt(repStr) || 10;
  var repFactor = 1.0;
  if (targetReps <= 5) repFactor = 1.15;
  else if (targetReps <= 8) repFactor = 1.0;
  else if (targetReps <= 12) repFactor = 0.85;
  else repFactor = 0.7;

  // Adjust for level
  var levelFactor = s.sportLevel === 'beginner' ? 0.7 : s.sportLevel === 'advanced' ? 1.1 : 1.0;

  var suggested = Math.round(baseWeight * ratio * repFactor * levelFactor / 2.5) * 2.5;
  return Math.max(suggested, 0);
}
window.getMusculationWeight = getMusculationWeight;

// ─── SETS/REPS/REST GENERATOR (NSCA, Schoenfeld 2017) ───
function generateExerciseSets(exercise, userWeight, sportGoals, sportLevel, week, muscuStrengthProfile) {
  var style = 'hypertrophy';
  if (sportGoals && sportGoals.indexOf('shred') !== -1) style = 'shred';
  else if (sportGoals && sportGoals.indexOf('muscle') !== -1) style = 'hypertrophy';
  else if (sportGoals && sportGoals.indexOf('endurance') !== -1) style = 'endurance';
  var baseWeight = 0;
  if (muscuStrengthProfile && window.getMusculationWeight) {
    baseWeight = getMusculationWeight(exercise, muscuStrengthProfile, sportLevel) || 0;
  }
  var schemes = {
    strength: {sets:[{reps:5,pct:0.85,rest:'3min'},{reps:5,pct:0.85,rest:'3min'},{reps:3,pct:0.90,rest:'4min'},{reps:3,pct:0.90,rest:'4min'},{reps:1,pct:0.95,rest:'5min'}],inc:2.5,note:'Force pure — repos complets entre les séries'},
    hypertrophy: {sets:[{reps:12,pct:0.65,rest:'90s'},{reps:10,pct:0.70,rest:'90s'},{reps:8,pct:0.75,rest:'90s'},{reps:8,pct:0.75,rest:'2min'}],inc:1.25,note:'Hypertrophie — contrôlez la descente (3s excentrique)'},
    endurance: {sets:[{reps:15,pct:0.55,rest:'45s'},{reps:15,pct:0.55,rest:'45s'},{reps:12,pct:0.60,rest:'45s'},{reps:12,pct:0.60,rest:'30s'}],inc:1.0,note:'Endurance — enchaînez, gardez la tension'},
    shred: {sets:[{reps:15,pct:0.50,rest:'30s'},{reps:12,pct:0.55,rest:'30s'},{reps:12,pct:0.55,rest:'30s'},{reps:10,pct:0.60,rest:'45s'}],inc:0,note:'Sèche — tempo rapide, volume max, repos min 🔥'}
  };
  var scheme = schemes[style] || schemes.hypertrophy;
  var weekBonus = ((week || 1) - 1) * scheme.inc;
  var levelMult = sportLevel === 'beginner' ? 0.7 : sportLevel === 'intermediate' ? 0.85 : 1.0;
  var setsToUse = sportLevel === 'beginner' ? scheme.sets.slice(0, 3) : scheme.sets;
  var isBodyweight = !exercise.eq || /poids|aucun|bodyweight/i.test(exercise.eq);
  return {
    style: style, totalSets: setsToUse.length,
    sets: setsToUse.map(function(set, idx) {
      var w = 0;
      if (!isBodyweight && baseWeight > 0) { w = Math.round((baseWeight * set.pct * levelMult + weekBonus) / 2.5) * 2.5; w = Math.max(w, 5); }
      return {setNumber: idx + 1, reps: set.reps, weight: w, rest: set.rest, isBodyweight: isBodyweight};
    }),
    note: scheme.note, weeklyIncrement: scheme.inc, week: week || 1
  };
}
window.generateExerciseSets = generateExerciseSets;

// ─── CYCLE MENSTRUEL ───
var CYCLE_PHASES = [
  {
    id: 'menstruation',
    name: 'Menstruation',
    icon: '\uD83D\uDD34',
    days: [1, 5],
    desc: 'Phase de r\u00e8gles \u2014 \u00c9nergie basse, privil\u00e9gier le repos actif',
    nutritionTips: [
      'Augmenter le fer (viande rouge, \u00e9pinards, lentilles)',
      'Magn\u00e9sium (chocolat noir, bananes, amandes)',
      'Om\u00e9ga-3 anti-inflammatoires (poisson gras, noix)',
      'Hydratation renforc\u00e9e (+0.5L/jour)',
      '\u00c9viter exc\u00e8s de sel (r\u00e9tention d\'eau)'
    ],
    sportTips: [
      'Privil\u00e9gier yoga, marche, stretching',
      'R\u00e9duire l\'intensit\u00e9 de 30-40%',
      '\u00c9couter son corps, ne pas forcer',
      'Exercices doux de mobilit\u00e9'
    ],
    calorieAdjust: 0,
    macroAdjust: null,
    intensityFactor: 0.6
  },
  {
    id: 'follicular',
    name: 'Phase folliculaire',
    icon: '\uD83D\uDFE1',
    days: [6, 13],
    desc: '\u00c9nergie montante \u2014 P\u00e9riode id\u00e9ale pour progresser',
    nutritionTips: [
      'P\u00e9riode optimale pour les glucides complexes',
      'Prot\u00e9ines pour la r\u00e9cup\u00e9ration musculaire',
      'Augmenter l\u00e9g\u00e8rement les calories (+5%)',
      'Favoriser les aliments riches en vitamine B'
    ],
    sportTips: [
      'Meilleure phase pour la force et l\'intensit\u00e9',
      'Id\u00e9al pour battre des records personnels',
      'Entra\u00eenement haute intensit\u00e9 recommand\u00e9',
      'Augmenter charges et volume'
    ],
    calorieAdjust: 0.05,
    macroAdjust: {g: 0.03, p: 0, l: -0.03},
    intensityFactor: 1.1
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    icon: '\uD83D\uDFE2',
    days: [14, 16],
    desc: 'Pic d\'\u00e9nergie \u2014 Performance maximale',
    nutritionTips: [
      'Pic d\'\u00e9nergie : profitez-en !',
      'Apport prot\u00e9ique optimal',
      'Hydratation importante',
      'Antioxydants (fruits rouges, l\u00e9gumes color\u00e9s)'
    ],
    sportTips: [
      'Phase de performance maximale',
      'HIIT, sprint, charges lourdes',
      'Attention aux articulations (laxit\u00e9 ligamentaire)',
      '\u00c9chauffement soign\u00e9 obligatoire'
    ],
    calorieAdjust: 0.05,
    macroAdjust: {g: 0.02, p: 0.02, l: -0.04},
    intensityFactor: 1.2
  },
  {
    id: 'luteal',
    name: 'Phase lut\u00e9ale',
    icon: '\uD83D\uDFE0',
    days: [17, 28],
    desc: '\u00c9nergie descendante \u2014 Adapter et r\u00e9cup\u00e9rer',
    nutritionTips: [
      'Augmenter les calories (+10%) \u2014 m\u00e9tabolisme acc\u00e9l\u00e9r\u00e9',
      'Plus de lipides sains pour l\'\u00e9quilibre hormonal',
      'Magn\u00e9sium et vitamine B6 contre le SPM',
      'R\u00e9duire caf\u00e9ine et sucres raffin\u00e9s',
      'Aliments riches en tryptophane (dinde, banane) pour le moral'
    ],
    sportTips: [
      'R\u00e9duire l\'intensit\u00e9 progressivement',
      'Privil\u00e9gier endurance douce, natation, yoga',
      '\u00c9viter les exercices \u00e0 impact \u00e9lev\u00e9 en fin de phase',
      'S\u00e9ances plus courtes mais r\u00e9guli\u00e8res'
    ],
    calorieAdjust: 0.10,
    macroAdjust: {g: -0.05, p: 0.02, l: 0.03},
    intensityFactor: 0.8
  }
];
window.CYCLE_PHASES = CYCLE_PHASES;

function getCurrentCyclePhase() {
  var s = window.S;
  if (!s.cycleTracking || !s.lastPeriodDate || s.sex !== 'femme') return null;

  var start = new Date(s.lastPeriodDate);
  var now = new Date();
  var diffDays = Math.floor((now - start) / 86400000);
  var dayInCycle = ((diffDays % s.cycleLength) + s.cycleLength) % s.cycleLength + 1;

  for (var i = 0; i < CYCLE_PHASES.length; i++) {
    var phase = CYCLE_PHASES[i];
    var phaseStart = Math.round(phase.days[0] * s.cycleLength / 28);
    var phaseEnd = Math.round(phase.days[1] * s.cycleLength / 28);
    if (dayInCycle >= phaseStart && dayInCycle <= phaseEnd) {
      return {
        phase: phase,
        dayInCycle: dayInCycle,
        dayInPhase: dayInCycle - phaseStart + 1,
        daysLeftInPhase: phaseEnd - dayInCycle,
        nextPhase: CYCLE_PHASES[(i + 1) % CYCLE_PHASES.length]
      };
    }
  }
  return { phase: CYCLE_PHASES[3], dayInCycle: dayInCycle, dayInPhase: 1, daysLeftInPhase: 0, nextPhase: CYCLE_PHASES[0] };
}
window.getCurrentCyclePhase = getCurrentCyclePhase;

// ─── GROSSESSE ───
var PREGNANCY_TRIMESTERS = [
  {
    id: 'trimester1',
    name: '1er Trimestre',
    icon: '\uD83E\uDD30',
    weeks: [1, 13],
    desc: 'Mise en place \u2014 Naus\u00e9es possibles, fatigue',
    calorieExtra: 0,
    proteinExtra: 0,
    weightGainRange: [0.5, 2.0],
    nutritionTips: [
      'Acide folique : 400-800 \u00b5g/jour (pr\u00e9vention spina bifida) \u2014 commencer d\u00e8s le projet de grossesse',
      'Fer : 27 mg/jour (doublement du volume sanguin)',
      'Pas de calories suppl\u00e9mentaires n\u00e9cessaires au 1er trimestre',
      'Fractionner les repas en 5-6 petites prises (anti-naus\u00e9es)',
      '\u00c9viter : alcool, tabac, poisson cru, fromage au lait cru, charcuterie',
      'Gingembre et citron contre les naus\u00e9es',
      'Hydratation : 2.3L/jour minimum'
    ],
    sportTips: [
      'Activit\u00e9 physique mod\u00e9r\u00e9e recommand\u00e9e (ACOG 2020)',
      'Marche, natation, yoga pr\u00e9natal',
      '\u00c9viter : sports de contact, plong\u00e9e, altitude > 2500m',
      'Arr\u00eater si : saignements, vertiges, douleurs, contractions',
      'Intensit\u00e9 : pouvoir tenir une conversation',
      '150 min/semaine d\'activit\u00e9 mod\u00e9r\u00e9e (OMS)'
    ],
    intensityFactor: 0.6,
    forbiddenExercises: ['burpees', 'jumping jacks', 'box jumps', 'abdominaux classiques', 'soulev\u00e9 de terre lourd']
  },
  {
    id: 'trimester2',
    name: '2\u00e8me Trimestre',
    icon: '\uD83E\uDD30',
    weeks: [14, 27],
    desc: '\u00c9nergie retrouv\u00e9e \u2014 P\u00e9riode la plus confortable',
    calorieExtra: 340,
    proteinExtra: 25,
    weightGainRange: [4.0, 6.5],
    nutritionTips: [
      '+340 kcal/jour par rapport aux besoins pr\u00e9-grossesse (ACOG)',
      '+25g de prot\u00e9ines/jour (total : 1.1g/kg)',
      'Calcium : 1000 mg/jour (d\u00e9veloppement osseux du b\u00e9b\u00e9)',
      'Vitamine D : 600-1000 UI/jour',
      'DHA (om\u00e9ga-3) : 200-300 mg/jour (d\u00e9veloppement c\u00e9r\u00e9bral)',
      'Fer : 27 mg/jour \u2014 associer \u00e0 la vitamine C',
      'Fibres et hydratation contre la constipation'
    ],
    sportTips: [
      'P\u00e9riode id\u00e9ale pour l\'activit\u00e9 physique',
      'Natation (excellent : porte le poids), marche, v\u00e9lo d\'appartement',
      'Yoga pr\u00e9natal, Pilates adapt\u00e9',
      '\u00c9viter la position allong\u00e9e sur le dos apr\u00e8s 20 SA',
      'Exercices du plancher pelvien (Kegel) quotidiens',
      'Renforcement musculaire l\u00e9ger (pas de charges lourdes)'
    ],
    intensityFactor: 0.65,
    forbiddenExercises: ['crunch', 'relev\u00e9 de jambes allong\u00e9', 'burpees', 'jumping jacks', 'sprint', 'HIIT intense']
  },
  {
    id: 'trimester3',
    name: '3\u00e8me Trimestre',
    icon: '\uD83E\uDD31',
    weeks: [28, 42],
    desc: 'Derni\u00e8re ligne droite \u2014 Repos et pr\u00e9paration',
    calorieExtra: 450,
    proteinExtra: 25,
    weightGainRange: [4.0, 6.0],
    nutritionTips: [
      '+450 kcal/jour par rapport aux besoins pr\u00e9-grossesse (ACOG)',
      'Maintenir prot\u00e9ines \u00e9lev\u00e9es (1.1g/kg + 25g)',
      'Fer : risque accru d\'an\u00e9mie \u2014 contr\u00f4le sanguin',
      'Magn\u00e9sium : 350-400 mg/jour (crampes, contractions)',
      'Om\u00e9ga-3 DHA : maintenir 200-300 mg/jour',
      'Petits repas fr\u00e9quents (estomac compress\u00e9)',
      'Limiter le sel si \u0153d\u00e8mes'
    ],
    sportTips: [
      'R\u00e9duire l\'intensit\u00e9 progressivement',
      'Marche douce, natation, aquagym pr\u00e9natale',
      'Exercices de respiration et relaxation',
      'Plancher pelvien : essentiel pour l\'accouchement',
      '\u00c9tirements doux quotidiens',
      '\u00c9couter son corps \u2014 s\'arr\u00eater si fatigue'
    ],
    intensityFactor: 0.4,
    forbiddenExercises: ['tout exercice \u00e0 impact', 'position allong\u00e9e sur le dos', 'charges', 'cardio intense', 'exercices d\'\u00e9quilibre']
  }
];
window.PREGNANCY_TRIMESTERS = PREGNANCY_TRIMESTERS;

var PREGNANCY_WEIGHT_GAIN = [
  { bmiRange: [0, 18.5], category: 'Insuffisant', totalGainMin: 12.5, totalGainMax: 18.0, weeklyGainT2T3: [0.44, 0.58] },
  { bmiRange: [18.5, 25], category: 'Normal', totalGainMin: 11.5, totalGainMax: 16.0, weeklyGainT2T3: [0.35, 0.50] },
  { bmiRange: [25, 30], category: 'Surpoids', totalGainMin: 7.0, totalGainMax: 11.5, weeklyGainT2T3: [0.23, 0.33] },
  { bmiRange: [30, 100], category: 'Ob\u00e9sit\u00e9', totalGainMin: 5.0, totalGainMax: 9.0, weeklyGainT2T3: [0.17, 0.27] }
];
window.PREGNANCY_WEIGHT_GAIN = PREGNANCY_WEIGHT_GAIN;

function getPregnancyTrimester() {
  var s = window.S;
  if (!s.pregnant || !s.pregnancyWeek) return null;
  var week = s.pregnancyWeek;
  for (var i = 0; i < PREGNANCY_TRIMESTERS.length; i++) {
    var t = PREGNANCY_TRIMESTERS[i];
    if (week >= t.weeks[0] && week <= t.weeks[1]) {
      return {
        trimester: t,
        week: week,
        trimesterNumber: i + 1,
        weeksLeft: 40 - week,
        progress: Math.round((week / 40) * 100)
      };
    }
  }
  return null;
}
window.getPregnancyTrimester = getPregnancyTrimester;

function getPregnancyWeightGuideline() {
  var s = window.S;
  if (!s.pregnant) return null;
  var bmi = s.prePregnancyWeight ? s.prePregnancyWeight / Math.pow(s.height / 100, 2) : calcBMI();
  var guideline = null;
  for (var i = 0; i < PREGNANCY_WEIGHT_GAIN.length; i++) {
    var pg = PREGNANCY_WEIGHT_GAIN[i];
    if (bmi >= pg.bmiRange[0] && bmi < pg.bmiRange[1]) { guideline = pg; break; }
  }
  if (!guideline) guideline = PREGNANCY_WEIGHT_GAIN[1];
  var week = s.pregnancyWeek || 1;
  var t1Gain = Math.min(week, 13) / 13 * 2.0;
  var t2t3Weeks = Math.max(0, week - 13);
  var expectedGainMin = t1Gain + t2t3Weeks * guideline.weeklyGainT2T3[0];
  var expectedGainMax = t1Gain + t2t3Weeks * guideline.weeklyGainT2T3[1];
  var baseWeight = s.prePregnancyWeight || s.weight;
  return {
    category: guideline.category,
    totalGainMin: guideline.totalGainMin,
    totalGainMax: guideline.totalGainMax,
    expectedWeightMin: Math.round((baseWeight + expectedGainMin) * 10) / 10,
    expectedWeightMax: Math.round((baseWeight + expectedGainMax) * 10) / 10,
    currentExpectedGainMin: Math.round(expectedGainMin * 10) / 10,
    currentExpectedGainMax: Math.round(expectedGainMax * 10) / 10,
    weeklyGainRange: guideline.weeklyGainT2T3
  };
}
window.getPregnancyWeightGuideline = getPregnancyWeightGuideline;

// ─── FORMULAS ───
// ─── POIDS AJUSTÉ POUR LES MACROS (obésité) ───
// Pour IMC > 30, utiliser IBW (Devine) + 40% de l'excédent (ASPEN 2016, ESPEN 2015)
// Évite les recommandations absurdes : ex. 150kg × 2.5g/kg = 375g protéines
// Formule Devine : homme = 50 + 2.3×(taille_pouces-60), femme = 45.5 + 2.3×(taille_pouces-60)
function calcAdjustedWeight(){
  var s=window.S;
  if(!s.weight||!s.height)return s.weight||75;
  var bmi=s.weight/Math.pow(s.height/100,2);
  if(bmi<=30)return s.weight; // Pas d'ajustement si IMC ≤ 30
  var heightInches=s.height/2.54;
  var ibw=s.sex==='homme'?(50+2.3*(heightInches-60)):(45.5+2.3*(heightInches-60));
  ibw=Math.max(40,Math.min(120,ibw));
  if(s.weight<=ibw)return s.weight; // sécurité : ne pas pénaliser si poids < IBW (ne devrait pas arriver si IMC>30)
  return Math.round((ibw+0.4*(s.weight-ibw))*10)/10; // Poids ajusté (Adjusted Body Weight)
}
window.calcAdjustedWeight=calcAdjustedWeight;

function calcBMR(){var s=window.S;if(!s.sex)return 0;if(!s.age||s.age<13||s.age>100)return 0;if(!s.weight||s.weight<30||s.weight>300)return 0;if(!s.height||s.height<100||s.height>230)return 0;if(s.sex==='homme')return Math.round((10*s.weight)+(6.25*s.height)-(5*s.age)+5);return Math.round((10*s.weight)+(6.25*s.height)-(5*s.age)-161)} // Mifflin-St Jeor 1990 (Frankenfield 2005: best accuracy general population)
function calcTDEE(){var s=window.S;if(s.activity===null)return 0;var selectedFactor=ACTIVITIES[s.activity].factor;// Auto-correct activity factor based on sport days (user may have selected wrong level)
// Uses the MAXIMUM of user's selected factor and sport-based estimate
var sportDays=s.sportDays||0;var sportFactor=1.2;if(sportDays>=5)sportFactor=1.725;else if(sportDays>=3)sportFactor=1.55;else if(sportDays>=2)sportFactor=1.375;var effectiveFactor=Math.max(selectedFactor,sportFactor);return calcBMR()*effectiveFactor}
function calcTarget(){var s=window.S;if(s.goal===null)return 0;var tdeeVal=calcTDEE();var base=Math.round(tdeeVal*GOALS[s.goal].mult);if(s.pregnant&&s.sex==='femme'){var tri=getPregnancyTrimester();if(tri){base=Math.round(tdeeVal)+tri.trimester.calorieExtra}// Plancher grossesse : 1800 kcal/j minimum (OMS 2016 — jamais de restriction chez femme enceinte sauf prescription médicale)
base=Math.max(base,1800);return base}var goalKey=GOALS[s.goal].key;// Cap shred deficit to 500 kcal/day (Helms 2014, ACSM — RED-S + muscle loss risk above 500kcal deficit)
// Cap déficit à -500 kcal/j pour shred ET cut (ACSM 2009, Helms 2014 — au-delà : perte musculaire + fatigue chronique)
// IMPORTANT : sans ce cap, un athlète élite (TDEE 3500+) en "cut -15%" pouvait avoir un déficit de 525-700 kcal/j
if((goalKey==='shred'||goalKey==='cut')&&tdeeVal>0){base=Math.max(base,Math.round(tdeeVal-500));}// Cap deficit to 500kcal/day for diabetics (sécurité glycémique)
// Allaitement : +500 kcal/j (ACOG 2022) — priorité sur l'objectif coupe/sèche
if(s.medical&&s.medical.indexOf('allaitement')!==-1){return Math.max(Math.round(tdeeVal)+500,1800);}
// TCA/anorexie : forcer maintenance, bloquer cut/shred (ANAD, IOC 2018 — RED-S prevention)
if(s.medical&&s.medical.indexOf('tca')!==-1){return Math.round(tdeeVal);}
// Adolescent (13-17 ans) : déficit max -300kcal/j (ACSM 2007, IOC 2018 — préservation croissance + pic de masse osseuse)
// Surplus max +300kcal/j en bulk (ACSM adolescent — éviter accumulation graisseuse pendant croissance hormonale)
if(s.age>=13&&s.age<18&&tdeeVal>0){
  var minCalTeen=Math.round(tdeeVal-300);if(base<minCalTeen)base=minCalTeen;
  if(goalKey==='bulk'){var maxCalTeen=Math.round(tdeeVal+300);if(base>maxCalTeen)base=maxCalTeen;}
}
var hasDiabetes=s.medical&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('diabete_t1')!==-1||s.medical.indexOf('prediabete')!==-1);if(hasDiabetes&&tdeeVal>0){var minCal=Math.round(tdeeVal-500);if(base<minCal)base=minCal;}// Ménopause : réduction métabolique ~100 kcal/j (NAMS 2022, Poehlman 1995)
if(s.medical&&s.medical.indexOf('menopause')!==-1){base=Math.max(1200,base-150);} // PMC Menopause 2024: -150-200 kcal/j (perte masse maigre + chute estrogènes)
if(s.sex==='femme'){var cycleInfo=getCurrentCyclePhase();if(cycleInfo&&cycleInfo.phase.calorieAdjust){var adj=cycleInfo.phase.calorieAdjust;// Pendant une sèche/coupe, plafonner l'ajout du cycle à +5% max (préserver le déficit)
if((goalKey==='cut'||goalKey==='shred')&&adj>0.05)adj=0.05;base=Math.round(base*(1+adj));}}var kcalFloor=s.sex==='femme'?1200:1500;base=Math.max(base,kcalFloor);
// Alcool : déduire les calories hebdo/7 du budget calorique journalier pour un calcul réaliste
// Ex : 500 kcal alcool/semaine ÷ 7 = 71 kcal/j que l'on retire de l'objectif alimentaire
// (l'alcool ne nourrit pas : 7kcal/g sans micronutriments, inhibe oxydation des graisses)
if(s.alcoholFreq&&s.alcoholFreq!=='never'&&typeof alcoholWeeklyKcal==='function'){
  var alcDaily=Math.round(alcoholWeeklyKcal()/7);
  if(alcDaily>0){base=Math.max(kcalFloor,base-alcDaily);} // soustraire mais respecter le plancher
}
return base} // ACSM: plancher universel ≥1200 kcal/j (femme) / ≥1500 kcal/j (homme)
function calcMacros(){
  var s=window.S;var c=calcTarget();
  if(!c||s.goal===null)return{g:0,p:0,l:0};
  // Pour les macros g/kg : utiliser le poids ajusté si obèse (ASPEN 2016, ESPEN 2015)
  // Les calories (calcTarget/TDEE) restent basées sur le poids réel
  var bw=calcAdjustedWeight()||75;var goalKey=GOALS[s.goal].key;
  // ─── PROTÉINES (g/kg) — Table complète par sexe, activité et objectif ───
  // Sources : Phillips & Van Loon 2011 (BJSM) | Morton 2018 (BJSM meta-analysis)
  //           Tarnopolsky 2000 (MSSE) : femmes nécessitent ~13% de moins (oestrogène anti-catabolique,
  //           oxydation leucine réduite) | ISSN 2017 | Helms 2014 | EFSA 2012 | IOC 2011
  var ppk=1.8;
  var actFactor=s.activity!==null?ACTIVITIES[s.activity].factor:1.2;
  var isFemale=s.sex==='femme';

  if(goalKey==='maintain'){
    // ─── MAINTIEN — ppk selon activité ET sexe ───
    // Hommes : 1.2 → 2.4 g/kg selon niveau (Phillips & Van Loon 2011, ISSN 2017)
    // Femmes : ~13% de moins (oestrogène anti-catabolique — Tarnopolsky 2000)
    // Sédentaire plancher : OMS 0.83 minimum, EFSA 2012 recommande 1.0-1.2 pour maintien musculaire
    if(actFactor>=1.9){
      ppk=isFemale?2.1:2.4;  // Athlète élite : H=2.4g/kg, F=2.1g/kg (Phillips & Van Loon 2011, Morton 2018)
    } else if(actFactor>=1.725){
      ppk=isFemale?1.6:1.8;  // Très actif : H=1.8, F=1.6 (ISSN 2017)
    } else if(actFactor>=1.55){
      ppk=isFemale?1.4:1.6;  // Modéré : H=1.6, F=1.4
    } else if(actFactor>=1.375){
      ppk=isFemale?1.2:1.4;  // Léger : H=1.4, F=1.2
    } else {
      ppk=isFemale?1.0:1.2;  // Sédentaire : H=1.2, F=1.0 (EFSA 2012 — anti-sarcopénie)
    }

  } else if(goalKey==='bulk'){
    // ─── PRISE DE MASSE — ppk selon activité ET sexe ───
    // Athlète élite : H=2.5g/kg, F=2.2g/kg (objectif hypertrophie maximale — Morton 2018)
    // Base non-élite : H=1.8g/kg, F=1.6g/kg (ISSN 2017)
    if(actFactor>=1.9){
      ppk=isFemale?2.2:2.5;  // Élite bulk : H=2.5, F=2.2 (Morton 2018 BJSM)
    } else if(actFactor>=1.7){
      ppk=isFemale?1.8:2.0;  // Très actif bulk : H=2.0, F=1.8
    } else {
      ppk=isFemale?1.6:1.8;  // Standard bulk : H=1.8, F=1.6 (ISSN 2017)
    }

  } else {
    // ─── SÈCHE / COUPE — protéines hautes, préservation musculaire (Helms 2014) ───
    // Femmes : plancher légèrement plus bas grâce à l'effet anti-catabolique des oestrogènes
    // mais recommandation reste élevée pour la sèche car catabolisme musculaire est le risque principal
    if(goalKey==='shred'){
      // Femmes : valeurs abaissées vs Helms 2014 (compétiteurs) — alignées ISSN 2017 population générale active
      // Hommes : conservent les valeurs élevées (Helms 2014, Morton 2018 confirment pour H)
      ppk=isFemale?1.9:2.5; // Base shred : H=2.5, F=1.9 (ISSN 2017 : 1.6-2.2g/kg femmes actives)
      // Bonus athlète : préservation masse maigre importante
      if(actFactor>=1.9) ppk=isFemale?2.3:3.0;     // Élite shred : H=3.0, F=2.3 (Helms 2014 upper pour H; F limitée)
      else if(actFactor>=1.7) ppk+=isFemale?0.1:0.2; // Très actif : F→2.0g/kg, H→2.7g/kg
      // Cap shred (au-delà : pas de bénéfice supplémentaire — ISSN 2017)
      ppk=Math.min(ppk, actFactor>=1.7?(isFemale?2.3:3.0):(isFemale?2.1:2.7));
    } else {
      // cut — valeurs femmes abaissées pour rester dans la plage ISSN 2017 (1.6-2.2g/kg)
      ppk=isFemale?1.8:2.2; // Base cut : H=2.2, F=1.8 (ISSN 2017)
      if(actFactor>=1.9) ppk=isFemale?2.2:2.8;     // Élite cut : H=2.8, F=2.2
      else if(actFactor>=1.7) ppk+=isFemale?0.1:0.2; // Très actif : F→1.9g/kg, H→2.4g/kg
      ppk=Math.min(ppk, actFactor>=1.7?(isFemale?2.2:2.8):(isFemale?2.0:2.4));
    }
  }
  if(s.train&&Array.isArray(s.train)&&s.train.indexOf(0)!==-1)ppk+=0.1;
  if(s.medical.indexOf('irc')!==-1)ppk=Math.min(ppk,0.6); // KDOQI 2020: 0.55-0.60g/kg CKD 3-5 non-dialysis
  // Vegan/vegetarian: adjust protein for lower DIAAS bioavailability of plant proteins (Messina 2019, ISSN 2017)
  if(s.regime===3)ppk=Math.round(ppk*1.10*10)/10; // Végan: +10% (DIAAS correction — FAO 2013, PMC 2020)
  else if(s.regime===2)ppk=Math.round(ppk*1.10*10)/10; // Végétarien lacto-ovo: +10% (DIAAS correction — FAO 2013, PMC 2020)
  ppk=Math.max(0.8,Math.min(3.5,ppk));
  var pGrams=Math.round(bw*ppk);
  // Pregnancy protein bonus: +25g/day T2+T3 (ACOG 2018, WHO)
  if(s.pregnant){var triP=getPregnancyTrimester();if(triP&&triP.trimester.proteinExtra)pGrams=Math.round(pGrams+triP.trimester.proteinExtra);}
  var pCal=pGrams*4;
  // Fat g/kg (minimum 0.5g/kg for hormonal health)
  var fpk=1.0;
  if(goalKey==='shred')fpk=0.7;else if(goalKey==='cut')fpk=0.85;else if(goalKey==='bulk')fpk=1.1;else fpk=1.0;
  if(s.sex==='femme')fpk+=0.1;
  // Min lipides femme 0.7g/kg (ISSN 2021) — santé hormonale (vs 0.5 homme)
  var lipidMin=s.sex==='femme'?0.7:0.5;
  fpk=Math.max(lipidMin,Math.min(1.5,fpk));
  var lGrams=Math.round(bw*fpk);var lCal=lGrams*9;
  // Carbs fill remaining calories
  var gCal=c-pCal-lCal;
  if(gCal<200){lCal=Math.max(bw*0.5*9,c-pCal-200);lGrams=Math.round(lCal/9);gCal=c-pCal-lCal;if(gCal<200){pCal=c-lCal-200;pGrams=Math.round(pCal/4);gCal=200}}
  var gGrams=Math.max(130,Math.round(gCal/4)); // IOM 2005: min 130g/j (cerveau+SNC)
  // Cap carbs to goal-specific maximum (g/kg) — prevents excessive carb surplus (Helms 2014, ISSN 2017)
  var carbCapGpkg=goalKey==='shred'?3.5:goalKey==='cut'?4.0:goalKey==='bulk'?6.0:5.0;
  var carbCap=Math.round(bw*carbCapGpkg);
  if(gGrams>carbCap){
    // CRITIQUE : redistribuer les calories libérées par le plafond glucides sur les lipides
    // Sans redistribution → sous-alimentation systématique (ex: -229 kcal en bulk, -347 kcal en cut)
    // Priorité : lipides (acides gras essentiels, hormones, vitamines liposolubles) — Helms 2014
    var freedKcalFromCarbCap=(gGrams-carbCap)*4;
    gGrams=carbCap;
    var lipidAbsCap=Math.round(bw*1.5); // plafond absolu lipides 1.5g/kg (ISSN 2017)
    var addableLipidGrams=Math.min(Math.floor(freedKcalFromCarbCap/9), Math.max(0,lipidAbsCap-lGrams));
    if(addableLipidGrams>0){lGrams+=addableLipidGrams;lCal=lGrams*9;
      // Si plafond lipides atteint, redistribuer le reste sur les protéines
      var stillFreedKcal=freedKcalFromCarbCap-(addableLipidGrams*9);
      if(stillFreedKcal>36){var addProt=Math.floor(stillFreedKcal/4);pGrams+=addProt;pCal=pGrams*4;}
    } else {
      // Lipides déjà au max → tout va sur les protéines
      var addProtOnly=Math.floor(freedKcalFromCarbCap/4);pGrams+=addProtOnly;pCal=pGrams*4;
    }
  }
  // Medical adjustments
  for(var i=0;i<s.medical.length;i++){var a=MEDICAL_ADVICE[s.medical[i]];if(a&&a.macroAdj){gGrams=Math.round(gGrams*(1+(a.macroAdj.g||0)));pGrams=Math.round(pGrams*(1+(a.macroAdj.p||0)));lGrams=Math.round(lGrams*(1+(a.macroAdj.l||0)))}}
  // Re-enforce IRC protein cap after all medical adjustments (KDOQI 2020: 0.6g/kg CKD 3-5 non-dialysis)
  if(s.medical.indexOf('irc')!==-1){var maxIrcP=Math.round(bw*0.6);if(pGrams>maxIrcP)pGrams=maxIrcP;}
  // Diabète gestationnel : plafond glucides 175-200g/j (ADA 2023, ACOG 2018)
  if(s.medical&&s.medical.indexOf('diabete_gest')!==-1){var gdCarbMax=Math.min(200,Math.max(175,gGrams));if(gGrams>gdCarbMax)gGrams=gdCarbMax;}
  // Master athlete 60+ : résistance anabolique → leucine seuil 40g/meal (Churchward-Venne 2016, Moore 2015)
  // Augmenter protéines de 10% pour compenser la résistance anabolique (recommandation ESPEN 2019)
  if(s.age>=60&&s.medical.indexOf('irc')===-1){pGrams=Math.max(pGrams,Math.round(bw*1.2));} // ESPEN 2014: plancher 1.2g/kg pour 60+ (résistance anabolique)
  // Apply cycle-phase macro adjustments (only for non-pregnant women with cycle tracking)
  if(!s.pregnant&&s.sex==='femme'&&s.cycleTracking){var cycleM=getCurrentCyclePhase();if(cycleM&&cycleM.phase.macroAdjust){var mAdj=cycleM.phase.macroAdjust;// Small modulations per cycle phase — carb/fat shift, protein stable
gGrams=Math.round(gGrams*(1+(mAdj.g||0)));lGrams=Math.round(lGrams*(1+(mAdj.l||0)));// Never reduce protein during cycle — keep stable
}}
  return{g:Math.max(130,gGrams),p:Math.max(40,pGrams),l:Math.max(20,lGrams),proteinPerKg:ppk,fatPerKg:fpk,carbsPerKg:Math.round(gGrams/bw*10)/10,cyclePhase:(!s.pregnant&&s.sex==='femme'&&s.cycleTracking)?getCurrentCyclePhase():null}
}
function calcBMI(){var s=window.S;var ht=s.height/100;return s.weight/Math.pow(ht,2)}
// OMS : 3 grades d'obésité — prise en charge radicalement différente selon le grade
// Grade 1 (30-34.9) : hygiène de vie | Grade 2 (35-39.9) : suivi spécialisé | Grade 3 (≥40) : chirurgie bariatrique possible (HAS 2022)
function bmiInfo(b){
  if(b<16.0)return{label:'Dénutrition sévère',color:'#1A0050',grade:'D3',note:'Hospitalisation nécessaire (HAS 2019)'};
  if(b<17.0)return{label:'Dénutrition modérée',color:'#1A1070',grade:'D2',note:'Suivi diététique urgent'};
  if(b<18.5)return{label:'Insuffisance pondérale',color:'#1A3A6A',grade:'D1',note:'Augmenter les apports caloriques'};
  if(b<25)return{label:'Poids normal',color:'#1A4A1A',grade:'N',note:'Maintenir les habitudes alimentaires'};
  if(b<30)return{label:'Surpoids',color:'#6A4A1A',grade:'S',note:'Hygiène de vie à améliorer'};
  if(b<35)return{label:'Obésité grade 1',color:'#7A3010',grade:'O1',note:'Suivi médical recommandé (HAS 2022)'};
  if(b<40)return{label:'Obésité grade 2',color:'#8A1A10',grade:'O2',note:'Suivi spécialisé médical obligatoire'};
  return{label:'Obésité grade 3 (morbide)',color:'#5A1010',grade:'O3',note:'Équipe pluridisciplinaire — chirurgie bariatrique discutable (HAS 2022)'}
}

function calcWeightProjection(){
  var s=window.S;
  if(!s.targetWeight||!s.weight||s.targetWeight===s.weight)return null;

  var gaining=s.targetWeight>s.weight;

  // Realistic weekly change based on caloric surplus/deficit
  var tdee=calcTDEE();
  var target=calcTarget();

  // Guard: if TDEE or target not yet calculated, use default rates
  var weeklyChange;
  if(tdee&&target){
    var dailyDiff=target-tdee;
    weeklyChange=(dailyDiff*7)/7700;
  }else{
    weeklyChange=gaining?0.25:-0.4;
  }

  // Clamp to realistic rates
  if(gaining){
    weeklyChange=Math.max(0.1,Math.min(0.4,weeklyChange));
  }else{
    weeklyChange=Math.min(-0.1,Math.max(-1.0,weeklyChange));
  }

  var diff=s.targetWeight-s.weight;
  var weeks=Math.ceil(Math.abs(diff/weeklyChange));
  weeks=Math.max(1,Math.min(weeks,104));

  var data=[];
  for(var w=0;w<=weeks;w++){
    var projected=s.weight+weeklyChange*w;
    var noise=w>0?(Math.sin(w*2.7)*0.3):0;
    projected=Math.round((projected+noise)*10)/10;
    if(gaining&&projected>s.targetWeight)projected=s.targetWeight;
    if(!gaining&&projected<s.targetWeight)projected=s.targetWeight;
    data.push({week:w,weight:projected});
  }

  var td=new Date();td.setDate(td.getDate()+weeks*7);
  return{weeks:weeks,months:Math.round(weeks/4.3),targetDate:td,weeklyData:data,weeklyChange:weeklyChange};
}

function alcoholWeeklyKcal(){
  var total=0;
  window.S.alcoholTypes.forEach(function(at){
    var drink=ALCOHOL_DB.find(function(d){return d.name===at.type});
    if(drink)total+=drink.kcal*at.freq;
  });
  return total;
}

// ─── HYDRATATION PERSONNALISÉE ───
// Base : 35 ml/kg/jour (EFSA 2010) + bonus activité physique (ACSM 2007)
// Hommes : ANC 3.7L/j total (dont 2.5L boissons) | Femmes : ANC 2.7L/j total (dont 2L boissons)
function calcHydration(){
  var s=window.S;
  if(!s.weight)return null;
  var base=Math.round(s.weight*35); // 35 ml/kg/j de base (EFSA 2010)
  var actBonus=0; // bonus lié à l'activité physique (par séance)
  if(s.activity!==null){
    var factor=ACTIVITIES[s.activity].factor;
    if(factor>=1.9)actBonus=1500;      // Athlète élite: +1.5L/j
    else if(factor>=1.725)actBonus=1000; // Très actif: +1L/j
    else if(factor>=1.55)actBonus=750;   // Modérément actif: +750ml/j
    else if(factor>=1.375)actBonus=500;  // Léger: +500ml/j
  }
  // Ajustement grossesse : +300ml/j (OMS 2020)
  var pregnancyBonus=s.pregnant?300:0;
  // Ajustement allaitement : +700ml/j (EFSA 2010, ANSES 2021)
  var allaitBonus=(s.medical&&s.medical.indexOf('allaitement')!==-1)?700:0;
  var total=base+actBonus+pregnancyBonus+allaitBonus;
  total=Math.ceil(total/100)*100; // arrondir à 100ml
  var minFloor=s.sex==='femme'?2000:2500; // minimums EFSA
  total=Math.max(total,minFloor);
  return{
    ml:total,
    liters:Math.round(total/100)/10,
    base:base,
    actBonus:actBonus,
    perSportHour:600, // 500-750ml/heure d'effort (ACSM 2007)
    tips:[
      'Urines jaune pâle = bonne hydratation',
      actBonus>0?'Ajoutez 500-750ml par heure d\'entraînement':'Buvez régulièrement, sans attendre la soif',
      s.pregnant?'+300ml/j recommandé en grossesse (OMS)':null,
      (s.medical&&s.medical.indexOf('allaitement')!==-1)?'+700ml/j supplémentaires pendant l\'allaitement (ANSES 2021)':null
    ].filter(Boolean)
  };
}
window.calcHydration=calcHydration;

// ─── CIBLE FIBRES ALIMENTAIRES PERSONNALISÉE ───
// Base : 25g/j (femme) / 35g/j (homme) — ANSES 2016, IOM 2005
// Ajustements médicaux : ADA 2023 (diabète), NICE 2021 (IRC), FODMAP (SII)
function calcFiberTarget(){
  var s=window.S;
  var base=s.sex==='homme'?35:25; // IOM 2005: hommes 38g, femmes 25g (ajusté ANSES 2016)
  var adjustments=[];
  var hasDiab=s.medical&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('diabete_t1')!==-1||s.medical.indexOf('prediabete')!==-1);
  if(hasDiab){base=Math.max(base,38);adjustments.push('Diabète : fibres solubles ≥ 38g/j (ADA 2023) — ralentissent absorption glucose');}
  if(s.medical&&s.medical.indexOf('nash')!==-1){base=Math.max(base,35);adjustments.push('NASH : fibres ≥ 35g/j pour réduire stéatose hépatique (ESPEN 2016)');}
  if(s.medical&&s.medical.indexOf('cholesterol')!==-1){base=Math.max(base,30);adjustments.push('Hypercholestérolémie : fibres solubles (avoine, psyllium) réduisent LDL (AHA 2019)');}
  // SII (FODMAP) : limiter en phase aiguë, fibres solubles uniquement
  if(s.medical&&s.medical.indexOf('sii')!==-1){base=Math.min(base,20);adjustments.push('SII : max 20g/j en phase d\'exclusion FODMAP — fibres solubles uniquement (NICE 2021)');}
  // IRC : limiter les fibres riches en potassium (légumineuses, fruits secs)
  if(s.medical&&s.medical.indexOf('irc')!==-1){base=Math.min(base,25);adjustments.push('IRC : éviter fibres riches en potassium (légumineuses, fruits secs) — KDOQI 2020');}
  // 60+ : transit, microbiote, prévention cancer colorectal
  if(s.age>=60&&!adjustments.length){base=Math.max(base,30);adjustments.push('60+ : ≥ 30g/j pour microbiote et transit (EFSA 2017)');}
  return{
    target:base,
    adjustments:adjustments,
    sources:[
      'Légumineuses (lentilles, pois chiches) : 8-10g/100g',
      'Graines de chia : 35g/100g | Lin : 27g/100g',
      'Légumes verts : brocoli, épinards, artichaut',
      'Fruits entiers (pas en jus) : poire, pomme, framboises',
      'Céréales complètes : avoine, quinoa, pain complet'
    ]
  };
}
window.calcFiberTarget=calcFiberTarget;

window.calcBMR=calcBMR; window.calcTDEE=calcTDEE; window.calcTarget=calcTarget;
window.calcMacros=calcMacros; window.calcBMI=calcBMI; window.bmiInfo=bmiInfo;
window.calcWeightProjection=calcWeightProjection; window.alcoholWeeklyKcal=alcoholWeeklyKcal;

// ─── RECIPE FILTERING ───
function getPool(t){if(t==='breakfast')return window.breakfast;if(t==='lunch')return window.lunch;if(t==='snack')return window.snack;return window.dinner}
function filterRecipes(pool,type){
  var s=window.S;
  var r=pool.slice();
  r=r.filter(function(x){return x.lv<=s.cookLevel+1});
  if(type==='snack'&&!s.whey)r=r.filter(function(x){return!x.w});
  if(s.allergies.length>0&&s.allergies.indexOf('Aucune')===-1){
    r=r.filter(function(x){
      var ing=(x.i+' '+x.tags.join(' ')).toLowerCase();
      for(var a=0;a<s.allergies.length;a++){
        var al=s.allergies[a].toLowerCase();
        if(al==='fruits \u00e0 coque'){var nc=ing.replace(/noix de coco|noix de muscade/g,'');if((/amande|noix|noisette|cajou|pistache|pecan|macadamia/).test(nc))return false;}
        if(al==='arachides'&&(/arachide|cacahu[e\u00e8]te/).test(ing))return false;
        if(al==='oeufs'&&(/oeuf|\u0153uf/).test(ing))return false;
        if(al==='poisson'&&(/saumon|thon|cabillaud|dorade|sardine|maquereau|poisson|anchois|merlu|truite|sole|lotte|morue/).test(ing))return false;
        if(al==='crustac\u00e9s'&&(/crevette|crustac|homard|crabe|gambas/).test(ing))return false;
        if(al==='soja'&&(/soja|tofu|edamame/).test(ing))return false;
        if(al==='lait/produits laitiers'){var dl=ing.replace(/lait de coco|lait d.amande|lait d.avoine|lait de soja|lait de riz|beurre de cacahu/g,'');if((/lait|fromage|yaourt|beurre|cr\u00e8me|ricotta|mozzarella|parmesan|emmental|feta|cottage|skyr|labneh|k\u00e9fir|whey/).test(dl))return false;}
        if(al==='gluten/bl\u00e9'){var gl=ing.replace(/galette de riz|farine de riz|farine de sarrasin|p\u00e2te miso/g,'');if((/pain|bl\u00e9|farine|p\u00e2te|seigle|couscous|semoule|tortilla|wrap|naan|galette|cr\u00eape|pancake|muffin/).test(gl))return false;}
        if(al==='sésame'&&(/sésame/).test(ing))return false;
        if(al==='moutarde'&&(/moutarde/).test(ing))return false;
      }return true;
    });
  }
  if(s.intolerances.length>0&&s.intolerances.indexOf('Aucune')===-1){
    r=r.filter(function(x){
      var ing=(x.i+' '+x.tags.join(' ')).toLowerCase();
      for(var t=0;t<s.intolerances.length;t++){
        var it=s.intolerances[t].toLowerCase();
        if(it==='lactose'&&(/lait|fromage|yaourt|beurre|crème|ricotta|cottage|whey/).test(ing))return false;
        if(it==='gluten'&&(/pain|blé|farine|pâte|avoine|seigle|couscous|semoule/).test(ing))return false;
        if(it==='fructose'&&(/miel|pomme|poire|mangue|cerise|figue|datte/).test(ing))return false;
        if(it==='histamine'&&(/thon|saumon fumé|fromage|tomate|épinard|avocat|soja/).test(ing))return false;
      }return true;
    });
  }
  // Diabetics: soft-filter high-GI ingredients (prioritize low-GI sources — ADA 2023)
  var hasDiab=s.medical&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('diabete_t1')!==-1||s.medical.indexOf('prediabete')!==-1);
  if(hasDiab){var highGIban=/pain blanc|baguette|croissant|brioche|corn flakes|rice krispies|galette de mais|sirop de glucose|sucre blanc|bonbon|soda|jus de fruit|dattes|confiture|miel|riz blanc gluant/;var lowGIpool=r.filter(function(x){var i=(x.i+' '+x.tags.join(' ')).toLowerCase();return!highGIban.test(i)});if(lowGIpool.length>=3)r=lowGIpool;} // only filter if enough recipes remain
  if(s.regime===1)r=r.filter(function(x){var i=(x.i+' '+x.tags.join(' ')).toLowerCase();return!(/poulet|boeuf|bœuf|veau|dinde|agneau|kefta|steak|entrecôte|filet mignon/).test(i)});
  if(s.regime===2)r=r.filter(function(x){var i=(x.i+' '+x.tags.join(' ')).toLowerCase();return!(/poulet|boeuf|bœuf|veau|dinde|agneau|kefta|steak|saumon|thon|crevette|cabillaud|dorade|sardine|maquereau|poisson/).test(i)});
  if(s.regime===3){var veganBan=/poulet|boeuf|veau|dinde|agneau|canard|kefta|steak|saumon|thon|crevette|cabillaud|sardine|maquereau|dorade|sole|lotte|morue|gambas|poisson|poulpe|oeuf|fromage|ricotta|feta|parmesan|mozzarella|cottage|emmental|skyr|labneh|yaourt|beurre|miel|whey/;r=r.filter(function(x){var i=(x.i+' '+x.tags.join(' ')).toLowerCase();if(veganBan.test(i))return false;if(/lait/.test(i)&&!/lait de coco|lait d.amande|lait d.avoine|lait de soja|lait de riz/.test(i))return false;return true});}
  if(s.excluded&&s.excluded.trim()){var excl=s.excluded.toLowerCase().split(',').map(function(str){return str.trim()}).filter(Boolean);r=r.filter(function(x){var i=(x.i+' '+x.tags.join(' ')).toLowerCase();for(var e=0;e<excl.length;e++){if(i.indexOf(excl[e])!==-1)return false}return true})}
  if(s.cuisines.indexOf(0)===-1&&s.cuisines.length>0){var flags=[];for(var c=0;c<s.cuisines.length;c++){var co=CUISINES[s.cuisines[c]];if(co&&CUISINE_FLAGS[co.name])flags.push(CUISINE_FLAGS[co.name])}if(flags.length>0)r=r.filter(function(x){return flags.indexOf(x.f)!==-1})}
  return r;
}
function pickRecipe(pool,targetK,used){if(!pool||!pool.length)return{n:'Repas libre',k:targetK,p:Math.round(targetK*0.3/4),g:Math.round(targetK*0.4/4),l:Math.round(targetK*0.3/9),f:0,lv:1,i:'Adaptez selon vos pr\u00e9f\u00e9rences',st:[],w:0,tags:[]};var av=pool.filter(function(r){return!used.has(r.n)});if(!av.length)av=pool.slice();av.sort(function(a,b){return Math.abs(a.k-targetK)-Math.abs(b.k-targetK)});var top=av.slice(0,Math.min(5,av.length));var p=top[Math.floor(Math.random()*top.length)];if(p)used.add(p.n);return p||{n:'Repas libre',k:targetK,p:0,g:0,l:0,f:0,lv:1,i:'',st:[],w:0,tags:[]}}
function generateWeek(){var s=window.S;var c=calcTarget(),plan=[];var uB=new Set,uL=new Set,uS=new Set,uD=new Set;var pB=filterRecipes(getPool('breakfast'),'breakfast'),pL=filterRecipes(getPool('lunch'),'lunch'),pS=filterRecipes(getPool('snack'),'snack'),pD=filterRecipes(getPool('dinner'),'dinner');var pSW=pS.filter(function(r){return r.w}),pSN=pS.filter(function(r){return!r.w});var split=getMealSplit();var meals=s.mealsPerDay||3;for(var d=0;d<7;d++){var bT=Math.round(c*split.pctBreak),lT=Math.round(c*split.pctLunch),sT=Math.round(c*split.pctSnack),dT=Math.round(c*split.pctDinner);var bR=pickRecipe(pB,bT,uB),lR=pickRecipe(pL,lT,uL),sR=null,dR=null;
// Snack : généré seulement si mealsPerDay >= 4 et split > 0
if(meals>=4&&sT>0){if(s.whey&&pSW.length>0&&d%2===0)sR=pickRecipe(pSW,sT,uS);else if(pSN.length>0)sR=pickRecipe(pSN,sT,uS);else sR=pickRecipe(pS,sT,uS);}
// Dîner : généré seulement si mealsPerDay >= 3 (pas pour jeûne intermittent 2 repas)
if(meals>=3&&dT>0)dR=pickRecipe(pD,dT,uD);
plan.push({breakfast:bR,lunch:lR,snack:sR,dinner:dR})}return plan}
function swapMeal(di,slot){var s=window.S;var pool=filterRecipes(getPool(slot),slot);var cur=s.weekPlan[di][slot];var av=pool.filter(function(r){return r.n!==cur.n});if(!av.length)return;s.weekPlan[di][slot]=av[Math.floor(Math.random()*av.length)];if(typeof window.render==='function')window.render()}

window.getPool = getPool;
window.filterRecipes = filterRecipes;
window.pickRecipe = pickRecipe;
window.generateWeek = generateWeek;
window.swapMeal = swapMeal;

// ─── SUPPLEMENTS DATABASE (Grade A evidence ONLY) ───
// Only supplements with overwhelming scientific evidence + personalized to user needs
var SUPPLEMENTS_DB = [
  {id:'whey',name:'Whey Prot\u00e9ine',icon:'\uD83E\uDD5B',desc:'Atteindre l\'objectif prot\u00e9ique quotidien',evidence:'ISSN 2017 \u2014 Niveau A (700+ \u00e9tudes)',grade:'A',
    condition:function(s){return s.whey===1;}, // Only if user explicitly wants whey
    unnecessary_if:'Inutile si vous atteignez vos prot\u00e9ines via l\'alimentation seule',
    dosageCalc:function(s){var d=s.weight>80?35:25;return{dose:d,unit:'g/prise',timing:'Post-entra\u00eenement ou petit-d\u00e9jeuner',note:'Objectif total : '+Math.round(s.weight*1.8)+'g prot/jour (alimentation + whey)'};}},
  {id:'creatine',name:'Cr\u00e9atine Monohydrate',icon:'\uD83D\uDC8A',desc:'Force, masse musculaire, r\u00e9cup\u00e9ration',evidence:'ISSN 2017 \u2014 Niveau A (500+ \u00e9tudes, le suppl\u00e9ment le plus \u00e9tudi\u00e9)',grade:'A',
    condition:function(s){if(s.pregnant||s.age<18)return false;if(s.medical&&s.medical.indexOf('irc')!==-1)return false;var goals=s.sportGoals||[];return s.activity!==null&&s.activity>=2&&(goals.indexOf('muscle')!==-1||goals.indexOf('shred')!==-1);},
    unnecessary_if:'Non n\u00e9cessaire si objectif uniquement endurance/cardio sans musculation',
    dosageCalc:function(s){return{dose:'3-5',unit:'g/jour',timing:'Apr\u00e8s l\'entra\u00eenement avec glucides',note:'Tous les jours y compris repos. Pas de phase de charge n\u00e9cessaire'};}},
  {id:'vitamine_d',name:'Vitamine D3',icon:'\u2600\uFE0F',desc:'75% des Europ\u00e9ens sont carenc\u00e9s',evidence:'Endocrine Society 2011 \u2014 Recommandation forte',grade:'A',
    condition:function(){return true;},
    unnecessary_if:'V\u00e9rifiez par prise de sang (objectif 40-60 ng/mL)',
    dosageCalc:function(s){
      // Endocrine Society 2011 : obèse (IMC>30) = séquestration D3 dans tissu adipeux → 2-3× les besoins
      var bmi=s.weight&&s.height?s.weight/Math.pow(s.height/100,2):22;
      var d=2000;
      if(bmi>30)d=4000; // Endocrine Society 2011 : obèse → 6000 UI correction, 4000 UI maintenance
      else if(bmi>25)d=2500; // Surpoids léger : légère séquestration
      if(s.age>70)d=Math.max(d,3000); // 70+ : synthèse cutanée réduite de 75% (Holick 2007)
      else if(s.age>50)d=Math.max(d,2500); // 50-70 : synthèse réduite
      return{dose:d,unit:'UI/jour',timing:'Petit-d\u00e9jeuner avec repas gras',note:'Dosage sanguin recommand\u00e9 (objectif 40-60 ng/mL). Obésité : D3 séquestrée dans tissu adipeux, besoins × 2-3 (Endocrine Society 2011). Associer à Vitamine K2 (MK-7) si ≥50 ans — prévient calcifications artérielles (Plaza 2021).'};}},
  {id:'omega3',name:'Om\u00e9ga-3 (EPA/DHA)',icon:'\uD83D\uDC1F',desc:'Anti-inflammatoire, c\u0153ur, cognition',evidence:'AHA 2019 \u2014 Recommandation',grade:'A',
    condition:function(s){return s.allergies.indexOf('Poisson')===-1&&s.allergies.indexOf('Crustac\u00e9s')===-1;},
    unnecessary_if:'Inutile si vous mangez du poisson gras 2-3x/semaine (saumon, sardines, maquereau)',
    dosageCalc:function(s){var d=1000;if(s.activity!==null&&s.activity>=3)d=2000;return{dose:d,unit:'mg EPA+DHA/jour',timing:'Pendant un repas',note:'Ratio EPA:DHA 2:1 pour sportifs'};}},
  {id:'magnesium',name:'Magn\u00e9sium (Bisglycinate)',icon:'\uD83E\uDDEA',desc:'Sommeil, crampes, r\u00e9cup\u00e9ration',evidence:'EFSA 2015 \u2014 Apport recommand\u00e9',grade:'A',
    condition:function(s){return (s.sleep!==null&&s.sleep<=1)||(s.activity!==null&&s.activity>=3);},
    unnecessary_if:'Non prioritaire si bon sommeil et entra\u00eenement mod\u00e9r\u00e9',
    dosageCalc:function(s){var d=s.sex==='homme'?400:310;if(s.activity!==null&&s.activity>=3)d+=50;return{dose:d,unit:'mg/jour',timing:'Le soir avant le coucher',note:'Forme bisglycinate mieux tol\u00e9r\u00e9e'};}},
  {id:'fer',name:'Fer',icon:'\uD83E\uDE78',desc:'Transport d\'oxyg\u00e8ne, \u00e9nergie',evidence:'OMS \u2014 Recommandation (femmes)',grade:'A',
    condition:function(s){return (s.sex==='femme'&&s.age<51)||s.pregnant;},
    unnecessary_if:'Hommes : ne suppl\u00e9mentez PAS sans analyse de sang (surdosage dangereux)',warning:'\u26A0 Dosage sanguin (ferritine) OBLIGATOIRE avant suppl\u00e9mentation',
    dosageCalc:function(s){var d=s.pregnant?27:18;if(s.sex==='femme'&&s.age>50)d=8;return{dose:d,unit:'mg/jour',timing:'\u00c0 jeun avec vitamine C',note:'Surdosage dangereux. Toujours sur avis m\u00e9dical'};}},
  {id:'folique',name:'Acide folique',icon:'\uD83E\uDD30',desc:'Pr\u00e9vention spina bifida (grossesse)',evidence:'ACOG 2020 \u2014 Recommandation forte',grade:'A',
    condition:function(s){return s.pregnant===true;},
    unnecessary_if:'Uniquement pendant la grossesse (et id\u00e9alement d\u00e8s le projet de grossesse)',
    dosageCalc:function(){return{dose:'400-800',unit:'\u00b5g/jour',timing:'Le matin',note:'Commencer d\u00e8s le projet de grossesse, maintenir pendant tout le T1'};}},
  {id:'vitamine_b12',name:'Vitamine B12',icon:'\uD83D\uDC8A',desc:'Ind\u00e9pensable pour les v\u00e9gans — absente des v\u00e9g\u00e9taux',evidence:'EFSA 2015 \u2014 Niveau A — seule vitamine introuvable dans les v\u00e9g\u00e9taux',grade:'A',
    condition:function(s){return s.regime===3;},
    warning:'\u26A0 CARENCE GRAVE si non suppl\u00e9ment\u00e9 : an\u00e9mie pernicieuse, neuropathies irr\u00e9versibles. Prise de sang annuelle obligatoire.',
    unnecessary_if:'Non n\u00e9cessaire si r\u00e9gime omnivore, pescétarien ou v\u00e9g\u00e9tarien lacto-ovo (oeufs et produits laitiers en apportent)',
    dosageCalc:function(){return{dose:'1000',unit:'\u00b5g/semaine (ou 50\u00b5g/jour)',timing:'Avec un repas',note:'Formes recommand\u00e9es : m\u00e9thylcobalamine ou cyanocobalamine. Prise de sang ferritine + B12 annuelle.'};}},
  {id:'dha_algues',name:'DHA Algues (Om\u00e9ga-3 v\u00e9gan)',icon:'\uD83C\uDF3F',desc:'Source v\u00e9gane de DHA — bioéquivalent au DHA de poisson',evidence:'EFSA 2012 \u2014 DHA algues bioéquivalent au DHA poisson (gras cérébraux, cardiovasculaire)',grade:'A',
    condition:function(s){return s.regime===3||(s.pregnant&&s.allergies&&s.allergies.indexOf('Poisson')!==-1);},
    unnecessary_if:'Non n\u00e9cessaire si vous consommez du poisson gras 2-3x/semaine (saumon, sardines, maquereau)',
    dosageCalc:function(s){var d=s.pregnant?300:200;return{dose:d,unit:'mg DHA/jour',timing:'Pendant un repas avec des graisses',note:'Cherchez "DHA d\'algues" ou "algal DHA". Durable et sans contaminants marins.'};}},
  {id:'calcium_vegan',name:'Calcium',icon:'\uD83E\uDDB4',desc:'Ossature, contraction musculaire, nerveux',evidence:'IOF 2017 \u2014 Apport r\u00e9f\u00e9rence nutritionnel : 1000 mg/jour',grade:'A',
    condition:function(s){return s.regime===3&&!s.pregnant;},
    unnecessary_if:'Non n\u00e9cessaire si vous consommez produits laitiers régulièrement (lacto-ovo végétarien, omnivore)',
    dosageCalc:function(){return{dose:1000,unit:'mg/jour (fractionner en 500mg × 2)',timing:'Avec les repas (matin + soir)',note:'Formes : citrate de calcium (mieux absorbé) ou carbonate avec repas. Associer à vitamine D.'};}},
  {id:'iode_vegan',name:'Iode',icon:'\uD83C\uDF0A',desc:'Thyroïde, métabolisme, développement cérébral',evidence:'OMS 2007 — Apport recommand\u00e9 150-250 µg/jour',grade:'A',
    condition:function(s){return s.regime>=2;},
    unnecessary_if:'Non n\u00e9cessaire si vous consommez poissons, fruits de mer ou produits laitiers régulièrement',
    dosageCalc:function(s){var d=s.pregnant?220:150;return{dose:d,unit:'\u00b5g/jour',timing:'Avec un repas',note:'Utiliser sel iod\u00e9 et consommer algues mod\u00e9r\u00e9ment (wakame, nori). Attention aux algues riches en iode (kelp) : risque surdosage.'};
  }},
  {id:'zinc_vegan',name:'Zinc',icon:'\uD83E\uDDEC',desc:'Immunité, testostérone, synthèse protéique — biodisponibilité réduite dans les végétaux',evidence:'FAO/OMS 2002 — Biodisponibilité zinc végétal réduite de 50% par les phytates (légumineuses, céréales)',grade:'A',
    condition:function(s){return s.regime>=2;}, // Végétarien, Pescétarien, Végan
    unnecessary_if:'Non n\u00e9cessaire si régime omnivore (huîtres, boeuf, foie = sources zinc héminique)',
    warning:'\u26A0 Phytates dans légumineuses et céréales complètes réduisent absorption zinc de 40-50%. Techniques : trempage/germination des légumineuses, fermentation (pain au levain).',
    dosageCalc:function(s){
      // OMS 2002 : AJR zinc × 1.5 pour végans/végétariens (correction phytates)
      var base=s.sex==='homme'?11:8; // AJR standard ANSES 2021
      var dose=Math.round(base*1.5); // +50% pour compenser phytates
      return{dose:dose,unit:'mg/jour',timing:'Entre les repas ou au coucher (éloigné du calcium/fer)',note:'Formes recommandées : gluconate ou citrate de zinc. Max 25mg/j (seuil UL EFSA). Prise de sang zinc sérique conseillée si supplémentation >3 mois.'};
    }
  },
  {id:'vitamine_k2',name:'Vitamine K2 (MK-7)',icon:'\uD83E\uDDB4',desc:'Dirige le calcium vers les os — prévient calcifications artérielles avec D3',evidence:'EFSA 2017 — K2 (MK-7) synergie avec D3 pour ostéoporose (Vitamin K2 trial, Plaza 2021)',grade:'A',
    condition:function(s){
      // Pertinent si supplémenter en D3 ET facteur de risque osseux ou cardiovasculaire
      var hasOsteo=s.medical&&s.medical.indexOf('osteoporose')!==-1;
      var hasCardio=s.medical&&(s.medical.indexOf('cardio')!==-1||s.medical.indexOf('insuffisance_card')!==-1);
      var isMenopause=s.medical&&s.medical.indexOf('menopause')!==-1;
      var isOlder=s.age>=50;
      return hasOsteo||hasCardio||isMenopause||isOlder;
    },
    unnecessary_if:'Moins prioritaire chez adultes jeunes < 50 ans sans facteur de risque osseux ou cardiovasculaire',
    dosageCalc:function(){return{dose:90,unit:'\u00b5g/jour (femme) / 120\u00b5g/jour (homme)',timing:'Avec un repas contenant des graisses',note:'Forme MK-7 (ménaquinone-7) = demi-vie 72h, supérieure à MK-4. Synergie obligatoire avec vitamine D3. Sources alimentaires : natto (fermenté), certains fromages, jaune d\'oeuf.'};}}
];
window.SUPPLEMENTS_DB = SUPPLEMENTS_DB;

function getSupplementRecommendations() {
  var s = window.S;
  var recs = [];
  SUPPLEMENTS_DB.forEach(function(supp) {
    if (supp.condition(s)) {
      var dosage = supp.dosageCalc(s);
      recs.push({id:supp.id,name:supp.name,icon:supp.icon,desc:supp.desc,evidence:supp.evidence,grade:supp.grade,dosage:dosage,warning:supp.warning||null,unnecessary_if:supp.unnecessary_if||null,relevant:true});
    }
  });
  return recs;
}
window.getSupplementRecommendations = getSupplementRecommendations;

// ─── RED-S DETECTION (IOC 2018 — Relative Energy Deficiency in Sport) ───
// IOC 2018 : RED-S s'applique aux DEUX SEXES (étendu aux hommes en 2014, réaffirmé 2018)
// Seuils : Femmes < 30 kcal/kg LBM/j (risque RED-S) | Hommes < 25 kcal/kg LBM/j
function detectREDS() {
  var s = window.S;
  if(!s||!s.weight||!s.height)return null;
  var target=calcTarget();var tdeeVal=calcTDEE();
  if(!target||!tdeeVal)return null;
  // Estimate LBM: use Navy/Boer formula approximation
  // Simplified: LBM ≈ weight × (1 - body fat estimate)
  // Fat % estimate from BMI (crude but functional)
  var bmi=s.weight/((s.height/100)*(s.height/100));
  var fatPct;
  if(s.sex==='femme'){fatPct=1.20*bmi+0.23*s.age-5.4;}
  else{fatPct=1.20*bmi+0.23*s.age-16.2;}
  fatPct=Math.max(10,Math.min(45,fatPct))/100;
  var lbm=s.weight*(1-fatPct);
  // EA = (caloric intake - exercise energy expenditure) / LBM
  // Approximate EEE = TDEE - BMR (activity-related expenditure)
  var bmrVal=calcBMR();
  var eee=Math.max(0,tdeeVal-bmrVal);
  var ea=(target-eee)/lbm;
  // Seuils IOC 2018 : femmes < 30 kcal/kgLBM/j, hommes < 25 kcal/kgLBM/j
  var eaThreshold = s.sex === 'femme' ? 30 : 25;
  var eaCritical  = s.sex === 'femme' ? 20 : 15;
  if(ea<eaThreshold){
    var isMale = s.sex === 'homme';
    var critSymptoms = isMale
      ? 'Risque : déficit testostérone, ostéoporose, immunodépression, arythmies.'
      : 'Risque : aménorrhée, ostéoporose, immunodépression, arythmies.';
    return{
      ea:Math.round(ea),
      lbm:Math.round(lbm),
      threshold: eaThreshold,
      risk:ea<eaCritical?'CRITIQUE':'ÉLEVÉ',
      message:ea<eaCritical
        ?'⚠ ALERTE RED-S CRITIQUE : Disponibilité énergétique '+Math.round(ea)+' kcal/kg MLG/j (seuil IOC 2018 : '+eaThreshold+'). '+critSymptoms+' Consultation médicale URGENTE.'
        :'⚠ ALERTE RED-S : Disponibilité énergétique '+Math.round(ea)+' kcal/kg MLG/j sous le seuil IOC 2018 ('+eaThreshold+' kcal/kg MLG/j). Risque RED-S : augmentez les apports ou réduisez le volume d\'entraînement.'
    };
  }
  return null;
}
window.detectREDS = detectREDS;

// ─── DÉTECTION CONFLITS MÉDICAUX ───
function detectMedicalConflicts() {
  var s = window.S;
  var conflicts = [];
  if(!s||!s.medical)return conflicts;
  var med=s.medical;
  // Conflit 1 : Grossesse + Diabète gestationnel + Végan → impossible de couvrir 2600kcal avec glucides ≤200g/j
  if(s.pregnant&&med.indexOf('diabete_gest')!==-1&&s.regime===3){
    conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : Grossesse + Diabète gestationnel + Végan — Contraintes caloriques incompatibles. Il peut être impossible de couvrir vos besoins ('+calcTarget()+' kcal) avec glucides ≤200g/j sans consommer d\'œufs ou produits laitiers. Consultation diététicienne spécialisée OBLIGATOIRE.'});
  }
  // Alerte B12 automatique régime végane (EFSA 2023, Messina 2019)
  if(s.regime===3&&med.indexOf('anemie_b12')===-1){
    conflicts.push({level:'INFO',message:'ℹ Régime végane — Supplémentation B12 OBLIGATOIRE (seule vitamine absente des végétaux). Recommandation EFSA 2023 : 1000µg/semaine ou 50µg/jour. Formes : méthylcobalamine ou cyanocobalamine. Prise de sang B12 annuelle conseillée.'});
  }
  // Alerte : allergie poisson + régime pescétarien = sources protéines animales quasi nulles
  if(s.regime===1&&s.allergies&&s.allergies.indexOf('Poisson')!==-1){
    conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT nutritionnel : Régime pescétarien + Allergie au poisson — toutes les sources de protéines animales non-végétales sont exclues. Votre profil devient quasi végétarien. Vérifiez vos apports en B12, zinc, fer et oméga-3 (supplémenter si nécessaire).'});
  }
  // Conflit 2 : TCA + objectif shred/cut
  if(med.indexOf('tca')!==-1){
    var goalKey=s.goal!==null?GOALS[s.goal].key:null;
    if(goalKey==='shred'||goalKey==='cut'){
      conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : TCA + objectif sèche/coupe — Objectif automatiquement remplacé par maintenance. Un suivi médical et psychologique est OBLIGATOIRE avant tout déficit calorique.'});
    }
  }
  // Conflit 3 : IRC + créatine → déjà géré dans SUPPLEMENTS_DB (info seulement)
  if(med.indexOf('irc')!==-1&&s.sportGoals&&s.sportGoals.indexOf('muscle')!==-1){
    conflicts.push({level:'INFO',message:'ℹ IRC + Objectif musculaire — La créatine est contre-indiquée (charge rénale). Protéines plafonnées à 0.60g/kg/j (KDOQI 2020, CKD 3-5 non-dialyse). Consulter un néphrologue avant tout programme de musculation intensif.'});
  }
  // Conflit 4 : Cardiopathie + intensité haute
  if(med.indexOf('cardio')!==-1){
    var actFactor=s.activity!==null?ACTIVITIES[s.activity].factor:0;
    if(actFactor>=1.7){
      conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : Cardiopathie + activité très intense — Niveau d\'activité incompatible sans clearance cardiologique. Test d\'effort (VO2max) obligatoire. Zones FC via formule de Karvonen recommandées.'});
    }
  }
  // Conflit 5 : Goutte + fructose — le fructose élève l'acide urique autant que les purines (Choi 2010, NEJM)
  if(med.indexOf('goutte')!==-1){
    conflicts.push({level:'ÉLEVÉ',message:'⚠ GOUTTE : Le fructose (sodas, jus de fruits industriels, miel, sirop d\'agave, dattes) élève l\'acide urique AUTANT que les purines (Choi 2010, NEJM). Évitez les sucres ajoutés et jus de fruits en plus des abats/sardines. Buvez 2L+ eau/j pour diluer l\'acide urique. La cerise et les fraises ont des propriétés anti-uricémiques (Zhang 2012, Arthritis & Rheumatism).'});
  }
  // Conflit 6 : Alcool + objectif musculaire/sèche — inhibe synthèse protéique
  if(s.alcoholFreq&&s.alcoholFreq!=='never'){
    var hasMusclGoal=s.sportGoals&&(s.sportGoals.indexOf('muscle')!==-1||s.sportGoals.indexOf('shred')!==-1);
    var isFrequentDrinker=s.alcoholFreq==='weekly'||s.alcoholFreq==='daily';
    if(hasMusclGoal&&isFrequentDrinker){
      conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : Alcool régulier + objectif musculaire/sèche — L\'alcool inhibe la synthèse protéique musculaire de 15-30% (Parr 2014, PLOS ONE), réduit la testostérone et perturbe la récupération. Si >3 verres/j : risque de catabolisme musculaire même avec apports protéiques adéquats. Réduire à ≤2 verres/semaine pour maximiser les résultats (ISSN 2017).'});
    }
    // Alcool + HTA : même modéré, augmente la pression artérielle
    if(med.indexOf('hta')!==-1&&isFrequentDrinker){
      conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : HTA + consommation régulière d\'alcool — Même 1-2 verres/jour élèvent la pression artérielle de 2-4 mmHg (PREDIMED 2010, ESC 2021). L\'OMS recommande zéro alcool pour les hypertendus. Vérifiez votre traitement antihypertenseur avec votre médecin.'});
    }
  }
  // Conflit 7 : IRC + régime hyperprotéiné (si objectif prise de masse sans pathologie déclarée)
  if(med.indexOf('irc')!==-1){
    var goalKeyIRC=s.goal!==null?GOALS[s.goal].key:null;
    if(goalKeyIRC==='bulk'){
      conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : IRC + Prise de masse — L\'objectif "prise de masse" est incompatible avec une insuffisance rénale chronique. Les protéines sont plafonnées à 0.55-0.60g/kg/j (KDOQI 2020). Un excès protéique accélère la progression de l\'insuffisance rénale. Consultation néphrologue OBLIGATOIRE avant de modifier l\'alimentation.'});
    }
  }
  // Conflit 8 : Grossesse + sèche/coupe — risque déficit pour le fœtus
  if(s.pregnant&&s.goal!==null){
    var pGoalKey=GOALS[s.goal].key;
    if(pGoalKey==='cut'||pGoalKey==='shred'){
      conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : Grossesse + déficit calorique — Tout déficit calorique pendant la grossesse est contre-indiqué (ACOG 2018). Les besoins augmentent de +300 kcal/j (T2-T3). La restriction calorique pendant la grossesse est associée à un retard de croissance intra-utérin (RCIU). Objectif automatiquement corrigé.'});
    }
  }
  return conflicts;
}
window.detectMedicalConflicts = detectMedicalConflicts;

// ─── AUTH RATE LIMITING ───
var authAttempts = {};
window.canAttemptAuth = function(email) {
  var key = email.toLowerCase();
  var now = Date.now();
  if (!authAttempts[key]) authAttempts[key] = [];
  authAttempts[key] = authAttempts[key].filter(function(t){ return now - t < 300000; });
  if (authAttempts[key].length >= 5) return false;
  authAttempts[key].push(now);
  return true;
};

// ─── STRENGTH STANDARDS (A-E rating system) ───
// Sources: Symmetric Strength, ExRx, NSCA
var STRENGTH_STANDARDS = {
  // [E, D, C, B, A] as multipliers of body weight
  // For men
  m: {
    bench_press:    [0.40, 0.60, 0.85, 1.15, 1.50],
    squat:          [0.50, 0.75, 1.00, 1.50, 2.00],
    deadlift:       [0.60, 1.00, 1.25, 1.75, 2.50],
    overhead_press: [0.25, 0.40, 0.55, 0.75, 1.00],
    barbell_row:    [0.30, 0.50, 0.70, 0.90, 1.15],
    barbell_curl:   [0.15, 0.25, 0.35, 0.45, 0.60],
    hip_thrust:     [0.50, 0.75, 1.00, 1.50, 2.00],
    // CrossFit lifts (Symmetric Strength / ExRx aligned)
    clean:          [0.35, 0.55, 0.75, 1.00, 1.25],
    snatch:         [0.25, 0.45, 0.60, 0.80, 1.00],
    front_squat:    [0.40, 0.65, 0.85, 1.15, 1.50],
    thruster:       [0.25, 0.40, 0.55, 0.70, 0.90],
    overhead_squat: [0.20, 0.35, 0.50, 0.70, 0.90],
    push_press:     [0.25, 0.40, 0.55, 0.70, 0.85]
  },
  // For women (approximately 60-70% of men's standards)
  f: {
    bench_press:    [0.20, 0.35, 0.55, 0.75, 1.00],
    squat:          [0.35, 0.55, 0.75, 1.10, 1.50],
    deadlift:       [0.40, 0.70, 1.00, 1.30, 1.80],
    overhead_press: [0.12, 0.22, 0.35, 0.50, 0.65],
    barbell_row:    [0.20, 0.35, 0.50, 0.65, 0.80],
    barbell_curl:   [0.10, 0.18, 0.25, 0.33, 0.42],
    hip_thrust:     [0.40, 0.65, 0.90, 1.25, 1.75],
    clean:          [0.20, 0.35, 0.50, 0.65, 0.80],
    snatch:         [0.15, 0.28, 0.40, 0.55, 0.70],
    front_squat:    [0.30, 0.50, 0.65, 0.85, 1.10],
    thruster:       [0.18, 0.30, 0.42, 0.55, 0.70],
    overhead_squat: [0.12, 0.25, 0.38, 0.50, 0.65],
    push_press:     [0.18, 0.30, 0.42, 0.55, 0.65]
  }
};
window.STRENGTH_STANDARDS = STRENGTH_STANDARDS;

var GRADE_LABELS = {
  A: {name: '\u00c9lite', color: '#1A4A1A', bg: 'rgba(26,74,26,.08)', desc: 'Niveau comp\u00e9tition. Impressionnant.'},
  B: {name: 'Avanc\u00e9', color: '#1A3A6A', bg: 'rgba(26,58,106,.08)', desc: 'Tr\u00e8s solide. Au-dessus de la moyenne.'},
  C: {name: 'Interm\u00e9diaire', color: '#6A4A1A', bg: 'rgba(106,74,26,.08)', desc: 'Bon niveau. Continuez \u00e0 progresser.'},
  D: {name: 'D\u00e9butant+', color: '#8A6A2A', bg: 'rgba(138,106,42,.08)', desc: 'En progression. Les bases sont l\u00e0.'},
  E: {name: 'D\u00e9butant', color: '#5A1010', bg: 'rgba(90,16,16,.08)', desc: 'Tout le monde commence quelque part.'}
};
window.GRADE_LABELS = GRADE_LABELS;

function calculateStrengthGrade() {
  var s = window.S;
  if (!s.weight || !s.sex) return null;

  var sexKey = s.sex === 'homme' ? 'm' : 'f';
  var standards = STRENGTH_STANDARDS[sexKey];
  var bw = s.weight;

  // Collect all available lifts (from muscu profile + crossfit 1RM)
  var scores = [];
  var liftsUsed = [];

  function scoreLift(key, weight, isFrom1RM) {
    if (!weight || !standards[key]) return;
    // Muscu strength profile = 8-10RM, convert to estimated 1RM (Brzycki)
    var estimated1RM = isFrom1RM ? weight : Math.round(weight / (1.0278 - 0.0278 * 9)); // ~1.3x for 9 reps
    var ratio = estimated1RM / bw;
    var thresholds = standards[key]; // [E, D, C, B, A]
    var grade;
    if (ratio >= thresholds[4]) grade = 4; // A
    else if (ratio >= thresholds[3]) grade = 3; // B
    else if (ratio >= thresholds[2]) grade = 2; // C
    else if (ratio >= thresholds[1]) grade = 1; // D
    else grade = 0; // E
    scores.push(grade);
    liftsUsed.push({key: key, weight: weight, ratio: Math.round(ratio * 100) / 100, grade: ['E','D','C','B','A'][grade]});
  }

  // From musculation profile
  var mp = s.muscuStrengthProfile || {};
  Object.keys(mp).forEach(function(k) { if (mp[k]) scoreLift(k, mp[k], false); }); // muscu = 8-10RM

  // From crossfit 1RM
  var cf = s.crossfit1RM || {};
  Object.keys(cf).forEach(function(k) { if (cf[k] && !mp[k]) scoreLift(k, cf[k], true); }); // CF = 1RM

  if (scores.length === 0) return null;

  // Average score -> grade
  var avg = scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;
  var overallGrade;
  if (avg >= 3.5) overallGrade = 'A';
  else if (avg >= 2.5) overallGrade = 'B';
  else if (avg >= 1.5) overallGrade = 'C';
  else if (avg >= 0.5) overallGrade = 'D';
  else overallGrade = 'E';

  return {
    grade: overallGrade,
    label: GRADE_LABELS[overallGrade],
    avgScore: Math.round(avg * 10) / 10,
    liftsUsed: liftsUsed,
    liftsCount: liftsUsed.length
  };
}
window.calculateStrengthGrade = calculateStrengthGrade;

function renderStrengthGrade(container) {
  var result = calculateStrengthGrade();
  if (!result) return;

  var info = result.label;

  var card = h('div', {style: 'border:1px solid var(--border);padding:20px;margin:16px 0;text-align:center;background:' + info.bg});

  // Big grade letter
  card.appendChild(h('div', {style: 'font-family:Georgia;font-size:64px;font-style:italic;color:' + info.color + ';line-height:1'}, result.grade));
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:' + info.color + ';margin:8px 0'}, info.name));
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, info.desc));

  // Detail per lift
  if (result.liftsUsed.length > 0) {
    var detail = h('div', {style: 'text-align:left;border-top:1px solid var(--border);padding-top:12px;margin-top:12px'});
    detail.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'D\u00e9tail par exercice'));

    result.liftsUsed.forEach(function(lift) {
      var row = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--ivory3,#EEEDE8);font-family:"Helvetica Neue",sans-serif;font-size:11px'});
      row.appendChild(h('span', {}, lift.key.replace(/_/g, ' ')));
      row.appendChild(h('span', {}, lift.weight + 'kg (' + lift.ratio + '\u00d7BW)'));
      var gradeLabel = GRADE_LABELS[lift.grade];
      row.appendChild(h('span', {style: 'font-family:Georgia;font-weight:bold;color:' + gradeLabel.color}, lift.grade));
      detail.appendChild(row);
    });
    card.appendChild(detail);
  }

  container.appendChild(card);
}
window.renderStrengthGrade = renderStrengthGrade;

// ─── RUNNING CONSTANTS ───
var RUNNING_LEVELS = [
  {id: 'beginner', name: 'Débutant', desc: 'Je commence à courir ou < 6 mois', icon: '🟢', vdot: 30},
  {id: 'intermediate', name: 'Intermédiaire', desc: '6 mois - 2 ans de running', icon: '🟡', vdot: 42},
  {id: 'advanced', name: 'Avancé', desc: '2+ ans, compétitions', icon: '🔴', vdot: 52}
];
window.RUNNING_LEVELS = RUNNING_LEVELS;

var RUNNING_GOALS = [
  {id: '5k', name: '5 km', desc: 'Première course ou PR', icon: '🏁', weeks: 8, longRunMax: 8},
  {id: '10k', name: '10 km', desc: 'Distance populaire', icon: '🏁', weeks: 10, longRunMax: 12},
  {id: 'semi', name: 'Semi-marathon', desc: '21.1 km', icon: '🏅', weeks: 12, longRunMax: 18},
  {id: 'marathon', name: 'Marathon', desc: '42.195 km', icon: '🏆', weeks: 16, longRunMax: 35},
  {id: 'trail', name: 'Trail', desc: 'Course nature / dénivelé', icon: '⛰️', weeks: 12, longRunMax: 25}
];
window.RUNNING_GOALS = RUNNING_GOALS;

var RUNNING_ZONES = [
  {zone: 'Z1', name: 'Récupération', pct: [59, 74], feel: 'Conversation facile', color: '#1A4A1A'},
  {zone: 'Z2', name: 'Endurance fondamentale', pct: [74, 84], feel: 'Parler par phrases', color: '#1A3A6A'},
  {zone: 'Z3', name: 'Tempo / Seuil', pct: [84, 88], feel: 'Quelques mots', color: '#6A4A1A'},
  {zone: 'Z4', name: 'Seuil anaérobie', pct: [88, 95], feel: 'Effort soutenu', color: '#8A3A1A'},
  {zone: 'Z5', name: 'VMA / VO2max', pct: [95, 100], feel: 'Quasi-max', color: '#5A1010'}
];
window.RUNNING_ZONES = RUNNING_ZONES;

// ─── HYROX CONSTANTS ───
var HYROX_LEVELS = [
  {id: 'beginner', name: 'Débutant', desc: 'Premier Hyrox', icon: '🟢'},
  {id: 'intermediate', name: 'Intermédiaire', desc: '1-3 Hyrox complétés', icon: '🟡'},
  {id: 'advanced', name: 'Avancé', desc: 'Compétiteur régulier', icon: '🟠'},
  {id: 'pro', name: 'Pro / Élite', desc: 'Top 10% ou Pro division', icon: '🔴'}
];
window.HYROX_LEVELS = HYROX_LEVELS;

var HYROX_GOALS = [
  {id: 'finish', name: 'Finir', desc: 'Compléter mon premier Hyrox', icon: '🏁', targetMin: null},
  {id: 'sub90', name: 'Sub 1h30', desc: 'Passer sous 1h30', icon: '⏱️', targetMin: 90},
  {id: 'sub75', name: 'Sub 1h15', desc: 'Passer sous 1h15', icon: '⏱️', targetMin: 75},
  {id: 'sub60', name: 'Sub 1h00', desc: 'Passer sous 1 heure', icon: '🔥', targetMin: 60},
  {id: 'podium', name: 'Podium', desc: 'Top 3 de ma catégorie', icon: '🏆', targetMin: null}
];
window.HYROX_GOALS = HYROX_GOALS;

var HYROX_STATIONS = [
  {id: 'run', name: '1km Run', type: 'run', unit: 'min:sec'},
  {id: 'skiErg', name: '1000m SkiErg', type: 'erg', unit: 'min:sec', standards: {beginner: '5:00', intermediate: '4:00', advanced: '3:30', pro: '3:00'}},
  {id: 'sled_push', name: '50m Sled Push', type: 'strength', unit: 'min:sec', weight: {m: {beginner:102, intermediate:152, advanced:152, pro:202}, f: {beginner:52, intermediate:102, advanced:102, pro:152}}},
  {id: 'sled_pull', name: '50m Sled Pull', type: 'strength', unit: 'min:sec', weight: {m: {beginner:78, intermediate:103, advanced:103, pro:153}, f: {beginner:53, intermediate:78, advanced:78, pro:103}}},
  {id: 'burpee_bj', name: '80 Burpee Broad Jumps', type: 'bodyweight', unit: 'min:sec', reps: 80, standards: {beginner: '8:00', intermediate: '6:00', advanced: '4:30', pro: '3:30'}},
  {id: 'rowing', name: '1000m Row', type: 'erg', unit: 'min:sec', standards: {beginner: '4:30', intermediate: '3:45', advanced: '3:15', pro: '2:50'}},
  {id: 'farmers', name: '200m Farmers Carry', type: 'strength', unit: 'min:sec', weight: {m: {beginner:'2x16kg', intermediate:'2x24kg', advanced:'2x24kg', pro:'2x32kg'}, f: {beginner:'2x12kg', intermediate:'2x16kg', advanced:'2x16kg', pro:'2x24kg'}}},
  {id: 'lunges', name: '100m Lunges (sandbag)', type: 'strength', unit: 'min:sec', weight: {m: {beginner:10, intermediate:20, advanced:20, pro:30}, f: {beginner:0, intermediate:10, advanced:10, pro:20}}},
  {id: 'wall_balls', name: '100 Wall Balls', type: 'strength', unit: 'min:sec', reps: 100, weight: {m: '6/9kg', f: '4/6kg'}, standards: {beginner: '7:00', intermediate: '5:00', advanced: '4:00', pro: '3:00'}}
];
window.HYROX_STATIONS = HYROX_STATIONS;

// ─── RUNNING PROGRAM GENERATION (Jack Daniels / Pfitzinger) ───
function generateRunningProgram(weeks, daysPerWeek, level, goal) {
  var program = [];
  var goalObj = RUNNING_GOALS.find(function(g){ return g.id === goal; });
  var levelObj = RUNNING_LEVELS.find(function(l){ return l.id === level; });
  if (!goalObj || !levelObj) return [];

  var maxLongRun = goalObj.longRunMax;
  var totalWeeks = goalObj.weeks;

  var SESSION_TYPES = {
    easy: {name: 'Footing facile', zone: 'Z1-Z2', icon: '🟢', desc: 'Allure conversationnelle'},
    long: {name: 'Sortie longue', zone: 'Z2', icon: '🔵', desc: 'Endurance fondamentale'},
    tempo: {name: 'Tempo / Seuil', zone: 'Z3', icon: '🟡', desc: 'Allure marathon à semi'},
    interval: {name: 'Fractionné', zone: 'Z4-Z5', icon: '🔴', desc: 'VMA / vitesse'},
    hills: {name: 'Côtes', zone: 'Z4', icon: '⛰️', desc: 'Force spécifique'},
    recovery: {name: 'Récupération', zone: 'Z1', icon: '🟢', desc: 'Très facile ou repos'},
    race_pace: {name: 'Allure course', zone: 'Z3-Z4', icon: '🟠', desc: 'Simulation de course'},
    cross: {name: 'Cross-training', zone: 'Z2', icon: '🔄', desc: 'Vélo, natation, renforcement'}
  };

  var templates = {
    3: ['easy', 'interval', 'long'],
    4: ['easy', 'interval', 'tempo', 'long'],
    5: ['easy', 'interval', 'easy', 'tempo', 'long'],
    6: ['easy', 'interval', 'recovery', 'tempo', 'hills', 'long']
  };

  var weekTemplate = templates[daysPerWeek] || templates[4];

  for (var w = 1; w <= totalWeeks; w++) {
    var weekPlan = [];
    var phase;
    var pctOfPlan = w / totalWeeks;

    if (pctOfPlan <= 0.3) phase = 'Base';
    else if (pctOfPlan <= 0.6) phase = 'Développement';
    else if (pctOfPlan <= 0.85) phase = 'Spécifique';
    else phase = 'Affûtage';

    var longRunKm;
    if (pctOfPlan <= 0.75) {
      longRunKm = Math.round(maxLongRun * 0.5 + (maxLongRun * 0.5 * pctOfPlan / 0.75));
    } else {
      longRunKm = Math.round(maxLongRun * (1 - (pctOfPlan - 0.75) / 0.25 * 0.4));
    }
    if (w % 4 === 0) longRunKm = Math.round(longRunKm * 0.7);
    // Règle +10%/semaine (ACSM 2018) — évite les blessures par surcharge
    if (w > 1 && program.length > 0) {
      var prevLong = program[program.length - 1].longRun || 0;
      if (prevLong > 0 && !(w % 4 === 0) && longRunKm > Math.round(prevLong * 1.10)) {
        longRunKm = Math.round(prevLong * 1.10);
      }
    }

    var baseVolume = longRunKm * 2.5;
    if (level === 'beginner') baseVolume *= 0.7;
    if (level === 'advanced') baseVolume *= 1.2;

    weekTemplate.forEach(function(sessionType, dayIdx) {
      var session = JSON.parse(JSON.stringify(SESSION_TYPES[sessionType]));
      session.type = sessionType;
      session.dayNumber = dayIdx + 1;

      if (sessionType === 'long') {
        session.distance = longRunKm + ' km';
        session.detail = 'Allure Z2 constante. Ravitaillement tous les 5km si > 15km.';
      } else if (sessionType === 'easy') {
        var easyKm = Math.round(baseVolume * 0.2);
        session.distance = Math.max(3, easyKm) + ' km';
        session.detail = 'Facile ! Vous devez pouvoir parler sans essoufflement.';
      } else if (sessionType === 'interval') {
        if (phase === 'Base') {
          session.detail = level === 'beginner' ? '6x200m Z5, repos 200m marche' : '8x400m Z4-Z5, repos 200m trot';
        } else if (phase === 'Développement') {
          session.detail = level === 'beginner' ? '5x400m Z4, repos 400m trot' : '5x1000m Z4, repos 400m trot';
        } else {
          session.detail = level === 'beginner' ? '3x(3min Z4 + 2min Z1)' : '4x1600m Z4, repos 400m';
        }
        session.distance = Math.round(baseVolume * 0.15) + ' km total';
      } else if (sessionType === 'tempo') {
        var tempoKm = Math.round(baseVolume * 0.15);
        session.distance = Math.max(4, tempoKm) + ' km';
        session.detail = 'Échauffement 2km Z1 → ' + Math.max(2, tempoKm - 4) + 'km Z3 → Retour 2km Z1';
      } else if (sessionType === 'hills') {
        session.detail = level === 'beginner' ? '6x30s côte Z4, descente récup' : '8x60s côte Z4-Z5, descente trot';
        session.distance = '5-8 km total';
      } else if (sessionType === 'recovery') {
        session.distance = '3-4 km ou repos complet';
        session.detail = 'Très très facile. Ou repos si fatigue.';
      } else if (sessionType === 'race_pace') {
        session.distance = Math.round(baseVolume * 0.15) + ' km';
        session.detail = 'Simulez votre allure de course cible.';
      } else if (sessionType === 'cross') {
        session.distance = '30-45 min';
        session.detail = 'Vélo, natation, ou renforcement musculaire (gainage, squats, fentes)';
      }

      weekPlan.push(session);
    });

    program.push({
      week: w,
      phase: phase,
      totalKm: Math.round(baseVolume),
      longRun: longRunKm,
      sessions: weekPlan,
      isDeload: w % 4 === 0,
      isTaper: pctOfPlan > 0.85,
      notes: w % 4 === 0 ? '📉 Semaine de récupération — volume réduit' :
             pctOfPlan > 0.85 ? '🎯 Affûtage — réduisez le volume, gardez l\'intensité' :
             phase === 'Base' ? '🏗️ Construction de la base aérobie' :
             phase === 'Développement' ? '📈 Montée en charge progressive' :
             '⚡ Travail spécifique course'
    });
  }

  return program;
}
window.generateRunningProgram = generateRunningProgram;

// ─── HYROX PROGRAM GENERATION ───
function generateHyroxProgram(daysPerWeek, level, goal) {
  var program = [];
  var totalWeeks = 8;

  var templates = {
    3: [
      {focus: 'Run + Stations', type: 'mixed'},
      {focus: 'Strength + Ergs', type: 'strength'},
      {focus: 'Simulation Hyrox', type: 'simulation'}
    ],
    4: [
      {focus: 'Running Intervals', type: 'run'},
      {focus: 'Upper Body + Ergs', type: 'upper'},
      {focus: 'Lower Body + Carry', type: 'lower'},
      {focus: 'Simulation Hyrox', type: 'simulation'}
    ],
    5: [
      {focus: 'Running Intervals', type: 'run'},
      {focus: 'Upper Body + SkiErg', type: 'upper'},
      {focus: 'Lower Body + Sled', type: 'lower'},
      {focus: 'Stations Practice', type: 'stations'},
      {focus: 'Simulation Hyrox', type: 'simulation'}
    ],
    6: [
      {focus: 'Running Tempo', type: 'run'},
      {focus: 'Upper Body + SkiErg', type: 'upper'},
      {focus: 'Running Intervals', type: 'run_intervals'},
      {focus: 'Lower Body + Sled', type: 'lower'},
      {focus: 'Stations Practice', type: 'stations'},
      {focus: 'Full Simulation', type: 'simulation'}
    ]
  };

  var weekTemplate = templates[daysPerWeek] || templates[4];

  var HYROX_SESSIONS = {
    run: function(w, lvl) {
      var intervals = lvl === 'beginner' ? '6x400m @allure 5km, repos 90s' :
                      lvl === 'intermediate' ? '8x400m @allure 5km, repos 60s' :
                      '10x400m @allure 5km, repos 45s';
      return {
        name: '🏃 Running Intervals',
        exercises: [
          {name: 'Échauffement', detail: '10min footing facile'},
          {name: 'Intervalles', detail: intervals},
          {name: 'Retour au calme', detail: '10min footing + étirements'}
        ],
        notes: 'L\'objectif est de tenir la même allure sur toutes les répétitions. Hyrox = 8×1km !'
      };
    },
    run_intervals: function(w, lvl) {
      return {
        name: '🏃 Running Tempo',
        exercises: [
          {name: 'Échauffement', detail: '2km facile'},
          {name: 'Tempo Run', detail: (lvl === 'beginner' ? '3' : lvl === 'intermediate' ? '5' : '8') + 'km @allure semi-marathon'},
          {name: 'Retour au calme', detail: '2km facile'}
        ],
        notes: 'Allure confortablement inconfortable. Vous devez tenir mais c\'est dur.'
      };
    },
    upper: function(w, lvl) {
      var sets = lvl === 'beginner' ? 3 : 4;
      return {
        name: '💪 Upper Body + SkiErg',
        exercises: [
          {name: '1000m SkiErg', detail: 'Objectif : ' + (lvl === 'beginner' ? '< 5:00' : lvl === 'intermediate' ? '< 4:00' : '< 3:30')},
          {name: sets + 'x12 DB Strict Press', detail: 'Épaules — contrôle'},
          {name: sets + 'x15 Push-ups', detail: 'Poitrine — explosif'},
          {name: sets + 'x12 Bent Over Row', detail: 'Dos — tirage lourd'},
          {name: sets + 'x20 Wall Balls', detail: 'Simulation station — ' + (lvl === 'beginner' ? '6kg' : '9kg')},
          {name: '500m SkiErg sprint', detail: 'Finisher — tout donner'}
        ],
        notes: 'Le SkiErg est la station la plus technique. Tirez avec le dos, pas les bras.'
      };
    },
    lower: function(w, lvl) {
      var sets = lvl === 'beginner' ? 3 : 4;
      return {
        name: '🦵 Lower Body + Sled/Carry',
        exercises: [
          {name: '4x50m Sled Push', detail: 'Simulation — poids compétition'},
          {name: sets + 'x10 Back Squat', detail: 'Force jambes'},
          {name: sets + 'x12 Romanian Deadlift', detail: 'Ischio-jambiers'},
          {name: '4x50m Farmers Carry', detail: lvl === 'beginner' ? '2x16kg' : '2x24kg'},
          {name: sets + 'x20 Walking Lunges', detail: lvl === 'beginner' ? 'Sans charge' : 'Avec sandbag'},
          {name: '1000m Row', detail: 'Objectif : ' + (lvl === 'beginner' ? '< 4:30' : '< 3:45')}
        ],
        notes: 'Les jambes font la différence en Hyrox. Sled + Lunges + Running = tout.'
      };
    },
    stations: function(w, lvl) {
      return {
        name: '🎯 Stations Practice',
        exercises: [
          {name: '1000m SkiErg', detail: 'Travail technique + pacing'},
          {name: '50 Wall Balls', detail: 'Sets de ' + (lvl === 'beginner' ? '10' : '25') + ', repos 30s'},
          {name: '40 Burpee Broad Jumps', detail: 'Rythme constant, pas de sprint'},
          {name: '1000m Row', detail: 'Technique long pull'},
          {name: '100m Sled Pull', detail: 'Main sur main, pas de pause'},
          {name: '100m Lunges', detail: 'Avec ' + (lvl === 'beginner' ? '0kg' : '10kg') + ' sandbag'}
        ],
        notes: 'Pratiquez les transitions entre stations. En compétition, chaque seconde compte.'
      };
    },
    simulation: function(w, lvl) {
      var rounds = w <= 3 ? 4 : w <= 6 ? 6 : 8;
      return {
        name: '🔥 Simulation Hyrox (' + rounds + ' stations)',
        exercises: [
          {name: rounds + ' rounds de :', detail: ''},
          {name: '→ 500m Run', detail: '(1km en compétition)'},
          {name: '→ 1 Station Hyrox', detail: 'Alternez les stations à chaque round'},
          {name: '', detail: 'Stations en rotation : SkiErg 500m, Wall Balls ×50, Row 500m, Burpee BJ ×40, Farmers 100m, Lunges 50m, Sled Push 25m, Sled Pull 25m'}
        ],
        notes: rounds === 8 ? '🏆 FULL SIMULATION ! Donnez tout. C\'est votre test.' : '📈 Simulation partielle — focus sur le pacing et les transitions.'
      };
    },
    mixed: function(w, lvl) {
      return {
        name: '🔄 Mixed: Run + Stations',
        exercises: [
          {name: '3x1km Run', detail: 'Allure Hyrox cible, repos 2min'},
          {name: '3x250m SkiErg', detail: 'Repos 60s'},
          {name: '3x250m Row', detail: 'Repos 60s'},
          {name: '50 Wall Balls', detail: 'For time'},
          {name: '2x100m Farmers Carry', detail: lvl === 'beginner' ? '2x16kg' : '2x24kg'}
        ],
        notes: 'Entraînement mixte. L\'objectif est d\'enchaîner sans temps mort.'
      };
    },
    strength: function(w, lvl) {
      var sets = lvl === 'beginner' ? 3 : 4;
      return {
        name: '🏋️ Strength + Conditioning',
        exercises: [
          {name: sets + 'x8 Deadlift', detail: 'Lourd'},
          {name: sets + 'x10 Front Squat', detail: 'Tempo 3-1-1'},
          {name: sets + 'x12 DB Push Press', detail: 'Explosif'},
          {name: '1000m SkiErg', detail: 'For time'},
          {name: '1000m Row', detail: 'For time'},
          {name: '3x20 Wall Balls', detail: 'Repos 45s'}
        ],
        notes: 'Force fonctionnelle. Chaque exercice a un transfert direct sur une station Hyrox.'
      };
    }
  };

  for (var w = 1; w <= totalWeeks; w++) {
    var weekSessions = [];
    var phase = w <= 3 ? 'Base' : w <= 6 ? 'Développement' : 'Compétition';

    weekTemplate.forEach(function(day, idx) {
      var sessionFn = HYROX_SESSIONS[day.type];
      if (sessionFn) {
        var session = sessionFn(w, level);
        session.dayNumber = idx + 1;
        session.focus = day.focus;
        weekSessions.push(session);
      }
    });

    program.push({
      week: w,
      phase: phase,
      sessions: weekSessions,
      isDeload: w === 4,
      notes: w === 4 ? '📉 Semaine de décharge — volume réduit de 30%' :
             w === 8 ? '🏆 Semaine de compétition — simulation complète + repos' :
             phase === 'Base' ? '🏗️ Construction endurance + apprentissage stations' :
             phase === 'Développement' ? '📈 Montée en intensité + simulations partielles' :
             '🎯 Simulations complètes + affûtage'
    });
  }

  return program;
}
window.generateHyroxProgram = generateHyroxProgram;

// ─── PADEL ───
var PADEL_LEVELS=[{id:'beginner',name:'Débutant',desc:'< 6 mois',icon:'🟢'},{id:'intermediate',name:'Intermédiaire',desc:'6 mois-2 ans',icon:'🟡'},{id:'advanced',name:'Avancé',desc:'2+ ans, compétitions',icon:'🟠'},{id:'competition',name:'Compétition',desc:'Tournois, classé',icon:'🔴'}];
window.PADEL_LEVELS=PADEL_LEVELS;
var PADEL_GOALS=[{id:'fitness',name:'Forme physique',desc:'Padel pour rester en forme',icon:'💪'},{id:'improve',name:'Progresser',desc:'Améliorer technique et jeu',icon:'📈'},{id:'compete',name:'Compétition',desc:'Préparer des tournois',icon:'🏆'},{id:'tournament',name:'Tournoi spécifique',desc:'Préparation ciblée',icon:'🎯'}];
window.PADEL_GOALS=PADEL_GOALS;
var PADEL_SKILLS=[{id:'forehand',name:'Coup droit',category:'Fondamentaux'},{id:'backhand',name:'Revers',category:'Fondamentaux'},{id:'serve',name:'Service',category:'Fondamentaux'},{id:'volley',name:'Volée',category:'Filet'},{id:'bandeja',name:'Bandeja',category:'Coups spéciaux'},{id:'vibora',name:'Víbora',category:'Coups spéciaux'},{id:'smash',name:'Smash',category:'Attaque'},{id:'lob',name:'Lob',category:'Défense'},{id:'chiquita',name:'Chiquita',category:'Coups spéciaux'},{id:'wall_play',name:'Jeu de mur',category:'Murs'},{id:'positioning',name:'Placement',category:'Tactique'}];
window.PADEL_SKILLS=PADEL_SKILLS;

function generatePadelProgram(days,level,goal){var program=[];var totalWeeks=8;var types={technique:function(w,lv){var d=lv==='beginner'?[{name:'Échauffement échanges',detail:'10min échanges fond de court',duration:'10min'},{name:'Coup droit fond',detail:'Échanges croisés, 50 balles. Préparation haute, transfert de poids',duration:'15min'},{name:'Revers fond',detail:'Échanges croisés revers, 50 balles. Prise continentale',duration:'15min'},{name:'Service',detail:'20 services chaque côté. Effet slicé, régularité',duration:'10min'},{name:'Volée',detail:'Volée-volée avec partenaire, 3x2min',duration:'10min'},{name:'Match dirigé',detail:'Points joués sans smash, jeu au sol',duration:'15min'}]:lv==='intermediate'?[{name:'Échauffement progressif',detail:'Fond → volées → bandeja, 5min chaque',duration:'15min'},{name:'Bandeja',detail:'Partenaire lobe, bandeja croisée. 30 balles chaque côté',duration:'15min'},{name:'Víbora',detail:'Prise marteau, slice agressif. 20 balles chaque côté',duration:'10min'},{name:'Jeu de mur',detail:'Partenaire sur le mur, contrôle. 3x3min',duration:'10min'},{name:'Chiquita',detail:'Depuis le fond, chiquita pour reprendre le filet. 30 balles',duration:'10min'},{name:'Points tactiques',detail:'Obligation de monter au filet sur chaque point',duration:'20min'}]:[{name:'Échauffement spécifique',detail:'Fond → volées → bandeja → smash → points',duration:'15min'},{name:'Sortie de mur',detail:'Bajada de pared, enchaînement attaque',duration:'15min'},{name:'Enchaînement bandeja-víbora-remate',detail:'Séquence offensive depuis le filet',duration:'15min'},{name:'Jeu de position',detail:'Points avec zones cibles, placement partenaire',duration:'15min'},{name:'Situations de match',detail:'Break points, tie-break, retour de service',duration:'20min'}];return{name:'🎾 Technique Padel',exercises:d,notes:'Focus technique. Qualité > quantité.'}},physical:function(w,lv){var s=lv==='beginner'?3:4;return{name:'💪 Prépa physique Padel',exercises:[{name:'Échauffement dynamique',detail:'Montées genoux, carioca, pas chassés × 5min',duration:'5min'},{name:'Déplacements latéraux',detail:s+'x30s shuffle + 30s repos',duration:'8min'},{name:'Agilité échelle',detail:'6 passages: in-out, icky shuffle, lateral',duration:'8min'},{name:'Explosivité split step',detail:'Split step + sprint 3m. '+s+'x8 reps',duration:'8min'},{name:'Circuit renforcement',detail:'3 tours: 15 squats + 10 fentes lat + 10 rotations + 30s planche',duration:'12min'},{name:'Épaules & poignet',detail:'Élastique: rotations 3x15, flexion poignet 3x20',duration:'8min'},{name:'Cardio intermittent',detail:s+'x(30s sprint + 30s repos)',duration:'10min'}],notes:'Le padel demande explosivité et agilité. 🏃'}},match:function(){return{name:'🏆 Match',exercises:[{name:'Échauffement',detail:'10min échanges + 5min volées',duration:'15min'},{name:'Match complet',detail:'2 sets complets',duration:'45-60min'},{name:'Analyse',detail:'Points forts/faibles, situations à travailler',duration:'5min'}],notes:'Le match est le meilleur entraînement. 🎾'}},tactics:function(w,lv){var d=lv==='beginner'?[{name:'Contrôle du filet',detail:'Celui au filet gagne 80% des points. Montez !',duration:'15min'},{name:'Lob défensif',detail:'En difficulté: lob haut et profond',duration:'15min'},{name:'Retour de service',detail:'Renvoyer au centre et monter. 20 retours',duration:'15min'},{name:'Points avec consigne',detail:'Pas de smash, patience',duration:'20min'}]:[{name:'Jeu croisé systématique',detail:'Tous les coups croisés sauf opportunité claire',duration:'15min'},{name:'Communication partenaire',detail:'Annonce mía/tuya, changements de côté',duration:'10min'},{name:'Pressing filet',detail:'Enchaînement volée-volée-smash pour conclure',duration:'15min'},{name:'Défense en X',detail:'Position en X, lob croisé pour reprendre',duration:'10min'},{name:'Situations spéciales',detail:'Mur latéral, bajada offensive, contre-attaque',duration:'15min'}];return{name:'🧠 Tactique',exercises:d,notes:'Padel = 70% tactique, 30% technique. 🧠'}},recovery:function(){return{name:'🧘 Récupération',exercises:[{name:'Mobilité épaules',detail:'Rotations, étirements dorsaux, 5min',duration:'5min'},{name:'Mobilité hanches',detail:'90/90, pigeon, fentes rotation, 5min',duration:'5min'},{name:'Foam rolling',detail:'Mollets, quads, IT band, dorsaux, 2min/zone',duration:'10min'},{name:'Yoga/stretching',detail:'Chien tête en bas → cobra → enfant → torsion, 3 tours',duration:'10min'},{name:'Poignet & avant-bras',detail:'Flexion/extension, massage balle tennis',duration:'5min'}],notes:'Essentiel pour prévenir blessures épaule/coude/poignet. 🧘'}}};var tpl={2:[{t:'technique'},{t:'match'}],3:[{t:'technique'},{t:'physical'},{t:'match'}],4:[{t:'technique'},{t:'physical'},{t:'tactics'},{t:'match'}],5:[{t:'technique'},{t:'physical'},{t:'tactics'},{t:'match'},{t:'recovery'}]};var wt=tpl[days]||tpl[3];for(var w=1;w<=totalWeeks;w++){var ws=[];var phase=w<=3?'Fondamentaux':w<=6?'Développement':'Compétition';wt.forEach(function(d,i){var fn=types[d.t];if(fn){var s=fn(w,level);s.dayNumber=i+1;s.type=d.t;ws.push(s)}});program.push({week:w,phase:phase,sessions:ws,isDeload:w===4,notes:w===4?'📉 Semaine légère':w===8?'🏆 Semaine test':phase==='Fondamentaux'?'🎾 Bases techniques et physiques':phase==='Développement'?'📈 Tactique et jeu':'🎯 Préparation compétition'})}return program}
window.generatePadelProgram=generatePadelProgram;

// ─── GOLF ───
var GOLF_LEVELS=[{id:'beginner',name:'Débutant',desc:'< 1 an, HC 36+',icon:'🟢'},{id:'intermediate',name:'Intermédiaire',desc:'1-3 ans, HC 18-36',icon:'🟡'},{id:'advanced',name:'Avancé',desc:'3+ ans, HC 5-18',icon:'🟠'},{id:'scratch',name:'Expert',desc:'HC < 5, compétitions',icon:'🔴'}];
window.GOLF_LEVELS=GOLF_LEVELS;
var GOLF_GOALS=[{id:'start',name:'Débuter',desc:'Bases et carte verte',icon:'🏌️'},{id:'break100',name:'Casser 100',desc:'Passer sous 100',icon:'💯'},{id:'break90',name:'Casser 90',desc:'Scorer sous 90',icon:'📉'},{id:'break80',name:'Casser 80',desc:'Niveau avancé',icon:'🎯'},{id:'compete',name:'Compétition',desc:'Préparer des tournois',icon:'🏆'}];
window.GOLF_GOALS=GOLF_GOALS;
var GOLF_SKILLS=[{id:'driving',name:'Drive',category:'Long jeu'},{id:'iron_long',name:'Fers longs (3-5)',category:'Long jeu'},{id:'iron_mid',name:'Fers moyens (6-8)',category:'Long jeu'},{id:'iron_short',name:'Fers courts (9-PW)',category:'Approche'},{id:'chipping',name:'Chipping',category:'Petit jeu'},{id:'pitching',name:'Pitching',category:'Petit jeu'},{id:'putting',name:'Putting',category:'Putting'},{id:'bunker',name:'Bunker',category:'Petit jeu'},{id:'course_mgmt',name:'Gestion parcours',category:'Mental'},{id:'mental',name:'Mental & Routine',category:'Mental'}];
window.GOLF_SKILLS=GOLF_SKILLS;

function generateGolfProgram(days,level,goal){var program=[];var totalWeeks=8;var types={short_game:function(w,lv){var d=lv==='beginner'?[{name:'Putting distance',detail:'3 cercles: 3 balles à 1m, 2m, 3m. Objectif 8/9',duration:'15min'},{name:'Putting alignement',detail:'2 tees comme rails, 20 putts de 1.5m',duration:'10min'},{name:'Chip basique',detail:'Chip & run fer 8, 20 balles depuis 5m du green',duration:'15min'},{name:'Pitch 30m',detail:'SW depuis 30m, 15 balles. Contact balle-sol',duration:'15min'},{name:'Bunker initiation',detail:'15 balles, face ouverte, frapper sable 5cm avant',duration:'10min'}]:[{name:'Putting cercle pression',detail:'6 balles à 1m. Toutes rentrer. Raté = recommencer',duration:'10min'},{name:'Putting lag 8-12m',detail:'Putts longs, objectif cercle 1m du trou',duration:'10min'},{name:'Chip flop vs bump',detail:'Alternez chip roulé (fer 7) et lobé (LW)',duration:'15min'},{name:'Pitching distances clés',detail:'40m, 50m, 60m. 5 balles chaque. Mesurer dispersion',duration:'15min'},{name:'Bunker contrôle distance',detail:'Sorties à 5m, 10m, 15m. Varier ouverture face',duration:'10min'},{name:'Up & down challenge',detail:'10 positions aléatoires. Objectif 5/10 réussis',duration:'15min'}];return{name:'⛳ Petit jeu (60% du score)',exercises:d,notes:'Dave Pelz: 60% des coups à moins de 100m. ⛳'}},long_game:function(w,lv){var d=lv==='beginner'?[{name:'Échauffement fer 7',detail:'10 balles demi-swings. Contact et direction',duration:'5min'},{name:'Fer 7 full',detail:'20 balles cible 130m. Grip neutre, finish équilibré',duration:'15min'},{name:'Fer 9 précision',detail:'15 balles cible 110m',duration:'10min'},{name:'Driver',detail:'15 balles. Tee haut, sweep ascendant',duration:'15min'},{name:'Routine de tir',detail:'Derrière la balle, alignement, waggle, tir',duration:'10min'}]:[{name:'Échauffement progressif',detail:'SW → PW → 8 → 6 → 4 → Driver, 5/club',duration:'15min'},{name:'Travail de shape',detail:'Fer 7: 5 draws + 5 fades',duration:'15min'},{name:'Fers longs / Hybride',detail:'15 balles fer 5 ou hybride. Cible précise',duration:'10min'},{name:'Driver stratégie',detail:'10 balles. Visez fairway 230m. Régularité > distance',duration:'10min'},{name:'Simulation parcours',detail:'9 trous imaginaires, club approprié chaque situation',duration:'15min'}];return{name:'🏌️ Long jeu',exercises:d,notes:'Le drive impressionne, le putting gagne. 🏌️'}},course_play:function(w,lv){return{name:'⛳ Parcours',exercises:[{name:'Parcours',detail:lv==='beginner'?'9 trous focus tempo et plaisir':'18 trous conditions de score',duration:'2-4h'},{name:'Gestion',detail:'Stratégie conservatrice: centre du green, pas le drapeau',duration:'pendant parcours'},{name:'Notes post-parcours',detail:'Fairways touchés, GIR, putts, up & down',duration:'10min'}],notes:'Appliquez ce que vous avez travaillé. 📊'}},physical:function(){return{name:'💪 Physique golf',exercises:[{name:'Mobilité rotation',detail:'Rotation thoracique 3x10 chaque côté',duration:'8min'},{name:'Stabilité hanche',detail:'Fentes latérales 3x10, single leg RDL 3x8',duration:'10min'},{name:'Force core',detail:'Planche 3x45s, russian twist 3x20, pallof press 3x10',duration:'10min'},{name:'Puissance rotationnelle',detail:'Medicine ball throws: 3x8 rotational, 3x8 overhead',duration:'8min'},{name:'Souplesse',detail:'Hamstrings, épaules, hanches, thoracique. 30s/stretch',duration:'10min'},{name:'Grip & avant-bras',detail:'Squeezes 3x20, wrist curls 3x15',duration:'5min'}],notes:'La distance vient de la rotation et du core, pas des bras. 💪'}},mental:function(){return{name:'🧠 Mental & Routine',exercises:[{name:'Routine pré-tir',detail:'Visualisation, alignement, trigger. 15 balles',duration:'15min'},{name:'Respiration',detail:'Box breathing: 4s inspire, 4s retient, 4s expire, 4s retient',duration:'5min'},{name:'Visualisation',detail:'Fermez les yeux. Jouez le trou le plus dur mentalement',duration:'5min'},{name:'Putting sous pression',detail:'Jeu du 21: putts consécutifs 1m, 1.5m, 2m...',duration:'15min'},{name:'Analyse vidéo',detail:'Filmez votre swing face et DTL. Comparez',duration:'10min'}],notes:'Bob Rotella: "Golf is not a game of perfect." 🧘'}}};var tpl={2:[{t:'short_game'},{t:'course_play'}],3:[{t:'short_game'},{t:'long_game'},{t:'course_play'}],4:[{t:'short_game'},{t:'long_game'},{t:'physical'},{t:'course_play'}],5:[{t:'short_game'},{t:'long_game'},{t:'physical'},{t:'mental'},{t:'course_play'}]};var wt=tpl[days]||tpl[3];for(var w=1;w<=totalWeeks;w++){var ws=[];var phase=w<=3?'Fondamentaux':w<=6?'Développement':'Performance';wt.forEach(function(d,i){var fn=types[d.t];if(fn){var s=fn(w,level);s.dayNumber=i+1;s.type=d.t;ws.push(s)}});program.push({week:w,phase:phase,sessions:ws,isDeload:w===4,notes:w===4?'📉 Semaine légère — jouez pour le plaisir':w===8?'🏆 Parcours test — conditions compétition':phase==='Fondamentaux'?'⛳ Fondations solides':phase==='Développement'?'📈 Technique et stratégie':'🎯 Performance et gestion parcours'})}return program}
window.generateGolfProgram=generateGolfProgram;

// ─── CARDIO PRESCRIPTIONS (ACSM 2018, Tanaka FCmax) ───
function generateCardioPrescription(userAge, userWeight, sportGoals, sportLevel, sex) {
  var fcMax = Math.round(208 - 0.7 * (userAge || 30));
  var isShred = sportGoals && (sportGoals.indexOf('shred') !== -1 || sportGoals.indexOf('weightloss') !== -1);
  var isBulk = sportGoals && sportGoals.indexOf('muscle') !== -1;
  var isEndurance = sportGoals && sportGoals.indexOf('endurance') !== -1;
  var prescriptions = [];
  if (isShred) {
    prescriptions.push({type:'LISS',name:'Marche inclinée (tapis)',duration:sportLevel==='beginner'?25:sportLevel==='intermediate'?35:45,intensity:'Z2 (60-70% FC)',fcTarget:Math.round(fcMax*0.60)+'-'+Math.round(fcMax*0.70)+' bpm',incline:sportLevel==='beginner'?'4-6%':'8-12%',speed:'5-6 km/h',frequency:'3-5x/semaine',timing:'Après la musculation',note:'La marche inclinée est le ROI #1 pour la sèche : brûle les graisses sans détruire le muscle.'});
    prescriptions.push({type:'HIIT',name:'HIIT Sprint/Récup',duration:sportLevel==='beginner'?12:18,intensity:'Z4-Z5 (85-95% FC)',fcTarget:Math.round(fcMax*0.85)+'-'+Math.round(fcMax*0.95)+' bpm',incline:'1-2%',protocol:sportLevel==='beginner'?'6x (20s sprint / 40s marche)':sportLevel==='intermediate'?'8x (30s sprint / 60s trot)':'10x (30s sprint / 30s trot)',frequency:'1-2x/semaine',timing:'Session séparée',note:'HIIT = afterburn effect (EPOC). Brûle des calories 24h après.'});
  }
  if (isBulk) {
    prescriptions.push({type:'LISS',name:'Marche inclinée légère',duration:15,intensity:'Z1-Z2 (55-65% FC)',fcTarget:Math.round(fcMax*0.55)+'-'+Math.round(fcMax*0.65)+' bpm',incline:'2-3%',speed:'5 km/h',frequency:'2-3x/semaine',note:'En prise de masse : cardio MINIMUM. Juste assez pour le cœur.'});
  }
  if (isEndurance) {
    prescriptions.push({type:'LISS',name:'Course endurance fondamentale',duration:sportLevel==='beginner'?25:sportLevel==='intermediate'?35:50,intensity:'Z2 (65-75% FC)',fcTarget:Math.round(fcMax*0.65)+'-'+Math.round(fcMax*0.75)+' bpm',incline:'1-2%',speed:sex==='femme'?'7-9 km/h':'8-11 km/h',frequency:'3-4x/semaine',note:'Endurance fondamentale : vous devez pouvoir parler.'});
    prescriptions.push({type:'INTERVALS',name:'Intervalles VO2max',duration:20,intensity:'Z4-Z5 (88-95% FC)',fcTarget:Math.round(fcMax*0.88)+'-'+Math.round(fcMax*0.95)+' bpm',protocol:sportLevel==='beginner'?'4x (3min Z4 / 2min Z1)':'5x (4min Z4 / 2min Z1)',frequency:'1x/semaine',note:'Le travail de VO2max est le plus efficace pour progresser.'});
  }
  if (!isShred && !isBulk && !isEndurance) {
    prescriptions.push({type:'LISS',name:'Cardio modéré',duration:25,intensity:'Z2 (60-70% FC)',fcTarget:Math.round(fcMax*0.60)+'-'+Math.round(fcMax*0.70)+' bpm',incline:'2-3%',frequency:'2-3x/semaine',note:'Maintien cardiovasculaire. Variez : tapis, vélo, elliptique, rameur.'});
  }
  return {
    fcMax:fcMax,
    zones:[
      {zone:'Z1',name:'Échauffement',range:Math.round(fcMax*0.50)+'-'+Math.round(fcMax*0.60)+' bpm',color:'#C8C8C0'},
      {zone:'Z2',name:'Brûle-graisse',range:Math.round(fcMax*0.60)+'-'+Math.round(fcMax*0.70)+' bpm',color:'#1A4A1A'},
      {zone:'Z3',name:'Aérobie',range:Math.round(fcMax*0.70)+'-'+Math.round(fcMax*0.80)+' bpm',color:'#1A3A6A'},
      {zone:'Z4',name:'Seuil',range:Math.round(fcMax*0.80)+'-'+Math.round(fcMax*0.90)+' bpm',color:'#6A4A1A'},
      {zone:'Z5',name:'Max',range:Math.round(fcMax*0.90)+'-'+fcMax+' bpm',color:'#5A1010'}
    ],
    prescriptions:prescriptions
  };
}
window.generateCardioPrescription = generateCardioPrescription;

// ─── SECURITY: Freeze all constants ───
if (Object.freeze) {
  [ACTIVITIES,TRAINS,SLEEPS,GOALS,RATIOS,COOK_LEVELS,ALLERGIES,INTOLERANCES,REGIMES,CUISINES,MEDICAL,ALCOHOL_DB,ALCOHOL_FREQS,FOOD_HABITS_MEALS,EATING_LOCATIONS,BODY_ZONES,SPORT_GOALS,SPORT_LEVELS,PADEL_LEVELS,PADEL_GOALS,PADEL_SKILLS,GOLF_LEVELS,GOLF_GOALS,GOLF_SKILLS].forEach(function(obj){ try{Object.freeze(obj);}catch(e){} });
}

})();
