/**
 * SFCVariety — Recipe Freshness & Variety Engine v1.0
 *
 * Tracks recipe exposure across weeks and applies:
 *   - Staleness penalties  (recently served → deprioritized)
 *   - Unseen bonuses       (never served → prioritized)
 *   - Weighted top-N pick  (exponential decay vs hard top-5)
 *
 * Non-destructive IIFE — app works identically if this fails to load.
 */
(function(global) {
  'use strict';

  var VERSION = '1.0';
  var STORAGE_PREFIX = 'mtd_recipe_history_';
  var HISTORY_DAYS   = 21;   // rolling window kept in storage

  // Days-ago thresholds for staleness tiers
  var HARD_DAYS   = 3;
  var MEDIUM_DAYS = 7;
  var SOFT_DAYS   = 14;

  // Score adjustments (positive = worse score = less likely to be picked)
  var STALENESS = { hard: 250, medium: 120, soft: 40 };
  // Negative = better score = proactively surfaced
  var UNSEEN_BONUS = -60;

  // ─── STORAGE ───────────────────────────────────────────────────────────────

  function _key(uid) {
    return STORAGE_PREFIX + (uid || 'anon');
  }

  // Returns { recipeName: timestampMs } pruned to HISTORY_DAYS
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

  // ─── PUBLIC SCORING API ────────────────────────────────────────────────────

  /**
   * Returns a score penalty (0–250) for a recently-served recipe.
   *   0-3 days ago  → 250  (very strong deterrent)
   *   4-7 days ago  → 120  (significant deterrent)
   *   8-14 days ago →  40  (light deterrent)
   *   15+ days ago  →   0  (no penalty)
   *   Never seen    →   0  (handled by getUnseenBonus)
   */
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

  /**
   * Returns UNSEEN_BONUS (-60) if recipe has never been served, 0 otherwise.
   * Negative score = better rank = proactively surfaces new recipes.
   */
  function getUnseenBonus(recipeName, uid) {
    if (!recipeName) return 0;
    var h = _load(uid);
    return (h[recipeName] === undefined) ? UNSEEN_BONUS : 0;
  }

  // ─── TRACKING ──────────────────────────────────────────────────────────────

  function trackRecipeServed(recipeName, uid) {
    if (!recipeName || recipeName === 'Repas libre') return;
    var h = _load(uid);
    h[recipeName] = Date.now();
    _save(uid, h);
  }

  /**
   * Record all recipes from a generated week plan.
   * weekPlan is the array of 7 day objects: [{ breakfast, lunch, snack, dinner }, ...]
   */
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

  // ─── WEIGHTED RANDOM SELECTION ─────────────────────────────────────────────

  /**
   * Picks from the top-N candidates using linear-decay weights.
   * Rank 1 gets weight N, rank 2 gets N-1, ..., rank N gets 1.
   * This ensures the best-scoring recipe is 2× more likely than rank N/2,
   * but lower-ranked recipes still have a meaningful chance — enabling
   * discovery without sacrificing quality.
   *
   * @param {Array}  scored  - Array of { recipe, score } sorted ascending
   * @param {number} topN    - Pool size (default 12)
   * @returns {*} recipe object or null
   */
  function weightedPick(scored, topN) {
    if (!scored || !scored.length) return null;
    var pool = scored.slice(0, Math.min(topN || 12, scored.length));
    var n = pool.length;
    if (n === 1) return pool[0].recipe;
    // totalWeight = n*(n+1)/2
    var totalWeight = n * (n + 1) / 2;
    var rand = Math.random() * totalWeight;
    var cumulative = 0;
    for (var i = 0; i < n; i++) {
      cumulative += (n - i);
      if (rand < cumulative) return pool[i].recipe;
    }
    return pool[0].recipe;
  }

  // ─── ANALYTICS ─────────────────────────────────────────────────────────────

  /**
   * Returns exposure statistics for an array of recipe names.
   * Useful for debugging and the test suite.
   */
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

  /**
   * Returns a diversity score [0-100] for a generated week plan.
   * 100 = all 28 possible meal slots use unique recipes.
   */
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

  /**
   * Clears recipe history for a user (testing / account reset).
   */
  function clearHistory(uid) {
    try { localStorage.removeItem(_key(uid)); } catch(e) {}
  }

  // ─── EXPORT ────────────────────────────────────────────────────────────────

  global.SFCVariety = {
    VERSION:             VERSION,
    getStalenessScore:   getStalenessScore,
    getUnseenBonus:      getUnseenBonus,
    trackRecipeServed:   trackRecipeServed,
    trackWeekPlanServed: trackWeekPlanServed,
    weightedPick:        weightedPick,
    getExposureStats:    getExposureStats,
    weekDiversityScore:  weekDiversityScore,
    clearHistory:        clearHistory,
    // Constants exposed for tests
    _STALENESS:          STALENESS,
    _UNSEEN_BONUS:       UNSEEN_BONUS,
    _HISTORY_DAYS:       HISTORY_DAYS
  };

})(typeof window !== 'undefined' ? window : this);
