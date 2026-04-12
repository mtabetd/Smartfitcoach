// test-crash-maths.js — SmartFitCoach: Edge Cases Mathématiques (NaN / Infinity / Division par zéro)
// 15 tests Playwright ciblant calcBMR, calcTDEE, calcTarget, calcMacros, calcBMI
// Mission: Vérifier que toutes les valeurs limites/invalides ne produisent pas NaN/Infinity dans le DOM
'use strict';

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';

// ─── PROFIL DE BASE VALIDE ───────────────────────────────────────────────────
// Toutes les valeurs par défaut sont valides pour éviter les faux positifs.
// Chaque test surcharge uniquement les champs qu'il veut tester.
const BASE_PROFILE = {
  prenom: 'QA', nom: 'MathTest', sex: 'homme', age: 30,
  weight: 75, height: 175, activity: 2, goal: 2,
  appMode: 'nutrition',
  sportType: 'musculation', sportDays: 3, mealsPerDay: 3,
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
  nStep: 11, sStep: 0,
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
  smartCalendarDismissed: true,
  pregnant: false, pregnancyWeek: null, prePregnancyWeight: null,
  targetWeight: null, birthDate: null
};

async function runTests() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  /**
   * runTest — Injecte profil + navigue vers vue nutrition (nStep=11) + vérifie NaN/Infinity
   * @param {string} name
   * @param {object} profileOverrides — champs à surcharger sur BASE_PROFILE
   * @param {object} stateForce — champs à forcer dans window.S après chargement
   * @param {Function|null} extraCheck — (page) => {passed, reason} — vérification supplémentaire
   * @param {string} uid
   */
  async function runTest(name, profileOverrides, stateForce, extraCheck, uid) {
    uid = uid || ('test-math-' + Math.random().toString(36).slice(2, 10));
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    try {
      const profile = Object.assign({}, BASE_PROFILE, profileOverrides);

      await page.addInitScript(function(args) {
        // 1. Gate bypass
        try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
        try { sessionStorage.setItem('mtd_seen_welcome', 'true'); } catch(e) {}

        // 2. Bloquer Supabase (évite erreurs réseau 401)
        try {
          Object.defineProperty(window, 'supabase', {
            get: function() { return null; },
            set: function() {},
            configurable: true
          });
        } catch(e) {}

        // 3. Bloquer le dev-wipe localhost (app-main.js l.1940-1948):
        // sur 127.0.0.1, si 'mtd_dev_wiped_v1' absent, l'app efface TOUS les mtd_profile_*
        // On le marque avant que le script de l'app ne s'exécute
        try { localStorage.setItem('mtd_dev_wiped_v1', '1'); } catch(e) {}

        // 4. Session auth (fingerprint null = pas de vérification)
        var session = {
          id: args.uid, name: 'QA MathTest', email: 'qa-math@test.com',
          nom: '', phone: '',
          token: 'test-math-token',
          fingerprint: null,
          tokenIssuedAt: Date.now()
        };
        try {
          localStorage.setItem('mtd_session', JSON.stringify(session));
          localStorage.setItem('mtd_session_start', String(Date.now()));
        } catch(e) {}

        // 5. Profil complet dans la clé uid
        try {
          localStorage.setItem('mtd_profile_' + args.uid, JSON.stringify(args.profile));
        } catch(e) {}
      }, { uid, profile });

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500);

      // 5. Forcer l'état S + re-render (après autoLogin)
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

      // 6. Lire le DOM textuel
      const html = await page.evaluate(function() {
        return document.body ? (document.body.innerText || '') : '';
      });

      // 7. Appeler les fonctions de calcul directement (vérification mathématique pure)
      const mathResult = await page.evaluate(function() {
        var r = { bmr: null, tdee: null, target: null, macros: null, bmi: null, errors: [] };
        try {
          if (typeof window.calcBMR === 'function') r.bmr = window.calcBMR();
          if (typeof window.calcTDEE === 'function') r.tdee = window.calcTDEE();
          if (typeof window.calcTarget === 'function') r.target = window.calcTarget();
          if (typeof window.calcMacros === 'function') r.macros = window.calcMacros();
          if (typeof window.calcBMI === 'function') r.bmi = window.calcBMI();
        } catch(e) {
          r.errors.push(e.message);
        }
        return r;
      });

      // 8. Détecter NaN/Infinity dans le DOM et dans les résultats de calcul
      const domHasNaN = html.includes('NaN');
      const domHasInfinity = html.includes('Infinity');

      // Vérifier les résultats mathématiques
      const mathVals = [
        mathResult.bmr, mathResult.tdee, mathResult.target,
        mathResult.macros ? mathResult.macros.g : null,
        mathResult.macros ? mathResult.macros.p : null,
        mathResult.macros ? mathResult.macros.l : null,
        mathResult.bmi
      ];
      const mathHasNaN = mathVals.some(function(v) { return v !== null && isNaN(v); });
      const mathHasInfinity = mathVals.some(function(v) { return v !== null && !isFinite(v) && !isNaN(v); });

      // 9. Filtrer les erreurs JS non critiques (réseau, auth, supabase)
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

      const isBlank = html.trim().length < 200;

      let passed = critErrors.length === 0 && !domHasNaN && !domHasInfinity && !mathHasNaN && !mathHasInfinity && !isBlank;
      let extraReason = null;

      // 10. Vérification supplémentaire optionnelle
      if (extraCheck && passed) {
        try {
          const extra = await extraCheck(page, mathResult, html);
          if (!extra.passed) { passed = false; extraReason = extra.reason; }
        } catch(e) {
          passed = false;
          extraReason = 'extraCheck exception: ' + e.message;
        }
      }

      results.push({
        name, passed, critErrors,
        domHasNaN, domHasInfinity, mathHasNaN, mathHasInfinity,
        isBlank, extraReason,
        mathResult,
        htmlLen: html.trim().length,
        html: html.replace(/\n+/g, ' / ').slice(0, 300)
      });
    } catch(e) {
      results.push({
        name, passed: false,
        critErrors: [e.message],
        domHasNaN: false, domHasInfinity: false,
        mathHasNaN: false, mathHasInfinity: false,
        isBlank: true, extraReason: null,
        mathResult: null, htmlLen: 0, html: ''
      });
    } finally {
      await ctx.close();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── 15 TESTS EDGE CASES MATHÉMATIQUES ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── T1 — weight=0 → calcBMR=0, calcTarget plancher → pas de NaN dans DOM ──
  // Guard: !s.weight || s.weight<30 → return 0
  // renderStep8 guard: !S.weight → goStep(1) → redirect sans NaN
  // Note: weight=0 est invalide (hors range 30-300) mais ne doit pas crasher
  await runTest(
    'T1: weight=0 → calcBMR=0, plancher calcTarget → pas de NaN DOM',
    { weight: 0 },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 0, height: 175, age: 30, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      // calcBMR doit retourner 0 (guard weight<30)
      if (mathResult.bmr !== 0) {
        return { passed: false, reason: 'calcBMR(weight=0) devrait retourner 0, got ' + mathResult.bmr };
      }
      return { passed: true };
    },
    'test-t1-weight-zero'
  );

  // ─── T2 — height=0 → calcBMR=0, BMI protégé → pas de NaN ──────────────────
  // calcBMR guard: !s.height || s.height<100 → return 0
  // calcBMI: !s.height → return null (évite division par zéro (height/100)²)
  // renderStep8 guard: !S.height → goStep(1) → pas de NaN rendu
  await runTest(
    'T2: height=0 → calcBMR=0, BMI=null (div-par-zéro protégé) → pas de NaN',
    { height: 0 },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 0, age: 30, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (mathResult.bmr !== 0) {
        return { passed: false, reason: 'calcBMR(height=0) devrait retourner 0, got ' + mathResult.bmr };
      }
      if (mathResult.bmi !== null) {
        return { passed: false, reason: 'calcBMI(height=0) devrait retourner null, got ' + mathResult.bmi };
      }
      return { passed: true };
    },
    'test-t2-height-zero'
  );

  // ─── T3 — age=0 → calcBMR retourne 0 (age<13) → pas de NaN ─────────────────
  // getAge() returns s.age=0, puis if(!_age||_age<13||_age>100) return 0
  // !0 = true → return 0
  await runTest(
    'T3: age=0 → calcBMR=0 (guard age<13) → pas de NaN',
    { age: 0, birthDate: null },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 0, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (mathResult.bmr !== 0) {
        return { passed: false, reason: 'calcBMR(age=0) devrait retourner 0, got ' + mathResult.bmr };
      }
      return { passed: true };
    },
    'test-t3-age-zero'
  );

  // ─── T4 — age=10 (minimum attendu 13) → calcBMR=0 → pas de crash ────────────
  // _age=10 < 13 → return 0
  // calcTarget avec calcBMR=0: tdeeVal=0 → base=0 → puis planchers kcalFloor appliqués
  await runTest(
    'T4: age=10 (< 13 minimum) → calcBMR=0 → pas de crash',
    { age: 10, birthDate: null },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 10, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (mathResult.bmr !== 0) {
        return { passed: false, reason: 'calcBMR(age=10) devrait retourner 0, got ' + mathResult.bmr };
      }
      return { passed: true };
    },
    'test-t4-age-10'
  );

  // ─── T5 — age=100 (maximum) → calcBMR valide → pas de NaN ──────────────────
  // _age=100 → passes guard (<=100) → correction seniors: bmrRaw*0.95
  // Formule: 10*75 + 6.25*175 - 5*100 + 5 = 750+1093.75-500+5 = 1348.75 *0.95 = 1281.31
  await runTest(
    'T5: age=100 (maximum) → calcBMR valide et fini → pas de NaN',
    { age: 100, birthDate: null },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 100, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (!mathResult.bmr || mathResult.bmr <= 0) {
        return { passed: false, reason: 'calcBMR(age=100) devrait retourner une valeur > 0, got ' + mathResult.bmr };
      }
      if (!isFinite(mathResult.bmr)) {
        return { passed: false, reason: 'calcBMR(age=100) non fini: ' + mathResult.bmr };
      }
      return { passed: true };
    },
    'test-t5-age-100'
  );

  // ─── T6 — weight=300 (maximum) → calcBMR valide, poids ajusté obèse → pas de crash ─
  // calcBMR: 300 <= 300 → passes guard
  // calcAdjustedWeight: BMI=97.9 > 30 → applique formule Adjusted Body Weight
  // Résultat attendu: poids ajusté ~162kg (pas NaN ni Infinity)
  await runTest(
    'T6: weight=300 (maximum) → calcBMR valide, poids ajusté obèse → pas de crash',
    { weight: 300 },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 300, height: 175, age: 30, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (!mathResult.bmr || mathResult.bmr <= 0) {
        return { passed: false, reason: 'calcBMR(weight=300) devrait retourner une valeur > 0, got ' + mathResult.bmr };
      }
      if (!isFinite(mathResult.bmr) || !isFinite(mathResult.target)) {
        return { passed: false, reason: 'calcBMR ou calcTarget non fini pour weight=300' };
      }
      // Vérifier poids ajusté
      const adjWeight = await page.evaluate(function() {
        return typeof window.calcAdjustedWeight === 'function' ? window.calcAdjustedWeight() : null;
      });
      if (adjWeight === null || isNaN(adjWeight) || !isFinite(adjWeight)) {
        return { passed: false, reason: 'calcAdjustedWeight(weight=300) retourne: ' + adjWeight };
      }
      return { passed: true };
    },
    'test-t6-weight-300'
  );

  // ─── T7 — height=100 (minimum valide) → calcBMR valide → pas de NaN ─────────
  // calcBMR guard: s.height<100 → return 0, mais 100 est exactement le minimum → passes
  await runTest(
    'T7: height=100 (minimum valide) → calcBMR retourne valeur positive → pas de NaN',
    { height: 100 },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 100, age: 30, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (!mathResult.bmr || mathResult.bmr <= 0) {
        return { passed: false, reason: 'calcBMR(height=100) devrait retourner une valeur > 0, got ' + mathResult.bmr };
      }
      return { passed: true };
    },
    'test-t7-height-100'
  );

  // ─── T8 — activity=0 (Sédentaire) → ACTIVITIES[0] défini → calcTDEE valide ──
  // ACTIVITIES[0] = {factor:1.2} → guard passes → calcTDEE = calcBMR * 1.2
  // Test: activité=0 est légitime (index valide dans ACTIVITIES)
  await runTest(
    'T8: activity=0 (Sédentaire) → ACTIVITIES[0] défini → calcTDEE valide',
    { activity: 0 },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 30, activity: 0, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (mathResult.tdee === null || mathResult.tdee <= 0) {
        return { passed: false, reason: 'calcTDEE(activity=0) devrait retourner > 0, got ' + mathResult.tdee };
      }
      if (!isFinite(mathResult.tdee)) {
        return { passed: false, reason: 'calcTDEE(activity=0) non fini: ' + mathResult.tdee };
      }
      return { passed: true };
    },
    'test-t8-activity-zero'
  );

  // ─── T9 — weight=NaN → calcBMR=0 (guard !s.weight) → pas de NaN dans DOM ────
  // NaN est falsy: !NaN = true → guard calcBMR retourne 0
  // renderStep8: !S.weight = !NaN = true → redirige goStep(1) → pas de NaN rendu
  await runTest(
    'T9: weight=NaN → calcBMR=0 (guard !NaN) → pas de NaN dans DOM',
    { weight: NaN },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: NaN, height: 175, age: 30, activity: 2, goal: 2, birthDate: null },
    async function(page, mathResult) {
      if (mathResult.bmr !== 0) {
        return { passed: false, reason: 'calcBMR(weight=NaN) devrait retourner 0, got ' + mathResult.bmr };
      }
      return { passed: true };
    },
    'test-t9-weight-nan'
  );

  // ─── T10 — goal=99 (hors range) → calcTarget → pas de crash ─────────────────
  // calcTarget: !GOALS[99] (undefined) → return 0
  // calcMacros: !c || !GOALS[s.goal] → return {g:0, p:0, l:0}
  // renderStep8: String(0)='0', svgRing avec tot=0 utilise guard tot>0?…:0
  await runTest(
    'T10: goal=99 (hors range GOALS) → calcTarget=0, pas de crash',
    { goal: 99 },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 30, activity: 2, goal: 99, birthDate: null },
    async function(page, mathResult) {
      if (mathResult.target !== 0) {
        return { passed: false, reason: 'calcTarget(goal=99) devrait retourner 0, got ' + mathResult.target };
      }
      return { passed: true };
    },
    'test-t10-goal-99'
  );

  // ─── T11 — targetWeight=0 → modulation targetWeight → pas de NaN ────────────
  // calcTarget: s.targetWeight && ... — 0 est falsy → condition skip → pas de modulation
  // Évite la division/soustraction sur une cible nulle
  await runTest(
    'T11: targetWeight=0 → modulation targetWeight skippée → pas de NaN',
    { targetWeight: 0, goal: 3 }, // goal=3 (cut) pour activer la branche modulation
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 30, activity: 2, goal: 3, targetWeight: 0, birthDate: null },
    async function(page, mathResult) {
      if (isNaN(mathResult.target) || !isFinite(mathResult.target)) {
        return { passed: false, reason: 'calcTarget(targetWeight=0) retourne NaN/Infinity: ' + mathResult.target };
      }
      if (mathResult.target <= 0) {
        return { passed: false, reason: 'calcTarget(targetWeight=0) devrait être > 0 (plancher kcal), got ' + mathResult.target };
      }
      return { passed: true };
    },
    'test-t11-targetweight-zero'
  );

  // ─── T12 — mealsPerDay=1 → split → pas de division par zéro ─────────────────
  // _getMealSplitBase: meals=1, 1<=2 → retourne {pctBreak:.40, pctLunch:.60, pctSnack:0, pctDinner:0}
  // generateWeek/renderStep12 utilise ces splits → pas de division par zéro
  await runTest(
    'T12: mealsPerDay=1 → meal split valide (pas de div/0) → pas de NaN',
    { mealsPerDay: 1 },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 30, activity: 2, goal: 2, mealsPerDay: 1, birthDate: null },
    async function(page, mathResult) {
      // Vérifier que getMealSplit retourne des valeurs finies
      const splitResult = await page.evaluate(function() {
        if (typeof window.getMealSplit !== 'function') return { ok: false, reason: 'getMealSplit non défini' };
        try {
          var sp = window.getMealSplit();
          if (!sp) return { ok: false, reason: 'getMealSplit retourne null' };
          var sum = (sp.pctBreak||0) + (sp.pctLunch||0) + (sp.pctSnack||0) + (sp.pctDinner||0);
          var allFinite = isFinite(sp.pctBreak) && isFinite(sp.pctLunch) && isFinite(sp.pctSnack) && isFinite(sp.pctDinner);
          return { ok: allFinite, sum: sum, sp: sp };
        } catch(e) {
          return { ok: false, reason: e.message };
        }
      });
      if (!splitResult.ok) {
        return { passed: false, reason: 'getMealSplit(mealsPerDay=1) invalide: ' + (splitResult.reason || JSON.stringify(splitResult)) };
      }
      return { passed: true };
    },
    'test-t12-meals-one'
  );

  // ─── T13 — sportDays=7 → calcTDEE → PAL=1.725 (plafond 5j threshold) → pas de NaN ─
  // Dans calcTDEE: sportDays=7 → sportFactor=1.725 (sportDays>=5)
  // Dans getDayType: LAYOUTS[Math.min(7,6)] = LAYOUTS[6] → 6 jours max
  await runTest(
    'T13: sportDays=7 → calcTDEE PAL=1.725 (≥5j threshold) → pas de NaN',
    { sportDays: 7, trainingDaysSelected: [] },
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 30, activity: 2, goal: 2, sportDays: 7, trainingDaysSelected: [], birthDate: null },
    async function(page, mathResult) {
      if (!mathResult.tdee || mathResult.tdee <= 0) {
        return { passed: false, reason: 'calcTDEE(sportDays=7) devrait retourner > 0, got ' + mathResult.tdee };
      }
      if (!isFinite(mathResult.tdee)) {
        return { passed: false, reason: 'calcTDEE(sportDays=7) non fini: ' + mathResult.tdee };
      }
      return { passed: true };
    },
    'test-t13-sportdays-7'
  );

  // ─── T14 — Profil femme 75kg enceinte T3 → calcTarget inclut +450 kcal → pas de NaN ─
  // Grossesse T3 (semaine 30): calorieExtra=450
  // calcTarget: base = Math.round(tdeeVal) + 450, Math.max(base, 1800)
  await runTest(
    'T14: femme 75kg enceinte T3 (sem.30) → calcTarget +450 kcal → pas de NaN',
    {
      sex: 'femme', weight: 75, height: 165, age: 30,
      pregnant: true, pregnancyWeek: 30, prePregnancyWeight: 68,
      goal: 2, activity: 2
    },
    {
      view: 'nutrition', nStep: 11,
      sex: 'femme', weight: 75, height: 165, age: 30,
      pregnant: true, pregnancyWeek: 30, prePregnancyWeight: 68,
      goal: 2, activity: 2, birthDate: null
    },
    async function(page, mathResult) {
      // calcTarget devrait inclure +450 kcal du T3
      if (!mathResult.target || mathResult.target < 1800) {
        return { passed: false, reason: 'calcTarget(pregnant T3) devrait être >= 1800, got ' + mathResult.target };
      }
      if (!isFinite(mathResult.target)) {
        return { passed: false, reason: 'calcTarget(pregnant T3) non fini: ' + mathResult.target };
      }
      // Vérifier trimestre
      const trimInfo = await page.evaluate(function() {
        if (typeof window.getPregnancyTrimester !== 'function') return null;
        return window.getPregnancyTrimester();
      });
      if (!trimInfo || trimInfo.trimesterNumber !== 3) {
        return { passed: false, reason: 'getPregnancyTrimester(sem.30) devrait retourner trimestre 3, got ' + JSON.stringify(trimInfo) };
      }
      return { passed: true };
    },
    'test-t14-pregnant-t3'
  );

  // ─── T15 — Tous les GOALS 0-5 → calcTarget valide pour chaque → pas de NaN ──
  // Itère goals 0 (bulk) à 5 (recomposition) et vérifie que calcTarget/calcMacros retournent
  // des valeurs finies et non-NaN pour chacun.
  // Note: ce test utilise page.evaluate directement pour tester les 6 goals en une seule page
  await runTest(
    'T15: Goals 0-5 itérés → calcTarget et calcMacros valides pour chacun → pas de NaN',
    { goal: 2 }, // profil valide de base
    { view: 'nutrition', nStep: 11, sex: 'homme', weight: 75, height: 175, age: 30, activity: 2, goal: 2, birthDate: null },
    async function(page) {
      const goalsResult = await page.evaluate(function() {
        if (!window.calcTarget || !window.calcMacros || !window.GOALS) {
          return { ok: false, reason: 'fonctions non disponibles' };
        }
        var issues = [];
        for (var g = 0; g < window.GOALS.length; g++) {
          window.S.goal = g;
          var target, macros;
          try {
            target = window.calcTarget();
            macros = window.calcMacros();
          } catch(e) {
            issues.push('goal=' + g + ': exception: ' + e.message);
            continue;
          }
          if (isNaN(target)) issues.push('goal=' + g + ': calcTarget=NaN');
          if (!isFinite(target)) issues.push('goal=' + g + ': calcTarget=Infinity');
          if (!macros) issues.push('goal=' + g + ': calcMacros=null');
          else {
            if (isNaN(macros.g)) issues.push('goal=' + g + ': macros.g=NaN');
            if (isNaN(macros.p)) issues.push('goal=' + g + ': macros.p=NaN');
            if (isNaN(macros.l)) issues.push('goal=' + g + ': macros.l=NaN');
            if (!isFinite(macros.g)) issues.push('goal=' + g + ': macros.g=Infinity');
            if (!isFinite(macros.p)) issues.push('goal=' + g + ': macros.p=Infinity');
            if (!isFinite(macros.l)) issues.push('goal=' + g + ': macros.l=Infinity');
          }
        }
        // Remettre goal=2 (maintien) après le test
        window.S.goal = 2;
        return { ok: issues.length === 0, issues: issues };
      });
      if (!goalsResult.ok) {
        return { passed: false, reason: 'Goals invalides: ' + goalsResult.issues.join('; ') };
      }
      return { passed: true };
    },
    'test-t15-all-goals'
  );

  await browser.close();
  return results;
}

// ─── AFFICHAGE DES RÉSULTATS ────────────────────────────────────────────────
runTests().then(function(results) {
  var passed = results.filter(function(r) { return r.passed; }).length;
  var failed = results.filter(function(r) { return !r.passed; }).length;

  console.log('\n============================================');
  console.log('   SMARTFITCOACH — TEST CRASH MATHS');
  console.log('   Edge Cases NaN / Infinity / Div-par-zéro');
  console.log('============================================\n');

  results.forEach(function(r) {
    var status = r.passed ? 'PASS' : 'FAIL';
    console.log(status + ' | ' + r.name);
    if (!r.passed) {
      if (r.critErrors && r.critErrors.length > 0) {
        r.critErrors.forEach(function(e) { console.log('   JS ERROR: ' + e); });
      }
      if (r.domHasNaN)       console.log('   NaN visible dans le DOM');
      if (r.domHasInfinity)  console.log('   Infinity visible dans le DOM');
      if (r.mathHasNaN)      console.log('   NaN dans résultats calc (BMR/TDEE/Target/Macros/BMI)');
      if (r.mathHasInfinity) console.log('   Infinity dans résultats calc');
      if (r.isBlank)         console.log('   Page blanche (contenu=' + r.htmlLen + ' chars)');
      if (r.extraReason)     console.log('   Assertion: ' + r.extraReason);
      if (r.mathResult) {
        var mr = r.mathResult;
        console.log('   calc: BMR=' + mr.bmr + ' TDEE=' + mr.tdee + ' Target=' + mr.target +
          ' Macros=' + (mr.macros ? 'g:'+mr.macros.g+' p:'+mr.macros.p+' l:'+mr.macros.l : 'null') +
          ' BMI=' + mr.bmi);
      }
      if (r.html) console.log('   DOM: ' + r.html.slice(0, 200));
    } else {
      // Afficher les résultats de calcul même pour les PASS (pour validation visuelle)
      if (r.mathResult) {
        var mr = r.mathResult;
        var info = 'BMR=' + mr.bmr + ' TDEE=' + mr.tdee + ' Target=' + mr.target;
        if (mr.macros) info += ' Macros(g=' + mr.macros.g + ' p=' + mr.macros.p + ' l=' + mr.macros.l + ')';
        if (mr.bmi !== null) info += ' BMI=' + mr.bmi;
        console.log('         ' + info);
      }
    }
  });

  console.log('\n--------------------------------------------');
  console.log('RESUME: ' + passed + '/15 PASS | ' + failed + ' FAIL');
  console.log('--------------------------------------------\n');

  // Export JSON détaillé
  var fs = require('fs');
  var jsonPath = '/home/user/Smartfitcoach/test-crash-maths-results.json';
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log('Resultats JSON -> ' + jsonPath + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}).catch(function(e) {
  console.error('FATAL:', e);
  process.exit(1);
});
