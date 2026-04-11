/**
 * Playwright test: AI Coach feature — SmartFitCoach
 * Tests the coach chat UI against http://localhost:3000 with mocked API responses.
 *
 * Key code facts (read from app/ai-coach.js):
 *   - FUNCTION_URL = '/.netlify/functions/ai-coach'
 *   - Request body: { messages: [{role, content}], context: {...} }
 *   - Response body: { reply: "..." } or { error: "..." }
 *   - AbortController timeout: 28 000 ms client-side
 *   - AbortError message: 'Le coach met trop de temps à répondre. Réessaie dans quelques instants.'
 *   - Network error message: 'Impossible de joindre le coach. Vérifiez votre connexion.'
 *   - Anti-spam guard: module-level _sending flag
 *   - Error CSS class: .ai-msg-error
 *   - Panel CSS class when open: #ai-coach-panel.open
 *   - Input: #ai-coach-input   Send button: #ai-coach-send
 */

const { chromium } = require('playwright');

const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP_URL = 'http://localhost:3000';
const COACH_URL_PATTERN = '**/*ai-coach*';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function setupPage(browser) {
  const page = await browser.newPage();

  // Capture JS errors
  const jsErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') jsErrors.push(msg.text());
  });
  page.on('pageerror', err => jsErrors.push('PAGE ERROR: ' + err.message));

  // addInitScript runs BEFORE page scripts — gate sees the token at startup
  await page.addInitScript(() => {
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });

  // Wait for all app scripts to initialise
  await page.waitForTimeout(1500);

  // Inject auth + state after scripts are loaded
  await page.evaluate(() => {
    if (window.AUTH) {
      window.AUTH.isLoggedIn = function() { return true; };
      window.AUTH.getUser = function() { return { id: 'test-coach-001', email: 't@t.com' }; };
    }

    window.S = window.S || {};
    window.S.prenom = 'TestUser';
    window.S.age = 30;
    window.S.weight = 75;
    window.S.appMode = 'both';
    window.S.view = 'today';
    window.S.welcomeShown = true;
    window.S.firstLoginDate = '2025-01-01';
    window.S.todayWellness = {
      date: new Date().toISOString().slice(0, 10),
      sleep: 7,
      energy: 3,
      stress: 2,
      soreness: 1
    };
  });

  // Hide gate overlay if still visible
  await page.evaluate(() => {
    var g = document.getElementById('gate');
    var a = document.getElementById('app');
    if (g) g.style.display = 'none';
    if (a) a.style.display = 'block';
  });

  // Trigger render → ai-coach.js will buildUI() because AUTH.isLoggedIn() returns true
  await page.evaluate(() => {
    if (window.render) window.render();
  });

  await page.waitForTimeout(800);

  return { page, jsErrors };
}

async function openCoachPanel(page) {
  // Click the floating "Smart Fit Coach" button to open the panel
  await page.click('#ai-coach-btn');
  await page.waitForSelector('#ai-coach-panel.open', { timeout: 3000 });
  await page.waitForTimeout(300);
}

async function sendCoachMessage(page, text) {
  await page.fill('#ai-coach-input', text);
  await page.click('#ai-coach-send');
}

// ─── Test runner ──────────────────────────────────────────────────────────────

async function runTests() {
  const results = [];
  let browser;

  try {
    browser = await chromium.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 1 — Happy path: normal 200 response
    // ══════════════════════════════════════════════════════════════════════════
    {
      const testName = '1 - Happy path (200 response)';
      const { page, jsErrors } = await setupPage(browser);
      const apiCalls = [];

      try {
        // Mock before opening panel (route is registered before the first request)
        await page.route(COACH_URL_PATTERN, route => {
          apiCalls.push({ url: route.request().url(), method: route.request().method() });
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ reply: "Bonjour TestUser ! Comment puis-je t'aider aujourd'hui ?" })
          });
        });

        await openCoachPanel(page);

        // Verify the panel opened and the welcome message is present
        const welcomeVisible = await page.evaluate(() => {
          var panel = document.getElementById('ai-coach-panel');
          return panel && panel.classList.contains('open');
        });

        // Send a message
        await sendCoachMessage(page, 'Mon plan nutrition est-il adapté ?');

        // Wait for response to appear
        await page.waitForTimeout(1500);

        // Check that the coach reply is visible in the DOM
        const replyFound = await page.evaluate(() => {
          var msgs = Array.from(document.querySelectorAll('.ai-msg-coach .ai-msg-text'));
          return msgs.some(m => m.textContent.includes("Bonjour TestUser"));
        });

        // Check user message is displayed
        const userMsgFound = await page.evaluate(() => {
          var msgs = Array.from(document.querySelectorAll('.ai-msg-user .ai-msg-text'));
          return msgs.some(m => m.textContent.includes('Mon plan nutrition'));
        });

        // Check no errors displayed
        const errorMsgs = await page.evaluate(() => {
          return document.querySelectorAll('.ai-msg-error').length;
        });

        // Verify send button is re-enabled after response
        const sendBtnEnabled = await page.evaluate(() => {
          var btn = document.getElementById('ai-coach-send');
          return btn && !btn.disabled;
        });

        // Verify input is re-enabled
        const inputEnabled = await page.evaluate(() => {
          var input = document.getElementById('ai-coach-input');
          return input && !input.disabled;
        });

        // Validate request body was correct JSON
        const reqBodyCheck = await page.evaluate(() => {
          return window._lastCoachReqBody || null;
        });

        const pass = welcomeVisible && replyFound && userMsgFound && errorMsgs === 0 && sendBtnEnabled && inputEnabled;

        results.push({
          test: testName,
          pass,
          detail: [
            `Panel opened: ${welcomeVisible}`,
            `User message visible: ${userMsgFound}`,
            `Coach reply visible: ${replyFound}`,
            `Error messages: ${errorMsgs}`,
            `Send btn re-enabled: ${sendBtnEnabled}`,
            `Input re-enabled: ${inputEnabled}`,
            `API calls made: ${apiCalls.length}`,
            `JS errors: ${jsErrors.length}`
          ].join(' | ')
        });
      } catch (err) {
        results.push({ test: testName, pass: false, detail: 'EXCEPTION: ' + err.message });
      } finally {
        await page.close();
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 2 — Error 500: server error
    // ══════════════════════════════════════════════════════════════════════════
    {
      const testName = '2 - HTTP 500 error handling';
      const { page, jsErrors } = await setupPage(browser);

      try {
        await page.route(COACH_URL_PATTERN, route => {
          route.fulfill({
            status: 500,
            contentType: 'text/plain',
            body: 'Internal Server Error'
          });
        });

        await openCoachPanel(page);
        await sendCoachMessage(page, 'Teste erreur 500');

        // Wait for error handling
        await page.waitForTimeout(1500);

        // Check error message is displayed (not a blank page)
        const errorMsgCount = await page.evaluate(() => {
          return document.querySelectorAll('.ai-msg-error').length;
        });

        const errorText = await page.evaluate(() => {
          var errors = document.querySelectorAll('.ai-msg-error');
          return Array.from(errors).map(e => e.textContent).join(' | ');
        });

        // Verify no blank page — the panel is still open
        const panelStillOpen = await page.evaluate(() => {
          var panel = document.getElementById('ai-coach-panel');
          return panel && panel.classList.contains('open');
        });

        // Verify send button is re-enabled (not stuck)
        const sendBtnEnabled = await page.evaluate(() => {
          var btn = document.getElementById('ai-coach-send');
          return btn && !btn.disabled;
        });

        // Verify input is accessible
        const inputEnabled = await page.evaluate(() => {
          var input = document.getElementById('ai-coach-input');
          return input && !input.disabled;
        });

        // Typing indicator should be gone
        const typingGone = await page.evaluate(() => {
          var typing = Array.from(document.querySelectorAll('.ai-msg-typing'));
          return typing.length === 0;
        });

        const pass = errorMsgCount > 0 && panelStillOpen && sendBtnEnabled && inputEnabled && typingGone;

        results.push({
          test: testName,
          pass,
          detail: [
            `Error messages shown: ${errorMsgCount}`,
            `Error text: "${errorText.slice(0, 120)}"`,
            `Panel still open (no crash): ${panelStillOpen}`,
            `Send btn re-enabled: ${sendBtnEnabled}`,
            `Input accessible: ${inputEnabled}`,
            `Typing indicator gone: ${typingGone}`,
            `JS errors: ${jsErrors.length}`
          ].join(' | ')
        });
      } catch (err) {
        results.push({ test: testName, pass: false, detail: 'EXCEPTION: ' + err.message });
      } finally {
        await page.close();
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 3 — Timeout: AbortController fires after 28s
    //   Strategy: mock never responds + reduce timeout to 2s via code patch
    //   to keep the test quick, then verify abort error message appears.
    // ══════════════════════════════════════════════════════════════════════════
    {
      const testName = '3 - Timeout (AbortController)';
      const { page, jsErrors } = await setupPage(browser);
      const apiCallTimestamps = [];

      try {
        // Never fulfill the request (simulate infinite hang)
        await page.route(COACH_URL_PATTERN, route => {
          apiCallTimestamps.push(Date.now());
          // Intentionally do NOT call route.fulfill() — hangs forever
          // The AbortController will cancel it client-side
        });

        // Patch _coachTimer inside the IIFE to fire much faster (2s instead of 28s)
        // We override AbortController to trigger automatically after 2s by patching
        // the sendMessage function via the window.AI_COACH.send reference.
        // Simpler: patch the global AbortController to use a short timeout.
        await page.evaluate(() => {
          var _origAbortController = window.AbortController;
          window.AbortController = function() {
            var ctrl = new _origAbortController();
            // Auto-abort after 2 seconds (replaces the 28s timer inside ai-coach.js)
            setTimeout(function() { ctrl.abort(); }, 2000);
            return ctrl;
          };
          window.AbortController.prototype = _origAbortController.prototype;
        });

        await openCoachPanel(page);
        const t0 = Date.now();
        await sendCoachMessage(page, 'Teste timeout');

        // Wait for abort timeout + some buffer (2s abort + 500ms buffer)
        await page.waitForTimeout(3000);

        const elapsed = Date.now() - t0;

        // Verify timeout error message
        const errorMsgCount = await page.evaluate(() => {
          return document.querySelectorAll('.ai-msg-error').length;
        });

        const errorText = await page.evaluate(() => {
          var errors = document.querySelectorAll('.ai-msg-error');
          return Array.from(errors).map(e => e.textContent).join(' | ');
        });

        // Check for the specific AbortError message
        const hasTimeoutMsg = await page.evaluate(() => {
          var errors = document.querySelectorAll('.ai-msg-error');
          return Array.from(errors).some(e =>
            e.textContent.includes('trop de temps') || e.textContent.includes('Réessaie')
          );
        });

        // App should NOT be blocked — send button must be re-enabled
        const sendBtnEnabled = await page.evaluate(() => {
          var btn = document.getElementById('ai-coach-send');
          return btn && !btn.disabled;
        });

        // Typing indicator must be gone
        const typingGone = await page.evaluate(() => {
          return document.querySelectorAll('.ai-msg-typing').length === 0;
        });

        // Verify only 1 API call was made (no retry loop)
        const singleCall = apiCallTimestamps.length === 1;

        const pass = errorMsgCount > 0 && hasTimeoutMsg && sendBtnEnabled && typingGone && singleCall;

        results.push({
          test: testName,
          pass,
          detail: [
            `Error messages shown: ${errorMsgCount}`,
            `Has timeout message: ${hasTimeoutMsg}`,
            `Error text: "${errorText.slice(0, 150)}"`,
            `App not blocked (send btn re-enabled): ${sendBtnEnabled}`,
            `Typing indicator gone: ${typingGone}`,
            `API call count (expect 1, no loop): ${apiCallTimestamps.length}`,
            `Elapsed: ${elapsed}ms`,
            `JS errors: ${jsErrors.length}`
          ].join(' | ')
        });
      } catch (err) {
        results.push({ test: testName, pass: false, detail: 'EXCEPTION: ' + err.message });
      } finally {
        await page.close();
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 4 — Double send anti-spam guard
    //   Send two messages in rapid succession while 1st is still pending.
    //   The 2nd should be blocked (_sending flag).
    // ══════════════════════════════════════════════════════════════════════════
    {
      const testName = '4 - Double send anti-spam guard';
      const { page, jsErrors } = await setupPage(browser);
      const apiCallTimes = [];

      try {
        let resolveFirstRequest;

        // Mock responds slowly (300ms delay) — controlled promise
        await page.route(COACH_URL_PATTERN, async route => {
          apiCallTimes.push(Date.now());
          // Artificial delay of 300ms
          await new Promise(resolve => setTimeout(resolve, 300));
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ reply: 'Réponse lente reçue.' })
          });
        });

        await openCoachPanel(page);

        // Send first message
        await page.fill('#ai-coach-input', 'Premier message');
        await page.click('#ai-coach-send');

        // Immediately attempt second send (within ~50ms)
        await page.waitForTimeout(50);
        await page.fill('#ai-coach-input', 'Deuxième message');
        await page.click('#ai-coach-send');

        // Wait for first response to complete
        await page.waitForTimeout(1500);

        // Count how many API calls were made
        const callCount = apiCallTimes.length;

        // Count user messages displayed (should be 1 or 2 depending on implementation)
        const userMsgCount = await page.evaluate(() => {
          return document.querySelectorAll('.ai-msg-user').length;
        });

        // The send button should have been disabled during the first request
        // After first response, should be enabled again
        const sendBtnEnabled = await page.evaluate(() => {
          var btn = document.getElementById('ai-coach-send');
          return btn && !btn.disabled;
        });

        // Check for no errors
        const errorCount = await page.evaluate(() => {
          return document.querySelectorAll('.ai-msg-error').length;
        });

        // Key assertion: only 1 API call should have been made
        // (the second click while _sending=true is ignored)
        const antiSpamWorked = callCount === 1;

        const pass = antiSpamWorked && sendBtnEnabled && errorCount === 0;

        results.push({
          test: testName,
          pass,
          detail: [
            `API calls made (expect 1): ${callCount}`,
            `Anti-spam guard worked: ${antiSpamWorked}`,
            `User messages in DOM: ${userMsgCount}`,
            `Send btn re-enabled: ${sendBtnEnabled}`,
            `Error messages: ${errorCount}`,
            `JS errors: ${jsErrors.length}`
          ].join(' | ')
        });
      } catch (err) {
        results.push({ test: testName, pass: false, detail: 'EXCEPTION: ' + err.message });
      } finally {
        await page.close();
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 5 — Request format validation
    //   Verify the fetch body contains the expected JSON fields.
    // ══════════════════════════════════════════════════════════════════════════
    {
      const testName = '5 - Request body format (messages + context)';
      const { page, jsErrors } = await setupPage(browser);

      try {
        let capturedBody = null;

        await page.route(COACH_URL_PATTERN, async route => {
          const reqBody = route.request().postData();
          try {
            capturedBody = JSON.parse(reqBody);
          } catch(e) {
            capturedBody = { parseError: e.message, raw: reqBody };
          }
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ reply: 'OK' })
          });
        });

        await openCoachPanel(page);
        await sendCoachMessage(page, 'Question de test format');
        await page.waitForTimeout(1000);

        const hasMessages = capturedBody && Array.isArray(capturedBody.messages);
        const hasContext = capturedBody && typeof capturedBody.context === 'object';
        const lastMsg = hasMessages ? capturedBody.messages[capturedBody.messages.length - 1] : null;
        const lastMsgOk = lastMsg && lastMsg.role === 'user' && lastMsg.content.includes('Question de test format');
        const contextHasPrenomOrAge = hasContext && (
          capturedBody.context.prenom !== undefined ||
          capturedBody.context.age !== undefined
        );

        const pass = hasMessages && hasContext && lastMsgOk && contextHasPrenomOrAge;

        results.push({
          test: testName,
          pass,
          detail: [
            `Body has "messages" array: ${hasMessages}`,
            `Body has "context" object: ${hasContext}`,
            `Last message is user msg with correct content: ${lastMsgOk}`,
            `Context has prenom/age: ${contextHasPrenomOrAge}`,
            `Context keys: ${hasContext ? Object.keys(capturedBody.context).join(',') : 'N/A'}`,
            `Messages count: ${hasMessages ? capturedBody.messages.length : 0}`,
            `JS errors: ${jsErrors.length}`
          ].join(' | ')
        });
      } catch (err) {
        results.push({ test: testName, pass: false, detail: 'EXCEPTION: ' + err.message });
      } finally {
        await page.close();
      }
    }

  } finally {
    if (browser) await browser.close();
  }

  // ─── Print report ──────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  SmartFitCoach — AI Coach Test Report');
  console.log('========================================\n');

  let passed = 0, failed = 0, skipped = 0;
  for (const r of results) {
    let icon, status;
    if (r.pass === null) { icon = '⊘'; status = 'SKIP'; skipped++; }
    else if (r.pass)     { icon = '✓'; status = 'PASS'; passed++; }
    else                 { icon = '✗'; status = 'FAIL'; failed++; }

    console.log(`${icon} [${status}] ${r.test}`);
    console.log(`       ${r.detail}`);
    console.log();
  }

  console.log('========================================');
  console.log(`  PASSED: ${passed}  FAILED: ${failed}  SKIPPED: ${skipped}`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
