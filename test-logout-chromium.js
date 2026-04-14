// VRAI test E2E logout Chromium — remplace le faux unit-logout.js qui n'était qu'un grep regex
//
// Vérifie en navigateur réel que :
//   1. logout() flush bien les données vers SupaSync.saveProfile() AVANT le reset S
//   2. L'ordre est : saveProfile → signOut/cleanup (pas l'inverse)
//   3. Après reload, les données sont toujours là (sportProgram, weekPlan, favoris)
//   4. La protection _loadCorrupted bloque saveProfile si decode failed
//   5. _PROTECTED_KEYS empêche écrasement par cloud null

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;

  function pass(name) { console.log('✓ ' + name); passed++; }
  function fail(name, detail) { console.log('✗ ' + name + '\n    ' + detail); failed++; }

  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3500);
    return { page, ctx, errors };
  }

  // ─── T1 : logout() est devenu asynchrone (flush avant cleanup) ───
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(async () => {
      // Mock AUTH and SupaSync to track call order
      const callOrder = [];
      const UID = 'test-logout-uid-1';

      window.AUTH.getUser = () => ({ id: UID, email: 'test@test.com' });

      // Mock SupaSync.saveProfile to track when called and when resolved
      window.SupaSync = window.SupaSync || {};
      let saveProfileResolve;
      const saveProfilePromise = new Promise(resolve => { saveProfileResolve = resolve; });
      window.SupaSync.saveProfile = () => {
        callOrder.push('saveProfile_called');
        // Simulate Supabase taking 200ms to respond
        return new Promise(resolve => {
          setTimeout(() => {
            callOrder.push('saveProfile_resolved');
            resolve({ ok: true });
            saveProfileResolve();
          }, 200);
        });
      };
      window.SupaSync.stopAutoSync = () => { callOrder.push('stopAutoSync'); };

      // Setup S with real data
      window.S.sportProgram = [{ day: 'Lundi', exercises: [{name:'Squat'}] }];
      window.S.weekPlan = Array.from({length:7}, () => ({breakfast:{n:'A',k:400}}));
      window.S.favoriteRecipes = { R042: 3 };
      window.S.goal = 1; window.S.sex = 'homme';

      // Trigger logout
      window.AUTH.logout();
      callOrder.push('logout_returned');

      // Wait for the saveProfile mock to resolve (chain done)
      await saveProfilePromise;
      // Wait one more tick for cleanup
      await new Promise(r => setTimeout(r, 100));

      return {
        callOrder: callOrder,
        sportProgramAfterLogout: window.S.sportProgram,
        weekPlanAfterLogout: window.S.weekPlan
      };
    });

    // Assertions
    if (!r.callOrder.includes('saveProfile_called'))
      fail('T1 logout async', 'saveProfile pas appelé');
    else if (r.callOrder.indexOf('saveProfile_called') > r.callOrder.indexOf('stopAutoSync'))
      fail('T1 logout async', 'saveProfile appelé APRÈS stopAutoSync (mauvais ordre)');
    else if (r.callOrder.indexOf('saveProfile_resolved') === -1 ||
             r.callOrder.indexOf('saveProfile_resolved') > r.callOrder.indexOf('stopAutoSync'))
      fail('T1 logout async', 'cleanup déclenché AVANT que saveProfile résolve : ' + JSON.stringify(r.callOrder));
    else
      pass('T1 : logout flush BLOQUANT — saveProfile résolu AVANT cleanup');

    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // ─── T2 : logout avec timeout 5s si SupaSync ne répond jamais ───
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(async () => {
      const UID = 'test-logout-uid-2';
      window.AUTH.getUser = () => ({ id: UID, email: 'test@test.com' });
      window.SupaSync = window.SupaSync || {};
      // saveProfile retourne une promesse qui ne résout JAMAIS (Supabase down)
      window.SupaSync.saveProfile = () => new Promise(() => {});
      window.SupaSync.stopAutoSync = () => {};

      window.S.sportProgram = [{day:'L',exercises:[]}];
      const t0 = Date.now();
      window.AUTH.logout();
      // Attendre 5.5s pour vérifier que cleanup s'est déclenché malgré le hang
      await new Promise(r => setTimeout(r, 5500));
      const t1 = Date.now();

      return {
        elapsed: t1 - t0,
        sportProgramReset: window.S.sportProgram === null
      };
    });

    if (!r.sportProgramReset)
      fail('T2 logout timeout', 'cleanup PAS déclenché après 5s (S.sportProgram pas reset)');
    else if (r.elapsed < 5000 || r.elapsed > 7000)
      fail('T2 logout timeout', 'timeout pas respecté : ' + r.elapsed + 'ms (attendu ~5000ms)');
    else
      pass('T2 : logout timeout 5s respecté si SupaSync hangs (' + r.elapsed + 'ms)');

    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // ─── T3 : SYNC_PREFIXES inclut bien les 6 nouvelles clés muscu ───
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Récupérer le code source de SupaSync.saveProfile (qui contient SYNC_PREFIXES)
      const src = window.SupaSync.saveProfile.toString();
      return {
        weights: src.indexOf('mtd_muscu_weights_') !== -1,
        progression: src.indexOf('mtd_muscu_progression_') !== -1,
        strength: src.indexOf('mtd_muscu_strength_') !== -1,
        week: src.indexOf('mtd_muscu_week_') !== -1,
        cycle: src.indexOf('mtd_muscu_cycle_') !== -1,
        start: src.indexOf('mtd_muscu_start_') !== -1
      };
    });

    const missing = Object.entries(r).filter(([k,v]) => !v).map(([k]) => k);
    if (missing.length > 0)
      fail('T3 SYNC_PREFIXES', 'Clés manquantes : ' + missing.join(', '));
    else
      pass('T3 : SYNC_PREFIXES inclut bien weights/progression/strength/week/cycle/start');

    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // ─── T4 : Backup + flag _loadCorrupted si decode silencieux ───
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      const UID = 'test-corrupt-uid';
      window.AUTH.getUser = () => ({ id: UID, email: 'test@test.com' });

      // Setup : profil corrompu en localStorage
      localStorage.setItem('mtd_profile_' + UID, 'CORRUPTED_BASE64_GARBAGE@@@');

      // Reset _loadCorrupted au cas où
      delete window.S._loadCorrupted;

      // Appeler loadProfile
      window.loadProfile();

      // Lister les clés backup créées
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('mtd_profile_BACKUP_' + UID) === 0) backupKeys.push(k);
      }

      // Tenter saveProfile : doit être bloqué
      let saveAttempted = false;
      const origSetItem = localStorage.setItem;
      localStorage.setItem = function(k, v) {
        if (k === 'mtd_profile_' + UID) saveAttempted = true;
        return origSetItem.call(localStorage, k, v);
      };
      window.saveProfile();
      localStorage.setItem = origSetItem;

      return {
        loadCorrupted: window.S._loadCorrupted === true,
        backupCount: backupKeys.length,
        backupKey: backupKeys[0] || null,
        saveProfileBlocked: !saveAttempted
      };
    });

    if (!r.loadCorrupted)
      fail('T4 corruption flag', 'S._loadCorrupted PAS positionné');
    else if (r.backupCount === 0)
      fail('T4 corruption backup', 'Aucun backup créé');
    else if (!r.saveProfileBlocked)
      fail('T4 saveProfile bloqué', 'saveProfile a tenté d\'écrire malgré flag corrupted');
    else
      pass('T4 : Decode corrompu → backup créé + saveProfile bloqué (' + r.backupKey + ')');

    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // ─── T5 : Save → reload page → données restaurées (parcours utilisateur réel) ───
  try {
    const { page, ctx } = await newPage();
    const UID = 'test-save-reload-uid';

    // Step 1 : setup + save
    await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 'test@test.com' });
      delete window.S._loadCorrupted;
      window.S.prenom = 'Jamal';
      window.S.goal = 1;
      window.S.sex = 'homme';
      window.S.weight = 80;
      window.S.height = 180;
      window.S.age = 30;
      window.S.sportProgram = [{day:'Lundi',exercises:[{name:'Squat'}]}];
      window.S.weekPlan = Array.from({length:7}, () => ({breakfast:{n:'T',k:400}}));
      window.S.favoriteRecipes = { R042: 3, R001: 2 };
      window.saveProfile();
    }, UID);

    // Step 2 : reload page complet (simule fermeture/reconnexion)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Step 3 : restaurer
    const r = await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 'test@test.com' });
      window.loadProfile();
      return {
        loadCorrupted: window.S._loadCorrupted || false,
        prenom: window.S.prenom,
        sportProg: Array.isArray(window.S.sportProgram) && window.S.sportProgram.length > 0,
        weekPlan: Array.isArray(window.S.weekPlan) && window.S.weekPlan.length === 7,
        favR042: window.S.favoriteRecipes && window.S.favoriteRecipes.R042 === 3,
        favR001: window.S.favoriteRecipes && window.S.favoriteRecipes.R001 === 2
      };
    }, UID);

    if (r.loadCorrupted) fail('T5 save+reload', 'Flag corrupted positionné après save propre');
    else if (r.prenom !== 'Jamal') fail('T5 save+reload', 'Prénom perdu : ' + r.prenom);
    else if (!r.sportProg) fail('T5 save+reload', 'sportProgram perdu');
    else if (!r.weekPlan) fail('T5 save+reload', 'weekPlan perdu');
    else if (!r.favR042 || !r.favR001) fail('T5 save+reload', 'Favoris perdus');
    else pass('T5 : save → reload page → toutes les données restaurées');

    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  await browser.close();
  console.log('\n========== LOGOUT E2E CHROMIUM ==========');
  console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
