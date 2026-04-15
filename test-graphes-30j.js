// Test E2E — GRAPHE SOMMEIL/ÉNERGIE 30J (Chart.js)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n) { console.log('  \u2713 ' + n); passed++; }
  function fail(n, d) { console.log('  \u2717 ' + n + '\n    ' + d); failed++; }
  function suite(n) { console.log('\n\u2550 ' + n + ' \u2550'); }

  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGE: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONS: ' + m.text()); });
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    return { page, ctx, errors };
  }

  async function mockLogin(page, uid) {
    await page.evaluate((u) => {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return { id: u, name: 'Test' }; };
      }
    }, uid || 'test-graph');
    await page.waitForTimeout(200);
  }

  // T1 : Helper exposé
  suite('T1 \u2014 window.getSleepEnergyTrend exposé');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      type: typeof window.getSleepEnergyTrend,
      empty: window.getSleepEnergyTrend(30)
    }));
    if (r.type !== 'function') fail('T1 exposed', 'type=' + r.type);
    else if (r.empty && r.empty.loggedDays > 0) fail('T1 empty', 'Loggedays=' + r.empty.loggedDays);
    else pass('T1 : helper exposé, empty state retourne structure propre');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : 15j seedés → structure correcte
  suite('T2 \u2014 Seed 15 jours : labels 30 + null pour jours manquants');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-15d');
    const r = await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 15; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 4, energy: 'haut' });
      }
      return window.getSleepEnergyTrend(30);
    });
    if (!r) fail('T2 null', 'Returned null');
    else if (r.labels.length !== 30) fail('T2 labels', 'len=' + r.labels.length);
    else if (r.sleep.length !== 30) fail('T2 sleep len', 'len=' + r.sleep.length);
    else if (r.loggedDays !== 15) fail('T2 loggedDays', 'loggedDays=' + r.loggedDays);
    else {
      const nullCount = r.sleep.filter(v => v === null).length;
      if (nullCount !== 15) fail('T2 nulls', 'Nulls=' + nullCount);
      else pass('T2 : 30 labels, 15 valeurs + 15 nulls (jours manquants)');
    }
    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // T3 : Score énergie numérisé
  suite('T3 \u2014 Energy score : bas=1 / moyen=2 / haut=3');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-energy');
    const r = await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const d0 = today.getFullYear() + '-' + pad(today.getMonth()+1) + '-' + pad(today.getDate());
      const d1 = new Date(today.getTime() - 86400000);
      const d1s = d1.getFullYear() + '-' + pad(d1.getMonth()+1) + '-' + pad(d1.getDate());
      const d2 = new Date(today.getTime() - 2*86400000);
      const d2s = d2.getFullYear() + '-' + pad(d2.getMonth()+1) + '-' + pad(d2.getDate());
      window.pushWellnessHistory({ date: d0, sleep: 4, energy: 'haut' });
      window.pushWellnessHistory({ date: d1s, sleep: 3, energy: 'moyen' });
      window.pushWellnessHistory({ date: d2s, sleep: 2, energy: 'bas' });
      const t = window.getSleepEnergyTrend(7);
      // 3 derniers jours = 3 dernières positions
      return { last3: t.energyScore.slice(-3), sleepLast3: t.sleep.slice(-3) };
    });
    // Ordre : J-2, J-1, J0 → bas(1), moyen(2), haut(3)
    if (JSON.stringify(r.last3) !== JSON.stringify([1, 2, 3])) fail('T3 energy', JSON.stringify(r));
    else if (JSON.stringify(r.sleepLast3) !== JSON.stringify([2, 3, 4])) fail('T3 sleep', JSON.stringify(r));
    else pass('T3 : energy[bas=1, moyen=2, haut=3] + sleep linéaire');
    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // T4 : Widget caché si < 3 jours loggés
  suite('T4 \u2014 Widget CACHÉ si <3 jours loggés');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-hidden');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      // Seed 2 jours seulement
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 2; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 4, energy: 'moyen' });
      }
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      return {
        hasTitle: txt.includes('SOMMEIL & \u00c9NERGIE (30 JOURS)'),
        canvasPresent: !!document.getElementById('today-wellness-trend-chart')
      };
    });
    if (r.hasTitle || r.canvasPresent) fail('T4 visible', 'Widget visible <3j : ' + JSON.stringify(r));
    else pass('T4 : widget correctement caché avec 2 jours loggés seulement');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : Widget rendu avec 5+ jours + Chart.js instancié
  suite('T5 \u2014 Widget VISIBLE avec ≥5 jours + Chart.js actif');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-visible');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 10; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 3 + (i % 3), energy: ['bas','moyen','haut'][i%3] });
      }
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      const canvas = document.getElementById('today-wellness-trend-chart');
      return {
        hasTitle: txt.includes('SOMMEIL & \u00c9NERGIE (30 JOURS)'),
        hasStats: txt.includes('SOMMEIL MOYEN') && txt.includes('\u00c9NERGIE MOYENNE') && txt.includes('JOURS LOGG\u00c9S'),
        canvasPresent: !!canvas,
        canvasWidth: canvas ? canvas.width : 0,
        chartInstances: (window._chartInstances || []).length
      };
    });
    if (!r.hasTitle) fail('T5 title', 'Titre absent');
    else if (!r.hasStats) fail('T5 stats', 'Stats absentes');
    else if (!r.canvasPresent) fail('T5 canvas', 'Canvas absent');
    else if (r.canvasWidth === 0) fail('T5 size', 'Canvas 0 width');
    else if (r.chartInstances === 0) fail('T5 chart', 'Chart pas instancié');
    else if (errors.length) fail('T5 errs', errors.join(' | '));
    else pass('T5 : widget rendu (titre + 3 stats + canvas ' + r.canvasWidth + 'px + chart instancié)');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : Isolation inter-users
  suite('T6 \u2014 Trend isolé par uid (pas de fuite)');
  try {
    const { page, ctx, errors } = await newPage();
    // User A
    await mockLogin(page, 'user-A-trend');
    await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 4 });
      }
    });
    // User B
    await mockLogin(page, 'user-B-trend');
    const r = await page.evaluate(() => {
      const t = window.getSleepEnergyTrend(30);
      return { loggedDays: t ? t.loggedDays : null };
    });
    if (r.loggedDays !== 0) fail('T6 isolation', 'User B voit ' + r.loggedDays + ' jours de user A');
    else pass('T6 : user B voit 0 jours loggés (pas de fuite user A)');
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Re-render ne duplique pas les charts
  suite('T7 \u2014 Re-render ne duplique pas les chart instances');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-rerender');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 10; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 4, energy: 'haut' });
      }
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      // Compter les instances du wellness trend chart par canvas id
      const countAfterFirst = (window._chartInstances || []).filter(c => c && c.canvas && c.canvas.id === 'today-wellness-trend-chart').length;
      // Re-render 3 fois
      for (let i = 0; i < 3; i++) if (window.render) window.render();
      return { countAfterFirst };
    });
    await page.waitForTimeout(1500);
    const finalCount = await page.evaluate(() => (window._chartInstances || []).filter(c => c && c.canvas && c.canvas.id === 'today-wellness-trend-chart').length);
    if (finalCount > 1) fail('T7 dup', 'Charts dupliqués : ' + finalCount);
    else pass('T7 : après 3 re-renders, exactement ' + finalCount + ' chart instance (pas de fuite)');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  // T8 : RGPD — trend inclus dans export
  suite('T8 \u2014 RGPD : wellness_history exporté (vague précédente)');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/app-main.js', 'utf8');
    if (src.indexOf("'mtd_wellness_history_'") === -1) fail('T8 export', 'wellness_history absent export');
    else pass('T8 : mtd_wellness_history_<uid> inclus dans l\'export RGPD (vague précédente)');
  } catch(e) { fail('T8', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 GRAPHES-30J : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
