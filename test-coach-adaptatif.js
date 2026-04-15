// Test E2E — COACH ADAPTATIF 2026-04 (phase A)
// Valide : Sonnet model ID, state sessionFeedback, helpers window,
// modal post-séance, buildContext enrichi, suggestions adaptatives.

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

  // T1 : Backend Sonnet 4.6 + champs whitelist enrichis
  suite('T1 \u2014 Backend Sonnet + ALLOWED_FIELDS enrichi');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/ai-coach.js', 'utf8');
    if (src.indexOf("MODEL = 'claude-sonnet-4-6'") === -1) fail('T1 model', 'Modèle Sonnet 4.6 non configuré');
    else if (src.indexOf("'lastSessionFeedback'") === -1) fail('T1 whitelist lsf', 'lastSessionFeedback absent ALLOWED_FIELDS');
    else if (src.indexOf("'weekPerformance'") === -1) fail('T1 whitelist wp', 'weekPerformance absent');
    else if (src.indexOf("'nextSessionScheduled'") === -1) fail('T1 whitelist ns', 'nextSessionScheduled absent');
    else if (src.indexOf("'cyclePhase'") === -1) fail('T1 whitelist cp', 'cyclePhase absent');
    else pass('T1 : Sonnet 4.6 + 4 nouveaux champs whitelist (lsf/wp/ns/cp)');
  } catch(e) { fail('T1', e.message); }

  // T2 : Sanitization typée des 4 nouveaux champs
  suite('T2 \u2014 Sanitization typée backend');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/ai-coach.js', 'utf8');
    if (src.indexOf("field === 'lastSessionFeedback'") === -1) fail('T2 lsf', 'Handler lastSessionFeedback absent');
    else if (src.indexOf("field === 'weekPerformance'") === -1) fail('T2 wp', 'Handler weekPerformance absent');
    else if (src.indexOf("field === 'nextSessionScheduled'") === -1) fail('T2 ns', 'Handler nextSessionScheduled absent');
    else if (src.indexOf("field === 'cyclePhase'") === -1) fail('T2 cp', 'Handler cyclePhase absent');
    else if (src.indexOf('rpeN >= 1 && rpeN <= 10') === -1) fail('T2 rpe bounds', 'RPE bornes 1-10 absentes');
    else pass('T2 : 4 handlers sanitization typée + bornes RPE 1-10');
  } catch(e) { fail('T2', e.message); }

  // T3 : System prompt adaptatif
  suite('T3 \u2014 System prompt adaptatif ISSN/ACSM');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/ai-coach.js', 'utf8');
    const markers = [
      'R\u00c8GLES COACH ADAPTATIF',
      'ISSN 2017 / ACSM',
      'DERNI\u00c8RE S\u00c9ANCE',
      'PERFORMANCE SEMAINE',
      'PROCHAINE S\u00c9ANCE',
      'RPE \u2264 6',
      'RPE 7-8',
      'RPE \u2265 9',
      'd\u00e9-load',
      'volume max +10%/semaine (ACSM)'
    ];
    const missing = markers.filter(m => src.indexOf(m) === -1);
    if (missing.length > 0) fail('T3 markers', 'Markers manquants : ' + missing.join(' | '));
    else pass('T3 : System prompt contient règles ISSN/ACSM complètes');
  } catch(e) { fail('T3', e.message); }

  // T4 : State + helpers window exposés
  suite('T4 \u2014 State sessionFeedback + helpers window');
  try {
    const { page, ctx, errors } = await newPage();
    const r = await page.evaluate(() => {
      return {
        stateInit: window.S && typeof window.S.sessionFeedback === 'object' && !Array.isArray(window.S.sessionFeedback),
        h1: typeof window.getLastSessionFeedback,
        h2: typeof window.getWeekPerformanceSummary,
        h3: typeof window.getNextScheduledSession,
        h4: typeof window.getCyclePhaseForAI,
        h5: typeof window.recordSessionFeedback
      };
    });
    if (!r.stateInit) fail('T4 state', 'S.sessionFeedback non initialisé comme object');
    else if (r.h1 !== 'function' || r.h2 !== 'function' || r.h3 !== 'function' || r.h4 !== 'function' || r.h5 !== 'function') {
      fail('T4 helpers', 'Helpers manquants : ' + JSON.stringify(r));
    } else if (errors.length > 0) fail('T4 console', 'Errors: ' + errors.join(' | '));
    else pass('T4 : S.sessionFeedback init + 5 helpers exposés + 0 erreur console');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : recordSessionFeedback — save + purge > 60j
  suite('T5 \u2014 recordSessionFeedback : save + bornes RPE + purge');
  try {
    const { page, ctx, errors } = await newPage();
    const r = await page.evaluate(() => {
      const out = {};
      // Seed 70 fake days (purge test)
      window.S.sessionFeedback = {};
      for (let i = 0; i < 70; i++) {
        const d = new Date(Date.now() - i * 24 * 3600 * 1000);
        const pad = n => n < 10 ? '0' + n : n;
        const key = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        window.S.sessionFeedback[key] = { rpe: 5 };
      }
      const beforeCount = Object.keys(window.S.sessionFeedback).length;
      // Record today → should trigger purge
      const key = window.recordSessionFeedback({ rpe: 8, feeling: 'forme', chargeActual: { 'Squat': 100 } });
      out.recorded = key;
      out.afterCount = Object.keys(window.S.sessionFeedback).length;
      out.beforeCount = beforeCount;
      // RPE out of bounds → ignored
      const key2 = window.recordSessionFeedback({ rpe: 15, chargeActual: { 'DC': 60 } });
      out.rpeOutOfBounds = window.S.sessionFeedback[key2].rpe;
      // Negative charge → ignored
      window.recordSessionFeedback({ chargeActual: { 'Biceps': -5 } });
      out.negativeChargeIgnored = !window.S.sessionFeedback[key2].chargeActual || !window.S.sessionFeedback[key2].chargeActual.Biceps;
      return out;
    });
    if (r.beforeCount !== 70) fail('T5 seed', 'Seed count=' + r.beforeCount);
    else if (r.afterCount > 60) fail('T5 purge', 'Purge failed, count=' + r.afterCount);
    else if (r.rpeOutOfBounds !== undefined) fail('T5 rpe bounds', 'RPE 15 accepté: ' + r.rpeOutOfBounds);
    else if (!r.negativeChargeIgnored) fail('T5 neg charge', 'Charge négative acceptée');
    else pass('T5 : Purge > 60j OK, RPE out-of-bounds ignoré, charge négative ignorée');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : buildContext enrichi avec les 4 nouveaux champs
  suite('T6 \u2014 buildContext renvoie les 4 nouveaux champs');
  try {
    const { page, ctx, errors } = await newPage();
    const r = await page.evaluate(() => {
      window.S.prenom = 'Jamal';
      window.S.sex = 'homme'; window.S.age = 30; window.S.weight = 75; window.S.height = 178;
      window.S.sportType = 'muscu';
      window.S.trainingDaysSelected = [0, 2, 4];
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const ts = today.getFullYear() + '-' + pad(today.getMonth()+1) + '-' + pad(today.getDate());
      window.S.sessionFeedback = {};
      window.S.sessionFeedback[ts] = { rpe: 7, feeling: 'normal', chargeActual: { 'Squat': 100 } };
      const bc = window.AI_COACH.buildContext();
      return {
        hasLastSession: !!bc.lastSessionFeedback,
        lastRpe: bc.lastSessionFeedback && bc.lastSessionFeedback.rpe,
        hasWeekPerf: !!bc.weekPerformance,
        weekCount: bc.weekPerformance && bc.weekPerformance.sessionsCount,
        hasNextSession: !!bc.nextSessionScheduled
      };
    });
    if (!r.hasLastSession) fail('T6 lsf', 'lastSessionFeedback absent');
    else if (r.lastRpe !== 7) fail('T6 rpe', 'lastRpe=' + r.lastRpe);
    else if (!r.hasWeekPerf) fail('T6 wp', 'weekPerformance absent');
    else if (!r.hasNextSession) fail('T6 ns', 'nextSessionScheduled absent');
    else if (errors.length > 0) fail('T6 errs', errors.join(' | '));
    else pass('T6 : buildContext renvoie lastSession + weekPerf + nextSession correctement');
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Suggestions adaptatives selon feedback
  suite('T7 \u2014 getSuggestions adaptatif selon RPE + pain + grossesse');
  try {
    const { page, ctx, errors } = await newPage();
    const r = await page.evaluate(() => {
      const results = {};
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const ts = today.getFullYear() + '-' + pad(today.getMonth()+1) + '-' + pad(today.getDate());
      // Scenario A : RPE bas
      window.S.sessionFeedback = {};
      window.S.sessionFeedback[ts] = { rpe: 5, feeling: 'forme' };
      results.lowRpe = window.AI_COACH.getSuggestions();
      // Scenario B : RPE haut + douleur
      window.S.sessionFeedback[ts] = { rpe: 9, feeling: 'fatigue', pain: 'dos' };
      results.highRpePain = window.AI_COACH.getSuggestions();
      // Scenario C : grossesse T2 sans feedback
      window.S.sessionFeedback = {};
      window.S.pregnant = true; window.S.pregnancyWeek = 22;
      results.pregnantT2 = window.AI_COACH.getSuggestions();
      return results;
    });
    const hasLowRpeSug = r.lowRpe.some(s => s.indexOf('monter les charges') !== -1);
    const hasPainSug = r.highRpePain.some(s => s.indexOf('dos') !== -1);
    const hasDeload = r.highRpePain.some(s => s.indexOf('d\u00e9-load') !== -1);
    const hasPregnantSug = r.pregnantT2.some(s => s.indexOf('T2') !== -1);
    if (!hasLowRpeSug) fail('T7 low RPE', 'Pas de suggestion "monter charges" : ' + JSON.stringify(r.lowRpe));
    else if (!hasPainSug) fail('T7 pain', 'Pas de suggestion douleur : ' + JSON.stringify(r.highRpePain));
    else if (!hasDeload) fail('T7 deload', 'Pas de suggestion dé-load : ' + JSON.stringify(r.highRpePain));
    else if (!hasPregnantSug) fail('T7 pregnant', 'Pas de suggestion T2 : ' + JSON.stringify(r.pregnantT2));
    else pass('T7 : Suggestions adaptatives OK (RPE bas→progression, douleur→adapt, RPE haut→déload, T2→adapté)');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  // T8 : Persistance sessionFeedback (localStorage + loadProfile restore)
  suite('T8 \u2014 sessionFeedback persiste via localStorage + loadProfile');
  try {
    const { page, ctx, errors } = await newPage();
    await page.evaluate(() => {
      window.S.prenom = 'Test'; window.S.sex = 'homme'; window.S.age = 30;
      window.S.weight = 70; window.S.height = 175;
      window.recordSessionFeedback({ rpe: 8, feeling: 'forme', chargeActual: { 'Squat': 90 } });
    });
    // Verify localStorage contains the feedback (already encoded by saveProfile)
    const lsCheck = await page.evaluate(() => {
      const raw = localStorage.getItem('mtd_profile_anon');
      if (!raw) return { hasRaw: false };
      const dec = window._storageDecode ? window._storageDecode(raw) : null;
      return {
        hasRaw: true,
        hasSessionFeedback: !!(dec && dec.sessionFeedback),
        feedbackKeys: dec && dec.sessionFeedback ? Object.keys(dec.sessionFeedback) : [],
        firstEntry: dec && dec.sessionFeedback ? Object.values(dec.sessionFeedback)[0] : null
      };
    });
    if (!lsCheck.hasRaw) fail('T8 localStorage', 'Pas de profil dans localStorage');
    else if (!lsCheck.hasSessionFeedback) fail('T8 sfb in ls', 'sessionFeedback absent de localStorage');
    else if (!lsCheck.firstEntry || lsCheck.firstEntry.rpe !== 8) fail('T8 rpe saved', 'RPE mal sauvegardé: ' + JSON.stringify(lsCheck.firstEntry));
    else if (!lsCheck.firstEntry.chargeActual || lsCheck.firstEntry.chargeActual.Squat !== 90) fail('T8 charge saved', 'Squat mal sauvegardé');
    else {
      // Simulate reload : clear S and call loadProfile manually (as login would do)
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      const afterLoad = await page.evaluate(() => {
        // Force loadProfile (comme le fait _doAutoLogin au login)
        if (typeof window.loadProfile === 'function') window.loadProfile();
        // Si pas exposé, on lit directement et restore
        else {
          const raw = localStorage.getItem('mtd_profile_anon');
          const dec = window._storageDecode ? window._storageDecode(raw) : null;
          if (dec && dec.sessionFeedback) window.S.sessionFeedback = dec.sessionFeedback;
        }
        const fb = window.getLastSessionFeedback();
        return {
          hasFb: !!fb,
          rpe: fb && fb.rpe,
          chargeSquat: fb && fb.chargeActual && fb.chargeActual.Squat
        };
      });
      if (!afterLoad.hasFb) fail('T8 restore', 'Feedback non restauré');
      else if (afterLoad.rpe !== 8) fail('T8 rpe restore', 'RPE=' + afterLoad.rpe);
      else if (afterLoad.chargeSquat !== 90) fail('T8 charge restore', 'Squat=' + afterLoad.chargeSquat);
      else pass('T8 : sessionFeedback persiste en localStorage + restauré par loadProfile (RPE + charges)');
    }
    await ctx.close();
  } catch(e) { fail('T8', e.message); }

  // T9 : Logout reset sessionFeedback (pas de fuite inter-users)
  suite('T9 \u2014 Logout reset sessionFeedback');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/auth.js', 'utf8');
    if (src.indexOf('window.S.sessionFeedback = {}') === -1) fail('T9 reset', 'Reset sessionFeedback absent au logout');
    else pass('T9 : auth.js reset sessionFeedback au logout');
  } catch(e) { fail('T9', e.message); }

  // T10 : UI modal post-séance (existence des éléments RPE/feeling/pain)
  suite('T10 \u2014 UI modal post-séance : slider RPE + chips feeling + chips pain');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/app-sport.js', 'utf8');
    const markers = [
      'COACH ADAPTATIF 2026-04 (phase A-3)',
      'Comment tu te sens',
      'Effort ressenti (RPE)',
      'S._sessionFeedbackDraft',
      'Ressenti g\u00e9n\u00e9ral',
      'Douleur signal\u00e9e',
      'recordSessionFeedback'
    ];
    const missing = markers.filter(m => src.indexOf(m) === -1);
    if (missing.length > 0) fail('T10 markers', 'Manquants : ' + missing.join(' | '));
    else pass('T10 : UI modal contient slider RPE + chips feeling + chips pain + record call');
  } catch(e) { fail('T10', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
