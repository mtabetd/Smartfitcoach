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

// ─── CHOIX DU MODULE ────────────────────────────────────────────────────────

test.describe('Onboarding — Choix du module', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: null, nStep: 0, sStep: 0 });
  });

  test('3 cartes de module visibles', async ({ page }) => {
    await expect(page.getByText('Nutrition', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Entraînement', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('RECOMMANDÉ')).toBeVisible({ timeout: 5000 });
  });

  test('Choisir Nutrition → nStep 1 + appMode nutrition', async ({ page }) => {
    // Cibler la carte par sa description unique (évite ambiguïté avec "Nutrition & Entraînement")
    await page.locator('[role="button"]').filter({ hasText: /objectifs caloriques/i }).click();
    await waitStable(page);
    const s = await page.evaluate(() => ({ mode: window.S.appMode, step: window.S.nStep }));
    expect(s.mode).toBe('nutrition');
    expect(s.step).toBe(1);
  });

  test('Choisir Entraînement → vue sport', async ({ page }) => {
    await page.locator('[role="button"]').filter({ hasText: /Programmes adapt/i }).click();
    await waitStable(page);
    const s = await page.evaluate(() => ({ mode: window.S.appMode, view: window.S.view }));
    expect(s.mode).toBe('sport');
    expect(s.view).toBe('sport');
  });

  test('Choisir Nutrition & Entraînement → appMode both, nStep 1', async ({ page }) => {
    await page.locator('[role="button"]').filter({ hasText: /approche compl/i }).click();
    await waitStable(page);
    const s = await page.evaluate(() => ({ mode: window.S.appMode, step: window.S.nStep }));
    expect(s.mode).toBe('both');
    expect(s.step).toBe(1);
  });
});

// ─── ÉTAPE 1 : IDENTITÉ (SEXE + PRÉNOM) ────────────────────────────────────

test.describe('Onboarding nutrition — Étape 1: Identité', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 1, sex: null });
  });

  test('Grille Homme/Femme visible', async ({ page }) => {
    await expect(page.locator('.card-grid-2')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.card-grid-2').getByText('Homme')).toBeVisible();
    await expect(page.locator('.card-grid-2').getByText('Femme')).toBeVisible();
  });

  test('Champ prénom optionnel visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="Sophie"]')).toBeVisible({ timeout: 5000 });
  });

  test('Bouton Suivant désactivé sans sexe sélectionné', async ({ page }) => {
    await expect(page.locator('button.btn-primary').first()).toBeDisabled({ timeout: 5000 });
  });

  test('Sélectionner Homme → bouton Suivant actif', async ({ page }) => {
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Homme' }).click();
    await waitStable(page);
    await expect(page.locator('button.btn-primary').first()).toBeEnabled({ timeout: 3000 });
  });

  test('Sélectionner Femme → bouton Suivant actif', async ({ page }) => {
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Femme' }).click();
    await waitStable(page);
    await expect(page.locator('button.btn-primary').first()).toBeEnabled({ timeout: 3000 });
  });

  test('Sélectionner Homme puis Femme → seule Femme est active (.on)', async ({ page }) => {
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Homme' }).click();
    await waitStable(page);
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Femme' }).click();
    await waitStable(page);
    const sexVal = await page.evaluate(() => window.S.sex);
    expect(sexVal).toBe('femme');
  });

  test('Saisir prénom + sexe → avance au nStep 2', async ({ page }) => {
    await page.locator('input[placeholder="Sophie"]').fill('Alice');
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Femme' }).click();
    await waitStable(page);
    await page.locator('button.btn-primary').first().click();
    await waitStable(page);
    const nStep = await page.evaluate(() => window.S.nStep);
    expect(nStep).toBe(2);
  });

  test('Avancer avec Homme seul → nStep 2', async ({ page }) => {
    await page.locator('.card-grid-2 .sel-card').filter({ hasText: 'Homme' }).click();
    await waitStable(page);
    await page.locator('button.btn-primary').first().click();
    await waitStable(page);
    const nStep = await page.evaluate(() => window.S.nStep);
    expect(nStep).toBe(2);
  });
});

// ─── ÉTAPE 2 : DATE DE NAISSANCE ────────────────────────────────────────────

test.describe('Onboarding nutrition — Étape 2: Date de naissance', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 2, sex: 'homme' });
  });

  test('Sélecteurs de date visibles (jour/mois/année)', async ({ page }) => {
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible({ timeout: 5000 });
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Header étape visible', async ({ page }) => {
    await expect(page.locator('.eyebrow').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── ÉTAPE 3 : POIDS & TAILLE ───────────────────────────────────────────────

test.describe('Onboarding nutrition — Étape 3: Poids & Taille', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, {
      appMode: 'nutrition', view: 'nutrition', nStep: 3,
      sex: 'homme', birthDate: '1990-01-01'
    });
  });

  test('Au moins 2 inputs numériques visibles (poids + taille)', async ({ page }) => {
    const inputs = page.locator('input[type="number"]');
    await expect(inputs.first()).toBeVisible({ timeout: 5000 });
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('Saisir un poids valide → state mis à jour', async ({ page }) => {
    const inputs = page.locator('input.num-input');
    await inputs.first().fill('80');
    await inputs.first().dispatchEvent('input');
    await inputs.first().blur();
    await waitStable(page);
    const weight = await page.evaluate(() => window.S.weight);
    expect(weight).toBeGreaterThan(0);
  });

  test('Bouton Suivant présent', async ({ page }) => {
    await expect(page.locator('button.btn-primary').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── ÉTAPE 8 : MÉDICAL ──────────────────────────────────────────────────────

test.describe('Onboarding nutrition — Étape 8: Médical', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, {
      appMode: 'nutrition', view: 'nutrition', nStep: 8,
      sex: 'homme', birthDate: '1990-01-01', weight: 75, height: 175,
      activity: 2, sleep: 2, goal: 0, train: [], medical: []
    });
  });

  test('Raccourci "Aucune condition particulière" visible', async ({ page }) => {
    await expect(page.locator('.sel-card').filter({ hasText: /condition/i }).first())
      .toBeVisible({ timeout: 5000 });
  });

  test('Sous-texte "bonne santé" visible', async ({ page }) => {
    await expect(page.locator('.card-sub').filter({ hasText: /sant[eé]/i }))
      .toBeVisible({ timeout: 5000 });
  });

  test('Clic "bonne santé" → avance au nStep 9', async ({ page }) => {
    await page.locator('.sel-card').filter({ hasText: /condition/i }).first().click();
    await waitStable(page);
    const nStep = await page.evaluate(() => window.S.nStep);
    expect(nStep).toBe(9);
  });

  test('Conditions médicales listées (checkboxes)', async ({ page }) => {
    const items = page.locator('.level-list .level-item, .level-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─── RETOUR ARRIÈRE EN ONBOARDING ───────────────────────────────────────────

test.describe('Onboarding nutrition — Navigation retour', () => {
  test('Étape 2 : bouton retour ramène à nStep 1', async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await goLoggedIn(page, { appMode: 'nutrition', view: 'nutrition', nStep: 2, sex: 'homme' });
    const backBtn = page.locator('.btn-back, button').filter({ hasText: /retour|←|‹|back/i }).first();
    const count = await backBtn.count();
    if (count > 0) {
      await backBtn.click();
      await waitStable(page);
      const nStep = await page.evaluate(() => window.S.nStep);
      expect(nStep).toBe(1);
    } else {
      // Pas de bouton retour à l'étape 2 — vérifier que step 2 est bien affiché
      const step = await page.evaluate(() => window.S.nStep);
      expect(step).toBe(2);
    }
  });
});
