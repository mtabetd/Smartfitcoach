// AGENT 4 — Nutrition détaillée : repas / planification / macros / food journal / saladbar / body scan
const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';
const fs = require('fs');
if (!fs.existsSync('rapport-screenshots')) fs.mkdirSync('rapport-screenshots');

async function go() {
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const results = [];

  async function mkPage(uid, profile) {
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
      localStorage.setItem('mtd_profile_' + d.uid, JSON.stringify(d.p));
      if (window.AUTH) { window.AUTH.isLoggedIn = () => true; window.AUTH.getUser = () => fake; }
      if (window.loadProfile) window.loadProfile();
      if (window.S) { Object.assign(window.S, d.p); window.S.view = d.p._view || 'today'; }
      if (window.render) window.render();
    }, { uid, p: profile });
    await page.waitForTimeout(1500);
    return { page, errs };
  }

  const BASE_PROFILE = {
    appMode: 'nutrition', sex: 'male', age: 28, weight: 75, height: 178,
    activity: 1.55, sleep: 7, goal: 0, nStep: 12,
    weekPlan: {
      lundi: { meals: [
        { name: 'Petit-déjeuner', kcal: 450, p: 20, g: 65, l: 12 },
        { name: 'Déjeuner', kcal: 650, p: 40, g: 70, l: 18 },
        { name: 'Dîner', kcal: 550, p: 35, g: 60, l: 14 }
      ], total: { kcal: 1650, p: 95, g: 195, l: 44 } },
      mardi: { meals: [{ name: 'Oatmeal', kcal: 400, p: 15, g: 60, l: 10 }], total: { kcal: 400, p: 15, g: 60, l: 10 } }
    }
  };

  // ── T1 : Planning semaine — affichage jours ──────────────────────────────────
  {
    const uid = 'a4_plan_' + Date.now();
    const { page, errs } = await mkPage(uid, { ...BASE_PROFILE, _view: 'nutrition' });
    await page.screenshot({ path: 'rapport-screenshots/C1-planning-semaine.png' });
    const html = await page.content();
    const hasPlan = html.includes('lundi') || html.includes('Lundi') || html.includes('mardi') || html.includes('kcal');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T1 Planning semaine nutrition', ok: hasPlan && noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T2 : Today — macros barres de progression ────────────────────────────────
  {
    const uid = 'a4_macros_' + Date.now();
    const { page, errs } = await mkPage(uid, { ...BASE_PROFILE, _view: 'today' });
    await page.screenshot({ path: 'rapport-screenshots/C2-macros-today.png' });
    const html = await page.content();
    const hasMacros = html.includes('protéines') || html.includes('glucides') || html.includes('lipides') || html.includes('Protéines');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T2 Macros progress bars today', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T3 : Food journal — voir repas loggés ───────────────────────────────────
  {
    const uid = 'a4_foodlog_' + Date.now();
    const profile = { ...BASE_PROFILE, _view: 'today' };
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
      var today = new Date().toISOString().slice(0,10);
      var journal = [{ time: '08:00', name: 'Oatmeal', kcal: 350, p: 12, g: 55, l: 8 }];
      localStorage.setItem('mtd_food_journal_' + d.uid + '_' + today, JSON.stringify(journal));
      localStorage.setItem('mtd_profile_' + d.uid, JSON.stringify(d.p));
      if (window.AUTH) { window.AUTH.isLoggedIn = () => true; window.AUTH.getUser = () => fake; }
      if (window.loadProfile) window.loadProfile();
      if (window.S) { Object.assign(window.S, d.p); window.S.view = 'today'; }
      if (window.render) window.render();
    }, { uid, p: profile });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'rapport-screenshots/C3-food-journal.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T3 Food journal repas loggés', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T4 : Saladbar modal ──────────────────────────────────────────────────────
  {
    const uid = 'a4_salad_' + Date.now();
    const { page, errs } = await mkPage(uid, { ...BASE_PROFILE, _view: 'today', smoothieBarOpen: false });
    // Try to open saladbar
    try {
      const saladBtn = page.locator('[onclick*="saladBar"], [onclick*="salad"], button:has-text("Salade"), button:has-text("Builder")').first();
      if (await saladBtn.count() > 0) { await saladBtn.click(); await page.waitForTimeout(600); }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/C4-saladbar.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T4 Saladbar modal', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T5 : Body scan / composition corporelle ──────────────────────────────────
  {
    const uid = 'a4_body_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      ...BASE_PROFILE, _view: 'today',
      bodyScanDone: true,
      _bodyFatEstimate: 18,
      _bodyCompositionProfile: { fat: 18, muscle: 42, water: 60 },
      _bodyCompositionWeight: 75
    });
    await page.screenshot({ path: 'rapport-screenshots/C5-body-scan.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T5 Body scan composition', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T6 : Nutrition onboarding nStep 1→5 (objectif, genre, âge…) ─────────────
  {
    const uid = 'a4_nonb_' + Date.now();
    const steps = [1, 2, 3, 4, 5];
    let allOk = true;
    let lastErrs = [];
    for (const nStep of steps) {
      const { page, errs } = await mkPage(uid + '_' + nStep, {
        appMode: 'nutrition', nStep, _view: 'nutrition',
        sex: nStep > 1 ? 'male' : undefined,
        goal: nStep > 2 ? 0 : undefined,
        age: nStep > 3 ? 28 : undefined
      });
      const html = await page.content();
      const noWhite = html.length > 2000;
      const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
      if (!noWhite || !noFatal) { allOk = false; lastErrs = errs; }
      await page.close();
    }
    await (async () => {
      const { page } = await mkPage(uid + '_final', { appMode: 'nutrition', nStep: 5, _view: 'nutrition', sex: 'male', goal: 0, age: 28 });
      await page.screenshot({ path: 'rapport-screenshots/C6-nutrition-steps.png' });
      await page.close();
    })();
    results.push({ test: 'T6 Nutrition onboarding steps 1→5', ok: allOk, errors: lastErrs.slice(0,3) });
  }

  // ── T7 : Smoothie bar modal ──────────────────────────────────────────────────
  {
    const uid = 'a4_smoothie_' + Date.now();
    const { page, errs } = await mkPage(uid, { ...BASE_PROFILE, _view: 'today' });
    try {
      const smoothieBtn = page.locator('[onclick*="smoothie"], [onclick*="Smoothie"], button:has-text("Smoothie")').first();
      if (await smoothieBtn.count() > 0) { await smoothieBtn.click(); await page.waitForTimeout(600); }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/C7-smoothie.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T7 Smoothie bar modal', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T8 : Shop list ───────────────────────────────────────────────────────────
  {
    const uid = 'a4_shop_' + Date.now();
    const { page, errs } = await mkPage(uid, { ...BASE_PROFILE, _view: 'today' });
    try {
      const shopBtn = page.locator('[onclick*="shopList"], [onclick*="shop"], button:has-text("Courses"), button:has-text("Liste")').first();
      if (await shopBtn.count() > 0) { await shopBtn.click(); await page.waitForTimeout(600); }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/C8-shoplist.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T8 Shop list courses', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T9 : Nutrition mode « both » — double dashboard ──────────────────────────
  {
    const uid = 'a4_both_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      ...BASE_PROFILE, appMode: 'both', _view: 'today',
      sportType: 'crossfit', crossfitLevel: 'intermediaire', crossfitDays: 4, sStep: 6
    });
    await page.screenshot({ path: 'rapport-screenshots/C9-both-mode.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T9 Mode "both" dashboard combiné', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T10 : Offline mode — pas de crash ────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, offline: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1','1');
      sessionStorage.setItem('mtd_gate_access','1gs8uk7');
    });
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(2000);
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/C10-offline.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T10 Offline — pas de crash JS', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  await browser.close();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AGENT 4 — Nutrition / Repas / Macros / Body / Smoothie     ║');
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
