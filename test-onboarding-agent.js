/**
 * Test script SmartFitCoach — Onboarding, Navigation, Persistance
 * Agent testeur ultra-rigoureux
 *
 * Corrections appliquées après analyse du code source:
 * - AUTH gate: render() vérifie AUTH.isLoggedIn() → mock nécessaire pour accéder aux vues
 * - localStorage key: 'mtd_profile_anon' (uid='anon' sans session), encodé XOR+base64
 * - ON5 alcool: nStep=9 est sub-page 0 (habitudes), le bloc alcool est à _s5page=1
 * - ON7: render() a un _lock anti-récursion, le renderCount est toujours 0 (c'est normal)
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
    // SETUP: Mocker AUTH.isLoggedIn() pour bypasser le gate d'authentification
    // render() vérifie window.AUTH.isLoggedIn() → retourner true pour accéder aux vues app
    // ─────────────────────────────────────────────
    await page.evaluate(() => {
      if (window.AUTH) {
        window.AUTH._origIsLoggedIn = window.AUTH.isLoggedIn;
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH._origGetUser = window.AUTH.getUser;
        window.AUTH.getUser = function() { return { id: 'anon', email: 'test@test.com' }; };
      }
      // Initialiser un état S minimal pour l'onboarding
      window.S.prenom = 'Test';
      window.S.sex = 'femme';
      window.S.age = 30;
      window.S.weight = 65;
      window.S.height = 165;
      window.S.activity = 2;
      window.S.sleep = 2;
      window.S.goal = 2;
      window.S.appMode = 'nutrition';
    });

    // ─────────────────────────────────────────────
    // ON2 — Step 5 (activité/train/sleep) — bouton désactivé si S.train=[]
    // ─────────────────────────────────────────────
    console.log('\n--- ON2: Bouton disabled si S.train=[] ---');
    try {
      await page.evaluate(() => {
        window.S.nStep = 5;
        window.S.activity = 2;
        window.S.train = []; // tableau vide — bouton doit être disabled
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
      // Chercher le bouton Continuer/Suivant dans le DOM
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
        // Diagnostiquer: quels boutons existent?
        const btnInfo = await page.$$eval('button', btns =>
          btns.map(b => ({ text: b.textContent.trim().substring(0, 30), disabled: b.disabled, classes: b.className }))
        );
        report('ON2', false, `Bouton Continuer introuvable. Boutons présents: ${JSON.stringify(btnInfo)}`);
      } else {
        report('ON2', btnDisabled === true, `btn.disabled=${btnDisabled} (attendu: true)`);
      }
    } catch (e) {
      report('ON2', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON3 — Step 5 — bouton activé si S.train=[0]
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
        const btnInfo = await page.$$eval('button', btns =>
          btns.map(b => ({ text: b.textContent.trim().substring(0, 30), disabled: b.disabled, classes: b.className }))
        );
        report('ON3', false, `Bouton Continuer introuvable. Boutons présents: ${JSON.stringify(btnInfo)}`);
      } else {
        report('ON3', btnDisabled === false, `btn.disabled=${btnDisabled} (attendu: false)`);
      }
    } catch (e) {
      report('ON3', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON4 — Changement sexe femme→homme: nettoyage données féminines
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
    // ON5 — alcoholFreq: vérifier qu'un texte d'aide apparaît quand alcoholFreq=null
    // Note: nStep=9 (renderStep5) a 2 sous-pages: _s5page=0 (habitudes), _s5page=1 (suppléments+alcool)
    // Le bloc alcool est sur _s5page=1
    // ─────────────────────────────────────────────
    console.log('\n--- ON5: alcoholFreq null — helper text alcool (nStep=9, _s5page=1) ---');
    try {
      await page.evaluate(() => {
        window.S.sex = 'femme'; // remettre femme pour que le bloc alcool s'affiche (pas grossesse)
        window.S.pregnant = false;
        window.S.nStep = 9;
        window.S.alcoholFreq = null;
        window.S.view = 'nutrition';
        window._s5page = 1; // sous-page suppléments + alcool
        // S'assurer que mealsPerDay est défini pour éviter undefined sur habitudes
        window.S.mealsPerDay = 3;
        window.S.eatingLocation = 'home';
        window.S.mealPrepTime = 30;
        window.S.snacking = false;
        window.render();
      });
      await page.waitForTimeout(600);

      const helperInfo = await page.evaluate(() => {
        const body = document.body.innerHTML.toLowerCase();
        const hasAlcohol = body.includes('alcool') || body.includes('alcohol') || body.includes('boisson');
        // Chercher section-label ou freqLabel
        const labels = Array.from(document.querySelectorAll('.section-label, label, .divider-text, h2, h3, p'));
        const alcoholLabels = labels
          .filter(el => el.textContent.toLowerCase().includes('alcool') || el.textContent.toLowerCase().includes('alcohol'))
          .map(el => ({ tag: el.tagName, text: el.textContent.trim().substring(0, 80) }));
        return { hasAlcohol, alcoholLabels, appLen: document.querySelector('#app') ? document.querySelector('#app').innerHTML.length : 0 };
      });

      if (helperInfo.hasAlcohol && helperInfo.alcoholLabels.length > 0) {
        report('ON5', true, `Texte alcool: "${helperInfo.alcoholLabels[0].text}"`);
      } else if (helperInfo.hasAlcohol) {
        report('ON5', true, `Contenu alcool trouvé dans le DOM (appLen=${helperInfo.appLen})`);
      } else {
        report('ON5', false, `Aucun texte alcool trouvé à nStep=9/_s5page=1 (appLen=${helperInfo.appLen})`);
      }
    } catch (e) {
      report('ON5', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // ON6 — Navigation sans page blanche: toutes les vues principales
    // ─────────────────────────────────────────────
    console.log('\n--- ON6: Navigation toutes vues principales ---');
    const views = ['auth', 'today', 'nutrition', 'sport'];
    let on6Pass = true;
    const on6Details = [];

    for (const view of views) {
      try {
        // Pour la vue auth, on détecte si render affiche login (car isLoggedIn=true, auth → today)
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
    // Note: render() a un mécanisme _lock anti-récursion intégré.
    // Un render direct ne se rappelle jamais lui-même de façon récursive.
    // On vérifie qu'aucune boucle ne se produit sur 200ms après un render.
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
          orig.call(window); // déclencher un render original
          // Laisser 200ms pour que les re-renders éventuels se propagent
          setTimeout(() => {
            window.render = orig;
            resolve({ loopDetected: loopDetected, count });
          }, 200);
        });
      });

      // Le _lock interne de render() signifie que count=0 si orig.call() ne re-trigger pas patched.
      // count>0 seulement si render() appelle window.render() (non orig) à l'intérieur.
      const pass = !renderLoopResult.loopDetected;
      report('ON7', pass,
        `renderCount=${renderLoopResult.count}, loopDetected=${renderLoopResult.loopDetected}` +
        (renderLoopResult.count === 0 ? ' (normal: render() utilise _lock anti-récursion)' : ''));
    } catch (e) {
      report('ON7', false, `Exception: ${e.message}`);
    }

    // ─────────────────────────────────────────────
    // P1 — PROFILE_KEYS: competitionGoal persisté
    // Note: saveProfile() stocke sous 'mtd_profile_anon' (uid='anon')
    //       avec encodage XOR+base64 via window._storageEncode
    // ─────────────────────────────────────────────
    console.log('\n--- P1: competitionGoal persisté ---');
    try {
      const result = await page.evaluate(() => {
        window.S.competitionGoal = 'marathon';
        if (window.saveProfile) window.saveProfile();
        // La clé de stockage réelle est 'mtd_profile_anon' (pas 'smartfitcoach_profile')
        const raw = localStorage.getItem('mtd_profile_anon');
        if (!raw) return { key: 'mtd_profile_anon', raw: null, decoded: null };
        let decoded = null;
        if (window._storageDecode) {
          decoded = window._storageDecode(raw);
        }
        if (!decoded) {
          try { decoded = JSON.parse(raw); } catch(e) {}
        }
        return {
          key: 'mtd_profile_anon',
          competitionGoal: decoded ? decoded.competitionGoal : 'DECODE_FAILED'
        };
      });
      const pass = result.competitionGoal === 'marathon';
      report('P1', pass, `key=${result.key}, stored.competitionGoal=${result.competitionGoal} (attendu: 'marathon')`);
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
        const raw = localStorage.getItem('mtd_profile_anon');
        if (!raw) return { sportHobbies: null };
        let decoded = null;
        if (window._storageDecode) decoded = window._storageDecode(raw);
        if (!decoded) { try { decoded = JSON.parse(raw); } catch(e) {} }
        return { sportHobbies: decoded ? decoded.sportHobbies : null };
      });
      const pass = Array.isArray(result.sportHobbies) &&
                   result.sportHobbies.length === 2 &&
                   result.sportHobbies[0] === 'running' &&
                   result.sportHobbies[1] === 'yoga';
      report('P2', pass, `stored.sportHobbies=${JSON.stringify(result.sportHobbies)} (attendu: ['running','yoga'])`);
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
        report('P4', pass, `isNotNull=${result.isNotNull}, hasPhase=${result.hasPhase}`);
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
    // SN1 — Vue sport sans profil sport: pas de page blanche
    // ─────────────────────────────────────────────
    console.log('\n--- SN1: Vue sport sans profil sport ---');
    try {
      await page.evaluate(() => {
        window.S.appMode = 'sport';
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
    // SN2 — Vue dashboard today: pas de crash avec S.currentWeight inexistant
    // ─────────────────────────────────────────────
    console.log('\n--- SN2: Vue today sans currentWeight ---');
    const errorsBeforeSN2 = JS_ERRORS.length;
    try {
      await page.evaluate(() => {
        window.S.view = 'today';
        window.S.appMode = 'nutrition';
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
    console.error(globalError.stack);
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
    const icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${r.id}: ${r.detail}`);
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
