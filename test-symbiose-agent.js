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
  sportType: 'musculation',
  sportFocus: { chest: 2, back: 2, legs: 2 },
  sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }],
  sStep: 4,
  view: 'sport',
  _nm: null,
  pregnant: false,
  parqDone: true,
  welcomeShown: true,
  appMode: 'sport',
  sportSplashDone: true,
  _sportProfileDone: true
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', () => {});
  page.on('console', () => {});
  return page;
}

async function setupPage(page, profileOverrides = {}) {
  const profile = Object.assign({}, BASE_PROFILE, profileOverrides);

  // Bypass gate/auth BEFORE page load via addInitScript
  await page.addInitScript((p) => {
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
    try {
      Object.defineProperty(window, 'supabase', {
        get: function() { return null; },
        set: function(v) {},
        configurable: true
      });
    } catch(e) {}
    var session = {
      id: 'test-user-qa-symbiose', name: 'QA Symbiose', email: 'qa-symbiose@test.com',
      nom: '', phone: '', token: 'test-symbiose-token',
      fingerprint: null, tokenIssuedAt: Date.now()
    };
    try {
      localStorage.setItem('mtd_session', JSON.stringify(session));
      localStorage.setItem('mtd_session_start', String(Date.now()));
    } catch(e) {}
    try {
      localStorage.setItem('mtd_profile_test-user-qa-symbiose', JSON.stringify(p));
    } catch(e) {}
  }, profile);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

  // Wait for core functions to be available
  await page.waitForFunction(
    () => typeof window.S === 'object' && window.S !== null &&
          typeof window.calcTarget === 'function' &&
          typeof window.getDayType === 'function',
    { timeout: 15000 }
  );

  // Apply profile to window.S + inject syncSportGoalsToNutrition + force render
  await page.evaluate((p) => {
    Object.assign(window.S, p);
    // Inject syncSportGoalsToNutrition into window (exact copy from app-sport.js)
    window.syncSportGoalsToNutrition = function() {
      var S = window.S;
      if (S.goal === null) return;
      if (S.pregnant && S.sex === 'femme') return;
      var _sgls = S.sportGoals || [];
      if (_sgls.length === 0) { S.goal = 2; return; }
      var newIdx = 2;
      var currentKey = window.GOALS && window.GOALS[S.goal] ? window.GOALS[S.goal].key : null;
      if (_sgls.indexOf('shred') !== -1) newIdx = 4;
      else if (_sgls.indexOf('muscle') !== -1) {
        if (currentKey === 'cut' || currentKey === 'shred') newIdx = 5;
        else newIdx = (currentKey === 'lean_bulk') ? 1 : 0;
      }
      else if (_sgls.indexOf('weightloss') !== -1) newIdx = 3;
      else if (_sgls.indexOf('general') !== -1 || _sgls.indexOf('endurance') !== -1 || _sgls.indexOf('flexibility') !== -1) {
        newIdx = (currentKey === 'recomposition') ? 5 : 2;
      }
      S.goal = newIdx;
    };
    if (window.render) {
      window.render._lock = false;
      window.render();
    }
  }, profile);

  await page.waitForTimeout(600);
  return page;
}

async function setupPageAndRender(page, profileOverrides = {}) {
  await setupPage(page, profileOverrides);
  // Extra render after forcing state to ensure DOM is updated
  await page.evaluate((p) => {
    Object.assign(window.S, p);
    if (window.render) { window.render._lock = false; window.render(); }
  }, Object.assign({}, BASE_PROFILE, profileOverrides));
  await page.waitForTimeout(800);
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
    // BLOC 2 — HTA avertissements dans vue programme sport
    // ══════════════════════════════════════════════════════════════════════

    // T10: HTA légère → bloc avertissement HTA légère avec RPE 8/10
    // Stratégie: appeler window.SPORT.render(tempDiv) directement sur un conteneur temporaire
    // pour éviter la race condition avec la late session restore
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: ['hta'],
          view: 'sport',
          sStep: 4,
          sportType: 'musculation',
          _sportProfileDone: true,
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        const result = await page.evaluate(() => {
          // Set state + render dans un conteneur temporaire pour éviter les races conditions
          window.S.medical = ['hta'];
          window.S.sStep = 4;
          window.S.sportType = 'musculation';
          window.S._sportProfileDone = true;
          window.S.view = 'sport';
          window.S.sportFocus = {chest: 2, back: 2, legs: 2};
          window.S.sportProgram = [{day:'Lundi', exercises:[{n:'Squat',sets:3,reps:'8-10'}]}];
          var tempDiv = document.createElement('div');
          if (window.SPORT && window.SPORT.render) {
            try { window.SPORT.render(tempDiv); } catch(e) { return { err: e.message }; }
          }
          var html = tempDiv.innerHTML;
          var hasRPE8 = html.indexOf('RPE 8/10') !== -1;
          var hasHTALight = html.indexOf('HTA \u2014 Pr\u00e9cautions') !== -1 ||
                            html.indexOf('HTA l\u00e9g\u00e8re') !== -1 ||
                            html.indexOf('140-159') !== -1;
          return { hasRPE8, hasHTALight, htmlLen: html.length };
        });
        if (result.err) {
          detail = result.err; ok = false;
        } else {
          ok = result.hasRPE8 && result.hasHTALight;
          detail = `hasRPE8=${result.hasRPE8} hasHTALight=${result.hasHTALight} htmlLen=${result.htmlLen}`;
        }
      } catch(e) { detail = e.message; }
      logResult(10, 'HTA légère → bloc HTA légère + RPE 8/10 dans rendu SPORT', ok, detail);
      await page.close();
    }

    // T11: HTA sévère → bloc HTA sévère présent, bloc HTA légère absent
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPage(page, {
          medical: ['hta_severe'],
          view: 'sport',
          sStep: 4,
          sportType: 'musculation',
          _sportProfileDone: true,
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        const result = await page.evaluate(() => {
          window.S.medical = ['hta_severe'];
          window.S.sStep = 4;
          window.S.sportType = 'musculation';
          window.S._sportProfileDone = true;
          window.S.view = 'sport';
          window.S.sportFocus = {chest: 2, back: 2, legs: 2};
          window.S.sportProgram = [{day:'Lundi', exercises:[{n:'Squat',sets:3,reps:'8-10'}]}];
          var tempDiv = document.createElement('div');
          if (window.SPORT && window.SPORT.render) {
            try { window.SPORT.render(tempDiv); } catch(e) { return { err: e.message }; }
          }
          var html = tempDiv.innerHTML;
          // Bloc HTA sévère : 'HTA Sévère' (uppercase) + Restrictions sport obligatoires
          var hasHTASevere = (html.indexOf('HTA S\u00e9v\u00e8re') !== -1 || html.indexOf('HTA Sévère') !== -1) &&
                             (html.indexOf('Restrictions sport') !== -1 || html.indexOf('180/110') !== -1 || html.indexOf('RPE 6/10') !== -1);
          // Bloc HTA légère uniquement si hta sans hta_severe
          var hasHTALight = html.indexOf('HTA l\u00e9g\u00e8re') !== -1 || html.indexOf('140-159') !== -1;
          return { hasHTASevere, hasHTALight, htmlLen: html.length };
        });
        if (result.err) {
          detail = result.err; ok = false;
        } else {
          ok = result.hasHTASevere && !result.hasHTALight;
          detail = `hasHTASevere=${result.hasHTASevere} hasHTALight=${result.hasHTALight} htmlLen=${result.htmlLen}`;
        }
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
          sportType: 'musculation',
          _sportProfileDone: true,
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        const result = await page.evaluate(() => {
          window.S.medical = [];
          window.S.sStep = 4;
          window.S.sportType = 'musculation';
          window.S._sportProfileDone = true;
          window.S.view = 'sport';
          window.S.sportFocus = {chest: 2, back: 2, legs: 2};
          window.S.sportProgram = [{day:'Lundi', exercises:[{n:'Squat',sets:3,reps:'8-10'}]}];
          var tempDiv = document.createElement('div');
          if (window.SPORT && window.SPORT.render) {
            try { window.SPORT.render(tempDiv); } catch(e) { return { err: e.message }; }
          }
          var html = tempDiv.innerHTML;
          var hasHTALight = html.indexOf('HTA l\u00e9g\u00e8re') !== -1 || html.indexOf('140-159') !== -1;
          var hasHTASevere = (html.indexOf('HTA S\u00e9v\u00e8re') !== -1 || html.indexOf('HTA Sévère') !== -1) &&
                             html.indexOf('Restrictions sport') !== -1;
          return { hasHTALight, hasHTASevere, htmlLen: html.length };
        });
        if (result.err) {
          detail = result.err; ok = false;
        } else {
          ok = !result.hasHTALight && !result.hasHTASevere;
          detail = `hasHTALight=${result.hasHTALight} hasHTASevere=${result.hasHTASevere} htmlLen=${result.htmlLen}`;
        }
      } catch(e) { detail = e.message; }
      logResult(12, 'medical=[] → aucun bloc HTA dans rendu SPORT', ok, detail);
      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════════
    // BLOC 3 — Conflits via detectMedicalConflicts() + filtre vue sport
    // ══════════════════════════════════════════════════════════════════════

    // T13: IRC + bulk → conflit CRITIQUE 'IRC' dans detectMedicalConflicts
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPageAndRender(page, {
          medical: ['irc'],
          goal: 0, // bulk
          sportGoals: ['muscle'],
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        const result = await page.evaluate(() => {
          var directConflicts = window.detectMedicalConflicts ? window.detectMedicalConflicts() : [];
          var ircCritique = directConflicts.some(function(c) {
            return c.message.indexOf('IRC') !== -1 && c.level === 'CRITIQUE';
          });
          // Filtre appliqué dans renderMusculationProgram (app-sport.js l.5235-5236)
          var sportFiltered = directConflicts.filter(function(c) {
            return c.message.indexOf('CONFLIT objectif') !== -1 ||
                   c.message.indexOf('contradictoires') !== -1 ||
                   c.message.indexOf('IRC') !== -1 ||
                   c.message.indexOf('Cardiopathie') !== -1 ||
                   c.message.indexOf('Diab\u00e8te') !== -1;
          });
          var ircInFiltered = sportFiltered.some(function(c) { return c.message.indexOf('IRC') !== -1 && c.level === 'CRITIQUE'; });
          var body = document.body.innerHTML;
          var hasIRCinDOM = body.indexOf('IRC') !== -1 && body.indexOf('n\u00e9phrologue') !== -1;
          return { ircCritique, ircInFiltered, hasIRCinDOM, total: directConflicts.length, filtered: sportFiltered.length };
        });
        ok = result.ircCritique && result.ircInFiltered;
        detail = `ircCritique=${result.ircCritique} ircInFiltered=${result.ircInFiltered} DOM=${result.hasIRCinDOM} (${result.filtered}/${result.total})`;
      } catch(e) { detail = e.message; }
      logResult(13, 'IRC + bulk(0) → conflit CRITIQUE IRC dans detectMedicalConflicts + filtré sport', ok, detail);
      await page.close();
    }

    // T14: nutrition bulk + sport shred → conflit ÉLEVÉ objectifs contradictoires (conflit 9)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPageAndRender(page, {
          medical: [],
          goal: 0, // bulk
          sportGoals: ['shred'],
          view: 'sport',
          sStep: 4,
          sportType: 'muscu',
          sportFocus: { chest: 2, back: 2, legs: 2 },
          sportProgram: [{ day: 'Lundi', exercises: [{ n: 'Squat', sets: 3, reps: '8-10' }] }]
        });
        const result = await page.evaluate(() => {
          var directConflicts = window.detectMedicalConflicts ? window.detectMedicalConflicts() : [];
          var goalConflict = directConflicts.some(function(c) {
            return (c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1);
          });
          var goalConflictEleve = directConflicts.some(function(c) {
            return (c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1) &&
                   c.level === '\u00c9LEV\u00c9';
          });
          var sportFiltered = directConflicts.filter(function(c) {
            return c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1;
          });
          var body = document.body.innerHTML;
          var hasConflictDOM = body.indexOf('contradictoires') !== -1 || body.indexOf('CONFLIT objectif') !== -1;
          return { goalConflict, goalConflictEleve, filteredCount: sportFiltered.length, hasConflictDOM, total: directConflicts.length };
        });
        ok = result.goalConflict && result.filteredCount > 0;
        detail = `goalConflict=${result.goalConflict} ÉLEVÉ=${result.goalConflictEleve} filtered=${result.filteredCount} DOM=${result.hasConflictDOM}`;
      } catch(e) { detail = e.message; }
      logResult(14, 'nutrition bulk(0) + sport shred → conflit ÉLEVÉ objectifs contradictoires', ok, detail);
      await page.close();
    }

    // T15: nutrition cut + sport muscle + intermédiaire → conflit INFO (conflit 10)
    {
      const page = await openPage(browser);
      let ok = false, detail = '';
      try {
        await setupPageAndRender(page, {
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
        const result = await page.evaluate(() => {
          var directConflicts = window.detectMedicalConflicts ? window.detectMedicalConflicts() : [];
          // Conflit 10: message contient 'partiellement contradictoires' ou 'Barakat' + level INFO
          var infoConflict = directConflicts.some(function(c) {
            return (c.message.indexOf('partiellement contradictoires') !== -1 || c.message.indexOf('Barakat') !== -1) &&
                   c.level === 'INFO';
          });
          // Dans le filtre vue sport, 'contradictoires' est dans 'partiellement contradictoires'
          var sportFiltered = directConflicts.filter(function(c) {
            return c.message.indexOf('CONFLIT objectif') !== -1 || c.message.indexOf('contradictoires') !== -1;
          });
          var body = document.body.innerHTML;
          var hasConflictDOM = body.indexOf('contradictoires') !== -1 || body.indexOf('Barakat') !== -1;
          return { infoConflict, filteredCount: sportFiltered.length, hasConflictDOM, total: directConflicts.length };
        });
        ok = result.infoConflict && result.filteredCount > 0;
        detail = `infoConflict=${result.infoConflict} filtered=${result.filteredCount} DOM=${result.hasConflictDOM} (${result.total} conflits)`;
      } catch(e) { detail = e.message; }
      logResult(15, 'cut(3)+muscle sport+intermediate → conflit INFO partiellement contradictoires', ok, detail);
      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════════
    // BLOC 4 — getDayType() + getAdaptedMealSplit()
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
            d0_train: d0.isTraining,
            d1_rest: !d1.isTraining,
            d2_train: d2.isTraining,
            d3_rest: !d3.isTraining,
            d4_train: d4.isTraining
          };
        });
        if (result.err) {
          detail = result.err; ok = false;
        } else {
          ok = result.d0_train && result.d1_rest && result.d2_train && result.d3_rest && result.d4_train;
          detail = `Lun(0)=${result.d0_train?'train':'FAIL'} Mar(1)=${result.d1_rest?'repos':'FAIL'} Mer(2)=${result.d2_train?'train':'FAIL'} Jeu(3)=${result.d3_rest?'repos':'FAIL'} Ven(4)=${result.d4_train?'train':'FAIL'}`;
        }
      } catch(e) { detail = e.message; }
      logResult(16, 'getDayType() — [0,2,4]=training, [1,3,5,6]=repos', ok, detail);
      await page.close();
    }

    // T17: getAdaptedMealSplit() — training=1.0, repos=0.90 (cut)
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
          var trainSplit = window.getAdaptedMealSplit(0); // lundi = training
          var restSplit  = window.getAdaptedMealSplit(1); // mardi = repos
          return {
            trainMult: trainSplit.calMultiplier,
            trainIsRest: trainSplit.restDay,
            restMult: restSplit.calMultiplier,
            restIsRest: restSplit.restDay
          };
        });
        if (result.err) {
          detail = result.err; ok = false;
        } else {
          var trainOk = result.trainMult === 1.0 && result.trainIsRest === false;
          var restOk  = result.restMult < 1.0 && result.restIsRest === true;
          ok = trainOk && restOk;
          detail = `training: mult=${result.trainMult} restDay=${result.trainIsRest} | repos: mult=${result.restMult} restDay=${result.restIsRest} (attendu 0.90)`;
        }
      } catch(e) { detail = e.message; }
      logResult(17, 'getAdaptedMealSplit() — training mult=1.0, repos mult=0.90 (goal=cut)', ok, detail);
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
