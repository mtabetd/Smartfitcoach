/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// nutrition-master.js — NutritionMaster : source de vérité nutritionnelle unique
// Fonctions pures, sans effet de bord, aucune valeur hardcodée hors constantes nommées.
// Produit un USER_STATE strict, typé, cohérent et exploitable par les modules recettes/budget.
(function () {
  'use strict';

  // ─── CONSTANTES ───────────────────────────────────────────────────────────────
  var GOAL_ADJUSTMENTS = {
    bulk:          +0.15,
    lean_bulk:     +0.10,  // Prise de masse douce — ISSN 2023 : surplus modéré préserve le ratio masse maigre/grasse
    maintain:      +0.00,
    recomposition: +0.00,  // Recomposition corporelle : calorie neutre (Barakat 2020, NSCA) — mult=1.00 comme maintain
    cut:           -0.15,
    // ACSM 2009 / Helms 2014 : déficit max -500 kcal/j pour préserver la masse maigre.
    // -0.20 (vs -0.25) est un plafond plus sûr ; calcCaloriesTarget applique en plus
    // le cap 500 kcal/j via la contrainte Math.max(tdee-500, floor).
    shred:         -0.20
  };

  // PROT_DEFAULT : valeur médiane ISSN Position Stand 2023 pour non-élite en résistance
  // ISSN 2023 : 1.4-2.0 g/kg (force/muscu non-élite) — 1.8 = milieu de fourchette
  // 2.2 g/kg correspond à l'UPPER BOUND pour sportifs intensifs/sèche, pas au défaut général
  var PROT_DEFAULT_MALE   = 1.8;  // g/kg — ISSN Position Stand 2023 (non-élite résistance)
  var PROT_DEFAULT_FEMALE = 1.6;  // g/kg — Tarnopolsky 2000 : femmes ~11% moins (oestrogène anti-catabolique)
  var PROT_ELITE_MALE     = 2.2;  // g/kg — ISSN 2023 upper / Morton 2018 BJSM meta-analysis
  var PROT_ELITE_FEMALE   = 2.0;  // g/kg — Morton 2018 BJSM

  var FAT_MIN_PER_KG      = 0.8;  // g/kg minimum absolu (ISSN 2021 — santé hormonale)

  var CARB_CYCLING_BOOST  = 0.20; // +20% glucides les jours d'entraînement

  var KCAL_PER_PROT       = 4;    // kcal/g protéines
  var KCAL_PER_CARB       = 4;    // kcal/g glucides
  var KCAL_PER_FAT        = 9;    // kcal/g lipides

  var VALID_GENDERS = { male: true, female: true };
  var VALID_GOALS   = { bulk: true, lean_bulk: true, maintain: true, recomposition: true, cut: true, shred: true };

  // ─── FONCTIONS PURES ──────────────────────────────────────────────────────────

  /**
   * Calcule le Métabolisme Basal (BMR) via Mifflin-St Jeor.
   * @param {'male'|'female'} gender
   * @param {number} weightKg
   * @param {number} heightCm
   * @param {number} age
   * @returns {number} BMR en kcal/j (entier)
   */
  function calcBMR(gender, weightKg, heightCm, age) {
    var base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(gender === 'male' ? base + 5 : base - 161);
  }

  /**
   * Calcule la Dépense Énergétique Totale (TDEE).
   * @param {number} bmr
   * @param {number} activityLevel  PAL (ex: 1.2, 1.375, 1.55, 1.725, 1.9)
   * @returns {number} TDEE en kcal/j (entier)
   */
  function calcTDEE(bmr, activityLevel) {
    return Math.round(bmr * activityLevel);
  }

  var KCAL_FLOOR_MALE          = 1500; // ACSM — plancher physiologique masculin (cohérent avec app-core.js calcTarget)
  var KCAL_FLOOR_FEMALE        = 1400; // ISSN 2017 / ACSM 2016 — plancher universel femme (l'ancien 1200 est obsolète)
  var KCAL_FLOOR_FEMALE_ACTIVE = 1400; // ACSM / IOC 2018 — plancher femme sportive (RED-S prevention)
  // Seuil d'activité : PAL ≥ 1.375 (légèrement actif, ≥1x/semaine) → plancher 1400 kcal
  var ACTIVITY_THRESHOLD_ACTIVE = 1.375;

  /**
   * Ajuste les calories selon l'objectif.
   * Garantie : résultat >= max(bmr, plancher sexe-spécifique ACSM, tdee-500 kcal si déficit).
   * Le cap -500 kcal/j (ACSM 2009, Helms 2014) prévient la perte de masse maigre.
   * @param {number} tdee
   * @param {'bulk'|'maintain'|'cut'|'shred'} goal
   * @param {number} bmr          Plancher BMR
   * @param {'male'|'female'} gender  Nécessaire pour plancher sexe-spécifique
   * @param {number} [activityLevel]  PAL — utilisé pour plancher femme sportive (RED-S)
   * @returns {number} caloriesTarget (entier)
   */
  function calcCaloriesTarget(tdee, goal, bmr, gender, activityLevel) {
    var adjusted  = Math.round(tdee * (1 + (GOAL_ADJUSTMENTS[goal] || 0)));
    // Plancher féminin : 1400 kcal/j (ISSN 2017 / ACSM 2016 — plancher universel, l'ancien 1200 est obsolète)
    var kcalFloor;
    if (gender === 'male') {
      kcalFloor = KCAL_FLOOR_MALE;
    } else {
      kcalFloor = (activityLevel && activityLevel >= ACTIVITY_THRESHOLD_ACTIVE)
        ? KCAL_FLOOR_FEMALE_ACTIVE
        : KCAL_FLOOR_FEMALE;
    }
    // Cap déficit à -500 kcal/j (ACSM 2009, Helms 2014) pour objectifs coupe/sèche
    // Math.max ignore deficitCap si objectif non-déficitaire (maintain/bulk)
    var isDeficit = goal === 'cut' || goal === 'shred';
    if (isDeficit) {
      var deficitCap = Math.round(tdee - 500);
      return Math.max(adjusted, bmr, kcalFloor, deficitCap);
    }
    return Math.max(adjusted, bmr, kcalFloor);
  }

  /**
   * Calcule les grammes de protéines selon le genre et le niveau élite.
   * @param {'male'|'female'} gender
   * @param {boolean} isElite
   * @param {number} weightKg
   * @returns {number} proteinGrams (1 décimale)
   */
  function calcProtein(gender, isElite, weightKg) {
    var perKg = gender === 'male'
      ? (isElite ? PROT_ELITE_MALE   : PROT_DEFAULT_MALE)
      : (isElite ? PROT_ELITE_FEMALE : PROT_DEFAULT_FEMALE);
    return Math.round(perKg * weightKg * 10) / 10;
  }

  /**
   * Calcule les grammes de lipides (plancher 0.8g/kg).
   * @param {number} weightKg
   * @returns {number} fatGrams (1 décimale)
   */
  function calcFat(weightKg) {
    return Math.round(FAT_MIN_PER_KG * weightKg * 10) / 10;
  }

  /**
   * Calcule les grammes de glucides : calories restantes après P et L.
   * @param {number} caloriesTarget
   * @param {number} proteinGrams
   * @param {number} fatGrams
   * @returns {number} carbsGrams (1 décimale)
   */
  function calcCarbs(caloriesTarget, proteinGrams, fatGrams) {
    var remaining = caloriesTarget - (proteinGrams * KCAL_PER_PROT + fatGrams * KCAL_PER_FAT);
    // IOM 2005 minimum: 130g/day for brain function. Only applied when caloric room allows it.
    var carbs = Math.max(0, remaining / KCAL_PER_CARB);
    if (carbs < 130) carbs = 130; // IOM 2005: 130g/day minimum regardless of caloric budget
    return Math.round(carbs * 10) / 10;
  }

  /**
   * Applique le Carb Cycling (jours d'entraînement : +20% glucides).
   * Recalcule les calories finales. Si résultat < plancher (max(bmr, sexe)), remonte au plancher et ajuste G.
   * @param {number} carbsGrams
   * @param {number} proteinGrams
   * @param {number} fatGrams
   * @param {number} bmr
   * @param {'male'|'female'} gender  Nécessaire pour plancher sexe-spécifique ACSM
   * @returns {{ carbsGrams: number, caloriesTarget: number, clampedToBMR: boolean }}
   */
  function applyCarbCycling(carbsGrams, proteinGrams, fatGrams, bmr, gender) {
    var boostedCarbs = Math.round(carbsGrams * (1 + CARB_CYCLING_BOOST) * 10) / 10;
    var newCalories  = Math.round(
      proteinGrams * KCAL_PER_PROT +
      fatGrams     * KCAL_PER_FAT  +
      boostedCarbs * KCAL_PER_CARB
    );

    var kcalFloor = Math.max(bmr, gender === 'male' ? KCAL_FLOOR_MALE : KCAL_FLOOR_FEMALE);

    if (newCalories >= kcalFloor) {
      return { carbsGrams: boostedCarbs, caloriesTarget: newCalories, clampedToBMR: false };
    }

    // Sécurité : remonter au plancher, ajuster G en conséquence
    var carbsAtFloor = Math.round(
      Math.max(0, (kcalFloor - proteinGrams * KCAL_PER_PROT - fatGrams * KCAL_PER_FAT) / KCAL_PER_CARB) * 10
    ) / 10;
    return { carbsGrams: carbsAtFloor, caloriesTarget: kcalFloor, clampedToBMR: true };
  }

  // ─── VALIDATION ───────────────────────────────────────────────────────────────

  function validateInputs(inputs) {
    var errors = [];
    if (!VALID_GENDERS[inputs.gender])           errors.push('gender invalide : ' + inputs.gender);
    if (!VALID_GOALS[inputs.goal])               errors.push('goal invalide : ' + inputs.goal);
    if (!(inputs.age > 0 && inputs.age < 120))   errors.push('age invalide : ' + inputs.age);
    if (!(inputs.weightKg > 0 && inputs.weightKg < 500)) errors.push('weightKg invalide : ' + inputs.weightKg);
    if (!(inputs.heightCm > 0 && inputs.heightCm < 300)) errors.push('heightCm invalide : ' + inputs.heightCm);
    if (!(inputs.activityLevel >= 1 && inputs.activityLevel <= 2.5)) errors.push('activityLevel invalide : ' + inputs.activityLevel);
    return errors;
  }

  // ─── API PUBLIQUE ──────────────────────────────────────────────────────────────

  /**
   * Calcule et retourne le USER_STATE complet.
   *
   * @param {{
   *   age: number,
   *   gender: 'male'|'female',
   *   weightKg: number,
   *   heightCm: number,
   *   activityLevel: number,
   *   goal: 'cut'|'maintenance'|'lean_bulk'|'mass_gain',
   *   isElite: boolean,
   *   trainingDay: boolean
   * }} inputs
   *
   * @returns {{
   *   inputs: object,
   *   bmr: number,
   *   tdee: number,
   *   caloriesTarget: number,
   *   proteinGrams: number,
   *   fatGrams: number,
   *   carbsGrams: number,
   *   caloriesCheck: number,
   *   carbCyclingApplied: boolean,
   *   clampedToBMR: boolean,
   *   errors: string[],
   *   timingAdvice: { postWorkoutProtein: number, preWorkoutCarbs: number, electrolytesNeeded: boolean }
   * }}
   */
  function compute(inputs) {
    var errors = validateInputs(inputs);
    if (errors.length > 0) {
      return { inputs: inputs, errors: errors,
               bmr: 0, tdee: 0, caloriesTarget: 0,
               proteinGrams: 0, fatGrams: 0, carbsGrams: 0,
               caloriesCheck: 0, carbCyclingApplied: false, clampedToBMR: false };
    }

    var bmr = calcBMR(inputs.gender, inputs.weightKg, inputs.heightCm, inputs.age);
    var tdee = calcTDEE(bmr, inputs.activityLevel);
    var caloriesTarget = calcCaloriesTarget(tdee, inputs.goal, bmr, inputs.gender, inputs.activityLevel);

    var proteinGrams = calcProtein(inputs.gender, inputs.isElite, inputs.weightKg);
    var fatGrams     = calcFat(inputs.weightKg);
    var carbsGrams   = calcCarbs(caloriesTarget, proteinGrams, fatGrams);

    var carbCyclingApplied = false;
    var clampedToBMR       = false;

    if (inputs.trainingDay) {
      var cycled = applyCarbCycling(carbsGrams, proteinGrams, fatGrams, bmr, inputs.gender);
      carbsGrams         = cycled.carbsGrams;
      caloriesTarget     = cycled.caloriesTarget;
      clampedToBMR       = cycled.clampedToBMR;
      carbCyclingApplied = true;
    }

    // Vérification cohérence calorique : P×4 + G×4 + L×9
    var caloriesCheck = Math.round(
      proteinGrams * KCAL_PER_PROT +
      fatGrams     * KCAL_PER_FAT  +
      carbsGrams   * KCAL_PER_CARB
    );

    // ─── TIMING NUTRITIONNEL SPORTIF ────────────────────────────────────────────
    // Fenêtre anabolique post-entraînement : 20-40g protéines dans les 2h
    // (Moore et al. Am J Clin Nutr 2009 ; Churchward-Venne et al. 2012)
    // Pré-entraînement : glucides IG modéré 30-80g, 2-3h avant
    // (Jeukendrup & Killer, Ann Nutr Metab 2010)
    var postWorkoutProtein = Math.round(Math.min(40, Math.max(20, proteinGrams * 0.20)));
    var preWorkoutCarbs    = Math.round(Math.min(80, Math.max(30, carbsGrams   * 0.25)));

    return {
      inputs:             inputs,
      bmr:                bmr,
      tdee:               tdee,
      caloriesTarget:     caloriesTarget,
      proteinGrams:       proteinGrams,
      fatGrams:           fatGrams,
      carbsGrams:         carbsGrams,
      caloriesCheck:      caloriesCheck,
      carbCyclingApplied: carbCyclingApplied,
      clampedToBMR:       clampedToBMR,
      errors:             [],
      // Timing nutritionnel exposé pour l'UI (Moore et al. AJCN 2009 ; Jeukendrup & Killer 2010)
      timingAdvice: {
        postWorkoutProtein: postWorkoutProtein, // g — 0-2h après séance
        preWorkoutCarbs:    preWorkoutCarbs,    // g — 2-3h avant séance
        electrolytesNeeded: inputs.trainingDay && inputs.activityLevel >= 1.725
      }
    };
  }

  // ─── EXPOSITION GLOBALE ────────────────────────────────────────────────────────
  window.NutritionMaster = {
    compute:         compute,
    // Fonctions pures exposées pour tests unitaires
    calcBMR:         calcBMR,
    calcTDEE:        calcTDEE,
    calcCaloriesTarget: calcCaloriesTarget,
    calcProtein:     calcProtein,
    calcFat:         calcFat,
    calcCarbs:       calcCarbs,
    applyCarbCycling: applyCarbCycling
  };

})();
