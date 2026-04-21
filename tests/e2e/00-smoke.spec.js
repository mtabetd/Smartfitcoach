const { test, expect } = require('@playwright/test');
const { gotoApp, clearState } = require('./helpers');

test.describe('Smoke — chargement de base', () => {

  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('La page charge et affiche le gate ou l\'app', async ({ page }) => {
    await page.addInitScript(({ key, hash }) => {
      sessionStorage.setItem(key, hash);
    }, { key: 'mtd_gate_access', hash: '1gs8uk7' });

    await page.goto('/');
    // Soit le gate, soit l'app doit être visible (Promise.race pour éviter le problème DOM-order avec .or())
    await Promise.race([
      page.locator('#app').waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('#gate').waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  });

  test('Bypass gate → écran auth visible', async ({ page }) => {
    await gotoApp(page);
    // L'app doit afficher un formulaire de connexion ou d'inscription
    await expect(page.locator('.auth-container, .auth-form, [class*="auth"]').first())
      .toBeVisible({ timeout: 8000 });
  });

  test('Pas de crash JS au démarrage', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await gotoApp(page);
    await page.waitForTimeout(2000);
    // Filtrer les erreurs connues / non-bloquantes
    const blocking = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise rejection')
    );
    expect(blocking, 'Erreurs JS au démarrage : ' + blocking.join('\n')).toHaveLength(0);
  });

  test('Titre de la page correct', async ({ page }) => {
    await gotoApp(page);
    await expect(page).toHaveTitle(/Smart\s*Fit\s*Coach/i);
  });

});
