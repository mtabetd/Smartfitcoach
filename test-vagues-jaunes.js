// Test E2E — 4 vagues jaunes : nutrition 30j + objectifs semaine + plate-scan + PDF hebdo
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
    }, uid || 'test-vagues');
    await page.waitForTimeout(200);
  }

  // ─────────── VAGUE 1 — GRAPH NUTRITION 30J ───────────

  suite('V1.T1 \u2014 Helper getNutritionTrend exposé + empty state');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      type: typeof window.getNutritionTrend,
      empty: window.getNutritionTrend(30)
    }));
    if (r.type !== 'function') fail('V1.T1 type', r.type);
    else if (r.empty !== null) fail('V1.T1 empty', JSON.stringify(r.empty));
    else pass('V1.T1 : helper exposé, empty state → null');
    await ctx.close();
  } catch(e) { fail('V1.T1', e.message); }

  suite('V1.T2 \u2014 getNutritionTrend agrège 3 repas/jour correctement');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'v1-nutrition');
    const r = await page.evaluate(() => {
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const journal = {};
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        journal[ds] = [
          { meal: 'breakfast', kcal: 400, p: 15, g: 60, l: 10 },
          { meal: 'lunch', kcal: 700, p: 50, g: 80, l: 15 }
        ];
      }
      localStorage.setItem('mtd_food_journal_v1-nutrition', JSON.stringify(journal));
      return window.getNutritionTrend(30);
    });
    if (!r) fail('V1.T2 null', 'null');
    else if (r.labels.length !== 30) fail('V1.T2 labels', 'len=' + r.labels.length);
    else if (r.loggedDays !== 5) fail('V1.T2 logged', 'logged=' + r.loggedDays);
    else if (r.kcal.filter(v => v === 1100).length !== 5) fail('V1.T2 kcal', 'Bad kcal agg');
    else if (r.protein.filter(v => v === 65).length !== 5) fail('V1.T2 prot', 'Bad protein agg');
    else pass('V1.T2 : 5j loggés, agrégat 1100 kcal / 65g protéines OK');
    await ctx.close();
  } catch(e) { fail('V1.T2', e.message); }

  suite('V1.T3 \u2014 Widget Nutrition rendu si ≥3j loggés');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'v1-widget');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const journal = {};
      for (let i = 0; i < 10; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        journal[ds] = [{ meal: 'lunch', kcal: 1700, p: 120, g: 200, l: 65 }];
      }
      localStorage.setItem('mtd_food_journal_v1-widget', JSON.stringify(journal));
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      return {
        hasTitle: txt.includes('NUTRITION (30 JOURS)'),
        hasKcal: txt.includes('KCAL MOY'),
        hasProtein: txt.includes('PROT\u00c9INES MOY'),
        hasAdherence: txt.includes('ADH\u00c9RENCE CIBLE'),
        canvasPresent: !!document.getElementById('today-nutrition-trend-chart'),
        chartCount: (window._chartInstances || []).filter(c => c && c.canvas && c.canvas.id === 'today-nutrition-trend-chart').length
      };
    });
    if (!r.hasTitle || !r.canvasPresent || r.chartCount !== 1) fail('V1.T3', JSON.stringify(r));
    else pass('V1.T3 : widget rendu (titre + stats + canvas + 1 chart)');
    await ctx.close();
  } catch(e) { fail('V1.T3', e.message); }

  // ─────────── VAGUE 2 — OBJECTIFS SEMAINE ───────────

  suite('V2.T1 \u2014 Helper getWeeklyGoalsProgress exposé');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      type: typeof window.getWeeklyGoalsProgress,
      empty: window.getWeeklyGoalsProgress()
    }));
    if (r.type !== 'function') fail('V2.T1 type', r.type);
    else pass('V2.T1 : helper exposé (empty=' + (r.empty === null ? 'null' : 'obj') + ')');
    await ctx.close();
  } catch(e) { fail('V2.T1', e.message); }

  suite('V2.T2 \u2014 Objectifs : sessions done/planned/pct');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'v2-sessions');
    const r = await page.evaluate(() => {
      window.S.trainingDaysSelected = [0, 2, 4]; // 3 jours planned
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      window.S.sessionHistory = {};
      for (let i = 0; i < 2; i++) { // 2 séances done
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.S.sessionHistory[i + '_' + ds] = { duration: 45, kcalTotal: 300, date: ds + 'T10:00:00Z' };
      }
      return window.getWeeklyGoalsProgress();
    });
    if (!r || !r.sessions) fail('V2.T2 missing', JSON.stringify(r));
    else if (r.sessions.done !== 2 || r.sessions.planned !== 3) fail('V2.T2 values', JSON.stringify(r.sessions));
    else if (r.sessions.pct !== 67) fail('V2.T2 pct', 'pct=' + r.sessions.pct + ' (expected 67)');
    else pass('V2.T2 : sessions 2/3 = 67%');
    await ctx.close();
  } catch(e) { fail('V2.T2', e.message); }

  suite('V2.T3 \u2014 Widget Objectifs rendu avec 4 progress bars');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'v2-widget');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 2; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      S.trainingDaysSelected = [0, 2, 4];
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      S.sessionHistory = {};
      for (let i = 0; i < 2; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        S.sessionHistory[i + '_' + ds] = { duration: 45, kcalTotal: 300, date: ds + 'T10:00:00Z' };
      }
      // Food journal pour kcal/protéines
      const journal = {};
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        journal[ds] = [{ kcal: 1800, p: 130, g: 200, l: 60 }];
      }
      localStorage.setItem('mtd_food_journal_v2-widget', JSON.stringify(journal));
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.pushWellnessHistory({ date: ds, sleep: 4 });
      }
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      return {
        hasTitle: txt.includes('OBJECTIFS CETTE SEMAINE'),
        hasSessionsLabel: txt.includes('S\u00e9ances'),
        hasCalLabel: txt.includes('Calories') && txt.includes('moy. 7j'),
        hasProtLabel: txt.includes('Prot\u00e9ines') && txt.includes('moy. 7j'),
        hasWellnessLabel: txt.includes('Bilan forme')
      };
    });
    const keys = Object.keys(r);
    const fails = keys.filter(k => !r[k]);
    if (fails.length) fail('V2.T3', 'Missing: ' + fails.join(', '));
    else pass('V2.T3 : widget "OBJECTIFS CETTE SEMAINE" + 4 labels');
    await ctx.close();
  } catch(e) { fail('V2.T3', e.message); }

  suite('V2.T4 \u2014 Couleurs conditionnelles selon pct');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/today-dashboard.js', 'utf8');
    // Vérifier que le code gère les différentes couleurs selon pct
    if (src.indexOf('goals.sessions.pct !== null && goals.sessions.pct < 50') === -1) fail('V2.T4 sessions', 'Threshold sessions absent');
    else if (src.indexOf('Math.abs(goals.kcalAvg.pct - 100)') === -1) fail('V2.T4 kcal', 'Threshold kcal abs absent');
    else pass('V2.T4 : seuils de couleur codés (sessions <50%, kcal ±25%/±10%)');
  } catch(e) { fail('V2.T4', e.message); }

  // ─────────── VAGUE 3 — PLATE-SCAN SONNET ───────────

  suite('V3.T1 \u2014 plate-scan backend : Sonnet 4.6 + MAX_TOKENS 300');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/plate-scan.js', 'utf8');
    if (src.indexOf("MODEL = 'claude-sonnet-4-6'") === -1) fail('V3.T1 model', 'Model non Sonnet 4.6');
    else if (src.indexOf('MAX_TOKENS = 300') === -1) fail('V3.T1 tokens', 'MAX_TOKENS non 300');
    else pass('V3.T1 : Sonnet 4.6 + MAX_TOKENS 300');
  } catch(e) { fail('V3.T1', e.message); }

  suite('V3.T2 \u2014 plate-scan prompt enrichi (system + user)');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/plate-scan.js', 'utf8');
    const markers = [
      'nutritionniste expert',
      'Ciqual',
      'portion VISIBLE',
      '300g par défaut'
    ];
    const missing = markers.filter(m => src.indexOf(m) === -1);
    if (missing.length) fail('V3.T2', 'Manquants : ' + missing.join(' | '));
    else pass('V3.T2 : prompt enrichi (nutritionniste + Ciqual + VISIBLE + fallback 300g)');
  } catch(e) { fail('V3.T2', e.message); }

  suite('V3.T3 \u2014 Rate limit inchangé (5/h par IP)');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/plate-scan.js', 'utf8');
    if (src.indexOf('SCAN_HOUR_MAX = 5') === -1) fail('V3.T3', 'Rate limit SCAN_HOUR_MAX=5 modifié');
    else pass('V3.T3 : SCAN_HOUR_MAX = 5 (coût maîtrisé)');
  } catch(e) { fail('V3.T3', e.message); }

  suite('V3.T4 \u2014 Netlify timeout plate-scan = 26s');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify.toml', 'utf8');
    const m = src.match(/\[functions\."plate-scan"\][\s\S]*?timeout\s*=\s*(\d+)/);
    if (!m) fail('V3.T4 config', 'Config timeout plate-scan absente');
    else if (parseInt(m[1]) !== 26) fail('V3.T4 value', 'timeout=' + m[1]);
    else pass('V3.T4 : timeout Netlify plate-scan = 26s (Pro max)');
  } catch(e) { fail('V3.T4', e.message); }

  // ─────────── VAGUE 4 — PDF RAPPORT HEBDO ───────────

  suite('V4.T1 \u2014 pdf-weekly-report.js chargé dans index.html');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/index.html', 'utf8');
    if (src.indexOf('pdf-weekly-report.js') === -1) fail('V4.T1', 'Script non chargé');
    else pass('V4.T1 : script PDF chargé dans index.html');
  } catch(e) { fail('V4.T1', e.message); }

  suite('V4.T2 \u2014 window.exportWeeklyReportPDF exposé au runtime');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      type: typeof window.exportWeeklyReportPDF,
      hasJsPDF: !!(window.jspdf && window.jspdf.jsPDF)
    }));
    if (r.type !== 'function') fail('V4.T2 type', r.type);
    else if (!r.hasJsPDF) fail('V4.T2 jsPDF', 'jsPDF non chargé');
    else pass('V4.T2 : exportWeeklyReportPDF exposé + jsPDF disponible');
    await ctx.close();
  } catch(e) { fail('V4.T2', e.message); }

  suite('V4.T3 \u2014 PDF généré avec nom fichier daté');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'v4-pdf');
    const r = await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'Jamal'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178; S.goal = 2; S.activity = 2;
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      S.sessionHistory = {};
      for (let i = 0; i < 3; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const ds = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        S.sessionHistory[i + '_' + ds] = { duration: 45, kcalTotal: 300, date: ds + 'T10:00:00Z' };
      }
      // Intercept save
      if (window.jspdf && window.jspdf.jsPDF) {
        window.jspdf.jsPDF.API.save = function(filename) {
          window._pdfFilename = filename;
          window._pdfSize = this.output('blob').size;
          return this;
        };
      }
      window.exportWeeklyReportPDF();
      return {
        filename: window._pdfFilename,
        size: window._pdfSize
      };
    });
    if (!r.filename) fail('V4.T3 fname', 'Pas de filename');
    else if (!/^smartfitcoach-rapport-hebdo-\d{4}-\d{2}-\d{2}\.pdf$/.test(r.filename)) fail('V4.T3 pattern', r.filename);
    else if (r.size < 3000) fail('V4.T3 size', 'PDF trop petit: ' + r.size);
    else if (r.size > 500000) fail('V4.T3 size-large', 'PDF trop gros: ' + r.size);
    else pass('V4.T3 : PDF généré ' + r.filename + ' (' + Math.round(r.size/1024) + ' KB)');
    await ctx.close();
  } catch(e) { fail('V4.T3', e.message); }

  suite('V4.T4 \u2014 PDF contient les sections attendues (profil/objectifs/bilan/records)');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/pdf-weekly-report.js', 'utf8');
    const markers = [
      "sectionTitle(doc, y, 'Profil')",
      "sectionTitle(doc, y, 'Objectifs de la semaine')",
      "sectionTitle(doc, y, 'Bilan 7 jours')",
      "sectionTitle(doc, y, 'Signaux d\u00e9tect\u00e9s')",
      "sectionTitle(doc, y, 'Records personnels')",
      "disclaimer",
      "getWeekSessionsSummary",
      "getPersonalRecords",
      "getWeeklyGoalsProgress",
      "detectWeekPatterns"
    ];
    const missing = markers.filter(m => src.indexOf(m) === -1);
    if (missing.length) fail('V4.T4', 'Manquants : ' + missing.join(' | '));
    else pass('V4.T4 : 5 sections + disclaimer + 4 helpers utilisés');
  } catch(e) { fail('V4.T4', e.message); }

  suite('V4.T5 \u2014 Bouton PDF dans dashboard "Mes données"');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/today-dashboard.js', 'utf8');
    if (src.indexOf('exportWeeklyReportPDF') === -1) fail('V4.T5', 'Bouton ne call pas exportWeeklyReportPDF');
    else if (src.indexOf('T\u00e9l\u00e9charger mon rapport PDF') === -1) fail('V4.T5 label', 'Label bouton absent');
    else pass('V4.T5 : bouton "Télécharger mon rapport PDF" présent + call correct');
  } catch(e) { fail('V4.T5', e.message); }

  suite('V4.T6 \u2014 PDF avec seulement profil minimal (pas de sessions)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'v4-minimal');
    const r = await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'Min'; S.sex = 'femme'; S.age = 25; S.weight = 60; S.height = 170; S.goal = 2; S.activity = 1;
      S.sessionHistory = {};
      if (window.jspdf && window.jspdf.jsPDF) {
        window.jspdf.jsPDF.API.save = function(filename) {
          window._pdfSaved = true;
          window._pdfSize = this.output('blob').size;
          return this;
        };
      }
      try { window.exportWeeklyReportPDF(); return { ok: true, saved: window._pdfSaved, size: window._pdfSize }; }
      catch(e) { return { ok: false, err: e.message }; }
    });
    if (!r.ok) fail('V4.T6 err', r.err);
    else if (!r.saved) fail('V4.T6 save', 'PDF non save');
    else pass('V4.T6 : PDF généré même sans sessions (profil minimal) — ' + Math.round(r.size/1024) + ' KB');
    await ctx.close();
  } catch(e) { fail('V4.T6', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 VAGUES JAUNES : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
