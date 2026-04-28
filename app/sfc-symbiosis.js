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
    heavy:    { cal: 1.10, carbBoost: 1.25, fatAdjust: 0.92 },   // +10% kcal, +25% glucides
    moderate: { cal: 1.07, carbBoost: 1.15, fatAdjust: 0.96 },   // +7% kcal,  +15% glucides
    light:    { cal: 1.03, carbBoost: 1.05, fatAdjust: 1.00 },   // +3% kcal,  +5%  glucides
    rest:     { cal: 0.90, carbBoost: 0.85, fatAdjust: 1.08 }    // −10% kcal, −15% glucides
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
   * @param {Object[]} exercises  — résultat de sfcBuildMuscuDay
   * @param {string[]} groups     — groupes musculaires du jour
   */
  function notifySession(exercises, groups) {
    var s = global.S;
    if (!s) return;
    s.trainingLoad     = computeTrainingLoad(exercises, groups);
    s.lastSessionGroups = (groups || []).slice();
    s.lastSessionCount  = exercises ? exercises.length : 0;
    // Initialiser la date de départ du programme si absente
    if (!s.sportProgramStart) {
      s.sportProgramStart = new Date().toISOString().slice(0, 10);
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

  // ── API publique ──────────────────────────────────────────────────────────
  global.SFCSymbiosis = {
    computeTrainingLoad: computeTrainingLoad,
    getWeekIndex:        getWeekIndex,
    getLoadMultipliers:  getLoadMultipliers,
    getFeedbackAdjustment: getFeedbackAdjustment,
    notifySession:       notifySession,
    getPeriodizationInfo: getPeriodizationInfo,
    LOAD_MULTIPLIERS:    LOAD_MULTIPLIERS
  };

})(typeof window !== 'undefined' ? window : this);
