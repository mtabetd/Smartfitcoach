/**
 * Helpers partagés — bypass gate + utilitaires communs
 */
const GATE_HASH = '1gs8uk7';
const GATE_KEY  = 'mtd_gate_access';

/**
 * Charge la page en bypassant le gate beta (injection sessionStorage avant JS)
 * et attend que l'écran auth soit visible.
 */
async function gotoApp(page, path = '/') {
  // Injecter le token avant tout script de page
  await page.addInitScript(({ key, hash }) => {
    sessionStorage.setItem(key, hash);
  }, { key: GATE_KEY, hash: GATE_HASH });

  await page.goto(path);
  // Attendre que le gate soit passé (#app visible)
  await page.waitForSelector('#app', { state: 'visible', timeout: 10000 });
  // Attendre que _doAutoLogin() ait rendu le formulaire auth (évite race avec AUTH.ready())
  await page.waitForSelector('.auth-container', { state: 'visible', timeout: 15000 });
}

/**
 * Attend que le rendu SPA soit stabilisé (pas de changement DOM pendant 300ms)
 */
async function waitStable(page, ms = 400) {
  await page.waitForTimeout(ms);
}

/**
 * Nettoie tout le localStorage/sessionStorage (état frais entre tests)
 */
async function clearState(page) {
  await page.evaluate(() => {
    try { localStorage.clear(); } catch(e) {}
    try { sessionStorage.clear(); } catch(e) {}
  });
}

module.exports = { gotoApp, waitStable, clearState, GATE_HASH, GATE_KEY };
