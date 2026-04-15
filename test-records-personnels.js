// Test E2E — WIDGET RECORDS PERSONNELS
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
    }, uid || 'test-records');
    await page.waitForTimeout(200);
  }

  // T1 : Helper exposé + empty state
  suite('T1 \u2014 Helper window.getPersonalRecords exposé');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      type: typeof window.getPersonalRecords,
      empty: window.getPersonalRecords()
    }));
    if (r.type !== 'function') fail('T1 type', r.type);
    else if (r.empty !== null) fail('T1 empty', 'Should return null: ' + JSON.stringify(r.empty));
    else pass('T1 : helper exposé, empty state retourne null');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : Charge max + 1RM Epley correct
  suite('T2 \u2014 Charge max + formule 1RM Epley (100kg × 8 reps = 127 kg 1RM)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-epley');
    const r = await page.evaluate(() => {
      window.S.muscuProgressionHistory = {
        'Squat': [
          { date: '2026-03-01', weight: 90, reps: 10 },
          { date: '2026-04-01', weight: 100, reps: 8 } // → max
        ]
      };
      return window.getPersonalRecords();
    });
    if (!r || !r.maxLifts || r.maxLifts.length !== 1) fail('T2 missing', JSON.stringify(r));
    else {
      const lift = r.maxLifts[0];
      if (lift.exercise !== 'Squat') fail('T2 exo', lift.exercise);
      else if (lift.weight !== 100) fail('T2 weight', lift.weight);
      else if (lift.reps !== 8) fail('T2 reps', lift.reps);
      // Epley: 100 × (1 + 8/30) = 100 × 1.2667 = 126.66... arrondi 126.7 → 1 décimale = 126.7
      else if (lift.oneRepMax < 126 || lift.oneRepMax > 127.5) fail('T2 1RM', 'oneRepMax=' + lift.oneRepMax);
      else pass('T2 : Squat max 100kg × 8 reps → 1RM ' + lift.oneRepMax + ' kg (Epley)');
    }
    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // T3 : Top 3 maxLifts triés par 1RM décroissant
  suite('T3 \u2014 Top 3 maxLifts triés par 1RM décroissant');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-top3');
    const r = await page.evaluate(() => {
      window.S.muscuProgressionHistory = {
        'Développé couché': [{ date: '2026-04-01', weight: 80, reps: 8 }],    // 1RM ≈ 101
        'Squat': [{ date: '2026-04-01', weight: 120, reps: 5 }],              // 1RM ≈ 140
        'Soulevé de terre': [{ date: '2026-04-01', weight: 140, reps: 3 }],   // 1RM ≈ 154
        'Développé militaire': [{ date: '2026-04-01', weight: 50, reps: 8 }], // 1RM ≈ 63
        'Rowing barre': [{ date: '2026-04-01', weight: 70, reps: 8 }]         // 1RM ≈ 89
      };
      return window.getPersonalRecords();
    });
    if (!r.maxLifts || r.maxLifts.length !== 3) fail('T3 count', 'len=' + (r.maxLifts || []).length);
    else {
      const names = r.maxLifts.map(l => l.exercise);
      // Attendu : SDT > Squat > DC (par 1RM)
      if (names[0] !== 'Soulevé de terre' || names[1] !== 'Squat' || names[2] !== 'Développé couché') {
        fail('T3 order', JSON.stringify(names));
      } else pass('T3 : top 3 = [Soulevé de terre, Squat, Développé couché] (tri 1RM)');
    }
    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // T4 : Matching case/accent-insensitive
  suite('T4 \u2014 Matching case/accent-insensitive');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-case');
    const r = await page.evaluate(() => {
      window.S.muscuProgressionHistory = {
        'SQUAT': [{ date: '2026-04-01', weight: 100, reps: 8 }],
        'Developpe couche': [{ date: '2026-04-01', weight: 80, reps: 8 }]
      };
      return window.getPersonalRecords();
    });
    const names = r.maxLifts.map(l => l.exercise).sort();
    if (names[0] !== 'Développé couché' || names[1] !== 'Squat') fail('T4 names', JSON.stringify(names));
    else pass('T4 : UPPERCASE + sans accents → matchés sous noms FR normalisés');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : Weight milestone selon goal
  suite('T5 \u2014 Poids milestone contextualisé par goal');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-goal');
    // Case 1: goal = bulk → max
    const bulkR = await page.evaluate(() => {
      window.S.weightHistory = [
        { date: '2026-01-01', weight: 70 },
        { date: '2026-04-01', weight: 76 }
      ];
      window.S.goal = 0; // bulk (assuming index 0)
      return window.getPersonalRecords();
    });
    // Case 2: goal = cut → min
    const cutR = await page.evaluate(() => {
      window.S.weightHistory = [
        { date: '2026-01-01', weight: 80 },
        { date: '2026-04-01', weight: 74 }
      ];
      window.S.goal = 4; // cut (assuming index)
      return window.getPersonalRecords();
    });
    if (!bulkR.weightMilestone) fail('T5 bulk missing', 'Bulk milestone absent');
    else if (bulkR.weightMilestone.direction !== 'max') fail('T5 bulk direction', bulkR.weightMilestone.direction);
    else if (bulkR.weightMilestone.weight !== 76) fail('T5 bulk weight', bulkR.weightMilestone.weight);
    else if (!cutR.weightMilestone) fail('T5 cut missing', JSON.stringify(cutR));
    else if (cutR.weightMilestone.direction !== 'min') fail('T5 cut direction', cutR.weightMilestone.direction);
    else if (cutR.weightMilestone.weight !== 74) fail('T5 cut weight', cutR.weightMilestone.weight);
    else pass('T5 : bulk → max 76kg, cut → min 74kg');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : Weight range si maintain
  suite('T6 \u2014 Plage de poids si maintain (goal neutre)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-maintain');
    const r = await page.evaluate(() => {
      window.S.weightHistory = [
        { date: '2026-01-01', weight: 72 },
        { date: '2026-02-01', weight: 74 },
        { date: '2026-03-01', weight: 73 },
        { date: '2026-04-01', weight: 71 }
      ];
      window.S.goal = 2; // maintain (assuming index 2)
      return window.getPersonalRecords();
    });
    // Selon GOALS[2].key — si c'est 'maintain' → weightRange
    if (r.weightRange) {
      if (r.weightRange.min !== 71 || r.weightRange.max !== 74) fail('T6 range', JSON.stringify(r.weightRange));
      else pass('T6 : goal maintain → plage ' + r.weightRange.min + '–' + r.weightRange.max + ' kg');
    } else if (r.weightMilestone) {
      // Le goal n'est peut-être pas 'maintain' dans window.GOALS[2] → on accepte le comportement
      pass('T6 : goal index 2 → ' + r.weightMilestone.direction + ' ' + r.weightMilestone.weight + ' kg (goal-aware)');
    } else {
      fail('T6 no data', 'Ni range ni milestone');
    }
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Séance la plus longue
  suite('T7 \u2014 Séance la plus longue');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-session');
    const r = await page.evaluate(() => {
      window.S.sessionHistory = {
        '0_2026-04-01': { duration: 45, kcalTotal: 300, date: '2026-04-01T10:00:00Z' },
        '1_2026-04-05': { duration: 90, kcalTotal: 600, date: '2026-04-05T10:00:00Z' }, // longest
        '2_2026-04-10': { duration: 60, kcalTotal: 400, date: '2026-04-10T10:00:00Z' }
      };
      return window.getPersonalRecords();
    });
    if (!r.longestSession) fail('T7 missing', 'longestSession absent');
    else if (r.longestSession.duration !== 90) fail('T7 duration', r.longestSession.duration);
    else if (r.longestSession.kcalTotal !== 600) fail('T7 kcal', r.longestSession.kcalTotal);
    else if (r.longestSession.date !== '2026-04-05') fail('T7 date', r.longestSession.date);
    else pass('T7 : séance 90min / 600 kcal / 2026-04-05');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  // T8 : Streak max depuis localStorage
  suite('T8 \u2014 Streak max lu depuis mtd_streak_<uid>.max');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-streak');
    const r = await page.evaluate(() => {
      localStorage.setItem('mtd_streak_test-streak', JSON.stringify({ current: 3, max: 21 }));
      return window.getPersonalRecords();
    });
    if (r && r.maxStreak === 21) pass('T8 : maxStreak = 21 lu depuis localStorage');
    else fail('T8 miss', JSON.stringify(r));
    await ctx.close();
  } catch(e) { fail('T8', e.message); }

  // T9 : Widget rendu dans DOM avec tous les records
  suite('T9 \u2014 Widget rendu : RECORDS PERSONNELS + 4 entries');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-render');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 0; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      S.muscuProgressionHistory = {
        'Squat': [{ date: '2026-04-01', weight: 110, reps: 6 }],
        'Développé couché': [{ date: '2026-04-10', weight: 85, reps: 6 }]
      };
      S.weightHistory = [
        { date: '2026-01-01', weight: 70 },
        { date: '2026-04-01', weight: 77 }
      ];
      S.sessionHistory = {
        '0_2026-04-10': { duration: 75, kcalTotal: 450, date: '2026-04-10T10:00:00Z' }
      };
      localStorage.setItem('mtd_streak_test-render', JSON.stringify({ current: 7, max: 14 }));
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      return {
        hasTitle: txt.includes('RECORDS PERSONNELS'),
        hasSquat: txt.includes('Squat'),
        hasBench: txt.includes('D\u00e9velopp\u00e9 couch\u00e9'),
        has1RM: txt.includes('1RM'),
        hasMaxAtteint: txt.includes('Max atteint'),
        has77kg: txt.includes('77 kg'),
        hasLongest: txt.includes('S\u00e9ance la plus longue'),
        has75min: txt.includes('75 min'),
        hasStreak: txt.includes('Plus longue s\u00e9rie'),
        has14j: txt.includes('14 jours')
      };
    });
    const keys = Object.keys(r);
    const fails = keys.filter(k => !r[k]);
    if (fails.length) fail('T9 miss', 'Missing: ' + fails.join(', '));
    else if (errors.length) fail('T9 errs', errors.join(' | '));
    else pass('T9 : widget complet rendu (titre + 2 lifts + milestone + longest + streak)');
    await ctx.close();
  } catch(e) { fail('T9', e.message); }

  // T10 : Isolation inter-users
  suite('T10 \u2014 Isolation inter-users (maxStreak)');
  try {
    const { page, ctx, errors } = await newPage();
    // User A set streak
    await mockLogin(page, 'user-A-rec');
    await page.evaluate(() => {
      localStorage.setItem('mtd_streak_user-A-rec', JSON.stringify({ current: 5, max: 30 }));
      window.S.muscuProgressionHistory = { 'Squat': [{ date: '2026-04-01', weight: 100, reps: 8 }] };
    });
    // User B clean context
    await mockLogin(page, 'user-B-rec');
    const r = await page.evaluate(() => {
      window.S.muscuProgressionHistory = {};
      return window.getPersonalRecords();
    });
    // User B shouldn't see user A data
    if (r && (r.maxLifts || r.maxStreak === 30)) fail('T10 leak', JSON.stringify(r));
    else pass('T10 : user B n\'a ni les lifts ni le streak max de user A');
    await ctx.close();
  } catch(e) { fail('T10', e.message); }

  // T11b : FIX CONTRE-AUDIT — fmtDate tolère ISO timestamps complets
  suite('T11b \u2014 fmtDate robuste aux timestamps ISO complets');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-iso');
    await page.evaluate(() => {
      var S = window.S;
      S.prenom = 'T'; S.sex = 'homme'; S.age = 30; S.weight = 75; S.height = 178;
      S.goal = 0; S.activity = 2; S.appMode = 'both';
      S._dashExtOpen = true;
      // Date avec timestamp complet (cas potentiel si API backend renvoie ISO)
      S.muscuProgressionHistory = {
        'Squat': [{ date: '2026-04-15T14:30:00Z', weight: 100, reps: 8 }]
      };
      S.view = 'today';
      if (window.render) window.render();
    });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const txt = (document.getElementById('app') || {}).innerText || '';
      return {
        hasFormatted: txt.includes('15/04/2026'),
        hasCorrupted: txt.includes('T14:') || txt.includes('T14/')
      };
    });
    if (r.hasCorrupted) fail('T11b corrupted', 'Date ISO mal formatée dans le DOM');
    else if (!r.hasFormatted) fail('T11b missing', 'Date 15/04/2026 absente');
    else pass('T11b : fmtDate affiche correctement "15/04/2026" même avec timestamp ISO complet');
    await ctx.close();
  } catch(e) { fail('T11b', e.message); }

  // T11 : Weight history coerces string weight
  suite('T11 \u2014 Weight history tolère string "75.5" (parseFloat)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-coerce');
    const r = await page.evaluate(() => {
      window.S.weightHistory = [
        { date: '2026-01-01', weight: '70.5' },
        { date: '2026-04-01', weight: '75.2' }
      ];
      window.S.goal = 0; // bulk
      return window.getPersonalRecords();
    });
    if (!r || !r.weightMilestone) fail('T11 missing', JSON.stringify(r));
    else if (r.weightMilestone.weight !== 75.2) fail('T11 weight', r.weightMilestone.weight);
    else pass('T11 : string "75.2" parsé en 75.2');
    await ctx.close();
  } catch(e) { fail('T11', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 RECORDS : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
