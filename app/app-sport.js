// app-sport.js — MTD: Sport Module
(function(){
'use strict';
var S = window.S;
var h = window.h, txt = window.txt;

// ─── I3: TERM TOOLTIP HELPER ───
// Returns a span with a native tooltip (title attr) styled with dotted underline
function termTooltip(term, definition) {
 var span = document.createElement('span');
 span.textContent = term;
 span.title = definition;
 span.style.cssText = 'border-bottom:1px dotted var(--grey,#6B6B65);cursor:help;';
 return span;
}

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
 if (/militaire|d[eé]velopp[eé] militaire|developpe militaire|d[eé]velopp[eé] halteres|developpe halteres|arnold press|overhead press|el[eé]vation.*lat[eé]rale|elevations? lat[eé]rales?|elevation frontale|elevations? frontales?|dips|upright row|tirage menton|lu raise|behind.?neck|nuque|handstand|hspu/.test(n)) return false;
 }

 // ── COUDES — ÉPICONDYLITE LATÉRALE (tennis elbow) / MÉDIALE (golfer's elbow) ──
 // Rowing barre pronation = valgus forcé + extension poignet sous charge → épicondyle latéral.
 // Pull-ups/chin-ups pronation = traction répétée sur tendon extenseur commun.
 // Curl barre droite = flexion résistée supination → épicondyle médial.
 // Wrist curl = sollicitation directe des fléchisseurs → épicondyle médial (golfer's elbow).
 // Recommander : prise supination ou neutre, extensions poignet légères en rééducation.
 // Réf : Bisset & Vicenzino, JOSPT 2015 ; Coombes et al., Lancet 2013.
 if (med.elbows || med.epicondylitis) {
 if (/curl barre|curl.*halteres|curl marteau|curl concentre|curl pupitre|curl 21|chin.?up|tractions.*pronation|pull.?up.*pronation|skull.?crusher|barre.*front skullcrusher|french press|extension.*triceps|rowing barre|rowing.*prise large|tirage vertical|wrist curl/.test(n)) return false;
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
 if (med.lowerBack || med.herniaDisc) {
 if (/soulev[eé].*terre|deadlift|romanian deadlift|rdl|good morning|jefferson|squat barre|back squat|front squat|hack squat|presse.*cuisse|leg press|rowing barre|pendlay row|rowing t.?bar|t.?bar row|crunch|sit.?up|ab wheel|roue abdominal|hyperextension/.test(n)) return false;
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
 if (/squat barre|back squat|soulev[eé].*terre|deadlift|romanian deadlift|rdl|good morning/.test(n)) return false;
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
 if (!s || !s.pregnant || s.sex !== 'femme') return null;
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
function generateSportProgram() {
 var days = S.sportDays || 3;
 var level = (window.SPORT_LEVELS || []).find(function(l){ return l.id === S.sportLevel; });
 var program = [];

 // Adjust splits based on goals
 var _goals = S.sportGoals || [];
 var hasCardio = _goals.some(function(g){ return g === 'endurance' || g === 'weightloss' || g === 'shred'; });
 var hasMuscle = _goals.some(function(g){ return g === 'muscle'; });
 var hasShred = _goals.indexOf('shred') !== -1;
 var hasEndurance = _goals.indexOf('endurance') !== -1;
 var hasWeightloss = _goals.indexOf('weightloss') !== -1;
 var hasFlexibility = _goals.indexOf('flexibility') !== -1;

 // Map zone names to exercise categories
 var zoneToCategory = {
 'Poitrine': 'chest', 'Dos': 'back', 'Épaules': 'shoulders',
 'Bras': ['biceps', 'triceps'], 'Abdominaux': 'abs',
 'Jambes': 'legs', 'Fessiers': 'glutes', 'Cardio': 'cardio'
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
 function exerciseCountForPriority(pri) {
 var lvl = S.sportLevel || 'intermediate';
 if (lvl === 'beginner') {
 if (pri >= 5) return 2 + Math.round(Math.random()); // 2-3
 if (pri === 4) return 2;
 if (pri === 3) return 1 + Math.round(Math.random()); // 1-2
 if (pri === 2) return 1;
 return 1;
 } else if (lvl === 'advanced') {
 if (pri >= 5) return 4 + Math.round(Math.random()); // 4-5
 if (pri === 4) return 4;
 if (pri === 3) return 3 + Math.round(Math.random()); // 3-4
 if (pri === 2) return 2 + Math.round(Math.random()); // 2-3
 return 2;
 } else {
 // intermediate (original behaviour)
 if (pri >= 5) return 3 + Math.round(Math.random());
 if (pri === 4) return 3;
 if (pri === 3) return 2 + Math.round(Math.random());
 if (pri === 2) return 2;
 return 1 + Math.round(Math.random());
 }
 }

 // Maximum total exercises per session by level (BUG-18)
 var maxExercisesPerSession = S.sportLevel === 'beginner' ? 8
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

 // Determine rest and rep adjustments based on goals
 var restOverride = null;
 var repSuffix = '';
 var supersetNote = '';
 if (hasShred) {
 restOverride = '45-60s';
 repSuffix = ' (haute intensité)';
 supersetNote = ' — Superset recommandé';
 } else if (hasMuscle) {
 restOverride = '90-120s';
 repSuffix = '';
 } else if (hasWeightloss) {
 restOverride = '30-45s';
 repSuffix = ' (circuit)';
 }

 // Pregnancy: get trimester info for filtering
 var pregTri = null;
 var pregForbidden = [];
 var pregIntensityFactor = 1.0;
 if (S.pregnant && S.sex === 'femme' && window.getPregnancyTrimester) {
 pregTri = window.getPregnancyTrimester();
 if (pregTri && pregTri.trimester) {
 pregForbidden = pregTri.trimester.forbiddenExercises || [];
 pregIntensityFactor = pregTri.trimester.intensityFactor || 0.5;
 }
 }
 // Cycle phase: get intensity factor for menstrual cycle phase (non-pregnant women)
 var cycleIntensityFactor = 1.0;
 var cyclePhaseInfo = null;
 if (!S.pregnant && S.sex === 'femme' && S.cycleTracking && window.getCurrentCyclePhase) {
 cyclePhaseInfo = window.getCurrentCyclePhase();
 if (cyclePhaseInfo && cyclePhaseInfo.phase && cyclePhaseInfo.phase.intensityFactor) {
 cycleIntensityFactor = cyclePhaseInfo.phase.intensityFactor;
 }
 }

 // BUG-10: Track how many times each group has appeared this week (intra-week progression)
 var groupWeekOccurrence = {};

 // Generate exercises for each day
 var maxLv = S.sportLevel === 'beginner' ? 2 : S.sportLevel === 'intermediate' ? 3 : 4;
 // During pregnancy, cap level
 if (pregTri) maxLv = Math.min(maxLv, 2);

 for (var d = 0; d < days; d++) {
 var groups = daySplits[d];
 if (!groups.length) continue;
 var dayExercises = [];

 groups.forEach(function(group) {
 var pool = (window.EXERCISES && window.EXERCISES[group]) || [];
 var available = pool.filter(function(ex){ return ex.lv <= maxLv; });
 if (!available.length) available = pool.slice();

 // Equipment filter: exclude exercises requiring unavailable gear
 if (S.sportEquipment && S.sportEquipment !== 'gym') {
 var eqFiltered = available.filter(function(ex) {
 var eq = (ex.eq || '').toLowerCase();
 if (S.sportEquipment === 'home') {
 return /poids du corps|poids de corps|sans mat/.test(eq);
 }
 if (S.sportEquipment === 'dumbbells') {
 // Exclude exercises requiring cable machines, barbells, or specialized machines
 if (/câble|poulie|machine|t-bar|landmine|convergente|pec deck|barre de traction/.test(eq)) return false;
 // "barre + banc" requires barbell — exclude, but "haltères ou barre" → allow (use dumbbells)
 if (/^barre\b/.test(eq) && !/ou halt|halt[eè]res ou barre/.test(eq)) return false;
 return true;
 }
 return true;
 });
 // Fallback: if filter removes too many exercises, use unfiltered pool
 if (eqFiltered.length >= 2) available = eqFiltered;
 }

 // Pregnancy: filter forbidden exercises
 if (pregTri && pregForbidden.length > 0) {
 available = available.filter(function(ex) {
 var exName = (ex.n || ex.name || '').toLowerCase();
 for (var fi = 0; fi < pregForbidden.length; fi++) {
 if (exName.indexOf(pregForbidden[fi].toLowerCase()) !== -1) return false;
 }
 return true;
 });
 }

 // Medical restrictions: filter exercises based on muscuMedical profile
 if (S.muscuMedical && S.muscuMedical.done) {
 available = available.filter(function(ex){ return filterExerciseByMedical(ex, S.muscuMedical); });
 // Si le filtre médical a tout supprimé, on élargit le niveau MAIS on garde le filtre médical
 // (ne jamais proposer d'exercices contre-indiqués médicalement)
 if (available.length === 0) {
   available = pool.filter(function(ex){ return filterExerciseByMedical(ex, S.muscuMedical); });
 }
 // Si toujours vide après élargissement : laisser vide — renderMusculationProgram affichera l'erreur
 }

 var pri = categoryPriority[group] || 1;

 // For high priority: prefer compound exercises (sort by level desc within allowed range)
 if (pri >= 4) {
 available.sort(function(a, b) { return b.lv - a.lv || (0.5 - Math.random()); });
 } else {
 // Shuffle for variety
 available.sort(function(){ return 0.5 - Math.random(); });
 }

 var count = exerciseCountForPriority(pri);
 if (hasMuscle && group !== 'cardio') count = Math.min(count + 1, available.length);
 count = Math.min(count, available.length);

 // Pregnancy: reduce exercises per session
 if (pregTri) {
 count = Math.max(1, Math.round(count * pregIntensityFactor));
 }
 // Cycle phase: reduce exercises during low-intensity phases (luteal, menstruation)
 if (!pregTri && cycleIntensityFactor < 0.9) {
 count = Math.max(1, Math.round(count * cycleIntensityFactor));
 }

 // BUG-10: Determine intra-week occurrence index for this group
 var groupOcc = groupWeekOccurrence[group] || 0;
 groupWeekOccurrence[group] = groupOcc + 1;

 // Cycle-based offset: rotate exercise selection each cycle (guard against NaN)
 var poolRemainder = available.length - count;
 var cycleOffset = poolRemainder > 0 ? ((S.muscuCycle || 1) - 1) % poolRemainder : 0;
 var groupStartIdx = dayExercises.length; // track where this group's exercises start
 for (var i = 0; i < count; i++) {
 var ex = Object.assign({}, available[(i + cycleOffset) % available.length]);

 // Override rest based on goals
 if (restOverride) ex.rest = restOverride;

 // BUG-19: Beginners need extra rest on compound/complex exercises (lv >= 2)
 if (S.sportLevel === 'beginner' && ex.lv >= 2) {
 var restSec = parseInt((ex.rest || '90s').replace(/[^0-9]/g,'')) || 90;
 ex.rest = Math.min(restSec + 30, 180) + 's';
 }

 // Pregnancy: longer rest
 if (pregTri) ex.rest = '90-120s';
 // Cycle phase: reduce sets during low-intensity phases (luteal/menstruation)
 if (!pregTri && cycleIntensityFactor < 0.9) {
 if (typeof ex.sets === 'number') {
 ex.sets = Math.max(2, Math.round(ex.sets * cycleIntensityFactor));
 } else if (typeof ex.sets === 'string') {
 // sets is formatted as "N×reps" — reduce the leading set count
 ex.sets = ex.sets.replace(/^(\d+)/, function(match, n) {
 return String(Math.max(2, Math.round(parseInt(n) * cycleIntensityFactor)));
 });
 }
 }

 // Add rep suffix for shred/weightloss
 if (repSuffix && ex.sets) ex.sets = ex.sets + repSuffix;

 // Add superset note for shred
 if (supersetNote && i > 0 && i % 2 === 0 && ex.n) ex.n = ex.n + supersetNote;

 dayExercises.push(ex);
 }

 // BUG-10: Apply intra-week progressive overload variation for repeated muscle groups
 // occ 0 = base session, occ 1 = active recovery (−1 set), occ 2 = endurance focus (+2 reps)
 if (groupOcc > 0) {
 for (var gi = groupStartIdx; gi < dayExercises.length; gi++) {
 var gex = dayExercises[gi];
 if (groupOcc % 2 === 1) {
 // 2nd occurrence: reduce sets by 1 for active recovery
 if (typeof gex.sets === 'string') {
 gex.sets = gex.sets.replace(/^(\d+)/, function(m, n) {
 var reduced = Math.max(1, parseInt(n) - 1);
 return String(reduced);
 });
 }
 } else {
 // 3rd, 5th... occurrence: endurance focus — add 2 reps to rep ranges
 if (typeof gex.sets === 'string') {
 gex.sets = gex.sets.replace(/(\d+)(-(\d+))?$/, function(m, r1, dash, r2) {
 if (r2) {
 return (parseInt(r1) + 2) + '-' + (parseInt(r2) + 2);
 }
 return String(parseInt(r1) + 2);
 });
 }
 }
 }
 }
 });

 // Pregnancy: add Kegel exercises to every day
 if (pregTri) {
 dayExercises.push({
 n: 'Exercices de Kegel',
 m: 'Plancher pelvien',
 sets: '3 x 10 contractions (5s tenue)',
 rest: '30s',
 eq: 'Aucun',
 lv: 1,
 desc: 'Contractez les muscles du plancher pelvien comme pour retenir l\'urine. Tenez 5 secondes, rel\u00e2chez 5 secondes. R\u00e9p\u00e9tez.',
 tips: ['Essentiel pour pr\u00e9parer l\'accouchement', 'Pr\u00e9vient l\'incontinence', 'Peut \u00eatre fait n\'importe o\u00f9'],
 video: 'https://www.youtube.com/results?search_query=exercices+kegel+grossesse'
 });
 }

 // ─── Level-based exercise count cap (BUG-18) ───
 if (dayExercises.length > maxExercisesPerSession) {
 dayExercises = dayExercises.slice(0, maxExercisesPerSession);
 }

 // ─── Duration-based exercise count cap and sets adjustment ───
 if (S.sportSessionDuration) {
 var durMax, durSetsTarget;
 if (S.sportSessionDuration === '45min') { durMax = 5; durSetsTarget = 3; }
 else if (S.sportSessionDuration === '1h') { durMax = 6; durSetsTarget = 3; }
 else if (S.sportSessionDuration === '1h15') { durMax = 7; durSetsTarget = 4; }
 else { durMax = 8; durSetsTarget = 4; } // 1h30

 // Cap total exercises per session
 if (dayExercises.length > durMax) {
 dayExercises = dayExercises.slice(0, durMax);
 }

 // Adjust sets to match duration target
 dayExercises.forEach(function(ex) {
 if (typeof ex.sets === 'string') {
 // sets format is e.g. "4×8-12" — replace the leading number
 ex.sets = ex.sets.replace(/^\d+/, String(durSetsTarget));
 }
 });
 }

 // Build focus label with star ratings (French names, max 5 stars, deduplicated)
 var categoryToFrench = {
 'chest': 'Poitrine', 'back': 'Dos', 'shoulders': 'Épaules',
 'biceps': 'Bras', 'triceps': 'Bras', 'legs': 'Jambes',
 'glutes': 'Fessiers', 'abs': 'Abdominaux', 'cardio': 'Cardio'
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
 for (var s = 0; s < starCount; s++) stars += '';
 focusParts.push(label + (stars ? ' ' + stars : ''));
 });
 var focusLabel = focusParts.join(' · ');

 // PPL split naming for 5 days when user has muscle goal (advanced/pro)
 var isPPL5 = (days === 5 && hasMuscle && (S.sportLevel === 'advanced' || S.sportLevel === 'pro'));
 var PPL5_NAMES = ['Push A', 'Pull A', 'Legs', 'Push B', 'Pull B'];
 var PPL5_FOCUS = ['Poitrine · Épaules · Triceps', 'Dos · Biceps · Trapèzes', 'Quadriceps · Ischio-jambiers · Fessiers', 'Épaules · Poitrine · Triceps', 'Ischio-jambiers · Fessiers · Dos'];

 program.push({
 name: isPPL5 ? PPL5_NAMES[d] : 'Jour ' + (d + 1),
 focus: isPPL5 ? PPL5_FOCUS[d] : focusLabel,
 exercises: dayExercises,
 warmup: {
  duration: 8,
  exercises: [
   { name: 'Cardio léger (vélo/tapis)', duration: '5 min', intensity: 'Faible' },
   { name: 'Mobilité articulaire', duration: '3 min', notes: 'Cercles épaules, hanches, chevilles' }
  ]
 },
 cooldown: {
  duration: 5,
  exercises: [
   { name: 'Marche ou vélo léger', duration: '3 min', intensity: 'Très faible' },
   { name: 'Étirements statiques', duration: '2 min', notes: 'Groupes musculaires travaillés' }
  ]
 }
 });
 }

 return program;
}

// ─── MODULE CONSTANT: sport → step de programme ───
var _SPORT_PROGRAM_STEP = {
  musculation: 4, crossfit: 6, running: 8, hyrox: 10,
  padel: 12, golf: 14, triathlon: 18, yoga: 21, cycling: 23, calisthenics: 25
};

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
    prenom ? 'Votre protocole ' + sportLabel + '\nest actif, ' + prenom + '.' : 'Votre protocole ' + sportLabel + '\nest déjà établi.'
  ));
  wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;letter-spacing:0.5px;line-height:1.7;color:#555;max-width:300px;margin:0 auto 40px'},
    'Souhaitez-vous poursuivre votre programme en cours,\nou en définir un entièrement nouveau\u00a0?'
  ));

  var targetStep = _SPORT_PROGRAM_STEP[S.sportType] || 4;

  var btnContinue = h('button', {
    style: 'display:block;width:100%;max-width:300px;padding:16px 24px;background:var(--black,#0A0A09);color:#fff;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;margin:0 auto 14px',
    onclick: function() { S.sStep = targetStep; window.render(); }
  }, 'Poursuivre mon protocole');

  var btnNew = h('button', {
    style: 'display:block;width:100%;max-width:300px;padding:15px 24px;background:transparent;color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid var(--black,#0A0A09);cursor:pointer;margin:0 auto',
    onclick: function() {
      if (window._wodTimerInterval) { clearInterval(window._wodTimerInterval); window._wodTimerInterval = null; }
      if (_restTimerInterval) { clearInterval(_restTimerInterval); _restTimerInterval = null; }
      S.sportType = null; S.sStep = 0; S.selectedSportDay = 0;
      S.sportGoals = []; S.sportLevel = null; S.sportFocus = {};
      S.sportProgram = null; S.sportDays = 3; S.sportSessionDuration = null;
      S.bonusExercises = {}; S._splitChoice = null; S.cfCalendarOpen = false;
      S.trainingDaysSelected = [];
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      window.render();
    }
  }, 'Définir un nouveau protocole');

  wrap.appendChild(btnContinue);
  wrap.appendChild(btnNew);
  p.appendChild(wrap);
}

// ─── EXPORTS ───
window.getPregnancySportWarning = getPregnancySportWarning;

// ─── QUICK PROFILE (mode sport-seulement) ───
function renderSportQuickProfile(p) {
  var wrap = h('div', {style: 'max-width:420px;margin:0 auto;padding:48px 20px 40px'});

  wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px'}, 'VOTRE PROFIL'));
  wrap.appendChild(h('div', {style: 'width:36px;height:1px;background:var(--black,#1A1A18);margin-bottom:20px'}));
  var titleEl = h('div', {style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;font-style:italic;line-height:1.45;margin-bottom:28px;color:var(--black,#1A1A18)'}, 'Quelques informations\npour personnaliser\nvotre programme.');
  titleEl.style.whiteSpace = 'pre-line';
  wrap.appendChild(titleEl);

  if (!S.sex) {
    // ── Étape A : choix du sexe — toggle buttons ──
    wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px'}, 'Votre sexe'));
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
    prenomWrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'Votre prénom (optionnel)'));
    var prenomInput = h('input', {
      type: 'text',
      value: S.prenom || '',
      placeholder: 'Sophie',
      style: 'width:100%;height:48px;border:1px solid var(--border,#E8E6DF);background:var(--ivory,#FAF9F6);font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);padding:0 16px;box-sizing:border-box;border-radius:2px;outline:none;-webkit-appearance:none;',
      oninput: function(e) { S.prenom = e.target.value.trim(); if (window.saveProfile) { try { window.saveProfile(); } catch(err) {} } }
    });
    prenomWrap.appendChild(prenomInput);
    wrap.appendChild(prenomWrap);

    wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px'}, 'Votre \u00e2ge'));
    var ageInput = h('input', {
      type: 'number', min: '13', max: '99', inputmode: 'numeric',
      style: 'width:100%;height:48px;border:1px solid var(--border,#E8E6DF);background:var(--ivory,#FAF9F6);font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);padding:0 16px;box-sizing:border-box;border-radius:2px;outline:none;-webkit-appearance:none;',
      value: S.age ? String(S.age) : '',
      placeholder: '25'
    });
    var ageErr = h('div', {style: 'font-size:11px;color:#8B2020;margin-top:4px;display:none', role: 'alert'}, '');
    ageInput.addEventListener('change', function() {
      var v = parseInt(this.value);
      if (!isNaN(v) && v >= 13 && v <= 99) { S.age = v; ageErr.style.display = 'none'; }
      else { this.value = S.age ? String(S.age) : ''; ageErr.textContent = v < 13 ? '\u00c2ge entre 13 et 99 ans.' : 'Veuillez indiquer votre \u00e2ge.'; ageErr.style.display = 'block'; }
    });
    ageInput.addEventListener('focus', function() { setTimeout(function() { ageInput.scrollIntoView({behavior:'smooth', block:'center'}); }, 300); });
    wrap.appendChild(ageInput);
    wrap.appendChild(ageErr);

    wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:16px 0 8px'}, 'Votre poids (kg)'));
    var weightInput = h('input', {
      type: 'number', min: '30', max: '300', step: '0.5', inputmode: 'decimal',
      style: 'width:100%;height:48px;border:1px solid var(--border,#E8E6DF);background:var(--ivory,#FAF9F6);font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);padding:0 16px;box-sizing:border-box;border-radius:2px;outline:none;-webkit-appearance:none;',
      value: S.weight ? String(S.weight) : '',
      placeholder: '70'
    });
    var weightErr = h('div', {style: 'font-size:11px;color:#8B2020;margin-top:4px;display:none', role: 'alert'}, '');
    weightInput.addEventListener('change', function() {
      var v = parseFloat(this.value);
      if (!isNaN(v) && v >= 30 && v <= 300) { S.weight = v; weightErr.style.display = 'none'; }
      else { this.value = S.weight ? String(S.weight) : ''; weightErr.textContent = 'Entre 30 et 300 kg.'; weightErr.style.display = 'block'; }
    });
    weightInput.addEventListener('focus', function() { setTimeout(function() { weightInput.scrollIntoView({behavior:'smooth', block:'center'}); }, 300); });
    wrap.appendChild(weightInput);
    wrap.appendChild(weightErr);

    var canContinue = !!(S.age && S.weight);
    var btnContinue = h('button', {
      style: 'width:100%;height:52px;margin-top:28px;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;transition:background .2s ease,color .2s ease;cursor:' + (canContinue ? 'pointer' : 'not-allowed') + ';background:' + (canContinue ? 'var(--black,#1A1A18)' : 'var(--border,#E8E6DF)') + ';color:' + (canContinue ? '#FAF9F6' : 'var(--grey,#6B6B65)') + ';',
      disabled: !canContinue,
      onclick: function() {
        if (!S.age || !S.weight) return;
        S._sportProfileDone = true;
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        window.render();
      }
    }, 'Commencer');
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

 // ─── Mode sport-seulement : collecter identité si manquante ───
 if (S.appMode === 'sport' && (!S.sex || !S.age || !S.weight || !S._sportProfileDone)) {
   renderSportQuickProfile(content);
   p.appendChild(content);
   return;
 }

 // ─── Guard : sStep > 0 sans sportType → page blanche possible, réinitialiser ───
 if (S.sStep > 0 && !S.sportType) { S.sStep = 0; }

 // ─── Si programme existant → afficher directement la prog (plus d'interstitiel) ───
 // Guard: ne rediriger que si un programme complet existe — évite de sauter l'onboarding
 // après un rechargement partiel (ex: sStep=26 PAR-Q réinitialisé à 0 par _doAutoLogin)
 if (S.sStep === 0 && S.sportType && _SPORT_PROGRAM_STEP[S.sportType] && Array.isArray(S.sportProgram) && S.sportProgram.length > 0) {
   S.sStep = _SPORT_PROGRAM_STEP[S.sportType];
   if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
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
 var sportLabel = S.sportType === 'crossfit' ? 'Cross Training' : S.sportType === 'running' ? 'Running' : S.sportType === 'hyrox' ? 'Hyrox' : S.sportType === 'padel' ? 'Padel' : S.sportType === 'golf' ? 'Golf' : S.sportType === 'triathlon' ? 'Triathlon / IRONMAN' : S.sportType === 'yoga' ? 'Yoga & Mobilit\u00e9' : S.sportType === 'cycling' ? 'Cyclisme' : S.sportType === 'calisthenics' ? 'Callisth\u00e9nie' : 'Musculation';
 hdr.appendChild(h('div', {'class': 'logo', html: 'SMARTFITCOACH<span>' + sportLabel + '</span>'}));
 var totalSteps = S.sportType === 'crossfit' ? 2 : S.sportType === 'running' ? 2 : S.sportType === 'hyrox' ? 2 : S.sportType === 'padel' ? 2 : S.sportType === 'golf' ? 2 : S.sportType === 'triathlon' ? 2 : S.sportType === 'yoga' ? 2 : S.sportType === 'cycling' ? 2 : S.sportType === 'calisthenics' ? 2 : 4;
 // sStep 20 (medical) maps to display step 0 for musculation (shown as "Éval. médicale")
 var currentDisplay = S.sStep === 26 ? 0 : S.sStep === 20 ? 0 : S.sportType === 'crossfit' ? S.sStep - 4 : S.sportType === 'running' ? S.sStep - 6 : S.sportType === 'hyrox' ? S.sStep - 8 : S.sportType === 'padel' ? S.sStep - 10 : S.sportType === 'golf' ? S.sStep - 12 : S.sportType === 'triathlon' ? S.sStep - 16 : S.sportType === 'yoga' ? S.sStep - 18 : S.sportType === 'cycling' ? S.sStep - 21 : S.sportType === 'calisthenics' ? S.sStep - 23 : S.sStep;
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
       S.sportProgram = null; S.sportDays = 3; S.sportSessionDuration = null;
       S.bonusExercises = {}; S._splitChoice = null; S.cfCalendarOpen = false;
       S.trainingDaysSelected = [];
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       if (window.render) window.render();
     }
   }, 'Changer de sport');
   hdr.appendChild(_changeLink);
 } else {
   var stepLabel = S.sStep === 26 ? 'Questionnaire sant\u00e9' : S.sStep === 20 ? '\u00c9val. m\u00e9dicale' : S.sStep === 16 ? '\u00c9val. des charges' : S.sStep === 15 ? 'Programmes d\u00e9di\u00e9s' : ('\u00c9tape ' + currentDisplay + ' / ' + totalSteps);
   hdr.appendChild(h('div', {'class': 'step-indicator'}, stepLabel));
 }
 p.appendChild(hdr);
 var pb = h('div', {'class': 'progress-bar'});
 var _pbPct = S.sStep === 26 ? 5 : S.sStep === 20 ? 5 : S.sStep === 16 ? 15 : S.sStep === 15 ? 100 : (currentDisplay / totalSteps * 100);
 pb.appendChild(h('div', {'class': 'progress-fill', style: 'width:' + _pbPct + '%'}));
 p.appendChild(pb);
 }

 var _validSSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
 if (_validSSteps.indexOf(S.sStep) === -1) { S.sStep = 0; }

 if (S.sStep === 0) renderObjectif(content); // Type selection
 else if (S.sStep === 26) renderPARQ(content); // PAR-Q screening (ACSM 2018)
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

 // ─── BANDEAU BIEN-ÊTRE (non-bloquant) ───
 if (S._wellnessReminder) {
   renderWellnessBanner(content);
 }

 p.appendChild(content);
 renderSportModal(p);
 }
};

// ─── SPORT QUOTES ───
var SPORT_QUOTES = [
 {t:"Les champions ne sont pas faits dans les salles de gym. Les champions sont faits \u00e0 partir de quelque chose de profond.",a:"Muhammad Ali"},
 {t:"Le talent gagne des matchs, mais le travail d'\u00e9quipe et l'intelligence gagnent des championnats.",a:"Michael Jordan"},
 {t:"La force ne vient pas de la capacit\u00e9 physique. Elle vient d'une volont\u00e9 indomptable.",a:"Gandhi"},
 {t:"Le succ\u00e8s n'est pas d\u00e9finitif, l'\u00e9chec n'est pas fatal. C'est le courage de continuer qui compte.",a:"Winston Churchill"},
 {t:"Ne comptez pas les jours, faites que les jours comptent.",a:"Muhammad Ali"},
 {t:"Le sport ne forge pas le caract\u00e8re. Il le r\u00e9v\u00e8le.",a:"Heywood Broun"},
 {t:"La discipline est le pont entre les objectifs et l'accomplissement.",a:"Jim Rohn"},
 {t:"Le sport va chercher la peur pour la dominer, la fatigue pour en triompher.",a:"Pierre de Coubertin"},
 {t:"Seuls ceux qui risquent d'aller trop loin peuvent d\u00e9couvrir jusqu'o\u00f9 on peut aller.",a:"T.S. Eliot"},
 {t:"Un champion est quelqu'un qui se rel\u00e8ve quand il ne peut pas.",a:"Jack Dempsey"},
 {t:"La pers\u00e9v\u00e9rance n'est pas une longue course. C'est plusieurs courtes courses l'une apr\u00e8s l'autre.",a:"Walter Elliot"},
 {t:"La victoire appartient au plus pers\u00e9v\u00e9rant.",a:"Napol\u00e9on Bonaparte"},
 {t:"La sueur d'aujourd'hui est la force de demain.",a:""},
 {t:"Vous n'\u00eates qu'\u00e0 un entra\u00eenement d'une bonne humeur.",a:""},
 {t:"Le plus grand ennemi de la performance est l'impatience.",a:"Tiger Woods"},
 {t:"Soit tu souffres de la douleur de la discipline, soit tu souffres du regret.",a:"Jim Rohn"},
 {t:"Je n'ai jamais perdu. J'ai seulement appris.",a:"Nelson Mandela"},
 {t:"La pr\u00e9paration, c'est tout.",a:"Alexander Graham Bell"},
 {t:"Aucun raccourci ne m\u00e8ne au sommet.",a:"Tenzing Norgay"},
 {t:"Le mental est l'athl\u00e8te. Le corps, simplement l'instrument.",a:"Clarence Greene"},
 {t:"Chaque record battu \u00e9tait autrefois consid\u00e9r\u00e9 impossible.",a:""},
 {t:"La r\u00e9gularit\u00e9 construit ce que l'intensit\u00e9 seule ne peut pas.",a:""},
 {t:"Un athl\u00e8te accompli sait que la r\u00e9cup\u00e9ration est aussi importante que l'effort.",a:""},
 {t:"Le corps devient ce qu'il fait r\u00e9guli\u00e8rement.",a:"Aristote"},
 {t:"Ce n'est pas la force qui gagne, c'est la technique et la volont\u00e9.",a:""},
 {t:"On ne devient pas athl\u00e8te en un jour, mais on peut d\u00e9cider de l'\u00eatre en un instant.",a:""},
 {t:"La douleur est temporaire. La r\u00e9ussite est permanente.",a:""},
 {t:"L'ath\u00e8te vit dans deux mondes simultan\u00e9ment : la r\u00e9alit\u00e9 et le possible.",a:"Wilma Rudolph"},
 {t:"La pr\u00e9paration d'hier est la performance d'aujourd'hui.",a:""},
 {t:"Chaque entra\u00eenement est une promesse tenue \u00e0 soi-m\u00eame.",a:""},
 {t:"La comp\u00e9tition commence l\u00e0 o\u00f9 les autres s'arr\u00eatent.",a:""},
 {t:"L'excellence n'est pas un acte, c'est une habitude.",a:"Aristote"},
 {t:"Le champion d'hier s'est entra\u00een\u00e9 quand personne ne regardait.",a:""},
 {t:"Fixez des objectifs si hauts que vos r\u00eaves semblent petits en comparaison.",a:""},
 {t:"La vitesse s'acquiert. L'endurance se construit. Le mental se forge.",a:""},
 {t:"Repoussez vos limites \u2014 non pas pour les d\u00e9passer, mais pour d\u00e9couvrir o\u00f9 elles sont vraiment.",a:""},
 {t:"Le secret des champions est simple : ils s'entra\u00eenent quand \u00e7a ne leur convient pas.",a:""},
 {t:"Ce qui ne te brise pas te construit, \u00e0 condition de continuer.",a:""},
 {t:"Gagner c'est bien. Progresser, c'est mieux.",a:""},
 {t:"La discipline du corps lib\u00e8re l'esprit.",a:""},
 {t:"L'entra\u00eenement dur pr\u00e9pare aux comp\u00e9titions faciles.",a:""}
];

// ─── STEP 0: TYPE SELECTION ONLY ───
function renderObjectif(p) {
 // Sport splash with strong headline and random quote
 if (!S.sportSplashDone) {
 var q = SPORT_QUOTES[Math.floor(Math.random() * SPORT_QUOTES.length)];
 var _prenomSplash = S.prenom || '';
 var splash = h('div', {style: 'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px 40px;min-height:60vh'});
 splash.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey);margin-bottom:10px;opacity:0;animation:splashFadeUp .5s ease .1s forwards'}, 'SMARTFITCOACH \u00b7 SPORT'));
 splash.appendChild(h('div', {style: 'width:36px;height:1px;background:var(--black);margin:0 auto 24px;opacity:0;animation:splashFadeUp .5s ease .25s forwards'}));

 // Strong personalized headline
 var _splashHeadline = h('div', {style: 'font-family:Georgia,serif;font-size:clamp(28px,8vw,40px);font-weight:normal;line-height:1.1;letter-spacing:-.02em;color:var(--black);opacity:0;animation:splashFadeUp .6s ease .35s forwards;margin-bottom:16px;max-width:340px'});
 var _headlineText = _prenomSplash ? (_prenomSplash + ', votre\u00a0programme\u00a0sport\u00a0vous\u00a0attend.') : 'Entra\u00eenez-vous mieux.\n<em>Progressez plus vite.</em>';
 _splashHeadline.innerHTML = _headlineText;
 _splashHeadline.style.whiteSpace = 'pre-line';
 splash.appendChild(_splashHeadline);

 splash.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:var(--grey);line-height:1.65;max-width:290px;opacity:0;animation:splashFadeUp .6s ease .5s forwards;margin-bottom:28px'}, 'Un protocole sport con\u00e7u sur vos objectifs, votre niveau et votre agenda.'));

 // Quote
 var quoteDiv = h('div', {style: 'font-family:Georgia,serif;font-size:15px;font-style:italic;color:var(--black);line-height:1.6;max-width:300px;opacity:0;animation:splashFadeUp .6s ease .6s forwards;margin-bottom:32px;padding:16px 20px;border-left:2px solid var(--border,#D8D8D0);text-align:left'});
 quoteDiv.appendChild(h('span', {}, '\u201C' + q.t + '\u201D'));
 if (q.a) {
   quoteDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-top:10px'}, '\u2014 ' + q.a));
 }
 splash.appendChild(quoteDiv);

 var _splashBtn = h('button', {style: 'display:block;width:100%;max-width:320px;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;min-height:56px;padding:0 24px;border:none;cursor:pointer;opacity:0;animation:splashFadeUp .6s ease .8s forwards;border-radius:2px', onclick: function(){ S.sportSplashDone = true; if(window.BLACKBOX)BLACKBOX.log('sport_splash_done'); window.render(); }}, 'Je commence \u2192');
 splash.appendChild(_splashBtn);
 p.appendChild(splash);
 return;
 }

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Sport'));
 p.appendChild(h('h1', {html: 'Votre<br><em>programme</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Choisissez votre type de programme sportif.'));

 // Banner contextuel pour les utilisateurs nutrition → sport (tous sports, pas musculation seule)
 if (window.S && window.S._switchedFromNutrition) {
   var _ctxBannerObj = document.createElement('div');
   _ctxBannerObj.style.cssText = 'margin-bottom:16px;padding:12px 14px;background:rgba(26,74,26,0.06);border:1px solid rgba(26,74,26,0.15);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--green,#1A4A1A);line-height:1.5;';
   _ctxBannerObj.textContent = 'Votre profil de base est déjà configuré. Complétez simplement vos informations sportives ci-dessous.';
   window.S._switchedFromNutrition = false; // Afficher une seule fois
   p.appendChild(_ctxBannerObj);
 }

 // ─── HERO CARTE GÉNÉRATEUR IA ───
 var heroCard = h('div', {style: 'border:1px solid var(--accent,#1A4A1A);background:rgba(26,74,26,0.04);border-radius:2px;padding:20px 16px;margin-bottom:20px'});
 heroCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--accent,#1A4A1A);font-weight:400;margin-bottom:14px'}, 'PROTOCOLE EXCLUSIF · 12 SEMAINES'));
 heroCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;font-style:italic;line-height:1.3;margin-bottom:10px'}, 'Votre programme, \u00e0 nulle autre pareil.'));
 heroCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.7;margin-bottom:16px'}, 'Con\u00e7u sur vos mesures exactes, vos contraintes, votre ambition. Rien de g\u00e9n\u00e9rique. Rien de standard.'));
 var heroIaBtn = h('button', {id: 'hero-ia-btn', style: 'width:100%;padding:16px;background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif'}, 'OBTENIR MON PROTOCOLE');
 heroIaBtn.addEventListener('click', function() {
  if (typeof window.openMuscuProgramGenerator === 'function') {
   window.openMuscuProgramGenerator();
  }
 });
 heroCard.appendChild(heroIaBtn);
 p.appendChild(heroCard);

 // Divider
 var divider = h('div', {style: 'text-align:center;color:var(--grey,#6B6B65);font-size:11px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif'}, '— ou choisir votre sport —');
 p.appendChild(divider);

 p.appendChild(h('div', {'class': 'section-label'}, 'Type de programme'));
 var typeGrid = h('div', {'class': 'card-grid-2'});

 // Musculation - clicking goes to PAR-Q first (if not already done), then medical questionnaire (step 20)
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'musculation';
 if (!S.parqDone) { S._parqNextStep = 20; S.sStep = 26; } else { S.sStep = 20; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'musculation'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Musculation'),
 h('div', {'class': 'card-sub'}, 'Programme cibl\u00e9 par groupes musculaires'),
 h('div', {'class': 'card-tag'}, 'S\u00e8che \u00b7 Masse \u00b7 Force \u00b7 Endurance')
 ]));

 // Cross Training - clicking goes through PAR-Q (if not done), then CF level (step 5)
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'crossfit';
 if (!S.parqDone) { S._parqNextStep = 5; S.sStep = 26; } else { S.sStep = 5; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'crossfit'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Cross Training'),
 h('div', {'class': 'card-sub'}, 'Halt\u00e9rophilie \u00b7 WOD \u00b7 Gymnastique'),
 h('div', {'class': 'card-tag'}, '100 WODs \u00b7 Cycles 6 semaines \u00b7 Scaled/Inter/RX')
 ]));

 // Running card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'running';
 if (!S.parqDone) { S._parqNextStep = 7; S.sStep = 26; } else { S.sStep = 7; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'running'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Running'),
 h('div', {'class': 'card-sub'}, 'Plan d\'entraînement course à pied'),
 h('div', {'class': 'card-tag'}, '5K · 10K · Semi · Marathon · Trail')
 ]));

 // Hyrox card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'hyrox';
 if (!S.parqDone) { S._parqNextStep = 9; S.sStep = 26; } else { S.sStep = 9; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'hyrox'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Hyrox'),
 h('div', {'class': 'card-sub'}, 'Préparation Hyrox complète'),
 h('div', {'class': 'card-tag'}, '8 stations · Run · Simulation')
 ]));

 // Padel card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'padel';
 if (!S.parqDone) { S._parqNextStep = 11; S.sStep = 26; } else { S.sStep = 11; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'padel'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Padel'),
 h('div', {'class': 'card-sub'}, 'Programme technique et physique padel'),
 h('div', {'class': 'card-tag'}, 'Technique · Tactique · Match · Physique')
 ]));

 // Golf card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'golf';
 if (!S.parqDone) { S._parqNextStep = 13; S.sStep = 26; } else { S.sStep = 13; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'golf'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Golf'),
 h('div', {'class': 'card-sub'}, 'Progresser au golf — méthode Dave Pelz'),
 h('div', {'class': 'card-tag'}, 'Petit jeu · Long jeu · Parcours · Mental')
 ]));

 // Triathlon / IRONMAN card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'triathlon';
 if (!S.parqDone) { S._parqNextStep = 17; S.sStep = 26; } else { S.sStep = 17; }
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
 if (!S.parqDone) { S._parqNextStep = 19; S.sStep = 26; } else { S.sStep = 19; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'yoga'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Yoga & Mobilit\u00e9'),
 h('div', {'class': 'card-sub'}, 'Flexibilit\u00e9, force, \u00e9quilibre, pleine conscience'),
 h('div', {'class': 'card-tag'}, 'Hatha \u00b7 Vinyasa \u00b7 Yin \u00b7 Ashtanga')
 ]));

 // Cyclisme card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'cycling';
 if (!S.parqDone) { S._parqNextStep = 22; S.sStep = 26; } else { S.sStep = 22; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'cycling'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Cyclisme'),
 h('div', {'class': 'card-sub'}, 'Route, VTT, indoor \u2014 am\u00e9liore l\'endurance et la puissance'),
 h('div', {'class': 'card-tag'}, 'Route \u00b7 VTT \u00b7 Indoor \u00b7 Gravel \u00b7 FTP')
 ]));

 // Callisthénie card
 typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
 S.sportType = 'calisthenics';
 S.calisthenicsOnboardingStep = 'A';
 if (!S.parqDone) { S._parqNextStep = 24; S.sStep = 26; } else { S.sStep = 24; }
 if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'calisthenics'});
 window.render();
 }}, [
 h('div', {'class': 'card-name'}, 'Callisth\u00e9nie'),
 h('div', {'class': 'card-sub'}, 'Street workout, mouvements au poids du corps'),
 h('div', {'class': 'card-tag'}, 'Muscle-up \u00b7 Handstand \u00b7 Planche \u00b7 Front Lever')
 ]));

 p.appendChild(typeGrid);

 // No Continue button needed - cards auto-navigate
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
 var _rawWeight = parseFloat(S.weight);
 var poids = (_rawWeight > 0) ? _rawWeight : 75;
 var defaultDur = SESSION_DURATION_DEFAULTS[sportType] ? (SESSION_DURATION_DEFAULTS[sportType][levelNorm] || SESSION_DURATION_DEFAULTS[sportType][level] || 60) : 60;
 var dureeMin = durationMins || defaultDur;
 var duree = dureeMin / 60;
 return Math.round(met * poids * duree);
}
window.estimateKcal = estimateKcal;

// Creer une carte estimation calorique pour les programmes sport
function buildKcalCard(kcal, durationMins) {
  var dureeStr = durationMins ? (durationMins + ' min') : '--';
  var kcalCard = h('div', {style: 'border:1px solid var(--border);background:var(--ivory2,#F4F4F0);padding:16px 20px;margin-bottom:20px;display:flex;align-items:stretch;gap:0'});

  var leftCol = h('div', {style: 'flex:1;padding-right:20px'});
  leftCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:6px'}, 'Estimation séance'));
  leftCol.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:26px;font-style:italic;color:var(--black);line-height:1'}, '~' + kcal + ' kcal'));
  kcalCard.appendChild(leftCol);

  var divider = h('div', {style: 'width:1px;background:var(--border);flex-shrink:0'});
  kcalCard.appendChild(divider);

  var rightCol = h('div', {style: 'padding-left:20px;display:flex;flex-direction:column;justify-content:center'});
  rightCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:6px'}, 'Durée'));
  rightCol.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:26px;font-style:italic;color:var(--black);line-height:1'}, dureeStr));
  kcalCard.appendChild(rightCol);

  return kcalCard;
}

// ─── STEP 26: PAR-Q — QUESTIONNAIRE DE PRÉ-QUALIFICATION MÉDICALE (ACSM 2018) ───
function renderPARQ(p) {
 // Si déjà complété, passer directement au step suivant
 if (S.parqDone) {
  var _next = S._parqNextStep || 0;
  S.sStep = _next;
  if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
  setTimeout(function() { if (window.render) window.render(); }, 0);
  return;
 }

 // Initialiser les réponses PAR-Q si nécessaire
 if (!S._parqAnswers || typeof S._parqAnswers !== 'object') S._parqAnswers = {};

 // Header avec retour
 var hdr = h('div', {style: 'display:flex;align-items:center;gap:12px;margin-bottom:20px'});
 hdr.appendChild(h('button', {'class': 'btn-back', style: 'margin:0', onclick: function(){ S.sStep = 0; S.sportType = null; S._parqAnswers = {}; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 hdr.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--grey)'}, 'Évaluation médicale'));
 p.appendChild(hdr);

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Sécurité'));
 p.appendChild(h('h1', {html: 'Questionnaire<br><em>PAR-Q</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Avant de démarrer votre programme, répondez à ces 7 questions recommandées par l\'ACSM (2018). Vos réponses sont confidentielles.'));

 // 7 questions PAR-Q
 var PARQ_QUESTIONS = [
  { id: 'cardiac',       text: 'Votre médecin vous a-t-il déjà dit que vous aviez un problème cardiaque ?' },
  { id: 'chestPain',    text: 'Ressentez-vous des douleurs thoraciques lors d\'une activité physique ?' },
  { id: 'dizziness',    text: 'Avez-vous des étourdissements ou pertes de connaissance lors de l\'effort ?' },
  { id: 'medication',   text: 'Prenez-vous des médicaments pour la tension artérielle ou le cœur ?' },
  { id: 'jointIssue',   text: 'Avez-vous un problème osseux ou articulaire aggravé par l\'exercice ?' },
  { id: 'pregnant',     text: 'Êtes-vous enceinte ou avez-vous accouché il y a moins de 6 semaines ?' },
  { id: 'otherReason',  text: 'Avez-vous une autre raison médicale de ne pas faire d\'activité physique ?' }
 ];

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
   style: 'flex:1;padding:10px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;border:1px solid ' + (isYes ? '#5A1010' : 'var(--border,#E8E6DF)') + ';background:' + (isYes ? 'rgba(90,16,16,0.12)' : 'transparent') + ';color:' + (isYes ? '#5A1010' : 'var(--black,#1A1A18)') + ';font-weight:' + (isYes ? '700' : '400'),
   onclick: (function(_qid) { return function() { S._parqAnswers[_qid] = true; window.render(); }; })(q.id)
  }, 'Oui');
  btnRow.appendChild(yesBtn);
  // NON
  var noBtn = h('button', {
   style: 'flex:1;padding:10px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;border:1px solid ' + (!isYes && answered ? '#1A4A1A' : 'var(--border,#E8E6DF)') + ';background:' + (!isYes && answered ? 'rgba(26,74,26,0.08)' : 'transparent') + ';color:' + (!isYes && answered ? '#1A4A1A' : 'var(--black,#1A1A18)') + ';font-weight:' + (!isYes && answered ? '700' : '400'),
   onclick: (function(_qid) { return function() { S._parqAnswers[_qid] = false; window.render(); }; })(q.id)
  }, 'Non');
  btnRow.appendChild(noBtn);
  qRow.appendChild(btnRow);
  qList.appendChild(qRow);
 });
 p.appendChild(qList);

 if (!_allAnswered) {
  // Pas encore toutes les réponses : bouton grisé
  var continueBtn = h('button', {'class': 'btn-primary', style: 'opacity:0.5;cursor:not-allowed'}, 'Répondre à toutes les questions');
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
   S.sStep = nextStep;
   if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
   window.render();
  }}, 'Continuer →');
  p.appendChild(okBtn);
  p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey);text-align:center;margin-top:12px'}, 'Toutes vos réponses sont "Non" — vous pouvez démarrer en toute sécurité.'));
 } else {
  // Au moins une réponse OUI → avertissement médical
  var warnDiv = h('div', {style: 'border-left:4px solid #5A1010;background:rgba(90,16,16,0.06);padding:14px 16px;margin-bottom:20px;border-radius:0 2px 2px 0'});
  warnDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:700;color:#5A1010;margin-bottom:8px;letter-spacing:0.5px'}, '\u26A0 Consultez votre médecin avant de démarrer ce programme.'));
  warnDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5A1010;line-height:1.6'}, 'Montrez-lui ce questionnaire et obtenez son accord écrit. Une ou plusieurs de vos réponses indiquent qu\'une évaluation médicale préalable est recommandée (ACSM 2018).'));
  p.appendChild(warnDiv);

  var docBtn = h('button', {'class': 'btn-primary', onclick: function() {
   S.parqDone = true;
   S.parqResult = 'medical_cleared';
   S._parqAnswers = {};
   var nextStep = S._parqNextStep || 0;
   S.sStep = nextStep;
   if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
   window.render();
  }}, 'J\'ai consulté mon médecin et j\'ai son accord');
  p.appendChild(docBtn);

  var overrideBtn = h('button', {
   style: 'display:block;width:100%;margin-top:10px;padding:12px;border:1px solid var(--border,#E8E6DF);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);cursor:pointer;border-radius:2px;text-align:center',
   onclick: function() {
    S.parqDone = true;
    S.parqResult = 'user_override';
    S._parqAnswers = {};
    var nextStep = S._parqNextStep || 0;
    S.sStep = nextStep;
    if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
    window.render();
   }
  }, 'Je comprends les risques et je continue');
  p.appendChild(overrideBtn);
 }
}

// ─── STEP 20: QUESTIONNAIRE MÉDICAL MUSCU ───
function renderMuscuMedicalQ(p) {
 if (!S.muscuMedical || typeof S.muscuMedical !== 'object' || Array.isArray(S.muscuMedical)) S.muscuMedical = {};
 var med = S.muscuMedical;

 // Header with back button
 var hdr = h('div', {style: 'display:flex;align-items:center;gap:12px;margin-bottom:20px'});
 hdr.appendChild(h('button', {'class': 'btn-back', style: 'margin:0', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 hdr.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--grey)'}, 'Évaluation médicale'));
 p.appendChild(hdr);

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
 p.appendChild(h('h1', {html: 'Bilan<br><em>médical muscu</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Avant de g\u00e9n\u00e9rer votre programme, aidez-nous \u00e0 adapter les exercices \u00e0 votre situation physique.'));

 // Phrase de contexte si bilan nutrition déjà fait — évite le sentiment de répétition
 if (Array.isArray(window.S && window.S.medical)) {
   var _contextNote = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);background:var(--ivory2,#F5F3EC);border-left:2px solid var(--border);padding:10px 12px;margin-bottom:16px;line-height:1.6;'});
   _contextNote.textContent = 'Ces questions compl\u00e8tent votre profil nutrition. Elles portent sp\u00e9cifiquement sur vos articulations et ant\u00e9c\u00e9dents orthop\u00e9diques — diff\u00e9rentes de vos conditions m\u00e9dicales g\u00e9n\u00e9rales.';
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
  _summaryCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px;'}, 'Profil médical enregistré'));
  var _summaryText = _anyPain || _anyDiag
    ? 'Des zones sensibles ont été notées — le programme les prend en compte.'
    : 'Aucune contrainte physique signalée. Programme standard.';
  _summaryCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black);margin-bottom:12px;line-height:1.5;'}, _summaryText));
  var _editBtn = h('button', {
    style: 'padding:8px 14px;border:1px solid var(--border);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--grey);',
    onclick: function() { S._muscuMedicalEdit = true; window.render(); }
  }, 'Modifier');
  _summaryCard.appendChild(_editBtn);
  p.appendChild(_summaryCard);

  // Continuer directement
  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
    if (S._medicalReturnToDashboard) { S._medicalReturnToDashboard = false; S.sStep = 4; }
    else { S.sStep = !S.sportLevel ? 1 : 16; }
    if (window.saveProfile) window.saveProfile();
    window.render();
  }}, 'Continuer'));
  return;
 }

 // For beginners: show a simple YES/NO filter first
 if ((S.sportLevel === 'beginner' || !S.sportLevel) && !S._muscuMedicalExpanded) {
  var filterCard = h('div', {style: 'margin-bottom:20px'});
  filterCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black,#1A1A18);margin-bottom:16px;line-height:1.5'}, 'Avez-vous une douleur chronique, une blessure récente ou un diagnostic médical ?'));
  var filterBtns = h('div', {style: 'display:flex;gap:12px'});
  filterBtns.appendChild(h('button', {
   style: 'flex:1;padding:14px;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#1A1A18);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer',
   onclick: function() { S._muscuMedicalExpanded = true; window.render(); }
  }, 'Oui, j\'ai quelque chose à signaler'));
  filterBtns.appendChild(h('button', {
   style: 'flex:1;padding:14px;background:transparent;color:var(--black,#1A1A18);border:1px solid var(--border,#E8E6DF);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer',
   onclick: function() { S.muscuMedical = { done: true }; S.sStep = !S.sportLevel ? 1 : 16; if (window.saveProfile) window.saveProfile(); window.render(); }
  }, 'Non, je suis en bonne santé'));
  filterCard.appendChild(filterBtns);
  p.appendChild(filterCard);
  return; // Don't show the full medical form
 }
 // S._muscuMedicalExpanded = true → show full form (existing code runs normally)

 // ─── Section 1 : Zones douloureuses ───
 p.appendChild(h('div', {'class': 'section-label'}, 'Avez-vous des douleurs ou fragilités ?'));

 var zonesData = [
 {key: 'shoulders', label: 'Épaules', icon: ''},
 {key: 'elbows', label: 'Coudes', icon: ''},
 {key: 'wrists', label: 'Poignets', icon: ''},
 {key: 'neck', label: 'Nuque/Cervicales', icon: ''},
 {key: 'upperBack', label: 'Haut du dos', icon: ''},
 {key: 'lowerBack', label: 'Bas du dos', icon: '⬇'},
 {key: 'hips', label: 'Hanches', icon: ''},
 {key: 'knees', label: 'Genoux', icon: ''},
 {key: 'ankles', label: 'Chevilles', icon: ''},
 {key: 'feet', label: 'Pieds (fasciite)', icon: ''}
 ];

 var zonesGrid = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px'});
 zonesData.forEach(function(z) {
 var active = med[z.key];
 var chip = h('div', {
 style: 'padding:8px 14px;border-radius:2px;border:1.5px solid ' + (active ? '#5A1010' : 'var(--border)') + ';background:' + (active ? 'var(--redbg,rgba(90,16,16,.06))' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:' + (active ? '#5A1010' : 'var(--text)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
 onclick: (function(key){ return function(){ S.muscuMedical[key] = !S.muscuMedical[key]; window.render(); }; })(z.key)
 }, z.icon + ' ' + z.label);
 zonesGrid.appendChild(chip);
 });
 p.appendChild(zonesGrid);

 // ─── Section 2 : Antécédents diagnostiqués ───
 p.appendChild(h('div', {'class': 'section-label'}, 'Avez-vous un diagnostic confirmé ?'));

 var antecedentsData = [
 {key: 'herniaDisc', label: 'Hernie discale (IRM)'},
 {key: 'herniaInguinal', label: 'Hernie inguinale'},
 {key: 'rotatorCuff', label: 'Déchirure coiffe des rotateurs'},
 {key: 'acl', label: 'LCA opéré/fragilisé'},
 {key: 'osteoporosis', label: 'Ostéoporose'},
 {key: 'hypertension', label: 'HTA sévère (≥180/110)'},
 {key: 'rheumatoidArthritis', label: 'Polyarthrite rhumatoïde (PR)'},
 {key: 'fibromyalgia', label: 'Fibromyalgie'},
 {key: 'meniscus', label: 'Ménisque lésé/opéré'},
 {key: 'spondylarthritis', label: 'Spondylarthrite ankylosante'},
 {key: 'kneeOsteoarthritis', label: 'Gonarthrose (arthrose du genou)'},
 {key: 'epicondylitis', label: 'Épicondylite latérale (tennis elbow)'}
 ];

 var antGrid = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px'});
 antecedentsData.forEach(function(a) {
 var active = med[a.key];
 var chip = h('div', {
 style: 'padding:8px 14px;border-radius:2px;border:1.5px solid ' + (active ? '#5A1010' : 'var(--border)') + ';background:' + (active ? 'var(--redbg,rgba(90,16,16,.06))' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:' + (active ? '#5A1010' : 'var(--text)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
 onclick: (function(key){ return function(){ S.muscuMedical[key] = !S.muscuMedical[key]; window.render(); }; })(a.key)
 }, a.label);
 antGrid.appendChild(chip);
 });
 p.appendChild(antGrid);

 // ─── Section 3 : Niveau de douleur général (si au moins une zone cochée) ───
 var hasAnyZone = zonesData.some(function(z){ return med[z.key]; });
 if (hasAnyZone) {
 p.appendChild(h('div', {'class': 'section-label'}, 'Quelle est l\'intensité générale ?'));
 var painLevels = [
 {val: 0, label: 'Aucune'},
 {val: 1, label: 'Légère'},
 {val: 2, label: 'Modérée'},
 {val: 3, label: 'Sévère'}
 ];
 var painRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px'});
 painLevels.forEach(function(pl) {
 var active = med.painLevel === pl.val;
 var btn = h('div', {
 style: 'padding:8px 16px;border-radius:2px;border:1.5px solid ' + (active ? '#5A1010' : 'var(--border)') + ';background:' + (active ? 'var(--redbg,rgba(90,16,16,.06))' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:' + (active ? '#5A1010' : 'var(--text)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
 onclick: (function(v){ return function(){ S.muscuMedical.painLevel = v; window.render(); }; })(pl.val)
 }, pl.label);
 painRow.appendChild(btn);
 });
 p.appendChild(painRow);
 }

 // ─── Section 4 : Notes libres ───
 p.appendChild(h('div', {'class': 'section-label'}, 'Notes (optionnel)'));
 var textarea = h('textarea', {
 placeholder: 'Précisez si besoin (ex: opération genou 2022, hernie L4-L5...)',
 style: 'width:100%;min-height:72px;padding:10px;border:1px solid var(--border);background:var(--ivory);font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;resize:vertical;box-sizing:border-box;margin-bottom:16px',
 oninput: function(e){ S.muscuMedical.notes = e.target.value; }
 });
 if (med.notes) textarea.value = med.notes;
 p.appendChild(textarea);

 // ─── Avertissement si sévère ou antécédent grave ───
 var hasSevere = med.painLevel === 3 || med.herniaDisc || med.rotatorCuff || med.acl || med.fibromyalgia || med.meniscus || med.osteoporosis || med.hypertension || med.spondylarthritis || med.rheumatoidArthritis;
 if (hasSevere) {
 var warn = h('div', {style: 'background:var(--redbg,rgba(90,16,16,.06));border:1px solid var(--red,#5A1010);padding:12px 14px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--red,#5A1010);line-height:1.6'});
 warn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px'}, 'Attention — Antécédent grave détecté'));
 warn.appendChild(h('span', {}, 'Programme adapté en mode réhabilitation. Consultez un médecin ou kinésithérapeute avant de reprendre la musculation lourde.'));
 p.appendChild(warn);
 }

 // ─── Bouton Continuer ───
 p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
 S.muscuMedical.done = true;
 delete S._muscuMedicalEdit;
 if (S._medicalReturnToDashboard) { S._medicalReturnToDashboard = false; S.sStep = 4; }
 else { S.sStep = !S.sportLevel ? 1 : 16; }
 window.render();
 }}, 'Continuer \u2192'));

 // ─── Bouton Passer ───
 var skipLink = h('button', {
 style: 'width:100%;padding:14px;margin-top:12px;background:transparent;color:var(--black,#1A1A18);border:1px solid var(--border,#E8E6DF);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;min-height:48px',
 onclick: function(){
 S.muscuMedical.done = true;
 delete S._muscuMedicalEdit;
 if (S._medicalReturnToDashboard) { S._medicalReturnToDashboard = false; S.sStep = 4; }
 else { S.sStep = !S.sportLevel ? 1 : 16; }
 window.render();
 }
 }, 'Passer (aucune douleur)');
 p.appendChild(skipLink);
}

// ─── STEP 16: QUESTIONNAIRE CHARGES ───
function renderChargesQuestionnaire(p) {
 // For beginners who have never trained: replace with reassurance card
 if (S.sportLevel === 'beginner' || !S.sportLevel) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
  p.appendChild(h('h1', {html: 'Prêt\u00b7e à<br><em>commencer ?</em>'}));
  var reassureCard = h('div', {style: 'background:rgba(26,74,26,0.04);border-left:3px solid #1A4A1A;padding:16px;margin-bottom:24px;border-radius:0 2px 2px 0'});
  reassureCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;font-style:italic;margin-bottom:8px;color:var(--black,#1A1A18)'}, 'Vous débutez ? C\'est parfait.'));
  reassureCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:8px'}, 'Pas besoin de connaître vos charges. Nous utilisons votre poids de corps comme référence de départ et adaptons progressivement.'));
  reassureCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey)'}, 'Vous pourrez entrer vos charges après vos 2 premières séances.'));
  p.appendChild(reassureCard);
  var contBtn = h('button', {
   style: 'width:100%;padding:16px;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer',
   onclick: function() { var _nxt = S._chargesFromLevel ? 3 : (S._chargesReturnToDashboard ? 4 : 1); S._chargesFromLevel = false; S._chargesReturnToDashboard = false; S.sStep = _nxt; if (window.saveProfile) window.saveProfile(); window.render(); }
  }, 'Continuer →');
  p.appendChild(contBtn);
  var backLink = h('div', {style: 'text-align:center;margin-top:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);cursor:pointer;text-decoration:underline', onclick: function(){ var _bk = S._chargesFromLevel ? 2 : 15; S._chargesFromLevel = false; S.sStep = _bk; window.render(); }}, '← Retour');
  p.appendChild(backLink);
  return;
 }

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
 p.appendChild(h('h1', {html: '\u00c9valuation<br><em>des charges</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Optionnel mais précieux. Indiquez la charge avec laquelle vous faites 8-10 reps propres. Laissez vide si vous ne pratiquez pas l\'exercice.'));
 var _chargesInfoCard = h('div', {style: 'background:rgba(26,74,26,0.04);border-left:3px solid #1A4A1A;padding:12px 16px;margin-bottom:16px;border-radius:0 2px 2px 0'});
 _chargesInfoCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#1A1A18);line-height:1.6;margin-bottom:4px'}, 'Ces données permettent à l\'IA de calculer des charges au kilo près pour chaque exercice.'));
 _chargesInfoCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey)'}, 'Si vous ne connaissez pas vos charges : laissez tout vide. L\'IA utilisera votre poids de corps comme référence.'));
 p.appendChild(_chargesInfoCard);

 // Medical/age safety warnings
 var hasDiabetes = S.medical && (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1);
 if (hasDiabetes) {
 p.appendChild(h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border:1px solid var(--orange,#6A4A1A);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;line-height:1.6'}, [
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange,#6A4A1A);margin-bottom:6px'}, 'Diabète — Précautions sportives'),
 h('div', {style: 'color:var(--grey,#6B6B65)'}, 'Mesurez votre glycémie avant/après chaque séance. Évitez l\'entraînement si glycémie < 4,0 mmol/L ou > 14,0 mmol/L. Gardez toujours une source de sucres rapides à portée de main. Intensité progressive recommandée (RPE max 7/10 les 4 premières semaines).')
 ]));
 }
 if (getAge() >= 50) {
 p.appendChild(h('div', {style: 'background:var(--greenbg,rgba(26,74,26,.06));border:1px solid var(--green,#1A4A1A);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;line-height:1.6'}, [
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-bottom:6px'}, 'Athlète 50+ — Adaptations recommandées'),
 h('div', {style: 'color:var(--grey,#6B6B65)'}, 'Échauffement prolongé 15-20 min (vs 5-10 min standard). Décharge toutes les 4-5 semaines (vs 6 semaines). Préférez machines guidées aux barres libres pour les charges maximales. Récupération inter-séance 48-72h minimum. Contrôle médical annuel conseillé.')
 ]));
 }
 if (S.pregnant) {
 p.appendChild(h('div', {style: 'background:var(--redbg,rgba(90,16,16,.06));border:1px solid var(--red,#5A1010);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;line-height:1.6'}, [
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--red,#5A1010);margin-bottom:6px'}, 'Grossesse — Exercices autorisés seulement'),
 h('div', {style: 'color:var(--grey,#6B6B65)'}, 'Évitez les charges lourdes, exercices allongés sur le dos (après 20 SA), abdominaux hyperpressifs, sauts et HIIT intense. Privilégiez marche, natation, yoga prénatal, Kegel. Consultez votre médecin avant tout entraînement.')
 ]));
 }

 if (Object.keys(S.muscuStrengthProfile || {}).length === 0) {
 var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var saved = localStorage.getItem('mtd_muscu_strength_' + userId);
 if (saved) { try { S.muscuStrengthProfile = JSON.parse(saved); } catch(e) {} }
 }
 if (!S.muscuStrengthProfile || typeof S.muscuStrengthProfile !== 'object' || Array.isArray(S.muscuStrengthProfile)) S.muscuStrengthProfile = {};

 var bodyWeight = S.weight || 75;
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
 style: 'width:60px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory)',
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
 style: 'width:38px;padding:6px 4px;border:1px solid var(--border);font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory);margin-left:4px',
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
 var col = ratio < thresh.low ? '#6A4A1A' : ratio < thresh.mid ? '#2980B9' : '#1A4A1A';
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
 var _chargesFooter = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:16px'});
 _chargesFooter.appendChild(h('span', {}, 'Laissez vide les exercices que vous ne pratiquez pas. Indiquez la charge ET le nombre de reps pour un calcul précis du '));
 _chargesFooter.appendChild(termTooltip('1RM', 'Répétition Maximale — la charge max que vous pouvez soulever une seule fois'));
 _chargesFooter.appendChild(h('span', {}, ' (formule d\'Epley : charge × (1 + N/30)).'));
 p.appendChild(_chargesFooter);

 p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){ var _nxt = S._chargesFromLevel ? 3 : (S._chargesReturnToDashboard ? 4 : 15); S._chargesFromLevel = false; S._chargesReturnToDashboard = false; S.sStep = _nxt; if (window.saveProfile) window.saveProfile(); window.render(); }}, 'Continuer'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ var _bk = S._chargesFromLevel ? 2 : 15; S._chargesFromLevel = false; S.sStep = _bk; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

/// ─── HELPER: CTA "Voir mon plan nutrition" (mode both uniquement) ───
function appendNutritionModeCTA(p) {
 if (!p || S.appMode !== 'both') return;
 if (!S.weekPlan || !S.weekPlan.length) return;
 var card = h('div', {style: 'border:1px solid #1A4A1A;background:rgba(26,74,26,0.04);padding:20px 16px;margin-top:20px;border-radius:2px'});
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#1A4A1A;margin-bottom:8px'}, 'PROGRAMME COMPLET'));
 card.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;font-style:italic;margin-bottom:8px;color:var(--black,#1A1A18)'}, 'Votre programme sportif est prêt.'));
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:16px'}, 'Vos macros sont automatiquement adaptées à chaque séance d\'entraînement.'));
 card.appendChild(h('button', {
   style: 'width:100%;padding:16px;background:#1A4A1A;color:#FAF9F6;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer',
   onclick: function() {
     window.S.view = 'nutrition';
     if (window.saveProfile) window.saveProfile();
     if (window.render) window.render();
   }
 }, 'Voir mon plan nutrition →'));
 p.appendChild(card);
}

// ─── STEP 15: PROGRAMMES DÉDIÉS ───
function renderDedicatedPrograms(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
 p.appendChild(h('h1', {html: 'Programmes<br><em>dédiés</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'S\u00e9ances cibl\u00e9es, vari\u00e9es (A/B), pr\u00eates \u00e0 l\u2019emploi.'));

 // ─── SUIVI 7 SEMAINES ───
 renderWeekTracker(p);

 // ─── BANNIÈRE : GÉNÉRER MON PROGRAMME DE MUSCULATION ───
 p.appendChild(h('div', {'class': 'section-label'}, 'Programme de musculation'));
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, 'Créez votre programme sur mesure selon vos objectifs, niveau et zones cibles.'));
 p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
 // CRITIQUE-1 : pré-sélection ici (une seule fois, hors render)
 if (S.goal !== null && (!S.sportGoals || S.sportGoals.length === 0)) {
 var nutKey = window.GOALS && window.GOALS[S.goal] ? window.GOALS[S.goal].key : null;
 var preselect = nutKey ? NUTRITION_TO_SPORT_GOAL[nutKey] : null;
 if (preselect) S.sportGoals = [preselect];
 }
 S.sStep = 1;
 window.render();
 }}, 'G\u00e9n\u00e9rer mon programme'));
 p.appendChild(h('div', {style: 'height:20px'}));

 // ─── PROGRAMMES DÉDIÉS ───
 p.appendChild(h('div', {'class': 'section-label'}, 'Programmes ciblés'));
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, 'S\u00e9ances bonus cibl\u00e9es, vari\u00e9es (A/B), pr\u00eates \u00e0 l\u2019emploi.'));

 var allDedicated = [
 {key: 'fessiers_dedied', icon: '\uD83C\uDF51'},
 {key: 'abdos_dedied', icon: '\u26A1'},
 {key: 'biceps_dedied', icon: '\uD83D\uDCAA'},
 {key: 'triceps_dedied', icon: '\uD83D\uDD31'}
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
 var currentPhase = getMuscuPhase(S.muscuWeek || 1);
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
 var sugW = getSuggestedWeight(ex.name, ex.reps, currentPhase);
 if (sugW && sugW > 0) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;margin-top:2px'}, '\u2192 Charge cible : ~' + (window.UNITS ? window.UNITS.displayWeight(sugW) : sugW + ' kg')));
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
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 4; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));

 appendNutritionModeCTA(p);
}

// ─── STEP 1: MUSCULATION OBJECTIVES ───
// Mapping nutrition goal key → sport goal id
var NUTRITION_TO_SPORT_GOAL = { bulk: 'muscle', lean_bulk: 'muscle', maintain: 'general', cut: 'weightloss', shred: 'shred', recomposition: 'general' };
window.NUTRITION_TO_SPORT_GOAL = NUTRITION_TO_SPORT_GOAL;
// Mapping sport goal id → nutrition goal index (priority order when multi-select)
// GOALS: [0=bulk, 1=lean_bulk, 2=maintain, 3=cut, 4=shred, 5=recomposition]
var SPORT_TO_NUTRITION_GOAL = { muscle: 0, weightloss: 3, shred: 4, endurance: 2, flexibility: 2, general: 2 };

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
 if (S.pregnant && S.sex === 'femme') return; // ÉLEVÉ-4: grossesse → ne pas écraser le maintien forcé
 // GOALS: [0=bulk, 1=lean_bulk, 2=maintain, 3=cut, 4=shred, 5=recomposition]
 var _sgls = S.sportGoals || [];
 if (_sgls.length === 0) { S.goal = 2; return; } // désélection totale → reset maintien
 // Priority: shred > muscle > weightloss > others (→ maintain)
 // For 'muscle': preserve lean_bulk (index 1) if already set — both are mass-building goals.
 var newIdx = 2; // maintain par défaut
 if (_sgls.indexOf('shred') !== -1) newIdx = 4; // shred
 else if (_sgls.indexOf('muscle') !== -1) {
 var currentKey = window.GOALS && window.GOALS[S.goal] ? window.GOALS[S.goal].key : null;
 newIdx = (currentKey === 'lean_bulk') ? 1 : 0; // preserve lean_bulk, otherwise default to bulk
 }
 else if (_sgls.indexOf('weightloss') !== -1) newIdx = 3; // cut
 S.goal = newIdx;
}

function renderMusculationGoals(p) {
 var _prenom1 = S.prenom || '';
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation \u00b7 \u00c9tape 1/3'));
 p.appendChild(h('h1', {html: (_prenom1 ? _prenom1 + ', quel est<br>' : 'Quel est<br>') + '<em>votre objectif\u00a0?</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Choisissez vos objectifs (1 \u00e0 3). Votre programme s\u2019adaptera en cons\u00e9quence.'));
 if (window.TIPS) TIPS.renderTip(p, 'sportGoal');

 // ── INTERDÉPENDANCE NUTRITION ──────────────────────────────────────────
 if (S.goal !== null) {
 // Reminder banner (pre-sélection déplacée dans le handler du bouton "Créer programme")
 var nutName = (window.GOALS || [])[S.goal] ? window.GOALS[S.goal].name : '';
 var banner = h('div', {style: 'border:1px solid var(--border,#D8D8D0);padding:12px 16px;background:var(--ivory2,#F4F4F0);margin-bottom:16px;border-radius:2px'});
 banner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, 'Objectif Nutrition\u00a0: ' + nutName));
 banner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, 'Toute modification sera synchronis\u00e9e avec votre plan nutrition.'));
 p.appendChild(banner);
 }
 // ──────────────────────────────────────────────────────────────────────

 // Pré-sélection depuis l'objectif nutrition si sportGoals est vide
 if ((!S.sportGoals || S.sportGoals.length === 0) && S.goal !== null && S.goal !== undefined) {
   var _nutToSport = {0: 'muscle', 1: 'muscle', 2: 'general', 3: 'weightloss', 4: 'shred'};
   var _preId = _nutToSport[S.goal];
   if (_preId) { if (!Array.isArray(S.sportGoals)) S.sportGoals = []; S.sportGoals = [_preId]; }
 }
 if (!Array.isArray(S.sportGoals)) S.sportGoals = [];
 p.appendChild(h('div', {'class': 'section-label'}, 'Objectifs'));
 var g = h('div', {'class': 'card-grid-2'});
 (window.SPORT_GOALS || []).forEach(function(gl) {
 var on = S.sportGoals.indexOf(gl.id) !== -1;
 g.appendChild(h('div', {'class': 'sel-card' + (on ? ' on' : ''), onclick: function(){
 if (on) S.sportGoals = S.sportGoals.filter(function(x){ return x !== gl.id; });
 else if (S.sportGoals.length < 3) S.sportGoals.push(gl.id);
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
 }}, 'Continuer'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 15; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 5 (CrossFit): NIVEAU CF ───
function renderCrossfitLevel(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Cross Training'));
 p.appendChild(h('h1', {html: 'Votre<br><em>niveau</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Sélectionnez votre niveau pour adapter les charges et mouvements.'));

 if (S.sex) {
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:16px'}, 'Charges adaptées pour : ' + (S.sex === 'homme' ? 'Homme' : 'Femme')));
 }

 p.appendChild(h('div', {'class': 'section-label'}, 'Niveau (obligatoire)'));
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
 explainBox.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, 'Que signifie chaque niveau ?'));

 var explanations = [
 {icon: '\uD83D\uDFE2', title: 'SCALED', desc: 'Mouvements adaptés (ring rows, pike push-ups, single unders), charges légères. Idéal pour débuter le CrossFit.'},
 {icon: '\uD83D\uDFE1', title: 'INTERMÉDIAIRE', desc: 'Mouvements complets avec charge modérée, certaines adaptations gymniques. Vous maîtrisez les bases.'},
 {icon: '\uD83D\uDD34', title: 'RX', desc: 'Standards compétition, charges et mouvements au standard international. Niveau CrossFit Games.'}
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
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 3 && v <= 6) { S.sportDays = v; window.render(); } },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 3) { e.target.value = S.sportDays = 3; window.render(); } else if (v > 6) { e.target.value = S.sportDays = 6; window.render(); } }
 }));
 cfDaysWrap.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(cfDaysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, '3 jours minimum recommand\u00E9 pour le CrossFit'));

 // ─── SÉLECTEUR DE JOURS SPÉCIFIQUES ───
 if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:18px'}, 'Quels jours vous entraînez-vous\u00a0?'));
 var dayLabels = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
 var dayBtnsWrap = h('div', {style: 'display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;margin:10px 0'});
 var _selTarget = S.sportDays || 3;
 dayLabels.forEach(function(label, idx) {
   var selected = S.trainingDaysSelected.indexOf(idx) !== -1;
   var overTarget = selected && S.trainingDaysSelected.length > _selTarget;
   var btnStyle = 'width:44px;height:44px;border-radius:3px;font-family:Georgia,serif;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;letter-spacing:0;transition:background .15s,color .15s,border-color .15s;';
   if (overTarget) btnStyle += 'background:#5A1010;color:#FAF9F6;border:1.5px solid #5A1010;';
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
       try { window.saveProfile(); } catch(e) {}
       window.render();
     }
   }, label);
   dayBtnsWrap.appendChild(btn);
 });
 p.appendChild(dayBtnsWrap);
 var selCount = S.trainingDaysSelected.length;
 var diff = selCount - _selTarget;
 var hintColor = diff === 0 ? '#6B6B65' : (diff > 0 ? '#5A1010' : '#6A4A1A');
 var hintText = selCount === 0
   ? 'Aucun jour sélectionné — répartition automatique'
   : diff === 0 ? selCount + ' / ' + _selTarget + ' jour' + (selCount > 1 ? 's' : '') + ' — parfait'
   : diff > 0 ? selCount + ' / ' + _selTarget + ' — retirez ' + diff + ' jour' + (diff > 1 ? 's' : '')
   : selCount + ' / ' + _selTarget + ' — sélectionnez encore ' + Math.abs(diff) + ' jour' + (Math.abs(diff) > 1 ? 's' : '');
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + hintColor + ';text-align:center;margin-bottom:4px;letter-spacing:.5px;transition:color .2s'}, hintText));

 // Recommendation based on level
 if (S.crossfitLevel) {
 var cfDayReco = '';
 if (S.crossfitLevel === 'scaled') cfDayReco = 'Recommand\u00E9 : 3-4 jours (r\u00E9cup\u00E9ration importante)';
 else if (S.crossfitLevel === 'inter') cfDayReco = 'Recommand\u00E9 : 4-5 jours';
 else if (S.crossfitLevel === 'rx') cfDayReco = 'Recommand\u00E9 : 5-6 jours';
 else if (S.crossfitLevel === 'rx_plus') cfDayReco = 'Recommand\u00E9 : 6 jours (programme \u00E9lite Games — r\u00E9cup\u00E9ration active obligatoire)';
 if (cfDayReco) {
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-top:6px;font-style:italic'}, cfDayReco));
 }
 }

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
 p.appendChild(h('div', {'class': 'section-label'}, 'Vos charges actuelles (optionnel)'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:16px'}, 'Renseignez vos 1RM pour une programmation sur mesure. Laissez vide si inconnu.'));

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
 window._cf1rmTimer = setTimeout(function(){ window.render(); }, 600);
 }
 });
 rightDiv.appendChild(inp);
 rightDiv.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'kg'));
 row.appendChild(rightDiv);

 rmGrid.appendChild(row);
 });
 p.appendChild(rmGrid);
 }

 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;text-align:center;margin-bottom:16px'}, 'Si vous ne connaissez pas vos 1RM, les charges seront bas\u00E9es sur les standards internationaux pour votre niveau.'));

 // ─── BENCHMARKS ACTUELS ───
 p.appendChild(h('div', {style: 'height:16px'}));
 p.appendChild(h('div', {style: 'border-top:1px solid var(--border);margin:0 0 16px;padding-top:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, 'Vos benchmarks CrossFit (optionnel)'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:14px'}, 'Ces donn\u00E9es permettent de suivre votre progression sur les WODs officiels du CrossFit.'));

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
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:16px'}, 'Objectif comp\u00E9tition'));
 var compGoals = [
 {id: 'loisir', label: 'Loisir — Forme physique et fun', desc: 'Pas de competition prevue'},
 {id: 'open', label: 'CrossFit Open', desc: 'Qualifier pour les phases suivantes'},
 {id: 'sanctional', label: 'Regionals / Sanctionals', desc: 'Niveau elite — competition serieuse'}
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
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:8px'}, 'Date du CrossFit Open (optionnel)'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px;text-align:center'}, 'Le programme adaptera les semaines 18-20 en pr\u00E9paration Open.'));
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
 }}, 'Continuer'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── CROSSFIT HELPERS ───
function getCFLevelIdx() {
 if (S.crossfitLevel === 'scaled') return 0;
 if (S.crossfitLevel === 'inter') return 1;
 if (S.crossfitLevel === 'rx_plus') return 3;
 return 2; // 'rx' or unknown defaults to rx (index 2)
}

function getCFSexKey() {
 return S.sex === 'homme' ? 'm' : 'f';
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
var CF_DAY_TEMPLATES = {
 3: [
 {label: 'Lundi', focus: 'Halt\u00E9ro A + WOD + Gym', hasHaltero: true, halteroLift: 0},
 {label: 'Mercredi', focus: 'Halt\u00E9ro B + WOD + Gym', hasHaltero: true, halteroLift: 1},
 {label: 'Vendredi', focus: 'WOD Comp\u00E9tition + Gym', hasHaltero: false}
 ],
 4: [
 {label: 'Lundi', focus: 'Halt\u00E9ro A + WOD', hasHaltero: true, halteroLift: 0},
 {label: 'Mardi', focus: 'Gym + WOD Sprint', hasHaltero: false},
 {label: 'Jeudi', focus: 'Halt\u00E9ro B + WOD', hasHaltero: true, halteroLift: 1},
 {label: 'Samedi', focus: 'WOD Long + Gym', hasHaltero: false}
 ],
 5: [
 {label: 'Lundi', focus: 'Halt\u00E9ro A + WOD', hasHaltero: true, halteroLift: 0},
 {label: 'Mardi', focus: 'Gym + WOD Sprint', hasHaltero: false},
 {label: 'Mercredi', focus: 'Halt\u00E9ro B + WOD', hasHaltero: true, halteroLift: 1},
 {label: 'Vendredi', focus: 'Gym + WOD', hasHaltero: false},
 {label: 'Samedi', focus: 'WOD Comp\u00E9tition', hasHaltero: false}
 ],
 6: [
 {label: 'Lundi', focus: 'Halt\u00E9ro A + WOD', hasHaltero: true, halteroLift: 0},
 {label: 'Mardi', focus: 'Gym + Conditioning', hasHaltero: false},
 {label: 'Mercredi', focus: 'Halt\u00E9ro B + WOD', hasHaltero: true, halteroLift: 1},
 {label: 'Jeudi', focus: 'Gym + Accessoires', hasHaltero: false},
 {label: 'Vendredi', focus: 'Halt\u00E9ro (variation) + WOD', hasHaltero: true, halteroLift: 0},
 {label: 'Samedi', focus: 'WOD Comp\u00E9tition + Test', hasHaltero: false}
 ]
};

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

 p.appendChild(h('div', {'class': 'eyebrow'}, 'CrossFit'));
 p.appendChild(h('h1', {html: 'Programme<br><em>100 Jours</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Vue d\'ensemble — cliquez sur un jour pour y accéder'));

 // ─── Bouton retour ───
 var backBtn = h('button', {'class': 'btn-back', style: 'margin-bottom:16px', onclick: function() {
 S.cfCalendarOpen = false;
 window.render();
 }}, '← Retour au programme');
 p.appendChild(backBtn);

 // ─── Légende ───
 var legend = h('div', {style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;align-items:center'});
 var legendItems = [
 {color: '#1A4A1A', label: 'Complété'},
 {color: '#1A3C5E', label: 'Jour actuel'},
 {color: '#999', label: 'À venir'}
 ];
 legendItems.forEach(function(li) {
 var dot = h('div', {style: 'width:12px;height:12px;border-radius:50%;background:' + li.color + ';flex-shrink:0'});
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
 progressBar.appendChild(h('div', {style: 'background:#1A4A1A;height:100%;width:' + pct + '%;transition:width 0.4s ease'}));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, totalDone + ' / 100 jours complétés (' + pct + '%)'));
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
 var weekLabel = 'Semaine ' + weekNum;
 // Phases indicatives
 if (weekNum <= 4) weekLabel += ' — Base';
 else if (weekNum <= 7) weekLabel += ' — Développement';
 else if (weekNum <= 9) weekLabel += ' — Intensité';
 else if (weekNum === 10) weekLabel += ' — Finale';
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
 borderColor = '#1A4A1A';
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
 card.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + textColor + ';margin-bottom:3px'}, 'JOUR ' + dayNum));
 card.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:' + textColor + ';font-weight:normal;line-height:1.2;word-break:break-word'}, wod.name || ('WOD ' + dayNum)));

 // Indicateur état
 if (isDone) {
 card.appendChild(h('div', {style: 'font-size:11px;color:#1A4A1A;margin-top:4px'}, ' Terminé'));
 } else if (isCurrent) {
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:4px'}, 'Aujourd\'hui'));
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
 }}, '← Retour au programme');
 p.appendChild(backBtn2);
}

// ─── WELLNESS CHECKIN ───
// ─── BANDEAU BIEN-ÊTRE (variante non-bloquante) ───
// Affiche un bandeau dismissable en haut du contenu programme.
// L'utilisateur peut remplir rapidement ou ignorer avec des valeurs par défaut (moyenne).
function renderWellnessBanner(p) {
 var banner = h('div', {style: 'background:rgba(26,74,26,0.04);border:1px solid var(--accent,#1A4A1A);border-radius:2px;padding:14px 16px;margin-bottom:20px;position:relative'});

 var titleRow = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px'});
 titleRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--accent,#1A4A1A);font-weight:700'}, 'Bilan de forme'));

 var closeBtn = h('button', {style: 'background:none;border:none;cursor:pointer;font-size:18px;color:var(--grey,#6B6B65);line-height:1;padding:0;margin:0'}, '×');
 closeBtn.addEventListener('click', function() {
  var today = new Date().toISOString().slice(0, 10);
  S.todayWellness = { date: today, sleep: 3, muscles: 'courbatures', energy: 'moyen' };
  S._wellnessReminder = false;
  banner.style.display = 'none';
  if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
 });
 titleRow.appendChild(closeBtn);
 banner.appendChild(titleRow);

 banner.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin-bottom:12px'}, 'Comment vous sentez-vous aujourd\'hui ? (optionnel)'));

 var wellnessState = { sleep: 0, muscles: '', energy: '' };

 // Ligne sommeil
 var sleepRow = h('div', {style: 'margin-bottom:8px'});
 sleepRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, '\uD83D\uDE34 Sommeil'));
 var sleepBtnsRow = h('div', {style: 'display:flex;gap:4px'});
 var sleepBtnsArr = [];
 [1,2,3,4,5].forEach(function(val) {
  var label = ['Mauvais','Bof','Moyen','Bon','Top'][val-1];
  var btn = h('button', {style: 'flex:1;padding:6px 2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;cursor:pointer;text-transform:uppercase;letter-spacing:1px'}, label);
  btn.addEventListener('click', function() {
   wellnessState.sleep = val;
   sleepBtnsArr.forEach(function(b) { b.style.background = 'var(--ivory,#FAF9F6)'; b.style.borderColor = 'var(--border,#D8D8D0)'; b.style.color = 'inherit'; });
   btn.style.background = 'var(--accent,#1A4A1A)';
   btn.style.borderColor = 'var(--accent,#1A4A1A)';
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
 muscleRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, '\uD83D\uDCAA Muscles'));
 var muscleBtnsRow = h('div', {style: 'display:flex;gap:4px'});
 var muscleBtnsArr = [];
 [['frais','Frais'],['courbatures','Courbatures'],['douleurs','Douleurs']].forEach(function(opt) {
  var val = opt[0], label = opt[1];
  var btn = h('button', {style: 'flex:1;padding:6px 2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;cursor:pointer;text-transform:uppercase;letter-spacing:1px'}, label);
  btn.addEventListener('click', function() {
   wellnessState.muscles = val;
   muscleBtnsArr.forEach(function(b) { b.style.background = 'var(--ivory,#FAF9F6)'; b.style.borderColor = 'var(--border,#D8D8D0)'; b.style.color = 'inherit'; });
   btn.style.background = 'var(--accent,#1A4A1A)';
   btn.style.borderColor = 'var(--accent,#1A4A1A)';
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
 energyRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, '\u26A1 \u00c9nergie'));
 var energyBtnsRow = h('div', {style: 'display:flex;gap:4px'});
 var energyBtnsArr = [];
 [['bas','Basse'],['moyen','Moyenne'],['haut','Haute']].forEach(function(opt) {
  var val = opt[0], label = opt[1];
  var btn = h('button', {style: 'flex:1;padding:6px 2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;cursor:pointer;text-transform:uppercase;letter-spacing:1px'}, label);
  btn.addEventListener('click', function() {
   wellnessState.energy = val;
   energyBtnsArr.forEach(function(b) { b.style.background = 'var(--ivory,#FAF9F6)'; b.style.borderColor = 'var(--border,#D8D8D0)'; b.style.color = 'inherit'; });
   btn.style.background = 'var(--accent,#1A4A1A)';
   btn.style.borderColor = 'var(--accent,#1A4A1A)';
   btn.style.color = 'var(--ivory,#FAF9F6)';
   checkWellnessBannerComplete();
  });
  energyBtnsArr.push(btn);
  energyBtnsRow.appendChild(btn);
 });
 energyRow.appendChild(energyBtnsRow);
 banner.appendChild(energyRow);

 var confirmBtn = h('button', {style: 'width:100%;padding:14px;background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;opacity:0.4;pointer-events:none'}, 'Confirmer mon bilan');
 confirmBtn.addEventListener('click', function() {
  var today = new Date().toISOString().slice(0, 10);
  S.todayWellness = { date: today, sleep: wellnessState.sleep, muscles: wellnessState.muscles, energy: wellnessState.energy };
  S._wellnessReminder = false;
  banner.style.display = 'none';
  if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
  if (window.render) { try { window.render(); } catch(e) {} }
 });
 banner.appendChild(confirmBtn);

 function checkWellnessBannerComplete() {
  if (wellnessState.sleep && wellnessState.muscles && wellnessState.energy) {
   confirmBtn.style.opacity = '1';
   confirmBtn.style.pointerEvents = 'auto';
  }
 }

 p.insertBefore(banner, p.firstChild);
}

function renderWellnessCheckin(p, onComplete) {
 var state = { sleep: 0, muscles: '', energy: '' };

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Bilan de forme'));
 p.appendChild(h('h1', {html: 'Comment<br><em>vous sentez-vous ?</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Quelques questions pour adapter votre seance du jour.'));

  // Message d'encouragement checkin
  if (window.MOTIVATION) {
    var checkinMotiv = document.createElement('p');
    checkinMotiv.style.cssText = 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--grey,#6B6B65);margin:0 0 24px;line-height:1.6;border-left:2px solid var(--border,#D8D8D0);padding-left:14px;';
    checkinMotiv.textContent = 'Prendre une minute pour évaluer votre état, c\'est déjà un acte de performance.';
    p.appendChild(checkinMotiv);
  }

 // Question 1 — Sommeil
 var q1 = h('div', {style: 'margin-bottom:24px'});
 q1.appendChild(h('div', {style: 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:10px'}, 'Qualite du sommeil'));
 var sleepLabels = ['Tres mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];
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
 q2.appendChild(h('div', {style: 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:10px'}, 'Etat musculaire'));
 var muscleOpts = [['frais', 'Frais'], ['courbatures', 'Legeres courbatures'], ['douleurs', 'Douleurs reelles']];
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
 q3.appendChild(h('div', {style: 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:10px'}, 'Niveau d\'energie'));
 var energyOpts = [['bas', 'Basse'], ['moyen', 'Moyenne'], ['haut', 'Haute']];
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
  if (onComplete) onComplete();
 }}, 'Commencer la seance');
 p.appendChild(startBtn);

 function updateStartBtn() {
  if (state.sleep && state.muscles && state.energy) {
   startBtn.style.opacity = '1';
   startBtn.style.pointerEvents = 'auto';
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

 if (score <= -3) return { level: 'recovery', label: 'Seance recuperation recommandee', color: '#C0392B', advice: 'Votre etat de forme necessite une seance legere. Intensite reduite de 40%.' };
 if (score <= -1) return { level: 'reduced', label: 'Intensite reduite', color: '#E67E22', advice: 'Legere fatigue detectee. Intensite reduite de 20%. Ecoutez votre corps.' };
 if (score >= 2) return { level: 'peak', label: 'Forme optimale', color: '#27AE60', advice: 'Excellent etat de forme. Vous pouvez pousser sur les sets lourds.' };
 return { level: 'normal', label: 'Forme correcte', color: '#1A3A6A', advice: 'Bonne seance en perspective. Respectez les temps de repos.' };
}
window.getWellnessAdaptation = getWellnessAdaptation;

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
      titleRow.appendChild(h('span', {style: 'font-size:16px'}, '\u26A0\uFE0F'));
      titleRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8B2020;font-weight:700'}, 'S\u00e9ance d\u00e9conseill\u00e9e aujourd\'hui'));
      banner.appendChild(titleRow);
      banner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);line-height:1.6;margin-bottom:12px'}, 'Votre \u00e9tat de forme est bas. Le repos favorise la r\u00e9cup\u00e9ration et la progression.'));
      var btnRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap'});
      var postponeBtn = h('button', {
        style: 'padding:8px 14px;background:#8B2020;color:#fff;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer',
        onclick: function() {
          S.sessionPostponed = true;
          banner.innerHTML = '';
          var confirmMsg = h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);line-height:1.6;padding:8px 0'}, '\u2714 S\u00e9ance report\u00e9e. Reposez-vous bien !');
          banner.appendChild(confirmMsg);
          if (window.render) window.render();
        }
      }, 'Reporter au lendemain');
      var continueBtn = h('button', {
        style: 'padding:8px 14px;background:transparent;color:#8B2020;border:1px solid #8B2020;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer',
        onclick: function() {
          if (S.sessionPostponed) S.sessionPostponed = false;
          banner.style.display = 'none';
          if (window.render) window.render();
        }
      }, 'Continuer quand m\u00eame');
      btnRow.appendChild(postponeBtn);
      btnRow.appendChild(continueBtn);
      banner.appendChild(btnRow);
      p.appendChild(banner);
    } else if (score <= 3) {
      // ─── Fatigué : séance adaptée ───
      var banner2 = h('div', {style: 'border-left:3px solid #B8860B;background:rgba(184,134,11,0.06);padding:14px 16px;margin-bottom:16px;border-radius:2px', title: 'Score basé sur votre sommeil, état musculaire et énergie du jour. Renseignez votre bilan quotidien pour personnaliser votre séance.'});
      banner2.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8860B;font-weight:700;margin-bottom:6px'}, 'S\u00e9ance adapt\u00e9e recommand\u00e9e'));
      banner2.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);line-height:1.6;margin-bottom:12px'}, 'Consid\u00e9rez r\u00e9duire l\'intensit\u00e9\u00a0: -1 s\u00e9rie par exercice, charges all\u00e9g\u00e9es de 10-15\u00a0%.'));
      var comprisBtn = h('button', {
        style: 'padding:8px 14px;background:#B8860B;color:#fff;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer',
        onclick: function() { banner2.style.display = 'none'; }
      }, 'Compris');
      banner2.appendChild(comprisBtn);
      p.appendChild(banner2);
    } else if (score > 3.5) {
      // ─── En forme : badge discret ───
      var badge = h('div', {style: 'display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(26,74,26,0.3);background:rgba(26,74,26,0.04);padding:6px 12px;border-radius:2px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#1A4A1A)', title: 'Score basé sur votre sommeil, état musculaire et énergie du jour. Renseignez votre bilan quotidien pour personnaliser votre séance.'});
      badge.appendChild(h('span', {}, 'Vous \u00eates en forme aujourd\'hui \uD83D\uDCAA'));
      p.appendChild(badge);
    }
    return;
  }

  // ─── Fallback : score composite basé sur les valeurs textuelles (rétrocompatibilité) ───
  var adapt = getWellnessAdaptation();
  // Ne rien afficher si pas de données wellness
  if (!S.todayWellness) return;

  var colorMap = {
    'peak':     { borderColor: 'var(--green,#1A4A1A)',   textColor: 'var(--green,#1A4A1A)',   bg: 'var(--greenbg,rgba(26,74,26,.06))' },
    'normal':   { borderColor: 'var(--blue,#1A3A6A)',    textColor: 'var(--blue,#1A3A6A)',    bg: 'var(--bluebg,rgba(26,58,106,.06))' },
    'reduced':  { borderColor: 'var(--orange,#6A4A1A)',  textColor: 'var(--orange,#6A4A1A)',  bg: 'var(--orangebg,rgba(106,74,26,.06))' },
    'recovery': { borderColor: 'var(--red,#5A1010)',     textColor: 'var(--red,#5A1010)',     bg: 'var(--redbg,rgba(90,16,16,.06))' }
  };
  var cm = colorMap[adapt.level] || colorMap['normal'];

  var isPeak = adapt.level === 'peak';
  var fallbackBanner = h('div', {style:
    'border-left:3px solid ' + cm.borderColor + ';' +
    'padding:' + (isPeak ? '8px 12px' : '10px 14px') + ';' +
    'background:' + cm.bg + ';' +
    'margin-bottom:16px;border-radius:0 2px 2px 0;' +
    'display:flex;align-items:' + (isPeak ? 'center' : 'flex-start') + ';' +
    'gap:10px;overflow:hidden;max-height:' + (isPeak ? '52px' : '88px')
  });

  // SVG icons per level
  var svgIcons = {
    recovery: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#5A1010" stroke-width="1.5"/><path d="M8 4v5" stroke="#5A1010" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".75" fill="#5A1010"/></svg>',
    reduced:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C4.69 2 2 4.69 2 8s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6Z" stroke="#6A4A1A" stroke-width="1.5"/><path d="M5.5 9.5C6 10.5 7 11 8 11s2-.5 2.5-1.5" stroke="#6A4A1A" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 6.5h.01M10.5 6.5h.01" stroke="#6A4A1A" stroke-width="1.5" stroke-linecap="round"/></svg>',
    peak:     '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#1A4A1A" stroke-width="1.4"/><path d="M4 7l2 2 4-4" stroke="#1A4A1A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    normal:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1A3A6A" stroke-width="1.5"/><path d="M8 5v4" stroke="#1A3A6A" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };
  var iconWrap = h('div', {style: 'flex-shrink:0;margin-top:' + (isPeak ? '0' : '1px')});
  iconWrap.innerHTML = svgIcons[adapt.level] || svgIcons.normal;
  fallbackBanner.appendChild(iconWrap);

  if (isPeak) {
    // Compact badge — label only, no button
    fallbackBanner.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A4A1A', title: 'Score basé sur votre sommeil, état musculaire et énergie du jour. Renseignez votre bilan quotidien pour personnaliser votre séance.'}, 'Forme optimale — poussez sur les charges'));
  } else {
    var textWrap = h('div', {style: 'flex:1;min-width:0'});
    textWrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:' + cm.textColor + ';margin-bottom:3px;font-weight:700'}, adapt.label));
    textWrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;font-style:italic;color:var(--black,#1A1A18);line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'}, adapt.advice));
    var actionBtn = h('button', {
      style: 'margin-top:5px;background:none;border:none;border-bottom:1px solid ' + cm.borderColor + ';padding:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:' + cm.textColor + ';cursor:pointer;line-height:1.6',
      onclick: function() {
        if (adapt.level === 'recovery') { S._sessionPostponed = true; }
        S._wellnessBannerDismissed = true;
        window.render();
      }
    }, adapt.level === 'recovery' ? 'Reporter' : 'Compris');
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

 var daysPerWeek = S.sportDays || 4;
 var template = CF_DAY_TEMPLATES[daysPerWeek] || CF_DAY_TEMPLATES[4];
 S.crossfitWeek = S.crossfitWeek || 1;
 var weekProgram = generateCrossfitWeek(S.crossfitWeek, daysPerWeek);

 // Guard: if no WODs available, show a message instead of a blank page
 if (!weekProgram || !weekProgram.length) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
 p.appendChild(h('h1', {html: 'Cross Training<br><em>Programme</em>'}));
 p.appendChild(h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;margin:24px 0;background:var(--orangebg)'}, [
 h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:4px'}, 'Base de WODs en cours de chargement...'),
 h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, 'Rechargez la page pour afficher le programme.')
 ]));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 5; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }

 // Clamp selectedCrossfitDay — guard null/undefined and out-of-bounds
 if (S.selectedCrossfitDay === undefined || S.selectedCrossfitDay === null || S.selectedCrossfitDay < 0 || S.selectedCrossfitDay >= template.length) S.selectedCrossfitDay = 0;

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
 p.appendChild(h('h1', {html: 'Cross Training<br><em>Programme</em>'}));
 var levelObj = (window.CROSSFIT_LEVELS || []).find(function(l) { return l.id === S.crossfitLevel; });
 p.appendChild(h('p', {'class': 'subtitle'}, daysPerWeek + ' jours/semaine \u2014 ' + (levelObj ? levelObj.icon + ' ' + levelObj.name : '') + ' \u2014 Inspir\u00E9 Games Athletes Athletes'));

 appendWellnessBanner(p);

 // ─── BIENVENUE SCALED / DÉBUTANT ───
 // Afficher un message d'accueil et un CTA 1RM uniquement pour les nouveaux utilisateurs scaled sans 1RM définis
 if (S.crossfitLevel === 'scaled') {
 var has1RM = S.crossfit1RM && Object.keys(S.crossfit1RM).some(function(k) { return S.crossfit1RM[k]; });
 var welcomeCard = h('div', {style: 'border-left:4px solid #E07B00;background:rgba(224,123,0,0.07);padding:14px 16px;margin-bottom:16px'});
 welcomeCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:6px'}, 'Bienvenue dans le programme Scaled !'));
 welcomeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, 'Tous les WODs sont adaptés à votre niveau : charges allégées, mouvements simplifiés (pas de muscle-up, TTB remplacés par Knee Raises, etc.). Progressez à votre rythme — les WODs de la semaine 10+ seront nettement plus intenses.'));
 if (!has1RM) {
 welcomeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E07B00;margin-bottom:8px'}, 'Pour des charges de travail précises, renseignez vos 1RM (back squat, clean, deadlift…). Sans 1RM, les charges sont basées sur les standards internationaux pour votre niveau.'));
 welcomeCard.appendChild(h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 14px;margin:0;font-size:11px', onclick: function() { S.sStep = 5; window.render(); }}, 'Entrer mes 1RM \u2192'));
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
 goalBanner.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:6px'}, 'Objectifs : ' + goalNames));
 var goalNotes = [];
 if (S.sportGoals.indexOf('shred') !== -1) goalNotes.push('Intensit\u00E9 haute, repos courts');
 if (S.sportGoals.indexOf('muscle') !== -1) goalNotes.push('Charges lourdes sur l\'halt\u00E9ro');
 if (S.sportGoals.indexOf('endurance') !== -1) goalNotes.push('Cardio et conditioning');
 if (S.sportGoals.indexOf('weightloss') !== -1) goalNotes.push('Volume \u00E9lev\u00E9, circuits m\u00E9taboliques');
 if (goalNotes.length > 0) {
 goalBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, 'Le programme est adapt\u00E9 en cons\u00E9quence \u2014 ' + goalNotes.join(' \u00B7 ')));
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
 if (cfMed.knees || cfMed.acl) cfMedRestrictions.push('\u26A0 Genoux / LCA\u00a0: remplacez les Box Jumps par des Box Step-ups, \u00e9vitez les Jump Squats et Pistols. Thrusters et Wall Balls autoris\u00e9s avec technique contr\u00f4l\u00e9e.');
 if (cfMed.kneeOsteoarthritis) cfMedRestrictions.push('\u26A0 Gonarthrose\u00a0: \u00e9vitez tous les sauts et flexions profondes sous charge. Privil\u00e9giez le velo (Assault Bike) et le rameur (Row) comme alternatives cardio (OARSI 2014).');
 if (cfMed.meniscus) cfMedRestrictions.push('\u26A0 M\u00e9nisque\u00a0: pas de Box Jumps ni Pistols. Squats limit\u00e9s \u00e0 90\u00b0 de flexion maximum sous charge.');
 if (cfMed.lowerBack || cfMed.herniaDisc) cfMedRestrictions.push('\u26A0 Dos / Hernie discale\u00a0: r\u00e9duisez la charge sur Deadlifts et Back Squats (\u226470\u00a0% 1RM). \u00c9vitez Good Morning et Jefferson Curl.');
 if (cfMed.shoulders || cfMed.rotatorCuff) cfMedRestrictions.push('\u26A0 \u00c9paules\u00a0: remplacez HSPU par Pike Push-ups. Overhead Press all\u00e9g\u00e9. \u00c9vitez les mouvements overhead douloureux (Ludewig & Cook, Phys Ther 2000).');
 if (cfMed.hypertension) cfMedRestrictions.push('\u26A0 HTA\u00a0: intensit\u00e9 plafonn\u00e9e RPE\u00a07/10 maximum. \u00c9vitez Valsalva lors des charges lourdes (AHA/ACSM 2007).');
 if (cfMed.osteoporosis) cfMedRestrictions.push('\u26A0 Ost\u00e9oporose\u00a0: pas de Box Jumps ni sauts. Charges \u226470\u00a0% 1RM uniquement. \u00c9vitez flexions vert\u00e9brales r\u00e9p\u00e9t\u00e9es (Sinaki, Spine 2002).');
 if (cfMedRestrictions.length > 0) {
 var cfMedBanner = h('div', {style: 'border-left:3px solid #E07B00;background:rgba(224,123,0,0.07);padding:12px 16px;margin-bottom:16px'});
 cfMedBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#E07B00;margin-bottom:8px'}, '\u26A0 Restrictions m\u00e9dicales \u2014 CrossFit'));
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
  var SESSION_DUR_CF = { scaled: 60, rx: 75, rx_plus: 90 };
  var cfDur = SESSION_DUR_CF[cfLevel] || 75;
  var cfKcal = estimateKcal('crossfit', cfLevel, cfDur);
  p.appendChild(buildKcalCard(cfKcal, cfDur));
 }());

 // ─── WEEK NAVIGATION ───
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine précédente', onclick: function() {
 if (S.crossfitWeek > 1) { S.crossfitWeek--; S.selectedCrossfitDay = 0; window.render(); }
 }}, '\u2190'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.crossfitWeek));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine suivante', onclick: function() {
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
 h('span', {}, '\uD83D\uDCC5'),
 h('span', {}, 'Vue 100 jours')
 ]);
 p.appendChild(calBtn);

 // ─── CROSSFIT DELOAD BANNER (semaines 4, 8, 12, 16) ───
 // Protocole Games Athletes : 3 semaines d'intensité + 1 semaine de décharge.
 // Volume réduit de 40-50%, intensité maintenue à 70% max. Récupération CNS + articulaire.
 var cfWeekNum = S.crossfitWeek || 1;
 var isCFDeload = (cfWeekNum % 4 === 0);
 if (isCFDeload) {
 var cfDeloadBanner = h('div', {style: 'background:var(--ivory2,#F4F4F0);border-left:4px solid #0A0A09;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#4A235A'});
 cfDeloadBanner.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, '\uD83D\uDCC9 Semaine ' + cfWeekNum + ' — DÉCHARGE OBLIGATOIRE (CrossFit cycle 4-1)'));
 cfDeloadBanner.appendChild(h('div', {}, 'Réduisez le volume de 40-50\u00a0% (ex. 3 séries au lieu de 5). Intensité \u226470\u00a0% du max. Gardez les mêmes mouvements — c\'est la récupération CNS et articulaire qui permet les PR des semaines suivantes. Pas de PR ni de test de max cette semaine.'));
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
  tracker.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'PROGRESSION PROGRAMME'));
  var trackerRow = h('div', {style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px'});
  trackerRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px'}, doneDays + ' / ' + totalDays + ' jours'));
  trackerRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);padding-top:2px'}, pctDone + '% du programme'));
  if (nextTestWeek <= 20 && daysToTest > 0) {
   trackerRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--blue,#1A3A6A);padding-top:2px'}, 'Test 1RM S' + nextTestWeek + ' dans ~' + daysToTest + ' seances'));
  }
  tracker.appendChild(trackerRow);
  var tBar = h('div', {style: 'background:#E5E4DE;height:4px;border-radius:2px;overflow:hidden'});
  tBar.appendChild(h('div', {style: 'background:#1A4A1A;height:100%;width:' + pctDone + '%;transition:width 0.4s'}));
  tracker.appendChild(tBar);

  // Benchmark de la semaine
  var bmarkWeek = window.getCFBenchmarkForWeek && window.getCFBenchmarkForWeek(cfWkN);
  if (bmarkWeek) {
   var bmBanner = h('div', {style: 'margin-top:10px;padding:8px 12px;background:rgba(90,16,16,0.06);border-left:2px solid var(--red,#5A1010)'});
   bmBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--red,#5A1010);margin-bottom:4px'}, 'BENCHMARK OFFICIEL — SEMAINE ' + cfWkN));
   bmBanner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:4px'}, bmarkWeek.name));
   if (bmarkWeek.score_targets) {
    var lvlKey2 = S.crossfitLevel === 'rx_plus' ? 'elite' : (S.crossfitLevel || 'rx');
    var target2 = bmarkWeek.score_targets[lvlKey2] || bmarkWeek.score_targets.rx;
    if (target2) bmBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--red,#5A1010)'}, 'Votre cible : ' + target2));
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
    bmBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--green,#1A4A1A);margin-top:4px'}, 'Votre PR : ' + S.crossfitBenchmarks[prKey]));
   }
   tracker.appendChild(bmBanner);
  }

  // 1RM test week banner
  if (window.isCF1RMTestWeek && window.isCF1RMTestWeek(cfWkN)) {
   var testBanner = h('div', {style: 'margin-top:10px;padding:10px 14px;background:rgba(26,58,106,0.07);border-left:2px solid var(--blue,#1A3A6A)'});
   testBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--blue,#1A3A6A);margin-bottom:6px'}, 'SEMAINE TEST 1RM — S' + cfWkN));
   testBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:6px'}, 'Protocole de test complet — objectif PR sur chaque levee :'));
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
 var cycleWeek = S.crossfitCycleWeek || 1;
 HALTERO_CYCLES.renderCycleInfo(p, cycleWeek, S.sex, S.crossfitLevel);

 // Haltero cycle week selector (1-24)
 var haltWeekNav = h('div', {style: 'display:flex;align-items:center;gap:8px;margin:8px 0 16px;flex-wrap:wrap'});
 haltWeekNav.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-right:4px'}, 'Cycle Halt\u00E9ro'));
 var prevBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 12px;margin:0;font-size:13px', disabled: cycleWeek <= 1 ? true : null, onclick: function(){ S.crossfitCycleWeek = Math.max(1, (S.crossfitCycleWeek || 1) - 1); window.render(); }}, '\u25C0');
 haltWeekNav.appendChild(prevBtn);
 haltWeekNav.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;min-width:60px;text-align:center'}, cycleWeek + ' / 24'));
 var nextBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 12px;margin:0;font-size:13px', disabled: cycleWeek >= 24 ? true : null, onclick: function(){ S.crossfitCycleWeek = Math.min(24, (S.crossfitCycleWeek || 1) + 1); window.render(); }}, '\u25B6');
 haltWeekNav.appendChild(nextBtn);
 p.appendChild(haltWeekNav);
 }

 // ─── DAY TABS ───
 var tabs = h('div', {'class': 'day-tabs'});
 template.forEach(function(day, i) {
 tabs.appendChild(h('button', {
 'class': 'day-tab' + (S.selectedCrossfitDay === i ? ' active' : ''),
 onclick: function() { S.selectedCrossfitDay = i; window.render(); }
 }, day.label));
 });
 p.appendChild(tabs);

 // Current day data
 var currentDay = weekProgram[S.selectedCrossfitDay];
 if (!currentDay) return;
 var wod = currentDay.wod;
 if (!wod) { p.appendChild(h('div', {style:'padding:16px;color:var(--grey);font-size:13px'}, 'Séance non disponible. Rechargez la page.')); p.appendChild(h('button', {'class':'btn-back', onclick: function(){ S.sStep = 5; window.render(); }}, '← Modifier le niveau')); return; }

 // Day header
 p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:24px;text-align:center;margin:16px 0 4px'}, currentDay.dayLabel + ' \u2014 ' + wod.name));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);text-align:center;margin-bottom:4px'}, currentDay.focus));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);text-align:center;margin-bottom:20px'}, 'Semaine ' + S.crossfitWeek + ' \u2014 Jour ' + currentDay.dayNumber + ' / ' + daysPerWeek));

 // ─── HALTÉRO or GYM SKILLS SECTION (depending on day template) ───
 if (currentDay.hasHaltero) {
 // Show haltero section
 var haltCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A3A6A'});
 haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A3A6A;margin-bottom:6px'}, 'HALT\u00C9RO'));
 var _halt = wod.haltero || {};
 haltCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, _halt.name || ''));
 haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:4px'}, _halt.desc || ''));
 haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:6px'}, _halt.scheme || ''));
 if (_halt.weights) {
 var weightStr = getCFWeight(_halt.weights);
 if (weightStr) {
 haltCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:#1A3A6A;font-weight:bold'}, 'Charge : ' + weightStr));
 }
 }
 var haltVideoQ = encodeURIComponent((_halt.name || '') + ' crossfit technique');
 haltCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + haltVideoQ, target: '_blank', rel: 'noopener'}, '\u25B6 Voir la technique'));
 p.appendChild(haltCard);
 } else {
 // Show gym skills section first for non-haltero days
 var gymSkillCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A4A1A'});
 gymSkillCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A4A1A;margin-bottom:6px'}, 'GYMNASTIQUE'));
 var _gym = wod.gym || {};
 gymSkillCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:8px'}, (_gym.name || '')));
 var drillListTop = h('div', {});
 (_gym.drills || []).forEach(function(drill, idx) {
 drillListTop.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);padding:3px 0'}, (idx + 1) + '. ' + drill));
 });
 gymSkillCard.appendChild(drillListTop);
 var gymVideoQTop = encodeURIComponent((_gym.name || '').replace('Skill: ', '') + ' crossfit tutorial');
 gymSkillCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + gymVideoQTop, target: '_blank', rel: 'noopener', style: 'margin-top:8px'}, '\u25B6 Voir la technique'));
 p.appendChild(gymSkillCard);
 }

 // ─── WOD SECTION (always shown) ───
 var wodCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #5A1010'});
 wodCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5A1010;margin-bottom:6px'}, 'WOD'));
 var _wod = wod.wod || {};
 wodCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, _wod.name || ''));
 wodCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:#5A1010;margin-bottom:10px'}, _wod.type || ''));

 var movList = h('div', {style: 'margin-bottom:10px'});
 var _cfMedFiltered = 0;
 (_wod.movements || []).forEach(function(mov) {
 if (S.muscuMedical && S.muscuMedical.done && !filterExerciseByMedical(mov, S.muscuMedical)) {
   _cfMedFiltered++;
   return;
 }
 var movText = formatCFMovement(mov);
 var movDiv = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border)'}, movText);
 movList.appendChild(movDiv);
 });
 wodCard.appendChild(movList);
 if (_cfMedFiltered > 0) {
 if (!movList.children.length) {
   movList.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);padding:8px 0;font-style:italic'}, 'Aucun mouvement compatible — consultez les options de scaling ci-dessous'));
 }
 wodCard.appendChild(h('div', {style: 'background:#FFF3CD;border-left:3px solid #FF6B6B;padding:8px 12px;margin-top:8px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#C00'}, _cfMedFiltered + ' mouvement(s) retiré(s) pour restriction médicale'));
 }

 if (_wod.notes) {
 wodCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:6px'}, _wod.notes));
 }
 p.appendChild(wodCard);

 // ─── SCALING OPTIONS ───
 var _sc = wod.scaled;
 if (_sc) {
 var scCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #E07B00;background:rgba(224,123,0,0.04);margin-top:8px'});
 scCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#E07B00;margin-bottom:6px'}, '⬇ SCALING'));
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
 var gymCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A4A1A'});
 gymCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A4A1A;margin-bottom:6px'}, 'GYMNASTIQUE'));
 var _gym2 = wod.gym || {};
 gymCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:8px'}, (_gym2.name || '')));

 var drillList = h('div', {});
 (_gym2.drills || []).forEach(function(drill, idx) {
 drillList.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);padding:3px 0'}, (idx + 1) + '. ' + drill));
 });
 gymCard.appendChild(drillList);

 var gymVideoQ = encodeURIComponent((_gym2.name || '').replace('Skill: ', '') + ' crossfit tutorial');
 gymCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + gymVideoQ, target: '_blank', rel: 'noopener', style: 'margin-top:8px'}, '\u25B6 Voir la technique'));
 p.appendChild(gymCard);
 }
 // For non-haltero days, gym was already shown before the WOD


 // ─── ELITE: AEROBIC CAPACITY (5eme composante) ───
 if (wod.aerobic && wod.aerobic.type) {
  var aerCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A5A5A;background:rgba(26,90,90,0.03)'});
  aerCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A5A5A;margin-bottom:6px'}, 'AEROBIE (5e composante ELITE)'));
  aerCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:4px'}, wod.aerobic.type));
  aerCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, wod.aerobic.desc || ''));
  if (wod.aerobic.rpe !== undefined) {
   aerCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:#1A5A5A;margin-top:6px'}, 'RPE cible : ' + wod.aerobic.rpe + '/10 — Effort Zone 2 confortable'));
  }
  p.appendChild(aerCard);
 }

 // ─── ELITE: RECOVERY / MOBILITE (5e composante) ───
 if (wod.recovery && wod.recovery.protocol && wod.recovery.protocol.length) {
  var recCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #5A5A1A;background:rgba(90,90,26,0.03)'});
  recCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5A5A1A;margin-bottom:6px'}, 'RECOVERY & MOBILITE (Protocole champion)'));
  if (wod.recovery.targets && wod.recovery.targets.length) {
   recCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:6px'}, 'Zones cibles : ' + wod.recovery.targets.join(', ')));
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
   'JOURNAL: Notez votre score, votre RPE, et vos observations. La progression vient de l\'analyse, pas juste du travail.',
   'RECOVERY: Le muscle grandit pendant le repos, pas pendant l\'entrainement. Dors 8h minimum ce soir.',
   'MENTAL: "Les jours difficiles sont les jours qui nous construisent. Les jours faciles sont des jours de maintenance."'
  ];
  var eliteList = h('div', {});
  elitePoints.forEach(function(pt, idx) {
   eliteList.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:#8B2FC9;padding:3px 0;border-bottom:1px solid rgba(139,47,201,0.15)'}, (idx + 1) + '. ' + pt));
  });
  eliteCard.appendChild(eliteList);
  p.appendChild(eliteCard);
 }

 // Day summary — ELITE 5 composantes
 var hasAerobic = wod.aerobic && wod.aerobic.type;
 var hasRecovery = wod.recovery && wod.recovery.protocol && wod.recovery.protocol.length;
 var eliteCompCount = (currentDay.hasHaltero ? 1 : 0) + 1 + 1 + (hasAerobic ? 1 : 0) + (hasRecovery ? 1 : 0); // strength+WOD+gym+aerobic+recovery
 var summary = h('div', {'class': 'day-total'});
 summary.appendChild(h('div', {'class': 'dt-label'}, eliteCompCount + ' composantes ELITE'));
 var durStr = currentDay.hasHaltero ? '~75-90 min' : '~50-65 min';
 if (hasAerobic) durStr += ' + 20-40 min Z2 sep.';
 summary.appendChild(h('div', {'class': 'dt-val'}, durStr));
 p.appendChild(summary);

 // ─── WOD TIMER ───
 // Simple stopwatch / countdown for AMRAP and For Time WODs
 (function() {
 var wodType = (_wod.type || '').toUpperCase();
 var timerContainer = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;margin:12px 0;background:var(--ivory2)'});
 timerContainer.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'TIMER WOD'));

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

 function formatTime(secs) {
 var m = Math.floor(Math.abs(secs) / 60);
 var s = Math.abs(secs) % 60;
 return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
 }

 function updateDisplay() {
 var shown = isCountdown ? Math.max(0, totalSeconds - _elapsed) : _elapsed;
 displayEl.textContent = formatTime(shown);
 if (isCountdown && shown === 0) {
 displayEl.style.color = '#5A1010';
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
 startBtn.textContent = 'Reprendre';
 } else {
 // Son de démarrage
 _wodPlayBeep('start');
 _timerRunning = true;
 _lastTickSecond = -1;
 _timerStartTime = Date.now() - _elapsed * 1000;
 _timerInterval = window._wodTimerInterval = setInterval(function() {
 _elapsed = Math.floor((Date.now() - _timerStartTime) / 1000);
 updateDisplay();
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
 startBtn.textContent = 'Temps \u00e9coul\u00e9';
 _wodPlayBeep('end');
 }
 }
 }, 250);
 startBtn.textContent = 'Pause';
 }
 }}, 'D\u00e9marrer');

 var resetBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:8px 16px;margin:0', onclick: function() {
 _timerRunning = false;
 clearInterval(_timerInterval);
 _elapsed = 0;
 _lastTickSecond = -1;
 startBtn.textContent = 'D\u00e9marrer';
 displayEl.style.color = '#0A0A09';
 updateDisplay();
 }}, 'Reset');

 // Mute button for WOD timer sounds
 var wodMuteBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:8px 12px;margin:0;font-size:16px', title: window._sfcMuted ? 'Son coupé — cliquer pour activer' : 'Son actif — cliquer pour couper',
 onclick: function() {
 window._sfcMuted = !window._sfcMuted;
 wodMuteBtn.textContent = window._sfcMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
 wodMuteBtn.title = window._sfcMuted ? 'Son coupé — cliquer pour activer' : 'Son actif — cliquer pour couper';
 }}, window._sfcMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A');

 btnRow.appendChild(startBtn);
 btnRow.appendChild(resetBtn);
 btnRow.appendChild(wodMuteBtn);
 timerContainer.appendChild(btnRow);

 if (isCountdown) {
 timerContainer.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-top:6px'}, 'Compte \u00e0 rebours ' + (_wod.type || '')));
 } else {
 timerContainer.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-top:6px'}, 'Chrono \u2014 ' + (_wod.type || '')));
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

 var doneCard = h('div', {style: 'border:1px solid ' + (isWodDone ? '#1A4A1A' : 'var(--border)') + ';padding:14px 16px;margin:8px 0;background:' + (isWodDone ? 'rgba(76,175,80,0.07)' : 'var(--ivory2)')});
 doneCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'SUIVI WOD — Jour ' + wodDay));

 if (isWodDone) {
 doneCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:#2E7D32;margin-bottom:8px'}, ' WOD complété le ' + (S.cfProgress[wodDay].date || '') + (S.cfProgress[wodDay].score ? ' — Score : ' + S.cfProgress[wodDay].score : '')));

 var editBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 14px;margin:0;font-size:11px', onclick: function() {
 S.cfProgress[wodDay] = null;
 window.render();
 }}, 'Corriger');
 doneCard.appendChild(editBtn);
 } else {
 // Score input
 var scoreWrap = h('div', {style: 'margin-bottom:10px'});
 scoreWrap.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, 'Score (rounds, temps, reps, kg) — optionnel'));
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
 window.BLACKBOX && window.BLACKBOX.log('cf_wod_done', {day: wodDay, score: scoreInput.value.trim()});
 window.render();
 }}, ' WOD terminé');
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
  rpeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'NOTER MA SEANCE (RPE)'));
  rpeCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:10px'}, 'Comment s\'est passe ce WOD ?'));

  var rpeRow = h('div', {style: 'display:flex;gap:8px'});
  var rpeOptions = [
   {val: 'easy', label: 'Facile', color: '#1A4A1A', bg: 'rgba(26,74,26,0.08)'},
   {val: 'good', label: 'Bon effort', color: '#1A3A6A', bg: 'rgba(26,58,106,0.08)'},
   {val: 'hard', label: 'Epuisant', color: '#5A1010', bg: 'rgba(90,16,16,0.08)'}
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
   deloadRec.textContent = 'DELOAD RECOMMANDE : 5 seances consecutives Epuisant detectees. La semaine prochaine, reduisez le volume de 40% et l\'intensite a 70% max. Votre systeme nerveux central a besoin de recuperation.';
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
 }}, '\u21BB R\u00E9g\u00E9n\u00E9rer le programme'));

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 5; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier le niveau'}));
 appendNutritionModeCTA(p);
}

// (renderSportStep0 removed — replaced by renderObjectif above)

// ─── STEP 2 (Muscu): NIVEAU & FRÉQUENCE ───
function renderMusculationLevel(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation \u00b7 \u00c9tape 2/3'));
 p.appendChild(h('h1', {html: 'Votre niveau<br><em>& organisation</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Niveau d\'exp\u00e9rience, fr\u00e9quence et mat\u00e9riel disponible.'));
 if (window.TIPS) TIPS.renderTip(p, 'sportLevel');

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.level')));
 var list = h('div', {'class': 'level-list'});
 (window.SPORT_LEVELS || []).forEach(function(lv) {
 list.appendChild(h('div', {'class': 'level-item' + (S.sportLevel === lv.id ? ' on' : ''), onclick: function(){ S.sportLevel = lv.id; window.render(); }}, [
 h('div', {}, [h('div', {'class': 'level-name'}, lv.name), h('div', {'class': 'level-desc'}, lv.desc)]),
 h('span', {'class': 'level-badge'}, '×' + lv.factor)
 ]));
 });
 p.appendChild(list);

 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.days')));
 var nw = h('div', {'class': 'num-input-wrap'});
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '6', value: String(S.sportDays || 3), inputmode: 'numeric',
 oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 6) { S.sportDays = v; } },
 onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) e.target.value = S.sportDays = 2; else if (v > 6) e.target.value = S.sportDays = 6; }
 }));
 nw.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(nw);
 p.appendChild(h('div', {'class': 'num-hint'}, 'Entre 2 et 6 jours'));

 // ─── JOURS SPÉCIFIQUES ───
 // Pré-remplissage depuis le profil nutrition si déjà sélectionnés
 if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
 var _daysImported = false;
 if (S.trainingDaysSelected.length > 0) {
   if (!S.sportDays) S.sportDays = S.trainingDaysSelected.length;
   _daysImported = true;
 }
 var _sectionLabelDays = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-top:16px;margin-bottom:0'});
 _sectionLabelDays.appendChild(h('div', {'class': 'section-label', style: 'margin-top:0;margin-bottom:0'}, 'Quels jours vous entra\u00eenez-vous\u00a0? (optionnel)'));
 if (_daysImported) { _sectionLabelDays.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);font-style:italic'}, '(import\u00e9s depuis ton profil)')); }
 p.appendChild(_sectionLabelDays);
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:10px;line-height:1.5;'}, 'S\u00e9lectionnez vos jours pour adapter vos macros nutrition (entra\u00eenement vs repos).'));
 var _musDay = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
 var _musDayWrap = h('div', {style: 'display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;margin:0 0 6px'});
 var _musTarget = S.sportDays || 3;
 _musDay.forEach(function(label, idx) {
   var _mSel = S.trainingDaysSelected.indexOf(idx) !== -1;
   var _mOver = _mSel && S.trainingDaysSelected.length > _musTarget;
   var _mStyle = 'width:44px;height:44px;border-radius:3px;font-family:Georgia,serif;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;transition:background .15s,color .15s,border-color .15s;';
   if (_mOver) _mStyle += 'background:#5A1010;color:#FAF9F6;border:1.5px solid #5A1010;';
   else if (_mSel) _mStyle += 'background:#1A1A18;color:#FAF9F6;border:1.5px solid #1A1A18;';
   else _mStyle += 'background:transparent;color:#1A1A18;border:1.5px solid #E8E6DF;';
   _musDayWrap.appendChild(h('button', {
     type: 'button', style: _mStyle,
     onclick: function() {
       if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
       var _mp = S.trainingDaysSelected.indexOf(idx);
       if (_mp !== -1) { S.trainingDaysSelected.splice(_mp, 1); }
       else { S.trainingDaysSelected.push(idx); S.trainingDaysSelected.sort(function(a, b) { return a - b; }); }
       if (S.trainingDaysSelected.length > 0) S.sportDays = S.trainingDaysSelected.length;
       S.weekPlan = null;
       try { window.saveProfile(); } catch(e) {}
       window.render();
     }
   }, label));
 });
 p.appendChild(_musDayWrap);
 var _mCount = S.trainingDaysSelected.length;
 var _mDiff = _mCount - _musTarget;
 var _mColor = _mDiff === 0 && _mCount > 0 ? '#6B6B65' : (_mDiff > 0 ? '#5A1010' : '#6B6B65');
 var _mHint = _mCount === 0
   ? 'Optionnel \u2014 laissez vide pour r\u00e9partition automatique'
   : _mDiff === 0 ? _mCount + '\u00a0/' + '\u00a0' + _musTarget + '\u00a0jour' + (_mCount > 1 ? 's' : '') + '\u00a0\u2014 parfait'
   : _mDiff > 0 ? _mCount + '\u00a0/\u00a0' + _musTarget + '\u00a0\u2014 retirez\u00a0' + _mDiff + '\u00a0jour' + (_mDiff > 1 ? 's' : '')
   : _mCount + '\u00a0/\u00a0' + _musTarget + '\u00a0\u2014 s\u00e9lectionnez encore\u00a0' + Math.abs(_mDiff) + '\u00a0jour' + (Math.abs(_mDiff) > 1 ? 's' : '');
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + _mColor + ';text-align:center;margin-bottom:4px;transition:color .2s;'}, _mHint));

 // Equipment selection
 p.appendChild(h('div', {'class': 'section-label'}, '\uD83C\uDFCB\uFE0F\u200D\u2642\uFE0F Mat\u00e9riel disponible'));
 var equipOptions = [
 {id: 'gym', label: 'Salle compl\u00e8te', desc: 'Barres, machines, poulies'},
 {id: 'dumbbells', label: 'Halt\u00e8res + banc', desc: 'Home gym ou salle basique'},
 {id: 'home', label: 'Maison / PDC', desc: 'Sans mat\u00e9riel, poids du corps'}
 ];
 var eqGrid = h('div', {'class': 'level-list'});
 equipOptions.forEach(function(eq) {
 eqGrid.appendChild(h('div', {'class': 'level-item' + (S.sportEquipment === eq.id ? ' on' : ''), onclick: function() { S.sportEquipment = eq.id; window.render(); }}, [
 h('div', {}, [h('div', {'class': 'level-name'}, eq.label), h('div', {'class': 'level-desc'}, eq.desc)])
 ]));
 });
 p.appendChild(eqGrid);

 // Heure d'entraînement — pour le nutrient timing (Ivy 2004, ISSN 2017)
 p.appendChild(h('div', {'class': 'section-label'}, '\u23F0 Heure d\'entra\u00eenement habituelle'));
 p.appendChild(h('div', {style: 'font-size:13px;color:var(--text-secondary);margin:-4px 0 10px'}, 'Permet d\'adapter la r\u00e9partition des repas (prot\u00e9ines + glucides au bon moment)'));
 var trainOptions = [
 {id: 'morning', label: '\uD83C\uDF05 Matin', desc: 'Avant 12h — petit-d\u00e9j post-s\u00e9ance'},
 {id: 'noon', label: '\u2600\uFE0F Midi', desc: '12h–15h — d\u00e9jeuner post-s\u00e9ance'},
 {id: 'evening', label: '\uD83C\uDF19 Soir', desc: 'Apr\u00e8s 17h — d\u00eener post-s\u00e9ance'}
 ];
 var ttGrid = h('div', {'class': 'level-list'});
 trainOptions.forEach(function(opt) {
 ttGrid.appendChild(h('div', {'class': 'level-item' + (S.trainTime === opt.id ? ' on' : ''), onclick: function() {
 S.trainTime = (S.trainTime === opt.id) ? null : opt.id; // toggle
 if (S.weekPlan) { S.weekPlan = null; } // invalider le plan pour régénérer avec nouveau timing
 window.render();
 }}, [h('div', {}, [h('div', {'class': 'level-name'}, opt.label), h('div', {'class': 'level-desc'}, opt.desc)])]));
 });
 p.appendChild(ttGrid);
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--text-secondary);margin-top:4px'}, 'Optionnel — laissez vide si variable'));

 // ─── COMPÉTITION CIBLE (optionnel) ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:24px;'}, 'Comp\u00e9tition \u00e0 pr\u00e9parer\u00a0?'));
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin:-4px 0 10px;line-height:1.5;'}, 'Hyrox, powerlifting, marathon\u2026 l\u2019IA p\u00e9riodisera vers ta date cible. Optionnel.'));
 var _cGrid = h('div', {'class': 'level-list'});
 [{id: false, label: 'Non', desc: 'Programme standard 12 semaines'}, {id: true, label: 'Oui \u2014 j\u2019ai une date', desc: 'P\u00e9riodisation cibl\u00e9e'}].forEach(function(copt) {
   var _cSel = copt.id ? !!S.competitionGoal : !S.competitionGoal;
   _cGrid.appendChild(h('div', {'class': 'level-item' + (_cSel ? ' on' : ''), onclick: function() {
     S.competitionGoal = !!copt.id;
     if (!copt.id) { S.competitionDate = ''; S.competitionType = ''; }
     window.render();
   }}, [h('div', {}, [h('div', {'class': 'level-name'}, copt.label), h('div', {'class': 'level-desc'}, copt.desc)])]));
 });
 p.appendChild(_cGrid);
 if (S.competitionGoal) {
   p.appendChild(h('div', {'class': 'field-label', style: 'margin-top:14px;'}, 'Date de l\u2019\u00e9v\u00e9nement'));
   var _dInp = document.createElement('input');
   _dInp.type = 'date';
   _dInp.style.cssText = 'width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid var(--border,#D8D8D0);color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;font-weight:300;padding:10px 0;outline:none;margin-bottom:14px;display:block;';
   _dInp.value = S.competitionDate || '';
   _dInp.addEventListener('input', function(e) { S.competitionDate = e.target.value; });
   p.appendChild(_dInp);
   p.appendChild(h('div', {'class': 'field-label'}, 'Type d\u2019\u00e9preuve (optionnel)'));
   var _tInp = document.createElement('input');
   _tInp.type = 'text';
   _tInp.placeholder = 'ex\u00a0: Hyrox, Powerlifting, 10 km\u2026';
   _tInp.style.cssText = 'width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid var(--border,#D8D8D0);color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;font-weight:300;padding:10px 0;outline:none;display:block;';
   _tInp.value = S.competitionType || '';
   _tInp.addEventListener('input', function(e) { S.competitionType = e.target.value; });
   p.appendChild(_tInp);
 }

 // ─── SPORTS COMPLÉMENTAIRES (optionnel) ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:24px;'}, 'Sports pratiqu\u00e9s en parall\u00e8le\u00a0?'));
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin:-4px 0 10px;line-height:1.5;'}, 'Pour adapter la r\u00e9cup\u00e9ration et \u00e9viter les conflits de charge. Optionnel.'));
 if (!Array.isArray(S.sportHobbies)) S.sportHobbies = [];
 var _hbWrap = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px;'});
 [{id:'running',lb:'Running'},{id:'cycling',lb:'V\u00e9lo'},{id:'swimming',lb:'Natation'},{id:'tennis',lb:'Tennis / Padel'},{id:'martialarts',lb:'Arts martiaux'},{id:'ski',lb:'Ski / Snow'},{id:'yoga',lb:'Yoga / Mob'},{id:'other',lb:'Autre'}].forEach(function(hobj) {
   var _hSel = S.sportHobbies.indexOf(hobj.id) !== -1;
   _hbWrap.appendChild(h('button', {type: 'button', 'class': 'chip' + (_hSel ? ' on' : ''), onclick: function() {
     if (!Array.isArray(S.sportHobbies)) S.sportHobbies = [];
     var _hi = S.sportHobbies.indexOf(hobj.id);
     if (_hi !== -1) { S.sportHobbies.splice(_hi, 1); } else { S.sportHobbies.push(hobj.id); }
     window.render();
   }}, hobj.lb));
 });
 p.appendChild(_hbWrap);
 p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey,#6B6B65);margin-top:4px;'}, 'Aucune s\u00e9lection = programme muscu pur'));

 p.appendChild(h('div', {style: 'height:24px'}));
 var ok = S.sportLevel !== null;
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) { S._chargesFromLevel = true; S.sStep = 16; window.BLACKBOX && window.BLACKBOX.log('sport_step', {step: 16}); window.render(); }
 }}, 'Continuer'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 1; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 3 (Muscu): ZONES CIBLES ───
function renderMusculationZones(p) {
 var _prenom3 = S.prenom || '';
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation \u00b7 \u00c9tape 3/3'));
 p.appendChild(h('h1', {html: (_prenom3 ? _prenom3 + ', quelles zones<br>' : 'Quelles zones<br>') + '<em>voulez-vous travailler\u00a0?</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Attribuez une priorit\u00e9 \u00e0 chaque groupe musculaire. Votre programme s\u2019adaptera.'));
 if (window.TIPS) TIPS.renderTip(p, 'sportZones');

 // Show body photos if uploaded
 if (S.photoFront || S.photoBack) {
 var pg = h('div', {'class': 'photo-grid', style: 'margin-bottom:16px'});
 if (S.photoFront) {
 var pf = h('div', {'class': 'photo-upload has-photo'});
 var img1 = h('img', {src: S.photoFront, alt: 'Face'});
 pf.appendChild(img1);
 pf.appendChild(h('div', {'class': 'photo-label'}, 'Face'));
 pg.appendChild(pf);
 }
 if (S.photoBack) {
 var pb2 = h('div', {'class': 'photo-upload has-photo'});
 var img2 = h('img', {src: S.photoBack, alt: 'Dos'});
 pb2.appendChild(img2);
 pb2.appendChild(h('div', {'class': 'photo-label'}, 'Dos'));
 pg.appendChild(pb2);
 }
 p.appendChild(pg);
 }

 // Priority star rating for each body zone
 p.appendChild(h('div', {'class': 'section-label'}, 'Groupes musculaires — Priorité'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, 'Attribuez 1 à 5 étoiles pour définir la priorité. Cliquez à nouveau pour retirer.'));
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
 if (isWeak) nameDiv.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--orange);margin-left:8px'}, '\u26A1 \u00C0 renforcer'));
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
 var tip = h('div', {style: 'border-left:2px solid var(--orange);padding:8px 16px;background:var(--orangebg);margin-bottom:16px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'});
 tip.textContent = '\u26A1 Zones identifi\u00e9es \u00e0 renforcer depuis votre profil nutrition';
 p.appendChild(tip);
 }

 // ─── DURÉE DE SÉANCE ───
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:24px'}, 'Durée de vos séances'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, 'Quelle est la durée de vos séances ?'));
 var durationOptions = [
 {id: '45min', label: '45 min', desc: '4-5 exercices · 3 séries'},
 {id: '1h', label: '1h', desc: '5-6 exercices · 3-4 séries'},
 {id: '1h15', label: '1h15', desc: '6-7 exercices · 4 séries'},
 {id: '1h30', label: '1h30', desc: '7-8 exercices · 4-5 séries'}
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
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Choisissez au moins 2 zones à travailler pour continuer.'));
 } else if (!S.sportSessionDuration) {
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Indiquez la durée de vos séances pour continuer.'));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) {
 var _prog;
 try { _prog = generateSportProgram(); } catch(e) { console.error('[sport] generateSportProgram error:', e); }
 if (!_prog || _prog.length === 0 || _prog.every(function(d){ return !d.exercises || d.exercises.length === 0; })) {
   S._programGenerationError = 'Aucun exercice disponible avec vos contraintes. Essayez d\'assouplir vos restrictions médicales ou d\'ajouter de l\'équipement.';
   S.sStep = 4;
   if (window.render) window.render();
   return;
 }
 S.sportProgram = _prog;
 S.selectedSportDay = 0;
 S.sStep = 4;
 window.BLACKBOX && window.BLACKBOX.log('sport_program_generated', {days: S.sportDays, focus: S.sportFocus, duration: S.sportSessionDuration});
 if (window.GAMIFICATION) GAMIFICATION.unlockBadge('first_workout');
 window.render();
 }
 }}, 'Générer mon programme'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S._chargesFromLevel = true; S.sStep = 16; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── SYSTÈME DE PHASES 7 SEMAINES ───
var MUSCU_PHASES = [
 {weeks:[1,2], id:'adaptation', label:'Adaptation', color:'#2980B9',
 rpe:6, rpeNote:'RPE 6 — vous pourriez faire 4 reps de plus. Priorité à la technique.',
 pct1rm:0.60, advice:'Maîtrisez la technique avant d\'augmenter les charges. Si vous réussissez toutes les reps → +2.5 kg la semaine suivante.',
 setsOffset:-1, repsOffset:+2, restNote:'Repos libres — récupération complète entre chaque série.'},
 {weeks:[3,4], id:'progression', label:'Progression', color:'#1A4A1A',
 rpe:8, rpeNote:'RPE 8 — vous pourriez faire 2 reps de plus. Zone optimale hypertrophie.',
 pct1rm:0.72, advice:'Progression double : augmentez d\'abord les reps (ex. 8→10→12), puis montez la charge de 2.5 kg et retombez à 8 reps.',
 setsOffset:0, repsOffset:0, restNote:'Respectez les temps de repos indiqués.'},
 {weeks:[5,6], id:'intensification',label:'Intensification',color:'#6A4A1A',
 rpe:9, rpeNote:'RPE 9 — 1 rep en réserve. Dernier set seulement jusqu\'à l\'échec technique (jamais sur squat/soulevé).',
 pct1rm:0.82, advice:'Charges maximales. +1 série par exercice composé. Dernier set à l\'échec sur les isolations uniquement.',
 setsOffset:+1, repsOffset:-2, restNote:'+30s de repos vs semaines précédentes. CNS sous pression maximale.'},
 {weeks:[7], id:'decharge', label:'Décharge', color:'#0A0A09',
 rpe:5, rpeNote:'RPE 5 — très facile, 5+ reps en réserve. Récupération musculaire et articulaire.',
 pct1rm:0.50, advice:'Réduisez le volume de 50% (2 séries au lieu de 4) et les charges de 40-50%. Gardez les mêmes exercices. Indispensable pour la progression long terme.',
 setsOffset:-2, repsOffset:0, restNote:'Repos complets. Votre prochain cycle sera plus fort grâce à cette semaine.'}
];

// Calcule le poids recommandé pour un exercice selon la phase courante
function getSuggestedWeight(exerciseName, reps, phase) {
 var pct = phase ? (phase.pct1rm || 0.72) : 0.72;
 // Priority 1: use user's actual 1RM from strength profile (Epley-calculated)
 if (S.muscuStrengthProfile && window.MUSCU_KEY_EXERCISES) {
 var nameLow = (exerciseName || '').toLowerCase();
 var matchedEx = null;
 for (var mi = 0; mi < window.MUSCU_KEY_EXERCISES.length; mi++) {
 var kex = window.MUSCU_KEY_EXERCISES[mi];
 if (nameLow.indexOf(kex.name.toLowerCase().split(' ')[0]) !== -1 || nameLow.indexOf(kex.key.replace('_',' ')) !== -1) {
 matchedEx = kex; break;
 }
 }
 if (matchedEx && S.muscuStrengthProfile[matchedEx.key]) {
 var profileWeight = S.muscuStrengthProfile[matchedEx.key];
 var profileReps = S.muscuStrengthProfile[matchedEx.key + '_reps'] || 8;
 // Calculate 1RM via Epley: weight × (1 + reps/30)
 var oneRM = profileWeight * (1 + profileReps / 30);
 // Return pct1rm × 1RM, rounded to nearest 2.5kg
 var suggested = Math.round(oneRM * pct / 2.5) * 2.5;
 return Math.max(suggested, 5);
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
 return null;
}

function renderSparkline(values, color) {
 color = color || '#1A4A1A';
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
 return s.actualReps >= s.targetReps && s.actualWeight >= s.targetWeight;
 });
 if (allSucceeded) return Math.round((last.weight + increment) / 2.5) * 2.5; // arrondi 2.5kg (disques standard)
 // Échec → maintenir le poids
 return last.weight;
 }
 return last.weight;
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
     var _notifTitle = _state.isTransition ? 'Exercice suivant !' : 'Repos terminé !';
     var _notifBody = _state.isTransition
       ? ('Prêt pour\u00a0: ' + (_state.nextExercise || 'l\'exercice suivant'))
       : ('Série ' + _state.setNum + ' — c\'est parti !');
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
     var _notifTitle = _state.isTransition ? 'Exercice suivant !' : 'Repos terminé !';
     var _notifBody = _state.isTransition
       ? ('Prêt pour\u00a0: ' + (_state.nextExercise || 'l\'exercice suivant'))
       : ('Série ' + _state.setNum + ' — c\'est parti !');
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

 var labelText = isTrans ? 'Transition' : (_state.exerciseName || 'Repos');
 var subText = isTrans
 ? (_state.exerciseName + ' \u2192 ' + (_state.nextExercise || 'Suivant'))
 : ('S\u00e9rie ' + _state.setNum + ' termin\u00e9e \u2014 repos');

 var goText = isTrans
 ? ('\uD83C\uDFCB\uFE0F ' + (_state.nextExercise || 'Exercice suivant'))
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
 reason.textContent = 'Repos adapt\u00e9 : ' + totalStr + ' (profil + charge + objectif)';
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
 skipBtn.textContent = 'Passer \u25b6';
 skipBtn.addEventListener('click', function() { window.RestTimer.stop(); });
 actions.appendChild(skipBtn);

 var muteBtn = document.createElement('button');
 muteBtn.className = 'rest-timer-btn rest-timer-btn-mute' + (window._sfcMuted ? ' muted' : '');
 muteBtn.textContent = window._sfcMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
 muteBtn.title = window._sfcMuted ? 'Son coupé — cliquer pour activer' : 'Son actif — cliquer pour couper';
 muteBtn.addEventListener('click', function() {
 window._sfcMuted = !window._sfcMuted;
 muteBtn.textContent = window._sfcMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
 muteBtn.title = window._sfcMuted ? 'Son coupé — cliquer pour activer' : 'Son actif — cliquer pour couper';
 if (window._sfcMuted) { muteBtn.classList.add('muted'); } else { muteBtn.classList.remove('muted'); }
 });
 actions.appendChild(muteBtn);
 } else {
 var goBtn = document.createElement('button');
 goBtn.className = 'rest-timer-btn ' + (isTrans ? 'rest-timer-btn-go-transition' : 'rest-timer-btn-go');
 goBtn.textContent = isTrans ? '\uD83C\uDFCB\uFE0F Commencer !' : 'C\u2019est parti !';
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
function renderPlateCalculator(targetKg, barKg) {
  var PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
  barKg = barKg || 20; // barre olympique standard
  var remaining = (targetKg - barKg) / 2; // par côté
  var result = [];

  PLATES.forEach(function(plate) {
    var count = Math.floor(remaining / plate);
    if (count > 0) {
      result.push({ plate: plate, count: count });
      remaining -= count * plate;
    }
  });

  var html = '<div class="plate-calc" style="margin:12px 0;padding:12px;border:1px solid var(--border);background:var(--ivory2)">';
  html += '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;color:var(--grey)">PLAQUES PAR CÔTÉ — ' + targetKg + 'kg</div>';

  if (result.length === 0 && remaining <= 0.1) {
    html += '<div style="font-size:12px;color:var(--grey)">Barre seule (' + barKg + 'kg)</div>';
  } else {
    result.forEach(function(r) {
      // Couleurs cohérentes design system (palette --green/--blue/--orange/--grey)
      var color = r.plate >= 20 ? 'var(--green,#1A4A1A)' : r.plate >= 10 ? 'var(--blue,#1A3A6A)' : r.plate >= 5 ? 'var(--orange,#6A4A1A)' : 'var(--grey,#6B6B65)';
      html += '<span style="display:inline-block;margin:2px 4px;padding:4px 10px;background:' + color + ';color:var(--ivory,#FAF9F6);font-size:11px;font-weight:700;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;letter-spacing:0.5px">' + r.plate + 'kg × ' + r.count + '</span>';
    });
    if (remaining > 0.1) {
      html += '<div style="font-size:10px;color:var(--grey);margin-top:4px">⚠ Différence : ' + remaining.toFixed(2) + 'kg (microplaques)</div>';
    }
  }
  html += '</div>';
  return html;
}
window.renderPlateCalculator = renderPlateCalculator;

// ─── TIMER DE REPOS SIMPLE (overlay fixe bas-droite) ─────────────────────────
var _restTimerInterval = null;
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
    if (!timerEl) { clearInterval(_restTimerInterval); return; }
    var tc = timerEl.querySelector('.timer-count');
    if (tc) {
      tc.textContent = display;
      if (_restTimerSeconds <= 10) {
        tc.style.color = 'var(--red,#c0392b)';
      }
    }
    if (_restTimerSeconds <= 0) {
      clearInterval(_restTimerInterval);
      if (tc) tc.textContent = 'GO!';
      if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch(e) {} }
    }
  }, 1000);
}

function stopRestTimer() {
  if (_restTimerInterval) clearInterval(_restTimerInterval);
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

 // Phase du cycle → intensité de la charge
 var phase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(s.muscuWeek || 1) : null;
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
 var completed = sets.filter(function(s) { return s.actualWeight !== null || s.actualReps !== null; });
 if (completed.length === 0) return;
 var avgWeight = completed.reduce(function(sum, s) { return sum + (s.actualWeight || 0); }, 0) / completed.length;
 var avgReps = completed.reduce(function(sum, s) { return sum + (s.actualReps || 0); }, 0) / completed.length;
 if (completed.length === 0 || isNaN(avgWeight)) return;

 if (!S.muscuProgressionHistory[exName]) S.muscuProgressionHistory[exName] = [];
 var existing = S.muscuProgressionHistory[exName].find(function(entry) { return entry.date === _today2; });
 if (!existing) {
 S.muscuProgressionHistory[exName].push({
 date: _today2,
 week: S.muscuWeek || 1,
 weight: Math.round(avgWeight * 2) / 2,
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
 } catch (e) {
 console.warn('[saveMuscuSessionLog] localStorage error:', e);
 }
}

function getMuscuPhase(week) {
 for (var i = 0; i < MUSCU_PHASES.length; i++) {
 if (MUSCU_PHASES[i].weeks.indexOf(week) !== -1) return MUSCU_PHASES[i];
 }
 return MUSCU_PHASES[0];
}

function applyPhaseToExercise(ex, phase) {
 var result = JSON.parse(JSON.stringify(ex));
 var baseSets = typeof result.sets === 'number' ? result.sets : 4;
 result.sets = Math.max(2, baseSets + phase.setsOffset);
 if (typeof result.reps === 'number') result.reps = Math.max(5, result.reps + phase.repsOffset);
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
 var w = parseInt(localStorage.getItem('mtd_muscu_week_' + uid));
 if (!isNaN(w) && w >= 1) S.muscuWeek = w;
 var start = localStorage.getItem('mtd_muscu_start_' + uid);
 if (start) S.muscuProgramStart = start;
 var c = parseInt(localStorage.getItem('mtd_muscu_cycle_' + uid));
 if (!isNaN(c) && c >= 1) S.muscuCycle = c;
 } catch (e) {
 console.warn('[loadMuscuWeek] localStorage error:', e);
 }
}

function renderWeekTracker(p) {
 loadMuscuWeek();
 var week = S.muscuWeek || 1;
 var phase = getMuscuPhase(week);

 var container = h('div', {style: 'border:2px solid ' + phase.color + ';padding:16px;margin-bottom:20px;background:var(--ivory2)'});

 // Phase badge + week
 var top = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px'});
 var badge = h('div', {style: 'display:flex;align-items:center;gap:8px'});
 badge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#fff;background:' + phase.color + ';padding:3px 8px'}, phase.label));
 var cycleNum = S.muscuCycle || 1;
 badge.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:13px;color:' + phase.color}, 'Semaine ' + week + ' / 7 · Cycle ' + cycleNum));
 top.appendChild(badge);
 if (S.muscuProgramStart) {
 top.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey)'}, 'Début : ' + S.muscuProgramStart));
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
 var hasT1D = S.medical && S.medical.indexOf('diabete_t1') !== -1;
 var displayRpe = phase.rpe;
 var displayRpeNote = phase.rpeNote;
 if (hasT1D && phase.rpe > 7) {
 displayRpe = 7;
 displayRpeNote = 'RPE 7 — Plafonné à 7/10 pour diabète T1 (risque hypoglycémie à RPE 8-9, ADA 2023). Glucomètre obligatoire.';
 }
 var rpeBadge = h('div', {style: 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid ' + phase.color + ';margin-bottom:8px'});
 rpeBadge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:' + phase.color}, 'RPE ' + displayRpe + '/10'));
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
 }, 'Semaine ' + (week + 1) + ' \u2192'));
 } else {
 btnRow.appendChild(h('button', {
 style: 'flex:1;padding:10px;background:#1A4A1A;color:#fff;border:none;font-family:Georgia,serif;font-size:13px;cursor:pointer',
 onclick: function() {
 S.muscuProgramStart = new Date().toISOString().split('T')[0];
 S.muscuCycle = (S.muscuCycle || 1) + 1;
 var uid2 = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 try { localStorage.setItem('mtd_muscu_start_' + uid2, S.muscuProgramStart); } catch(e) { console.warn('[muscu_cycle] localStorage error:', e); }
 try { localStorage.setItem('mtd_muscu_cycle_' + uid2, String(S.muscuCycle)); } catch(e) { console.warn('[muscu_cycle] localStorage error:', e); }
 try { var _newProg = generateSportProgram(); if (_newProg && _newProg.length) S.sportProgram = _newProg; } catch(e) { console.error('[nouveau_cycle] generateSportProgram failed', e); }
 S.selectedSportDay = 0;
 saveMuscuWeek(1);
 window.render();
 }
 }, '\u21BB Nouveau cycle (Semaine 1)'));
 }
 btnRow.appendChild(h('button', {
 style: 'padding:10px 14px;background:var(--ivory);color:var(--grey);border:1px solid var(--border);font-family:"Helvetica Neue",sans-serif;font-size:11px;cursor:pointer',
 onclick: function() {
 if (week > 1) { saveMuscuWeek(week - 1); window.render(); }
 },
 disabled: week <= 1
 }, '\u2190 Sem. préc.'));
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
 var sm = (ex.sets || '').match(/^(\d+)[x\u00d7](\d+)/);
 if (sm) { sets = parseInt(sm[1]); reps = parseInt(sm[2]); }
 var isCompound = /(squat|soulevé|développé|rowing|presse|hip thrust|fente|deadlift|tirage|pull)/i.test(ex.n || '');
 var tSet = reps * (isCompound ? 3.5 : 2.5);
 var rest = 90;
 var rm = (ex.rest || '').match(/(\d+)\s*min/i);
 var rs = (ex.rest || '').match(/^(\d+)\s*s/i);
 if (rm) rest = parseInt(rm[1]) * 60;
 else if (rs) rest = parseInt(rs[1]);
 totalSec += sets * tSet + (sets - 1) * rest;
 });
 totalSec += 300; // 5 min récupération
 return Math.max(20, Math.round(totalSec / 60));
}

// Dépense calorique personnalisée — MET (Ainsworth 2011) pour musculation + Keytel 2005 pour cardio
// NOTE: La formule Keytel (FC-based) est valide pour exercice aérobique CONTINU.
// Pour la musculation (effort intermittent), elle surestime de ~2x (MET musculation = 5-6 vs course).
// On utilise donc MET pour la résistance et Keytel pour les séances à dominante cardio.
function calcSessionKcal(exercises, durationMin) {
 var s = window.S;
 var weight = s.weight || 75;
 var age = getAge() || 30;
 var sex = (s.sex === 'femme') ? 'femme' : 'homme';
 // Phase courante → RPE
 var phase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(s.muscuWeek || 1) : null;
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
 (exercises || []).forEach(function(ex) { var m = (ex.sets || '').match(/^(\d+)/); if (m) totalSets += parseInt(m[1]); });
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
 // Afficher le message d'erreur si la génération a échoué (évite l'écran blanc)
 if (S._programGenerationError) {
   p.appendChild(h('div', {style: 'text-align:center;padding:48px 24px;font-family:"Helvetica Neue",Arial,sans-serif;'}, [
     h('div', {style: 'font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;'}, 'Programme indisponible'),
     h('p', {style: 'font-size:14px;color:var(--text-secondary,#6B6B65);max-width:300px;margin:0 auto 24px;line-height:1.5;'}, S._programGenerationError),
     h('button', {'class': 'btn-primary', style: 'margin:0 auto;display:block;', onclick: function() {
       S._programGenerationError = null;
       S.sportProgram = [];
       S._generatingProgram = false;
       if (window.render) window.render();
     }}, 'Réessayer')
   ]));
   return;
 }
 if (!Array.isArray(S.sportProgram) || S.sportProgram.length === 0) {
   // Afficher un message de génération si pas de programme
   if (!S._generatingProgram) {
     S._generatingProgram = true;
     p.appendChild(h('div', {style: 'text-align:center;padding:48px 24px;font-family:"Helvetica Neue",Arial,sans-serif;'},[
       h('div', {style: 'font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;'}, 'Génération de votre programme...'),
       h('div', {style: 'width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--black);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;'})
     ]));
     setTimeout(function() {
       try {
         S._generatingProgram = false;
         S.sportProgram = generateSportProgram();
         if (!S.sportProgram || S.sportProgram.length === 0 || S.sportProgram.every(function(d){ return !d.exercises || d.exercises.length === 0; })) {
           console.error('[sport] generateSportProgram returned empty program');
           S._generatingProgram = false;
           S._programGenerationError = 'Aucun exercice disponible avec vos contraintes actuelles. Essayez d\'assouplir vos restrictions médicales ou d\'ajouter davantage d\'équipement.';
           if (window.render) window.render();
           return;
         }
         S._programGenerationError = null;
         S.selectedSportDay = 0;
         if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
         if (window.render) window.render();
       } catch(e) {
         console.error('[sport] generateSportProgram error:', e);
         S._generatingProgram = false;
         S._programGenerationError = 'Une erreur est survenue lors de la génération du programme. Veuillez réessayer.';
         if (window.render) window.render();
       }
     }, 50);
     return;
   } else {
     // setTimeout en attente — afficher le spinner et attendre, ne pas générer en doublon
     p.appendChild(h('div', {style: 'text-align:center;padding:48px 24px;font-family:"Helvetica Neue",Arial,sans-serif;'},[
       h('div', {style: 'font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;'}, 'Génération de votre programme...'),
       h('div', {style: 'width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--black);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;'})
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

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
 p.appendChild(h('h1', {html: 'Votre<br><em>programme</em>'}));

 // ─── SECTION : PROGRAMME DE LA SEMAINE ───

 appendWellnessBanner(p);

 // CS-01: Bannière charges estimées si profil de force non renseigné
 if (Object.keys(S.muscuStrengthProfile || {}).length === 0) {
 var estBanner = h('div', {style: 'border-left:3px solid #6A4A1A;padding:10px 14px;background:var(--orangebg,rgba(106,74,26,.06));margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6A4A1A'});
 estBanner.appendChild(h('div', {style: 'font-weight:bold;margin-bottom:3px'}, 'Charges estimées'));
 estBanner.appendChild(h('div', {}, 'Les poids affichés sont calculés d\'après votre poids de corps et niveau. Pour des charges personnalisées,\u00a0'));
 var goBack16 = h('span', {style: 'text-decoration:underline;cursor:pointer', onclick: function(){ S._chargesReturnToDashboard = true; S.sStep = 16; window.render(); }}, 'saisissez vos charges de référence');
 estBanner.appendChild(goBack16);
 estBanner.appendChild(h('span', {}, '.'));
 p.appendChild(estBanner);
 }

 // ─── BANNIÈRE ADAPTATIONS MÉDICALES ───
 if (S.muscuMedical && S.muscuMedical.done) {
 var med = S.muscuMedical;
 var restrictions = [];
 if (med.shoulders || med.rotatorCuff) restrictions.push('\u26A0 \u00c9paules\u00a0: exercices overhead \u00e9vit\u00e9s');
 if (med.lowerBack || med.herniaDisc) restrictions.push('\u26A0 Dos\u00a0: soulev\u00e9 de terre et flexions lourdes retir\u00e9s');
 if (med.knees || med.acl) restrictions.push('\u26A0 Genoux\u00a0: squats profonds remplac\u00e9s');
 if (med.herniaInguinal) restrictions.push('\u26A0 Hernie inguinale\u00a0: exercices hyperpressifs retir\u00e9s');
 if (med.hypertension) restrictions.push('\u26A0 HTA\u00a0: intensit\u00e9 plafonn\u00e9e RPE\u00a07/10, Valsalva interdit');
 if (med.osteoporosis) restrictions.push('\u26A0 Ost\u00e9oporose\u00a0: charges \u2264\u00a070\u00a0% 1RM, pas d\'impacts ni flexions vert\u00e9brales (Sinaki, Spine 2002)');
 if (med.rheumatoidArthritis) restrictions.push('\u26A0 Polyarthrite rhumato\u00efde\u00a0: charges l\u00e9g\u00e8res, exercices doux en r\u00e9mission uniquement \u2014 arr\u00eatez en cas de pouss\u00e9e (EULAR 2020)');
 if (med.fibromyalgia) restrictions.push('\u26A0 Fibromyalgie\u00a0: intensit\u00e9 mod\u00e9r\u00e9e max, pas de HIIT ni charges maximales \u2014 exercices a\u00e9robies doux recommand\u00e9s (Cochrane 2017)');
 if (med.meniscus) restrictions.push('\u26A0 M\u00e9nisque\u00a0: pas de flexion >90\u00b0 sous charge ni de cisaillement en rotation (leg extension, fentes)');
 if (med.feet) restrictions.push('\u26A0 Pieds/fasciite\u00a0: exercices \u00e0 impact retir\u00e9s (sauts, corde), privil\u00e9gier velo ou natation');
 if (med.spondylarthritis) restrictions.push('\u26A0 Spondylarthrite\u00a0: charges axiales lourdes retir\u00e9es (deadlift, squat barre, good morning) \u2014 natation, yoga et \u00e9tirements recommand\u00e9s (Sieper & Poddubnyy, Lancet 2017)');
 if (med.kneeOsteoarthritis) restrictions.push('\u26A0 Gonarthrose\u00a0: flexions profondes du genou et impacts retir\u00e9s \u2014 v\u00e9lo stationnaire et musculation en amplitude limit\u00e9e recommand\u00e9s (OARSI 2014)');
 if (med.epicondylitis || med.elbows) restrictions.push('\u26A0 \u00c9picondylite\u00a0: rowing barre pronation, pull-ups pronation, curl barre droite retir\u00e9s \u2014 favoriser prise supination ou neutre (Bisset & Vicenzino, JOSPT 2015)');
 if (restrictions.length > 0) {
 var medBanner = h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:4px solid #6A4A1A;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6A4A1A'});
 medBanner.appendChild(h('div', {style: 'font-weight:bold;margin-bottom:6px'}, '\uD83C\uDFE5 Programme adapt\u00e9 \u00e0 votre bilan m\u00e9dical'));
 restrictions.forEach(function(r) {
 medBanner.appendChild(h('div', {style: 'margin-bottom:3px'}, r));
 });
 var editMed = h('div', {style: 'margin-top:8px;font-size:11px;text-decoration:underline;cursor:pointer;color:#6A4A1A',
 onclick: function(){ S._medicalReturnToDashboard = true; S.sStep = 20; window.render(); }}, 'Modifier mon bilan m\u00e9dical');
 medBanner.appendChild(editMed);
 p.appendChild(medBanner);
 }
 }

 // ─── ALERTE GROSSESSE SPORT (ACOG 2020) ───
 var pregSportWarn = getPregnancySportWarning();
 if (pregSportWarn) {
 p.appendChild(h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:4px solid #6A4A1A;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6A4A1A;line-height:1.6'}, pregSportWarn));
 }

 // ─── CONFLITS OBJECTIFS NUTRITION × SPORT ───
 if (window.detectMedicalConflicts) {
 var progConflicts = window.detectMedicalConflicts();
 // Filtrer : uniquement les conflits liés aux objectifs sport/nutrition (conflit 9 & 10) + médicaux sport
 var sportConflicts = progConflicts.filter(function(c) {
 return c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1 || c.message.indexOf('IRC + Objectif') !== -1 || c.message.indexOf('Cardiopathie') !== -1 || c.message.indexOf('Diab\u00e8te') !== -1;
 });
 sportConflicts.forEach(function(c) {
 var bg = c.level === 'CRITIQUE' ? 'var(--redbg,rgba(90,16,16,.06))' : c.level === '\u00c9LEV\u00c9' ? 'var(--orangebg,rgba(106,74,26,.06))' : 'var(--bluebg,rgba(26,58,106,.06))';
 var border = c.level === 'CRITIQUE' ? '#5A1010' : c.level === '\u00c9LEV\u00c9' ? '#6A4A1A' : '#1A3A6A';
 var color = c.level === 'CRITIQUE' ? '#5A1010' : c.level === '\u00c9LEV\u00c9' ? '#6A4A1A' : '#0D47A1';
 p.appendChild(h('div', {style: 'background:' + bg + ';border-left:4px solid ' + border + ';padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:' + color + ';line-height:1.5'}, c.message));
 });
 }

 // Medical/age contextual warnings in program view
 var hasDiabProg = S.medical && (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1);
 if (hasDiabProg) {
 var diabMsg = S.medical.indexOf('diabete_t1') !== -1
 ? ' Diabète T1 : RPE plafonné à 7/10 (risque hypoglycémie à haute intensité). Glycémie cible avant séance : 7-10 mmol/L. Glucomètre obligatoire avant/après. Gardez 15-20g glucides rapides à portée.'
 : ' Diabète : Vérifiez votre glycémie avant/après chaque séance. Gardez du sucre rapide à portée. Intensité maximale RPE 8/10 — jamais à l\'échec. Hydratation ×1.5.';
 p.appendChild(h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:4px solid #6A4A1A;padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#6A4A1A'}, diabMsg));
 }
 if (getAge() >= 50) {
 p.appendChild(h('div', {style: 'background:var(--greenbg,rgba(26,74,26,.06));border-left:4px solid #1A4A1A;padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#1A4A1A'}, ' 50+ : Échauffement 15-20 min obligatoire. Décharge toutes les 4-5 semaines. Favorisez les mouvements guidés pour protéger les articulations.'));
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
 var karvonenDiv = h('div', {style: 'border-left:2px solid var(--red);padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;background:var(--redbg)'});
 karvonenDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--red);margin-bottom:8px'}, 'Cardiopathie — Zones FC Karvonen'));
 karvonenDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, 'FC repos ' + hrRest + ' bpm · HRmax estimé ' + hrMax + ' bpm'));
 var zonesRow = h('div', {style: 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px'});
 zonesRow.appendChild(h('span', {'class': 'val-good'}, 'Z1 Récup ' + z1lo + '–' + z1hi + ' bpm'));
 zonesRow.appendChild(h('span', {'class': 'val-good'}, 'Z2 Aérobie ' + z2lo + '–' + z2hi + ' bpm'));
 zonesRow.appendChild(h('span', {'class': 'val-neutral'}, 'Z3 Seuil ' + z3lo + '–' + z3hi + ' bpm'));
 karvonenDiv.appendChild(zonesRow);
 karvonenDiv.appendChild(h('div', {style: 'margin-top:4px;font-style:italic;color:var(--grey)'}, ' Beta-bloquants : si prescrit, votre FC max réelle est plus basse (~10-20%). Consulter votre cardiologue pour ajuster les zones. Test d\'effort (VO2max) recommandé avant programme intensif.'));
 p.appendChild(karvonenDiv);
 }

 // Sommeil insuffisant : avertissement récupération (S.sleep 0=<6h, 1=6-7h) — ACSM 2020, IOC 2018
 if (S.sleep !== null && S.sleep !== undefined && S.sleep <= 1) {
 var sleepLabels = ['< 6h', '6-7h'];
 var sleepMsg = S.sleep === 0
 ? ' Sommeil < 6h/nuit — risque de surentraînement élevé. Performance -30%, récupération compromise (IOC 2018). Limitez les séances intenses à 2/semaine. Évitez les blocs HIIT consécutifs.'
 : ' Sommeil 6-7h/nuit — récupération partielle. Maintenez au maximum 4 séances/semaine. Évitez 2 jours intenses d\'affilée.';
 p.appendChild(h('div', {style: 'background:#FFF8E1;border-left:4px solid #F9A825;padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#6A4A1A'}, sleepMsg));
 }

 var goalNames = (S.sportGoals || []).map(function(gid){
 var g = (window.SPORT_GOALS || []).find(function(x){ return x.id === gid; });
 return g ? g.name : '';
 }).join(' + ');
 // RPE Guide for beginners
 if (S.sportLevel === 'beginner' || !S.sportLevel) {
  if (S.sportLevel === 'beginner' && S._rpeGuideExpanded === undefined) S._rpeGuideExpanded = true;
  var rpeWrap = h('div', {style: 'border:1px solid var(--border,#E8E6DF);margin-bottom:16px;border-radius:2px'});
  var rpeHeader = h('div', {
   style: 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;cursor:pointer;background:var(--ivory2,#F5F4F0)',
   onclick: function() { S._rpeGuideExpanded = !S._rpeGuideExpanded; window.render(); }
  });
  rpeHeader.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:600;color:var(--black,#1A1A18)'}, '📊 C\'est quoi le RPE ? (taux d\'effort)'));
  rpeHeader.appendChild(h('div', {style: 'font-size:12px;color:var(--grey)'}, S._rpeGuideExpanded ? '▲' : '▼'));
  rpeWrap.appendChild(rpeHeader);

  if (S._rpeGuideExpanded) {
   var rpeBody = h('div', {style: 'padding:12px 14px'});
   rpeBody.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin-bottom:10px;line-height:1.6'}, 'Le RPE mesure votre effort sur 10. Simple : combien de reps auriez-vous pu faire en plus ?'));
   var rpeRows = [
    ['RPE 5-6', '#1A4A1A', 'Facile — vous pourriez faire encore 4-5 reps. Échauffement.'],
    ['RPE 7', '#6A4A1A', 'Modéré — vous pourriez faire encore 3 reps. Zone de progression.'],
    ['RPE 8', '#6A4A1A', 'Dur — encore 2 reps possibles. Zone de hypertrophie.'],
    ['RPE 9', '#5A1010', 'Très dur — encore 1 rep. Réservé aux avancés.'],
    ['RPE 10', '#5A1010', 'Échec total — plus une seule rep possible. Déconseillé aux débutants.']
   ];
   rpeRows.forEach(function(row) {
    var rpeRow = h('div', {style: 'display:flex;align-items:flex-start;gap:10px;margin-bottom:7px'});
    rpeRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;color:' + row[1] + ';min-width:52px;flex-shrink:0;padding-top:1px'}, row[0]));
    rpeRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5'}, row[2]));
    rpeBody.appendChild(rpeRow);
   });
   rpeBody.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey);margin-top:8px;border-top:1px solid var(--border);padding-top:8px'}, '💡 En tant que débutant, visez RPE 7-8. Arrêtez si ça fait mal (≠ brûlure musculaire normale).'));
   rpeWrap.appendChild(rpeBody);
  }
  p.appendChild(rpeWrap);
 }

 p.appendChild(h('p', {'class': 'subtitle'}, S.sportDays + ' jours/semaine — ' + goalNames));
 if (window.TIPS) TIPS.renderTip(p, 'sportProgram');

 // ─── SUIVI 7 SEMAINES ───
 renderWeekTracker(p);

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
 var _selDay = S.sportProgram[S.selectedSportDay || 0];
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
 _muscleSection.appendChild(h('div', {'class': 'section-label'}, 'Muscles de la s\u00e9ance'));
 _sessionCats.sort(function(a, b) { return _sessionSetCount[b] - _sessionSetCount[a]; });
 _sessionCats.forEach(function(cat) {
 var lm = window.VOLUME_LANDMARKS[cat];
 var label = lm ? lm.label : cat;
 var sets = _sessionSetCount[cat];
 var pct = _maxSets > 0 ? Math.round(sets / _maxSets * 100) : 0;
 var row = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:5px'});
 row.appendChild(h('div', {style: 'width:75px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);flex-shrink:0'}, label));
 var barWrap = h('div', {style: 'flex:1;height:6px;background:var(--border,#E8E6DF);border-radius:2px;overflow:hidden'});
 barWrap.appendChild(h('div', {style: 'height:6px;width:' + pct + '%;background:#1A4A1A;border-radius:2px;transition:width 0.4s ease'}));
 row.appendChild(barWrap);
 row.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);flex-shrink:0;min-width:40px;text-align:right'}, sets + ' s.'));
 _muscleSection.appendChild(row);
 });
 p.appendChild(_muscleSection);
 }
 }

 // ─── STRENGTH GRADE ───
 if (window.renderStrengthGrade) renderStrengthGrade(p);

 // ─── GROSSESSE — Adaptations sport ───
 if (S.pregnant && S.sex === 'femme') {
 var triSport = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
 if (triSport && triSport.trimester) {
 var triSportColor = '#5A1010';
 var intensitySport = Math.round((triSport.trimester.intensityFactor || 0.5) * 100);

 var pregSportCard = h('div', {style: 'border:2px solid ' + triSportColor + ';padding:16px;background:rgba(192,57,43,0.04);margin-bottom:16px'});
 pregSportCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;color:' + triSportColor + ';margin-bottom:8px'}, '\uD83E\uDD30 Programme adapt\u00e9 grossesse \u2014 ' + (triSport.trimester.name || '')));
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:10px'}, 'Intensit\u00e9 : ' + intensitySport + '% \u2014 \u00c9coutez votre corps'));

 // Sport tips
 if (triSport.trimester.sportTips) triSport.trimester.sportTips.forEach(function(tip) {
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
 });

 // Forbidden exercises
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + triSportColor + ';margin:10px 0 6px'}, 'Exercices interdits ce trimestre'));
 if (triSport.trimester.forbiddenExercises) triSport.trimester.forbiddenExercises.forEach(function(ex) {
 pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + triSportColor + ';margin-bottom:2px;padding-left:8px'}, '\u2716 ' + ex));
 });

 // Emergency stop warning
 var pregStopWarn = h('div', {style: 'margin-top:10px;padding:8px 12px;background:rgba(192,57,43,0.08);border-radius:2px'});
 pregStopWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + triSportColor + ';font-weight:bold'}, '\u26A0 Arr\u00eatez imm\u00e9diatement si : saignements, vertiges, contractions, douleurs, essoufflement excessif'));
 pregSportCard.appendChild(pregStopWarn);

 p.appendChild(pregSportCard);
 }
 }

 // Cycle menstruel — Recommandation sport
 var cycleInfo = null;
 if (S.sex === 'femme' && S.cycleTracking) {
 cycleInfo = window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : null;
 if (cycleInfo) {
 var phaseColors = {menstruation: '#5A1010', follicular: '#6A4A1A', ovulation: '#1A4A1A', luteal: '#6A4A1A'};
 var phaseColor = phaseColors[cycleInfo.phase.id] || '#6A4A1A';
 var intensity = Math.round(cycleInfo.phase.intensityFactor * 100);

 var cycSportCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:14px 16px;background:var(--ivory2);margin-bottom:16px'});
 cycSportCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, cycleInfo.phase.icon + ' ' + cycleInfo.phase.name));
 cycSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, 'Intensit\u00e9 recommand\u00e9e : ' + intensity + '%'));

 // Sport tips
 (cycleInfo.phase.sportTips || []).forEach(function(tip) {
 cycSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
 });

 // Warning or encouragement
 if (cycleInfo.phase.intensityFactor < 0.8) {
 var warnDiv = h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(192,57,43,0.06);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5A1010;border-radius:2px'});
 warnDiv.textContent = '\u26A0 Phase de r\u00e9cup\u00e9ration \u2014 adaptez votre effort';
 cycSportCard.appendChild(warnDiv);
 } else if (cycleInfo.phase.intensityFactor > 1.0) {
 var greenDiv = h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(39,174,96,0.06);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;border-radius:2px'});
 greenDiv.textContent = '\u2705 Phase optimale \u2014 poussez vos limites !';
 cycSportCard.appendChild(greenDiv);
 }

 p.appendChild(cycSportCard);
 }
 }

 // Supplement tips
 if (S.creatine) {
 var creatSupp = null;
 if (window.SUPPLEMENTS_DB) {
 for (var si = 0; si < window.SUPPLEMENTS_DB.length; si++) {
 if (window.SUPPLEMENTS_DB[si].id === 'creatine') { creatSupp = window.SUPPLEMENTS_DB[si]; break; }
 }
 }
 var creatDose = S.creatineDose || (creatSupp ? creatSupp.dosageCalc(S).dose : 5);
 var creatTip = h('div', {'class': 'whey-tip', style: 'border-left-color:var(--blue,#1A3A6A);background:var(--bluebg,rgba(26,58,106,0.04));margin-bottom:8px'});
 creatTip.appendChild(h('strong', {}, '\uD83D\uDC8A Cr\u00e9atine \u2014 '));
 creatTip.appendChild(h('span', {}, creatDose + 'g apr\u00e8s l\'entra\u00eenement avec glucides pour absorption optimale'));
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
 cafTip.appendChild(h('strong', {}, '\u2615 Caf\u00e9ine \u2014 '));
 cafTip.appendChild(h('span', {}, cafDose + 'mg 30-60 min avant la s\u00e9ance'));
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

 // ─── PRO PROGRAMS ACCESS (advanced/pro only) ───
 if ((S.sportLevel === 'advanced' || S.sportLevel === 'pro') && window.SFC_PROGRAMS) {
  // Filter out _dedied groups (use .variations structure, shown in renderDedicatedPrograms separately)
  var _sfcKeys = Object.keys(window.SFC_PROGRAMS).filter(function(k) {
   var _p = window.SFC_PROGRAMS[k];
   return _p && !_p.variations;
  });
  if (_sfcKeys.length > 0) {
   var _sfcSection = h('div', {style: 'margin-bottom:20px'});
   _sfcSection.appendChild(h('div', {'class':'section-label'}, 'Programmes scientifiques (niveau avancé)'));
   _sfcSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px;line-height:1.5'}, 'Programmes périodisés basés sur la recherche (Schoenfeld, RP Hypertrophy). Sélectionnez un groupe musculaire pour une séance dédiée.'));

   var _sfcGrid = h('div', {style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px'});
   _sfcKeys.forEach(function(key) {
    var prog = window.SFC_PROGRAMS[key];
    if (!prog) return;
    var _isActive = S._activeSfcProgram === key;
    var _sfcBtn = h('button', {
     style: 'padding:10px 8px;border:1px solid ' + (_isActive ? 'var(--accent,#1A4A1A)' : 'var(--border,#E8E6DF)') + ';background:' + (_isActive ? 'rgba(26,74,26,0.06)' : 'transparent') + ';border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;color:var(--black,#1A1A18);text-align:center',
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
    var _phLabels = {masse: 'Masse', seche: 'S\u00e8che', force: 'Force'};
    var _phActive = _effectivePhase === ph;
    var _phBtn = h('button', {
     style: 'flex:1;min-height:44px;padding:8px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;' + (_phActive ? 'background:var(--accent,#1A4A1A);color:white;border:1px solid var(--accent,#1A4A1A)' : 'background:transparent;color:var(--black,#1A1A18);border:1px solid var(--border,#E8E6DF)'),
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
    if (Array.isArray(_phaseExos) && _phaseExos.length > 0 && S.sportEquipment && S.sportEquipment !== 'gym') {
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
     _sfcSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, _progDisplayName + ' \u2014 ' + _phaseKey));

     // C5: Equipment limited badge
     if (_sfcEqLimitedBadge) {
      _sfcSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6A4A1A;background:rgba(106,74,26,0.08);border:1px solid rgba(106,74,26,0.2);padding:6px 10px;border-radius:2px;margin-bottom:10px'}, '\u26a0\ufe0f \u00c9quipement limit\u00e9 \u2014 ces exercices peuvent ne pas correspondre \u00e0 votre mat\u00e9riel'));
     }

     // Warmup banner
     if (_phaseObj && _phaseObj.warmup) {
      var _warmupEl = h('div', {style: 'display:flex;align-items:flex-start;gap:8px;background:var(--greenbg,rgba(26,74,26,.06));border-left:3px solid var(--green,#1A4A1A);padding:10px 14px;margin-bottom:12px;border-radius:0 2px 2px 0'});
      _warmupEl.appendChild(h('span', {style: 'font-size:14px;flex-shrink:0'}, '\uD83D\uDD25'));
      var _warmupRight = h('div', {});
      _warmupRight.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-bottom:3px'}, '\u00c9chauffement'));
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
       var _typeCol = exo.type === 'compound' ? '#1A4A1A' : exo.type === 'superset' ? '#5A1010' : '#1A3A6A';
       var _typeBadge = h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:2px 6px;background:' + _typeBg + ';color:' + _typeCol + ';border-radius:2px;flex-shrink:0;margin-left:6px'});
       if (exo.type === 'compound') {
        _typeBadge.appendChild(termTooltip('Compound', 'Exercice poly-articulaire qui recrute plusieurs groupes musculaires simultanément'));
       } else if (exo.type === 'isolation') {
        _typeBadge.appendChild(termTooltip('Isolation', 'Exercice mono-articulaire ciblant un seul muscle'));
       } else {
        _typeBadge.appendChild(h('span', {}, exo.type));
       }
       _exTop.appendChild(_typeBadge);
      }
      _exCard.appendChild(_exTop);
      // Sets × reps · rest — muscle target
      var _exMeta = (exo.sets || '') + ' s\u00e9ries \u00d7 ' + (exo.reps || '') + ' reps \u00b7 Repos ' + (exo.rest || '90s');
      if (exo.muscle) _exMeta += ' \u2014 ' + exo.muscle;
      _exCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, _exMeta));
      // Equipment tag
      if (exo.equipment) {
       _exCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:6px'}, '\uD83C\uDFCB ' + exo.equipment));
      }
      // Technique (full text, not truncated)
      if (exo.technique) {
       _exCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey);margin-top:2px;line-height:1.6;border-top:1px solid var(--border);padding-top:8px'}, exo.technique));
      }
      // RIR target badge
      if (exo.rirTarget !== undefined) {
       var _rirColors = {0:'#5A1010', 1:'#5A1010', 2:'#6A4A1A', 3:'#6A4A1A', 4:'#1A4A1A'};
       var _rirC = _rirColors[exo.rirTarget] || '#6A4A1A';
       var _rirBadge = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + _rirC + ';margin-top:6px;padding:3px 8px;background:rgba(106,74,26,0.06);display:inline-block;border-radius:2px'});
       _rirBadge.appendChild(termTooltip('RIR', 'Reps In Reserve — nombre de reps que vous pourriez encore faire avant l\'échec musculaire'));
       _rirBadge.appendChild(h('span', {}, '\u00a0cible\u00a0: ' + exo.rirTarget + (exo.rirTarget === 0 ? ' \u2014 \u00e9chec' : exo.rirTarget === 1 ? ' \u2014 quasi-\u00e9chec' : exo.rirTarget === 2 ? ' \u2014 effort intense' : exo.rirTarget === 3 ? ' \u2014 mod\u00e9r\u00e9' : ' \u2014 l\u00e9ger')));
       _exCard.appendChild(_rirBadge);
      }
      _sfcSection.appendChild(_exCard);
     });
    }
   }

   p.appendChild(_sfcSection);
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
   {id:'bro_4', label:'Bro Split 4j', dayLabels:['Pecs/Triceps','Dos/Biceps','Épaules','Jambes']}
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
  _splitSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:6px'}, 'Split d\'entraînement'));
  var _splitBtns = h('div', {style: 'display:flex;flex-wrap:wrap;gap:6px'});
  _splitOpts.forEach(function(opt) {
   var _isActive = S._splitChoice === opt.id;
   var _btn = h('button', {
    style: 'height:36px;padding:0 12px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;cursor:pointer;border:1px solid ' + (_isActive ? 'var(--accent,#1A4A1A)' : 'var(--border,#E8E6DF)') + ';background:' + (_isActive ? 'rgba(26,74,26,0.08)' : 'transparent') + ';color:' + (_isActive ? 'var(--accent,#1A4A1A)' : 'var(--black,#1A1A18)') + ';font-weight:' + (_isActive ? '600' : '400'),
    onclick: (function(_id) { return function() { S._splitChoice = _id; window.render(); }; })(opt.id)
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
 var _goalNames2 = (S.sportGoals || []).map(function(gid){
  var g = (window.SPORT_GOALS || []).find(function(x){ return x.id === gid; });
  return g ? g.name : '';
 }).filter(function(n){ return n; }).join(' + ');

 var _splitLabel = '';
 if (S._splitChoice && _splitOpts) {
  var _chosenSplit = _splitOpts.filter(function(o){ return o.id === S._splitChoice; })[0];
  if (_chosenSplit) _splitLabel = _chosenSplit.label;
 } else if (_numDays && window.WEEKLY_SPLITS && window.WEEKLY_SPLITS[_numDays]) {
  _splitLabel = window.WEEKLY_SPLITS[_numDays].name || '';
 }

 // Si l'utilisateur a explicitement cliqué une phase SFC, la priorité va à cette phase (pas à l'objectif sportif)
 var _phaseLabelsB = {masse: 'Masse', seche: 'S\u00e8che', force: 'Force'};
 var _goalDisplay = S._sfcPhase ? _phaseLabelsB[S._sfcPhase] : _goalNames2;
 var _bannerText = _splitLabel
  ? 'Programme\u00a0: ' + _splitLabel + (_goalDisplay ? ' \u2014 ' + _goalDisplay : '')
  : (_goalDisplay ? 'Programme\u00a0: ' + _goalDisplay : '');

 if (_bannerText) {
  p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;font-family:"Helvetica Neue",Arial,sans-serif'}, _bannerText));
 }

 // Day tabs — rename according to split choice if available
 var _currentSplitOpt = null;
 if (S._splitChoice && _splitOpts) {
  _currentSplitOpt = _splitOpts.filter(function(o){ return o.id === S._splitChoice; })[0] || null;
 }

 var tabs = h('div', {'class': 'day-tabs'});
 S.sportProgram.forEach(function(day, i) {
  var _tabLabel = (_currentSplitOpt && _currentSplitOpt.dayLabels && _currentSplitOpt.dayLabels[i])
   ? _currentSplitOpt.dayLabels[i]
   : day.name;
  tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedSportDay === i ? ' active' : ''), onclick: function(){ S.selectedSportDay = i; window.render(); }}, _tabLabel));
 });
 p.appendChild(tabs);

 // Current day — bounds check
 if (typeof S.selectedSportDay !== 'number' || S.selectedSportDay < 0 || S.selectedSportDay >= S.sportProgram.length) S.selectedSportDay = 0;
 var day = S.sportProgram[S.selectedSportDay];
 if (day) {
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin:16px 0 12px'}, day.focus));

 // ─── SESSION BRIEF CARD (beginners only) ───
 if (S.sportLevel === 'beginner') {
  var MUSCLE_BRIEFS = {
   'poitrine':    { why: 'les pectoraux = push de base, force des bras et épaules', tip: 'Sentez la contraction à chaque rep — qualité > quantité' },
   'pectoral':    { why: 'les pectoraux = push de base, force des bras et épaules', tip: 'Sentez la contraction à chaque rep — qualité > quantité' },
   'dos':         { why: 'le dos soutient votre colonne et améliore votre posture', tip: 'Tirez avec les coudes, pas avec les mains' },
   'dorsaux':     { why: 'le dos soutient votre colonne et améliore votre posture', tip: 'Tirez avec les coudes, pas avec les mains' },
   'épaule':      { why: 'les épaules stabilisent tous vos mouvements du haut du corps', tip: 'Commencez léger — les épaules sont fragiles' },
   'jambe':       { why: 'les jambes = plus gros muscles du corps, brûlent le plus de calories', tip: 'Genou dans l\'axe du pied à chaque rep' },
   'quadri':      { why: 'les quadriceps propulsent chaque pas, saut et accélération', tip: 'Descendez lentement (3s) pour plus d\'efficacité' },
   'fessier':     { why: 'les fessiers sont le moteur de la puissance et protègent le dos', tip: 'Contractez fort en haut de chaque mouvement' },
   'bras':        { why: 'biceps + triceps = force de traction et de poussée', tip: 'Contrôlez la descente — c\'est là que le muscle pousse le plus' },
   'biceps':      { why: 'les biceps tirent et fléchissent — essentiels pour le dos et les tractions', tip: 'Contrôlez la descente — c\'est là que le muscle pousse le plus' },
   'triceps':     { why: 'les triceps représentent 2/3 du volume du bras', tip: 'Extension complète à chaque rep' },
   'abdo':        { why: 'les abdominaux stabilisent chaque mouvement et protègent votre dos', tip: 'Gainage > crunches — tenez la position' },
   'abdominaux':  { why: 'les abdominaux stabilisent chaque mouvement et protègent votre dos', tip: 'Gainage > crunches — tenez la position' },
   'corps entier':{ why: 'séance complète = maximum de calories brûlées et de progrès', tip: 'Récupérez bien — vous avez sollicité tous les muscles' }
  };
  var focusLower = (day.focus || '').toLowerCase();
  var matchedBrief = null;
  var briefKeys = Object.keys(MUSCLE_BRIEFS);
  for (var bk = 0; bk < briefKeys.length; bk++) {
   if (focusLower.indexOf(briefKeys[bk]) !== -1) { matchedBrief = MUSCLE_BRIEFS[briefKeys[bk]]; break; }
  }
  var briefCard = h('div', {style: 'background:rgba(26,74,26,0.04);border-left:3px solid #1A4A1A;padding:14px 16px;margin-bottom:16px;border-radius:0 2px 2px 0'});
  briefCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#1A4A1A;margin-bottom:6px'}, 'SÉANCE DU JOUR'));
  briefCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;font-style:italic;margin-bottom:8px;color:var(--black,#1A1A18)'}, day.focus));
  if (matchedBrief) {
   briefCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.5;margin-bottom:8px'}, '💪 ' + matchedBrief.why));
   briefCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey,#6B6B65)'}, '💡 ' + matchedBrief.tip));
  } else {
   briefCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.5;margin-bottom:8px'}, '💪 Aujourd\'hui vous travaillez votre ' + day.focus));
   briefCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-style:italic;color:var(--grey,#6B6B65)'}, '💡 Chaque rep compte — concentrez-vous sur la technique, pas sur le poids'));
  }
  p.appendChild(briefCard);
 }

 // ─── CTA SÉANCE — visible en haut, avant de scroller les exercices ───
 var _ctaToday = new Date().toISOString().slice(0, 10);
 var _ctaTodayKey = S.selectedSportDay + '_' + _ctaToday;
 var _ctaDone = S.sessionHistory && S.sessionHistory[_ctaTodayKey];
 var _ctaCompleting = (S.sessionCompleting === S.selectedSportDay);
 if (_ctaDone) {
   var _ctaDoneBadge = h('div', {style: 'border:1px solid #1A4A1A;background:rgba(26,74,26,0.06);padding:10px 14px;margin-bottom:14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;display:flex;align-items:center;gap:8px;'});
   _ctaDoneBadge.appendChild(h('span', {}, '\u2714'));
   _ctaDoneBadge.appendChild(h('span', {}, 'S\u00e9ance valid\u00e9e \u2014 ' + _ctaDone.duration + '\u00a0min \u00b7 ' + _ctaDone.kcalTotal + '\u00a0kcal'));
   p.appendChild(_ctaDoneBadge);
 } else if (!_ctaCompleting) {
   var _ctaBtn = h('button', {
     style: 'display:block;width:100%;padding:14px;background:var(--black,#0A0A09);color:#fff;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;margin-bottom:16px;',
     onclick: function() {
       S.sessionCompleting = S.selectedSportDay;
       S._sessionDuration = null;
       window.render();
       // Scroll vers le bas pour afficher le panneau de complétion
       setTimeout(function() { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 80);
     }
   }, '\u2713 S\u00e9ance termin\u00e9e');
   p.appendChild(_ctaBtn);
 }

 // ─── INDICATEUR SURCHARGE PROGRESSIVE ───
 (function() {
  var weekNum = S.muscuWeek || 1;
  var progressRate = S.sportLevel === 'beginner' ? 0.025 : 0.05;
  var progressPct = Math.round(progressRate * Math.min(weekNum - 1, 12) * 100);
  if (weekNum > 1) {
   var _progInd = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);letter-spacing:0.5px;margin-bottom:12px;display:flex;align-items:center;gap:8px'});
   _progInd.appendChild(h('span', {style: 'font-weight:600;color:var(--black,#1A1A18)'}, 'Semaine ' + weekNum));
   if (progressPct > 0) {
    _progInd.appendChild(h('span', {style: 'color:#1A4A1A;font-weight:600'}, '· Objectif progression +' + progressPct + '%'));
   }
   p.appendChild(_progInd);
  }
 })();

 // ─── ÉCHAUFFEMENT ───
 (function() {
  var wu = day.warmup || {
   duration: 8,
   exercises: [
    { name: 'Cardio léger (vélo/tapis)', duration: '5 min', intensity: 'Faible' },
    { name: 'Mobilité articulaire', duration: '3 min', notes: 'Cercles épaules, hanches, chevilles' }
   ]
  };
  var wuCard = h('div', {style: 'background:var(--greenbg,rgba(26,74,26,.06));border:1px solid rgba(26,74,26,0.2);border-left:3px solid var(--green,#1A4A1A);padding:12px 14px;margin-bottom:12px;border-radius:0 2px 2px 0'});
  wuCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--green,#1A4A1A);font-weight:600;margin-bottom:8px'}, 'ÉCHAUFFEMENT · ' + wu.duration + ' min'));
  (wu.exercises || []).forEach(function(ex) {
   var row = h('div', {style: 'display:flex;align-items:flex-start;gap:8px;margin-bottom:4px'});
   row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#1A1A18);font-weight:500;flex-shrink:0;min-width:180px'}, ex.name + ' — ' + ex.duration));
   var detail = (ex.intensity || '') + (ex.notes ? (ex.intensity ? ' · ' : '') + ex.notes : '');
   if (detail) row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);line-height:1.4'}, detail));
   wuCard.appendChild(row);
  });
  p.appendChild(wuCard);
 })();

 var _totalExercises = (day.exercises || []).length;
 (day.exercises || []).forEach(function(ex, exIdx) {
 var card = h('div', {'class': 'exercise-card', onclick: function(){ S.sportModalExercise = ex; window.render(); }});

 // ── PROGRESS INDICATOR: "Exercice X/N" ──
 var _exProgressRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:2px'});
 _exProgressRow.appendChild(h('div', {'class': 'exercise-muscle'}, ex.m));
 _exProgressRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);letter-spacing:0.5px;white-space:nowrap'}, 'Ex. ' + (exIdx + 1) + '\u00a0/\u00a0' + _totalExercises));
 card.appendChild(_exProgressRow);

 var _exNameEl = h('div', {'class': 'exercise-name'}, ex.n);
 // FST-7 badge: highlight exercises that use the Fascial Stretch Training 7-set technique
 if (ex.is_fst7) {
 var fst7Badge = h('span', {
 style: 'display:inline-block;margin-left:8px;padding:2px 6px;background:#5A1010;color:#fff;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;border-radius:2px;vertical-align:middle'
 }, 'FST-7');
 _exNameEl.appendChild(fst7Badge);
 card.style.borderLeft = '3px solid #5A1010';
 }
 // ─── DELTA PROGRESSION ───
 var _progHistory = S.muscuProgressionHistory && S.muscuProgressionHistory[ex.n];
 if (_progHistory && _progHistory.length >= 2) {
   var _last = _progHistory[_progHistory.length - 1];
   var _prev = _progHistory[_progHistory.length - 2];
   var _deltaW = Math.round((_last.weight - _prev.weight) * 2) / 2;
   if (_deltaW !== 0) {
     var _deltaEl = h('span', {
       style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:600;margin-left:6px;' + (_deltaW > 0 ? 'color:#1A4A1A;' : 'color:#5A1010;')
     }, (_deltaW > 0 ? '↑' : '↓') + ' ' + Math.abs(_deltaW) + ' kg');
     _exNameEl.appendChild(_deltaEl);
   }
 }
 card.appendChild(_exNameEl);
 card.appendChild(h('div', {'class': 'exercise-sets'}, (ex.sets || '4x10') + ' \u2014 Repos ' + (ex.rest || '90s')));
 card.appendChild(h('div', {'class': 'exercise-detail'}, ex.eq));

 // ─── EXERCISE DESCRIPTION FOR BEGINNERS ───
 if ((S.sportLevel === 'beginner' || !S.sportLevel) && ex.desc) {
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5;margin-top:4px;font-style:italic'}, ex.desc));
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
 }, '\u23F1 Repos ' + _restLabel);
 card.appendChild(restBtn);
 })(ex);

 // Cycle intensity badge
 if (S.sex === 'femme' && S.cycleTracking && cycleInfo) {
 var intPct = Math.round(cycleInfo.phase.intensityFactor * 100);
 var intColor = intPct >= 100 ? '#1A4A1A' : intPct >= 80 ? '#6A4A1A' : '#5A1010';
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:' + intColor + ';margin-top:4px'}, 'Intensit\u00e9 cycle : ' + intPct + '%'));
 }

 // Video link — auto-generate URL if not preset in exercise data
 var _videoUrl = ex.video || (window.getExerciseVideoUrl ? window.getExerciseVideoUrl(ex.n) : null);
 if (_videoUrl) {
 var vlink = h('a', {'class': 'exercise-video', href: _videoUrl, target: '_blank', rel: 'noopener', onclick: function(e){
 e.stopPropagation();
 window.BLACKBOX && window.BLACKBOX.log('video_clicked', {exercise: ex.n});
 var count = window.GAMIFICATION ? GAMIFICATION.incrementCounter('exercises_viewed') : 0;
 if (count >= 20 && window.GAMIFICATION) GAMIFICATION.unlockBadge('exercises_20');
 }}, '\u25b6 Voir la technique');
 card.appendChild(vlink);
 }

 // ─── Weight/Load tracking ───
 var eqType = 'barre';
 var eqLower = (ex.eq || '').toLowerCase();
 if (/halt[eè]re|dumbbell|db/i.test(eqLower)) eqType = 'haltere';
 else if (/machine|poulie|cable|presse/i.test(eqLower)) eqType = 'machine';
 else if (/kettle|kb/i.test(eqLower)) eqType = 'kb';
 else if (/^(poids du corps|corps seul|bodyweight|body\s?weight|aucun|none)$/.test(eqLower)) eqType = 'bodyweight';
 else if (/barre|barbell/i.test(eqLower)) eqType = 'barre';

 // ─── AI-suggested weight from strength profile (skip for bodyweight) ───
 if (eqType !== 'bodyweight') {
 var _setParts = ex.sets ? ex.sets.split('\u00d7') : [];
 var suggestedReps = _setParts.length > 1 ? parseInt(_setParts[1]) : null;
 var suggested = window.getMusculationWeight ? window.getMusculationWeight(ex.n, ex.sets, suggestedReps) : null;
 // Surcharge progressive : appliquer le multiplicateur si charge de base connue
 var _savedW = S.musculationWeights[ex.n];
 var _baseW = (_savedW && _savedW.weight) ? _savedW.weight : suggested;
 if (_baseW && _baseW > 0) {
  var _weekNumPO = S.muscuWeek || 1;
  var _progressRatePO = S.sportLevel === 'beginner' ? 0.025 : 0.05;
  var _loadMultiplier = 1 + (_progressRatePO * Math.min(_weekNumPO - 1, 12));
  var _progressiveW = Math.round(_baseW * _loadMultiplier * 2) / 2;
  if (_weekNumPO > 1 && _progressiveW !== _baseW) {
   var _sugBanner = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 12px;background:var(--greenbg,rgba(26,74,26,.06));border:1px solid rgba(26,74,26,0.25);border-radius:2px'});
   var _sugLeft = h('div', {});
   _sugLeft.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-bottom:2px'}, 'Charge progressive (sem. ' + _weekNumPO + ')'));
   _sugLeft.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:bold;color:var(--green,#1A4A1A);line-height:1'}, window.UNITS ? window.UNITS.displayWeight(_progressiveW) : _progressiveW + '\u00a0kg'));
   _sugBanner.appendChild(_sugLeft);
   _sugBanner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:22px;line-height:1'}, '\uD83D\uDCC8'));
   card.appendChild(_sugBanner);
  } else if (suggested && suggested > 0) {
   var _sugBanner2 = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 12px;background:var(--greenbg,rgba(26,74,26,.06));border:1px solid rgba(26,74,26,0.25);border-radius:2px'});
   var _sugLeft2 = h('div', {});
   _sugLeft2.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-bottom:2px'}, 'Charge recommand\u00e9e'));
   _sugLeft2.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:bold;color:var(--green,#1A4A1A);line-height:1'}, window.UNITS ? window.UNITS.displayWeight(suggested) : suggested + '\u00a0kg'));
   _sugBanner2.appendChild(_sugLeft2);
   _sugBanner2.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:22px;line-height:1'}, '\uD83D\uDCA1'));
   card.appendChild(_sugBanner2);
  }
 } else if (suggested && suggested > 0) {
  var _sugBannerBasic = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 12px;background:var(--greenbg,rgba(26,74,26,.06));border:1px solid rgba(26,74,26,0.25);border-radius:2px'});
  var _sugLeftBasic = h('div', {});
  _sugLeftBasic.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-bottom:2px'}, 'Charge recommand\u00e9e'));
  _sugLeftBasic.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-weight:bold;color:var(--green,#1A4A1A);line-height:1'}, window.UNITS ? window.UNITS.displayWeight(suggested) : suggested + '\u00a0kg'));
  _sugBannerBasic.appendChild(_sugLeftBasic);
  _sugBannerBasic.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:22px;line-height:1'}, '\uD83D\uDCA1'));
  card.appendChild(_sugBannerBasic);
 }
 }

 var savedWeight = S.musculationWeights[ex.n] || {};
 var currentWeight = savedWeight.weight || '';

 if (eqType !== 'bodyweight') {
 var weightRow = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--ivory3,#EEEDE8)'});
 var typeLabel = eqType === 'barre' ? '\uD83C\uDFCB\uFE0F Barre' : eqType === 'haltere' ? '\uD83D\uDCAA Halt\u00e8re (\u00d71)' : eqType === 'machine' ? '\u2699\uFE0F Machine' : '\uD83D\uDD14 KB';
 weightRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);min-width:80px'}, typeLabel));

 var wInput = h('input', {
 type: 'number', step: '0.5', min: '0', max: '500',
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
 weightRow.appendChild(wInput);
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
 plateDiv.innerHTML = window.renderPlateCalculator(currentWeight, 20);
 card.appendChild(plateDiv);
 }
 } else {
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-top:6px;font-style:italic'}, 'Poids de corps'));
 }

 // ─── TRACKER SÉRIES : recommandations + saisie réelle ───
 (function(exRef, isBodyweight, _exIdx, _dayExercises) {
 var setsMatch = (exRef.sets || '').match(/^(\d+)\s*[x\u00d7]\s*(\d+)(?:-(\d+))?/);
 var numSets = setsMatch ? parseInt(setsMatch[1]) : 3;
 var minReps = setsMatch ? parseInt(setsMatch[2]) : 10;
 var maxReps = setsMatch && setsMatch[3] ? parseInt(setsMatch[3]) : minReps;

 var exPhase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(S.muscuWeek || 1) : null;
 var sugWeight = getSuggestedWeight(exRef.n, minReps, exPhase) || 0;
 var progressiveWeight = getProgressiveWeight(exRef.n, sugWeight, S.muscuWeek || 1);

 // Per-set scheme from getSetScheme (ascending/descending loads)
 var _setScheme = null;
 if (window.getSetScheme && !isBodyweight) {
 // FIX: MUSCU_PHASES uses .label not .name; also map phase.id for accuracy
 var _phaseName = exPhase ? (exPhase.id || exPhase.label || '').toLowerCase() : 'hypertrophie';
 var _cycleKey = /intensification/.test(_phaseName) ? 'force' : /decharge|deload/.test(_phaseName) ? 'deload' : /adaptation/.test(_phaseName) ? 'volume' : 'hypertrophie';
 _setScheme = window.getSetScheme(exRef.n, S.weight || 70, S.sex || 'homme', S.sportLevel || 'intermediate', _cycleKey, numSets);
 }

 var today = new Date().toISOString().slice(0, 10);
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
 var gridCols = isAdvancedRIR ? '40px 1fr 50px 1fr 44px' : '40px 1fr 60px 1fr';

 // RIR target display for advanced users
 // MUSCU_PHASES doesn't carry rirTarget — use MESOCYCLE_WEEKS (4-week cycle) instead
 if (isAdvancedRIR) {
  var _mesoWeeks = window.MESOCYCLE_WEEKS;
  var _mesoIdx = _mesoWeeks ? ((( S.muscuWeek || 1) - 1) % _mesoWeeks.length) : -1;
  var _mesoEntry = (_mesoWeeks && _mesoIdx >= 0) ? _mesoWeeks[_mesoIdx] : null;
  var _rirTarget = _mesoEntry ? _mesoEntry.rirTarget : 2;
  var _rirLabel = _rirTarget <= 1 ? 'quasi-échec' : _rirTarget === 2 ? 'effort intense' : _rirTarget === 3 ? 'modéré' : 'léger';
  var _rirTargetDisplay = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#6A4A1A;margin-bottom:6px;padding:4px 8px;background:rgba(106,74,26,0.06);border-radius:2px'});
  _rirTargetDisplay.appendChild(termTooltip('RIR', 'Reps In Reserve — nombre de reps que vous pourriez encore faire avant l\'échec musculaire'));
  _rirTargetDisplay.appendChild(h('span', {}, ' cible cette semaine : ' + _rirTarget + ' — ' + _rirLabel + (_mesoEntry ? ' (' + _mesoEntry.name + ')' : '')));
  card.appendChild(_rirTargetDisplay);
 }

 // Header with set progress counter
 var _doneCount = setData.filter(function(s){ return s.validated === true; }).length;
 var setHeaderWrap = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;background:var(--surface,var(--ivory2));padding:6px 8px;border-bottom:1px solid var(--border)'});
 var setHeader = h('div', {style: 'display:grid;grid-template-columns:' + gridCols + ';flex:1;font-size:11px;font-weight:700;color:var(--grey);text-transform:uppercase;letter-spacing:0.5px'});
 setHeader.appendChild(h('div', {}, '#'));
 setHeader.appendChild(h('div', {}, 'Conseill\u00e9'));
 setHeader.appendChild(h('div', {style:'text-align:center'}, '\u0394'));
 setHeader.appendChild(h('div', {}, 'R\u00e9alis\u00e9'));
 if (isAdvancedRIR) setHeader.appendChild(h('div', {style:'text-align:center'}, 'RIR'));
 setHeaderWrap.appendChild(setHeader);
 var _serieProgressEl = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;white-space:nowrap;margin-left:8px;padding:2px 6px;border-radius:2px;' + (_doneCount === numSets ? 'background:#1A4A1A;color:#fff' : 'background:var(--border);color:var(--grey)')}, _doneCount + '\u00a0/\u00a0' + numSets + ' s\u00e9ries');
 setHeaderWrap.appendChild(_serieProgressEl);
 setTable.appendChild(setHeaderWrap);

 // Rows
 setData.forEach(function(setRow, si3) {
 var row = h('div', {'class': 'set-row', style: 'display:grid;grid-template-columns:' + gridCols + ';padding:6px 8px;border-top:1px solid var(--border);align-items:center'});

 row.appendChild(h('div', {style: 'font-size:13px;font-weight:700;color:var(--text)'}, String(setRow.set)));

 var conseilleEl = h('div', {style: 'font-size:13px;color:var(--grey)'});
 var _dispW = (window.UNITS && window.UNITS.displayWeight) ? window.UNITS.displayWeight(setRow.targetWeight) : (setRow.targetWeight + ' kg');
 var conseilleStr = (setRow.targetWeight > 0 && !isBodyweight)
 ? (_dispW + ' \u00d7 ' + setRow.targetReps)
 : (setRow.targetReps + ' reps');
 conseilleEl.appendChild(h('span', {}, conseilleStr));
 if (setRow.pctOf1RM) {
 conseilleEl.appendChild(h('span', {style:'font-size:9px;color:var(--blue,#1A3C5E);margin-left:4px'}, setRow.pctOf1RM + '%1RM'));
 }
 row.appendChild(conseilleEl);

 // Delta column
 var deltaCell = h('div', {style:'text-align:center'});
 if (setRow.deltaFromPrev !== null && setRow.deltaFromPrev !== undefined && setRow.deltaFromPrev !== 0) {
 var _dcls = setRow.deltaFromPrev > 0 ? 'delta-up' : 'delta-down';
 var _darr = setRow.deltaFromPrev > 0 ? '\u25B2' : '\u25BC';
 deltaCell.appendChild(h('span', {'class': 'set-delta ' + _dcls}, _darr + Math.abs(setRow.deltaFromPrev) + '%'));
 } else if (si3 > 0) {
 deltaCell.appendChild(h('span', {'class': 'set-delta delta-flat'}, '\u2192'));
 }
 row.appendChild(deltaCell);

 var inputZone = h('div', {style: 'display:flex;align-items:center;gap:4px', onclick: function(e){ e.stopPropagation(); }});

 if (!isBodyweight) {
 var weightPlaceholder = progressiveWeight > 0 ? String(progressiveWeight) : 'kg';
 var weightInput = h('input', {
 type: 'number', min: '0', max: '500', step: '2.5',
 inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Charge (kg)',
 placeholder: weightPlaceholder,
 value: setRow.actualWeight !== null ? String(setRow.actualWeight) : '',
 style: 'width:52px;padding:4px;border:1px solid var(--border);border-radius:2px;font-size:16px;text-align:center;background:var(--bg,var(--ivory))',
 oninput: (function(sr, _valBtnRef){ return function(e) {
 var v = parseFloat(e.target.value);
 sr.actualWeight = isNaN(v) ? null : v;
 saveMuscuSessionLog();
 // Réactiver le bouton validation en temps réel
 var _btn = e.target.closest('.set-row') ? e.target.closest('.set-row').querySelector('.set-validate-btn') : null;
 if (_btn) { var _ok = sr.actualReps !== null && sr.actualWeight !== null; _btn.disabled = !_ok; _btn.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow)
 });
 inputZone.appendChild(weightInput);
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
 }, _isLeste ? 'Lest\u00e9s \u2713' : '+ Lest\u00e9s');
 inputZone.appendChild(lesteBtn);
 var pcLabel;
 if (_isLeste) {
 pcLabel = h('input', {
 type: 'number', min: '0', max: '200', step: '0.5',
 inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Lest (kg)',
 placeholder: 'kg',
 value: setRow.actualWeight !== null && setRow.actualWeight > 0 ? String(setRow.actualWeight) : '',
 style: 'width:44px;padding:4px;border:1px solid var(--border);border-radius:2px;font-size:16px;text-align:center;background:var(--bg,var(--ivory))',
 oninput: (function(sr){ return function(e) {
 var v = parseFloat(e.target.value);
 sr.actualWeight = isNaN(v) ? null : v;
 saveMuscuSessionLog();
 var _btn = e.target.closest('.set-row') ? e.target.closest('.set-row').querySelector('.set-validate-btn') : null;
 if (_btn) { var _ok = sr.actualReps !== null && sr.actualWeight !== null; _btn.disabled = !_ok; _btn.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow)
 });
 inputZone.appendChild(pcLabel);
 inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey3,#8A8A84)'}, 'kg'));
 }
 }

 var repsInput = h('input', {
 type: 'number', min: '0', max: '50', step: '1',
 inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Répétitions',
 placeholder: String(setRow.targetReps),
 value: setRow.actualReps !== null ? String(setRow.actualReps) : '',
 style: 'width:40px;padding:4px;border:1px solid var(--border);border-radius:2px;font-size:16px;text-align:center;background:var(--bg,var(--ivory))',
 oninput: (function(sr, _isBw){ return function(e) {
 var v = parseInt(e.target.value);
 sr.actualReps = isNaN(v) ? null : v;
 saveMuscuSessionLog();
 // Réactiver le bouton validation en temps réel
 var _btn = e.target.closest('.set-row') ? e.target.closest('.set-row').querySelector('.set-validate-btn') : null;
 if (_btn) { var _ok = sr.actualReps !== null && (sr.actualWeight !== null || (_isBw && !sr.weighted)); _btn.disabled = !_ok; _btn.className = 'set-validate-btn' + (_ok ? '' : ' set-validate-btn-disabled'); }
 }; })(setRow, isBodyweight)
 });
 inputZone.appendChild(repsInput);
 inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey)'}, window.t('muscu.reps')));

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
 var hasData = _sr.actualReps !== null && (_sr.actualWeight !== null || _bwNoWeight);

 if (isValidated) {
 // Série déjà validée : afficher le checkmark
 var ok = _sr.actualReps >= _sr.targetReps && (_bwNoWeight || _sr.actualWeight >= _sr.targetWeight);
 inputZone.appendChild(h('span', {'class': ok ? 'set-success' : 'set-fail', style: 'font-size:13px'}, ok ? '\u2713' : '\u2717'));
 row.classList.add('set-row-validated');
 } else {
 // Bouton de validation
 var valBtn = h('button', {
 'class': 'set-validate-btn' + (hasData ? '' : ' set-validate-btn-disabled'),
 disabled: !hasData,
 onclick: function(e) {
 e.stopPropagation();
 // Marquer la série comme validée
 _sr.validated = true;
 saveMuscuSessionLog();

 // Tick de confirmation
 if (window.RestTimer) window.RestTimer.playTick();

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
 }, '\u2705 S\u00e9rie OK');
 inputZone.appendChild(valBtn);
 }
 })(setRow, si3, exRef, numSets, isBodyweight, _exIdx, _dayExercises);

 row.appendChild(inputZone);

 // RIR input for advanced/pro users
 if (isAdvancedRIR) {
  var _rirVal = setRow.rirActual !== null && setRow.rirActual !== undefined ? String(setRow.rirActual) : '';
  var _rirInput = h('input', {
   type: 'number', min: '0', max: '5', step: '1',
   value: _rirVal,
   placeholder: '-',
   style: 'width:36px;padding:4px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory)',
   onclick: function(e) { e.stopPropagation(); },
   onchange: (function(_setRow) {
    return function(e) {
     e.stopPropagation();
     var v = parseInt(e.target.value);
     if (!isNaN(v) && v >= 0 && v <= 5) {
      _setRow.rirActual = v;
      // Use MESOCYCLE_WEEKS for correct per-week rirTarget (MUSCU_PHASES lacks rirTarget)
      var _mesoW = window.MESOCYCLE_WEEKS;
      var _mesoI = _mesoW ? ((( S.muscuWeek || 1) - 1) % _mesoW.length) : -1;
      var _mesoE = (_mesoW && _mesoI >= 0) ? _mesoW[_mesoI] : null;
      var _rirTarget2 = _mesoE ? _mesoE.rirTarget : 2;
      if (v > _rirTarget2 + 1) _setRow.rirNote = 'Augmentez la charge la prochaine fois';
      else if (v < _rirTarget2 - 1) _setRow.rirNote = 'Réduisez la charge ou le volume';
      else _setRow.rirNote = null;
      try { localStorage.setItem('mtd_muscu_session_' + ((window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon'), JSON.stringify(S.muscuSessionLog)); } catch(e2) {}
      window.render();
     }
    };
   })(setRow)
  });
  row.appendChild(_rirInput);
 }

 setTable.appendChild(row);
 // Display rirNote feedback as a full-width row beneath the set row (after render cycle)
 if (isAdvancedRIR && setRow.rirNote) {
  setTable.appendChild(h('div', {style: 'padding:3px 8px;background:rgba(106,74,26,0.06);border-top:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:#6A4A1A;letter-spacing:0.5px'}, '\u26a0 S' + setRow.set + ' : ' + setRow.rirNote));
 }
 });

 // Note progression semaine prochaine
 if (progressiveWeight > 0 && !isBodyweight) {
 var lbKeywords = /squat|leg|fessier|ischios|mollet|presse|hip.*thrust|rdl|deadlift|soulev|cuisse|jambe/i;
 var nextIncr = lbKeywords.test(exRef.n) ? 5 : 2.5;
 var progressNote = h('div', {style: 'padding:6px 8px;background:var(--greenbg,rgba(26,74,26,.06));border-top:1px solid var(--border);font-size:11px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif'});
 progressNote.appendChild(h('span', {style: 'color:var(--green,#1A4A1A)'}, '\uD83D\uDCC8 '));
 progressNote.appendChild(h('span', {}, 'Objectif semaine prochaine\u00a0: ' + (progressiveWeight + nextIncr) + '\u00a0kg si toutes s\u00e9ries r\u00e9ussies'));
 setTable.appendChild(progressNote);
 } else if (isBodyweight) {
 var bwProgressNote = h('div', {style: 'padding:6px 8px;background:var(--greenbg,rgba(26,74,26,.06));border-top:1px solid var(--border);font-size:11px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif'});
 bwProgressNote.appendChild(h('span', {style: 'color:var(--green,#1A4A1A)'}, '\uD83D\uDCC8 '));
 bwProgressNote.appendChild(h('span', {}, 'Objectif\u00a0: +1-2 reps par s\u00e9rie si toutes s\u00e9ries r\u00e9ussies'));
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
 progGraph.appendChild(h('span', {style: 'color:#1A4A1A'}, '\uD83D\uDCCA '));
 var sparkSvg = renderSparkline(progressValues, '#1A4A1A');
 if (sparkSvg) progGraph.appendChild(sparkSvg);
 progGraph.appendChild(h('span', {style: 'margin-left:4px'}, progressValues[0] + '\u00a0' + _sparkUnit + ' \u2192 ' + progressValues[progressValues.length - 1] + '\u00a0' + _sparkUnit));
 setTable.appendChild(progGraph);
 }

 // ─── PERSONAL RECORD DETECTION ───
 (function(_exRef2, _isBodyweight2, _setData2) {
  var _prToday = new Date().toISOString().slice(0, 10);
  // Trouver le meilleur volume (poids × reps) parmi les sessions précédentes
  var _prevBestVolume = 0;
  var _sortedDates2 = Object.keys(S.muscuSessionLog || {}).sort();
  _sortedDates2.forEach(function(d) {
   if (d >= _prToday) return; // Ignorer aujourd'hui
   var _prevSets = (S.muscuSessionLog[d] && Array.isArray(S.muscuSessionLog[d][_exRef2.n])) ? S.muscuSessionLog[d][_exRef2.n] : [];
   _prevSets.forEach(function(s) {
    if (s.actualReps && s.actualWeight) {
     var vol = s.actualWeight * s.actualReps;
     if (vol > _prevBestVolume) _prevBestVolume = vol;
    }
   });
  });
  if (_prevBestVolume === 0) return; // Pas d'historique, pas de PR
  // Comparer avec les séries validées aujourd'hui
  var _todaySets2 = _setData2 || [];
  var _todayBestVolume = 0;
  _todaySets2.forEach(function(s) {
   if (s.validated && s.actualReps && s.actualWeight) {
    var vol = s.actualWeight * s.actualReps;
    if (vol > _todayBestVolume) _todayBestVolume = vol;
   }
  });
  if (_todayBestVolume > _prevBestVolume) {
   // Nouveau PR !
   var _prBanner = document.createElement('div');
   _prBanner.style.cssText = 'padding:6px 10px;background:rgba(26,74,26,0.07);border-top:1px solid #1A4A1A;display:flex;align-items:center;gap:8px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;letter-spacing:0.3px;';
   var _prArrow = document.createElement('span');
   _prArrow.style.cssText = 'font-size:13px;font-weight:700;flex-shrink:0;';
   _prArrow.textContent = '\u2191 PR';
   var _prMsg = document.createElement('span');
   _prMsg.textContent = 'Nouveau record personnel sur ' + _exRef2.n + '\u00a0!';
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
 var _nudge = h('div', {style: 'margin-top:8px;padding:10px 14px;background:#1A4A1A;border-radius:2px;display:flex;align-items:center;justify-content:space-between'});
 _nudge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#fff;font-weight:700'}, '\u2713 Exercice termin\u00e9'));
 if (_nextEx2) {
 var _nudgeRight = h('div', {style: 'text-align:right'});
 _nudgeRight.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px'}, 'Suivant'));
 _nudgeRight.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;color:#fff;max-width:140px;text-align:right'}, _nextEx2.n));
 _nudge.appendChild(_nudgeRight);
 } else {
 _nudge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.8)'}, '\uD83C\uDFC6 Derni\u00e8r exercice \u2014 Belle s\u00e9ance\u00a0!'));
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
 var alts = window.getAlternativeExercises ? window.getAlternativeExercises(exRef.m, exRef.n, 4) : [];
 var altPanel = h('div', {style: 'margin-top:6px;border:1px solid var(--border,#DDDBD0);border-radius:2px;overflow:hidden;background:var(--ivory2,#F5F4EF)'});
 var altTitle = h('div', {style: 'padding:8px 12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);border-bottom:1px solid var(--border)'}, 'Exercices pour les m\u00eames muscles');
 altPanel.appendChild(altTitle);

 if (alts.length === 0) {
 altPanel.appendChild(h('div', {style: 'padding:12px;text-align:center;font-size:13px;color:var(--grey);font-style:italic'}, 'Aucune alternative disponible.'));
 } else {
 alts.forEach(function(alt) {
 var altRow = h('div', {
 style: 'padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border,#DDDBD0);transition:background .1s',
 onclick: function(e) {
 e.stopPropagation();
 var newEx = { n: alt.n, m: alt.m, eq: alt.eq, sets: alt.sets || exRef.sets, rest: alt.rest || exRef.rest };
 newEx.video = alt.video || (window.getExerciseVideoUrl ? window.getExerciseVideoUrl(alt.n) : null);
 if (!Array.isArray(S.sportProgram) || !S.sportProgram[dayI] || !Array.isArray(S.sportProgram[dayI].exercises)) { S.swapPanel = null; window.render(); return; }
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
 style: 'font-size:11px;color:#5A1010;text-decoration:none;flex-shrink:0;margin-left:8px',
 onclick: function(e) { e.stopPropagation(); }
 }, '\u25b6 Vid\u00e9o'));
 }
 altRow.appendChild(altTop);
 altRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, alt.m + (alt.eq ? ' \u2014 ' + alt.eq : '')));
 altPanel.appendChild(altRow);
 });
 }
 card.appendChild(altPanel);
 }
 })(ex, S.selectedSportDay, exIdx);

 p.appendChild(card);
 });

 // ─── RETOUR AU CALME ───
 (function() {
  var cd = day.cooldown || {
   duration: 5,
   exercises: [
    { name: 'Marche ou vélo léger', duration: '3 min', intensity: 'Très faible' },
    { name: 'Étirements statiques', duration: '2 min', notes: 'Groupes musculaires travaillés' }
   ]
  };
  var cdCard = h('div', {style: 'background:rgba(26,58,106,0.04);border:1px solid rgba(26,58,106,0.18);border-left:3px solid #1A3A6A;padding:12px 14px;margin-top:8px;margin-bottom:12px;border-radius:0 2px 2px 0'});
  cdCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#1A3A6A;font-weight:600;margin-bottom:8px'}, 'RÉCUPÉRATION · ' + cd.duration + ' min'));
  (cd.exercises || []).forEach(function(ex) {
   var row = h('div', {style: 'display:flex;align-items:flex-start;gap:8px;margin-bottom:4px'});
   row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#1A1A18);font-weight:500;flex-shrink:0;min-width:180px'}, ex.name + ' — ' + ex.duration));
   var detail = (ex.intensity || '') + (ex.notes ? (ex.intensity ? ' · ' : '') + ex.notes : '');
   if (detail) row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);line-height:1.4'}, detail));
   cdCard.appendChild(row);
  });
  p.appendChild(cdCard);
 })();

 // ─── EXERCICES BONUS (depuis programmes dédiés) ───
 var bonusDayList = (S.bonusExercises || {})[S.selectedSportDay] || [];
 if (bonusDayList.length > 0) {
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin:16px 0 8px'}, 'Exercices bonus'));
 bonusDayList.forEach(function(bex, bi) {
 var bc = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A4A1A'});
 var bnRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center'});
 bnRow.appendChild(h('div', {'class': 'exercise-muscle'}, bex.m));
 bnRow.appendChild(h('span', {style: 'font-size:18px;color:#5A1010;cursor:pointer;line-height:1;padding:0 4px', onclick: (function(idx) { return function(e) { e.stopPropagation(); if (!S.bonusExercises) S.bonusExercises = {}; var arr = S.bonusExercises[S.selectedSportDay] || []; arr.splice(idx, 1); S.bonusExercises[S.selectedSportDay] = arr; window.render(); }; })(bi)}, '\u00d7'));
 bc.appendChild(bnRow);
 bc.appendChild(h('div', {'class': 'exercise-name'}, bex.n));
 bc.appendChild(h('div', {'class': 'exercise-sets'}, bex.sets + ' \u2014 Repos ' + bex.rest));
 if (bex.eq) bc.appendChild(h('div', {'class': 'exercise-detail'}, bex.eq));
 var _bexParts = (bex.sets || '').split('\u00d7');
 var _bexReps = _bexParts.length > 1 ? _bexParts[1] : null;
 var bsugg = window.getMusculationWeight ? window.getMusculationWeight(bex.n, bex.sets, _bexReps) : null;
 if (bsugg && bsugg > 0) bc.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;margin-top:6px;padding:4px 8px;background:rgba(39,174,96,0.06);border-left:2px solid #1A4A1A'}, '\uD83D\uDCA1 Charge sugg\u00e9r\u00e9e\u00a0: ' + (window.UNITS ? window.UNITS.displayWeight(bsugg) : bsugg + '\u00a0kg')));
 p.appendChild(bc);
 });
 }

 // Day summary
 var allEx = (day.exercises || []).concat(bonusDayList);
 var estDuration = calcSessionDuration(allEx);
 var summary = h('div', {'class': 'day-total'});
 summary.appendChild(h('div', {'class': 'dt-label'}, allEx.length + ' exercice' + (allEx.length > 1 ? 's' : '') + (bonusDayList.length > 0 ? ' (dont ' + bonusDayList.length + ' bonus)' : '')));
 summary.appendChild(h('div', {'class': 'dt-val'}, '~' + estDuration + ' min'));
 p.appendChild(summary);

 // ─── CÉLÉBRATION FIN DE SÉANCE ───
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
  var _celCard = document.createElement('div');
  _celCard.style.cssText = 'border:1px solid #1A4A1A;background:rgba(26,74,26,0.05);padding:20px 20px 16px;margin-top:16px;border-left:4px solid #1A4A1A;';
  var _celTitle = document.createElement('div');
  _celTitle.style.cssText = 'font-family:Georgia,serif;font-size:16px;font-style:italic;color:#1A4A1A;margin-bottom:6px;';
  _celTitle.textContent = 'S\u00e9ance termin\u00e9e. Excellent travail.';
  _celCard.appendChild(_celTitle);
  var _celSub = document.createElement('div');
  _celSub.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.7;letter-spacing:0.3px;';
  var _celSubText = _totalSets + ' s\u00e9rie' + (_totalSets > 1 ? 's' : '') + ' r\u00e9alis\u00e9e' + (_totalSets > 1 ? 's' : '');
  if (_hasVolume) {
   var _vDisplay = window.UNITS ? window.UNITS.displayWeight(Math.round(_totalVolume)) : Math.round(_totalVolume) + '\u00a0kg';
   _celSubText += ' \u00b7 ' + _vDisplay + ' de volume total';
  }
  _celSub.textContent = _celSubText;
  _celCard.appendChild(_celSub);
  p.appendChild(_celCard);
 })();

 // ─── SÉANCE TERMINÉE + BILAN CALORIQUE ───
 var todayKey = S.selectedSportDay + '_' + new Date().toISOString().slice(0, 10);
 var doneSess = S.sessionHistory && S.sessionHistory[todayKey];
 if (doneSess) {
 var doneBadge = h('div', {style: 'border:1px solid #1A4A1A;background:var(--greenbg,rgba(26,74,26,.06));padding:12px 16px;margin-top:8px'});
 doneBadge.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;font-weight:bold;color:#1A4A1A'}, '\u2714 Objectif accompli \u2014 S\u00e9ance valid\u00e9e'));
 doneBadge.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#1A4A1A;margin-top:4px'}, doneSess.duration + '\u00a0min \u2014 ' + doneSess.kcalTotal + '\u00a0kcal brul\u00e9es (dont +' + doneSess.kcalEpoc + '\u00a0kcal EPOC)'));
 doneBadge.appendChild(h('button', {style: 'margin-top:8px;font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);background:none;border:none;cursor:pointer;padding:0', onclick: function() { delete S.sessionHistory[todayKey]; window.render(); }}, 'Annuler'));
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
 recapBox.appendChild(h('div', {style: 'padding:6px 10px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);border-bottom:1px solid var(--border);font-weight:700'}, 'R\u00e9cap. des exercices'));
 _recapExNames.forEach(function(exName) {
 var _sets = _recapLog[exName] || [];
 var _validSets = _sets.filter(function(s) { return s.validated === true; });
 if (_validSets.length === 0) return;
 var _row = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid var(--border)'});
 _row.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'}, exName));
 var _summary = _validSets.length + ' s\u00e9ries';
 var _firstValid = _validSets[0];
 if (_firstValid.actualWeight && _firstValid.actualWeight > 0) {
 _summary += ' \u2014 ' + (window.UNITS ? window.UNITS.displayWeight(_firstValid.actualWeight) : _firstValid.actualWeight + ' kg');
 }
 _row.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-left:8px;white-space:nowrap'}, _summary));
 _row.appendChild(h('span', {style: 'color:#1A4A1A;font-size:14px;margin-left:6px'}, '\u2713'));
 recapBox.appendChild(_row);
 });
 compPanel.appendChild(recapBox);
 }

 // Durée
 var durRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin-bottom:14px'});
 durRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);flex:1'}, 'Dur\u00e9e r\u00e9elle'));
 var durInp = h('input', {type: 'number', min: '10', max: '180', value: String(realDur), style: 'width:60px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory)', onclick: function(e) { e.stopPropagation(); }, onchange: function(e) { var v = parseInt(e.target.value); if (!isNaN(v) && v > 0) { S._sessionDuration = v; window.render(); } }});
 durRow.appendChild(durInp);
 durRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'min'));
 compPanel.appendChild(durRow);
 // Résultat calories
 var kcalBox = h('div', {style: 'background:var(--ivory);border:1px solid var(--border);padding:12px 16px;margin-bottom:14px'});
 var kr1 = h('div', {style: 'display:flex;justify-content:space-between;margin-bottom:6px'});
 kr1.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'D\u00e9pense s\u00e9ance'));
 kr1.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:16px;font-weight:bold'}, kcalRes.base + '\u00a0kcal'));
 kcalBox.appendChild(kr1);
 var kr2 = h('div', {style: 'display:flex;justify-content:space-between;margin-bottom:6px'});
 kr2.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'EPOC +24h (Schuenke\u00a02002)'));
 kr2.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--orange,#6A4A1A)'}, '+' + kcalRes.epoc + '\u00a0kcal'));
 kcalBox.appendChild(kr2);
 var kr3 = h('div', {style: 'display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px'});
 kr3.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;font-weight:bold'}, 'Total estim\u00e9'));
 kr3.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:17px;font-weight:bold;color:var(--green,#1A4A1A)'}, kcalRes.total + '\u00a0kcal'));
 kcalBox.appendChild(kr3);
 kcalBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin-top:6px;font-style:italic'}, 'FC estim\u00e9e\u00a0' + kcalRes.hr + '\u00a0bpm \u2014 RPE\u00a0' + kcalRes.rpe + '/10 \u2014 MET\u00a0Ainsworth\u00a02011 \u00b7 Tanaka\u00a02001'));
 compPanel.appendChild(kcalBox);
 // Note TDEE — évite le double-comptage (audit interdépendance)
 compPanel.appendChild(h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:3px solid var(--orange,#6A4A1A);padding:8px 12px;margin-bottom:14px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--text,#0A0A09);line-height:1.5'}, '\u26a0 Ces calories sont d\u00e9j\u00e0 int\u00e9gr\u00e9es dans votre TDEE via votre facteur d\'activit\u00e9. Ce bilan confirme votre d\u00e9pense r\u00e9elle — ne les d\u00e9duisez pas en plus de votre objectif calorique journalier.'));
 // Contexte nutritionnel : montre l'impact de la session sur le budget calorique
 var nc = getNutritionContext();
 // XSS fix: build nutrition context panel via DOM — values are numeric but use textContent for safety
 if (nc && nc.caloriesTarget > 0 && kcalRes && kcalRes.total > 0) {
 var pct = Math.round((kcalRes.total / nc.caloriesTarget) * 100);
 var warningColor = pct > 40 ? 'var(--red,#5A1010)' : pct > 25 ? 'var(--orange,#6A4A1A)' : 'var(--green,#1A4A1A)';
 var warningMsg = pct > 40
 ? '\u26a0\ufe0f Session tr\u00e8s intense \u2014 pensez \u00e0 ajuster votre alimentation post-entra\u00eenement'
 : pct > 25
 ? '\uD83D\uDD36 Session mod\u00e9r\u00e9e \u2014 nutrition pr\u00e9/post recommand\u00e9e'
 : '\u2705 Session \u00e9quilibr\u00e9e pour votre objectif';
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
 _ncWrap.appendChild(_ncRow('Calories br\u00fcl\u00e9es en session', '\u2212' + kcalRes.total + ' kcal (' + pct + '%)', warningColor));
 var _ncProRow = document.createElement('div');
 _ncProRow.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:8px';
 var _ncProLbl = document.createElement('span');
 _ncProLbl.textContent = 'Cible prot\u00e9ines';
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
 var saveBtn = h('button', {style: 'width:100%;padding:12px;background:var(--black);color:#fff;border:none;font-family:"Helvetica Neue",sans-serif;font-size:13px;cursor:pointer', onclick: function() {
 if (!S.sessionHistory) S.sessionHistory = {};
 S.sessionHistory[todayKey] = {duration: realDur, kcalBase: kcalRes.base, kcalEpoc: kcalRes.epoc, kcalTotal: kcalRes.total, date: new Date().toISOString()};
 // Pruning : garder les 365 dernières sessions max
 var _shKeys = Object.keys(S.sessionHistory || {}).sort();
 if (_shKeys.length > 365) { _shKeys.slice(0, _shKeys.length - 365).forEach(function(k) { delete S.sessionHistory[k]; }); }
 // Sync session vers Supabase
 if (window.SupaSync) SupaSync.saveSession({
 date: todayKey,
 dayIndex: S.selectedSportDay,
 duration: realDur,
 kcalBase: kcalRes.base,
 kcalEpoc: kcalRes.epoc,
 kcalTotal: kcalRes.total
 });
 S.sessionCompleting = false; S._sessionDuration = null;
 // Mise à jour du streak sur action réelle (séance validée)
 if (window.GAMIFICATION) { try { window.GAMIFICATION.updateStreak(); } catch(e) {} }
 window.BLACKBOX && window.BLACKBOX.log('session_done', {day: S.selectedSportDay, kcal: kcalRes.total, duration: realDur});
 window.render();
 }}, '\u2713 Valider la s\u00e9ance');
 compPanel.appendChild(saveBtn);
 compPanel.appendChild(h('div', {style: 'text-align:center;margin-top:8px'}, h('button', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);background:none;border:none;cursor:pointer', onclick: function() { S.sessionCompleting = false; S._sessionDuration = null; window.render(); }}, 'Annuler')));
 p.appendChild(compPanel);
 } else {
 p.appendChild(h('button', {'class': 'regen-btn', style: 'margin-top:8px;background:var(--black);color:#fff', onclick: function() { S.sessionCompleting = S.selectedSportDay; S._sessionDuration = null; window.render(); }}, '\u2713 S\u00e9ance termin\u00e9e'));
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
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:28px'}, 'Programmes ciblés'));
 p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, 'Séances bonus à intégrer selon vos priorités.'));

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
 var phase4 = getMuscuPhase(S.muscuWeek || 1);
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
 if (sugW4 && sugW4 > 0) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;margin-top:2px'}, '\u2192 ~' + (window.UNITS ? window.UNITS.displayWeight(sugW4) : sugW4 + ' kg')));
 row.appendChild(left);
 var right = h('div', {style: 'text-align:right;flex-shrink:0;margin-left:12px'});
 right.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-weight:normal'}, ex.sets + '\u00d7' + ex.reps));
 right.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, ex.rest));
 // Bouton + / Ajouté — ajoute l'exercice en bonus à la séance courante
 var bonusArr = (S.bonusExercises || {})[S.selectedSportDay] || [];
 var isAddedBonus = false;
 for (var bci = 0; bci < bonusArr.length; bci++) { if (bonusArr[bci].n === exBase.name) { isAddedBonus = true; break; } }
 var addBtn = h('div', {
 style: 'margin-top:6px;padding:4px 8px;cursor:pointer;font-family:"Helvetica Neue",sans-serif;font-size:11px;text-align:center;border:1px solid ' + (isAddedBonus ? '#1A4A1A' : 'var(--border)') + ';color:' + (isAddedBonus ? '#1A4A1A' : 'var(--grey)') + ';background:' + (isAddedBonus ? 'rgba(39,174,96,0.08)' : 'transparent'),
 onclick: (function(exBCapture) { return function(e) {
 e.stopPropagation();
 if (!S.bonusExercises) S.bonusExercises = {};
 var arr = S.bonusExercises[S.selectedSportDay] || [];
 var existIdx = -1;
 for (var ii = 0; ii < arr.length; ii++) { if (arr[ii].n === exBCapture.name) { existIdx = ii; break; } }
 if (existIdx === -1) {
 var ph = getMuscuPhase(S.muscuWeek || 1);
 var appl = applyPhaseToExercise(exBCapture, ph);
 arr.push({n: appl.name, m: appl.muscle || '', eq: appl.equipment || '', sets: appl.sets + '\u00d7' + appl.reps, rest: appl.rest || '60s', lv: 1, tags: [], _bonus: true});
 S.bonusExercises[S.selectedSportDay] = arr;
 } else {
 arr.splice(existIdx, 1);
 S.bonusExercises[S.selectedSportDay] = arr;
 }
 window.render();
 }; })(exBase)
 }, isAddedBonus ? '\u2713 Ajout\u00e9' : '+ Ajouter \u00e0 ma s\u00e9ance');
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
 S.sportProgram = generateSportProgram();
 S.selectedSportDay = 0;
 window.BLACKBOX && window.BLACKBOX.log('sport_program_regenerated');
 window.render();
 }}, '\u21bb Recalculer le programme hebdomadaire'));

 // Export PDF
 p.appendChild(h('button', {'class': 'btn-primary', style: 'margin-top:12px;background:var(--black2)', onclick: function() { if (typeof window.exportSportPDF === 'function') window.exportSportPDF(); }}, '\u21e9 Exporter le programme en PDF'));

 // Weight chart removed (was crashing)

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 3; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier les zones'}));
 appendNutritionModeCTA(p);
}

// ─── WEIGHT CHART (for sport) ───
function renderWeightChartSport(container) {
 var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
 var history = []; try { history = JSON.parse(localStorage.getItem('mtd_weight_history_' + userId) || '[]'); } catch(e) { history = []; }

 var section = h('div', {'class': 'chart-container'});
 section.appendChild(h('div', {'class': 'chart-title'}, 'Suivi du poids'));

 if (history.length < 2) {
 section.appendChild(h('div', {style: 'text-align:center;padding:20px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, 'Enregistrez votre poids régulièrement pour voir votre courbe'));
 }

 var canvas = h('canvas', {'class': 'weight-chart', width: '600', height: '200'});
 section.appendChild(canvas);
 container.appendChild(section);

 // Weight input
 var inputRow = h('div', {style: 'display:flex;gap:8px;align-items:center;margin-top:8px'});
 var wi = h('input', {'class': 'num-input', type: 'number', step: '0.1', min: '30', max: '200', placeholder: String(S.weight || 75), style: 'font-size:16px;padding:8px;width:100px;text-align:center'});
 inputRow.appendChild(wi);
 inputRow.appendChild(h('span', {'class': 'num-unit'}, window.UNITS ? window.UNITS.weightLabel() : 'kg'));
 inputRow.appendChild(h('button', {'class': 'btn-primary', style: 'width:auto;margin:0;padding:10px 20px', onclick: function(){
 var v = parseFloat(wi.value);
 var vKg = window.UNITS ? window.UNITS.toKg(v) : v;
 var wRange = window.UNITS ? window.UNITS.weightRange() : {min: 30, max: 300};
 if (!isNaN(v) && v >= wRange.min && v <= wRange.max) {
 v = vKg; // always store in kg
 var key = 'mtd_weight_history_' + userId;
 var hist = []; try { hist = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { hist = []; }
 var today = new Date().toISOString().split('T')[0];
 hist.push({date: today, weight: v});
 try { localStorage.setItem(key, JSON.stringify(hist)); } catch(e) { console.warn('[weight_history] localStorage error:', e); }
 // Sync poids vers Supabase
 if (window.SupaSync) SupaSync.saveWeight(today, v);
 S.weight = v;
 // Sync with S.weightHistory
 if (!S.weightHistory) S.weightHistory = [];
 S.weightHistory.push({date: today, weight: v});
 window.BLACKBOX && window.BLACKBOX.log('weight_logged', {weight: v, from: 'sport'});
 if (window.GAMIFICATION) {
 GAMIFICATION.unlockBadge('first_weigh');
 if (hist.length >= 10) GAMIFICATION.unlockBadge('weight_10');
 }
 if (window.GAMIFICATION) GAMIFICATION.showToast('Poids enregistré : ' + (window.UNITS ? window.UNITS.displayWeight(v) : v + ' kg'));
 window.render();
 }
 }}, 'Enregistrer'));
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
 try { window.createChart(canvas, {
 type: 'line',
 data: {
 labels: cleanLabels,
 datasets: [{
 label: 'Poids (kg)',
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
 hdr.appendChild(h('button', {'class': 'modal-close', 'aria-label': 'Retour', onclick: function(){ S.sportModalExercise = null; window.render(); }}, ''));
 sheet.appendChild(hdr);

 var body = h('div', {'class': 'modal-body'});

 // Muscle + Equipment
 var pills = h('div', {'class': 'macro-pills'});
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.m), h('div', {'class': 'mp-label'}, 'Muscle')]));
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.sets), h('div', {'class': 'mp-label'}, window.t('muscu.sets'))]));
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.rest), h('div', {'class': 'mp-label'}, window.t('muscu.rest'))]));
 pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ''.repeat(Math.max(0, parseInt(ex.lv) || 0))), h('div', {'class': 'mp-label'}, window.t('sport.level'))]));
 body.appendChild(pills);

 // Equipment
 body.appendChild(h('div', {'class': 'section-label'}, '\u00c9quipement'));
 body.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:16px'}, ex.eq));

 // Saved weight display
 var modalSavedW = S.musculationWeights[ex.n];
 if (modalSavedW && modalSavedW.weight) {
 var modalEqType = modalSavedW.type || 'barre';
 var _mwDisp = window.UNITS ? window.UNITS.displayWeightVal(modalSavedW.weight) : modalSavedW.weight;
 var _mwUnit = window.UNITS ? window.UNITS.weightLabel() : 'kg';
 var modalWeightDisplay = modalEqType === 'haltere' ? '2\u00d7' + _mwDisp + ' ' + _mwUnit : _mwDisp + ' ' + _mwUnit;
 var modalTypeLabel = modalEqType === 'barre' ? '\uD83C\uDFCB\uFE0F Barre' : modalEqType === 'haltere' ? '\uD83D\uDCAA Halt\u00e8res' : modalEqType === 'machine' ? '\u2699\uFE0F Machine' : modalEqType === 'kb' ? '\uD83D\uDD14 Kettlebell' : 'Poids de corps';

 body.appendChild(h('div', {'class': 'section-label'}, 'Charge de travail'));
 var modalWeightCard = h('div', {style: 'display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--ivory2,#F8F7F2);border-left:3px solid var(--black,#0A0A09);margin-bottom:16px'});
 modalWeightCard.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:24px;font-weight:bold;color:var(--black)'}, modalWeightDisplay));
 modalWeightCard.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey)'}, modalTypeLabel));
 body.appendChild(modalWeightCard);
 }

 // Description
 body.appendChild(h('div', {'class': 'section-label'}, 'Exécution'));
 body.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:16px'}, ex.desc));

 // Tips
 if (ex.tips && ex.tips.length) {
 body.appendChild(h('div', {'class': 'section-label'}, 'Conseils'));
 var tl = h('ul', {'class': 'ingredient-list'});
 ex.tips.forEach(function(tip){ tl.appendChild(h('li', {}, tip)); });
 body.appendChild(tl);
 }

 // Video button (only render if URL exists)
 if (ex.video) {
 body.appendChild(h('a', {
 'class': 'btn-primary', href: ex.video, target: '_blank', rel: 'noopener',
 style: 'display:block;text-align:center;text-decoration:none;margin-top:16px',
 onclick: function(){ window.BLACKBOX && window.BLACKBOX.log('video_clicked', {exercise: ex.n}); }
 }, '▶ Voir la vidéo technique'));
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
 p.appendChild(h('p', {'class': 'subtitle'}, 'Programmation basée sur la méthode Jack Daniels & Pfitzinger'));

 // Goal selection (mandatory)
 p.appendChild(h('div', {'class': 'section-label'}, 'Objectif de course'));
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
 h('div', {'class': 'card-tag'}, g.weeks + ' semaines · SL max ' + g.longRunMax + 'km')
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
 daysWrap.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(daysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, '3 à 6 jours par semaine'));

 // Pace (optional)
 p.appendChild(h('div', {style: 'height:24px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));
 p.appendChild(h('div', {'class': 'section-label'}, 'Votre allure actuelle (optionnel)'));
 var paceWrap = h('div', {'class': 'num-input-wrap'});
 paceWrap.appendChild(h('input', {'class': 'num-input', type: 'text', placeholder: '5:30', value: S.runningPace || '', style: 'width:80px;text-align:center',
 oninput: function(e){
 S.runningPace = e.target.value;
 clearTimeout(window._runPaceTimer);
 window._runPaceTimer = setTimeout(function(){ window.render(); }, 800);
 }
 }));
 paceWrap.appendChild(h('span', {'class': 'num-unit'}, 'min/km'));
 p.appendChild(paceWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, 'Votre allure facile sur 30 min'));

 // Show estimated paces if pace is filled
 if (S.runningPace && S.runningPace.indexOf(':') !== -1) {
 var paceParts = S.runningPace.split(':');
 var paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1] || 0);
 if (paceSeconds > 0) {
 var zonesInfo = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin:16px 0'});
 zonesInfo.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, 'Allures estimées par zone'));
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
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Choisissez votre objectif et votre niveau pour continuer.'));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) {
 var goalObj = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
 if (typeof window.generateRunningProgram === 'function') S.runningProgram = window.generateRunningProgram(goalObj ? goalObj.weeks : 8, S.runningDays, S.runningLevel, S.runningGoal);
 S.runningWeek = 1;
 S.selectedRunDay = 0;
 S.sStep = 8;
 window.BLACKBOX && window.BLACKBOX.log('running_config', {goal: S.runningGoal, level: S.runningLevel, days: S.runningDays});
 window.render();
 }
 }}, 'Générer mon plan'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 8: RUNNING PROGRAM ───
function renderRunningProgram(p) {
 if (!S.runningProgram || S.runningProgram.length === 0) {
 var goalObj = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
 if (typeof window.generateRunningProgram === 'function') S.runningProgram = window.generateRunningProgram(goalObj ? goalObj.weeks : 8, S.runningDays, S.runningLevel, S.runningGoal);
 }

 var program = S.runningProgram;
 if (!program || !program.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 7; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }
 var totalWeeks = program.length;
 S.runningWeek = S.runningWeek || 1;
 if (S.runningWeek > totalWeeks) S.runningWeek = totalWeeks;
 if (S.runningWeek < 1) S.runningWeek = 1;
 var currentWeekData = program[S.runningWeek - 1];
 if (!currentWeekData) { p.appendChild(h('div', {style:'text-align:center;padding:32px;font-size:13px;color:var(--grey)'}, 'Semaine introuvable.')); p.appendChild(h('button', {'class':'btn-back', onclick: function(){ S.sStep = 7; window.render(); }}, '← Retour')); return; }

 var goalObj2 = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
 var levelObj = (window.RUNNING_LEVELS || []).find(function(l){ return l.id === S.runningLevel; });

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
 p.appendChild(h('h1', {html: (goalObj2 ? goalObj2.name : 'Running') + '<br><em>Plan</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, totalWeeks + ' semaines · ' + S.runningDays + ' jours/semaine · Niveau ' + (levelObj ? levelObj.name : '')));

 appendWellnessBanner(p);

 // Week navigation
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine précédente', onclick: function() {
 if (S.runningWeek > 1) { S.runningWeek--; S.selectedRunDay = 0; window.render(); }
 }}, '\u2190'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.runningWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine suivante', onclick: function() {
 if (S.runningWeek < totalWeeks) { S.runningWeek++; S.selectedRunDay = 0; window.render(); }
 }}, '\u2192'));
 p.appendChild(weekNav);

 // Phase + volume info
 var phaseColors = {Base: '#1A3A6A', 'Développement': '#6A4A1A', 'Spécifique': '#5A1010', 'Affûtage': '#1A4A1A'};
 var phaseColor = phaseColors[currentWeekData.phase] || '#0A0A09';
 var infoCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 infoCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + phaseColor + ';margin-bottom:4px'}, 'Phase : ' + currentWeekData.phase));
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Volume : ~' + currentWeekData.totalKm + ' km · Sortie longue : ' + currentWeekData.longRun + ' km'));
 if (currentWeekData.isDeload) {
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#6A4A1A;margin-top:6px;font-weight:bold'}, ' Semaine de récupération'));
 }
 if (currentWeekData.isTaper) {
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#1A4A1A;margin-top:6px;font-weight:bold'}, ' Affûtage — gardez l\'intensité, réduisez le volume'));
 }
 p.appendChild(infoCard);

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
 }, 'Jour ' + (i + 1)));
 });
 p.appendChild(tabs);

 // Current session
 var sess = sessions[S.selectedRunDay];
 if (sess) {
 var zoneColorMap = {'Z1': '#1A4A1A', 'Z2': '#1A3A6A', 'Z3': '#6A4A1A', 'Z4': '#6A4A1A', 'Z5': '#5A1010', 'Z1-Z2': '#1A4A1A', 'Z4-Z5': '#5A1010', 'Z3-Z4': '#6A4A1A'};
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

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 7; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ─── STEP 9: HYROX CONFIG ───
function renderHyroxConfig(p) {
 if (!S.hyroxBenchmarks || typeof S.hyroxBenchmarks !== 'object' || Array.isArray(S.hyroxBenchmarks)) S.hyroxBenchmarks = {};
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Hyrox'));
 p.appendChild(h('h1', {html: 'Préparation<br><em>Hyrox</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, '12 semaines pour être prêt le jour J'));

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
 daysWrap.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(daysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, '3 à 6 jours par semaine'));

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
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Choisissez votre objectif et votre niveau pour continuer.'));
 }
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (ok) {
 S.hyroxProgram = window.generateHyroxProgram(S.hyroxDays, S.hyroxLevel, S.hyroxGoal);
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
 }}, 'Générer mon plan'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 10: HYROX PROGRAM ───
function renderHyroxProgram(p) {
 // Guard: si config non remplie, rediriger vers la config
 if (!S.hyroxLevel || !S.hyroxGoal) { S.sStep = 9; setTimeout(function() { if (window.render) window.render(); }, 0); return; }
 if (!S.hyroxProgram || S.hyroxProgram.length === 0) {
 S.hyroxProgram = window.generateHyroxProgram(S.hyroxDays, S.hyroxLevel, S.hyroxGoal);
 }

 var program = S.hyroxProgram;
 if (!program || !program.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
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

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Hyrox'));
 p.appendChild(h('h1', {html: 'Préparation<br><em>12 semaines</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Phase ' + currentWeekData.phase + ' · ' + (goalObj ? goalObj.name : '') + ' · ' + (levelObj ? levelObj.icon + ' ' + levelObj.name : '')));

 appendWellnessBanner(p);

 // Competition week banner
 if (S.hyroxWeek === 12) {
 var banner = h('div', {style: 'border:2px solid #5A1010;padding:16px;background:rgba(192,57,43,0.04);margin-bottom:16px;text-align:center'});
 banner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;color:#5A1010;margin-bottom:4px'}, ' RACE WEEK — GO TIME'));
 banner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Activation légère. Visualisation. Repos maximal. Vous êtes prêt !'));
 p.appendChild(banner);
 }

 // Week navigation
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine précédente', onclick: function() {
 if (S.hyroxWeek > 1) { S.hyroxWeek--; S.selectedHyroxDay = 0; window.render(); }
 }}, '\u2190'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.hyroxWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine suivante', onclick: function() {
 if (S.hyroxWeek < totalWeeks) { S.hyroxWeek++; S.selectedHyroxDay = 0; window.render(); }
 }}, '\u2192'));
 p.appendChild(weekNav);

 // Phase info
 var phaseColors = {Base: '#1A3A6A', Build: '#6A4A1A', Peak: '#5A1010', Taper: '#2E7D32', 'Développement': '#6A4A1A', 'Compétition': '#5A1010'};
 var phaseColor = phaseColors[currentWeekData.phase] || '#0A0A09';
 var infoCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 infoCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + phaseColor + ';margin-bottom:4px'}, 'Phase : ' + currentWeekData.phase));
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, currentWeekData.notes));
 if (currentWeekData.isDeload) {
 infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#6A4A1A;margin-top:6px;font-weight:bold'}, ' Semaine de décharge'));
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
 }, 'Jour ' + (i + 1)));
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
 var diffColor = diff > 0 ? '#5A1010' : '#1A4A1A';
 valSpan.appendChild(h('span', {style: 'color:' + diffColor + ';margin-left:8px;font-size:11px'}, diffStr + ' vs standard'));
 }
 }
 bmRow.appendChild(valSpan);
 bmCard.appendChild(bmRow);
 });
 p.appendChild(bmCard);
 }

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 9; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ═══════════════════════════════════════
// PADEL MODULE
// ═══════════════════════════════════════

function renderPadelConfig(p) {
 if (!S.padelProfile || typeof S.padelProfile !== 'object' || Array.isArray(S.padelProfile)) S.padelProfile = {};
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Padel'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>padel</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Technique, tactique et préparation physique.'));
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
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '5', value: String(S.padelDays), oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 5) S.padelDays = v; }}));
 nw.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(nw);

 // Skill self-assessment
 p.appendChild(h('div', {'class': 'divider'}, [h('span', {'class': 'divider-line'}), h('span', {'class': 'divider-text'}, 'Auto-évaluation (optionnel)'), h('span', {'class': 'divider-line'})]));
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
 if (ok) { S.padelProgram = window.generatePadelProgram(S.padelDays, S.padelLevel, S.padelGoal); S.padelWeek = 1; S.selectedPadelDay = 0; S.sStep = 12; window.render(); }
 }}, 'Générer mon programme'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

function renderPadelProgram(p) {
 if (!S.padelProgram) { S.padelProgram = window.generatePadelProgram(S.padelDays, S.padelLevel, S.padelGoal); }
 if (!S.padelProgram || !S.padelProgram.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 11; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }
 if (!S.padelWeek || S.padelWeek < 1) S.padelWeek = 1;
 var week = S.padelProgram[S.padelWeek - 1];
 if (!week) return;

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Padel'));
 p.appendChild(h('h1', {html: 'Semaine ' + S.padelWeek + '<br><em>' + week.phase + '</em>'}));
 var goalName = ''; (window.PADEL_GOALS || []).forEach(function(g){ if(g.id===S.padelGoal) goalName=g.name; });
 p.appendChild(h('p', {'class': 'subtitle'}, S.padelDays + ' jours/semaine — ' + goalName));
 p.appendChild(h('div', {style: 'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, week.notes));

 // Week navigation
 var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': 'Semaine précédente', disabled: S.padelWeek <= 1, onclick: function(){ S.padelWeek--; S.selectedPadelDay = 0; window.render(); }}, '←'));
 wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.padelWeek + ' / ' + S.padelProgram.length));
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': 'Semaine suivante', disabled: S.padelWeek >= S.padelProgram.length, onclick: function(){ S.padelWeek++; S.selectedPadelDay = 0; window.render(); }}, '→'));
 p.appendChild(wn);

 // Day tabs
 var _padelSessions = week.sessions || [];
 if (S.selectedPadelDay === undefined || S.selectedPadelDay === null || S.selectedPadelDay >= _padelSessions.length) S.selectedPadelDay = 0;
 var tabs = h('div', {'class': 'day-tabs'});
 _padelSessions.forEach(function(s, i) {
 tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedPadelDay === i ? ' active' : ''), onclick: function(){ S.selectedPadelDay = i; window.render(); }}, 'Jour ' + (i + 1)));
 });
 p.appendChild(tabs);

 var session = _padelSessions[S.selectedPadelDay];
 if (session) {
 var colors = {technique: 'var(--blue,#1A3A6A)', physical: 'var(--green,#1A4A1A)', match: 'var(--red,#5A1010)', tactics: 'var(--orange,#6A4A1A)', recovery: 'var(--grey,#6B6B65)'};
 var card = h('div', {style: 'border-left:3px solid ' + (colors[session.type] || 'var(--black)') + ';padding:16px;margin:12px 0;background:var(--ivory2,#F4F4F0)'});
 card.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:12px'}, session.name));
 (session.exercises || []).forEach(function(ex, i) {
 var exDiv = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:13px;font-weight:500'}, (i + 1) + '. ' + ex.name));
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, ex.detail));
 if (ex.duration) exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2,#9A9A90);margin-top:2px'}, '⏱ ' + ex.duration));
 card.appendChild(exDiv);
 });
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:12px;padding-top:8px;border-top:1px solid var(--ivory3)'}, session.notes));
 p.appendChild(card);
 }

 if (window.renderStrengthGrade) renderStrengthGrade(p);
 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 11; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ═══════════════════════════════════════
// GOLF MODULE
// ═══════════════════════════════════════

function renderGolfConfig(p) {
 if (!S.golfProfile || typeof S.golfProfile !== 'object' || Array.isArray(S.golfProfile)) S.golfProfile = {};
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Golf'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>golf</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Basé sur les méthodes Dave Pelz & Butch Harmon.'));

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
 nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '5', value: String(S.golfDays), oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 5) S.golfDays = v; }}));
 nw.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(nw);

 // Handicap
 p.appendChild(h('div', {'class': 'section-label'}, 'Handicap actuel (optionnel)'));
 var hw = h('div', {'class': 'num-input-wrap'});
 hw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '0', max: '54', value: S.golfHandicap ? String(S.golfHandicap) : '', placeholder: 'HC', oninput: function(e){ var v = parseFloat(e.target.value); if (!isNaN(v)) S.golfHandicap = v; }}));
 hw.appendChild(h('span', {'class': 'num-unit'}, 'HC'));
 p.appendChild(hw);

 // Skill self-assessment
 p.appendChild(h('div', {'class': 'divider'}, [h('span', {'class': 'divider-line'}), h('span', {'class': 'divider-text'}, 'Auto-évaluation (optionnel)'), h('span', {'class': 'divider-line'})]));
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
 if (ok) { S.golfProgram = window.generateGolfProgram(S.golfDays, S.golfLevel, S.golfGoal); S.golfWeek = 1; S.selectedGolfDay = 0; S.sStep = 14; window.render(); }
 }}, 'Générer mon programme'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

function renderGolfProgram(p) {
 if (!S.golfProgram) { S.golfProgram = window.generateGolfProgram(S.golfDays, S.golfLevel, S.golfGoal); }
 if (!S.golfProgram || !S.golfProgram.length) {
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 13; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
 return;
 }
 if (!S.golfWeek || S.golfWeek < 1) S.golfWeek = 1;
 var week = S.golfProgram[S.golfWeek - 1];
 if (!week) return;

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Golf'));
 p.appendChild(h('h1', {html: 'Semaine ' + S.golfWeek + '<br><em>' + week.phase + '</em>'}));
 var goalName = ''; (window.GOLF_GOALS || []).forEach(function(g){ if(g.id===S.golfGoal) goalName=g.name; });
 p.appendChild(h('p', {'class': 'subtitle'}, S.golfDays + ' jours/semaine — ' + goalName + (S.golfHandicap ? ' — HC ' + S.golfHandicap : '')));
 p.appendChild(h('div', {style: 'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, week.notes));

 // Rappel Dave Pelz
 p.appendChild(h('div', {style: 'text-align:center;font-family:Georgia;font-size:11px;font-style:italic;color:var(--grey2,#9A9A90);margin-bottom:12px'}, '"60% du score se joue à moins de 100m du green" — Dave Pelz'));

 // Week navigation
 var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': 'Semaine précédente', disabled: S.golfWeek <= 1, onclick: function(){ S.golfWeek--; S.selectedGolfDay = 0; window.render(); }}, '←'));
 wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.golfWeek + ' / ' + S.golfProgram.length));
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', 'aria-label': 'Semaine suivante', disabled: S.golfWeek >= S.golfProgram.length, onclick: function(){ S.golfWeek++; S.selectedGolfDay = 0; window.render(); }}, '→'));
 p.appendChild(wn);

 // Day tabs
 var _golfSessions = week.sessions || [];
 if (S.selectedGolfDay === undefined || S.selectedGolfDay === null || S.selectedGolfDay >= _golfSessions.length) S.selectedGolfDay = 0;
 var tabs = h('div', {'class': 'day-tabs'});
 _golfSessions.forEach(function(s, i) {
 tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedGolfDay === i ? ' active' : ''), onclick: function(){ S.selectedGolfDay = i; window.render(); }}, 'Jour ' + (i + 1)));
 });
 p.appendChild(tabs);

 var session = _golfSessions[S.selectedGolfDay];
 if (session) {
 var colors = {short_game: 'var(--green,#1A4A1A)', long_game: 'var(--blue,#1A3A6A)', course_play: 'var(--orange,#6A4A1A)', physical: 'var(--red,#5A1010)', mental: 'var(--grey,#6B6B65)'};
 var card = h('div', {style: 'border-left:3px solid ' + (colors[session.type] || 'var(--black)') + ';padding:16px;margin:12px 0;background:var(--ivory2,#F4F4F0)'});
 card.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:12px'}, session.name));
 (session.exercises || []).forEach(function(ex, i) {
 var exDiv = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:13px;font-weight:500'}, (i + 1) + '. ' + ex.name));
 exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, ex.detail));
 if (ex.duration) exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2,#9A9A90);margin-top:2px'}, '⏱ ' + ex.duration));
 card.appendChild(exDiv);
 });
 card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:12px;padding-top:8px;border-top:1px solid var(--ivory3)'}, session.notes));
 p.appendChild(card);
 }

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 13; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ─── STEP 17: TRIATHLON CONFIG ───
function renderTriathlonConfig(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Triathlon / IRONMAN'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>triathlon</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Méthode Jan Frodeno · Patrick Lange · Daniela Ryf · 80/20 Matt Fitzgerald · Joe Friel Training Bible'));

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
 p.appendChild(h('div', {'class': 'section-label'}, 'Discipline à renforcer (optionnel)'));
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, 'Une séance bonus sera ajoutée chaque semaine pour cette discipline'));
 var discGrid = h('div', {style: 'display:flex;gap:10px;flex-wrap:wrap'});
 [{id: 'swim', name: ' Natation'}, {id: 'bike', name: ' Vélo'}, {id: 'run', name: ' Course à pied'}].forEach(function(d) {
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
 bikeWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, ' Vélo km/h'));
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
 p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:10px'}, 'Le nombre de semaines sera adapté automatiquement à votre date de course'));
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
    dateWrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--grey);font-style:italic'}, diffW + ' semaines'));
   } else if (diffW <= 0) {
    dateWrap.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#C0392B'}, 'Date passée'));
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
 estCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:6px'}, '⏱ Temps de course estimé'));
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
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Choisissez votre objectif et votre niveau pour continuer.'));
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
 if (typeof window.generateTriathlonProgram !== 'function') { p.appendChild(h('p', {style:'text-align:center;padding:24px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px'}, 'Module triathlon non chargé. Rechargez la page.')); return; }
 S.triathlonProgram = window.generateTriathlonProgram(S.triathlonGoal, S.triathlonLevel, S.triathlonWeak || null, triopts);
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
 }}, 'Générer mon programme →'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function() { S.sStep = 0; S.sportType = null; window.render(); }, html: backArrow + 'Retour'}));
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
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 17; window.render(); }, html: backArrow + 'Retour'}));
 return;
 }
 var totalWeeks = program.length;
 if (!S.triathlonWeek || S.triathlonWeek < 1) S.triathlonWeek = 1;
 if (S.triathlonWeek > totalWeeks) S.triathlonWeek = totalWeeks;

 var weekData = program[S.triathlonWeek - 1];
 if (!weekData) return;

 var goalObj = null;
 (window.TRIATHLON_GOALS || []).forEach(function(g) { if (g.id === S.triathlonGoal) goalObj = g; });
 var levelObj = null;
 (window.TRIATHLON_LEVELS || []).forEach(function(l) { if (l.id === S.triathlonLevel) levelObj = l; });

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Triathlon / IRONMAN'));
 p.appendChild(h('h1', {html: (goalObj ? goalObj.name : 'Triathlon') + '<br><em>Programme</em>'}));
 var subtitleParts = [totalWeeks + ' semaines', (levelObj ? levelObj.name : ''), '80/20', 'Méthode Jan Frodeno'];
 if (program[0] && program[0].raceDate) { try { var rdDisp = new Date(program[0].raceDate); subtitleParts.unshift('Course : ' + rdDisp.toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric'})); } catch(e) {} }
 p.appendChild(h('p', {'class': 'subtitle'}, subtitleParts.join(' · ')));

 appendWellnessBanner(p);

 // ── Zones de référence (si allures renseignées) ──
 var zref = program[0] && program[0].zoneRef;
 if (zref && (zref.swim || zref.bike || zref.run)) {
  var zoneCard = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
  zoneCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:8px'}, 'Vos zones personnalisées'));
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
   bz.appendChild(h('div', {style: 'font-weight:bold;color:#6A4A1A;margin-bottom:4px'}, ' Vélo'));
   bz.appendChild(h('div', {}, 'Z2 : ' + (zref.bike.z2 || '—')));
   bz.appendChild(h('div', {}, 'Sweetspot : ' + (zref.bike.sweetspot || '—')));
   if (zref.ftp) bz.appendChild(h('div', {style: 'color:#E67E22'}, 'FTP : ' + zref.ftp + 'W'));
   zoneGrid.appendChild(bz);
  }
  if (zref.run) {
   var rz = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'});
   rz.appendChild(h('div', {style: 'font-weight:bold;color:#1A4A1A;margin-bottom:4px'}, ' Run'));
   rz.appendChild(h('div', {}, 'Z2 : ' + (zref.run.z2 || '—')));
   rz.appendChild(h('div', {}, 'Seuil : ' + (zref.run.z4 || '—')));
   zoneGrid.appendChild(rz);
  }
  zoneCard.appendChild(zoneGrid);
  p.appendChild(zoneCard);
 }

 // ── Navigation semaines ──
 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine précédente', onclick: function() {
 if (S.triathlonWeek > 1) { S.triathlonWeek--; S.selectedTriDay = 0; window.render(); }
 }}, '←'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.triathlonWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine suivante', onclick: function() {
 if (S.triathlonWeek < totalWeeks) { S.triathlonWeek++; S.selectedTriDay = 0; window.render(); }
 }}, '→'));
 p.appendChild(weekNav);

 // ── Info phase ──
 var phaseCard = h('div', {style: 'border-left:3px solid ' + (weekData.phaseColor || '#1A3A6A') + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + (weekData.phaseColor || '#1A3A6A') + ';margin-bottom:4px'}, 'Phase : ' + weekData.phase));
 phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, '~' + weekData.totalHours + ' d\'entraînement · 7 jours'));
 if (weekData.isDeload) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#6A4A1A;margin-top:6px;font-weight:bold'}, ' Semaine de récupération — volume réduit'));
 if (weekData.isTaper) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#1A4A1A;margin-top:6px;font-weight:bold'}, ' Affûtage — Volume réduit, intensité maintenue'));
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
 swim: '#1A3A6A', bike: '#6A4A1A', run: '#1A4A1A', brick: '#5A1040', rest: '#555'
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
 transCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.6'}, 'T1 (Nage→Vélo) : déshabiller néo debout, clip chaussures sur pédales (avancé), casque avant de toucher vélo · T2 (Vélo→Run) : rack vélo, enlever casque, changer chaussures en courant · Jan Frodeno gagne souvent 30-60s en transition vs les autres pros'));
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
 if (biCount) sumRow.appendChild(h('span', {'class': 'chip on'}, ' ' + biCount + ' vélo'));
 if (ruCount) sumRow.appendChild(h('span', {'class': 'chip on'}, ' ' + ruCount + ' run'));
 if (brCount) sumRow.appendChild(h('span', {'class': 'chip on'}, ' ' + brCount + ' brick'));
 p.appendChild(sumRow);

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function() { S.sStep = 17; window.render(); }, html: backArrow + 'Modifier la configuration'}));
 appendNutritionModeCTA(p);
}


// ═══════════════════════════════════════
// YOGA MODULE
// ═══════════════════════════════════════

var YOGA_SESSIONS = {
 debutant: [
 { name: 'Salutation au soleil A', duration: '5 min', desc: '5 rounds, alignement fondamental', focus: '\u00c9chauffement global' },
 { name: 'Guerrier I & II', duration: '4 min', desc: '3 cycles chaque c\u00f4t\u00e9, respiration Ujjayi', focus: 'Jambes / Hanches' },
 { name: 'Chien t\u00eate en bas', duration: '3 min', desc: 'Tenir 5 respirations, pousser talons vers sol', focus: 'Ischio-jambiers / \u00c9paules' },
 { name: 'Posture de l\u2019enfant (Balasana)', duration: '2 min', desc: 'Rel\u00e2chement complet, respiration abdominale', focus: 'R\u00e9cup\u00e9ration' },
 { name: 'Torsion couch\u00e9e (Supta Matsyendrasana)', duration: '4 min', desc: '2 min par c\u00f4t\u00e9, genoux au sol', focus: 'Colonne vert\u00e9brale' },
 { name: 'Savasana', duration: '5 min', desc: 'Relaxation compl\u00e8te, scan corporel', focus: 'Int\u00e9gration' }
 ],
 intermediaire: [
 { name: 'Salutation au soleil A+B', duration: '8 min', desc: '3 rounds A + 3 rounds B en vinyasa', focus: '\u00c9chauffement vinyasa' },
 { name: 'Triangle & Demi-lune', duration: '6 min', desc: '\u00c9quilibre dynamique, gainage lat\u00e9ral', focus: '\u00c9quilibre / Obliques' },
 { name: 'Crow pose (Bakasana)', duration: '5 min', desc: '3 tentatives, 15 sec hold objectif', focus: 'Force bras / Concentration' },
 { name: 'Pigeon (Eka Pada Rajakapotasana)', duration: '6 min', desc: '3 min chaque c\u00f4t\u00e9, rel\u00e2chement fl\u00e9chisseurs', focus: 'Hanches' },
 { name: 'Roue (Urdhva Dhanurasana)', duration: '4 min', desc: '3 tentatives, option demi-pont', focus: 'Extension colonne' },
 { name: 'Savasana guid\u00e9', duration: '5 min', desc: 'Visualisation positive, coh\u00e9rence cardiaque', focus: 'R\u00e9cup\u00e9ration' }
 ],
 avance: [
 { name: 'Pranayama Nadi Shodhana', duration: '5 min', desc: 'Respiration alternante, 5 cycles, pr\u00e9paration mentale', focus: 'Centering / Syst\u00e8me nerveux' },
 { name: 'Salutation au soleil A+B en cha\u00eene', duration: '10 min', desc: '5 rounds complets, transition fluide Chaturanga', focus: '\u00c9chauffement complet' },
 { name: 'Guerrier III & Demi-lune \u00e9tendu', duration: '8 min', desc: '\u00c9quilibre avanc\u00e9, gaze fixe (Drishti)', focus: '\u00c9quilibre / Gainage' },
 { name: 'Handstand (Adho Mukha Vrksasana)', duration: '8 min', desc: 'Contre-mur ou libre, alignement poignets-\u00e9paules-hanches', focus: 'Inversion / Force' },
 { name: 'Kapotasana (pigeon roi)', duration: '8 min', desc: '4 min par c\u00f4t\u00e9, ouverture profonde psoas', focus: 'Flexibilit\u00e9 avanc\u00e9e' },
 { name: 'Paschimottanasana tenu', duration: '5 min', desc: 'Flexion avant longue, genoux l\u00e9g\u00e8rement fl\u00e9chis si hernie', focus: 'Cha\u00eene post\u00e9rieure' },
 { name: 'Savasana + Yoga Nidra', duration: '10 min', desc: 'Rotation de conscience, r\u00e9cup\u00e9ration parasympathique', focus: 'Int\u00e9gration profonde' }
 ]
};

var YOGA_WEEKS = [
 {
 phase: 'Fondations',
 theme: 'Postures debout, alignement, respiration',
 focus: 'Ancrage \u00b7 Conscience corporelle \u00b7 Respiration Ujjayi',
 notes: 'Semaine 1 \u2014 Construisez des bases solides. Priorit\u00e9 \u00e0 l\u2019alignement plut\u00f4t qu\u2019\u00e0 la profondeur des postures.'
 },
 {
 phase: '\u00c9quilibre et Force',
 theme: 'Postures sur un pied, demi-lune, guerrier III',
 focus: '\u00c9quilibre dynamique \u00b7 Gainage \u00b7 Concentration',
 notes: 'Semaine 2 \u2014 Travail de l\u2019\u00e9quilibre et de la force fonctionnelle. Utilisez un mur si besoin pour les inversions.'
 },
 {
 phase: 'Ouverture des Hanches & Torsions',
 theme: 'Pigeon, torsions assises, yin profond',
 focus: 'Mobilit\u00e9 hanches \u00b7 Lib\u00e9ration fascias \u00b7 Torsions d\u00e9toxifiantes',
 notes: 'Semaine 3 \u2014 Postures tenues longtemps (Yin). Respirez dans la r\u00e9sistance, ne forcez pas.'
 },
 {
 phase: 'Backbends & Inversions',
 theme: 'Roue, poirier, \u00e9tirements profonds',
 focus: 'Extension colonne \u00b7 \u00c9nergie montante \u00b7 Int\u00e9gration',
 notes: 'Semaine 4 \u2014 Postures avanc\u00e9es avec variantes adapt\u00e9es. D\u00e9butants : demi-pont \u00e0 la place de la roue.'
 }
];

var YOGA_BENEFITS = {
 flexibilite: 'Augmentation de la souplesse musculaire de 35% en 8 semaines (Grabara & Szopa 2015)',
 stress: 'R\u00e9duction cortisol de 30% apr\u00e8s 12 semaines (UCLA 2018)',
 force: 'Am\u00e9lioration gainage core +22% (Crow, Plank, Side Plank \u2014 Ni et al. 2014)',
 sommeil: 'Am\u00e9lioration qualit\u00e9 sommeil (PSQI) chez 55% des pratiquants (Hariprasad et al. 2013)'
};

// ─── STEP 19: YOGA ONBOARDING ───
function renderYogaOnboarding(p) {
 p.appendChild(h('div', {'class': 'eyebrow'}, 'Yoga & Mobilit\u00e9'));
 p.appendChild(h('h1', {html: 'Votre programme<br><em>yoga</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Flexibilit\u00e9, force, \u00e9quilibre et pleine conscience.'));

 // Niveau
 p.appendChild(h('div', {'class': 'section-label'}, window.t('sport.level')));
 var lvlList = h('div', {'class': 'level-list'});
 [
 { id: 'debutant', icon: '\uD83C\uDF31', name: window.t('sport.beginner'), desc: 'Premi\u00e8res postures, respiration consciente, s\u00e9ances de 20-30 min' },
 { id: 'intermediaire', icon: '\uD83C\uDF3F', name: window.t('sport.intermediate'), desc: 'Vinyasa fluide, \u00e9quilibre, force fonctionnelle' },
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
 { id: 'flexibilite', icon: '\uD83E\uDD38', name: 'Flexibilit\u00e9', desc: 'Augmenter la souplesse, lib\u00e9rer les tensions' },
 { id: 'stress', icon: '\uD83E\uDDD8', name: 'Stress & Sommeil', desc: 'R\u00e9duction cortisol, am\u00e9lioration du repos' },
 { id: 'force', icon: '\uD83D\uDCAA', name: 'Force & \u00c9quilibre', desc: 'Gainage fonctionnel, stabilit\u00e9 articulaire' },
 { id: 'recuperation', icon: '\uD83C\uDF1F', name: 'R\u00e9cup\u00e9ration active', desc: 'Compl\u00e9ment sport, mobilit\u00e9, r\u00e9g\u00e9n\u00e9ration' }
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
 nw.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(nw);
 p.appendChild(h('div', {'class': 'num-hint'}, '2 \u00e0 6 jours par semaine'));

 // Dur\u00e9e de s\u00e9ance
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Dur\u00e9e de s\u00e9ance'));
 var durGrid = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px'});
 ['20min', '30min', '45min', '60min'].forEach(function(dur) {
 var isOn = S.yogaDuration === dur;
 durGrid.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), onclick: function(){ S.yogaDuration = dur; window.render(); }}, dur));
 });
 p.appendChild(durGrid);

 // Style pr\u00e9f\u00e9r\u00e9
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Style pr\u00e9f\u00e9r\u00e9'));
 var styleGrid = h('div', {'class': 'card-grid-2'});
 [
 { id: 'hatha', icon: '\u2600\uFE0F', name: 'Hatha', desc: 'S\u00e9ances douces, postures tenues, accessible' },
 { id: 'vinyasa', icon: '\uD83C\uDF00', name: 'Vinyasa', desc: 'Encha\u00eenements dynamiques, flux continu' },
 { id: 'yin', icon: '\uD83C\uDF19', name: 'Yin', desc: 'Postures longues (3-5 min), \u00e9tirements profonds' },
 { id: 'ashtanga', icon: '\uD83D\uDD25', name: 'Ashtanga', desc: 'S\u00e9ries fix\u00e9es, intensit\u00e9 \u00e9lev\u00e9e, discipline stricte' }
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
 p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'S\u00e9lectionnez un niveau et un objectif'));
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
 }}, 'G\u00e9n\u00e9rer mon programme'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 21: YOGA PROGRAM ───
function renderYogaProgram(p) {
 if (!S.yogaLevel) { S.sStep = 19; setTimeout(function() { if (window.render) window.render(); }, 0); return; }
 if (!S.yogaDays) S.yogaDays = 3;
 if (!S.yogaDuration) S.yogaDuration = '30min';
 if (!S.yogaStyle) S.yogaStyle = 'hatha';
 if (!S.yogaWeek) S.yogaWeek = 1;
 if (S.yogaDay === undefined || S.yogaDay === null) S.yogaDay = 0;

 var totalWeeks = 4;
 if (S.yogaWeek > totalWeeks) S.yogaWeek = totalWeeks;
 if (S.yogaWeek < 1) S.yogaWeek = 1;

 var weekData = YOGA_WEEKS[S.yogaWeek - 1];
 var levelKey = S.yogaLevel === 'avance' ? 'avance' : S.yogaLevel === 'intermediaire' ? 'intermediaire' : 'debutant';
 var basePoses = YOGA_SESSIONS[levelKey] || YOGA_SESSIONS.debutant;

 // Filter poses by duration — Savasana TOUJOURS en dernière position (règle coach)
 var maxPoses = S.yogaDuration === '20min' ? 4 : S.yogaDuration === '30min' ? 5 : S.yogaDuration === '45min' ? 6 : 7;
 var savasana = basePoses[basePoses.length - 1]; // Dernier élément = Savasana (toujours inclus)
 var posePool = basePoses.slice(0, basePoses.length - 1); // Tout sauf Savasana
 var bodyPoses = posePool.slice(0, Math.min(maxPoses - 1, posePool.length)); // maxPoses - 1 pour réserver la place Savasana
 var poses = bodyPoses.concat([savasana]); // Savasana toujours en dernier

 // Pregnancy warning
 var pregWarn = getPregnancySportWarning();
 if (pregWarn) {
 var pw = h('div', {style: 'background:var(--redbg,rgba(90,16,16,.06));border-left:4px solid #5A1010;padding:12px 14px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#5A1010;line-height:1.6'});
 pw.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, '\u26A0 Grossesse \u2014 Yoga pr\u00e9natal'));
 pw.appendChild(h('div', {}, pregWarn));
 pw.appendChild(h('div', {style: 'margin-top:6px;font-weight:600'}, '\u00c9viter : Inversions (Navasana, poirier), compression abdominale, d\u00e9cubitus dorsal >20 min. Variantes T2/T3 : postures assises ou en appui lat\u00e9ral.'));
 p.appendChild(pw);
 }

 // Medical warnings
 var med = S.muscuMedical || {};
 if (med.herniaDisc || med.lowerBack) {
 var hw = h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:4px solid #6A4A1A;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#6A4A1A;line-height:1.6'});
 hw.appendChild(h('div', {style: 'font-weight:700;color:#6A4A1A;margin-bottom:4px'}, '\u26A0 Hernie discale / Bas du dos'));
 hw.appendChild(h('div', {}, '\u00c9viter forward fold profond sans genoux fl\u00e9chis. Paschimottanasana : toujours garder une micro-flexion des genoux. Privil\u00e9gier Balasana, torsions douces assises.'));
 p.appendChild(hw);
 }
 if (med.osteoporosis) {
 var ow = h('div', {style: 'background:var(--greenbg,rgba(26,74,26,.06));border-left:4px solid #1A4A1A;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#1A4A1A;line-height:1.6'});
 ow.appendChild(h('div', {style: 'font-weight:700;color:#1A4A1A;margin-bottom:4px'}, '\uD83E\uDDB4 Ost\u00e9oporose'));
 ow.appendChild(h('div', {}, '\u00c9viter flexions extr\u00eames (Paschimottanasana profond), postures sur une jambe sans support. Favoriser postures debout en appui bim\u00e9ral (Guerrier I/II avec support si besoin). Mountain pose, Virabhadrasana I/II b\u00e9n\u00e9fiques pour la densit\u00e9 osseuse.'));
 p.appendChild(ow);
 }
 if (med.knees || med.acl || med.meniscus) {
 var kw = h('div', {style: 'background:var(--bluebg,rgba(26,58,106,.06));border-left:4px solid #1A3A6A;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#0D47A1;line-height:1.6'});
 kw.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, '\uD83E\uDDB5 Genoux / LCA / M\u00e9nisque'));
 kw.appendChild(h('div', {}, '\u00c9viter flexion profonde du genou (lotus complet, Malasana profond). Guerrier II : ne pas d\u00e9passer 90\u00b0. Option : pose h\u00e9ros (Virasana) remplac\u00e9e par Sukhasana si g\u00eane.'));
 p.appendChild(kw);
 }

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Yoga'));
 p.appendChild(h('h1', {html: 'Semaine ' + S.yogaWeek + '<br><em>' + weekData.phase + '</em>'}));

 var objNames = { flexibilite: 'Flexibilit\u00e9', stress: 'Stress & Sommeil', force: 'Force & \u00c9quilibre', recuperation: 'R\u00e9cup\u00e9ration active' };
 var styleNames = { hatha: 'Hatha', vinyasa: 'Vinyasa', yin: 'Yin', ashtanga: 'Ashtanga' };
 p.appendChild(h('p', {'class': 'subtitle'}, (S.yogaDays || '') + ' jours/semaine \u00b7 ' + (S.yogaDuration || '') + ' \u00b7 ' + (styleNames[S.yogaStyle] || S.yogaStyle || '') + ' \u00b7 ' + (objNames[S.yogaObjectif] || '')));

 // Week navigation
 var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
 wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.yogaWeek <= 1, onclick: function(){ if(S.yogaWeek > 1){ S.yogaWeek--; S.yogaDay = 0; window.render(); } }}, '\u2190'));
 wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.yogaWeek + ' / 4'));
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
 tabs.appendChild(h('button', {'class': 'day-tab' + (S.yogaDay === idx ? ' active' : ''), onclick: function(){ S.yogaDay = idx; window.render(); }}, 'Jour ' + (idx + 1)));
 })(di);
 }
 p.appendChild(tabs);

 // Session card
 var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #0A0A09'});
 sessCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#0A0A09;margin-bottom:6px'}, 'S\u00e9ance Yoga'));
 sessCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:4px'}, '\uD83E\uDDD8 S\u00e9ance ' + (S.yogaDay + 1) + ' \u2014 ' + weekData.phase));
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
 benefDiv.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:6px'}, '\uD83D\uDCCA B\u00e9n\u00e9fice \u00e9tudi\u00e9'));
 benefDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.6'}, YOGA_BENEFITS[benefKey]));
 p.appendChild(benefDiv);
 }

 // All benefits summary
 var allBenef = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin:12px 0'});
 allBenef.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, '\uD83C\uDF31 B\u00e9n\u00e9fices du yoga (preuves scientifiques)'));
 var benefLabels = { flexibilite: 'Flexibilit\u00e9', stress: 'Stress/Sommeil', force: 'Force core', sommeil: 'Sommeil' };
 Object.keys(YOGA_BENEFITS).forEach(function(k) {
 var row = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.5;padding:3px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
 row.appendChild(h('span', {style: 'color:#0A0A09;font-weight:600'}, (benefLabels[k] || k) + ' \u2014 '));
 row.appendChild(h('span', {}, YOGA_BENEFITS[k]));
 allBenef.appendChild(row);
 });
 p.appendChild(allBenef);

 p.appendChild(h('div', {style: 'height:12px'}));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 19; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
 appendNutritionModeCTA(p);
}

// ═══════════════════════════════════════
// CYCLISME MODULE
// ═══════════════════════════════════════

var CYCLING_ZONES = [
 { zone: 1, name: 'Récupération active', pct: '< 55% FTP', rpe: '1-2/10', color: '#1A4A1A', desc: 'Pédalage très facile, conversation aisée' },
 { zone: 2, name: 'Endurance de base', pct: '56-75% FTP', rpe: '3-4/10', color: '#1A4A1A', desc: 'Rythme confortable, sortie longue' },
 { zone: 3, name: 'Tempo', pct: '76-90% FTP', rpe: '5-6/10', color: '#6A4A1A', desc: 'Effort soutenu, légèrement inconfortable' },
 { zone: 4, name: 'Seuil (FTP)', pct: '91-105% FTP', rpe: '7-8/10', color: '#6A4A1A', desc: 'À la limite — effort maximal maintenable' },
 { zone: 5, name: 'VO2max', pct: '106-120% FTP', rpe: '8-9/10', color: '#5A1010', desc: 'Intervalles courts, très intense' }
];

var CYCLING_MET = [5, 7, 9, 11, 13];
function cyclingKcal(durationMin, zone, weightKg) {
 var met = CYCLING_MET[Math.min(zone - 1, 4)] || 7;
 return Math.round(met * weightKg * (durationMin / 60));
}

var CYCLING_WORKOUTS = {
 debutant: [
 { day: 'Mardi', type: 'Endurance', duration: 45, zone: 2, desc: 'Sortie plate Z2, cadence 80-90 RPM' },
 { day: 'Jeudi', type: 'Intervalles courts', duration: 40, zone: 4, desc: '5 min Z2 + 4×3min Z4 + 3min récup + 5min Z2' },
 { day: 'Samedi', type: 'Sortie longue', duration: 90, zone: 2, desc: 'Z2 constant, hydratation 500ml/h, alimentation 40-60g glucides/h si >1h' }
 ],
 intermediaire: [
 { day: 'Lundi', type: 'Récupération active', duration: 30, zone: 1, desc: 'Easy spin, rotation hanches, jambes légères' },
 { day: 'Mardi', type: 'Tempo', duration: 60, zone: 3, desc: '2×15min Z3 + 5min récup entre les blocs' },
 { day: 'Jeudi', type: 'Sweet Spot', duration: 75, zone: 4, desc: '3×10min à 88-93% FTP — zone la plus efficace ROI effort' },
 { day: 'Samedi', type: 'Sortie longue qualité', duration: 150, zone: 2, desc: 'Sortie ondulée, 80% Z2 + 20% Z3 sur les côtes' },
 { day: 'Dimanche', type: 'Sortie récup', duration: 60, zone: 1, desc: 'Easy, plat, cadence libre' }
 ]
};

function generateCyclingPlan(level, days) {
 var phases = [
 { name: 'Base aérobie', weeks: [1, 2], color: '#1A3A6A', focus: 'Développer le moteur Z2 — qualité > quantité' },
 { name: 'Développement', weeks: [3, 4, 5], color: '#6A4A1A', focus: 'Introduire tempo et sweet spot' },
 { name: 'Spécifique', weeks: [6, 7], color: '#5A1010', focus: 'Intervalles seuil et VO2max' },
 { name: 'Affûtage', weeks: [8], color: '#1A4A1A', focus: 'Réduction volume — maintien intensité' }
 ];
 var template = (level === 'avance' || level === 'intermediaire') ? CYCLING_WORKOUTS.intermediaire : CYCLING_WORKOUTS.debutant;
 // VO2max override for Spécifique phase (weeks 6-7): replace Sweet Spot Z4 with Z5 intervals
 var vo2maxSession = { day: 'Jeudi', type: 'VO2max', zone: 5, duration: 60, desc: '6×4min à 106-120% FTP + 4min récup — intervalles courts haute intensité' };
 var plan = [];
 for (var w = 1; w <= 8; w++) {
 var phase = phases[0];
 for (var pi = 0; pi < phases.length; pi++) {
 if (phases[pi].weeks.indexOf(w) !== -1) { phase = phases[pi]; break; }
 }
 var isDeload = (w === 4 || w === 8);
 var volFactor = isDeload ? 0.6 : (w <= 2 ? 0.75 : w <= 5 ? 1.0 : 1.1);
 var isSpecific = phase.name === 'Spécifique';
 var maxDays = Math.min(days, template.length);
 var sessions = template.slice(0, maxDays).map(function(s) {
 // During Spécifique phase, replace Sweet Spot (Z4) with VO2max (Z5) — for intermediaire/avance
 if (isSpecific && s.type === 'Sweet Spot' && (level === 'intermediaire' || level === 'avance')) {
 return { day: vo2maxSession.day, type: vo2maxSession.type, duration: Math.round(vo2maxSession.duration * volFactor), zone: vo2maxSession.zone, desc: vo2maxSession.desc };
 }
 return { day: s.day, type: s.type, duration: Math.round(s.duration * volFactor), zone: s.zone, desc: s.desc };
 });
 plan.push({ week: w, phase: phase.name, phaseColor: phase.color, focus: phase.focus, isDeload: isDeload, sessions: sessions });
 }
 return plan;
}

// ─── STEP 22: CYCLISME ONBOARDING ───
function renderCyclingOnboarding(p) {
 var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

 p.appendChild(h('div', {'class': 'eyebrow'}, 'Cyclisme'));
 p.appendChild(h('h1', {html: 'Votre plan<br><em>vélo</em>'}));
 p.appendChild(h('p', {'class': 'subtitle'}, 'Plan basé sur les zones FTP (méthode Andy Coggan)'));

 p.appendChild(h('div', {'class': 'section-label'}, 'Type de vélo'));
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
 { id: 'debutant', icon: '', name: window.t('sport.beginner'), desc: '< 2h par semaine, découverte du cyclisme' },
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
 { id: 'weightloss', icon: '', name: 'Perte de poids', desc: 'Brûler des calories, améliorer la composition corporelle' },
 { id: 'endurance', icon: '', name: 'Endurance de base', desc: 'Développer le moteur aérobie, sorties longues' },
 { id: 'competitive', icon: '', name: 'Sportif compétitif', desc: 'Améliorer FTP, puissance, classement' },
 { id: 'granfondo', icon: '', name: 'Gran Fondo', desc: 'Préparer une cyclosportive ou gran fondo' },
 { id: 'triathlon', icon: '', name: 'Triathlon', desc: 'Segment vélo du triathlon, transitions' }
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
 daysWrap.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(daysWrap);
 p.appendChild(h('div', {'class': 'num-hint'}, '2 à 6 jours par semaine'));

 p.appendChild(h('div', {style: 'height:24px'}));
 p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));

 p.appendChild(h('div', {'class': 'section-label'}, 'FTP actuel en watts (optionnel — laissez vide si inconnu)'));
 var ftpWrap = h('div', {'class': 'num-input-wrap'});
 ftpWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '80', max: '500', placeholder: '—', value: S.cyclingFTP ? String(S.cyclingFTP) : '', inputmode: 'numeric', style: 'width:90px;text-align:center',
 oninput: function(e){ var v = parseInt(e.target.value); S.cyclingFTP = (!isNaN(v) && v > 0) ? v : null; },
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
 h('span', {style: 'color:var(--grey)'}, wLabel + ' · RPE ' + z.rpe)
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

 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:16px'}, 'Dénivelé cible par sortie'));
 var reliefs = [
 { id: 'flat', name: 'Plat', desc: '< 500m D+/100km' },
 { id: 'rolling', name: 'Vallonné', desc: '500-1000m D+/100km' },
 { id: 'mountainous', name: 'Montagneux', desc: '> 1000m D+/100km' }
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
 if (!ok) p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Choisissez votre niveau et votre objectif pour continuer.'));
 p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
 if (!ok) return;
 S.cyclingProgram = generateCyclingPlan(S.cyclingLevel, S.cyclingDays || 3);
 S.cyclingWeek = 1;
 S.selectedCyclingDay = 0;
 S.sStep = 23;
 if (window.BLACKBOX) BLACKBOX.log('cycling_config', {level: S.cyclingLevel, goal: S.cyclingGoal, days: S.cyclingDays, ftp: S.cyclingFTP});
 window.render();
 }}, 'Générer mon plan'));
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: backArrow + 'Retour'}));
}

// ─── STEP 23: CYCLISME PROGRAMME ───
function renderCyclingProgram(p) {
 var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

 if (!S.cyclingProgram || !S.cyclingProgram.length) {
 S.cyclingProgram = generateCyclingPlan(S.cyclingLevel || 'debutant', S.cyclingDays || 3);
 }

 var plan = S.cyclingProgram;
 if (!plan || !plan.length) {
 var backArrowCyc = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
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
 p.appendChild(h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:4px solid #6A4A1A;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6A4A1A;line-height:1.6'}, _pregCycling));
 }

 var weightKg = S.weight || 70;
 var levelNames = { debutant: window.t('sport.beginner'), intermediaire: window.t('sport.intermediate'), avance: window.t('sport.advanced') };
 var goalNames = { weightloss: 'Perte de poids', endurance: 'Endurance de base', competitive: 'Sportif compétitif', granfondo: 'Gran Fondo', triathlon: 'Triathlon' };
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

 appendWellnessBanner(p);

 var med = S.muscuMedical || {};
 var warnings = [];
 if (med.hypertension) warnings.push(' HTA : évitez Z4/Z5 (Valsalva interdit) — restez en Z1-Z3 maximum');
 if (med.herniaDisc || med.lowerBack) warnings.push(' Hernie discale : position aérodynamique déconseillée — vélo droit recommandé, guidon surélevé');
 if (med.knees || med.meniscus) warnings.push(' Gonarthrose / Ménisque : cadence élevée (>90 RPM) recommandée — évitez les grosses relances');
 if (getAge() >= 50) warnings.push(' 50+ : échauffement 15 min minimum obligatoire, zones 1-3 prioritaires, récupération 48h entre séances intenses');
 if (warnings.length) {
 var warnBox = h('div', {style: 'border:1.5px solid #6A4A1A;padding:12px 16px;background:var(--orangebg,rgba(106,74,26,.06));margin-bottom:16px'});
 warnings.forEach(function(w) {
 warnBox.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:#6A4A1A;margin-bottom:4px;line-height:1.5'}, w));
 });
 p.appendChild(warnBox);
 }

 var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine précédente', onclick: function() {
 if (S.cyclingWeek > 1) { S.cyclingWeek--; S.selectedCyclingDay = 0; window.render(); }
 }}, '←'));
 weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.cyclingWeek + ' / ' + totalWeeks));
 weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', 'aria-label': 'Semaine suivante', onclick: function() {
 if (S.cyclingWeek < totalWeeks) { S.cyclingWeek++; S.selectedCyclingDay = 0; window.render(); }
 }}, '→'));
 p.appendChild(weekNav);

 var phaseCard = h('div', {style: 'border-left:3px solid ' + weekData.phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + weekData.phaseColor + ';margin-bottom:4px'}, 'Phase : ' + weekData.phase));
 phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey)'}, weekData.focus));
 if (weekData.isDeload) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#6A4A1A;margin-top:6px;font-weight:bold'}, ' Semaine de récupération — volume réduit de 40%'));
 p.appendChild(phaseCard);

 var zonesToggle = S._cyclingShowZones || false;
 p.appendChild(h('button', {'class': 'btn-back', style: 'font-size:11px;margin:0 0 12px 0', onclick: function(){
 S._cyclingShowZones = !S._cyclingShowZones; window.render();
 }}, zonesToggle ? '▲ Masquer les zones FTP' : '▼ Voir les zones FTP'));
 if (zonesToggle) {
 var zonesRef = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
 zonesRef.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, 'Zones d\'intensité FTP (méthode Coggan)'));
 CYCLING_ZONES.forEach(function(z) {
 zonesRef.appendChild(h('div', {style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:11px'}, [
 h('span', {style: 'color:' + z.color + ';font-weight:bold'}, 'Z' + z.zone + ' ' + z.name + ' · ' + z.pct),
 h('span', {style: 'color:var(--grey)'}, z.desc)
 ]));
 });
 p.appendChild(zonesRef);
 }

 if (!S.cyclingFTP) {
 var ftpBox = h('div', {style: 'border:1px solid #1A4A1A;padding:12px 16px;background:var(--greenbg,rgba(26,74,26,.06));margin-bottom:16px'});
 ftpBox.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;color:#1A4A1A;margin-bottom:6px'}, ' Test FTP recommandé'));
 ftpBox.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.6'}, 'Effectuez un effort maximal de 20 minutes en régime stable. Votre FTP estimée ≈ puissance moyenne sur 20 min × 0,95. Renseignez-la dans la configuration pour afficher vos zones personnalisées.'));
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
 sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:4px'}, zoneData.desc + ' — RPE ' + zoneData.rpe));
 }
 p.appendChild(sessCard);
 }

 p.appendChild(h('div', {style: 'height:12px'}));
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
 p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Equipement disponible'));
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
  p.appendChild(h('div', {'class': 'num-hint', style: 'color:var(--accent,#1A4A1A)'}, 'Pas de barre ? Programme sol adapte avec alternatives.'));
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
  p.appendChild(h('div', {'class': 'num-hint', style: 'color:var(--accent,#1A4A1A)'}, '0 traction ? Programme debute avec les alternatives (negatifs, australien).'));
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
 nw.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
 p.appendChild(nw);
 p.appendChild(h('div', {'class': 'num-hint'}, '2 a 5 jours par semaine'));

 p.appendChild(h('div', {style: 'height:20px'}));
 var ok = S.calisthenicsLevel && Array.isArray(S.calisthenicsGoal) && S.calisthenicsGoal.length > 0;
 if (!ok) {
  p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Choisissez un niveau et au moins un objectif pour continuer.'));
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
 p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
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
  planData = window.generateCalisthenicsPlan(level, skills, pullups, pushups, days, equipment, dips);
 } catch(e) {
  content.appendChild(h('div', {'class': 'card'}, h('div', {style: 'color:red;font-size:13px'}, 'Impossible d\'afficher le programme — réessayez ou rechargez la page. (' + e.message + ')')));
  return;
 }

 // State for current week display
 if (!S.calisthCurrentWeek || S.calisthCurrentWeek < 1) { S.calisthCurrentWeek = 1; }
 if (S.calisthCurrentWeek > planData.totalWeeks) { S.calisthCurrentWeek = planData.totalWeeks; }

 // Gamification: unlock calisthenics badges on program load
 if (window.GAMIFICATION && window.GAMIFICATION.checkCalisthenicsBadges) {
  window.GAMIFICATION.checkCalisthenicsBadges({ currentWeek: S.calisthCurrentWeek, pullups: pullups });
 }

 // ── HEADER ──
 var headerCard = h('div', {'class': 'card', style: 'margin-bottom:16px'});
 headerCard.appendChild(h('div', {'class': 'label-caps', style: 'margin-bottom:4px'}, 'CALLISTHENIE'));
 headerCard.appendChild(h('div', {style: 'font-weight:600;font-size:16px;margin-bottom:4px'}, 'Programme ' + level + ' — ' + days + ' j/sem'));
 var equipStr = equipment.join(', ');
 headerCard.appendChild(h('div', {style: 'font-size:12px;color:var(--grey3)'}, 'Equipement: ' + equipStr + ' | Pull-ups: ' + pullups + ' | Push-ups: ' + pushups + ' | Dips: ' + dips));
 headerCard.appendChild(h('div', {style: 'font-size:12px;color:var(--grey3);margin-top:2px'}, planData.totalWeeks + ' semaines de programme'));
 content.appendChild(headerCard);

 appendWellnessBanner(content);

 // ── PREGNANCY WARNING ──
 var _pregCalisth = getPregnancySportWarning();
 if (_pregCalisth) {
  content.appendChild(h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:4px solid #6A4A1A;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#6A4A1A;line-height:1.6'}, _pregCalisth));
 }

 // ── MEDICAL WARNINGS ──
 if (S.muscuMedical) {
  var warns = [];
  if (S.muscuMedical.shoulders || S.muscuMedical.rotatorCuff) { warns.push('Epaules : progresser avec assistance elastique uniquement, eviter HSPU et planche'); }
  if (S.muscuMedical.hernia || S.muscuMedical.herniaDisc) { warns.push('Hernie : eviter dragon flag, L-sit et human flag (compression discale)'); }
  if (S.muscuMedical.wrists) { warns.push('Poignets : renforcement 4-6 semaines AVANT tout appui'); }
  if (warns.length > 0) {
   var warnDiv = h('div', {style: 'background:rgba(180,100,0,0.1);border:1px solid #6A4A1A;border-radius:2px;padding:12px;margin-bottom:16px'});
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
   barBg.appendChild(h('div', {style: 'height:4px;background:var(--accent,#1A4A1A);width:' + pct + '%;border-radius:2px;transition:width 0.3s'}));
   barWrap.appendChild(barBg);
   skillRow.appendChild(barWrap);
   // Current step description
   if (sk.progressions && sk.progressions[currentStep - 1]) {
    var stepData = sk.progressions[currentStep - 1];
    var stepCard = h('div', {style: 'background:var(--surface,#F4F4F0);padding:8px 12px;border-radius:2px;font-size:12px'});
    stepCard.appendChild(h('div', {style: 'font-weight:600;margin-bottom:2px'}, 'En cours: ' + stepData.name));
    stepCard.appendChild(h('div', {style: 'color:var(--grey3)'}, stepData.sets > 0 ? (stepData.sets + 'x' + stepData.reps + ' — Repos: ' + stepData.rest) : stepData.reps));
    stepCard.appendChild(h('div', {style: 'color:var(--accent,#1A4A1A);margin-top:4px;font-size:11px'}, stepData.coaching || ''));
    skillRow.appendChild(stepCard);
   }
   // Injury alert
   if (sk.injuryAlert) {
    skillRow.appendChild(h('div', {style: 'font-size:11px;color:#5A1010;margin-top:6px;padding-left:8px;border-left:2px solid #5A1010'}, sk.injuryAlert));
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
  }, 'Suiv >');
  if (currentWeek <= 1) { prevBtn.disabled = true; }
  if (currentWeek >= planData.totalWeeks) { nextBtn.disabled = true; }
  navHeader.appendChild(prevBtn);
  var weekLabel = h('div', {style: 'text-align:center'}, [
   h('div', {style: 'font-weight:600;font-size:14px'}, 'Semaine ' + currentWeek + ' / ' + planData.totalWeeks),
   h('div', {style: 'font-size:11px;color:var(--grey3)'}, weekData.macroPhase)
  ]);
  navHeader.appendChild(weekLabel);
  navHeader.appendChild(nextBtn);
  navCard.appendChild(navHeader);
  // Periodization info
  var periodStyle = weekData.isDeload ?
   'background:var(--bluebg,rgba(26,58,106,.06));border-left:3px solid #1A3A6A;padding:8px 12px;font-size:12px;color:#1A3A6A' :
   'background:var(--greenbg,rgba(26,74,26,.06));border-left:3px solid var(--accent,#1A4A1A);padding:8px 12px;font-size:12px;color:var(--accent,#1A4A1A)';
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
    if (ex.rest) { metaRow.appendChild(h('div', {style: 'font-size:11px;color:var(--grey3)'}, 'Repos: ' + ex.rest)); }
    if (ex.skill_link) { metaRow.appendChild(h('div', {style: 'font-size:11px;color:var(--accent,#1A4A1A)'}, 'Skill: ' + ex.skill_link.replace(/_/g, ' '))); }
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
  rulesCard.appendChild(h('div', {style: 'font-size:13px;margin-bottom:6px;padding-left:12px;border-left:2px solid var(--accent,#1A4A1A)'}, rules[ri]));
 }
 content.appendChild(rulesCard);

 // ── BACK BUTTON ──
 content.appendChild(h('button', {'class': 'btn-back', style: 'margin-top:16px', onclick: function(){ S.sStep = 24; window.render(); }}, '< Modifier les objectifs'));
 appendNutritionModeCTA(content);
}

// ─── EXPOSE GLOBALEMENT ───
window.renderWellnessCheckin = renderWellnessCheckin;

})();
