/* ═══════════════════════════════════════════════════════════════
   MUSCLE-TAXONOMY.JS — SmartFitCoach
   Taxonomie musculaire WOD×Muscu + détection conflits récupération
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     A. WOD_MOVEMENT_MUSCLE_MAP
     Clés : strings lowercase (sous-chaînes de noms de mouvements)
     Valeurs : groupes musculaires sollicités
  ───────────────────────────────────────────────────────────── */
  var WOD_MOVEMENT_MUSCLE_MAP = {
    // Thrusters
    'thruster': ['epaules', 'quadriceps', 'core', 'triceps'],

    // Deadlift / Souleve de terre
    'deadlift': ['lombaires', 'ischio-jambiers', 'fessiers', 'dos'],
    'souleve de terre': ['lombaires', 'ischio-jambiers', 'fessiers', 'dos'],
    'soulevé de terre': ['lombaires', 'ischio-jambiers', 'fessiers', 'dos'],
    'sumo dl': ['fessiers', 'quadriceps', 'lombaires'],
    'sumo deadlift': ['fessiers', 'quadriceps', 'lombaires'],
    'sdlhp': ['lombaires', 'fessiers', 'ischio-jambiers', 'epaules'],
    'sumo dl high pull': ['lombaires', 'fessiers', 'ischio-jambiers', 'epaules'],
    'single leg deadlift': ['lombaires', 'ischio-jambiers', 'fessiers'],
    'rdl': ['lombaires', 'ischio-jambiers', 'fessiers'],
    'romanian deadlift': ['lombaires', 'ischio-jambiers', 'fessiers'],

    // Cleans
    'power clean': ['lombaires', 'epaules', 'quadriceps'],
    'hang clean': ['lombaires', 'epaules', 'quadriceps'],
    'hang power clean': ['lombaires', 'epaules', 'quadriceps'],
    'squat clean': ['lombaires', 'epaules', 'quadriceps', 'fessiers'],
    'clean': ['lombaires', 'epaules', 'quadriceps'],

    // Snatches
    'power snatch': ['epaules', 'lombaires', 'quadriceps'],
    'hang snatch': ['epaules', 'lombaires', 'quadriceps'],
    'hang power snatch': ['epaules', 'lombaires', 'quadriceps'],
    'snatch': ['epaules', 'lombaires', 'quadriceps'],

    // Pull-ups / Tractions
    'pull-up': ['dos', 'biceps'],
    'pullup': ['dos', 'biceps'],
    'pull up': ['dos', 'biceps'],
    'traction': ['dos', 'biceps'],
    'tractions': ['dos', 'biceps'],
    'c2b': ['dos', 'biceps'],
    'chest-to-bar': ['dos', 'biceps'],
    'ring row': ['dos', 'biceps'],

    // Push-ups / Pompes
    'push-up': ['pectoraux', 'triceps'],
    'pushup': ['pectoraux', 'triceps'],
    'push up': ['pectoraux', 'triceps'],
    'pompe': ['pectoraux', 'triceps'],
    'pike push-up': ['epaules', 'triceps'],
    'pike push up': ['epaules', 'triceps'],

    // Burpees
    'burpee': ['pectoraux', 'quadriceps', 'core'],

    // Box Jumps / Sauts
    'box jump': ['quadriceps', 'fessiers', 'mollets'],
    'box jumps': ['quadriceps', 'fessiers', 'mollets'],
    'box step-up': ['quadriceps', 'fessiers'],
    'step up': ['quadriceps', 'fessiers'],
    'step-up': ['quadriceps', 'fessiers'],
    'saut': ['quadriceps', 'fessiers', 'mollets'],

    // Double Unders / Corde à sauter
    'double under': ['mollets', 'core'],
    'double unders': ['mollets', 'core'],
    'du': ['mollets', 'core'],
    'single under': ['mollets', 'core'],
    'corde a sauter': ['mollets', 'core'],

    // Kettlebell Swings
    'kb swing': ['lombaires', 'fessiers', 'ischio-jambiers'],
    'kb swings': ['lombaires', 'fessiers', 'ischio-jambiers'],
    'kettlebell swing': ['lombaires', 'fessiers', 'ischio-jambiers'],
    'american swing': ['lombaires', 'fessiers', 'ischio-jambiers'],

    // Wall Ball
    'wall ball': ['quadriceps', 'epaules', 'core'],
    'wall balls': ['quadriceps', 'epaules', 'core'],

    // Toes to Bar / TTB
    'toes-to-bar': ['core', 'epaules'],
    'toes to bar': ['core', 'epaules'],
    'ttb': ['core', 'epaules'],
    'knees-to-chest': ['core'],
    'hanging knee raise': ['core'],

    // Muscle-ups
    'muscle-up': ['dos', 'pectoraux', 'triceps'],
    'muscle up': ['dos', 'pectoraux', 'triceps'],
    'ring muscle-up': ['dos', 'pectoraux', 'triceps'],
    'ring muscle up': ['dos', 'pectoraux', 'triceps'],
    'bar muscle-up': ['dos', 'pectoraux', 'triceps'],
    'bar muscle up': ['dos', 'pectoraux', 'triceps'],

    // Ring Dips / Dips
    'ring dip': ['pectoraux', 'triceps'],
    'dip': ['pectoraux', 'triceps'],
    'dips': ['pectoraux', 'triceps'],

    // Handstand Push-up / HSPU
    'handstand push-up': ['epaules', 'triceps', 'core'],
    'handstand push up': ['epaules', 'triceps', 'core'],
    'hspu': ['epaules', 'triceps', 'core'],

    // Overhead Squat / OHS
    'overhead squat': ['epaules', 'quadriceps', 'core'],
    'ohs': ['epaules', 'quadriceps', 'core'],

    // Front Squat
    'front squat': ['quadriceps', 'core'],

    // Back Squat
    'back squat': ['quadriceps', 'fessiers', 'lombaires'],
    'squat barre': ['quadriceps', 'fessiers', 'lombaires'],
    'air squat': ['quadriceps', 'fessiers'],
    'squat': ['quadriceps', 'fessiers', 'lombaires'],

    // Push Press
    'push press': ['epaules', 'triceps', 'core'],

    // Push Jerk / Jerk
    'push jerk': ['epaules', 'triceps', 'quadriceps'],
    'jerk': ['epaules', 'triceps', 'quadriceps'],
    'split jerk': ['epaules', 'triceps', 'quadriceps'],

    // Rowing (ergomètre)
    'cal row': ['dos', 'epaules', 'quadriceps'],
    'calories row': ['dos', 'epaules', 'quadriceps'],
    'row': ['dos', 'epaules', 'quadriceps'],
    'ramer': ['dos', 'epaules', 'quadriceps'],

    // Assault Bike / Vélo
    'assault bike': ['quadriceps', 'epaules', 'core'],
    'cal assault bike': ['quadriceps', 'epaules', 'core'],
    'calories assault bike': ['quadriceps', 'epaules', 'core'],
    'velo': ['quadriceps', 'epaules', 'core'],
    'vélo': ['quadriceps', 'epaules', 'core'],
    'airbike': ['quadriceps', 'epaules', 'core'],

    // Running / Course
    'run': ['quadriceps', 'mollets', 'ischio-jambiers'],
    'course': ['quadriceps', 'mollets', 'ischio-jambiers'],
    'run 400m': ['quadriceps', 'mollets', 'ischio-jambiers'],
    'run 800m': ['quadriceps', 'mollets', 'ischio-jambiers'],
    'run 200m': ['quadriceps', 'mollets', 'ischio-jambiers'],

    // Rope Climb
    'rope climb': ['dos', 'biceps', 'avant-bras'],

    // Sit-ups / Abdos
    'sit-up': ['core'],
    'sit up': ['core'],
    'abdo': ['core'],
    'abdos': ['core'],

    // Plank / Gainage
    'plank': ['core', 'epaules'],
    'gainage': ['core', 'epaules'],

    // Lunges / Fentes
    'lunge': ['quadriceps', 'fessiers'],
    'lunges': ['quadriceps', 'fessiers'],
    'fente': ['quadriceps', 'fessiers'],
    'fentes': ['quadriceps', 'fessiers'],
    'fente bulgare': ['quadriceps', 'fessiers'],
    'bulgare': ['quadriceps', 'fessiers'],

    // Turkish Get-Up / TGU
    'turkish get-up': ['epaules', 'core', 'quadriceps'],
    'turkish get up': ['epaules', 'core', 'quadriceps'],
    'tgu': ['epaules', 'core', 'quadriceps'],

    // Farmer Carry
    'farmer carry': ['avant-bras', 'trapezes', 'core'],
    'farmer walk': ['avant-bras', 'trapezes', 'core'],

    // Strict Press / Shoulder Press
    'strict press': ['epaules', 'triceps'],
    'shoulder press': ['epaules', 'triceps'],
    'kb press': ['epaules', 'triceps'],
    'dumbbell press': ['epaules', 'triceps'],
    'db press': ['epaules', 'triceps'],

    // Pistol / Pistol Squat
    'pistol': ['quadriceps', 'fessiers', 'core'],
    'pistols': ['quadriceps', 'fessiers', 'core'],
    'pistol squat': ['quadriceps', 'fessiers', 'core'],

    // Sandbag
    'sandbag': ['dos', 'core', 'quadriceps'],

    // GHD Sit-up
    'ghd sit-up': ['core', 'lombaires'],
    'ghd': ['core', 'lombaires'],

    // Back Extension / Hyperextension
    'back extension': ['lombaires', 'fessiers'],
    'hyperextension': ['lombaires', 'fessiers'],

    // Ski Erg
    'ski erg': ['dos', 'epaules', 'core'],
    'calories ski erg': ['dos', 'epaules', 'core'],
    'cal ski erg': ['dos', 'epaules', 'core'],

    // Sled Push
    'sled push': ['quadriceps', 'fessiers', 'epaules'],

    // Bear Crawl
    'bear crawl': ['epaules', 'core', 'quadriceps'],

    // Devil Press
    'devil press': ['epaules', 'lombaires', 'quadriceps'],

    // Sumo High Pull
    'sumo high pull': ['fessiers', 'quadriceps', 'lombaires', 'epaules']
  };

  /* ─────────────────────────────────────────────────────────────
     B. RECOVERY_WINDOWS (heures de récupération par groupe)
  ───────────────────────────────────────────────────────────── */
  var RECOVERY_WINDOWS = {
    'epaules': 48,
    'pectoraux': 48,
    'dos': 48,
    'biceps': 24,
    'triceps': 24,
    'quadriceps': 72,
    'ischio-jambiers': 72,
    'fessiers': 72,
    'mollets': 24,
    'core': 24,
    'lombaires': 72,
    'avant-bras': 24,
    'trapezes': 48
  };

  /* ─────────────────────────────────────────────────────────────
     C. MUSCU_SPLITS (depuis muscu-programs.js)
     Mapping des keys de split → groupes musculaires réels
  ───────────────────────────────────────────────────────────── */
  var MUSCU_SPLITS = {
    'pectoraux': ['pectoraux', 'triceps', 'epaules'],
    'dos': ['dos', 'biceps', 'lombaires'],
    'epaules': ['epaules', 'triceps', 'trapezes'],
    'bras': ['biceps', 'triceps', 'avant-bras'],
    'jambes': ['quadriceps', 'ischio-jambiers', 'fessiers', 'mollets', 'lombaires'],
    'fessiers': ['fessiers', 'ischio-jambiers'],
    'push': ['pectoraux', 'epaules', 'triceps'],
    'pull': ['dos', 'biceps'],
    'legs': ['quadriceps', 'ischio-jambiers', 'fessiers', 'mollets', 'lombaires'],
    'full': ['pectoraux', 'dos', 'epaules', 'quadriceps', 'fessiers'],
    'upper': ['pectoraux', 'dos', 'epaules', 'biceps', 'triceps'],
    'hypertrophie': ['pectoraux', 'dos', 'epaules', 'quadriceps'],
    'force': ['quadriceps', 'pectoraux', 'lombaires', 'dos'],
    'pectoraux-dos': ['pectoraux', 'dos', 'triceps', 'biceps'],
    'epaules-bras': ['epaules', 'biceps', 'triceps']
  };

  /* ─────────────────────────────────────────────────────────────
     D. Fonctions
  ───────────────────────────────────────────────────────────── */

  /**
   * _normalise(str) — lowercase + trim + remove accents for matching
   * @param {string} str
   * @returns {string}
   */
  function _normalise(str) {
    if (typeof str !== 'string') { return ''; }
    return str
      .toLowerCase()
      .replace(/\u00e0/g, 'a').replace(/\u00e2/g, 'a')
      .replace(/\u00e9/g, 'e').replace(/\u00e8/g, 'e').replace(/\u00ea/g, 'e').replace(/\u00eb/g, 'e')
      .replace(/\u00ee/g, 'i').replace(/\u00ef/g, 'i')
      .replace(/\u00f4/g, 'o').replace(/\u00f6/g, 'o')
      .replace(/\u00f9/g, 'u').replace(/\u00fb/g, 'u').replace(/\u00fc/g, 'u')
      .replace(/\u00e7/g, 'c')
      .trim();
  }

  /**
   * _findMusclesForMovement(movementName) — lookup dans WOD_MOVEMENT_MUSCLE_MAP
   * Cherche d'abord une clé exacte, puis une sous-chaîne.
   * @param {string} movementName
   * @returns {string[]}
   */
  function _findMusclesForMovement(movementName) {
    if (!movementName || typeof movementName !== 'string') { return []; }
    var norm = _normalise(movementName);

    // 1. Correspondance exacte
    if (WOD_MOVEMENT_MUSCLE_MAP.hasOwnProperty(norm)) {
      return WOD_MOVEMENT_MUSCLE_MAP[norm];
    }

    // 2. La clé est contenue dans le nom du mouvement (ex: "Hang Power Clean" ⊃ "hang power clean")
    var keys = Object.keys(WOD_MOVEMENT_MUSCLE_MAP);
    var i, key;
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (norm.indexOf(key) !== -1) {
        return WOD_MOVEMENT_MUSCLE_MAP[key];
      }
    }

    // 3. Le nom du mouvement est contenu dans une clé (correspondance partielle inverse)
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (key.indexOf(norm) !== -1 && norm.length >= 3) {
        return WOD_MOVEMENT_MUSCLE_MAP[key];
      }
    }

    return [];
  }

  /**
   * getMusclesForWOD(wodMovements) → string[]
   * Prend un array de mouvements WOD [{name, reps, weight}, ...]
   * et retourne les groupes musculaires sollicités (dédupliqués).
   * @param {Array} wodMovements
   * @returns {string[]}
   */
  function getMusclesForWOD(wodMovements) {
    if (!wodMovements || !Array.isArray(wodMovements) || wodMovements.length === 0) {
      return [];
    }

    var result = [];
    var seen = {};
    var i, j, movement, muscles, muscle;

    for (i = 0; i < wodMovements.length; i++) {
      movement = wodMovements[i];
      if (!movement || typeof movement !== 'object') { continue; }
      muscles = _findMusclesForMovement(movement.name || '');
      for (j = 0; j < muscles.length; j++) {
        muscle = muscles[j];
        if (!seen[muscle]) {
          seen[muscle] = true;
          result.push(muscle);
        }
      }
    }

    return result;
  }

  /**
   * getMusclesForMuscuDay(dayObj, S) → string[]
   * Prend un objet jour de musculation {muscles: [...], label: '...'}
   * et retourne les muscles sollicités (réels via MUSCU_SPLITS).
   * Si S.musculationGoal est fourni, peut compléter la liste.
   * @param {Object} dayObj
   * @param {Object} [S]
   * @returns {string[]}
   */
  function getMusclesForMuscuDay(dayObj, S) {
    if (!dayObj || typeof dayObj !== 'object') { return []; }

    var muscleKeys = dayObj.muscles;
    if (!muscleKeys || !Array.isArray(muscleKeys) || muscleKeys.length === 0) {
      return [];
    }

    var result = [];
    var seen = {};
    var i, j, key, expanded, muscle;

    for (i = 0; i < muscleKeys.length; i++) {
      key = muscleKeys[i];
      if (!key || typeof key !== 'string') { continue; }
      var normKey = key.toLowerCase().trim();

      if (MUSCU_SPLITS.hasOwnProperty(normKey)) {
        expanded = MUSCU_SPLITS[normKey];
        for (j = 0; j < expanded.length; j++) {
          muscle = expanded[j];
          if (!seen[muscle]) {
            seen[muscle] = true;
            result.push(muscle);
          }
        }
      } else {
        // Clé directe (muscle déjà nommé)
        if (!seen[normKey]) {
          seen[normKey] = true;
          result.push(normKey);
        }
      }
    }

    // Complément selon musculationGoal
    if (S && typeof S === 'object' && S.musculationGoal) {
      var goalKey = String(S.musculationGoal).toLowerCase().trim();
      if (MUSCU_SPLITS.hasOwnProperty(goalKey)) {
        var goalMuscles = MUSCU_SPLITS[goalKey];
        for (j = 0; j < goalMuscles.length; j++) {
          muscle = goalMuscles[j];
          if (!seen[muscle]) {
            seen[muscle] = true;
            result.push(muscle);
          }
        }
      }
    }

    return result;
  }

  /**
   * _getMusclesForDay(dayType, dayIndex, S, CF_WODS) — helper interne
   * Retourne les muscles sollicités pour un jour donné du calendrier.
   * @param {string} dayType  'crossfit'|'musculation'|'repos'|string
   * @param {number} dayIndex 0-6
   * @param {Object} S        settings utilisateur
   * @param {Array}  CF_WODS  tableau de WODs CrossFit
   * @returns {string[]}
   */
  function _getMusclesForDay(dayType, dayIndex, S, CF_WODS) {
    if (!dayType || typeof dayType !== 'string') { return []; }
    var type = dayType.toLowerCase().trim();

    if (type === 'repos' || type === 'rest') { return []; }

    if (type === 'crossfit' || type === 'wod') {
      // Chercher le WOD correspondant au dayIndex dans CF_WODS
      if (!CF_WODS || !Array.isArray(CF_WODS)) { return []; }
      var wod = null;
      var i;
      for (i = 0; i < CF_WODS.length; i++) {
        // dayIndex 0=Lundi … 6=Dimanche, day dans les WODs est 1-based
        if (CF_WODS[i] && CF_WODS[i].day === (dayIndex + 1)) {
          wod = CF_WODS[i];
          break;
        }
      }
      if (!wod) {
        // Fallback : WOD générique CrossFit sollicite tout
        return ['epaules', 'quadriceps', 'core', 'lombaires', 'dos'];
      }
      var movements = [];
      if (wod.wod && Array.isArray(wod.wod.movements)) {
        movements = wod.wod.movements;
      }
      return getMusclesForWOD(movements);
    }

    if (type === 'musculation' || type === 'muscu') {
      if (!S || typeof S !== 'object') { return []; }
      // Chercher le programme du jour dans S.program ou S.musculationDays
      var programDay = null;
      if (S.musculationDays && Array.isArray(S.musculationDays)) {
        var j;
        for (j = 0; j < S.musculationDays.length; j++) {
          if (S.musculationDays[j] && S.musculationDays[j].day === dayIndex) {
            programDay = S.musculationDays[j];
            break;
          }
        }
      }
      if (programDay) {
        return getMusclesForMuscuDay(programDay, S);
      }
      // Fallback : musculation générique
      return ['pectoraux', 'dos', 'epaules', 'quadriceps'];
    }

    return [];
  }

  /**
   * _getMaxRecovery(muscles) — retourne la fenêtre de récupération max (heures)
   * @param {string[]} muscles
   * @returns {number}
   */
  function _getMaxRecovery(muscles) {
    if (!muscles || !Array.isArray(muscles) || muscles.length === 0) { return 0; }
    var max = 0;
    var i, h;
    for (i = 0; i < muscles.length; i++) {
      h = RECOVERY_WINDOWS[muscles[i]];
      if (typeof h === 'number' && h > max) { max = h; }
    }
    return max;
  }

  /**
   * _intersect(arr1, arr2) — retourne les éléments communs
   * @param {string[]} arr1
   * @param {string[]} arr2
   * @returns {string[]}
   */
  function _intersect(arr1, arr2) {
    if (!arr1 || !arr2) { return []; }
    var result = [];
    var lookup = {};
    var i;
    for (i = 0; i < arr2.length; i++) { lookup[arr2[i]] = true; }
    for (i = 0; i < arr1.length; i++) {
      if (lookup[arr1[i]]) { result.push(arr1[i]); }
    }
    return result;
  }

  /**
   * detectConflicts(weeklyCalendar, S, CF_WODS)
   * → [{dayIndex, nextDayIndex, muscles, recoveryNeeded, recoveryAvailable, severity}]
   *
   * weeklyCalendar: {0: 'crossfit', 1: 'musculation', 2: 'repos', ...} (0=Lundi, 6=Dimanche)
   * severity: 'critique' si heures dispo < 50% du besoin, sinon 'attention'
   * Vérifie J+1 et J+2 pour chaque jour d'entraînement.
   * Guard: retourne [] si données manquantes ou invalides.
   *
   * @param {Object} weeklyCalendar
   * @param {Object} S
   * @param {Array}  CF_WODS
   * @returns {Array}
   */
  function detectConflicts(weeklyCalendar, S, CF_WODS) {
    // Guards
    if (!weeklyCalendar || typeof weeklyCalendar !== 'object') { return []; }

    try {
      var conflicts = [];
      var days = [0, 1, 2, 3, 4, 5, 6];
      var i, j, offset, dayIndex, nextDayIndex;
      var dayType, nextType;
      var muscles1, muscles2;
      var shared, recoveryNeeded, recoveryAvailable, severity;

      for (i = 0; i < days.length; i++) {
        dayIndex = days[i];
        dayType = weeklyCalendar[dayIndex];

        // Ignorer les jours de repos ou non définis
        if (!dayType || typeof dayType !== 'string') { continue; }
        if (dayType.toLowerCase().trim() === 'repos' || dayType.toLowerCase().trim() === 'rest') {
          continue;
        }

        // Muscles sollicités jour J
        muscles1 = [];
        try {
          muscles1 = _getMusclesForDay(dayType, dayIndex, S, CF_WODS);
        } catch (e) {
          muscles1 = [];
        }
        if (!muscles1 || muscles1.length === 0) { continue; }

        // Vérifier J+1 et J+2
        for (j = 1; j <= 2; j++) {
          offset = (dayIndex + j) % 7;
          nextDayIndex = offset;
          nextType = weeklyCalendar[nextDayIndex];

          if (!nextType || typeof nextType !== 'string') { continue; }
          if (nextType.toLowerCase().trim() === 'repos' || nextType.toLowerCase().trim() === 'rest') {
            continue;
          }

          muscles2 = [];
          try {
            muscles2 = _getMusclesForDay(nextType, nextDayIndex, S, CF_WODS);
          } catch (e) {
            muscles2 = [];
          }
          if (!muscles2 || muscles2.length === 0) { continue; }

          // Muscles en commun
          shared = _intersect(muscles1, muscles2);
          if (shared.length === 0) { continue; }

          // Récupération nécessaire = max recovery window des muscles communs
          recoveryNeeded = _getMaxRecovery(shared);
          if (recoveryNeeded === 0) { continue; }

          // Heures disponibles entre les deux sessions (j jours × 24h)
          recoveryAvailable = j * 24;

          // Sévérité
          if (recoveryAvailable < recoveryNeeded * 0.5) {
            severity = 'critique';
          } else {
            severity = 'attention';
          }

          conflicts.push({
            dayIndex: dayIndex,
            nextDayIndex: nextDayIndex,
            muscles: shared,
            recoveryNeeded: recoveryNeeded,
            recoveryAvailable: recoveryAvailable,
            severity: severity
          });
        }
      }

      return conflicts;
    } catch (err) {
      // Jamais de crash
      return [];
    }
  }

  /* ─────────────────────────────────────────────────────────────
     E. Export global
  ───────────────────────────────────────────────────────────── */
  window.MUSCLE_TAXONOMY = {
    WOD_MOVEMENT_MUSCLE_MAP: WOD_MOVEMENT_MUSCLE_MAP,
    RECOVERY_WINDOWS: RECOVERY_WINDOWS,
    MUSCU_SPLITS: MUSCU_SPLITS,
    getMusclesForWOD: getMusclesForWOD,
    getMusclesForMuscuDay: getMusclesForMuscuDay,
    detectConflicts: detectConflicts
  };

})();
