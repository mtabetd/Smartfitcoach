const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

async function waitForRender(page) {
  await page.waitForFunction(() => typeof window.render === 'function' && window.S != null, { timeout: 10000 });
}

// État minimal pour bypasser renderSportQuickProfile (guard: !sex || !age || !weight || !_sportProfileDone)
const BASE_SPORT = {
  appMode: 'sport', view: 'sport',
  sex: 'homme', age: 30, weight: 80, height: 180,
  _sportProfileDone: true,
  medical: [], parqDone: false
};

async function goLoggedIn(page, state) {
  await page.evaluate((s) => {
    window.AUTH.isLoggedIn = () => true;
    window.AUTH.getUser = () => ({ id: 'u1', name: 'Test', email: 't@t.com' });
    window.S.welcomeShown = true;
    Object.assign(window.S, s);
    window.render();
  }, state);
  await waitStable(page, 400);
}

// ─── SPLASH SPORT ───────────────────────────────────────────────────────────

test.describe('Onboarding sport — Splash screen', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { ...BASE_SPORT, sStep: 0, sportSplashDone: false, sportType: null });
  });

  test('Splash sport affiché (bouton "Je commence")', async ({ page }) => {
    // Animation CSS delay 0.8s + duration 0.6s → visible à ~1.4s. Timeout 8s.
    await expect(page.locator('button').filter({ hasText: /commence/i }))
      .toBeVisible({ timeout: 8000 });
  });

  test('Bouton "Je commence" cliquable → sportSplashDone = true', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /commence/i });
    await expect(btn).toBeVisible({ timeout: 8000 });
    await btn.click();
    await waitStable(page, 400);
    const splashDone = await page.evaluate(() => window.S.sportSplashDone);
    expect(splashDone).toBe(true);
  });
});

// ─── SÉLECTION TYPE DE SPORT ─────────────────────────────────────────────────

test.describe('Onboarding sport — Sélection type de programme', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { ...BASE_SPORT, sStep: 0, sportSplashDone: true, sportType: null });
  });

  test('Section "Type de programme" visible', async ({ page }) => {
    await expect(page.locator('.section-label').filter({ hasText: /type de programme/i }))
      .toBeVisible({ timeout: 5000 });
  });

  test('Option Musculation visible (.sel-card)', async ({ page }) => {
    await expect(page.locator('.sel-card').filter({ hasText: 'Musculation' }).first())
      .toBeVisible({ timeout: 5000 });
  });

  test('Option Running visible', async ({ page }) => {
    await expect(page.locator('.sel-card').filter({ hasText: 'Running' }).first())
      .toBeVisible({ timeout: 5000 });
  });

  test('Option Cross Training visible', async ({ page }) => {
    await expect(page.locator('.sel-card').filter({ hasText: 'Cross Training' }).first())
      .toBeVisible({ timeout: 5000 });
  });

  test('Sélectionner Musculation → sportType = musculation, sStep > 0', async ({ page }) => {
    await page.locator('.sel-card').filter({ hasText: 'Musculation' }).first().click();
    await waitStable(page, 600);
    const s = await page.evaluate(() => ({ type: window.S.sportType, step: window.S.sStep }));
    expect(s.type).toBe('musculation');
    expect(s.step).toBeGreaterThan(0);
  });

  test('Sélectionner Running → sportType = running', async ({ page }) => {
    await page.locator('.sel-card').filter({ hasText: 'Running' }).first().click();
    await waitStable(page, 600);
    const sportType = await page.evaluate(() => window.S.sportType);
    expect(sportType).toBe('running');
  });

  test('Sélectionner Yoga & Mobilité → sportType = yoga', async ({ page }) => {
    await expect(page.locator('.sel-card').filter({ hasText: /yoga/i }).first())
      .toBeVisible({ timeout: 5000 });
    await page.locator('.sel-card').filter({ hasText: /yoga/i }).first().click();
    await waitStable(page, 600);
    const sportType = await page.evaluate(() => window.S.sportType);
    expect(sportType).toBe('yoga');
  });
});

// ─── ONBOARDING MUSCULATION ──────────────────────────────────────────────────

test.describe('Onboarding sport — Musculation: objectifs (sStep 1)', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { ...BASE_SPORT, sStep: 1, sportSplashDone: true, sportType: 'musculation' });
  });

  test('Cartes d\'objectifs musculation affichées', async ({ page }) => {
    // renderMusculationGoals rend des sel-cards pour les objectifs
    await expect(page.locator('.sel-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('Bouton Suivant présent (peut être désactivé)', async ({ page }) => {
    await expect(page.locator('button.btn-primary').first()).toBeVisible({ timeout: 5000 });
  });

  test('Sélectionner un objectif → bouton Suivant actif', async ({ page }) => {
    const card = page.locator('.sel-card').first();
    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();
    await waitStable(page);
    await expect(page.locator('button.btn-primary').first()).toBeEnabled({ timeout: 3000 });
  });
});

// ─── PROFIL RAPIDE SPORT (renderSportQuickProfile) ───────────────────────────

test.describe('Onboarding sport — Profil rapide (sport-only, données manquantes)', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    // Sans age/_sportProfileDone → déclenche renderSportQuickProfile
    await goLoggedIn(page, {
      appMode: 'sport', view: 'sport', sStep: 0,
      sportSplashDone: true, sportType: null,
      sex: null, weight: null, height: null
    });
  });

  test('Écran de saisie rapide charge sans erreur JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await waitStable(page, 600);
    const blocking = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(blocking).toHaveLength(0);
  });

  test('Contenu rendu dans #app (pas vide)', async ({ page }) => {
    await waitStable(page, 400);
    const html = await page.locator('#app').innerHTML();
    expect(html.length).toBeGreaterThan(100);
  });
});
