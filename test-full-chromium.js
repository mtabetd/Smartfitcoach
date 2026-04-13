// Full Chromium test — onboarding, PDF export, navigation, no crashes
const { chromium } = require('playwright');
// Use system Chromium if available
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  const results = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('[CONSOLE ERROR] ' + msg.text());
    if (msg.type() === 'warning') warnings.push('[CONSOLE WARN] ' + msg.text());
  });
  page.on('pageerror', err => errors.push('[PAGE ERROR] ' + err.message));

  function log(msg) { console.log('✓ ' + msg); results.push(msg); }
  function fail(msg) { console.log('✗ ' + msg); errors.push(msg); }

  try {
    // 1. Load app
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
    log('Page loaded');

    // 2. Check no white page
    const bodyText = await page.textContent('body');
    if (!bodyText || bodyText.trim().length < 10) fail('WHITE PAGE detected');
    else log('Page has content (not white)');

    // 3. Gate — enter password if present
    const gateEl = await page.$('#gate');
    if (gateEl) {
      const gateVisible = await gateEl.isVisible();
      if (gateVisible) {
        const gateInput = await page.$('#gate input[type="password"]');
        if (gateInput) {
          await gateInput.fill('mtd2025');
          const gateBtn = await page.$('#gate button');
          if (gateBtn) await gateBtn.click();
          await page.waitForTimeout(1000);
          log('Gate bypassed');
        }
      }
    }

    // 4. Splash screen — skip if present
    const splashEl = await page.$('#splash');
    if (splashEl) {
      const splashVisible = await splashEl.isVisible();
      if (splashVisible) {
        const splashBtn = await page.$('#splash button');
        if (splashBtn) {
          await splashBtn.click();
          await page.waitForTimeout(800);
          log('Splash skipped');
        }
      }
    }

    // 5. Check jsPDF is loaded
    const jsPDFLoaded = await page.evaluate(() => typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined');
    if (jsPDFLoaded) log('jsPDF library loaded');
    else fail('jsPDF NOT loaded — PDF export will fail');

    // 6. Check core modules loaded
    const modulesCheck = await page.evaluate(() => ({
      S: !!window.S,
      AUTH: !!window.AUTH,
      GOALS: !!window.GOALS,
      ACTIVITIES: !!window.ACTIVITIES,
      NUTRITION: !!window.NUTRITION,
      SPORT: !!window.SPORT,
      TODAY: !!window.TODAY,
      render: typeof window.render === 'function',
      calcBMR: typeof window.calcBMR === 'function',
      calcTarget: typeof window.calcTarget === 'function',
      calcMacros: typeof window.calcMacros === 'function',
      generateWeek: typeof window.generateWeek === 'function',
      validatePregnancyState: typeof window.validatePregnancyState === 'function',
      EXERCISE_GIFS: !!window.EXERCISE_GIFS,
      getExerciseVideoUrl: typeof window.getExerciseVideoUrl === 'function',
      jspdf: typeof window.jspdf !== 'undefined'
    }));

    for (const [key, val] of Object.entries(modulesCheck)) {
      if (val) log('Module ' + key + ': loaded');
      else fail('Module ' + key + ': NOT loaded');
    }

    // 7. Test jsPDF can create a document
    const pdfTest = await page.evaluate(() => {
      try {
        if (window.jspdf && window.jspdf.jsPDF) {
          var doc = new window.jspdf.jsPDF();
          doc.text('Test PDF', 10, 10);
          var output = doc.output('datauristring');
          return { ok: true, hasOutput: output && output.length > 100 };
        }
        return { ok: false, error: 'jspdf.jsPDF not found' };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    });

    if (pdfTest.ok && pdfTest.hasOutput) log('jsPDF can generate PDFs');
    else fail('jsPDF generation failed: ' + (pdfTest.error || 'empty output'));

    // 8. Check for any JS errors after initial load
    await page.waitForTimeout(2000);

    // 9. Navigate auth if needed — check if auth screen
    const authScreen = await page.evaluate(() => window.S && window.S.view === 'auth');
    if (authScreen) {
      log('Auth screen detected — testing login flow');
      // Look for login form
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) log('Login form found with email input');
      else log('No email input found (might be different auth UI)');
    }

    // 10. Test French character rendering in PDF
    const frenchPdfTest = await page.evaluate(() => {
      try {
        if (!window.jspdf || !window.jspdf.jsPDF) return { ok: false, error: 'jsPDF not available' };
        var doc = new window.jspdf.jsPDF();
        // Test French characters
        doc.text('Développé couché — 4×10 reps à 80kg', 10, 10);
        doc.text('Protéines: 150g · Glucides: 220g · Lipides: 60g', 10, 20);
        doc.text('Échauffement · Récupération · Séance terminée', 10, 30);
        var output = doc.output('datauristring');
        return { ok: true, size: output.length };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    });

    if (frenchPdfTest.ok) log('French characters in PDF: OK (' + frenchPdfTest.size + ' chars)');
    else fail('French PDF test failed: ' + frenchPdfTest.error);

  } catch(e) {
    fail('CRITICAL: ' + e.message);
  }

  // Summary
  console.log('\n========== TEST SUMMARY ==========');
  console.log('Passed: ' + results.length);
  console.log('Errors: ' + errors.length);
  console.log('Warnings: ' + warnings.length);

  if (errors.length > 0) {
    console.log('\n--- ERRORS ---');
    errors.forEach(e => console.log('  ✗ ' + e));
  }
  if (warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    warnings.slice(0, 20).forEach(w => console.log('  ⚠ ' + w));
  }

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
})();
