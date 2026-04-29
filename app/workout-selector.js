'use strict';
// ─── WORKOUT SELECTOR ─────────────────────────────────────────────────────────
// Selects the optimal workout from workout-library.json for a given user state.
//
// API:
//   selectWorkout(params, library) → {
//     selected_workout_id, reasoning, adaptation,
//     session_focus, momentum_tag, coach_message
//   }
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

  // ── Momentum tag ─────────────────────────────────────────────────────────

  // Benchmark marker — workouts whose progression_hint signals a retest
  var BENCHMARK_PATTERN = /benchmark|retest|sub-\d+|test/i;

  function _buildMomentumTag(selected, params) {
    var mode = _intensityMode(params.fatigue_level);
    if (mode === 'reduce') return 'recover';
    if (selected.progression_hint && BENCHMARK_PATTERN.test(selected.progression_hint)) return 'test';
    if (mode === 'push') return 'push';
    return 'build';
  }

  // ── Session focus ─────────────────────────────────────────────────────────

  var SUBTYPE_FOCUS_LABEL = {
    hiit:      'High-intensity metabolic conditioning',
    zone2:     'Aerobic base — low intensity, high duration',
    mixed:     'Concurrent strength and cardio stimulus',
    heavy:     'Maximal strength — compound barbell focus',
    explosive: 'Power and reactive strength development',
    tempo:     'Time under tension — eccentric control',
    volume:    'High-volume accumulation'
  };

  function _buildSessionFocus(selected) {
    var label = SUBTYPE_FOCUS_LABEL[selected.subtype] || selected.subtype;
    var intent = selected.intent
      ? selected.intent.charAt(0).toUpperCase() + selected.intent.slice(1)
      : null;
    return intent ? label + ' — ' + intent : label;
  }

  // ── Coach message ─────────────────────────────────────────────────────────

  // Messages are keyed by [mode][goal] with subtype as a secondary tiebreak.
  // Each entry is an array — selector uses (subtype charCode % length) for
  // deterministic variety without randomness.
  var COACH_MESSAGES = {
    push: {
      fat_loss:      [
        'You\'re fresh. This is when real change happens — don\'t leave anything on the table.',
        'Low fatigue, high stakes. Hit every interval like it\'s the one that tips the scale.',
        'Your body is ready to burn. Respect that window — push clean, push hard.'
      ],
      toning:        [
        'Fresh legs, controlled tension. Every rep is a rep that counts — none are throwaways.',
        'You\'re in the window where muscle responds. Execute with precision, not just effort.',
        'Quality is the metric today. Move well, move fully, and let the work accumulate.'
      ],
      strength:      [
        'This is a training day that will matter in six months. Load with intent.',
        'You\'re recovered and the bar is ready. Don\'t negotiate with the weight — move it.',
        'Fresh CNS, clear mind. Chase numbers today — this is what a strong day looks like.'
      ],
      conditioning:  [
        'Engine is ready. Hold a pace that hurts just enough to matter — the whole time.',
        'Low fatigue means no excuses on pacing. Find the edge and park there.',
        'Your conditioning window is open. Fill it completely.'
      ],
      recomposition: [
        'Today you build and burn in the same session. Both sides of recomposition get worked.',
        'Lean and strong isn\'t a phase — it\'s built one session like this at a time.',
        'Fresh and focused. Recomp demands you show up exactly like this.'
      ]
    },
    normal: {
      fat_loss:      [
        'Steady state, real results. You don\'t have to destroy yourself to change your body.',
        'Consistent effort today adds to a consistent week. That\'s where fat loss lives.',
        'Hit your marks. Nothing spectacular, just the work done properly.'
      ],
      toning:        [
        'Shape is built in sessions like this — not the dramatic ones. Do the work.',
        'Every set is a deposit. Today is a normal training day — make it count anyway.',
        'Technique and tension. That\'s all this session asks. Give it both.'
      ],
      strength:      [
        'Not a max day, but not a filler day. Move serious weight with serious intent.',
        'Strength is built in accumulation, not just peaks. Today matters.',
        'Every working set at this intensity has a compounding return. Stay present.'
      ],
      conditioning:  [
        'Aerobic capacity is built across hundreds of sessions like this one. Be consistent.',
        'Hold your pace. Not heroic — just relentless.',
        'Normal day, normal effort, extraordinary long-term outcome. Trust the process.'
      ],
      recomposition: [
        'Recomp is a slow burn. Today\'s session is a link in a long chain — make it count.',
        'Moderate day, full attention. Both the strength and cardio signals need to be there.',
        'No shortcuts in recomp. Steady, complete effort across the full session.'
      ]
    },
    reduce: {
      fat_loss:      [
        'Recovery is not lost time. An aerobic flush today protects three hard sessions this week.',
        'The body recomposes during recovery, not despite it. This session is part of the plan.',
        'Easy effort, maximum adherence. Showing up is the win today.'
      ],
      toning:        [
        'Low load, high blood flow. Your muscles are repairing — help them, don\'t interrupt.',
        'Tone is preserved in recovery, not lost. Move, breathe, and let the body catch up.',
        'Fatigue is high. Today\'s value is in what you don\'t break — not what you push.'
      ],
      strength:      [
        'Strength is not built today — it\'s protected. An aerobic session now means a stronger lift next session.',
        'High fatigue and heavy iron is a bad combination. This session earns you tomorrow.',
        'Smart athletes recover on purpose. This is the session that separates serious from reckless.'
      ],
      conditioning:  [
        'Zone 2 at high fatigue flushes lactate and rebuilds the aerobic base. This is targeted recovery.',
        'Conditioning athletes know: easy days make hard days possible. Own this session.',
        'Low and slow today. Your cardiovascular system adapts during recovery, not just effort.'
      ],
      recomposition: [
        'Recomp stalls when recovery is skipped. This session is doing exactly what the plan requires.',
        'Fatigue is a signal. The body rebuilds lean tissue when you respect it — today, you do.',
        'Active recovery is active investment. Your body composition improves here too.'
      ]
    }
  };

  function _buildCoachMessage(selected, params) {
    var mode     = _intensityMode(params.fatigue_level);
    var goal     = params.goal;
    var messages = COACH_MESSAGES[mode] && COACH_MESSAGES[mode][goal];

    // Deterministic selection using subtype charCode to vary across same mode/goal
    if (messages && messages.length > 0) {
      var subtypeCode = selected.subtype ? selected.subtype.charCodeAt(0) : 0;
      return messages[subtypeCode % messages.length];
    }

    // Hard fallback — should never be reached with current constants
    return 'Execute with precision. Every session is a deposit.';
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
      adaptation:          _buildAdaptation(selected, params),
      session_focus:       _buildSessionFocus(selected),
      momentum_tag:        _buildMomentumTag(selected, params),
      coach_message:       _buildCoachMessage(selected, params)
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
    _buildAdaptation:    _buildAdaptation,
    _buildMomentumTag:   _buildMomentumTag,
    _buildSessionFocus:  _buildSessionFocus,
    _buildCoachMessage:  _buildCoachMessage
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    root.WorkoutSelector = API;
  }

}(typeof globalThis !== 'undefined' ? globalThis : this));
