/**
 * SmartFitCoach — Tablet Visual QA (iPad 768×1024 @ 2x)
 * Run: node tablet-screenshots.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:3000';
const SS_DIR = path.join(__dirname, 'visual-screenshots', 'tablet');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

const SOPHIE_PROFILE = {
  // Identity
  uid: 'sophie_tablet_qa',
  prenom: 'Sophie',
  sex: 'femme',
  age: 32,
  weight: 62,
  height: 165,
  // Goals & activity
  goal: 3,
  activity: 2,
  sportDays: 3,
  mealsPerDay: 4,
  regime: 0,
  allergies: ['gluten'],
  intolerances: [],
  whey: false,
  wantsDessert: true,
  // Sport
  sportType: 'crossfit',
  sportLevel: 'beginner',
  crossfitLevel: 'beginner',
  trainingDaysSelected: [1, 3, 5],
  appMode: 'both',
  view: 'today',
  // Steps — start in completed state
  nStep: 9,
  sStep: 16,
  // Needed flags
  parqDone: true,
  sportSplashDone: true,
  welcomeShown: true,
  firstLoginDate: '2026-01-15',
  // Ensure nutrition plan is "done"
  step: 10
};

async function go() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', function(e) { errors.push('PAGE_ERR: ' + e.message); });
  page.on('console', function(m) {
    if (m.type() === 'error') errors.push('CON_ERR: ' + m.text());
  });

  // Init script — runs BEFORE page scripts
  await context.addInitScript(function() {
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
    try { sessionStorage.setItem('mtd_seen_welcome', 'true'); } catch(e) {}
    try { localStorage.setItem('mtd_dev_wiped_v1', '1'); } catch(e) {}
  });

  // Load the app
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);

  // Inject profile + fake auth
  await page.evaluate(function(profile) {
    var uid = profile.uid;
    var fake = { id: uid, name: 'Sophie', email: 'sophie@test.com', nom: '', phone: '' };

    // Store profile
    try { localStorage.setItem('mtd_profile_' + uid, JSON.stringify(profile)); } catch(e) {}
    // Legacy session
    var session = {
      id: uid, name: 'Sophie', email: 'sophie@test.com',
      nom: '', phone: '',
      token: 'test-tablet-token',
      fingerprint: null,
      tokenIssuedAt: Date.now()
    };
    try {
      localStorage.setItem('mtd_session', JSON.stringify(session));
      localStorage.setItem('mtd_session_start', String(Date.now()));
    } catch(e) {}

    // Patch AUTH
    if (window.AUTH) {
      window.AUTH.isLoggedIn = function() { return true; };
      window.AUTH.getUser = function() { return fake; };
    }
    // Load profile into S
    if (window.loadProfile) window.loadProfile();
    if (window.S) {
      Object.assign(window.S, profile);
      window.S.view = 'today';
    }
    if (window.render) { window.render._lock = false; window.render(); }
  }, SOPHIE_PROFILE);

  await page.waitForTimeout(2000);

  // Helper: force state + screenshot
  async function shot(filename, stateFields, fullPage) {
    await page.evaluate(function(fields) {
      if (!window.S) return;
      Object.keys(fields).forEach(function(k) { window.S[k] = fields[k]; });
      if (window.render) { window.render._lock = false; window.render(); }
    }, stateFields);
    await page.waitForTimeout(1200);
    var filepath = path.join(SS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: !!fullPage });
    console.log('  SAVED: ' + filename);
    return filepath;
  }

  // ─── 1. today-dashboard.png ───────────────────────────────────────────────
  console.log('\n[1/8] today-dashboard.png — vue today');
  await shot('today-dashboard.png', { view: 'today' }, false);

  // ─── 2. today-full.png — fullPage ─────────────────────────────────────────
  console.log('[2/8] today-full.png — fullPage');
  await shot('today-full.png', { view: 'today' }, true);

  // ─── 3. nutrition-plan.png — nStep=9 ──────────────────────────────────────
  console.log('[3/8] nutrition-plan.png — nutrition nStep=9');
  await shot('nutrition-plan.png', { view: 'nutrition', nStep: 9 }, false);

  // ─── 4. nutrition-macros.png — nStep=8 ────────────────────────────────────
  console.log('[4/8] nutrition-macros.png — nutrition nStep=8');
  await shot('nutrition-macros.png', { view: 'nutrition', nStep: 8 }, false);

  // ─── 5. sport-main.png — sStep=16 ─────────────────────────────────────────
  console.log('[5/8] sport-main.png — sport sStep=16');
  await shot('sport-main.png', { view: 'sport', sStep: 16 }, false);

  // ─── 6. sport-onboarding.png — sStep=1 ────────────────────────────────────
  console.log('[6/8] sport-onboarding.png — sport sStep=1');
  await shot('sport-onboarding.png', { view: 'sport', sStep: 1 }, false);

  // ─── 7. calendar.png — vue calendar ──────────────────────────────────────
  console.log('[7/8] calendar.png — vue calendar');
  await shot('calendar.png', { view: 'calendar' }, false);

  // ─── 8. onboarding-nutrition.png — nutrition nStep=1 ──────────────────────
  console.log('[8/8] onboarding-nutrition.png — nutrition nStep=1');
  await shot('onboarding-nutrition.png', { view: 'nutrition', nStep: 1 }, false);

  console.log('\nAll screenshots done. Errors: ' + errors.length);
  if (errors.length > 0) {
    console.log('Console errors:');
    errors.slice(0, 10).forEach(function(e) { console.log('  ' + e.slice(0, 120)); });
  }

  await browser.close();
}

go().catch(function(e) {
  console.error('FATAL:', e.message);
  process.exit(1);
});
