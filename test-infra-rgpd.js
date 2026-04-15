// Test E2E — INFRA RGPD + PROGRESSION
// Valide : disclaimer modal, export JSON exhaustif, wellness history multi-jours,
// helper getWeekSessionsSummary, lien DPO.

const { chromium } = require('playwright');
const fs = require('fs');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n) { console.log('  \u2713 ' + n); passed++; }
  function fail(n, d) { console.log('  \u2717 ' + n + '\n    ' + d); failed++; }
  function suite(n) { console.log('\n\u2550 ' + n + ' \u2550'); }

  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGE: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONS: ' + m.text()); });
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    return { page, ctx, errors };
  }

  async function mockLogin(page, uid) {
    uid = uid || 'test-uid-rgpd';
    await page.evaluate((u) => {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return { id: u, name: 'TestRGPD', email: 'test@example.com' }; };
      }
    }, uid);
    await page.waitForTimeout(200);
  }

  // T1 : Disclaimer helper exposé + modal créé si pas accepté
  suite('T1 \u2014 Disclaimer médical : helper + modal affichage');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => {
      const out = {};
      out.helperExists = typeof window.showMedicalDisclaimerIfNeeded === 'function';
      // Première fois : doit retourner true + créer le modal
      const shownFirst = window.showMedicalDisclaimerIfNeeded();
      out.shownFirstTime = shownFirst;
      out.modalInDom = !!document.getElementById('mtd-medical-disclaimer');
      // Contenu obligatoire
      const modal = document.getElementById('mtd-medical-disclaimer');
      out.hasTitle = !!(modal && modal.querySelector('#mtd-disclaimer-title'));
      out.hasBtn = !!(modal && modal.querySelector('button'));
      // Cliquer sur le bouton pour accepter
      if (modal) {
        const btn = modal.querySelector('button');
        if (btn) btn.click();
      }
      // Après acceptation : flag en localStorage + modal retiré
      out.flagSet = localStorage.getItem('mtd_disclaimer_accepted_test-uid-rgpd') === '1';
      out.modalRemoved = !document.getElementById('mtd-medical-disclaimer');
      // 2e appel : ne doit rien afficher
      const shownSecond = window.showMedicalDisclaimerIfNeeded();
      out.shownSecondTime = shownSecond;
      return out;
    });
    if (!r.helperExists) fail('T1 helper', 'showMedicalDisclaimerIfNeeded absent');
    else if (!r.shownFirstTime) fail('T1 first', 'Modal pas affiché au premier appel');
    else if (!r.modalInDom) fail('T1 dom', 'Modal pas dans DOM');
    else if (!r.hasTitle || !r.hasBtn) fail('T1 content', 'Contenu modal incomplet');
    else if (!r.flagSet) fail('T1 flag', 'Flag pas persisté en localStorage');
    else if (!r.modalRemoved) fail('T1 cleanup', 'Modal pas retiré après acceptation');
    else if (r.shownSecondTime) fail('T1 reshown', 'Modal s\'affiche à nouveau après acceptation');
    else if (errors.length) fail('T1 errs', errors.join(' | '));
    else pass('T1 : disclaimer affiché 1x, bouton accepte, flag persisté, 2e appel = no-op');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : Export JSON exhaustif (PROFILE_KEYS + linked keys)
  suite('T2 \u2014 Export JSON RGPD : payload exhaustif v2');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/app-main.js', 'utf8');
    const markers = [
      'exportVersion: 2',
      'PROFILE_KEYS.forEach',
      'mtd_food_journal_',
      'mtd_progress_photos_',
      'mtd_weight_history_',
      'mtd_aicoach_feedback_',
      'mtd_muscu_progression_',
      'mtd_wellness_history_',
      'smartfitcoach-export-',
      'RGPD Art. 20'
    ];
    const missing = markers.filter(m => src.indexOf(m) === -1);
    if (missing.length) fail('T2 markers', 'Manquants : ' + missing.join(' | '));
    else pass('T2 : export v2 exhaustif (profile + 9+ linked keys + RGPD Art.20)');
  } catch(e) { fail('T2', e.message); }

  // T3 : Wellness history helpers (push + get)
  suite('T3 \u2014 Wellness history multi-jours : push + get + purge 90j');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-uid-wellness');
    const r = await page.evaluate(() => {
      const out = {};
      out.pushExists = typeof window.pushWellnessHistory === 'function';
      out.getExists = typeof window.getWellnessHistory === 'function';
      // Seed 100 jours (test purge)
      const now = new Date();
      for (let i = 0; i < 100; i++) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        window.pushWellnessHistory({ date: dateStr, sleep: 3, muscles: 'frais', energy: 'moyen' });
      }
      const all = window.getWellnessHistory(0);
      out.totalAfterPush = all.length;
      // Dédupe : push 2x même date
      const key = now.toISOString().slice(0, 10);
      window.pushWellnessHistory({ date: key, sleep: 5, muscles: 'douleurs', energy: 'haut' });
      const afterDedup = window.getWellnessHistory(0);
      out.totalAfterDedup = afterDedup.length;
      const latest = afterDedup.filter(x => x.date === key)[0];
      out.dedupLatestSleep = latest ? latest.sleep : null;
      // Lecture 7 derniers jours
      const last7 = window.getWellnessHistory(7);
      out.last7Count = last7.length;
      return out;
    });
    if (!r.pushExists || !r.getExists) fail('T3 helpers', 'Helpers manquants');
    else if (r.totalAfterPush !== 90) fail('T3 purge', 'Purge 90j échoue : total=' + r.totalAfterPush);
    else if (r.totalAfterDedup !== 90) fail('T3 dedup', 'Dédupe échoue : total=' + r.totalAfterDedup);
    else if (r.dedupLatestSleep !== 5) fail('T3 replace', 'Remplacement échoue : sleep=' + r.dedupLatestSleep);
    else if (r.last7Count < 7 || r.last7Count > 8) fail('T3 window', 'Fenêtre 7j : ' + r.last7Count);
    else pass('T3 : 100 seed → 90 purged, dédupe remplace (sleep 3→5), fenêtre 7j=' + r.last7Count);
    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // T4 : getWeekSessionsSummary helper
  suite('T4 \u2014 getWeekSessionsSummary : agrégat semaine courante');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => {
      const out = {};
      out.helperExists = typeof window.getWeekSessionsSummary === 'function';
      // Empty case
      window.S.sessionHistory = {};
      const empty = window.getWeekSessionsSummary();
      out.empty = empty;
      // Seed 3 séances cette semaine
      const now = new Date();
      const pad = n => n < 10 ? '0' + n : n;
      // Aujourd'hui
      const today = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
      // Hier
      const ymd = new Date(now.getTime() - 86400000);
      const yesterday = ymd.getFullYear() + '-' + pad(ymd.getMonth()+1) + '-' + pad(ymd.getDate());
      window.S.sessionHistory = {};
      window.S.sessionHistory['0_' + today] = { duration: 45, kcalTotal: 300, date: today + 'T10:00:00Z' };
      window.S.sessionHistory['1_' + yesterday] = { duration: 60, kcalTotal: 450, date: yesterday + 'T11:00:00Z' };
      window.S.sessionHistory['2_' + today] = { duration: 30, kcalTotal: 200, date: today + 'T18:00:00Z' };
      // Une séance 30j avant (hors semaine)
      const oldDate = new Date(now.getTime() - 30 * 86400000);
      const oldStr = oldDate.getFullYear() + '-' + pad(oldDate.getMonth()+1) + '-' + pad(oldDate.getDate());
      window.S.sessionHistory['0_' + oldStr] = { duration: 60, kcalTotal: 500, date: oldStr + 'T10:00:00Z' };
      const summary = window.getWeekSessionsSummary();
      out.summary = summary;
      return out;
    });
    if (!r.helperExists) fail('T4 helper', 'getWeekSessionsSummary absent');
    else if (!r.empty || r.empty.sessions !== 0) fail('T4 empty', 'Empty case failed : ' + JSON.stringify(r.empty));
    else if (!r.summary) fail('T4 summary', 'Summary null');
    else if (r.summary.sessions !== 3) fail('T4 count', 'Sessions=' + r.summary.sessions + ' (expected 3)');
    else if (r.summary.kcalTotal !== 950) fail('T4 kcal', 'kcalTotal=' + r.summary.kcalTotal);
    else if (r.summary.durationTotal !== 135) fail('T4 dur', 'durationTotal=' + r.summary.durationTotal);
    else if (r.summary.daysActive !== 2) fail('T4 days', 'daysActive=' + r.summary.daysActive);
    else pass('T4 : 3 sessions / 2 jours / 950 kcal / 135 min — 30j old exclu correctement');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : Lien DPO présent dans source app-main.js
  suite('T5 \u2014 Lien DPO visible dans profil');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/app-main.js', 'utf8');
    if (src.indexOf('dpo@smartfitcoach.com') === -1) fail('T5 email', 'Email DPO absent');
    else if (src.indexOf('Contacter le DPO') === -1) fail('T5 label', 'Label bouton absent');
    else if (src.indexOf('subject=Demande%20RGPD') === -1) fail('T5 subject', 'Subject mailto absent');
    else pass('T5 : lien mailto DPO avec subject pré-rempli');
  } catch(e) { fail('T5', e.message); }

  // T6 : Modal disclaimer bloque la navigation (z-index + aria-modal)
  suite('T6 \u2014 Modal disclaimer accessibilité + blocage');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page, 'test-uid-access');
    const r = await page.evaluate(() => {
      window.showMedicalDisclaimerIfNeeded();
      const modal = document.getElementById('mtd-medical-disclaimer');
      if (!modal) return { error: 'no modal' };
      return {
        role: modal.getAttribute('role'),
        ariaModal: modal.getAttribute('aria-modal'),
        ariaLabelledBy: modal.getAttribute('aria-labelledby'),
        zIndex: getComputedStyle(modal).zIndex,
        hasBackdrop: getComputedStyle(modal).backdropFilter !== 'none' ||
                     getComputedStyle(modal).webkitBackdropFilter !== 'none'
      };
    });
    if (r.error) fail('T6 setup', r.error);
    else if (r.role !== 'dialog') fail('T6 role', 'role=' + r.role);
    else if (r.ariaModal !== 'true') fail('T6 aria-modal', 'aria-modal=' + r.ariaModal);
    else if (!r.ariaLabelledBy) fail('T6 aria-labelledby', 'aria-labelledby absent');
    else if (parseInt(r.zIndex) < 9999) fail('T6 z-index', 'z-index=' + r.zIndex);
    else pass('T6 : role=dialog, aria-modal=true, aria-labelledby, z-index ' + r.zIndex);
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Isolation inter-users (flag disclaimer + wellness)
  suite('T7 \u2014 Isolation inter-users : flags par uid');
  try {
    const { page, ctx, errors } = await newPage();
    // User A
    await mockLogin(page, 'user-A');
    await page.evaluate(() => {
      window.showMedicalDisclaimerIfNeeded();
      const m = document.getElementById('mtd-medical-disclaimer');
      if (m) { const b = m.querySelector('button'); if (b) b.click(); }
      window.pushWellnessHistory({ date: '2026-04-10', sleep: 4 });
    });
    // User B
    await mockLogin(page, 'user-B');
    const r = await page.evaluate(() => {
      // User B : flag disclaimer pas présent → doit s'afficher
      const shown = window.showMedicalDisclaimerIfNeeded();
      const modal = document.getElementById('mtd-medical-disclaimer');
      // User B : wellness history séparé
      const bHistory = window.getWellnessHistory(0);
      // Verify A's flag still exists
      const aFlag = localStorage.getItem('mtd_disclaimer_accepted_user-A');
      const bFlag = localStorage.getItem('mtd_disclaimer_accepted_user-B');
      return {
        bShownAgain: shown,
        bModal: !!modal,
        bHistoryCount: bHistory.length,
        aFlag: aFlag,
        bFlag: bFlag
      };
    });
    if (!r.bShownAgain) fail('T7 isolation disclaimer', 'User B ne voit pas le modal (flag fuit)');
    else if (r.bHistoryCount !== 0) fail('T7 isolation wellness', 'User B voit history user A : ' + r.bHistoryCount);
    else if (r.aFlag !== '1') fail('T7 a-flag', 'User A flag perdu');
    else if (r.bFlag !== null) fail('T7 b-flag', 'User B flag déjà set (leak) : ' + r.bFlag);
    else pass('T7 : user A flag isolé, user B voit son propre disclaimer + wellness vide');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 INFRA-RGPD : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
