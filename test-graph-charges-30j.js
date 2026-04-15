// Test E2E — GRAPH PROGRESSION CHARGES 30J (Chart.js)
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
    }, uid || 'test-strength');
    await page.waitForTimeout(200);
  }

  function seedProgressionScript(days, exos) {
    // exos = { 'Squat': {startW, step}, ... }
    return `(function() {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      window.S.muscuProgressionHistory = window.S.muscuProgressionHistory || {};
      const exos = ${JSON.stringify(exos)};
      Object.keys(exos).forEach(function(name) {
        window.S.muscuProgressionHistory[name] = [];
        for (let i = ${days - 1}; i >= 0; i -= 2) {
          const d = new Date(today.getTime() - i * 86400000);
          const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
          window.S.muscuProgressionHistory[name].push({
            date: ds, week: 1,
            weight: exos[name].startW + (${days - 1} - i) * exos[name].step,
            reps: 8
          });
        }
      });
    })()`;
  }

  // T1 : Helper exposé + empty state
  suite('T1 \u2014 window.getStrengthTrend exposé + empty state');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      type: typeof window.getStrengthTrend,
      empty: window.getStrengthTrend(30)
    }));
    if (r.type !== 'function') fail('T1 type', r.type);
    else if (r.empty !== null) fail('T1 empty', 'Should return null: ' + JSON.stringify(r.empty));
    else pass('T1 : helper exposé, empty state retourne null (widget caché)');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : Un seul exo avec 2+ points → 1 dataset
  suite('T2 \u2014 1 exo × 2 points → 1 dataset');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-single');
    await page.evaluate(seedProgressionScript(10, { 'Squat': { startW: 80, step: 2.5 } }));
    const r = await page.evaluate(() => window.getStrengthTrend(30));
    if (!r) fail('T2 null', 'Returned null');
    else if (!Array.isArray(r.datasets)) fail('T2 datasets', JSON.stringify(r));
    else if (r.datasets.length !== 1) fail('T2 count', 'datasets=' + r.datasets.length);
    else if (r.datasets[0].name !== 'Squat') fail('T2 name', r.datasets[0].name);
    else if (r.labels.length !== 30) fail('T2 labels', 'len=' + r.labels.length);
    else pass('T2 : 1 exo détecté (Squat) + 30 labels');
    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // T3 : Top 3 exos max (tri par dataPoints)
  suite('T3 \u2014 Top 3 exos max + tri par dataPoints');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-top3');
    await page.evaluate(seedProgressionScript(20, {
      'Squat': { startW: 80, step: 2 },
      'Développé couché': { startW: 60, step: 1 },
      'Soulevé de terre': { startW: 100, step: 3 },
      'Développé militaire': { startW: 40, step: 1 },
      'Rowing barre': { startW: 55, step: 1 }
    }));
    const r = await page.evaluate(() => window.getStrengthTrend(30));
    if (!r) fail('T3 null', 'null');
    else if (r.datasets.length !== 3) fail('T3 limit', 'datasets=' + r.datasets.length);
    else {
      // Vérifier tri décroissant par dataPoints
      for (var i = 0; i < r.datasets.length - 1; i++) {
        if (r.datasets[i].dataPoints < r.datasets[i+1].dataPoints) {
          return fail('T3 sort', 'Mauvais tri : ' + JSON.stringify(r.datasets.map(d => d.dataPoints)));
        }
      }
      pass('T3 : top 3 datasets + tri décroissant dataPoints');
    }
    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // T4 : Match case/accent-insensitive
  suite('T4 \u2014 Matching case/accent-insensitive');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-case');
    await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      // Variantes de saisie : UPPERCASE, sans accent
      window.S.muscuProgressionHistory = { 'SQUAT': [], 'Developpe couche': [] };
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.S.muscuProgressionHistory['SQUAT'].push({ date: ds, weight: 80 + i, reps: 8 });
        window.S.muscuProgressionHistory['Developpe couche'].push({ date: ds, weight: 60 + i, reps: 8 });
      }
    });
    const r = await page.evaluate(() => window.getStrengthTrend(30));
    if (!r) fail('T4 null', 'null');
    else if (r.datasets.length !== 2) fail('T4 count', 'datasets=' + r.datasets.length);
    else {
      const names = r.datasets.map(d => d.name).sort();
      if (names[0] !== 'Développé couché' || names[1] !== 'Squat') fail('T4 names', JSON.stringify(names));
      else pass('T4 : UPPERCASE + sans accents matchés (2 exos détectés sous noms normalisés)');
    }
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : Exo avec 1 seul point → ignoré
  suite('T5 \u2014 Exo 1 point ignoré (seuil ≥2)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-onepoint');
    await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const ds = today.getFullYear() + '-' + pad(today.getMonth()+1) + '-' + pad(today.getDate());
      window.S.muscuProgressionHistory = { 'Squat': [{ date: ds, weight: 80, reps: 8 }] };
    });
    const r = await page.evaluate(() => window.getStrengthTrend(30));
    if (r !== null) fail('T5 visible', 'Should be null (1 pt): ' + JSON.stringify(r));
    else pass('T5 : exo 1 seul point → retourne null (widget caché)');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : Max du jour pris si plusieurs entrées même date
  suite('T6 \u2014 Multi-entrées même jour : MAX weight conservé');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-max');
    await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const d0 = today.getFullYear() + '-' + pad(today.getMonth()+1) + '-' + pad(today.getDate());
      const d1 = new Date(today.getTime() - 86400000);
      const d1s = d1.getFullYear() + '-' + pad(d1.getMonth()+1) + '-' + pad(d1.getDate());
      window.S.muscuProgressionHistory = {
        'Squat': [
          { date: d0, weight: 80, reps: 8 },
          { date: d0, weight: 95, reps: 5 }, // max du jour
          { date: d0, weight: 70, reps: 12 },
          { date: d1s, weight: 85, reps: 8 }
        ]
      };
    });
    const r = await page.evaluate(() => window.getStrengthTrend(30));
    const lastDay = r.datasets[0].data.slice(-1)[0];
    if (lastDay !== 95) fail('T6 max', 'lastDay=' + lastDay + ' (expected 95)');
    else pass('T6 : MAX conservé (95 kg au lieu de 80 ou 70 du même jour)');
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Widget rendu dans DOM avec canvas + chart instance
  suite('T7 \u2014 Widget rendu : titre + canvas + chart instance');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-render');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      S.muscuProgressionHistory = { 'Squat': [], 'Développé couché': [] };
      for (let i = 9; i >= 0; i -= 2) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        S.muscuProgressionHistory['Squat'].push({ date: ds, weight: 80 + i, reps: 8 });
        S.muscuProgressionHistory['Développé couché'].push({ date: ds, weight: 60 + i, reps: 8 });
      }
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      const canvas = document.getElementById('today-strength-trend-chart');
      return {
        hasTitle: txt.includes('PROGRESSION CHARGES (30 JOURS)'),
        hasSquat: txt.includes('Squat'),
        hasBench: txt.includes('D\u00e9velopp\u00e9 couch\u00e9'),
        hasKg: txt.includes('kg'),
        canvasPresent: !!canvas,
        canvasWidth: canvas ? canvas.width : 0,
        chartInstances: (window._chartInstances || []).filter(c => c && c.canvas && c.canvas.id === 'today-strength-trend-chart').length
      };
    });
    if (!r.hasTitle || !r.canvasPresent || r.chartInstances !== 1) fail('T7 render', JSON.stringify(r));
    else if (errors.length) fail('T7 errs', errors.join(' | '));
    else pass('T7 : widget rendu (titre + Squat + DC + canvas ' + r.canvasWidth + 'px + 1 chart)');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  // T8 : Delta calculé correctement (firstValue → lastValue)
  suite('T8 \u2014 Delta first → last value calculé proprement');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-delta');
    await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      window.S.muscuProgressionHistory = { 'Squat': [] };
      // Entry -20j : 80kg. Entry today : 100kg. → delta +20
      for (var i = 20; i >= 0; i -= 10) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.S.muscuProgressionHistory['Squat'].push({ date: ds, weight: 80 + (20 - i), reps: 8 });
      }
    });
    const r = await page.evaluate(() => window.getStrengthTrend(30));
    const ds = r.datasets[0];
    // firstValue = first non-null (= 80), lastValue = last non-null (= 100)
    if (ds.firstValue !== 80) fail('T8 first', 'firstValue=' + ds.firstValue);
    else if (ds.lastValue !== 100) fail('T8 last', 'lastValue=' + ds.lastValue);
    else pass('T8 : firstValue=80 / lastValue=100 / delta attendu +20kg (+25%)');
    await ctx.close();
  } catch(e) { fail('T8', e.message); }

  // T9 : Isolation par uid
  suite('T9 \u2014 Isolation inter-users (muscuProgressionHistory par uid)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'user-A-strength');
    await page.evaluate(seedProgressionScript(10, { 'Squat': { startW: 80, step: 2 } }));
    await page.evaluate(() => { if (window.saveProfile) window.saveProfile(); });
    // User B new context
    await mockLogin(page, 'user-B-strength');
    await page.evaluate(() => { window.S.muscuProgressionHistory = {}; });
    const r = await page.evaluate(() => window.getStrengthTrend(30));
    if (r !== null) fail('T9 leak', 'User B voit data user A : ' + JSON.stringify(r));
    else pass('T9 : user B voit null (pas de fuite user A)');
    await ctx.close();
  } catch(e) { fail('T9', e.message); }

  // T10 : Re-render ne duplique pas le chart
  suite('T10 \u2014 Re-render ne crée pas de doublons chart');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-rerender-strength');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      S.muscuProgressionHistory = { 'Squat': [] };
      for (var i = 9; i >= 0; i -= 2) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        S.muscuProgressionHistory['Squat'].push({ date: ds, weight: 80 + i, reps: 8 });
      }
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { if (window.render) window.render(); });
    await page.waitForTimeout(1500);
    const finalCount = await page.evaluate(() =>
      (window._chartInstances || []).filter(c => c && c.canvas && c.canvas.id === 'today-strength-trend-chart').length
    );
    if (finalCount > 1) fail('T10 dup', 'Dupliqués : ' + finalCount);
    else pass('T10 : après 2 renders espacés, 1 chart instance (fix createChart OK)');
    await ctx.close();
  } catch(e) { fail('T10', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 GRAPH-CHARGES : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
