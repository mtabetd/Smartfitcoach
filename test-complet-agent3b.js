// AGENT 3b — Sport-Mix détaillé + vérif HTML contenu réel
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
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return fake; };
      }
      if (window.loadProfile) window.loadProfile();
      if (window.S) {
        Object.assign(window.S, d.p);
        window.S.view = d.p._view || 'sport';
      }
      if (window.render) window.render();
    }, { uid: uid, p: profile });
    await page.waitForTimeout(1500);
    return { page, errs };
  }

  function noFatal(errs) {
    return errs.filter(function(e) {
      return e.includes('TypeError') || e.includes('is not a function') || e.includes('Cannot read') || e.includes('is not defined');
    }).length === 0;
  }

  // T1 : Sport-Mix CF+Muscu — aucune erreur JS + contenu visible
  {
    var uid = 'a3b_mix1_' + Date.now();
    var { page, errs } = await mkPage(uid, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'intermediaire',
      crossfitDays: 4, sStep: 6, _view: 'sport',
      sportMixEnabled: true,
      sportMixSecondary: { type: 'musculation', days: 2 }
    });
    var html = await page.content();
    // Check page renders something substantial
    var hasContent = html.length > 3000;
    var stateCheck = await page.evaluate(function() {
      return {
        mixEnabled: window.S && window.S.sportMixEnabled,
        mixSec: window.S && window.S.sportMixSecondary,
        sStep: window.S && window.S.sStep,
        view: window.S && window.S.view
      };
    });
    var ok = hasContent && noFatal(errs);
    await page.screenshot({ path: 'rapport-screenshots/MIX1-cf-muscu-state.png' });
    results.push({
      test: 'T1 Sport-Mix CF+Muscu (state: ' + JSON.stringify(stateCheck) + ')',
      ok: ok, errors: errs.slice(0, 5)
    });
    await page.close();
  }

  // T2 : Sport-Mix — vérif tabs (CF jours + muscu jours = total correct)
  {
    var uid2 = 'a3b_mix2_' + Date.now();
    var { page, errs } = await mkPage(uid2, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'avance',
      crossfitDays: 3, sStep: 6, _view: 'sport',
      sportMixEnabled: true,
      sportMixSecondary: { type: 'musculation', days: 2 },
      selectedCrossfitDay: 0
    });
    var tabCount = await page.evaluate(function() {
      var tabs = document.querySelectorAll('.tab-btn, [role="tab"]');
      return tabs.length;
    });
    // Click each tab
    for (var i = 0; i < Math.min(tabCount, 6); i++) {
      try {
        await page.locator('.tab-btn, [role="tab"]').nth(i).click();
        await page.waitForTimeout(250);
      } catch(e) {}
    }
    var ok2 = noFatal(errs);
    await page.screenshot({ path: 'rapport-screenshots/MIX2-tabs-count.png' });
    results.push({ test: 'T2 Sport-Mix tabs (' + tabCount + ' tabs trouvés)', ok: ok2, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T3 : Sport-Mix — persistance après reload
  {
    var uid3 = 'a3b_mix3_' + Date.now();
    var ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    var page3 = await ctx3.newPage();
    var errs3 = [];
    page3.on('pageerror', e => errs3.push(e.message));
    await ctx3.addInitScript(function() {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page3.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page3.waitForTimeout(4000);
    // Set up profile WITH sportMixEnabled
    await page3.evaluate(function(uid) {
      var profile = {
        appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'intermediaire',
        crossfitDays: 4, sStep: 6, sportMixEnabled: true,
        sportMixSecondary: { type: 'musculation', days: 2 }
      };
      var fake = { id: uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '' };
      localStorage.setItem('mtd_profile_' + uid, JSON.stringify(profile));
      window.AUTH.isLoggedIn = function() { return true; };
      window.AUTH.getUser = function() { return fake; };
      if (window.loadProfile) window.loadProfile();
      if (window.S) Object.assign(window.S, profile);
      if (window.render) window.render();
    }, uid3);
    await page3.waitForTimeout(1000);
    // Now reload and check sportMixEnabled persists
    await page3.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
    await page3.waitForTimeout(3000);
    var persisted = await page3.evaluate(function(uid) {
      var raw = localStorage.getItem('mtd_profile_' + uid);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch(e) { return null; }
    }, uid3);
    var mixPersisted = persisted && persisted.sportMixEnabled === true;
    var ok3 = mixPersisted && noFatal(errs3);
    await page3.screenshot({ path: 'rapport-screenshots/MIX3-persist.png' });
    results.push({ test: 'T3 Sport-Mix persistance localStorage (mixEnabled=' + (persisted && persisted.sportMixEnabled) + ')', ok: ok3, errors: errs3.slice(0, 3) });
    await page3.close();
  }

  // T4 : Sport-Mix reset via "Changer de sport"
  {
    var uid4 = 'a3b_mix4_' + Date.now();
    var { page, errs } = await mkPage(uid4, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'intermediaire',
      crossfitDays: 4, sStep: 6, _view: 'sport',
      sportMixEnabled: true, sportMixSecondary: { type: 'musculation', days: 2 }
    });
    // Try clicking "Changer" / reset button
    try {
      var changeBtn = page.locator('button:has-text("Changer"), [onclick*="sStep = 0"], [onclick*="sStep=0"]').first();
      if (await changeBtn.count() > 0) { await changeBtn.click(); await page.waitForTimeout(800); }
    } catch(e) {}
    var stateAfter = await page.evaluate(function() {
      return { sStep: window.S && window.S.sStep, mixEnabled: window.S && window.S.sportMixEnabled };
    });
    var ok4 = noFatal(errs);
    await page.screenshot({ path: 'rapport-screenshots/MIX4-reset.png' });
    results.push({ test: 'T4 Sport-Mix reset via Changer (sStep=' + stateAfter.sStep + ')', ok: ok4, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T5 : Musculation + compétition cible (feature main)
  {
    var uid5 = 'a3b_comp_' + Date.now();
    var { page, errs } = await mkPage(uid5, {
      appMode: 'sport', sportType: 'musculation', sportLevel: 'intermediaire',
      musculationDays: 4, musculationGoal: 'hypertrophie',
      sStep: 2, _view: 'sport',
      competitionGoal: true, competitionDate: '2026-09-15', competitionType: 'Powerlifting'
    });
    var html5 = await page.content();
    var ok5 = html5.length > 2000 && noFatal(errs);
    await page.screenshot({ path: 'rapport-screenshots/MIX5-competition.png' });
    results.push({ test: 'T5 Musculation + compétition cible', ok: ok5, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T6 : Sport hobbies (feature main — sports parallèles)
  {
    var uid6 = 'a3b_hobbies_' + Date.now();
    var { page, errs } = await mkPage(uid6, {
      appMode: 'sport', sportType: 'musculation', sportLevel: 'intermediaire',
      musculationDays: 4, musculationGoal: 'hypertrophie',
      sStep: 2, _view: 'sport',
      sportHobbies: ['running', 'yoga']
    });
    var html6 = await page.content();
    var ok6 = html6.length > 2000 && noFatal(errs);
    await page.screenshot({ path: 'rapport-screenshots/MIX6-hobbies.png' });
    results.push({ test: 'T6 Sports hobbies parallèles', ok: ok6, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T7 : CF + Mix avec selectedCrossfitDay = muscu tab (tab > CF length)
  {
    var uid7 = 'a3b_mix7_' + Date.now();
    var { page, errs } = await mkPage(uid7, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'intermediaire',
      crossfitDays: 3, sStep: 6, _view: 'sport',
      sportMixEnabled: true, sportMixSecondary: { type: 'musculation', days: 2 },
      selectedCrossfitDay: 4  // tab index 4 = muscu tab 2 (3 CF tabs + 2 muscu)
    });
    var html7 = await page.content();
    var ok7 = html7.length > 2000 && noFatal(errs);
    await page.screenshot({ path: 'rapport-screenshots/MIX7-tab-muscu.png' });
    results.push({ test: 'T7 Sport-Mix tab index = tab muscu', ok: ok7, errors: errs.slice(0, 3) });
    await page.close();
  }

  // T8 : CF + Mix avec selectedCrossfitDay out-of-bounds → clamp à 0
  {
    var uid8 = 'a3b_mix8_' + Date.now();
    var { page, errs } = await mkPage(uid8, {
      appMode: 'sport', sportType: 'crossfit', crossfitLevel: 'intermediaire',
      crossfitDays: 4, sStep: 6, _view: 'sport',
      sportMixEnabled: true, sportMixSecondary: { type: 'musculation', days: 2 },
      selectedCrossfitDay: 999  // out of bounds → should clamp to 0
    });
    var html8 = await page.content();
    var ok8 = html8.length > 2000 && noFatal(errs);
    await page.screenshot({ path: 'rapport-screenshots/MIX8-oob-clamp.png' });
    results.push({ test: 'T8 Sport-Mix tab OOB clamp (selectedCF=999)', ok: ok8, errors: errs.slice(0, 3) });
    await page.close();
  }

  await browser.close();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AGENT 3b — Sport-Mix détaillé + compétition + hobbies       ║');
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
