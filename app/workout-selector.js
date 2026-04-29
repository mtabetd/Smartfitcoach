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

  // Natural, outcome-focused templates per subtype — varied by workout ID number.
  // {duration} is replaced with the workout's actual duration in minutes.
  var SESSION_FOCUS_TEMPLATES = {
    hiit: [
      '{duration}-min high-intensity intervals — drive output above your comfort ceiling',
      'Short explosive conditioning — {duration} min at maximum sustainable effort',
      'Metabolic conditioning — {duration} min of quality intervals at the edge'
    ],
    zone2: [
      '{duration}-min aerobic base session — conversational pace, sustained adaptation',
      'Steady zone 2 work — {duration} min to build fat-burning efficiency',
      'Low-intensity endurance — {duration} min at controlled heart rate for base development'
    ],
    mixed: [
      'Concurrent training — {duration} min combining cardio and strength in the same session',
      '{duration}-min hybrid session — aerobic base paired with loaded compound work',
      'Strength meets conditioning — {duration} min of dual-signal training'
    ],
    heavy: [
      'Maximum strength — {duration} min of heavy compound barbell work',
      '{duration}-min strength session — load with intent, move with precision',
      'Heavy loading block — {duration} min focused on absolute strength development'
    ],
    explosive: [
      'Power development — {duration} min training the nervous system to produce force fast',
      '{duration}-min reactive strength session — every rep at full intent',
      'Athletic power work — {duration} min of explosive movement with full recovery'
    ],
    tempo: [
      'Time under tension — {duration} min of controlled, eccentric-focused loading',
      '{duration}-min tempo session — slow the movement down, multiply the stimulus',
      'Precision loading — {duration} min where the tempo is the training variable'
    ],
    volume: [
      'Accumulation session — {duration} min of systematic high-rep work for hypertrophy',
      '{duration}-min volume block — compound lifts at moderate load for muscle growth',
      'High-volume loading — {duration} min of deliberate reps to drive size and strength'
    ]
  };

  // Extract trailing number from workout ID for deterministic variant selection
  function _idNumber(id) {
    var m = id && id.match(/(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function _buildSessionFocus(selected) {
    var templates = SESSION_FOCUS_TEMPLATES[selected.subtype];
    if (!templates) return selected.intent || selected.subtype;
    var template = templates[_idNumber(selected.id) % templates.length];
    return template.replace('{duration}', String(selected.duration));
  }

  // ── Coach message ─────────────────────────────────────────────────────────

  // Contextual message pools keyed by [mode][goal].
  // 4 variants per combo — variant index: (idNumber + fatigue_level) % 4
  // Each message is specific to the user's state and goal, not a category.
  var COACH_MSG = {
    push: {
      fat_loss: [
        'You\'re recovered. Push the intervals hard — don\'t pace for comfort.',
        'Low fatigue means one thing: maximum metabolic output. No sandbagging today.',
        'Fresh and ready. The only variable now is how hard you\'re willing to push.',
        'This is the session that moves the number. Don\'t leave anything on the floor.'
      ],
      toning: [
        'Recovered muscles are responsive muscles. Control every eccentric — let the stimulus land.',
        'Fresh state, full tension. Every rep should feel deliberate, not automatic.',
        'You have the capacity to go heavy and controlled today. Use both qualities.',
        'Low fatigue, high tension. This is exactly the condition muscle responds to.'
      ],
      strength: [
        'CNS is clear. Load the bar and move it with intent — bar speed tells you everything.',
        'Fresh and ready to pull. Don\'t negotiate with the weight — move it.',
        'Today is a day to set a mark. Full output, clean execution.',
        'Recovered and loaded. The platform is ready. So are you.'
      ],
      conditioning: [
        'Engine is primed. Hold a pace that costs you something — the whole time.',
        'Fresh legs should push harder. Don\'t waste the advantage.',
        'Low fatigue means no excuses on pacing. Find the edge and park there.',
        'This is a full-output conditioning session. Give it exactly that.'
      ],
      recomposition: [
        'Recovered and dual-targeting. Both the strength and cardio components get full effort today.',
        'Best recomp sessions happen when you\'re fresh. This is one of them — don\'t waste it.',
        'Fresh body, complex demand. Feed both adaptation signals completely.',
        'Recomp requires precision, not just effort. Today you have both.'
      ]
    },
    normal: {
      fat_loss: [
        'Standard session, deliberate effort. Fat loss is built in the unremarkable days.',
        'Hit your marks. Nothing spectacular — just the work done properly.',
        'Consistent effort today adds to a consistent week. That\'s where the change lives.',
        'Moderate state, clear task. Complete the session and move on.'
      ],
      toning: [
        'Shape isn\'t built in the dramatic sessions — it\'s built in sessions exactly like this one.',
        'Every set is a deposit. Today is a normal training day — make it count anyway.',
        'Technique and tension. That\'s all today asks. Give it both.',
        'Moderate day. Move with precision and let the work accumulate.'
      ],
      strength: [
        'Not a max day, but not a filler day. Move serious weight with serious intent.',
        'Strength is accumulated, not just peaked. Today matters more than it looks.',
        'Every working set at this intensity has a compounding return. Stay present.',
        'Moderate state, heavy work. Execute cleanly and trust the volume.'
      ],
      conditioning: [
        'Hold your pace. Not heroic — just relentless.',
        'Aerobic capacity is built across hundreds of sessions like this one. Be consistent.',
        'Normal day, normal effort, extraordinary long-term adaptation. Trust it.',
        'Moderate state for a conditioning session. Find your rhythm early and hold it.'
      ],
      recomposition: [
        'Recomp is a slow burn. Today\'s session is a link in a long chain — make it count.',
        'Moderate day, full attention. Both signals — strength and cardio — need to fire.',
        'No shortcuts in recomposition. Complete effort across the full session.',
        'Steady, complete, and deliberate. That\'s what today requires.'
      ]
    },
    reduce: {
      fat_loss: [
        'Fatigue is high. An aerobic flush still burns — and it protects tomorrow\'s session.',
        'Recovery is not lost time. This session preserves your ability to work hard all week.',
        'High fatigue and hard intervals don\'t mix. Today you move smart, not hard.',
        'Showing up at ' + 'high fatigue is the win. Effort matches energy — no more.'
      ],
      toning: [
        'Fatigued muscle needs blood flow, not more damage. Move with purpose, not aggression.',
        'Tone is preserved in recovery, not lost. Today you protect the work already done.',
        'Low load, high intention. The body is repairing — support it, don\'t interrupt it.',
        'High fatigue day. The only metric is: did you move well?'
      ],
      strength: [
        'Heavy iron at high fatigue is how injuries happen. Today you protect tomorrow\'s lift.',
        'The bar is too heavy today — and that\'s a fact, not an excuse. Aerobic work instead.',
        'Smart athletes recover on purpose. This session earns you three harder ones ahead.',
        'Strength is protected in recovery. Show up, move easy, come back stronger.'
      ],
      conditioning: [
        'Aerobic recovery at high fatigue is still productive. Zone 2 flushes and rebuilds.',
        'Conditioning athletes know: easy days make hard days possible. Own this session.',
        'Low and slow today. Your cardiovascular system adapts during recovery too.',
        'High fatigue and sustained hard effort is a liability. Today you invest in tomorrow.'
      ],
      recomposition: [
        'Recomp stalls when recovery is skipped. This session is exactly what the plan requires.',
        'Fatigue is a signal. The body rebuilds lean tissue when you respect it — today, you do.',
        'Active recovery is active investment. Body composition shifts here too.',
        'High fatigue in a recomp block. Protect the adaptation by not overreaching.'
      ]
    }
  };

  function _buildCoachMessage(selected, params) {
    var mode = _intensityMode(params.fatigue_level);
    var pool = COACH_MSG[mode] && COACH_MSG[mode][params.goal];
    if (!pool || pool.length === 0) return 'Execute with precision. Every session is a deposit.';
    // Vary by workout ID number + fatigue so adjacent workouts in same goal/mode feel different
    return pool[(_idNumber(selected.id) + params.fatigue_level) % pool.length];
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

    var selected     = scored[0].workout;
    var sessionFocus = _buildSessionFocus(selected);
    var momentumTag  = _buildMomentumTag(selected, params);

    return {
      selected_workout_id: selected.id,
      reasoning:           _buildReasoning(selected, params, scored),
      adaptation:          _buildAdaptation(selected, params),
      session_focus:       sessionFocus,
      momentum_tag:        momentumTag,
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
    _buildCoachMessage:  _buildCoachMessage,
    _idNumber:           _idNumber
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    root.WorkoutSelector = API;
  }

}(typeof globalThis !== 'undefined' ? globalThis : this));
