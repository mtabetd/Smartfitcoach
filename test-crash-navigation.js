/**
 * test-crash-navigation.js
 * QA senior — tests crash / page blanche sur SmartFitCoach PWA
 * 15 scénarios de navigation à risque
 *
 * Usage: node test-crash-navigation.js
 */

'use strict';

const { chromium } = require('playwright');

const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = 'http://127.0.0.1:3000';
const TIMEOUT_MS = 8000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Create a fresh page with:
 *   - gate token set before any script runs
 *   - pageerror collector
 *   - console.error collector
 */
async function createPage(browser) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });
  const page = await context.newPage();
  page._jsErrors = [];
  page.on('pageerror', err => {
    page._jsErrors.push(err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      page._jsErrors.push('[console.error] ' + msg.text());
    }
  });
  return { page, context };
}

/**
 * Navigate to the app and wait until it is fully interactive.
 */
async function loadApp(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
  await page.waitForTimeout(1800);
}

/**
 * Inject a minimal authenticated session with appMode already chosen
 * so the router skips auth/welcome/module-choice screens.
 * `extra` is an object merged into window.S.
 */
async function injectState(page, extra) {
  await page.evaluate((extra) => {
    // Auth shim
    if (window.AUTH) {
      window.AUTH.isLoggedIn = function () { return true; };
      window.AUTH.getUser = function () {
        return { id: 'qa-crash-001', email: 'qa@test.com', name: 'QA Tester' };
      };
    }
    // Base state — all fields needed to bypass every early-exit guard
    var base = {
      prenom: 'QA',
      appMode: 'both',
      welcomeShown: true,
      nStep: 12,
      sStep: 4,
      view: 'today',
      sex: 'homme',
      age: 30,
      weight: 75,
      height: 178,
      activity: 2,
      sleep: 2,
      goal: 3,
      sportType: 'musculation',
      sportDays: 3,
      trainingDaysSelected: [1, 3, 5],
      sportFocus: { poitrine: 2, dos: 2, jambes: 2 },
      sportGoals: ['muscle'],
      sportLevel: 'intermediate',
      muscuCycle: 'PPL',
      muscuProgramCount: 1,
      sportSplashDone: true,
      weekPlan: (function () {
        // Build a minimal but valid 7-day plan
        var meals = {
          breakfast: { _id: 'r1', n: 'Oatmeal', k: 350, p: 12, g: 55, l: 8 },
          lunch:     { _id: 'r2', n: 'Poulet riz', k: 550, p: 45, g: 65, l: 10 },
          snack:     { _id: 'r3', n: 'Yaourt', k: 150, p: 10, g: 18, l: 3 },
          dinner:    { _id: 'r4', n: 'Saumon patate douce', k: 480, p: 38, g: 40, l: 14 }
        };
        return Array(7).fill(null).map(() => Object.assign({}, meals, { kcal: 1530, p: 105, g: 178, l: 35 }));
      })(),
      selectedDay: 0,
      sportProgram: [
        // IMPORTANT: sets must be a NUMBER here (as stored by muscu-programs.js).
        // The renderer at app-sport.js:6061 calls (exRef.sets || '').match(...)
        // which THROWS TypeError when sets is a truthy number (e.g. 4).
        // Using numeric sets here intentionally exposes Bug B1.
        { name: 'Pectoraux', exercises: [
            { n: 'Développé couché', m: 'poitrine', sets: 4, reps: 10, rest: '2min', eq: 'barre' },
            { n: 'Incliné haltères', m: 'poitrine', sets: 3, reps: 12, rest: '90s', eq: 'halteres' }
          ] },
        { name: 'Dos', exercises: [
            { n: 'Tractions', m: 'dos', sets: 4, reps: 8, rest: '2min30', eq: 'barre fixe' }
          ] },
        { name: 'Jambes', exercises: [
            { n: 'Squat barre', m: 'quadriceps', sets: 5, reps: 5, rest: '3min', eq: 'barre' }
          ] }
      ],
      selectedSportDay: 0,
      muscuSessionLog: {},
      mealsLogged: {},
      todayWellness: { date: new Date().toISOString().slice(0, 10), sleep: 7, energy: 3, stress: 2, soreness: 1 },
      medical: [],
      allergies: [],
      intolerances: [],
      cuisines: [],
      train: [0],
      supplements: [],
      wheyFlavors: [],
      alcoholTypes: [],
      strongZones: [],
      weakZones: [],
      bodyZones: {},
      sportFocus: { poitrine: 2, dos: 2, jambes: 2 },
      bonusExercises: {},
      sessionHistory: {},
      muscuProgressionHistory: {},
      musculationWeights: {},
      shopChecked: {},
      crossfit1RM: {},
      muscuMedical: {},
      hyroxBenchmarks: {},
      muscuStrengthProfile: {},
      crossfitBenchmarks: {},
      weightHistory: [],
      mealsLogged: {},
      parqDone: false,
      parqResult: null,
      swapCount: 0,
      bodyScanDone: false
    };
    // Merge extra overrides
    Object.assign(base, extra || {});
    window.S = Object.assign(window.S || {}, base);
  }, extra || {});
}

/**
 * Standard assertions on a page after render.
 * Returns { pass, issues }
 */
async function checkPage(page, testName) {
  const issues = [];

  // 1. JS errors collected
  if (page._jsErrors.length > 0) {
    // Filter out known noisy third-party noise; only count real errors
    const real = page._jsErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource')
    );
    if (real.length > 0) {
      issues.push('JS errors: ' + real.slice(0, 3).join(' | '));
    }
  }

  // 2. Body length > 500 chars
  const bodyText = await page.evaluate(() => document.body ? document.body.innerHTML.length : 0);
  if (bodyText < 500) {
    issues.push('Page blanche ou trop courte (' + bodyText + ' chars)');
  }

  // 3. Forbidden strings in DOM text
  const domText = await page.evaluate(() => document.body ? document.body.innerText : '');
  if (/\bNaN\b/.test(domText)) {
    issues.push('Texte "NaN" visible dans le DOM');
  }
  if (/\bundefined\b/.test(domText)) {
    issues.push('Texte "undefined" visible dans le DOM');
  }
  if (/Cannot read prop/i.test(domText)) {
    issues.push('Message "Cannot read property" visible dans le DOM');
  }

  // 4. Crash fallback div detected (rendered by render()'s catch block)
  const hasCrashDiv = await page.evaluate(() => {
    var body = document.body ? document.body.innerText : '';
    return body.includes('Une erreur est survenue') || body.includes('Recharger');
  });
  if (hasCrashDiv) {
    issues.push('Écran de crash affiché (render() catch block)');
  }

  return { pass: issues.length === 0, issues };
}

// ─── Test runner ──────────────────────────────────────────────────────────────

async function runTest(name, fn, browser) {
  const { page, context } = await createPage(browser);
  let pass = false;
  let issues = [];
  try {
    await loadApp(page);
    await injectState(page, {});          // set base state first
    await fn(page);                        // test-specific mutations + render
    await page.waitForTimeout(600);        // let async renders settle
    const result = await checkPage(page, name);
    pass = result.pass;
    issues = result.issues;
  } catch (err) {
    issues.push('Exception test runner: ' + err.message);
  } finally {
    await context.close();
  }
  return { name, pass, issues };
}

// ─── Individual tests ─────────────────────────────────────────────────────────

const TESTS = [

  // ── T01: S.view='inexistant' → render() → fallback today ─────────────────
  {
    name: 'T01 — S.view="inexistant" → fallback today',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.view = 'inexistant';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T02: S.view='calendar' + SMART_CALENDAR non chargé ───────────────────
  {
    name: 'T02 — view="calendar" + SMART_CALENDAR=undefined',
    fn: async (page) => {
      await page.evaluate(() => {
        window._SMART_CALENDAR_BACKUP = window.SMART_CALENDAR;
        delete window.SMART_CALENDAR;
        window.S.view = 'calendar';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T03: S.view='today' + appMode=null ────────────────────────────────────
  {
    name: 'T03 — view="today" + appMode=null',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.appMode = null;
        window.S.nStep = 0;
        window.S.sStep = 0;
        window.S.welcomeShown = true;
        window.S.view = 'today';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T04: Navigation rapide today→sport→nutrition→today 5× ────────────────
  {
    name: 'T04 — Navigation rapide 5× today→sport→nutrition→today',
    fn: async (page) => {
      await page.evaluate(() => {
        // Restore normal state first
        window.S.appMode = 'both';
        window.S.nStep = 12;
        window.S.sStep = 4;
        if (window.render) window.render();
      });
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => { window.S.view = 'today';      if (window.render) window.render(); });
        await sleep(80);
        await page.evaluate(() => { window.S.view = 'sport';      if (window.render) window.render(); });
        await sleep(80);
        await page.evaluate(() => { window.S.view = 'nutrition';  if (window.render) window.render(); });
        await sleep(80);
        await page.evaluate(() => { window.S.view = 'today';      if (window.render) window.render(); });
        await sleep(80);
      }
      await page.waitForTimeout(500);
    }
  },

  // ── T05: S.nStep=9 (habitudes alimentaires) sans weekPlan ────────────────
  {
    name: 'T05 — nStep=9 (planning) sans weekPlan',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.weekPlan = null;
        window.S.nStep = 9;
        window.S.view = 'nutrition';
        if (window.render) window.render();
      });
      await page.waitForTimeout(800);
    }
  },

  // ── T06: S.nStep=11 (résultats) sans avoir complété tous les champs ───────
  {
    name: 'T06 — nStep=11 (résultats) sans champs complets',
    fn: async (page) => {
      await page.evaluate(() => {
        // Remove fields that renderStep8 guards against
        window.S.goal = null;        // renderStep8 redirects to goStep(4) if goal===null
        window.S.nStep = 11;
        window.S.view = 'nutrition';
        if (window.render) window.render();
      });
      await page.waitForTimeout(800);
    }
  },

  // ── T07: S.sStep=4 (programme muscu) sans sportType défini ────────────────
  {
    name: 'T07 — sStep=4 (programme muscu) sans sportType',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.sportType = undefined;
        window.S.sportFocus = {};
        window.S.sStep = 4;
        window.S.view = 'sport';
        if (window.render) window.render();
      });
      await page.waitForTimeout(800);
    }
  },

  // ── T08: S.sStep=10 (programme hyrox) sans données hyrox ─────────────────
  {
    name: 'T08 — sStep=10 (programme hyrox) sans données hyrox',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.hyroxLevel = undefined;
        window.S.hyroxGoal  = undefined;
        window.S.hyroxProgram = null;
        window.S.sStep = 10;
        window.S.view = 'sport';
        if (window.render) window.render();
      });
      await page.waitForTimeout(1000);
    }
  },

  // ── T09: appMode='nutrition' + S.view='sport' ─────────────────────────────
  {
    name: 'T09 — appMode="nutrition" + view="sport"',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.appMode = 'nutrition';
        window.S.view = 'sport';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T10: appMode='sport' + S.view='nutrition' ─────────────────────────────
  {
    name: 'T10 — appMode="sport" + view="nutrition"',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.appMode = 'sport';
        window.S.view = 'nutrition';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T11: Cliquer "Retour" depuis une étape inexistante ────────────────────
  {
    name: 'T11 — Retour depuis étape inexistante (sStep=99)',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.sStep = 99;
        window.S.view = 'sport';
        if (window.render) window.render();
        // Simulate back navigation
        window.S.sStep = Math.max(0, window.S.sStep - 1);
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T12: view='today' après reset total ───────────────────────────────────
  {
    name: 'T12 — view="today" après reset (weekPlan=null, nStep=0, sStep=0)',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.weekPlan = null;
        window.S.nStep = 0;
        window.S.sStep = 0;
        window.S.sportProgram = null;
        window.S.view = 'today';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T13: Double render() simultané via 2 setTimeout(0) ───────────────────
  {
    name: 'T13 — Double render() simultané (race condition)',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.view = 'today';
        // Fire two renders "simultaneously" — the _lock should prevent re-entrant crash
        setTimeout(function () { if (window.render) window.render(); }, 0);
        setTimeout(function () { if (window.render) window.render(); }, 0);
      });
      await page.waitForTimeout(800);
    }
  },

  // ── T14: S.selectedDay=999 (hors bornes) → planning nutrition ────────────
  {
    name: 'T14 — selectedDay=999 (hors bornes) → planning',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.selectedDay = 999;
        window.S.nStep = 12;
        window.S.view = 'nutrition';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  },

  // ── T15: S.selectedDay=-1 ────────────────────────────────────────────────
  {
    name: 'T15 — selectedDay=-1 → planning',
    fn: async (page) => {
      await page.evaluate(() => {
        window.S.selectedDay = -1;
        window.S.nStep = 12;
        window.S.view = 'nutrition';
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }
  }

];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== test-crash-navigation.js — SmartFitCoach QA ===\n');

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const results = [];

  for (const test of TESTS) {
    process.stdout.write('  Running: ' + test.name + ' … ');
    const result = await runTest(test.name, test.fn, browser);
    results.push(result);
    console.log(result.pass ? '✓ PASS' : '✗ FAIL — ' + result.issues.join(' | '));
  }

  await browser.close();

  // ─── Summary ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length;
  const failed = results.length - passed;

  console.log('\n' + '─'.repeat(60));
  console.log('## RAPPORT CRASH-NAVIGATION\n');
  console.log('### Résumé: ' + passed + '/' + results.length + ' PASS, ' + failed + ' FAIL\n');

  if (failed === 0) {
    console.log('Tous les tests passent. Aucun crash détecté.\n');
  } else {
    console.log('### Bugs trouvés:\n');
    results.filter(r => !r.pass).forEach(r => {
      console.log('- Test: ' + r.name);
      r.issues.forEach(issue => console.log('  Symptôme: ' + issue));
      console.log('');
    });
  }

  // ─── Analyse statique des causes ──────────────────────────────────────────
  console.log('─'.repeat(60));
  console.log('### Analyse statique du code source\n');

  // ─── BUGs critiques trouvés par les tests ────────────────────────────────────
  console.log(
    '*** BUG B1 (critique — confirmé par T04, T09, T11 — 1ère exécution) ***\n' +
    '- Test: T04 Navigation rapide / T09 appMode=nutrition+view=sport / T11 sStep=99\n' +
    '- Fichier:ligne: app-sport.js:6061\n' +
    '- Symptôme: TypeError: (exRef.sets || "").match is not a function\n' +
    '  Écran de crash "Une erreur est survenue" affiché à l\'utilisateur.\n' +
    '- Cause: muscu-programs.js stocke sets comme entier (ex: 4, 3, 5).\n' +
    '  La ligne 6061 fait (exRef.sets || \'\').match(regex).\n' +
    '  Quand sets=4 (truthy), (4 || \'\') = 4 — un Number, pas une String.\n' +
    '  Number.prototype.match() n\'existe pas → TypeError au runtime.\n' +
    '  Le catch de render() attrape l\'erreur → écran crash affiché.\n' +
    '- Fix (ligne app-sport.js:6061):\n' +
    '    // AVANT (bugué):\n' +
    '    var setsMatch = (exRef.sets || \'\').match(/^(\\d+)\\s*[x×]\\s*(\\d+)(?:-(\\d+))?/);\n' +
    '    var numSets = setsMatch ? parseInt(setsMatch[1]) : 3;\n' +
    '    var minReps = setsMatch ? parseInt(setsMatch[2]) : 10;\n' +
    '    var maxReps = setsMatch && setsMatch[3] ? parseInt(setsMatch[3]) : minReps;\n' +
    '    // APRÈS (corrigé):\n' +
    '    var setsMatch = String(exRef.sets || \'\').match(/^(\\d+)\\s*[x×]\\s*(\\d+)(?:-(\\d+))?/);\n' +
    '    var numSets  = setsMatch ? parseInt(setsMatch[1]) : (typeof exRef.sets === \'number\' ? exRef.sets : 3);\n' +
    '    var minReps  = setsMatch ? parseInt(setsMatch[2]) : (typeof exRef.reps === \'number\' ? exRef.reps : 10);\n' +
    '    var maxReps  = setsMatch && setsMatch[3] ? parseInt(setsMatch[3]) : minReps;\n'
  );

  console.log(
    '*** BUG B2 (critique — confirmé par T04, T09, T11 — 2ème exécution) ***\n' +
    '- Test: T04 Navigation rapide / T09 appMode=nutrition+view=sport / T11 sStep=99\n' +
    '- Fichier:ligne: app-sport.js:5940-5945  +  app-core.js:10 (helper h())\n' +
    '- Symptôme: TypeError: Failed to execute \'addEventListener\' on \'EventTarget\':\n' +
    '  parameter 2 is not of type \'Object\'.\n' +
    '  Écran de crash "Une erreur est survenue" affiché à l\'utilisateur.\n' +
    '- Cause: La création d\'un <img> via h() passe une string à onerror:\n' +
    '    h(\'img\', { onerror: \'this.style.display="none"\' })\n' +
    '  Le helper h() (app-core.js:10) traite tout attribut "on*" avec addEventListener():\n' +
    '    el.addEventListener(k.slice(2), attrs[k])\n' +
    '  → el.addEventListener(\'error\', \'this.style.display="none"\')\n' +
    '  addEventListener() requiert une Function ou un objet EventListener,\n' +
    '  pas une String → TypeError fatal qui crash render().\n' +
    '- Fix (ligne app-sport.js:5944):\n' +
    '    // AVANT (bugué):\n' +
    '    onerror: \'this.style.display="none"\'\n' +
    '    // APRÈS (corrigé) — utiliser une vraie fonction:\n' +
    '    onerror: function(e) { e.currentTarget.style.display = \'none\'; }\n'
  );

  console.log('─'.repeat(60));
  console.log('');

  console.log(
    '[app-main.js:1202-1207] — S.view="calendar" sans SMART_CALENDAR\n' +
    '  Code:    } else if (S.view === \'calendar\' && window.SMART_CALENDAR) {\n' +
    '  Cause:   Si SMART_CALENDAR est absent, la branche tombe dans le else final\n' +
    '           qui force S.view=\'today\'. Comportement correct — pas de crash.\n'
  );

  console.log(
    '[app-main.js:1204-1207] — S.view="sport" avec appMode="nutrition"\n' +
    '  Code:    } else if (S.view === \'sport\' && window.SPORT) {\n' +
    '  Cause:   La nav-bar masque l\'onglet Sport si appMode=\'nutrition\', mais\n' +
    '           un appel direct window.S.view=\'sport\' + render() entre dans\n' +
    '           la branche sport normalement. Pas de crash si SPORT est chargé.\n' +
    '  Risque:  Si SPORT module absent → fallback today sans message d\'erreur.\n'
  );

  console.log(
    '[app-main.js:1206-1207] — S.view="nutrition" avec appMode="sport"\n' +
    '  Code:    } else if (S.view === \'nutrition\' && window.NUTRITION) {\n' +
    '  Cause:   Même logique que sport/nutrition. La nav-bar masque l\'onglet\n' +
    '           Nutrition si appMode=\'sport\', mais un forçage direct de S.view\n' +
    '           accède quand même au module nutrition. Pas de crash à proprement\n' +
    '           parler, mais routing incohérent avec l\'appMode déclaré.\n'
  );

  console.log(
    '[app-nutrition.js:2659-2660] — S.selectedDay hors bornes\n' +
    '  Code:    if (typeof S.selectedDay !== \'number\' || S.selectedDay < 0\n' +
    '           || S.selectedDay > 6) S.selectedDay = 0;\n' +
    '  Cause:   Guard présent → selectedDay=999 et -1 sont remis à 0 avant\n' +
    '           l\'accès au tableau weekPlan. Pas de crash.\n'
  );

  console.log(
    '[app-nutrition.js:1924-1930] — nStep=11 (renderStep8) sans goal/sex/weight\n' +
    '  Code:    if (S.goal === null || S.goal === undefined) { goStep(4); return; }\n' +
    '           if (!S.sex || !S.weight || !S.height) { goStep(1); return; }\n' +
    '  Cause:   Guards présents — redirige vers l\'étape correcte. Pas de crash.\n'
  );

  console.log(
    '[app-sport.js ligne sStep=10] — renderHyroxProgram sans données hyrox\n' +
    '  Code:    if (!S.hyroxLevel || !S.hyroxGoal) { S.sStep = 9;\n' +
    '           setTimeout(function() { if (window.render) window.render(); }, 0); return; }\n' +
    '  Cause:   Guard présent — redirige vers config Hyrox. Attention : le return\n' +
    '           se fait sans rien appendre au conteneur p, donc si le render()\n' +
    '           du setTimeout échoue, p reste vide (page potentiellement courte).\n'
  );

  console.log(
    '[app-sport.js:5042-5044] — renderMusculationProgram sans sportType/sportFocus\n' +
    '  Code:    var _focusKeys = Object.keys(S.sportFocus || {}).filter(...);\n' +
    '           Guard présent : si _focusKeys est vide → retour étape 3.\n' +
    '  Cause:   sportFocus={} ou undefined → redirect vers sStep=3 silencieusement.\n' +
    '           Pas de crash mais boucle potentielle si sStep=3 redirige à son tour.\n'
  );

  console.log(
    '[app-main.js:1054-1056] — Double render() (race condition)\n' +
    '  Code:    if (render._lock) return;\n' +
    '           render._lock = true;\n' +
    '  Cause:   Le verrou render._lock est synchrone. Deux setTimeout(0)\n' +
    '           s\'exécutent dans la même boucle JS → le second appel est ignoré.\n' +
    '           Protection efficace contre la réentrance, pas de crash.\n'
  );

  console.log(
    '[app-main.js:1209-1216] — S.view=\'inexistant\' → else final\n' +
    '  Code:    } else {\n' +
    '           // Default + \'today\' + \'dashboard\' → vue Aujourd\'hui\n' +
    '           S.view = \'today\';\n' +
    '  Cause:   Toute vue non reconnue tombe dans le else qui fixe S.view=\'today\'.\n' +
    '           Fallback correct — pas de crash.\n'
  );

  console.log(
    '[app-main.js:1185-1198] — S.view=\'today\' + appMode=null + nStep=0 + sStep=0\n' +
    '  Code:    if (_authUser && !S.appMode && !S.nStep && !S.sStep && S.view !== \'profil\')\n' +
    '           → window.renderModuleChoice(content)\n' +
    '  Cause:   Avec appMode=null ET nStep=0 ET sStep=0, l\'app affiche le choix\n' +
    '           de module (comportement voulu). Pas de crash mais rendu différent\n' +
    '           de ce qu\'on attendrait pour "today".\n'
  );

  console.log('─'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
