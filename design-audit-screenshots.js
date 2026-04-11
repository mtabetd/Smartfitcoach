/**
 * Design Audit Screenshots — SmartFitCoach
 * Captures all views for visual audit
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BROWSER_OPTS = {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

const BASE_URL = 'http://127.0.0.1:3000';
const VIEWPORT = { width: 390, height: 844 };
const OUT = '/home/user/Smartfitcoach/visual-screenshots/design-audit';

const PROFILE = {
  sex: 'homme', age: 28, weight: 80, height: 178,
  goal: 0, activity: 3, sportDays: 4, mealsPerDay: 3,
  regime: 0, allergies: [], intolerances: [],
  whey: true, wantsDessert: false,
  sportType: 'musculation', sportLevel: 'intermediate',
  sportGoals: ['muscle', 'bulk'],
  sportFocus: { 'Poitrine': 4, 'Dos': 5, 'Épaules': 3, 'Jambes': 4, 'Bras': 3 },
  trainingDaysSelected: [0,1,3,4],
  appMode: 'both', firstName: 'Alex', prenom: 'Alex',
  sleep: 7, birthYear: 1996, birthMonth: 6, birthDay: 15,
  weightUnit: 'kg', heightUnit: 'cm', lang: 'fr',
  _sportProfileDone: true
};

async function shot(page, name, opts = {}) {
  const p = `${OUT}/${name}`;
  await page.waitForTimeout(600);
  await page.screenshot({ path: p, ...opts });
  console.log('SHOT:', name);
}

async function setupPage(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
    try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}

    function mockAuth() {
      if (window.AUTH) {
        var u = { id: 'qa-user', name: 'Alex', email: 'alex@test.com', nom: '', phone: '' };
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return u; };
        window.AUTH.ready = function() { return Promise.resolve(); };
        return true;
      }
      return false;
    }
    function mockSync() {
      if (window.SupaSync) {
        window.SupaSync.saveProfile = function() { return Promise.resolve(); };
        window.SupaSync.syncOnLogin = function() { return Promise.resolve(); };
        window.SupaSync.startAutoSync = function() {};
        window.SupaSync.loadProfile = function() { return Promise.resolve(null); };
        return true;
      }
      return false;
    }
    var _a = false, _s = false;
    var _iv = setInterval(function() {
      if (!_a) _a = mockAuth();
      if (!_s) _s = mockSync();
      if (_a && _s) clearInterval(_iv);
    }, 30);
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() =>
    typeof window.render === 'function' &&
    typeof window.S === 'object' &&
    window.AUTH && window.AUTH.isLoggedIn()
  , { timeout: 15000 });

  console.log('App ready');
  return { ctx, page };
}

async function setState(page, state) {
  await page.evaluate((s) => {
    Object.assign(window.S, s);
    try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
    window.render();
  }, state);
  await page.waitForTimeout(700);
}

async function removeOverlays(page) {
  await page.evaluate(() => {
    var ov = document.getElementById('onboarding-complete-overlay');
    if (ov) ov.remove();
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch(BROWSER_OPTS);

  // === SPLASH — without gate bypass ===
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await page.waitForTimeout(2500);
    await shot(page, 'splash.png');
    await ctx.close();
  }

  // === MAIN APP VIEWS ===
  const { ctx, page } = await setupPage(browser);

  // TODAY DASHBOARD
  await page.evaluate((profile) => {
    try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
    Object.assign(window.S, profile, {
      view: 'today', nStep: 12, sStep: 0,
      kcal: 3000,
      macros: { proteins: 200, carbs: 350, fats: 83 },
      weekPlan: null, sportProgram: null, selectedDay: 0
    });
    if (window.computeNutritionState) { try { window.computeNutritionState(); } catch(e) {} }
    if (!window.S.weekPlan && window.generateWeek) { try { window.generateWeek(); } catch(e) {} }
    if (!window.S.sportProgram && window.generateMusculationProgram) { try { window.generateMusculationProgram(); } catch(e) {} }
    if (!window.S.sportProgram && window.generateSportProgram) { try { window.S.sportProgram = window.generateSportProgram(); } catch(e) {} }
    window.render();
  }, PROFILE);
  await page.waitForTimeout(2000);
  await removeOverlays(page);
  await shot(page, 'today-full.png', { fullPage: true });

  // NUTRITION STEP 1 — onboarding (no profile)
  await setState(page, { ...PROFILE, view: 'nutrition', appMode: 'nutrition', nStep: 1, sex: null, firstName: '' });
  await shot(page, 'nutrition-step1.png', { fullPage: true });

  // NUTRITION STEP 8 — macros rings
  await page.evaluate((profile) => {
    Object.assign(window.S, profile, {
      nStep: 11, view: 'nutrition', appMode: 'nutrition',
      sex: 'homme', age: 28, weight: 80, height: 178,
      goal: 0, activity: 3, sleep: 7, regime: 0, allergies: [],
      mealsPerDay: 3, birthYear: 1996, birthMonth: 6, birthDay: 15
    });
    if (window.computeNutritionState) { try { window.computeNutritionState(); } catch(e) {} }
    window.render();
  }, PROFILE);
  await page.waitForTimeout(1200);
  await shot(page, 'nutrition-step8.png', { fullPage: true });

  // NUTRITION STEP 9 — weekly plan day 0
  await page.evaluate((profile) => {
    try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
    Object.assign(window.S, profile, {
      nStep: 12, view: 'nutrition', appMode: 'both',
      weekPlan: null, selectedDay: 0
    });
    if (window.computeNutritionState) { try { window.computeNutritionState(); } catch(e) {} }
    if (!window.S.weekPlan && window.generateWeek) { try { window.generateWeek(); } catch(e) {} }
    window.render();
  }, PROFILE);
  await page.waitForTimeout(2500);
  await removeOverlays(page);
  await shot(page, 'nutrition-step9-day0.png', { fullPage: true });

  // SPORT STEP 16 — programme musculation
  await page.evaluate((profile) => {
    try { localStorage.setItem('mtd_onboarding_done', 'true'); } catch(e) {}
    Object.assign(window.S, profile, {
      view: 'sport', appMode: 'both', sStep: 16,
      nStep: 12, sportProgram: null
    });
    if (!window.S.weekPlan && window.generateWeek) { try { window.generateWeek(); } catch(e) {} }
    if (!window.S.sportProgram && window.generateMusculationProgram) { try { window.generateMusculationProgram(); } catch(e) {} }
    if (!window.S.sportProgram && window.generateSportProgram) { try { window.S.sportProgram = window.generateSportProgram(); } catch(e) {} }
    window.render();
  }, PROFILE);
  await page.waitForTimeout(2000);
  await removeOverlays(page);
  await shot(page, 'sport-sStep16.png', { fullPage: true });

  // SPORT SESSION — détail séance
  await page.evaluate((profile) => {
    Object.assign(window.S, profile, {
      view: 'sport', appMode: 'both', sStep: 17,
      nStep: 12, selectedDay: 0, selectedSession: 0
    });
    window.render();
  }, PROFILE);
  await page.waitForTimeout(1500);
  await removeOverlays(page);
  await shot(page, 'sport-session.png', { fullPage: true });

  // CALENDAR
  await page.evaluate((profile) => {
    Object.assign(window.S, profile, {
      view: 'calendar', appMode: 'both', nStep: 12
    });
    window.render();
  }, PROFILE);
  await page.waitForTimeout(1500);
  await removeOverlays(page);
  await shot(page, 'calendar.png', { fullPage: true });

  // SETTINGS
  await page.evaluate((profile) => {
    Object.assign(window.S, profile, {
      view: 'settings', appMode: 'both', nStep: 12
    });
    window.render();
  }, PROFILE);
  await page.waitForTimeout(1500);
  await removeOverlays(page);
  await shot(page, 'settings.png', { fullPage: true });

  await ctx.close();
  await browser.close();
  console.log('\nAll screenshots done!');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
