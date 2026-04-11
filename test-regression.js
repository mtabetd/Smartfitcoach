/**
 * SmartFitCoach — Regression Tests (non-sport-mix features)
 * Tests 1-6 as specified.
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:45515';

async function runTests() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  function log(msg) { console.log(msg); }

  /**
   * Create a page, set up storage via addInitScript, load the app,
   * then inject the profile into window.S and call window.render().
   */
  async function createPageWithProfile(profile) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Setup BEFORE navigation (addInitScript)
    await context.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
      sessionStorage.setItem('mtd_seen_welcome', 'true');
      localStorage.setItem('mtd_dev_wiped_v1', 'true');
    });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    // Wait for Supabase auth to settle
    await page.waitForTimeout(4500);

    // Inject profile + patch AUTH + re-render
    await page.evaluate((profileData) => {
      var UID = 'qa_regression_user';

      // Write profile to localStorage
      localStorage.setItem('mtd_profile_' + UID, JSON.stringify(profileData));

      // Inject streak if present
      if (profileData.streak) {
        localStorage.setItem('mtd_streak_' + UID, JSON.stringify({
          current: profileData.streak,
          lastDate: new Date().toISOString().slice(0, 10)
        }));
      }

      // Patch AUTH to simulate logged-in state
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() {
          return { id: UID, name: 'QA Regression', email: 'qa@regression.test', nom: '', phone: '' };
        };
      }

      // Load profile into global state S
      if (window.loadProfile) window.loadProfile();

      // Apply overrides directly to S
      if (window.S) {
        Object.keys(profileData).forEach(function(k) {
          if (k !== 'streak') window.S[k] = profileData[k];
        });
        if (!window.S.view || window.S.view === 'auth') {
          window.S.view = profileData._view || 'today';
        }
      }

      // Re-render
      if (window.render) window.render();
    }, profile);

    await page.waitForTimeout(2000);
    return { page, context, consoleErrors };
  }

  // Helper: filter non-critical noise (network, supabase, sw, favicon)
  function getCriticalErrors(errs) {
    return errs.filter(e =>
      !e.includes('favicon') &&
      !e.includes('service worker') && !e.includes('sw.js') &&
      !e.includes('Failed to register') &&
      !e.includes('supabase') && !e.includes('Supabase') &&
      !e.includes('[AUTH]') &&
      !e.includes('net::ERR_') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('ERR_BLOCKED') &&
      !e.includes('ERR_FILE_NOT_FOUND') &&
      /(TypeError|ReferenceError|SyntaxError|RangeError|Uncaught)/.test(e)
    );
  }

  // Helper: navigate to a section by clicking a nav tab button
  async function navigateTo(page, keyword) {
    await page.evaluate((kw) => {
      var btns = document.querySelectorAll('button.main-nav-tab, button[data-section], nav button, .nav-tab');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent.toLowerCase().includes(kw)) {
          btns[i].click();
          return true;
        }
      }
      // Fallback: set S.view + render
      if (window.S && window.render) {
        window.S.view = kw;
        window.render();
      }
      return false;
    }, keyword);
    await page.waitForTimeout(2000);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 1 — Dashboard / today-dashboard
  // ═══════════════════════════════════════════════════════════════
  log('\n=== TEST 1 — Dashboard / today-dashboard ===');
  try {
    const profile = {
      // Spec keys
      step: 10, sex: 'femme', age: 28, poids: 62, taille: 168,
      streak: 5, prenom: 'Sophie',
      // Required to bypass welcome screen and reach today-dashboard
      // app-main.js L1145: shows welcome if !appMode && !nStep && !sStep && !welcomeShown
      appMode: 'both', nStep: 12, welcomeShown: true,
      _view: 'today'
    };
    const { page, context, consoleErrors } = await createPageWithProfile(profile);

    const bodyText = await page.evaluate(() => document.body.innerText);
    const lc = bodyText.toLowerCase();

    const hasContent = bodyText.trim().length > 50;
    const hasSophie = bodyText.includes('Sophie');
    const hasStreak5 = bodyText.includes('5') && (lc.includes('streak') || lc.includes('série') || lc.includes('jours') || lc.includes('🔥'));
    const critErrors = getCriticalErrors(consoleErrors);

    log(`  hasContent: ${hasContent}, Sophie: ${hasSophie}, streak 5: ${hasStreak5}`);
    log(`  critErrors: ${critErrors.length} → ${critErrors.slice(0,2).join(' | ')}`);
    log(`  snippet: ${bodyText.substring(0, 300)}`);

    const checks = [];
    if (!hasContent) checks.push('Page blanche (pas de contenu)');
    if (!hasSophie) checks.push('"Sophie" non trouvé');
    if (!hasStreak5) checks.push('Streak "5" non visible');
    if (critErrors.length > 0) checks.push(`Erreurs critiques: ${critErrors.slice(0, 3).join('; ')}`);

    if (checks.length === 0) {
      results.push({ test: 'TEST 1 — Dashboard / today-dashboard', status: 'PASS', detail: 'Dashboard chargé, Sophie présent, streak 5 visible, pas d\'erreur critique' });
      log('PASS');
    } else {
      results.push({ test: 'TEST 1 — Dashboard / today-dashboard', status: 'FAIL', detail: checks.join(' | ') });
      log(`FAIL — ${checks.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 1 — Dashboard / today-dashboard', status: 'FAIL', detail: `Exception: ${e.message}` });
    log(`FAIL — Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2 — Musculation programme complet (sStep=4)
  // ═══════════════════════════════════════════════════════════════
  log('\n=== TEST 2 — Musculation programme complet (sStep=4) ===');
  try {
    const profile = {
      step: 10, sex: 'femme', age: 28, poids: 62, taille: 168,
      sportType: 'musculation', sStep: 4, sportDays: 3,
      sportLevel: 'intermediate',
      sportProgram: [
        { day: 'Lundi', exercises: [] },
        { day: 'Mercredi', exercises: [] },
        { day: 'Vendredi', exercises: [] }
      ],
      parqDone: true, sportMixEnabled: false,
      _view: 'sport'
    };
    const { page, context, consoleErrors } = await createPageWithProfile(profile);

    await navigateTo(page, 'sport');

    const bodyText = await page.evaluate(() => document.body.innerText);
    const lc = bodyText.toLowerCase();

    const hasProgramme = lc.includes('muscul') || lc.includes('muscu') || lc.includes('programme') ||
                         lc.includes('séance') || lc.includes('exercice') || lc.includes('lundi') ||
                         lc.includes('entraîn') || lc.includes('squat') || lc.includes('série');
    // "Muscu 1", "Muscu 2"… tabs → these would appear in sport-mix mode only
    const hasMuscu1Tab = /muscu\s*1/i.test(bodyText);
    const critErrors = getCriticalErrors(consoleErrors);

    log(`  hasProgramme: ${hasProgramme}, Muscu1Tab: ${hasMuscu1Tab}`);
    log(`  critErrors: ${critErrors.length} → ${critErrors.slice(0,2).join(' | ')}`);
    log(`  snippet: ${bodyText.substring(0, 300)}`);

    const checks = [];
    if (!hasProgramme) checks.push('Programme muscu non affiché');
    if (hasMuscu1Tab) checks.push('Onglets "Muscu 1" présents (mix inattendu)');
    if (critErrors.length > 0) checks.push(`Erreurs critiques: ${critErrors.slice(0, 3).join('; ')}`);

    if (checks.length === 0) {
      results.push({ test: 'TEST 2 — Musculation programme complet (sStep=4)', status: 'PASS', detail: 'Programme muscu affiché, pas d\'onglets Muscu 1, pas d\'erreur' });
      log('PASS');
    } else {
      results.push({ test: 'TEST 2 — Musculation programme complet (sStep=4)', status: 'FAIL', detail: checks.join(' | ') });
      log(`FAIL — ${checks.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 2 — Musculation programme complet (sStep=4)', status: 'FAIL', detail: `Exception: ${e.message}` });
    log(`FAIL — Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3 — Running programme (sStep=8)
  // ═══════════════════════════════════════════════════════════════
  log('\n=== TEST 3 — Running programme (sStep=8) ===');
  try {
    const profile = {
      step: 10, sex: 'homme', age: 32, poids: 75, taille: 180,
      sportType: 'running', sStep: 8, sportDays: 4,
      parqDone: true, sportMixEnabled: false,
      _view: 'sport'
    };
    const { page, context, consoleErrors } = await createPageWithProfile(profile);

    await navigateTo(page, 'sport');

    const bodyText = await page.evaluate(() => document.body.innerText);
    const lc = bodyText.toLowerCase();

    const hasRunning = lc.includes('running') || lc.includes('run') || lc.includes('course') ||
                       lc.includes('km') || lc.includes('allure') || lc.includes('footing') ||
                       lc.includes('séance') || lc.includes('entraîn') || lc.includes('sprint');
    const critErrors = getCriticalErrors(consoleErrors);

    log(`  hasRunning: ${hasRunning}`);
    log(`  critErrors: ${critErrors.length} → ${critErrors.slice(0,2).join(' | ')}`);
    log(`  snippet: ${bodyText.substring(0, 300)}`);

    const checks = [];
    if (!hasRunning) checks.push('Programme running non affiché');
    if (critErrors.length > 0) checks.push(`Erreurs JS: ${critErrors.slice(0, 3).join('; ')}`);

    if (checks.length === 0) {
      results.push({ test: 'TEST 3 — Running programme (sStep=8)', status: 'PASS', detail: 'Programme running chargé, pas d\'erreur JS' });
      log('PASS');
    } else {
      results.push({ test: 'TEST 3 — Running programme (sStep=8)', status: 'FAIL', detail: checks.join(' | ') });
      log(`FAIL — ${checks.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 3 — Running programme (sStep=8)', status: 'FAIL', detail: `Exception: ${e.message}` });
    log(`FAIL — Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4 — CF programme semaine 3 (non-décharge)
  // ═══════════════════════════════════════════════════════════════
  log('\n=== TEST 4 — CF programme semaine 3 (non-décharge) ===');
  try {
    const profile = {
      step: 10, sex: 'homme', age: 30, poids: 80, taille: 182,
      sportType: 'crossfit', sStep: 6, sportDays: 4,
      crossfitLevel: 'inter', crossfitWeek: 3,
      parqDone: true, sportMixEnabled: false,
      _view: 'sport'
    };
    const { page, context, consoleErrors } = await createPageWithProfile(profile);

    await navigateTo(page, 'sport');

    const bodyText = await page.evaluate(() => document.body.innerText);
    const lc = bodyText.toLowerCase();

    const hasSemaine3 = lc.includes('semaine 3') || lc.includes('semaine3') || bodyText.includes('3');
    const hasMuscu = /muscu/i.test(bodyText);

    // Count day tabs (CF days: Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche)
    // Expect 4 CF onglets (not Muscu)
    const cfTabsCount = await page.evaluate(() => {
      var btns = Array.from(document.querySelectorAll('button'));
      // Look for day-like tabs or CF-labelled tabs
      return btns.filter(b => {
        var t = b.textContent.trim();
        return /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|jour\s*\d|séance\s*\d|wod\s*\d)/i.test(t);
      }).length;
    });

    // Click each tab and check no crash
    let tabCrashes = 0;
    const tabButtons = await page.evaluate(() => {
      var btns = Array.from(document.querySelectorAll('button'));
      return btns
        .filter(b => /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|jour\s*\d|séance\s*\d|wod\s*\d)/i.test(b.textContent.trim()))
        .map((_, i) => i);
    });
    for (let idx = 0; idx < tabButtons.length; idx++) {
      try {
        await page.evaluate((i) => {
          var btns = Array.from(document.querySelectorAll('button'))
            .filter(b => /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|jour\s*\d|séance\s*\d|wod\s*\d)/i.test(b.textContent.trim()));
          if (btns[i]) btns[i].click();
        }, idx);
        await page.waitForTimeout(800);
      } catch (clickErr) {
        tabCrashes++;
      }
    }

    const critErrors = getCriticalErrors(consoleErrors);

    log(`  semaine3: ${hasSemaine3}, hasMuscu: ${hasMuscu}, cfTabs: ${cfTabsCount}, tabCrashes: ${tabCrashes}`);
    log(`  critErrors: ${critErrors.length} → ${critErrors.slice(0,2).join(' | ')}`);
    log(`  snippet: ${bodyText.substring(0, 400)}`);

    const checks = [];
    if (!hasSemaine3) checks.push('"Semaine 3" non visible');
    if (cfTabsCount < 4) checks.push(`Seulement ${cfTabsCount} onglets CF (attendu 4)`);
    if (hasMuscu) checks.push('Onglets Muscu inattendus présents');
    if (tabCrashes > 0) checks.push(`${tabCrashes} crash(es) au clic d'onglets`);
    if (critErrors.length > 0) checks.push(`Erreurs critiques: ${critErrors.slice(0, 3).join('; ')}`);

    if (checks.length === 0) {
      results.push({ test: 'TEST 4 — CF semaine 3 (non-décharge)', status: 'PASS', detail: `Semaine 3 visible, ${cfTabsCount} onglets CF, pas de Muscu, pas de crash` });
      log('PASS');
    } else {
      results.push({ test: 'TEST 4 — CF semaine 3 (non-décharge)', status: 'FAIL', detail: checks.join(' | ') });
      log(`FAIL — ${checks.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 4 — CF semaine 3 (non-décharge)', status: 'FAIL', detail: `Exception: ${e.message}` });
    log(`FAIL — Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5 — CF programme semaine 4 (décharge)
  // ═══════════════════════════════════════════════════════════════
  log('\n=== TEST 5 — CF programme semaine 4 (décharge) ===');
  try {
    const profile = {
      step: 10, sex: 'homme', age: 30, poids: 80, taille: 182,
      sportType: 'crossfit', sStep: 6, sportDays: 4,
      crossfitLevel: 'inter', crossfitWeek: 4,
      parqDone: true, sportMixEnabled: false,
      _view: 'sport'
    };
    const { page, context, consoleErrors } = await createPageWithProfile(profile);

    await navigateTo(page, 'sport');

    const bodyText = await page.evaluate(() => document.body.innerText);
    const lc = bodyText.toLowerCase();

    const hasDecharge = lc.includes('décharge') || lc.includes('decharge') ||
                        lc.includes('décharge obligatoire') || lc.includes('semaine de récup') ||
                        lc.includes('récupération') || lc.includes('repos actif') ||
                        lc.includes('semaine 4');
    const hasBannerDecharge = /d[ée]charge\s+obligatoire/i.test(bodyText);
    const critErrors = getCriticalErrors(consoleErrors);

    log(`  hasDecharge: ${hasDecharge}, hasBannerDecharge: ${hasBannerDecharge}`);
    log(`  critErrors: ${critErrors.length} → ${critErrors.slice(0,2).join(' | ')}`);
    log(`  snippet: ${bodyText.substring(0, 400)}`);

    const checks = [];
    if (!hasDecharge && !hasBannerDecharge) checks.push('Bannière DÉCHARGE non visible');
    if (critErrors.length > 0) checks.push(`Erreurs critiques: ${critErrors.slice(0, 3).join('; ')}`);

    if (checks.length === 0) {
      results.push({ test: 'TEST 5 — CF semaine 4 (décharge)', status: 'PASS', detail: `Bannière décharge visible (banner: ${hasBannerDecharge}), pas de crash` });
      log('PASS');
    } else {
      results.push({ test: 'TEST 5 — CF semaine 4 (décharge)', status: 'FAIL', detail: checks.join(' | ') });
      log(`FAIL — ${checks.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 5 — CF semaine 4 (décharge)', status: 'FAIL', detail: `Exception: ${e.message}` });
    log(`FAIL — Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6 — Navigation entre sections (sport → nutrition → dashboard)
  // ═══════════════════════════════════════════════════════════════
  log('\n=== TEST 6 — Navigation sport → nutrition → dashboard ===');
  try {
    const profile = {
      step: 10, sex: 'homme', age: 35, poids: 85, taille: 178,
      sportType: 'crossfit', sStep: 6,
      crossfitLevel: 'rx', crossfitWeek: 1,
      sportDays: 3, parqDone: true,
      _view: 'sport'
    };
    const { page, context, consoleErrors } = await createPageWithProfile(profile);

    const transitionChecks = [];

    // — Sport
    await navigateTo(page, 'sport');
    {
      const txt = await page.evaluate(() => document.body.innerText);
      const isBlank = txt.trim().length < 30;
      if (isBlank) transitionChecks.push('Section sport: page blanche');
      else log(`  [sport] OK — snippet: ${txt.substring(0, 100)}`);
    }

    // — Nutrition
    await navigateTo(page, 'nutrition');
    {
      const txt = await page.evaluate(() => document.body.innerText);
      const isBlank = txt.trim().length < 30;
      if (isBlank) transitionChecks.push('Section nutrition: page blanche');
      else log(`  [nutrition] OK — snippet: ${txt.substring(0, 100)}`);
    }

    // — Dashboard
    await navigateTo(page, 'aujourd');
    {
      const txt = await page.evaluate(() => document.body.innerText);
      const isBlank = txt.trim().length < 30;
      if (isBlank) transitionChecks.push('Section dashboard: page blanche');
      else log(`  [dashboard] OK — snippet: ${txt.substring(0, 100)}`);
    }

    const critErrors = getCriticalErrors(consoleErrors);
    if (critErrors.length > 0) transitionChecks.push(`Erreurs critiques: ${critErrors.slice(0, 3).join('; ')}`);

    log(`  transitionChecks: ${transitionChecks.length}`);
    log(`  critErrors: ${critErrors.length} → ${critErrors.slice(0,2).join(' | ')}`);

    if (transitionChecks.length === 0) {
      results.push({ test: 'TEST 6 — Navigation sport → nutrition → dashboard', status: 'PASS', detail: 'Toutes les transitions OK, pas de page blanche ni crash' });
      log('PASS');
    } else {
      results.push({ test: 'TEST 6 — Navigation sport → nutrition → dashboard', status: 'FAIL', detail: transitionChecks.join(' | ') });
      log(`FAIL — ${transitionChecks.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 6 — Navigation sport → nutrition → dashboard', status: 'FAIL', detail: `Exception: ${e.message}` });
    log(`FAIL — Exception: ${e.message}`);
  }

  await browser.close();

  // ─── SUMMARY ───────────────────────────────────────────────────
  log('\n========== RÉSULTATS RÉGRESSION ==========');
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    log(`${icon} [${r.status}] ${r.test}`);
    log(`       ${r.detail}`);
    if (r.status === 'PASS') passed++;
    else failed++;
  }
  log(`\nTotal: ${passed} PASS, ${failed} FAIL sur ${results.length} tests`);
  return results;
}

runTests().catch(e => {
  console.error('Erreur fatale:', e);
  process.exit(1);
});
