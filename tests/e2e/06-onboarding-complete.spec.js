const { test, expect } = require('@playwright/test');
const { gotoApp, waitStable, clearState } = require('./helpers');

async function waitForApp(page) {
  await page.waitForFunction(
    () => typeof window.render === 'function'
       && window.S != null
       && window.OnboardingComplete != null,
    { timeout: 12000 }
  );
}

// Profil complet minimal (goal + weekPlan non vide)
async function goLoggedIn(page, extra = {}) {
  await page.evaluate((s) => {
    window.AUTH.isLoggedIn = () => true;
    window.AUTH.getUser = () => ({ id: 'uid-test', name: 'Marie Test', email: 't@t.com' });
    Object.assign(window.S, {
      prenom: 'Marie',
      goal: 2,
      weekPlan: [{ n: 'Poulet', k: 500, p: 40, g: 30, l: 15 }],
      sportProgram: [],
      welcomeShown: true,
    }, s);
    window.render();
  }, extra);
  await waitStable(page, 500);
}

test.describe('OnboardingComplete — overlay de bienvenue', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await gotoApp(page);
    await waitForApp(page);
  });

  test('s\'affiche avec un profil complet (goal + weekPlan)', async ({ page }) => {
    await goLoggedIn(page);
    await page.evaluate(() => {
      localStorage.removeItem('mtd_onboarding_done');
      window.OnboardingComplete.check();
    });
    await waitStable(page, 600);
    await expect(page.locator('#onboarding-complete-overlay')).toBeVisible({ timeout: 5000 });
  });

  test('ne s\'affiche pas si déjà vu (localStorage flag)', async ({ page }) => {
    await goLoggedIn(page);
    await page.evaluate(() => {
      localStorage.setItem('mtd_onboarding_done', 'true');
      window.OnboardingComplete.check();
    });
    await waitStable(page, 500);
    await expect(page.locator('#onboarding-complete-overlay')).toHaveCount(0);
  });

  test('race guard — 5 appels simultanés = 1 seul overlay', async ({ page }) => {
    await goLoggedIn(page);
    await page.evaluate(() => {
      localStorage.removeItem('mtd_onboarding_done');
      for (var i = 0; i < 5; i++) window.OnboardingComplete.check();
    });
    await waitStable(page, 600);
    await expect(page.locator('#onboarding-complete-overlay')).toHaveCount(1);
  });

  test('bouton CTA ferme l\'overlay et pose le flag done', async ({ page }) => {
    await goLoggedIn(page);
    await page.evaluate(() => {
      localStorage.removeItem('mtd_onboarding_done');
      window.OnboardingComplete.check();
    });
    await page.locator('#onboarding-complete-overlay button').click();
    await waitStable(page, 700);

    await expect(page.locator('#onboarding-complete-overlay')).toHaveCount(0);
    const done = await page.evaluate(() => localStorage.getItem('mtd_onboarding_done'));
    expect(done).toBe('true');
  });

  test('ne s\'affiche plus après le CTA même en rappelant check()', async ({ page }) => {
    await goLoggedIn(page);
    await page.evaluate(() => {
      localStorage.removeItem('mtd_onboarding_done');
      window.OnboardingComplete.check();
    });
    await page.locator('#onboarding-complete-overlay button').click();
    await waitStable(page, 700);

    // Rappeler check() — ne doit pas recréer l'overlay
    await page.evaluate(() => window.OnboardingComplete.check());
    await waitStable(page, 500);
    await expect(page.locator('#onboarding-complete-overlay')).toHaveCount(0);
  });

  test('ne s\'affiche pas si weekPlan et sportProgram sont vides', async ({ page }) => {
    await goLoggedIn(page, { weekPlan: [], sportProgram: [] });
    await page.evaluate(() => {
      localStorage.removeItem('mtd_onboarding_done');
      window.OnboardingComplete.check();
    });
    await waitStable(page, 500);
    await expect(page.locator('#onboarding-complete-overlay')).toHaveCount(0);
  });

  test('affiche le prénom dans le message de bienvenue', async ({ page }) => {
    await goLoggedIn(page, { prenom: 'Sophie' });
    await page.evaluate(() => {
      localStorage.removeItem('mtd_onboarding_done');
      window.OnboardingComplete.check();
    });
    await waitStable(page, 600);
    await expect(page.locator('#onboarding-complete-overlay')).toContainText('Sophie', { timeout: 5000 });
  });

  test('mode sport-only : s\'affiche avec sportProgram non vide (sans goal)', async ({ page }) => {
    await goLoggedIn(page, {
      appMode: 'sport',
      sportType: 'musculation',
      goal: undefined,
      weekPlan: [],
      sportProgram: [{ day: 1, exercises: ['Squat'] }],
    });
    await page.evaluate(() => {
      localStorage.removeItem('mtd_onboarding_done');
      window.OnboardingComplete.check();
    });
    await waitStable(page, 600);
    await expect(page.locator('#onboarding-complete-overlay')).toBeVisible({ timeout: 5000 });
  });

  test('ne s\'affiche pas si non authentifié', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.AUTH.isLoggedIn;
      window.AUTH.isLoggedIn = () => false;
      localStorage.removeItem('mtd_onboarding_done');
      window.OnboardingComplete.check();
      window.AUTH.isLoggedIn = orig;
    });
    await waitStable(page, 500);
    await expect(page.locator('#onboarding-complete-overlay')).toHaveCount(0);
  });
});
