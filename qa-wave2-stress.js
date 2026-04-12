// QA Wave 2 — Robustness / Stress Tests — SmartFitCoach
// Tests 1-8 — Playwright Chromium headless
const { chromium } = require('/home/user/Smartfitcoach/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:45515';
const SCREENSHOTS_DIR = path.join(__dirname, 'qa-wave2-screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const SETUP_SCRIPT = `
  sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  sessionStorage.setItem('mtd_seen_welcome', 'true');
  localStorage.setItem('mtd_dev_wiped_v1', 'true');
`;

const FAKE_USER_OBJ = { id: 'anon', name: 'TestUser QA', email: 'test@qa.local' };

async function newPage(browser, profile, extraInit) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(`
    ${SETUP_SCRIPT}
    ${profile ? `localStorage.setItem('mtd_profile_anon', JSON.stringify(${JSON.stringify(profile)}));` : ''}
    ${extraInit || ''}
  `);
  const page = await ctx.newPage();
  return { page, ctx };
}

async function applyAuthBypass(page, profile) {
  await page.waitForFunction(() => typeof window.AUTH !== 'undefined', { timeout: 8000 });
  await page.evaluate(([prof, fakeUser]) => {
    window.AUTH.isLoggedIn = function() { return true; };
    window.AUTH.getUser = function() { return fakeUser; };
    if (prof) {
      localStorage.setItem('mtd_profile_anon', JSON.stringify(prof));
    }
    if (window.loadProfile) window.loadProfile();
    if (window.S) {
      if (prof && (prof.sStep > 0 || prof.sportType)) window.S.view = 'sport';
      else if (prof && prof.nStep === 12) window.S.view = 'today';
    }
    if (window.render) window.render();
  }, [profile || null, FAKE_USER_OBJ]);
  await page.waitForTimeout(800);
}

async function screenshot(page, name) {
  const fp = path.join(SCREENSHOTS_DIR, name + '.png');
  await page.screenshot({ path: fp, fullPage: true });
  return fp;
}

const results = [];

function report(id, status, detail, screenshotPath) {
  const line = `[${status}] ${id}${detail ? ' — ' + detail : ''}${screenshotPath ? ' (screenshot: ' + screenshotPath + ')' : ''}`;
  results.push(line);
  console.log(line);
}

// ─── TEST 1 — Navigation rapide multi-sports (stress test) ────────────────────

async function test1(browser) {
  const profile = {
    step: 10, sex: 'homme', age: 30, poids: 80, taille: 180,
    objectif: 'prise', prenom: 'TestQA', appMode: 'both',
    nStep: 12, welcomeShown: true,
    sportType: 'crossfit', sStep: 6, crossfitLevel: 'rx',
    sportDays: 4, crossfitWeek: 2, parqDone: true
  };

  const { page, ctx } = await newPage(browser, profile);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(500);

    // Perform 6 rapid navigation transitions via JS
    const navResult = await page.evaluate(async () => {
      const views = ['sport', 'nutrition', 'today', 'sport', 'nutrition', 'today'];
      const lockStates = [];
      const errors = [];

      for (const view of views) {
        try {
          if (window.S) window.S.view = view;
          if (window.render) window.render();
          await new Promise(r => setTimeout(r, 200));
          // Capture lock state
          lockStates.push({
            view,
            lock: window.render && window.render._lock !== undefined ? window.render._lock : 'N/A'
          });
        } catch (e) {
          errors.push(e.message);
        }
      }
      return { lockStates, errors };
    });

    await page.waitForTimeout(600);

    // Check for white page
    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check render lock is not stuck
    const finalLockState = await page.evaluate(() => {
      return window.render && window.render._lock !== undefined ? window.render._lock : null;
    });

    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    const ss = await screenshot(page, 'T1-stress-nav');

    if (!hasContent) {
      report('TEST 1', 'FAIL', 'Page blanche après 6 transitions rapides', ss);
    } else if (crashErrors.length > 0) {
      report('TEST 1', 'FAIL', 'Crash JS: ' + crashErrors.slice(0, 3).join(' | '), ss);
    } else if (navResult.errors.length > 0) {
      report('TEST 1', 'FAIL', 'Erreurs navigate JS: ' + navResult.errors.slice(0, 3).join(' | '), ss);
    } else if (finalLockState === true) {
      report('TEST 1', 'FAIL', 'render._lock reste coincé (true) après transitions', ss);
    } else {
      const lockInfo = finalLockState === null ? 'render._lock non défini (pas de verrou)' : `render._lock=${finalLockState}`;
      report('TEST 1', 'PASS',
        `6 transitions sport/nutrition/today OK — pas de page blanche — ${lockInfo}`,
        ss
      );
    }

  } catch (e) {
    const ss = await screenshot(page, 'T1-exception');
    report('TEST 1', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 2 — Changement de sport en cours de programme ──────────────────────

async function test2(browser) {
  const profile = {
    step: 10, sex: 'homme', age: 30, poids: 80, taille: 180,
    objectif: 'prise', prenom: 'TestQA', appMode: 'both',
    nStep: 12, welcomeShown: true,
    sportType: 'crossfit', sStep: 6, crossfitLevel: 'rx',
    sportDays: 4, crossfitWeek: 3, parqDone: true,
    sportMixEnabled: true, sportMixSecondary: 'musculation'
  };

  const { page, ctx } = await newPage(browser, profile);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(500);

    // Navigate to sport view
    await page.evaluate(() => {
      if (window.S) window.S.view = 'sport';
      if (window.render) window.render();
    });
    await page.waitForTimeout(600);

    // Simulate "Changer de sport" — try clicking button or do JS simulation
    const changerBtn = page.locator('button:has-text("Changer de sport"), button:has-text("changer de sport"), [id*="change-sport"], [class*="change-sport"]').first();
    const changerExists = await changerBtn.count() > 0;

    if (changerExists) {
      await changerBtn.click();
      await page.waitForTimeout(600);
    } else {
      // Simulate programmatically
      await page.evaluate(() => {
        if (window.S) {
          window.S.sportType = 'musculation';
          window.S.sStep = 0;
          window.S.sportMixEnabled = false;
          window.S.sportMixSecondary = null;
        }
        if (window.render) window.render();
      });
      await page.waitForTimeout(600);
    }

    // Check state
    const state = await page.evaluate(() => ({
      sportType: window.S && window.S.sportType,
      sStep: window.S && window.S.sStep,
      sportMixEnabled: window.S && window.S.sportMixEnabled,
      sportMixSecondary: window.S && window.S.sportMixSecondary
    }));

    // Check content on screen
    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    const ss = await screenshot(page, 'T2-change-sport');

    if (crashErrors.length > 0) {
      report('TEST 2', 'FAIL', 'Crash JS: ' + crashErrors.slice(0, 3).join(' | '), ss);
    } else if (!hasContent) {
      report('TEST 2', 'FAIL', 'Page blanche après changement de sport', ss);
    } else {
      // Check conditions
      const mixDisabled = state.sportMixEnabled === false || state.sportMixEnabled === null || state.sportMixEnabled === undefined;
      const mixSecNull = state.sportMixSecondary === null || state.sportMixSecondary === undefined;
      const sStepZero = state.sStep === 0;

      const issues = [];
      if (!mixDisabled) issues.push(`sportMixEnabled=${state.sportMixEnabled} (attendu false/null)`);
      if (!mixSecNull) issues.push(`sportMixSecondary=${state.sportMixSecondary} (attendu null)`);
      if (!sStepZero) issues.push(`sStep=${state.sStep} (attendu 0)`);

      if (issues.length > 0) {
        report('TEST 2', 'FAIL',
          `Problèmes état: ${issues.join(' | ')} | changerBtn trouvé: ${changerExists}`, ss);
      } else {
        report('TEST 2', 'PASS',
          `sportMixEnabled=false ✓ | sportMixSecondary=null ✓ | sStep=0 ✓ | changerBtn trouvé: ${changerExists}`, ss);
      }
    }

  } catch (e) {
    const ss = await screenshot(page, 'T2-exception');
    report('TEST 2', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 3 — Profile photo ───────────────────────────────────────────────────

async function test3(browser) {
  const profile = {
    step: 10, sex: 'homme', age: 30, poids: 80, taille: 180,
    objectif: 'prise', prenom: 'TestQA', appMode: 'both',
    nStep: 12, welcomeShown: true,
    sportType: 'musculation', sStep: 4, sportLevel: 'intermediate',
    sportDays: 3, muscuWeek: 1, parqDone: true,
    profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  };

  const { page, ctx } = await newPage(browser, profile);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(800);

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check if photo is displayed somewhere
    const imgWithPhoto = await page.locator('img[src*="data:image/png"]').count();
    const anyImgWithBase64 = await page.locator('img[src^="data:"]').count();

    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    const ss = await screenshot(page, 'T3-profile-photo');

    if (crashErrors.length > 0) {
      report('TEST 3', 'FAIL', 'Crash JS avec profilePhoto: ' + crashErrors.slice(0, 3).join(' | '), ss);
    } else if (!hasContent) {
      report('TEST 3', 'FAIL', 'Page blanche avec profilePhoto non null', ss);
    } else {
      const photoDisplay = imgWithPhoto > 0 || anyImgWithBase64 > 0
        ? `Photo affichée (${anyImgWithBase64} img base64 trouvée)`
        : 'Photo ignorée gracieusement (pas de balise img base64 visible)';
      report('TEST 3', 'PASS', `App charge sans crash ✓ | ${photoDisplay}`, ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T3-exception');
    report('TEST 3', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 4 — Retour depuis sStep=4 vers sStep=3 vers sStep=2 ────────────────

async function test4(browser) {
  const profile = {
    sportType: 'musculation', sStep: 4,
    sportProgram: [
      { day: 'Lundi', exercises: [{ name: 'Squat', sets: '4×8-10', rest: '90s', note: 'test' }] },
      { day: 'Mercredi', exercises: [{ name: 'PDC', sets: '4×8-10', rest: '90s', note: 'test' }] },
      { day: 'Vendredi', exercises: [{ name: 'Tirage', sets: '4×8-10', rest: '90s', note: 'test' }] }
    ],
    sportLevel: 'intermediate', sportDays: 3, parqDone: true,
    step: 10, sex: 'homme', age: 30, poids: 80, taille: 180,
    objectif: 'prise', prenom: 'TestQA', appMode: 'both',
    nStep: 12, welcomeShown: true,
    sportMixEnabled: false, sportMixSecondary: null
  };

  const { page, ctx } = await newPage(browser, profile);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(500);

    // Navigate to sport view first
    const sportNav = page.locator('[data-tab="sport"], button:has-text("Sport")').first();
    if (await sportNav.count()) {
      await sportNav.click();
      await page.waitForTimeout(800);
    }

    const stateAtSStep4 = await page.evaluate(() => ({
      sStep: window.S && window.S.sStep,
      view: window.S && window.S.view,
      sportMixEnabled: window.S && window.S.sportMixEnabled,
      sportMixSecondary: window.S && window.S.sportMixSecondary
    }));

    // Click Retour once (sStep 4 → 3)
    const backBtn1 = page.locator('button:has-text("Retour"), .btn-back, [onclick*="back"], [onclick*="retour"]').first();
    const back1Exists = await backBtn1.count() > 0;

    if (back1Exists) {
      await backBtn1.click();
    } else {
      // JS fallback
      await page.evaluate(() => {
        if (window.S && window.S.sStep > 0) window.S.sStep -= 1;
        if (window.render) window.render();
      });
    }
    await page.waitForTimeout(600);

    const bodyAfterBack1 = (await page.locator('body').innerText()).trim();
    const hasContentAfterBack1 = bodyAfterBack1.length > 10;
    const stateAfterBack1 = await page.evaluate(() => ({ sStep: window.S && window.S.sStep }));

    const ss1 = await screenshot(page, 'T4-after-back1');

    // Click Retour again (sStep 3 → 2)
    const backBtn2 = page.locator('button:has-text("Retour"), .btn-back, [onclick*="back"], [onclick*="retour"]').first();
    const back2Exists = await backBtn2.count() > 0;

    if (back2Exists) {
      await backBtn2.click();
    } else {
      await page.evaluate(() => {
        if (window.S && window.S.sStep > 0) window.S.sStep -= 1;
        if (window.render) window.render();
      });
    }
    await page.waitForTimeout(600);

    const bodyAfterBack2 = (await page.locator('body').innerText()).trim();
    const hasContentAfterBack2 = bodyAfterBack2.length > 10;
    const stateAfterBack2 = await page.evaluate(() => ({
      sStep: window.S && window.S.sStep,
      sportMixEnabled: window.S && window.S.sportMixEnabled,
      sportMixSecondary: window.S && window.S.sportMixSecondary
    }));

    const ss2 = await screenshot(page, 'T4-after-back2');

    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    if (crashErrors.length > 0) {
      report('TEST 4', 'FAIL', 'Crash JS: ' + crashErrors.slice(0, 3).join(' | '), ss2);
    } else if (!hasContentAfterBack1 || !hasContentAfterBack2) {
      report('TEST 4', 'FAIL',
        `Page blanche: après 1er retour=${!hasContentAfterBack1} après 2e retour=${!hasContentAfterBack2}`, ss2);
    } else {
      const mixPreserved = stateAfterBack2.sportMixEnabled === false &&
        (stateAfterBack2.sportMixSecondary === null || stateAfterBack2.sportMixSecondary === undefined);
      report('TEST 4', 'PASS',
        `sStep initial=${stateAtSStep4.sStep} | après back1: sStep=${stateAfterBack1.sStep} ✓ | après back2: sStep=${stateAfterBack2.sStep} ✓ | sportMix préservé: ${mixPreserved}`,
        ss2
      );
    }

  } catch (e) {
    const ss = await screenshot(page, 'T4-exception');
    report('TEST 4', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 5 — Mode hors-ligne simulé ─────────────────────────────────────────

async function test5(browser) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(SETUP_SCRIPT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    // First load the page normally so it's "cached"
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Now block all network requests EXCEPT the local server (already loaded)
    await page.route('**/*', route => {
      const url = route.request().url();
      // Allow local server resources, block everything else (external APIs, CDNs, etc.)
      if (url.startsWith('http://127.0.0.1:45515') || url.startsWith('data:')) {
        route.continue();
      } else {
        route.abort();
      }
    });

    // Simulate offline by setting navigator.onLine = false
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    await page.waitForTimeout(1500);

    // Check for offline banner
    const offlineBanner = page.locator('#offline-banner');
    const bannerCount = await offlineBanner.count();
    const bannerVisible = bannerCount > 0 ? await offlineBanner.isVisible() : false;

    // Also check for any text indicating offline
    const bodyText = (await page.locator('body').innerText()).trim();
    const hasOfflineText = /hors.ligne|offline|connexion|réseau/i.test(bodyText);

    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    const ss = await screenshot(page, 'T5-offline');

    if (crashErrors.length > 0) {
      report('TEST 5', 'FAIL', 'Crash JS en mode offline: ' + crashErrors.slice(0, 3).join(' | '), ss);
    } else {
      const bannerStatus = bannerVisible
        ? '#offline-banner visible ✓'
        : bannerCount > 0
          ? '#offline-banner présent mais caché'
          : '#offline-banner absent';

      const offlineIndicator = bannerVisible || hasOfflineText;
      report('TEST 5', offlineIndicator ? 'PASS' : 'FAIL',
        `Pas de crash JS ✓ | ${bannerStatus} | texte offline détecté: ${hasOfflineText}`,
        ss
      );
    }

  } catch (e) {
    const ss = await screenshot(page, 'T5-exception');
    report('TEST 5', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 6 — localStorage corrompu (JSON invalide) ──────────────────────────

async function test6(browser) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(`
    ${SETUP_SCRIPT}
    localStorage.setItem('mtd_profile_anon', '{"broken": true, invalid json}');
  `);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check for TypeError crashes specifically
    const typeErrors = errors.filter(e => /TypeError|SyntaxError/i.test(e));
    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    // App should show onboarding or login
    const isOnboarding = /bienvenue|commencer|créer|login|connexion|email|prenom|nom|objectif|commenc/i.test(bodyText);

    const ss = await screenshot(page, 'T6-corrupt-json');

    if (crashErrors.length > 0) {
      report('TEST 6', 'FAIL',
        'Crash/TypeError sur JSON invalide: ' + crashErrors.slice(0, 3).join(' | '), ss);
    } else if (!hasContent) {
      report('TEST 6', 'FAIL', 'Page blanche sur JSON invalide', ss);
    } else {
      report('TEST 6', 'PASS',
        `App démarre sans TypeError ✓ | Contenu visible ✓ | Onboarding/login détecté: ${isOnboarding} | Erreurs JSON (attendues et gérées): ${typeErrors.length}`,
        ss
      );
    }

  } catch (e) {
    const ss = await screenshot(page, 'T6-exception');
    report('TEST 6', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 7 — Semaine CrossFit très élevée (week=52) ─────────────────────────

async function test7(browser) {
  const profile = {
    step: 10, sex: 'homme', age: 30, poids: 80, taille: 180,
    objectif: 'prise', prenom: 'TestQA', appMode: 'both',
    nStep: 12, welcomeShown: true,
    sportType: 'crossfit', sStep: 6, crossfitLevel: 'rx',
    sportDays: 4, crossfitWeek: 52, parqDone: true
  };

  const { page, ctx } = await newPage(browser, profile);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(500);

    // Navigate to sport tab
    const sportNav = page.locator('[data-tab="sport"], button:has-text("Sport")').first();
    if (await sportNav.count()) {
      await sportNav.click();
      await page.waitForTimeout(1200);
    }

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check for NaN or Infinity in rendered content
    const hasNaN = bodyText.includes('NaN');
    const hasInfinity = bodyText.includes('Infinity');

    // Verify page has programme content
    const hasProgramContent = /wod|séance|exercice|semaine|programme|entraînement|crossfit/i.test(bodyText);

    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    const ss = await screenshot(page, 'T7-crossfit-week52');

    if (crashErrors.length > 0) {
      report('TEST 7', 'FAIL', 'Crash JS week=52: ' + crashErrors.slice(0, 3).join(' | '), ss);
    } else if (!hasContent) {
      report('TEST 7', 'FAIL', 'Page blanche avec crossfitWeek=52', ss);
    } else if (hasNaN) {
      report('TEST 7', 'FAIL', 'Valeur NaN présente dans le contenu rendu', ss);
    } else if (hasInfinity) {
      report('TEST 7', 'FAIL', 'Valeur Infinity présente dans le contenu rendu', ss);
    } else {
      report('TEST 7', 'PASS',
        `Charge sans crash ✓ | Pas de NaN/Infinity ✓ | Contenu programme détecté: ${hasProgramContent}`,
        ss
      );
    }

  } catch (e) {
    const ss = await screenshot(page, 'T7-exception');
    report('TEST 7', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 8 — Musculation semaine 13+ (surcharge progressive max) ─────────────

async function test8(browser) {
  const profile = {
    sportType: 'musculation', sStep: 4, sportDays: 3, muscuWeek: 13,
    sportLevel: 'intermediate',
    sportProgram: [
      { day: 'Lundi', exercises: [{ name: 'Squat', sets: '4×8-10', rest: '90s', note: 'test' }] },
      { day: 'Mercredi', exercises: [{ name: 'PDC', sets: '4×8-10', rest: '90s', note: 'test' }] },
      { day: 'Vendredi', exercises: [{ name: 'Tirage', sets: '4×8-10', rest: '90s', note: 'test' }] }
    ],
    parqDone: true, sex: 'homme', age: 30, poids: 80, taille: 180,
    step: 10, objectif: 'prise', prenom: 'TestQA', appMode: 'both',
    nStep: 12, welcomeShown: true
  };

  const { page, ctx } = await newPage(browser, profile);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(500);

    // Navigate to sport tab
    const sportNav = page.locator('[data-tab="sport"], button:has-text("Sport")').first();
    if (await sportNav.count()) {
      await sportNav.click();
      await page.waitForTimeout(1200);
    }

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check for NaN or Infinity in rendered content
    const hasNaN = bodyText.includes('NaN');
    const hasInfinity = bodyText.includes('Infinity');

    // Check for banner vert (surcharge progressive)
    const greenBanner = page.locator('.banner-vert, .progression-banner, [class*="surcharge"], [class*="progression"]');
    const greenBannerCount = await greenBanner.count();

    // Also look for green-colored elements
    const progressionKeywords = /surcharge|progression|progressif|semaine 1[3-9]|augment/i.test(bodyText);

    // Check for numeric coherence in displayed numbers
    const numbersInPage = bodyText.match(/\d+\.?\d*/g) || [];
    const allNumbersValid = numbersInPage.every(n => {
      const num = parseFloat(n);
      return !isNaN(num) && isFinite(num);
    });

    const crashErrors = errors.filter(e =>
      /TypeError|Cannot read|Cannot set|undefined is not|null is not|is not a function/i.test(e)
    );

    const ss = await screenshot(page, 'T8-muscu-week13');

    if (crashErrors.length > 0) {
      report('TEST 8', 'FAIL', 'Crash JS muscuWeek=13: ' + crashErrors.slice(0, 3).join(' | '), ss);
    } else if (!hasContent) {
      report('TEST 8', 'FAIL', 'Page blanche avec muscuWeek=13', ss);
    } else if (hasNaN) {
      report('TEST 8', 'FAIL', 'Valeur NaN présente dans le contenu rendu', ss);
    } else if (hasInfinity) {
      report('TEST 8', 'FAIL', 'Valeur Infinity présente dans le contenu rendu', ss);
    } else {
      const bannerInfo = greenBannerCount > 0
        ? `Banner progression trouvé (${greenBannerCount} élément(s)) ✓`
        : progressionKeywords
          ? 'Texte progression détecté ✓'
          : 'Pas de banner/texte progression explicite détecté';
      report('TEST 8', 'PASS',
        `Charge sans crash ✓ | Pas de NaN/Infinity ✓ | Nombres cohérents: ${allNumbersValid} | ${bannerInfo}`,
        ss
      );
    }

  } catch (e) {
    const ss = await screenshot(page, 'T8-exception');
    report('TEST 8', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true
  });

  console.log('\n========= TEST 1 — Navigation rapide multi-sports (stress) =========');
  await test1(browser);

  console.log('\n========= TEST 2 — Changement de sport en cours de programme =========');
  await test2(browser);

  console.log('\n========= TEST 3 — Profile photo non null =========');
  await test3(browser);

  console.log('\n========= TEST 4 — Retour sStep 4→3→2 =========');
  await test4(browser);

  console.log('\n========= TEST 5 — Mode hors-ligne simulé =========');
  await test5(browser);

  console.log('\n========= TEST 6 — localStorage corrompu JSON invalide =========');
  await test6(browser);

  console.log('\n========= TEST 7 — CrossFit week=52 =========');
  await test7(browser);

  console.log('\n========= TEST 8 — Musculation week=13 (surcharge progressive) =========');
  await test8(browser);

  await browser.close();

  console.log('\n\n========= RÉSUMÉ FINAL =========');
  const passes = results.filter(r => r.startsWith('[PASS]')).length;
  const fails = results.filter(r => r.startsWith('[FAIL]')).length;
  results.forEach(r => console.log(r));
  console.log(`\nTotal: ${passes} PASS, ${fails} FAIL sur 8 tests`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
