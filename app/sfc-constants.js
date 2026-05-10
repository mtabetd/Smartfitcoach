/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
// app/sfc-constants.js — Source de vérité unique des constantes métier SmartFitCoach.
// Toutes les valeurs sont vérifiées contre les sources primaires :
//   nutrition-master.js, app-core.js, _user-auth.js, sfc-symbiosis.js, supabase-client.js
'use strict';
(function() {

  var SFCConstants = {

    // ── NUTRITION ────────────────────────────────────────────────────────────
    // Sources : nutrition-master.js lignes 71-75, app-core.js ligne 4908

    KCAL_FLOOR_FEMALE: 1400,          // ISSN 2017 / ACSM 2016 — plancher universel femme
                                       // Vérifié : nutrition-master.js l.72 (KCAL_FLOOR_FEMALE=1400)
                                       //           app-core.js l.4908 (kcalFloor=1400 femme)
    KCAL_FLOOR_MALE: 1500,             // ACSM — plancher physiologique masculin
                                       // Vérifié : nutrition-master.js l.71 (KCAL_FLOOR_MALE=1500)
                                       //           app-core.js l.4908 (kcalFloor=1500 homme)
    KCAL_FLOOR_PREGNANT: 1800,         // OMS 2016 — jamais de restriction chez femme enceinte
                                       // Vérifié : app-core.js l.4876 (Math.max(base,1800))
    KCAL_FLOOR_BREASTFEEDING: 1800,    // ACOG 2022 — plancher allaitement (même valeur que grossesse)
                                       // Vérifié : app-core.js l.4888 (Math.max(base,1800) allaitement)
                                       // DIVERGENCE : la proposition initiale était 1900 pour l'allaitement
                                       // mais app-core.js applique Math.max(base,1800) pour l'allaitement
                                       // (identique au plancher grossesse). La valeur 1900 ne correspond
                                       // à aucune constante dans le code — 1800 est la valeur réelle utilisée.

    DEFICIT_MAX_KCAL: 500,             // ACSM 2009 / Helms 2014 — déficit max absolu
                                       // Vérifié : app-core.js l.4879 (Math.max(base, tdeeVal-500))
    SURPLUS_MAX_KCAL: 300,             // Surplus max lean_bulk (Helms 2014)
                                       // Vérifié : app-core.js l.4883 (Math.min(base, tdeeVal+300))
    SURPLUS_MAX_BULK_KCAL: 500,        // Surplus max bulk agressif (ISSN 2017 / ACSM)
                                       // Vérifié : app-core.js l.4885 (Math.min(base, tdeeVal+500))

    // Protéines — Sources : nutrition-master.js l.30-33, app-core.js l.4949-4998
    // DIVERGENCES DOCUMENTÉES :
    //   PROTEIN_MIN_GPERKG_STANDARD: dans nutrition-master.js, la valeur 1.6 est le défaut FEMME
    //   (PROT_DEFAULT_FEMALE=1.6) ; le défaut HOMME est 1.8 (PROT_DEFAULT_MALE=1.8).
    //   Il n'existe pas de constante unique "standard" universelle — les deux sexes diffèrent.
    //   On retient 1.6 (borne basse, femme non-élite / ISSN 2023) comme valeur MINIMUM.
    //
    //   PROTEIN_MIN_GPERKG_MUSCLE: dans nutrition-master.js, 1.8 = PROT_DEFAULT_MALE (non-élite
    //   résistance, ISSN 2023 milieu de fourchette). Dans app-core.js calcMacros(), 1.8 est aussi
    //   la valeur par défaut (ppk=1.8 à la ligne 4949) et la valeur des "Très actifs" maintien homme.
    //   C'est la valeur de référence masculine, pas un plancher "muscle" per se.
    //
    //   PROTEIN_MAX_GPERKG: le code utilise jusqu'à 2.8 g/kg (élite sèche homme, app-core.js l.5008).
    //   2.2 g/kg est la valeur maximale pour non-élite (ISSN 2023 upper, PROT_ELITE_MALE dans
    //   nutrition-master.js l.32). Le cap absolu dans calcMacros() est 3.5g/kg (app-core.js l.5065).
    //   On retient 2.2 comme cap pour les cas généraux non-compétiteurs.
    PROTEIN_MIN_GPERKG_STANDARD: 1.6,  // ISSN 2023 — femme non-élite résistance (borne basse)
                                        // Vérifié : nutrition-master.js l.31 PROT_DEFAULT_FEMALE=1.6
    PROTEIN_MIN_GPERKG_MUSCLE: 1.8,    // ISSN 2023 — homme non-élite résistance (PROT_DEFAULT_MALE)
                                        // Vérifié : nutrition-master.js l.30 PROT_DEFAULT_MALE=1.8
    PROTEIN_MAX_GPERKG: 2.2,           // ISSN 2023 upper / Morton 2018 BJSM — non-élite cap
                                        // Vérifié : nutrition-master.js l.32 PROT_ELITE_MALE=2.2
    PROTEIN_MAX_GPERKG_IRC: 0.6,       // KDOQI 2020 — insuffisance rénale chronique CKD 3-5
                                        // Vérifié : app-core.js l.5056 (ppk=Math.min(ppk,0.6))

    // Lipides — Sources : app-core.js l.5081-5082, nutrition-master.js l.35
    // DIVERGENCE : FAT_MIN_PCT_KCAL
    //   La proposition initiale était 0.15 (15%, ACSM 2009).
    //   Analyse du code :
    //   - app-core.js l.6919 : 0.15/9 est utilisé uniquement comme plancher du carb cycling
    //     (fat floor pendant les ajustements glucides entraînement)
    //   - app-core.js l.5082 : le plancher effectif pour les macros normales est 0.20 (20%)
    //     minFatCal=Math.round(c*0.20) — c'est ce qui est appliqué dans calcMacros()
    //   On exporte les deux valeurs avec des noms distincts pour éviter toute ambiguïté.
    FAT_MIN_PCT_KCAL: 0.20,            // ISSN 2017 / Volek 2006 — plancher lipides 20% kcal (calcMacros)
                                        // Vérifié : app-core.js l.5082 (minFatCal=Math.round(c*0.20))
    FAT_MIN_PCT_KCAL_CARB_CYCLING: 0.15, // ACSM 2009 — plancher lipides carb cycling uniquement
                                        // Vérifié : app-core.js l.6919 (0.15/9 dans carb cycling)
    FAT_MIN_GPERKG: 0.8,               // ISSN 2021 — santé hormonale
                                        // Vérifié : nutrition-master.js l.35 (FAT_MIN_PER_KG=0.8)

    CARB_MIN_GDAY: 130,                 // IOM 2005 — minimum absolu glucose cérébral
                                        // Vérifié : nutrition-master.js l.143, app-core.js l.6966

    // Carb Cycling — Sources : nutrition-master.js l.37, app-core.js l.6911-6965
    CARB_CYCLING_BOOST_HEAVY: 0.20,     // Holland 2019 JISSN — jour heavy (standard)
                                         // Vérifié : nutrition-master.js l.37 CARB_CYCLING_BOOST=0.20
                                         //           app-core.js l.6951 (_carbRate=0.20 heavy single day)
    CARB_CYCLING_BOOST_HEAVY_STREAK: 0.25, // Holland 2019 — streak ≥2 jours heavy consécutifs
                                         // Vérifié : app-core.js l.6951 (_carbRate=0.25 heavyStreak>=2)
    CARB_CYCLING_BOOST_MODERATE: 0.10,  // Jour modéré
                                         // Vérifié : app-core.js l.6953 (_carbRate=0.10 moderate)
    CARB_CYCLING_REDUCTION_REST: 0.10,  // Jour de repos (−10% glucides)
                                         // Vérifié : app-core.js l.6965 (carbRed=Math.round(carbsGrams*0.10))

    // Grossesse / Allaitement — Sources : app-core.js l.4375-4464, l.4871-4888
    PREGNANCY_SURPLUS_T1: 0,            // ACOG 2018 — T1 : pas de calories supplémentaires
                                         // Vérifié : app-core.js l.4382 (calorieExtra:0)
    PREGNANCY_SURPLUS_T2: 340,           // ACOG 2018 — T2 : +340 kcal/j
                                         // Vérifié : app-core.js l.4411 (calorieExtra:340)
    PREGNANCY_SURPLUS_T3: 450,           // ACOG 2018 — T3 : +450 kcal/j
                                         // Vérifié : app-core.js l.4440 (calorieExtra:450)
    BREASTFEEDING_SURPLUS: 500,          // ACOG 2022 — allaitement : +500 kcal/j
                                         // Vérifié : app-core.js l.4873 (allaitExtra=500)

    ACTIVITY_FACTORS: {                  // Mifflin-St Jeor avec facteurs Harris-Benedict
                                         // Vérifié : app-core.js l.1436-1443 (ACTIVITIES array)
      sedentary:  1.2,                   // Pas d'exercice
      light:      1.375,                 // 1-2x / semaine
      moderate:   1.55,                  // 3-4x / semaine
      active:     1.725,                 // 5-6x / semaine
      veryActive: 1.9,                   // 6-7 séances / semaine (Athlète)
      elite:      2.1                    // >10h / semaine (IRONMAN, pro) — PRÉSENT dans le code
                                         // DIVERGENCE : la proposition initiale ne listait que 5 niveaux
                                         // (sedentary à veryActive). app-core.js ACTIVITIES contient
                                         // un 6e niveau "Athlète élite" avec factor:2.1 (l.1442).
                                         // Ce facteur 2.1 est utilisé dans calcTDEE et les comparaisons.
    },

    // ── SPORT ────────────────────────────────────────────────────────────────
    // Sources : app-core.js l.6693, app-sport.js l.864-871, sfc-symbiosis.js l.250-255

    DELOAD_PERIOD_WEEKS: 4,             // Cycle standard 4 semaines (Haff & Triplett 2015)
                                         // Vérifié : sfc-symbiosis.js l.250-254 (PERIODIZATION_CFG 1..4)
    DELOAD_VOLUME_REDUCTION: 0.40,      // -40% volume en deload
                                         // Vérifié : app-core.js l.6693 ('volume -40%')

    MIN_SETS_PER_SESSION: {              // NSCA minimum — Vérifié : app-sport.js l.864-871
      '45min': 9,                        // 3 exos × 3 sets minimum
      '1h':    12,                       // 4 exos × 3 sets minimum
      '1h15':  15,                       // 5 exos × 3 sets minimum
      '1h30':  18                        // 6 exos × 3 sets minimum
    },

    // Exos minimum par durée (MIN_SETS_PER_SESSION ÷ 3 sets/exo) — utilisé dans app-sport.js
    // Pré-calculé ici pour éviter l'IIFE répétée à chaque appel de generateSportProgram().
    MIN_EXOS_BY_DUR: {
      '45min': 3,
      '1h':    4,
      '1h15':  5,
      '1h30':  6
    },

    MAX_SPORT_DAYS: 6,                  // Maximum physiologique (récupération)
                                         // Vérifié : app-core.js l.4858 (sportDays>=5 → factor 1.725,
                                         //           jamais plus de 6j dans les recommandations programme)
    MIN_SPORT_DAYS: 2,                  // Minimum pour un programme structuré
                                         // Vérifié : app-core.js l.4858 (sportDays>=2 → factor 1.375)

    HEAVY_STREAK_RESET_ON_REST: true,   // Invariant N02 — streak reset sur repos
                                         // Vérifié : app-core.js l.6930 (_heavyStreak = trainedTodayHeavy ? prev+1 : 0)

    // ── PREMIUM / AUTH ───────────────────────────────────────────────────────
    // Sources : _user-auth.js l.9, app-core.js l.4497-4499

    TRIAL_DAYS: 7,                      // Durée trial standard
                                         // Vérifié : _user-auth.js l.9 (TRIAL_DAYS=7)
                                         //           app-core.js l.4517 (setUTCDate + 7)

    PREMIUM_PLANS: ['unlimited','lifetime','premium','legend','champion','athlete','admin','paid'],
                                         // Vérifié : _user-auth.js l.93 (PREMIUM_PLANS array)
                                         //           app-core.js l.4499 (_SFC_PREMIUM_PLANS array)
                                         // Les deux sources sont identiques — 8 valeurs.

    // ── SYNC ─────────────────────────────────────────────────────────────────
    // Sources : supabase-client.js l.711, l.1017-1019, l.249

    SYNC_INTERVAL_MS: 120000,           // 2 minutes — intervalle sync périodique
                                         // Vérifié : supabase-client.js l.1019 (setInterval 120000)
    SYNC_TIMEOUT_MS: 10000,             // 10s watchdog
                                         // Vérifié : supabase-client.js l.711 (setTimeout 10000)
    SYNC_EXACT_KEYS: ['mtd_muscu_program', 'mtd_muscu_ia_progress', 'mtd_muscu_generations'],
                                         // Vérifié : supabase-client.js l.249 (SYNC_EXACT array)

  };

  if (typeof window !== 'undefined') window.SFCConstants = SFCConstants;
  if (typeof module !== 'undefined') module.exports = SFCConstants;

})();
