const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:45515';

async function runTests() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  function log(msg) {
    console.log(msg);
  }

  async function createPage(browser) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));
    return { page, context, consoleErrors };
  }

  // TEST 1: App loads without crash
  log('\n=== TEST 1: App loads without crash ===');
  try {
    const { page, context, consoleErrors } = await createPage(browser);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.trim().length > 50;
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('service worker') &&
      !e.includes('sw.js') &&
      !e.includes('Failed to register') &&
      !e.includes('supabase') &&
      !e.includes('Supabase')
    );
    if (hasContent && criticalErrors.length === 0) {
      results.push({ test: 'TEST 1: App loads without crash', status: 'PASS', detail: `Page has content, no critical console errors` });
      log('PASS - Page renders content, no critical console errors');
    } else {
      const fail = [];
      if (!hasContent) fail.push('Page has no/little content');
      if (criticalErrors.length > 0) fail.push(`Console errors: ${criticalErrors.slice(0,3).join('; ')}`);
      results.push({ test: 'TEST 1: App loads without crash', status: 'FAIL', detail: fail.join(' | ') });
      log(`FAIL - ${fail.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 1: App loads without crash', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // TEST 2: Nutrition section
  log('\n=== TEST 2: Nutrition section ===');
  try {
    const { page, context, consoleErrors } = await createPage(browser);
    await page.addInitScript(() => {
      sessionStorage.setItem('mtd_seen_welcome', 'true');
      sessionStorage.setItem('mtd_profile', JSON.stringify({
        step: 10, poids: 70, taille: 175, age: 30, sex: 'homme', objectif: 'perte'
      }));
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Try to navigate to nutrition tab
    const nutritionTabSelectors = [
      '[data-tab="nutrition"]',
      'button[onclick*="nutrition"]',
      'a[href*="nutrition"]',
      '#tab-nutrition',
      '.tab-btn:has-text("Nutrition")',
      'button:has-text("Nutrition")',
    ];
    let clicked = false;
    for (const sel of nutritionTabSelectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); clicked = true; break; }
      } catch {}
    }
    if (!clicked) {
      // Try clicking by text
      try {
        await page.click('text=Nutrition', { timeout: 3000 });
        clicked = true;
      } catch {}
    }
    await page.waitForTimeout(1500);

    const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
    const hasCalories = pageText.includes('calorie') || pageText.includes('kcal');
    const hasMacros = pageText.includes('macro') || pageText.includes('protéine') || pageText.includes('protein') || pageText.includes('glucide') || pageText.includes('lipide');

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('service worker') && !e.includes('sw.js') &&
      !e.includes('Failed to register') && !e.includes('supabase') && !e.includes('Supabase')
    );

    if (hasCalories || hasMacros) {
      results.push({ test: 'TEST 2: Nutrition section', status: 'PASS', detail: `Nutrition content visible (calories: ${hasCalories}, macros: ${hasMacros})` });
      log(`PASS - Nutrition content visible (calories: ${hasCalories}, macros: ${hasMacros})`);
    } else {
      // Dump partial text for debugging
      const snippet = pageText.substring(0, 500);
      results.push({ test: 'TEST 2: Nutrition section', status: 'FAIL', detail: `No nutrition content found. Page text snippet: ${snippet}` });
      log(`FAIL - No nutrition content. Snippet: ${snippet}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 2: Nutrition section', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // TEST 3: CrossFit program (no mix)
  log('\n=== TEST 3: CrossFit program (no mix) ===');
  try {
    const { page, context, consoleErrors } = await createPage(browser);
    await page.addInitScript(() => {
      sessionStorage.setItem('mtd_seen_welcome', 'true');
      sessionStorage.setItem('mtd_profile', JSON.stringify({
        sStep: 6, sportType: 'crossfit', sportDays: 4, crossfitLevel: 'rx',
        crossfitWeek: 1, parqDone: true, sportMixEnabled: false
      }));
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Navigate to sport tab
    const sportTabSelectors = [
      '[data-tab="sport"]',
      'button[onclick*="sport"]',
      '#tab-sport',
      'button:has-text("Sport")',
      'a[href*="sport"]',
    ];
    let clicked = false;
    for (const sel of sportTabSelectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); clicked = true; break; }
      } catch {}
    }
    if (!clicked) {
      try { await page.click('text=Sport', { timeout: 3000 }); clicked = true; } catch {}
    }
    await page.waitForTimeout(2000);

    const pageText = await page.evaluate(() => document.body.innerText);
    const pageTextLower = pageText.toLowerCase();

    // Check for day tabs
    const hasLundi = pageText.includes('Lundi') || pageTextLower.includes('lundi');
    const hasMardi = pageText.includes('Mardi') || pageTextLower.includes('mardi');
    const hasJeudi = pageText.includes('Jeudi') || pageTextLower.includes('jeudi');
    const hasSamedi = pageText.includes('Samedi') || pageTextLower.includes('samedi');
    const hasMuscu = pageText.includes('Muscu') || pageTextLower.includes('muscu');
    const hasCF = pageTextLower.includes('crossfit') || pageTextLower.includes('wod') || pageTextLower.includes('workout');

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('service worker') && !e.includes('sw.js') &&
      !e.includes('Failed to register') && !e.includes('supabase') && !e.includes('Supabase')
    );

    const dayTabs = [hasLundi, hasMardi, hasJeudi, hasSamedi].filter(Boolean).length;

    if (dayTabs >= 3 && hasCF && !hasMuscu && criticalErrors.length === 0) {
      results.push({ test: 'TEST 3: CrossFit program (no mix)', status: 'PASS', detail: `CF tabs visible, no Muscu tabs, no crash` });
      log(`PASS - CF day tabs visible (Lundi:${hasLundi}, Mardi:${hasMardi}, Jeudi:${hasJeudi}, Samedi:${hasSamedi}), no Muscu, no crash`);
    } else {
      const issues = [];
      if (dayTabs < 3) issues.push(`Only ${dayTabs}/4 day tabs found (Lundi:${hasLundi}, Mardi:${hasMardi}, Jeudi:${hasJeudi}, Samedi:${hasSamedi})`);
      if (!hasCF) issues.push('No CrossFit content found');
      if (hasMuscu) issues.push('Muscu tabs unexpectedly present');
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,3).join('; ')}`);
      results.push({ test: 'TEST 3: CrossFit program (no mix)', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
      log(`Page snippet: ${pageText.substring(0, 400)}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 3: CrossFit program (no mix)', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // TEST 4: CrossFit + Muscu mix
  log('\n=== TEST 4: CrossFit + Muscu mix ===');
  try {
    const { page, context, consoleErrors } = await createPage(browser);
    await page.addInitScript(() => {
      sessionStorage.setItem('mtd_seen_welcome', 'true');
      sessionStorage.setItem('mtd_profile', JSON.stringify({
        sStep: 6, sportType: 'crossfit', sportDays: 5, crossfitLevel: 'rx',
        crossfitWeek: 1, parqDone: true, sportMixEnabled: true,
        sportMixSecondary: { type: 'musculation', days: 2 }
      }));
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Navigate to sport tab
    const sportTabSelectors = [
      '[data-tab="sport"]', 'button[onclick*="sport"]', '#tab-sport',
      'button:has-text("Sport")', 'a[href*="sport"]',
    ];
    let clicked = false;
    for (const sel of sportTabSelectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); clicked = true; break; }
      } catch {}
    }
    if (!clicked) {
      try { await page.click('text=Sport', { timeout: 3000 }); clicked = true; } catch {}
    }
    await page.waitForTimeout(2000);

    const pageText = await page.evaluate(() => document.body.innerText);
    const pageTextLower = pageText.toLowerCase();

    const hasCFTabs = pageTextLower.includes('crossfit') || pageTextLower.includes('wod');
    const hasMuscu1 = pageText.includes('Muscu 1') || pageText.includes('muscu 1') || pageTextLower.includes('muscu');

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('service worker') && !e.includes('sw.js') &&
      !e.includes('Failed to register') && !e.includes('supabase') && !e.includes('Supabase')
    );

    // Try to click "Muscu 1" tab
    let muscuTabClicked = false;
    let muscuContent = false;
    try {
      const muscuTab = await page.$('button:has-text("Muscu 1")') ||
                       await page.$('[data-tab*="muscu"]') ||
                       await page.$('button:has-text("Muscu")');
      if (muscuTab) {
        await muscuTab.click();
        await page.waitForTimeout(1500);
        muscuTabClicked = true;
        const afterClickText = await page.evaluate(() => document.body.innerText.toLowerCase());
        muscuContent = afterClickText.includes('exercice') || afterClickText.includes('série') ||
                       afterClickText.includes('répétition') || afterClickText.includes('squat') ||
                       afterClickText.includes('press') || afterClickText.includes('muscu') ||
                       afterClickText.includes('poids') || afterClickText.includes('haltère') ||
                       afterClickText.includes('biceps') || afterClickText.includes('chest') ||
                       afterClickText.includes('séance');
      }
    } catch (e2) {
      log(`Note: Could not click Muscu tab: ${e2.message}`);
    }

    const isBlankAfterClick = muscuTabClicked && !muscuContent;
    const isPass = (hasCFTabs || hasMuscu1) && !isBlankAfterClick && criticalErrors.length === 0;

    if (isPass) {
      results.push({ test: 'TEST 4: CrossFit + Muscu mix', status: 'PASS', detail: `CF content: ${hasCFTabs}, Muscu visible: ${hasMuscu1}, Muscu tab clicked: ${muscuTabClicked}, Muscu content: ${muscuContent}` });
      log(`PASS - CF: ${hasCFTabs}, Muscu tab: ${hasMuscu1}, clicked: ${muscuTabClicked}, content after click: ${muscuContent}`);
    } else {
      const issues = [];
      if (!hasCFTabs && !hasMuscu1) issues.push('Neither CF nor Muscu content found');
      if (isBlankAfterClick) issues.push('Muscu tab clicked but no exercises shown (blank page)');
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,3).join('; ')}`);
      results.push({ test: 'TEST 4: CrossFit + Muscu mix', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
      log(`Page snippet: ${pageText.substring(0, 400)}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 4: CrossFit + Muscu mix', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // TEST 5: Muscu level step — sport mix section visible
  log('\n=== TEST 5: Muscu level step — sport mix section visible ===');
  try {
    const { page, context, consoleErrors } = await createPage(browser);
    await page.addInitScript(() => {
      sessionStorage.setItem('mtd_seen_welcome', 'true');
      sessionStorage.setItem('mtd_profile', JSON.stringify({
        sStep: 2, sportType: 'musculation', sportDays: 5,
        sportLevel: 'intermediate', parqDone: true
      }));
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Navigate to sport section
    const sportTabSelectors = [
      '[data-tab="sport"]', 'button[onclick*="sport"]', '#tab-sport',
      'button:has-text("Sport")', 'a[href*="sport"]',
    ];
    let clicked = false;
    for (const sel of sportTabSelectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); clicked = true; break; }
      } catch {}
    }
    if (!clicked) {
      try { await page.click('text=Sport', { timeout: 3000 }); clicked = true; } catch {}
    }
    await page.waitForTimeout(1500);

    const pageText = await page.evaluate(() => document.body.innerText);
    const pageTextLower = pageText.toLowerCase();

    const hasSportMixSection = pageTextLower.includes('combiner') || pageTextLower.includes('plusieurs sports') ||
                               pageTextLower.includes('sport mix') || pageTextLower.includes('ajouter un sport') ||
                               pageTextLower.includes('mix') || pageTextLower.includes('secondaire');

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('service worker') && !e.includes('sw.js') &&
      !e.includes('Failed to register') && !e.includes('supabase') && !e.includes('Supabase')
    );

    if (hasSportMixSection && criticalErrors.length === 0) {
      results.push({ test: 'TEST 5: Muscu level step — sport mix visible', status: 'PASS', detail: 'Sport mix section "Combiner plusieurs sports" is visible' });
      log('PASS - Sport mix section visible');
    } else {
      const issues = [];
      if (!hasSportMixSection) {
        issues.push(`Sport mix section not found. Page snippet: ${pageText.substring(0, 400)}`);
      }
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,3).join('; ')}`);
      results.push({ test: 'TEST 5: Muscu level step — sport mix visible', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 5: Muscu level step — sport mix visible', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  // TEST 6: Today dashboard — streak card
  log('\n=== TEST 6: Today dashboard — streak card ===');
  try {
    const { page, context, consoleErrors } = await createPage(browser);
    await page.addInitScript(() => {
      sessionStorage.setItem('mtd_seen_welcome', 'true');
      sessionStorage.setItem('mtd_profile', JSON.stringify({
        step: 10, streak: 7, sStep: 0, sportType: null
      }));
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Try to navigate to dashboard/today tab
    const dashTabSelectors = [
      '[data-tab="today"]', '[data-tab="dashboard"]',
      'button[onclick*="today"]', 'button[onclick*="dashboard"]',
      '#tab-today', '#tab-dashboard',
      'button:has-text("Aujourd")', 'button:has-text("Dashboard")',
      'button:has-text("Today")',
    ];
    let clicked = false;
    for (const sel of dashTabSelectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); clicked = true; break; }
      } catch {}
    }
    await page.waitForTimeout(1500);

    const pageText = await page.evaluate(() => document.body.innerText);
    const pageTextLower = pageText.toLowerCase();

    const hasStreak = pageTextLower.includes('streak') || pageTextLower.includes('série') ||
                      pageText.includes('7') || pageTextLower.includes('jours consécutifs') ||
                      pageTextLower.includes('flamme') || pageTextLower.includes('🔥');
    const hasDashboard = pageTextLower.includes('today') || pageTextLower.includes("aujourd") ||
                         pageTextLower.includes('dashboard') || pageTextLower.includes('bienvenue') ||
                         pageTextLower.includes('bonjour');

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('service worker') && !e.includes('sw.js') &&
      !e.includes('Failed to register') && !e.includes('supabase') && !e.includes('Supabase')
    );

    if (hasStreak && criticalErrors.length === 0) {
      results.push({ test: 'TEST 6: Today dashboard — streak card', status: 'PASS', detail: `Streak card visible, dashboard loads` });
      log('PASS - Streak card visible, no crash');
    } else {
      const issues = [];
      if (!hasStreak) issues.push(`Streak card not found. Page snippet: ${pageText.substring(0, 400)}`);
      if (criticalErrors.length > 0) issues.push(`Errors: ${criticalErrors.slice(0,3).join('; ')}`);
      results.push({ test: 'TEST 6: Today dashboard — streak card', status: 'FAIL', detail: issues.join(' | ') });
      log(`FAIL - ${issues.join(' | ')}`);
    }
    await context.close();
  } catch (e) {
    results.push({ test: 'TEST 6: Today dashboard — streak card', status: 'FAIL', detail: e.message });
    log(`FAIL - Exception: ${e.message}`);
  }

  await browser.close();

  // Print summary
  log('\n========== SMOKE TEST SUMMARY ==========');
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    log(`${icon} [${r.status}] ${r.test}`);
    if (r.status === 'FAIL') {
      log(`       Detail: ${r.detail}`);
      failed++;
    } else {
      log(`       Detail: ${r.detail}`);
      passed++;
    }
  }
  log(`\nTotal: ${passed} PASSED, ${failed} FAILED out of ${results.length} tests`);
  return results;
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
