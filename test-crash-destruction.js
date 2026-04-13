// ═══════════════════════════════════════════════════════════════════════
// TEST DE DESTRUCTION — Essayer de crasher SmartFitCoach
// Données aberrantes, nulls, injections, edge cases extrêmes
// ═══════════════════════════════════════════════════════════════════════
const { chromium } = require('playwright');
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let pass = 0, fail = 0, errors = [];
  function ok(m) { pass++; }
  function ko(m) { fail++; errors.push(m); console.log('    ✗ ' + m); }
  function check(c, m) { c ? ok(m) : ko(m); }

  async function freshPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
    const gi = await page.$('#gate input[type="password"]');
    if (gi) { await gi.fill('mtd2025'); const b = await page.$('#gate button'); if (b) await b.click(); await page.waitForTimeout(800); }
    await page.evaluate(() => {
      if (window.AUTH) { window.AUTH.isLoggedIn = function() { return true; }; window.AUTH.getUser = function() { return { id: 'crash-test', email: 'crash@test.com', name: 'Crash Test' }; }; }
    });
    return { page, ctx, pageErrors };
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 1: DONNÉES NULLES PARTOUT ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = null; S.weight = null; S.height = null; S.birthDate = null;
        S.activity = null; S.sleep = null; S.goal = null; S.medical = null;
        S.weekPlan = null; S.sportProgram = null; S.pregnant = null;
        var bmr = window.calcBMR();
        var tdee = window.calcTDEE();
        var target = window.calcTarget();
        var macros = window.calcMacros();
        window.render();
        return { crash: false, bmr: bmr, tdee: tdee, target: target };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'Tout null: ' + (r.crash ? 'CRASH ' + r.error : 'survit (BMR=' + r.bmr + ')'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 2: VALEURS ABSURDES ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = 'homme'; S.weight = 999; S.height = 999; S.birthDate = '1900-01-01';
        S.activity = 99; S.sleep = 99; S.goal = 999; S.medical = [];
        S.mealsPerDay = 99; S.sportDays = 99;
        var bmr = window.calcBMR();
        var target = window.calcTarget();
        var macros = window.calcMacros();
        window.render();
        return { crash: false, bmr: bmr, target: target, isNaN: isNaN(bmr) || isNaN(target) };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'Valeurs 999: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 3: VALEURS NÉGATIVES ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = 'femme'; S.weight = -50; S.height = -170; S.birthDate = '2050-01-01';
        S.activity = -1; S.sleep = -1; S.goal = -1; S.age = -10;
        var bmr = window.calcBMR();
        var target = window.calcTarget();
        window.render();
        return { crash: false, bmr: bmr, target: target };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'Valeurs négatives: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 4: TYPES INCORRECTS ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = 12345; S.weight = 'abc'; S.height = true; S.birthDate = {};
        S.activity = []; S.goal = 'shred'; S.medical = 'diabete';
        S.allergies = 'noix'; S.weekPlan = 'plan'; S.pregnant = 'oui';
        var bmr = window.calcBMR();
        var target = window.calcTarget();
        if (window.validatePregnancyState) window.validatePregnancyState();
        window.render();
        return { crash: false, pregnant: S.pregnant };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'Types incorrects: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 5: XSS INJECTION ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.prenom = '<img src=x onerror=alert(1)>';
        S.nom = '<script>alert("xss")</script>';
        S.sex = 'homme'; S.weight = 80; S.height = 180; S.birthDate = '1995-01-01';
        S.activity = 2; S.goal = 2; S.sleep = 2;
        S.view = 'profile';
        window.render();
        var html = document.getElementById('app') ? document.getElementById('app').innerHTML : '';
        var hasScript = html.includes('<script>');
        var hasOnerror = html.includes('onerror=');
        return { crash: false, hasScript: hasScript, hasOnerror: hasOnerror };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'XSS injection: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(!r.hasScript, 'Pas de <script> injecté dans le DOM');
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 6: PROTOTYPE POLLUTION ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.__proto__.isAdmin = true;
        S.constructor.prototype.hacked = true;
        window.render();
        var polluted = ({}).isAdmin === true || ({}).hacked === true;
        // Cleanup
        delete Object.prototype.isAdmin;
        delete Object.prototype.hacked;
        return { crash: false, polluted: polluted };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'Prototype pollution: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 7: HOMME ENCEINTE (invariant) ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = 'homme'; S.pregnant = true; S.pregnancyWeek = 30;
        S.prePregnancyWeight = 70; S.dueDate = '2026-08-01';
        S.goal = 4; S.medical = ['allaitement'];
        if (window.validatePregnancyState) window.validatePregnancyState();
        var target = window.calcTarget();
        window.render();
        return { crash: false, pregnant: S.pregnant, pregnancyWeek: S.pregnancyWeek, target: target };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'Homme enceinte: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(!r.pregnant, 'Invariant nettoyé: pregnant=' + r.pregnant);
    check(r.pregnancyWeek === null, 'pregnancyWeek nettoyé: ' + r.pregnancyWeek);
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 8: RENDER 100x RAPIDE ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = 'homme'; S.weight = 80; S.height = 180; S.birthDate = '1995-01-01';
        S.activity = 2; S.goal = 2; S.sleep = 2;
        for (var i = 0; i < 100; i++) {
          S.view = ['today', 'nutrition', 'sport', 'profile'][i % 4];
          if (S.view === 'nutrition') S.nStep = i % 13;
          window.render();
        }
        return { crash: false };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, '100 renders rapides: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 9: LOCALSTORAGE PLEIN ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        // Remplir localStorage presque au max
        try {
          var big = 'x'.repeat(1024 * 1024); // 1MB
          for (var i = 0; i < 4; i++) localStorage.setItem('_crash_test_' + i, big);
        } catch(e) {} // quota exceeded = normal
        // Maintenant essayer de sauvegarder le profil
        var S = window.S;
        S.sex = 'homme'; S.weight = 80; S.height = 180;
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        window.render();
        // Cleanup
        for (var j = 0; j < 4; j++) localStorage.removeItem('_crash_test_' + j);
        return { crash: false };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'localStorage plein: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 10: WEEKPLAN CORROMPU ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = 'homme'; S.weight = 80; S.height = 180; S.birthDate = '1995-01-01';
        S.activity = 2; S.goal = 2; S.sleep = 2; S.mealsPerDay = 3;
        // Plan corrompu
        S.weekPlan = [null, undefined, {}, {breakfast: null}, {breakfast: {n: null, k: NaN}}, 'string', 42];
        S.nStep = 12; S.view = 'nutrition';
        window.render();
        return { crash: false };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'weekPlan corrompu: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 11: SPORTPROGRAM CORROMPU ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        S.sex = 'homme'; S.weight = 80; S.height = 180; S.sportType = 'muscu';
        S.sportLevel = 'intermediate'; S.sportDays = 4; S.appMode = 'sport';
        S.sportProgram = [null, {exercises: null}, {exercises: [null, undefined, {n: null}]}, 'garbage'];
        S.selectedSportDay = 0; S.sStep = 4; S.view = 'sport';
        window.render();
        S.selectedSportDay = 99; // out of bounds
        window.render();
        return { crash: false };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'sportProgram corrompu: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  console.log('\n═══ CRASH TEST 12: STRING OVERFLOW ═══');
  {
    const { page, ctx, pageErrors } = await freshPage();
    const r = await page.evaluate(() => {
      try {
        var S = window.S;
        var huge = 'A'.repeat(100000);
        S.prenom = huge; S.nom = huge; S.excluded = huge;
        S.sex = 'homme'; S.weight = 80; S.height = 180; S.birthDate = '1995-01-01';
        S.activity = 2; S.goal = 2; S.sleep = 2;
        S.view = 'profile';
        window.render();
        return { crash: false };
      } catch(e) { return { crash: true, error: e.message }; }
    });
    check(!r.crash, 'Strings 100K chars: ' + (r.crash ? 'CRASH ' + r.error : 'survit'));
    check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? '0' : pageErrors[0]));
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  const total = pass + fail;
  console.log('\n═══════════════════════════════════════');
  console.log('  CRASH TESTS: ' + pass + '/' + total);
  console.log('═══════════════════════════════════════');
  if (errors.length) {
    console.log('\nCRASHÉ:');
    errors.forEach(e => console.log('  ✗ ' + e));
  } else {
    console.log('\n  ✓ INCASSABLE — AUCUN CRASH');
  }

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
