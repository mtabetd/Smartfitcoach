/**
 * SmartFitCoach — Crash & Coherence Tests for the Meal Generation Engine
 * Tests: filterRecipes, pickRecipe, enrichWithScaling, generateWeek, swapMeal
 *
 * 15 tests covering crash and incoherence scenarios.
 * Run: node test-crash-recipes.js
 */

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3000';
const fs = require('fs');
if (!fs.existsSync('rapport-screenshots')) fs.mkdirSync('rapport-screenshots', { recursive: true });

async function go() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const results = [];

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function mkPage(uid, profile) {
    var ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    var page = await ctx.newPage();
    var errs = [];
    page.on('console', function(m) {
      if (m.type() === 'error') errs.push(m.text());
    });
    page.on('pageerror', function(e) {
      errs.push(e.message);
    });
    await ctx.addInitScript(function() {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
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
        window.S.view = d.p._view || 'nutrition';
      }
      if (window.computeNutritionState) window.computeNutritionState(false);
      if (window.render) window.render();
    }, { uid: uid, p: profile });
    await page.waitForTimeout(1500);
    return { page: page, ctx: ctx, errs: errs };
  }

  // Filtering: only keep genuine JS runtime errors
  function isCrashError(e) {
    return (
      e.includes('TypeError') ||
      e.includes('ReferenceError') ||
      e.includes('Cannot read') ||
      e.includes('Cannot set') ||
      e.includes('is not a function') ||
      e.includes('is not defined') ||
      e.includes('Maximum call stack') ||
      e.includes('Unexpected token') ||
      e.includes('SyntaxError') ||
      e.includes('RangeError')
    );
  }

  function noFatal(errs) {
    return errs.filter(isCrashError).length === 0;
  }

  function getFatalErrors(errs) {
    return errs.filter(isCrashError);
  }

  // Base profile with valid BMR inputs (weight, height, age, sex, activity, goal)
  const BASE_NUTRITION = {
    appMode: 'nutrition', sex: 'homme', age: 30, weight: 80, height: 180,
    activity: 2,  // modérément actif
    sleep: 7, goal: 2,  // maintien (index 2 = maintain)
    mealsPerDay: 3,
    nStep: 12, _view: 'nutrition',
    welcomeShown: true, appMode: 'nutrition',
    allergies: [],
    intolerances: [],
    regime: 0,   // omnivore
    halal: false,
    whey: false,
    cookLevel: 2,
    cuisines: [0],
    wantsDessert: false,
    excluded: '',
    train: [1, 3, 5],
    sportDays: 3
  };

  // ── T1 : Toutes les allergies cochées → pas de crash si pool vide ──────────
  {
    var uid = 'crash_t1_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      allergies: [
        'Gluten/Blé', 'Lait/Produits laitiers', 'Œufs',
        'Fruits à coque', 'Arachides', 'Poisson', 'Crustacés', 'Soja'
      ]
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        return {
          ok: true,
          planIsArray: Array.isArray(plan),
          planLength: Array.isArray(plan) ? plan.length : -1,
          planValid: !plan || plan.length === 0 || plan.length === 7
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.planValid && fatal.length === 0;
    results.push({
      test: 'T1 — Toutes les allergies cochées (pool vide)',
      ok: pass,
      detail: result.ok
        ? 'plan.length=' + result.planLength + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T1-all-allergies.png' });
    await r.ctx.close();
  }

  // ── T2 : Vegan + sans gluten + sans soja → pool très réduit ───────────────
  {
    var uid = 'crash_t2_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      regime: 3,  // végan
      allergies: ['Gluten/Blé', 'Soja']
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        return {
          ok: true,
          planIsArray: Array.isArray(plan),
          planLength: Array.isArray(plan) ? plan.length : -1,
          planValid: !plan || plan.length === 0 || plan.length === 7
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.planValid && fatal.length === 0;
    results.push({
      test: 'T2 — Vegan + sans gluten + sans soja (pool réduit)',
      ok: pass,
      detail: result.ok
        ? 'plan.length=' + result.planLength + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T2-vegan-gluten-soja.png' });
    await r.ctx.close();
  }

  // ── T3 : Halal + végétarien (contradiction) → comportement défini ──────────
  {
    var uid = 'crash_t3_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      regime: 2,   // végétarien
      halal: true  // filtre halal actif mais végétarien déjà sans viande
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        // Vérification: tous les repas non-null doivent avoir un nom
        var allHaveName = true;
        if (Array.isArray(plan)) {
          plan.forEach(function(day) {
            ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(slot) {
              if (day[slot] && !day[slot].n) allHaveName = false;
            });
          });
        }
        return {
          ok: true,
          planLength: Array.isArray(plan) ? plan.length : -1,
          planValid: !plan || plan.length === 0 || plan.length === 7,
          allHaveName: allHaveName
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.planValid && fatal.length === 0;
    results.push({
      test: 'T3 — Halal + végétarien (comportement défini, pas de crash)',
      ok: pass,
      detail: result.ok
        ? 'plan.length=' + result.planLength + ', allHaveName=' + result.allHaveName + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T3-halal-vegetarien.png' });
    await r.ctx.close();
  }

  // ── T4 : mealsPerDay=2 → snack et diner null, affichage correct ───────────
  {
    var uid = 'crash_t4_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      mealsPerDay: 2
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan) || plan.length === 0) return { ok: false, error: 'empty plan' };
        // mealsPerDay=2 → snack=null AND dinner=null for every day
        var snackNull = plan.every(function(d) { return d.snack === null || d.snack === undefined; });
        var dinnerNull = plan.every(function(d) { return d.dinner === null || d.dinner === undefined; });
        var breakfastOk = plan.every(function(d) { return d.breakfast && d.breakfast.n; });
        var lunchOk = plan.every(function(d) { return d.lunch && d.lunch.n; });
        return {
          ok: true,
          planLength: plan.length,
          snackNull: snackNull,
          dinnerNull: dinnerNull,
          breakfastOk: breakfastOk,
          lunchOk: lunchOk
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    // Also render step9 to verify display doesn't crash
    await r.page.evaluate(function() {
      if (window.S && window.render) {
        window.S.nStep = 12;
        window.S.view = 'nutrition';
        window.render();
      }
    });
    await r.page.waitForTimeout(800);
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.snackNull && result.dinnerNull && result.breakfastOk && result.lunchOk && fatal.length === 0;
    results.push({
      test: 'T4 — mealsPerDay=2 (jeûne) → snack=null, dinner=null, affichage correct',
      ok: pass,
      detail: result.ok
        ? 'snackNull=' + result.snackNull + ', dinnerNull=' + result.dinnerNull + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T4-meals2-jeune.png' });
    await r.ctx.close();
  }

  // ── T5 : mealsPerDay=4 → collation non null ────────────────────────────────
  {
    var uid = 'crash_t5_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      mealsPerDay: 4
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan) || plan.length === 0) return { ok: false, error: 'empty plan' };
        var snackPresent = plan.every(function(d) { return d.snack !== null && d.snack !== undefined && d.snack.n; });
        return {
          ok: true,
          planLength: plan.length,
          snackPresent: snackPresent
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.snackPresent && fatal.length === 0;
    results.push({
      test: 'T5 — mealsPerDay=4 → collation incluse (snack non null)',
      ok: pass,
      detail: result.ok
        ? 'snackPresent=' + result.snackPresent + ', plan.length=' + result.planLength + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T5-meals4-snack.png' });
    await r.ctx.close();
  }

  // ── T6 : wantsDessert=true + toutes allergies → aucun dessert possible ─────
  {
    var uid = 'crash_t6_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      mealsPerDay: 4,
      wantsDessert: true,
      allergies: [
        'Gluten/Blé', 'Lait/Produits laitiers', 'Œufs',
        'Fruits à coque', 'Arachides', 'Poisson', 'Crustacés', 'Soja'
      ]
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        return {
          ok: true,
          planIsArray: Array.isArray(plan),
          planLength: Array.isArray(plan) ? plan.length : -1,
          planValid: !plan || plan.length === 0 || plan.length === 7
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.planValid && fatal.length === 0;
    results.push({
      test: 'T6 — wantsDessert=true + toutes allergies → pas de crash',
      ok: pass,
      detail: result.ok
        ? 'plan.length=' + result.planLength + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T6-dessert-all-allergies.png' });
    await r.ctx.close();
  }

  // ── T7 : whey=true + regime=3 (vegan) → pas de smoothie whey servi ────────
  {
    var uid = 'crash_t7_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      mealsPerDay: 4,
      whey: true,
      regime: 3   // végan
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan)) return { ok: false, error: 'not an array' };
        // regime=3 (vegan) → _useSmoothing=false → no smoothie snacks
        var noSmoothie = plan.every(function(d) {
          return !d.snack || !d.snack._smoothie;
        });
        // Verify no whey ingredient in any snack
        var noWheyTag = plan.every(function(d) {
          if (!d.snack) return true;
          var tags = d.snack.tags || [];
          return tags.indexOf('smoothie') === -1 && tags.indexOf('whey') === -1;
        });
        return {
          ok: true,
          planLength: plan.length,
          noSmoothie: noSmoothie,
          noWheyTag: noWheyTag
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.noSmoothie && result.noWheyTag && fatal.length === 0;
    results.push({
      test: 'T7 — whey=true + regime=3 (vegan) → pas de smoothie whey servi',
      ok: pass,
      detail: result.ok
        ? 'noSmoothie=' + result.noSmoothie + ', noWheyTag=' + result.noWheyTag + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T7-whey-vegan.png' });
    await r.ctx.close();
  }

  // ── T8 : weekPlan généré, puis swapMeal() → pas de crash ─────────────────
  {
    var uid = 'crash_t8_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, { mealsPerDay: 3 });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan) || plan.length !== 7) return { ok: false, error: 'plan not 7 days' };
        window.S.weekPlan = plan;
        // swapMeal(0, 'breakfast')
        window.swapMeal(0, 'breakfast');
        var newBreakfast = window.S.weekPlan[0] && window.S.weekPlan[0].breakfast;
        return {
          ok: true,
          planLength: plan.length,
          swappedBreakfast: newBreakfast ? newBreakfast.n : null
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && fatal.length === 0;
    results.push({
      test: 'T8 — weekPlan généré puis swapMeal(0, breakfast) → pas de crash',
      ok: pass,
      detail: result.ok
        ? 'swappedBreakfast=' + result.swappedBreakfast + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T8-swap-breakfast.png' });
    await r.ctx.close();
  }

  // ── T9 : swapMeal() sur slot vide (snack avec mealsPerDay=3) ──────────────
  {
    var uid = 'crash_t9_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, { mealsPerDay: 3 });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan) || plan.length !== 7) return { ok: false, error: 'plan not 7 days' };
        window.S.weekPlan = plan;
        // snack is null when mealsPerDay=3 → swapMeal should silently return
        window.swapMeal(0, 'snack');
        // snack should still be null (no crash, no change)
        var snackAfterSwap = window.S.weekPlan[0] && window.S.weekPlan[0].snack;
        return {
          ok: true,
          snackStillNull: !snackAfterSwap
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.snackStillNull && fatal.length === 0;
    results.push({
      test: 'T9 — swapMeal() sur slot vide (snack, mealsPerDay=3) → pas de crash',
      ok: pass,
      detail: result.ok
        ? 'snackStillNull=' + result.snackStillNull + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T9-swap-empty-slot.png' });
    await r.ctx.close();
  }

  // ── T10 : cBase=0 (TDEE=0, weight=0) → pas de crash ──────────────────────
  // NOTE: calcBMR()=0 quand weight=0, MAIS calcTarget() applique un plancher
  // calorique sexe-spécifique (1500 kcal hommes, 1400 kcal femmes) — donc
  // generateWeek() NE retourne PAS [] mais génère quand même un plan valide.
  // Le test vérifie: pas de crash, pas de TypeError, affichage nStep=12 stable.
  {
    var uid = 'crash_t10_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, {
      weight: 0,   // calcBMR()=0, mais plancher calorique 1500 dans calcTarget()
      nStep: 12
    });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        // Force weight=0 for this test
        window.S.weight = 0;
        if (window.computeNutritionState) window.computeNutritionState(false);
        var bmr = window.calcBMR ? window.calcBMR() : -1;
        var target = window.calcTarget ? window.calcTarget() : -1;
        var plan = window.generateWeek ? window.generateWeek() : null;
        // calcBMR()=0 but calcTarget() has a floor (1500 homme / 1400 femme)
        // so plan may be empty (if calcTarget=0 path) OR 7-day (if floor kicks in)
        var planValid = Array.isArray(plan) && (plan.length === 0 || plan.length === 7);
        return {
          ok: true,
          bmr: bmr,
          target: target,
          planLength: Array.isArray(plan) ? plan.length : -1,
          planValid: planValid
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    // Render nStep=12 — must not crash regardless of plan state
    await r.page.evaluate(function() {
      if (window.S && window.render) {
        window.S.nStep = 12;
        window.S.view = 'nutrition';
        window.render();
      }
    });
    await r.page.waitForTimeout(800);
    var bodyText = await r.page.evaluate(function() { return document.body.innerText; });
    var fatal = getFatalErrors(r.errs);
    // Display must not crash — either shows planning or a friendly error message
    var displayHandled = bodyText.length > 10 && !bodyText.includes('Cannot read');
    var pass = result.ok && result.planValid && displayHandled && fatal.length === 0;
    results.push({
      test: 'T10 — weight=0 (calcBMR=0) → pas de crash, plancher calorique actif',
      ok: pass,
      detail: result.ok
        ? 'bmr=' + result.bmr + ', target=' + result.target + ', plan.length=' + result.planLength + ', displayHandled=' + displayHandled + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T10-weight-zero.png' });
    await r.ctx.close();
  }

  // ── T11 : plan déjà généré + goal change → _planHash différent → régénéré ─
  {
    var uid = 'crash_t11_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, { goal: 2 }); // maintien
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan1 = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan1) || plan1.length !== 7) return { ok: false, error: 'initial plan failed' };
        window.S.weekPlan = plan1;
        var hash1 = window.getPlanHash ? window.getPlanHash() : '';
        window.S._planHash = hash1;
        // Change goal → hash must differ
        window.S.goal = 3;  // perte de poids
        var hash2 = window.getPlanHash ? window.getPlanHash() : '';
        var hashChanged = hash1 !== hash2;
        // Simulate renderStep9: regenerate if hash differs
        var plan2 = null;
        if (hashChanged) {
          window.S._planHash = hash2;
          if (window.computeNutritionState) window.computeNutritionState(false);
          plan2 = window.generateWeek ? window.generateWeek() : null;
          if (Array.isArray(plan2) && plan2.length === 7) window.S.weekPlan = plan2;
        }
        return {
          ok: true,
          hashChanged: hashChanged,
          plan2Length: Array.isArray(plan2) ? plan2.length : (hashChanged ? -1 : 7)
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.hashChanged && result.plan2Length === 7 && fatal.length === 0;
    results.push({
      test: 'T11 — goal change → _planHash différent → plan régénéré',
      ok: pass,
      detail: result.ok
        ? 'hashChanged=' + result.hashChanged + ', plan2.length=' + result.plan2Length + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T11-goal-change-rehash.png' });
    await r.ctx.close();
  }

  // ── T12 : plan déjà généré + allergy ajoutée → _planHash différent ────────
  {
    var uid = 'crash_t12_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, { allergies: [] });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan1 = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan1) || plan1.length !== 7) return { ok: false, error: 'initial plan failed' };
        window.S.weekPlan = plan1;
        var hash1 = window.getPlanHash ? window.getPlanHash() : '';
        window.S._planHash = hash1;
        // Add an allergy
        window.S.allergies = ['Gluten/Blé'];
        var hash2 = window.getPlanHash ? window.getPlanHash() : '';
        var hashChanged = hash1 !== hash2;
        // Simulate re-generation
        var plan2 = null;
        if (hashChanged) {
          window.S._planHash = hash2;
          if (window.computeNutritionState) window.computeNutritionState(false);
          plan2 = window.generateWeek ? window.generateWeek() : null;
          if (Array.isArray(plan2) && plan2.length > 0) window.S.weekPlan = plan2;
        }
        return {
          ok: true,
          hashChanged: hashChanged,
          plan2Length: Array.isArray(plan2) ? plan2.length : (hashChanged ? -1 : 7)
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.hashChanged && result.plan2Length === 7 && fatal.length === 0;
    results.push({
      test: 'T12 — allergy ajoutée → _planHash différent → plan régénéré',
      ok: pass,
      detail: result.ok
        ? 'hashChanged=' + result.hashChanged + ', plan2.length=' + result.plan2Length + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T12-allergy-rehash.png' });
    await r.ctx.close();
  }

  // ── T13 : Recettes R201+ (scaled) → enrichWithScaling non null ────────────
  {
    var uid = 'crash_t13_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION);
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan) || plan.length !== 7) return { ok: false, error: 'plan failed' };
        // Check enrichWithScaling directly with a mock R201+ recipe
        var mockR201 = {
          _id: 'R201', n: 'Test Recipe R201', k: 500, p: 35, g: 45, l: 18,
          lv: 1, f: '🥗', i: 'Poulet, riz complet, légumes', w: 0, tags: [], st: []
        };
        var enriched = window.enrichWithScaling ? window.enrichWithScaling(mockR201, 600) : mockR201;
        var noNullCrash = enriched !== null && enriched !== undefined;
        var hasK = typeof enriched.k === 'number';
        // Check no plans have null recipe objects with property access
        var planNoCrash = true;
        plan.forEach(function(day) {
          ['breakfast', 'lunch', 'snack', 'dinner'].forEach(function(slot) {
            var meal = day[slot];
            if (meal) {
              // Access .n, .k — if this throws, planNoCrash = false
              try {
                var _n = meal.n;
                var _k = meal.k;
              } catch (e2) {
                planNoCrash = false;
              }
            }
          });
        });
        return {
          ok: true,
          planLength: plan.length,
          enrichedOk: noNullCrash && hasK,
          planNoCrash: planNoCrash
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.enrichedOk && result.planNoCrash && fatal.length === 0;
    results.push({
      test: 'T13 — Recettes R201+ (scaled) → enrichWithScaling non null, pas de crash',
      ok: pass,
      detail: result.ok
        ? 'enrichedOk=' + result.enrichedOk + ', planNoCrash=' + result.planNoCrash + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T13-scaled-r201.png' });
    await r.ctx.close();
  }

  // ── T14 : weekPlan[6] (dimanche) → affichage → pas de crash ──────────────
  {
    var uid = 'crash_t14_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, { selectedDay: 6 });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan) || plan.length !== 7) return { ok: false, error: 'plan not 7 days: ' + JSON.stringify(plan && plan.length) };
        window.S.weekPlan = plan;
        window.S.selectedDay = 6;
        // Access sunday (index 6)
        var sunday = plan[6];
        var hasSunday = sunday !== null && sunday !== undefined;
        var sundayBreakfast = sunday && sunday.breakfast ? sunday.breakfast.n : null;
        return {
          ok: true,
          planLength: plan.length,
          hasSunday: hasSunday,
          sundayBreakfast: sundayBreakfast
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    // Render selectedDay=6 in nStep=12
    await r.page.evaluate(function() {
      if (window.S && window.render) {
        window.S.nStep = 12;
        window.S.view = 'nutrition';
        window.S.selectedDay = 6;
        window.render();
      }
    });
    await r.page.waitForTimeout(800);
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && result.hasSunday && fatal.length === 0;
    results.push({
      test: 'T14 — weekPlan[6] (dimanche, index 6) → affichage sans crash',
      ok: pass,
      detail: result.ok
        ? 'hasSunday=' + result.hasSunday + ', sundayBreakfast=' + result.sundayBreakfast + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T14-sunday-display.png' });
    await r.ctx.close();
  }

  // ── T15 : selectedDay=6 + swapMeal('dinner') → pas de crash ──────────────
  {
    var uid = 'crash_t15_' + Date.now();
    var profile = Object.assign({}, BASE_NUTRITION, { selectedDay: 6, mealsPerDay: 3 });
    var r = await mkPage(uid, profile);
    var result = await r.page.evaluate(function() {
      try {
        if (window.computeNutritionState) window.computeNutritionState(false);
        var plan = window.generateWeek ? window.generateWeek() : null;
        if (!Array.isArray(plan) || plan.length !== 7) return { ok: false, error: 'plan not 7 days' };
        window.S.weekPlan = plan;
        window.S.selectedDay = 6;
        var dinnerBefore = plan[6].dinner ? plan[6].dinner.n : null;
        // swapMeal(6, 'dinner')
        window.swapMeal(6, 'dinner');
        var dinnerAfter = window.S.weekPlan[6] && window.S.weekPlan[6].dinner ? window.S.weekPlan[6].dinner.n : null;
        return {
          ok: true,
          dinnerBefore: dinnerBefore,
          dinnerAfter: dinnerAfter,
          swapHappened: dinnerBefore !== dinnerAfter
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    var fatal = getFatalErrors(r.errs);
    var pass = result.ok && fatal.length === 0;
    results.push({
      test: 'T15 — selectedDay=6 + swapMeal(dinner) → pas de crash',
      ok: pass,
      detail: result.ok
        ? 'dinnerBefore=' + result.dinnerBefore + ', dinnerAfter=' + result.dinnerAfter + ', swapHappened=' + result.swapHappened + ', fatal=' + fatal.length
        : 'EXCEPTION: ' + result.error,
      errors: fatal.slice(0, 2)
    });
    await r.page.screenshot({ path: 'rapport-screenshots/T15-swap-sunday-dinner.png' });
    await r.ctx.close();
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────

  await browser.close();

  var pass = results.filter(function(r) { return r.ok; }).length;
  var fail = results.filter(function(r) { return !r.ok; }).length;

  console.log('\n');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('## RAPPORT CRASH-RECIPES');
  console.log('');
  console.log('### Résumé: ' + pass + '/15 PASS, ' + fail + ' FAIL');
  console.log('');

  results.forEach(function(r, i) {
    var mark = r.ok ? 'PASS' : 'FAIL';
    console.log((i + 1) + '. [' + mark + '] ' + r.test);
    console.log('   Detail: ' + r.detail);
    if (r.errors && r.errors.length > 0) {
      r.errors.forEach(function(e) {
        console.log('   Error: ' + e.slice(0, 120));
      });
    }
  });

  if (fail > 0) {
    console.log('');
    console.log('### Bugs détectés:');
    results.filter(function(r) { return !r.ok; }).forEach(function(r) {
      console.log('');
      console.log('- Test: ' + r.test);
      console.log('  Detail: ' + r.detail);
      if (r.errors && r.errors.length > 0) {
        console.log('  Errors:');
        r.errors.forEach(function(e) { console.log('    ' + e.slice(0, 200)); });
      }
    });
  }
  console.log('══════════════════════════════════════════════════════════════');
}

go().catch(function(e) {
  console.error('FATAL:', e);
  process.exit(1);
});
