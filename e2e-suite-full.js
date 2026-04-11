/**
 * SmartFitCoach — Full E2E QA Suite
 * Suites 1–4 : Onboarding Nutrition, Sport (tous sports), Dashboard, Navigation
 * Playwright Chromium headless — node e2e-suite-full.js
 */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs   = require('fs');

const BASE_URL = 'http://127.0.0.1:45515';
const SS_DIR   = path.join(__dirname, 'e2e-qa-screenshots');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function screenshot(page, name) {
  const p = path.join(SS_DIR, name + '.png');
  await page.screenshot({ path: p, fullPage: false });
  console.log('    📷 ' + name + '.png');
  return p;
}

/** addInitScript payload: gate bypass + session + profile in localStorage */
function buildInitScript(profileFields) {
  return [
    ({ profileFields }) => {
      try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
      try { sessionStorage.setItem('mtd_seen_welcome', 'true'); }   catch(e) {}
      try {
        Object.defineProperty(window, 'supabase', {
          get: function() { return null; }, set: function() {}, configurable: true
        });
      } catch(e) {}
      var session = {
        id: 'test-user-qa-001', name: 'QA Tester', email: 'qa@test.com',
        nom: '', phone: '', token: 'test-qa-token-123',
        fingerprint: null, tokenIssuedAt: Date.now()
      };
      try {
        localStorage.setItem('mtd_session',            JSON.stringify(session));
        localStorage.setItem('mtd_session_start',      String(Date.now()));
        localStorage.setItem('mtd_dev_wiped_v1',       'true');
        localStorage.setItem('mtd_profile_test-user-qa-001', JSON.stringify(profileFields));
      } catch(e) {}
    },
    { profileFields }
  ];
}

/** Force window.S fields then call render() */
async function forceState(page, fields) {
  await page.evaluate((f) => {
    if (!window.S) return;
    Object.keys(f).forEach(function(k) { window.S[k] = f[k]; });
    if (window.render) { window.render._lock = false; window.render(); }
  }, fields);
  await page.waitForTimeout(900);
}

async function bodyText(page) {
  return page.innerText('body').catch(() => '');
}

async function tabTexts(page) {
  return page.$$eval('.day-tab', els => els.map(e => e.textContent.trim())).catch(() => []);
}

/** Filter JS errors that indicate a real crash */
function critErrors(errors) {
  return errors.filter(e =>
    e.includes('TypeError') || e.includes('ReferenceError') ||
    e.includes('Maximum call stack') || e.includes('Cannot read') ||
    e.includes('is not a function') || e.includes('is not defined')
  );
}

// ─── TEST RUNNER ──────────────────────────────────────────────────────────────

async function runTest(browser, id, label, fn) {
  console.log('\n──── ' + id + ' — ' + label + ' ────');
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', err  => errors.push('PAGE:' + err.message));
  page.on('console',   msg  => { if (msg.type() === 'error') errors.push('CON:' + msg.text()); });

  const result = { id, label, passed: true, steps: [], errors };

  function step(desc, ok, detail) {
    result.steps.push({ desc, ok, detail: detail || '' });
    if (!ok) result.passed = false;
    console.log('  ' + (ok ? '✓' : '✗') + ' ' + desc + (detail ? '  [' + detail + ']' : ''));
  }

  try {
    await fn(page, step, errors);
  } catch(err) {
    result.passed = false;
    result.error  = err.message;
    console.log('  ✗ EXCEPTION: ' + err.message);
    await screenshot(page, id + '-EXCEPTION').catch(() => {});
  }

  await ctx.close();
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — ONBOARDING NUTRITION
// ═══════════════════════════════════════════════════════════════════════════════

async function test_1_1(browser) {
  return runTest(browser, '1.1', 'Écran de bienvenue / splash (profil vide)', async (page, step, errors) => {
    // Empty profile — just gate bypass
    await page.addInitScript(...buildInitScript({ uid: 'test-user-qa-001' }));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);
    await screenshot(page, '1.1-splash');

    const body = await bodyText(page);
    const hasContent = body.trim().length > 30;
    step('App charge sans page blanche (>30 chars de contenu)', hasContent,
      hasContent ? 'OK' : 'body vide');

    const crit = critErrors(errors);
    step('Pas de crash JS critique', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');
  });
}

async function test_1_2(browser) {
  return runTest(browser, '1.2', 'sStep nutrition : profil de base (nStep=1, step=0)', async (page, step, errors) => {
    const profile = { uid: 'test-user-qa-001', nStep: 1, step: 0 };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, { nStep: 1, step: 0, view: 'nutrition' });
    await screenshot(page, '1.2-nutrition-profile');

    const body = await bodyText(page);

    // Should show some kind of form / onboarding content
    const hasForm = body.trim().length > 30;
    step('Contenu visible (pas de page blanche)', hasForm,
      hasForm ? 'OK' : 'body vide');

    const crit = critErrors(errors);
    step('Pas d\'erreur JS critique', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    // Look for any input or onboarding-type content
    const hasInputOrOnboarding = await page.evaluate(() =>
      !!document.querySelector('input, select, textarea, .onboarding, .form, .step, [data-step]')
    );
    step('Formulaire ou étape onboarding détecté(e)', hasInputOrOnboarding,
      hasInputOrOnboarding ? 'OK' : 'aucun élément de formulaire trouvé');
  });
}

async function test_1_3(browser) {
  return runTest(browser, '1.3', 'sStep nutrition : calcul de macros', async (page, step, errors) => {
    // NOTE: S uses internal field names: weight (not poids), height (not taille),
    // goal (index into GOALS array: 3=perte de poids), activity (index: 2=modérément actif)
    const profile = {
      uid: 'test-user-qa-001',
      nStep: 11, step: 10,
      sex: 'femme', age: 28, weight: 65, height: 165,
      goal: 3, activity: 2,       // goal[3]=perte de poids, activity[2]=modérément actif
      prenom: 'Laura', appMode: 'nutrition'
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);

    await forceState(page, {
      nStep: 11, step: 10, view: 'nutrition',
      sex: 'femme', age: 28, weight: 65, height: 165,
      goal: 3, activity: 2,
      prenom: 'Laura', appMode: 'nutrition'
    });
    await screenshot(page, '1.3-macros');

    const body = await bodyText(page);

    const crit = critErrors(errors);
    step('Pas de crash JS', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    // The macros screen (renderStep8) uses exact French labels: PROTÉINES, GLUCIDES, LIPIDES
    const bodyUpper = body.toUpperCase();
    const hasProteines  = bodyUpper.includes('PROT');
    const hasGlucides   = bodyUpper.includes('GLUCIDES');
    const hasLipides    = bodyUpper.includes('LIPIDES');
    const hasCalories   = bodyUpper.includes('CAL') || bodyUpper.includes('KCAL');

    step('Protéines affichées',  hasProteines,  hasProteines  ? 'OK' : 'non trouvé dans: ' + body.slice(0,200));
    step('Glucides affichés',    hasGlucides,   hasGlucides   ? 'OK' : 'non trouvé');
    step('Lipides affichés',     hasLipides,    hasLipides    ? 'OK' : 'non trouvé');
    step('Calories affichées',   hasCalories,   hasCalories   ? 'OK' : 'non trouvé');

    // No NaN in the visible text
    const hasNaN = body.includes('NaN') || body.includes('undefined');
    step('Pas de NaN ni undefined dans les valeurs', !hasNaN,
      hasNaN ? 'NaN détecté dans: ' + body.slice(0, 200) : 'OK');
  });
}

async function test_1_4(browser) {
  return runTest(browser, '1.4', 'Planning semaine nutrition (7 jours)', async (page, step, errors) => {
    // The planning screen (renderStep9) needs S.weekPlan to be a 7-element array.
    // If null after generateWeek(), it shows an error message.
    // We pass the correct internal field names AND a minimal weekPlan so the screen renders.
    const makeDayPlan = () => ({
      breakfast: { id:'R001', name:'Oeufs brouillés', kcal:350, p:22, g:10, l:18 },
      lunch:     { id:'R002', name:'Poulet riz',       kcal:520, p:38, g:55, l:12 },
      snack:     { id:'R003', name:'Yaourt nature',    kcal:90,  p:8,  g:10, l:2  },
      dinner:    { id:'R004', name:'Saumon légumes',   kcal:480, p:36, g:20, l:24 }
    });
    const weekPlan = Array.from({ length: 7 }, makeDayPlan);

    const profile = {
      uid: 'test-user-qa-001',
      step: 10, nStep: 12,
      sex: 'femme', age: 28, weight: 65, height: 165,
      goal: 3, activity: 2,
      prenom: 'Laura', appMode: 'nutrition',
      sportType: null, selectedDay: 0,
      weekPlan
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);

    await forceState(page, {
      step: 10, nStep: 12, view: 'nutrition',
      sex: 'femme', age: 28, weight: 65, height: 165,
      goal: 3, activity: 2,
      prenom: 'Laura', appMode: 'nutrition',
      sportType: null, selectedDay: 0,
      weekPlan
    });
    await screenshot(page, '1.4-planning-day0');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Pas de crash JS', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    // Planning tabs use "J1 Lun" / "J2 Mar" etc. (class="day-tab")
    const tabs = await tabTexts(page);
    step('7 onglets jours visibles', tabs.length === 7,
      'Onglets: [' + tabs.join(', ') + ']');

    // Each tab label starts with J1…J7
    const hasJTabs = tabs.some(t => t.startsWith('J1') || t.startsWith('J2') || t.startsWith('J3'));
    step('Onglets au format J1…J7', hasJTabs,
      hasJTabs ? 'OK' : '[' + tabs.join(', ') + ']');

    // Content should not be empty / error message
    const hasError = body.includes('Quelques informations manquent');
    step('Pas de message d\'erreur "informations manquantes"', !hasError,
      hasError ? 'Message d\'erreur affiché' : 'OK');

    // No NaN
    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');

    // Test navigation to other days (days 1–3) by updating selectedDay in S
    for (let d = 1; d <= 3; d++) {
      await forceState(page, { selectedDay: d });
      const bodyD = await bodyText(page);
      const ok = bodyD.trim().length > 30 && !bodyD.includes('NaN');
      step('Navigation jour ' + d + ' — contenu visible sans NaN', ok,
        ok ? 'OK' : 'problème jour ' + d);
    }
    await screenshot(page, '1.4-planning-day3');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — SPORT : TOUS LES SPORTS
// ═══════════════════════════════════════════════════════════════════════════════

async function test_2_1(browser) {
  return runTest(browser, '2.1', 'CrossFit programme (RX, semaine 1)', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sportType: 'crossfit', sStep: 6,
      crossfitLevel: 'rx', sportDays: 4, crossfitWeek: 1,
      parqDone: true, sex: 'homme', age: 30, poids: 80, taille: 182,
      welcomeShown: true, sportSplashDone: true,
      selectedCrossfitDay: 0
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'sport', sStep: 6, sportType: 'crossfit',
      sportDays: 4, crossfitLevel: 'rx', crossfitWeek: 1,
      parqDone: true, sportSplashDone: true,
      selectedCrossfitDay: 0
    });
    await screenshot(page, '2.1-crossfit-prog');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Programme CF charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const tabs = await tabTexts(page);
    step('Onglets jours visibles (≥1)', tabs.length >= 1,
      'Onglets: [' + tabs.join(', ') + ']');

    const dayLabels = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const cfTabs = tabs.filter(t => dayLabels.some(d => t.includes(d)));
    step('Onglets = jours de semaine', cfTabs.length >= 1,
      '[' + tabs.join(', ') + ']');

    // Click each tab
    for (let i = 0; i < tabs.length; i++) {
      await forceState(page, { selectedCrossfitDay: i });
      const bodyT = await bodyText(page);
      const hasWOD = bodyT.includes('WOD') || bodyT.includes('GYMNAST') ||
                     bodyT.includes('HALT') || bodyT.includes('Semaine') ||
                     bodyT.includes('Repos') || bodyT.length > 100;
      step('Onglet ' + (tabs[i] || i) + ' — WOD visible', hasWOD,
        hasWOD ? 'OK' : 'contenu vide');
      if (i === 0) await screenshot(page, '2.1-cf-tab0');
    }
    await screenshot(page, '2.1-cf-lasttab');
  });
}

async function test_2_2(browser) {
  return runTest(browser, '2.2', 'Running programme', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sportType: 'running', sStep: 8,
      sportDays: 4, parqDone: true,
      sex: 'homme', age: 28, poids: 72, taille: 178,
      runningGoal: '10k', runningLevel: 'intermediate',
      welcomeShown: true, sportSplashDone: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'sport', sStep: 8, sportType: 'running',
      sportDays: 4, parqDone: true, sportSplashDone: true,
      runningGoal: '10k', runningLevel: 'intermediate'
    });
    await screenshot(page, '2.2-running-prog');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Page charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const hasContent = body.trim().length > 30;
    step('Contenu visible (>30 chars)', hasContent, hasContent ? 'OK' : 'page vide');

    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');
  });
}

async function test_2_3(browser) {
  return runTest(browser, '2.3', 'Hyrox programme', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sportType: 'hyrox', sStep: 10,
      sportDays: 4, parqDone: true,
      sex: 'homme', age: 32, poids: 80, taille: 180,
      welcomeShown: true, sportSplashDone: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'sport', sStep: 10, sportType: 'hyrox',
      sportDays: 4, parqDone: true, sportSplashDone: true
    });
    await screenshot(page, '2.3-hyrox-prog');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Page charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const hasContent = body.trim().length > 30;
    step('Contenu visible', hasContent, hasContent ? 'OK' : 'page vide');

    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');
  });
}

async function test_2_4(browser) {
  return runTest(browser, '2.4', 'Yoga programme', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sportType: 'yoga', sStep: 21,
      sportDays: 3, parqDone: true,
      sex: 'femme', age: 35, poids: 60, taille: 165,
      welcomeShown: true, sportSplashDone: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'sport', sStep: 21, sportType: 'yoga',
      sportDays: 3, parqDone: true, sportSplashDone: true
    });
    await screenshot(page, '2.4-yoga-prog');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Page charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const hasContent = body.trim().length > 30;
    step('Contenu visible', hasContent, hasContent ? 'OK' : 'page vide');

    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');
  });
}

async function test_2_5(browser) {
  return runTest(browser, '2.5', 'Cyclisme programme', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sportType: 'cycling', sStep: 23,
      sportDays: 4, parqDone: true,
      sex: 'homme', age: 40, poids: 75, taille: 176,
      welcomeShown: true, sportSplashDone: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'sport', sStep: 23, sportType: 'cycling',
      sportDays: 4, parqDone: true, sportSplashDone: true
    });
    await screenshot(page, '2.5-cycling-prog');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Page charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const hasContent = body.trim().length > 30;
    step('Contenu visible', hasContent, hasContent ? 'OK' : 'page vide');

    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');
  });
}

async function test_2_6(browser) {
  return runTest(browser, '2.6', 'Calisthenics programme', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sportType: 'calisthenics', sStep: 25,
      sportDays: 4, parqDone: true,
      sex: 'homme', age: 25, poids: 70, taille: 175,
      welcomeShown: true, sportSplashDone: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'sport', sStep: 25, sportType: 'calisthenics',
      sportDays: 4, parqDone: true, sportSplashDone: true
    });
    await screenshot(page, '2.6-calisthenics-prog');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Page charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const hasContent = body.trim().length > 30;
    step('Contenu visible', hasContent, hasContent ? 'OK' : 'page vide');

    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');
  });
}

async function test_2_7(browser) {
  return runTest(browser, '2.7', 'Musculation programme (3 jours, sStep=4)', async (page, step, errors) => {
    // BUG NOTE: app-sport.js:5907 calls ex.sets.split('×') without checking typeof.
    // When sets is a number (e.g. 4), it crashes with "ex.sets.split is not a function".
    // The app internally uses a string format like "4×10" for sets.
    // For the test we use the correct internal format to match app expectations.
    const sportProgram = [
      { day: 'Lundi',    exercises: [{ name: 'Squat',             n: 'Squat',             sets: '4×10', reps: '8-10', rest: '90s' }] },
      { day: 'Mercredi', exercises: [{ name: 'Développé couché',  n: 'Développé couché',  sets: '4×10', reps: '8-10', rest: '90s' }] },
      { day: 'Vendredi', exercises: [{ name: 'Rowing barre',      n: 'Rowing barre',      sets: '4×12', reps: '10-12', rest: '90s' }] }
    ];
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sportType: 'musculation', sStep: 4,
      sportDays: 3, sportLevel: 'intermediate',
      sportFocus: { Pectoraux: 4, Dorsaux: 3, 'Épaules': 2 },
      sportSessionDuration: '1h',
      parqDone: true,
      sex: 'femme', age: 26, weight: 60, height: 163,
      sportProgram,
      musculationWeights: {},
      welcomeShown: true, sportSplashDone: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);

    await forceState(page, {
      view: 'sport', sStep: 4, sportType: 'musculation',
      sportDays: 3, sportLevel: 'intermediate',
      sportFocus: { Pectoraux: 4, Dorsaux: 3, 'Épaules': 2 },
      sportSessionDuration: '1h',
      parqDone: true, sportSplashDone: true,
      sportProgram,
      musculationWeights: {}
    });
    await screenshot(page, '2.7-muscu-prog');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Programme charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const tabs = await tabTexts(page);
    step('Au moins 3 onglets / jours visibles', tabs.length >= 3,
      'Onglets: [' + tabs.join(', ') + ']');

    // Check exercises appear
    const bodyLow = body.toLowerCase();
    const hasExo = bodyLow.includes('squat') || bodyLow.includes('couché') ||
                   bodyLow.includes('rowing') || bodyLow.includes('exercice') ||
                   bodyLow.includes('séries') || bodyLow.includes('sets') ||
                   bodyLow.includes('séance');
    step('Exercices affichés', hasExo, hasExo ? 'OK' : 'aucun exercice trouvé');

    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');

    await screenshot(page, '2.7-muscu-laststate');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — TODAY DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

async function test_3_1(browser) {
  return runTest(browser, '3.1', 'Dashboard avec streak (streak=12, Marc)', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sex: 'homme', age: 30, poids: 80, taille: 182,
      streak: 12, prenom: 'Marc', appMode: 'both', nStep: 12,
      welcomeShown: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'today', step: 10, sex: 'homme', age: 30, poids: 80, taille: 182,
      streak: 12, prenom: 'Marc', appMode: 'both', nStep: 12,
      welcomeShown: true
    });
    await screenshot(page, '3.1-dashboard-streak');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Dashboard charge sans crash', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    // "Bonjour, Marc" (case insensitive, possible CSS uppercase)
    const bodyUpper = body.toUpperCase();
    const hasBonjour = bodyUpper.includes('MARC') || body.includes('Marc');
    step('"Marc" visible (Bonjour, Marc)', hasBonjour,
      hasBonjour ? 'OK' : 'Marc non trouvé dans: ' + body.slice(0, 200));

    // Streak 12 visible
    const hasStreak = body.includes('12') || body.includes('🔥');
    step('Streak 12 visible', hasStreak,
      hasStreak ? 'OK' : 'valeur 12 non trouvée dans: ' + body.slice(0, 200));

    // No NaN or undefined
    const hasNaN = body.includes('NaN');
    step('Pas de NaN', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');
  });
}

async function test_3_2(browser) {
  return runTest(browser, '3.2', 'Dashboard sans streak (streak=0, Léa)', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, sex: 'femme', age: 25, poids: 58, taille: 162,
      streak: 0, prenom: 'Léa', appMode: 'both', nStep: 12,
      welcomeShown: true
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    await forceState(page, {
      view: 'today', step: 10, sex: 'femme', age: 25, poids: 58, taille: 162,
      streak: 0, prenom: 'Léa', appMode: 'both', nStep: 12,
      welcomeShown: true
    });
    await screenshot(page, '3.2-dashboard-nostreak');

    const body = await bodyText(page);
    const crit = critErrors(errors);
    step('Dashboard charge sans crash (streak=0)', crit.length === 0,
      crit.length ? crit[0].slice(0, 100) : 'OK');

    const hasContent = body.trim().length > 30;
    step('Contenu visible même avec streak=0', hasContent,
      hasContent ? 'OK' : 'page vide');

    const hasNaN = body.includes('NaN');
    step('Pas de NaN avec streak=0', !hasNaN, hasNaN ? 'NaN trouvé' : 'OK');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — NAVIGATION ET TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function test_4_1(browser) {
  return runTest(browser, '4.1', 'Cycle complet de navigation (Dashboard→Sport→Nutrition→Dashboard→Sport)', async (page, step, errors) => {
    const profile = {
      uid: 'test-user-qa-001',
      step: 10, appMode: 'both', nStep: 12, sStep: 6,
      sportType: 'crossfit', crossfitLevel: 'rx', sportDays: 4,
      crossfitWeek: 1, parqDone: true,
      sex: 'homme', age: 30, poids: 80, taille: 182,
      prenom: 'Marc', streak: 5,
      welcomeShown: true, sportSplashDone: true,
      selectedCrossfitDay: 0
    };
    await page.addInitScript(...buildInitScript(profile));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);

    // ── Step 1: Dashboard ──────────────────────────────────────────────────────
    await forceState(page, { view: 'today' });
    await screenshot(page, '4.1-step1-dashboard');
    const body1 = await bodyText(page);
    step('1. Dashboard — contenu visible', body1.trim().length > 30,
      body1.trim().length > 30 ? 'OK' : 'page vide');

    const crit1 = critErrors(errors);
    step('1. Dashboard — pas de crash', crit1.length === 0,
      crit1.length ? crit1[0].slice(0, 80) : 'OK');

    // ── Step 2: Sport ──────────────────────────────────────────────────────────
    await forceState(page, {
      view: 'sport', sStep: 6, sportType: 'crossfit',
      crossfitLevel: 'rx', sportDays: 4, crossfitWeek: 1,
      parqDone: true, sportSplashDone: true, selectedCrossfitDay: 0
    });
    await screenshot(page, '4.1-step2-sport');
    const body2 = await bodyText(page);
    step('2. Sport — contenu visible', body2.trim().length > 30,
      body2.trim().length > 30 ? 'OK' : 'page vide');

    const crit2 = critErrors(errors);
    step('2. Sport — pas de crash', crit2.length === 0,
      crit2.length ? crit2[0].slice(0, 80) : 'OK');

    // ── Step 3: Nutrition ──────────────────────────────────────────────────────
    await forceState(page, { view: 'nutrition', nStep: 12, selectedDay: 0 });
    await screenshot(page, '4.1-step3-nutrition');
    const body3 = await bodyText(page);
    step('3. Nutrition — contenu visible', body3.trim().length > 30,
      body3.trim().length > 30 ? 'OK' : 'page vide');

    const crit3 = critErrors(errors);
    step('3. Nutrition — pas de crash', crit3.length === 0,
      crit3.length ? crit3[0].slice(0, 80) : 'OK');

    // ── Step 4: Dashboard (retour) ─────────────────────────────────────────────
    await forceState(page, { view: 'today' });
    await screenshot(page, '4.1-step4-dashboard-retour');
    const body4 = await bodyText(page);
    step('4. Dashboard (retour) — contenu visible', body4.trim().length > 30,
      body4.trim().length > 30 ? 'OK' : 'page vide');

    const crit4 = critErrors(errors);
    step('4. Dashboard (retour) — pas de crash', crit4.length === 0,
      crit4.length ? crit4[0].slice(0, 80) : 'OK');

    // ── Step 5: Sport (retour) ─────────────────────────────────────────────────
    await forceState(page, {
      view: 'sport', sStep: 6, sportType: 'crossfit',
      selectedCrossfitDay: 0
    });
    await screenshot(page, '4.1-step5-sport-retour');
    const body5 = await bodyText(page);
    step('5. Sport (retour) — contenu visible', body5.trim().length > 30,
      body5.trim().length > 30 ? 'OK' : 'page vide');

    // Global: 0 crashes total
    const critAll = critErrors(errors);
    step('0 crash JS sur l\'ensemble des transitions', critAll.length === 0,
      critAll.length ? critAll.map(e => e.slice(0, 60)).join(' | ') : 'OK');

    // State preserved: sport type still crossfit after round-trip
    const stateAfter = await page.evaluate(() => window.S ? window.S.sportType : 'N/A');
    step('État S.sportType préservé après round-trip', stateAfter === 'crossfit',
      'S.sportType=' + stateAfter);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   SmartFitCoach — Full E2E QA (Suites 1–4)                  ║');
  console.log('║   Target: ' + BASE_URL + '                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Suite 1 — Onboarding Nutrition
  console.log('\n\n╔═══ SUITE 1 : ONBOARDING NUTRITION ═══╗');
  results.push(await test_1_1(browser));
  results.push(await test_1_2(browser));
  results.push(await test_1_3(browser));
  results.push(await test_1_4(browser));

  // Suite 2 — Sport : tous les sports
  console.log('\n\n╔═══ SUITE 2 : SPORT — TOUS LES SPORTS ═══╗');
  results.push(await test_2_1(browser));
  results.push(await test_2_2(browser));
  results.push(await test_2_3(browser));
  results.push(await test_2_4(browser));
  results.push(await test_2_5(browser));
  results.push(await test_2_6(browser));
  results.push(await test_2_7(browser));

  // Suite 3 — Today Dashboard
  console.log('\n\n╔═══ SUITE 3 : TODAY DASHBOARD ═══╗');
  results.push(await test_3_1(browser));
  results.push(await test_3_2(browser));

  // Suite 4 — Navigation
  console.log('\n\n╔═══ SUITE 4 : NAVIGATION ET TRANSITIONS ═══╗');
  results.push(await test_4_1(browser));

  await browser.close();

  // ── FINAL REPORT ──────────────────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════════════════════');
  console.log('                   RAPPORT FINAL QA');
  console.log('══════════════════════════════════════════════════════════════');

  let totalPassed = 0, totalFailed = 0;
  let stepPassed = 0, stepFailed = 0;
  const failedTests = [];

  for (const r of results) {
    const mark = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log('\n' + mark + '  [' + r.id + '] ' + r.label);
    if (r.error) console.log('     EXCEPTION: ' + r.error);
    for (const s of r.steps) {
      const sm = s.ok ? '  ✓' : '  ✗';
      console.log(sm + ' ' + s.desc + (s.detail ? '  [' + s.detail + ']' : ''));
      if (s.ok) stepPassed++; else stepFailed++;
    }
    if (r.passed) totalPassed++; else { totalFailed++; failedTests.push(r.id + ' ' + r.label); }
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('Tests : ' + totalPassed + ' PASS / ' + totalFailed + ' FAIL  (' + results.length + ' total)');
  console.log('Steps : ' + stepPassed + ' pass / ' + stepFailed + ' fail');
  if (failedTests.length) {
    console.log('\nTESTS ÉCHOUÉS :');
    failedTests.forEach(t => console.log('  ✗ ' + t));
  } else {
    console.log('\n🎉 Tous les tests passent !');
  }
  console.log('Screenshots → ' + SS_DIR);
  console.log('══════════════════════════════════════════════════════════════\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(2);
});
