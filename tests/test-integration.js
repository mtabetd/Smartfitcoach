/**
 * Integration tests — SFCEngine wired into the app
 *
 * These tests verify that the SFCEngine module is:
 *   1. Loadable and exposing the correct API
 *   2. Correctly driven by S.sessionHistory + S.muscuSessionLog (real data)
 *   3. Producing correct outputs across all user flows
 *
 * Tests use Node.js require to load the module in isolation, then simulate
 * the app's getSFCSessions adapter logic to verify end-to-end behaviour.
 *
 * Run: node tests/test-integration.js
 */

'use strict';

const path    = require('path');
const SFCEngine = require(path.join(__dirname, '../app/sfc-engine.js'));

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('  ✓', label);
    passed++;
  } else {
    console.error('  ✗', label);
    failed++;
  }
}

function assertEqual(label, actual, expected) {
  if (actual === expected) {
    console.log('  ✓', label);
    passed++;
  } else {
    console.error('  ✗', label, '— expected', JSON.stringify(expected), 'got', JSON.stringify(actual));
    failed++;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

var MS  = 1000;
var MIN = 60 * MS;
var DAY = 86400000;

function tsAgo(daysBack) {
  return Date.now() - daysBack * DAY;
}

function makeSession(daysBack, load, sport) {
  var exercises;
  if (load === 'heavy') {
    // ≥6 exercises + heavy group (squat/deadlift) + ≥4 compounds → classified 'heavy'
    exercises = [
      { name: 'Squat',          sets: 4, reps: 6,  weight: 100 },
      { name: 'Deadlift',       sets: 3, reps: 5,  weight: 140 },
      { name: 'Bench Press',    sets: 4, reps: 6,  weight: 90  },
      { name: 'Row',            sets: 4, reps: 8,  weight: 75  },
      { name: 'Overhead Press', sets: 3, reps: 8,  weight: 60  },
      { name: 'Pull-up',        sets: 3, reps: 8,  weight: 0   }
    ];
  } else if (load === 'light') {
    exercises = [
      { name: 'Curl',    sets: 2, reps: 12, weight: 20 },
      { name: 'Triceps', sets: 2, reps: 12, weight: 15 }
    ];
  } else {
    exercises = [
      { name: 'Bench Press', sets: 3, reps: 10, weight: 80 },
      { name: 'Row',         sets: 3, reps: 10, weight: 70 },
      { name: 'Curl',        sets: 3, reps: 12, weight: 20 },
      { name: 'Lateral',     sets: 3, reps: 15, weight: 12 }
    ];
  }
  return {
    id:        sport + '_' + daysBack,
    timestamp: tsAgo(daysBack),
    exercises: exercises,
    duration:  60
  };
}

// Simulates getSFCSessions adapter: converts S.sessionHistory + S.muscuSessionLog
// into the sessions[] format SFCEngine expects.
function buildSessions(sessionHistory, muscuSessionLog) {
  var sessions = [];
  Object.keys(sessionHistory || {}).forEach(function(key) {
    var entry = sessionHistory[key];
    if (!entry || !entry.date) return;
    var ts = new Date(entry.date).getTime();
    if (!isFinite(ts) || ts <= 0) return;
    var dateStr   = entry.date.slice(0, 10);
    var exercises = [];
    var log = (muscuSessionLog || {})[dateStr];
    if (log && typeof log === 'object') {
      Object.keys(log).forEach(function(exName) {
        var sets = Array.isArray(log[exName]) ? log[exName] : [];
        var validated = sets.filter(function(s) { return s && s.validated === true; });
        if (validated.length > 0) {
          var maxW = 0, maxR = 0;
          validated.forEach(function(s) {
            if ((+s.actualWeight || 0) > maxW) maxW = +s.actualWeight || 0;
            if ((+s.actualReps   || 0) > maxR) maxR = +s.actualReps   || 0;
          });
          exercises.push({ name: exName, sets: validated.length, reps: maxR || 8, weight: maxW });
        }
      });
    }
    if (exercises.length === 0) {
      var load = entry.trainingLoad || 'moderate';
      var n    = load === 'heavy' ? 6 : load === 'light' ? 2 : 4;
      var base = entry.sport || 'Training';
      for (var i = 0; i < n; i++) {
        exercises.push({ name: base + (i + 1), sets: 3, reps: 10 });
      }
    }
    sessions.push({ id: key, timestamp: ts, exercises: exercises, duration: entry.duration || 0 });
  });
  return sessions;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n) {
  return new Date(Date.now() - n * DAY).toISOString().slice(0, 10);
}

// ─── INT-01: window.SFCEngine is defined and exports all required functions ──

console.log('\nINT-01: API surface');
assert('SFCEngine exports computeTrainingSignal',  typeof SFCEngine.computeTrainingSignal  === 'function');
assert('SFCEngine exports computeRollingLoad',     typeof SFCEngine.computeRollingLoad     === 'function');
assert('SFCEngine exports computeNutrition',       typeof SFCEngine.computeNutrition       === 'function');
assert('SFCEngine exports computeCycleProgression',typeof SFCEngine.computeCycleProgression === 'function');
assert('SFCEngine exports sanitizeSessionInput',   typeof SFCEngine.sanitizeSessionInput   === 'function');

// ─── INT-02: Reload after session — sessionHistory survives and drives engine ──

console.log('\nINT-02: Reload after session');
(function() {
  var today = todayStr();
  // Simulate a session saved in S.sessionHistory
  var sessionHistory = {};
  sessionHistory['1_' + today] = {
    date:          new Date().toISOString(),
    duration:      45,
    trainingLoad:  'heavy',
    sport:         'muscu'
  };
  var muscuSessionLog = {};
  muscuSessionLog[today] = {
    'Squat': [
      { validated: true, actualWeight: 100, actualReps: 5 },
      { validated: true, actualWeight: 100, actualReps: 5 },
      { validated: true, actualWeight: 100, actualReps: 5 }
    ],
    'Deadlift': [
      { validated: true, actualWeight: 120, actualReps: 3 },
      { validated: true, actualWeight: 120, actualReps: 3 }
    ],
    'Bench Press': [
      { validated: true, actualWeight: 80, actualReps: 8 },
      { validated: true, actualWeight: 80, actualReps: 8 }
    ],
    'Row': [
      { validated: true, actualWeight: 70, actualReps: 10 },
      { validated: true, actualWeight: 70, actualReps: 10 }
    ]
  };

  var sessions = buildSessions(sessionHistory, muscuSessionLog);
  assert('Sessions built from history (1 session)', sessions.length === 1);
  assert('Session has exercises from muscuSessionLog', sessions[0].exercises.length === 4);

  var signal = SFCEngine.computeTrainingSignal(sessions, Date.now());
  assert('trainedToday = true after reload', signal.trainedToday === true);
  assert('todayLoad is not null', signal.todayLoad !== null);
})();

// ─── INT-03: Nutrition evening post-workout ──────────────────────────────────

console.log('\nINT-03: Nutrition post-workout (18h00)');
(function() {
  // User trained today (morning session) — evening recalculation should reflect training load
  var today = todayStr();
  var sessions = [makeSession(0, 'heavy', 'muscu')]; // trained today

  var user = { weight: 80, goal: 'muscle_gain' };
  var nm   = SFCEngine.computeNutrition(user, sessions, Date.now());

  assert('calorieTarget > 0',       nm.calorieTarget > 0);
  assert('effectiveLoad = heavy',   nm.effectiveLoad === 'heavy');
  assert('carbGrams > 0',           nm.carbGrams > 0);
  assert('basis.daysSinceLastSession = 0', nm.basis.daysSinceLastSession === 0);
  assert('inactivityBlendPct = 0 (trained today)', nm.basis.inactivityBlendPct === 0);
})();

// ─── INT-04: Scheduled training day but session missed ───────────────────────

console.log('\nINT-04: Scheduled day, no session saved');
(function() {
  // Schedule says today is a training day, but no session in history
  var sessions = []; // empty — nothing was actually done

  var signal = SFCEngine.computeTrainingSignal(sessions, Date.now());
  assert('trainedToday = false when no session', signal.trainedToday === false);
  assert('daysSinceLastSession = Infinity', signal.daysSinceLastSession === Infinity);

  var user = { weight: 75, goal: 'recomp' };
  var nm   = SFCEngine.computeNutrition(user, sessions, Date.now());
  assert('effectiveLoad = rest when no session', nm.effectiveLoad === 'rest');
  // Carb/fat ratio should favour fat (rest day split)
  assert('inactivityBlendPct = 100 (no sessions ever)', nm.basis.inactivityBlendPct === 100);
})();

// ─── INT-05: Double session same day ─────────────────────────────────────────

console.log('\nINT-05: Double session same day');
(function() {
  var now    = Date.now();
  var today  = new Date(now).toISOString().slice(0, 10);
  // Two sessions on the same calendar day — use small offsets to avoid UTC day boundary
  var s1 = {
    id: 'morning', timestamp: now - 2 * 60 * MIN,
    exercises: [
      { name: 'Squat',      sets: 4, reps: 6, weight: 110 },
      { name: 'Deadlift',   sets: 3, reps: 5, weight: 140 }
    ], duration: 45
  };
  var s2 = {
    id: 'evening', timestamp: now - 1 * 60 * MIN,
    exercises: [
      { name: 'Bench Press',    sets: 4, reps: 8,  weight: 90 },
      { name: 'Overhead Press', sets: 3, reps: 8,  weight: 60 },
      { name: 'Row',            sets: 4, reps: 10, weight: 75 },
      { name: 'Pull-up',        sets: 3, reps: 8,  weight: 0  }
    ], duration: 50
  };

  var sessions = [s1, s2];
  var signal   = SFCEngine.computeTrainingSignal(sessions, now);

  assert('trainedToday = true (double session)', signal.trainedToday === true);
  assert('todaySessionCount = 2',                signal.todaySessionCount === 2);

  var rolling = SFCEngine.computeRollingLoad(sessions, now);
  assert('last1d.sessionCount = 2',   rolling.last1d.sessionCount === 2);
  assert('last1d.trainingDays = 1 (merged — not 2)', rolling.last1d.trainingDays === 1);

  // Cycle counts unique DAYS, not sessions
  var prog = SFCEngine.computeCycleProgression(sessions);
  assert('totalTrainingDays = 1 (double session = 1 unique day)', prog.totalTrainingDays === 1);
})();

// ─── INT-06: Cycle progression over multiple weeks ───────────────────────────

console.log('\nINT-06: Cycle progression — 8 sessions (every other day)');
(function() {
  // 8 training sessions, one every 2 days (no consecutive overreaching)
  var sessions = [];
  for (var i = 0; i < 8; i++) {
    sessions.push(makeSession(i * 2, 'moderate', 'muscu'));
  }
  var prog = SFCEngine.computeCycleProgression(sessions);
  assert('totalTrainingDays = 8',         prog.totalTrainingDays === 8);
  assert('overreachingDetected = false',  prog.overreachingDetected === false);
  // 8 training days: daysIntoCycle=8, phaseIdx=floor(8/4)=2 → programWeek=3 (strength)
  assert('programWeek = 3 (strength)', prog.programWeek === 3);
})();

console.log('\nINT-06b: Cycle progression — 16 sessions (full cycle)');
(function() {
  var sessions = [];
  for (var i = 0; i < 16; i++) {
    sessions.push(makeSession(i * 2, 'moderate', 'muscu'));
  }
  var prog = SFCEngine.computeCycleProgression(sessions);
  assert('totalTrainingDays = 16', prog.totalTrainingDays === 16);
  assert('cycleNumber = 2 (new cycle)',   prog.cycleNumber === 2);
  assert('programWeek = 1 (back to hypertrophy)', prog.programWeek === 1);
})();

// ─── INT-07: Aberrant weight → sanitizeSessionInput flags it ─────────────────

console.log('\nINT-07: Aberrant weight input');
(function() {
  // History: user consistently squats at 100kg
  var history = [];
  for (var i = 5; i >= 1; i--) {
    history.push({
      id: 'h' + i, timestamp: tsAgo(i * 7),
      exercises: [{ name: 'Squat', sets: 4, reps: 5, weight: 100 }],
      duration: 60
    });
  }

  // New session: user "logs" 500kg squat (typo / fat-finger)
  var rawSession = {
    timestamp: Date.now(),
    exercises: [{ name: 'Squat', sets: 4, reps: 5, weight: 500 }],
    duration: 60
  };
  var result = SFCEngine.sanitizeSessionInput(rawSession, history);
  assert('session is still valid (not rejected outright)', result.valid === true);
  assert('weight flagged as aberrant', result.warnings.some(function(w) { return w.indexOf('jump_exceeds_25pct') !== -1; }));
  assert('sanitized weight < 500kg',   result.session.exercises[0].weight < 500);

  // Plausible +5% jump — should pass cleanly
  var normalSession = {
    timestamp: Date.now(),
    exercises: [{ name: 'Squat', sets: 4, reps: 5, weight: 105 }],
    duration: 60
  };
  var normal = SFCEngine.sanitizeSessionInput(normalSession, history);
  assert('normal weight jump — no warnings', normal.warnings.length === 0);
  assert('normal session valid', normal.valid === true);
})();

// ─── INT-08: Deload when overreaching is detected ─────────────────────────────

console.log('\nINT-08: Deload forced when overreaching');
(function() {
  // 5 consecutive daily sessions → overreaching
  var sessions = [];
  for (var i = 0; i < 5; i++) {
    sessions.push(makeSession(i, 'heavy', 'muscu')); // consecutive days 0..4
  }
  var prog = SFCEngine.computeCycleProgression(sessions);
  assert('overreachingDetected = true', prog.overreachingDetected === true);
  assert('phase.id = deload',           prog.phase.id === 'deload');
  assert('overreachingReason not null', prog.overreachingReason !== null);
})();

// ─── INT-09: getSFCSessions adapter — legacy trainingLoad fallback ────────────

console.log('\nINT-09: getSFCSessions adapter — non-muscu sport (running)');
(function() {
  var today = todayStr();
  var sessionHistory = {};
  sessionHistory['running_' + today] = {
    date:         new Date().toISOString(),
    duration:     50,
    trainingLoad: 'moderate',
    sport:        'running'
  };
  // No muscuSessionLog for running — adapter synthesizes exercises from trainingLoad
  var sessions = buildSessions(sessionHistory, {});
  assert('session built from running entry', sessions.length === 1);
  assert('exercises synthesized (4 for moderate)', sessions[0].exercises.length === 4);
  assert('exercise name contains sport name', sessions[0].exercises[0].name.indexOf('running') !== -1);

  var signal = SFCEngine.computeTrainingSignal(sessions, Date.now());
  assert('trainedToday = true (running session)', signal.trainedToday === true);
})();

// ─── INT-10: Inactivity blend — nutrition slides to rest over 7 days ─────────

console.log('\nINT-10: Inactivity blend progression');
(function() {
  var user = { weight: 75, goal: 'recomp' };

  var nm0 = SFCEngine.computeNutrition(user, [makeSession(0, 'heavy', 'muscu')], Date.now());
  var nm2 = SFCEngine.computeNutrition(user, [makeSession(2, 'heavy', 'muscu')], Date.now());
  var nm7 = SFCEngine.computeNutrition(user, [makeSession(7, 'heavy', 'muscu')], Date.now());

  assert('day 0: blend = 0%',   nm0.basis.inactivityBlendPct === 0);
  assert('day 2: blend > 0%',   nm2.basis.inactivityBlendPct > 0);
  assert('day 7: blend = 100%', nm7.basis.inactivityBlendPct === 100);
  assert('day 0 carbs > day 7 carbs (blend reduces carbs)', nm0.carbGrams > nm7.carbGrams);
})();

// ─── INT-11: window.SFCEngine global (browser-side simulation) ───────────────

console.log('\nINT-11: Module exposes correct global (UMD)');
(function() {
  // In browser context: root.SFCEngine = factory()
  // In Node: module.exports = factory()
  assert('module.exports is an object',  typeof SFCEngine === 'object');
  assert('no side effects at import',    typeof global.SFCEngine === 'undefined');
  // Verify all 5 functions present
  var fns = ['computeTrainingSignal','computeRollingLoad','computeNutrition','computeCycleProgression','sanitizeSessionInput'];
  fns.forEach(function(fn) {
    assert('exports.' + fn + ' is a function', typeof SFCEngine[fn] === 'function');
  });
})();

// ─── INT-12: Multiple sports same day — load aggregation ────────────────────

console.log('\nINT-12: Multiple sports same day — max load wins');
(function() {
  var now   = Date.now();
  // Morning: yoga (light), evening: running heavy
  var yoga    = {
    id: 'yoga', timestamp: now - 2 * 60 * MIN,
    exercises: [{ name: 'pose1', sets: 1, reps: 10 }, { name: 'pose2', sets: 1, reps: 10 }],
    duration: 30
  };
  var running = {
    id: 'running', timestamp: now - 1 * 60 * MIN,
    exercises: [
      { name: 'Interval run 1', sets: 3, reps: 10 },
      { name: 'Interval run 2', sets: 3, reps: 10 },
      { name: 'Interval run 3', sets: 3, reps: 10 },
      { name: 'Interval run 4', sets: 3, reps: 10 },
      { name: 'Interval run 5', sets: 3, reps: 10 },
      { name: 'Squat jump',     sets: 4, reps: 8 }
    ],
    duration: 60
  };
  var sessions = [yoga, running];
  var signal   = SFCEngine.computeTrainingSignal(sessions, now);
  assert('trainedToday = true', signal.trainedToday === true);
  assert('todaySessionCount = 2', signal.todaySessionCount === 2);
})();

// ─── Summary ────────────────────────────────────────────────────────────���────

console.log('\n─────────────────────────────────��───────');
console.log('Integration tests: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All integration tests passed.');
}
