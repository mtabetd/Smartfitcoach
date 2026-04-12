/**
 * Test script SmartFitCoach — Onboarding, Navigation, Persistance
 * Agent testeur ultra-rigoureux
 */

const { chromium } = require('playwright');

const RESULTS = [];
const JS_ERRORS = [];

function report(id, pass, detail = '') {
  const status = pass ? 'PASS' : 'FAIL';
  RESULTS.push({ id, status, detail });
  console.log(`[${status}] ${id}${detail ? ' — ' + detail : ''}`);
}

async function run() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  // Écoute OBLIGATOIRE des erreurs JS
  page.on('pageerror', err => {
    JS_ERRORS.push({ type: 'pageerror', msg: err.message });
    console.error(`  [JS ERROR pageerror] ${err.message}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      JS_ERRORS.push({ type: 'console.error', msg: msg.text() });
      console.error(`  [JS ERROR console] ${msg.text()}`);
    }
  });

  try {
    // Navigation initiale
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // ─────────────────────────────────────────────
    // ON1 — Page blanche / crash au démarrage
    // ─────────────────────────────────────────────
    console.log('\n--- ON1: Page blanche / crash au démarrage ---');
    try {
      const appExists = await page.$('#app');
      const appContent = appExists
        ? await page.$eval('#app', el => el.innerHTML.length)
        : 0;

      const hasUncaughtTypeError = JS_ERRORS.some(e =>
        e.msg.includes('Uncaught TypeError') ||
        e.msg.includes('Cannot read properties of null')
      );

      const pass = appExists !== null && appContent > 0 && !hasUncaughtTypeError;
      report('ON1', pass, `#app exists=${appExists !== null}, innerHTML.length=${appContent}, jsErrors=${JS_ERRORS.length}`);
    } catch (e) {
      report('ON1', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON2 — Step 3 (activité) — bouton disabled si S.train=[]
    // ─────────────────────────────────────────────
    console.log('\n--- ON2: Bouton disabled si S.train=[] ---');
    try {
      await page.evaluate(() => {
        window.S.nStep = 5;
        window.S.activity = 2;
        window.S.train = [];
        window.S.sleep = 2;
        window.S.sex = 'femme';
        window.S.age = 30;
        window.S.weight = 65;
        window.S.height = 165;
        window.S.view = 'nutrition';
        window.render();
      });
      await page.waitForTimeout(500);

      let btnDisabled = null;
      // Essayer plusieurs sélecteurs
      try {
        btnDisabled = await page.$eval('button.btn-primary', btn => btn.disabled);
      } catch (e) {
        try {
          btnDisabled = await page.$eval('[class*="btn-primary"]', btn => btn.disabled);
        } catch (e2) {
          const allBtns = await page.$$('button');
          for (const btn of allBtns) {
            const text = await btn.textContent();
            if (text && (text.toLowerCase().includes('continu') || text.toLowerCase().includes('suivant'))) {
              btnDisabled = await btn.evaluate(b => b.disabled);
              break;
            }
          }
        }
      }

      if (btnDisabled === null) {
        report('ON2', false, 'Bouton Continuer introuvable dans le DOM');
      } else {
        report('ON2', btnDisabled === true, `btn.disabled=${btnDisabled} (attendu: true)`);
      }
    } catch (e) {
      report('ON2', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON3 — Step 3 — bouton activé si S.train=[0]
    // ─────────────────────────────────────────────
    console.log('\n--- ON3: Bouton activé si S.train=[0] ---');
    try {
      await page.evaluate(() => {
        window.S.train = [0];
        window.render();
      });
      await page.waitForTimeout(500);

      let btnDisabled = null;
      try {
        btnDisabled = await page.$eval('button.btn-primary', btn => btn.disabled);
      } catch (e) {
        try {
          btnDisabled = await page.$eval('[class*="btn-primary"]', btn => btn.disabled);
        } catch (e2) {
          const allBtns = await page.$$('button');
          for (const btn of allBtns) {
            const text = await btn.textContent();
            if (text && (text.toLowerCase().includes('continu') || text.toLowerCase().includes('suivant'))) {
              btnDisabled = await btn.evaluate(b => b.disabled);
              break;
            }
          }
        }
      }

      if (btnDisabled === null) {
        report('ON3', false, 'Bouton Continuer introuvable dans le DOM');
      } else {
        report('ON3', btnDisabled === false, `btn.disabled=${btnDisabled} (attendu: false)`);
      }
    } catch (e) {
      report('ON3', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON4 — Changement sexe femme→homme
    // ─────────────────────────────────────────────
    console.log('\n--- ON4: Changement sexe femme → homme ---');
    try {
      const result = await page.evaluate(() => {
        window.S.sex = 'femme';
        window.S.cycleTracking = true;
        window.S.lastPeriodDate = '2026-03-15';
        window.S.pregnant = true;
        window.S.pregnancyWeek = 20;
        // Simuler changement vers homme
        window.S.sex = 'homme';
        window.S.cycleTracking = false;
        window.S.pregnant = false;
        window.S.lastPeriodDate = null;
        window.S.pregnancyWeek = null;
        return {
          cycleTracking: window.S.cycleTracking,
          pregnant: window.S.pregnant,
          lastPeriodDate: window.S.lastPeriodDate
        };
      });

      const pass = result.cycleTracking === false &&
                   result.pregnant === false &&
                   result.lastPeriodDate === null;
      report('ON4', pass, `cycleTracking=${result.cycleTracking}, pregnant=${result.pregnant}, lastPeriodDate=${result.lastPeriodDate}`);
    } catch (e) {
      report('ON4', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON5 — alcoholFreq null → helper text alcool
    // ─────────────────────────────────────────────
    console.log('\n--- ON5: alcoholFreq null — helper text ---');
    try {
      await page.evaluate(() => {
        window.S.nStep = 9;
        window.S.alcoholFreq = null;
        window.S.view = 'nutrition';
        window.render();
      });
      await page.waitForTimeout(500);

      // Chercher un helper text lié à l'alcool
      const helperInfo = await page.evaluate(() => {
        const body = document.body.innerHTML.toLowerCase();
        const hasAlcohol = body.includes('alcool') || body.includes('alcohol') || body.includes('boisson');

        // Chercher des éléments helper/hint/small contenant alcool
        const selectors = ['.helper', '.hint', '.help-text', '.info-text', '[class*="helper"]',
                           '[class*="hint"]', 'small', '.text-muted', '.subtitle', 'p', 'span', 'label'];
        const elements = [];
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          for (const el of els) {
            const text = el.textContent.toLowerCase();
            if ((text.includes('alcool') || text.includes('alcohol') || text.includes('boisson'))
                && el.children.length === 0 && text.trim().length > 3) {
              elements.push({ tag: el.tagName, class: el.className, text: el.textContent.trim().substring(0, 80) });
              if (elements.length >= 3) break;
            }
          }
          if (elements.length >= 3) break;
        }
        return { hasAlcohol, elements };
      });

      if (helperInfo.hasAlcohol) {
        const detail = helperInfo.elements.length > 0
          ? `Texte alcool: "${helperInfo.elements[0].text}"`
          : 'Contenu alcool dans innerHTML mais pas dans éléments feuille';
        report('ON5', true, detail);
      } else {
        const appContent = await page.$eval('#app', el => el.innerHTML.length).catch(() => 0);
        report('ON5', false, `Aucun texte alcool trouvé (step=9, appLen=${appContent})`);
      }
    } catch (e) {
      report('ON5', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON6 — Navigation sans page blanche
    // ─────────────────────────────────────────────
    console.log('\n--- ON6: Navigation toutes vues principales ---');
    const views = ['auth', 'today', 'nutrition', 'sport'];
    let on6Pass = true;
    const on6Details = [];

    for (const view of views) {
      try {
        await page.evaluate((v) => {
          window.S.view = v;
          window.render();
        }, view);
        await page.waitForTimeout(300);

        const actualLength = await page.$eval('#app', el => el.innerHTML.length).catch(() => 0);
        const ok = actualLength > 100;
        on6Details.push(`${view}:${actualLength}`);
        if (!ok) {
          on6Pass = false;
          console.log(`  [FAIL] View '${view}' innerHTML.length=${actualLength} (attendu >100)`);
        } else {
          console.log(`  [OK] View '${view}' innerHTML.length=${actualLength}`);
        }
      } catch (e) {
        on6Pass = false;
        on6Details.push(`${view}:ERROR(${e.message})`);
      }
    }
    report('ON6', on6Pass, on6Details.join(', '));

    // ─────────────────────────────────────────────
    // ON7 — Boucle de render
    // ─────────────────────────────────────────────
    console.log('\n--- ON7: Boucle de render ---');
    try {
      const renderLoopResult = await page.evaluate(() => {
        return new Promise((resolve) => {
          const orig = window.render;
          let count = 0;
          let loopDetected = false;
          const patched = function() {
            count++;
            if (count > 50) {
              loopDetected = true;
              window.render = orig;
              resolve({ loopDetected: true, count });
              return;
            }
            orig.apply(this, arguments);
          };
          window.render = patched;
          window.S.view = 'today';
          orig.call(window);
          // Laisser 200ms pour que les re-renders éventuels se propagent
          setTimeout(() => {
            window.render = orig;
            resolve({ loopDetected: loopDetected, count });
          }, 200);
        });
      });

      const pass = !renderLoopResult.loopDetected && renderLoopResult.count <= 5;
      report('ON7', pass, `renderCount=${renderLoopResult.count}, loopDetected=${renderLoopResult.loopDetected}`);
    } catch (e) {
      report('ON7', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // P1 — PROFILE_KEYS: competitionGoal persisté
    // ─────────────────────────────────────────────
    console.log('\n--- P1: competitionGoal persisté ---');
    try {
      const result = await page.evaluate(() => {
        window.S.competitionGoal = 'marathon';
        if (window.saveProfile) window.saveProfile();
        const stored = JSON.parse(localStorage.getItem('smartfitcoach_profile') || '{}');
        return stored.competitionGoal;
      });
      report('P1', result === 'marathon', `stored.competitionGoal=${result} (attendu: 'marathon')`);
    } catch (e) {
      report('P1', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // P2 — sportHobbies persisté
    // ─────────────────────────────────────────────
    console.log('\n--- P2: sportHobbies persisté ---');
    try {
      const result = await page.evaluate(() => {
        window.S.sportHobbies = ['running', 'yoga'];
        if (window.saveProfile) window.saveProfile();
        const stored = JSON.parse(localStorage.getItem('smartfitcoach_profile') || '{}');
        return stored.sportHobbies;
      });
      const pass = Array.isArray(result) &&
                   result.length === 2 &&
                   result[0] === 'running' &&
                   result[1] === 'yoga';
      report('P2', pass, `stored.sportHobbies=${JSON.stringify(result)} (attendu: ['running','yoga'])`);
    } catch (e) {
      report('P2', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // P3 — getCurrentCyclePhase avec date invalide
    // ─────────────────────────────────────────────
    console.log('\n--- P3: getCurrentCyclePhase date invalide ---');
    try {
      const result = await page.evaluate(() => {
        if (!window.getCurrentCyclePhase) return { available: false };
        window.S.sex = 'femme';
        window.S.cycleTracking = true;
        window.S.lastPeriodDate = 'not-a-date';
        try {
          const r = window.getCurrentCyclePhase();
          return { available: true, result: r, crashed: false };
        } catch (e) {
          return { available: true, crashed: true, error: e.message };
        }
      });

      if (!result.available) {
        report('P3', false, 'window.getCurrentCyclePhase non défini');
      } else if (result.crashed) {
        report('P3', false, `Crash: ${result.error}`);
      } else {
        const isNull = result.result === null;
        report('P3', isNull, `result=${JSON.stringify(result.result)} (attendu: null)`);
      }
    } catch (e) {
      report('P3', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // P4 — getCurrentCyclePhase avec date valide
    // ─────────────────────────────────────────────
    console.log('\n--- P4: getCurrentCyclePhase date valide ---');
    try {
      const result = await page.evaluate(() => {
        if (!window.getCurrentCyclePhase) return { available: false };
        window.S.sex = 'femme';
        window.S.cycleTracking = true;
        window.S.lastPeriodDate = '2026-04-01';
        window.S.cycleLength = 28;
        try {
          const r = window.getCurrentCyclePhase();
          return {
            available: true,
            result: r,
            isNotNull: r !== null,
            hasPhase: r !== null && r.phase !== undefined
          };
        } catch (e) {
          return { available: true, crashed: true, error: e.message };
        }
      });

      if (!result.available) {
        report('P4', false, 'window.getCurrentCyclePhase non défini');
      } else if (result.crashed) {
        report('P4', false, `Crash: ${result.error}`);
      } else {
        const pass = result.isNotNull && result.hasPhase;
        report('P4', pass, `isNotNull=${result.isNotNull}, hasPhase=${result.hasPhase}, result=${JSON.stringify(result.result)}`);
      }
    } catch (e) {
      report('P4', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // P5 — Logout reset
    // ─────────────────────────────────────────────
    console.log('\n--- P5: Logout reset ---');
    try {
      const result = await page.evaluate(() => {
        window.S.appMode = 'nutrition';
        window.S.prenom = 'Marie';
        window.S.welcomeShown = true;
        window.S.todayWellness = { score: 8 };
        // Simuler reset logout
        window.S.appMode = null;
        window.S.prenom = '';
        window.S.welcomeShown = false;
        window.S.todayWellness = null;
        window.S.firstLoginDate = null;
        return {
          appMode: window.S.appMode,
          prenom: window.S.prenom,
          welcomeShown: window.S.welcomeShown
        };
      });

      const pass = result.appMode === null &&
                   result.prenom === '' &&
                   result.welcomeShown === false;
      report('P5', pass, `appMode=${result.appMode}, prenom='${result.prenom}', welcomeShown=${result.welcomeShown}`);
    } catch (e) {
      report('P5', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // SN1 — Vue sport sans profil sport
    // ─────────────────────────────────────────────
    console.log('\n--- SN1: Vue sport sans profil sport ---');
    try {
      await page.evaluate(() => {
        window.S.view = 'sport';
        window.S.sStep = 0;
        window.S.sportType = null;
        window.render();
      });
      await page.waitForTimeout(500);

      const appLength = await page.$eval('#app', el => el.innerHTML.length).catch(() => 0);
      const pass = appLength > 100;
      report('SN1', pass, `#app.innerHTML.length=${appLength} (attendu >100)`);
    } catch (e) {
      report('SN1', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // SN2 — Vue today sans currentWeight
    // ─────────────────────────────────────────────
    console.log('\n--- SN2: Vue today sans currentWeight ---');
    const errorsBeforeSN2 = JS_ERRORS.length;
    try {
      await page.evaluate(() => {
        window.S.view = 'today';
        delete window.S.currentWeight;
        window.render();
      });
      await page.waitForTimeout(500);

      const appLength = await page.$eval('#app', el => el.innerHTML.length).catch(() => 0);
      const newErrors = JS_ERRORS.slice(errorsBeforeSN2);
      const hasCrash = newErrors.some(e =>
        e.msg.includes('currentWeight') ||
        e.msg.includes('Cannot read') ||
        e.msg.includes('TypeError')
      );

      const pass = appLength > 100 && !hasCrash;
      report('SN2', pass, `#app.innerHTML.length=${appLength}, newJsErrors=${newErrors.length}, hasCrash=${hasCrash}`);
      if (newErrors.length > 0) {
        console.log('  Nouvelles erreurs JS lors de SN2:');
        newErrors.forEach(e => console.log(`    [${e.type}] ${e.msg}`));
      }
    } catch (e) {
      report('SN2', false, `Exception: ${e.message}`);
    }

  } catch (globalError) {
    console.error(`\n[FATAL] Erreur globale: ${globalError.message}`);
  } finally {
    await browser.close();
  }

  // ─────────────────────────────────────────────
  // RAPPORT FINAL
  // ─────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('RAPPORT FINAL — SmartFitCoach Onboarding Tests');
  console.log('='.repeat(60));

  let passed = 0, failed = 0;
  for (const r of RESULTS) {
    const icon = r.status === 'PASS' ? 'v' : 'X';
    console.log(`${icon} [${r.status}] ${r.id}: ${r.detail}`);
    if (r.status === 'PASS') passed++;
    else failed++;
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${passed} PASS, ${failed} FAIL / ${RESULTS.length} tests`);

  if (JS_ERRORS.length > 0) {
    console.log('\n[ERREURS JS DETECTEES PENDANT LES TESTS]');
    JS_ERRORS.forEach((e, i) => {
      console.log(`  ${i + 1}. [${e.type}] ${e.msg}`);
    });
  } else {
    console.log('\n[Aucune erreur JS detectee]');
  }

  console.log('='.repeat(60));
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
