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

// Profil complet homme 80kg muscu bulk — sportFocus avec clés françaises et étoiles 1-5
const PROFILE_BULK = {
  sex: 'homme', age: 28, weight: 80, height: 178,
  goal: 0, activity: 3, sportDays: 4, mealsPerDay: 3,
  regime: 0, allergies: [], intolerances: [],
  whey: true, wantsDessert: false,
  sportType: 'musculation', sportLevel: 'intermediate',
  sportGoals: ['muscle', 'bulk'],
  // Clés françaises BODY_ZONES = ['Poitrine','Dos','Épaules','Bras','Abdominaux','Jambes','Fessiers','Cardio']
  sportFocus: { 'Poitrine': 4, 'Dos': 5, 'Épaules': 3, 'Jambes': 4, 'Bras': 3 },
  trainingDaysSelected: [0,1,3,4],
  appMode: 'both', firstName: 'Alex', prenom: 'Alex',
  sleep: 7, birthYear: 1996, birthMonth: 6, birthDay: 15,
  weightUnit: 'kg', heightUnit: 'cm', lang: 'fr',
  _sportProfileDone: true
};

async function shot(page, filePath, opts = {}) {
  await page.waitForTimeout(800);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    await page.screenshot({ path: filePath, ...opts });
    console.log('SHOT:', filePath);
  } catch(e) {
    // If clip fails, take full viewport screenshot
    console.warn('  SHOT FALLBACK (clip err):', filePath, '-', e.message.substring(0, 60));
    const fallbackPath = filePath.replace('.png', '-fallback.png');
    await page.screenshot({ path: fallbackPath });
    // Also write the intended path as a copy
    await page.screenshot({ path: filePath });
    console.log('SHOT (fallback):', filePath);
  }
}

async function setupPage(browser) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [PAGE ERR]', msg.text().substring(0, 120));
    if (msg.type() === 'warning' && msg.text().includes('[sport]')) console.log('  [SPORT]', msg.text().substring(0, 120));
  });

  await page.addInitScript(() => {
    // Gate bypass
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}

    // Suppress onboarding-complete overlay
    try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}

    var _fakeUser = { id: 'qa-test-user', name: 'Alex', email: 'alex@test.com', nom: '', phone: '' };

    function mockAuth() {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return _fakeUser; };
        window.AUTH.ready = function() { return Promise.resolve(); };
        window.AUTH.signOut = function() { return Promise.resolve(); };
        return true;
      }
      return false;
    }

    function mockSupaSync() {
      if (window.SupaSync) {
        window.SupaSync.saveProfile = function() { return Promise.resolve(); };
        window.SupaSync.syncOnLogin = function() { return Promise.resolve(); };
        window.SupaSync.startAutoSync = function() {};
        window.SupaSync.loadProfile = function() { return Promise.resolve(null); };
        return true;
      }
      return false;
    }

    // Also mock saveProfile / loadProfile to prevent Supabase calls
    function mockGlobals() {
      if (window.saveProfile) { window.saveProfile = function() {}; }
      if (window.loadProfile) { window.loadProfile = function() {}; }
    }

    var _authMocked = false;
    var _syncMocked = false;
    var _interval = setInterval(function() {
      if (!_authMocked) _authMocked = mockAuth();
      if (!_syncMocked) _syncMocked = mockSupaSync();
      mockGlobals();
      if (_authMocked && _syncMocked) clearInterval(_interval);
    }, 30);
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  await page.waitForFunction(() => {
    return typeof window.render === 'function' &&
           typeof window.S === 'object' &&
           typeof window.AUTH === 'object' &&
           window.AUTH.isLoggedIn();
  }, { timeout: 15000 });

  console.log('  App ready');
  return { context, page };
}

async function setState(page, stateObj) {
  await page.evaluate((state) => {
    Object.assign(window.S, state);
    // Also suppress OnboardingComplete
    try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
    window.render();
  }, stateObj);
  await page.waitForTimeout(700);
}

async function findCard(page, selectors) {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        const bb = await el.boundingBox();
        if (bb && bb.width > 50 && bb.height > 30) return bb;
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

  const base = { appMode: 'nutrition', view: 'nutrition', firstName: 'Alex', prenom: 'Alex' };

  try {
    // nStep=1: Prénom + Sexe
    await setState(page, { ...base, nStep: 1, sex: null });
    await shot(page, `${DIR}/step1-objectif.png`);

    // nStep=2: Date de naissance
    await setState(page, { ...base, nStep: 2, sex: 'homme' });
    await shot(page, `${DIR}/step2-sexe.png`);

    // nStep=3: Poids + Taille
    await setState(page, { ...base, nStep: 3, sex: 'homme', birthYear: 1996, birthMonth: 6, birthDay: 15 });
    await shot(page, `${DIR}/step3-age.png`);

    // nStep=4: Objectif
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

    // nStep=10: Préférences
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
      try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
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
    await page.waitForTimeout(2500);
    // Dismiss onboarding overlay if still present
    await page.evaluate(() => {
      var ov = document.getElementById('onboarding-complete-overlay');
      if (ov) ov.remove();
    });
    await page.waitForTimeout(300);
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
    await page.evaluate((profile) => {
      try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
      Object.assign(window.S, profile, {
        view: 'today', nStep: 12, sStep: 0,
        sex: 'homme', age: 28, weight: 80, height: 178,
        goal: 0, activity: 3, sleep: 7, regime: 0, allergies: [],
        mealsPerDay: 3, birthYear: 1996, birthMonth: 6, birthDay: 15,
        firstName: 'Alex', prenom: 'Alex',
        kcal: 3000,
        macros: { proteins: 200, carbs: 350, fats: 83 },
        weekPlan: null, sportProgram: null, selectedDay: 0, whey: true,
        sportType: 'musculation', sportLevel: 'intermediate',
        sportGoals: ['muscle'], trainingDaysSelected: [0,1,3,4],
        sportFocus: { 'Poitrine': 4, 'Dos': 5, 'Épaules': 3, 'Jambes': 4, 'Bras': 3 },
        appMode: 'both', _sportProfileDone: true
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
      // If still no sport program, try generateSportProgram
      if (!window.S.sportProgram && window.generateSportProgram) {
        try { window.S.sportProgram = window.generateSportProgram(); } catch(e) { console.warn('genSport:', e.message); }
      }
      window.render();
    }, PROFILE_BULK);

    await page.waitForTimeout(2000);
    // Remove any onboarding overlay
    await page.evaluate(() => {
      var ov = document.getElementById('onboarding-complete-overlay');
      if (ov) ov.remove();
    });
    await page.waitForTimeout(300);
    await shot(page, `${DIR}/dashboard-full.png`, { fullPage: true });

    await page.evaluate(() => { window.scrollTo(0, 0); });
    await page.waitForTimeout(400);

    // card-macros: find nutrition/macros card
    let bb = await findCard(page, [
      '[class*="macros"]', '[class*="macro"]',
      '[class*="nutrition-card"]', '[class*="today-section"]'
    ]);
    if (!bb) bb = { x: 0, y: 60, width: 390, height: 280 };
    await shot(page, `${DIR}/card-macros.png`, {
      clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(390, bb.width), height: Math.min(320, bb.height) }
    });

    // card-sport
    bb = await findCard(page, ['[class*="sport"]', '[id*="sport"]']);
    if (!bb) bb = { x: 0, y: 380, width: 390, height: 280 };
    await shot(page, `${DIR}/card-sport.png`, {
      clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(390, bb.width), height: Math.min(320, bb.height) }
    });

    // card-repas
    bb = await findCard(page, ['[class*="repas"]', '[class*="meal"]', '[class*="recipe"]']);
    if (!bb) bb = { x: 0, y: 660, width: 390, height: 280 };
    await shot(page, `${DIR}/card-repas.png`, {
      clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(390, bb.width), height: Math.min(320, bb.height) }
    });

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
    // sStep=0: Sport type selection — appMode='both' pour éviter QuickProfile guard
    await setState(page, {
      appMode: 'both', view: 'sport', nStep: 12,
      sStep: 0, sportType: null, sportLevel: null, sportProgram: null,
      weekPlan: null, sex: 'homme', age: 28, weight: 80, height: 178,
      _sportProfileDone: true
    });
    await shot(page, `${DIR}/sport-select-level.png`);

    // sStep=1: muscu goals — need sportType set + appMode=both
    await setState(page, {
      sStep: 1, sportType: 'musculation', sportGoals: [],
      appMode: 'both', _sportProfileDone: true
    });
    await shot(page, `${DIR}/sport-muscu-goals.png`);

    // sStep=2: muscu level
    await setState(page, {
      sStep: 2, sportType: 'musculation', sportGoals: ['muscle'],
      appMode: 'both', _sportProfileDone: true
    });
    await shot(page, `${DIR}/sport-select-days.png`);

    // sStep=3: muscu zones (zones + priorités)
    await setState(page, {
      sStep: 3, sportType: 'musculation', sportLevel: 'intermediate',
      sportGoals: ['muscle'], sportFocus: {},
      appMode: 'both', _sportProfileDone: true
    });
    await shot(page, `${DIR}/sport-muscu-zones.png`);

    // sStep=4: programme overview — generate program with correct French zone keys
    await page.evaluate((profile) => {
      try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
      Object.assign(window.S, profile, {
        view: 'sport', appMode: 'both', sStep: 4,
        nStep: 12,
        sportType: 'musculation', sportLevel: 'intermediate',
        sportGoals: ['muscle'],
        sportFocus: { 'Poitrine': 4, 'Dos': 5, 'Épaules': 3, 'Jambes': 4, 'Bras': 3 },
        trainingDaysSelected: [0, 1, 3, 4],
        sportDays: 4,
        selectedSportDay: 0,
        sportProgram: null,
        _sportProfileDone: true,
        sex: 'homme', age: 28, weight: 80, height: 178
      });
      // Generate program
      if (window.generateMusculationProgram) {
        try {
          window.generateMusculationProgram();
          console.log('[QA] generateMusculationProgram done, program length:', window.S.sportProgram ? window.S.sportProgram.length : 0);
        } catch(e) { console.warn('[QA] genMuscu err:', e.message); }
      }
      // Fallback to generateSportProgram
      if ((!window.S.sportProgram || window.S.sportProgram.length === 0) && window.generateSportProgram) {
        try {
          var prog = window.generateSportProgram();
          if (prog && prog.length > 0) { window.S.sportProgram = prog; console.log('[QA] generateSportProgram done:', prog.length); }
        } catch(e) { console.warn('[QA] genSport err:', e.message); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1800);
    await shot(page, `${DIR}/sport-program-overview.png`);

    // Session detail — click first day tab or session
    await page.evaluate(() => {
      // Try to find day tabs and click day 0
      var dayBtns = document.querySelectorAll('[onclick*="selectedSportDay"]');
      if (dayBtns.length > 0) { dayBtns[0].click(); return; }
      // Try .day-tab, .session-tab
      var tabs = document.querySelectorAll('.day-tab, .session-tab, [class*="day-btn"]');
      if (tabs.length > 0) { tabs[0].click(); return; }
      // Set selectedSportDay=0 and re-render
      window.S.selectedSportDay = 0;
      window.render();
    });
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/sport-session-detail.png`);

    // sStep=16: Charges questionnaire
    await setState(page, {
      sStep: 16, sportType: 'musculation', sportLevel: 'intermediate',
      appMode: 'both', _sportProfileDone: true
    });
    await shot(page, `${DIR}/sport-charges.png`);

    // sStep=15: Dedicated programs
    await setState(page, {
      sStep: 15, sportType: 'musculation',
      appMode: 'both', _sportProfileDone: true
    });
    await shot(page, `${DIR}/sport-dedicated-programs.png`);

    // Exercise card zoom: back to sStep=4 and crop an exercise card
    await page.evaluate((profile) => {
      try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
      Object.assign(window.S, profile, {
        view: 'sport', appMode: 'both', sStep: 4, nStep: 12,
        sportType: 'musculation', sportLevel: 'intermediate',
        sportGoals: ['muscle'],
        sportFocus: { 'Poitrine': 4, 'Dos': 5, 'Épaules': 3, 'Jambes': 4, 'Bras': 3 },
        trainingDaysSelected: [0, 1, 3, 4], sportDays: 4,
        selectedSportDay: 0, _sportProfileDone: true,
        sex: 'homme', age: 28, weight: 80, height: 178
      });
      if (!window.S.sportProgram && window.generateMusculationProgram) {
        try { window.generateMusculationProgram(); } catch(e) {}
      }
      if (!window.S.sportProgram && window.generateSportProgram) {
        try { var p2 = window.generateSportProgram(); if (p2 && p2.length) window.S.sportProgram = p2; } catch(e) {}
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1200);

    // Try to find first exercise card element — full page screenshot as safe fallback
    const exBb = await findCard(page, [
      '[class*="exercise-card"]', '[class*="exercice-card"]',
      '[class*="exercise-row"]', '[class*="exo-row"]',
      '.exercise', '.exercice'
    ]);
    if (exBb && exBb.x >= 0 && exBb.y >= 0 && exBb.width > 0 && exBb.height > 0) {
      const clipX = Math.max(0, Math.floor(exBb.x) - 4);
      const clipY = Math.max(0, Math.floor(exBb.y) - 4);
      const clipW = Math.min(390 - clipX, Math.ceil(exBb.width) + 8);
      const clipH = Math.min(320, Math.ceil(exBb.height) + 8);
      if (clipW > 10 && clipH > 10) {
        await shot(page, `${DIR}/sport-exercise-card.png`, {
          clip: { x: clipX, y: clipY, width: clipW, height: clipH }
        });
      } else {
        await shot(page, `${DIR}/sport-exercise-card.png`);
      }
    } else {
      // No exercise card found — full viewport fallback
      await shot(page, `${DIR}/sport-exercise-card.png`);
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
    // Generate week plan + suppress onboarding overlay
    await page.evaluate((profile) => {
      try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
      Object.assign(window.S, profile, {
        view: 'nutrition', nStep: 12, appMode: 'both',
        sex: 'homme', age: 28, weight: 80, height: 178,
        goal: 0, activity: 3, sleep: 7, regime: 0, allergies: [],
        mealsPerDay: 3, birthYear: 1996, birthMonth: 6, birthDay: 15,
        firstName: 'Alex', prenom: 'Alex', selectedDay: 0,
        kcal: 3000, macros: { proteins: 200, carbs: 350, fats: 83 },
        weekPlan: null, _sportProfileDone: true
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
    // Dismiss overlay
    await page.evaluate(() => {
      var ov = document.getElementById('onboarding-complete-overlay');
      if (ov) ov.remove();
    });
    await page.waitForTimeout(300);

    const hasWeekPlan = await page.evaluate(() => !!(window.S.weekPlan && window.S.weekPlan.length > 0));
    console.log('  weekPlan generated:', hasWeekPlan);

    // Lundi (selectedDay=0)
    await page.evaluate(() => { window.S.selectedDay = 0; window.render(); });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      var ov = document.getElementById('onboarding-complete-overlay');
      if (ov) ov.remove();
    });
    await shot(page, `${DIR}/plan-lundi.png`);

    // Mercredi (selectedDay=2)
    await page.evaluate(() => { window.S.selectedDay = 2; window.render(); });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      var ov = document.getElementById('onboarding-complete-overlay');
      if (ov) ov.remove();
    });
    await shot(page, `${DIR}/plan-mercredi.png`);

    // Dimanche (selectedDay=6)
    await page.evaluate(() => { window.S.selectedDay = 6; window.render(); });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      var ov = document.getElementById('onboarding-complete-overlay');
      if (ov) ov.remove();
    });
    await shot(page, `${DIR}/plan-dimanche.png`);

    // Meal detail modal: click first meal card
    await page.evaluate(() => {
      window.S.selectedDay = 0;
      window.render();
    });
    await page.waitForTimeout(800);

    const mealClicked = await page.evaluate(() => {
      // Try cards with onclick that open a modal/detail
      var targets = document.querySelectorAll('.meal-card, [class*="meal-card"], [class*="recipe-card"], [class*="repas-card"]');
      if (targets.length > 0) { targets[0].click(); return 'meal-card x' + targets.length; }
      // Broader onclick targets
      var oc = document.querySelectorAll('[onclick*="recipe"], [onclick*="detail"], [onclick*="modal"]');
      if (oc.length > 0) { oc[0].click(); return 'onclick x' + oc.length; }
      // Try first clickable element in nutrition plan area
      var any = document.querySelector('.meal, [class*="meal"]:not([class*="macros"])');
      if (any) { any.click(); return 'any-meal: ' + any.className; }
      return 'nothing';
    });
    console.log('  Meal click:', mealClicked);
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
