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

  // ── Momentum tag (internal) ───────────────────────────────────────────────

  // Benchmark marker — workouts whose progression_hint signals a retest
  var BENCHMARK_PATTERN = /benchmark|retest|sub-\d+|test/i;

  // Returns internal tag: push / build / recover / test
  function _buildMomentumTag(selected, params) {
    var mode = _intensityMode(params.fatigue_level);
    if (mode === 'reduce') return 'recover';
    if (selected.progression_hint && BENCHMARK_PATTERN.test(selected.progression_hint)) return 'test';
    if (mode === 'push') return 'push';
    return 'build';
  }

  // ── Momentum score ────────────────────────────────────────────────────────

  var HIGH_INTENSITY_SUBTYPES = ['hiit', 'heavy', 'explosive'];
  var MED_INTENSITY_SUBTYPES  = ['mixed', 'volume'];

  // Returns a deterministic 0–100 score based on fatigue, subtype intensity,
  // benchmark signal, and goal alignment.
  function _buildMomentumScore(selected, params) {
    var fatigue = params.fatigue_level;
    var mode    = _intensityMode(fatigue);
    // Fatigue base (linear): fatigue 1 → 60, fatigue 5 → 12
    var score   = (6 - fatigue) * 12;
    if (mode !== 'reduce') {
      if (HIGH_INTENSITY_SUBTYPES.includes(selected.subtype))     score += 25;
      else if (MED_INTENSITY_SUBTYPES.includes(selected.subtype)) score += 15;
      else                                                          score += 5;
    } else {
      score += 5; // recovery sessions earn a presence bonus
    }
    if (selected.progression_hint && BENCHMARK_PATTERN.test(selected.progression_hint)) score += 10;
    if (selected.goal === params.goal) score += 5;
    return Math.min(100, score);
  }

  // ── Premium momentum tag ──────────────────────────────────────────────────

  // Maps internal tag + score to display-facing label.
  // Peak: push/test mode at high score; Locked In: push at moderate score or
  // build at high score; Building: build at moderate score; Recovering: reduce mode.
  function _buildPremiumMomentumTag(internalTag, score) {
    if (internalTag === 'recover') return 'Recovering';
    if (internalTag === 'push' || internalTag === 'test') {
      return score >= 80 ? 'Peak' : 'Locked In';
    }
    // 'build'
    return score >= 50 ? 'Locked In' : 'Building';
  }

  // ── Shareable output ──────────────────────────────────────────────────────

  function _buildShareableOutput(selected, sessionFocus, premiumTag, score) {
    return 'SMARTFITCOACH\n' +
           sessionFocus + '\n' +
           premiumTag.toUpperCase();
  }

  // ── Session focus ─────────────────────────────────────────────────────────

  // Outcome-focused descriptors per subtype — varied by workout ID number.
  // {duration} is replaced with the workout's actual duration in minutes.
  var SESSION_FOCUS_TEMPLATES = {
    hiit: [
      '{duration}-min intervals — push output ceiling',
      '{duration}-min conditioning — max effort, full rounds',
      '{duration}-min intervals — hold pace above threshold'
    ],
    zone2: [
      '{duration}-min zone 2 — controlled pace, full duration',
      '{duration}-min aerobic base — conversational effort throughout',
      '{duration}-min steady state — heart rate controlled, no variance'
    ],
    mixed: [
      '{duration}-min hybrid — strength meets conditioning',
      '{duration}-min concurrent — aerobic base, compound load',
      '{duration}-min mixed — dual signal, full execution'
    ],
    heavy: [
      '{duration}-min strength — heavy compound, full recovery',
      '{duration}-min barbell — load with intent, rest completely',
      '{duration}-min max strength — bar speed is the metric'
    ],
    explosive: [
      '{duration}-min power — reactive strength at full intent',
      '{duration}-min explosive — force production, complete recovery',
      '{duration}-min athletic — speed of movement is the variable'
    ],
    tempo: [
      '{duration}-min tempo — controlled eccentric, full range',
      '{duration}-min time under tension — slow the movement down',
      '{duration}-min precision — cadence is the training variable'
    ],
    volume: [
      '{duration}-min volume — accumulate reps, maintain form',
      '{duration}-min hypertrophy — moderate load, high repetitions',
      '{duration}-min accumulation — deliberate reps, full range'
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
  // Voice: calm authority — each message states intention, gives a directive, sets a psychological anchor.
  var COACH_MSG = {
    push: {
      fat_loss: [
        'Peak metabolic window. Drive each interval to the upper edge of the prescribed range — pace for completion, not comfort. Consistency of effort is the variable.',
        'Low fatigue clears the path for full output. Work intervals at maximum sustainable intensity — rest only as prescribed. Discipline holds the pace.',
        'Fresh state, no ceiling. Execute each round at target effort without negotiation — the structure is designed for this condition. Trust it and work.',
        'Recovered and ready for high output. Maintain the target intensity across all rounds — every interval counts equally. That\'s where the adaptation lives.'
      ],
      toning: [
        'Fresh muscles carry full tension capacity today. Control every eccentric deliberately — that\'s where the hypertrophic signal originates. Let precision do the work.',
        'Low fatigue means you can manage both load and control simultaneously. Use both — don\'t sacrifice one for the other. Tempo and tension over speed.',
        'Full capacity for quality repetition. Slow the movement and keep the muscle engaged at end range. The stimulus is in the detail, not the speed.',
        'Recovered state, high responsiveness. Move deliberately through each rep with no momentum and no shortcuts. Control is the primary directive.'
      ],
      strength: [
        'CNS is clear. Load the bar with intent and move it with authority — bar speed is the most honest indicator of effort quality.',
        'Fresh and prepared for heavy work. Commit to the lift before you unrack it — mental preparation precedes physical execution.',
        'Low fatigue means full strength expression is available today. Approach the bar without hesitation and move it. Doubt has no place here.',
        'Peak condition for maximum output. Focus on bar path and bracing throughout every set — the body is ready; execution is the variable.'
      ],
      conditioning: [
        'Engine is primed for full output. Settle into the target pace in the first interval — don\'t chase effort, maintain it. Pacing is a discipline.',
        'Fresh capacity means you can hold a pace that costs you. Find it early and sustain it across every work interval without deceleration.',
        'Low fatigue authorises full output. Commit to the prescribed work-to-rest ratio and hold it — the adaptation is in the sustained effort.',
        'Recovered aerobic system, top-end session. Stay in the upper zone across all intervals. The only target is a consistent, high-quality effort.'
      ],
      recomposition: [
        'Both adaptation signals firing today — strength and cardio each get full effort. Execute every component as a separate priority. Complete the dual stimulus.',
        'Fresh state for a complex session. Don\'t let one block compromise the other — quality in both is the standard, not a stretch goal.',
        'Low fatigue means the full session design is accessible. Each block has a purpose — move through all of them with the same level of precision.',
        'Peak condition for a demanding mixed stimulus. The body adapts to exactly what you provide. Provide the full session — nothing abbreviated.'
      ]
    },
    normal: {
      fat_loss: [
        'Moderate state, clear task. Hit the prescribed intervals at target intensity — not exceptional, just consistent. Fat loss is built in sessions exactly like this.',
        'Standard session. Execute each round at the marked effort level and complete the full duration — the compound effect of ordinary sessions is real.',
        'Fat loss is a product of accumulated correct sessions. Today is one of them — full structure, full attention, nothing omitted.',
        'Moderate fatigue, full function. Complete the session as prescribed with nothing modified. Results follow disciplined consistency, not peak moments.'
      ],
      toning: [
        'Moderate state. Keep the load honest and the execution precise — technique and tension are the two variables that matter today.',
        'Shape is built across accumulated sessions exactly like this one. Make each set deliberate and each rep controlled — the stimulus compounds.',
        'Normal training day. Load and form both need to be present — don\'t sacrifice one for the other. Move with full attention through every set.',
        'Steady state, quality movement. Control the tempo, maintain full range of motion, and let the session accumulate. Nothing more is needed.'
      ],
      strength: [
        'Not a maximum day, but not a maintenance day either. Move serious weight with precise execution — intent matters more than peak intensity.',
        'Moderate fatigue for a strength session. Warm up methodically, then give each working set full attention on bar path and bracing.',
        'Consistent strength development happens in sessions exactly like this one. Show up, load with intent, and execute cleanly across every set.',
        'The weight won\'t move itself. Approach each set with full preparation — positioning, breath, focus — then commit without reservation.'
      ],
      conditioning: [
        'Moderate state for an aerobic session. Settle into a sustainable pace and hold it — rhythm is the training variable, not peak effort.',
        'Aerobic capacity accumulates across sessions exactly like this one. Find your pace and maintain it precisely. Consistency is the method.',
        'Normal conditioning session. Find a pace you can sustain for the full duration and hold it without deviation. Pacing is a technical skill.',
        'Hold your pace. Moderate state, full function — sustain the output and let the session produce the adaptation it was designed for.'
      ],
      recomposition: [
        'Both adaptation signals need full execution today. Moderate fatigue doesn\'t lower the standard — it adjusts the ceiling slightly. Honour the design.',
        'Recomp sessions require complete effort across both components. Don\'t abbreviate the strength block or the cardio block. Both are required.',
        'Moderate state — precision over aggression. Move well through both blocks and complete the full session structure without improvisation.',
        'Steady effort across a complex session. Recomposition is a long process — show up, complete the full work, and trust the accumulation.'
      ]
    },
    reduce: {
      fat_loss: [
        'Fatigue is elevated. An aerobic session at prescribed low intensity still contributes — and it protects tomorrow\'s session from being compromised. That\'s the objective.',
        'High fatigue changes the prescription, not the discipline. Move at the assigned low intensity and complete the full duration without escalating effort.',
        'Recovery is not passive — this session maintains function and positions you for harder work ahead. Execute it with the same attention as any session.',
        'Fatigue this high means recovery is the priority. Stay in the prescribed zone, hold the pace down. This session is an investment in what follows.'
      ],
      toning: [
        'Fatigued muscle needs circulation, not additional stimulus. Move with full control at low load — blood flow is today\'s objective, not tension.',
        'High fatigue day. The directive is to move well, not hard. Protect the adaptation already accumulated and restore function for the sessions ahead.',
        'Movement quality doesn\'t drop when intensity does. Today\'s session preserves what you\'ve built — execute it with the same focus as a hard day.',
        'Low load, full intention. The body is in repair mode — support the process with quality movement at reduced intensity. That\'s the prescription.'
      ],
      strength: [
        'Heavy work at high fatigue is where injuries occur. Today you protect tomorrow\'s lift with deliberate, low-intensity aerobic work. This is the smart decision.',
        'The platform can wait. Fatigue this high removes heavy work from the schedule — aerobic recovery takes priority. Return to the bar when you\'re ready.',
        'Reading the body correctly is part of good training. Today it signals recovery — respect that and come back to the bar with full capacity.',
        'Fatigue under heavy load is a liability, not a challenge to push through. This session earns you the capacity to lift hard in the sessions ahead.'
      ],
      conditioning: [
        'Aerobic recovery at high fatigue is still productive work. Zone 2 flushes metabolic waste and drives aerobic adaptation — two outcomes from one controlled session.',
        'Easy sessions make hard sessions possible. Today builds the recovery base for the intensity you\'ll access later in the training week.',
        'Stay in the low zone — not because it\'s easier, but because aerobic recovery is today\'s precise adaptation target. Discipline means matching effort to intent.',
        'High fatigue and sustained hard effort produce breakdown, not adaptation. Today you manage load intelligently. That restraint is the discipline.'
      ],
      recomposition: [
        'Recomp stalls when recovery is skipped. This session is the correct prescription at this point in the cycle — follow it without modification.',
        'Fatigue is a signal from the system. The body rebuilds lean tissue under proper recovery conditions — this session creates those conditions.',
        'Protect the adaptation by not overreaching. Active recovery at high fatigue keeps the recomposition process on track and positions you for the next hard block.',
        'High fatigue in a recomp cycle requires disciplined recovery. Reduce intensity, complete the full session, and preserve the progress already made.'
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

    var selected      = scored[0].workout;
    var internalTag   = _buildMomentumTag(selected, params);
    var momentumScore = _buildMomentumScore(selected, params);
    var premiumTag    = _buildPremiumMomentumTag(internalTag, momentumScore);
    var sessionFocus  = _buildSessionFocus(selected);

    return {
      selected_workout_id: selected.id,
      reasoning:           _buildReasoning(selected, params, scored),
      adaptation:          _buildAdaptation(selected, params),
      session_focus:       sessionFocus,
      momentum_tag:        premiumTag,
      momentum_score:      momentumScore,
      shareable_output:    _buildShareableOutput(selected, sessionFocus, premiumTag, momentumScore),
      coach_message:       _buildCoachMessage(selected, params)
    };
  }

  // ── Exports ───────────────────────────────────────────────────────────────

  var API = {
    selectWorkout:            selectWorkout,
    // internals for tests
    _validateParams:          _validateParams,
    _flattenLibrary:          _flattenLibrary,
    _subtypeFromId:           _subtypeFromId,
    _intensityMode:           _intensityMode,
    _filterCandidates:        _filterCandidates,
    _scoreCandidates:         _scoreCandidates,
    _buildReasoning:          _buildReasoning,
    _buildAdaptation:         _buildAdaptation,
    _buildMomentumTag:        _buildMomentumTag,
    _buildMomentumScore:      _buildMomentumScore,
    _buildPremiumMomentumTag: _buildPremiumMomentumTag,
    _buildShareableOutput:    _buildShareableOutput,
    _buildSessionFocus:       _buildSessionFocus,
    _buildCoachMessage:       _buildCoachMessage,
    _idNumber:                _idNumber
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    root.WorkoutSelector = API;
  }

}(typeof globalThis !== 'undefined' ? globalThis : this));
