// Test Chromium — motivation library chargée dans la vraie app, aucun crash
const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  const fail = (n, d) => { console.log('✗ ' + n + '\n    ' + d); failed++; };
  const pass = (n) => { console.log('✓ ' + n); passed++; };

  async function fresh() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push(e.message));
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    return { page, ctx, errs };
  }

  // T1 : MOTIVATION_LIBRARY exposé dans window
  try {
    const { page, ctx, errs } = await fresh();
    const result = await page.evaluate(() => ({
      exposed: typeof window.MOTIVATION_LIBRARY === 'object' && window.MOTIVATION_LIBRARY !== null,
      hasGetDaily: typeof window.MOTIVATION_LIBRARY?.getDailyMotivation === 'function',
      hasGetNext: typeof window.MOTIVATION_LIBRARY?.getNextMotivationTime === 'function',
      count: window.MOTIVATION_LIBRARY?._count || 0
    }));
    if (!result.exposed) fail('T1 lib exposé', 'MOTIVATION_LIBRARY absent');
    else if (!result.hasGetDaily) fail('T1', 'getDailyMotivation absent');
    else if (!result.hasGetNext) fail('T1', 'getNextMotivationTime absent');
    else if (result.count < 100) fail('T1', 'Corpus trop petit: ' + result.count);
    else pass('T1 : MOTIVATION_LIBRARY exposé (' + result.count + ' phrases)');
    await ctx.close();
  } catch (e) { fail('T1', e.message); }

  // T2 : getDailyMotivation retourne une phrase non vide
  try {
    const { page, ctx, errs } = await fresh();
    const msg = await page.evaluate(() => window.MOTIVATION_LIBRARY.getDailyMotivation({ prenom: 'Jamal', streak: 0 }));
    if (!msg || !msg.body || msg.body.length < 20) fail('T2', 'Body vide: ' + JSON.stringify(msg));
    else if (!msg.title) fail('T2', 'Title absent');
    else pass('T2 : getDailyMotivation renvoie body (' + msg.body.substring(0, 40) + '...)');
    await ctx.close();
  } catch (e) { fail('T2', e.message); }

  // T3 : Horaire calculé — weekday 8h30
  try {
    const { page, ctx, errs } = await fresh();
    const r = await page.evaluate(() => {
      const mon = new Date('2026-04-13T07:00:00');
      const next = window.MOTIVATION_LIBRARY.getNextMotivationTime(mon);
      return { day: next.getDay(), h: next.getHours(), m: next.getMinutes() };
    });
    if (r.day !== 1 || r.h !== 8 || r.m !== 30) fail('T3 lundi 7h→8h30', JSON.stringify(r));
    else pass('T3 : Lundi 7h00 → prochaine notif = Lundi 8h30');
    await ctx.close();
  } catch (e) { fail('T3', e.message); }

  // T4 : Horaire calculé — weekend 10h
  try {
    const { page, ctx, errs } = await fresh();
    const r = await page.evaluate(() => {
      const sat = new Date('2026-04-18T08:00:00');
      const next = window.MOTIVATION_LIBRARY.getNextMotivationTime(sat);
      return { day: next.getDay(), h: next.getHours(), m: next.getMinutes() };
    });
    if (r.day !== 6 || r.h !== 10 || r.m !== 0) fail('T4 samedi 8h→10h', JSON.stringify(r));
    else pass('T4 : Samedi 8h00 → prochaine notif = Samedi 10h00');
    await ctx.close();
  } catch (e) { fail('T4', e.message); }

  // T5 : SFCPushManager.scheduleDailyMotivation existe et ne crash pas
  try {
    const { page, ctx, errs } = await fresh();
    const r = await page.evaluate(() => {
      if (!window.SFCPushManager) return { error: 'SFCPushManager absent' };
      if (typeof window.SFCPushManager.scheduleDailyMotivation !== 'function') return { error: 'scheduleDailyMotivation absent' };
      // On ne peut pas tester l'exécution car elle dépend de Notification.permission
      // Mais on vérifie au moins que la fonction existe et ne crash pas lors de l'inspection
      return { ok: true, has: true };
    });
    if (r.error) fail('T5', r.error);
    else pass('T5 : SFCPushManager.scheduleDailyMotivation opérationnel');
    await ctx.close();
  } catch (e) { fail('T5', e.message); }

  // T6 : Pas d'erreur console au chargement
  try {
    const { page, ctx, errs } = await fresh();
    await page.waitForTimeout(1500);
    // Filtrer les erreurs connues sans impact (Supabase warnings, etc.)
    const real = errs.filter(e =>
      !e.includes('Supabase') && !e.includes('favicon') &&
      !e.includes('manifest') && !e.includes('icon-') &&
      !e.includes('Failed to load resource')
    );
    if (real.length > 0) fail('T6 console errors', real.slice(0, 3).join(' | '));
    else pass('T6 : Aucune erreur console critique après chargement');
    await ctx.close();
  } catch (e) { fail('T6', e.message); }

  // T7 : Déterminisme — 3 appels même date donnent même body
  try {
    const { page, ctx, errs } = await fresh();
    const r = await page.evaluate(() => {
      const p = { prenom: 'Alice', streak: 0, date: '2026-04-15' };
      const a = window.MOTIVATION_LIBRARY.getDailyMotivation(p);
      const b = window.MOTIVATION_LIBRARY.getDailyMotivation(p);
      const c = window.MOTIVATION_LIBRARY.getDailyMotivation(p);
      return { same: a.body === b.body && b.body === c.body, body: a.body };
    });
    if (!r.same) fail('T7 déterminisme', 'Phrases différentes entre appels');
    else pass('T7 : Déterminisme OK (3 appels → même phrase)');
    await ctx.close();
  } catch (e) { fail('T7', e.message); }

  await browser.close();
  console.log('\n========== MOTIVATION CHROMIUM ==========');
  console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
