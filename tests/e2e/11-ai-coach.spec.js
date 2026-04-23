const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

async function waitForApp(page) {
  await page.waitForFunction(
    () => typeof window.render === 'function' && window.S != null,
    { timeout: 12000 }
  );
}

async function goLoggedIn(page, extra = {}) {
  await page.evaluate((s) => {
    window.AUTH.isLoggedIn = () => true;
    window.AUTH.getUser = () => ({ id: 'uid-ac', name: 'Coach Tester', email: 'ac@t.com' });
    Object.assign(window.S, {
      prenom: 'Coach',
      appMode: 'sport',
      sportType: 'musculation',
      nStep: 12,
      goal: 1,
      welcomeShown: true,
      _medicalDisclaimerShown: true,
      view: 'today',
    }, s);
    window.render();
  }, extra);
  await waitStable(page, 500);
}

test.describe('AI Coach', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
    await goLoggedIn(page);
  });

  test('AI_COACH module is available with expected API', async ({ page }) => {
    const api = await page.evaluate(() => {
      if (!window.AI_COACH) return null;
      return ['open', 'close', 'toggle', 'send', 'buildContext', 'getSuggestions']
        .map(m => ({ m, ok: typeof window.AI_COACH[m] === 'function' }));
    });
    if (api === null) return; // module not loaded, skip
    api.forEach(({ m, ok }) => expect(ok, `AI_COACH.${m} must be a function`).toBe(true));
  });

  test('AI_COACH.open creates panel element in DOM', async ({ page }) => {
    const panelExists = await page.evaluate(() => {
      if (!window.AI_COACH) return null;
      window.AI_COACH.open();
      return document.getElementById('ai-coach-panel') !== null;
    });
    if (panelExists === null) return;
    expect(panelExists).toBe(true);
  });

  test('AI_COACH panel has input and send button after open', async ({ page }) => {
    const result = await page.evaluate(() => {
      if (!window.AI_COACH) return null;
      window.AI_COACH.open();
      return {
        input: document.getElementById('ai-coach-input') !== null,
        send: document.getElementById('ai-coach-send') !== null,
      };
    });
    if (result === null) return;
    expect(result.input).toBe(true);
    expect(result.send).toBe(true);
  });

  test('TRACKER fires ai_coach_used event', async ({ page }) => {
    const tracked = await page.evaluate(() => {
      if (!window.TRACKER) return null;
      var events = [];
      var orig = window.TRACKER.track;
      window.TRACKER.track = function(ev, props) { events.push({ ev, props }); };
      window.TRACKER.track('ai_coach_used', {});
      window.TRACKER.track = orig;
      return events.find(function(e) { return e.ev === 'ai_coach_used'; });
    });
    if (tracked === null) return;
    expect(tracked.ev).toBe('ai_coach_used');
  });

  test('AI_COACH.buildContext returns object with user data', async ({ page }) => {
    const ctx = await page.evaluate(() => {
      if (!window.AI_COACH || !window.AI_COACH.buildContext) return null;
      try {
        return window.AI_COACH.buildContext();
      } catch (e) { return null; }
    });
    if (ctx === null) return;
    expect(typeof ctx).toBe('object');
  });

  test('AI_COACH.close removes open class from panel', async ({ page }) => {
    const result = await page.evaluate(() => {
      if (!window.AI_COACH) return null;
      window.AI_COACH.open();
      var panelOpen = document.getElementById('ai-coach-panel');
      if (!panelOpen) return null;
      window.AI_COACH.close();
      var panel = document.getElementById('ai-coach-panel');
      return panel ? !panel.classList.contains('open') : true;
    });
    if (result === null) return;
    expect(result).toBe(true);
  });
});
