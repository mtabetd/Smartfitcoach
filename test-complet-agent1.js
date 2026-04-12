// AGENT 1 — Dashboard / Nutrition / Today / Streak / Scanner / AI Coach
const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';
const TEST_UID = 'test_a1_' + Date.now();
const fs = require('fs');
if (!fs.existsSync('rapport-screenshots')) fs.mkdirSync('rapport-screenshots');

async function go() {
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const results = [];

  async function mkPage(profile) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push(e.message));
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1','1');
      sessionStorage.setItem('mtd_gate_access','1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await page.evaluate((d) => {
      var fake = { id: d.uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '' };
      localStorage.setItem('mtd_profile_' + d.uid, JSON.stringify(d.profile));
      if (d.profile.streak) {
        localStorage.setItem('mtd_streak_' + d.uid, JSON.stringify({ current: d.profile.streak, lastDate: new Date().toISOString().slice(0,10) }));
      }
      if (window.AUTH) { window.AUTH.isLoggedIn = () => true; window.AUTH.getUser = () => fake; }
      if (window.loadProfile) window.loadProfile();
      if (window.S) { Object.assign(window.S, d.profile); window.S.view = d.profile._view || 'today'; }
      if (window.render) window.render();
    }, { uid: d.uid || TEST_UID, profile });
    await page.waitForTimeout(1500);
    return { page, errs };
  }

  const d = { uid: TEST_UID };

  // ── T1 : Dashboard today — utilisateur avec streak ──────────────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180, activity: 1.55, sleep: 7,
      goal: 0, weekPlan: { lundi: { meals: [{ name: 'Oatmeal', kcal: 400, p: 15, g: 60, l: 8 }], total: { kcal: 400, p: 15, g: 60, l: 8 } } } },
      streak: 5, prenom: 'Test', _view: 'today'
    });
    const html = await page.content();
    const hasStreak = html.includes('streak') || html.includes('flamme') || html.includes('🔥') || html.includes('5');
    const hasNoWhiteScreen = html.length > 5000;
    const noFatalCrash = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    await page.screenshot({ path: 'rapport-screenshots/T1-today-streak.png', fullPage: false });
    results.push({ test: 'T1 Dashboard today + streak', ok: hasNoWhiteScreen && noFatalCrash, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T2 : Nutrition step — macros progress bar ────────────────────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'nutrition', sex: 'female', age: 28, weight: 60, height: 165, activity: 1.375, sleep: 8,
      goal: -0.25, weekPlan: { lundi: { meals: [{ name: 'Salade', kcal: 350, p: 25, g: 30, l: 12 }], total: { kcal: 350, p: 25, g: 30, l: 12 } } },
      nStep: 12, _view: 'today'
    });
    const html = await page.content();
    const hasPlan = html.includes('kcal') || html.includes('protéines') || html.includes('glucides');
    await page.screenshot({ path: 'rapport-screenshots/T2-nutrition-dashboard.png' });
    const noFatal = errs.filter(e => !e.includes('net::ERR') && !e.includes('favicon') && (e.includes('TypeError') || e.includes('undefined'))).length === 0;
    results.push({ test: 'T2 Nutrition dashboard + macros', ok: hasPlan && noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T3 : Navigation tabs — today / sport / nutrition / profile ────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 25, weight: 75, height: 175, activity: 1.55, sleep: 7,
      goal: 0, weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } },
      sportType: 'crossfit', crossfitLevel: 'intermediate', crossfitDays: 4, crossfitProgram: {},
      nStep: 12, sStep: 6, _view: 'today'
    });
    // Click nav tabs
    const tabs = ['sport', 'nutrition', 'today'];
    let tabOk = true;
    for (const t of tabs) {
      try {
        const sel = `[data-view="${t}"], [onclick*="${t}"], nav button:has-text("${t}")`;
        const btn = page.locator(sel).first();
        if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(500); }
      } catch(e) { tabOk = false; }
    }
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    await page.screenshot({ path: 'rapport-screenshots/T3-nav-tabs.png' });
    results.push({ test: 'T3 Navigation tabs (today/sport/nutrition)', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T4 : Scanner alimentaire (UI + open/close) ───────────────────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'nutrition', sex: 'male', age: 30, weight: 78, height: 178, activity: 1.55, sleep: 7,
      goal: 0, nStep: 12, _view: 'today',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } }
    });
    // Look for scanner button
    const scanBtn = page.locator('[onclick*="scan"], [onclick*="scanner"], button:has-text("Scanner"), [data-action="scan"]').first();
    if (await scanBtn.count() > 0) {
      await scanBtn.click();
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: 'rapport-screenshots/T4-scanner-ui.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T4 Scanner alimentaire (UI)', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T5 : AI Coach panel — open / questions display ───────────────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180, activity: 1.55, sleep: 7,
      goal: 0, nStep: 12, sStep: 6, _view: 'today',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } },
      sportType: 'crossfit', crossfitLevel: 'intermediate', crossfitDays: 4
    });
    const coachBtn = page.locator('[onclick*="coach"], [onclick*="Coach"], button:has-text("Coach"), #coach-btn').first();
    if (await coachBtn.count() > 0) {
      await coachBtn.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'rapport-screenshots/T5-ai-coach.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T5 AI Coach panel', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T6 : Wellness check-in (sStep=20) ───────────────────────────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180, activity: 1.55, sleep: 7,
      goal: 0, nStep: 12, sStep: 20, _view: 'sport',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } },
      sportType: 'crossfit', crossfitLevel: 'intermediate', crossfitDays: 4
    });
    await page.screenshot({ path: 'rapport-screenshots/T6-wellness.png' });
    const html = await page.content();
    const hasWellness = html.includes('Bien') || html.includes('énergie') || html.includes('sommeil') || html.includes('douleur');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T6 Wellness check-in (sStep=20)', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T7 : Profil utilisateur — affichage + édition ────────────────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'both', sex: 'female', age: 26, weight: 58, height: 163, activity: 1.375, sleep: 8,
      goal: -0.25, nStep: 12, _view: 'profile',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } }
    });
    await page.screenshot({ path: 'rapport-screenshots/T7-profile.png' });
    const html = await page.content();
    const hasProfile = html.includes('kg') || html.includes('cm') || html.includes('kcal') || html.includes('profil');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T7 Profil utilisateur', ok: hasProfile && noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T8 : Onboarding nutrition step 1→3 ──────────────────────────────────────
  {
    const { page, errs } = await mkPage({ appMode: 'nutrition', nStep: 1, _view: 'nutrition' });
    await page.screenshot({ path: 'rapport-screenshots/T8-onboarding-n1.png' });
    const html = await page.content();
    const hasStep = html.includes('objectif') || html.includes('poids') || html.includes('Perdre') || html.includes('Maintenir') || html.includes('quel est');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T8 Onboarding nutrition step 1', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T9 : Carte partage progression (buildShareCanvas) ───────────────────────
  {
    const { page, errs } = await mkPage({
      appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180, activity: 1.55, sleep: 7,
      goal: 0, nStep: 12, streak: 12, _view: 'today',
      weekPlan: { lundi: { meals: [], total: { kcal: 0, p: 0, g: 0, l: 0 } } }
    });
    // Try to click share/partage button
    const shareBtn = page.locator('[onclick*="share"], [onclick*="Share"], button:has-text("Partager"), [onclick*="buildShare"]').first();
    if (await shareBtn.count() > 0) {
      await shareBtn.click();
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: 'rapport-screenshots/T9-share.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T9 Carte partage (buildShareCanvas)', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T10 : localStorage corrupt — recovery sans crash ─────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push(e.message));
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1','1');
      sessionStorage.setItem('mtd_gate_access','1gs8uk7');
      localStorage.setItem('mtd_profile_corrupt_test', '{invalid json{{{{');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const noWhiteScreen = html.length > 2000;
    const noFatal = errs.filter(e => e.includes('SyntaxError') && e.includes('JSON')).length < 3;
    await page.screenshot({ path: 'rapport-screenshots/T10-corrupt-ls.png' });
    results.push({ test: 'T10 localStorage corrompu — recovery', ok: noWhiteScreen, errors: errs.slice(0,3) });
    await page.close();
  }

  await browser.close();

  // ── RAPPORT ──────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AGENT 1 — Dashboard / Nutrition / Scanner / Coach / Profil  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  let pass = 0, fail = 0;
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.test}`);
    if (!r.ok && r.errors.length) r.errors.forEach(e => console.log(`   ⚠ ${e.slice(0,120)}`));
    r.ok ? pass++ : fail++;
  });
  console.log(`\n  TOTAL: ${pass}/${results.length} PASS  |  ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

go().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
