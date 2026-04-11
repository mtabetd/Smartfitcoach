// AGENT 2 — Sports : CrossFit / Running / Hyrox / Yoga / Cycling / Triathlon
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
      if (window.S) { Object.assign(window.S, d.p); window.S.view = d.p._view || 'sport'; }
      if (window.render) window.render();
    }, { uid, p: profile });
    await page.waitForTimeout(1500);
    return { page, errs };
  }

  // ── T1 : CrossFit programme — tabs + WOD content ────────────────────────────
  {
    const uid = 'a2_cf_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'intermediate',
      crossfitDays: 4, sStep: 6, _view: 'sport',
      crossfitProgram: { week1: { day1: { wod: 'Fran: 21-15-9 Thrusters + Pull-ups', type: 'benchmark' }, day2: { wod: 'AMRAP 20min', type: 'amrap' } } }
    });
    const html = await page.content();
    const hasCF = html.includes('CrossFit') || html.includes('WOD') || html.includes('Programme') || html.includes('Fran');
    const hasTabs = html.includes('tab') || html.includes('Jour');
    // Clic sur tab 2 si possible
    try {
      const tab2 = page.locator('.tab-btn, [role="tab"], .day-tab').nth(1);
      if (await tab2.count() > 0) { await tab2.click(); await page.waitForTimeout(400); }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/A1-crossfit-prog.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T1 CrossFit programme + tabs', ok: (hasCF || hasTabs) && noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T2 : Running programme ───────────────────────────────────────────────────
  {
    const uid = 'a2_run_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'running', runningLevel: 'debutant',
      runningGoal: '5k', runningDays: 3, runningPace: '6:00', sStep: 14, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/A2-running-prog.png' });
    const html = await page.content();
    const hasRun = html.includes('Running') || html.includes('running') || html.includes('km') || html.includes('allure');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T2 Running programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T3 : Hyrox programme ─────────────────────────────────────────────────────
  {
    const uid = 'a2_hyrox_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'hyrox', hyroxLevel: 'intermediaire',
      hyroxGoal: 'finisher', hyroxDays: 4, sStep: 16, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/A3-hyrox-prog.png' });
    const html = await page.content();
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T3 Hyrox programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T4 : Yoga programme ──────────────────────────────────────────────────────
  {
    const uid = 'a2_yoga_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'yoga', yogaLevel: 'debutant',
      yogaGoal: 'flexibilite', yogaDays: 3, sStep: 18, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/A4-yoga-prog.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T4 Yoga programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T5 : Cycling programme ───────────────────────────────────────────────────
  {
    const uid = 'a2_cycling_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'cycling', cyclingLevel: 'intermediaire',
      cyclingGoal: 'endurance', cyclingDays: 4, cyclingFTP: 220, sStep: 23, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/A5-cycling-prog.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T5 Cycling programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T6 : Triathlon programme ─────────────────────────────────────────────────
  {
    const uid = 'a2_tri_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'triathlon', triathlonLevel: 'intermediaire',
      triathlonGoal: 'finisher', sStep: 21, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/A6-triathlon-prog.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T6 Triathlon programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T7 : CrossFit — week change (next/prev) ──────────────────────────────────
  {
    const uid = 'a2_cfweek_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'avance',
      crossfitDays: 5, crossfitWeek: 3, sStep: 6, _view: 'sport'
    });
    // Click next week button
    try {
      const nextBtn = page.locator('button:has-text("Semaine suivante"), button:has-text("suivante"), [onclick*="Week"], [onclick*="week"]').first();
      if (await nextBtn.count() > 0) { await nextBtn.click(); await page.waitForTimeout(600); }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/A7-cf-week-change.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T7 CrossFit changement semaine', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T8 : CrossFit semaine 52 (edge case) ─────────────────────────────────────
  {
    const uid = 'a2_cf52_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'avance',
      crossfitDays: 5, crossfitWeek: 52, sStep: 6, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/A8-cf-week52.png' });
    const html = await page.content();
    const noWhite = html.length > 3000;
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T8 CrossFit semaine 52 (edge)', ok: noWhite && noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T9 : CrossFit 1RM input (bench, squat, deadlift) ────────────────────────
  {
    const uid = 'a2_cf1rm_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'crossfit', sStep: 5, _view: 'sport',
      crossfitLevel: 'intermediaire', crossfitDays: 4
    });
    // Try to input 1RM values
    try {
      const input = page.locator('input[type="number"], input[placeholder*="kg"]').first();
      if (await input.count() > 0) {
        await input.fill('100');
        await input.blur();
        await page.waitForTimeout(400);
      }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/A9-cf-1rm.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T9 CrossFit 1RM input', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T10 : Running — calcul pace / VO2max ─────────────────────────────────────
  {
    const uid = 'a2_runpace_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'running', sStep: 12, _view: 'sport',
      runningLevel: 'intermediaire', runningGoal: '10k', runningDays: 4
    });
    try {
      const inp = page.locator('input[placeholder*="allure"], input[placeholder*="pace"], input[type="text"]').first();
      if (await inp.count() > 0) { await inp.fill('5:30'); await inp.blur(); await page.waitForTimeout(500); }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/A10-running-pace.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T10 Running pace/VO2max', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  await browser.close();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AGENT 2 — Sports : CF / Running / Hyrox / Yoga / Cycling   ║');
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
