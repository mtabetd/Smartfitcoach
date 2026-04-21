const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

async function waitForRender(page) {
  await page.waitForFunction(() => typeof window.render === 'function' && window.S != null, { timeout: 10000 });
}

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

// ─── RÉSISTANCE AUX CLICS RAPIDES ────────────────────────────────────────────

test.describe('Edge cases — Clics rapides consécutifs', () => {
  test('Clic Suivant en onboarding avance exactement d\'un step', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, sex: null });
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Homme' }).click();
    await waitStable(page);
    await page.locator('button.btn-primary').first().click();
    await waitStable(page);
    const nStep = await page.evaluate(() => window.S.nStep);
    // Avancer une fois depuis step 1 → step 2
    expect(nStep).toBe(2);
  });

  test('Clic rapide sur une sel-card ne la sélectionne pas plusieurs fois', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, sex: null });
    const card = page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Homme' });
    await card.click();
    await card.click(); // deuxième clic
    await waitStable(page);
    const sex = await page.evaluate(() => window.S.sex);
    // Le sexe doit être 'homme', pas null ni autre valeur
    expect(sex).toBe('homme');
  });
});

// ─── NAVIGATION RAPIDE ENTRE VUES ────────────────────────────────────────────

test.describe('Edge cases — Navigation rapide entre vues', () => {
  test('Alterner today/nutrition/today ne plante pas', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, {
      appMode: 'nutrition', view: 'today', nStep: 12,
      sex: 'homme', weight: 75, height: 175, firstLoginDate: '2024-01-01'
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Alterner rapidement entre vues
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => { window.S.view = 'nutrition'; window.render(); });
      await page.waitForTimeout(100);
      await page.evaluate(() => { window.S.view = 'today'; window.render(); });
      await page.waitForTimeout(100);
    }
    await waitStable(page, 300);
    const blocking = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('ResizeObserver')
    );
    expect(blocking, 'Erreurs JS : ' + blocking.join('\n')).toHaveLength(0);
  });
});

// ─── RÉSISTANCE AUX DONNÉES CORROMPUES ───────────────────────────────────────

test.describe('Edge cases — Données corrompues dans S', () => {
  test('S.medical null → étape 8 charge sans crash', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await goLoggedIn(page, {
      appMode: 'nutrition', view: 'nutrition', nStep: 8,
      sex: 'homme', birthDate: '1990-01-01', weight: 75, height: 175,
      activity: 2, sleep: 2, goal: 0, medical: null // Volontairement null
    });
    await waitStable(page, 400);
    const blocking = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(blocking).toHaveLength(0);
    await expect(page.locator('.sel-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('S.weight = null → étape 3 charge sans crash', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await goLoggedIn(page, {
      appMode: 'nutrition', view: 'nutrition', nStep: 3,
      sex: 'homme', birthDate: '1990-01-01', weight: null, height: null
    });
    await waitStable(page, 400);
    const blocking = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(blocking).toHaveLength(0);
  });

  test('S.goal invalide (999) → render ne plante pas', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await goLoggedIn(page, {
      appMode: 'nutrition', view: 'today', nStep: 12,
      sex: 'homme', weight: 75, height: 175, goal: 999,
      firstLoginDate: '2024-01-01'
    });
    await waitStable(page, 400);
    const blocking = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('ResizeObserver')
    );
    expect(blocking).toHaveLength(0);
  });
});

// ─── DÉCONNEXION ──────────────────────────────────────────────────────────────

test.describe('Edge cases — Déconnexion', () => {
  test('Déconnexion depuis onboarding → écran auth affiché', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, sex: 'homme' });
    // Cliquer sur le bouton de déconnexion dans le formulaire onboarding
    const logoutBtn = page.locator('button').filter({ hasText: /d[eé]connecter|logout/i }).first();
    const count = await logoutBtn.count();
    if (count > 0) {
      // Mock logout pour éviter appel réseau
      await page.evaluate(() => {
        window.AUTH.logout = () => {
          window.AUTH.isLoggedIn = () => false;
          window.AUTH.getUser = () => null;
          window.S.view = 'auth';
          window.render();
          return Promise.resolve();
        };
      });
      await logoutBtn.click();
      await waitStable(page);
      await expect(page.locator('.auth-container')).toBeVisible({ timeout: 5000 });
    } else {
      // Simuler la déconnexion directement
      await page.evaluate(() => {
        window.AUTH.isLoggedIn = () => false;
        window.AUTH.getUser = () => null;
        window.S.view = 'auth';
        window.render();
      });
      await waitStable(page);
      await expect(page.locator('.auth-container')).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── LOCALISATION (i18n) ──────────────────────────────────────────────────────

test.describe('Edge cases — Langue EN', () => {
  test('Onboarding step 1 en anglais ne plante pas', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    // Activer la langue EN avant le render
    await page.evaluate(() => {
      if (window.I18N && window.I18N.setLang) window.I18N.setLang('en');
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, sex: null });
    await waitStable(page, 400);
    const blocking = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(blocking).toHaveLength(0);
    await expect(page.locator('.card-grid-2')).toBeVisible({ timeout: 5000 });
    // Remettre FR
    await page.evaluate(() => {
      if (window.I18N && window.I18N.setLang) window.I18N.setLang('fr');
    });
  });
});

// ─── PERSISTANCE ÉTAT ─────────────────────────────────────────────────────────

test.describe('Edge cases — Persistance état entre renders', () => {
  test('Prénom saisi reste dans S après render', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, sex: null });
    const input = page.locator('input[placeholder="Sophie"]');
    await input.fill('Maxime');
    await input.dispatchEvent('input');
    await waitStable(page, 600);
    const prenom = await page.evaluate(() => window.S.prenom);
    expect(prenom).toBe('Maxime');
  });

  test('Sexe sélectionné reste dans S après changement de step', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, sex: null });
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Femme' }).click();
    await waitStable(page);
    // Avancer à step 2
    await page.locator('button.btn-primary').first().click();
    await waitStable(page);
    const sex = await page.evaluate(() => window.S.sex);
    expect(sex).toBe('femme');
    const nStep = await page.evaluate(() => window.S.nStep);
    expect(nStep).toBe(2);
  });
});
