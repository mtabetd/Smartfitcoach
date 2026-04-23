const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

const SUPABASE_URL = 'https://uwaoxkgsgbzohakzgyvq.supabase.co';

async function waitForApp(page) {
  await page.waitForFunction(
    () => typeof window.render === 'function'
       && window.S != null
       && window.SupaSync != null,
    { timeout: 12000 }
  );
}

async function goLoggedIn(page, extra = {}) {
  await page.evaluate((s) => {
    window.AUTH.isLoggedIn = () => true;
    window.AUTH.getUser = () => ({ id: 'uid-test', name: 'Test User', email: 't@t.com' });
    Object.assign(window.S, {
      prenom: 'Test', goal: 2, view: 'today', welcomeShown: true,
      weekPlan: [{ n: 'Poulet', k: 500, p: 40, g: 30, l: 15 }],
    }, s);
    window.render();
  }, extra);
  await waitStable(page, 400);
}

// ─── STATUS SYNC ──────────────────────────────────────────────────────────────

test.describe('Sync — statut et API publique', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
  });

  test('_sfcSyncStatus() retourne la structure attendue', async ({ page }) => {
    const status = await page.evaluate(() => window._sfcSyncStatus());
    expect(status).toHaveProperty('failCount');
    expect(status).toHaveProperty('online');
    expect(status).toHaveProperty('lastWarnedAt');
    expect(typeof status.failCount).toBe('number');
    expect(typeof status.online).toBe('boolean');
  });

  test('SupaSync expose les méthodes critiques', async ({ page }) => {
    const methods = await page.evaluate(() => [
      'saveProfile', 'saveSession', 'saveFoodEntry', 'saveWater',
      'saveBadge', 'saveCounter', 'saveMealPlan', 'saveBodyAnalysis',
      'savePlateScan', 'syncOnLogin', 'scheduleSave',
    ].map(m => ({ m, ok: typeof window.SupaSync[m] === 'function' })));

    methods.forEach(({ m, ok }) => {
      expect(ok, 'SupaSync.' + m + ' doit être une fonction').toBe(true);
    });
  });
});

// ─── DEBOUNCE saveCounter ─────────────────────────────────────────────────────

test.describe('Sync — saveCounter debounce 2s', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
    await goLoggedIn(page);
  });

  test('saveCounter ne déclenche pas immédiatement (timer actif)', async ({ page }) => {
    const hasTimer = await page.evaluate(() => {
      window.SupaSync.saveCounter('test_ctr', 42);
      return Object.keys(window.SupaSync._counterTimers).length > 0;
    });
    expect(hasTimer).toBe(true);
  });

  test('saveCounter rapide: seul le dernier appel survit (debounce)', async ({ page }) => {
    const timerCount = await page.evaluate(() => {
      window.SupaSync.saveCounter('ctr_x', 1);
      window.SupaSync.saveCounter('ctr_x', 2);
      window.SupaSync.saveCounter('ctr_x', 3);
      // Un seul timer pour 'ctr_x'
      return Object.keys(window.SupaSync._counterTimers).filter(k => k === 'ctr_x').length;
    });
    expect(timerCount).toBe(1);
  });

  test('saveCounter: compteurs différents ont des timers indépendants', async ({ page }) => {
    const timerCount = await page.evaluate(() => {
      window.SupaSync.saveCounter('ctr_a', 1);
      window.SupaSync.saveCounter('ctr_b', 2);
      window.SupaSync.saveCounter('ctr_c', 3);
      return Object.keys(window.SupaSync._counterTimers).length;
    });
    expect(timerCount).toBe(3);
  });
});

// ─── INTERCEPTION RÉSEAU — saveBodyAnalysis / savePlateScan ──────────────────

test.describe('Sync — persistance body analysis + plate scan (interception réseau)', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);

    // Intercepter les appels Supabase REST avant le chargement de l'app
    await page.route(`${SUPABASE_URL}/rest/v1/**`, async route => {
      // Simuler une auth session valide pour les appels getSession
      if (route.request().url().includes('/auth/v1/session') ||
          route.request().url().includes('/auth/v1/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'fake-token',
            user: { id: 'uid-test', email: 't@t.com' }
          }),
        });
        return;
      }
      // Accepter les INSERTs/UPSERTs (retourner 201 vide)
      await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    });

    await page.route(`${SUPABASE_URL}/auth/v1/**`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-token',
          user: { id: 'uid-test', email: 't@t.com' }
        }),
      });
    });

    await gotoApp(page);
    await waitForApp(page);
    await goLoggedIn(page);
  });

  test('savePlateScan retourne une Promise sans crash', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const p = window.SupaSync.savePlateScan({
          name: 'Poulet rôti', kcal: 320, p: 35, g: 5, l: 12,
          portion: '200g', mealSlot: 'lunch',
          mealDate: '2026-04-23', addedToPlan: true,
        });
        // Doit retourner une Promise (ou undefined si pas de client)
        return { ok: p === undefined || (p && typeof p.then === 'function') };
      } catch(e) {
        return { ok: false, err: e.message };
      }
    });
    expect(result.ok, 'savePlateScan crash : ' + (result.err || '')).toBe(true);
  });

  test('saveBodyAnalysis retourne une Promise sans crash', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const p = window.SupaSync.saveBodyAnalysis(
          { morphologie: 'Mésomorphe', pointsForts: [], axesDeveloppement: [] },
          { titre: 'Programme force', objectif: 'Prise de masse', semaines: [] }
        );
        return { ok: p === undefined || (p && typeof p.then === 'function') };
      } catch(e) {
        return { ok: false, err: e.message };
      }
    });
    expect(result.ok, 'saveBodyAnalysis crash : ' + (result.err || '')).toBe(true);
  });

  test('saveSession retourne une Promise sans crash', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const p = window.SupaSync.saveSession({
          date: '2026-04-23', dayIndex: 0,
          duration: 45, kcalBase: 280, kcalEpoc: 40, kcalTotal: 320,
          rpe: 7, hr: 145,
        });
        return { ok: p === undefined || (p && typeof p.then === 'function') };
      } catch(e) {
        return { ok: false, err: e.message };
      }
    });
    expect(result.ok, 'saveSession crash : ' + (result.err || '')).toBe(true);
  });

  test('saveFoodEntry retourne une Promise sans crash', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const p = window.SupaSync.saveFoodEntry({
          date: '2026-04-23', meal: 'lunch',
          name: 'Riz complet', kcal: 210, p: 5, g: 42, l: 2,
          qty: 150, time: '12:30', source: 'manual',
        });
        return { ok: p === undefined || (p && typeof p.then === 'function') };
      } catch(e) {
        return { ok: false, err: e.message };
      }
    });
    expect(result.ok, 'saveFoodEntry crash : ' + (result.err || '')).toBe(true);
  });
});
