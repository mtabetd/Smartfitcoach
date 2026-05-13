/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/**
 * sfc-contracts.js — Source de vérité des contrats inter-modules SmartFitCoach
 *
 * Ce fichier définit les contrats formels que chaque module DOIT respecter.
 * Il est la seule source d'autorité pour :
 *   - Les shapes d'entrée/sortie autorisés
 *   - Les invariants garantis
 *   - Les mutations interdites
 *   - Les plages de valeurs attendues
 *   - Les comportements de fallback
 *   - La carte d'impact (quel module casse si X change)
 *
 * USAGE :
 *   Les tests doivent valider ces contrats.
 *   Avant de modifier un module, consulter DEPENDENCY_MAP pour évaluer l'impact.
 *   Les valeurs dans FROZEN ne peuvent jamais changer sans version majeure.
 *
 * CONVENTION :
 *   Un contrat "violé" = le module ne respecte plus son interface publique.
 *   Toute modification d'interface doit s'accompagner d'une mise à jour de ce fichier.
 */
;(function (root) {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // I. VALEURS FIGÉES — NE JAMAIS MODIFIER SANS VERSION MAJEURE
  //    Sources scientifiques documentées dans sfc-constants.js
  // ════════════════════════════════════════════════════════════════════════════
  var FROZEN = {

    // ── Nutrition ────────────────────────────────────────────────────────────
    'NutritionMaster.KCAL_FLOOR_MALE':                1500,   // ACSM 2009
    'NutritionMaster.KCAL_FLOOR_FEMALE':              1400,   // ISSN 2017
    'NutritionMaster.CARB_MIN_GDAY':                  130,    // IOM 2005 (cerveau)
    'NutritionMaster.FAT_MIN_GPERKG':                 0.8,    // ISSN 2021
    'NutritionMaster.CARB_CYCLING_BOOST':             0.20,   // Holland 2019 JISSN
    'NutritionMaster.DEFICIT_MAX_KCAL':               500,    // ACSM 2009 / Helms 2014
    'NutritionMaster.PROTEIN_DEFAULT_MALE_GPERKG':    1.8,    // ISSN 2023 (milieu fourchette)
    'NutritionMaster.PROTEIN_DEFAULT_FEMALE_GPERKG':  1.6,    // ISSN 2023 (femme non-élite)
    'NutritionMaster.PROTEIN_ELITE_MALE_GPERKG':      2.2,    // Morton 2018 BJSM

    // ── Symbiosis — LOAD_MULTIPLIERS (Helms 2014 + ISSN 2023) ───────────────
    'SFCSymbiosis.LOAD_MULTIPLIERS.heavy.cal':        1.10,
    'SFCSymbiosis.LOAD_MULTIPLIERS.heavy.carbBoost':  1.20,
    'SFCSymbiosis.LOAD_MULTIPLIERS.heavy.fatAdjust':  0.92,
    'SFCSymbiosis.LOAD_MULTIPLIERS.moderate.cal':     1.07,
    'SFCSymbiosis.LOAD_MULTIPLIERS.moderate.carbBoost': 1.10,
    'SFCSymbiosis.LOAD_MULTIPLIERS.moderate.fatAdjust': 0.96,
    'SFCSymbiosis.LOAD_MULTIPLIERS.light.cal':        1.03,
    'SFCSymbiosis.LOAD_MULTIPLIERS.light.carbBoost':  1.00,
    'SFCSymbiosis.LOAD_MULTIPLIERS.light.fatAdjust':  1.00,
    'SFCSymbiosis.LOAD_MULTIPLIERS.rest.cal':         0.90,
    'SFCSymbiosis.LOAD_MULTIPLIERS.rest.carbBoost':   0.90,
    'SFCSymbiosis.LOAD_MULTIPLIERS.rest.fatAdjust':   1.08,

    // ── Symbiosis — PERIODIZATION_CFG (ACSM 2009 / Haff & Triplett 2015) ───
    'SFCSymbiosis.PERIODIZATION_CFG.S1.durMax':   6,
    'SFCSymbiosis.PERIODIZATION_CFG.S1.durSets':  4,
    'SFCSymbiosis.PERIODIZATION_CFG.S2.durMax':   6,
    'SFCSymbiosis.PERIODIZATION_CFG.S2.durSets':  5,
    'SFCSymbiosis.PERIODIZATION_CFG.S3.durMax':   5,
    'SFCSymbiosis.PERIODIZATION_CFG.S3.durSets':  5,
    'SFCSymbiosis.PERIODIZATION_CFG.S3.restOverride': '120-180s',
    'SFCSymbiosis.PERIODIZATION_CFG.S4.durMax':   4,
    'SFCSymbiosis.PERIODIZATION_CFG.S4.durSets':  3,
    'SFCSymbiosis.PERIODIZATION_CFG.S4.restOverride': '60s',

    // ── Symbiosis — getNutritionState volumeFactors ──────────────────────────
    'SFCSymbiosis.getNutritionState.shred.volumeFactor':        0.80,
    'SFCSymbiosis.getNutritionState.cut.volumeFactor':          0.88,
    'SFCSymbiosis.getNutritionState.bulk.volumeFactor':         1.08,
    'SFCSymbiosis.getNutritionState.lean_bulk.volumeFactor':    1.08,
    'SFCSymbiosis.getNutritionState.recomposition.volumeFactor': 0.95,
    'SFCSymbiosis.getNutritionState.maintain.volumeFactor':     1.00,

    // ── DecisionCore — signal thresholds ────────────────────────────────────
    'SFCDecisionCore._nutritionToTrainingSignal.deficit500.volumeModifier':    0.80,
    'SFCDecisionCore._nutritionToTrainingSignal.deficit500.intensityModifier': 0.88,
    'SFCDecisionCore._nutritionToTrainingSignal.deficit300.volumeModifier':    0.90,
    'SFCDecisionCore._nutritionToTrainingSignal.deficit300.intensityModifier': 0.95,
    'SFCDecisionCore._computeRecoveryConstraint.daysSinceThreshold':            2,

    // ── muscu-engine — safety floors ─────────────────────────────────────────
    'sfcBuildMuscuDay.MIN_SETS_PER_EXERCISE':    2,
    'sfcBuildMuscuDay.MAX_EXERCISES_S4_DELOAD':  4,
    'sfcBuildMuscuDay.MAX_EXERCISES_DEFAULT':    6,

    // ── RecipeAutoImprover — tolerances ──────────────────────────────────────
    'RecipeAutoImprover.MACRO_TOLERANCE.calories': 0.03,
    'RecipeAutoImprover.MACRO_TOLERANCE.protein':  0.05,
    'RecipeAutoImprover.MACRO_TOLERANCE.carbs':    0.05,
    'RecipeAutoImprover.MACRO_TOLERANCE.fat':      0.05,

    // ── SFCDecisionCore — cache ──────────────────────────────────────────────
    'SFCDecisionCore.CACHE_DURATION_MS': 300000  // 5 minutes
  };

  // ════════════════════════════════════════════════════════════════════════════
  // II. CONTRATS PAR MODULE
  // ════════════════════════════════════════════════════════════════════════════
  var MODULES = {

    // ── NutritionMaster ──────────────────────────────────────────────────────
    NutritionMaster: {
      description: 'Moteur nutritionnel pur — calcule BMR/TDEE/macros. Fonctions pures, aucun effet de bord.',
      exposedAt: 'window.NutritionMaster',

      compute: {
        inputs: {
          gender:        { type: 'string', enum: ['male','female'], required: true },
          age:           { type: 'number', min: 1, max: 119,  required: true },
          weightKg:      { type: 'number', min: 1, max: 499,  required: true },
          heightCm:      { type: 'number', min: 1, max: 299,  required: true },
          activityLevel: { type: 'number', min: 1, max: 2.5,  required: true },
          goal:          { type: 'string', enum: ['bulk','lean_bulk','maintain','recomposition','cut','shred'], required: true },
          isElite:       { type: 'boolean', required: false, default: false },
          trainingDay:   { type: 'boolean', required: false, default: false }
        },
        outputs: {
          bmr:               { type: 'number', min: 500,   max: 5000 },
          tdee:              { type: 'number', min: 600,   max: 8000 },
          caloriesTarget:    { type: 'number', min: 1400,  max: 8000 },
          proteinGrams:      { type: 'number', min: 40,    max: 500  },
          fatGrams:          { type: 'number', min: 20,    max: 400  },
          carbsGrams:        { type: 'number', min: 130,   max: 1200 },
          caloriesCheck:     { type: 'number' },
          carbCyclingApplied: { type: 'boolean' },
          errors:            { type: 'array' }
        },
        invariants: [
          'caloriesTarget >= KCAL_FLOOR (1400F / 1500M)',
          'caloriesTarget - tdee <= 500 pour cut/shred (cap déficit ACSM 2009)',
          'carbsGrams >= 130 (IOM 2005 plancher cérébral)',
          'fatGrams >= 0.8 * weightKg (ISSN 2021)',
          'caloriesCheck ≈ proteinGrams*4 + fatGrams*9 + carbsGrams*4 (±5%)',
          'carbCyclingApplied === true iff trainingDay === true',
          'trainingDay:true → carbsGrams > trainingDay:false (même profil)',
          'même inputs → même outputs (déterminisme strict)'
        ],
        forbiddenMutations: ['window.S', 'window.GOALS', 'inputs'],
        sideEffects: []
      }
    },

    // ── SFCSymbiosis ─────────────────────────────────────────────────────────
    SFCSymbiosis: {
      description: 'Pont Training↔Nutrition. Calcule la charge séance, adapte la nutrition, gère la périodisation.',
      exposedAt: 'window.SFCSymbiosis',

      computeTrainingLoad: {
        inputs: {
          exercises: { type: 'array', description: 'Liste exercices avec tags[]' },
          groups:    { type: 'array', description: 'Groupes musculaires du jour' }
        },
        outputs: { type: 'string', enum: ['heavy','moderate','light'] },
        invariants: [
          'null/empty exercises → "light"',
          'heavy = ≥6 exos + groupe lourd (legs/glutes/back/chest) + ≥4 composés',
          'light = ≤3 exos OU aucun groupe lourd',
          'moderate = tout le reste'
        ],
        forbiddenMutations: ['exercises', 'groups', 'window.S']
      },

      getLoadMultipliers: {
        inputs: {
          isTraining:    { type: 'boolean' },
          trainingLoad:  { type: 'string', enum: ['heavy','moderate','light'] }
        },
        outputs: {
          cal:       { type: 'number' },
          carbBoost: { type: 'number' },
          fatAdjust: { type: 'number' }
        },
        invariants: [
          'isTraining:false → retourne LOAD_MULTIPLIERS.rest (jamais heavy/moderate/light)',
          'isTraining:true → retourne LOAD_MULTIPLIERS[trainingLoad] ou moderate si inconnu',
          'valeurs correspondant exactement à FROZEN[SFCSymbiosis.LOAD_MULTIPLIERS.*]'
        ],
        forbiddenMutations: ['LOAD_MULTIPLIERS']
      },

      notifySession: {
        invariants: [
          'trainingLoad: MAX(existant, calculé) — jamais de dégradation silencieuse',
          'lastSessionGroups: union (accumulation multi-sport)',
          'empty exercises → session ignorée (pas de mise à jour)',
          'sportProgramStart: positionné seulement si absent'
        ],
        forbiddenMutations: ['exercises']
      },

      processCompletedSession: {
        invariants: [
          'idempotent: même sessionId → second appel ignoré silencieusement',
          'empty exercises → appel ignoré',
          'no sessionId → appel ignoré',
          'S._processedSessionIds bounded ≤ 365 entrées',
          'trainingWeekContext pruned ≤ 14 jours'
        ],
        forbiddenMutations: ['exercises DB', 'EXERCISES']
      },

      getPeriodizationCfg: {
        outputs: {
          durMax:      { type: 'number', enum: [4,5,6] },
          durSets:     { type: 'number', enum: [3,4,5] },
          restOverride:{ type: ['string','null'] }
        },
        invariants: [
          'S1: durMax=6, durSets=4',
          'S2: durMax=6, durSets=5 (S2 > S1 progression)',
          'S3: durMax=5, durSets=5, restOverride="120-180s"',
          'S4: durMax=4, durSets=3, restOverride="60s" (deload)',
          'S4.durMax < S1.durMax (deload volume réduit)',
          'weekIndex=5 → normalise en S1 (cycle infini)'
        ]
      },

      getNutritionState: {
        invariants: [
          'shred → volumeFactor=0.80 (Helms 2014)',
          'cut → volumeFactor=0.88',
          'bulk|lean_bulk → volumeFactor=1.08',
          'recomposition → volumeFactor=0.95',
          'maintain|null → volumeFactor=1.00',
          'null S → retourne neutral (dégradation gracieuse)'
        ]
      },

      getFatigueScore: {
        outputs: {
          level:           { type: 'string', enum: ['overtrained','tired','normal','fresh'] },
          cycleFactor:     { type: 'number', enum: [0.60, 0.80, 0.95, 1.00] },
          restRecommended: { type: 'boolean' }
        },
        invariants: [
          'overtrained: cycleFactor=0.60, restRecommended=true',
          'tired: cycleFactor=0.80, restRecommended=false',
          'normal: cycleFactor=0.95',
          'fresh: cycleFactor=1.00',
          'overtrained triggered by: deload needed OR avgRpe≥8.5 OR ≥6j/sem'
        ]
      }
    },

    // ── SFCDecisionCore ──────────────────────────────────────────────────────
    SFCDecisionCore: {
      description: 'Moteur décisionnel central. Orchestre les signaux bidirectionnels sport↔nutrition.',
      exposedAt: 'window.SFCDecisionCore',

      _nutritionToTrainingSignal: {
        inputs: {
          calDeficit:       { type: 'number', description: 'Positif=surplus, négatif=déficit' },
          proteinAdequacy:  { type: 'number', min: 0, max: 2.0 },
          fatigueLevel:     { type: 'number', min: 1, max: 5 }
        },
        outputs: {
          volumeModifier:    { type: 'number', min: 0.60, max: 1.00 },
          intensityModifier: { type: 'number', min: 0.75, max: 1.00 },
          reasons:           { type: 'array' }
        },
        invariants: [
          'calDeficit < -500 → volumeModifier=0.80, intensityModifier=0.88',
          'calDeficit < -300 → volumeModifier=0.90, intensityModifier=0.95',
          'calDeficit ≥ -300 → volumeModifier=1.0, intensityModifier=1.0 (hors fatigue)',
          'proteinAdequacy < 0.75 → intensityModifier ≤ 0.80',
          'proteinAdequacy < 0.90 → intensityModifier ≤ 0.92',
          'fatigueLevel≥4 + calDeficit<-200 → volumeModifier ≤ 0.75'
        ],
        forbiddenMutations: ['window.S']
      },

      _trainingToNutritionSignal: {
        invariants: [
          'heavy → calMultiplier=1.10 (= SFCSymbiosis.LOAD_MULTIPLIERS.heavy.cal)',
          'moderate → calMultiplier=1.07',
          'light → calMultiplier=1.03',
          'rest → calMultiplier=0.90',
          'fatigueLevel≥4 → proteinBoost=1.12',
          'daysSince=1 + lastGroups non-vide → proteinBoost≥1.08, carbBoost≤1.0'
        ]
      },

      _computeRecoveryConstraint: {
        invariants: [
          'daysSince < 2 + lastGroups non-vide → blockedGroups = lastGroups',
          'daysSince = 0 → suggestRest=true',
          'daysSince ≥ 2 → blockedGroups=[], reason=null'
        ]
      },

      getDecision: {
        invariants: [
          'cache valide (< 5min) → retourne S._decisionCore sans recalcul',
          'cache expiré → appelle decide() et met à jour S._decisionCore',
          'retourne toujours un objet non-null (dégradation gracieuse)'
        ]
      },

      invalidate: {
        invariants: ['S._decisionCore = null après appel']
      }
    },

    // ── sfcBuildMuscuDay ─────────────────────────────────────────────────────
    sfcBuildMuscuDay: {
      description: 'Pipeline 8 étapes de génération séance muscu. UMD — browser et Node.js.',
      exposedAt: 'window.sfcBuildMuscuDay / require("muscu-engine").sfcBuildMuscuDay',

      inputs: {
        grps: { type: 'array', description: 'Groupes musculaires (e.g. ["chest","back"])' },
        cfg: {
          exercises:    { type: 'object', required: true, description: 'window.EXERCISES (dict group→ex[])' },
          equipment:    { type: 'string', enum: ['gym','home','dumbbells','none'], required: false },
          durMax:       { type: 'number', description: 'Nombre max exercices (6 par défaut)' },
          durSets:      { type: 'number', description: 'Séries par défaut' },
          cycleFactor:  { type: 'number', min: 0.1, max: 1.0 },
          isBeginner:   { type: 'boolean' },
          hasShred:     { type: 'boolean' },
          hasStrength:  { type: 'boolean' }
        }
      },
      outputs: {
        type: 'array',
        items: { n: 'string', sets: 'string (ex: "4×8-12")', eq: 'string', _grp: 'string' }
      },
      invariants: [
        'retourne un tableau (jamais null/undefined)',
        'longueur ≤ cfg.durMax (ou 6 si non défini)',
        'aucun doublon de nom (e.n) dans la séance',
        'equipment=home → aucun exo gym-only (machine/câble/presse/smith)',
        'isBeginner=true → aucun tag advanced/expert',
        'cycleFactor appliqué → toutes les séries ≥ 2 (plancher sécurité)',
        'S4 deload (durMax=4) → ≤ 4 exercices',
        'S2 (durSets=5) → séries totales ≥ S1 (durSets=4)',
        'hasStrength → reps min ≤ 8',
        'hasShred → reps min ≥ reps standard',
        'cfg.exercises requis — pool vide sinon (warning "[SFC] pool totalement vide")'
      ],
      forbiddenMutations: ['cfg.exercises', 'window.EXERCISES', 'EXERCISES_DB']
    },

    // ── RecipeEngine ─────────────────────────────────────────────────────────
    RecipeEngine: {
      description: 'Base de données recettes + filtrage. RECIPES_DB = vérité unique.',
      exposedAt: 'window.RecipeEngine',

      RECIPES_DB: {
        invariants: [
          'tableau non vide',
          'chaque recette: id (string|number) non-null',
          'chaque recette: name ou title non-null',
          'format R: baseNutrition.{calories, proteinGrams, carbsGrams, fatGrams} > 0',
          'format L: {k (calories), p (protein), g (glucides), l (lipides)} numériques',
          'calories (k ou baseNutrition.calories) > 0 pour toutes les recettes'
        ],
        forbiddenMutations: [
          'RecipeAutoImprover.runDryRun ne modifie PAS RECIPES_DB',
          'RecipeUXEngine ne modifie PAS les recettes source',
          'aucun module ne doit muter RECIPES_DB en dehors des scripts de maintenance'
        ]
      }
    },

    // ── RecipeAutoImprover ───────────────────────────────────────────────────
    RecipeAutoImprover: {
      description: 'Auto-amélioration recettes. Dry-run par défaut. Non-destructif.',
      exposedAt: 'window.RecipeAutoImprover',

      runDryRun: {
        invariants: [
          'NEVER modifie RECIPES_DB (ni aucune recette source)',
          'REVIEW_REQUIRED jamais dans proposal.applied[]',
          'summary.{autoApplied, reviewRequired, rejected} sont tous des nombres',
          'MACRO_TOLERANCE respectée (calories ±3%, macros ±5%) pour toute amélioration applied',
          'retourne {proposals: Array, summary: Object, analyzed: number}'
        ],
        forbiddenMutations: ['RECIPES_DB', 'recettes source'],
        sideEffects: []
      },

      IMPROVEMENT_CATALOG: {
        invariants: [
          'contient ≥ 5 entrées',
          'chaque entrée: {id, type, delta, condition}',
          'type ∈ ["AUTO_SAFE", "REVIEW_REQUIRED"]',
          'seuls les AUTO_SAFE sont appliqués automatiquement'
        ]
      }
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // III. CONTRATS CROSS-MODULE
  //      Ces invariants impliquent ≥2 modules — les plus dangereux à briser
  // ════════════════════════════════════════════════════════════════════════════
  var CROSS_MODULE = [
    {
      id: 'XM-01',
      name: 'Carb cycling calorie-neutre',
      description: 'NutritionMaster.compute(trainingDay:true).carbsGrams > compute(trainingDay:false)',
      modules: ['NutritionMaster'],
      invariant: 'ON day carbs > OFF day carbs; ON day fat ≤ OFF day fat',
      risk: 'HIGH — casse le modèle nutrition/sport si violé'
    },
    {
      id: 'XM-02',
      name: 'LOAD_MULTIPLIERS cohérence NutritionMaster↔SFCDecisionCore',
      description: 'SFCDecisionCore._trainingToNutritionSignal lit SFCSymbiosis.LOAD_MULTIPLIERS (source unique)',
      modules: ['SFCSymbiosis', 'SFCDecisionCore'],
      invariant: 'heavy → calMultiplier=1.10 dans les deux modules',
      risk: 'HIGH — divergence silencieuse si un module hard-code les valeurs'
    },
    {
      id: 'XM-03',
      name: 'Dry-run non-destructif RecipeAutoImprover↔RecipeEngine',
      description: 'RecipeAutoImprover.runDryRun ne modifie jamais RecipeEngine.RECIPES_DB',
      modules: ['RecipeAutoImprover', 'RecipeEngine'],
      invariant: 'Snapshots avant/après runDryRun identiques',
      risk: 'CRITICAL — perte de données irréversible si violé'
    },
    {
      id: 'XM-04',
      name: 'Récupération 48h bloque groupes musculaires',
      description: 'SFCDecisionCore._computeRecoveryConstraint → groupes bloqués → sfcBuildMuscuDay les évite',
      modules: ['SFCDecisionCore', 'sfcBuildMuscuDay'],
      invariant: 'daysSince < 2 → blockedGroups non-vides → plan évite ces groupes',
      risk: 'MEDIUM — sur-sollicitation musculaire si violé'
    },
    {
      id: 'XM-05',
      name: 'Deficit → volume training réduit',
      description: 'NutritionMaster(shred) → SFCSymbiosis.getNutritionState → volumeFactor=0.80 → sfcBuildMuscuDay durMax réduit',
      modules: ['NutritionMaster', 'SFCSymbiosis', 'sfcBuildMuscuDay'],
      invariant: 'Chaîne complète : objectif sèche → volume training automatiquement ajusté',
      risk: 'HIGH — blessure sur-entraînement si chaîne brisée'
    },
    {
      id: 'XM-06',
      name: 'NutritionMaster déterminisme',
      description: 'Mêmes inputs → mêmes outputs (pas de dépendance à Date.now ou Math.random)',
      modules: ['NutritionMaster'],
      invariant: 'compute(x) === compute(x) pour tout x valide',
      risk: 'MEDIUM — instabilité UI si non-déterministe'
    },
    {
      id: 'XM-07',
      name: 'RecipeAutoImprover REVIEW_REQUIRED isolation',
      description: 'Aucune amélioration REVIEW_REQUIRED ne peut se retrouver dans applied[]',
      modules: ['RecipeAutoImprover'],
      invariant: 'type=REVIEW_REQUIRED → toujours dans reviewRequired[], jamais applied[]',
      risk: 'CRITICAL — modification automatique non-validée par humain'
    },
    {
      id: 'XM-08',
      name: 'processCompletedSession idempotence',
      description: 'Un même sessionId traité deux fois produit le même état que traité une fois',
      modules: ['SFCSymbiosis'],
      invariant: 'processCompletedSession(sess) puis processCompletedSession(sess) = état identique',
      risk: 'MEDIUM — double comptage séances si violé'
    }
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // IV. CARTE D'IMPACT — "si je modifie X, quels modules peuvent casser ?"
  // ════════════════════════════════════════════════════════════════════════════
  var DEPENDENCY_MAP = {

    'sfc-constants.js': {
      description: 'Source de vérité des constantes',
      dependedOnBy: ['nutrition-master.js', 'sfc-invariants.js', 'app-core.js'],
      impact: 'CRITICAL — tout le système si une valeur change',
      safeToModify: 'Ajouter seulement. Ne jamais changer une valeur existante.',
      contractsAffected: Object.keys(FROZEN)
    },

    'nutrition-master.js': {
      description: 'Moteur nutrition pur',
      dependsOn: ['sfc-constants.js'],
      dependedOnBy: ['app-nutrition.js', 'app-core.js', 'today-dashboard.js', 'sfc-invariants.js', 'tests/*'],
      impact: 'HIGH — calcul macros impacte nutrition UI, recipes recommendations, carb cycling',
      safeToModify: 'Fonctions internes (calcBMR, calcTDEE) si invariants respectés. NE PAS changer la signature de compute().',
      contractsAffected: ['NutritionMaster.compute.*']
    },

    'sfc-symbiosis.js': {
      description: 'Pont Training↔Nutrition',
      dependsOn: ['app-core.js'],
      dependedOnBy: ['app-sport.js', 'custom-session.js', 'sfc-decision-core.js', 'tests/*'],
      impact: 'HIGH — LOAD_MULTIPLIERS utilisés par SFCDecisionCore (référence directe)',
      safeToModify: 'getFeedbackAdjustment, updateWeekContext. JAMAIS LOAD_MULTIPLIERS ni PERIODIZATION_CFG.',
      contractsAffected: ['SFCSymbiosis.*', 'XM-01', 'XM-02', 'XM-05']
    },

    'sfc-decision-core.js': {
      description: 'Moteur décisionnel — orchestre sport+nutrition',
      dependsOn: ['sfc-symbiosis.js', 'daily-decision-engine-v3.js'],
      dependedOnBy: ['app-sport.js', 'today-dashboard.js', 'custom-session.js'],
      impact: 'HIGH — décision quotidienne (train/rest/intensity) et nutrition modulators',
      safeToModify: 'Logique interne (_detectDeload, _mergeDecision). JAMAIS les seuils FROZEN.',
      contractsAffected: ['SFCDecisionCore.*', 'XM-02', 'XM-04']
    },

    'muscu-engine.js': {
      description: 'Pipeline génération séance muscu — UMD',
      dependsOn: ['(cfg.exercises = window.EXERCISES)'],
      dependedOnBy: ['app-sport.js', 'custom-session.js'],
      impact: 'MEDIUM — séances quotidiennes. Ne touche pas nutrition.',
      safeToModify: 'Algorithme sélection. JAMAIS la signature sfcBuildMuscuDay(grps, cfg).',
      contractsAffected: ['sfcBuildMuscuDay.*', 'XM-04', 'XM-05']
    },

    'recipe-engine.js': {
      description: 'Base recettes + filtrage',
      dependsOn: ['recipe-registry.js'],
      dependedOnBy: ['recipe-auto-improver.js', 'recipe-ux-engine.js', 'recipe-qa.js', 'scripts/*'],
      impact: 'HIGH — RECIPES_DB est la source unique des données recettes',
      safeToModify: 'Fonctions de filtrage. JAMAIS le format des recettes dans RECIPES_DB.',
      contractsAffected: ['RecipeEngine.RECIPES_DB.*', 'XM-03']
    },

    'recipe-auto-improver.js': {
      description: 'Auto-amélioration recettes — dry-run non-destructif',
      dependsOn: ['recipe-engine.js', 'recipe-ux-engine.js', 'recipe-ux-explainer.js'],
      dependedOnBy: ['scripts/recipe-auto-improve.js', 'tests/unit-recipe-auto-improver.js'],
      impact: 'MEDIUM — isolé du runtime. Impact limité si RECIPES_DB non mutée.',
      safeToModify: 'IMPROVEMENT_CATALOG (ajout seulement). JAMAIS supprimer un type REVIEW_REQUIRED.',
      contractsAffected: ['RecipeAutoImprover.*', 'XM-03', 'XM-07']
    },

    'sfc-invariants.js': {
      description: 'Moteur invariants runtime',
      dependsOn: ['sfc-constants.js'],
      dependedOnBy: ['nutrition-master.js', 'app-core.js'],
      impact: 'LOW en prod (warn mode), HIGH en test (throw mode)',
      safeToModify: 'Ajouter des checks. JAMAIS assouplir un check existant.',
      contractsAffected: ['NutritionMaster.compute.invariants.*']
    },

    'app-core.js': {
      description: 'État global window.S, GOALS, ACTIVITIES, fonctions nutrition legacy',
      dependsOn: ['sfc-constants.js', 'food-db.js', 'extras.js'],
      dependedOnBy: ['TOUS les modules app-*.js'],
      impact: 'CRITICAL — modification de window.S casse tout le système',
      safeToModify: 'RIEN sans audit complet. Ajouter des champs S.* ne casse pas — supprimer ou renommer = catastrophe.',
      contractsAffected: ['ALL']
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // V. RÈGLES ANTI-RÉGRESSION
  //    Patterns qui NE DOIVENT JAMAIS apparaître dans le code
  // ════════════════════════════════════════════════════════════════════════════
  var FORBIDDEN_PATTERNS = [
    {
      id: 'FP-01',
      pattern: 'Muter RECIPES_DB directement (hors maintenance scripts)',
      reason: 'Données corrompues pour tous les utilisateurs',
      detection: 'Chercher "RECIPES_DB[" ou "RECIPES_DB.push" hors recipe-registry.js'
    },
    {
      id: 'FP-02',
      pattern: 'REVIEW_REQUIRED dans proposal.applied[]',
      reason: 'Modification automatique non-validée',
      detection: 'unit-system-contracts.js vérifie à chaque runDryRun'
    },
    {
      id: 'FP-03',
      pattern: 'Hard-coder LOAD_MULTIPLIERS dans un nouveau module',
      reason: 'Divergence silencieuse avec sfc-symbiosis.js',
      detection: 'Chercher "1.10" ou "1.20" ou "0.90" hors sfc-symbiosis.js'
    },
    {
      id: 'FP-04',
      pattern: 'Modifier la signature de compute() dans NutritionMaster',
      reason: 'Casse tous les appelants (app-nutrition.js, app-core.js, tests)',
      detection: 'git diff sur la ligne "function compute(inputs)"'
    },
    {
      id: 'FP-05',
      pattern: 'Assouplir un invariant dans sfc-invariants.js',
      reason: 'Rend les violations silencieuses',
      detection: 'Chercher "// TODO relaxer" ou suppression d\'un _assert()'
    },
    {
      id: 'FP-06',
      pattern: 'Baisser KCAL_FLOOR sous 1400 (femme) ou 1500 (homme)',
      reason: 'Risque médical (RED-S, sous-nutrition)',
      detection: 'unit-system-contracts.js vérifie les planchers à chaque run'
    },
    {
      id: 'FP-07',
      pattern: 'Changer CARB_MIN_GDAY sous 130g',
      reason: 'Déficit glucose cérébral (IOM 2005)',
      detection: 'unit-system-contracts.js + unit-nutrition-adaptation.js'
    },
    {
      id: 'FP-08',
      pattern: 'processCompletedSession sans guard idempotence',
      reason: 'Double comptage séances, trainingLoad incorrect',
      detection: 'Chercher "_processedSessionIds" check dans la fonction'
    }
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // VI. POLITIQUE FALLBACK — comportement garanti en cas de données manquantes
  // ════════════════════════════════════════════════════════════════════════════
  var FALLBACK_POLICY = {
    'NutritionMaster.compute — inputs invalides': 'retourne {errors: [...], caloriesTarget: 0}',
    'SFCSymbiosis.getWeekIndex — no sportProgramStart': 'retourne 1 (semaine de base)',
    'SFCSymbiosis.getFatigueScore — no S': 'retourne {level:"fresh", cycleFactor:1.0}',
    'SFCSymbiosis.getFeedbackAdjustment — no sessionFeedback': 'retourne {calAdjust:0, reason:null}',
    'SFCSymbiosis.getNutritionState — null S': 'retourne {state:"neutral", volumeFactor:1.0}',
    'SFCDecisionCore.getDecision — no S': 'retourne décision neutre (train, moderate)',
    'sfcBuildMuscuDay — cfg.exercises vide': 'retourne [] avec warning console',
    'sfcBuildMuscuDay — equipment inconnu': 'traite comme gym',
    'RecipeAutoImprover.runDryRun — DB vide': 'retourne {proposals:[], summary:{...zeros}}'
  };

  // ════════════════════════════════════════════════════════════════════════════
  // API PUBLIQUE
  // ════════════════════════════════════════════════════════════════════════════
  var SFCContracts = {
    VERSION:         '1.0.0',
    FROZEN:          FROZEN,
    MODULES:         MODULES,
    CROSS_MODULE:    CROSS_MODULE,
    DEPENDENCY_MAP:  DEPENDENCY_MAP,
    FORBIDDEN_PATTERNS: FORBIDDEN_PATTERNS,
    FALLBACK_POLICY: FALLBACK_POLICY,

    /**
     * Vérifie qu'une valeur courante correspond à une valeur figée.
     * Usage : SFCContracts.checkFrozen('SFCSymbiosis.LOAD_MULTIPLIERS.heavy.cal', LM.heavy.cal)
     * @returns {boolean}
     */
    checkFrozen: function(key, actualValue) {
      var expected = FROZEN[key];
      if (expected === undefined) {
        throw new Error('[SFCContracts] Clé FROZEN inconnue : ' + key);
      }
      return actualValue === expected;
    },

    /**
     * Retourne le contrat d'un module.
     * @param {string} moduleName
     * @returns {object|null}
     */
    getModuleContract: function(moduleName) {
      return MODULES[moduleName] || null;
    },

    /**
     * Retourne tous les modules impactés si on modifie un fichier.
     * @param {string} filename — ex: 'sfc-symbiosis.js'
     * @returns {string[]}
     */
    getImpactedModules: function(filename) {
      var entry = DEPENDENCY_MAP[filename];
      if (!entry) return [];
      return (entry.dependedOnBy || []).slice();
    },

    /**
     * Retourne la liste des CROSS_MODULE contracts impliquant un module.
     * @param {string} moduleName
     * @returns {object[]}
     */
    getCrossModuleContracts: function(moduleName) {
      return CROSS_MODULE.filter(function(c) {
        return c.modules.indexOf(moduleName) >= 0;
      });
    }
  };

  if (typeof root !== 'undefined') root.SFCContracts = SFCContracts;
  if (typeof module !== 'undefined') module.exports = SFCContracts;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
