/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */

/**
 * sfc-sport-intelligence.js — Sport Nutrition Intelligence Engine v2.0
 *
 * PURELY ADDITIVE module. Non-destructive by design.
 * If this file fails to load, the app works exactly as before.
 * No external dependencies beyond window.S (optional) and window.SFCSymbiosis (optional).
 *
 * Scientific sources:
 *   - ISSN 2023 : Stout et al., "International Society of Sports Nutrition Position Stand"
 *   - Burke 2011 : Burke LM, "Carbohydrates for Training and Competition", J Sports Sci
 *   - Helms 2014 : Helms ER et al., "Evidence-based recommendations for natural bodybuilding"
 *   - Thomas 2016 : Thomas DT et al., "Nutrition and Athletic Performance", AND/ACSM/DC
 *   - Gonzalez-Alonso 2010 : "Muscle glycogen depletion during exercise", J Physiol
 *   - Simopoulos 2002 : "Omega-3 fatty acids and anti-inflammatory effects", Biomed Pharmacother
 *   - Fry & Kraemer 1997 : "Resistance exercise overtraining and overreaching", Sports Med
 *   - Meeusen 2013 : "Prevention, diagnosis and treatment of the overtraining syndrome", ECSS
 *   - WHO 2010 : "Global recommendations on physical activity for health"
 *
 * Public API: window.SFCSportIntelligence
 *   SPORT_PROFILES        — per-sport nutrition constants
 *   FATIGUE_TIERS         — fatigue-level multipliers
 *   getSportRecipeBonus   — recipe scoring adjustment by sport (used by pickRecipe)
 *   getHydrationTarget    — daily water target in ml
 *   getConsecutiveFatigue — fatigue level from 14-day training context
 *   getFullSportContext   — master entry point: full sport nutrition context object
 *   VERSION               — '2.0'
 */
;(function (global) {
  'use strict';

  // ── 1. SPORT_PROFILES ──────────────────────────────────────────────────────
  //
  // Evidence-based per-sport nutrition constants.
  //
  // Naming conventions:
  //   calAdjust    — calorie multiplier on training day vs TDEE (1.0 = no change)
  //   carbBoost    — carb quantity multiplier on training day
  //   fatAdjust    — fat multiplier on training day (< 1 = reduce to make room for carbs)
  //   protBoost    — protein multiplier on training day
  //   restCarb     — carb multiplier on rest day (< 1 = reduce; endurance sports recover via carbs)
  //   restFat      — fat multiplier on rest day
  //   hydrationExtra — extra ml water per kg bodyweight per training session (beyond WHO base 35ml/kg)
  //
  // Sources:
  //   musculation  : Helms 2014 (1.6-2.4g/kg protein); ISSN 2023 (protein, carb cycling)
  //   crossfit     : NSCA CrossFit position 2012; ISSN 2023 (carb+protein post-WOD dual demand)
  //   hyrox        : Gonzalez-Alonso 2010 (muscle glycogen); practical Hyrox elite athlete protocols
  //   running      : Burke 2011; Thomas 2016 (AND/ACSM position stand, carbohydrate periodisation)
  //   triathlon    : Thomas 2016 (multi-discipline endurance, highest CHO demand)
  //   cycling      : Burke 2011 (glycogen-dominant endurance)
  //   calisthenics : ISSN 2023 (relative strength, body-composition focus)
  //   padel        : intermittent court sport — moderate CHO need (Fernandez-Fernandez 2011)
  //   yoga         : Simopoulos 2002 (omega-3 anti-inflammatory priority); WHO 2010 (low demand)
  //   golf         : walk-dominant low-intensity; minimal caloric adjustment (Stevenson 2019)

  var SPORT_PROFILES = {

    /**
     * Musculation / Resistance Training
     * Priority: high protein for MPS (muscle protein synthesis), moderate CHO for glycogen support.
     * Source: Helms 2014, ISSN 2023 position stand on protein and resistance exercise.
     */
    musculation: {
      loadTier:         'strength-heavy',
      calAdjust:        1.10,   // +10% kcal on training day (Helms 2014)
      carbBoost:        1.15,   // +15% CHO — glycogen for compound lifts (ISSN 2023)
      fatAdjust:        0.92,   // −8% fat — room for carbs, maintains >0.8g/kg floor (ISSN 2021)
      protBoost:        1.10,   // +10% protein — MPS window (Helms 2014: 1.6–2.4g/kg range)
      restCarb:         0.85,   // −15% CHO on rest days (carb cycling, Helms 2014)
      restFat:          1.05,   // slight fat increase on rest day (hormonal support, Volek 2006)
      hydrationExtra:   5,      // 5 ml/kg extra per session (ACSM 2007 sweat rate resistance)
      recipePrefs: {
        trainingDay:    { minProtPct: 0.35, minCarbPct: 0.25, bonus: -120 },
        restDay:        { minProtPct: 0.30, minCarbPct: 0.20, bonus: -80  }
      },
      electrolytes:     false,  // resistance training: sweat loss moderate, not critical
      digestiveWarning: false,
      periodization:    true    // 4-week periodization cycle supported (Helms 2014)
    },

    /**
     * CrossFit — Metabolic Conditioning + Strength Hybrid
     * Dual demand: high CHO for glycolytic WODs AND high protein for structural repair.
     * Source: NSCA CrossFit position 2012; ISSN 2023 carb+protein post-WOD.
     * Note: digestiveWarning=true — heavy GI meals pre-WOD severely impair performance.
     */
    crossfit: {
      loadTier:         'crossfit-heavy',
      calAdjust:        1.13,   // +13% kcal (high-intensity metabolic demand)
      carbBoost:        1.25,   // +25% CHO — glycolytic pathway primary (ISSN 2023)
      fatAdjust:        0.88,   // −12% fat — significant reduction to accommodate dual CHO+PRO
      protBoost:        1.08,   // +8% protein — structural repair, high eccentric load
      restCarb:         0.88,   // −12% CHO on rest (still higher than strength, muscle repair active)
      restFat:          1.05,   // slight fat increase for recovery (anti-inflammatory)
      hydrationExtra:   8,      // 8 ml/kg — intense sweat; electrolyte loss significant (Casa 2000)
      recipePrefs: {
        trainingDay:    { minProtPct: 0.28, minCarbPct: 0.35, bonus: -180 },  // BOTH required
        restDay:        { minProtPct: 0.30, minCarbPct: 0.35, bonus: -100 }   // glycogen + repair
      },
      electrolytes:     true,   // mandatory — sweat electrolyte loss (sodium, potassium critical)
      digestiveWarning: true,   // heavy GI meals pre-WOD cause performance drop (Thomas 2016)
      periodization:    true    // periodized CrossFit mesocycles well-documented
    },

    /**
     * Hyrox — Running + Gym Hybrid Endurance Race
     * Endurance-dominant: 8×1km running intervals + 8 functional gym stations.
     * CHO is the primary fuel; protein for structural recovery post-race.
     * Source: Gonzalez-Alonso 2010; practical Hyrox elite protocols (2022-2024).
     */
    hyrox: {
      loadTier:         'hyrox-heavy',
      calAdjust:        1.12,   // +12% kcal — sustained high-output effort (>60 min typically)
      carbBoost:        1.30,   // +30% CHO — highest relative CHO need of hybrid sports
      fatAdjust:        0.90,   // −10% fat — space for CHO; fat oxidation secondary at race pace
      protBoost:        1.05,   // +5% protein — structural repair, moderate vs pure endurance
      restCarb:         0.90,   // −10% CHO rest day (still replenish, not full cut)
      restFat:          1.05,   // slight fat increase rest day
      hydrationExtra:   10,     // 10 ml/kg — very high sweat rate (running + gym in warm conditions)
      recipePrefs: {
        trainingDay:    { minProtPct: 0.20, minCarbPct: 0.45, bonus: -120 },  // carb-dominant
        restDay:        { minProtPct: 0.30, minCarbPct: 0.35, bonus: -100 }   // recovery protein
      },
      electrolytes:     true,   // critical — long duration + running heat dissipation
      digestiveWarning: true,   // race-day pre-event nutrition timing is critical
      periodization:    true    // structured 4-week build/taper cycles
    },

    /**
     * Running — Endurance Running (road, trail, track)
     * CHO-dominant fuel system. Glycogen preservation + replenishment are primary nutrition goals.
     * Source: Burke 2011; Thomas 2016 AND/ACSM position stand.
     * Note: post-long-run rest day still benefits from elevated CHO (glycogen resynthesis 24-48h).
     */
    running: {
      loadTier:         'running-heavy',
      calAdjust:        1.08,   // +8% kcal — depends on distance (moderate for easy days)
      carbBoost:        1.20,   // +20% CHO — glycogen-sparing critical (Burke 2011)
      fatAdjust:        0.92,   // −8% fat — CHO priority on quality sessions
      protBoost:        1.02,   // +2% protein — minimal increase (running is CHO-dominant)
      restCarb:         0.90,   // −10% CHO rest day, but post-long-run stays elevated
      restFat:          1.05,   // slight fat increase rest day (hormonal, anti-inflammatory)
      hydrationExtra:   8,      // 8 ml/kg — sweat rate 0.5–1.5 L/h in running (Sawka 2007)
      recipePrefs: {
        trainingDay:    { minProtPct: 0.18, minCarbPct: 0.48, bonus: -120 },  // carb-dominant
        restDay:        { minProtPct: 0.22, minCarbPct: 0.40, bonus: -80  }   // glycogen replenishment
      },
      electrolytes:     true,   // sodium loss significant in runs >60 min (Sawka 2007)
      digestiveWarning: false,  // pre-run meals: familiar foods only (Thomas 2016); warning handled per-slot
      periodization:    true    // periodized running plans (Daniels periodization model)
    },

    /**
     * Triathlon — Multi-Discipline Endurance (swim + bike + run)
     * Highest overall CHO demand of all endurance sports. Long training blocks require
     * sustained glycogen availability across three disciplines.
     * Source: Thomas 2016; Burke 2011.
     */
    triathlon: {
      loadTier:         'running-heavy',  // uses running-heavy tier (highest endurance tier)
      calAdjust:        1.14,   // +14% kcal — multi-discipline cumulative demand
      carbBoost:        1.35,   // +35% CHO — highest CHO need; 8-12g/kg on race days (Thomas 2016)
      fatAdjust:        0.88,   // −12% fat — maximise CHO fuel availability
      protBoost:        1.03,   // +3% protein — moderate; CHO still dominates
      restCarb:         0.92,   // −8% CHO on rest (still elevated for multi-day recovery)
      restFat:          1.05,
      hydrationExtra:   12,     // 12 ml/kg — highest hydration demand (swim+bike+run)
      recipePrefs: {
        trainingDay:    { minProtPct: 0.18, minCarbPct: 0.50, bonus: -130 },
        restDay:        { minProtPct: 0.22, minCarbPct: 0.42, bonus: -90  }
      },
      electrolytes:     true,   // critical across all three disciplines
      digestiveWarning: true,   // transition nutrition timing is a key performance lever
      periodization:    true    // classic triathlon periodization (base → build → peak → race)
    },

    /**
     * Cycling — Road/MTB/Indoor Cycling
     * Glycogen-dominant endurance; fat oxidation plays a role on long easy rides.
     * Similar to running but slightly lower protein (less musculoskeletal impact).
     * Source: Burke 2011; Jeukendrup 2011 (race nutrition timing).
     */
    cycling: {
      loadTier:         'running-moderate', // moderate default; computed dynamically at runtime
      calAdjust:        1.10,   // +10% kcal — sustained aerobic output
      carbBoost:        1.28,   // +28% CHO — glycogen critical for intensity efforts
      fatAdjust:        0.92,   // −8% fat — CHO priority on training days
      protBoost:        1.02,   // +2% protein — low impact → less structural damage
      restCarb:         0.90,
      restFat:          1.05,
      hydrationExtra:   8,      // 8 ml/kg — 500-1500ml/h sweat rate (Jeukendrup 2011)
      recipePrefs: {
        trainingDay:    { minProtPct: 0.18, minCarbPct: 0.50, bonus: -110 },
        restDay:        { minProtPct: 0.22, minCarbPct: 0.40, bonus: -80  }
      },
      electrolytes:     true,   // sodium/potassium replacement on rides >90 min
      digestiveWarning: false,
      periodization:    true    // 4-week training blocks standard in cycling
    },

    /**
     * Calisthenics — Bodyweight Strength Training
     * Balanced strength + relative strength (power-to-weight ratio matters).
     * Protein for hypertrophy, moderate CHO for skill/strength sessions.
     * Source: ISSN 2023 (body-composition); Helms 2014 (protein for natural training).
     */
    calisthenics: {
      loadTier:         'strength-heavy',
      calAdjust:        1.07,   // +7% kcal — lower than barbell training (bodyweight = lower absolute load)
      carbBoost:        1.10,   // +10% CHO — moderate; skill-dependent sessions need glycogen
      fatAdjust:        0.95,   // −5% fat — modest reduction for CHO space
      protBoost:        1.06,   // +6% protein — hypertrophy + tendon health (collagen synthesis)
      restCarb:         0.88,   // −12% CHO rest (lean body composition priority)
      restFat:          1.05,
      hydrationExtra:   5,      // 5 ml/kg — moderate sweat rate
      recipePrefs: {
        trainingDay:    { minProtPct: 0.32, minCarbPct: 0.30, bonus: -100 },  // balanced
        restDay:        { minProtPct: 0.30, minCarbPct: 0.25, bonus: -70  }
      },
      electrolytes:     false,  // indoor bodyweight training; sweat loss moderate
      digestiveWarning: false,
      periodization:    true    // skill+strength blocks follow similar periodization to musculation
    },

    /**
     * Padel — Intermittent Court Sport
     * Repeated sprint + recovery pattern. Moderate CHO need (glycolytic bursts).
     * Light structural demand; mainly cardiovascular + agility.
     * Source: Fernandez-Fernandez 2011 (padel energy demands); ISSN 2023.
     */
    padel: {
      loadTier:         'running-moderate', // intermittent moderate intensity
      calAdjust:        1.05,   // +5% kcal — intermittent, total volume moderate
      carbBoost:        1.08,   // +8% CHO — brief glycolytic bursts, modest need
      fatAdjust:        0.97,   // −3% fat — slight CHO priority
      protBoost:        1.03,   // +3% protein — racket sports: shoulder/wrist tendon health
      restCarb:         0.92,
      restFat:          1.03,
      hydrationExtra:   6,      // 6 ml/kg — court sport in warm conditions
      recipePrefs: {
        trainingDay:    { minProtPct: 0.25, minCarbPct: 0.35, bonus: -80  },
        restDay:        { minProtPct: 0.25, minCarbPct: 0.30, bonus: -60  }
      },
      electrolytes:     true,   // sweating during match play; sodium loss relevant
      digestiveWarning: false,
      periodization:    false   // recreational/competitive padel: no formal periodization required
    },

    /**
     * Yoga — Mind-Body Practice (Hatha, Vinyasa, Yin, etc.)
     * Minimal caloric demand. Fat priority: omega-3 (anti-inflammatory), hormonal support.
     * Protein for mobility/flexibility: collagen synthesis (Baar 2017).
     * Source: Simopoulos 2002 (omega-3); WHO 2010; Baar 2017 (collagen).
     */
    yoga: {
      loadTier:         'mobility-light',
      calAdjust:        1.01,   // +1% kcal — negligible additional demand
      carbBoost:        0.98,   // −2% CHO — minimal glycolytic activity
      fatAdjust:        1.05,   // +5% fat — omega-3 priority (anti-inflammatory, Simopoulos 2002)
      protBoost:        1.02,   // +2% protein — collagen synthesis for joint mobility (Baar 2017)
      restCarb:         0.95,   // −5% CHO rest (low-demand sport, no depletion)
      restFat:          1.08,   // higher fat on rest day (omega-3 anti-inflammatory priority)
      hydrationExtra:   3,      // 3 ml/kg — low sweat rate (mild exertion)
      recipePrefs: {
        trainingDay:    { minProtPct: 0.20, minCarbPct: 0.25, bonus: -60  },  // fat-forward
        restDay:        { minProtPct: 0.20, minCarbPct: 0.22, bonus: -50  }   // anti-inflammatory
      },
      electrolytes:     false,  // negligible electrolyte loss in yoga practice
      digestiveWarning: false,
      periodization:    false   // yoga does not follow periodization cycles
    },

    /**
     * Golf — Walking + Precision Sport
     * Very low metabolic demand (primarily walking). Minimal caloric adjustment.
     * Cognitive focus: stable blood glucose matters more than macronutrient cycling.
     * Source: Stevenson 2019 (golf energy demands); ISSN 2023.
     */
    golf: {
      loadTier:         'mobility-light',
      calAdjust:        1.02,   // +2% kcal — walking distance only (4-8km per 18 holes)
      carbBoost:        1.00,   // no CHO boost — low glycolytic demand
      fatAdjust:        1.00,   // no fat adjustment
      protBoost:        1.00,   // no protein boost
      restCarb:         1.00,
      restFat:          1.00,
      hydrationExtra:   4,      // 4 ml/kg — sun exposure, prolonged outdoors
      recipePrefs: {
        trainingDay:    { minProtPct: 0.22, minCarbPct: 0.30, bonus: -40  },  // stable glucose
        restDay:        { minProtPct: 0.22, minCarbPct: 0.30, bonus: -30  }
      },
      electrolytes:     false,
      digestiveWarning: false,
      periodization:    false   // golf practice does not require nutritional periodization
    }
  };

  // ── 2. FATIGUE_TIERS ────────────────────────────────────────────────────────
  //
  // Maps fatigue level to training volume factor and caloric adjustment.
  // cycleFactor: applied to training volume/intensity planning (used by muscu-engine)
  // calBoost: additional calorie fraction on top of sport calAdjust (additive)
  //
  // Sources:
  //   Fry & Kraemer 1997 — overtraining markers in resistance training
  //   Meeusen 2013 — ECSS/ACSM overtraining syndrome consensus statement
  //   Hausswirth & Mujika 2013 — "Recovery for Performance in Sport"

  var FATIGUE_TIERS = {
    /** Fresh: recently rested, low recent training volume. Full capacity. */
    fresh:       { cycleFactor: 1.00, calBoost: 0,    note: null },
    /** Normal: regular training without accumulation. Standard adjustments apply. */
    normal:      { cycleFactor: 0.95, calBoost: 0,    note: null },
    /** Tired: fatigue accumulation detected. Reduce load, extra energy for recovery. */
    tired:       { cycleFactor: 0.80, calBoost: 0.05, note: 'Fatigue légère — +5% kcal, récupération prioritaire' },
    /** Overtrained: overreaching / overtraining syndrome markers. Deload strongly recommended. */
    overtrained: { cycleFactor: 0.60, calBoost: 0.08, note: 'Surcharge détectée — deload recommandé' },
    /** Peak: supercompensation phase after deload week. Slightly elevated capacity and appetite. */
    peak:        { cycleFactor: 1.05, calBoost: 0.03, note: 'Pic de forme — maintenir l\'élan' }
  };

  // ── 3. getHydrationTarget ───────────────────────────────────────────────────

  /**
   * Computes the daily water intake target for a given sport and body weight.
   *
   * Formula:
   *   base = 35 ml × weightKg                          (WHO baseline, WHO 2004)
   *   extra = sport-specific extra per training session  (sweat rate data: Sawka 2007, Casa 2000)
   *   cap   = 5000 ml                                   (hyponatraemia risk ceiling, Noakes 2003)
   *
   * Training load tiers for extra calculation:
   *   'heavy'    — highest sweat loss scenario
   *   'moderate' — mid-intensity sessions
   *   'light'    — easy/recovery sessions
   *
   * @param {string} sportType    — sport key (e.g. 'crossfit', 'running', 'yoga')
   * @param {string} trainingLoad — 'heavy'|'moderate'|'light'|'rest'
   * @param {number} weightKg     — body weight in kilograms
   * @returns {{ dailyTarget: number, base: number, extra: number, note: string }}
   */
  function getHydrationTarget(sportType, trainingLoad, weightKg) {
    var wt = (typeof weightKg === 'number' && weightKg > 0) ? weightKg : 70;
    var sport = sportType || 'musculation';
    var load  = trainingLoad || 'moderate';
    var isRest = (load === 'rest');

    // WHO baseline: 35 ml/kg (WHO 2004 Water, Sanitation and Hygiene)
    var base = Math.round(35 * wt);
    var extra = 0;
    var note = null;

    if (!isRest) {
      // Sport-specific hydration extra (ml) — based on sweat rate evidence
      // Sources: Sawka 2007 (ACSM Position Stand on Exercise and Fluid Replacement)
      //          Casa 2000 (fluid replacement for basketball/field sports)
      switch (sport) {
        case 'crossfit':
        case 'hyrox':
          // Very high intensity, often in warm environments; highest sweat rates
          // Base extra 600ml + load tier factor (Gonzalez-Alonso 2010)
          extra = 600;
          if (load === 'heavy')    { extra += 500; }
          else if (load === 'moderate') { extra += 250; }
          note = 'Hydratation critique — électrolytes requis (sodium, potassium)';
          break;

        case 'triathlon':
          // Longest duration; three disciplines compound sweat loss
          extra = 700;
          if (load === 'heavy') { extra += 600; }
          else if (load === 'moderate') { extra += 300; }
          note = 'Multi-discipline — hydratation par segment et en transition';
          break;

        case 'running':
          // Sweat rate 0.5-1.5 L/h at race pace (Sawka 2007)
          extra = 500;
          if (load === 'heavy') { extra += 800; }  // long run / race pace
          else if (load === 'moderate') { extra += 300; }
          note = 'Boire avant la soif — risque déshydratation sur sorties longues';
          break;

        case 'cycling':
          // Outdoor cycling: sun + exertion; indoor: less (Jeukendrup 2011)
          extra = 500;
          if (load === 'heavy') { extra += 600; }
          else if (load === 'moderate') { extra += 300; }
          break;

        case 'yoga':
          // Minimal sweat; but heated yoga (Bikram) would be much higher
          extra = 200;
          if (load === 'heavy') { extra += 100; }
          break;

        case 'padel':
          // Intermittent court sport, often outdoors in warm conditions
          extra = 400;
          if (load === 'heavy') { extra += 200; }
          break;

        case 'golf':
          // Walking in sun; low exertion but prolonged exposure
          extra = 300;
          break;

        default:
          // musculation, calisthenics, and unlisted sports
          extra = 300;
          if (load === 'heavy') { extra += 200; }
          break;
      }
    }

    var dailyTarget = Math.min(base + extra, 5000); // cap 5L (Noakes 2003 hyponatraemia ceiling)

    return {
      dailyTarget: dailyTarget,
      base:        base,
      extra:       extra,
      note:        note
    };
  }

  // ── 4. getSportRecipeBonus ──────────────────────────────────────────────────

  /**
   * Computes a recipe selection bonus (negative = preferred, positive = penalised)
   * based on sport nutrition requirements and whether it is a training or rest day.
   *
   * This function is designed to plug into pickRecipe() as an external scorer.
   * It returns negative values (favouring the recipe) or positive penalty values
   * without breaking the existing scoring range (capped at -200 absolute).
   *
   * The maximum bonus is -200 (hard cap: never exceeds the favourite-recipe bonus).
   *
   * Macro percentages are computed from kcal:
   *   protPct = (p × 4) / k
   *   carbPct = (g × 4) / k
   *   fatPct  = (l × 9) / k
   * where p=protein(g), g=carbs(g), l=fat(g), k=kcal.
   *
   * @param {{ p: number, g: number, l: number, k: number }} recipe — macro/kcal per serving
   * @param {string}  sportType     — sport key (e.g. 'crossfit', 'musculation')
   * @param {boolean} isTrainingDay — true if this is a training day
   * @param {string}  mealSlot      — 'breakfast'|'lunch'|'snack'|'dinner'
   * @returns {number} bonus — negative favours this recipe; positive is a penalty
   *
   * Sources: ISSN 2023 (carbohydrate and protein timing); Thomas 2016 (pre-event nutrition)
   */
  function getSportRecipeBonus(recipe, sportType, isTrainingDay, mealSlot) {
    // Defensive: handle missing or malformed recipe
    if (!recipe || typeof recipe !== 'object') return 0;

    var p = typeof recipe.p === 'number' ? recipe.p : 0;
    var g = typeof recipe.g === 'number' ? recipe.g : 0;
    var l = typeof recipe.l === 'number' ? recipe.l : 0;
    var k = typeof recipe.k === 'number' ? recipe.k : 0;

    // Need valid kcal to compute percentages
    if (k <= 0) return 0;

    var protPct = (p * 4) / k;  // protein % of kcal
    var carbPct = (g * 4) / k;  // carb % of kcal
    var fatPct  = (l * 9) / k;  // fat % of kcal

    var sport  = sportType || '';
    var slot   = mealSlot  || '';
    var isTrain = (isTrainingDay === true);
    var bonus  = 0;

    if (isTrain) {
      // ─── TRAINING DAY bonuses ────────────────────────────────────────────
      switch (sport) {

        case 'musculation':
          // Priority: protein ≥ 35% kcal for MPS (Helms 2014)
          if (protPct >= 0.35) { bonus -= 120; }
          else if (protPct < 0.20) { bonus += 80; }  // penalise low-protein recipes
          break;

        case 'crossfit':
          // Dual demand: BOTH high protein AND high carb (ISSN 2023, NSCA 2012)
          if (protPct >= 0.28 && carbPct >= 0.35) {
            bonus -= 180;  // highest bonus: meets both conditions
          } else if (protPct >= 0.35) {
            bonus -= 100;  // protein-only threshold met
          } else if (carbPct >= 0.48) {
            bonus -= 100;  // carb-only threshold met (high-CHO pre-WOD)
          }
          break;

        case 'hyrox':
          // Endurance-dominant: carb ≥ 45% kcal primary (Gonzalez-Alonso 2010)
          // Breakfast, lunch, snack (pre-training) get extra CHO weight
          if (carbPct >= 0.45) {
            bonus -= 120;
            if (slot === 'breakfast' || slot === 'lunch' || slot === 'snack') {
              bonus -= 30;  // extra pre-training carb prioritisation
            }
          }
          break;

        case 'running':
          // Carb-dominant fuel: ≥ 50% kcal from CHO (Burke 2011)
          // Pre-run breakfast: even higher CHO threshold (Thomas 2016 pre-event meals)
          if (carbPct >= 0.50) {
            bonus -= 120;
          }
          if (slot === 'breakfast' && carbPct >= 0.55) {
            bonus -= 30;  // additional bonus for high-CHO pre-run breakfast
          }
          break;

        case 'triathlon':
          // Highest endurance CHO demand (Thomas 2016)
          if (carbPct >= 0.50) { bonus -= 120; }
          break;

        case 'cycling':
          // Glycogen-dominant: CHO ≥ 50% kcal (Burke 2011, Jeukendrup 2011)
          if (carbPct >= 0.50) { bonus -= 110; }
          break;

        case 'calisthenics':
          // Balanced: protein for hypertrophy, moderate CHO for skill sessions
          if (protPct >= 0.30 && carbPct >= 0.25) { bonus -= 90; }
          else if (protPct >= 0.32) { bonus -= 70; }
          break;

        case 'padel':
          // Moderate CHO for intermittent sprints; moderate protein
          if (carbPct >= 0.35 && protPct >= 0.22) { bonus -= 70; }
          else if (carbPct >= 0.35) { bonus -= 50; }
          break;

        case 'yoga':
          // Fat-forward (omega-3 priority, Simopoulos 2002); light protein
          if (fatPct >= 0.30) { bonus -= 60; }
          break;

        case 'golf':
          // Stable blood glucose: balanced macros; no strong penalty/bonus
          if (carbPct >= 0.30 && carbPct <= 0.50) { bonus -= 40; }
          break;

        default:
          // Unknown sport — no adjustment
          break;
      }

    } else {
      // ─── REST DAY bonuses ────────────────────────────────────────────────
      switch (sport) {

        case 'musculation':
          // Recovery protein for sustained MPS on rest days (Helms 2014: protein every 3-4h)
          if (protPct >= 0.30) { bonus -= 80; }
          break;

        case 'crossfit':
          // Glycogen replenishment + structural repair (ISSN 2023)
          if (protPct >= 0.30 && carbPct >= 0.35) { bonus -= 100; }
          else if (protPct >= 0.30) { bonus -= 60; }
          break;

        case 'hyrox':
        case 'running':
          // Glycogen replenishment remains priority 24-48h post-long effort (Burke 2011)
          if (protPct >= 0.25 && carbPct >= 0.40) { bonus -= 100; }
          else if (carbPct >= 0.40) { bonus -= 60; }
          break;

        case 'triathlon':
          // Multi-discipline recovery: protein + CHO both critical
          if (protPct >= 0.22 && carbPct >= 0.42) { bonus -= 90; }
          break;

        case 'cycling':
          // Glycogen resynthesis post-training (Burke 2011)
          if (carbPct >= 0.40 && protPct >= 0.20) { bonus -= 80; }
          break;

        case 'calisthenics':
          // Lean body composition: keep protein high, moderate CHO
          if (protPct >= 0.30) { bonus -= 70; }
          break;

        case 'padel':
          // Light recovery day: balanced nutrition
          if (protPct >= 0.25) { bonus -= 50; }
          break;

        case 'yoga':
          // Anti-inflammatory priority: omega-3 rich fats (Simopoulos 2002)
          if (fatPct >= 0.30) { bonus -= 60; }
          break;

        case 'golf':
          // Stable blood glucose on rest day; no strong preference
          if (carbPct >= 0.30 && carbPct <= 0.50) { bonus -= 30; }
          break;

        default:
          break;
      }
    }

    // Hard cap: never exceed -200 (favourite-recipe bonus ceiling)
    if (bonus < -200) { bonus = -200; }

    return bonus;
  }

  // ── 5. getConsecutiveFatigue ────────────────────────────────────────────────

  /**
   * Analyses the last 14 days of training context (S.trainingWeekContext)
   * to compute consecutive training and heavy-day streaks, then maps
   * those to a fatigue tier.
   *
   * Fatigue rules (evidence-based thresholds):
   *   consecutiveTrainingDays ≥ 6 → 'overtrained'   (Meeusen 2013: ≥6 days no rest = OTS risk)
   *   consecutiveHeavyDays    ≥ 4 → 'overtrained'   (Fry & Kraemer 1997: 4+ heavy days)
   *   consecutiveTrainingDays ≥ 5 OR consecutiveHeavyDays ≥ 3 → 'tired'
   *   After deload week (0-1 training days in last 7) → 'peak'  (supercompensation, Hausswirth 2013)
   *   consecutiveTrainingDays ≥ 3 → 'normal'
   *   Otherwise → 'fresh'
   *
   * @param {Object|null} weekContext — S.trainingWeekContext: { 'YYYY-MM-DD': { load, exCount } }
   * @returns {{ consecutiveHeavyDays: number, consecutiveTrainingDays: number, fatigueLevel: string }}
   *
   * Sources: Fry & Kraemer 1997; Meeusen 2013; Hausswirth & Mujika 2013
   */
  function getConsecutiveFatigue(weekContext) {
    var ctx = (weekContext && typeof weekContext === 'object') ? weekContext : {};
    var now = Date.now();

    // Build sorted list of date strings for the last 14 days (newest first)
    var i, dateStr, entry;
    var recentDates = [];
    for (i = 0; i < 14; i++) {
      var d = new Date(now - i * 86400000);
      dateStr = d.toISOString().slice(0, 10);
      recentDates.push(dateStr);
    }

    // Count consecutive training days (going back from today)
    var consecutiveTrainingDays = 0;
    var consecutiveHeavyDays    = 0;
    var trainStreakBroken       = false;
    var heavyStreakBroken       = false;
    var trainingDaysLast7       = 0;

    for (i = 0; i < recentDates.length; i++) {
      dateStr = recentDates[i];
      entry   = ctx[dateStr];

      var isTrained = (entry && (entry.exCount > 0 || entry.load === 'heavy' || entry.load === 'moderate' || entry.load === 'light'));
      var isHeavy   = (entry && entry.load === 'heavy');

      // Count last-7-days training (for deload/peak detection)
      if (i < 7 && isTrained) { trainingDaysLast7++; }

      // Consecutive streak from today backwards — stop counting when gap found
      if (!trainStreakBroken) {
        if (isTrained) { consecutiveTrainingDays++; }
        else { trainStreakBroken = true; }
      }
      if (!heavyStreakBroken) {
        if (isHeavy) { consecutiveHeavyDays++; }
        else { heavyStreakBroken = true; }
      }
    }

    // Determine fatigue level
    var fatigueLevel;
    if (consecutiveTrainingDays >= 6 || consecutiveHeavyDays >= 4) {
      fatigueLevel = 'overtrained';
    } else if (consecutiveTrainingDays >= 5 || consecutiveHeavyDays >= 3) {
      fatigueLevel = 'tired';
    } else if (trainingDaysLast7 <= 1) {
      // After deload week (0-1 training day in last 7): supercompensation peak
      // Source: Hausswirth & Mujika 2013 (taper/deload supercompensation)
      fatigueLevel = 'peak';
    } else if (consecutiveTrainingDays >= 3) {
      fatigueLevel = 'normal';
    } else {
      fatigueLevel = 'fresh';
    }

    return {
      consecutiveHeavyDays:    consecutiveHeavyDays,
      consecutiveTrainingDays: consecutiveTrainingDays,
      fatigueLevel:            fatigueLevel
    };
  }

  // ── 6. getFullSportContext ──────────────────────────────────────────────────

  /**
   * Main entry point. Reads window.S and returns the complete sport nutrition
   * context for the current day. Safe to call even if window.S is null/undefined.
   *
   * Return structure:
   * {
   *   sportType:       string — active sport (default 'musculation')
   *   profile:         Object — SPORT_PROFILES[sportType]
   *   loadTier:        string — effective load tier for today
   *   fatigue:         { level, cycleFactor, calBoost, note }
   *   hydration:       { dailyTarget, base, extra, note }
   *   nutritionTag:    'performance'|'recovery'|'fat-loss'|'maintenance'
   *   recommendations: string[] — 1–3 actionable phrases
   *   carbRate:        number — effective carb multiplier for today
   *   calMultiplier:   number — effective calorie multiplier for today
   * }
   *
   * @returns {Object} Full sport nutrition context
   *
   * Sources: all referenced per-section above; integration follows ISSN 2023
   *          "evidence-based recommendations for competition and training nutrition"
   */
  function getFullSportContext() {
    // Safe read of window.S — entire module is non-destructive
    var s = (typeof global !== 'undefined' && global.S) ? global.S : null;

    // Determine active sport
    var sportType = 'musculation'; // safe default
    if (s && typeof s.sport === 'string' && s.sport.length > 0) {
      sportType = s.sport;
    }

    // Resolve sport profile (fallback to musculation if unknown sport)
    var profile = SPORT_PROFILES[sportType] || SPORT_PROFILES.musculation;

    // Determine if today is a training day
    var isTrainingDay = false;
    if (s) {
      if (s.trainingLoad && s.trainingLoad !== 'rest') { isTrainingDay = true; }
      if (s.dailyTrainingLoad && s.dailyTrainingLoad !== 'rest') { isTrainingDay = true; }
      // Also check trainingWeekContext for today
      var todayStr = new Date().toISOString().slice(0, 10);
      if (s.trainingWeekContext && s.trainingWeekContext[todayStr]) {
        var todayCtx = s.trainingWeekContext[todayStr];
        if (todayCtx.exCount > 0 || (todayCtx.load && todayCtx.load !== 'rest')) {
          isTrainingDay = true;
        }
      }
    }

    // Resolve training load tier
    var trainingLoad = 'moderate'; // default
    if (s) {
      trainingLoad = s.dailyTrainingLoad || s.trainingLoad || 'moderate';
    }
    var loadTier = profile.loadTier;

    // Attempt to refine load tier via SFCSymbiosis if available
    if (typeof global.SFCSymbiosis !== 'undefined' && typeof global.SFCSymbiosis.computeSportLoad === 'function') {
      try {
        var duration = (s && typeof s.lastSessionDuration === 'number') ? s.lastSessionDuration : 45;
        loadTier = global.SFCSymbiosis.computeSportLoad(sportType, trainingLoad, duration, null) || loadTier;
      } catch (_) { /* non-destructive: ignore errors from optional dependency */ }
    }

    // Resolve fatigue
    var weekContext = (s && s.trainingWeekContext) ? s.trainingWeekContext : {};
    var fatigueData = getConsecutiveFatigue(weekContext);
    var fatigueLevel = fatigueData.fatigueLevel;

    // Also check SFCSymbiosis getFatigueScore for more granular RPE-based fatigue
    if (typeof global.SFCSymbiosis !== 'undefined' && typeof global.SFCSymbiosis.getFatigueScore === 'function') {
      try {
        var sfcFatigue = global.SFCSymbiosis.getFatigueScore();
        // Map SFCSymbiosis levels to our FATIGUE_TIERS keys
        if (sfcFatigue && sfcFatigue.level === 'overtrained') { fatigueLevel = 'overtrained'; }
        else if (sfcFatigue && sfcFatigue.level === 'tired' && fatigueLevel === 'fresh') { fatigueLevel = 'tired'; }
      } catch (_) { /* non-destructive */ }
    }

    var fatigueTier = FATIGUE_TIERS[fatigueLevel] || FATIGUE_TIERS.normal;
    var fatigue = {
      level:       fatigueLevel,
      cycleFactor: fatigueTier.cycleFactor,
      calBoost:    fatigueTier.calBoost,
      note:        fatigueTier.note
    };

    // Compute hydration target
    var weightKg = (s && typeof s.weight === 'number' && s.weight > 0) ? s.weight : 70;
    var hydration = getHydrationTarget(sportType, isTrainingDay ? trainingLoad : 'rest', weightKg);

    // Compute effective calorie multiplier for today
    // = sport calAdjust × (1 + fatigue calBoost) on training days; base on rest days
    var calMultiplier;
    if (isTrainingDay) {
      calMultiplier = profile.calAdjust * (1 + fatigue.calBoost);
    } else {
      // Rest day: slight reduction from base (sport-specific); fatigue still adds recovery cals
      calMultiplier = (1 - (1 - profile.calAdjust) * 0.3) * (1 + fatigue.calBoost);
    }
    calMultiplier = Math.round(calMultiplier * 1000) / 1000; // round to 3 dp

    // Compute effective carb rate for today
    var carbRate;
    if (isTrainingDay) {
      carbRate = profile.carbBoost;
    } else {
      carbRate = typeof profile.restCarb === 'number' ? profile.restCarb : 0.90;
    }

    // Determine nutrition tag
    // Reads S.goal if available; otherwise infers from sport + fatigue
    var nutritionTag = 'maintenance';
    if (s && s.goal !== null && s.goal !== undefined) {
      var GOALS = (global.GOALS) ? global.GOALS : null;
      var goalKey = '';
      if (GOALS && GOALS[s.goal]) { goalKey = GOALS[s.goal].key || ''; }
      if (goalKey === 'shred' || goalKey === 'cut') {
        nutritionTag = 'fat-loss';
      } else if (goalKey === 'bulk' || goalKey === 'lean_bulk') {
        nutritionTag = isTrainingDay ? 'performance' : 'recovery';
      } else if (isTrainingDay) {
        nutritionTag = 'performance';
      } else if (fatigueLevel === 'tired' || fatigueLevel === 'overtrained') {
        nutritionTag = 'recovery';
      }
    } else if (isTrainingDay) {
      nutritionTag = 'performance';
    } else if (fatigueLevel === 'tired' || fatigueLevel === 'overtrained') {
      nutritionTag = 'recovery';
    }

    // Build actionable recommendations (1-3 max)
    var recommendations = [];
    var rec;

    // Hydration recommendation
    if (hydration.dailyTarget > 2500) {
      rec = 'Objectif hydratation : ' + Math.round(hydration.dailyTarget / 100) * 100 + ' ml aujourd\'hui';
      if (profile.electrolytes && isTrainingDay) {
        rec += ' + électrolytes (sodium, potassium)';
      }
      recommendations.push(rec);
    }

    // Fatigue recommendation
    if (fatigue.note) {
      recommendations.push(fatigue.note);
    }

    // Sport-specific digestive warning
    if (profile.digestiveWarning && isTrainingDay) {
      recommendations.push('Évitez les repas lourds dans les 2h précédant l\'entraînement');
    }

    // Carb/protein guidance (training day)
    if (isTrainingDay && sportType === 'running' || sportType === 'triathlon' || sportType === 'hyrox') {
      if (recommendations.length < 3) {
        recommendations.push('Glucides prioritaires — visez ' + Math.round(carbRate * 100 - 100) + '% de plus que vos apports habituels');
      }
    }
    if (isTrainingDay && (sportType === 'musculation' || sportType === 'calisthenics')) {
      if (recommendations.length < 3) {
        recommendations.push('Protéines prioritaires — assurez un apport riche en protéines autour de la séance');
      }
    }

    // Cap recommendations at 3
    recommendations = recommendations.slice(0, 3);

    return {
      sportType:       sportType,
      profile:         profile,
      loadTier:        loadTier,
      fatigue:         fatigue,
      hydration:       hydration,
      nutritionTag:    nutritionTag,
      recommendations: recommendations,
      carbRate:        carbRate,
      calMultiplier:   calMultiplier
    };
  }

  // ── 7. Public API ───────────────────────────────────────────────────────────

  /**
   * window.SFCSportIntelligence — Sport Intelligence Public API
   *
   * Exposed on the global object (window in browser, this in Node.js).
   * All functions are pure or read-only with respect to the global S object.
   * No writes to window.S are performed by this module.
   *
   * @property {Object}   SPORT_PROFILES        — per-sport nutrition constants
   * @property {Object}   FATIGUE_TIERS         — fatigue level → training factor
   * @property {Function} getSportRecipeBonus   — recipe scoring delta for pickRecipe()
   * @property {Function} getHydrationTarget    — daily water target computation
   * @property {Function} getConsecutiveFatigue — streak-based fatigue level
   * @property {Function} getFullSportContext   — complete sport context object
   * @property {string}   VERSION               — module version string
   */
  global.SFCSportIntelligence = {
    SPORT_PROFILES:        SPORT_PROFILES,
    FATIGUE_TIERS:         FATIGUE_TIERS,
    getSportRecipeBonus:   getSportRecipeBonus,
    getHydrationTarget:    getHydrationTarget,
    getConsecutiveFatigue: getConsecutiveFatigue,
    getFullSportContext:   getFullSportContext,
    VERSION:               '2.0'
  };

})(typeof window !== 'undefined' ? window : this);
