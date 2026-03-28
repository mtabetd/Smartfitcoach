// app-sport.js — MTD: Sport Module
(function(){
'use strict';
var S = window.S;
var h = window.h, txt = window.txt;

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
    if (/soulev[eé].*terre|deadlift|romanian deadlift|rdl|good morning|jefferson|squat barre|back squat|hack squat|presse.*cuisse|leg press|rowing barre|pendlay row|rowing t.?bar|t.?bar row|crunch|sit.?up|ab wheel|roue abdominal|hyperextension/.test(n)) return false;
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
  //        stimulent l'anabolisme osseux (ostéoblastes) et sont BÉNÉFIQUES — NE PAS SUPPRIMER.
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
    return '⚠ Grossesse T1 (sem. 1-13) : Activité physique modérée recommandée (150 min/sem, ACOG 2020). Évitez le sur-échauffement (>38,5°C). Consultez votre obstétricien avant tout programme intensif.';
  } else if (week < 28) {
    // T2 : veine cave — décubitus dorsal contre-indiqué
    return '⚠ Grossesse T2 (sem. 14-27, ACOG 2020) : (1) Évitez le décubitus dorsal prolongé >20 min — compression de la veine cave inférieure. (2) Pas de Valsalva (squat lourd, soulevé de terre) — risque de chute de pression. (3) Sports de contact contre-indiqués. Exercices recommandés : natation, marche, vélo stationnaire, yoga prénatal.';
  } else {
    // T3 : mêmes contre-indications + risque chute de l'équilibre
    return '⚠ Grossesse T3 (sem. 28+, ACOG 2020) : (1) Décubitus dorsal INTERDIT. (2) Valsalva interdit (soulevé de terre, squat lourd, développé couché). (3) Sports de contact et à risque de chute contre-indiqués. (4) Équilibre altéré — préférez exercices guidés ou en appui. Consultez votre obstétricien avant chaque modification du programme.';
  }
}

// ─── PROGRAM GENERATION ───
function generateSportProgram() {
  var days = S.sportDays;
  var level = (window.SPORT_LEVELS || []).find(function(l){ return l.id === S.sportLevel; });
  var program = [];

  // Adjust splits based on goals
  var hasCardio = S.sportGoals.some(function(g){ return g === 'endurance' || g === 'weightloss' || g === 'shred'; });
  var hasMuscle = S.sportGoals.some(function(g){ return g === 'muscle'; });
  var hasShred = S.sportGoals.indexOf('shred') !== -1;
  var hasEndurance = S.sportGoals.indexOf('endurance') !== -1;
  var hasWeightloss = S.sportGoals.indexOf('weightloss') !== -1;
  var hasFlexibility = S.sportGoals.indexOf('flexibility') !== -1;

  // Map zone names to exercise categories
  var zoneToCategory = {
    'Poitrine': 'chest', 'Dos': 'back', 'Épaules': 'shoulders',
    'Bras': ['biceps', 'triceps'], 'Abdominaux': 'abs',
    'Jambes': 'legs', 'Fessiers': 'glutes', 'Cardio': 'cardio'
  };

  // Sort zones by priority (highest first)
  var priorityZones = Object.keys(S.sportFocus)
    .filter(function(z){ return S.sportFocus[z] > 0; })
    .sort(function(a, b){ return S.sportFocus[b] - S.sportFocus[a]; });

  // Flatten zone name to categories array
  function zoneCategories(zoneName) {
    var cat = zoneToCategory[zoneName];
    if (!cat) return [];
    return Array.isArray(cat) ? cat : [cat];
  }

  // Determine exercise count based on priority
  // Priority 5 = 3-4, 4 = 3, 3 = 2-3, 2 = 2, 1 = 1-2
  function exerciseCountForPriority(pri) {
    if (pri >= 5) return 3 + Math.round(Math.random());
    if (pri === 4) return 3;
    if (pri === 3) return 2 + Math.round(Math.random());
    if (pri === 2) return 2;
    return 1 + Math.round(Math.random());
  }

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
    if (pregTri) {
      pregForbidden = pregTri.trimester.forbiddenExercises || [];
      pregIntensityFactor = pregTri.trimester.intensityFactor || 0.5;
    }
  }
  // Cycle phase: get intensity factor for menstrual cycle phase (non-pregnant women)
  var cycleIntensityFactor = 1.0;
  var cyclePhaseInfo = null;
  if (!S.pregnant && S.sex === 'femme' && S.cycleTracking && window.getCurrentCyclePhase) {
    cyclePhaseInfo = window.getCurrentCyclePhase();
    if (cyclePhaseInfo && cyclePhaseInfo.phase.intensityFactor) {
      cycleIntensityFactor = cyclePhaseInfo.phase.intensityFactor;
    }
  }

  // Generate exercises for each day
  var maxLv = S.sportLevel === 'beginner' ? 2 : S.sportLevel === 'intermediate' ? 3 : 4;
  // During pregnancy, cap level
  if (pregTri) maxLv = Math.min(maxLv, 2);

  for (var d = 0; d < days; d++) {
    var groups = daySplits[d];
    if (!groups.length) continue;
    var dayExercises = [];

    groups.forEach(function(group) {
      var pool = window.EXERCISES[group] || [];
      var available = pool.filter(function(ex){ return ex.lv <= maxLv; });
      if (!available.length) available = pool.slice();

      // Pregnancy: filter forbidden exercises
      if (pregTri && pregForbidden.length > 0) {
        available = available.filter(function(ex) {
          var exName = ex.n.toLowerCase();
          for (var fi = 0; fi < pregForbidden.length; fi++) {
            if (exName.indexOf(pregForbidden[fi].toLowerCase()) !== -1) return false;
          }
          return true;
        });
      }

      // Medical restrictions: filter exercises based on muscuMedical profile
      if (S.muscuMedical && S.muscuMedical.done) {
        var beforeFilter = available.length;
        available = available.filter(function(ex){ return filterExerciseByMedical(ex, S.muscuMedical); });
        // If filter removed everything, restore original pool to avoid empty day
        if (available.length === 0) available = pool.filter(function(ex){ return ex.lv <= maxLv; }).slice();
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

      // Cycle-based offset: rotate exercise selection each cycle (guard against NaN)
      var poolRemainder = available.length - count;
      var cycleOffset = poolRemainder > 0 ? ((S.muscuCycle || 1) - 1) % poolRemainder : 0;
      for (var i = 0; i < count; i++) {
        var ex = Object.assign({}, available[(i + cycleOffset) % available.length]);

        // Override rest based on goals
        if (restOverride) ex.rest = restOverride;

        // Pregnancy: longer rest
        if (pregTri) ex.rest = '90-120s';
        // Cycle phase: reduce sets during low-intensity phases (luteal/menstruation)
        if (!pregTri && cycleIntensityFactor < 0.9 && typeof ex.sets === 'number') {
          ex.sets = Math.max(2, Math.round(ex.sets * cycleIntensityFactor));
        }

        // Add rep suffix for shred/weightloss
        if (repSuffix && ex.sets) ex.sets = ex.sets + repSuffix;

        // Add superset note for shred
        if (supersetNote && i > 0 && i % 2 === 0) ex.n = ex.n + supersetNote;

        dayExercises.push(ex);
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

    // ─── Duration-based exercise count cap and sets adjustment ───
    if (S.sportSessionDuration) {
      var durMax, durSetsTarget;
      if (S.sportSessionDuration === '45min')      { durMax = 5;  durSetsTarget = 3; }
      else if (S.sportSessionDuration === '1h')    { durMax = 6;  durSetsTarget = 3; }
      else if (S.sportSessionDuration === '1h15')  { durMax = 7;  durSetsTarget = 4; }
      else                                          { durMax = 8;  durSetsTarget = 4; } // 1h30

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
      for (var s = 0; s < starCount; s++) stars += '★';
      focusParts.push(label + (stars ? ' ' + stars : ''));
    });
    var focusLabel = focusParts.join(' · ');

    program.push({
      name: 'Jour ' + (d + 1),
      focus: focusLabel,
      exercises: dayExercises
    });
  }

  return program;
}

// ─── RENDER ───
window.SPORT = {
  render: function(p) {
    var content = h('div', {'class': 'fade-in'});

    // Header with progress (only shown after step 0, not on intro pages)
    if (S.sStep > 0 && S.sStep !== 15 && S.sStep !== 16 && S.sStep !== 20) {
      var hdr = h('header', {'class': 'header'});
      var sportLabel = S.sportType === 'crossfit' ? 'Cross Training' : S.sportType === 'running' ? 'Running' : S.sportType === 'hyrox' ? 'Hyrox' : S.sportType === 'padel' ? 'Padel' : S.sportType === 'golf' ? 'Golf' : S.sportType === 'triathlon' ? 'Triathlon / IRONMAN' : S.sportType === 'yoga' ? 'Yoga & Mobilit\u00e9' : S.sportType === 'cycling' ? 'Cyclisme' : S.sportType === 'calisthenics' ? 'Callisth\u00e9nie' : 'Musculation';
      hdr.appendChild(h('div', {'class': 'logo', html: 'MTD<span>' + sportLabel + '</span>'}));
      var totalSteps = S.sportType === 'crossfit' ? 2 : S.sportType === 'running' ? 2 : S.sportType === 'hyrox' ? 2 : S.sportType === 'padel' ? 2 : S.sportType === 'golf' ? 2 : S.sportType === 'triathlon' ? 2 : S.sportType === 'yoga' ? 2 : S.sportType === 'cycling' ? 2 : S.sportType === 'calisthenics' ? 2 : 4;
      var currentDisplay = S.sportType === 'crossfit' ? S.sStep - 4 : S.sportType === 'running' ? S.sStep - 6 : S.sportType === 'hyrox' ? S.sStep - 8 : S.sportType === 'padel' ? S.sStep - 10 : S.sportType === 'golf' ? S.sStep - 12 : S.sportType === 'triathlon' ? S.sStep - 16 : S.sportType === 'yoga' ? S.sStep - 18 : S.sportType === 'cycling' ? S.sStep - 21 : S.sportType === 'calisthenics' ? S.sStep - 23 : S.sStep;
      hdr.appendChild(h('div', {'class': 'step-indicator'}, 'Étape ' + currentDisplay + ' / ' + totalSteps));
      p.appendChild(hdr);
      var pb = h('div', {'class': 'progress-bar'});
      pb.appendChild(h('div', {'class': 'progress-fill', style: 'width:' + (currentDisplay / totalSteps * 100) + '%'}));
      p.appendChild(pb);
    }

    if (S.sStep === 0) renderObjectif(content);              // Type selection
    else if (S.sStep === 20) renderMuscuMedicalQ(content);   // Medical questionnaire muscu
    else if (S.sStep === 16) renderChargesQuestionnaire(content); // Charges questionnaire
    else if (S.sStep === 15) renderDedicatedPrograms(content); // Dedicated programs
    else if (S.sStep === 1) renderMusculationGoals(content);  // Muscu objectives
    else if (S.sStep === 2) renderMusculationLevel(content);  // Muscu level
    else if (S.sStep === 3) renderMusculationZones(content);  // Muscu zones
    else if (S.sStep === 4) renderMusculationProgram(content); // Muscu program
    else if (S.sStep === 5) renderCrossfitLevel(content);     // CF level
    else if (S.sStep === 6) renderCrossfitProgram(content);   // CF program
    else if (S.sStep === 7) renderRunningConfig(content);     // Running questionnaire
    else if (S.sStep === 8) renderRunningProgram(content);    // Running program
    else if (S.sStep === 9) renderHyroxConfig(content);       // Hyrox questionnaire
    else if (S.sStep === 10) renderHyroxProgram(content);     // Hyrox program
    else if (S.sStep === 11) renderPadelConfig(content);      // Padel questionnaire
    else if (S.sStep === 12) renderPadelProgram(content);     // Padel program
    else if (S.sStep === 13) renderGolfConfig(content);       // Golf questionnaire
    else if (S.sStep === 14) renderGolfProgram(content);      // Golf program
    else if (S.sStep === 17) renderTriathlonConfig(content);  // Triathlon questionnaire
    else if (S.sStep === 18) renderTriathlonProgram(content); // Triathlon program
    else if (S.sStep === 19) renderYogaOnboarding(content);  // Yoga questionnaire
    else if (S.sStep === 21) renderYogaProgram(content);     // Yoga program
    else if (S.sStep === 22) renderCyclingOnboarding(content); // Cycling questionnaire
    else if (S.sStep === 23) renderCyclingProgram(content);    // Cycling program
    else if (S.sStep === 24) { renderCalisthenicsOnboarding(content); } // Calisthenics onboarding
    else if (S.sStep === 25) { renderCalisthenicsProgram(content); }   // Calisthenics program

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
  {t:"Chaque champion a un jour \u00e9t\u00e9 un comp\u00e9titeur qui a refus\u00e9 d'abandonner.",a:"Rocky Balboa"},
  {t:"Le sport ne forge pas le caract\u00e8re. Il le r\u00e9v\u00e8le.",a:"Heywood Broun"},
  {t:"La discipline est le pont entre les objectifs et l'accomplissement.",a:"Jim Rohn"},
  {t:"Le sport va chercher la peur pour la dominer, la fatigue pour en triompher.",a:"Pierre de Coubertin"},
  {t:"Seuls ceux qui risquent d'aller trop loin peuvent d\u00e9couvrir jusqu'o\u00f9 on peut aller.",a:"T.S. Eliot"},
  {t:"Un champion est quelqu'un qui se rel\u00e8ve quand il ne peut pas.",a:"Jack Dempsey"},
  {t:"La pers\u00e9v\u00e9rance n'est pas une longue course. C'est plusieurs courtes courses l'une apr\u00e8s l'autre.",a:"Walter Elliot"},
  {t:"La victoire appartient au plus pers\u00e9v\u00e9rant.",a:"Napol\u00e9on Bonaparte"},
  {t:"Vous n'\u00eates qu'\u00e0 un entra\u00eenement d'une bonne humeur.",a:"Inconnu"},
  {t:"La sueur d'aujourd'hui est la force de demain.",a:"Inconnu"}
];

// ─── STEP 0: TYPE SELECTION ONLY ───
function renderObjectif(p) {
  // Sport splash with random quote
  if (!S.sportSplashDone) {
    var q = SPORT_QUOTES[Math.floor(Math.random() * SPORT_QUOTES.length)];
    var splash = h('div', {style: 'text-align:center;padding:60px 24px 40px'});
    splash.appendChild(h('div', {'class': 'splash-logo'}, 'MTD'));
    splash.appendChild(h('div', {'class': 'splash-sub'}, 'Sport'));
    splash.appendChild(h('div', {'class': 'splash-line'}));
    var quoteDiv = h('div', {'class': 'splash-quote'});
    quoteDiv.appendChild(h('em', {}, '\u201C' + q.t + '\u201D'));
    quoteDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-top:12px'}, '\u2014 ' + q.a));
    splash.appendChild(quoteDiv);
    splash.appendChild(h('button', {'class': 'splash-btn btn-primary', style: 'margin-top:32px', onclick: function(){ S.sportSplashDone = true; if(window.BLACKBOX)BLACKBOX.log('sport_splash_done'); window.render(); }}, 'Commencer'));
    p.appendChild(splash);
    return;
  }

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Sport'));
  p.appendChild(h('h1', {html: 'Votre<br><em>programme</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Choisissez votre type de programme sportif.'));

  p.appendChild(h('div', {'class': 'section-label'}, 'Type de programme'));
  var typeGrid = h('div', {'class': 'card-grid-2'});

  // Musculation - clicking goes to medical questionnaire first (step 20)
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'musculation';
    S.sStep = 20;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'musculation'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '\uD83C\uDFCB\uFE0F'),
    h('div', {'class': 'card-name'}, 'Musculation'),
    h('div', {'class': 'card-sub'}, 'Programme cibl\u00e9 par groupes musculaires'),
    h('div', {'class': 'card-tag'}, 'S\u00e8che \u00b7 Masse \u00b7 Force \u00b7 Endurance')
  ]));

  // Cross Training - clicking goes directly to CF level (step 5)
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'crossfit';
    S.sStep = 5;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'crossfit'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '\u26A1'),
    h('div', {'class': 'card-name'}, 'Cross Training'),
    h('div', {'class': 'card-sub'}, 'Halt\u00e9rophilie \u00b7 WOD \u00b7 Gymnastique'),
    h('div', {'class': 'card-tag'}, '100 WODs \u00b7 Cycles 6 semaines \u00b7 Scaled/Inter/RX')
  ]));

  // Running card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'running';
    S.sStep = 7;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'running'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '🏃'),
    h('div', {'class': 'card-name'}, 'Running'),
    h('div', {'class': 'card-sub'}, 'Plan d\'entraînement course à pied'),
    h('div', {'class': 'card-tag'}, '5K · 10K · Semi · Marathon · Trail')
  ]));

  // Hyrox card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'hyrox';
    S.sStep = 9;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'hyrox'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '🔥'),
    h('div', {'class': 'card-name'}, 'Hyrox'),
    h('div', {'class': 'card-sub'}, 'Préparation Hyrox complète'),
    h('div', {'class': 'card-tag'}, '8 stations · Run · Simulation')
  ]));

  // Padel card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'padel';
    S.sStep = 11;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'padel'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '🎾'),
    h('div', {'class': 'card-name'}, 'Padel'),
    h('div', {'class': 'card-sub'}, 'Programme technique et physique padel'),
    h('div', {'class': 'card-tag'}, 'Technique · Tactique · Match · Physique')
  ]));

  // Golf card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'golf';
    S.sStep = 13;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'golf'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '⛳'),
    h('div', {'class': 'card-name'}, 'Golf'),
    h('div', {'class': 'card-sub'}, 'Progresser au golf — méthode Dave Pelz'),
    h('div', {'class': 'card-tag'}, 'Petit jeu · Long jeu · Parcours · Mental')
  ]));

  // Triathlon / IRONMAN card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'triathlon';
    S.sStep = 17;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'triathlon'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '🏊'),
    h('div', {'class': 'card-name'}, 'Triathlon / IRONMAN'),
    h('div', {'class': 'card-sub'}, 'Programme Jan Frodeno · Patrick Lange · Daniela Ryf'),
    h('div', {'class': 'card-tag'}, 'Sprint · Olympic · 70.3 · IRONMAN 140.6')
  ]));

  // Yoga & Mobilité card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'yoga';
    S.sStep = 19;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'yoga'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '\uD83E\uDDD8'),
    h('div', {'class': 'card-name'}, 'Yoga & Mobilit\u00e9'),
    h('div', {'class': 'card-sub'}, 'Flexibilit\u00e9, force, \u00e9quilibre, pleine conscience'),
    h('div', {'class': 'card-tag'}, 'Hatha \u00b7 Vinyasa \u00b7 Yin \u00b7 Ashtanga')
  ]));

  // Cyclisme card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'cycling';
    S.sStep = 22;
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'cycling'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '\uD83D\uDEB4'),
    h('div', {'class': 'card-name'}, 'Cyclisme'),
    h('div', {'class': 'card-sub'}, 'Route, VTT, indoor \u2014 am\u00e9liore l\'endurance et la puissance'),
    h('div', {'class': 'card-tag'}, 'Route \u00b7 VTT \u00b7 Indoor \u00b7 Gravel \u00b7 FTP')
  ]));

  // Callisthénie card
  typeGrid.appendChild(h('div', {'class': 'sel-card', style:'cursor:pointer', onclick: function(){
    S.sportType = 'calisthenics';
    S.sStep = 24;
    S.calisthenicsOnboardingStep = 'A';
    if (window.BLACKBOX) BLACKBOX.log('sport_type', {type: 'calisthenics'});
    window.render();
  }}, [
    h('span', {'class': 'card-icon'}, '\uD83D\uDCAA'),
    h('div', {'class': 'card-name'}, 'Callisth\u00e9nie'),
    h('div', {'class': 'card-sub'}, 'Street workout, mouvements au poids du corps'),
    h('div', {'class': 'card-tag'}, 'Muscle-up \u00b7 Handstand \u00b7 Planche \u00b7 Front Lever')
  ]));

  p.appendChild(typeGrid);

  // No Continue button needed - cards auto-navigate
}

// ─── STEP 20: QUESTIONNAIRE MÉDICAL MUSCU ───
function renderMuscuMedicalQ(p) {
  var med = S.muscuMedical;

  // Header with back button
  var hdr = h('div', {style: 'display:flex;align-items:center;gap:12px;margin-bottom:20px'});
  hdr.appendChild(h('button', {'class': 'btn-back', style: 'margin:0', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
  hdr.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--grey)'}, 'Évaluation médicale'));
  p.appendChild(hdr);

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
  p.appendChild(h('h1', {html: '\uD83C\uDFE5 Bilan<br><em>médical muscu</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Avant de générer votre programme, aidez-nous à adapter les exercices à votre situation physique.'));

  // ─── Section 1 : Zones douloureuses ───
  p.appendChild(h('div', {'class': 'section-label'}, 'Avez-vous des douleurs ou fragilités ?'));

  var zonesData = [
    {key: 'shoulders', label: 'Épaules',           icon: '💪'},
    {key: 'elbows',    label: 'Coudes',             icon: '🦾'},
    {key: 'wrists',    label: 'Poignets',           icon: '✋'},
    {key: 'neck',      label: 'Nuque/Cervicales',   icon: '🧠'},
    {key: 'upperBack', label: 'Haut du dos',        icon: '🔝'},
    {key: 'lowerBack', label: 'Bas du dos',         icon: '⬇'},
    {key: 'hips',      label: 'Hanches',            icon: '🦴'},
    {key: 'knees',     label: 'Genoux',             icon: '🦵'},
    {key: 'ankles',    label: 'Chevilles',          icon: '🦶'},
    {key: 'feet',      label: 'Pieds (fasciite)',   icon: '🦵'}
  ];

  var zonesGrid = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px'});
  zonesData.forEach(function(z) {
    var active = med[z.key];
    var chip = h('div', {
      style: 'padding:8px 14px;border-radius:20px;border:1.5px solid ' + (active ? '#C0392B' : 'var(--border)') + ';background:' + (active ? '#FFEBEE' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:' + (active ? '#C0392B' : 'var(--text)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
      onclick: (function(key){ return function(){ S.muscuMedical[key] = !S.muscuMedical[key]; window.render(); }; })(z.key)
    }, z.icon + ' ' + z.label);
    zonesGrid.appendChild(chip);
  });
  p.appendChild(zonesGrid);

  // ─── Section 2 : Antécédents diagnostiqués ───
  p.appendChild(h('div', {'class': 'section-label'}, 'Avez-vous un diagnostic confirmé ?'));

  var antecedentsData = [
    {key: 'herniaDisc',           label: 'Hernie discale (IRM)'},
    {key: 'herniaInguinal',       label: 'Hernie inguinale'},
    {key: 'rotatorCuff',          label: 'Déchirure coiffe des rotateurs'},
    {key: 'acl',                  label: 'LCA opéré/fragilisé'},
    {key: 'osteoporosis',         label: 'Ostéoporose'},
    {key: 'hypertension',         label: 'HTA sévère (≥180/110)'},
    {key: 'rheumatoidArthritis',  label: 'Polyarthrite rhumatoïde (PR)'},
    {key: 'fibromyalgia',         label: 'Fibromyalgie'},
    {key: 'meniscus',             label: 'Ménisque lésé/opéré'},
    {key: 'spondylarthritis',     label: 'Spondylarthrite ankylosante'},
    {key: 'kneeOsteoarthritis',   label: 'Gonarthrose (arthrose du genou)'},
    {key: 'epicondylitis',        label: 'Épicondylite latérale (tennis elbow)'}
  ];

  var antGrid = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px'});
  antecedentsData.forEach(function(a) {
    var active = med[a.key];
    var chip = h('div', {
      style: 'padding:8px 14px;border-radius:20px;border:1.5px solid ' + (active ? '#C0392B' : 'var(--border)') + ';background:' + (active ? '#FFEBEE' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:' + (active ? '#C0392B' : 'var(--text)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
      onclick: (function(key){ return function(){ S.muscuMedical[key] = !S.muscuMedical[key]; window.render(); }; })(a.key)
    }, a.label);
    antGrid.appendChild(chip);
  });
  p.appendChild(antGrid);

  // ─── Section 3 : Niveau de douleur général (si au moins une zone cochée) ───
  var hasAnyZone = zonesData.some(function(z){ return med[z.key]; });
  if (hasAnyZone) {
    p.appendChild(h('div', {'class': 'section-label'}, 'Quel est l\'intensité générale ?'));
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
        style: 'padding:8px 16px;border-radius:20px;border:1.5px solid ' + (active ? '#C0392B' : 'var(--border)') + ';background:' + (active ? '#FFEBEE' : 'var(--ivory2)') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:' + (active ? '#C0392B' : 'var(--text)') + ';font-weight:' + (active ? '600' : '400') + ';user-select:none',
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
    var warn = h('div', {style: 'background:#FFEBEE;border-left:4px solid #C0392B;padding:12px 14px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#7B1A1A;line-height:1.6'});
    warn.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, '\u26A0 Douleur sévère ou antécédent grave détecté. Nous adapterons le programme en mode réhabilitation.'));
    warn.appendChild(h('strong', {}, 'Consultez impérativement un médecin ou kinésithérapeute avant de reprendre la musculation lourde.'));
    p.appendChild(warn);
  }

  // ─── Bouton Continuer ───
  p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
    S.muscuMedical.done = true;
    S.sStep = 16;
    window.render();
  }}, 'Continuer \u2192'));

  // ─── Lien Passer ───
  var skipLink = h('div', {
    style: 'text-align:center;margin-top:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);text-decoration:underline;cursor:pointer',
    onclick: function(){
      S.muscuMedical.done = true;
      S.sStep = 16;
      window.render();
    }
  }, 'Passer (aucune douleur)');
  p.appendChild(skipLink);
}

// ─── STEP 16: QUESTIONNAIRE CHARGES ───
function renderChargesQuestionnaire(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
  p.appendChild(h('h1', {html: '\u00c9valuation<br><em>des charges</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Renseignez vos charges actuelles pour adapter vos programmes. Indiquez la charge max pour 8-10 reps propres.'));

  // Medical/age safety warnings
  var hasDiabetes = S.medical && (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1);
  if (hasDiabetes) {
    p.appendChild(h('div', {style: 'background:#FFF3E0;border-left:4px solid #E67E22;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",sans-serif;font-size:12px'}, [
      h('div', {style: 'font-weight:700;color:#E67E22;margin-bottom:4px'}, '\u26A0 Diabète — Précautions sportives'),
      h('div', {style: 'color:#5D4037'}, 'Mesurez votre glycémie avant/après chaque séance. Évitez l\'entraînement si glycémie < 4,0 mmol/L ou > 14,0 mmol/L. Gardez toujours une source de sucres rapides à portée de main. Intensité progressive recommandée (RPE max 7/10 les 4 premières semaines).')
    ]));
  }
  if (S.age >= 50) {
    p.appendChild(h('div', {style: 'background:#E8F5E9;border-left:4px solid #27AE60;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",sans-serif;font-size:12px'}, [
      h('div', {style: 'font-weight:700;color:#27AE60;margin-bottom:4px'}, '\uD83D\uDCAA Athlète 50+ — Adaptations recommandées'),
      h('div', {style: 'color:#1B5E20'}, 'Échauffement prolongé 15-20 min (vs 5-10 min standard). Décharge toutes les 4-5 semaines (vs 6 semaines). Préférez machines guidées aux barres libres pour les charges maximales. Récupération inter-séance 48-72h minimum. Contrôle médical annuel conseillé.')
    ]));
  }
  if (S.pregnant) {
    p.appendChild(h('div', {style: 'background:#FCE4EC;border-left:4px solid #E91E63;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",sans-serif;font-size:12px'}, [
      h('div', {style: 'font-weight:700;color:#E91E63;margin-bottom:4px'}, '\uD83E\uDD30 Grossesse — Exercices autorisés seulement'),
      h('div', {style: 'color:#880E4F'}, 'Évitez les charges lourdes, exercices allongés sur le dos (après 20 SA), abdominaux hyperpressifs, sauts et HIIT intense. Privilégiez marche, natation, yoga prénatal, Kegel. Consultez votre médecin avant tout entraînement.')
    ]));
  }

  if (Object.keys(S.muscuStrengthProfile).length === 0) {
    var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
    var saved = localStorage.getItem('mtd_muscu_strength_' + userId);
    if (saved) { try { S.muscuStrengthProfile = JSON.parse(saved); } catch(e) {} }
  }

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
    nameCol.appendChild(h('div', {style: 'font-family:Georgia;font-size:14px'}, exDef.icon + ' ' + exDef.name));
    nameCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--grey);margin-top:2px'}, exDef.muscle));
    row.appendChild(nameCol);
    var inputWrap = h('div', {style: 'display:flex;align-items:center;gap:4px;flex-shrink:0'});
    var inp = h('input', {
      type: 'number', step: '2.5', min: '0', max: '500',
      value: currentVal ? String(currentVal) : '',
      placeholder: '\u2014',
      style: 'width:60px;padding:6px 8px;border:1px solid var(--border);font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory)',
      onchange: (function(key) { return function(e) {
        var v = parseFloat(e.target.value);
        if (!isNaN(v) && v >= 0) S.muscuStrengthProfile[key] = v;
        else delete S.muscuStrengthProfile[key];
        var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
        try { localStorage.setItem('mtd_muscu_strength_' + uid, JSON.stringify(S.muscuStrengthProfile)); } catch(e2) { console.warn('[muscu_strength] localStorage error:', e2); }
        if (!isNaN(v) && v > 0 && window.PERF_HISTORY) {
          var repsVal = S.muscuStrengthProfile[key + '_reps'] || 8;
          PERF_HISTORY.recordMuscuStrength(key, v, repsVal);
        }
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
      style: 'width:38px;padding:6px 4px;border:1px solid var(--border);font-family:Georgia;font-size:12px;text-align:center;background:var(--ivory);margin-left:4px',
      onchange: (function(rkey, wkey) { return function(e) {
        var rv = parseInt(e.target.value);
        if (!isNaN(rv) && rv >= 1 && rv <= 30) S.muscuStrengthProfile[rkey] = rv;
        var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
        try { localStorage.setItem('mtd_muscu_strength_' + uid, JSON.stringify(S.muscuStrengthProfile)); } catch(e2) { console.warn('[muscu_strength_reps] localStorage error:', e2); }
      }; })(repKey, exDef.key)
    });
    inputWrap.appendChild(repInp);
    inputWrap.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'reps'));
    if (currentVal && currentVal > 0) {
      var thresh = strengthThresholds[exDef.key] || {low:0.5,mid:1.0};
      var ratio = currentVal / bodyWeight;
      var lbl = ratio < thresh.low ? 'Débutant' : ratio < thresh.mid ? 'Intermédiaire' : 'Avancé';
      var col = ratio < thresh.low ? '#E67E22' : ratio < thresh.mid ? '#2980B9' : '#27AE60';
      // Epley formula: 1RM = weight × (1 + reps/30) — accurate for 1-15 reps
      var usedReps = S.muscuStrengthProfile[repKey] || 8;
      var est1rm = Math.round(currentVal * (1 + usedReps / 30) / 2.5) * 2.5;
      var rightCol = h('div', {style: 'text-align:right;flex-shrink:0'});
      rightCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:' + col}, lbl));
      rightCol.appendChild(h('div', {style: 'font-family:Georgia;font-size:11px;color:var(--grey);margin-top:2px'}, '~1RM : ' + est1rm + ' kg'));
      row.appendChild(rightCol);
    }
    grid.appendChild(row);
  });
  p.appendChild(grid);
  p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);font-style:italic;margin-bottom:16px'}, 'Laissez vide les exercices que vous ne pratiquez pas. Indiquez la charge ET le nombre de reps pour un calcul précis du 1RM (formule d\'Epley : charge × (1 + N/30)).'));

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){ S.sStep = 15; window.render(); }}, 'Continuer'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 15: PROGRAMMES DÉDIÉS ───
function renderDedicatedPrograms(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
  p.appendChild(h('h1', {html: 'Programmes<br><em>dédiés</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'S\u00e9ances cibl\u00e9es, vari\u00e9es (A/B), pr\u00eates \u00e0 l\u2019emploi.'));

  // ─── SUIVI 6 SEMAINES ───
  renderWeekTracker(p);

  var allDedicated = [
    {key: 'fessiers_dedied', icon: '\uD83C\uDF51'},
    {key: 'abdos_dedied',    icon: '\u26A1'},
    {key: 'biceps_dedied',   icon: '\uD83D\uDCAA'},
    {key: 'triceps_dedied',  icon: '\uD83D\uDD31'}
  ];

  allDedicated.forEach(function(item) {
    var prog = window.NFC_PROGRAMS && window.NFC_PROGRAMS[item.key];
    if (!prog || !prog.variations) return;

    var openKey = 'dedicatedOpen_' + item.key;
    var varKey  = 'dedicatedVar_'  + item.key;
    var isOpen  = S[openKey] || false;
    var varIdx  = S[varKey]  || 0;

    var card = h('div', {style: 'border:1px solid var(--border);margin-bottom:8px;background:var(--ivory2)'});

    // Header
    var header = h('div', {
      style: 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer',
      onclick: function() { S[openKey] = !S[openKey]; window.render(); }
    });
    var titleDiv = h('div', {style: 'display:flex;align-items:center;gap:10px'});
    titleDiv.appendChild(h('span', {style: 'font-size:20px'}, item.icon));
    var titleRight = h('div', {});
    titleRight.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px'}, prog.name));
    titleRight.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:2px'}, '\u23F1 ' + prog.duration));
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
          style: 'flex:1;padding:10px;text-align:center;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;border-right:1px solid var(--border);' +
            (isActive ? 'background:var(--black);color:#fff;font-weight:bold' : 'background:var(--ivory);color:var(--grey)'),
          onclick: function(e) { e.stopPropagation(); S[varKey] = idx; window.render(); }
        }, v.label);
        tabs.appendChild(tab);
      });
      card.appendChild(tabs);

      var variation = prog.variations[varIdx] || prog.variations[0];
      if (!variation) return;
      var currentPhase = getMuscuPhase(S.muscuWeek || 1);
      (variation.exercises || []).forEach(function(exBase) {
        var ex = applyPhaseToExercise(exBase, currentPhase);
        var row = h('div', {style: 'padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start'});
        var left = h('div', {});
        left.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px'}, ex.order + '. ' + ex.name));
        left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:2px'}, ex.muscle + ' \u2014 ' + ex.equipment));
        if (ex.technique) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--orange);margin-top:2px'}, ex.technique));
        // Suggested weight based on phase %1RM
        var sugW = getSuggestedWeight(ex.name, ex.reps, currentPhase);
        if (sugW && sugW > 0) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#27AE60;margin-top:2px'}, '\u2192 Charge cible : ~' + sugW + ' kg'));
        row.appendChild(left);
        var right = h('div', {style: 'text-align:right;flex-shrink:0;margin-left:12px'});
        right.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px;font-weight:bold'}, ex.sets + '\u00d7' + ex.reps));
        right.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:2px'}, ex.rest));
        row.appendChild(right);
        card.appendChild(row);
      });
      card.appendChild(h('div', {style: 'padding:10px 16px;border-top:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);font-style:italic'}, prog.notes));
    }
    p.appendChild(card);
  });

  p.appendChild(h('div', {style: 'height:16px'}));
  p.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
    // CRITIQUE-1 : pré-sélection ici (une seule fois, hors render)
    if (S.goal !== null && S.sportGoals.length === 0) {
      var nutKey = window.GOALS && window.GOALS[S.goal] ? window.GOALS[S.goal].key : null;
      var preselect = nutKey ? NUTRITION_TO_SPORT_GOAL[nutKey] : null;
      if (preselect) S.sportGoals = [preselect];
    }
    S.sStep = 1;
    window.render();
  }}, 'Cr\u00e9er mon programme personnalis\u00e9 \u2192'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 16; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 1: MUSCULATION OBJECTIVES ───
// Mapping nutrition goal key → sport goal id
var NUTRITION_TO_SPORT_GOAL = { bulk: 'muscle', maintain: 'general', cut: 'weightloss', shred: 'shred' };
window.NUTRITION_TO_SPORT_GOAL = NUTRITION_TO_SPORT_GOAL;
// Mapping sport goal id → nutrition goal index (priority order when multi-select)
var SPORT_TO_NUTRITION_GOAL = { muscle: 0, weightloss: 2, shred: 3, endurance: 1, flexibility: 1, general: 1 };

  // ─── CONTEXTE NUTRITIONNEL (source : NutritionMaster via window.S._nm) ────
  function getNutritionContext() {
    var nm = window.S._nm;
    if (!nm || nm.errors && nm.errors.length > 0) return null;
    return {
      caloriesTarget:  nm.caloriesTarget  || 0,
      caloriesCheck:   nm.caloriesCheck   || 0,
      proteinGrams:    nm.proteinGrams    || 0,
      carbsGrams:      nm.carbsGrams      || 0,
      fatGrams:        nm.fatGrams        || 0,
      bmr:             nm.bmr             || 0,
      tdee:            nm.tdee            || 0,
      goal:            nm.inputs && nm.inputs.goal || null
    };
  }

function syncSportGoalsToNutrition() {
  if (S.goal === null) return; // only sync if nutrition was filled first
  if (S.pregnant && S.sex === 'femme') return; // ÉLEVÉ-4: grossesse → ne pas écraser le maintien forcé
  if (S.sportGoals.length === 0) { S.goal = 1; return; } // ÉLEVÉ-2: désélection totale → reset maintien
  // Priority: shred > muscle > weightloss > others (→ maintain)
  var newIdx = 1;
  if (S.sportGoals.indexOf('shred') !== -1) newIdx = 3;
  else if (S.sportGoals.indexOf('muscle') !== -1) newIdx = 0;
  else if (S.sportGoals.indexOf('weightloss') !== -1) newIdx = 2;
  S.goal = newIdx;
}

function renderMusculationGoals(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Musculation'));
  p.appendChild(h('h1', {html: 'Votre<br><em>objectif</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Choisissez vos objectifs (1 \u00e0 3).'));
  if (window.TIPS) TIPS.renderTip(p, 'sportGoal');

  // ── INTERDÉPENDANCE NUTRITION ──────────────────────────────────────────
  if (S.goal !== null) {
    // Reminder banner (pre-sélection déplacée dans le handler du bouton "Créer programme")
    var nutName = (window.GOALS || [])[S.goal] ? window.GOALS[S.goal].name : '';
    var banner = h('div', {style: 'border-left:3px solid var(--accent,#C8A96E);padding:12px 16px;background:var(--ivory2,#F5F4EF);margin-bottom:16px'});
    banner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:bold;color:var(--text,#0A0A09);margin-bottom:4px'}, 'Objectif d\u00e9fini en Nutrition\u00a0: ' + nutName));
    banner.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65)'}, 'Si vous le modifiez ici, il sera automatiquement mis \u00e0 jour dans la section Nutrition.'));
    p.appendChild(banner);
  }
  // ──────────────────────────────────────────────────────────────────────

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
    row.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey)'}, ex.desc));
    explainBox.appendChild(row);
  });
  p.appendChild(explainBox);

  // ─── JOURS D'ENTRAÎNEMENT PAR SEMAINE ───
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, "Jours d'entra\u00EEnement par semaine"));
  var cfDaysWrap = h('div', {'class': 'num-input-wrap'});
  cfDaysWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '3', max: '6', value: String(S.sportDays), inputmode: 'numeric',
    oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 3 && v <= 6) { S.sportDays = v; window.render(); } },
    onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 3) { e.target.value = S.sportDays = 3; window.render(); } else if (v > 6) { e.target.value = S.sportDays = 6; window.render(); } }
  }));
  cfDaysWrap.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
  p.appendChild(cfDaysWrap);
  p.appendChild(h('div', {'class': 'num-hint'}, '3 jours minimum recommand\u00E9 pour le CrossFit'));

  // Recommendation based on level
  if (S.crossfitLevel) {
    var cfDayReco = '';
    if (S.crossfitLevel === 'scaled') cfDayReco = 'Recommand\u00E9 : 3-4 jours (r\u00E9cup\u00E9ration importante)';
    else if (S.crossfitLevel === 'inter') cfDayReco = 'Recommand\u00E9 : 4-5 jours';
    else if (S.crossfitLevel === 'rx') cfDayReco = 'Recommand\u00E9 : 5-6 jours';
    if (cfDayReco) {
      p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-top:6px;font-style:italic'}, cfDayReco));
    }
  }

  // ─── 1RM QUESTIONNAIRE (OPTIONAL) ───
  // Load saved 1RM data
  if (Object.keys(S.crossfit1RM).length === 0) {
    var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
    var saved1rm = localStorage.getItem('mtd_cf_1rm_' + userId);
    if (saved1rm) { try { S.crossfit1RM = JSON.parse(saved1rm); } catch(e) {} }
  }

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
      leftDiv.appendChild(h('div', {style: 'font-family:Georgia;font-size:14px'}, lift.icon + ' ' + lift.name));
      leftDiv.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey)'}, lift.desc));

      // Show estimated working weight if value is filled
      if (currentVal && S.crossfitLevel) {
        var lvlIdx = S.crossfitLevel === 'scaled' ? 0 : S.crossfitLevel === 'inter' ? 1 : 2;
        var wodPct = lvlIdx === 0 ? 0.55 : lvlIdx === 1 ? 0.65 : 0.75;
        var estWeight = Math.round(currentVal * wodPct);
        leftDiv.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:#1A3A6A;margin-top:2px;font-weight:bold'}, 'WOD \u2248 ' + estWeight + 'kg'));
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
        style: 'width:64px;padding:6px 8px;border:1px solid var(--border);background:var(--ivory);font-family:Georgia;font-size:14px;text-align:center',
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
      rightDiv.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'kg'));
      row.appendChild(rightDiv);

      rmGrid.appendChild(row);
    });
    p.appendChild(rmGrid);
  }

  p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);font-style:italic;text-align:center;margin-bottom:16px'}, 'Si vous ne connaissez pas vos 1RM, les charges seront bas\u00E9es sur les standards internationaux pour votre niveau.'));

  p.appendChild(h('div', {style: 'height:16px'}));
  var ok = S.crossfitLevel !== null;
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
    if (ok) { S.crossfitWeek = 1; S.selectedCrossfitDay = 0; S.sStep = 6; window.BLACKBOX && window.BLACKBOX.log('crossfit_level', {level: S.crossfitLevel, days: S.sportDays}); window.render(); }
  }}, 'Continuer'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── CROSSFIT HELPERS ───
function getCFLevelIdx() {
  if (S.crossfitLevel === 'scaled') return 0;
  if (S.crossfitLevel === 'inter') return 1;
  return 2;
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
        var pctUsed = levelIdx === 0 ? 55 : levelIdx === 1 ? 65 : 75;
        rmNote = ' (' + pctUsed + '% de votre 1RM)';
      }
      parts.push(mov.name + ' @' + w + 'kg' + rmNote);
    } else {
      parts.push(mov.name);
    }
  } else if (mov.gymnastics) {
    var gstd = window.CF_STANDARDS[mov.gymnastics];
    if (gstd && gstd[level]) {
      parts.push(gstd[level]);
    } else {
      parts.push(mov.name);
    }
  } else if (mov.special) {
    var sstd = window.CF_STANDARDS[mov.special];
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
      var result = w + 'kg';
      if (S.crossfit1RM && S.crossfit1RM[key]) {
        var lvlIdx = getCFLevelIdx();
        var pct = lvlIdx === 0 ? 55 : lvlIdx === 1 ? 65 : 75;
        result += ' (' + pct + '% 1RM)';
      }
      return result;
    }
  }
  var std = window.CF_STANDARDS[key];
  if (!std) return '';
  var sexKey = getCFSexKey();
  var levelIdx = getCFLevelIdx();
  if (std[sexKey]) return std[sexKey][levelIdx] + 'kg';
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

  // Semaines de décharge CrossFit : 4, 8, 12, 16... (cycle 3+1 semaines — protocole Mayhem/Games)
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

// ─── STEP 6 (CrossFit): PROGRAMME CF ───
function renderCrossfitProgram(p) {
  // Load saved 1RM data if not already loaded
  if (Object.keys(S.crossfit1RM).length === 0) {
    var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
    var saved1rm = localStorage.getItem('mtd_cf_1rm_' + userId);
    if (saved1rm) { try { S.crossfit1RM = JSON.parse(saved1rm); } catch(e) {} }
  }

  var daysPerWeek = S.sportDays || 4;
  var template = CF_DAY_TEMPLATES[daysPerWeek] || CF_DAY_TEMPLATES[4];
  var weekProgram = generateCrossfitWeek(S.crossfitWeek, daysPerWeek);

  // Guard: if no WODs available, show a message instead of a blank page
  if (!weekProgram || !weekProgram.length) {
    p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
    p.appendChild(h('h1', {html: 'Cross Training<br><em>Programme</em>'}));
    p.appendChild(h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;margin:24px 0;background:var(--orangebg)'}, [
      h('div', {style: 'font-family:Georgia,serif;font-size:14px;margin-bottom:4px'}, 'Base de WODs en cours de chargement...'),
      h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'}, 'Rechargez la page pour afficher le programme.')
    ]));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 5; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
    return;
  }

  // Clamp selectedCrossfitDay
  if (S.selectedCrossfitDay >= template.length) S.selectedCrossfitDay = 0;

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
  p.appendChild(h('h1', {html: 'Cross Training<br><em>Programme</em>'}));
  var levelObj = (window.CROSSFIT_LEVELS || []).find(function(l) { return l.id === S.crossfitLevel; });
  p.appendChild(h('p', {'class': 'subtitle'}, daysPerWeek + ' jours/semaine \u2014 ' + (levelObj ? levelObj.icon + ' ' + levelObj.name : '') + ' \u2014 Inspir\u00E9 Mayhem / Games Athletes'));

  // Objectives banner
  var goalNames = S.sportGoals.map(function(gid){
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
      goalBanner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);font-style:italic'}, 'Le programme est adapt\u00E9 en cons\u00E9quence \u2014 ' + goalNotes.join(' \u00B7 ')));
    }
    p.appendChild(goalBanner);
  }

  // ─── STRENGTH GRADE ───
  if (window.renderStrengthGrade) renderStrengthGrade(p);

  // ─── WEEK NAVIGATION ───
  var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.crossfitWeek > 1) { S.crossfitWeek--; S.selectedCrossfitDay = 0; window.render(); }
  }}, '\u2190'));
  weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.crossfitWeek));
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    S.crossfitWeek++; S.selectedCrossfitDay = 0; window.render();
  }}, '\u2192'));
  p.appendChild(weekNav);

  // ─── CROSSFIT DELOAD BANNER (semaines 4, 8, 12, 16) ───
  // Protocole Mayhem / Games : 3 semaines d'intensité + 1 semaine de décharge.
  // Volume réduit de 40-50%, intensité maintenue à 70% max. Récupération CNS + articulaire.
  var cfWeekNum = S.crossfitWeek || 1;
  var isCFDeload = (cfWeekNum % 4 === 0);
  if (isCFDeload) {
    var cfDeloadBanner = h('div', {style: 'background:#F3E5F5;border-left:4px solid #8E44AD;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#4A235A'});
    cfDeloadBanner.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, '\uD83D\uDCC9 Semaine ' + cfWeekNum + ' — DÉCHARGE OBLIGATOIRE (CrossFit cycle 4-1)'));
    cfDeloadBanner.appendChild(h('div', {}, 'Réduisez le volume de 40-50\u00a0% (ex. 3 séries au lieu de 5). Intensité \u226470\u00a0% du max. Gardez les mêmes mouvements — c\'est la récupération CNS et articulaire qui permet les PR des semaines suivantes. Pas de PR ni de test de max cette semaine.'));
    p.appendChild(cfDeloadBanner);
  }

  // ─── HALTERO CYCLE INFO ───
  if (window.HALTERO_CYCLES) {
    var cycleWeek = S.crossfitCycleWeek || 1;
    HALTERO_CYCLES.renderCycleInfo(p, cycleWeek, S.sex, S.crossfitLevel);

    // Haltero cycle week selector (1-24)
    var haltWeekNav = h('div', {style: 'display:flex;align-items:center;gap:8px;margin:8px 0 16px;flex-wrap:wrap'});
    haltWeekNav.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-right:4px'}, 'Cycle Halt\u00E9ro'));
    var prevBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 12px;margin:0;font-size:14px', disabled: cycleWeek <= 1 ? true : null, onclick: function(){ S.crossfitCycleWeek = Math.max(1, (S.crossfitCycleWeek || 1) - 1); window.render(); }}, '\u25C0');
    haltWeekNav.appendChild(prevBtn);
    haltWeekNav.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;min-width:60px;text-align:center'}, cycleWeek + ' / 24'));
    var nextBtn = h('button', {'class': 'btn-secondary', style: 'width:auto;padding:6px 12px;margin:0;font-size:14px', disabled: cycleWeek >= 24 ? true : null, onclick: function(){ S.crossfitCycleWeek = Math.min(24, (S.crossfitCycleWeek || 1) + 1); window.render(); }}, '\u25B6');
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
  if (!wod) return;

  // Day header
  p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:24px;text-align:center;margin:16px 0 4px'}, currentDay.dayLabel + ' \u2014 ' + wod.name));
  p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);text-align:center;margin-bottom:4px'}, currentDay.focus));
  p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);text-align:center;margin-bottom:20px'}, 'Semaine ' + S.crossfitWeek + ' \u2014 Jour ' + currentDay.dayNumber + ' / ' + daysPerWeek));

  // ─── HALTÉRO or GYM SKILLS SECTION (depending on day template) ───
  if (currentDay.hasHaltero) {
    // Show haltero section
    var haltCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #1A3A6A'});
    haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A3A6A;margin-bottom:6px'}, 'HALT\u00C9RO'));
    var _halt = wod.haltero || {};
    haltCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, _halt.name || ''));
    haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);margin-bottom:4px'}, _halt.desc || ''));
    haltCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:6px'}, _halt.scheme || ''));
    if (_halt.weights) {
      var weightStr = getCFWeight(_halt.weights);
      if (weightStr) {
        haltCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px;color:#1A3A6A;font-weight:bold'}, 'Charge : ' + weightStr));
      }
    }
    var haltVideoQ = encodeURIComponent((_halt.name || '') + ' crossfit technique');
    haltCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + haltVideoQ, target: '_blank', rel: 'noopener'}, '\u25B6 Voir la technique'));
    p.appendChild(haltCard);
  } else {
    // Show gym skills section first for non-haltero days
    var gymSkillCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #27AE60'});
    gymSkillCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#27AE60;margin-bottom:6px'}, 'GYMNASTIQUE'));
    var _gym = wod.gym || {};
    gymSkillCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:8px'}, (_gym.name || '')));
    var drillListTop = h('div', {});
    (_gym.drills || []).forEach(function(drill, idx) {
      drillListTop.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);padding:3px 0'}, (idx + 1) + '. ' + drill));
    });
    gymSkillCard.appendChild(drillListTop);
    var gymVideoQTop = encodeURIComponent((_gym.name || '').replace('Skill: ', '') + ' crossfit tutorial');
    gymSkillCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + gymVideoQTop, target: '_blank', rel: 'noopener', style: 'margin-top:8px'}, '\u25B6 Voir la technique'));
    p.appendChild(gymSkillCard);
  }

  // ─── WOD SECTION (always shown) ───
  var wodCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #C0392B'});
  wodCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C0392B;margin-bottom:6px'}, 'WOD'));
  var _wod = wod.wod || {};
  wodCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin-bottom:4px'}, _wod.name || ''));
  wodCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px;color:#C0392B;margin-bottom:10px'}, _wod.type || ''));

  var movList = h('div', {style: 'margin-bottom:10px'});
  (_wod.movements || []).forEach(function(mov) {
    var movText = formatCFMovement(mov);
    var movDiv = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border)'}, movText);
    movList.appendChild(movDiv);
  });
  wodCard.appendChild(movList);

  if (_wod.notes) {
    wodCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:6px'}, _wod.notes));
  }
  p.appendChild(wodCard);

  // ─── GYM DRILLS (always shown at the end) ───
  if (currentDay.hasHaltero) {
    // For haltero days, gym drills are shown after the WOD
    var gymCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #27AE60'});
    gymCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#27AE60;margin-bottom:6px'}, 'GYMNASTIQUE'));
    var _gym2 = wod.gym || {};
    gymCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:8px'}, (_gym2.name || '')));

    var drillList = h('div', {});
    (_gym2.drills || []).forEach(function(drill, idx) {
      drillList.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);padding:3px 0'}, (idx + 1) + '. ' + drill));
    });
    gymCard.appendChild(drillList);

    var gymVideoQ = encodeURIComponent((_gym2.name || '').replace('Skill: ', '') + ' crossfit tutorial');
    gymCard.appendChild(h('a', {'class': 'exercise-video', href: 'https://www.youtube.com/results?search_query=' + gymVideoQ, target: '_blank', rel: 'noopener', style: 'margin-top:8px'}, '\u25B6 Voir la technique'));
    p.appendChild(gymCard);
  }
  // For non-haltero days, gym was already shown before the WOD

  // Day summary
  var sectionCount = currentDay.hasHaltero ? 3 : 2;
  var summary = h('div', {'class': 'day-total'});
  summary.appendChild(h('div', {'class': 'dt-label'}, sectionCount + ' sections'));
  summary.appendChild(h('div', {'class': 'dt-val'}, currentDay.hasHaltero ? '~60-75 min' : '~45-60 min'));
  p.appendChild(summary);

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
}

// (renderSportStep0 removed — replaced by renderObjectif above)

// ─── STEP 2 (Muscu): NIVEAU & FRÉQUENCE ───
function renderMusculationLevel(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Configuration'));
  p.appendChild(h('h1', {html: 'Votre<br><em>niveau</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Niveau d\'expérience et fréquence d\'entraînement.'));
  if (window.TIPS) TIPS.renderTip(p, 'sportLevel');

  p.appendChild(h('div', {'class': 'section-label'}, 'Niveau'));
  var list = h('div', {'class': 'level-list'});
  (window.SPORT_LEVELS || []).forEach(function(lv) {
    list.appendChild(h('div', {'class': 'level-item' + (S.sportLevel === lv.id ? ' on' : ''), onclick: function(){ S.sportLevel = lv.id; window.render(); }}, [
      h('div', {}, [h('div', {'class': 'level-name'}, lv.name), h('div', {'class': 'level-desc'}, lv.desc)]),
      h('span', {'class': 'level-badge'}, '×' + lv.factor)
    ]));
  });
  p.appendChild(list);

  p.appendChild(h('div', {'class': 'section-label'}, 'Jours par semaine'));
  var nw = h('div', {'class': 'num-input-wrap'});
  nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '6', value: String(S.sportDays), inputmode: 'numeric',
    oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 6) S.sportDays = v; },
    onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) e.target.value = S.sportDays = 2; else if (v > 6) e.target.value = S.sportDays = 6; }
  }));
  nw.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
  p.appendChild(nw);
  p.appendChild(h('div', {'class': 'num-hint'}, 'Entre 2 et 6 jours'));

  p.appendChild(h('div', {style: 'height:24px'}));
  var ok = S.sportLevel !== null;
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
    if (ok) { S.sStep = 3; window.BLACKBOX && window.BLACKBOX.log('sport_step', {step: 3}); window.render(); }
  }}, 'Continuer'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 1; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 3 (Muscu): ZONES CIBLES ───
function renderMusculationZones(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Zones'));
  p.appendChild(h('h1', {html: 'Zones à<br><em>travailler</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Sélectionnez au moins 2 zones à cibler dans votre programme.'));
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
  p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:12px'}, 'Attribuez 1 à 5 étoiles pour définir la priorité. Cliquez à nouveau pour retirer.'));
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
          style: 'cursor:pointer;font-size:18px;transition:all 0.15s;' + (starVal <= priority ? 'opacity:1' : 'opacity:0.2'),
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
    var tip = h('div', {style: 'border-left:2px solid var(--orange);padding:8px 16px;background:var(--orangebg);margin-bottom:16px;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey)'});
    tip.textContent = '\u26A1 Zones identifi\u00e9es \u00e0 renforcer depuis votre profil nutrition';
    p.appendChild(tip);
  }

  // ─── DURÉE DE SÉANCE ───
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:24px'}, 'Durée de tes séances'));
  p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:12px'}, 'Quelle est la durée de tes séances ?'));
  var durationOptions = [
    {id: '45min', label: '45 min', desc: '4-5 exercices · 3 séries'},
    {id: '1h',    label: '1h',     desc: '5-6 exercices · 3-4 séries'},
    {id: '1h15',  label: '1h15',   desc: '6-7 exercices · 4 séries'},
    {id: '1h30',  label: '1h30',   desc: '7-8 exercices · 4-5 séries'}
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
  var selectedZones = Object.keys(S.sportFocus).filter(function(z){ return S.sportFocus[z] > 0; });
  var ok = selectedZones.length >= 2 && S.sportSessionDuration !== null;
  if (selectedZones.length < 2) {
    p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Sélectionnez au moins 2 zones'));
  } else if (!S.sportSessionDuration) {
    p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Sélectionnez une durée de séance'));
  }
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
    if (ok) {
      S.sportProgram = generateSportProgram();
      S.selectedSportDay = 0;
      S.sStep = 4;
      window.BLACKBOX && window.BLACKBOX.log('sport_program_generated', {days: S.sportDays, focus: S.sportFocus, duration: S.sportSessionDuration});
      if (window.GAMIFICATION) GAMIFICATION.unlockBadge('first_workout');
      window.render();
    }
  }}, 'Générer mon programme'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 2; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── SYSTÈME DE PHASES 6 SEMAINES ───
var MUSCU_PHASES = [
  {weeks:[1,2], id:'adaptation',     label:'Adaptation',     color:'#2980B9',
   rpe:6,  rpeNote:'RPE 6 — vous pourriez faire 4 reps de plus. Priorité à la technique.',
   pct1rm:0.60, advice:'Maîtrisez la technique avant d\'augmenter les charges. Si vous réussissez toutes les reps → +2.5 kg la semaine suivante.',
   setsOffset:-1, repsOffset:+2, restNote:'Repos libres — récupération complète entre chaque série.'},
  {weeks:[3,4], id:'progression',    label:'Progression',    color:'#27AE60',
   rpe:8,  rpeNote:'RPE 8 — vous pourriez faire 2 reps de plus. Zone optimale hypertrophie.',
   pct1rm:0.72, advice:'Progression double : augmentez d\'abord les reps (ex. 8→10→12), puis montez la charge de 2.5 kg et retombez à 8 reps.',
   setsOffset:0,  repsOffset:0,  restNote:'Respectez les temps de repos indiqués.'},
  {weeks:[5,6], id:'intensification',label:'Intensification',color:'#E67E22',
   rpe:9,  rpeNote:'RPE 9 — 1 rep en réserve. Dernier set seulement jusqu\'à l\'échec technique (jamais sur squat/soulevé).',
   pct1rm:0.82, advice:'Charges maximales. +1 série par exercice composé. Dernier set à l\'échec sur les isolations uniquement.',
   setsOffset:+1, repsOffset:-2, restNote:'+30s de repos vs semaines précédentes. CNS sous pression maximale.'},
  {weeks:[7],   id:'decharge',       label:'Décharge',       color:'#8E44AD',
   rpe:5,  rpeNote:'RPE 5 — très facile, 5+ reps en réserve. Récupération musculaire et articulaire.',
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
  if (!window.getMusculationWeight) return null;
  var baseW = window.getMusculationWeight(exerciseName, null, reps);
  if (!baseW || baseW <= 0) return null;
  // Adjust proportionally to phase pct1rm (reference: 0.72 = progression phase)
  var adjusted = Math.round(baseW * (pct / 0.72) / 2.5) * 2.5;
  return Math.max(adjusted, 5);
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
  var lastPt = pts[pts.length - 1].split(',');
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
  var history = S.muscuProgressionHistory[exerciseName] || [];

  // Si historique disponible, utilise la dernière session
  if (history.length > 0) {
    var last = history[history.length - 1];
    // Règle de progression : si toutes séries réussies → +2.5kg (upper body) ou +5kg (lower body)
    var lowerBodyKeywords = /squat|leg|fessier|ischios|mollet/i;
    var increment = lowerBodyKeywords.test(exerciseName) ? 5 : 2.5;

    // Vérifier si la dernière session était "réussie" (toutes reps atteintes)
    // Exclure la session d'aujourd'hui (initialisée avec des nulls, pas encore validée)
    var today = new Date().toISOString().slice(0, 10);
    var lastLog = null;
    var sortedDates = Object.keys(S.muscuSessionLog).filter(function(d) { return d !== today; }).sort();
    sortedDates.forEach(function(date) {
      if (S.muscuSessionLog[date][exerciseName]) {
        lastLog = { date: date, sets: S.muscuSessionLog[date][exerciseName] };
      }
    });

    if (lastLog) {
      var allSucceeded = lastLog.sets.every(function(s) {
        return s.actualReps >= s.targetReps && s.actualWeight >= s.targetWeight;
      });
      if (allSucceeded) return Math.round((last.weight + increment) * 2) / 2; // arrondi 0.5kg
      // Échec → maintenir le poids
      return last.weight;
    }
    return last.weight;
  }

  // Pas d'historique → utilise le poids de base calculé
  return baseWeight;
}

function saveMuscuSessionLog() {
  try {
    var uid = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
    localStorage.setItem('mtd_muscu_session_' + uid, JSON.stringify(S.muscuSessionLog));

    // Mettre à jour l'historique de progression
    Object.keys(S.muscuSessionLog).forEach(function(date) {
      Object.keys(S.muscuSessionLog[date]).forEach(function(exName) {
        var sets = S.muscuSessionLog[date][exName];
        var completed = sets.filter(function(s) { return s.actualWeight !== null; });
        if (completed.length === 0) return;
        var avgWeight = completed.reduce(function(sum, s) { return sum + s.actualWeight; }, 0) / completed.length;
        var avgReps = completed.reduce(function(sum, s) { return sum + (s.actualReps || 0); }, 0) / completed.length;

        if (!S.muscuProgressionHistory[exName]) S.muscuProgressionHistory[exName] = [];
        // Ne pas dupliquer pour la même date
        var existing = S.muscuProgressionHistory[exName].find(function(entry) { return entry.date === date; });
        if (!existing) {
          S.muscuProgressionHistory[exName].push({
            date: date,
            week: S.muscuCycle || 1,
            weight: Math.round(avgWeight * 2) / 2,
            reps: Math.round(avgReps)
          });
        }
      });
    });
    localStorage.setItem('mtd_muscu_progression_' + uid, JSON.stringify(S.muscuProgressionHistory));
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
  badge.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:14px;color:' + phase.color}, 'Semaine ' + week + ' / 7 · Cycle ' + cycleNum));
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
        style: 'flex:1;height:8px;cursor:pointer;transition:all 0.15s;' +
          (isActive ? 'background:' + ph.color + ';transform:scaleY(1.5)' :
           isDone   ? 'background:' + ph.color + ';opacity:0.4' : 'background:var(--border)'),
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
    labels.appendChild(h('div', {style: 'flex:1;text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:8px;color:var(--grey)'}, lbl));
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
  rpeBadge.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey)'}, displayRpeNote.replace('RPE ' + displayRpe + ' — ', '')));
  container.appendChild(rpeBadge);

  // Phase advice
  container.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.5;margin-bottom:8px;padding-left:8px;border-left:2px solid ' + phase.color}, phase.advice));
  container.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);font-style:italic;margin-bottom:12px'}, phase.restNote));

  // Buttons
  var btnRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap'});
  if (week < 7) {
    btnRow.appendChild(h('button', {
      style: 'flex:1;padding:10px;background:' + phase.color + ';color:#fff;border:none;font-family:Georgia,serif;font-size:13px;cursor:pointer',
      onclick: function() { saveMuscuWeek(week + 1); window.render(); }
    }, 'Semaine ' + (week + 1) + ' \u2192'));
  } else {
    btnRow.appendChild(h('button', {
      style: 'flex:1;padding:10px;background:#27AE60;color:#fff;border:none;font-family:Georgia,serif;font-size:13px;cursor:pointer',
      onclick: function() {
        S.muscuProgramStart = new Date().toISOString().split('T')[0];
        S.muscuCycle = (S.muscuCycle || 1) + 1;
        var uid2 = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
        try { localStorage.setItem('mtd_muscu_start_' + uid2, S.muscuProgramStart); } catch(e) { console.warn('[muscu_cycle] localStorage error:', e); }
        try { localStorage.setItem('mtd_muscu_cycle_' + uid2, String(S.muscuCycle)); } catch(e) { console.warn('[muscu_cycle] localStorage error:', e); }
        S.sportProgram = generateSportProgram();
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

// Dépense calorique personnalisée — Keytel et al. 2005 (FC-based) + EPOC Schuenke 2002
function calcSessionKcal(exercises, durationMin) {
  var s = window.S;
  var weight = s.weight || 75;
  var age = s.age || 30;
  var sex = s.sex || 'homme';
  // Phase courante → RPE
  var phase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(s.muscuWeek || 1) : null;
  var rpe = phase ? phase.rpe : 7;
  // RPE → %FCmax (Borg 6-20 adapté résistance)
  var pctHR = rpe <= 5 ? 0.57 : rpe <= 6 ? 0.64 : rpe <= 7 ? 0.72 : rpe <= 8 ? 0.80 : 0.87;
  // FCmax — Tanaka 2001 (plus précis que Fox 220-age)
  var hrMax = Math.round(208 - 0.7 * age);
  var hr = Math.round(hrMax * pctHR);
  // Keytel et al. 2005 — formule validée vs calorimétrie indirecte
  var kcalMin;
  if (sex === 'homme') {
    kcalMin = (-55.0969 + 0.6309 * hr + 0.1988 * weight + 0.2017 * age) / 4.184;
  } else {
    kcalMin = (-20.4022 + 0.4472 * hr - 0.1263 * weight + 0.074 * age) / 4.184;
  }
  kcalMin = Math.max(kcalMin, 3.0);
  var base = Math.round(kcalMin * durationMin);
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
  if (!S.sportProgram || !S.sportProgram.length) { S.sportProgram = generateSportProgram(); S.selectedSportDay = 0; }

  // Load saved musculation weights from localStorage
  if (Object.keys(S.musculationWeights).length === 0) {
    var userId = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
    var saved = localStorage.getItem('mtd_muscu_weights_' + userId);
    if (saved) { try { S.musculationWeights = JSON.parse(saved); } catch(e) {} }
  }

  // Load saved strength profile
  if (Object.keys(S.muscuStrengthProfile).length === 0) {
    var userId2 = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
    var savedStr = localStorage.getItem('mtd_muscu_strength_' + userId2);
    if (savedStr) { try { S.muscuStrengthProfile = JSON.parse(savedStr); } catch(e) {} }
  }

  // Load session log and progression history
  if (Object.keys(S.muscuSessionLog).length === 0) {
    var userId3 = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon';
    var savedLog = localStorage.getItem('mtd_muscu_session_' + userId3);
    if (savedLog) { try { S.muscuSessionLog = JSON.parse(savedLog); } catch(e) {} }
    var savedProg = localStorage.getItem('mtd_muscu_progression_' + userId3);
    if (savedProg) { try { S.muscuProgressionHistory = JSON.parse(savedProg); } catch(e) {} }
  }

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
  p.appendChild(h('h1', {html: 'Votre<br><em>programme</em>'}));

  // CS-01: Bannière charges estimées si profil de force non renseigné
  if (Object.keys(S.muscuStrengthProfile).length === 0) {
    var estBanner = h('div', {style: 'border-left:3px solid #E67E22;padding:10px 14px;background:#FFF3E0;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5D4037'});
    estBanner.appendChild(h('div', {style: 'font-weight:bold;margin-bottom:3px'}, 'Charges estimées'));
    estBanner.appendChild(h('div', {}, 'Les poids affichés sont calculés d\'après votre poids de corps et niveau. Pour des charges personnalisées,\u00a0'));
    var goBack16 = h('span', {style: 'text-decoration:underline;cursor:pointer', onclick: function(){ S.sStep = 16; window.render(); }}, 'saisissez vos charges de référence');
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
      var medBanner = h('div', {style: 'background:#FFF3E0;border-left:4px solid #E67E22;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5D4037'});
      medBanner.appendChild(h('div', {style: 'font-weight:bold;margin-bottom:6px'}, '\uD83C\uDFE5 Programme adapt\u00e9 \u00e0 votre bilan m\u00e9dical'));
      restrictions.forEach(function(r) {
        medBanner.appendChild(h('div', {style: 'margin-bottom:3px'}, r));
      });
      var editMed = h('div', {style: 'margin-top:8px;font-size:10px;text-decoration:underline;cursor:pointer;color:#E67E22',
        onclick: function(){ S.sStep = 20; window.render(); }}, 'Modifier mon bilan m\u00e9dical');
      medBanner.appendChild(editMed);
      p.appendChild(medBanner);
    }
  }

  // ─── ALERTE GROSSESSE SPORT (ACOG 2020) ───
  var pregSportWarn = getPregnancySportWarning();
  if (pregSportWarn) {
    p.appendChild(h('div', {style: 'background:#FFF3E0;border-left:4px solid #E8A87C;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5D4037;line-height:1.6'}, pregSportWarn));
  }

  // ─── CONFLITS OBJECTIFS NUTRITION × SPORT ───
  if (window.detectMedicalConflicts) {
    var progConflicts = window.detectMedicalConflicts();
    // Filtrer : uniquement les conflits liés aux objectifs sport/nutrition (conflit 9 & 10) + médicaux sport
    var sportConflicts = progConflicts.filter(function(c) {
      return c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1 || c.message.indexOf('IRC + Objectif') !== -1 || c.message.indexOf('Cardiopathie') !== -1 || c.message.indexOf('Diab\u00e8te') !== -1;
    });
    sportConflicts.forEach(function(c) {
      var bg = c.level === 'CRITIQUE' ? '#FFEBEE' : c.level === '\u00c9LEV\u00c9' ? '#FFF3E0' : '#E3F2FD';
      var border = c.level === 'CRITIQUE' ? '#C0392B' : c.level === '\u00c9LEV\u00c9' ? '#E67E22' : '#1976D2';
      var color = c.level === 'CRITIQUE' ? '#7B1A1A' : c.level === '\u00c9LEV\u00c9' ? '#5D4037' : '#0D47A1';
      p.appendChild(h('div', {style: 'background:' + bg + ';border-left:4px solid ' + border + ';padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:' + color + ';line-height:1.5'}, c.message));
    });
  }

  // Medical/age contextual warnings in program view
  var hasDiabProg = S.medical && (S.medical.indexOf('diabete_t2') !== -1 || S.medical.indexOf('diabete_t1') !== -1);
  if (hasDiabProg) {
    var diabMsg = S.medical.indexOf('diabete_t1') !== -1
      ? '⚠ Diabète T1 : RPE plafonné à 7/10 (risque hypoglycémie à haute intensité). Glycémie cible avant séance : 7-10 mmol/L. Glucomètre obligatoire avant/après. Gardez 15-20g glucides rapides à portée.'
      : '⚠ Diabète : Vérifiez votre glycémie avant/après chaque séance. Gardez du sucre rapide à portée. Intensité maximale RPE 8/10 — jamais à l\'échec. Hydratation ×1.5.';
    p.appendChild(h('div', {style: 'background:#FFF3E0;border-left:4px solid #E67E22;padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#5D4037'}, diabMsg));
  }
  if (S.age >= 50) {
    p.appendChild(h('div', {style: 'background:#E8F5E9;border-left:4px solid #27AE60;padding:8px 12px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#1B5E20'}, '💪 50+ : Échauffement 15-20 min obligatoire. Décharge toutes les 4-5 semaines. Favorisez les mouvements guidés pour protéger les articulations.'));
  }
  // Cardiopathie : zones FC Karvonen + avertissement beta-bloquants (AHA 2018, ACSM 2021)
  if (S.medical && S.medical.indexOf('cardio') !== -1) {
    var age = S.age || 40;
    var hrMax = 220 - age; // Formule standard (Fox 1971)
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
    karvonenDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);margin-bottom:8px'}, 'FC repos ' + hrRest + ' bpm · HRmax estimé ' + hrMax + ' bpm'));
    var zonesRow = h('div', {style: 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px'});
    zonesRow.appendChild(h('span', {'class': 'val-good'}, 'Z1 Récup ' + z1lo + '–' + z1hi + ' bpm'));
    zonesRow.appendChild(h('span', {'class': 'val-good'}, 'Z2 Aérobie ' + z2lo + '–' + z2hi + ' bpm'));
    zonesRow.appendChild(h('span', {'class': 'val-neutral'}, 'Z3 Seuil ' + z3lo + '–' + z3hi + ' bpm'));
    karvonenDiv.appendChild(zonesRow);
    karvonenDiv.appendChild(h('div', {style: 'margin-top:4px;font-style:italic;color:var(--grey)'}, '⚠ Beta-bloquants : si prescrit, votre FC max réelle est plus basse (~10-20%). Consulter votre cardiologue pour ajuster les zones. Test d\'effort (VO2max) recommandé avant programme intensif.'));
    p.appendChild(karvonenDiv);
  }

  var goalNames = S.sportGoals.map(function(gid){
    var g = (window.SPORT_GOALS || []).find(function(x){ return x.id === gid; });
    return g ? g.name : '';
  }).join(' + ');
  p.appendChild(h('p', {'class': 'subtitle'}, S.sportDays + ' jours/semaine — ' + goalNames));
  if (window.TIPS) TIPS.renderTip(p, 'sportProgram');

  // ─── SUIVI 6 SEMAINES ───
  renderWeekTracker(p);

  // Show zone focus with star count
  var focusZones = Object.keys(S.sportFocus)
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

  // ─── VOLUME HEBDOMADAIRE MEV/MAV ───
  if (window.VOLUME_LANDMARKS && S.sportProgram && S.sportProgram.length > 0) {
    var muscleSetCount = {};
    var muscleKeywords = {chest:['poitrine','pectoral','chest'],back:['dos','back','dorsaux','traction','rowing'],shoulders:['\u00e9paule','shoulder','deltoid','trap\u00e8ze','trapeze','militaire','overhead'],legs:['jambe','quadri','ischio','mollet','leg','squat'],glutes:['fessier','glute','hip thrust'],biceps:['biceps'],triceps:['triceps'],abs:['abdo','abdominaux','gainage','transverse','oblique','grand droit']};
    S.sportProgram.forEach(function(day) {
      (day.exercises || []).forEach(function(ex) {
        var m = (ex.m || '').toLowerCase();
        Object.keys(muscleKeywords).forEach(function(cat) {
          if ((muscleKeywords[cat]||[]).some(function(kw){ return m.indexOf(kw) !== -1; })) {
            muscleSetCount[cat] = (muscleSetCount[cat] || 0) + (typeof ex.sets === 'string' ? (parseInt(ex.sets) || 3) : (ex.sets || 3));
          }
        });
      });
    });
    var volKeys = Object.keys(muscleSetCount);
    if (volKeys.length > 0) {
      var volSection = h('div', {style: 'margin-bottom:16px'});
      volSection.appendChild(h('div', {'class':'section-label'}, 'Volume hebdomadaire'));
      volKeys.forEach(function(cat) {
        var lm = window.VOLUME_LANDMARKS[cat];
        if (!lm) return;
        var sets = muscleSetCount[cat];
        var pct = Math.min(sets / lm.mrv, 1);
        var status, color;
        if (sets < lm.mev) { color = '#C0392B'; status = sets + ' s. — Sous MEV (min. ' + lm.mev + ')'; }
        else if (sets <= lm.mav) { color = '#27AE60'; status = sets + ' s. — Zone optimale'; }
        else if (sets <= lm.mrv) { color = '#E67E22'; status = sets + ' s. — Volume \u00e9lev\u00e9'; }
        else { color = '#C0392B'; status = sets + ' s. — D\u00e9passe MRV !'; }
        var row = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:5px'});
        row.appendChild(h('div', {style: 'width:75px;font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);flex-shrink:0'}, lm.label));
        var barWrap = h('div', {style: 'flex:1;height:6px;background:var(--border);position:relative'});
        barWrap.appendChild(h('div', {style: 'height:6px;width:' + Math.round(pct*100) + '%;background:' + color}));
        barWrap.appendChild(h('div', {style: 'position:absolute;top:-2px;left:' + Math.round(lm.mev/lm.mrv*100) + '%;width:1px;height:10px;background:#999', title:'MEV'}));
        barWrap.appendChild(h('div', {style: 'position:absolute;top:-2px;left:' + Math.round(lm.mav/lm.mrv*100) + '%;width:1px;height:10px;background:#555', title:'MAV'}));
        row.appendChild(barWrap);
        row.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:' + color + ';flex-shrink:0;min-width:110px'}, status));
        volSection.appendChild(row);
      });
      volSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin-top:2px'}, 'Repères : | MEV (minimum) · | MAV (optimal) · MRV = barre compl\u00e8te'));
      p.appendChild(volSection);
    }
  }

  // ─── STRENGTH GRADE ───
  if (window.renderStrengthGrade) renderStrengthGrade(p);

  // ─── GROSSESSE — Adaptations sport ───
  if (S.pregnant && S.sex === 'femme') {
    var triSport = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
    if (triSport) {
      var triSportColor = '#C0392B';
      var intensitySport = Math.round(triSport.trimester.intensityFactor * 100);

      var pregSportCard = h('div', {style: 'border:2px solid ' + triSportColor + ';padding:16px;background:rgba(192,57,43,0.04);margin-bottom:16px'});
      pregSportCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;color:' + triSportColor + ';margin-bottom:8px'}, '\uD83E\uDD30 Programme adapt\u00e9 grossesse \u2014 ' + triSport.trimester.name));
      pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin-bottom:10px'}, 'Intensit\u00e9 : ' + intensitySport + '% \u2014 \u00c9coutez votre corps'));

      // Sport tips
      triSport.trimester.sportTips.forEach(function(tip) {
        pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
      });

      // Forbidden exercises
      pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + triSportColor + ';margin:10px 0 6px'}, 'Exercices interdits ce trimestre'));
      triSport.trimester.forbiddenExercises.forEach(function(ex) {
        pregSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + triSportColor + ';margin-bottom:2px;padding-left:8px'}, '\u2716 ' + ex));
      });

      // Emergency stop warning
      var pregStopWarn = h('div', {style: 'margin-top:10px;padding:8px 12px;background:rgba(192,57,43,0.08);border-radius:2px'});
      pregStopWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + triSportColor + ';font-weight:bold'}, '\u26A0 Arr\u00eatez imm\u00e9diatement si : saignements, vertiges, contractions, douleurs, essoufflement excessif'));
      pregSportCard.appendChild(pregStopWarn);

      p.appendChild(pregSportCard);
    }
  }

  // Cycle menstruel — Recommandation sport
  var cycleInfo = null;
  if (S.sex === 'femme' && S.cycleTracking) {
    cycleInfo = window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : null;
    if (cycleInfo) {
    var phaseColors = {menstruation: '#C0392B', follicular: '#E67E22', ovulation: '#27AE60', luteal: '#E67E22'};
    var phaseColor = phaseColors[cycleInfo.phase.id] || '#E67E22';
    var intensity = Math.round(cycleInfo.phase.intensityFactor * 100);

    var cycSportCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:14px 16px;background:var(--ivory2);margin-bottom:16px'});
    cycSportCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, cycleInfo.phase.icon + ' ' + cycleInfo.phase.name));
    cycSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, 'Intensit\u00e9 recommand\u00e9e : ' + intensity + '%'));

    // Sport tips
    cycleInfo.phase.sportTips.forEach(function(tip) {
      cycSportCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
    });

    // Warning or encouragement
    if (cycleInfo.phase.intensityFactor < 0.8) {
      var warnDiv = h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(192,57,43,0.06);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#C0392B;border-radius:2px'});
      warnDiv.textContent = '\u26A0 Phase de r\u00e9cup\u00e9ration \u2014 adaptez votre effort';
      cycSportCard.appendChild(warnDiv);
    } else if (cycleInfo.phase.intensityFactor > 1.0) {
      var greenDiv = h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(39,174,96,0.06);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#27AE60;border-radius:2px'});
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

  // Day tabs
  var tabs = h('div', {'class': 'day-tabs'});
  S.sportProgram.forEach(function(day, i) {
    tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedSportDay === i ? ' active' : ''), onclick: function(){ S.selectedSportDay = i; window.render(); }}, day.name));
  });
  p.appendChild(tabs);

  // Current day
  var day = S.sportProgram[S.selectedSportDay];
  if (day) {
    p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin:16px 0 12px'}, day.focus));

    (day.exercises || []).forEach(function(ex) {
      var card = h('div', {'class': 'exercise-card', onclick: function(){ S.sportModalExercise = ex; window.render(); }});
      card.appendChild(h('div', {'class': 'exercise-muscle'}, ex.m));
      card.appendChild(h('div', {'class': 'exercise-name'}, ex.n));
      card.appendChild(h('div', {'class': 'exercise-sets'}, ex.sets + ' \u2014 Repos ' + ex.rest));
      card.appendChild(h('div', {'class': 'exercise-detail'}, ex.eq));

      // Cycle intensity badge
      if (S.sex === 'femme' && S.cycleTracking && cycleInfo) {
        var intPct = Math.round(cycleInfo.phase.intensityFactor * 100);
        var intColor = intPct >= 100 ? '#27AE60' : intPct >= 80 ? '#E67E22' : '#C0392B';
        card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:' + intColor + ';margin-top:4px'}, 'Intensit\u00e9 cycle : ' + intPct + '%'));
      }

      // Video link
      var vlink = h('a', {'class': 'exercise-video', href: ex.video, target: '_blank', rel: 'noopener', onclick: function(e){
        e.stopPropagation();
        window.BLACKBOX && window.BLACKBOX.log('video_clicked', {exercise: ex.n});
        var count = window.GAMIFICATION ? GAMIFICATION.incrementCounter('exercises_viewed') : 0;
        if (count >= 20 && window.GAMIFICATION) GAMIFICATION.unlockBadge('exercises_20');
      }}, '▶ Voir la technique');
      card.appendChild(vlink);

      // ─── AI-suggested weight from strength profile ───
      var suggestedReps = ex.sets ? ex.sets.split('\u00d7')[1] : null;
      var suggested = window.getMusculationWeight ? window.getMusculationWeight(ex.n, ex.sets, suggestedReps) : null;
      if (suggested && suggested > 0) {
        card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#27AE60;margin-top:6px;padding:4px 8px;background:rgba(39,174,96,0.06);border-left:2px solid #27AE60'}, '\uD83D\uDCA1 Charge sugg\u00e9r\u00e9e : ' + suggested + 'kg'));
      }

      // ─── Weight/Load tracking ───
      var eqType = 'barre';
      var eqLower = (ex.eq || '').toLowerCase();
      if (/halt[eè]re|dumbbell|db/i.test(eqLower)) eqType = 'haltere';
      else if (/machine|poulie|cable|presse/i.test(eqLower)) eqType = 'machine';
      else if (/kettle|kb/i.test(eqLower)) eqType = 'kb';
      else if (/corps|body|poids du corps|aucun/i.test(eqLower)) eqType = 'bodyweight';
      else if (/barre|barbell/i.test(eqLower)) eqType = 'barre';

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
          style: 'width:70px;padding:6px 8px;border:1px solid var(--border);font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory)',
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
        weightRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, 'kg'));

        if (currentWeight) {
          var display = eqType === 'haltere' ? '2\u00d7' + currentWeight + 'kg' : currentWeight + 'kg';
          weightRow.appendChild(h('span', {style: 'font-family:Georgia;font-size:13px;font-style:italic;margin-left:auto;color:var(--black)'}, display));
        }

        card.appendChild(weightRow);
      } else {
        card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);margin-top:6px;font-style:italic'}, 'Poids de corps'));
      }

      // ─── TRACKER SÉRIES : recommandations + saisie réelle ───
      (function(exRef, isBodyweight) {
        var setsMatch = (exRef.sets || '').match(/^(\d+)\s*[x\u00d7]\s*(\d+)(?:-(\d+))?/);
        var numSets = setsMatch ? parseInt(setsMatch[1]) : 3;
        var minReps = setsMatch ? parseInt(setsMatch[2]) : 10;
        var maxReps = setsMatch && setsMatch[3] ? parseInt(setsMatch[3]) : minReps;

        var exPhase = (typeof getMuscuPhase === 'function') ? getMuscuPhase(S.muscuWeek || 1) : null;
        var sugWeight = getSuggestedWeight(exRef.n, minReps, exPhase) || 0;
        var progressiveWeight = getProgressiveWeight(exRef.n, sugWeight, S.muscuCycle || 1);

        var today = new Date().toISOString().slice(0, 10);
        if (!S.muscuSessionLog[today]) S.muscuSessionLog[today] = {};
        if (!S.muscuSessionLog[today][exRef.n]) {
          S.muscuSessionLog[today][exRef.n] = [];
          for (var si2 = 0; si2 < numSets; si2++) {
            S.muscuSessionLog[today][exRef.n].push({
              set: si2 + 1,
              targetWeight: progressiveWeight,
              targetReps: si2 < 2 ? maxReps : minReps,
              actualWeight: null,
              actualReps: null
            });
          }
        }
        var setData = S.muscuSessionLog[today][exRef.n];

        // Tableau des séries
        var setTable = h('div', {style: 'margin-top:8px;border:1px solid var(--border);border-radius:6px;overflow:hidden'});

        // Header
        var setHeader = h('div', {style: 'display:grid;grid-template-columns:40px 1fr 1fr;background:var(--surface,var(--ivory2));padding:6px 8px;font-size:10px;font-weight:700;color:var(--grey);text-transform:uppercase;letter-spacing:0.5px'});
        setHeader.appendChild(h('div', {}, '#'));
        setHeader.appendChild(h('div', {}, 'Conseill\u00e9'));
        setHeader.appendChild(h('div', {}, 'R\u00e9alis\u00e9'));
        setTable.appendChild(setHeader);

        // Rows
        setData.forEach(function(setRow, si3) {
          var row = h('div', {style: 'display:grid;grid-template-columns:40px 1fr 1fr;padding:6px 8px;border-top:1px solid var(--border);align-items:center'});

          row.appendChild(h('div', {style: 'font-size:12px;font-weight:700;color:var(--text)'}, String(setRow.set)));

          var conseilleStr = (progressiveWeight > 0 && !isBodyweight)
            ? (progressiveWeight + ' kg \u00d7 ' + setRow.targetReps)
            : (setRow.targetReps + ' reps');
          row.appendChild(h('div', {style: 'font-size:12px;color:var(--grey)'}, conseilleStr));

          var inputZone = h('div', {style: 'display:flex;align-items:center;gap:4px', onclick: function(e){ e.stopPropagation(); }});

          if (!isBodyweight) {
            var weightPlaceholder = progressiveWeight > 0 ? String(progressiveWeight) : 'kg';
            var weightInput = h('input', {
              type: 'number', min: '0', max: '500', step: '2.5',
              placeholder: weightPlaceholder,
              value: setRow.actualWeight !== null ? String(setRow.actualWeight) : '',
              style: 'width:48px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;font-size:11px;text-align:center;background:var(--bg,var(--ivory))',
              oninput: (function(sr){ return function(e) {
                var v = parseFloat(e.target.value);
                sr.actualWeight = isNaN(v) ? null : v;
                saveMuscuSessionLog();
              }; })(setRow)
            });
            inputZone.appendChild(weightInput);
            inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey)'}, 'kg'));
          } else {
            var pcLabel = h('input', {
              type: 'number', min: '0', max: '200', step: '1',
              placeholder: 'PC',
              value: setRow.actualWeight !== null ? String(setRow.actualWeight) : '',
              style: 'width:40px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;font-size:11px;text-align:center;background:var(--bg,var(--ivory))',
              oninput: (function(sr){ return function(e) {
                var v = parseFloat(e.target.value);
                sr.actualWeight = isNaN(v) ? null : v;
                saveMuscuSessionLog();
              }; })(setRow)
            });
            inputZone.appendChild(pcLabel);
            inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey)'}, 'kg+'));
          }

          var repsInput = h('input', {
            type: 'number', min: '0', max: '50', step: '1',
            placeholder: String(setRow.targetReps),
            value: setRow.actualReps !== null ? String(setRow.actualReps) : '',
            style: 'width:36px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;font-size:11px;text-align:center;background:var(--bg,var(--ivory))',
            oninput: (function(sr){ return function(e) {
              var v = parseInt(e.target.value);
              sr.actualReps = isNaN(v) ? null : v;
              saveMuscuSessionLog();
            }; })(setRow)
          });
          inputZone.appendChild(repsInput);
          inputZone.appendChild(h('span', {style: 'font-size:9px;color:var(--grey)'}, 'reps'));

          // Indicateur succès/échec
          if (setRow.actualReps !== null && (setRow.actualWeight !== null || isBodyweight)) {
            var ok = setRow.actualReps >= setRow.targetReps && (isBodyweight || setRow.actualWeight >= setRow.targetWeight);
            inputZone.appendChild(h('span', {'class': ok ? 'set-success' : 'set-fail', style: 'font-size:14px'}, ok ? '\u2713' : '\u2717'));
          }

          row.appendChild(inputZone);
          setTable.appendChild(row);
        });

        // Note progression semaine prochaine
        if (progressiveWeight > 0 && !isBodyweight) {
          var lbKeywords = /squat|leg|fessier|ischios|mollet/i;
          var nextIncr = lbKeywords.test(exRef.n) ? 5 : 2.5;
          var progressNote = h('div', {style: 'padding:6px 8px;background:var(--greenbg,rgba(26,74,26,.06));border-top:1px solid var(--border);font-size:10px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif'});
          progressNote.appendChild(h('span', {style: 'color:var(--green,#1A4A1A)'}, '\uD83D\uDCC8 '));
          progressNote.appendChild(h('span', {}, 'Objectif semaine prochaine\u00a0: ' + (progressiveWeight + nextIncr) + '\u00a0kg si toutes s\u00e9ries r\u00e9ussies'));
          setTable.appendChild(progressNote);
        }

        // Mini graphe progression si >= 3 entrées historique
        var progHist = S.muscuProgressionHistory[exRef.n];
        if (progHist && progHist.length >= 3) {
          var lastFive = progHist.slice(-5);
          var progressValues = lastFive.map(function(e) { return e.weight; });
          var progGraph = h('div', {style: 'padding:6px 8px;border-top:1px solid var(--border);font-size:10px;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;display:flex;align-items:center;gap:6px'});
          progGraph.appendChild(h('span', {style: 'color:#27AE60'}, '\uD83D\uDCCA '));
          var sparkSvg = renderSparkline(progressValues, '#27AE60');
          if (sparkSvg) progGraph.appendChild(sparkSvg);
          progGraph.appendChild(h('span', {style: 'margin-left:4px'}, progressValues[0] + '\u00a0kg \u2192 ' + progressValues[progressValues.length - 1] + '\u00a0kg'));
          setTable.appendChild(progGraph);
        }

        card.appendChild(setTable);
      })(ex, eqType === 'bodyweight');

      p.appendChild(card);
    });

    // ─── EXERCICES BONUS (depuis programmes dédiés) ───
    var bonusDayList = S.bonusExercises[S.selectedSportDay] || [];
    if (bonusDayList.length > 0) {
      p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin:16px 0 8px'}, 'Exercices bonus'));
      bonusDayList.forEach(function(bex, bi) {
        var bc = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #27AE60'});
        var bnRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center'});
        bnRow.appendChild(h('div', {'class': 'exercise-muscle'}, bex.m));
        bnRow.appendChild(h('span', {style: 'font-size:18px;color:#C0392B;cursor:pointer;line-height:1;padding:0 4px', onclick: (function(idx) { return function(e) { e.stopPropagation(); var arr = S.bonusExercises[S.selectedSportDay] || []; arr.splice(idx, 1); S.bonusExercises[S.selectedSportDay] = arr; window.render(); }; })(bi)}, '\u00d7'));
        bc.appendChild(bnRow);
        bc.appendChild(h('div', {'class': 'exercise-name'}, bex.n));
        bc.appendChild(h('div', {'class': 'exercise-sets'}, bex.sets + ' \u2014 Repos ' + bex.rest));
        if (bex.eq) bc.appendChild(h('div', {'class': 'exercise-detail'}, bex.eq));
        var bsugg = window.getMusculationWeight ? window.getMusculationWeight(bex.n, bex.sets, (bex.sets || '').split('\u00d7')[1]) : null;
        if (bsugg && bsugg > 0) bc.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#27AE60;margin-top:6px;padding:4px 8px;background:rgba(39,174,96,0.06);border-left:2px solid #27AE60'}, '\uD83D\uDCA1 Charge sugg\u00e9r\u00e9e\u00a0: ' + bsugg + '\u00a0kg'));
        p.appendChild(bc);
      });
    }

    // Day summary
    var allEx = day.exercises.concat(bonusDayList);
    var estDuration = calcSessionDuration(allEx);
    var summary = h('div', {'class': 'day-total'});
    summary.appendChild(h('div', {'class': 'dt-label'}, allEx.length + ' exercice' + (allEx.length > 1 ? 's' : '') + (bonusDayList.length > 0 ? ' (dont ' + bonusDayList.length + ' bonus)' : '')));
    summary.appendChild(h('div', {'class': 'dt-val'}, '~' + estDuration + ' min'));
    p.appendChild(summary);

    // ─── SÉANCE TERMINÉE + BILAN CALORIQUE ───
    var todayKey = S.selectedSportDay + '_' + new Date().toISOString().slice(0, 10);
    var doneSess = S.sessionHistory && S.sessionHistory[todayKey];
    if (doneSess) {
      var doneBadge = h('div', {style: 'border:1px solid #27AE60;background:#E8F5E9;padding:12px 16px;margin-top:8px'});
      doneBadge.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;font-weight:bold;color:#27AE60'}, '\u2713 S\u00e9ance valid\u00e9e'));
      doneBadge.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#1B5E20;margin-top:4px'}, doneSess.duration + '\u00a0min \u2014 ' + doneSess.kcalTotal + '\u00a0kcal brul\u00e9es (dont +' + doneSess.kcalEpoc + '\u00a0kcal EPOC)'));
      doneBadge.appendChild(h('button', {style: 'margin-top:8px;font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);background:none;border:none;cursor:pointer;padding:0', onclick: function() { delete S.sessionHistory[todayKey]; window.render(); }}, 'Annuler'));
      p.appendChild(doneBadge);
    } else if (S.sessionCompleting === S.selectedSportDay) {
      var realDur = S._sessionDuration != null ? S._sessionDuration : estDuration;
      var kcalRes = calcSessionKcal(allEx, realDur);
      var compPanel = h('div', {style: 'border:1px solid var(--border);background:var(--ivory2);padding:16px;margin-top:8px'});
      compPanel.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:12px'}, 'Bilan de s\u00e9ance'));
      // Durée
      var durRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin-bottom:14px'});
      durRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);flex:1'}, 'Dur\u00e9e r\u00e9elle'));
      var durInp = h('input', {type: 'number', min: '10', max: '180', value: String(realDur), style: 'width:60px;padding:6px;border:1px solid var(--border);font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory)', onclick: function(e) { e.stopPropagation(); }, onchange: function(e) { var v = parseInt(e.target.value); if (!isNaN(v) && v > 0) { S._sessionDuration = v; window.render(); } }});
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
      kr2.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:14px;color:var(--orange,#6A4A1A)'}, '+' + kcalRes.epoc + '\u00a0kcal'));
      kcalBox.appendChild(kr2);
      var kr3 = h('div', {style: 'display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px'});
      kr3.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;font-weight:bold'}, 'Total estim\u00e9'));
      kr3.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:17px;font-weight:bold;color:var(--green,#1A4A1A)'}, kcalRes.total + '\u00a0kcal'));
      kcalBox.appendChild(kr3);
      kcalBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin-top:6px;font-style:italic'}, 'FC estim\u00e9e\u00a0' + kcalRes.hr + '\u00a0bpm \u2014 RPE\u00a0' + kcalRes.rpe + '/10 \u2014 Keytel\u00a02005 \u00b7 Tanaka\u00a02001'));
      compPanel.appendChild(kcalBox);
      // ⚠ Note TDEE — évite le double-comptage (audit interdépendance)
      compPanel.appendChild(h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border-left:3px solid var(--orange,#6A4A1A);padding:8px 12px;margin-bottom:14px;font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--text,#0A0A09);line-height:1.5'}, '\u26a0 Ces calories sont d\u00e9j\u00e0 int\u00e9gr\u00e9es dans votre TDEE via votre facteur d\'activit\u00e9. Ce bilan confirme votre d\u00e9pense r\u00e9elle — ne les d\u00e9duisez pas en plus de votre objectif calorique journalier.'));
      // Contexte nutritionnel : montre l'impact de la session sur le budget calorique
      var nc = getNutritionContext();
      var nutritionContextHtml = '';
      if (nc && nc.caloriesTarget > 0 && kcalRes && kcalRes.total > 0) {
        var pct = Math.round((kcalRes.total / nc.caloriesTarget) * 100);
        var warningColor = pct > 40 ? 'var(--red,#5A1010)' : pct > 25 ? 'var(--orange,#6A4A1A)' : 'var(--green,#1A4A1A)';
        var warningMsg = pct > 40
          ? '\u26a0\ufe0f Session tr\u00e8s intense \u2014 pensez \u00e0 ajuster votre alimentation post-entra\u00eenement'
          : pct > 25
            ? '\uD83D\uDD36 Session mod\u00e9r\u00e9e \u2014 nutrition pr\u00e9/post recommand\u00e9e'
            : '\u2705 Session \u00e9quilibr\u00e9e pour votre objectif';
        nutritionContextHtml =
          '<div style="margin-top:12px;padding:10px 14px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);font-size:13px">' +
            '<div style="font-weight:600;margin-bottom:6px;color:var(--text)">\uD83C\uDF7D\ufe0f Impact nutritionnel</div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
              '<span>Cible calorique du jour</span>' +
              '<span style="font-weight:600">' + nc.caloriesTarget + ' kcal</span>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
              '<span>Calories br\u00fcl\u00e9es en session</span>' +
              '<span style="font-weight:600;color:' + warningColor + '">\u2212' + kcalRes.total + ' kcal (' + pct + '%)</span>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
              '<span>Cible prot\u00e9ines</span>' +
              '<span style="font-weight:600">' + nc.proteinGrams + ' g</span>' +
            '</div>' +
            '<div style="font-size:12px;color:' + warningColor + '">' + warningMsg + '</div>' +
          '</div>';
        compPanel.appendChild(h('div', {html: nutritionContextHtml}));
      }
      var saveBtn = h('button', {style: 'width:100%;padding:12px;background:var(--black);color:#fff;border:none;font-family:"Helvetica Neue",sans-serif;font-size:13px;cursor:pointer', onclick: function() {
        if (!S.sessionHistory) S.sessionHistory = {};
        S.sessionHistory[todayKey] = {duration: realDur, kcalBase: kcalRes.base, kcalEpoc: kcalRes.epoc, kcalTotal: kcalRes.total, date: new Date().toISOString()};
        S.sessionCompleting = false; S._sessionDuration = null;
        window.BLACKBOX && window.BLACKBOX.log('session_done', {day: S.selectedSportDay, kcal: kcalRes.total, duration: realDur});
        window.render();
      }}, '\u2713 Valider la s\u00e9ance');
      compPanel.appendChild(saveBtn);
      compPanel.appendChild(h('div', {style: 'text-align:center;margin-top:8px'}, h('button', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);background:none;border:none;cursor:pointer', onclick: function() { S.sessionCompleting = false; S._sessionDuration = null; window.render(); }}, 'Annuler')));
      p.appendChild(compPanel);
    } else {
      p.appendChild(h('button', {'class': 'regen-btn', style: 'margin-top:8px;background:var(--black);color:#fff', onclick: function() { S.sessionCompleting = S.selectedSportDay; S._sessionDuration = null; window.render(); }}, '\u2713 S\u00e9ance termin\u00e9e'));
    }
  }

  // ─── PROGRAMMES DÉDIÉS ───
  var dedicatedMap = {
    'Fessiers':    ['fessiers_dedied'],
    'Abdominaux':  ['abdos_dedied'],
    'Bras':        ['biceps_dedied', 'triceps_dedied']
  };
  var selectedZonesForDedicated = Object.keys(S.sportFocus).filter(function(z){ return S.sportFocus[z] > 0; });
  var dedicatedToShow = [];
  selectedZonesForDedicated.forEach(function(zone) {
    if (dedicatedMap[zone]) {
      dedicatedMap[zone].forEach(function(key) {
        if (dedicatedToShow.indexOf(key) === -1) dedicatedToShow.push(key);
      });
    }
  });

  if (dedicatedToShow.length > 0 && window.NFC_PROGRAMS) {
    p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:28px'}, 'Programmes ciblés'));
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:12px'}, 'Séances bonus à intégrer selon vos priorités.'));

    dedicatedToShow.forEach(function(key) {
      var prog = window.NFC_PROGRAMS[key];
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
              style: 'flex:1;padding:8px;text-align:center;cursor:pointer;font-family:"Helvetica Neue",sans-serif;font-size:10px;border-right:1px solid var(--border);' + (isA ? 'background:var(--black);color:#fff' : 'background:var(--ivory);color:var(--grey)'),
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
          left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:2px'}, ex.muscle + ' \u2014 ' + ex.equipment));
          if (ex.technique) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--orange);margin-top:2px'}, ex.technique));
          var sugW4 = getSuggestedWeight(ex.name, ex.reps, phase4);
          if (sugW4 && sugW4 > 0) left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#27AE60;margin-top:2px'}, '\u2192 ~' + sugW4 + ' kg'));
          row.appendChild(left);
          var right = h('div', {style: 'text-align:right;flex-shrink:0;margin-left:12px'});
          right.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px;font-weight:bold'}, ex.sets + '\u00d7' + ex.reps));
          right.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:2px'}, ex.rest));
          // Bouton + / Ajouté — ajoute l'exercice en bonus à la séance courante
          var bonusArr = S.bonusExercises[S.selectedSportDay] || [];
          var isAddedBonus = false;
          for (var bci = 0; bci < bonusArr.length; bci++) { if (bonusArr[bci].n === exBase.name) { isAddedBonus = true; break; } }
          var addBtn = h('div', {
            style: 'margin-top:6px;padding:4px 8px;cursor:pointer;font-family:"Helvetica Neue",sans-serif;font-size:10px;text-align:center;border:1px solid ' + (isAddedBonus ? '#27AE60' : 'var(--border)') + ';color:' + (isAddedBonus ? '#27AE60' : 'var(--grey)') + ';background:' + (isAddedBonus ? 'rgba(39,174,96,0.08)' : 'transparent'),
            onclick: (function(exBCapture) { return function(e) {
              e.stopPropagation();
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
        if (prog.notes) card.appendChild(h('div', {style: 'padding:10px 16px;border-top:1px solid var(--border);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);font-style:italic'}, prog.notes));
      }
      p.appendChild(card);
    });
  }

  // Regenerate
  p.appendChild(h('button', {'class': 'regen-btn', style: 'margin-top:16px', onclick: function(){
    S.sportProgram = generateSportProgram();
    S.selectedSportDay = 0;
    window.BLACKBOX && window.BLACKBOX.log('sport_program_regenerated');
    window.render();
  }}, '↻ Régénérer le programme'));

  // Export PDF
  p.appendChild(h('button', {'class': 'btn-primary', style: 'margin-top:12px;background:var(--black2)', onclick: function() { window.exportSportPDF(); }}, '\u21e9 Exporter le programme en PDF'));

  // Weight chart removed (was crashing)

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 3; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier les zones'}));
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
  inputRow.appendChild(h('span', {'class': 'num-unit'}, 'kg'));
  inputRow.appendChild(h('button', {'class': 'btn-primary', style: 'width:auto;margin:0;padding:10px 20px', onclick: function(){
    var v = parseFloat(wi.value);
    if (!isNaN(v) && v >= 30 && v <= 200) {
      var key = 'mtd_weight_history_' + userId;
      var hist = []; try { hist = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { hist = []; }
      var today = new Date().toISOString().split('T')[0];
      hist.push({date: today, weight: v});
      try { localStorage.setItem(key, JSON.stringify(hist)); } catch(e) { console.warn('[weight_history] localStorage error:', e); }
      S.weight = v;
      // Sync with S.weightHistory
      if (!S.weightHistory) S.weightHistory = [];
      S.weightHistory.push({date: today, weight: v});
      window.BLACKBOX && window.BLACKBOX.log('weight_logged', {weight: v, from: 'sport'});
      if (window.GAMIFICATION) {
        GAMIFICATION.unlockBadge('first_weigh');
        if (hist.length >= 10) GAMIFICATION.unlockBadge('weight_10');
      }
      if (window.GAMIFICATION) GAMIFICATION.showToast('Poids enregistré : ' + v + ' kg');
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
          x: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Helvetica Neue', size: 9 }, color: '#9A9A94' } },
          y: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Georgia', size: 11 }, color: '#0A0A09' } }
        }
      }
    }); } catch(e){}
  }, 100);
}

// ─── SPORT MODAL (exercise detail) ───
function renderSportModal(app) {
  var ov = h('div', {'class': 'modal-overlay' + (S.sportModalExercise ? ' open' : ''), onclick: function(e){ if (e.target === ov) { S.sportModalExercise = null; window.render(); } }});
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
    hdr.appendChild(h('button', {'class': 'modal-close', onclick: function(){ S.sportModalExercise = null; window.render(); }}, '✕'));
    sheet.appendChild(hdr);

    var body = h('div', {'class': 'modal-body'});

    // Muscle + Equipment
    var pills = h('div', {'class': 'macro-pills'});
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.m), h('div', {'class': 'mp-label'}, 'Muscle')]));
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.sets), h('div', {'class': 'mp-label'}, 'Séries')]));
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, ex.rest), h('div', {'class': 'mp-label'}, 'Repos')]));
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, '★'.repeat(Math.max(0, parseInt(ex.lv) || 0))), h('div', {'class': 'mp-label'}, 'Niveau')]));
    body.appendChild(pills);

    // Equipment
    body.appendChild(h('div', {'class': 'section-label'}, '\u00c9quipement'));
    body.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);margin-bottom:16px'}, ex.eq));

    // Saved weight display
    var modalSavedW = S.musculationWeights[ex.n];
    if (modalSavedW && modalSavedW.weight) {
      var modalEqType = modalSavedW.type || 'barre';
      var modalWeightDisplay = modalEqType === 'haltere' ? '2\u00d7' + modalSavedW.weight + ' kg' : modalSavedW.weight + ' kg';
      var modalTypeLabel = modalEqType === 'barre' ? '\uD83C\uDFCB\uFE0F Barre' : modalEqType === 'haltere' ? '\uD83D\uDCAA Halt\u00e8res' : modalEqType === 'machine' ? '\u2699\uFE0F Machine' : modalEqType === 'kb' ? '\uD83D\uDD14 Kettlebell' : 'Poids de corps';

      body.appendChild(h('div', {'class': 'section-label'}, 'Charge de travail'));
      var modalWeightCard = h('div', {style: 'display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--ivory2,#F8F7F2);border-left:3px solid var(--black,#0A0A09);margin-bottom:16px'});
      modalWeightCard.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:24px;font-weight:bold;color:var(--black)'}, modalWeightDisplay));
      modalWeightCard.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey)'}, modalTypeLabel));
      body.appendChild(modalWeightCard);
    }

    // Description
    body.appendChild(h('div', {'class': 'section-label'}, 'Exécution'));
    body.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.7;margin-bottom:16px'}, ex.desc));

    // Tips
    if (ex.tips && ex.tips.length) {
      body.appendChild(h('div', {'class': 'section-label'}, 'Conseils'));
      var tl = h('ul', {'class': 'ingredient-list'});
      ex.tips.forEach(function(tip){ tl.appendChild(h('li', {}, tip)); });
      body.appendChild(tl);
    }

    // Video button (prominent)
    body.appendChild(h('a', {
      'class': 'btn-primary', href: ex.video, target: '_blank', rel: 'noopener',
      style: 'display:block;text-align:center;text-decoration:none;margin-top:16px',
      onclick: function(){ window.BLACKBOX && window.BLACKBOX.log('video_clicked', {exercise: ex.n}); }
    }, '▶ Voir la vidéo technique'));

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
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Niveau'));
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
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Jours d\'entraînement par semaine'));
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
        var avgPct = (z.pct[0] + z.pct[1]) / 200;
        var zonePace = Math.round(paceSeconds / avgPct);
        var zMin = Math.floor(zonePace / 60);
        var zSec = zonePace % 60;
        var paceStr = zMin + ':' + (zSec < 10 ? '0' : '') + zSec;
        zonesInfo.appendChild(h('div', {style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:12px'}, [
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
    p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Sélectionnez un objectif et un niveau'));
  }
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
    if (ok) {
      var goalObj = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
      S.runningProgram = window.generateRunningProgram(goalObj ? goalObj.weeks : 8, S.runningDays, S.runningLevel, S.runningGoal);
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
    S.runningProgram = window.generateRunningProgram(goalObj ? goalObj.weeks : 8, S.runningDays, S.runningLevel, S.runningGoal);
  }

  var program = S.runningProgram;
  if (!program || !program.length) {
    p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 7; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
    return;
  }
  var totalWeeks = program.length;
  if (S.runningWeek > totalWeeks) S.runningWeek = totalWeeks;
  if (S.runningWeek < 1) S.runningWeek = 1;
  var currentWeekData = program[S.runningWeek - 1];
  if (!currentWeekData) return;

  var goalObj2 = (window.RUNNING_GOALS || []).find(function(g){ return g.id === S.runningGoal; });
  var levelObj = (window.RUNNING_LEVELS || []).find(function(l){ return l.id === S.runningLevel; });

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme'));
  p.appendChild(h('h1', {html: (goalObj2 ? goalObj2.name : 'Running') + '<br><em>Plan</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, totalWeeks + ' semaines · ' + S.runningDays + ' jours/semaine · Niveau ' + (levelObj ? levelObj.name : '')));

  // Week navigation
  var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.runningWeek > 1) { S.runningWeek--; S.selectedRunDay = 0; window.render(); }
  }}, '\u2190'));
  weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.runningWeek + ' / ' + totalWeeks));
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.runningWeek < totalWeeks) { S.runningWeek++; S.selectedRunDay = 0; window.render(); }
  }}, '\u2192'));
  p.appendChild(weekNav);

  // Phase + volume info
  var phaseColors = {Base: '#1A3A6A', 'Développement': '#E67E22', 'Spécifique': '#C0392B', 'Affûtage': '#27AE60'};
  var phaseColor = phaseColors[currentWeekData.phase] || '#0A0A09';
  var infoCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
  infoCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + phaseColor + ';margin-bottom:4px'}, 'Phase : ' + currentWeekData.phase));
  infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Volume : ~' + currentWeekData.totalKm + ' km · Sortie longue : ' + currentWeekData.longRun + ' km'));
  if (currentWeekData.isDeload) {
    infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E67E22;margin-top:6px;font-weight:bold'}, '📉 Semaine de récupération'));
  }
  if (currentWeekData.isTaper) {
    infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#27AE60;margin-top:6px;font-weight:bold'}, '🎯 Affûtage — gardez l\'intensité, réduisez le volume'));
  }
  p.appendChild(infoCard);

  // Day tabs
  var sessions = currentWeekData.sessions;
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
    var zoneColorMap = {'Z1': '#1A4A1A', 'Z2': '#1A3A6A', 'Z3': '#6A4A1A', 'Z4': '#8A3A1A', 'Z5': '#5A1010', 'Z1-Z2': '#1A4A1A', 'Z4-Z5': '#5A1010', 'Z3-Z4': '#8A3A1A'};
    var sessColor = zoneColorMap[sess.zone] || '#0A0A09';

    var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid ' + sessColor});
    sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + sessColor + ';margin-bottom:6px'}, sess.zone));
    sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin-bottom:4px'}, sess.icon + ' ' + sess.name));
    sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, sess.desc));
    if (sess.distance) {
      sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;color:' + sessColor + ';margin-bottom:8px'}, '📏 ' + sess.distance));
    }
    if (sess.detail) {
      sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.6;padding:10px;background:var(--ivory2);border:1px solid var(--border)'}, sess.detail));
    }
    p.appendChild(sessCard);
  }

  // Week notes
  if (currentWeekData.notes) {
    p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;text-align:center;margin:16px 0'}, currentWeekData.notes));
  }

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 7; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
}

// ─── STEP 9: HYROX CONFIG ───
function renderHyroxConfig(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Hyrox'));
  p.appendChild(h('h1', {html: 'Préparation<br><em>Hyrox</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, '8 semaines pour être prêt le jour J'));

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
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Niveau'));
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
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Jours d\'entraînement par semaine'));
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
    nameDiv.appendChild(h('div', {style: 'font-family:Georgia;font-size:14px'}, station.name));
    // Show standard for their level
    if (station.standards && S.hyroxLevel && station.standards[S.hyroxLevel]) {
      nameDiv.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey)'}, 'Standard ' + S.hyroxLevel + ' : ' + station.standards[S.hyroxLevel]));
    }
    row.appendChild(nameDiv);

    var currentVal = S.hyroxBenchmarks[station.id] || '';
    var inputWrap = h('div', {style: 'display:flex;align-items:center;gap:4px;flex-shrink:0'});
    inputWrap.appendChild(h('input', {
      type: 'text', placeholder: 'mm:ss', value: currentVal, style: 'width:64px;padding:6px 8px;border:1px solid var(--border);font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory)',
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
        row.appendChild(h('span', {style: 'font-size:14px;margin-left:4px'}, isAbove ? '🔴' : '🟢'));
      }
    }

    bmGrid.appendChild(row);
  });
  p.appendChild(bmGrid);

  // Continue button
  p.appendChild(h('div', {style: 'height:16px'}));
  var ok = S.hyroxGoal !== null && S.hyroxLevel !== null;
  if (!ok) {
    p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Sélectionnez un objectif et un niveau'));
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
  if (!S.hyroxProgram || S.hyroxProgram.length === 0) {
    S.hyroxProgram = window.generateHyroxProgram(S.hyroxDays, S.hyroxLevel, S.hyroxGoal);
  }

  var program = S.hyroxProgram;
  if (!program || !program.length) {
    p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 9; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
    return;
  }
  var totalWeeks = program.length;
  if (S.hyroxWeek > totalWeeks) S.hyroxWeek = totalWeeks;
  if (S.hyroxWeek < 1) S.hyroxWeek = 1;
  var currentWeekData = program[S.hyroxWeek - 1];
  if (!currentWeekData) return;

  var goalObj = (window.HYROX_GOALS || []).find(function(g){ return g.id === S.hyroxGoal; });
  var levelObj = (window.HYROX_LEVELS || []).find(function(l){ return l.id === S.hyroxLevel; });

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Hyrox'));
  p.appendChild(h('h1', {html: 'Préparation<br><em>8 semaines</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Phase ' + currentWeekData.phase + ' · ' + (goalObj ? goalObj.name : '') + ' · ' + (levelObj ? levelObj.icon + ' ' + levelObj.name : '')));

  // Competition week banner
  if (S.hyroxWeek === 8) {
    var banner = h('div', {style: 'border:2px solid #C0392B;padding:16px;background:rgba(192,57,43,0.04);margin-bottom:16px;text-align:center'});
    banner.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;color:#C0392B;margin-bottom:4px'}, '🏆 COMPETITION WEEK'));
    banner.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Simulation complète + repos. Vous êtes prêt !'));
    p.appendChild(banner);
  }

  // Week navigation
  var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.hyroxWeek > 1) { S.hyroxWeek--; S.selectedHyroxDay = 0; window.render(); }
  }}, '\u2190'));
  weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.hyroxWeek + ' / ' + totalWeeks));
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.hyroxWeek < totalWeeks) { S.hyroxWeek++; S.selectedHyroxDay = 0; window.render(); }
  }}, '\u2192'));
  p.appendChild(weekNav);

  // Phase info
  var phaseColors = {Base: '#1A3A6A', 'Développement': '#E67E22', 'Compétition': '#C0392B'};
  var phaseColor = phaseColors[currentWeekData.phase] || '#0A0A09';
  var infoCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
  infoCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + phaseColor + ';margin-bottom:4px'}, 'Phase : ' + currentWeekData.phase));
  infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, currentWeekData.notes));
  if (currentWeekData.isDeload) {
    infoCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E67E22;margin-top:6px;font-weight:bold'}, '📉 Semaine de décharge'));
  }
  p.appendChild(infoCard);

  // Day tabs
  var sessions = currentWeekData.sessions;
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
    sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin-bottom:10px'}, sess.name));

    // Exercises list
    var exList = h('div', {style: 'margin-bottom:10px'});
    (sess.exercises || []).forEach(function(ex, idx) {
      if (!ex.name && !ex.detail) return;
      var exRow = h('div', {style: 'padding:6px 0;border-bottom:1px solid var(--border)'});
      if (ex.name) {
        exRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px'}, (ex.name.indexOf('→') === 0 || ex.name.indexOf('rounds') !== -1 ? '' : (idx + 1) + '. ') + ex.name));
      }
      if (ex.detail) {
        exRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, ex.detail));
      }
      exList.appendChild(exRow);
    });
    sessCard.appendChild(exList);

    // Coach notes
    if (sess.notes) {
      sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;padding:10px;background:var(--ivory2);border:1px solid var(--border);margin-top:8px'}, '💡 ' + sess.notes));
    }
    p.appendChild(sessCard);
  }

  // Benchmarks comparison if filled
  var hasBenchmarks = Object.keys(S.hyroxBenchmarks).some(function(k){ return S.hyroxBenchmarks[k]; });
  if (hasBenchmarks && S.hyroxLevel) {
    p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Vos benchmarks vs standards'));
    var bmCard = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin-bottom:16px'});
    var stations = window.HYROX_STATIONS || [];
    stations.forEach(function(station) {
      var val = S.hyroxBenchmarks[station.id];
      if (!val || station.id === 'run') return;
      var std = station.standards ? station.standards[S.hyroxLevel] : null;
      var bmRow = h('div', {style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:12px'});
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
          var diffColor = diff > 0 ? '#C0392B' : '#27AE60';
          valSpan.appendChild(h('span', {style: 'color:' + diffColor + ';margin-left:8px;font-size:10px'}, diffStr + ' vs standard'));
        }
      }
      bmRow.appendChild(valSpan);
      bmCard.appendChild(bmRow);
    });
    p.appendChild(bmCard);
  }

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 9; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
}

// ═══════════════════════════════════════
// PADEL MODULE
// ═══════════════════════════════════════

function renderPadelConfig(p) {
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

  p.appendChild(h('div', {'class': 'section-label'}, 'Niveau'));
  var lg = h('div', {'class': 'level-list'});
  (window.PADEL_LEVELS || []).forEach(function(lv) {
    lg.appendChild(h('div', {'class': 'level-item' + (S.padelLevel === lv.id ? ' on' : ''), onclick: function(){ S.padelLevel = lv.id; window.render(); }}, [
      h('div', {}, [h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name), h('div', {'class': 'level-desc'}, lv.desc)])
    ]));
  });
  p.appendChild(lg);

  p.appendChild(h('div', {'class': 'section-label'}, 'Jours par semaine'));
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
        var star = h('span', {style: 'cursor:pointer;font-size:18px;opacity:' + ((S.padelProfile[sk.id] || 0) >= rating ? '1' : '0.2'), onclick: function(){ S.padelProfile[sk.id] = S.padelProfile[sk.id] === rating ? 0 : rating; window.render(); }}, '★');
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
    p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 11; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
    return;
  }
  var week = S.padelProgram[S.padelWeek - 1];
  if (!week) return;

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Padel'));
  p.appendChild(h('h1', {html: 'Semaine ' + S.padelWeek + '<br><em>' + week.phase + '</em>'}));
  var goalName = ''; (window.PADEL_GOALS || []).forEach(function(g){ if(g.id===S.padelGoal) goalName=g.name; });
  p.appendChild(h('p', {'class': 'subtitle'}, S.padelDays + ' jours/semaine — ' + goalName));
  p.appendChild(h('div', {style: 'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);margin-bottom:8px'}, week.notes));

  // Week navigation
  var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
  wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.padelWeek <= 1, onclick: function(){ S.padelWeek--; S.selectedPadelDay = 0; window.render(); }}, '←'));
  wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.padelWeek + ' / 8'));
  wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.padelWeek >= 8, onclick: function(){ S.padelWeek++; S.selectedPadelDay = 0; window.render(); }}, '→'));
  p.appendChild(wn);

  // Day tabs
  var tabs = h('div', {'class': 'day-tabs'});
  week.sessions.forEach(function(s, i) {
    tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedPadelDay === i ? ' active' : ''), onclick: function(){ S.selectedPadelDay = i; window.render(); }}, 'Jour ' + (i + 1)));
  });
  p.appendChild(tabs);

  var session = week.sessions[S.selectedPadelDay];
  if (session) {
    var colors = {technique: 'var(--blue,#1A3A6A)', physical: 'var(--green,#1A4A1A)', match: 'var(--red,#5A1010)', tactics: 'var(--orange,#6A4A1A)', recovery: 'var(--grey,#6B6B65)'};
    var card = h('div', {style: 'border-left:3px solid ' + (colors[session.type] || 'var(--black)') + ';padding:16px;margin:12px 0;background:var(--ivory2,#F4F4F0)'});
    card.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:12px'}, session.name));
    (session.exercises || []).forEach(function(ex, i) {
      var exDiv = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
      exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:12px;font-weight:500'}, (i + 1) + '. ' + ex.name));
      exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, ex.detail));
      if (ex.duration) exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2,#9A9A94);margin-top:2px'}, '⏱ ' + ex.duration));
      card.appendChild(exDiv);
    });
    card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);font-style:italic;margin-top:12px;padding-top:8px;border-top:1px solid var(--ivory3)'}, session.notes));
    p.appendChild(card);
  }

  if (window.renderStrengthGrade) renderStrengthGrade(p);
  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 11; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
}

// ═══════════════════════════════════════
// GOLF MODULE
// ═══════════════════════════════════════

function renderGolfConfig(p) {
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

  p.appendChild(h('div', {'class': 'section-label'}, 'Niveau'));
  var lg = h('div', {'class': 'level-list'});
  (window.GOLF_LEVELS || []).forEach(function(lv) {
    lg.appendChild(h('div', {'class': 'level-item' + (S.golfLevel === lv.id ? ' on' : ''), onclick: function(){ S.golfLevel = lv.id; window.render(); }}, [
      h('div', {}, [h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name), h('div', {'class': 'level-desc'}, lv.desc + ' (HC ' + lv.handicapRange + ')')])
    ]));
  });
  p.appendChild(lg);

  p.appendChild(h('div', {'class': 'section-label'}, 'Jours par semaine'));
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
    left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:8px;color:var(--grey2);letter-spacing:1px;text-transform:uppercase'}, sk.category));
    row.appendChild(left);
    var stars = h('div', {style: 'display:flex;gap:4px'});
    for (var i = 1; i <= 5; i++) {
      (function(rating) {
        stars.appendChild(h('span', {style: 'cursor:pointer;font-size:18px;opacity:' + ((S.golfProfile[sk.id] || 0) >= rating ? '1' : '0.2'), onclick: function(){ S.golfProfile[sk.id] = S.golfProfile[sk.id] === rating ? 0 : rating; window.render(); }}, '★'));
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
    p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 13; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
    return;
  }
  var week = S.golfProgram[S.golfWeek - 1];
  if (!week) return;

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Golf'));
  p.appendChild(h('h1', {html: 'Semaine ' + S.golfWeek + '<br><em>' + week.phase + '</em>'}));
  var goalName = ''; (window.GOLF_GOALS || []).forEach(function(g){ if(g.id===S.golfGoal) goalName=g.name; });
  p.appendChild(h('p', {'class': 'subtitle'}, S.golfDays + ' jours/semaine — ' + goalName + (S.golfHandicap ? ' — HC ' + S.golfHandicap : '')));
  p.appendChild(h('div', {style: 'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);margin-bottom:8px'}, week.notes));

  // Rappel Dave Pelz
  p.appendChild(h('div', {style: 'text-align:center;font-family:Georgia;font-size:11px;font-style:italic;color:var(--grey2,#9A9A94);margin-bottom:12px'}, '"60% du score se joue à moins de 100m du green" — Dave Pelz'));

  // Week navigation
  var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
  wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.golfWeek <= 1, onclick: function(){ S.golfWeek--; S.selectedGolfDay = 0; window.render(); }}, '←'));
  wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.golfWeek + ' / 8'));
  wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.golfWeek >= 8, onclick: function(){ S.golfWeek++; S.selectedGolfDay = 0; window.render(); }}, '→'));
  p.appendChild(wn);

  // Day tabs
  var tabs = h('div', {'class': 'day-tabs'});
  week.sessions.forEach(function(s, i) {
    tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedGolfDay === i ? ' active' : ''), onclick: function(){ S.selectedGolfDay = i; window.render(); }}, 'Jour ' + (i + 1)));
  });
  p.appendChild(tabs);

  var session = week.sessions[S.selectedGolfDay];
  if (session) {
    var colors = {short_game: 'var(--green,#1A4A1A)', long_game: 'var(--blue,#1A3A6A)', course_play: 'var(--orange,#6A4A1A)', physical: 'var(--red,#5A1010)', mental: 'var(--grey,#6B6B65)'};
    var card = h('div', {style: 'border-left:3px solid ' + (colors[session.type] || 'var(--black)') + ';padding:16px;margin:12px 0;background:var(--ivory2,#F4F4F0)'});
    card.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:12px'}, session.name));
    (session.exercises || []).forEach(function(ex, i) {
      var exDiv = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
      exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:12px;font-weight:500'}, (i + 1) + '. ' + ex.name));
      exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)'}, ex.detail));
      if (ex.duration) exDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2,#9A9A94);margin-top:2px'}, '⏱ ' + ex.duration));
      card.appendChild(exDiv);
    });
    card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);font-style:italic;margin-top:12px;padding-top:8px;border-top:1px solid var(--ivory3)'}, session.notes));
    p.appendChild(card);
  }

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 13; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
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
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Niveau'));
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
      isOn ? h('span', {'class': 'level-badge'}, '✓') : h('span', {})
    ]));
  });
  p.appendChild(lvlList);

  // ── Discipline faible (optionnel) ──
  p.appendChild(h('div', {style: 'height:20px'}));
  p.appendChild(h('div', {style: 'width:100%;height:1px;background:var(--border);margin-bottom:16px'}));
  p.appendChild(h('div', {'class': 'section-label'}, 'Discipline à renforcer (optionnel)'));
  p.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, 'Une séance bonus sera ajoutée chaque semaine pour cette discipline'));
  var discGrid = h('div', {style: 'display:flex;gap:10px;flex-wrap:wrap'});
  [{id: 'swim', name: '🏊 Natation'}, {id: 'bike', name: '🚴 Vélo'}, {id: 'run', name: '🏃 Course à pied'}].forEach(function(d) {
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
  swimWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, '🏊 Nage /100m'));
  swimWrap.appendChild(h('input', {'class': 'num-input', type: 'text', placeholder: '1:45', value: S.triathlonSwimPace || '', style: 'width:100%;text-align:center',
    oninput: function(e) { S.triathlonSwimPace = e.target.value; }
  }));
  paceGrid.appendChild(swimWrap);

  var bikeWrap = h('div', {style: 'display:flex;flex-direction:column;gap:4px'});
  bikeWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, '🚴 Vélo km/h'));
  bikeWrap.appendChild(h('input', {'class': 'num-input', type: 'number', placeholder: '32', value: S.triathlonBikePace || '', style: 'width:100%;text-align:center',
    oninput: function(e) { S.triathlonBikePace = e.target.value; }
  }));
  paceGrid.appendChild(bikeWrap);

  var runWrap = h('div', {style: 'display:flex;flex-direction:column;gap:4px'});
  runWrap.appendChild(h('div', {style: 'font-size:11px;color:var(--grey)'}, '🏃 Run min/km'));
  runWrap.appendChild(h('input', {'class': 'num-input', type: 'text', placeholder: '5:00', value: S.triathlonRunPace || '', style: 'width:100%;text-align:center',
    oninput: function(e) { S.triathlonRunPace = e.target.value; }
  }));
  paceGrid.appendChild(runWrap);
  p.appendChild(paceGrid);

  // Temps de course estimé si allures renseignées
  if (S.triathlonGoal && S.triathlonBikePace && S.triathlonRunPace && S.triathlonSwimPace) {
    var gObj = null;
    (window.TRIATHLON_GOALS || []).forEach(function(g) { if (g.id === S.triathlonGoal) gObj = g; });
    if (gObj) {
      try {
        var swimParts = (S.triathlonSwimPace || '1:45').split(':');
        var swimSecPer100 = parseInt(swimParts[0]) * 60 + parseInt(swimParts[1] || 0);
        var swimMin = Math.round((gObj.swimM / 100) * swimSecPer100 / 60);
        var bikeMin = Math.round((gObj.bikeKm / parseFloat(S.triathlonBikePace)) * 60);
        var runParts = (S.triathlonRunPace || '5:00').split(':');
        var runSecPerKm = parseInt(runParts[0]) * 60 + parseInt(runParts[1] || 0);
        var runMin = Math.round((gObj.runKm * runSecPerKm) / 60);
        var totalMin = swimMin + bikeMin + runMin + (gObj.id === 'ironman' ? 10 : gObj.id === 'half' ? 6 : 4); // transitions
        var totalH = Math.floor(totalMin / 60);
        var totalM = totalMin % 60;
        var estCard = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin-top:8px'});
        estCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:6px'}, '⏱ Temps de course estimé'));
        estCard.appendChild(h('div', {style: 'font-size:20px;font-family:Georgia,serif;font-style:italic;color:var(--black)'},
          totalH + 'h' + (totalM < 10 ? '0' : '') + totalM));
        var detail = h('div', {style: 'font-size:11px;color:var(--grey);margin-top:4px;font-family:Helvetica Neue,Arial,sans-serif'});
        detail.appendChild(h('span', {}, '🏊 ' + swimMin + 'min · '));
        detail.appendChild(h('span', {}, '🚴 ' + Math.floor(bikeMin/60) + 'h' + (bikeMin%60 < 10 ? '0' : '') + (bikeMin%60) + ' · '));
        detail.appendChild(h('span', {}, '🏃 ' + Math.floor(runMin/60) + 'h' + (runMin%60 < 10 ? '0' : '') + (runMin%60)));
        estCard.appendChild(detail);
        p.appendChild(estCard);
      } catch(e) {}
    }
  }

  // ── Boutons ──
  p.appendChild(h('div', {style: 'height:20px'}));
  var ok = S.triathlonGoal !== null && S.triathlonLevel !== null;
  if (!ok) {
    p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Sélectionnez un objectif et un niveau'));
  }
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function() {
    if (!ok) return;
    S.triathlonProgram = window.generateTriathlonProgram(S.triathlonGoal, S.triathlonLevel, S.triathlonWeak || null);
    S.triathlonWeek = 1;
    S.selectedTriDay = 0;
    S.sStep = 18;
    if (window.BLACKBOX) window.BLACKBOX.log('triathlon_config', {goal: S.triathlonGoal, level: S.triathlonLevel, weak: S.triathlonWeak});
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
    S.triathlonProgram = window.generateTriathlonProgram(S.triathlonGoal, S.triathlonLevel, S.triathlonWeak || null);
  }

  var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var program = S.triathlonProgram;
  if (!program || !program.length) {
    p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 17; window.render(); }, html: backArrow + 'Retour'}));
    return;
  }
  var totalWeeks = program.length;
  if (S.triathlonWeek > totalWeeks) S.triathlonWeek = totalWeeks;
  if (S.triathlonWeek < 1) S.triathlonWeek = 1;

  var weekData = program[S.triathlonWeek - 1];
  if (!weekData) return;

  var goalObj = null;
  (window.TRIATHLON_GOALS || []).forEach(function(g) { if (g.id === S.triathlonGoal) goalObj = g; });
  var levelObj = null;
  (window.TRIATHLON_LEVELS || []).forEach(function(l) { if (l.id === S.triathlonLevel) levelObj = l; });

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Triathlon / IRONMAN'));
  p.appendChild(h('h1', {html: (goalObj ? goalObj.name : 'Triathlon') + '<br><em>Programme</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, totalWeeks + ' semaines · ' + (levelObj ? levelObj.name : '') + ' · 80/20 · Méthode Jan Frodeno'));

  // ── Navigation semaines ──
  var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.triathlonWeek > 1) { S.triathlonWeek--; S.selectedTriDay = 0; window.render(); }
  }}, '←'));
  weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.triathlonWeek + ' / ' + totalWeeks));
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.triathlonWeek < totalWeeks) { S.triathlonWeek++; S.selectedTriDay = 0; window.render(); }
  }}, '→'));
  p.appendChild(weekNav);

  // ── Info phase ──
  var phaseCard = h('div', {style: 'border-left:3px solid ' + (weekData.phaseColor || '#1A3A6A') + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
  phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + (weekData.phaseColor || '#1A3A6A') + ';margin-bottom:4px'}, 'Phase : ' + weekData.phase));
  phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey)'}, '~' + weekData.totalHours + ' d\'entraînement · 7 jours'));
  if (weekData.isDeload) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E67E22;margin-top:6px;font-weight:bold'}, '📉 Semaine de récupération — volume réduit'));
  if (weekData.isTaper) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#27AE60;margin-top:6px;font-weight:bold'}, '🎯 Affûtage — Volume réduit, intensité maintenue'));
  p.appendChild(phaseCard);

  // ── Tabs jours ──
  var sessions = weekData.sessions || [];
  if (S.selectedTriDay >= sessions.length) S.selectedTriDay = 0;
  var tabs = h('div', {'class': 'day-tabs', style: 'flex-wrap:wrap'});
  sessions.forEach(function(sess, i) {
    var icon = sess.discipline === 'swim' ? '🏊' : sess.discipline === 'bike' ? '🚴' : sess.discipline === 'run' ? '🏃' : sess.discipline === 'brick' ? '🔄' : '😴';
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
    sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin-bottom:4px'}, sess.icon + ' ' + sess.name));
    sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, sess.desc || ''));

    if (sess.duration && sess.duration !== '—') {
      var durationRow = h('div', {style: 'display:flex;gap:16px;align-items:center;margin-bottom:10px;flex-wrap:wrap'});
      durationRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;color:' + discColor}, '⏱ ' + sess.duration));
      if (sess.zone) durationRow.appendChild(h('div', {style: 'background:' + discColor + ';color:#fff;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;padding:2px 8px'}, sess.zone));
      sessCard.appendChild(durationRow);
    }

    if (sess.detail) {
      sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.7;padding:12px;background:var(--ivory2);border:1px solid var(--border)'}, sess.detail));
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
    transCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;margin-bottom:6px'}, '🔄 Rappel Transitions'));
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
  if (swCount) sumRow.appendChild(h('span', {'class': 'chip on'}, '🏊 ' + swCount + ' nage'));
  if (biCount) sumRow.appendChild(h('span', {'class': 'chip on'}, '🚴 ' + biCount + ' vélo'));
  if (ruCount) sumRow.appendChild(h('span', {'class': 'chip on'}, '🏃 ' + ruCount + ' run'));
  if (brCount) sumRow.appendChild(h('span', {'class': 'chip on'}, '🔄 ' + brCount + ' brick'));
  p.appendChild(sumRow);

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { S.sStep = 17; window.render(); }, html: backArrow + 'Modifier la configuration'}));
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
  p.appendChild(h('div', {'class': 'section-label'}, 'Niveau'));
  var lvlList = h('div', {'class': 'level-list'});
  [
    { id: 'debutant', icon: '\uD83C\uDF31', name: 'D\u00e9butant', desc: 'Premi\u00e8res postures, respiration consciente, s\u00e9ances de 20-30 min' },
    { id: 'intermediaire', icon: '\uD83C\uDF3F', name: 'Interm\u00e9diaire', desc: 'Vinyasa fluide, \u00e9quilibre, force fonctionnelle' },
    { id: 'avance', icon: '\uD83C\uDF4A', name: 'Avanc\u00e9', desc: 'Inversions, backbends profonds, pranayama' }
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
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Jours par semaine'));
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
  if (!S.yogaLevel) { S.sStep = 19; window.render(); return; }
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
    var pw = h('div', {style: 'background:#FCE4EC;border-left:4px solid #E91E63;padding:12px 14px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#880E4F;line-height:1.6'});
    pw.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, '\u26A0 Grossesse \u2014 Yoga pr\u00e9natal'));
    pw.appendChild(h('div', {}, pregWarn));
    pw.appendChild(h('div', {style: 'margin-top:6px;font-weight:600'}, '\u00c9viter : Inversions (Navasana, poirier), compression abdominale, d\u00e9cubitus dorsal >20 min. Variantes T2/T3 : postures assises ou en appui lat\u00e9ral.'));
    p.appendChild(pw);
  }

  // Medical warnings
  var med = S.muscuMedical || {};
  if (med.herniaDisc || med.lowerBack) {
    var hw = h('div', {style: 'background:#FFF3E0;border-left:4px solid #E67E22;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#5D4037;line-height:1.6'});
    hw.appendChild(h('div', {style: 'font-weight:700;color:#E67E22;margin-bottom:4px'}, '\u26A0 Hernie discale / Bas du dos'));
    hw.appendChild(h('div', {}, '\u00c9viter forward fold profond sans genoux fl\u00e9chis. Paschimottanasana : toujours garder une micro-flexion des genoux. Privil\u00e9gier Balasana, torsions douces assises.'));
    p.appendChild(hw);
  }
  if (med.osteoporosis) {
    var ow = h('div', {style: 'background:#E8F5E9;border-left:4px solid #27AE60;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#1B5E20;line-height:1.6'});
    ow.appendChild(h('div', {style: 'font-weight:700;color:#27AE60;margin-bottom:4px'}, '\uD83E\uDDB4 Ost\u00e9oporose'));
    ow.appendChild(h('div', {}, '\u00c9viter flexions extr\u00eames (Paschimottanasana profond), postures sur une jambe sans support. Favoriser postures debout en appui bim\u00e9ral (Guerrier I/II avec support si besoin). Mountain pose, Virabhadrasana I/II b\u00e9n\u00e9fiques pour la densit\u00e9 osseuse.'));
    p.appendChild(ow);
  }
  if (med.knees || med.acl || med.meniscus) {
    var kw = h('div', {style: 'background:#E3F2FD;border-left:4px solid #1565C0;padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#0D47A1;line-height:1.6'});
    kw.appendChild(h('div', {style: 'font-weight:700;margin-bottom:4px'}, '\uD83E\uDDB5 Genoux / LCA / M\u00e9nisque'));
    kw.appendChild(h('div', {}, '\u00c9viter flexion profonde du genou (lotus complet, Malasana profond). Guerrier II : ne pas d\u00e9passer 90\u00b0. Option : pose h\u00e9ros (Virasana) remplac\u00e9e par Sukhasana si g\u00eane.'));
    p.appendChild(kw);
  }

  p.appendChild(h('div', {'class': 'eyebrow'}, 'Programme Yoga'));
  p.appendChild(h('h1', {html: 'Semaine ' + S.yogaWeek + '<br><em>' + weekData.phase + '</em>'}));

  var objNames = { flexibilite: 'Flexibilit\u00e9', stress: 'Stress & Sommeil', force: 'Force & \u00c9quilibre', recuperation: 'R\u00e9cup\u00e9ration active' };
  var styleNames = { hatha: 'Hatha', vinyasa: 'Vinyasa', yin: 'Yin', ashtanga: 'Ashtanga' };
  p.appendChild(h('p', {'class': 'subtitle'}, S.yogaDays + ' jours/semaine \u00b7 ' + S.yogaDuration + ' \u00b7 ' + (styleNames[S.yogaStyle] || S.yogaStyle) + ' \u00b7 ' + (objNames[S.yogaObjectif] || '')));

  // Week navigation
  var wn = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0'});
  wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.yogaWeek <= 1, onclick: function(){ if(S.yogaWeek > 1){ S.yogaWeek--; S.yogaDay = 0; window.render(); } }}, '\u2190'));
  wn.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.yogaWeek + ' / 4'));
  wn.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;margin:0', disabled: S.yogaWeek >= 4, onclick: function(){ if(S.yogaWeek < 4){ S.yogaWeek++; S.yogaDay = 0; window.render(); } }}, '\u2192'));
  p.appendChild(wn);

  // Phase card
  var phaseCard = h('div', {style: 'border-left:3px solid #7B5EA7;padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
  phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:#7B5EA7;margin-bottom:4px'}, weekData.phase + ' \u2014 ' + weekData.theme));
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
  var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid #7B5EA7'});
  sessCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#7B5EA7;margin-bottom:6px'}, 'S\u00e9ance Yoga'));
  sessCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:20px;margin-bottom:4px'}, '\uD83E\uDDD8 S\u00e9ance ' + (S.yogaDay + 1) + ' \u2014 ' + weekData.phase));
  sessCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin-bottom:12px'}, S.yogaDuration + ' \u00b7 ' + (styleNames[S.yogaStyle] || S.yogaStyle)));

  // Poses list
  poses.forEach(function(pose, i) {
    var poseDiv = h('div', {style: 'padding:10px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
    var poseHeader = h('div', {style: 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px'});
    var poseInfo = h('div', {style: 'flex:1;min-width:0'});
    poseInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:600;margin-bottom:2px'}, (i + 1) + '. ' + pose.name));
    poseInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:2px'}, pose.desc));
    poseInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#7B5EA7'}, '\uD83C\uDFAF ' + pose.focus));
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
    benefDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.6'}, YOGA_BENEFITS[benefKey]));
    p.appendChild(benefDiv);
  }

  // All benefits summary
  var allBenef = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin:12px 0'});
  allBenef.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, '\uD83C\uDF31 B\u00e9n\u00e9fices du yoga (preuves scientifiques)'));
  var benefLabels = { flexibilite: 'Flexibilit\u00e9', stress: 'Stress/Sommeil', force: 'Force core', sommeil: 'Sommeil' };
  Object.keys(YOGA_BENEFITS).forEach(function(k) {
    var row = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.5;padding:3px 0;border-bottom:1px solid var(--ivory3,#EEEDE8)'});
    row.appendChild(h('span', {style: 'color:#7B5EA7;font-weight:600'}, (benefLabels[k] || k) + ' \u2014 '));
    row.appendChild(h('span', {}, YOGA_BENEFITS[k]));
    allBenef.appendChild(row);
  });
  p.appendChild(allBenef);

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 19; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Modifier la configuration'}));
}

// ═══════════════════════════════════════
// CYCLISME MODULE
// ═══════════════════════════════════════

var CYCLING_ZONES = [
  { zone: 1, name: 'Récupération active', pct: '< 55% FTP',    rpe: '1-2/10', color: '#4CAF50', desc: 'Pédalage très facile, conversation aisée' },
  { zone: 2, name: 'Endurance de base',   pct: '56-75% FTP',   rpe: '3-4/10', color: '#8BC34A', desc: 'Rythme confortable, sortie longue' },
  { zone: 3, name: 'Tempo',               pct: '76-90% FTP',   rpe: '5-6/10', color: '#FFC107', desc: 'Effort soutenu, légèrement inconfortable' },
  { zone: 4, name: 'Seuil (FTP)',         pct: '91-105% FTP',  rpe: '7-8/10', color: '#FF9800', desc: 'À la limite — effort maximal maintenable' },
  { zone: 5, name: 'VO2max',              pct: '106-120% FTP', rpe: '8-9/10', color: '#F44336', desc: 'Intervalles courts, très intense' }
];

var CYCLING_MET = [5, 7, 9, 11, 13];
function cyclingKcal(durationMin, zone, weightKg) {
  var met = CYCLING_MET[Math.min(zone - 1, 4)] || 7;
  return Math.round(met * weightKg * (durationMin / 60));
}

var CYCLING_WORKOUTS = {
  debutant: [
    { day: 'Mardi',   type: 'Endurance',         duration: 45,  zone: 2, desc: 'Sortie plate Z2, cadence 80-90 RPM' },
    { day: 'Jeudi',   type: 'Intervalles courts', duration: 40,  zone: 4, desc: '5 min Z2 + 4×3min Z4 + 3min récup + 5min Z2' },
    { day: 'Samedi',  type: 'Sortie longue',      duration: 90,  zone: 2, desc: 'Z2 constant, hydratation 500ml/h, alimentation 40-60g glucides/h si >1h' }
  ],
  intermediaire: [
    { day: 'Lundi',    type: 'Récupération active',  duration: 30,  zone: 1, desc: 'Easy spin, rotation hanches, jambes légères' },
    { day: 'Mardi',    type: 'Tempo',                duration: 60,  zone: 3, desc: '2×15min Z3 + 5min récup entre les blocs' },
    { day: 'Jeudi',    type: 'Sweet Spot',            duration: 75,  zone: 4, desc: '3×10min à 88-93% FTP — zone la plus efficace ROI effort' },
    { day: 'Samedi',   type: 'Sortie longue qualité', duration: 150, zone: 2, desc: 'Sortie ondulée, 80% Z2 + 20% Z3 sur les côtes' },
    { day: 'Dimanche', type: 'Sortie récup',          duration: 60,  zone: 1, desc: 'Easy, plat, cadence libre' }
  ]
};

function generateCyclingPlan(level, days) {
  var phases = [
    { name: 'Base aérobie',  weeks: [1, 2],    color: '#1A3A6A', focus: 'Développer le moteur Z2 — qualité > quantité' },
    { name: 'Développement', weeks: [3, 4, 5], color: '#E67E22', focus: 'Introduire tempo et sweet spot' },
    { name: 'Spécifique',    weeks: [6, 7],    color: '#C0392B', focus: 'Intervalles seuil et VO2max' },
    { name: 'Affûtage',      weeks: [8],       color: '#27AE60', focus: 'Réduction volume — maintien intensité' }
  ];
  var template = (level === 'avance' || level === 'intermediaire') ? CYCLING_WORKOUTS.intermediaire : CYCLING_WORKOUTS.debutant;
  var plan = [];
  for (var w = 1; w <= 8; w++) {
    var phase = phases[0];
    for (var pi = 0; pi < phases.length; pi++) {
      if (phases[pi].weeks.indexOf(w) !== -1) { phase = phases[pi]; break; }
    }
    var isDeload = (w === 4 || w === 8);
    var volFactor = isDeload ? 0.6 : (w <= 2 ? 0.75 : w <= 5 ? 1.0 : 1.1);
    var maxDays = Math.min(days, template.length);
    var sessions = template.slice(0, maxDays).map(function(s) {
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
    { id: 'road',   icon: '🚲', name: 'Route',  desc: 'Bitume, performance' },
    { id: 'vtt',    icon: '🚵', name: 'VTT',    desc: 'Tout-terrain, single track' },
    { id: 'indoor', icon: '💻', name: 'Indoor', desc: 'Zwift / home trainer' },
    { id: 'gravel', icon: '🌿', name: 'Gravel', desc: 'Chemins mixtes' }
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

  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Niveau'));
  var levels = [
    { id: 'debutant',      icon: '🟢', name: 'Débutant',      desc: '< 2h par semaine, découverte du cyclisme' },
    { id: 'intermediaire', icon: '🟡', name: 'Intermédiaire', desc: '2-5h par semaine, confortable sur longues sorties' },
    { id: 'avance',        icon: '🔴', name: 'Avancé',        desc: '> 5h par semaine, FTP > 3 w/kg' }
  ];
  var lvlList = h('div', {'class': 'level-list'});
  levels.forEach(function(lv) {
    var isOn = S.cyclingLevel === lv.id;
    lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: (function(id){ return function(){ S.cyclingLevel = id; window.render(); }; })(lv.id)}, [
      h('div', {}, [
        h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
        h('div', {'class': 'level-desc'}, lv.desc)
      ]),
      isOn ? h('span', {'class': 'level-badge'}, '✓') : h('span', {})
    ]));
  });
  p.appendChild(lvlList);

  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Objectif'));
  var goals = [
    { id: 'weightloss',  icon: '⚖️', name: 'Perte de poids',     desc: 'Brûler des calories, améliorer la composition corporelle' },
    { id: 'endurance',   icon: '🛣️', name: 'Endurance de base',  desc: 'Développer le moteur aérobie, sorties longues' },
    { id: 'competitive', icon: '🏆', name: 'Sportif compétitif', desc: 'Améliorer FTP, puissance, classement' },
    { id: 'granfondo',   icon: '⛰️', name: 'Gran Fondo',         desc: 'Préparer une cyclosportive ou gran fondo' },
    { id: 'triathlon',   icon: '🔱', name: 'Triathlon',          desc: 'Segment vélo du triathlon, transitions' }
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

  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Jours d\'entraînement par semaine'));
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
      zonesCard.appendChild(h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-family:Helvetica Neue,Arial,sans-serif;font-size:12px'}, [
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
    { id: 'flat',        name: 'Plat',       desc: '< 500m D+/100km' },
    { id: 'rolling',     name: 'Vallonné',   desc: '500-1000m D+/100km' },
    { id: 'mountainous', name: 'Montagneux', desc: '> 1000m D+/100km' }
  ];
  var reliefRow = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px'});
  reliefs.forEach(function(r) {
    var isOn = S.cyclingRelief === r.id;
    reliefRow.appendChild(h('div', {
      style: 'padding:10px 16px;border-radius:4px;border:1.5px solid ' + (isOn ? 'var(--accent, #0A0A09)' : 'var(--border)') + ';background:var(--ivory2);cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:' + (isOn ? '600' : '400') + ';user-select:none',
      onclick: (function(id){ return function(){ S.cyclingRelief = id; window.render(); }; })(r.id)
    }, [
      h('div', {style: 'font-weight:inherit'}, r.name),
      h('div', {style: 'color:var(--grey);font-size:10px'}, r.desc)
    ]));
  });
  p.appendChild(reliefRow);

  var ok = S.cyclingLevel && S.cyclingGoal;
  if (!ok) p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Sélectionnez un niveau et un objectif'));
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
    if (!ok) return;
    S.cyclingPlan = generateCyclingPlan(S.cyclingLevel, S.cyclingDays || 3);
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

  if (!S.cyclingPlan || !S.cyclingPlan.length) {
    S.cyclingPlan = generateCyclingPlan(S.cyclingLevel || 'debutant', S.cyclingDays || 3);
  }

  var plan = S.cyclingPlan;
  if (!plan || !plan.length) {
    var backArrowCyc = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    p.appendChild(h('div', {style: 'text-align:center;padding:32px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'Programme non disponible. Rechargez la page ou reconfigurez votre plan.'));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 22; window.render(); }, html: backArrowCyc + 'Retour'}));
    return;
  }
  var totalWeeks = plan.length;
  if (!S.cyclingWeek || S.cyclingWeek < 1) S.cyclingWeek = 1;
  if (S.cyclingWeek > totalWeeks) S.cyclingWeek = totalWeeks;
  if (S.selectedCyclingDay === undefined || S.selectedCyclingDay === null) S.selectedCyclingDay = 0;

  var weekData = plan[S.cyclingWeek - 1];
  if (!weekData) return;

  var weightKg = S.weight || 70;
  var levelNames = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  var goalNames = { weightloss: 'Perte de poids', endurance: 'Endurance de base', competitive: 'Sportif compétitif', granfondo: 'Gran Fondo', triathlon: 'Triathlon' };
  var bikeNames = { road: 'Route 🚲', vtt: 'VTT 🚵', indoor: 'Indoor 💻', gravel: 'Gravel 🌿' };

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

  var med = S.muscuMedical || {};
  var warnings = [];
  if (med.hypertension) warnings.push('⚠ HTA : évitez Z4/Z5 (Valsalva interdit) — restez en Z1-Z3 maximum');
  if (med.herniaDisc || med.lowerBack) warnings.push('⚠ Hernie discale : position aérodynamique déconseillée — vélo droit recommandé, guidon surélevé');
  if (med.knees || med.meniscus) warnings.push('⚠ Gonarthrose / Ménisque : cadence élevée (>90 RPM) recommandée — évitez les grosses relances');
  if (S.age && S.age >= 50) warnings.push('⚠ 50+ : échauffement 15 min minimum obligatoire, zones 1-3 prioritaires, récupération 48h entre séances intenses');
  if (warnings.length) {
    var warnBox = h('div', {style: 'border:1.5px solid #E67E22;padding:12px 16px;background:#FFF8F0;margin-bottom:16px'});
    warnings.forEach(function(w) {
      warnBox.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:#E67E22;margin-bottom:4px;line-height:1.5'}, w));
    });
    p.appendChild(warnBox);
  }

  var weekNav = h('div', {style: 'display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0'});
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.cyclingWeek > 1) { S.cyclingWeek--; S.selectedCyclingDay = 0; window.render(); }
  }}, '←'));
  weekNav.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;font-style:italic'}, 'Semaine ' + S.cyclingWeek + ' / ' + totalWeeks));
  weekNav.appendChild(h('button', {'class': 'btn-back', style: 'padding:8px;width:auto;margin:0', onclick: function() {
    if (S.cyclingWeek < totalWeeks) { S.cyclingWeek++; S.selectedCyclingDay = 0; window.render(); }
  }}, '→'));
  p.appendChild(weekNav);

  var phaseCard = h('div', {style: 'border-left:3px solid ' + weekData.phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:16px'});
  phaseCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:16px;color:' + weekData.phaseColor + ';margin-bottom:4px'}, 'Phase : ' + weekData.phase));
  phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey)'}, weekData.focus));
  if (weekData.isDeload) phaseCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#E67E22;margin-top:6px;font-weight:bold'}, '📉 Semaine de récupération — volume réduit de 40%'));
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
    var ftpBox = h('div', {style: 'border:1px solid #8BC34A;padding:12px 16px;background:#F9FBE7;margin-bottom:16px'});
    ftpBox.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;color:#33691E;margin-bottom:6px'}, '🔬 Test FTP recommandé'));
    ftpBox.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.6'}, 'Effectuez un effort maximal de 20 minutes en régime stable. Votre FTP estimée ≈ puissance moyenne sur 20 min × 0,95. Renseignez-la dans la configuration pour afficher vos zones personnalisées.'));
    p.appendChild(ftpBox);
  }

  var sessions = weekData.sessions || [];
  if (S.selectedCyclingDay >= sessions.length) S.selectedCyclingDay = 0;
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
    var zoneNum = Array.isArray(sess.zone) ? sess.zone[sess.zone.length - 1] : sess.zone;
    var zoneData = CYCLING_ZONES[Math.min(zoneNum - 1, 4)];
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

    sessCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin-bottom:4px'}, '🚴 ' + sess.type));
    sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, sess.desc));

    var metaRow = h('div', {style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px'});
    metaRow.appendChild(h('div', {style: 'font-family:Georgia;font-size:15px;color:' + zoneColor}, '⏱ ' + sess.duration + ' min'));
    metaRow.appendChild(h('div', {style: 'font-family:Georgia;font-size:15px;color:var(--grey)'}, '🔥 ~' + kcal + ' kcal'));
    if (S.cyclingFTP && S.cyclingFTP > 0 && zoneData) {
      metaRow.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey)'}, '⚡ ' + zoneData.pct));
    }
    sessCard.appendChild(metaRow);

    if (zoneData) {
      sessCard.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:4px'}, zoneData.desc + ' — RPE ' + zoneData.rpe));
    }
    p.appendChild(sessCard);
  }

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { S.sStep = 22; window.render(); }, html: backArrow + 'Modifier la configuration'}));
}

// ═══════════════════════════════════════
// CALLISTHÉNIE MODULE
// ═══════════════════════════════════════

var CALISTHENICS_SKILLS = {
  planche: {
    name: 'Planche',
    icon: '🤸',
    description: 'Force de poussée horizontale — gainage total',
    restTime: '3-5 min (skill statique)',
    progressions: [
      { level: 'A', name: 'Planche Frog (équilibre)', duration: '5-10s', weeks: '1-3', prep: ['Hollow body 3×20s', 'Wrist prep 2min', 'Pike push-up 3×8'], cue: 'Mains à plat, doigts écartés, épaules protractées — soulever les genoux' },
      { level: 'B', name: 'Planche Tuck (genoux groupés)', duration: '10-20s', weeks: '4-8', prep: ['Pseudo planche push-up 3×6', 'Shoulder protraction hold 3×20s', 'Wrist circles 2min'], cue: 'Genoux au niveau de la poitrine, dos rond, épaules devant les mains' },
      { level: 'C', name: 'Advanced Tuck (hanche à 90°)', duration: '8-15s', weeks: '9-16', prep: ['Pseudo planche push-up incliné 3×6', 'Tuck planche push-up 3×4', 'Bulgarian bag shoulder 3×10'], cue: 'Ouvrir progressivement la hanche, garder le dos arrondi' },
      { level: 'D', name: 'Straddle Planche', duration: '5-10s', weeks: '17-28', prep: ['Advanced tuck push-up 3×5', 'Planche lean 30s', 'Maltese lean 15s'], cue: 'Jambes écartées à 90°+ — angle optimal pour réduire le bras de levier' },
      { level: 'E', name: 'Full Planche', duration: '3-8s', weeks: '29-52+', prep: ['Straddle planche push-up 3×3', 'Planche lean maximal 30s', 'Handstand 30s minimum requis'], cue: 'Jambes jointes et horizontales — temps de maîtrise réaliste : 1-2 ans' }
    ]
  },
  frontLever: {
    name: 'Front Lever',
    icon: '💪',
    description: 'Force de traction horizontale — grand dorsal + core',
    restTime: '3-5 min (skill statique)',
    progressions: [
      { level: 'A', name: 'Tuck Front Lever (genoux groupés)', duration: '8-15s', weeks: '1-4', prep: ['Australian pull-up 3×10', 'Dead hang 3×30s', 'Scapular pull-up 3×10'], cue: 'Corps en boule, hanches à hauteur des épaules, dos plat' },
      { level: 'B', name: 'Advanced Tuck (dos plat, hanche à 90°)', duration: '8-15s', weeks: '5-10', prep: ['Slow pull-up eccentric 5s 3×5', 'Tuck front lever pull-up 3×3', 'Band-assisted front lever 3×15s'], cue: 'Hanche ouverte, cuisse horizontale, dos plat — progression clé' },
      { level: 'C', name: 'Straddle Front Lever', duration: '5-10s', weeks: '11-20', prep: ['Front lever pull-up tuck 3×3', 'Windshield wipers 3×5', 'L-sit pull-up 3×5'], cue: 'Jambes écartées — réduire l\'écartement semaine par semaine' },
      { level: 'D', name: 'Full Front Lever', duration: '3-8s', weeks: '21-36+', prep: ['Straddle pull-up 3×3', 'Front lever raise tuck 3×5', 'Hanging leg raise weighted 3×8'], cue: 'Corps parfaitement horizontal, bras tendus, scapulas déprimées' }
    ]
  },
  muscleUp: {
    name: 'Muscle-up',
    icon: '🏋️',
    description: 'Passage traction → poussée — force explosive',
    restTime: '3-4 min',
    progressions: [
      { level: 'A', name: 'Pull-up strict fausse prise', duration: '3×5 reps', weeks: '1-4', prep: ['Dead hang 30s', 'Scapular pull-up 3×10', 'Jumping muscle-up x5'], cue: 'Maîtriser 10 tractions strictes en fausse prise avant de progresser' },
      { level: 'B', name: 'Explosion + transition barre', duration: '3×5 chaque', weeks: '5-8', prep: ['Bar dip 3×10', 'Pull-up fausse prise explosif 3×5', 'Negative muscle-up 3×3 5s'], cue: 'Explosion au-dessus de la barre, transition rapide en appui de poussée' },
      { level: 'C', name: 'Kipping muscle-up (bascule)', duration: '3×3 reps', weeks: '9-14', prep: ['Kipping swing maîtrisé', 'Pull-up explosif 3×5', 'Bar dip strict 3×12'], cue: 'Kipping comme outil d\'apprentissage — viser le strict ensuite' },
      { level: 'D', name: 'Strict muscle-up', duration: '1-5 reps', weeks: '15-28+', prep: ['Weighted pull-up +10kg 3×5', 'Weighted dip +10kg 3×8', 'Ring muscle-up transition 3×3'], cue: 'Strict = force pure. Bras qui passent en ligne droite au-dessus du support' }
    ]
  },
  handstand: {
    name: 'Handstand',
    icon: '🙌',
    description: 'Équilibre inversé — proprioception et force épaules',
    restTime: '2-3 min',
    progressions: [
      { level: 'A', name: 'Wall Handstand Hold', duration: '3×20-30s', weeks: '1-4', prep: ['Pike hold 3×20s', 'Wrist mobility 3min/jour', 'Shoulder shrugs inverted 3×10'], cue: 'Face au mur, ventre collé, corps gainé, pousser le sol vers le bas' },
      { level: 'B', name: 'Kick-up + Hold (loin du mur)', duration: '5-15s', weeks: '5-10', prep: ['Wall handstand kick-up 3×5', 'Forward rolls de secours', 'Finger pressure balance 3×20s'], cue: 'Alignement talons-fesses-épaules-poignets, micro-corrections doigts' },
      { level: 'C', name: 'Freestanding Handstand 10-30s', duration: '10-30s', weeks: '11-24', prep: ['Pirouette contre mur 3×5', 'Handstand touches 3×10', 'One arm supported 3×10s'], cue: 'Regarder les mains, micro-ajustements onglets, 10min/jour de pratique' },
      { level: 'D', name: 'Handstand Push-up (HSPU)', duration: '3×3-8 reps', weeks: '20-36+', prep: ['Pike push-up 3×10', 'Wall HSPU negatives 3×5', 'Pike HSPU box 3×8'], cue: 'Tête entre les mains, coudes à 45°, plein amplitude menton-sol' }
    ]
  }
};

var CALISTHENICS_WEEKLY_STRUCTURE = {
  debutant: {
    days: 3,
    sessions: [
      { name: 'Poussée + Équilibre', focus: 'push', exercises: ['Hollow body 3×20s', 'Pike hold 3×15s', 'Push-up 3×10', 'Pseudo planche lean 3×10s', 'Pike push-up 3×8', 'Dip 3×8'] },
      { name: 'Traction + Core', focus: 'pull', exercises: ['Dead hang 3×20s', 'Scapular pull-up 3×10', 'Australian pull-up 3×8', 'L-sit parallettes 3×10s', 'Hanging knee raise 3×10'] },
      { name: 'Jambes + Gainage', focus: 'legs', exercises: ['Squat 3×15', 'Bulgarian split squat 3×10', 'Hip thrust 3×12', 'Plank 3×45s', 'Side plank 3×30s', 'Bridge 3×15'] }
    ]
  },
  intermediaire: {
    days: 4,
    sessions: [
      { name: 'Planche progressions', focus: 'planche', exercises: ['Wrist prep 3min', 'Frog stand 3×15s', 'Tuck planche 4×10s', 'Pseudo planche push-up 4×6', 'Planche lean 3×15s', 'Ring dip 4×8'] },
      { name: 'Front Lever + Traction', focus: 'frontlever', exercises: ['Scapular pull-up 4×10', 'Tuck front lever 4×12s', 'Advanced tuck FL 4×8s', 'Slow pull-up 4×5 3s descente', 'L-sit pull-up 3×5'] },
      { name: 'Handstand + Poussée', focus: 'handstand', exercises: ['Wrist mobility 3min', 'Wall handstand 4×20s', 'Pike HSPU 4×6', 'Ring push-up 4×10', 'Handstand kick-up 4×5 essais'] },
      { name: 'Conditionnement + Core', focus: 'conditioning', exercises: ['Pull-up explosif 4×5', 'Muscle-up transition ring 4×3', 'Windshield wiper 3×8', 'Dragon flag 3×5', 'Pistol squat 3×5 par jambe'] }
    ]
  },
  avance: {
    days: 5,
    sessions: [
      { name: 'Planche — Volume skill', focus: 'planche', exercises: ['Wrist prep 3min', 'Advanced tuck planche 5×12s', 'Straddle planche 5×8s', 'Full planche attempts 5×3-5s', 'Planche push-up 4×3', 'Maltese lean 3×20s'] },
      { name: 'Front Lever — Volume skill', focus: 'frontlever', exercises: ['Advanced tuck FL 5×12s', 'Straddle FL 5×8s', 'Full front lever 5×3-5s', 'FL pull-up 4×3', 'Front lever raise 3×5'] },
      { name: 'Muscle-up + Handstand', focus: 'muscleup', exercises: ['Bar muscle-up strict 5×3', 'Ring muscle-up 4×3', 'Freestanding handstand 5×15-20s', 'HSPU 4×5', 'Handstand walk 2×5m'] },
      { name: 'Force + Explosivité', focus: 'strength', exercises: ['Weighted pull-up +10kg 4×5', 'Weighted dip +10kg 4×8', 'Archer push-up 4×6', 'One-arm pull-up progression 4×3 assisté', 'Manna progression 4×8s'] },
      { name: 'Mobilité + Récupération active', focus: 'mobility', exercises: ['Hip flexor stretch 3×60s par côté', 'Shoulder circles 3×20', 'Bridge walk-out 3×10', 'Pancake stretch 3×60s', 'Wrist rehabilitation 5min'] }
    ]
  }
};

function generateCalisthenicsPlan(level, goal) {
  var structure = CALISTHENICS_WEEKLY_STRUCTURE[level] || CALISTHENICS_WEEKLY_STRUCTURE.debutant;
  var totalWeeks = level === 'debutant' ? 12 : level === 'intermediaire' ? 16 : 20;
  var plan = [];
  for (var w = 1; w <= totalWeeks; w++) {
    var isDeload = (w % 4 === 0);
    var phase = w <= Math.round(totalWeeks * 0.3) ? 'Fondations' :
                w <= Math.round(totalWeeks * 0.6) ? 'Développement' :
                w <= Math.round(totalWeeks * 0.85) ? 'Spécifique' : 'Pic/Test';
    var weekFocus = isDeload ? 'Décharge — 50% volume, RIR élevé, consolider les acquis' :
                   (w % 4 === 1 ? 'Accumulation — augmentation volume, RIR 3-4' :
                    w % 4 === 2 ? 'Intensification — augmentation intensité, RIR 2' :
                    'Réalisation — effort maximum, RIR 1');
    var weekObj = {
      week: w, phase: phase, isDeload: isDeload, focus: weekFocus,
      sessions: structure.sessions.map(function(sess) {
        return {
          name: isDeload ? sess.name + ' (allégé)' : sess.name,
          focus: sess.focus,
          exercises: isDeload ? sess.exercises.slice(0, Math.max(2, Math.ceil(sess.exercises.length * 0.5))) : sess.exercises
        };
      })
    };
    plan.push(weekObj);
  }
  return plan;
}

// ─── STEP 24: CALLISTHÉNIE ONBOARDING ───
function renderCalisthenicsOnboarding(p) {
  var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:22px;margin-bottom:6px'}, '\uD83D\uDCAA Callisth\u00e9nie'));
  p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:20px;line-height:1.6'}, 'Muscle-up, Planche, Front Lever, Handstand \u2014 progressions bas\u00e9es sur la science de la force relative.'));

  p.appendChild(h('div', {'class': 'section-label'}, 'Niveau actuel'));
  var levels = [
    { id: 'debutant', name: 'D\u00e9butant', desc: 'Je ma\u00eetrise les push-ups, tractions basiques' },
    { id: 'intermediaire', name: 'Interm\u00e9diaire', desc: '10 pull-ups stricts, 20 push-ups, L-sit 10s' },
    { id: 'avance', name: 'Avanc\u00e9', desc: 'Muscle-up, tuck planche / tuck front lever acquis' }
  ];
  var levelRow = h('div', {style: 'display:flex;flex-direction:column;gap:8px;margin-bottom:16px'});
  levels.forEach(function(lvl) {
    var isOn = S.calisthenicsLevel === lvl.id;
    levelRow.appendChild(h('div', {
      style: 'padding:12px 16px;border-radius:4px;border:1.5px solid ' + (isOn ? 'var(--accent,#0A0A09)' : 'var(--border)') + ';background:var(--ivory2);cursor:pointer',
      onclick: (function(id){ return function(){ S.calisthenicsLevel = id; window.render(); }; })(lvl.id)
    }, [
      h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:' + (isOn ? '600' : '400')}, lvl.name),
      h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, lvl.desc)
    ]));
  });
  p.appendChild(levelRow);

  p.appendChild(h('div', {'class': 'section-label'}, 'Skill principal \u00e0 d\u00e9velopper'));
  var goals = [
    { id: 'planche',    name: 'Planche',           desc: 'Force horizontale de pouss\u00e9e \u2014 bras tendus' },
    { id: 'frontLever', name: 'Front Lever',        desc: 'Force horizontale de traction \u2014 grand dorsal' },
    { id: 'muscleUp',   name: 'Muscle-up',          desc: 'Passage explosif traction \u2192 appui' },
    { id: 'handstand',  name: 'Handstand',          desc: '\u00c9quilibre sur les mains + HSPU' },
    { id: 'complet',    name: 'Programme complet',  desc: 'D\u00e9velopper tous les skills en parall\u00e8le' }
  ];
  var goalRow = h('div', {style: 'display:flex;flex-direction:column;gap:8px;margin-bottom:20px'});
  goals.forEach(function(g) {
    var isOn = S.calisthenicsGoal === g.id;
    goalRow.appendChild(h('div', {
      style: 'padding:10px 16px;border-radius:4px;border:1.5px solid ' + (isOn ? 'var(--accent,#0A0A09)' : 'var(--border)') + ';background:var(--ivory2);cursor:pointer',
      onclick: (function(id){ return function(){ S.calisthenicsGoal = id; window.render(); }; })(g.id)
    }, [
      h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:' + (isOn ? '600' : '400')}, g.name),
      h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:2px'}, g.desc)
    ]));
  });
  p.appendChild(goalRow);

  var skillPreviewKey = S.calisthenicsGoal && S.calisthenicsGoal !== 'complet' ? S.calisthenicsGoal : 'planche';
  var skillPreview = CALISTHENICS_SKILLS[skillPreviewKey];
  if (skillPreview) {
    var prevCard = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin-bottom:16px'});
    prevCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:14px;margin-bottom:6px'}, skillPreview.icon + ' Progressions \u2014 ' + skillPreview.name));
    prevCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px'}, skillPreview.description + ' \u2014 Repos entre sets : ' + skillPreview.restTime));
    skillPreview.progressions.forEach(function(prog) {
      var row = h('div', {style: 'padding:6px 0;border-bottom:1px solid var(--ivory3,#EEEDE8);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px'});
      row.appendChild(h('div', {style: 'font-weight:600;color:var(--accent,#0A0A09)'}, prog.level + '. ' + prog.name + ' \u2014 ' + prog.duration));
      row.appendChild(h('div', {style: 'color:var(--grey);margin-top:2px'}, '\uD83D\uDCC5 Semaines ' + prog.weeks + ' \u00b7 ' + prog.cue));
      prevCard.appendChild(row);
    });
    p.appendChild(prevCard);
  }

  var ok = S.calisthenicsLevel && S.calisthenicsGoal;
  if (!ok) p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'S\u00e9lectionnez un niveau et un objectif'));
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
    if (!ok) return;
    S.calisthenicsPlan = generateCalisthenicsPlan(S.calisthenicsLevel, S.calisthenicsGoal);
    S.calisthenicsWeek = 1;
    S.selectedCalisthenicsDay = 0;
    S.sStep = 25;
    if (window.BLACKBOX) BLACKBOX.log('calisthenics_config', { level: S.calisthenicsLevel, goal: S.calisthenicsGoal });
    window.render();
  }}, 'G\u00e9n\u00e9rer mon programme'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: backArrow + 'Retour'}));
}

// ─── STEP 25: CALLISTHÉNIE PROGRAMME ───
function renderCalisthenicsProgram(p) {
  var backArrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if (!S.calisthenicsPlan || !S.calisthenicsPlan.length) {
    S.calisthenicsPlan = generateCalisthenicsPlan(S.calisthenicsLevel || 'debutant', S.calisthenicsGoal || 'complet');
  }
  var plan = S.calisthenicsPlan;
  var totalWeeks = plan.length;
  if (!S.calisthenicsWeek || S.calisthenicsWeek < 1) S.calisthenicsWeek = 1;
  if (S.calisthenicsWeek > totalWeeks) S.calisthenicsWeek = totalWeeks;
  if (S.selectedCalisthenicsDay === undefined || S.selectedCalisthenicsDay === null) S.selectedCalisthenicsDay = 0;

  var weekData = plan[S.calisthenicsWeek - 1];
  if (!weekData) return;

  var phaseColors = { 'Fondations': '#1A3A6A', 'D\u00e9veloppement': '#E67E22', 'Sp\u00e9cifique': '#27AE60', 'Pic/Test': '#C0392B' };
  var phaseColor = phaseColors[weekData.phase] || '#1A3A6A';

  var headerCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin-bottom:12px'});
  headerCard.appendChild(h('div', {style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px'}, [
    h('div', {style: 'font-family:Georgia;font-size:16px'}, weekData.isDeload ? '\u267B\uFE0F D\u00e9load \u2014 Semaine ' + weekData.week : '\uD83D\uDCAA Semaine ' + weekData.week + ' / ' + totalWeeks),
    h('span', {style: 'background:' + phaseColor + ';color:#fff;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:1px;padding:3px 10px;font-weight:600'}, weekData.phase.toUpperCase())
  ]));
  headerCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin-top:4px'}, weekData.focus));
  p.appendChild(headerCard);

  var restReminder = h('div', {style: 'background:#E8F5E9;border-left:3px solid #27AE60;padding:8px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1B5E20'});
  restReminder.appendChild(h('span', {style: 'font-weight:700'}, '\u23F1 Repos skills statiques (Planche / FL / HS) : 3-5 min minimum '));
  restReminder.appendChild(h('span', {}, '\u2014 Force dynamique : 2-3 min'));
  p.appendChild(restReminder);

  var weekNav = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:12px;justify-content:center'});
  weekNav.appendChild(h('button', {style: 'padding:6px 12px;font-size:12px;border:1px solid var(--border);background:var(--ivory2);cursor:pointer', disabled: S.calisthenicsWeek <= 1, onclick: function(){ if (S.calisthenicsWeek > 1) { S.calisthenicsWeek--; S.selectedCalisthenicsDay = 0; window.render(); }}}, '\u2190'));
  weekNav.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey)'}, 'S' + S.calisthenicsWeek + ' / S' + totalWeeks));
  weekNav.appendChild(h('button', {style: 'padding:6px 12px;font-size:12px;border:1px solid var(--border);background:var(--ivory2);cursor:pointer', disabled: S.calisthenicsWeek >= totalWeeks, onclick: function(){ if (S.calisthenicsWeek < totalWeeks) { S.calisthenicsWeek++; S.selectedCalisthenicsDay = 0; window.render(); }}}, '\u2192'));
  p.appendChild(weekNav);

  var sessions = weekData.sessions || [];
  var tabs = h('div', {style: 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px'});
  sessions.forEach(function(sess, i) {
    var isActive = S.selectedCalisthenicsDay === i;
    tabs.appendChild(h('button', {
      style: 'padding:6px 12px;font-size:11px;border:1.5px solid ' + (isActive ? 'var(--accent,#0A0A09)' : 'var(--border)') + ';background:' + (isActive ? 'var(--accent,#0A0A09)' : 'var(--ivory2)') + ';color:' + (isActive ? '#fff' : 'inherit') + ';cursor:pointer;font-weight:' + (isActive ? '600' : '400'),
      onclick: (function(idx){ return function(){ S.selectedCalisthenicsDay = idx; window.render(); }; })(i)
    }, 'J' + (i + 1)));
  });
  p.appendChild(tabs);

  var currentSess = sessions[S.selectedCalisthenicsDay];
  if (currentSess) {
    var focusColors = { planche: '#E67E22', frontlever: '#1A3A6A', muscleup: '#C0392B', handstand: '#7B5EA7', conditioning: '#27AE60', strength: '#D4AC0D', legs: '#16A085', mobility: '#2ECC71', pull: '#1A3A6A', push: '#E67E22' };
    var fColor = focusColors[currentSess.focus] || '#1A3A6A';
    var sessCard = h('div', {'class': 'exercise-card', style: 'border-left:3px solid ' + fColor});
    sessCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:18px;margin-bottom:4px'}, '\uD83D\uDCAA ' + currentSess.name));
    currentSess.exercises.forEach(function(ex, ei) {
      var exRow = h('div', {style: 'padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8);font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px'});
      exRow.appendChild(h('div', {style: 'font-weight:600;margin-bottom:2px'}, (ei + 1) + '. ' + ex));
      var skillMapKey = currentSess.focus === 'planche' ? 'planche' : currentSess.focus === 'frontlever' ? 'frontLever' : currentSess.focus === 'muscleup' ? 'muscleUp' : currentSess.focus === 'handstand' ? 'handstand' : null;
      if (skillMapKey && CALISTHENICS_SKILLS[skillMapKey] && ei === 0) {
        var skillData = CALISTHENICS_SKILLS[skillMapKey];
        var matchedProg = null;
        for (var pi = 0; pi < skillData.progressions.length; pi++) {
          var wArr = skillData.progressions[pi].weeks.split('-');
          if (S.calisthenicsWeek >= parseInt(wArr[0]) && S.calisthenicsWeek <= parseInt(wArr[1] || '999')) {
            matchedProg = skillData.progressions[pi]; break;
          }
        }
        if (matchedProg) {
          exRow.appendChild(h('div', {style: 'font-size:10px;color:' + fColor + ';margin-top:3px;font-style:italic'}, '\uD83C\uDFAF Niveau cible S' + S.calisthenicsWeek + ' : ' + matchedProg.name + ' (' + matchedProg.duration + ')'));
          exRow.appendChild(h('div', {style: 'font-size:10px;color:var(--grey);margin-top:1px'}, '\uD83D\uDCA1 ' + matchedProg.cue));
        }
      }
      sessCard.appendChild(exRow);
    });
    p.appendChild(sessCard);
  }

  var roadmapSkillKey = S.calisthenicsGoal && S.calisthenicsGoal !== 'complet' ? S.calisthenicsGoal : 'planche';
  var roadmapSkill = CALISTHENICS_SKILLS[roadmapSkillKey];
  if (roadmapSkill) {
    var roadmapCard = h('div', {style: 'border:1px solid var(--border);padding:12px 16px;background:var(--ivory2);margin:12px 0'});
    roadmapCard.appendChild(h('div', {style: 'font-family:Georgia;font-size:13px;margin-bottom:8px'}, roadmapSkill.icon + ' Roadmap \u2014 ' + roadmapSkill.name));
    roadmapCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:6px'}, '\u23F1 Repos entre sets de skill statique : ' + roadmapSkill.restTime));
    roadmapSkill.progressions.forEach(function(prog) {
      var wRng = prog.weeks.split('-');
      var isCurrent = S.calisthenicsWeek >= parseInt(wRng[0]) && S.calisthenicsWeek <= parseInt(wRng[1] || '999');
      var rowStyle = 'padding:5px 0;border-bottom:1px solid var(--ivory3,#EEEDE8);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px';
      if (isCurrent) rowStyle += ';background:#FFFDE7;border-radius:3px;padding:6px 8px;margin:2px -4px';
      var row = h('div', {style: rowStyle});
      row.appendChild(h('div', {style: 'font-weight:' + (isCurrent ? '700' : '500') + ';color:' + (isCurrent ? phaseColor : 'var(--grey)')}, (isCurrent ? '\u25B6 ' : '') + prog.level + '. ' + prog.name + ' \u2014 ' + prog.duration + ' \u00b7 S' + prog.weeks));
      if (isCurrent) row.appendChild(h('div', {style: 'font-size:10px;color:var(--grey);margin-top:2px'}, '\uD83D\uDCA1 ' + prog.cue));
      roadmapCard.appendChild(row);
    });
    p.appendChild(roadmapCard);
  }

  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 24; window.render(); }, html: backArrow + 'Modifier la configuration'}));
}

// ─── PDF EXPORT (Sport / Musculation) ───
function exportSportPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) { alert('PDF non disponible (biblioth\u00e8que non charg\u00e9e)'); return; }
  var program = S.sportProgram;
  if (!program || !program.length) { alert('Aucun programme \u00e0 exporter'); return; }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({unit: 'mm', format: 'a4'});
  var W = 210, M = 20, CW = W - 2 * M, y = 0;
  var ivory = [250, 250, 247], black = [10, 10, 9], grey = [107, 107, 101], border = [216, 216, 208];

  // Header bg
  doc.setFillColor(black[0], black[1], black[2]);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(ivory[0], ivory[1], ivory[2]);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('MTD SMARTFIT COACH', M, 14);
  doc.setFontSize(16); doc.setFont('times', 'italic');
  doc.text('Programme Sport', M, 26);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text(program.length + ' jour' + (program.length > 1 ? 's' : '') + '/semaine', M, 33);
  y = 46;

  // Days
  program.forEach(function(day) {
    if (y > 260) { doc.addPage(); y = 20; }
    // Day header
    doc.setFillColor(ivory[0], ivory[1], ivory[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.rect(M, y - 2, CW, 10, 'FD');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(black[0], black[1], black[2]);
    doc.text(day.name || 'Jour', M + 4, y + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text(day.focus || '', M + 4 + 20, y + 4);
    y += 14;

    // Exercises
    var dayExercises = Array.isArray(day.exercises) ? day.exercises : [];
    dayExercises.forEach(function(ex) {
      if (y > 272) { doc.addPage(); y = 20; }
      doc.setFont('times', 'normal'); doc.setFontSize(11); doc.setTextColor(black[0], black[1], black[2]);
      var lines = doc.splitTextToSize(ex.n || '', CW - 30);
      lines.forEach(function(line) { doc.text(line, M + 4, y); y += 5; });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(grey[0], grey[1], grey[2]);
      var detail = (ex.sets || '') + (ex.rest ? '  \u00b7  Repos ' + ex.rest : '') + (ex.m ? '  \u00b7  ' + ex.m : '');
      doc.text(detail, M + 4, y); y += 4;
      if (ex.eq) { doc.setFontSize(7); doc.text(ex.eq, M + 4, y); y += 4; }
      y += 2;
    });

    y += 4;
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.line(M, y, W - M, y); y += 6;
  });

  // Footer
  var pages = doc.internal.getNumberOfPages();
  for (var i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(6); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text('MTD SmartFit Coach \u2014 g\u00e9n\u00e9r\u00e9 le ' + new Date().toLocaleDateString('fr-FR'), M, 290);
    doc.text('Page ' + i + '/' + pages, W - M, 290, {align: 'right'});
  }
  doc.save('programme-sport.pdf');
}
window.exportSportPDF = exportSportPDF;

// ─── STEP 24: CALISTHENICS ONBOARDING ───
function renderCalisthenicsOnboarding(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Callisthénie'));
  p.appendChild(h('h1', {html: 'Votre programme<br><em>callisthénie</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Street workout, progressions au poids du corps.'));

  // Niveau
  p.appendChild(h('div', {'class': 'section-label'}, 'Niveau'));
  var lvlList = h('div', {'class': 'level-list'});
  [
    { id: 'debutant',      icon: '🌱', name: 'Débutant',      desc: 'Moins de 5 tractions, bases à construire' },
    { id: 'intermediaire', icon: '🌿', name: 'Intermédiaire', desc: '5-12 tractions, maîtrise des fondamentaux' },
    { id: 'avance',        icon: '🍃', name: 'Avancé',        desc: '12+ tractions, apprentissage des skills' },
    { id: 'elite',         icon: '🏆', name: 'Elite',         desc: 'Maîtrise complète, skills de haut niveau' }
  ].forEach(function(lv) {
    var isOn = S.calisthenicsLevel === lv.id;
    lvlList.appendChild(h('div', {'class': 'level-item' + (isOn ? ' on' : ''), onclick: function(){ S.calisthenicsLevel = lv.id; window.render(); }}, [
      h('div', {}, [
        h('div', {'class': 'level-name'}, lv.icon + ' ' + lv.name),
        h('div', {'class': 'level-desc'}, lv.desc)
      ]),
      isOn ? h('span', {'class': 'level-badge'}, '✓') : h('span', {})
    ]));
  });
  p.appendChild(lvlList);

  // Pull-ups max
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Pull-ups max (en une série)'));
  var puWrap = h('div', {'class': 'num-input-wrap'});
  puWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '0', max: '50', value: String(S.calisthPullups || 0), inputmode: 'numeric',
    oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 50) { S.calisthPullups = v; } },
    onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 0) { e.target.value = '0'; S.calisthPullups = 0; } else if (v > 50) { e.target.value = '50'; S.calisthPullups = 50; } }
  }));
  puWrap.appendChild(h('span', {'class': 'num-unit'}, 'reps'));
  p.appendChild(puWrap);
  p.appendChild(h('div', {'class': 'num-hint'}, '0 à 50 répétitions'));

  // Push-ups max
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Push-ups max (en une série)'));
  var ppWrap = h('div', {'class': 'num-input-wrap'});
  ppWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '0', max: '100', value: String(S.calisthPushups || 0), inputmode: 'numeric',
    oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) { S.calisthPushups = v; } },
    onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 0) { e.target.value = '0'; S.calisthPushups = 0; } else if (v > 100) { e.target.value = '100'; S.calisthPushups = 100; } }
  }));
  ppWrap.appendChild(h('span', {'class': 'num-unit'}, 'reps'));
  p.appendChild(ppWrap);
  p.appendChild(h('div', {'class': 'num-hint'}, '0 à 100 répétitions'));

  // Objectifs (multi-select chips)
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Objectifs (plusieurs choix possibles)'));
  var goalChips = h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px'});
  var GOAL_OPTIONS = [
    { id: 'muscle_up',   label: 'Muscle-up' },
    { id: 'handstand',   label: 'Handstand' },
    { id: 'front_lever', label: 'Front lever' },
    { id: 'planche',     label: 'Planche' },
    { id: 'lsit',        label: 'L-sit' },
    { id: 'dragon_flag', label: 'Dragon flag' }
  ];
  if (!S.calisthenicsGoal) S.calisthenicsGoal = [];
  GOAL_OPTIONS.forEach(function(g) {
    var isOn = S.calisthenicsGoal.indexOf(g.id) >= 0;
    goalChips.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), onclick: function(){
      var idx = S.calisthenicsGoal.indexOf(g.id);
      if (idx >= 0) { S.calisthenicsGoal.splice(idx, 1); } else { S.calisthenicsGoal.push(g.id); }
      window.render();
    }}, g.label));
  });
  p.appendChild(goalChips);

  // Jours par semaine
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:20px'}, 'Jours par semaine'));
  var nw = h('div', {'class': 'num-input-wrap'});
  nw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '2', max: '5', value: String(S.calisthenicsdays || 3), inputmode: 'numeric',
    oninput: function(e){ var v = parseInt(e.target.value); if (!isNaN(v) && v >= 2 && v <= 5) { S.calisthenicsdays = v; } },
    onblur: function(e){ var v = parseInt(e.target.value); if (isNaN(v) || v < 2) { e.target.value = '2'; S.calisthenicsdays = 2; } else if (v > 5) { e.target.value = '5'; S.calisthenicsdays = 5; } }
  }));
  nw.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
  p.appendChild(nw);
  p.appendChild(h('div', {'class': 'num-hint'}, '2 à 5 jours par semaine'));

  p.appendChild(h('div', {style: 'height:20px'}));
  var ok = S.calisthenicsLevel && S.calisthenicsGoal && S.calisthenicsGoal.length > 0;
  if (!ok) {
    p.appendChild(h('div', {'class': 'field-error', style: 'text-align:center;margin-bottom:8px'}, 'Sélectionnez un niveau et au moins un objectif'));
  }
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function(){
    if (ok) {
      if (!S.calisthenicsdays) S.calisthenicsdays = 3;
      if (!S.calisthPullups) S.calisthPullups = 0;
      if (!S.calisthPushups) S.calisthPushups = 0;
      S.sStep = 25;
      window.BLACKBOX && window.BLACKBOX.log('calisthenics_config', { level: S.calisthenicsLevel, goal: S.calisthenicsGoal, days: S.calisthenicsdays });
      window.render();
    }
  }}, 'Générer mon programme'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function(){ S.sStep = 0; S.sportType = null; window.render(); }, html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour'}));
}

// ─── STEP 25: CALISTHENICS PROGRAM ───
function renderCalisthenicsProgram(content) {
  var skills = S.calisthenicsGoal || [];
  var level = S.calisthenicsLevel || 'debutant';
  var pullups = parseInt(S.calisthPullups) || 0;

  var SKILLS = {
    'muscle_up': {
      name: 'Muscle-up barre', emoji: '🔝',
      prereqs: '8+ pull-ups explosifs, dip complet',
      time: {debutant:'8-12 mois', intermediaire:'4-6 mois', avance:'2-3 mois', elite:'2-6 semaines'},
      steps: [
        'Semaines 1-4 : Pull-ups stricts 5×5 — tirer coudes vers hanches',
        'Semaines 4-8 : Pull-ups explosifs 5×3 — toucher la barre avec la poitrine',
        'Semaines 6-10 : Fausse prise 5×3 — poignet par-dessus la barre',
        'Semaines 8-14 : Muscle-up négatif 5×3 — transition lente 5 sec',
        'Semaines 12+ : Muscle-up strict 3×1-3 reps'
      ],
      video: 'https://www.youtube.com/watch?v=_UNWnDiMnyM'
    },
    'handstand': {
      name: 'Handstand (ATR)', emoji: '🤸',
      prereqs: 'Push-ups corrects, core solide, poignets renforcés',
      time: {debutant:'6-12 mois', intermediaire:'3-6 mois', avance:'1-3 mois', elite:'2-4 semaines'},
      steps: [
        'Quotidien : Wrist warm-up 3×30 sec — OBLIGATOIRE avant chaque session',
        'Semaines 1-3 : Pike hold contre mur 4×30 sec',
        'Semaines 2-6 : Wall handstand face au mur 4×20-30 sec',
        'Semaines 4-10 : Kick-up + bail — apprendre à tomber proprement d\'abord',
        'Semaines 8-16 : Chest-to-wall + tentatives libres',
        'Semaines 12+ : Freestanding — 10 min de pratique quotidienne'
      ],
      video: 'https://www.youtube.com/watch?v=v61TBViFh0g'
    },
    'front_lever': {
      name: 'Front lever', emoji: '🏹',
      prereqs: '15+ pull-ups, hollow body 30 sec',
      time: {debutant:'18-24 mois', intermediaire:'10-14 mois', avance:'5-8 mois', elite:'2-4 mois'},
      steps: [
        'Semaines 1-4 : Tuck front lever 4×10 sec — genoux serrés contre poitrine',
        'Semaines 4-8 : Advanced tuck 4×8 sec — dos plat',
        'Semaines 8-14 : One leg front lever 4×6 sec',
        'Semaines 12-20 : Straddle 3×5 sec — jambes écartées',
        'Semaines 18+ : Full front lever 3×3-5 sec'
      ],
      video: 'https://www.youtube.com/watch?v=IhhgTE2WxKE'
    },
    'planche': {
      name: 'Planche', emoji: '🧲',
      prereqs: 'Planche lean 45°, core extrême, années de pratique',
      time: {debutant:'3-5 ans', intermediaire:'2-3 ans', avance:'1-2 ans', elite:'6-12 mois'},
      steps: [
        'Mois 1-6 : Planche lean — incliner le corps vers l\'avant progressivement',
        'Mois 6-12 : Tuck planche 4×5-10 sec',
        'Mois 12-18 : Advanced tuck planche 4×5 sec',
        'Mois 18-30 : Straddle planche 3×3-5 sec',
        'Mois 30+ : Full planche — quelques secondes'
      ],
      video: 'https://www.youtube.com/watch?v=MWA7p2sXNiE'
    },
    'lsit': {
      name: 'L-sit', emoji: '🅻',
      prereqs: 'Dips complets, souplesse ischios',
      time: {debutant:'2-5 mois', intermediaire:'1-2 mois', avance:'2-6 semaines', elite:'1-3 semaines'},
      steps: [
        'Semaines 1-2 : Flexion genoux au sol (tuck L-sit) 4×5-10 sec',
        'Semaines 2-4 : Une jambe tendue, une fléchie 4×8 sec',
        'Semaines 4-8 : L-sit complet 4×10 sec',
        'Semaines 8+ : L-sit tenu 30+ sec'
      ],
      video: 'https://www.youtube.com/watch?v=16a529mtX68'
    },
    'dragon_flag': {
      name: 'Dragon flag', emoji: '🐉',
      prereqs: 'L-sit 20 sec, leg raise strict, core fort',
      time: {debutant:'4-8 mois', intermediaire:'2-4 mois', avance:'1-2 mois', elite:'1-3 semaines'},
      steps: [
        'Semaines 1-3 : Leg raise strict 4×10 — jambes tendues',
        'Semaines 3-6 : Dragon flag négatif 4×5 — descente lente 5 sec',
        'Semaines 6-10 : Dragon flag partiel 4×5 sec hold',
        'Semaines 10+ : Dragon flag complet 3×3-5 reps'
      ],
      video: 'https://www.youtube.com/watch?v=moyFIvRrS0s'
    }
  };

  // Header
  var header = h('div', {'class':'card', style:'margin-bottom:16px'}, [
    h('div', {'class':'label-caps', style:'margin-bottom:4px'}, '💪 CALLISTHÉNIE'),
    h('div', {style:'font-size:13px;color:var(--grey3)'}, 'Niveau: ' + level + ' — ' + (skills.length || 0) + ' skill(s) sélectionné(s)')
  ]);
  content.appendChild(header);

  // Avertissements médicaux
  if (S.muscuMedical) {
    var warns = [];
    if (S.muscuMedical.shoulders || S.muscuMedical.rotatorCuff) warns.push('Épaules : progresser avec assistance élastique uniquement, éviter HSPU et planche');
    if (S.muscuMedical.hernia || S.muscuMedical.herniaDisc) warns.push('Hernie : éviter dragon flag, L-sit et human flag (compression discale)');
    if (S.muscuMedical.wrists) warns.push('Poignets : renforcement 4-6 semaines AVANT tout appui');
    if (warns.length) {
      var warnDiv = h('div', {style:'background:rgba(180,100,0,0.1);border:1px solid #B47800;border-radius:8px;padding:12px;margin-bottom:16px'});
      warns.forEach(function(w) { warnDiv.appendChild(h('div', {style:'font-size:12px;margin-bottom:4px'}, '⚠️ ' + w)); });
      content.appendChild(warnDiv);
    }
  }

  // Skills sélectionnés
  if (!skills || skills.length === 0) {
    content.appendChild(h('div', {'class':'empty-state'}, [
      h('div', {'class':'empty-state-icon'}, '💪'),
      h('div', {'class':'empty-state-title'}, 'Aucun skill sélectionné'),
      h('div', {style:'font-size:13px;color:var(--grey3);margin-top:8px'}, 'Retournez à l\'onboarding pour choisir vos objectifs.')
    ]));
  } else {
    skills.forEach(function(skillId) {
      var sk = SKILLS[skillId];
      if (!sk) return;
      var card = h('div', {'class':'card', style:'margin-bottom:16px'});
      // Header skill
      card.appendChild(h('div', {style:'display:flex;align-items:center;gap:8px;margin-bottom:12px'}, [
        h('span', {style:'font-size:24px'}, sk.emoji),
        h('div', {}, [
          h('div', {style:'font-weight:600;font-size:15px'}, sk.name),
          h('div', {style:'font-size:11px;color:var(--grey3)'}, 'Prérequis: ' + sk.prereqs)
        ])
      ]));
      // Temps de maîtrise
      card.appendChild(h('div', {style:'background:var(--surface,#F4F4F0);border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:12px'}, [
        h('span', {style:'font-weight:600'}, '⏱ Temps estimé: '),
        h('span', {style:'color:var(--grey3)'}, sk.time[level] || sk.time['debutant'])
      ]));
      // Étapes de progression
      var stepsDiv = h('div', {style:'margin-bottom:12px'});
      stepsDiv.appendChild(h('div', {'class':'label-caps', style:'margin-bottom:8px;font-size:9px'}, 'PROGRESSION'));
      sk.steps.forEach(function(step, i) {
        stepsDiv.appendChild(h('div', {style:'display:flex;gap:8px;margin-bottom:6px;font-size:12px;line-height:1.4'}, [
          h('span', {style:'color:var(--accent,#1A4A1A);font-weight:700;flex-shrink:0'}, (i+1) + '.'),
          h('span', {style:'color:var(--text,#0A0A09)'}, step)
        ]));
      });
      card.appendChild(stepsDiv);
      // Vidéo
      card.appendChild(h('a', {href:sk.video, target:'_blank', rel:'noopener', style:'display:inline-block;font-size:12px;color:var(--accent,#1A4A1A);text-decoration:underline'}, '▶ Voir la démonstration vidéo'));
      content.appendChild(card);
    });
  }

  // Programme hebdomadaire
  var progCard = h('div', {'class':'card', style:'margin-bottom:16px'});
  progCard.appendChild(h('div', {'class':'label-caps', style:'margin-bottom:12px'}, 'PROGRAMME HEBDOMADAIRE'));
  var days = S.calisthenicsdays || 3;
  var weekPlan = [];
  if (days >= 2) weekPlan.push({day:'Lundi', focus:'Pull (tractions, skills barre)', warmup:'5 min: scapular pull-ups 3×10, dead hangs 3×20 sec'});
  if (days >= 2) weekPlan.push({day:'Mercredi', focus:'Push (dips, HSPU, handstand)', warmup:'5 min: wrist circles, pike push-ups, shoulder circles'});
  if (days >= 3) weekPlan.push({day:'Vendredi', focus:'Core & Skills statiques (L-sit, planche)', warmup:'5 min: hollow body 3×20 sec, arch hold, planche lean'});
  if (days >= 4) weekPlan.push({day:'Samedi', focus:'Full body skills + pratique libre', warmup:'10 min activation générale'});
  if (days >= 5) weekPlan.push({day:'Dimanche', focus:'Récupération active + mobilité', warmup:'Stretching 20 min'});
  weekPlan.forEach(function(d) {
    var dayDiv = h('div', {style:'margin-bottom:10px;padding:10px;background:var(--surface,#F4F4F0);border-radius:6px'});
    dayDiv.appendChild(h('div', {style:'font-weight:600;font-size:13px;margin-bottom:4px'}, d.day + ' — ' + d.focus));
    dayDiv.appendChild(h('div', {style:'font-size:11px;color:var(--grey3)'}, '🔥 ' + d.warmup));
    progCard.appendChild(dayDiv);
  });
  content.appendChild(progCard);

  // Règles d'or
  var rulesCard = h('div', {'class':'card'});
  rulesCard.appendChild(h('div', {'class':'label-caps', style:'margin-bottom:12px'}, 'RÈGLES D\'OR CALLISTHÉNIE'));
  ['La régularité bat l\'intensité — 20 min/jour > 2h/semaine',
   'Repos 3-5 min entre séries de skills (pas 60 sec)',
   'Maîtrisez les prérequis AVANT de progresser',
   'Qualité > quantité — 1 rep parfaite vaut 10 reps bâclées',
   'Échauffez les poignets SYSTÉMATIQUEMENT'
  ].forEach(function(rule) {
    rulesCard.appendChild(h('div', {style:'font-size:12px;margin-bottom:6px;padding-left:12px;border-left:2px solid var(--accent,#1A4A1A)'}, rule));
  });
  content.appendChild(rulesCard);

  // Bouton retour
  var backBtn = h('button', {'class':'btn-back', style:'margin-top:16px', onclick:function(){ S.sStep=24; window.render(); }}, '← Modifier les objectifs');
  content.appendChild(backBtn);
}

})();
