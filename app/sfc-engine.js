/**
 * sfc-engine.js — Resilient Training-Nutrition Core
 *
 * Pure functions only. No side effects. No global state. No localStorage.
 *
 * Architecture guarantee:
 *   sessions[] is the single source of truth.
 *   Every output is a deterministic projection of that array.
 *   Reload, missed saves, wrong inputs, inactivity — all handled.
 *
 * Public API:
 *   computeTrainingSignal(sessions, now)
 *   computeRollingLoad(sessions, now)
 *   computeNutrition(user, sessions, now)
 *   computeCycleProgression(sessions)
 *   sanitizeSessionInput(session, history)
 */
;(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SFCEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────────

  var MS_PER_DAY = 86400000;

  // Exercises that engage large muscle chains — primary load driver
  var HEAVY_GROUP_RE  = /squat|deadlift|rdl|romanian|hip.?thrust|leg.?press|hack.?squat|lunge|bulgarian|step.?up|good.?morning|soulev/i;
  // Multi-joint movements — secondary load signal
  var COMPOUND_RE     = /squat|deadlift|rdl|bench.?press|overhead.?press|row|pull.?up|chin.?up|dip|lunge|hip.?thrust|clean|snatch|push.?press|thruster|press/i;

  // Ordered load levels — used for ranking comparisons
  var LOAD_RANK = { rest: 0, light: 1, moderate: 2, heavy: 3 };

  // Periodization phases — 4 training days per phase, 4 phases per cycle (16 days total)
  var PHASES = [
    { id: 'hypertrophy',  label: 'Hypertrophy',  setsRange: [3, 4], repsRange: [10, 12], intensityPct: 70 },
    { id: 'hypertrophy2', label: 'Hypertrophy+', setsRange: [4, 5], repsRange: [8,  10], intensityPct: 75 },
    { id: 'strength',     label: 'Strength',     setsRange: [4, 5], repsRange: [4,  6],  intensityPct: 85 },
    { id: 'deload',       label: 'Deload',       setsRange: [2, 3], repsRange: [12, 15], intensityPct: 55 }
  ];
  var DAYS_PER_PHASE = 4;
  var CYCLE_LENGTH   = DAYS_PER_PHASE * PHASES.length; // 16 training days per full cycle

  // Carb/fat split of *remaining* calories (after protein) by effective load
  var CARB_FAT_SPLITS = {
    heavy:    { carbs: 0.65, fat: 0.35 },
    moderate: { carbs: 0.55, fat: 0.45 },
    light:    { carbs: 0.45, fat: 0.55 },
    rest:     { carbs: 0.35, fat: 0.65 }
  };

  // ─── Date utilities ──────────────────────────────────────────────────────────

  function toDateStr(ts) {
    // UTC date string — consistent across timezones for cross-device parity
    return new Date(+ts).toISOString().slice(0, 10);
  }

  // ─── Session validation ──────────────────────────────────────────────────────

  function isValidExercise(ex) {
    return ex != null
      && typeof ex.name === 'string' && ex.name.trim().length > 0
      && typeof ex.sets === 'number' && ex.sets >= 1
      && typeof ex.reps === 'number' && ex.reps >= 1;
  }

  // A session counts if it has a timestamp and at least one real exercise
  function isValidSession(s) {
    if (!s || typeof s.timestamp !== 'number' || !isFinite(s.timestamp)) return false;
    if (!Array.isArray(s.exercises)) return false;
    return s.exercises.some(isValidExercise);
  }

  function getValidSessions(sessions) {
    return Array.isArray(sessions) ? sessions.filter(isValidSession) : [];
  }

  // ─── Load classification (private) ──────────────────────────────────────────

  function sessionVolume(session) {
    if (!isValidSession(session)) return 0;
    return session.exercises.filter(isValidExercise).reduce(function (sum, ex) {
      // Bodyweight exercises (weight=0) contribute 1kg proxy so they count
      var w = (typeof ex.weight === 'number' && isFinite(ex.weight) && ex.weight > 0) ? ex.weight : 1;
      return sum + ex.sets * ex.reps * w;
    }, 0);
  }

  // Classify a flat list of exercises (already merged across same-day sessions)
  function classifyExercises(exercises) {
    var valid = exercises.filter(isValidExercise);
    if (valid.length === 0) return null;

    var hasHeavyGroup = valid.some(function (ex) { return HEAVY_GROUP_RE.test(ex.name); });
    var compoundCount = valid.filter(function (ex) { return COMPOUND_RE.test(ex.name); }).length;

    if (valid.length >= 6 && hasHeavyGroup && compoundCount >= 4) return 'heavy';
    if (valid.length <= 2 || !hasHeavyGroup) return 'light';
    return 'moderate';
  }

  // Merge all exercises from multiple sessions on the same day, then classify.
  // This makes double sessions additive, not competing.
  function loadForDaySessions(daySessions) {
    if (!daySessions || daySessions.length === 0) return null;
    var merged = daySessions.reduce(function (all, s) {
      return all.concat((s.exercises || []).filter(isValidExercise));
    }, []);
    return classifyExercises(merged);
  }

  function maxLoad(loads) {
    return loads.reduce(function (best, l) {
      return (LOAD_RANK[l] || 0) > (LOAD_RANK[best] || 0) ? l : best;
    }, 'rest');
  }

  function groupByDate(sessions) {
    return sessions.reduce(function (acc, s) {
      var d = toDateStr(s.timestamp);
      if (!acc[d]) acc[d] = [];
      acc[d].push(s);
      return acc;
    }, {});
  }

  // Returns sessions whose date falls within [today - (daysBack-1), today]
  function sessionsInWindow(validSessions, now, daysBack) {
    var allowed = {};
    for (var i = 0; i < daysBack; i++) {
      allowed[toDateStr(+now - i * MS_PER_DAY)] = true;
    }
    return validSessions.filter(function (s) { return !!allowed[toDateStr(s.timestamp)]; });
  }

  // ─── 1. computeTrainingSignal ────────────────────────────────────────────────

  /**
   * Answers: did the user actually train today or yesterday?
   * Handles multiple sessions per day by merging before classifying.
   *
   * @param  {Array}  sessions  raw session log
   * @param  {number} now       Unix timestamp (ms)
   * @returns {{
   *   trainedToday: boolean,
   *   trainedYesterday: boolean,
   *   daysSinceLastSession: number,   // Infinity if no sessions
   *   todayLoad: string|null,         // 'heavy'|'moderate'|'light'|null
   *   yesterdayLoad: string|null,
   *   todaySessionCount: number,
   *   yesterdaySessionCount: number
   * }}
   */
  function computeTrainingSignal(sessions, now) {
    var ts    = +now || Date.now();
    var valid = getValidSessions(sessions);
    var today = toDateStr(ts);
    var yest  = toDateStr(ts - MS_PER_DAY);
    var byDate = groupByDate(valid);

    var todaySess = byDate[today] || [];
    var yestSess  = byDate[yest]  || [];

    var daysSinceLastSession = Infinity;
    if (valid.length > 0) {
      var latestTs = valid.reduce(function (m, s) { return Math.max(m, s.timestamp); }, 0);
      // floor so "trained 2 hours ago" = 0 days, not 0.08 days
      daysSinceLastSession = Math.floor((ts - latestTs) / MS_PER_DAY);
    }

    return {
      trainedToday:          todaySess.length > 0,
      trainedYesterday:      yestSess.length  > 0,
      daysSinceLastSession:  daysSinceLastSession,
      todayLoad:             loadForDaySessions(todaySess),
      yesterdayLoad:         loadForDaySessions(yestSess),
      todaySessionCount:     todaySess.length,
      yesterdaySessionCount: yestSess.length
    };
  }

  // ─── 2. computeRollingLoad ───────────────────────────────────────────────────

  /**
   * Computes training load summaries over 1-, 3-, and 7-day windows.
   * Each window reports: session count, training days, total volume,
   * average daily volume, and peak load seen.
   * Double sessions on the same day are merged before classification.
   *
   * @param  {Array}  sessions
   * @param  {number} now
   * @returns {{ last1d, last3d, last7d }}
   */
  function computeRollingLoad(sessions, now) {
    var ts    = +now || Date.now();
    var valid = getValidSessions(sessions);
    return {
      last1d: windowStats(valid, ts, 1),
      last3d: windowStats(valid, ts, 3),
      last7d: windowStats(valid, ts, 7)
    };
  }

  function windowStats(valid, now, daysBack) {
    var inWin        = sessionsInWindow(valid, now, daysBack);
    var byDate       = groupByDate(inWin);
    var datKeys      = Object.keys(byDate);
    var trainingDays = datKeys.length;

    var totalVolume = inWin.reduce(function (s, sess) { return s + sessionVolume(sess); }, 0);

    // Classify each *day* (not each session) — prevents double-session inflation
    var dayLoads = datKeys.map(function (d) { return loadForDaySessions(byDate[d]); }).filter(Boolean);

    return {
      sessionCount:   inWin.length,
      trainingDays:   trainingDays,
      totalVolume:    Math.round(totalVolume),
      avgDailyVolume: trainingDays > 0 ? Math.round(totalVolume / trainingDays) : 0,
      peakLoad:       maxLoad(dayLoads)   // 'rest' if no sessions in window
    };
  }

  // ─── 3. computeNutrition ────────────────────────────────────────────────────

  /**
   * Computes daily macro targets from ACTUAL training history.
   * Never reads a schedule — only what physically happened.
   *
   * Behaviour:
   *   Trained today          → macros reflect today's actual load
   *   Trained yesterday only → recovery macros (proportional to yesterday's load)
   *   2+ days no training    → slides progressively toward rest-day macros
   *   7+ days no training    → full rest-day macros
   *   Multiple sessions      → day's exercises merged before load classification
   *
   * @param  {{ weight: number, goal: string }} user
   * @param  {Array}  sessions
   * @param  {number} now
   * @returns {{ calorieTarget, proteinGrams, carbGrams, fatGrams, effectiveLoad, basis }}
   */
  function computeNutrition(user, sessions, now) {
    var ts     = +now || Date.now();
    var weight = (user && typeof user.weight === 'number' && user.weight > 0) ? user.weight : 75;
    var VALID_GOALS = ['fat_loss', 'recomp', 'muscle_gain', 'performance'];
    var goal   = (user && VALID_GOALS.indexOf(user.goal) !== -1) ? user.goal : 'recomp';

    // ── Step 1: Resting metabolic rate ──────────────────────────────────────
    // Weight-based Mifflin proxy when sex/height/age are unavailable.
    // Uses Mifflin constant term averaged across sex (males +5, females -161 → avg -78)
    // and typical adult height 170cm / age 35y → 6.25*170-5*35 = 887.5.
    // Net: BMR ≈ 10*weight + 810. Previous formula (weight*22+500) overcounted by 450-600 kcal.
    var bmr = user && typeof user.heightCm === 'number' && typeof user.age === 'number'
      ? (10 * weight + 6.25 * user.heightCm - 5 * user.age + (user.sex === 'female' ? -161 : 5))
      : (10 * weight + 810);

    // ── Step 2: Activity PAL from ACTUAL last-7-day training density ────────
    // Not from the onboarding schedule — from what the user literally did
    var rolling      = computeRollingLoad(sessions, ts);
    var weekDays     = rolling.last7d.trainingDays;
    var activityPAL  = weekDays >= 6 ? 1.90
                     : weekDays >= 5 ? 1.725
                     : weekDays >= 3 ? 1.55
                     : weekDays >= 1 ? 1.375
                     : 1.2;

    var tdee = bmr * activityPAL;

    // ── Step 3: Caloric target by goal ──────────────────────────────────────
    var GOAL_DELTA = { fat_loss: -400, recomp: -100, muscle_gain: +300, performance: 0 };
    var _kcalFloor = (user && user.sex === 'female') ? 1400 : 1500;
    var calorieTarget = Math.max(_kcalFloor, Math.round(tdee + (GOAL_DELTA[goal] || 0)));

    // ── Step 4: Effective load from ACTUAL sessions (not from schedule) ─────
    var signal = computeTrainingSignal(sessions, ts);
    var daysOut = signal.daysSinceLastSession === Infinity ? 99 : signal.daysSinceLastSession;

    var effectiveLoad;
    if (signal.trainedToday) {
      effectiveLoad = signal.todayLoad || 'moderate';
    } else if (signal.trainedYesterday) {
      // Recovery day — macros match yesterday's effort (glycogen replenishment continues)
      effectiveLoad = signal.yesterdayLoad || 'moderate';
    } else {
      effectiveLoad = 'rest';
    }

    // ── Step 5: Protein — fixed at 2g/kg regardless of load ─────────────────
    // Evidence-based floor for active individuals; does not change with carb cycling
    var proteinGrams = Math.round(weight * 2);
    var remaining    = Math.max(0, calorieTarget - proteinGrams * 4);

    // ── Step 6: Carb/fat split — inactivity blends toward rest macros ───────
    // Day 0–1: 0% blend (full training macros)
    // Day 2–7: linear blend toward rest macros (body needs less fuel when idle)
    // Day 7+:  100% rest macros
    var baseSplit = CARB_FAT_SPLITS[effectiveLoad] || CARB_FAT_SPLITS.rest;
    var restSplit = CARB_FAT_SPLITS.rest;
    var blend     = daysOut <= 1 ? 0 : Math.min((daysOut - 1) / 6, 1.0);

    var carbsRatio = baseSplit.carbs + (restSplit.carbs - baseSplit.carbs) * blend;
    var fatRatio   = baseSplit.fat   + (restSplit.fat   - baseSplit.fat)   * blend;

    return {
      calorieTarget: calorieTarget,
      proteinGrams:  proteinGrams,
      carbGrams:     Math.round(remaining * carbsRatio / 4),
      fatGrams:      Math.round(remaining * fatRatio   / 9),
      effectiveLoad: effectiveLoad,
      // Diagnostic payload — lets the UI explain *why* these numbers exist
      basis: {
        bmr:                 Math.round(bmr),
        tdee:                Math.round(tdee),
        activityPAL:         activityPAL,
        weeklyTrainingDays:  weekDays,
        daysSinceLastSession: signal.daysSinceLastSession === Infinity ? null : signal.daysSinceLastSession,
        inactivityBlendPct:  Math.round(blend * 100)
      }
    };
  }

  // ─── 4. computeCycleProgression ─────────────────────────────────────────────

  /**
   * Derives current training phase from completed training days only.
   *
   * Key decisions:
   *   - Unit = unique training day (double session = 1 day, not 2)
   *   - Skipped days do not advance the phase — biologically accurate
   *   - No manual counter, no calendar time — only actual training
   *   - Overreaching (≥6 days/week or ≥5 consecutive days) forces deload
   *
   * @param  {Array} sessions
   * @returns {{
   *   phase: object, programWeek: number, dayInPhase: number,
   *   daysToNextPhase: number, cycleNumber: number, totalTrainingDays: number,
   *   overreachingDetected: boolean, overreachingReason: string|null
   * }}
   */
  function computeCycleProgression(sessions) {
    var valid = getValidSessions(sessions);

    // Count unique calendar training days — prevents double-session inflation
    var trainingDayMap = valid.reduce(function (m, s) {
      m[toDateStr(s.timestamp)] = true;
      return m;
    }, {});
    var totalDays = Object.keys(trainingDayMap).length;

    var daysIntoCycle = totalDays % CYCLE_LENGTH;
    var cycleNumber   = Math.floor(totalDays / CYCLE_LENGTH) + 1;
    var phaseIdx      = Math.floor(daysIntoCycle / DAYS_PER_PHASE);
    var dayInPhase    = daysIntoCycle % DAYS_PER_PHASE;
    var phase         = PHASES[Math.min(phaseIdx, PHASES.length - 1)];

    var overreach       = detectOverreaching(valid);
    var activePhaseIdx  = overreach.detected ? PHASES.length - 1 : phaseIdx;
    var activePhase     = overreach.detected ? PHASES[PHASES.length - 1] : phase;

    return {
      phase:               activePhase,
      programWeek:         activePhaseIdx + 1,   // 1-4
      dayInPhase:          dayInPhase + 1,        // 1-4 within current phase
      daysToNextPhase:     DAYS_PER_PHASE - dayInPhase,
      cycleNumber:         cycleNumber,
      totalTrainingDays:   totalDays,
      overreachingDetected: overreach.detected,
      overreachingReason:   overreach.reason || null
    };
  }

  // Two overreaching signals: rolling-7d density and consecutive-day streak
  function detectOverreaching(validSessions) {
    if (validSessions.length < 5) return { detected: false, reason: null };

    var dates = Object.keys(
      validSessions.reduce(function (m, s) { m[toDateStr(s.timestamp)] = true; return m; }, {})
    ).sort();

    // Signal A: ≥6 unique training days inside any rolling 7-day window
    for (var i = 0; i < dates.length; i++) {
      var winEnd = new Date(dates[i]);
      winEnd.setUTCDate(winEnd.getUTCDate() + 6);
      var winEndStr = winEnd.toISOString().slice(0, 10);
      var count = 0;
      for (var k = i; k < dates.length && dates[k] <= winEndStr; k++) count++;
      if (count >= 6) {
        return { detected: true, reason: count + ' training days in 7-day window' };
      }
    }

    // Signal B: ≥5 consecutive calendar days with training (no rest day)
    var streak = 1;
    for (var j = 1; j < dates.length; j++) {
      var diff = Math.round((new Date(dates[j]) - new Date(dates[j - 1])) / MS_PER_DAY);
      streak = diff === 1 ? streak + 1 : 1;
      if (streak >= 5) {
        return { detected: true, reason: streak + ' consecutive training days without rest' };
      }
    }

    return { detected: false, reason: null };
  }

  // ─── 5. sanitizeSessionInput ────────────────────────────────────────────────

  /**
   * Validates and corrects a raw session before it enters the log.
   *
   * Guards against:
   *   - Missing or invalid fields (clamped to safe defaults)
   *   - Weight jumps > 25% above historical median (rejected, suggestion provided)
   *   - Unreasonably large absolute values (hard cap at 500kg)
   *   - Corrupted exercise entries (filtered out, not rejected wholesale)
   *
   * Does NOT reject the session for bad weights — it corrects them.
   * A corrected session is always preferable to a lost session.
   *
   * @param  {Object} session  raw session from UI or sync layer
   * @param  {Array}  history  existing validated sessions (for weight context)
   * @returns {{ session: Object, valid: boolean, errors: string[], warnings: string[] }}
   */
  function sanitizeSessionInput(session, history) {
    var errors   = [];
    var warnings = [];

    if (!session || typeof session !== 'object') {
      return { session: null, valid: false, errors: ['invalid_session'], warnings: [] };
    }

    var ts = (typeof session.timestamp === 'number' && isFinite(session.timestamp))
      ? session.timestamp : Date.now();

    if (!Array.isArray(session.exercises) || session.exercises.length === 0) {
      return { session: null, valid: false, errors: ['no_exercises'], warnings: [] };
    }

    var safeHistory = getValidSessions(history);

    var sanitizedExercises = session.exercises.map(function (ex) {
      if (!ex || typeof ex.name !== 'string' || !ex.name.trim()) {
        errors.push('exercise_missing_name');
        return null;
      }

      var name = ex.name.trim();
      var sets = clampInt(ex.sets, 1, 10, 3);
      var reps = clampInt(ex.reps, 1, 60, 8);

      if (sets !== ex.sets) warnings.push(name + ': sets out of range, clamped to ' + sets);
      if (reps !== ex.reps) warnings.push(name + ': reps out of range, clamped to ' + reps);

      var wResult = sanitizeWeight(ex.weight, name, safeHistory);
      if (wResult.flagged) {
        warnings.push(name + ': weight ' + wResult.reason
          + ' (given: ' + ex.weight + 'kg, used: ' + wResult.value + 'kg)');
      }

      return { name: name, sets: sets, reps: reps, weight: wResult.value };
    }).filter(Boolean);

    if (sanitizedExercises.length === 0) {
      errors.push('no_valid_exercises_after_sanitization');
    }

    // Duration cap: 5 hours maximum (300 min) — prevents corrupted timestamps
    var duration = (typeof session.duration === 'number' && session.duration > 0)
      ? Math.min(Math.round(session.duration), 300) : 0;

    return {
      session: {
        id:        session.id || (ts + '_' + Math.random().toString(36).slice(2, 7)),
        timestamp: ts,
        exercises: sanitizedExercises,
        duration:  duration
      },
      valid:    errors.length === 0 && sanitizedExercises.length > 0,
      errors:   errors,
      warnings: warnings
    };
  }

  // Validate a single weight value against recent history for that exercise.
  // Returns a safe value — always. Never throws, never returns undefined.
  function sanitizeWeight(rawWeight, exerciseName, safeHistory) {
    // Bodyweight / explicitly zero weight — valid, nothing to check
    if (rawWeight == null || rawWeight === '' || rawWeight === 0) {
      return { value: 0, flagged: false, reason: null };
    }

    var w = parseFloat(rawWeight);

    if (!isFinite(w) || w < 0) {
      return { value: 0, flagged: true, reason: 'non_numeric' };
    }

    // Hard ceiling — physiological maximum regardless of history
    if (w > 500) {
      return { value: 500, flagged: true, reason: 'exceeds_hard_maximum_500kg' };
    }

    // Gather recent weights for this specific exercise
    var recentWeights = [];
    for (var i = 0; i < safeHistory.length; i++) {
      var exs = safeHistory[i].exercises || [];
      for (var j = 0; j < exs.length; j++) {
        var ex = exs[j];
        if (ex.name === exerciseName
            && typeof ex.weight === 'number'
            && ex.weight > 0
            && isFinite(ex.weight)) {
          recentWeights.push(ex.weight);
        }
      }
    }
    // Keep only the most recent 10 entries (ascending order for median)
    recentWeights = recentWeights.slice(-10).sort(function (a, b) { return a - b; });

    // Not enough history to establish a baseline — apply only hard ceiling
    if (recentWeights.length < 3) {
      return { value: snap2_5(w), flagged: false, reason: null };
    }

    var median     = recentWeights[Math.floor(recentWeights.length / 2)];
    var maxAllowed = median * 1.25;  // +25% per session: aggressive but not impossible
    var minWarn    = median * 0.30;  // flag large drops (could be deload or typo)

    if (w > maxAllowed) {
      // Reject and suggest a plausible +10% instead
      var suggested = snap2_5(median * 1.10);
      return {
        value:   suggested,
        flagged: true,
        reason:  'jump_exceeds_25pct (median ' + median + 'kg, max ' + snap2_5(maxAllowed) + 'kg, suggested ' + suggested + 'kg)'
      };
    }

    if (w > 0 && w < minWarn) {
      // Accept — could be an intentional deload — but surface the anomaly
      return { value: snap2_5(w), flagged: true, reason: 'large_reduction_below_30pct_median' };
    }

    return { value: snap2_5(w), flagged: false, reason: null };
  }

  // ─── Micro-utilities ─────────────────────────────────────────────────────────

  function clampInt(value, min, max, fallback) {
    var n = parseInt(value, 10);
    return isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
  }

  function snap2_5(v) {
    // Round to nearest 2.5kg — standard barbell plate alignment
    return Math.round(v / 2.5) * 2.5;
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  return {
    computeTrainingSignal:   computeTrainingSignal,
    computeRollingLoad:      computeRollingLoad,
    computeNutrition:        computeNutrition,
    computeCycleProgression: computeCycleProgression,
    sanitizeSessionInput:    sanitizeSessionInput
  };
}));
