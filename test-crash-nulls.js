// test-crash-nulls.js — SmartFitCoach Null/Undefined Crash Battery
// 15 tests Playwright ciblant les crashes dus aux champs null/undefined
// Principe : injecter le profil + forcer l'état S post-autoLogin → vérifier absence de crash/NaN
'use strict';

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';

// ─── BASE PROFILE (valeurs valides par défaut) ─────────────────────────────
// appMode: 'nutrition' — évite le redirect automatique vers sport view qui masque les tests nutrition
const BASE_PROFILE = {
  prenom: 'Test', nom: 'User', sex: 'homme', age: 30,
  weight: 75, height: 175, activity: 2, goal: 2,
  appMode: 'nutrition',               // nutrition-only pour tests step 11/12
  sportType: 'crossfit', sportDays: 3, mealsPerDay: 3,
  sleep: 2, train: [], medical: [],
  allergies: [], intolerances: [], cuisines: [],
  supplements: [], wheyFlavors: [], alcoholTypes: [],
  trainingDaysSelected: [0, 2, 4],
  sportGoals: [], strongZones: [], weakZones: [],
  bodyZones: {}, sportFocus: {}, bonusExercises: {},
  sessionHistory: {}, muscuSessionLog: {},
  muscuProgressionHistory: {}, musculationWeights: {},
  muscuStrengthProfile: {}, crossfit1RM: {}, hyroxBenchmarks: {},
  shopChecked: {}, crossfitBenchmarks: {}, muscuMedical: {},
  weightHistory: [], shopStores: [], shopPrefs: [],
  calisthenicsEquipment: [], calisthenicsGoal: [],
  excluded: '', lang: 'fr',
  nStep: 12, sStep: 0,
  weekPlan: null, selectedDay: 0,
  _planHash: null, _nm: null,
  parqDone: false, parqResult: null,
  swapCount: 0, bodyScanDone: false,
  _bodyFatEstimate: null, mealsLogged: {},
  waist: null, streakFreezeAvailable: true,
  streakFreezeUsedMonth: null,
  firstLoginDate: '2025-01-01',
  welcomeShown: true, sportSplashDone: true,
  _sportProfileDone: true,
  weeklyCalendar: null, smartCalendarEnabled: false,
  smartCalendarDismissed: true
};

async function runTests() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  /**
   * runTest — exécute un test avec profil modifié + forçage d'état post-autoLogin
   * @param {string} name
   * @param {object} profileOverrides — champs null/undefined à injecter dans le profil de base
   * @param {object} stateForce — champs à forcer dans window.S après chargement + render à déclencher
   * @param {string} uid — optionnel, uid unique pour ce test (évite collisions)
   */
  async function runTest(name, profileOverrides, stateForce, uid) {
    uid = uid || ('test-null-' + Math.random().toString(36).slice(2, 10));
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    try {
      // Construire le profil avec les overrides null ciblés
      const profile = Object.assign({}, BASE_PROFILE, profileOverrides);

      await page.addInitScript(function(args) {
        // 1. Gate bypass
        try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
        try { sessionStorage.setItem('mtd_seen_welcome', 'true'); } catch(e) {}

        // 2. Bloquer Supabase (évite les erreurs réseau 401)
        try {
          Object.defineProperty(window, 'supabase', {
            get: function() { return null; },
            set: function() {},
            configurable: true
          });
        } catch(e) {}

        // 3. Session legacy (fingerprint: null = pas de vérification fingerprint)
        var session = {
          id: args.uid, name: 'QA Test', email: 'qa-null@test.com',
          nom: '', phone: '',
          token: 'test-null-token-abc',
          fingerprint: null,
          tokenIssuedAt: Date.now()
        };
        try {
          localStorage.setItem('mtd_session', JSON.stringify(session));
          localStorage.setItem('mtd_session_start', String(Date.now()));
        } catch(e) {}

        // 4. Profil dans la clé uid correspondante
        try {
          localStorage.setItem('mtd_profile_' + args.uid, JSON.stringify(args.profile));
        } catch(e) {}
      }, { uid, profile });

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500);

      // 5. Forcer l'état S + re-render (après que _doAutoLogin a chargé le profil)
      //    Double forçage pour les champs critiques null (auto-populate peut les écraser)
      if (stateForce && Object.keys(stateForce).length > 0) {
        await page.evaluate(function(fields) {
          if (!window.S) return;
          Object.keys(fields).forEach(function(k) {
            window.S[k] = fields[k];
          });
          if (window.render) {
            try { window.render._lock = false; window.render(); } catch(e) {}
          }
        }, stateForce);
        await page.waitForTimeout(1200);
      }

      const html = await page.evaluate(function() {
        return document.body ? (document.body.innerText || '') : '';
      });

      // Filtrer les erreurs non critiques (réseau, Supabase, auth, load)
      const critErrors = errors.filter(function(e) {
        if (!e) return false;
        if (e.includes('supabase') || e.includes('Supabase')) return false;
        if (e.includes('401') || e.includes('403')) return false;
        if (e.includes('favicon')) return false;
        if (e.includes('net::ERR_') || e.includes('Failed to fetch')) return false;
        if (e.includes('NetworkError') || e.includes('TypeError: Load failed')) return false;
        if (e.includes('getSupabaseClient') || e.includes('SupaSync')) return false;
        return true;
      });

      const hasNaN = html.includes('NaN');
      const hasUndefined = /\bundefined\b/.test(html) && !html.includes('undefined est');
      const isBlank = html.trim().length < 500;

      const passed = critErrors.length === 0 && !hasNaN && !isBlank;

      results.push({
        name,
        passed,
        critErrors,
        hasNaN,
        hasUndefined,
        isBlank,
        htmlLen: html.trim().length,
        html: html.replace(/\n+/g, ' / ').slice(0, 300)
      });
    } catch(e) {
      results.push({
        name,
        passed: false,
        critErrors: [e.message],
        hasNaN: false,
        hasUndefined: false,
        isBlank: true,
        htmlLen: 0,
        html: ''
      });
    } finally {
      await ctx.close();
    }
  }

  // ═══════════════════════════════════════════════════
  // ─── 15 TESTS CIBLÉS NULL/UNDEFINED ──────────��────
  // ═══════════════════════════════════════════════════

  // ─── T01 — Profil vide total → render 'today' → pas de crash ───────────────
  // Simule un utilisateur qui se connecte pour la première fois sans aucun profil.
  // Attendu : welcome/module-choice screen s'affiche sans crash
  await runTest(
    'T01: profil vide {} → render today → pas de crash',
    {
      sex: null, age: null, weight: null, height: null,
      activity: null, goal: null, appMode: null,
      sportType: null, sportDays: null, mealsPerDay: null,
      allergies: null, intolerances: null, trainingDaysSelected: null,
      train: null, medical: null, cuisines: null,
      prenom: null, sleep: null, nStep: 0, sStep: 0,
      weekPlan: null, _nm: null
    },
    { view: 'today' },
    'test-t01-empty'
  );

  // ─── T02 — weight=null → step 11 (résultats) → pas de NaN ─────────────────
  // renderStep8 guard: if (!S.weight) { goStep(1); return } → doit rediriger sans crash
  await runTest(
    'T02: weight=null → step 11 résultats nutrition → pas de NaN/crash',
    { weight: null },
    { view: 'nutrition', nStep: 11, weight: null },
    'test-t02-weight-null'
  );

  // ─── T03 — weight=null → today dashboard → pas de NaN ──────────────────────
  // renderCardMacros: getCalorieTarget() → calcTarget() → calcBMR() guard: if(!s.weight) return 0
  // Attendu : carte macros affiche "Aucun objectif défini" ou target=0, pas de NaN
  await runTest(
    'T03: weight=null → today dashboard → pas de NaN',
    { weight: null },
    { view: 'today', weight: null },
    'test-t03-weight-null-today'
  );

  // ─── T04 — goal=null → calcTarget() → pas de crash ──────────────────────────
  // calcTarget: if(goal===null) return 0 — puis renderStep8 guard: if(goal===null) goStep(4)
  await runTest(
    'T04: goal=null → step 11 (calcTarget) → pas de crash',
    { goal: null },
    { view: 'nutrition', nStep: 11, goal: null },
    'test-t04-goal-null'
  );

  // ─── T05 — goal=null + nStep=12 → planning semaine → pas de crash ──────────
  // renderStep9: generateWeek() → calcTarget()=0 → return [] → guard affiche message
  await runTest(
    'T05: goal=null + nStep=12 → planning semaine → pas de crash',
    { goal: null, weekPlan: null },
    { view: 'nutrition', nStep: 12, goal: null, weekPlan: null },
    'test-t05-goal-null-plan'
  );

  // ─── T06 — allergies=null (non-tableau) → generateWeek → pas de crash ──────
  // filterRecipes: (s.allergies||[]).length — opérateur || protège contre null
  // Mais DANS generateWeek, si allergies=null passe jusqu'à filterRecipes sans rehydratation
  await runTest(
    'T06: allergies=null → generateWeek (nStep=12) → pas de crash',
    { allergies: null, weekPlan: null },
    { view: 'nutrition', nStep: 12, weekPlan: null, allergies: null },
    'test-t06-allergies-null'
  );

  // ─── T07 — trainingDaysSelected=null → getDayType() → pas de crash ──────────
  // getDayType: else if (Array.isArray(s.trainingDaysSelected)) — guard Array.isArray protège
  // Si null → fallback sur sportDays distribution standard
  await runTest(
    'T07: trainingDaysSelected=null → getDayType → pas de crash',
    { trainingDaysSelected: null },
    { view: 'nutrition', nStep: 12, trainingDaysSelected: null, weekPlan: null },
    'test-t07-trainingdays-null'
  );

  // ─── T08 — weekPlan=null + nStep=12 → render planning → pas de page blanche ─
  // renderStep9: guard if (!S.weekPlan || !S.weekPlan.length) → message d'erreur élégant
  await runTest(
    'T08: weekPlan=null + nStep=12 → render planning → pas de page blanche',
    { weekPlan: null },
    { view: 'nutrition', nStep: 12, weekPlan: null },
    'test-t08-weekplan-null'
  );

  // ─── T09 — weeklyCalendar partiel → smart calendar → pas de crash ────────────
  // SMART_CALENDAR.render() doit gérer les jours manquants dans weeklyCalendar
  await runTest(
    'T09: weeklyCalendar={} partiel → smart calendar → pas de crash',
    {
      weeklyCalendar: { '0': 'crossfit', '1': 'repos' },
      smartCalendarEnabled: true,
      smartCalendarDismissed: false,
      appMode: 'both'
    },
    { view: 'calendar', smartCalendarEnabled: true },
    'test-t09-calendar-partial'
  );

  // ─── T10 — mealsPerDay=0 → generateWeek → pas de crash ──────────────────────
  // generateWeek: var meals=s.mealsPerDay||3 — fallback à 3, mais 0 force meals=0
  // si ||3 ne protège pas 0 (falsy): meals=3 (safe). Sinon: meals=0 → dîner/snack jamais générés
  await runTest(
    'T10: mealsPerDay=0 → generateWeek (nStep=12) → pas de crash',
    { mealsPerDay: 0, weekPlan: null },
    { view: 'nutrition', nStep: 12, mealsPerDay: 0, weekPlan: null },
    'test-t10-mealspd-zero'
  );

  // ─── T11 — S._nm=null → step 12 planning → pas de crash sur _nm.proteinGrams ─
  // renderStep9: var _nm = S._nm || {} → protège contre null avant .proteinGrams
  // Mais le test vérifie que generateWeek() ne crashe pas non plus avec _nm=null
  await runTest(
    'T11: S._nm=null → step 12 planning → pas de crash sur _nm.proteinGrams',
    { _nm: null },
    { view: 'nutrition', nStep: 12, _nm: null },
    'test-t11-nm-null'
  );

  // ─── T12 — sportType=null → render sport view → pas de crash ─────────────────
  // SPORT.render: if(S.sStep > 0 && !S.sportType) { S.sStep=0 } — guard présent
  // Avec appMode='sport' et pas de sexe/poids/profil → renderSportQuickProfile
  await runTest(
    'T12: sportType=null → render sport view → pas de crash',
    {
      sportType: null, sStep: 0, appMode: 'sport',
      _sportProfileDone: false,
      sex: 'homme', age: 30, weight: 75    // données minimales pour éviter boucle
    },
    { view: 'sport', sportType: null, sStep: 0 },
    'test-t12-sporttype-null'
  );

  // ─── T13 — prenom=null → today dashboard → "Bonjour" sans crash ──────────────
  // renderCardBonjour: var firstName = S.prenom || '' → protège contre null
  // Note: _doAutoLogin auto-populate prenom depuis auth.name si S.prenom est falsy
  // Le test vérifie: même avec prenom null dans profil, le dashboard s'affiche sans crash
  await runTest(
    'T13: prenom=null → today dashboard → "Bonjour" sans crash',
    { prenom: null },
    { view: 'today', prenom: null },
    'test-t13-prenom-null'
  );

  // ─── T14 — activity=null → calcTDEE → pas de NaN/crash ──────────────────────
  // calcTDEE: if(activity===null || !ACTIVITIES[activity]) return 0
  // calcBMR: appelé par calcTDEE, returns 0 → calcTarget returns 0 → not NaN
  await runTest(
    'T14: activity=null → calcTDEE/step 11 → pas de NaN/crash',
    { activity: null },
    { view: 'nutrition', nStep: 11, activity: null },
    'test-t14-activity-null'
  );

  // ─── T15 — age=null → calcBMR → pas de NaN/Infinity ──────────────────────────
  // calcBMR: var _age=getAge(); if(!_age||_age<13||_age>100)return 0 → protège contre null age
  // getAge(): calcule depuis birthDate ou s.age — avec age=null et birthDate=null → retourne 0
  await runTest(
    'T15: age=null → calcBMR/step 11 → pas de NaN/Infinity',
    { age: null, birthDate: null },
    { view: 'nutrition', nStep: 11, age: null, birthDate: null },
    'test-t15-age-null'
  );

  await browser.close();
  return results;
}

// ─── AFFICHAGE DES RÉSULTATS ────────────────────────────────────────────────
runTests().then(function(results) {
  var passed = results.filter(function(r) { return r.passed; }).length;
  var failed = results.filter(function(r) { return !r.passed; }).length;

  console.log('\n========================================');
  console.log('   SMARTFITCOACH — TEST CRASH NULLS');
  console.log('========================================\n');

  results.forEach(function(r) {
    var status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(status + ' | ' + r.name);
    if (!r.passed) {
      if (r.critErrors.length > 0) {
        r.critErrors.forEach(function(e) { console.log('   JS ERROR: ' + e); });
      }
      if (r.hasNaN)       console.log('   ⚠ NaN visible dans le DOM');
      if (r.hasUndefined) console.log('   ⚠ "undefined" visible dans le DOM');
      if (r.isBlank)      console.log('   ⚠ Page blanche (contenu=' + r.htmlLen + ' chars)');
      if (r.html)         console.log('   DOM: ' + r.html.slice(0, 200));
    }
  });

  console.log('\n----------------------------------------');
  console.log('RÉSUMÉ: ' + passed + '/15 PASS | ' + failed + ' FAIL');
  console.log('----------------------------------------\n');

  // Export JSON détaillé pour analyse post-mortem
  var fs = require('fs');
  fs.writeFileSync(
    '/home/user/Smartfitcoach/test-crash-nulls-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('Résultats JSON → test-crash-nulls-results.json\n');

}).catch(function(e) {
  console.error('FATAL:', e);
  process.exit(1);
});
