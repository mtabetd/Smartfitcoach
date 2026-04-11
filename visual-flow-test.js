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
  appMode: 'both', firstName: 'Alex'
};

async function shot(page, filePath, opts = {}) {
  await page.waitForTimeout(800);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, ...opts });
  console.log('SHOT:', filePath);
}

async function grantGateAccess(page) {
  await page.evaluate(() => {
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });
}

async function waitForApp(page) {
  await page.waitForFunction(() => {
    return typeof window.render === 'function' && typeof window.S === 'object';
  }, { timeout: 10000 });
}

async function setState(page, stateObj) {
  await page.evaluate((state) => {
    Object.assign(window.S, state);
    window.render();
  }, stateObj);
  await page.waitForTimeout(600);
}

// ─── FLOW 1: Onboarding Nutrition nStep 1→12 ───────────────────────────────
async function flow1_nutrition(browser) {
  console.log('\n=== FLOW 1: Onboarding Nutrition ===');
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/nutrition';

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await grantGateAccess(page);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForApp(page);

    // Set appMode + nStep = 1
    await setState(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, firstName: 'Alex', sex: null, goal: null });
    await shot(page, `${DIR}/step1-objectif.png`);

    // nStep=2 (Prénom+Sexe)
    await setState(page, { nStep: 2, firstName: 'Alex', sex: 'homme' });
    await shot(page, `${DIR}/step2-sexe.png`);

    // nStep=3 (Date naissance / âge)
    await setState(page, { nStep: 3, sex: 'homme', birthYear: 1996, birthMonth: 6, birthDay: 15 });
    await shot(page, `${DIR}/step3-age.png`);

    // nStep=4 (Poids + Taille)
    await setState(page, { nStep: 4, weight: 80, height: 178, goal: 0, targetWeight: 85 });
    await shot(page, `${DIR}/step4-poids.png`);

    // nStep=5 (Activité + Sommeil)
    await setState(page, { nStep: 5, activity: 3, sleep: 7 });
    await shot(page, `${DIR}/step5-activite.png`);

    // nStep=6 (Body Scan)
    await setState(page, { nStep: 6 });
    await shot(page, `${DIR}/step6-regime.png`);

    // nStep=7 (Provisional Preview)
    await setState(page, { nStep: 7 });
    await shot(page, `${DIR}/step7-allergies.png`);

    // nStep=10 (Préférences régime / allergies)
    await setState(page, { nStep: 10, regime: 0, allergies: [], mealsPerDay: 3 });
    await shot(page, `${DIR}/step7b-preferences.png`);

    // nStep=11 (Résultats macros)
    // Need to pre-compute nutrition state
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        nStep: 11,
        view: 'nutrition',
        appMode: 'nutrition',
        sex: 'homme',
        age: 28,
        weight: 80,
        height: 178,
        goal: 0,
        activity: 3,
        sleep: 7,
        regime: 0,
        allergies: [],
        mealsPerDay: 3,
        birthYear: 1996,
        birthMonth: 6,
        birthDay: 15
      });
      // Try to compute nutrition state
      if (window.computeNutritionState) {
        try { window.computeNutritionState(); } catch(e) { console.error('computeNutritionState err:', e); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1000);
    await shot(page, `${DIR}/step8-macros.png`);

    // nStep=12 (Plan semaine)
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        nStep: 12,
        view: 'nutrition',
        appMode: 'nutrition',
      });
      // Try to generate week plan if not present
      if (!window.S.weekPlan && window.generateWeek) {
        try { window.generateWeek(); } catch(e) { console.error('generateWeek err:', e); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1500);
    await shot(page, `${DIR}/step9-plan.png`);

  } catch(e) {
    console.error('FLOW 1 ERROR:', e.message);
    await shot(page, `${DIR}/error-flow1.png`);
  }

  await context.close();
  console.log('Flow 1 done.');
}

// ─── FLOW 2: Dashboard avec données réelles ────────────────────────────────
async function flow2_dashboard(browser) {
  console.log('\n=== FLOW 2: Dashboard ===');
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/dashboard';

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await grantGateAccess(page);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForApp(page);

    // Inject full profile + weekPlan + sport program
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'today',
        nStep: 12,
        sStep: 4, // muscu program step
        sex: 'homme',
        age: 28,
        weight: 80,
        height: 178,
        goal: 0,
        activity: 3,
        sleep: 7,
        regime: 0,
        allergies: [],
        mealsPerDay: 3,
        birthYear: 1996,
        birthMonth: 6,
        birthDay: 15,
        kcal: 3000,
        macros: { proteins: 200, carbs: 350, fats: 83 },
        weekPlan: null,
        sportProgram: null,
        selectedDay: 0,
        whey: true,
        firstName: 'Alex'
      });

      // Try to compute nutrition
      if (window.computeNutritionState) {
        try { window.computeNutritionState(); } catch(e) {}
      }
      // Try to generate week plan
      if (!window.S.weekPlan && window.generateWeek) {
        try { window.generateWeek(); } catch(e) {}
      }
      // Try to generate sport program
      if (!window.S.sportProgram && window.generateMusculationProgram) {
        try { window.generateMusculationProgram(); } catch(e) {}
      }
      window.render();
    }, PROFILE_BULK);

    await page.waitForTimeout(2000);
    await shot(page, `${DIR}/dashboard-full.png`, { fullPage: true });

    // Crop: card macros
    const cardMacros = await page.$('[class*="macro"], [id*="macro"], .macros-card, .card-macros').catch(() => null)
      || await page.$('[class*="card"]').catch(() => null);
    if (cardMacros) {
      const bb = await cardMacros.boundingBox();
      if (bb) {
        await shot(page, `${DIR}/card-macros.png`, { clip: { x: bb.x, y: bb.y, width: bb.width, height: Math.min(bb.height, 300) } });
      }
    } else {
      // Full screenshot cropped to top portion
      await shot(page, `${DIR}/card-macros.png`, { clip: { x: 0, y: 80, width: 390, height: 280 } });
    }

    // Crop: card sport
    const cardSport = await page.$('[class*="sport"], [id*="sport"]').catch(() => null);
    if (cardSport) {
      const bb = await cardSport.boundingBox();
      if (bb) {
        await shot(page, `${DIR}/card-sport.png`, { clip: { x: bb.x, y: bb.y, width: bb.width, height: Math.min(bb.height, 300) } });
      }
    } else {
      await shot(page, `${DIR}/card-sport.png`, { clip: { x: 0, y: 360, width: 390, height: 280 } });
    }

    // Crop: card repas
    const cardRepas = await page.$('[class*="repas"], [class*="meal"], [id*="repas"]').catch(() => null);
    if (cardRepas) {
      const bb = await cardRepas.boundingBox();
      if (bb) {
        await shot(page, `${DIR}/card-repas.png`, { clip: { x: bb.x, y: bb.y, width: bb.width, height: Math.min(bb.height, 300) } });
      }
    } else {
      await shot(page, `${DIR}/card-repas.png`, { clip: { x: 0, y: 640, width: 390, height: 280 } });
    }

  } catch(e) {
    console.error('FLOW 2 ERROR:', e.message);
    await shot(page, `${DIR}/error-flow2.png`).catch(() => {});
  }

  await context.close();
  console.log('Flow 2 done.');
}

// ─── FLOW 3: Programme musculation ────────────────────────────────────────
async function flow3_sport(browser) {
  console.log('\n=== FLOW 3: Programme Sport ===');
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/sport';

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await grantGateAccess(page);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForApp(page);

    // sStep=0: Sport type selection (objectif)
    await setState(page, {
      appMode: 'sport', view: 'sport',
      sStep: 0, sportType: null, sportLevel: null, sportProgram: null, weekPlan: null
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

    // sStep=4: muscu program (overview) — need a generated program
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'sport',
        appMode: 'sport',
        sStep: 4,
        sportType: 'musculation',
        sportLevel: 'intermediate',
        sportGoals: ['bulk'],
        sportFocus: { chest: true, back: true, legs: true, shoulders: true },
        trainingDaysSelected: [0, 1, 3, 4],
        selectedSportDay: 0,
        sportProgram: null
      });
      if (window.generateMusculationProgram) {
        try { window.generateMusculationProgram(); } catch(e) { console.error('genMuscu err', e); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1500);
    await shot(page, `${DIR}/sport-program-overview.png`);

    // sStep=4 day detail — click on first day to expand
    const firstDayBtn = await page.$('[onclick*="selectedSportDay"], [class*="day-card"], [class*="session"]').catch(() => null);
    if (firstDayBtn) {
      await firstDayBtn.click();
      await page.waitForTimeout(800);
    } else {
      // Try clicking by coordinate
      await page.click('body', { position: { x: 195, y: 300 } }).catch(() => {});
      await page.waitForTimeout(600);
    }
    await shot(page, `${DIR}/sport-session-detail.png`);

    // sStep=16: Charges questionnaire
    await setState(page, { sStep: 16, sportType: 'musculation', sportLevel: 'intermediate' });
    await shot(page, `${DIR}/sport-charges.png`);

    // sStep=15: Dedicated programs
    await setState(page, { sStep: 15, sportType: 'musculation' });
    await shot(page, `${DIR}/sport-dedicated-programs.png`);

    // Zoom on exercise card — go back to program
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'sport',
        appMode: 'sport',
        sStep: 4,
        sportType: 'musculation',
        sportLevel: 'intermediate',
        selectedSportDay: 0,
      });
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(1000);

    // Try to find an exercise card element
    const exerciseCard = await page.$('[class*="exercise"], [class*="exercice"], [class*="exo"]').catch(() => null);
    if (exerciseCard) {
      const bb = await exerciseCard.boundingBox();
      if (bb) {
        await shot(page, `${DIR}/sport-exercise-card.png`, { clip: { x: Math.max(0, bb.x - 5), y: Math.max(0, bb.y - 5), width: Math.min(390, bb.width + 10), height: Math.min(844, bb.height + 10) } });
      } else {
        await shot(page, `${DIR}/sport-exercise-card.png`, { clip: { x: 0, y: 200, width: 390, height: 250 } });
      }
    } else {
      await shot(page, `${DIR}/sport-exercise-card.png`, { clip: { x: 0, y: 200, width: 390, height: 250 } });
    }

  } catch(e) {
    console.error('FLOW 3 ERROR:', e.message);
    await shot(page, `${DIR}/error-flow3.png`).catch(() => {});
  }

  await context.close();
  console.log('Flow 3 done.');
}

// ─── FLOW 4: Plan nutritionnel semaine ────────────────────────────────────
async function flow4_nutrition_plan(browser) {
  console.log('\n=== FLOW 4: Plan Nutritionnel Semaine ===');
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const DIR = '/home/user/Smartfitcoach/visual-screenshots/flows/nutrition-plan';

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await grantGateAccess(page);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForApp(page);

    // Inject full profile + generate week plan
    await page.evaluate((profile) => {
      Object.assign(window.S, profile, {
        view: 'today',
        nStep: 12,
        sex: 'homme',
        age: 28,
        weight: 80,
        height: 178,
        goal: 0,
        activity: 3,
        sleep: 7,
        regime: 0,
        allergies: [],
        mealsPerDay: 3,
        birthYear: 1996,
        firstName: 'Alex',
        selectedDay: 0,
        kcal: 3000,
        macros: { proteins: 200, carbs: 350, fats: 83 },
        weekPlan: null
      });
      if (window.computeNutritionState) {
        try { window.computeNutritionState(); } catch(e) {}
      }
      if (!window.S.weekPlan && window.generateWeek) {
        try { window.generateWeek(); } catch(e) { console.error('genWeek err', e); }
      }
      window.render();
    }, PROFILE_BULK);
    await page.waitForTimeout(2000);

    // Navigate to nutrition view / plan
    await page.evaluate(() => {
      window.S.view = 'nutrition';
      window.S.nStep = 12;
      window.S.selectedDay = 0;
      window.render();
    });
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/plan-lundi.png`);

    // selectedDay=2 (Mercredi)
    await page.evaluate(() => {
      window.S.selectedDay = 2;
      window.render();
    });
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/plan-mercredi.png`);

    // selectedDay=6 (Dimanche)
    await page.evaluate(() => {
      window.S.selectedDay = 6;
      window.render();
    });
    await page.waitForTimeout(800);
    await shot(page, `${DIR}/plan-dimanche.png`);

    // Open a meal detail modal — click on first meal card
    await page.evaluate(() => {
      window.S.selectedDay = 0;
      window.render();
    });
    await page.waitForTimeout(800);

    // Try to click a recipe/meal card to open detail modal
    const mealCard = await page.$('[onclick*="recipe"], [onclick*="recette"], [onclick*="meal"], [onclick*="repas"], [class*="recipe-card"], [class*="meal-card"], [class*="repas"]').catch(() => null);
    if (mealCard) {
      await mealCard.click();
      await page.waitForTimeout(1000);
    } else {
      // Try clicking by position in the middle of the content area
      await page.click('body', { position: { x: 195, y: 400 } }).catch(() => {});
      await page.waitForTimeout(600);
    }
    await shot(page, `${DIR}/plan-meal-detail.png`);

  } catch(e) {
    console.error('FLOW 4 ERROR:', e.message);
    await shot(page, `${DIR}/error-flow4.png`).catch(() => {});
  }

  await context.close();
  console.log('Flow 4 done.');
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
