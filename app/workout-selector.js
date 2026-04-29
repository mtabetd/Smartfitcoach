'use strict';
// ─── WORKOUT SELECTOR ─────────────────────────────────────────────────────────
// Selects the optimal workout from workout-library.json for a given user state.
//
// API:
//   selectWorkout(params, library) → { selected_workout_id, reasoning, adaptation }
//
// Guarantees:
//   · Pure function — no side effects
//   · Deterministic — same input → same output
//   · Internals exported for unit tests
// ─────────────────────────────────────────────────────────────────────────────

(function (root) {

  // ── Constants ─────────────────────────────────────────────────────────────

  var VALID_LEVELS   = ['beginner', 'intermediate'];
  var VALID_GOALS    = ['fat_loss', 'toning', 'strength', 'conditioning', 'recomposition'];
  var VALID_SUBTYPES = ['hiit', 'zone2', 'mixed', 'heavy', 'explosive', 'tempo', 'volume'];

  // Subtypes that reduce systemic stress — forced when fatigue >= 4
  var RECOVERY_SUBTYPES = ['zone2', 'tempo'];

  // Subtype affinity per goal (ordered by priority)
  var GOAL_SUBTYPE_AFFINITY = {
    fat_loss:      ['hiit', 'mixed', 'zone2'],
    toning:        ['volume', 'tempo', 'mixed'],
    strength:      ['heavy', 'volume', 'explosive'],
    conditioning:  ['hiit', 'mixed', 'zone2', 'explosive'],
    recomposition: ['mixed', 'volume', 'zone2', 'tempo']
  };

  // Duration tolerance in minutes
  var DURATION_TOLERANCE = 5;

  // ── Validation ────────────────────────────────────────────────────────────

  function _validateParams(p) {
    if (!p || typeof p !== 'object') throw new Error('params must be an object');
    if (!VALID_LEVELS.includes(p.user_level))
      throw new Error('user_level must be one of: ' + VALID_LEVELS.join(', '));
    if (!VALID_GOALS.includes(p.goal))
      throw new Error('goal must be one of: ' + VALID_GOALS.join(', '));
    if (typeof p.available_time !== 'number' || p.available_time < 5 || p.available_time > 180)
      throw new Error('available_time must be a number between 5 and 180');
    if (typeof p.fatigue_level !== 'number' || p.fatigue_level < 1 || p.fatigue_level > 5)
      throw new Error('fatigue_level must be a number between 1 and 5');
    if (!Array.isArray(p.last_workouts))
      throw new Error('last_workouts must be an array');
    if (p.preferred_subtypes !== undefined && p.preferred_subtypes !== null) {
      if (!Array.isArray(p.preferred_subtypes))
        throw new Error('preferred_subtypes must be an array or null');
      p.preferred_subtypes.forEach(function (s) {
        if (!VALID_SUBTYPES.includes(s))
          throw new Error('invalid preferred_subtype: ' + s);
      });
    }
  }

  // ── Library helpers ───────────────────────────────────────────────────────

  function _flattenLibrary(library) {
    var all = [];
    Object.keys(library).forEach(function (subtype) {
      Object.keys(library[subtype]).forEach(function (level) {
        library[subtype][level].forEach(function (w) {
          all.push(w);
        });
      });
    });
    return all;
  }

  // Extract subtype from a workout ID (e.g. "hiit-b-01" → "hiit", "z2-b-01" → "zone2")
  function _subtypeFromId(id) {
    if (!id) return null;
    if (id.startsWith('hiit'))  return 'hiit';
    if (id.startsWith('z2'))    return 'zone2';
    if (id.startsWith('mix'))   return 'mixed';
    if (id.startsWith('hvy'))   return 'heavy';
    if (id.startsWith('exp'))   return 'explosive';
    if (id.startsWith('tmp'))   return 'tempo';
    if (id.startsWith('vol'))   return 'volume';
    return null;
  }

  // ── Fatigue → intensity mode ──────────────────────────────────────────────

  function _intensityMode(fatigue) {
    if (fatigue <= 2) return 'push';
    if (fatigue <= 3) return 'normal';
    return 'reduce';
  }

  // ── Candidate filtering ───────────────────────────────────────────────────

  function _filterCandidates(allWorkouts, params) {
    var mode              = _intensityMode(params.fatigue_level);
    var lastSubtypes      = params.last_workouts.map(_subtypeFromId).filter(Boolean);
    var preferredSubtypes = params.preferred_subtypes || [];

    return allWorkouts.filter(function (w) {
      // Must match level
      if (w.level !== params.user_level) return false;

      // Must fit available time within tolerance
      if (Math.abs(w.duration - params.available_time) > DURATION_TOLERANCE) return false;

      // Fatigue >= 4: hard-restrict to recovery subtypes
      if (mode === 'reduce' && !RECOVERY_SUBTYPES.includes(w.subtype)) return false;

      return true;
    });
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  function _scoreCandidates(candidates, params) {
    var mode              = _intensityMode(params.fatigue_level);
    var affinity          = GOAL_SUBTYPE_AFFINITY[params.goal] || [];
    var lastSubtypes      = params.last_workouts.map(_subtypeFromId).filter(Boolean);
    var lastIds           = params.last_workouts;
    var preferredSubtypes = params.preferred_subtypes || [];

    return candidates.map(function (w) {
      var score = 0;

      // Goal match on workout's own goal field
      if (w.goal === params.goal) score += 30;

      // Subtype affinity for user's goal
      var affinityIdx = affinity.indexOf(w.subtype);
      if (affinityIdx === 0) score += 25;
      else if (affinityIdx === 1) score += 15;
      else if (affinityIdx === 2) score += 8;

      // User preferred subtypes
      if (preferredSubtypes.includes(w.subtype)) score += 20;

      // Variety: penalise recently used subtypes
      var subtypeRepeatCount = lastSubtypes.filter(function (s) { return s === w.subtype; }).length;
      score -= subtypeRepeatCount * 12;

      // Exact ID already used recently
      if (lastIds.includes(w.id)) score -= 40;

      // Duration precision bonus (closer = better)
      var drift = Math.abs(w.duration - params.available_time);
      score += (DURATION_TOLERANCE - drift) * 2;

      // Fatigue 1-2 (push): reward high-intensity subtypes
      if (mode === 'push' && ['hiit', 'heavy', 'explosive'].includes(w.subtype)) score += 15;

      return { workout: w, score: score };
    });
  }

  // ── Reasoning builder ─────────────────────────────────────────────────────

  function _buildReasoning(selected, params, allScored) {
    var mode     = _intensityMode(params.fatigue_level);
    var affinity = GOAL_SUBTYPE_AFFINITY[params.goal] || [];
    var parts    = [];

    // Goal alignment
    if (selected.goal === params.goal) {
      parts.push(selected.subtype + ' matches ' + params.goal + ' goal directly');
    } else if (affinity.includes(selected.subtype)) {
      parts.push(selected.subtype + ' is the highest-affinity subtype for ' + params.goal);
    }

    // Duration
    var drift = Math.abs(selected.duration - params.available_time);
    if (drift === 0) {
      parts.push('exact duration match (' + selected.duration + ' min)');
    } else {
      parts.push(selected.duration + ' min fits ' + params.available_time + ' min window (±' + drift + ' min)');
    }

    // Variety
    var lastSubtypes = params.last_workouts.map(_subtypeFromId).filter(Boolean);
    var recentSame   = lastSubtypes.filter(function (s) { return s === selected.subtype; }).length;
    if (recentSame === 0) {
      parts.push('fresh subtype — no ' + selected.subtype + ' in last ' + params.last_workouts.length + ' sessions');
    }

    // Progression intent
    if (selected.intent) {
      parts.push('intent: ' + selected.intent);
    }

    return parts.join('; ') + '.';
  }

  function _buildAdaptation(selected, params) {
    var mode    = _intensityMode(params.fatigue_level);
    var fatigue = params.fatigue_level;

    if (mode === 'reduce') {
      return 'Fatigue ' + fatigue + '/5 detected — session capped to ' + selected.subtype +
             ' to preserve recovery. Use the "easier" scaling option. ' +
             (selected.scaling && selected.scaling.easier ? '"' + selected.scaling.easier + '"' : '') + ' Intensity suppressed; aerobic flush only.';
    }
    if (mode === 'push') {
      return 'Fatigue ' + fatigue + '/5 — full output authorised. ' +
             (selected.scaling && selected.scaling.harder ? 'Apply harder scaling: "' + selected.scaling.harder + '"' : 'Drive the intensity ceiling.') +
             ' No modifications to prescribed structure.';
    }
    // normal
    return 'Fatigue ' + fatigue + '/5 — standard intensity. ' +
           'Execute as prescribed. ' +
           (selected.scaling && selected.scaling.easier
             ? 'Easier option available if form degrades: "' + selected.scaling.easier + '"'
             : 'Monitor form; stop 1-2 reps shy of failure on strength sets.');
  }

  // ── Main selector ─────────────────────────────────────────────────────────

  function selectWorkout(params, library) {
    _validateParams(params);

    if (!library || typeof library !== 'object')
      throw new Error('library must be an object (content of workout-library.json)');

    var allWorkouts = _flattenLibrary(library);
    var candidates  = _filterCandidates(allWorkouts, params);

    // Fallback: if fatigue reduce filter leaves nothing, widen to all level-matching workouts
    // within duration window (edge case: no zone2/tempo in duration window)
    if (candidates.length === 0) {
      candidates = allWorkouts.filter(function (w) {
        return w.level === params.user_level &&
               Math.abs(w.duration - params.available_time) <= DURATION_TOLERANCE;
      });
    }

    // Fallback 2: widen duration tolerance to ±10 min
    if (candidates.length === 0) {
      candidates = allWorkouts.filter(function (w) {
        return w.level === params.user_level &&
               Math.abs(w.duration - params.available_time) <= 10;
      });
    }

    if (candidates.length === 0) {
      throw new Error('No workout found for level=' + params.user_level +
                      ', available_time=' + params.available_time + ' min');
    }

    var scored   = _scoreCandidates(candidates, params);
    scored.sort(function (a, b) { return b.score - a.score; });

    var selected = scored[0].workout;

    return {
      selected_workout_id: selected.id,
      reasoning:           _buildReasoning(selected, params, scored),
      adaptation:          _buildAdaptation(selected, params)
    };
  }

  // ── Exports ───────────────────────────────────────────────────────────────

  var API = {
    selectWorkout:       selectWorkout,
    // internals for tests
    _validateParams:     _validateParams,
    _flattenLibrary:     _flattenLibrary,
    _subtypeFromId:      _subtypeFromId,
    _intensityMode:      _intensityMode,
    _filterCandidates:   _filterCandidates,
    _scoreCandidates:    _scoreCandidates,
    _buildReasoning:     _buildReasoning,
    _buildAdaptation:    _buildAdaptation
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    root.WorkoutSelector = API;
  }

}(typeof globalThis !== 'undefined' ? globalThis : this));
