// AGENT 1b — Dashboard / Nutrition / Today / Streak / Scanner / AI Coach / Share / Profile
const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';
const TEST_UID = 'test_a1b_' + Date.now();
const fs = require('fs');
if (!fs.existsSync('rapport-screenshots')) fs.mkdirSync('rapport-screenshots');

async function go() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  async function mkPage(profile) {
    const uid = profile._uid || TEST_UID;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push(e.message));
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await page.evaluate(function(d) {
      var fake = { id: d.uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '' };
      localStorage.setItem('mtd_profile_' + d.uid, JSON.stringify(d.p));
      if (d.p.streak) {
        localStorage.setItem('mtd_streak_' + d.uid, JSON.stringify({
          current: d.p.streak,
          lastDate: new Date().toISOString().slice(0, 10)
        }));
      }
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
    return { page, errs };
  }

  function noFatalErrors(errs) {
    return errs.filter(function(e) {
      return (e.includes('TypeError') || e.includes('is not a function') || e.includes('Cannot read') || e.includes('is not defined'));
    }).length === 0;
  }

  // T1 : Dashboard today + streak
  {
    var wp = { lundi: { meals: [{ name: 'Oatmeal', kcal: 400, p: 15, g: 60, l: 8 }], total: { kcal: 400, p: 15, g: 60, l: 8 } } };
    var { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180,
      activity: 1.55, sleep: 7, goal: 0, weekPlan: wp,
      streak: 5, prenom: 'Test', _view: 'today', nStep: 12
    });
    const html = await page.content();
    const ok = html.length > 5000 && noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T1-today-streak.png' });
    results.push({ test: 'T1 Dashboard today + streak', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T2 : Macros progress bars
  {
    var wp2 = { lundi: { meals: [{ name: 'Salade', kcal: 350, p: 25, g: 30, l: 12 }], total: { kcal: 350, p: 25, g: 30, l: 12 } } };
    var { page, errs } = await mkPage({
      appMode: 'nutrition', sex: 'female', age: 28, weight: 60, height: 165,
      activity: 1.375, sleep: 8, goal: -0.25, weekPlan: wp2, nStep: 12, _view: 'today'
    });
    const html = await page.content();
    const ok = html.length > 3000 && noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T2-macros.png' });
    results.push({ test: 'T2 Nutrition dashboard macros', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T3 : Navigation tabs
  {
    var wp3 = { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } };
    var { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 25, weight: 75, height: 175,
      activity: 1.55, sleep: 7, goal: 0, weekPlan: wp3,
      sportType: 'crossfit', crossfitLevel: 'intermediate', crossfitDays: 4,
      nStep: 12, sStep: 6, _view: 'today'
    });
    // Try clicking sport/nutrition tabs
    try {
      var btn = page.locator('[data-view="sport"], nav [onclick*="sport"]').first();
      if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(400); }
    } catch(e) {}
    try {
      var btn2 = page.locator('[data-view="nutrition"], nav [onclick*="nutrition"]').first();
      if (await btn2.count() > 0) { await btn2.click(); await page.waitForTimeout(400); }
    } catch(e) {}
    const ok = noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T3-nav-tabs.png' });
    results.push({ test: 'T3 Navigation tabs', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T4 : AI Coach panel
  {
    var wp4 = { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } };
    var { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180,
      activity: 1.55, sleep: 7, goal: 0, nStep: 12, sStep: 6, _view: 'today',
      weekPlan: wp4, sportType: 'crossfit', crossfitLevel: 'intermediate', crossfitDays: 4
    });
    try {
      var coachBtn = page.locator('[id*="coach"], button:has-text("Coach"), [onclick*="coach"]').first();
      if (await coachBtn.count() > 0) { await coachBtn.click(); await page.waitForTimeout(1000); }
    } catch(e) {}
    const ok = noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T4-ai-coach.png' });
    results.push({ test: 'T4 AI Coach panel', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T5 : Wellness check-in sStep=20
  {
    var { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180,
      activity: 1.55, sleep: 7, goal: 0, nStep: 12, sStep: 20, _view: 'sport',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } },
      sportType: 'crossfit', crossfitLevel: 'intermediate', crossfitDays: 4
    });
    const html = await page.content();
    const ok = html.length > 2000 && noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T5-wellness.png' });
    results.push({ test: 'T5 Wellness check-in sStep=20', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T6 : Profil view
  {
    var { page, errs } = await mkPage({
      appMode: 'both', sex: 'female', age: 26, weight: 58, height: 163,
      activity: 1.375, sleep: 8, goal: -0.25, nStep: 12, _view: 'profile',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } }
    });
    const html = await page.content();
    const ok = html.length > 2000 && noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T6-profile.png' });
    results.push({ test: 'T6 Profil utilisateur', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T7 : Share card (buildShareCanvas)
  {
    var { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180,
      activity: 1.55, sleep: 7, goal: 0, nStep: 12, streak: 12, _view: 'today',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } }
    });
    // Test buildShareCanvas directly
    var shareResult = await page.evaluate(function() {
      try {
        if (typeof buildShareCanvas === 'function') {
          var canvas = buildShareCanvas();
          return { ok: true, hasCanvas: canvas && canvas.width > 0 };
        }
        return { ok: false, reason: 'buildShareCanvas not found' };
      } catch(e) {
        return { ok: false, reason: e.message };
      }
    });
    try {
      var shareBtn = page.locator('button:has-text("Partager"), [onclick*="share"], [onclick*="Share"]').first();
      if (await shareBtn.count() > 0) { await shareBtn.click(); await page.waitForTimeout(600); }
    } catch(e) {}
    const ok = noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T7-share.png' });
    results.push({ test: 'T7 Share card (buildShareCanvas: ' + JSON.stringify(shareResult) + ')', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T8 : Onboarding nutrition nStep=1
  {
    var { page, errs } = await mkPage({ appMode: 'nutrition', nStep: 1, _view: 'nutrition' });
    const html = await page.content();
    const ok = html.length > 2000 && noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T8-onb-n1.png' });
    results.push({ test: 'T8 Onboarding nutrition nStep=1', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T9 : Scanner UI (open/close)
  {
    var { page, errs } = await mkPage({
      appMode: 'nutrition', sex: 'male', age: 30, weight: 78, height: 178,
      activity: 1.55, sleep: 7, goal: 0, nStep: 12, _view: 'today',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } }
    });
    try {
      var scanBtn = page.locator('[onclick*="scan"], button:has-text("Scanner"), [data-action="scan"]').first();
      if (await scanBtn.count() > 0) { await scanBtn.click(); await page.waitForTimeout(800); }
    } catch(e) {}
    const ok = noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T9-scanner.png' });
    results.push({ test: 'T9 Scanner alimentaire UI', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T10 : localStorage corrompu — pas de crash
  {
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx2.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await ctx2.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
      localStorage.setItem('mtd_profile_corrupt', '{invalid{{json');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    const html = await page.content();
    const ok = html.length > 2000 && noFatalErrors(errs);
    await page.screenshot({ path: 'rapport-screenshots/T10-corrupt-ls.png' });
    results.push({ test: 'T10 localStorage corrompu — recovery', ok: ok, errors: errs.slice(0, 3) });
    await page.close();
  }

  await browser.close();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AGENT 1 — Dashboard / Nutrition / Scanner / Coach / Profil  ║');
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
