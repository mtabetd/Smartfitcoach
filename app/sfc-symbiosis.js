/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/**
 * sfc-symbiosis.js — Pont Training ↔ Nutrition
 *
 * Couche optionnelle non-destructive. Si non chargée, tout le comportement
 * existant reste inchangé (aucune dépendance dans les autres modules).
 *
 * Fonctionnalités :
 *  1. Périodisation 4 semaines — weekIndex (1→4) passé à muscu-engine.js
 *  2. Bridge trainingLoad — signal "heavy/moderate/light" injecté dans S
 *  3. Adaptation nutritionnelle dynamique — calMultiplier par charge
 *  4. Timing nutritionnel — carbBoost pré/post séance
 *  5. Feedback loop — ajustements si fatigue / stagnation / récupération
 */
;(function (global) {
  'use strict';

  // ── Constantes ────────────────────────────────────────────────────────────

  // Multiplicateurs caloriques et glucides par charge d'entraînement
  // Sources : Helms 2014 (calorie cycling) | ISSN 2023 (carb timing) | Burke 2011
  var LOAD_MULTIPLIERS = {
    heavy:    { cal: 1.10, carbBoost: 1.20, fatAdjust: 0.92 },   // +10% kcal, +20% glucides
    moderate: { cal: 1.07, carbBoost: 1.10, fatAdjust: 0.96 },   // +7% kcal,  +10% glucides
    light:    { cal: 1.03, carbBoost: 1.00, fatAdjust: 1.00 },   // +3% kcal,  base glucides
    rest:     { cal: 0.90, carbBoost: 0.90, fatAdjust: 1.08 }    // −10% kcal, −10% glucides
  };

  // Groupes musculaires "lourds" — mobilisent les grandes chaînes
  var HEAVY_GROUPS = ['legs', 'glutes', 'back', 'chest'];

  // ── 1. Calcul trainingLoad ─────────────────────────────────────────────────
  /**
   * Détermine la charge d'une séance depuis la liste d'exercices générés.
   * heavy   = ≥6 exercices + groupe lourd + ≥4 composés
   * light   = ≤3 exercices OU pas de groupe lourd
   * moderate = tout le reste
   */
  function computeTrainingLoad(exercises, groups) {
    if (!exercises || !exercises.length) return 'light';
    var hasHeavy = (groups || []).some(function (g) {
      return HEAVY_GROUPS.indexOf(g) !== -1;
    });
    var compCount = exercises.filter(function (ex) {
      var tg = ex.tags || [];
      return tg.indexOf('isolation') === -1 && tg.indexOf('finisher') === -1;
    }).length;
    if (exercises.length >= 6 && hasHeavy && compCount >= 4) return 'heavy';
    if (exercises.length <= 3 || !hasHeavy) return 'light';
    return 'moderate';
  }

  // ── 2. Semaine courante dans le cycle 4 semaines ──────────────────────────
  /**
   * Retourne 1, 2, 3 ou 4 selon le nombre de semaines écoulées depuis
   * S.sportProgramStart. Cycle infini : semaine 5 → retour en semaine 1.
   * Si pas de date de départ → 1 (semaine de base, comportement inchangé).
   */
  function getWeekIndex() {
    var s = global.S;
    if (!s || !s.sportProgramStart) return 1;
    var start = new Date(s.sportProgramStart);
    if (isNaN(start.getTime())) return 1;
    var diffDays = Math.floor((Date.now() - start.getTime()) / 86400000);
    var weekNum  = Math.floor(diffDays / 7) + 1;            // 1-based
    return ((weekNum - 1) % 4) + 1;                         // normalize → 1-4
  }

  // ── 3. Multiplicateurs nutrition ──────────────────────────────────────────
  /**
   * @param {boolean} isTraining
   * @param {string}  trainingLoad  — 'heavy'|'moderate'|'light'
   * @returns {{ cal, carbBoost, fatAdjust }}
   */
  function getLoadMultipliers(isTraining, trainingLoad) {
    if (!isTraining) return LOAD_MULTIPLIERS.rest;
    return LOAD_MULTIPLIERS[trainingLoad] || LOAD_MULTIPLIERS.moderate;
  }

  // ── 4. Feedback loop ──────────────────────────────────────────────────────
  /**
   * Analyse les 5 dernières séances (S.sessionFeedback) et retourne des
   * ajustements nutritionnels légers.
   *
   * Règles (conservative — plafond ±10% pour éviter les oscillations) :
   *   RPE moyen ≥ 8     → fatigue     → +5% kcal + 5% glucides
   *   feeling moyen ≤ 2 → récupération → +3% kcal + +5% lipides
   *   Sinon : 0
   *
   * @returns {{ calAdjust: number, carbAdjust: number, fatAdjust: number, reason: string|null }}
   */
  function getFeedbackAdjustment() {
    var s = global.S;
    var empty = { calAdjust: 0, carbAdjust: 0, fatAdjust: 0, reason: null };
    if (!s || !s.sessionFeedback) return empty;

    var entries;
    try {
      entries = Object.values
        ? Object.values(s.sessionFeedback)
        : Object.keys(s.sessionFeedback).map(function (k) { return s.sessionFeedback[k]; });
    } catch (_) { return empty; }

    if (!entries.length) return empty;

    // 5 dernières séances (les plus récentes en fin d'objet si clés ISO)
    var recent = entries.slice(-5);
    var n = recent.length;

    var sumRpe     = 0, sumFeeling = 0;
    recent.forEach(function (e) {
      sumRpe     += (typeof e.rpe     === 'number') ? e.rpe     : 5;
      sumFeeling += (typeof e.feeling === 'number') ? e.feeling : 3;
    });
    var avgRpe     = sumRpe     / n;
    var avgFeeling = sumFeeling / n;

    if (avgRpe >= 8) {
      // Fatigue accumulée : calories + glucides
      return { calAdjust: 0.05, carbAdjust: 0.05, fatAdjust: 0, reason: 'fatigue' };
    }
    if (avgFeeling <= 2) {
      // Mauvaise récupération : légère hausse calorique + lipides (hormones, inflammation)
      return { calAdjust: 0.03, carbAdjust: 0, fatAdjust: 0.05, reason: 'recovery' };
    }

    return empty;
  }

  // ── 5. Notification de session (appelé depuis app-sport.js) ───────────────
  /**
   * Met à jour S.trainingLoad et S.sportProgramStart après chaque génération.
   *
   * Merge strategy — chaque champ obéit à une règle précise :
   *   trainingLoad     → MAX(existant, calculé) — jamais de dégradation silencieuse
   *   lastSessionGroups → union (accumulation) — plusieurs sports dans la même journée
   *   lastSessionCount  → cumul              — idem
   *   sportProgramStart → seulement si absent (inchangé)
   *   trainingWeekContext → fusion par clé date (updateWeekContext)
   *
   * @param {Object[]} exercises  — exercices de la séance
   * @param {string[]} groups     — groupes musculaires du jour
   */
  function notifySession(exercises, groups) {
    var s = global.S;
    if (!s) return;
    // Zero-exercise sessions (equipment filter left pool empty) must not count as training days
    if (!exercises || !exercises.length) return;

    // ── trainingLoad : MAX(existant, calculé) — jamais de dégradation ────────
    var RANK = { light: 0, moderate: 1, heavy: 2 };
    var computedLoad  = computeTrainingLoad(exercises, groups);
    var existingLoad  = s.dailyTrainingLoad || s.trainingLoad;
    var existingRank  = typeof RANK[existingLoad]  === 'number' ? RANK[existingLoad]  : -1;
    var computedRank  = typeof RANK[computedLoad]  === 'number' ? RANK[computedLoad]  :  0;

    if (existingRank === -1) {
      // Rien de défini → utiliser la valeur calculée
      s.trainingLoad = computedLoad;
    } else if (computedRank > existingRank) {
      // La nouvelle séance est plus intense → mettre à jour (max wins)
      s.trainingLoad      = computedLoad;
      s.dailyTrainingLoad = computedLoad;
    }
    // Sinon : valeur existante supérieure ou égale → pas de surécrasement

    // ── lastSessionGroups : union (accumulation multi-sport) ─────────────────
    var incomingGroups = (groups || []).slice();
    if (Array.isArray(s.lastSessionGroups) && s.lastSessionGroups.length > 0) {
      var mergedGroups = s.lastSessionGroups.slice();
      incomingGroups.forEach(function(g) {
        if (mergedGroups.indexOf(g) === -1) mergedGroups.push(g);
      });
      s.lastSessionGroups = mergedGroups;
    } else {
      s.lastSessionGroups = incomingGroups;
    }

    // ── lastSessionCount : cumul journalier (reset chaque nouveau jour) ──────
    var incomingCount = exercises ? exercises.length : 0;
    var _today = new Date().toISOString().slice(0, 10);
    var _prevDate = s.lastSessionDate;
    if (_prevDate && _prevDate !== _today) {
      // New calendar day — start fresh
      s.lastSessionCount = incomingCount;
      s.lastSessionDate  = _today;
    } else {
      // Same day (or first-ever call: _prevDate is falsy) — accumulate
      s.lastSessionCount = (typeof s.lastSessionCount === 'number' ? s.lastSessionCount : 0) + incomingCount;
      s.lastSessionDate  = _today;
    }

    // ── sportProgramStart : seulement si absent ───────────────────────────────
    if (!s.sportProgramStart) {
      s.sportProgramStart = new Date().toISOString().slice(0, 10);
    }

    // ── trainingWeekContext : fusion par date (updateWeekContext) ─────────────
    // Passer lastSessionGroups (merged) pour refléter tous les sports du jour
    var today = new Date().toISOString().slice(0, 10);
    updateWeekContext(today, s.lastSessionGroups, s.trainingLoad, exercises);

    // Recompute nutrition immediately so carb cycling reflects this session.
    // computeNutritionState only reads S and writes S._nm — it never calls render.
    if (s.appMode !== 'sport' && typeof window.computeNutritionState === 'function') {
      try { window.computeNutritionState(true); } catch (_e) {}
    }
  }

  // ── 6. Résumé périodisation (informatif pour l'UI) ────────────────────────
  /**
   * Retourne un libellé de la semaine courante pour affichage éventuel.
   * @param {number} weekIndex  — 1, 2, 3 ou 4
   * @returns {{ label: string, description: string }}
   */
  function getPeriodizationInfo(weekIndex) {
    var wi = ((weekIndex - 1) % 4) + 1;
    var MAP = {
      1: { label: 'S1 — Volume base',    description: 'Séances de référence, construction du volume.' },
      2: { label: 'S2 — Volume ↑',       description: '+1 série sur les composés principaux.' },
      3: { label: 'S3 — Intensité ↑',    description: 'Reps réduites, charges plus lourdes à prévoir.' },
      4: { label: 'S4 — Deload',         description: 'Volume réduit, récupération active.' }
    };
    return MAP[wi] || MAP[1];
  }

  // ── 7. Configuration de périodisation complète ───────────────────────────
  /**
   * Retourne les modificateurs complets pour chaque semaine du cycle 4 semaines.
   * Utilisé par sfcBuildMuscuDay (via custom-session.js et app-sport.js)
   * pour adapter durMax, durSets et restOverride selon la phase.
   *
   * S1 — Volume base    : durMax 6, durSets 4, repos standard
   * S2 — Volume ↑       : durMax 6, durSets 4 (step 8 +1 série composés)
   * S3 — Intensité ↑    : durMax 5, durSets 5, repos ↑ (plus lourd, moins d'exos)
   * S4 — Deload actif   : durMax 4, durSets 3, repos court (récupération active)
   *
   * @param {number} weekIndex — 1, 2, 3 ou 4
   * @returns {{ durMax, durSets, restOverride, note }}
   */
  var PERIODIZATION_CFG = {
    1: { durMax: 6, durSets: 4, restOverride: null,      note: 'S1 — Volume base' },
    2: { durMax: 6, durSets: 4, restOverride: null,      note: 'S2 — Volume ↑ (+1 série composés)' },
    3: { durMax: 5, durSets: 5, restOverride: '120-180s', note: 'S3 — Intensité ↑ — charges lourdes' },
    4: { durMax: 4, durSets: 3, restOverride: '60s',     note: 'S4 — Deload actif' }
  };

  function getPeriodizationCfg(weekIndex) {
    var wi = ((weekIndex - 1) % 4) + 1;
    return Object.assign({}, PERIODIZATION_CFG[wi] || PERIODIZATION_CFG[1]);
  }

  // ── 8. État nutritionnel → impact volume entraînement ────────────────────
  /**
   * Lit S.goal (objectif nutrition) et S._nm (macros calculées) pour
   * déterminer si l'utilisateur est en déficit, surplus ou équilibre.
   * Retourne un volumeFactor appliqué au durMax de la séance.
   *
   * Logique :
   *   shred/cut fort → réduction volume (préserver masse musculaire en déficit)
   *   bulk/lean_bulk → autoriser volume ↑ (surplus = récupération facilitée)
   *   neutral/recompo → léger ajustement
   *
   * Sources : Helms 2014 (muscle retention in deficit) | Barakat 2020 (recomp)
   *
   * @returns {{ state: string, volumeFactor: number, note: string|null }}
   */
  function getNutritionState() {
    var s = global.S;
    var neutral = { state: 'neutral', volumeFactor: 1.0, note: null };
    if (!s) return neutral;

    var goalKey = '';
    if (s.goal !== null && s.goal !== undefined) {
      var GOALS = (global.window && global.window.GOALS) ? global.window.GOALS : (global.GOALS || null);
      if (GOALS && GOALS[s.goal]) goalKey = GOALS[s.goal].key || '';
    }

    // Déficit fort (objectif shred = sèche agressive)
    if (goalKey === 'shred') {
      return {
        state:        'deficit_strong',
        volumeFactor: 0.80,
        note:         'Sèche — volume réduit pour préserver la masse musculaire.'
      };
    }
    // Déficit modéré (cut = perte de poids progressive)
    if (goalKey === 'cut') {
      return {
        state:        'deficit',
        volumeFactor: 0.88,
        note:         'Déficit modéré — volume légèrement réduit.'
      };
    }
    // Surplus calorique
    if (goalKey === 'bulk' || goalKey === 'lean_bulk') {
      return {
        state:        'surplus',
        volumeFactor: 1.08,
        note:         'Surplus — volume et intensité maximisés pour la croissance musculaire.'
      };
    }
    // Recomposition : légère réduction pour privilégier qualité sur quantité
    if (goalKey === 'recomposition') {
      return { state: 'neutral', volumeFactor: 0.95, note: null };
    }

    return neutral;
  }

  // ── 9. Score de fatigue accumulée ─────────────────────────────────────────
  /**
   * Évalue la fatigue à partir de :
   *   - RPE moyen des 5 dernières séances (sessionFeedback)
   *   - Fréquence d'entraînement sur 7 jours (muscuSessionLog + customSessionHistory)
   *   - Recommandation deload existante (shouldRecommendMuscuDeload)
   *
   * Retourne un cycleFactor (0.6-1.0) et un niveau sémantique.
   *
   * Sources : Fry & Kraemer 1997 (overtraining markers) | Meeusen 2013 (ECSS)
   *
   * @returns {{ level: string, cycleFactor: number, restRecommended: boolean, note: string|null }}
   */
  function getFatigueScore() {
    var s = global.S;
    var fresh = { level: 'fresh', cycleFactor: 1.0, restRecommended: false, note: null };
    if (!s) return fresh;

    // 1. Fréquence : jours avec activité sur les 7 derniers
    var trainingDays7 = 0;
    var customH = Array.isArray(s.customSessionHistory) ? s.customSessionHistory : [];
    for (var i = 1; i <= 7; i++) {
      var dt = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      var hasMuscu  = s.muscuSessionLog && s.muscuSessionLog[dt] && Object.keys(s.muscuSessionLog[dt]).length > 0;
      var hasFree   = customH.some(function (h) { return h.date === dt; });
      if (hasMuscu || hasFree) trainingDays7++;
    }

    // 2. RPE moyen — 5 dernières séances
    var avgRpe = 5;
    if (s.sessionFeedback && typeof s.sessionFeedback === 'object') {
      var fbKeys = Object.keys(s.sessionFeedback).sort().slice(-5);
      var rpeVals = fbKeys
        .map(function (k) { return s.sessionFeedback[k].rpe; })
        .filter(function (v) { return typeof v === 'number' && v >= 1 && v <= 10; });
      if (rpeVals.length > 0) {
        avgRpe = rpeVals.reduce(function (a, b) { return a + b; }, 0) / rpeVals.length;
      }
    }

    // 3. Deload recommandé par l'algorithme existant
    var deloadFn = global.window && typeof global.window.shouldRecommendMuscuDeload === 'function'
      ? global.window.shouldRecommendMuscuDeload
      : (typeof global.shouldRecommendMuscuDeload === 'function' ? global.shouldRecommendMuscuDeload : null);
    var deloadNeeded = deloadFn ? deloadFn() : false;

    // Surcharge : deload requis ou RPE très élevé ou >5j/semaine
    if (deloadNeeded || avgRpe >= 8.5 || trainingDays7 >= 6) {
      var overNote = deloadNeeded
        ? 'Surcharge détectée — deload recommandé (RPE chronique élevé).'
        : (avgRpe >= 8.5
          ? 'RPE moyen ' + Math.round(avgRpe * 10) / 10 + ' — volume réduit pour récupérer.'
          : trainingDays7 + ' séances cette semaine — récupération prioritaire.');
      return { level: 'overtrained', cycleFactor: 0.60, restRecommended: true, note: overNote };
    }
    // Fatigue légère
    if (avgRpe >= 7.5 || trainingDays7 >= 5) {
      var tireNote = avgRpe >= 7.5
        ? 'Fatigue légère (RPE moy. ' + Math.round(avgRpe * 10) / 10 + ') — volume modéré.'
        : trainingDays7 + ' séances cette semaine — volume maintenu, attention au repos.';
      return { level: 'tired', cycleFactor: 0.80, restRecommended: false, note: tireNote };
    }
    // Normal
    if (trainingDays7 >= 3) {
      return { level: 'normal', cycleFactor: 0.95, restRecommended: false, note: null };
    }
    // Frais : peu d'activité ou RPE bas
    return fresh;
  }

  // ── 10. Contexte de la semaine ────────────────────────────────────────────
  /**
   * Enregistre la séance du jour dans S.trainingWeekContext.
   * Permet aux séances libres de signaler leur activité aux modules voisins
   * (programme structuré, recommandations, fatigue).
   *
   * @param {string}   date      — 'YYYY-MM-DD'
   * @param {string[]} groups    — groupes musculaires entraînés
   * @param {string}   load      — 'heavy'|'moderate'|'light'
   * @param {Object[]} exercises — liste exercices (pour count)
   */
  function updateWeekContext(date, groups, load, exercises) {
    var s = global.S;
    if (!s) return;
    if (!s.trainingWeekContext || typeof s.trainingWeekContext !== 'object') {
      s.trainingWeekContext = {};
    }
    s.trainingWeekContext[date] = {
      groups:   (groups || []).slice(),
      load:     load || 'moderate',
      exCount:  exercises ? exercises.length : 0,
      updatedAt: new Date().toISOString()
    };
    // Conserver seulement les 14 derniers jours
    var ctxKeys = Object.keys(s.trainingWeekContext).sort();
    if (ctxKeys.length > 14) {
      ctxKeys.slice(0, ctxKeys.length - 14).forEach(function (k) {
        delete s.trainingWeekContext[k];
      });
    }
  }

  // ── API publique ──────────────────────────────────────────────────────────
  global.SFCSymbiosis = {
    computeTrainingLoad:   computeTrainingLoad,
    getWeekIndex:          getWeekIndex,
    getLoadMultipliers:    getLoadMultipliers,
    getFeedbackAdjustment: getFeedbackAdjustment,
    notifySession:         notifySession,
    getPeriodizationInfo:  getPeriodizationInfo,
    getPeriodizationCfg:   getPeriodizationCfg,
    getNutritionState:     getNutritionState,
    getFatigueScore:       getFatigueScore,
    updateWeekContext:     updateWeekContext,
    LOAD_MULTIPLIERS:      LOAD_MULTIPLIERS,
    PERIODIZATION_CFG:     PERIODIZATION_CFG
  };

})(typeof window !== 'undefined' ? window : this);
