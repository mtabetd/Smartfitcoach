/**
 * SmartFitCoach — Mobile Visual QA
 * iPhone 14 Pro — 390×844px
 * Run: node mobile-visual-qa.js
 */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:3000';
const SS_DIR = path.join(__dirname, 'visual-screenshots', 'mobile');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

// Test profile (from instructions)
const TEST_PROFILE = {
  sex: 'homme', age: 28, weight: 80, height: 178,
  goal: 1, activity: 3, sportDays: 4, mealsPerDay: 3,
  regime: 0, allergies: [], intolerances: [],
  whey: true, wantsDessert: false,
  sportType: 'musculation', sportLevel: 'intermediate',
  trainingDaysSelected: [0,1,3,4],
  appMode: 'both', view: 'today',
  firstName: 'Alex',
  weekPlan: null, sportProgram: null,
  _planHash: null,
  // required for auth + navigation
  uid: 'test-user-mobile-qa',
  prenom: 'Alex',
  step: 12,
  nStep: 12,
  sStep: 16,
  parqDone: true,
  welcomeShown: true,
  sportSplashDone: true
};

async function screenshot(page, name) {
  await page.waitForTimeout(800);
  const p = path.join(SS_DIR, name);
  await page.screenshot({
    path: p,
    fullPage: false,
    clip: { x: 0, y: 0, width: 390, height: 844 }
  });
  console.log('  📷 ' + name);
  return p;
}

function buildInitScript(profile) {
  return [
    ({ profile }) => {
      // Gate bypass
      try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
      try { sessionStorage.setItem('mtd_seen_welcome', 'true'); } catch(e) {}

      // Block Supabase SDK
      try {
        Object.defineProperty(window, 'supabase', {
          get: function() { return null; },
          set: function() {},
          configurable: true
        });
      } catch(e) {}

      // Legacy auth session
      var session = {
        id: 'test-user-mobile-qa',
        name: 'Alex',
        email: 'alex@test.com',
        nom: '',
        phone: '',
        token: 'test-mobile-qa-token',
        fingerprint: null,
        tokenIssuedAt: Date.now()
      };
      try {
        localStorage.setItem('mtd_session', JSON.stringify(session));
        localStorage.setItem('mtd_session_start', String(Date.now()));
        localStorage.setItem('mtd_dev_wiped_v1', 'true');
      } catch(e) {}

      // Profile
      try {
        localStorage.setItem('mtd_profile_test-user-mobile-qa', JSON.stringify(profile));
      } catch(e) {}
    },
    { profile }
  ];
}

async function forceState(page, stateFields) {
  await page.evaluate((fields) => {
    if (!window.S) { console.warn('window.S not found'); return; }
    Object.keys(fields).forEach(function(k) { window.S[k] = fields[k]; });
    if (window.render) { window.render._lock = false; window.render(); }
  }, stateFields);
  await page.waitForTimeout(900);
}

async function checkPageHealth(page) {
  const info = await page.evaluate(() => {
    const body = document.body ? document.body.innerText : '';
    const hasS = !!window.S;
    const view = window.S ? window.S.view : 'unknown';
    const hasRender = !!window.render;
    const scrollW = document.body ? document.body.scrollWidth : 0;
    const viewW = window.innerWidth || 390;
    const hasHorizScroll = scrollW > viewW + 5;
    const blankPage = body.trim().length < 20;
    return { hasS, view, hasRender, hasHorizScroll, scrollW, viewW, blankPage, bodyLen: body.trim().length };
  });
  return info;
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   SmartFitCoach — Mobile Visual QA (iPhone 14 Pro)  ║');
  console.log('║   390×844px  —  deviceScaleFactor: 3                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await ctx.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push('PAGE_ERR: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('CON_ERR: ' + msg.text()); });

  const results = [];

  function addResult(name, file, health, notes, grade) {
    results.push({ name, file, health, notes, grade });
  }

  // ──────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ──────────────────────────────────────────────────────────────
  console.log('► Chargement initial de la page...');
  await page.addInitScript(...buildInitScript(TEST_PROFILE));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Force state: user logged in, view=today, nStep=12, sStep=16
  await forceState(page, {
    view: 'today',
    nStep: 12,
    sStep: 16,
    appMode: 'both',
    sex: 'homme', age: 28, weight: 80, height: 178,
    goal: 1, activity: 3, sportDays: 4, mealsPerDay: 3,
    regime: 0, allergies: [], intolerances: [],
    whey: true, wantsDessert: false,
    sportType: 'musculation', sportLevel: 'intermediate',
    trainingDaysSelected: [0,1,3,4],
    firstName: 'Alex', prenom: 'Alex',
    sportSplashDone: true, parqDone: true, welcomeShown: true,
    weekPlan: null, sportProgram: null, _planHash: null
  });

  // ──────────────────────────────────────────────────────────────
  // 1. TODAY DASHBOARD
  // ──────────────────────────────────────────────────────────────
  console.log('\n[1/8] today-dashboard.png — Vue Today (dashboard principal)');
  await forceState(page, { view: 'today' });
  await page.waitForTimeout(500);
  const h1 = await checkPageHealth(page);
  await screenshot(page, 'today-dashboard.png');

  {
    const notes = [];
    if (h1.blankPage) notes.push('❌ Page blanche détectée');
    if (h1.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h1.scrollW} > viewportW=${h1.viewW})`);
    if (!h1.hasS) notes.push('❌ window.S non disponible');
    if (!notes.length) notes.push('✅ Layout chargé');
    const grade = h1.blankPage ? '❌ Problème critique' : (h1.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('today-dashboard', 'today-dashboard.png', h1, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // 2. TODAY SCROLL (bas du dashboard)
  // ──────────────────────────────────────────────────────────────
  console.log('\n[2/8] today-scroll.png — Dashboard scrollé vers le bas');
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  const h2 = await checkPageHealth(page);
  await screenshot(page, 'today-scroll.png');
  await page.evaluate(() => window.scrollTo(0, 0));

  {
    const notes = [];
    if (h2.blankPage) notes.push('❌ Page blanche');
    if (h2.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h2.scrollW})`);
    if (!notes.length) notes.push('✅ Scroll OK');
    const grade = h2.blankPage ? '❌ Problème critique' : (h2.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('today-scroll', 'today-scroll.png', h2, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // 3. NUTRITION — nStep=1 (objectif)
  // ──────────────────────────────────────────────────────────────
  console.log('\n[3/8] nutrition-step1.png — Vue Nutrition nStep=1');
  await forceState(page, { view: 'nutrition', nStep: 1 });
  const h3 = await checkPageHealth(page);
  await screenshot(page, 'nutrition-step1.png');

  {
    const notes = [];
    if (h3.blankPage) notes.push('❌ Page blanche');
    if (h3.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h3.scrollW})`);
    if (!notes.length) notes.push('✅ Étape objectif affichée');
    const grade = h3.blankPage ? '❌ Problème critique' : (h3.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('nutrition-step1', 'nutrition-step1.png', h3, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // 4. NUTRITION — nStep=9 (plan semaine, génération forcée)
  // ──────────────────────────────────────────────────────────────
  console.log('\n[4/8] nutrition-step9.png — Vue Nutrition nStep=9 (plan semaine)');
  // Force step 9 — force generation of weekPlan via internal function
  await page.evaluate(() => {
    if (!window.S) return;
    window.S.view = 'nutrition';
    window.S.nStep = 9;
    // Force profile fields needed for plan generation
    window.S.sex = 'homme'; window.S.age = 28; window.S.weight = 80; window.S.height = 178;
    window.S.goal = 1; window.S.activity = 3; window.S.sportDays = 4; window.S.mealsPerDay = 3;
    window.S.regime = 0; window.S.allergies = []; window.S.intolerances = [];
    window.S.whey = true; window.S.wantsDessert = false;
    window.S.weekPlan = null; window.S._planHash = null;
    if (window.render) { window.render._lock = false; window.render(); }
  });
  await page.waitForTimeout(2000); // wait for plan generation

  const h4 = await checkPageHealth(page);
  await screenshot(page, 'nutrition-step9.png');

  {
    const notes = [];
    if (h4.blankPage) notes.push('❌ Page blanche');
    if (h4.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h4.scrollW})`);
    if (!notes.length) notes.push('✅ Plan semaine affiché');
    const grade = h4.blankPage ? '❌ Problème critique' : (h4.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('nutrition-step9', 'nutrition-step9.png', h4, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // 5. SPORT — sStep=16 (programme actif)
  // ──────────────────────────────────────────────────────────────
  console.log('\n[5/8] sport-main.png — Vue Sport sStep=16');
  await forceState(page, { view: 'sport', sStep: 16, nStep: 12 });
  const h5 = await checkPageHealth(page);
  await screenshot(page, 'sport-main.png');

  {
    const notes = [];
    if (h5.blankPage) notes.push('❌ Page blanche');
    if (h5.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h5.scrollW})`);
    if (!notes.length) notes.push('✅ Programme sport affiché');
    const grade = h5.blankPage ? '❌ Problème critique' : (h5.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('sport-main', 'sport-main.png', h5, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // 6. SPORT — sStep=17 (séance détaillée)
  // ──────────────────────────────────────────────────────────────
  console.log('\n[6/8] sport-program.png — Vue Sport sStep=17 (séance détaillée)');
  await forceState(page, { view: 'sport', sStep: 17, nStep: 12 });
  const h6 = await checkPageHealth(page);
  await screenshot(page, 'sport-program.png');

  {
    const notes = [];
    if (h6.blankPage) notes.push('❌ Page blanche');
    if (h6.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h6.scrollW})`);
    if (!notes.length) notes.push('✅ Séance détaillée affichée');
    const grade = h6.blankPage ? '❌ Problème critique' : (h6.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('sport-program', 'sport-program.png', h6, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // 7. CALENDAR — vue smart-calendar
  // ──────────────────────────────────────────────────────────────
  console.log('\n[7/8] calendar.png — Vue Smart Calendar');
  await forceState(page, { view: 'calendar', nStep: 12, sStep: 16 });
  const h7 = await checkPageHealth(page);
  await screenshot(page, 'calendar.png');

  {
    const notes = [];
    if (h7.blankPage) notes.push('❌ Page blanche');
    if (h7.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h7.scrollW})`);
    if (!notes.length) notes.push('✅ Calendrier affiché');
    const grade = h7.blankPage ? '❌ Problème critique' : (h7.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('calendar', 'calendar.png', h7, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // 8. SETTINGS — vue profil/paramètres
  // ──────────────────────────────────────────────────────────────
  console.log('\n[8/8] settings.png — Vue Profil/Paramètres');
  await forceState(page, { view: 'profil', nStep: 12, sStep: 16 });
  const h8 = await checkPageHealth(page);
  await screenshot(page, 'settings.png');

  {
    const notes = [];
    if (h8.blankPage) notes.push('❌ Page blanche');
    if (h8.hasHorizScroll) notes.push(`❌ Scroll horizontal (scrollWidth=${h8.scrollW})`);
    if (!notes.length) notes.push('✅ Paramètres affichés');
    const grade = h8.blankPage ? '❌ Problème critique' : (h8.hasHorizScroll ? '⚠️ Problème mineur' : '✅ OK');
    addResult('settings', 'settings.png', h8, notes, grade);
    console.log('   ' + notes.join(' | ') + '  →  ' + grade);
  }

  // ──────────────────────────────────────────────────────────────
  // RAPPORT FINAL
  // ──────────────────────────────────────────────────────────────
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║             RAPPORT VISUEL MOBILE                   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  results.forEach(r => {
    console.log(`  ${r.grade.padEnd(30)} ${r.name} (${r.file})`);
    r.notes.forEach(n => console.log(`    ${n}`));
    if (r.health.hasHorizScroll) {
      console.log(`    ↳ scrollWidth=${r.health.scrollW}px vs viewport=${r.health.viewW}px`);
    }
    console.log('');
  });

  const critiques = results.filter(r => r.grade.startsWith('❌'));
  const mineurs = results.filter(r => r.grade.startsWith('⚠️'));
  const ok = results.filter(r => r.grade.startsWith('✅'));

  console.log(`  Résumé : ${ok.length} OK | ${mineurs.length} problèmes mineurs | ${critiques.length} problèmes critiques`);

  if (consoleErrors.length > 0) {
    console.log('\n  Erreurs JS capturées :');
    consoleErrors.slice(0, 10).forEach(e => console.log('    ' + e));
  }

  console.log('\n  Screenshots dans : ' + SS_DIR + '\n');

  await ctx.close();
  await browser.close();

  return results;
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
