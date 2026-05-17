/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// app-main.js — Smart Fit Coach: Router, Auth Screens, Init
(function(){
'use strict';
// Prevent browser from auto-restoring scroll position on back/forward navigation
if (window.history && window.history.scrollRestoration) { window.history.scrollRestoration = 'manual'; }
var S = window.S;
var h = window.h, txt = window.txt;

// ─── APP VERSION (used by crash-reporter & feedback-widget) ───
window.APP_VERSION = '2.5.0';

// ─── NAVIGATION CALLBACKS for dashboard ───
window.APP_NAVIGATE = function(view) {
 S.view = view;
 render();
};
window.APP_RENDER = function() {
 render();
};

// ─── PROFILE PERSISTENCE (E-01) ───
var PROFILE_KEYS = [
 'prenom','nom','phone','sex','age','birthDate','weight','height','activity','train','sleep','medical','goal','targetWeight',
 'mealsPerDay','eatingLocation','mealPrepTime','snacking','alcoholFreq','alcoholTypes','hydration',
 'cookLevel','whey','allergies','intolerances','regime','allowPork','allowAlcohol','excluded','cuisines',
 'shopFreq','shopStores','shopBudget','shopPrefs',
 'bodyZones','strongZones','weakZones',
 'pregnant','pregnancyWeek','prePregnancyWeight','dueDate',
 'cycleLength','lastPeriodDate','cycleTracking',
 'creatine','creatineDose','supplements',
 'sportGoals','sportLevel','sportDays','trainingDaysSelected','sportSessionDuration','sportFocus',
 'sportType','crossfitLevel','crossfitCompGoal','crossfitOpenDate',
 'trainTime',
 // CrossFit progress (calendar, current day, weekly cycle)
 'cfProgress','cfCurrentDay','crossfitWeek','crossfitCycleWeek','cfHalteroCycleWeek','selectedCrossfitDay',
 // Running
 'runningLevel','runningGoal','runningDays','runningPace','runningVO2max','runningWeek','selectedRunDay','runningProgram',
 // Hyrox
 'hyroxLevel','hyroxGoal','hyroxDays','hyroxBenchmarks','hyroxWeek','selectedHyroxDay','hyroxProgram',
 // Padel
 'padelLevel','padelGoal','padelDays','padelProfile','padelWeek','selectedPadelDay','padelProgram',
 // Golf
 'golfLevel','golfGoal','golfDays','golfHandicap','golfProfile','golfWeek','selectedGolfDay','golfProgram',
 // Triathlon
 'triathlonGoal','triathlonLevel','triathlonWeak',
 'triathlonSwimPace','triathlonBikePace','triathlonRunPace','triathlonWeek','selectedTriDay',
 'triathlonFTP','triathlonRaceDate','triathlonProgram',
 // Cycling
 'cyclingLevel','cyclingGoal','cyclingDays','cyclingType','cyclingFTP','cyclingSpeed','cyclingRelief',
 'cyclingWeek','selectedCyclingDay','cyclingProgram',
 // Calisthenics
 'calisthenicsLevel','calisthenicsGoal','calisthenicsdays','calisthPullups','calisthPushups',
 'calisthenicsEquipment','calisthDips','calisthCurrentWeek',
 'calisthenicsWeek','selectedCalisthDay','calisthenicsProgram',
 // Musculation
 'muscuWeek','muscuCycle','muscuProgramCount','sportSplashDone','nStep','sStep','selectedSportDay',
 'sportProgram','_sportProgramVersion',
 'competitionGoal','competitionDate','competitionType','sportHobbies',
 'bonusExercises','sessionHistory','customSessionHistory',
 'muscuSessionLog','muscuProgressionHistory','musculationWeights','sportEquipment','installations',
 // Nutrition plan
 'shopChecked','weekPlan','selectedDay','_weekPlanGeneratedAt','nutritionLog','waterToday','waterTodayDate',
 // System
 'lang','weightUnit','heightUnit',
 'muscuMedical','crossfit1RM','muscuStrengthProfile','muscuProgramStart',
 'heartRateRest','yogaLevel','yogaGoal','yogaObjectif','yogaDuration','yogaStyle','yogaDays','yogaWeek','yogaDay',
 'crossfitBenchmarks',
 'weightHistory',
 'wantsDessert',
 'wheyFlavors','saladBuilder',
 'emailOptin',
 // POLISH 2026-04 (NOTIFS) : opt-out toggle PWA push notifications
 'pushNotifsEnabled',
 'profilePhoto','photoFront','photoBack',
 'mealTimes','restDayMood',
 'todayWellness',
 'aiCoachHistory',
 'appMode',
 'stress',
 'cfDeloadRecommended',
 'sessionPostponed',
 // New keys
 'waist',
 'mealsLogged',
 'parqDone',
 'parqResult',
 'sportMedDone',
 '_sportMedType',
 'streakFreezeUsedMonth',
 'streakFreezeAvailable',
 'swapCount',
 'welcomeShown',
 'firstLoginDate',
 'sportMixEnabled',
 'sportMixSecondary',
 '_bodyFatEstimate',
 '_bodyCompositionProfile',
 '_bodyCompositionWeight',
 'bodyScanDone',
 '_parqNextStep',
 '_sportProfileDone',
 '_switchedFromSport',
 '_switchedFromNutrition',
 // Recettes favorites (id → étoiles 1-3)
 'favoriteRecipes',
 // FIX VALIDATION WEEKPLAN 2026-04 : flags de validation utilisateur
 'weekPlanValidated', 'weekPlanValidatedISOWeek',
 // FIX VALIDATION SPORTPROGRAM 2026-04 : même pattern pour programme muscu
 'sportProgramValidated', 'sportProgramValidatedAt',
 // COACH ADAPTATIF 2026-04 (phase A) : feedback séances pour progression pilotée
 'sessionFeedback',
 // Timestamp dernière sync cloud — comparaison anti-écrasement dans SupaSync.syncOnLogin
 '_cloudUpdatedAt',
 // Smart Calendar
 'weeklyCalendar',
 'smartCalendarEnabled',
 'smartCalendarDismissed',
 // Plan hash — détecte changement de paramètres nutritionnels depuis dernière génération
 '_planHash',
 // Questionnaire programme musculation enrichi
 'muscuObjectifSpecifique','muscuZonesCibles','muscuRenforcementNote',
 // Programme IA personnalisé
 'muscuIAProgram','muscuIAProgramDate',
 // Subscription fields removed — now server-authoritative on profiles.subscription_plan/end.
 // Repopulated into window.S on every loadProfile(), never persisted to localStorage,
 // so a stale or tampered local value can never bypass the server check.
 '_prePregnancyGoal',
 '_medicalDisclaimerShown',
 '_pendingEmailVerify'
];
/**
 * Slim a single meal object down to essential nutritional fields only.
 * Strips heavy fields (ingredient strings, step arrays, tags) to keep
 * localStorage usage well below the 5 MB browser quota.
 */
function slimMeal(meal) {
 if (!meal) return null;
 var slim = { _id: meal._id, n: meal.n, k: meal.k, p: meal.p, g: meal.g, l: meal.l, w: meal.w, lv: meal.lv };
 // Preserve ingredient data for custom recipes (SALAD_, sm_) that are not in RECIPES_DB
 // and cannot be re-fetched via RecipeEngine.findRecipe().
 var id = meal._id || '';
 var isCustom = id.indexOf('SALAD_') === 0 || id.indexOf('sm_') === 0;
 if (isCustom) {
 if (meal.i) slim.i = meal.i;
 if (meal._scaledIngredients) slim._scaledIngredients = meal._scaledIngredients;
 if (meal._scalingRatio !== undefined) slim._scalingRatio = meal._scalingRatio;
 if (meal.f) slim.f = meal.f;
 }
 return slim;
}

// Keys that affect the meal plan — changing any of these should invalidate weekPlan
// Includes dietary preferences (regime, halal, allergies, etc.) since filterRecipes() depends on them
var NUTRITION_PLAN_KEYS = [
 'goal', 'weight', 'activity', 'mealsPerDay', 'sex', 'age', 'height',
 'regime', 'allowPork', 'allowAlcohol', 'excluded', 'cookLevel', 'wantsDessert',
 'allergies', 'intolerances', 'cuisines', 'whey', 'sportDays', 'trainTime', 'medical',
 'trainingDaysSelected',
 'sportType', // sport type affects calorie multiplier and macros split
 'pregnant', // grossesse modifie calcTarget() et filterRecipes() — plan doit être régénéré
 'cycleTracking', 'lastPeriodDate', 'cycleLength' // cycle menstruel affecte calcTarget() via calorieAdjust
];

// FIX F6 CONTRE-AUDIT 2026-04 : clés qui affectent le programme SPORT.
// Si l'une change post-validation, devalidateSportProgram() est appelé.
// HYPERSTAB 2026-04-17 : `trainingDaysSelected` retiré volontairement —
// il détermine QUELS jours d'entraînement (lundi/mercredi/...) mais PAS
// la structure du split (qui dépend de `sportDays`, le NOMBRE de jours).
// Les générateurs (muscu/running/triathlon/hyrox/cycling/calisthenics/yoga)
// n'utilisent aucun `trainingDaysSelected`, donc changer les jours sans
// changer leur nombre ne doit pas régénérer ni dévalider le programme sport.
// `trainingDaysSelected` reste dans NUTRITION_PLAN_KEYS (carb cycling).
//
// Sprint 2 F2 revert (audits Symbiose + UX) : l'idée d'ajouter
// `runningDays/hyroxDays/padelDays/golfDays/cyclingDays` a été tentée puis
// retirée. Raisons cumulées :
//   1. Le guard saveProfile ligne ~247 `if (!raw3 || !S.sportProgram) return`
//      exit tôt pour un runner (S.sportProgram est null, le plan vit dans
//      S.runningProgram). L'ajout était donc un no-op silencieux.
//   2. Même sans le guard, le bandeau "Confirmez votre programme" ne
//      régénère pas S.runningProgram ; l'user cliquerait "Confirmer" sur
//      un plan périmé → désync validée (pire que la désync silencieuse
//      pré-existante).
// Fix propre reporté : étendre le guard + pipeline de régénération par
// sportType depuis le bandeau. À traiter dans un sprint dédié.
var SPORT_PROGRAM_KEYS = [
 'sportLevel', 'sportDays', 'sportEquipment', 'sportType', 'sportGoals',
 'sportFocus', 'muscuMedical',
 'sportMixEnabled', 'sportMixSecondary',
 'pregnant', 'pregnancyWeek', // grossesse filtre les exercices dangereux → programme doit être régénéré
 'weight' // poids impacte estimateBaseLoad (débutants sans 1RM) et suggestionsPoids
];

// ─── SAFE STORAGE WRAPPER (Safari private mode — throws QuotaExceededError on write) ───
window.safeStorage = (function() {
  function _onUnavailable(storeName, err) {
    if (window._sfcStorageUnavailableShown) return;
    window._sfcStorageUnavailableShown = true;
    console.warn('[SFC] ' + storeName + ' unavailable (Safari private mode?):', err && err.message);
    setTimeout(function() {
      if (window.showToast) {
        window.showToast(
          (window.isEnglish && window.isEnglish())
            ? 'Private browsing detected — your data will not be saved locally. Enable cloud sync or exit private mode.'
            : 'Navigation privée détectée — vos données ne seront pas sauvegardées localement. Activez la synchro cloud ou quittez le mode privé.',
          'warning', 8000
        );
      }
    }, 1000);
  }
  function _wrap(store, name) {
    return {
      getItem:    function(k)    { try { return store.getItem(k); }         catch(e) { return null; } },
      setItem:    function(k, v) { try { store.setItem(k, v); return true; } catch(e) { _onUnavailable(name, e); return false; } },
      removeItem: function(k)    { try { store.removeItem(k); return true; } catch(e) { return false; } }
    };
  }
  return { local: _wrap(localStorage, 'localStorage'), session: _wrap(sessionStorage, 'sessionStorage') };
})();

function saveProfile() {
 try {
 // FIX V7 2026-04 : si loadProfile a détecté un decode corrompu, on REFUSE de sauver
 // pour ne pas écraser le backup avec les valeurs par défaut de S.
 // L'utilisateur doit reload la page pour clear ce flag (et idéalement contacter support).
 if (S._loadCorrupted) {
   console.warn('[saveProfile] BLOQUÉ — données corrompues détectées au load. Reload nécessaire.');
   if (!window._corruptedToastShown && window.showToast) {
     window._corruptedToastShown = true;
     window.showToast((window.isEnglish && window.isEnglish()) ? 'Corrupted data detected. Reload the page to restore.' : 'Données corrompues détectées. Rechargez la page pour restaurer.', 'error', 6000);
   }
   return;
 }
 // FIX V4 2026-04 : si Supabase est en train de restorer la session (~12s au démarrage),
 // getUser() retourne null à tort → on écrirait dans mtd_profile_anon au lieu du vrai uid.
 // On bloque pour éviter la perte de données. saveProfile sera re-déclenché après restore.
 if (window.AUTH && typeof window.AUTH.isAuthRestoring === 'function' && window.AUTH.isAuthRestoring()) {
   console.log('[saveProfile] DIFFÉRÉ — session Supabase en cours de restauration');
   window._profileDirty = true; // Ensure retry after restore completes (prevents data loss on early tab close)
   return;
 }
 var user = AUTH.getUser();
 var uid = user ? user.id : 'anon';

 // Validation silencieuse — ne jamais bloquer le rendu avec alert()
 // Les valeurs invalides sont corrigées par les onblur des inputs de renderStep3

 // Check if nutrition-relevant values changed vs what is currently persisted.
 // If so, weekPlan is stale and must be invalidated before saving.
 (function() {
 try {
 var raw2 = localStorage.getItem('mtd_profile_' + uid);
 if (!raw2 || !S.weekPlan) return; // nothing to compare or no plan to invalidate
 var prev = null;
 if (window._storageDecode) { prev = window._storageDecode(raw2); }
 if (prev == null) { try { prev = JSON.parse(raw2); } catch(e2) {} }
 if (prev == null) return;
 var planImpacted = NUTRITION_PLAN_KEYS.some(function(k) {
 var pv = prev[k], sv = S[k];
 // Si la clé était absente du profil sauvegardé, impossible qu'elle ait "changé"
 // (évite faux positif quand un nouveau champ est ajouté à NUTRITION_PLAN_KEYS)
 if (pv === undefined) return false;
 // For arrays/objects use JSON serialization; for primitives use strict equality
 // Note: typeof null === 'object' en JS — exclure null pour éviter les faux positifs
 // (ex: pv=null vs sv=[] → "null" !== "[]" → invaliderait le plan à tort)
 if ((typeof pv === 'object' && pv !== null) || (typeof sv === 'object' && sv !== null)) {
 return JSON.stringify(pv) !== JSON.stringify(sv);
 }
 return pv !== sv;
 });
 if (planImpacted) {
 // FIX VALIDATION WEEKPLAN 2026-04 : dévalidation (pas de nullification)
 // Avant : le plan était détruit si un paramètre changeait → régénération automatique
 //         au prochain renderStep9, user perdait son plan sans savoir pourquoi.
 // Maintenant : plan préservé, flag dévalidé, bandeau "Revalider" apparaît.
 if (window.devalidateWeekPlan) window.devalidateWeekPlan('planImpacted saveProfile');
 else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
 }
 } catch(e2) {}
 })();

 // FIX VALIDATION SPORT 2026-04 (F6) : détection symétrique au plan nutrition.
 // Si un paramètre sport change alors qu'un programme existait → dévalidation
 // (programme préservé, flag reset, bandeau de revalidation apparaît).
 // FIX BUG-SPORT-DEVALIDATE 2026-04 : le guard `!S.sportProgram` sortait tôt pour
 // running/cycling/triathlon/hyrox/padel/yoga/calisthenics dont le programme vit dans
 // S.runningProgram, S.cyclingProgram, etc. — pas dans S.sportProgram.
 // La dévalidation ne se déclenchait jamais pour ces sportTypes quand sportLevel/sportDays changeait.
 // Correction : vérifier tous les programmes sport connus avant de sortir.
 (function() {
 try {
 var raw3 = localStorage.getItem('mtd_profile_' + uid);
 var _hasAnySportProgram = !!(S.sportProgram || S.runningProgram || S.cyclingProgram
   || S.triathlonProgram || S.hyroxProgram || S.padelProgram || S.calisthenicsProgram
   || S.golfProgram || S.yogaProgram || S.muscuIAProgram);
 if (!raw3 || !_hasAnySportProgram) return;
 var prev = null;
 if (window._storageDecode) { prev = window._storageDecode(raw3); }
 if (prev == null) { try { prev = JSON.parse(raw3); } catch(e2) {} }
 if (prev == null) return;
 var sportImpacted = SPORT_PROGRAM_KEYS.some(function(k) {
 var pv = prev[k], sv = S[k];
 if (pv === undefined) return false;
 if ((typeof pv === 'object' && pv !== null) || (typeof sv === 'object' && sv !== null)) {
 return JSON.stringify(pv) !== JSON.stringify(sv);
 }
 return pv !== sv;
 });
 if (sportImpacted) {
 if (window.devalidateSportProgram) window.devalidateSportProgram('sportImpacted saveProfile');
 else if (typeof S.sportProgramValidated !== 'undefined') S.sportProgramValidated = false;
 }
 } catch(e2) {}
 })();

 var data = {};
 PROFILE_KEYS.forEach(function(k) { data[k] = S[k]; });
 // Slim weekPlan before serializing: strip ingredient/step/tag fields so
 // 7 days × 4 meals of full recipe objects don't blow up localStorage.
 if (Array.isArray(data.weekPlan)) {
 data.weekPlan = data.weekPlan.map(function(day) {
 if (!day) return day;
 return {
 breakfast: slimMeal(day.breakfast),
 lunch: slimMeal(day.lunch),
 snack: slimMeal(day.snack),
 dinner: slimMeal(day.dinner)
 };
 });
 }
 // Use XOR+base64 obfuscation to deter trivial localStorage inspection
 if (window._storageEncode) {
 var encoded = window._storageEncode(data);
 if (encoded) {
 localStorage.setItem('mtd_profile_' + uid, encoded);
 // Sync vers Supabase (debounced)
 if (window.SupaSync) SupaSync.scheduleSave();
 return;
 }
 }
 // Fallback: plain JSON (if encoding unavailable)
 localStorage.setItem('mtd_profile_' + uid, JSON.stringify(data));
 } catch(e) {
   console.warn('Storage quota exceeded ou erreur localStorage:', e);
   var _isQuota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || (e.message && e.message.indexOf('quota') !== -1));
   if (_isQuota) {
     // ─── P0 FIX 2026-04 : quota localStorage — cleanup auto + retry + toast répété ───
     // Étape 1 : purger les clés obsolètes (vieux caches, vieux users, vieux logs)
     var recovered = false;
     try {
       var purgeable = [];
       for (var i = 0; i < localStorage.length; i++) {
         var k = localStorage.key(i);
         if (!k) continue;
         // Priorité de purge : caches OFF, logs, anciennes sessions, journaux anciens
         if (/^_fjOFF_|^mtd_blackbox_|^mtd_quote_|^mtd_off_cache_|^_log_|^mtd_plan_cache_/.test(k)) {
           purgeable.push(k);
         }
       }
       // Purger aussi les profils d'autres users (si multi-compte sur même device)
       for (var j = 0; j < localStorage.length; j++) {
         var k2 = localStorage.key(j);
         if (k2 && /^mtd_profile_/.test(k2) && k2 !== 'mtd_profile_' + uid) purgeable.push(k2);
       }
       if (purgeable.length) {
         purgeable.forEach(function(k) { try { localStorage.removeItem(k); } catch(e2) {} });
         // Retenter le setItem après purge
         try {
           localStorage.setItem('mtd_profile_' + uid, JSON.stringify(data));
           recovered = true;
         } catch(e3) {}
       }
     } catch(e4) {}

     // Étape 2 : marquer l'échec global pour que le cloud devienne la source de vérité
     if (!recovered) {
       window._saveFailedAt = Date.now();
       // Sauvegarde d'urgence en sessionStorage (survit tant que l'onglet est ouvert)
       window.safeStorage.session.setItem('mtd_profile_emergency_' + uid, JSON.stringify(data));

       // Toast répété (une fois toutes les 10 actions, pas à chaque save pour éviter spam)
       window._quotaWarnCount = (window._quotaWarnCount || 0) + 1;
       if (window._quotaWarnCount === 1 || window._quotaWarnCount % 10 === 0) {
         if (window.showToast) {
           window.showToast('Stockage saturé — modifications non sauvegardées localement. Synchronisation cloud tentée.', 'error', 8000);
         }
       }
     } else {
       // Récupération réussie : toast informatif
       if (window.showToast) window.showToast('Espace libéré automatiquement — données sauvegardées.', 'info', 3000);
     }
   }
 }
 // Sync vers Supabase (debounced) — même si local a échoué, le cloud peut prendre le relais
 if (window.SupaSync) SupaSync.scheduleSave();
}
// Migration centralisée des anciens numéros de step vers le nouveau routing (Apr 2026)
// Appelée après loadProfile() à chaque login ou sync cloud — une seule source de vérité
function _migrateSteps() {
 // Sécurité : en mode sport-only, nStep ne doit jamais forcer la vue nutrition
 if (S.appMode === 'sport' && S.nStep > 0) { S.nStep = 0; }
 // Appliquer seulement en mode nutrition/both (jamais si appMode absent = nouvel utilisateur sans choix de mode)
 if ((S.appMode === 'nutrition' || S.appMode === 'both') && typeof S.nStep === 'number' && S.nStep >= 1 && S.nStep <= 11) {
   if (S.weekPlan) { S.nStep = 12; }
   // nStep=8 avec profil complet → jump to results
   else if (S.nStep === 8 && S.sex && S.goal !== null && S.goal !== undefined) { S.nStep = 11; }
   // nStep=8 en cours d'onboarding normal (sex renseigné mais goal pas encore choisi) — NE PAS réinitialiser
   // Seul le cas sans aucune donnée (sex null) doit reset vers step 1
   else if (S.nStep === 8 && !S.sex) { S.nStep = 1; }
   // Migrer vers step 8 UNIQUEMENT si toutes les données de base sont renseignées (utilisateur pré-migration)
   // — nStep 9 et 10 sont des steps courants à préserver — évite de sauter steps 5-7 pour nouveaux utilisateurs
   else if (S.nStep >= 1 && S.nStep <= 4 && S.sex && S.goal !== null && S.weight && S.height && S.activity !== null && S.sleep !== null) { S.nStep = 8; }
 }
 // Cas nStep=0 uniquement pour les modes nutrition (pas sport-only ni nouvel utilisateur sans appMode)
 if ((S.appMode === 'nutrition' || S.appMode === 'both') && S.nStep === 0 && (S.sex || S.goal !== null || S.weekPlan)) {
   S.nStep = S.weekPlan ? 12 : (S.goal !== null && S.weight && S.height ? 11 : (S.sex ? 2 : 1));
 }
}

function loadProfile() {
 try {
 var user = AUTH.getUser();
 var uid = user ? user.id : 'anon';
 var raw = localStorage.getItem('mtd_profile_' + uid);
 if (!raw) return;
 // Try obfuscated decode first, then fall back to plain JSON
 var data = null;
 if (window._storageDecode) {
 data = window._storageDecode(raw);
 }
 if (!data) {
 try { data = JSON.parse(raw); } catch(e2) {
   // FIX V7 2026-04 : silent decode failure → backup + flag pour bloquer saveProfile
   // Avant : return silencieux → S restait aux defaults → prochain saveProfile écrasait
   //          le profil corrompu (mais peut-être récupérable) avec les valeurs par défaut.
   // Maintenant : on backup le raw corrompu pour récupération manuelle, et on flag S
   //              pour empêcher saveProfile d'écraser tant que l'user n'a pas reload.
   try {
     var _ts = new Date().toISOString().replace(/[:.]/g, '-');
     var _bkKey = 'mtd_profile_BACKUP_' + uid + '_' + _ts;
     localStorage.setItem(_bkKey, raw);
     console.error('[loadProfile] DATA CORRUPTED — backed up to ' + _bkKey + ' — saveProfile désactivé jusqu\'au prochain reload');
   } catch(eb) { console.error('[loadProfile] backup also failed:', eb); }
   S._loadCorrupted = true;
   setTimeout(function(){ if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Profile error — reload the page to restore your data.' : 'Profil endommagé — rechargez la page pour restaurer vos données.', 'error', 8000); }, 800);
   return;
 }
 }
 if (!data) {
   // raw existait mais decode a retourné null sans throw → corruption silencieuse
   try {
     var _ts2 = new Date().toISOString().replace(/[:.]/g, '-');
     var _bkKey2 = 'mtd_profile_BACKUP_' + uid + '_' + _ts2;
     localStorage.setItem(_bkKey2, raw);
     console.error('[loadProfile] DECODE retourné null — backup ' + _bkKey2 + ' — saveProfile désactivé');
   } catch(eb2) { console.error('[loadProfile] backup also failed:', eb2); }
   S._loadCorrupted = true;
   setTimeout(function(){ if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Profile error — reload the page to restore your data.' : 'Profil endommagé — rechargez la page pour restaurer vos données.', 'error', 8000); }, 800);
   return;
 }
 // Prototype pollution guard: reject any parsed object that carries dangerous keys
 if (Object.prototype.hasOwnProperty.call(data, '__proto__') ||
     Object.prototype.hasOwnProperty.call(data, 'constructor') ||
     Object.prototype.hasOwnProperty.call(data, 'prototype')) {
   console.warn('[loadProfile] Prototype pollution attempt detected — ignoring localStorage data');
   return;
 }
 PROFILE_KEYS.forEach(function(k) { if (data[k] !== undefined) S[k] = data[k]; });
 // Defensive rehydration: ensure object/array fields are never null after load
 var _objFields = ['sportFocus','bonusExercises','sessionHistory','muscuSessionLog',
 'muscuProgressionHistory','musculationWeights','muscuStrengthProfile','crossfit1RM',
 'hyroxBenchmarks','shopChecked','bodyZones','crossfitBenchmarks','muscuMedical',
 'favoriteRecipes',
 // FIX BUG-3 contre-audit phase A : sessionFeedback dans rehydration défensive.
 // Si user B se logge avec un storage SANS sessionFeedback, la forEach ligne 346
 // ne l'écrase pas (data[k]=undefined) → S conserve le feedback de user A (leak).
 // Le forEach ci-dessous force un reset à {} si absent/mal typé → isolation garantie.
 'sessionFeedback'];
 _objFields.forEach(function(f) { if (!S[f] || typeof S[f] !== 'object' || Array.isArray(S[f])) S[f] = {}; });
 var _arrFields = ['sportGoals','medical','allergies','intolerances','cuisines',
 'shopStores','shopPrefs','strongZones','weakZones',
 'train','supplements','wheyFlavors','alcoholTypes',
 'calisthenicsEquipment','calisthenicsGoal','weightHistory','trainingDaysSelected','sportHobbies',
 'aiCoachHistory','muscuZonesCibles','installations'];
 _arrFields.forEach(function(f) { if (!Array.isArray(S[f])) S[f] = []; });
 // weekPlan / weeklyCalendar are null or array — parse strings, reject everything else
 if (S.weekPlan && typeof S.weekPlan === 'string') { try { S.weekPlan = JSON.parse(S.weekPlan); } catch(e) { S.weekPlan = null; } }
 if (S.weekPlan !== null && !Array.isArray(S.weekPlan)) S.weekPlan = null;
 if (S.weeklyCalendar && typeof S.weeklyCalendar === 'string') { try { S.weeklyCalendar = JSON.parse(S.weeklyCalendar); } catch(e) { S.weeklyCalendar = null; } }
 if (S.weeklyCalendar !== null && !Array.isArray(S.weeklyCalendar)) S.weeklyCalendar = null;
 // mealTimes is an object {breakfast,lunch,snack,dinner} — reject malformed values
 if (S.mealTimes !== null && S.mealTimes !== undefined && (typeof S.mealTimes !== 'object' || Array.isArray(S.mealTimes))) S.mealTimes = null;
 // excluded is a string (comma-separated), not an array — guard separately
 if (typeof S.excluded !== 'string') S.excluded = '';
 // New fields: safe defaults if not present
 if (S.waist === undefined) S.waist = null;
 if (S.mealsLogged === undefined) S.mealsLogged = {};
 if (S.parqDone === undefined) S.parqDone = false;
 if (S.parqResult === undefined) S.parqResult = null;
 if (S.streakFreezeUsedMonth === undefined) S.streakFreezeUsedMonth = null;
 if (!S.streakFreezeAvailable && S.streakFreezeAvailable !== false) S.streakFreezeAvailable = true;
 if (S.swapCount === undefined) S.swapCount = 0;
 if (S.bodyScanDone === undefined) S.bodyScanDone = false;
 if (S._bodyFatEstimate === undefined) S._bodyFatEstimate = null;

 // ─── FIX P1 DATA INTEGRITY 2026-04-17 — REPAIR ON LOAD ───
 // Corrige les corruptions silencieuses (string au lieu de number, flag désync, clés mortes).
 // Exécuté à CHAQUE loadProfile — absorbe 50% des dégâts de corruption historique.
 try {
   // 1. Repair numeric fields (peuvent devenir string via vieilles migrations)
   if (typeof S.weight === 'string') { var _w = parseFloat(S.weight); S.weight = isNaN(_w) ? null : _w; }
   if (S.weight !== null && S.weight !== undefined && (S.weight <= 0 || S.weight > 300)) S.weight = null;
   if (typeof S.targetWeight === 'string') { var _tw = parseFloat(S.targetWeight); S.targetWeight = isNaN(_tw) ? null : _tw; }
   if (S.targetWeight !== null && S.targetWeight !== undefined && (S.targetWeight <= 0 || S.targetWeight > 300)) S.targetWeight = null;
   if (typeof S.height === 'string') { var _h = parseFloat(S.height); S.height = isNaN(_h) ? null : _h; }
   // BUG FIX: le guard précédent n'avait pas de borne inférieure (>0) — une taille en mètres
   // (ex: 1.75) passait silencieusement mais faisait échouer calcBMR() (garde height<100).
   // Maintenant : toute valeur < 100 ou > 260 est rejetée (nullifiée) dès le chargement du profil.
   if (S.height !== null && S.height !== undefined && (S.height < 100 || S.height > 260)) S.height = null;
   if (typeof S.age === 'string') { var _a = parseInt(S.age, 10); S.age = isNaN(_a) ? null : _a; }
   if (S.age !== null && S.age !== undefined && (S.age < 10 || S.age > 120)) S.age = null;
   if (typeof S.prePregnancyWeight === 'string') { var _pw = parseFloat(S.prePregnancyWeight); S.prePregnancyWeight = isNaN(_pw) ? null : _pw; }
   // Coerce nStep/sStep — peuvent être stockés comme string dans certaines migrations
   if (typeof S.nStep === 'string') { var _ns = parseInt(S.nStep, 10); S.nStep = isNaN(_ns) ? 0 : _ns; }
   if (typeof S.sStep === 'string') { var _ss = parseInt(S.sStep, 10); S.sStep = isNaN(_ss) ? 0 : _ss; }
   // Bornes nStep [0..12] et sStep [0..30]
   if (typeof S.nStep === 'number' && (S.nStep < 0 || S.nStep > 12)) S.nStep = 0;
   if (typeof S.sStep === 'number' && (S.sStep < 0 || S.sStep > 30)) S.sStep = 0;

   // 2. Repair validation flags désynchronisés (flag=true mais programme=null)
   if (S.weekPlanValidated && !S.weekPlan) S.weekPlanValidated = false;
   // Exhaustif : couvre tous les types de programmes sport (référence : today-dashboard.js:4166)
   if (S.sportProgramValidated
       && !S.sportProgram && !S.muscuIAProgram
       && !S.runningProgram && !S.cyclingProgram
       && !S.triathlonProgram && !S.hyroxProgram
       && !S.padelProgram && !S.calisthenicsProgram) {
     S.sportProgramValidated = false;
   }

   // 3. Note : pas de suppression de clés localStorage ici — mtd_muscu_program,
   //    mtd_muscu_ia_progress, mtd_muscu_generations sont TOUJOURS utilisées
   //    (muscu-program-generator.js ligne 18 + supabase-client.js ligne 167 les sync).
   //    L'audit les avait marquées "legacy" à tort. On ne les touche pas.
 } catch(_eRepair) { console.warn('[loadProfile] repair failed:', _eRepair && _eRepair.message); }

 // Reset ephemeral UI state that should not persist across sessions
 // FIX 2026-04-16 : ajoute S.view au reset pour forcer 'today' au prochain loadProfile.
 // (S.view n'est pas dans PROFILE_KEYS mais les routeurs _resolvePostLoginView / _doAutoLogin
 //  le rétablissent après loadProfile — ce reset garantit qu'il ne reste pas sur 'sport'
 //  si le dernier saveProfile a été appelé pendant une navigation sport.)
 S.view = null; // sera résolu par _resolvePostLoginView / _doAutoLogin après loadProfile
 S.shopListOpen = false;
 S.smoothieBarOpen = false;
 S._showCompletionFirst = false;
 S._addMealModalSlot = null;
 S.modalRecipe = null;
 S.modalSmoothie = null;
 S._recipePicker = null;
 if (S.saladBar) S.saladBar.open = false;
 } catch(e) {}
}

// Expose persistence functions globally so other modules can call them
window.saveProfile = saveProfile;
window.loadProfile = loadProfile;

// ─── WELCOME SCREEN (first connection) ───
window.renderWelcomeScreen = function renderWelcomeScreen(app) {
 if (!app || !app.nodeType) return; // FIX edge audit : guard p=null
 // Safe first name retrieval — S.prenom preferred, fallback to auth name, no crash
 var _u = window.AUTH ? window.AUTH.getUser() : null;
 // FIX P0 stability 2026-04-17 : typeof check supplémentaire (crash si _u.name non-string)
 var _nameFromAuth = '';
 if (_u && typeof _u.name === 'string' && _u.name.trim()) {
   var _partsAuth = _u.name.trim().split(/\s+/).filter(Boolean);
   _nameFromAuth = (_partsAuth[0] || '').trim();
 }
 var _name = (window.S && typeof window.S.prenom === 'string' && window.S.prenom.trim())
   || _nameFromAuth || '';
 var _cap = _name ? _name.charAt(0).toUpperCase() + _name.slice(1) : '';
 var _titleText = _cap
   ? (_cap + ', nous allons apprendre \u00e0 vous conna\u00eetre.')
   : 'Nous allons apprendre \u00e0 vous conna\u00eetre.';

 var wrap = h('div', {
   style: 'position:fixed;inset:0;background:var(--ivory,#FAF9F6);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;overflow-y:auto;'
 });

 var inner = h('div', {
   style: 'width:100%;max-width:360px;display:flex;flex-direction:column;align-items:center;text-align:center;'
 });

 // Éléments — animation stagger individuelle (plus premium qu'un seul bloc)
 var logo = h('div', {
   style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:48px;opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease;'
 }, '\u25C6 SMARTFITCOACH');

 var titre = h('div', {
   style: 'font-family:Georgia,serif;font-size:clamp(28px,8vw,36px);font-weight:normal;line-height:1.15;letter-spacing:-.02em;color:var(--black,#0A0A09);margin-bottom:20px;opacity:0;transform:translateY(16px);transition:opacity .7s ease,transform .7s ease;'
 }, _titleText);

 var sousTitre = h('div', {
   style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;letter-spacing:.35em;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:40px;opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease;'
 }, 'Votre corps a une logique. Nous allons la lire.');

 // Corps phrase 1 — courte, italique, noire
 var corps1 = h('div', {
   style: 'font-family:Georgia,serif;font-style:italic;font-size:15px;line-height:1.75;color:var(--black,#0A0A09);max-width:300px;margin-bottom:24px;opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease;'
 }, 'Avant de vous proposer quoi que ce soit, nous vous \u00e9coutons.');

 // Corps phrase 2 — longue, analytique, grise (Helvetica Neue light)
 var corps2 = h('div', {
   style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:300;line-height:1.85;color:var(--grey,#6B6B65);max-width:320px;margin-bottom:24px;opacity:0;transform:translateY(16px);transition:opacity .65s ease,transform .65s ease;'
 });
 corps2.appendChild(document.createTextNode('Votre m\u00e9tabolisme, votre composition corporelle, votre rythme de vie, vos heures de sommeil, la fa\u00e7on dont vous bougez et dont vous mangez \u2014 chaque donn\u00e9e que vous nous confierez sera le mat\u00e9riau d\u2019un programme qui ne ressemblera \u00e0 aucun autre.'));

 // Corps phrase 3 — courte, forte, uppercase (déclaration finale)
 var corps3 = h('div', {
   style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:500;letter-spacing:.25em;text-transform:uppercase;color:var(--black,#0A0A09);margin-bottom:40px;opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease;'
 }, 'Ce que vous \u00eates construit ce que vous recevrez.');

 var divider = h('div', {
   style: 'width:100%;max-width:260px;height:1px;background:var(--border,#D8D8D0);margin-bottom:36px;opacity:0;transition:opacity .5s ease;'
 });

 // CTA — conforme .btn-primary (9px, border, border-radius:2px, hover/active)
 var cta = h('button', {
   style: 'width:100%;max-width:360px;padding:18px 28px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;letter-spacing:.4em;text-transform:uppercase;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .2s ease,transform .15s ease;margin-bottom:24px;opacity:0;transform:translateY(16px);',
   onmouseenter: function(e){ e.currentTarget.style.background='var(--black2,#181818)'; },
   onmouseleave: function(e){ e.currentTarget.style.background='var(--black,#0A0A09)'; },
   onmousedown:  function(e){ e.currentTarget.style.transform='scale(0.98)'; },
   onmouseup:    function(e){ e.currentTarget.style.transform='scale(1)'; },
   onclick: function() {
     if (window.S) S.welcomeShown = true;
     window._profileDirty = true;
     saveProfile();
     window.render();
   }
 }, (window.isEnglish && window.isEnglish() ? 'DISCOVER MY PROGRAM' : 'D\u00c9COUVRIR MON PROGRAMME'));

 var signature = h('div', {
   style: 'font-family:Georgia,serif;font-style:italic;font-size:12px;line-height:1.7;color:var(--grey,#6B6B65);max-width:280px;text-align:center;opacity:0;transform:translateY(12px);transition:opacity .6s ease,transform .6s ease;'
 }, 'Un programme qui vous ressemble n\u2019existe pas encore. Il va na\u00eetre ici.');

 inner.appendChild(logo);
 inner.appendChild(titre);
 inner.appendChild(sousTitre);
 inner.appendChild(corps1);
 inner.appendChild(corps2);
 inner.appendChild(corps3);

 var timingPill = h('div', {
   style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#9A9A90);margin-top:8px;opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease;'
 }, '~5 min · Vos données restent sur l\'appareil');
 inner.appendChild(timingPill);

 inner.appendChild(divider);
 inner.appendChild(cta);
 inner.appendChild(signature);

 wrap.appendChild(inner);
 app.appendChild(wrap);

 // Staggered entrance — chaque élément apparaît individuellement
 var _animEls = [logo, titre, sousTitre, corps1, corps2, corps3, timingPill, divider, cta, signature];
 var _delays  = [0, 80, 160, 240, 320, 400, 430, 460, 520, 600];
 requestAnimationFrame(function() {
   requestAnimationFrame(function() {
     _animEls.forEach(function(el, i) {
       setTimeout(function() {
         el.style.opacity = '1';
         if (el !== divider) el.style.transform = 'translateY(0)';
       }, _delays[i]);
     });
   });
 });
};

// ─── MODULE CHOICE SCREEN ───
window.renderModuleChoice = function renderModuleChoice(content) {
 if (!content || !content.nodeType) return; // FIX edge audit : guard p=null
 var c = h('div', {style: 'max-width:420px;margin:0 auto;padding:48px 20px 32px'});

 // Header — staggered entrance animation
 var eyebrowEl = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;text-align:center;opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease'}, 'SMARTFITCOACH');
 var titleEl = h('div', {style: 'font-family:Georgia,serif;font-size:clamp(28px,7vw,38px);font-weight:normal;line-height:1.1;letter-spacing:-.02em;margin:0 0 14px;color:var(--black,#1A1A18);text-align:center;opacity:0;transform:translateY(8px);transition:opacity .4s ease .08s,transform .4s ease .08s'}, 'Votre corps.\u00a0Votre programme.\nRien d\u2019autre.');
 titleEl.style.whiteSpace = 'pre-line';
 var subtitleEl = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:var(--grey,#6B6B65);line-height:1.6;letter-spacing:.01em;margin:0 auto 36px;max-width:300px;text-align:center;opacity:0;transform:translateY(6px);transition:opacity .35s ease .14s,transform .35s ease .14s'}, 'Un programme 100\u00a0% calibr\u00e9 sur tes objectifs, ta morphologie, ton rythme de vie.');
 c.appendChild(eyebrowEl);
 c.appendChild(titleEl);
 c.appendChild(subtitleEl);

 // SVG icons per card
 var _svgNutrition = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A18" stroke-width="1.5" stroke-linecap="round"><path d="M12 21C12 21 4 14 4 8.5C4 5.46 6.69 3 10 3C11.12 3 12 3.45 12 3.45C12 3.45 12.88 3 14 3C17.31 3 20 5.46 20 8.5C20 14 12 21 12 21Z"/><line x1="12" y1="8" x2="12" y2="14"/></svg>';
 var _svgSport = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A18" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="12" x2="18" y2="12"/><rect x="2" y="10" width="4" height="4" rx="1"/><rect x="18" y="10" width="4" height="4" rx="1"/></svg>';
 var _svgBoth = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A18" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';

 // Cards data — nutrition first, sport second, both third (recommended)
 var cardsData = [
   {
     title: 'Nutrition',
     desc: 'Suivi alimentaire, objectifs caloriques et qualit\u00e9 nutritionnelle.',
     badge: null, svg: _svgNutrition, delay: '.2s',
     onclick: function() {
       S.appMode = 'nutrition'; S.view = 'nutrition'; S.nStep = 1; // saute le splash (nStep=0)
       window._profileDirty = true;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       window.render();
     }
   },
   {
     title: 'Entra\u00eenement',
     desc: 'Programmes adapt\u00e9s, charge hebdomadaire et progression.',
     hint: '\u00c9valuation m\u00e9dicale incluse',
     badge: null, svg: _svgSport, delay: '.26s',
     onclick: function() {
       S.appMode = 'sport'; S.view = 'sport'; S.sStep = 0; S.nStep = 0; // nStep=0 évite le saut vers l'ancien step nutrition
       window._profileDirty = true;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       window.render();
     }
   },
   {
     title: 'Nutrition & Entra\u00eenement',
     desc: 'L\u2019approche compl\u00e8te pour des r\u00e9sultats durables.',
     hint: '\u00c9valuation m\u00e9dicale incluse',
     badge: 'RECOMMAND\u00c9', svg: _svgBoth, delay: '.32s',
     onclick: function() {
       S.appMode = 'both'; S.view = 'nutrition'; S.nStep = 1; // splash sport affiché par renderSportSplash quand l'utilisateur arrive sur Sport
       window._profileDirty = true;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       window.render();
     }
   }
 ];

 var cardsWrap = h('div', {style: 'display:flex;flex-direction:column;gap:10px;width:100%'});

 cardsData.forEach(function(card) {
   var el = h('div', {
     style: 'position:relative;display:flex;align-items:flex-start;gap:16px;padding:20px;cursor:pointer;background:var(--ivory2,#F5F4EF);border:1px solid var(--border,#E8E6DF);border-radius:2px;min-height:44px;user-select:none;-webkit-tap-highlight-color:transparent;opacity:0;transform:translateY(10px);',
     onclick: card.onclick
   });
   el.style.transition = 'border-color .18s ease,background-color .18s ease,opacity .35s ease ' + card.delay + ',transform .35s ease ' + card.delay;
   el.addEventListener('mouseenter', function() { el.style.borderColor = 'var(--black,#1A1A18)'; el.style.backgroundColor = 'var(--ivory,#FAF9F6)'; });
   el.addEventListener('mouseleave', function() { el.style.borderColor = 'var(--border,#E8E6DF)'; el.style.backgroundColor = 'var(--ivory2,#F5F4EF)'; });
   el.addEventListener('touchstart', function() { el.style.backgroundColor = '#F5F4EF'; }, {passive: true});

   // SVG icon
   var iconWrap = h('div', {style: 'flex-shrink:0;margin-top:2px'});
   iconWrap.innerHTML = (typeof window._sfcSanitize === 'function') ? window._sfcSanitize(card.svg) : card.svg;
   el.appendChild(iconWrap);

   // Text
   var left = h('div', {style: 'display:flex;flex-direction:column;gap:4px;flex:1'});
   left.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);letter-spacing:.01em;line-height:1.2'}, card.title));
   left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);line-height:1.55;letter-spacing:.01em'}, card.desc));
   if (card.hint) {
     left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:6px;'}, card.hint));
   }
   el.appendChild(left);

   // Badge RECOMMANDÉ — absolute top-right
   if (card.badge) {
     el.appendChild(h('div', {style: 'position:absolute;top:-1px;right:-1px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:#FAF9F6;background:var(--black,#1A1A18);padding:4px 8px;border-radius:0 2px 0 2px'}, card.badge));
   }

   cardsWrap.appendChild(el);
 });
 c.appendChild(cardsWrap);

 // Footer note
 c.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-align:center;margin-top:24px;letter-spacing:.04em;opacity:.7'}, 'Vos donn\u00e9es restent sur votre appareil.'));

 content.appendChild(c);

 // Trigger entrance animations after paint
 requestAnimationFrame(function() {
   requestAnimationFrame(function() {
     [eyebrowEl, titleEl, subtitleEl].forEach(function(el) {
       el.style.opacity = '1';
       el.style.transform = 'translateY(0)';
     });
     // Utiliser Array.from(children) — plus fiable que querySelectorAll('[style*="opacity:0"]')
     // qui peut échouer si le navigateur normalise le style (ex: "opacity:0" → "opacity: 0")
     Array.from(cardsWrap.children).forEach(function(el) {
       el.style.opacity = '1';
       el.style.transform = 'translateY(0)';
     });
   });
 });
};

// ─── PROFILE PAGE ───
function renderProfilePage(container) {
 var S = window.S;
 var _pEN = window.isEnglish && window.isEnglish();
 var user = window.AUTH ? window.AUTH.getUser() : null;
 var c = h('div', {style: 'max-width:480px;margin:0 auto;padding:24px 20px 48px'});
 if (!window.SFC_PRICING_DATA && !window._sfcPricingAttempted && window.loadSFCPricing) {
   window.loadSFCPricing().then(function() { if (window.SFC_PRICING_DATA && window.render) window.render(); });
 }

 // Back button — FIX UX audit : min-height 44px (avant 12px = injoignable mobile)
 var backBtn = h('button', {
   style: 'background:none;border:none;padding:10px 14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);cursor:pointer;margin-bottom:24px;display:inline-flex;align-items:center;gap:6px;min-height:44px;',
   onclick: function() { S.view = 'today'; if (window.render) window.render(); }
 }, _pEN ? '← Back' : '← Retour');
 c.appendChild(backBtn);

 // Title
 c.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:24px;font-weight:normal;margin-bottom:4px;'}, _pEN ? 'My profile' : 'Mon profil'));
 c.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);letter-spacing:1px;margin-bottom:28px;'}, user ? (user.email || '') : ''));

 // ─── Photo + nom ───
 var photoSection = h('div', {style: 'display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
 var photoWrap = h('div', {style: 'width:64px;height:64px;border-radius:0;overflow:hidden;background:var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid var(--border);'});
 if (S.profilePhoto) {
   photoWrap.appendChild(h('img', {src: S.profilePhoto, alt: 'Photo de profil', style: 'width:100%;height:100%;object-fit:cover;'}));
 } else {
   var initials = (function() {
     var _un = user ? (user.name || user.email || '') : (S.prenom || '');
     if (S.prenom && S.nom) return (S.prenom[0] + S.nom[0]).toUpperCase();
     if (!_un) return 'S';
     var parts = _un.trim().split(/\s+/).filter(Boolean);
     if (parts.length >= 2 && parts[0] && parts[parts.length-1]) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
     return (_un[0] || 'S').toUpperCase();
   })();
   photoWrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:22px;color:var(--grey);'}, initials));
 }
 // Photo upload input
 var photoInput = document.createElement('input');
 photoInput.type = 'file';
 photoInput.accept = 'image/*';
 photoInput.style.display = 'none';
 photoInput.addEventListener('change', function() {
   var file = photoInput.files[0];
   if (!file) return;
   var reader = new FileReader();
   reader.onload = function(e) {
     // Compresser via canvas (max 400px, qualité 0.75) pour éviter dépassement localStorage
     var img = new Image();
     img.onload = function() {
       var maxSize = 400;
       var w = img.width, _h = img.height;
       if (w > maxSize || _h > maxSize) {
         if (w > _h) { _h = Math.round(_h * maxSize / w); w = maxSize; }
         else { w = Math.round(w * maxSize / _h); _h = maxSize; }
       }
       var canvas = document.createElement('canvas');
       canvas.width = w; canvas.height = _h;
       canvas.getContext('2d').drawImage(img, 0, 0, w, _h);
       S.profilePhoto = canvas.toDataURL('image/jpeg', 0.75);
       window._profileDirty = true;
       if (window.saveProfile) { try { window.saveProfile(); } catch(ex) {} }
       if (window.render) window.render();
     };
     img.src = e.target.result;
   };
   reader.readAsDataURL(file);
 });
 photoWrap.appendChild(photoInput);
 photoWrap.addEventListener('click', function() { photoInput.click(); });
 photoSection.appendChild(photoWrap);
 var nameBlock = h('div', {style: 'flex:1;'});
 var displayName = [S.prenom, S.nom].filter(Boolean).join(' ') || (user && (user.name || user.email)) || (_pEN ? 'User' : 'Utilisateur');
 nameBlock.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px;'}, displayName));
 nameBlock.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);letter-spacing:1px;cursor:pointer;text-transform:uppercase;'}, _pEN ? 'Change photo' : 'Changer la photo'));
 photoSection.appendChild(nameBlock);
 c.appendChild(photoSection);

 // ─── FICHE RÉCAPITULATIVE PREMIUM ───
 var _rl = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);';
 var _rv = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black);font-weight:500;';
 var _rw = 'display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);';
 var _sh = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin:24px 0 12px;';
 function _infoRow(label, value) {
   var r = h('div', {style: _rw});
   r.appendChild(h('span', {style: _rl}, label));
   r.appendChild(h('span', {style: _rv}, value || '\u2014'));
   return r;
 }

 // ── Section 1: Identité ──
 var sec1 = h('div', {style: 'margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
 sec1.appendChild(h('div', {style: _sh}, _pEN ? 'IDENTITY' : 'IDENTIT\u00c9'));
 sec1.appendChild(_infoRow(_pEN ? 'Sex' : 'Sexe', window.isMale(S) ? (_pEN ? 'Male' : 'Homme') : window.isFemale(S) ? (_pEN ? 'Female' : 'Femme') : null));
 sec1.appendChild(_infoRow(_pEN ? 'Age' : '\u00c2ge', S.age ? S.age + (_pEN ? ' yrs' : ' ans') : null));
 sec1.appendChild(_infoRow(_pEN ? 'Weight' : 'Poids', S.weight ? S.weight + ' kg' : null));
 // FIX D16 COHÉRENCE PRE-PREGNANCY 2026-04 : affiche le poids pré-grossesse si applicable.
 // Avant : calcTarget utilisait prePregnancyWeight (invisible dans profil) → user voyait
 //         son poids actuel (ex 75 kg) dans profil mais la cible kcal était basée sur
 //         68 kg → mismatch incompréhensible pour l'user.
 if (window.isFemale(S) && S.pregnant && S.prePregnancyWeight && S.prePregnancyWeight !== S.weight) {
   sec1.appendChild(_infoRow(_pEN ? 'Pre-pregnancy weight' : 'Poids pré-grossesse', S.prePregnancyWeight + ' kg'));
 }
 sec1.appendChild(_infoRow(_pEN ? 'Height' : 'Taille', S.height ? S.height + ' cm' : null));
 var _bmiVal = (typeof calcBMI === 'function') ? calcBMI() : null;
 sec1.appendChild(_infoRow(_pEN ? 'BMI' : 'IMC', _bmiVal ? _bmiVal.toFixed(1) : null));
 // FIX STREAK PROFIL 2026-04 : afficher le streak dans la fiche perso (source unique
 // = localStorage mtd_streak_<uid>, même source que dashboard et gamification).
 // FIX F7 CONTRE-AUDIT 2026-04 : UNIQUEMENT si user connecté (pas 'anon') pour éviter
 // leak inter-users sur device partagé (kiosk, famille).
 (function() {
   try {
     if (!user || !user.id) return; // Skip pour users anonymes
     var _uidStreak = user.id;
     var _sRaw = localStorage.getItem('mtd_streak_' + _uidStreak);
     if (_sRaw) {
       var _sObj = JSON.parse(_sRaw);
       if (_sObj && typeof _sObj.current === 'number' && _sObj.current > 0) {
         sec1.appendChild(_infoRow('Streak', _sObj.current + ' ' + window.locPlural(_sObj.current, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}})));
       }
     }
   } catch(eStreak) {}
 })();
 if (window.isFemale(S) && S.pregnant) sec1.appendChild(_infoRow(_pEN ? 'Pregnancy' : 'Grossesse', (_pEN ? 'Week ' : 'Semaine ') + (S.pregnancyWeek || '?')));
 if (window.isFemale(S) && S.cycleTracking) sec1.appendChild(_infoRow(_pEN ? 'Cycle' : 'Cycle', S.cycleLength + (_pEN ? ' days' : ' jours')));
 c.appendChild(sec1);

 // ── Section 2: Objectif & Nutrition ──
 var sec2 = h('div', {style: 'margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
 sec2.appendChild(h('div', {style: _sh}, _pEN ? 'GOAL & NUTRITION' : 'OBJECTIF & NUTRITION'));
 var _goalName = (function() { var g = window.GOALS; if (g && Array.isArray(g) && S.goal !== null && S.goal !== undefined && g[S.goal]) return g[S.goal].icon + ' ' + g[S.goal].name; return null; })();
 sec2.appendChild(_infoRow(_pEN ? 'Goal' : 'Objectif', _goalName));
 if (S.targetWeight) sec2.appendChild(_infoRow(_pEN ? 'Target weight' : 'Poids cible', S.targetWeight + ' kg'));
 // FIX COHÉRENCE PROFIL 2026-04 : utiliser getCalorieTarget/getMacroTargets (même source
 // que le dashboard) au lieu de calcTarget/calcMacros bruts.
 // Avant : profil affichait 2200 kcal (théorique jour training) tandis que dashboard
 //         affichait 1980 kcal (appliqué calMultiplier jour repos -10%). Divergence visible.
 // Maintenant : les 3 vues (profil + dashboard + planning) affichent les mêmes chiffres.
 var _tgtCal = (typeof window.getCalorieTarget === 'function')
   ? window.getCalorieTarget()
   : ((typeof calcTarget === 'function') ? calcTarget() : 0);
 if (_tgtCal > 0) sec2.appendChild(_infoRow(_pEN ? 'Calories/day' : 'Calories/jour', Math.round(_tgtCal) + ' kcal'));
 var _macros = (typeof window.getMacroTargets === 'function')
   ? window.getMacroTargets()
   : ((typeof calcMacros === 'function') ? calcMacros() : null);
 if (_macros) sec2.appendChild(_infoRow(_pEN ? 'Macros (P/C/F)' : 'Macros (P/G/L)', Math.round(_macros.p) + 'g / ' + Math.round(_macros.g) + 'g / ' + Math.round(_macros.l) + 'g'));
 var _actName = (window.ACTIVITIES && S.activity !== null && S.activity !== undefined && window.ACTIVITIES[S.activity]) ? window.ACTIVITIES[S.activity].name : null;
 sec2.appendChild(_infoRow(_pEN ? 'Activity' : 'Activit\u00e9', _actName));
 var _regNames = _pEN ? ['Omnivore', 'Pescatarian', 'Vegetarian', 'Vegan'] : ['Omnivore', 'Pesc\u00e9tarien', 'V\u00e9g\u00e9tarien', 'V\u00e9gan'];
 sec2.appendChild(_infoRow(_pEN ? 'Diet' : 'R\u00e9gime', _regNames[S.regime] || (_pEN ? 'Omnivore' : 'Omnivore')));
 if (!S.allowPork) sec2.appendChild(_infoRow(_pEN ? 'Pork' : 'Porc', _pEN ? 'Excluded' : 'Exclu'));
 if (!S.allowAlcohol) sec2.appendChild(_infoRow(_pEN ? 'Cooking alcohol' : 'Alcool cuisine', _pEN ? 'Excluded' : 'Exclu'));
 if (Array.isArray(S.allergies) && S.allergies.length > 0 && S.allergies[0] !== 'Aucune') sec2.appendChild(_infoRow(_pEN ? 'Allergies' : 'Allergies', S.allergies.join(', ')));
 if (Array.isArray(S.medical) && S.medical.length > 0) {
   var _medNames = S.medical.map(function(id) {
     var found = null;
     (window.MEDICAL || []).forEach(function(cat) { (cat.items || []).forEach(function(item) { if (item.id === id) found = item; }); });
     return found ? found.name : id;
   });
   sec2.appendChild(_infoRow(_pEN ? 'Conditions' : 'Conditions', _medNames.join(', ')));
 }
 c.appendChild(sec2);

 // ── Section 3: Sport ──
 if (S.appMode === 'sport' || S.appMode === 'both') {
   var sec3 = h('div', {style: 'margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
   sec3.appendChild(h('div', {style: _sh}, 'SPORT'));
   var _sportNames = _pEN
     ? { muscu: 'Weightlifting', crossfit: 'CrossFit', running: 'Running', triathlon: 'Triathlon', calisthenics: 'Calisthenics', hyrox: 'Hyrox', padel: 'Padel', golf: 'Golf', yoga: 'Yoga', cycling: 'Cycling' }
     : { muscu: 'Musculation', crossfit: 'CrossFit', running: 'Course \u00e0 pied', triathlon: 'Triathlon', calisthenics: 'Calisth\u00e9nics', hyrox: 'Hyrox', padel: 'Padel', golf: 'Golf', yoga: 'Yoga', cycling: 'Cyclisme' };
   sec3.appendChild(_infoRow(_pEN ? 'Primary sport' : 'Sport principal', _sportNames[S.sportType] || S.sportType || '\u2014'));
   if (S.sportMixEnabled && S.sportMixSecondary) sec3.appendChild(_infoRow(_pEN ? 'Secondary sport' : 'Sport secondaire', (_pEN ? 'Weightlifting (' : 'Musculation (') + (S.sportMixSecondary.days || 1) + (_pEN ? 'd)' : 'j)')));
   var _lvlNames = _pEN
     ? { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', elite: 'Elite' }
     : { beginner: 'D\u00e9butant', intermediate: 'Interm\u00e9diaire', advanced: 'Avanc\u00e9', elite: '\u00c9lite' };
   sec3.appendChild(_infoRow(_pEN ? 'Level' : 'Niveau', _lvlNames[S.sportLevel] || S.sportLevel || '\u2014'));
   sec3.appendChild(_infoRow(_pEN ? 'Days/week' : 'Jours/semaine', S.sportDays ? S.sportDays + (_pEN ? ' days' : ' jours') : '\u2014'));
   var _eqNames = _pEN
     ? { gym: 'Full gym', home: 'Home', dumbbells: 'Dumbbells only' }
     : { gym: 'Salle compl\u00e8te', home: 'Domicile', dumbbells: 'Halt\u00e8res uniquement' };
   sec3.appendChild(_infoRow(_pEN ? 'Equipment' : '\u00c9quipement', _eqNames[S.sportEquipment] || S.sportEquipment || '\u2014'));
   if (Array.isArray(S.sportGoals) && S.sportGoals.length > 0) {
     var _sgNames = S.sportGoals.map(function(gid) { var g = (window.SPORT_GOALS || []).find(function(x) { return x.id === gid; }); return g ? g.name : gid; });
     sec3.appendChild(_infoRow(_pEN ? 'Sport goals' : 'Objectifs sport', _sgNames.join(', ')));
   }
   // Bouton changer de sport
   sec3.appendChild(h('button', {style: 'display:block;width:100%;margin-top:16px;padding:12px;background:transparent;border:1.5px solid var(--black);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--black);cursor:pointer;transition:all 0.2s ease;min-height:44px', onclick: function() {
     S.sStep = 0; S.view = 'sport'; window.render();
   }}, '\u21bb ' + (_pEN ? 'Change sport' : 'Changer de sport')));
   c.appendChild(sec3);
 }

 // ─── Mode application ───
 var modeSection = h('div', {style: 'margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
 modeSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:4px;'}, _pEN ? 'USAGE MODE' : 'MODE D\'UTILISATION'));
 modeSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:16px;line-height:1.5;'}, _pEN ? 'Choose the modules you want to use.' : 'Choisissez les modules que vous souhaitez utiliser.'));
 var modes = _pEN ? [
   { value: 'nutrition', label: 'Nutrition only', desc: 'Food tracking and calorie goals.' },
   { value: 'sport', label: 'Sport only', desc: 'Training programs and progression.' },
   { value: 'both', label: 'Nutrition & Sport', desc: 'The complete approach. Recommended.' }
 ] : [
   { value: 'nutrition', label: 'Nutrition uniquement', desc: 'Suivi alimentaire et objectifs caloriques.' },
   { value: 'sport', label: 'Sport uniquement', desc: 'Programmes d\'entraînement et progression.' },
   { value: 'both', label: 'Nutrition & Sport', desc: 'L\'approche complète. Recommandé.' }
 ];
 modes.forEach(function(m) {
   var isActive = S.appMode === m.value;
   var modeCard = h('div', {
     style: 'padding:14px 16px;border:1px solid ' + (isActive ? 'var(--black)' : 'var(--border)') + ';margin-bottom:8px;cursor:pointer;background:' + (isActive ? 'var(--ivory2)' : 'transparent') + ';transition:border-color .2s,background .2s;',
     onclick: function() {
       var _prevMode = S.appMode;
       S.appMode = m.value;

       // Détecter si on ajoute un module qui n'a pas encore été configuré
       var _addingNutrition = (m.value === 'nutrition' || m.value === 'both') &&
         _prevMode === 'sport' &&
         (S.goal === null || S.goal === undefined) && !S.weekPlan;

       var _addingSport = (m.value === 'sport' || m.value === 'both') &&
         _prevMode === 'nutrition' &&
         (!S.sportProgram || !S.sportProgram.length);

       if (_addingNutrition) {
         // Le profil de base (sexe, poids, taille) est déjà rempli via l'onboarding sport
         // → on démarre directement au questionnaire médical nutrition (nStep 8 dans le nouveau flow)
         // Si les données de base manquent malgré tout, démarrer depuis le début (nStep 1)
         var _hasBasicProfile = S.sex && S.weight > 0 && S.height > 0;
         S.nStep = _hasBasicProfile ? 8 : 1;
         S.view = 'nutrition';
         // Marquer pour afficher un message d'explication dans l'onboarding
         S._switchedFromSport = true;
         // Pré-remplir activité + type entraînement + sommeil depuis les données sport
         // (évite que l'utilisateur resaisisse des données déjà connues)
         if (S.activity === null || S.activity === undefined) {
           var _sd = S.sportDays || 3;
           S.activity = _sd >= 5 ? 3 : _sd >= 3 ? 2 : 1; // ACTIVITIES index : 3=Très actif, 2=Modérément, 1=Légèrement
         }
         if (!Array.isArray(S.train) || S.train.length === 0) {
           var _trainMap = { musculation: [0], crossfit: [0, 1], running: [4], hyrox: [0, 1], yoga: [2], cycling: [1], triathlon: [1, 4], calisthenics: [0], padel: [3], golf: [3] };
           S.train = (S.sportType && _trainMap[S.sportType]) ? _trainMap[S.sportType] : [2];
         }
         if (S.sleep === null || S.sleep === undefined) {
           S.sleep = 2; // SLEEPS[2] = '7-8h' — valeur de référence, modifiable dans l'onboarding nutrition
         }
         // Pré-remplir l'objectif nutrition depuis les objectifs sport (évite une sélection manuelle obligatoire)
         if ((S.goal === null || S.goal === undefined) && Array.isArray(S.sportGoals) && S.sportGoals.length > 0) {
           var _sgToGoal = {muscle: 0, weightloss: 3, shred: 4, endurance: 2, flexibility: 2, general: 2};
           var _sg = S.sportGoals[0];
           if (_sgToGoal[_sg] !== undefined) S.goal = _sgToGoal[_sg];
         }
       } else if (_addingSport) {
         S.sStep = 0;
         S.view = 'sport';
         S._switchedFromNutrition = true;
       } else {
         S.view = 'today';
       }

       window._profileDirty = true;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       if (window.render) window.render();
     }
   });
   var modeRow = h('div', {style: 'display:flex;align-items:center;gap:12px;'});
   var dot = h('div', {style: 'width:14px;height:14px;border-radius:0;border:1px solid ' + (isActive ? 'var(--black)' : 'var(--line,#D8D8D0)') + ';background:' + (isActive ? 'var(--black)' : 'transparent') + ';flex-shrink:0;'});
   modeRow.appendChild(dot);
   var modeText = h('div', {});
   modeText.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:500;color:var(--black);margin-bottom:2px;'}, m.label));
   modeText.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);'}, m.desc));
   modeRow.appendChild(modeText);
   modeCard.appendChild(modeRow);
   modeSection.appendChild(modeCard);
 });
 c.appendChild(modeSection);

 // ─── Recettes favorites ───
 (function() {
   var favMap = (S.favoriteRecipes && typeof S.favoriteRecipes === 'object') ? S.favoriteRecipes : {};
   var favIds = Object.keys(favMap).filter(function(id) { return (favMap[id]|0) > 0; });
   var favSection = h('div', {style: 'margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
   var favHeader = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;'});
   favHeader.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);'}, _pEN ? 'MY FAVORITE RECIPES' : 'MES RECETTES FAVORITES'));
   favHeader.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:12px;color:var(--grey);'}, favIds.length + ' ' + window.locPlural(favIds.length, {fr:{one:'recette',other:'recettes'},en:{one:'recipe',other:'recipes'}})));
   favSection.appendChild(favHeader);
   if (!favIds.length) {
     favSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);line-height:1.6;font-style:italic;'}, _pEN ? 'Rate a recipe with ★ in your meal plan so it recurs in your weeks.' : 'Notez une recette avec ★ dans votre planning pour qu\u2019elle revienne régulièrement dans vos semaines.'));
   } else {
     // Tri : étoiles décroissantes, puis nom alphabétique
     favIds.sort(function(a, b) {
       var sa = favMap[a]|0, sb = favMap[b]|0;
       if (sa !== sb) return sb - sa;
       return a.localeCompare(b);
     });
     favIds.forEach(function(rid) {
       var stars = Math.max(1, Math.min(3, favMap[rid]|0));
       var rec = null;
       try {
         if (window.RecipeEngine && window.RecipeEngine.findRecipe) rec = window.RecipeEngine.findRecipe(rid);
       } catch(ex) { rec = null; }
       // Fallback : smoothie ou nom inconnu
       var name = (rec && (rec.n || rec.name)) || '';
       if (!name && rid && rid.indexOf('sm_') === 0 && window.WHEY_SMOOTHIES) {
         for (var i = 0; i < window.WHEY_SMOOTHIES.length; i++) {
           if (window.WHEY_SMOOTHIES[i].id === rid) { name = window.WHEY_SMOOTHIES[i].name; break; }
         }
       }
       if (!name) name = rid; // dernière sécurité : montrer l'id pour que l'user puisse retirer
       var row = h('div', {style: 'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);'});
       var nameCol = h('div', {style: 'flex:1;min-width:0;'});
       nameCol.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--black);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}, name));
       var starsRow = h('div', {style: 'display:flex;gap:4px;margin-top:2px;'});
       for (var sj = 1; sj <= 3; sj++) {
         starsRow.appendChild(h('span', {style: 'font-size:18px;line-height:1;transition:all 0.2s ease;' + (sj <= stars ? 'opacity:1' : 'opacity:0.2')}, '\u2605'));
       }
       nameCol.appendChild(starsRow);
       row.appendChild(nameCol);
       var removeBtn = h('button', {
         'aria-label': 'Retirer des favoris',
         style: 'background:none;border:1px solid var(--border);color:var(--grey);padding:6px 10px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;',
         onclick: function() {
           if (!S.favoriteRecipes) S.favoriteRecipes = {};
           delete S.favoriteRecipes[rid];
           window._profileDirty = true;
           if (window.saveProfile) { try { window.saveProfile(); } catch(ex) {} }
           if (window.render) window.render();
         }
       }, 'Retirer');
       row.appendChild(removeBtn);
       favSection.appendChild(row);
     });
   }
   c.appendChild(favSection);
 })();

 // ─── Modifier le profil (in-place editor) ───
 if (S._profileEdit) {
   // In-place edit form
   var editForm = h('div', {style: 'margin-bottom:28px;padding:20px;border:1px solid var(--border);background:var(--ivory2,#F5F3EC);'});
   editForm.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;'}, ((window.isEnglish && window.isEnglish()) ? 'EDIT MY PROFILE' : 'MODIFIER LE PROFIL')));

   // Prénom
   var _efPrenomLabel = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px;'}, ((window.isEnglish && window.isEnglish()) ? 'First name' : 'Prénom'));
   editForm.appendChild(_efPrenomLabel);
   var _efPrenom = h('input', {
     type: 'text', value: S.prenom || '',
     placeholder: ((window.isEnglish && window.isEnglish()) ? 'Your first name' : 'Votre prénom'),
     style: 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border);background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;margin-bottom:14px;outline:none;border-radius:2px;',
     oninput: function(e) { S.prenom = e.target.value; }
   });
   editForm.appendChild(_efPrenom);

   // Poids
   var _efPoidsLabel = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px;'}, ((window.isEnglish && window.isEnglish()) ? 'Weight (kg)' : 'Poids (kg)'));
   editForm.appendChild(_efPoidsLabel);
   var _efPoidsWrap = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:14px;'});
   var _efPoids = h('input', {
     type: 'number', inputmode: 'decimal', min: '30', max: '300', step: '0.1',
     value: S.weight ? String(S.weight) : '',
     placeholder: '75',
     style: 'flex:1;min-width:0;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border);background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;outline:none;border-radius:2px;',
     oninput: function(e) { var v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) { S.weight = v; S._nm = null; } }
   });
   _efPoidsWrap.appendChild(_efPoids);
   _efPoidsWrap.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);'}, 'kg'));
   editForm.appendChild(_efPoidsWrap);

   // Taille
   var _efTailleLabel = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px;'}, ((window.isEnglish && window.isEnglish()) ? 'Height (cm)' : 'Taille (cm)'));
   editForm.appendChild(_efTailleLabel);
   var _efTailleWrap = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:14px;'});
   var _efTaille = h('input', {
     type: 'number', inputmode: 'numeric', min: '120', max: '250', step: '1',
     value: S.height ? String(S.height) : '',
     placeholder: '175',
     style: 'flex:1;min-width:0;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border);background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;outline:none;border-radius:2px;',
     // BUG FIX: validation taille — rejeter les valeurs en mètres (ex: 1.75 < 100) ou hors plage.
     // Avant : v>0 acceptait 1.75 → S.height=1.75 → calcBMR() retournait 0 silencieusement.
     oninput: function(e) { var v = parseFloat(e.target.value); if (!isNaN(v) && v >= 100 && v <= 260) S.height = v; }
   });
   _efTailleWrap.appendChild(_efTaille);
   _efTailleWrap.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);'}, 'cm'));
   editForm.appendChild(_efTailleWrap);

   // Niveau d'activité
   var _efActLabel = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px;'}, ((window.isEnglish && window.isEnglish()) ? 'Activity level' : 'Niveau d\'activité'));
   editForm.appendChild(_efActLabel);
   var _efActWrap = h('div', {style: 'display:flex;flex-direction:column;gap:6px;margin-bottom:14px;'});
   var _allActivities = window.ACTIVITIES || [];
   _allActivities.forEach(function(a, i) {
     var _isAct = S.activity === i;
     var _actItem = h('div', {
       style: 'padding:10px 12px;border:1px solid ' + (_isAct ? 'var(--black)' : 'var(--border)') + ';background:' + (_isAct ? 'var(--black)' : 'transparent') + ';cursor:pointer;',
       onclick: function() { S.activity = i; if (window.render) window.render(); }
     });
     _actItem.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:' + (_isAct ? 'var(--ivory,#FAF9F6)' : 'var(--black)') + ';'}, a.name + ' — ' + a.desc));
     _efActWrap.appendChild(_actItem);
   });
   editForm.appendChild(_efActWrap);

   // Régime alimentaire
   var _efRegLabel = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px;'}, ((window.isEnglish && window.isEnglish()) ? 'Diet type' : 'Régime alimentaire'));
   editForm.appendChild(_efRegLabel);
   var _efRegWrap = h('div', {style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;'});
   var _allRegimes = window.REGIMES || [];
   _allRegimes.forEach(function(r, i) {
     var _isReg = S.regime === i;
     var _regChip = h('div', {
       style: 'padding:8px 14px;border:1px solid ' + (_isReg ? 'var(--black)' : 'var(--border)') + ';background:' + (_isReg ? 'var(--black)' : 'transparent') + ';cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:' + (_isReg ? 'var(--ivory,#FAF9F6)' : 'var(--black)') + ';',
       onclick: function() { S.regime = i; if (window.render) window.render(); }
     }, r.name);
     _efRegWrap.appendChild(_regChip);
   });
   editForm.appendChild(_efRegWrap);

   // Inclusions alimentaires — section opt-in (porc & alcool exclus par défaut)
   editForm.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px;margin-top:4px;'}, ((window.isEnglish && window.isEnglish()) ? "I include in my diet" : "J\u2019inclus dans mon alimentation")));
   var _porkRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin-bottom:10px;cursor:pointer;', onclick: function() { S.allowPork = !S.allowPork; if (window.render) window.render(); }});
   var _porkBox = h('div', {style: 'width:18px;height:18px;border-radius:2px;border:1px solid var(--black,#0A0A09);display:flex;align-items:center;justify-content:center;background:' + (S.allowPork ? 'var(--black,#0A0A09)' : 'transparent') + ';flex-shrink:0;'});
   if (S.allowPork) _porkBox.appendChild(h('span', {style: 'color:var(--ivory,#FAF9F6);font-size:10px;'}, '\u2713'));
   _porkRow.appendChild(_porkBox);
   _porkRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black);'}, ((window.isEnglish && window.isEnglish()) ? 'Pork & pork products' : 'Porc & charcuterie porcine')));
   editForm.appendChild(_porkRow);
   var _alcRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin-bottom:18px;cursor:pointer;', onclick: function() { S.allowAlcohol = !S.allowAlcohol; if (window.render) window.render(); }});
   var _alcBox = h('div', {style: 'width:18px;height:18px;border-radius:2px;border:1px solid var(--black,#0A0A09);display:flex;align-items:center;justify-content:center;background:' + (S.allowAlcohol ? 'var(--black,#0A0A09)' : 'transparent') + ';flex-shrink:0;'});
   if (S.allowAlcohol) _alcBox.appendChild(h('span', {style: 'color:var(--ivory,#FAF9F6);font-size:10px;'}, '\u2713'));
   _alcRow.appendChild(_alcBox);
   _alcRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black);'}, ((window.isEnglish && window.isEnglish()) ? 'Alcohol in cooking' : 'Alcool en cuisine')));
   editForm.appendChild(_alcRow);

   // Save button
   var _efSave = h('button', {
     style: 'display:block;width:100%;padding:18px 28px;min-height:44px;border:1px solid var(--black);background:var(--black);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;cursor:pointer;margin-bottom:8px;border-radius:2px;',
     onclick: function() {
       // FIX VALIDATION WEEKPLAN 2026-04 : dévalider au lieu de supprimer
       if (window.devalidateWeekPlan) window.devalidateWeekPlan('profile edit save');
       else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
       S._profileEdit = false;
       window._profileDirty = true;
       if (window.saveProfile) { try { window.saveProfile(); } catch(ex) {} }
       // Toast
       try {
         var _t = document.createElement('div');
         _t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;padding:12px 20px;z-index:10000;border-radius:0;border:1px solid var(--ink-900,#0A0A09);white-space:nowrap;';
         _t.textContent = (window.isEnglish && window.isEnglish()) ? '\u2713 Profile updated' : '\u2713 Profil mis \u00e0 jour';
         document.body.appendChild(_t);
         setTimeout(function() { if (_t.parentNode) _t.parentNode.removeChild(_t); }, 2500);
       } catch(ex) {}
       if (window.render) window.render();
     }
   }, (window.isEnglish && window.isEnglish()) ? 'Save' : 'Enregistrer');
   editForm.appendChild(_efSave);

   // Cancel button
   var _efCancel = h('button', {
     style: 'display:block;width:100%;padding:12px 24px;min-height:44px;border:1px solid var(--border);background:transparent;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;border-radius:2px;',
     onclick: function() { S._profileEdit = false; if (window.render) window.render(); }
   }, (window.isEnglish && window.isEnglish()) ? 'Cancel' : 'Annuler');
   editForm.appendChild(_efCancel);
   c.appendChild(editForm);
 } else {
   var editBtn = h('button', {
     style: 'display:block;width:100%;padding:14px;border:1px solid var(--black);background:var(--black);color:var(--ivory,#F8F6EF);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-bottom:12px;',
     onclick: function() { S._profileEdit = true; if (window.render) window.render(); }
   }, (window.isEnglish && window.isEnglish()) ? 'Edit my profile' : 'Modifier mon profil');
   c.appendChild(editBtn);
 }

 // ─── Changer l'objectif ───
 var changeGoalBtn = h('button', {
   style: 'display:block;width:100%;padding:14px;border:1px solid var(--border);background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-bottom:12px;',
   onclick: function() { S._goalModal = true; if (window.render) window.render(); }
 }, ((window.isEnglish && window.isEnglish()) ? 'Change my goal' : 'Changer mon objectif'));
 c.appendChild(changeGoalBtn);

 // ─── Strength Grade + Records (déplacé depuis la vue programme sport) ───
 if (window.renderStrengthGrade) {
   try { renderStrengthGrade(c); } catch(e) {}
 }
 if (window.renderCardMuscu1RM) {
   try { var _recCard = window.renderCardMuscu1RM(); if (_recCard) c.appendChild(_recCard); } catch(e) {}
 }

 // ─── MON ABONNEMENT (Hermès — ivoire, orange tabac, Georgia serif) ───
 (function() {
   try {
     // Use the authoritative isPremium() — checks _serverPremium boolean first
     var _isSub = !!(typeof window.isPremium === 'function' ? window.isPremium()
       : (S.subscriptionPlan === 'unlimited' || (S.subscriptionEnd && new Date(S.subscriptionEnd) > new Date())));
     // Loading: status not yet confirmed AND no server premium boolean available
     var _subLoading = !S._subStatusReady && S._serverPremium === undefined;
     var _daysLeft = (typeof window.getTrialDaysLeft === 'function') ? window.getTrialDaysLeft() : 0;
     var _trialExpired = !_isSub && !_subLoading && _daysLeft === 0 && !!S.firstLoginDate;
     // Debug marker — readable from console: window.SFC_SUBSCRIPTION_DEBUG
     try {
       window.SFC_SUBSCRIPTION_DEBUG = {
         statePlan: S.subscriptionPlan,
         stateEnd: S.subscriptionEnd,
         subStatusReady: S._subStatusReady,
         subLoading: _subLoading,
         isPremium: _isSub,
         daysLeft: _daysLeft,
         shouldShowTrialBanner: !_isSub && !_subLoading,
         shouldShowPaywall: !_isSub && !_subLoading,
         renderSource: 'render()',
         renderAt: new Date().toISOString()
       };
     } catch(_sde) {}

     // Palette selon état — même style Hermès neutre dans les deux cas
     var _accent = 'var(--ink-900,#0A0A09)';
     var _bgTint = 'var(--paper-2,#F4F1EA)';
     var _accentBorder = 'var(--line,#D8D8D0)';

     var card = h('div', {style:
       'margin:28px 0;padding:28px 24px;border:1px solid ' + _accentBorder + ';' +
       'background:' + _bgTint + ';border-radius:0;position:relative;'
     });

     // Label maison Hermès — filet horizontal + label
     var _topLabel = h('div', {style:
       'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;' +
       'text-transform:uppercase;color:' + _accent + ';font-weight:400;margin-bottom:18px;' +
       'display:flex;align-items:center;gap:10px;'
     });
     _topLabel.appendChild(h('span', {style: 'flex:1;height:1px;background:' + _accentBorder + ';'}));
     _topLabel.appendChild(h('span', {}, _isSub ? 'MEMBRE' : (_subLoading ? '—' : 'VERSION D\u2019ESSAI')));
     _topLabel.appendChild(h('span', {style: 'flex:1;height:1px;background:' + _accentBorder + ';'}));
     card.appendChild(_topLabel);

     // Numéro ou marqueur central Georgia — signature de la maison
     var _numRow = h('div', {style: 'text-align:center;margin-bottom:6px;'});
     if (_isSub || _subLoading) {
       // Premium confirmed, or still loading — never show trial countdown
       _numRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:40px;color:var(--black);line-height:1;'}, '\u2014'));
     } else if (_daysLeft > 0) {
       _numRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:56px;color:var(--black);line-height:1;font-weight:normal;letter-spacing:-1px;'}, String(_daysLeft)));
       _numRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-top:8px;'}, window.locPlural(_daysLeft, {fr:{one:'jour restant',other:'jours restants'},en:{one:'day left',other:'days left'}})));
     } else {
       _numRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:28px;color:var(--black);line-height:1.3;'}, (window.isEnglish && window.isEnglish()) ? 'Trial ended' : 'Essai terminé'));
     }
     card.appendChild(_numRow);

     // Sous-titre — type d'abonnement / période
     var _subtitle = '';
     if (_isSub) {
       var _noEndPlans = ['unlimited','lifetime','admin'];
       var _planLabel = (_noEndPlans.indexOf(S.subscriptionPlan) !== -1 || (S._serverPremium && !S.subscriptionEnd)) ? 'Accès illimité' : 'Abonnement actif';
       var _endStr = '';
       if (S.subscriptionEnd && _noEndPlans.indexOf(S.subscriptionPlan) === -1) {
         try {
           var _d = new Date(S.subscriptionEnd);
           var _monthName = (window.getMonthName ? window.getMonthName(_d.getMonth(), true) : ['janv.','févr.','mars','avril','mai','juin','juil.','août','sept.','oct.','nov.','déc.'][_d.getMonth()]);
           var _renewLabel = (window.tr ? window.tr('profile.renewal', 'renouvellement le') : 'renouvellement le');
           _endStr = ' · ' + _renewLabel + ' ' + _d.getDate() + ' ' + _monthName + ' ' + _d.getFullYear();
         } catch(e) {}
       }
       _subtitle = _planLabel + _endStr;
     } else if (_daysLeft > 0) {
       _subtitle = 'Toutes les fonctionnalités — sans restriction';
     } else {
       _subtitle = 'Votre période d\u2019essai de 7 jours est écoulée';
     }
     card.appendChild(h('div', {style:
       'text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;' +
       'color:var(--grey);line-height:1.6;margin-bottom:22px;padding:0 8px;'
     }, _subtitle));

     // Barre de progression fine (si trial) — style ruban Hermès
     if (!_isSub && S.firstLoginDate) {
       var _pct = Math.max(0, Math.min(100, ((7 - _daysLeft) / 7) * 100));
       var _bar = h('div', {style: 'height:2px;background:' + _accentBorder + ';margin:0 0 22px;position:relative;overflow:hidden;'});
       _bar.appendChild(h('div', {style: 'position:absolute;top:0;left:0;height:100%;width:' + _pct + '%;background:' + _accent + ';transition:width 0.6s ease;'}));
       card.appendChild(_bar);
     }

     // Liste des avantages premium — filets Hermès
     var _featsWrap = h('div', {style: 'border-top:1px solid ' + _accentBorder + ';margin-top:4px;padding-top:18px;'});
     _featsWrap.appendChild(h('div', {style:
       'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;' +
       'text-transform:uppercase;color:var(--grey);margin-bottom:14px;text-align:center;'
     }, 'Ce qui est inclus'));

     var _feats = [
       ['Scanner repas IA', 'Analyse nutritionnelle instantanée'],
       ['Coach IA illimité', 'Conversations sans restriction'],
       ['Export PDF', 'Rapports hebdomadaires complets'],
       ['Historique complet', 'Progression sur toute la durée'],
       ['Analyse corporelle', 'Composition & évolution']
     ];
     _feats.forEach(function(f) {
       var row = h('div', {style:
         'display:flex;align-items:baseline;gap:12px;padding:9px 4px;' +
         'border-bottom:1px solid rgba(216,216,208,0.5);'
       });
       row.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:11px;color:' + _accent + ';width:10px;flex-shrink:0;'}, '\u00B7'));
       var _txt = h('div', {style: 'flex:1;'});
       _txt.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black);'}, f[0]));
       _txt.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-top:2px;letter-spacing:0.3px;'}, f[1]));
       row.appendChild(_txt);
       _featsWrap.appendChild(row);
     });
     card.appendChild(_featsWrap);

     // Bloc progression réelle utilisateur — preuve sociale personnalisée
     if (!_isSub && !_subLoading) {
       (function() {
         var _uid = S.user && S.user.id;
         var _shObj = (S.sessionHistory && typeof S.sessionHistory === 'object' && !Array.isArray(S.sessionHistory)) ? S.sessionHistory : {};
         var _sessionCount = Object.keys(_shObj).length;
         var _kcalBurned = Object.keys(_shObj).reduce(function(acc, k) { return acc + ((_shObj[k] && _shObj[k].kcalTotal) || 0); }, 0);
         var _streak = 0;
         try { _streak = parseInt(localStorage.getItem('mtd_streak_' + _uid) || '0', 10) || 0; } catch(e) {}
         var _bestLift = '';
         try {
           var _mph = S.muscuProgressionHistory || {};
           var _compounds = ['Squat','Bench Press','Deadlift','Overhead Press','Pull-up'];
           var _bestGain = 0;
           _compounds.forEach(function(ex) {
             var hist = _mph[ex];
             if (!Array.isArray(hist) || hist.length < 2) return;
             var first = hist[0].weight || 0;
             var last = hist[hist.length - 1].weight || 0;
             var gain = last - first;
             if (gain > _bestGain) { _bestGain = gain; _bestLift = ex + ' +' + gain + 'kg'; }
           });
         } catch(e) {}
         var _hasData = _sessionCount > 0 || _streak > 0 || _bestLift;
         if (!_hasData) return;
         var _isEn = window.isEnglish && window.isEnglish();
         var _progBlock = h('div', {style:
           'background:rgba(122,59,14,0.06);border:1px solid rgba(122,59,14,0.15);' +
           'border-radius:6px;padding:14px 16px;margin:18px 0 4px;'
         });
         _progBlock.appendChild(h('div', {style:
           'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;' +
           'text-transform:uppercase;color:var(--orange-ink,#7A3B0E);margin-bottom:10px;'
         }, _isEn ? 'Your progress so far' : 'Votre progression'));
         var _rows = [];
         if (_sessionCount > 0) _rows.push([
           _sessionCount + ' ' + (_isEn ? (_sessionCount > 1 ? 'sessions' : 'session') : (_sessionCount > 1 ? 'séances' : 'séance')),
           Math.round(_kcalBurned) + ' kcal ' + (_isEn ? 'burned' : 'brûlées')
         ]);
         if (_streak > 1) _rows.push([
           _streak + ' ' + (_isEn ? 'day streak' : 'jours consécutifs'),
           ''
         ]);
         if (_bestLift) _rows.push([
           _isEn ? 'Best lift gain' : 'Meilleure progression',
           _bestLift
         ]);
         _rows.forEach(function(r) {
           var _row = h('div', {style: 'display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px solid rgba(122,59,14,0.1);'});
           _row.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black);'}, r[0]));
           if (r[1]) _row.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:11px;color:var(--orange-ink,#7A3B0E);'}, r[1]));
           _progBlock.appendChild(_row);
         });
         card.appendChild(_progBlock);
       })();
     }

     // Sélecteur de plan — Hermès pricing UI
     if (!_isSub && !_subLoading) {
       var _pData = window.SFC_PRICING_DATA || [];
       var _ui = window._sfcPricingUI = window._sfcPricingUI || { tier: 'athlete', duration: 'saison' };
       var _tiers = ['athlete', 'champion', 'legende'];
       var _tierLabels = { athlete: 'Athlete', champion: 'Champion', legende: 'Légende' };
       var _tierSubs  = { athlete: 'Accès complet', champion: 'Le plus choisi', legende: 'Soutien Légende' };
       var _durs = ['saison', 'cycle', 'engagement'];
       var _durLabels  = { saison: 'Trimestriel', cycle: 'Semestriel', engagement: 'Annuel' };
       var _durMonths  = { saison: 3, cycle: 6, engagement: 12 };
       var _durPeriods = { saison: '/trimestre', cycle: '/semestre', engagement: '/an' };
       function _findPlan(t, d) {
         for (var _k = 0; _k < _pData.length; _k++) {
           if (_pData[_k].tier === t && _pData[_k].duration === d) return _pData[_k];
         }
         return null;
       }
       var _selPlan = _findPlan(_ui.tier, _ui.duration);

       if (_pData.length > 0) {
         // ── Titre section ──
         var _pLabel = h('div', {style:
           'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;' +
           'text-transform:uppercase;color:var(--grey);margin:24px 0 14px;' +
           'display:flex;align-items:center;gap:10px;'
         });
         _pLabel.appendChild(h('span', {style: 'flex:1;height:1px;background:var(--border);'}));
         _pLabel.appendChild(h('span', {}, 'VOTRE PLAN'));
         _pLabel.appendChild(h('span', {style: 'flex:1;height:1px;background:var(--border);'}));
         card.appendChild(_pLabel);

         // ── Features complètes par tier (affichées dans le grand bloc) ──
         var _allFeatures = [
           { label: 'Programmes nutrition personnalisés',  tiers: ['athlete','champion','legende'] },
           { label: 'Coach IA (questions illimitées)',     tiers: ['athlete','champion','legende'] },
           { label: 'Scanner repas — codes-barres & IA',  tiers: ['athlete','champion','legende'] },
           { label: 'Générateur de programme muscu IA',   tiers: ['athlete','champion','legende'] },
           { label: 'Export PDF hebdomadaire',            tiers: ['athlete','champion','legende'] },
           { label: 'Historique & courbes de progression',tiers: ['athlete','champion','legende'] },
           { label: 'Analyse corporelle IA',              tiers: ['athlete','champion','legende'] },
           { label: 'Gamification — streaks & badges',    tiers: ['athlete','champion','legende'] },
           { label: 'Espace social & amis',               tiers: ['athlete','champion','legende'] },
           { label: 'Support prioritaire (< 24 h)',       tiers: ['champion','legende'] },
           { label: 'Accès anticipé nouvelles features',  tiers: ['champion','legende'] },
           { label: 'Badge Champion dans le profil',      tiers: ['champion','legende'] },
           { label: 'Support VIP dédié (< 4 h)',          tiers: ['legende'] },
           { label: 'Statut Membre Fondateur',            tiers: ['legende'] },
           { label: 'Badge Légende exclusif',             tiers: ['legende'] }
         ];

         // ── Tier cards (sélecteur compact — nom + prix aperçu) ──
         var _tierRow = h('div', {style: 'display:flex;gap:8px;margin-bottom:16px;'});
         _tiers.forEach(function(t) {
           var isAct = _ui.tier === t;
           var isReco = t === 'champion';
           var _preview = _findPlan(t, 'saison');
           var tcard = h('div', {
             'data-sfc-tier': t,
             style: 'flex:1;padding:14px 6px 12px;border:' + (isAct ? '2px solid #0A0A09' : '1px solid var(--border,#E8E6DF)') + ';' +
               'background:' + (isAct ? '#0A0A09' : 'transparent') + ';' +
               'cursor:pointer;text-align:center;border-radius:2px;' +
               'transition:background 0.2s,border-color 0.2s;position:relative;',
             onclick: (function(tier) { return function() { window._sfcPricingUI.tier = tier; render(); }; })(t)
           });
           if (isReco) {
             tcard.appendChild(h('div', {'data-sfc-badge': '1', style:
               'position:absolute;top:-9px;left:50%;transform:translateX(-50%);' +
               'background:' + (isAct ? '#FAF9F6' : '#0A0A09') + ';' +
               'color:' + (isAct ? '#0A0A09' : '#FAF9F6') + ';' +
               'border:1px solid #0A0A09;' +
               'font-family:"Helvetica Neue",Arial,sans-serif;' +
               'font-size:7px;letter-spacing:2px;padding:2px 7px;white-space:nowrap;'
             }, 'POPULAIRE'));
           }
           tcard.appendChild(h('div', {'data-sfc-name': '1', style:
             'font-family:Georgia,serif;font-size:13px;' +
             'color:' + (isAct ? '#FAF9F6' : '#0A0A09') + ';margin-bottom:3px;'
           }, _tierLabels[t]));
           if (_preview) {
             tcard.appendChild(h('div', {'data-sfc-price': '1', style:
               'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:600;' +
               'color:' + (isAct ? '#FAF9F6' : '#0A0A09') + ';line-height:1.2;'
             }, _preview.label_mad));
             tcard.appendChild(h('div', {'data-sfc-per': '1', style:
               'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;' +
               'color:' + (isAct ? 'rgba(250,249,246,0.55)' : 'var(--grey,#6B6B65)') + ';'
             }, '/trim.'));
           }
           _tierRow.appendChild(tcard);
         });
         card.appendChild(_tierRow);

         // ── Duration pills ──
         var _durRow = h('div', {style: 'display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;'});
         _durs.forEach(function(d) {
           var isAct = _ui.duration === d;
           var dp = _findPlan(_ui.tier, d);
           var pillTxt = _durLabels[d] || d;
           var pill = h('button', {
             'data-sfc-dur': d,
             style: 'flex:1;padding:8px 4px;border:1px solid ' + (isAct ? 'var(--black)' : 'var(--border)') + ';' +
               'background:' + (isAct ? 'var(--black)' : 'transparent') + ';' +
               'color:' + (isAct ? '#FAF9F6' : 'var(--grey)') + ';' +
               'cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;' +
               'letter-spacing:3px;text-transform:uppercase;min-height:44px;border-radius:0;appearance:none;-webkit-appearance:none;transition:background 0.2s ease,border-color 0.2s ease,color 0.2s ease;text-align:center;',
             onclick: (function(dur) { return function() { window._sfcPricingUI.duration = dur; render(); }; })(d)
           });
           pill.appendChild(h('div', {}, pillTxt));
           if (dp && dp.savings_pct > 0) {
             pill.appendChild(h('div', {'data-sfc-sav': '1', style:
               'font-family:Georgia,serif;font-size:10px;' +
               'color:' + (isAct ? 'rgba(250,249,246,0.8)' : 'var(--grey)') + ';margin-top:1px;'
             }, '−' + dp.savings_pct + ' %'));
           }
           _durRow.appendChild(pill);
         });
         card.appendChild(_durRow);

         // ── Prix principal ──
         if (_selPlan) {
           var _priceWrap = h('div', {style: 'text-align:center;padding:4px 0 16px;border-top:1px solid var(--border);'});
           _priceWrap.appendChild(h('div', {style:
             'font-family:Georgia,serif;font-size:36px;color:var(--black);line-height:1;margin:12px 0 4px;'
           }, _selPlan.label_mad));

           var _months = _durMonths[_ui.duration] || 1;
           var _perMonth = Math.round(_selPlan.price_mad / _months);
           var _periodLabel = _durPeriods[_ui.duration] || '';
           var _subLine = _periodLabel + ( _months > 1 ? (' · soit ' + _perMonth + ' MAD/mois') : '');
           _priceWrap.appendChild(h('div', {style:
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);letter-spacing:0.5px;'
           }, _subLine));

           // Économies en valeur absolue (si durée > 1 mois)
           if (_selPlan.savings_pct > 0) {
             var _basePlan = _findPlan(_ui.tier, 'saison');
             if (_basePlan) {
               var _baseTotal = Math.round(_basePlan.price_mad / 3 * _months);
               var _saved = _baseTotal - _selPlan.price_mad;
               if (_saved > 0) {
                 var _savingsBadge = h('div', {style:
                   'display:inline-block;margin-top:10px;padding:4px 12px;border-radius:0;' +
                   'border:1px solid var(--black);font-family:"Helvetica Neue",Arial,sans-serif;' +
                   'font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--black);'
                 }, 'Vous économisez ' + _saved + ' MAD');
                 _priceWrap.appendChild(_savingsBadge);
               }
             }
           }
           card.appendChild(_priceWrap);
         }

         // ── Ce qui est inclus — deux zones : inclus + à débloquer ──
         var _inclWrap = h('div', {style: 'margin:0 0 4px;padding:16px;background:var(--ivory2,#F5F4EF);border:1px solid var(--border,#E8E6DF);'});
         _inclWrap.appendChild(h('div', {style:
           'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;' +
           'text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px;'
         }, 'CE QUI EST INCLUS · ' + (_tierLabels[_ui.tier] || _ui.tier).toUpperCase()));

         var _incl = _allFeatures.filter(function(f) { return f.tiers.indexOf(_ui.tier) !== -1; });
         var _locked = _allFeatures.filter(function(f) { return f.tiers.indexOf(_ui.tier) === -1; });

         // Zone 1 — features incluses : ✓ simple sans disque noir imposant
         _incl.forEach(function(f) {
           var row = h('div', {style:
             'display:flex;align-items:flex-start;gap:10px;padding:5px 0;' +
             'border-bottom:1px solid var(--border,#E8E6DF);'
           });
           row.appendChild(h('div', {style:
             'flex-shrink:0;width:16px;height:16px;margin-top:1px;' +
             'display:flex;align-items:center;justify-content:center;' +
             'font-size:11px;color:var(--black,#0A0A09);'
           }, '✓'));
           row.appendChild(h('div', {style:
             'flex:1;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;' +
             'color:var(--black,#0A0A09);line-height:1.4;'
           }, f.label));
           _inclWrap.appendChild(row);
         });

         // Zone 2 — features à débloquer : bloc doré incitatif
         if (_locked.length > 0) {
           var _nextTier = _ui.tier === 'athlete' ? 'Champion' : 'Légende';
           var _upgradeBlock = h('div', {style:
             'margin-top:12px;padding:10px 10px 10px 14px;' +
             'border-left:2px solid #C8A96E;background:#FAF7F0;'
           });
           _upgradeBlock.appendChild(h('div', {style:
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;letter-spacing:2px;' +
             'text-transform:uppercase;color:#C8A96E;margin-bottom:8px;'
           }, 'DÉBLOQUEZ AVEC ' + _nextTier.toUpperCase()));
           _locked.forEach(function(f) {
             var row = h('div', {style: 'display:flex;align-items:flex-start;gap:10px;padding:4px 0;'});
             row.appendChild(h('div', {style:
               'flex-shrink:0;width:16px;height:16px;margin-top:1px;' +
               'display:flex;align-items:center;justify-content:center;' +
               'font-size:14px;color:#C8A96E;line-height:1;font-weight:300;'
             }, '+'));
             row.appendChild(h('div', {style:
               'flex:1;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;' +
               'color:var(--black,#0A0A09);line-height:1.4;'
             }, f.label));
             _upgradeBlock.appendChild(row);
           });
           _inclWrap.appendChild(_upgradeBlock);
         }
         card.appendChild(_inclWrap);

       } else {
         var _priceRow = h('div', {style: 'text-align:center;margin:18px 0 4px;'});
         _priceRow.appendChild(h('div', {style:
           'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);font-style:italic;'
         }, window._sfcPricingAttempted ? 'Tarifs temporairement indisponibles' : 'Chargement des tarifs…'));
         card.appendChild(_priceRow);
       }
     }

          // CTA — bouton Hermès noir laqué
     if (!_isSub && !_subLoading) {
       var _pData2 = window.SFC_PRICING_DATA || [];
       var _ui2 = window._sfcPricingUI || { tier: 'athlete', duration: 'saison' };
       var _ctaPlan = null;
       for (var _ci = 0; _ci < _pData2.length; _ci++) {
         if (_pData2[_ci].tier === _ui2.tier && _pData2[_ci].duration === _ui2.duration) { _ctaPlan = _pData2[_ci]; break; }
       }
       var _durPer2 = { saison: '/trimestre', cycle: '/semestre', engagement: '/an' };
       var _isEn = (window.isEnglish && window.isEnglish());
       var _ctaSessions = Object.keys((S.sessionHistory && typeof S.sessionHistory === 'object' && !Array.isArray(S.sessionHistory)) ? S.sessionHistory : {}).length;
       var _ctaState = _ctaSessions >= 10 ? 'invested' : _ctaSessions >= 4 ? 'engaged' : 'starter';
       var _ctaByState = {
         starter:  _isEn ? 'CONTINUE MY PROGRAM'    : 'CONTINUER MON PROGRAMME',
         engaged:  _isEn ? 'FINISH WHAT I STARTED'  : 'FINIR CE QUE J\'AI COMMENCÉ',
         invested: _isEn ? 'PROTECT MY PROGRESS'    : 'PROTÉGER MA PROGRESSION'
       };
       var _ctaBase = _trialExpired
         ? (_isEn ? 'Reactivate my access' : 'Réactiver mon accès')
         : (_ctaByState[_ctaState] || (_isEn ? 'CONTINUE MY PROGRAM' : 'CONTINUER MON PROGRAMME'));
       var _ctaSuffix = _ctaPlan ? ' — ' + _ctaPlan.label_mad + (_durPer2[_ui2.duration] || '') : '';
       var _cta = h('button', {
         style:
           'display:block;width:100%;margin-top:16px;padding:18px;' +
           'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);' +
           'border:none;cursor:pointer;' +
           'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;' +
           'letter-spacing:3px;text-transform:uppercase;min-height:52px;',
         onclick: function() {
           if (window.showSubscriptionContact) window.showSubscriptionContact(_ctaPlan, _ui2);
         }
       }, _ctaBase + _ctaSuffix);
       card.appendChild(_cta);

       // Réassurance
       card.appendChild(h('div', {style:
         'text-align:center;margin-top:10px;font-family:"Helvetica Neue",Arial,sans-serif;' +
         'font-size:9px;letter-spacing:1px;color:var(--grey);line-height:1.8;'
       }, (window.isEnglish && window.isEnglish()) ? 'Cancel anytime · Secure payment' : 'Résiliable à tout moment · Paiement sécurisé'));

          } else {
       card.appendChild(h('div', {style:
         'text-align:center;margin-top:20px;padding:14px;' +
         'border-top:1px solid ' + _accentBorder + ';' +
         'font-family:Georgia,serif;font-style:italic;font-size:12px;' +
         'color:' + _accent + ';'
       }, 'Merci de votre confiance.'));
     }

     c.appendChild(card);
   } catch(eSub) { console.warn('[profile] abonnement card error', eSub); }
 })();

 // ─── Restaurer depuis le cloud ───
 if (window.SupaSync && window.AUTH && window.AUTH.isLoggedIn()) {
   var restoreBtn = h('button', {
     style: 'display:block;width:100%;padding:14px;border:1px solid var(--line,#D8D8D0);background:transparent;color:var(--ink-900,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-bottom:12px;min-height:44px;',
     onclick: function() {
       if (!(window.sfcConfirm ? window.sfcConfirm('Restaurer vos données depuis le cloud ?\n\nLes données locales seront remplacées par la dernière sauvegarde cloud.') : confirm('Restaurer vos données depuis le cloud ?\n\nLes données locales seront remplacées par la dernière sauvegarde cloud.'))) return;
       restoreBtn.textContent = 'Restauration en cours...';
       restoreBtn.disabled = true;
       SupaSync.loadProfile().then(function(cloudData) {
         if (!cloudData) {
           if (window.showToast) window.showToast('Aucune donnée trouvée sur le cloud.', 'info', 3000);
           restoreBtn.textContent = 'Restaurer depuis le cloud';
           restoreBtn.disabled = false;
           return;
         }
         // Appliquer les données cloud sur S (forcer l'écrasement)
         var keys = Object.keys(cloudData);
         for (var ki = 0; ki < keys.length; ki++) {
           if (keys[ki] !== '__proto__' && keys[ki] !== 'constructor') {
             S[keys[ki]] = cloudData[keys[ki]];
           }
         }
         S._cloudUpdatedAt = new Date().toISOString();
         window._profileDirty = true;
         if (window.saveProfile) saveProfile();
         if (window.showToast) window.showToast('Données restaurées avec succès.', 'success', 3000);
         if (window.render) render();
       }).catch(function(err) {
         console.error('[restore] Error:', err);
         if (window.showToast) window.showToast('Erreur de restauration. Vérifiez votre connexion.', 'error', 3000);
         restoreBtn.textContent = 'Restaurer depuis le cloud';
         restoreBtn.disabled = false;
       });
     }
   }, 'Restaurer depuis le cloud');
   c.appendChild(restoreBtn);
 }

 // ─── Dark mode toggle ───
 var _isDark = document.body.classList.contains('dark-mode');
 var darkBtn = h('button', {
   style: 'display:flex;align-items:center;justify-content:space-between;width:100%;padding:14px;border:1px solid var(--border);background:transparent;color:var(--black);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-bottom:12px;min-height:44px;',
   onclick: function() {
     var on = document.body.classList.toggle('dark-mode');
     var _dmUid = (window.AUTH && window.AUTH.getUser && window.AUTH.getUser()) ? window.AUTH.getUser().id : null;
     var _dmKey = _dmUid ? ('mtd_dark_mode_' + _dmUid) : 'mtd_dark_mode';
     try { localStorage.setItem(_dmKey, on ? '1' : '0'); } catch(e) {}
     if (window.render) window.render();
   }
 });
 darkBtn.appendChild(h('span', {}, 'Mode sombre'));
 darkBtn.appendChild(h('span', {style: 'font-size:14px'}, _isDark ? 'ON' : 'OFF'));
 c.appendChild(darkBtn);

 // ─── Déconnexion ───
 var logoutBtn = h('button', {
   style: 'display:block;width:100%;padding:14px;border:1px solid var(--border);background:transparent;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
   onclick: function() {
     if (window.AUTH && window.AUTH.logout) { window.AUTH.logout(); }
     else { S.view = 'auth'; if (window.render) window.render(); }
   }
 }, (window.isEnglish && window.isEnglish()) ? 'Log out' : 'Se déconnecter');
 c.appendChild(logoutBtn);

 // ─── Zone de danger (RGPD) ───
 c.appendChild(h('div', {style: 'margin-top:32px;padding-top:20px;border-top:1px solid var(--border);'}));
 c.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:14px;'}, 'DONNÉES PERSONNELLES'));

 // Télécharger mes données (RGPD Art. 20 portabilité — export EXHAUSTIF)
 // POLISH 2026-04 : enrichi — inclut désormais food_journal, photos, streak,
 // feedback coach, wellness, etc. pour respecter vraiment le droit à la portabilité.
 var downloadDataBtn = h('button', {
   style: 'background:none;border:none;padding:10px 0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);cursor:pointer;text-decoration:underline;display:block;margin-bottom:12px;min-height:44px;text-align:left;',
   onclick: function() {
     try {
       var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
       var uid = user && user.id ? user.id : 'anon';
       // 1. Profil principal (toutes les clés PROFILE_KEYS — exhaustif)
       var profileData = {};
       PROFILE_KEYS.forEach(function(k) { if (S[k] !== undefined) profileData[k] = S[k]; });
       // 2. Données liées stockées sous clés dédiées
       var linkedData = {};
       function _readJSON(key) {
         try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
       }
       var linkedKeys = [
         'mtd_food_journal_' + uid,
         'mtd_progress_photos_' + uid,
         'mtd_weight_history_' + uid,
         'mtd_streak_' + uid,
         'mtd_badges_' + uid,
         'mtd_aicoach_feedback_' + uid,
         'mtd_muscu_progression_' + uid,
         'mtd_perf_hist_muscu_weights_' + uid,
         'mtd_wellness_history_' + uid,
         'mtd_disclaimer_accepted_' + uid
       ];
       linkedKeys.forEach(function(k) {
         var v = _readJSON(k);
         if (v !== null) { linkedData[k] = v; return; }
         // FIX CONTRE-AUDIT : non-JSON (flag '1') OU JSON corrompu → on encapsule
         // dans { _raw, _corrupt } pour éviter que du texte brut invalide pollue
         // le fichier JSON final + signale clairement à l'user une incohérence.
         var raw = null;
         try { raw = localStorage.getItem(k); } catch(e) {}
         if (raw === null || raw === undefined) return;
         // Test si c'est un simple string (flag) ou un JSON qu'on n'arrive pas à parser
         var isSimpleFlag = /^[\w\-\s]{1,50}$/.test(raw);
         if (isSimpleFlag) {
           linkedData[k] = raw; // flag texte propre : OK
         } else {
           linkedData[k] = { _raw: raw.slice(0, 10000), _corrupt: true, _note: 'Contenu localStorage non parsable en JSON. Signaler au support si ce n\'est pas attendu.' };
         }
       });
       // 3. Métadonnées export
       var exportPayload = {
         exportedAt: new Date().toISOString(),
         exportVersion: 2,
         userId: uid,
         userEmail: (user && user.email) || null,
         profile: profileData,
         linked: linkedData,
         notes: 'Export exhaustif RGPD Art. 20 — portabilité des données. '
              + 'Contient : profil complet (PROFILE_KEYS), journal alimentaire, '
              + 'photos de progression (base64), historique poids, streak, badges, '
              + 'feedback coach, progression charges muscu, wellness.'
       };
       // FIX CONTRE-AUDIT : sérialisation dans try + check taille + confirmation si gros.
       // Les photos base64 peuvent gonfler l'export à 50+ MB (Blob OK jusqu'à ~500 MB
       // en browser, mais perf dégradée sur mobile + download peut échouer).
       var jsonStr;
       try { jsonStr = JSON.stringify(exportPayload, null, 2); }
       catch(serErr) {
         if (window.showToast) window.showToast('Impossible de s\u00e9rialiser vos donn\u00e9es. Contactez le DPO si le probl\u00e8me persiste.', 'error', 5000);
         return;
       }
       var sizeMB = (jsonStr.length / (1024 * 1024));
       if (sizeMB > 50) {
         var _exportMsg = (window.isEnglish && window.isEnglish())
           ? ('Your export is ' + sizeMB.toFixed(1) + ' MB (may contain many photos). The download may take a while. Continue?')
           : ('Votre export fait ' + sizeMB.toFixed(1) + ' Mo (contient probablement beaucoup de photos). Le téléchargement peut être long. Continuer ?');
         var ok = (window.sfcConfirm ? window.sfcConfirm(_exportMsg) : window.confirm(_exportMsg));
         if (!ok) return;
       }
       var blob = new Blob([jsonStr], {type: 'application/json'});
       var url = URL.createObjectURL(blob);
       var a = document.createElement('a');
       var dateStr = new Date().toISOString().slice(0, 10);
       a.href = url; a.download = 'smartfitcoach-export-' + dateStr + '.json';
       document.body.appendChild(a); a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
     } catch(ex) { console.warn('[RGPD] download error', ex); if (window.showToast) window.showToast('Erreur lors du t\u00e9l\u00e9chargement. R\u00e9essayez.', 'error', 3500); }
   }
 }, 'Télécharger mes données (RGPD)');
 c.appendChild(downloadDataBtn);

 // Supprimer mon compte
 var deleteAccountBtn = h('button', {
   style: 'background:none;border:none;padding:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--error,#7A1F1F);cursor:pointer;display:block;min-height:44px;',
   onclick: function() {
     var _deleteMsg = (window.isEnglish && window.isEnglish()) ? 'Permanently delete your account and all your data? This action is irreversible.' : 'Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.';
     var confirmed = (window.sfcConfirm ? window.sfcConfirm(_deleteMsg) : window.confirm(_deleteMsg));
     if (!confirmed) return;
     // 1. Vider localStorage
     try {
       Object.keys(localStorage).filter(function(k) { return k.startsWith('mtd_'); }).forEach(function(k) { localStorage.removeItem(k); });
     } catch(ex) {}
     // 2. Supprimer le compte Supabase si connecté
     if (window.AUTH && window.AUTH.deleteAccount) {
       window.AUTH.deleteAccount().then(function() { if (window.render) window.render(); });
     } else if (window.AUTH && window.AUTH.logout) {
       console.warn('[RGPD] AUTH.deleteAccount not available — logging out only');
       window.AUTH.logout();
     } else {
       S.view = 'auth';
       if (window.render) window.render();
     }
   }
 }, 'Supprimer mon compte');
 c.appendChild(deleteAccountBtn);

 // POLISH 2026-04 : Lien DPO visible dans la zone "Données personnelles"
 // pour faciliter l'exercice des droits RGPD (accès, rectification, opposition).
 var dpoLink = h('a', {
   href: 'mailto:dpo@smartfitcoach.com?subject=Demande%20RGPD',
   style: 'display:inline-flex;align-items:center;margin-top:12px;padding:10px 0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);text-decoration:underline;min-height:44px;'
 }, 'Contacter le DPO (exercer mes droits RGPD) →');
 c.appendChild(dpoLink);

 container.appendChild(c);

 // ─── Liens légaux ───
 var legalLinks = h('div', {style: 'text-align:center;margin-top:24px;padding:16px 0;border-top:1px solid var(--border,#D8D8D0)'});
 legalLinks.appendChild(h('a', {href: '/privacy-policy.html', target: '_blank', rel: 'noopener', style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 12px'}, 'Politique de confidentialit\u00e9'));
 legalLinks.appendChild(h('a', {href: '/cgu.html', target: '_blank', rel: 'noopener', style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 12px'}, 'CGU'));
 legalLinks.appendChild(h('a', {href: '/mentions-legales.html', target: '_blank', rel: 'noopener', style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 12px'}, 'Mentions l\u00e9gales'));
 container.appendChild(legalLinks);

 // ─── Modal: Changer mon objectif ───
 // Cleanup any leftover modal from previous renders
 (function() { var _old = document.getElementById('_sfc_goal_modal'); if (_old && _old.parentNode) _old.parentNode.removeChild(_old); })();
 if (S._goalModal) {
   var _GOALS = window.GOALS || [];
   var _modal = h('div', {
     id: '_sfc_goal_modal',
     style: 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,10,9,0.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center;',
     onclick: function(e) { if (e.target === _modal) { S._goalModal = false; if (window.render) window.render(); } }
   });
   var _sheet = h('div', {
     style: 'width:100%;max-width:520px;background:var(--ivory,#FAF9F6);padding:28px 24px 40px;border-radius:0;border-top:1px solid var(--line,#D8D8D0);max-height:90vh;overflow-y:auto;'
   });

   // Header
   var _mHeader = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;'});
   _mHeader.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;'}, 'Mon objectif'));
   var _closeBtn = h('button', {
     style: 'background:none;border:none;font-size:20px;cursor:pointer;color:var(--grey);padding:4px 8px;min-height:44px;min-width:44px;',
     onclick: function() { S._goalModal = false; if (window.render) window.render(); }
   }, '\u00D7');
   _mHeader.appendChild(_closeBtn);
   _sheet.appendChild(_mHeader);

   // Current TDEE info
   var _tdee = window.calcTarget ? window.calcTarget() : 0;
   if (_tdee > 0) {
     var _tdeeInfo = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:16px;text-align:center;border:1px solid var(--border);padding:10px;'});
     _tdeeInfo.textContent = (window.isEnglish && window.isEnglish()) ? 'Your needs: ' + _tdee + '\u00a0kcal/day' : 'Vos besoins\u00a0: ' + _tdee + '\u00a0kcal/jour';
     _sheet.appendChild(_tdeeInfo);
   }

   // Goal state for modal (temp)
   if (typeof S._modalGoal === 'undefined' || S._modalGoal === null) S._modalGoal = S.goal;
   if (typeof S._modalTargetWeight === 'undefined') S._modalTargetWeight = S.targetWeight;

   // Goal chips
   _sheet.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:12px;'}, 'Objectif'));
   var _ggWrap = h('div', {style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;'});
   _GOALS.forEach(function(gl, i) {
     var _isOn = S._modalGoal === i;
     var _chip = h('div', {
       style: 'padding:12px 10px;border:1px solid ' + (_isOn ? 'var(--black)' : 'var(--border)') + ';background:' + (_isOn ? 'var(--black)' : 'transparent') + ';cursor:pointer;transition:background .15s,border-color .15s;',
       onclick: function() {
         S._modalGoal = i;
         if (window.render) window.render();
       }
     });
     _chip.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:500;color:' + (_isOn ? 'var(--ivory,#FAF9F6)' : 'var(--black)') + ';margin-bottom:2px;'}, gl.name));
     _chip.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + (_isOn ? 'rgba(250,249,246,0.7)' : 'var(--grey)') + ';line-height:1.3;'}, gl.desc));
     _ggWrap.appendChild(_chip);
   });
   _sheet.appendChild(_ggWrap);

   // Macro diff: before → after (only when a different goal is selected)
   if (S._modalGoal !== null && S._modalGoal !== S.goal && window.calcTarget && window.calcMacros) {
     try {
       var _beforeCal = window.calcTarget();
       var _beforeMacros = window.calcMacros();
       var _origGoalDiff = S.goal;
       S.goal = S._modalGoal;
       var _afterCal = window.calcTarget();
       var _afterMacros = window.calcMacros();
       S.goal = _origGoalDiff;
       if (_beforeCal > 0 && _afterCal > 0) {
         var _diffCal = _afterCal - _beforeCal;
         var _diffProt = Math.round(_afterMacros.p - _beforeMacros.p);
         var _diffBox = h('div', {style: 'border:1px solid var(--border);padding:12px 14px;margin-bottom:16px;background:var(--ivory2,#F5F3EC);'});
         _diffBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:10px;'}, 'Impact sur vos plans'));
         var _diffRow = h('div', {style: 'display:flex;justify-content:space-between;gap:12px;'});
         // Calories col
         var _calCol = h('div', {style: 'flex:1;text-align:center;'});
         _calCol.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;'}, _afterCal + ' kcal'));
         _calCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + (_diffCal > 0 ? '#2A6E2A' : _diffCal < 0 ? '#8B1A1A' : 'var(--grey)') + ';margin-top:2px;'}, (_diffCal > 0 ? '+' : '') + _diffCal + ' kcal'));
         // Protein col
         var _protCol = h('div', {style: 'flex:1;text-align:center;border-left:1px solid var(--border);padding-left:12px;'});
         _protCol.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;'}, Math.round(_afterMacros.p) + 'g prot.'));
         _protCol.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + (_diffProt > 0 ? '#2A6E2A' : _diffProt < 0 ? '#8B1A1A' : 'var(--grey)') + ';margin-top:2px;'}, (_diffProt > 0 ? '+' : '') + _diffProt + 'g'));
         _diffRow.appendChild(_calCol);
         _diffRow.appendChild(_protCol);
         _diffBox.appendChild(_diffRow);
         _sheet.appendChild(_diffBox);
       }
     } catch(e) {}
   }

   // Target weight (conditional)
   var _selGoalObj = (_GOALS && S._modalGoal !== null && S._modalGoal !== undefined) ? _GOALS[S._modalGoal] : null;
   var _selGoalKey = _selGoalObj ? _selGoalObj.key : null;
   var _needsTarget = _selGoalKey === 'cut' || _selGoalKey === 'shred' || _selGoalKey === 'bulk' || _selGoalKey === 'lean_bulk';
   if (_needsTarget) {
     _sheet.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:8px;'}, 'Poids objectif'));
     var _twWrap = h('div', {style: 'display:flex;align-items:center;gap:8px;margin-bottom:16px;'});
     var _twInput = h('input', {
       type: 'number', min: '40', max: '160', step: '0.5',
       value: S._modalTargetWeight ? String(S._modalTargetWeight) : '',
       inputmode: 'decimal',
       style: 'flex:1;padding:12px;border:1px solid var(--border);background:transparent;font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;text-align:center;',
       oninput: function(e) {
         var v = parseFloat(e.target.value);
         S._modalTargetWeight = (!isNaN(v) && v >= 40 && v <= 160) ? v : null;
       }
     });
     _twWrap.appendChild(_twInput);
     _twWrap.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);'}, 'kg'));
     _sheet.appendChild(_twWrap);

     // Projection
     if (S._modalTargetWeight && window.calcWeightProjection) {
       var _origGoal = S.goal, _origTW = S.targetWeight;
       S.goal = S._modalGoal; S.targetWeight = S._modalTargetWeight;
       try {
         var _proj = window.calcWeightProjection();
         if (_proj && _proj.weeks) {
           var _projBox = h('div', {style: 'text-align:center;padding:12px;border:1px solid var(--border);background:var(--ivory2,#F5F3EC);margin-bottom:16px;'});
           _projBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:6px;'}, 'Projection'));
           _projBox.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:22px;font-style:italic;'}, '~' + _proj.weeks + ' semaines'));
           _projBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:4px;'}, _proj.months + ' mois'));
           _sheet.appendChild(_projBox);
         }
       } catch(e) {}
       S.goal = _origGoal; S.targetWeight = _origTW;
     }
   }

   // TCA conflict warning
   var _tcaConflict = (_selGoalKey === 'cut' || _selGoalKey === 'shred') && Array.isArray(S.medical) && S.medical.indexOf('tca') !== -1;
   if (_tcaConflict) {
     _sheet.appendChild(h('div', {style: 'background:rgba(122,31,31,0.06);border:1px solid var(--error,#7A1F1F);padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--error,#7A1F1F);line-height:1.6;'}, 'Objectif s\u00e8che incompatible avec un historique de TCA. Choisissez Maintien ou Prise de masse.'));
   }

   // Save button
   var _canSave = S._modalGoal !== null && !_tcaConflict && (!_needsTarget || (S._modalTargetWeight && S._modalTargetWeight >= 40));
   var _saveBtn = h('button', {
     style: 'display:block;width:100%;padding:14px;border:none;background:' + (_canSave ? 'var(--black)' : 'var(--border)') + ';color:' + (_canSave ? 'var(--ivory,#FAF9F6)' : 'var(--grey)') + ';font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:' + (_canSave ? 'pointer' : 'not-allowed') + ';margin-bottom:10px;',
     onclick: function() {
       if (!_canSave) return;
       // Apply changes
       S.goal = S._modalGoal; S._nm = null;
       if (_needsTarget) {
         S.targetWeight = S._modalTargetWeight;
       } else {
         S.targetWeight = null; // Nettoyer le poids cible si objectif n'en a pas besoin (évite projection fantôme)
       }
       // Sync sport goals
       if (_selGoalObj && window.NUTRITION_TO_SPORT_GOAL) {
         var _newSportId = window.NUTRITION_TO_SPORT_GOAL[_selGoalObj.key];
         if (_newSportId) {
           var _primaryIds = ['muscle', 'weightloss', 'shred', 'general', 'endurance', 'flexibility'];
           var _secondaryKept = Array.isArray(S.sportGoals) ? S.sportGoals.filter(function(x) { return _primaryIds.indexOf(x) === -1; }) : [];
           S.sportGoals = [_newSportId].concat(_secondaryKept).slice(0, 3);
         }
       }
       // FIX VALIDATION WEEKPLAN 2026-04 : dévalider au lieu de supprimer (plan reste visible)
       if (window.devalidateWeekPlan) window.devalidateWeekPlan('changement objectif');
       else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
       // FIX 2026-04-16 — NE PLUS écraser sportProgram validé. Juste marquer update dispo.
       if (!S.sportProgramValidated) { S.sportProgram = null; }
       else { S._sportUpdateAvailable = true; }
       // Cleanup temp state
       delete S._modalGoal;
       delete S._modalTargetWeight;
       S._goalModal = false;
       window._profileDirty = true;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       // Toast actionnable : régénérer les plans directement
       try {
         var _toast = document.createElement('div');
         _toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;padding:12px 16px;z-index:10000;border-radius:0;border:1px solid var(--ink-900,#0A0A09);display:flex;align-items:center;gap:12px;';
         var _toastTxt = document.createElement('span');
         _toastTxt.textContent = (window.isEnglish && window.isEnglish()) ? '\u2713 Goal updated' : '\u2713 Objectif mis \u00e0 jour';
         _toast.appendChild(_toastTxt);
         var _regenBtn = document.createElement('button');
         _regenBtn.style.cssText = 'background:var(--ivory,#FAF9F6);color:#0A0A09;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:6px 12px;cursor:pointer;border-radius:1px;white-space:nowrap;';
         _regenBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Regenerate \u2192' : 'Reg\u00e9n\u00e9rer \u2192';
         _regenBtn.onclick = function() {
           try {
             if (window.computeNutritionState) window.computeNutritionState(false);
             if (window.generateWeek) {
               var _wk = window.generateWeek();
               if (Array.isArray(_wk) && _wk.length > 0) {
                 window.S.weekPlan = _wk;
                 window.S._weekPlanGeneratedAt = new Date().toISOString();
               }
             }
             window._profileDirty = true;
             if (window.saveProfile) window.saveProfile();
           } catch(e2) {}
           if (_toast.parentNode) _toast.parentNode.removeChild(_toast);
           if (window.render) window.render();
         };
         _toast.appendChild(_regenBtn);
         document.body.appendChild(_toast);
         setTimeout(function() { if (_toast.parentNode) _toast.parentNode.removeChild(_toast); }, 6000);
       } catch(e) {}
       if (window.render) window.render();
     }
   }, (window.isEnglish && window.isEnglish()) ? 'Save' : 'Enregistrer');
   _sheet.appendChild(_saveBtn);

   // Cancel button
   var _cancelBtn = h('button', {
     style: 'display:block;width:100%;padding:14px;border:1px solid var(--border);background:transparent;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
     onclick: function() {
       delete S._modalGoal;
       delete S._modalTargetWeight;
       S._goalModal = false;
       if (window.render) window.render();
     }
   }, (window.isEnglish && window.isEnglish()) ? 'Cancel' : 'Annuler');
   _sheet.appendChild(_cancelBtn);

   _modal.appendChild(_sheet);
   document.body.appendChild(_modal);
 }
}

// ─── DISCLAIMER MÉDICAL (1 fois par compte) ───
function _showMedicalDisclaimer() {
  if (document.getElementById('sfc-medical-disclaimer')) return;
  var S = window.S;
  var h = window.h;
  if (!h) return;
  var ov = h('div', {
    id: 'sfc-medical-disclaimer',
    style: 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,9,0.6);z-index:10000;display:flex;align-items:flex-end;justify-content:center;padding-bottom:env(safe-area-inset-bottom);'
  });
  var box = h('div', {
    style: 'background:var(--ivory,#FAF9F6);width:100%;max-width:480px;padding:28px 24px 32px;border-top:1px solid var(--line,#D8D8D0);'
  });
  box.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px;'}, 'INFORMATION IMPORTANTE'));
  box.appendChild(h('div', {style:'font-family:Georgia,serif;font-size:16px;color:var(--black,#0A0A09);margin-bottom:12px;line-height:1.4;'}, 'SmartFitCoach ne remplace pas un professionnel de santé'));
  box.appendChild(h('div', {style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.7;margin-bottom:20px;'}, 'Les informations fournies par cette application sont à titre indicatif. Consultez un médecin avant de prendre toute décision relative à votre santé, en particulier en cas de pathologie ou de traitement médical en cours.'));
  var acceptBtn = h('button', {
    style: 'display:block;width:100%;padding:16px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;min-height:48px;',
    onclick: function() {
      S._medicalDisclaimerShown = true;
      window._profileDirty = true;
      if (window.saveProfile) try { window.saveProfile(); } catch(_) {}
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }
  }, 'J\'AI COMPRIS');
  box.appendChild(acceptBtn);
  ov.appendChild(box);
  document.body.appendChild(ov);
}

// ─── MAIN RENDER ───
function render() {
 // State repair runs BEFORE lock check: concurrent render calls must not skip repair
 try { if (window.sfcRepairState) window.sfcRepairState(window.S); } catch(_eRep) {}
 if (render._lock) return;
 render._lock = true;
 // Clean any stale tooltips left over from previous view
 try { document.querySelectorAll('.sfc-tooltip-pop').forEach(function(el){ el.remove(); }); } catch(_eTp) {}
 try { if (S._quickAddSlot && S.view !== 'today') { S._quickAddSlot = null; } } catch(_eQa) {}
 try {
 // === SAFETY: conditions incompatibles avec certains objectifs (OMS 2016, ACOG 2020/2022, ANAD, IOC 2018) ===
 // Correction silencieuse — attrape les données persistées en localStorage avant le fix
 var _goalCorrected = false;
 if (window.S && window.GOALS && typeof window.S.goal === 'number' && window.GOALS[window.S.goal]) {
   var _safetyGoalKey = window.GOALS[window.S.goal].key;
   var _isUnsafeGoal = _safetyGoalKey === 'cut' || _safetyGoalKey === 'shred';
   var _isUnsafeGoalTca = _safetyGoalKey === 'cut' || _safetyGoalKey === 'shred' || _safetyGoalKey === 'bulk' || _safetyGoalKey === 'lean_bulk';
   var _isPregnant = window.S.pregnant && window.isFemale(window.S);
   var _isAllait = Array.isArray(window.S.medical) && window.S.medical.indexOf('allaitement') !== -1;
   var _isTca = Array.isArray(window.S.medical) && window.S.medical.indexOf('tca') !== -1;
   if (_isUnsafeGoal && (_isPregnant || _isAllait)) {
     window.S.goal = 2; // Forcer maintien — index 2 = maintain
     window._profileDirty = true;
     if (window.saveProfile) window.saveProfile();
     _goalCorrected = true;
   } else if (_isUnsafeGoalTca && _isTca) {
     window.S.goal = 2; // TCA : forcer maintien (ANAD, IOC 2018)
     window._profileDirty = true;
     if (window.saveProfile) window.saveProfile();
     _goalCorrected = true;
   }
 }
 // ================================================================================
 if (window.destroyAllCharts) window.destroyAllCharts();
 // Stopper le timer CrossFit si on navigue ailleurs (évite le bip en background)
 if (window._wodTimerInterval) { clearInterval(window._wodTimerInterval); window._wodTimerInterval = null; }
 // FIX PERF 2026-04-16 — Debounce saveProfile dans render() (750ms)
 // Avant : saveProfile() appelé à CHAQUE render → localStorage read×2 + JSON parse
 // + XOR encode + write sur chaque clic/interaction. Maintenant : debounced.
 if (!_goalCorrected && window.AUTH && window.AUTH.isLoggedIn()) {
   if (window._saveProfileTimer) clearTimeout(window._saveProfileTimer);
   window._saveProfileTimer = setTimeout(function() { try { saveProfile(); } catch(e) {} }, 750);
 }
 var app = document.getElementById('app');
 if (!app) { console.error('[render] #app not found'); return; }

 // Scroll to top on any page/step/sub-page change
 var _s2p = window._s2page || 0;
 var _s5p = window._s5page || 0;
 var _cfCal = !!S.cfCalendarOpen;
 // Track sport day selections — switching days changes page content significantly
 var _selDayKey = (S.selectedCrossfitDay || 0) + '|' + (S.selectedRunDay || 0) + '|' +
   (S.selectedHyroxDay || 0) + '|' + (S.selectedSportDay || 0) + '|' +
   (S.selectedPadelDay || 0) + '|' + (S.selectedGolfDay || 0) + '|' +
   (S.selectedTriDay || 0) + '|' + (S.selectedCyclingDay || 0) + '|' +
   (S.selectedCalisthDay || 0) + '|' + (S.yogaDay || 0);
 var _didNavigate = (render._lastView !== S.view) ||
 (render._lastNStep !== S.nStep) ||
 (render._lastSStep !== S.sStep) ||
 (render._lastS2page !== _s2p) ||
 (render._lastS5page !== _s5p) ||
 (render._lastCfCal !== _cfCal) ||
 (render._lastSelDayKey !== _selDayKey);
 render._lastView = S.view;
 render._lastNStep = S.nStep;
 render._lastSStep = S.sStep;
 render._lastS2page = _s2p;
 render._lastS5page = _s5p;
 render._lastCfCal = _cfCal;
 render._lastSelDayKey = _selDayKey;

 app.innerHTML = '';
 try {

 if (_didNavigate) {
 // Disable CSS scroll-behavior:smooth — it overrides behavior:'instant' on iOS Safari/some Android
 document.documentElement.style.scrollBehavior = 'auto';
 document.body.style.scrollBehavior = 'auto';
 window.scrollTo(0, 0);
 document.documentElement.scrollTop = 0;
 document.body.scrollTop = 0;
 var _appEl = document.getElementById('app');
 if (_appEl) _appEl.scrollTop = 0;
 }

 // Not logged in → auth screens
 if (S.view === 'authNewPassword') { renderNewPassword(app); return; }
 if (!window.AUTH || !window.AUTH.isLoggedIn()) {
 if (S.view === 'authRegister') renderRegister(app);
 else if (S.view === 'authVerify') renderVerifyEmail(app);
 else if (S.view === 'authForgot') renderForgotPassword(app);
 else renderLogin(app);
 return;
 }

 // Logged in → app
 var wrap = h('div', {'class': 'app'});

 // ── GLOBAL SUBSCRIPTION DEBUG BAR (dev only — enable via localStorage.setItem('sfc_dev','1')) ──
 // Idempotent: only one bar even with multiple render() calls.
 try {
   var _gDbKey = 'sfc_sub_debug_dismissed';
   var _devMode = window.SFC_DEBUG === true || (function(){ try{ return localStorage.getItem('sfc_dev')==='1'; }catch(e){ return false; } })();
   var _sfcSS = (window.safeStorage && window.safeStorage.session) || { getItem: function(k){ try{return sessionStorage.getItem(k);}catch(e){return null;} }, setItem: function(k,v){ try{sessionStorage.setItem(k,v);}catch(e){} } };
   if (_devMode && !_sfcSS.getItem(_gDbKey) && !document.getElementById('sfc-global-debug')) {
     var _esc = function(v) { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
     var _gPlan  = _esc((window.S && window.S.subscriptionPlan) || 'undefined');
     var _gSrvP  = _esc((window.S && window.S._serverPremium !== undefined) ? String(window.S._serverPremium) : 'undefined');
     var _gReady = _esc((window.S && window.S._subStatusReady) ? 'true' : 'false');
     var _gIsP   = _esc((typeof window.isPremium === 'function') ? String(window.isPremium()) : '?');
     var _gIsT   = _esc((typeof window.isTrialUser === 'function') ? String(window.isTrialUser()) : '?');
     var _gDays  = _esc((typeof window.getTrialDaysLeft === 'function') ? String(window.getTrialDaysLeft()) : '?');
     var _gBv    = _esc(window.SFC_BUNDLE_VERSION || 'unknown');
     var _gEl = document.createElement('div');
     _gEl.id = 'sfc-global-debug';
     _gEl.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#000;color:#0f0;' +
       'font-size:9px;font-family:monospace;padding:3px 6px;line-height:1.4;display:flex;justify-content:space-between;align-items:center;';
     var _gInfo = document.createElement('span');
     _gInfo.textContent = 'PLAN=' + _gPlan + ' | SRV_PREMIUM=' + _gSrvP + ' | IS_PREMIUM=' + _gIsP +
       ' | IS_TRIAL=' + _gIsT + ' | DAYS=' + _gDays + ' | READY=' + _gReady + ' | BV=' + _gBv;
     var _gClose = document.createElement('span');
     _gClose.textContent = '×';
     _gClose.style.cssText = 'cursor:pointer;padding:0 6px;font-size:12px;color:#fff;';
     _gClose.addEventListener('click', function() {
       _sfcSS.setItem(_gDbKey, '1');
       var _bar = document.getElementById('sfc-global-debug');
       if (_bar && _bar.parentNode) _bar.parentNode.removeChild(_bar);
     });
     _gEl.appendChild(_gInfo);
     _gEl.appendChild(_gClose);
     if (document.body) {
       document.body.appendChild(_gEl);
     }
   }
 } catch(_gDbe) {}
 // ── END GLOBAL DEBUG BAR ──


 // User bar — épuré : logo gauche | langue + avatar droite
 var user = AUTH.getUser();
 var ub = h('div', {'class': 'user-bar'});
 ub.appendChild(h('span', {'class': 'user-name'}, '◆ SMARTFITCOACH'));
 var ubRight = h('div', {style: 'display:flex;align-items:center;gap:16px'});
 // Streak indicator — affiché si streak >= 2
 (function() {
   try {
     var _sUser = AUTH.getUser();
     var _sUid = _sUser ? _sUser.id : 'anon';
     var _sRaw = localStorage.getItem('mtd_streak_' + _sUid);
     var _sVal = 0;
     if (_sRaw) { var _sData = JSON.parse(_sRaw); _sVal = (_sData && _sData.current) ? _sData.current : 0; }
     if (_sVal >= 2) {
       var _streakEl = h('div', {
         style: 'display:flex;align-items:center;gap:3px;min-height:44px;cursor:default;',
         title: _sVal + ' ' + window.locPlural(_sVal, {fr:{one:'jour cons\u00e9cutif',other:'jours cons\u00e9cutifs'},en:{one:'day in a row',other:'days in a row'}})
       });
       // FIX Hermès : remplacement emojis 🏆/🔥 par glyphe ● avec opacity selon seuil.
       _streakEl.appendChild(h('span', {style: 'font-size:10px;line-height:1;opacity:' + (_sVal >= 7 ? '1' : '0.55') + ';color:var(--black);'}, '\u25CF'));
       _streakEl.appendChild(h('span', {
         style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:0.5px;'
       }, String(_sVal)));
       ubRight.appendChild(_streakEl);
     }
   } catch(e) {}
 })();
 // Language toggle FR·EN — touch target sur le wrapper, texte épuré
 (function() {
   var _curLang = (window.I18N ? window.I18N.current : (S.lang || 'fr'));
   var _langWrap = h('div', {
     style: 'display:flex;align-items:center;min-height:44px;cursor:pointer',
     onclick: function() {
       var _next = (window.I18N ? window.I18N.current : (S.lang || 'fr')) === 'fr' ? 'en' : 'fr';
       document.documentElement.lang = _next;
       if (window.I18N && window.I18N.setLang) { window.I18N.setLang(_next); } else { S.lang = _next; render(); }
     }
   });
   _langWrap.appendChild(h('span', {
     style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer;color:var(--grey);background:none;border:none;padding:4px 0'
   }, _curLang === 'fr' ? 'FR·EN' : 'EN·FR'));
   ubRight.appendChild(_langWrap);
 })();
 // Avatar (clickable → profil step 1)
 (function() {
   var _avatarBtn = h('button', {
     'class': 'user-bar-avatar-btn',
     onclick: function() { S.view = 'profil'; window.render(); },
     title: 'Mon profil'
   });
   if (S.profilePhoto) {
     _avatarBtn.appendChild(h('img', {
       src: S.profilePhoto,
       alt: 'Photo de profil',
       'class': 'user-bar-avatar-photo'
     }));
   } else {
     var _uInitials = (function() {
       var _un = user ? (user.name || user.email || '') : '';
       if (!_un) return 'S';
       var _parts = _un.trim().split(/\s+/).filter(Boolean);
       if (_parts.length >= 2 && _parts[0] && _parts[_parts.length-1]) return (_parts[0][0] + _parts[_parts.length-1][0]).toUpperCase();
       return (_un[0] || 'S').toUpperCase();
     })();
     _avatarBtn.appendChild(h('div', {'class': 'user-bar-avatar-initials'}, _uInitials));
   }
   ubRight.appendChild(_avatarBtn);
 })();
 ub.appendChild(ubRight);
 wrap.appendChild(ub);

 // Main navigation (tabs adaptés selon S.appMode, masquée pendant l'onboarding)
 var _SPORT_PROG_STEP = { musculation:4, crossfit:6, running:8, hyrox:10, padel:12, golf:14, triathlon:18, yoga:21, cycling:23, calisthenics:25 };
 var _isOnProg = S.sStep === 30 || (S.sportType && S.sStep === (_SPORT_PROG_STEP[S.sportType] || 4));
 var _navInOnboarding = (S.view === 'nutrition' && S.nStep > 0 && S.nStep < 12) ||
                        (S.view === 'sport' && S.sStep > 0 && !_isOnProg);
 var nav = h('nav', {'class': 'main-nav', role: 'navigation', 'aria-label': 'Navigation principale'});
 var _navIcons = {
   today: '<svg class="main-nav-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4l1.4-1.4 M17 7l1.4-1.4"/></svg>',
   nutrition: '<svg class="main-nav-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3v7a2 2 0 0 0 4 0V3 M9 10v11 M16 3c-1.5 1.5-2 3.5-2 5 0 2 1 3 2 3v10"/></svg>',
   sport: '<svg class="main-nav-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 9v6 M6 7v10 M8 12h8 M18 7v10 M21 9v6"/></svg>',
   calendar: '<svg class="main-nav-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M8 3v4 M16 3v4 M3 10h18"/></svg>',
   // 2026-04 : onglet Progrès (analytics dashboard)
   analytics: '<svg class="main-nav-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><polyline points="3 17 9 11 13 15 21 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 7 21 7 21 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
   // Projet 2.0 Phase A : onglet Social (amis, feed privé)
   social: '<svg class="main-nav-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
 };
 function _makeNavTab(key, label, isActive, logKey, targetView) {
   var attrs = {'class': 'main-nav-tab' + (isActive ? ' active' : ''), onclick: function(){ S.view = targetView; if(window.BLACKBOX)window.BLACKBOX.log(logKey); render(); }};
   if (isActive) attrs['aria-current'] = 'page';
   var btn = h('button', attrs);
   btn.insertAdjacentHTML('afterbegin', _navIcons[key]);
   btn.appendChild(h('span', {'class': 'main-nav-tab-label'}, label));
   return btn;
 }
 nav.appendChild(_makeNavTab('today', (window.isEnglish && window.isEnglish()) ? 'Today' : 'Aujourd\'hui', (S.view === 'today' || S.view === 'dashboard' || !S.view), 'nav_today', 'today'));
 if (S.appMode !== 'sport') {
   nav.appendChild(_makeNavTab('nutrition', window.t('nav.nutrition'), S.view === 'nutrition', 'nav_nutrition', 'nutrition'));
 }
 if (S.appMode !== 'nutrition') {
   nav.appendChild(_makeNavTab('sport', window.t('nav.sport'), S.view === 'sport', 'nav_sport', 'sport'));
 }
 if (S.appMode) {
   // Calendrier accessible en mode sport ET nutrition (le calendrier pilote les jours training/repos = données nutritionnelles)
   nav.appendChild(_makeNavTab('calendar', (window.isEnglish && window.isEnglish()) ? 'Calendar' : 'Calendrier', S.view === 'calendar', 'nav_calendar', 'calendar'));
   // 2026-04 : onglet Progrès (analytics)
   nav.appendChild(_makeNavTab('analytics', (window.isEnglish && window.isEnglish()) ? 'Progress' : 'Progrès', S.view === 'analytics', 'nav_analytics', 'analytics'));
   // Projet 2.0 : onglet Social (amis + feed privé) — affiché uniquement si le module est chargé
   if (window.SOCIAL && typeof window.SOCIAL.render === 'function') {
     nav.appendChild(_makeNavTab('social', 'Social', S.view === 'social', 'nav_social', 'social'));
   }
 }
 if (!_navInOnboarding) wrap.appendChild(nav);

 var content = h('div', {'class': 'fade-in', style: 'margin-top:24px'});

 // Welcome screen — first connection only (shown before module choice)
 var _authUser = window.AUTH ? window.AUTH.getUser() : null;
 if (_authUser && !S.welcomeShown && !S.appMode && !S.nStep && !S.sStep) {
   window.renderWelcomeScreen(app);
   return;
 }

 // Module choice — si l'utilisateur est connecté mais n'a pas encore choisi son mode
 // Exception : la page profil reste accessible même sans appMode (pour choisir le mode)
 if (_authUser && !S.appMode && !S.nStep && !S.sStep && S.view !== 'profil') {
   window.renderModuleChoice(content);
   wrap.appendChild(content);
   wrap.appendChild(h('div', {'class': 'footer'}, [h('a', {href: '#'}, 'Smart Fit Coach')]));
   app.appendChild(wrap);
   return;
 }

 if (S.view === 'profil' || S.view === 'profile') {
 // Refresh subscription status when profile is opened (2-min TTL vs 15-min elsewhere)
 if (window.SupaSync && typeof SupaSync.fetchUserStatus === 'function') {
   var _pNow = Date.now();
   if (!SupaSync._userStatusCacheTs || (_pNow - SupaSync._userStatusCacheTs) > 2 * 60 * 1000) {
     SupaSync.fetchUserStatus().then(function() { window.render(); }).catch(function() {});
   }
 }
 renderProfilePage(content);
 } else if (['calendar','sport','nutrition','analytics','social'].indexOf(S.view) !== -1) {
 if (S.view === 'nutrition' && !window.RecipeEngine && window._lazyLoad) {
   window._lazyLoad('./recipe-engine.js');
 }
 var _modMap = { calendar: 'SMART_CALENDAR', sport: 'SPORT', nutrition: 'NUTRITION', analytics: 'ANALYTICS', social: 'SOCIAL' };
 var _modName = _modMap[S.view];
 if (window[_modName]) {
   window[_modName].render(content);
 } else {
   var _mLoader = h('div', {style: 'padding:48px 24px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65)'}, (window.isEnglish && window.isEnglish()) ? 'Loading…' : 'Chargement…');
   content.appendChild(_mLoader);
   var _mRetryCount = 0;
   var _mRetryId = setInterval(function() {
     _mRetryCount++;
     if (window[_modName]) {
       clearInterval(_mRetryId);
       try { window.render(); } catch(e) { console.warn('[module retry]', e); }
     } else if (_mRetryCount >= 15) {
       clearInterval(_mRetryId);
       try { _mLoader.textContent = (window.isEnglish && window.isEnglish()) ? 'Loading error. Reload the page (Ctrl+R).' : 'Erreur de chargement. Rechargez la page (Ctrl+R).'; } catch(_e) {}
     }
   }, 200);
 }
 } else {
 // Default + 'today' + 'dashboard' → vue Aujourd'hui
 S.view = 'today';
 if (window.TODAY) {
   window.TODAY.render(content);
 } else {
   // FIX audit backend 2026-04-15 : retry auto plutôt que message statique.
   // Le module TODAY peut charger après le premier render (async script) → on retente
   // toutes les 200ms pendant 3 secondes au lieu d'afficher un message permanent.
   var _loader = h('div', {style: 'padding:48px 24px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65)'}, (window.isEnglish && window.isEnglish()) ? 'Loading dashboard…' : 'Chargement du dashboard…');
   content.appendChild(_loader);
   var _retryCount = 0;
   var _retryId = setInterval(function() {
     _retryCount++;
     if (window.TODAY) {
       clearInterval(_retryId);
       try { window.render(); } catch(e) { console.warn('[TODAY retry]', e); }
     } else if (_retryCount >= 15) { // 3 secondes
       clearInterval(_retryId);
       try { _loader.textContent = (window.isEnglish && window.isEnglish()) ? 'Loading error. Reload the page (Ctrl+R) or check your connection.' : 'Erreur de chargement. Rechargez la page (Ctrl+R) ou vérifiez votre connexion.'; } catch(_e) {}
     }
   }, 200);
 }
 }

 wrap.appendChild(content);

 // Footer
 wrap.appendChild(h('div', {'class': 'footer'}, [h('a', {href: '#'}, 'Smart Fit Coach')]));
 app.appendChild(wrap);

 // ═══ BIBLE HERMÈS §6 : Coach bar persistante bottom-sticky ═══
 // ═══ BIBLE HERMÈS §8 : FAB "+ Logger" flottant ═══
 // ═══ BIBLE HERMÈS §10 : Drawer Progression bottom-sheet ═══
 // Détachés du wrap principal — ils vivent sur document.body pour être fixed au-dessus.
 try {
   // Nettoyer les instances précédentes
   ['coach-bar', 'fab-logger-container', 'progression-drawer', 'sfc-post-session-panel'].forEach(function(id) {
     var el = document.getElementById(id);
     if (el) el.parentNode.removeChild(el);
   });

   if (S._postSessionPanel && S.appMode) {
     try {
       var _panel = renderPostSessionPanel(S._postSessionPanel);
       if (_panel) document.body.appendChild(_panel);
     } catch(_pse) { console.warn('[PostSessionPanel]', _pse); }
   }

   // FIX BUG #2+#4 audit debug login 2026-04-15 :
   // - Reset overlays éphémères si view ≠ today (drawer fullscreen stale masquait
   //   tout le contenu quand user revenait de drawer puis naviguait ailleurs).
   // - Gate overlays par view : pas de coach bar / FAB / drawer pendant
   //   onboarding nutrition (nStep 1-11) ou sport (sStep > 0) → bruit visuel.
   var _inOnboarding = (S.view === 'nutrition' && S.nStep > 0 && S.nStep < 12) ||
                       (S.view === 'sport' && S.sStep > 0);
   var _onDashboard = (S.view === 'today' || S.view === 'dashboard');
   // Reset des flags UI éphémères si on quitte le dashboard (éviter drawer stale)
   if (!_onDashboard) {
     S._dashExtOpen = false;
     S._fabOpen = false;
   }

   // Les overlays ne s'affichent QUE sur le dashboard, jamais en onboarding/auth
   if (_onDashboard && !_inOnboarding && S.appMode) {
     if (window.renderCoachBar) {
       var coachBar = window.renderCoachBar();
       if (coachBar) document.body.appendChild(coachBar);
     }
     if (window.renderFabLogger) {
       var fab = window.renderFabLogger();
       if (fab) { fab.id = 'fab-logger-container'; document.body.appendChild(fab); }
     }
     if (window.renderProgressionDrawer) {
       var drawer = window.renderProgressionDrawer();
       if (drawer) document.body.appendChild(drawer);
     }
   }
 } catch(e) { console.warn('[CoachBar/FAB/Drawer]', e); }

 // Auth banner (P1) — bannière sauvegarde cloud si pas de compte réel
 try { if (window.AuthBanner) window.AuthBanner.render(document.body); } catch(e) {}
 // Onboarding screen (P10) — écran de bienvenue personnalisé (1 seule fois)
 try { if (window.OnboardingComplete) window.OnboardingComplete.check(); } catch(e) {}
 // Disclaimer médical (1 seule fois par compte, après onboarding)
 try { if (S.appMode && !S._medicalDisclaimerShown) _showMedicalDisclaimer(); } catch(e) {}

 // Post-render scroll: reset scroll position after content is in DOM
 if (_didNavigate) {
   window.scrollTo(0, 0);
   document.documentElement.scrollTop = 0;
   document.body.scrollTop = 0;
   requestAnimationFrame(function() {
     document.documentElement.style.scrollBehavior = '';
     document.body.style.scrollBehavior = '';
   });
 }
 // Translate DOM if EN
 if (window.I18N && window.I18N.current === 'en' && window.I18N.translateDOM) {
   try { window.I18N.translateDOM(); } catch(e) {}
 }
 } catch (_renderErr) {
   console.error('[render] crash:', _renderErr);
   if (typeof _showErrorPage === 'function') {
     try { _showErrorPage(_renderErr && _renderErr.message ? _renderErr.message : String(_renderErr)); } catch(e2) {}
   } else {
     try {
       app.innerHTML = '';
       var _errDiv = document.createElement('div');
       _errDiv.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ivory,#FAF9F6);padding:40px 24px;box-sizing:border-box;';
       var _errInner = document.createElement('div');
       _errInner.style.cssText = 'max-width:360px;width:100%;text-align:center;';
       var _errH = document.createElement('h2');
       _errH.style.cssText = 'font-family:Georgia,serif;font-size:24px;font-weight:400;color:#0A0A09;margin:0 0 12px;';
       var _errIsEN = window.isEnglish && window.isEnglish();
       _errH.textContent = _errIsEN ? 'An interruption occurred' : 'Une interruption est survenue';
       var _errP = document.createElement('p');
       _errP.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#6B6B65;line-height:1.6;margin:0 0 28px;';
       _errP.textContent = _errIsEN ? 'Your session has been secured. You can try again.' : 'Nous avons s\u00e9curis\u00e9 votre session. Vous pouvez r\u00e9essayer.';
       var _errBtn = document.createElement('button');
       _errBtn.style.cssText = 'padding:14px 28px;background:#0A0A09;color:#FAF9F6;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;min-height:44px;border-radius:0;width:100%;';
       _errBtn.textContent = _errIsEN ? 'Try again' : 'R\u00e9essayer';
       _errBtn.addEventListener('click', function(){ location.reload(); });
       _errInner.appendChild(_errH);
       _errInner.appendChild(_errP);
       _errInner.appendChild(_errBtn);
       _errDiv.appendChild(_errInner);
       app.appendChild(_errDiv);
     } catch(e2) {}
   }
 }
 } finally { render._lock = false; }
}

// ─── AUTH: LOGIN SCREEN ───
function renderLogin(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'Nutrition & Sport'));
 c.appendChild(h('div', {'class': 'auth-line'}));

 if (window.TIPS) TIPS.renderToggle(c);

 if (S.authError) {
 c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
 }

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

 // Email
 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, window.t('auth.email')));
 var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
 f1.appendChild(emailInput);
 form.appendChild(f1);

 // Password
 var f2 = h('div', {'class': 'field'});
 f2.appendChild(h('label', {'class': 'field-label'}, window.t('auth.password')));
 var pwWrap = h('div', {style: 'position:relative;display:flex;align-items:center'});
 var pwInput = h('input', {type: 'password', placeholder: '••••••', autocomplete: 'current-password', style: 'padding-right:44px;width:100%;box-sizing:border-box'});
 var pwEye = h('button', {type: 'button', 'aria-label': 'Afficher/masquer le mot de passe', style: 'position:absolute;right:0;top:0;height:100%;width:44px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--grey,#6B6B65);-webkit-tap-highlight-color:transparent', onclick: function() { pwInput.type = pwInput.type === 'password' ? 'text' : 'password'; pwEye.innerHTML = pwInput.type === 'password' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'; }});
 pwEye.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
 pwWrap.appendChild(pwInput);
 pwWrap.appendChild(pwEye);
 f2.appendChild(pwWrap);
 form.appendChild(f2);

 // Login button
 var loginBtn = h('button', {'class': 'btn-primary', 'type': 'button', onclick: function(){
 if (loginBtn.disabled) return;
 var email = emailInput.value.trim();
 var pw = pwInput.value;
 if (!email || !pw) { S.authError = (window.isEnglish && window.isEnglish()) ? 'Please fill in all fields' : 'Veuillez remplir tous les champs'; render(); return; }
 if (typeof navigator !== 'undefined' && navigator.onLine === false) {
   S.authError = (window.isEnglish && window.isEnglish()) ? 'No network connection. Check your connection and retry.' : 'Pas de connexion réseau. Vérifiez votre connexion et réessayez.';
   render(); return;
 }
 loginBtn.disabled = true;
 loginBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Logging in...' : 'Connexion...';
 var _loginSafetyTimer = setTimeout(function() {
   if (loginBtn && loginBtn.disabled) {
     loginBtn.disabled = false;
     loginBtn.textContent = window.t ? window.t('auth.login_btn') : 'Se connecter';
     S.authError = (window.isEnglish && window.isEnglish()) ? 'Connection timed out. Check your network and retry.' : 'Délai dépassé. Vérifiez votre connexion et réessayez.';
     try { if (window.render) window.render(); } catch(e) {}
   }
 }, 10000);
 AUTH.login(email, pw).then(function(result) {
 clearTimeout(_loginSafetyTimer);
 if (result.ok) {
 S.authError = '';
 S.justLoggedIn = true;
 S.view = 'today';
 // Restore profile from localStorage for this user
 loadProfile();
 _migrateSteps();
 // Invariant grossesse : empêcher pregnant=true sur un profil non-féminin (données corrompues/stale)
 if (window.validatePregnancyState) window.validatePregnancyState();
 // FIX audit backend 2026-04-15 : extraire la logique de résolution de vue
 // dans une fonction pour qu'elle soit ré-appelée après syncOnLogin (sinon user
 // coincé sur vue stale si cloud plus récent que local).
 function _resolvePostLoginView() {
   var _loginProgSteps = [4, 6, 8, 10, 12, 14, 15, 16, 17, 18, 20, 21, 23, 25];
   // FIX 2026-04-16 : user qui a fini l'onboarding sport (sportType renseigné)
   // mais dont le programme muscu est généré ON-THE-FLY (pas stocké dans S.sportProgram
   // ni S.muscuIAProgram) tombait systématiquement sur la vue 'sport' au lieu de 'today'.
   // L'indicateur fiable est : S.sportType est renseigné = sport onboarding terminé.
   var _hasSportSetup = !!S.sportType;
   // Muscu local plan est computed fresh via buildPersonalizedMuscuPlan(S) — pas stocké.
   // CF/running/triathlon stockent dans S.sportProgram. Muscu IA dans S.muscuIAProgram.
   var _hasAnyProgram = (Array.isArray(S.sportProgram) && S.sportProgram.length > 0) || !!S.muscuIAProgram;
   // Onboarding sport EN COURS (step intermédiaire) ET sportType pas encore défini → rester sur sport
   // FIX 2026-04-16 : si sportType est renseigné, l'onboarding est TERMINÉ (sStep=4 = vue programme muscu,
   // pas "onboarding en cours"). Ne PAS rediriger vers sport dans ce cas → aller au dashboard.
   if (S.sStep > 0 && _loginProgSteps.indexOf(S.sStep) !== -1 && !_hasSportSetup) { S.view = 'sport'; }
   // Mode sport-only SANS aucun programme ET SANS sportType → lancer onboarding sport
   else if (S.appMode === 'sport' && !_hasSportSetup && !_hasAnyProgram) { S.view = 'sport'; }
   // Mode both : nutrition finie mais sport pas encore lancé → lancer onboarding sport
   else if (S.appMode === 'both' && S.nStep === 12 && !_hasSportSetup && !_hasAnyProgram) { S.view = 'sport'; }
   // Onboarding nutrition en cours
   else if (S.nStep > 0 && S.nStep < 12) { S.view = 'nutrition'; }
   // Tout le reste (onboarding terminé, programmes dispo) → Dashboard Today
   else if (S.appMode) { S.view = 'today'; }
   // Pas de mode → rester sur today aussi (default safe)
 }
 _resolvePostLoginView();
 // Restore language preference
 if (window.I18N && S.lang) window.I18N.current = S.lang;
 // Restore unit preferences
 if (window.UNITS) {
 window.UNITS.weight = S.weightUnit || 'kg';
 window.UNITS.height = S.heightUnit || 'cm';
 }
 // Load weight history (stored separately)
 try {
 var user = AUTH.getUser();
 var userId = user ? user.id : 'anon';
 var savedWH = localStorage.getItem('mtd_weight_history_' + userId);
 if (savedWH) S.weightHistory = JSON.parse(savedWH);
 } catch(e) {}
 // Migrate performance data
 if (window.PERF_HISTORY) {
 try { PERF_HISTORY.migrateExistingData(); } catch(e) {}
 }
 // C8 guard : marquer le statut abonnement comme "en chargement" avant tout render.
 // isPremium() retourne true et isTrialUser() retourne false tant que _subStatusReady=false,
 // évitant tout flash "trial" pour les comptes premium entre le render immédiat et fetchUserStatus.
 if (window.S) window.S._subStatusReady = false;
 // Sync from cloud (async — will re-render if cloud data was loaded)
 // Show a non-blocking sync indicator so the user knows data is loading (avoids blank-screen confusion).
 function _showSyncBanner() {
   var _b = document.getElementById('_sfc-sync-banner');
   if (_b) return;
   var banner = document.createElement('div');
   banner.id = '_sfc-sync-banner';
   var _msg = (window.isEnglish && window.isEnglish()) ? 'Syncing your data…' : 'Synchronisation en cours…';
   banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:8888;' +
     'background:var(--green,#3E5C3A);color:#FAF9F6;font-family:"Helvetica Neue",Arial,sans-serif;' +
     'font-size:9px;letter-spacing:3px;text-transform:uppercase;text-align:center;padding:6px;' +
     'pointer-events:none;animation:sfcToastIn .2s ease forwards;';
   banner.textContent = _msg;
   document.body.appendChild(banner);
 }
 function _hideSyncBanner() {
   var _b = document.getElementById('_sfc-sync-banner');
   if (_b && _b.parentNode) { _b.parentNode.removeChild(_b); }
   if (window.S) window.S._syncingFromCloud = false;
 }
 if (window.SupaSync) {
 window.S._syncingFromCloud = true;
 setTimeout(_showSyncBanner, 300); // Only show if sync takes >300ms (avoids flash on fast connections)
 SupaSync.syncOnLogin().then(function(syncResult) {
 _hideSyncBanner();
 if (syncResult === 'loaded_from_cloud') {
 _migrateSteps();
 if (window.I18N && S.lang) window.I18N.current = S.lang;
 if (window.UNITS) {
 window.UNITS.weight = S.weightUnit || 'kg';
 window.UNITS.height = S.heightUnit || 'cm';
 }
 _resolvePostLoginView();
 }
 SupaSync.startAutoSync();
 if (typeof SupaSync.fetchUserStatus === 'function') {
 SupaSync.fetchUserStatus().then(function() { render(); }).catch(function() { render(); });
 }
 }).catch(function(e) {
 _hideSyncBanner();
 console.warn('[Login] syncOnLogin unexpected error:', e);
 SupaSync.startAutoSync();
 render();
 });
 }
 if (window.GAMIFICATION) { GAMIFICATION.updateStreak(); GAMIFICATION.unlockBadge('first_login'); }
 // Enregistre la date du premier login (pour bloquer le bilan de forme au J+1)
 if (!window.S.firstLoginDate) {
   window.S.firstLoginDate = new Date().toISOString().slice(0, 10);
   window._profileDirty = true;
   if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
 }
 render();
 } else {
 S.authError = result.error;
 render();
 }
 }).catch(function() {
 clearTimeout(_loginSafetyTimer);
 S.view = 'auth'; // forcer le retour à l'écran login en cas d'erreur réseau
 S.authError = (window.isEnglish && window.isEnglish()) ? 'Connection error. Please try again.' : 'Erreur de connexion. Réessayez.';
 render();
 });
 }}, window.t('auth.login_btn'));
 form.appendChild(loginBtn);

 // Forgot password link
 var forgotLink = h('div', {style: 'text-align:center;margin-top:16px'});
 forgotLink.appendChild(h('a', {
 style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);cursor:pointer;text-decoration:underline',
 onclick: function(){ S.authError = ''; S.view = 'authForgot'; render(); }
 }, (window.isEnglish && window.isEnglish()) ? 'Forgot password?' : 'Mot de passe oubli\u00e9 ?'));
 form.appendChild(forgotLink);

 c.appendChild(form);

 // Switch to register
 var sw = h('div', {'class': 'auth-switch'});
 sw.appendChild(txt(window.t('auth.no_account') + ' '));
 sw.appendChild(h('a', {onclick: function(){ S.authError = ''; S.view = 'authRegister'; render(); }}, window.t('auth.register')));
 c.appendChild(sw);

 // Liens légaux footer login
 var legalFooter = h('div', {style: 'text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--border,#D8D8D0)'});
 legalFooter.appendChild(h('a', {href: '/privacy-policy.html', target: '_blank', rel: 'noopener', style: 'font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 8px'}, 'Confidentialit\u00e9'));
 legalFooter.appendChild(h('a', {href: '/cgu.html', target: '_blank', rel: 'noopener', style: 'font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 8px'}, 'CGU'));
 legalFooter.appendChild(h('a', {href: '/mentions-legales.html', target: '_blank', rel: 'noopener', style: 'font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 8px'}, 'Mentions l\u00e9gales'));
 c.appendChild(legalFooter);

 app.appendChild(c);
}

// ─── AUTH: REGISTER SCREEN ───
function renderRegister(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, window.t('auth.register')));
 c.appendChild(h('div', {'class': 'auth-line'}));

 if (window.TIPS) TIPS.renderToggle(c);

 if (S.authError) {
 c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
 }

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

 // ── Prénom (optionnel) ────────────────────────────────────────────────────
 var f0 = h('div', {'class': 'field'});
 f0.appendChild(h('label', {'class': 'field-label'}, (window.isEnglish && window.isEnglish()) ? 'First name (optional)' : 'Prénom (optionnel)'));
 var nameInput = h('input', {type: 'text', placeholder: (window.isEnglish && window.isEnglish()) ? 'Your first name' : 'Votre prénom', autocomplete: 'given-name'});
 f0.appendChild(nameInput);
 form.appendChild(f0);

 // ── Email ─────────────────────────────────────────────────────────────────
 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, window.t('auth.email') + ' ●'));
 var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
 f1.appendChild(emailInput);
 form.appendChild(f1);

 // ── Password ──────────────────────────────────────────────────────────────────
 var f2 = h('div', {'class': 'field'});
 f2.appendChild(h('label', {'class': 'field-label'}, window.t('auth.password') + ' ●'));
 var pwWrap2 = h('div', {style: 'position:relative;display:flex;align-items:center'});
 var pwInput = h('input', {type: 'password', placeholder: 'Ex: Motdepasse1!', autocomplete: 'new-password', style: 'padding-right:44px;width:100%;box-sizing:border-box'});
 var pwEye2 = h('button', {type: 'button', 'aria-label': 'Afficher/masquer le mot de passe', style: 'position:absolute;right:0;top:0;height:100%;width:44px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--grey,#6B6B65);-webkit-tap-highlight-color:transparent', onclick: function() { pwInput.type = pwInput.type === 'password' ? 'text' : 'password'; pwEye2.innerHTML = pwInput.type === 'password' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'; }});
 pwEye2.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
 pwWrap2.appendChild(pwInput);
 pwWrap2.appendChild(pwEye2);
 f2.appendChild(pwWrap2);
 var pwHint = h('div', {style: 'font-size:10px;color:var(--grey,#6B6B65);margin-top:4px;display:none'}, '6 caractères min, 1 majuscule, 1 chiffre, 1 caractère spécial');
 f2.appendChild(pwHint);
 pwInput.addEventListener('input', function() {
   pwHint.style.display = pwInput.value.length > 0 ? 'block' : 'none';
   var ok = window.isValidPassword && window.isValidPassword(pwInput.value);
   pwHint.style.color = ok ? 'var(--success,#2E7D32)' : 'var(--grey,#6B6B65)';
 });
 form.appendChild(f2);

 // ── Confirm password ──────────────────────────────────────────────────────────
 var f3 = h('div', {'class': 'field'});
 f3.appendChild(h('label', {'class': 'field-label'}, window.t('auth.confirm_password') + ' ●'));
 var pw2Wrap = h('div', {style: 'position:relative;display:flex;align-items:center'});
 var pw2Input = h('input', {type: 'password', placeholder: 'Retapez le mot de passe', autocomplete: 'new-password', style: 'padding-right:44px;width:100%;box-sizing:border-box'});
 var pw2Eye = h('button', {type: 'button', 'aria-label': 'Afficher/masquer la confirmation', style: 'position:absolute;right:0;top:0;height:100%;width:44px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--grey,#6B6B65);-webkit-tap-highlight-color:transparent', onclick: function() { pw2Input.type = pw2Input.type === 'password' ? 'text' : 'password'; pw2Eye.innerHTML = pw2Input.type === 'password' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'; }});
 pw2Eye.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
 pw2Wrap.appendChild(pw2Input);
 pw2Wrap.appendChild(pw2Eye);
 f3.appendChild(pw2Wrap);
 form.appendChild(f3);

 // ── Consentement RGPD (obligatoire — Art. 9 données de santé) ─────────────────
 var consentWrap = h('div', {style: 'display:flex;align-items:flex-start;gap:10px;margin:16px 0 8px;padding:12px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px'});
 var consentCheck = h('input', {type: 'checkbox', id: 'rgpd-consent', style: 'margin-top:3px;min-width:18px;min-height:18px;cursor:pointer'});
 consentWrap.appendChild(consentCheck);
 var consentLabel = h('label', {'for': 'rgpd-consent', style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.6;cursor:pointer'});
 consentLabel.innerHTML = 'J’accepte la <a href="/privacy-policy.html" target="_blank" rel="noopener" style="color:var(--ink-900,#0A0A09);text-decoration:underline">politique de confidentialité</a> et les <a href="/cgu.html" target="_blank" rel="noopener" style="color:var(--ink-900,#0A0A09);text-decoration:underline">conditions générales d’utilisation</a>. Je consens au traitement de mes données de santé (poids, conditions médicales, grossesse) pour la personnalisation de mon programme.';
 consentWrap.appendChild(consentLabel);
 form.appendChild(consentWrap);

 // ── Register button ───────────────────────────────────────────────────────────────────
 var regBtn = h('button', {'class': 'btn-primary', 'type': 'button', onclick: function(){
 if (regBtn.disabled) return;
 var name = nameInput.value.trim();
 var email = emailInput.value.trim();
 var pw = pwInput.value;
 var pw2 = pw2Input.value;

 if (!email || !pw || !pw2) { S.authError = (window.isEnglish && window.isEnglish()) ? 'Email and password are required.' : 'Email et mot de passe sont obligatoires.'; render(); return; }
 if (pw !== pw2) { S.authError = window.t('auth.error_password_match'); render(); return; }
 if (!window.isValidPassword(pw)) { S.authError = window.t('auth.error_password_rules'); render(); return; }
 if (!consentCheck.checked) { S.authError = 'Veuillez accepter la politique de confidentialité et les CGU pour créer votre compte.'; render(); return; }

 if (typeof navigator !== 'undefined' && navigator.onLine === false) {
   S.authError = (window.isEnglish && window.isEnglish()) ? 'No network connection. Check your connection and retry.' : 'Pas de connexion réseau. Vérifiez votre connexion et réessayez.';
   render(); return;
 }
 regBtn.disabled = true;
 regBtn.textContent = 'Création...';
 var _regSafetyTimer = setTimeout(function() {
   if (regBtn && regBtn.disabled) {
     regBtn.disabled = false;
     regBtn.textContent = window.t ? window.t('auth.register_btn') : 'Créer mon compte';
     S.authError = 'Délai dépassé. Vérifiez votre connexion et réessayez.';
     try { if (window.render) window.render(); } catch(e) {}
   }
 }, 10000);
 // Use email prefix as backend name when prénom not provided (validateName requires ≥2 chars)
 var _rawName = name || email.split('@')[0];
 var regName = _rawName.length >= 2 ? _rawName : _rawName + '_';
 AUTH.register(regName, email, pw, {}).then(function(result) {
 clearTimeout(_regSafetyTimer);
 if (result.ok) {
 S.authError = '';
 if (name) { S.prenom = name; }
 // Navigate to onboarding immediately — email verify reminder shown as banner
 S._pendingEmailVerify = email;
 S.authVerifyEmail = email;
 S.view = 'nutrition';
 S.nStep = 0;
 render();
 } else {
 S.authError = result.error;
 render();
 }
 }).catch(function() {
 clearTimeout(_regSafetyTimer);
 S.authError = 'Erreur lors de la création du compte. Réessayez.';
 render();
 });
 }}, window.t('auth.register_btn'));
 form.appendChild(regBtn);

 c.appendChild(form);

 // Switch to login
 var sw = h('div', {'class': 'auth-switch'});
 sw.appendChild(txt(window.t('auth.has_account') + ' '));
 sw.appendChild(h('a', {onclick: function(){ S.authError = ''; S.view = 'auth'; render(); }}, window.t('auth.login')));
 c.appendChild(sw);

 // Liens légaux footer register
 var legalFooter2 = h('div', {style: 'text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--border,#D8D8D0)'});
 legalFooter2.appendChild(h('a', {href: '/privacy-policy.html', target: '_blank', rel: 'noopener', style: 'font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 8px'}, 'Confidentialité'));
 legalFooter2.appendChild(h('a', {href: '/cgu.html', target: '_blank', rel: 'noopener', style: 'font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 8px'}, 'CGU'));
 legalFooter2.appendChild(h('a', {href: '/mentions-legales.html', target: '_blank', rel: 'noopener', style: 'font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;margin:0 8px'}, 'Mentions légales'));
 c.appendChild(legalFooter2);

 app.appendChild(c);
}

// ─── AUTH: VERIFY EMAIL SCREEN ───
function renderVerifyEmail(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'V\u00e9rifie ton email'));
 c.appendChild(h('div', {'class': 'auth-line'}));

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

 // Title
 form.appendChild(h('h2', {style: 'text-align:center;margin:0 0 8px 0;font-size:24px'}, 'V\u00e9rifie ton email'));

 // Subtitle
 form.appendChild(h('p', {style: 'text-align:center;margin:0 0 6px 0;color:var(--grey);font-size:13px'}, 'Un email de confirmation a \u00e9t\u00e9 envoy\u00e9 \u00e0 :'));

 // Email display
 form.appendChild(h('p', {style: 'text-align:center;margin:0 0 20px 0;font-weight:bold;font-size:16px'}, S.authVerifyEmail || ''));

 // Instruction
 form.appendChild(h('p', {style: 'text-align:center;margin:0 0 24px 0;color:var(--grey);font-size:13px;line-height:1.6'}, 'Clique sur le lien dans l\u2019email pour activer ton compte.'));

 // Status message container
 var statusMsg = h('div', {style: 'text-align:center;min-height:24px;margin-bottom:12px;font-size:13px'});
 form.appendChild(statusMsg);

 // Resend button
 form.appendChild(h('button', {
 'class': 'btn-primary',
 'type': 'button',
 style: 'background:transparent;border:1px solid var(--border);color:var(--fg);margin-bottom:10px;width:100%',
 onclick: function() {
 var client = window.getSupabaseClient ? window.getSupabaseClient() : null;
 if (!client) {
 statusMsg.textContent = 'Erreur : client non disponible.';
 statusMsg.style.color = 'var(--error,#7A1F1F)';
 return;
 }
 statusMsg.textContent = 'Envoi en cours...';
 statusMsg.style.color = 'var(--grey)';
 client.auth.resend({type: 'signup', email: S.authVerifyEmail}).then(function(res) {
 if (res.error) {
 statusMsg.textContent = res.error.message || 'Erreur lors du renvoi.';
 statusMsg.style.color = 'var(--error,#7A1F1F)';
 } else {
 statusMsg.textContent = 'Email renvoy\u00e9 !';
 statusMsg.style.color = 'var(--success,#3E5C3A)';
 }
 }).catch(function() {
 statusMsg.textContent = 'Erreur r\u00e9seau. R\u00e9essaye.';
 statusMsg.style.color = 'var(--error,#7A1F1F)';
 });
 }
 }, 'Renvoyer l\u2019email'));

 // Confirm button
 form.appendChild(h('button', {
 'class': 'btn-primary',
 'type': 'button',
 style: 'width:100%',
 onclick: function() {
 var client = window.getSupabaseClient ? window.getSupabaseClient() : null;
 if (!client) {
 statusMsg.textContent = 'Erreur : client non disponible.';
 statusMsg.style.color = 'var(--error,#7A1F1F)';
 return;
 }
 statusMsg.textContent = 'V\u00e9rification...';
 statusMsg.style.color = 'var(--ink-500,#6B6B65)';
 var _done = false;
 var _timeout = setTimeout(function() {
   if (_done) return; _done = true;
   statusMsg.textContent = 'Connexion lente. V\u00e9rifie ta connexion internet puis r\u00e9essaye.';
   statusMsg.style.color = 'var(--error,#7A1F1F)';
 }, 10000);
 var checkFn = client.auth.getUser ? client.auth.getUser() : client.auth.getSession();
 checkFn.then(function(res) {
   if (_done) return; _done = true; clearTimeout(_timeout);
   var user = res.data && (res.data.user || (res.data.session && res.data.session.user));
   if (user && user.email_confirmed_at) {
     S.authError = '';
     // BUG FIX 2026-05 : if the user confirmed email in a DIFFERENT browser/app (e.g.
     // iOS Mail opens Safari while the PWA is Chrome), _currentSession is still null here.
     // Routing to onboarding without a session causes saveProfile() to write to
     // mtd_profile_anon instead of mtd_profile_<uid> \u2014 data is then wiped by the
     // next _doAutoLogin() purge. Fix: require an active session; if missing, guide
     // the user to log in with their password so the session is properly established.
     if (window.AUTH && !window.AUTH.isLoggedIn()) {
       statusMsg.textContent = '\u2713 Email confirm\u00e9 ! Connectez-vous maintenant avec votre mot de passe.';
       statusMsg.style.color = 'var(--green,#3E5C3A)';
       setTimeout(function() { S.view = 'auth'; render(); }, 1800);
       return;
     }
     if (window.loadProfile) window.loadProfile();
     if (S.appMode === 'sport') {
       S.view = 'sport';
     } else if (S.nStep > 0 && S.nStep < 12) {
       S.view = 'nutrition'; // resume interrupted onboarding
     } else if (S.appMode) {
       S.view = 'today'; // returning user \u2014 profile fully loaded
     } else {
       S.view = 'nutrition'; S.nStep = 0; // brand new user \u2014 mode selection
     }
     if (window.GAMIFICATION) { try { GAMIFICATION.unlockBadge('first_login'); } catch(e) {} }
     if (window.SupaSync) {
       try { window.SupaSync.syncOnLogin(); window.SupaSync.startAutoSync(); } catch(e) {}
     }
     try { render(); } catch(e) {
       statusMsg.textContent = 'Erreur d\'affichage. Rechargez la page.';
       statusMsg.style.color = 'var(--error,#7A1F1F)';
     }
   } else {
     statusMsg.textContent = 'Email pas encore confirm\u00e9. V\u00e9rifie ta bo\u00eete mail (et les spams).';
     statusMsg.style.color = 'var(--error,#7A1F1F)';
   }
 }).catch(function() {
   if (_done) return; _done = true; clearTimeout(_timeout);
   statusMsg.textContent = 'Erreur de v\u00e9rification. R\u00e9essaye.';
   statusMsg.style.color = 'var(--error,#7A1F1F)';
 });
 }
 }, 'J\u2019ai confirm\u00e9 mon email'));

 c.appendChild(form);

 // Back to login link
 var sw = h('div', {'class': 'auth-switch'});
 sw.appendChild(h('a', {onclick: function() { S.authError = ''; S.view = 'auth'; render(); }}, 'Retour \u00e0 la connexion'));
 c.appendChild(sw);

 // Spam hint
 c.appendChild(h('p', {style: 'text-align:center;margin-top:16px;font-size:11px;color:var(--grey3,#888)'}, 'Tu ne trouves pas l\u2019email ? V\u00e9rifie ton dossier spam.'));

 app.appendChild(c);
}

// ─── AUTH: FORGOT PASSWORD SCREEN ───
function renderForgotPassword(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'R\u00e9initialisation'));
 c.appendChild(h('div', {'class': 'auth-line'}));

 if (S.authError) {
 c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
 }

 if (S._resetSent) {
 // Confirmation screen
 c.appendChild(h('div', {style: 'text-align:center;padding:24px 0'}, [
 h('div', {style: 'font-family:Georgia,serif;font-size:24px;margin-bottom:16px'}, 'V\u00e9rifiez votre bo\u00eete mail'),
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px'},
 'Si un compte est associ\u00e9 \u00e0 ' + (S._resetEmail || 'cette adresse') + ', vous allez recevoir un lien de r\u00e9initialisation. V\u00e9rifiez \u00e9galement votre dossier spam.'),
 h('button', {'class': 'btn-secondary', onclick: function() {
 S._resetSent = false;
 S._resetEmail = '';
 S.authError = '';
 S.view = 'auth';
 render();
 }}, 'Retour \u00e0 la connexion')
 ]));
 app.appendChild(c);
 return;
 }

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

 form.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px;text-align:center'},
 'Entrez votre adresse email. Vous recevrez un lien pour cr\u00e9er un nouveau mot de passe.'));

 // Email field
 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, 'Email'));
 var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
 f1.appendChild(emailInput);
 form.appendChild(f1);

 // Send button
 var sendBtn = h('button', {'class': 'btn-primary', 'type': 'button', onclick: function() {
 if (sendBtn.disabled) return;
 var email = emailInput.value.trim();
 if (!email) { S.authError = 'Veuillez entrer votre adresse email'; render(); return; }
 sendBtn.disabled = true;
 sendBtn.textContent = 'Envoi en cours...';
 AUTH.resetPassword(email).then(function(result) {
 if (result.ok) {
 S.authError = '';
 S._resetSent = true;
 S._resetEmail = email;
 render();
 } else {
 S.authError = result.error;
 sendBtn.disabled = false;
 sendBtn.textContent = 'Envoyer le lien';
 render();
 }
 }).catch(function() {
 S.authError = 'Erreur r\u00e9seau. R\u00e9essayez.';
 sendBtn.disabled = false;
 sendBtn.textContent = 'Envoyer le lien';
 render();
 });
 }}, 'Envoyer le lien');
 form.appendChild(sendBtn);

 c.appendChild(form);

 // Back to login
 var sw = h('div', {'class': 'auth-switch'});
 sw.appendChild(h('a', {onclick: function() { S.authError = ''; S.view = 'auth'; render(); }}, 'Retour \u00e0 la connexion'));
 c.appendChild(sw);

 app.appendChild(c);
}

// ─── AUTH: SET NEW PASSWORD (after reset link clicked) ───
function renderNewPassword(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'Nouveau mot de passe'));
 c.appendChild(h('div', {'class': 'auth-line'}));

 if (S.authError) {
 c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
 }

 if (S._passwordUpdated) {
 c.appendChild(h('div', {style: 'text-align:center;padding:24px 0'}, [
 h('div', {style: 'font-family:Georgia,serif;font-size:24px;margin-bottom:16px'}, 'Mot de passe modifi\u00e9'),
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px'},
 'Votre mot de passe a \u00e9t\u00e9 mis \u00e0 jour. Vous \u00eates connect\u00e9 et votre programme vous attend.'),
 h('button', {'class': 'btn-primary', 'type': 'button', onclick: function() {
 S._passwordUpdated = false;
 S.authError = '';
 S.view = 'today';
 render();
 }}, 'Acc\u00e9der \u00e0 mon programme')
 ]));
 app.appendChild(c);
 return;
 }

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});
 form.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px;text-align:center'},
 'Nouveau mot de passe : min. 6 caract\u00e8res, une majuscule, un chiffre, un caract\u00e8re sp\u00e9cial.'));

 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, 'Nouveau mot de passe'));
 var pw1 = h('input', {type: 'password', placeholder: 'Ex: Motdepasse1!', autocomplete: 'new-password'});
 f1.appendChild(pw1);
 form.appendChild(f1);

 var f2 = h('div', {'class': 'field'});
 f2.appendChild(h('label', {'class': 'field-label'}, 'Confirmer'));
 var pw2 = h('input', {type: 'password', placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022', autocomplete: 'new-password'});
 f2.appendChild(pw2);
 form.appendChild(f2);

 var saveBtn = h('button', {'class': 'btn-primary', 'type': 'button', onclick: function() {
 if (saveBtn.disabled) return;
 var p1 = pw1.value, p2 = pw2.value;
 if (!window.isValidPassword || !window.isValidPassword(p1)) { S.authError = window.t ? window.t('auth.error_password_rules') : 'Mot de passe insuffisant'; render(); return; }
 if (p1 !== p2) { S.authError = 'Les mots de passe ne correspondent pas'; render(); return; }
 saveBtn.disabled = true;
 saveBtn.textContent = 'Mise \u00e0 jour...';
 var _jwtPromise = window.AUTH && typeof window.AUTH.getJWT === 'function' ? window.AUTH.getJWT() : Promise.resolve(null);
 _jwtPromise.then(function(jwt) {
   if (jwt) {
     return fetch('/.netlify/functions/change-password', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
       body: JSON.stringify({ password: p1 })
     }).then(function(res) { return res.json().then(function(d) { return { status: res.status, data: d }; }); });
   }
   var client = window.getSupabaseClient ? window.getSupabaseClient() : null;
   if (client && client.auth) {
     return client.auth.updateUser({ password: p1 }).then(function(r) {
       if (r.error) return { status: 422, data: { error: r.error.message } };
       return { status: 200, data: { ok: true } };
     });
   }
   return Promise.resolve({ status: 503, data: { error: 'Service indisponible' } });
 }).then(function(result) {
   if (result && result.status === 200 && result.data && result.data.ok) {
     S.authError = '';
     S._passwordUpdated = true;
     render();
   } else {
     S.authError = (result && result.data && result.data.error) || 'Erreur lors de la mise \u00e0 jour';
     saveBtn.disabled = false;
     saveBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Save' : 'Enregistrer';
     render();
   }
 }).catch(function() {
   var client = window.getSupabaseClient ? window.getSupabaseClient() : null;
   if (client && client.auth) {
     client.auth.updateUser({ password: p1 }).then(function(r) {
       if (r.error) { S.authError = r.error.message || 'Erreur lors de la mise \u00e0 jour'; }
       else { S.authError = ''; S._passwordUpdated = true; }
       render();
     }).catch(function() { S.authError = 'Erreur r\u00e9seau. R\u00e9essayez.'; render(); });
   } else {
     S.authError = 'Service indisponible'; render();
   }
   saveBtn.disabled = false;
   saveBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Save' : 'Enregistrer';
 });
 }}, (window.isEnglish && window.isEnglish()) ? 'Save' : 'Enregistrer');
 form.appendChild(saveBtn);

 // Lien de secours si le token Supabase expire en cours de saisie
 c.appendChild(form);

 // Lien retour \u2014 apr\u00e8s le formulaire (ordre DOM logique)
 var cancelLink = h('div', {'class': 'auth-switch'});
 cancelLink.appendChild(h('a', {onclick: function() { S.authError = ''; S.view = 'auth'; render(); }}, 'Retour \u00e0 la connexion'));
 c.appendChild(cancelLink);
 app.appendChild(c);
}

// ─── POST-SESSION PANEL ───────────────────────────────────────────────────────
function renderPostSessionPanel(data) {
  var isEn = window.isEnglish && window.isEnglish();
  var screen = data.screen || 1;

  var panel = document.createElement('div');
  panel.id = 'sfc-post-session-panel';
  panel.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#FAFAF7;display:flex;flex-direction:column;overflow-y:auto;animation:_psp-slide .28s cubic-bezier(.22,.61,.36,1) both;';

  if (!document.getElementById('_sfc-psp-css')) {
    var st = document.createElement('style');
    st.id = '_sfc-psp-css';
    st.textContent = '@keyframes _psp-slide{from{transform:translateY(100%)}to{transform:translateY(0)}}';
    document.head.appendChild(st);
  }

  function _close() { S._postSessionPanel = null; window.render(); }
  function _next() { data.screen = screen + 1; window.render(); }

  var inner = document.createElement('div');
  inner.style.cssText = 'max-width:480px;width:100%;margin:0 auto;padding:32px 24px 48px;box-sizing:border-box;display:flex;flex-direction:column;min-height:100vh;justify-content:center;';

  // ── Screen 1 — IDENTITY ──────────────────────────────────────────────────────
  if (screen === 1) {
    var s1n = data.totalSessions || 1;
    var s1Head = document.createElement('div');
    s1Head.style.cssText = 'font-family:Georgia,serif;font-size:32px;color:var(--black,#0A0A09);margin-bottom:10px;line-height:1.1;';
    s1Head.textContent = (isEn ? 'Session ' : 'Séance ') + s1n + '.';
    inner.appendChild(s1Head);

    var s1Sub = document.createElement('div');
    s1Sub.style.cssText = 'font-family:Georgia,serif;font-size:16px;color:var(--grey,#6B6B65);font-style:italic;margin-bottom:28px;';
    (function() {
      var _s1sub = '';
      if (s1n === 1) {
        _s1sub = isEn ? 'First session. The foundations are set.' : 'Première séance. Les bases sont posées.';
      } else if (s1n <= 4) {
        _s1sub = isEn ? 'Session ' + s1n + '. The habit is being built.' : 'Séance ' + s1n + '. L\'habitude se construit.';
      } else if (s1n < 20) {
        _s1sub = isEn ? s1n + ' sessions. Consistent.' : s1n + ' séances. Constant.';
      } else {
        _s1sub = isEn ? s1n + ' sessions. None skipped.' : s1n + ' séances. Aucune abandonnée.';
      }
      s1Sub.textContent = _s1sub;
    })();
    inner.appendChild(s1Sub);

    var s1Sep = document.createElement('div');
    s1Sep.style.cssText = 'height:1px;background:var(--border,#D8D8D0);margin-bottom:20px;';
    inner.appendChild(s1Sep);

    var s1Data = document.createElement('div');
    s1Data.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);letter-spacing:1px;text-align:center;margin-bottom:16px;';
    var _loadLabels1 = { light: isEn ? 'Light' : 'Légère', moderate: isEn ? 'Moderate' : 'Modérée', heavy: isEn ? 'Heavy' : 'Lourde', max: isEn ? 'Max' : 'Maximale' };
    s1Data.textContent = data.duration + ' min  ·  ' + data.kcalTotal + ' kcal  ·  ' + (_loadLabels1[data.load] || data.load);
    inner.appendChild(s1Data);
    if (data.load === 'heavy' || data.load === 'max') {
      var s1LoadCtx = document.createElement('div');
      s1LoadCtx.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange-ink,#7A3B0E);font-style:italic;margin-bottom:20px;text-align:center;';
      s1LoadCtx.textContent = isEn ? 'Heavy session — nutrition and sleep priority.' : 'Séance intense — nutrition et sommeil prioritaires.';
      inner.appendChild(s1LoadCtx);
    }

    var s1Btn = document.createElement('button');
    s1Btn.style.cssText = 'width:100%;padding:16px;background:var(--black,#0A0A09);color:#FAFAF7;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;min-height:52px;';
    s1Btn.textContent = isEn ? '▼ see the insight' : '▼ voir le bilan';
    s1Btn.onclick = _next;
    inner.appendChild(s1Btn);
  }

  // ── Screen 2 — INTELLIGENCE (symbiosis delta) ────────────────────────────────
  else if (screen === 2) {
    var s2Eye = document.createElement('div');
    s2Eye.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:18px;';
    s2Eye.textContent = isEn ? 'WHAT JUST CHANGED' : 'CE QUI A CHANGÉ';
    inner.appendChild(s2Eye);

    var carbDelta = (data.nmCarbs || 0) - (data.nmCarbsBefore || 0);
    if (carbDelta >= 5) {
      var s2Delta = document.createElement('div');
      s2Delta.style.cssText = 'font-family:Georgia,serif;font-size:22px;color:var(--black,#0A0A09);margin-bottom:6px;line-height:1.2;';
      s2Delta.textContent = (isEn ? 'Carbs: ' : 'Glucides : ') + (data.nmCarbsBefore || 0) + 'g → ' + (data.nmCarbs || 0) + 'g';
      inner.appendChild(s2Delta);

      var s2Reason = document.createElement('div');
      s2Reason.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--orange-ink,#7A3B0E);margin-bottom:24px;';
      s2Reason.textContent = isEn ? "That's why." : "C'est pour ça.";
      inner.appendChild(s2Reason);
    } else {
      var s2Stable = document.createElement('div');
      s2Stable.style.cssText = 'font-family:Georgia,serif;font-size:17px;color:var(--black,#0A0A09);margin-bottom:10px;line-height:1.3;';
      var _s2msg = (function() {
        var _st = S.sportType || 'musculation';
        var _ld = data.load || 'light';
        var _nx = (data.totalSessions || 1) % 4;
        var fr, en;
        if (_st === 'running' || _st === 'cycling' || _st === 'triathlon') {
          fr = ['Base aérobie renforcée. Les sorties légères construisent les performances dures.', 'Travail Z2 validé. Votre moteur absorbe la charge silencieusement.', 'Endurance composée. Les gains les plus durables se bâtissent ici.', 'Récupération aérobie. Votre moteur se reconstruit entre les efforts.'];
          en = ['Aerobic base reinforced. Easy sessions build the hard ones.', 'Z2 work done. Your engine absorbs load silently.', 'Endurance compounding. The most durable gains are built here.', 'Aerobic recovery. Your engine rebuilds between efforts.'];
        } else if (_st === 'crossfit') {
          fr = ['SNC préservé. L\'intensité est une ressource — gérez-la.', 'La capacité se construit entre les efforts. Récupérer, c\'est s\'entraîner.', 'Les athlètes élites récupèrent aussi intelligemment qu\'ils s\'entraînent.', 'Volume contrôlé. Les semaines solides valent mieux que les séances isolées.'];
          en = ['CNS preserved. Intensity is a resource — manage it.', 'Capacity builds between efforts. Recovery is training.', 'Elite athletes recover as intelligently as they train.', 'Controlled volume. Solid weeks beat isolated sessions.'];
        } else if (_ld === 'moderate') {
          fr = ['Travail effectué. Votre corps absorbe et revient plus fort.', 'L\'entraînement régulier construit le moteur. Cette séance compte.', 'Volume validé. L\'effet cumulé est silencieux mais réel.', 'Progression constante. Chaque séance validée est une brique posée.'];
          en = ['Work done. Your body absorbs this and comes back stronger.', 'Consistent training builds the engine. This session counts.', 'Volume logged. The compound effect is silent but real.', 'Steady progress. Every session logged is a brick laid.'];
        } else {
          fr = ['Récupération active. Les adaptations se consolident entre les séances.', 'Cohérence > intensité. Cette séance compte autant que les plus lourdes.', 'Système nerveux préservé. Les adaptations continuent après la séance.', 'Volume contrôlé. Le progrès vit dans la régularité.'];
          en = ['Active recovery. Adaptations consolidate between sessions.', 'Consistency > intensity. This session matters as much as the hardest ones.', 'Nervous system preserved. Adaptations continue post-session.', 'Controlled volume. Progress lives in regularity.'];
        }
        return isEn ? en[_nx] : fr[_nx];
      })();
      s2Stable.textContent = _s2msg;
      inner.appendChild(s2Stable);
      var s2NutNote = document.createElement('div');
      s2NutNote.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);letter-spacing:0.5px;margin-bottom:24px;';
      s2NutNote.textContent = isEn ? 'Nutrition calibrated to today’s output.' : 'Nutrition calibrée sur la dépense du jour.';
      inner.appendChild(s2NutNote);
    }

    var s2Sep = document.createElement('div');
    s2Sep.style.cssText = 'height:1px;background:var(--border,#D8D8D0);margin-bottom:20px;';
    inner.appendChild(s2Sep);

    var s2TmrLabel = document.createElement('div');
    s2TmrLabel.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;';
    s2TmrLabel.textContent = isEn ? 'TOMORROW' : 'DEMAIN';
    inner.appendChild(s2TmrLabel);

    var s2TmrVal = document.createElement('div');
    s2TmrVal.style.cssText = 'font-family:Georgia,serif;font-size:16px;color:var(--black,#0A0A09);margin-bottom:28px;';
    s2TmrVal.textContent = data.tomorrowIsRest
      ? (isEn ? 'Rest · Recovery priority.' : 'Repos · Récupération prioritaire.')
      : (data.tomorrowFocus || (isEn ? 'Next session.' : 'Prochaine séance.'));
    inner.appendChild(s2TmrVal);

    var s2Btn = document.createElement('button');
    s2Btn.style.cssText = 'width:100%;padding:16px;background:var(--black,#0A0A09);color:#FAFAF7;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;min-height:52px;margin-bottom:10px;';
    s2Btn.textContent = isEn ? '▼ what comes next' : '▼ la suite';
    s2Btn.onclick = _next;
    inner.appendChild(s2Btn);

    var s2Close = document.createElement('button');
    s2Close.style.cssText = 'width:100%;padding:12px;background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);cursor:pointer;';
    s2Close.textContent = isEn ? 'Close' : 'Fermer';
    s2Close.onclick = _close;
    inner.appendChild(s2Close);
  }

  // ── Screen 3 — NEXT LOOP (projection) ───────────────────────────────────────
  else {
    var s3Eye = document.createElement('div');
    s3Eye.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:18px;';
    s3Eye.textContent = isEn ? 'IN 7 DAYS' : 'DANS 7 JOURS';
    inner.appendChild(s3Eye);

    if (data.projCompound && data.projTarget > 0) {
      var s3Proj = document.createElement('div');
      s3Proj.style.cssText = 'font-family:Georgia,serif;font-size:24px;color:var(--black,#0A0A09);margin-bottom:6px;line-height:1.2;';
      s3Proj.textContent = data.projCompound + ' → ' + data.projTarget + ' kg';
      inner.appendChild(s3Proj);
    }

    var s3Plan = document.createElement('div');
    s3Plan.style.cssText = 'font-family:Georgia,serif;font-size:14px;color:var(--grey,#6B6B65);font-style:italic;margin-bottom:32px;';
    s3Plan.textContent = (function() {
      var _s3n = data.totalSessions || 1;
      if (_s3n < 5) return isEn ? 'Foundation. Every session is a habit being formed.' : 'Fondations. Chaque s\u00e9ance est une habitude qui se construit.';
      if (_s3n < 20) return isEn ? 'Building momentum. The compound effect is real.' : '\u00c9lan en construction. L\'effet cumul\u00e9 est r\u00e9el.';
      return isEn ? 'The engine holds. Precision and consistency \u2014 that\u2019s the formula.' : 'Le moteur tient. Pr\u00e9cision et r\u00e9gularit\u00e9 \u2014 c\'est la formule.';
    })()
    inner.appendChild(s3Plan);

    var s3CoachBtn = document.createElement('button');
    s3CoachBtn.style.cssText = 'width:100%;padding:16px;background:var(--black,#0A0A09);color:#FAFAF7;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;min-height:52px;margin-bottom:10px;';
    s3CoachBtn.textContent = isEn ? 'TALK TO THE COACH' : 'PARLER AU COACH';
    s3CoachBtn.onclick = function() { _close(); S.view = 'today'; window.render(); };
    inner.appendChild(s3CoachBtn);

    var s3Close = document.createElement('button');
    s3Close.style.cssText = 'width:100%;padding:12px;background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);cursor:pointer;';
    s3Close.textContent = isEn ? 'Close' : 'Fermer';
    s3Close.onclick = _close;
    inner.appendChild(s3Close);
  }

  panel.appendChild(inner);
  return panel;
}

// ─── MAKE RENDER GLOBAL ───
// window.render is the debounced public API (coalesces rapid calls from other modules into 1 DOM rebuild per frame).
// Internal app-main calls use render() directly for immediate synchronous execution (auth flows, etc.).
window.render = (function(_fn) {
  var _t = null;
  return function() {
    if (_t) clearTimeout(_t);
    _t = setTimeout(function() { _t = null; _fn(); }, 16);
  };
})(render);

// ─── LAZY SCRIPT LOADER ───
// Loads a JS file on-demand (once), calls all queued callbacks when ready.
window._lazyLoad = (function() {
  var _loaded = {}, _pending = {}, _timers = {};
  return function(src, cb) {
    if (_loaded[src]) { if (cb) cb(); return; }
    if (_pending[src]) { if (cb) _pending[src].push(cb); return; }
    _pending[src] = cb ? [cb] : [];
    var el = document.createElement('script');
    el.src = src;
    var _flush = function(ok) {
      clearTimeout(_timers[src]);
      if (ok) _loaded[src] = true;
      (_pending[src] || []).forEach(function(fn) { try { fn(); } catch(e) {} });
      delete _pending[src];
      delete _timers[src];
    };
    el.onload = function() { _flush(true); };
    el.onerror = function() { _flush(false); };
    _timers[src] = setTimeout(function() {
      console.warn('[_lazyLoad] timeout:', src);
      _flush(false);
    }, 8000);
    document.head.appendChild(el);
  };
})();

// ─── DARK MODE PREFERENCE ───
var _dmUid = (window.AUTH && window.AUTH.getUser && window.AUTH.getUser()) ? window.AUTH.getUser().id : null;
var _dmKey = _dmUid ? ('mtd_dark_mode_' + _dmUid) : 'mtd_dark_mode';
try { if (localStorage.getItem(_dmKey) === '1') document.body.classList.add('dark-mode'); } catch(e) {}

// ─── DEV ONLY: ?reset=users handler (localhost only) ───
(function() {
 var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
 if (isLocal && location.search.indexOf('reset=users') !== -1) {
 ['mtd_users','mtd_session','mtd_session_start','mtd_login_rl'].forEach(function(k){ localStorage.removeItem(k); });
 Object.keys(localStorage).forEach(function(k){
 if (k.startsWith('mtd_profile_') || k.startsWith('mtd_weight_history_') || k.startsWith('mtd_blackbox')) {
 localStorage.removeItem(k);
 }
 });
 (window.sfcAlert ? window.sfcAlert('Base utilisateurs effacée. Rechargement...') : alert('Base utilisateurs effacée. Rechargement...'));
 location.href = location.pathname;
 }
})();

// ─── DEV ONLY: one-time wipe of test data on localhost ───
if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && !localStorage.getItem('mtd_dev_wiped_v1')) {
 ['mtd_users','mtd_session','mtd_session_start','mtd_login_rl'].forEach(function(k){ localStorage.removeItem(k); });
 // Also remove all profile/history keys
 Object.keys(localStorage).forEach(function(k){
 if (k.startsWith('mtd_profile_') || k.startsWith('mtd_weight_history_') || k.startsWith('mtd_blackbox')) {
 localStorage.removeItem(k);
 }
 });
 localStorage.setItem('mtd_dev_wiped_v1', '1');
}

// ─── INIT ───
function _doAutoLogin() {
 // Guard: user arriving from a password reset link — do not overwrite the authNewPassword view
 if (window.S && window.S.view === 'authNewPassword') { render(); return; }
if (window.AUTH && window.AUTH.isLoggedIn()) {
 S.view = 'today';
 if (window.GAMIFICATION) GAMIFICATION.updateStreak();
 // Restore full profile from localStorage (E-01)
 loadProfile();
 _migrateSteps();
 // Store first login date (needed for J+1 wellness guard)
 if (!S.firstLoginDate) {
   S.firstLoginDate = new Date().toISOString().slice(0, 10);
   window._profileDirty = true;
   if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
 }
 // POLISH 2026-04 : disclaimer médical au premier login (si pas encore accepté).
 // Non-bloquant côté navigation (render continue), modal overlay indépendant.
 // Rendu après un petit délai pour laisser le render principal s'exécuter d'abord.
 setTimeout(function() {
   try { if (window.showMedicalDisclaimerIfNeeded) window.showMedicalDisclaimerIfNeeded(); } catch(e) {}
 }, 400);
 // Auto-populate prenom from auth metadata if missing (new users, OAuth, etc.)
 if (!S.prenom) {
   var _autoUser = window.AUTH ? window.AUTH.getUser() : null;
   // FIX P0 stability 2026-04-17 : guard typeof avant .split()
   if (_autoUser && typeof _autoUser.name === 'string' && _autoUser.name.trim() && _autoUser.name !== _autoUser.email) {
     var _autoParts = _autoUser.name.trim().split(/\s+/);
     if (_autoParts[0]) S.prenom = _autoParts[0];
   }
 }
 // Note : la migration nStep=0 est gérée par _migrateSteps() (appelé ligne 1867)
 // pour éviter la double-migration (régression pour les users sport-only avec weekPlan)
 // Retour utilisateur : préserver le step programme (ne pas réinitialiser l'onboarding sport).
 // Steps à PRÉSERVER : 4(muscu) 6(CF) 8(running) 10(hyrox) 12(padel) 14(golf) 15(prog dédié) 16(charges) 17(triathlon cfg) 18(triathlon prog) 20(médical) 21(yoga) 23(cycling) 25(calisthenics)
 // Steps à préserver (programme généré) : 4(muscu) 6(CF) 8(running) 10(hyrox) 12(padel)
 // 14(golf) 15(prog dédié) 16(charges) 17-18(triathlon) 20(médical) 21(yoga) 23(cycling) 25(calisthenics)
 var _PROGRAM_STEPS_MAIN = [4, 6, 8, 10, 12, 14, 15, 16, 17, 18, 20, 21, 23, 25];
 // Guard : valeurs manifestement corrompues.
 // sStep=30 = "Séance libre" — step de navigation pure, non restauré au démarrage.
 // Sans ce reset, rouvrir l'app après une séance libre incomplète force S.view='sport'
 // via la branche sStep>0 && not-in-_PROGRAM_STEPS_MAIN ci-dessous (sStep=30 absent de la liste).
 if (S.sStep >= 30) { S.sStep = 0; }
 if (S.nStep > 12) { S.nStep = 0; }
 // Guard : step intermédiaire sans sportType → l'utilisateur n'a pas encore choisi son sport,
 // on remet à 0 pour qu'il reparte de la sélection sport (cas reload SW avant clic sport).
 if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) === -1 && !S.sportType) {
   S.sStep = 0;
 }
 var _hasSportSetup2 = !!S.sportType;
 var _hasAnyProgram2 = (Array.isArray(S.sportProgram) && S.sportProgram.length > 0) || !!S.muscuIAProgram;
 // Checkpoint sans sportType → onboarding en cours (début de flow)
 if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) !== -1 && !_hasSportSetup2) { S.view = 'sport'; }
 // Step intermédiaire avec sportType → reload SW pendant questionnaire (sStep=2, etc.)
 else if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) === -1 && _hasSportSetup2) { S.view = 'sport'; }
 // Checkpoint avec sportType mais programme pas encore généré → continuer l'onboarding
 // (ex: triathlon à sStep=17/18, muscu sStep=4 avant confirmation programme)
 else if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) !== -1 && _hasSportSetup2 && !_hasAnyProgram2) { S.view = 'sport'; }
 // Mode sport SANS aucun setup → lancer onboarding sport
 else if (S.appMode === 'sport' && !_hasSportSetup2 && !_hasAnyProgram2) { S.view = 'sport'; }
 // Mode both : nutrition finie mais sport pas encore lancé
 else if (S.appMode === 'both' && S.nStep === 12 && !_hasSportSetup2 && !_hasAnyProgram2) { S.view = 'sport'; }
 // Onboarding nutrition en cours
 else if (S.nStep > 0 && S.nStep < 12) { S.view = 'nutrition'; }
 // Tout le reste → Dashboard Today (le safe default)
 else if (S.appMode) { S.view = 'today'; }
 else {
   // appMode=null → soit nouvel utilisateur, soit profil legacy sans appMode.
   // Si des données significatives existent (nStep=12, weekPlan, sportType) → today.
   // Sinon (profil vide, nouvel utilisateur après confirmation email) → onboarding.
   var _hasAnyProfileData = S.nStep === 12 || S.weekPlan != null || !!S.sportType;
   S.view = _hasAnyProfileData ? 'today' : 'nutrition'; // nutrition nStep=0 = sélection de mode
 }
 // ─── AUTO-REGENERATION PLAN NUTRITION — DÉSACTIVÉE (FIX VALIDATION 2026-04) ───
 // AVANT : le plan se régénérait tout seul à chaque boot si >7j ou lundi matin
 //         → user voyait son plan changer mystérieusement.
 // MAINTENANT : le plan est figé jusqu'à revalidation EXPLICITE par l'utilisateur.
 //              Si la semaine ISO a changé vs validation, on n'auto-regen PAS :
 //              on laisse le plan visible + bannière "Valider la nouvelle semaine".
 //              L'user clique "Valider mon programme" pour regénérer proprement.
 (function() {
   try {
     if (!S.weekPlan) return;
     // Migration users legacy : si pas de flag, on considère le plan comme validé
     // pour la semaine courante (évite de dévalider tout le monde à la mise à jour).
     if (typeof S.weekPlanValidated === 'undefined' || S.weekPlanValidated === null) {
       S.weekPlanValidated = true;
       if (window.currentISOWeek) S.weekPlanValidatedISOWeek = window.currentISOWeek();
     }
     // 2026-04 MIGRATION SILENCIEUSE : le hash a été restreint (retrait weight/age/etc.)
     // Si l'user avait validé son plan avec l'ANCIEN hash (long avec biométrie),
     // on resync silencieusement vers le NOUVEAU hash sans dévalider — sinon la bannière
     // "Valider mon programme" apparaîtrait une dernière fois sans raison.
     if (S.weekPlanValidated === true && window.getPlanHash) {
       try {
         var _newHash = window.getPlanHash();
         if (_newHash && S._planHash !== _newHash) {
           // Détection ancien hash : présence de séparateurs avec valeurs biométriques
           // (l'ancien faisait ~25 segments, le nouveau ~16). On migre direct.
           S._planHash = _newHash;
         }
       } catch(e) {}
     }
     // FIX F10 CONTRE-AUDIT 2026-04 : même migration pour sportProgram.
     // Si l'user a un sportProgram existant sans flag → considérer validé (pas dévalider).
     if (S.sportProgram && Array.isArray(S.sportProgram) && S.sportProgram.length > 0 &&
         (typeof S.sportProgramValidated === 'undefined' || S.sportProgramValidated === null)) {
       S.sportProgramValidated = true;
       S.sportProgramValidatedAt = new Date().toISOString();
     }
     // COACH ADAPTATIF 2026-04 (phase A) : migration sessionFeedback.
     // Users legacy sans sessionFeedback → init à {} (évite undefined dans les helpers).
     if (typeof S.sessionFeedback === 'undefined' || S.sessionFeedback === null ||
         typeof S.sessionFeedback !== 'object' || Array.isArray(S.sessionFeedback)) {
       S.sessionFeedback = {};
     }
   } catch(e) {}
 })();
 // Restaurer la langue
 if (window.I18N && S.lang) {
 window.I18N.current = S.lang;
 if (document.documentElement.lang !== S.lang) document.documentElement.lang = S.lang;
 }
 // Restaurer les préférences d'unités (kg/lbs, cm/ft)
 if (window.UNITS) {
 window.UNITS.weight = S.weightUnit || 'kg';
 window.UNITS.height = S.heightUnit || 'cm';
 }
 // Load weight history (kept separate for history management)
 try {
 var user = AUTH.getUser();
 var userId = user ? user.id : 'anon';
 var savedWeightHistory = localStorage.getItem('mtd_weight_history_' + userId);
 if (savedWeightHistory) S.weightHistory = JSON.parse(savedWeightHistory);
 } catch(e) {}
 // Migrate existing performance data into perf-history (no-op if already done)
 if (window.PERF_HISTORY) {
 try { PERF_HISTORY.migrateExistingData(); } catch(e) {}
 }
 // Demarrer la sync Supabase si disponible
 if (window.SupaSync) {
 SupaSync.syncOnLogin().then(function(syncResult) {
   if (syncResult === 'loaded_from_cloud') {
     _migrateSteps();
     if (window.I18N && S.lang) window.I18N.current = S.lang;
     if (window.UNITS) { window.UNITS.weight = S.weightUnit || 'kg'; window.UNITS.height = S.heightUnit || 'cm'; }
     var _csSetup = !!S.sportType;
     var _csProg = (Array.isArray(S.sportProgram) && S.sportProgram.length > 0) || !!S.muscuIAProgram;
     if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) !== -1 && !_csSetup) { S.view = 'sport'; }
     else if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) === -1 && _csSetup) { S.view = 'sport'; }
     else if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) !== -1 && _csSetup && !_csProg) { S.view = 'sport'; }
     else if (S.appMode === 'sport' && !_csSetup && !_csProg) { S.view = 'sport'; }
     else if (S.appMode === 'both' && S.nStep === 12 && !_csSetup && !_csProg) { S.view = 'sport'; }
     else if (S.nStep > 0 && S.nStep < 12) { S.view = 'nutrition'; }
     else if (S.appMode) { S.view = 'today'; }
     else {
       var _hasCloudData = S.nStep === 12 || S.weekPlan != null || !!S.sportType;
       S.view = _hasCloudData ? 'today' : 'nutrition';
     }
   }
   SupaSync.startAutoSync();
   if (typeof SupaSync.fetchUserStatus === 'function') {
     SupaSync.fetchUserStatus().then(function() { render(); }).catch(function() { render(); });
   }
 }).catch(function() { SupaSync.startAutoSync(); render(); });
 }
} else {
 S.view = 'auth';
 // NOTE 2026-05 : on NE purge PAS mtd_profile_anon ici.
 // Raison : si l'utilisateur a confirmé son email depuis un autre navigateur, ses données
 // d'onboarding ont pu être sauvegardées dans mtd_profile_anon (session non établie dans ce
 // navigateur). Supprimer cet instant avant le login empêche _migrateAnonKeys() de récupérer
 // ces données → perte définitive. La clé est nettoyée au logout (performLogoutCleanup)
 // et lors de la migration (migrateAnonKeys), ce qui suffit.
}
render();
}

// Wait for Supabase session before first render
// FIX edge audit 2026-04-15 : guard window.AUTH (race condition si auth.js retardé).
if (typeof AUTH !== 'undefined' && AUTH && typeof AUTH.ready === 'function') {
 AUTH.ready().then(_doAutoLogin).catch(_doAutoLogin);
} else {
 _doAutoLogin();
}

// SECURITY: Integrity check — verify critical functions were not tampered by extensions
if (window._verifyCriticalFunctions) {
 try { window._verifyCriticalFunctions(); } catch(e) {}
}

// DATA INTEGRITY: validation au boot des bases d'exercices et recettes (une seule fois)
if (window.validateDataIntegrity) {
 try { window.validateDataIntegrity(); } catch(e) {}
}

// ─── AUTOSAVE & BEFOREUNLOAD ───
// Save on tab/browser close to avoid losing last unsaved state
window.addEventListener('beforeunload', function() {
 try { if (window.AUTH && window.AUTH.isLoggedIn()) saveProfile(); } catch(e) {}
 // Note: saveProfile() appelle déjà SupaSync.scheduleSave() — pas de double appel direct pour éviter race condition
});
// Periodic autosave every 30s as safety net (render() already saves on interaction)
setInterval(function() {
  try {
    if (window.AUTH && window.AUTH.isLoggedIn() && window._profileDirty) {
      window._profileDirty = false;
      saveProfile();
    }
  } catch(e) {}
}, 30000);

// Purge journal entries > 6 mois (prévient saturation localStorage) — une fois par session
setTimeout(function() {
 try { if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.purgeOldEntries) window.FOOD_JOURNAL.purgeOldEntries(); } catch(e) {}
}, 5000);

// Global Escape handler — single document-level listener closes any modal (no per-render listener binding)
document.addEventListener('keydown', function(e) {
 if (e.key !== 'Escape') return;
 var changed = false;
 try {
   if (window.S) {
     if (window.S.modalRecipe)        { window.S.modalRecipe = null;        changed = true; }
     if (window.S.modalSmoothie)      { window.S.modalSmoothie = null;      changed = true; }
     if (window.S.sportModalExercise) { window.S.sportModalExercise = null; changed = true; }
     if (window.S._goalModal)         { window.S._goalModal = null;         changed = true; }
     if (window.S.shopArMode)         { window.S.shopArMode = false;        changed = true; }
   }
   if (changed) window.render();
 } catch(err) {}
});

// ─── ANDROID BACK BUTTON (Capacitor) ───
// Mirrors the Escape handler: closes modals first, then navigates to 'today',
// then minimizes the app. Never calls exitApp() — avoids accidental data loss.
(function() {
  if (!window.Capacitor || typeof window.Capacitor.isNativePlatform !== 'function' || !window.Capacitor.isNativePlatform()) return;
  var _CapApp = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!_CapApp || typeof _CapApp.addListener !== 'function') return;
  _CapApp.addListener('backButton', function() {
    try {
      var _changed = false;
      // 1. Close any open modal
      if (window.S) {
        if (window.S.modalRecipe)        { window.S.modalRecipe = null;        _changed = true; }
        if (window.S.modalSmoothie)      { window.S.modalSmoothie = null;      _changed = true; }
        if (window.S.sportModalExercise) { window.S.sportModalExercise = null; _changed = true; }
        if (window.S._goalModal)         { window.S._goalModal = null;         _changed = true; }
        if (window.S.shopArMode)         { window.S.shopArMode = false;        _changed = true; }
      }
      if (_changed) { if (window.render) window.render(); return; }
      // 2. Auth sub-views (forgot, register, verify) → back to main auth
      var _authSubViews = ['authForgot', 'authRegister', 'authVerify', 'authNewPassword'];
      if (window.S && _authSubViews.indexOf(window.S.view) !== -1) {
        window.S.view = 'auth';
        if (window.render) window.render();
        return;
      }
      // 3. Any other sub-view → back to 'today'
      var _rootViews = ['auth', 'today'];
      if (window.S && window.S.view && _rootViews.indexOf(window.S.view) === -1) {
        window.S.view = 'today';
        if (window.S && window.S.sStep > 0) { window.S.sStep = 0; }
        if (window.render) window.render();
        return;
      }
      // 3. On root view → minimize (never exit — avoids losing unsaved data)
      if (typeof _CapApp.minimizeApp === 'function') { _CapApp.minimizeApp(); return; }
      // 4. Final fallback: browser history
      if (window.history && window.history.length > 1) window.history.back();
    } catch(e) {}
  });
})();

})();
