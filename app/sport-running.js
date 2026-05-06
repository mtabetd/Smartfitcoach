// ─── RUNNING ZONE INTENSITY FACTORS ───
// Z1 recovery · Z2 endurance · Z3 tempo · Z4 interval · Z5 max
// Extracted from app-sport.js — DO NOT edit directly; edit this module.

var RUN_ZONE_FACTORS = { 'Z1': 0.5, 'Z1-Z2': 0.65, 'Z2': 0.8, 'Z3': 1.0, 'Z3-Z4': 1.15, 'Z4': 1.3, 'Z4-Z5': 1.5, 'Z5': 1.6 };

// ─── RÈGLE 10% PROGRESSION VOLUME RUNNING ────────────────────────────────────
// Sources : ACSM 2016 Running Medicine ; Hreljac 2004 (Br J Sports Med) — Overuse Injuries.
;(function(root) {

  /**
   * Vérifie si le volume hebdomadaire proposé respecte la règle +10%.
   * @param {number} prevWeekKm   — km semaine précédente
   * @param {number} proposedKm  — km proposés cette semaine
   * @returns {{ allowed, maxKm, capApplied, reason }}
   */
  root.checkRunning10pct = function checkRunning10pct(prevWeekKm, proposedKm) {
    if (typeof prevWeekKm !== 'number' || prevWeekKm <= 0) {
      return { allowed: true, maxKm: proposedKm, capApplied: false, reason: null };
    }
    var maxKm = Math.round(prevWeekKm * 1.10 * 10) / 10;
    if (proposedKm <= maxKm) {
      return { allowed: true, maxKm: maxKm, capApplied: false, reason: null };
    }
    return {
      allowed:    false,
      maxKm:      maxKm,
      capApplied: true,
      reason:     'Volume proposé (' + proposedKm + ' km) dépasse +10% ' +
                  '(max ' + maxKm + ' km | sem précédente : ' + prevWeekKm + ' km). ' +
                  'Réf : ACSM 2016 Running Medicine.'
    };
  };

  /**
   * Calcule le total km courus la semaine calendaire précédente (lun-dim).
   * @param {object} [stateOverride] — remplace window.S pour les tests
   * @returns {number}
   */
  root.getLastWeekRunKm = function getLastWeekRunKm(stateOverride) {
    var S = stateOverride || (root.S) || {};
    var hist = S.sessionHistory || S.runningLog || [];
    if (!Array.isArray(hist) || hist.length === 0) return 0;

    var now      = new Date();
    var dayOfWeek = (now.getDay() + 6) % 7; // 0 = lundi
    var monday   = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek - 7);
    monday.setHours(0, 0, 0, 0);
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return hist.reduce(function(total, sess) {
      if (!sess || !sess.date) return total;
      var d = new Date(sess.date);
      if (d < monday || d > sunday) return total;
      var km = sess.distance_km || sess.distanceKm ||
               (sess.distance && sess.distance < 200 ? sess.distance : 0);
      return total + (Number(km) || 0);
    }, 0);
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
