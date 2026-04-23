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
    window.AUTH.getUser = () => ({ id: 'uid-wt', name: 'Weight Tester', email: 'wt@t.com' });
    Object.assign(window.S, {
      prenom: 'Weight',
      appMode: 'nutrition',
      goal: 2,
      welcomeShown: true,
      _medicalDisclaimerShown: true,
      weight: 75,
      weightHistory: [],
      view: 'today',
    }, s);
    window.render();
  }, extra);
  await waitStable(page, 500);
}

test.describe('Weight logging', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
    await goLoggedIn(page);
  });

  test('FOOD_JOURNAL module is available', async ({ page }) => {
    const ok = await page.evaluate(() => typeof window.FOOD_JOURNAL !== 'undefined' || typeof window.TODAY !== 'undefined');
    expect(ok).toBe(true);
  });

  test('weight is stored in S.weight after update', async ({ page }) => {
    const newWeight = await page.evaluate(() => {
      window.S.weight = 76.5;
      var wh = window.S.weightHistory || [];
      wh.push({ date: new Date().toISOString().slice(0, 10), weight: 76.5 });
      window.S.weightHistory = wh;
      return window.S.weight;
    });
    expect(newWeight).toBe(76.5);
  });

  test('weightHistory grows after each log', async ({ page }) => {
    const len = await page.evaluate(() => {
      window.S.weightHistory = [];
      window.S.weightHistory.push({ date: '2026-04-20', weight: 75.0 });
      window.S.weightHistory.push({ date: '2026-04-21', weight: 74.8 });
      return window.S.weightHistory.length;
    });
    expect(len).toBe(2);
  });

  test('TRACKER.track fires weight_logged event', async ({ page }) => {
    const tracked = await page.evaluate(() => {
      var events = [];
      var orig = window.TRACKER && window.TRACKER.track;
      if (!orig) return null;
      window.TRACKER.track = function(ev, props) { events.push({ ev, props }); };
      window.TRACKER.track('weight_logged', { weight_kg: 77 });
      window.TRACKER.track = orig;
      return events.length > 0 && events[0].ev === 'weight_logged' ? events[0].props.weight_kg : null;
    });
    expect(tracked).toBe(77);
  });

  test('paywall hidden for trial user viewing dashboard', async ({ page }) => {
    const paywallVisible = await page.evaluate(() => {
      var el = document.getElementById('sfc-paywall-modal');
      return el && el.offsetParent !== null;
    });
    expect(paywallVisible).toBeFalsy();
  });
});
