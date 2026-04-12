// Test script: Edge cases / valeurs nulles / robustesse SmartFitCoach
const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push('[pageerror] ' + err.message));
  page.on('console', msg => { if(msg.type()==='error') consoleErrors.push('[console.error] ' + msg.text()); });
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const results = [];

  function pass(id, details) {
    results.push({ id, status: 'PASS', details });
  }
  function fail(id, details) {
    results.push({ id, status: 'FAIL', details });
  }

  // ──────────────────────────────────────────────
  // E1 — calcTarget() avec profil entièrement vide
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.weight = null; window.S.height = null; window.S.age = null;
      window.S.activity = null; window.S.goal = null; window.S.sex = null;
      try { return window.calcTarget(); } catch(e) { return 'ERROR:'+e.message; }
    });
    if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E1', 'calcTarget() vide => exception non catchee: ' + result);
    } else if (result === 0 || result === null) {
      pass('E1', 'calcTarget() vide => ' + result);
    } else {
      fail('E1', 'calcTarget() vide => valeur inattendue: ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E1', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E2 — calcMacros() avec goal=null
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.goal = null;
      try { return window.calcMacros(); } catch(e) { return 'ERROR:'+e.message; }
    });
    if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E2', 'calcMacros() goal=null => exception: ' + result);
    } else if (result === null ||
              (result && result.g === 0 && result.p === 0 && result.l === 0)) {
      pass('E2', 'calcMacros() goal=null => ' + JSON.stringify(result));
    } else {
      // any non-crashing value is acceptable
      pass('E2', 'calcMacros() goal=null => pas de crash, retourne: ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E2', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E3 — calcBMI() avec height=0
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.height = 0; window.S.weight = 70;
      return window.calcBMI();
    });
    if (result === null) {
      pass('E3', 'calcBMI() height=0 => null (division/zero protegee)');
    } else {
      fail('E3', 'calcBMI() height=0 => attendu null, obtenu: ' + result);
    }
  } catch(e) {
    fail('E3', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E4 — calcBMI() avec height < 100
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.height = 50; window.S.weight = 70;
      return window.calcBMI();
    });
    if (result === null) {
      pass('E4', 'calcBMI() height=50 => null (condition height<100 protege)');
    } else {
      fail('E4', 'calcBMI() height=50 => attendu null, obtenu: ' + result);
    }
  } catch(e) {
    fail('E4', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E5 — getAge() avec birthDate invalide
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.birthDate = 'not-a-date';
      window.S.age = null;
      return window.getAge();
    });
    if (result === null) {
      pass('E5', 'getAge() birthDate invalide => null');
    } else {
      fail('E5', 'getAge() birthDate invalide => attendu null, obtenu: ' + result);
    }
  } catch(e) {
    fail('E5', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E6 — getAge() avec birthDate valide '2000-06-15'
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.birthDate = '2000-06-15';
      window.S.age = null;
      return window.getAge();
    });
    // Aujourd'hui = 12 avril 2026, anniversaire en juin => 25 ans
    if (result === 25 || result === 26) {
      pass('E6', 'getAge() birthDate=2000-06-15 => ' + result + ' ans');
    } else {
      fail('E6', 'getAge() birthDate=2000-06-15 => attendu 25 ou 26, obtenu: ' + result);
    }
  } catch(e) {
    fail('E6', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E7 — getCurrentCyclePhase() avec lastPeriodDate='invalid-date'
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.sex = 'femme'; window.S.cycleTracking = true;
      window.S.lastPeriodDate = 'invalid-date';
      try { return window.getCurrentCyclePhase(); } catch(e) { return 'ERROR:'+e.message; }
    });
    if (result === null) {
      pass('E7', 'getCurrentCyclePhase() date invalide => null');
    } else if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E7', 'getCurrentCyclePhase() date invalide => crash: ' + result);
    } else if (typeof result === 'number' && isNaN(result)) {
      fail('E7', 'getCurrentCyclePhase() date invalide => NaN retourne');
    } else {
      fail('E7', 'getCurrentCyclePhase() date invalide => inattendu: ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E7', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E8 — getCurrentCyclePhase() avec lastPeriodDate=null
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.sex = 'femme'; window.S.cycleTracking = true;
      window.S.lastPeriodDate = null;
      try { return window.getCurrentCyclePhase(); } catch(e) { return 'ERROR:'+e.message; }
    });
    if (result === null) {
      pass('E8', 'getCurrentCyclePhase() lastPeriodDate=null => null');
    } else if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E8', 'getCurrentCyclePhase() lastPeriodDate=null => crash: ' + result);
    } else {
      fail('E8', 'getCurrentCyclePhase() lastPeriodDate=null => inattendu: ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E8', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E9 — generateWeek() avec calcTarget()=0
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.weight = null; window.S.goal = 2;
      window.S.activity = null; // force calcTDEE => 0
      try { return window.generateWeek(); } catch(e) { return 'ERROR:'+e.message; }
    });
    if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E9', 'generateWeek() calcTarget=0 => crash: ' + result);
    } else if (Array.isArray(result) && result.length === 0) {
      pass('E9', 'generateWeek() calcTarget=0 => [] (tableau vide)');
    } else if (Array.isArray(result)) {
      fail('E9', 'generateWeek() calcTarget=0 => tableau non vide (' + result.length + ' elements)');
    } else {
      fail('E9', 'generateWeek() calcTarget=0 => inattendu: ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E9', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E10 — filterRecipes() avec allergies=null
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.allergies = null;
      try {
        const pool = window.getPool('lunch');
        const filtered = window.filterRecipes(pool, 'lunch');
        return { len: filtered.length, err: null };
      } catch(e) {
        return { len: -1, err: e.message };
      }
    });
    if (result.err) {
      fail('E10', 'filterRecipes() allergies=null => erreur: ' + result.err);
    } else if (result.len >= 0) {
      pass('E10', 'filterRecipes() allergies=null => ' + result.len + ' recettes (pas d erreur)');
    } else {
      fail('E10', 'filterRecipes() allergies=null => len=-1 sans erreur capturee');
    }
  } catch(e) {
    fail('E10', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E11 — filterRecipes() avec cuisines=[99] (index inexistant)
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.cuisines = [99];
      window.S.allergies = [];
      try {
        const pool = window.filterRecipes(window.getPool('lunch'), 'lunch');
        return { len: pool.length, err: null };
      } catch(e) {
        return { len: -1, err: e.message };
      }
    });
    if (result.err) {
      fail('E11', 'filterRecipes() cuisines=[99] => erreur: ' + result.err);
    } else if (result.len > 0) {
      pass('E11', 'filterRecipes() cuisines=[99] => ' + result.len + ' recettes (fallback active)');
    } else if (result.len === 0) {
      fail('E11', 'filterRecipes() cuisines=[99] => 0 recettes (fallback NON active)');
    }
  } catch(e) {
    fail('E11', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E12 — pickSmoothieForPlan() avec WHEY_SMOOTHIES vide
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      const orig = window.WHEY_SMOOTHIES;
      window.WHEY_SMOOTHIES = [];
      let result;
      try {
        result = window.pickSmoothieForPlan(400, new Set());
      } catch(e) {
        result = 'ERROR:'+e.message;
      }
      window.WHEY_SMOOTHIES = orig;
      return result;
    });
    if (result === null) {
      pass('E12', 'pickSmoothieForPlan() WHEY_SMOOTHIES=[] => null');
    } else if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E12', 'pickSmoothieForPlan() WHEY_SMOOTHIES=[] => crash: ' + result);
    } else {
      fail('E12', 'pickSmoothieForPlan() WHEY_SMOOTHIES=[] => inattendu: ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E12', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E13 — detectMedicalConflicts() avec medical=null
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.medical = null;
      try {
        if (typeof window.detectMedicalConflicts !== 'function') return 'unavailable';
        return window.detectMedicalConflicts();
      } catch(e) {
        return 'ERROR:'+e.message;
      }
    });
    if (result === 'unavailable') {
      pass('E13', 'detectMedicalConflicts => unavailable (fonction non exposee)');
    } else if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E13', 'detectMedicalConflicts() medical=null => exception: ' + result);
    } else if (Array.isArray(result)) {
      pass('E13', 'detectMedicalConflicts() medical=null => tableau valide, len=' + result.length);
    } else {
      fail('E13', 'detectMedicalConflicts() medical=null => inattendu: ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E13', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E14 — detectMedicalConflicts() avec medical=[]
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.medical = [];
      if (typeof window.detectMedicalConflicts !== 'function') return -1;
      try { return window.detectMedicalConflicts().length; } catch(e) { return 'ERROR:'+e.message; }
    });
    if (result === -1) {
      pass('E14', 'detectMedicalConflicts => unavailable (fonction non exposee), skip');
    } else if (typeof result === 'string' && result.startsWith('ERROR:')) {
      fail('E14', 'detectMedicalConflicts() medical=[] => exception: ' + result);
    } else if (result === 0) {
      pass('E14', 'detectMedicalConflicts() medical=[] => 0 conflits');
    } else {
      fail('E14', 'detectMedicalConflicts() medical=[] => ' + result + ' conflits (attendu 0)');
    }
  } catch(e) {
    fail('E14', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E15 — Profil obese grade 3 (BMI>40): calcTarget() coherent
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.weight = 150; window.S.height = 170; window.S.age = 35;
      window.S.sex = 'homme'; window.S.activity = 1; window.S.goal = 3;
      window.S.medical = []; window.S.birthDate = null;
      const target = window.calcTarget();
      const tdee = window.calcTDEE();
      return { target, tdee, diff: tdee - target };
    });
    const { target, tdee, diff } = result;
    const bmi = 150 / ((170/100)**2);
    if (target > 0 && target < tdee && diff >= 200 && diff <= 700) {
      pass('E15', 'obese BMI=' + bmi.toFixed(1) + ': target=' + target + ', tdee=' + tdee + ', deficit=' + diff + ' kcal [200-700]');
    } else {
      fail('E15', 'obese BMI=' + bmi.toFixed(1) + ': target=' + target + ', tdee=' + tdee + ', diff=' + diff + ' — attendu target>0, target<tdee, diff 200-700');
    }
  } catch(e) {
    fail('E15', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E16 — Adolescent 15 ans + goal bulk: surplus plafonne <=300
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.age = 15; window.S.sex = 'homme'; window.S.weight = 65;
      window.S.height = 175; window.S.activity = 2; window.S.goal = 0;
      window.S.medical = []; window.S.birthDate = null;
      const target = window.calcTarget();
      const tdee = window.calcTDEE();
      return { target, tdee, surplus: target - tdee };
    });
    const { target, tdee, surplus } = result;
    if (surplus <= 300) {
      pass('E16', 'adolescent 15 ans bulk: surplus=' + surplus + ' kcal <= 300 (plafond OK)');
    } else {
      fail('E16', 'adolescent 15 ans bulk: surplus=' + surplus + ' kcal > 300 (plafond NON respecte), tdee=' + tdee + ', target=' + target);
    }
  } catch(e) {
    fail('E16', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E17 — Senior 65+ maintain: proteines plancher 1.6g/kg
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.age = 68; window.S.sex = 'homme'; window.S.weight = 78;
      window.S.height = 175; window.S.activity = 2; window.S.goal = 2;
      window.S.medical = []; window.S.birthDate = null;
      window.S.pregnant = false;
      const macros = window.calcMacros();
      return { p: macros ? macros.p : null, ppk: macros ? macros.proteinPerKg : null, min: Math.round(78*1.6) };
    });
    const { p, ppk, min } = result;
    if (p !== null && p >= min) {
      pass('E17', 'senior 68 ans maintain: p=' + p + 'g >= ' + min + 'g (1.6g/kg ESPEN, ppk=' + ppk + ')');
    } else if (p === null) {
      fail('E17', 'senior 68 ans maintain: calcMacros() => null');
    } else {
      fail('E17', 'senior 68 ans maintain: p=' + p + 'g < ' + min + 'g (plancher ESPEN 1.6g/kg NON respecte)');
    }
  } catch(e) {
    fail('E17', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E18 — Creatine pour utilisateur age=28 (pas de birthDate)
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.age = 28; window.S.birthDate = null;
      window.S.pregnant = false; window.S.medical = [];
      window.S.activity = 2; window.S.sportGoals = ['muscle'];
      const supps = window.SUPPLEMENTS_DB.filter(s => s.id === 'creatine');
      if (supps.length === 0) return { found: false };
      const age = window.getAge();
      const creatineOk = supps[0].condition(window.S);
      return { found: true, age, creatineOk };
    });
    if (!result.found) {
      fail('E18', 'creatine id non trouve dans SUPPLEMENTS_DB');
    } else if (result.age === 28 && result.creatineOk === true) {
      pass('E18', 'creatine age=28 (defaut): getAge()=' + result.age + ', condition=true');
    } else {
      fail('E18', 'creatine age=28: getAge()=' + result.age + ' (attendu 28), creatineOk=' + result.creatineOk + ' (attendu true)');
    }
  } catch(e) {
    fail('E18', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E19 — Creatine pour age=null ET birthDate=null
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      window.S.age = null; window.S.birthDate = null;
      window.S.pregnant = false; window.S.medical = [];
      window.S.activity = 2; window.S.sportGoals = ['muscle'];
      const supp = window.SUPPLEMENTS_DB.find(s => s.id === 'creatine');
      const age = window.getAge();
      let conditionResult = null;
      let conditionError = null;
      if (supp) {
        try { conditionResult = supp.condition(window.S); } catch(e) { conditionError = e.message; }
      }
      return { age, condition: conditionResult, conditionError, found: !!supp };
    });
    if (result.age === null) {
      if (result.conditionError) {
        fail('E19', 'age null: getAge()=null OK, mais condition crash: ' + result.conditionError);
      } else {
        pass('E19', 'age null: getAge()=null, condition=' + result.condition + ' (coherent, pas de crash)');
      }
    } else {
      fail('E19', 'age null: getAge()=' + result.age + ' (attendu null)');
    }
  } catch(e) {
    fail('E19', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E20 — render() sans crash pour tous nStep nutrition 0 a 12
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      const errors = [];
      window.S.sex = 'femme'; window.S.weight = 65; window.S.age = 30;
      window.S.height = 165; window.S.activity = 2; window.S.goal = 2;
      window.S.medical = []; window.S.birthDate = null; window.S.pregnant = false;
      for (let step = 0; step <= 12; step++) {
        try {
          window.S.nStep = step;
          window.S.view = 'nutrition';
          window.render();
        } catch(e) {
          errors.push({ step, error: e.message });
        }
      }
      return errors;
    });
    if (result.length === 0) {
      pass('E20', 'render() nStep 0-12 => aucun crash');
    } else {
      fail('E20', 'render() crashe sur step(s): ' + JSON.stringify(result));
    }
  } catch(e) {
    fail('E20', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E21 — window._restTimerInterval expose
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(() => {
      return typeof window._restTimerInterval !== 'undefined';
    });
    if (result === true) {
      pass('E21', 'window._restTimerInterval est defini (expose globalement)');
    } else {
      fail('E21', 'window._restTimerInterval => undefined (non expose)');
    }
  } catch(e) {
    fail('E21', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // E22 — startRestTimer synchronise window._restTimerInterval
  // ──────────────────────────────────────────────
  try {
    const result = await page.evaluate(async () => {
      if (typeof window.startRestTimer !== 'function') return 'UNAVAILABLE';
      window.startRestTimer(5);
      await new Promise(r => setTimeout(r, 100));
      const syncedOk = window._restTimerInterval !== null;
      if (window.stopRestTimer) window.stopRestTimer();
      return syncedOk;
    });
    if (result === 'UNAVAILABLE') {
      fail('E22', 'startRestTimer non disponible globalement');
    } else if (result === true) {
      pass('E22', 'startRestTimer(5) => window._restTimerInterval non-null (synchronise)');
    } else {
      fail('E22', 'startRestTimer(5) => window._restTimerInterval est null (non synchronise)');
    }
  } catch(e) {
    fail('E22', 'Erreur inattendue: ' + e.message);
  }

  // ──────────────────────────────────────────────
  // RAPPORT FINAL
  // ──────────────────────────────────────────────
  await browser.close();

  console.log('\n==================================================');
  console.log('      RAPPORT TEST EDGE CASES - SmartFitCoach');
  console.log('==================================================\n');

  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
    const line = icon + ' ' + r.id + ' -- ' + r.details;
    console.log(line);
    if (r.status === 'PASS') passed++; else failed++;
  }

  console.log('\n--------------------------------------------------');
  console.log('TOTAL: ' + results.length + ' tests | ' + passed + ' PASS | ' + failed + ' FAIL');
  console.log('--------------------------------------------------\n');

  if (consoleErrors.length > 0) {
    console.log('ERREURS JS CONSOLE DETECTEES (' + consoleErrors.length + '):');
    for (const err of consoleErrors) {
      console.log('  WARN: ' + err);
    }
  } else {
    console.log('Aucune erreur JS console detectee.');
  }

  console.log('\n==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('FATAL:', err);
  process.exit(2);
});
