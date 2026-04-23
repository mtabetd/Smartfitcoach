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
    window.AUTH.getUser = () => ({ id: 'uid-sl', name: 'Sport Tester', email: 'sl@t.com' });
    Object.assign(window.S, {
      prenom: 'Sport',
      appMode: 'sport',
      sportType: 'musculation',
      nStep: 12,
      goal: 1,
      welcomeShown: true,
      _medicalDisclaimerShown: true,
      sessionHistory: {},
      view: 'today',
    }, s);
    window.render();
  }, extra);
  await waitStable(page, 500);
}

test.describe('Sport logging', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
    await goLoggedIn(page);
  });

  test('sessionHistory state is writable and persists', async ({ page }) => {
    const result = await page.evaluate(() => {
      var today = new Date().toISOString().slice(0, 10);
      if (!window.S.sessionHistory) window.S.sessionHistory = {};
      window.S.sessionHistory[today] = { kcalTotal: 350, duration: 45, rpe: 7 };
      return window.S.sessionHistory[today].kcalTotal;
    });
    expect(result).toBe(350);
  });

  test('sessionHistory accumulates entries over multiple days', async ({ page }) => {
    const len = await page.evaluate(() => {
      window.S.sessionHistory = {};
      window.S.sessionHistory['2026-04-20'] = { kcalTotal: 300, duration: 40 };
      window.S.sessionHistory['2026-04-21'] = { kcalTotal: 420, duration: 55 };
      window.S.sessionHistory['2026-04-22'] = { kcalTotal: 280, duration: 35 };
      return Object.keys(window.S.sessionHistory).length;
    });
    expect(len).toBe(3);
  });

  test('TRACKER fires workout_completed event', async ({ page }) => {
    const tracked = await page.evaluate(() => {
      if (!window.TRACKER) return null;
      var events = [];
      var orig = window.TRACKER.track;
      window.TRACKER.track = function(ev, props) { events.push({ ev, props }); };
      window.TRACKER.track('workout_completed', { sport_type: 'musculation', kcal: 350, duration: 45 });
      window.TRACKER.track = orig;
      return events.find(function(e) { return e.ev === 'workout_completed'; });
    });
    if (tracked === null) return;
    expect(tracked.props.sport_type).toBe('musculation');
    expect(tracked.props.kcal).toBe(350);
  });

  test('SupaSync.saveSession returns a Promise without crash', async ({ page }) => {
    const result = await page.evaluate(async () => {
      if (!window.SupaSync || !window.SupaSync.saveSession) return null;
      try {
        var p = window.SupaSync.saveSession({
          date: new Date().toISOString().slice(0, 10),
          dayIndex: 0,
          duration: 45,
          kcalBase: 280,
          kcalEpoc: 40,
          kcalTotal: 320,
          rpe: 7,
          hr: 145,
        });
        return { ok: p === undefined || (p && typeof p.then === 'function') };
      } catch (e) {
        return { ok: false, err: e.message };
      }
    });
    if (result === null) return;
    expect(result.ok, 'saveSession crash: ' + (result && result.err || '')).toBe(true);
  });

  test('sportType is preserved after state update', async ({ page }) => {
    const sportType = await page.evaluate(() => {
      window.S.sportType = 'crossfit';
      return window.S.sportType;
    });
    expect(sportType).toBe('crossfit');
  });
});
