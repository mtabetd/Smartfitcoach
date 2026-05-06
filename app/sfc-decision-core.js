'use strict';
/**
 * sfc-decision-core.js — Moteur décisionnel central SmartFitCoach
 *
 * Point de vérité unique remplaçant V1/V2/V3 fragmentés.
 *
 * ARCHITECTURE :
 *   buildInputContext()          ← collecte tout l'état de window.S + SFCSymbiosis
 *       ↓
 *   decideDailyPlanV3(v3Inputs) ← moteur adaptatif (pure, déterministe)
 *       ↓
 *   _nutritionToTrainingSignal() ← nutrition → volume/intensité training
 *   _trainingToNutritionSignal() ← training load → cal/carb/protéine
 *   _computeRecoveryConstraint() ← règle 48h récupération musculaire
 *       ↓
 *   _mergeDecision()             ← fusion cohérente de tous les signaux
 *       ↓
 *   window.S._decisionCore       ← cache 5 min, lu par dashboard + générateurs
 *
 * GARANTIES :
 *   · Non-destructif : si non chargé, tout l'existant reste intact.
 *   · Dégradation gracieuse : chaque dépendance externe est optionnelle.
 *   · Déterministe : même contexte → même décision.
 *   · Rollback : retirer le fichier du bundle = retour à l'état initial.
 *
 * SOURCES SCIENTIFIQUES :
 *   · 48h récupération : ACSM 2009 Position Stand (Resistance Exercise)
 *   · Carb cycling : Helms 2014 + ISSN 2023 Position Stand
 *   · Déficit calorique + volume : Barakat 2020 (Int J Exerc Sci)
 *   · Protéines récupération : Morton 2018 meta-analysis (BJSM)
 */
;(function (root) {

  // ─── Helpers internes ─────────────────────────────────────────────────────────

  function _S()   { return root.S   || {}; }
  function _sym() { return root.SFCSymbiosis || null; }
  function _now() { return new Date(); }

  // Niveau de fatigue 1-5 depuis RPE de la dernière séance feedback
  function _deriveFatigueLevel() {
    var fb = _S().sessionFeedback;
    if (!fb || typeof fb.rpe !== 'number') return 3;
    var rpe = fb.rpe;
    if (rpe >= 9) return 5;
    if (rpe >= 7) return 4;
    if (rpe >= 5) return 3;
    if (rpe >= 3) return 2;
    return 1;
  }

  // Dernières 3 intensités de séance depuis muscuSessionLog / customSessionHistory
  function _getLast3Intensity() {
    var S = _S();
    var hist = S.muscuSessionLog || S.customSessionHistory || {};
    var keys = Object.keys(hist).sort().slice(-3);
    return keys.map(function(k) {
      var sess = hist[k];
      if (!sess) return 'moderate';
      var rpe = (sess.feedback && typeof sess.feedback.rpe === 'number')
        ? sess.feedback.rpe : 5;
      if (rpe >= 8) return 'high';
      if (rpe >= 5) return 'moderate';
      return 'low';
    });
  }

  // Jours écoulés depuis la dernière séance
  function _daysSinceLast() {
    var S = _S();
    if (!S.lastSessionDate) return 7; // présume reposé si inconnu
    var last  = new Date(S.lastSessionDate);
    var today = _now();
    return Math.max(0, Math.floor((today - last) / 86400000));
  }

  // Phase de périodisation courante → phase V3
  function _getTrainingPhase() {
    var sym = _sym();
    if (!sym || !sym.getWeekIndex || !sym.getPeriodizationCfg) return 'base';
    try {
      var cfg = sym.getPeriodizationCfg(sym.getWeekIndex());
      if (!cfg) return 'base';
      var map = { hypertrophy: 'build', strength: 'peak', deload: 'taper', base: 'base' };
      return map[cfg.name] || 'base';
    } catch(e) { return 'base'; }
  }

  // Fréquence d'entraînement hebdomadaire (jours sélectionnés ou sportDays)
  function _trainingFreq() {
    var S = _S();
    if (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length > 0)
      return S.trainingDaysSelected.length;
    return typeof S.sportDays === 'number' ? S.sportDays : 4;
  }

  // Déficit calorique estimé (négatif = déficit, positif = surplus)
  function _calorieDeficit() {
    var nm = _S()._nm;
    if (!nm || !nm.caloriesTarget || !nm.tdee) return 0;
    return nm.caloriesTarget - nm.tdee;
  }

  // Adéquation protéique : ratio logged/target (1.0 = objectif atteint)
  function _proteinAdequacy() {
    var nm = _S()._nm;
    if (!nm || !nm.proteinGrams || nm.proteinGrams <= 0) return 1.0;
    var logged = 0;
    try {
      if (root.FOOD_JOURNAL && root.FOOD_JOURNAL.getDayTotal) {
        var t = root.FOOD_JOURNAL.getDayTotal();
        logged = (t && typeof t.p === 'number') ? t.p : 0;
      }
    } catch(e) {}
    if (logged <= 0) return 1.0; // pas de données → hypothèse favorable
    return logged / nm.proteinGrams;
  }

  // ─── Signal nutrition → training ─────────────────────────────────────────────
  // Sources : Barakat 2020 ; Helms 2014 — déficit agressif réduit volume tolérable.

  function _nutritionToTrainingSignal(calDeficit, proteinAdequacy, fatigueLevel) {
    var sig = { volumeModifier: 1.0, intensityModifier: 1.0, reasons: [] };

    // Déficit agressif (>500 kcal) : volume −20%, intensité −12%
    if (calDeficit < -500) {
      sig.volumeModifier    = 0.80;
      sig.intensityModifier = 0.88;
      sig.reasons.push('déficit_calorique_agressif');
    } else if (calDeficit < -300) {
      sig.volumeModifier    = 0.90;
      sig.intensityModifier = 0.95;
      sig.reasons.push('déficit_modéré');
    }

    // Protéines insuffisantes (<75% objectif) : intensité réduite (MPS compromis)
    if (proteinAdequacy < 0.75) {
      sig.intensityModifier = Math.min(sig.intensityModifier, 0.80);
      sig.reasons.push('protéines_insuffisantes');
    } else if (proteinAdequacy < 0.90) {
      sig.intensityModifier = Math.min(sig.intensityModifier, 0.92);
      sig.reasons.push('protéines_limites');
    }

    // Combinaison fatigue haute + déficit → protection max
    if (fatigueLevel >= 4 && calDeficit < -200) {
      sig.volumeModifier = Math.min(sig.volumeModifier, 0.75);
      sig.reasons.push('fatigue_haute_déficit_combiné');
    }

    return sig;
  }

  // ─── Signal training → nutrition ─────────────────────────────────────────────
  // Sources : ISSN 2023 (carb timing) ; Helms 2014 (carb cycling) ; Morton 2018

  function _trainingToNutritionSignal(trainingLoad, fatigueLevel, lastGroups, daysSince) {
    var calMults  = { heavy: 1.12, moderate: 1.06, light: 1.02, rest: 0.88 };
    var carbBoost = { heavy: 1.25, moderate: 1.12, light: 1.05, rest: 0.85 };

    var sig = {
      calMultiplier: calMults[trainingLoad]  || 1.0,
      carbBoost:     carbBoost[trainingLoad] || 1.0,
      proteinBoost:  1.0,
      reasons:       []
    };

    // Fatigue haute → boost protéines pour récupération (Morton 2018)
    if (fatigueLevel >= 4) {
      sig.proteinBoost = 1.12;
      sig.reasons.push('récupération_protéines');
    }

    // Lendemain de séance heavy → maintenir protéines, glucides sans bonus
    if (daysSince === 1 && lastGroups.length > 0) {
      sig.proteinBoost = Math.max(sig.proteinBoost, 1.08);
      sig.carbBoost    = Math.min(sig.carbBoost, 1.0);
      sig.reasons.push('récupération_j+1');
    }

    return sig;
  }

  // ─── Contrainte de récupération 48h ──────────────────────────────────────────
  // Source : ACSM 2009 Position Stand on Resistance Exercise

  function _computeRecoveryConstraint(lastGroups, daysSince) {
    if (daysSince < 2 && Array.isArray(lastGroups) && lastGroups.length > 0) {
      return {
        blockedGroups: lastGroups,
        suggestRest:   daysSince < 1,
        reason:        'récupération_48h_même_groupe'
      };
    }
    return { blockedGroups: [], suggestRest: false, reason: null };
  }

  // ─── Détection décharge automatique ──────────────────────────────────────────

  function _detectDeload(fatigueLevel) {
    var last3 = _getLast3Intensity();
    var highCount = last3.filter(function(i) { return i === 'high'; }).length;

    if (fatigueLevel >= 5) return { needed: true, reason: 'fatigue_maximale' };
    if (highCount >= 3)    return { needed: true, reason: '3_séances_haute_intensité_consécutives' };

    // Cycle 4 semaines → semaine 4 = décharge
    try {
      var sym = _sym();
      if (sym && sym.getWeekIndex) {
        var wk = sym.getWeekIndex();
        if (wk > 0 && (wk % 4 === 0)) return { needed: true, reason: 'décharge_4_semaines' };
      }
    } catch(e) {}

    return { needed: false, reason: null };
  }

  // ─── Fusion des signaux ───────────────────────────────────────────────────────

  function _mergeDecision(baseV3, nutritionMod, trainingMod, recovery, v3Inputs) {
    var decision    = (baseV3 && baseV3.decision)                  || 'train';
    var intensity   = (baseV3 && baseV3.recommendedIntensity)      || 'moderate';
    var sessionType = (baseV3 && baseV3.recommendedSessionType)     || 'strength';
    var coaching    = (baseV3 && (baseV3.coachingMessage || baseV3.reason)) || '';

    // Contrainte récupération 48h — priorité maximale
    if (recovery.suggestRest) {
      decision    = 'rest';
      intensity   = 'low';
      sessionType = 'recovery';
    }

    // Modulation nutrition → intensité
    if (decision !== 'rest') {
      if (nutritionMod.intensityModifier < 0.82 && intensity === 'high') {
        intensity = 'moderate';
      } else if (nutritionMod.intensityModifier < 0.75) {
        intensity = 'low';
      }
    }

    // Volume modifier final (nutrition + déload)
    var volumeMod = nutritionMod.volumeModifier;
    var deload    = _detectDeload(v3Inputs.fatigueLevel || 3);
    if (deload.needed) {
      volumeMod = Math.min(volumeMod, 0.60);
      intensity = 'low';
    }

    return {
      // ── Décision training ──
      decision:             decision,
      recommendedIntensity: intensity,
      recommendedSessionType: sessionType,
      volumeModifier:       volumeMod,
      blockedMuscleGroups:  recovery.blockedGroups,
      deload:               deload,

      // ── Signaux nutrition ──
      nutrition: {
        calMultiplier: trainingMod.calMultiplier,
        carbBoost:     trainingMod.carbBoost,
        proteinBoost:  trainingMod.proteinBoost
      },

      // ── Meta ──
      reasons:        [].concat(
        nutritionMod.reasons,
        trainingMod.reasons,
        recovery.reason ? [recovery.reason] : [],
        deload.reason   ? [deload.reason]   : []
      ),
      coachingMessage: coaching,
      _v3:             baseV3,
      _timestamp:      Date.now()
    };
  }

  // ─── API publique ─────────────────────────────────────────────────────────────

  /**
   * Construit le contexte d'entrée complet depuis window.S + SFCSymbiosis.
   * Exposé pour tests unitaires.
   */
  function buildInputContext() {
    var S          = _S();
    var fatigueLevel   = _deriveFatigueLevel();
    var daysSince      = _daysSinceLast();
    var trainingLoad   = S.trainingLoad || 'moderate';
    var lastGroups     = S.lastSessionGroups || [];
    var calDeficit     = _calorieDeficit();
    var proteinAdeq    = _proteinAdequacy();
    var freq           = _trainingFreq();
    var phase          = _getTrainingPhase();
    var last3          = _getLast3Intensity();
    var lastSessionDate = S.lastSessionDate || null;

    return {
      profile: {
        goal:      S.goal || 'maintain',
        sex:       S.sex,
        weight:    S.weight,
        sportType: S.sportType,
        sportDays: freq
      },
      fatigue: {
        level:        fatigueLevel,
        sleepQuality: S.sleepQuality || 3,
        daysSince:    daysSince,
        rpe:          (S.sessionFeedback && S.sessionFeedback.rpe) || null
      },
      training: {
        load:         trainingLoad,
        lastGroups:   lastGroups,
        lastSessionDate: lastSessionDate,
        last3Intensity: last3,
        phase:        phase,
        frequency:    freq
      },
      nutrition: {
        macros:          S._nm || null,
        calorieDeficit:  calDeficit,
        proteinAdequacy: proteinAdeq,
        tdee:            S._nm ? S._nm.tdee : null
      }
    };
  }

  /**
   * Calcule la décision quotidienne et la cache dans S._decisionCore.
   * Appelé par getDecision() si le cache est périmé (>5 min).
   */
  function decide() {
    var ctx = buildInputContext();
    var S   = _S();

    // V3 inputs — tolérant aux champs manquants
    var v3Inputs = {
      fatigueLevel:          ctx.fatigue.level,
      sleepQuality:          ctx.fatigue.sleepQuality,
      lastSessionDate:       ctx.training.lastSessionDate || new Date().toISOString(),
      goal:                  ctx.profile.goal,
      trainingFrequency:     ctx.training.frequency,
      trainingPhase:         ctx.training.phase,
      last3SessionsIntensity: ctx.training.last3Intensity
    };

    // Décision de base via V3 (dégradation vers V2 → V1 si absent)
    var baseV3 = null;
    try {
      if (typeof root.decideDailyPlanV3 === 'function') {
        baseV3 = root.decideDailyPlanV3(v3Inputs);
      } else if (typeof root.decideDailyPlanV2 === 'function') {
        baseV3 = root.decideDailyPlanV2(v3Inputs);
      } else if (typeof root.decideDailyPlan === 'function') {
        baseV3 = root.decideDailyPlan(v3Inputs);
      }
    } catch(e) {}

    // Signaux bidirectionnels
    var nutritionMod = _nutritionToTrainingSignal(
      ctx.nutrition.calorieDeficit,
      ctx.nutrition.proteinAdequacy,
      ctx.fatigue.level
    );
    var trainingMod = _trainingToNutritionSignal(
      ctx.training.load,
      ctx.fatigue.level,
      ctx.training.lastGroups,
      ctx.fatigue.daysSince
    );
    var recovery = _computeRecoveryConstraint(
      ctx.training.lastGroups,
      ctx.fatigue.daysSince
    );

    var result = _mergeDecision(baseV3, nutritionMod, trainingMod, recovery, v3Inputs);

    // Mise en cache
    if (S) S._decisionCore = result;

    return result;
  }

  /**
   * Retourne la décision courante (depuis cache <5min, sinon recalcul).
   */
  function getDecision() {
    var S = _S();
    var cached = S._decisionCore;
    if (cached && (Date.now() - cached._timestamp) < 300000) return cached;
    return decide();
  }

  /**
   * Multiplicateurs nutritionnels pour aujourd'hui (training → nutrition).
   * Utilisé par getCalorieTarget() dans today-dashboard.js.
   * @returns {{ calMultiplier: number, carbBoost: number, proteinBoost: number }}
   */
  function getNutritionModulators() {
    var d = getDecision();
    return d ? d.nutrition : { calMultiplier: 1.0, carbBoost: 1.0, proteinBoost: 1.0 };
  }

  /**
   * Modificateur de volume training pour aujourd'hui (nutrition → training).
   * Utilisé par buildPersonalizedMuscuPlan() + sfcBuildMuscuDay().
   * @returns {number} facteur multiplicateur [0.6 – 1.0]
   */
  function getVolumeModifier() {
    var d = getDecision();
    return d ? d.volumeModifier : 1.0;
  }

  /**
   * Groupes musculaires actuellement en récupération (<48h).
   * Passé comme contrainte au générateur de programme muscu.
   * @returns {string[]}
   */
  function getBlockedMuscleGroups() {
    var d = getDecision();
    return d ? d.blockedMuscleGroups : [];
  }

  /**
   * Invalide le cache de décision (appeler après séance, changement profil, etc.)
   */
  function invalidate() {
    var S = _S();
    if (S) S._decisionCore = null;
  }

  // ─── Export ───────────────────────────────────────────────────────────────────

  root.SFCDecisionCore = {
    decide:                  decide,
    getDecision:             getDecision,
    buildInputContext:       buildInputContext,
    getNutritionModulators:  getNutritionModulators,
    getVolumeModifier:       getVolumeModifier,
    getBlockedMuscleGroups:  getBlockedMuscleGroups,
    invalidate:              invalidate,
    // Exposés pour tests unitaires
    _nutritionToTrainingSignal:  _nutritionToTrainingSignal,
    _trainingToNutritionSignal:  _trainingToNutritionSignal,
    _computeRecoveryConstraint:  _computeRecoveryConstraint,
    _deriveFatigueLevel:         _deriveFatigueLevel,
    _calorieDeficit:             _calorieDeficit,
    _proteinAdequacy:            _proteinAdequacy
  };

})(typeof window !== 'undefined' ? window : global);
