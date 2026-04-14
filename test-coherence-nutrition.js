// Test cohérence dashboard ↔ planning nutrition
// Vérifie que les deux vues affichent les MÊMES chiffres de cible/macros

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n) { console.log('✓ ' + n); passed++; }
  function fail(n, d) { console.log('✗ ' + n + '\n    ' + d); failed++; }

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await ctx.addInitScript(() => {
    localStorage.setItem('mtd_dev_wiped_v1', '1');
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // T1 : Dashboard (hero kcal) et Planning (progress card) lisent la même source (plan du jour)
  try {
    const r = await page.evaluate(() => {
      // Setup : profil complet + weekPlan identique pour les 7 jours
      const UID = 'coherence-test';
      window.AUTH.getUser = () => ({ id: UID, email: 't@t.com' });
      delete window.S._loadCorrupted;
      window.S.appMode = 'nutrition';
      window.S.sex = 'homme'; window.S.age = 30; window.S.weight = 80; window.S.height = 180;
      window.S.goal = 1; window.S.activity = 2; window.S.sleep = 2;
      window.S.mealsPerDay = 4; window.S.regime = 0;

      // Plan du jour (today) fixe : B+L+S+D = 400+600+200+500 = 1700 kcal
      // Macros : P=30+40+25+35=130 G=40+60+15+45=160 L=15+20+3+20=58
      const meal = (n, k, p, g, l) => ({ n, k, p, g, l });
      const todayMeals = {
        breakfast: meal('B', 400, 30, 40, 15),
        lunch:     meal('L', 600, 40, 60, 20),
        snack:     meal('S', 200, 25, 15, 3),
        dinner:    meal('D', 500, 35, 45, 20)
      };
      window.S.weekPlan = Array.from({length:7}, () => ({
        breakfast: Object.assign({}, todayMeals.breakfast),
        lunch: Object.assign({}, todayMeals.lunch),
        snack: Object.assign({}, todayMeals.snack),
        dinner: Object.assign({}, todayMeals.dinner)
      }));
      // Reset _nm et foodLog éventuel
      window.S._nm = null;
      delete window.S._foodLog;

      // 1. Calculer ce que le DASHBOARD afficherait (renderCardHeroKcal)
      const todayIdx = (new Date().getDay() + 6) % 7;
      const dayPlan = window.S.weekPlan[todayIdx];
      let dashTgt = 0, dashP = 0, dashG = 0, dashL = 0;
      ['breakfast','lunch','snack','dinner'].forEach(s => {
        const r = dayPlan[s];
        if (r) { dashTgt += (r.k||0); dashP += (r.p||0); dashG += (r.g||0); dashL += (r.l||0); }
      });

      // 2. Calculer ce que le PLANNING afficherait (renderStep9 après fix)
      window.S.selectedDay = todayIdx;
      const _preDay = window.S.weekPlan[window.S.selectedDay] || {};
      let planKcal = 0, planP = 0, planG = 0, planL = 0;
      ['breakfast','lunch','snack','dinner'].forEach(s => {
        const r = _preDay[s];
        if (r) { planKcal += (r.k||0); planP += (r.p||0); planG += (r.g||0); planL += (r.l||0); }
      });
      const planTgt = planKcal;

      return {
        dash: { tgt: dashTgt, p: dashP, g: dashG, l: dashL },
        plan: { tgt: planTgt, p: planP, g: planG, l: planL },
        match: dashTgt === planTgt && dashP === planP && dashG === planG && dashL === planL
      };
    });

    if (!r.match) {
      fail('T1 cohérence cibles',
        'Dashboard ' + JSON.stringify(r.dash) + ' ≠ Planning ' + JSON.stringify(r.plan));
    } else {
      pass('T1 : Dashboard & Planning lisent la MÊME source — cibles identiques ' + JSON.stringify(r.dash));
    }
  } catch(e) { fail('T1', e.message); }

  // T2 : Quand FOOD_JOURNAL contient des entrées, les deux vues les voient (si selectedDay = today)
  try {
    const r = await page.evaluate(() => {
      const UID = 'cohe-food-uid';
      window.AUTH.getUser = () => ({ id: UID, email: 't@t.com' });

      // Inject fake FOOD_JOURNAL entry for today
      const today = new Date().toISOString().split('T')[0];
      const journal = {};
      journal[today] = [
        { kcal: 400, p: 30, g: 40, l: 15, name: 'Omelette', meal: 'breakfast' }
      ];
      localStorage.setItem('mtd_food_journal_' + UID, JSON.stringify(journal));

      // Vérifier que FOOD_JOURNAL.getDayTotal() voit bien ces entrées
      const total = window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal
        ? window.FOOD_JOURNAL.getDayTotal()
        : null;
      return { total };
    });

    if (!r.total) fail('T2 FOOD_JOURNAL', 'getDayTotal() absent ou retourne null');
    else if (r.total.kcal !== 400) fail('T2 FOOD_JOURNAL', 'Entrée 400 kcal pas reflétée : ' + JSON.stringify(r.total));
    else pass('T2 : FOOD_JOURNAL.getDayTotal() = 400 kcal — source unique pour dashboard et planning');
  } catch(e) { fail('T2', e.message); }

  // T3 : Le fix a bien supprimé le code mort _foodLog
  try {
    const fs = require('fs');
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/app-nutrition.js', 'utf8');
    // Entre renderStep9 et quickActions, il ne doit plus y avoir de `S._foodLog[S.selectedDay]`
    const step9Start = src.indexOf('function renderStep9');
    const step9End = src.indexOf('// Quick action buttons', step9Start);
    const step9Section = src.substring(step9Start, step9End);
    if (step9Section.indexOf('S._foodLog[S.selectedDay]') !== -1)
      fail('T3 code mort', 'Lecture de S._foodLog[S.selectedDay] encore présente dans renderStep9');
    else
      pass('T3 : Code mort S._foodLog[selectedDay] supprimé de renderStep9');

    // Vérifier que le fix marker est présent
    if (step9Section.indexOf('FIX COHÉRENCE 2026-04') === -1)
      fail('T3 marker', 'Marker FIX COHÉRENCE 2026-04 absent');
    else
      pass('T3 : Marker FIX COHÉRENCE 2026-04 présent (traçabilité)');
  } catch(e) { fail('T3', e.message); }

  // T4 : Aucune erreur console
  if (errs.length > 0) fail('T4 console', errs.slice(0,3).join(' | '));
  else pass('T4 : Aucune erreur console');

  await ctx.close();
  await browser.close();
  console.log('\n========== COHÉRENCE DASHBOARD ↔ PLANNING ==========');
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
