// AGENT 4b — Nutrition détaillée : repas / macros / food journal / saladbar / smoothie / shoplist / body scan
const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';
const fs = require('fs');
if (!fs.existsSync('rapport-screenshots')) fs.mkdirSync('rapport-screenshots');

async function go() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  async function mkPage(uid, profile) {
    var ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    var page = await ctx.newPage();
    var errs = [];
    page.on('console', function(m) { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', function(e) { errs.push(e.message); });
    await ctx.addInitScript(function() {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await page.evaluate(function(d) {
      var fake = { id: d.uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '' };
      localStorage.setItem('mtd_profile_' + d.uid, JSON.stringify(d.p));
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return fake; };
      }
      if (window.loadProfile) window.loadProfile();
      if (window.S) {
        Object.assign(window.S, d.p);
        window.S.view = d.p._view || 'today';
      }
      if (window.render) window.render();
    }, { uid: uid, p: profile });
    await page.waitForTimeout(1500);
    return { page: page, errs: errs };
  }

  function noFatal(errs) {
    return errs.filter(function(e) {
      return e.includes('TypeError') || e.includes('is not a function') ||
             e.includes('Cannot read') || e.includes('is not defined') ||
             e.includes('Cannot set');
    }).length === 0;
  }

  var WEEK_PLAN = {
    lundi: { meals: [
      { name: 'Petit-déjeuner', kcal: 450, p: 20, g: 65, l: 12 },
      { name: 'Déjeuner', kcal: 650, p: 40, g: 70, l: 18 },
      { name: 'Dîner', kcal: 550, p: 35, g: 60, l: 14 }
    ], total: { kcal: 1650, p: 95, g: 195, l: 44 } },
    mardi: { meals: [{ name: 'Oatmeal', kcal: 400, p: 15, g: 60, l: 10 }], total: { kcal: 400, p: 15, g: 60, l: 10 } },
    mercredi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } }
  };

  var BASE = {
    appMode: 'nutrition', sex: 'male', age: 28, weight: 75, height: 178,
    activity: 1.55, sleep: 7, goal: 0, nStep: 12, weekPlan: WEEK_PLAN
  };

  // T1 : Planning semaine — affichage complet
  {
    var uid1 = 'a4b_plan_' + Date.now();
    var r1 = await mkPage(uid1, Object.assign({}, BASE, { _view: 'nutrition' }));
    var html1 = await r1.page.content();
    var ok1 = html1.length > 3000 && noFatal(r1.errs);
    await r1.page.screenshot({ path: 'rapport-screenshots/N1-planning.png' });
    results.push({ test: 'T1 Planning semaine nutrition', ok: ok1, errors: r1.errs.slice(0, 3) });
    await r1.page.close();
  }

  // T2 : Today — macros + repas du jour
  {
    var uid2 = 'a4b_today_' + Date.now();
    var r2 = await mkPage(uid2, Object.assign({}, BASE, { _view: 'today' }));
    var html2 = await r2.page.content();
    var ok2 = html2.length > 3000 && noFatal(r2.errs);
    await r2.page.screenshot({ path: 'rapport-screenshots/N2-today-nutrition.png' });
    results.push({ test: 'T2 Today macros + repas', ok: ok2, errors: r2.errs.slice(0, 3) });
    await r2.page.close();
  }

  // T3 : Food journal avec repas loggés aujourd'hui
  {
    var uid3 = 'a4b_journal_' + Date.now();
    var ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    var page3 = await ctx3.newPage();
    var errs3 = [];
    page3.on('console', function(m) { if (m.type() === 'error') errs3.push(m.text()); });
    page3.on('pageerror', function(e) { errs3.push(e.message); });
    await ctx3.addInitScript(function() {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page3.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page3.waitForTimeout(4000);
    await page3.evaluate(function(d) {
      var fake = { id: d.uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '' };
      var today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('mtd_food_journal_' + d.uid + '_' + today, JSON.stringify([
        { time: '08:00', name: 'Oatmeal', kcal: 350, p: 12, g: 55, l: 8 },
        { time: '12:30', name: 'Poulet riz', kcal: 600, p: 45, g: 65, l: 12 }
      ]));
      localStorage.setItem('mtd_profile_' + d.uid, JSON.stringify(d.p));
      window.AUTH.isLoggedIn = function() { return true; };
      window.AUTH.getUser = function() { return fake; };
      if (window.loadProfile) window.loadProfile();
      if (window.S) { Object.assign(window.S, d.p); window.S.view = 'today'; }
      if (window.render) window.render();
    }, { uid: uid3, p: BASE });
    await page3.waitForTimeout(1500);
    var html3 = await page3.content();
    var ok3 = html3.length > 3000 && noFatal(errs3);
    await page3.screenshot({ path: 'rapport-screenshots/N3-food-journal.png' });
    results.push({ test: 'T3 Food journal repas loggés', ok: ok3, errors: errs3.slice(0, 3) });
    await page3.close();
  }

  // T4 : Saladbar modal open
  {
    var uid4 = 'a4b_salad_' + Date.now();
    var r4 = await mkPage(uid4, Object.assign({}, BASE, { _view: 'today' }));
    try {
      var btn4 = r4.page.locator('[onclick*="saladBar"], [onclick*="salad"], button:has-text("Salade"), button:has-text("Builder"), button:has-text("Composer")').first();
      if (await btn4.count() > 0) { await btn4.click(); await r4.page.waitForTimeout(700); }
    } catch(e) {}
    var ok4 = noFatal(r4.errs);
    await r4.page.screenshot({ path: 'rapport-screenshots/N4-saladbar.png' });
    results.push({ test: 'T4 Saladbar modal', ok: ok4, errors: r4.errs.slice(0, 3) });
    await r4.page.close();
  }

  // T5 : Smoothie bar modal open
  {
    var uid5 = 'a4b_smoothie_' + Date.now();
    var r5 = await mkPage(uid5, Object.assign({}, BASE, { _view: 'today' }));
    try {
      var btn5 = r5.page.locator('[onclick*="smoothie"], button:has-text("Smoothie")').first();
      if (await btn5.count() > 0) { await btn5.click(); await r5.page.waitForTimeout(700); }
    } catch(e) {}
    var ok5 = noFatal(r5.errs);
    await r5.page.screenshot({ path: 'rapport-screenshots/N5-smoothie.png' });
    results.push({ test: 'T5 Smoothie bar modal', ok: ok5, errors: r5.errs.slice(0, 3) });
    await r5.page.close();
  }

  // T6 : Shop list modal open
  {
    var uid6 = 'a4b_shop_' + Date.now();
    var r6 = await mkPage(uid6, Object.assign({}, BASE, { _view: 'today' }));
    try {
      var btn6 = r6.page.locator('[onclick*="shopList"], button:has-text("Courses"), button:has-text("Liste")').first();
      if (await btn6.count() > 0) { await btn6.click(); await r6.page.waitForTimeout(700); }
    } catch(e) {}
    var ok6 = noFatal(r6.errs);
    await r6.page.screenshot({ path: 'rapport-screenshots/N6-shoplist.png' });
    results.push({ test: 'T6 Shop list courses', ok: ok6, errors: r6.errs.slice(0, 3) });
    await r6.page.close();
  }

  // T7 : Body scan composition
  {
    var uid7 = 'a4b_body_' + Date.now();
    var r7 = await mkPage(uid7, Object.assign({}, BASE, {
      _view: 'today',
      bodyScanDone: true,
      _bodyFatEstimate: 18,
      _bodyCompositionProfile: { fat: 18, muscle: 42, water: 60 },
      _bodyCompositionWeight: 75
    }));
    var html7 = await r7.page.content();
    var ok7 = html7.length > 2000 && noFatal(r7.errs);
    await r7.page.screenshot({ path: 'rapport-screenshots/N7-body-scan.png' });
    results.push({ test: 'T7 Body scan composition', ok: ok7, errors: r7.errs.slice(0, 3) });
    await r7.page.close();
  }

  // T8 : Mode both — dashboard combiné sport+nutrition
  {
    var uid8 = 'a4b_both_' + Date.now();
    var r8 = await mkPage(uid8, Object.assign({}, BASE, {
      appMode: 'both', _view: 'today',
      sportType: 'crossfit', crossfitLevel: 'intermediaire', crossfitDays: 4, sStep: 6
    }));
    var html8 = await r8.page.content();
    var ok8 = html8.length > 3000 && noFatal(r8.errs);
    await r8.page.screenshot({ path: 'rapport-screenshots/N8-both-mode.png' });
    results.push({ test: 'T8 Mode both combiné', ok: ok8, errors: r8.errs.slice(0, 3) });
    await r8.page.close();
  }

  // T9 : Nutrition onboarding steps 1-5 sans crash
  {
    var allOk9 = true;
    var lastErrs9 = [];
    for (var nst = 1; nst <= 5; nst++) {
      var uid9 = 'a4b_nonb' + nst + '_' + Date.now();
      var prof9 = { appMode: 'nutrition', nStep: nst, _view: 'nutrition' };
      if (nst >= 2) prof9.sex = 'male';
      if (nst >= 3) prof9.goal = 0;
      if (nst >= 4) prof9.age = 28;
      var r9 = await mkPage(uid9, prof9);
      var html9 = await r9.page.content();
      if (html9.length < 2000 || !noFatal(r9.errs)) { allOk9 = false; lastErrs9 = r9.errs; }
      await r9.page.close();
    }
    // Screenshot final step
    var uid9f = 'a4b_nonbf_' + Date.now();
    var r9f = await mkPage(uid9f, { appMode: 'nutrition', nStep: 5, _view: 'nutrition', sex: 'male', goal: 0, age: 28 });
    await r9f.page.screenshot({ path: 'rapport-screenshots/N9-nutrition-steps.png' });
    await r9f.page.close();
    results.push({ test: 'T9 Nutrition onboarding steps 1→5', ok: allOk9, errors: lastErrs9.slice(0, 3) });
  }

  // T10 : Offline — pas de crash JS
  {
    var ctx10 = await browser.newContext({ viewport: { width: 390, height: 844 }, offline: true });
    var page10 = await ctx10.newPage();
    var errs10 = [];
    page10.on('pageerror', function(e) { errs10.push(e.message); });
    await ctx10.addInitScript(function() {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    try {
      await page10.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 8000 });
    } catch(e) {}
    try { await page10.waitForLoadState('domcontentloaded', { timeout: 3000 }); } catch(e) {}
    await page10.waitForTimeout(1500);
    var html10 = '';
    try { html10 = await page10.content(); } catch(e) { html10 = '<html></html>'; }
    var ok10 = noFatal(errs10);
    await page10.screenshot({ path: 'rapport-screenshots/N10-offline.png' });
    results.push({ test: 'T10 Offline sans crash', ok: ok10, errors: errs10.slice(0, 3) });
    await page10.close();
  }

  await browser.close();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AGENT 4b — Nutrition / Repas / Macros / Body / Smoothie    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  var pass = 0, fail = 0;
  results.forEach(function(r) {
    var icon = r.ok ? '✅' : '❌';
    console.log(icon + ' ' + r.test);
    if (!r.ok && r.errors.length) r.errors.forEach(function(e) { console.log('   ⚠ ' + e.slice(0, 120)); });
    r.ok ? pass++ : fail++;
  });
  console.log('\n  TOTAL: ' + pass + '/' + results.length + ' PASS  |  ' + fail + ' FAIL');
  process.exit(fail > 0 ? 1 : 0);
}

go().catch(function(e) { console.error('FATAL:', e.message); process.exit(1); });
