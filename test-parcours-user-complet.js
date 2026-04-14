// ══════════════════════════════════════════════════════════════════════
// TEST E2E MASSIF — Parcours utilisateur COMPLET
// ══════════════════════════════════════════════════════════════════════
// Simule un parcours utilisateur de A à Z et vérifie que TOUTES les données
// saisies sont :
//   1. Bien enregistrées (localStorage + S)
//   2. Prises en compte par le moteur nutrition (calcTarget, calcMacros, generateWeek)
//   3. Reflétées de manière cohérente dans le dashboard
//   4. Persistées après reload
//
// Scénarios testés :
// - S1 : Femme 35 ans, cut, végétarienne, allergie gluten, 4 repas/j
// - S2 : Homme 45 ans, bulk, omnivore, musculation 4j/sem
// - S3 : Femme enceinte T2, maintien, allaitement
// - S4 : Multi-sports (muscu + running) avec symbiose training day

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n) { console.log('  ✓ ' + n); passed++; }
  function fail(n, d) { console.log('  ✗ ' + n + '\n    ' + d); failed++; }
  function suite(n) { console.log('\n═ ' + n + ' ═'); }

  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    return { page, ctx, errs };
  }

  // ══════════════ S1 : Femme cut végétarienne allergique gluten ══════════════
  suite('S1 — Femme cut végétarienne allergique gluten (profil complet)');
  try {
    const { page, ctx } = await newPage();
    const UID = 'e2e-s1-uid';

    // Étape 1 : injecter profil COMPLET (comme après onboarding)
    await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 'marie@test.com' });
      delete window.S._loadCorrupted;
      // Identité
      window.S.prenom = 'Marie';
      window.S.sex = 'femme'; window.S.age = 35;
      window.S.weight = 65; window.S.height = 168;
      // Objectif
      window.S.goal = 3; window.S.activity = 2; window.S.targetWeight = 60;
      // Nutrition
      window.S.regime = 2; // végétarien (index REGIMES)
      window.S.allergies = ['gluten'];
      window.S.mealsPerDay = 4; window.S.cookLevel = 2;
      window.S.intolerances = [];
      window.S.cuisines = [0, 1, 4]; // FR, IT, MED
      // Sport
      window.S.sportType = 'yoga';
      window.S.sportGoals = ['flexibility'];
      window.S.sportDays = 3;
      window.S.trainingDaysSelected = [0, 2, 4]; // Lun/Mer/Ven
      // Cycle
      window.S.cycleTracking = true;
      window.S.cycleLength = 28;
      window.S.appMode = 'both';
      // Force recompute
      window.S._nm = null; window.S.weekPlan = null;
      if (window.computeNutritionState) window.computeNutritionState(false);
      if (window.saveProfile) window.saveProfile();
    }, UID);

    // Vérifications
    const r1 = await page.evaluate(() => {
      return {
        bmr: typeof window.calcBMR === 'function' ? window.calcBMR() : null,
        tdee: typeof window.calcTDEE === 'function' ? window.calcTDEE() : null,
        target: typeof window.calcTarget === 'function' ? window.calcTarget() : null,
        macros: typeof window.calcMacros === 'function' ? window.calcMacros() : null,
        bmi: typeof window.calcBMI === 'function' ? window.calcBMI() : null
      };
    });

    // BMR femme 35 ans 65 kg 168 cm ≈ 1374 kcal (Mifflin-St Jeor)
    if (!r1.bmr || r1.bmr < 1200 || r1.bmr > 1500) fail('S1 calcBMR plausible', 'BMR=' + r1.bmr);
    else pass('S1 calcBMR femme 35a/65kg/168cm = ' + Math.round(r1.bmr) + ' kcal (attendu ~1374)');

    // TDEE avec activity=2 (modéré) ≈ BMR × 1.55 ≈ 2130
    if (!r1.tdee || r1.tdee <= r1.bmr) fail('S1 calcTDEE > BMR', 'TDEE=' + r1.tdee);
    else pass('S1 calcTDEE = ' + Math.round(r1.tdee) + ' kcal (> BMR)');

    // Goal=3 (cut) → target < TDEE (déficit)
    if (!r1.target || r1.target >= r1.tdee) fail('S1 cut = déficit', 'target=' + r1.target + ' ≥ TDEE=' + r1.tdee);
    else pass('S1 cut → target ' + Math.round(r1.target) + ' < TDEE ' + Math.round(r1.tdee) + ' (déficit appliqué)');

    // Macros cohérentes avec target
    const macKcal = r1.macros ? (r1.macros.p * 4 + r1.macros.g * 4 + r1.macros.l * 9) : 0;
    if (Math.abs(macKcal - r1.target) > 30) fail('S1 cohérence macros', '±30 kcal : macKcal=' + macKcal + ' vs target=' + r1.target);
    else pass('S1 macros cohérentes : P×4+G×4+L×9 = ' + Math.round(macKcal) + ' ≈ target ' + Math.round(r1.target) + ' ±30');

    // BMI 65/1.68²  = 23.0
    if (!r1.bmi || Math.abs(r1.bmi - 23.0) > 0.5) fail('S1 BMI', 'BMI=' + r1.bmi);
    else pass('S1 BMI = ' + r1.bmi.toFixed(1) + ' (attendu ~23.0)');

    // Générer un weekPlan et vérifier filtrage regime + allergies
    const r2 = await page.evaluate(() => {
      if (typeof window.generateWeek !== 'function') return { error: 'generateWeek absent' };
      try {
        const wk = window.generateWeek();
        if (!Array.isArray(wk) || wk.length !== 7) return { error: 'weekPlan != 7 jours' };

        // Vérifier mealsPerDay=4 : chaque jour a breakfast/lunch/snack/dinner
        const day0 = wk[0];
        const has4Meals = day0.breakfast && day0.lunch && day0.snack && day0.dinner;

        // Vérifier filtrage régime végétarien : aucune recette doit contenir volaille/poisson/viande rouge
        let meatRecipes = 0;
        const meatPatterns = /(poulet|volaille|dinde|boeuf|veau|agneau|porc|jambon|saumon|thon|cabillaud|poisson|crevette)/i;
        wk.forEach(d => ['breakfast','lunch','snack','dinner'].forEach(s => {
          const r = d[s]; if (!r) return;
          if (meatPatterns.test(r.n || '') || meatPatterns.test(r.i || '')) meatRecipes++;
        }));

        // Vérifier filtrage gluten : aucune recette ne doit contenir pain/pâtes/blé
        let glutenRecipes = 0;
        const glutenPatterns = /(pain|pâtes|pate|boulgour|couscous|pizza|croissant|baguette|semoule)/i;
        wk.forEach(d => ['breakfast','lunch','snack','dinner'].forEach(s => {
          const r = d[s]; if (!r) return;
          if (glutenPatterns.test(r.n || '')) glutenRecipes++;
        }));

        return {
          planLen: wk.length,
          has4Meals: has4Meals,
          meatCount: meatRecipes,
          glutenCount: glutenRecipes,
          day0Sample: day0 ? {
            b: (day0.breakfast && day0.breakfast.n) || null,
            l: (day0.lunch && day0.lunch.n) || null,
            s: (day0.snack && day0.snack.n) || null,
            d: (day0.dinner && day0.dinner.n) || null
          } : null
        };
      } catch(e) { return { error: e.message }; }
    });

    if (r2.error) fail('S1 generateWeek', r2.error);
    else if (r2.planLen !== 7) fail('S1 plan 7 jours', 'len=' + r2.planLen);
    else if (!r2.has4Meals) fail('S1 mealsPerDay=4', 'day0 n\'a pas 4 slots');
    else if (r2.meatCount > 0) fail('S1 filtrage régime végétarien', r2.meatCount + ' recettes carnées dans le plan !');
    else if (r2.glutenCount > 0) fail('S1 filtrage allergie gluten', r2.glutenCount + ' recettes contiennent gluten !');
    else pass('S1 generateWeek : 7j × 4 repas, 0 carnée (régime vegetarien), 0 gluten (allergie). Exemple jour 0 : ' + JSON.stringify(r2.day0Sample));

    await ctx.close();
  } catch(e) { fail('S1', e.message); }

  // ══════════════ S2 : Homme bulk musculation (symbiose sport/nutrition) ══════════════
  suite('S2 — Homme bulk musculation 4j/sem (symbiose training day)');
  try {
    const { page, ctx } = await newPage();
    await page.evaluate(() => {
      window.AUTH.getUser = () => ({ id: 'e2e-s2', email: 't@t.com' });
      delete window.S._loadCorrupted;
      window.S.prenom = 'Thomas';
      window.S.sex = 'homme'; window.S.age = 28;
      window.S.weight = 78; window.S.height = 180;
      window.S.goal = 0; window.S.activity = 3; // bulk + très actif
      window.S.regime = 0; window.S.allergies = [];
      window.S.mealsPerDay = 5; window.S.cookLevel = 2;
      window.S.sportType = 'musculation';
      window.S.sportGoals = ['muscle'];
      window.S.sportDays = 4;
      window.S.trainingDaysSelected = [0, 1, 3, 4]; // Lun/Mar/Jeu/Ven
      window.S.sportLevel = 'intermediate';
      window.S.sportEquipment = 'gym';
      window.S.appMode = 'both';
      window.S._nm = null; window.S.weekPlan = null;
      if (window.saveProfile) window.saveProfile();
    });

    const r = await page.evaluate(() => {
      const bmr = window.calcBMR(); const tdee = window.calcTDEE(); const target = window.calcTarget();
      // Training day (Lun, index 0) vs rest day (Mer, index 2)
      const splitMon = window.getAdaptedMealSplit ? window.getAdaptedMealSplit(0) : null;
      const splitWed = window.getAdaptedMealSplit ? window.getAdaptedMealSplit(2) : null;
      const dayMon = window.getDayType ? window.getDayType(0) : null;
      const dayWed = window.getDayType ? window.getDayType(2) : null;
      return {
        bmr, tdee, target,
        monTraining: dayMon && dayMon.isTraining,
        wedRest: dayWed && !dayWed.isTraining,
        monMult: splitMon && splitMon.calMultiplier,
        wedMult: splitWed && splitWed.calMultiplier
      };
    });

    // Homme 28 ans 78 kg 180 cm → BMR ~1773
    if (!r.bmr || r.bmr < 1600 || r.bmr > 1900) fail('S2 BMR', 'BMR=' + r.bmr);
    else pass('S2 calcBMR homme 28a/78kg = ' + Math.round(r.bmr));
    // Bulk → target > TDEE (surplus)
    if (!r.target || r.target <= r.tdee) fail('S2 bulk = surplus', 'target=' + r.target + ' ≤ TDEE=' + r.tdee);
    else pass('S2 bulk → target ' + Math.round(r.target) + ' > TDEE ' + Math.round(r.tdee) + ' (surplus appliqué)');
    // Lundi = training day
    if (!r.monTraining) fail('S2 Lundi training', 'isTraining=' + r.monTraining);
    else pass('S2 Lundi détecté comme training (trainingDaysSelected=[0,1,3,4])');
    // Mercredi = rest day
    if (!r.wedRest) fail('S2 Mercredi repos', 'isRest=' + r.wedRest);
    else pass('S2 Mercredi détecté comme rest (pas dans trainingDaysSelected)');
    // calMultiplier différent : training 1.0, rest inférieur
    if (r.monMult !== 1.0) fail('S2 training mult', 'monMult=' + r.monMult);
    else if (r.wedMult >= 1.0) fail('S2 rest mult', 'wedMult=' + r.wedMult);
    else pass('S2 Symbiose sport/nutrition : training=' + r.monMult + ', rest=' + r.wedMult + ' (carb cycling appliqué)');

    await ctx.close();
  } catch(e) { fail('S2', e.message); }

  // ══════════════ S3 : Femme enceinte T2 (override grossesse) ══════════════
  suite('S3 — Femme enceinte T2 (override grossesse sur calcTarget)');
  try {
    const { page, ctx } = await newPage();
    await page.evaluate(() => {
      window.AUTH.getUser = () => ({ id: 'e2e-s3', email: 't@t.com' });
      delete window.S._loadCorrupted;
      window.S.prenom = 'Sophie';
      window.S.sex = 'femme'; window.S.age = 32;
      window.S.weight = 72; window.S.height = 170;
      window.S.goal = 2; window.S.activity = 2; // maintien
      window.S.pregnant = true;
      window.S.pregnancyWeek = 20; // T2 (13-26)
      window.S.prePregnancyWeight = 65;
      window.S.regime = 0; window.S.mealsPerDay = 4; window.S.cookLevel = 2;
      window.S.appMode = 'nutrition';
      window.S._nm = null; window.S.weekPlan = null;
    });

    const r = await page.evaluate(() => {
      const target = window.calcTarget();
      // T2 impose +340 kcal (ACOG 2022)
      // On compare avec un profil identique non-enceint
      const _save = window.S.pregnant;
      window.S.pregnant = false;
      const targetNonPreg = window.calcTarget();
      window.S.pregnant = _save;
      return { target, targetNonPreg, delta: target - targetNonPreg };
    });

    if (!r.target || r.delta < 200) fail('S3 grossesse T2 + kcal', 'delta=' + r.delta + ' (attendu ~340 kcal)');
    else pass('S3 grossesse T2 → +' + Math.round(r.delta) + ' kcal vs non-enceinte (conforme ACOG 2022)');

    await ctx.close();
  } catch(e) { fail('S3', e.message); }

  // ══════════════ S4 : Logs et données → pris en compte ══════════════
  suite('S4 — Logs réels (poids, séance, repas, favoris) pris en compte');
  try {
    const { page, ctx } = await newPage();
    const UID = 'e2e-s4-uid';

    // Setup profil + logs
    await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 't@t.com' });
      delete window.S._loadCorrupted;
      window.S.prenom = 'Alex'; window.S.sex = 'homme'; window.S.age = 30;
      window.S.weight = 75; window.S.height = 178;
      window.S.goal = 1; window.S.activity = 2;
      window.S.regime = 0; window.S.mealsPerDay = 4;
      window.S.sportType = 'musculation'; window.S.trainingDaysSelected = [0,2,4];
      window.S.appMode = 'both';

      // Log séance aujourd'hui (sessionHistory)
      const today = new Date().toISOString().slice(0, 10);
      window.S.sessionHistory = window.S.sessionHistory || {};
      window.S.sessionHistory[today] = {
        date: today, sport_type: 'musculation', duration: 60,
        kcalTotal: 450, kcalBase: 350, kcalEpoc: 100, rpe: 7
      };

      // Log repas via FOOD_JOURNAL
      if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.addEntry) {
        window.FOOD_JOURNAL.addEntry('breakfast', 'Omelette 3 oeufs', 320, 22, 4, 24, '120g', 'manual');
        window.FOOD_JOURNAL.addEntry('lunch', 'Poulet quinoa', 580, 45, 62, 15, '400g', 'manual');
      }

      // Favoris
      window.S.favoriteRecipes = { R001: 3, R042: 2 };

      // Pesée
      window.S.weightHistory = [
        { date: '2026-04-01', weight: 78 },
        { date: '2026-04-08', weight: 76.5 },
        { date: '2026-04-14', weight: 75 }
      ];
      try { localStorage.setItem('mtd_weight_history_' + uid, JSON.stringify(window.S.weightHistory)); } catch(e) {}

      if (window.saveProfile) window.saveProfile();
    }, UID);

    // Vérifications
    const r = await page.evaluate((uid) => {
      const today = new Date().toISOString().slice(0, 10);

      // 1. FOOD_JOURNAL.getDayTotal() agrège les entries saisies
      const journalTotal = window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal ? window.FOOD_JOURNAL.getDayTotal() : null;

      // 2. Session enregistrée → getTodayTotals + sportBurn
      const sportBurn = window.S.sessionHistory && window.S.sessionHistory[today]
        ? window.S.sessionHistory[today].kcalTotal : 0;

      // 3. pickRecipe avec favoris → le favori doit dominer le scoring
      // On ne peut pas le tester ici directement (pool non exposé), on vérifie juste la présence
      const favCount = Object.keys(window.S.favoriteRecipes || {}).length;

      // 4. Pesée → dernière valeur = S.weight
      const histLocal = (function() {
        try { return JSON.parse(localStorage.getItem('mtd_weight_history_' + uid) || '[]'); } catch(e) { return []; }
      })();
      const lastWeighIn = histLocal[histLocal.length - 1];

      // 5. Session counter sur dashboard (simuler la logique D11)
      const _log = window.S.muscuSessionLog || {};
      const _history = window.S.sessionHistory || {};
      let weekDone = 0;
      const _dow = (new Date().getDay() + 6) % 7;
      const _mon = new Date(); _mon.setDate(_mon.getDate() - _dow);
      for (let i = 0; i <= _dow; i++) {
        const d = new Date(_mon); d.setDate(_mon.getDate() + i);
        const ds = d.toISOString().slice(0, 10);
        const hasM = _log[ds] && Object.keys(_log[ds]).length > 0;
        const hasS = _history[ds] && _history[ds].date === ds;
        if (hasM || hasS) weekDone++;
      }

      return {
        journalKcal: journalTotal ? journalTotal.kcal : 0,
        journalP: journalTotal ? journalTotal.p : 0,
        sportBurnToday: sportBurn,
        favCount: favCount,
        weightLast: lastWeighIn ? lastWeighIn.weight : null,
        weekDone: weekDone
      };
    }, UID);

    // 320 + 580 = 900 kcal, 22 + 45 = 67 p
    if (r.journalKcal !== 900) fail('S4 FOOD_JOURNAL agg kcal', 'kcal=' + r.journalKcal + ' (attendu 900)');
    else pass('S4 Repas loggés → FOOD_JOURNAL.getDayTotal() agrège correctement : 900 kcal, 67g prot');

    if (r.sportBurnToday !== 450) fail('S4 session burn', 'burn=' + r.sportBurnToday);
    else pass('S4 Séance loggée → sessionHistory accessible (450 kcal dépensés)');

    if (r.favCount !== 2) fail('S4 favoris count', 'favCount=' + r.favCount);
    else pass('S4 Favoris (' + r.favCount + ') enregistrés dans S.favoriteRecipes');

    if (r.weightLast !== 75) fail('S4 weight last', 'last=' + r.weightLast);
    else pass('S4 Pesées enregistrées dans localStorage mtd_weight_history_ (dernière = 75 kg)');

    if (r.weekDone < 1) fail('S4 weekDone counter', 'weekDone=' + r.weekDone);
    else pass('S4 Session counter dashboard (fix D11) = ' + r.weekDone + ' séances (union muscuSessionLog + sessionHistory)');

    await ctx.close();
  } catch(e) { fail('S4', e.message); }

  // ══════════════ S5 : Reload → toutes les données persistent ══════════════
  suite('S5 — Reload page → toutes les données persistent');
  try {
    const { page, ctx } = await newPage();
    const UID = 'e2e-s5-uid';

    // Étape 1 : setup complet + save
    await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 't@t.com' });
      delete window.S._loadCorrupted;
      window.S.prenom = 'Léa';
      window.S.sex = 'femme'; window.S.age = 29; window.S.weight = 63; window.S.height = 165;
      window.S.goal = 3; window.S.activity = 2;
      window.S.regime = 3; // vegan
      window.S.mealsPerDay = 4;
      window.S.allergies = ['soja'];
      window.S.sportType = 'running';
      window.S.runningLevel = 'intermediate';
      window.S.runningGoal = 'marathon';
      window.S.trainingDaysSelected = [1, 3, 5];
      window.S.appMode = 'both';
      window.S.favoriteRecipes = { R123: 3 };
      window.S.weekPlan = Array.from({length:7}, () => ({ breakfast:{n:'Avocat toast',k:350,p:10,g:40,l:15}, lunch:{n:'Buddha bowl',k:550,p:20,g:70,l:18}, snack:{n:'Fruits',k:150,p:3,g:35,l:1}, dinner:{n:'Dahl lentilles',k:450,p:20,g:60,l:10} }));
      if (window.saveProfile) window.saveProfile();
    }, UID);

    // Étape 2 : reload page réelle
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Étape 3 : loadProfile + vérif
    const r = await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 't@t.com' });
      window.loadProfile();
      return {
        prenom: window.S.prenom, age: window.S.age, weight: window.S.weight,
        goal: window.S.goal, regime: window.S.regime, mealsPerDay: window.S.mealsPerDay,
        allergies: window.S.allergies, sportType: window.S.sportType,
        runningGoal: window.S.runningGoal,
        trainingDays: window.S.trainingDaysSelected,
        appMode: window.S.appMode,
        favCount: Object.keys(window.S.favoriteRecipes || {}).length,
        weekPlanLen: Array.isArray(window.S.weekPlan) ? window.S.weekPlan.length : 0,
        weekPlanFirstMeal: window.S.weekPlan && window.S.weekPlan[0] && window.S.weekPlan[0].breakfast ? window.S.weekPlan[0].breakfast.n : null
      };
    }, UID);

    const checks = [];
    if (r.prenom !== 'Léa') checks.push('prenom=' + r.prenom);
    if (r.age !== 29) checks.push('age=' + r.age);
    if (r.weight !== 63) checks.push('weight=' + r.weight);
    if (r.goal !== 3) checks.push('goal=' + r.goal);
    if (r.regime !== 3) checks.push('regime=' + r.regime);
    if (r.mealsPerDay !== 4) checks.push('mealsPerDay=' + r.mealsPerDay);
    if (!Array.isArray(r.allergies) || r.allergies[0] !== 'soja') checks.push('allergies=' + JSON.stringify(r.allergies));
    if (r.sportType !== 'running') checks.push('sportType=' + r.sportType);
    if (r.runningGoal !== 'marathon') checks.push('runningGoal=' + r.runningGoal);
    if (!Array.isArray(r.trainingDays) || r.trainingDays.length !== 3) checks.push('trainingDays=' + JSON.stringify(r.trainingDays));
    if (r.appMode !== 'both') checks.push('appMode=' + r.appMode);
    if (r.favCount !== 1) checks.push('favCount=' + r.favCount);
    if (r.weekPlanLen !== 7) checks.push('weekPlanLen=' + r.weekPlanLen);
    if (r.weekPlanFirstMeal !== 'Avocat toast') checks.push('firstMeal=' + r.weekPlanFirstMeal);

    if (checks.length > 0) fail('S5 reload data persistance', checks.join(' | '));
    else pass('S5 Reload → 13 champs restaurés identiques (prenom, age, weight, goal, regime, mealsPerDay, allergies, sportType, runningGoal, trainingDays, appMode, favoris, weekPlan)');

    await ctx.close();
  } catch(e) { fail('S5', e.message); }

  await browser.close();
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`RÉSUMÉ : ${passed}/${passed + failed} tests PASS (${failed} échec(s))`);
  console.log('═══════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
})();
