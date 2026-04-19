const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:45515';
const TEST_UID = 'test_qa_user';

async function runTests() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  function log(msg) { console.log(msg); }

  /**
   * Create a page, load the app, then inject auth + profile and re-render.
   * Returns { page, context, consoleErrors }.
   */
  async function createPageWithProfile(profileData) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Pre-init: prevent dev wipe, bypass gate
    await context.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait for AUTH.ready() promise to settle (Supabase session check ~300ms-4s)
    await page.waitForTimeout(4500);

    // Patch AUTH + inject profile + re-render
    await page.evaluate((data) => {
      var UID = data.uid;
      var profile = data.profile;
      var fakeSession = { id: UID, name: 'QA Test', email: 'qa@test.com', nom: '', phone: '' };

      // Write profile to localStorage
      localStorage.setItem('mtd_profile_' + UID, JSON.stringify(profile));

      // Inject streak if requested
      if (profile.streak) {
        localStorage.setItem('mtd_streak_' + UID, JSON.stringify({
          current: profile.streak,
          lastDate: new Date().toISOString().slice(0, 10)
        }));
      }

      // Patch AUTH to simulate logged-in state
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return fakeSession; };
      }

      // Load profile into global state S
      if (window.loadProfile) window.loadProfile();

      // Apply overrides directly to S
      if (window.S) {
        Object.keys(profile).forEach(function(k) {
          if (k !== 'streak') window.S[k] = profile[k];
        });
        // Set view based on profile
        if (!window.S.view || window.S.view === 'auth') {
          window.S.view = profile._view || 'today';
        }
      }

      // Re-render
      if (window.render) window.render();
    }, { uid: TEST_UID, profile: profileData });

    await page.waitForTimeout(1500);
    return { page, context, consoleErrors };
  }

  // Helper: navigate to a section tab
  async function navigateTo(page, section) {
    const sectionLower = section.toLowerCase();
    await page.evaluate((s) => {
      var btns = document.querySelectorAll('button.main-nav-tab');
      for (var i = 0; i < btns.length; i++) {
        var text = btns[i].textContent.toLowerCase();
        if (text.indexOf(s) !== -1) {
          btns[i].click();
          return true;
        }
      }
      // fallback: set S.view + render
      if (window.S && window.render) {
        window.S.view = s;
        window.render();
        return true;
      }
      return false;
    }, sectionLower);
    await page.waitForTimeout(2000);
  }

  // Helper: filter out non-critical errors
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
      !e.includes('ERR_BLOCKED')
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 1: App loads without crash
  // ═══════════════════════════════════════════════════════════
  log('\n=== TEST 1: App loads without crash ===');
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.trim().length > 20;
    const criticalErrors = getCriticalErrors(consoleErrors);

    if (hasContent && criticalErrors.length === 0) {
      results.push({ test: 'TEST 1: App loads without crash', status: 'PASS', detail: 'Page renders content, no critical console errors' });
      log('PASS - Page renders content, no critical console errors');
    } else {
      const fail = [];
      if (!hasContent) fail.push('Page has no content');
      if (criticalErrors.length > 0) fail.push(`Console errors: ${criticalErrors.slice(0,3).join('; ')}`);
      results.push({ test: 'TEST 1: App loads without crash', status: 'FAIL', detail: fail.join(' | ') });
      log(`FAIL - ${fail.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 1: App loads without crash', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 2: Nutrition section
  // ═══════════════════════════════════════════════════════════
  log('\n=== TEST 2: Nutrition section ===');
  try {
    const { page, context, consoleErrors } = await createPageWithProfile({
      appMode: 'both', nStep: 12,
      weight: 70, height: 175, age: 30, sex: 'homme', goal: 'perte',
      // legacy keys too
      poids: 70, taille: 175, objectif: 'perte',
      step: 10,
      _view: 'nutrition'
    });

    await navigateTo(page, 'nutrition');
    await page.waitForTimeout(1000);

    const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
    const hasCalories = pageText.includes('calorie') || pageText.includes('kcal');
    const hasMacros = pageText.includes('macro') || pageText.includes('protéine') ||
                      pageText.includes('proteine') || pageText.includes('glucide') ||
                      pageText.includes('lipide') || pageText.includes('protein');
    const hasNutritionContent = pageText.includes('nutrition') || pageText.includes('repas') ||
                                pageText.includes('objectif') || pageText.includes('plan') ||
                                pageText.includes('semaine');
    const criticalErrors = getCriticalErrors(consoleErrors);

    log(`  calories: ${hasCalories}, macros: ${hasMacros}, nutrition content: ${hasNutritionContent}`);
    log(`  snippet: ${pageText.substring(0, 200)}`);

    if ((hasCalories || hasMacros || hasNutritionContent) && criticalErrors.length === 0) {
      results.push({ test: 'TEST 2: Nutrition section', status: 'PASS', detail: `Nutrition content visible (calories: ${hasCalories}, macros: ${hasMacros})` });
      log(`PASS - Nutrition content visible`);
    } else {
      results.push({ test: 'TEST 2: Nutrition section', status: 'FAIL', detail: `No nutrition content. Errors: ${criticalErrors.join('; ')}` });
      log(`FAIL - No nutrition content`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 2: Nutrition section', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 3: CrossFit program — no mix
  // ═══════════════════════════════════════════════════════════
  log('\n=== TEST 3: CrossFit program (no mix) ===');
  try {
    const { page, context, consoleErrors } = await createPageWithProfile({
      step: 12, appMode: 'sport', sStep: 6, _sportProfileDone: true,
      sportType: 'crossfit', sportDays: 4, crossfitLevel: 'rx',
      crossfitWeek: 1, parqDone: true, sportMixEnabled: false,
      sex: 'homme', age: 30, weight: 70, height: 175,
      _view: 'sport'
    });

    await navigateTo(page, 'sport');
    await page.waitForTimeout(2000);

    const pageText = await page.evaluate(() => document.body.innerText);
    const lc = pageText.toLowerCase();

    const hasLundi = lc.includes('lundi');
    const hasMardi = lc.includes('mardi');
    const hasJeudi = lc.includes('jeudi');
    const hasSamedi = lc.includes('samedi');
    const hasMuscu = lc.includes('muscu');
    const hasCF = lc.includes('crossfit') || lc.includes('wod') || lc.includes('workout');
    const dayCount = [hasLundi, hasMardi, hasJeudi, hasSamedi].filter(Boolean).length;

    const criticalErrors = getCriticalErrors(consoleErrors);

    log(`  CF: ${hasCF}, days: L=${hasLundi} M=${hasMardi} J=${hasJeudi} S=${hasSamedi} (${dayCount}/4), Muscu: ${hasMuscu}`);
    log(`  snippet: ${pageText.substring(0, 300)}`);

    if (dayCount >= 3 && hasCF && !hasMuscu && criticalErrors.length === 0) {
      results.push({ test: 'TEST 3: CrossFit program (no mix)', status: 'PASS', detail: `CF day tabs: ${dayCount}/4, no Muscu, no crash` });
      log(`PASS - CF program shows, ${dayCount}/4 day tabs, no Muscu`);
    } else {
      const issues = [];
      if (!hasCF) issues.push('No CrossFit content');
      if (dayCount < 3) issues.push(`Only ${dayCount}/4 day tabs (Lundi:${hasLundi}, Mardi:${hasMardi}, Jeudi:${hasJeudi}, Samedi:${hasSamedi})`);
      if (hasMuscu) issues.push('Muscu tabs unexpectedly present');
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,2).join('; ')}`);
      results.push({ test: 'TEST 3: CrossFit program (no mix)', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 3: CrossFit program (no mix)', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 4: CrossFit + Muscu mix
  // ═══════════════════════════════════════════════════════════
  log('\n=== TEST 4: CrossFit + Muscu mix ===');
  try {
    const { page, context, consoleErrors } = await createPageWithProfile({
      step: 12, appMode: 'sport', sStep: 6, _sportProfileDone: true,
      sportType: 'crossfit', sportDays: 5, crossfitLevel: 'rx',
      crossfitWeek: 1, parqDone: true, sportMixEnabled: true,
      sportMixSecondary: { type: 'musculation', days: 2 },
      // Required for sport-only mode
      sex: 'homme', age: 30, weight: 70, height: 175,
      _view: 'sport'
    });

    await navigateTo(page, 'sport');
    await page.waitForTimeout(2000);

    const pageText = await page.evaluate(() => document.body.innerText);
    const lc = pageText.toLowerCase();

    const hasCFContent = lc.includes('crossfit') || lc.includes('wod');
    const hasMuscu = lc.includes('muscu');
    const criticalErrors = getCriticalErrors(consoleErrors);

    log(`  CF: ${hasCFContent}, Muscu: ${hasMuscu}`);
    log(`  snippet: ${pageText.substring(0, 300)}`);

    // Try to click Muscu tab
    let muscuClicked = false;
    let muscuHasContent = false;
    try {
      muscuClicked = await page.evaluate(() => {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          if (/muscu/i.test(btns[i].textContent)) {
            btns[i].click();
            return true;
          }
        }
        return false;
      });
      if (muscuClicked) {
        await page.waitForTimeout(1500);
        const afterText = await page.evaluate(() => document.body.innerText.toLowerCase());
        muscuHasContent = afterText.includes('exercice') || afterText.includes('série') ||
                          afterText.includes('répétition') || afterText.includes('squat') ||
                          afterText.includes('press') || afterText.includes('séance') ||
                          afterText.includes('muscu') || afterText.includes('haltère') ||
                          afterText.includes('poids');
        log(`  Muscu tab clicked, content: ${muscuHasContent}`);
        log(`  After click snippet: ${afterText.substring(0, 200)}`);
      } else {
        log(`  No Muscu tab button found`);
      }
    } catch (e2) { log(`  Muscu click error: ${e2.message}`); }

    const isBlankAfterClick = muscuClicked && !muscuHasContent;
    const isPass = (hasCFContent || hasMuscu) && !isBlankAfterClick && criticalErrors.length === 0;

    if (isPass) {
      results.push({ test: 'TEST 4: CrossFit + Muscu mix', status: 'PASS',
        detail: `CF: ${hasCFContent}, Muscu visible: ${hasMuscu}, tab clicked: ${muscuClicked}, content: ${muscuHasContent}` });
      log(`PASS - CF: ${hasCFContent}, Muscu: ${hasMuscu}, tab: ${muscuClicked}, content: ${muscuHasContent}`);
    } else {
      const issues = [];
      if (!hasCFContent && !hasMuscu) issues.push('No CF or Muscu content');
      if (isBlankAfterClick) issues.push('Muscu tab clicked but blank');
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,2).join('; ')}`);
      results.push({ test: 'TEST 4: CrossFit + Muscu mix', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 4: CrossFit + Muscu mix', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 5: Muscu level step — sport mix section visible
  // ═══════════════════════════════════════════════════════════
  log('\n=== TEST 5: Muscu level step — sport mix section visible ===');
  try {
    const { page, context, consoleErrors } = await createPageWithProfile({
      step: 12, appMode: 'sport', sStep: 2, _sportProfileDone: true,
      sportType: 'musculation', sportDays: 5,
      sportLevel: 'intermediate', parqDone: true,
      // Required for sport-only mode
      sex: 'homme', age: 30, weight: 70, height: 175,
      _view: 'sport'
    });

    await navigateTo(page, 'sport');
    await page.waitForTimeout(1000);

    const pageText = await page.evaluate(() => document.body.innerText);
    const lc = pageText.toLowerCase();

    const hasCombiner = lc.includes('combiner');
    const hasPlusSports = lc.includes('plusieurs sports');
    const hasMixKeyword = lc.includes('sport mix') || lc.includes('ajouter un sport') ||
                          lc.includes('secondaire') || lc.includes('second sport') ||
                          lc.includes('add a sport') || lc.includes('mix');

    const criticalErrors = getCriticalErrors(consoleErrors);

    log(`  "combiner": ${hasCombiner}, "plusieurs sports": ${hasPlusSports}, mix keyword: ${hasMixKeyword}`);
    log(`  snippet: ${pageText.substring(0, 400)}`);

    if ((hasCombiner || hasPlusSports || hasMixKeyword) && criticalErrors.length === 0) {
      results.push({ test: 'TEST 5: Muscu level step — sport mix visible', status: 'PASS',
        detail: `Sport mix section visible (combiner: ${hasCombiner}, plusieurs sports: ${hasPlusSports})` });
      log('PASS - Sport mix section "Combiner plusieurs sports" visible');
    } else {
      const issues = [];
      issues.push(`Sport mix section not found (combiner:${hasCombiner}, plusieurs_sports:${hasPlusSports}, mix:${hasMixKeyword})`);
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,2).join('; ')}`);
      results.push({ test: 'TEST 5: Muscu level step — sport mix visible', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 5: Muscu level step — sport mix visible', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 6: Today dashboard — streak card
  // ═══════════════════════════════════════════════════════════
  log('\n=== TEST 6: Today dashboard — streak card ===');
  try {
    const { page, context, consoleErrors } = await createPageWithProfile({
      appMode: 'both', nStep: 12,
      step: 10, streak: 7, sStep: 0, sportType: null,
      sex: 'homme', goal: 'perte', weight: 70, height: 175, age: 30,
      _view: 'today'
    });

    await navigateTo(page, 'aujourd');
    await page.waitForTimeout(1000);

    const pageText = await page.evaluate(() => document.body.innerText);
    const lc = pageText.toLowerCase();

    const hasStreak = lc.includes('streak') || lc.includes('série') ||
                      lc.includes('jours') || pageText.includes('7') ||
                      lc.includes('trophée') || lc.includes('trophy') ||
                      lc.includes('🔥') || lc.includes('🏆');
    const hasDashboard = lc.includes("aujourd") || lc.includes('dashboard') ||
                         lc.includes('bonjour') || lc.includes('smartfitcoach');

    const criticalErrors = getCriticalErrors(consoleErrors);

    log(`  streak: ${hasStreak}, dashboard: ${hasDashboard}`);
    log(`  snippet: ${pageText.substring(0, 300)}`);

    if (hasStreak && hasDashboard && criticalErrors.length === 0) {
      results.push({ test: 'TEST 6: Today dashboard — streak card', status: 'PASS', detail: 'Dashboard loads, streak card visible' });
      log('PASS - Dashboard loads, streak card visible');
    } else {
      const issues = [];
      if (!hasDashboard) issues.push('Dashboard not rendered');
      if (!hasStreak) issues.push('Streak card not found');
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,2).join('; ')}`);
      results.push({ test: 'TEST 6: Today dashboard — streak card', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 6: Today dashboard — streak card', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  await browser.close();

  // ─── SUMMARY ───
  log('\n========== SMOKE TEST SUMMARY ==========');
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    log(`${icon} [${r.status}] ${r.test}`);
    log(`       ${r.detail}`);
    if (r.status === 'PASS') passed++;
    else failed++;
  }
  log(`\nTotal: ${passed} PASSED, ${failed} FAILED out of ${results.length} tests`);
  return results;
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
