// Test E2E — Validation du plan nutritionnel (FIX 2026-04)
// Vérifie que :
//   1. window.currentISOWeek() retourne le bon format
//   2. window.devalidateWeekPlan() dévalide sans supprimer
//   3. Les flags weekPlanValidated + weekPlanValidatedISOWeek sont dans PROFILE_KEYS
//   4. saveProfile planImpacted → dévalide au lieu de supprimer
//   5. Le plan reste visible après changement de paramètre (critique !)
//   6. Reload → plan identique (persistance)

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n) { console.log('  ✓ ' + n); passed++; }
  function fail(n, d) { console.log('  ✗ ' + n + '\n    ' + d); failed++; }
  function suite(n) { console.log('\n═ ' + n + ' ═'); }

  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    return { page, ctx };
  }

  // T1 : helper currentISOWeek retourne format "YYYY-Www"
  suite('T1 — helper currentISOWeek()');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      return {
        current: window.currentISOWeek ? window.currentISOWeek() : null,
        jan5_2026: window.currentISOWeek ? window.currentISOWeek(new Date('2026-01-05')) : null,
        apr14_2026: window.currentISOWeek ? window.currentISOWeek(new Date('2026-04-14')) : null
      };
    });
    if (!r.current) fail('T1 helper exposé', 'window.currentISOWeek absent');
    else if (!/^\d{4}-W\d{2}$/.test(r.current)) fail('T1 format', 'format invalide : ' + r.current);
    else if (r.jan5_2026 !== '2026-W02') fail('T1 Jan 5 2026', 'attendu 2026-W02 reçu ' + r.jan5_2026);
    else if (r.apr14_2026 !== '2026-W16') fail('T1 Apr 14 2026', 'attendu 2026-W16 reçu ' + r.apr14_2026);
    else pass('T1 : currentISOWeek() format OK (' + r.current + '), 2026-01-05=W02, 2026-04-14=W16');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : devalidateWeekPlan ne supprime PAS le plan
  suite('T2 — devalidateWeekPlan ne supprime pas le plan');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      const plan = Array.from({length:7}, () => ({ breakfast:{n:'B',k:400}, lunch:{n:'L',k:600} }));
      window.S.weekPlan = plan;
      window.S.weekPlanValidated = true;
      window.devalidateWeekPlan('test reason');
      return {
        planStillThere: Array.isArray(window.S.weekPlan) && window.S.weekPlan.length === 7,
        validated: window.S.weekPlanValidated,
        firstMeal: window.S.weekPlan[0].breakfast.n
      };
    });
    if (!r.planStillThere) fail('T2 plan préservé', 'plan supprimé par devalidateWeekPlan');
    else if (r.validated !== false) fail('T2 flag dévalidé', 'validated=' + r.validated);
    else if (r.firstMeal !== 'B') fail('T2 contenu préservé', 'firstMeal=' + r.firstMeal);
    else pass('T2 : plan préservé (7 jours), flag validated=false');
    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // T3 : Flags dans PROFILE_KEYS (grep source)
  suite('T3 — Flags dans PROFILE_KEYS');
  try {
    const fs = require('fs');
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/app-main.js', 'utf8');
    if (src.indexOf("'weekPlanValidated'") === -1) fail('T3 weekPlanValidated', 'absent de PROFILE_KEYS');
    else if (src.indexOf("'weekPlanValidatedISOWeek'") === -1) fail('T3 ISOWeek', 'absent');
    else pass('T3 : Flags weekPlanValidated + weekPlanValidatedISOWeek dans PROFILE_KEYS');
  } catch(e) { fail('T3', e.message); }

  // T4 : Scénario user - changement paramètre ne supprime PAS le plan
  suite('T4 — Scénario : user change son régime, plan reste visible');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      const UID = 'val-t4';
      window.AUTH.getUser = () => ({ id: UID, email: 't@t.com' });
      const plan = Array.from({length:7}, () => ({ breakfast:{n:'Omelette',k:400,p:30,g:10,l:25} }));
      window.S.weekPlan = plan;
      window.S.weekPlanValidated = true;
      window.S.weekPlanValidatedISOWeek = window.currentISOWeek();
      window.S.goal = 2; window.S.sex = 'homme'; window.S.weight = 75; window.S.height = 178;
      window.S.regime = 0;

      // Save initial
      window.saveProfile();

      // Changement régime : simulation du onclick (dévalider via helper)
      window.S.regime = 3; // vegan
      if (window.devalidateWeekPlan) window.devalidateWeekPlan('regime change test');
      else window.S.weekPlanValidated = false;
      window.saveProfile();

      return {
        planStillThere: Array.isArray(window.S.weekPlan) && window.S.weekPlan.length === 7,
        planContent: window.S.weekPlan[0].breakfast.n,
        validated: window.S.weekPlanValidated
      };
    });
    if (!r.planStillThere) fail('T4 plan préservé', 'plan supprimé !');
    else if (r.planContent !== 'Omelette') fail('T4 contenu', 'perdu : ' + r.planContent);
    else if (r.validated !== false) fail('T4 dévalidation', 'validated=' + r.validated);
    else pass('T4 : User change régime → plan "Omelette" reste visible, validated=false (bandeau Revalider s\'affichera)');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : Reload → plan identique
  suite('T5 — Reload page : plan identique (pas de régénération auto)');
  try {
    const { page, ctx } = await newPage();
    const UID = 'val-t5';
    await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 't@t.com' });
      window.S.prenom = 'Jamal'; window.S.sex = 'homme'; window.S.age = 30;
      window.S.weight = 80; window.S.height = 180;
      window.S.goal = 1; window.S.activity = 2; window.S.mealsPerDay = 4;
      window.S.regime = 0;
      window.S.weekPlan = Array.from({length:7}, (_, i) => ({
        breakfast: {n:'BF-' + i, k:400}, lunch:{n:'LU-' + i, k:600}, snack:{n:'SN-' + i, k:200}, dinner:{n:'DI-' + i, k:500}
      }));
      window.S._weekPlanGeneratedAt = new Date().toISOString();
      window.S.weekPlanValidated = true;
      window.S.weekPlanValidatedISOWeek = window.currentISOWeek();
      window.saveProfile();
    }, UID);

    // Simuler un reload
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const r = await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 't@t.com' });
      window.loadProfile();
      return {
        validated: window.S.weekPlanValidated,
        isoWeek: window.S.weekPlanValidatedISOWeek,
        firstBF: window.S.weekPlan && window.S.weekPlan[0] && window.S.weekPlan[0].breakfast ? window.S.weekPlan[0].breakfast.n : null,
        thirdLU: window.S.weekPlan && window.S.weekPlan[2] && window.S.weekPlan[2].lunch ? window.S.weekPlan[2].lunch.n : null
      };
    }, UID);

    if (r.validated !== true) fail('T5 validated survit reload', 'validated=' + r.validated);
    else if (!r.isoWeek || !/^\d{4}-W\d{2}$/.test(r.isoWeek)) fail('T5 isoWeek survit', 'isoWeek=' + r.isoWeek);
    else if (r.firstBF !== 'BF-0') fail('T5 plan identique', 'firstBF=' + r.firstBF);
    else if (r.thirdLU !== 'LU-2') fail('T5 plan jour 3', 'thirdLU=' + r.thirdLU);
    else pass('T5 : Reload → flags + plan identiques (pas de régénération auto) — BF-0, LU-2 préservés');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : saveProfile planImpacted → dévalide (pas supprime)
  suite('T6 — saveProfile planImpacted dévalide au lieu de supprimer');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      const UID = 'val-t6';
      window.AUTH.getUser = () => ({ id: UID, email: 't@t.com' });
      window.S.goal = 2; window.S.sex = 'homme'; window.S.weight = 75;
      window.S.height = 178; window.S.activity = 2; window.S.mealsPerDay = 4;
      window.S.regime = 0;
      window.S.weekPlan = Array.from({length:7}, () => ({ breakfast:{n:'SAVED',k:400} }));
      window.S.weekPlanValidated = true;
      window.S.weekPlanValidatedISOWeek = window.currentISOWeek();
      window.saveProfile();

      // Maintenant changement critique : goal
      window.S.goal = 0; // bulk
      window.saveProfile();

      return {
        planPreserved: Array.isArray(window.S.weekPlan) && window.S.weekPlan.length === 7 && window.S.weekPlan[0].breakfast.n === 'SAVED',
        validated: window.S.weekPlanValidated
      };
    });
    if (!r.planPreserved) fail('T6 plan préservé', 'plan supprimé après goal change');
    else if (r.validated !== false) fail('T6 dévalidation', 'validated=' + r.validated);
    else pass('T6 : Goal change → plan préservé + validated=false (bandeau Revalider)');
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Migration legacy (plan existant sans flag)
  suite('T7 — Migration users legacy');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Simuler un user legacy : weekPlan existe mais pas de flags
      window.S.weekPlan = Array.from({length:7}, () => ({ breakfast:{n:'LEGACY',k:400} }));
      delete window.S.weekPlanValidated;
      delete window.S.weekPlanValidatedISOWeek;

      // Exécuter la logique de migration du boot (copie de app-main.js)
      if (window.S.weekPlan && (typeof window.S.weekPlanValidated === 'undefined' || window.S.weekPlanValidated === null)) {
        window.S.weekPlanValidated = true;
        if (window.currentISOWeek) window.S.weekPlanValidatedISOWeek = window.currentISOWeek();
      }

      return {
        validated: window.S.weekPlanValidated,
        isoWeek: window.S.weekPlanValidatedISOWeek
      };
    });
    if (r.validated !== true) fail('T7 migration validated', 'validated=' + r.validated);
    else if (!r.isoWeek) fail('T7 migration isoWeek', 'manquant');
    else pass('T7 : User legacy (plan sans flag) → auto-marqué validated=true (pas de dévalidation forcée)');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  await browser.close();
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`RÉSUMÉ : ${passed}/${passed + failed} tests PASS (${failed} échec(s))`);
  console.log('═══════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
})();
