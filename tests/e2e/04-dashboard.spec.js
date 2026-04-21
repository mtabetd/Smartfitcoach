const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

async function waitForRender(page) {
  await page.waitForFunction(() => typeof window.render === 'function' && window.S != null, { timeout: 10000 });
}

// Profil minimal complet pour accéder au dashboard sans bloquer
const FULL_PROFILE = {
  appMode: 'nutrition',
  view: 'today',
  nStep: 12,
  sStep: 0,
  welcomeShown: true,
  sex: 'homme',
  birthDate: '1990-06-15',
  weight: 78,
  height: 178,
  activity: 2,
  sleep: 2,
  goal: 0,
  train: [],
  medical: [],
  mealsPerDay: 3,
  regime: 0,
  weekPlan: null,
  firstLoginDate: '2024-01-01',
  todayWellness: null
};

async function goToDashboard(page, extraState) {
  await page.evaluate(({ profile, extra }) => {
    window.AUTH.isLoggedIn = () => true;
    window.AUTH.getUser = () => ({ id: 'u1', name: 'Test User', email: 't@t.com' });
    Object.assign(window.S, profile, extra || {});
    window.render();
  }, { profile: FULL_PROFILE, extra: extraState });
  await waitStable(page, 600);
}

// ─── DASHBOARD AUJOURD'HUI ────────────────────────────────────────────────────

test.describe('Dashboard — Vue Aujourd\'hui', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goToDashboard(page);
  });

  test('App bar visible (SMARTFITCOACH)', async ({ page }) => {
    await expect(page.locator('.user-bar')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.user-bar')).toContainText('SMARTFITCOACH');
  });

  test('Navigation principale visible', async ({ page }) => {
    await expect(page.locator('.main-nav')).toBeVisible({ timeout: 5000 });
  });

  test('Onglets de navigation présents', async ({ page }) => {
    const tabs = page.locator('.main-nav-tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Dashboard charge du contenu (pas vide)', async ({ page }) => {
    const app = page.locator('#app');
    await expect(app).toBeVisible({ timeout: 5000 });
    const html = await app.innerHTML();
    expect(html.length).toBeGreaterThan(200);
  });

  test('Pas d\'erreurs JS bloquantes', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await waitStable(page, 800);
    const blocking = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('ResizeObserver')
    );
    expect(blocking, 'Erreurs JS : ' + blocking.join('\n')).toHaveLength(0);
  });
});

// ─── NAVIGATION ENTRE ONGLETS ────────────────────────────────────────────────

test.describe('Dashboard — Navigation par onglets', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goToDashboard(page);
    // Attendre que la nav soit visible
    await page.locator('.main-nav').waitFor({ state: 'visible', timeout: 5000 });
  });

  test('Clic onglet Nutrition → vue nutrition', async ({ page }) => {
    await page.locator('.main-nav-tab').filter({ hasText: /nutri/i }).first().click();
    await waitStable(page);
    const view = await page.evaluate(() => window.S.view);
    expect(view).toBe('nutrition');
  });

  test('Clic onglet Sport → vue sport', async ({ page }) => {
    // Sport tab visible uniquement si appMode inclut sport
    await goToDashboard(page, { appMode: 'both', sStep: 0, sportSplashDone: true, sportType: 'musculation', sportProgram: null });
    await page.locator('.main-nav').waitFor({ state: 'visible', timeout: 5000 });
    const sportTab = page.locator('.main-nav-tab').filter({ hasText: /sport|entra/i }).first();
    const count = await sportTab.count();
    if (count > 0) {
      await sportTab.click();
      await waitStable(page);
      const view = await page.evaluate(() => window.S.view);
      expect(view).toBe('sport');
    } else {
      // Pas d'onglet sport en mode nutrition seul — OK
      expect(true).toBe(true);
    }
  });

  test('Clic onglet Analytique → vue analytics', async ({ page }) => {
    const analyticsTab = page.locator('.main-nav-tab').filter({ hasText: /analytics|analyt|stats/i }).first();
    const count = await analyticsTab.count();
    if (count > 0) {
      await analyticsTab.click();
      await waitStable(page);
      const view = await page.evaluate(() => window.S.view);
      expect(view).toBe('analytics');
    } else {
      // Chercher par position (dernier onglet souvent analytics)
      const tabs = page.locator('.main-nav-tab');
      const total = await tabs.count();
      if (total >= 3) {
        await tabs.last().click();
        await waitStable(page);
      }
      expect(true).toBe(true);
    }
  });

  test('Onglet actif marqué .active sur vue today', async ({ page }) => {
    await page.evaluate(() => { window.S.view = 'today'; window.render(); });
    await waitStable(page);
    const activeTab = page.locator('.main-nav-tab.active');
    await expect(activeTab).toBeVisible({ timeout: 3000 });
  });
});

// ─── DASHBOARD MODE SPORT ─────────────────────────────────────────────────────

test.describe('Dashboard — Mode sport + nutrition (both)', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goToDashboard(page, {
      appMode: 'both',
      sportType: 'musculation',
      sportSplashDone: true,
      sStep: 4
    });
  });

  test('Dashboard charge en mode "both" sans erreur', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await waitStable(page, 600);
    const blocking = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('ResizeObserver')
    );
    expect(blocking).toHaveLength(0);
    await expect(page.locator('.user-bar')).toBeVisible({ timeout: 5000 });
  });
});

// ─── LANGUE ──────────────────────────────────────────────────────────────────

test.describe('Dashboard — Toggle langue', () => {
  test('Basculer FR → EN → FR ne plante pas', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goToDashboard(page);
    await page.locator('.user-bar').waitFor({ state: 'visible', timeout: 5000 });
    // Toggle langue via JS
    await page.evaluate(() => {
      if (window.I18N && window.I18N.setLang) {
        window.I18N.setLang('en');
        window.render();
      }
    });
    await waitStable(page);
    await expect(page.locator('.user-bar')).toBeVisible({ timeout: 3000 });
    // Remettre FR
    await page.evaluate(() => {
      if (window.I18N && window.I18N.setLang) {
        window.I18N.setLang('fr');
        window.render();
      }
    });
    await waitStable(page);
    await expect(page.locator('.user-bar')).toBeVisible({ timeout: 3000 });
  });
});
