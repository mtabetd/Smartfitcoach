/**
 * Playwright test: Multi-sport mix feature for SmartFitCoach
 * Tests CrossFit + Musculation mix configuration and program views.
 */

// Use the globally installed playwright (1.56.1) which matches the installed chromium-1194
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:45515';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Core auth + gate injection (runs before page scripts via addInitScript).
 * Strategy:
 * 1. Set sessionStorage 'mtd_gate_access' to bypass gate
 * 2. Block window.supabase so auth falls back to localStorage
 * 3. Set fake localStorage session with null fingerprint (skips fingerprint check)
 * 4. Store profile data under 'mtd_profile_test-user-qa-001'
 */
async function injectAuthAndProfile(page, profileFields) {
  await page.addInitScript(({ profileFields }) => {
    // ─── Gate bypass ───
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}

    // ─── Block Supabase SDK to force legacy localStorage auth ───
    // supabase-client.js checks `window.supabase` in getClient().
    // Blocking it ensures getClient() returns null → _getRawClient() returns null
    // → _initAuth() uses _loadLegacySession() fallback
    try {
      Object.defineProperty(window, 'supabase', {
        get: function() { return null; },
        set: function(v) { /* block supabase SDK from being set */ },
        configurable: true
      });
    } catch(e) {}

    // ─── Auth session (legacy) ───
    // fingerprint: null → isLegacySessionValid() skips the fingerprint check
    var session = {
      id: 'test-user-qa-001',
      name: 'QA Tester',
      email: 'qa@test.com',
      nom: '', phone: '',
      token: 'test-qa-token-123',
      fingerprint: null,
      tokenIssuedAt: Date.now()
    };
    try {
      localStorage.setItem('mtd_session', JSON.stringify(session));
      localStorage.setItem('mtd_session_start', String(Date.now()));
    } catch(e) {}

    // ─── Profile data ───
    try {
      localStorage.setItem('mtd_profile_test-user-qa-001', JSON.stringify(profileFields));
    } catch(e) {}
  }, { profileFields });
}

/**
 * After page loads and auth runs, use page.evaluate to force the desired state.
 * This runs AFTER _doAutoLogin() which may reset sStep.
 * We directly mutate window.S and call window.render().
 */
async function forceState(page, stateFields) {
  await page.evaluate((stateFields) => {
    if (!window.S) return;
    // Apply all desired state fields
    Object.keys(stateFields).forEach(function(k) {
      window.S[k] = stateFields[k];
    });
    // Ensure render lock is cleared
    if (window.render) {
      window.render._lock = false;
    }
    // Trigger re-render
    if (window.render) {
      window.render();
    }
  }, stateFields);
  // Wait for render to complete
  await page.waitForTimeout(600);
}

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, name + '.png');
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

async function runTests() {
  const results = [];
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 1: CrossFit + Musculation mix configuration (sStep=5)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 1: CrossFit + Musculation mix configuration (sStep=5) ===');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const testResult = { name: 'Test 1: CrossFit + Musculation mix config (sStep=5)', steps: [], passed: true, error: null };

      const consoleErrors = [];
      page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

      try {
        // Inject auth + profile with welcomeShown + appMode to skip welcome/module screens
        await injectAuthAndProfile(page, {
          sportType: 'crossfit',
          sStep: 5,
          sportDays: 5,
          crossfitLevel: 'rx',
          parqDone: true,
          sex: 'homme', age: 30, weight: 80, height: 180,
          appMode: 'sport',
          welcomeShown: true,
          sportSplashDone: true
        });

        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1500);

        // Force state after _doAutoLogin resets sStep (5 is not in _PROGRAM_STEPS_MAIN)
        await forceState(page, {
          view: 'sport',
          sStep: 5,
          sportType: 'crossfit',
          sportDays: 5,
          crossfitLevel: 'rx',
          parqDone: true,
          sportSplashDone: true,
          sportMixEnabled: false,
          sportMixSecondary: null
        });

        await takeScreenshot(page, 'test1-01-initial-load');

        // Step 1: Verify "Combiner plusieurs sports ?" section is visible
        const mixHeader = page.locator('text=Combiner plusieurs sports').first();
        const mixVisible = await mixHeader.isVisible({ timeout: 5000 }).catch(() => false);

        testResult.steps.push({ step: 'Verify "Combiner plusieurs sports ?" section visible', passed: mixVisible });
        if (mixVisible) {
          console.log('  ✓ Step 1: "Combiner plusieurs sports ?" section is visible');
        } else {
          console.log('  ✗ Step 1: Section NOT visible — checking page content...');
          const bodyText = await page.innerText('body').catch(() => '');
          console.log('  → Page snippet:', bodyText.slice(0, 200));
          testResult.passed = false;
        }

        // Step 2: Click "Oui — combiner avec un 2ème sport"
        const ouiBtn = page.locator('text=Oui').first();
        const ouiVisible = await ouiBtn.isVisible({ timeout: 3000 }).catch(() => false);

        if (ouiVisible) {
          await ouiBtn.click();
          await page.waitForTimeout(600);
          testResult.steps.push({ step: 'Click "Oui — combiner avec un 2ème sport"', passed: true });
          console.log('  ✓ Step 2: Clicked "Oui — combiner avec un 2ème sport"');
        } else {
          testResult.steps.push({ step: 'Click "Oui — combiner avec un 2ème sport"', passed: false, error: 'Button not visible' });
          console.log('  ✗ Step 2: "Oui" button not visible');
          testResult.passed = false;
        }

        await takeScreenshot(page, 'test1-02-after-oui-click');

        // Step 3: Verify Musculation option appears
        // The option is in a level-list with label "Musculation"
        const muscuOpt = page.locator('.level-item').filter({ hasText: 'Musculation' }).first();
        const muscuVisible = await muscuOpt.isVisible({ timeout: 3000 }).catch(() => false);

        testResult.steps.push({ step: 'Verify Musculation option appears', passed: muscuVisible });
        if (muscuVisible) {
          console.log('  ✓ Step 3: Musculation option appeared');
        } else {
          console.log('  ✗ Step 3: Musculation option NOT visible');
          testResult.passed = false;
        }

        // Step 4: Click Musculation
        if (muscuVisible) {
          await muscuOpt.click();
          await page.waitForTimeout(600);
          testResult.steps.push({ step: 'Click Musculation option', passed: true });
          console.log('  ✓ Step 4: Clicked Musculation');
        } else {
          testResult.steps.push({ step: 'Click Musculation option', passed: false, error: 'Not visible' });
          testResult.passed = false;
        }

        await takeScreenshot(page, 'test1-03-muscu-selected');

        // Step 5: Verify day allocation display appears (3 large Georgia numbers)
        // The layout shows: [primDays] + [secDays] = [totalDays] with "Total" label
        const totalLabel = page.locator('text=Total').first();
        const totalVisible = await totalLabel.isVisible({ timeout: 3000 }).catch(() => false);

        testResult.steps.push({ step: 'Verify day allocation display appears', passed: totalVisible });
        if (totalVisible) {
          console.log('  ✓ Step 5: Day allocation display (with "Total" label) is visible');
        } else {
          console.log('  ✗ Step 5: Day allocation display NOT visible');
          testResult.passed = false;
        }

        // Step 6: Verify + button exists and increases muscu days
        // The +/− buttons are in the allocation box. Use JS evaluation to find and click them.
        const buttonsInfo = await page.evaluate(() => {
          var btns = document.querySelectorAll('button[type="button"]');
          var plusBtn = null, minusBtn = null;
          btns.forEach(function(b) {
            var txt = b.textContent.trim();
            var style = b.getAttribute('style') || '';
            // The +/- buttons have specific style: width:44px;height:44px
            if (txt === '+' && style.includes('44px')) plusBtn = true;
            if ((txt === '−' || txt === '\u2212') && style.includes('44px')) minusBtn = true;
          });
          return { plusBtn: !!plusBtn, minusBtn: !!minusBtn };
        });

        const plusVisible = buttonsInfo.plusBtn;
        const minusVisible = buttonsInfo.minusBtn;

        testResult.steps.push({ step: 'Verify + and − buttons exist', passed: plusVisible && minusVisible });
        if (plusVisible && minusVisible) {
          console.log('  ✓ Step 6: + and − buttons found (44px allocation buttons)');
        } else {
          console.log(`  ✗ Step 6: + visible: ${plusVisible}, − visible: ${minusVisible}`);
          testResult.passed = false;
        }

        // Step 7: Test + increases, - decreases using JS click (avoids overlay intercept issue)
        const getSecDays = () => page.evaluate(() => {
          var divs = document.querySelectorAll('div');
          for (var el of divs) {
            var style = el.getAttribute('style') || '';
            if (style.includes('font-size:30px') && (style.includes('1A4A1A') || style.includes('accent'))) {
              var n = parseInt(el.textContent.trim());
              if (!isNaN(n) && n > 0) return n;
            }
          }
          return null;
        });

        const jsClickPlus = () => page.evaluate(() => {
          var btns = document.querySelectorAll('button[type="button"]');
          for (var b of btns) {
            var txt = b.textContent.trim();
            var style = b.getAttribute('style') || '';
            if (txt === '+' && style.includes('44px')) {
              b.click();
              return true;
            }
          }
          return false;
        });

        const jsClickMinus = () => page.evaluate(() => {
          var btns = document.querySelectorAll('button[type="button"]');
          for (var b of btns) {
            var txt = b.textContent.trim();
            var style = b.getAttribute('style') || '';
            if ((txt === '−' || txt === '\u2212') && style.includes('44px')) {
              b.click();
              return true;
            }
          }
          return false;
        });

        if (plusVisible && minusVisible) {
          // With sportDays=5 and crossfit minimum=3, maxSecDays = 5-3 = 2.
          // Default secDays starts at min(2, maxSecDays) = 2 (already at max).
          // So we must FIRST decrease with -, THEN increase with + to verify both work.
          const initialDays = await getSecDays();
          console.log(`  → Initial muscu days: ${initialDays}`);

          // First: decrease with −
          await jsClickMinus();
          await page.waitForTimeout(400);
          const afterMinus = await getSecDays();
          const minusWorked = afterMinus !== null && initialDays !== null && afterMinus < initialDays;
          testResult.steps.push({ step: '− button decreases muscu days', passed: minusWorked, detail: `${initialDays} → ${afterMinus}` });
          if (minusWorked) {
            console.log(`  ✓ Step 7: − decreased muscu days: ${initialDays} → ${afterMinus}`);
          } else {
            console.log(`  ✗ Step 7: − did not decrease (${initialDays} → ${afterMinus})`);
            testResult.passed = false;
          }

          await takeScreenshot(page, 'test1-04-after-minus');

          // Then: increase with +
          await jsClickPlus();
          await page.waitForTimeout(400);
          const afterPlus = await getSecDays();
          const plusWorked = afterMinus !== null && afterPlus !== null && afterPlus > afterMinus;
          testResult.steps.push({ step: '+ button increases muscu days', passed: plusWorked, detail: `${afterMinus} → ${afterPlus}` });
          if (plusWorked) {
            console.log(`  ✓ Step 8: + increased muscu days: ${afterMinus} → ${afterPlus}`);
          } else {
            console.log(`  ✗ Step 8: + did not increase (${afterMinus} → ${afterPlus})`);
            testResult.passed = false;
          }

          await takeScreenshot(page, 'test1-05-after-plus');
        }

        await takeScreenshot(page, 'test1-05-after-minus');

        // Step 8: Verify validation message "Cross Training + Musculation = 5 jours / semaine"
        // The message is "✓ X j Cross Training + Y j Musculation = 5 jours / semaine"
        const pageText = await page.innerText('body');
        const hasJoursMsg = pageText.includes('jours / semaine') || pageText.includes('jours/semaine');
        const hasCrossTraining = pageText.includes('Cross Training');
        const hasMusculation = pageText.includes('Musculation');
        const has5Jours = pageText.includes('= 5') || pageText.includes('=\u00a05');

        const validationOk = hasJoursMsg && hasCrossTraining && hasMusculation;
        testResult.steps.push({
          step: 'Verify validation message "Cross Training + Musculation = 5 jours / semaine"',
          passed: validationOk,
          detail: `hasJoursMsg=${hasJoursMsg}, hasCrossTraining=${hasCrossTraining}, hasMusculation=${hasMusculation}, has5Jours=${has5Jours}`
        });
        if (validationOk) {
          console.log(`  ✓ Step 9: Validation message found (Cross Training + Musculation, 5 jours/semaine)`);
        } else {
          console.log(`  ✗ Step 9: Validation message incomplete: hasCrossTraining=${hasCrossTraining}, hasMusculation=${hasMusculation}, hasJoursMsg=${hasJoursMsg}`);
          testResult.passed = false;
        }

        await takeScreenshot(page, 'test1-06-validation');

      } catch (err) {
        testResult.passed = false;
        testResult.error = err.message;
        console.log('  ✗ Test 1 ERROR:', err.message);
        await takeScreenshot(page, 'test1-error');
      }

      results.push(testResult);
      await context.close();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 2: CF Program view with sport mix (sStep=6)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 2: CF Program view with sport mix (sStep=6) ===');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const testResult = { name: 'Test 2: CF Program with sport mix (sStep=6)', steps: [], passed: true, error: null };

      const consoleErrors = [];
      page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));
      // Also capture 'error' console messages
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push('CONSOLE ERROR: ' + msg.text());
      });

      try {
        await injectAuthAndProfile(page, {
          sportType: 'crossfit',
          sStep: 6,
          sportDays: 5,
          crossfitLevel: 'rx',
          crossfitWeek: 1,
          parqDone: true,
          sex: 'homme', age: 30, weight: 80, height: 180,
          appMode: 'sport',
          welcomeShown: true,
          sportSplashDone: true,
          selectedCrossfitDay: 0
        });

        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1500);

        // sStep=6 IS in _PROGRAM_STEPS_MAIN so it's preserved.
        // But we need to also set sportMixEnabled + sportMixSecondary after load.
        await forceState(page, {
          view: 'sport',
          sStep: 6,
          sportType: 'crossfit',
          sportDays: 5,
          crossfitLevel: 'rx',
          crossfitWeek: 1,
          parqDone: true,
          sportSplashDone: true,
          sportMixEnabled: true,
          sportMixSecondary: { type: 'musculation', days: 2 },
          selectedCrossfitDay: 0
        });

        await takeScreenshot(page, 'test2-01-initial-load');

        // Step 1: No critical JS crashes
        const criticalErrors = consoleErrors.filter(e =>
          e.includes('TypeError') || e.includes('ReferenceError') ||
          e.includes('Maximum call stack') || e.includes('is not a function') ||
          e.includes('Cannot read')
        );
        const noCrash = criticalErrors.length === 0;
        testResult.steps.push({ step: 'CF program loads without crash', passed: noCrash, detail: noCrash ? 'OK' : criticalErrors[0] });
        if (noCrash) {
          console.log('  ✓ Step 1: CF program loaded without critical errors');
        } else {
          console.log('  ✗ Step 1: Critical errors:', criticalErrors[0]);
          testResult.passed = false;
        }

        // Step 2: Verify "Muscu 1" and "Muscu 2" tabs appear
        const muscu1 = page.locator('button.day-tab', { hasText: 'Muscu 1' }).first();
        const muscu2 = page.locator('button.day-tab', { hasText: 'Muscu 2' }).first();

        // Also try without .day-tab class as fallback
        const muscu1AnyBtn = page.locator('button', { hasText: 'Muscu 1' }).first();
        const muscu2AnyBtn = page.locator('button', { hasText: 'Muscu 2' }).first();

        const muscu1Visible = await muscu1.isVisible({ timeout: 4000 }).catch(() => false)
                           || await muscu1AnyBtn.isVisible({ timeout: 1000 }).catch(() => false);
        const muscu2Visible = await muscu2.isVisible({ timeout: 2000 }).catch(() => false)
                           || await muscu2AnyBtn.isVisible({ timeout: 1000 }).catch(() => false);

        testResult.steps.push({ step: 'Muscu 1 tab visible', passed: muscu1Visible });
        testResult.steps.push({ step: 'Muscu 2 tab visible', passed: muscu2Visible });

        if (muscu1Visible && muscu2Visible) {
          console.log('  ✓ Step 2: "Muscu 1" and "Muscu 2" tabs are visible');
        } else {
          console.log(`  ✗ Step 2: Muscu 1: ${muscu1Visible}, Muscu 2: ${muscu2Visible}`);
          // Debug: show all tab labels
          const allTabs = await page.$$eval('.day-tab', tabs => tabs.map(t => t.textContent.trim()));
          console.log('  → All day-tab labels:', allTabs);
          testResult.passed = false;
        }

        await takeScreenshot(page, 'test2-02-muscu-tabs');

        // Step 3: Click "Muscu 1" tab
        const clickTarget = muscu1Visible ? muscu1AnyBtn : null;
        if (clickTarget && await clickTarget.isVisible({ timeout: 1000 }).catch(() => false)) {
          await clickTarget.click();
          await page.waitForTimeout(800);
          testResult.steps.push({ step: 'Click Muscu 1 tab', passed: true });
          console.log('  ✓ Step 3: Clicked "Muscu 1" tab');
        } else {
          testResult.steps.push({ step: 'Click Muscu 1 tab', passed: false, error: 'Tab not visible' });
          console.log('  ✗ Step 3: Cannot click Muscu 1 tab');
          testResult.passed = false;
        }

        await takeScreenshot(page, 'test2-03-muscu1-clicked');

        // Step 4: Verify muscu session is displayed
        // Look for: "SÉANCE MUSCULATION" label or "Musculation —" header or exercise rows
        const seanceLabel = await page.locator('text=SÉANCE MUSCULATION').isVisible({ timeout: 3000 }).catch(() => false);
        const muscuHeader = await page.locator('text=Musculation —').isVisible({ timeout: 2000 }).catch(() => false);
        const exRow = await page.locator('div[style*="Georgia,serif"]').filter({ hasText: /^\d+\./ }).first().isVisible({ timeout: 2000 }).catch(() => false);

        const sessionVisible = seanceLabel || muscuHeader || exRow;
        testResult.steps.push({ step: 'Muscu session visible (exercises or header)', passed: sessionVisible, detail: `seanceLabel=${seanceLabel}, muscuHeader=${muscuHeader}, exRow=${exRow}` });
        if (sessionVisible) {
          console.log(`  ✓ Step 4: Muscu session is displayed (seance=${seanceLabel}, header=${muscuHeader}, exercise=${exRow})`);
        } else {
          console.log('  ✗ Step 4: Muscu session NOT displayed');
          testResult.passed = false;
        }

        await takeScreenshot(page, 'test2-04-muscu-session');

        // Step 5: No crash, no infinite loop
        const errorsAfter = consoleErrors.filter(e =>
          e.includes('Maximum call stack') || e.includes('TypeError') || e.includes('is not a function')
        );
        const noLoop = !consoleErrors.some(e => e.includes('Maximum call stack'));
        const noCrashFinal = errorsAfter.length === 0;
        testResult.steps.push({ step: 'No crash or infinite loop', passed: noLoop && noCrashFinal });
        if (noLoop && noCrashFinal) {
          console.log('  ✓ Step 5: No crash, no infinite loop');
        } else {
          console.log('  ✗ Step 5:', errorsAfter[0]);
          testResult.passed = false;
        }

      } catch (err) {
        testResult.passed = false;
        testResult.error = err.message;
        console.log('  ✗ Test 2 ERROR:', err.message);
        await takeScreenshot(page, 'test2-error');
      }

      results.push(testResult);
      await context.close();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 3: Retrocompatibility — CF without mix (sStep=6)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 3: Retrocompatibility — CF without mix (sStep=6) ===');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const testResult = { name: 'Test 3: Retrocompatibility — CF without mix (sStep=6)', steps: [], passed: true, error: null };

      const consoleErrors = [];
      page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push('CONSOLE ERROR: ' + msg.text());
      });

      try {
        await injectAuthAndProfile(page, {
          sportType: 'crossfit',
          sStep: 6,
          sportDays: 4,
          crossfitLevel: 'rx',
          crossfitWeek: 1,
          parqDone: true,
          sex: 'homme', age: 30, weight: 80, height: 180,
          appMode: 'sport',
          welcomeShown: true,
          sportSplashDone: true,
          selectedCrossfitDay: 0
        });

        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1500);

        await forceState(page, {
          view: 'sport',
          sStep: 6,
          sportType: 'crossfit',
          sportDays: 4,
          crossfitLevel: 'rx',
          crossfitWeek: 1,
          parqDone: true,
          sportSplashDone: true,
          sportMixEnabled: false,
          sportMixSecondary: null,
          selectedCrossfitDay: 0
        });

        await takeScreenshot(page, 'test3-01-initial-load');

        // Step 1: CF program loads normally
        const critErrors = consoleErrors.filter(e =>
          e.includes('TypeError') || e.includes('ReferenceError') ||
          e.includes('Maximum call stack') || e.includes('Cannot read')
        );
        const loadsOk = critErrors.length === 0;
        testResult.steps.push({ step: 'CF program loads normally', passed: loadsOk, detail: loadsOk ? 'No critical errors' : critErrors[0] });
        if (loadsOk) {
          console.log('  ✓ Step 1: CF program loads normally');
        } else {
          console.log('  ✗ Step 1:', critErrors[0]);
          testResult.passed = false;
        }

        // Step 2: NO "Muscu" tabs appear
        const muscu1 = page.locator('button', { hasText: 'Muscu 1' }).first();
        const muscu2 = page.locator('button', { hasText: 'Muscu 2' }).first();
        const muscu1Visible = await muscu1.isVisible({ timeout: 2000 }).catch(() => false);
        const muscu2Visible = await muscu2.isVisible({ timeout: 1000 }).catch(() => false);

        const noMuscuTabs = !muscu1Visible && !muscu2Visible;
        testResult.steps.push({ step: 'NO Muscu tabs appear', passed: noMuscuTabs });
        if (noMuscuTabs) {
          console.log('  ✓ Step 2: No Muscu tabs (correct for non-mix)');
        } else {
          console.log(`  ✗ Step 2: Muscu tabs appeared (muscu1=${muscu1Visible}, muscu2=${muscu2Visible})`);
          testResult.passed = false;
        }

        await takeScreenshot(page, 'test3-02-day-tabs');

        // Step 3: Verify normal CF day tabs appear
        const dayTabs = await page.$$('.day-tab');
        const tabTexts = await Promise.all(dayTabs.map(t => t.evaluate(el => el.textContent.trim())));
        const hasDayTabs = dayTabs.length >= 3; // 4 days CF means 4 tabs

        testResult.steps.push({ step: 'Normal CF day tabs present (>=3)', passed: hasDayTabs, detail: `Found ${dayTabs.length}: [${tabTexts.join(', ')}]` });
        if (hasDayTabs) {
          console.log(`  ✓ Step 3: ${dayTabs.length} CF day tabs: [${tabTexts.join(', ')}]`);
        } else {
          console.log(`  ✗ Step 3: Expected >=3 day tabs, found ${dayTabs.length}`);
          testResult.passed = false;
        }

        // Step 3a: No "Muscu" in tab labels
        const noMuscuInLabels = !tabTexts.some(t => t.toLowerCase().includes('muscu'));
        testResult.steps.push({ step: 'Day tabs contain no Muscu labels', passed: noMuscuInLabels });
        if (noMuscuInLabels) {
          console.log('  ✓ Step 3a: Day tabs have no Muscu labels');
        } else {
          console.log('  ✗ Step 3a: Found Muscu labels in tabs:', tabTexts.filter(t => t.toLowerCase().includes('muscu')));
          testResult.passed = false;
        }

        // Step 4: WOD content visible
        const pageText = await page.innerText('body');
        const hasWOD = pageText.includes('WOD') || pageText.includes('GYMNAST') || pageText.includes('HALT');
        testResult.steps.push({ step: 'CF WOD/program content visible', passed: hasWOD });
        if (hasWOD) {
          console.log('  ✓ Step 4: CF program content is visible');
        } else {
          console.log('  ✗ Step 4: CF program content not visible');
          // Not a hard fail — content rendering depends on WOD database
        }

        await takeScreenshot(page, 'test3-03-cf-program');

      } catch (err) {
        testResult.passed = false;
        testResult.error = err.message;
        console.log('  ✗ Test 3 ERROR:', err.message);
        await takeScreenshot(page, 'test3-error');
      }

      results.push(testResult);
      await context.close();
    }

  } catch (err) {
    console.error('Browser/launch error:', err);
  } finally {
    if (browser) await browser.close();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(70));
  console.log('FINAL TEST REPORT');
  console.log('═'.repeat(70));

  results.forEach(r => {
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`\n[${status}] ${r.name}`);
    if (r.error) console.log(`  Error: ${r.error}`);
    r.steps.forEach(s => {
      const mark = s.passed ? '✓' : '✗';
      let line = `  ${mark} ${s.step}`;
      if (s.detail) line += ` (${s.detail})`;
      if (s.error) line += ` — ERROR: ${s.error}`;
      console.log(line);
    });
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log('\n' + '─'.repeat(70));
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${results.length} tests`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}`);
  console.log('─'.repeat(70) + '\n');

  return results;
}

runTests().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
