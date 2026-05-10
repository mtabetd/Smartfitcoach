/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// app-sport.js — MTD: Sport Module
(function(){
'use strict';
var S = window.S;
// ── Données statiques depuis sport-data.js ──────────────────────────────────
var SPORT_PROGRAM_VERSION = window.SPORT_PROGRAM_VERSION || 3;
var _SPORT_PROGRAM_STEP = window._SPORT_PROGRAM_STEP || {};
var SPORT_QUOTES = window.SPORT_QUOTES || [];
var SPORT_MED_ZONES = window.SPORT_MED_ZONES || {};
var SPORT_MED_NAME = window.SPORT_MED_NAME || {};
var NUTRITION_TO_SPORT_GOAL = window.NUTRITION_TO_SPORT_GOAL || {};
var SPORT_TO_NUTRITION_GOAL = window.SPORT_TO_NUTRITION_GOAL || {};
var CF_DAY_TEMPLATES = window.CF_DAY_TEMPLATES || {};
var MUSCU_MIX_SESSIONS = window.MUSCU_MIX_SESSIONS || [];
var RUNNING_MIX_SESSIONS = window.RUNNING_MIX_SESSIONS || [];
var YOGA_MIX_SESSIONS = window.YOGA_MIX_SESSIONS || [];
var CROSSFIT_MIX_SESSIONS = window.CROSSFIT_MIX_SESSIONS || [];
var CALISTHENICS_MIX_SESSIONS = window.CALISTHENICS_MIX_SESSIONS || [];
var MACRO_PHASES = window.MACRO_PHASES || [];
var MUSCU_PHASES = window.MUSCU_PHASES || [];
var YOGA_SESSIONS = window.YOGA_SESSIONS || {};
var YOGA_WEEKS = window.YOGA_WEEKS || [];
var YOGA_BENEFITS = window.YOGA_BENEFITS || {};
var CYCLING_ZONES = window.CYCLING_ZONES || [];
var CYCLING_MET = window.CYCLING_MET || [];
var CYCLING_WORKOUTS = window.CYCLING_WORKOUTS || {};
var h = window.h, txt = window.txt;

// ─── CROSSFIT LAZY LOADER ───
// CrossFit WOD files (~543KB) are not included in the initial page load.
// They are loaded on-demand only for users with sportType === 'crossfit'.
var _cfLoaded = !!(window.CF_WODS_FULL || window.CF_WODS_CYCLE1); // already loaded (e.g. via SW cache)
var _cfLoading = false;
var _cfCallbacks = [];
function _loadCFScripts(onDone) {
  if (_cfLoaded) { if (onDone) onDone(); return; }
  if (onDone) _cfCallbacks.push(onDone);
  if (_cfLoading) return;
  _cfLoading = true;
  var scripts = [
    './crossfit-wods.js',
    './crossfit-wods-cycle2.js',
    './crossfit-wods-cycle3.js',
    './crossfit-haltero-cycles.js',
    './crossfit-wods-merge.js'
  ];
  var i = 0;
  function next() {
    if (i >= scripts.length) {
      _cfLoaded = true; _cfLoading = false;
      _cfCallbacks.forEach(function(cb) { try { cb(); } catch(e) {} });
      _cfCallbacks = [];
      return;
    }
    var src = scripts[i++];
    // skip if already executed (e.g. loaded via SW)
    if ((src.indexOf('wods.js') !== -1 && window.CF_WODS_CYCLE1) ||
        (src.indexOf('cycle2') !== -1 && window.CF_WODS_CYCLE2) ||
        (src.indexOf('cycle3') !== -1 && window.CF_WODS_CYCLE3) ||
        (src.indexOf('haltero') !== -1 && window.HALTERO_CYCLES) ||
        (src.indexOf('merge') !== -1 && window.CF_WODS_FULL)) {
      next(); return;
    }
    var el = document.createElement('script');
    el.src = src;
    el.onload = next;
    el.onerror = function() { console.warn('[CF lazy] failed:', src); next(); };
    document.head.appendChild(el);
  }
  next();
}

// ─── I3: TERM TOOLTIP HELPER ───
// FIX UX 2026-04-17 : tooltip cliquable sur mobile (title attr seul = invisible iOS/Android).
// Desktop : hover affiche le title natif. Mobile : tap affiche un popover custom.
function termTooltip(term, definition) {
 var span = document.createElement('span');
 span.textContent = term;
 span.title = definition;
 span.setAttribute('aria-label', definition);
 span.setAttribute('role', 'button');
 span.setAttribute('tabindex', '0');
 span.style.cssText = 'border-bottom:1px dotted var(--grey,#6B6B65);cursor:help;';
 span.addEventListener('click', function(e) {
  e.stopPropagation();
  // Ferme les autres tooltips ouverts
  document.querySelectorAll('.sfc-tooltip-pop').forEach(function(el){ el.remove(); });
  var pop = document.createElement('div');
  pop.className = 'sfc-tooltip-pop';
  pop.textContent = definition;
  pop.style.cssText = 'position:fixed;max-width:280px;padding:12px 14px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;line-height:1.5;border:1px solid var(--grey,#6B6B65);border-radius:2px;z-index:10020;pointer-events:auto;';
  var rect = span.getBoundingClientRect();
  var top = rect.bottom + 8;
  var left = Math.max(12, Math.min(rect.left, window.innerWidth - 292));
  pop.style.top = top + 'px';
  pop.style.left = left + 'px';
  document.body.appendChild(pop);
  setTimeout(function(){
   document.addEventListener('click', function _close(){ pop.remove(); document.removeEventListener('click', _close); }, { once: true });
  }, 10);
 });
 return span;
}
// Exposer pour usage nutrition / autres modules
if (typeof window !== 'undefined') window.termTooltip = termTooltip;

// ─── MEDICAL EXERCISE FILTER ───
function filterExerciseByMedical(ex, med) {
 if (!med || !med.done) return true; // pas de filtre

 var n = (ex.n || ex.name || '').toLowerCase();

 // ── ÉPAULES / COIFFE DES ROTATEURS ──
 // Tout mouvement au-dessus de 90° d'abduction + rotation interne forcée = impingement sous-acromial,
 // risque déchirure sus-épineux, tendinite long biceps.
 // Exclure : overhead press (toutes variantes), upright row (TOUJOURS — rotation interne forcée humerus),
 // dips (tension antérieure coiffe), élévations frontales/latérales lourdes, arnold press,
 // développé nuque / behind-neck (compression C4-C6 + impingement), handstand push-up (HSPU).
 // Réf : Ludewig & Cook, Phys Ther 2000 ; Flatow et al., JSES 1994.
 if (med.shoulders || med.rotatorCuff) {
 // FIX 2026-04-17 : regex épaules élargie — bugs découverts en audit muscu live
 //  1) `el[eé]vation` ne matchait pas `Élévations` (É majuscule → lowercase "é") car
 //     le premier char était `e` sans classe d'accent. Corrigé en `[eé]l[eé]vation`.
 //  2) Manquaient : push/strict/z-press (variantes overhead), cable lateral raise,
 //     machine shoulder press, kettlebell press, leaning lateral raise, overhead carry.
 //  Tous ces exos chargent l'épaule au-dessus de 90° d'abduction / en compression axiale
 //  overhead → contre-indiqués en cas de conflit sous-acromial ou lésion coiffe.
 if (/militaire|d[eé]velopp[eé] militaire|developpe militaire|d[eé]velopp[eé] halteres|developpe halteres|arnold press|overhead press|push\s+press|strict\s+press|\bz[\s-]?press\b|[eé]l[eé]vation.*lat[eé]rale|[eé]l[eé]vations?\s+lat[eé]rales?|[eé]l[eé]vation\s+frontale|[eé]l[eé]vations?\s+frontales?|cable\s+lateral\s+raise|machine\s+shoulder\s+press|kettlebell\s+press|leaning\s+lateral\s+raise|overhead\s+carry|dips|upright row|tirage menton|lu raise|behind.?neck|nuque|handstand|hspu/.test(n)) return false;
 }

 // ── COUDES — ÉPICONDYLITE LATÉRALE (tennis elbow) / MÉDIALE (golfer's elbow) ──
 // Rowing barre pronation = valgus forcé + extension poignet sous charge → épicondyle latéral.
 // Pull-ups/chin-ups pronation = traction répétée sur tendon extenseur commun.
 // Curl barre droite = flexion résistée supination → épicondyle médial.
 // Wrist curl = sollicitation directe des fléchisseurs → épicondyle médial (golfer's elbow).
 // Recommander : prise supination ou neutre, extensions poignet légères en rééducation.
 // Réf : Bisset & Vicenzino, JOSPT 2015 ; Coombes et al., Lancet 2013.
 if (med.elbows || med.epicondylitis) {
 // FIX 2026-04-17 : regex coudes élargie — audit muscu trouvait 8 curls + 6 ext. triceps
 // non couverts. Manques : preacher/spider/zottman/drag/reverse/bayesian/cross-body hammer,
 // pushdown, kickback triceps, JM/Tate press, extension overhead. Fix accent `concentr[eé]`.
 // Tous sollicitent épicondyles (médial = flexion supination, latéral = extension pronation).
 if (/curl barre|curl.*halt[eéè]res|curl marteau|curl concentr[eé]|curl pupitre|curl 21|curl [eé]lastique|preacher\s*curl|\bspider\b|bayesian|zottman|drag\s*curl|reverse\s*curl|cross.?body.*hammer|chin.?up|tractions.*pronation|pull.?up.*pronation|skull.?crusher|barre.*front skullcrusher|french press|extension.*triceps?|overhead.*triceps?|extension overhead|pushdown|kickback.*triceps?|jm\s*press|tate\s*press|rowing barre|rowing.*prise large|tirage vertical|wrist curl/.test(n)) return false;
 }

 // ── POIGNETS ──
 // Front squat / OHS = flexion dorsale forcée des poignets sous charge axiale.
 if (med.wrists) {
 if (/curl barre|wrist curl|curl.*poignet|front squat|overhead squat/.test(n)) return false;
 }

 // ── BAS DU DOS / HERNIE DISCALE L4-L5 / L5-S1 ──
 // Compression axiale + flexion lombaire sous charge = augmentation pression intradiscale
 // → herniation / aggravation (Nachemson 1966, McGill 2007).
 // Crunch/sit-up classique = flexion lombaire répétée → déconseillé en hernie active.
 // RDL, rowing buste penché = flexion du tronc sous charge.
 // FIX P1 audit user Marie : ajout clean/snatch/kettlebell swing (mouvements balistiques
 // à fort risque pour le rachis lombaire — McGill 2007, Hartmann et al., Sports Med 2013).
 if (med.lowerBack || med.herniaDisc) {
 if (/soulev[eé].*terre|deadlift|romanian deadlift|rdl|good morning|jefferson|squat barre|back squat|front squat|hack squat|presse.*cuisse|leg press|rowing barre|pendlay row|rowing t.?bar|t.?bar row|crunch|sit.?up|ab wheel|roue abdominal|hyperextension|clean\s*(?:&|and|et)?\s*jerk|\bclean\b|\bsnatch\b|arrach[eé]|[eé]paul[eé]|kettlebell\s+swing|\bswing\b/.test(n)) return false;
 }

 // ── HERNIE INGUINALE ──
 // Valsalva + augmentation pression intra-abdominale = risque d'étranglement herniaire.
 if (med.herniaInguinal) {
 if (/squat|presse.*cuisse|leg press|soulev[eé].*terre|deadlift|hip thrust|burpee/.test(n)) return false;
 }

 // ── GENOUX / LCA ──
 // Leg extension = cisaillement tibio-fémoral antérieur en contraction isolée = stress maximal LCA.
 // Pistol squat / sissy squat = flexion >120° = risque ligamentaire + méniscal.
 // Box jump / jump squat = impact réception = risque re-rupture LCA fragilisé.
 // Squat barre / squat bulgare profond = cisaillement sous charge.
 // Fentes avant = genou dépasse les orteils = cisaillement tibio-fémoral.
 if (med.knees || med.acl) {
 if (/leg extension|pistol squat|sissy squat|jump squat|box jump|fente.*avant|squat bulgare|squat barre/.test(n)) return false;
 }

 // ── HANCHES ──
 if (med.hips) {
 if (/sumo|deep squat|pistol squat|fente laterale/.test(n)) return false;
 }

 // ── CERVICALES / NUQUE ──
 // Shrugs lourds = compression disques cervicaux sous charge axiale.
 // Behind-neck = compression C4-C6 + impingement sous-acromial.
 if (med.neck) {
 if (/shrug|neck press|behind.?neck|derriere.*nuque/.test(n)) return false;
 }

 // ── OSTÉOPOROSE ──
 // (Sinaki & Mikkelsen, JAMA 1984; Sinaki, Spine 2002)
 // Flexion vertébrale répétée → fractures de compression T6-L2 (risque ×5 vs extension).
 // Impacts élevés (sauts) → fractures trabéculaires des plateaux vertébraux.
 // Charges axiales lourdes (squat barre, soulevé de terre) → compression vertébrale directe.
 // NOTE : les exercices en extension et mise en charge LÉGÈRE (marche, squat goblet léger, bird-dog)
 // stimulent l'anabolisme osseux (ostéoblastes) et sont BÉNÉFIQUES — NE PAS SUPPRIMER.
 if (med.osteoporosis) {
 // Impacts élevés — fractures trabéculaires
 if (/box jump|jump squat|burpee|pompes plyometriques|corde.*sauter|jumping jacks/.test(n)) return false;
 // Flexion vertébrale répétée sous charge — fractures de compression T6-L2
 if (/crunch|sit.?up|ab wheel|roue abdominal|cable crunch|dragon flag|windshield wiper|russian twist|jefferson curl/.test(n)) return false;
 // Charges axiales lourdes — compression vertébrale directe
 // FIX 2026-04-17 : ajout front squat, hack squat, presse/leg press — toutes compressions axiales
 // non couvertes précédemment (audit muscu a identifié l'incohérence avec filtre spondylarthrite).
 if (/squat barre|back squat|front squat|hack squat|presse.*cuisse|leg press|soulev[eé].*terre|deadlift|romanian deadlift|rdl|good morning/.test(n)) return false;
 }

 // ── HTA SÉVÈRE (≥180/110 mmHg) ──
 // Valsalva prolongé → pic PA systolique +60 à +100 mmHg (Lamotte et al., Arch Cardiovasc Dis 2015).
 // Arraché/snatch = Valsalva maximal + pic de pression intra-abdominale extrême → contre-indiqué.
 // Isométriques maximaux (L-sit, dragon flag) = augmentation pression artérielle soutenue.
 // Recommandé : cardio Z1-Z2 uniquement (< 65% FCmax), musculation légère RPE max 6/10.
 // Réf : Pescatello et al., Med Sci Sports Exerc 2004 ; AHA/ACSM Joint Position 2007.
 if (med.hypertension) {
 if (/soulev[eé].*terre|deadlift|squat barre|l.?sit|dragon flag|arrac[hé][eé]|snatch|clean.*jerk|windshield wiper/.test(n)) return false;
 }

 // ── POLYARTHRITE RHUMATOÏDE ──
 // (Smolen et al., Ann Rheum Dis 2020 — EULAR guidelines)
 // En poussée : repos articulaire strict. En rémission : exercices doux à intensité modérée.
 // Contre-indiqués : charges lourdes >70% 1RM, impacts répétés, exercices en extension forcée.
 if (med.rheumatoidArthritis) {
 if (/soulev[eé].*terre|deadlift|arraché|snatch|clean|jump squat|box jump|burpee|squat barre/.test(n)) return false;
 }

 // ── MÉNISQUE LÉSÉ / OPÉRÉ ──
 // Flexion >90° sous charge = compression méniscale → déchirure ou aggravation.
 // Cisaillement en rotation (fentes, pivot squat) = risque méniscal.
 if (med.meniscus) {
 if (/leg extension|pistol squat|sissy squat|squat bulgare|fente.*avant|jump squat|box jump/.test(n)) return false;
 }

 // ── FIBROMYALGIE ──
 // (Häuser et al., Cochrane 2017 ; EULAR recommendations 2017)
 // Exercices à haute intensité = amplification centrale de la douleur (central sensitization).
 // Contre-indiqués : HIIT intense, efforts maximaux, charges lourdes.
 // Recommandés : aérobie léger, stretching, yoga, natation (remise en forme progressive).
 if (med.fibromyalgia) {
 if (/soulev[eé].*terre|deadlift|squat barre|burpee|box jump|jump squat|pompes plyometriques/.test(n)) return false;
 }

 // ── PIEDS / FASCIITE PLANTAIRE ──
 // Impacts répétés + charge sur les pieds = aggravation fasciite plantaire.
 if (med.feet) {
 if (/corde.*sauter|box jump|jump squat|burpee|course|jogging|jumping jacks/.test(n)) return false;
 }

 // ── SPONDYLARTHRITE ANKYLOSANTE ──
 // (Sieper & Poddubnyy, Lancet 2017 — ASAS guidelines)
 // Charges axiales lourdes = contrainte sur enthèses vertébrales et sacro-iliaques → déconseillées.
 // Flexion du tronc sous charge (deadlift, good morning) = stress axial aggravant.
 // Recommandés : natation, yoga, étirements quotidiens maintiennent mobilité rachidienne.
 if (med.spondylarthritis) {
 if (/soulev[eé].*terre|deadlift|romanian deadlift|rdl|good morning|jefferson|squat barre|back squat|hack squat|presse.*cuisse|leg press|rowing barre|pendlay row|rowing t.?bar|t.?bar row|crunch|sit.?up|ab wheel|roue abdominal|hyperextension/.test(n)) return false;
 }

 // ── GONARTHROSE (arthrose du genou) ──
 // (OAR SI 2014, EULAR 2018 — osteoarthritis knee)
 // Flexion profonde du genou sous charge = aggravation douleur compartiment médial/latéral.
 // Impacts répétés = dégradation du cartilage.
 // Recommandés : vélo stationnaire, natation, musculation légère en amplitude limitée.
 if (med.kneeOsteoarthritis) {
 if (/leg extension|pistol squat|sissy squat|jump squat|box jump|fente.*avant|squat bulgare|squat barre|burpee|corde.*sauter|jogging|course|soulev[eé].*terre|deadlift/.test(n)) return false;
 }

 return true;
}

// ─── ALERTE GROSSESSE SPORT (ACOG 2020, IOC 2018) ───
// Renvoie un message d'alerte si S.pregnant et conditions dangereuses détectées.
// ACOG 2020 : Contre-indications T2/T3 — décubitus dorsal >20 min (compression veine cave inférieure),
// Valsalva (squat lourd, soulevé de terre), sports de contact, altitude >2500m.
// 150 min/semaine d'activité modérée recommandées (ACOG 2020, OMS 2020).
function getPregnancySportWarning() {
 var s = window.S;
 if (!s || !s.pregnant || !window.isFemale(s)) return null;
 var week = s.pregnancyWeek || 0;
 if (week < 14) {
 // T1 : nausées, fatigue → intensité réduite, pas de sur-échauffement
 return ' Grossesse T1 (sem. 1-13) : Activité physique modérée recommandée (150 min/sem, ACOG 2020). Évitez le sur-échauffement (>38,5°C). Consultez votre obstétricien avant tout programme intensif.';
 } else if (week < 28) {
 // T2 : veine cave — décubitus dorsal contre-indiqué
 return ' Grossesse T2 (sem. 14-27, ACOG 2020) : (1) Évitez le décubitus dorsal prolongé >20 min — compression de la veine cave inférieure. (2) Pas de Valsalva (squat lourd, soulevé de terre) — risque de chute de pression. (3) Sports de contact contre-indiqués. Exercices recommandés : natation, marche, vélo stationnaire, yoga prénatal.';
 } else {
 // T3 : mêmes contre-indications + risque chute de l'équilibre
 return ' Grossesse T3 (sem. 28+, ACOG 2020) : (1) Décubitus dorsal INTERDIT. (2) Valsalva interdit (soulevé de terre, squat lourd, développé couché). (3) Sports de contact et à risque de chute contre-indiqués. (4) Équilibre altéré — préférez exercices guidés ou en appui. Consultez votre obstétricien avant chaque modification du programme.';
 }
}

// ─── PROGRAM GENERATION ───
// Version du générateur — incrémentée à chaque fix qui change la sortie du programme.
// Si le programme stocké a une version inférieure, il sera automatiquement régénéré.

function generateSportProgram() {
 var S = window.S; // always use current state (module-level S may be stale if replaced)
 // Guard: this function only handles 'musculation'. Other sport types use their own generators.
 if (!S || !S.sportType) {
   console.error('[generateSportProgram] S.sportType is null/undefined — aborting');
   return [];
 }
 if (S.sportType !== 'musculation') {
   console.warn('[generateSportProgram] Called for non-musculation sport:', S.sportType, '— delegating');
   return [];
 }
 // Normalize S.sportEquipment — prevents crashes on null / array inputs.
 // null  → 'gym' (safe default), array → first element or 'gym', string → unchanged.
 if (!S.sportEquipment) {
   S.sportEquipment = 'gym';
 } else if (Array.isArray(S.sportEquipment)) {
   S.sportEquipment = S.sportEquipment[0] || 'gym';
 }
 // FIX 2026-04-16 : clamp days 2-6 — 1 jour/sem n'a pas de split muscu viable
 var days = Math.min(6, Math.max(2, S.sportDays || 3));
 if (!S.sportDays && window.showToast) {
   window.showToast((window.isEnglish && window.isEnglish()) ? 'No training days set — 3 days/week applied by default.' : 'Aucun jour saisi — programme sur 3 j/sem appliqué par défaut.', 'info', 3000);
 }
 var level = (window.SPORT_LEVELS || []).find(function(l){ return l.id === S.sportLevel; });
 var program = [];

 // ═══ FIX P0 SPRINT 2026-04-16 — AUTO-SET _splitChoice AVANT génération ═══
 // Avant : _splitChoice n'était initialisé que dans le RENDER du step 4 (split selector).
 // Mais generateSportProgram() est appelé à la transition step 3 → 4.
 // Conséquence : première génération avec _splitChoice=null → algorithme fréquence libre
 // → épaules sur jour Legs, dos sur jour Push, etc. Bug critique "Arnold Press sur Leg A".
 // Maintenant : on auto-set _splitChoice ICI si l'user est intermediate+ et n'a pas encore choisi.
 var _isIntermediatePlus = S.sportLevel === 'intermediate' || S.sportLevel === 'advanced' || S.sportLevel === 'pro';
 // Beginners on 3 days default to fullbody (2×/week per muscle group — Schoenfeld 2016 meta-analysis)
 // PPL for beginners concentrates volume on one day per muscle group, which is sub-optimal for adaptation
 var _isBeginner = S.sportLevel === 'beginner' || S.sportLevel === 'debutant';
 var _DEFAULT_SPLITS = _isBeginner
   ? { 2:'fullbody_ab', 3:'fullbody_3', 4:'upper_lower', 5:'ppl_5', 6:'ppl_6' }
   : { 2:'fullbody_ab', 3:'ppl_3',      4:'upper_lower', 5:'ppl_5', 6:'ppl_6' };
 // Valider que le _splitChoice existant correspond au nombre de jours actuel
 var _VALID_SPLITS_PER_DAY = {
   2:['fullbody_ab'], 3:['fullbody_3','ppl_3'], 4:['upper_lower','ppl_plus1','bro_4'],
   5:['ppl_5','bro_5'], 6:['ppl_6']
 };
 // FIX P0 2026-04-20: apply split validation to ALL levels, not just intermediate+.
 // A beginner with bro_4 set (4-day split) and days=3 would silently drop the Legs day.
 if (days >= 2) {
   var _validForDays = _VALID_SPLITS_PER_DAY[days] || [];
   if (!S._splitChoice || _validForDays.indexOf(S._splitChoice) === -1) {
     S._splitChoice = _DEFAULT_SPLITS[days] || _DEFAULT_SPLITS[Math.min(6, Math.max(2, days))] || null;
   } else if (_isBeginner && S._splitChoice === 'ppl_3' && days === 3) {
     S._splitChoice = 'fullbody_3';
   }
 }

 // Adjust splits based on goals
 var _goals = S.sportGoals || [];
 var hasCardio = _goals.some(function(g){ return g === 'endurance' || g === 'weightloss' || g === 'shred'; });
 var hasMuscle = _goals.some(function(g){ return g === 'muscle'; });
 var hasShred = _goals.indexOf('shred') !== -1;
 var hasEndurance = _goals.indexOf('endurance') !== -1;
 var hasWeightloss = _goals.indexOf('weightloss') !== -1;
 var hasFlexibility = _goals.indexOf('flexibility') !== -1;
 var hasStrength = _goals.indexOf('strength') !== -1 || _goals.indexOf('force') !== -1;

 // Map zone names to exercise categories
 var zoneToCategory = {
 'Poitrine': 'chest', 'Dos': 'back', 'Épaules': 'shoulders',
 'Trapèzes': 'traps', 'Bras': ['biceps', 'triceps'], 'Avant-bras': 'forearms',
 'Abdominaux': 'abs', 'Jambes': 'legs', 'Mollets': 'calves',
 'Fessiers': 'glutes', 'Cardio': 'cardio'
 };

 // Sort zones by priority (highest first)
 var _focus = S.sportFocus || {};
 var priorityZones = Object.keys(_focus)
 .filter(function(z){ return _focus[z] > 0; })
 .sort(function(a, b){ return _focus[b] - _focus[a]; });

 // Flatten zone name to categories array
 function zoneCategories(zoneName) {
 var cat = zoneToCategory[zoneName];
 if (!cat) return [];
 return Array.isArray(cat) ? cat : [cat];
 }

 // Determine exercise count based on priority and user level
 // beginner: pri 5 = 2-3, 4 = 2, 3 = 1-2, 2 = 1, 1 = 1
 // intermediate: pri 5 = 3-4, 4 = 3, 3 = 2-3, 2 = 2, 1 = 1-2 (original)
 // advanced: pri 5 = 4-5, 4 = 4, 3 = 3-4, 2 = 2-3, 1 = 2
 // FIX DÉTERMINISME MUSCU 2026-04 : suppression des Math.round(Math.random()) dans le
 // count d'exercices par priorité. Même profil = même count.
 // FIX F8 CONTRE-AUDIT 2026-04 : MÉDIANES (pas bornes hautes) pour éviter surentraînement.
 // Avant : j'avais pris la borne haute pour chaque niveau (+15 à +25% vs médiane originale)
 //         → un débutant passait de 8-9 exos/sem à 11 → DOMS sévères, contradict ACSM.
 // Maintenant : médiane mathématique des anciennes fourchettes :
 //   - beginner pri 5 : ancien 2+random(0-1) = 2-3, médiane 2 (au lieu de 3)
 //   - beginner pri 3 : ancien 1-2, médiane 1 (au lieu de 2)
 //   - intermediate pri 5 : ancien 3-4, médiane 3 (au lieu de 4)
 //   - intermediate pri 1 : ancien 1-2, médiane 1 (au lieu de 2)
 //   - advanced pri 5 : ancien 4-5, médiane 4 (au lieu de 5)
 //   - advanced pri 3 : ancien 3-4, médiane 3 (au lieu de 4)
 //   - advanced pri 2 : ancien 2-3, médiane 2 (au lieu de 3)
 // Progression respectueuse ISSN 2017 + ACSM (≤10% hausse volume/semaine).
 // FIX DÉTERMINISME MUSCU 2026-04 : médianes déterministes (cf. bloc commenté ci-dessus).
 // FIX 2026-04-28 : duration-aware — 1h15/1h30 génèrent plus d'exercices par groupe pour
 // correspondre au volume demandé (NSCA CSCS §18 : volume = f(durée séance)).
 function exerciseCountForPriority(pri) {
 var lvl = S.sportLevel || 'intermediate';
 // +1 pour 1h15, +2 pour 1h30 — plafonné par durMax à l'étape cap
 var _dur = S.sportSessionDuration || '';
 var _dAdd = _dur === '1h30' ? 2 : _dur === '1h15' ? 1 : 0;
 if (lvl === 'beginner') {
   var _b = pri >= 5 ? 2 : pri === 4 ? 2 : pri >= 3 ? 1 : 1;
   return Math.min(4, _b + (_dAdd > 0 ? 1 : 0));
 } else if (lvl === 'pro') {
 // FIX 2026-04-16 : pro était traité comme intermediate (tombait dans else).
 // Pro = athlète confirmé, volume supérieur à advanced (NSCA CSCS guidelines).
   var _p = pri >= 5 ? 5 : pri === 4 ? 4 : pri >= 3 ? 3 : 3;
   return _p + _dAdd;
 } else if (lvl === 'advanced') {
   var _a = pri >= 5 ? 4 : pri === 4 ? 4 : pri >= 3 ? 3 : 2;
   return _a + _dAdd;
 } else {
 // intermediate
   var _i = pri >= 5 ? 3 : pri === 4 ? 3 : pri >= 3 ? 2 : 2;
   return Math.min(5, _i + _dAdd);
 }
 }

 // Maximum total exercises per session by level (BUG-18)
 // FIX 2026-04-16 : ajout 'pro' (était traité comme intermediate → 12 au lieu de 16-18)
 var maxExercisesPerSession = S.sportLevel === 'beginner' ? 8
 : S.sportLevel === 'pro' ? 18
 : S.sportLevel === 'advanced' ? 16
 : 12;

 // Determine how many days each zone appears based on priority
 // 5-star: 60-70%, 4: 50-60%, 3: 40-50%, 2: 30-40%, 1: 20-30%
 function daysForPriority(pri, totalDays) {
 var pct;
 if (pri >= 5) pct = 0.65;
 else if (pri === 4) pct = 0.55;
 else if (pri === 3) pct = 0.45;
 else if (pri === 2) pct = 0.35;
 else pct = 0.25;
 return Math.max(1, Math.round(totalDays * pct));
 }

 // Build a frequency map: for each category, how many days it should appear
 var categoryFrequency = {};
 var categoryPriority = {};
 priorityZones.forEach(function(zone) {
 var pri = S.sportFocus[zone];
 var cats = zoneCategories(zone);
 cats.forEach(function(cat) {
 categoryFrequency[cat] = daysForPriority(pri, days);
 categoryPriority[cat] = pri;
 });
 });

 // ═══ FIX P1 2026-04-16 — weakZones boost dans generateSportProgram ═══
 // Avant : S.weakZones n'était affiché que dans l'UI ("⚡ À renforcer") mais IGNORÉ
 // par le générateur. Un user avec weakZones=['Jambes'] ne recevait aucun boost.
 // Maintenant : +1 priorité (cap 5) + fréquence recalculée pour les zones faibles.
 // Cohérent avec buildPersonalizedMuscuPlan qui applique +30% volume (muscu-programs.js:2491).
 if (Array.isArray(S.weakZones) && S.weakZones.length > 0) {
   S.weakZones.forEach(function(wz) {
     var cats = zoneCategories(wz);
     cats.forEach(function(cat) {
       var currentPri = categoryPriority[cat] || 0;
       if (currentPri > 0 && currentPri < 5) {
         categoryPriority[cat] = Math.min(5, currentPri + 1);
         categoryFrequency[cat] = daysForPriority(categoryPriority[cat], days);
       } else if (currentPri === 0) {
         // Zone faible non sélectionnée par l'user → ajouter avec priorité 3 (moyenne)
         categoryPriority[cat] = 3;
         categoryFrequency[cat] = daysForPriority(3, days);
       }
     });
   });
 }

 // If cardio-focused goals, ensure cardio appears if not already selected
 if (hasCardio || hasShred) {
 if (!categoryFrequency['cardio']) {
 categoryFrequency['cardio'] = Math.max(1, Math.round(days * 0.5));
 categoryPriority['cardio'] = 2;
 }
 }

 // Get all categories sorted by priority (highest first)
 var allCategories = Object.keys(categoryFrequency).sort(function(a, b) {
 return (categoryPriority[b] || 0) - (categoryPriority[a] || 0);
 });

 // Build day splits: distribute categories across days based on frequency
 var daySplits = [];
 for (var d = 0; d < days; d++) { daySplits.push([]); }

 allCategories.forEach(function(cat) {
 var freq = categoryFrequency[cat];
 // Spread this category across freq days, starting from the day with fewest categories
 var dayIndices = [];
 for (var i = 0; i < days; i++) dayIndices.push(i);
 // Sort days by current load (fewest categories first)
 dayIndices.sort(function(a, b) { return daySplits[a].length - daySplits[b].length; });
 for (var j = 0; j < Math.min(freq, days); j++) {
 daySplits[dayIndices[j]].push(cat);
 }
 });

 // Sort each day's categories by priority (highest first = trained when energy is highest)
 daySplits.forEach(function(dayCats) {
 dayCats.sort(function(a, b) {
 return (categoryPriority[b] || 0) - (categoryPriority[a] || 0);
 });
 });

 // ── Adjacency repair : même muscle 2 jours de suite → violation ACSM 48-72h ─
 // Ex: legs J1+J2 → transfert legs vers J3+ si disponible.
 // Ne tourne que si pas de split structuré (PPL/Upper-Lower gèrent déjà l'espacement).
 if (!S._splitChoice) {
   var _adjPasses = 2; // 2 passes suffisent pour les cas courants à 3-6 jours
   for (var _ap = 0; _ap < _adjPasses; _ap++) {
     for (var _ad = 0; _ad < days - 1; _ad++) {
       for (var _ci = 0; _ci < daySplits[_ad].length; _ci++) {
         var _cat = daySplits[_ad][_ci];
         var _nextIdx = daySplits[_ad + 1].indexOf(_cat);
         if (_nextIdx === -1) continue; // pas de conflit sur ce jour
         // Cherche un jour alternatif (≥ _ad+2) sans conflit d'adjacence
         for (var _alt = _ad + 2; _alt < days; _alt++) {
           var _prevOk = (_alt === 0) || daySplits[_alt - 1].indexOf(_cat) === -1;
           var _nextOk = (_alt >= days - 1) || daySplits[_alt + 1].indexOf(_cat) === -1;
           if (_prevOk && _nextOk) {
             daySplits[_ad + 1].splice(_nextIdx, 1);
             daySplits[_alt].push(_cat);
             // Re-sort jour de destination par priorité
             daySplits[_alt].sort(function(a, b) {
               return (categoryPriority[b] || 0) - (categoryPriority[a] || 0);
             });
             break;
           }
         }
       }
     }
   }
 }

 // ── Split-aware daySplits override ──────────────────────────────────────────
 // When a structured split is chosen (Upper/Lower, PPL, etc.), override daySplits
 // to enforce strict upper/lower/push/pull/legs boundaries.
 // Without this, the frequency-based algorithm can put "shoulders" on a "Lower A" day.
 if (S._splitChoice && days >= 2) {
   var _UPPER_C = {chest:1, back:1, shoulders:1, traps:1, biceps:1, triceps:1, forearms:1, abs:1};
   var _LOWER_C = {legs:1, glutes:1, calves:1};
   var _PUSH_C  = {chest:1, shoulders:1, triceps:1};
   var _PULL_C  = {back:1, traps:1, biceps:1, forearms:1};
   // FIX P0 2026-04-16 : ajout biceps/triceps/abs manquants — sinon fullbody drops user focus
   var _FULL_C  = {chest:1, back:1, shoulders:1, traps:1, legs:1, glutes:1, calves:1, biceps:1, triceps:1, forearms:1, abs:1};
   var _SPLIT_TMPL = {
     'upper_lower': ['upper','lower','upper','lower'],
     'ppl_3':       ['push','pull','legs'],
     'ppl_plus1':   ['push','pull','legs','upper'],
     'ppl_5':       ['push','pull','legs','push','pull'],
     'ppl_6':       ['push','pull','legs','push','pull','legs'],
     'fullbody_ab': ['full','full'],
     'fullbody_3':  ['full','full','full'],
     'bro_4':       ['chest_tri','back_bi','shoulders_only','legs'],
     'bro_5':       ['chest_only','back_only','shoulders_only','arms','legs']
   };
   var _CAT_FOR_TYPE = {
     'upper':          _UPPER_C,
     'lower':          _LOWER_C,
     'push':           _PUSH_C,
     'pull':           _PULL_C,
     'legs':           _LOWER_C,
     'full':           _FULL_C,
     'chest_tri':      {chest:1, triceps:1},
     'back_bi':        {back:1, traps:1, biceps:1, forearms:1},
     'shoulders_only': {shoulders:1, traps:1},
     'chest_only':     {chest:1},
     'back_only':      {back:1, traps:1},
     'arms':           {biceps:1, triceps:1, forearms:1}
   };
   var _dayTypes = _SPLIT_TMPL[S._splitChoice];
   if (_dayTypes) {
     for (var _sd = 0; _sd < Math.min(days, _dayTypes.length); _sd++) {
       var _dtype = _dayTypes[_sd];
       var _allowed = _CAT_FOR_TYPE[_dtype] || {};
       var _filtered = allCategories.filter(function(cat) { return !!_allowed[cat]; });
       // Fallback: if user hasn't set sportFocus for those muscles, use defaults
       if (_filtered.length === 0) {
         if (_dtype === 'upper')          _filtered = ['chest','back','shoulders'];
         else if (_dtype === 'push')      _filtered = ['chest','shoulders','triceps'];
         else if (_dtype === 'pull')      _filtered = ['back','biceps'];
         else if (_dtype === 'lower' || _dtype === 'legs') {
           // FIX 2026-04-24: only fall back to legs/glutes if user actually selected lower body.
           // A beginner who picked only upper-body zones should NOT get a legs day on PPL/upper-lower.
           var _hasLowerCats = allCategories.some(function(c){ return c==='legs'||c==='glutes'; });
           if (_hasLowerCats) {
             _filtered = ['legs','glutes'];
           } else {
             // No lower-body zone selected — fill the day with the user's upper-body categories
             _filtered = allCategories.filter(function(c){ return !!_UPPER_C[c]; });
             if (!_filtered.length) _filtered = allCategories.slice();
             if (!_filtered.length) _filtered = ['chest','back','shoulders'];
           }
         }
         // FIX 2026-04-21 — fullbody fallback complet (avant : manquait biceps/triceps/abs cf _FULL_C ligne 445)
         else if (_dtype === 'full')      _filtered = ['chest','back','shoulders','legs','glutes','biceps','triceps','abs'];
         else if (_dtype === 'chest_tri') _filtered = ['chest','triceps'];
         else if (_dtype === 'back_bi')   _filtered = ['back','biceps'];
         else if (_dtype === 'shoulders_only') _filtered = ['shoulders'];
         else if (_dtype === 'chest_only') _filtered = ['chest'];
         else if (_dtype === 'back_only') _filtered = ['back'];
         else if (_dtype === 'arms')      _filtered = ['biceps','triceps','forearms'];
         else _filtered = ['chest','back','shoulders','legs','glutes','biceps','triceps','abs']; // safe fallback
       }
       // FIX 2026-04 : garantir les catégories synergiques minimales même quand l'user
       // n'a pas explicitement coché la zone dans sportFocus.
       // Ex: user coche "Jambes" mais pas "Fessiers" → jour Legs = ['legs'] seul → 2 exos seulement.
       // Sans ce fix, Lower/Legs day d'un débutant a 2 exercices au lieu de 4+.
       // Only add glutes synergy when 'legs' is actually in the filtered set (lower-body day)
       if ((_dtype === 'lower' || _dtype === 'legs') && _filtered.indexOf('glutes') === -1 && _filtered.some(function(c){ return c === 'legs'; }))
         _filtered = _filtered.concat(['glutes']);
       // Calves synergy : seulement si l'user a sélectionné Mollets (pas forcé comme glutes)
       if ((_dtype === 'lower' || _dtype === 'legs') && _filtered.indexOf('calves') === -1 && _filtered.some(function(c){ return c === 'legs'; }) && allCategories.indexOf('calves') !== -1)
         _filtered = _filtered.concat(['calves']);
       if (_dtype === 'push' && _filtered.indexOf('triceps') === -1)
         _filtered = _filtered.concat(['triceps']);
       if ((_dtype === 'pull' || _dtype === 'back_bi') && _filtered.indexOf('biceps') === -1)
         _filtered = _filtered.concat(['biceps']);
       if (_dtype === 'chest_tri' && _filtered.indexOf('triceps') === -1)
         _filtered = _filtered.concat(['triceps']);
       // Re-sort by priority
       _filtered.sort(function(a, b) { return (categoryPriority[b] || 0) - (categoryPriority[a] || 0); });
       daySplits[_sd] = _filtered;
     }
   }
 }
 // ────────────────────────────────────────────────────────────────────────────

 // Determine rest and rep adjustments based on goals
 var restOverride = null;
 var repSuffix = '';
 var supersetNote = '';
 if (hasShred) {
 restOverride = '45-60s';
 repSuffix = ' (haute intensité)';
 supersetNote = ' — Superset recommandé';
 } else if (hasStrength) {
 // FIX P2 2026-04-16 — goal 'strength'/'force' était ignoré dans generateSportProgram.
 // Force = repos longs (3-5 min), séries basses (3-6 reps), charges lourdes (NSCA 2016).
 restOverride = '180-300s';
 repSuffix = ' (force)';
 } else if (hasMuscle) {
 restOverride = '90-120s';
 repSuffix = '';
 } else if (hasWeightloss) {
 // ACSM 2009: beginners need 60-90s minimum to maintain form — 30-45s is intermediate+
 restOverride = _isBeginner ? '60-90s' : '30-45s';
 repSuffix = _isBeginner ? '' : ' (circuit)';
 }

 // Pregnancy: get trimester info for filtering
 var pregTri = null;
 var pregForbidden = [];
 var pregIntensityFactor = 1.0;
 if (S.pregnant && window.isFemale(S) && window.getPregnancyTrimester) {
 pregTri = window.getPregnancyTrimester();
 if (pregTri && pregTri.trimester) {
 pregForbidden = pregTri.trimester.forbiddenExercises || [];
 pregIntensityFactor = pregTri.trimester.intensityFactor || 0.5;
 }
 }
 // Cycle phase: get intensity factor for menstrual cycle phase (non-pregnant women)
 var cycleIntensityFactor = 1.0;
 var cyclePhaseInfo = null;
 if (!S.pregnant && window.isFemale(S) && S.cycleTracking && window.getCurrentCyclePhase) {
 cyclePhaseInfo = window.getCurrentCyclePhase();
 if (cyclePhaseInfo && cyclePhaseInfo.phase && cyclePhaseInfo.phase.intensityFactor) {
 cycleIntensityFactor = cyclePhaseInfo.phase.intensityFactor;
 }
 }

 // BUG-10: Track how many times each group has appeared this week (intra-week progression)
 var groupWeekOccurrence = {};
 // Cross-week deduplication: track exercise names already used this week so the same
 // exercise never appears on two different days (e.g. JM Press in Upper A AND Upper B).
 var weekUsedNames = {};

 // Generate exercises for each day
 var maxLv = S.sportLevel === 'beginner' ? 2 : S.sportLevel === 'intermediate' ? 3 : 3; // lv:4 not yet in DB — cap at 3
 // During pregnancy, cap level
 if (pregTri) maxLv = Math.min(maxLv, 2);

 // Exos minimum par durée — dérivé de SFCConstants.MIN_SETS_PER_SESSION (÷3 sets/exo).
 // Fallback = valeurs NSCA directes si SFCConstants non chargé.
 var _minExosByDur = (function() {
   var mss = (typeof window !== 'undefined' && window.SFCConstants && window.SFCConstants.MIN_SETS_PER_SESSION) || {};
   return {
     '45min': mss['45min'] ? Math.round(mss['45min'] / 3) : 3,
     '1h':    mss['1h']    ? Math.round(mss['1h']    / 3) : 4,
     '1h15':  mss['1h15']  ? Math.round(mss['1h15']  / 3) : 5,
     '1h30':  mss['1h30']  ? Math.round(mss['1h30']  / 3) : 6
   };
 }());

 for (var d = 0; d < days; d++) {
 var groups = daySplits[d];
 if (!groups.length) continue;
 var dayExercises = [];


 // ── Pré-pipeline : durée · niveau · réglages médicaux ─────────────────────
 var _isBeginner = (S.sportLevel === 'beginner' || S.sportLevel === 'debutant' || !S.sportLevel);
 var _dur = S.sportSessionDuration;
 var _durMax  = _dur === '45min' ? 5 : _dur === '1h' ? 6 : _dur === '1h15' ? 7 : 8;
 var _durSets = (_dur === '1h15' || _dur === '1h30') ? 4 : 3;
 // Objectif muscle : +1 exo sur les jours sans cardio
 if (hasMuscle && groups.indexOf('cardio') === -1) _durMax = Math.min(_durMax + 1, maxExercisesPerSession);
 // Grossesse : réduire le volume selon le trimestre
 if (pregTri) _durMax = Math.max(1, Math.round(_durMax * pregIntensityFactor));
 // Cycle menstruel : légère réduction
 if (!pregTri && cycleIntensityFactor < 0.9) _durMax = Math.max(1, Math.round(_durMax * cycleIntensityFactor));
 // Cap absolu par niveau
 _durMax = Math.min(_durMax, maxExercisesPerSession);

 // ── Périodisation SFCSymbiosis : overlay durMax / durSets / repos ─────────
 if (window.SFCSymbiosis && window.SFCSymbiosis.getPeriodizationCfg) {
   var _perioCfg = window.SFCSymbiosis.getPeriodizationCfg(window.SFCSymbiosis.getWeekIndex());
   _durMax  = Math.min(_durMax, _perioCfg.durMax);           // S4 deload plafonne le volume
   // Garantir le plancher lié à la préférence utilisateur — évite les séances < 30 min en décharge.
   if (_dur) { var _durFloor = _minExosByDur[_dur] || 3; if (_durMax < _durFloor) _durMax = _durFloor; }
   _durSets = _perioCfg.durSets || _durSets;                  // S3 +1 série / S4 -1 série
   // restOverride : périodisation n'écrase pas les objectifs shred/force (priorité goal)
   if (_perioCfg.restOverride && !hasShred && !hasStrength) {
     restOverride = _perioCfg.restOverride;
   } else if (_perioCfg.restOverride && (hasShred || hasStrength)) {
     console.log('[generateSportProgram] restOverride ignoré (priorité goal:', hasShred ? 'shred' : 'strength', '> périodisation', _perioCfg.restOverride, ')');
   }
 }
 // ── Signal nutrition→training (SFCDecisionCore.getVolumeModifier) ──────────
 // Branché en runtime : réduit _durMax si déficit calorique > 300 kcal ou fatigue élevée.
 // Plancher durée respecté — ne tombe jamais sous le minimum de la préférence utilisateur.
 if (window.SFCDecisionCore) {
   try {
     var _sfcVolMod = window.SFCDecisionCore.getVolumeModifier();
     if (typeof _sfcVolMod === 'number' && _sfcVolMod < 1.0) {
       var _sfcFloor = _dur ? (_minExosByDur[_dur] || 3) : 3;
       _durMax = Math.max(_sfcFloor, Math.round(_durMax * _sfcVolMod));
     }
   } catch(_e) {}
 }

 // Construire les regexes médicales (pont S.medical) une seule fois par jour
 var _medRx = [];
 if (Array.isArray(S.medical) && S.medical.length > 0) {
   var _mL = S.medical.map(function(m){ return String(m).toLowerCase(); });
   if (_mL.indexOf('osteoporose') !== -1 || _mL.indexOf('osteoporosis') !== -1)
     _medRx.push(/squat\s+barre|back\s+squat|front\s+squat|soulev[eé]\s+de\s+terre|deadlift|romanian|good\s+morning|crunch|sit.?up|ab\s+wheel|jefferson|hyperextension|box\s+jump|jump\s+squat|burpee|corde|jumping\s+jacks|\bpower\s+clean\b|\bclean\b|\bsnatch\b|arrach[eé]|[eé]paul[eé]|hang\s+clean|hack\s+squat|zercher/i);
   if (_mL.indexOf('hypertension') !== -1 || _mL.indexOf('hta') !== -1 || _mL.indexOf('hta_severe') !== -1)
     _medRx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre|back\s+squat|front\s+squat|d[eé]velopp[eé]\s+militaire\s+barre|d[eé]velopp[eé]\s+couch[eé]\s+barre|bench\s+press\s+(?:barre|barbell)|behind.?neck|derri[eè]re\s+nuque|\bsnatch\b|arrach[eé]|clean|[eé]paul[eé]|jerk|thruster|l.?sit|dragon\s+flag|windshield|hack\s+squat/i);
   if (_mL.indexOf('cardio') !== -1 || _mL.indexOf('insuffisance_card') !== -1)
     _medRx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre\s+lourd|\bsnatch\b|\bclean\b|burpee|box\s+jump|hiit/i);
   if (_mL.indexOf('polyarthrite') !== -1 || _mL.indexOf('rheumatoid') !== -1 || _mL.indexOf('arthrite') !== -1)
     _medRx.push(/soulev[eé]\s+de\s+terre|deadlift|arrach[eé]|snatch|clean|jump\s+squat|box\s+jump|burpee|squat\s+barre/i);
   if (_mL.indexOf('fibromyalgie') !== -1)
     _medRx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre|burpee|box\s+jump|jump\s+squat|pompes\s+plyo/i);
   if (_mL.indexOf('irc') !== -1)
     _medRx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre|back\s+squat|front\s+squat|\bsnatch\b|arrach[eé]|\bclean\b|[eé]paul[eé]|jerk|thruster|burpee|box\s+jump|jump\s+squat/i);
 }

 // ════════════════════════════════════════════════════════════════════════════
 // PIPELINE GÉNÉRATION SÉANCE MUSCU — délégué à muscu-engine.js
 // Source unique de vérité : window.sfcBuildMuscuDay (chargé avant app-sport.js)
 // ════════════════════════════════════════════════════════════════════════════
 dayExercises = window.sfcBuildMuscuDay(groups, {
   exercises:     window.EXERCISES,
   filterMedical: (typeof filterExerciseByMedical === 'function') ? filterExerciseByMedical : null,
   equipment:     S.sportEquipment,
   isBeginner:    _isBeginner,
   maxLv:         maxLv,
   durMax:        _durMax,
   durSets:       _durSets,
   pregTri:       pregTri,
   pregForbidden: pregForbidden,
   pregnancyWeek: S.pregnancyWeek,
   muscuMedical:  (S.muscuMedical && typeof S.muscuMedical === 'object' && !Array.isArray(S.muscuMedical) && S.muscuMedical.done === true) ? S.muscuMedical : null,
   medRx:         _medRx,
   weekUsed:      weekUsedNames,
   restOverride:  restOverride,
   hasShred:      hasShred,
   hasStrength:   hasStrength,
   repSuffix:     repSuffix,
   supersetNote:  supersetNote,
   cycleFactor:   cycleIntensityFactor,
   weekIndex:     window.SFCSymbiosis ? window.SFCSymbiosis.getWeekIndex() : 0,
   perioCfgApplied: !!_perioCfg
 });
 // SFC Symbiosis bridge moved to processCompletedSession (session save only — never on render)

 // Grossesse : ajouter Kegel à chaque séance
 if (pregTri) {
   dayExercises.push({
     n: 'Exercices de Kegel', m: 'Plancher pelvien',
     sets: '3 x 10 contractions (5s tenue)', rest: '30s', eq: 'Aucun', lv: 1,
     desc: 'Contractez les muscles du plancher pelvien comme pour retenir l\'urine. Tenez 5 secondes, relâchez 5 secondes. Répétez.',
     tips: ['Essentiel pour préparer l\'accouchement', 'Prévient l\'incontinence', 'Peut être fait n\'importe où'],
     video: 'https://www.youtube.com/results?search_query=exercices+kegel+grossesse'
   });
 }

 // Wellness adaptation — fatigue modifies actual program (not just banner)
 var _wa = (typeof getWellnessAdaptation === 'function') ? getWellnessAdaptation() : null;
 if (_wa && (_wa.level === 'recovery' || _wa.level === 'reduced')) {
   dayExercises.forEach(function(ex) {
     if (typeof ex.sets === 'string') {
       ex.sets = ex.sets.replace(/^(\d+)/, function(m, n) {
         return String(Math.max(1, parseInt(n) - 1));
       });
     }
   });
   if (_wa.level === 'recovery') {
     // 75% cap (was 60%) — recovery reduces volume but not below duration-based minimum.
     // Ex: 1h15 recovery = max(5, floor(7×0.75)) = 5 exos × 3 séries ≈ 50 min (approprié)
     // vs. ancienne formule : max(3, floor(7×0.6)) = 4 exos × 3 séries ≈ 30 min (trop court).
     var _durMinBound = S.sportSessionDuration
       ? (_minExosByDur[S.sportSessionDuration] || 3) : 3;
     var _recoveryCap = Math.max(_durMinBound, Math.floor(dayExercises.length * 0.75));
     if (dayExercises.length > _recoveryCap) {
       dayExercises = dayExercises.slice(0, _recoveryCap);
     }
   }
 }

 // ─── Semaine de décharge automatique (NSCA, RP: deload en phase Transition) ───
 // Le macrocycle suit 3 phases : Hypertrophie (c=0) → Force (c=1) → Transition (c=2).
 // La phase Transition est naturellement la semaine de récupération (volume -40%).
 // Cohérent avec getMacroCyclePhase() — toutes les 3 semaines (cycles 3, 6, 9...).
 var _cyclePhaseIdx = ((S.muscuCycle || 1) - 1) % 3; // 0=Hypertrophie, 1=Force, 2=Transition

 // ─── Phase FORCE (c=1) : schéma de répétitions lourd sur les composés ────────
 // Sans ce bloc, les phases Hypertrophie ET Force sont IDENTIQUES (même 8-12 reps).
 // Un programme sérieux doit ajuster les reps selon la phase (NSCA §17 ; Prilepin).
 // Tier 0 (composé+force) : 5 séries × 4-6 reps — charge proche 85-90% 1RM
 // Tier 1 (composé seul)  : 4 séries × 5-8 reps — charge 75-80% 1RM
 // Isolation              : inchangé (10-15 reps — récup active même en semaine Force)
 if (_cyclePhaseIdx === 1) {
   dayExercises.forEach(function(ex) {
     if (typeof ex.sets !== 'string') return;
     var _tgs = ex.tags || [];
     var _hasCompose = _tgs.indexOf('compose') !== -1;
     var _hasForce   = _tgs.indexOf('force') !== -1 || _tgs.indexOf('powerlifting') !== -1;
     var _hasIso     = _tgs.indexOf('isolation') !== -1;
     if (_hasIso) return; // isolation : garder reps hautes
     if (_hasCompose && _hasForce) {
       // Tier 0 : +1 série, reps 4-6 (force maximale)
       ex.sets = ex.sets.replace(/^(\d+)/, function(m, n) { return String(Math.min(parseInt(n) + 1, 6)); });
       ex.sets = ex.sets.replace(/([×x])\d+-\d+/, function(m, sep) { return (sep || '×') + '4-6'; });
     } else if (_hasCompose) {
       // Tier 1 : reps 5-8 (force-hypertrophie)
       ex.sets = ex.sets.replace(/([×x])\d+-\d+/, function(m, sep) { return (sep || '×') + '5-8'; });
     }
   });
 }

 if (_cyclePhaseIdx === 2 && !_perioCfg) {
   var _dlCap = Math.max(3, Math.round(dayExercises.length * 0.6));
   if (dayExercises.length > _dlCap) dayExercises = dayExercises.slice(0, _dlCap);
   // FIX B3 2026-05 : plancher durée × séries — la décharge ne doit jamais tomber sous
   // le minimum NSCA lié à la durée de séance préférée de l'utilisateur.
   // Formule : plancher_total = exos_floor × 3 sets_minimum
   //   45min → 3×3=9 sets · 1h → 4×3=12 · 1h15 → 5×3=15 · 1h30 → 6×3=18
   // Implémentation : on calcule le nombre de séries minimum par exercice (plancher_exo)
   // tel que n_exos × plancher_exo >= plancher_total.
   // Sans ce guard : 4 exos × 2 sets = 8 sets pour 45min < 9 sets minimum NSCA.
   var _dlSetFloor = 2; // minimum absolu par exercice
   if (_dur) {
     var _dlExosFloor = _minExosByDur[_dur] || 3;
     var _dlTotalFloor = _dlExosFloor * 3; // plancher total en séries
     if (dayExercises.length > 0) {
       _dlSetFloor = Math.max(2, Math.ceil(_dlTotalFloor / dayExercises.length));
     }
   }
   dayExercises.forEach(function(ex) {
     if (typeof ex.sets === 'string') {
       // Décharge : -1 série mais jamais sous _dlSetFloor (plancher NSCA)
       ex.sets = ex.sets.replace(/^(\d+)/, function(m, n) { return String(Math.max(_dlSetFloor, parseInt(n) - 1)); });
     }
     // Intensité basse : reps hautes (endurance musculaire, pas de charge max pendant deload)
     if (typeof ex.sets === 'string' && !ex._deloadRepsSet) {
       ex.sets = ex.sets.replace(/(×|x)(\d+)-(\d+)/, function(_, sep, r1, r2) {
         return sep + Math.max(parseInt(r1), 12) + '-' + Math.max(parseInt(r2), 15);
       });
       ex._deloadRepsSet = true;
     }
   });
   S._currentDeloadWeek = true; // flag pour l'UI (afficher bandeau "Semaine de décharge")
 } else {
   S._currentDeloadWeek = false;
 }

 // Build focus label with star ratings (bilingual names, max 5 stars, deduplicated)
 var _sEN = window.isEnglish && window.isEnglish();
 var categoryToFrench = {
 'chest': _sEN ? 'Chest' : 'Poitrine',
 'back': _sEN ? 'Back' : 'Dos',
 'shoulders': _sEN ? 'Shoulders' : 'Épaules',
 'traps': _sEN ? 'Traps' : 'Trapèzes',
 'biceps': _sEN ? 'Arms' : 'Bras',
 'triceps': _sEN ? 'Arms' : 'Bras',
 'forearms': _sEN ? 'Forearms' : 'Avant-bras',
 'legs': _sEN ? 'Legs' : 'Jambes',
 'calves': _sEN ? 'Calves' : 'Mollets',
 'glutes': _sEN ? 'Glutes' : 'Fessiers',
 'abs': _sEN ? 'Core' : 'Abdominaux',
 'cardio': 'Cardio'
 };
 var seenLabels = {};
 var focusParts = [];
 groups.forEach(function(g) {
 var label = categoryToFrench[g] || (g.charAt(0).toUpperCase() + g.slice(1));
 if (seenLabels[label]) return; // deduplicate (e.g. biceps+triceps both = Bras)
 seenLabels[label] = true;
 var pri = categoryPriority[g] || 0;
 var starCount = Math.min(pri, 5);
 var stars = '';
 for (var s = 0; s < starCount; s++) stars += '\u2605';
 focusParts.push(label + (stars ? ' ' + stars : ''));
 });
 var focusLabel = focusParts.join(' · ');

 // ═══ FIX P0 SPRINT 2026-04-16 — NOMS JOURS BASÉS SUR LE SPLIT RÉEL ═══
 // Avant : isPPL5 hardcodait ['Push A','Pull A','Legs','Push B','Pull B'] pour TOUT user
 // 5j advanced+muscle, MÊME si le split choisi était bro_5 (Pecs/Dos/Épaules/Bras/Jambes).
 // Résultat : jour d'épaules nommé "Legs" → Arnold Press sur "Leg A" = incohérence critique.
 // Maintenant : on lit les dayLabels depuis _SPLIT_OPTIONS correspondant au _splitChoice réel.
 var _SPLIT_DAY_LABELS = {
   'fullbody_ab': ['Full Body A','Full Body B'],
   'fullbody_3':  ['Full Body A','Full Body B','Full Body C'],
   'ppl_3':       ['Push','Pull','Legs'],
   'upper_lower': ['Upper A','Lower A','Upper B','Lower B'],
   'ppl_plus1':   ['Push','Pull','Legs','Upper'],
   'bro_4':       ['Pecs + Triceps','Dos + Biceps','Épaules','Jambes'],
   'ppl_5':       ['Push A','Pull A','Legs','Push B','Pull B'],
   'bro_5':       ['Pecs','Dos','Épaules','Bras','Jambes'],
   'ppl_6':       ['Push A','Pull A','Legs A','Push B','Pull B','Legs B']
 };
 var _splitDayLabels = S._splitChoice ? (_SPLIT_DAY_LABELS[S._splitChoice] || null) : null;
 var _dayName = (_splitDayLabels && _splitDayLabels[d]) ? _splitDayLabels[d] : ((window.isEnglish && window.isEnglish() ? 'Day ' : 'Jour ') + (d + 1));

 // Guard : ne jamais pousser un jour sans exercice — tous les filtres cumulés
 // (équipement + médical + grossesse + niveau) peuvent vider dayExercises.
 if (dayExercises.length === 0) {
   S._sportFilterIncomplete = true;
   // Fallback minimal : prendre 3 exos du pool brut (niveau filtré) du premier groupe
   var _fbGroup = groups[0];
   var _fbPool = (window.EXERCISES && window.EXERCISES[_fbGroup]) || [];
   var _fbAvail = _fbPool.filter(function(e) { return e.lv <= maxLv; });
   if (!_fbAvail.length) _fbAvail = _fbPool.slice();
   dayExercises = _fbAvail.slice(0, 3);
   if (dayExercises.length === 0) continue; // groupe vraiment vide → on ignore ce jour
 }
 // Score the session — stored on the day object for debug/QA, never shown in UI
 var _dayScore = (typeof scoreSession === 'function') ? scoreSession(dayExercises, {
   level: S.sportLevel || 'intermediate',
   duration: S.sportSessionDuration || '1h',
   equipment: S.sportEquipment || 'gym',
   groups: groups
 }) : null;
 if (_dayScore && !_dayScore.pass) {
   console.warn('[SFC] Session score below 85:', _dayScore.total, _dayScore.breakdown, _dayName);
 }
 program.push({
 name: _dayName,
 splitKey: S._splitChoice || null,
 splitDayIdx: d,
 focus: focusLabel,
 exercises: dayExercises,
 score: _dayScore,
 warmup: {
  duration: 8,
  exercises: [
   { name: (window.isEnglish && window.isEnglish() ? 'Light cardio (bike/treadmill)' : 'Cardio léger (vélo/tapis)'), duration: '5 min', intensity: (window.isEnglish && window.isEnglish() ? 'Low' : 'Faible') },
   { name: (window.isEnglish && window.isEnglish() ? 'Joint mobility' : 'Mobilité articulaire'), duration: '3 min', notes: (window.isEnglish && window.isEnglish() ? 'Circles: shoulders, hips, ankles' : 'Cercles épaules, hanches, chevilles') }
  ]
 },
 cooldown: {
  duration: 5,
  exercises: [
   { name: (window.isEnglish && window.isEnglish() ? 'Walk or light cycling' : 'Marche ou vélo léger'), duration: '3 min', intensity: (window.isEnglish && window.isEnglish() ? 'Very low' : 'Très faible') },
   { name: (window.isEnglish && window.isEnglish() ? 'Static stretching' : 'Étirements statiques'), duration: '2 min', notes: (window.isEnglish && window.isEnglish() ? 'Worked muscle groups' : 'Groupes musculaires travaillés') }
  ]
 }
 });
 }

 // Stamp version — stocké dans S (pas sur l'array, qui perd les custom props au JSON.stringify)
 S._sportProgramVersion = SPORT_PROGRAM_VERSION;

 // Runtime validation + auto-fix (doublons, champs manquants)
 if (window.validateSportProgram) {
   try { window.validateSportProgram(program); } catch(_e) {}
 }

 // Invariants runtime sport — warn + monitor en production, throw en test
 if (window.SFCInvariant) {
   try {
     window.SFCInvariant.checkSport(program, S, {
       sessionDuration:     S.sportSessionDuration,
       muscuCycleDeload:    !!(S._deloadWeek),
       sfcSymbiosisDeload:  !!(window.SFCSymbiosis && window.SFCSymbiosis.getPeriodizationCfg &&
                               window.SFCSymbiosis.getPeriodizationCfg().durMax <= 4)
     });
   } catch (_ie) {}
 }

 return program;
}

// ─── MODULE CONSTANT: sport → step de programme ───

// ─── INTERSTITIEL SPORT: programme existant ───
function renderSportChoice(p) {
  var prenom = S.prenom || S.nom || '';
  var sportLabels = {
    musculation: 'Musculation', crossfit: 'Cross Training', running: 'Running',
    hyrox: 'Hyrox', padel: 'Padel', golf: 'Golf', triathlon: 'Triathlon / IRONMAN',
    yoga: 'Yoga & Mobilité', cycling: 'Cyclisme', calisthenics: 'Callisthénie'
  };
  var sportLabel = S.sportType ? (sportLabels[S.sportType] || S.sportType) : 'Sport';
  var wrap = h('div', {style: 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:72px 28px 56px;text-align:center;min-height:65vh'});

  wrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:10px;letter-spacing:7px;text-transform:uppercase;font-weight:300;margin-bottom:8px;color:var(--grey)'}, 'SMARTFITCOACH'));
  wrap.appendChild(h('div', {style: 'width:36px;height:1px;background:var(--black);margin:0 auto 28px'}));
  wrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:22px;font-weight:300;font-style:italic;line-height:1.45;margin-bottom:16px'},
    prenom ? (window.isEnglish && window.isEnglish() ? 'Your ' + sportLabel + ' protocol\nis active, ' + prenom + '.' : 'Votre protocole ' + sportLabel + '\nest actif, ' + prenom + '.') : (window.isEnglish && window.isEnglish() ? 'Your ' + sportLabel + ' protocol\nis already set up.' : 'Votre protocole ' + sportLabel + '\nest déjà établi.')
  ));
  wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;letter-spacing:0.5px;line-height:1.7;color:var(--grey,#6B6B65);max-width:300px;margin:0 auto 40px'},
    (window.isEnglish && window.isEnglish() ? 'Would you like to continue your current program,\nor define a completely new one\u00a0?' : 'Souhaitez-vous poursuivre votre programme en cours,\nou en définir un entièrement nouveau\u00a0?')
  ));

  var targetStep = _SPORT_PROGRAM_STEP[S.sportType] || 4;

  var btnContinue = h('button', {
    style: 'display:block;width:100%;max-width:300px;padding:16px 24px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;margin:0 auto 14px',
    onclick: function() { S.sStep = targetStep; window.render(); }
  }, (window.isEnglish && window.isEnglish() ? 'Continue my protocol' : 'Poursuivre mon protocole'));

  var btnNew = h('button', {
    style: 'display:block;width:100%;max-width:300px;padding:15px 24px;background:transparent;color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid var(--black,#0A0A09);cursor:pointer;margin:0 auto',
    onclick: function() {
      if (window._wodTimerInterval) { clearInterval(window._wodTimerInterval); window._wodTimerInterval = null; }
      if (_restTimerInterval) { clearInterval(_restTimerInterval); _restTimerInterval = null; }
      S.sportType = null; S.sStep = 0; S.selectedSportDay = 0;
      S.sportGoals = []; S.sportLevel = null; S.sportFocus = {};
      S.sportProgram = null; S.sportDays = 3; S.bonusExercises = {};
      S.bonusExercises = {}; S._splitChoice = null; S.cfCalendarOpen = false;
      S.trainingDaysSelected = [];
      S.sportMixEnabled = false; S.sportMixSecondary = null;
      S._sfcOverride = false; S._sfcOverrideDate = null;
      // FIX VALIDATION WEEKPLAN 2026-04 : dévalider (plan reste visible + bandeau Revalider)
      if (window.devalidateWeekPlan) window.devalidateWeekPlan('changement sport');
      else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      window.render();
    }
  }, (window.isEnglish && window.isEnglish() ? 'Define a new protocol' : 'Définir un nouveau protocole'));

  wrap.appendChild(btnContinue);
  wrap.appendChild(btnNew);
  p.appendChild(wrap);
}

// ─── EXPORTS ───
window.getPregnancySportWarning = getPregnancySportWarning;

// ─── QUICK PROFILE (mode sport-seulement) ───
function renderSportQuickProfile(p) {
  var wrap = h('div', {style: 'max-width:420px;margin:0 auto;padding:48px 20px 40px'});

  wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'YOUR PROFILE' : 'VOTRE PROFIL')));
  wrap.appendChild(h('div', {style: 'width:36px;height:1px;background:var(--black,#1A1A18);margin-bottom:20px'}));
  var titleEl = h('div', {style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;font-style:italic;line-height:1.45;margin-bottom:28px;color:var(--black,#1A1A18)'}, (window.isEnglish && window.isEnglish() ? 'A few details\npersonalize\nyour program.' : 'Quelques informations\npour personnaliser\nvotre programme.'));
  titleEl.style.whiteSpace = 'pre-line';
  wrap.appendChild(titleEl);

  if (!S.sex) {
    // ── Étape A : choix du sexe — toggle buttons ──
    wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Your sex' : 'Votre sexe')));
    var sexRow = h('div', {style: 'display:flex;gap:8px'});
    [{label: 'Homme', val: 'homme'}, {label: 'Femme', val: 'femme'}].forEach(function(o) {
      var active = S.sex === o.val;
      var btn = h('button', {
        style: 'flex:1;height:48px;border:1px solid ' + (active ? 'var(--black,#1A1A18)' : 'var(--border,#E8E6DF)') + ';border-radius:2px;background:' + (active ? 'var(--black,#1A1A18)' : 'var(--ivory,#FAF9F6)') + ';color:' + (active ? '#FAF9F6' : 'var(--grey,#6B6B65)') + ';font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .15s ease;-webkit-tap-highlight-color:transparent',
        onclick: function() { S.sex = o.val; window.render(); }
      }, o.label);
      sexRow.appendChild(btn);
    });
    wrap.appendChild(sexRow);

  } else {
    // ── Étape B : prénom + âge + poids ──
    // Prénom (optionnel)
    var prenomWrap = h('div', {style: 'margin-bottom:16px'});
    prenomWrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Your first name (optional)' : 'Votre prénom (optionnel)')));
    var prenomInput = h('input', {
      type: 'text',
      value: S.prenom || '',
      placeholder: 'Sophie',
      style: 'width:100%;height:48px;border:1px solid var(--border,#E8E6DF);background:var(--ivory,#FAF9F6);font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);padding:0 16px;box-sizing:border-box;border-radius:2px;outline:none;-webkit-appearance:none;',
      oninput: function(e) { S.prenom = e.target.value.trim(); if (window.saveProfile) { try { window.saveProfile(); } catch(err) {} } }
    });
    prenomWrap.appendChild(prenomInput);
    wrap.appendChild(prenomWrap);

    wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Your age' : 'Votre \u00e2ge')));
    var ageInput = h('input', {
      type: 'number', min: '13', max: '99', inputmode: 'numeric',
      style: 'width:100%;height:48px;border:1px solid var(--border,#E8E6DF);background:var(--ivory,#FAF9F6);font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);padding:0 16px;box-sizing:border-box;border-radius:2px;outline:none;-webkit-appearance:none;',
      value: S.age ? String(S.age) : '',
      placeholder: '25'
    });
    var ageErr = h('div', {style: 'font-size:11px;color:#8B2020;margin-top:4px;display:none', role: 'alert'}, '');
    // btnContinue referenced in _syncBtn \u2014 hoisted by var, assigned below
    var btnContinue;
    function _syncBtn() {
      if (!btnContinue) return;
      var _can = !!(S.age && S.weight);
      btnContinue.disabled = !_can;
      btnContinue.style.cursor = _can ? 'pointer' : 'not-allowed';
      btnContinue.style.background = _can ? 'var(--black,#1A1A18)' : 'var(--border,#E8E6DF)';
      btnContinue.style.color = _can ? '#FAF9F6' : 'var(--grey,#6B6B65)';
    }
    ageInput.addEventListener('input', function() {
      var v = parseInt(this.value);
      if (!isNaN(v) && v >= 13 && v <= 99) { S.age = v; ageErr.style.display = 'none'; _syncBtn(); }
    });
    ageInput.addEventListener('change', function() {
      var v = parseInt(this.value);
      if (!isNaN(v) && v >= 13 && v <= 99) { S.age = v; ageErr.style.display = 'none'; _syncBtn(); }
      else { this.value = S.age ? String(S.age) : ''; ageErr.textContent = v < 13 ? (window.isEnglish && window.isEnglish() ? 'Age between 13 and 99.' : '\u00c2ge entre 13 et 99 ans.') : (window.isEnglish && window.isEnglish() ? 'Please enter your age.' : 'Veuillez indiquer votre \u00e2ge.'); ageErr.style.display = 'block'; }
    });
    ageInput.addEventListener('focus', function() { setTimeout(function() { ageInput.scrollIntoView({behavior:'smooth', block:'center'}); }, 300); });
    wrap.appendChild(ageInput);
    wrap.appendChild(ageErr);

    wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:16px 0 8px'}, (window.isEnglish && window.isEnglish() ? 'Your weight (kg)' : 'Votre poids (kg)')));
    var weightInput = h('input', {
      type: 'number', min: '30', max: '300', step: '0.5', inputmode: 'decimal',
      style: 'width:100%;height:48px;border:1px solid var(--border,#E8E6DF);background:var(--ivory,#FAF9F6);font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);padding:0 16px;box-sizing:border-box;border-radius:2px;outline:none;-webkit-appearance:none;',
      value: S.weight ? String(S.weight) : '',
      placeholder: '70'
    });
    var weightErr = h('div', {style: 'font-size:11px;color:#8B2020;margin-top:4px;display:none', role: 'alert'}, '');
    weightInput.addEventListener('input', function() {
      var v = parseFloat(this.value);
      if (!isNaN(v) && v >= 30 && v <= 300) { S.weight = v; S._nm = null; weightErr.style.display = 'none'; _syncBtn(); }
    });
    weightInput.addEventListener('change', function() {
      var v = parseFloat(this.value);
      if (!isNaN(v) && v >= 30 && v <= 300) { S.weight = v; S._nm = null; weightErr.style.display = 'none'; _syncBtn(); }
      else { this.value = S.weight ? String(S.weight) : ''; weightErr.textContent = (window.isEnglish && window.isEnglish() ? 'Between 30 and 300 kg.' : 'Entre 30 et 300 kg.'); weightErr.style.display = 'block'; }
    });
    weightInput.addEventListener('focus', function() { setTimeout(function() { weightInput.scrollIntoView({behavior:'smooth', block:'center'}); }, 300); });
    wrap.appendChild(weightInput);
    wrap.appendChild(weightErr);

    var canContinue = !!(S.age && S.weight);
    btnContinue = h('button', {
      style: 'width:100%;height:52px;margin-top:28px;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;transition:background .2s ease,color .2s ease;cursor:' + (canContinue ? 'pointer' : 'not-allowed') + ';background:' + (canContinue ? 'var(--black,#1A1A18)' : 'var(--border,#E8E6DF)') + ';color:' + (canContinue ? '#FAF9F6' : 'var(--grey,#6B6B65)') + ';',
      disabled: !canContinue,
      onclick: function() {
        if (!S.age || !S.weight) return;
        S._sportProfileDone = true;
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        window.render();
      }
    }, (window.isEnglish && window.isEnglish() ? 'Start' : 'Commencer'));
    wrap.appendChild(btnContinue);
  }

  p.appendChild(wrap);
}

// ─── WELLNESS SCORE (données du jour, numériques 1-5) ───
function getWellnessScore() {
  var S = window.S;
  if (!S || !S.todayWellness) return null;
  var today = new Date().toISOString().split('T')[0];
  if (S.todayWellness.date !== today) return null; // données d'hier
  var w = S.todayWellness;
  // Score composite 1-5 (uniquement les valeurs numériques)
  var scores = [];
  if (typeof w.sleep === 'number' && w.sleep >= 1 && w.sleep <= 5) scores.push(w.sleep);
  if (typeof w.muscles === 'number' && w.muscles >= 1 && w.muscles <= 5) scores.push(w.muscles);
  if (typeof w.energy === 'number' && w.energy >= 1 && w.energy <= 5) scores.push(w.energy);
  if (scores.length === 0) return null;
  return scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;
}
window.getWellnessScore = getWellnessScore;

// ─── RENDER ───
window.SPORT = {
 render: function(p) {
 var content = h('div', {'class': 'fade-in'});

 // Lazy-load CrossFit data for existing CrossFit users (not yet loaded)
 if (S.sportType === 'crossfit' && !_cfLoaded && !_cfLoading) {
   _loadCFScripts(function() { if (window.render) window.render(); });
 }

 // ─── Mode sport-seulement : collecter identité si manquante ───
 if (S.appMode === 'sport' && (!S.sex || !S.age || !S.weight || !S._sportProfileDone)) {
   renderSportQuickProfile(content);
   p.appendChild(content);
   return;
 }

 // ─── Séance Libre (sStep=30) — réservé aux users avec un sportType défini ───
 if (S.sStep === 30 && !S.sportType) { S.sStep = 0; }
 if (S.sStep === 30) {
   if (window.renderCustomSessionBuilder) {
     window.renderCustomSessionBuilder(content);
   } else {
     // fallback si script non chargé
     content.appendChild(h('div', {style:'padding:24px;text-align:center;font-family:Georgia,serif;'}, (window.isEnglish && window.isEnglish() ? 'Loading...' : 'Chargement...')));
     S.sStep = 0;
   }
   p.appendChild(content);
   return;
 }

 // ─── Guard : sStep > 0 sans sportType → page blanche possible, réinitialiser ───
 if (S.sStep > 0 && !S.sportType) { S.sStep = 0; }

 // ─── Si programme existant → afficher directement la prog (plus d'interstitiel) ───
 // Guard: ne rediriger que si un programme complet existe — évite de sauter l'onboarding
 // après un rechargement partiel (ex: sStep=26 PAR-Q réinitialisé à 0 par _doAutoLogin)
 // FIX BUG 2026-04-26 : élargir la détection à tous les sports (S.sportProgram = musculation only).
 if (S.sStep === 0 && S.sportType && _SPORT_PROGRAM_STEP[S.sportType]) {
   var _hasExistingProgram =
     (Array.isArray(S.sportProgram) && S.sportProgram.length > 0) ||
     (Array.isArray(S.runningProgram) && S.runningProgram.length > 0) ||
     (Array.isArray(S.hyroxProgram) && S.hyroxProgram.length > 0) ||
     (Array.isArray(S.padelProgram) && S.padelProgram.length > 0) ||
     (Array.isArray(S.golfProgram) && S.golfProgram.length > 0) ||
     (Array.isArray(S.triathlonProgram) && S.triathlonProgram.length > 0) ||
     (Array.isArray(S.cyclingProgram) && S.cyclingProgram.length > 0) ||
     (Array.isArray(S.calisthenicsProgram) && S.calisthenicsProgram.length > 0) ||
     (S.sportType === 'yoga' && !!S.yogaLevel && !!S.yogaObjectif) ||
     (S.sportType === 'crossfit' && !!S.crossfitLevel);
   if (_hasExistingProgram) {
     S.sStep = _SPORT_PROGRAM_STEP[S.sportType];
     if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
   }
 }

 // ─── CHECK BIEN-ÊTRE QUOTIDIEN (NON-BLOQUANT) ───
 // Le bilan de forme est désormais capturé en plein écran à l'arrivée sur le dashboard.
 // Le bandeau sport n'est plus nécessaire — _wellnessReminder toujours false.
 var _PROGRAM_STEPS = [4, 6, 8, 10, 12, 14, 15, 16, 18, 20, 21, 23, 25];
 if (_PROGRAM_STEPS.indexOf(S.sStep) !== -1) {
   var _today = new Date().toISOString().slice(0, 10);
   var _w = S.todayWellness || {};
   if (!_w.date || _w.date !== _today) {
     S._wellnessReminder = false; // plus de bandeau — le checkin se fait au dashboard
   } else {
     S._wellnessReminder = false;
   }
 }

 // Header with progress (only shown after step 0, not on intro pages)
 // sStep 20 = medical questionnaire (muscu pre-step), include it in progress
 if (S.sStep > 0) {
 var hdr = h('header', {'class': 'header'});
 var sportLabel = S.sportType === 'crossfit' ? 'Cross Training' : S.sportType === 'running' ? 'Running' : S.sportType === 'hyrox' ? 'Hyrox' : S.sportType === 'padel' ? 'Padel' : S.sportType === 'golf' ? 'Golf' : S.sportType === 'triathlon' ? 'Triathlon / IRONMAN' : S.sportType === 'yoga' ? (window.isEnglish && window.isEnglish() ? 'Yoga & Mobility' : 'Yoga & Mobilit\u00e9') : S.sportType === 'cycling' ? 'Cyclisme' : S.sportType === 'calisthenics' ? 'Callisth\u00e9nie' : 'Musculation';
 hdr.appendChild(h('div', {'class': 'logo', html: 'SMARTFITCOACH<span>' + sportLabel + '</span>'}));
 var totalSteps = S.sportType === 'crossfit' ? 2 : S.sportType === 'running' ? 2 : S.sportType === 'hyrox' ? 2 : S.sportType === 'padel' ? 2 : S.sportType === 'golf' ? 2 : S.sportType === 'triathlon' ? 2 : S.sportType === 'yoga' ? 2 : S.sportType === 'cycling' ? 2 : S.sportType === 'calisthenics' ? 2 : 4;
 // sStep 20 (medical) maps to display step 0 for musculation (shown as "Éval. médicale")
 var currentDisplay = S.sStep === 26 ? 0 : S.sStep === 27 ? 0 : S.sStep === 20 ? 0 : S.sportType === 'crossfit' ? S.sStep - 4 : S.sportType === 'running' ? S.sStep - 6 : S.sportType === 'hyrox' ? S.sStep - 8 : S.sportType === 'padel' ? S.sStep - 10 : S.sportType === 'golf' ? S.sStep - 12 : S.sportType === 'triathlon' ? S.sStep - 16 : S.sportType === 'yoga' ? S.sStep - 18 : S.sportType === 'cycling' ? S.sStep - 21 : S.sportType === 'calisthenics' ? S.sStep - 23 : S.sStep;
 var _progStep = _SPORT_PROGRAM_STEP[S.sportType] || 4;
 var _isOnProgram = (S.sStep === _progStep || (S.sStep === 6 && S.cfCalendarOpen));
 if (_isOnProgram) {
   var _changeLink = h('button', {
     style: 'background:none;border:1px solid var(--border,#D8D8D0);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--grey,#6B6B65);cursor:pointer;padding:5px 10px;border-radius:2px;',
     onclick: function() {
       // Nettoyer les timers actifs avant de changer de sport
       if (window._wodTimerInterval) { clearInterval(window._wodTimerInterval); window._wodTimerInterval = null; }
       if (_restTimerInterval) { clearInterval(_restTimerInterval); _restTimerInterval = null; }
       // Réinitialiser tous les champs liés au sport actif
       S.sportType = null; S.sStep = 0; S.selectedSportDay = 0;
       S.sportGoals = []; S.sportLevel = null; S.sportFocus = {};
       S.sportProgram = null; S.sportDays = 3; S.bonusExercises = {};
       S.bonusExercises = {}; S._splitChoice = null; S.cfCalendarOpen = false;
       S.trainingDaysSelected = [];
       S.sportMixEnabled = false; S.sportMixSecondary = null;
       S._sfcOverride = false; S._sfcOverrideDate = null;
       // FIX VALIDATION WEEKPLAN 2026-04 : dévalider (plan reste visible)
       if (window.devalidateWeekPlan) window.devalidateWeekPlan('changement sport');
       else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       if (window.render) window.render();
     }
   }, (window.isEnglish && window.isEnglish() ? 'Change sport' : 'Changer de sport'));
   hdr.appendChild(_changeLink);
 } else {
   // Hermès polish : clamp currentDisplay [1, totalSteps] — jamais d'étape négative/dépassée affichée
   var _clampedStep = Math.max(1, Math.min(totalSteps, currentDisplay));
   var _stepValid = (currentDisplay >= 1 && currentDisplay <= totalSteps);
   var stepLabel = S.sStep === 26 ? (window.isEnglish && window.isEnglish() ? 'Health questionnaire' : 'Questionnaire sant\u00e9') : S.sStep === 27 ? (window.isEnglish && window.isEnglish() ? 'Medical assessment' : 'Bilan m\u00e9dical') : S.sStep === 20 ? (window.isEnglish && window.isEnglish() ? 'Medical eval.' : '\u00c9val. m\u00e9dicale') : S.sStep === 16 ? (window.isEnglish && window.isEnglish() ? 'Load eval.' : '\u00c9val. des charges') : S.sStep === 15 ? (window.isEnglish && window.isEnglish() ? 'Dedicated programs' : 'Programmes d\u00e9di\u00e9s') : (_stepValid ? ((window.isEnglish && window.isEnglish() ? 'Step ' : '\u00c9tape ') + _clampedStep + ' / ' + totalSteps) : '\u2014');
   hdr.appendChild(h('div', {'class': 'step-indicator'}, stepLabel));
 }
 p.appendChild(hdr);
 var pb = h('div', {'class': 'progress-bar'});
 var _pbPct = S.sStep === 26 ? 5 : S.sStep === 27 ? 10 : S.sStep === 20 ? 5 : S.sStep === 16 ? 15 : S.sStep === 15 ? 100 : Math.min(100, Math.max(0, (currentDisplay / totalSteps * 100)));
 pb.appendChild(h('div', {'class': 'progress-fill', style: 'width:' + _pbPct + '%'}));
 p.appendChild(pb);
 }

 var _validSSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30];
 if (_validSSteps.indexOf(S.sStep) === -1) { S.sStep = 0; }

 if (S.sStep === 0) renderObjectif(content); // Type selection
 else if (S.sStep === 26) renderPARQ(content); // PAR-Q screening (ACSM 2018)
 else if (S.sStep === 27) renderSportGenericMedical(content); // Bilan médical sport-spécifique
 else if (S.sStep === 20) renderMuscuMedicalQ(content); // Medical questionnaire muscu
 else if (S.sStep === 16) renderChargesQuestionnaire(content); // Charges questionnaire
 else if (S.sStep === 15) renderDedicatedPrograms(content); // Dedicated programs
 else if (S.sStep === 1) renderMusculationGoals(content); // Muscu objectives
 else if (S.sStep === 2) renderMusculationLevel(content); // Muscu level
 else if (S.sStep === 3) renderMusculationZones(content); // Muscu zones
 else if (S.sStep === 4) renderMusculationProgram(content); // Muscu program
 else if (S.sStep === 5) renderCrossfitLevel(content); // CF level
 else if (S.sStep === 6 && S.cfCalendarOpen) renderCFCalendar(content); // CF calendar
 else if (S.sStep === 6) renderCrossfitProgram(content); // CF program
 else if (S.sStep === 7) renderRunningConfig(content); // Running questionnaire
 else if (S.sStep === 8) renderRunningProgram(content); // Running program
 else if (S.sStep === 9) renderHyroxConfig(content); // Hyrox questionnaire
 else if (S.sStep === 10) renderHyroxProgram(content); // Hyrox program
 else if (S.sStep === 11) renderPadelConfig(content); // Padel questionnaire
 else if (S.sStep === 12) renderPadelProgram(content); // Padel program
 else if (S.sStep === 13) renderGolfConfig(content); // Golf questionnaire
 else if (S.sStep === 14) renderGolfProgram(content); // Golf program
 else if (S.sStep === 17) renderTriathlonConfig(content); // Triathlon questionnaire
 else if (S.sStep === 18) renderTriathlonProgram(content); // Triathlon program
 else if (S.sStep === 19) renderYogaOnboarding(content); // Yoga questionnaire
 else if (S.sStep === 21) renderYogaProgram(content); // Yoga program
 else if (S.sStep === 22) renderCyclingOnboarding(content); // Cycling questionnaire
 else if (S.sStep === 23) renderCyclingProgram(content); // Cycling program
 else if (S.sStep === 24) { renderCalisthenicsOnboarding(content); } // Calisthenics onboarding
 else if (S.sStep === 25) { renderCalisthenicsProgram(content); } // Calisthenics program
 else { S.sStep = 0; renderObjectif(content); } // Fallback sécurité — évite page blanche si sStep invalide

 // ─── BANDEAU BIEN-ÊTRE (non-bloquant) ───
 // FIX D10 COHÉRENCE WELLNESS 2026-04 : ne pas ré-afficher si user a dismissed (×) aujourd'hui.
 // Avant : le check _wellnessReminder n'inspectait PAS `todayWellness.dismissed`, donc le banner
 //         pouvait ré-apparaître après un close × si _wellnessReminder avait été remis à true
 //         par une autre logique. Maintenant on guard également sur dismissed.
 var _todayISO = new Date().toISOString().slice(0, 10);
 var _wAlreadyHandled = S.todayWellness && S.todayWellness.date === _todayISO;
 if (S._wellnessReminder && !_wAlreadyHandled) {
   renderWellnessBanner(content);
 }

 p.appendChild(content);
 renderSportModal(p);
 }
};

// ─── SPORT QUOTES ───

// ─── SPORT SPLASH INTRO ───
// ─── Zones médicales spécifiques par sport (step 27) — ACSM/AHA/IOC ───


function renderSportGenericMedical(p) {
  if (!S.sportType) { S.sStep = 0; if (window.render) window.render(); return; }
  var _zones = SPORT_MED_ZONES[S.sportType] || [];
  var _name  = SPORT_MED_NAME[S.sportType] || (S.sportType || '');

  p.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:center;margin-bottom:16px;'}, (window.isEnglish && window.isEnglish() ? 'Health Assessment · ' : 'Bilan Santé · ') + _name));
  p.appendChild(h('h1', {style:'font-family:Georgia,serif;font-size:28px;font-weight:400;text-align:center;margin:0 0 8px;line-height:1.2;'}, (window.isEnglish && window.isEnglish() ? 'Your body, our priority.' : 'Votre corps, notre priorité.')));
  p.appendChild(h('p', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);text-align:center;margin:0 0 24px;max-width:320px;margin-left:auto;margin-right:auto;'}, (window.isEnglish && window.isEnglish() ? 'Flag any sensitive area — your program will be adapted accordingly. 30 seconds.' : 'Signalez toute zone sensible — votre programme sera adapté en conséquence. 30 secondes.')));

  // Fast track
  var _ftRow = h('div', {style:'text-align:center;margin-bottom:20px;'});
  _ftRow.appendChild(h('button', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;background:none;border:1px solid var(--line,#D8D8D0);padding:10px 20px;cursor:pointer;color:var(--black,#0A0A09);',
    onclick: function() {
      S.sportMedDone = true; S._sportMedType = S.sportType;
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      S.sStep = S._sportMedNextStep || 0;
      if (window.render) window.render();
    }
  }, (window.isEnglish && window.isEnglish() ? 'All good — continue →' : 'Tout va bien — continuer →')));
  p.appendChild(_ftRow);

  // Zone cards grid
  var _grid = h('div', {style:'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;max-width:420px;margin:0 auto 24px;'});
  _zones.forEach(function(zone) {
    var _sel = Array.isArray(S.medical) && S.medical.indexOf(zone.key) !== -1;
    var _card = h('div', {
      'class': 'sel-card' + (_sel ? ' on' : ''),
      style: 'cursor:pointer;padding:12px 10px;',
      onclick: function() {
        if (!Array.isArray(S.medical)) S.medical = [];
        var _i = S.medical.indexOf(zone.key);
        if (_i !== -1) { S.medical.splice(_i, 1); } else { S.medical.push(zone.key); }
        if (window.render) window.render();
      }
    });
    _card.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:600;margin-bottom:3px;'}, zone.label));
    _card.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey,#6B6B65);line-height:1.35;'}, zone.desc));
    _grid.appendChild(_card);
  });
  p.appendChild(_grid);

  // Confirm CTA
  var _hasSel = Array.isArray(S.medical) && _zones.some(function(z){ return S.medical.indexOf(z.key) !== -1; });
  p.appendChild(h('button', {
    'class': 'btn-primary',
    style: 'display:block;margin:0 auto;',
    onclick: function() {
      S.sportMedDone = true; S._sportMedType = S.sportType;
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      S.sStep = S._sportMedNextStep || 0;
      if (window.render) window.render();
    }
  }, _hasSel ? (window.isEnglish && window.isEnglish() ? 'Adapt my program →' : 'Adapter mon programme →') : (window.isEnglish && window.isEnglish() ? 'Continue →' : 'Continuer →')));

  p.appendChild(h('p', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey,#6B6B65);text-align:center;margin-top:16px;letter-spacing:1px;'}, (window.isEnglish && window.isEnglish() ? '100% local data · Consult a doctor if in doubt' : 'Données 100% locales · Consultez un médecin en cas de doute')));

  var _backRow = h('div', {style:'text-align:center;margin-top:12px;'});
  _backRow.appendChild(h('button', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;background:none;border:none;color:var(--grey,#6B6B65);cursor:pointer;padding:8px;',
    onclick: function() { S.sStep = 0; S.sportType = null; if (window.render) window.render(); }
  }, (window.isEnglish && window.isEnglish() ? '← Change sport' : '← Changer de sport')));
  p.appendChild(_backRow);
}

function renderSportSplash(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Sport · Initial assessment' : 'Sport · Bilan initial')));
  p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'A program<br><em>made for you.</em>' : 'Un programme<br><em>fait pour vous.</em>')}));
  p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'A few questions to calibrate your program to your level, goals and health.' : 'Quelques questions pour calibrer votre programme sur votre niveau, vos objectifs et votre santé.')));

  var pills = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin:20px 0;'});
  [
    '∼ 8 minutes',
    (window.isEnglish && window.isEnglish() ? 'Medical evaluation included' : 'Évaluation médicale incluse'),
    (window.isEnglish && window.isEnglish() ? 'Tailor-made program' : 'Programme sur-mesure')
  ].forEach(function(txt) {
    pills.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);border:1px solid var(--line,#D8D8D0);padding:5px 10px;border-radius:2px;'
    }, txt));
  });
  p.appendChild(pills);

  var benefits = [
    {icon: '■', title: (window.isEnglish && window.isEnglish() ? 'Scientific program' : 'Programme scientifique'), desc: (window.isEnglish && window.isEnglish() ? 'Based on ACSM, NSCA and Renaissance Periodization guidelines' : 'Basé sur les recommandations ACSM, NSCA et Renaissance Periodization')},
    {icon: '●', title: (window.isEnglish && window.isEnglish() ? 'Safety first' : 'Sécurité d\'abord'), desc: (window.isEnglish && window.isEnglish() ? 'PAR-Q medical screening — 7 questions recommended by ACSM (2018)' : 'Dépistage médical PAR-Q — 7 questions recommandées par l\'ACSM (2018)')},
    {icon: '◆', title: (window.isEnglish && window.isEnglish() ? 'Adapted to your life' : 'Adapté à votre vie'), desc: (window.isEnglish && window.isEnglish() ? 'Your level, equipment, availability, goals' : 'Votre niveau, votre équipement, vos disponibilités, vos objectifs')}
  ];
  var benefitList = h('div', {style: 'display:flex;flex-direction:column;gap:12px;margin:24px 0 28px;'});
  benefits.forEach(function(b) {
    var row = h('div', {style: 'display:flex;gap:12px;align-items:flex-start;'});
    row.appendChild(h('span', {style: 'font-size:10px;color:var(--grey,#6B6B65);margin-top:3px;flex-shrink:0;'}, b.icon));
    var txt = h('div', {});
    txt.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:500;color:var(--black,#0A0A09);margin-bottom:2px;'}, b.title));
    txt.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5;'}, b.desc));
    row.appendChild(txt);
    benefitList.appendChild(row);
  });
  p.appendChild(benefitList);

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
    S.sportSplashDone = true;
    if (window.render) window.render();
  }}, (window.isEnglish && window.isEnglish() ? 'Start my sports assessment' : 'Commencer mon bilan sportif')));
}

// ─── STEP 0: TYPE SELECTION ONLY ───
function renderObjectif(p) {
  // Splash intro sport — affiché une seule fois avant la sélection du type
  if (!S.sportSplashDone) {
    renderSportSplash(p);
    return;
  }
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Sport'));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Your<br><em>program</em>' : 'Votre<br><em>programme</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Choose your sport program type.' : 'Choisissez votre type de programme sportif.')));

 // ─── RECOMMANDATION PROFIL ───
 // Affiché uniquement si l'utilisateur n'a encore aucun programme sport.
 (function() {
  if (S.sportType || (Array.isArray(S.sportProgram) && S.sportProgram.length > 0)) return;
  var _rGoalKey = (S.goal !== null && window.GOALS && window.GOALS[S.goal]) ? window.GOALS[S.goal].key : '';
  var _rAge = typeof getAge === 'function' ? getAge() : (S.age || 0);
  var _isFemale = window.isFemale(S);

  // Matrice de recommandation
  var _rec = null;
  if (_rAge >= 50) {
   var _50reason = (window.isEnglish && window.isEnglish() ? 'Recommended for 50+ — preserves joints and improves quality of life.' : 'Recommandé pour les 50+ — préserve les articulations et améliore la qualité de vie.');
   if (_rGoalKey === 'cut' || _rGoalKey === 'shred') _50reason = (window.isEnglish && window.isEnglish() ? 'After 50, active yoga promotes gentle fat loss without joint stress — longevity first.' : 'Après 50 ans, le yoga actif favorise la perte de masse grasse douce sans stress articulaire — priorité à la longévité.');
   else if (_rGoalKey === 'bulk' || _rGoalKey === 'lean_bulk') _50reason = (window.isEnglish && window.isEnglish() ? 'After 50, mobility is the foundation — yoga prepares your joints before adding load.' : 'Après 50 ans, la mobilité est la base — le yoga prépare les articulations avant d\'ajouter de la charge.');
   _rec = { type: 'yoga', label: 'Yoga & Mobilité', icon: '🧘',
    sub: (window.isEnglish && window.isEnglish() ? 'Mobility · Flexibility · Active recovery' : 'Mobilité · Souplesse · Récupération active'),
    reason: _50reason,
    nextStep: 19 };
  } else if (_rGoalKey === 'bulk' || _rGoalKey === 'lean_bulk') {
   _rec = { type: 'musculation', label: 'Musculation', icon: '🏋️',
    sub: 'Progressive overload · Force · Masse',
    reason: (window.isEnglish && window.isEnglish() ? 'Optimal program for your mass gain goal — scientific progressive overload.' : 'Programme optimal pour votre objectif prise de masse — progressive overload scientifique.'),
    nextStep: 20 };
  } else if (_rGoalKey === 'recomposition') {
   _rec = { type: 'musculation', label: 'Musculation', icon: '🏋️',
    sub: (window.isEnglish && window.isEnglish() ? 'Strength · Composition · Recomposition' : 'Force · Composition · Recomposition'),
    reason: (window.isEnglish && window.isEnglish() ? 'Body recomposition responds best to strength training with progressive overload.' : 'La recomposition corporelle répond le mieux à la musculation avec surcharge progressive.'),
    nextStep: 20 };
  } else if (_rGoalKey === 'cut' || _rGoalKey === 'shred') {
   _rec = { type: 'crossfit', label: 'Cross Training', icon: '🔥',
    sub: (window.isEnglish && window.isEnglish() ? 'HIIT · Strength · Cardio combined' : 'HIIT · Force · Cardio fusionnés'),
    reason: (window.isEnglish && window.isEnglish() ? 'HIIT + strength = maximum combo for effective cutting — calories burned 24h.' : 'HIIT + force = combo maximal pour une sèche efficace — calories brûlées 24h.'),
    nextStep: 5 };
  } else if (_rGoalKey === 'endurance') {
   _rec = { type: 'running', label: 'Running', icon: '🏃',
    sub: '5K · 10K · Semi · Marathon',
    reason: (window.isEnglish && window.isEnglish() ? 'Progressive running program — from 5K to marathon with scientific plans.' : 'Programme running progressif — du 5K au marathon avec plans scientifiques.'),
    nextStep: 7 };
  } else if (_isFemale) {
   _rec = { type: 'musculation', label: 'Musculation', icon: '🏋️',
    sub: (window.isEnglish && window.isEnglish() ? 'Strength · Glutes · Flat stomach' : 'Force · Fessiers · Ventre plat'),
    reason: (window.isEnglish && window.isEnglish() ? 'Specially adapted for women — glutes and abs priority, without excessive bulk.' : 'Spécialement adapté femme — priorité fessiers et abdominaux, sans bulk excessif.'),
    nextStep: 20 };
  } else {
   _rec = { type: 'musculation', label: 'Musculation', icon: '🏋️',
    sub: (window.isEnglish && window.isEnglish() ? 'Strength · Volume · Performance' : 'Force · Volume · Performance'),
    reason: (window.isEnglish && window.isEnglish() ? 'The most complete program to transform your physique sustainably.' : 'Le programme le plus complet pour transformer votre physique durablement.'),
    nextStep: 20 };
  }

  if (!_rec) return;

  var recWrap = h('div', {style: 'margin-bottom:28px;'});
  recWrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Recommended for your profile' : 'Recommandé pour votre profil')));

  var recCard = h('div', {
   style: 'border:1px solid var(--black,#0A0A09);padding:20px 20px 18px;background:var(--ivory,#FAF9F6);cursor:pointer;position:relative;overflow:hidden;',
   onclick: function() {
    S.sportType = _rec.type;
    if (!S.parqDone) { S._parqNextStep = _rec.nextStep; S.sStep = 26; }
    else { S.sStep = _rec.nextStep; }
    if (window.BLACKBOX) BLACKBOX.log('sport_type_recommended', {type: _rec.type});
    window.render();
   }
  });

  var recBadge = h('div', {style: 'position:absolute;top:0;right:0;padding:4px 12px;background:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--ivory,#FAF9F6);line-height:18px'}, (window.isEnglish && window.isEnglish() ? '★  Suited for you' : '★  Adapté à vous'));
  recCard.appendChild(recBadge);

  var recTop = h('div', {style: 'display:flex;align-items:flex-start;gap:0;margin-bottom:14px;margin-top:22px'});
  var recInfo = h('div', {style: 'flex:1'});
  recInfo.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-style:italic;color:var(--black,#0A0A09);margin-bottom:5px;line-height:1.2'}, _rec.label));
  recInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65)'}, _rec.sub));
  recTop.appendChild(recInfo);
  recCard.appendChild(recTop);

  recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;border-top:1px solid var(--border,#D8D8D0);padding-top:14px;margin-top:2px'}, _rec.reason));

  var recCta = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-top:16px'});
  recCta.appendChild(h('div', {style: 'width:24px;height:1px;background:var(--black,#0A0A09)'}));
  recCta.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09)'}, (window.isEnglish && window.isEnglish() ? 'Start this program  →' : 'Commencer ce programme  →')));
  recCard.appendChild(recCta);
  recWrap.appendChild(recCard);

  recWrap.appendChild(h('div', {style: 'display:flex;align-items:center;gap:16px;margin-top:20px;margin-bottom:4px'},[
   h('div', {style:'flex:1;height:1px;background:var(--border,#D8D8D0)'}),
   h('span', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);white-space:nowrap'},(window.isEnglish && window.isEnglish() ? 'or choose manually' : 'ou choisir manuellement')),
   h('div', {style:'flex:1;height:1px;background:var(--border,#D8D8D0)'})
  ]));

  p.appendChild(recWrap);
 })();

 // Banner contextuel pour les utilisateurs nutrition → sport (tous sports, pas musculation seule)
 if (window.S && window.S._switchedFromNutrition) {
   var _ctxBannerObj = document.createElement('div');
   _ctxBannerObj.style.cssText = 'margin-bottom:16px;padding:12px 14px;background:rgba(62,92,58,0.06);border:1px solid var(--line,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--green,#3E5C3A);line-height:1.5;';
   _ctxBannerObj.textContent = (window.isEnglish && window.isEnglish() ? 'Your base profile is already set up. Simply complete your sport information below.' : 'Votre profil de base est déjà configuré. Complétez simplement vos informations sportives ci-dessous.');
   window.S._switchedFromNutrition = false; // Afficher une seule fois
   p.appendChild(_ctxBannerObj);
 }

 // FIX UX 2026-04-16 — Hero IA déplacé en bas (carte discrète), choix de sport en premier
 // L'user clique "Sport" pour VOIR son sport, pas pour ouvrir un modal générateur.

 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Program type' : 'Type de programme')));
 var typeGrid = h('div', {'class': 'card-grid-2'});

 // Musculation - clicking goes to PAR-Q first (if not already done), then medical questionnaire (step 20)
 // FIX 2026-04-19 — Avertissement HTA sévère (ESC/ESH 2018): charges >80% 1RM et Valsalva contre-indiqués
 var _htaSevere = Array.isArray(S.medical) && S.medical.indexOf('hta_severe') !== -1;
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer;position:relative;', onclick: function(){
 S.sportType = 'musculation';
 if (!S.parqDone) { S._parqNextStep = 20; S.sStep = 26; } else { S.sStep = 20; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'musculation'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, _htaSevere ? 'Musculation \u26a0' : 'Musculation'),
 h('div', {'class': 'card-sub'}, _htaSevere ? (window.isEnglish && window.isEnglish() ? 'Light loads only \u2014 ESC/ESH 2018' : 'Charges l\u00e9g\u00e8res uniquement \u2014 ESC/ESH 2018') : (window.isEnglish && window.isEnglish() ? 'Targeted program by muscle groups' : 'Programme cibl\u00e9 par groupes musculaires')),
 h('div', {'class': 'card-tag'}, _htaSevere ? (window.isEnglish && window.isEnglish() ? 'Avoid >80% 1RM \u00b7 No Valsalva \u00b7 Consult a doctor' : '\u00c9viter >80% 1RM \u00b7 Pas de Valsalva \u00b7 Consulter un m\u00e9decin') : (window.isEnglish && window.isEnglish() ? 'Cut \u00b7 Mass \u00b7 Strength \u00b7 Endurance' : 'S\u00e8che \u00b7 Masse \u00b7 Force \u00b7 Endurance'))
 ]));

 // Cross Training - clicking goes through PAR-Q (if not done), then CF level (step 5)
 // FIX SÉCURITÉ 2026-04 — Bloquer CrossFit pour HTA sévère, cardiopathie et grossesse T3
 var _cfCardio = Array.isArray(S.medical) && (S.medical.indexOf('cardio') !== -1 || S.medical.indexOf('insuffisance_card') !== -1);
 var _cfBlocked = (Array.isArray(S.medical) && S.medical.indexOf('hta_severe') !== -1) || _cfCardio || (S.pregnant && window.isFemale(S) && typeof S.pregnancyWeek === 'number' && S.pregnancyWeek >= 28);
 var _cfBlockReason = _cfBlocked ? (S.pregnant ? (window.isEnglish && window.isEnglish() ? 'Contraindicated during the 3rd trimester (ACOG 2020)' : 'Contre-indiqué pendant le 3e trimestre (ACOG 2020)') : _cfCardio ? (window.isEnglish && window.isEnglish() ? 'Contraindicated with heart disease (AHA 2018)' : 'Contre-indiqué en cas de cardiopathie (AHA 2018)') : (window.isEnglish && window.isEnglish() ? 'Contraindicated with severe hypertension (ESC/ESH 2018)' : 'Contre-indiqué avec HTA sévère (ESC/ESH 2018)')) : '';
 typeGrid.appendChild(h('div', {'class': 'sel-card' + (_cfBlocked ? ' disabled' : ''), style:'cursor:' + (_cfBlocked ? 'not-allowed' : 'pointer') + ';' + (_cfBlocked ? 'opacity:0.35;pointer-events:none;' : ''), onclick: _cfBlocked ? null : function(){
 S.sportType = 'crossfit';
 S._sportMedNextStep = 5;
 var _cfNeedMed = !S.sportMedDone || S._sportMedType !== 'crossfit';
 if (!S.parqDone) { S._parqNextStep = _cfNeedMed ? 27 : 5; S.sStep = 26; } else if (_cfNeedMed) { S.sStep = 27; } else { S.sStep = 5; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'crossfit'});
 _loadCFScripts(function() { if (window.render) window.render(); });
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Cross Training' + (_cfBlocked ? (window.isEnglish && window.isEnglish() ? ' — Unavailable' : ' — Indisponible') : '')),
 h('div', {'class': 'card-sub'}, _cfBlocked ? _cfBlockReason : (window.isEnglish && window.isEnglish() ? 'Weightlifting \u00b7 WOD \u00b7 Gymnastics' : 'Halt\u00e9rophilie \u00b7 WOD \u00b7 Gymnastique')),
 h('div', {'class': 'card-tag'}, '100 WODs \u00b7 Cycles 6 semaines \u00b7 Scaled/Inter/RX')
 ]));

 // Running card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'running';
 S._sportMedNextStep = 7;
 var _runNeedMed = !S.sportMedDone || S._sportMedType !== 'running';
 if (!S.parqDone) { S._parqNextStep = _runNeedMed ? 27 : 7; S.sStep = 26; } else if (_runNeedMed) { S.sStep = 27; } else { S.sStep = 7; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'running'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Running'),
 h('div', {'class': 'card-sub'}, (window.isEnglish && window.isEnglish() ? 'Running training plan' : 'Plan d\'entraînement course à pied')),
 h('div', {'class': 'card-tag'}, '5K · 10K · Semi · Marathon · Trail')
 ]));

 // Hyrox card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'hyrox';
 S._sportMedNextStep = 9;
 var _hxNeedMed = !S.sportMedDone || S._sportMedType !== 'hyrox';
 if (!S.parqDone) { S._parqNextStep = _hxNeedMed ? 27 : 9; S.sStep = 26; } else if (_hxNeedMed) { S.sStep = 27; } else { S.sStep = 9; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'hyrox'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Hyrox'),
 h('div', {'class': 'card-sub'}, (window.isEnglish && window.isEnglish() ? 'Complete Hyrox preparation' : 'Préparation Hyrox complète')),
 h('div', {'class': 'card-tag'}, '8 stations · Run · Simulation')
 ]));

 // Padel card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'padel';
 S._sportMedNextStep = 11;
 var _pdNeedMed = !S.sportMedDone || S._sportMedType !== 'padel';
 if (!S.parqDone) { S._parqNextStep = _pdNeedMed ? 27 : 11; S.sStep = 26; } else if (_pdNeedMed) { S.sStep = 27; } else { S.sStep = 11; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'padel'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Padel'),
 h('div', {'class': 'card-sub'}, (window.isEnglish && window.isEnglish() ? 'Padel technique and physical program' : 'Programme technique et physique padel')),
 h('div', {'class': 'card-tag'}, 'Technique · Tactique · Match · Physique')
 ]));

 // Golf card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'golf';
 S._sportMedNextStep = 13;
 var _gfNeedMed = !S.sportMedDone || S._sportMedType !== 'golf';
 if (!S.parqDone) { S._parqNextStep = _gfNeedMed ? 27 : 13; S.sStep = 26; } else if (_gfNeedMed) { S.sStep = 27; } else { S.sStep = 13; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'golf'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Golf'),
 h('div', {'class': 'card-sub'}, (window.isEnglish && window.isEnglish() ? 'Progress in golf — Dave Pelz method' : 'Progresser au golf — méthode Dave Pelz')),
 h('div', {'class': 'card-tag'}, 'Petit jeu · Long jeu · Parcours · Mental')
 ]));

 // Triathlon / IRONMAN card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'triathlon';
 S._sportMedNextStep = 17;
 var _triNeedMed = !S.sportMedDone || S._sportMedType !== 'triathlon';
 if (!S.parqDone) { S._parqNextStep = _triNeedMed ? 27 : 17; S.sStep = 26; } else if (_triNeedMed) { S.sStep = 27; } else { S.sStep = 17; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'triathlon'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Triathlon / IRONMAN'),
 h('div', {'class': 'card-sub'}, 'Programme Jan Frodeno · Patrick Lange · Daniela Ryf'),
 h('div', {'class': 'card-tag'}, 'Sprint · Olympic · 70.3 · IRONMAN 140.6')
 ]));

 // Yoga & Mobilité card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'yoga';
 S._sportMedNextStep = 19;
 var _ygNeedMed = !S.sportMedDone || S._sportMedType !== 'yoga';
 if (!S.parqDone) { S._parqNextStep = _ygNeedMed ? 27 : 19; S.sStep = 26; } else if (_ygNeedMed) { S.sStep = 27; } else { S.sStep = 19; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'yoga'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Yoga & Mobilit\u00e9'),
 h('div', {'class': 'card-sub'}, (window.isEnglish && window.isEnglish() ? 'Flexibility, strength, balance, mindfulness' : 'Flexibilit\u00e9, force, \u00e9quilibre, pleine conscience')),
 h('div', {'class': 'card-tag'}, 'Hatha \u00b7 Vinyasa \u00b7 Yin \u00b7 Ashtanga')
 ]));

 // Cyclisme card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'cycling';
 S._sportMedNextStep = 22;
 var _cycNeedMed = !S.sportMedDone || S._sportMedType !== 'cycling';
 if (!S.parqDone) { S._parqNextStep = _cycNeedMed ? 27 : 22; S.sStep = 26; } else if (_cycNeedMed) { S.sStep = 27; } else { S.sStep = 22; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'cycling'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, (window.isEnglish && window.isEnglish() ? 'Cycling' : 'Cyclisme')),
 h('div', {'class': 'card-sub'}, (window.isEnglish && window.isEnglish() ? 'Road, MTB, indoor \u2014 improves endurance and power' : 'Route, VTT, indoor \u2014 am\u00e9liore l\'endurance et la puissance')),
 h('div', {'class': 'card-tag'}, 'Route \u00b7 VTT \u00b7 Indoor \u00b7 Gravel \u00b7 FTP')
 ]));

 // Callisthénie card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'calisthenics';
 S.calisthenicsOnboardingStep = 'A';
 S._sportMedNextStep = 24;
 var _calNeedMed = !S.sportMedDone || S._sportMedType !== 'calisthenics';
 if (!S.parqDone) { S._parqNextStep = _calNeedMed ? 27 : 24; S.sStep = 26; } else if (_calNeedMed) { S.sStep = 27; } else { S.sStep = 24; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'calisthenics'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Callisth\u00e9nie'),
 h('div', {'class': 'card-sub'}, (window.isEnglish && window.isEnglish() ? 'Street workout, bodyweight movements' : 'Street workout, mouvements au poids du corps')),
 h('div', {'class': 'card-tag'}, 'Muscle-up \u00b7 Handstand \u00b7 Planche \u00b7 Front Lever')
 ]));

 p.appendChild(typeGrid);

 // ─── Module IA — carte discrète en bas ───
 // Accessible pour les utilisateurs qui veulent une programmation 100% sur-mesure par IA
 var _iaCard = h('div', {style: 'margin-top:28px;padding:18px 16px;border:1px solid var(--border,#E8E6DF);background:var(--ivory2,#F5F3EC);border-radius:2px'});
 _iaCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Option · AI-assisted programming' : 'Option · Programmation assistée')));
 _iaCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;font-style:italic;color:var(--black,#0A0A09);line-height:1.4;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Sport programming generated by your assistant' : 'Programmation de sport générée par votre assistant')));
 _iaCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:14px'}, (window.isEnglish && window.isEnglish() ? 'A tailor-made alternative, generated according to your full profile — limited to 3 builds per week.' : 'Une alternative sur mesure, générée selon votre profil complet — limitée à 3 constructions par semaine.')));
 var _iaBtnOption = h('button', {style: 'display:inline-block;padding:10px 18px;background:transparent;color:var(--black,#0A0A09);border:1px solid var(--black,#0A0A09);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;min-height:44px'}, (window.isEnglish && window.isEnglish() ? 'Activate assistant' : 'Activer l\'assistant'));
 _iaBtnOption.addEventListener('click', function() {
   if (typeof window.openMuscuProgramGenerator === 'function') { window.openMuscuProgramGenerator(); }
 });
 _iaCard.appendChild(_iaBtnOption);
 p.appendChild(_iaCard);

 // No Continue button needed - cards auto-navigate
}

// ─── MEDICAL SAFETY LIMITS ───
var MEDICAL_LIMITS = {
  HTA_INTENSITY_CAP: 0.60  // ESC/ESH 2018: max 60% 1RM for severe hypertension
};
window.MEDICAL_LIMITS = MEDICAL_LIMITS;

// ─── BODY WEIGHT RESOLVER ───
// Priority: S.weight → last entry in S.weightHistory → 75 kg default
function _resolveBodyWeight() {
  var w = parseFloat(window.S && window.S.weight);
  if (w > 0) return w;
  var hist = window.S && window.S.weightHistory;
  if (Array.isArray(hist)) {
    for (var _wi = hist.length - 1; _wi >= 0; _wi--) {
      var _e = hist[_wi];
      var _hw = parseFloat(_e && (_e.weight || _e.w || _e));
      if (_hw > 0) return _hw;
    }
  }
  return 75;
}

// ─── ESTIMATION CALORIQUE PAR SEANCE ───
// Formule MET : kcal = MET x poids_kg x duree_heures (Ainsworth 2011)
function estimateKcal(sportType, level, durationMins) {
 // Normalise English sportLevel keys (SPORT_LEVELS ids) to French MET keys used below
 var LEVEL_FR = { beginner: 'debutant', intermediate: 'intermediaire', advanced: 'avance', pro: 'elite' };
 var levelNorm = LEVEL_FR[level] || level;
 var MET_VALUES = {
  crossfit: { scaled: 7, inter: 8, rx: 9, rx_plus: 12, 'default': 9 },
  running: { debutant: 7, intermediaire: 9, avance: 11, elite: 12, 'default': 9 },
  triathlon: { beginner: 8, intermediate: 10, advanced: 12, elite: 13, 'default': 10 },
  calisthenics: { debutant: 4, intermediaire: 6, avance: 8, elite: 9, 'default': 6 },
  cycling: { debutant: 6, intermediaire: 8, avance: 10, elite: 12, 'default': 8 },
  hyrox: { debutant: 9, intermediaire: 11, avance: 13, elite: 14, 'default': 11 },
  muscu: { debutant: 4, intermediaire: 5, avance: 6, elite: 7, 'default': 5 },
  yoga: { debutant: 2.5, intermediaire: 3, avance: 4, elite: 4, 'default': 3 },
  padel: { debutant: 6, intermediaire: 8, avance: 9, elite: 10, 'default': 8 },
  golf: { debutant: 3.5, intermediaire: 4, avance: 4.5, elite: 5, 'default': 4 }
 };
 var SESSION_DURATION_DEFAULTS = {
  crossfit: { scaled: 60, inter: 70, rx: 75, rx_plus: 90 },
  running: { debutant: 45, intermediaire: 60, avance: 75, elite: 90 },
  triathlon: { beginner: 75, intermediate: 90, advanced: 105, elite: 120 },
  calisthenics: { debutant: 50, intermediaire: 65, avance: 80, elite: 90 },
  cycling: { debutant: 60, intermediaire: 75, avance: 90, elite: 120 },
  hyrox: { debutant: 60, intermediaire: 75, avance: 90, elite: 105 },
  muscu: { debutant: 50, intermediaire: 60, avance: 75, elite: 90 },
  yoga: { debutant: 45, intermediaire: 60, avance: 75, elite: 90 },
  padel: { debutant: 60, intermediaire: 75, avance: 90, elite: 90 },
  golf: { debutant: 90, intermediaire: 120, avance: 150, elite: 180 }
 };
 var met = 8;
 if (MET_VALUES[sportType]) {
  met = MET_VALUES[sportType][levelNorm] || MET_VALUES[sportType][level] || MET_VALUES[sportType]['default'] || 8;
 }
 var poids = _resolveBodyWeight();
 var defaultDur = SESSION_DURATION_DEFAULTS[sportType] ? (SESSION_DURATION_DEFAULTS[sportType][levelNorm] || SESSION_DURATION_DEFAULTS[sportType][level] || 60) : 60;
 var dureeMin = durationMins || defaultDur;
 var duree = dureeMin / 60;
 return Math.round(met * poids * duree);
}
window.estimateKcal = estimateKcal;

// ── Bridge SFCSymbiosis universel — tous les sports hors musculation ──────────
// Convertit (sport, level) → exercices synthétiques → notifySession.
// Strip script tags, event-handler attributes, and JS/data: URIs from HTML strings
// produced by external sources (AI program output, third-party parsers).
function _sfcSanitize(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="about:blank"')
    .replace(/src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'src=""')
    .replace(/\bexpression\s*\(/gi, '')
    .replace(/data\s*:\s*text\/html/gi, 'data-blocked:text/html');
}
window._sfcSanitize = _sfcSanitize;

// Hard-blocks HTML containing any script-execution vector — returns '' immediately.
// Used as a detection gate upstream of _sfcSanitize for high-risk external content.
// If ANY of these patterns is present the entire string is rejected (never partial strip).
function _sfcBlockDangerous(html) {
  if (!html || typeof html !== 'string') return html || '';
  if (/<script\b/i.test(html))             return '';
  if (/\bon\w+\s*=/i.test(html))           return '';  // onerror=, onclick=, onload=, …
  if (/javascript\s*:/i.test(html))        return '';
  if (/vbscript\s*:/i.test(html))          return '';
  if (/data\s*:\s*text\/html/i.test(html)) return '';  // data:text/html XSS
  return html;
}
window._sfcBlockDangerous = _sfcBlockDangerous;

// notifySession reste inchangé ; seule la forme des exercices change.
// MET ≥ 9 → heavy | 5 ≤ MET < 9 → moderate | MET < 5 → light
function _sfcNotifySport(sport, level) {
  var MET_MAP = {
    crossfit:    { scaled:7, inter:8, rx:9, rx_plus:12 },
    running:     { debutant:7, intermediaire:9, avance:11, beginner:7, intermediate:9, advanced:11 },
    hyrox:       { debutant:9, intermediaire:11, avance:13, pro:14, beginner:9, intermediate:11, advanced:13 },
    padel:       { debutant:6, intermediaire:8, avance:9, competition:10, beginner:6, intermediate:8, advanced:9 },
    golf:        { debutant:3.5, intermediaire:4, avance:4.5, scratch:5, beginner:3.5, intermediate:4, advanced:4.5 },
    triathlon:   { beginner:8, intermediate:10, advanced:12, elite:13, debutant:8, intermediaire:10, avance:12 },
    cycling:     { debutant:6, intermediaire:8, avance:10, beginner:6, intermediate:8, advanced:10 },
    calisthenics:{ debutant:4, intermediaire:6, avance:8, beginner:4, intermediate:6, advanced:8 },
    yoga:        { debutant:2.5, intermediaire:3, avance:4, beginner:2.5, intermediate:3, advanced:4 }
  };
  var met = (MET_MAP[sport] && MET_MAP[sport][level]) || 6;
  // Canonical trainingLoad from MET — set before bridge so all sports have S.trainingLoad
  // even when SFCSymbiosis is not loaded. Precision engines (CF/running/cycling) override
  // this with their second assignment after _sfcNotifySport returns.
  var _loadFromMet = met >= 9 ? 'heavy' : met >= 5 ? 'moderate' : 'light';
  // Aggregate into S.trainingLoad as a cache hint only — SFCEngine is now the authoritative source
  // notifySession removed: render must never signal a completed session
  _sfcAggregateLoad(sport, _loadFromMet);
}
window._sfcNotifySport = _sfcNotifySport;

// ─── MULTI-SPORT LOAD AGGREGATOR ───
// Stores per-sport load in S.trainingLoads; computes S.dailyTrainingLoad = MAX across all
// sports seen in the current session. Called by every sport engine so a lower-intensity
// sport rendered after a heavier one does not silently overwrite S.trainingLoad.
var _LOAD_RANK = { light: 0, moderate: 1, heavy: 2 };
var _RANK_LOAD = ['light', 'moderate', 'heavy'];
function _sfcAggregateLoad(sport, load) {
  if (!window.S) return;
  if (!window.S.trainingLoads) window.S.trainingLoads = {};
  if (load) window.S.trainingLoads[sport] = load;
  var maxRank = 0;
  var loads = window.S.trainingLoads;
  Object.keys(loads).forEach(function(k) {
    var r = _LOAD_RANK[loads[k]];
    if (typeof r === 'number' && r > maxRank) maxRank = r;
  });
  var maxLoad = _RANK_LOAD[maxRank] || 'moderate';
  window.S.dailyTrainingLoad = maxLoad;
  window.S.trainingLoad      = maxLoad;
}
window._sfcAggregateLoad = _sfcAggregateLoad;

// ─── SPORT SESSION COMPLETION — shared for sports without dedicated save handlers ───
// Writes to S.sessionHistory + calls SFCSymbiosis.processCompletedSession.
// Idempotent: same sessKey is silently ignored.
function _completeSportSession(sportType, level, durationMin, sessKey, overrideLoad) {
  var dateStr = new Date().toISOString().slice(0, 10);
  var finKey  = sessKey || (sportType + '_' + dateStr);
  if (!S.sessionHistory) S.sessionHistory = {};
  if (S.sessionHistory[finKey]) return;
  var MET_MAP = { cycling: 7, triathlon: 9, padel: 7, golf: 4, yoga: 3, calisthenics: 5 };
  var met  = MET_MAP[sportType] || 6;
  var load = overrideLoad || (met >= 9 ? 'heavy' : met >= 5 ? 'moderate' : 'light');
  var kcalEst = (typeof estimateKcal === 'function') ? estimateKcal(sportType, level, durationMin) : null;
  S.sessionHistory[finKey] = {
    duration: durationMin, sport: sportType, trainingLoad: load,
    kcalBase: kcalEst ? (kcalEst.base || 0) : 0,
    kcalEpoc: kcalEst ? (kcalEst.epoc || 0) : 0,
    kcalTotal: kcalEst ? (kcalEst.total || 0) : 0,
    date: new Date().toISOString()
  };
  (function(){ var _k = Object.keys(S.sessionHistory).sort(); if (_k.length > 365) { _k.slice(0, _k.length - 365).forEach(function(k) { delete S.sessionHistory[k]; }); } })();
  _sfcAggregateLoad(sportType, load);
  var _n = load === 'heavy' ? 6 : load === 'light' ? 2 : 4;
  var _ex = []; for (var _i = 0; _i < _n; _i++) { _ex.push({ name: sportType + (_i + 1), sets: 3, reps: 10 }); }
  if (window.SFCSymbiosis && window.SFCSymbiosis.processCompletedSession) {
    try { window.SFCSymbiosis.processCompletedSession({ sessionId: finKey, date: dateStr, exercises: _ex, trainingLoad: load }); } catch (_e) {}
  } else if (typeof window.computeNutritionState === 'function') {
    try { window.computeNutritionState(true); } catch (_e) {}
  }
  if (window.GAMIFICATION) { try { window.GAMIFICATION.updateStreak(); } catch (_e) {} }
  if (window.saveProfile) { try { window.saveProfile(); } catch (_e) {} }
  if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? '✓ Session done!' : '✓ Séance terminée !'), 'success');
  window.render();
}
window._completeSportSession = _completeSportSession;

// Creer une carte estimation calorique pour les programmes sport
function buildKcalCard(kcal, durationMins) {
  var dureeStr = durationMins ? (durationMins + ' min') : '--';
  var kcalCard = h('div', {style: 'border:1px solid var(--border);background:var(--ivory2,#F4F4F0);padding:16px 20px;margin-bottom:20px;display:flex;align-items:stretch;gap:0'});

  var leftCol = h('div', {style: 'flex:1;padding-right:20px'});
  leftCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Session estimate' : 'Estimation séance')));
  leftCol.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:26px;font-style:italic;color:var(--black);line-height:1'}, '~' + kcal + ' kcal'));
  kcalCard.appendChild(leftCol);

  var divider = h('div', {style: 'width:1px;background:var(--border);flex-shrink:0'});
  kcalCard.appendChild(divider);

  var rightCol = h('div', {style: 'padding-left:20px;display:flex;flex-direction:column;justify-content:center'});
  rightCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Duration' : 'Durée')));
  rightCol.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:26px;font-style:italic;color:var(--black);line-height:1'}, dureeStr));
  kcalCard.appendChild(rightCol);

  return kcalCard;
}

// ─── STEP 26: PAR-Q — QUESTIONNAIRE DE PRÉ-QUALIFICATION MÉDICALE (ACSM 2018) ───
function renderPARQ(p) {
 // Si déjà complété, passer directement au step suivant
 if (S.parqDone) {
  var _next = S._parqNextStep || 0;
  delete S._parqNextStep;
  S.sStep = _next;
  if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
  setTimeout(function() { if (window.render) window.render(); }, 0);
  return;
 }

 // Initialiser les réponses PAR-Q si nécessaire
 if (!S._parqAnswers || typeof S._parqAnswers !== 'object') S._parqAnswers = {};

 // Header avec retour
 var hdr = h('div', {style: 'display:flex;align-items:center;gap:12px;margin-bottom:20px'});
 hdr.appendChild(h('button', {'class': 'btn-back', style: 'margin:0', onclick: function(){ S.sStep = 0; S.sportType = null; S._parqAnswers = {}; S.sportMixEnabled = false; S.sportMixSecondary = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
 hdr.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Medical evaluation' : 'Évaluation médicale')));
 p.appendChild(hdr);

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Safety' : 'Sécurité')));
 p.appendChild(h('h1', {html: 'Questionnaire<br><em>PAR-Q</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Before starting your program, answer these 7 questions recommended by ACSM (2018). Your answers are confidential.' : 'Avant de démarrer votre programme, répondez à ces 7 questions recommandées par l\'ACSM (2018). Vos réponses sont confidentielles.')));

 // 7 questions PAR-Q
 var PARQ_QUESTIONS = [
  { id: 'cardiac',       text: (window.isEnglish && window.isEnglish() ? 'Has your doctor ever told you that you have a heart condition?' : 'Votre médecin vous a-t-il déjà dit que vous aviez un problème cardiaque ?') },
  { id: 'chestPain',    text: (window.isEnglish && window.isEnglish() ? 'Do you feel chest pain when you do physical activity?' : 'Ressentez-vous des douleurs thoraciques lors d\'une activité physique ?') },
  { id: 'dizziness',    text: (window.isEnglish && window.isEnglish() ? 'Do you lose your balance because of dizziness or do you ever lose consciousness?' : 'Avez-vous des étourdissements ou pertes de connaissance lors de l\'effort ?') },
  { id: 'medication',   text: (window.isEnglish && window.isEnglish() ? 'Are you currently taking medication for blood pressure or heart condition?' : 'Prenez-vous des médicaments pour la tension artérielle ou le cœur ?') },
  { id: 'jointIssue',   text: (window.isEnglish && window.isEnglish() ? 'Do you have a bone or joint problem that could be made worse by exercise?' : 'Avez-vous un problème osseux ou articulaire aggravé par l\'exercice ?') },
  { id: 'pregnant',     text: (window.isEnglish && window.isEnglish() ? 'Are you pregnant or have you given birth in the last 6 weeks?' : 'Êtes-vous enceinte ou avez-vous accouché il y a moins de 6 semaines ?'), femmeOnly: true },
  { id: 'otherReason',  text: (window.isEnglish && window.isEnglish() ? 'Do you know of any other reason why you should not do physical activity?' : 'Avez-vous une autre raison médicale de ne pas faire d\'activité physique ?') }
 ].filter(function(q) { return !q.femmeOnly || window.isFemale(S); });

 var _hasYes = PARQ_QUESTIONS.some(function(q) { return S._parqAnswers[q.id] === true; });
 var _allAnswered = PARQ_QUESTIONS.every(function(q) { return S._parqAnswers[q.id] === true || S._parqAnswers[q.id] === false; });

 var qList = h('div', {style: 'margin-bottom:20px'});
 PARQ_QUESTIONS.forEach(function(q) {
  var answered = S._parqAnswers[q.id] === true || S._parqAnswers[q.id] === false;
  var isYes = S._parqAnswers[q.id] === true;

  var qRow = h('div', {style: 'border:1px solid var(--border,#E8E6DF);border-radius:2px;padding:14px 16px;margin-bottom:8px;background:' + (isYes ? 'rgba(90,16,16,0.04)' : answered ? 'rgba(26,74,26,0.04)' : 'transparent')});
  qRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black,#1A1A18);line-height:1.5;margin-bottom:10px'}, q.text));

  var btnRow = h('div', {style: 'display:flex;gap:10px'});
  // OUI
  var yesBtn = h('button', {
   style: 'flex:1;padding:10px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;border:1px solid ' + (isYes ? 'var(--error,#7A1F1F)' : 'var(--line,#E8E6DF)') + ';background:' + (isYes ? 'rgba(90,16,16,0.12)' : 'transparent') + ';color:' + (isYes ? 'var(--error,#7A1F1F)' : 'var(--ink-900,#0A0A09)') + ';font-weight:' + (isYes ? '700' : '400'),
   onclick: (function(_qid) { return function() { S._parqAnswers[_qid] = true; window.render(); }; })(q.id)
  }, (window.isEnglish && window.isEnglish() ? 'Yes' : 'Oui'));
  btnRow.appendChild(yesBtn);
  // NON
  var noBtn = h('button', {
   style: 'flex:1;padding:10px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;border:1px solid ' + (!isYes && answered ? 'var(--ink-900,#0A0A09)' : 'var(--line,#E8E6DF)') + ';background:' + (!isYes && answered ? 'rgba(26,74,26,0.08)' : 'transparent') + ';color:' + (!isYes && answered ? 'var(--ink-900,#0A0A09)' : 'var(--black,#1A1A18)') + ';font-weight:' + (!isYes && answered ? '700' : '400'),
   onclick: (function(_qid) { return function() { S._parqAnswers[_qid] = false; window.render(); }; })(q.id)
  }, (window.isEnglish && window.isEnglish() ? 'No' : 'Non'));
  btnRow.appendChild(noBtn);
  qRow.appendChild(btnRow);
  qList.appendChild(qRow);
 });
 p.appendChild(qList);

 if (!_allAnswered) {
  // Pas encore toutes les réponses : bouton grisé
  var continueBtn = h('button', {'class': 'btn-primary', style: 'opacity:0.5;cursor:not-allowed'}, (window.isEnglish && window.isEnglish() ? 'Answer all questions' : 'Répondre à toutes les questions'));
  p.appendChild(continueBtn);
  return;
 }

 if (!_hasYes) {
  // Toutes les réponses sont NON → clear, continuer directement
  var okBtn = h('button', {'class': 'btn-primary', onclick: function() {
   S.parqDone = true;
   S.parqResult = 'clear';
   S._parqAnswers = {};
   var nextStep = S._parqNextStep || 0;
   delete S._parqNextStep;
   S.sStep = nextStep;
   if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
   window.render();
  }}, (window.isEnglish && window.isEnglish() ? 'Continue →' : 'Continuer →'));
  p.appendChild(okBtn);
  p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey);text-align:center;margin-top:12px'}, (window.isEnglish && window.isEnglish() ? 'All your answers are "No" — you can start safely.' : 'Toutes vos réponses sont "Non" — vous pouvez démarrer en toute sécurité.')));
 } else {
  // Au moins une réponse OUI → avertissement médical
  var warnDiv = h('div', {style: 'border-left:3px solid var(--error,#7A1F1F);background:rgba(122,31,31,0.06);padding:14px 16px;margin-bottom:20px;border-radius:0'});
  warnDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:700;color:var(--error,#7A1F1F);margin-bottom:8px;letter-spacing:0.5px'}, (window.isEnglish && window.isEnglish() ? '\u26A0 Consult your doctor before starting this program.' : '\u26A0 Consultez votre médecin avant de démarrer ce programme.')));
  warnDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--error,#7A1F1F);line-height:1.6'}, (window.isEnglish && window.isEnglish() ? 'Show them this questionnaire and get their written approval. One or more of your answers indicate that a prior medical evaluation is recommended (ACSM 2018).' : 'Montrez-lui ce questionnaire et obtenez son accord écrit. Une ou plusieurs de vos réponses indiquent qu\'une évaluation médicale préalable est recommandée (ACSM 2018).')));
  p.appendChild(warnDiv);

  var docBtn = h('button', {'class': 'btn-primary', onclick: function() {
   if (S._parqAnswers.pregnant === true && window.isFemale(S)) S.pregnant = true;
   S.parqDone = true;
   S.parqResult = 'medical_cleared';
   S._parqAnswers = {};
   var nextStep = S._parqNextStep || 0;
   delete S._parqNextStep;
   S.sStep = nextStep;
   if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
   window.render();
  }}, (window.isEnglish && window.isEnglish() ? 'I have consulted my doctor and have their approval' : 'J\'ai consulté mon médecin et j\'ai son accord'));
  p.appendChild(docBtn);

  var overrideBtn = h('button', {
   style: 'display:block;width:100%;margin-top:10px;padding:12px;border:1px solid var(--border,#E8E6DF);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);cursor:pointer;border-radius:2px;text-align:center',
   onclick: function() {
    if (S._parqAnswers.pregnant === true && window.isFemale(S)) S.pregnant = true;
    S.parqDone = true;
    S.parqResult = 'user_override';
    S._parqAnswers = {};
    var nextStep = S._parqNextStep || 0;
    delete S._parqNextStep;
    S.sStep = nextStep;
    if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
    window.render();
   }
  }, (window.isEnglish && window.isEnglish() ? 'I understand the risks and continue' : 'Je comprends les risques et je continue'));
  p.appendChild(overrideBtn);
 }
}

// ─── STEP 20: QUESTIONNAIRE MÉDICAL MUSCU ───
function renderMuscuMedicalQ(p) {
 if (!S.muscuMedical || typeof S.muscuMedical !== 'object' || Array.isArray(S.muscuMedical)) S.muscuMedical = {};
 var med = S.muscuMedical;

 // Header with back button
 var hdr = h('div', {style: 'display:flex;align-items:center;gap:12px;margin-bottom:20px'});
 // FIX BUG 2026-04-26 : back depuis éval. médicale muscu ne doit pas effacer sportType.
 // L'user retourne à la sélection du sport (sStep 0) avec son choix "Musculation" conservé.
 hdr.appendChild(h('button', {'class': 'btn-back', style: 'margin:0', onclick: function(){ S.sStep = 0; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
 hdr.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Medical evaluation' : 'Évaluation médicale')));
 p.appendChild(hdr);

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Medical<br><em>assessment muscu</em>' : 'Bilan<br><em>médical muscu</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Before generating your program, help us adapt exercises to your physical situation.' : 'Avant de g\u00e9n\u00e9rer votre programme, aidez-nous \u00e0 adapter les exercices \u00e0 votre situation physique.')));

 // FIX 2026-04-19 — Alerte HTA sévère (ESC/ESH 2018) : Valsalva et charges >80% 1RM contre-indiqués
 if (Array.isArray(S.medical) && S.medical.indexOf('hta_severe') !== -1) {
   var _htaAlert = h('div', {style: 'background:rgba(220,53,69,0.07);border:1px solid rgba(220,53,69,0.3);padding:12px 14px;margin-bottom:16px;border-radius:2px;'});
   _htaAlert.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:700;color:#8B0000;letter-spacing:1px;margin-bottom:4px;'}, (window.isEnglish && window.isEnglish() ? '\u26a0 Severe hypertension detected' : '\u26a0 HTA sévère détectée')));
   _htaAlert.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#8B0000;line-height:1.6;'}, (window.isEnglish && window.isEnglish() ? 'Loads limited to 40–60% of 1RM. Avoid Valsalva maneuver (breath-holding under load), intense isometric movements and overhead exercises with heavy loads. Consult your doctor before starting. — ESC/ESH 2018' : 'Charges limitées à 40–60% du 1RM. Éviter la manœuvre de Valsalva (apnée sous charge), les mouvements isométriques intenses et les exercices au-dessus de la tête à charge élevée. Consultez votre médecin avant de commencer. — ESC/ESH 2018')));
   p.appendChild(_htaAlert);
 }

 // Phrase de contexte si bilan nutrition déjà fait — évite le sentiment de répétition
 if (Array.isArray(window.S && window.S.medical)) {
   var _contextNote = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);background:var(--ivory2,#F5F3EC);border-left:2px solid var(--border);padding:10px 12px;margin-bottom:16px;line-height:1.6;'});
   _contextNote.textContent = (window.isEnglish && window.isEnglish() ? 'These questions complement your nutrition profile. They specifically address your joints and orthopedic history — different from your general medical conditions.' : 'Ces questions compl\u00e8tent votre profil nutrition. Elles portent sp\u00e9cifiquement sur vos articulations et ant\u00e9c\u00e9dents orthop\u00e9diques — diff\u00e9rentes de vos conditions m\u00e9dicales g\u00e9n\u00e9rales.');
   p.appendChild(_contextNote);
 }

 // ── SKIP si déjà rempli ──────────────────────────────────────────────────
 if (S.muscuMedical && S.muscuMedical.done === true && !S._muscuMedicalEdit) {
  // Résumé compact
  var _painZones = ['shoulders','elbows','wrists','neck','upperBack','lowerBack','hips','knees','ankles','feet'];
  var _diagKeys = ['herniaDisc','herniaInguinal','rotatorCuff','acl','osteoporosis','hypertension','rheumatoidArthritis','fibromyalgia','meniscus','spondylarthritis','kneeOsteoarthritis','epicondylitis'];
  var _anyPain = _painZones.some(function(z) { return !!S.muscuMedical[z]; });
  var _anyDiag = _diagKeys.some(function(z) { return !!S.muscuMedical[z]; });
  var _summaryCard = h('div', {style: 'border:1px solid var(--border);padding:16px;background:var(--ivory2,#F5F3EC);margin-bottom:20px;'});
  _summaryCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px;'}, (window.isEnglish && window.isEnglish() ? 'Medical profile saved' : 'Profil médical enregistré')));
  var _summaryText = _anyPain || _anyDiag
    ? (window.isEnglish && window.isEnglish() ? 'Sensitive areas have been noted — the program accounts for them.' : 'Des zones sensibles ont été notées — le programme les prend en compte.')
    : (window.isEnglish && window.isEnglish() ? 'No physical constraints reported. Standard program.' : 'Aucune contrainte physique signalée. Programme standard.');
  _summaryCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black);margin-bottom:12px;line-height:1.5;'}, _summaryText));
  var _editBtn = h('button', {
    style: 'padding:8px 14px;border:1px solid var(--border);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--grey);',
    onclick: function() { S._muscuMedicalEdit = true; window.render(); }
  }, (window.isEnglish && window.isEnglish() ? 'Edit' : 'Modifier'));
  _summaryCard.appendChild(_editBtn);
  p.appendChild(_summaryCard);

  // Continuer directement
  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
    if (S._medicalReturnToDashboard) { S._medicalReturnToDashboard = false; S.sStep = 4; }
    else { S.sStep = !S.sportLevel ? 1 : 16; }
    if (window.saveProfile) window.saveProfile();
    window.render();
  }}, (window.isEnglish && window.isEnglish() ? 'Continue' : 'Continuer')));
  return;
 }

 // For beginners: show a simple YES/NO filter first
 if ((S.sportLevel === 'beginner' || !S.sportLevel) && !S._muscuMedicalExpanded) {
  var filterCard = h('div', {style: 'margin-bottom:20px'});
  filterCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black,#1A1A18);margin-bottom:16px;line-height:1.5'}, (window.isEnglish && window.isEnglish() ? 'Do you have chronic pain, a recent injury or a medical diagnosis?' : 'Avez-vous une douleur chronique, une blessure récente ou un diagnostic médical ?')));
  var filterBtns = h('div', {style: 'display:flex;gap:12px'});
  filterBtns.appendChild(h('button', {
   style: 'flex:1;padding:14px;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#1A1A18);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer',
   onclick: function() { S._muscuMedicalExpanded = true; window.render(); }
  }, (window.isEnglish && window.isEnglish() ? 'Yes, I have something to report' : 'Oui, j\'ai quelque chose à signaler')));
  filterBtns.appendChild(h('button', {
   style: 'flex:1;padding:14px;background:transparent;color:var(--black,#1A1A18);border:1px solid var(--border,#E8E6DF);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer',
   onclick: function() { S.muscuMedical = { done: true }; S.sStep = !S.sportLevel ? 1 : 16; if (window.saveProfile) window.saveProfile(); window.render(); }
  }, (window.isEnglish && window.isEnglish() ? 'No, I am in good health' : 'Non, je suis en bonne santé')));
  filterCard.appendChild(filterBtns);
  p.appendChild(filterCard);
  return; // Don't show the full medical form
 }
 // S._muscuMedicalExpanded = true → show full form (existing code runs normally)

 // ─── Section 1 : Zones douloureuses ───
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Do you have pain or vulnerabilities?' : 'Avez-vous des douleurs ou fragilités ?')));

 var zonesData = [
 {key: 'shoulders', label: (window.isEnglish && window.isEnglish() ? 'Shoulders' : 'Épaules'), icon: ''},
 {key: 'elbows', label: (window.isEnglish && window.isEnglish() ? 'Elbows' : 'Coudes'), icon: ''},
 {key: 'wrists', label: (window.isEnglish && window.isEnglish() ? 'Wrists' : 'Poignets'), icon: ''},
 {key: 'neck', label: (window.isEnglish && window.isEnglish() ? 'Neck/Cervical' : 'Nuque/Cervicales'), icon: ''},
 {key: 'upperBack', label: (window.isEnglish && window.isEnglish() ? 'Upper back' : 'Haut du dos'), icon: ''},
 {key: 'lowerBack', label: (window.isEnglish && window.isEnglish() ? 'Lower back' : 'Bas du dos'), icon: ''},
 {key: 'hips', label: (window.isEnglish && window.isEnglish() ? 'Hips' : 'Hanches'), icon: ''},
 {key: 'knees', label: (window.isEnglish && window.isEnglish() ? 'Knees' : 'Genoux'), icon: ''},
 {key: 'ankles', label: (window.isEnglish && window.isEnglish() ? 'Ankles' : 'Chevilles'), icon: ''},
 {key: 'feet', label: (window.isEnglish && window.isEnglish() ? 'Feet (fasciitis)' : 'Pieds (fasciite)'), icon: ''}
 ];

 var zonesGrid = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px'});
 zonesData.forEach(function(z) {
 var active = med[z.key];
 var chip = h('div', {
 style: 'padding:8px 14px;border-radius:2px;border:1.5px solid ' + (active ? 'var(--error,#7A1F1F)' : 'var(--line)') + ';background:' + (active ? 'rgba(122,31,31,0.06)' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:' + (active ? 'var(--error,#7A1F1F)' : 'var(--ink-900,#0A0A09)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
 onclick: (function(key){ return function(){ S.muscuMedical[key] = !S.muscuMedical[key]; window.render(); }; })(z.key)
 }, z.icon + ' ' + z.label);
 zonesGrid.appendChild(chip);
 });
 p.appendChild(zonesGrid);

 // ─── Section 2 : Antécédents diagnostiqués ───
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Do you have a confirmed diagnosis?' : 'Avez-vous un diagnostic confirmé ?')));

 var antecedentsData = [
 {key: 'herniaDisc', label: (window.isEnglish && window.isEnglish() ? 'Disc herniation (MRI)' : 'Hernie discale (IRM)')},
 {key: 'herniaInguinal', label: (window.isEnglish && window.isEnglish() ? 'Inguinal hernia' : 'Hernie inguinale')},
 {key: 'rotatorCuff', label: (window.isEnglish && window.isEnglish() ? 'Rotator cuff tear' : 'Déchirure coiffe des rotateurs')},
 {key: 'acl', label: (window.isEnglish && window.isEnglish() ? 'ACL repaired/weakened' : 'LCA opéré/fragilisé')},
 {key: 'osteoporosis', label: (window.isEnglish && window.isEnglish() ? 'Osteoporosis' : 'Ostéoporose')},
 {key: 'hypertension', label: (window.isEnglish && window.isEnglish() ? 'Severe hypertension (≥180/110)' : 'HTA sévère (≥180/110)')},
 {key: 'rheumatoidArthritis', label: (window.isEnglish && window.isEnglish() ? 'Rheumatoid arthritis (RA)' : 'Polyarthrite rhumatoïde (PR)')},
 {key: 'fibromyalgia', label: (window.isEnglish && window.isEnglish() ? 'Fibromyalgia' : 'Fibromyalgie')},
 {key: 'meniscus', label: (window.isEnglish && window.isEnglish() ? 'Meniscus damaged/repaired' : 'Ménisque lésé/opéré')},
 {key: 'spondylarthritis', label: (window.isEnglish && window.isEnglish() ? 'Ankylosing spondylitis' : 'Spondylarthrite ankylosante')},
 {key: 'kneeOsteoarthritis', label: (window.isEnglish && window.isEnglish() ? 'Knee osteoarthritis' : 'Gonarthrose (arthrose du genou)')},
 {key: 'epicondylitis', label: (window.isEnglish && window.isEnglish() ? 'Lateral epicondylitis (tennis elbow)' : 'Épicondylite latérale (tennis elbow)')}
 ];

 var antGrid = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px'});
 antecedentsData.forEach(function(a) {
 var active = med[a.key];
 var chip = h('div', {
 style: 'padding:8px 14px;border-radius:2px;border:1.5px solid ' + (active ? 'var(--error,#7A1F1F)' : 'var(--line)') + ';background:' + (active ? 'rgba(122,31,31,0.06)' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:' + (active ? 'var(--error,#7A1F1F)' : 'var(--ink-900,#0A0A09)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
 onclick: (function(key){ return function(){ S.muscuMedical[key] = !S.muscuMedical[key]; window.render(); }; })(a.key)
 }, a.label);
 antGrid.appendChild(chip);
 });
 p.appendChild(antGrid);

 // ─── Section 3 : Niveau de douleur général (si au moins une zone cochée) ───
 var hasAnyZone = zonesData.some(function(z){ return med[z.key]; });
 if (hasAnyZone) {
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'What is the general intensity?' : 'Quelle est l\'intensité générale ?')));
 var painLevels = [
 {val: 0, label: (window.isEnglish && window.isEnglish() ? 'None' : 'Aucune')},
 {val: 1, label: (window.isEnglish && window.isEnglish() ? 'Mild' : 'Légère')},
 {val: 2, label: (window.isEnglish && window.isEnglish() ? 'Moderate' : 'Modérée')},
 {val: 3, label: (window.isEnglish && window.isEnglish() ? 'Severe' : 'Sévère')}
 ];
 var painRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px'});
 painLevels.forEach(function(pl) {
 var active = med.painLevel === pl.val;
 var btn = h('div', {
 style: 'padding:8px 16px;border-radius:2px;border:1.5px solid ' + (active ? 'var(--error,#7A1F1F)' : 'var(--line)') + ';background:' + (active ? 'rgba(122,31,31,0.06)' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:' + (active ? 'var(--error,#7A1F1F)' : 'var(--ink-900,#0A0A09)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
 onclick: (function(v){ return function(){ S.muscuMedical.painLevel = v; window.render(); }; })(pl.val)
 }, pl.label);
 painRow.appendChild(btn);
 });
 p.appendChild(painRow);
 }

 // ─── Section 4 : Notes libres ───
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Notes (optional)' : 'Notes (optionnel)')));
 var textarea = h('textarea', {
 placeholder: (window.isEnglish && window.isEnglish() ? 'Specify if needed (e.g., knee surgery 2022, herniation L4-L5...)' : 'Précisez si besoin (ex: opération genou 2022, hernie L4-L5...)'),
 style: 'width:100%;min-height:72px;padding:10px;border:1px solid var(--border);background:var(--ivory);font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;resize:vertical;box-sizing:border-box;margin-bottom:16px',
 oninput: function(e){ S.muscuMedical.notes = e.target.value; }
 });
 if (med.notes) textarea.value = med.notes;
 p.appendChild(textarea);

 // ─── Avertissement si sévère ou antécédent grave ───
 var hasSevere = med.painLevel === 3 || med.herniaDisc || med.rotatorCuff || med.acl || med.fibromyalgia || med.meniscus || med.osteoporosis || med.hypertension || med.spondylarthritis || med.rheumatoidArthritis;
 if (hasSevere) {
 var warn = h('div', {style: 'background:rgba(122,31,31,0.06);border:1px solid var(--error,#7A1F1F);padding:12px 14px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--error,#7A1F1F);line-height:1.6'});
 warn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Caution — Serious condition detected' : 'Attention — Antécédent grave détecté')));
 warn.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? 'Program adapted in rehabilitation mode. Consult a doctor or physiotherapist before resuming heavy lifting.' : 'Programme adapté en mode réhabilitation. Consultez un médecin ou kinésithérapeute avant de reprendre la musculation lourde.')));
 p.appendChild(warn);
 }

 // ─── Bouton Continuer ───
 p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
 S.muscuMedical.done = true;
 delete S._muscuMedicalEdit;
 // FIX DESYNC CRITICAL 2026-04-16 — régénérer le programme après modif bilan médical
 // Avant : user modifie "hernie discale" depuis step 4, revient → deadlifts toujours dans le programme
 if (Array.isArray(S.sportProgram) && S.sportProgram.length > 0) { S.sportProgram = null; S.muscuIAProgram = null; S.bonusExercises = {}; }
 if (S._medicalReturnToDashboard) { S._medicalReturnToDashboard = false; S.sStep = 4; }
 else { S.sStep = !S.sportLevel ? 1 : 16; }
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? 'Continue \u2192' : 'Continuer \u2192')));

 // ─── Bouton Passer ───
 var skipLink = h('button', {
 style: 'width:100%;padding:14px;margin-top:12px;background:transparent;color:var(--black,#1A1A18);border:1px solid var(--border,#E8E6DF);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;min-height:48px',
 onclick: function(){
 S.muscuMedical.done = true;
 delete S._muscuMedicalEdit;
 // FIX DESYNC CRITICAL 2026-04-16 — idem bouton Passer
 if (Array.isArray(S.sportProgram) && S.sportProgram.length > 0) { S.sportProgram = null; S.muscuIAProgram = null; S.bonusExercises = {}; }
 if (S._medicalReturnToDashboard) { S._medicalReturnToDashboard = false; S.sStep = 4; }
 else { S.sStep = !S.sportLevel ? 1 : 16; }
 window.render();
 }
 }, (window.isEnglish && window.isEnglish() ? 'Skip (no pain)' : 'Passer (aucune douleur)'));
 p.appendChild(skipLink);
}

// ─── STEP 16: QUESTIONNAIRE CHARGES ───
function renderChargesQuestionnaire(p) {
 // For beginners who have never trained: replace with reassurance card
 if (S.sportLevel === 'beginner' || !S.sportLevel) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
  p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Ready to<br><em>start?</em>' : 'Prêt\u00b7e à<br><em>commencer ?</em>')}));
  var reassureCard = h('div', {style: 'background:var(--paper-2,#F4F1EA);border-left:3px solid var(--ink-900,#0A0A09);padding:16px;margin-bottom:24px;border-radius:0'});
  reassureCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;font-style:italic;margin-bottom:8px;color:var(--black,#1A1A18)'}, (window.isEnglish && window.isEnglish() ? 'Just starting? That\'s perfect.' : 'Vous débutez ? C\'est parfait.')));
  reassureCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'No need to know your loads. We use your body weight as a starting reference and adapt progressively.' : 'Pas besoin de connaître vos charges. Nous utilisons votre poids de corps comme référence de départ et adaptons progressivement.')));
  reassureCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'You can enter your loads after your first 2 sessions.' : 'Vous pourrez entrer vos charges après vos 2 premières séances.')));
  p.appendChild(reassureCard);
  var contBtn = h('button', {
   style: 'width:100%;padding:16px;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer',
   onclick: function() { var _nxt = S._chargesFromLevel ? 3 : (S._chargesReturnToDashboard ? 4 : 1); S._chargesFromLevel = false; S._chargesReturnToDashboard = false; S.sStep = _nxt; if (window.saveProfile) window.saveProfile(); window.render(); }
  }, (window.isEnglish && window.isEnglish() ? 'Continue →' : 'Continuer →'));
  p.appendChild(contBtn);
  var backLink = h('div', {style: 'text-align:center;margin-top:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);cursor:pointer;text-decoration:underline', onclick: function(){ var _bk = S._chargesFromLevel ? 2 : 15; S._chargesFromLevel = false; S.sStep = _bk; window.render(); }}, (window.isEnglish && window.isEnglish() ? '← Back' : '← Retour'));
  p.appendChild(backLink);
  return;
 }

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Load<br><em>assessment</em>' : '\u00c9valuation<br><em>des charges</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Optional but valuable. Enter the load you use for 8-10 clean reps. Leave blank if you don\'t do the exercise.' : 'Optionnel mais précieux. Indiquez la charge avec laquelle vous faites 8-10 reps propres. Laissez vide si vous ne pratiquez pas l\'exercice.')));
 var _chargesInfoCard = h('div', {style: 'background:var(--paper-2,#F4F1EA);border-left:3px solid var(--ink-900,#0A0A09);padding:12px 16px;margin-bottom:16px;border-radius:0'});
 _chargesInfoCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#1A1A18);line-height:1.6;margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'This data allows the AI to calculate loads to the nearest kilo for each exercise.' : 'Ces données permettent à l\'IA de calculer des charges au kilo près pour chaque exercice.')));
 _chargesInfoCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'If you don\'t know your loads: leave everything blank. The AI will use your body weight as a reference.' : 'Si vous ne connaissez pas vos charges : laissez tout vide. L\'IA utilisera votre poids de corps comme référence.')));
 p.appendChild(_chargesInfoCard);

 // Medical/age safety warnings
 var hasDiabetes = Array.isArray(S.medical) && (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1);
 if (hasDiabetes) {
 p.appendChild(h('div', {style: 'background:rgba(232,111,30,0.06);border:1px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;line-height:1.6'}, [
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange,#E86F1E);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Diabetes — Sports precautions' : 'Diabète — Précautions sportives')),
 (function(){ var _d = h('div', {style: 'color:var(--grey,#6B6B65)'}); _d.appendChild(document.createTextNode('Mesurez votre glycémie avant/après chaque séance. Évitez l\'entraînement si glycémie < 4,0 mmol/L ou > 14,0 mmol/L. Gardez toujours une source de sucres rapides à portée de main. Intensité progressive recommandée (')); _d.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _d.appendChild(document.createTextNode(' max 7/10 les 4 premières semaines).')); return _d; })()
 ]));
 }
 if (getAge() >= 50) {
 p.appendChild(h('div', {style: 'background:rgba(62,92,58,0.06);border:1px solid var(--green,#3E5C3A);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;line-height:1.6'}, [
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--green,#3E5C3A);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Athlete 50+ — Recommended adaptations' : 'Athlète 50+ — Adaptations recommandées')),
 h('div', {style: 'color:var(--grey,#6B6B65)'}, (window.isEnglish && window.isEnglish() ? 'Extended warm-up 15-20 min (vs 5-10 min standard). Deload every 4-5 weeks (vs 6 weeks). Prefer guided machines over free bars for maximum loads. Inter-session recovery 48-72h minimum. Annual medical check-up advised.' : 'Échauffement prolongé 15-20 min (vs 5-10 min standard). Décharge toutes les 4-5 semaines (vs 6 semaines). Préférez machines guidées aux barres libres pour les charges maximales. Récupération inter-séance 48-72h minimum. Contrôle médical annuel conseillé.'))
 ]));
 }
 if (S.pregnant && window.isFemale(S)) {
 p.appendChild(h('div', {style: 'background:rgba(122,31,31,0.06);border:1px solid var(--error,#7A1F1F);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;line-height:1.6'}, [
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--error,#7A1F1F);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Pregnancy — Authorized exercises only' : 'Grossesse — Exercices autorisés seulement')),
 h('div', {style: 'color:var(--grey,#6B6B65)'}, (window.isEnglish && window.isEnglish() ? 'Avoid heavy loads, lying on your back exercises (after 20 weeks), hyperpressive abs, jumping and intense HIIT. Favor walking, swimming, prenatal yoga, Kegel. Consult your doctor before any training.' : 'Évitez les charges lourdes, exercices allongés sur le dos (après 20 SA), abdominaux hyperpressifs, sauts et HIIT intense. Privilégiez marche, natation, yoga prénatal, Kegel. Consultez votre médecin avant tout entraînement.'))
 ]));
 }

 if (Object.keys(S.muscuStrengthProfile || {}).length === 0) {
 var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var saved = localStorage.getItem('mtd_muscu_strength_' + userId);
 if (saved) { try { S.muscuStrengthProfile = JSON.parse(saved); } catch(e) {} }
 }
 if (!S.muscuStrengthProfile || typeof S.muscuStrengthProfile !== 'object' || Array.isArray(S.muscuStrengthProfile)) S.muscuStrengthProfile = {};

 var bodyWeight = _resolveBodyWeight();
 var strengthThresholds = {
 bench_press: {low:0.5,mid:1.0}, squat: {low:0.75,mid:1.25},
 deadlift: {low:1.0,mid:1.5}, overhead_press: {low:0.35,mid:0.65},
 barbell_row: {low:0.5,mid:0.85}, barbell_curl: {low:0.2,mid:0.4},
 hip_thrust: {low:0.75,mid:1.25}, leg_press: {low:1.5,mid:2.5}
 };

 var grid = h('div', {style: 'margin-bottom:16px'});
 (window.MUSCU_KEY_EXERCISES || []).forEach(function(exDef) {
 var currentVal = S.muscuStrengthProfile[exDef.key] || '';
 var row = h('div', {style: 'display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--border);background:var(--ivory2);margin-bottom:4px'});
 var nameCol = h('div', {style: 'flex:1;min-width:0'});
 nameCol.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px'}, exDef.icon + ' ' + exDef.name));
 nameCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--grey);margin-top:2px'}, exDef.muscle));
 row.appendChild(nameCol);
 var inputWrap = h('div', {style: 'display:flex;align-items:center;gap:4px;flex-shrink:0'});
 var inp = h('input', {
 type: 'number', step: '2.5', min: '0', max: '500',
 inputmode: 'decimal', autocomplete: 'off',
 value: currentVal ? String(currentVal) : '',
 placeholder: '\u2014',
 style: 'width:80px;padding:10px 8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory);min-height:44px;',
 onchange: (function(key) { return function(e) {
 var v = parseFloat(e.target.value);
 if (!isNaN(v) && v > 0) S.muscuStrengthProfile[key] = v;
 else delete S.muscuStrengthProfile[key];
 var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 try { localStorage.setItem('mtd_muscu_strength_' + uid, JSON.stringify(S.muscuStrengthProfile)); } catch(e2) { console.warn('[muscu_strength] localStorage error:', e2); }
 if (!isNaN(v) && v > 0 && window.PERF_HISTORY) {
 var repsVal = S.muscuStrengthProfile[key + '_reps'] || 8;
 PERF_HISTORY.recordMuscuStrength(key, v, repsVal);
 }
 if (window.GAMIFICATION) GAMIFICATION.checkMuscuBadges(S.muscuStrengthProfile);
 }; })(exDef.key)
 });
 inputWrap.appendChild(inp);
 inputWrap.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'kg'));
 row.appendChild(inputWrap);
 // Reps input for accurate Epley 1RM
 var repKey = exDef.key + '_reps';
 var currentReps = S.muscuStrengthProfile[repKey] || 8;
 var repInp = h('input', {
 type: 'number', min: '1', max: '30', value: String(currentReps),
 inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Nombre de répétitions',
 style: 'width:56px;padding:10px 4px;border:1px solid var(--border);font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory);margin-left:4px;min-height:44px;',
 onchange: (function(rkey, wkey) { return function(e) {
 var rv = parseInt(e.target.value);
 if (!isNaN(rv) && rv >= 1 && rv <= 30) S.muscuStrengthProfile[rkey] = rv;
 var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 try { localStorage.setItem('mtd_muscu_strength_' + uid, JSON.stringify(S.muscuStrengthProfile)); } catch(e2) { console.warn('[muscu_strength_reps] localStorage error:', e2); }
 }; })(repKey, exDef.key)
 });
 inputWrap.appendChild(repInp);
 inputWrap.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, window.t('muscu.reps')));
 if (currentVal && currentVal > 0) {
 var thresh = strengthThresholds[exDef.key] || {low:0.5,mid:1.0};
 var ratio = currentVal / bodyWeight;
 var lbl = ratio < thresh.low ? window.t('sport.beginner') : ratio < thresh.mid ? window.t('sport.intermediate') : window.t('sport.advanced');
 var col = ratio < thresh.low ? 'var(--orange-ink,#7A3B0E)' : ratio < thresh.mid ? 'var(--blue,#1A3A6A)' : 'var(--success,#3E5C3A)';
 // Epley formula: 1RM = weight × (1 + reps/30) — accurate for 1-15 reps
 var usedReps = S.muscuStrengthProfile[repKey] || 8;
 var est1rm = Math.round(currentVal * (1 + usedReps / 30) / 2.5) * 2.5;
 var rightCol = h('div', {style: 'text-align:right;flex-shrink:0'});
 rightCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:' + col}, lbl));
 var _1rmDiv = h('div', {style: 'font-family:Georgia;font-size:11px;color:var(--grey);margin-top:2px'});
 _1rmDiv.appendChild(h('span', {}, '~'));
 _1rmDiv.appendChild(termTooltip('1RM', 'Répétition Maximale — la charge max que vous pouvez soulever une seule fois'));
 _1rmDiv.appendChild(h('span', {}, ' : ' + (window.UNITS ? window.UNITS.displayWeight(est1rm) : est1rm + ' kg')));
 rightCol.appendChild(_1rmDiv);
 row.appendChild(rightCol);
 }
 grid.appendChild(row);
 });
 p.appendChild(grid);

 // ─── STRENGTH LEADERBOARD PERSO ───
 (function() {
   var _bw = _resolveBodyWeight();
   var _sex = window.isFemale(S) ? 'f' : 'm';
   // Percentile thresholds [ratio×BW] by sex for Bench/Squat/Deadlift
   // Sources: Symmetric Strength population data (general gym population)
   var _thresholds = {
     bench_press: { m: [0.5, 0.75, 1.0, 1.3, 1.6], f: [0.3, 0.5, 0.65, 0.85, 1.05] },
     squat:       { m: [0.75, 1.0, 1.25, 1.6, 2.0], f: [0.5, 0.7,  0.9,  1.1,  1.4] },
     deadlift:    { m: [1.0,  1.25, 1.5, 1.8, 2.2], f: [0.65, 0.9, 1.1,  1.3,  1.6] }
   };
   var _percLabels = ['< 25%', '25%', '50%', '75%', '90%', '> 90%'];
   var _percColors = ['var(--orange-ink,#7A3B0E)', 'var(--orange-ink,#7A3B0E)', 'var(--blue,#1A3A6A)', 'var(--success,#3E5C3A)', 'var(--success,#3E5C3A)', 'var(--success,#3E5C3A)'];
   function getPercentile(key, val) {
     var t = _thresholds[key] && _thresholds[key][_sex];
     if (!t || !val || val <= 0) return null;
     var ratio = val / _bw;
     for (var i = t.length - 1; i >= 0; i--) {
       if (ratio >= t[i]) return { pct: _percLabels[i + 1], color: _percColors[i + 1], ratio: Math.round(ratio * 100) / 100 };
     }
     return { pct: _percLabels[0], color: _percColors[0], ratio: Math.round(ratio * 100) / 100 };
   }
   var _powerKeys = [
     { key: 'bench_press', name: (window.isEnglish && window.isEnglish() ? 'Bench press' : 'Développé couché') },
     { key: 'squat',       name: 'Squat' },
     { key: 'deadlift',    name: (window.isEnglish && window.isEnglish() ? 'Deadlift' : 'Soulevé de terre') }
   ];
   var _hasAny = _powerKeys.some(function(k) { return S.muscuStrengthProfile[k.key] > 0; });
   if (!_hasAny) return;
   var lbWrap = h('div', { style: 'margin-bottom:16px;border:1px solid var(--border);background:var(--ivory2);' });
   lbWrap.appendChild(h('div', { style: 'padding:10px 14px;border-bottom:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);font-weight:700;' }, (window.isEnglish && window.isEnglish() ? 'Relative strength — vs body weight' : 'Force relative — vs poids de corps')));
   _powerKeys.forEach(function(kd) {
     var w = S.muscuStrengthProfile[kd.key] || 0;
     if (w <= 0) return;
     var reps = S.muscuStrengthProfile[kd.key + '_reps'] || 8;
     var est1rm = w * (1 + reps / 30); // raw Epley — même formule qu'Advanced Exercises (cohérence)
     var info = getPercentile(kd.key, est1rm);
     if (!info) return;
     var row = h('div', { style: 'display:flex;align-items:center;padding:8px 14px;border-bottom:1px solid var(--border);gap:8px;' });
     var nameD = h('div', { style: 'flex:1;font-family:Georgia,serif;font-size:12px;color:var(--black,#0A0A09);' }, kd.name);
     row.appendChild(nameD);
     // ratio bar
     var barWrap = h('div', { style: 'flex:1;height:3px;background:var(--border,#D8D8D0);border-radius:2px;overflow:hidden;' });
     var barPct = Math.min(100, Math.round((info.ratio / (_sex === 'm' ? 2.5 : 1.8)) * 100));
     var barFill = h('div', { style: 'height:100%;width:' + barPct + '%;background:' + info.color + ';transition:width .4s;' });
     barWrap.appendChild(barFill);
     row.appendChild(barWrap);
     var statD = h('div', { style: 'text-align:right;min-width:70px;flex-shrink:0;' });
     statD.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:' + info.color + ';font-weight:600;' }, info.pct + ' pop.'));
     statD.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:1px;' }, info.ratio + 'x PC'));
     row.appendChild(statD);
     lbWrap.appendChild(row);
   });
   lbWrap.appendChild(h('div', { style: 'padding:6px 14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey);font-style:italic;' }, (window.isEnglish && window.isEnglish() ? 'BW = Body weight. Estimated 1RM (Epley). General gym population.' : 'PC = Poids de corps. 1RM estimé (Epley). Population générale salle de sport.')));
   p.appendChild(lbWrap);
 })();

 // ─── EXERCICES AVANCÉS DÉBLOQUÉS ───
 (function() {
   var _bw = _resolveBodyWeight();
   var _prof = S.muscuStrengthProfile || {};
   function _est1rm(key) {
     var w = _prof[key] || 0;
     if (w <= 0) return 0;
     var r = _prof[key + '_reps'] || 8;
     return w * (1 + r / 30);
   }
   var _bench1rm = _est1rm('bench_press');
   var _squat1rm = _est1rm('squat');
   var _dl1rm = _est1rm('deadlift');
   var _isFemme = window.isFemale(S);
   var _advExercises = [
     { name: 'Développé couché pause-reps', unlock: _bench1rm >= (_isFemme ? 0.5 : 0.8) * _bw, req: (_isFemme ? '0.5' : '0.8') + '× PC bench', desc: 'Pause 2s en bas pour éliminer l\'élan — force pure.' },
     { name: 'Squat tempo 3-1-3', unlock: _squat1rm >= (_isFemme ? 0.7 : 1.0) * _bw, req: (_isFemme ? '0.7' : '1.0') + '× PC squat', desc: '3s descente, 1s pause, 3s montée — contrôle maximal.' },
     { name: 'Deficit Deadlift (+5cm)', unlock: _dl1rm >= (_isFemme ? 0.9 : 1.3) * _bw, req: (_isFemme ? '0.9' : '1.3') + '× PC DL', desc: 'Amplitude accrue, travail du bas du dos et ischio-jambiers.' },
     { name: 'Bulgarian Split Squat lesté', unlock: _squat1rm >= (_isFemme ? 0.6 : 0.9) * _bw, req: (_isFemme ? '0.6' : '0.9') + '× PC squat', desc: 'Unilatéral — équilibre et force jambe par jambe.' },
     { name: 'Paused Squat', unlock: _squat1rm >= (_isFemme ? 0.85 : 1.25) * _bw, req: (_isFemme ? '0.85' : '1.25') + '× PC squat', desc: 'Pause 2s en bas — base profonde, quadriceps développés.' }
   ];
   var _unlockedList = _advExercises.filter(function(e) { return e.unlock; });
   var _lockedList = _advExercises.filter(function(e) { return !e.unlock; });
   if (_advExercises.length === 0 || (_bench1rm === 0 && _squat1rm === 0 && _dl1rm === 0)) return;
   var unlockWrap = h('div', { style: 'margin-bottom:16px;border:1px solid var(--border);background:var(--ivory2);' });
   unlockWrap.appendChild(h('div', { style: 'padding:10px 14px;border-bottom:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);font-weight:700;' }, (window.isEnglish && window.isEnglish() ? 'Advanced exercises' : 'Exercices avancés')));
   _advExercises.forEach(function(ex) {
     var row = h('div', { style: 'display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);opacity:' + (ex.unlock ? '1' : '0.4') + ';' });
     var icon = h('div', { style: 'flex-shrink:0;width:18px;height:18px;border:' + (ex.unlock ? '1px solid var(--ink-900,#0A0A09)' : '1px solid var(--border)') + ';background:transparent;display:flex;align-items:center;justify-content:center;font-size:10px;color:' + (ex.unlock ? 'var(--success,#3E5C3A)' : 'var(--grey)') + ';margin-top:1px;' }, ex.unlock ? '✓' : '○');
     row.appendChild(icon);
     var info = h('div', { style: 'flex:1;' });
     info.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, ex.name));
     info.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);line-height:1.5;margin-top:2px;' }, ex.unlock ? ex.desc : (window.isEnglish && window.isEnglish() ? 'Unlock at ' : 'Débloquez à ') + ex.req));
     row.appendChild(info);
     unlockWrap.appendChild(row);
   });
   p.appendChild(unlockWrap);
 })();

 var _chargesFooter = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:16px'});
 _chargesFooter.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? 'Leave blank exercises you don\'t do. Enter the load AND reps for an accurate calculation of ' : 'Laissez vide les exercices que vous ne pratiquez pas. Indiquez la charge ET le nombre de reps pour un calcul précis du ')));
 _chargesFooter.appendChild(termTooltip('1RM', 'Répétition Maximale — la charge max que vous pouvez soulever une seule fois'));
 _chargesFooter.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? ' (Epley formula: load × (1 + N/30)).' : ' (formule d\'Epley : charge × (1 + N/30)).')));
 p.appendChild(_chargesFooter);

 p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){ var _nxt = S._chargesFromLevel ? 3 : (S._chargesReturnToDashboard ? 4 : 15); S._chargesFromLevel = false; S._chargesReturnToDashboard = false; S.sStep = _nxt; if (window.saveProfile) window.saveProfile(); window.render(); }}, (window.isEnglish && window.isEnglish() ? 'Continue' : 'Continuer')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ var _bk = S._chargesFromLevel ? 2 : 15; S._chargesFromLevel = false; S.sStep = _bk; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

/// ─── HELPER: CTA "Voir mon plan nutrition" (mode both uniquement) ───
function appendNutritionModeCTA(p) {
 if (!p || S.appMode !== 'both') return;
 if (!S.weekPlan || !S.weekPlan.length) return;
 var card = h('div', {style: 'border:1px solid var(--line,#D8D8D0);background:var(--paper-2,#F4F1EA);padding:20px 16px;margin-top:20px;border-radius:2px'});
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--success,#3E5C3A);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'COMPLETE PROGRAM' : 'PROGRAMME COMPLET')));
 card.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;font-style:italic;margin-bottom:8px;color:var(--black,#1A1A18)'}, (window.isEnglish && window.isEnglish() ? 'Your sport program is ready.' : 'Votre programme sportif est prêt.')));
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:16px'}, (window.isEnglish && window.isEnglish() ? 'Your macros are automatically adapted to each training session.' : 'Vos macros sont automatiquement adaptées à chaque séance d\'entraînement.')));
 card.appendChild(h('button', {
   style: 'width:100%;padding:16px;background:var(--ink-900,#0A0A09);color:#FAF9F6;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer',
   onclick: function() {
     window.S.view = 'nutrition';
     if (window.saveProfile) window.saveProfile();
     if (window.render) window.render();
   }
 }, (window.isEnglish && window.isEnglish() ? 'See my nutrition plan →' : 'Voir mon plan nutrition →')));
 p.appendChild(card);
}

// ─── STEP 15: PROGRAMMES DÉDIÉS ───
function renderDedicatedPrograms(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Dedicated<br><em>programs</em>' : 'Programmes<br><em>dédiés</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Targeted sessions, varied (A/B), ready to use.' : 'S\u00e9ances cibl\u00e9es, vari\u00e9es (A/B), pr\u00eates \u00e0 l\u2019emploi.')));

 // ─── SUIVI 7 SEMAINES ───
 renderWeekTracker(p);

 // ─── DAILY CHALLENGE STREAK ───
 (function() {
   var _today = new Date().toISOString().slice(0, 10);
   var _dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
   var _challenges = [
     { title: (window.isEnglish && window.isEnglish() ? '20 extra push-ups' : '20 pompes extra'), desc: (window.isEnglish && window.isEnglish() ? 'Do after your session — or separately if no session.' : 'À faire après ta séance — ou séparément si pas de séance.'), target: 20, unit: (window.isEnglish && window.isEnglish() ? 'push-ups' : 'pompes') },
     { title: (window.isEnglish && window.isEnglish() ? '1 min plank' : '1 min de planche'), desc: (window.isEnglish && window.isEnglish() ? 'Core tight, body aligned — hold it!' : 'Abdominaux serrés, corps aligné — tiens bon !'), target: 60, unit: (window.isEnglish && window.isEnglish() ? 'seconds' : 'secondes') },
     { title: (window.isEnglish && window.isEnglish() ? '100 jump rope' : '100 sauts à la corde'), desc: (window.isEnglish && window.isEnglish() ? 'No rope? Simulate with feet together.' : 'Pas de corde ? Simule le mouvement les pieds joints.'), target: 100, unit: (window.isEnglish && window.isEnglish() ? 'jumps' : 'sauts') },
     { title: (window.isEnglish && window.isEnglish() ? '30 bodyweight squats' : '30 squats au poids du corps'), desc: (window.isEnglish && window.isEnglish() ? 'Go to parallel, knee in line with foot.' : 'Descends à parallèle, genou dans l\'axe du pied.'), target: 30, unit: 'squats' },
     { title: (window.isEnglish && window.isEnglish() ? '15 chair dips' : '15 dips sur chaise'), desc: (window.isEnglish && window.isEnglish() ? 'Heels on floor, elbows close — triceps!' : 'Talons au sol, coudes près du corps — triceps !'), target: 15, unit: 'reps' },
     { title: (window.isEnglish && window.isEnglish() ? '5 min brisk walk' : '5 min de marche rapide'), desc: (window.isEnglish && window.isEnglish() ? '100 steps/min minimum — light active cardio.' : '100 pas/min minimum — cardio léger actif.'), target: 5, unit: 'minutes' },
     { title: (window.isEnglish && window.isEnglish() ? '3 sets of 4-7-8 breathing' : '3 séries de respirations 4-7-8'), desc: (window.isEnglish && window.isEnglish() ? 'Inhale 4s, hold 7s, exhale 8s — vagal recovery.' : 'Inspire 4s, retiens 7s, expire 8s — récupération vagale.'), target: 3, unit: (window.isEnglish && window.isEnglish() ? 'sets' : 'séries') }
   ];
   var _c = _challenges[_dayOfYear % _challenges.length];
   // Load from localStorage if not yet in memory (step 15 may be first render before step 4)
   if (!S.dailyChallengeHistory) {
     var _authUser15 = (window.AUTH && window.AUTH.getUser) ? AUTH.getUser() : null;
     var _uid15 = _authUser15 ? _authUser15.id : 'anon';
     var _dc15 = localStorage.getItem('mtd_daily_challenge_' + _uid15);
     if (_dc15) { try { S.dailyChallengeHistory = JSON.parse(_dc15); } catch(e) { S.dailyChallengeHistory = {}; } }
     else { S.dailyChallengeHistory = {}; }
   }
   if (typeof S.dailyChallengeHistory !== 'object') S.dailyChallengeHistory = {};
   var _doneToday = !!S.dailyChallengeHistory[_today];
   // Compute streak
   var _cStreak = 0;
   var _cCur = new Date(_today);
   while (true) {
     var _dStr = _cCur.toISOString().slice(0, 10);
     if (S.dailyChallengeHistory[_dStr]) { _cStreak++; _cCur.setDate(_cCur.getDate() - 1); }
     else break;
     if (_cStreak > 365) break;
   }
   var challengeCard = h('div', { style: 'margin-bottom:16px;border:1px solid ' + (_doneToday ? 'var(--ink-900,#0A0A09)' : 'var(--line)') + ';background:' + (_doneToday ? 'var(--paper-2,#F4F1EA)' : 'var(--ivory2)') + ';padding:14px 16px;border-radius:0;' });
   var chRow1 = h('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;' });
   var chLeft = h('div', {});
   chLeft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:' + (_doneToday ? 'var(--ink-900,#0A0A09)' : 'var(--grey,#6B6B65)') + ';font-weight:700;margin-bottom:3px;' }, (window.isEnglish && window.isEnglish() ? 'Your challenge' : 'Votre défi')));
   chLeft.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:16px;color:var(--black,#0A0A09);' }, _c.title));
   chRow1.appendChild(chLeft);
   if (_cStreak > 0) {
     var streakPill = h('div', { style: 'flex-shrink:0;margin-left:10px;padding:3px 8px;background:' + (_doneToday ? 'var(--ink-900,#0A0A09)' : (_cStreak > 7 ? 'var(--ink-900,#0A0A09)' : 'var(--ink-700,#2B2B27)')) + ';color:var(--paper,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;border-radius:0;white-space:nowrap;' }, _cStreak + ' j');
     chRow1.appendChild(streakPill);
   }
   challengeCard.appendChild(chRow1);
   challengeCard.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5;margin-bottom:12px;' }, _c.desc));
   if (_doneToday) {
     challengeCard.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;color:var(--success,#3E5C3A);' }, (window.isEnglish && window.isEnglish() ? '✓ Challenge done — see you tomorrow!' : '✓ Défi accompli — à demain !')));
   } else {
     var doneBtn = h('button', {
       style: 'padding:10px 18px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
       onclick: function() {
         var _clickToday = new Date().toISOString().slice(0, 10); // recompute at click time (midnight-safe)
         if (!S.dailyChallengeHistory || typeof S.dailyChallengeHistory !== 'object') S.dailyChallengeHistory = {};
         S.dailyChallengeHistory[_clickToday] = true;
         // Prune entries > 1 year old (unbounded growth fix 2026-04-19)
         var _dcCutoff = new Date(); _dcCutoff.setFullYear(_dcCutoff.getFullYear() - 1);
         var _dcCutStr = _dcCutoff.toISOString().slice(0, 10);
         Object.keys(S.dailyChallengeHistory).forEach(function(k) { if (k < _dcCutStr) delete S.dailyChallengeHistory[k]; });
         var _dcAuthUser = (window.AUTH && window.AUTH.getUser) ? AUTH.getUser() : null;
         var uid = _dcAuthUser ? _dcAuthUser.id : 'anon';
         try { localStorage.setItem('mtd_daily_challenge_' + uid, JSON.stringify(S.dailyChallengeHistory)); } catch(e) {}
         if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? '\u2605 Daily challenge completed!' : '\u2605 D\u00e9fi du jour valid\u00e9 !', 'success', 2500);
         // Confetti burst — simple DOM-based
         var burst = document.createElement('div');
         burst.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
         var colors = ['#A8A8A0', '#3E5C3A', '#0A0A09', '#FAF9F6', '#7A3B0E'];
         for (var i = 0; i < 40; i++) {
           var dot = document.createElement('div');
           var size = 6 + Math.random() * 8;
           dot.style.cssText = 'position:absolute;width:' + size + 'px;height:' + size + 'px;background:' + colors[i % colors.length] + ';left:' + (10 + Math.random() * 80) + '%;top:-10px;border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';animation:sfc-confetti-fall ' + (0.8 + Math.random() * 1.2) + 's ease-in forwards ' + (Math.random() * 0.4) + 's;';
           burst.appendChild(dot);
         }
         if (!document.getElementById('sfc-confetti-style')) {
           var st = document.createElement('style');
           st.id = 'sfc-confetti-style';
           st.textContent = '@keyframes sfc-confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}';
           document.head.appendChild(st);
         }
         document.body.appendChild(burst);
         setTimeout(function() { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 2500);
         window.render();
       }
     }, (window.isEnglish && window.isEnglish() ? '✓ Challenge done' : '✓ Défi accompli'));
     challengeCard.appendChild(doneBtn);
   }
   p.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);font-weight:700;margin-bottom:8px;margin-top:24px;' }, (window.isEnglish && window.isEnglish() ? 'Daily challenge' : 'Défi quotidien')));
   p.appendChild(challengeCard);
 })();

 // ─── BANNIÈRE : GÉNÉRER MON PROGRAMME DE MUSCULATION ───
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Strength program' : 'Programme de musculation')));
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'Create your custom program based on your goals, level and target zones.' : 'Créez votre programme sur mesure selon vos objectifs, niveau et zones cibles.')));
 p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
 // CRITIQUE-1 : pré-sélection ici (une seule fois, hors render)
 if (S.goal !== null && (!S.sportGoals || S.sportGoals.length === 0)) {
 var nutKey = window.GOALS && window.GOALS[S.goal] ? window.GOALS[S.goal].key : null;
 var preselect = nutKey ? NUTRITION_TO_SPORT_GOAL[nutKey] : null;
 if (preselect) S.sportGoals = [preselect];
 }
 S.sStep = 1;
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? 'Generate my program' : 'G\u00e9n\u00e9rer mon programme')));
 p.appendChild(h('div', {style: 'height:20px'}));

 // ─── PROGRAMMES DÉDIÉS ───
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Targeted programs' : 'Programmes ciblés')));
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'Targeted bonus sessions, varied (A/B), ready to use.' : 'S\u00e9ances bonus cibl\u00e9es, vari\u00e9es (A/B), pr\u00eates \u00e0 l\u2019emploi.')));

 var allDedicated = [
 {key: 'fessiers_dedied', icon: ''},
 {key: 'abdos_dedied', icon: ''},
 {key: 'biceps_dedied', icon: ''},
 {key: 'triceps_dedied', icon: ''}
 ];

 allDedicated.forEach(function(item) {
 var prog = window.SFC_PROGRAMS && window.SFC_PROGRAMS[item.key];
 if (!prog || !prog.variations) return;

 var openKey = 'dedicatedOpen_' + item.key;
 var varKey = 'dedicatedVar_' + item.key;
 var isOpen = S[openKey] || false;
 var varIdx = S[varKey] || 0;

 var card = h('div', {style: 'border:1px solid var(--border);margin-bottom:8px;background:var(--ivory2)'});

 // Header
 var header = h('div', {
 style: 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer',
 onclick: function() { S[openKey] = !S[openKey]; window.render(); }
 });
 var titleDiv = h('div', {style: 'display:flex;align-items:center;gap:10px'});
 titleDiv.appendChild(h('span', {style: 'font-size:18px'}, item.icon));
 var titleRight = h('div', {});
 titleRight.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px'}, prog.name));
 titleRight.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, '\u23F1 ' + prog.duration));
 titleDiv.appendChild(titleRight);
 header.appendChild(titleDiv);
 header.appendChild(h('span', {style: 'font-size:18px;color:var(--grey)'}, isOpen ? '\u25B2' : '\u25BC'));
 card.appendChild(header);

 if (isOpen) {
 // Variation tabs A / B
 var tabs = h('div', {style: 'display:flex;border-top:1px solid var(--border)'});
 prog.variations.forEach(function(v, idx) {
 var isActive = varIdx === idx;
 var tab = h('div', {
 style: 'flex:1;padding:10px;text-align:center;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;border-right:1px solid var(--border);' +
 (isActive ? 'background:var(--black);color:var(--ivory,#FAF9F6)' : 'background:var(--ivory);color:var(--grey)'),
 onclick: function(e) { e.stopPropagation(); S[varKey] = idx; window.render(); }
 }, v.label);
 tabs.appendChild(tab);
 });
 card.appendChild(tabs);

 var variation = prog.variations[varIdx] || prog.variations[0];
 if (!variation) return;
 var currentPhase = getMuscuPhase(sfcGetEffectiveWeek());
 var exercises = (variation.exercises || []).slice();
 // Medical filter for dedicated programs — uses the full filterExerciseByMedical function
 if (S.muscuMedical && S.muscuMedical.done && exercises.length > 0) {
   var _medFiltered = exercises.filter(function(exo) {
     return filterExerciseByMedical(exo, S.muscuMedical);
   });
   if (_medFiltered.length > 0) exercises = _medFiltered;
 }
 exercises.forEach(function(exBase) {
 var ex = applyPhaseToExercise(exBase, currentPhase);
 var row = h('div', {style: 'padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start'});
 var left = h('div', {});
 left.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px'}, ex.order + '. ' + ex.name));
 left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, ex.muscle + ' \u2014 ' + ex.equipment));
 if (ex.technique) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--orange);margin-top:2px'}, ex.technique));
 // Suggested weight based on phase %1RM
 // 2026-04 UX-5 : si sugW > 0 → affiche la charge; sinon guidance débutant (avant : rien affiché → Sarah perdue)
 var sugW = getSuggestedWeight(ex.name, ex.reps, currentPhase);
 if (sugW && sugW > 0) {
   left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);margin-top:2px;font-weight:500'}, (window.isEnglish && window.isEnglish() ? '\u2192 Target load: ~' : '\u2192 Charge cible : ~') + (window.UNITS ? window.UNITS.displayWeight(sugW) : sugW + ' kg')));
 } else {
   // Pas de 1RM connu → guidance débutant sobre (Hermès §13.1 : pas d'emoji)
   left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:2px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Load to test: start light, technique first. The app will refine after your first 2 sessions.' : 'Charge à tester : commencez léger, technique avant tout. L\'app affinera après vos 2 premières séances.')));
 }
 row.appendChild(left);
 var right = h('div', {style: 'text-align:right;flex-shrink:0;margin-left:12px'});
 right.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-weight:normal'}, ex.sets + '\u00d7' + ex.reps));
 right.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, ex.rest));
 row.appendChild(right);
 card.appendChild(row);
 });
 if (prog.notes) card.appendChild(h('div', {style: 'padding:10px 16px;border-top:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, prog.notes));
 }
 p.appendChild(card);
 });

 p.appendChild(h('div', {style: 'height:16px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 4; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));

 appendNutritionModeCTA(p);
}

// ─── STEP 1: MUSCULATION OBJECTIVES ───
// Mapping nutrition goal key → sport goal id
// Mapping sport goal id → nutrition goal index (priority order when multi-select)
// GOALS: [0=bulk, 1=lean_bulk, 2=maintain, 3=cut, 4=shred, 5=recomposition]

 // ─── CONTEXTE NUTRITIONNEL (source : NutritionMaster via window.S._nm) ────
 function getNutritionContext() {
 var nm = window.S._nm;
 if (!nm || nm.errors && nm.errors.length > 0) return null;
 return {
 caloriesTarget: nm.caloriesTarget || 0,
 caloriesCheck: nm.caloriesCheck || 0,
 proteinGrams: nm.proteinGrams || 0,
 carbsGrams: nm.carbsGrams || 0,
 fatGrams: nm.fatGrams || 0,
 bmr: nm.bmr || 0,
 tdee: nm.tdee || 0,
 goal: nm.inputs && nm.inputs.goal || null
 };
 }

function syncSportGoalsToNutrition() {
 if (S.goal === null) return; // only sync if nutrition was filled first
 if (S.pregnant && window.isFemale(S)) return; // ÉLEVÉ-4: grossesse → ne pas écraser le maintien forcé
 // GOALS: [0=bulk, 1=lean_bulk, 2=maintain, 3=cut, 4=shred, 5=recomposition]
 var _sgls = S.sportGoals || [];
 if (_sgls.length === 0) { S.goal = 2; return; } // désélection totale → reset maintien
 // Priority: shred > muscle > weightloss > others (→ maintain/recomposition)
 // For 'muscle': preserve lean_bulk (index 1) if already set — both are mass-building goals.
 // BUG C fix : préserver recomposition (index 5) si aucun objectif sport ne force un changement
 var newIdx = 2; // maintain par défaut
 var currentKey = window.GOALS && window.GOALS[S.goal] ? window.GOALS[S.goal].key : null;
 if (_sgls.indexOf('shred') !== -1) newIdx = 4; // shred
 else if (_sgls.indexOf('muscle') !== -1) {
   // Si l'utilisateur est en déficit (cut/shred) + objectif musculaire :
   // NE PAS écraser silencieusement vers bulk (+913 kcal/j) — proposer recomposition (maintenance + optimisation macros)
   // La recomposition est la seule option compatible avec un profil déficitaire souhaitant progresser en musculaire
   // Barakat 2020 (NSCA) : recomposition validée ≥1.6g/kg en maintenance calorique
   if (currentKey === 'cut' || currentKey === 'shred') newIdx = 5; // → recomposition
   else newIdx = (currentKey === 'lean_bulk') ? 1 : 0; // preserve lean_bulk, otherwise bulk
 }
 else if (_sgls.indexOf('weightloss') !== -1) newIdx = 3; // cut
 else if (_sgls.indexOf('general') !== -1 || _sgls.indexOf('endurance') !== -1 || _sgls.indexOf('flexibility') !== -1) {
   // Pour 'general'/'endurance'/'flexibility' : préserver recomposition si déjà en recomposition
   // (recomposition = maintien calorique + optimisation macros — compatible avec sport général)
   newIdx = (currentKey === 'recomposition') ? 5 : 2;
 }
 S.goal = newIdx;
}

function renderMusculationGoals(p) {
 var _prenom1 = S.prenom || '';
 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Strength \u00b7 Step 1/3' : 'Musculation \u00b7 \u00c9tape 1/3')));
 p.appendChild(h('h1', {html: (_prenom1 ? _prenom1 + (window.isEnglish && window.isEnglish() ? ', what is<br>' : ', quel est<br>') : (window.isEnglish && window.isEnglish() ? 'What is<br>' : 'Quel est<br>')) + (window.isEnglish && window.isEnglish() ? '<em>your goal\u00a0?</em>' : '<em>votre objectif\u00a0?</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Choose your goals (1 to 3). Your program will adapt accordingly.' : 'Choisissez vos objectifs (1 \u00e0 3). Votre programme s\u2019adaptera en cons\u00e9quence.')));
 if (window.TIPS) TIPS.renderTip(p, 'sportGoal');

 // ── INTERDÉPENDANCE NUTRITION ──────────────────────────────────────────
 if (S.goal !== null) {
 // Reminder banner (pre-sélection déplacée dans le handler du bouton "Créer programme")
 var nutName = (window.GOALS || [])[S.goal] ? window.GOALS[S.goal].name : '';
 var banner = h('div', {style: 'border:1px solid var(--border,#D8D8D0);padding:12px 16px;background:var(--ivory2,#F4F4F0);margin-bottom:16px;border-radius:2px'});
 banner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Nutrition goal\u00a0: ' : 'Objectif Nutrition\u00a0: ') + nutName));
 banner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, (window.isEnglish && window.isEnglish() ? 'Any change will be synchronized with your nutrition plan.' : 'Toute modification sera synchronis\u00e9e avec votre plan nutrition.')));
 p.appendChild(banner);
 }
 // ──────────────────────────────────────────────────────────────────────

 // Pré-sélection depuis l'objectif nutrition si sportGoals est vide
 // BUG C fix : index 5 (recomposition) doit mapper vers 'general' (maintien calorique + optimisation macros)
 if ((!S.sportGoals || S.sportGoals.length === 0) && S.goal !== null && S.goal !== undefined) {
   var _nutToSport = {0: 'muscle', 1: 'muscle', 2: 'general', 3: 'weightloss', 4: 'shred', 5: 'general'};
   var _preId = _nutToSport[S.goal];
   if (_preId) { if (!Array.isArray(S.sportGoals)) S.sportGoals = []; S.sportGoals = [_preId]; }
 }
 if (!Array.isArray(S.sportGoals)) S.sportGoals = [];
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Goals' : 'Objectifs')));
 var g = h('div', {'class': 'card-grid-2'});
 var _tcaActive = Array.isArray(S.medical) && S.medical.indexOf('tca') !== -1;
 (window.SPORT_GOALS || []).forEach(function(gl) {
 var on = S.sportGoals.indexOf(gl.id) !== -1;
 // TCA : bloquer objectifs de déficit calorique (ANAD, IOC 2018 — cohérent avec restriction nutrition)
 var _tcaBlock = _tcaActive && (gl.id === 'weightloss' || gl.id === 'shred');
 g.appendChild(h('div', {'class': 'sel-card' + (on ? ' on' : '') + (_tcaBlock ? ' disabled' : ''),
 style: _tcaBlock ? 'opacity:0.35;cursor:not-allowed;pointer-events:none;' : '',
 onclick: _tcaBlock ? null : function(){
 if (on) S.sportGoals = S.sportGoals.filter(function(x){ return x !== gl.id; });
 else if (S.sportGoals.length < 3) S.sportGoals.push(gl.id);
 // FIX DESYNC 2026-04-16 — invalider sportProgram si goals changent (repos/reps baked at gen time)
 if (Array.isArray(S.sportProgram) && S.sportProgram.length > 0) { S.sportProgram = null; S.muscuIAProgram = null; S.bonusExercises = {}; }
 syncSportGoalsToNutrition();
 window.render();
 }}, [
 h('span', {'class': 'card-icon'}, gl.icon),
 h('div', {'class': 'card-name'}, gl.name),
 h('div', {'class': 'card-sub'}, gl.desc)
 ]));
 });
 p.appendChild(g);

 var ok = S.sportGoals.length > 0;
 p.appendChild(h('div', {style: 'height:16px'}));
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) { S.sStep = 2; window.render(); }
 }}, (window.isEnglish && window.isEnglish() ? 'Continue' : 'Continuer')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 15; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

// ─── STEP 5 (CrossFit): NIVEAU CF ───
function renderCrossfitLevel(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Cross Training'));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Your<br><em>level</em>' : 'Votre<br><em>niveau</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Select your level to adapt loads and movements.' : 'Sélectionnez votre niveau pour adapter les charges et mouvements.')));

 if (S.sex) {
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:16px'}, (window.isEnglish && window.isEnglish() ? 'Loads adapted for: ' : 'Charges adaptées pour : ') + (window.isMale(S) ? (window.isEnglish && window.isEnglish() ? 'Male' : 'Homme') : (window.isEnglish && window.isEnglish() ? 'Female' : 'Femme'))));
 }

 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Level (required)' : 'Niveau (obligatoire)')));
 var list = h('div', {'class': 'level-list'});
 (window.CROSSFIT_LEVELS || []).forEach(function(lv) {
 var isOn = S.crossfitLevel === lv.id;
 list.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: function(){ S.crossfitLevel = lv.id; window.render(); }}, [
 h('div', {}, [
 h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
 h('div', {'class': 'level-desc'}, lv.desc)
 ]),
 isOn ? h('span', {'class': 'level-badge'}, '\u2713') : h('span', {})
 ]));
 });
 p.appendChild(list);

 // Level explanations
 var explainBox = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin:16px 0'});
 explainBox.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'What does each level mean?' : 'Que signifie chaque niveau ?')));

 var explanations = [
 {icon: '', title: 'SCALED', desc: (window.isEnglish && window.isEnglish() ? 'Adapted movements (ring rows, pike push-ups, single unders), light loads. Ideal for starting CrossFit.' : 'Mouvements adaptés (ring rows, pike push-ups, single unders), charges légères. Idéal pour débuter le CrossFit.')},
 {icon: '', title: (window.isEnglish && window.isEnglish() ? 'INTERMEDIATE' : 'INTERMÉDIAIRE'), desc: (window.isEnglish && window.isEnglish() ? 'Full movements with moderate load, some gymnastic adaptations. You master the basics.' : 'Mouvements complets avec charge modérée, certaines adaptations gymniques. Vous maîtrisez les bases.')},
 {icon: '', title: 'RX', desc: (window.isEnglish && window.isEnglish() ? 'Competition standards, loads and movements at international standard. CrossFit Games level.' : 'Standards compétition, charges et mouvements au standard international. Niveau CrossFit Games.')}
 ];
 explanations.forEach(function(ex) {
 var row = h('div', {style: 'margin-bottom:6px'});
 row.appendChild(h('span', {style: 'font-family:Georgia;font-size:11px;font-weight:bold'}, ex.icon + ' ' + ex.title + ' — '));
 row.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, ex.desc));
 explainBox.appendChild(row);
 });
 p.appendChild(explainBox);

 // ─── JOURS D'ENTRAÎNEMENT PAR SEMAINE ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.days')));
 var cfDaysWrap = h('div', {'class': 'num-input-wrap'});
 cfDaysWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '3', max: '6', value: String(S.sportDays || 3), inputmode: 'numeric',
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 3 && v <= 6) { S.sportDays = v; if (S.sportMixSecondary && S.sportMixSecondary.days >= v) { S.sportMixSecondary.days = Math.max(1, v - 3); } window.render(); } },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 3) { e.target.value = S.sportDays = 3; if (S.sportMixSecondary && S.sportMixSecondary.days >= 3) { S.sportMixSecondary.days = 1; } window.render(); } else if (v > 6) { e.target.value = S.sportDays = 6; window.render(); } }
 }));
 cfDaysWrap.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(cfDaysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? '3 days minimum recommended for CrossFit' : '3 jours minimum recommand\u00E9 pour le CrossFit')));

 // ─── SÉLECTEUR DE JOURS SPÉCIFIQUES ───
 if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:18px'}, (window.isEnglish && window.isEnglish() ? 'Which days do you train?' : 'Quels jours vous entraînez-vous\u00a0?')));
 var dayLabels = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
 var dayBtnsWrap = h('div', {style: 'display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;margin:10px 0'});
 var _selTarget = S.sportDays || 3;
 dayLabels.forEach(function(label, idx) {
   var selected = S.trainingDaysSelected.indexOf(idx) !== -1;
   var overTarget = selected && S.trainingDaysSelected.length > _selTarget;
   var btnStyle = 'width:44px;height:44px;border-radius:0;font-family:Georgia,serif;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;letter-spacing:0;transition:background .15s,color .15s,border-color .15s;';
   if (overTarget) btnStyle += 'background:var(--error,#7A1F1F);color:#FAF9F6;border:1px solid var(--error,#7A1F1F);';
   else if (selected) btnStyle += 'background:#1A1A18;color:#FAF9F6;border:1.5px solid #1A1A18;';
   else btnStyle += 'background:transparent;color:#1A1A18;border:1.5px solid #E8E6DF;';
   var btn = h('button', {
     type: 'button', style: btnStyle,
     onclick: function() {
       if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
       var pos = S.trainingDaysSelected.indexOf(idx);
       if (pos !== -1) { S.trainingDaysSelected.splice(pos, 1); }
       else { S.trainingDaysSelected.push(idx); S.trainingDaysSelected.sort(function(a, b) { return a - b; }); }
       var cnt = S.trainingDaysSelected.length;
       if (cnt > 0) S.sportDays = Math.max(3, Math.min(6, cnt));
       // SPRINT 2 F1 HYPERSTAB 2026-04-17 — sync conditionnel weeklyCalendar.
       // Si l'user a déjà visité le smart calendar (weeklyCalendar existe comme
       // objet en mémoire), on met à jour UNIQUEMENT la cellule touchée pour
       // éviter la désync visuelle flaguée par UX agent. Conditions strictes :
       //   - weeklyCalendar est un objet (pas null, pas array)
       //   - S.sportType est défini (pas de label orphelin "sport" écrit)
       //   - on ne touche pas une cellule customisée vers un AUTRE sport
       //     (respect de la personnalisation smart-calendar)
       // En onboarding : weeklyCalendar est null → condition false → no-op.
       // NB: la persistance cross-reload dépend du fix de loadProfile (~l.399
       // reset weeklyCalendar si !Array) — hors-scope Sprint 2, session-only.
       if (S.sportType && S.weeklyCalendar && typeof S.weeklyCalendar === 'object' && !Array.isArray(S.weeklyCalendar)) {
         var _sportLabel = S.sportType;
         var _dayKey = String(idx);
         if (pos !== -1) {
           // Day deselected : ne libérer que si c'était bien le sport courant
           if (S.weeklyCalendar[_dayKey] === _sportLabel) S.weeklyCalendar[_dayKey] = 'repos';
         } else {
           // Day selected : n'assigner que si c'était 'repos' ou absent
           if (!S.weeklyCalendar[_dayKey] || S.weeklyCalendar[_dayKey] === 'repos') {
             S.weeklyCalendar[_dayKey] = _sportLabel;
           }
         }
       }
       try { window.saveProfile(); } catch(e) {}
       window.render();
     }
   }, label);
   dayBtnsWrap.appendChild(btn);
 });
 p.appendChild(dayBtnsWrap);
 var selCount = S.trainingDaysSelected.length;
 var diff = selCount - _selTarget;
 var hintColor = diff === 0 ? 'var(--ink-500,#6B6B65)' : (diff > 0 ? 'var(--error,#7A1F1F)' : 'var(--orange-ink,#7A3B0E)');
 var hintText = selCount === 0
   ? (window.isEnglish && window.isEnglish() ? 'No day selected — automatic distribution' : 'Aucun jour sélectionné — répartition automatique')
   : diff === 0 ? selCount + ' / ' + _selTarget + ' ' + window.locPlural(selCount, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + (window.isEnglish && window.isEnglish() ? ' — perfect' : ' — parfait')
   : diff > 0 ? selCount + ' / ' + _selTarget + (window.isEnglish && window.isEnglish() ? ' — remove ' : ' — retirez ') + diff + ' ' + window.locPlural(diff, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}})
   : selCount + ' / ' + _selTarget + (window.isEnglish && window.isEnglish() ? ' — select ' : ' — sélectionnez encore ') + Math.abs(diff) + ' ' + window.locPlural(Math.abs(diff), {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}});
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + hintColor + ';text-align:center;margin-bottom:4px;letter-spacing:.5px;transition:color .2s'}, hintText));

 // Recommendation based on level
 if (S.crossfitLevel) {
 var cfDayReco = '';
 if (S.crossfitLevel === 'scaled') cfDayReco = (window.isEnglish && window.isEnglish() ? 'Recommended: 3-4 days (important recovery)' : 'Recommand\u00E9 : 3-4 jours (r\u00E9cup\u00E9ration importante)');
 else if (S.crossfitLevel === 'inter') cfDayReco = (window.isEnglish && window.isEnglish() ? 'Recommended: 4-5 days' : 'Recommand\u00E9 : 4-5 jours');
 else if (S.crossfitLevel === 'rx') cfDayReco = (window.isEnglish && window.isEnglish() ? 'Recommended: 5-6 days' : 'Recommand\u00E9 : 5-6 jours');
 else if (S.crossfitLevel === 'rx_plus') cfDayReco = (window.isEnglish && window.isEnglish() ? 'Recommended: 6 days (elite Games program — mandatory active recovery)' : 'Recommand\u00E9 : 6 jours (programme \u00E9lite Games — r\u00E9cup\u00E9ration active obligatoire)');
 if (cfDayReco) {
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-top:6px;font-style:italic'}, cfDayReco));
 }
 }

 // ─── SPORT MIX (CF + autre sport) ───
 renderSportMixSection(p, 'crossfit');

 // ─── 1RM QUESTIONNAIRE (OPTIONAL) ───
 // Load saved 1RM data
 if (Object.keys(S.crossfit1RM || {}).length === 0) {
 var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var saved1rm = localStorage.getItem('mtd_cf_1rm_' + userId);
 if (saved1rm) { try { S.crossfit1RM = JSON.parse(saved1rm); } catch(e) {} }
 }
 if (!S.crossfit1RM || typeof S.crossfit1RM !== 'object') S.crossfit1RM = {};

 p.appendChild(h('div', {style: 'height:24px'}));
 p.appendChild(h('div', {style: 'border-top:1px solid var(--border);margin:0 0 16px;padding-top:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Your current loads (optional)' : 'Vos charges actuelles (optionnel)')));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:16px'}, (window.isEnglish && window.isEnglish() ? 'Enter your 1RMs for custom programming. Leave blank if unknown.' : 'Renseignez vos 1RM pour une programmation sur mesure. Laissez vide si inconnu.')));

 if (window.CF_1RM_LIFTS) {
 var rmGrid = h('div', {style: 'margin-bottom:16px'});
 window.CF_1RM_LIFTS.forEach(function(lift) {
 var currentVal = S.crossfit1RM[lift.key] || '';
 var row = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid var(--border);background:var(--ivory2);margin-bottom:4px'});

 // Left: icon + name
 var leftDiv = h('div', {style: 'flex:1'});
 leftDiv.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px'}, lift.icon + ' ' + lift.name));
 leftDiv.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey)'}, lift.desc));

 // Show estimated working weight if value is filled
 if (currentVal && S.crossfitLevel) {
 var lvlIdx = S.crossfitLevel === 'scaled' ? 0 : S.crossfitLevel === 'inter' ? 1 : S.crossfitLevel === 'rx_plus' ? 3 : 2;
 var wodPct = lvlIdx === 0 ? 0.55 : lvlIdx === 1 ? 0.65 : lvlIdx === 3 ? 0.80 : 0.75;
 var estWeight = Math.round(currentVal * wodPct);
 leftDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:2px'}, 'WOD \u2248 ' + (window.UNITS ? window.UNITS.displayWeight(estWeight) : estWeight + 'kg')));
 }
 row.appendChild(leftDiv);

 // Right: input + kg unit
 var rightDiv = h('div', {style: 'display:flex;align-items:center;gap:6px'});
 var inp = h('input', {
 type: 'number',
 min: '0',
 max: '500',
 value: currentVal ? String(currentVal) : '',
 placeholder: lift.placeholder,
 inputmode: 'numeric',
 style: 'width:64px;padding:8px;border:1px solid var(--border);border-radius:2px;background:var(--ivory);font-family:Georgia;font-size:16px;text-align:center',
 oninput: function(e) {
 var v = parseInt(e.target.value);
 if (!isNaN(v) && v > 0 && v <= 500) {
 S.crossfit1RM[lift.key] = v;
 } else if (e.target.value === '') {
 delete S.crossfit1RM[lift.key];
 }
 // Save to localStorage
 var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 try { localStorage.setItem('mtd_cf_1rm_' + uid, JSON.stringify(S.crossfit1RM)); } catch(e2) { console.warn('[cf_1rm] localStorage error:', e2); }
 if (!isNaN(v) && v > 0 && window.PERF_HISTORY) PERF_HISTORY.recordCF1RM(lift.key, v);
 // Re-render to update estimated weights
 clearTimeout(window._cf1rmTimer);
 window._cf1rmTimer = setTimeout(function(){ if (window.render) window.render(); }, 600);
 }
 });
 rightDiv.appendChild(inp);
 rightDiv.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'kg'));
 row.appendChild(rightDiv);

 rmGrid.appendChild(row);
 });
 p.appendChild(rmGrid);
 }

 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;text-align:center;margin-bottom:16px'}, (window.isEnglish && window.isEnglish() ? 'If you don\'t know your 1RMs, loads will be based on international standards for your level.' : 'Si vous ne connaissez pas vos 1RM, les charges seront bas\u00E9es sur les standards internationaux pour votre niveau.')));

 // ─── BENCHMARKS ACTUELS ───
 p.appendChild(h('div', {style: 'height:16px'}));
 p.appendChild(h('div', {style: 'border-top:1px solid var(--border);margin:0 0 16px;padding-top:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Your CrossFit benchmarks (optional)' : 'Vos benchmarks CrossFit (optionnel)')));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:14px'}, (window.isEnglish && window.isEnglish() ? 'This data allows tracking your progression on official CrossFit WODs.' : 'Ces donn\u00E9es permettent de suivre votre progression sur les WODs officiels du CrossFit.')));

 S.crossfitBenchmarks = S.crossfitBenchmarks || {};
 var benchmarkFields = [
 {key: 'fran_time', label: 'Fran (21-15-9 Thruster + Pull-ups)', placeholder: 'Ex: 4:32', type: 'text'},
 {key: 'grace_time', label: 'Grace (30 Clean & Jerk)', placeholder: 'Ex: 2:15', type: 'text'},
 {key: 'helen_time', label: 'Helen (3 rounds 400m/KB/Pull-ups)', placeholder: 'Ex: 9:45', type: 'text'},
 {key: 'max_pullups', label: 'Max Pull-ups strict (unbroken)', placeholder: 'Ex: 15', type: 'number'},
 {key: 'max_hspu', label: 'Max HSPU strict (unbroken)', placeholder: 'Ex: 8', type: 'number'},
 {key: 'max_du', label: 'Max Double Unders unbroken', placeholder: 'Ex: 50', type: 'number'}
 ];
 var bmGrid = h('div', {style: 'margin-bottom:16px'});
 benchmarkFields.forEach(function(bf) {
 var bRow = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border:1px solid var(--border);background:var(--ivory2);margin-bottom:4px'});
 bRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--fg,#0A0A09);flex:1'}, bf.label));
 var bInp = h('input', {
 type: bf.type || 'text',
 inputmode: bf.type === 'number' ? 'numeric' : 'text',
 placeholder: bf.placeholder,
 style: 'width:90px;padding:5px 8px;border:1px solid var(--border);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;background:var(--ivory);color:#0A0A09;text-align:center',
 value: S.crossfitBenchmarks[bf.key] || ''
 });
 (function(fieldKey) {
 bInp.addEventListener('input', function(e) {
 S.crossfitBenchmarks = S.crossfitBenchmarks || {};
 S.crossfitBenchmarks[fieldKey] = e.target.value;
 });
 })(bf.key);
 bRow.appendChild(bInp);
 bmGrid.appendChild(bRow);
 });
 p.appendChild(bmGrid);

 // ─── OBJECTIF COMPETITION ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:16px'}, (window.isEnglish && window.isEnglish() ? 'Competition goal' : 'Objectif comp\u00E9tition')));
 var compGoals = [
 {id: 'loisir', label: (window.isEnglish && window.isEnglish() ? 'Leisure — Fitness and fun' : 'Loisir — Forme physique et fun'), desc: (window.isEnglish && window.isEnglish() ? 'No competition planned' : 'Pas de competition prevue')},
 {id: 'open', label: 'CrossFit Open', desc: (window.isEnglish && window.isEnglish() ? 'Qualify for next phases' : 'Qualifier pour les phases suivantes')},
 {id: 'sanctional', label: 'Regionals / Sanctionals', desc: (window.isEnglish && window.isEnglish() ? 'Elite level — serious competition' : 'Niveau elite — competition serieuse')}
 ];
 var compList = h('div', {style: 'margin-bottom:14px'});
 compGoals.forEach(function(cg) {
 var isOn = (S.crossfitCompGoal === cg.id);
 var cgRow = h('div', {
 style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid ' + (isOn ? 'var(--black,#0A0A09)' : 'var(--border)') + ';background:' + (isOn ? 'var(--ivory2)' : 'transparent') + ';margin-bottom:4px;cursor:pointer',
 onclick: function() { S.crossfitCompGoal = cg.id; window.render(); }
 });
 var cgLeft = h('div', {});
 cgLeft.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px'}, cg.label));
 cgLeft.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey)'}, cg.desc));
 cgRow.appendChild(cgLeft);
 if (isOn) cgRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--black)'}, '\u2713'));
 compList.appendChild(cgRow);
 });
 p.appendChild(compList);

 // ─── DATE DE L'OPEN ───
 if (S.crossfitCompGoal === 'open' || S.crossfitCompGoal === 'sanctional') {
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:8px'}, (window.isEnglish && window.isEnglish() ? 'CrossFit Open date (optional)' : 'Date du CrossFit Open (optionnel)')));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px;text-align:center'}, (window.isEnglish && window.isEnglish() ? 'The program will adapt weeks 18-20 for Open preparation.' : 'Le programme adaptera les semaines 18-20 en pr\u00E9paration Open.')));
 var openDateInp = h('input', {
 type: 'date',
 style: 'width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;background:var(--ivory);color:#0A0A09;margin-bottom:16px',
 value: S.crossfitOpenDate || ''
 });
 openDateInp.addEventListener('change', function(e) { S.crossfitOpenDate = e.target.value; });
 p.appendChild(openDateInp);
 }

 p.appendChild(h('div', {style: 'height:16px'}));
 var ok = S.crossfitLevel !== null;
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) { S.crossfitWeek = 1; S.selectedCrossfitDay = 0; S.sStep = 6; window.BLACKBOX && window.BLACKBOX.log('crossfit_level', {level: S.crossfitLevel, days: S.sportDays, compGoal: S.crossfitCompGoal}); window.render(); }
 }}, (window.isEnglish && window.isEnglish() ? 'Continue' : 'Continuer')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

// ─── CROSSFIT HELPERS ───
function getCFLevelIdx() {
 if (S.crossfitLevel === 'scaled') return 0;
 if (S.crossfitLevel === 'inter') return 1;
 if (S.crossfitLevel === 'rx_plus') return 3;
 return 2; // 'rx' or unknown defaults to rx (index 2)
}

function getCFSexKey() {
 return window.isMale(S) ? 'm' : 'f';
}

function formatCFMovement(mov) {
 var levelIdx = getCFLevelIdx();
 var sexKey = getCFSexKey();
 var level = S.crossfitLevel;
 var parts = [];

 if (mov.reps) parts.push(mov.reps);

 if (mov.weight) {
 var w = window.getCFWorkingWeight ? window.getCFWorkingWeight(mov.weight) : '?';
 if (w !== '?') {
 var rmNote = '';
 if (S.crossfit1RM && S.crossfit1RM[mov.weight]) {
 var pctUsed = levelIdx === 0 ? 55 : levelIdx === 1 ? 65 : levelIdx === 3 ? 80 : 75;
 rmNote = ' (' + pctUsed + '% de votre 1RM)';
 }
 parts.push(mov.name + ' @' + (window.UNITS ? window.UNITS.displayWeight(parseFloat(w)) : w + 'kg') + rmNote);
 } else {
 parts.push(mov.name);
 }
 } else if (mov.gymnastics) {
 var gstd = window.CF_STANDARDS ? window.CF_STANDARDS[mov.gymnastics] : undefined;
 if (gstd && gstd[level]) {
 parts.push(gstd[level]);
 } else {
 parts.push(mov.name);
 }
 } else if (mov.special) {
 var sstd = window.CF_STANDARDS ? window.CF_STANDARDS[mov.special] : undefined;
 if (sstd && sstd.cal) {
 parts.push(mov.name + ' (' + sstd.cal[levelIdx] + ' cal)');
 } else {
 parts.push(mov.name);
 }
 } else if (mov.note) {
 parts.push(mov.note);
 } else {
 parts.push(mov.name);
 }

 return parts.join(' ');
}

function getCFWeight(key) {
 // Use personalized 1RM if available
 if (window.getCFWorkingWeight) {
 var w = window.getCFWorkingWeight(key);
 if (w !== '?') {
 var result = window.UNITS ? window.UNITS.displayWeight(parseFloat(w)) : w + 'kg';
 if (S.crossfit1RM && S.crossfit1RM[key]) {
 var lvlIdx = getCFLevelIdx();
 var pct = lvlIdx === 0 ? 55 : lvlIdx === 1 ? 65 : lvlIdx === 3 ? 80 : 75;
 result += ' (' + pct + '% 1RM)';
 }
 return result;
 }
 }
 if (!window.CF_STANDARDS) return '';
 var std = window.CF_STANDARDS[key];
 if (!std) return '';
 var sexKey = getCFSexKey();
 var levelIdx = getCFLevelIdx();
 if (std[sexKey]) return window.UNITS ? window.UNITS.displayWeight(std[sexKey][levelIdx]) : std[sexKey][levelIdx] + 'kg';
 return '';
}

// ─── DAY TEMPLATES BY DAYS/WEEK ───

// ─── SPORT MIX: SÉANCES MUSCULATION COMPLÉMENTAIRES ───
// Programmes pré-définis pour les jours musculation quand sportMixSecondary est configuré

// ═══════════════════════════════════════════════════════════════
// 2026-04 PHASE 1 — SESSIONS MIX ÉTENDUES (running/yoga/crossfit)
// Permet à un sport secondaire (X jours/sem) d'être : musculation,
// running, yoga ou crossfit. Format identique à MUSCU_MIX_SESSIONS :
//   { name, focus, exercises: [{ name, sets, rest, note }] }
// ═══════════════════════════════════════════════════════════════




// Sessions courtes pour calisthenics comme secondaire (ou complément)

// ─── DISPATCHER UNIFIÉ : retourne les sessions pour n'importe quel type secondaire ───
// Priorité : type reconnu → sessions dédiées, sinon fallback muscu (safe default)
function getMixSessionsForType(type, days) {
 var d = Math.min(Math.max(days || 1, 1), 4);
 var t = String(type || 'musculation').toLowerCase();
 var source = null;
 if (t === 'running')           source = RUNNING_MIX_SESSIONS;
 else if (t === 'yoga')         source = YOGA_MIX_SESSIONS;
 else if (t === 'crossfit')     source = CROSSFIT_MIX_SESSIONS;
 else if (t === 'calisthenics') source = CALISTHENICS_MIX_SESSIONS;
 else                           source = MUSCU_MIX_SESSIONS; // défaut safe
 if (!source || !source.length) source = MUSCU_MIX_SESSIONS; // guard: source vide → fallback safe
 // Toujours retourner exactement "d" sessions (rotation si moins de sessions disponibles)
 var out = [];
 for (var i = 0; i < d; i++) out.push(source[i % source.length]);
 return out;
}
window.getMixSessionsForType = getMixSessionsForType;

// ─── SESSION MUSCU MIX: sélection des sessions selon nombre de jours ───
function getMuscuMixSessionsForDays(days) {
 var d = Math.min(Math.max(days, 1), 4);
 if (d === 1) return [MUSCU_MIX_SESSIONS[0]];
 if (d === 2) return [MUSCU_MIX_SESSIONS[0], MUSCU_MIX_SESSIONS[1]];
 if (d === 3) return [MUSCU_MIX_SESSIONS[2], MUSCU_MIX_SESSIONS[3], MUSCU_MIX_SESSIONS[0]];
 return [MUSCU_MIX_SESSIONS[2], MUSCU_MIX_SESSIONS[3], MUSCU_MIX_SESSIONS[0], MUSCU_MIX_SESSIONS[1]];
}

// ─── SECTION SPORT MIX : injectée dans les étapes de configuration de chaque sport ───
function renderSportMixSection(p, primarySport) {
 var totalDays = S.sportDays || 3;
 // Jours minimum requis pour chaque sport principal (2026-04 P2 étendu)
 var _minPrimaryDays = { crossfit: 3, musculation: 2, running: 2, yoga: 2, calisthenics: 2 };
 var _primMinDays = _minPrimaryDays[primarySport] || 2;
 // Maximum de jours secondaires = totalDays - minimum du sport principal
 var _maxSecDays = totalDays - _primMinDays;
 if (_maxSecDays < 1) return; // Pas assez de jours pour un 2ème sport

 // 2026-04 P5 GUARDS EDGE CASES :
 // 1) Si sport primaire change mais un secondaire orphelin reste en mémoire (data corruption)
 //    → nettoyer si le type secondaire n'est plus dans la nouvelle compatMap du primaire.
 // 2) Si prim === sec (corruption cross-session), reset pour éviter boucle logique.
 // 3) Si sportMixSecondary.days > _maxSecDays ou < 1, clamp (déjà fait plus bas mais on
 //    sécurise aussi ici avant l'affichage).
 if (S.sportMixEnabled && S.sportMixSecondary) {
  var _sec = S.sportMixSecondary;
  // Guard 2 : prim === sec → reset
  if (_sec.type === primarySport) {
   S.sportMixSecondary = null;
   S.sportMixEnabled = false;
  }
 }

 // Sports secondaires compatibles par sport principal (2026-04 P3 étendu)
 // Règle : on n'ajoute PAS le même sport en secondaire (pas de crossfit+crossfit)
 var compatMap = {
  crossfit:    [
   { type: 'musculation', label: 'Musculation', desc: (window.isEnglish && window.isEnglish() ? 'Hypertrophy + strength — isolated strength sessions' : 'Hypertrophie + force — séances de renforcement isolées') },
   { type: 'running',     label: 'Running',     desc: (window.isEnglish && window.isEnglish() ? 'Aerobic cardio — zone 2 endurance' : 'Cardio aérobic — zone 2 endurance') },
   { type: 'yoga',        label: 'Yoga',        desc: (window.isEnglish && window.isEnglish() ? 'Mobility + recovery — injury prevention' : 'Mobilité + récupération — prévention') }
  ],
  musculation: [
   { type: 'crossfit',    label: 'Cross Training', desc: (window.isEnglish && window.isEnglish() ? 'Conditioning + functional WOD' : 'Conditioning + WOD fonctionnel') },
   { type: 'running',     label: 'Running',        desc: (window.isEnglish && window.isEnglish() ? 'Cardio — fat burn + heart' : 'Cardio — fonte du gras + cœur') },
   { type: 'yoga',        label: 'Yoga',           desc: (window.isEnglish && window.isEnglish() ? 'Mobility + active recovery' : 'Mobilité + récupération active') }
  ],
  running:     [
   { type: 'musculation', label: 'Musculation',    desc: (window.isEnglish && window.isEnglish() ? 'Strengthening — running injury prevention' : 'Renforcement — prévention des blessures course') },
   { type: 'crossfit',    label: 'Cross Training', desc: (window.isEnglish && window.isEnglish() ? 'Functional strength + power' : 'Force fonctionnelle + power') },
   { type: 'yoga',        label: 'Yoga',           desc: (window.isEnglish && window.isEnglish() ? 'Flexibility + recovery' : 'Souplesse + récupération') }
  ]
 };
 var secondaryOptions = compatMap[primarySport] || [];
 if (!secondaryOptions.length) return;

 // 2026-04 P5 GUARD 1 : si secondaire orphelin (type plus dans compatMap courante), reset
 if (S.sportMixEnabled && S.sportMixSecondary && S.sportMixSecondary.type) {
  var _stillCompatible = secondaryOptions.some(function(opt) { return opt.type === S.sportMixSecondary.type; });
  if (!_stillCompatible) {
   S.sportMixSecondary = null;
   S.sportMixEnabled = false;
  }
 }

 // ─── HEADER SECTION ───
 p.appendChild(h('div', { style: 'height:24px' }));
 p.appendChild(h('div', { style: 'border-top:1px solid var(--border,#E8E6DF);margin:0 0 20px' }));
 p.appendChild(h('div', { 'class': 'section-label' }, (window.isEnglish && window.isEnglish() ? 'Combine multiple sports\u00a0? (optional)' : 'Combiner plusieurs sports\u00a0? (optionnel)')));
 p.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin-bottom:14px;line-height:1.6' }, (window.isEnglish && window.isEnglish() ? 'Add a 2nd sport on your remaining days. The total must equal your weekly goal.' : 'Ajoutez un 2\u00e8me sport sur vos jours restants. La somme doit \u00e9galer votre total hebdomadaire.')));

 // ─── OUI / NON ───
 var _primDesc = primarySport === 'crossfit' ? 'Cross Training' : primarySport === 'musculation' ? 'Musculation' : 'Running';
 var _mixOnOff = h('div', { 'class': 'level-list' });
 [
  { id: false, label: (window.isEnglish && window.isEnglish() ? 'No \u2014 single program' : 'Non \u2014 programme unique'), desc: (window.isEnglish && window.isEnglish() ? 'All my days in ' : 'Tous mes jours en ') + _primDesc },
  { id: true,  label: (window.isEnglish && window.isEnglish() ? 'Yes \u2014 combine with a 2nd sport' : 'Oui \u2014 combiner avec un 2\u00e8me sport'), desc: (window.isEnglish && window.isEnglish() ? 'Split my days between 2 sports' : 'R\u00e9partir mes jours entre 2 sports') }
 ].forEach(function(opt) {
  var _isSel = opt.id ? !!S.sportMixEnabled : !S.sportMixEnabled;
  _mixOnOff.appendChild(h('div', { 'class': 'level-item' + (_isSel ? ' on' : ''), onclick: function() {
   S.sportMixEnabled = !!opt.id;
   if (!opt.id) S.sportMixSecondary = null;
   window.render();
  }}, [h('div', {}, [h('div', { 'class': 'level-name' }, opt.label), h('div', { 'class': 'level-desc' }, opt.desc)])]));
 });
 p.appendChild(_mixOnOff);

 if (!S.sportMixEnabled) return;

 // ─── CHOIX DU SPORT SECONDAIRE ───
 p.appendChild(h('div', { 'class': 'section-label', style: 'margin-top:16px' }, (window.isEnglish && window.isEnglish() ? '2nd sport' : '2\u00e8me sport')));
 var _secList = h('div', { 'class': 'level-list' });
 secondaryOptions.forEach(function(sopt) {
  var _isSel = S.sportMixSecondary && S.sportMixSecondary.type === sopt.type;
  _secList.appendChild(h('div', { 'class': 'level-item' + (_isSel ? ' on' : ''), onclick: function() {
   if (!S.sportMixSecondary || S.sportMixSecondary.type !== sopt.type) {
    var _defDays = Math.max(1, Math.min(2, _maxSecDays));
    S.sportMixSecondary = { type: sopt.type, days: _defDays };
   }
   window.render();
  }}, [h('div', {}, [h('div', { 'class': 'level-name' }, sopt.label), h('div', { 'class': 'level-desc' }, sopt.desc)])]));
 });
 p.appendChild(_secList);

 if (!S.sportMixSecondary) return;

 // Clamp secondary days si état corrompu / SportDays modifié après coup
 if (!S.sportMixSecondary.days || S.sportMixSecondary.days < 1) S.sportMixSecondary.days = 1;
 if (S.sportMixSecondary.days > _maxSecDays) S.sportMixSecondary.days = _maxSecDays;

 var _secDays  = S.sportMixSecondary.days;
 var _primDays = totalDays - _secDays;
 // 2026-04 P3 : labels étendus pour supporter running/yoga/calisthenics en primaire ET secondaire
 var _LABELS = { musculation: 'Musculation', crossfit: 'Cross Training', running: 'Running', yoga: 'Yoga', calisthenics: 'Calisthenics' };
 var _primLabel = _LABELS[primarySport] || primarySport;
 var _secLabel = _LABELS[S.sportMixSecondary.type] || S.sportMixSecondary.type;

 // ─── RÉPARTITION DES JOURS ───
 p.appendChild(h('div', { 'class': 'section-label', style: 'margin-top:16px' }, (window.isEnglish && window.isEnglish() ? 'Day distribution' : 'R\u00e9partition des jours')));

 var _allocBox = h('div', { style: 'border:1px solid var(--border,#E8E6DF);padding:16px 12px;background:var(--ivory2,#F5F5F0);margin-bottom:8px' });

 // Affichage A + B = Total
 var _allocRow = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px' });
 var _primBox = h('div', { style: 'text-align:center;flex:1' });
 _primBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:30px;line-height:1;color:var(--black,#0A0A09)' }, String(_primDays)));
 _primBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px' }, _primLabel));
 _allocRow.appendChild(_primBox);
 _allocRow.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:20px;color:var(--grey);padding:0 4px' }, '+'));
 var _secBox = h('div', { style: 'text-align:center;flex:1' });
 _secBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:30px;line-height:1;color:var(--ink-900,#0A0A09)' }, String(_secDays)));
 _secBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-900,#0A0A09);margin-top:4px' }, _secLabel));
 _allocRow.appendChild(_secBox);
 _allocRow.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:20px;color:var(--grey);padding:0 4px' }, '='));
 var _totBox = h('div', { style: 'text-align:center;flex:1' });
 _totBox.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:30px;line-height:1;color:var(--black,#0A0A09)' }, String(totalDays)));
 _totBox.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px' }, (window.isEnglish && window.isEnglish() ? 'Total' : 'Total')));
 _allocRow.appendChild(_totBox);
 _allocBox.appendChild(_allocRow);

 // Boutons +/- pour ajuster les jours secondaires
 var _stepRow = h('div', { style: 'display:flex;align-items:center;justify-content:center;gap:16px' });
 var _canMinus = _secDays > 1;
 var _canPlus  = _secDays < _maxSecDays;
 _stepRow.appendChild(h('button', {
  type: 'button',
  style: 'width:44px;height:44px;border:1.5px solid var(--border,#E8E6DF);background:transparent;font-family:Georgia,serif;font-size:22px;cursor:pointer;border-radius:2px;transition:opacity .15s;' + (_canMinus ? '' : 'opacity:0.3;pointer-events:none'),
  onclick: function() { if (S.sportMixSecondary && S.sportMixSecondary.days > 1) { S.sportMixSecondary.days--; window.render(); } }
 }, '\u2212'));
 _stepRow.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;min-width:110px' }, (window.isEnglish && window.isEnglish() ? 'Days ' : 'Jours ') + _secLabel));
 _stepRow.appendChild(h('button', {
  type: 'button',
  style: 'width:44px;height:44px;border:1.5px solid var(--border,#E8E6DF);background:transparent;font-family:Georgia,serif;font-size:22px;cursor:pointer;border-radius:2px;transition:opacity .15s;' + (_canPlus ? '' : 'opacity:0.3;pointer-events:none'),
  onclick: function() { if (S.sportMixSecondary && S.sportMixSecondary.days < _maxSecDays) { S.sportMixSecondary.days++; window.render(); } }
 }, '+'));
 _allocBox.appendChild(_stepRow);
 p.appendChild(_allocBox);

 // Validation
 var _vs = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;text-align:center;padding:8px 12px;border:1px solid;';
 if (_primDays < 1) {
  p.appendChild(h('div', { style: _vs + 'color:var(--error,#7A1F1F);background:rgba(122,31,31,0.06);border-color:rgba(90,16,16,0.2)' }, (window.isEnglish && window.isEnglish() ? '\u26a0 At least 1 day is required for your main sport' : '\u26a0 Il faut au moins 1 jour pour votre sport principal')));
 } else {
  p.appendChild(h('div', { style: _vs + 'color:var(--ink-900,#0A0A09);background:rgba(62,92,58,0.04);border-color:rgba(26,74,26,0.15)' }, '\u2713\u00a0' + _primDays + (window.isEnglish && window.isEnglish() ? ' d ' : ' j ') + _primLabel + '\u00a0+\u00a0' + _secDays + (window.isEnglish && window.isEnglish() ? ' d ' : ' j ') + _secLabel + '\u00a0=\u00a0' + totalDays + (window.isEnglish && window.isEnglish() ? ' days / week' : ' jours / semaine')));
 }
}

function generateCrossfitWeek(weekNumber, daysPerWeek) {
 var allWods = window.CF_WODS || [];
 if (!allWods.length) return [];

 // Semaines de décharge CrossFit : 4, 8, 12, 16... (cycle 3+1 semaines — cycle 3+1 semaines elite)
 // Volume réduit 40-50%, intensité plafonnée à 70% max, pas de PR ni de test.
 var isDeloadWeek = (weekNumber % 4 === 0);

 var template = CF_DAY_TEMPLATES[daysPerWeek] || CF_DAY_TEMPLATES[4];
 var weekProgram = [];
 var startIdx = ((weekNumber - 1) * daysPerWeek) % allWods.length;

 for (var d = 0; d < template.length; d++) {
 var wodIdx = (startIdx + d) % allWods.length;
 var wod = allWods[wodIdx];
 weekProgram.push({
 dayNumber: d + 1,
 dayLabel: template[d].label,
 focus: template[d].focus,
 hasHaltero: template[d].hasHaltero,
 halteroLift: template[d].halteroLift,
 wod: wod,
 isDeload: isDeloadWeek
 });
 }

 return weekProgram;
}

// ─── VUE CALENDRIER 100 JOURS ───
function renderCFCalendar(p) {
 // Guard: ensure cfProgress is always an object
 if (!S.cfProgress || typeof S.cfProgress !== 'object') S.cfProgress = {};
 // Guard: ensure cfCurrentDay is a valid number
 if (!S.cfCurrentDay || S.cfCurrentDay < 1) S.cfCurrentDay = 1;
 if (S.cfCurrentDay > 100) S.cfCurrentDay = 100;

 var allWods = window.CF_WODS_FULL || window.CF_WODS || [];

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'CrossFit' : 'CrossFit')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Program<br><em>100 Days</em>' : 'Programme<br><em>100 Jours</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Overview — click on a day to access it' : 'Vue d\'ensemble — cliquez sur un jour pour y accéder')));

 // ─── Bouton retour ───
 var backBtn = h('button', {'class': 'btn-back', style: 'margin-bottom:16px', onclick: function() {
 S.cfCalendarOpen = false;
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? '← Back to program' : '← Retour au programme'));
 p.appendChild(backBtn);

 // ─── Légende ───
 var legend = h('div', {style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;align-items:center'});
 var legendItems = [
 {color: '#3E5C3A', label: (window.isEnglish && window.isEnglish() ? 'Completed' : 'Complété')},
 {color: '#1A3C5E', label: (window.isEnglish && window.isEnglish() ? 'Current day' : 'Jour actuel')},
 {color: '#999', label: (window.isEnglish && window.isEnglish() ? 'Upcoming' : 'À venir')}
 ];
 legendItems.forEach(function(li) {
 var dot = h('div', {style: 'width:12px;height:12px;border-radius:0;background:' + li.color + ';flex-shrink:0'});
 var lbl = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, li.label);
 var item = h('div', {style: 'display:flex;align-items:center;gap:6px'}, [dot, lbl]);
 legend.appendChild(item);
 });
 p.appendChild(legend);

 // ─── Progression globale ───
 var totalDone = 0;
 for (var dk in S.cfProgress) { if (S.cfProgress[dk] && S.cfProgress[dk].done) totalDone++; }
 var pct = Math.round(totalDone / 100 * 100);
 var progressBar = h('div', {style: 'background:#E5E4DE;height:6px;border-radius:2px;margin-bottom:20px;overflow:hidden'});
 progressBar.appendChild(h('div', {style: 'background:var(--ink-900,#0A0A09);height:100%;width:' + pct + '%;transition:width 0.4s ease'}));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, totalDone + (window.isEnglish && window.isEnglish() ? ' / 100 days completed (' : ' / 100 jours complétés (') + pct + '%)'));
 p.appendChild(progressBar);

 // ─── Grouper par semaine ───
 var weeks = {};
 for (var wi = 0; wi < allWods.length && wi < 100; wi++) {
 var wod = allWods[wi];
 var weekNum = wod.week || (Math.floor(wi / 7) + 1);
 if (!weeks[weekNum]) weeks[weekNum] = [];
 weeks[weekNum].push(wod);
 }
 // Si CF_WODS_FULL non chargé, générer des jours fictifs pour afficher la structure
 if (!allWods.length) {
 for (var fd = 1; fd <= 100; fd++) {
 var fw = Math.floor((fd - 1) / 7) + 1;
 if (!weeks[fw]) weeks[fw] = [];
 weeks[fw].push({ day: fd, week: fw, name: 'JOUR ' + fd });
 }
 }

 var weekKeys = Object.keys(weeks).map(Number).sort(function(a, b) { return a - b; });

 weekKeys.forEach(function(weekNum) {
 var wods = weeks[weekNum];
 var weekSection = h('div', {style: 'margin-bottom:24px'});

 // Header semaine
 var weekLabel = (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + weekNum;
 // Phases indicatives
 if (weekNum <= 4) weekLabel += (window.isEnglish && window.isEnglish() ? ' — Base' : ' — Base');
 else if (weekNum <= 7) weekLabel += (window.isEnglish && window.isEnglish() ? ' — Development' : ' — Développement');
 else if (weekNum <= 9) weekLabel += (window.isEnglish && window.isEnglish() ? ' — Intensity' : ' — Intensité');
 else if (weekNum === 10) weekLabel += (window.isEnglish && window.isEnglish() ? ' — Final' : ' — Finale');
 weekSection.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;font-style:italic;margin-bottom:10px;border-bottom:1px solid var(--border);padding-bottom:6px'}, weekLabel));

 var grid = h('div', {style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px'});

 wods.forEach(function(wod) {
 var dayNum = wod.day;
 var isDone = S.cfProgress[dayNum] && S.cfProgress[dayNum].done === true;
 var isCurrent = dayNum === S.cfCurrentDay;

 var cardColor, textColor, borderColor;
 if (isDone) {
 cardColor = 'rgba(76,175,80,0.12)';
 textColor = '#2E7D32';
 borderColor = '#3E5C3A';
 } else if (isCurrent) {
 cardColor = 'rgba(26,60,94,0.10)';
 textColor = '#1A3C5E';
 borderColor = '#1A3C5E';
 } else {
 cardColor = 'rgba(153,153,153,0.07)';
 textColor = '#999';
 borderColor = '#ccc';
 }

 var card = h('div', {
 style: 'background:' + cardColor + ';border:1px solid ' + borderColor + ';border-left:3px solid ' + borderColor + ';padding:10px;cursor:pointer;border-radius:2px;transition:opacity 0.15s',
 onclick: (function(d) {
 return function() {
 S.cfCurrentDay = d;
 // Naviguer vers ce jour dans renderCrossfitProgram
 // On calcule la semaine correspondante et on met à jour crossfitWeek
 if (window.CF_WODS_FULL) {
 var targetWod = window.CF_WODS_FULL.find(function(w) { return w.day === d; });
 if (targetWod && targetWod.week) {
 S.crossfitWeek = targetWod.week;
 }
 }
 S.cfCalendarOpen = false;
 window.render();
 };
 })(dayNum)
 });

 // Numéro + nom du WOD
 card.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + textColor + ';margin-bottom:3px'}, (window.isEnglish && window.isEnglish() ? 'DAY ' : 'JOUR ') + dayNum));
 card.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:' + textColor + ';font-weight:normal;line-height:1.2;word-break:break-word'}, wod.name || ('WOD ' + dayNum)));

 // Indicateur état
 if (isDone) {
 card.appendChild(h('div', {style: 'font-size:11px;color:var(--success,#3E5C3A);margin-top:4px'}, (window.isEnglish && window.isEnglish() ? ' Done' : ' Terminé')));
 } else if (isCurrent) {
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:4px'}, (window.isEnglish && window.isEnglish() ? 'Today' : 'Aujourd\'hui')));
 }

 grid.appendChild(card);
 });

 weekSection.appendChild(grid);
 p.appendChild(weekSection);
 });

 // Bouton retour en bas
 var backBtn2 = h('button', {'class': 'btn-back', style: 'margin-top:8px', onclick: function() {
 S.cfCalendarOpen = false;
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? '← Back to program' : '← Retour au programme'));
 p.appendChild(backBtn2);
}

// ─── WELLNESS CHECKIN ───
// ─── BANDEAU BIEN-ÊTRE (variante non-bloquante) ───
// Affiche un bandeau dismissable en haut du contenu programme.
// L'utilisateur peut remplir rapidement ou ignorer avec des valeurs par défaut (moyenne).
function renderWellnessBanner(p) {
 var banner = h('div', {style: 'background:var(--paper-2,#F4F1EA);border:1px solid var(--ink-900,#0A0A09);border-radius:2px;padding:14px 16px;margin-bottom:20px;position:relative'});

 var titleRow = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px'});
 titleRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--ink-900,#0A0A09);font-weight:700'}, (window.isEnglish && window.isEnglish() ? 'Daily check-in' : 'Bilan de forme')));

 var closeBtn = h('button', {style: 'background:none;border:none;cursor:pointer;font-size:18px;color:var(--grey,#6B6B65);line-height:1;padding:0;margin:0'}, '×');
 closeBtn.addEventListener('click', function() {
  // FIX UI #3 2026-04 : le close × ne doit RIEN enregistrer comme données wellness.
  // Avant : il inventait sleep:3, muscles:'courbatures', energy:'moyen' → adaptations
  //         programme erronées basées sur des valeurs jamais saisies par l'user.
  // Maintenant : on stocke un marqueur "dismissed" daté pour ne pas re-afficher le
  //              banner aujourd'hui, mais SANS valeurs wellness inventées.
  var today = new Date().toISOString().slice(0, 10);
  S.todayWellness = { date: today, dismissed: true };
  S._wellnessReminder = false;
  banner.style.display = 'none';
  if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
  if (window.render) window.render();
 });
 titleRow.appendChild(closeBtn);
 banner.appendChild(titleRow);

 banner.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'How are you feeling today? (optional)' : 'Comment vous sentez-vous aujourd\'hui ? (optionnel)')));

 var wellnessState = { sleep: 0, muscles: '', energy: '' };

 // Ligne sommeil
 var sleepRow = h('div', {style: 'margin-bottom:8px'});
 sleepRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Sleep' : 'Sommeil')));
 var sleepBtnsRow = h('div', {style: 'display:flex;gap:4px'});
 var sleepBtnsArr = [];
 [1,2,3,4,5].forEach(function(val) {
  var label = (window.isEnglish && window.isEnglish() ? ['Poor','Meh','OK','Good','Great'] : ['Mauvais','Bof','Moyen','Bon','Top'])[val-1];
  var btn = h('button', {style: 'flex:1;padding:6px 2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;cursor:pointer;text-transform:uppercase;letter-spacing:1px'}, label);
  btn.addEventListener('click', function() {
   wellnessState.sleep = val;
   sleepBtnsArr.forEach(function(b) { b.style.background = 'var(--ivory,#FAF9F6)'; b.style.borderColor = 'var(--border,#D8D8D0)'; b.style.color = 'inherit'; });
   btn.style.background = 'var(--ink-900,#0A0A09)';
   btn.style.borderColor = 'var(--ink-900,#0A0A09)';
   btn.style.color = 'var(--ivory,#FAF9F6)';
   checkWellnessBannerComplete();
  });
  sleepBtnsArr.push(btn);
  sleepBtnsRow.appendChild(btn);
 });
 sleepRow.appendChild(sleepBtnsRow);
 banner.appendChild(sleepRow);

 // Ligne muscles
 var muscleRow = h('div', {style: 'margin-bottom:8px'});
 muscleRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Muscles' : 'Muscles')));
 var muscleBtnsRow = h('div', {style: 'display:flex;gap:4px'});
 var muscleBtnsArr = [];
 [['frais',(window.isEnglish && window.isEnglish() ? 'Fresh' : 'Frais')],['courbatures',(window.isEnglish && window.isEnglish() ? 'Sore' : 'Courbatures')],['douleurs',(window.isEnglish && window.isEnglish() ? 'Pain' : 'Douleurs')]].forEach(function(opt) {
  var val = opt[0], label = opt[1];
  var btn = h('button', {style: 'flex:1;padding:6px 2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;cursor:pointer;text-transform:uppercase;letter-spacing:1px'}, label);
  btn.addEventListener('click', function() {
   wellnessState.muscles = val;
   muscleBtnsArr.forEach(function(b) { b.style.background = 'var(--ivory,#FAF9F6)'; b.style.borderColor = 'var(--border,#D8D8D0)'; b.style.color = 'inherit'; });
   btn.style.background = 'var(--ink-900,#0A0A09)';
   btn.style.borderColor = 'var(--ink-900,#0A0A09)';
   btn.style.color = 'var(--ivory,#FAF9F6)';
   checkWellnessBannerComplete();
  });
  muscleBtnsArr.push(btn);
  muscleBtnsRow.appendChild(btn);
 });
 muscleRow.appendChild(muscleBtnsRow);
 banner.appendChild(muscleRow);

 // Ligne énergie
 var energyRow = h('div', {style: 'margin-bottom:12px'});
 energyRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? '\u26A1 Energy' : '\u26A1 \u00c9nergie')));
 var energyBtnsRow = h('div', {style: 'display:flex;gap:4px'});
 var energyBtnsArr = [];
 [['bas',(window.isEnglish && window.isEnglish() ? 'Low' : 'Basse')],['moyen',(window.isEnglish && window.isEnglish() ? 'Medium' : 'Moyenne')],['haut',(window.isEnglish && window.isEnglish() ? 'High' : 'Haute')]].forEach(function(opt) {
  var val = opt[0], label = opt[1];
  var btn = h('button', {style: 'flex:1;padding:6px 2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;cursor:pointer;text-transform:uppercase;letter-spacing:1px'}, label);
  btn.addEventListener('click', function() {
   wellnessState.energy = val;
   energyBtnsArr.forEach(function(b) { b.style.background = 'var(--ivory,#FAF9F6)'; b.style.borderColor = 'var(--border,#D8D8D0)'; b.style.color = 'inherit'; });
   btn.style.background = 'var(--ink-900,#0A0A09)';
   btn.style.borderColor = 'var(--ink-900,#0A0A09)';
   btn.style.color = 'var(--ivory,#FAF9F6)';
   checkWellnessBannerComplete();
  });
  energyBtnsArr.push(btn);
  energyBtnsRow.appendChild(btn);
 });
 energyRow.appendChild(energyBtnsRow);
 banner.appendChild(energyRow);

 var confirmBtn = h('button', {style: 'width:100%;padding:14px;background:var(--ink-900,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;opacity:0.4;pointer-events:none'}, (window.isEnglish && window.isEnglish() ? 'Confirm check-in' : 'Confirmer mon bilan'));
 confirmBtn.addEventListener('click', function() {
  var today = new Date().toISOString().slice(0, 10);
  S.todayWellness = { date: today, sleep: wellnessState.sleep, muscles: wellnessState.muscles, energy: wellnessState.energy };
  try { if (window.pushWellnessHistory) window.pushWellnessHistory(S.todayWellness); } catch(e) {}
  S._wellnessReminder = false;
  banner.style.display = 'none';
  if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Morning recap saved' : 'Bilan du matin enregistré', 'success', 2000);
  if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
  if (window.render) { try { window.render(); } catch(e) {} }
 });
 banner.appendChild(confirmBtn);

 // Bouton "Passer" — check bien-être optionnel, ne bloque pas l'utilisateur
 var _skipBtn = h('button', {style: 'width:100%;margin-top:8px;padding:10px;background:transparent;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;color:var(--grey,#6B6B65);cursor:pointer;text-decoration:underline;'}, (window.isEnglish && window.isEnglish()) ? 'Skip for now' : 'Passer pour l\'instant');
 _skipBtn.addEventListener('click', function() {
  S._wellnessReminder = false;
  banner.style.display = 'none';
  if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
  if (window.render) { try { window.render(); } catch(e) {} }
 });
 banner.appendChild(_skipBtn);

 function checkWellnessBannerComplete() {
  if (wellnessState.sleep && wellnessState.muscles && wellnessState.energy) {
   confirmBtn.style.opacity = '1';
   confirmBtn.style.pointerEvents = 'auto';
  }
 }

 p.insertBefore(banner, p.firstChild);
}

function renderWellnessCheckin(p, onComplete) {
 if (!p || !p.nodeType) return; // FIX edge audit : guard p=null
 var state = { sleep: 0, muscles: '', energy: '' };

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Daily check-in' : 'Bilan de forme')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'How do you<br><em>feel today?</em>' : 'Comment<br><em>vous sentez-vous ?</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'A few questions to adapt your session today.' : 'Quelques questions pour adapter votre seance du jour.')));

  // Message d'encouragement checkin
  if (window.MOTIVATION) {
    var checkinMotiv = document.createElement('p');
    checkinMotiv.style.cssText = 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--grey,#6B6B65);margin:0 0 24px;line-height:1.6;border-left:2px solid var(--border,#D8D8D0);padding-left:14px;';
    checkinMotiv.textContent = (window.isEnglish && window.isEnglish() ? 'Taking a minute to assess your state is already an act of performance.' : 'Prendre une minute pour évaluer votre état, c\'est déjà un acte de performance.');
    p.appendChild(checkinMotiv);
  }

 // Question 1 — Sommeil
 var q1 = h('div', {style: 'margin-bottom:24px'});
 q1.appendChild(h('div', {style: 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Sleep quality' : 'Qualite du sommeil')));
 var sleepLabels = (window.isEnglish && window.isEnglish() ? ['Very poor', 'Poor', 'Average', 'Good', 'Excellent'] : ['Tres mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent']);
 var sleepBtns = [];
 var sleepRow = h('div', {style: 'display:flex;gap:6px;flex-wrap:wrap'});
 sleepLabels.forEach(function(label, i) {
  var val = i + 1;
  var btn = h('div', {'class': 'sel-card', style: 'flex:1;min-width:56px;text-align:center;cursor:pointer;padding:10px 4px', onclick: function() {
   state.sleep = val;
   sleepBtns.forEach(function(b) { b.className = 'sel-card'; });
   btn.className = 'sel-card on';
   updateStartBtn();
  }});
  btn.appendChild(h('div', {style: 'font-size:13px;font-family:Georgia,serif;margin-bottom:2px'}, String(val)));
  btn.appendChild(h('div', {style: 'font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--grey)'}, label));
  sleepBtns.push(btn);
  sleepRow.appendChild(btn);
 });
 q1.appendChild(sleepRow);
 p.appendChild(q1);

 // Question 2 — Muscles
 var q2 = h('div', {style: 'margin-bottom:24px'});
 q2.appendChild(h('div', {style: 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Muscle state' : 'Etat musculaire')));
 var muscleOpts = (window.isEnglish && window.isEnglish() ? [['frais', 'Fresh'], ['courbatures', 'Some soreness'], ['douleurs', 'Real pain']] : [['frais', 'Frais'], ['courbatures', 'Legeres courbatures'], ['douleurs', 'Douleurs reelles']]);
 var muscleBtns = [];
 var muscleRow = h('div', {style: 'display:flex;gap:6px;flex-wrap:wrap'});
 muscleOpts.forEach(function(opt) {
  var val = opt[0], label = opt[1];
  var btn = h('div', {'class': 'sel-card', style: 'flex:1;text-align:center;cursor:pointer;padding:10px 4px', onclick: function() {
   state.muscles = val;
   muscleBtns.forEach(function(b) { b.className = 'sel-card'; });
   btn.className = 'sel-card on';
   updateStartBtn();
  }});
  btn.appendChild(h('div', {style: 'font-size:9px;letter-spacing:1px;text-transform:uppercase'}, label));
  muscleBtns.push(btn);
  muscleRow.appendChild(btn);
 });
 q2.appendChild(muscleRow);
 p.appendChild(q2);

 // Question 3 — Energie
 var q3 = h('div', {style: 'margin-bottom:24px'});
 q3.appendChild(h('div', {style: 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Energy level' : 'Niveau d\'energie')));
 var energyOpts = (window.isEnglish && window.isEnglish() ? [['bas', 'Low'], ['moyen', 'Medium'], ['haut', 'High']] : [['bas', 'Basse'], ['moyen', 'Moyenne'], ['haut', 'Haute']]);
 var energyBtns = [];
 var energyRow = h('div', {style: 'display:flex;gap:6px;flex-wrap:wrap'});
 energyOpts.forEach(function(opt) {
  var val = opt[0], label = opt[1];
  var btn = h('div', {'class': 'sel-card', style: 'flex:1;text-align:center;cursor:pointer;padding:10px 4px', onclick: function() {
   state.energy = val;
   energyBtns.forEach(function(b) { b.className = 'sel-card'; });
   btn.className = 'sel-card on';
   updateStartBtn();
  }});
  btn.appendChild(h('div', {style: 'font-size:9px;letter-spacing:1px;text-transform:uppercase'}, label));
  energyBtns.push(btn);
  energyRow.appendChild(btn);
 });
 q3.appendChild(energyRow);
 p.appendChild(q3);

 // Bouton Commencer
 var startBtn = h('button', {'class': 'btn-primary', style: 'width:100%;opacity:0.4;pointer-events:none', onclick: function() {
  var today = new Date().toISOString().slice(0, 10);
  S.todayWellness = { date: today, sleep: state.sleep, muscles: state.muscles, energy: state.energy };
  // POLISH 2026-04 : push dans wellness history multi-jours (90j glissants)
  try { if (window.pushWellnessHistory) window.pushWellnessHistory(S.todayWellness); } catch(e) {}
  if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Morning recap saved' : 'Bilan du matin enregistré', 'success', 2000);
  if (onComplete) onComplete();
 }}, (window.isEnglish && window.isEnglish() ? 'Start session' : 'Commencer la séance'));
 p.appendChild(startBtn);

 // Message d'aide : visible tant que le bouton est grisé, disparaît quand tout est rempli
 var _startHint = h('div', {style: 'text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:8px;letter-spacing:0.3px;'}, (window.isEnglish && window.isEnglish()) ? 'Answer the 3 questions above to start' : 'Réponds aux 3 questions ci-dessus pour commencer');
 p.appendChild(_startHint);

 function updateStartBtn() {
  if (state.sleep && state.muscles && state.energy) {
   startBtn.style.opacity = '1';
   startBtn.style.pointerEvents = 'auto';
   _startHint.style.display = 'none';
  }
 }
}

function getWellnessAdaptation() {
 var w = S.todayWellness || {};
 var score = 0;
 // sleep: UI stores numeric 1-5; normalise legacy English strings just in case
 var sleepVal = w.sleep;
 if (sleepVal === 'good' || sleepVal === 'bien') sleepVal = 4;
 else if (sleepVal === 'excellent') sleepVal = 5;
 else if (sleepVal === 'average' || sleepVal === 'moyen') sleepVal = 3;
 else if (sleepVal === 'bad' || sleepVal === 'mauvais') sleepVal = 2;
 else if (sleepVal === 'very_bad' || sleepVal === 'tres_mauvais') sleepVal = 1;
 sleepVal = parseFloat(sleepVal);
 if (!isNaN(sleepVal)) {
  if (sleepVal <= 2) score -= 2;
  else if (sleepVal >= 4) score += 1;
 }
 // muscles: UI stores 'frais' / 'courbatures' / 'douleurs'; also accept English aliases
 var musclesVal = w.muscles;
 if (musclesVal === 'fresh' || musclesVal === 'average' || musclesVal === 'normal') musclesVal = 'frais';
 if (musclesVal === 'douleurs' || musclesVal === 'sore') score -= 3;
 else if (musclesVal === 'courbatures' || musclesVal === 'doms') score -= 1;
 // energy: UI stores 'bas' / 'moyen' / 'haut'; also accept English aliases
 var energyVal = w.energy;
 if (energyVal === 'high') energyVal = 'haut';
 else if (energyVal === 'low') energyVal = 'bas';
 else if (energyVal === 'average' || energyVal === 'medium' || energyVal === 'normal') energyVal = 'moyen';
 if (energyVal === 'bas') score -= 2;
 else if (energyVal === 'haut') score += 1;

 if (score <= -3) return { level: 'recovery', label: (window.isEnglish && window.isEnglish() ? 'Recovery session recommended' : 'Seance recuperation recommandee'), color: '#C0392B', advice: (window.isEnglish && window.isEnglish() ? 'Your fitness state requires a light session. Intensity reduced by 40%.' : 'Votre etat de forme necessite une seance legere. Intensite reduite de 40%.') };
 if (score <= -1) return { level: 'reduced', label: (window.isEnglish && window.isEnglish() ? 'Reduced intensity' : 'Intensite reduite'), color: '#E67E22', advice: (window.isEnglish && window.isEnglish() ? 'Light fatigue detected. Intensity reduced by 20%. Listen to your body.' : 'Legere fatigue detectee. Intensite reduite de 20%. Ecoutez votre corps.') };
 if (score >= 2) return { level: 'peak', label: (window.isEnglish && window.isEnglish() ? 'Peak form' : 'Forme optimale'), color: '#27AE60', advice: (window.isEnglish && window.isEnglish() ? 'Excellent fitness state. You can push on heavy sets.' : 'Excellent etat de forme. Vous pouvez pousser sur les sets lourds.') };
 return { level: 'normal', label: (window.isEnglish && window.isEnglish() ? 'Good form' : 'Forme correcte'), color: '#1A3A6A', advice: (window.isEnglish && window.isEnglish() ? 'Good session ahead. Respect rest times.' : 'Bonne seance en perspective. Respectez les temps de repos.') };
}
window.getWellnessAdaptation = getWellnessAdaptation;

// ═══ FIX P0/P1 2026-04-16 — Bannières médicales + grossesse pour TOUS les sports ═══
// Avant : seuls Musculation et CrossFit vérifiaient S.medical/S.muscuMedical.
// Running, Hyrox, Triathlon, Padel, Golf n'avaient AUCUN filtre médical ni grossesse.
// Un user avec cardiopathie recevait des intervals Z4-Z5, une femme enceinte du Hyrox.
function appendSportMedicalBanner(p, sportName) {
  // ── GROSSESSE ──
  if (S.pregnant && window.isFemale(S) && !S._sportMedPregShown) {
    var _pw = window.getPregnancySportWarning ? window.getPregnancySportWarning() : null;
    var _pwC = h('div', {style: 'border-left:3px solid #FF6B6B;background:#FFF3CD;padding:12px 16px;margin-bottom:12px'});
    _pwC.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#C00;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Pregnancy \u2014 Mandatory adaptations' : 'Grossesse \u2014 Adaptations obligatoires')));
    _pwC.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'}, _pw ? _pw.warning : (window.isEnglish && window.isEnglish() ? 'Reduce intensity and volume. Consult your doctor before continuing this sport.' : 'Réduisez l\u2019intensité et le volume. Consultez votre médecin avant de continuer ce sport.')));
    p.appendChild(_pwC);
  }
  // ── CONDITIONS MÉDICALES (S.medical) ──
  if (Array.isArray(S.medical) && S.medical.length > 0) {
    var _warns = [];
    var _ml = S.medical.map(function(m) { return String(m).toLowerCase(); });
    if (_ml.indexOf('cardio') !== -1 || _ml.indexOf('insuffisance_card') !== -1) {
      _warns.push('\u26A0 Cardiopathie : intensité max Zone 2 (< 65% FCmax). Pas de sprints, pas d\u2019intervalles courts. Arrêtez immédiatement en cas de douleur thoracique, essoufflement anormal ou vertiges (AHA 2018).');
    }
    if (_ml.indexOf('hta') !== -1 || _ml.indexOf('hta_severe') !== -1 || _ml.indexOf('hypertension') !== -1) {
      _warns.push('\u26A0 Hypertension : évitez les efforts isométriques intenses et les sprints. Restez en Zone 1-2. Mesurez votre tension avant chaque séance (ESC/ESH 2018).');
    }
    if (_ml.indexOf('osteoporose') !== -1 || _ml.indexOf('osteoporosis') !== -1) {
      _warns.push('\u26A0 Ostéoporose : évitez les impacts élevés (sauts, sprints, changements de direction brusques). Privilégiez les mouvements contrôlés et la marche (NOF 2022).');
    }
    if (_ml.indexOf('diabete_t1') !== -1 || _ml.indexOf('diabete_t2') !== -1) {
      _warns.push('\u26A0 Diabète : mesurez votre glycémie avant/après. Évitez l\u2019effort si < 4 mmol/L ou > 14 mmol/L. Gardez du sucre rapide à portée (ADA 2023).');
    }
    if (_ml.indexOf('polyarthrite') !== -1 || _ml.indexOf('arthrite') !== -1 || _ml.indexOf('rheumatoid') !== -1) {
      _warns.push('\u26A0 Arthrite : évitez les impacts répétés et les charges lourdes. Privilégiez les mouvements doux à amplitude contrôlée. Arrêtez en cas de poussée inflammatoire (EULAR 2020).');
    }
    if (_ml.indexOf('fibromyalgie') !== -1) {
      _warns.push((function(){ var _el = document.createElement('span'); _el.appendChild(document.createTextNode('\u26A0 Fibromyalgie : intensité légère uniquement (')); _el.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _el.appendChild(document.createTextNode(' max 5/10). Progression très graduelle. Évitez l\u2019épuisement (Häuser, Cochrane 2017).')); return _el; })());
    }
    if (_warns.length > 0) {
      var _mc = h('div', {style: 'border-left:3px solid var(--orange,#E86F1E);background:rgba(232,111,30,0.06);padding:12px 16px;margin-bottom:12px'});
      _mc.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange-ink,#7A3B0E);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Medical restrictions \u2014 ' : 'Restrictions médicales \u2014 ') + sportName));
      _warns.forEach(function(w) { _mc.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6;margin-bottom:4px'}, w)); });
      p.appendChild(_mc);
    }
  }
  // ── CONDITIONS MUSCU-SPÉCIFIQUES (S.muscuMedical) ──
  if (S.muscuMedical && S.muscuMedical.done) {
    var _mw = [];
    if (S.muscuMedical.knees || S.muscuMedical.acl || S.muscuMedical.meniscus || S.muscuMedical.kneeOsteoarthritis) {
      _mw.push('\u26A0 Genoux : évitez les sauts, changements de direction brusques, sprints et descentes. Privilégiez le vélo ou la natation.');
    }
    if (S.muscuMedical.lowerBack || S.muscuMedical.herniaDisc || S.muscuMedical.spondylarthritis) {
      _mw.push('\u26A0 Dos / Hernie : évitez les impacts, rotations sous charge et positions prolongées penchées. Gainage et mobilité recommandés.');
    }
    if (S.muscuMedical.shoulders || S.muscuMedical.rotatorCuff) {
      _mw.push('\u26A0 Épaules : évitez les mouvements au-dessus de la tête et les gestes balistiques (service, smash, swing).');
    }
    if (S.muscuMedical.elbows || S.muscuMedical.epicondylitis) {
      _mw.push('Coudes / Épicondylite : évitez les gestes répétitifs en pronation/supination forcée. Protégez avec une coudière.');
    }
    if (S.muscuMedical.feet) {
      _mw.push('\u26A0 Pieds / Fasciite : évitez les impacts répétés (course, sauts). Semelles adaptées obligatoires.');
    }
    var _mlMu = Array.isArray(S.medical) ? S.medical.map(function(m){return String(m).toLowerCase();}) : [];
    if (S.muscuMedical.hypertension && _mlMu.indexOf('hta') === -1 && _mlMu.indexOf('hta_severe') === -1 && _mlMu.indexOf('hypertension') === -1) {
      _mw.push((function(){ var _el = document.createElement('span'); _el.appendChild(document.createTextNode('\u26A0 HTA (profil muscu) : pas d\u2019efforts isométriques maximaux. ')); _el.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _el.appendChild(document.createTextNode(' max 6/10. Restez en Zone 1-2.')); return _el; })());
    }
    if (_mw.length > 0) {
      var _mwc = h('div', {style: 'border-left:3px solid var(--error,#7A1F1F);background:rgba(122,31,31,0.04);padding:12px 16px;margin-bottom:12px'});
      _mwc.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--error,#7A1F1F);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Adaptations \u2014 Medical profile' : 'Adaptations \u2014 Profil médical')));
      _mw.forEach(function(w) { _mwc.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--error,#7A1F1F);line-height:1.6;margin-bottom:4px'}, w)); });
      p.appendChild(_mwc);
    }
  }
  // ── ZONES SPORT-SPÉCIFIQUES (depuis bilan santé step 27) ──
  if (Array.isArray(S.medical) && S.medical.length > 0 && S.sportType) {
    var _zwm = {
      genou: {
        running:'Genoux : évitez les descentes et surfaces dures. Réduisez le volume de 20%. Natation comme cross-training (ACSM 2021).',
        crossfit:'Genoux : pas de box jumps à impact maximal ni de squat snatches lourds. Substituez par step-ups et goblet squats (NSCA 2020).',
        yoga:'Genoux : modifiez le pigeon pose et le lotus. Blocs sous les hanches. Évitez la flexion maximale.',
        cycling:'Genoux : selle à bonne hauteur (genou légèrement fléchi en bas). Évitez les cadences < 60 RPM avec forte résistance.',
        hyrox:'Genoux : remplacez les lunges par des step-ups. Réduisez les sauts.',
        padel:'Genoux : chauffage prolongé obligatoire. Réduisez les pivots brusques. Genouillère recommandée.',
        triathlon:'Genoux : vérifiez le fit vélo. Foulée plus courte en course. Évitez les longues descentes.',
        calisthenics:'Genoux : pistol squats remplacés par chaise murale ou band-assisted. Pas de réception sur sol dur.'
      },
      cheville: {
        running:'Cheville / Tendon d\'Achille : échauffement strict (10 min). Pas de sprints ni de côtes raides. Kilométrage réduit de 30%.',
        padel:'Cheville : chaussures à soutien latéral. Propioception hors du court. Cheillière recommandée.',
        triathlon:'Cheville : protégez le tendon en dernière portion course. Évitez les sorties post-vélo sur dénivelé.',
        calisthenics:'Cheville : pas de sauts avec réception unipodale. Substitut : step-ups et squats bilatéraux.'
      },
      tibia: {
        running:'Tibias (shin splints) : kilométrage réduit de 40%. Pas d\'interval training. Semelles de soutien d\'arche. Repos si douleur aiguë.'
      },
      lombaire: {
        running:'Bas du dos : gainage avant chaque séance (planche, bird-dog). Évitez les longues sorties sans échauffement postural.',
        crossfit:'Bas du dos : deadlifts plafonnés à 70% 1RM. Dos neutre strict. Pas de cleans lourds.',
        yoga:'Bas du dos : backbends profonds évités (Camel pose). Twists sans forçage. Forward folds avec genoux légèrement fléchis.',
        cycling:'Bas du dos : guidon plus haut. Échauffement postural avant sortie. Positions aéro prolongées déconseillées.',
        hyrox:'Bas du dos : farmer carry léger, dos neutre sur sled push. Rowing machine : gainage obligatoire.',
        golf:'Bas du dos : mobilité thoracique en préalable. Swing progressif. Renforcez les abdominaux profonds.',
        triathlon:'Bas du dos : fit vélo professionnel. Étirements lombaires en transition T2.',
        calisthenics:'Bas du dos : front lever à extension contrôlée uniquement. L-sit avec gainage strict.'
      },
      epaule: {
        crossfit:'Épaules : pas de snatch ni de clean & jerk overhead. Scale systématique. Mouvements sous la hauteur des épaules.',
        yoga:'Épaules : inversions déconseillées (handstand, headstand). Chaturanga modifié sur les genoux.',
        hyrox:'Épaules : sled push amplitude réduite. Wall balls à hauteur modérée.',
        padel:'Épaule / Coiffe : pas de smash à pleine puissance. Service avec amplitude réduite. Kinésithérapie si douleur persistante.',
        triathlon:'Épaules : overreach réduit en crawl. Brasse ou dos crawlé si douloureux. Volume natation réduit.',
        calisthenics:'Épaules : pas de handstand ni muscle-up. Remplacez par dips (amplitude limitée) et rows.',
        golf:'Épaule : finition du swing réduite. Compensez par la rotation thoracique.'
      },
      poignet: {
        crossfit:'Poignets : wraps obligatoires. Pas de kipping pull-ups. Cleans remplacés par hex bar deadlifts si douloureux.',
        yoga:'Poignets : planche sur les poings ou les coudes. Blocs sous les paumes pour réduire l\'extension.',
        calisthenics:'Poignets : planche sur les poings. Évitez le L-sit en appui direct. Isométriques progressifs.',
        golf:'Poignets : grip ferme mais non crispé. Antivibration sur le club.'
      },
      coude: {
        padel:'Coude / Épicondylite : pas de coup droit avec spin excessif. Poignée plus épaisse. Strapping. Arrêtez si douleur irradie.',
        golf:'Coude : swing raccourci en backswing. Grip plus léger. Manchon de compression.',
        calisthenics:'Coudes : pas de muscle-ups ni tractions kippées. Renforcement excentrique progressif.'
      },
      hanche: {
        running:'Hanche / Ilio-psoas : étirements hip flexors après séance (2 × 90 sec/côté). Renforcement fessiers.',
        yoga:'Hanches : pigeon pose avec bloc sous la hanche. Amplitude progressive. Surveillez tout pincement à l\'aine.'
      },
      cervicale: {
        crossfit:'Nuque : position overhead vérifiée. Soulévé de terre tête neutre obligatoire. Mobilité cervicale en échauffement.',
        cycling:'Cervicales : guidon plus haut. Pauses mobilité cervicale toutes les 30 min sur les longues sorties.'
      }
    };
    var _szWarns = [];
    Object.keys(_zwm).forEach(function(zone) {
      if (S.medical.indexOf(zone) !== -1 && _zwm[zone][S.sportType]) {
        _szWarns.push('\u26a0 ' + _zwm[zone][S.sportType]);
      }
    });
    if (_szWarns.length > 0) {
      var _szc = h('div', {style:'border-left:3px solid var(--orange,#E86F1E);background:rgba(232,111,30,0.06);padding:12px 16px;margin-bottom:12px'});
      _szc.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange-ink,#7A3B0E);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Adaptations \u2014 ' : 'Adaptations \u2014 ') + sportName));
      _szWarns.forEach(function(w) { _szc.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6;margin-bottom:4px'}, w)); });
      p.appendChild(_szc);
    }
  }
}

function appendWellnessBanner(p) {
  // Dismissed via "Reporter" / "Compris" button — skip until next render cycle resets it
  if (window.S && window.S._wellnessBannerDismissed) { window.S._wellnessBannerDismissed = false; return; }
  // ─── Priorité : score numérique 1-5 si disponible ───
  var score = getWellnessScore();
  if (score !== null) {
    if (score < 2) {
      // ─── KO : Séance déconseillée ───
      var banner = h('div', {style: 'border-left:3px solid #8B2020;background:rgba(139,32,32,0.06);padding:14px 16px;margin-bottom:16px;border-radius:2px', title: 'Score basé sur votre sommeil, état musculaire et énergie du jour. Renseignez votre bilan quotidien pour personnaliser votre séance.'});
      var titleRow = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:6px'});
      titleRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8B2020;font-weight:700'}, (window.isEnglish && window.isEnglish() ? 'Session not recommended today' : 'S\u00e9ance d\u00e9conseill\u00e9e aujourd\'hui')));
      banner.appendChild(titleRow);
      banner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);line-height:1.6;margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'Your fitness level is low. Rest promotes recovery and progress.' : 'Votre \u00e9tat de forme est bas. Le repos favorise la r\u00e9cup\u00e9ration et la progression.')));
      var btnRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap'});
      var postponeBtn = h('button', {
        style: 'padding:8px 14px;background:#8B2020;color:#fff;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer',
        onclick: function() {
          S.sessionPostponed = true;
          banner.innerHTML = '';
          var confirmMsg = h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);line-height:1.6;padding:8px 0'}, (window.isEnglish && window.isEnglish() ? '\u2714 Session postponed. Rest well!' : '\u2714 S\u00e9ance report\u00e9e. Reposez-vous bien !'));
          banner.appendChild(confirmMsg);
          if (window.render) window.render();
        }
      }, (window.isEnglish && window.isEnglish() ? 'Postpone to tomorrow' : 'Reporter au lendemain'));
      var continueBtn = h('button', {
        style: 'padding:8px 14px;background:transparent;color:#8B2020;border:1px solid #8B2020;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer',
        onclick: function() {
          if (S.sessionPostponed) S.sessionPostponed = false;
          banner.style.display = 'none';
          if (window.render) window.render();
        }
      }, (window.isEnglish && window.isEnglish() ? 'Continue anyway' : 'Continuer quand m\u00eame'));
      btnRow.appendChild(postponeBtn);
      btnRow.appendChild(continueBtn);
      banner.appendChild(btnRow);
      p.appendChild(banner);
    } else if (score <= 3) {
      // ─── Fatigué : séance adaptée ───
      var banner2 = h('div', {style: 'border-left:3px solid #B8860B;background:rgba(184,134,11,0.06);padding:14px 16px;margin-bottom:16px;border-radius:2px', title: 'Score basé sur votre sommeil, état musculaire et énergie du jour. Renseignez votre bilan quotidien pour personnaliser votre séance.'});
      banner2.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8860B;font-weight:700;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Adapted session recommended' : 'S\u00e9ance adapt\u00e9e recommand\u00e9e')));
      banner2.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);line-height:1.6;margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'Consider reducing intensity\u00a0: -1 set per exercise, load reduced by 10-15\u00a0%.' : 'Consid\u00e9rez r\u00e9duire l\'intensit\u00e9\u00a0: -1 s\u00e9rie par exercice, charges all\u00e9g\u00e9es de 10-15\u00a0%.')));
      var comprisBtn = h('button', {
        style: 'padding:8px 14px;background:#B8860B;color:#fff;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer',
        onclick: function() { banner2.style.display = 'none'; }
      }, (window.isEnglish && window.isEnglish() ? 'Got it' : 'Compris'));
      banner2.appendChild(comprisBtn);
      p.appendChild(banner2);
    } else if (score > 3.5) {
      // ─── En forme : badge discret ───
      var badge = h('div', {style: 'display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(26,74,26,0.3);background:var(--paper-2,#F4F1EA);padding:6px 12px;border-radius:2px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#3E5C3A)', title: 'Score basé sur votre sommeil, état musculaire et énergie du jour. Renseignez votre bilan quotidien pour personnaliser votre séance.'});
      badge.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? 'You are in great shape today' : 'Vous \u00eates en forme aujourd\'hui')));
      p.appendChild(badge);
    }
    return;
  }

  // ─── Fallback : score composite basé sur les valeurs textuelles (rétrocompatibilité) ───
  var adapt = getWellnessAdaptation();
  // Ne rien afficher si pas de données wellness
  if (!S.todayWellness) return;

  var colorMap = {
    'peak':     { borderColor: 'var(--green,#3E5C3A)',   textColor: 'var(--green,#3E5C3A)',   bg: 'rgba(62,92,58,0.06)' },
    'normal':   { borderColor: 'var(--blue,#1A3A6A)',    textColor: 'var(--blue,#1A3A6A)',    bg: 'var(--bluebg,rgba(26,58,106,.06))' },
    'reduced':  { borderColor: 'var(--orange,#E86F1E)',  textColor: 'var(--orange,#E86F1E)',  bg: 'rgba(232,111,30,0.06)' },
    'recovery': { borderColor: 'var(--error,#7A1F1F)',     textColor: 'var(--error,#7A1F1F)',     bg: 'rgba(122,31,31,0.06)' }
  };
  var cm = colorMap[adapt.level] || colorMap['normal'];

  var isPeak = adapt.level === 'peak';
  var fallbackBanner = h('div', {style:
    'border-left:3px solid ' + cm.borderColor + ';' +
    'padding:' + (isPeak ? '8px 12px' : '10px 14px') + ';' +
    'background:' + cm.bg + ';' +
    'margin-bottom:16px;border-radius:0;' +
    'display:flex;align-items:' + (isPeak ? 'center' : 'flex-start') + ';' +
    'gap:10px;overflow:hidden;max-height:' + (isPeak ? '52px' : '88px')
  });

  // SVG icons per level
  var svgIcons = {
    recovery: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="var(--error,#7A1F1F)" stroke-width="1.5"/><path d="M8 4v5" stroke="var(--error,#7A1F1F)" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".75" fill="var(--error,#7A1F1F)"/></svg>',
    reduced:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C4.69 2 2 4.69 2 8s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6Z" stroke="var(--orange-ink,#7A3B0E)" stroke-width="1.5"/><path d="M5.5 9.5C6 10.5 7 11 8 11s2-.5 2.5-1.5" stroke="var(--orange-ink,#7A3B0E)" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 6.5h.01M10.5 6.5h.01" stroke="var(--orange-ink,#7A3B0E)" stroke-width="1.5" stroke-linecap="round"/></svg>',
    peak:     '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--success,#3E5C3A)" stroke-width="1.4"/><path d="M4 7l2 2 4-4" stroke="var(--success,#3E5C3A)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    normal:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1A3A6A" stroke-width="1.5"/><path d="M8 5v4" stroke="#1A3A6A" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };
  var iconWrap = h('div', {style: 'flex-shrink:0;margin-top:' + (isPeak ? '0' : '1px')});
  iconWrap.innerHTML = _sfcSanitize(svgIcons[adapt.level] || svgIcons.normal);
  fallbackBanner.appendChild(iconWrap);

  if (isPeak) {
    // Compact badge — label only, no button
    fallbackBanner.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--success,#3E5C3A)', title: 'Score basé sur votre sommeil, état musculaire et énergie du jour. Renseignez votre bilan quotidien pour personnaliser votre séance.'}, (window.isEnglish && window.isEnglish() ? 'Peak form — push on heavy weights' : 'Forme optimale — poussez sur les charges')));
  } else {
    var textWrap = h('div', {style: 'flex:1;min-width:0'});
    textWrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:' + cm.textColor + ';margin-bottom:3px;font-weight:700'}, adapt.label));
    textWrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;font-style:italic;color:var(--black,#1A1A18);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical'}, adapt.advice));
    var actionBtn = h('button', {
      style: 'margin-top:5px;background:none;border:none;border-bottom:1px solid ' + cm.borderColor + ';padding:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:' + cm.textColor + ';cursor:pointer;line-height:1.6',
      onclick: function() {
        if (adapt.level === 'recovery') { S._sessionPostponed = true; }
        S._wellnessBannerDismissed = true;
        window.render();
      }
    }, adapt.level === 'recovery' ? (window.isEnglish && window.isEnglish() ? 'Postpone' : 'Reporter') : (window.isEnglish && window.isEnglish() ? 'Got it' : 'Compris'));
    textWrap.appendChild(actionBtn);
    fallbackBanner.appendChild(textWrap);
  }

  p.appendChild(fallbackBanner);

  // Message de soutien selon le niveau de forme
  if (window.MOTIVATION) {
    var motivLevel = adapt.level || 'normal';
    var motivText = window.MOTIVATION.getWellnessMessage(motivLevel);
    var motivEl = document.createElement('p');
    motivEl.style.cssText = 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);margin:0 0 20px;line-height:1.6;';
    motivEl.textContent = motivText;
    p.appendChild(motivEl);
  }
}

function applyDeloadScaling(wod) {
 var out = { name: wod.name, type: wod.type, notes: wod.notes };
 out.movements = (wod.movements || []).map(function(m) {
  var copy = {};
  for (var k in m) copy[k] = m[k];
  if (typeof m.reps === 'number') copy.reps = Math.max(1, Math.round(m.reps * 0.6));
  return copy;
 });
 var t = wod.type || '';
 t = t.replace(/(\bAMRAP\s+)(\d+)/, function(_, pre, n) { return pre + Math.max(1, Math.round(parseInt(n, 10) * 0.6)); });
 t = t.replace(/(\bEMOM\s+)(\d+)/, function(_, pre, n) { return pre + Math.max(1, Math.round(parseInt(n, 10) * 0.6)); });
 t = t.replace(/^(\d+)(\s+Rounds?\s+For Time)/i, function(_, n, suf) { return Math.max(1, Math.round(parseInt(n, 10) * 0.6)) + suf; });
 t = t.replace(/\((\d+)\s+(rounds?\s+x)/i, function(_, n, suf) { return '(' + Math.max(1, Math.round(parseInt(n, 10) * 0.6)) + ' ' + suf; });
 t = t.replace(/\(cap\s+(\d+)min\)/, function(_, n) { return '(cap ' + Math.max(1, Math.round(parseInt(n, 10) * 0.6)) + 'min)'; });
 out.type = t;
 return out;
}

// ─── INTENSITY ENGINE MODULES ───
// CF_INTENSITY_FACTORS, RUN_ZONE_FACTORS, CYCLING_ZONE_FACTORS_* and all compute* functions
// are defined in sport-crossfit.js, sport-running.js, sport-cycling.js (loaded before this file).

// ─── STEP 6 (CrossFit): PROGRAMME CF ───
function renderCrossfitProgram(p) {
 // Guard: ensure cfProgress is always an object (safe for null/undefined from storage)
 if (!S.cfProgress || typeof S.cfProgress !== 'object') S.cfProgress = {};
 // Guard: cfCurrentDay bounds
 if (!S.cfCurrentDay || S.cfCurrentDay < 1) S.cfCurrentDay = 1;
 if (S.cfCurrentDay > 100) S.cfCurrentDay = 100;
 // Guard: ELITE state objects — defensive initialization
 S.crossfitBenchmarks = S.crossfitBenchmarks || {};
 S.crossfitCompGoal = S.crossfitCompGoal || 'loisir';
 if (S.cfDeloadRecommended === undefined) S.cfDeloadRecommended = false;

 // Load saved 1RM data if not already loaded
 if (!S.crossfit1RM || Object.keys(S.crossfit1RM).length === 0) {
 S.crossfit1RM = S.crossfit1RM || {};
 var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var saved1rm = localStorage.getItem('mtd_cf_1rm_' + userId);
 if (saved1rm) { try { S.crossfit1RM = JSON.parse(saved1rm); } catch(e) {} }
 }

 // ─── SPORT MIX: ajuster les jours CF si un 2ème sport est configuré ───
 var _mixSec = (S.sportMixEnabled && S.sportMixSecondary && S.sportMixSecondary.days >= 1) ? S.sportMixSecondary : null;
 var _mixSecDays = _mixSec ? Math.max(1, Math.min(_mixSec.days, (S.sportDays || 4) - 1)) : 0;
 var daysPerWeek = Math.max(3, (S.sportDays || 4) - _mixSecDays); // CF days (min 3)
 var template = CF_DAY_TEMPLATES[daysPerWeek] || CF_DAY_TEMPLATES[4];
 S.crossfitWeek = S.crossfitWeek || 1;
 var weekProgram = generateCrossfitWeek(S.crossfitWeek, daysPerWeek);
 // Bridge nutrition — une fois par semaine (guard anti-double-render)
 if (S._cfLastNotifiedWeek !== S.crossfitWeek) {
  S._cfLastNotifiedWeek = S.crossfitWeek;
  // ─── DAILY INTENSITY ENGINE: compute before bridge call ───
  var _cfDayWod     = weekProgram[S.selectedCrossfitDay || 0];
  var _cfInnerWod   = _cfDayWod && _cfDayWod.wod ? _cfDayWod.wod.wod : null;
  var _cfIntensity  = computeSessionIntensity(_cfInnerWod);
  var _cfDurBase    = { scaled: 60, inter: 65, rx: 75, rx_plus: 90 };
  var _cfTypeStr    = _cfInnerWod ? (_cfInnerWod.type || '').toLowerCase() : '';
  var _cfDurMatch   = _cfTypeStr.match(/amrap\s+(\d+)|emom\s+(\d+)|cap\s+(\d+)/);
  var _cfDurMins    = _cfDurMatch
   ? parseInt(_cfDurMatch[1] || _cfDurMatch[2] || _cfDurMatch[3], 10)
   : (_cfDurBase[S.crossfitLevel] || 75);
  var _cfFinalIntensity  = computeAdvancedIntensity(_cfInnerWod, _cfIntensity);
  var _cfVolFactor       = computeVolumeFactor(_cfInnerWod);
  // ─── REST FACTOR ───
  var _cfMovs       = (_cfInnerWod && Array.isArray(_cfInnerWod.movements)) ? _cfInnerWod.movements : [];
  var _cfRestFactor = computeCrossfitRestFactor(_cfInnerWod, _cfTypeStr, _cfMovs);
  S.crossfitIntensity    = _cfFinalIntensity;
  S.crossfitTrainingLoad = Math.round(_cfDurMins * CF_INTENSITY_FACTORS[_cfFinalIntensity] * _cfVolFactor * _cfRestFactor);
  var _cfLoad = S.crossfitTrainingLoad >= 90 ? 'heavy'
              : S.crossfitTrainingLoad >= 60 ? 'moderate' : 'light';
  _sfcAggregateLoad('crossfit', _cfLoad);
  _sfcNotifySport('crossfit', S.crossfitLevel);
  _sfcAggregateLoad('crossfit', _cfLoad);
 }

 // Guard: if no WODs available, show a message instead of a blank page
 if (!weekProgram || !weekProgram.length) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
 p.appendChild(h('h1', {html: 'Cross Training<br><em>Programme</em>'}));
 p.appendChild(h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;margin:24px 0;background:rgba(232,111,30,0.06)'}, [
 h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:4px'}, (window.isEnglish && window.isEnglish()) ? 'Loading WOD database...' : 'Base de WODs en cours de chargement...'),
 h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, (window.isEnglish && window.isEnglish()) ? 'Reload the page to display the program.' : 'Rechargez la page pour afficher le programme.')
 ]));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 5; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 5; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + ((window.isEnglish && window.isEnglish()) ? 'Back' : 'Retour')}));
 return;
 }

 // Clamp selectedCrossfitDay — guard for mix mode (total tabs = CF + muscu)
 var _totalTabCount = template.length + _mixSecDays;
 if (S.selectedCrossfitDay === null || S.selectedCrossfitDay === undefined || S.selectedCrossfitDay < 0 || S.selectedCrossfitDay >= _totalTabCount) S.selectedCrossfitDay = 0;

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
 p.appendChild(h('h1', {html: 'Cross Training<br><em>Programme</em>'}));
 var levelObj = (window.CROSSFIT_LEVELS || []).find(function(l) { return l.id === S.crossfitLevel; });
 // 2026-04 P4 : sous-titre dynamique selon type secondaire (pas hardcoded Musculation)
 var _SECLAB_SUB = { musculation: 'Musculation', crossfit: 'Cross Training', running: 'Running', yoga: 'Yoga', calisthenics: 'Calisthenics' };
 var _subtitleMix = _mixSec ? (' + ' + _mixSecDays + ' j ' + (_SECLAB_SUB[_mixSec.type] || 'Sport')) : '';
 p.appendChild(h('p', {'class': 'subtitle'}, daysPerWeek + ' ' + ((window.isEnglish && window.isEnglish()) ? 'd CrossFit' : 'j CrossFit') + _subtitleMix + ' \u2014 ' + (levelObj ? levelObj.icon + ' ' + levelObj.name : '')));

 appendSportMedicalBanner(p, 'Cross Training');
 appendWellnessBanner(p);

 // ─── AVERTISSEMENT GROSSESSE (CrossFit) ───
 if (S.pregnant && window.isFemale(S)) {
   var _pregWarn = window.getPregnancySportWarning ? window.getPregnancySportWarning() : null;
   var _pwCard = h('div', {style: 'border-left:3px solid #FF6B6B;background:#FFF3CD;padding:12px 16px;margin-bottom:16px'});
   _pwCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#C00;margin-bottom:6px'}, (window.isEnglish && window.isEnglish()) ? 'Pregnancy \u2014 Mandatory adaptations' : 'Grossesse \u2014 Adaptations obligatoires'));
   _pwCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'}, _pregWarn ? _pregWarn.warning : ((window.isEnglish && window.isEnglish()) ? 'Avoid heavy Olympic lifts, Valsalva, jumps and supine position. Prefer Scaled versions. Consult your doctor.' : '\u00c9vitez les mouvements olympiques lourds, Valsalva, sauts et d\u00e9cubitus dorsal. Privil\u00e9giez les versions Scaled. Consultez votre m\u00e9decin.')));
   p.appendChild(_pwCard);
 }

 // ─── BIENVENUE SCALED / DÉBUTANT ───
 // Afficher un message d'accueil et un CTA 1RM uniquement pour les nouveaux utilisateurs scaled sans 1RM définis
 if (S.crossfitLevel === 'scaled') {
 var has1RM = S.crossfit1RM && Object.keys(S.crossfit1RM).some(function(k) { return S.crossfit1RM[k]; });
 var welcomeCard = h('div', {style: 'border-left:4px solid #E07B00;background:rgba(224,123,0,0.07);padding:14px 16px;margin-bottom:16px'});
 welcomeCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:6px'}, (window.isEnglish && window.isEnglish()) ? 'Welcome to the Scaled program!' : 'Bienvenue dans le programme Scaled !'));
 welcomeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish()) ? 'All WODs are adapted to your level: reduced loads, simplified movements (no muscle-ups, TTB replaced by Knee Raises, etc.). Progress at your own pace — Week 10+ WODs will be significantly more intense.' : 'Tous les WODs sont adaptés à votre niveau : charges allégées, mouvements simplifiés (pas de muscle-up, TTB remplacés par Knee Raises, etc.). Progressez à votre rythme — les WODs de la semaine 10+ seront nettement plus intenses.'));
 if (!has1RM) {
 welcomeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E07B00;margin-bottom:8px'}, (window.isEnglish && window.isEnglish()) ? 'For precise workloads, enter your 1RM (back squat, clean, deadlift…). Without 1RM, loads are based on international standards for your level.' : 'Pour des charges de travail précises, renseignez vos 1RM (back squat, clean, deadlift…). Sans 1RM, les charges sont basées sur les standards internationaux pour votre niveau.'));
 welcomeCard.appendChild(h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 14px;margin:0;font-size:11px', onclick: function() { S.sStep = 5; window.render(); }}, (window.isEnglish && window.isEnglish()) ? 'Enter my 1RM \u2192' : 'Entrer mes 1RM \u2192'));
 }
 p.appendChild(welcomeCard);
 }

 // Objectives banner
 var goalNames = (S.sportGoals || []).map(function(gid){
 var g2 = (window.SPORT_GOALS || []).find(function(x){ return x.id === gid; });
 return g2 ? g2.icon + ' ' + g2.name : '';
 }).join(' \u00B7 ');
 if (goalNames) {
 var goalBanner = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 goalBanner.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:6px'}, ((window.isEnglish && window.isEnglish()) ? 'Goals: ' : 'Objectifs : ') + goalNames));
 var goalNotes = [];
 if (S.sportGoals.indexOf('shred') !== -1) goalNotes.push(window.isEnglish && window.isEnglish() ? 'High intensity, short rest' : 'Intensité haute, repos courts');
 if (S.sportGoals.indexOf('muscle') !== -1) goalNotes.push(window.isEnglish && window.isEnglish() ? 'Heavy loads on weightlifting' : 'Charges lourdes sur l\'haltéro');
 if (S.sportGoals.indexOf('endurance') !== -1) goalNotes.push(window.isEnglish && window.isEnglish() ? 'Cardio and conditioning' : 'Cardio et conditioning');
 if (S.sportGoals.indexOf('weightloss') !== -1) goalNotes.push(window.isEnglish && window.isEnglish() ? 'High volume, metabolic circuits' : 'Volume élevé, circuits métaboliques');
 if (goalNotes.length > 0) {
 goalBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'The program is adapted accordingly — ' : 'Le programme est adapté en conséquence — ') + goalNotes.join(' · ')));
 }
 p.appendChild(goalBanner);
 }

 // ─── MEDICAL RESTRICTIONS BANNER (CrossFit) ───
 // Afficher les restrictions médicales pertinentes pour les WODs CrossFit
 // Les WODs contiennent des mouvements à risque (box jumps, sauts, charges lourdes)
 // qui doivent être signalés si l'utilisateur a des conditions médicales
 if (S.muscuMedical && S.muscuMedical.done) {
 var cfMedRestrictions = [];
 var cfMed = S.muscuMedical;
 if (cfMed.knees || cfMed.acl) cfMedRestrictions.push(window.isEnglish && window.isEnglish() ? '⚠ Knees / ACL: replace Box Jumps with Box Step-ups, avoid Jump Squats and Pistols. Thrusters and Wall Balls allowed with controlled technique.' : '⚠ Genoux / LCA : remplacez les Box Jumps par des Box Step-ups, évitez les Jump Squats et Pistols. Thrusters et Wall Balls autorisés avec technique contrôlée.');
 if (cfMed.kneeOsteoarthritis) cfMedRestrictions.push(window.isEnglish && window.isEnglish() ? '⚠ Knee osteoarthritis: avoid all jumps and deep squats under load. Prefer bike (Assault Bike) and rower (Row) as cardio alternatives (OARSI 2014).' : '⚠ Gonarthrose : évitez tous les sauts et flexions profondes sous charge. Privilégiez le velo (Assault Bike) et le rameur (Row) comme alternatives cardio (OARSI 2014).');
 if (cfMed.meniscus) cfMedRestrictions.push(window.isEnglish && window.isEnglish() ? '⚠ Meniscus: no Box Jumps or Pistols. Squats limited to 90° flexion maximum under load.' : '⚠ Ménisque : pas de Box Jumps ni Pistols. Squats limités à 90° de flexion maximum sous charge.');
 if (cfMed.lowerBack || cfMed.herniaDisc) cfMedRestrictions.push(window.isEnglish && window.isEnglish() ? '⚠ Back / Herniated disc: reduce load on Deadlifts and Back Squats (≤70 % 1RM). Avoid Good Morning and Jefferson Curl.' : '⚠ Dos / Hernie discale : réduisez la charge sur Deadlifts et Back Squats (≤70 % 1RM). Évitez Good Morning et Jefferson Curl.');
 if (cfMed.shoulders || cfMed.rotatorCuff) cfMedRestrictions.push(window.isEnglish && window.isEnglish() ? '⚠ Shoulders: replace HSPU with Pike Push-ups. Lighter Overhead Press. Avoid painful overhead movements (Ludewig & Cook, Phys Ther 2000).' : '⚠ Épaules : remplacez HSPU par Pike Push-ups. Overhead Press allégé. Évitez les mouvements overhead douloureux (Ludewig & Cook, Phys Ther 2000).');
 if (cfMed.hypertension) cfMedRestrictions.push((function(){ var _el = document.createElement('span'); _el.appendChild(document.createTextNode(window.isEnglish && window.isEnglish() ? '⚠ Hypertension: intensity capped at ' : '⚠ HTA : intensité plafonnée ')); _el.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _el.appendChild(document.createTextNode(window.isEnglish && window.isEnglish() ? ' 7/10 maximum. Avoid Valsalva with heavy loads (AHA/ACSM 2007).' : ' 7/10 maximum. Évitez Valsalva lors des charges lourdes (AHA/ACSM 2007).')); return _el; })());
 if (cfMed.osteoporosis) cfMedRestrictions.push(window.isEnglish && window.isEnglish() ? '⚠ Osteoporosis: no Box Jumps or jumps. Loads ≤70 % 1RM only. Avoid repeated spinal flexion (Sinaki, Spine 2002).' : '⚠ Ostéoporose : pas de Box Jumps ni sauts. Charges ≤70 % 1RM uniquement. Évitez flexions vertébrales répétées (Sinaki, Spine 2002).');
 if (cfMedRestrictions.length > 0) {
 var cfMedBanner = h('div', {style: 'border-left:3px solid #E07B00;background:rgba(224,123,0,0.07);padding:12px 16px;margin-bottom:16px'});
 cfMedBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#E07B00;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? '⚠ Medical restrictions — CrossFit' : '⚠ Restrictions médicales — CrossFit')));
 cfMedRestrictions.forEach(function(r) {
 cfMedBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--fg2,#555);margin-bottom:4px'}, r));
 });
 p.appendChild(cfMedBanner);
 }
 }

 // ─── STRENGTH GRADE ───
 if (window.renderStrengthGrade) renderStrengthGrade(p);

 // ─── ESTIMATION CALORIQUE CROSSFIT ───
 (function() {
  var cfLevel = S.crossfitLevel || 'rx';
  var SESSION_DUR_CF = { scaled: 60, inter: 65, rx: 75, rx_plus: 90 };
  var cfDur = SESSION_DUR_CF[cfLevel] || 75;
  var cfKcal = estimateKcal('crossfit', cfLevel, cfDur);
  p.appendChild(buildKcalCard(cfKcal, cfDur));
 }());

 // ─── WEEK NAVIGATION ───
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Previous week' : 'Semaine précédente'), onclick: function() {
 if (S.crossfitWeek > 1) { S.crossfitWeek--; S.selectedCrossfitDay = 0; window.render(); }
 }}, '\u2190'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.crossfitWeek));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Next week' : 'Semaine suivante'), onclick: function() {
 var maxWeek = Math.ceil((window.CF_WODS || []).length / Math.max(1, daysPerWeek));
 if (S.crossfitWeek < maxWeek) { S.crossfitWeek++; S.selectedCrossfitDay = 0; window.render(); }
 }}, '\u2192'));
 p.appendChild(weekNav);

 // ─── BOUTON VUE 100 JOURS ───
 var calBtn = h('button', {
 'class': 'btn-secondary',
 style: 'width:100%;margin:0 0 16px;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:8px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13px',
 onclick: function() { S.cfCalendarOpen = true; window.render(); }
 }, [
 h('span', {}, (window.isEnglish && window.isEnglish() ? '100-day view' : 'Vue 100 jours'))
 ]);
 p.appendChild(calBtn);

 // ─── CROSSFIT DELOAD BANNER (semaines 4, 8, 12, 16) ───
 // Protocole Games Athletes : 3 semaines d'intensité + 1 semaine de décharge.
 // Volume réduit de 40-50%, intensité maintenue à 70% max. Récupération CNS + articulaire.
 var cfWeekNum = S.crossfitWeek || 1;
 var isCFDeload = (cfWeekNum % 4 === 0);
 if (isCFDeload) {
 var cfDeloadBanner = h('div', {style: 'background:var(--ivory2,#F4F4F0);border-left:4px solid #0A0A09;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#4A235A'});
 cfDeloadBanner.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + cfWeekNum + (window.isEnglish && window.isEnglish() ? ' — MANDATORY DELOAD (CrossFit 4-1 cycle)' : ' — DÉCHARGE OBLIGATOIRE (CrossFit cycle 4-1)')));
 cfDeloadBanner.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? 'Reduce volume by 40-50\u00a0% (e.g. 3 sets instead of 5). Intensity \u226470\u00a0% of max. Keep the same movements \u2014 CNS and joint recovery enables PRs in the following weeks. No PR or max testing this week.' : 'R\u00e9duisez le volume de 40-50\u00a0% (ex. 3 s\u00e9ries au lieu de 5). Intensit\u00e9 \u226470\u00a0% du max. Gardez les m\u00eames mouvements \u2014 c\'est la r\u00e9cup\u00e9ration CNS et articulaire qui permet les PR des semaines suivantes. Pas de PR ni de test de max cette semaine.')));
 p.appendChild(cfDeloadBanner);
 }


 // ─── PROGRESS TRACKER ───
 (function() {
  var cfWkN = S.crossfitWeek || 1;
  var totalDays = 100;
  var doneDays = 0;
  if (S.cfProgress) { for (var dkk in S.cfProgress) { if (S.cfProgress[dkk] && S.cfProgress[dkk].done) doneDays++; } }
  var pctDone = Math.min(100, Math.round(doneDays / totalDays * 100));
  var nextTestWeek = Math.ceil(Math.max(cfWkN, 1) / 5) * 5;
  var daysToTest = Math.max(0, (nextTestWeek - cfWkN) * (S.sportDays || 4));

  var tracker = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;margin-bottom:12px;background:var(--ivory2)'});
  tracker.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'PROGRAM PROGRESS' : 'PROGRESSION PROGRAMME')));
  var trackerRow = h('div', {style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px'});
  trackerRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px'}, doneDays + ' / ' + totalDays + ' ' + (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
  trackerRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);padding-top:2px'}, pctDone + (window.isEnglish && window.isEnglish() ? '% of program' : '% du programme')));
  if (nextTestWeek <= 20 && daysToTest > 0) {
   trackerRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--blue,#1A3A6A);padding-top:2px'}, (window.isEnglish && window.isEnglish() ? '1RM Test W' + nextTestWeek + ' in ~' + daysToTest + ' sessions' : 'Test 1RM S' + nextTestWeek + ' dans ~' + daysToTest + ' seances')));
  }
  tracker.appendChild(trackerRow);
  var tBar = h('div', {style: 'background:#E5E4DE;height:4px;border-radius:2px;overflow:hidden'});
  tBar.appendChild(h('div', {style: 'background:var(--ink-900,#0A0A09);height:100%;width:' + pctDone + '%;transition:width 0.4s'}));
  tracker.appendChild(tBar);

  // Benchmark de la semaine
  var bmarkWeek = window.getCFBenchmarkForWeek && window.getCFBenchmarkForWeek(cfWkN);
  if (bmarkWeek) {
   var bmBanner = h('div', {style: 'margin-top:10px;padding:8px 12px;background:rgba(122,31,31,0.06);border-left:2px solid var(--error,#7A1F1F)'});
   bmBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--error,#7A1F1F);margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'OFFICIAL BENCHMARK — WEEK ' + cfWkN : 'BENCHMARK OFFICIEL — SEMAINE ' + cfWkN)));
   bmBanner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:4px'}, bmarkWeek.name));
   if (bmarkWeek.score_targets) {
    var lvlKey2 = S.crossfitLevel === 'rx_plus' ? 'elite' : (S.crossfitLevel || 'rx');
    var target2 = bmarkWeek.score_targets[lvlKey2] || bmarkWeek.score_targets.rx;
    if (target2) bmBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--error,#7A1F1F)'}, (window.isEnglish && window.isEnglish() ? 'Your target: ' : 'Votre cible : ') + target2));
    var tParts = [];
    if (bmarkWeek.score_targets.scaled) tParts.push('Scaled: ' + bmarkWeek.score_targets.scaled);
    if (bmarkWeek.score_targets.inter) tParts.push('Inter: ' + bmarkWeek.score_targets.inter);
    if (bmarkWeek.score_targets.rx) tParts.push('RX: ' + bmarkWeek.score_targets.rx);
    if (bmarkWeek.score_targets.elite) tParts.push('Elite: ' + bmarkWeek.score_targets.elite);
    if (tParts.length) bmBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:3px'}, tParts.join(' | ')));
   }
   S.crossfitBenchmarks = S.crossfitBenchmarks || {};
   var prKey = bmarkWeek.id ? bmarkWeek.id.toLowerCase() + '_time' : null;
   if (prKey && S.crossfitBenchmarks[prKey]) {
    bmBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--green,#3E5C3A);margin-top:4px'}, (window.isEnglish && window.isEnglish() ? 'Your PR: ' : 'Votre PR : ') + S.crossfitBenchmarks[prKey]));
   }
   tracker.appendChild(bmBanner);
  }

  // 1RM test week banner
  if (window.isCF1RMTestWeek && window.isCF1RMTestWeek(cfWkN)) {
   var testBanner = h('div', {style: 'margin-top:10px;padding:10px 14px;background:rgba(26,58,106,0.07);border-left:2px solid var(--blue,#1A3A6A)'});
   testBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--blue,#1A3A6A);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? '1RM TEST WEEK — W' + cfWkN : 'SEMAINE TEST 1RM — S' + cfWkN)));
   testBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Full test protocol — aim for a PR on each lift:' : 'Protocole de test complet — objectif PR sur chaque levee :')));
   if (window.CF_1RM_TEST_PROTOCOL && window.CF_1RM_TEST_PROTOCOL.lifts) {
    window.CF_1RM_TEST_PROTOCOL.lifts.forEach(function(lift) {
     var lRow = h('div', {style: 'padding:4px 0;border-bottom:1px solid var(--border)'});
     lRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px'}, lift.name));
     lRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey)'}, lift.warmup_protocol));
     lRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey);font-style:italic'}, lift.notes));
     testBanner.appendChild(lRow);
    });
   }
   tracker.appendChild(testBanner);
  }

  // Open prep week banner
  var openPrepData = window.getCFOpenPrepWeek && window.getCFOpenPrepWeek(cfWkN);
  if (openPrepData) {
   var openBanner = h('div', {style: 'margin-top:10px;padding:8px 12px;background:rgba(139,47,201,0.06);border-left:2px solid #8B2FC9'});
   openBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8B2FC9;margin-bottom:4px'}, 'CROSSFIT OPEN PREP'));
   openBanner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:4px'}, openPrepData.name));
   openBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, openPrepData.focus));
   tracker.appendChild(openBanner);
  }

  p.appendChild(tracker);
 })();

 // ─── HALTERO CYCLE INFO ───
 if (window.HALTERO_CYCLES) {
 var cycleWeek = (((S.crossfitWeek || 1) - 1) % 6) + 1;
 S.crossfitCycleWeek = cycleWeek;
 HALTERO_CYCLES.renderCycleInfo(p, cycleWeek, S.sex, S.crossfitLevel);

 var haltWeekNav = h('div', {style: 'display:flex;align-items:center;gap:8px;margin:8px 0 16px;flex-wrap:wrap'});
 haltWeekNav.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-right:4px'}, (window.isEnglish && window.isEnglish() ? 'Weightlifting Cycle' : 'Cycle Haltéro')));
 haltWeekNav.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;min-width:60px;text-align:center'}, cycleWeek + ' / 6'));
 p.appendChild(haltWeekNav);
 }

 // ─── DAY TABS (CF + Muscu mix si configuré) ───
 var tabs = h('div', {'class': 'day-tabs'});
 template.forEach(function(day, i) {
  tabs.appendChild(h('button', {
   'class': 'day-tab' + (S.selectedCrossfitDay === i ? ' active' : ''),
   onclick: function() { S.selectedCrossfitDay = i; window.render(); }
  }, (window.isEnglish && window.isEnglish() ? day.label.en : day.label.fr)));
 });
 // Onglets supplémentaires pour les jours de musculation (sport mix)
 if (_mixSec && _mixSecDays > 0) {
  // 2026-04 P4 : label tab générique selon type secondaire
  var _SECLAB_SHORT = { musculation: 'Muscu', crossfit: 'Cross', running: 'Run', yoga: 'Yoga', calisthenics: 'Calli' };
  var _secShortLabel = _SECLAB_SHORT[_mixSec.type] || 'Sec';
  for (var _mi = 0; _mi < _mixSecDays; _mi++) {
   (function(_midx) {
    var _tabIdx = template.length + _midx;
    tabs.appendChild(h('button', {
     'class': 'day-tab' + (S.selectedCrossfitDay === _tabIdx ? ' active' : ''),
     style: 'color:var(--ink-900,#0A0A09);' + (S.selectedCrossfitDay === _tabIdx ? 'border-color:var(--ink-900,#0A0A09);' : ''),
     onclick: function() { S.selectedCrossfitDay = _tabIdx; window.render(); }
    }, _secShortLabel + ' ' + (_midx + 1)));
   })(_mi);
  }
 }
 p.appendChild(tabs);

 // ─── CONTENU JOUR SECONDAIRE (muscu, running, yoga, crossfit...) ───
 // 2026-04 P4 : généralisation via dispatcher getMixSessionsForType (fallback muscu legacy)
 if (_mixSec && S.selectedCrossfitDay >= template.length) {
  var _mMixIdx = S.selectedCrossfitDay - template.length;
  var _mMixSessions = (typeof window.getMixSessionsForType === 'function')
    ? window.getMixSessionsForType(_mixSec.type, _mixSecDays)
    : getMuscuMixSessionsForDays(_mixSecDays);
  var _mMixSession = _mMixSessions[Math.min(_mMixIdx, _mMixSessions.length - 1)];
  if (_mMixSession) {
   var _SECLAB_FULL = { musculation: 'Musculation', crossfit: 'Cross Training', running: 'Running', yoga: 'Yoga', calisthenics: 'Calisthenics' };
   var _secFullLabel = _SECLAB_FULL[_mixSec.type] || 'Sport secondaire';
   p.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:24px;text-align:center;margin:16px 0 4px' }, _secFullLabel + ' \u2014 ' + _mMixSession.name));
   p.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-900,#0A0A09);text-align:center;margin-bottom:20px' }, _mMixSession.focus));
   var _mCard = h('div', { 'class': 'exercise-card', style: 'border-left:3px solid var(--ink-900,#0A0A09)' });
   _mCard.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-900,#0A0A09);margin-bottom:12px' }, (window.isEnglish && window.isEnglish() ? 'SESSION ' : 'SÉANCE ') + _secFullLabel.toUpperCase()));
   _mMixSession.exercises.forEach(function(ex, _ei) {
    var _exRow = h('div', { style: 'padding:10px 0;border-bottom:1px solid var(--border,#E8E6DF)' });
    _exRow.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:3px' }, (_ei + 1) + '. ' + ex.name));
    _exRow.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black);margin-bottom:2px' }, ex.sets + (window.isEnglish && window.isEnglish() ? ' — Rest : ' : ' — Repos : ') + ex.rest));
    _exRow.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);font-style:italic' }, ex.note));
    _mCard.appendChild(_exRow);
   });
   p.appendChild(_mCard);
   // Bouton retour
   p.appendChild(h('div', { style: 'height:16px' }));
   p.appendChild(h('button', { 'class': 'btn-back', onclick: function() { S.sStep = 5; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Edit configuration' : 'Modifier la configuration') }));
  }
  return; // Ne pas afficher le contenu CF pour ce jour
 }

 // Current day data (CF)
 var currentDay = weekProgram[S.selectedCrossfitDay];
 if (!currentDay) return;
 var wod = currentDay.wod;
 if (!wod) { p.appendChild(h('div', {style:'padding:16px;color:var(--grey);font-size:13px'}, (window.isEnglish && window.isEnglish() ? 'Session unavailable. Reload the page.' : 'Séance non disponible. Rechargez la page.'))); p.appendChild(h('button', {'class':'btn-back', onclick: function(){ S.sStep = 5; window.render(); }}, (window.isEnglish && window.isEnglish() ? '← Edit level' : '← Modifier le niveau'))); return; }

 // Day header
 p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:24px;text-align:center;margin:16px 0 4px'}, (window.isEnglish && window.isEnglish() ? currentDay.dayLabel.en : currentDay.dayLabel.fr) + ' \u2014 ' + wod.name));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);text-align:center;margin-bottom:4px'}, currentDay.focus));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);text-align:center;margin-bottom:20px'}, (window.isEnglish && window.isEnglish() ? 'Week ' + S.crossfitWeek + ' — Day ' + currentDay.dayNumber + ' / ' + daysPerWeek : 'Semaine ' + S.crossfitWeek + ' — Jour ' + currentDay.dayNumber + ' / ' + daysPerWeek)));

 // ─── HALTÉRO or GYM SKILLS SECTION (depending on day template) ───
 if (currentDay.hasHaltero) {
 // Show haltero section
 var haltCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A3A6A'});
 haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A3A6A;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'WEIGHTLIFTING' : 'HALTÉRO')));
 var _halt = wod.haltero || {};
 haltCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, _halt.name || ''));
 haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:4px'}, _halt.desc || ''));
 haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:6px'}, _halt.scheme || ''));
 if (_halt.weights) {
 var weightStr = getCFWeight(_halt.weights);
 if (weightStr) {
 haltCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:#1A3A6A;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? 'Load: ' : 'Charge : ') + weightStr));
 }
 }
 var haltVideoQ = encodeURIComponent((_halt.name || '') + ' crossfit technique');
 haltCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + haltVideoQ, target: '_blank', rel: 'noopener'}, (window.isEnglish && window.isEnglish() ? '▶ Watch technique' : '▶ Voir la technique')));
 p.appendChild(haltCard);
 } else {
 // Show gym skills section first for non-haltero days
 var gymSkillCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid var(--ink-900,#0A0A09)'});
 gymSkillCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--success,#3E5C3A);margin-bottom:6px'}, 'GYMNASTIQUE'));
 var _gym = wod.gym || {};
 gymSkillCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:8px'}, (_gym.name || '')));
 var drillListTop = h('div', {});
 (_gym.drills || []).forEach(function(drill, idx) {
 drillListTop.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);padding:3px 0'}, (idx + 1) + '. ' + drill));
 });
 gymSkillCard.appendChild(drillListTop);
 var gymVideoQTop = encodeURIComponent((_gym.name || '').replace('Skill: ', '') + ' crossfit tutorial');
 gymSkillCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + gymVideoQTop, target: '_blank', rel: 'noopener', style: 'margin-top:8px'}, (window.isEnglish && window.isEnglish() ? '▶ Watch technique' : '▶ Voir la technique')));
 p.appendChild(gymSkillCard);
 }

 // ─── WOD SAFETY CHECK (combinaisons dangereuses — flag mouvements olympiques sous fatigue) ───
 var _wodMovs = (wod.wod && wod.wod.movements) ? wod.wod.movements.map(function(m){ return (m.name || '').toLowerCase(); }) : [];
 var _wodType = (wod.wod && wod.wod.type) ? wod.wod.type.toLowerCase() : '';
 var _hasOlyLift = _wodMovs.some(function(n){ return n.indexOf('snatch') !== -1 || n.indexOf('clean') !== -1 || n.indexOf('jerk') !== -1; });
 var _hasFatiguePre = _wodMovs.some(function(n){ return n.indexOf('assault') !== -1 || n.indexOf('cal') !== -1 || n.indexOf('row') !== -1 || n.indexOf('rope climb') !== -1 || n.indexOf('burpee') !== -1; });
 var _isTimePressure = _wodType.indexOf('amrap') !== -1 || _wodType.indexOf('for time') !== -1;
 if (_hasOlyLift && _hasFatiguePre && _isTimePressure) {
   var safetyWarn = h('div', {style: 'border-left:3px solid #FF6B6B;background:#FFF3CD;padding:10px 14px;margin-bottom:10px'});
   safetyWarn.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;color:#C00;margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Warning — Olympic movement under fatigue' : 'Attention — Mouvement olympique sous fatigue')));
   safetyWarn.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E)'}, (window.isEnglish && window.isEnglish() ? 'This WOD combines an Olympic movement with fatiguing exercises. Prioritize technique: put the bar down if your position breaks. Reduce load by 10-15% if needed.' : 'Ce WOD combine un mouvement olympique avec des exercices fatigants. Priorisez la technique : posez la barre si la position se dégrade. Réduisez la charge de 10-15% si nécessaire.')));
   p.appendChild(safetyWarn);
 }

 // ─── WOD SECTION (always shown) ───
 var wodCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid var(--error,#7A1F1F)'});
 wodCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--error,#7A1F1F);margin-bottom:6px'}, 'WOD'));
 var _wod = wod.wod || {};
 if (isCFDeload) _wod = applyDeloadScaling(_wod);
 wodCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, _wod.name || ''));
 wodCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--error,#7A1F1F);margin-bottom:10px'}, _wod.type || ''));

 var movList = h('div', {style: 'margin-bottom:10px'});
 var _cfMedFiltered = 0;
 // Pre-compute S.medical list once for movement filtering
 var _cfSMedList = Array.isArray(S.medical) ? S.medical.map(function(m){ return String(m).toLowerCase(); }) : [];
 (_wod.movements || []).forEach(function(mov) {
 if (S.muscuMedical && S.muscuMedical.done && !filterExerciseByMedical(mov, S.muscuMedical)) {
   _cfMedFiltered++;
   return;
 }
 // S.medical onboarding conditions (hta, osteo, cardio, irc) — same movements as buildPersonalizedMuscuPlan
 if (_cfSMedList.length > 0) {
   var _mn = String(mov.name || '').toLowerCase();
   var _cfSBlock = false;
   if (!_cfSBlock && (_cfSMedList.indexOf('hta') !== -1 || _cfSMedList.indexOf('hypertension') !== -1 || _cfSMedList.indexOf('hta_severe') !== -1)) {
     _cfSBlock = /snatch|clean|jerk|deadlift|thruster|hspu|handstand\s+push|l[\s-]sit|dragon\s+flag/.test(_mn);
   }
   if (!_cfSBlock && (_cfSMedList.indexOf('osteoporose') !== -1 || _cfSMedList.indexOf('osteoporosis') !== -1)) {
     _cfSBlock = /snatch|clean|box\s+jump|burpee|double\s+under|jump\s+squat/.test(_mn);
   }
   if (!_cfSBlock && (_cfSMedList.indexOf('cardio') !== -1 || _cfSMedList.indexOf('insuffisance_card') !== -1)) {
     _cfSBlock = /snatch|clean|deadlift|assault\s+bike|burpee|box\s+jump|thruster/.test(_mn);
   }
   if (!_cfSBlock && _cfSMedList.indexOf('irc') !== -1) {
     _cfSBlock = /snatch|clean|deadlift|thruster|burpee|box\s+jump|jump\s+squat/.test(_mn);
   }
   if (!_cfSBlock && (_cfSMedList.indexOf('genou') !== -1 || _cfSMedList.indexOf('acl') !== -1 || _cfSMedList.indexOf('menisque') !== -1 || _cfSMedList.indexOf('meniscus') !== -1 || _cfSMedList.indexOf('knees') !== -1)) {
     _cfSBlock = /box\s+jump|pistol|jump\s+squat|jumping\s+squat|squat\s+jump|double\s+under|burpee|lunge|walking\s+lunge/.test(_mn);
   }
   if (_cfSBlock) { _cfMedFiltered++; return; }
 }
 var movText = formatCFMovement(mov);
 var movDiv = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border)'}, movText);
 movList.appendChild(movDiv);
 });
 wodCard.appendChild(movList);
 if (_cfMedFiltered > 0) {
 if (!movList.children.length) {
   movList.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);padding:8px 0;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'No compatible movement — see scaling options below' : 'Aucun mouvement compatible — consultez les options de scaling ci-dessous')));
 }
 wodCard.appendChild(h('div', {style: 'background:#FFF3CD;border-left:3px solid #FF6B6B;padding:8px 12px;margin-top:8px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#C00'}, _cfMedFiltered + (window.isEnglish && window.isEnglish() ? ' movement(s) removed for medical restriction' : ' mouvement(s) retiré(s) pour restriction médicale')));
 }

 if (_wod.notes) {
 wodCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:6px'}, _wod.notes));
 }
 p.appendChild(wodCard);

 // ─── SCALING OPTIONS ───
 var _sc = wod.scaled;
 if (_sc) {
 var scCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #E07B00;background:rgba(224,123,0,0.04);margin-top:8px'});
 scCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#E07B00;margin-bottom:6px'}, 'SCALING'));
 if (Array.isArray(_sc.movements) && _sc.movements.length) {
 _sc.movements.forEach(function(m) {
 if (S.muscuMedical && S.muscuMedical.done && !filterExerciseByMedical(m, S.muscuMedical)) return;
 var txt = (m.name || '') + (m.note ? ' ' + m.note : '');
 if (!txt.trim()) return;
 scCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);padding:2px 0'}, txt.trim()));
 });
 }
 if (_sc.note) scCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E07B00;margin-top:4px;font-style:italic'}, _sc.note));
 p.appendChild(scCard);
 }

 // ─── RX+ CHALLENGE ───
 var _rxp = wod.rxPlus;
 if (_rxp && _rxp.note) {
 var rxCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #8B2FC9;background:rgba(139,47,201,0.04);margin-top:8px'});
 rxCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8B2FC9;margin-bottom:6px'}, ' RX+'));
 rxCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#8B2FC9'}, _rxp.note));
 p.appendChild(rxCard);
 }

 // ─── GYM DRILLS (always shown at the end) ───
 if (currentDay.hasHaltero) {
 // For haltero days, gym drills are shown after the WOD
 var gymCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid var(--ink-900,#0A0A09)'});
 gymCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--success,#3E5C3A);margin-bottom:6px'}, 'GYMNASTIQUE'));
 var _gym2 = wod.gym || {};
 gymCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:8px'}, (_gym2.name || '')));

 var drillList = h('div', {});
 (_gym2.drills || []).forEach(function(drill, idx) {
 drillList.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);padding:3px 0'}, (idx + 1) + '. ' + drill));
 });
 gymCard.appendChild(drillList);

 var gymVideoQ = encodeURIComponent((_gym2.name || '').replace('Skill: ', '') + ' crossfit tutorial');
 gymCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + gymVideoQ, target: '_blank', rel: 'noopener', style: 'margin-top:8px'}, (window.isEnglish && window.isEnglish() ? '▶ Watch technique' : '▶ Voir la technique')));
 p.appendChild(gymCard);
 }
 // For non-haltero days, gym was already shown before the WOD


 // ─── ELITE: AEROBIC CAPACITY (5eme composante) ───
 if (wod.aerobic && wod.aerobic.type) {
  var aerCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A5A5A;background:rgba(26,90,90,0.03)'});
  aerCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A5A5A;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'AEROBIC (5th ELITE component)' : 'AEROBIE (5e composante ELITE)')));
  aerCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:4px'}, wod.aerobic.type));
  aerCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, wod.aerobic.desc || ''));
  if (wod.aerobic.rpe !== undefined) {
   (function(){ var _ae = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:#1A5A5A;margin-top:6px'}); _ae.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _ae.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? ' target: ' : ' cible : ') + wod.aerobic.rpe + '/10 — ' + (window.isEnglish && window.isEnglish() ? 'Zone 2 comfortable effort' : 'Effort Zone 2 confortable'))); aerCard.appendChild(_ae); })();
  }
  p.appendChild(aerCard);
 }

 // ─── ELITE: RECOVERY / MOBILITE (5e composante) ───
 if (wod.recovery && wod.recovery.protocol && wod.recovery.protocol.length) {
  var recCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #5A5A1A;background:rgba(90,90,26,0.03)'});
  recCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5A5A1A;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'RECOVERY & MOBILITY (Champion protocol)' : 'RECOVERY & MOBILITE (Protocole champion)')));
  if (wod.recovery.targets && wod.recovery.targets.length) {
   recCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Target zones: ' : 'Zones cibles : ') + wod.recovery.targets.join(', ')));
  }
  var recList = h('div', {});
  wod.recovery.protocol.forEach(function(step, idx) {
   recList.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);padding:3px 0'}, (idx + 1) + '. ' + step));
  });
  recCard.appendChild(recList);
  p.appendChild(recCard);
 }

 // ─── ELITE MODE (RX+ uniquement) ───
 if (S.crossfitLevel === 'rx_plus') {
  var eliteCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #8B2FC9;background:rgba(139,47,201,0.04)'});
  eliteCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8B2FC9;margin-bottom:6px'}, 'ELITE MODE — Champion Mental Framework'));
  var elitePoints = [
   'INTENT: Chaque WOD a un objectif precis dans la programmation. Lis les notes du WOD AVANT de commencer.',
   'PACING: Un champion ne commence jamais a 100% avant le round 3. Reserve 15% de capacite pour la fin.',
   (function(){ var _el = document.createDocumentFragment(); _el.appendChild(document.createTextNode(window.isEnglish && window.isEnglish() ? 'JOURNAL: Record your score, your ' : 'JOURNAL: Notez votre score, votre ')); _el.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _el.appendChild(document.createTextNode(window.isEnglish && window.isEnglish() ? ', and your observations. Progress comes from analysis, not just work.' : ", et vos observations. La progression vient de l'analyse, pas juste du travail.")); return _el; })(),
   'RECOVERY: Le muscle grandit pendant le repos, pas pendant l\'entrainement. Dors 8h minimum ce soir.',
   'MENTAL: "Les jours difficiles sont les jours qui nous construisent. Les jours faciles sont des jours de maintenance."'
  ];
  var eliteList = h('div', {});
  elitePoints.forEach(function(pt, idx) {
   var _eDiv = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:#8B2FC9;padding:3px 0;border-bottom:1px solid rgba(139,47,201,0.15)'}); if (typeof pt === 'string') { _eDiv.textContent = (idx + 1) + '. ' + pt; } else { _eDiv.appendChild(document.createTextNode((idx + 1) + '. ')); _eDiv.appendChild(pt); } eliteList.appendChild(_eDiv);
  });
  eliteCard.appendChild(eliteList);
  p.appendChild(eliteCard);
 }

 // Day summary — ELITE 5 composantes
 var hasAerobic = wod.aerobic && wod.aerobic.type;
 var hasRecovery = wod.recovery && wod.recovery.protocol && wod.recovery.protocol.length;
 var eliteCompCount = (currentDay.hasHaltero ? 1 : 0) + 1 + 1 + (hasAerobic ? 1 : 0) + (hasRecovery ? 1 : 0); // strength+WOD+gym+aerobic+recovery
 var summary = h('div', {'class': 'day-total'});
 summary.appendChild(h('div', {'class': 'dt-label'}, eliteCompCount + (window.isEnglish && window.isEnglish() ? ' ELITE components' : ' composantes ELITE')));
 var durStr = currentDay.hasHaltero ? '~75-90 min' : '~50-65 min';
 if (hasAerobic) durStr += ' + 20-40 min Z2 sep.';
 summary.appendChild(h('div', {'class': 'dt-val'}, durStr));
 p.appendChild(summary);

 // ─── WOD TIMER ───
 // Simple stopwatch / countdown for AMRAP and For Time WODs
 (function() {
 var wodType = (_wod.type || '').toUpperCase();
 var timerContainer = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;margin:12px 0;background:var(--ivory2)'});
 timerContainer.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'WOD TIMER' : 'TIMER WOD')));

 // Parse AMRAP/EMOM duration in minutes, or cap for For Time
 var totalSeconds = 0;
 var isCountdown = false;
 var isEmom = (wodType.indexOf('EMOM') !== -1);
 // Match explicit "Xmin" or "X MIN" (For Time cap, EMOM with unit)
 var capMatch = wodType.match(/(\d+)\s*(?:MIN|MINUTES?)/);
 if (capMatch) {
 totalSeconds = parseInt(capMatch[1]) * 60;
 isCountdown = true;
 }
 // AMRAP X or EMOM X (no "min" suffix) — number is the duration in minutes
 if (!isCountdown) {
 var amrapMatch = wodType.match(/^(?:AMRAP|EMOM)\s+(\d+)/);
 if (amrapMatch) {
 totalSeconds = parseInt(amrapMatch[1]) * 60;
 isCountdown = true;
 }
 }
 // EMOM X (Y rounds) — use X as total minutes even if no "min" suffix
 if (!isCountdown && isEmom) {
 var emomAny = wodType.match(/EMOM\s+(\d+)/);
 if (emomAny) {
 totalSeconds = parseInt(emomAny[1]) * 60;
 isCountdown = true;
 }
 }
 var totalRounds = isEmom && totalSeconds > 0 ? Math.floor(totalSeconds / 60) : 0;

 // Local Web Audio helper for WOD timer (used when RestTimer not available)
 function _wodPlayBeep(type) {
 if (window._sfcMuted) return;
 if (window.RestTimer && window.RestTimer.playBeep && type !== 'tick') {
 window.RestTimer.playBeep();
 return;
 }
 if (window.RestTimer && window.RestTimer.playTick && type === 'tick') {
 window.RestTimer.playTick();
 return;
 }
 try {
 // Singleton AudioContext pour éviter de dépasser la limite navigateur (~6 instances)
 if (!window._sfcWodAudioCtx) {
   try { window._sfcWodAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { window._sfcWodAudioCtx = null; }
 }
 var ctx = window._sfcWodAudioCtx;
 if (!ctx) return;
 if (ctx.state === 'suspended') ctx.resume();
 var now = ctx.currentTime;
 if (type === 'tick') {
 var osc = ctx.createOscillator();
 var gain = ctx.createGain();
 osc.connect(gain); gain.connect(ctx.destination);
 osc.type = 'sine'; osc.frequency.value = 660; gain.gain.value = 0.2;
 osc.start(now); osc.stop(now + 0.08);
 } else if (type === 'start') {
 var osc2 = ctx.createOscillator();
 var gain2 = ctx.createGain();
 osc2.connect(gain2); gain2.connect(ctx.destination);
 osc2.type = 'sine'; osc2.frequency.value = 880; gain2.gain.value = 0.3;
 osc2.start(now); osc2.stop(now + 0.12);
 } else {
 for (var i = 0; i < 3; i++) {
 var oscB = ctx.createOscillator();
 var gainB = ctx.createGain();
 oscB.connect(gainB); gainB.connect(ctx.destination);
 oscB.type = 'square'; oscB.frequency.value = 880; gainB.gain.value = 0.4;
 oscB.start(now + i * 0.2); oscB.stop(now + i * 0.2 + 0.12);
 }
 var oscL = ctx.createOscillator();
 var gainL = ctx.createGain();
 oscL.connect(gainL); gainL.connect(ctx.destination);
 oscL.type = 'square'; oscL.frequency.value = 1050; gainL.gain.value = 0.5;
 oscL.start(now + 0.7); oscL.stop(now + 1.1);
 }
 } catch(e) {}
 }

 var displayEl = h('div', {style: 'font-family:Georgia,serif;font-size:36px;text-align:center;letter-spacing:2px;color:#0A0A09;margin:8px 0'}, '00:00');
 timerContainer.appendChild(displayEl);

 // EMOM round counter element
 var roundEl = null;
 if (isEmom && totalRounds > 0) {
 roundEl = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;text-align:center;color:var(--grey);margin-bottom:4px'}, 'Round — / ' + totalRounds);
 timerContainer.appendChild(roundEl);
 }

 // Clear any previous timer interval to prevent leaks on re-render
 if (window._wodTimerInterval) clearInterval(window._wodTimerInterval);
 var _timerRunning = false;
 var _timerInterval = null;
 var _elapsed = 0;
 var _timerStartTime = 0;
 var _lastTickSecond = -1;
 // 2026-04 N2 : persistance du timer WOD — survit au verrou écran / rafraîchissement
 // Clé unique basée sur le WOD en cours + type de timer (countdown/up) + durée prévue
 var _wodPersistKey = '_sfc_wodTimer_' + (wod && wod.day ? wod.day : 'adhoc') + '_' + (isCountdown ? 'cd' : 'up') + '_' + totalSeconds;
 try {
   var _sfcSessStore = (window.safeStorage && window.safeStorage.session) || { getItem: function(k){ try{return sessionStorage.getItem(k);}catch(e){return null;} }, setItem: function(k,v){ try{sessionStorage.setItem(k,v);}catch(e){} }, removeItem: function(k){ try{sessionStorage.removeItem(k);}catch(e){} } };
   var _savedState = _sfcSessStore.getItem(_wodPersistKey);
   if (_savedState) {
     var _st = JSON.parse(_savedState);
     // Ne restaurer que si < 4h (sinon c'est un timer abandonné)
     if (_st && typeof _st.elapsed === 'number' && Date.now() - (_st.savedAt || 0) < 4 * 3600 * 1000) {
       _elapsed = _st.elapsed;
       // Ne pas auto-démarrer — l'utilisateur doit explicitement reprendre
     } else {
       _sfcSessStore.removeItem(_wodPersistKey);
     }
   }
 } catch(e) {}

 function formatTime(secs) {
 var m = Math.floor(Math.abs(secs) / 60);
 var s = Math.abs(secs) % 60;
 return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
 }

 function updateDisplay() {
 var shown = isCountdown ? Math.max(0, totalSeconds - _elapsed) : _elapsed;
 displayEl.textContent = formatTime(shown);
 if (isCountdown && shown === 0) {
 displayEl.style.color = 'var(--error,#7A1F1F)';
 }
 // Update EMOM round counter
 if (roundEl && isEmom && totalRounds > 0) {
 var currentRound = Math.min(totalRounds, Math.floor(_elapsed / 60) + 1);
 if (_elapsed >= totalSeconds && totalSeconds > 0) currentRound = totalRounds;
 roundEl.textContent = 'Round ' + currentRound + ' / ' + totalRounds;
 }
 }

 var btnRow = h('div', {style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap'});

 var startBtn = h('button', {'class': 'btn-primary', style: 'width:auto;padding:8px 20px;margin:0', onclick: function() {
 if (_timerRunning) {
 _timerRunning = false;
 clearInterval(_timerInterval);
 startBtn.textContent = (window.isEnglish && window.isEnglish() ? 'Resume' : 'Reprendre');
 } else {
 // Son de démarrage
 _wodPlayBeep('start');
 _timerRunning = true;
 _lastTickSecond = -1;
 _timerStartTime = Date.now() - _elapsed * 1000;
 _timerInterval = window._wodTimerInterval = setInterval(function() {
 _elapsed = Math.floor((Date.now() - _timerStartTime) / 1000);
 updateDisplay();
 // 2026-04 N2 : sauvegarder l'état toutes les secondes (persist face au verrou écran)
 try { _sfcSessStore.setItem(_wodPersistKey, JSON.stringify({ elapsed: _elapsed, savedAt: Date.now() })); } catch(e) {}
 if (isCountdown) {
 var remaining = totalSeconds - _elapsed;
 // Tick pour les 3 dernières secondes (une seule fois par seconde)
 if (remaining > 0 && remaining <= 3 && remaining !== _lastTickSecond) {
 _lastTickSecond = remaining;
 _wodPlayBeep('tick');
 }
 if (_elapsed >= totalSeconds) {
 _timerRunning = false;
 clearInterval(_timerInterval);
 startBtn.textContent = (window.isEnglish && window.isEnglish() ? 'Time elapsed' : 'Temps écoulé');
 _wodPlayBeep('end');
 }
 }
 }, 250);
 startBtn.textContent = (window.isEnglish && window.isEnglish() ? 'Pause' : 'Pause');
 }
 }}, (window.isEnglish && window.isEnglish() ? 'Start' : 'Démarrer'));

 var resetBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:8px 16px;margin:0', onclick: function() {
 _timerRunning = false;
 clearInterval(_timerInterval);
 _elapsed = 0;
 _lastTickSecond = -1;
 // 2026-04 N2 : purger l'état persistant (l'utilisateur veut repartir à zéro)
 try { _sfcSessStore.removeItem(_wodPersistKey); } catch(e) {}
 startBtn.textContent = (window.isEnglish && window.isEnglish() ? 'Start' : 'Démarrer');
 displayEl.style.color = '#0A0A09';
 updateDisplay();
 }}, 'Reset');

 // Mute button for WOD timer sounds
 var wodMuteBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:8px 12px;margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase', title: window._sfcMuted ? (window.isEnglish && window.isEnglish() ? 'Muted — click to enable' : 'Son coupé — cliquer pour activer') : (window.isEnglish && window.isEnglish() ? 'Sound on — click to mute' : 'Son actif — cliquer pour couper'),
 onclick: function() {
 window._sfcMuted = !window._sfcMuted;
 wodMuteBtn.textContent = window._sfcMuted ? 'Muet' : 'Son';
 wodMuteBtn.title = window._sfcMuted ? (window.isEnglish && window.isEnglish() ? 'Muted — click to enable' : 'Son coupé — cliquer pour activer') : (window.isEnglish && window.isEnglish() ? 'Sound on — click to mute' : 'Son actif — cliquer pour couper');
 }}, window._sfcMuted ? (window.isEnglish && window.isEnglish() ? 'Muted' : 'Muet') : (window.isEnglish && window.isEnglish() ? 'Sound' : 'Son'));

 btnRow.appendChild(startBtn);
 btnRow.appendChild(resetBtn);
 btnRow.appendChild(wodMuteBtn);
 timerContainer.appendChild(btnRow);

 if (isCountdown) {
 timerContainer.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-top:6px'}, (window.isEnglish && window.isEnglish() ? 'Countdown ' : 'Compte à rebours ') + (_wod.type || '')));
 } else {
 timerContainer.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-top:6px'}, (window.isEnglish && window.isEnglish() ? 'Stopwatch — ' : 'Chrono — ') + (_wod.type || '')));
 }
 updateDisplay();
 p.appendChild(timerContainer);
 })();

 // ─── MARQUER WOD COMME TERMINÉ ───
 (function() {
 if (!S.cfProgress) S.cfProgress = {};
 var wodDay = wod && wod.day;
 if (!wodDay) return;
 var isWodDone = !!(S.cfProgress[wodDay] && S.cfProgress[wodDay].done);

 var doneCard = h('div', {style: 'border:1px solid ' + (isWodDone ? 'var(--ink-900,#0A0A09)' : 'var(--line)') + ';padding:14px 16px;margin:8px 0;background:' + (isWodDone ? 'rgba(62,92,58,0.04)' : 'var(--ivory2)')});
 doneCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'WOD TRACKING — Day ' : 'SUIVI WOD — Jour ') + wodDay));

 if (isWodDone) {
 doneCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:#2E7D32;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? ' WOD completed on ' : ' WOD complété le ') + (S.cfProgress[wodDay].date || '') + (S.cfProgress[wodDay].score ? (window.isEnglish && window.isEnglish() ? ' — Score: ' : ' — Score : ') + S.cfProgress[wodDay].score : '')));

 var editBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 14px;margin:0;font-size:11px', onclick: function() {
 S.cfProgress[wodDay] = null;
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? 'Edit' : 'Corriger'));
 doneCard.appendChild(editBtn);
 } else {
 // Score input
 var scoreWrap = h('div', {style: 'margin-bottom:10px'});
 scoreWrap.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Score (rounds, time, reps, kg) — optional' : 'Score (rounds, temps, reps, kg) — optionnel')));
 var scoreInput = h('input', {
 type: 'text',
 placeholder: 'Ex: 8 rounds + 5, 14:32, 135 reps...',
 style: 'width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;background:var(--ivory);color:#0A0A09',
 value: ''
 });
 scoreWrap.appendChild(scoreInput);
 doneCard.appendChild(scoreWrap);

 var doneBtn = h('button', {'class': 'btn-primary', style: 'width:100%;margin:0', onclick: function() {
 if (!S.cfProgress) S.cfProgress = {};
 var today = new Date();
 var mm = today.getMonth() + 1; var dd = today.getDate();
 var dateStr = today.getFullYear() + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
 S.cfProgress[wodDay] = { done: true, date: dateStr, score: scoreInput.value.trim() };
 // Advance cfCurrentDay if this was the current day
 if (S.cfCurrentDay === wodDay && wodDay < 100) {
 S.cfCurrentDay = wodDay + 1;
 }
 // Save to S.sessionHistory so analytics volume tracker counts CF sessions
 if (!S.sessionHistory) S.sessionHistory = {};
 var _cfLevel = S.crossfitLevel || 'rx';
 var _cfDurMap = {scaled: 60, inter: 70, rx: 75, rx_plus: 90};
 var _cfDur = _cfDurMap[_cfLevel] || 75;
 var _cfKcal = estimateKcal('crossfit', _cfLevel, _cfDur);
 var _cfSessKey = (S.selectedCrossfitDay || 0) + '_' + dateStr;
 var _cfTrainingLoad = (_cfLevel === 'rx_plus' || _cfLevel === 'rx') ? 'heavy' : (_cfLevel === 'inter') ? 'moderate' : 'light';
 S.sessionHistory[_cfSessKey] = {duration: _cfDur, kcalBase: _cfKcal ? _cfKcal.base : 0, kcalEpoc: _cfKcal ? _cfKcal.epoc : 0, kcalTotal: _cfKcal ? _cfKcal.total : 0, date: new Date().toISOString(), sport: 'crossfit', trainingLoad: _cfTrainingLoad, wodDay: wodDay, score: scoreInput.value.trim()};
 (function(){ var _k=Object.keys(S.sessionHistory||{}).sort(); if(_k.length>365){_k.slice(0,_k.length-365).forEach(function(k){delete S.sessionHistory[k];});} })();
 if (window.SFCSymbiosis && window.SFCSymbiosis.processCompletedSession) {
   var _cfN = _cfTrainingLoad === 'heavy' ? 6 : _cfTrainingLoad === 'light' ? 2 : 4;
   var _cfEx = []; for (var _cfi = 0; _cfi < _cfN; _cfi++) { _cfEx.push({name: 'CrossFit' + (_cfi + 1), sets: 3, reps: 10}); }
   try { window.SFCSymbiosis.processCompletedSession({sessionId: _cfSessKey, date: dateStr, exercises: _cfEx, trainingLoad: _cfTrainingLoad}); } catch(_e) {}
 } else if (typeof window.computeNutritionState === 'function') { try { window.computeNutritionState(true); } catch(_e) {} }
 if (window.GAMIFICATION) { try { window.GAMIFICATION.updateStreak(); } catch(e) {} }
 window.BLACKBOX && window.BLACKBOX.log('cf_wod_done', {day: wodDay, score: scoreInput.value.trim()});
 if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? '✓ WOD done — day ' : '✓ WOD terminé — jour ') + wodDay + (scoreInput.value.trim() ? ' · ' + scoreInput.value.trim() : ''), 'success');
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? ' WOD done' : ' WOD terminé'));
 doneCard.appendChild(doneBtn);
 }
 p.appendChild(doneCard);

 // ─── ELITE: RPE TRACKER ───
 (function() {
  if (!S.cfProgress) S.cfProgress = {};
  var wodDay2 = wod && wod.day;
  if (!wodDay2) return;
  var isWodDone2 = !!(S.cfProgress[wodDay2] && S.cfProgress[wodDay2].done);
  if (!isWodDone2) return; // Only show RPE after marking done

  var existingRpe = S.cfProgress[wodDay2] && S.cfProgress[wodDay2].rpe;
  var rpeCard = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;margin:4px 0 8px;background:var(--ivory2)'});
  rpeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'RATE MY SESSION (RPE)' : 'NOTER MA SEANCE (RPE)')));
  rpeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'How did this WOD go?' : "Comment s'est passe ce WOD ?")));

  var rpeRow = h('div', {style: 'display:flex;gap:8px'});
  var rpeOptions = [
    {val: 'easy', label: (window.isEnglish && window.isEnglish() ? 'Easy' : 'Facile'), color: '#3E5C3A', bg: 'rgba(62,92,58,0.06)'},
   {val: 'good', label: (window.isEnglish && window.isEnglish() ? 'Good effort' : 'Bon effort'), color: '#1A3A6A', bg: 'rgba(26,58,106,0.08)'},
    {val: 'hard', label: (window.isEnglish && window.isEnglish() ? 'Exhausting' : 'Epuisant'), color: '#7A1F1F', bg: 'rgba(122,31,31,0.06)'}
  ];
  rpeOptions.forEach(function(rpeOpt) {
   var isSelected = (existingRpe === rpeOpt.val);
   var rpeBtn = h('button', {
    style: 'flex:1;padding:8px 4px;border:1px solid ' + (isSelected ? rpeOpt.color : 'var(--border)') + ';background:' + (isSelected ? rpeOpt.bg : 'transparent') + ';font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:' + rpeOpt.color + ';cursor:pointer;border-radius:2px',
    onclick: (function(rv) {
     return function() {
      if (!S.cfProgress) S.cfProgress = {};
      if (!S.cfProgress[wodDay2]) S.cfProgress[wodDay2] = { done: true };
      S.cfProgress[wodDay2].rpe = rv;
      // Check for 5 consecutive "hard" RPE -> deload recommendation
      var hardCount = 0;
      var dayNums = Object.keys(S.cfProgress).map(Number).sort(function(a, b) { return a - b; });
      var lastFive = dayNums.slice(-5);
      for (var li = 0; li < lastFive.length; li++) {
       if (S.cfProgress[lastFive[li]] && S.cfProgress[lastFive[li]].rpe === 'hard') hardCount++;
      }
      if (hardCount >= 5) {
       S.cfDeloadRecommended = true;
      }
      window.render();
     };
    })(rpeOpt.val)
   }, rpeOpt.label);
   rpeRow.appendChild(rpeBtn);
  });
  rpeCard.appendChild(rpeRow);

  // Deload recommendation
  if (S.cfDeloadRecommended) {
   var deloadRec = h('div', {style: 'margin-top:10px;padding:8px 12px;background:rgba(224,123,0,0.08);border-left:2px solid #E07B00;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E07B00'});
   deloadRec.textContent = (window.isEnglish && window.isEnglish() ? 'DELOAD RECOMMENDED: 5 consecutive Exhausting sessions detected. Next week, reduce volume by 40% and intensity to 70% max. Your central nervous system needs recovery.' : "DELOAD RECOMMANDE : 5 seances consecutives Epuisant detectees. La semaine prochaine, reduisez le volume de 40% et l'intensite a 70% max. Votre systeme nerveux central a besoin de recuperation.");
   rpeCard.appendChild(deloadRec);
  }

  p.appendChild(rpeCard);
 })();
 })();

 // Regenerate (shuffle order)
 p.appendChild(h('button', {'class': 'regen-btn', style: 'margin-top:16px', onclick: function(){
 var shuffled = (window.CF_WODS || []).slice();
 for (var i = shuffled.length - 1; i > 0; i--) {
 var j = Math.floor(Math.random() * (i + 1));
 var tmp = shuffled[i];
 shuffled[i] = shuffled[j];
 shuffled[j] = tmp;
 }
 for (var k = 0; k < shuffled.length; k++) {
 shuffled[k] = Object.assign({}, shuffled[k], {day: k + 1});
 }
 window.CF_WODS = shuffled;
 S.selectedCrossfitDay = 0;
 window.BLACKBOX && window.BLACKBOX.log('crossfit_program_shuffled');
 window.render();
  }}, (window.isEnglish && window.isEnglish() ? '↻ Regenerate program' : '↻ Régénérer le programme')));

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 5; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Edit level' : 'Modifier le niveau')}));
 appendNutritionModeCTA(p);
}

// (renderSportStep0 removed — replaced by renderObjectif above)

// ─── STEP 2 (Muscu): NIVEAU & FRÉQUENCE ───
function renderMusculationLevel(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Weightlifting · Step 2/3' : 'Musculation · Étape 2/3')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Your level<br><em>& setup</em>' : 'Votre niveau<br><em>& organisation</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Experience level, frequency and available equipment.' : 'Niveau d\'expérience, fréquence et matériel disponible.')));
 if (window.TIPS) TIPS.renderTip(p, 'sportLevel');

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.level')));
 var list = h('div', {'class': 'level-list'});
 (window.SPORT_LEVELS || []).forEach(function(lv) {
 list.appendChild(h('div', {'class': 'level-item' + (S.sportLevel === lv.id ? ' on' : ''), onclick: function(){
   var prevLevel = S.sportLevel;
   S.sportLevel = lv.id;
   // FIX SPRINT P2.10 — invalider sportProgram si niveau change → re-génération auto
   if (prevLevel && prevLevel !== lv.id && Array.isArray(S.sportProgram) && S.sportProgram.length > 0) {
     S.sportProgram = null;
     S.muscuIAProgram = null;
     S.bonusExercises = {};
     try { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Level changed. Regenerate your program.' : 'Niveau changé. Régénère ton programme.', 'info', 3000); } catch(_e) {}
   }
   window.render();
 }}, [
 h('div', {}, [h('div', {'class': 'level-name'}, lv.name), h('div', {'class': 'level-desc'}, lv.desc)]),
 h('span', {'class': 'level-badge'}, '×' + lv.factor)
 ]));
 });
 p.appendChild(list);

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.days')));
 var nw = h('div', {'class': 'num-input-wrap'});
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '6', value: String(S.sportDays || 3), inputmode: 'numeric', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Number of training days per week' : 'Nombre de jours d\'entraînement par semaine'),
 // FIX DESYNC 2026-04-16 — invalider sportProgram si days change (sinon labels 3j mais programme 5j)
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 6) { var prev = S.sportDays; S.sportDays = v; if (prev !== v && Array.isArray(S.sportProgram) && S.sportProgram.length > 0) { S.sportProgram = null; S.muscuIAProgram = null; S.bonusExercises = {}; } if (S.sportMixSecondary && S.sportMixSecondary.days >= v) { S.sportMixSecondary.days = Math.max(1, v - 2); } window.render(); } },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) { v = 2; e.target.value = S.sportDays = 2; } else if (v > 6) { v = 6; e.target.value = S.sportDays = 6; } if (Array.isArray(S.sportProgram) && S.sportProgram.length > 0 && S.sportProgram.length !== v) { S.sportProgram = null; S.muscuIAProgram = null; S.bonusExercises = {}; } if (S.sportMixSecondary && S.sportMixSecondary.days >= v) { S.sportMixSecondary.days = Math.max(1, v - 2); } window.render(); }
 }));
 nw.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(nw);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? 'Between 2 and 6 days' : 'Entre 2 et 6 jours')));

 // ─── JOURS SPÉCIFIQUES ───
 // Pré-remplissage depuis le profil nutrition si déjà sélectionnés
 if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
 var _daysImported = false;
 if (S.trainingDaysSelected.length > 0) {
   if (!S.sportDays) S.sportDays = Math.max(2, S.trainingDaysSelected.length);
   _daysImported = true;
 }
 var _sectionLabelDays = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-top:16px;margin-bottom:0'});
 _sectionLabelDays.appendChild(h('div', {'class': 'section-label', style: 'margin-top:0;margin-bottom:0'}, (window.isEnglish && window.isEnglish() ? 'Which days do you train? (optional)' : 'Quels jours vous entraînez-vous ? (optionnel)')));
 if (_daysImported) { _sectionLabelDays.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);font-style:italic'}, (window.isEnglish && window.isEnglish() ? '(imported from your profile)' : '(importés depuis ton profil)'))); }
 p.appendChild(_sectionLabelDays);
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:10px;line-height:1.5;'}, (window.isEnglish && window.isEnglish() ? 'Select your training days to adapt nutrition macros (training vs rest).' : 'Sélectionnez vos jours pour adapter vos macros nutrition (entraînement vs repos).')));
 var _musDay = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
 var _musDayWrap = h('div', {style: 'display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;margin:0 0 6px'});
 var _musTarget = S.sportDays || 3;
 _musDay.forEach(function(label, idx) {
   var _mSel = S.trainingDaysSelected.indexOf(idx) !== -1;
   var _mOver = _mSel && S.trainingDaysSelected.length > _musTarget;
   var _mStyle = 'width:44px;height:44px;border-radius:0;font-family:Georgia,serif;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;transition:background .15s,color .15s,border-color .15s;';
   if (_mOver) _mStyle += 'background:var(--error,#7A1F1F);color:#FAF9F6;border:1px solid var(--error,#7A1F1F);';
   else if (_mSel) _mStyle += 'background:#1A1A18;color:#FAF9F6;border:1.5px solid #1A1A18;';
   else _mStyle += 'background:transparent;color:#1A1A18;border:1.5px solid #E8E6DF;';
   _musDayWrap.appendChild(h('button', {
     type: 'button', style: _mStyle,
     onclick: function() {
       if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
       var _mp = S.trainingDaysSelected.indexOf(idx);
       if (_mp !== -1) { S.trainingDaysSelected.splice(_mp, 1); }
       else { S.trainingDaysSelected.push(idx); S.trainingDaysSelected.sort(function(a, b) { return a - b; }); }
       // FIX 2026-04-16 : clamp à 2 min (comme le slider) — 1 jour/sem pas de split muscu cohérent
       var _prevDays = S.sportDays;
       if (S.trainingDaysSelected.length > 0) S.sportDays = Math.max(2, S.trainingDaysSelected.length);
       // FIX DESYNC 2026-04-16 — invalider sportProgram si nombre de jours change
       if (_prevDays !== S.sportDays && Array.isArray(S.sportProgram) && S.sportProgram.length > 0) { S.sportProgram = null; S.muscuIAProgram = null; S.bonusExercises = {}; }
       // FIX VALIDATION WEEKPLAN 2026-04 : dévalider (jours training changés)
       if (window.devalidateWeekPlan) window.devalidateWeekPlan('trainingDaysSelected changed');
       else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
       // SPRINT 2 F1 HYPERSTAB 2026-04-17 — sync conditionnel weeklyCalendar (muscu).
       // Même logique que dans renderCrossfitLevel : n'agit que si weeklyCalendar
       // existe déjà en mémoire (user a déjà ouvert smart-calendar dans la session)
       // ET S.sportType est défini (pas de label orphelin "muscu" écrit).
       // Préserve les customisations user vers d'autres sports.
       // NB: la persistance cross-reload dépend du fix de loadProfile (~l.399
       // reset weeklyCalendar si !Array) — hors-scope Sprint 2, session-only.
       if (S.sportType && S.weeklyCalendar && typeof S.weeklyCalendar === 'object' && !Array.isArray(S.weeklyCalendar)) {
         var _sportLabelM = S.sportType;
         var _dayKeyM = String(idx);
         if (_mp !== -1) {
           if (S.weeklyCalendar[_dayKeyM] === _sportLabelM) S.weeklyCalendar[_dayKeyM] = 'repos';
         } else {
           if (!S.weeklyCalendar[_dayKeyM] || S.weeklyCalendar[_dayKeyM] === 'repos') {
             S.weeklyCalendar[_dayKeyM] = _sportLabelM;
           }
         }
       }
       try { window.saveProfile(); } catch(e) {}
       window.render();
     }
   }, label));
 });
 p.appendChild(_musDayWrap);
 var _mCount = S.trainingDaysSelected.length;
 var _mDiff = _mCount - _musTarget;
 var _mColor = _mDiff === 0 && _mCount > 0 ? 'var(--ink-500,#6B6B65)' : (_mDiff > 0 ? 'var(--error,#7A1F1F)' : 'var(--ink-500,#6B6B65)');
 var _mHint = _mCount === 0
   ? (window.isEnglish && window.isEnglish() ? 'Optional — leave blank for automatic distribution' : 'Optionnel — laissez vide pour répartition automatique')
   : _mDiff === 0 ? _mCount + '\u00a0/' + '\u00a0' + _musTarget + '\u00a0' + window.locPlural(_mCount, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + (window.isEnglish && window.isEnglish() ? '\u00a0\u2014 perfect' : '\u00a0\u2014 parfait')
   : _mDiff > 0 ? _mCount + '\u00a0/\u00a0' + _musTarget + (window.isEnglish && window.isEnglish() ? '\u00a0\u2014 remove\u00a0' : '\u00a0\u2014 retirez\u00a0') + _mDiff + '\u00a0' + window.locPlural(_mDiff, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}})
   : _mCount + '\u00a0/\u00a0' + _musTarget + (window.isEnglish && window.isEnglish() ? '\u00a0\u2014 select\u00a0' : '\u00a0\u2014 sélectionnez encore\u00a0') + Math.abs(_mDiff) + '\u00a0' + window.locPlural(Math.abs(_mDiff), {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}});
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + _mColor + ';text-align:center;margin-bottom:4px;transition:color .2s;'}, _mHint));

 // Equipment selection
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Available equipment' : 'Matériel disponible')));
 var equipOptions = [
 {id: 'gym', label: (window.isEnglish && window.isEnglish() ? 'Full gym' : 'Salle complète'), desc: (window.isEnglish && window.isEnglish() ? 'Barbells, machines, cables' : 'Barres, machines, poulies')},
 {id: 'dumbbells', label: (window.isEnglish && window.isEnglish() ? 'Dumbbells + bench' : 'Haltères + banc'), desc: (window.isEnglish && window.isEnglish() ? 'Home gym or basic gym' : 'Home gym ou salle basique')},
 {id: 'home', label: (window.isEnglish && window.isEnglish() ? 'Home / Bodyweight' : 'Maison / PDC'), desc: (window.isEnglish && window.isEnglish() ? 'No equipment, bodyweight' : 'Sans matériel, poids du corps')}
 ];
 var eqGrid = h('div', {'class': 'level-list'});
 equipOptions.forEach(function(eq) {
 eqGrid.appendChild(h('div', {'class': 'level-item' + (S.sportEquipment === eq.id ? ' on' : ''), onclick: function() {
   var prevEq = S.sportEquipment;
   S.sportEquipment = eq.id;
   // FIX SPRINT P2.10 — invalider sportProgram si équipement change → re-génération auto
   if (prevEq && prevEq !== eq.id && Array.isArray(S.sportProgram) && S.sportProgram.length > 0) {
     S.sportProgram = null;
     S.muscuIAProgram = null;
     S.bonusExercises = {};
     try { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Equipment changed. Regenerate your program.' : 'Équipement changé. Régénère ton programme.', 'info', 3000); } catch(_e) {}
   }
   window.render();
 }}, [
 h('div', {}, [h('div', {'class': 'level-name'}, eq.label), h('div', {'class': 'level-desc'}, eq.desc)])
 ]));
 });
 p.appendChild(eqGrid);

 // Heure d'entraînement — pour le nutrient timing (Ivy 2004, ISSN 2017)
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Usual training time' : "Heure d'entraînement habituelle")));
 p.appendChild(h('div', {style: 'font-size:13px;color:var(--text-secondary);margin:-4px 0 10px'}, (window.isEnglish && window.isEnglish() ? 'Allows adapting meal timing (protein + carbs at the right time)' : "Permet d'adapter la répartition des repas (protéines + glucides au bon moment)")));
 var trainOptions = [
 {id: 'morning', label: (window.isEnglish && window.isEnglish() ? 'Morning' : 'Matin'), desc: (window.isEnglish && window.isEnglish() ? 'Before 12pm — post-workout breakfast' : 'Avant 12h — petit-déj post-séance')},
 {id: 'noon', label: (window.isEnglish && window.isEnglish() ? 'Noon' : 'Midi'), desc: (window.isEnglish && window.isEnglish() ? '12pm–3pm — post-workout lunch' : '12h–15h — déjeuner post-séance')},
 {id: 'evening', label: (window.isEnglish && window.isEnglish() ? 'Evening' : 'Soir'), desc: (window.isEnglish && window.isEnglish() ? 'After 5pm — post-workout dinner' : 'Après 17h — dîner post-séance')}
 ];
 var ttGrid = h('div', {'class': 'level-list'});
 trainOptions.forEach(function(opt) {
 ttGrid.appendChild(h('div', {'class': 'level-item' + (S.trainTime === opt.id ? ' on' : ''), onclick: function() {
 S.trainTime = (S.trainTime === opt.id) ? null : opt.id; // toggle
 // FIX VALIDATION WEEKPLAN 2026-04 : dévalider (timing training changé)
 if (window.devalidateWeekPlan) window.devalidateWeekPlan('trainTime toggle');
 else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
 window.render();
 }}, [h('div', {}, [h('div', {'class': 'level-name'}, opt.label), h('div', {'class': 'level-desc'}, opt.desc)])]));
 });
 p.appendChild(ttGrid);
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--text-secondary);margin-top:4px'}, (window.isEnglish && window.isEnglish() ? 'Optional — leave blank if variable' : 'Optionnel — laissez vide si variable')));

 // ─── COMPÉTITION CIBLE (optionnel) ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:24px;'}, (window.isEnglish && window.isEnglish() ? 'Competition to prepare?' : 'Compétition à préparer ?')));
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin:-4px 0 10px;line-height:1.5;'}, (window.isEnglish && window.isEnglish() ? 'Hyrox, powerlifting, marathon… The AI will periodize toward your target date. Optional.' : 'Hyrox, powerlifting, marathon… l\'IA périodisera vers ta date cible. Optionnel.')));
 var _cGrid = h('div', {'class': 'level-list'});
 [{id: false, label: (window.isEnglish && window.isEnglish() ? 'No' : 'Non'), desc: (window.isEnglish && window.isEnglish() ? 'Standard 12-week program' : 'Programme standard 12 semaines')}, {id: true, label: (window.isEnglish && window.isEnglish() ? 'Yes — I have a date' : 'Oui — j\'ai une date'), desc: (window.isEnglish && window.isEnglish() ? 'Targeted periodization' : 'Périodisation ciblée')}].forEach(function(copt) {
   var _cSel = copt.id ? !!S.competitionGoal : !S.competitionGoal;
   _cGrid.appendChild(h('div', {'class': 'level-item' + (_cSel ? ' on' : ''), onclick: function() {
     S.competitionGoal = !!copt.id;
     if (!copt.id) { S.competitionDate = ''; S.competitionType = ''; }
     window.render();
   }}, [h('div', {}, [h('div', {'class': 'level-name'}, copt.label), h('div', {'class': 'level-desc'}, copt.desc)])]));
 });
 p.appendChild(_cGrid);
 if (S.competitionGoal) {
   p.appendChild(h('div', {'class': 'field-label', style: 'margin-top:14px;'}, (window.isEnglish && window.isEnglish() ? 'Event date' : "Date de l'événement")));
   var _dInp = document.createElement('input');
   _dInp.type = 'date';
   _dInp.style.cssText = 'width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid var(--border,#D8D8D0);color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;font-weight:300;padding:10px 0;outline:none;margin-bottom:14px;display:block;';
   _dInp.value = S.competitionDate || '';
   _dInp.addEventListener('input', function(e) { S.competitionDate = e.target.value; });
   p.appendChild(_dInp);
   p.appendChild(h('div', {'class': 'field-label'}, (window.isEnglish && window.isEnglish() ? 'Event type (optional)' : "Type d'épreuve (optionnel)")));
   var _tInp = document.createElement('input');
   _tInp.type = 'text';
   _tInp.placeholder = 'ex\u00a0: Hyrox, Powerlifting, 10 km\u2026';
   _tInp.style.cssText = 'width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid var(--border,#D8D8D0);color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;font-weight:300;padding:10px 0;outline:none;display:block;';
   _tInp.value = S.competitionType || '';
   _tInp.addEventListener('input', function(e) { S.competitionType = e.target.value; });
   p.appendChild(_tInp);
 }

 // ─── SPORTS COMPLÉMENTAIRES (optionnel) ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:24px;'}, (window.isEnglish && window.isEnglish() ? 'Parallel sports activities?' : 'Sports pratiqués en parallèle ?')));
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin:-4px 0 10px;line-height:1.5;'}, (window.isEnglish && window.isEnglish() ? 'To adapt recovery and avoid load conflicts. Optional.' : 'Pour adapter la récupération et éviter les conflits de charge. Optionnel.')));
 if (!Array.isArray(S.sportHobbies)) S.sportHobbies = [];
 var _hbWrap = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px;'});
 [{id:'running',lb:'Running'},{id:'cycling',lb:(window.isEnglish && window.isEnglish() ? 'Cycling' : 'Vélo')},{id:'swimming',lb:(window.isEnglish && window.isEnglish() ? 'Swimming' : 'Natation')},{id:'tennis',lb:'Tennis / Padel'},{id:'martialarts',lb:(window.isEnglish && window.isEnglish() ? 'Martial arts' : 'Arts martiaux')},{id:'ski',lb:'Ski / Snow'},{id:'yoga',lb:'Yoga / Mob'},{id:'other',lb:(window.isEnglish && window.isEnglish() ? 'Other' : 'Autre')}].forEach(function(hobj) {
   var _hSel = S.sportHobbies.indexOf(hobj.id) !== -1;
   _hbWrap.appendChild(h('button', {type: 'button', 'class': 'chip' + (_hSel ? ' on' : ''), onclick: function() {
     if (!Array.isArray(S.sportHobbies)) S.sportHobbies = [];
     var _hi = S.sportHobbies.indexOf(hobj.id);
     if (_hi !== -1) { S.sportHobbies.splice(_hi, 1); } else { S.sportHobbies.push(hobj.id); }
     window.render();
   }}, hobj.lb));
 });
 p.appendChild(_hbWrap);
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin-top:4px;'}, (window.isEnglish && window.isEnglish() ? 'No selection = pure strength program' : 'Aucune sélection = programme muscu pur')));

 // ─── SPORT MIX (Muscu + autre sport) ───
 renderSportMixSection(p, 'musculation');

 p.appendChild(h('div', {style: 'height:24px'}));
 var ok = S.sportLevel !== null;
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) { S._chargesFromLevel = true; S.sStep = 16; window.BLACKBOX && window.BLACKBOX.log('sport_step', {step: 16}); window.render(); }
 }}, (window.isEnglish && window.isEnglish() ? 'Continue' : 'Continuer')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 1; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

// ─── STEP 3 (Muscu): ZONES CIBLES ───
function renderMusculationZones(p) {
 var _prenom3 = S.prenom || '';
 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Weightlifting · Step 3/3' : 'Musculation · Étape 3/3')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? (_prenom3 ? _prenom3 + ', which areas<br>' : 'Which areas<br>') + '<em>do you want to work on?</em>' : (_prenom3 ? _prenom3 + ', quelles zones<br>' : 'Quelles zones<br>') + '<em>voulez-vous travailler\u00a0?</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Assign a priority to each muscle group. Your program will adapt.' : 'Attribuez une priorité à chaque groupe musculaire. Votre programme s\'adaptera.')));
 if (window.TIPS) TIPS.renderTip(p, 'sportZones');

 // Show body photos if uploaded
 if (S.photoFront || S.photoBack) {
 var pg = h('div', {'class': 'photo-grid', style: 'margin-bottom:16px'});
 if (S.photoFront) {
 var pf = h('div', {'class': 'photo-upload has-photo'});
 var img1 = h('img', {src: S.photoFront, alt: 'Face', loading: 'lazy'});
 pf.appendChild(img1);
 pf.appendChild(h('div', {'class': 'photo-label'}, 'Face'));
 pg.appendChild(pf);
 }
 if (S.photoBack) {
 var pb2 = h('div', {'class': 'photo-upload has-photo'});
 var img2 = h('img', {src: S.photoBack, alt: 'Dos', loading: 'lazy'});
 pb2.appendChild(img2);
 pb2.appendChild(h('div', {'class': 'photo-label'}, 'Dos'));
 pg.appendChild(pb2);
 }
 p.appendChild(pg);
 }

 // Priority star rating for each body zone
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Muscle groups — Priority' : 'Groupes musculaires — Priorité')));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'Assign 1 to 5 stars to define priority. Click again to remove.' : 'Attribuez 1 à 5 étoiles pour définir la priorité. Cliquez à nouveau pour retirer.')));
 if (!S.sportFocus || typeof S.sportFocus !== 'object') S.sportFocus = {};
 if (!Array.isArray(S.weakZones)) S.weakZones = [];
 var grid = h('div', {style: 'margin-bottom:24px'});
 (window.BODY_ZONES || []).forEach(function(zone) {
 var priority = S.sportFocus[zone] || 0;
 var isWeak = S.weakZones.indexOf(zone) !== -1;

 var row = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--border);background:var(--ivory2);margin-bottom:4px'});

 // Zone name + weak indicator
 var nameDiv = h('div', {});
 nameDiv.appendChild(h('span', {style: 'font-family:Georgia;font-size:15px'}, zone));
 if (isWeak) nameDiv.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--orange);margin-left:8px'}, (window.isEnglish && window.isEnglish() ? '⚡ To strengthen' : '⚡ À renforcer')));
 row.appendChild(nameDiv);

 // Star rating
 var stars = h('div', {style: 'display:flex;gap:4px'});
 for (var s = 1; s <= 5; s++) {
 (function(starVal) {
 var star = h('span', {
 style: 'cursor:pointer;font-size:18px;transition:all 0.2s ease;' + (starVal <= priority ? 'opacity:1' : 'opacity:0.2'),
 onclick: function() {
 if (S.sportFocus[zone] === starVal) {
 // Click same star = deselect
 delete S.sportFocus[zone];
 } else {
 S.sportFocus[zone] = starVal;
 }
 window.render();
 }
 }, '\u2605');
 stars.appendChild(star);
 })(s);
 }
 row.appendChild(stars);
 grid.appendChild(row);
 });
 p.appendChild(grid);

 if (S.weakZones.length > 0) {
 var tip = h('div', {style: 'border-left:2px solid var(--orange);padding:8px 16px;background:rgba(232,111,30,0.06);margin-bottom:16px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'});
 tip.textContent = (window.isEnglish && window.isEnglish() ? '⚡ Zones identified to strengthen from your nutrition profile' : '⚡ Zones identifiées à renforcer depuis votre profil nutrition');
 p.appendChild(tip);
 }

 // ─── DURÉE DE SÉANCE ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:24px'}, (window.isEnglish && window.isEnglish() ? 'Session duration' : 'Durée de vos séances')));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'What is the duration of your sessions?' : 'Quelle est la durée de vos séances ?')));
 var durationOptions = [
 {id: '45min', label: '45 min', desc: (window.isEnglish && window.isEnglish() ? '4-5 exercises · 3 sets' : '4-5 exercices · 3 séries')},
 {id: '1h', label: '1h', desc: (window.isEnglish && window.isEnglish() ? '5-6 exercises · 3-4 sets' : '5-6 exercices · 3-4 séries')},
 {id: '1h15', label: '1h15', desc: (window.isEnglish && window.isEnglish() ? '6-7 exercises · 4 sets' : '6-7 exercices · 4 séries')},
 {id: '1h30', label: '1h30', desc: (window.isEnglish && window.isEnglish() ? '7-8 exercises · 4-5 sets' : '7-8 exercices · 4-5 séries')}
 ];
 var durGrid = h('div', {'class': 'card-grid-2', style: 'margin-bottom:16px'});
 durationOptions.forEach(function(opt) {
 var isOn = S.sportSessionDuration === opt.id;
 durGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), onclick: function(){
 S.sportSessionDuration = opt.id;
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, opt.label),
 h('div', {'class': 'card-sub'}, opt.desc)
 ]));
 });
 p.appendChild(durGrid);

 p.appendChild(h('div', {style: 'height:16px'}));
 var selectedZones = Object.keys(S.sportFocus || {}).filter(function(z){ return S.sportFocus[z] > 0; });
 if (!S.sportSessionDuration) S.sportSessionDuration = '1h'; // pré-sélection par défaut
 var ok = selectedZones.length >= 2 && !!S.sportSessionDuration;
 if (selectedZones.length < 2) {
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Choose at least 2 areas to work on to continue.' : 'Choisissez au moins 2 zones à travailler pour continuer.')));
 } else if (!S.sportSessionDuration) {
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Indicate your session duration to continue.' : 'Indiquez la durée de vos séances pour continuer.')));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) {
 var _prog;
 try { _prog = generateSportProgram(); } catch(e) { console.error('[sport] generateSportProgram error:', e); }
 if (!_prog || _prog.length === 0 || _prog.every(function(d){ return !d.exercises || d.exercises.length === 0; })) {
   S._programGenerationError = (window.isEnglish && window.isEnglish() ? 'No exercise available with your constraints. Try relaxing your medical restrictions or adding equipment.' : "Aucun exercice disponible avec vos contraintes. Essayez d'assouplir vos restrictions médicales ou d'ajouter de l'équipement.");
   S.sStep = 4;
   if (window.render) window.render();
   return;
 }
 S.sportProgram = _prog;
 // FIX VALIDATION SPORTPROGRAM 2026-04 : marquer validé (bouton "Générer" explicite)
 S.sportProgramValidated = true;
 S.sportProgramValidatedAt = new Date().toISOString();
 S.selectedSportDay = 0;
 S.sStep = 4;
 window.BLACKBOX && window.BLACKBOX.log('sport_program_generated', {days: S.sportDays, focus: S.sportFocus, duration: S.sportSessionDuration});
 if (window.GAMIFICATION) GAMIFICATION.unlockBadge('first_workout');
 window.render();
 }
 }}, (window.isEnglish && window.isEnglish() ? 'Design my program' : 'Concevoir mon programme')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S._chargesFromLevel = true; S.sStep = 16; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

// ─── MACROCYCLES (3-6 mois) ───
// 1 macrocycle = 3 mésocycles de 7 semaines = 21 semaines (~5 mois).
// Rotation : Hypertrophie → Force → Transition → Hypertrophie...

function getMacroCyclePhase(cycleNum) {
 var c = ((cycleNum || 1) - 1) % 3;
 if (c === 0) return MACRO_PHASES[0]; // Hypertrophie
 if (c === 1) return MACRO_PHASES[1]; // Force
 return MACRO_PHASES[2];             // Transition
}
window.getMacroCyclePhase = getMacroCyclePhase;

// ─── SYSTÈME DE PHASES 7 SEMAINES ───

// Calcule le poids recommandé pour un exercice selon la phase courante
function getSuggestedWeight(exerciseName, reps, phase) {
 var pct = phase ? (phase.pct1rm || 0.72) : 0.72;
 // Macrocycle intensity modifier: Force phase = +12% 1RM, Transition = -10%
 var _macroBonus = getMacroCyclePhase(S.muscuCycle || 1).pct1rmBonus || 0;
 pct = Math.min(0.95, Math.max(0.40, pct + _macroBonus));
 // HTA sévère : limiter à 60% du 1RM (ESC/ESH 2018 — éviter manœuvre de Valsalva)
 if (Array.isArray(S.medical) && S.medical.indexOf('hta_severe') !== -1) {
   pct = Math.min(pct, MEDICAL_LIMITS.HTA_INTENSITY_CAP);
 }
 // Priority 1: use user's actual 1RM from strength profile (Epley-calculated)
 if (S.muscuStrengthProfile && window.MUSCU_KEY_EXERCISES) {
 var nameLow = (exerciseName || '').toLowerCase();
 var matchedEx = null;
 for (var mi = 0; mi < window.MUSCU_KEY_EXERCISES.length; mi++) {
 var kex = window.MUSCU_KEY_EXERCISES[mi];
 if ((kex.name && nameLow.indexOf(kex.name.toLowerCase().split(' ')[0]) !== -1) || nameLow.indexOf(kex.key.replace('_',' ')) !== -1) {
 matchedEx = kex; break;
 }
 }
 if (matchedEx && S.muscuStrengthProfile[matchedEx.key]) {
 var profileWeight = S.muscuStrengthProfile[matchedEx.key];
 var profileReps = S.muscuStrengthProfile[matchedEx.key + '_reps'] || 8;
 // 2026-04 FIX A3 : guard explicite (si profileReps corrompu = 0 ou négatif, fallback 8)
 // Avant : `|| 8` ne captait pas 0 (0 est falsy donc OK pour ||, mais pas les négatifs)
 if (!profileReps || profileReps <= 0 || profileReps > 30) profileReps = 8;
 if (!profileWeight || profileWeight <= 0) { profileWeight = null; /* fallthrough to Priority 2 */ }
 if (profileWeight) {
   // Calculate 1RM via Epley: weight × (1 + reps/30)
   var oneRM = profileWeight * (1 + profileReps / 30);
   // Return pct1rm × 1RM, rounded to nearest 2.5kg
   var suggested = Math.round(oneRM * pct / 2.5) * 2.5;
   // 2026-04 FIX A2 : plancher différencié par nom d'exercice (barre vide = 20kg, haltère = 2.5kg)
   // Détection conservatrice : si le nom contient "haltère/dumbbell" → 2.5, si "poulie/machine" → 5, sinon 20 (barre par défaut)
   var _nameLower = (exerciseName || '').toLowerCase();
   var _minLoad = /haltère|haltere|dumbbell|bw|pdc/.test(_nameLower) ? 2.5 :
                  /poulie|cable|machine|smith|guidé/.test(_nameLower) ? 5 :
                  20;
   return Math.max(suggested, _minLoad);
 }
 }
 }
 // Priority 2: fall back to generic getMusculationWeight
 if (window.getMusculationWeight) {
 var baseW = window.getMusculationWeight(exerciseName, null, reps);
 if (baseW && baseW > 0) {
 var adjusted = Math.round(baseW * (pct / 0.72) / 2.5) * 2.5;
 return Math.max(adjusted, 5);
 }
 }
 // Priority 3: BW-ratio estimation (estimateBaseLoad from muscu-programs.js)
 if (window.estimateBaseLoad) {
 var _lvl = S.sportLevel || 'intermediate';
 var _sex = S.sex || 'homme';
 var _bw = S.weight || 70;
 var est1RM = window.estimateBaseLoad(exerciseName, _bw, _sex, _lvl);
 if (est1RM > 0) {
 var estLoad = Math.round(est1RM * pct / 2.5) * 2.5;
 return Math.max(estLoad, 2.5);
 }
 }
 // Priority 4: débutants sans 1RM ni historique — ratio poids-du-corps
 if (S.sportLevel === 'beginner') {
   var _bwFb = S.weight || 70;
   var _sexFb = S.sex || 'homme';
   var _nameFb = (exerciseName || '').toLowerCase();
   var _ratioFb = /squat|fessier|cuisse|leg[\s-]press|rdl|deadlift|soulev/.test(_nameFb) ? (_sexFb === 'femme' ? 0.35 : 0.45)
     : /bench|développé|d[eé]velopp[eé]|press|dips|pompes|push/.test(_nameFb) ? (_sexFb === 'femme' ? 0.20 : 0.35)
     : /pull|traction|rowing|tirage|row/.test(_nameFb) ? (_sexFb === 'femme' ? 0.20 : 0.30)
     : (_sexFb === 'femme' ? 0.08 : 0.12);
   var _begLoad = Math.round(_bwFb * _ratioFb * pct / 2.5) * 2.5;
   if (_begLoad > 0) return Math.max(_begLoad, 2.5);
 }
 // Priority 5: universal fallback — never return null (would display as 0 in UI).
 // Use a conservative bodyweight-ratio estimate for any level if all else fails.
 var _bwFallback = S.weight || 70;
 var _sexFallback = S.sex || 'homme';
 var _nameFallback = (exerciseName || '').toLowerCase();
 var _ratioFallback = /squat|fessier|cuisse|leg[\s-]press|rdl|deadlift|soulev/.test(_nameFallback) ? (_sexFallback === 'femme' ? 0.30 : 0.40)
   : /bench|développé|d[eé]velopp[eé]|press|dips|push/.test(_nameFallback) ? (_sexFallback === 'femme' ? 0.18 : 0.30)
   : /pull|traction|rowing|tirage|row/.test(_nameFallback) ? (_sexFallback === 'femme' ? 0.18 : 0.25)
   : (_sexFallback === 'femme' ? 0.07 : 0.10);
 var _fallbackLoad = Math.round(_bwFallback * _ratioFallback * pct / 2.5) * 2.5;
 return Math.max(_fallbackLoad, 2.5);
}

window.getSuggestedWeight = getSuggestedWeight;

function renderSparkline(values, color) {
 color = color || '#3E5C3A';
 if (!values || !Array.isArray(values)) return null;
 // Filter out NaN/null/undefined and non-positive values
 var cleanValues = values.map(function(v) { return parseFloat(v) || 0; }).filter(function(v) { return !isNaN(v) && v > 0; });
 if (cleanValues.length < 2) return null;
 var W = 80, H = 28, pad = 3;
 var min = Math.min.apply(null, cleanValues);
 var max = Math.max.apply(null, cleanValues);
 var range = max - min || 1;
 var pts = cleanValues.map(function(v, i) {
 var x = pad + (i / (cleanValues.length - 1)) * (W - 2*pad);
 var y = H - pad - ((v - min) / range) * (H - 2*pad);
 return x.toFixed(1) + ',' + y.toFixed(1);
 });
 var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
 svg.setAttribute('width', W);
 svg.setAttribute('height', H);
 svg.setAttribute('style', 'display:inline-block;vertical-align:middle');
 var polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
 polyline.setAttribute('points', pts.join(' '));
 polyline.setAttribute('fill', 'none');
 polyline.setAttribute('stroke', color);
 polyline.setAttribute('stroke-width', '2');
 polyline.setAttribute('stroke-linecap', 'round');
 polyline.setAttribute('stroke-linejoin', 'round');
 svg.appendChild(polyline);
 // Dot final
 if (!pts || pts.length === 0) return null;
 var lastPt = pts[pts.length - 1].split(',');
 if (lastPt.length < 2) return svg; // malformed point — skip final dot
 var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
 circle.setAttribute('cx', lastPt[0]);
 circle.setAttribute('cy', lastPt[1]);
 circle.setAttribute('r', '3');
 circle.setAttribute('fill', color);
 svg.appendChild(circle);
 return svg;
}

function getProgressiveWeight(exerciseName, baseWeight, weekNumber) {
 // Récupère l'historique de cet exercice
 var history = (S.muscuProgressionHistory || {})[exerciseName] || [];

 // Si historique disponible, utilise la dernière session
 if (history.length > 0) {
 var last = history[history.length - 1];
 // Règle de progression : si toutes séries réussies → +2.5kg (upper body) ou +5kg (lower body)
 var lowerBodyKeywords = /squat|leg|fessier|ischios|mollet|presse|hip.*thrust|rdl|deadlift|soulev|cuisse|jambe/i;
 var increment = lowerBodyKeywords.test(exerciseName) ? 5 : 2.5;

 // Vérifier si la dernière session était "réussie" (toutes reps atteintes)
 // Exclure la session d'aujourd'hui (initialisée avec des nulls, pas encore validée)
 var today = new Date().toISOString().slice(0, 10);
 var lastLog = null;
 var sortedDates = Object.keys(S.muscuSessionLog || {}).filter(function(d) { return d !== today; }).sort();
 sortedDates.forEach(function(date) {
 if (S.muscuSessionLog[date] && S.muscuSessionLog[date][exerciseName]) {
 lastLog = { date: date, sets: S.muscuSessionLog[date][exerciseName] };
 }
 });

 if (lastLog) {
 var allSucceeded = lastLog.sets.every(function(s) {
 // For bodyweight exercises actualWeight is null — only check reps succeeded
 var repsOk = s.actualReps !== null && s.actualReps >= s.targetReps;
 var weightOk = (s.actualWeight === null || s.targetWeight === null || s.targetWeight === 0)
   ? true
   : s.actualWeight >= s.targetWeight;
 return repsOk && weightOk;
 });
 // FIX: guard null weight — null >= 0 is true in JS, causing phantom +2.5kg increments
 // on bodyweight exercises or entries with missing weight. Skip increment if no valid weight.
 if (allSucceeded && last.weight !== null && last.weight > 0) {
   return Math.round((last.weight + increment) / 2.5) * 2.5; // arrondi 2.5kg (disques standard)
 }
 // Bodyweight or no weight data — skip increment, return last weight (or null)
 if (last.weight !== null && last.weight > 0) return last.weight;
 return baseWeight;
 }
 // No log for this exercise — return last history weight if valid, else baseWeight
 if (last.weight !== null && last.weight > 0) return last.weight;
 return baseWeight;
 }

 // Pas d'historique → utilise le poids de base calculé
 return baseWeight;
}

// ─── REST TIMER MODULE ────────────────────────────────────────────────────
// Minuteur automatique entre les séries avec bip sonore via Web Audio API.
// Se lance automatiquement quand l'utilisateur valide une série.
// Persiste entre les re-renders via window.RestTimer.
(function initRestTimer() {
 if (window.RestTimer) return; // déjà initialisé

 var _audioCtx = null;
 function _getAudioCtx() {
 if (!_audioCtx) {
 try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { console.warn('[RestTimer] AudioContext indisponible'); }
 }
 return _audioCtx;
 }

 // Bip fort : 3 bips courts puis 1 bip long
 function playBeep() {
 if (window._sfcMuted) {
 if (navigator.vibrate) try { navigator.vibrate([200, 100, 200, 100, 400]); } catch(e) {}
 return;
 }
 var ctx = _getAudioCtx();
 if (!ctx) return;
 // Resume si suspendu (autoplay policy)
 if (ctx.state === 'suspended') ctx.resume();
 var now = ctx.currentTime;
 // 3 bips courts (0.12s chacun, 880Hz)
 for (var i = 0; i < 3; i++) {
 var osc = ctx.createOscillator();
 var gain = ctx.createGain();
 osc.connect(gain); gain.connect(ctx.destination);
 osc.type = 'square';
 osc.frequency.value = 880;
 gain.gain.value = 0.4;
 osc.start(now + i * 0.2);
 osc.stop(now + i * 0.2 + 0.12);
 }
 // 1 bip long (0.4s, 1050Hz)
 var oscL = ctx.createOscillator();
 var gainL = ctx.createGain();
 oscL.connect(gainL); gainL.connect(ctx.destination);
 oscL.type = 'square';
 oscL.frequency.value = 1050;
 gainL.gain.value = 0.5;
 oscL.start(now + 0.7);
 oscL.stop(now + 1.1);
 // Vibration si disponible
 if (navigator.vibrate) try { navigator.vibrate([200, 100, 200, 100, 400]); } catch(e) {}
 }

 // Bip court de confirmation (validation série)
 function playTick() {
 if (window._sfcMuted) return;
 var ctx = _getAudioCtx();
 if (!ctx) return;
 if (ctx.state === 'suspended') ctx.resume();
 var osc = ctx.createOscillator();
 var gain = ctx.createGain();
 osc.connect(gain); gain.connect(ctx.destination);
 osc.type = 'sine';
 osc.frequency.value = 660;
 gain.gain.value = 0.2;
 osc.start(); osc.stop(ctx.currentTime + 0.08);
 }

 var _timerId = null;
 var _state = {
 active: false,
 seconds: 0,
 total: 0,
 exerciseName: '',
 setNum: 0,
 onComplete: null
 };

 function start(seconds, exerciseName, setNum, onComplete) {
 stop(); // clear any existing timer
 _state.active = true;
 _state.seconds = seconds;
 _state.total = seconds;
 _state.exerciseName = exerciseName || '';
 _state.setNum = setNum || 0;
 _state.isTransition = false;
 _state.onComplete = onComplete || null;
 _updateUI();
 _timerId = setInterval(function() {
 _state.seconds--;
 if (_state.seconds <= 3 && _state.seconds > 0) {
 // Tick sonore pour les 3 dernières secondes
 playTick();
 }
 if (_state.seconds <= 0) {
 _state.seconds = 0;
 _state.active = false;
 clearInterval(_timerId);
 _timerId = null;
 playBeep();
 // Notification locale si l'onglet est en arrière-plan
 if (document.hidden) {
   try {
     if ('Notification' in window && Notification.permission === 'granted') {
     var _notifTitle = _state.isTransition ? (window.isEnglish && window.isEnglish() ? 'Next exercise!' : 'Exercice suivant !') : (window.isEnglish && window.isEnglish() ? 'Rest over!' : 'Repos terminé !');
     var _notifBody = _state.isTransition
       ? ((window.isEnglish && window.isEnglish() ? 'Ready for: ' : 'Prêt pour : ') + (_state.nextExercise || (window.isEnglish && window.isEnglish() ? 'next exercise' : "l'exercice suivant")))
       : ((window.isEnglish && window.isEnglish() ? 'Set ' : 'Série ') + _state.setNum + (window.isEnglish && window.isEnglish() ? ' — go!' : ' — c\'est parti !'));
     new Notification(_notifTitle, { body: _notifBody, icon: '/icons/icon-192.png', tag: 'rest-timer', requireInteraction: false });
     }
   } catch(e) {}
 }
 // Inter-série : auto-dismiss après le bip (pas d'interaction requise)
 var _cb = _state.onComplete;
 _state.onComplete = null; // évite double-callback via stop()
 var _cbFired = false;
 setTimeout(function() { stop(); if (_cb && !_cbFired) { _cbFired = true; _cb(); } }, 1200);
 } else {
 _updateUI();
 }
 }, 1000);
 }

 function stop() {
 if (_timerId) { clearInterval(_timerId); _timerId = null; }
 var _cb = _state.onComplete;
 _state.active = false;
 _state.seconds = 0;
 _state.onComplete = null;
 _updateUI();
 // Appeler le callback (re-render) après fermeture
 if (_cb) _cb();
 }

 function addTime(sec) {
 if (_state.active) {
 _state.seconds += sec;
 _state.total += sec;
 _updateUI();
 }
 }

 function getState() {
 return { active: _state.active, seconds: _state.seconds, total: _state.total, exerciseName: _state.exerciseName, setNum: _state.setNum };
 }

 function _updateUI() {
 // Placeholder — remplacé par la version enrichie ci-dessous (transition support)
 }

 // Timer transition inter-exercice (UI différente : bleu, nom du prochain exercice)
 function startTransition(seconds, fromEx, toEx, onComplete) {
 stop();
 _state.active = true;
 _state.seconds = seconds;
 _state.total = seconds;
 _state.exerciseName = fromEx || '';
 _state.nextExercise = toEx || '';
 _state.setNum = 0;
 _state.isTransition = true;
 _state.onComplete = onComplete || null;
 _updateUI();
 _timerId = setInterval(function() {
 _state.seconds--;
 if (_state.seconds <= 3 && _state.seconds > 0) playTick();
 if (_state.seconds <= 0) {
 _state.seconds = 0;
 _state.active = false;
 clearInterval(_timerId);
 _timerId = null;
 playBeep();
 // Notification locale si l'onglet est en arrière-plan
 if (document.hidden) {
   try {
     if ('Notification' in window && Notification.permission === 'granted') {
     var _notifTitle = _state.isTransition ? (window.isEnglish && window.isEnglish() ? 'Next exercise!' : 'Exercice suivant !') : (window.isEnglish && window.isEnglish() ? 'Rest over!' : 'Repos terminé !');
     var _notifBody = _state.isTransition
       ? ((window.isEnglish && window.isEnglish() ? 'Ready for: ' : 'Prêt pour : ') + (_state.nextExercise || (window.isEnglish && window.isEnglish() ? 'next exercise' : "l'exercice suivant")))
       : ((window.isEnglish && window.isEnglish() ? 'Set ' : 'Série ') + _state.setNum + (window.isEnglish && window.isEnglish() ? ' — go!' : ' — c\'est parti !'));
     new Notification(_notifTitle, { body: _notifBody, icon: '/icons/icon-192.png', tag: 'rest-timer', requireInteraction: false });
     }
   } catch(e) {}
 }
 // Transition : afficher "Commencer" et attendre le clic
 // onComplete sera appelé par stop() quand l'utilisateur clique
 _updateUI();
 } else {
 _updateUI();
 }
 }, 1000);
 }

 // Mise à jour de _updateUI pour gérer le mode transition
 // IMPORTANT: Utilise la création DOM avec addEventListener au lieu de innerHTML+onclick
 // car la CSP (script-src sans 'unsafe-inline') bloque les onclick en attributs HTML.
 var _origUpdateUI = _updateUI;
 _updateUI = function() {
 var el = document.getElementById('rest-timer-overlay');
 if (!_state.active && !_state.seconds) {
 if (el) el.style.display = 'none';
 _state.isTransition = false;
 _state.nextExercise = '';
 return;
 }
 if (!el) {
 el = document.createElement('div');
 el.id = 'rest-timer-overlay';
 el.className = 'rest-timer-overlay';
 // Tap overlay background to dismiss (fallback)
 el.addEventListener('click', function(e) {
 if (e.target === el) window.RestTimer.stop();
 });
 document.body.appendChild(el);
 }
 el.style.display = 'flex';
 el.style.position = 'fixed';
 el.style.top = '0';
 el.style.left = '0';
 el.style.right = '0';
 el.style.bottom = '0';
 el.style.zIndex = '9999';
 el.style.transform = 'none';
 el.style.transition = 'none';
 el.style.background = 'rgba(10, 10, 9, 0.85)';
 el.style.alignItems = 'center';
 el.style.justifyContent = 'center';
 el.style.flexDirection = 'column';
 el.style.color = '#FAF9F6';

 var pct = _state.total > 0 ? (_state.seconds / _state.total) : 0;
 var min = Math.floor(_state.seconds / 60);
 var sec = _state.seconds % 60;
 var timeStr = (min > 0 ? min + ':' : '') + (sec < 10 && min > 0 ? '0' : '') + sec;
 var isUrgent = _state.seconds <= 5 && _state.active;
 var isDone = _state.seconds <= 0 && !_state.active;
 var isTrans = _state.isTransition;

 var radius = 54;
 var circ = 2 * Math.PI * radius;
 var dashoffset = circ * (1 - pct);

 var cardClass = 'rest-timer-card';
 if (isTrans) cardClass += ' rest-timer-transition';
 if (isUrgent) cardClass += ' rest-timer-urgent';
 if (isDone) cardClass += ' rest-timer-done';

 var labelText = isTrans ? (window.isEnglish && window.isEnglish() ? 'Transition' : 'Transition') : (_state.exerciseName || (window.isEnglish && window.isEnglish() ? 'Rest' : 'Repos'));
 var subText = isTrans
 ? (_state.exerciseName + ' → ' + (_state.nextExercise || (window.isEnglish && window.isEnglish() ? 'Next' : 'Suivant')))
 : ((window.isEnglish && window.isEnglish() ? 'Set ' : 'Série ') + _state.setNum + (window.isEnglish && window.isEnglish() ? ' done — rest' : ' terminée — repos'));

 var goText = isTrans
 ? (_state.nextExercise || (window.isEnglish && window.isEnglish() ? 'Next exercise' : 'Exercice suivant'))
 : 'GO !';

 var totalMin = Math.floor(_state.total / 60);
 var totalSec = _state.total % 60;
 var totalStr = totalMin > 0 ? totalMin + 'min' + (totalSec > 0 ? totalSec : '') : totalSec + 's';

 // Build DOM instead of innerHTML to comply with CSP (no inline onclick)
 el.innerHTML = '';

 var card = document.createElement('div');
 card.className = cardClass;

 var label = document.createElement('div');
 label.className = 'rest-timer-label';
 label.textContent = labelText;
 card.appendChild(label);

 var sub = document.createElement('div');
 sub.className = 'rest-timer-sublabel';
 sub.textContent = subText;
 card.appendChild(sub);

 if (isTrans) {
 var reason = document.createElement('div');
 reason.className = 'rest-timer-reason';
 reason.textContent = (window.isEnglish && window.isEnglish() ? 'Adapted rest: ' : 'Repos adapté : ') + totalStr + (window.isEnglish && window.isEnglish() ? ' (profile + load + goal)' : ' (profil + charge + objectif)');
 card.appendChild(reason);
 }

 // SVG circle
 var circleWrap = document.createElement('div');
 circleWrap.className = 'rest-timer-circle-wrap';
 var ns = 'http://www.w3.org/2000/svg';
 var svg = document.createElementNS(ns, 'svg');
 svg.setAttribute('viewBox', '0 0 120 120');
 svg.setAttribute('class', 'rest-timer-svg');
 var trackCircle = document.createElementNS(ns, 'circle');
 trackCircle.setAttribute('cx', '60'); trackCircle.setAttribute('cy', '60');
 trackCircle.setAttribute('r', String(radius));
 trackCircle.setAttribute('class', 'rest-timer-track');
 svg.appendChild(trackCircle);
 var progressCircle = document.createElementNS(ns, 'circle');
 progressCircle.setAttribute('cx', '60'); progressCircle.setAttribute('cy', '60');
 progressCircle.setAttribute('r', String(radius));
 progressCircle.setAttribute('class', 'rest-timer-progress' + (isTrans ? ' rest-timer-progress-transition' : ''));
 progressCircle.style.strokeDasharray = circ.toFixed(1);
 progressCircle.style.strokeDashoffset = dashoffset.toFixed(1);
 svg.appendChild(progressCircle);
 circleWrap.appendChild(svg);

 var timeEl = document.createElement('div');
 timeEl.className = 'rest-timer-time';
 timeEl.textContent = isDone ? '\u2705' : timeStr;
 circleWrap.appendChild(timeEl);

 if (isDone) {
 var goEl = document.createElement('div');
 goEl.className = 'rest-timer-go';
 goEl.textContent = goText;
 circleWrap.appendChild(goEl);
 }
 card.appendChild(circleWrap);

 // Action buttons — using addEventListener (CSP-safe)
 var actions = document.createElement('div');
 actions.className = 'rest-timer-actions';

 if (_state.active) {
 var btn15 = document.createElement('button');
 btn15.className = 'rest-timer-btn rest-timer-btn-add';
 btn15.textContent = '+15s';
 btn15.addEventListener('click', function() { window.RestTimer.addTime(15); });
 actions.appendChild(btn15);

 var btn30 = document.createElement('button');
 btn30.className = 'rest-timer-btn rest-timer-btn-add';
 btn30.textContent = '+30s';
 btn30.addEventListener('click', function() { window.RestTimer.addTime(30); });
 actions.appendChild(btn30);

 var skipBtn = document.createElement('button');
 skipBtn.className = 'rest-timer-btn rest-timer-btn-skip';
 skipBtn.textContent = (window.isEnglish && window.isEnglish() ? 'Skip ▶' : 'Passer ▶');
 skipBtn.addEventListener('click', function() { window.RestTimer.stop(); });
 actions.appendChild(skipBtn);

 var muteBtn = document.createElement('button');
 muteBtn.className = 'rest-timer-btn rest-timer-btn-mute' + (window._sfcMuted ? ' muted' : '');
 muteBtn.textContent = window._sfcMuted ? (window.isEnglish && window.isEnglish() ? 'Muted' : 'Muet') : (window.isEnglish && window.isEnglish() ? 'Sound' : 'Son');
 muteBtn.title = window._sfcMuted ? (window.isEnglish && window.isEnglish() ? 'Muted — click to enable' : 'Son coupé — cliquer pour activer') : (window.isEnglish && window.isEnglish() ? 'Sound on — click to mute' : 'Son actif — cliquer pour couper');
 muteBtn.addEventListener('click', function() {
 window._sfcMuted = !window._sfcMuted;
 muteBtn.textContent = window._sfcMuted ? 'Muet' : 'Son';
 muteBtn.title = window._sfcMuted ? (window.isEnglish && window.isEnglish() ? 'Muted — click to enable' : 'Son coupé — cliquer pour activer') : (window.isEnglish && window.isEnglish() ? 'Sound on — click to mute' : 'Son actif — cliquer pour couper');
 if (window._sfcMuted) { muteBtn.classList.add('muted'); } else { muteBtn.classList.remove('muted'); }
 });
 actions.appendChild(muteBtn);
 } else {
 var goBtn = document.createElement('button');
 goBtn.className = 'rest-timer-btn ' + (isTrans ? 'rest-timer-btn-go-transition' : 'rest-timer-btn-go');
 goBtn.textContent = isTrans ? (window.isEnglish && window.isEnglish() ? 'Start!' : 'Commencer !') : (window.isEnglish && window.isEnglish() ? "Let's go!" : "C'est parti !");
 goBtn.addEventListener('click', function() { window.RestTimer.stop(); });
 actions.appendChild(goBtn);
 }
 card.appendChild(actions);
 el.appendChild(card);
 };

 window.RestTimer = {
 start: start,
 startTransition: startTransition,
 stop: stop,
 addTime: addTime,
 getState: getState,
 playBeep: playBeep,
 playTick: playTick
 };
})();

// ─── CALCULATEUR DE PLAQUES ──────────────────────────────────────────────────
// Calcule les plaques à mettre de chaque côté de la barre pour atteindre targetKg
// 2026-04 FIX UX : label clair (avant : "PLAQUES PAR CÔTÉ — 20KG" était ambigu — c'est
// la cible TOTALE qui était affichée, pas le poids des plaques)
function renderPlateCalculator(targetKg, barKg) {
  var PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
  barKg = barKg || 20; // barre olympique standard
  var perSideKg = (targetKg - barKg) / 2; // poids des plaques par côté
  var remaining = perSideKg;
  var result = [];

  PLATES.forEach(function(plate) {
    var count = Math.floor(remaining / plate);
    if (count > 0) {
      result.push({ plate: plate, count: count });
      remaining -= count * plate;
    }
  });

  var html = '<div class="plate-calc" style="margin:12px 0;padding:12px;border:1px solid var(--border);background:var(--ivory2)">';
  // Label clair : "Cible totale 77.5kg = barre 20kg + plaques par côté"
  if (perSideKg <= 0.1) {
    html += '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;color:var(--grey)">' + (window.isEnglish && window.isEnglish() ? 'Target ' : 'Cible ') + targetKg + ' kg \u2014 ' + (window.isEnglish && window.isEnglish() ? 'Bar only' : 'Barre seule') + '</div>';
    html += '<div style="font-size:12px;color:var(--grey)">' + (window.isEnglish && window.isEnglish() ? 'No plates needed (olympic bar ' : 'Pas de plaques nécessaires (barre olympique ') + barKg + ' kg)</div>';
  } else {
    html += '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;color:var(--grey)">' + (window.isEnglish && window.isEnglish() ? 'Target ' : 'Cible ') + targetKg + ' kg \u2014 ' + perSideKg.toFixed(1) + (window.isEnglish && window.isEnglish() ? ' kg of plates per side' : ' kg de plaques par côté') + '</div>';
    html += '<div style="font-size:11px;color:var(--grey);margin-bottom:6px">' + (window.isEnglish && window.isEnglish() ? 'Bar ' : 'Barre ') + barKg + ' kg + (' + perSideKg.toFixed(1) + ' kg × 2 ' + (window.isEnglish && window.isEnglish() ? 'sides' : 'côtés') + ') = ' + targetKg + ' kg</div>';
    result.forEach(function(r) {
      // Couleurs cohérentes design system (palette --green/--blue/--orange/--grey)
      var color = r.plate >= 20 ? 'var(--green,#3E5C3A)' : r.plate >= 10 ? 'var(--blue,#1A3A6A)' : r.plate >= 5 ? 'var(--orange,#E86F1E)' : 'var(--grey,#6B6B65)';
      html += '<span style="display:inline-block;margin:2px 4px;padding:4px 10px;background:' + color + ';color:var(--ivory,#FAF9F6);font-size:11px;font-weight:700;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;letter-spacing:0.5px">' + r.plate + 'kg × ' + r.count + '</span>';
    });
    if (remaining > 0.1) {
      html += '<div style="font-size:10px;color:var(--grey);margin-top:4px">' + (window.isEnglish && window.isEnglish() ? 'Difference: ' : 'Différence : ') + remaining.toFixed(2) + 'kg (' + (window.isEnglish && window.isEnglish() ? 'micro-plates' : 'microplaques') + ')</div>';
    }
  }
  html += '</div>';
  return html;
}
window.renderPlateCalculator = renderPlateCalculator;

// ─── TIMER DE REPOS SIMPLE (overlay fixe bas-droite) ─────────────────────────
// Exposé sur window pour permettre le nettoyage (clearInterval) lors de la navigation (render)
var _restTimerInterval = null;
window._restTimerInterval = null; // référence publique — synchronisée dans startRestTimer/stopRestTimer
var _restTimerSeconds = 0;

function startRestTimer(seconds) {
  if (_restTimerInterval) clearInterval(_restTimerInterval);
  _restTimerSeconds = seconds || 90;
  var el = document.getElementById('rest-timer-display');
  if (!el) return;

  el.style.display = 'block';
  var countEl = el.querySelector('.timer-count');
  if (countEl) {
    var m0 = Math.floor(_restTimerSeconds / 60);
    var s0 = _restTimerSeconds % 60;
    countEl.textContent = m0 + ':' + (s0 < 10 ? '0' : '') + s0;
    countEl.style.color = 'var(--ivory,#FAF9F6)';
  }

  _restTimerInterval = setInterval(function() {
    _restTimerSeconds--;
    var m = Math.floor(_restTimerSeconds / 60);
    var s = _restTimerSeconds % 60;
    var display = m + ':' + (s < 10 ? '0' : '') + s;
    var timerEl = document.getElementById('rest-timer-display');
    if (!timerEl) { clearInterval(_restTimerInterval); window._restTimerInterval = null; return; }
    var tc = timerEl.querySelector('.timer-count');
    if (tc) {
      tc.textContent = display;
      if (_restTimerSeconds <= 10) {
        tc.style.color = 'var(--red,#c0392b)';
      }
    }
    if (_restTimerSeconds <= 0) {
      clearInterval(_restTimerInterval);
      _restTimerInterval = null; window._restTimerInterval = null;
      if (tc) tc.textContent = 'GO!';
      if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch(e) {} }
    }
  }, 1000);
  window._restTimerInterval = _restTimerInterval; // sync référence publique
}

function stopRestTimer() {
  if (_restTimerInterval) { clearInterval(_restTimerInterval); _restTimerInterval = null; window._restTimerInterval = null; }
  var el = document.getElementById('rest-timer-display');
  if (el) el.style.display = 'none';
}

window.startRestTimer = startRestTimer;
window.stopRestTimer = stopRestTimer;

// Attach rest timer button listeners (CSP-compliant : pas d'inline onclick)
function _attachRestTimerButtons() {
  var preset = document.querySelectorAll('[data-rest-seconds]');
  preset.forEach(function(btn) {
    if (btn._rtBound) return;
    btn._rtBound = true;
    btn.addEventListener('click', function() {
      var s = parseInt(btn.getAttribute('data-rest-seconds'), 10);
      if (s > 0) startRestTimer(s);
    });
  });
  var stopBtn = document.getElementById('rest-timer-stop');
  if (stopBtn && !stopBtn._rtBound) {
    stopBtn._rtBound = true;
    stopBtn.addEventListener('click', stopRestTimer);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _attachRestTimerButtons);
} else {
  _attachRestTimerButtons();
}

// Utilitaire : parse rest time string ("2min", "1min30", "90s", "45s") → secondes
function parseRestTime(restStr) {
 if (!restStr) return 90; // défaut 90s
 var s = String(restStr).toLowerCase().trim();
 var mMatch = s.match(/^(\d+)\s*min\s*(\d+)?/);
 if (mMatch) {
 return parseInt(mMatch[1]) * 60 + (mMatch[2] ? parseInt(mMatch[2]) : 0);
 }
 var sMatch = s.match(/^(\d+)\s*s/);
 if (sMatch) return parseInt(sMatch[1]);
 var num = parseInt(s);
 return isNaN(num) ? 90 : (num < 10 ? num * 60 : num); // "2" → 120s, "90" → 90s
}
window.parseRestTime = parseRestTime;

// ─── TRANSITION TIME BETWEEN EXERCISES ────────────────────────────────────
// Calcul du temps de repos optimal entre deux exercices basé sur :
// - Type d'exercice (compound→compound, compound→isolation, isolation→isolation)
// - Intensité de la charge (%1RM via la phase du cycle)
// - Niveau de l'utilisateur (débutant = +30% repos, avancé = −10%)
// - Objectif (force = long repos, sèche = court repos)
// - Standards NSCA (Haff & Triplett 2016), ACSM 2009, de Salles 2009
//
// Standards internationaux (NSCA Essentials, 4th ed.):
// Compound → Compound (même groupe) : 3-5 min
// Compound → Isolation : 2-3 min
// Isolation → Isolation : 1-2 min
// Compound → Compound (diff groupe) : 2-3 min
function getExerciseTransitionTime(prevEx, nextEx) {
 if (!prevEx || !nextEx) return 120; // défaut 2min

 var s = window.S;
 var level = s.sportLevel || 'intermediate';
 var goalKey = (s.goal !== null && window.GOALS && window.GOALS[s.goal]) ? window.GOALS[s.goal].key : 'maintain';

 // Phase du cycle → intensité de la charge (session-driven)
 var phase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(sfcGetEffectiveWeek()) : null;
 var pct1rm = phase ? (phase.pct1rm || 0.72) : 0.72;

 // Déterminer le type d'exercice (compound vs isolation)
 var prevType = (prevEx.type || '').toLowerCase();
 var nextType = (nextEx.type || '').toLowerCase();
 // Heuristique compound si pas de propriété type
 function _isCompoundHeuristic(ex) {
 if (ex.type) return /compound/i.test(ex.type);
 var n = (ex.n || ex.name || '').toLowerCase();
 return /squat|deadlift|soulev|bench|developp|press|rowing|traction|clean|snatch|hip.?thrust|fente|lunge|dip/i.test(n);
 }
 var prevIsCompound = _isCompoundHeuristic(prevEx) || prevType === 'superset';
 var nextIsCompound = _isCompoundHeuristic(nextEx) || nextType === 'superset';

 // Même groupe musculaire ?
 var prevMuscle = (prevEx.m || prevEx.muscle || '').toLowerCase();
 var nextMuscle = (nextEx.m || nextEx.muscle || '').toLowerCase();
 var sameMuscle = prevMuscle && nextMuscle && (
 prevMuscle.indexOf(nextMuscle.split(/[+(,]/)[0].trim()) >= 0 ||
 nextMuscle.indexOf(prevMuscle.split(/[+(,]/)[0].trim()) >= 0
 );

 // ── Base time (secondes) selon le pattern NSCA ──
 var baseTime;
 if (prevIsCompound && nextIsCompound) {
 baseTime = sameMuscle ? 240 : 180; // 4min même muscle, 3min diff
 } else if (prevIsCompound || nextIsCompound) {
 baseTime = 150; // 2min30 compound→isolation ou inverse
 } else {
 baseTime = 90; // 1min30 isolation→isolation
 }

 // ── Modificateur intensité (charge lourde = plus de repos) ──
 // >85% 1RM (force) : +40% | 70-85% (hypertrophie) : +0% | <70% (endurance) : −20%
 if (pct1rm >= 0.85) baseTime = Math.round(baseTime * 1.4);
 else if (pct1rm < 0.70) baseTime = Math.round(baseTime * 0.80);

 // ── Modificateur objectif ──
 // Force/puissance : +20% (récupération neuromusculaire — NSCA)
 // Sèche/shred : −25% (stress métabolique, densité de l'entraînement — Schoenfeld 2010)
 // Volume/hypertrophie : +0% (standard)
 if (goalKey === 'bulk' || goalKey === 'lean_bulk') {
 // Phase de prise : tendance force → repos allongé
 baseTime = Math.round(baseTime * 1.10);
 } else if (goalKey === 'shred') {
 baseTime = Math.round(baseTime * 0.75);
 } else if (goalKey === 'cut') {
 baseTime = Math.round(baseTime * 0.85);
 }

 // ── Modificateur niveau ──
 // Débutant : +30% (CNS moins entraîné, récupération plus lente — Kraemer 2002)
 // Intermédiaire : +0%
 // Avancé : −10% (meilleure capacité de récupération — Rhea 2003)
 if (level === 'beginner' || level === 'debutant') {
 baseTime = Math.round(baseTime * 1.30);
 } else if (level === 'advanced' || level === 'avance') {
 baseTime = Math.round(baseTime * 0.90);
 }

 // ── Âge : +15% si ≥50 ans (récupération neuromusculaire ralentie — Hunter 2004) ──
 var _ageR = getAge(); if (_ageR && _ageR >= 50) baseTime = Math.round(baseTime * 1.15);

 // ── Clamp : minimum 60s, maximum 360s (6min) ──
 return Math.max(60, Math.min(360, Math.round(baseTime / 5) * 5)); // arrondi 5s
}
window.getExerciseTransitionTime = getExerciseTransitionTime;

function saveMuscuSessionLog() {
 try {
 var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 // ── Pruning : garder les 90 derniers jours de session log (évite quota localStorage) ──
 var _cutoff = new Date(); _cutoff.setDate(_cutoff.getDate() - 90);
 var _cutStr = _cutoff.toISOString().slice(0, 10);
 if (!S.muscuSessionLog || typeof S.muscuSessionLog !== 'object' || Array.isArray(S.muscuSessionLog)) S.muscuSessionLog = {};
 Object.keys(S.muscuSessionLog).forEach(function(d) { if (d < _cutStr) delete S.muscuSessionLog[d]; });
 localStorage.setItem('mtd_muscu_session_' + uid, JSON.stringify(S.muscuSessionLog));
 // Sync vers Supabase
 if (window.SupaSync) {
 var _today = new Date().toISOString().slice(0, 10);
 var _todayLog = S.muscuSessionLog[_today];
 if (_todayLog) {
 Object.keys(_todayLog).forEach(function(exName) {
 SupaSync.saveMuscuLog(_today, exName, _todayLog[exName]);
 });
 }
 }

 // Mettre à jour l'historique de progression — SEULEMENT pour la date du jour
 var _today2 = new Date().toISOString().slice(0, 10);
 var _todayLog = S.muscuSessionLog ? S.muscuSessionLog[_today2] : null;
 if (!S.muscuProgressionHistory) S.muscuProgressionHistory = {};
 if (_todayLog) {
 Object.keys(_todayLog).forEach(function(exName) {
 var sets = _todayLog[exName];
 if (!Array.isArray(sets)) return;
 var completedW = sets.filter(function(s) { return s.actualWeight !== null; });
 var completedR = sets.filter(function(s) { return s.actualReps !== null; });
 if (completedW.length === 0 && completedR.length === 0) return;
 var avgWeight = completedW.length > 0 ? completedW.reduce(function(sum, s) { return sum + (+(s.actualWeight) || 0); }, 0) / completedW.length : 0;
 var avgReps = completedR.length > 0 ? completedR.reduce(function(sum, s) { return sum + (s.actualReps || 0); }, 0) / completedR.length : 0;
 if (isNaN(avgWeight) || isNaN(avgReps)) return;

 if (!S.muscuProgressionHistory[exName]) S.muscuProgressionHistory[exName] = [];
 var existing = S.muscuProgressionHistory[exName].find(function(entry) { return entry.date === _today2; });
 if (!existing) {
 S.muscuProgressionHistory[exName].push({
 date: _today2,
 week: S.muscuWeek || 1,
 weight: Math.round(avgWeight / 2.5) * 2.5,
 reps: Math.round(avgReps)
 });
 if (S.muscuProgressionHistory[exName].length > 365) {
 S.muscuProgressionHistory[exName] = S.muscuProgressionHistory[exName].slice(-365);
 }
 }
 });
 }
 localStorage.setItem('mtd_muscu_progression_' + uid, JSON.stringify(S.muscuProgressionHistory));

 // Track muscu session count for badges
 if (window.GAMIFICATION) {
  var sessionCount = GAMIFICATION.incrementCounter('muscu_sessions');
  if (sessionCount >= 10) GAMIFICATION.unlockBadge('muscu_sessions_10');
  if (sessionCount >= 50) GAMIFICATION.unlockBadge('muscu_sessions_50');
  // Check strength profile badges on each session save
  if (S.muscuStrengthProfile) GAMIFICATION.checkMuscuBadges(S.muscuStrengthProfile);
 }
 // Consistency milestone detection — stored for display in session completion panel
 try {
   var _cs = getMuscuConsistencyStreak ? getMuscuConsistencyStreak() : null;
   if (_cs && _cs.milestone) {
     S._consistencyMilestone = _cs.milestone;
     if (window.GAMIFICATION) {
       if (_cs.milestone.xp && GAMIFICATION.unlockBadge) GAMIFICATION.unlockBadge('sessions_3');
       if (_cs.milestone.type === 'badge' && GAMIFICATION.unlockBadge) GAMIFICATION.unlockBadge('streak_7');
       if (_cs.milestone.type === 'unlock' && GAMIFICATION.unlockBadge) GAMIFICATION.unlockBadge('streak_14');
     }
   }
   if (_cs) S._muscuStreak = _cs.streak;
 } catch(_ec) {}
 } catch (e) {
 console.warn('[saveMuscuSessionLog] localStorage error:', e);
 if (e && e.name === 'QuotaExceededError' && window.showToast) {
   window.showToast((window.isEnglish && window.isEnglish()) ? 'Storage full — session not saved. Free up space.' : 'Stockage plein — séance non sauvegardée. Libérez de l\'espace.', 'error', 4000);
 }
 }
}
window.saveMuscuSessionLog = saveMuscuSessionLog;

// Returns { streak, totalSessions, milestone } — streak = consecutive distinct training days
function getMuscuConsistencyStreak() {
 // 60-second cache — function called on every program render, no need to recompute every time
 var _now = Date.now();
 if (S._streakCache && S._streakCacheTime && (_now - S._streakCacheTime) < 60000) return S._streakCache;
 var log = S.muscuSessionLog || {};
 var dates = Object.keys(log).filter(function(d) {
   var exs = log[d];
   if (!exs || typeof exs !== 'object') return false;
   return Object.keys(exs).some(function(ex) {
     var sets = exs[ex];
     return Array.isArray(sets) && sets.some(function(s) { return s.validated; });
   });
 }).sort();
 var totalSessions = dates.length;
 if (totalSessions === 0) return { streak: 0, totalSessions: 0, milestone: null };
 var today = new Date().toISOString().slice(0, 10);
 var lastDate = dates[dates.length - 1];
 var daysSinceLast = Math.round((new Date(today) - new Date(lastDate)) / 86400000);
 // Streak resets if last session was more than 1 day ago
 if (daysSinceLast > 1) return { streak: 0, totalSessions: totalSessions, milestone: null };
 // Count consecutive days ending at lastDate (walk backwards through sorted dates)
 var streak = 1;
 var prevDay = new Date(lastDate);
 for (var i = dates.length - 2; i >= 0; i--) {
   prevDay.setDate(prevDay.getDate() - 1);
   if (dates[i] === prevDay.toISOString().slice(0, 10)) {
     streak++;
   } else {
     break;
   }
 }
 var milestone = null;
 if (totalSessions === 3) milestone = { type: 'xp', msg: (window.isEnglish && window.isEnglish() ? '+50 XP — 3 sessions completed!' : '+50 XP — 3 séances au compteur !'), xp: 50 };
 else if (streak === 7) milestone = { type: 'badge', msg: (window.isEnglish && window.isEnglish() ? 'Fire Week badge unlocked!' : 'Badge Semaine de Feu débloqué !'), icon: (window.isEnglish && window.isEnglish() ? 'Fire Week' : 'Semaine de Feu') };
 else if (streak === 14) milestone = { type: 'unlock', msg: (window.isEnglish && window.isEnglish() ? '2 weeks without pause — advanced exercises unlocked!' : '2 semaines sans pause — exercices avancés débloqués !'), icon: 'Elite' };
 var _result = { streak: streak, totalSessions: totalSessions, milestone: milestone };
 S._streakCache = _result;
 S._streakCacheTime = Date.now();
 return _result;
}
window.getMuscuConsistencyStreak = getMuscuConsistencyStreak;

function getMuscuPhase(week) {
 for (var i = 0; i < MUSCU_PHASES.length; i++) {
 if (MUSCU_PHASES[i].weeks.indexOf(week) !== -1) return MUSCU_PHASES[i];
 }
 return MUSCU_PHASES[0];
}

// Session-driven week derivation — replaces manual S.muscuWeek as primary authority.
// Maps SFCEngine programWeek (1-4) to MUSCU_PHASES week numbers (1, 3, 5, 7).
// Falls back to S.muscuWeek if SFCEngine is not loaded or sessions are empty.
function sfcGetEffectiveWeek() {
  if (window.SFCEngine && window.SFCSymbiosis && window.SFCSymbiosis.getSFCSessions) {
    try {
      var _sessions = window.SFCSymbiosis.getSFCSessions();
      if (_sessions.length > 0) {
        var _prog = window.SFCEngine.computeCycleProgression(_sessions);
        var _wkMap = {1: 1, 2: 3, 3: 5, 4: 7};
        var _derived = _wkMap[_prog.programWeek] || 1;
        // Sync S.muscuWeek so week tracker and any direct reads stay accurate
        if (window.S) window.S.muscuWeek = _derived;
        return _derived;
      }
    } catch (_) {}
  }
  return (window.S && window.S.muscuWeek) || 1;
}
window.sfcGetEffectiveWeek = sfcGetEffectiveWeek;

function applyPhaseToExercise(ex, phase) {
 var result = JSON.parse(JSON.stringify(ex));
 var baseSets = typeof result.sets === 'number' ? result.sets : 4;
 var macroBonus = getMacroCyclePhase(S.muscuCycle || 1).setsBonus || 0;
 result.sets = Math.max(2, baseSets + phase.setsOffset + macroBonus);
 if (typeof result.reps === 'number') {
  // Force macrophase: reduce reps to favour intensity
  var macroId = getMacroCyclePhase(S.muscuCycle || 1).id;
  var macroRepsOffset = macroId === 'force' ? -3 : macroId === 'transition' ? -1 : 0;
  result.reps = Math.max(3, result.reps + phase.repsOffset + macroRepsOffset);
 }
 return result;
}

function saveMuscuWeek(week) {
 S.muscuWeek = week;
 try {
 var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 localStorage.setItem('mtd_muscu_week_' + uid, String(week));
 if (!S.muscuProgramStart) {
 S.muscuProgramStart = new Date().toISOString().split('T')[0];
 localStorage.setItem('mtd_muscu_start_' + uid, S.muscuProgramStart);
 }
 } catch (e) {
 console.warn('[saveMuscuWeek] localStorage error:', e);
 }
}

function loadMuscuWeek() {
 try {
 var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var w = parseInt(localStorage.getItem('mtd_muscu_week_' + uid), 10);
 if (!isNaN(w) && w >= 1) S.muscuWeek = w;
 var start = localStorage.getItem('mtd_muscu_start_' + uid);
 if (start) S.muscuProgramStart = start;
 var c = parseInt(localStorage.getItem('mtd_muscu_cycle_' + uid), 10);
 if (!isNaN(c) && c >= 1) S.muscuCycle = c;
 } catch (e) {
 console.warn('[loadMuscuWeek] localStorage error:', e);
 }
}

function renderWeekTracker(p) {
 loadMuscuWeek();
 var week = (typeof sfcGetEffectiveWeek === 'function') ? sfcGetEffectiveWeek() : (S.muscuWeek || 1);
 var phase = getMuscuPhase(week);
 var cycleNum = S.muscuCycle || 1;
 var macroPhase = getMacroCyclePhase(cycleNum);

 // ─── MACROCYCLE BANNER ───
 var totalMesoInMacro = 3;
 var mesoInMacro = ((cycleNum - 1) % totalMesoInMacro) + 1;
 var macroCycleNum = Math.ceil(cycleNum / totalMesoInMacro);
 var macroContainer = h('div', {
  style: 'margin-bottom:16px;padding:14px 16px 16px;border-left:2px solid ' + macroPhase.color + ';background:var(--ivory2,#F4F2EB);'
 });
 var macroHeader = h('div', {style: 'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px'});
 macroHeader.appendChild(h('div', {style: 'display:flex;flex-direction:column;gap:3px'}, [
  h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65)'}, 'Macrocycle ' + macroCycleNum),
  h('span', {style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;color:var(--black,#0A0A09)'}, macroPhase.label),
 ]));
 macroHeader.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65)'}, (window.isEnglish && window.isEnglish() ? 'Mesocycle ' : 'Mésocycle ') + mesoInMacro + '\u202f/\u202f' + totalMesoInMacro));
 macroContainer.appendChild(macroHeader);

 var macroBar = h('div', {style: 'display:flex;gap:3px;height:3px;margin-bottom:12px'});
 ['Hypertrophie','Force','Transition'].forEach(function(phLabel, idx) {
  var isActive = idx === (cycleNum - 1) % 3;
  var isDone = idx < (cycleNum - 1) % 3;
  var segColor = [MACRO_PHASES[0].color, MACRO_PHASES[1].color, MACRO_PHASES[2].color][idx];
  macroBar.appendChild(h('div', {
   title: phLabel,
   style: 'flex:1;height:3px;border-radius:0;background:' + (isActive ? segColor : isDone ? segColor : 'var(--border,#D8D8D0)') + ';opacity:' + (isActive ? '1' : isDone ? '0.4' : '1') + ';transition:all .3s ease;'
  }));
 });
 macroContainer.appendChild(macroBar);

 var macroBarLabels = h('div', {style: 'display:flex;gap:3px;margin-bottom:12px'});
 ['Hypertrophie','Force','Transition'].forEach(function(phLabel, idx) {
  var isActive = idx === (cycleNum - 1) % 3;
  macroBarLabels.appendChild(h('div', {style: 'flex:1;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + (isActive ? 'var(--black,#0A0A09)' : 'var(--grey,#6B6B65)') + ';opacity:' + (isActive ? '1' : '0.6')}, phLabel));
 });
 macroContainer.appendChild(macroBarLabels);

 macroContainer.appendChild(h('div', {
  style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.65;border-top:1px solid var(--border,#D8D8D0);padding-top:12px;'
 }, macroPhase.tip));

 p.appendChild(macroContainer);

 var container = h('div', {style: 'border:2px solid ' + phase.color + ';padding:16px;margin-bottom:20px;background:var(--ivory2)'});

 // Phase badge + week
 var top = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px'});
 var badge = h('div', {style: 'display:flex;align-items:center;gap:8px'});
 badge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#fff;background:' + phase.color + ';padding:3px 8px'}, phase.label));
 badge.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:13px;color:' + phase.color}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + week + ' / 7'));
 top.appendChild(badge);
 if (S.muscuProgramStart) {
 top.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Start: ' : 'Début : ') + S.muscuProgramStart));
 }
 container.appendChild(top);

 // Progress bar (7 squares)
 var squares = h('div', {style: 'display:flex;gap:3px;margin-bottom:12px'});
 for (var w2 = 1; w2 <= 7; w2++) {
 (function(wk) {
 var ph = getMuscuPhase(wk);
 var isActive = wk === week;
 var isDone = wk < week;
 var sq = h('div', {
 style: 'flex:1;height:8px;cursor:pointer;transition:all 0.2s ease;' +
 (isActive ? 'background:' + ph.color + ';transform:scaleY(1.5)' :
 isDone ? 'background:' + ph.color + ';opacity:0.4' : 'background:var(--border)'),
 title: 'Semaine ' + wk + ' — ' + ph.label,
 onclick: function() { saveMuscuWeek(wk); window.render(); }
 });
 squares.appendChild(sq);
 })(w2);
 }
 container.appendChild(squares);

 // Phase labels under squares
 var labels = h('div', {style: 'display:flex;gap:3px;margin-bottom:10px'});
 ['S1','S2','S3','S4','S5','S6','S7'].forEach(function(lbl, idx) {
 labels.appendChild(h('div', {style: 'flex:1;text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey)'}, lbl));
 });
 container.appendChild(labels);

 // RPE badge — T1D cap: RPE max 7 (hypoglycémie à intensité élevée — ADA 2023, ACSM 2016)
 var hasT1D = Array.isArray(S.medical) && S.medical.indexOf('diabete_t1') !== -1;
 var displayRpe = phase.rpe;
 var displayRpeNote = phase.rpeNote;
 if (hasT1D && phase.rpe > 7) {
 displayRpe = 7;
 displayRpeNote = (window.isEnglish && window.isEnglish() ? 'RPE 7 — Capped at 7/10 for T1 diabetes (hypoglycemia risk at RPE 8-9, ADA 2023). Blood glucose monitor required.' : 'RPE 7 — Plafonné à 7/10 pour diabète T1 (risque hypoglycémie à RPE 8-9, ADA 2023). Glucomètre obligatoire.');
 }
 var rpeBadge = h('div', {style: 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid ' + phase.color + ';margin-bottom:8px'});
 rpeBadge.appendChild((function(){ var _rb = h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:' + phase.color}); _rb.appendChild(termTooltip('RPE', (window.isEnglish && window.isEnglish() ? 'Rate of Perceived Exertion — perceived effort out of 10 (7/10 = moderate effort, last hard reps)' : 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)'))); _rb.appendChild(document.createTextNode(' ' + displayRpe + '/10')); return _rb; })());
 rpeBadge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, displayRpeNote.replace('RPE ' + displayRpe + ' — ', '')));
 container.appendChild(rpeBadge);

 // Phase advice
 container.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.5;margin-bottom:8px;padding-left:8px;border-left:2px solid ' + phase.color}, phase.advice));
 container.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:12px'}, phase.restNote));

 // Buttons
 var btnRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap'});
 if (week < 7) {
 btnRow.appendChild(h('button', {
 style: 'flex:1;padding:10px;background:' + phase.color + ';color:#fff;border:none;font-family:Georgia,serif;font-size:13px;cursor:pointer',
 onclick: function() { saveMuscuWeek(week + 1); window.render(); }
 }, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + (week + 1) + ' \u2192'));
 } else {
 btnRow.appendChild(h('button', {
 style: 'flex:1;padding:10px;background:var(--ink-900,#0A0A09);color:#fff;border:none;font-family:Georgia,serif;font-size:13px;cursor:pointer',
 onclick: function() {
 S.muscuProgramStart = new Date().toISOString().split('T')[0];
 S.muscuCycle = (S.muscuCycle || 1) + 1;
 var uid2 = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 try { localStorage.setItem('mtd_muscu_start_' + uid2, S.muscuProgramStart); } catch(e) { console.warn('[muscu_cycle] localStorage error:', e); }
 try { localStorage.setItem('mtd_muscu_cycle_' + uid2, String(S.muscuCycle)); } catch(e) { console.warn('[muscu_cycle] localStorage error:', e); }
 try {
   var _newProg = generateSportProgram();
   if (_newProg && _newProg.length) {
     S.sportProgram = _newProg;
     // FIX VALIDATION SPORTPROGRAM 2026-04 : marquer validé (nouveau cycle explicite)
     S.sportProgramValidated = true;
     S.sportProgramValidatedAt = new Date().toISOString();
   }
 } catch(e) { console.error('[nouveau_cycle] generateSportProgram failed', e); }
 S.selectedSportDay = 0;
 saveMuscuWeek(1);
 window.render();
 }
 }, (window.isEnglish && window.isEnglish() ? '↻ New cycle (Week 1)' : '↻ Nouveau cycle (Semaine 1)')));
 }
 btnRow.appendChild(h('button', {
 style: 'padding:10px 14px;background:var(--ivory);color:var(--grey);border:1px solid var(--border);font-family:"Helvetica Neue",sans-serif;font-size:11px;cursor:pointer',
 onclick: function() {
 if (week > 1) { saveMuscuWeek(week - 1); window.render(); }
 },
 disabled: week <= 1
 }, (window.isEnglish && window.isEnglish() ? '← Prev. week' : '← Sem. préc.')));
 container.appendChild(btnRow);

 p.appendChild(container);
}

// ─── STEP 4 (Muscu): PROGRAMME ───
// ─── CALORIE BURN ESTIMATION ───
// Durée réelle estimée à partir des exercices (séries × reps + repos)
function calcSessionDuration(exercises) {
 var totalSec = 480; // 8 min échauffement
 (exercises || []).forEach(function(ex) {
 var sets = 3, reps = 10;
 var sm = String(ex.sets || '').match(/^(\d+)[x\u00d7](\d+)/);
 if (sm) { sets = parseInt(sm[1]); reps = parseInt(sm[2]); }
 var isCompound = /(squat|soulevé|développé|rowing|presse|hip thrust|fente|deadlift|tirage|pull)/i.test(ex.n || '');
 var tSet = reps * (isCompound ? 3.5 : 2.5);
 // FIX 2026-04-28 : repos réaliste — composé 120s, isolation 60s (avant flat 90s → sous-estimait
 // la durée réelle de 20-25%). NSCA CSCS §18 : repos inter-série composés = 2-3 min.
 var rest = isCompound ? 120 : 60;
 var rm = String(ex.rest || '').match(/(\d+)\s*min/i);
 var rs = String(ex.rest || '').match(/^(\d+)\s*s/i);
 if (rm) rest = parseInt(rm[1]) * 60;
 else if (rs) rest = parseInt(rs[1]);
 totalSec += sets * tSet + (sets - 1) * rest;
 });
 totalSec += 300; // 5 min récupération
 return Math.max(20, Math.round(totalSec / 60));
}

// ─── SCORING MOTEUR MUSCULATION (100 pts) ───────────────────────────────────
// Évalue chaque séance générée sur 10 critères. Seuil de passage : 85/100.
// Utilisé en QA interne et exposé sur l'objet day pour le debug produit.
function scoreSession(exercises, params) {
  if (!exercises || !exercises.length) return { total: 0, breakdown: {}, pass: false };
  var p = params || {};
  var level    = p.level    || 'intermediate';
  var duration = p.duration || '1h';
  var equipment= p.equipment|| 'gym';
  var groups   = p.groups   || [];
  var breakdown = {};

  var _getTier = function(ex) {
    var t = ex.tags || [];
    if (t.indexOf('finisher')  !== -1) return 4;
    if (t.indexOf('isolation') !== -1) return 3;
    if (t.indexOf('compose')   !== -1) return (t.indexOf('force') !== -1 || t.indexOf('powerlifting') !== -1) ? 0 : 1;
    return 2;
  };

  // 1. Structure (20 pts) — composé en 1er, isolation après composés
  (function() {
    var pts = 20;
    var tiers = exercises.map(_getTier);
    if (tiers[0] >= 3) pts -= 10; // isolation/finisher en 1er
    else if (tiers[0] === 2) pts -= 4; // neutre en 1er
    var lastComp = -1, firstIso = exercises.length;
    tiers.forEach(function(t, i) { if (t <= 1) lastComp = i; if (t >= 3 && i < firstIso) firstIso = i; });
    if (firstIso < lastComp) pts -= 8; // isolation avant composé
    breakdown.structure = Math.max(0, pts);
  })();

  // 2. Pertinence des exercices (15 pts) — % d'exos issus des groupes cibles
  (function() {
    if (!groups.length) { breakdown.pertinence = 15; return; }
    var poolSet = {};
    groups.forEach(function(g) {
      ((window.EXERCISES && window.EXERCISES[g]) || []).forEach(function(ex) { poolSet[(ex.n||'').toLowerCase().trim()] = true; });
    });
    var matched = exercises.filter(function(ex) { return poolSet[(ex.n||'').toLowerCase().trim()]; }).length;
    var r = matched / exercises.length;
    breakdown.pertinence = r >= 0.85 ? 15 : r >= 0.7 ? 11 : r >= 0.5 ? 7 : 3;
  })();

  // 3. Respect du niveau (10 pts) — pas d'exo lv > niveau utilisateur
  (function() {
    var maxLvMap = { beginner: 2, intermediate: 3, advanced: 4, pro: 5 };
    var maxLv = maxLvMap[level] || 3;
    var hard = exercises.filter(function(ex) { return (ex.lv||1) > maxLv; }).length;
    breakdown.niveau = hard === 0 ? 10 : hard === 1 ? 7 : hard === 2 ? 4 : 0;
  })();

  // 4. Respect des zones ciblées (10 pts) — chaque groupe représenté
  (function() {
    if (!groups.length) { breakdown.zones = 10; return; }
    var covered = {}; groups.forEach(function(g) { covered[g] = false; });
    var pools = {};
    groups.forEach(function(g) {
      var s = {}; ((window.EXERCISES && window.EXERCISES[g]) || []).forEach(function(ex) { s[(ex.n||'').toLowerCase().trim()] = true; }); pools[g] = s;
    });
    exercises.forEach(function(ex) {
      var k = (ex.n||'').toLowerCase().trim();
      groups.forEach(function(g) { if (pools[g][k]) covered[g] = true; });
    });
    var miss = Object.keys(covered).filter(function(g) { return !covered[g]; }).length;
    breakdown.zones = miss === 0 ? 10 : miss === 1 ? 7 : miss <= 2 ? 4 : 0;
  })();

  // 5. Cohérence volume/intensité (10 pts) — total séries dans plage cible
  (function() {
    var ranges = { '45min':[9,16], '1h':[12,20], '1h15':[16,28], '1h30':[18,32] };
    var r = ranges[duration] || [12, 24];
    var tot = exercises.reduce(function(s, ex) { var m = String(ex.sets||'').match(/^(\d+)/); return s + (m ? parseInt(m[1]) : 3); }, 0);
    breakdown.volume = (tot >= r[0] && tot <= r[1]) ? 10 : Math.abs(tot - (r[0]+r[1])/2) < 5 ? 6 : 3;
  })();

  // 6. Équilibre machines/poids libres/BW (10 pts)
  (function() {
    var pts = 10;
    var bw = 0;
    exercises.forEach(function(ex) {
      var t = ex.tags||[], eq = (ex.eq||'').toLowerCase().trim();
      if (/^poids du corps$/i.test(eq) || t.indexOf('poids-du-corps') !== -1) bw++;
    });
    if (equipment === 'gym' && bw / exercises.length > 0.4) pts -= 5;
    var machineN = exercises.filter(function(ex) { return (ex.tags||[]).indexOf('machine') !== -1; }).length;
    if (machineN / exercises.length > 0.8) pts -= 3;
    breakdown.equilibre = Math.max(0, pts);
  })();

  // 7. Absence de doublons (5 pts)
  (function() {
    var seen = {}, dups = 0;
    exercises.forEach(function(ex) { var k=(ex.n||'').toLowerCase().trim(); if (seen[k]) dups++; seen[k]=true; });
    breakdown.doublons = dups === 0 ? 5 : 0;
  })();

  // 8. Respect de la durée (5 pts) — durée estimée ± tolérance
  (function() {
    var targets = { '45min':45, '1h':60, '1h15':75, '1h30':90 };
    var target = targets[duration] || 60;
    var est = (typeof calcSessionDuration === 'function') ? calcSessionDuration(exercises) : 0;
    if (!est) { breakdown.duree = 3; return; }
    var diff = Math.abs(est - target);
    breakdown.duree = diff <= 12 ? 5 : diff <= 22 ? 3 : diff <= 35 ? 1 : 0;
  })();

  // 9. Progression logique intra-séance (10 pts) — tiers croissants
  (function() {
    var pts = 10;
    var tiers = exercises.map(_getTier);
    var regressions = 0;
    for (var i = 1; i < tiers.length; i++) { if (tiers[i] < tiers[i-1] - 1) regressions++; }
    breakdown.progression = regressions >= 2 ? 3 : regressions === 1 ? 7 : pts;
  })();

  // 10. Cohérence nutrition/sport (5 pts) — volume justifie apports
  (function() {
    var minEx = { '45min':3, '1h':4, '1h15':5, '1h30':6 }[duration] || 4;
    breakdown.nutrition = exercises.length >= minEx ? 5 : 2;
  })();

  var total = Object.keys(breakdown).reduce(function(s, k) { return s + breakdown[k]; }, 0);
  return { total: total, breakdown: breakdown, pass: total >= 85 };
}
window.scoreSession = scoreSession;

// Dépense calorique personnalisée — MET (Ainsworth 2011) pour musculation + Keytel 2005 pour cardio
// NOTE: La formule Keytel (FC-based) est valide pour exercice aérobique CONTINU.
// Pour la musculation (effort intermittent), elle surestime de ~2x (MET musculation = 5-6 vs course).
// On utilise donc MET pour la résistance et Keytel pour les séances à dominante cardio.
function calcSessionKcal(exercises, durationMin) {
 var s = window.S;
 var weight = _resolveBodyWeight();
 var age = getAge() || 30;
 var sex = window.isFemale(s) ? 'femme' : 'homme';
 // Phase courante → RPE (session-driven)
 var phase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(sfcGetEffectiveWeek()) : null;
 var rpe = phase ? phase.rpe : 7;

 // Déterminer si la séance est à dominante cardio ou musculation
 var cardioKeywords = ['cardio', 'course', 'running', 'vélo', 'rowing', 'jumping', 'burpee', 'hiit'];
 var cardioCount = 0;
 (exercises || []).forEach(function(ex) {
 var m_lower = (ex.m || '').toLowerCase();
 cardioKeywords.forEach(function(kw) { if (m_lower.indexOf(kw) >= 0) cardioCount++; });
 });
 var isCardioSession = (exercises && exercises.length > 0) && (cardioCount / exercises.length >= 0.5);

 var base, hr;
 if (isCardioSession) {
 // Keytel et al. 2005 — valide pour aérobique continu
 var pctHR = rpe <= 5 ? 0.57 : rpe <= 6 ? 0.64 : rpe <= 7 ? 0.72 : rpe <= 8 ? 0.80 : 0.87;
 var hrMax = Math.round(208 - 0.7 * age);
 hr = Math.round(hrMax * pctHR);
 var kcalMin;
 if (sex === 'homme') {
 kcalMin = (-55.0969 + 0.6309 * hr + 0.1988 * weight + 0.2017 * age) / 4.184;
 } else {
 kcalMin = (-20.4022 + 0.4472 * hr - 0.1263 * weight + 0.074 * age) / 4.184;
 }
 kcalMin = Math.max(kcalMin, 3.0);
 base = Math.round(kcalMin * durationMin);
 } else {
 // MET-based pour musculation (Ainsworth 2011 — Compendium of Physical Activities)
 // Musculation légère: MET 3.5 | modérée: MET 5.0 | intense: MET 6.0 | très intense: MET 8.0
 var met = rpe <= 5 ? 3.5 : rpe <= 6 ? 5.0 : rpe <= 8 ? 6.0 : 8.0;
 // Formule MET: kcal = MET × poids_kg × durée_heures
 base = Math.round(met * weight * (durationMin / 60));
 // FCmax estimée pour l'affichage uniquement
 hr = Math.round((208 - 0.7 * age) * (rpe <= 5 ? 0.57 : rpe <= 6 ? 0.64 : rpe <= 7 ? 0.72 : rpe <= 8 ? 0.80 : 0.87));
 }

 // EPOC — Schuenke 2002, Paoli 2012 : +6-20% selon intensité
 var epocPct = rpe <= 5 ? 0.06 : rpe <= 6 ? 0.10 : rpe <= 8 ? 0.15 : 0.20;
 // Bonus volume élevé (> 25 séries totales)
 var totalSets = 0;
 (exercises || []).forEach(function(ex) { var m = String(ex.sets || '').match(/^(\d+)/); if (m) totalSets += parseInt(m[1]); });
 if (totalSets > 25) epocPct = Math.min(epocPct + 0.05, 0.25);
 var epoc = Math.round(base * epocPct);
 return { base: base, epoc: epoc, total: base + epoc, hr: hr, rpe: rpe };
}

function renderMusculationProgram(p) {
 // Guard : si sportFocus est vide (état corrompu ou onboarding incomplet), renvoyer à l'étape 3
 var _focusKeys = Object.keys(S.sportFocus || {}).filter(function(z) { return (S.sportFocus || {})[z] > 0; });
 if (_focusKeys.length === 0 && (!Array.isArray(S.sportProgram) || S.sportProgram.length === 0)) {
   S.sStep = 3;
   if (window.render) window.render();
   return;
 }
 // ── PROGRAMME IA PERSONNALISÉ (alternative, pas prioritaire si programme local validé) ──
 // FIX 2026-04-16 — L'user ne suit pas 2 programmes. Si le local est validé, on l'affiche.
 if (S.muscuIAProgram && typeof S.muscuIAProgram === 'string' && S.muscuIAProgram.length > 100
     && !(Array.isArray(S.sportProgram) && S.sportProgram.length > 0 && S.sportProgramValidated)) {
   p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Program' : 'Programme')));
   p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Your custom<br><em>program</em>' : 'Votre programme<br><em>sur mesure</em>')}));
   var _iaDateStr = S.muscuIAProgramDate ? window.formatDate(S.muscuIAProgramDate) : '';
   if (_iaDateStr) p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Generated on ' : 'G\u00e9n\u00e9r\u00e9 le ') + _iaDateStr));

   // Conteneur du programme IA parsé
   var _iaContainer = h('div', {id: 'muscu-ia-program-container'});
   try {
     if (window.MUSCU_PROGRAM && typeof window.MUSCU_PROGRAM.parseToHTML === 'function') {
       _iaContainer.innerHTML = _sfcBlockDangerous(_sfcSanitize(window.MUSCU_PROGRAM.parseToHTML(S.muscuIAProgram) || ''));
     }
     if (!_iaContainer.innerHTML) {
       var _escaped = S.muscuIAProgram.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
       _iaContainer.innerHTML = '<div style="white-space:pre-wrap;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;padding:16px;border:1px solid var(--border);border-radius:2px;background:var(--ivory2);">' + _escaped + '</div>';
     }
   } catch(e) {
     var _escaped2 = S.muscuIAProgram.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
     _iaContainer.innerHTML = '<div style="white-space:pre-wrap;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;padding:16px;">' + _escaped2 + '</div>';
   }
   p.appendChild(_iaContainer);

   // Boutons
   p.appendChild(h('button', {'class': 'btn-secondary', style: 'margin-top:16px', onclick: function() {
     S.muscuIAProgram = null; S.muscuIAProgramDate = null;
     if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
     if (window.render) window.render();
   }}, (window.isEnglish && window.isEnglish() ? 'Back to local program' : 'Revenir au programme local')));

   if (window.MUSCU_PROGRAM && typeof window.MUSCU_PROGRAM.open === 'function') {
     p.appendChild(h('button', {'class': 'btn-primary', style: 'margin-top:8px', onclick: function() {
       window.MUSCU_PROGRAM.open();
     }}, (window.isEnglish && window.isEnglish() ? 'Generate a new program' : 'G\u00e9n\u00e9rer un nouveau programme')));
   }
   return;
 }

 // Afficher le message d'erreur si la génération a échoué (évite l'écran blanc)
 if (S._programGenerationError) {
   p.appendChild(h('div', {style: 'text-align:center;padding:48px 24px;font-family:"Helvetica Neue",Arial,sans-serif;'}, [
     h('div', {style: 'font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable' : (window.isEnglish && window.isEnglish() ? 'Program unavailable' : 'Programme indisponible'))),
     h('p', {style: 'font-size:14px;color:var(--text-secondary,#6B6B65);max-width:300px;margin:0 auto 24px;line-height:1.5;'}, S._programGenerationError),
     h('button', {'class': 'btn-primary', style: 'margin:0 auto;display:block;', onclick: function() {
       S._programGenerationError = null;
       S.sportProgram = null;
       S._generatingProgram = false;
       if (window.render) window.render();
     }}, (window.isEnglish && window.isEnglish() ? 'Retry' : 'Réessayer'))
   ]));
   return;
 }
 // ═══ FIX P0 2026-04-16 — AUTO-RÉGÉNÉRATION si programme stale (version obsolète) ═══
 // Avant : le programme généré avec l'ancien code buggé restait en cache localStorage
 // indéfiniment. L'user voyait "Legs A" avec des exercices pecs de l'ancien split.
 // Maintenant : chaque programme porte un _version. Si < SPORT_PROGRAM_VERSION, on régénère.
 // FIX 2026-04-16 — RÈGLE ABSOLUE : si le programme est validé, on ne le touche PLUS.
 // Avant : la version stale forçait une régénération → l'user perdait son programme validé
 // et voyait de nouveaux exercices sans avoir rien demandé. C'EST FINI.
 // Si la version est obsolète ET le programme est validé → bandeau informatif seulement.
 // Si pas encore validé → on peut régénérer silencieusement.
 if (Array.isArray(S.sportProgram) && S.sportProgram.length > 0 && (!S._sportProgramVersion || S._sportProgramVersion < SPORT_PROGRAM_VERSION)) {
   if (S.sportProgramValidated) {
     // Programme validé → on ne touche pas. Juste un flag pour le bandeau.
     S._sportUpdateAvailable = true;
   } else {
     // Pas encore validé → régénération OK
     console.warn('[sport] Programme non-validé stale (v' + (S._sportProgramVersion || 0) + ') — régénération');
     S.sportProgram = null;
     S._sportProgramVersion = null;
     S.bonusExercises = {};
   }
 }
 if (!Array.isArray(S.sportProgram) || S.sportProgram.length === 0) {
   // Afficher un message de génération si pas de programme
   if (!S._generatingProgram) {
     S._generatingProgram = true;
     p.appendChild(h('div', {style: 'text-align:center;padding:48px 24px;font-family:"Helvetica Neue",Arial,sans-serif;'},[
       h('div', {style: 'font-size:12px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;'}, (window.isEnglish && window.isEnglish() ? 'Generating your program...' : 'Génération de votre programme...')),
       h('div', {style: 'width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--black);border-radius:0;animation:spin .7s linear infinite;margin:0 auto;'})
     ]));
     setTimeout(function() {
       try {
         S._generatingProgram = false;
         S.sportProgram = generateSportProgram();
         // FIX F5 CONTRE-AUDIT 2026-04 : NE PAS marquer validated=true dans le setTimeout boot.
         // Avant : toute génération silencieuse au boot passait le flag à true → contradiction
         //         avec l'intent ("validé uniquement après action explicite user").
         // Maintenant : seuls les 3 boutons explicites (Générer, Nouveau cycle, Recalculer)
         //              marquent le flag. Le boot régénère silencieusement sans valider.
         if (!Array.isArray(S.sportProgram) || S.sportProgram.length === 0 || S.sportProgram.every(function(d){ return !d || !Array.isArray(d.exercises) || d.exercises.length === 0; })) {
           console.error('[sport] generateSportProgram returned empty program');
           S._generatingProgram = false;
           S._programGenerationError = (window.isEnglish && window.isEnglish() ? 'No exercises available with your current constraints. Try relaxing your medical restrictions or adding more equipment.' : 'Aucun exercice disponible avec vos contraintes actuelles. Essayez d\'assouplir vos restrictions médicales ou d\'ajouter davantage d\'équipement.');
           if (window.render) window.render();
           return;
         }
         S._programGenerationError = null;
         S.selectedSportDay = 0;
         // FIX 2026-04-16 — auto-regen préserve le statut validé si le programme existait déjà
         // Avant : l'user validait son programme, une auto-regen (version stale, boot) remettait
         // sportProgramValidated=undefined → dashboard redemandait de valider en boucle.
         if (!S.sportProgramValidated) { S.sportProgramValidated = true; S.sportProgramValidatedAt = new Date().toISOString(); }
         if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
         if (window.render) window.render();
       } catch(e) {
         console.error('[sport] generateSportProgram error:', e);
         S._generatingProgram = false;
         S._programGenerationError = (window.isEnglish && window.isEnglish() ? 'An error occurred while generating the program. Please try again.' : 'Une erreur est survenue lors de la génération du programme. Veuillez réessayer.');
         if (window.render) window.render();
       }
     }, 50);
     return;
   } else {
     // setTimeout en attente — afficher le spinner et attendre, ne pas générer en doublon
     p.appendChild(h('div', {style: 'text-align:center;padding:48px 24px;font-family:"Helvetica Neue",Arial,sans-serif;'},[
       h('div', {style: 'font-size:12px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;'}, (window.isEnglish && window.isEnglish() ? 'Generating your program...' : 'Génération de votre programme...')),
       h('div', {style: 'width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--black);border-radius:0;animation:spin .7s linear infinite;margin:0 auto;'})
     ]));
     return;
   }
 }

 // LEGACY PROGRAM SAFETY — block any program missing generation-time splitKey
 if (S._splitChoice && Array.isArray(S.sportProgram) && S.sportProgram.length > 0) {
   var _pd0 = S.sportProgram[0];
   var _isLegacyProg = !_pd0 || typeof _pd0.splitKey === 'undefined';
   var _isSplitMismatch = _pd0 && _pd0.splitKey && _pd0.splitKey !== S._splitChoice;
   if (_isLegacyProg || _isSplitMismatch) {
     p.appendChild(h('div', {style: 'text-align:center;padding:48px 24px;font-family:"Helvetica Neue",Arial,sans-serif;'}, [
       h('div', {style: 'font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;'}, (window.isEnglish && window.isEnglish() ? 'PROGRAM' : 'PROGRAMME')),
       h('h2', {style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;margin:0 0 14px;color:var(--black,#0A0A09);'}, (window.isEnglish && window.isEnglish() ? 'Program needs updating' : 'Programme \u00e0 mettre \u00e0 jour')),
       h('p', {style: 'font-size:13px;color:var(--ink-500,#6B6B65);max-width:280px;margin:0 auto 28px;line-height:1.6;'}, (window.isEnglish && window.isEnglish()
         ? 'This program was generated with an older version. To guarantee consistent results, it must be regenerated.'
         : 'Ce programme a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 avec une ancienne version.\nPour garantir des r\u00e9sultats coh\u00e9rents, il doit \u00eatre r\u00e9g\u00e9n\u00e9r\u00e9.')),
       h('button', {'class': 'btn-primary', style: 'margin:0 auto;display:block;', onclick: function() {
         try {
           S.sportProgram = generateSportProgram();
           S.sportProgramValidated = true;
           S.sportProgramValidatedAt = new Date().toISOString();
           S._programGenerationError = null;
           if (window.saveProfile) { try { window.saveProfile(); } catch(e2) {} }
           if (window.render) window.render();
         } catch(e) { console.error('[sport] legacy regen error:', e); }
       }}, (window.isEnglish && window.isEnglish() ? '\u21bb Regenerate my program' : '\u21bb R\u00e9g\u00e9n\u00e9rer mon programme'))
     ]));
     return;
   }
 }

 // Load saved musculation weights from localStorage
 if (Object.keys(S.musculationWeights || {}).length === 0) {
 var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var saved = localStorage.getItem('mtd_muscu_weights_' + userId);
 if (saved) { try { S.musculationWeights = JSON.parse(saved); } catch(e) {} }
 }
 if (!S.musculationWeights || typeof S.musculationWeights !== 'object' || Array.isArray(S.musculationWeights)) S.musculationWeights = {};

 // FIX UX 2026-04-16 — carte "Tes Records" retirée de la vue programme.
 // Information utile dans le profil mais pas dans la section sport active.
 // L'user vient ici pour voir ses exercices du jour, pas ses 1RM.

 // Load saved strength profile
 if (Object.keys(S.muscuStrengthProfile || {}).length === 0) {
 var userId2 = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var savedStr = localStorage.getItem('mtd_muscu_strength_' + userId2);
 if (savedStr) { try { S.muscuStrengthProfile = JSON.parse(savedStr); } catch(e) {} }
 }
 if (!S.muscuStrengthProfile || typeof S.muscuStrengthProfile !== 'object' || Array.isArray(S.muscuStrengthProfile)) S.muscuStrengthProfile = {};

 // Bridge crossfit1RM → muscuStrengthProfile for powerlifters/strength athletes
 // If muscuStrengthProfile is empty but crossfit1RM has lifts, pre-populate from 1RM values.
 // Uses reps=1 as Epley reference (1RM × (1+1/30) ≈ 3% overestimate — acceptable given 1RM test variance).
 // Only fills keys that are not already set (user-entered muscuStrengthProfile takes priority).
 // Mapping: crossfit1RM.back_squat → squat, deadlift → deadlift, bench → bench_press, press → overhead_press
 if (S.crossfit1RM && Object.keys(S.crossfit1RM).length > 0) {
 var cf1rm = S.crossfit1RM;
 var CROSSFIT_TO_MUSCU = {
 back_squat: 'squat',
 deadlift: 'deadlift',
 bench: 'bench_press',
 press: 'overhead_press'
 };
 Object.keys(CROSSFIT_TO_MUSCU).forEach(function(cfKey) {
 var muscuKey = CROSSFIT_TO_MUSCU[cfKey];
 if (cf1rm[cfKey] && !S.muscuStrengthProfile[muscuKey]) {
 // Store the 1RM directly; Epley reference reps=1 → estimated 1RM = stored * (1+1/30) ≈ stored * 1.033
 // To preserve the exact known 1RM, divide by 1.0333 so Epley gives back the original value
 S.muscuStrengthProfile[muscuKey] = Math.round(cf1rm[cfKey] / (1 + 1 / 30));
 S.muscuStrengthProfile[muscuKey + '_reps'] = 1;
 }
 });
 }

 // Load session log and progression history — toujours depuis la clé dédiée
 // (plus fréquemment mise à jour que PROFILE_KEYS, qui peut être en retard)
 var userId3 = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var savedLog = localStorage.getItem('mtd_muscu_session_' + userId3);
 if (savedLog) { try { S.muscuSessionLog = JSON.parse(savedLog); } catch(e) { S.muscuSessionLog = {}; } }
 if (!S.muscuSessionLog || typeof S.muscuSessionLog !== 'object' || Array.isArray(S.muscuSessionLog)) S.muscuSessionLog = {};
 // Sanitise les entrées corrompues (date keys avec valeur null/non-objet)
 Object.keys(S.muscuSessionLog).forEach(function(d) { if (!S.muscuSessionLog[d] || typeof S.muscuSessionLog[d] !== 'object') delete S.muscuSessionLog[d]; });
 var savedProg = localStorage.getItem('mtd_muscu_progression_' + userId3);
 if (savedProg) { try { S.muscuProgressionHistory = JSON.parse(savedProg); } catch(e) {} }
 if (!S.muscuProgressionHistory || typeof S.muscuProgressionHistory !== 'object' || Array.isArray(S.muscuProgressionHistory)) S.muscuProgressionHistory = {};
 // Load daily challenge history
 if (!S.dailyChallengeHistory) {
   var _dcSaved = localStorage.getItem('mtd_daily_challenge_' + userId3);
   if (_dcSaved) { try { S.dailyChallengeHistory = JSON.parse(_dcSaved); } catch(e) { S.dailyChallengeHistory = {}; } }
   else S.dailyChallengeHistory = {};
 }

 // ─── SÉANCE DU JOUR — carte highlight en haut du programme ───
 (function() {
  var _todayCardIdx = (new Date().getDay() + 6) % 7; // 0=Lun … 6=Dim
  var _dayFullFR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  var _dayFullEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var _todayDayName = (window.isEnglish && window.isEnglish() ? _dayFullEN : _dayFullFR)[_todayCardIdx];

  // Vérifier que aujourd'hui est un jour d'entraînement
  if (!Array.isArray(S.trainingDaysSelected) || S.trainingDaysSelected.length === 0) return;
  var _todayPosInProg = S.trainingDaysSelected.indexOf(_todayCardIdx);
  if (_todayPosInProg < 0) return; // Jour de repos — pas de carte

  // Vérifier que le programme existe et contient ce jour
  if (!Array.isArray(S.sportProgram) || _todayPosInProg >= S.sportProgram.length) return;
  var _todayDay = S.sportProgram[_todayPosInProg];
  if (!_todayDay || !Array.isArray(_todayDay.exercises) || _todayDay.exercises.length === 0) return;

  // Vérifier si la séance a déjà été complétée aujourd'hui
  var _todayISOKey = new Date().toISOString().slice(0, 10);
  var _doneToday = S.muscuSessionLog && S.muscuSessionLog[_todayISOKey] && Object.keys(S.muscuSessionLog[_todayISOKey]).length > 0;
  if (_doneToday) return; // Séance déjà faite — ne pas afficher la carte

  // ── Construction de la carte ──
  var _card = h('div', {style: 'border:1px solid var(--border,#D8D8D0);border-left:3px solid var(--accent,#1A4A1A);background:var(--ivory2,#F4F4F0);padding:16px;margin-bottom:20px;border-radius:2px;'});

  // Eyebrow : "AUJOURD'HUI · Lundi"
  _card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--accent,#1A4A1A);margin-bottom:6px;font-weight:600;'}, (window.isEnglish && window.isEnglish() ? "TODAY · " : "AUJOURD'HUI · ") + _todayDayName));

  // Titre : focus + nombre d'exercices
  var _exCount = _todayDay.exercises.length;
  var _cardTitle = (_todayDay.focus || (window.isEnglish && window.isEnglish() ? 'Workout' : 'Séance')) + ' — ' + _exCount + ' ' + window.locPlural(_exCount, {fr:{one:'exercice',other:'exercices'},en:{one:'exercise',other:'exercises'}});
  _card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:15px;font-weight:700;color:var(--black,#0A0A09);margin-bottom:12px;line-height:1.3;'}, _cardTitle));

  // Aperçu des 3 premiers exercices
  var _previewExos = _todayDay.exercises.slice(0, 3);
  var _exList = h('div', {style: 'margin-bottom:14px;'});
  _previewExos.forEach(function(ex) {
   var _exRow = h('div', {style: 'display:flex;align-items:baseline;gap:8px;margin-bottom:5px;'});
   _exRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black,#0A0A09);flex:1;line-height:1.4;'}, ex.n || ex.name || ''));
   if (ex.sets) {
    _exRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);white-space:nowrap;flex-shrink:0;'}, ex.sets));
   }
   _exList.appendChild(_exRow);
  });
  if (_exCount > 3) {
   _exList.appendChild(h('div', {style: 'font-family:Georgia,serif;font-style:italic;font-size:11px;color:var(--grey,#6B6B65);margin-top:2px;'}, '+ ' + (_exCount - 3) + ' ' + window.locPlural(_exCount - 3, {fr:{one:'autre',other:'autres'},en:{one:'more',other:'more'}}) + '…'));
  }
  _card.appendChild(_exList);

  // Bouton Commencer maintenant
  _card.appendChild(h('button', {
   style: 'display:block;width:100%;padding:14px;background:var(--black,#0A0A09);color:var(--paper,#FAF9F6);border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;border-radius:2px;min-height:44px;font-weight:500;',
   onclick: function() {
    S.selectedSportDay = _todayPosInProg;
    S.currentExerciseIdx = 0;
    S._exSwipeDayIdx = _todayPosInProg;
    // Démarrer le chrono si pas encore commencé aujourd'hui
    var _today2 = new Date().toISOString().slice(0,10);
    if (!S._sessionStartTime || !S._sessionStartDate || S._sessionStartDate !== _today2) {
      S._sessionStartTime = Date.now();
      S._sessionStartDate = _today2;
    }
    if (window.render) window.render();
   }
  }, (window.isEnglish && window.isEnglish() ? '→ Start now' : '→ Commencer maintenant')));

  p.appendChild(_card);

  // Séparateur visuel
  p.appendChild(h('hr', {style: 'border:none;border-top:1px solid var(--border,#D8D8D0);margin:0 0 20px;'}));
 })();

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Program' : 'Programme')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Your<br><em>program</em>' : 'Votre<br><em>programme</em>')}));

 // Bandeau "mise à jour disponible" (version stale mais programme validé = on ne touche pas)
 if (S._sportUpdateAvailable) {
   var _updateBanner = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid var(--ink-900,#0A0A09);background:rgba(62,92,58,0.06);margin-bottom:12px;border-radius:2px'});
   _updateBanner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--ink-900,#0A0A09)'}, (window.isEnglish && window.isEnglish() ? 'A program update is available.' : 'Une mise à jour du programme est disponible.')));
   _updateBanner.appendChild(h('button', {
     style: 'padding:6px 12px;background:var(--ink-900,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;min-height:44px;white-space:nowrap;',
     onclick: function() {
       try { S.sportProgram = generateSportProgram(); S.sportProgramValidated = true; S.sportProgramValidatedAt = new Date().toISOString(); } catch(e) {}
       S._sportUpdateAvailable = false;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       if (window.render) window.render();
     }
   }, (window.isEnglish && window.isEnglish() ? 'Update' : 'Mettre à jour')));
   p.appendChild(_updateBanner);
 }

 // FIX 2026-04-19 — Warning si filtrage médical strict a réduit des groupes (programme incomplet)
 if (S._sportFilterIncomplete) {
   var _filterWarn = h('div', {style: 'background:rgba(180,130,0,0.08);border:1px solid rgba(180,130,0,0.3);padding:10px 14px;margin-bottom:12px;border-radius:2px;display:flex;align-items:flex-start;gap:8px;'});
   _filterWarn.appendChild(h('span', {style: 'flex-shrink:0;font-size:13px;'}, '\u26a0\ufe0f'));
   var _fwText = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5A3A00;line-height:1.5;'});
   _fwText.textContent = (window.isEnglish && window.isEnglish() ? 'Some muscle groups were filtered due to your medical conditions. The program may be incomplete. Consult a coach or reduce your restrictions in the medical questionnaire.' : 'Certains groupes musculaires ont été filtrés en raison de vos conditions médicales. Le programme peut être incomplet. Consultez un coach ou réduisez vos restrictions dans le questionnaire médical.');
   _filterWarn.appendChild(_fwText);
   p.appendChild(_filterWarn);
 }

 // FIX 2026-04-19 — Alerte persistante HTA sévère dans la vue programme (ESC/ESH 2018)
 if (Array.isArray(S.medical) && S.medical.indexOf('hta_severe') !== -1) {
   var _htaProgAlert = h('div', {style: 'background:rgba(220,53,69,0.07);border:1px solid rgba(220,53,69,0.3);padding:10px 14px;margin-bottom:12px;border-radius:2px;display:flex;align-items:flex-start;gap:8px;'});
   _htaProgAlert.appendChild(h('span', {style: 'flex-shrink:0;font-size:13px;'}, '\u26a0\ufe0f'));
   var _htaProgText = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#8B0000;line-height:1.5;'});
   _htaProgText.textContent = (window.isEnglish && window.isEnglish() ? 'Severe hypertension: limit loads to 40–60% of 1RM. Avoid Valsalva maneuver, intense isometric exercises and overhead loads. — ESC/ESH 2018' : 'HTA sévère : limitez les charges à 40–60% du 1RM. Évitez la manœuvre de Valsalva, les exercices isométriques intenses et les charges au-dessus de la tête. — ESC/ESH 2018');
   _htaProgAlert.appendChild(_htaProgText);
   p.appendChild(_htaProgAlert);
 }

 // ─── SECTION : PROGRAMME DE LA SEMAINE ───

 // ═══ FIX UX HERMÈS 2026-04-16 — Bannières regroupées dans section collapsible ═══
 // Avant : 15+ bannières empilées avant le premier exercice = 5+ écrans de scroll.
 // Maintenant : une seule ligne "Adaptations actives (N)" cliquable → déplie les détails.
 var _adaptCount = 0;
 var _adaptContainer = h('div', {style: 'display:none;margin-bottom:12px'});

 // Compteur d'adaptations pour le header
 if (S.muscuMedical && S.muscuMedical.done) {
   var _mm = S.muscuMedical;
   if (_mm.shoulders || _mm.rotatorCuff || _mm.lowerBack || _mm.herniaDisc || _mm.knees || _mm.acl || _mm.herniaInguinal || _mm.hypertension || _mm.osteoporosis || _mm.rheumatoidArthritis || _mm.fibromyalgia || _mm.meniscus || _mm.feet || _mm.spondylarthritis || _mm.kneeOsteoarthritis || _mm.epicondylitis || _mm.elbows) _adaptCount++;
 }
 if (Array.isArray(S.medical) && S.medical.length > 0) _adaptCount++;
 if (S.pregnant && window.isFemale(S)) _adaptCount++;
 if (Array.isArray(S.medical) && (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1)) _adaptCount++;
 if (Array.isArray(S.medical) && (S.medical.indexOf('cardio') !== -1 || S.medical.indexOf('hta') !== -1 || S.medical.indexOf('hta_severe') !== -1)) _adaptCount++;
 if (typeof getAge === 'function' && getAge() >= 50) _adaptCount++;
 if (S.sleep !== null && S.sleep !== undefined && S.sleep <= 1) _adaptCount++;

 // Header cliquable (affiché seulement si adaptations présentes)
 if (_adaptCount > 0) {
   var _adaptHeader = h('button', {
     style: 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid var(--border,#E8E6DF);background:var(--ivory2,#F5F3EC);margin-bottom:8px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:2px;text-transform:uppercase;min-height:44px;',
     onclick: function() {
       var c = _adaptContainer;
       if (c.style.display === 'none') { c.style.display = 'block'; this.querySelector('span:last-child').textContent = '\u25B2'; }
       else { c.style.display = 'none'; this.querySelector('span:last-child').textContent = '\u25BC'; }
     }
   });
   _adaptHeader.appendChild(h('span', {}, _adaptCount + ' ' + window.locPlural(_adaptCount, {fr:{one:'adaptation active',other:'adaptations actives'},en:{one:'active adaptation',other:'active adaptations'}})));
   _adaptHeader.appendChild(h('span', {style: 'font-size:10px'}, '\u25BC'));
   p.appendChild(_adaptHeader);
   p.appendChild(_adaptContainer);
 }

 // Toutes les bannières vont dans le conteneur collapsible (ou dans p si aucune adaptation)
 var _bannerTarget = _adaptCount > 0 ? _adaptContainer : p;

 appendWellnessBanner(_bannerTarget);

 // CS-01: Bannière charges estimées si profil de force non renseigné
 if (Object.keys(S.muscuStrengthProfile || {}).length === 0) {
 var estBanner = h('div', {style: 'border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;background:rgba(232,111,30,0.06);margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E)'});
 estBanner.appendChild(h('div', {style: 'font-weight:bold;margin-bottom:3px'}, (window.isEnglish && window.isEnglish() ? 'Estimated loads' : 'Charges estimées')));
 estBanner.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? 'Displayed weights are estimated from your bodyweight and level. For personalized loads,\u00a0' : 'Les poids affichés sont calculés d\'après votre poids de corps et niveau. Pour des charges personnalisées,\u00a0')));
 var goBack16 = h('span', {style: 'text-decoration:underline;cursor:pointer', onclick: function(){ S._chargesReturnToDashboard = true; S.sStep = 16; window.render(); }}, (window.isEnglish && window.isEnglish() ? 'enter your reference loads' : 'saisissez vos charges de référence'));
 estBanner.appendChild(goBack16);
 estBanner.appendChild(h('span', {}, '.'));
 _bannerTarget.appendChild(estBanner);
 }

 // ─── BANNIÈRE ADAPTATIONS MÉDICALES ───
 if (S.muscuMedical && S.muscuMedical.done) {
 var med = S.muscuMedical;
 var restrictions = [];
 var _isENMed = window.isEnglish && window.isEnglish();
 if (med.shoulders || med.rotatorCuff) restrictions.push(_isENMed ? '\u26A0 Shoulders : overhead exercises avoided' : '\u26A0 \u00c9paules\u00a0: exercices overhead \u00e9vit\u00e9s');
 if (med.lowerBack || med.herniaDisc) restrictions.push(_isENMed ? '\u26A0 Back : deadlifts and heavy bends removed' : '\u26A0 Dos\u00a0: soulev\u00e9 de terre et flexions lourdes retir\u00e9s');
 if (med.knees || med.acl) restrictions.push(_isENMed ? '\u26A0 Knees : deep squats replaced' : '\u26A0 Genoux\u00a0: squats profonds remplac\u00e9s');
 if (med.herniaInguinal) restrictions.push(_isENMed ? '\u26A0 Inguinal hernia : hyper-pressure exercises removed' : '\u26A0 Hernie inguinale\u00a0: exercices hyperpressifs retir\u00e9s');
 if (med.hypertension) restrictions.push((function(){ var _el = document.createElement('span'); _el.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? '\u26A0 HTN\u00a0: intensity capped ' : '\u26A0 HTA\u00a0: intensit\u00e9 plafonn\u00e9e '))); _el.appendChild(termTooltip('RPE', _RPE_DEF)); _el.appendChild(document.createTextNode(window.isEnglish && window.isEnglish() ? '\u00a07/10, Valsalva forbidden' : '\u00a07/10, Valsalva interdit')); return _el; })());
 if (med.osteoporosis) restrictions.push(_isENMed ? '\u26A0 Osteoporosis : loads \u2264 70 % 1RM, no impact or vertebral flexions (Sinaki, Spine 2002)' : '\u26A0 Ost\u00e9oporose\u00a0: charges \u2264\u00a070\u00a0% 1RM, pas d\'impacts ni flexions vert\u00e9brales (Sinaki, Spine 2002)');
 if (med.rheumatoidArthritis) restrictions.push(_isENMed ? '\u26A0 Rheumatoid arthritis : light loads, gentle exercises in remission only \u2014 stop during flare-ups (EULAR 2020)' : '\u26A0 Polyarthrite rhumato\u00efde\u00a0: charges l\u00e9g\u00e8res, exercices doux en r\u00e9mission uniquement \u2014 arr\u00eatez en cas de pouss\u00e9e (EULAR 2020)');
 if (med.fibromyalgia) restrictions.push(_isENMed ? '\u26A0 Fibromyalgia : moderate intensity max, no HIIT or maximal loads \u2014 gentle aerobic exercises recommended (Cochrane 2017)' : '\u26A0 Fibromyalgie\u00a0: intensit\u00e9 mod\u00e9r\u00e9e max, pas de HIIT ni charges maximales \u2014 exercices a\u00e9robies doux recommand\u00e9s (Cochrane 2017)');
 if (med.meniscus) restrictions.push(_isENMed ? '\u26A0 Meniscus : no flexion >90\u00b0 under load nor rotational shear (leg extension, lunges)' : '\u26A0 M\u00e9nisque\u00a0: pas de flexion >90\u00b0 sous charge ni de cisaillement en rotation (leg extension, fentes)');
 if (med.feet) restrictions.push(_isENMed ? '\u26A0 Feet/fasciitis : impact exercises removed (jumps, rope), prefer cycling or swimming' : '\u26A0 Pieds/fasciite\u00a0: exercices \u00e0 impact retir\u00e9s (sauts, corde), privil\u00e9gier velo ou natation');
 if (med.spondylarthritis) restrictions.push(_isENMed ? '\u26A0 Spondyloarthritis : heavy axial loads removed (deadlift, barbell squat, good morning) \u2014 swimming, yoga and stretching recommended (Sieper & Poddubnyy, Lancet 2017)' : '\u26A0 Spondylarthrite\u00a0: charges axiales lourdes retir\u00e9es (deadlift, squat barre, good morning) \u2014 natation, yoga et \u00e9tirements recommand\u00e9s (Sieper & Poddubnyy, Lancet 2017)');
 if (med.kneeOsteoarthritis) restrictions.push(_isENMed ? '\u26A0 Knee osteoarthritis : deep knee bends and impacts removed \u2014 stationary bike and limited-range strength training recommended (OARSI 2014)' : '\u26A0 Gonarthrose\u00a0: flexions profondes du genou et impacts retir\u00e9s \u2014 v\u00e9lo stationnaire et musculation en amplitude limit\u00e9e recommand\u00e9s (OARSI 2014)');
 if (med.epicondylitis || med.elbows) restrictions.push(_isENMed ? '\u26A0 Epicondylitis : pronation barbell row, pronation pull-ups, straight bar curl removed \u2014 favor supination or neutral grip (Bisset & Vicenzino, JOSPT 2015)' : '\u26A0 \u00c9picondylite\u00a0: rowing barre pronation, pull-ups pronation, curl barre droite retir\u00e9s \u2014 favoriser prise supination ou neutre (Bisset & Vicenzino, JOSPT 2015)');
 if (restrictions.length > 0) {
 var medBanner = h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E)'});
 medBanner.appendChild(h('div', {style: 'font-weight:bold;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Program adapted to your medical assessment' : 'Programme adapt\u00e9 \u00e0 votre bilan m\u00e9dical')));
 restrictions.forEach(function(r) {
 medBanner.appendChild(h('div', {style: 'margin-bottom:3px'}, r));
 });
 var editMed = h('div', {style: 'margin-top:8px;font-size:11px;text-decoration:underline;cursor:pointer;color:var(--orange-ink,#7A3B0E)',
 onclick: function(){ S._medicalReturnToDashboard = true; S.sStep = 20; window.render(); }}, (window.isEnglish && window.isEnglish() ? 'Edit my medical assessment' : 'Modifier mon bilan m\u00e9dical'));
 medBanner.appendChild(editMed);
 _bannerTarget.appendChild(medBanner);
 }
 }
 // FIX 2026-04-16 — Bannière S.medical (onboarding nutrition) si muscuMedical pas rempli
 // L'user voit des exos filtrés (ostéoporose, HTA...) sans savoir pourquoi si muscuMedical.done=false
 if (Array.isArray(S.medical) && S.medical.length > 0 && !(S.muscuMedical && S.muscuMedical.done)) {
   var _genMedRestrictions = [];
   var _gml = S.medical.map(function(m) { return String(m).toLowerCase(); });
   var _isENGenMed = window.isEnglish && window.isEnglish();
   if (_gml.indexOf('osteoporose') !== -1 || _gml.indexOf('osteoporosis') !== -1) _genMedRestrictions.push(_isENGenMed ? '\u26A0 Osteoporosis : impact exercises and heavy axial loads removed' : '\u26A0 Ostéoporose : exercices à impact et charges axiales lourdes retirés');
   if (_gml.indexOf('hta') !== -1 || _gml.indexOf('hta_severe') !== -1 || _gml.indexOf('hypertension') !== -1) _genMedRestrictions.push(_isENGenMed ? '\u26A0 Hypertension : maximal effort and Valsalva removed' : '\u26A0 HTA : efforts maximaux et Valsalva retirés');
   if (_gml.indexOf('cardio') !== -1 || _gml.indexOf('insuffisance_card') !== -1) _genMedRestrictions.push(_isENGenMed ? '\u26A0 Heart condition : high-intensity exercises removed' : '\u26A0 Cardiopathie : exercices à haute intensité retirés');
   if (_gml.indexOf('polyarthrite') !== -1 || _gml.indexOf('arthrite') !== -1) _genMedRestrictions.push(_isENGenMed ? '\u26A0 Arthritis : heavy loads and impacts removed' : '\u26A0 Arthrite : charges lourdes et impacts retirés');
   if (_gml.indexOf('fibromyalgie') !== -1) _genMedRestrictions.push(_isENGenMed ? '\u26A0 Fibromyalgia : intensity capped' : '\u26A0 Fibromyalgie : intensité plafonnée');
   if (_genMedRestrictions.length > 0) {
     var _gmBanner = h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E)'});
     _gmBanner.appendChild(h('div', {style: 'font-weight:bold;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Medical adaptations (nutrition profile)' : 'Adaptations médicales (profil nutrition)')));
     _genMedRestrictions.forEach(function(r) { _gmBanner.appendChild(h('div', {style: 'margin-bottom:3px'}, r)); });
     _bannerTarget.appendChild(_gmBanner);
   }
 }

 // ─── ALERTE GROSSESSE SPORT (ACOG 2020) ───
 var pregSportWarn = getPregnancySportWarning();
 if (pregSportWarn) {
 _bannerTarget.appendChild(h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'}, pregSportWarn));
 }

 // ─── CONFLITS OBJECTIFS NUTRITION × SPORT ───
 if (window.detectMedicalConflicts) {
 var progConflicts = window.detectMedicalConflicts();
 // Filtrer : uniquement les conflits liés aux objectifs sport/nutrition (conflit 9 & 10) + médicaux sport
 var sportConflicts = progConflicts.filter(function(c) {
 return c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1 || c.message.indexOf('IRC') !== -1 || c.message.indexOf('Cardiopathie') !== -1 || c.message.indexOf('Diab\u00e8te') !== -1;
 });
 sportConflicts.forEach(function(c) {
 var bg = c.level === 'CRITIQUE' ? 'rgba(122,31,31,0.06)' : c.level === '\u00c9LEV\u00c9' ? 'rgba(232,111,30,0.06)' : 'var(--bluebg,rgba(26,58,106,.06))';
 var border = c.level === 'CRITIQUE' ? 'var(--error,#7A1F1F)' : c.level === '\u00c9LEV\u00c9' ? 'var(--orange-ink,#7A3B0E)' : 'var(--blue,#1A3A6A)';
 var color = c.level === 'CRITIQUE' ? 'var(--error,#7A1F1F)' : c.level === '\u00c9LEV\u00c9' ? 'var(--orange-ink,#7A3B0E)' : 'var(--blue,#1A3A6A)';
 _bannerTarget.appendChild(h('div', {style: 'background:' + bg + ';border-left:4px solid ' + border + ';padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:' + color + ';line-height:1.5'}, c.message));
 });
 }

 // Medical/age contextual warnings in program view
 var hasDiabProg = S.medical && (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1);
 if (hasDiabProg) {
 var _diabDiv = h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E)'});
 var _RPE_DEF = (window.isEnglish && window.isEnglish() ? 'Rate of Perceived Exertion — perceived effort out of 10 (7/10 = moderate effort, last hard reps)' : 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)');
 if (S.medical.indexOf('diabete_t1') !== -1) {
  _diabDiv.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? ' Diabetes T1 : ' : ' Diab\u00e8te T1 : ')));
  _diabDiv.appendChild(termTooltip('RPE', _RPE_DEF));
  _diabDiv.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? ' capped at 7/10 (hypoglycemia risk at high intensity). Target blood glucose before session: 7-10 mmol/L. Glucometer required before/after. Keep 15-20g fast carbs nearby.' : ' plafonn\u00e9 \u00e0 7/10 (risque hypoglyc\u00e9mie \u00e0 haute intensit\u00e9). Glyc\u00e9mie cible avant s\u00e9ance : 7-10 mmol/L. Glucom\u00e8tre obligatoire avant/apr\u00e8s. Gardez 15-20g glucides rapides \u00e0 port\u00e9e.')));
 } else {
  _diabDiv.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? ' Diabetes : Check your blood glucose before/after each session. Keep fast sugar nearby. Maximum intensity ' : ' Diab\u00e8te : V\u00e9rifiez votre glyc\u00e9mie avant/apr\u00e8s chaque s\u00e9ance. Gardez du sucre rapide \u00e0 port\u00e9e. Intensit\u00e9 maximale ')));
  _diabDiv.appendChild(termTooltip('RPE', _RPE_DEF));
  _diabDiv.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? ' 8/10 \u2014 never to failure. Hydration \u00d71.5.' : ' 8/10 \u2014 jamais \u00e0 l\'\u00e9chec. Hydratation \u00d71.5.')));
 }
 _bannerTarget.appendChild(_diabDiv);
 }
 if (getAge() >= 50) {
 _bannerTarget.appendChild(h('div', {style: 'background:rgba(62,92,58,0.06);border-left:3px solid var(--ink-900,#0A0A09);padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--success,#3E5C3A)'}, (window.isEnglish && window.isEnglish() ? ' 50+ : Warm-up 15-20 min mandatory. Deload every 4-5 weeks. Favor guided movements to protect joints.' : ' 50+ : \u00c9chauffement 15-20 min obligatoire. D\u00e9charge toutes les 4-5 semaines. Favorisez les mouvements guid\u00e9s pour prot\u00e9ger les articulations.')));
 }
 // Cardiopathie : zones FC Karvonen + avertissement beta-bloquants (AHA 2018, ACSM 2021)
 if (S.medical && S.medical.indexOf('cardio') !== -1) {
 var age = getAge() || 40;
 var hrMax = Math.round(208 - 0.7 * age); // Tanaka 2001 — plus précis que Fox (AHA 2010)
 var hrRest = S.heartRateRest || 65; // Utilisateur peut renseigner sa FC repos
 // Karvonen: Target HR = (HRmax - HRrest) × %intensity + HRrest
 var z1lo = Math.round((hrMax - hrRest) * 0.50 + hrRest);
 var z1hi = Math.round((hrMax - hrRest) * 0.60 + hrRest);
 var z2lo = Math.round((hrMax - hrRest) * 0.60 + hrRest);
 var z2hi = Math.round((hrMax - hrRest) * 0.70 + hrRest);
 var z3lo = Math.round((hrMax - hrRest) * 0.70 + hrRest);
 var z3hi = Math.round((hrMax - hrRest) * 0.80 + hrRest);
 var karvonenDiv = h('div', {style: 'border-left:2px solid var(--red);padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;background:rgba(122,31,31,0.06)'});
 karvonenDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--red);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Heart condition \u2014 Karvonen HR zones' : 'Cardiopathie \u2014 Zones FC Karvonen')));
 karvonenDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Resting HR ' + hrRest + ' bpm \u00b7 Estimated HRmax ' + hrMax + ' bpm' : 'FC repos ' + hrRest + ' bpm \u00b7 HRmax estim\u00e9 ' + hrMax + ' bpm')));
 var zonesRow = h('div', {style: 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px'});
 zonesRow.appendChild(h('span', {'class': 'val-good'}, (window.isEnglish && window.isEnglish() ? 'Z1 Recovery ' : 'Z1 R\u00e9cup ') + z1lo + '\u2013' + z1hi + ' bpm'));
 zonesRow.appendChild(h('span', {'class': 'val-good'}, (window.isEnglish && window.isEnglish() ? 'Z2 Aerobic ' : 'Z2 A\u00e9robie ') + z2lo + '\u2013' + z2hi + ' bpm'));
 zonesRow.appendChild(h('span', {'class': 'val-neutral'}, (window.isEnglish && window.isEnglish() ? 'Z3 Threshold ' : 'Z3 Seuil ') + z3lo + '\u2013' + z3hi + ' bpm'));
 karvonenDiv.appendChild(zonesRow);
 karvonenDiv.appendChild(h('div', {style: 'margin-top:4px;font-style:italic;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? ' Beta-blockers : if prescribed, your actual max HR is lower (~10-20%). Consult your cardiologist to adjust zones. Stress test (VO2max) recommended before intensive program.' : ' Beta-bloquants : si prescrit, votre FC max r\u00e9elle est plus basse (~10-20%). Consulter votre cardiologue pour ajuster les zones. Test d\'effort (VO2max) recommand\u00e9 avant programme intensif.')));
 _bannerTarget.appendChild(karvonenDiv);
 }

 // HTA légère : avertissement intensité sport (ESC/ESH 2018, AHA/ACSM 2019)
 // HTA légère (140-159/90-99 mmHg) — effort modéré autorisé mais avec précautions
 if (S.medical && S.medical.indexOf('hta') !== -1 && S.medical.indexOf('hta_severe') === -1) {
 var htaLightDiv = h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E)'});
 htaLightDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--orange-ink,#7A3B0E);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Hypertension \u2014 Sport precautions' : 'HTA \u2014 Pr\u00e9cautions sport')));
 htaLightDiv.appendChild(h('div', {style: 'margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\u26A0 Mild hypertension (140-159/90-99 mmHg) : regular exercise is beneficial but must remain controlled (ESC/ESH 2018).' : '\u26A0 HTA l\u00e9g\u00e8re (140-159/90-99 mmHg) : l\'exercice r\u00e9gulier est b\u00e9n\u00e9fique mais doit rester contr\u00f4l\u00e9 (ESC/ESH 2018).')));
 htaLightDiv.appendChild((function(){ var _d = h('div', {style: 'margin-bottom:4px'}); _d.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? '\u2022 Maximum recommended intensity: ' : '\u2022 Intensité maximale recommandée : '))); _d.appendChild(termTooltip('RPE', _RPE_DEF)); _d.appendChild(document.createTextNode(window.isEnglish && window.isEnglish() ? ' 8/10 — avoid maximum efforts' : ' 8/10 — évitez les efforts maximaux')); return _d; })());
 htaLightDiv.appendChild(h('div', {style: 'margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\u2022 Avoid Valsalva (breath-holding during heavy push) \u2014 favor continuous breathing' : '\u2022 \u00c9vitez le Valsalva (apn\u00e9e en pouss\u00e9e lourde) \u2014 favorisez une respiration continue')));
 htaLightDiv.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? '\u2022 Monthly blood pressure check recommended. Consult your doctor if BP > 160/100 mmHg during exercise.' : '\u2022 Contr\u00f4le tensionnel mensuel recommand\u00e9. Consultez votre m\u00e9decin si PA > 160/100 mmHg \u00e0 l\'effort.')));
 _bannerTarget.appendChild(htaLightDiv);
 }

 // HTA sévère : avertissement intensité sport (ESC/ESH 2018, AHA/ACSM 2007)
 // hta_severe dans S.medical (onboarding nutrition) → bloquer HIIT/CrossFit + zones FC adaptées
 if (S.medical && S.medical.indexOf('hta_severe') !== -1) {
 var htaDiv = h('div', {style: 'background:rgba(122,31,31,0.06);border-left:3px solid var(--error,#7A1F1F);padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--error,#7A1F1F)'});
 htaDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--error,#7A1F1F);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Severe hypertension \u2014 Mandatory sport restrictions' : 'HTA S\u00e9v\u00e8re \u2014 Restrictions sport obligatoires')));
 htaDiv.appendChild(h('div', {style: 'margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\u26A0 Severe hypertension (\u2265180/110 mmHg) : HIIT, CrossFit and heavy isometric efforts are contraindicated (ESC/ESH 2018). Risk of pressure spike >300/150 mmHg (ACC 2019).' : '\u26A0 HTA s\u00e9v\u00e8re (\u2265180/110 mmHg) : HIIT, CrossFit et efforts isom\u00e9triques lourds sont contre-indiqu\u00e9s (ESC/ESH 2018). Risque de pic tensionnel >300/150 mmHg (ACC 2019).')));
 htaDiv.appendChild((function(){ var _d = h('div', {style: 'margin-bottom:4px'}); _d.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? '\u2022 Maximum intensity: ' : '\u2022 Intensité maximale : '))); _d.appendChild(termTooltip('RPE', _RPE_DEF)); _d.appendChild(document.createTextNode(window.isEnglish && window.isEnglish() ? ' 6/10 — cardio Z1-Z2 only (<65% HRmax)' : ' 6/10 — cardio Z1-Z2 uniquement (<65% FCmax)')); return _d; })());
 htaDiv.appendChild(h('div', {style: 'margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\u2022 Avoid Valsalva (heavy squat, deadlift, snatch) \u2014 Lamotte et al., Arch Cardiovasc Dis 2015' : '\u2022 \u00c9vitez le Valsalva (squat lourd, soulev\u00e9 de terre, arrach\u00e9) \u2014 Lamotte et al., Arch Cardiovasc Dis 2015')));
 htaDiv.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? '\u2022 Mandatory cardiological consultation before any program. Stress test recommended.' : '\u2022 Consultation cardiologique obligatoire avant tout programme. Test d\'effort recommand\u00e9.')));
 _bannerTarget.appendChild(htaDiv);
 }

 // IRC : avertissement intensité sport (KDOQI 2012 — intensité modérée, éviter Valsalva)
 if (S.medical && S.medical.indexOf('irc') !== -1) {
 var ircDiv = h('div', {style: 'background:rgba(62,92,58,0.06);border-left:3px solid var(--green,#3E5C3A);padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--green-ink,#2A4027)'});
 ircDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'CKD \u2014 Adapted program' : 'IRC \u2014 Programme adapt\u00e9')));
 ircDiv.appendChild(h('div', {style: 'margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '⚠ Chronic Kidney Disease : exercises with high intra-abdominal pressure removed (KDOQI 2012). Moderate intensity recommended.' : '⚠ Insuffisance R\u00e9nale Chronique : exercices \u00e0 forte pression intra-abdominale retir\u00e9s (KDOQI 2012). Intensit\u00e9 mod\u00e9r\u00e9e recommand\u00e9e.')));
 ircDiv.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? '\u2022 Avoid Valsalva : deadlift, heavy squat, snatch \u2014 prefer machines and light free weights.' : '\u2022 \u00c9vitez le Valsalva : soulev\u00e9 de terre, squat lourd, arrach\u00e9 \u2014 privil\u00e9giez machines et poids libres l\u00e9gers.')));
 _bannerTarget.appendChild(ircDiv);
 }

 // Sommeil insuffisant : avertissement récupération (S.sleep 0=<6h, 1=6-7h) — ACSM 2020, IOC 2018
 if (S.sleep !== null && S.sleep !== undefined && S.sleep <= 1) {
 var sleepLabels = ['< 6h', '6-7h'];
 var sleepMsg = S.sleep === 0
 ? (window.isEnglish && window.isEnglish() ? ' Sleep < 6h/night — high overtraining risk. Performance -30%, recovery compromised (IOC 2018). Limit intense sessions to 2/week. Avoid consecutive HIIT blocks.' : ' Sommeil < 6h/nuit — risque de surentra\u00eenement \u00e9lev\u00e9. Performance -30%, r\u00e9cup\u00e9ration compromise (IOC 2018). Limitez les s\u00e9ances intenses \u00e0 2/semaine. \u00c9vitez les blocs HIIT cons\u00e9cutifs.')
 : (window.isEnglish && window.isEnglish() ? ' Sleep 6-7h/night — partial recovery. Keep at most 4 sessions/week. Avoid 2 intense days in a row.' : ' Sommeil 6-7h/nuit \u2014 r\u00e9cup\u00e9ration partielle. Maintenez au maximum 4 s\u00e9ances/semaine. \u00c9vitez 2 jours intenses d\'affi\u00e9e.');
 _bannerTarget.appendChild(h('div', {style: 'background:#FFF8E1;border-left:4px solid #F9A825;padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E)'}, sleepMsg));
 }

 var goalNames = (S.sportGoals || []).map(function(gid){
 var g = (window.SPORT_GOALS || []).find(function(x){ return x.id === gid; });
 return g ? g.name : '';
 }).filter(function(n){ return n; }).join(' + ');
 // RPE Guide for beginners
 if (S.sportLevel === 'beginner' || !S.sportLevel) {
  if (S.sportLevel === 'beginner' && S._rpeGuideExpanded === undefined) S._rpeGuideExpanded = true;
  var rpeWrap = h('div', {style: 'border:1px solid var(--border,#E8E6DF);margin-bottom:16px;border-radius:2px'});
  var rpeHeader = h('div', {
   style: 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;cursor:pointer;background:var(--ivory2,#F5F4F0)',
   onclick: function() { S._rpeGuideExpanded = !S._rpeGuideExpanded; window.render(); }
  });
  rpeHeader.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.5px;color:var(--black,#1A1A18)'}, (window.isEnglish && window.isEnglish() ? 'What is RPE? (effort rate)' : 'C\'est quoi le RPE ? (taux d\'effort)')));
  rpeHeader.appendChild(h('div', {style: 'font-size:12px;color:var(--grey)'}, S._rpeGuideExpanded ? '▲' : '▼'));
  rpeWrap.appendChild(rpeHeader);

  if (S._rpeGuideExpanded) {
   var rpeBody = h('div', {style: 'padding:12px 14px'});
   rpeBody.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin-bottom:10px;line-height:1.6'}, (window.isEnglish && window.isEnglish() ? 'RPE measures your effort out of 10. Simple: how many more reps could you have done?' : 'Le RPE mesure votre effort sur 10. Simple : combien de reps auriez-vous pu faire en plus ?')));
   var _rpeIsEN = window.isEnglish && window.isEnglish();
   var rpeRows = [
    ['RPE 5-6', '#3E5C3A', _rpeIsEN ? 'Easy — you could do 4-5 more reps. Warm-up.' : 'Facile — vous pourriez faire encore 4-5 reps. \u00c9chauffement.'],
    ['RPE 7', '#7A3B0E', _rpeIsEN ? 'Moderate — you could do 3 more reps. Progression zone.' : 'Mod\u00e9r\u00e9 — vous pourriez faire encore 3 reps. Zone de progression.'],
    ['RPE 8', '#7A3B0E', _rpeIsEN ? 'Hard — 2 more reps possible. Hypertrophy zone.' : 'Dur — encore 2 reps possibles. Zone de hypertrophie.'],
    ['RPE 9', '#7A1F1F', _rpeIsEN ? 'Very hard — 1 more rep. Reserved for advanced.' : 'Tr\u00e8s dur — encore 1 rep. R\u00e9serv\u00e9 aux avanc\u00e9s.'],
    ['RPE 10', '#7A1F1F', _rpeIsEN ? 'Complete failure — not a single rep left. Not recommended for beginners.' : '\u00c9chec total — plus une seule rep possible. D\u00e9conseill\u00e9 aux d\u00e9butants.']
   ];
   rpeRows.forEach(function(row) {
    var rpeRow = h('div', {style: 'display:flex;align-items:flex-start;gap:10px;margin-bottom:7px'});
    rpeRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;color:' + row[1] + ';min-width:52px;flex-shrink:0;padding-top:1px'}, row[0]));
    rpeRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5'}, row[2]));
    rpeBody.appendChild(rpeRow);
   });
   rpeBody.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey);margin-top:8px;border-top:1px solid var(--border);padding-top:8px'}, (window.isEnglish && window.isEnglish() ? 'As a beginner, aim for RPE 7-8. Stop if it hurts (\u2260 normal muscle burn).' : 'En tant que d\u00e9butant, visez RPE 7-8. Arr\u00eatez si \u00e7a fait mal (\u2260 br\u00fblure musculaire normale).')));
   rpeWrap.appendChild(rpeBody);
  }
  p.appendChild(rpeWrap);
 }

 p.appendChild(h('p', {'class': 'subtitle'}, S.sportDays + ' ' + (window.isEnglish && window.isEnglish() ? 'days/week \u2014 ' : 'jours/semaine \u2014 ') + goalNames));
 if (window.TIPS) TIPS.renderTip(p, 'sportProgram');

 // ─── SUIVI 7 SEMAINES (collapsible) ───
 (function() {
  loadMuscuWeek();
  var _wkNum = (typeof sfcGetEffectiveWeek === 'function') ? sfcGetEffectiveWeek() : (S.muscuWeek || 1);
  var _wkPhase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(_wkNum) : {label: '', color: 'var(--ink-900,#0A0A09)'};
  var _wtOpen = !!S._weekTrackerOpen;
  var _wtBar = h('div', {
   style: 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--ivory2,#F4F2EB);border:1px solid var(--border,#D8D8D0);border-left:3px solid ' + ((_wkPhase && _wkPhase.color) || 'var(--ink-900,#0A0A09)') + ';cursor:pointer;margin-bottom:' + (_wtOpen ? '0' : '12px'),
   onclick: function(e) { e.stopPropagation(); S._weekTrackerOpen = !S._weekTrackerOpen; window.render(); }
  });
  _wtBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);font-weight:600'}, (window.isEnglish && window.isEnglish() ? 'PROGRESS \u00b7 Wk. ' : 'PROGRESSION \u00b7 Sem. ') + _wkNum + '/7 \u00b7 ' + ((_wkPhase && _wkPhase.label) || '')));
  _wtBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, _wtOpen ? '▲' : '▼'));
  p.appendChild(_wtBar);
  if (_wtOpen) {
   var _wtContent = h('div', {style: 'margin-bottom:12px'});
   renderWeekTracker(_wtContent);
   p.appendChild(_wtContent);
  }
 })();

 // Show zone focus with star count
 var focusZones = Object.keys(S.sportFocus || {})
 .filter(function(z){ return S.sportFocus[z] > 0; })
 .sort(function(a, b){ return S.sportFocus[b] - S.sportFocus[a]; });
 if (focusZones.length > 0) {
 var focusText = focusZones.map(function(z) {
 var starCount = Math.min(S.sportFocus[z], 5);
 var stars = '';
 for (var i = 0; i < starCount; i++) stars += '\u2605';
 return z + ' ' + stars;
 }).join(' \u00b7 ');
 p.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;color:var(--grey);margin-top:4px;text-align:center'}, focusText));
 }

 // ─── MUSCLES DE LA SÉANCE ───
 var _selDayIdx = S.selectedSportDay || 0;
 var _selDay = (Array.isArray(S.sportProgram) && _selDayIdx >= 0 && _selDayIdx < S.sportProgram.length) ? S.sportProgram[_selDayIdx] : null;
 if (_selDay && Array.isArray(_selDay.exercises) && _selDay.exercises.length > 0 && window.VOLUME_LANDMARKS) {
 var _sessionMuscleKeywords = {
 chest: ['pectoral', 'poitrine', 'chest', 'pectoraux'],
 back: ['dos', 'back', 'dorsaux', 'grand dorsal', 'traction', 'rowing'],
 shoulders: ['\u00e9paule', 'epaule', 'shoulder', 'deltoid', 'deltoi\u0308de', 'deltoide', 'trap\u00e8ze', 'trapeze', 'militaire', 'overhead'],
 legs: ['jambe', 'quadri', 'ischio', 'mollet', 'leg', 'squat'],
 glutes: ['fessier', 'fessiers', 'glute', 'hip thrust'],
 biceps: ['biceps'],
 triceps: ['triceps'],
 abs: ['abdo', 'abdominaux', 'gainage', 'transverse', 'oblique', 'grand droit']
 };
 var _sessionSetCount = {};
 _selDay.exercises.forEach(function(ex) {
 var m = (ex.m || '').toLowerCase();
 Object.keys(_sessionMuscleKeywords).forEach(function(cat) {
 if (_sessionMuscleKeywords[cat].some(function(kw) { return m.indexOf(kw) !== -1; })) {
 var sets = typeof ex.sets === 'string' ? (parseInt(ex.sets) || 3) : (ex.sets || 3);
 _sessionSetCount[cat] = (_sessionSetCount[cat] || 0) + sets;
 }
 });
 });
 var _sessionCats = Object.keys(_sessionSetCount).filter(function(c) { return _sessionSetCount[c] > 0; });
 if (_sessionCats.length > 0) {
 var _maxSets = Math.max.apply(null, _sessionCats.map(function(c) { return _sessionSetCount[c]; }));
 var _muscleSection = h('div', {style: 'margin-bottom:20px'});
 _muscleSection.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Session muscles' : 'Muscles de la s\u00e9ance')));
 _sessionCats.sort(function(a, b) { return _sessionSetCount[b] - _sessionSetCount[a]; });
 _sessionCats.forEach(function(cat) {
 var lm = window.VOLUME_LANDMARKS[cat];
 var label = lm ? lm.label : cat;
 var sets = _sessionSetCount[cat];
 var pct = _maxSets > 0 ? Math.round(sets / _maxSets * 100) : 0;
 var row = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:5px'});
 row.appendChild(h('div', {style: 'width:75px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);flex-shrink:0'}, label));
 var barWrap = h('div', {style: 'flex:1;height:6px;background:var(--border,#E8E6DF);border-radius:2px;overflow:hidden'});
 barWrap.appendChild(h('div', {style: 'height:6px;width:' + pct + '%;background:var(--ink-900,#0A0A09);border-radius:2px;transition:width 0.4s ease'}));
 row.appendChild(barWrap);
 row.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);flex-shrink:0;min-width:40px;text-align:right'}, sets + ' s.'));
 _muscleSection.appendChild(row);
 });
 p.appendChild(_muscleSection);
 }
 }

 // FIX UX 2026-04-16 — Strength Grade retiré de la vue programme (déplacé vers profil).
 // L'user vient ici pour ses exercices, pas pour voir son grade de force.

 // ═══ FIX HERMÈS POLISH 2026-04-16 — Grossesse, cycle, suppléments, estimation calorique ═══
 // DÉPLACÉS APRÈS les exercices pour que l'user voie ses exos en 1-2 scrolls max.
 // Les cartes sont stockées dans _deferredCards et insérées après les boutons d'action.

 // Cycle menstruel — data nécessaire pour le badge intensité dans les exercices
 var cycleInfo = null;
 if (window.isFemale(S) && S.cycleTracking) {
 cycleInfo = window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : null;
 }

 // ─── PRO PROGRAMS ACCESS (advanced/pro only) ───
 // FIX 2026-04-16 : déplacé SOUS le programme quotidien (avant : au-dessus = confusion UX).
 // Rendu collapsible + bouton "Adopter ce programme" qui injecte les exercices SFC dans
 // S.sportProgram pour bénéficier du tracking complet (charges, reps, RIR, progression).
 if ((S.sportLevel === 'advanced' || S.sportLevel === 'pro') && window.SFC_PROGRAMS) {
  var _sfcKeys = Object.keys(window.SFC_PROGRAMS).filter(function(k) {
   var _p = window.SFC_PROGRAMS[k];
   return _p && !_p.variations;
  });
  if (_sfcKeys.length > 0) {
   var _sfcCollapsed = !S._sfcExplorerOpen;
   var _sfcSection = h('div', {style: 'margin-top:24px;margin-bottom:20px;border-top:1px solid var(--line,#D8D8D0);padding-top:16px'});

   // Header collapsible
   var _sfcHeader = h('div', {
    style: 'display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0;',
    onclick: function() { S._sfcExplorerOpen = !S._sfcExplorerOpen; window.render(); }
   });
   _sfcHeader.appendChild(h('div', {'class':'section-label', style:'margin:0;border:none;padding:0'}, (window.isEnglish && window.isEnglish() ? 'Scientific library' : 'Biblioth\u00e8que scientifique')));
   _sfcHeader.appendChild(h('div', {style:'font-size:12px;color:var(--grey);transition:transform 200ms'}, _sfcCollapsed ? '\u25BC' : '\u25B2'));
   _sfcSection.appendChild(_sfcHeader);
   _sfcSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px;line-height:1.5'}, (window.isEnglish && window.isEnglish() ? 'Periodized programs Schoenfeld / RP Hypertrophy. Select a muscle group then adopt it for full tracking.' : 'Programmes p\u00e9riodis\u00e9s Schoenfeld / RP Hypertrophy. S\u00e9lectionnez un groupe musculaire puis adoptez-le pour b\u00e9n\u00e9ficier du tracking complet.')));

   if (!_sfcCollapsed) {

   var _sfcGrid = h('div', {style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px'});
   _sfcKeys.forEach(function(key) {
    var prog = window.SFC_PROGRAMS[key];
    if (!prog) return;
    var _isActive = S._activeSfcProgram === key;
    var _sfcBtn = h('button', {
     style: 'padding:10px 8px;border:1px solid ' + (_isActive ? 'var(--ink-900,#0A0A09)' : 'var(--border,#E8E6DF)') + ';background:' + (_isActive ? 'rgba(26,74,26,0.06)' : 'transparent') + ';border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;color:var(--black,#1A1A18);text-align:center',
     onclick: (function(_key, _active) { return function() {
      S._activeSfcProgram = _active ? null : _key;
      window.render();
     }; })(key, _isActive)
    }, prog.name || (key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')));
    _sfcGrid.appendChild(_sfcBtn);
   });
   _sfcSection.appendChild(_sfcGrid);

   // C4: Phase selector buttons — Masse | Sèche | Force
   // Calcul de la phase effective (utilisée pour l'affichage bouton ET label) :
   // priorité 1 — clic explicite (S._sfcPhase), priorité 2 — objectif sportif, défaut — masse
   var _effectivePhase = S._sfcPhase;
   if (!_effectivePhase) {
    if (S.sportGoals && (S.sportGoals.indexOf('shred') !== -1 || S.sportGoals.indexOf('weightloss') !== -1)) _effectivePhase = 'seche';
    else if (S.sportGoals && (S.sportGoals.indexOf('force') !== -1 || S.sportGoals.indexOf('strength') !== -1)) _effectivePhase = 'force';
    else _effectivePhase = 'masse';
   }
   var _phaseSelector = h('div', {style: 'display:flex;flex-direction:row;gap:8px;margin-bottom:16px'});
   ['masse', 'seche', 'force'].forEach(function(ph) {
    var _phLabels = window.isEnglish && window.isEnglish() ? {masse: 'Hypertrophy', seche: 'Cutting', force: 'Strength'} : {masse: 'Masse', seche: 'S\u00e8che', force: 'Force'};
    var _phActive = _effectivePhase === ph;
    var _phBtn = h('button', {
     style: 'flex:1;min-height:44px;padding:8px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;' + (_phActive ? 'background:var(--ink-900,#0A0A09);color:white;border:1px solid var(--ink-900,#0A0A09)' : 'background:transparent;color:var(--black,#1A1A18);border:1px solid var(--border,#E8E6DF)'),
     onclick: (function(_ph) { return function() { S._sfcPhase = _ph; window.render(); }; })(ph)
    }, _phLabels[ph]);
    _phaseSelector.appendChild(_phBtn);
   });
   _sfcSection.appendChild(_phaseSelector);

   // If a program is selected, show its exercises for the current phase
   if (S._activeSfcProgram && window.SFC_PROGRAMS[S._activeSfcProgram]) {
    var _selProg = window.SFC_PROGRAMS[S._activeSfcProgram];
    // Human-readable program name: use .name if available, otherwise capitalize the key
    var _progDisplayName = _selProg.name || (S._activeSfcProgram.charAt(0).toUpperCase() + S._activeSfcProgram.slice(1).replace(/_/g, ' '));
    // Phase à utiliser : _effectivePhase déjà calculé ci-dessus (cohérent avec le bouton sélectionné)
    var _phaseKey = _effectivePhase;

    // For force phase: consult SFC_PROGRAMS_FORCE first (separate object), then fall back
    var _phaseObj = null;
    if (_phaseKey === 'force' && window.SFC_PROGRAMS_FORCE && window.SFC_PROGRAMS_FORCE[S._activeSfcProgram]) {
     var _forceEntry = window.SFC_PROGRAMS_FORCE[S._activeSfcProgram];
     _phaseObj = _forceEntry.force || null;
    }
    // Fallback: standard phase in SFC_PROGRAMS, then masse, then first key with .exercises
    if (!_phaseObj) _phaseObj = _selProg[_phaseKey] || _selProg.masse || null;
    if (!_phaseObj) {
     var _firstKey = Object.keys(_selProg).find(function(k) { return _selProg[k] && typeof _selProg[k] === 'object' && _selProg[k].exercises; });
     _phaseObj = _firstKey ? _selProg[_firstKey] : null;
    }
    var _phaseExos = (_phaseObj && _phaseObj.exercises) ? _phaseObj.exercises : (Array.isArray(_phaseObj) ? _phaseObj : []);

    // C3: Medical filter — exclude exercises contraindicated by user's bilan médical
    var _sfcEqLimitedBadge = false;
    if (Array.isArray(_phaseExos) && _phaseExos.length > 0 && S.muscuMedical) {
     var _medFiltered = _phaseExos.filter(function(exo) {
      var _n = (exo.name || exo.n || '').toLowerCase();
      if (S.muscuMedical.shoulders && /militaire|overhead|élévation|elevation|arnold|upright|tirage menton|hspu/.test(_n)) return false;
      if (S.muscuMedical.knees && /leg extension|jump|pistol|sissy/.test(_n)) return false;
      if (S.muscuMedical.lowerBack && /good morning lourd|deadlift maximum/.test(_n)) return false;
      return true;
     });
     // Safety fallback: if all exercises filtered out, keep first 2 unfiltered
     _phaseExos = (_medFiltered.length > 0) ? _medFiltered : _phaseExos.slice(0, 2);
    }

    // C5: Equipment filter for SFC exercises (strict — respect S.sportEquipment profile)
    if (Array.isArray(_phaseExos) && _phaseExos.length > 0 && S.sportEquipment && typeof S.sportEquipment === 'string' && S.sportEquipment !== 'gym') {
     var _sfcFiltered = _phaseExos.filter(function(exo) {
      var _eq = (exo.equipment || '').toLowerCase();
      if (S.sportEquipment === 'home') {
       return /poids du corps|poids de corps|sans mat|sol|\u00e9lastique|elastique/.test(_eq) || _eq === '';
      }
      if (S.sportEquipment === 'dumbbells') {
       if (/c\u00e2ble|poulie|machine|t-bar|landmine|convergente|pec deck|barre fixe|chaise romaine|rouleau/.test(_eq)) return false;
       if (/^barre\b/.test(_eq) && !/ou halt|halt[e\u00e8]res ou barre/.test(_eq)) return false;
      }
      return true;
     });
     // C5 fix: if at least 1 exercise passes, use filtered list (even if only 1)
     // Only fall back to full pool if 0 pass, and mark badge
     if (_sfcFiltered.length > 0) {
      _phaseExos = _sfcFiltered;
     } else {
      _phaseExos = _phaseExos.slice(0, 3);
      _sfcEqLimitedBadge = true;
     }
    }

    if (Array.isArray(_phaseExos) && _phaseExos.length > 0) {
     // Phase label header
     _sfcSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, _progDisplayName + ' \u2014 ' + _phaseKey));

     // C5: Equipment limited badge
     if (_sfcEqLimitedBadge) {
      _sfcSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);background:rgba(106,74,26,0.08);border:1px solid rgba(106,74,26,0.2);padding:6px 10px;border-radius:2px;margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Limited equipment \u2014 these exercises may not match your available gear' : '\u00c9quipement limit\u00e9 \u2014 ces exercices peuvent ne pas correspondre \u00e0 votre mat\u00e9riel')));
     }

     // Warmup banner
     if (_phaseObj && _phaseObj.warmup) {
      var _warmupEl = h('div', {style: 'display:flex;align-items:flex-start;gap:8px;background:rgba(62,92,58,0.06);border-left:3px solid var(--green,#3E5C3A);padding:10px 14px;margin-bottom:12px;border-radius:0'});
      var _warmupRight = h('div', {});
      _warmupRight.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--green,#3E5C3A);margin-bottom:3px'}, (window.isEnglish && window.isEnglish() ? 'Warm-up' : '\u00c9chauffement')));
      _warmupRight.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#1A1A18);line-height:1.5'}, _phaseObj.warmup));
      _warmupEl.appendChild(_warmupRight);
      _sfcSection.appendChild(_warmupEl);
     }

     // Program notes (from phase object, not top-level)
     var _phaseNotes = (_phaseObj && _phaseObj.notes) ? _phaseObj.notes : null;
     if (_phaseNotes) {
      _sfcSection.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey);margin-bottom:12px;line-height:1.6;border-left:2px solid var(--border);padding-left:10px'}, _phaseNotes));
     }

     // Exercise cards
     _phaseExos.forEach(function(exo) {
      var _exCard = h('div', {style: 'border:1px solid var(--border);padding:12px 14px;margin-bottom:8px;border-radius:2px'});
      // Exercise type badge (compound vs isolation)
      var _exTop = h('div', {style: 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px'});
      _exTop.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:700;line-height:1.3'}, (exo.order ? exo.order + '. ' : '') + (exo.name || exo.n || '')));
      if (exo.type) {
       var _typeBg = exo.type === 'compound' ? 'rgba(26,74,26,0.08)' : exo.type === 'superset' ? 'rgba(90,16,16,0.08)' : 'rgba(26,58,106,0.08)';
       var _typeCol = exo.type === 'compound' ? 'var(--success,#3E5C3A)' : exo.type === 'superset' ? 'var(--error,#7A1F1F)' : 'var(--blue,#1A3A6A)';
       var _typeBadge = h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:2px 6px;background:' + _typeBg + ';color:' + _typeCol + ';border-radius:2px;flex-shrink:0;margin-left:6px'});
       if (exo.type === 'compound') {
        _typeBadge.appendChild(termTooltip('Compound', (window.isEnglish && window.isEnglish() ? 'Multi-joint exercise recruiting several muscle groups simultaneously' : 'Exercice poly-articulaire qui recrute plusieurs groupes musculaires simultanément')));
       } else if (exo.type === 'isolation') {
        _typeBadge.appendChild(termTooltip('Isolation', 'Exercice mono-articulaire ciblant un seul muscle'));
       } else {
        _typeBadge.appendChild(h('span', {}, exo.type));
       }
       _exTop.appendChild(_typeBadge);
      }
      _exCard.appendChild(_exTop);
      // Sets × reps · rest — muscle target
      var _exMeta = (exo.sets || '') + ' ' + (window.isEnglish && window.isEnglish() ? 'sets \u00d7 ' : 's\u00e9ries \u00d7 ') + (exo.reps || '') + ' reps \u00b7 ' + (window.isEnglish && window.isEnglish() ? 'Rest ' : 'Repos ') + (exo.rest || '90s');
      if (exo.muscle) _exMeta += ' \u2014 ' + exo.muscle;
      _exCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, _exMeta));
      // Equipment tag
      if (exo.equipment) {
       _exCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:6px'}, exo.equipment));
      }
      // Technique (full text, not truncated)
      if (exo.technique) {
       _exCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey);margin-top:2px;line-height:1.6;border-top:1px solid var(--border);padding-top:8px'}, exo.technique));
      }
      // RIR target badge
      if (exo.rirTarget !== undefined) {
       var _rirColors = {0:'var(--error,#7A1F1F)', 1:'var(--error,#7A1F1F)', 2:'var(--orange-ink,#7A3B0E)', 3:'var(--orange-ink,#7A3B0E)', 4:'var(--success,#3E5C3A)'};
       var _rirC = _rirColors[exo.rirTarget] || 'var(--orange-ink,#7A3B0E)';
       var _rirBadge = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + _rirC + ';margin-top:6px;padding:3px 8px;background:rgba(232,111,30,0.06);display:inline-block;border-radius:2px'});
       _rirBadge.appendChild(termTooltip('RIR', (window.isEnglish && window.isEnglish() ? 'Reps In Reserve — number of reps you could still do before muscle failure' : 'Reps In Reserve — nombre de reps que vous pourriez encore faire avant l\'\u00e9chec musculaire')));
       var _rirIsEN = window.isEnglish && window.isEnglish(); _rirBadge.appendChild(h('span', {}, '\u00a0' + (_rirIsEN ? 'target' : 'cible') + '\u00a0: ' + exo.rirTarget + (exo.rirTarget === 0 ? ' \u2014 ' + (_rirIsEN ? 'failure' : '\u00e9chec') : exo.rirTarget === 1 ? ' \u2014 ' + (_rirIsEN ? 'near-failure' : 'quasi-\u00e9chec') : exo.rirTarget === 2 ? ' \u2014 ' + (_rirIsEN ? 'intense effort' : 'effort intense') : exo.rirTarget === 3 ? ' \u2014 ' + (_rirIsEN ? 'moderate' : 'mod\u00e9r\u00e9') : ' \u2014 ' + (_rirIsEN ? 'light' : 'l\u00e9ger'))));
       _exCard.appendChild(_rirBadge);
      }
      _sfcSection.appendChild(_exCard);
     });

     // ═══ BOUTON "ADOPTER CE PROGRAMME" ═══
     // Convertit les exercices SFC sélectionnés en format sportProgram trackable.
     // L'user bénéficie ensuite du tracking complet : charges, reps, RIR, progression, timer.
     var _adoptBtn = h('button', {
      style: 'width:100%;margin-top:16px;padding:14px;background:var(--ink-900,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;min-height:44px;',
      onclick: (function(_exos, _name, _phase) { return function() {
       // Convertir en format sportProgram : un "jour" = la séance SFC sélectionnée
       var _converted = _exos.map(function(exo, idx) {
        return {
         n: exo.name || exo.n || '',
         m: exo.muscle || '',
         eq: exo.equipment || '',
         sets: (exo.sets || 4) + '\u00d7' + (exo.reps || '8-12'),
         rest: exo.rest || '90s',
         technique: exo.technique || '',
         type: exo.type || '',
         rirTarget: exo.rirTarget,
         order: idx + 1
        };
       });
       // Remplacer le jour sélectionné dans sportProgram
       var _dayIdx = S.selectedSportDay || 0;
       if (!Array.isArray(S.sportProgram)) S.sportProgram = [];
       // Créer/remplacer le jour
       S.sportProgram[_dayIdx] = {
        day: _dayIdx + 1,
        label: _name + ' — ' + _phase,
        focus: _name,
        exercises: _converted
       };
       S._activeSfcProgram = null;
       S._sfcExplorerOpen = false;
       if (window.saveProfile) window.saveProfile();
       if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? '\u2713 Scientific program adopted — tracking active' : '\u2713 Programme scientifique adopté — tracking actif', 'success', 2000);
       if (window.render) window.render();
      }; })(_phaseExos, _progDisplayName, _phaseKey)
     }, (window.isEnglish && window.isEnglish() ? 'Adopt this program \u2192 active tracking' : 'Adopter ce programme \u2192 tracking actif'));
     _sfcSection.appendChild(_adoptBtn);
    }
   }
   } // end if (!_sfcCollapsed)

   // Stocké pour insertion APRÈS le programme quotidien (pas avant)
   window._pendingSfcSection = _sfcSection;
  }
 }

 // ─── I4+I5: SPLIT SELECTOR (intermediate+ only) ───
 var _isIntermediate = S.sportLevel === 'intermediate' || S.sportLevel === 'advanced' || S.sportLevel === 'pro';
 var _numDays = S.sportDays || (S.sportProgram && S.sportProgram.length) || 0;

 // Define split options per number of training days
 var _SPLIT_OPTIONS = {
  2: [
   {id:'fullbody_ab', label:'Full Body A/B', dayLabels:['Full Body A','Full Body B']}
  ],
  3: [
   {id:'fullbody_3', label:'Full Body', dayLabels:['Full Body A','Full Body B','Full Body C']},
   {id:'ppl_3', label:'Push-Pull-Legs', dayLabels:['Push','Pull','Legs']}
  ],
  4: [
   {id:'upper_lower', label:'Upper/Lower', dayLabels:['Upper A','Lower A','Upper B','Lower B']},
   {id:'ppl_plus1', label:'PPL+1', dayLabels:['Push','Pull','Legs','Upper']},
   {id:'bro_4', label:'Bro Split 4j', dayLabels:['Pecs + Triceps','Dos + Biceps','Épaules','Jambes']}
  ],
  5: [
   {id:'ppl_5', label:'PPL 5j', dayLabels:['Push A','Pull A','Legs','Push B','Pull B']},
   {id:'bro_5', label:'Bro Split 5j', dayLabels:['Pecs','Dos','Épaules','Bras','Jambes']}
  ],
  6: [
   {id:'ppl_6', label:'PPL×2', dayLabels:['Push A','Pull A','Legs A','Push B','Pull B','Legs B']}
  ]
 };

 var _splitOpts = _SPLIT_OPTIONS[_numDays] || null;

 if (_isIntermediate && _splitOpts && _splitOpts.length > 0) {
  // Initialize split choice to first option if not set or not valid for current day count
  var _validIds = _splitOpts.map(function(o){ return o.id; });
  if (!S._splitChoice || _validIds.indexOf(S._splitChoice) === -1) {
   S._splitChoice = _splitOpts[0].id;
  }

  var _splitSection = h('div', {style: 'margin-bottom:12px'});
  _splitSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Training split' : 'Split d\'entra\u00eenement')));
  var _splitBtns = h('div', {style: 'display:flex;flex-wrap:wrap;gap:6px'});
  _splitOpts.forEach(function(opt) {
   var _isActive = S._splitChoice === opt.id;
   var _btn = h('button', {
    style: 'height:36px;padding:0 12px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;border:1px solid ' + (_isActive ? 'var(--ink-900,#0A0A09)' : 'var(--border,#E8E6DF)') + ';background:' + (_isActive ? 'rgba(26,74,26,0.08)' : 'transparent') + ';color:' + (_isActive ? 'var(--ink-900,#0A0A09)' : 'var(--black,#1A1A18)') + ';font-weight:' + (_isActive ? '600' : '400'),
    // FIX P0 2026-04-16 — Changement de split DOIT régénérer le programme.
    // Avant : seul _splitChoice changeait + render() → onglets "Legs" mais exercices épaules
    // de l'ancien split. Maintenant : on régénère immédiatement pour aligner exercices et labels.
    onclick: (function(_id) { return function() {
      S._splitChoice = _id;
      try { S.sportProgram = generateSportProgram(); } catch(e) { console.error('[split] regen error:', e); }
      S.selectedSportDay = 0;
      // Préserver le statut validé (l'user a juste changé de split, pas reset)
      S.sportProgramValidated = true; S.sportProgramValidatedAt = new Date().toISOString();
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      window.render();
    }; })(opt.id)
   }, opt.label);
   _splitBtns.appendChild(_btn);
  });
  _splitSection.appendChild(_splitBtns);
  p.appendChild(_splitSection);
 } else if (!_isIntermediate) {
  // Beginners: no split selector, clear any previous split choice
  S._splitChoice = null;
 }

 // ─── I6: PROGRAMME HEADER BANNER ───
 // FIX UX 2026-04-16 — Banner supprimé (redondant avec subtitle sous H1).
 // FIX _sfcPhase leak — banner n'utilise plus _sfcPhase pour l'affichage.

 // Day tabs — rename according to split choice if available
 var _currentSplitOpt = null;
 if (S._splitChoice && _splitOpts) {
  _currentSplitOpt = _splitOpts.filter(function(o){ return o.id === S._splitChoice; })[0] || null;
 }

 if (!Array.isArray(S.sportProgram) || S.sportProgram.length === 0) return;

 // FIX 2026-04-16 — reset selectedSportDay à aujourd'hui AVANT le render des tabs
 // (sinon la tab active est celle d'hier pendant un tick)
 var _sportTodayKey = new Date().toISOString().slice(0, 10);
 if (S._selectedSportDayDate !== _sportTodayKey || typeof S.selectedSportDay !== 'number' || S.selectedSportDay < 0 || S.selectedSportDay >= S.sportProgram.length) {
   // Essayer de matcher le jour actuel si trainingDaysSelected existe
   var _todayIdx = (new Date().getDay() + 6) % 7;
   if (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length > 0) {
     var _pos = S.trainingDaysSelected.indexOf(_todayIdx);
     if (_pos >= 0) {
       // Aujourd'hui est un jour d'entraînement → afficher ce jour
       S.selectedSportDay = Math.max(0, Math.min(_pos, S.sportProgram.length - 1));
     } else {
       // Aujourd'hui est un jour de repos → trouver le prochain jour d'entraînement
       var _nextIdx = -1;
       for (var _di = 1; _di <= 7; _di++) {
         var _candidate = (_todayIdx + _di) % 7;
         var _nextPos = S.trainingDaysSelected.indexOf(_candidate);
         if (_nextPos >= 0) { _nextIdx = _nextPos; break; }
       }
       S.selectedSportDay = (_nextIdx >= 0) ? Math.max(0, Math.min(_nextIdx, S.sportProgram.length - 1)) : 0;
     }
   } else {
     S.selectedSportDay = Math.max(0, Math.min(_todayIdx, S.sportProgram.length - 1));
   }
   S._selectedSportDayDate = _sportTodayKey;
 }

 var tabs = h('div', {'class': 'day-tabs'});
 var _dayAbbrFR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
 var _dayAbbrEN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
 var _dayAbbr = (window.isEnglish && window.isEnglish()) ? _dayAbbrEN : _dayAbbrFR;
 var _hasDayMap = Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length === S.sportProgram.length;
 function _shortFocus(focus) {
  if (!focus) return '';
  var trimmed = String(focus).trim();
  if (trimmed.length <= 9) return trimmed;
  var f = trimmed.toLowerCase();
  if (/full[\s-]?body|tout/.test(f)) return 'Full Body';
  if (/push|pectoral|poitrine/.test(f)) return 'Push';
  if (/pull|dorsaux/.test(f)) return 'Pull';
  if (/upper|haut du corps/.test(f)) return 'Upper';
  if (/lower|bas du corps/.test(f)) return 'Lower';
  if (/\bcore\b|abdo/.test(f)) return 'Core';
  if (/cardio|hiit/.test(f)) return 'Cardio';
  if (/repos|rest/.test(f)) return 'Repos';
  var first = trimmed.split(/[\s,·\-]/)[0];
  return first.length > 10 ? first.slice(0, 10) : first;
 }
 S.sportProgram.forEach(function(day, i) {
  var _short = _shortFocus(day.focus);
  var _dayPrefix = _hasDayMap ? _dayAbbr[S.trainingDaysSelected[i]] : ((window.isEnglish && window.isEnglish() ? 'D' : 'J') + (i + 1));
  var _tabLabel = _short ? (_dayPrefix + ' \u00b7 ' + _short) : _dayPrefix;
  tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedSportDay === i ? ' active' : ''), onclick: (function(idx){ return function(){ S.selectedSportDay = idx; S.currentExerciseIdx = 0; S._exSwipeDayIdx = idx; window.render(); }; })(i)}, _tabLabel));
 });
 p.appendChild(tabs);

 // Current day — bounds check (already reset above)
 var day = S.sportProgram[S.selectedSportDay];
 if (day) {
 // ─── EN-TÊTE : focus pleine largeur + méta en dessous ───
 (function() {
  var _hdrWeek = S.muscuWeek || 1;
  var _hdrAllEx = (day.exercises || []).concat((S.bonusExercises || {})[S.selectedSportDay] || []);
  var _hdrDur = calcSessionDuration(_hdrAllEx);
  var _hdrProgRate = S.sportLevel === 'beginner' ? 0.025 : 0.05;
  var _hdrProgPct = Math.round(_hdrProgRate * Math.min(_hdrWeek - 1, 12) * 100);
  var _hdrWrap = h('div', {style: 'margin:14px 0 10px'});
  _hdrWrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);line-height:1.6;word-break:break-word;margin-bottom:4px'}, day.focus || ''));
  var _dayAbbr2 = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  var _hdrDayStr = (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length === S.sportProgram.length) ? _dayAbbr2[S.trainingDaysSelected[S.selectedSportDay]] : null;
  var _metaParts = [_hdrDayStr ? _hdrDayStr + '\u00a0\u2014\u00a0' + (window.isEnglish && window.isEnglish() ? 'Wk.\u00a0' : 'Sém.\u00a0') + _hdrWeek : (window.isEnglish && window.isEnglish() ? 'Wk.\u00a0' : 'Sém.\u00a0') + _hdrWeek];
  if (_hdrDur > 0) _metaParts.push('~' + _hdrDur + '\u00a0min');
  if (_hdrProgPct > 0) _metaParts.push('+' + _hdrProgPct + '%');
  _hdrWrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65)'}, _metaParts.join('\u00a0·\u00a0')));
  p.appendChild(_hdrWrap);

  // Chrono séance — mis à jour toutes les 30s sans re-render complet
  if (window._chronoInterval) { clearInterval(window._chronoInterval); window._chronoInterval = null; }
  if (S._sessionStartTime) {
    var _elapsed = Math.floor((Date.now() - S._sessionStartTime) / 60000);
    var _chronoEl = document.createElement('div');
    _chronoEl.id = 'session-chrono';
    _chronoEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:center;margin-bottom:8px;';
    _chronoEl.textContent = (window.isEnglish && window.isEnglish() ? 'Session in progress \u2014 ' : 'S\u00e9ance en cours \u2014 ') + _elapsed + ' min';
    window._chronoInterval = setInterval(function() {
      var el = document.getElementById('session-chrono');
      if (!el || !S._sessionStartTime) { clearInterval(window._chronoInterval); window._chronoInterval = null; return; }
      var _mins = Math.floor((Date.now() - S._sessionStartTime) / 60000);
      el.textContent = (window.isEnglish && window.isEnglish() ? 'Session in progress \u2014 ' : 'S\u00e9ance en cours \u2014 ') + _mins + ' min';
    }, 30000);
    p.appendChild(_chronoEl);
    // FIX UX — Bouton Pause séance (visible quand session active)
    p.appendChild(h('button', {
      style: 'display:block;width:100%;background:transparent;border:none;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);padding:4px 0;text-align:center;',
      onclick: function() {
        S._sessionPaused = true;
        if (window.saveProfile) { try { window.saveProfile(); } catch(_pe) {} }
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? '⏸ Session saved — come back when ready' : '⏸ Séance sauvegardée — reviens quand tu veux', 'info', 3000);
        if (window.render) window.render();
      }
    }, (window.isEnglish && window.isEnglish()) ? '⏸ Pause' : '⏸ Pause'));
  }
  // FIX UX — Bannière reprise séance en pause
  if (S._sessionPaused) {
    var _resumeBar = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid var(--border,#D8D8D0);background:rgba(26,60,94,0.04);margin-bottom:12px;'});
    _resumeBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'}, (window.isEnglish && window.isEnglish()) ? '⏸ Session paused' : '⏸ Séance en pause'));
    _resumeBar.appendChild(h('button', {
      style: 'padding:8px 16px;background:var(--black,#0A0A09);color:#fff;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;min-height:44px;',
      onclick: function() { S._sessionPaused = false; if (window.render) window.render(); }
    }, (window.isEnglish && window.isEnglish()) ? '▶ Resume' : '▶ Reprendre'));
    p.appendChild(_resumeBar);
  }

  // ── Indicateur séance libre en cours ──
  if (S.customSessionDraft && S.customSessionDraft.view === 'active' && S.customSessionDraft.startTime) {
    var _csElapsed = Math.floor((Date.now() - S.customSessionDraft.startTime) / 60000);
    var _csIsEN = window.isEnglish && window.isEnglish();
    var _csIndEl = document.createElement('div');
    _csIndEl.id = 'cs-active-indicator';
    _csIndEl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--green,#3E5C3A);text-align:center;margin-bottom:8px;cursor:pointer;';
    _csIndEl.textContent = (_csIsEN ? 'Free workout in progress \u2014 ' : 'S\u00e9ance libre en cours \u2014 ') + _csElapsed + ' min';
    _csIndEl.onclick = function() { S.sStep = 30; if (window.render) window.render(); };
    p.appendChild(_csIndEl);
  }

  // Progress bar séance (sets validés / sets totaux)
  (function() {
    var _day = (S.sportProgram || [])[S.selectedSportDay];
    if (!_day || !Array.isArray(_day.exercises)) return;
    var _totalSets = 0, _doneSets = 0;
    var _today3 = new Date().toISOString().slice(0,10);
    var _todayLog = (S.muscuSessionLog || {})[_today3] || {};
    _day.exercises.forEach(function(ex) {
      var _exName = ex.n || ex.name || '';
      var _exSets = parseInt(ex.sets) || 3;
      _totalSets += _exSets;
      var _logged = _todayLog[_exName] || [];
      _doneSets += _logged.filter(function(s) { return s && s.validated; }).length;
    });
    if (_totalSets === 0) return;
    var _pct = Math.min(100, Math.round(_doneSets / _totalSets * 100));
    var _progressWrap = document.createElement('div');
    _progressWrap.style.cssText = 'max-width:560px;margin:0 auto 12px;';
    var _progressBar = document.createElement('div');
    _progressBar.style.cssText = 'height:2px;background:var(--line,#D8D8D0);border-radius:1px;overflow:hidden;';
    var _progressFill = document.createElement('div');
    _progressFill.style.cssText = 'height:100%;width:' + _pct + '%;background:var(--black,#0A0A09);transition:width 0.4s ease;';
    _progressBar.appendChild(_progressFill);
    var _progressLabel = document.createElement('div');
    _progressLabel.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:right;margin-top:4px;';
    _progressLabel.textContent = _doneSets + ' / ' + _totalSets + ' sets · ' + _pct + '%';
    _progressWrap.appendChild(_progressBar);
    _progressWrap.appendChild(_progressLabel);
    p.appendChild(_progressWrap);
  })();

 })();

 // FIX UX — Raccourci Séance libre visible sans scroller jusqu'en bas
 (function() {
   var _flIsEN = window.isEnglish && window.isEnglish();
   var _flWrap = h('div', {style: 'text-align:right;margin-bottom:4px;'});
   _flWrap.appendChild(h('button', {
     style: 'background:transparent;border:none;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);text-decoration:underline;padding:4px 0;min-height:44px;',
     onclick: function() {
       if (window.CUSTOM_SESSION && typeof window.CUSTOM_SESSION.open === 'function') {
         window.CUSTOM_SESSION.open();
       } else {
         S.sStep = 30;
         if (window.render) window.render();
       }
     }
   }, _flIsEN ? '+ Free session' : '+ Séance libre'));
   p.appendChild(_flWrap);
 })();

 // ─── PRÉ-BRIEF SÉANCE ───
 (function() {
   var _bToday = new Date().toISOString().slice(0, 10);
   var _bKey = 'brief_' + S.selectedSportDay + '_' + _bToday;
   var _bCtaDone = S.sessionHistory && S.sessionHistory[S.selectedSportDay + '_' + _bToday];
   var _bStarted = !!S._sessionStartTime;
   if (_bCtaDone || _bStarted || S._briefDismissedKey === _bKey) return;

   var _isEn = window.isEnglish && window.isEnglish();
   var _bAllEx = (day.exercises || []).concat((S.bonusExercises || {})[S.selectedSportDay] || []);
   var _bSessionNum = Object.keys(S.sessionHistory || {}).length + 1;

   var _bTargetText = '';
   var _bTargetDelta = '';
   try {
     var _mph = S.muscuProgressionHistory || {};
     var _compounds = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];
     _compounds.forEach(function(c) {
       if (_bTargetText) return;
       var _hist = _mph[c];
       if (!Array.isArray(_hist) || _hist.length < 1) return;
       var _lastW = _hist[_hist.length - 1].weight || 0;
       if (_lastW > 0) { _bTargetText = c + ' — ' + (_lastW + 2.5) + ' kg'; _bTargetDelta = '+2,5 kg'; }
     });
   } catch(_e) {}
   if (!_bTargetText) {
     var _bDur = typeof calcSessionDuration === 'function' ? calcSessionDuration(_bAllEx) : 0;
     _bTargetText = _bAllEx.length + ' ' + (_isEn ? 'exercises' : 'exercices') + (_bDur > 0 ? ' · ~' + _bDur + ' min' : '');
   }

   var _brief = document.createElement('div');
   _brief.style.cssText = 'border:1px solid var(--border,#D8D8D0);padding:20px;margin-bottom:14px;';

   var _bLine1 = document.createElement('div');
   _bLine1.style.cssText = 'font-family:Georgia,serif;font-size:20px;color:var(--black,#0A0A09);margin-bottom:6px;line-height:1.25;';
   _bLine1.textContent = (_isEn ? 'Session ' : 'Séance ') + _bSessionNum + '  ·  ' + (day.focus || (_isEn ? 'Training' : 'Entraînement'));
   _brief.appendChild(_bLine1);

   var _bLine2 = document.createElement('div');
   _bLine2.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:' + (_bTargetDelta ? 'var(--orange-ink,#7A3B0E)' : 'var(--grey,#6B6B65)') + ';margin-bottom:18px;';
   _bLine2.textContent = _bTargetText + (_bTargetDelta ? '  ·  ' + _bTargetDelta : '');
   _brief.appendChild(_bLine2);

   var _bBtn = document.createElement('button');
   _bBtn.style.cssText = 'width:100%;padding:14px;background:var(--black,#0A0A09);color:#FAFAF7;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:none;cursor:pointer;min-height:44px;';
   _bBtn.textContent = _isEn ? '▶ I CONTINUE' : '▶ JE CONTINUE';
   _bBtn.onclick = function() { S._briefDismissedKey = _bKey; S._sessionStartTime = S._sessionStartTime || Date.now(); if (window.render) window.render(); };
   _brief.appendChild(_bBtn);
   p.appendChild(_brief);
 })();

 // ─── BADGE SÉANCE VALIDÉE ───
 var _ctaToday = new Date().toISOString().slice(0, 10);
 var _ctaTodayKey = S.selectedSportDay + '_' + _ctaToday;
 var _ctaDone = S.sessionHistory && S.sessionHistory[_ctaTodayKey];
 if (_ctaDone) {
   var _ctaDoneBadge = h('div', {style: 'border:1px solid var(--line,#D8D8D0);background:rgba(62,92,58,0.06);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);display:flex;align-items:center;gap:8px;'});
   _ctaDoneBadge.appendChild(h('span', {}, '\u2714'));
   _ctaDoneBadge.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? 'Session validated\u00a0— ' : 'Séance validée\u00a0— ') + _ctaDone.duration + '\u00a0min\u00a0·\u00a0' + _ctaDone.kcalTotal + '\u00a0kcal'));
   p.appendChild(_ctaDoneBadge);
 }
 // Avertissement récupération 48h (check48hConflict + getBlockedMuscleGroups)
 if (!_ctaDone && typeof window.check48hConflict === 'function') {
   var _proposed48h = [];
   (day.exercises || []).forEach(function(ex) {
     if (ex.m && _proposed48h.indexOf(ex.m) === -1) _proposed48h.push(ex.m);
   });
   var _conflict48h = window.check48hConflict(_proposed48h);
   var _blockedGrps = (window.SFCDecisionCore && typeof window.SFCDecisionCore.getBlockedMuscleGroups === 'function')
     ? window.SFCDecisionCore.getBlockedMuscleGroups() : [];
   if (!_conflict48h.safe || _blockedGrps.length > 0) {
     var _recWarnEl = h('div', {style: 'border-left:3px solid var(--orange-ink,#7A3B0E);background:rgba(122,59,14,0.06);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'});
     var _recWarnText = _conflict48h.reason ||
       ((window.isEnglish && window.isEnglish() ? 'Muscle groups in recovery: ' : 'Groupes musculaires en récup. : ') + _blockedGrps.join(', '));
     _recWarnEl.textContent = '⚠ ' + _recWarnText;
     p.appendChild(_recWarnEl);
   }
 }

 // ─── AVERTISSEMENT RÉCUPÉRATION 48h ───────────────────────────────────────────────
 // check48hConflict lit S.lastSessionGroups+S.lastSessionDate (sfc-symbiosis.js).
 // getBlockedMuscleGroups confirme via SFCDecisionCore (multi-signal).
 if (!_ctaDone && typeof window.check48hConflict === 'function') {
   var _proposed48h = [];
   (day.exercises || []).forEach(function(ex) {
     if (ex.m && _proposed48h.indexOf(ex.m) === -1) _proposed48h.push(ex.m);
   });
   var _conflict48h = window.check48hConflict(_proposed48h);
   var _blockedGrps = (window.SFCDecisionCore && typeof window.SFCDecisionCore.getBlockedMuscleGroups === 'function')
     ? window.SFCDecisionCore.getBlockedMuscleGroups() : [];
   if (!_conflict48h.safe || _blockedGrps.length > 0) {
     var _recWarnEl = h('div', {style: 'border-left:3px solid var(--orange-ink,#7A3B0E);background:rgba(122,59,14,0.06);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'});
     var _recWarnText = _conflict48h.reason ||
       ((window.isEnglish && window.isEnglish() ? 'Muscle groups in recovery: ' : 'Groupes musculaires en récup. : ') + _blockedGrps.join(', '));
     _recWarnEl.textContent = '⚠ ' + _recWarnText;
     p.appendChild(_recWarnEl);
   }
 }

 var _totalExercises = (day.exercises || []).length;

 // ─── SWIPE NAVIGATION STATE ───
 if (S._exSwipeDayIdx !== S.selectedSportDay) { S.currentExerciseIdx = 0; S._exSwipeDayIdx = S.selectedSportDay; }
 if (typeof S.currentExerciseIdx !== 'number' || S.currentExerciseIdx < 0 || S.currentExerciseIdx >= _totalExercises) { S.currentExerciseIdx = 0; }

 // ─── NAVIGATION DOTS ───
 if (_totalExercises > 1) {
  var _dotsNav = h('div', {style: 'display:flex;justify-content:center;align-items:center;gap:6px;margin:4px 0 14px'});
  for (var _di = 0; _di < _totalExercises; _di++) {
   var _isActiveDot = _di === S.currentExerciseIdx;
   _dotsNav.appendChild(h('div', {
    style: 'height:4px;border-radius:2px;cursor:pointer;transition:all .25s cubic-bezier(0.4,0,0.2,1);' + (_isActiveDot ? 'width:20px;background:var(--black,#0A0A09)' : 'width:4px;background:var(--border,#D8D8D0)'),
    onclick: (function(_i){ return function(){ S.currentExerciseIdx = _i; window.render(); }; })(_di)
   }));
  }
  p.appendChild(_dotsNav);
 }

 // ─── SWIPE CONTAINER ───
 var _swipeWrap = h('div', {'class': 'exercise-swipe-wrap', style: 'position:relative;touch-action:pan-y'});

 ;(function() {
  var exIdx = S.currentExerciseIdx;
  var ex = day.exercises[exIdx];
  if (!ex) return;
  var card = h('div', {'class': 'exercise-card', onclick: function(){ S.sportModalExercise = ex; window.render(); }});

 // ── PROGRESS INDICATOR: "Exercice X/N" ──
 var _exProgressRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:2px'});
 _exProgressRow.appendChild(h('div', {'class': 'exercise-muscle'}, ex.m));
 _exProgressRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--black,#0A0A09);font-weight:600;white-space:nowrap;padding:3px 8px;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);border-radius:2px'}, 'Ex. ' + (exIdx + 1) + '\u00a0/\u00a0' + _totalExercises));
 card.appendChild(_exProgressRow);

 var _exNameEl = h('div', {'class': 'exercise-name'}, ex.n || (window.isEnglish && window.isEnglish() ? 'Exercise' : 'Exercice'));
 // FST-7 badge: highlight exercises that use the Fascial Stretch Training 7-set technique
 if (ex.is_fst7) {
 var fst7Badge = h('span', {
 style: 'display:inline-block;margin-left:8px;padding:2px 6px;background:var(--error,#7A1F1F);color:#fff;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;border-radius:2px;vertical-align:middle'
 }, 'FST-7');
 _exNameEl.appendChild(fst7Badge);
 card.style.borderLeft = '3px solid var(--error,#7A1F1F)';
 }
 // ─── DELTA PROGRESSION ───
 var _progHistory = S.muscuProgressionHistory && S.muscuProgressionHistory[ex.n];
 if (_progHistory && _progHistory.length >= 2) {
   var _last = _progHistory[_progHistory.length - 1];
   var _prev = _progHistory[_progHistory.length - 2];
   var _lastW = parseFloat(_last && _last.weight) || 0;
   var _prevW = parseFloat(_prev && _prev.weight) || 0;
   var _deltaW = (_lastW > 0 && _prevW > 0) ? Math.round((_lastW - _prevW) * 2) / 2 : 0;
   if (_deltaW !== 0 && !isNaN(_deltaW)) {
     var _deltaEl = h('span', {
       style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:600;margin-left:6px;' + (_deltaW > 0 ? 'color:var(--success,#3E5C3A);' : 'color:var(--error,#7A1F1F);')
     }, (_deltaW > 0 ? '↑' : '↓') + ' ' + Math.abs(_deltaW) + ' kg');
     _exNameEl.appendChild(_deltaEl);
   }
 }
 card.appendChild(_exNameEl);
 card.appendChild(h('div', {'class': 'exercise-sets'}, (ex.sets || '4x10') + ' \u2014 ' + (window.isEnglish && window.isEnglish() ? 'Rest ' : 'Repos ') + (ex.rest || '90s')));
 if (ex.eq) card.appendChild(h('div', {'class': 'exercise-detail'}, ex.eq));

 // ─── PLATEAU DETECTOR ───
 (function(_ph) {
   if (!_ph || _ph.length < 3) return;
   var _last3 = _ph.slice(-3);
   var _allWeights = _last3.map(function(e) { return e.weight || 0; });
   var _maxW = Math.max.apply(null, _allWeights);
   if (_maxW <= 0) return;
   var _isPlat = _allWeights.every(function(w) { return Math.abs(w - _maxW) < 1; });
   var _allReps = _last3.map(function(e) { return e.reps || 0; });
   var _repsPlat = _allReps.every(function(r) { return r === _allReps[0] && r > 0; });
   if (!_isPlat) return;
   var _platSuggestions = [
     { icon: '▪', label: 'Tempo 3-1-3', desc: (window.isEnglish && window.isEnglish() ? 'Slow down: 3s descent, 1s pause, 3s up' : 'Ralentis : 3s descente, 1s pause bas, 3s montée') },
     { icon: '▸', label: (window.isEnglish && window.isEnglish() ? 'Varied grip' : 'Prise variée'), desc: (window.isEnglish && window.isEnglish() ? 'Change grip width or type (pronation / supination)' : 'Change la largeur ou le type de prise (pronation / supination)') },
     { icon: '↓', label: (window.isEnglish && window.isEnglish() ? 'Slow eccentric' : 'Excentrique lent'), desc: (window.isEnglish && window.isEnglish() ? '4-5 seconds on the descent phase, same weight' : '4-5 secondes sur la phase de descente, même charge') },
     { icon: '◂', label: 'Dropset', desc: (window.isEnglish && window.isEnglish() ? 'Last set: -20% weight, continue to failure' : 'Dernière série : -20 % de charge, continue jusqu\'à l\'échec') },
     { icon: '‖', label: 'Pause reps', desc: (window.isEnglish && window.isEnglish() ? '2s pause at the bottom before going back up' : '2s de pause en position basse avant de remonter') }
   ];
   var _tipIdx = (new Date().getDate() + ex.n.length) % _platSuggestions.length;
   var _tip = _platSuggestions[_tipIdx];
   var platCard = h('div', { style: 'margin-top:8px;padding:10px 12px;background:#FFF8E7;border-left:3px solid #C8A84B;border-radius:0' });
   var platHeader = h('div', { style: 'display:flex;align-items:center;gap:6px;margin-bottom:4px;' });
   platHeader.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange-ink,#7A3B0E);font-weight:700;' }, (window.isEnglish && window.isEnglish() ? 'Plateau detected' : 'Plateau d\u00e9tect\u00e9')));
   platHeader.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--orange-ink,#7A3B0E);' }, '\u2014 ' + _allWeights[0] + ' kg \u00d7 3 ' + (window.isEnglish && window.isEnglish() ? 'sessions' : 's\u00e9ances')));
   platCard.appendChild(platHeader);
   var platTip = h('div', { style: 'display:flex;align-items:flex-start;gap:8px;' });
   platTip.appendChild(h('span', { style: 'font-size:11px;line-height:1.4;flex-shrink:0;color:var(--orange-ink,#7A3B0E);' }, _tip.icon));
   var platText = h('div', {});
   platText.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:600;color:#0A0A09;' }, _tip.label));
   platText.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#6B6B65;line-height:1.45;margin-top:1px;' }, _tip.desc));
   platTip.appendChild(platText);
   platCard.appendChild(platTip);
   card.appendChild(platCard);
 })(_progHistory);

 // ─── EXERCISE DESCRIPTION FOR BEGINNERS ───
 // 2026-04 : refonte UX débutants — description claire + tips visibles avant la vidéo
 if ((S.sportLevel === 'beginner' || !S.sportLevel) && ex.desc) {
  // Bandeau "Comment faire" mis en avant (pas en gris-italique perdu)
  var howTo = h('div', { style: 'margin-top:10px;padding:10px 12px;background:var(--ivory,#FAF9F6);border-left:2px solid var(--black,#0A0A09);' });
  howTo.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:4px;' }, (window.isEnglish && window.isEnglish() ? 'How to do it' : 'Comment faire')));
  howTo.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black,#0A0A09);line-height:1.55;' }, ex.desc));
  // Top 2 tips si dispo (les plus importants)
  if (ex.tips && ex.tips.length) {
    var tipsList = h('ul', { style: 'margin:6px 0 0;padding:0 0 0 16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5;' });
    ex.tips.slice(0, 2).forEach(function(t) {
      tipsList.appendChild(h('li', { style: 'margin-bottom:2px;' }, t));
    });
    howTo.appendChild(tipsList);
  }
  card.appendChild(howTo);
 }

 // ─── BOUTON TIMER DE REPOS ───
 (function(_ex) {
 var _exLow = (_ex.n || '').toLowerCase();
 var _restSec;
 if (/squat|deadlift|soulevé.*terre|soulev[eé]|bench press|développé.*couché|dével.*couch/.test(_exLow)) {
  _restSec = 180; // composés lourds
 } else if (/row|rowing|overhead press|développé|dével|pull|chin|dips|fente|hip thrust|rdl/.test(_exLow)) {
  _restSec = 120; // composés légers
 } else {
  _restSec = 60;  // isolation
 }
 // Utiliser le temps de repos de l'exercice si défini
 if (_ex.rest) {
  var _parsed = parseRestTime(_ex.rest);
  if (_parsed > 0) _restSec = _parsed;
 }
 var _restMin = Math.floor(_restSec / 60);
 var _restRemS = _restSec % 60;
 var _restLabel = _restMin > 0 ? (_restMin + '\'' + (_restRemS > 0 ? _restRemS + '"' : '')) : (_restSec + '"');
 var restBtn = h('button', {
  style: 'margin-top:6px;padding:4px 10px;border:1px solid var(--border);background:transparent;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;color:var(--grey);border-radius:2px;transition:border-color .15s',
  onclick: function(e) {
  e.stopPropagation();
  if (window.startRestTimer) window.startRestTimer(_restSec);
  }
 }, '\u23F1 ' + (window.isEnglish && window.isEnglish() ? 'Rest ' : 'Repos ') + _restLabel);
 card.appendChild(restBtn);
 })(ex);

 // Cycle intensity badge
 if (window.isFemale(S) && S.cycleTracking && cycleInfo) {
 var intPct = Math.round(cycleInfo.phase.intensityFactor * 100);
 var intColor = intPct >= 100 ? 'var(--success,#3E5C3A)' : intPct >= 80 ? 'var(--orange-ink,#7A3B0E)' : 'var(--error,#7A1F1F)';
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:' + intColor + ';margin-top:4px'}, (window.isEnglish && window.isEnglish() ? 'Cycle intensity: ' : 'Intensit\u00e9 cycle : ') + intPct + '%'));
 }

 // GIF demo image — show if available from exercise-gifs-map.js
 var _gifUrl = (window.EXERCISE_GIFS && ex.n && window.EXERCISE_GIFS[ex.n]) ? window.EXERCISE_GIFS[ex.n] : null;
 if (_gifUrl) {
   card.appendChild(h('img', {
     src: _gifUrl, alt: ex.n,
     loading: 'lazy',
     style: 'width:100%;max-width:100%;height:auto;border-radius:2px;margin:12px 0 8px;display:block;border:1px solid var(--border,#D8D8D0)',
     onerror: function(e) { e.currentTarget.style.display = 'none'; }
   }));
 }

 // Video link — auto-generate URL if not preset in exercise data
 // 2026-04 : utilise EXERCISE_VIDEOS si dispo (URL ciblée chaîne FR débutants)
 // + modal "préparation" pour ne pas perdre l'utilisateur sur YouTube
 var _exoLv = (typeof ex.lv === 'number') ? ex.lv : 1;
 var _videoUrl = (window.EXERCISE_VIDEOS && window.EXERCISE_VIDEOS.buildSmartVideoUrl)
   ? window.EXERCISE_VIDEOS.buildSmartVideoUrl(ex.n, _exoLv)
   : (ex.video || (window.getExerciseVideoUrl ? window.getExerciseVideoUrl(ex.n) : null));
 if (_videoUrl) {
 // 2026-04 UX-1 : lien direct (plus de modal intermédiaire qui imposait
 // un double-clic frustrant selon feedback Sarah). La query est filtrée
 // par chaîne adaptée au niveau (Tibo InShape/AthleanX/Squat U) donc la
 // 1re vidéo affichée est la bonne.
 var vlink = h('a', {'class': 'exercise-video', href: _videoUrl, target: '_blank', rel: 'noopener', onclick: function(e){
 e.stopPropagation();
 window.BLACKBOX && window.BLACKBOX.log('video_clicked', {exercise: ex.n});
 var count = window.GAMIFICATION ? GAMIFICATION.incrementCounter('exercises_viewed') : 0;
 if (count >= 20 && window.GAMIFICATION) GAMIFICATION.unlockBadge('exercises_20');
 }}, '\u25b6 ' + (window.isEnglish && window.isEnglish() ? 'View technique' : 'Voir la technique'));
 card.appendChild(vlink);
 }

 // ─── Weight/Load tracking ───
 // FIX 2026-04-16 : détection bodyweight avant barre. "Barre de traction" / "barre fixe"
 // = pull-up bar = poids du corps (pas une barre d'haltéro !). Sans ce check, les tractions
 // affichaient un champ "BARRE kg" au lieu du mode poids du corps avec lest optionnel.
 // Détection par NOM aussi : tractions/chin-up/pull-up/dips/pompes = toujours bodyweight.
 var eqType = 'barre';
 var eqLower = (ex.eq || '').toLowerCase();
 var exNameLower = (ex.n || '').toLowerCase();
 // 1. Bodyweight par EQUIPMENT explicite
 if (/poids du corps|poids de corps|corps seul|bodyweight|body\s?weight|aucun|^none$|^sol$|^\s*$/.test(eqLower)) eqType = 'bodyweight';
 // 2. Bodyweight par EQUIPMENT "barre de traction" / "barre fixe" / "barres parallèles"
 else if (/barre\s+(?:de\s+)?traction|barre\s+fixe|barres?\s+parall[eè]les?|anneaux|rings|trx/i.test(eqLower)) eqType = 'bodyweight';
 // 3. Bodyweight par NOM d'exercice (tractions, dips, pompes, pull-ups, chin-ups, muscle-up)
 else if (/^tractions?|^chin.?ups?|^pull.?ups?|^dips?\b|^pompes?\b|^muscle.?ups?|^burpees?|^planche|^gainage/i.test(exNameLower)) eqType = 'bodyweight';
 // 4. Types matériel classiques
 else if (/halt[eè]re|dumbbell|db/i.test(eqLower)) eqType = 'haltere';
 else if (/machine|poulie|cable|c[aâ]ble|presse/i.test(eqLower)) eqType = 'machine';
 else if (/kettle|kb/i.test(eqLower)) eqType = 'kb';
 else if (/barre|barbell/i.test(eqLower)) eqType = 'barre';

 // ─── AI-suggested weight from strength profile (skip for bodyweight) ───
 if (eqType !== 'bodyweight') {
 var _setParts = ex.sets ? String(ex.sets).split('\u00d7') : [];
 var suggestedReps = _setParts.length > 1 ? parseInt(_setParts[1]) : null;
 // 2026-04 FIX A6 v2 : la 'Charge recommandée' DOIT être cohérente avec le tableau des séries.
 // Avant : 3 fonctions différentes (getMusculationWeight + getSuggestedWeight + getSetScheme)
 // donnaient 3 valeurs distinctes → user voyait "Recommandée 77.5 kg" mais "Conseillé 45 kg" en série.
 // Après : on lit le top set du sessionLog (généré par getSetScheme avec le vrai 1RM),
 // sinon fallback sur getSuggestedWeight (algo phase × pct1rm), sinon getMusculationWeight (legacy).
 var suggested = null;
 try {
   var _todayK = new Date().toISOString().slice(0, 10);
   var _todayLog = S.muscuSessionLog && S.muscuSessionLog[_todayK];
   var _exLog = _todayLog && _todayLog[ex.n];
   if (Array.isArray(_exLog) && _exLog.length) {
     // Top set = série la plus lourde (généralement la dernière en pyramide)
     var _max = 0;
     _exLog.forEach(function(s) { if (s && s.targetWeight > _max) _max = s.targetWeight; });
     if (_max > 0) suggested = _max;
   }
 } catch(e) {}
 // Fallback 1 : phase × pct1rm (cohérent avec "Charge cible" sur la carte exo)
 // getMuscuPhase + getSuggestedWeight sont dans la même IIFE → accès direct (pas window.)
 if (!suggested) {
   try {
     var _phase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(sfcGetEffectiveWeek()) : null;
     if (typeof getSuggestedWeight === 'function') {
       suggested = getSuggestedWeight(ex.n, suggestedReps || 8, _phase);
     }
   } catch(e) {}
 }
 // Fallback 2 : legacy
 if (!suggested) {
   suggested = window.getMusculationWeight ? window.getMusculationWeight(ex.n, ex.sets, suggestedReps) : null;
 }
 // ═══ FIX P1 2026-04-16 — Progression auto basée sur PERFORMANCE RÉELLE ═══
 // Avant : progression linéaire aveugle (charge × 1.05 × semaine). Augmentait même
 // si l'user avait échoué ses reps. Maintenant : on regarde le sessionLog de la
 // dernière session. Si TOUTES les séries ont été validées → +2.5kg (upper) ou +5kg (lower).
 // Sinon → même charge (consolider avant de progresser). NSCA 2016, Rippetoe 2011.
 var _savedW = S.musculationWeights[ex.n];
 var _baseW = (_savedW && _savedW.weight) ? _savedW.weight : suggested;
 if (_baseW && _baseW > 0) {
  // Chercher la dernière session qui contient cet exercice
  var _lastSessionSets = null;
  if (S.muscuSessionLog) {
    var _logDates = Object.keys(S.muscuSessionLog).sort().reverse();
    for (var _ld = 0; _ld < Math.min(_logDates.length, 14); _ld++) {
      var _dayLog = S.muscuSessionLog[_logDates[_ld]];
      if (_dayLog && _dayLog[ex.n] && Array.isArray(_dayLog[ex.n])) {
        _lastSessionSets = _dayLog[ex.n]; break;
      }
    }
  }
  // Déterminer si progression autorisée
  var _allSetsCompleted = false;
  if (_lastSessionSets && _lastSessionSets.length > 0) {
    _allSetsCompleted = _lastSessionSets.every(function(s) { return s.validated === true; });
  }
  // Incrément : +2.5kg upper body, +5kg lower body (Rippetoe standard)
  var _isLowerEx = /squat|presse|leg|fente|lunge|deadlift|soulev|hip thrust|glute|mollet|calf|ischios|hamstring/i.test(ex.n || '');
  var _increment = _isLowerEx ? 5 : 2.5;
  var _progressiveW = _allSetsCompleted ? Math.round((_baseW + _increment) * 2) / 2 : _baseW;
  if (_progressiveW > _baseW) {
   var _sugBanner = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 12px;background:rgba(62,92,58,0.06);border:1px solid rgba(26,74,26,0.25);border-radius:2px'});
   var _sugLeft = h('div', {});
   _sugLeft.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--green,#3E5C3A);margin-bottom:2px'}, (window.isEnglish && window.isEnglish() ? 'Progress +' + _increment + 'kg (all sets completed)' : 'Progression +' + _increment + 'kg (toutes séries réussies)')));
   _sugLeft.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:bold;color:var(--green,#3E5C3A);line-height:1'}, ((window.UNITS ? window.UNITS.displayWeight(_progressiveW) : _progressiveW + '\u00a0kg') + (eqType === 'haltere' ? (window.isEnglish && window.isEnglish() ? '\u00a0/dumbbell' : '\u00a0/haltère') : eqType === 'kb' ? '\u00a0/kb' : ''))));
   _sugBanner.appendChild(_sugLeft);
   card.appendChild(_sugBanner);
  } else if (suggested && suggested > 0) {
   var _sugBanner2 = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 12px;background:rgba(62,92,58,0.06);border:1px solid rgba(26,74,26,0.25);border-radius:2px'});
   var _sugLeft2 = h('div', {});
   _sugLeft2.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--green,#3E5C3A);margin-bottom:2px'}, (window.isEnglish && window.isEnglish() ? 'Recommended load' : 'Charge recommand\u00e9e')));
   _sugLeft2.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:bold;color:var(--green,#3E5C3A);line-height:1'}, window.UNITS ? window.UNITS.displayWeight(suggested) : suggested + '\u00a0kg'));
   _sugBanner2.appendChild(_sugLeft2);
   card.appendChild(_sugBanner2);
  }
 } else if (suggested && suggested > 0) {
  var _sugBannerBasic = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 12px;background:rgba(62,92,58,0.06);border:1px solid rgba(26,74,26,0.25);border-radius:2px'});
  var _sugLeftBasic = h('div', {});
  _sugLeftBasic.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--green,#3E5C3A);margin-bottom:2px'}, (window.isEnglish && window.isEnglish() ? 'Recommended load' : 'Charge recommand\u00e9e')));
  _sugLeftBasic.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:bold;color:var(--green,#3E5C3A);line-height:1'}, window.UNITS ? window.UNITS.displayWeight(suggested) : suggested + '\u00a0kg'));
  _sugBannerBasic.appendChild(_sugLeftBasic);
  card.appendChild(_sugBannerBasic);
 }
 }

 var savedWeight = S.musculationWeights[ex.n] || {};
 var currentWeight = savedWeight.weight || '';

 if (eqType !== 'bodyweight') {
 var weightRow = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--ivory3,#EEEDE8)'});
 var typeLabel = eqType === 'barre' ? (window.isEnglish && window.isEnglish() ? 'Barbell' : 'Barre') : eqType === 'haltere' ? (window.isEnglish && window.isEnglish() ? 'Dumbbell (\u00d71)' : 'Halt\u00e8re (\u00d71)') : eqType === 'machine' ? 'Machine' : 'KB';
 weightRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);min-width:80px'}, typeLabel));

 var wInput = h('input', {
 type: 'number', step: '0.5', min: '0', max: '500', inputmode: 'decimal',
 value: currentWeight ? String(currentWeight) : '',
 placeholder: 'kg',
 style: 'width:70px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory)',
 onclick: function(e) { e.stopPropagation(); },
 onchange: (function(exName, eqT) { return function(e) {
 e.stopPropagation();
 var v = parseFloat(e.target.value);
 if (!isNaN(v) && v >= 0) {
 S.musculationWeights[exName] = { weight: v, type: eqT };
 var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 try { localStorage.setItem('mtd_muscu_weights_' + uid, JSON.stringify(S.musculationWeights)); } catch(e) { console.warn('[muscu_weights] localStorage error:', e); }
 if (window.BLACKBOX) BLACKBOX.log('muscu_weight_set', {exercise: exName, weight: v, type: eqT});
 if (window.PERF_HISTORY) PERF_HISTORY.recordMuscuWeight(exName, v, eqT);
 window.render();
 }
 }; })(ex.n, eqType)
 });
 var _wcMinus = h('button', {
 style: 'min-width:44px;min-height:44px;padding:0;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;color:var(--black,#0A0A09)',
 onclick: (function(exN, eqT, inp) { return function(e) {
   e.stopPropagation();
   var cur = parseFloat(inp.value) || 0;
   var nv = Math.max(0, Math.round((cur - 2.5) * 2) / 2);
   inp.value = String(nv);
   S.musculationWeights[exN] = { weight: nv, type: eqT };
   var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
   try { localStorage.setItem('mtd_muscu_weights_' + uid, JSON.stringify(S.musculationWeights)); } catch(e2) {}
   if (window.PERF_HISTORY) PERF_HISTORY.recordMuscuWeight(exN, nv, eqT);
   window.render();
 }; })(ex.n, eqType, wInput)
}, '\u2212');
 weightRow.appendChild(_wcMinus);
 weightRow.appendChild(wInput);
 var _wcPlus = h('button', {
 style: 'min-width:44px;min-height:44px;padding:0;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;color:var(--black,#0A0A09)',
 onclick: (function(exN, eqT, inp) { return function(e) {
   e.stopPropagation();
   var cur = parseFloat(inp.value) || 0;
   var nv = Math.round((cur + 2.5) * 2) / 2;
   inp.value = String(nv);
   S.musculationWeights[exN] = { weight: nv, type: eqT };
   var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
   try { localStorage.setItem('mtd_muscu_weights_' + uid, JSON.stringify(S.musculationWeights)); } catch(e2) {}
   if (window.PERF_HISTORY) PERF_HISTORY.recordMuscuWeight(exN, nv, eqT);
   window.render();
 }; })(ex.n, eqType, wInput)
}, '+');
 weightRow.appendChild(_wcPlus);
 weightRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, window.UNITS ? window.UNITS.weightLabel() : 'kg'));

 if (currentWeight) {
 var _dispW = window.UNITS ? window.UNITS.displayWeightVal(currentWeight) : currentWeight;
 var _unit = window.UNITS ? window.UNITS.weightLabel() : 'kg';
 var display = eqType === 'haltere' ? '2\u00d7' + _dispW + _unit : _dispW + _unit;
 weightRow.appendChild(h('span', {style: 'font-family:Georgia;font-size:13px;font-style:italic;margin-left:auto;color:var(--black)'}, display));
 }

 card.appendChild(weightRow);

 // ─── CALCULATEUR DE PLAQUES (barre uniquement, si charge définie) ───
 if (eqType === 'barre' && currentWeight && currentWeight > 0) {
 var plateDiv = h('div', {});
 plateDiv.innerHTML = _sfcSanitize(window.renderPlateCalculator(currentWeight, 20) || '');
 card.appendChild(plateDiv);
 }
 } else {
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-top:6px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Bodyweight' : 'Poids de corps')));
 }

 // ─── TRACKER SÉRIES : recommandations + saisie réelle ───
 (function(exRef, isBodyweight, _exIdx, _dayExercises) {
 var setsMatch = String(exRef.sets || '').match(/^(\d+)\s*[x\u00d7]\s*(\d+)(?:-(\d+))?/);
 var numSets = setsMatch ? parseInt(setsMatch[1]) : 3;
 var minReps = setsMatch ? parseInt(setsMatch[2]) : 10;
 var maxReps = setsMatch && setsMatch[3] ? parseInt(setsMatch[3]) : minReps;
 // 2026-04 FIX UX : détecter le type d'équipement pour clarifier le label de poids
 // (halt: poids PAR haltère, kb: idem, machine/poulie: poids résistance machine, barre: total)
 var _eqLow = (exRef.eq || '').toLowerCase();
 var _exNameLow = (exRef.n || '').toLowerCase();
 var _isHaltere = /halt[eè]re|dumbbell|\bdb\b/.test(_eqLow) || /halt[eè]re|dumbbell/.test(_exNameLow);
 var _isKb = /kettlebell|kettle|\bkb\b/.test(_eqLow) || /kettle/.test(_exNameLow);
 var _isMachine = /machine|poulie|cable|c[aâ]ble|smith|guidé|presse/.test(_eqLow);
 // 2026-04 FIX UX : détection unilatéral (squat 1 jambe, presse 1 main, fente bulgare…)
 // Convention : poids saisi = par CÔTÉ (jambe/bras travaillant), pas total
 var _isUnilateral = /unilat[eé]ral|1\s*jambe|une\s*jambe|1\s*main|une\s*main|1\s*bras|single.?leg|single.?arm|bulgare|pistol|shrimp|fente arri[eè]re alternee/.test(_exNameLow);
 var _weightUnit = _isHaltere ? (window.isEnglish && window.isEnglish() ? ' kg /dumbbell' : ' kg /haltère') : (_isKb ? ' kg /kettlebell' : (_isUnilateral ? (window.isEnglish && window.isEnglish() ? ' kg /side' : ' kg /côté') : ' kg'));
 var _weightHint = _isHaltere ? (window.isEnglish && window.isEnglish() ? ' (per dumbbell, take 2 identical)' : ' (par haltère, prendre 2 identiques)') : (_isKb ? (window.isEnglish && window.isEnglish() ? ' (per kettlebell)' : ' (par kettlebell)') : (_isUnilateral ? (window.isEnglish && window.isEnglish() ? ' (per working side)' : ' (par côté travaillant)') : ''));

 var exPhase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(sfcGetEffectiveWeek()) : null;
 var sugWeight = getSuggestedWeight(exRef.n, minReps, exPhase) || 0;
 var progressiveWeight = getProgressiveWeight(exRef.n, sugWeight, sfcGetEffectiveWeek());

 // Per-set scheme from getSetScheme (ascending/descending loads)
 var _setScheme = null;
 if (window.getSetScheme && !isBodyweight) {
 // FIX: MUSCU_PHASES uses .label not .name; also map phase.id for accuracy
 var _phaseName = exPhase ? (exPhase.id || exPhase.label || '').toLowerCase() : 'hypertrophie';
 var _cycleKey = /intensification/.test(_phaseName) ? 'force' : /decharge|deload/.test(_phaseName) ? 'deload' : /adaptation/.test(_phaseName) ? 'volume' : 'hypertrophie';
 // 2026-04 FIX A6 CRITIQUE : reconstituer le 1RM réel depuis sugWeight
 // (sugWeight = oneRM × phase.pct1rm, donc oneRM = sugWeight / phase.pct1rm)
 // Avant ce fix : getSetScheme utilisait TOUJOURS estimateBaseLoad(BW×ratio), ignorant
 // le strength profile de l'user → pyramide calculée sur un mauvais 1RM → charges
 // contradictoires avec getSuggestedWeight.
 var _knownOneRM = null;
 if (exPhase && exPhase.pct1rm && exPhase.pct1rm > 0 && sugWeight > 0) {
   _knownOneRM = Math.round(sugWeight / exPhase.pct1rm);
 }
 _setScheme = window.getSetScheme(exRef.n, S.weight || 70, S.sex || 'homme', S.sportLevel || 'intermediate', _cycleKey, numSets, _knownOneRM);
 }

 var today = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
 if (!exRef.n || typeof exRef.n !== 'string' || !exRef.n.trim()) return;
 if (!S.muscuSessionLog[today]) S.muscuSessionLog[today] = {};
 if (!S.muscuSessionLog[today][exRef.n]) {
 S.muscuSessionLog[today][exRef.n] = [];
 for (var si2 = 0; si2 < numSets; si2++) {
 // Use per-set scheme if available, otherwise flat weight
 var _schSet = (_setScheme && _setScheme[si2]) ? _setScheme[si2] : null;
 S.muscuSessionLog[today][exRef.n].push({
 set: si2 + 1,
 targetWeight: _schSet ? _schSet.loadKg : progressiveWeight,
 targetReps: _schSet ? _schSet.targetReps : (si2 < 2 ? maxReps : minReps),
 pctOf1RM: _schSet ? _schSet.pctOf1RM : null,
 deltaFromPrev: _schSet ? _schSet.deltaFromPrev : null,
 actualWeight: null,
 actualReps: null
 });
 }
 }
 var setData = S.muscuSessionLog[today][exRef.n];

 // Tableau des séries
 var setTable = h('div', {style: 'margin-top:8px;border:1px solid var(--border);border-radius:2px;overflow-x:auto;-webkit-overflow-scrolling:touch'});

 var isAdvancedRIR = (S.sportLevel === 'advanced' || S.sportLevel === 'pro' || S.sportLevel === 'intermediate');

 // RIR target display for advanced users
 // FIX 2026-04-16 — UNIFIÉ : RIR dérivé de MUSCU_PHASES (RPE), plus de MESOCYCLE_WEEKS.
 // Avant : MUSCU_PHASES disait "RPE 9 / Intensification" mais MESOCYCLE_WEEKS disait
 // "RIR 3 / modéré" pour la même semaine → contradiction. RPE 10 - RPE = RIR approximatif.
 if (isAdvancedRIR && exPhase) {
  var _rirTarget = Math.max(0, 10 - (exPhase.rpe || 8));
  var _rirLabel = _rirTarget <= 1 ? (window.isEnglish && window.isEnglish() ? 'near failure' : 'quasi-échec') : _rirTarget === 2 ? (window.isEnglish && window.isEnglish() ? 'high effort' : 'effort intense') : _rirTarget === 3 ? (window.isEnglish && window.isEnglish() ? 'moderate' : 'modéré') : (window.isEnglish && window.isEnglish() ? 'light' : 'léger');
  var _rirTargetDisplay = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--orange-ink,#7A3B0E);margin-bottom:6px;padding:4px 8px;background:rgba(232,111,30,0.06);border-radius:2px'});
  _rirTargetDisplay.appendChild(termTooltip('RIR', (window.isEnglish && window.isEnglish() ? 'Reps In Reserve — number of reps you could still do before failure' : 'Reps In Reserve — nombre de reps que vous pourriez encore faire avant l\'échec musculaire')));
  _rirTargetDisplay.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? ' target this week: ' : ' cible cette semaine : ') + _rirTarget + ' — ' + _rirLabel + ' (' + (exPhase.label || '') + ')'));
  card.appendChild(_rirTargetDisplay);
 }
 // 2026-04 FIX UX : bandeau d'avertissement convention poids (anti-ambiguïté)
 if (_isHaltere || _isKb || _isUnilateral || _isMachine) {
   var _convNotice = h('div', {
     style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#1A3C5E;margin-bottom:6px;padding:6px 10px;background:rgba(26,60,94,0.06);border-left:2px solid #1A3C5E;border-radius:2px;line-height:1.5;'
   });
   if (_isHaltere) {
     _convNotice.textContent = (window.isEnglish && window.isEnglish() ? 'Convention: weight entered = per dumbbell (take 2 identical ones). E.g.: 20 kg = 2 × 20 kg.' : 'Convention : poids saisi = par haltère (prendre 2 haltères identiques). Ex : 20 kg = 2 × 20 kg.');
   } else if (_isKb) {
     _convNotice.textContent = (window.isEnglish && window.isEnglish() ? 'Convention: weight entered = for 1 kettlebell.' : 'Convention : poids saisi = pour 1 kettlebell.');
   } else if (_isUnilateral) {
     _convNotice.textContent = (window.isEnglish && window.isEnglish() ? 'Convention: weight entered = per working side (leg or arm).' : 'Convention : poids saisi = par côté travaillant (jambe ou bras).');
   } else if (_isMachine) {
     _convNotice.textContent = (window.isEnglish && window.isEnglish() ? 'Convention: weight entered = machine stack. Perceived effort ≈ 70% of free-weight equivalent.' : 'Convention : poids saisi = pile de la machine. Effort ressenti ≈ 70 % de l\'équivalent en charges libres.');
   }
   card.appendChild(_convNotice);
 }

 // Header with set progress counter
 var _doneCount = setData.filter(function(s){ return s.validated === true; }).length;
 var setHeaderWrap = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;background:var(--surface,var(--ivory2));padding:6px 8px;border-bottom:1px solid var(--border)'});
 var setHeader = h('div', {style: 'display:grid;grid-template-columns:40px 1fr;flex:1;font-size:11px;font-weight:700;color:var(--grey);text-transform:uppercase;letter-spacing:0.5px'});
 setHeader.appendChild(h('div', {}, '#'));
 setHeader.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? 'Target' : 'Conseill\u00e9')));
 setHeaderWrap.appendChild(setHeader);
 var _serieProgressEl = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;white-space:nowrap;margin-left:8px;padding:2px 6px;border-radius:2px;' + (_doneCount === numSets ? 'background:var(--ink-900,#0A0A09);color:#fff' : 'background:var(--border);color:var(--grey)')}, _doneCount + '\u00a0/\u00a0' + numSets + ' ' + (window.isEnglish && window.isEnglish() ? 'sets' : 's\u00e9ries'));
 setHeaderWrap.appendChild(_serieProgressEl);
 setTable.appendChild(setHeaderWrap);

 // Rows
 setData.forEach(function(setRow, si3) {
 var row = h('div', {'class': 'set-row', style: 'display:flex;flex-direction:column;padding:0;border-top:1px solid var(--border)'});
 var rowContent = h('div', {style: 'display:grid;grid-template-columns:40px 1fr;padding:6px 8px;align-items:center;width:100%'});

 rowContent.appendChild(h('div', {style: 'font-size:13px;font-weight:700;color:var(--text)'}, String(setRow.set)));

 var conseilleEl = h('div', {style: 'font-size:13px;color:var(--grey)'});
 var _dispW = (window.UNITS && window.UNITS.displayWeight) ? window.UNITS.displayWeight(setRow.targetWeight) : (setRow.targetWeight + ' kg');
 // 2026-04 FIX UX HALTÈRE/KB/UNILATÉRAL : suffixe explicite (jamais d'ambiguïté)
 var _wDisplay = _dispW;
 if (setRow.targetWeight > 0 && (_isHaltere || _isKb || _isUnilateral)) {
   _wDisplay = _dispW.replace(/\s*kg\s*$/, '') + (_isHaltere ? (window.isEnglish && window.isEnglish() ? ' kg/db' : ' kg/halt.') : _isKb ? ' kg/kb' : (window.isEnglish && window.isEnglish() ? ' kg/side' : ' kg/côté'));
 }
 var conseilleStr = (setRow.targetWeight > 0 && !isBodyweight)
 ? (_wDisplay + ' \u00d7 ' + setRow.targetReps)
 : (setRow.targetReps + ' reps');
 conseilleEl.appendChild(h('span', {}, conseilleStr));
 // FIX BIBLE MUSCU §7 audit Marc "1260%1RM" : garde-fou défensif.
 // Cause probable : localStorage muscuSessionLog corrompu avec vieille valeur de pct.
 // Règle : afficher UNIQUEMENT si valeur plausible (0 < pct ≤ 100) ET pas pour débutant
 // (bible §7.3 : pas de %1RM pour beginner, source douteuse sur exos obscurs).
 var _pctDisplay = setRow.pctOf1RM;
 var _isBeginnerUser = (window.S && window.S.sportLevel === 'beginner');
 if (typeof _pctDisplay === 'number' && _pctDisplay > 0 && _pctDisplay <= 100 && !_isBeginnerUser) {
 conseilleEl.appendChild(h('span', {style:'font-size:9px;color:var(--blue,#1A3C5E);margin-left:4px'}, _pctDisplay + ' %1RM'));
 }
 rowContent.appendChild(conseilleEl);

 var _pendingValBtn = null;
 var inputZone = h('div', {style: 'display:flex;align-items:center;gap:6px;padding:4px 8px 8px;border-top:1px solid var(--border,#ECF0F1);width:100%;box-sizing:border-box', onclick: function(e){ e.stopPropagation(); }});

 if (!isBodyweight) {
 var weightPlaceholder = progressiveWeight > 0 ? String(progressiveWeight) : 'kg';
 var _wSuggested = setRow.actualWeight === null && setRow.targetWeight > 0;
 var weightInput = h('input', {
 type: 'number', min: '0', max: '500', step: '0.5',
 inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Charge (kg)',
 placeholder: weightPlaceholder,
 value: setRow.actualWeight !== null ? String(setRow.actualWeight) : (setRow.targetWeight > 0 ? String(setRow.targetWeight) : ''),
 // FIX UX 2026-04-17 : tap target 60x44 (WCAG 2.5.5) + font 16px anti-zoom iOS
 // Gris = valeur suggérée (pas encore confirmée), noir = saisie utilisateur
 style: 'width:64px;min-height:44px;padding:10px 6px;border:1px solid var(--border);border-radius:2px;font-size:16px;text-align:center;background:var(--bg,var(--ivory));color:' + (_wSuggested ? 'var(--grey,#6B6B65)' : 'var(--black,#0A0A09)'),
 onfocus: function(e) { var t = e.target; setTimeout(function(){ t.select(); }, 0); },
 oninput: (function(sr, _valBtnRef){ return function(e) {
 e.target.style.color = 'var(--black,#0A0A09)'; // confirmation utilisateur
 var v = parseFloat(e.target.value);
 sr.actualWeight = isNaN(v) ? null : Math.max(0, v);
 saveMuscuSessionLog();
 var _btn = e.target.closest('.set-row') ? e.target.closest('.set-row').querySelector('.set-validate-btn') : null;
 if (_btn) { var _ok = (sr.actualReps !== null || !!sr.targetReps) && (sr.actualWeight !== null || sr.targetWeight > 0); _btn.disabled = !_ok; _btn.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow)
 });
 var _wMinBtn = h('button', {
 style: 'min-width:36px;min-height:44px;padding:0;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;color:var(--black,#0A0A09);line-height:1',
 onclick: (function(sr, inp) { return function(e) {
   e.stopPropagation();
   var cur = parseFloat(inp.value); if (isNaN(cur)) cur = sr.targetWeight || 0;
   var nv = Math.max(0, Math.round((cur - 2.5) * 2) / 2);
   inp.value = String(nv); inp.style.color = 'var(--black,#0A0A09)';
   sr.actualWeight = nv; saveMuscuSessionLog();
   var _vb = inp.closest ? inp.closest('.set-row') : null; if (_vb) _vb = _vb.querySelector('.set-validate-btn');
   if (_vb) { var _ok = (sr.actualReps !== null || !!sr.targetReps) && sr.actualWeight !== null; _vb.disabled = !_ok; _vb.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow, weightInput)
}, '\u2212');
 inputZone.appendChild(_wMinBtn);
 inputZone.appendChild(weightInput);
 var _wPlusBtn = h('button', {
 style: 'min-width:36px;min-height:44px;padding:0;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;color:var(--black,#0A0A09);line-height:1',
 onclick: (function(sr, inp) { return function(e) {
   e.stopPropagation();
   var cur = parseFloat(inp.value); if (isNaN(cur)) cur = sr.targetWeight || 0;
   var nv = Math.max(0, Math.round((cur + 2.5) * 2) / 2);
   inp.value = String(nv); inp.style.color = 'var(--black,#0A0A09)';
   sr.actualWeight = nv; saveMuscuSessionLog();
   var _vb = inp.closest ? inp.closest('.set-row') : null; if (_vb) _vb = _vb.querySelector('.set-validate-btn');
   if (_vb) { var _ok = (sr.actualReps !== null || !!sr.targetReps) && sr.actualWeight !== null; _vb.disabled = !_ok; _vb.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow, weightInput)
}, '+');
 inputZone.appendChild(_wPlusBtn);
 inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey)'}, (window.UNITS ? window.UNITS.weightLabel() : 'kg')));
 } else {
 // Exercice poids du corps : reps uniquement par défaut, poids optionnel via toggle "Lestés"
 var _isLeste = !!setRow.weighted;
 var lesteBtn = h('button', {
 style: 'font-size:9px;padding:2px 6px;background:' + (_isLeste ? 'var(--black,#0A0A09)' : 'transparent') + ';color:' + (_isLeste ? '#fff' : 'var(--grey)') + ';border:1px solid ' + (_isLeste ? 'var(--black,#0A0A09)' : 'var(--border)') + ';border-radius:2px;cursor:pointer;white-space:nowrap;margin-right:4px',
 onclick: (function(sr) { return function(e) {
 e.stopPropagation();
 sr.weighted = !sr.weighted;
 if (!sr.weighted) sr.actualWeight = null;
 saveMuscuSessionLog();
 window.render();
 }; })(setRow)
 }, _isLeste ? (window.isEnglish && window.isEnglish() ? 'Weighted \u2713' : 'Lest\u00e9s \u2713') : (window.isEnglish && window.isEnglish() ? '+ Weighted' : '+ Lest\u00e9s'));
 inputZone.appendChild(lesteBtn);
 var pcLabel;
 if (_isLeste) {
 pcLabel = h('input', {
 type: 'number', min: '0', max: '200', step: '0.5',
 inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Lest (kg)',
 placeholder: 'kg',
 value: setRow.actualWeight !== null && setRow.actualWeight > 0 ? String(setRow.actualWeight) : '',
 // FIX UX 2026-04-17 : tap target 60x44 (WCAG 2.5.5) + font 16px anti-zoom iOS
 style: 'width:60px;min-height:44px;padding:10px 6px;border:1px solid var(--border);border-radius:2px;font-size:16px;text-align:center;background:var(--bg,var(--ivory))',
 oninput: (function(sr){ return function(e) {
 var v = parseFloat(e.target.value);
 sr.actualWeight = isNaN(v) ? null : Math.max(0, v);
 saveMuscuSessionLog();
 var _btn = e.target.closest('.set-row') ? e.target.closest('.set-row').querySelector('.set-validate-btn') : null;
 if (_btn) { var _ok = sr.actualReps !== null && sr.actualWeight !== null; _btn.disabled = !_ok; _btn.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow)
 });
 inputZone.appendChild(pcLabel);
 inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey3,#8A8A84)'}, 'kg'));
 }
 }

 var _rSuggested = setRow.actualReps === null && !!setRow.targetReps;
 var repsInput = h('input', {
 type: 'number', min: '0', max: '50', step: '1',
 inputmode: 'numeric', autocomplete: 'off', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Reps' : 'Répétitions'),
 placeholder: String(setRow.targetReps),
 value: setRow.actualReps !== null ? String(setRow.actualReps) : (setRow.targetReps ? String(setRow.targetReps) : ''),
 // FIX UX 2026-04-17 : tap target 56x44 (WCAG 2.5.5) + font 16px anti-zoom iOS
 style: 'width:56px;min-height:44px;padding:10px 6px;border:1px solid var(--border);border-radius:2px;font-size:16px;text-align:center;background:var(--bg,var(--ivory));color:' + (_rSuggested ? 'var(--grey,#6B6B65)' : 'var(--black,#0A0A09)'),
 onfocus: function(e) { var t = e.target; setTimeout(function(){ t.select(); }, 0); },
 oninput: (function(sr, _isBw){ return function(e) {
 e.target.style.color = 'var(--black,#0A0A09)'; // confirmation utilisateur
 var v = parseInt(e.target.value);
 sr.actualReps = isNaN(v) ? null : Math.max(0, Math.min(999, v));
 saveMuscuSessionLog();
 var _btn = e.target.closest('.set-row') ? e.target.closest('.set-row').querySelector('.set-validate-btn') : null;
 if (_btn) { var _ok = (sr.actualReps !== null || !!sr.targetReps) && (sr.actualWeight !== null || (_isBw && !sr.weighted) || sr.targetWeight > 0); _btn.disabled = !_ok; _btn.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow, isBodyweight)
 });
 var _rMinBtn = h('button', {
 style: 'min-width:32px;min-height:44px;padding:0;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;color:var(--black,#0A0A09);line-height:1',
 onclick: (function(sr, inp, _isBw2) { return function(e) {
   e.stopPropagation();
   var cur = parseInt(inp.value); if (isNaN(cur)) cur = sr.targetReps || 0;
   var nv = Math.max(0, cur - 1);
   inp.value = String(nv); inp.style.color = 'var(--black,#0A0A09)';
   sr.actualReps = nv; saveMuscuSessionLog();
   var _vb = inp.closest ? inp.closest('.set-row') : null; if (_vb) _vb = _vb.querySelector('.set-validate-btn');
   if (_vb) { var _ok = (sr.actualReps !== null || !!sr.targetReps) && (sr.actualWeight !== null || (_isBw2 && !sr.weighted) || sr.targetWeight > 0); _vb.disabled = !_ok; _vb.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow, repsInput, isBodyweight)
}, '\u2212');
 var _rPlusBtn = h('button', {
 style: 'min-width:32px;min-height:44px;padding:0;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;color:var(--black,#0A0A09);line-height:1',
 onclick: (function(sr, inp, _isBw2) { return function(e) {
   e.stopPropagation();
   var cur = parseInt(inp.value); if (isNaN(cur)) cur = sr.targetReps || 0;
   var nv = Math.max(0, Math.min(999, cur + 1));
   inp.value = String(nv); inp.style.color = 'var(--black,#0A0A09)';
   sr.actualReps = nv; saveMuscuSessionLog();
   var _vb = inp.closest ? inp.closest('.set-row') : null; if (_vb) _vb = _vb.querySelector('.set-validate-btn');
   if (_vb) { var _ok = (sr.actualReps !== null || !!sr.targetReps) && (sr.actualWeight !== null || (_isBw2 && !sr.weighted) || sr.targetWeight > 0); _vb.disabled = !_ok; _vb.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow, repsInput, isBodyweight)
}, '+');
 inputZone.appendChild(_rMinBtn);
 inputZone.appendChild(repsInput);
 inputZone.appendChild(_rPlusBtn);
 inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey)'}, window.t('muscu.reps')));

 // Last Session Ghost — valeurs exactes de la dernière session
 if (_lastSessionSets && _lastSessionSets[si3] && _lastSessionSets[si3].validated) {
   var _ghost = _lastSessionSets[si3];
   var _ghostW = (_ghost.actualWeight > 0 && !isBodyweight) ? (window.UNITS ? window.UNITS.displayWeight(_ghost.actualWeight) : _ghost.actualWeight + ' kg') : null;
   var _ghostR = _ghost.actualReps > 0 ? _ghost.actualReps + ' reps' : null;
   if (_ghostW || _ghostR) {
     var _ghostLine = document.createElement('div');
     _ghostLine.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;color:var(--grey,#9A9A90);text-align:center;margin-top:4px;padding:2px 0;';
     _ghostLine.textContent = '↑ ' + [_ghostW, _ghostR].filter(Boolean).join(' × ');
     inputZone.appendChild(_ghostLine);
   }
 }

 // FIX UX — Répéter la série précédente (1 tap = copier poids+reps de si3-1)
 if (si3 > 0 && !setRow.validated) {
   var _prevSr2 = setData[si3 - 1];
   if (_prevSr2 && (_prevSr2.actualWeight > 0 || _prevSr2.actualReps !== null)) {
     var _wRef2 = (!isBodyweight && weightInput) ? weightInput : (pcLabel || null);
     inputZone.appendChild(h('button', {
       'aria-label': (window.isEnglish && window.isEnglish() ? 'Repeat previous set' : 'Répéter la série précédente'),
       style: 'margin-left:auto;min-width:44px;min-height:32px;padding:0 8px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--grey,#6B6B65);cursor:pointer;white-space:nowrap;flex-shrink:0;',
       onclick: (function(_srR, _prev, _wI, _rI, _isBwR) { return function(e) {
         e.stopPropagation();
         if (!_isBwR && _wI && _prev.actualWeight !== null && _prev.actualWeight > 0) {
           _wI.value = String(_prev.actualWeight);
           _wI.style.color = 'var(--black,#0A0A09)';
           _srR.actualWeight = _prev.actualWeight;
         }
         if (_prev.actualReps !== null && _prev.actualReps > 0) {
           _rI.value = String(_prev.actualReps);
           _rI.style.color = 'var(--black,#0A0A09)';
           _srR.actualReps = _prev.actualReps;
         }
         saveMuscuSessionLog();
         var _row2 = e.target.closest ? e.target.closest('.set-row') : null;
         var _vb2 = _row2 ? _row2.querySelector('.set-validate-btn') : null;
         if (_vb2) {
           var _ok3 = (_srR.actualReps !== null || !!_srR.targetReps) && (_srR.actualWeight !== null || (_isBwR && !_srR.weighted) || _srR.targetWeight > 0);
           _vb2.disabled = !_ok3; _vb2.className = 'set-validate-btn' + (_ok3 ? '' : ' set-validate-btn-disabled');
         }
         if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Previous set copied' : 'Série copiée', 'info', 1400);
       }; })(setRow, _prevSr2, _wRef2, repsInput, isBodyweight)
     }, '↩ ' + (window.isEnglish && window.isEnglish() ? 'Repeat' : 'Répéter')));
   }
 }

 // Verrouiller les inputs si la série est déjà validée
 if (setRow.validated === true) {
 if (typeof weightInput !== 'undefined' && weightInput) { weightInput.disabled = true; weightInput.style.opacity = '0.5'; }
 if (typeof pcLabel !== 'undefined' && pcLabel) { pcLabel.disabled = true; pcLabel.style.opacity = '0.5'; }
 repsInput.disabled = true; repsInput.style.opacity = '0.5';
 }

 // Bouton validation série + déclenchement timer repos
 (function(_sr, _si, _exRef, _numSets, _isBody, _exI, _allEx) {
 var isValidated = _sr.validated === true;
 var _bwNoWeight = _isBody && !_sr.weighted;
 // Bouton actif si : l'user a saisi des valeurs OU les valeurs conseillées existent (pré-rempli)
 var hasData = (_sr.actualReps !== null || !!_sr.targetReps) && (_sr.actualWeight !== null || _bwNoWeight || _sr.targetWeight > 0);

 if (isValidated) {
 // Série déjà validée : afficher le checkmark + bouton annuler discret
 var ok = _sr.actualReps >= _sr.targetReps && (_bwNoWeight || _sr.actualWeight >= _sr.targetWeight);
 inputZone.appendChild(h('span', {'class': ok ? 'set-success' : 'set-fail', style: 'font-size:13px'}, ok ? '\u2713' : '\u2717'));
 // FIX UX 2026-04-17 : bouton "Annuler" la validation — permet de revenir sur une erreur de frappe
 var _undoBtn = h('button', {
  'class': 'set-undo-btn',
  'aria-label': (window.isEnglish && window.isEnglish() ? 'Undo set validation' : 'Annuler la validation de cette s\u00e9rie'),
  title: (window.isEnglish && window.isEnglish() ? 'Undo validation' : 'Annuler la validation'),
  style: 'margin-left:6px;min-width:44px;min-height:44px;padding:6px 8px;background:transparent;border:none;color:var(--grey,#6B6B65);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;',
  onclick: (function(_srUndo){ return function(e) {
   e.stopPropagation();
   _srUndo.validated = false;
   saveMuscuSessionLog();
   if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Set unlocked' : 'S\u00e9rie d\u00e9verrouill\u00e9e', 'info', 1800);
   if (window.render) window.render();
  }; })(_sr)
 }, (window.isEnglish && window.isEnglish() ? 'Undo' : 'Annuler'));
 inputZone.appendChild(_undoBtn);
 row.classList.add('set-row-validated');
 } else {
 // Bouton de validation
 var valBtn = h('button', {
 'class': 'set-validate-btn' + (hasData ? '' : ' set-validate-btn-disabled'),
 disabled: !hasData,
 style: 'flex-shrink:0;padding:0;font-size:20px;font-weight:700;min-width:44px;min-height:44px;line-height:1',
 onclick: function(e) {
 e.stopPropagation();
 // Ripple visuel depuis le point de tap
 try {
   var _rEl = document.createElement('span');
   var _rect = e.currentTarget.getBoundingClientRect();
   var _rSize = Math.max(_rect.width, _rect.height) * 2;
   var _rx = (e.clientX - _rect.left) - _rSize / 2;
   var _ry = (e.clientY - _rect.top) - _rSize / 2;
   _rEl.style.cssText = 'position:absolute;border-radius:50%;background:rgba(62,92,58,0.3);pointer-events:none;width:' + _rSize + 'px;height:' + _rSize + 'px;left:' + _rx + 'px;top:' + _ry + 'px;animation:ripple-muscu 0.45s ease-out forwards;';
   e.currentTarget.appendChild(_rEl);
   setTimeout(function() { try { _rEl.parentNode && _rEl.parentNode.removeChild(_rEl); } catch(_re) {} }, 500);
 } catch(_ripErr) {}
 // Si l'user n'a rien modifié, confirmer automatiquement les valeurs conseillées
 if (_sr.actualWeight === null && !_bwNoWeight && _sr.targetWeight > 0) _sr.actualWeight = _sr.targetWeight;
 if (_sr.actualReps === null && _sr.targetReps) _sr.actualReps = _sr.targetReps;
 // Marquer la série comme validée
 _sr.validated = true;
 saveMuscuSessionLog();

 // Tick de confirmation
 if (window.RestTimer) window.RestTimer.playTick();

 // FIX SPRINT P1.5 — Toast "Série loggée" feedback visuel
 try { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Set logged' : 'Série loggée', 'success', 1400); } catch(_eT) {}

 // FIX SPRINT P1.10 — Autofocus input REPS de la série suivante (gain UX mobile)
 try {
   var nextRow = e.target.closest('.set-row');
   if (nextRow && nextRow.nextElementSibling && nextRow.nextElementSibling.classList.contains('set-row')) {
     setTimeout(function() {
       var nextRepsInput = nextRow.nextElementSibling.querySelector('input[inputmode="numeric"]');
       if (nextRepsInput && !nextRepsInput.disabled) nextRepsInput.focus();
     }, 100);
   }
 } catch(_eF) {}

 var isLastSet = _si >= _numSets - 1;

 if (!isLastSet) {
 // ── Timer repos inter-série ──
 var restSec = parseRestTime(_exRef.rest);
 if (window.RestTimer) {
 window.RestTimer.start(restSec, _exRef.n, _sr.set, function() {
 if (window.render) window.render();
 });
 }
 } else {
 // ── Dernière série → timer transition inter-exercice ──
 var nextExIdx = _exI + 1;
 var nextEx = (_allEx && nextExIdx < _allEx.length) ? _allEx[nextExIdx] : null;
 if (nextEx && window.RestTimer && window.getExerciseTransitionTime) {
 var transSec = window.getExerciseTransitionTime(_exRef, nextEx);
 window.RestTimer.startTransition(transSec, _exRef.n, nextEx.n || nextEx.name, function() {
 if (window.render) window.render();
 });
 }
 }
 // Re-render immédiat pour afficher le checkmark
 if (window.render) window.render();
 }
 }, '\u2713');
 _pendingValBtn = valBtn;
 }
 })(setRow, si3, exRef, numSets, isBodyweight, _exIdx, _dayExercises);


 if (_pendingValBtn) { inputZone.appendChild(_pendingValBtn); }
 row.appendChild(rowContent);
 row.appendChild(inputZone);

 setTable.appendChild(row);
 // Display rirNote feedback as a full-width row beneath the set row (after render cycle)
 if (isAdvancedRIR && setRow.rirNote) {
  setTable.appendChild(h('div', {style: 'padding:3px 8px;background:rgba(232,111,30,0.06);border-top:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--orange-ink,#7A3B0E);letter-spacing:0.5px'}, '\u26a0 S' + setRow.set + ' : ' + setRow.rirNote));
 }
 });

 // Note progression semaine prochaine
 if (progressiveWeight > 0 && !isBodyweight) {
 var lbKeywords = /squat|leg|fessier|ischios|mollet|presse|hip.*thrust|rdl|deadlift|soulev|cuisse|jambe/i;
 var nextIncr = lbKeywords.test(exRef.n) ? 5 : 2.5;
 var progressNote = h('div', {style: 'padding:6px 8px;background:rgba(62,92,58,0.06);border-top:1px solid var(--border);font-size:11px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif'});
 progressNote.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? 'Next week target: ' : 'Objectif semaine prochaine\u00a0: ') + (progressiveWeight + nextIncr) + '\u00a0kg' + (window.isEnglish && window.isEnglish() ? ' if all sets completed' : ' si toutes s\u00e9ries r\u00e9ussies')));
 setTable.appendChild(progressNote);
 } else if (isBodyweight) {
 var bwProgressNote = h('div', {style: 'padding:6px 8px;background:rgba(62,92,58,0.06);border-top:1px solid var(--border);font-size:11px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif'});
 bwProgressNote.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? 'Target: +1-2 reps per set if all sets completed' : 'Objectif\u00a0: +1-2 reps par s\u00e9rie si toutes s\u00e9ries r\u00e9ussies')));
 setTable.appendChild(bwProgressNote);
 }

 // Suggestion de progression automatique (basée sur historique)
 if (window.checkProgressionSuggestion) {
 var _sessLog = [];
 var _sortedDates = Object.keys(S.muscuSessionLog || {}).sort();
 _sortedDates.forEach(function(d) {
 if (S.muscuSessionLog[d] && Array.isArray(S.muscuSessionLog[d][exRef.n]) && S.muscuSessionLog[d][exRef.n].length > 0) {
 var _sSets = S.muscuSessionLog[d][exRef.n].filter(function(s) { return s.actualReps !== null; });
 if (_sSets.length > 0) {
 _sessLog.push({ week: d, sets: _sSets.map(function(s) { return { reps: s.actualReps, load: s.actualWeight || 0, targetReps: s.targetReps }; }) });
 }
 }
 });
 var _progSug = window.checkProgressionSuggestion(exRef.n, S.muscuWeek || 1, _sessLog);
 if (_progSug) {
 var _sugBadge = h('div', {'class': 'set-progress-badge', style: 'display:block;margin-top:4px'}, _progSug.message);
 setTable.appendChild(_sugBadge);
 }
 }

 // Mini graphe progression si >= 3 entrées historique
 var progHist = S.muscuProgressionHistory[exRef.n];
 if (progHist && progHist.length >= 3) {
 var lastFive = progHist.slice(-5);
 var progressValues = isBodyweight
 ? lastFive.map(function(e) { return e.reps || 0; })
 : lastFive.map(function(e) { return e.weight; });
 var _sparkUnit = isBodyweight ? 'reps' : (window.UNITS ? window.UNITS.weightLabel() : 'kg');
 var progGraph = h('div', {style: 'padding:6px 8px;border-top:1px solid var(--border);font-size:11px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;display:flex;align-items:center;gap:6px'});
 var sparkSvg = renderSparkline(progressValues, '#3E5C3A');
 if (sparkSvg) progGraph.appendChild(sparkSvg);
 progGraph.appendChild(h('span', {style: 'margin-left:4px'}, progressValues[0] + '\u00a0' + _sparkUnit + ' \u2192 ' + progressValues[progressValues.length - 1] + '\u00a0' + _sparkUnit));
 setTable.appendChild(progGraph);
 }

 // ─── PERSONAL RECORD DETECTION ───
 (function(_exRef2, _isBodyweight2, _setData2) {
  var _prToday = new Date().toISOString().slice(0, 10);
  var _sortedDates2 = Object.keys(S.muscuSessionLog || {}).sort();
  var _isPR = false;
  if (_isBodyweight2) {
   // Bodyweight PR : meilleur nombre de reps sur une série
   var _prevBestReps = 0;
   _sortedDates2.forEach(function(d) {
    if (d >= _prToday) return;
    var _prevSets = (S.muscuSessionLog[d] && Array.isArray(S.muscuSessionLog[d][_exRef2.n])) ? S.muscuSessionLog[d][_exRef2.n] : [];
    _prevSets.forEach(function(s) {
     if (s.actualReps && s.actualReps > _prevBestReps) _prevBestReps = s.actualReps;
    });
   });
   if (_prevBestReps > 0) {
    var _todaySets2bw = _setData2 || [];
    var _todayBestReps = 0;
    _todaySets2bw.forEach(function(s) {
     if (s.validated && s.actualReps && s.actualReps > _todayBestReps) _todayBestReps = s.actualReps;
    });
    if (_todayBestReps > _prevBestReps) _isPR = true;
   }
  } else {
   // Weighted PR : meilleur volume (poids × reps) sur une série
   var _prevBestVolume = 0;
   _sortedDates2.forEach(function(d) {
    if (d >= _prToday) return;
    var _prevSets = (S.muscuSessionLog[d] && Array.isArray(S.muscuSessionLog[d][_exRef2.n])) ? S.muscuSessionLog[d][_exRef2.n] : [];
    _prevSets.forEach(function(s) {
     if (s.actualReps && s.actualWeight) {
      var vol = s.actualWeight * s.actualReps;
      if (vol > _prevBestVolume) _prevBestVolume = vol;
     }
    });
   });
   if (_prevBestVolume > 0) {
    var _todaySets2 = _setData2 || [];
    var _todayBestVolume = 0;
    _todaySets2.forEach(function(s) {
     if (s.validated && s.actualReps && s.actualWeight) {
      var vol = s.actualWeight * s.actualReps;
      if (vol > _todayBestVolume) _todayBestVolume = vol;
     }
    });
    if (_todayBestVolume > _prevBestVolume) _isPR = true;
   }
  }
  if (_isPR) {
   // Nouveau PR !
   var _prBanner = document.createElement('div');
   _prBanner.style.cssText = 'padding:6px 10px;background:rgba(62,92,58,0.06);border-top:1px solid var(--success,#3E5C3A);display:flex;align-items:center;gap:8px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);letter-spacing:0.3px;';
   var _prArrow = document.createElement('span');
   _prArrow.style.cssText = 'font-size:13px;font-weight:700;flex-shrink:0;';
   _prArrow.textContent = '\u2191 PR';
   var _prMsg = document.createElement('span');
   _prMsg.textContent = (window.isEnglish && window.isEnglish())
     ? 'New personal record on ' + _exRef2.n + '\u00a0!'
     : 'Nouveau record personnel sur ' + _exRef2.n + '\u00a0!';
   _prBanner.appendChild(_prArrow);
   _prBanner.appendChild(_prMsg);
   setTable.appendChild(_prBanner);
  }
 })(exRef, isBodyweight, setData);

 card.appendChild(setTable);

 // Mini sparkline historique — affiche les 8 dernières charges pour cet exercice
 if (window.PERF_HISTORY && window.PERF_HISTORY.renderMiniChart) {
   try {
     var _sparkContainer = document.createElement('div');
     _sparkContainer.style.cssText = 'margin-top:4px;';
     window.PERF_HISTORY.renderMiniChart(exRef.n, _sparkContainer);
     if (_sparkContainer.children.length > 0) card.appendChild(_sparkContainer);
   } catch(e) {}
 }

 // ── NEXT EXERCISE NUDGE : shown when all sets are validated ──
 (function(_exRef, _exIdx2, _dayExercises2) {
 var _today2 = new Date().toISOString().slice(0, 10);
 var _exSets2 = S.muscuSessionLog[_today2] && S.muscuSessionLog[_today2][_exRef.n] ? S.muscuSessionLog[_today2][_exRef.n] : [];
 var _allValidated = _exSets2.length > 0 && _exSets2.every(function(s) { return s.validated === true; });
 if (_allValidated) {
 var _nextEx2 = (_dayExercises2 && _exIdx2 + 1 < _dayExercises2.length) ? _dayExercises2[_exIdx2 + 1] : null;
 var _nudge = h('div', {style: 'margin-top:8px;padding:10px 14px;background:var(--ink-900,#0A0A09);border-radius:2px;display:flex;align-items:center;justify-content:space-between'});
 _nudge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#fff;font-weight:700'}, (window.isEnglish && window.isEnglish() ? '\u2713 Exercise done' : '\u2713 Exercice termin\u00e9')));
 if (_nextEx2) {
 var _nudgeRight = h('div', {style: 'text-align:right'});
 _nudgeRight.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px'}, (window.isEnglish && window.isEnglish() ? 'Next' : 'Suivant')));
 _nudgeRight.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;color:#fff;max-width:140px;text-align:right'}, _nextEx2.n));
 _nudge.appendChild(_nudgeRight);
 } else {
 _nudge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.8)'}, (window.isEnglish && window.isEnglish() ? 'Last exercise \u2014 Great session\u00a0!' : 'Dernier exercice \u2014 Belle s\u00e9ance\u00a0!')));
 }
 card.appendChild(_nudge);
 }
 })(ex, exIdx, day.exercises);
 })(ex, eqType === 'bodyweight', exIdx, day.exercises);

 // ─── SWAP EXERCISE BUTTON ───────────────────────────────────────────
 (function(exRef, dayI, exI) {
 var swapKey = dayI + '_' + exI;
 var isOpen = S.swapPanel === swapKey;
 var swapBtn = h('button', {
 style: 'margin-top:10px;width:100%;padding:8px 12px;border:1px dashed var(--border,#DDDBD0);background:transparent;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--grey);border-radius:2px;transition:border-color .15s',
 onclick: function(e) {
 e.stopPropagation();
 S.swapPanel = isOpen ? null : swapKey;
 window.render();
 }
 }, isOpen ? '\u25b2 Annuler' : '\u21c4 Changer cet exercice');
 card.appendChild(swapBtn);

 if (isOpen) {
 var alts = window.getAlternativeExercises ? window.getAlternativeExercises(exRef.m, exRef.n, 4, S.sportLevel) : [];
 var altPanel = h('div', {style: 'margin-top:6px;border:1px solid var(--border,#DDDBD0);border-radius:2px;overflow:hidden;background:var(--ivory2,#F5F4EF)'});
 var altTitle = h('div', {style: 'padding:8px 12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);border-bottom:1px solid var(--border)'}, (window.isEnglish && window.isEnglish() ? 'Exercises for the same muscles' : 'Exercices pour les m\u00eames muscles'));
 altPanel.appendChild(altTitle);

 if (alts.length === 0) {
 altPanel.appendChild(h('div', {style: 'padding:12px;text-align:center;font-size:13px;color:var(--grey);font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'No alternatives available.' : 'Aucune alternative disponible.')));
 } else {
 alts.forEach(function(alt) {
 var altRow = h('div', {
 style: 'padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border,#DDDBD0);transition:background .1s',
 onclick: function(e) {
 e.stopPropagation();
 // FIX 2026-04-21 : préserver desc/tips/warn/lv/tags de l'alt enrichie
 // (sinon l'utilisateur perd les explications en swappant)
 var newEx = { n: alt.n, m: alt.m, eq: alt.eq, sets: alt.sets || exRef.sets, rest: alt.rest || exRef.rest };
 if (alt.desc) newEx.desc = alt.desc;
 if (Array.isArray(alt.tips) && alt.tips.length) newEx.tips = alt.tips.slice();
 if (alt.warn) newEx.warn = alt.warn;
 if (typeof alt.lv === 'number') newEx.lv = alt.lv;
 if (Array.isArray(alt.tags)) newEx.tags = alt.tags.slice();
 newEx.video = alt.video || (window.getExerciseVideoUrl ? window.getExerciseVideoUrl(alt.n) : null);
 if (!Array.isArray(S.sportProgram) || !S.sportProgram[dayI] || !Array.isArray(S.sportProgram[dayI].exercises)) { S.swapPanel = null; window.render(); return; }
 var _newName = (newEx.n || '').toLowerCase().trim();
 var _dupIdx = S.sportProgram[dayI].exercises.findIndex(function(e, idx) { return idx !== exI && (e.n || '').toLowerCase().trim() === _newName; });
 if (_dupIdx !== -1) { if (window.showToast) window.showToast('⚠ ' + newEx.n + ((window.isEnglish && window.isEnglish()) ? ' is already in this session' : ' est déjà dans cette séance'), 'warning', 2500); S.swapPanel = null; window.render(); return; }
 S.sportProgram[dayI].exercises[exI] = newEx;
 // Migrer les données de session pour le nouvel exercice
 var _today = new Date().toISOString().slice(0, 10);
 if (S.muscuSessionLog && S.muscuSessionLog[_today] && S.muscuSessionLog[_today][exRef.n]) {
 S.muscuSessionLog[_today][newEx.n] = S.muscuSessionLog[_today][exRef.n];
 delete S.muscuSessionLog[_today][exRef.n];
 saveMuscuSessionLog();
 }
 S.swapPanel = null;
 if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
 if (window.showToast) window.showToast('✓ ' + (newEx.n || 'Exercice') + ((window.isEnglish && window.isEnglish()) ? ' added to program' : ' ajouté au programme'), 'success', 2500);
 window.render();
 },
 onmouseover: function() { this.style.background = 'var(--ivory,#FAF9F6)'; },
 onmouseout: function() { this.style.background = ''; }
 });
 var altTop = h('div', {style: 'display:flex;justify-content:space-between;align-items:center'});
 altTop.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09)'}, alt.n));
 var altVideoUrl = alt.video || (window.getExerciseVideoUrl ? window.getExerciseVideoUrl(alt.n) : null);
 if (altVideoUrl) {
 altTop.appendChild(h('a', {
 href: altVideoUrl, target: '_blank', rel: 'noopener',
 style: 'font-size:11px;color:var(--error,#7A1F1F);text-decoration:none;flex-shrink:0;margin-left:8px',
 onclick: function(e) { e.stopPropagation(); }
 }, (window.isEnglish && window.isEnglish() ? '\u25b6 Video' : '\u25b6 Vid\u00e9o')));
 }
 altRow.appendChild(altTop);
 altRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, alt.m + (alt.eq ? ' \u2014 ' + alt.eq : '')));
 altPanel.appendChild(altRow);
 });
 }
 card.appendChild(altPanel);
 }
 })(ex, S.selectedSportDay, exIdx);

 // FIX UX — Passer cet exercice (visible sauf sur le dernier)
 if (exIdx < _totalExercises - 1) {
   card.appendChild(h('button', {
     style: 'margin-top:4px;width:100%;padding:8px 0;border:none;background:transparent;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:right;',
     onclick: (function(_ei) { return function(e) {
       e.stopPropagation();
       S.currentExerciseIdx = _ei + 1;
       if (navigator.vibrate) { try { navigator.vibrate(10); } catch(_v) {} }
       if (window.render) window.render();
     }; })(exIdx)
   }, (window.isEnglish && window.isEnglish() ? 'Skip this exercise →' : 'Passer cet exercice →')));
 }

 _swipeWrap.appendChild(card);
 })(); // fin rendu exercice courant

 // ─── PREV / NEXT ───
 if (_totalExercises > 1) {
  var _arrowRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;margin-top:12px'});
  _arrowRow.appendChild(h('button', {
   style: 'padding:10px 16px;border:1px solid var(--border,#D8D8D0);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;color:var(--grey,#6B6B65);border-radius:2px;cursor:pointer;' + (S.currentExerciseIdx === 0 ? 'opacity:0.25;pointer-events:none' : ''),
   onclick: function(e) { e.stopPropagation(); if (S.currentExerciseIdx > 0) { S.currentExerciseIdx--; if (navigator.vibrate) navigator.vibrate(10); window.render(); } }
  }, (window.isEnglish && window.isEnglish() ? '‹ Previous' : '‹ Précédent')));
  _arrowRow.appendChild(h('button', {
   style: 'padding:10px 16px;border:1px solid var(--border,#D8D8D0);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;color:var(--grey,#6B6B65);border-radius:2px;cursor:pointer;' + (S.currentExerciseIdx >= _totalExercises - 1 ? 'opacity:0.25;pointer-events:none' : ''),
   onclick: function(e) { e.stopPropagation(); if (S.currentExerciseIdx < _totalExercises - 1) { S.currentExerciseIdx++; if (navigator.vibrate) navigator.vibrate(10); window.render(); } }
  }, 'Suivant ›'));
  _swipeWrap.appendChild(_arrowRow);
 }

 // ─── TOUCH SWIPE ───
 var _tStartX = 0, _tStartY = 0, _tSwiping = false;
 _swipeWrap.addEventListener('touchstart', function(e) {
  _tStartX = e.touches[0].clientX;
  _tStartY = e.touches[0].clientY;
  _tSwiping = false;
 }, {passive: true});
 _swipeWrap.addEventListener('touchmove', function(e) {
  var _dx = e.touches[0].clientX - _tStartX;
  var _dy = e.touches[0].clientY - _tStartY;
  if (!_tSwiping && Math.abs(_dx) > Math.abs(_dy) && Math.abs(_dx) > 8) { _tSwiping = true; }
  if (_tSwiping) e.preventDefault();
 }, {passive: false});
 _swipeWrap.addEventListener('touchend', function(e) {
  if (!_tSwiping) return;
  var _dxEnd = e.changedTouches[0].clientX - _tStartX;
  if (_dxEnd < -40 && S.currentExerciseIdx < _totalExercises - 1) { S.currentExerciseIdx++; if (navigator.vibrate) navigator.vibrate(10); window.render(); }
  else if (_dxEnd > 40 && S.currentExerciseIdx > 0) { S.currentExerciseIdx--; if (navigator.vibrate) navigator.vibrate(10); window.render(); }
 }, {passive: true});

 p.appendChild(_swipeWrap);

 // ─── DAY SWIPE (switches selectedSportDay left/right) ───
 (function() {
  var _nDays = Array.isArray(S.sportProgram) ? S.sportProgram.length : 0;
  if (_nDays < 2) return;
  var _dTX = 0, _dTY = 0, _dBlocked = false, _dSwiping = false;
  p.addEventListener('touchstart', function(e) {
   _dTX = e.touches[0].clientX;
   _dTY = e.touches[0].clientY;
   _dBlocked = _swipeWrap.contains(e.target);
   _dSwiping = false;
  }, {passive: true});
  p.addEventListener('touchmove', function(e) {
   if (_dBlocked) return;
   var dx = e.touches[0].clientX - _dTX;
   var dy = e.touches[0].clientY - _dTY;
   if (!_dSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) _dSwiping = true;
  }, {passive: true});
  p.addEventListener('touchend', function(e) {
   if (!_dSwiping || _dBlocked) return;
   var dx = e.changedTouches[0].clientX - _dTX;
   if (dx < -50 && S.selectedSportDay < _nDays - 1) {
    S.selectedSportDay++;
    S.currentExerciseIdx = 0;
    if (navigator.vibrate) try { navigator.vibrate(10); } catch(_v) {}
    window.render();
   } else if (dx > 50 && S.selectedSportDay > 0) {
    S.selectedSportDay--;
    S.currentExerciseIdx = 0;
    if (navigator.vibrate) try { navigator.vibrate(10); } catch(_v) {}
    window.render();
   }
  }, {passive: true});
 })();

 // ─── ÉCHAUFFEMENT (collapsible) ───
 (function() {
  var wu = day.warmup || {
   duration: 8,
   exercises: [
    { name: (window.isEnglish && window.isEnglish() ? 'Light cardio (bike/treadmill)' : 'Cardio léger (vélo/tapis)'), duration: '5 min', intensity: (window.isEnglish && window.isEnglish() ? 'Low' : 'Faible') },
    { name: (window.isEnglish && window.isEnglish() ? 'Joint mobility' : 'Mobilité articulaire'), duration: '3 min', notes: (window.isEnglish && window.isEnglish() ? 'Circles: shoulders, hips, ankles' : 'Cercles épaules, hanches, chevilles') }
   ]
  };
  var _wuOpen = !!S._wuOpen;
  var wuBar = h('div', {
   style: 'display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(62,92,58,0.04);border:1px solid var(--border,#D8D8D0);border-left:3px solid var(--success,#3E5C3A);cursor:pointer;margin-top:12px;margin-bottom:' + (_wuOpen ? '0' : '16px'),
   onclick: function(e) { e.stopPropagation(); S._wuOpen = !S._wuOpen; window.render(); }
  });
  wuBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--green,#3E5C3A);font-weight:600'}, (window.isEnglish && window.isEnglish() ? 'WARM-UP\u00a0·\u00a0' + wu.duration + '\u00a0min' : '\u00c9CHAUFFEMENT\u00a0·\u00a0' + wu.duration + '\u00a0min')));
  wuBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, _wuOpen ? '\u25b2' : '\u25bc'));
  p.appendChild(wuBar);
  if (_wuOpen) {
   var wuContent = h('div', {style: 'background:rgba(62,92,58,0.03);border:1px solid var(--border,#D8D8D0);border-top:none;border-left:3px solid var(--success,#3E5C3A);padding:12px 14px;margin-bottom:16px;'});
   (wu.exercises || []).forEach(function(ex) {
    var row = h('div', {style: 'display:flex;align-items:flex-start;gap:8px;margin-bottom:4px'});
    row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#1A1A18);font-weight:500;flex-shrink:0;min-width:180px'}, ex.name + '\u00a0—\u00a0' + ex.duration));
    var detail = (ex.intensity || '') + (ex.notes ? (ex.intensity ? '\u00a0·\u00a0' : '') + ex.notes : '');
    if (detail) row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);line-height:1.4'}, detail));
    wuContent.appendChild(row);
   });
   p.appendChild(wuContent);
  }
 })();

 // ─── RÉCUPÉRATION (collapsible) ───
 (function() {
  var cd = day.cooldown || {
   duration: 5,
   exercises: [
    { name: (window.isEnglish && window.isEnglish() ? 'Walk or light cycling' : 'Marche ou vélo léger'), duration: '3 min', intensity: (window.isEnglish && window.isEnglish() ? 'Very low' : 'Très faible') },
    { name: (window.isEnglish && window.isEnglish() ? 'Static stretching' : 'Étirements statiques'), duration: '2 min', notes: (window.isEnglish && window.isEnglish() ? 'Worked muscle groups' : 'Groupes musculaires travaillés') }
   ]
  };
  var _cdOpen = !!S._cdOpen;
  var cdBar = h('div', {
   style: 'display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(26,58,106,0.04);border:1px solid rgba(26,58,106,0.12);border-left:3px solid var(--blue,#1A3A6A);cursor:pointer;margin-bottom:' + (_cdOpen ? '0' : '16px'),
   onclick: function(e) { e.stopPropagation(); S._cdOpen = !S._cdOpen; window.render(); }
  });
  cdBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:#1A3A6A;font-weight:600'}, (window.isEnglish && window.isEnglish() ? 'COOL-DOWN\u00a0·\u00a0' + cd.duration + '\u00a0min' : 'RÉCUPÉRATION\u00a0·\u00a0' + cd.duration + '\u00a0min')));
  cdBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, _cdOpen ? '\u25b2' : '\u25bc'));
  p.appendChild(cdBar);
  if (_cdOpen) {
   var cdContent = h('div', {style: 'background:rgba(26,58,106,0.03);border:1px solid rgba(26,58,106,0.12);border-top:none;border-left:3px solid var(--blue,#1A3A6A);padding:12px 14px;margin-bottom:16px;'});
   (cd.exercises || []).forEach(function(ex) {
    var row = h('div', {style: 'display:flex;align-items:flex-start;gap:8px;margin-bottom:4px'});
    row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#1A1A18);font-weight:500;flex-shrink:0;min-width:180px'}, ex.name + '\u00a0—\u00a0' + ex.duration));
    var detail = (ex.intensity || '') + (ex.notes ? (ex.intensity ? '\u00a0·\u00a0' : '') + ex.notes : '');
    if (detail) row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);line-height:1.4'}, detail));
    cdContent.appendChild(row);
   });
   p.appendChild(cdContent);
  }
 })();

 // ─── BRIEF DÉBUTANT (collapsible, en bas) ───
 if (S.sportLevel === 'beginner') {
  (function() {
   var MUSCLE_BRIEFS_B = {
    'poitrine':    { why: (window.isEnglish && window.isEnglish() ? 'pecs are the foundation of pushing — they strengthen your arms and shoulders at the same time' : 'les pectoraux, c\'est la base du push — ça renforce tes bras et tes épaules en même temps'), tip: (window.isEnglish && window.isEnglish() ? 'Feel the contraction on each rep — quality beats weight' : 'Sens bien la contraction à chaque rep — la qualité prime sur le poids') },
    'pectoral':    { why: (window.isEnglish && window.isEnglish() ? 'pecs are the foundation of pushing — they strengthen your arms and shoulders at the same time' : 'les pectoraux, c\'est la base du push — ça renforce tes bras et tes épaules en même temps'), tip: (window.isEnglish && window.isEnglish() ? 'Feel the contraction on each rep — quality beats weight' : 'Sens bien la contraction à chaque rep — la qualité prime sur le poids') },
    'dos':         { why: (window.isEnglish && window.isEnglish() ? 'a strong back = better posture and less daily pain' : 'un dos fort = meilleure posture et moins de douleurs au quotidien'), tip: (window.isEnglish && window.isEnglish() ? 'Pull with your elbows, not your hands — that\'s where the back works' : 'Tire avec les coudes, pas avec les mains — c\'est là que le dos bosse vraiment') },
    'dorsaux':     { why: (window.isEnglish && window.isEnglish() ? 'a strong back = better posture and less daily pain' : 'un dos fort = meilleure posture et moins de douleurs au quotidien'), tip: (window.isEnglish && window.isEnglish() ? 'Pull with your elbows, not your hands — that\'s where the back works' : 'Tire avec les coudes, pas avec les mains — c\'est là que le dos bosse vraiment') },
    'épaule':      { why: (window.isEnglish && window.isEnglish() ? 'strong shoulders stabilize your entire upper body — essential for pushing and pulling hard' : 'des épaules solides stabilisent tout ton upper body — indispensables pour pousser et tirer fort'), tip: (window.isEnglish && window.isEnglish() ? 'Start light — shoulders get injured easily' : 'Commence léger — les épaules, ça se blesse vite') },
    'jambe':       { why: (window.isEnglish && window.isEnglish() ? 'your legs are your biggest muscles — they burn the most calories and boost all your strength' : 'tes jambes sont tes plus gros muscles — elles brûlent un max de calories et boostent toute ta force'), tip: (window.isEnglish && window.isEnglish() ? 'Keep your knee in line with your foot on each rep' : 'Garde le genou dans l\'axe du pied à chaque rep') },
    'quadri':      { why: (window.isEnglish && window.isEnglish() ? 'quads propel you every step, jump or sprint — training legs means gaining everything' : 'les quadriceps te propulsent à chaque pas, saut ou accélération — bosser les jambes, c\'est tout gagner'), tip: (window.isEnglish && window.isEnglish() ? 'Lower slowly (3s) — that\'s where the magic happens' : 'Descends lentement (3s) — c\'est là que l\'essentiel se passe') },
    'fessier':     { why: (window.isEnglish && window.isEnglish() ? 'glutes = your power engine and the best protection for your back' : 'les fessiers = ton moteur de puissance et la meilleure protection de ton dos'), tip: (window.isEnglish && window.isEnglish() ? 'Squeeze hard at the top of each rep — that\'s where it works' : 'Serre bien en haut de chaque mouvement — c\'est là que ça travaille vraiment') },
    'bras':        { why: (window.isEnglish && window.isEnglish() ? 'biceps and triceps together: everything to pull hard and push hard' : 'biceps et triceps ensemble : tout pour tirer fort et pousser fort'), tip: (window.isEnglish && window.isEnglish() ? 'Control the lowering phase — that\'s where the muscle grows most' : 'Contrôle la descente — c\'est la phase où le muscle grandit le plus') },
    'biceps':      { why: (window.isEnglish && window.isEnglish() ? 'biceps allow you to pull — essential for pull-ups and a powerful back' : 'les biceps te permettent de tirer — indispensables pour les tractions et un dos puissant'), tip: (window.isEnglish && window.isEnglish() ? 'Control the lowering phase — that\'s where the muscle grows most' : 'Contrôle la descente — c\'est la phase où le muscle grandit le plus') },
    'triceps':     { why: (window.isEnglish && window.isEnglish() ? 'triceps make up 2/3 of arm volume — if you want bigger arms, train them!' : 'les triceps représentent 2/3 du volume du bras — si tu veux des bras, travaille-les !'), tip: (window.isEnglish && window.isEnglish() ? 'Full extension on each rep — don\'t cut the movement short' : 'Extension complète à chaque rep — ne raccourcis pas le mouvement') },
    'abdo':        { why: (window.isEnglish && window.isEnglish() ? 'a solid core makes every movement more powerful and protects your back' : 'un core solide, c\'est chaque mouvement plus puissant et ton dos protégé'), tip: (window.isEnglish && window.isEnglish() ? 'Planks over crunches — hold the position, it\'s far more effective' : 'Gainage plutôt que crunches — tiens la position, c\'est bien plus efficace') },
    'abdominaux':  { why: (window.isEnglish && window.isEnglish() ? 'a solid core makes every movement more powerful and protects your back' : 'un core solide, c\'est chaque mouvement plus puissant et ton dos protégé'), tip: (window.isEnglish && window.isEnglish() ? 'Planks over crunches — hold the position, it\'s far more effective' : 'Gainage plutôt que crunches — tiens la position, c\'est bien plus efficace') },
    'corps entier':{ why: (window.isEnglish && window.isEnglish() ? 'full session = you stimulate all muscles and burn maximum calories' : 'séance complète = tu stimules tous les muscles et brûles un maximum de calories'), tip: (window.isEnglish && window.isEnglish() ? 'Recover well — you worked hard today!' : 'Récupère bien — t\'as beaucoup bossé aujourd\'hui !') }
   };
   var _focusLowB = (day.focus || '').toLowerCase();
   var _matchedBriefB = null;
   var _briefKeysB = Object.keys(MUSCLE_BRIEFS_B);
   for (var _bkB = 0; _bkB < _briefKeysB.length; _bkB++) {
    if (_focusLowB.indexOf(_briefKeysB[_bkB]) !== -1) { _matchedBriefB = MUSCLE_BRIEFS_B[_briefKeysB[_bkB]]; break; }
   }
   var _briefOpen = !!S._briefOpen;
   var briefBar = h('div', {
    style: 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--paper-2,#F4F1EA);border:1px solid var(--border,#D8D8D0);border-left:3px solid var(--ink-900,#0A0A09);cursor:pointer;margin-bottom:' + (_briefOpen ? '0' : '16px'),
    onclick: function(e) { e.stopPropagation(); S._briefOpen = !S._briefOpen; window.render(); }
   });
   briefBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--success,#3E5C3A);font-weight:600'}, 'POURQUOI CES MUSCLES\u00a0?'));
   briefBar.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, _briefOpen ? '\u25b2' : '\u25bc'));
   p.appendChild(briefBar);
   if (_briefOpen) {
    var briefContentB = h('div', {style: 'background:var(--paper-2,#F4F1EA);border:1px solid var(--border,#D8D8D0);border-top:none;border-left:3px solid var(--ink-900,#0A0A09);padding:14px 16px;margin-bottom:16px;'});
    briefContentB.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;margin-bottom:8px;color:var(--black,#1A1A18)'}, day.focus || ''));
    if (_matchedBriefB) {
     briefContentB.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:8px'}, _matchedBriefB.why));
     briefContentB.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey,#6B6B65)'}, _matchedBriefB.tip));
    } else {
     briefContentB.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Today you work on ' : 'Aujourd\'hui tu travailles ') + day.focus));
     briefContentB.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey,#6B6B65)'}, (window.isEnglish && window.isEnglish() ? 'Every rep counts — focus on technique, not weight' : 'Chaque rep compte — concentre-toi sur la technique, pas sur le poids')));
    }
    p.appendChild(briefContentB);
   }
  })();
 }

 // ─── EXERCICES BONUS (depuis programmes dédiés) ───
 var bonusDayList = (S.bonusExercises || {})[S.selectedSportDay] || [];
 if (bonusDayList.length > 0) {
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin:16px 0 8px'}, (window.isEnglish && window.isEnglish() ? 'Bonus exercises' : 'Exercices bonus')));
 bonusDayList.forEach(function(bex, bi) {
 var bc = h('div', {'class': 'exercise-card', style: 'border-left:3px solid var(--ink-900,#0A0A09)'});
 var bnRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center'});
 bnRow.appendChild(h('div', {'class': 'exercise-muscle'}, bex.m));
 bnRow.appendChild(h('span', {style: 'font-size:18px;color:var(--error,#7A1F1F);cursor:pointer;line-height:1;padding:0 4px', onclick: (function(idx) { return function(e) { e.stopPropagation(); if (!S.bonusExercises) S.bonusExercises = {}; var arr = S.bonusExercises[S.selectedSportDay] || []; arr.splice(idx, 1); S.bonusExercises[S.selectedSportDay] = arr; window.render(); }; })(bi)}, '\u00d7'));
 bc.appendChild(bnRow);
 bc.appendChild(h('div', {'class': 'exercise-name'}, bex.n || (window.isEnglish && window.isEnglish() ? 'Exercise' : 'Exercice')));
 bc.appendChild(h('div', {'class': 'exercise-sets'}, bex.sets + ' \u2014 ' + (window.isEnglish && window.isEnglish() ? 'Rest ' : 'Repos ') + bex.rest));
 if (bex.eq) bc.appendChild(h('div', {'class': 'exercise-detail'}, bex.eq));
 var _bexParts = String(bex.sets || '').split('\u00d7');
 var _bexReps = _bexParts.length > 1 ? _bexParts[1] : null;
 var bsugg = window.getMusculationWeight ? window.getMusculationWeight(bex.n, bex.sets, _bexReps) : null;
 if (bsugg && bsugg > 0) bc.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);margin-top:6px;padding:4px 8px;background:rgba(62,92,58,0.06);border-left:2px solid var(--success,#3E5C3A)'}, (window.isEnglish && window.isEnglish() ? 'Suggested weight\u00a0: ' : 'Charge sugg\u00e9r\u00e9e\u00a0: ') + (window.UNITS ? window.UNITS.displayWeight(bsugg) : bsugg + '\u00a0kg')));
 p.appendChild(bc);
 });
 }

 // Day summary
 var allEx = (day.exercises || []).concat(bonusDayList);
 var estDuration = calcSessionDuration(allEx);
 var summary = h('div', {'class': 'day-total'});
 summary.appendChild(h('div', {'class': 'dt-label'}, allEx.length + ' ' + window.locPlural(allEx.length, {fr:{one:'exercice',other:'exercices'},en:{one:'exercise',other:'exercises'}}) + (bonusDayList.length > 0 ? ((window.isEnglish && window.isEnglish() ? ' (incl. ' : ' (dont ') + bonusDayList.length + ' bonus)') : '')));
 summary.appendChild(h('div', {'class': 'dt-val'}, '~' + estDuration + ' min'));
 p.appendChild(summary);

 // ─── CÉLÉBRATION FIN DE SÉANCE (Hermès : stats + PR detection) ───
 (function() {
  var _celToday = new Date().toISOString().slice(0, 10);
  var _celLog = (S.muscuSessionLog && S.muscuSessionLog[_celToday]) ? S.muscuSessionLog[_celToday] : {};
  var _dayExNames = (day.exercises || []).map(function(e) { return e.n; });
  if (_dayExNames.length === 0) return;
  var _allDone = _dayExNames.every(function(exName) {
   var sets = _celLog[exName];
   return Array.isArray(sets) && sets.length > 0 && sets.every(function(s) { return s.validated === true; });
  });
  if (!_allDone) return;
  var _totalSets = 0, _totalVolume = 0, _hasVolume = false;
  _dayExNames.forEach(function(exName) {
   var sets = _celLog[exName] || [];
   sets.forEach(function(s) {
    if (s.validated) {
     _totalSets++;
     if (s.actualWeight && s.actualReps) { _totalVolume += s.actualWeight * s.actualReps; _hasVolume = true; }
    }
   });
  });

  // FIX UX 2026-04-17 : détection PR — compare best volume/charge par exercice aux sessions passées.
  var _prList = [];
  try {
   _dayExNames.forEach(function(exName) {
    var todaySets = (_celLog[exName] || []).filter(function(s){ return s.validated; });
    if (todaySets.length === 0) return;
    var todayMax = todaySets.reduce(function(m, s){
     var w = s.actualWeight || 0;
     return w > m ? w : m;
    }, 0);
    if (todayMax <= 0) return;
    var histMax = 0;
    if (S.muscuSessionLog && typeof S.muscuSessionLog === 'object') {
     Object.keys(S.muscuSessionLog).forEach(function(dateKey){
      if (dateKey === _celToday) return;
      var pastSets = (S.muscuSessionLog[dateKey] && S.muscuSessionLog[dateKey][exName]) || [];
      pastSets.forEach(function(ps){
       if (ps.validated && ps.actualWeight && ps.actualWeight > histMax) histMax = ps.actualWeight;
      });
     });
    }
    if (todayMax > 0 && (todayMax > histMax || histMax === 0)) {
     // histMax === 0 → premier record jamais enregistré → toujours afficher
     _prList.push({name: exName, weight: todayMax, prev: histMax > 0 ? histMax : null});
    }
   });
  } catch(_ePr) { console.warn('[PR detection]', _ePr); }

  var _celCard = document.createElement('div');
  _celCard.style.cssText = 'border:1px solid var(--line,#D8D8D0);background:rgba(62,92,58,0.04);padding:24px 20px 20px;margin-top:16px;border-left:3px solid var(--ink-900,#0A0A09);';

  // Filet + label Hermès
  var _celLabel = document.createElement('div');
  _celLabel.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:14px;';
  var _l1 = document.createElement('span'); _l1.style.cssText = 'flex:1;max-width:56px;height:1px;background:var(--ink-900,#0A0A09);'; _celLabel.appendChild(_l1);
  var _lt = document.createElement('span'); _lt.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--success,#3E5C3A);font-weight:400;'; _lt.textContent = (window.isEnglish && window.isEnglish() ? 'Session done' : 'S\u00e9ance termin\u00e9e'); _celLabel.appendChild(_lt);
  var _l2 = document.createElement('span'); _l2.style.cssText = 'flex:1;max-width:56px;height:1px;background:var(--ink-900,#0A0A09);'; _celLabel.appendChild(_l2);
  _celCard.appendChild(_celLabel);

  var _celTitle = document.createElement('div');
  _celTitle.style.cssText = 'font-family:Georgia,serif;font-size:18px;font-style:italic;color:#0A0A09;margin-bottom:14px;text-align:center;';
  _celTitle.textContent = (window.isEnglish && window.isEnglish() ? 'Excellent work.' : 'Excellent travail.');
  _celCard.appendChild(_celTitle);

  // Stats grid : séries · volume · durée
  var _statsRow = document.createElement('div');
  _statsRow.style.cssText = 'display:flex;justify-content:space-around;gap:8px;margin-bottom:12px;padding:14px 0;border-top:1px solid rgba(26,74,26,0.15);border-bottom:1px solid rgba(26,74,26,0.15);';
  function _mkStat(val, lbl) {
   var w = document.createElement('div');
   w.style.cssText = 'flex:1;text-align:center;min-width:0;';
   var v = document.createElement('div');
   v.style.cssText = 'font-family:Georgia,serif;font-size:20px;font-weight:normal;color:#0A0A09;line-height:1;margin-bottom:6px;';
   v.textContent = val;
   w.appendChild(v);
   var l = document.createElement('div');
   l.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6B6B65;';
   l.textContent = lbl;
   w.appendChild(l);
   return w;
  }
  _statsRow.appendChild(_mkStat(String(_totalSets), (window.isEnglish && window.isEnglish() ? 'Sets' : 'S\u00e9ries')));
  if (_hasVolume) {
   var _vDisplay = window.UNITS ? window.UNITS.displayWeight(Math.round(_totalVolume)) : Math.round(_totalVolume) + '\u00a0kg';
   _statsRow.appendChild(_mkStat(_vDisplay, 'Volume'));
  }
  _statsRow.appendChild(_mkStat('~' + estDuration + '\u00a0min', (window.isEnglish && window.isEnglish() ? 'Duration' : 'Dur\u00e9e')));
  _celCard.appendChild(_statsRow);

  // PR banner (si records battus)
  if (_prList.length > 0) {
   var _prBanner = document.createElement('div');
   _prBanner.style.cssText = 'margin-top:8px;padding:10px 12px;background:rgba(62,92,58,0.06);border-left:2px solid var(--success,#3E5C3A);';
   var _prLbl = document.createElement('div');
   _prLbl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--success,#3E5C3A);font-weight:600;margin-bottom:4px;';
   _prLbl.textContent = window.locPlural(_prList.length, {fr:{one:'Record battu',other:'Records battus'},en:{one:'PR broken',other:'PRs broken'}});
   _prBanner.appendChild(_prLbl);
   _prList.slice(0, 3).forEach(function(pr){
    var _prLine = document.createElement('div');
    _prLine.style.cssText = 'font-family:Georgia,serif;font-size:12px;color:#0A0A09;line-height:1.5;';
    var _prW = window.UNITS ? window.UNITS.displayWeight(pr.weight) : (pr.weight + '\u00a0kg');
    var _prMsg = pr.prev === null
      ? (pr.name + ' \u2014 ' + _prW + ' \u2605 ' + (window.isEnglish && window.isEnglish() ? '1st record!' : '1er record !'))
      : (pr.name + ' \u2014 ' + _prW + ' (' + (window.isEnglish && window.isEnglish() ? 'prev\u00a0: ' : 'ancien\u00a0: ') + (window.UNITS ? window.UNITS.displayWeight(pr.prev) : (pr.prev + '\u00a0kg')) + ')');
    _prLine.textContent = _prMsg;
    _prBanner.appendChild(_prLine);
   });
   if (_prList.length > 3) {
    var _prMore = document.createElement('div');
    _prMore.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6B6B65;margin-top:4px;';
    _prMore.textContent = '+ ' + (_prList.length - 3) + ' ' + window.locPlural(_prList.length - 3, {fr:{one:'autre',other:'autres'},en:{one:'more',other:'more'}});
    _prBanner.appendChild(_prMore);
   }
   _celCard.appendChild(_prBanner);
  }

  p.appendChild(_celCard);
 })();

 // ─── SÉANCE TERMINÉE + BILAN CALORIQUE ───
 var todayKey = S.selectedSportDay + '_' + ((window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10));
 var doneSess = S.sessionHistory && S.sessionHistory[todayKey];
 if (doneSess) {
 var doneBadge = h('div', {style: 'border:1px solid var(--line,#D8D8D0);background:rgba(62,92,58,0.06);padding:12px 16px;margin-top:8px'});
 doneBadge.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;font-weight:bold;color:var(--success,#3E5C3A)'}, (window.isEnglish && window.isEnglish() ? '\u2714 Goal achieved \u2014 Session validated' : '\u2714 Objectif accompli \u2014 S\u00e9ance valid\u00e9e')));
 doneBadge.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--success,#3E5C3A);margin-top:4px'}, doneSess.duration + '\u00a0min \u2014 ' + doneSess.kcalTotal + (window.isEnglish && window.isEnglish() ? '\u00a0kcal burned (incl. +' + doneSess.kcalEpoc + '\u00a0kcal EPOC)' : '\u00a0kcal brul\u00e9es (dont +' + doneSess.kcalEpoc + '\u00a0kcal EPOC)')));
 (function() {
   var _prog = Array.isArray(S.sportProgram) ? S.sportProgram : [];
   if (_prog.length > 1) {
     var _nxi = (S.selectedSportDay + 1) % _prog.length;
     var _nxd = _prog[_nxi];
     var _nxFocus = (_nxd && (_nxd.session_focus || _nxd.name)) || null;
     if (_nxFocus) {
       var _nxEl = h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.07);letter-spacing:0.3px;'});
       _nxEl.textContent = (window.isEnglish && window.isEnglish() ? 'Next \u00b7 ' : 'Prochaine \u00b7 ') + _nxFocus;
       doneBadge.appendChild(_nxEl);
     }
   }
 })();
 doneBadge.appendChild(h('button', {style: 'margin-top:8px;font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);background:none;border:none;cursor:pointer;padding:0', onclick: function() {
   // 2026-04 NIVEAU 1 : confirmation avant d'annuler une séance validée (1 clic accidentel = journée perdue)
   var _cancelMsg = (window.isEnglish && window.isEnglish())
     ? ("Cancel today's validated workout?\nYou will lose the " + (doneSess.kcalTotal || 0) + ' kcal logged.')
     : 'Annuler la séance validée de ce jour ?\nVous perdrez les ' + (doneSess.kcalTotal || 0) + ' kcal enregistrées.';
   if (!(window.sfcConfirm ? window.sfcConfirm(_cancelMsg) : window.confirm(_cancelMsg))) return;
   delete S.sessionHistory[todayKey]; window.render();
 }}, (window.isEnglish && window.isEnglish() ? 'Cancel' : 'Annuler')));
 p.appendChild(doneBadge);
 } else if (S.sessionCompleting === S.selectedSportDay) {
 var realDur = S._sessionDuration != null ? S._sessionDuration : estDuration;
 var kcalRes = calcSessionKcal(allEx, realDur);
 var compPanel = h('div', {style: 'border:1px solid var(--border);background:var(--ivory2);padding:16px;margin-top:8px'});
 compPanel.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:12px'}, window.t('muscu.session_summary')));

 // ── PER-EXERCISE RECAP ──
 var _recapToday = new Date().toISOString().slice(0, 10);
 var _recapLog = S.muscuSessionLog[_recapToday] || {};
 var _recapExNames = Object.keys(_recapLog);
 if (_recapExNames.length > 0) {
 var recapBox = h('div', {style: 'margin-bottom:14px;border:1px solid var(--border);background:var(--ivory)'});
 recapBox.appendChild(h('div', {style: 'padding:6px 10px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);border-bottom:1px solid var(--border);font-weight:700'}, (window.isEnglish && window.isEnglish() ? 'Exercise recap' : 'R\u00e9cap. des exercices')));
 _recapExNames.forEach(function(exName) {
 var _sets = _recapLog[exName] || [];
 var _validSets = _sets.filter(function(s) { return s.validated === true; });
 if (_validSets.length === 0) return;
 var _row = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid var(--border)'});
 _row.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'}, exName));
 var _summary = _validSets.length + ' ' + (window.isEnglish && window.isEnglish() ? 'sets' : 's\u00e9ries');
 var _firstValid = _validSets[0];
 if (_firstValid.actualWeight && _firstValid.actualWeight > 0) {
 _summary += ' \u2014 ' + (window.UNITS ? window.UNITS.displayWeight(_firstValid.actualWeight) : _firstValid.actualWeight + ' kg');
 }
 _row.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-left:8px;white-space:nowrap'}, _summary));
 _row.appendChild(h('span', {style: 'color:var(--success,#3E5C3A);font-size:14px;margin-left:6px'}, '\u2713'));
 recapBox.appendChild(_row);
 });
 compPanel.appendChild(recapBox);
 }

 // Durée
 var durRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin-bottom:14px'});
 durRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);flex:1'}, (window.isEnglish && window.isEnglish() ? 'Actual duration' : 'Dur\u00e9e r\u00e9elle')));
 var durInp = h('input', {type: 'number', min: '10', max: '180', inputmode: 'numeric', value: String(realDur), style: 'width:60px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory)', onclick: function(e) { e.stopPropagation(); }, onchange: function(e) { var v = parseInt(e.target.value); if (!isNaN(v) && v > 0) { S._sessionDuration = v; window.render(); } }});
 durRow.appendChild(durInp);
 durRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'min'));
 compPanel.appendChild(durRow);
 // Résultat calories
 var kcalBox = h('div', {style: 'background:var(--ivory);border:1px solid var(--border);padding:12px 16px;margin-bottom:14px'});
 var kr1 = h('div', {style: 'display:flex;justify-content:space-between;margin-bottom:6px'});
 kr1.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Session expenditure' : 'D\u00e9pense s\u00e9ance')));
 kr1.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:16px;font-weight:bold'}, kcalRes.base + '\u00a0kcal'));
 kcalBox.appendChild(kr1);
 var kr2 = h('div', {style: 'display:flex;justify-content:space-between;margin-bottom:6px'});
 kr2.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'EPOC +24h (Schuenke\u00a02002)'));
 kr2.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--orange,#E86F1E)'}, '+' + kcalRes.epoc + '\u00a0kcal'));
 kcalBox.appendChild(kr2);
 var kr3 = h('div', {style: 'display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px'});
 kr3.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? 'Estimated total' : 'Total estim\u00e9')));
 kr3.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:17px;font-weight:bold;color:var(--green,#3E5C3A)'}, kcalRes.total + '\u00a0kcal'));
 kcalBox.appendChild(kr3);
 kcalBox.appendChild((function(){ var _d = h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin-top:6px;font-style:italic'}); _d.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? 'Est. HR\u00a0' + kcalRes.hr + '\u00a0bpm \u2014 ' : 'FC estim\u00e9e\u00a0' + kcalRes.hr + '\u00a0bpm \u2014 '))); _d.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _d.appendChild(document.createTextNode('\u00a0' + kcalRes.rpe + '/10 \u2014 MET\u00a0Ainsworth\u00a02011 \u00b7 Tanaka\u00a02001')); return _d; })());
 compPanel.appendChild(kcalBox);
 // Note TDEE — évite le double-comptage (audit interdépendance)
 compPanel.appendChild(h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:8px 12px;margin-bottom:14px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--text,#0A0A09);line-height:1.5'}, (window.isEnglish && window.isEnglish() ? '\u26a0 These calories are already included in your TDEE via your activity factor. This summary confirms your actual expenditure — do not subtract them on top of your daily calorie goal.' : '\u26a0 Ces calories sont d\u00e9j\u00e0 int\u00e9gr\u00e9es dans votre TDEE via votre facteur d\'activit\u00e9. Ce bilan confirme votre d\u00e9pense r\u00e9elle — ne les d\u00e9duisez pas en plus de votre objectif calorique journalier.')));
 // Contexte nutritionnel : montre l'impact de la session sur le budget calorique
 var nc = getNutritionContext();
 // XSS fix: build nutrition context panel via DOM — values are numeric but use textContent for safety
 if (nc && nc.caloriesTarget > 0 && kcalRes && kcalRes.total > 0) {
 var pct = Math.round((kcalRes.total / nc.caloriesTarget) * 100);
 var warningColor = pct > 40 ? 'var(--error,#7A1F1F)' : pct > 25 ? 'var(--orange,#E86F1E)' : 'var(--green,#3E5C3A)';
 var warningMsg = pct > 40
 ? (window.isEnglish && window.isEnglish() ? '\u26a0\ufe0f Very intense session \u2014 consider adjusting your post-workout nutrition' : '\u26a0\ufe0f Session tr\u00e8s intense \u2014 pensez \u00e0 ajuster votre alimentation post-entra\u00eenement')
 : pct > 25
 ? (window.isEnglish && window.isEnglish() ? '\uD83D\uDD36 Moderate session \u2014 pre/post nutrition recommended' : '\uD83D\uDD36 Session mod\u00e9r\u00e9e \u2014 nutrition pr\u00e9/post recommand\u00e9e')
 : (window.isEnglish && window.isEnglish() ? '\u2705 Balanced session for your goal' : '\u2705 Session \u00e9quilibr\u00e9e pour votre objectif');
 var _ncWrap = document.createElement('div');
 _ncWrap.style.cssText = 'margin-top:12px;padding:10px 14px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);font-size:13px';
 var _ncTitle = document.createElement('div');
 _ncTitle.style.cssText = 'font-weight:600;margin-bottom:6px;color:var(--text)';
 _ncTitle.textContent = '\uD83C\uDF7D\ufe0f Impact nutritionnel';
 _ncWrap.appendChild(_ncTitle);
 function _ncRow(label, value, valueStyle) {
   var row = document.createElement('div');
   row.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:4px';
   var lbl = document.createElement('span');
   lbl.textContent = label;
   var val = document.createElement('span');
   val.style.fontWeight = '600';
   if (valueStyle) val.style.color = valueStyle;
   val.textContent = value;
   row.appendChild(lbl);
   row.appendChild(val);
   return row;
 }
 _ncWrap.appendChild(_ncRow('Cible calorique du jour', nc.caloriesTarget + ' kcal', null));
 _ncWrap.appendChild(_ncRow((window.isEnglish && window.isEnglish() ? 'Calories burned in session' : 'Calories br\u00fcl\u00e9es en session'), '\u2212' + kcalRes.total + ' kcal (' + pct + '%)', warningColor));
 var _ncProRow = document.createElement('div');
 _ncProRow.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:8px';
 var _ncProLbl = document.createElement('span');
 _ncProLbl.textContent = (window.isEnglish && window.isEnglish() ? 'Protein target' : 'Cible prot\u00e9ines');
 var _ncProVal = document.createElement('span');
 _ncProVal.style.fontWeight = '600';
 _ncProVal.textContent = nc.proteinGrams + ' g';
 _ncProRow.appendChild(_ncProLbl);
 _ncProRow.appendChild(_ncProVal);
 _ncWrap.appendChild(_ncProRow);
 var _ncMsg = document.createElement('div');
 _ncMsg.style.cssText = 'font-size:13px;color:' + warningColor;
 _ncMsg.textContent = warningMsg;
 _ncWrap.appendChild(_ncMsg);
 compPanel.appendChild(_ncWrap);
 }
 // ─── COACH ADAPTATIF 2026-04 (phase A-3) : feedback séance (RPE, ressenti, douleur) ───
 // Données piloteront la semaine suivante (ajustements ISSN/ACSM automatiques côté IA).
 // État stocké temporairement dans S._sessionFeedbackDraft jusqu'à validation.
 if (!S._sessionFeedbackDraft) S._sessionFeedbackDraft = { rpe: null, feeling: null, pain: null };
 var fbDraft = S._sessionFeedbackDraft;

 var fbPanel = h('div', {style: 'border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);padding:14px;margin-bottom:14px'});
 fbPanel.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);font-weight:700;margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'How do you feel? (optional)' : 'Comment tu te sens ? (optionnel)')));

 // RPE 1-10 (slider)
 var rpeRow = h('div', {style: 'margin-bottom:14px'});
 var rpeLabel = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'});
 rpeLabel.appendChild((function(){ var _s = h('span', {style: 'font-family:Georgia,serif;font-size:13px'}); _s.appendChild(document.createTextNode((window.isEnglish && window.isEnglish() ? 'Perceived effort (' : 'Effort ressenti ('))); _s.appendChild(termTooltip('RPE', 'Rate of Perceived Exertion — effort perçu sur 10 (7/10 = effort modéré, grosses dernières reps)')); _s.appendChild(document.createTextNode(')')); return _s; })());
 var rpeValSpan = h('span', {style: 'font-family:Georgia,serif;font-size:15px;font-weight:bold;color:var(--black,#0A0A09);min-width:42px;text-align:right'},
   fbDraft.rpe ? (fbDraft.rpe + '/10') : '—');
 rpeLabel.appendChild(rpeValSpan);
 rpeRow.appendChild(rpeLabel);
 var rpeSlider = h('input', {
   type: 'range', min: '1', max: '10', step: '1',
   value: String(fbDraft.rpe || 5),
   style: 'width:100%;accent-color:var(--black,#0A0A09);cursor:pointer',
   oninput: function(e) {
     var v = parseInt(e.target.value);
     if (!isNaN(v)) {
       S._sessionFeedbackDraft.rpe = v;
       rpeValSpan.textContent = v + '/10';
     }
   },
   onclick: function(e) { e.stopPropagation(); }
 });
 rpeRow.appendChild(rpeSlider);
 var rpeHelp = h('div', {style: 'display:flex;justify-content:space-between;font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey,#6B6B65);margin-top:4px'});
 rpeHelp.appendChild(h('span', {}, (window.isEnglish && window.isEnglish() ? '1 · very easy' : '1 · très facile')));
 rpeHelp.appendChild(h('span', {}, '10 · max effort'));
 rpeRow.appendChild(rpeHelp);
 fbPanel.appendChild(rpeRow);

 // Ressenti — 3 chips
 var feelingRow = h('div', {style: 'display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap'});
 feelingRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey,#6B6B65);width:100%;margin-bottom:2px'}, (window.isEnglish && window.isEnglish() ? 'Overall feeling' : 'Ressenti général')));
 var feelings = [
   { key: 'fatigue', label: (window.isEnglish && window.isEnglish() ? 'Tired' : 'Fatigué') },
   { key: 'normal', label: (window.isEnglish && window.isEnglish() ? 'Normal' : 'Normal') },
   { key: 'forme', label: (window.isEnglish && window.isEnglish() ? 'Great' : 'En forme') }
 ];
 feelings.forEach(function(f) {
   var active = fbDraft.feeling === f.key;
   var chip = h('button', {
     style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;padding:8px 12px;border:1px solid ' +
            (active ? 'var(--black,#0A0A09)' : 'var(--border,#D8D8D0)') +
            ';background:' + (active ? 'var(--black,#0A0A09)' : 'transparent') +
            ';color:' + (active ? 'var(--ivory,#FAF9F6)' : 'var(--black,#0A0A09)') +
            ';cursor:pointer;border-radius:2px',
     onclick: function(e) {
       e.stopPropagation();
       S._sessionFeedbackDraft.feeling = (S._sessionFeedbackDraft.feeling === f.key ? null : f.key);
       window.render();
     }
   }, f.label);
   feelingRow.appendChild(chip);
 });
 fbPanel.appendChild(feelingRow);

 // Douleurs (optionnel) — 5 chips + aucun
 var painRow = h('div', {style: 'display:flex;gap:6px;flex-wrap:wrap'});
 painRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey,#6B6B65);width:100%;margin-bottom:2px'}, (window.isEnglish && window.isEnglish() ? 'Reported pain (if any)' : 'Douleur signalée (si nécessaire)')));
 var pains = [
   { key: null, label: (window.isEnglish && window.isEnglish() ? 'None' : 'Aucune') },
   { key: 'dos', label: (window.isEnglish && window.isEnglish() ? 'Back' : 'Dos') },
   { key: 'genou', label: (window.isEnglish && window.isEnglish() ? 'Knee' : 'Genou') },
   { key: 'épaule', label: (window.isEnglish && window.isEnglish() ? 'Shoulder' : 'Épaule') },
   { key: 'poignet', label: (window.isEnglish && window.isEnglish() ? 'Wrist' : 'Poignet') },
   { key: 'cheville', label: (window.isEnglish && window.isEnglish() ? 'Ankle' : 'Cheville') }
 ];
 pains.forEach(function(pn) {
   var active = (fbDraft.pain || null) === pn.key;
   var chip = h('button', {
     style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;padding:6px 10px;border:1px solid ' +
            (active ? (pn.key ? 'var(--error,#7A1F1F)' : 'var(--black,#0A0A09)') : 'var(--border,#D8D8D0)') +
            ';background:' + (active ? (pn.key ? 'var(--error,#7A1F1F)' : 'var(--black,#0A0A09)') : 'transparent') +
            ';color:' + (active ? 'var(--ivory,#FAF9F6)' : 'var(--black,#0A0A09)') +
            ';cursor:pointer;border-radius:2px',
     onclick: function(e) {
       e.stopPropagation();
       S._sessionFeedbackDraft.pain = pn.key;
       window.render();
     }
   }, pn.label);
   painRow.appendChild(chip);
 });
 fbPanel.appendChild(painRow);
 compPanel.appendChild(fbPanel);

 var saveBtn = h('button', {style: 'width:100%;padding:12px;background:var(--black);color:#fff;border:none;font-family:"Helvetica Neue",sans-serif;font-size:13px;cursor:pointer', onclick: function() {
 if (!S.sessionHistory) S.sessionHistory = {};
 if (S.sessionHistory[todayKey]) return;
 // Validate exercise inputs before logging — non-blocking: warns but never drops the session
 if (window.SFCEngine && (allEx || []).length > 0) {
   try {
     var _sfcHistForSan = window.SFCSymbiosis && window.SFCSymbiosis.getSFCSessions ? window.SFCSymbiosis.getSFCSessions() : [];
     var _sanResult = window.SFCEngine.sanitizeSessionInput({
       timestamp: Date.now(),
       exercises: (allEx || []).map(function(ex) { return { name: ex.n || ex.name || '', sets: ex.sets || 3, reps: ex.reps || 8, weight: ex.weight || 0 }; }),
       duration: realDur
     }, _sfcHistForSan);
     if (_sanResult.warnings && _sanResult.warnings.length) {
       console.warn('[SFCEngine] session input warnings:', _sanResult.warnings);
     }
   } catch (_sanErr) {}
 }
 S.sessionHistory[todayKey] = {duration: realDur, kcalBase: kcalRes.base, kcalEpoc: kcalRes.epoc, kcalTotal: kcalRes.total, date: new Date().toISOString()};
 // Pruning : garder les 365 dernières sessions max
 var _shKeys = Object.keys(S.sessionHistory || {}).sort();
 if (_shKeys.length > 365) { _shKeys.slice(0, _shKeys.length - 365).forEach(function(k) { delete S.sessionHistory[k]; }); }
 // COACH ADAPTATIF 2026-04 : enregistrer feedback (RPE + ressenti + pain + charges réelles).
 // Les charges réelles proviennent de muscuSessionLog[today][exName] (sets validés).
 try {
   var _fbToday = new Date().toISOString().slice(0, 10);
   var _logToday = (S.muscuSessionLog && S.muscuSessionLog[_fbToday]) || {};
   var _chargeActual = {};
   var _repsActual = {};
   Object.keys(_logToday).forEach(function(exN) {
     var _sets = _logToday[exN] || [];
     var _vs = _sets.filter(function(s) { return s.validated === true && s.actualWeight && s.actualWeight > 0; });
     if (_vs.length > 0) {
       // On prend la charge max validée
       var _maxW = 0, _maxR = 0;
       _vs.forEach(function(s) {
         if (s.actualWeight > _maxW) _maxW = s.actualWeight;
         if (s.actualReps && s.actualReps > _maxR) _maxR = s.actualReps;
       });
       if (_maxW > 0) _chargeActual[exN] = _maxW;
       if (_maxR > 0) _repsActual[exN] = _maxR;
     }
   });
   if (typeof window.recordSessionFeedback === 'function') {
     window.recordSessionFeedback({
       sessionId: 'muscu-d' + S.selectedSportDay,
       rpe: (S._sessionFeedbackDraft && S._sessionFeedbackDraft.rpe) || null,
       feeling: (S._sessionFeedbackDraft && S._sessionFeedbackDraft.feeling) || null,
       pain: (S._sessionFeedbackDraft && S._sessionFeedbackDraft.pain) || null,
       chargeActual: _chargeActual,
       reps: _repsActual
     });
   }
 } catch(_e) {}
 S._sessionFeedbackDraft = { rpe: null, feeling: null, pain: null };
 // Persister poids/reps dans localStorage avant de fermer le panneau.
 // Les séries validées individuellement (✓) ont déjà appelé saveMuscuSessionLog()
 // mais un appel final garantit que rien n'est perdu (ex : reps saisies sans ✓).
 try { saveMuscuSessionLog(); } catch(_sve) {}
 // Sync session vers Supabase
 if (window.SupaSync) SupaSync.saveSession({
 date: todayKey,
 dayIndex: S.selectedSportDay,
 duration: realDur,
 kcalBase: kcalRes.base,
 kcalEpoc: kcalRes.epoc,
 kcalTotal: kcalRes.total
 });
 // Notify nutrition engine of completed training session (single source of truth)
 if (window.SFCSymbiosis && window.SFCSymbiosis.processCompletedSession) {
   try {
     var _grps = [];
     (allEx || []).forEach(function(ex) { var _g = ex.m || ex.muscle || ''; if (_g && _grps.indexOf(_g) === -1) _grps.push(_g); });
     var _sessLoad = window.SFCSymbiosis.computeTrainingLoad
       ? window.SFCSymbiosis.computeTrainingLoad(allEx || [], _grps)
       : (S.trainingLoad || 'moderate');
     S.sessionHistory[todayKey].trainingLoad = _sessLoad;
     window.SFCSymbiosis.processCompletedSession({
       sessionId: todayKey,
       date: ((window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10)),
       exercises: allEx || [],
       groups: _grps,
       trainingLoad: _sessLoad
     });
   } catch(_pcsErr) {}
 }
 S.sessionCompleting = false; S._sessionDuration = null;
 S._streakCache = null; // Invalider le cache streak après une nouvelle séance
 // FIX: persist S.sessionHistory (and musculationWeights) to localStorage so data survives reload
 if (window.saveProfile) { try { window.saveProfile(); } catch(_spErr) {} }
 // Mise à jour du streak sur action réelle (séance validée)
 if (window.GAMIFICATION) { try { window.GAMIFICATION.updateStreak(); } catch(e) {} }
 window.BLACKBOX && window.BLACKBOX.log('session_done', {day: S.selectedSportDay, kcal: kcalRes.total, duration: realDur});
 if (window.showToast) { var _kcalMsg = kcalRes && kcalRes.total ? ' — ' + Math.round(kcalRes.total) + ' kcal' : ''; window.showToast(((window.isEnglish && window.isEnglish()) ? '\u2713 Session validated' : '\u2713 S\u00e9ance valid\u00e9e') + _kcalMsg, 'success'); }
 if (window.SOCIAL && window.SOCIAL.shareWorkout && window.SOCIAL.getMyProfileCached && window.SOCIAL.getMyProfileCached()) {
   try { window.SOCIAL.shareWorkout({ sport: S.sportType || 'sport', duration: realDur, kcal: Math.round(kcalRes.total || 0) }); } catch(e) {}
 }
 try {
   var _prog2 = S.sportProgram || [];
   var _ni2 = _prog2.length ? (S.selectedSportDay + 1) % _prog2.length : -1;
   var _nd2 = _ni2 >= 0 ? _prog2[_ni2] : null;
   var _nf2 = (_nd2 && _nd2.focus || '').toLowerCase();
   var _nmAfterKcal = Math.round((S._nm && S._nm.kcal) || 0);
   var _nmAfterCarbs = Math.round((S._nm && S._nm.carbsGrams) || 0);
   var _carbDeltaMap2 = { light: 10, moderate: 20, heavy: 40, max: 55 };
   var _carbDeltaLoad2 = _carbDeltaMap2[S.trainingLoad] || 20;
   var _projCompound2 = '', _projTarget2 = 0;
   try {
     var _projMph2 = S.muscuProgressionHistory || {};
     ['Squat','Bench Press','Deadlift','Overhead Press'].forEach(function(c) {
       if (_projCompound2) return;
       var _h2 = _projMph2[c];
       if (!Array.isArray(_h2) || _h2.length < 1) return;
       var _last2 = _h2[_h2.length - 1];
       var _lw2 = (_last2 && _last2.weight) ? _last2.weight : 0;
       if (_lw2 > 0) {
         var _lowerRe2 = /squat|leg|fessier|ischios|mollet|presse|hip.{0,5}thrust|rdl|deadlift|soulev|cuisse|jambe/i;
         _projCompound2 = c; _projTarget2 = _lw2 + (_lowerRe2.test(c) ? 5 : 2.5);
       }
     });
   } catch(_pe2) {}
   S._postSessionPanel = {
     screen: 1,
     totalSessions: Object.keys(S.sessionHistory || {}).length,
     duration: realDur,
     kcalTotal: Math.round(kcalRes.total || 0),
     load: S.trainingLoad || 'moderate',
     focus: (day && day.focus) || '',
     nmKcal: _nmAfterKcal,
     nmCarbs: _nmAfterCarbs,
     nmKcalBefore: Math.max(0, _nmAfterKcal - Math.round(kcalRes.epoc || 0)),
     nmCarbsBefore: Math.max(0, _nmAfterCarbs - _carbDeltaLoad2),
     tomorrowFocus: (_nd2 && _nd2.focus) || '',
     tomorrowIsRest: !_nd2 || !(_nd2.exercises && _nd2.exercises.length) ||
       _nf2.indexOf('repos') !== -1 || _nf2.indexOf('rest') !== -1,
     projCompound: _projCompound2,
     projTarget: Math.round(_projTarget2 * 10) / 10,
     muscuWeek: S.muscuWeek || 1
   };
 } catch(_pErr) {}
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? '\u2713 Validate session' : '\u2713 Valider la s\u00e9ance'));
 compPanel.appendChild(saveBtn);
 compPanel.appendChild(h('div', {style: 'text-align:center;margin-top:8px'}, h('button', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);background:none;border:none;cursor:pointer', onclick: function() { S.sessionCompleting = false; S._sessionDuration = null; window.render(); }}, (window.isEnglish && window.isEnglish() ? 'Cancel' : 'Annuler'))));

 // ─── CONSISTENCY STREAK BANNER ───
 (function() {
   var _cStr = window.getMuscuConsistencyStreak ? window.getMuscuConsistencyStreak() : null;
   if (!_cStr || _cStr.totalSessions === 0) return;
   var _streak = _cStr.streak;
   var _total = _cStr.totalSessions;
   var _ms = _cStr.milestone;
   var streakBanner = document.createElement('div');
   streakBanner.style.cssText = 'margin-top:12px;padding:10px 0;border-top:1px solid var(--border,#D8D8D0);border-bottom:1px solid var(--border,#D8D8D0);background:transparent;';
   var streakRow = document.createElement('div');
   streakRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
   var streakLeft = document.createElement('div');
   var streakLabel = document.createElement('div');
   streakLabel.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:2px;';
   streakLabel.textContent = (window.isEnglish && window.isEnglish() ? 'Consistency' : 'Régularité');
   streakLeft.appendChild(streakLabel);
   var streakVal = document.createElement('div');
   streakVal.style.cssText = 'font-family:Georgia,serif;font-size:14px;color:var(--black,#0A0A09);';
   streakVal.textContent = (_streak > 1 ? (_streak + ' ' + window.locPlural(_streak, {fr:{one:'jour consécutif',other:'jours consécutifs'},en:{one:'day in a row',other:'days in a row'}})) : (_total + ' ' + window.locPlural(_total, {fr:{one:'séance au total',other:'séances au total'},en:{one:'workout total',other:'workouts total'}})));
   streakLeft.appendChild(streakVal);
   streakRow.appendChild(streakLeft);
   var nextMile = _streak < 7 ? (7 - _streak + (window.isEnglish && window.isEnglish() ? ' d → badge' : ' j → badge')) : _streak < 14 ? (14 - _streak + (window.isEnglish && window.isEnglish() ? ' d → advanced exercises' : ' j → exercices avancés')) : '';
   if (nextMile) {
     var streakNext = document.createElement('div');
     streakNext.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--orange-ink,#7A3B0E);text-align:right;';
     streakNext.textContent = nextMile;
     streakRow.appendChild(streakNext);
   }
   streakBanner.appendChild(streakRow);
   if (_ms) {
     var msDiv = document.createElement('div');
     msDiv.style.cssText = 'margin-top:6px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:400;color:#C8A84B;';
     msDiv.textContent = _ms.msg;
     streakBanner.appendChild(msDiv);
   }
   compPanel.appendChild(streakBanner);
 })();

 // ─── WORKOUT CARD SHAREABLE ───
 (function() {
   var _wToday = new Date().toISOString().slice(0, 10);
   var _wLog = S.muscuSessionLog && S.muscuSessionLog[_wToday] ? S.muscuSessionLog[_wToday] : {};
   var _wExNames = Object.keys(_wLog);
   if (_wExNames.length === 0) return;
   // Compute total volume
   var _totalVol = 0, _totalSets = 0;
   _wExNames.forEach(function(ex) {
     var sets = _wLog[ex] || [];
     sets.forEach(function(s) {
       if (s.validated) {
         _totalVol += (s.actualWeight || 0) * (s.actualReps || 0);
         _totalSets++;
       }
     });
   });
   // PR list (already computed above in _prList, but compute locally for card scope)
   var _cPrList = [];
   _wExNames.forEach(function(exName) {
     var todaySets = (_wLog[exName] || []).filter(function(s){ return s.validated; });
     var todayMax = todaySets.reduce(function(m, s){ return Math.max(m, s.actualWeight || 0); }, 0);
     var hist = (S.muscuProgressionHistory && S.muscuProgressionHistory[exName]) || [];
     var prevHist = hist.filter(function(e){ return e.date < _wToday; });
     var histMax = prevHist.reduce(function(m, e){ return Math.max(m, e.weight || 0); }, 0);
     if (todayMax > 0 && (todayMax > histMax || histMax === 0)) _cPrList.push({ name: exName, weight: todayMax });
   });

   var cardShareWrap = h('div', { style: 'margin-top:16px;' });
   var cardShareToggle = h('button', {
     style: 'width:100%;padding:8px 12px;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:left;',
     onclick: function() {
       S._shareCardOpen = !S._shareCardOpen;
       window.render();
     }
   }, S._shareCardOpen ? (window.isEnglish && window.isEnglish() ? 'Hide card' : 'Masquer la carte') : (window.isEnglish && window.isEnglish() ? 'Generate my session card' : 'Générer ma carte de séance'));
   cardShareWrap.appendChild(cardShareToggle);

   var cardEl = document.createElement('div');
   cardEl.style.cssText = (S._shareCardOpen ? 'display:block;' : 'display:none;') + 'margin-top:8px;';

   var card = document.createElement('div');
   card.id = 'sfc-share-card-inner';
   card.style.cssText = 'background:#0A0A09;color:#FAF9F6;padding:24px 20px;font-family:"Helvetica Neue",Arial,sans-serif;position:relative;overflow:hidden;border-radius:0;';

   var cHeader = document.createElement('div');
   cHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;';
   var cLogo = document.createElement('div');
   cLogo.style.cssText = 'font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(250,249,246,0.5);';
   cLogo.textContent = 'SmartFitCoach';
   var cDate = document.createElement('div');
   cDate.style.cssText = 'font-size:9px;letter-spacing:1px;color:rgba(250,249,246,0.5);';
   cDate.textContent = window.formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' });
   cHeader.appendChild(cLogo);
   cHeader.appendChild(cDate);
   card.appendChild(cHeader);

   var cTitle = document.createElement('div');
   cTitle.style.cssText = 'font-family:Georgia,serif;font-size:22px;font-style:italic;margin-bottom:4px;';
   cTitle.textContent = (window.isEnglish && window.isEnglish()) ? 'Session complete' : 'Séance terminée';
   card.appendChild(cTitle);

   var cPhase = document.createElement('div');
   cPhase.style.cssText = 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(250,249,246,0.5);margin-bottom:20px;';
   var _cMP = window.getMacroCyclePhase ? window.getMacroCyclePhase(S.muscuCycle || 1) : null;
   cPhase.textContent = (_cMP ? _cMP.label + ' · ' : '') + ((window.isEnglish && window.isEnglish()) ? 'Week ' : 'Semaine ') + (S.muscuWeek || 1);
   card.appendChild(cPhase);

   var cStats = document.createElement('div');
   cStats.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;';
   function _cStatBox(label, val) {
     var b = document.createElement('div');
     b.style.cssText = 'text-align:center;border:1px solid rgba(250,249,246,0.12);padding:10px 6px;';
     var v = document.createElement('div');
     v.style.cssText = 'font-family:Georgia,serif;font-size:18px;font-weight:bold;';
     v.textContent = val;
     var l = document.createElement('div');
     l.style.cssText = 'font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(250,249,246,0.5);margin-top:4px;';
     l.textContent = label;
     b.appendChild(v);
     b.appendChild(l);
     return b;
   }
   var _cIsEN = window.isEnglish && window.isEnglish();
   cStats.appendChild(_cStatBox(_cIsEN ? 'Exercises' : 'Exercices', _wExNames.length));
   cStats.appendChild(_cStatBox(_cIsEN ? 'Sets' : 'Séries', _totalSets));
   cStats.appendChild(_cStatBox('Volume', _totalVol > 0 ? (Math.round(_totalVol / 100) / 10 + ' T') : '—'));
   card.appendChild(cStats);

   if (_cPrList.length > 0) {
     var cPr = document.createElement('div');
     cPr.style.cssText = 'border-top:1px solid rgba(250,249,246,0.15);padding-top:12px;margin-bottom:16px;';
     var cPrLbl = document.createElement('div');
     cPrLbl.style.cssText = 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(200,168,75,0.85);margin-bottom:8px;';
     cPrLbl.textContent = _cIsEN ? 'New records' : 'Records battus';
     cPr.appendChild(cPrLbl);
     _cPrList.slice(0, 3).forEach(function(pr) {
       var prLine = document.createElement('div');
       prLine.style.cssText = 'font-family:Georgia,serif;font-size:12px;color:#FAF9F6;line-height:1.8;';
       var wDisp = window.UNITS ? window.UNITS.displayWeight(pr.weight) : pr.weight + ' kg';
       prLine.textContent = pr.name + ' — ' + wDisp;
       cPr.appendChild(prLine);
     });
     card.appendChild(cPr);
   }

   var cFooter = document.createElement('div');
   cFooter.style.cssText = 'font-size:9px;letter-spacing:2px;color:rgba(250,249,246,0.3);text-align:center;border-top:1px solid rgba(250,249,246,0.1);padding-top:10px;';
   cFooter.textContent = 'smartfitcoach.app';
   card.appendChild(cFooter);

   cardEl.appendChild(card);
   var hint = document.createElement('div');
   hint.style.cssText = 'margin-top:6px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);text-align:center;font-style:italic;';
   hint.textContent = (window.isEnglish && window.isEnglish() ? 'Take a screenshot to share.' : 'Faites une capture d\'écran pour partager.');
   cardEl.appendChild(hint);
   cardShareWrap.appendChild(cardEl);
   compPanel.appendChild(cardShareWrap);
 })();

 p.appendChild(compPanel);
 } else {
 p.appendChild(h('button', {'class': 'regen-btn', style: 'margin-top:8px;background:var(--black);color:#fff', onclick: function() { S.sessionCompleting = S.selectedSportDay; S._sessionDuration = null; window.render(); }}, (window.isEnglish && window.isEnglish()) ? '\u2713 Session complete' : '\u2713 S\u00e9ance termin\u00e9e'));
 }
 }

 // ─── PROGRAMMES DÉDIÉS ───
 var dedicatedMap = {
 'Fessiers': ['fessiers_dedied'],
 'Abdominaux': ['abdos_dedied'],
 'Bras': ['biceps_dedied', 'triceps_dedied']
 };
 var selectedZonesForDedicated = Object.keys(S.sportFocus || {}).filter(function(z){ return S.sportFocus[z] > 0; });
 var dedicatedToShow = [];
 selectedZonesForDedicated.forEach(function(zone) {
 if (dedicatedMap[zone]) {
 dedicatedMap[zone].forEach(function(key) {
 if (dedicatedToShow.indexOf(key) === -1) dedicatedToShow.push(key);
 });
 }
 });

 if (dedicatedToShow.length > 0 && window.SFC_PROGRAMS) {
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:28px'}, (window.isEnglish && window.isEnglish() ? 'Targeted programs' : 'Programmes ciblés')));
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'Bonus sessions to integrate based on your priorities.' : 'Séances bonus à intégrer selon vos priorités.')));

 dedicatedToShow.forEach(function(key) {
 var prog = window.SFC_PROGRAMS[key];
 if (!prog) return;

 var isOpen = S['dedicatedOpen_' + key] || false;
 var card = h('div', {style: 'border:1px solid var(--border);margin-bottom:8px;background:var(--ivory2)'});

 // Header toggle
 var header = h('div', {
 style: 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer',
 onclick: function() {
 S['dedicatedOpen_' + key] = !S['dedicatedOpen_' + key];
 window.render();
 }
 });
 header.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px'}, prog.name));
 header.appendChild(h('span', {style: 'font-size:18px;color:var(--grey)'}, isOpen ? '▲' : '▼'));
 card.appendChild(header);

 if (isOpen) {
 var phase4 = getMuscuPhase(sfcGetEffectiveWeek());
 var varIdx4 = S['dedicatedVar_' + key] || 0;
 // Dedicated programs use variations (not exercises directly)
 var exList = (prog.variations && prog.variations[varIdx4]) ? prog.variations[varIdx4].exercises : (prog.exercises || []);
 // Variation tabs if applicable
 if (prog.variations && prog.variations.length > 1) {
 var tabs4 = h('div', {style: 'display:flex;border-top:1px solid var(--border)'});
 prog.variations.forEach(function(v, idx) {
 var isA = varIdx4 === idx;
 var t = h('div', {
 style: 'flex:1;padding:8px;text-align:center;cursor:pointer;font-family:"Helvetica Neue",sans-serif;font-size:11px;border-right:1px solid var(--border);' + (isA ? 'background:var(--black);color:#fff' : 'background:var(--ivory);color:var(--grey)'),
 onclick: (function(i){ return function(e){ e.stopPropagation(); S['dedicatedVar_' + key] = i; window.render(); }; })(idx)
 }, v.label);
 tabs4.appendChild(t);
 });
 card.appendChild(tabs4);
 }
 exList.forEach(function(exBase) {
 var ex = applyPhaseToExercise(exBase, phase4);
 var row = h('div', {style: 'padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start'});
 var left = h('div', {});
 left.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px'}, ex.order + '. ' + ex.name));
 left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, ex.muscle + ' \u2014 ' + ex.equipment));
 if (ex.technique) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--orange);margin-top:2px'}, ex.technique));
 var sugW4 = getSuggestedWeight(ex.name, ex.reps, phase4);
 if (sugW4 && sugW4 > 0) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);margin-top:2px'}, '\u2192 ~' + (window.UNITS ? window.UNITS.displayWeight(sugW4) : sugW4 + ' kg')));
 row.appendChild(left);
 var right = h('div', {style: 'text-align:right;flex-shrink:0;margin-left:12px'});
 right.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-weight:normal'}, ex.sets + '\u00d7' + ex.reps));
 right.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, ex.rest));
 // Bouton + / Ajouté — ajoute l'exercice en bonus à la séance courante
 var bonusArr = (S.bonusExercises || {})[S.selectedSportDay] || [];
 var _exBaseKey = (exBase.name || '').toLowerCase().trim();
 var isAddedBonus = false;
 for (var bci = 0; bci < bonusArr.length; bci++) { if ((bonusArr[bci].n || '').toLowerCase().trim() === _exBaseKey) { isAddedBonus = true; break; } }
 // Anti-doublon global : l'exercice est-il déjà dans la séance principale ?
 var _inMain = false;
 if (Array.isArray(S.sportProgram) && S.sportProgram[S.selectedSportDay] && Array.isArray(S.sportProgram[S.selectedSportDay].exercises)) {
   for (var bmi = 0; bmi < S.sportProgram[S.selectedSportDay].exercises.length; bmi++) {
     if ((S.sportProgram[S.selectedSportDay].exercises[bmi].n || '').toLowerCase().trim() === _exBaseKey) { _inMain = true; break; }
   }
 }
 var addBtn = h('div', {
 style: 'margin-top:6px;padding:4px 8px;cursor:' + (_inMain && !isAddedBonus ? 'not-allowed' : 'pointer') + ';font-family:"Helvetica Neue",sans-serif;font-size:11px;text-align:center;border:1px solid ' + (isAddedBonus ? 'var(--success,#3E5C3A)' : (_inMain ? 'var(--line,#D8D8D0)' : 'var(--border)')) + ';color:' + (isAddedBonus ? 'var(--success,#3E5C3A)' : (_inMain ? 'var(--ink-300,#A8A8A0)' : 'var(--grey)')) + ';background:' + (isAddedBonus ? 'rgba(62,92,58,0.06)' : 'transparent') + ';opacity:' + (_inMain && !isAddedBonus ? '0.55' : '1'),
 onclick: (function(exBCapture, inMainCapture) { return function(e) {
 e.stopPropagation();
 if (inMainCapture) { if (window.showToast) window.showToast('⚠ ' + exBCapture.name + ((window.isEnglish && window.isEnglish()) ? ' is already in this session' : ' est déjà dans cette séance'), 'warning', 2500); return; }
 if (!S.bonusExercises) S.bonusExercises = {};
 var arr = S.bonusExercises[S.selectedSportDay] || [];
 var _k = (exBCapture.name || '').toLowerCase().trim();
 var existIdx = -1;
 for (var ii = 0; ii < arr.length; ii++) { if ((arr[ii].n || '').toLowerCase().trim() === _k) { existIdx = ii; break; } }
 if (existIdx === -1) {
 var ph = getMuscuPhase(sfcGetEffectiveWeek());
 var appl = applyPhaseToExercise(exBCapture, ph);
 arr.push({n: appl.name, m: appl.muscle || '', eq: appl.equipment || '', sets: appl.sets + '\u00d7' + appl.reps, rest: appl.rest || '60s', lv: 1, tags: [], _bonus: true});
 S.bonusExercises[S.selectedSportDay] = arr;
 } else {
 arr.splice(existIdx, 1);
 S.bonusExercises[S.selectedSportDay] = arr;
 }
 window.render();
 }; })(exBase, _inMain)
 }, isAddedBonus ? (window.isEnglish && window.isEnglish() ? '\u2713 Added' : '\u2713 Ajout\u00e9') : (_inMain ? (window.isEnglish && window.isEnglish() ? 'Already in session' : 'D\u00e9j\u00e0 dans la s\u00e9ance') : (window.isEnglish && window.isEnglish() ? '+ Add to my session' : '+ Ajouter \u00e0 ma s\u00e9ance')));
 right.appendChild(addBtn);
 row.appendChild(right);
 card.appendChild(row);
 });
 if (prog.notes) card.appendChild(h('div', {style: 'padding:10px 16px;border-top:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, prog.notes));
 }
 p.appendChild(card);
 });
 }

 // Recalculate weekly program (distinct from AI generator above)
 p.appendChild(h('button', {'class': 'regen-btn', style: 'margin-top:16px', onclick: function(){
 try {
   var _regen = generateSportProgram();
   if (_regen && _regen.length > 0) {
     S.sportProgram = _regen;
     // FIX VALIDATION SPORTPROGRAM 2026-04 : marquer validé (recalcul explicite user)
     S.sportProgramValidated = true;
     S.sportProgramValidatedAt = new Date().toISOString();
     S.selectedSportDay = 0;
     window.BLACKBOX && window.BLACKBOX.log('sport_program_regenerated');
     // FIX 2026-04-16 — Recalculer ne sauvegardait pas → programme perdu si app fermée
     if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
   } else {
     console.warn('[sport] Recalculer: generateSportProgram returned empty — keeping existing program');
   }
 } catch(e) {
   console.error('[sport] Recalculer: generateSportProgram failed', e);
 }
 window.render();
 }}, '\u21bb Recalculer le programme hebdomadaire'));

 // Export PDF
 p.appendChild(h('button', {'class': 'btn-primary', style: 'margin-top:12px;background:var(--black2)', onclick: function() { if (typeof window.exportSportPDF === 'function') window.exportSportPDF(); else if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'PDF export not available.' : 'Export PDF non disponible.', 'info', 3000); }}, '\u21e9 Exporter le programme en PDF'));

 // Weight chart removed (was crashing)

 // ═══ HERMÈS POLISH — CARTES SECONDAIRES (déplacées ici pour scroll UX) ═══
 // Grossesse, cycle menstruel, suppléments, estimation calorique : utiles mais
 // ne doivent pas repousser les exercices hors du viewport mobile.

 // ─── GROSSESSE — Adaptations sport ───
 if (S.pregnant && window.isFemale(S)) {
 var triSport = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
 if (triSport && triSport.trimester) {
 var triSportColor = 'var(--error,#7A1F1F)';
 var intensitySport = Math.round((triSport.trimester.intensityFactor || 0.5) * 100);

 var pregSportCard = h('div', {style: 'border:2px solid ' + triSportColor + ';padding:16px;background:rgba(192,57,43,0.04);margin-bottom:16px'});
 pregSportCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;color:' + triSportColor + ';margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? '\uD83E\uDD30 Pregnancy-adapted program \u2014 ' : '\uD83E\uDD30 Programme adapt\u00e9 grossesse \u2014 ') + (triSport.trimester.name || '')));
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Recommended intensity: ' + intensitySport + '% \u2014 Listen to your body' : 'Intensit\u00e9 : ' + intensitySport + '% \u2014 \u00c9coutez votre corps')));
 if (triSport.trimester.sportTips) triSport.trimester.sportTips.forEach(function(tip) {
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
 });
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:' + triSportColor + ';margin:10px 0 6px'}, 'Exercices interdits ce trimestre'));
 if (triSport.trimester.forbiddenExercises) triSport.trimester.forbiddenExercises.forEach(function(ex) {
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + triSportColor + ';margin-bottom:2px;padding-left:8px'}, '\u2716 ' + ex));
 });
 var pregStopWarn = h('div', {style: 'margin-top:10px;padding:8px 12px;background:rgba(192,57,43,0.08);border-radius:2px'});
 pregStopWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + triSportColor + ';font-weight:bold'}, (window.isEnglish && window.isEnglish() ? '\u26A0 Stop immediately if: bleeding, dizziness, contractions, pain, excessive shortness of breath' : '\u26A0 Arr\u00eatez imm\u00e9diatement si : saignements, vertiges, contractions, douleurs, essoufflement excessif')));
 pregSportCard.appendChild(pregStopWarn);
 p.appendChild(pregSportCard);
 }
 }

 // ─── Cycle menstruel — Recommandation sport ───
 if (cycleInfo) {
 var phaseColors = {menstruation: 'var(--error,#7A1F1F)', follicular: 'var(--orange-ink,#7A3B0E)', ovulation: 'var(--success,#3E5C3A)', luteal: 'var(--orange-ink,#7A3B0E)'};
 var phaseColor = phaseColors[cycleInfo.phase.id] || 'var(--orange-ink,#7A3B0E)';
 var intensity = Math.round(cycleInfo.phase.intensityFactor * 100);
 var cycSportCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:14px 16px;background:var(--ivory2);margin-bottom:16px'});
 cycSportCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, cycleInfo.phase.icon + ' ' + cycleInfo.phase.name));
 cycSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Recommended intensity: ' + intensity + '%' : 'Intensit\u00e9 recommand\u00e9e : ' + intensity + '%')));
 (cycleInfo.phase.sportTips || []).forEach(function(tip) {
 cycSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
 });
 if (cycleInfo.phase.intensityFactor < 0.8) {
 var warnDiv = h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(192,57,43,0.06);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--error,#7A1F1F);border-radius:2px'});
 warnDiv.textContent = (window.isEnglish && window.isEnglish() ? '\u26A0 Recovery phase \u2014 adapt your effort' : '\u26A0 Phase de r\u00e9cup\u00e9ration \u2014 adaptez votre effort');
 cycSportCard.appendChild(warnDiv);
 } else if (cycleInfo.phase.intensityFactor > 1.0) {
 var greenDiv = h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(39,174,96,0.06);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);border-radius:2px'});
 greenDiv.textContent = '\u2705 Phase optimale \u2014 poussez vos limites !';
 cycSportCard.appendChild(greenDiv);
 }
 p.appendChild(cycSportCard);
 }

 // ─── Supplement tips ───
 if (S.creatine) {
 var creatSupp = null;
 if (window.SUPPLEMENTS_DB) {
 for (var si = 0; si < window.SUPPLEMENTS_DB.length; si++) {
 if (window.SUPPLEMENTS_DB[si].id === 'creatine') { creatSupp = window.SUPPLEMENTS_DB[si]; break; }
 }
 }
 var creatDose = S.creatineDose || (creatSupp ? creatSupp.dosageCalc(S).dose : 5);
 var creatTip = h('div', {'class': 'whey-tip', style: 'border-left-color:var(--blue,#1A3A6A);background:var(--bluebg,rgba(26,58,106,0.04));margin-bottom:8px'});
 creatTip.appendChild(h('strong', {}, (window.isEnglish && window.isEnglish() ? '\uD83D\uDC8A Creatine \u2014 ' : '\uD83D\uDC8A Cr\u00e9atine \u2014 ')));
 creatTip.appendChild(h('span', {}, creatDose + (window.isEnglish && window.isEnglish() ? 'g after workout with carbs for optimal absorption' : 'g apr\u00e8s l\'entra\u00eenement avec glucides pour absorption optimale')));
 p.appendChild(creatTip);
 }
 if (S.supplements && S.supplements.indexOf('cafeine') !== -1) {
 var cafSupp = null;
 if (window.SUPPLEMENTS_DB) {
 for (var ci2 = 0; ci2 < window.SUPPLEMENTS_DB.length; ci2++) {
 if (window.SUPPLEMENTS_DB[ci2].id === 'cafeine') { cafSupp = window.SUPPLEMENTS_DB[ci2]; break; }
 }
 }
 var cafDose = cafSupp ? cafSupp.dosageCalc(S).dose : 200;
 var cafTip = h('div', {'class': 'whey-tip', style: 'border-left-color:var(--blue,#1A3A6A);background:var(--bluebg,rgba(26,58,106,0.04));margin-bottom:8px'});
 cafTip.appendChild(h('strong', {}, (window.isEnglish && window.isEnglish() ? '\u2615 Caffeine \u2014 ' : '\u2615 Caf\u00e9ine \u2014 ')));
 cafTip.appendChild(h('span', {}, cafDose + (window.isEnglish && window.isEnglish() ? 'mg 30-60 min before session' : 'mg 30-60 min avant la s\u00e9ance')));
 p.appendChild(cafTip);
 }

 // ─── ESTIMATION CALORIQUE MUSCU ───
 (function() {
  var _lvlNorm = {beginner:'debutant', intermediate:'intermediaire', advanced:'avance', elite:'elite'}[S.sportLevel] || 'intermediaire';
  var SESSION_DUR_MUSCU = { debutant: 50, intermediaire: 60, avance: 75, elite: 90 };
  var muscuDur = SESSION_DUR_MUSCU[_lvlNorm] || 60;
  var muscuLevel = S.sportLevel || 'intermediate';
  var muscuKcal = estimateKcal('muscu', muscuLevel, muscuDur);
  p.appendChild(buildKcalCard(muscuKcal, muscuDur));
 }());

 // ═══ INSERTION SECTION SFC (stockée dans window._pendingSfcSection) ═══
 // Rendue APRÈS le programme quotidien pour ne pas polluer la hiérarchie UX.
 if (window._pendingSfcSection) {
  p.appendChild(window._pendingSfcSection);
  window._pendingSfcSection = null;
 }

 // Bouton "Séance libre" — visible et accessible depuis le programme
 var _freeSection = h('div', {style: 'margin-top:32px;padding-top:24px;border-top:1px solid var(--border,#E8E6DF);text-align:center;'});
 _freeSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:14px;'}, (window.isEnglish && window.isEnglish() ? 'CUSTOM SESSION' : 'SÉANCE PERSONNALISÉE')));
 _freeSection.appendChild(h('button', {
   style: 'display:block;width:100%;max-width:300px;padding:15px 24px;background:transparent;color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid var(--black,#0A0A09);cursor:pointer;margin:0 auto;min-height:44px;',
   onclick: function() {
     if (window.CUSTOM_SESSION && typeof window.CUSTOM_SESSION.open === 'function') {
       window.CUSTOM_SESSION.open();
     } else {
       S.sStep = 30;
       if (window.render) window.render();
     }
   }
 }, (window.isEnglish && window.isEnglish() ? 'Create a free session' : 'Créer une séance libre')));
 p.appendChild(_freeSection);

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 3; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Edit muscle groups' : 'Modifier les zones')}));
 appendNutritionModeCTA(p);
}

// ─── WEIGHT CHART (for sport) ───
function renderWeightChartSport(container) {
 var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var history = []; try { history = JSON.parse(localStorage.getItem('mtd_weight_history_' + userId) || '[]'); } catch(e) { history = []; }

 var section = h('div', {'class': 'chart-container'});
 section.appendChild(h('div', {'class': 'chart-title'}, (window.isEnglish && window.isEnglish() ? 'Weight tracking' : 'Suivi du poids')));

 if (history.length < 2) {
 section.appendChild(h('div', {style: 'text-align:center;padding:20px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Log your weight regularly to see your curve' : 'Enregistrez votre poids régulièrement pour voir votre courbe')));
 }

 var canvas = h('canvas', {'class': 'weight-chart', width: '600', height: '200', style: 'display:none'});
 section.appendChild(canvas);
 container.appendChild(section);

 // Weight input
 var inputRow = h('div', {style: 'display:flex;gap:8px;align-items:center;margin-top:8px'});
 var wi = h('input', {'class': 'num-input', type: 'number', step: '0.1', min: '30', max: '200', inputmode: 'decimal', placeholder: String(S.weight || 75), style: 'font-size:16px;padding:8px;width:100px;text-align:center'});
 inputRow.appendChild(wi);
 inputRow.appendChild(h('span', {'class': 'num-unit'}, window.UNITS ? window.UNITS.weightLabel() : 'kg'));
 inputRow.appendChild(h('button', {'class': 'btn-primary', style: 'width:auto;margin:0;padding:10px 20px', onclick: function(){
 var v = parseFloat(wi.value);
 var vKg = window.UNITS ? window.UNITS.toKg(v) : v;
 var wRange = window.UNITS ? window.UNITS.weightRange() : {min: 30, max: 300};
 if (!isNaN(v) && v >= wRange.min && v <= wRange.max) {
 v = vKg; // always store in kg
 // FIX D3 COHÉRENCE WEIGHT HISTORY 2026-04 : localStorage = source unique.
 // Avant : sport pushait dans `hist` LOCAL + dupliquait dans S.weightHistory
 //         (qui n'avait pas été rechargé) → désync avec nutrition et dashboard.
 // Maintenant : recharger depuis localStorage → append → cap 52 → écrire →
 //              synchroniser S.weightHistory avec la même référence.
 var key = 'mtd_weight_history_' + userId;
 var hist = []; try { hist = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { hist = []; }
 var today = new Date().toISOString().split('T')[0];
 hist.push({date: today, weight: v});
 if (hist.length > 52) hist = hist.slice(-52); // cap 1 an
 try { localStorage.setItem(key, JSON.stringify(hist)); } catch(e) { console.warn('[weight_history] localStorage error:', e); }
 // Sync S.weightHistory avec localStorage (seul source de vérité)
 S.weightHistory = hist.slice();
 // Sync poids vers Supabase
 if (window.SupaSync) SupaSync.saveWeight(today, v);
 S.weight = v;
 // 2026-04 FIX UX : NE PAS dévalider le plan hebdo pour un simple changement de poids
 // (_nm=null suffit pour recalculer les macros ; le plan de la semaine reste valide)
 S._nm = null;
 window.BLACKBOX && window.BLACKBOX.log('weight_logged', {weight: v, from: 'sport'});
 if (window.GAMIFICATION) {
 GAMIFICATION.unlockBadge('first_weigh');
 if (hist.length >= 10) GAMIFICATION.unlockBadge('weight_10');
 }
 // Auto-PR detection: new lowest (cut/shred) or highest (bulk/lean_bulk/recompo) weight in 30 days
 var _prWeightMsg = null;
 var _hist30 = hist.filter(function(e){ return e && e.date && e.date >= new Date(Date.now() - 30*86400000).toISOString().slice(0,10); });
 if (_hist30.length >= 2) {
   var _pastValues = _hist30.slice(0, -1).map(function(e){ return parseFloat(e.weight); }).filter(function(x){ return !isNaN(x); });
   if (_pastValues.length > 0) {
     var _gKey = (S.goal !== null && window.GOALS && window.GOALS[S.goal]) ? window.GOALS[S.goal].key : '';
     var _isLoss = (_gKey === 'cut' || _gKey === 'shred');
     var _isGain = (_gKey === 'bulk' || _gKey === 'lean_bulk' || _gKey === 'recomposition');
     var _pastMin = Math.min.apply(null, _pastValues);
     var _pastMax = Math.max.apply(null, _pastValues);
     if (_isLoss && v < _pastMin) _prWeightMsg = (window.isEnglish && window.isEnglish() ? 'New low this month: ' : 'Nouveau record bas ce mois : ') + (window.UNITS ? window.UNITS.displayWeight(v) : v + ' kg') + ' \uD83C\uDFC6';
     else if (_isGain && v > _pastMax) _prWeightMsg = (window.isEnglish && window.isEnglish() ? 'New high this month: ' : 'Nouveau record haut ce mois : ') + (window.UNITS ? window.UNITS.displayWeight(v) : v + ' kg') + ' \uD83D\uDCAA';
   }
 }
 if (window.GAMIFICATION) GAMIFICATION.showToast(_prWeightMsg || ((window.isEnglish && window.isEnglish()) ? 'Weight recorded: ' : 'Poids enregistré : ') + (window.UNITS ? window.UNITS.displayWeight(v) : v + ' kg'));
 window.render();
 }
 }}, (window.isEnglish && window.isEnglish() ? 'Log' : 'Enregistrer')));
 container.appendChild(inputRow);

 // Render Chart.js
 setTimeout(function(){
 if (!canvas || !canvas.getContext || !window.Chart) return;
 var cleanLabels = [];
 var cleanData = [];
 (history || []).forEach(function(entry) {
 if (!entry) return;
 var w = parseFloat(entry.weight);
 if (isNaN(w) || w <= 0) return;
 cleanLabels.push(entry.date || '?');
 cleanData.push(w);
 });
 if (cleanData.length < 2) return;
 canvas.style.display = '';
 try { window.createChart(canvas, {
 type: 'line',
 data: {
 labels: cleanLabels,
 datasets: [{
 label: (window.isEnglish && window.isEnglish() ? 'Weight (kg)' : 'Poids (kg)'),
 data: cleanData,
 borderColor: '#0A0A09',
 backgroundColor: 'rgba(10,10,9,0.05)',
 fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#0A0A09'
 }]
 },
 options: {
 responsive: true, maintainAspectRatio: false,
 plugins: { legend: { display: false } },
 scales: {
 x: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Helvetica Neue', size: 9 }, color: '#9A9A90' } },
 y: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Georgia', size: 11 }, color: '#0A0A09' } }
 }
 }
 }); } catch(e){}
 }, 100);
}

// ─── SPORT MODAL (exercise detail) ───
function renderSportModal(app) {
 var ov = h('div', {'class': 'modal-overlay' + (S.sportModalExercise ? ' open' : ''), role: 'dialog', 'aria-modal': 'true', onclick: function(e){ if (e.target === ov) { S.sportModalExercise = null; window.render(); } }});
 if (S.sportModalExercise) {
   ov.setAttribute('tabindex', '-1');
   setTimeout(function() { if (ov) ov.focus(); }, 0);
 }
 var sheet = h('div', {'class': 'modal-sheet'});

 if (S.sportModalExercise) {
 var ex = S.sportModalExercise;
 window.BLACKBOX && window.BLACKBOX.log('exercise_viewed', {name: ex.n});
 if (window.GAMIFICATION) {
 var c = GAMIFICATION.incrementCounter('exercises_viewed');
 if (c >= 20) GAMIFICATION.unlockBadge('exercises_20');
 }

 var hdr = h('div', {'class': 'modal-header'});
 hdr.appendChild(h('div', {'class': 'modal-title'}, ex.n));
 hdr.appendChild(h('button', {'class': 'modal-close', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour'), onclick: function(){ S.sportModalExercise = null; window.render(); }}, ''));
 sheet.appendChild(hdr);

 var body = h('div', {'class': 'modal-body'});

 // Muscle + Equipment
 var pills = h('div', {'class': 'macro-pills'});
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.m), h('div', {'class': 'mp-label'}, (window.isEnglish && window.isEnglish() ? 'Muscle' : 'Muscle'))]));
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.sets), h('div', {'class': 'mp-label'}, window.t('muscu.sets'))]));
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.rest), h('div', {'class': 'mp-label'}, window.t('muscu.rest'))]));
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ''.repeat(Math.max(0, parseInt(ex.lv) || 0))), h('div', {'class': 'mp-label'}, window.t('sport.level'))]));
 body.appendChild(pills);

 // Equipment
 body.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Equipment' : '\u00c9quipement')));
 body.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:16px'}, ex.eq));

 // Saved weight display
 var modalSavedW = S.musculationWeights[ex.n];
 if (modalSavedW && modalSavedW.weight) {
 var modalEqType = modalSavedW.type || 'barre';
 var _mwDisp = window.UNITS ? window.UNITS.displayWeightVal(modalSavedW.weight) : modalSavedW.weight;
 var _mwUnit = window.UNITS ? window.UNITS.weightLabel() : 'kg';
 var modalWeightDisplay = modalEqType === 'haltere' ? '2\u00d7' + _mwDisp + ' ' + _mwUnit : _mwDisp + ' ' + _mwUnit;
 var modalTypeLabel = modalEqType === 'barre' ? (window.isEnglish && window.isEnglish() ? '\uD83C\uDFCB\uFE0F Barbell' : '\uD83C\uDFCB\uFE0F Barre') : modalEqType === 'haltere' ? (window.isEnglish && window.isEnglish() ? '\uD83D\uDCAA Dumbbells' : '\uD83D\uDCAA Halt\u00e8res') : modalEqType === 'machine' ? '\u2699\uFE0F Machine' : modalEqType === 'kb' ? '\uD83D\uDD14 Kettlebell' : (window.isEnglish && window.isEnglish() ? 'Bodyweight' : 'Poids de corps');

 body.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Workload' : 'Charge de travail')));
 var modalWeightCard = h('div', {style: 'display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--ivory2,#F8F7F2);border-left:3px solid var(--black,#0A0A09);margin-bottom:16px'});
 modalWeightCard.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:24px;font-weight:bold;color:var(--black)'}, modalWeightDisplay));
 modalWeightCard.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey)'}, modalTypeLabel));
 body.appendChild(modalWeightCard);
 }

 // Description
 body.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Execution' : 'Exécution')));
 body.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:16px'}, ex.desc));

 // Tips
 if (ex.tips && ex.tips.length) {
 body.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Tips' : 'Conseils')));
 var tl = h('ul', {'class': 'ingredient-list'});
 ex.tips.forEach(function(tip){ tl.appendChild(h('li', {}, tip)); });
 body.appendChild(tl);
 }

 // GIF demo in detail sheet — show if available
 var _detailGif = (window.EXERCISE_GIFS && ex.n && window.EXERCISE_GIFS[ex.n]) ? window.EXERCISE_GIFS[ex.n] : null;
 if (_detailGif) {
   body.appendChild(h('img', {
     src: _detailGif, alt: ex.n,
     loading: 'lazy',
     style: 'width:100%;border-radius:2px;margin:16px 0 12px;display:block;border:1px solid var(--border,#D8D8D0)',
     onerror: function(e) { e.currentTarget.style.display = 'none'; }
   }));
 }

 // Video button — 2026-04 EXERCISE_VIDEOS smart URL + modal préparation
 var _detailExoLv = (typeof ex.lv === 'number') ? ex.lv : 1;
 var _detailVideoUrl = (window.EXERCISE_VIDEOS && window.EXERCISE_VIDEOS.buildSmartVideoUrl)
   ? window.EXERCISE_VIDEOS.buildSmartVideoUrl(ex.n, _detailExoLv)
   : (ex.video || (window.getExerciseVideoUrl ? window.getExerciseVideoUrl(ex.n) : null));
 if (_detailVideoUrl) {
 // 2026-04 UX-1 : lien direct (plus de modal intermédiaire)
 body.appendChild(h('a', {
 'class': 'btn-primary', href: _detailVideoUrl, target: '_blank', rel: 'noopener',
 style: 'display:block;text-align:center;text-decoration:none;margin-top:16px',
 onclick: function(){
   window.BLACKBOX && window.BLACKBOX.log('video_clicked', {exercise: ex.n});
 }
 }, (window.isEnglish && window.isEnglish() ? '▶ Watch guided video' : '▶ Voir la vidéo guidée')));
 }

 sheet.appendChild(body);
 }

 ov.appendChild(sheet);
 app.appendChild(ov);
}

// ─── STEP 7: RUNNING CONFIG ───
function renderRunningConfig(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Running'));
 p.appendChild(h('h1', {html: 'Votre plan<br><em>course</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Programming based on the Jack Daniels & Pfitzinger method' : 'Programmation basée sur la méthode Jack Daniels & Pfitzinger')));

 // Goal selection (mandatory)
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Race goal' : 'Objectif de course')));
 var goalGrid = h('div', {'class': 'card-grid-2'});
 (window.RUNNING_GOALS || []).forEach(function(g) {
 var isOn = S.runningGoal === g.id;
 goalGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), style: 'cursor:pointer', onclick: function(){
 S.runningGoal = g.id;
 window.render();
 }}, [
 h('span', {'class': 'card-icon'}, g.icon),
 h('div', {'class': 'card-name'}, g.name),
 h('div', {'class': 'card-sub'}, g.desc),
 h('div', {'class': 'card-tag'}, g.weeks + (window.isEnglish && window.isEnglish() ? ' weeks · Max LR ' + g.longRunMax + 'km' : ' semaines · SL max ' + g.longRunMax + 'km'))
 ]));
 });
 p.appendChild(goalGrid);

 // Level selection (mandatory)
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.level')));
 var lvlList = h('div', {'class': 'level-list'});
 (window.RUNNING_LEVELS || []).forEach(function(lv) {
 var isOn = S.runningLevel === lv.id;
 lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: function(){ S.runningLevel = lv.id; window.render(); }}, [
 h('div', {}, [
 h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
 h('div', {'class': 'level-desc'}, lv.desc)
 ]),
 isOn ? h('span', {'class': 'level-badge'}, '\u2713') : h('span', {})
 ]));
 });
 p.appendChild(lvlList);

 // Days per week
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.days')));
 var daysWrap = h('div', {'class': 'num-input-wrap'});
 daysWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '3', max: '6', value: String(S.runningDays), inputmode: 'numeric',
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 3 && v <= 6) { S.runningDays = v; window.render(); } },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 3) { e.target.value = S.runningDays = 3; window.render(); } else if (v > 6) { e.target.value = S.runningDays = 6; window.render(); } }
 }));
 daysWrap.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(daysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? '3 to 6 days per week' : '3 à 6 jours par semaine')));

 // Pace (optional)
 p.appendChild(h('div', {style: 'height:24px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Your current pace (optional)' : 'Votre allure actuelle (optionnel)')));
 var paceWrap = h('div', {'class': 'num-input-wrap'});
 paceWrap.appendChild(h('input', {'class': 'num-input', type: 'text', placeholder: '5:30', value: S.runningPace || '', style: 'width:80px;text-align:center',
 oninput: function(e){
 S.runningPace = e.target.value;
 clearTimeout(window._runPaceTimer);
 window._runPaceTimer = setTimeout(function(){ if (window.render) window.render(); }, 800);
 }
 }));
 paceWrap.appendChild(h('span', {'class': 'num-unit'}, 'min/km'));
 p.appendChild(paceWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? 'Your easy pace over 30 min' : 'Votre allure facile sur 30 min')));

 // Show estimated paces if pace is filled
 if (S.runningPace && S.runningPace.indexOf(':') !== -1) {
 var paceParts = S.runningPace.split(':');
 var paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1] || 0);
 if (paceSeconds > 0) {
 var zonesInfo = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin:16px 0'});
 zonesInfo.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Estimated paces by zone' : 'Allures estimées par zone')));
 (window.RUNNING_ZONES || []).forEach(function(z) {
 if (!z.pct || !z.pct[0] || !z.pct[1]) return;
 var avgPct = (z.pct[0] + z.pct[1]) / 200;
 var zonePace = avgPct > 0 ? Math.round(paceSeconds / avgPct) : paceSeconds;
 var zMin = Math.floor(zonePace / 60);
 var zSec = zonePace % 60;
 var paceStr = zMin + ':' + (zSec < 10 ? '0' : '') + zSec;
 zonesInfo.appendChild(h('div', {style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:13px'}, [
 h('span', {style: 'color:' + z.color + ';font-weight:bold'}, z.zone + ' ' + z.name),
 h('span', {}, '~' + paceStr + '/km — ' + z.feel)
 ]));
 });
 p.appendChild(zonesInfo);
 }
 }

 // Continue button
 p.appendChild(h('div', {style: 'height:16px'}));
 var ok = S.runningGoal !== null && S.runningLevel !== null;
 if (!ok) {
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Choose your goal and level to continue.' : 'Choisissez votre objectif et votre niveau pour continuer.')));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) {
 var goalObj = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
 if (typeof window.generateRunningProgram === 'function') S.runningProgram = window.generateRunningProgram(goalObj ? goalObj.weeks : 8, S.runningDays, S.runningLevel, S.runningGoal);
 _sfcNotifySport('running', S.runningLevel);
 S.runningWeek = 1;
 S.selectedRunDay = 0;
 S.sStep = 8;
 window.BLACKBOX && window.BLACKBOX.log('running_config', {goal: S.runningGoal, level: S.runningLevel, days: S.runningDays});
 window.render();
 }
 }}, (window.isEnglish && window.isEnglish() ? 'Generate my plan' : 'Générer mon plan')));
 // 2026-04 PHASE 2 : offrir le mix pour running primaire aussi
 // sportDays utilisé par renderSportMixSection mappe vers runningDays ici
 var _prevSportDays = S.sportDays;
 S.sportDays = S.runningDays || 3;
 renderSportMixSection(p, 'running');
 S.sportDays = _prevSportDays;
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

// ─── STEP 8: RUNNING PROGRAM ───
function renderRunningProgram(p) {
 if (!S.runningProgram || S.runningProgram.length === 0) {
 var goalObj = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
 if (typeof window.generateRunningProgram === 'function') { try { S.runningProgram = window.generateRunningProgram(goalObj ? goalObj.weeks : 8, S.runningDays || 3, S.runningLevel, S.runningGoal); } catch(e) { console.error('[running] generateRunningProgram error:', e); } }
 }

 var program = S.runningProgram;
 if (!program || !program.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable. Reload the page or reconfigure your plan.' : 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 7; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }
 var totalWeeks = program.length;
 S.runningWeek = S.runningWeek || 1;
 if (S.runningWeek > totalWeeks) S.runningWeek = totalWeeks;
 if (S.runningWeek < 1) S.runningWeek = 1;
 var currentWeekData = program[S.runningWeek - 1];
 if (!currentWeekData) { p.appendChild(h('div', {style:'text-align:center;padding:32px;font-size:13px;color:var(--grey)'}, 'Semaine introuvable.')); p.appendChild(h('button', {'class':'btn-back', onclick: function(){ S.sStep = 7; window.render(); }}, '← Retour')); return; }

 // ─── AVERTISSEMENT GROSSESSE (Running) ───
 if (S.pregnant && window.isFemale(S)) {
   var _rpw = window.getPregnancySportWarning ? window.getPregnancySportWarning() : null;
   var _rpwC = h('div', {style: 'border-left:3px solid #FF6B6B;background:#FFF3CD;padding:12px 16px;margin-bottom:16px'});
   _rpwC.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#C00;margin-bottom:6px'}, 'Grossesse \u2014 Adaptations obligatoires'));
   _rpwC.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'}, _rpw ? _rpw.warning : (window.isEnglish && window.isEnglish() ? 'Reduce intensity. No sprints or short intervals. Prioritize brisk walking and light jogging in Zone 1-2. Consult your doctor.' : 'R\u00e9duisez l\u2019intensit\u00e9. Pas de sprints ni d\u2019intervalles courts. Privil\u00e9giez la marche rapide et le jogging l\u00e9ger en Zone 1-2. Consultez votre m\u00e9decin.')));
   p.appendChild(_rpwC);
 }
 appendSportMedicalBanner(p, 'Running');
 var goalObj2 = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
 var levelObj = (window.RUNNING_LEVELS || []).find(function(l){ return l.id === S.runningLevel; });

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Program' : 'Programme')));
 p.appendChild(h('h1', {html: (goalObj2 ? goalObj2.name : 'Running') + '<br><em>Plan</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, totalWeeks + (window.isEnglish && window.isEnglish() ? ' weeks · ' + S.runningDays + ' days/week · Level ' : ' semaines · ' + S.runningDays + ' jours/semaine · Niveau ') + (levelObj ? levelObj.name : '')));

 appendWellnessBanner(p);

 // Week navigation
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Previous week' : 'Semaine précédente'), onclick: function() {
 if (S.runningWeek > 1) { S.runningWeek--; S.selectedRunDay = 0; window.render(); }
 }}, '\u2190'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.runningWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Next week' : 'Semaine suivante'), onclick: function() {
 if (S.runningWeek < totalWeeks) { S.runningWeek++; S.selectedRunDay = 0; window.render(); }
 }}, '\u2192'));
 p.appendChild(weekNav);

 // Phase + volume info
 var phaseColors = {Base: 'var(--blue,#1A3A6A)', 'Développement': 'var(--orange-ink,#7A3B0E)', 'Spécifique': 'var(--error,#7A1F1F)', 'Affûtage': 'var(--success,#3E5C3A)'};
 var _phaseNamesEN = {Base: 'Base', 'Développement': 'Development', 'Spécifique': 'Specific', 'Affûtage': 'Taper'};
 var phaseColor = phaseColors[currentWeekData.phase] || '#0A0A09';
 var _phaseDisp = (window.isEnglish && window.isEnglish() ? (_phaseNamesEN[currentWeekData.phase] || currentWeekData.phase) : currentWeekData.phase);
 var infoCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 infoCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + phaseColor + ';margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Phase: ' : 'Phase : ') + currentWeekData.phase));
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Volume: ~' + currentWeekData.totalKm + ' km · Long run: ' + currentWeekData.longRun + ' km' : 'Volume : ~' + currentWeekData.totalKm + ' km · Sortie longue : ' + currentWeekData.longRun + ' km')));
 if (currentWeekData.isDeload) {
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);margin-top:6px;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? ' Recovery week' : ' Semaine de récupération')));
 }
 if (currentWeekData.isTaper) {
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);margin-top:6px;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? ' Taper — keep intensity, reduce volume' : ' Affûtage — gardez l\'intensité, réduisez le volume')));
 }
 p.appendChild(infoCard);
 // Règle +10% progression volume running
 if (typeof window.checkRunning10pct === 'function' && typeof window.getLastWeekRunKm === 'function') {
   var _prevRunKm = window.getLastWeekRunKm();
   var _propRunKm = currentWeekData.totalKm || 0;
   var _runVolCheck = window.checkRunning10pct(_prevRunKm, _propRunKm);
   if (_runVolCheck.capApplied) {
     var _runWarnEl = h('div', {style: 'border-left:3px solid var(--orange-ink,#7A3B0E);background:rgba(122,59,14,0.06);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'});
     _runWarnEl.textContent = '⚠ ' + _runVolCheck.reason;
     p.appendChild(_runWarnEl);
   }
 }

 // ─── RÈGLE +10% PROGRESSION VOLUME RUNNING ───────────────────────────────────
 // checkRunning10pct + getLastWeekRunKm définis dans sport-running.js.
 if (typeof window.checkRunning10pct === 'function' && typeof window.getLastWeekRunKm === 'function') {
   var _prevRunKm = window.getLastWeekRunKm();
   var _propRunKm = currentWeekData.totalKm || 0;
   var _runVolCheck = window.checkRunning10pct(_prevRunKm, _propRunKm);
   if (_runVolCheck.capApplied) {
     var _runWarnEl = h('div', {style: 'border-left:3px solid var(--orange-ink,#7A3B0E);background:rgba(122,59,14,0.06);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'});
     _runWarnEl.textContent = '⚠ ' + _runVolCheck.reason;
     p.appendChild(_runWarnEl);
   }
 }


 // ─── ESTIMATION CALORIQUE RUNNING ───
 (function() {
  var runLevel = S.runningLevel || 'intermediaire';
  // Normalize English level keys to French for SESSION_DUR_RUN lookup
  var LEVEL_FR_RUN = { beginner: 'debutant', intermediate: 'intermediaire', advanced: 'avance' };
  var runLevelFr = LEVEL_FR_RUN[runLevel] || runLevel;
  var SESSION_DUR_RUN = { debutant: 45, intermediaire: 60, avance: 75, elite: 90 };
  var runDur = SESSION_DUR_RUN[runLevelFr] || 60;
  var runKcal = estimateKcal('running', runLevel, runDur);
  p.appendChild(buildKcalCard(runKcal, runDur));
 }());

 // Day tabs
 var sessions = currentWeekData.sessions || [];
 if (S.selectedRunDay >= sessions.length) S.selectedRunDay = 0;
 var tabs = h('div', {'class': 'day-tabs'});
 sessions.forEach(function(sess, i) {
 tabs.appendChild(h('button', {
 'class': 'day-tab' + (S.selectedRunDay === i ? ' active' : ''),
 onclick: function() { S.selectedRunDay = i; window.render(); }
 }, (window.isEnglish && window.isEnglish() ? 'Day ' : 'Jour ') + (i + 1)));
 });
 p.appendChild(tabs);

 // Current session
 var sess = sessions[S.selectedRunDay];
 if (sess) {
 // ─── RUNNING INTENSITY ENGINE ─── runningLoad = duration × zone factor → S.trainingLoad
 var _runDurTable = { debutant: 45, intermediaire: 60, avance: 75, elite: 90 };
 var _runDurMins  = _runDurTable[S.runningLevel] || 60;
 var _runZone     = sess.zone || 'Z2';
 var _runFactor   = RUN_ZONE_FACTORS[_runZone] || 0.8;
 S.runningTrainingLoad = Math.round(_runDurMins * _runFactor);
 var _runLoad = S.runningTrainingLoad >= 80 ? 'heavy'
              : S.runningTrainingLoad >= 40 ? 'moderate' : 'light';
 _sfcAggregateLoad('running', _runLoad);
 _sfcNotifySport('running', S.runningLevel);
 _sfcAggregateLoad('running', _runLoad);
 var zoneColorMap = {'Z1': '#3E5C3A', 'Z2': '#1A3A6A', 'Z3': '#7A3B0E', 'Z4': '#7A3B0E', 'Z5': '#7A1F1F', 'Z1-Z2': '#3E5C3A', 'Z4-Z5': '#7A1F1F', 'Z3-Z4': '#7A3B0E'};
 var sessColor = zoneColorMap[sess.zone] || '#0A0A09';

 var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid ' + sessColor});
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + sessColor + ';margin-bottom:6px'}, sess.zone));
 sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, (sess.icon || '') + ' ' + sess.name));
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, sess.desc));
 if (sess.distance) {
 sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;color:' + sessColor + ';margin-bottom:8px'}, ' ' + sess.distance));
 }
 if (sess.detail) {
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.6;padding:10px;background:var(--ivory2);border:1px solid var(--border)'}, sess.detail));
 }
 p.appendChild(sessCard);
 }

 // Week notes
 if (currentWeekData.notes) {
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;text-align:center;margin:16px 0'}, currentWeekData.notes));
 }

 // ─── RUNNING SESSION LOG ───
 // Saves to mtd_run_history (feeds analytics._renderRunning avgPace + distance).
 // Pace = durationMin / distanceKm (min/km). Division by zero guarded (_km > 0 check).
 (function() {
  var _uid = (window.AUTH && window.AUTH.getUser && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';
  var _runKey = 'W' + S.runningWeek + '_D' + (S.selectedRunDay + 1);
  var _runHistKey = 'mtd_run_history_' + _uid;
  var _runHist = [];
  try { var _raw = localStorage.getItem(_runHistKey); if (_raw) _runHist = JSON.parse(_raw) || []; } catch(e) {}
  if (!Array.isArray(_runHist)) _runHist = [];
  var _todayDate = (window.sfcLocalDateStr && window.sfcLocalDateStr()) || new Date().toISOString().slice(0, 10);
  var _existing = null;
  for (var _ri = 0; _ri < _runHist.length; _ri++) {
    if (_runHist[_ri] && _runHist[_ri].runKey === _runKey) { _existing = _runHist[_ri]; break; }
  }

  var _logPanel = h('div', {style: 'border:1px solid var(--border,#D8D8D0);padding:14px 16px;margin:12px 0;background:var(--ivory2,#F4F4F0)'});
  _logPanel.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'Log this session' : 'Logger cette séance')));

  if (_existing) {
    var _recapEl = h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--success,#3E5C3A);margin-bottom:8px'});
    _recapEl.textContent = '✓ ' + _existing.distanceKm + ' km — ' + _existing.durationMin + ' min — ' + _existing.paceStr + ' /km';
    _logPanel.appendChild(_recapEl);
    _logPanel.appendChild(h('button', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey);background:none;border:none;cursor:pointer;padding:0;letter-spacing:1px;text-transform:uppercase',
      onclick: function() {
        _runHist = _runHist.filter(function(r) { return !r || r.runKey !== _runKey; });
        try { localStorage.setItem(_runHistKey, JSON.stringify(_runHist)); } catch(e) {}
        window.render();
      }
    }, (window.isEnglish && window.isEnglish() ? 'Edit' : 'Corriger')));
  } else {
    var _distInp = h('input', {type: 'number', min: '0', max: '100', step: '0.1', placeholder: '0.0', inputmode: 'decimal',
      style: 'width:70px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia,serif;font-size:16px;text-align:center;background:var(--ivory);color:#0A0A09'});
    var _durInp = h('input', {type: 'number', min: '0', max: '600', step: '1', placeholder: '0', inputmode: 'numeric',
      style: 'width:60px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia,serif;font-size:16px;text-align:center;background:var(--ivory);color:#0A0A09'});
    var _pacePreview = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);min-width:80px;text-align:right'}, '');

    function _updatePacePreview() {
      var _km = parseFloat(_distInp.value) || 0;
      var _min = parseFloat(_durInp.value) || 0;
      if (_km > 0 && _min > 0) {
        var _p = _min / _km;
        var _pm = Math.floor(_p), _ps = Math.round((_p - _pm) * 60);
        if (_ps === 60) { _pm += 1; _ps = 0; }
        _pacePreview.textContent = _pm + ':' + (_ps < 10 ? '0' : '') + _ps + ' /km';
      } else {
        _pacePreview.textContent = '';
      }
    }
    _distInp.addEventListener('input', _updatePacePreview);
    _durInp.addEventListener('input', _updatePacePreview);

    var _fieldsRow = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap'});
    _fieldsRow.appendChild(h('div', {style: 'display:flex;align-items:center;gap:6px'}, [
      _distInp,
      h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey)'}, 'km')
    ]));
    _fieldsRow.appendChild(h('div', {style: 'display:flex;align-items:center;gap:6px'}, [
      _durInp,
      h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey)'}, 'min')
    ]));
    _fieldsRow.appendChild(_pacePreview);
    _logPanel.appendChild(_fieldsRow);

    var _saveRunBtn = h('button', {style: 'width:100%;padding:12px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer',
      onclick: function() {
        var _km = parseFloat(_distInp.value) || 0;
        var _min = parseFloat(_durInp.value) || 0;
        if (_km <= 0 || _min <= 0) {
          if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? 'Enter a valid distance and duration.' : 'Entrez une distance et une durée valides.'), 'error', 2500);
          return;
        }
        // Pace = min/km. _km > 0 guaranteed above — no division by zero.
        var _pace = _min / _km;
        var _pm = Math.floor(_pace), _ps = Math.round((_pace - _pm) * 60);
        if (_ps === 60) { _pm += 1; _ps = 0; }
        var _paceStr = _pm + ':' + (_ps < 10 ? '0' : '') + _ps;
        var _entry = {
          date: _todayDate,
          runKey: _runKey,
          distanceKm: parseFloat(_km.toFixed(2)),
          durationMin: parseFloat(_min.toFixed(1)),
          paceStr: _paceStr,
          runningWeek: S.runningWeek,
          runDay: S.selectedRunDay + 1,
          sessName: (sess && sess.name) || ''
        };
        _runHist = _runHist.filter(function(r) { return !r || r.runKey !== _runKey; });
        _runHist.push(_entry);
        if (_runHist.length > 500) _runHist = _runHist.slice(_runHist.length - 500);
        try { localStorage.setItem(_runHistKey, JSON.stringify(_runHist)); } catch(e) {
          if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? 'Storage full — session not saved.' : 'Stockage plein — séance non sauvegardée.'), 'error', 3000);
          return;
        }
        // Also write to S.sessionHistory for analytics volume tracker
        if (!S.sessionHistory) S.sessionHistory = {};
        var _sessKey = S.selectedRunDay + '_' + _todayDate;
        var _kcalEst = estimateKcal('running', S.runningLevel || 'intermediate', Math.round(_min));
        var _runTrainingLoad = (S.runningLevel === 'advanced' || S.runningLevel === 'elite') ? 'heavy' : 'moderate';
        S.sessionHistory[_sessKey] = {duration: Math.round(_min), kcalBase: _kcalEst ? _kcalEst.base : 0, kcalEpoc: _kcalEst ? _kcalEst.epoc : 0, kcalTotal: _kcalEst ? _kcalEst.total : 0, date: new Date().toISOString(), sport: 'running', trainingLoad: _runTrainingLoad};
        (function(){ var _k=Object.keys(S.sessionHistory||{}).sort(); if(_k.length>365){_k.slice(0,_k.length-365).forEach(function(k){delete S.sessionHistory[k];});} })();
        if (window.SFCSymbiosis && window.SFCSymbiosis.processCompletedSession) {
          try { window.SFCSymbiosis.processCompletedSession({sessionId: _sessKey, date: _todayDate, exercises: [{name:'Running1',sets:1,reps:1},{name:'Running2',sets:1,reps:1},{name:'Running3',sets:1,reps:1},{name:'Running4',sets:1,reps:1}], trainingLoad: _runTrainingLoad}); } catch(_re) {}
        } else if (typeof window.computeNutritionState === 'function') { try { window.computeNutritionState(true); } catch(_re) {} }
        if (window.GAMIFICATION) { try { window.GAMIFICATION.updateStreak(); } catch(e) {} }
        window.BLACKBOX && window.BLACKBOX.log('run_logged', {distanceKm: _entry.distanceKm, durationMin: _entry.durationMin, pace: _paceStr});
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? '✓ Run logged — ' + _entry.distanceKm + ' km at ' + _paceStr + ' /km' : '✓ Course enregistrée — ' + _entry.distanceKm + ' km à ' + _paceStr + ' /km'), 'success');
        window.render();
      }
    }, (window.isEnglish && window.isEnglish() ? '✓ Log run' : '✓ Enregistrer la course'));
    _logPanel.appendChild(_saveRunBtn);
  }
  p.appendChild(_logPanel);
 })();

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 7; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ─── STEP 9: HYROX CONFIG ───
function renderHyroxConfig(p) {
 if (!S.hyroxBenchmarks || typeof S.hyroxBenchmarks !== 'object' || Array.isArray(S.hyroxBenchmarks)) S.hyroxBenchmarks = {};
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Hyrox'));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Hyrox<br><em>Preparation</em>' : 'Préparation<br><em>Hyrox</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? '12 weeks to be ready on race day' : '12 semaines pour être prêt le jour J')));

 // Goal selection (mandatory)
 p.appendChild(h('div', {'class': 'section-label'}, 'Objectif'));
 var goalGrid = h('div', {'class': 'card-grid-2'});
 (window.HYROX_GOALS || []).forEach(function(g) {
 var isOn = S.hyroxGoal === g.id;
 goalGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), style: 'cursor:pointer', onclick: function(){
 S.hyroxGoal = g.id;
 window.render();
 }}, [
 h('span', {'class': 'card-icon'}, g.icon),
 h('div', {'class': 'card-name'}, g.name),
 h('div', {'class': 'card-sub'}, g.desc)
 ]));
 });
 p.appendChild(goalGrid);

 // Level selection (mandatory)
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.level')));
 var lvlList = h('div', {'class': 'level-list'});
 (window.HYROX_LEVELS || []).forEach(function(lv) {
 var isOn = S.hyroxLevel === lv.id;
 lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: function(){ S.hyroxLevel = lv.id; window.render(); }}, [
 h('div', {}, [
 h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
 h('div', {'class': 'level-desc'}, lv.desc)
 ]),
 isOn ? h('span', {'class': 'level-badge'}, '\u2713') : h('span', {})
 ]));
 });
 p.appendChild(lvlList);

 // Days per week
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.days')));
 var daysWrap = h('div', {'class': 'num-input-wrap'});
 daysWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '3', max: '6', value: String(S.hyroxDays), inputmode: 'numeric',
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 3 && v <= 6) { S.hyroxDays = v; window.render(); } },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 3) { e.target.value = S.hyroxDays = 3; window.render(); } else if (v > 6) { e.target.value = S.hyroxDays = 6; window.render(); } }
 }));
 daysWrap.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(daysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? '3 to 6 days per week' : '3 à 6 jours par semaine')));

 // Benchmarks (optional)
 p.appendChild(h('div', {style: 'height:24px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, 'Benchmarks actuels (optionnel)'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:16px'}, 'Renseignez vos temps actuels pour suivre votre progression.'));

 var bmGrid = h('div', {style: 'margin-bottom:16px'});
 var stations = window.HYROX_STATIONS || [];
 stations.forEach(function(station) {
 if (station.id === 'run') return; // Skip generic run entry
 var row = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid var(--border);background:var(--ivory2);margin-bottom:4px'});

 var nameDiv = h('div', {style: 'flex:1'});
 nameDiv.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px'}, station.name));
 // Show standard for their level
 if (station.standards && S.hyroxLevel && station.standards[S.hyroxLevel]) {
 nameDiv.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey)'}, 'Standard ' + S.hyroxLevel + ' : ' + station.standards[S.hyroxLevel]));
 }
 row.appendChild(nameDiv);

 var currentVal = S.hyroxBenchmarks[station.id] || '';
 var inputWrap = h('div', {style: 'display:flex;align-items:center;gap:4px;flex-shrink:0'});
 inputWrap.appendChild(h('input', {
 type: 'text', placeholder: 'mm:ss', value: currentVal, style: 'width:64px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory)',
 oninput: (function(stId) { return function(e) {
 S.hyroxBenchmarks[stId] = e.target.value;
 }; })(station.id)
 }));
 row.appendChild(inputWrap);

 // Show comparison if value filled and standard exists
 if (currentVal && station.standards && S.hyroxLevel && station.standards[S.hyroxLevel]) {
 var stdStr = station.standards[S.hyroxLevel];
 var stdParts = stdStr.split(':');
 var stdSec = parseInt(stdParts[0]) * 60 + parseInt(stdParts[1] || 0);
 var valParts = currentVal.split(':');
 var valSec = parseInt(valParts[0]) * 60 + parseInt(valParts[1] || 0);
 if (!isNaN(valSec) && !isNaN(stdSec) && valSec > 0) {
 var isAbove = valSec > stdSec;
 row.appendChild(h('span', {style: 'font-size:13px;margin-left:4px'}, isAbove ? '' : ''));
 }
 }

 bmGrid.appendChild(row);
 });
 p.appendChild(bmGrid);

 // Continue button
 p.appendChild(h('div', {style: 'height:16px'}));
 var ok = S.hyroxGoal !== null && S.hyroxLevel !== null;
 if (!ok) {
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Choose your goal and level to continue.' : 'Choisissez votre objectif et votre niveau pour continuer.')));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) {
 if (typeof window.generateHyroxProgram !== 'function') { console.error('[hyrox] generateHyroxProgram module not loaded'); return; }
 S.hyroxProgram = window.generateHyroxProgram(S.hyroxDays, S.hyroxLevel, S.hyroxGoal);
 _sfcNotifySport('hyrox', S.hyroxLevel);
 S.hyroxWeek = 1;
 S.selectedHyroxDay = 0;
 S.sStep = 10;
 window.BLACKBOX && window.BLACKBOX.log('hyrox_config', {goal: S.hyroxGoal, level: S.hyroxLevel, days: S.hyroxDays});
 // Enregistrer les benchmarks dans l'historique
 if (window.PERF_HISTORY && S.hyroxBenchmarks) {
 var hyroxSt = window.HYROX_STATIONS || [];
 hyroxSt.forEach(function(st) {
 if (st.id !== 'run' && S.hyroxBenchmarks[st.id]) {
 PERF_HISTORY.recordHyroxBenchmark(st.id, st.name, S.hyroxBenchmarks[st.id]);
 }
 });
 }
 window.render();
 }
 }}, (window.isEnglish && window.isEnglish() ? 'Generate my plan' : 'Générer mon plan')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 10: HYROX PROGRAM ───
function renderHyroxProgram(p) {
 // Guard: si config non remplie, rediriger vers la config
 if (!S.hyroxLevel || !S.hyroxGoal) { S.sStep = 9; setTimeout(function() { if (window.render) window.render(); }, 0); return; }
 if (!S.hyroxProgram || S.hyroxProgram.length === 0) {
  try { S.hyroxProgram = window.generateHyroxProgram(S.hyroxDays || 3, S.hyroxLevel, S.hyroxGoal); } catch(e) { console.error('[hyrox] generateHyroxProgram error:', e); }
 }

 var program = S.hyroxProgram;
 if (!program || !program.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable. Reload the page or reconfigure your plan.' : 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 9; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }
 var totalWeeks = program.length;
 S.hyroxWeek = S.hyroxWeek || 1;
 if (S.hyroxWeek > totalWeeks) S.hyroxWeek = totalWeeks;
 if (S.hyroxWeek < 1) S.hyroxWeek = 1;
 var currentWeekData = program[S.hyroxWeek - 1];
 if (!currentWeekData) { p.appendChild(h('div', {style:'text-align:center;padding:32px;font-size:13px;color:var(--grey)'}, 'Semaine introuvable.')); p.appendChild(h('button', {'class':'btn-back', onclick: function(){ S.sStep = 9; window.render(); }}, '← Retour')); return; }

 var goalObj = (window.HYROX_GOALS || []).find(function(g){ return g.id === S.hyroxGoal; });
 var levelObj = (window.HYROX_LEVELS || []).find(function(l){ return l.id === S.hyroxLevel; });

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Program Hyrox' : 'Programme Hyrox')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? '12 Weeks<br><em>Preparation</em>' : 'Préparation<br><em>12 semaines</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Phase ' : 'Phase ') + currentWeekData.phase + ' · ' + (goalObj ? goalObj.name : '') + ' · ' + (levelObj ? levelObj.icon + ' ' + levelObj.name : '')));

 appendWellnessBanner(p);
 appendSportMedicalBanner(p, 'Hyrox');

 // Competition week banner
 if (S.hyroxWeek === 12) {
 var banner = h('div', {style: 'border:1px solid var(--error,#7A1F1F);padding:16px;background:rgba(122,31,31,0.04);margin-bottom:16px;text-align:center'});
 banner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;color:var(--error,#7A1F1F);margin-bottom:4px'}, ' RACE WEEK — GO TIME'));
 banner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Light activation. Visualization. Maximum rest. You are ready!' : 'Activation légère. Visualisation. Repos maximal. Vous êtes prêt !')));
 p.appendChild(banner);
 }

 // Week navigation
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Previous week' : 'Semaine précédente'), onclick: function() {
 if (S.hyroxWeek > 1) { S.hyroxWeek--; S.selectedHyroxDay = 0; window.render(); }
 }}, '\u2190'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.hyroxWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Next week' : 'Semaine suivante'), onclick: function() {
 if (S.hyroxWeek < totalWeeks) { S.hyroxWeek++; S.selectedHyroxDay = 0; window.render(); }
 }}, '\u2192'));
 p.appendChild(weekNav);

 // Phase info
 var phaseColors = {Base: '#1A3A6A', Build: '#7A3B0E', Peak: '#7A1F1F', Taper: '#3E5C3A', 'Développement': '#7A3B0E', 'Compétition': '#7A1F1F'};
 var _phaseNamesEN = {Base: 'Base', Build: 'Build', Peak: 'Peak', Taper: 'Taper', 'Développement': 'Development', 'Compétition': 'Competition'};
 var phaseColor = phaseColors[currentWeekData.phase] || '#0A0A09';
 var _phaseDisp = (window.isEnglish && window.isEnglish() ? (_phaseNamesEN[currentWeekData.phase] || currentWeekData.phase) : currentWeekData.phase);
 var infoCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 infoCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + phaseColor + ';margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Phase: ' : 'Phase : ') + _phaseDisp));
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, currentWeekData.notes || ''));
 if (currentWeekData.isDeload) {
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);margin-top:6px;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? ' Deload week' : ' Semaine de décharge')));
 }
 p.appendChild(infoCard);

 // ─── ESTIMATION CALORIQUE HYROX ───
 (function() {
  var hyroxLevel = S.hyroxLevel || 'intermediaire';
  var SESSION_DUR_HYROX = { debutant: 60, intermediaire: 75, avance: 90, elite: 105 };
  var hyroxDur = SESSION_DUR_HYROX[hyroxLevel] || 75;
  var hyroxKcal = estimateKcal('hyrox', hyroxLevel, hyroxDur);
  p.appendChild(buildKcalCard(hyroxKcal, hyroxDur));
 }());

 // Day tabs
 var sessions = currentWeekData.sessions || [];
 if (S.selectedHyroxDay >= sessions.length) S.selectedHyroxDay = 0;
 var tabs = h('div', {'class': 'day-tabs'});
 sessions.forEach(function(sess, i) {
 tabs.appendChild(h('button', {
 'class': 'day-tab' + (S.selectedHyroxDay === i ? ' active' : ''),
 onclick: function() { S.selectedHyroxDay = i; window.render(); }
 }, (window.isEnglish && window.isEnglish() ? 'Day ' : 'Jour ') + (i + 1)));
 });
 p.appendChild(tabs);

 // Current session
 var sess = sessions[S.selectedHyroxDay];
 if (sess) {
 var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid ' + phaseColor});
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + phaseColor + ';margin-bottom:6px'}, sess.focus));
 sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:10px'}, sess.name));

 // Exercises list
 var exList = h('div', {style: 'margin-bottom:10px'});
 (sess.exercises || []).forEach(function(ex, idx) {
 if (!ex.name && !ex.detail) return;
 var exRow = h('div', {style: 'padding:6px 0;border-bottom:1px solid var(--border)'});
 if (ex.name) {
 exRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px'}, (ex.name.indexOf('→') === 0 || ex.name.indexOf('rounds') !== -1 ? '' : (idx + 1) + '. ') + ex.name));
 }
 if (ex.detail) {
 exRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, ex.detail));
 }
 exList.appendChild(exRow);
 });
 sessCard.appendChild(exList);

 // Coach notes
 if (sess.notes) {
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;padding:10px;background:var(--ivory2);border:1px solid var(--border);margin-top:8px'}, ' ' + sess.notes));
 }
 p.appendChild(sessCard);
 }

 // Benchmarks comparison if filled
 var hasBenchmarks = Object.keys(S.hyroxBenchmarks || {}).some(function(k){ return S.hyroxBenchmarks[k]; });
 if (hasBenchmarks && S.hyroxLevel) {
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Vos benchmarks vs standards'));
 var bmCard = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin-bottom:16px'});
 var stations = window.HYROX_STATIONS || [];
 stations.forEach(function(station) {
 var val = S.hyroxBenchmarks[station.id];
 if (!val || station.id === 'run') return;
 var std = station.standards ? station.standards[S.hyroxLevel] : null;
 var bmRow = h('div', {style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:13px'});
 bmRow.appendChild(h('span', {}, station.name));
 var valSpan = h('span', {});
 valSpan.appendChild(h('span', {style: 'font-weight:bold'}, val));
 if (std) {
 var stdParts = std.split(':');
 var stdSec = parseInt(stdParts[0]) * 60 + parseInt(stdParts[1] || 0);
 var valParts = val.split(':');
 var valSec = parseInt(valParts[0]) * 60 + parseInt(valParts[1] || 0);
 if (!isNaN(valSec) && !isNaN(stdSec) && valSec > 0) {
 var diff = valSec - stdSec;
 var diffStr = diff > 0 ? '+' + diff + 's' : diff + 's';
 var diffColor = diff > 0 ? 'var(--error,#7A1F1F)' : 'var(--success,#3E5C3A)';
 valSpan.appendChild(h('span', {style: 'color:' + diffColor + ';margin-left:8px;font-size:11px'}, diffStr + ' vs standard'));
 }
 }
 bmRow.appendChild(valSpan);
 bmCard.appendChild(bmRow);
 });
 p.appendChild(bmCard);
 }

 // ─── HYROX SESSION DONE ───
 // Marks the day as complete and writes to S.sessionHistory for analytics tracking.
 (function() {
  if (!S.hyroxProgress || typeof S.hyroxProgress !== 'object') S.hyroxProgress = {};
  var _hxDayKey = 'W' + S.hyroxWeek + '_D' + (S.selectedHyroxDay + 1);
  var _hxDone = !!(S.hyroxProgress[_hxDayKey] && S.hyroxProgress[_hxDayKey].done);
  var _hxCard = h('div', {style: 'border:1px solid ' + (_hxDone ? 'var(--ink-900,#0A0A09)' : 'var(--line,#D8D8D0)') + ';padding:14px 16px;margin:12px 0;background:' + (_hxDone ? 'rgba(62,92,58,0.04)' : 'var(--ivory2,#F4F4F0)')});
  _hxCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'SUIVI — ' + _hxDayKey));
  if (_hxDone) {
    var _doneEl = h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--success,#3E5C3A);margin-bottom:8px'});
    _doneEl.textContent = (window.isEnglish && window.isEnglish() ? '✓ Session completed on ' : '✓ Séance complétée le ') + (S.hyroxProgress[_hxDayKey].date || '');
    _hxCard.appendChild(_doneEl);
    _hxCard.appendChild(h('button', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey);background:none;border:none;cursor:pointer;padding:0;letter-spacing:1px;text-transform:uppercase',
      onclick: function() { S.hyroxProgress[_hxDayKey] = null; window.render(); }
    }, 'Corriger'));
  } else {
    var _hxDoneBtn = h('button', {'class': 'btn-primary', style: 'width:100%;margin:0', onclick: function() {
      if (!S.hyroxProgress) S.hyroxProgress = {};
      var _htd = new Date();
      var _hmm = _htd.getMonth() + 1, _hdd = _htd.getDate();
      var _hdateStr = _htd.getFullYear() + '-' + (_hmm < 10 ? '0' : '') + _hmm + '-' + (_hdd < 10 ? '0' : '') + _hdd;
      S.hyroxProgress[_hxDayKey] = { done: true, date: _hdateStr };
      // Save to S.sessionHistory for analytics volume tracker
      if (!S.sessionHistory) S.sessionHistory = {};
      var _hxLevel = S.hyroxLevel || 'intermediate';
      var _hxDurMap = {debutant: 60, beginner: 60, intermediate: 75, intermediaire: 75, advanced: 90, avance: 90, pro: 105, elite: 105};
      var _hxDur = (sess && sess.duration) || _hxDurMap[_hxLevel] || 75;
      var _hxKcal = estimateKcal('hyrox', _hxLevel, _hxDur);
      var _hxSessKey = S.selectedHyroxDay + '_' + _hdateStr;
      S.sessionHistory[_hxSessKey] = {duration: _hxDur, kcalBase: _hxKcal ? _hxKcal.base : 0, kcalEpoc: _hxKcal ? _hxKcal.epoc : 0, kcalTotal: _hxKcal ? _hxKcal.total : 0, date: new Date().toISOString(), sport: 'hyrox', trainingLoad: 'heavy', hxDayKey: _hxDayKey};
      (function(){ var _k=Object.keys(S.sessionHistory||{}).sort(); if(_k.length>365){_k.slice(0,_k.length-365).forEach(function(k){delete S.sessionHistory[k];});} })();
      if (window.SFCSymbiosis && window.SFCSymbiosis.processCompletedSession) {
        var _hxEx = [{name:'Hyrox1',sets:3,reps:10},{name:'Hyrox2',sets:3,reps:10},{name:'Hyrox3',sets:3,reps:10},{name:'Hyrox4',sets:3,reps:10},{name:'Hyrox5',sets:3,reps:10},{name:'Hyrox6',sets:3,reps:10}];
        try { window.SFCSymbiosis.processCompletedSession({sessionId: _hxSessKey, date: _hdateStr, exercises: _hxEx, trainingLoad: 'heavy'}); } catch(_he) {}
      } else if (typeof window.computeNutritionState === 'function') { try { window.computeNutritionState(true); } catch(_he) {} }
      if (window.GAMIFICATION) { try { window.GAMIFICATION.updateStreak(); } catch(e) {} }
      window.BLACKBOX && window.BLACKBOX.log('hyrox_session_done', {week: S.hyroxWeek, day: S.selectedHyroxDay + 1, level: _hxLevel});
      if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? '✓ Hyrox session validated — ' : '✓ Séance Hyrox validée — ') + _hxDayKey, 'success');
      window.render();
    }}, (window.isEnglish && window.isEnglish() ? '✓ Session done' : '✓ Séance terminée'));
    _hxCard.appendChild(_hxDoneBtn);
  }
  p.appendChild(_hxCard);
 })();

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 9; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ═══════════════════════════════════════
// PADEL MODULE
// ═══════════════════════════════════════

function renderPadelConfig(p) {
 if (!S.padelProfile || typeof S.padelProfile !== 'object' || Array.isArray(S.padelProfile)) S.padelProfile = {};
 // BUG-FIX: default padelDays — String(undefined) crashes the input value attr
 if (!S.padelDays || S.padelDays < 2) S.padelDays = 3;
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Padel'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>padel</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Technique, tactics and physical preparation.' : 'Technique, tactique et préparation physique.')));
 if (window.TIPS) TIPS.renderTip(p, 'sportGoal');

 p.appendChild(h('div', {'class': 'section-label'}, 'Objectif'));
 var og = h('div', {'class': 'card-grid-2'});
 (window.PADEL_GOALS || []).forEach(function(gl) {
 og.appendChild(h('div', {'class': 'sel-card' + (S.padelGoal === gl.id ? ' on' : ''), onclick: function(){ S.padelGoal = gl.id; window.render(); }}, [
 h('span', {'class': 'card-icon'}, gl.icon), h('div', {'class': 'card-name'}, gl.name), h('div', {'class': 'card-sub'}, gl.desc)
 ]));
 });
 p.appendChild(og);

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.level')));
 var lg = h('div', {'class': 'level-list'});
 (window.PADEL_LEVELS || []).forEach(function(lv) {
 lg.appendChild(h('div', {'class': 'level-item' + (S.padelLevel === lv.id ? ' on' : ''), onclick: function(){ S.padelLevel = lv.id; window.render(); }}, [
 h('div', {}, [h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name), h('div', {'class': 'level-desc'}, lv.desc)])
 ]));
 });
 p.appendChild(lg);

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.days')));
 var nw = h('div', {'class': 'num-input-wrap'});
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '5', value: String(S.padelDays), inputmode: 'numeric', oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 5) { S.padelDays = v; window.render(); } }, onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) { e.target.value = S.padelDays = 2; window.render(); } else if (v > 5) { e.target.value = S.padelDays = 5; window.render(); } } }));
 nw.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(nw);

 // Skill self-assessment
 p.appendChild(h('div', {'class': 'divider'}, [h('span', {'class': 'divider-line'}), h('span', {'class': 'divider-text'}, (window.isEnglish && window.isEnglish() ? 'Self-assessment (optional)' : (window.isEnglish && window.isEnglish() ? 'Self-assessment (optional)' : (window.isEnglish && window.isEnglish() ? 'Self-assessment (optional)' : 'Auto-évaluation (optionnel)')))), h('span', {'class': 'divider-line'})]));
 (window.PADEL_SKILLS || []).forEach(function(sk) {
 var row = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 row.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px'}, sk.name));
 var stars = h('div', {style: 'display:flex;gap:4px'});
 for (var i = 1; i <= 5; i++) {
 (function(rating) {
 var star = h('span', {style: 'cursor:pointer;font-size:18px;opacity:' + ((S.padelProfile[sk.id] || 0) >= rating ? '1' : '0.2'), onclick: function(){ S.padelProfile[sk.id] = S.padelProfile[sk.id] === rating ? 0 : rating; window.render(); }}, '');
 stars.appendChild(star);
 })(i);
 }
 row.appendChild(stars);
 p.appendChild(row);
 });

 p.appendChild(h('div', {style: 'height:24px'}));
 var ok = S.padelGoal && S.padelLevel;
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) { if (typeof window.generatePadelProgram !== 'function') { console.error('[padel] generatePadelProgram module not loaded'); return; } S.padelProgram = window.generatePadelProgram(S.padelDays, S.padelLevel, S.padelGoal); _sfcNotifySport('padel', S.padelLevel); S.padelWeek = 1; S.selectedPadelDay = 0; S.sStep = 12; window.render(); }
 }}, 'Concevoir mon programme'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

function renderPadelProgram(p) {
 if (!S.padelProgram) { if (typeof window.generatePadelProgram !== 'function') { p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-size:13px;color:var(--grey)'}, 'Module Padel non disponible. Rechargez la page.')); return; } S.padelProgram = window.generatePadelProgram(S.padelDays, S.padelLevel, S.padelGoal); }
 if (!S.padelProgram || !S.padelProgram.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable. Reload the page or reconfigure your plan.' : 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 11; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }
 if (!S.padelWeek || S.padelWeek < 1) S.padelWeek = 1;
 if (S.padelWeek > S.padelProgram.length) S.padelWeek = S.padelProgram.length;
 var week = S.padelProgram[S.padelWeek - 1];
 if (!week) return;

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Program Padel' : 'Programme Padel')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.padelWeek + '<br><em>' + week.phase + '</em>'}));
 var goalName = ''; (window.PADEL_GOALS || []).forEach(function(g){ if(g.id===S.padelGoal) goalName=g.name; });
 p.appendChild(h('p', {'class': 'subtitle'}, S.padelDays + (window.isEnglish && window.isEnglish() ? ' days/week — ' : ' jours/semaine — ') + goalName));
 p.appendChild(h('div', {style: 'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, week.notes));
 appendSportMedicalBanner(p, 'Padel');

 // Week navigation
 var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Previous week' : 'Semaine précédente'), disabled: S.padelWeek <= 1, onclick: function(){ S.padelWeek--; S.selectedPadelDay = 0; window.render(); }}, '←'));
 wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.padelWeek + ' / ' + S.padelProgram.length));
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Next week' : 'Semaine suivante'), disabled: S.padelWeek >= S.padelProgram.length, onclick: function(){ S.padelWeek++; S.selectedPadelDay = 0; window.render(); }}, '→'));
 p.appendChild(wn);

 // Day tabs
 var _padelSessions = week.sessions || [];
 // BUG-FIX: also guard against negative index (lower-bound was missing)
 if (S.selectedPadelDay === undefined || S.selectedPadelDay === null || S.selectedPadelDay < 0 || S.selectedPadelDay >= _padelSessions.length) S.selectedPadelDay = 0;
 var tabs = h('div', {'class': 'day-tabs'});
 _padelSessions.forEach(function(s, i) {
 tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedPadelDay === i ? ' active' : ''), onclick: function(){ S.selectedPadelDay = i; window.render(); }}, (window.isEnglish && window.isEnglish() ? 'Day ' : 'Jour ') + (i + 1)));
 });
 p.appendChild(tabs);

 var session = _padelSessions[S.selectedPadelDay];
 if (session) {
 var colors = {technique: 'var(--blue,#1A3A6A)', physical: 'var(--green,#3E5C3A)', match: 'var(--error,#7A1F1F)', tactics: 'var(--orange,#E86F1E)', recovery: 'var(--grey,#6B6B65)'};
 var card = h('div', {style: 'border-left:3px solid ' + (colors[session.type] || 'var(--black)') + ';padding:16px;margin:12px 0;background:var(--ivory2,#F4F4F0)'});
 card.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:12px'}, session.name));
 (session.exercises || []).forEach(function(ex, i) {
 var exDiv = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:13px;font-weight:500'}, (i + 1) + '. ' + ex.name));
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, ex.detail));
 if (ex.duration) exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2,#9A9A90);margin-top:2px'}, '⏱ ' + ex.duration));
 card.appendChild(exDiv);
 });
 if (session.notes) card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:12px;padding-top:8px;border-top:1px solid var(--ivory3)'}, session.notes));
 p.appendChild(card);
 }

 if (window.renderStrengthGrade) renderStrengthGrade(p);
 // BUG-FIX: missing kcal estimation card for Padel (all other sports have this)
 (function() {
  var padelLevel = S.padelLevel || 'intermediaire';
  var SESSION_DUR_PADEL = { debutant: 60, intermediaire: 75, avance: 90, elite: 90 };
  var padelDur = SESSION_DUR_PADEL[padelLevel] || 75;
  var padelKcal = estimateKcal('padel', padelLevel, padelDur);
  p.appendChild(buildKcalCard(padelKcal, padelDur));
 }());
 p.appendChild(h('div', {style: 'height:12px'}));
 (function() {
  var _pdDateStr = new Date().toISOString().slice(0, 10);
  var _pdKey = 'padel_' + (S.selectedPadelDay || 0) + '_' + _pdDateStr;
  var _pdDone = S.sessionHistory && S.sessionHistory[_pdKey];
  var _pdDur  = ({ debutant: 60, intermediaire: 75, avance: 90, competition: 90 }[S.padelLevel || 'intermediaire'] || 75);
  p.appendChild(h('button', { 'class': 'btn-primary', disabled: !!_pdDone,
    onclick: function() { _completeSportSession('padel', S.padelLevel || 'intermediaire', _pdDur, _pdKey); }
  }, _pdDone ? (window.isEnglish && window.isEnglish() ? '✓ Session logged' : '✓ Séance validée') : (window.isEnglish && window.isEnglish() ? '✓ Session done' : '✓ Séance terminée')));
 }());
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 11; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ═══════════════════════════════════════
// GOLF MODULE
// ═══════════════════════════════════════

function renderGolfConfig(p) {
 if (!S.golfProfile || typeof S.golfProfile !== 'object' || Array.isArray(S.golfProfile)) S.golfProfile = {};
 // BUG-FIX: default golfDays — String(undefined) crashes the input value attr
 if (!S.golfDays || S.golfDays < 2) S.golfDays = 3;
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Golf'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>golf</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Based on the methods of Dave Pelz & Butch Harmon.' : 'Basé sur les méthodes Dave Pelz & Butch Harmon.')));

 p.appendChild(h('div', {'class': 'section-label'}, 'Objectif'));
 var og = h('div', {'class': 'card-grid-2'});
 (window.GOLF_GOALS || []).forEach(function(gl) {
 og.appendChild(h('div', {'class': 'sel-card' + (S.golfGoal === gl.id ? ' on' : ''), onclick: function(){ S.golfGoal = gl.id; window.render(); }}, [
 h('span', {'class': 'card-icon'}, gl.icon), h('div', {'class': 'card-name'}, gl.name), h('div', {'class': 'card-sub'}, gl.desc)
 ]));
 });
 p.appendChild(og);

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.level')));
 var lg = h('div', {'class': 'level-list'});
 (window.GOLF_LEVELS || []).forEach(function(lv) {
 lg.appendChild(h('div', {'class': 'level-item' + (S.golfLevel === lv.id ? ' on' : ''), onclick: function(){ S.golfLevel = lv.id; window.render(); }}, [
 h('div', {}, [h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name), h('div', {'class': 'level-desc'}, lv.desc + ' (HC ' + lv.handicapRange + ')')])
 ]));
 });
 p.appendChild(lg);

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.days')));
 var nw = h('div', {'class': 'num-input-wrap'});
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '5', value: String(S.golfDays), inputmode: 'numeric', oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 5) { S.golfDays = v; window.render(); } }, onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) { e.target.value = S.golfDays = 2; window.render(); } else if (v > 5) { e.target.value = S.golfDays = 5; window.render(); } } }));
 nw.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(nw);

 // Handicap
 p.appendChild(h('div', {'class': 'section-label'}, 'Handicap actuel (optionnel)'));
 var hw = h('div', {'class': 'num-input-wrap'});
 hw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '0', max: '54', value: S.golfHandicap ? String(S.golfHandicap) : '', placeholder: 'HC', oninput: function(e){ var v = parseFloat(e.target.value); if (!isNaN(v)) S.golfHandicap = v; }}));
 hw.appendChild(h('span', {'class': 'num-unit'}, 'HC'));
 p.appendChild(hw);

 // Skill self-assessment
 p.appendChild(h('div', {'class': 'divider'}, [h('span', {'class': 'divider-line'}), h('span', {'class': 'divider-text'}, (window.isEnglish && window.isEnglish() ? 'Self-assessment (optional)' : 'Auto-évaluation (optionnel)')), h('span', {'class': 'divider-line'})]));
 (window.GOLF_SKILLS || []).forEach(function(sk) {
 var row = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 var left = h('div', {});
 left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px'}, sk.name));
 left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2);letter-spacing:1px;text-transform:uppercase'}, sk.category));
 row.appendChild(left);
 var stars = h('div', {style: 'display:flex;gap:4px'});
 for (var i = 1; i <= 5; i++) {
 (function(rating) {
 stars.appendChild(h('span', {style: 'cursor:pointer;font-size:18px;opacity:' + ((S.golfProfile[sk.id] || 0) >= rating ? '1' : '0.2'), onclick: function(){ S.golfProfile[sk.id] = S.golfProfile[sk.id] === rating ? 0 : rating; window.render(); }}, ''));
 })(i);
 }
 row.appendChild(stars);
 p.appendChild(row);
 });

 p.appendChild(h('div', {style: 'height:24px'}));
 var ok = S.golfGoal && S.golfLevel;
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) { if (typeof window.generateGolfProgram !== 'function') { console.error('[golf] generateGolfProgram module not loaded'); return; } S.golfProgram = window.generateGolfProgram(S.golfDays, S.golfLevel, S.golfGoal); _sfcNotifySport('golf', S.golfLevel); S.golfWeek = 1; S.selectedGolfDay = 0; S.sStep = 14; window.render(); }
 }}, 'Concevoir mon programme'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

function renderGolfProgram(p) {
 if (!S.golfProgram) { if (typeof window.generateGolfProgram !== 'function') { p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-size:13px;color:var(--grey)'}, 'Module Golf non disponible. Rechargez la page.')); return; } S.golfProgram = window.generateGolfProgram(S.golfDays, S.golfLevel, S.golfGoal); }
 if (!S.golfProgram || !S.golfProgram.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable. Reload the page or reconfigure your plan.' : 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 13; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }
 if (!S.golfWeek || S.golfWeek < 1) S.golfWeek = 1;
 if (S.golfWeek > S.golfProgram.length) S.golfWeek = S.golfProgram.length;
 var week = S.golfProgram[S.golfWeek - 1];
 if (!week) return;

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Program Golf' : 'Programme Golf')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.golfWeek + '<br><em>' + week.phase + '</em>'}));
 var goalName = ''; (window.GOLF_GOALS || []).forEach(function(g){ if(g.id===S.golfGoal) goalName=g.name; });
 p.appendChild(h('p', {'class': 'subtitle'}, S.golfDays + (window.isEnglish && window.isEnglish() ? ' days/week — ' : ' jours/semaine — ') + goalName + (S.golfHandicap ? ' — HC ' + S.golfHandicap : '')));
 p.appendChild(h('div', {style: 'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, week.notes));

 // Rappel Dave Pelz
 p.appendChild(h('div', {style: 'text-align:center;font-family:Georgia;font-size:11px;font-style:italic;color:var(--grey2,#9A9A90);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? '"60% of the score is played within 100m of the green" — Dave Pelz' : '"60% du score se joue à moins de 100m du green" — Dave Pelz')));
 appendSportMedicalBanner(p, 'Golf');

 // Week navigation
 var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Previous week' : 'Semaine précédente'), disabled: S.golfWeek <= 1, onclick: function(){ S.golfWeek--; S.selectedGolfDay = 0; window.render(); }}, '←'));
 wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.golfWeek + ' / ' + S.golfProgram.length));
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Next week' : 'Semaine suivante'), disabled: S.golfWeek >= S.golfProgram.length, onclick: function(){ S.golfWeek++; S.selectedGolfDay = 0; window.render(); }}, '→'));
 p.appendChild(wn);

 // Day tabs
 var _golfSessions = week.sessions || [];
 // BUG-FIX: also guard against negative index (lower-bound was missing)
 if (S.selectedGolfDay === undefined || S.selectedGolfDay === null || S.selectedGolfDay < 0 || S.selectedGolfDay >= _golfSessions.length) S.selectedGolfDay = 0;
 var tabs = h('div', {'class': 'day-tabs'});
 _golfSessions.forEach(function(s, i) {
 tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedGolfDay === i ? ' active' : ''), onclick: function(){ S.selectedGolfDay = i; window.render(); }}, (window.isEnglish && window.isEnglish() ? 'Day ' : 'Jour ') + (i + 1)));
 });
 p.appendChild(tabs);

 var session = _golfSessions[S.selectedGolfDay];
 if (session) {
 var colors = {short_game: 'var(--green,#3E5C3A)', long_game: 'var(--blue,#1A3A6A)', course_play: 'var(--orange,#E86F1E)', physical: 'var(--error,#7A1F1F)', mental: 'var(--grey,#6B6B65)'};
 var card = h('div', {style: 'border-left:3px solid ' + (colors[session.type] || 'var(--black)') + ';padding:16px;margin:12px 0;background:var(--ivory2,#F4F4F0)'});
 card.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:12px'}, session.name));
 (session.exercises || []).forEach(function(ex, i) {
 var exDiv = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:13px;font-weight:500'}, (i + 1) + '. ' + ex.name));
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, ex.detail));
 if (ex.duration) exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2,#9A9A90);margin-top:2px'}, '⏱ ' + ex.duration));
 card.appendChild(exDiv);
 });
 if (session.notes) card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:12px;padding-top:8px;border-top:1px solid var(--ivory3)'}, session.notes));
 p.appendChild(card);
 }

 // BUG-FIX: missing kcal estimation card for Golf (all other sports have this)
 (function() {
  var golfLevel = S.golfLevel || 'intermediaire';
  var SESSION_DUR_GOLF = { debutant: 90, intermediaire: 120, avance: 150, elite: 180 };
  var golfDur = SESSION_DUR_GOLF[golfLevel] || 120;
  var golfKcal = estimateKcal('golf', golfLevel, golfDur);
  p.appendChild(buildKcalCard(golfKcal, golfDur));
 }());
 p.appendChild(h('div', {style: 'height:12px'}));
 (function() {
  var _gfDateStr = new Date().toISOString().slice(0, 10);
  var _gfKey  = 'golf_' + (S.selectedGolfDay || 0) + '_' + _gfDateStr;
  var _gfDone = S.sessionHistory && S.sessionHistory[_gfKey];
  var _gfDur  = ({ debutant: 90, intermediaire: 120, avance: 150, scratch: 180 }[S.golfLevel || 'intermediaire'] || 120);
  p.appendChild(h('button', { 'class': 'btn-primary', disabled: !!_gfDone,
    onclick: function() { _completeSportSession('golf', S.golfLevel || 'intermediaire', _gfDur, _gfKey); }
  }, _gfDone ? (window.isEnglish && window.isEnglish() ? '✓ Session logged' : '✓ Séance validée') : (window.isEnglish && window.isEnglish() ? '✓ Session done' : '✓ Séance terminée')));
 }());
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 13; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ─── STEP 17: TRIATHLON CONFIG ───
function renderTriathlonConfig(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Triathlon / IRONMAN'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>triathlon</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Method: Jan Frodeno · Patrick Lange · Daniela Ryf · 80/20 Matt Fitzgerald · Joe Friel Training Bible' : 'Méthode Jan Frodeno · Patrick Lange · Daniela Ryf · 80/20 Matt Fitzgerald · Joe Friel Training Bible')));

 if (window.TIPS) window.TIPS.renderTip(p, 'triathlon');

 var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

 // ── Objectif de course ──
 p.appendChild(h('div', {'class': 'section-label'}, 'Objectif de course'));
 var goalGrid = h('div', {'class': 'card-grid-2'});
 (window.TRIATHLON_GOALS || []).forEach(function(g) {
 var isOn = S.triathlonGoal === g.id;
 goalGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), style: 'cursor:pointer', onclick: function() {
 S.triathlonGoal = g.id; window.render();
 }}, [
 h('span', {'class': 'card-icon'}, g.icon),
 h('div', {'class': 'card-name'}, g.name),
 h('div', {'class': 'card-sub'}, g.desc),
 h('div', {'class': 'card-tag'}, g.tag)
 ]));
 });
 p.appendChild(goalGrid);

 // ── Niveau ──
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.level')));
 var lvlList = h('div', {'class': 'level-list'});
 (window.TRIATHLON_LEVELS || []).forEach(function(lv) {
 var isOn = S.triathlonLevel === lv.id;
 lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: function() {
 S.triathlonLevel = lv.id; window.render();
 }}, [
 h('div', {}, [
 h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
 h('div', {'class': 'level-desc'}, lv.desc)
 ]),
 isOn ? h('span', {'class': 'level-badge'}, '') : h('span', {})
 ]));
 });
 p.appendChild(lvlList);

 // ── Discipline faible (optionnel) ──
 p.appendChild(h('div', {style: 'height:20px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Discipline to strengthen (optional)' : 'Discipline à renforcer (optionnel)')));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, (window.isEnglish && window.isEnglish() ? 'A bonus session will be added each week for this discipline' : 'Une séance bonus sera ajoutée chaque semaine pour cette discipline')));
 var discGrid = h('div', {style: 'display:flex;gap:10px;flex-wrap:wrap'});
 [{id: 'swim', name: (window.isEnglish && window.isEnglish() ? ' Swimming' : ' Natation')}, {id: 'bike', name: (window.isEnglish && window.isEnglish() ? ' Cycling' : ' Vélo')}, {id: 'run', name: (window.isEnglish && window.isEnglish() ? ' Running' : ' Course à pied')}].forEach(function(d) {
 var isOn = S.triathlonWeak === d.id;
 discGrid.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), onclick: function() {
 S.triathlonWeak = isOn ? null : d.id; window.render();
 }}, d.name));
 });
 p.appendChild(discGrid);

 // ── Infos sur les allures (optionnel) ──
 p.appendChild(h('div', {style: 'height:20px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, 'Allures actuelles (optionnel)'));

 var paceGrid = h('div', {style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-bottom:8px'});

 var swimWrap = h('div', {style: 'display:flex;flex-direction:column;gap:4px'});
 swimWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, ' Nage /100m'));
 swimWrap.appendChild(h('input', {'class': 'num-input', type: 'text', placeholder: '1:45', value: S.triathlonSwimPace || '', style: 'width:100%;text-align:center',
 oninput: function(e) { S.triathlonSwimPace = e.target.value; }
 }));
 paceGrid.appendChild(swimWrap);

 var bikeWrap = h('div', {style: 'display:flex;flex-direction:column;gap:4px'});
 bikeWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? ' Cycling km/h' : ' Vélo km/h')));
 bikeWrap.appendChild(h('input', {'class': 'num-input', type: 'number', placeholder: '32', value: S.triathlonBikePace || '', style: 'width:100%;text-align:center',
 oninput: function(e) { S.triathlonBikePace = e.target.value; }
 }));
 paceGrid.appendChild(bikeWrap);

 var runWrap = h('div', {style: 'display:flex;flex-direction:column;gap:4px'});
 runWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, ' Run min/km'));
 runWrap.appendChild(h('input', {'class': 'num-input', type: 'text', placeholder: '5:00', value: S.triathlonRunPace || '', style: 'width:100%;text-align:center',
 oninput: function(e) { S.triathlonRunPace = e.target.value; }
 }));
 paceGrid.appendChild(runWrap);

 var ftpWrap = h('div', {style: 'display:flex;flex-direction:column;gap:4px'});
 ftpWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, ' FTP (watts)'));
 ftpWrap.appendChild(h('input', {'class': 'num-input', type: 'number', placeholder: '200', value: S.triathlonFTP || '', style: 'width:100%;text-align:center',
 oninput: function(e) { var _v = parseInt(e.target.value, 10); S.triathlonFTP = (!isNaN(_v) && _v > 0) ? _v : null; }
 }));
 paceGrid.appendChild(ftpWrap);

 p.appendChild(paceGrid);

 // ── Date de course (optionnel) ──
 p.appendChild(h('div', {style: 'height:16px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, 'Date de course (optionnel)'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:10px'}, (window.isEnglish && window.isEnglish() ? 'The number of weeks will be automatically adjusted to your race date' : 'Le nombre de semaines sera adapté automatiquement à votre date de course')));
 var dateWrap = h('div', {style: 'display:flex;align-items:center;gap:12px'});
 var dateInput = h('input', {'class': 'num-input', type: 'date', value: S.triathlonRaceDate || '', style: 'flex:1',
 oninput: function(e) { S.triathlonRaceDate = e.target.value; }
 });
 dateWrap.appendChild(dateInput);
 if (S.triathlonRaceDate) {
  try {
   var rdMs = new Date(S.triathlonRaceDate).getTime();
   var nowMs2 = Date.now();
   var diffW = Math.floor((rdMs - nowMs2) / (7 * 24 * 3600 * 1000));
   if (diffW > 0) {
    dateWrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--grey);font-style:italic'}, diffW + (window.isEnglish && window.isEnglish() ? ' weeks' : ' semaines')));
   } else if (diffW <= 0) {
    dateWrap.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#C0392B'}, (window.isEnglish && window.isEnglish() ? 'Past date' : 'Date passée')));
   }
  } catch(e2) {}
 }
 p.appendChild(dateWrap);

 // Temps de course estimé si allures renseignées
 if (S.triathlonGoal && S.triathlonBikePace && S.triathlonRunPace && S.triathlonSwimPace) {
 var gObj = null;
 (window.TRIATHLON_GOALS || []).forEach(function(g) { if (g.id === S.triathlonGoal) gObj = g; });
 if (gObj) {
 try {
 var swimParts = (S.triathlonSwimPace || '1:45').split(':');
 var swimSecPer100 = parseInt(swimParts[0]) * 60 + parseInt(swimParts[1] || 0);
 var swimMin = Math.round((gObj.swimM / 100) * swimSecPer100 / 60);
 var _bikeSpeed = parseFloat(S.triathlonBikePace) || 0;
 var bikeMin = _bikeSpeed > 0 ? Math.round((gObj.bikeKm / _bikeSpeed) * 60) : 0;
 var runParts = (S.triathlonRunPace || '5:00').split(':');
 var runSecPerKm = parseInt(runParts[0]) * 60 + parseInt(runParts[1] || 0);
 var runMin = runSecPerKm > 0 ? Math.round((gObj.runKm * runSecPerKm) / 60) : 0;
 var totalMin = swimMin + bikeMin + runMin + (gObj.id === 'ironman' ? 10 : gObj.id === 'half' ? 6 : 4); // transitions
 var totalH = Math.floor(totalMin / 60);
 var totalM = totalMin % 60;
 var estCard = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin-top:8px'});
 estCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? '⏱ Estimated race time' : '⏱ Temps de course estimé')));
 estCard.appendChild(h('div', {style: 'font-size:18px;font-family:Georgia,serif;font-style:italic;color:var(--black)'},
 totalH + 'h' + (totalM < 10 ? '0' : '') + totalM));
 var detail = h('div', {style: 'font-size:11px;color:var(--grey);margin-top:4px;font-family:Helvetica Neue,Arial,sans-serif'});
 detail.appendChild(h('span', {}, ' ' + swimMin + 'min · '));
 detail.appendChild(h('span', {}, ' ' + Math.floor(bikeMin/60) + 'h' + (bikeMin%60 < 10 ? '0' : '') + (bikeMin%60) + ' · '));
 detail.appendChild(h('span', {}, ' ' + Math.floor(runMin/60) + 'h' + (runMin%60 < 10 ? '0' : '') + (runMin%60)));
 estCard.appendChild(detail);
 p.appendChild(estCard);
 } catch(e) {}
 }
 }

 // ── Boutons ──
 p.appendChild(h('div', {style: 'height:20px'}));
 var ok = S.triathlonGoal !== null && S.triathlonLevel !== null;
 if (!ok) {
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Choose your goal and level to continue.' : 'Choisissez votre objectif et votre niveau pour continuer.')));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function() {
 if (!ok) return;
 var triopts = {
  swimPace: S.triathlonSwimPace || null,
  bikeSpeed: S.triathlonBikePace || null,
  runPace: S.triathlonRunPace || null,
  raceDate: S.triathlonRaceDate || null,
  ftp: S.triathlonFTP || null
 };
 if (typeof window.generateTriathlonProgram !== 'function') { p.appendChild(h('p', {style:'text-align:center;padding:24px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px'}, (window.isEnglish && window.isEnglish() ? 'Triathlon module not loaded. Reload the page.' : 'Module triathlon non chargé. Rechargez la page.'))); return; }
 S.triathlonProgram = window.generateTriathlonProgram(S.triathlonGoal, S.triathlonLevel, S.triathlonWeak || null, triopts);
 _sfcNotifySport('triathlon', S.triathlonLevel);
 S.triathlonWeek = 1;
 S.selectedTriDay = 0;
 S.sStep = 18;
 if (window.BLACKBOX) window.BLACKBOX.log('triathlon_config', {goal: S.triathlonGoal, level: S.triathlonLevel, weak: S.triathlonWeak, raceDate: S.triathlonRaceDate || null, ftp: S.triathlonFTP || null});
 // Enregistrer les allures triathlon dans l'historique
 if (window.PERF_HISTORY) {
 if (S.triathlonSwimPace) PERF_HISTORY.recordTriathlonPace('swim', S.triathlonSwimPace, 'min/100m');
 if (S.triathlonBikePace) PERF_HISTORY.recordTriathlonPace('bike', S.triathlonBikePace, 'km/h');
 if (S.triathlonRunPace) PERF_HISTORY.recordTriathlonPace('run', S.triathlonRunPace, 'min/km');
 }
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? 'Generate my program →' : 'Générer mon programme →')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function() { S.sStep = 0; S.sportType = null; window.render(); }, html: backArrow + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}

// ─── STEP 18: TRIATHLON PROGRAM ───
function renderTriathlonProgram(p) {
 if (!S.triathlonProgram || !S.triathlonProgram.length) {
  var triopts2 = {
   swimPace: S.triathlonSwimPace || null,
   bikeSpeed: S.triathlonBikePace || null,
   runPace: S.triathlonRunPace || null,
   raceDate: S.triathlonRaceDate || null,
   ftp: S.triathlonFTP || null
  };
  if (typeof window.generateTriathlonProgram === 'function') {
   S.triathlonProgram = window.generateTriathlonProgram(S.triathlonGoal, S.triathlonLevel, S.triathlonWeak || null, triopts2);
  }
 }

 var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 var program = S.triathlonProgram;
 if (!program || !program.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable. Reload the page or reconfigure your plan.' : 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 17; window.render(); }, html: backArrow + 'Retour'}));
 return;
 }
 var totalWeeks = program.length;
 if (!S.triathlonWeek || S.triathlonWeek < 1) S.triathlonWeek = 1;
 if (S.triathlonWeek > totalWeeks) S.triathlonWeek = totalWeeks;

 var weekData = program[S.triathlonWeek - 1];
 if (!weekData) return;

 // ─── AVERTISSEMENT GROSSESSE (Triathlon) ───
 if (S.pregnant && window.isFemale(S)) {
   var _tpw = window.getPregnancySportWarning ? window.getPregnancySportWarning() : null;
   var _tpwC = h('div', {style: 'border-left:3px solid #FF6B6B;background:#FFF3CD;padding:12px 16px;margin-bottom:16px'});
   _tpwC.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#C00;margin-bottom:6px'}, 'Grossesse \u2014 Adaptations obligatoires'));
   _tpwC.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'}, _tpw ? _tpw.warning : (window.isEnglish && window.isEnglish() ? 'Reduce volume and intensity. Swimming recommended, stationary cycling allowed, light running Zone 1-2 only. Consult your doctor.' : 'R\u00e9duisez le volume et l\u2019intensit\u00e9. Natation recommand\u00e9e, v\u00e9lo station\u00e9 autoris\u00e9, course l\u00e9g\u00e8re Zone 1-2 uniquement. Consultez votre m\u00e9decin.')));
   p.appendChild(_tpwC);
 }
 appendSportMedicalBanner(p, 'Triathlon');

 var goalObj = null;
 (window.TRIATHLON_GOALS || []).forEach(function(g) { if (g.id === S.triathlonGoal) goalObj = g; });
 var levelObj = null;
 (window.TRIATHLON_LEVELS || []).forEach(function(l) { if (l.id === S.triathlonLevel) levelObj = l; });

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Triathlon / IRONMAN'));
 p.appendChild(h('h1', {html: (goalObj ? goalObj.name : 'Triathlon') + '<br><em>Programme</em>'}));
 var subtitleParts = [totalWeeks + (window.isEnglish && window.isEnglish() ? ' weeks' : ' semaines'), (levelObj ? levelObj.name : ''), '80/20', (window.isEnglish && window.isEnglish() ? 'Method: Jan Frodeno' : 'Méthode Jan Frodeno')];
 if (program[0] && program[0].raceDate) { try { subtitleParts.unshift('Course : ' + window.formatDate(program[0].raceDate, {day:'numeric',month:'short',year:'numeric'})); } catch(e) {} }
 p.appendChild(h('p', {'class': 'subtitle'}, subtitleParts.join(' · ')));

 appendWellnessBanner(p);

 // ── Zones de référence (si allures renseignées) ──
 var zref = program[0] && program[0].zoneRef;
 if (zref && (zref.swim || zref.bike || zref.run)) {
  var zoneCard = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
  zoneCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Your personalized zones' : 'Vos zones personnalisées')));
  var zoneGrid = h('div', {style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px'});
  if (zref.swim) {
   var sz = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'});
   sz.appendChild(h('div', {style: 'font-weight:bold;color:#1A3A6A;margin-bottom:4px'}, ' Nage'));
   sz.appendChild(h('div', {}, 'Z2 : ' + (zref.swim.z2 || '—')));
   sz.appendChild(h('div', {}, 'CSS : ' + (zref.swim.css || '—')));
   zoneGrid.appendChild(sz);
  }
  if (zref.bike) {
   var bz = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'});
   bz.appendChild(h('div', {style: 'font-weight:bold;color:var(--orange-ink,#7A3B0E);margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? ' Cycling' : ' Vélo')));
   bz.appendChild(h('div', {}, 'Z2 : ' + (zref.bike.z2 || '—')));
   bz.appendChild(h('div', {}, 'Sweetspot : ' + (zref.bike.sweetspot || '—')));
   if (zref.ftp) bz.appendChild(h('div', {style: 'color:#E67E22'}, 'FTP : ' + zref.ftp + 'W'));
   zoneGrid.appendChild(bz);
  }
  if (zref.run) {
   var rz = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'});
   rz.appendChild(h('div', {style: 'font-weight:bold;color:var(--success,#3E5C3A);margin-bottom:4px'}, ' Run'));
   rz.appendChild(h('div', {}, 'Z2 : ' + (zref.run.z2 || '—')));
   rz.appendChild(h('div', {}, 'Seuil : ' + (zref.run.z4 || '—')));
   zoneGrid.appendChild(rz);
  }
  zoneCard.appendChild(zoneGrid);
  p.appendChild(zoneCard);
 }

 // ── Navigation semaines ──
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Previous week' : 'Semaine précédente'), onclick: function() {
 if (S.triathlonWeek > 1) { S.triathlonWeek--; S.selectedTriDay = 0; window.render(); }
 }}, '←'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.triathlonWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Next week' : 'Semaine suivante'), onclick: function() {
 if (S.triathlonWeek < totalWeeks) { S.triathlonWeek++; S.selectedTriDay = 0; window.render(); }
 }}, '→'));
 p.appendChild(weekNav);

 // ── Info phase ──
 var phaseCard = h('div', {style: 'border-left:3px solid ' + (weekData.phaseColor || '#1A3A6A') + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + (weekData.phaseColor || '#1A3A6A') + ';margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Phase: ' : 'Phase : ') + weekData.phase));
 phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? '~' + weekData.totalHours + ' of training · 7 days' : '~' + weekData.totalHours + ' d\'entraînement · 7 jours')));
 if (weekData.isDeload) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);margin-top:6px;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? ' Recovery week — reduced volume' : ' Semaine de récupération — volume réduit')));
 if (weekData.isTaper) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--success,#3E5C3A);margin-top:6px;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? ' Taper — Volume reduced, intensity maintained' : ' Affûtage — Volume réduit, intensité maintenue')));
 p.appendChild(phaseCard);

 // ─── ESTIMATION CALORIQUE TRIATHLON ───
 (function() {
  var triLevel = S.triathlonLevel || 'intermediate';
  // Additionner les durees swim + bike + run de la semaine courante
  var triSessions = weekData.sessions || [];
  var totalTriMins = 0;
  triSessions.forEach(function(ts) {
   if (ts.durationMins) {
    totalTriMins += ts.durationMins;
   } else if (ts.duration && typeof ts.duration === 'string') {
    var m = ts.duration.match(/(\d+)\s*min/i);
    var h2 = ts.duration.match(/(\d+)\s*h/i);
    if (m) totalTriMins += parseInt(m[1]);
    if (h2) totalTriMins += parseInt(h2[1]) * 60;
   }
  });
  var SESSION_DUR_TRI = { beginner: 75, intermediate: 90, advanced: 105, elite: 120 };
  var triDur = totalTriMins > 0 ? Math.round(totalTriMins / Math.max(1, triSessions.length)) : (SESSION_DUR_TRI[triLevel] || 90);
  var triKcal = estimateKcal('triathlon', triLevel, triDur);
  p.appendChild(buildKcalCard(triKcal, triDur));
 }());

 // ── Tabs jours ──
 var sessions = weekData.sessions || [];
 if (S.selectedTriDay === undefined || S.selectedTriDay === null || S.selectedTriDay >= sessions.length) S.selectedTriDay = 0;
 var tabs = h('div', {'class': 'day-tabs', style: 'flex-wrap:wrap'});
 sessions.forEach(function(sess, i) {
 var icon = sess.discipline === 'swim' ? '' : sess.discipline === 'bike' ? '' : sess.discipline === 'run' ? '' : sess.discipline === 'brick' ? '' : '';
 tabs.appendChild(h('button', {
 'class': 'day-tab' + (S.selectedTriDay === i ? ' active' : ''),
 style: 'font-size:11px',
 onclick: function() { S.selectedTriDay = i; window.render(); }
 }, (sess.day || ('J' + (i + 1))) + ' ' + icon));
 });
 p.appendChild(tabs);

 // ── Séance du jour ──
 var sess = sessions[S.selectedTriDay];
 if (sess) {
 var discColorMap = {
 swim: '#1A3A6A', bike: '#7A3B0E', run: '#3E5C3A', brick: '#7A1F1F', rest: '#A8A8A0'
 };
 var discColor = discColorMap[sess.discipline] || '#0A0A09';

 var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid ' + discColor});
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + discColor + ';margin-bottom:6px'}, sess.type || ''));
 sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, (sess.icon || '') + ' ' + sess.name));
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, sess.desc || ''));

 if (sess.duration && sess.duration !== '—') {
 var durationRow = h('div', {style: 'display:flex;gap:16px;align-items:center;margin-bottom:10px;flex-wrap:wrap'});
 durationRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;color:' + discColor}, '⏱ ' + sess.duration));
 if (sess.zone) durationRow.appendChild(h('div', {style: 'background:' + discColor + ';color:#fff;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;padding:2px 8px'}, sess.zone));
 sessCard.appendChild(durationRow);
 }

 if (sess.detail) {
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;padding:12px;background:var(--ivory2);border:1px solid var(--border)'}, sess.detail));
 }
 p.appendChild(sessCard);
 }

 // ── Note de semaine ──
 if (weekData.notes) {
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;text-align:center;margin:16px 0;line-height:1.5'}, weekData.notes));
 }

 // ── Rappel transitions ──
 if (weekData.phase === 'Peak' || weekData.phase === 'Build 2') {
 var transCard = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin:12px 0'});
 transCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:6px'}, ' Rappel Transitions'));
 transCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.6'}, (window.isEnglish && window.isEnglish() ? 'T1 (Swim→Bike): remove wetsuit standing, clip shoes on pedals (advanced), helmet before touching bike · T2 (Bike→Run): rack bike, remove helmet, change shoes while running · Jan Frodeno often gains 30-60s in transitions vs other pros' : 'T1 (Nage→Vélo) : déshabiller néo debout, clip chaussures sur pédales (avancé), casque avant de toucher vélo · T2 (Vélo→Run) : rack vélo, enlever casque, changer chaussures en courant · Jan Frodeno gagne souvent 30-60s en transition vs les autres pros')));
 p.appendChild(transCard);
 }

 // ── Résumé semaine discipline ──
 var swCount = 0, biCount = 0, ruCount = 0, brCount = 0;
 sessions.forEach(function(s) {
 if (s.discipline === 'swim') swCount++;
 else if (s.discipline === 'bike') biCount++;
 else if (s.discipline === 'run') ruCount++;
 else if (s.discipline === 'brick') brCount++;
 });
 var sumRow = h('div', {style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0'});
 if (swCount) sumRow.appendChild(h('span', {'class': 'chip on'}, ' ' + swCount + ' nage'));
 if (biCount) sumRow.appendChild(h('span', {'class': 'chip on'}, ' ' + biCount + (window.isEnglish && window.isEnglish() ? ' cycling' : ' vélo')));
 if (ruCount) sumRow.appendChild(h('span', {'class': 'chip on'}, ' ' + ruCount + ' run'));
 if (brCount) sumRow.appendChild(h('span', {'class': 'chip on'}, ' ' + brCount + ' brick'));
 p.appendChild(sumRow);

 p.appendChild(h('div', {style: 'height:12px'}));
 (function() {
  var _triDateStr = new Date().toISOString().slice(0, 10);
  var _triKey  = 'tri_' + (S.selectedTriDay || 0) + '_' + _triDateStr;
  var _triDone = S.sessionHistory && S.sessionHistory[_triKey];
  var _triDur  = Math.round(totalTriMins > 0 ? totalTriMins / Math.max(1, triSessions.length) : ({ beginner: 75, intermediate: 90, advanced: 105, elite: 120 }[S.triathlonLevel || 'intermediate'] || 90));
  p.appendChild(h('button', { 'class': 'btn-primary', disabled: !!_triDone,
    onclick: function() { _completeSportSession('triathlon', S.triathlonLevel || 'intermediate', _triDur, _triKey); }
  }, _triDone ? (window.isEnglish && window.isEnglish() ? '✓ Session logged' : '✓ Séance validée') : (window.isEnglish && window.isEnglish() ? '✓ Session done' : '✓ Séance terminée')));
 }());
 p.appendChild(h('button', {'class': 'btn-back', onclick: function() { S.sStep = 17; window.render(); }, html: backArrow + 'Modifier la configuration'}));
 appendNutritionModeCTA(p);
}


// ═══════════════════════════════════════
// YOGA MODULE
// ═══════════════════════════════════════




// ─── STEP 19: YOGA ONBOARDING ───
function renderYogaOnboarding(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Yoga & Mobility' : 'Yoga & Mobilit\u00e9')));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>yoga</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Flexibility, strength, balance and mindfulness.' : 'Flexibilit\u00e9, force, \u00e9quilibre et pleine conscience.')));

 // Niveau
 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.level')));
 var lvlList = h('div', {'class': 'level-list'});
 [
 { id: 'debutant', icon: '\uD83C\uDF31', name: window.t('sport.beginner'), desc: (window.isEnglish && window.isEnglish() ? 'First postures, conscious breathing, 20-30 min sessions' : 'Premi\u00e8res postures, respiration consciente, s\u00e9ances de 20-30 min') },
 { id: 'intermediaire', icon: '\uD83C\uDF3F', name: window.t('sport.intermediate'), desc: (window.isEnglish && window.isEnglish() ? 'Fluid Vinyasa, balance, functional strength' : 'Vinyasa fluide, \u00e9quilibre, force fonctionnelle') },
 { id: 'avance', icon: '\uD83C\uDF4A', name: window.t('sport.advanced'), desc: 'Inversions, backbends profonds, pranayama' }
 ].forEach(function(lv) {
 var isOn = S.yogaLevel === lv.id;
 lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: function(){ S.yogaLevel = lv.id; window.render(); }}, [
 h('div', {}, [
 h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
 h('div', {'class': 'level-desc'}, lv.desc)
 ]),
 isOn ? h('span', {'class': 'level-badge'}, '\u2713') : h('span', {})
 ]));
 });
 p.appendChild(lvlList);

 // Objectif
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Objectif'));
 var objGrid = h('div', {'class': 'card-grid-2'});
 [
 { id: 'flexibilite', icon: '\uD83E\uDD38', name: (window.isEnglish && window.isEnglish() ? 'Flexibility' : 'Flexibilit\u00e9'), desc: (window.isEnglish && window.isEnglish() ? 'Increase flexibility, release tension' : 'Augmenter la souplesse, lib\u00e9rer les tensions') },
 { id: 'stress', icon: '\uD83E\uDDD8', name: (window.isEnglish && window.isEnglish() ? 'Stress & Sleep' : 'Stress & Sommeil'), desc: (window.isEnglish && window.isEnglish() ? 'Cortisol reduction, improved rest' : 'R\u00e9duction cortisol, am\u00e9lioration du repos') },
 { id: 'force', icon: '\uD83D\uDCAA', name: (window.isEnglish && window.isEnglish() ? 'Strength & Balance' : 'Force & \u00c9quilibre'), desc: (window.isEnglish && window.isEnglish() ? 'Functional core, joint stability' : 'Gainage fonctionnel, stabilit\u00e9 articulaire') },
 { id: 'recuperation', icon: '\uD83C\uDF1F', name: (window.isEnglish && window.isEnglish() ? 'Active recovery' : 'R\u00e9cup\u00e9ration active'), desc: (window.isEnglish && window.isEnglish() ? 'Sport complement, mobility, regeneration' : 'Compl\u00e9ment sport, mobilit\u00e9, r\u00e9g\u00e9n\u00e9ration') }
 ].forEach(function(obj) {
 var isOn = S.yogaObjectif === obj.id;
 objGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), onclick: function(){ S.yogaObjectif = obj.id; window.render(); }}, [
 h('span', {'class': 'card-icon'}, obj.icon),
 h('div', {'class': 'card-name'}, obj.name),
 h('div', {'class': 'card-sub'}, obj.desc)
 ]));
 });
 p.appendChild(objGrid);

 // Jours par semaine
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.days')));
 var nw = h('div', {'class': 'num-input-wrap'});
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '6', value: String(S.yogaDays || 3), inputmode: 'numeric',
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 6) { S.yogaDays = v; } },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) { e.target.value = '2'; S.yogaDays = 2; } else if (v > 6) { e.target.value = '6'; S.yogaDays = 6; } }
 }));
 nw.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(nw);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? '2 to 6 days per week' : '2 \u00e0 6 jours par semaine')));

 // Dur\u00e9e de s\u00e9ance
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, (window.isEnglish && window.isEnglish() ? 'Session duration' : 'Dur\u00e9e de s\u00e9ance')));
 var durGrid = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px'});
 ['20min', '30min', '45min', '60min'].forEach(function(dur) {
 var isOn = S.yogaDuration === dur;
 durGrid.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), onclick: function(){ S.yogaDuration = dur; window.render(); }}, dur));
 });
 p.appendChild(durGrid);

 // Style pr\u00e9f\u00e9r\u00e9
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, (window.isEnglish && window.isEnglish() ? 'Preferred style' : 'Style pr\u00e9f\u00e9r\u00e9')));
 var styleGrid = h('div', {'class': 'card-grid-2'});
 [
 { id: 'hatha', icon: '\u2600\uFE0F', name: 'Hatha', desc: (window.isEnglish && window.isEnglish() ? 'Gentle sessions, held postures, accessible' : 'S\u00e9ances douces, postures tenues, accessible') },
 { id: 'vinyasa', icon: '\uD83C\uDF00', name: 'Vinyasa', desc: (window.isEnglish && window.isEnglish() ? 'Dynamic sequences, continuous flow' : 'Encha\u00eenements dynamiques, flux continu') },
 { id: 'yin', icon: '\uD83C\uDF19', name: 'Yin', desc: (window.isEnglish && window.isEnglish() ? 'Long postures (3-5 min), deep stretching' : 'Postures longues (3-5 min), \u00e9tirements profonds') },
 { id: 'ashtanga', icon: '\uD83D\uDD25', name: 'Ashtanga', desc: (window.isEnglish && window.isEnglish() ? 'Fixed series, high intensity, strict discipline' : 'S\u00e9ries fix\u00e9es, intensit\u00e9 \u00e9lev\u00e9e, discipline stricte') }
 ].forEach(function(st) {
 var isOn = S.yogaStyle === st.id;
 styleGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), onclick: function(){ S.yogaStyle = st.id; window.render(); }}, [
 h('span', {'class': 'card-icon'}, st.icon),
 h('div', {'class': 'card-name'}, st.name),
 h('div', {'class': 'card-sub'}, st.desc)
 ]));
 });
 p.appendChild(styleGrid);

 p.appendChild(h('div', {style: 'height:20px'}));
 var ok = S.yogaLevel && S.yogaObjectif;
 if (!ok) {
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Select a level and an objective' : 'S\u00e9lectionnez un niveau et un objectif')));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) {
 if (!S.yogaDays) S.yogaDays = 3;
 if (!S.yogaDuration) S.yogaDuration = '30min';
 if (!S.yogaStyle) S.yogaStyle = 'hatha';
 S.yogaWeek = 1;
 S.yogaDay = 0;
 S.sStep = 21;
 window.BLACKBOX && window.BLACKBOX.log('yoga_config', { level: S.yogaLevel, objectif: S.yogaObjectif, days: S.yogaDays, duration: S.yogaDuration, style: S.yogaStyle });
 window.render();
 }
 }}, (window.isEnglish && window.isEnglish() ? 'Generate my program' : 'G\u00e9n\u00e9rer mon programme')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── Yoga Session Generator ───────────────────────────────────────────────────
var _YOGA_POOLS = {
 flexibilite: {
  debutant: [
   { name: 'Cat-Cow (Marjaryasana-Bitilasana)', duration: '3 min', desc: '10 cycles lents, articulation vertèbre par vertèbre', focus: 'Mobilité colonne' },
   { name: 'Uttanasana (flexion avant)',         duration: '3 min', desc: 'Genoux légers fléchis, tête lourde',               focus: 'Ischio-jambiers' },
   { name: 'Lézard (Anjaneyasana)',              duration: '4 min', desc: '2 min par côté, bassin bas',                      focus: 'Fléchisseurs hanche' },
   { name: 'Pigeon préparatoire',                duration: '4 min', desc: '2 min par côté, option bolster',                   focus: 'Hanches externes' },
   { name: 'Torsion couchée',                   duration: '3 min', desc: '90 sec par côté, épaule au sol',              focus: 'Colonne vertébrale' },
   { name: 'Supta Baddha Konasana',             duration: '3 min', desc: 'Papillon couché, relâchement complet',              focus: 'Adducteurs / Bassin' },
   { name: 'Savasana',                          duration: '5 min', desc: 'Scan corporel, relâchement progressif',              focus: 'Intégration' }
  ],
  intermediaire: [
   { name: 'Salutation au soleil A+B',          duration: '7 min', desc: '3 rounds A + 2 rounds B, respiration Ujjayi',   focus: 'Échauffement vinyasa' },
   { name: 'Prasarita Padottanasana',           duration: '4 min', desc: 'Jambes écartées, 3 variantes',                    focus: 'Ischio / Adducteurs' },
   { name: 'Pigeon (Eka Pada Rajakapotasana)',  duration: '6 min', desc: '3 min par côté, relâchement profond',          focus: 'Hanches / Psoas' },
   { name: 'Hanumanasana (préparation)',         duration: '5 min', desc: 'Fente basse avec blocs, progression douce',     focus: 'Flexibilité hanche' },
   { name: 'Supta Padangusthasana',             duration: '4 min', desc: '2 min par côté, sangle si besoin',               focus: 'Chaîne postérieure' },
   { name: 'Paschimottanasana',                 duration: '4 min', desc: 'Flexion assise, micro-flexion genoux',              focus: 'Dos / Ischio-jambiers' },
   { name: 'Savasana',                          duration: '5 min', desc: 'Intégration des ouvertures, respiration libre',   focus: 'Intégration' }
  ],
  avance: [
   { name: 'Surya Namaskar A+B enchâîné',      duration: '10 min', desc: '5 rounds fluides, Chaturanga contrôlé',   focus: 'Échauffement complet' },
   { name: 'Hanumanasana',                      duration: '6 min',  desc: '3 min par côté, descente progressive',          focus: 'Grand écart / Psoas' },
   { name: 'Kapotasana (pigeon roi)',            duration: '8 min',  desc: '4 min par côté, ouverture profonde',             focus: 'Flexibilité avancée' },
   { name: 'Paschimottanasana tenu',            duration: '5 min',  desc: 'Genoux micro-fléchis, respiration dorsale',        focus: 'Chaîne postérieure' },
   { name: 'Supta Virasana',                    duration: '5 min',  desc: 'Bolster sous le dos, respiration lente',             focus: 'Quadriceps / Flexion' },
   { name: 'Parivritta Trikonasana',            duration: '4 min',  desc: '2 min par côté, torsion profonde',             focus: 'Rotation thoracique' },
   { name: 'Savasana',                          duration: '8 min',  desc: 'Yoga Nidra léger, intégration profonde',         focus: 'Intégration' }
  ]
 },
 stress: {
  debutant: [
   { name: 'Nadi Shodhana (pranayama)',         duration: '5 min', desc: 'Respiration alternante, 10 cycles lents',         focus: 'Système nerveux' },
   { name: 'Balasana (enfant)',                 duration: '3 min', desc: 'Bras allongés, front au sol, relâchement',      focus: 'Récupération' },
   { name: 'Supta Baddha Konasana',             duration: '5 min', desc: 'Papillon couché, bolster sous les genoux',       focus: 'Parasympathique' },
   { name: 'Viparita Karani (jambes au mur)',   duration: '5 min', desc: 'Jambes verticales, yeux fermés',               focus: 'Relaxation profonde' },
   { name: 'Torsion couchée douce',              duration: '4 min', desc: '2 min par côté, sans forcer',                  focus: 'Décompression spinale' },
   { name: 'Yoga Nidra intro',                  duration: '3 min', desc: 'Scan corporel rapide, visualisation calme',        focus: 'Détente mentale' },
   { name: 'Savasana guidée',                    duration: '6 min', desc: 'Cohérence cardiaque, relâchement complet',      focus: 'Intégration' }
  ],
  intermediaire: [
   { name: 'Pranayama 4-7-8',                  duration: '5 min', desc: 'Inspire 4 s, retien 7 s, expire 8 s',             focus: 'Système nerveux' },
   { name: 'Balasana + Rocking',               duration: '3 min', desc: 'Balancement doux, massage crâne',               focus: 'Récupération active' },
   { name: 'Yin Pigeon',                        duration: '6 min', desc: '3 min par côté, tenu passif',                   focus: 'Relâchement fascias' },
   { name: 'Viparita Karani',                   duration: '6 min', desc: 'Jambes au mur, couverture si froid',               focus: 'Parasympathique' },
   { name: 'Ardha Matsyendrasana',              duration: '4 min', desc: '2 min par côté, torsion assise douce',        focus: 'Détox / Digestion' },
   { name: 'Ananda Balasana (happy baby)',      duration: '3 min', desc: 'Balancement latéral, respiration profonde',      focus: 'Bas du dos / Hanches' },
   { name: 'Savasana guidée longue',               duration: '8 min', desc: 'Visualisation positive, scan de détente',     focus: 'Intégration' }
  ],
  avance: [
   { name: 'Kapalabhati + Bhramari',            duration: '6 min', desc: 'Kapala 2 min, Bhramari 4 min, vibration calme',   focus: 'Régulation neuro' },
   { name: 'Yin Frog (Mandukasana)',            duration: '5 min', desc: 'Grenouille longue, tenu passif profond',           focus: 'Hanches / Adducteurs' },
   { name: 'Melting Heart (Anahatasana)',       duration: '5 min', desc: 'Poitrine au sol, bras étendus, relâchement',    focus: 'Ouverture cœur' },
   { name: 'Sleeping Swan (Yin Pigeon)',        duration: '8 min', desc: '4 min par côté, gravité seule',               focus: 'Relâchement profond' },
   { name: 'Viparita Karani + bolster',         duration: '6 min', desc: 'Bassin surélevé, inversion douce',              focus: 'Parasympathique' },
   { name: 'Yoga Nidra',                        duration: '5 min', desc: 'Rotation de conscience 61 points',                  focus: 'Sommeil profond' },
   { name: 'Savasana + Nidra',                 duration: '10 min', desc: 'Nidra guidé, état hypnagogique',               focus: 'Intégration' }
  ]
 },
 force: {
  debutant: [
   { name: 'Salutation au soleil A',            duration: '5 min', desc: '5 rounds dynamiques, pousser dans le sol',        focus: 'Échauffement' },
   { name: 'Guerrier I + II',                   duration: '5 min', desc: '3 cycles chaque côté, cuisses actives',          focus: 'Jambes / Hanches' },
   { name: 'Planche (Kumbhakasana)',             duration: '3 min', desc: '3 × 30 sec, corps aligné tête-talons',         focus: 'Gainage core' },
   { name: 'Chaturanga (genoux)',                duration: '3 min', desc: '3 × 5 reps, coudes serrés corps',                focus: 'Triceps / Pectoraux' },
   { name: 'Navasana demi (Ardha Navasana)',     duration: '3 min', desc: '3 × 15 sec, dos droit, respiration',             focus: 'Abdominaux profonds' },
   { name: 'Balasana (récupération)',              duration: '2 min', desc: 'Relâchement actif post-effort',                 focus: 'Récupération' },
   { name: 'Savasana',                          duration: '5 min', desc: 'Intégration neuromusculaire, scan corporel',     focus: 'Intégration' }
  ],
  intermediaire: [
   { name: 'Salutation au soleil A+B',          duration: '8 min', desc: '3 rounds A + 3 rounds B, chaleur active',         focus: 'Échauffement' },
   { name: 'Guerrier III',                      duration: '4 min', desc: '2 min par côté, Drishti fixe',                   focus: 'Équilibre / Gainage' },
   { name: 'Crow pose (Bakasana)',              duration: '5 min', desc: '3 tentatives × 15 sec, engagement core',         focus: 'Force bras / Concentration' },
   { name: 'Chaturanga série complète',         duration: '4 min', desc: '4 × 5 reps, transition fluide',                  focus: 'Chaîne antérieure' },
   { name: 'Navasana + Ardha Navasana',         duration: '4 min', desc: '3 cycles, 20 sec chaque, respiration',             focus: 'Core profond' },
   { name: 'Vasisthasana (planche latérale)',    duration: '3 min', desc: '3 × 20 sec par côté, hanches hautes',       focus: 'Obliques / Épaules' },
   { name: 'Savasana',                          duration: '5 min', desc: 'Récupération neuromusculaire',                    focus: 'Intégration' }
  ],
  avance: [
   { name: 'Surya Namaskar A+B × 5',              duration: '10 min', desc: 'Enchâîné, Chaturanga complet, chaleur max',  focus: 'Échauffement complet' },
   { name: 'Handstand prep (Mukha Vrksasana)',  duration: '6 min',  desc: 'Kicks contre mur, alignement strict',             focus: 'Inversion / Force' },
   { name: 'Crow → Tripod Headstand',            duration: '6 min',  desc: 'Transition bras plié, 3 essais × 20 sec',       focus: 'Équilibre / Inversion' },
   { name: 'Warrior III + Demi-lune',          duration: '5 min',  desc: '2.5 min par côté, enchâîné sans pause',    focus: 'Équilibre dynamique' },
   { name: 'Navasana avancé (full V)',            duration: '4 min',  desc: '4 × 30 sec, jambes tendues, respiration',        focus: 'Core avancé' },
   { name: 'Pincha Mayurasana',                 duration: '5 min',  desc: 'Forearm stand, 3 essais × 20 sec',                focus: 'Force / Inversion' },
   { name: 'Savasana',                          duration: '8 min',  desc: 'Récupération neuromusculaire profonde',           focus: 'Intégration' }
  ]
 }
};

function _yogaPosePools(objective, level) {
 var obj = (objective === 'recuperation') ? 'stress' : (objective || 'flexibilite');
 var lvl = (level === 'avance') ? 'avance' : (level === 'intermediaire') ? 'intermediaire' : 'debutant';
 return (_YOGA_POOLS[obj] && _YOGA_POOLS[obj][lvl]) || _YOGA_POOLS.flexibilite.debutant;
}

function _yogaApplyStyle(poses, style) {
 if (style === 'hatha' || !style) return poses;
 return poses.map(function(p) {
  var isSavasana = p.focus === 'Intégration';
  var mins = parseInt(p.duration);
  var p2 = { name: p.name, desc: p.desc, focus: p.focus, duration: p.duration };
  if (style === 'yin' && !isSavasana && !isNaN(mins) && mins < 10) {
   p2.duration = Math.min(mins * 2, 8) + ' min';
   p2.desc = p.desc + ' — tenu passif, gravité seule';
  } else if (style === 'vinyasa' && !isSavasana && !isNaN(mins) && mins > 2) {
   p2.duration = Math.max(mins - 1, 2) + ' min';
   p2.desc = p.desc + ' — enchâîné avec Ujjayi';
  } else if (style === 'ashtanga' && !isSavasana) {
   p2.desc = p.desc + ' — Ashtanga: souffle-mouvement synchronisés';
  }
  return p2;
 });
}

function generateYogaSession(opts) {
 if (!opts || typeof opts !== 'object') opts = {};
 var objective = opts.objective || 'flexibilite';
 var style     = opts.style || 'hatha';
 var level     = opts.level || 'debutant';
 var duration  = opts.duration || '30min';
 var maxPoses  = duration === '20min' ? 4 : duration === '30min' ? 5 : duration === '45min' ? 6 : 7;
 var pool      = _yogaPosePools(objective, level);
 var styled    = _yogaApplyStyle(pool, style);
 var savasana  = styled[styled.length - 1];
 var body      = styled.slice(0, styled.length - 1).slice(0, maxPoses - 1);
 return body.concat([savasana]);
}

// ─── STEP 21: YOGA PROGRAM ───
function renderYogaProgram(p) {
 // FIX BUG 2026-04-26 : guard manquant sur yogaObjectif — config incomplète → session card vide
 if (!S.yogaLevel || !S.yogaObjectif) { S.sStep = 19; setTimeout(function() { if (window.render) window.render(); }, 0); return; }
 if (!S.yogaDays) S.yogaDays = 3;
 if (!S.yogaDuration) S.yogaDuration = '30min';
 if (!S.yogaStyle) S.yogaStyle = 'hatha';
 if (!S.yogaWeek) S.yogaWeek = 1;
 if (S.yogaDay === undefined || S.yogaDay === null) S.yogaDay = 0;
 // BUG-FIX: clamp yogaDay below yogaDays — stale value from a higher day-count crashes the session card
 if (S.yogaDay >= S.yogaDays) S.yogaDay = 0;

 var totalWeeks = 4;
 if (S.yogaWeek > totalWeeks) S.yogaWeek = totalWeeks;
 if (S.yogaWeek < 1) S.yogaWeek = 1;

 var weekData = YOGA_WEEKS[S.yogaWeek - 1];
 var poses = generateYogaSession({ objective: S.yogaObjectif, style: S.yogaStyle, level: S.yogaLevel, duration: S.yogaDuration });

 // Pregnancy warning
 var pregWarn = getPregnancySportWarning();
 if (pregWarn) {
 var pw = h('div', {style: 'background:rgba(122,31,31,0.06);border-left:3px solid var(--error,#7A1F1F);padding:12px 14px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--error,#7A1F1F);line-height:1.6'});
 pw.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\u26A0 Pregnancy \u2014 Prenatal Yoga' : '\u26A0 Grossesse \u2014 Yoga pr\u00e9natal')));
 pw.appendChild(h('div', {}, pregWarn));
 pw.appendChild(h('div', {style: 'margin-top:6px;font-weight:600'}, (window.isEnglish && window.isEnglish() ? 'Avoid: Inversions (Navasana, headstand), abdominal compression, supine >20 min. T2/T3 variants: seated or side-lying postures.' : '\u00c9viter : Inversions (Navasana, poirier), compression abdominale, d\u00e9cubitus dorsal >20 min. Variantes T2/T3 : postures assises ou en appui lat\u00e9ral.')));
 p.appendChild(pw);
 }
 appendSportMedicalBanner(p, 'Yoga');
 // Bridge nutrition — guard première fois uniquement
 if (!S._yogaNotified) {
  S._yogaNotified = true;
  var _yogaBridgeLv = S.yogaObjectif === 'force' ? 'avance' : S.yogaObjectif === 'flexibilite' ? 'intermediaire' : 'debutant';
  _sfcNotifySport('yoga', _yogaBridgeLv);
 }

 // Medical warnings
 var med = S.muscuMedical || {};
 if ((med.herniaDisc || med.lowerBack) && (!Array.isArray(S.medical) || S.medical.indexOf('lombaire') === -1)) {
 var hw = h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--orange-ink,#7A3B0E);line-height:1.6'});
 hw.appendChild(h('div', {style: 'font-weight:700;color:var(--orange-ink,#7A3B0E);margin-bottom:4px'}, '\u26A0 Hernie discale / Bas du dos'));
 hw.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? 'Avoid deep forward fold without bent knees. Paschimottanasana: always keep a micro-bend in the knees. Prefer Balasana, gentle seated twists.' : '\u00c9viter forward fold profond sans genoux fl\u00e9chis. Paschimottanasana : toujours garder une micro-flexion des genoux. Privil\u00e9gier Balasana, torsions douces assises.')));
 p.appendChild(hw);
 }
 if (med.osteoporosis) {
 var ow = h('div', {style: 'background:rgba(62,92,58,0.06);border-left:3px solid var(--ink-900,#0A0A09);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--success,#3E5C3A);line-height:1.6'});
 ow.appendChild(h('div', {style: 'font-weight:700;color:var(--success,#3E5C3A);margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\uD83E\uDDB4 Osteoporosis' : '\uD83E\uDDB4 Ost\u00e9oporose')));
 ow.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? 'Avoid extreme flexions (deep Paschimottanasana), single-leg postures without support. Favor standing bilateral postures (Warrior I/II with support if needed). Mountain pose, Virabhadrasana I/II beneficial for bone density.' : '\u00c9viter flexions extr\u00eames (Paschimottanasana profond), postures sur une jambe sans support. Favoriser postures debout en appui bim\u00e9ral (Guerrier I/II avec support si besoin). Mountain pose, Virabhadrasana I/II b\u00e9n\u00e9fiques pour la densit\u00e9 osseuse.')));
 p.appendChild(ow);
 }
 if (med.knees || med.acl || med.meniscus) {
 var kw = h('div', {style: 'background:var(--bluebg,rgba(26,58,106,.06));border-left:3px solid var(--blue,#1A3A6A);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#0D47A1;line-height:1.6'});
 kw.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\uD83E\uDDB5 Knees / ACL / Meniscus' : '\uD83E\uDDB5 Genoux / LCA / M\u00e9nisque')));
 kw.appendChild(h('div', {}, (window.isEnglish && window.isEnglish() ? 'Avoid deep knee flexion (full lotus, deep Malasana). Warrior II: do not exceed 90\u00b0. Option: hero pose (Virasana) replaced by Sukhasana if uncomfortable.' : '\u00c9viter flexion profonde du genou (lotus complet, Malasana profond). Guerrier II : ne pas d\u00e9passer 90\u00b0. Option : pose h\u00e9ros (Virasana) remplac\u00e9e par Sukhasana si g\u00eane.')));
 p.appendChild(kw);
 }

 p.appendChild(h('div', {'class': 'eyebrow'}, (window.isEnglish && window.isEnglish() ? 'Program Yoga' : 'Programme Yoga')));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.yogaWeek + '<br><em>' + weekData.phase + '</em>'}));

 var objNames = window.isEnglish && window.isEnglish() ? { flexibilite: 'Flexibility', stress: 'Stress & Sleep', force: 'Strength & Balance', recuperation: 'Active recovery' } : { flexibilite: 'Flexibilit\u00e9', stress: 'Stress & Sommeil', force: 'Force & \u00c9quilibre', recuperation: 'R\u00e9cup\u00e9ration active' };
 var styleNames = { hatha: 'Hatha', vinyasa: 'Vinyasa', yin: 'Yin', ashtanga: 'Ashtanga' };
 p.appendChild(h('p', {'class': 'subtitle'}, (S.yogaDays || '') + (window.isEnglish && window.isEnglish() ? ' days/week \u00b7 ' : ' jours/semaine \u00b7 ') + (S.yogaDuration || '') + ' \u00b7 ' + (styleNames[S.yogaStyle] || S.yogaStyle || '') + ' \u00b7 ' + (objNames[S.yogaObjectif] || '')));

 // Week navigation
 var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.yogaWeek <= 1, onclick: function(){ if(S.yogaWeek > 1){ S.yogaWeek--; S.yogaDay = 0; window.render(); } }}, '\u2190'));
 wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.yogaWeek + ' / 4'));
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.yogaWeek >= 4, onclick: function(){ if(S.yogaWeek < 4){ S.yogaWeek++; S.yogaDay = 0; window.render(); } }}, '\u2192'));
 p.appendChild(wn);

 // Phase card
 var phaseCard = h('div', {style: 'border-left:3px solid #0A0A09;padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:#0A0A09;margin-bottom:4px'}, weekData.phase + ' \u2014 ' + weekData.theme));
 phaseCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey)'}, weekData.focus));
 p.appendChild(phaseCard);

 // Day tabs
 var tabs = h('div', {'class': 'day-tabs'});
 for (var di = 0; di < S.yogaDays; di++) {
 (function(idx) {
 tabs.appendChild(h('button', {'class': 'day-tab' + (S.yogaDay === idx ? ' active' : ''), onclick: function(){ S.yogaDay = idx; window.render(); }}, (window.isEnglish && window.isEnglish() ? 'Day ' : 'Jour ') + (idx + 1)));
 })(di);
 }
 p.appendChild(tabs);

 // Session card
 var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #0A0A09'});
 sessCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#0A0A09;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? 'Yoga Session' : 'S\u00e9ance Yoga')));
 sessCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? '\uD83E\uDDD8 Session ' + (S.yogaDay + 1) + ' \u2014 ' + weekData.phase : '\uD83E\uDDD8 S\u00e9ance ' + (S.yogaDay + 1) + ' \u2014 ' + weekData.phase)));
 sessCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:12px'}, S.yogaDuration + ' \u00b7 ' + (styleNames[S.yogaStyle] || S.yogaStyle)));

 // Poses list
 poses.forEach(function(pose, i) {
 var poseDiv = h('div', {style: 'padding:10px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 var poseHeader = h('div', {style: 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px'});
 var poseInfo = h('div', {style: 'flex:1;min-width:0'});
 poseInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;margin-bottom:2px'}, (i + 1) + '. ' + pose.name));
 poseInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:2px'}, pose.desc));
 poseInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#0A0A09'}, '\uD83C\uDFAF ' + pose.focus));
 poseHeader.appendChild(poseInfo);
 poseHeader.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);white-space:nowrap;flex-shrink:0'}, '\u23F1 ' + pose.duration));
 poseDiv.appendChild(poseHeader);
 sessCard.appendChild(poseDiv);
 });

 p.appendChild(sessCard);

 // Week notes
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;text-align:center;margin:12px 0;line-height:1.5'}, weekData.notes));

 // Scientific benefit for selected objectif
 var benefKey = S.yogaObjectif === 'recuperation' ? 'sommeil' : S.yogaObjectif;
 if (benefKey && YOGA_BENEFITS[benefKey]) {
 var benefDiv = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin:12px 0'});
 benefDiv.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? '\uD83D\uDCCA Studied benefit' : '\uD83D\uDCCA B\u00e9n\u00e9fice \u00e9tudi\u00e9')));
 benefDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.6'}, YOGA_BENEFITS[benefKey]));
 p.appendChild(benefDiv);
 }

 // All benefits summary
 var allBenef = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin:12px 0'});
 allBenef.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? '\uD83C\uDF31 Yoga benefits (scientific evidence)' : '\uD83C\uDF31 B\u00e9n\u00e9fices du yoga (preuves scientifiques)')));
 var benefLabels = window.isEnglish && window.isEnglish() ? { flexibilite: 'Flexibility', stress: 'Stress/Sleep', force: 'Core strength', sommeil: 'Sleep' } : { flexibilite: 'Flexibilit\u00e9', stress: 'Stress/Sommeil', force: 'Force core', sommeil: 'Sommeil' };
 Object.keys(YOGA_BENEFITS).forEach(function(k) {
 var row = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.5;padding:3px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 row.appendChild(h('span', {style: 'color:#0A0A09;font-weight:600'}, (benefLabels[k] || k) + ' \u2014 '));
 row.appendChild(h('span', {}, YOGA_BENEFITS[k]));
 allBenef.appendChild(row);
 });
 p.appendChild(allBenef);

 // BUG-FIX: missing kcal estimation card for Yoga
 (function() {
  var yogaLevelKey = S.yogaLevel || 'debutant';
  var SESSION_DUR_YOGA = { debutant: 45, intermediaire: 60, avance: 75, elite: 90 };
  var yogaDurMin = S.yogaDuration ? parseInt(S.yogaDuration) : (SESSION_DUR_YOGA[yogaLevelKey] || 45);
  if (isNaN(yogaDurMin) || yogaDurMin <= 0) yogaDurMin = SESSION_DUR_YOGA[yogaLevelKey] || 45;
  var yogaKcal = estimateKcal('yoga', yogaLevelKey, yogaDurMin);
  p.appendChild(buildKcalCard(yogaKcal, yogaDurMin));
 }());
 p.appendChild(h('div', {style: 'height:12px'}));
 (function() {
  var _ygDateStr = new Date().toISOString().slice(0, 10);
  var _ygKey  = 'yoga_' + _ygDateStr;
  var _ygDone = S.sessionHistory && S.sessionHistory[_ygKey];
  var _ygLvl  = S.yogaLevel || 'debutant';
  var _ygDur  = S.yogaDuration ? parseInt(S.yogaDuration) : ({ debutant: 45, intermediaire: 60, avance: 75 }[_ygLvl] || 45);
  if (isNaN(_ygDur) || _ygDur <= 0) _ygDur = 45;
  p.appendChild(h('button', { 'class': 'btn-primary', disabled: !!_ygDone,
    onclick: function() { _completeSportSession('yoga', _ygLvl, _ygDur, _ygKey); }
  }, _ygDone ? (window.isEnglish && window.isEnglish() ? '✓ Session logged' : '✓ Séance validée') : (window.isEnglish && window.isEnglish() ? '✓ Session done' : '✓ Séance terminée')));
 }());
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 19; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ═══════════════════════════════════════
// CYCLISME MODULE — moved to sport-cycling.js
// ═══════════════════════════════════════

// ─── STEP 22: CYCLISME ONBOARDING ───
function renderCyclingOnboarding(p) {
 var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Cyclisme'));
 p.appendChild(h('h1', {html: (window.isEnglish && window.isEnglish() ? 'Your<br><em>cycling plan</em>' : 'Votre plan<br><em>vélo</em>')}));
 p.appendChild(h('p', {'class': 'subtitle'}, (window.isEnglish && window.isEnglish() ? 'Plan based on FTP zones (Andy Coggan method)' : 'Plan basé sur les zones FTP (méthode Andy Coggan)')));

 p.appendChild(h('div', {'class': 'section-label'}, (window.isEnglish && window.isEnglish() ? 'Bike type' : 'Type de vélo')));
 var bikeTypes = [
 { id: 'road', icon: '', name: 'Route', desc: 'Bitume, performance' },
 { id: 'vtt', icon: '', name: 'VTT', desc: 'Tout-terrain, single track' },
 { id: 'indoor', icon: '', name: 'Indoor', desc: 'Zwift / home trainer' },
 { id: 'gravel', icon: '', name: 'Gravel', desc: 'Chemins mixtes' }
 ];
 var bikeGrid = h('div', {'class': 'card-grid-2'});
 bikeTypes.forEach(function(bt) {
 var isOn = S.cyclingType === bt.id;
 bikeGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), style: 'cursor:pointer', onclick: (function(id){ return function(){ S.cyclingType = id; window.render(); }; })(bt.id)}, [
 h('span', {'class': 'card-icon'}, bt.icon),
 h('div', {'class': 'card-name'}, bt.name),
 h('div', {'class': 'card-sub'}, bt.desc)
 ]));
 });
 p.appendChild(bikeGrid);

 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.level')));
 var levels = [
 { id: 'debutant', icon: '', name: window.t('sport.beginner'), desc: (window.isEnglish && window.isEnglish() ? '< 2h per week, discovering cycling' : '< 2h par semaine, découverte du cyclisme') },
 { id: 'intermediaire', icon: '', name: window.t('sport.intermediate'), desc: '2-5h par semaine, confortable sur longues sorties' },
 { id: 'avance', icon: '', name: window.t('sport.advanced'), desc: '> 5h par semaine, FTP > 3 w/kg' }
 ];
 var lvlList = h('div', {'class': 'level-list'});
 levels.forEach(function(lv) {
 var isOn = S.cyclingLevel === lv.id;
 lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: (function(id){ return function(){ S.cyclingLevel = id; window.render(); }; })(lv.id)}, [
 h('div', {}, [
 h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
 h('div', {'class': 'level-desc'}, lv.desc)
 ]),
 isOn ? h('span', {'class': 'level-badge'}, '') : h('span', {})
 ]));
 });
 p.appendChild(lvlList);

 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Objectif'));
 var goals = [
 { id: 'weightloss', icon: '', name: (window.isEnglish && window.isEnglish() ? 'Weight loss' : 'Perte de poids'), desc: (window.isEnglish && window.isEnglish() ? 'Burn calories, improve body composition' : 'Brûler des calories, améliorer la composition corporelle') },
 { id: 'endurance', icon: '', name: (window.isEnglish && window.isEnglish() ? 'Base endurance' : 'Endurance de base'), desc: (window.isEnglish && window.isEnglish() ? 'Build the aerobic engine, long rides' : 'Développer le moteur aérobie, sorties longues') },
 { id: 'competitive', icon: '', name: (window.isEnglish && window.isEnglish() ? 'Competitive athlete' : 'Sportif compétitif'), desc: (window.isEnglish && window.isEnglish() ? 'Improve FTP, power, ranking' : 'Améliorer FTP, puissance, classement') },
 { id: 'granfondo', icon: '', name: 'Gran Fondo', desc: (window.isEnglish && window.isEnglish() ? 'Prepare for a gran fondo or sportive' : 'Préparer une cyclosportive ou gran fondo') },
 { id: 'triathlon', icon: '', name: 'Triathlon', desc: (window.isEnglish && window.isEnglish() ? 'Triathlon cycling segment, transitions' : 'Segment vélo du triathlon, transitions') }
 ];
 var goalGrid = h('div', {'class': 'card-grid-2'});
 goals.forEach(function(g) {
 var isOn = S.cyclingGoal === g.id;
 goalGrid.appendChild(h('div', {'class': 'sel-card' + (isOn ? ' on' : ''), style: 'cursor:pointer', onclick: (function(id){ return function(){ S.cyclingGoal = id; window.render(); }; })(g.id)}, [
 h('span', {'class': 'card-icon'}, g.icon),
 h('div', {'class': 'card-name'}, g.name),
 h('div', {'class': 'card-sub'}, g.desc)
 ]));
 });
 p.appendChild(goalGrid);

 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.days')));
 if (!S.cyclingDays) S.cyclingDays = 3;
 var daysWrap = h('div', {'class': 'num-input-wrap'});
 daysWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '6', value: String(S.cyclingDays), inputmode: 'numeric',
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 6) S.cyclingDays = v; },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) { e.target.value = S.cyclingDays = 2; window.render(); } else if (v > 6) { e.target.value = S.cyclingDays = 6; window.render(); } }
 }));
 daysWrap.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(daysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? '2 to 6 days per week' : '2 à 6 jours par semaine')));

 p.appendChild(h('div', {style: 'height:24px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));

 p.appendChild(h('div', {'class': 'section-label'}, 'FTP actuel en watts (optionnel — laissez vide si inconnu)'));
 var ftpWrap = h('div', {'class': 'num-input-wrap'});
 ftpWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '80', max: '500', placeholder: '—', value: S.cyclingFTP ? String(S.cyclingFTP) : '', inputmode: 'numeric', style: 'width:90px;text-align:center',
 oninput: function(e){ var v = parseInt(e.target.value); S.cyclingFTP = (!isNaN(v) && v >= 75 && v <= 500) ? v : null; },
 onblur: function(){ window.render(); }
 }));
 ftpWrap.appendChild(h('span', {'class': 'num-unit'}, 'watts'));
 p.appendChild(ftpWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, 'Functional Threshold Power — puissance max maintenable sur 1h'));

 if (S.cyclingFTP && S.cyclingFTP > 0) {
 var zonesCard = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin:12px 0'});
 zonesCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, 'Vos zones de puissance'));
 var ftp = S.cyclingFTP;
 var zBounds = [[0, Math.round(ftp*0.55)], [Math.round(ftp*0.56), Math.round(ftp*0.75)], [Math.round(ftp*0.76), Math.round(ftp*0.90)], [Math.round(ftp*0.91), Math.round(ftp*1.05)], [Math.round(ftp*1.06), Math.round(ftp*1.20)]];
 CYCLING_ZONES.forEach(function(z, i) {
 var b = zBounds[i];
 var wLabel = i === 0 ? ('< ' + b[1] + 'W') : (b[0] + '-' + b[1] + 'W');
 zonesCard.appendChild(h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:13px'}, [
 h('span', {style: 'color:' + z.color + ';font-weight:bold'}, 'Z' + z.zone + ' ' + z.name),
 (function(){ var _s = h('span', {style: 'color:var(--grey)'}); _s.appendChild(document.createTextNode(wLabel + ' · ')); _s.appendChild(termTooltip('RPE', _RPE_DEF)); _s.appendChild(document.createTextNode(' ' + z.rpe)); return _s; })()
 ]));
 });
 p.appendChild(zonesCard);
 }

 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:16px'}, 'Vitesse moyenne actuelle (km/h)'));
 var speedWrap = h('div', {'class': 'num-input-wrap'});
 speedWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '10', max: '60', placeholder: '25', value: S.cyclingSpeed ? String(S.cyclingSpeed) : '', inputmode: 'numeric', style: 'width:90px;text-align:center',
 oninput: function(e){ var v = parseInt(e.target.value); S.cyclingSpeed = (!isNaN(v) && v > 0) ? v : null; },
 onblur: function(){ window.render(); }
 }));
 speedWrap.appendChild(h('span', {'class': 'num-unit'}, 'km/h'));
 p.appendChild(speedWrap);

 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:16px'}, (window.isEnglish && window.isEnglish() ? 'Target elevation gain per ride' : 'Dénivelé cible par sortie')));
 var reliefs = [
 { id: 'flat', name: 'Plat', desc: '< 500m D+/100km' },
 { id: 'rolling', name: (window.isEnglish && window.isEnglish() ? 'Rolling' : 'Vallonné'), desc: '500-1000m D+/100km' },
 { id: 'mountainous', name: (window.isEnglish && window.isEnglish() ? 'Mountainous' : 'Montagneux'), desc: '> 1000m D+/100km' }
 ];
 var reliefRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px'});
 reliefs.forEach(function(r) {
 var isOn = S.cyclingRelief === r.id;
 reliefRow.appendChild(h('div', {
 style: 'padding:10px 16px;border-radius:2px;border:1.5px solid ' + (isOn ? 'var(--accent, #0A0A09)' : 'var(--border)') + ';background:var(--ivory2);cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:' + (isOn ? '600' : '400') + ';user-select:none',
 onclick: (function(id){ return function(){ S.cyclingRelief = id; window.render(); }; })(r.id)
 }, [
 h('div', {style: 'font-weight:inherit'}, r.name),
 h('div', {style: 'color:var(--grey);font-size:11px'}, r.desc)
 ]));
 });
 p.appendChild(reliefRow);

 var ok = S.cyclingLevel && S.cyclingGoal;
 if (!ok) p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Choose your level and objective to continue.' : 'Choisissez votre niveau et votre objectif pour continuer.')));
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (!ok) return;
 S.cyclingProgram = generateCyclingPlan({ level: S.cyclingLevel, days: S.cyclingDays || 3, goal: S.cyclingGoal, ftp: S.cyclingFTP });
 // Bridge nutrition — intensité dérivée du goal : competitive/granfondo → heavy, weightloss → moderate, autres → level
 var _cycBridgeLv = (S.cyclingGoal === 'competitive' || S.cyclingGoal === 'granfondo') ? 'avance'
                  : (S.cyclingGoal === 'weightloss') ? 'debutant' : S.cyclingLevel;
 _sfcNotifySport('cycling', _cycBridgeLv);
 S.cyclingWeek = 1;
 S.selectedCyclingDay = 0;
 S.sStep = 23;
 if (window.BLACKBOX) BLACKBOX.log('cycling_config', {level: S.cyclingLevel, goal: S.cyclingGoal, days: S.cyclingDays, ftp: S.cyclingFTP});
 window.render();
 }}, (window.isEnglish && window.isEnglish() ? 'Generate my plan' : 'Générer mon plan')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: backArrow + 'Retour'}));
}

// ─── STEP 23: CYCLISME PROGRAMME ───
function renderCyclingProgram(p) {
 var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

 if (!S.cyclingProgram || !S.cyclingProgram.length) {
 S.cyclingProgram = generateCyclingPlan({ level: S.cyclingLevel || 'debutant', days: S.cyclingDays || 3, goal: S.cyclingGoal, ftp: S.cyclingFTP });
 }

 var plan = S.cyclingProgram;
 if (!plan || !plan.length) {
 var backArrowCyc = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable. Reload the page or reconfigure your plan.' : 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.')));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 22; window.render(); }, html: backArrowCyc + 'Retour'}));
 return;
 }
 var totalWeeks = plan.length;
 if (!S.cyclingWeek || S.cyclingWeek < 1) S.cyclingWeek = 1;
 if (S.cyclingWeek > totalWeeks) S.cyclingWeek = totalWeeks;
 if (S.selectedCyclingDay === undefined || S.selectedCyclingDay === null) S.selectedCyclingDay = 0;

 var weekData = plan[S.cyclingWeek - 1];
 if (!weekData) return;

 // Pregnancy warning (ACOG 2020)
 var _pregCycling = getPregnancySportWarning();
 if (_pregCycling) {
 p.appendChild(h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'}, _pregCycling));
 }

 var weightKg = S.weight || 70;
 var levelNames = { debutant: window.t('sport.beginner'), intermediaire: window.t('sport.intermediate'), avance: window.t('sport.advanced') };
 var goalNames = window.isEnglish && window.isEnglish() ? { weightloss: 'Weight loss', endurance: 'Base endurance', competitive: 'Competitive athlete', granfondo: 'Gran Fondo', triathlon: 'Triathlon' } : { weightloss: 'Perte de poids', endurance: 'Endurance de base', competitive: 'Sportif compétitif', granfondo: 'Gran Fondo', triathlon: 'Triathlon' };
 var bikeNames = { road: 'Route ', vtt: 'VTT ', indoor: 'Indoor ', gravel: 'Gravel ' };

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Cyclisme'));
 p.appendChild(h('h1', {html: (goalNames[S.cyclingGoal] || 'Cyclisme') + '<br><em>Plan 8 semaines</em>'}));

 var speedTarget = S.cyclingSpeed ? Math.round(S.cyclingSpeed * 1.08) : null;
 var ftpTarget = S.cyclingFTP ? Math.round(S.cyclingFTP * 1.10) : null;
 var infoLine = (levelNames[S.cyclingLevel] || '') +
 (S.cyclingType ? ' · ' + (bikeNames[S.cyclingType] || S.cyclingType) : '') +
 (S.cyclingFTP ? ' · FTP actuel : ' + S.cyclingFTP + 'W' : '') +
 (ftpTarget ? ' \u2192 cible : ~' + ftpTarget + 'W' : '') +
 (speedTarget ? ' · Vitesse cible : ~' + speedTarget + ' km/h' : '');
 p.appendChild(h('p', {'class': 'subtitle'}, infoLine));

 appendSportMedicalBanner(p, 'Cyclisme');
 appendWellnessBanner(p);

 var med = S.muscuMedical || {};
 var warnings = [];
 if (med.hypertension) warnings.push(window.isEnglish && window.isEnglish() ? ' HTN: avoid Z4/Z5 (Valsalva forbidden) — stay in Z1-Z3 maximum' : ' HTA : évitez Z4/Z5 (Valsalva interdit) — restez en Z1-Z3 maximum');
 if (med.herniaDisc || med.lowerBack) warnings.push(window.isEnglish && window.isEnglish() ? ' Disc hernia: aerodynamic position not recommended — upright bike recommended, raised handlebars' : ' Hernie discale : position aérodynamique déconseillée — vélo droit recommandé, guidon surélevé');
 if (med.knees || med.meniscus) warnings.push(window.isEnglish && window.isEnglish() ? ' Knee OA / Meniscus: high cadence (>90 RPM) recommended — avoid hard accelerations' : ' Gonarthrose / Ménisque : cadence élevée (>90 RPM) recommandée — évitez les grosses relances');
 if (getAge() >= 50) warnings.push(window.isEnglish && window.isEnglish() ? ' 50+: minimum 15 min warmup required, zones 1-3 priority, 48h recovery between intense sessions' : ' 50+ : échauffement 15 min minimum obligatoire, zones 1-3 prioritaires, récupération 48h entre séances intenses');
 if (warnings.length) {
 var warnBox = h('div', {style: 'border:1px solid var(--orange,#E86F1E);padding:12px 16px;background:rgba(232,111,30,0.06);margin-bottom:16px'});
 warnings.forEach(function(w) {
 warnBox.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--orange-ink,#7A3B0E);margin-bottom:4px;line-height:1.5'}, w));
 });
 p.appendChild(warnBox);
 }

 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Previous week' : 'Semaine précédente'), onclick: function() {
 if (S.cyclingWeek > 1) { S.cyclingWeek--; S.selectedCyclingDay = 0; window.render(); }
 }}, '←'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + S.cyclingWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': (window.isEnglish && window.isEnglish() ? 'Next week' : 'Semaine suivante'), onclick: function() {
 if (S.cyclingWeek < totalWeeks) { S.cyclingWeek++; S.selectedCyclingDay = 0; window.render(); }
 }}, '→'));
 p.appendChild(weekNav);

 var phaseCard = h('div', {style: 'border-left:3px solid ' + weekData.phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + weekData.phaseColor + ';margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Phase: ' : 'Phase : ') + weekData.phase));
 phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, weekData.focus));
 if (weekData.isDeload) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);margin-top:6px;font-weight:bold'}, (window.isEnglish && window.isEnglish() ? ' Recovery week — volume reduced by 40%' : ' Semaine de récupération — volume réduit de 40%')));
 p.appendChild(phaseCard);

 var zonesToggle = S._cyclingShowZones || false;
 p.appendChild(h('button', {'class': 'btn-back', style: 'font-size:11px;margin:0 0 12px 0', onclick: function(){
 S._cyclingShowZones = !S._cyclingShowZones; window.render();
 }}, zonesToggle ? (window.isEnglish && window.isEnglish() ? '▲ Hide FTP zones' : '▲ Masquer les zones FTP') : (window.isEnglish && window.isEnglish() ? '▼ View FTP zones' : '▼ Voir les zones FTP')));
 if (zonesToggle) {
 var zonesRef = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 zonesRef.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'FTP intensity zones (Coggan method)' : 'Zones d\'intensité FTP (méthode Coggan)')));
 CYCLING_ZONES.forEach(function(z) {
 zonesRef.appendChild(h('div', {style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:11px'}, [
 h('span', {style: 'color:' + z.color + ';font-weight:bold'}, 'Z' + z.zone + ' ' + z.name + ' · ' + z.pct),
 h('span', {style: 'color:var(--grey)'}, z.desc)
 ]));
 });
 p.appendChild(zonesRef);
 }

 if (!S.cyclingFTP) {
 var ftpBox = h('div', {style: 'border:1px solid var(--line,#D8D8D0);padding:12px 16px;background:rgba(62,92,58,0.06);margin-bottom:16px'});
 ftpBox.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;color:var(--success,#3E5C3A);margin-bottom:6px'}, (window.isEnglish && window.isEnglish() ? ' FTP test recommended' : ' Test FTP recommandé')));
 ftpBox.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.6'}, (window.isEnglish && window.isEnglish() ? 'Perform a maximal effort for 20 minutes at steady state. Your estimated FTP ≈ average power over 20 min × 0.95. Enter it in the configuration to display your personalized zones.' : 'Effectuez un effort maximal de 20 minutes en régime stable. Votre FTP estimée ≈ puissance moyenne sur 20 min × 0,95. Renseignez-la dans la configuration pour afficher vos zones personnalisées.')));
 p.appendChild(ftpBox);
 }

 // ─── ESTIMATION CALORIQUE CYCLING ───
 (function() {
  var cycLevel = S.cyclingLevel || 'intermediaire';
  var SESSION_DUR_CYC = { debutant: 60, intermediaire: 75, avance: 90, elite: 120 };
  var cycDur = SESSION_DUR_CYC[cycLevel] || 75;
  var cycKcal = estimateKcal('cycling', cycLevel, cycDur);
  p.appendChild(buildKcalCard(cycKcal, cycDur));
 }());

 var sessions = weekData.sessions || [];
 if (S.selectedCyclingDay < 0 || S.selectedCyclingDay >= sessions.length) S.selectedCyclingDay = 0;
 var tabs = h('div', {'class': 'day-tabs', style: 'flex-wrap:wrap'});
 sessions.forEach(function(sess, i) {
 tabs.appendChild(h('button', {
 'class': 'day-tab' + (S.selectedCyclingDay === i ? ' active' : ''),
 style: 'font-size:11px',
 onclick: (function(idx){ return function(){ S.selectedCyclingDay = idx; window.render(); }; })(i)
 }, sess.day || ('J' + (i + 1))));
 });
 p.appendChild(tabs);

 var sess = sessions[S.selectedCyclingDay];
 if (sess) {
 if (!sess.zone) sess.zone = 2; // Défaut Z2 si manquant
 var zoneNum = Array.isArray(sess.zone) ? sess.zone[sess.zone.length - 1] : sess.zone;
 // ─── CYCLING INTENSITY ENGINE ─── cyclingLoad = duration × zone factor → S.trainingLoad
 var _cycFTP     = (S.cyclingFTP && S.cyclingFTP > 75) ? S.cyclingFTP : null;
 var _cycFactors = _cycFTP ? CYCLING_ZONE_FACTORS_FTP : CYCLING_ZONE_FACTORS_NOFTP;
 var _cycFactor  = _cycFactors[zoneNum] || 1.0;
 S.cyclingTrainingLoad = Math.round(sess.duration * _cycFactor);
 var _cycLoad = S.cyclingTrainingLoad >= 80 ? 'heavy'
              : S.cyclingTrainingLoad >= 40 ? 'moderate' : 'light';
 _sfcAggregateLoad('cycling', _cycLoad);
 if (!_cycFTP) _sfcNotifySport('cycling', S.cyclingLevel || 'intermediaire');
 var zoneData = CYCLING_ZONES[Math.max(0, Math.min(zoneNum - 1, 4))] || CYCLING_ZONES[1];
 var zoneColor = zoneData ? zoneData.color : '#1A3A6A';
 var kcal = cyclingKcal(sess.duration, zoneNum, weightKg);

 var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid ' + zoneColor});

 var zoneBadgeRow = h('div', {style: 'display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap'});
 if (Array.isArray(sess.zone)) {
 sess.zone.forEach(function(z) {
 var zd = CYCLING_ZONES[Math.min(z - 1, 4)];
 zoneBadgeRow.appendChild(h('span', {style: 'background:' + (zd ? zd.color : '#888') + ';color:#fff;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:1px;padding:2px 8px;font-weight:600'}, 'Z' + z));
 });
 } else {
 zoneBadgeRow.appendChild(h('span', {style: 'background:' + zoneColor + ';color:#fff;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:1px;padding:2px 8px;font-weight:600'}, 'Z' + sess.zone));
 }
 sessCard.appendChild(zoneBadgeRow);

 sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, ' ' + sess.type));
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, sess.desc));

 var metaRow = h('div', {style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px'});
 metaRow.appendChild(h('div', {style: 'font-family:Georgia;font-size:15px;color:' + zoneColor}, '⏱ ' + sess.duration + ' min'));
 metaRow.appendChild(h('div', {style: 'font-family:Georgia;font-size:15px;color:var(--grey)'}, ' ~' + kcal + ' kcal'));
 if (S.cyclingFTP && S.cyclingFTP > 0 && zoneData) {
 metaRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, ' ' + zoneData.pct));
 }
 sessCard.appendChild(metaRow);

 if (zoneData) {
 sessCard.appendChild((function(){ var _d = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:4px'}); _d.appendChild(document.createTextNode(zoneData.desc + ' — ')); _d.appendChild(termTooltip('RPE', _RPE_DEF)); _d.appendChild(document.createTextNode(' ' + zoneData.rpe)); return _d; })());
 }
 p.appendChild(sessCard);
 }

 p.appendChild(h('div', {style: 'height:12px'}));
 (function() {
  var _cycDateStr = new Date().toISOString().slice(0, 10);
  var _cycKey2 = 'cycling_' + (S.selectedCyclingDay || 0) + '_' + _cycDateStr;
  var _cycDone = S.sessionHistory && S.sessionHistory[_cycKey2];
  var _cycLvl  = S.cyclingLevel || 'intermediaire';
  var _cycDur2 = sess ? (sess.duration || ({ debutant: 60, intermediaire: 75, avance: 90, elite: 120 }[_cycLvl] || 75)) : ({ debutant: 60, intermediaire: 75, avance: 90, elite: 120 }[_cycLvl] || 75);
  // Use zone-computed load if available (more accurate than MET default)
  var _cycLoad2 = S.cyclingTrainingLoad >= 80 ? 'heavy' : S.cyclingTrainingLoad >= 40 ? 'moderate' : 'light';
  p.appendChild(h('button', { 'class': 'btn-primary', disabled: !!_cycDone,
    onclick: function() { _completeSportSession('cycling', _cycLvl, _cycDur2, _cycKey2, _cycLoad2); }
  }, _cycDone ? (window.isEnglish && window.isEnglish() ? '✓ Session logged' : '✓ Séance validée') : (window.isEnglish && window.isEnglish() ? '✓ Session done' : '✓ Séance terminée')));
 }());
 p.appendChild(h('button', {'class': 'btn-back', onclick: function() { S.sStep = 22; window.render(); }, html: backArrow + 'Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ═══════════════════════════════════════
// CALLISTHENIE MODULE — Version 2.0
// Skills complets, sessions adaptees, equipement, periodisation
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// CALLISTHENIE MODULE — Version 2.0
// Skills complets, sessions adaptees, equipement, periodisation
// ═══════════════════════════════════════

// ─── STEP 24: CALISTHENICS ONBOARDING ───
function renderCalisthenicsOnboarding(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Callisthenie'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>callisthenie</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Street workout — progressions au poids du corps. Personnalise selon votre niveau reel.'));

 // Niveau
 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.level')));
 var lvlList = h('div', {'class': 'level-list'});
 [
  { id: 'debutant', icon: '', name: window.t('sport.beginner'), desc: 'Moins de 5 tractions — bases a construire' },
  { id: 'intermediaire', icon: '', name: window.t('sport.intermediate'), desc: '5-12 tractions — maitrise des fondamentaux' },
  { id: 'avance', icon: '', name: window.t('sport.advanced'), desc: '12+ tractions — apprentissage des skills avances' },
  { id: 'elite', icon: '', name: window.t('sport.elite'), desc: 'Maitrise complete — skills de haut niveau' }
 ].forEach(function(lv) {
  var isOn = S.calisthenicsLevel === lv.id;
  lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: function(){ S.calisthenicsLevel = lv.id; window.render(); }}, [
   h('div', {}, [
    h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
    h('div', {'class': 'level-desc'}, lv.desc)
   ]),
   isOn ? h('span', {'class': 'level-badge'}, '') : h('span', {})
  ]));
 });
 p.appendChild(lvlList);

 // Equipement disponible
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, (window.isEnglish && window.isEnglish() ? 'Available equipment' : 'Equipement disponible')));
 if (!Array.isArray(S.calisthenicsEquipment)) { S.calisthenicsEquipment = ['bar']; }
 var equipOptions = [
  { id: 'bar', label: 'Barre de traction' },
  { id: 'parallettes', label: 'Parallettes' },
  { id: 'rings', label: 'Anneaux' },
  { id: 'floor_only', label: 'Sol uniquement' }
 ];
 var equipChips = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px'});
 equipOptions.forEach(function(eq) {
  var isOn = S.calisthenicsEquipment.indexOf(eq.id) >= 0;
  equipChips.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), onclick: function(){
   if (!Array.isArray(S.calisthenicsEquipment)) { S.calisthenicsEquipment = []; }
   var idx = S.calisthenicsEquipment.indexOf(eq.id);
   if (idx >= 0) { S.calisthenicsEquipment.splice(idx, 1); }
   else {
    // floor_only is exclusive
    if (eq.id === 'floor_only') { S.calisthenicsEquipment = ['floor_only']; }
    else {
     var floorIdx = S.calisthenicsEquipment.indexOf('floor_only');
     if (floorIdx >= 0) { S.calisthenicsEquipment.splice(floorIdx, 1); }
     S.calisthenicsEquipment.push(eq.id);
    }
   }
   window.render();
  }}, eq.label));
 });
 p.appendChild(equipChips);
 // Note si sol uniquement ou pas de barre
 var hasBar = S.calisthenicsEquipment.indexOf('bar') >= 0;
 if (!hasBar) {
  p.appendChild(h('div', {'class': 'num-hint', style: 'color:var(--ink-900,#0A0A09)'}, 'Pas de barre ? Programme sol adapte avec alternatives.'));
 }

 // Pull-ups max
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Pull-ups max (en une serie)'));
 var puWrap = h('div', {'class': 'num-input-wrap'});
 puWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '0', max: '50', value: String(S.calisthPullups || 0), inputmode: 'numeric',
  oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 50) { S.calisthPullups = v; } },
  onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 0) { e.target.value = '0'; S.calisthPullups = 0; } else if (v > 50) { e.target.value = '50'; S.calisthPullups = 50; } }
 }));
 puWrap.appendChild(h('span', {'class': 'num-unit'}, 'reps'));
 p.appendChild(puWrap);
 if ((S.calisthPullups || 0) === 0) {
  p.appendChild(h('div', {'class': 'num-hint', style: 'color:var(--ink-900,#0A0A09)'}, '0 traction ? Programme debute avec les alternatives (negatifs, australien).'));
 } else {
  p.appendChild(h('div', {'class': 'num-hint'}, '0 a 50 repetitions'));
 }

 // Push-ups max
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Push-ups max (en une serie)'));
 var ppWrap = h('div', {'class': 'num-input-wrap'});
 ppWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '0', max: '100', value: String(S.calisthPushups || 0), inputmode: 'numeric',
  oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) { S.calisthPushups = v; } },
  onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 0) { e.target.value = '0'; S.calisthPushups = 0; } else if (v > 100) { e.target.value = '100'; S.calisthPushups = 100; } }
 }));
 ppWrap.appendChild(h('span', {'class': 'num-unit'}, 'reps'));
 p.appendChild(ppWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, '0 a 100 repetitions'));

 // Dips max
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Dips max (en une serie)'));
 var dpWrap = h('div', {'class': 'num-input-wrap'});
 dpWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '0', max: '50', value: String(S.calisthDips || 0), inputmode: 'numeric',
  oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 50) { S.calisthDips = v; } },
  onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 0) { e.target.value = '0'; S.calisthDips = 0; } else if (v > 50) { e.target.value = '50'; S.calisthDips = 50; } }
 }));
 dpWrap.appendChild(h('span', {'class': 'num-unit'}, 'reps'));
 p.appendChild(dpWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, '0 a 50 repetitions'));

 // Objectifs — skills cibles
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Objectifs — Skills cibles (plusieurs choix possibles)'));
 var goalChips = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px'});
 var GOAL_OPTIONS = [
  { id: 'muscle_up', label: 'Muscle-up barre' },
  { id: 'muscle_up_rings', label: 'Muscle-up anneaux' },
  { id: 'handstand', label: 'Handstand mur' },
  { id: 'handstand_free', label: 'Handstand libre' },
  { id: 'front_lever', label: 'Front lever' },
  { id: 'back_lever', label: 'Back lever' },
  { id: 'planche', label: 'Planche' },
  { id: 'planche_lean', label: 'Planche lean' },
  { id: 'lsit', label: 'L-sit' },
  { id: 'lsit_bars', label: 'L-sit parallettes' },
  { id: 'dragon_flag', label: 'Dragon flag' },
  { id: 'human_flag', label: 'Human flag' },
  { id: 'pistol_squat', label: 'Pistol squat' },
  { id: 'one_arm_pullup', label: 'One arm pull-up' }
 ];
 if (!Array.isArray(S.calisthenicsGoal)) { S.calisthenicsGoal = []; }
 GOAL_OPTIONS.forEach(function(g) {
  var isOn = S.calisthenicsGoal.indexOf(g.id) >= 0;
  goalChips.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), onclick: function(){
   if (!Array.isArray(S.calisthenicsGoal)) { S.calisthenicsGoal = []; }
   var idx = S.calisthenicsGoal.indexOf(g.id);
   if (idx >= 0) { S.calisthenicsGoal.splice(idx, 1); } else { S.calisthenicsGoal.push(g.id); }
   window.render();
  }}, g.label));
 });
 p.appendChild(goalChips);

 // Jours par semaine
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, window.t('sport.days')));
 var nw = h('div', {'class': 'num-input-wrap'});
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '5', value: String(S.calisthenicsdays || 3), inputmode: 'numeric',
  oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 5) { S.calisthenicsdays = v; } },
  onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) { e.target.value = '2'; S.calisthenicsdays = 2; } else if (v > 5) { e.target.value = '5'; S.calisthenicsdays = 5; } }
 }));
 nw.appendChild(h('span', {'class': 'num-unit'}, (window.isEnglish && window.isEnglish() ? 'days' : 'jours')));
 p.appendChild(nw);
 p.appendChild(h('div', {'class': 'num-hint'}, (window.isEnglish && window.isEnglish() ? '2 to 5 days per week' : '2 à 5 jours par semaine')));

 p.appendChild(h('div', {style: 'height:20px'}));
 var ok = S.calisthenicsLevel && Array.isArray(S.calisthenicsGoal) && S.calisthenicsGoal.length > 0;
 if (!ok) {
  p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, (window.isEnglish && window.isEnglish() ? 'Choose a level and at least one goal to continue.' : 'Choisissez un niveau et au moins un objectif pour continuer.')));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
  if (ok) {
   if (!S.calisthenicsdays) { S.calisthenicsdays = 3; }
   if (!S.calisthPullups) { S.calisthPullups = 0; }
   if (!S.calisthPushups) { S.calisthPushups = 0; }
   if (!S.calisthDips) { S.calisthDips = 0; }
   if (!Array.isArray(S.calisthenicsEquipment) || S.calisthenicsEquipment.length === 0) { S.calisthenicsEquipment = ['bar']; }
   S.sStep = 25;
   window.BLACKBOX && window.BLACKBOX.log('calisthenics_config', { level: S.calisthenicsLevel, goal: S.calisthenicsGoal, days: S.calisthenicsdays });
   window.render();
  }
 }}, 'Generer mon programme'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (window.isEnglish && window.isEnglish() ? 'Back' : 'Retour')}));
}


// ─── STEP 25: CALISTHENICS PROGRAM ───
function renderCalisthenicsProgram(content) {
 if (!S.calisthenicsLevel) { S.sStep = 24; setTimeout(function() { if (window.render) window.render(); }, 0); return; }
 var skills = Array.isArray(S.calisthenicsGoal) ? S.calisthenicsGoal : [];
 var level = S.calisthenicsLevel || 'debutant';
 var pullups = parseInt(S.calisthPullups) || 0;
 var pushups = parseInt(S.calisthPushups) || 0;
 var dips = parseInt(S.calisthDips) || 0;
 var days = parseInt(S.calisthenicsdays) || 3;
 var equipment = Array.isArray(S.calisthenicsEquipment) && S.calisthenicsEquipment.length > 0 ? S.calisthenicsEquipment : ['bar'];

 // Guard: check calisthenics-program.js is loaded
 if (typeof window.generateCalisthenicsPlan !== 'function') {
  content.appendChild(h('div', {'class': 'card'}, [
   h('div', {'class': 'label-caps', style: 'margin-bottom:8px'}, 'ERREUR DE CHARGEMENT'),
   h('div', {style: 'font-size:13px;color:var(--grey3)'}, 'Le module calisthenics-program.js est introuvable. Verifiez le chargement du fichier.')
  ]));
  return;
 }

 // Generate the full plan
 var planData;
 try {
  planData = window.generateCalisthenicsPlan(level, skills, pullups, pushups, days, equipment, dips, S.medical);
 } catch(e) {
  content.appendChild(h('div', {'class': 'card'}, h('div', {style: 'color:red;font-size:13px'}, (window.isEnglish && window.isEnglish() ? 'Unable to display the program — please retry or reload the page. (' + e.message + ')' : 'Impossible d\'afficher le programme — réessayez ou rechargez la page. (' + e.message + ')'))));
  return;
 }
 // Bridge nutrition — guard première fois uniquement
 if (!S._calisthNotified) { S._calisthNotified = true; _sfcNotifySport('calisthenics', level); }

 // State for current week display
 if (!planData || !Array.isArray(planData.plan) || planData.plan.length === 0) {
  content.appendChild(h('div', {'class': 'card'}, h('div', {style: 'color:var(--grey);font-size:13px;text-align:center;padding:24px'}, (window.isEnglish && window.isEnglish() ? 'Program unavailable. Reload the page.' : 'Programme non disponible. Rechargez la page.'))));
  return;
 }
 if (!S.calisthCurrentWeek || S.calisthCurrentWeek < 1) { S.calisthCurrentWeek = 1; }
 if (S.calisthCurrentWeek > planData.totalWeeks) { S.calisthCurrentWeek = planData.totalWeeks; }

 // Gamification: unlock calisthenics badges on program load
 if (window.GAMIFICATION && window.GAMIFICATION.checkCalisthenicsBadges) {
  window.GAMIFICATION.checkCalisthenicsBadges({ currentWeek: S.calisthCurrentWeek, pullups: pullups });
 }

 appendSportMedicalBanner(content, 'Callisthénie');
 // ── HEADER ──
 var headerCard = h('div', {'class': 'card', style: 'margin-bottom:16px'});
 headerCard.appendChild(h('div', {'class': 'label-caps', style: 'margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'CALISTHENICS' : 'CALLISTHENIE')));
 headerCard.appendChild(h('div', {style: 'font-weight:600;font-size:16px;margin-bottom:4px'}, (window.isEnglish && window.isEnglish() ? 'Program ' : 'Programme ') + level + ' — ' + days + (window.isEnglish && window.isEnglish() ? ' d/week' : ' j/sem')));
 var equipStr = equipment.join(', ');
 headerCard.appendChild(h('div', {style: 'font-size:12px;color:var(--grey3)'}, (window.isEnglish && window.isEnglish() ? 'Equipment: ' : 'Equipement: ') + equipStr + ' | Pull-ups: ' + pullups + ' | Push-ups: ' + pushups + ' | Dips: ' + dips));
 headerCard.appendChild(h('div', {style: 'font-size:12px;color:var(--grey3);margin-top:2px'}, planData.totalWeeks + (window.isEnglish && window.isEnglish() ? ' weeks of program' : ' semaines de programme')));
 content.appendChild(headerCard);

 appendWellnessBanner(content);

 // ── PREGNANCY WARNING ──
 var _pregCalisth = getPregnancySportWarning();
 if (_pregCalisth) {
  content.appendChild(h('div', {style: 'background:rgba(232,111,30,0.06);border-left:3px solid var(--orange,#E86F1E);padding:10px 14px;margin-bottom:12px;font-size:11px;color:var(--orange-ink,#7A3B0E);line-height:1.6'}, _pregCalisth));
 }

 // ── MEDICAL WARNINGS ──
 if (S.muscuMedical) {
  var warns = [];
  if (S.muscuMedical.shoulders || S.muscuMedical.rotatorCuff) { warns.push('Epaules : progresser avec assistance elastique uniquement, eviter HSPU et planche'); }
  if (S.muscuMedical.hernia || S.muscuMedical.herniaDisc) { warns.push('Hernie : eviter dragon flag, L-sit et human flag (compression discale)'); }
  if (S.muscuMedical.wrists) { warns.push('Poignets : renforcement 4-6 semaines AVANT tout appui'); }
  if (warns.length > 0) {
   var warnDiv = h('div', {style: 'background:rgba(232,111,30,0.06);border:1px solid var(--orange,#E86F1E);border-radius:0;padding:12px;margin-bottom:16px'});
   for (var wi = 0; wi < warns.length; wi++) {
    warnDiv.appendChild(h('div', {style: 'font-size:13px;margin-bottom:4px'}, warns[wi]));
   }
   content.appendChild(warnDiv);
  }
 }

 // ── SKILLS PROGRESSION OVERVIEW ──
 if (planData.skills && planData.skills.length > 0) {
  var skillsCard = h('div', {'class': 'card', style: 'margin-bottom:16px'});
  skillsCard.appendChild(h('div', {'class': 'label-caps', style: 'margin-bottom:12px'}, 'VOS SKILLS CIBLES'));
  planData.skills.forEach(function(sd) {
   var sk = sd.skill;
   if (!sk) { return; }
   var totalSteps = sk.progressions ? sk.progressions.length : 1;
   var currentStep = sd.currentStep || 1;
   var pct = Math.round((currentStep / totalSteps) * 100);
   var skillRow = h('div', {style: 'margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)'});
   // Skill name + time
   skillRow.appendChild(h('div', {style: 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px'}, [
    h('div', {style: 'font-weight:600;font-size:14px'}, (sk.icon || '') + ' ' + sk.name),
    h('div', {style: 'font-size:11px;color:var(--grey3)'}, sk.time ? (sk.time[level] || sk.time.debutant) : '')
   ]));
   // Prereqs
   skillRow.appendChild(h('div', {style: 'font-size:11px;color:var(--grey3);margin-bottom:8px'}, 'Prerequis: ' + (sk.prereqs || '')));
   // Progress bar
   var barWrap = h('div', {style: 'margin-bottom:8px'});
   barWrap.appendChild(h('div', {style: 'display:flex;justify-content:space-between;font-size:10px;color:var(--grey3);margin-bottom:3px'}, [
    h('span', {}, 'Etape ' + currentStep + ' / ' + totalSteps),
    h('span', {}, pct + '%')
   ]));
   var barBg = h('div', {style: 'height:4px;background:var(--border);border-radius:2px'});
   barBg.appendChild(h('div', {style: 'height:4px;background:var(--ink-900,#0A0A09);width:' + pct + '%;border-radius:2px;transition:width 0.3s'}));
   barWrap.appendChild(barBg);
   skillRow.appendChild(barWrap);
   // Current step description
   if (sk.progressions && sk.progressions[currentStep - 1]) {
    var stepData = sk.progressions[currentStep - 1];
    var stepCard = h('div', {style: 'background:var(--surface,#F4F4F0);padding:8px 12px;border-radius:2px;font-size:12px'});
    stepCard.appendChild(h('div', {style: 'font-weight:600;margin-bottom:2px'}, 'En cours: ' + stepData.name));
    stepCard.appendChild(h('div', {style: 'color:var(--grey3)'}, stepData.sets > 0 ? (stepData.sets + 'x' + stepData.reps + ' — ' + ((window.isEnglish && window.isEnglish()) ? 'Rest: ' : 'Repos: ') + stepData.rest) : stepData.reps));
    stepCard.appendChild(h('div', {style: 'color:var(--ink-900,#0A0A09);margin-top:4px;font-size:11px'}, stepData.coaching || ''));
    skillRow.appendChild(stepCard);
   }
   // Injury alert
   if (sk.injuryAlert) {
    skillRow.appendChild(h('div', {style: 'font-size:11px;color:var(--error,#7A1F1F);margin-top:6px;padding-left:8px;border-left:2px solid var(--error,#7A1F1F)'}, sk.injuryAlert));
   }
   skillsCard.appendChild(skillRow);
  });
  content.appendChild(skillsCard);
 }

 // ─── ESTIMATION CALORIQUE CALISTHENICS ───
 (function() {
  var calisthLevel = S.calisthenicsLevel || 'debutant';
  var SESSION_DUR_CALISTH = { debutant: 50, intermediaire: 65, avance: 80, elite: 90 };
  var calisthDur = SESSION_DUR_CALISTH[calisthLevel] || 60;
  var calisthKcal = estimateKcal('calisthenics', calisthLevel, calisthDur);
  content.appendChild(buildKcalCard(calisthKcal, calisthDur));
 }());

 // ── WEEKLY PROGRAM NAVIGATION ──
 var currentWeek = S.calisthCurrentWeek || 1;
 var weekData = planData.plan[currentWeek - 1];

 if (weekData) {
  // Week navigation header
  var navCard = h('div', {'class': 'card', style: 'margin-bottom:12px'});
  var navHeader = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px'});
  var prevBtn = h('button', {style: 'background:none;border:1px solid var(--border);padding:6px 12px;border-radius:2px;cursor:pointer;font-size:12px',
   onclick: function(){ if (S.calisthCurrentWeek > 1) { S.calisthCurrentWeek--; window.render(); } }
  }, '< Prev');
  var nextBtn = h('button', {style: 'background:none;border:1px solid var(--border);padding:6px 12px;border-radius:2px;cursor:pointer;font-size:12px',
   onclick: function(){ if (S.calisthCurrentWeek < planData.totalWeeks) { S.calisthCurrentWeek++; window.render(); } }
  }, (window.isEnglish && window.isEnglish() ? 'Next >' : 'Suiv >'));
  if (currentWeek <= 1) { prevBtn.disabled = true; }
  if (currentWeek >= planData.totalWeeks) { nextBtn.disabled = true; }
  navHeader.appendChild(prevBtn);
  var weekLabel = h('div', {style: 'text-align:center'}, [
   h('div', {style: 'font-weight:600;font-size:14px'}, (window.isEnglish && window.isEnglish() ? 'Week ' : 'Semaine ') + currentWeek + ' / ' + planData.totalWeeks),
   h('div', {style: 'font-size:11px;color:var(--grey3)'}, weekData.macroPhase)
  ]);
  navHeader.appendChild(weekLabel);
  navHeader.appendChild(nextBtn);
  navCard.appendChild(navHeader);
  // Periodization info
  var periodStyle = weekData.isDeload ?
   'background:var(--bluebg,rgba(26,58,106,.06));border-left:3px solid #1A3A6A;padding:8px 12px;font-size:12px;color:#1A3A6A' :
   'background:rgba(62,92,58,0.06);border-left:3px solid var(--ink-900,#0A0A09);padding:8px 12px;font-size:12px;color:var(--ink-900,#0A0A09)';
  navCard.appendChild(h('div', {style: periodStyle}, weekData.focus));
  content.appendChild(navCard);

  // Sessions for this week
  var sessions = weekData.sessions || [];
  for (var si = 0; si < sessions.length; si++) {
   var sess = sessions[si];
   var sessCard = h('div', {'class': 'card', style: 'margin-bottom:12px'});
   // Session header
   var sessHdr = h('div', {style: 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px'});
   sessHdr.appendChild(h('div', {style: 'font-weight:600;font-size:14px'}, 'J' + (si + 1) + ' — ' + sess.name));
   if (sess.duration) { sessHdr.appendChild(h('div', {style: 'font-size:11px;color:var(--grey3)'}, sess.duration)); }
   sessCard.appendChild(sessHdr);
   // Warmup
   if (sess.warmup && sess.warmup.length > 0) {
    var warmDiv = h('div', {style: 'background:var(--surface,#F4F4F0);padding:8px 12px;border-radius:2px;margin-bottom:8px'});
    warmDiv.appendChild(h('div', {style: 'font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey3);margin-bottom:4px'}, 'ECHAUFFEMENT'));
    var warmList = sess.warmup.join(' | ');
    warmDiv.appendChild(h('div', {style: 'font-size:11px;color:var(--grey3)'}, warmList));
    sessCard.appendChild(warmDiv);
   }
   // Exercises
   var exercises = sess.exercises || [];
   for (var ei = 0; ei < exercises.length; ei++) {
    var ex = exercises[ei];
    var exDiv = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--border)'});
    // Exercise header row
    var exHdr = h('div', {style: 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px'});
    exHdr.appendChild(h('div', {style: 'font-weight:600;font-size:13px'}, ex.name || ''));
    var setsReps = ex.sets > 0 ? (ex.sets + 'x' + ex.reps) : ex.reps;
    exHdr.appendChild(h('div', {style: 'font-size:12px;color:var(--grey3)'}, setsReps));
    exDiv.appendChild(exHdr);
    // Rest + skill link
    var metaRow = h('div', {style: 'display:flex;gap:12px;margin-bottom:3px'});
    if (ex.rest) { metaRow.appendChild(h('div', {style: 'font-size:11px;color:var(--grey3)'}, ((window.isEnglish && window.isEnglish()) ? 'Rest: ' : 'Repos: ') + ex.rest)); }
    if (ex.skill_link) { metaRow.appendChild(h('div', {style: 'font-size:11px;color:var(--ink-900,#0A0A09)'}, 'Skill: ' + ex.skill_link.replace(/_/g, ' '))); }
    exDiv.appendChild(metaRow);
    // Coaching note
    if (ex.coaching) {
     exDiv.appendChild(h('div', {style: 'font-size:11px;color:var(--grey3);font-style:italic;margin-top:2px'}, ex.coaching));
    }
    sessCard.appendChild(exDiv);
   }
   // Cooldown
   if (sess.cooldown && sess.cooldown.length > 0) {
    var coolDiv = h('div', {style: 'background:var(--surface,#F4F4F0);padding:8px 12px;border-radius:2px;margin-top:8px'});
    coolDiv.appendChild(h('div', {style: 'font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey3);margin-bottom:4px'}, 'RETOUR AU CALME'));
    var coolList = sess.cooldown.join(' | ');
    coolDiv.appendChild(h('div', {style: 'font-size:11px;color:var(--grey3)'}, coolList));
    sessCard.appendChild(coolDiv);
   }
   content.appendChild(sessCard);
  }
 }

 // ── GOLDEN RULES ──
 var rulesCard = h('div', {'class': 'card', style: 'margin-bottom:16px'});
 rulesCard.appendChild(h('div', {'class': 'label-caps', style: 'margin-bottom:12px'}, 'REGLES D OR CALLISTHENIE'));
 var rules = [
  'La regularite bat l intensite — 20 min/jour > 2h/semaine',
  'Repos 3-5 min entre series de skills (pas 60 sec)',
  'Maitrisez les prerequis AVANT de progresser',
  'Qualite > quantite — 1 rep parfaite vaut 10 reps baclees',
  'Echauffez les poignets SYSTEMATIQUEMENT',
  'La planche prend des annees — c est normal et c est beau'
 ];
 for (var ri = 0; ri < rules.length; ri++) {
  rulesCard.appendChild(h('div', {style: 'font-size:13px;margin-bottom:6px;padding-left:12px;border-left:2px solid var(--ink-900,#0A0A09)'}, rules[ri]));
 }
 content.appendChild(rulesCard);

 // ── DONE + BACK BUTTONS ──
 (function() {
  var _calDateStr = new Date().toISOString().slice(0, 10);
  var _calKey  = 'calis_' + _calDateStr;
  var _calDone = S.sessionHistory && S.sessionHistory[_calKey];
  var _calLvl  = S.calisthenicsLevel || 'intermediaire';
  var _calDur  = { debutant: 50, intermediaire: 65, avance: 80, elite: 90 }[_calLvl] || 65;
  content.appendChild(h('button', { 'class': 'btn-primary', style: 'margin-top:16px', disabled: !!_calDone,
    onclick: function() { _completeSportSession('calisthenics', _calLvl, _calDur, _calKey); }
  }, _calDone ? (window.isEnglish && window.isEnglish() ? '✓ Session logged' : '✓ Séance validée') : (window.isEnglish && window.isEnglish() ? '✓ Session done' : '✓ Séance terminée')));
 }());
 content.appendChild(h('button', {'class': 'btn-back', style: 'margin-top:16px', onclick: function(){ S.sStep = 24; window.render(); }}, '< Modifier les objectifs'));
 appendNutritionModeCTA(content);
}

// ─── EXPOSE GLOBALEMENT ───
window.renderWellnessCheckin = renderWellnessCheckin;

// ─── EXPORT SPORT PROGRAM PDF ─────────────────────────────────────────────
window.exportSportPDF = function() {
  window.safeUserStatusCheck({ force: true }).then(function(status) {
    if (!status.isPremium) {
      if (status.source === 'fallback' && window._showPremiumCheckFailed) { window._showPremiumCheckFailed(function() { window.exportSportPDF(); }); return; }
      if (window.showPaywall) window.showPaywall('pdf'); return;
    }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Loading PDF…' : 'Chargement du PDF…', 'info', 2000);
    if (window._lazyLoad) { window._lazyLoad('./jspdf.umd.min.js', window.exportSportPDF); }
    return;
  }
  if (!Array.isArray(S.sportProgram) || S.sportProgram.length === 0) { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'No program to export. Generate your program first.' : 'Aucun programme \u00e0 exporter. G\u00e9n\u00e9rez votre programme.', 'error', 4000); return; }
  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({unit: 'mm', format: 'a4'});
    var W = 210, M = 15, CW = W - 2 * M, y = 0;
    var ivory = [250, 250, 247], black = [10, 10, 9], grey = [107, 107, 101], green = [26, 74, 26];

    // Header
    doc.setFillColor(black[0], black[1], black[2]);
    doc.rect(0, 0, W, 34, 'F');
    doc.setTextColor(ivory[0], ivory[1], ivory[2]);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('SMART FIT COACH', M, 12);
    doc.setFont('times', 'italic'); doc.setFontSize(18);
    doc.text((window.isEnglish && window.isEnglish() ? 'Strength Program \u2014 Week ' : 'Programme Musculation \u2014 Semaine ') + (S.muscuWeek || 1), M, 24);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    var levelText = S.sportLevel === 'beginner' ? (window.isEnglish && window.isEnglish() ? 'Beginner' : 'D\u00e9butant') : S.sportLevel === 'intermediate' ? (window.isEnglish && window.isEnglish() ? 'Intermediate' : 'Interm\u00e9diaire') : (window.isEnglish && window.isEnglish() ? 'Advanced' : 'Avanc\u00e9');
    doc.text(levelText + '  |  ' + S.sportProgram.length + (window.isEnglish && window.isEnglish() ? ' days/week' : ' jours/semaine'), M, 31);
    y = 42;

    // Each day
    S.sportProgram.forEach(function(day, di) {
      if (y > 260) { doc.addPage(); y = 20; }
      // Day header
      doc.setFillColor(green[0], green[1], green[2]);
      doc.rect(M, y, CW, 8, 'F');
      doc.setTextColor(ivory[0], ivory[1], ivory[2]);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text((window.isEnglish && window.isEnglish() ? 'DAY ' : 'JOUR ') + (di + 1) + (day.name ? ' \u2014 ' + day.name : '') + (day.focus ? '  (' + day.focus + ')' : ''), M + 3, y + 5.5);
      y += 12;

      // Exercises
      doc.setTextColor(black[0], black[1], black[2]);
      (day.exercises || []).forEach(function(ex, ei) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setFont('times', 'normal'); doc.setFontSize(11);
        doc.text((ei + 1) + '. ' + (ex.n || 'Exercice'), M + 2, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.setTextColor(grey[0], grey[1], grey[2]);
        var detail = (ex.sets || 3) + '\u00d7' + (ex.reps || 10) + '  |  ' + (window.isEnglish && window.isEnglish() ? 'Rest ' : 'Repos ') + (ex.rest || 90) + 's';
        if (ex.eq) detail += '  |  ' + ex.eq;
        doc.text(detail, M + 2, y + 4.5);
        doc.setTextColor(black[0], black[1], black[2]);
        y += 10;
      });

      // Exercices bonus ajout\u00e9s par l'utilisateur (FIX audit 2026-04)
      var bonusList = (S.bonusExercises && S.bonusExercises[di]) || [];
      if (bonusList.length > 0) {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
        doc.setTextColor(grey[0], grey[1], grey[2]);
        doc.text((window.isEnglish && window.isEnglish() ? 'Bonus:' : 'Bonus :'), M + 2, y);
        y += 5;
        bonusList.forEach(function(bex) {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('times', 'normal'); doc.setFontSize(10);
          doc.setTextColor(black[0], black[1], black[2]);
          doc.text('+ ' + (bex.n || (window.isEnglish && window.isEnglish() ? 'Bonus exercise' : 'Exercice bonus')), M + 4, y);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
          doc.setTextColor(grey[0], grey[1], grey[2]);
          doc.text((bex.sets || '') + '  |  ' + (window.isEnglish && window.isEnglish() ? 'Rest ' : 'Repos ') + (bex.rest || '60s') + (bex.eq ? '  |  ' + bex.eq : ''), M + 4, y + 4);
          doc.setTextColor(black[0], black[1], black[2]);
          y += 9;
        });
      }

      y += 6;
    });

    // Footer
    doc.setFontSize(6); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text('Smart Fit Coach \u2014 ' + window.formatDate(new Date()), M, 290);
    doc.save('programme-musculation-sem' + (S.muscuWeek || 1) + '.pdf');
  } catch(e) { console.error('[exportSportPDF] Erreur:', e); if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Error generating program PDF' : 'Erreur lors de la g\u00e9n\u00e9ration du PDF programme', 'error', 3500); }
  }); // end safeUserStatusCheck.then
};

window.generateSportProgram = generateSportProgram;

})();
