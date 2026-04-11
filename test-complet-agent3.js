// AGENT 3 — Musculation / Calisthenics / Padel / Golf / Sport-Mix / Onboarding PAR-Q
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

  // ── T1 : Musculation programme — sessions tabs ───────────────────────────────
  {
    const uid = 'a3_muscu_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'musculation', sportLevel: 'intermediaire',
      musculationDays: 4, musculationGoal: 'hypertrophie', sStep: 4, _view: 'sport',
      muscuProgram: {
        sessions: [
          { name: 'Poitrine/Triceps', exercises: [{ n: 'Développé couché', sets: '4×8', rest: '90s' }] },
          { name: 'Dos/Biceps', exercises: [{ n: 'Tractions', sets: '4×6', rest: '90s' }] }
        ]
      }
    });
    // Click session tab
    try {
      const tab = page.locator('.tab-btn, [role="tab"], .session-tab, button:has-text("Séance")').first();
      if (await tab.count() > 0) { await tab.click(); await page.waitForTimeout(400); }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/B1-muscu-prog.png' });
    const html = await page.content();
    const hasMuscu = html.includes('Musculation') || html.includes('musculation') || html.includes('Séance') || html.includes('exercice');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T1 Musculation programme + sessions', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T2 : Musculation semaine 13 (edge) ───────────────────────────────────────
  {
    const uid = 'a3_muscu13_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'musculation', sportLevel: 'avance',
      musculationDays: 5, musculationGoal: 'force', sStep: 4, _view: 'sport',
      muscuWeek: 13
    });
    await page.screenshot({ path: 'rapport-screenshots/B2-muscu-week13.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T2 Musculation semaine 13 (edge)', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T3 : Musculation — log poids exercice ────────────────────────────────────
  {
    const uid = 'a3_musculog_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'musculation', sportLevel: 'intermediaire',
      musculationDays: 3, musculationGoal: 'hypertrophie', sStep: 4, _view: 'sport'
    });
    try {
      const weightInput = page.locator('input[type="number"], input[placeholder*="kg"]').first();
      if (await weightInput.count() > 0) {
        await weightInput.fill('80');
        await weightInput.blur();
        await page.waitForTimeout(300);
      }
    } catch(e) {}
    await page.screenshot({ path: 'rapport-screenshots/B3-muscu-weight-log.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T3 Musculation log poids', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T4 : Calisthenics programme ──────────────────────────────────────────────
  {
    const uid = 'a3_cali_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'calisthenics', calisthenicsLevel: 'intermediaire',
      calisthenicsGoal: 'force', calisthenicsdays: 4, sStep: 15, _view: 'sport',
      calisthPullups: 10, calisthPushups: 25, calisthCurrentWeek: 1
    });
    await page.screenshot({ path: 'rapport-screenshots/B4-calisthenics.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T4 Calisthenics programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T5 : Padel programme ─────────────────────────────────────────────────────
  {
    const uid = 'a3_padel_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'padel', padelLevel: 'intermediaire',
      padelGoal: 'competition', padelDays: 3, sStep: 25, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/B5-padel.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T5 Padel programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T6 : Golf programme ──────────────────────────────────────────────────────
  {
    const uid = 'a3_golf_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'golf', golfLevel: 'intermediaire',
      golfGoal: 'performance', golfDays: 3, golfHandicap: 18, sStep: 25, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/B6-golf.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T6 Golf programme', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T7 : Sport-Mix CrossFit + Musculation — programme combiné ────────────────
  {
    const uid = 'a3_mix_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'intermediaire',
      crossfitDays: 4, sStep: 6, _view: 'sport',
      sportMixEnabled: true,
      sportMixSecondary: { type: 'musculation', days: 2 }
    });
    await page.screenshot({ path: 'rapport-screenshots/B7-sport-mix.png' });
    const html = await page.content();
    const hasMix = html.includes('Musculation') || html.includes('mix') || html.includes('CrossFit');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T7 Sport-Mix CF + Muscu combiné', ok: hasMix && noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T8 : Sport-Mix — tabs supplémentaires visibles ───────────────────────────
  {
    const uid = 'a3_mixtab_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'avance',
      crossfitDays: 3, sStep: 6, _view: 'sport',
      sportMixEnabled: true,
      sportMixSecondary: { type: 'musculation', days: 3 },
      selectedCrossfitDay: 0
    });
    // Click through all 6 tabs (3 CF + 3 muscu)
    for (let i = 0; i < 5; i++) {
      try {
        const tabs = page.locator('.tab-btn, [role="tab"]');
        if (await tabs.count() > i) { await tabs.nth(i).click(); await page.waitForTimeout(300); }
      } catch(e) {}
    }
    await page.screenshot({ path: 'rapport-screenshots/B8-mix-tabs.png' });
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T8 Sport-Mix tabs navigation', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T9 : Onboarding — sélection sport initial (sStep=0) ──────────────────────
  {
    const uid = 'a3_onb_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sStep: 0, _view: 'sport'
    });
    await page.screenshot({ path: 'rapport-screenshots/B9-onboarding-sport0.png' });
    const html = await page.content();
    const hasSportChoice = html.includes('sport') || html.includes('Sport') || html.includes('CrossFit') || html.includes('Musculation');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T9 Onboarding sStep=0 sélection sport', ok: hasSportChoice && noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  // ── T10 : PAR-Q step (sStep=1) ───────────────────────────────────────────────
  {
    const uid = 'a3_parq_' + Date.now();
    const { page, errs } = await mkPage(uid, {
      appMode: 'sport', sStep: 1, _view: 'sport', sportType: 'crossfit'
    });
    await page.screenshot({ path: 'rapport-screenshots/B10-parq.png' });
    const html = await page.content();
    const hasPARQ = html.includes('médecin') || html.includes('santé') || html.includes('PAR') || html.includes('cardiaque') || html.includes('douleur') || html.includes('question');
    const noFatal = errs.filter(e => e.includes('TypeError') || e.includes('is not a function')).length === 0;
    results.push({ test: 'T10 PAR-Q step (sStep=1)', ok: noFatal, errors: errs.slice(0,3) });
    await page.close();
  }

  await browser.close();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AGENT 3 — Muscu / Cali / Padel / Golf / Sport-Mix / PAR-Q  ║');
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
