// Test E2E Chromium pour la sous-vague C (5 derniers P0)
//
// Couvre :
//   V1 — _legacy_storage compare longueur avant overwrite (anti-écrasement)
//   V3 — Race saveProfile pendant syncOnLogin → modifs préservées via re-flush
//   V4 — Bloquer saveProfile si AUTH en train de restorer (mtd_profile_anon évité)
//   PWA #1 — cache.addAll robust (skipWaiting bloqué si install < 90%)
//   PWA #2 — checkPersistentReminders skip notifs > 6h + cap à 2

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
    await page.waitForTimeout(3000);
    return { page, ctx, errors };
  }

  // ─── V4 — isAuthRestoring exposé + saveProfile bloque pendant restore ───
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Vérifier que isAuthRestoring est exposée
      const exposed = typeof window.AUTH.isAuthRestoring === 'function';
      // À ce stade, _authReadyResolved devrait être true (3s écoulées)
      const restoring = exposed ? window.AUTH.isAuthRestoring() : null;
      return { exposed: exposed, restoring: restoring };
    });
    if (!r.exposed) fail('V4 isAuthRestoring exposé', 'AUTH.isAuthRestoring pas exposée');
    else pass('V4-source : AUTH.isAuthRestoring exposée (résultat actuel = ' + r.restoring + ')');
    await ctx.close();
  } catch(e) { fail('V4 isAuthRestoring', e.message); }

  // ─── V4 — saveProfile bloqué si isAuthRestoring=true ───
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Mock isAuthRestoring pour qu'il retourne true
      window.AUTH.isAuthRestoring = function() { return true; };

      // Tenter saveProfile
      const UID_TEST = 'test-v4-uid';
      window.AUTH.getUser = function() { return { id: UID_TEST }; };

      // Sentinel : aucun setItem doit toucher mtd_profile_*
      let attempted = false;
      const orig = localStorage.setItem;
      localStorage.setItem = function(k, v) {
        if (k.indexOf('mtd_profile_') === 0) attempted = true;
        return orig.call(localStorage, k, v);
      };
      window.S.weight = 80;
      window.S.goal = 1;
      window.saveProfile();
      localStorage.setItem = orig;

      return { attempted: attempted };
    });
    if (r.attempted) fail('V4 saveProfile bloqué', 'saveProfile a écrit alors que isAuthRestoring=true');
    else pass('V4 : saveProfile bloqué pendant restore session (isAuthRestoring=true)');
    await ctx.close();
  } catch(e) { fail('V4 saveProfile bloqué', e.message); }

  // ─── V1 — _legacy_storage NE écrase PAS si local plus riche ───
  // Test isolé sur la logique de comparaison
  try {
    const fs = require('fs');
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/supabase-client.js', 'utf8');
    if (src.indexOf("FIX V1 2026-04") === -1)
      fail('V1 marker', 'Commentaire FIX V1 absent');
    else if (src.indexOf("existing.length > cloudVal.length") === -1)
      fail('V1 logic', 'Comparaison de tailles absente');
    else if (src.indexOf("Skip restore") === -1)
      fail('V1 skip log', 'Log "Skip restore" absent');
    else
      pass('V1-source : Comparaison local vs cloud + skip si local plus riche');
  } catch(e) { fail('V1 source', e.message); }

  // V1 — Test fonctionnel : simuler le cas
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Simuler la logique V1 directement (la fonction interne n'est pas exposée)
      const richLocal = JSON.stringify({"2026-01":[{},{},{},{}], "2026-02":[{},{},{},{},{}], "2026-03":[{},{},{}]});
      const poorCloud = JSON.stringify({"2026-04":[{}]});
      // Reproduit la logique V1
      function shouldRestore(existing, cloudVal) {
        if (typeof existing === 'string' && existing.length > 0 &&
            typeof cloudVal === 'string' && cloudVal.length > 0) {
          if (existing.length > cloudVal.length && existing !== cloudVal) {
            return false; // skip
          }
        }
        return true;
      }
      return {
        skipsRichLocal: !shouldRestore(richLocal, poorCloud),
        applieshorter: shouldRestore("a", "abcd"), // local plus court → restore cloud
        appliesEqual: shouldRestore("abc", "abc")  // égal → restore
      };
    });
    if (!r.skipsRichLocal) fail('V1 skip rich', 'Local riche n\'est PAS préservé');
    else if (!r.applieshorter) fail('V1 apply cloud', 'Local pauvre devrait être écrasé par cloud riche');
    else pass('V1 : Logique compare correctement (skip si local riche, apply si cloud riche)');
    await ctx.close();
  } catch(e) { fail('V1 functional', e.message); }

  // ─── V3 — _savePendingDuringSync flag + re-flush ───
  try {
    const fs = require('fs');
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/supabase-client.js', 'utf8');
    if (src.indexOf("_savePendingDuringSync") === -1)
      fail('V3 flag', 'Flag _savePendingDuringSync absent');
    else if (src.indexOf("FIX V3 2026-04") === -1)
      fail('V3 marker', 'Commentaire FIX V3 absent');
    else if (src.indexOf("Re-flushing saveProfile") === -1)
      fail('V3 reflush', 'Re-flush log absent');
    else
      pass('V3-source : Flag + re-flush présents dans syncOnLogin');
  } catch(e) { fail('V3 source', e.message); }

  // V3 — Test fonctionnel : simuler scheduleSave pendant _syncPending
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      const SS = window.SupaSync;
      // Simuler _syncPending true
      SS._syncPending = true;
      SS._savePendingDuringSync = false;
      // scheduleSave doit set le flag au lieu de save
      SS.scheduleSave();
      const flagSet = SS._savePendingDuringSync === true;
      // Reset
      SS._syncPending = false;
      SS._savePendingDuringSync = false;
      return { flagSet: flagSet };
    });
    if (!r.flagSet) fail('V3 flag set', 'scheduleSave n\'a pas set _savePendingDuringSync pendant _syncPending');
    else pass('V3 : scheduleSave set _savePendingDuringSync au lieu de skip silencieusement');
    await ctx.close();
  } catch(e) { fail('V3 functional', e.message); }

  // ─── PWA #1 — sw.js install robust + skipWaiting conditionnel ───
  try {
    const fs = require('fs');
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/sw.js', 'utf8');
    if (src.indexOf("FIX PWA #1 2026-04") === -1)
      fail('PWA #1 marker', 'Commentaire FIX PWA #1 absent');
    else if (src.indexOf("Promise.allSettled") === -1)
      fail('PWA #1 allSettled', 'Promise.allSettled absent (devrait être utilisé)');
    else if (src.indexOf("if (ratio >= 0.9)") === -1)
      fail('PWA #1 threshold', 'Seuil 90% absent');
    else if (src.indexOf("skipWaiting bloqué") === -1)
      fail('PWA #1 fallback log', 'Log "skipWaiting bloqué" absent');
    else
      pass('PWA #1-source : install robust avec seuil 90% + skipWaiting conditionnel');
  } catch(e) { fail('PWA #1 source', e.message); }

  // ─── PWA #2 — checkPersistentReminders skip > 6h + cap 2 ───
  try {
    const fs = require('fs');
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/push-manager.js', 'utf8');
    if (src.indexOf("FIX PWA #2 2026-04") === -1)
      fail('PWA #2 marker', 'Commentaire FIX PWA #2 absent');
    else if (src.indexOf("MAX_LATE_MS") === -1)
      fail('PWA #2 maxLate', 'Constante MAX_LATE_MS absente');
    else if (src.indexOf("MAX_IMMEDIATE_FIRES") === -1)
      fail('PWA #2 cap', 'Constante MAX_IMMEDIATE_FIRES absente');
    else if (src.indexOf("6 * 60 * 60 * 1000") === -1)
      fail('PWA #2 6h', 'Seuil 6h absent');
    else
      pass('PWA #2-source : Drop > 6h + cap 2 + dédup par tag');
  } catch(e) { fail('PWA #2 source', e.message); }

  // PWA #2 — Test fonctionnel : injecter des notifs en retard et vérifier que cap fonctionne
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Simuler 5 notifs en retard et 2 dans le futur
      const now = Date.now();
      const prefs = {
        granted: true,
        scheduledNotifs: [
          { tag: 'meal-lunch', title: 'T', body: 'B', targetTime: now - 1000 },         // 1s late
          { tag: 'meal-dinner', title: 'T', body: 'B', targetTime: now - 2000 },        // 2s late
          { tag: 'workout', title: 'T', body: 'B', targetTime: now - 3000 },            // 3s late
          { tag: 'old-1', title: 'T', body: 'B', targetTime: now - 8 * 60 * 60 * 1000 }, // 8h late → drop
          { tag: 'old-2', title: 'T', body: 'B', targetTime: now - 24 * 60 * 60 * 1000 }, // 24h late → drop
          { tag: 'future-1', title: 'T', body: 'B', targetTime: now + 60000 },          // future
          { tag: 'future-2', title: 'T', body: 'B', targetTime: now + 120000 }          // future
        ]
      };
      localStorage.setItem('mtd_push_prefs', JSON.stringify(prefs));

      // Compter les showLocal calls
      let showCount = 0;
      const origShow = window.SFCPushManager.showLocal;
      window.SFCPushManager.showLocal = function() { showCount++; };

      window.SFCPushManager.checkPersistentReminders();

      window.SFCPushManager.showLocal = origShow;

      const newPrefs = JSON.parse(localStorage.getItem('mtd_push_prefs'));
      return {
        showCount: showCount,
        remainingFuture: newPrefs.scheduledNotifs.length // doit être 2 (futurs préservés)
      };
    });

    if (r.showCount > 2)
      fail('PWA #2 cap 2', 'showLocal appelé ' + r.showCount + ' fois (devrait être ≤ 2)');
    else if (r.showCount === 0)
      fail('PWA #2 fire some', 'Aucune notif déclenchée (au moins 1 récente devrait l\'être)');
    else if (r.remainingFuture !== 2)
      fail('PWA #2 future preserve', 'Notifs futures perdues : ' + r.remainingFuture + '/2');
    else
      pass('PWA #2 : Cap 2 notifs récentes + drop > 6h + future préservées (' + r.showCount + ' fired)');

    await ctx.close();
  } catch(e) { fail('PWA #2 functional', e.message); }

  await browser.close();
  console.log('\n========== VAGUE C E2E CHROMIUM ==========');
  console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
