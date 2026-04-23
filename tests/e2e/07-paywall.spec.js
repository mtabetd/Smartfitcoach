const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

async function waitForApp(page) {
  await page.waitForFunction(
    () => typeof window.render === 'function'
       && window.S != null
       && typeof window.showPaywall === 'function',
    { timeout: 12000 }
  );
}

async function goLoggedIn(page, extra = {}) {
  await page.evaluate((s) => {
    window.AUTH.isLoggedIn = () => true;
    window.AUTH.getUser = () => ({ id: 'uid-test', name: 'Test User', email: 't@t.com' });
    Object.assign(window.S, {
      prenom: 'Test',
      goal: 2,
      weekPlan: [{ n: 'Poulet', k: 500, p: 40, g: 30, l: 15 }],
      welcomeShown: true,
      subscription_plan: null, // pas premium
      subscription_end: null,
      firstLoginDate: new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 10), // 40 jours → pas en trial
      view: 'today',
    }, s);
    window.render();
  }, extra);
  await waitStable(page, 500);
}

// ─── AFFICHAGE ────────────────────────────────────────────────────────────────

test.describe('Paywall — affichage modal', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
    await goLoggedIn(page);
  });

  test('s\'affiche pour "scanner" avec le bon nom de feature', async ({ page }) => {
    await page.evaluate(() => window.showPaywall('scanner'));
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sfc-paywall-modal')).toContainText('Scanner de repas IA');
  });

  test('s\'affiche pour "coach" / "ai-coach"', async ({ page }) => {
    await page.evaluate(() => window.showPaywall('ai-coach'));
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sfc-paywall-modal')).toContainText('Coach IA');
  });

  test('s\'affiche pour "body-analysis" avec le bon nom', async ({ page }) => {
    await page.evaluate(() => window.showPaywall('body-analysis'));
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sfc-paywall-modal')).toContainText('Analyse corporelle IA');
  });

  test('s\'affiche pour "muscu-program" avec le bon nom', async ({ page }) => {
    await page.evaluate(() => window.showPaywall('muscu-program'));
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sfc-paywall-modal')).toContainText('Générateur de programme IA');
  });

  test('s\'affiche pour "history" avec le bon nom', async ({ page }) => {
    await page.evaluate(() => window.showPaywall('history'));
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sfc-paywall-modal')).toContainText('Historique de progression');
  });

  test('s\'affiche pour "pdf" avec le bon nom', async ({ page }) => {
    await page.evaluate(() => window.showPaywall('pdf'));
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sfc-paywall-modal')).toContainText('Export PDF');
  });

  test('feature inconnue → texte générique (pas de crash)', async ({ page }) => {
    await page.evaluate(() => window.showPaywall('feature-inexistante'));
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toBeVisible({ timeout: 5000 });
  });

  test('deux appels successifs → un seul modal (pas d\'empilement)', async ({ page }) => {
    await page.evaluate(() => {
      window.showPaywall('scanner');
      window.showPaywall('scanner');
    });
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toHaveCount(1);
  });
});

// ─── INTERACTIONS ─────────────────────────────────────────────────────────────

test.describe('Paywall — interactions boutons', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
    await goLoggedIn(page);
    await page.evaluate(() => window.showPaywall('scanner'));
    await waitStable(page, 400);
  });

  test('bouton "Fermer" retire le modal', async ({ page }) => {
    await page.locator('#sfc-paywall-modal').getByText('Fermer').click();
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toHaveCount(0);
  });

  test('bouton "Découvrir Premium" retire le modal et navigue vers profil', async ({ page }) => {
    await page.locator('#sfc-paywall-modal').getByText('Découvrir Premium').click();
    await waitStable(page, 600);
    await expect(page.locator('#sfc-paywall-modal')).toHaveCount(0);
    const view = await page.evaluate(() => window.S.view);
    expect(view).toBe('profil');
  });

  test('clic sur le fond (backdrop) ferme le modal', async ({ page }) => {
    // Click sur l'overlay lui-même (pas sur la box interne)
    await page.locator('#sfc-paywall-modal').click({ position: { x: 5, y: 5 } });
    await waitStable(page, 400);
    await expect(page.locator('#sfc-paywall-modal')).toHaveCount(0);
  });
});
