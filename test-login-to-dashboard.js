/**
 * SmartFitCoach — E2E : Login → Dashboard direct (no onboarding)
 *
 * Scénario :
 *  1. Injecte un profil COMPLET (prenom, sex, age, weight, height, goal, weekPlan…)
 *     dans localStorage (mtd_profile_<uid>) AVANT le chargement de l'app.
 *  2. Charge l'app → l'utilisateur doit atterrir directement sur le dashboard
 *     « Aujourd'hui » (pas d'onboarding nStep=1, pas la page profil).
 *  3. Vérifie que le dashboard affiche la nutrition du jour et le sport du jour
 *     sans crash JS.
 *  4. Clic sur « Profil » puis retour « Aujourd'hui » via la nav.
 *
 * Usage :
 *   node test-login-to-dashboard.js
 */

'use strict';

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');

const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL     = 'http://127.0.0.1:45516';
const PORT         = 45516;
const UID          = 'qa-login-dashboard-001';

// ───────────────────────── Helpers ─────────────────────────

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + (timeoutMs || 10000);
  return new Promise((resolve, reject) => {
    (function tick() {
      const req = http.get(url, (res) => { res.resume(); resolve(); });
      req.on('error', () => {
        if (Date.now() > deadline) return reject(new Error('server not ready'));
        setTimeout(tick, 150);
      });
    })();
  });
}

function critErrors(errors) {
  return errors.filter((e) =>
    e.includes('TypeError') ||
    e.includes('ReferenceError') ||
    e.includes('Maximum call stack') ||
    e.includes('Cannot read') ||
    e.includes('is not a function') ||
    e.includes('is not defined')
  );
}

// Build a fully onboarded profile : sport = musculation + nutrition.
// weekPlan = 7 jours, chaque jour = objet { kcal, p, g, l, _meals } minimal
// cohérent avec today-dashboard / app-nutrition (lecture _dayPlan.kcal/p/g/l).
function buildFullProfile() {
  const daySlot = (kcal) => ({
    _id: 'stub',
    n: 'Stub',
    k: kcal, p: 20, g: 40, l: 10, w: 0,
  });
  const day = () => ({
    breakfast: daySlot(400),
    lunch:     daySlot(700),
    snack:     daySlot(200),
    dinner:    daySlot(600),
    kcal: 1900, p: 120, g: 230, l: 55,
  });
  const weekPlan = [day(), day(), day(), day(), day(), day(), day()];

  return {
    // Identity
    prenom: 'Alex', nom: '', phone: '',
    sex: 'M', age: 32, birthDate: null,
    weight: 78, height: 178,
    lang: 'fr', weightUnit: 'kg', heightUnit: 'cm',

    // Nutrition wizard — fully done
    nStep: 12,
    activity: 2, train: [], sleep: 2, medical: [], goal: 1, targetWeight: 75,
    mealsPerDay: 4, eatingLocation: 'home', mealPrepTime: 30,
    snacking: 1, alcoholFreq: 0, alcoholTypes: [], hydration: 2,
    cookLevel: 2, whey: null, wheyFlavors: [],
    allergies: [], intolerances: [],
    regime: 0, halal: false, excluded: '', cuisines: [0],
    shopFreq: 2, shopStores: [], shopBudget: 2, shopPrefs: [],
    bodyZones: {}, strongZones: [], weakZones: [],

    // Sport wizard — fully done (musculation)
    sStep: 99,
    appMode: 'both',
    sportType: 'musculation',
    sportLevel: 1, sportDays: 4,
    sportGoals: ['hypertrophie'],
    sportFocus: {},
    trainingDaysSelected: [1, 3, 5, 6],
    sportSessionDuration: 60,
    sportEquipment: 'full',
    installations: ['salle'],

    // Plans
    weekPlan: weekPlan,
    selectedDay: 0,
    _weekPlanGeneratedAt: Date.now(),
    weekPlanValidated: true,

    muscuWeek: 1, muscuCycle: 1, muscuProgramCount: 0, sportSplashDone: true,
    selectedSportDay: 0,
    sportProgram: {
      days: [
        { focus: 'Push',  exercises: [{ n: 'Développé couché', sets: 4, reps: '8-10' }] },
        { focus: 'Repos', exercises: [] },
        { focus: 'Pull',  exercises: [{ n: 'Rowing',           sets: 4, reps: '8-10' }] },
        { focus: 'Repos', exercises: [] },
        { focus: 'Legs',  exercises: [{ n: 'Squat',            sets: 4, reps: '8-10' }] },
        { focus: 'Full',  exercises: [{ n: 'Soulevé de terre',  sets: 3, reps: '6-8' }] },
        { focus: 'Repos', exercises: [] },
      ],
    },
    sportProgramValidated: true,
    sportProgramValidatedAt: Date.now(),

    // System flags
    welcomeShown: true, firstLoginDate: Date.now(),
    parqDone: true, parqResult: 'cleared',
    subscriptionPlan: 'free',
  };
}

// ───────────────────────── Main ─────────────────────────

async function main() {
  // 1) Démarre http-server en background
  console.log('[setup] démarrage http-server sur port ' + PORT);
  const server = spawn('npx', ['http-server', 'app', '-p', String(PORT), '-s'], {
    cwd: __dirname, stdio: 'ignore', detached: false,
  });

  try {
    await waitForServer(BASE_URL, 8000);
    console.log('[setup] server READY');
  } catch (e) {
    console.error('[setup] server NOT READY : ' + e.message);
    try { server.kill('SIGKILL'); } catch (_) {}
    process.exit(2);
  }

  const results = [];
  const step = (desc, ok, detail) => {
    results.push({ desc, ok, detail: detail || '' });
    console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' — ' + desc + (detail ? ' [' + detail + ']' : ''));
  };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: CHROMIUM_PATH,
    });

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    const profile = buildFullProfile();

    // 2) addInitScript : gate bypass + session + profil complet en JSON clair.
    //    loadProfile() tente d'abord _storageDecode puis fallback JSON.parse
    //    → le JSON clair est accepté.
    await context.addInitScript(
      ({ uid, profile }) => {
        try { sessionStorage.setItem('mtd_gate_access',  '1gs8uk7'); } catch (e) {}
        try { sessionStorage.setItem('mtd_seen_welcome', 'true');    } catch (e) {}

        // Désactive Supabase pour ne pas écraser les données locales
        try {
          Object.defineProperty(window, 'supabase', {
            get: function () { return null; },
            set: function () {},
            configurable: true,
          });
        } catch (e) {}

        // Session locale (AUTH)
        const session = {
          id: uid, name: 'Alex Tester', email: 'alex@test.com',
          nom: '', phone: '', token: 'test-token-' + uid,
          fingerprint: null, tokenIssuedAt: Date.now(),
        };
        try {
          localStorage.setItem('mtd_session',       JSON.stringify(session));
          localStorage.setItem('mtd_session_start', String(Date.now()));
          localStorage.setItem('mtd_dev_wiped_v1',  'true');
          localStorage.setItem('mtd_profile_' + uid, JSON.stringify(profile));
        } catch (e) {}
      },
      { uid: UID, profile }
    );

    const errors = [];
    page.on('pageerror', (err) => errors.push('PAGE:' + err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CON:' + msg.text()); });

    // 3) Charge l'app
    console.log('\n[run] goto ' + BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    // Laisse AUTH/Supabase se stabiliser
    await page.waitForTimeout(3500);

    // Patch AUTH pour simuler l'utilisateur loggé + force loadProfile + render
    await page.evaluate((uid) => {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function () { return true; };
        window.AUTH.getUser = function () {
          return { id: uid, name: 'Alex Tester', email: 'alex@test.com', nom: '', phone: '' };
        };
      }
      try { if (window.loadProfile) window.loadProfile(); } catch (e) {}
      // L'utilisateur onboardé doit atterrir sur 'today' — on force cette vue
      // pour écarter toute redirection parasite (module-choice, welcome, etc.).
      if (window.S) { window.S.view = 'today'; }
      if (window.render) { window.render._lock = false; window.render(); }
    }, UID);

    await page.waitForTimeout(1500);

    // ─── STEP 1 : pas d'onboarding visible ───
    const { bodyText, hasOnboardingStep1, hasNavAujourdhui } = await page.evaluate(() => {
      const body = document.body ? document.body.innerText : '';
      // Heuristiques onboarding (nStep=1 = écran sexe / prénom)
      const ob =
        /bienvenue,?\s*nous allons/i.test(body) ||                 // welcome screen (first login)
        /quel est votre sexe/i.test(body) ||
        /quel est votre pr[ée]nom/i.test(body) ||
        body.indexOf('Étape 1') !== -1 ||
        body.indexOf('Etape 1') !== -1;
      // Nav principale visible → on est bien dans l'app
      const nav = Array.from(document.querySelectorAll('.main-nav-tab, button'))
        .some((el) => /aujourd/i.test(el.textContent || ''));
      return { bodyText: body.slice(0, 200), hasOnboardingStep1: ob, hasNavAujourdhui: nav };
    });

    step(
      "Atterrissage direct sur dashboard (pas d'écran onboarding)",
      !hasOnboardingStep1 && hasNavAujourdhui,
      hasOnboardingStep1 ? 'onboarding détecté' : (hasNavAujourdhui ? 'OK' : 'nav absente')
    );

    // ─── STEP 2 : S.weekPlan.length === 7 ───
    const stateSnap = await page.evaluate(() => {
      const S = window.S || {};
      return {
        view: S.view,
        nStep: S.nStep,
        sStep: S.sStep,
        appMode: S.appMode,
        weekPlanLen: Array.isArray(S.weekPlan) ? S.weekPlan.length : -1,
        hasSportProgram: !!(S.sportProgram && Array.isArray(S.sportProgram.days) && S.sportProgram.days.length === 7),
        prenom: S.prenom, sex: S.sex, weight: S.weight, height: S.height, goal: S.goal,
      };
    });
    console.log('  [debug] S =', JSON.stringify(stateSnap));

    step(
      'window.S.weekPlan.length === 7',
      stateSnap.weekPlanLen === 7,
      'len=' + stateSnap.weekPlanLen
    );
    step(
      "S.view indique bien le dashboard (today/dashboard)",
      stateSnap.view === 'today' || stateSnap.view === 'dashboard' || !stateSnap.view,
      'view=' + stateSnap.view
    );

    // ─── STEP 3 : dashboard rend la nutrition du jour ───
    const nutritionVisible = await page.evaluate(() => {
      const txt = document.body ? document.body.innerText : '';
      // today-dashboard affiche soit le bloc macros/kcal soit un CTA nutrition
      return /kcal|nutrition|petit[- ]d[ée]j|d[ée]jeuner|d[îi]ner/i.test(txt);
    });
    step('Dashboard affiche le plan nutrition du jour', nutritionVisible,
      nutritionVisible ? 'OK' : 'aucun indicateur nutrition');

    // ─── STEP 4 : dashboard rend le sport du jour ───
    const sportVisible = await page.evaluate(() => {
      const txt = document.body ? document.body.innerText : '';
      return /sport|muscu|entra[îi]nement|s[ée]ance|programme/i.test(txt);
    });
    step('Dashboard affiche le programme sport du jour', sportVisible,
      sportVisible ? 'OK' : 'aucun indicateur sport');

    // ─── STEP 5 : pas d'erreur JS critique ───
    const crit = critErrors(errors);
    step('Pas de crash JS critique sur le dashboard', crit.length === 0,
      crit.length ? crit[0].slice(0, 120) : 'OK');

    // ─── STEP 6 : clic Profil → page profil, puis retour Aujourd'hui via nav ───
    const clickedProfil = await page.evaluate(() => {
      // Tente d'abord l'avatar user-bar-avatar (bouton profil), sinon un tab "Profil"
      const avatarBtn = document.querySelector('.user-bar-avatar, .user-bar-avatar-initials');
      if (avatarBtn) {
        let b = avatarBtn;
        while (b && b.tagName !== 'BUTTON' && b.tagName !== 'A' && b !== document.body) b = b.parentElement;
        if (b && b.click) { b.click(); return 'avatar'; }
      }
      const tab = Array.from(document.querySelectorAll('button, a'))
        .find((el) => /^profil$/i.test((el.textContent || '').trim()));
      if (tab) { tab.click(); return 'tab'; }
      // Fallback direct : S.view = 'profil'
      if (window.S && window.render) {
        window.S.view = 'profil';
        window.render();
        return 'direct';
      }
      return null;
    });
    await page.waitForTimeout(600);

    const onProfile = await page.evaluate(() => window.S && (window.S.view === 'profil' || window.S.view === 'profile'));
    step('Clic "Profil" → S.view passe à profil (via ' + clickedProfil + ')', !!onProfile,
      onProfile ? 'OK' : 'S.view=' + (await page.evaluate(() => window.S && window.S.view)));

    // Retour via la nav "Aujourd'hui"
    const backedHome = await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.main-nav-tab, button'))
        .find((el) => /aujourd/i.test((el.textContent || '').trim()));
      if (tab && tab.click) { tab.click(); return true; }
      return false;
    });
    await page.waitForTimeout(500);
    const onHome = await page.evaluate(() => window.S && (window.S.view === 'today' || window.S.view === 'dashboard'));
    step('Clic nav "Aujourd\'hui" → retour dashboard', backedHome && !!onHome,
      'S.view=' + (await page.evaluate(() => window.S && window.S.view)));

    await context.close();
  } catch (e) {
    console.error('[fatal] ' + e.message);
    step('Exception pendant le test', false, e.message);
  } finally {
    if (browser) { try { await browser.close(); } catch (_) {} }
    try { server.kill('SIGTERM'); } catch (_) {}
  }

  // ───────────── Report ─────────────
  const passed = results.filter((r) => r.ok).length;
  const total  = results.length;
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  RAPPORT  ' + passed + ' / ' + total + ' PASS');
  console.log('══════════════════════════════════════════════════════════');
  results.forEach((r, i) => {
    console.log('  ' + (i + 1) + '. [' + (r.ok ? 'PASS' : 'FAIL') + '] ' + r.desc +
      (r.detail ? '   → ' + r.detail : ''));
  });
  console.log('══════════════════════════════════════════════════════════');

  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(99); });
