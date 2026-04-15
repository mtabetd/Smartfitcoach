// Test E2E — INSIGHTS DASHBOARD (patterns + widget + coach context)
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
    }, uid || 'test-insights');
    await page.waitForTimeout(200);
  }

  // T1 : 3 helpers exposés
  suite('T1 \u2014 Helpers window : getWellnessAvg, detectWeekPatterns, getWeekInsights');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      h1: typeof window.getWellnessAvg,
      h2: typeof window.detectWeekPatterns,
      h3: typeof window.getWeekInsights
    }));
    if (r.h1 !== 'function' || r.h2 !== 'function' || r.h3 !== 'function') {
      fail('T1 exposed', JSON.stringify(r));
    } else if (errors.length) fail('T1 errs', errors.join(' | '));
    else pass('T1 : 3 helpers exposés sur window');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : Empty state — pas de data → patterns vides, insights vides
  suite('T2 \u2014 Empty state : pas de pattern hors contexte');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => {
      // Reset
      window.S.sessionHistory = {};
      window.S.sessionFeedback = {};
      localStorage.removeItem('mtd_wellness_history_test-insights');
      return {
        patterns: window.detectWeekPatterns(),
        insights: window.getWeekInsights()
      };
    });
    if (!Array.isArray(r.patterns) || r.patterns.length !== 0) fail('T2 patterns', 'Patterns non vides : ' + JSON.stringify(r.patterns));
    else if (!r.insights || !Array.isArray(r.insights.patterns)) fail('T2 insights', JSON.stringify(r.insights));
    else pass('T2 : empty state OK (0 pattern, insights{patterns:[]})');
    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // T3 : Pattern sleep_low_avg détecté
  suite('T3 \u2014 Pattern sleep_low_avg : sleepAvg<3 + ≥3j loggés');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-sleep-low');
    const r = await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 2 });
      }
      return window.detectWeekPatterns();
    });
    const p = r.find(x => x.id === 'sleep_low_avg');
    if (!p) fail('T3 miss', 'Pattern sleep_low_avg absent');
    else if (p.severity !== 'warning') fail('T3 severity', p.severity);
    else if (!p.label.includes('2') || !p.label.includes('5j')) fail('T3 label', p.label);
    else pass('T3 : sleep_low_avg (warning) détecté avec bon label');
    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // T4 : Pattern pain_recurrent
  suite('T4 \u2014 Pattern pain_recurrent : douleurs ≥2j/7');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-pain');
    const r = await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 3; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 4, muscles: 'douleurs' });
      }
      return window.detectWeekPatterns();
    });
    const p = r.find(x => x.id === 'pain_recurrent');
    if (!p) fail('T4 miss', 'Pattern absent');
    else if (p.severity !== 'alert') fail('T4 severity', p.severity);
    else pass('T4 : pain_recurrent (alert) détecté');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : Pattern sleep_excellent (encouragement)
  suite('T5 \u2014 Pattern sleep_excellent : sleepAvg>=4 + ≥5j');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-sleep-ok');
    const r = await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 4, muscles: 'frais' });
      }
      return window.detectWeekPatterns();
    });
    const p = r.find(x => x.id === 'sleep_excellent');
    if (!p) fail('T5 miss', JSON.stringify(r));
    else if (p.severity !== 'info') fail('T5 sev', p.severity);
    else pass('T5 : sleep_excellent (info) détecté');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : Pattern undertraining (0 séance avec programme)
  suite('T6 \u2014 Pattern undertraining : 0 séance + sportProgram actif');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-undertrain');
    const r = await page.evaluate(() => {
      window.S.sessionHistory = {};
      window.S.sportType = 'muscu';
      window.S.sportProgram = [{ day: 'Jour 1', exos: [] }];
      return window.detectWeekPatterns();
    });
    const p = r.find(x => x.id === 'undertraining');
    if (!p) fail('T6 miss', JSON.stringify(r));
    else if (p.severity !== 'info') fail('T6 sev', p.severity);
    else pass('T6 : undertraining (info) détecté');
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Widget Bilan 7 jours rendu dans dashboard
  suite('T7 \u2014 Widget "Bilan 7 jours" rendu dans le DOM (extended open)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-widget');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'Jamal'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.sportType = 'muscu'; S.appMode = 'both';
      S._dashExtOpen = true;
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      S.sessionHistory = {};
      for (let i = 0; i < 3; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        S.sessionHistory[i + '_' + ds] = { duration: 45, kcalTotal: 300, date: ds + 'T10:00:00Z' };
      }
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 2, muscles: 'courbatures', energy: 'moyen' });
      }
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      return {
        hasTitle: txt.includes('BILAN 7 JOURS'),
        hasSeances: txt.includes('S\u00c9ANCES'),
        hasKcal: txt.includes('KCAL D\u00c9PENS\u00c9ES'),
        hasSommeil: txt.includes('SOMMEIL MOYEN'),
        hasRpe: txt.includes('RPE MOYEN'),
        hasPattern: txt.toLowerCase().includes('sommeil moyen bas')
      };
    });
    const good = r.hasTitle && r.hasSeances && r.hasKcal && r.hasSommeil && r.hasRpe && r.hasPattern;
    if (!good) fail('T7 render', JSON.stringify(r));
    else if (errors.length) fail('T7 errs', errors.join(' | '));
    else pass('T7 : widget rendu avec titre + 4 stats + pattern sleep_low détecté');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  // T8 : Widget invisible si pas de data
  suite('T8 \u2014 Widget caché si pas de data (graceful)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-widget-empty');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'Vide'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      S.sessionHistory = {};
      S.sessionFeedback = {};
      localStorage.removeItem('mtd_wellness_history_test-widget-empty');
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      return { hasTitle: txt.includes('BILAN 7 JOURS') };
    });
    if (r.hasTitle) fail('T8 visible', 'Widget visible alors qu\'il ne devrait pas');
    else pass('T8 : widget caché (empty state, pas de titre BILAN 7 JOURS)');
    await ctx.close();
  } catch(e) { fail('T8', e.message); }

  // T9 : buildContext passe weekInsights au backend
  suite('T9 \u2014 Coach IA buildContext : weekInsights dans le payload');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-context');
    const r = await page.evaluate(() => {
      // Seed data
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 2, muscles: 'douleurs' });
      }
      const bc = window.AI_COACH.buildContext();
      return bc.weekInsights;
    });
    if (!r) fail('T9 missing', 'weekInsights absent de buildContext');
    else if (!Array.isArray(r.patterns) || r.patterns.length === 0) fail('T9 patterns', 'Patterns vides');
    else {
      const hasSleepLow = r.patterns.some(p => p.id === 'sleep_low_avg');
      const hasPain = r.patterns.some(p => p.id === 'pain_recurrent');
      if (!hasSleepLow || !hasPain) fail('T9 detail', JSON.stringify(r));
      else pass('T9 : buildContext.weekInsights contient sleep_low_avg + pain_recurrent');
    }
    await ctx.close();
  } catch(e) { fail('T9', e.message); }

  // T10 : Backend ALLOWED_FIELDS + handler
  suite('T10 \u2014 Backend netlify : weekInsights whitelist + handler typé');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/ai-coach.js', 'utf8');
    if (src.indexOf("'weekInsights'") === -1) fail('T10 whitelist', 'weekInsights absent ALLOWED_FIELDS');
    else if (src.indexOf("field === 'weekInsights'") === -1) fail('T10 handler', 'Handler absent');
    else if (src.indexOf('INSIGHTS 7J') === -1) fail('T10 prompt', 'Bloc prompt INSIGHTS 7J absent');
    else if (src.indexOf('PATTERN') === -1) fail('T10 pattern label', 'Pattern label absent prompt');
    else pass('T10 : backend OK (whitelist + handler + prompt enrichi)');
  } catch(e) { fail('T10', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 INSIGHTS : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
