// Test Chromium exhaustif — parcours homme + femme + calculs + PDF + navigation
const { chromium } = require('playwright');
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  const results = { pass: 0, fail: 0, errors: [] };

  function ok(msg) { results.pass++; console.log('  ✓ ' + msg); }
  function fail(msg) { results.fail++; results.errors.push(msg); console.log('  ✗ ' + msg); }
  function check(cond, msg) { cond ? ok(msg) : fail(msg); }

  // ─── HELPER: create fresh page with gate bypass ───
  async function freshPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('pageerror', err => consoleErrors.push(err.message));
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
    // Gate bypass
    const gateInput = await page.$('#gate input[type="password"]');
    if (gateInput) { await gateInput.fill('mtd2025'); const btn = await page.$('#gate button'); if (btn) await btn.click(); await page.waitForTimeout(800); }
    // Skip splash
    const splashBtn = await page.$('#splash button');
    if (splashBtn && await splashBtn.isVisible()) { await splashBtn.click(); await page.waitForTimeout(500); }
    return { page, ctx, consoleErrors };
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 1: MODULES & LIBRARIES ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const mods = await page.evaluate(() => ({
      S: !!window.S, AUTH: !!window.AUTH, GOALS: !!window.GOALS,
      ACTIVITIES: !!window.ACTIVITIES, NUTRITION: !!window.NUTRITION,
      SPORT: !!window.SPORT, TODAY: !!window.TODAY,
      render: typeof window.render === 'function',
      calcBMR: typeof window.calcBMR === 'function',
      calcTDEE: typeof window.calcTDEE === 'function',
      calcTarget: typeof window.calcTarget === 'function',
      calcMacros: typeof window.calcMacros === 'function',
      calcBMI: typeof window.calcBMI === 'function',
      calcHydration: typeof window.calcHydration === 'function',
      generateWeek: typeof window.generateWeek === 'function',
      validatePregnancyState: typeof window.validatePregnancyState === 'function',
      getPregnancyTrimester: typeof window.getPregnancyTrimester === 'function',
      getCurrentCyclePhase: typeof window.getCurrentCyclePhase === 'function',
      EXERCISE_GIFS: !!window.EXERCISE_GIFS,
      getExerciseVideoUrl: typeof window.getExerciseVideoUrl === 'function',
      exportSportPDF: typeof window.exportSportPDF === 'function',
      exportDayPDF: typeof window.exportDayPDF === 'function',
      jspdf: !!(window.jspdf && window.jspdf.jsPDF),
      Chart: typeof window.Chart === 'function',
    }));
    for (const [k, v] of Object.entries(mods)) check(v, k);
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 2: CALCULS NUTRITIONNELS — HOMME ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      var S = window.S;
      S.sex = 'homme'; S.weight = 80; S.height = 180; S.birthDate = '1995-06-15';
      S.activity = 2; S.sleep = 2; S.goal = 2; S.train = []; S.medical = [];
      S.pregnant = false;
      if (window.validatePregnancyState) window.validatePregnancyState();
      var bmr = window.calcBMR();
      var tdee = window.calcTDEE();
      var target = window.calcTarget();
      var macros = window.calcMacros();
      var bmi = window.calcBMI();
      var hydration = window.calcHydration();
      return { bmr: bmr, tdee: tdee, target: target, macros: macros, bmi: bmi, hydration: hydration ? hydration.total : 0 };
    });
    check(r.bmr > 1500 && r.bmr < 2200, 'BMR homme 80kg: ' + r.bmr + ' kcal (expected 1500-2200)');
    check(r.tdee > 2000 && r.tdee < 3500, 'TDEE homme: ' + r.tdee + ' kcal');
    check(r.target > 1500 && r.target < 4000, 'Target homme maintain: ' + r.target + ' kcal');
    check(r.macros && r.macros.p > 80 && r.macros.p < 250, 'Protein: ' + (r.macros ? r.macros.p : 'null') + 'g');
    check(r.macros && r.macros.g > 100 && r.macros.g < 500, 'Carbs: ' + (r.macros ? r.macros.g : 'null') + 'g');
    check(r.macros && r.macros.l > 30 && r.macros.l < 200, 'Fat: ' + (r.macros ? r.macros.l : 'null') + 'g');
    check(r.bmi > 20 && r.bmi < 30, 'BMI: ' + r.bmi);
    check(r.hydration > 1500 && r.hydration < 5000, 'Hydration: ' + r.hydration + 'ml');
    // Verify no NaN
    check(!isNaN(r.bmr) && !isNaN(r.tdee) && !isNaN(r.target), 'No NaN in calculations');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 3: CALCULS NUTRITIONNELS — FEMME ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      var S = window.S;
      S.sex = 'femme'; S.weight = 60; S.height = 165; S.birthDate = '1992-03-20';
      S.activity = 2; S.sleep = 2; S.goal = 3; S.train = []; S.medical = [];
      S.pregnant = false;
      if (window.validatePregnancyState) window.validatePregnancyState();
      var target = window.calcTarget();
      var macros = window.calcMacros();
      return { target: target, p: macros ? macros.p : 0, g: macros ? macros.g : 0, l: macros ? macros.l : 0 };
    });
    check(r.target > 1400, 'Femme cut target > 1400 floor: ' + r.target);
    check(r.p > 60, 'Femme protein > 60g: ' + r.p);
    check(!isNaN(r.target), 'No NaN');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 4: GROSSESSE — INVARIANT & CALCULS ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      var S = window.S;
      // Test 1: invariant — homme pregnant should be cleared
      S.sex = 'homme'; S.pregnant = true; S.pregnancyWeek = 20;
      window.validatePregnancyState();
      var inv1 = !S.pregnant && S.pregnancyWeek === null;

      // Test 2: femme enceinte T2
      S.sex = 'femme'; S.weight = 65; S.height = 165; S.birthDate = '1993-01-10';
      S.activity = 2; S.sleep = 2; S.goal = 2; S.medical = [];
      S.pregnant = true; S.pregnancyWeek = 20; S.prePregnancyWeight = 60;
      var targetT2 = window.calcTarget();
      var tri = window.getPregnancyTrimester();

      // Test 3: femme enceinte T3
      S.pregnancyWeek = 32;
      var targetT3 = window.calcTarget();
      var triT3 = window.getPregnancyTrimester();

      // Test 4: femme enceinte + allaitement (additif)
      S.medical = ['allaitement'];
      var targetBoth = window.calcTarget();

      // Test 5: non-enceinte, allaitement seul
      S.pregnant = false; S.pregnancyWeek = null;
      var targetAllait = window.calcTarget();

      return {
        inv1: inv1,
        targetT2: targetT2, triNumber2: tri ? tri.trimesterNumber : null,
        targetT3: targetT3, triNumber3: triT3 ? triT3.trimesterNumber : null,
        targetBoth: targetBoth,
        targetAllait: targetAllait
      };
    });
    check(r.inv1, 'Invariant: homme+pregnant → cleared');
    check(r.triNumber2 === 2, 'Trimester T2 detected (week 20): T' + r.triNumber2);
    check(r.triNumber3 === 3, 'Trimester T3 detected (week 32): T' + r.triNumber3);
    check(r.targetT2 >= 1800, 'T2 target >= 1800: ' + r.targetT2);
    check(r.targetT3 > r.targetT2, 'T3 target > T2: ' + r.targetT3 + ' > ' + r.targetT2);
    check(r.targetBoth > r.targetT3, 'Pregnant+allait > T3 seul: ' + r.targetBoth + ' > ' + r.targetT3);
    check(r.targetAllait >= 1800, 'Allaitement seul >= 1800: ' + r.targetAllait);
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 5: PDF GENERATION ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var doc = new window.jspdf.jsPDF();
        doc.text('Test complet avec accents: éèàçù — Programme Musculation', 10, 10);
        var out = doc.output('datauristring');
        return { ok: true, size: out.length };
      } catch(e) { return { ok: false, error: e.message }; }
    });
    check(r.ok, 'jsPDF generates PDF: ' + (r.ok ? r.size + ' chars' : r.error));

    // Test exportSportPDF exists and is callable
    const sportPdf = await page.evaluate(() => typeof window.exportSportPDF === 'function');
    check(sportPdf, 'exportSportPDF function exists');

    const dayPdf = await page.evaluate(() => typeof window.exportDayPDF === 'function');
    check(dayPdf, 'exportDayPDF function exists');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 6: EXERCISE DATABASE INTEGRITY ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      var gifs = window.EXERCISE_GIFS || {};
      var gifCount = Object.keys(gifs).length;
      var nullGifs = Object.values(gifs).filter(v => v === null).length;
      var emptyGifs = Object.values(gifs).filter(v => v === '').length;
      var hasVideoGen = typeof window.getExerciseVideoUrl === 'function';
      var testVideo = hasVideoGen ? window.getExerciseVideoUrl('Développé couché') : null;
      return { gifCount: gifCount, nullGifs: nullGifs, emptyGifs: emptyGifs, testVideo: testVideo };
    });
    check(r.gifCount >= 200, 'Exercise GIFs: ' + r.gifCount + ' entries');
    check(r.nullGifs <= 2, 'Null GIFs: ' + r.nullGifs + ' (max 2 acceptable)');
    check(r.emptyGifs === 0, 'Empty string GIFs: ' + r.emptyGifs);
    check(r.testVideo && r.testVideo.includes('youtube.com'), 'Video URL generator works');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 7: EDGE CASES — IRC, ADOLESCENT, MÉNOPAUSE ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      var S = window.S;
      // IRC patient — 50kg femme
      S.sex = 'femme'; S.weight = 50; S.height = 155; S.birthDate = '1980-01-01';
      S.activity = 1; S.sleep = 2; S.goal = 2; S.pregnant = false;
      S.medical = ['irc'];
      var ircTarget = window.calcTarget();
      var ircMacros = window.calcMacros();

      // Adolescent — 15yo homme
      S.sex = 'homme'; S.weight = 65; S.height = 175; S.birthDate = '2011-06-15';
      S.activity = 2; S.goal = 4; S.medical = [];
      var teenTarget = window.calcTarget();
      var teenTdee = window.calcTDEE();

      // Ménopause femme
      S.sex = 'femme'; S.weight = 70; S.height = 165; S.birthDate = '1970-01-01';
      S.activity = 1; S.goal = 3; S.medical = ['menopause'];
      var menoTarget = window.calcTarget();

      return {
        ircTarget: ircTarget, ircP: ircMacros ? ircMacros.p : 0,
        teenTarget: teenTarget, teenTdee: teenTdee,
        menoTarget: menoTarget
      };
    });
    check(r.ircTarget >= 1400, 'IRC target >= 1400 floor: ' + r.ircTarget);
    check(r.ircP <= 35, 'IRC protein <= 0.60g/kg (50kg → 30g max): ' + r.ircP + 'g');
    check(r.teenTarget >= r.teenTdee - 300, 'Teen deficit capped -300: target=' + r.teenTarget + ' tdee=' + r.teenTdee);
    check(r.menoTarget >= 1400, 'Menopause target >= 1400: ' + r.menoTarget);
    check(!isNaN(r.ircTarget) && !isNaN(r.teenTarget) && !isNaN(r.menoTarget), 'No NaN in edge cases');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 8: SPORT PROGRAM GENERATION ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      var S = window.S;
      S.sex = 'homme'; S.weight = 80; S.height = 180; S.birthDate = '1995-06-15';
      S.activity = 3; S.sportType = 'muscu'; S.sportLevel = 'intermediate';
      S.sportDays = 4; S.sportEquipment = 'gym'; S.sportGoals = ['muscle'];
      S.muscuMedical = { done: false };
      if (typeof window.generateSportProgram === 'function') {
        try {
          var prog = window.generateSportProgram();
          if (prog && prog.length > 0) {
            return {
              ok: true, days: prog.length,
              firstDay: prog[0] ? { name: prog[0].name || 'N/A', exCount: (prog[0].exercises || []).length } : null,
              hasExercises: prog.every(function(d) { return d && Array.isArray(d.exercises) && d.exercises.length > 0; })
            };
          }
          return { ok: false, error: 'Empty program' };
        } catch(e) { return { ok: false, error: e.message }; }
      }
      return { ok: false, error: 'generateSportProgram not found' };
    });
    check(r.ok, 'Sport program generated: ' + (r.ok ? r.days + ' days' : r.error));
    if (r.ok) {
      check(r.days >= 3 && r.days <= 7, 'Program has ' + r.days + ' days (3-7 expected)');
      check(r.hasExercises, 'Every day has exercises');
      check(r.firstDay && r.firstDay.exCount >= 2, 'First day: ' + (r.firstDay ? r.firstDay.exCount : 0) + ' exercises');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 9: MEAL PLAN GENERATION ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx } = await freshPage();
    const r = await page.evaluate(() => {
      var S = window.S;
      S.sex = 'homme'; S.weight = 80; S.height = 180; S.birthDate = '1995-06-15';
      S.activity = 2; S.sleep = 2; S.goal = 2; S.mealsPerDay = 3;
      S.regime = 0; S.halal = false; S.allergies = []; S.intolerances = [];
      S.cookLevel = 2; S.excluded = ''; S.cuisines = [0]; S.medical = [];
      S.pregnant = false;
      try {
        var week = window.generateWeek();
        if (Array.isArray(week) && week.length === 7) {
          var day0 = week[0];
          var hasBreakfast = !!(day0 && day0.breakfast && day0.breakfast.n);
          var hasLunch = !!(day0 && day0.lunch && day0.lunch.n);
          var hasDinner = !!(day0 && day0.dinner && day0.dinner.n);
          return { ok: true, days: week.length, hasBreakfast: hasBreakfast, hasLunch: hasLunch, hasDinner: hasDinner };
        }
        return { ok: false, error: 'Not 7 days: ' + (week ? week.length : 'null') };
      } catch(e) { return { ok: false, error: e.message }; }
    });
    check(r.ok, 'Meal plan generated: ' + (r.ok ? r.days + ' days' : r.error));
    if (r.ok) {
      check(r.hasBreakfast, 'Day 1 has breakfast');
      check(r.hasLunch, 'Day 1 has lunch');
      check(r.hasDinner, 'Day 1 has dinner');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══ TEST 10: NO PAGE ERRORS ══');
  // ═══════════════════════════════════════════════════════════════
  {
    const { page, ctx, consoleErrors } = await freshPage();
    await page.waitForTimeout(2000);
    check(consoleErrors.length === 0, 'No JS page errors (' + consoleErrors.length + ' found)');
    if (consoleErrors.length > 0) consoleErrors.slice(0, 5).forEach(e => console.log('    → ' + e));
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('TOTAL: ' + results.pass + ' passed, ' + results.fail + ' failed');
  console.log('══════════════════════════════════════');
  if (results.errors.length > 0) {
    console.log('\nFAILURES:');
    results.errors.forEach(e => console.log('  ✗ ' + e));
  }

  await browser.close();
  process.exit(results.fail > 0 ? 1 : 0);
})();
