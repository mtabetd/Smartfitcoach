/**
 * Visual QA - User Flow Tests
 * SmartFitCoach - 4 flows complets
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BROWSER_OPTS = {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

const BASE_URL = 'http://127.0.0.1:3000';
const VIEWPORT = { width: 390, height: 844 };

// Profil complet homme 80kg muscu bulk
const PROFILE_BULK = {
  sex: 'homme', age: 28, weight: 80, height: 178,
  goal: 0, activity: 3, sportDays: 4, mealsPerDay: 3,
  regime: 0, allergies: [], intolerances: [],
  whey: true, wantsDessert: false,
  sportType: 'musculation', sportLevel: 'intermediate',
  trainingDaysSelected: [0,1,3,4],
  appMode: 'both', firstName: 'Alex',
  sleep: 7, birthYear: 1996, birthMonth: 6, birthDay: 15,
  weightUnit: 'kg', heightUnit: 'cm', lang: 'fr'
};

async function shot(page, filePath, opts = {}) {
  await page.waitForTimeout(800);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, ...opts });
  console.log('SHOT:', filePath);
}

async function setupPage(browser) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  // Intercept console errors for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [PAGE ERROR]', msg.text().substring(0, 100));
  });

  // Navigate and bypass gate + auth
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // 1) Set gate bypass in sessionStorage
  await page.evaluate(() => {
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });

  // 2) Mock AUTH before reload so it's ready when gate.js runs
  await page.addInitScript(() => {
    // Fake user session
    var _fakeUser = { id: 'qa-test-user', name: 'Alex', email: 'alex@test.com', nom: '', phone: '' };

    // Override AUTH after it loads (use polling)
    function mockAuth() {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return _fakeUser; };
        window.AUTH.ready = function() { return Promise.resolve(); };
        window.AUTH.signOut = function() { return Promise.resolve(); };
        console.log('[QA] AUTH mocked');
        return true;
      }
      return false;
    }

    // Also mock SupaSync to avoid cloud calls
    function mockSupaSync() {
      if (window.SupaSync) {
        window.SupaSync.saveProfile = function() { return Promise.resolve(); };
        window.SupaSync.syncOnLogin = function() { return Promise.resolve(); };
        window.SupaSync.startAutoSync = function() {};
        window.SupaSync.loadProfile = function() { return Promise.resolve(null); };
        console.log('[QA] SupaSync mocked');
        return true;
      }
      return false;
    }

    // Poll until objects are available
    var _authMocked = false;
    var _syncMocked = false;
    var _pollInterval = setInterval(function() {
      if (!_authMocked) _authMocked = mockAuth();
      if (!_syncMocked) _syncMocked = mockSupaSync();
      if (_authMocked && _syncMocked) clearInterval(_pollInterval);
    }, 50);

    // Also set sessionStorage gate immediately
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
  });

  await page.reload({ waitUntil: 'networkidle' });

  // Wait for app to be ready
  await page.waitForFunction(() => {
    return typeof window.render === 'function' &&
           typeof window.S === 'object' &&
           typeof window.AUTH === 'object' &&
           window.AUTH.isLoggedIn();
  }, { timeout: 15000 });

  console.log('  App ready with auth mocked');
  return { context, page };
}

async function setState(page, stateObj) {
  await page.evaluate((state) => {
    Object.assign(window.S, state);
    window.render();
  }, stateObj);
  await page.waitForTimeout(600);
}

// Helper: find best matching element and get its bounding box for cropping
async function findCard(page, selectors) {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        const bb = await el.boundingBox();
        if (bb) return bb;
      }
    } catch(e) {}
  }
  return null;
}

// ─── FLOW 1: Onboarding Nutrition nStep 1→12 ───────────────────────────────
async function flow1_nutrition(browser) {
  console.log('\n=== FLOW 1: Onboarding Nutrition ===');
  const { context, page } = await setupPage(browser);
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/nutrition';

  try {
    const base = { appMode: 'nutrition', view: 'nutrition', firstName: 'Alex' };

    // nStep=1: Prénom + Sexe
    await setState(page, { ...base, nStep: 1, sex: null, goal: null, weight: null, height: null });
    await shot(page, `${DIR}/step1-objectif.png`);

    // nStep=2: Date de naissance / cycle
    await setState(page, { ...base, nStep: 2, sex: 'homme' });
    await shot(page, `${DIR}/step2-sexe.png`);

    // nStep=3: Poids + Taille
    await setState(page, { ...base, nStep: 3, sex: 'homme', birthYear: 1996, birthMonth: 6, birthDay: 15 });
    await shot(page, `${DIR}/step3-age.png`);

    // nStep=4: Objectif + Poids cible
    await setState(page, { ...base, nStep: 4, weight: 80, height: 178 });
    await shot(page, `${DIR}/step4-poids.png`);

    // nStep=5: Activité + Sommeil
    await setState(page, { ...base, nStep: 5, goal: 0, targetWeight: 85 });
    await shot(page, `${DIR}/step5-activite.png`);

    // nStep=6: Body Scan
    await setState(page, { ...base, nStep: 6, activity: 3, sleep: 7 });
    await shot(page, `${DIR}/step6-regime.png`);

    // nStep=7: Provisional Preview
    await setState(page, { ...base, nStep: 7 });
    await shot(page, `${DIR}/step7-allergies.png`);

    // nStep=10: Préférences régime/allergies
    await setState(page, { ...base, nStep: 10, regime: 0, allergies: [], mealsPerDay: 3 });
    await shot(page, `${DIR}/step7b-preferences.png`);

    // nStep=11: Résultats macros
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        nStep: 11, view: 'nutrition', appMode: 'nutrition',
        sex: 'homme', age: 28, weight: 80, height: 178,
        goal: 0, activity: 3, sleep: 7, regime: 0, allergies: [],
        mealsPerDay: 3, birthYear: 1996, birthMonth: 6, birthDay: 15
      });
      if (window.computeNutritionState) {
        try { window.computeNutritionState(); } catch(e) { console.warn('computeNutritionState:', e.message); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1200);
    await shot(page, `${DIR}/step8-macros.png`);

    // nStep=12: Planning semaine
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        nStep: 12, view: 'nutrition', appMode: 'both', weekPlan: null
      });
      if (window.computeNutritionState) {
        try { window.computeNutritionState(); } catch(e) {}
      }
      if (!window.S.weekPlan && window.generateWeek) {
        try { window.generateWeek(); } catch(e) { console.warn('generateWeek:', e.message); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(2000);
    await shot(page, `${DIR}/step9-plan.png`);

    console.log('  Flow 1 OK');
  } catch(e) {
    console.error('FLOW 1 ERROR:', e.message);
    try { await shot(page, `${DIR}/error-flow1.png`); } catch(_) {}
  }

  await context.close();
}

// ─── FLOW 2: Dashboard avec données réelles ────────────────────────────────
async function flow2_dashboard(browser) {
  console.log('\n=== FLOW 2: Dashboard ===');
  const { context, page } = await setupPage(browser);
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/dashboard';

  try {
    // Inject full profile + generate all data
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'today', nStep: 12, sStep: 4,
        sex: 'homme', age: 28, weight: 80, height: 178,
        goal: 0, activity: 3, sleep: 7, regime: 0, allergies: [],
        mealsPerDay: 3, birthYear: 1996, birthMonth: 6, birthDay: 15,
        firstName: 'Alex', kcal: 3000,
        macros: { proteins: 200, carbs: 350, fats: 83 },
        weekPlan: null, sportProgram: null, selectedDay: 0, whey: true,
        sportType: 'musculation', sportLevel: 'intermediate',
        trainingDaysSelected: [0,1,3,4], appMode: 'both'
      });
      if (window.computeNutritionState) {
        try { window.computeNutritionState(); } catch(e) {}
      }
      if (!window.S.weekPlan && window.generateWeek) {
        try { window.generateWeek(); } catch(e) { console.warn('generateWeek:', e.message); }
      }
      if (!window.S.sportProgram && window.generateMusculationProgram) {
        try { window.generateMusculationProgram(); } catch(e) { console.warn('genMuscu:', e.message); }
      }
      window.render();
    }, PROFILE_BULK);

    await page.waitForTimeout(2000);
    await shot(page, `${DIR}/dashboard-full.png`, { fullPage: true });

    // Re-render for crops (scroll back to top)
    await page.evaluate(() => { window.scrollTo(0, 0); window.render(); });
    await page.waitForTimeout(600);

    // Crop: card macros — look for first card area
    let bb = await findCard(page, [
      '[class*="macro"]', '[id*="macro"]',
      '.today-macros', '[class*="today"]',
      '.card', '[class*="card"]'
    ]);
    if (bb) {
      await shot(page, `${DIR}/card-macros.png`, { clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(390, bb.width), height: Math.min(300, bb.height) } });
    } else {
      await shot(page, `${DIR}/card-macros.png`, { clip: { x: 0, y: 60, width: 390, height: 280 } });
    }

    // Crop: card sport
    bb = await findCard(page, [
      '[class*="sport-card"]', '[class*="session-card"]',
      '[class*="today-sport"]', '[id*="sport"]'
    ]);
    if (bb) {
      await shot(page, `${DIR}/card-sport.png`, { clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(390, bb.width), height: Math.min(300, bb.height) } });
    } else {
      await shot(page, `${DIR}/card-sport.png`, { clip: { x: 0, y: 350, width: 390, height: 280 } });
    }

    // Crop: card repas
    bb = await findCard(page, [
      '[class*="repas"]', '[class*="meal"]', '[class*="recipe"]',
      '[class*="prochaine"]', '[id*="repas"]'
    ]);
    if (bb) {
      await shot(page, `${DIR}/card-repas.png`, { clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(390, bb.width), height: Math.min(300, bb.height) } });
    } else {
      await shot(page, `${DIR}/card-repas.png`, { clip: { x: 0, y: 630, width: 390, height: 280 } });
    }

    console.log('  Flow 2 OK');
  } catch(e) {
    console.error('FLOW 2 ERROR:', e.message);
    try { await shot(page, `${DIR}/error-flow2.png`); } catch(_) {}
  }

  await context.close();
}

// ─── FLOW 3: Programme musculation ────────────────────────────────────────
async function flow3_sport(browser) {
  console.log('\n=== FLOW 3: Programme Sport ===');
  const { context, page } = await setupPage(browser);
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/sport';

  try {
    // sStep=0: Sport type selection
    await setState(page, {
      appMode: 'sport', view: 'sport',
      sStep: 0, sportType: null, sportLevel: null, sportProgram: null,
      weekPlan: null, nStep: 0
    });
    await shot(page, `${DIR}/sport-select-level.png`);

    // sStep=1: muscu goals
    await setState(page, { sStep: 1, sportType: 'musculation', sportGoals: [] });
    await shot(page, `${DIR}/sport-muscu-goals.png`);

    // sStep=2: muscu level
    await setState(page, { sStep: 2, sportType: 'musculation', sportGoals: ['bulk'] });
    await shot(page, `${DIR}/sport-select-days.png`);

    // sStep=3: muscu zones
    await setState(page, { sStep: 3, sportType: 'musculation', sportLevel: 'intermediate', sportGoals: ['bulk'] });
    await shot(page, `${DIR}/sport-muscu-zones.png`);

    // sStep=4: muscu program overview — generate program first
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'sport', appMode: 'both', sStep: 4,
        sportType: 'musculation', sportLevel: 'intermediate',
        sportGoals: ['bulk'],
        sportFocus: { chest: true, back: true, legs: true, shoulders: true },
        trainingDaysSelected: [0, 1, 3, 4],
        selectedSportDay: 0,
        sportProgram: null, weekPlan: null
      });
      if (window.generateMusculationProgram) {
        try { window.generateMusculationProgram(); } catch(e) { console.warn('genMuscu:', e.message); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1500);
    await shot(page, `${DIR}/sport-program-overview.png`);

    // Session detail — click on first session card
    const clicked = await page.evaluate(() => {
      // Try to set selectedSportDay and re-render
      var dayCards = document.querySelectorAll('[onclick*="selectedSportDay"], .session-card, .day-card, [class*="session"]');
      if (dayCards.length > 0) {
        dayCards[0].click();
        return 'clicked:' + dayCards[0].className;
      }
      return 'no-card-found';
    });
    console.log('  Session card click:', clicked);
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/sport-session-detail.png`);

    // Try to expand detail if not already shown
    const expanded = await page.evaluate(() => {
      // Look for expandable sections
      var details = document.querySelectorAll('[class*="exercise"], [class*="exercice"], [class*="seance"]');
      return details.length;
    });
    console.log('  Exercise elements found:', expanded);

    // sStep=16: Charges questionnaire
    await setState(page, { sStep: 16, sportType: 'musculation', sportLevel: 'intermediate' });
    await shot(page, `${DIR}/sport-charges.png`);

    // sStep=15: Dedicated programs
    await setState(page, { sStep: 15, sportType: 'musculation' });
    await shot(page, `${DIR}/sport-dedicated-programs.png`);

    // Go back to program for exercise card zoom
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'sport', appMode: 'both', sStep: 4,
        sportType: 'musculation', sportLevel: 'intermediate',
        selectedSportDay: 0
      });
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1000);

    // Find and crop exercise card
    let bb = await findCard(page, [
      '[class*="exercise-card"]', '[class*="exercice-card"]',
      '[class*="exercise"]', '[class*="exercice"]',
      '[class*="exo"]', '[class*="set-row"]'
    ]);
    if (bb) {
      await shot(page, `${DIR}/sport-exercise-card.png`, {
        clip: { x: Math.max(0, bb.x - 5), y: Math.max(0, bb.y - 5),
                width: Math.min(390, bb.width + 10), height: Math.min(300, bb.height + 10) }
      });
    } else {
      await shot(page, `${DIR}/sport-exercise-card.png`, { clip: { x: 0, y: 200, width: 390, height: 250 } });
    }

    console.log('  Flow 3 OK');
  } catch(e) {
    console.error('FLOW 3 ERROR:', e.message);
    try { await shot(page, `${DIR}/error-flow3.png`); } catch(_) {}
  }

  await context.close();
}

// ─── FLOW 4: Plan nutritionnel semaine ────────────────────────────────────
async function flow4_nutrition_plan(browser) {
  console.log('\n=== FLOW 4: Plan Nutritionnel Semaine ===');
  const { context, page } = await setupPage(browser);
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/nutrition-plan';

  try {
    // Inject full profile + generate week plan
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'nutrition', nStep: 12, appMode: 'both',
        sex: 'homme', age: 28, weight: 80, height: 178,
        goal: 0, activity: 3, sleep: 7, regime: 0, allergies: [],
        mealsPerDay: 3, birthYear: 1996, birthMonth: 6, birthDay: 15,
        firstName: 'Alex', selectedDay: 0,
        kcal: 3000, macros: { proteins: 200, carbs: 350, fats: 83 },
        weekPlan: null
      });
      if (window.computeNutritionState) {
        try { window.computeNutritionState(); } catch(e) {}
      }
      if (!window.S.weekPlan && window.generateWeek) {
        try { window.generateWeek(); } catch(e) { console.warn('generateWeek:', e.message); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(2500);

    // selectedDay=0 (Lundi)
    await page.evaluate(() => { window.S.selectedDay = 0; window.render(); });
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/plan-lundi.png`);

    // selectedDay=2 (Mercredi)
    await page.evaluate(() => { window.S.selectedDay = 2; window.render(); });
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/plan-mercredi.png`);

    // selectedDay=6 (Dimanche)
    await page.evaluate(() => { window.S.selectedDay = 6; window.render(); });
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/plan-dimanche.png`);

    // Meal detail modal — click on first recipe
    await page.evaluate(() => { window.S.selectedDay = 0; window.render(); });
    await page.waitForTimeout(800);

    const mealClicked = await page.evaluate(() => {
      var targets = document.querySelectorAll(
        '[onclick*="recipe"], [onclick*="recette"], [onclick*="modal"], ' +
        '[onclick*="detail"], [class*="recipe-card"], [class*="meal-card"], ' +
        '[class*="repas-card"], .recipe, .meal-item, [class*="meal-name"]'
      );
      if (targets.length > 0) {
        targets[0].click();
        return 'clicked: ' + targets.length + ' targets, first: ' + targets[0].className;
      }
      // Try clicking first section that has meal content
      var any = document.querySelector('[class*="meal"], [class*="repas"]');
      if (any) { any.click(); return 'clicked-any: ' + any.className; }
      return 'nothing-to-click';
    });
    console.log('  Meal click result:', mealClicked);
    await page.waitForTimeout(1200);
    await shot(page, `${DIR}/plan-meal-detail.png`);

    console.log('  Flow 4 OK');
  } catch(e) {
    console.error('FLOW 4 ERROR:', e.message);
    try { await shot(page, `${DIR}/error-flow4.png`); } catch(_) {}
  }

  await context.close();
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch(BROWSER_OPTS);

  try {
    await flow1_nutrition(browser);
    await flow2_dashboard(browser);
    await flow3_sport(browser);
    await flow4_nutrition_plan(browser);
  } finally {
    await browser.close();
  }

  console.log('\nAll flows done. Screenshots in /home/user/Smartfitcoach/visual-screenshots/flows/');
})();
