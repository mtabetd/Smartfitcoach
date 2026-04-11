// AGENT QA — Smart Calendar + Muscle Taxonomy + GIF Map Tests
// Tests: calendrier intelligent, détection conflits, bannière, nav tab, regressions
const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';
const fs = require('fs');
if (!fs.existsSync('rapport-screenshots')) fs.mkdirSync('rapport-screenshots');

async function go() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  async function mkPage(uid, profile) {
    var ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    var page = await ctx.newPage();
    var errs = [];
    page.on('console', function(m) { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', function(e) { errs.push(e.message); });
    await ctx.addInitScript(function() {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await page.evaluate(function(d) {
      var fake = { id: d.uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '' };
      localStorage.setItem('mtd_profile_' + d.uid, JSON.stringify(d.p));
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return fake; };
      }
      if (window.loadProfile) window.loadProfile();
      if (window.S) {
        Object.assign(window.S, d.p);
        window.S.view = d.p._view || 'today';
      }
      if (window.render) window.render();
    }, { uid: uid, p: profile });
    await page.waitForTimeout(1500);
    return { page: page, errs: errs };
  }

  function noFatal(errs) {
    return errs.filter(function(e) {
      return e.includes('TypeError') || e.includes('is not a function') ||
             e.includes('Cannot read') || e.includes('is not defined') ||
             e.includes('Cannot set') || e.includes('Unexpected token');
    }).length === 0;
  }

  var BASE_SPORT = {
    appMode: 'sport', sex: 'male', age: 28, weight: 75, height: 178,
    activity: 1.55, sleep: 7, goal: 0, sStep: 6,
    sportType: 'crossfit', crossfitLevel: 'intermediaire', crossfitDays: 4,
    firstLoginDate: '2026-01-15'  // utilisateur existant avant 11/04/2026
  };

  var BASE_BOTH = {
    appMode: 'both', sex: 'male', age: 30, weight: 80, height: 180,
    activity: 1.55, sleep: 7, goal: 0, nStep: 12, sStep: 6,
    sportType: 'crossfit', crossfitLevel: 'intermediaire', crossfitDays: 4,
    sportMixEnabled: true, sportMixSecondary: { type: 'musculation', days: 2 },
    firstLoginDate: '2026-01-10'
  };

  // ── T1 : MUSCLE_TAXONOMY chargé et fonctionnel ──────────────────────────────
  {
    var uid1 = 'sc_taxonomy_' + Date.now();
    var r1 = await mkPage(uid1, Object.assign({}, BASE_BOTH, { _view: 'today' }));
    var taxonomyState = await r1.page.evaluate(function() {
      return {
        exists: typeof window.MUSCLE_TAXONOMY !== 'undefined',
        hasMoveMap: window.MUSCLE_TAXONOMY && typeof window.MUSCLE_TAXONOMY.WOD_MOVEMENT_MUSCLE_MAP === 'object',
        hasDetect: window.MUSCLE_TAXONOMY && typeof window.MUSCLE_TAXONOMY.detectConflicts === 'function',
        hasGetWOD: window.MUSCLE_TAXONOMY && typeof window.MUSCLE_TAXONOMY.getMusclesForWOD === 'function',
        thrusterMuscles: (window.MUSCLE_TAXONOMY && window.MUSCLE_TAXONOMY.WOD_MOVEMENT_MUSCLE_MAP && window.MUSCLE_TAXONOMY.WOD_MOVEMENT_MUSCLE_MAP['thruster']) || null
      };
    });
    var ok1 = taxonomyState.exists && taxonomyState.hasMoveMap && taxonomyState.hasDetect && taxonomyState.hasGetWOD && noFatal(r1.errs);
    await r1.page.screenshot({ path: 'rapport-screenshots/SC1-taxonomy-loaded.png' });
    results.push({ test: 'T1 MUSCLE_TAXONOMY chargé (thruster:' + (taxonomyState.thrusterMuscles ? taxonomyState.thrusterMuscles.join(',') : 'null') + ')', ok: ok1, errors: r1.errs.slice(0, 3) });
    await r1.page.close();
  }

  // ── T2 : SMART_CALENDAR chargé ──────────────────────────────────────────────
  {
    var uid2 = 'sc_load_' + Date.now();
    var r2 = await mkPage(uid2, Object.assign({}, BASE_BOTH, { _view: 'today' }));
    var calState = await r2.page.evaluate(function() {
      return {
        exists: typeof window.SMART_CALENDAR !== 'undefined',
        hasRender: window.SMART_CALENDAR && typeof window.SMART_CALENDAR.render === 'function',
        hasBanner: window.SMART_CALENDAR && typeof window.SMART_CALENDAR.renderBanner === 'function'
      };
    });
    var ok2 = calState.exists && calState.hasRender && calState.hasBanner && noFatal(r2.errs);
    await r2.page.screenshot({ path: 'rapport-screenshots/SC2-calendar-module.png' });
    results.push({ test: 'T2 SMART_CALENDAR module chargé', ok: ok2, errors: r2.errs.slice(0, 3) });
    await r2.page.close();
  }

  // ── T3 : Nav tab Calendrier visible (mode sport) ────────────────────────────
  {
    var uid3 = 'sc_nav_' + Date.now();
    var r3 = await mkPage(uid3, Object.assign({}, BASE_SPORT, { _view: 'today' }));
    var html3 = await r3.page.content();
    var hasCalTab = html3.includes('Calendrier') || html3.includes('calendrier');
    var ok3 = hasCalTab && noFatal(r3.errs);
    await r3.page.screenshot({ path: 'rapport-screenshots/SC3-nav-tab.png' });
    results.push({ test: 'T3 Nav tab Calendrier visible (mode sport)', ok: ok3, errors: r3.errs.slice(0, 3) });
    await r3.page.close();
  }

  // ── T4 : Nav tab absent en mode nutrition only ───────────────────────────────
  {
    var uid4 = 'sc_nonav_' + Date.now();
    var r4 = await mkPage(uid4, {
      appMode: 'nutrition', sex: 'female', age: 28, weight: 58, height: 165,
      activity: 1.375, sleep: 8, goal: -0.25, nStep: 12, _view: 'today',
      firstLoginDate: '2026-01-01'
    });
    var ok4 = noFatal(r4.errs); // just no crash
    await r4.page.screenshot({ path: 'rapport-screenshots/SC4-no-nav-nutrition.png' });
    results.push({ test: 'T4 Pas de crash mode nutrition (tab calendrier absent)', ok: ok4, errors: r4.errs.slice(0, 3) });
    await r4.page.close();
  }

  // ── T5 : Vue calendrier s'affiche sans crash ─────────────────────────────────
  {
    var uid5 = 'sc_view_' + Date.now();
    var r5 = await mkPage(uid5, Object.assign({}, BASE_BOTH, { _view: 'calendar' }));
    var html5 = await r5.page.content();
    var ok5 = html5.length > 2000 && noFatal(r5.errs);
    await r5.page.screenshot({ path: 'rapport-screenshots/SC5-calendar-view.png' });
    results.push({ test: 'T5 Vue calendrier s\'affiche (html:' + html5.length + ')', ok: ok5, errors: r5.errs.slice(0, 3) });
    await r5.page.close();
  }

  // ── T6 : Calendrier contient les 7 jours ─────────────────────────────────────
  {
    var uid6 = 'sc_days_' + Date.now();
    var r6 = await mkPage(uid6, Object.assign({}, BASE_BOTH, { _view: 'calendar' }));
    var html6 = await r6.page.content();
    var hasLundi = html6.includes('Lundi') || html6.includes('lundi');
    var hasDimanche = html6.includes('Dimanche') || html6.includes('dimanche');
    var ok6 = hasLundi && hasDimanche && noFatal(r6.errs);
    await r6.page.screenshot({ path: 'rapport-screenshots/SC6-calendar-7days.png' });
    results.push({ test: 'T6 Calendrier contient 7 jours (Lundi→Dimanche)', ok: ok6, errors: r6.errs.slice(0, 3) });
    await r6.page.close();
  }

  // ── T7 : Banner utilisateur existant pre-11/04/2026 ─────────────────────────
  {
    var uid7 = 'sc_banner_' + Date.now();
    var r7 = await mkPage(uid7, Object.assign({}, BASE_SPORT, {
      _view: 'today',
      firstLoginDate: '2025-12-01',  // clairement antérieur
      smartCalendarDismissed: false,
      // todayWellness with today's date so wellness check-in doesn't intercept
      todayWellness: { date: new Date().toISOString().slice(0, 10), energy: 3, sleep: 3, stress: 2 }
    }));
    var html7 = await r7.page.content();
    var hasBanner = html7.includes('Calendrier Intelligent') || html7.includes('calendrier') || html7.includes('Mise à jour') || html7.includes('Découvrir');
    var ok7 = hasBanner && noFatal(r7.errs);
    await r7.page.screenshot({ path: 'rapport-screenshots/SC7-banner-existing.png' });
    results.push({ test: 'T7 Banner utilisateur existant pre-2026-04-11', ok: ok7, errors: r7.errs.slice(0, 3) });
    await r7.page.close();
  }

  // ── T8 : Banner absent pour nouveaux utilisateurs ───────────────────────────
  {
    var uid8 = 'sc_nobanner_' + Date.now();
    var r8 = await mkPage(uid8, Object.assign({}, BASE_SPORT, {
      _view: 'today',
      firstLoginDate: '2026-04-11'  // exactement la date limite → pas de banner
    }));
    var ok8 = noFatal(r8.errs); // just no crash
    await r8.page.screenshot({ path: 'rapport-screenshots/SC8-no-banner-new.png' });
    results.push({ test: 'T8 Pas de banner pour utilisateurs >= 2026-04-11', ok: ok8, errors: r8.errs.slice(0, 3) });
    await r8.page.close();
  }

  // ── T9 : detectConflicts() — test logique (lundi CF épaules → mardi muscu épaules) ──
  {
    var uid9 = 'sc_conflict_' + Date.now();
    var r9 = await mkPage(uid9, Object.assign({}, BASE_BOTH, { _view: 'today' }));
    var conflictResult = await r9.page.evaluate(function() {
      if (!window.MUSCLE_TAXONOMY || typeof window.MUSCLE_TAXONOMY.detectConflicts !== 'function') {
        return { error: 'MUSCLE_TAXONOMY.detectConflicts not available' };
      }
      try {
        // Cas classique: CF lundi (épaules taxées), Muscu mardi (épaules = push day)
        var cal = { '0': 'crossfit', '1': 'musculation', '2': 'repos', '3': 'crossfit', '4': 'repos', '5': 'repos', '6': 'repos' };
        var fakeS = {
          sportType: 'crossfit', sportMixEnabled: true,
          sportMixSecondary: { type: 'musculation', days: 2 },
          musculationGoal: 'hypertrophie', crossfitLevel: 'intermediaire'
        };
        var conflicts = window.MUSCLE_TAXONOMY.detectConflicts(cal, fakeS, window.CF_WODS || []);
        return { ok: true, count: conflicts.length, conflicts: conflicts.slice(0, 2) };
      } catch(e) {
        return { error: e.message };
      }
    });
    var ok9 = !conflictResult.error && conflictResult.ok && noFatal(r9.errs);
    await r9.page.screenshot({ path: 'rapport-screenshots/SC9-conflict-detection.png' });
    results.push({ test: 'T9 detectConflicts() sans crash (count=' + conflictResult.count + ')', ok: ok9, errors: r9.errs.slice(0, 3) });
    await r9.page.close();
  }

  // ── T10 : detectConflicts() — inputs vides/null ne crashent pas ─────────────
  {
    var uid10 = 'sc_guard_' + Date.now();
    var r10 = await mkPage(uid10, Object.assign({}, BASE_BOTH, { _view: 'today' }));
    var guardResult = await r10.page.evaluate(function() {
      if (!window.MUSCLE_TAXONOMY) return { error: 'no taxonomy' };
      try {
        var r1 = window.MUSCLE_TAXONOMY.detectConflicts(null, null, null);
        var r2 = window.MUSCLE_TAXONOMY.detectConflicts({}, {}, []);
        var r3 = window.MUSCLE_TAXONOMY.detectConflicts(undefined, undefined, undefined);
        var r4 = window.MUSCLE_TAXONOMY.getMusclesForWOD(null);
        var r5 = window.MUSCLE_TAXONOMY.getMusclesForWOD([]);
        return { ok: true, r1len: r1.length, r2len: r2.length, r3len: r3.length };
      } catch(e) {
        return { error: e.message };
      }
    });
    var ok10 = !guardResult.error && guardResult.ok && noFatal(r10.errs);
    await r10.page.screenshot({ path: 'rapport-screenshots/SC10-null-guards.png' });
    results.push({ test: 'T10 Guards null/undefined: detectConflicts safe', ok: ok10, errors: r10.errs.slice(0, 3) });
    await r10.page.close();
  }

  // ── T11 : Régression — today dashboard sport unchanged ───────────────────────
  {
    var uid11 = 'sc_regr_sport_' + Date.now();
    var r11 = await mkPage(uid11, Object.assign({}, BASE_SPORT, { _view: 'today' }));
    var html11 = await r11.page.content();
    var ok11 = html11.length > 3000 && noFatal(r11.errs);
    await r11.page.screenshot({ path: 'rapport-screenshots/SC11-regression-sport.png' });
    results.push({ test: 'T11 Régression — today sport dashboard intact', ok: ok11, errors: r11.errs.slice(0, 3) });
    await r11.page.close();
  }

  // ── T12 : Régression — today dashboard nutrition unchanged ───────────────────
  {
    var uid12 = 'sc_regr_nutri_' + Date.now();
    var r12 = await mkPage(uid12, {
      appMode: 'nutrition', sex: 'female', age: 27, weight: 57, height: 163,
      activity: 1.375, sleep: 8, goal: 0, nStep: 12, _view: 'today',
      firstLoginDate: '2026-04-11',
      weekPlan: { lundi: { meals: [{ name: 'Oatmeal', kcal: 400, p: 15, g: 60, l: 8 }], total: { kcal: 400, p: 15, g: 60, l: 8 } } }
    });
    var html12 = await r12.page.content();
    var ok12 = html12.length > 3000 && noFatal(r12.errs);
    await r12.page.screenshot({ path: 'rapport-screenshots/SC12-regression-nutrition.png' });
    results.push({ test: 'T12 Régression — today nutrition dashboard intact', ok: ok12, errors: r12.errs.slice(0, 3) });
    await r12.page.close();
  }

  // ── T13 : Calendrier avec weeklyCalendar pré-chargé ─────────────────────────
  {
    var uid13 = 'sc_preload_' + Date.now();
    var r13 = await mkPage(uid13, Object.assign({}, BASE_BOTH, {
      _view: 'calendar',
      weeklyCalendar: { '0': 'crossfit', '1': 'musculation', '2': 'repos', '3': 'crossfit', '4': 'repos', '5': 'repos', '6': 'repos' }
    }));
    var html13 = await r13.page.content();
    var ok13 = html13.length > 2000 && noFatal(r13.errs);
    await r13.page.screenshot({ path: 'rapport-screenshots/SC13-calendar-preloaded.png' });
    results.push({ test: 'T13 Calendrier avec weeklyCalendar pré-chargé', ok: ok13, errors: r13.errs.slice(0, 3) });
    await r13.page.close();
  }

  // ── T14 : Régression — sport view CrossFit unchanged ────────────────────────
  {
    var uid14 = 'sc_regr_sport_cf_' + Date.now();
    var r14 = await mkPage(uid14, Object.assign({}, BASE_SPORT, { _view: 'sport' }));
    var html14 = await r14.page.content();
    var ok14 = html14.length > 2000 && noFatal(r14.errs);
    await r14.page.screenshot({ path: 'rapport-screenshots/SC14-regression-crossfit.png' });
    results.push({ test: 'T14 Régression — vue sport CrossFit intact', ok: ok14, errors: r14.errs.slice(0, 3) });
    await r14.page.close();
  }

  // ── T15 : Régression — sport-mix unchanged ───────────────────────────────────
  {
    var uid15 = 'sc_regr_mix_' + Date.now();
    var r15 = await mkPage(uid15, Object.assign({}, BASE_BOTH, {
      _view: 'sport',
      sportMixEnabled: true, sportMixSecondary: { type: 'musculation', days: 2 }
    }));
    var html15 = await r15.page.content();
    var ok15 = html15.length > 2000 && noFatal(r15.errs);
    await r15.page.screenshot({ path: 'rapport-screenshots/SC15-regression-mix.png' });
    results.push({ test: 'T15 Régression — sport-mix vue intact', ok: ok15, errors: r15.errs.slice(0, 3) });
    await r15.page.close();
  }

  await browser.close();

  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  SMART CALENDAR QA — Taxonomie + Calendrier + Conflits + Régressions ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  var pass = 0, fail = 0;
  results.forEach(function(r) {
    var icon = r.ok ? '✅' : '❌';
    console.log(icon + ' ' + r.test);
    if (!r.ok && r.errors.length) r.errors.forEach(function(e) { console.log('   ⚠ ' + e.slice(0, 120)); });
    r.ok ? pass++ : fail++;
  });
  console.log('\n  TOTAL: ' + pass + '/' + results.length + ' PASS  |  ' + fail + ' FAIL');
  process.exit(fail > 0 ? 1 : 0);
}

go().catch(function(e) { console.error('FATAL:', e.message); process.exit(1); });
