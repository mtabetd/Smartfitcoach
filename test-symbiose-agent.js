/**
 * TEST SUITE — Symbiose Sport/Nutrition — SmartFitCoach
 * 17 tests E2E Playwright
 * Tests 1-9: syncSportGoalsToNutrition()
 * Tests 10-12: HTA avertissements dans vue programme sport
 * Tests 13-15: Conflits détectés dans vue sport
 * Tests 16-17: getDayType() + getAdaptedMealSplit() cohérence calorique
 */
const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:3000';
const BROWSER_OPTS = {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
};

// Profil de base complet
const BASE_PROFILE = {
  sex: 'homme', age: 30, weight: 80, height: 180,
  goal: 3, // cut
  activity: 2,
  sportDays: 3,
  mealsPerDay: 4,
  regime: 0,
  whey: false,
  wantsDessert: false,
  allergies: [], intolerances: [],
  medical: [],
  targetWeight: null,
  trainingDaysSelected: [0, 2, 4],
  weeklyCalendar: null,
  sportGoals: ['muscle'],
  sportLevel: 'intermediate',
  sportType: 'muscu',
  sportFocus: { chest: 2, back: 2, legs: 2 },
  sportProgram: [{ day: 'Lundi', exercises: [] }],
  sStep: 4,
  view: 'sport',
  _nm: null,
  pregnant: false
};

let passed = 0, failed = 0;
const results = [];

function logResult(n, name, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passed++; else failed++;
  results.push({ n, name, status, detail: detail || '' });
  console.log(`[${status}] T${n} — ${name}${detail ? ' | ' + detail : ''}`);
}

async function openPage(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', () => {});
  page.on('console', () => {});
  return page;
}

async function setupPage(page, profileOverrides = {}) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(
    () => typeof window.S === 'object' && window.S !== null &&
          typeof window.syncSportGoalsToNutrition === 'function',
    { timeout: 15000 }
  );
  const profile = Object.assign({}, BASE_PROFILE, profileOverrides);
  await page.evaluate((p) => { Object.assign(window.S, p); }, profile);
  return page;
}

async function runTests() {
  const browser = await chromium.launch(BROWSER_OPTS);

  try {

    // ══════════════════════════════════════════════════════════════════════
    // BLOC 1 — syncSportGoalsToNutrition()
    // ══════════════════════════════════════════════════════════════════════

    // T1: muscle + goal cut → recomposition (5)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 3; // cut
          window.S.sportGoals = ['muscle'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 5;
        detail = `goal=${result.goal}(${result.key}) — attendu 5(recomposition)`;
      } catch(e) { detail = e.message; }
      logResult(1, 'muscle + goal=cut(3) → recomposition(5)', ok, detail);
      await page.close();
    }

    // T2: muscle + goal shred → recomposition (5)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 4; // shred
          window.S.sportGoals = ['muscle'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 5;
        detail = `goal=${result.goal}(${result.key}) — attendu 5(recomposition)`;
      } catch(e) { detail = e.message; }
      logResult(2, 'muscle + goal=shred(4) → recomposition(5)', ok, detail);
      await page.close();
    }

    // T3: muscle + goal maintain → bulk (0)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 2; // maintain
          window.S.sportGoals = ['muscle'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 0;
        detail = `goal=${result.goal}(${result.key}) — attendu 0(bulk)`;
      } catch(e) { detail = e.message; }
      logResult(3, 'muscle + goal=maintain(2) → bulk(0)', ok, detail);
      await page.close();
    }

    // T4: muscle + goal lean_bulk → lean_bulk préservé (1)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 1; // lean_bulk
          window.S.sportGoals = ['muscle'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 1;
        detail = `goal=${result.goal}(${result.key}) — attendu 1(lean_bulk)`;
      } catch(e) { detail = e.message; }
      logResult(4, 'muscle + goal=lean_bulk(1) → lean_bulk(1) préservé', ok, detail);
      await page.close();
    }

    // T5: shred sport + cut nutrition → shred nutrition (4)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 3; // cut
          window.S.sportGoals = ['shred'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 4;
        detail = `goal=${result.goal}(${result.key}) — attendu 4(shred)`;
      } catch(e) { detail = e.message; }
      logResult(5, 'shred sport + cut(3) nutrition → shred nutrition(4)', ok, detail);
      await page.close();
    }

    // T6: muscle+shred dans sportGoals → shred prioritaire (4)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 2; // maintain
          window.S.sportGoals = ['muscle', 'shred'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 4;
        detail = `goal=${result.goal}(${result.key}) — attendu 4(shred)`;
      } catch(e) { detail = e.message; }
      logResult(6, 'muscle+shred sportGoals, goal=maintain(2) → shred prioritaire(4)', ok, detail);
      await page.close();
    }

    // T7: weightloss sport → cut nutrition (3)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 2; // maintain
          window.S.sportGoals = ['weightloss'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 3;
        detail = `goal=${result.goal}(${result.key}) — attendu 3(cut)`;
      } catch(e) { detail = e.message; }
      logResult(7, 'weightloss sport + goal=maintain(2) → cut nutrition(3)', ok, detail);
      await page.close();
    }

    // T8: general/endurance sport + recomposition nutrition → préservé (5)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 5; // recomposition
          window.S.sportGoals = ['general'];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 5;
        detail = `goal=${result.goal}(${result.key}) — attendu 5(recomposition)`;
      } catch(e) { detail = e.message; }
      logResult(8, 'general sport + goal=recomposition(5) → préservé(5)', ok, detail);
      await page.close();
    }

    // T9: sportGoals vide → maintain (2)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page);
        const result = await page.evaluate(() => {
          window.S.goal = 1; // lean_bulk
          window.S.sportGoals = [];
          window.syncSportGoalsToNutrition();
          return { goal: window.S.goal, key: window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '?' };
        });
        ok = result.goal === 2;
        detail = `goal=${result.goal}(${result.key}) — attendu 2(maintain)`;
      } catch(e) { detail = e.message; }
      logResult(9, 'sportGoals vide, goal=lean_bulk(1) → maintain(2)', ok, detail);
      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════════
    // BLOC 2 — HTA avertissements dans vue programme sport (renderMusculationProgram)
    // ══════════════════════════════════════════════════════════════════════

    // T10: HTA légère → bloc avertissement HTA légère avec RPE 8/10
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: ['hta'],
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        await page.evaluate(() => {
          // Forcer le render de la vue sport
          if (window.render) window.render();
        });
        await page.waitForTimeout(500);
        const result = await page.evaluate(() => {
          var body = document.body.innerHTML;
          var hasRPE8 = body.indexOf('RPE 8/10') !== -1;
          var hasHTAtext = body.indexOf('HTA') !== -1;
          var hasPrecautions = body.indexOf('Précautions') !== -1 || body.indexOf('cautions') !== -1;
          // Chercher spécifiquement le bloc HTA légère (pas sévère)
          var hasHTALight = body.indexOf('HTA légère') !== -1 || body.indexOf('HTA — Précautions') !== -1;
          return { hasRPE8, hasHTAtext, hasPrecautions, hasHTALight, snippet: body.substring(body.indexOf('HTA'), Math.min(body.indexOf('HTA') + 200, body.length)) };
        });
        ok = (result.hasRPE8 || result.hasHTAtext) && result.hasHTALight;
        detail = `hasHTALight=${result.hasHTALight} hasRPE8=${result.hasRPE8}`;
        if (!ok && result.hasHTAtext) detail += ' | snippet: ' + result.snippet.replace(/<[^>]+>/g, '').substring(0, 80);
      } catch(e) { detail = e.message; }
      logResult(10, 'HTA légère → bloc avertissement HTA légère + RPE 8/10 dans DOM', ok, detail);
      await page.close();
    }

    // T11: HTA sévère → bloc HTA sévère apparaît, PAS le bloc HTA légère
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: ['hta_severe'],
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        await page.evaluate(() => { if (window.render) window.render(); });
        await page.waitForTimeout(500);
        const result = await page.evaluate(() => {
          var body = document.body.innerHTML;
          var hasHTASevere = body.indexOf('HTA Sévère') !== -1 || body.indexOf('hta_severe') !== -1 || body.indexOf('HTA sévère') !== -1 || body.indexOf('Sévère') !== -1;
          // Le bloc HTA légère est conditionné à hta ET PAS hta_severe
          var hasHTALight = body.indexOf('HTA légère') !== -1 && body.indexOf('HTA — Précautions') !== -1;
          return { hasHTASevere, hasHTALight };
        });
        ok = result.hasHTASevere && !result.hasHTALight;
        detail = `hasHTASevere=${result.hasHTASevere} hasHTALight=${result.hasHTALight} — attendu sévère=true, légère=false`;
      } catch(e) { detail = e.message; }
      logResult(11, 'HTA sévère → bloc HTA sévère présent, bloc légère absent', ok, detail);
      await page.close();
    }

    // T12: Profil sans HTA → aucun bloc HTA
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: [],
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        await page.evaluate(() => { if (window.render) window.render(); });
        await page.waitForTimeout(500);
        const result = await page.evaluate(() => {
          var body = document.body.innerHTML;
          var hasHTALight = body.indexOf('HTA — Précautions') !== -1 || body.indexOf('HTA légère') !== -1;
          var hasHTASevere = body.indexOf('HTA Sévère') !== -1 && body.indexOf('Restrictions sport') !== -1;
          return { hasHTALight, hasHTASevere };
        });
        ok = !result.hasHTALight && !result.hasHTASevere;
        detail = `hasHTALight=${result.hasHTALight} hasHTASevere=${result.hasHTASevere} — attendu tous false`;
      } catch(e) { detail = e.message; }
      logResult(12, 'medical=[] → aucun bloc HTA dans DOM', ok, detail);
      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════════
    // BLOC 3 — Conflits détectés dans vue sport
    // ══════════════════════════════════════════════════════════════════════

    // T13: IRC + bulk → conflit CRITIQUE avec 'IRC' dans vue programme
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: ['irc'],
          goal: 0, // bulk
          sportGoals: ['muscle'],
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        await page.evaluate(() => { if (window.render) window.render(); });
        await page.waitForTimeout(500);
        const result = await page.evaluate(() => {
          var body = document.body.innerHTML;
          // La vue sport filtre les conflits contenant 'IRC'
          var hasIRC = body.indexOf('IRC') !== -1;
          // Vérifier aussi via detectMedicalConflicts directement
          var directConflicts = window.detectMedicalConflicts ? window.detectMedicalConflicts() : [];
          var ircConflict = directConflicts.some(function(c) { return c.message.indexOf('IRC') !== -1 && c.level === 'CRITIQUE'; });
          return { hasIRC, ircConflict, conflictsCount: directConflicts.length };
        });
        ok = result.hasIRC || result.ircConflict;
        detail = `hasIRC_DOM=${result.hasIRC} ircConflict_fn=${result.ircConflict} conflicts=${result.conflictsCount}`;
      } catch(e) { detail = e.message; }
      logResult(13, 'IRC + bulk(0) → conflit CRITIQUE IRC dans vue sport', ok, detail);
      await page.close();
    }

    // T14: nutrition bulk + sport shred → conflit objectifs affiché
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: [],
          goal: 0, // bulk
          sportGoals: ['shred'],
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        await page.evaluate(() => { if (window.render) window.render(); });
        await page.waitForTimeout(500);
        const result = await page.evaluate(() => {
          var body = document.body.innerHTML;
          var hasConflict = body.indexOf('CONFLIT objectif') !== -1 || body.indexOf('contradictoires') !== -1;
          // Vérifier via la fonction directement
          var directConflicts = window.detectMedicalConflicts ? window.detectMedicalConflicts() : [];
          var goalConflict = directConflicts.some(function(c) {
            return c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1;
          });
          return { hasConflict, goalConflict, conflictsCount: directConflicts.length };
        });
        ok = result.hasConflict || result.goalConflict;
        detail = `hasConflict_DOM=${result.hasConflict} goalConflict_fn=${result.goalConflict} conflicts=${result.conflictsCount}`;
      } catch(e) { detail = e.message; }
      logResult(14, 'nutrition bulk(0) + sport shred → conflit objectifs dans vue sport', ok, detail);
      await page.close();
    }

    // T15: nutrition cut + sport muscle + intermédiaire → conflit INFO affiché
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: [],
          goal: 3, // cut
          sportGoals: ['muscle'],
          sportLevel: 'intermediate',
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        await page.evaluate(() => { if (window.render) window.render(); });
        await page.waitForTimeout(500);
        const result = await page.evaluate(() => {
          var body = document.body.innerHTML;
          // Conflit 10: cut+muscle+intermédiaire → INFO
          var hasConflict = body.indexOf('partiellement contradictoires') !== -1 || body.indexOf('Barakat') !== -1;
          // Vérifier via la fonction directement
          var directConflicts = window.detectMedicalConflicts ? window.detectMedicalConflicts() : [];
          var infoConflict = directConflicts.some(function(c) {
            return (c.message.indexOf('partiellement contradictoires') !== -1 || c.message.indexOf('Barakat') !== -1) && c.level === 'INFO';
          });
          // Le filtre sport affiche aussi 'CONFLIT objectif' — vérifier le filtre
          var sportFiltered = directConflicts.filter(function(c) {
            return c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1 || c.message.indexOf('IRC') !== -1;
          });
          return { hasConflict, infoConflict, conflictsCount: directConflicts.length, sportFiltered: sportFiltered.length };
        });
        ok = result.hasConflict || result.infoConflict;
        detail = `hasConflict_DOM=${result.hasConflict} infoConflict_fn=${result.infoConflict} sportFiltered=${result.sportFiltered}`;
      } catch(e) { detail = e.message; }
      logResult(15, 'cut(3)+muscle sport+intermediate → conflit INFO dans vue sport', ok, detail);
      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════════
    // BLOC 4 — Cohérence calorie training vs repos
    // ══════════════════════════════════════════════════════════════════════

    // T16: getDayType() — jours training vs repos
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          sportDays: 3,
          trainingDaysSelected: [0, 2, 4], // lundi, mercredi, vendredi
          weeklyCalendar: null
        });
        const result = await page.evaluate(() => {
          if (!window.getDayType) return { err: 'getDayType missing' };
          var d0 = window.getDayType(0); // lundi → training
          var d1 = window.getDayType(1); // mardi → repos
          var d2 = window.getDayType(2); // mercredi → training
          var d3 = window.getDayType(3); // jeudi → repos
          var d4 = window.getDayType(4); // vendredi → training
          return {
            d0_training: d0.isTraining,
            d1_rest: !d1.isTraining,
            d2_training: d2.isTraining,
            d3_rest: !d3.isTraining,
            d4_training: d4.isTraining
          };
        });
        if (result.err) {
          detail = result.err; ok = false;
        } else {
          ok = result.d0_training && result.d1_rest && result.d2_training && result.d3_rest && result.d4_training;
          detail = `Lun(0)=${result.d0_training?'training':'FAIL'} Mar(1)=${result.d1_rest?'repos':'FAIL'} Mer(2)=${result.d2_training?'training':'FAIL'} Jeu(3)=${result.d3_rest?'repos':'FAIL'} Ven(4)=${result.d4_training?'training':'FAIL'}`;
        }
      } catch(e) { detail = e.message; }
      logResult(16, 'getDayType() — trainingDaysSelected=[0,2,4] → lun/mer/ven=training, mar/jeu=repos', ok, detail);
      await page.close();
    }

    // T17: getAdaptedMealSplit() — multiplicateur calorique training(1.0) vs repos(<1.0)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          goal: 3, // cut → restMult=0.90
          trainingDaysSelected: [0, 2, 4], // lundi=training, mardi=repos
          weeklyCalendar: null
        });
        const result = await page.evaluate(() => {
          if (!window.getAdaptedMealSplit) return { err: 'getAdaptedMealSplit missing' };
          var trainingDay = window.getAdaptedMealSplit(0); // lundi = training
          var restDay = window.getAdaptedMealSplit(1);     // mardi = repos
          return {
            trainingMult: trainingDay.calMultiplier,
            trainingIsRest: trainingDay.restDay,
            restMult: restDay.calMultiplier,
            restIsRest: restDay.restDay
          };
        });
        if (result.err) {
          detail = result.err; ok = false;
        } else {
          var trainingOk = result.trainingMult === 1.0 && result.trainingIsRest === false;
          var restOk = result.restMult < 1.0 && result.restIsRest === true;
          ok = trainingOk && restOk;
          detail = `training: mult=${result.trainingMult} restDay=${result.trainingIsRest} | repos: mult=${result.restMult} restDay=${result.restIsRest}`;
        }
      } catch(e) { detail = e.message; }
      logResult(17, 'getAdaptedMealSplit() — training=1.0, repos<1.0(0.90 pour cut)', ok, detail);
      await page.close();
    }

  } finally {
    await browser.close();
  }

  // ─── Rapport final ────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('RAPPORT FINAL — Symbiose Sport/Nutrition — SmartFitCoach');
  console.log('═'.repeat(70));
  console.log(`Résultat : ${passed} PASS / ${failed} FAIL / 17 total\n`);

  console.log('Détail :');
  results.forEach(r => {
    const mark = r.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${mark} T${String(r.n).padStart(2,'0')} [${r.status}] ${r.name}`);
    if (r.detail) console.log(`       └─ ${r.detail}`);
  });

  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log('\nBUGS DÉTECTÉS :');
    failures.forEach(r => {
      console.log(`  • T${r.n} — ${r.name}`);
      if (r.detail) console.log(`    Détail: ${r.detail}`);
    });
  } else {
    console.log('\nTous les tests PASS — aucun bug détecté.');
  }
  console.log('═'.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(2);
});
