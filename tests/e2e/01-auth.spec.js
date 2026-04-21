const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

// Sélecteurs scopés à .auth-form/.auth-container — évite les collisions avec #gate-pre-email
const SEL = {
  email:        '.auth-form input[type="email"]',
  pw:           '.auth-form input[type="password"]',
  error:        '.auth-error',
  switchLink:   '.auth-switch a',
  forgotLink:   '.auth-form a',
};

function btnPrimary(page, text) {
  return page.locator('button.btn-primary').filter({ hasText: new RegExp(text, 'i') }).first();
}

async function waitForRender(page) {
  await page.waitForFunction(() => typeof window.render === 'function' && window.S != null, { timeout: 10000 });
}

async function mockAuth(page, method, result) {
  await page.evaluate(({ m, r }) => {
    if (window.AUTH) window.AUTH[m] = () => Promise.resolve(r);
  }, { m: method, r: result });
}

// ─── CONNEXION ────────────────────────────────────────────────────────────────

test.describe('Auth — connexion', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await waitStable(page);
  });

  test('Formulaire de connexion charge', async ({ page }) => {
    await expect(page.locator('.auth-container')).toBeVisible();
    await expect(page.locator(SEL.email)).toBeVisible();
    await expect(page.locator(SEL.pw)).toBeVisible();
    await expect(btnPrimary(page, 'se connecter')).toBeVisible();
  });

  test('Lien "Mot de passe oublié ?" visible', async ({ page }) => {
    await expect(page.locator(SEL.forgotLink).filter({ hasText: /oubli/i })).toBeVisible();
  });

  test('Lien "Créer un compte" visible', async ({ page }) => {
    await expect(page.locator(SEL.switchLink).filter({ hasText: /cr[eé]er/i })).toBeVisible();
  });

  test('Email vide → erreur (mock)', async ({ page }) => {
    await mockAuth(page, 'login', { ok: false, error: 'Email invalide' });
    await btnPrimary(page, 'se connecter').click();
    await page.waitForTimeout(600);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 5000 });
  });

  test('Email invalide → erreur (mock)', async ({ page }) => {
    await mockAuth(page, 'login', { ok: false, error: 'Email invalide' });
    await page.locator(SEL.email).fill('pas-un-email');
    await page.locator(SEL.pw).fill('monmdp');
    await btnPrimary(page, 'se connecter').click();
    await page.waitForTimeout(600);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 5000 });
  });

  test('Mauvais identifiants → erreur (mock)', async ({ page }) => {
    await mockAuth(page, 'login', { ok: false, error: 'Email ou mot de passe incorrect' });
    await page.locator(SEL.email).fill('faux@exemple.com');
    await page.locator(SEL.pw).fill('mauvaismdp');
    await btnPrimary(page, 'se connecter').click();
    await page.waitForTimeout(600);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SEL.error)).toContainText(/incorrect/i);
  });

  test('Succès login (mock) → quitte l\'écran de connexion', async ({ page }) => {
    await page.evaluate(() => {
      if (!window.AUTH || !window.S || !window.render) return;
      window.AUTH.login = () => {
        window.S.view = 'nutrition'; // simuler navigation post-login
        window.S.authError = '';
        window.AUTH.isLoggedIn = () => true;
        window.AUTH.getUser = () => ({ id: 'x', name: 'Test', email: 't@t.com' });
        try { window.render(); } catch(e) {}
        return Promise.resolve({ ok: true, user: { id: 'x', name: 'Test', email: 't@t.com' } });
      };
    });
    await page.locator(SEL.email).fill('test@exemple.com');
    await page.locator(SEL.pw).fill('Motdepasse1!');
    await btnPrimary(page, 'se connecter').click();
    await page.waitForTimeout(800);
    const stillLogin = await btnPrimary(page, 'se connecter').isVisible().catch(() => false);
    expect(stillLogin).toBe(false);
  });
});

// ─── INSCRIPTION ──────────────────────────────────────────────────────────────

test.describe('Auth — inscription', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await waitStable(page);
    // Naviguer vers le formulaire d'inscription
    await page.locator(SEL.switchLink).filter({ hasText: /cr[eé]er/i }).click();
    await waitStable(page);
  });

  test('Tous les champs présents', async ({ page }) => {
    await expect(page.locator('input[placeholder="Prénom"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Nom de famille"]')).toBeVisible();
    await expect(page.locator(SEL.email)).toBeVisible();
    await expect(page.locator(SEL.pw).nth(0)).toBeVisible();
    await expect(page.locator('#rgpd-consent')).toBeVisible();
    await expect(btnPrimary(page, 'inscrire')).toBeVisible();
  });

  test('Champs vides → erreur obligatoires', async ({ page }) => {
    await btnPrimary(page, 'inscrire').click();
    await page.waitForTimeout(600);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SEL.error)).toContainText(/obligatoire/i);
  });

  test('Mot de passe < 6 chars → erreur longueur', async ({ page }) => {
    await page.locator('input[placeholder="Prénom"]').fill('Alice');
    await page.locator('input[placeholder="Nom de famille"]').fill('Dupont');
    await page.locator(SEL.email).fill('alice@test.com');
    await page.locator(SEL.pw).nth(0).fill('abc');
    await page.locator(SEL.pw).nth(1).fill('abc');
    await page.locator('#rgpd-consent').check();
    await btnPrimary(page, 'inscrire').click();
    await page.waitForTimeout(600);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SEL.error)).toContainText(/6/);
  });

  test('Mots de passe différents → erreur', async ({ page }) => {
    await page.locator('input[placeholder="Prénom"]').fill('Bob');
    await page.locator('input[placeholder="Nom de famille"]').fill('Martin');
    await page.locator(SEL.email).fill('bob@test.com');
    await page.locator(SEL.pw).nth(0).fill('Motdepasse1!');
    await page.locator(SEL.pw).nth(1).fill('Motdepasse2!');
    await page.locator('#rgpd-consent').check();
    await btnPrimary(page, 'inscrire').click();
    await page.waitForTimeout(600);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 5000 });
  });

  test('RGPD non cochée → erreur consentement', async ({ page }) => {
    await page.locator('input[placeholder="Prénom"]').fill('Alice');
    await page.locator('input[placeholder="Nom de famille"]').fill('Dupont');
    await page.locator(SEL.email).fill('alice@test.com');
    await page.locator(SEL.pw).nth(0).fill('Motdepasse1!');
    await page.locator(SEL.pw).nth(1).fill('Motdepasse1!');
    // Ne pas cocher RGPD
    await btnPrimary(page, 'inscrire').click();
    await page.waitForTimeout(600);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SEL.error)).toContainText(/confidentialit|politique/i);
  });

  test('Succès inscription (mock) → écran vérification email', async ({ page }) => {
    await mockAuth(page, 'register', { ok: true, user: { id: 'uid2', name: 'Alice', email: 'alice@test.com' }, needsConfirmation: true });
    await page.locator('input[placeholder="Prénom"]').fill('Alice');
    await page.locator('input[placeholder="Nom de famille"]').fill('Dupont');
    await page.locator(SEL.email).fill('alice@test.com');
    await page.locator(SEL.pw).nth(0).fill('Motdepasse1!');
    await page.locator(SEL.pw).nth(1).fill('Motdepasse1!');
    await page.locator('#rgpd-consent').check();
    await btnPrimary(page, 'inscrire').click();
    await waitStable(page, 800);
    await expect(page.locator('text=alice@test.com')).toBeVisible({ timeout: 6000 });
  });

  test('Retour connexion depuis inscription', async ({ page }) => {
    await page.locator(SEL.switchLink).filter({ hasText: /connexion/i }).click();
    await waitStable(page);
    await expect(btnPrimary(page, 'se connecter')).toBeVisible({ timeout: 3000 });
  });
});

// ─── MOT DE PASSE OUBLIÉ ──────────────────────────────────────────────────────

test.describe('Auth — mot de passe oublié', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await waitStable(page);
    await page.locator(SEL.forgotLink).filter({ hasText: /oubli/i }).click();
    await waitStable(page);
  });

  test('Champ email visible', async ({ page }) => {
    await expect(page.locator(SEL.email)).toBeVisible({ timeout: 3000 });
  });

  test('Email vide → reste sur écran reset', async ({ page }) => {
    await page.locator('.auth-form button.btn-primary').first().click();
    await waitStable(page);
    await expect(page.locator(SEL.email)).toBeVisible({ timeout: 3000 });
  });

  test('Email invalide → erreur', async ({ page }) => {
    await page.locator(SEL.email).fill('pas-un-email');
    await page.locator('.auth-form button.btn-primary').first().click();
    await waitStable(page);
    await expect(page.locator(SEL.error)).toBeVisible({ timeout: 3000 });
  });

  test('Retour connexion', async ({ page }) => {
    await page.locator('.auth-container a, .auth-switch a').filter({ hasText: /retour|connexion/i }).first().click();
    await waitStable(page);
    await expect(btnPrimary(page, 'se connecter')).toBeVisible({ timeout: 3000 });
  });
});

// ─── ÉCRAN VÉRIFICATION EMAIL ─────────────────────────────────────────────────

test.describe('Auth — écran vérification email', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForRender(page);
    await page.evaluate(() => {
      window.S.view = 'authVerify';
      window.S.authVerifyEmail = 'alice@test.com';
      window.render();
    });
    await waitStable(page, 800);
  });

  test('Email affiché', async ({ page }) => {
    await expect(page.locator('text=alice@test.com')).toBeVisible({ timeout: 5000 });
  });

  test('Bouton "J\'ai confirmé" visible et enabled', async ({ page }) => {
    // Le bouton a J’ai (curly apostrophe) — on cherche juste "confirm" dans le texte
    const btn = page.locator('button').filter({ hasText: /confirm/i }).first();
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toBeEnabled();
  });

  test('Bouton "Renvoyer" visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /renvoyer/i })).toBeVisible({ timeout: 5000 });
  });

  test('Clic "J\'ai confirmé" → feedback visible (pas muet)', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /confirm/i }).first();
    await btn.click();
    // Doit afficher un message dans les 12s (Vérification... ou erreur ou "pas encore confirmé")
    const status = page.locator('#app').getByText(/v[eé]rification|confirm[eé]|pas encore|erreur|lente/i).first();
    await expect(status).toBeVisible({ timeout: 12000 });
  });

  test('Lien retour connexion fonctionne', async ({ page }) => {
    // Utiliser evaluate pour trouver et cliquer le lien retour (évite strict mode)
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.auth-switch a'));
      const retourLink = links.find(a => /retour/i.test(a.textContent));
      if (retourLink) retourLink.click();
    });
    await waitStable(page);
    await expect(btnPrimary(page, 'se connecter')).toBeVisible({ timeout: 3000 });
  });
});
