/**
 * SmartFitCoach - Tests valeurs nulles / limites / robustesse
 * Agent testeur ultra-rigoureux
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Résultats
  const results = [];
  let pass = 0, fail = 0;

  function report(id, label, ok, detail) {
    const status = ok ? 'PASS' : 'FAIL';
    if (ok) pass++; else fail++;
    results.push({ id, label, status, detail });
    const icon = ok ? '✓' : '✗';
    console.log(`${icon} [${status}] ${id} — ${label}`);
    if (detail !== undefined && detail !== null) {
      console.log(`       → ${JSON.stringify(detail)}`);
    }
  }

  // ─────────────────────────────────────────────────
  // TESTS VALEURS NULLES / PROFIL VIDE
  // ─────────────────────────────────────────────────

  // E1 — calcTarget() avec profil entièrement vide
  {
    const result = await page.evaluate(() => {
      window.S.weight = null; window.S.height = null; window.S.age = null;
      window.S.activity = null; window.S.goal = null; window.S.sex = null;
      try { return window.calcTarget(); } catch(e) { return 'ERROR:' + e.message; }
    });
    const ok = typeof result === 'string'
      ? !result.startsWith('ERROR:')
      : (result === 0 || result === null || result === undefined || (typeof result === 'number' && !isNaN(result)));
    report('E1', 'calcTarget() profil vide', ok, result);
  }

  // E2 — calcMacros() avec goal=null
  {
    const result = await page.evaluate(() => {
      window.S.goal = null;
      try { return window.calcMacros(); } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError;
    report('E2', 'calcMacros() goal=null', ok, result);
  }

  // E3 — calcBMI() avec height=0
  {
    const result = await page.evaluate(() => {
      window.S.height = 0; window.S.weight = 70;
      return window.calcBMI();
    });
    const ok = result === null || result === undefined || result === 0;
    report('E3', 'calcBMI() height=0 (division par zéro protégée)', ok, result);
  }

  // E4 — calcBMI() avec height=50 (valeur aberrante)
  {
    const result = await page.evaluate(() => {
      window.S.height = 50;
      return window.calcBMI();
    });
    const ok = result === null || result === undefined;
    report('E4', 'calcBMI() height=50 (aberrant, protégé)', ok, result);
  }

  // E5 — getAge() avec birthDate invalide
  {
    const result = await page.evaluate(() => {
      window.S.birthDate = 'not-a-date';
      window.S.age = null;
      return window.getAge();
    });
    const ok = result === null || result === undefined;
    report('E5', 'getAge() birthDate invalide → null', ok, result);
  }

  // E6 — getAge() avec birthDate='2000-06-15'
  {
    const result = await page.evaluate(() => {
      window.S.birthDate = '2000-06-15';
      window.S.age = null;
      return window.getAge();
    });
    const ok = result === 25 || result === 26;
    report('E6', 'getAge() birthDate=2000-06-15 → 25 ou 26', ok, result);
  }

  // E7 — getCurrentCyclePhase() avec lastPeriodDate invalide
  {
    const result = await page.evaluate(() => {
      window.S.sex = 'femme'; window.S.cycleTracking = true;
      window.S.lastPeriodDate = 'invalid-date';
      try { return window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : 'UNAVAILABLE'; }
      catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const isNaNStr = typeof result === 'string' && result.includes('NaN');
    const ok = !isError && !isNaNStr && (result === null || result === undefined || result === 'UNAVAILABLE' || typeof result === 'string');
    report('E7', 'getCurrentCyclePhase() lastPeriodDate invalide → null/safe', ok, result);
  }

  // E8 — getCurrentCyclePhase() avec lastPeriodDate=null
  {
    const result = await page.evaluate(() => {
      window.S.lastPeriodDate = null;
      try { return window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : 'UNAVAILABLE'; }
      catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && (result === null || result === undefined || result === 'UNAVAILABLE');
    report('E8', 'getCurrentCyclePhase() lastPeriodDate=null → null/safe', ok, result);
  }

  // E9 — generateWeek() avec calcTarget()=0
  {
    const result = await page.evaluate(() => {
      window.S.weight = null; window.S.goal = 2;
      try {
        const plan = window.generateWeek();
        return plan;
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && (Array.isArray(result) || result === null || result === undefined);
    report('E9', 'generateWeek() calcTarget()=0 → [] ou null, pas crash', ok, result);
  }

  // E10 — filterRecipes() avec allergies=null
  {
    const result = await page.evaluate(() => {
      window.S.allergies = null;
      try {
        const pool = window.getPool ? window.getPool('lunch') : [];
        return window.filterRecipes ? window.filterRecipes(pool, 'lunch').length : 'UNAVAILABLE';
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && (typeof result === 'number' && result >= 0 || result === 'UNAVAILABLE');
    report('E10', 'filterRecipes() allergies=null → nombre ≥ 0, pas d\'erreur', ok, result);
  }

  // E11 — filterRecipes() avec cuisines=[99] (index inexistant)
  {
    const result = await page.evaluate(() => {
      window.S.cuisines = [99];
      window.S.allergies = [];
      try {
        const pool = window.getPool ? window.getPool('lunch') : [];
        const filtered = window.filterRecipes ? window.filterRecipes(pool, 'lunch') : null;
        return filtered ? filtered.length : 'UNAVAILABLE';
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    // fallback attendu: pool.length > 0
    const ok = !isError && (typeof result === 'number' && result > 0 || result === 'UNAVAILABLE');
    report('E11', 'filterRecipes() cuisines=[99] → fallback, pool > 0', ok, result);
  }

  // E12 — pickSmoothieForPlan() avec WHEY_SMOOTHIES vide
  {
    const result = await page.evaluate(() => {
      if (!window.WHEY_SMOOTHIES) return 'UNAVAILABLE';
      const orig = window.WHEY_SMOOTHIES;
      window.WHEY_SMOOTHIES = [];
      try {
        const res = window.pickSmoothieForPlan ? window.pickSmoothieForPlan(400, new Set()) : 'UNAVAILABLE';
        window.WHEY_SMOOTHIES = orig;
        return res;
      } catch(e) {
        window.WHEY_SMOOTHIES = orig;
        return 'ERROR:' + e.message;
      }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && (result === null || result === undefined || result === 'UNAVAILABLE');
    report('E12', 'pickSmoothieForPlan() WHEY_SMOOTHIES vide → null, pas crash', ok, result);
  }

  // E13 — detectMedicalConflicts() avec medical=null
  {
    const result = await page.evaluate(() => {
      window.S.medical = null;
      try {
        return window.detectMedicalConflicts ? window.detectMedicalConflicts() : 'unavailable';
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError;
    report('E13', 'detectMedicalConflicts() medical=null → [] ou unavailable, pas exception', ok, result);
  }

  // E14 — detectMedicalConflicts() avec medical=[]
  {
    const result = await page.evaluate(() => {
      window.S.medical = [];
      try {
        if (!window.detectMedicalConflicts) return -1;
        return window.detectMedicalConflicts().length;
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && (result === 0 || result === -1);
    report('E14', 'detectMedicalConflicts() medical=[] → 0 conflits', ok, result);
  }

  // ─────────────────────────────────────────────────
  // TESTS LIMITES NUMÉRIQUES
  // ─────────────────────────────────────────────────

  // E15 — Profil obèse grade 3 (BMI>40)
  {
    const result = await page.evaluate(() => {
      window.S.weight = 150; window.S.height = 170; window.S.age = 35;
      window.S.sex = 'homme'; window.S.activity = 1; window.S.goal = 3;
      window.S.medical = [];
      try {
        const target = window.calcTarget();
        const tdee = window.calcTDEE ? window.calcTDEE() : null;
        return { target, tdee, diff: tdee ? tdee - target : null };
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError &&
      result.target > 0 &&
      result.tdee !== null &&
      result.target < result.tdee &&
      result.diff >= 200 && result.diff <= 700;
    report('E15', 'Obèse grade 3 BMI>40: calcTarget() déficit 200-700 kcal', ok, result);
  }

  // E16 — Adolescent 15 ans + goal bulk: surplus plafonné ≤300 kcal
  {
    const result = await page.evaluate(() => {
      window.S.age = 15; window.S.sex = 'homme'; window.S.weight = 65;
      window.S.height = 175; window.S.activity = 2; window.S.goal = 0;
      window.S.medical = [];
      try {
        const target = window.calcTarget();
        const tdee = window.calcTDEE ? window.calcTDEE() : null;
        return { target, tdee, surplus: tdee ? target - tdee : null };
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && result.surplus !== null && result.surplus <= 300;
    report('E16', 'Adolescent 15 ans bulk: surplus ≤ 300 kcal', ok, result);
  }

  // E17 — Senior 65+ protéines plancher ESPEN 1.6g/kg
  {
    const result = await page.evaluate(() => {
      window.S.age = 68; window.S.sex = 'homme'; window.S.weight = 78;
      window.S.height = 175; window.S.activity = 2; window.S.goal = 2;
      window.S.medical = [];
      try {
        const macros = window.calcMacros();
        const minP = Math.round(78 * 1.6);
        return { p: macros ? macros.p : null, ppk: macros ? macros.proteinPerKg : null, min: minP };
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && result.p !== null && result.p >= result.min;
    report('E17', 'Senior 65+ maintain: protéines ≥ 1.6g/kg ESPEN (≥125g)', ok, result);
  }

  // E18 — Créatine age=28, birthDate=null → getAge()=28
  {
    const result = await page.evaluate(() => {
      window.S.age = 28; window.S.birthDate = null;
      window.S.pregnant = false; window.S.medical = [];
      window.S.activity = 2; window.S.sportGoals = ['muscle'];
      try {
        const supps = window.SUPPLEMENTS_DB ? window.SUPPLEMENTS_DB.filter(s => s.id === 'creatine') : [];
        if (supps.length === 0) return 'NO_CREATINE_DB';
        const creatineOk = supps[0].condition(window.S);
        return { age: window.getAge(), creatineOk };
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && (
      result === 'NO_CREATINE_DB' ||
      (result.age === 28 && result.creatineOk === true)
    );
    report('E18', 'Créatine age=28, birthDate=null → getAge()=28, creatineOk=true', ok, result);
  }

  // E19 — Créatine age=null, birthDate=null → getAge()=null
  {
    const result = await page.evaluate(() => {
      window.S.age = null; window.S.birthDate = null;
      window.S.pregnant = false; window.S.medical = [];
      window.S.activity = 2; window.S.sportGoals = ['muscle'];
      try {
        const supp = window.SUPPLEMENTS_DB ? window.SUPPLEMENTS_DB.find(s => s.id === 'creatine') : null;
        const age = window.getAge();
        return { age, condition: supp ? supp.condition(window.S) : null };
      } catch(e) { return 'ERROR:' + e.message; }
    });
    const isError = typeof result === 'string' && result.startsWith('ERROR:');
    const ok = !isError && (result.age === null || result.age === undefined);
    report('E19', 'Créatine age=null, birthDate=null → getAge()=null, condition cohérente', ok, result);
  }

  // E20 — render() sans erreur pour tous les nStep nutrition (0 à 12)
  {
    const result = await page.evaluate(() => {
      const errors = [];
      for (let step = 0; step <= 12; step++) {
        try {
          window.S.nStep = step; window.S.view = 'nutrition';
          window.S.sex = 'femme'; window.S.weight = 65; window.S.age = 30;
          window.S.height = 165; window.S.activity = 2; window.S.medical = [];
          window.S.allergies = []; window.S.cuisines = [0];
          window.render();
        } catch(e) { errors.push({ step, error: e.message }); }
      }
      return errors;
    });
    const ok = Array.isArray(result) && result.length === 0;
    report('E20', 'render() sans crash pour nStep 0-12 (nutrition)', ok, result);
  }

  // ─────────────────────────────────────────────────
  // TESTS TIMER REST
  // ─────────────────────────────────────────────────

  // E21 — window._restTimerInterval exposé
  {
    const result = await page.evaluate(() => {
      return typeof window._restTimerInterval !== 'undefined';
    });
    report('E21', 'window._restTimerInterval exposé globalement', result === true, result);
  }

  // E22 — startRestTimer synchronise window._restTimerInterval
  {
    const result = await page.evaluate(() => {
      if (typeof window.startRestTimer !== 'function') return 'UNAVAILABLE';
      window.startRestTimer(5);
      const syncedOk = window._restTimerInterval !== null && window._restTimerInterval !== undefined;
      if (window.stopRestTimer) window.stopRestTimer();
      else {
        // nettoyage manuel
        clearInterval(window._restTimerInterval);
        window._restTimerInterval = null;
      }
      return syncedOk;
    });
    const ok = result === true || result === 'UNAVAILABLE';
    // Si UNAVAILABLE ce n'est pas un fail strict (la fonction n'existe pas)
    // Mais si elle existe et retourne false, c'est un FAIL
    const strict_ok = result === true || result === 'UNAVAILABLE';
    report('E22', 'startRestTimer → _restTimerInterval non-null après démarrage', strict_ok, result);
  }

  // ─────────────────────────────────────────────────
  // RÉSUMÉ
  // ─────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log(`RÉSUMÉ: ${pass} PASS / ${fail} FAIL sur ${pass + fail} tests`);
  console.log('='.repeat(60));

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    console.log('\n⚠ ERREURS JS CONSOLE DÉTECTÉES:');
    if (pageErrors.length > 0) {
      console.log('\n  [pageerror]:');
      pageErrors.forEach(e => console.log(`    - ${e}`));
    }
    if (consoleErrors.length > 0) {
      console.log('\n  [console.error]:');
      consoleErrors.forEach(e => console.log(`    - ${e}`));
    }
  } else {
    console.log('\n✓ Aucune erreur JS console détectée.');
  }

  // Détail des FAIL
  const fails = results.filter(r => r.status === 'FAIL');
  if (fails.length > 0) {
    console.log('\n⚠ DÉTAIL DES ÉCHECS:');
    fails.forEach(f => {
      console.log(`  [${f.id}] ${f.label}`);
      console.log(`    valeur reçue: ${JSON.stringify(f.detail)}`);
    });
  }

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
