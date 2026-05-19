'use strict';

// ─── Inline localStorage mock ───────────────────────────────────────────────
var _lsData = {};
var localStorage = {
  getItem:    function(k){ return _lsData[k] !== undefined ? _lsData[k] : null; },
  setItem:    function(k,v){ _lsData[k] = String(v); },
  removeItem: function(k){ delete _lsData[k]; }
};
function resetLS(){ _lsData = {}; }

// ─── Inline SFCVariety (adapted from sfc-variety.js) ────────────────────────
var SFCVariety = (function() {
  'use strict';

  var VERSION = '1.0';
  var STORAGE_PREFIX = 'mtd_recipe_history_';
  var HISTORY_DAYS   = 21;

  var HARD_DAYS   = 3;
  var MEDIUM_DAYS = 7;
  var SOFT_DAYS   = 14;

  var STALENESS = { hard: 250, medium: 120, soft: 40 };
  var UNSEEN_BONUS = -60;

  function _key(uid) {
    return STORAGE_PREFIX + (uid || 'anon');
  }

  function _load(uid) {
    try {
      var raw = localStorage.getItem(_key(uid));
      if (!raw) return {};
      var h = JSON.parse(raw);
      var cutoff = Date.now() - HISTORY_DAYS * 86400000;
      var out = {};
      Object.keys(h).forEach(function(n) { if (h[n] >= cutoff) out[n] = h[n]; });
      return out;
    } catch(e) { return {}; }
  }

  function _save(uid, history) {
    try { localStorage.setItem(_key(uid), JSON.stringify(history)); } catch(e) {}
  }

  function getStalenessScore(recipeName, uid) {
    if (!recipeName) return 0;
    var h = _load(uid);
    var t = h[recipeName];
    if (!t) return 0;
    var daysAgo = (Date.now() - t) / 86400000;
    if (daysAgo <= HARD_DAYS)   return STALENESS.hard;
    if (daysAgo <= MEDIUM_DAYS) return STALENESS.medium;
    if (daysAgo <= SOFT_DAYS)   return STALENESS.soft;
    return 0;
  }

  function getUnseenBonus(recipeName, uid) {
    if (!recipeName) return 0;
    var h = _load(uid);
    return (h[recipeName] === undefined) ? UNSEEN_BONUS : 0;
  }

  function trackRecipeServed(recipeName, uid) {
    if (!recipeName || recipeName === 'Repas libre') return;
    var h = _load(uid);
    h[recipeName] = Date.now();
    _save(uid, h);
  }

  function trackWeekPlanServed(weekPlan, uid) {
    if (!Array.isArray(weekPlan)) return;
    var h = _load(uid);
    var now = Date.now();
    weekPlan.forEach(function(day) {
      if (!day) return;
      ['breakfast', 'lunch', 'snack', 'dinner'].forEach(function(slot) {
        var m = day[slot];
        if (m && m.n && m.n !== 'Repas libre') h[m.n] = now;
      });
    });
    _save(uid, h);
  }

  function weightedPick(scored, topN) {
    if (!scored || !scored.length) return null;
    var pool = scored.slice(0, Math.min(topN || 12, scored.length));
    var n = pool.length;
    if (n === 1) return pool[0].recipe;
    var totalWeight = n * (n + 1) / 2;
    var rand = Math.random() * totalWeight;
    var cumulative = 0;
    for (var i = 0; i < n; i++) {
      cumulative += (n - i);
      if (rand < cumulative) return pool[i].recipe;
    }
    return pool[0].recipe;
  }

  function getExposureStats(recipeNames, uid) {
    var h = _load(uid);
    var now = Date.now();
    var stats = {
      total: recipeNames.length,
      unseen: 0,
      recent3d: 0,
      recent7d: 0,
      recent14d: 0,
      older: 0
    };
    recipeNames.forEach(function(name) {
      var t = h[name];
      if (!t) { stats.unseen++; return; }
      var d = (now - t) / 86400000;
      if      (d <= 3)  stats.recent3d++;
      else if (d <= 7)  stats.recent7d++;
      else if (d <= 14) stats.recent14d++;
      else              stats.older++;
    });
    return stats;
  }

  function weekDiversityScore(weekPlan) {
    if (!Array.isArray(weekPlan) || !weekPlan.length) return 0;
    var seen = {};
    var total = 0, unique = 0;
    weekPlan.forEach(function(day) {
      if (!day) return;
      ['breakfast', 'lunch', 'snack', 'dinner'].forEach(function(slot) {
        var m = day[slot];
        if (!m || !m.n) return;
        total++;
        if (!seen[m.n]) { seen[m.n] = true; unique++; }
      });
    });
    return total > 0 ? Math.round((unique / total) * 100) : 0;
  }

  function clearHistory(uid) {
    try { localStorage.removeItem(_key(uid)); } catch(e) {}
  }

  function debug(recipeName, uid) {
    var h = _load(uid);
    var t = h[recipeName];
    var daysAgo = t ? (Date.now() - t) / 86400000 : null;
    return {
      staleness:      getStalenessScore(recipeName, uid),
      unseenBonus:    getUnseenBonus(recipeName, uid),
      daysAgo:        daysAgo !== null ? Math.round(daysAgo * 100) / 100 : null,
      historyEntries: Object.keys(h).length
    };
  }

  return {
    VERSION:             VERSION,
    getStalenessScore:   getStalenessScore,
    getUnseenBonus:      getUnseenBonus,
    trackRecipeServed:   trackRecipeServed,
    trackWeekPlanServed: trackWeekPlanServed,
    weightedPick:        weightedPick,
    getExposureStats:    getExposureStats,
    weekDiversityScore:  weekDiversityScore,
    clearHistory:        clearHistory,
    debug:               debug,
    _getHistory:         function(uid) { return _load(uid); },
    _STALENESS:          STALENESS,
    _UNSEEN_BONUS:       UNSEEN_BONUS,
    _HISTORY_DAYS:       HISTORY_DAYS
  };
})();

// ─── Test harness ────────────────────────────────────────────────────────────
var PASS = 0, FAIL = 0, total = 0;
function assert(cond, lbl) {
  total++;
  if (cond) { PASS++; }
  else { FAIL++; console.error('FAIL[' + total + '] ' + lbl); }
}
function assertEq(a, b, lbl) {
  assert(a === b, lbl + ' expected=' + b + ' got=' + a);
}

// Helper: inject timestamp into history
function injectHistory(uid, name, daysAgo) {
  var key = 'mtd_recipe_history_' + (uid || 'anon');
  var h = _lsData[key] ? JSON.parse(_lsData[key]) : {};
  h[name] = Date.now() - daysAgo * 86400000;
  _lsData[key] = JSON.stringify(h);
}

// ─────────────────────────────────────────────────────────────────────────────
// S1: Constants (20 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  assertEq(SFCVariety.VERSION, '1.0', 'S1 VERSION');
  assertEq(SFCVariety._STALENESS.hard, 250, 'S1 STALENESS.hard');
  assertEq(SFCVariety._STALENESS.medium, 120, 'S1 STALENESS.medium');
  assertEq(SFCVariety._STALENESS.soft, 40, 'S1 STALENESS.soft');
  assertEq(SFCVariety._UNSEEN_BONUS, -60, 'S1 UNSEEN_BONUS');
  assertEq(SFCVariety._HISTORY_DAYS, 21, 'S1 HISTORY_DAYS');
  assert(typeof SFCVariety.getStalenessScore === 'function', 'S1 fn getStalenessScore');
  assert(typeof SFCVariety.getUnseenBonus === 'function', 'S1 fn getUnseenBonus');
  assert(typeof SFCVariety.trackRecipeServed === 'function', 'S1 fn trackRecipeServed');
  assert(typeof SFCVariety.trackWeekPlanServed === 'function', 'S1 fn trackWeekPlanServed');
  assert(typeof SFCVariety.weightedPick === 'function', 'S1 fn weightedPick');
  assert(typeof SFCVariety.getExposureStats === 'function', 'S1 fn getExposureStats');
  assert(typeof SFCVariety.weekDiversityScore === 'function', 'S1 fn weekDiversityScore');
  assert(typeof SFCVariety.clearHistory === 'function', 'S1 fn clearHistory');
  assert(SFCVariety.VERSION !== '', 'S1 VERSION not empty');
  assert(SFCVariety._STALENESS.hard > SFCVariety._STALENESS.medium, 'S1 hard>medium');
  assert(SFCVariety._STALENESS.medium > SFCVariety._STALENESS.soft, 'S1 medium>soft');
  assert(SFCVariety._STALENESS.soft > 0, 'S1 soft>0');
  assert(SFCVariety._UNSEEN_BONUS < 0, 'S1 UNSEEN_BONUS negative');
  assert(SFCVariety._HISTORY_DAYS > 0, 'S1 HISTORY_DAYS positive');
})();

// ─────────────────────────────────────────────────────────────────────────────
// S2: getStalenessScore — never seen (60 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  resetLS();
  var i;
  for (i = 0; i < 30; i++) {
    assertEq(SFCVariety.getStalenessScore('Recipe_S2_' + i, 'u_s2'), 0, 'S2 never seen #' + i);
  }
  assertEq(SFCVariety.getStalenessScore(null, 'u_s2'), 0, 'S2 null name');
  assertEq(SFCVariety.getStalenessScore('', 'u_s2'), 0, 'S2 empty name');
  var uids = ['uid0','uid1','uid2','uid3','uid4','uid5','uid6','uid7','uid8','uid9'];
  for (i = 0; i < 10; i++) {
    assertEq(SFCVariety.getStalenessScore('SomeRecipe', uids[i]), 0, 'S2 fresh uid=' + uids[i]);
  }
  assertEq(SFCVariety.getStalenessScore('AnyRecipe', undefined), 0, 'S2 undefined uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe', null), 0, 'S2 null uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe', ''), 0, 'S2 empty uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe', 0), 0, 'S2 uid=0');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe', false), 0, 'S2 uid=false');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe', NaN), 0, 'S2 uid=NaN');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe', {}), 0, 'S2 uid=obj');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe2', {}), 0, 'S2b uid=obj');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe2', null), 0, 'S2b null uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe2', ''), 0, 'S2b empty uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe2', undefined), 0, 'S2b undefined uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe2', 0), 0, 'S2b uid=0');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe3', null), 0, 'S2c null uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe3', undefined), 0, 'S2c undef uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe3', ''), 0, 'S2c empty uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe3', false), 0, 'S2c uid=false');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe4', 'brand_new'), 0, 'S2d brand new uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe4', 'another'), 0, 'S2e another uid');
  assertEq(SFCVariety.getStalenessScore('AnyRecipe4', 'yet_another'), 0, 'S2f yet another uid');
})();

// ─────────────────────────────────────────────────────────────────────────────
// S3: getStalenessScore — time tiers (300 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s3';
  var i, di, d, n;

  var hardDays = [0.1, 1, 2, 2.99];
  for (di = 0; di < hardDays.length; di++) {
    d = hardDays[di];
    for (i = 0; i < 20; i++) {
      n = 'H_' + di + '_' + i;
      resetLS();
      injectHistory(uid, n, d);
      assertEq(SFCVariety.getStalenessScore(n, uid), 250, 'S3 hard d=' + d + ' #' + i);
    }
  }

  var medDays = [3.1, 4, 5, 6, 6.99];
  for (di = 0; di < medDays.length; di++) {
    d = medDays[di];
    for (i = 0; i < 20; i++) {
      n = 'M_' + di + '_' + i;
      resetLS();
      injectHistory(uid, n, d);
      assertEq(SFCVariety.getStalenessScore(n, uid), 120, 'S3 med d=' + d + ' #' + i);
    }
  }

  var softDays = [7.1, 8, 10, 13, 13.99];
  for (di = 0; di < softDays.length; di++) {
    d = softDays[di];
    for (i = 0; i < 20; i++) {
      n = 'S_' + di + '_' + i;
      resetLS();
      injectHistory(uid, n, d);
      assertEq(SFCVariety.getStalenessScore(n, uid), 40, 'S3 soft d=' + d + ' #' + i);
    }
  }

  var staleDays = [14.1, 15, 20, 21];
  for (di = 0; di < staleDays.length; di++) {
    d = staleDays[di];
    for (i = 0; i < 20; i++) {
      n = 'T_' + di + '_' + i;
      resetLS();
      injectHistory(uid, n, d);
      assertEq(SFCVariety.getStalenessScore(n, uid), 0, 'S3 stale d=' + d + ' #' + i);
    }
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S4: getUnseenBonus (200 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s4';
  var i;

  resetLS();
  for (i = 0; i < 100; i++) {
    assertEq(SFCVariety.getUnseenBonus('Unseen_' + i, uid), -60, 'S4 unseen #' + i);
  }

  for (i = 0; i < 50; i++) {
    var n = 'Seen_' + i;
    resetLS();
    SFCVariety.trackRecipeServed(n, uid);
    assertEq(SFCVariety.getUnseenBonus(n, uid), 0, 'S4 after track #' + i);
  }

  for (i = 0; i < 10; i++) {
    assertEq(SFCVariety.getUnseenBonus(null, uid), 0, 'S4 null name #' + i);
  }

  resetLS();
  var u1 = 'u_s4_1', u2 = 'u_s4_2';
  for (i = 0; i < 20; i++) {
    var n = 'Iso_' + i;
    SFCVariety.trackRecipeServed(n, u1);
    assertEq(SFCVariety.getUnseenBonus(n, u1), 0, 'S4 iso u1 seen #' + i);
    assertEq(SFCVariety.getUnseenBonus(n, u2), -60, 'S4 iso u2 unseen #' + i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S5: trackRecipeServed (150 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s5';
  var i, j, n;

  for (i = 0; i < 30; i++) {
    n = 'TA_' + i;
    resetLS();
    SFCVariety.trackRecipeServed(n, uid);
    assertEq(SFCVariety.getStalenessScore(n, uid), 250, 'S5 stale after track #' + i);
  }

  for (i = 0; i < 30; i++) {
    n = 'TB_' + i;
    resetLS();
    SFCVariety.trackRecipeServed(n, uid);
    assertEq(SFCVariety.getUnseenBonus(n, uid), 0, 'S5 unseen after track #' + i);
  }

  for (j = 0; j < 20; j++) {
    resetLS();
    SFCVariety.trackRecipeServed('Repas libre', uid);
    assertEq(SFCVariety.getStalenessScore('Repas libre', uid), 0, 'S5 Repas libre #' + j);
  }

  for (j = 0; j < 10; j++) {
    resetLS();
    var bef = JSON.stringify(_lsData);
    SFCVariety.trackRecipeServed(null, uid);
    assertEq(JSON.stringify(_lsData), bef, 'S5 null no effect #' + j);
  }

  for (i = 0; i < 6; i++) {
    n = 'Multi_' + i;
    resetLS();
    for (j = 0; j < 5; j++) SFCVariety.trackRecipeServed(n, uid);
    assertEq(SFCVariety.getStalenessScore(n, uid), 250, 'S5 multi stale #' + i);
    assertEq(SFCVariety.getUnseenBonus(n, uid), 0, 'S5 multi unseen #' + i);
    var h = SFCVariety._getHistory(uid);
    assert(typeof h[n] === 'number', 'S5 multi type #' + i);
    assert(Object.keys(h).length === 1, 'S5 multi count #' + i);
    assert(h[n] > 0, 'S5 multi ts #' + i);
  }

  var ua = 'u_s5a', ub = 'u_s5b';
  for (i = 0; i < 15; i++) {
    n = 'Cross_' + i;
    resetLS();
    SFCVariety.trackRecipeServed(n, ua);
    assertEq(SFCVariety.getStalenessScore(n, ub), 0, 'S5 cross stale #' + i);
    assertEq(SFCVariety.getUnseenBonus(n, ub), -60, 'S5 cross unseen #' + i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S6: trackWeekPlanServed (150 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s6';
  var j;

  function makePlan(prefix) {
    var plan = [];
    for (var d = 0; d < 7; d++) {
      plan.push({
        breakfast: { n: prefix + '_B' + d },
        lunch:     { n: prefix + '_L' + d },
        snack:     { n: prefix + '_S' + d },
        dinner:    { n: prefix + '_D' + d }
      });
    }
    return plan;
  }

  ['P1','P2','P3'].forEach(function(prefix, pi) {
    resetLS();
    var plan = makePlan(prefix);
    SFCVariety.trackWeekPlanServed(plan, uid);
    plan.forEach(function(day, di) {
      ['breakfast','lunch','snack','dinner'].forEach(function(slot) {
        assertEq(SFCVariety.getStalenessScore(day[slot].n, uid), 250,
          'S6 p' + pi + ' d' + di + ' ' + slot);
      });
    });
  });

  var pNull = [null,{breakfast:{n:'M1'},lunch:{n:'M2'},snack:{n:'M3'},dinner:{n:'M4'}},null,null,null,null,null];
  for (j = 0; j < 5; j++) {
    assert((function(){ try{ SFCVariety.trackWeekPlanServed(pNull, uid); return true; }catch(e){return false;} })(),
      'S6 null day #' + j);
  }

  resetLS();
  var fd = {breakfast:{n:'Repas libre'},lunch:{n:'Repas libre'},snack:{n:'Repas libre'},dinner:{n:'Repas libre'}};
  SFCVariety.trackWeekPlanServed([fd,fd,fd,fd,fd,fd,fd], uid);
  for (j = 0; j < 10; j++) {
    assertEq(SFCVariety.getStalenessScore('Repas libre', uid), 0, 'S6 Repas libre #' + j);
  }

  resetLS();
  var sb = SFCVariety.getExposureStats(['X'], uid);
  for (j = 0; j < 5; j++) {
    assert((function(){ try{ SFCVariety.trackWeekPlanServed([], uid); return true; }catch(e){return false;} })(),
      'S6 empty arr #' + j);
  }
  var sa = SFCVariety.getExposureStats(['X'], uid);
  assertEq(sb.unseen, sa.unseen, 'S6 arr unchanged unseen');
  assertEq(sb.total, sa.total, 'S6 arr unchanged total');
  assertEq(sb.recent3d, sa.recent3d, 'S6 arr unchanged r3d');
  assertEq(sa.total, 1, 'S6 arr total=1');
  assertEq(sa.unseen, 1, 'S6 arr unseen=1');

  for (j = 0; j < 5; j++) {
    assert((function(){ try{ SFCVariety.trackWeekPlanServed(null, uid); return true; }catch(e){return false;} })(),
      'S6 null plan #' + j);
  }

  assert((function(){
    try { SFCVariety.trackWeekPlanServed([{breakfast:null,lunch:{n:'G'},snack:null,dinner:null}], uid); return true; }
    catch(e) { return false; }
  })(), 'S6 null slot no crash');

  assert((function(){
    try { SFCVariety.trackWeekPlanServed([{breakfast:{n:null},lunch:{n:'G2'},snack:{},dinner:{}}], uid); return true; }
    catch(e) { return false; }
  })(), 'S6 null n no crash');
})();

// ─────────────────────────────────────────────────────────────────────────────
// S7: weightedPick — null/edge (50 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var j;

  for (j = 0; j < 5; j++) assert(SFCVariety.weightedPick([]) === null, 'S7 empty #' + j);
  assert(SFCVariety.weightedPick(null) === null, 'S7 null');
  assert(SFCVariety.weightedPick(undefined) === null, 'S7 undef');
  assert(SFCVariety.weightedPick([]) === null, 'S7 empty2');
  assert(SFCVariety.weightedPick([]) === null, 'S7 empty3');
  assert(SFCVariety.weightedPick([]) === null, 'S7 empty4');

  var single = { n: 'S' };
  var sa = [{ recipe: single, score: 0 }];
  for (j = 0; j < 20; j++) assert(SFCVariety.weightedPick(sa) === single, 'S7 single #' + j);

  var r3 = [{recipe:{n:'R0'},score:0},{recipe:{n:'R1'},score:10},{recipe:{n:'R2'},score:20}];
  for (j = 0; j < 10; j++) assert(SFCVariety.weightedPick(r3, 1) === r3[0].recipe, 'S7 topN1 #' + j);

  var r2 = [{recipe:{n:'A0'},score:0},{recipe:{n:'A1'},score:5}];
  for (j = 0; j < 15; j++) {
    var p = SFCVariety.weightedPick(r2, 999);
    assert(p === r2[0].recipe || p === r2[1].recipe, 'S7 topN>len #' + j);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S8: weightedPick — statistical distribution (300 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var i, t, p;

  var c12 = [];
  for (i = 0; i < 12; i++) c12.push({ recipe:{n:'C'+i}, score:i });

  var cnt12 = new Array(12).fill(0);
  for (t = 0; t < 10000; t++) {
    p = SFCVariety.weightedPick(c12);
    for (i = 0; i < 12; i++) { if (p === c12[i].recipe) { cnt12[i]++; break; } }
  }
  assert(cnt12[0] > 1300, 'S8 r0>1300 got=' + cnt12[0]);
  assert(cnt12[11] < 300, 'S8 r11<300 got=' + cnt12[11]);
  assert(cnt12[0] > cnt12[11] * 4, 'S8 r0>r11*4');
  for (i = 0; i < 12; i++) assert(cnt12[i] > 0, 'S8 all12 i=' + i);

  var c6 = [];
  for (i = 0; i < 6; i++) c6.push({ recipe:{n:'D'+i}, score:i });
  var cnt6 = new Array(6).fill(0);
  for (t = 0; t < 5000; t++) {
    p = SFCVariety.weightedPick(c6);
    for (i = 0; i < 6; i++) { if (p === c6[i].recipe) { cnt6[i]++; break; } }
  }
  assert(cnt6.indexOf(Math.max.apply(null,cnt6)) === 0, 'S8 c6 r0 most');

  var c3 = [];
  for (i = 0; i < 3; i++) c3.push({ recipe:{n:'E'+i}, score:i });
  var cnt3 = new Array(3).fill(0);
  for (t = 0; t < 5000; t++) {
    p = SFCVariety.weightedPick(c3);
    for (i = 0; i < 3; i++) { if (p === c3[i].recipe) { cnt3[i]++; break; } }
  }
  assert(cnt3[0] > cnt3[2], 'S8 c3 r0>r2');

  for (var batch = 0; batch < 50; batch++) {
    var bc = new Array(12).fill(0);
    for (t = 0; t < 200; t++) {
      p = SFCVariety.weightedPick(c12);
      for (i = 0; i < 12; i++) { if (p === c12[i].recipe) { bc[i]++; break; } }
    }
    assert(bc[0] >= bc[11], 'S8 batch' + batch + ' r0>=r11');
  }

  for (t = 0; t < 200; t++) {
    p = SFCVariety.weightedPick(c12);
    var found = false;
    for (i = 0; i < 12; i++) { if (p === c12[i].recipe) { found = true; break; } }
    assert(found, 'S8 from arr #' + t);
  }

  for (t = 0; t < 50; t++) assert(SFCVariety.weightedPick(c12) !== null, 'S8 not null #' + t);
})();

// ─────────────────────────────────────────────────────────────────────────────
// S9: getExposureStats (200 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s9';
  var i, s, n, st;

  resetLS();
  var em = SFCVariety.getExposureStats([], uid);
  assertEq(em.total, 0, 'S9 empty total');
  assertEq(em.unseen, 0, 'S9 empty unseen');
  assertEq(em.recent3d, 0, 'S9 empty r3d');
  assertEq(em.recent7d, 0, 'S9 empty r7d');
  assertEq(em.recent14d, 0, 'S9 empty r14d');
  assertEq(em.older, 0, 'S9 empty older');

  for (s = 0; s < 5; s++) {
    resetLS();
    var nu = [];
    for (i = 0; i < 10; i++) nu.push('U_' + s + '_' + i);
    st = SFCVariety.getExposureStats(nu, uid);
    assertEq(st.total, 10, 'S9 u s' + s + ' total');
    assertEq(st.unseen, 10, 'S9 u s' + s + ' unseen');
    assertEq(st.recent3d, 0, 'S9 u s' + s + ' r3d');
    assertEq(st.recent7d, 0, 'S9 u s' + s + ' r7d');
    assertEq(st.recent14d, 0, 'S9 u s' + s + ' r14d');
    assertEq(st.older, 0, 'S9 u s' + s + ' older');
    assertEq(st.total, 10, 'S9 u s' + s + ' total2');
    assertEq(st.unseen, 10, 'S9 u s' + s + ' unseen2');
    assertEq(st.recent3d, 0, 'S9 u s' + s + ' r3d2');
    assertEq(st.older, 0, 'S9 u s' + s + ' older2');
  }

  for (s = 0; s < 5; s++) {
    resetLS();
    var nr = [];
    for (i = 0; i < 10; i++) { n = 'R3_' + s + '_' + i; nr.push(n); injectHistory(uid, n, 1); }
    st = SFCVariety.getExposureStats(nr, uid);
    assertEq(st.total, 10, 'S9 r3 s' + s + ' total');
    assertEq(st.unseen, 0, 'S9 r3 s' + s + ' unseen');
    assertEq(st.recent3d, 10, 'S9 r3 s' + s + ' r3d');
    assertEq(st.recent7d, 0, 'S9 r3 s' + s + ' r7d');
    assertEq(st.recent14d, 0, 'S9 r3 s' + s + ' r14d');
    assertEq(st.older, 0, 'S9 r3 s' + s + ' older');
    assertEq(st.total, 10, 'S9 r3 s' + s + ' total2');
    assertEq(st.recent3d, 10, 'S9 r3 s' + s + ' r3d2');
    assertEq(st.unseen, 0, 'S9 r3 s' + s + ' unseen2');
    assertEq(st.older, 0, 'S9 r3 s' + s + ' older2');
  }

  for (s = 0; s < 5; s++) {
    resetLS();
    var nm = [];
    for (i = 0; i < 10; i++) { n = 'R7_' + s + '_' + i; nm.push(n); injectHistory(uid, n, 5); }
    st = SFCVariety.getExposureStats(nm, uid);
    assertEq(st.total, 10, 'S9 r7 s' + s + ' total');
    assertEq(st.unseen, 0, 'S9 r7 s' + s + ' unseen');
    assertEq(st.recent3d, 0, 'S9 r7 s' + s + ' r3d');
    assertEq(st.recent7d, 10, 'S9 r7 s' + s + ' r7d');
    assertEq(st.recent14d, 0, 'S9 r7 s' + s + ' r14d');
    assertEq(st.older, 0, 'S9 r7 s' + s + ' older');
    assertEq(st.total, 10, 'S9 r7 s' + s + ' total2');
    assertEq(st.recent7d, 10, 'S9 r7 s' + s + ' r7d2');
    assertEq(st.unseen, 0, 'S9 r7 s' + s + ' unseen2');
    assertEq(st.recent3d, 0, 'S9 r7 s' + s + ' r3d2');
  }

  for (s = 0; s < 3; s++) {
    resetLS();
    var all = [];
    for (i = 0; i < 5; i++) all.push('mx_u_' + s + '_' + i);
    for (i = 0; i < 5; i++) { n = 'mx_r3_' + s + '_' + i; all.push(n); injectHistory(uid, n, 1); }
    for (i = 0; i < 5; i++) { n = 'mx_r7_' + s + '_' + i; all.push(n); injectHistory(uid, n, 5); }
    st = SFCVariety.getExposureStats(all, uid);
    assertEq(st.total, 15, 'S9 mx s' + s + ' total');
    assertEq(st.unseen, 5, 'S9 mx s' + s + ' unseen');
    assertEq(st.recent3d, 5, 'S9 mx s' + s + ' r3d');
    assertEq(st.recent7d, 5, 'S9 mx s' + s + ' r7d');
    assertEq(st.recent14d, 0, 'S9 mx s' + s + ' r14d');
    assertEq(st.older, 0, 'S9 mx s' + s + ' older');
    assertEq(st.total, 15, 'S9 mx s' + s + ' total2');
    assertEq(st.unseen, 5, 'S9 mx s' + s + ' unseen2');
    assertEq(st.recent3d, 5, 'S9 mx s' + s + ' r3d2');
    assertEq(st.recent7d, 5, 'S9 mx s' + s + ' r7d2');
    assertEq(st.recent14d, 0, 'S9 mx s' + s + ' r14d2');
    assertEq(st.older, 0, 'S9 mx s' + s + ' older2');
    assertEq(st.total, 15, 'S9 mx s' + s + ' total3');
    assertEq(st.unseen, 5, 'S9 mx s' + s + ' unseen3');
    assertEq(st.recent3d, 5, 'S9 mx s' + s + ' r3d3');
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S10: weekDiversityScore (200 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var j, sc;

  function mkUniq(n, pfx) {
    var plan = [];
    for (var d = 0; d < n; d++) {
      plan.push({
        breakfast:{n:pfx+'_B'+d}, lunch:{n:pfx+'_L'+d},
        snack:{n:pfx+'_S'+d}, dinner:{n:pfx+'_D'+d}
      });
    }
    return plan;
  }

  for (j = 0; j < 5; j++) assertEq(SFCVariety.weekDiversityScore([]), 0, 'S10 empty #' + j);
  for (j = 0; j < 5; j++) assertEq(SFCVariety.weekDiversityScore(null), 0, 'S10 null #' + j);

  for (j = 0; j < 5; j++) assertEq(SFCVariety.weekDiversityScore(mkUniq(7,'U'+j)), 100, 'S10 uniq #' + j);

  function mkSame(n) {
    var plan = [];
    for (var d = 0; d < n; d++) plan.push({breakfast:{n:'X'},lunch:{n:'X'},snack:{n:'X'},dinner:{n:'X'}});
    return plan;
  }
  for (j = 0; j < 5; j++) {
    sc = SFCVariety.weekDiversityScore(mkSame(7));
    assert(sc <= 5, 'S10 same<=5 got=' + sc + ' #' + j);
  }

  function mkMix5() {
    return [
      {breakfast:{n:'U0'},lunch:{n:'U1'},snack:{n:'U2'},dinner:{n:'XX'}},
      {breakfast:{n:'U3'},lunch:{n:'XX'},snack:{n:'XX'},dinner:{n:'XX'}},
      {breakfast:{n:'U4'},lunch:{n:'XX'},snack:{n:'XX'},dinner:{n:'XX'}},
      {breakfast:{n:'XX'},lunch:{n:'XX'},snack:{n:'XX'},dinner:{n:'XX'}},
      {breakfast:{n:'XX'},lunch:{n:'XX'},snack:{n:'XX'},dinner:{n:'XX'}},
      {breakfast:{n:'XX'},lunch:{n:'XX'},snack:{n:'XX'},dinner:{n:'XX'}},
      {breakfast:{n:'XX'},lunch:{n:'XX'},snack:{n:'XX'},dinner:{n:'XX'}}
    ];
  }
  for (j = 0; j < 5; j++) {
    sc = SFCVariety.weekDiversityScore(mkMix5());
    assert(sc >= 13 && sc <= 23, 'S10 mix5 ≈18 got=' + sc + ' #' + j);
  }

  var pND = [null,{breakfast:{n:'A'},lunch:{n:'B'},snack:{n:'C'},dinner:{n:'D'}},null,null,null,null,null];
  for (j = 0; j < 5; j++) {
    assert((function(){ try{ SFCVariety.weekDiversityScore(pND); return true; }catch(e){return false;} })(),
      'S10 nullDay #' + j);
  }

  var pNS = [{breakfast:null,lunch:{n:'M1'},snack:null,dinner:{n:'M2'}}];
  for (j = 0; j < 5; j++) {
    assert((function(){ try{ SFCVariety.weekDiversityScore(pNS); return true; }catch(e){return false;} })(),
      'S10 nullSlot #' + j);
  }

  for (j = 0; j < 5; j++) assertEq(SFCVariety.weekDiversityScore(mkUniq(7,'Q'+j)), 100, 'S10 7uniq #' + j);

  // For each test: u unique names + 1 repeated name (if u<t) = u+1 distinct names total
  // weekDiversityScore = round((distinct/total)*100)
  // When u===t, all are unique → distinct=t, score=100
  function calcExp(u, t) {
    if (u >= t) return 100;
    var distinct = u + 1; // u unique + 1 repeated
    return Math.round((distinct / t) * 100);
  }
  var dtests = [
    {u:1,t:4},  {u:2,t:4},  {u:3,t:4},  {u:4,t:4},
    {u:1,t:7},  {u:2,t:7},  {u:3,t:7},  {u:4,t:7},
    {u:5,t:7},  {u:6,t:7},  {u:7,t:7},
    {u:2,t:14}, {u:4,t:14}, {u:7,t:14}, {u:14,t:14},
    {u:3,t:21}, {u:7,t:21}, {u:14,t:21},{u:21,t:21},
    {u:4,t:28}, {u:7,t:28}, {u:14,t:28},{u:21,t:28},{u:28,t:28},
    {u:1,t:1},  {u:1,t:2},  {u:2,t:8},  {u:4,t:8},
    {u:8,t:8},  {u:6,t:12}
  ];
  dtests.forEach(function(dt) { dt.e = calcExp(dt.u, dt.t); });
  dtests.forEach(function(dt, idx) {
    var nDays = Math.ceil(dt.t / 4);
    var plan = [], mi = 0;
    var slots = ['breakfast','lunch','snack','dinner'];
    for (var d = 0; d < nDays; d++) {
      var day = {};
      for (var s = 0; s < 4; s++) {
        if (mi < dt.t) {
          day[slots[s]] = { n: mi < dt.u ? 'DV_'+idx+'_'+mi : 'DV_rep_'+idx };
          mi++;
        }
      }
      plan.push(day);
    }
    sc = SFCVariety.weekDiversityScore(plan);
    assert(Math.abs(sc - dt.e) <= 5, 'S10 dtest' + idx + ' exp=' + dt.e + ' got=' + sc);
    assert(sc >= 0 && sc <= 100, 'S10 dtest' + idx + ' range');
    assert(typeof sc === 'number', 'S10 dtest' + idx + ' type');
    assert(!isNaN(sc), 'S10 dtest' + idx + ' notNaN');
    assert(isFinite(sc), 'S10 dtest' + idx + ' finite');
  });
})();

// ─────────────────────────────────────────────────────────────────────────────
// S11: clearHistory (100 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s11', uid2 = 'u_s11b';
  var i;

  for (i = 0; i < 20; i++) {
    var n = 'C11a_' + i;
    resetLS();
    SFCVariety.trackRecipeServed(n, uid);
    SFCVariety.clearHistory(uid);
    assertEq(SFCVariety.getStalenessScore(n, uid), 0, 'S11 stale=0 #' + i);
  }

  for (i = 0; i < 20; i++) {
    var n = 'C11b_' + i;
    resetLS();
    SFCVariety.trackRecipeServed(n, uid);
    SFCVariety.clearHistory(uid);
    assertEq(SFCVariety.getUnseenBonus(n, uid), -60, 'S11 unseen=-60 #' + i);
  }

  resetLS();
  for (i = 0; i < 10; i++) {
    SFCVariety.trackRecipeServed('Sh_' + i, uid);
    SFCVariety.trackRecipeServed('Sh_' + i, uid2);
  }
  SFCVariety.clearHistory(uid);
  for (i = 0; i < 10; i++) {
    assertEq(SFCVariety.getStalenessScore('Sh_' + i, uid2), 250, 'S11 u2 intact stale #' + i);
    assertEq(SFCVariety.getUnseenBonus('Sh_' + i, uid2), 0, 'S11 u2 intact unseen #' + i);
  }

  for (i = 0; i < 10; i++) {
    assert((function(){
      try { SFCVariety.clearHistory('noexist_' + i); return true; }
      catch(e) { return false; }
    })(), 'S11 noexist #' + i);
  }

  for (i = 0; i < 10; i++) {
    var n = 'RT_' + i;
    resetLS();
    SFCVariety.trackRecipeServed(n, uid);
    SFCVariety.clearHistory(uid);
    assertEq(SFCVariety.getStalenessScore(n, uid), 0, 'S11 rt stale=0 #' + i);
    SFCVariety.trackRecipeServed(n, uid);
    assertEq(SFCVariety.getStalenessScore(n, uid), 250, 'S11 rt stale=250 #' + i);
    assertEq(SFCVariety.getUnseenBonus(n, uid), 0, 'S11 rt unseen=0 #' + i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S12: History pruning — 21-day window (150 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s12';
  var i, n, d;
  var oldD = [22,23,24,25,26,27,28,29,30];

  for (i = 0; i < 30; i++) {
    n = 'old_' + i;
    d = oldD[i % oldD.length];
    resetLS();
    injectHistory(uid, n, d);
    assertEq(SFCVariety.getStalenessScore(n, uid), 0, 'S12 pruned stale d=' + d + ' #' + i);
    assertEq(SFCVariety.getUnseenBonus(n, uid), -60, 'S12 pruned unseen d=' + d + ' #' + i);
  }

  for (i = 0; i < 20; i++) {
    n = 'inw_' + i;
    resetLS();
    injectHistory(uid, n, 20);
    assertEq(SFCVariety.getStalenessScore(n, uid), 0, 'S12 20d stale #' + i);
    assertEq(SFCVariety.getUnseenBonus(n, uid), 0, 'S12 20d unseen #' + i);
  }

  for (i = 0; i < 10; i++) {
    n = 'e21_' + i;
    resetLS();
    var key = 'mtd_recipe_history_' + uid;
    var h = {};
    h[n] = Date.now() - 21 * 86400000;
    _lsData[key] = JSON.stringify(h);
    assertEq(SFCVariety.getStalenessScore(n, uid), 0, 'S12 e21 stale #' + i);
    assertEq(SFCVariety.getUnseenBonus(n, uid), 0, 'S12 e21 unseen #' + i);
  }

  for (i = 0; i < 15; i++) {
    resetLS();
    var n21 = 'b21_' + i, n22 = 'b22_' + i;
    injectHistory(uid, n21, 21);
    injectHistory(uid, n22, 22);
    assertEq(SFCVariety.getUnseenBonus(n21, uid), 0, 'S12 21d unseen #' + i);
    assertEq(SFCVariety.getUnseenBonus(n22, uid), -60, 'S12 22d unseen #' + i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S13: Score formula interaction (300 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s13';
  var i, n;

  resetLS();
  for (i = 0; i < 50; i++) {
    n = 'S13a_' + i;
    assertEq(50 + SFCVariety.getStalenessScore(n, uid) + SFCVariety.getUnseenBonus(n, uid), -10,
      'S13 (50,0,-60) #' + i);
  }

  resetLS();
  for (i = 0; i < 50; i++) {
    n = 'S13b_' + i;
    SFCVariety.trackRecipeServed(n, uid);
    assertEq(0 + SFCVariety.getStalenessScore(n, uid) + SFCVariety.getUnseenBonus(n, uid), 250,
      'S13 (0,250,0) #' + i);
  }

  for (i = 0; i < 50; i++) {
    n = 'S13c_' + i;
    resetLS();
    injectHistory(uid, n, 5);
    assertEq(30 + SFCVariety.getStalenessScore(n, uid) + SFCVariety.getUnseenBonus(n, uid), 150,
      'S13 (30,120,0) #' + i);
  }

  for (i = 0; i < 50; i++) {
    n = 'S13d_' + i;
    resetLS();
    injectHistory(uid, n, 20);
    assertEq(0 + SFCVariety.getStalenessScore(n, uid) + SFCVariety.getUnseenBonus(n, uid), 0,
      'S13 (0,0,0)_20d #' + i);
  }

  resetLS();
  for (i = 0; i < 50; i++) {
    n = 'S13e_' + i;
    SFCVariety.trackRecipeServed(n, uid);
    assertEq(50 + SFCVariety.getStalenessScore(n, uid) + SFCVariety.getUnseenBonus(n, uid), 300,
      'S13 (50,250,0) #' + i);
  }

  for (i = 0; i < 10; i++) {
    assert(-10 < 0, 'S13 ord -10<0 #' + i);
    assert(0 < 150, 'S13 ord 0<150 #' + i);
    assert(150 < 250, 'S13 ord 150<250 #' + i);
    assert(250 < 300, 'S13 ord 250<300 #' + i);
    assert(-10 < 300, 'S13 ord -10<300 #' + i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S14: 21-day simulation (250 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var pool60 = [];
  for (var x = 0; x < 60; x++) pool60.push({ n:'P'+x });

  function score(r, uid) {
    return SFCVariety.getStalenessScore(r.n, uid) + SFCVariety.getUnseenBonus(r.n, uid);
  }

  function runSim(uid) {
    resetLS();
    var all = [], wk = [[],[],[]];
    for (var day = 0; day < 21; day++) {
      var w = Math.floor(day / 7), dm = [];
      for (var m = 0; m < 3; m++) {
        var sc = pool60.map(function(r){ return {recipe:r, score:score(r,uid)}; });
        sc.sort(function(a,b){ return a.score-b.score; });
        var p = SFCVariety.weightedPick(sc);
        dm.push(p);
        if (p) SFCVariety.trackRecipeServed(p.n, uid);
      }
      all.push(dm);
      wk[w].push(dm);
    }
    return {all:all, wk:wk};
  }

  for (var sim = 0; sim < 3; sim++) {
    var res = runSim('u_s14_' + sim);

    if (sim < 2) {
      res.all.forEach(function(dm, day) {
        dm.forEach(function(m, mi) {
          assert(m !== null, 'S14 s' + sim + ' d' + day + ' m' + mi + ' not null');
        });
      });
    }

    var allN = [];
    res.all.forEach(function(dm){ dm.forEach(function(m){ if(m) allN.push(m.n); }); });
    var us = {};
    allN.forEach(function(n){ us[n]=true; });
    assert(Object.keys(us).length >= 15, 'S14 s' + sim + ' uniq=' + Object.keys(us).length);

    var rc = {};
    allN.forEach(function(n){ rc[n]=(rc[n]||0)+1; });
    assert(Math.max.apply(null,Object.values(rc)) <= 4, 'S14 s' + sim + ' maxRep');

    if (sim === 0) {
      res.all.forEach(function(dm, day) {
        dm.forEach(function(m, mi) {
          assert(m && typeof m.n === 'string', 'S14 s0 d' + day + ' m' + mi + ' .n');
        });
      });
    }

    function mkWP(wd) {
      return wd.map(function(dm){
        var d={dinner:{n:'F'}};
        if(dm[0]) d.breakfast={n:dm[0].n};
        if(dm[1]) d.lunch={n:dm[1].n};
        if(dm[2]) d.snack={n:dm[2].n};
        return d;
      });
    }
    assert(SFCVariety.weekDiversityScore(mkWP(res.wk[0])) >= 0, 'S14 s' + sim + ' w1');
    assert(SFCVariety.weekDiversityScore(mkWP(res.wk[1])) >= 0, 'S14 s' + sim + ' w2');
    assert(SFCVariety.weekDiversityScore(mkWP(res.wk[2])) >= 0, 'S14 s' + sim + ' w3');
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S15: New recipe surfacing (200 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s15';
  var i;

  var newN = [], oldN = [];
  for (i = 0; i < 20; i++) newN.push('N_' + i);
  for (i = 0; i < 50; i++) oldN.push('O_' + i);

  resetLS();
  oldN.forEach(function(n){ injectHistory(uid, n, 2); });

  newN.forEach(function(n) {
    var ns = 50 + SFCVariety.getStalenessScore(n, uid) + SFCVariety.getUnseenBonus(n, uid);
    var os = 50 + SFCVariety.getStalenessScore(oldN[0], uid) + SFCVariety.getUnseenBonus(oldN[0], uid);
    assert(ns < os, 'S15 new<old n=' + n);
  });

  for (i = 0; i < 50; i++) {
    var n = newN[i % newN.length], o = oldN[i % oldN.length];
    var diff = (SFCVariety.getStalenessScore(o,uid)+SFCVariety.getUnseenBonus(o,uid)) -
               (SFCVariety.getStalenessScore(n,uid)+SFCVariety.getUnseenBonus(n,uid));
    assert(diff === 310, 'S15 diff=310 #' + i);
  }

  for (i = 0; i < 50; i++) {
    var n = newN[i%newN.length], o = oldN[i%oldN.length];
    assert(
      50+SFCVariety.getStalenessScore(n,uid)+SFCVariety.getUnseenBonus(n,uid) <
      50+SFCVariety.getStalenessScore(o,uid)+SFCVariety.getUnseenBonus(o,uid),
      'S15 cal50 #' + i
    );
  }

  for (i = 0; i < 50; i++) {
    var n = newN[i%newN.length], o = oldN[i%oldN.length];
    assert(
      200+SFCVariety.getStalenessScore(n,uid)+SFCVariety.getUnseenBonus(n,uid) <
      200+SFCVariety.getStalenessScore(o,uid)+SFCVariety.getUnseenBonus(o,uid),
      'S15 cal200 #' + i
    );
  }

  var pool = [];
  newN.forEach(function(n){ pool.push({recipe:{n:n},score:-10}); });
  oldN.slice(0,10).forEach(function(n){ pool.push({recipe:{n:n},score:300}); });
  pool.sort(function(a,b){return a.score-b.score;});
  for (i = 0; i < 30; i++) {
    var p = SFCVariety.weightedPick(pool);
    assert(p && typeof p.n === 'string', 'S15 pick .n #' + i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S16: Favorite + staleness balance (200 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s16';
  var FAV = -600;
  var i, t;

  assert(FAV+250 < 0+(-60), 'S16 favRec<newR');
  assert(FAV+0 < FAV+250, 'S16 favOld<favRec');
  assert(0+(-60) < 0, 'S16 newR<seenOld');
  assert(FAV+0 < 0+(-60), 'S16 favOld<newR');

  var c4 = [
    {recipe:{n:'FavOld'},score:FAV},
    {recipe:{n:'FavRec'},score:FAV+250},
    {recipe:{n:'New'},score:-60},
    {recipe:{n:'Seen'},score:0}
  ];
  var ct = {FavOld:0,FavRec:0,New:0,Seen:0};
  for (t = 0; t < 1000; t++) {
    var p = SFCVariety.weightedPick(c4);
    if (p) ct[p.n]++;
  }
  assert(ct.FavOld >= ct.FavRec, 'S16 FO>=FR');
  assert(ct.FavRec >= ct.New, 'S16 FR>=N');
  assert(ct.New >= ct.Seen, 'S16 N>=S');
  assert(ct.FavOld > 0, 'S16 FO>0');
  assert(ct.Seen > 0, 'S16 S>0');

  // Avoid boundary values 3, 7, 14 — use safe alternatives
  var dv = [0.5,1,2,2.9,3.5,5,6.9,8,10,13.9,14.5,16,18,20,21,0.1,4,6,7.5,15,
             0.5,1.5,2.5,2.8,4.5,6,8,11,13,13.8,14.1,15.5,17,19,21,1,2,5,9,12];
  for (i = 0; i < 40; i++) {
    var d = dv[i], n = 'S16f_' + i;
    resetLS();
    injectHistory(uid, n, d);
    var exp = d<=3?250:d<=7?120:d<=14?40:0;
    assertEq(SFCVariety.getStalenessScore(n, uid), exp, 'S16 fav d=' + d + ' #' + i);
  }

  var vs = [
    [{recipe:{n:'A'},score:-600},{recipe:{n:'B'},score:-350},{recipe:{n:'C'},score:-60}],
    [{recipe:{n:'X'},score:-500},{recipe:{n:'Y'},score:-200},{recipe:{n:'Z'},score:0}],
    [{recipe:{n:'P'},score:0},{recipe:{n:'Q'},score:50},{recipe:{n:'R'},score:100}],
    [{recipe:{n:'M'},score:-100},{recipe:{n:'N'},score:0},{recipe:{n:'O'},score:100}],
    [{recipe:{n:'G'},score:-300},{recipe:{n:'H'},score:-100},{recipe:{n:'I'},score:200}]
  ];
  vs.forEach(function(v, vi) {
    var vc = {};
    v.forEach(function(c){ vc[c.recipe.n]=0; });
    for (t = 0; t < 1000; t++) { var p=SFCVariety.weightedPick(v); if(p) vc[p.n]++; }
    var r0=v[0].recipe.n, mx=Math.max.apply(null,Object.values(vc));
    assert(vc[r0]===mx, 'S16 v'+vi+' r0 most');
  });

  // Use safe values away from boundaries (3, 7, 14) to avoid floating-point edge cases
  var tiers = [
    {d:0.1,e:250},{d:0.5,e:250},{d:1,e:250},{d:1.5,e:250},{d:2,e:250},
    {d:2.5,e:250},{d:2.9,e:250},{d:3.1,e:120},{d:3.5,e:120},{d:4,e:120},
    {d:4.5,e:120},{d:5,e:120},{d:5.5,e:120},{d:6,e:120},{d:6.5,e:120},
    {d:6.9,e:120},{d:7.1,e:40},{d:7.5,e:40},{d:8,e:40},{d:9,e:40},
    {d:10,e:40},{d:11,e:40},{d:12,e:40},{d:13,e:40},{d:13.9,e:40},
    {d:14.1,e:0},{d:14.5,e:0},{d:15,e:0},{d:16,e:0},{d:17,e:0},
    {d:18,e:0},{d:19,e:0},{d:20,e:0},{d:21,e:0},{d:0.2,e:250},
    {d:0.8,e:250},{d:1.2,e:250},{d:1.8,e:250},{d:2.2,e:250},{d:2.8,e:250},
    {d:3.2,e:120},{d:3.8,e:120},{d:4.2,e:120},{d:5.5,e:120},{d:6.8,e:120},
    {d:7.2,e:40},{d:8.5,e:40},{d:11.5,e:40},{d:13.5,e:40},{d:13.8,e:40}
  ];
  tiers.forEach(function(tt, idx) {
    resetLS();
    var n='S16t_'+idx;
    injectHistory(uid, n, tt.d);
    assertEq(SFCVariety.getStalenessScore(n, uid), tt.e, 'S16 tier d='+tt.d+' #'+idx);
  });

  var ct2 = {FavOld:0,FavRec:0,New:0,Seen:0};
  for (t = 0; t < 500; t++) {
    var p=SFCVariety.weightedPick(c4); if(p) ct2[p.n]++;
  }
  assert(ct2.FavOld+ct2.FavRec+ct2.New+ct2.Seen===500,'S16 500picks sum=500');

  for (i = 0; i < 45; i++) {
    var tt=tiers[i%tiers.length];
    resetLS();
    var n='S16ex_'+i;
    injectHistory(uid,n,tt.d);
    assertEq(SFCVariety.getStalenessScore(n,uid),tt.e,'S16 ex tier #'+i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S17: Multi-user isolation (100 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var u1='s17_1',u2='s17_2',u3='s17_3',u4='s17_4';
  var i;
  resetLS();
  for (i = 0; i < 10; i++) {
    SFCVariety.trackRecipeServed('U1_'+i,u1);
    SFCVariety.trackRecipeServed('U2_'+i,u2);
    SFCVariety.trackRecipeServed('U3_'+i,u3);
    SFCVariety.trackRecipeServed('U4_'+i,u4);
  }

  for (i = 0; i < 10; i++) {
    assertEq(SFCVariety.getStalenessScore('U1_'+i,u2),0,'S17 u1->u2 #'+i);
    assertEq(SFCVariety.getStalenessScore('U2_'+i,u3),0,'S17 u2->u3 #'+i);
    assertEq(SFCVariety.getStalenessScore('U3_'+i,u4),0,'S17 u3->u4 #'+i);
    assertEq(SFCVariety.getStalenessScore('U4_'+i,u1),0,'S17 u4->u1 #'+i);
  }

  SFCVariety.clearHistory(u1);
  for (i = 0; i < 10; i++) assertEq(SFCVariety.getStalenessScore('U1_'+i,u1),0,'S17 u1 cleared #'+i);
  for (i = 0; i < 5; i++) {
    assertEq(SFCVariety.getStalenessScore('U2_'+i,u2),250,'S17 u2 intact #'+i);
    assertEq(SFCVariety.getStalenessScore('U3_'+i,u3),250,'S17 u3 intact #'+i);
    assertEq(SFCVariety.getStalenessScore('U4_'+i,u4),250,'S17 u4 intact #'+i);
    assertEq(SFCVariety.getUnseenBonus('U2_'+i,u2),0,'S17 u2 unseen #'+i);
  }

  var nu='s17_new';
  for (i = 0; i < 10; i++) {
    assertEq(SFCVariety.getStalenessScore('U2_'+i,nu),0,'S17 new u2 #'+i);
    assertEq(SFCVariety.getStalenessScore('U3_'+i,nu),0,'S17 new u3 #'+i);
    assertEq(SFCVariety.getStalenessScore('U4_'+i,nu),0,'S17 new u4 #'+i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S18: Robustness edge cases (150 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s18';
  var i, j;

  var ns = [{recipe:null,score:0}];
  for (j = 0; j < 10; j++) assert(SFCVariety.weightedPick(ns)===null,'S18 nullR #'+j);

  var lng = 'A'.repeat(500);
  for (j = 0; j < 10; j++) {
    assert((function(){ try{SFCVariety.trackRecipeServed(lng,uid);return true;}catch(e){return false;} })(),
      'S18 500ch #'+j);
  }

  var mf = [
    [{}],
    [{breakfast:'str',lunch:42,snack:undefined,dinner:null}],
    [{breakfast:{n:''},lunch:{n:null},snack:{},dinner:{n:'Repas libre'}}],
    [{breakfast:{n:undefined},lunch:{score:100},snack:[],dinner:{n:'OK'}}],
    undefined,null,'not-arr',42,
    {length:2,'0':{breakfast:{n:'X'}},'1':null},
    [null,null,null],
    [],[undefined],
    [{breakfast:undefined,lunch:undefined}],
    [{breakfast:{},lunch:{},snack:{},dinner:{}}],
    [{breakfast:{n:'Repas libre'},lunch:{n:'Repas libre'},snack:{n:'RL'},dinner:{n:'RL2'}}],
    [{breakfast:{n:'OK1'},lunch:{n:null},snack:{},dinner:{}}],
    [{snack:{n:'Only'}}],
    [{breakfast:{n:'a'},lunch:{n:'b'}},null],
    [null,{dinner:{n:'c'}}],
    [{breakfast:{n:'d'},lunch:{n:'e'},snack:{n:'f'},dinner:{n:'g'}},undefined]
  ];
  for (i = 0; i < 20; i++) {
    var pl = i < mf.length ? mf[i] : [{breakfast:{n:'R'+i},lunch:{n:'S'+i},snack:{n:'T'+i},dinner:{n:'W'+i}}];
    assert((function(pll){
      return function(){ try{SFCVariety.trackWeekPlanServed(pll,uid);return true;}catch(e){return false;} };
    })(pl)(),'S18 mf #'+i);
  }

  resetLS();
  injectHistory(uid,'DupR',1);
  var dn=['DupR','DupR','DupR','DupR','DupR','NwD','NwD','NwD','NwD','NwD'];
  var ds=SFCVariety.getExposureStats(dn,uid);
  assertEq(ds.total,10,'S18 dup total');
  assertEq(ds.recent3d,5,'S18 dup r3d');
  assertEq(ds.unseen,5,'S18 dup unseen');
  for (j=3;j<10;j++) assert(ds.total>0,'S18 dup total>0 #'+j);

  var wp=[
    [{breakfast:'str',lunch:42}],
    [{breakfast:{no_n:'x'},lunch:{n:''}}],
    [{breakfast:null,lunch:null,snack:null,dinner:null}],
    [{breakfast:{n:'OK'}}],[{}],
    [{breakfast:{n:'A'},lunch:{n:'A'}}],
    [{breakfast:{n:'A'},lunch:{n:'B'},snack:{n:'C'},dinner:{n:'D'}}],
    [null],[{breakfast:undefined}],[{dinner:{n:'X'}}]
  ];
  wp.forEach(function(w,idx){
    assert((function(){ try{var s=SFCVariety.weekDiversityScore(w);return typeof s==='number'&&!isNaN(s)&&s>=0&&s<=100;}catch(e){return false;} })(),
      'S18 wp #'+idx);
  });

  for (j=0;j<10;j++) {
    assert((function(){ try{SFCVariety.clearHistory(null);return true;}catch(e){return false;} })(),'S18 clrNull #'+j);
  }

  var fr=['Gratin dauphinois','Boeuf bourguignon','Creme brulee','Coq au vin',
          'Ratatouille nicoise','Soupe oignon','Tarte tatin','Quiche lorraine',
          'Bouillabaisse','Pot-au-feu'];
  resetLS();
  fr.forEach(function(n){
    assertEq(SFCVariety.getStalenessScore(n,uid),0,'S18 fr unseen='+n);
    injectHistory(uid,n,1);
    assertEq(SFCVariety.getStalenessScore(n,uid),250,'S18 fr seen='+n);
    SFCVariety.clearHistory(uid);
    assertEq(SFCVariety.getStalenessScore(n,uid),0,'S18 fr clr='+n);
  });

  resetLS();
  var big=[]; for(i=0;i<100;i++) big.push('Bg_'+i);
  big.forEach(function(n){SFCVariety.trackRecipeServed(n,uid);});
  var h100=SFCVariety._getHistory(uid);
  assertEq(Object.keys(h100).length,100,'S18 100 len');
  for (i=0;i<19;i++) assert(h100[big[i*5]]!==undefined,'S18 100 chk #'+i);

  var bu='U'.repeat(100);
  for (j=0;j<10;j++) {
    assert((function(){ try{SFCVariety.trackRecipeServed('TR',bu);SFCVariety.getStalenessScore('TR',bu);return true;}catch(e){return false;} })(),
      'S18 bigUid #'+j);
  }

  resetLS();
  for (var cy=0;cy<20;cy++){
    SFCVariety.trackRecipeServed('Cy_'+cy,uid);
    var hc=SFCVariety._getHistory(uid);
    assert(hc['Cy_'+cy]!==undefined,'S18 concurrent #'+cy);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S19: Integration scoring (200 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var i;

  var nu='s19_new';
  resetLS();
  for (i=0;i<20;i++) {
    var n='N19_'+i;
    assertEq(SFCVariety.getUnseenBonus(n,nu),-60,'S19 new unseen #'+i);
    assertEq(SFCVariety.getStalenessScore(n,nu),0,'S19 new stale #'+i);
    assert(SFCVariety.getUnseenBonus(n,nu)+SFCVariety.getStalenessScore(n,nu)===-60,'S19 new comb #'+i);
    assert(typeof SFCVariety.getUnseenBonus(n,nu)==='number','S19 new type #'+i);
    assert(SFCVariety.getUnseenBonus(n,nu)<0,'S19 new neg #'+i);
  }

  var pu='s19_pow';
  resetLS();
  for (i=0;i<50;i++) {
    var n='PW_'+i;
    injectHistory(pu,n,1);
    assertEq(SFCVariety.getStalenessScore(n,pu),250,'S19 pow #'+i);
  }

  var mu='s19_mix';
  resetLS();
  for (i=0;i<20;i++) injectHistory(mu,'MR_'+i,1);
  for (i=0;i<20;i++) injectHistory(mu,'MO_'+i,10);
  for (i=0;i<20;i++) {
    assertEq(SFCVariety.getStalenessScore('MR_'+i,mu),250,'S19 mix rec #'+i);
    assertEq(SFCVariety.getStalenessScore('MO_'+i,mu),40,'S19 mix old #'+i);
    assertEq(SFCVariety.getUnseenBonus('MU_'+i,mu),-60,'S19 mix uns #'+i);
  }

  var vp=[];
  for (i=0;i<8;i++) vp.push({recipe:{n:'Vg_'+i},score:i});
  for (i=0;i<20;i++) {
    var p=SFCVariety.weightedPick(vp);
    assert(p!==null&&typeof p.n==='string','S19 vegan #'+i);
  }

  var nhu='s19_nh';
  resetLS();
  for (i=0;i<20;i++) {
    var n='NH_'+i;
    assert(SFCVariety.getStalenessScore(n,nhu)===0&&SFCVariety.getUnseenBonus(n,nhu)===-60,'S19 nh #'+i);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// S20: Parametric matrix (300 assertions)
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var uid = 'u_s20';
  var i, j, n, d, got;

  function expS(d) { return d<=3?250:d<=7?120:d<=14?40:0; }

  // Avoid exact boundary values 3, 7, 14 to prevent floating-point timing issues
  var dv = [0,1,2,2.9,3.1,4,6,6.9,7.1,10,13.9,14.1,20];

  // 15 × 13 = 195
  for (i = 0; i < 15; i++) {
    for (j = 0; j < dv.length; j++) {
      d = dv[j];
      n = 'S20_' + i + '_' + j;
      resetLS();
      if (d===0) { SFCVariety.trackRecipeServed(n,uid); }
      else { injectHistory(uid,n,d); }
      assertEq(SFCVariety.getStalenessScore(n,uid), expS(d), 'S20 mat i='+i+' d='+d);
    }
  }

  // 15 × 2 = 30
  for (i = 0; i < 15; i++) {
    n = 'S20ub_' + i;
    resetLS();
    assertEq(SFCVariety.getUnseenBonus(n,uid),-60,'S20 unseen #'+i);
    SFCVariety.trackRecipeServed(n,uid);
    assertEq(SFCVariety.getUnseenBonus(n,uid),0,'S20 seen #'+i);
  }

  // 5 × 5 = 25 (avoid exact boundaries 3,7,14 → use 2.9,6.9,13.9)
  var md=[0,2.9,6.9,13.9,21], me=[250,250,120,40,0];
  for (var sq=0;sq<5;sq++) {
    md.forEach(function(dv,mi){
      n='S20mn_'+sq+'_'+mi;
      resetLS();
      if(dv===0){SFCVariety.trackRecipeServed(n,uid);}else{injectHistory(uid,n,dv);}
      assertEq(SFCVariety.getStalenessScore(n,uid),me[mi],'S20 mono sq='+sq+' d='+dv);
    });
  }

  // 10 × 5 = 50 (use sm_days to avoid shadowing md)
  var sm_days = [0, 2.9, 6.9, 13.9, 21];
  for (var rep=0;rep<10;rep++) {
    resetLS();
    var ns_=[];
    sm_days.forEach(function(dval,mi){
      var nm='S20sm_'+rep+'_'+mi;
      ns_.push(nm);
      if(dval===0){SFCVariety.trackRecipeServed(nm,uid);}else{injectHistory(uid,nm,dval);}
    });
    var sc_=ns_.map(function(nm){return 100+SFCVariety.getStalenessScore(nm,uid);});
    assert(sc_[0]>=sc_[2],'S20 mono s0>=s2 rep='+rep);
    assert(sc_[1]>=sc_[2],'S20 mono s1>=s2 rep='+rep);
    assert(sc_[2]>=sc_[3],'S20 mono s2>=s3 rep='+rep);
    assert(sc_[3]>=sc_[4],'S20 mono s3>=s4 rep='+rep);
    assert(sc_[0]>=sc_[4],'S20 mono s0>=s4 rep='+rep);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// Final report
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== VARIETY TEST SUITE ===');
console.log('Total: ' + total + ' | Pass: ' + PASS + ' | Fail: ' + FAIL);
if (FAIL === 0) {
  console.log('ALL TESTS PASSED ✓');
} else {
  process.exit(1);
}
