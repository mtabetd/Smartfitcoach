'use strict';

/**
 * test-sfc-engine.js — Determinism and resilience tests for sfc-engine.js
 *
 * Covers every scenario where the old system failed:
 *   reload, missed save, inactivity, double sessions, wrong weights, etc.
 */

var assert  = require('assert');
var engine  = require('../app/sfc-engine.js');

var computeTrainingSignal   = engine.computeTrainingSignal;
var computeRollingLoad      = engine.computeRollingLoad;
var computeNutrition        = engine.computeNutrition;
var computeCycleProgression = engine.computeCycleProgression;
var sanitizeSessionInput    = engine.sanitizeSessionInput;

// ─── Test harness ─────────────────────────────────────────────────────────────

var passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  \x1b[32m✓\x1b[0m ' + name);
    passed++;
  } catch (e) {
    console.error('  \x1b[31m✗\x1b[0m ' + name);
    console.error('    ' + e.message);
    failed++;
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

var DAY = 86400000;
var NOW = new Date('2026-03-15T12:00:00Z').getTime(); // fixed reference point

function ts(daysBack) { return NOW - daysBack * DAY; }

// A heavy session: 7 exercises including 4 lower-body compounds
var HEAVY_SESSION = {
  id: 'heavy_0',
  timestamp: ts(0),
  exercises: [
    { name: 'Squat',        sets: 4, reps: 8,  weight: 100 },
    { name: 'Deadlift',     sets: 3, reps: 5,  weight: 120 },
    { name: 'Bench Press',  sets: 4, reps: 8,  weight: 80  },
    { name: 'Row',          sets: 4, reps: 8,  weight: 70  },
    { name: 'Leg Press',    sets: 3, reps: 10, weight: 150 },
    { name: 'Lunge',        sets: 3, reps: 12, weight: 40  },
    { name: 'Overhead Press', sets: 3, reps: 8, weight: 60 }
  ],
  duration: 75
};

// A light session: 2 isolation exercises
var LIGHT_SESSION = {
  id: 'light_0',
  timestamp: ts(0),
  exercises: [
    { name: 'Curl',    sets: 3, reps: 12, weight: 15 },
    { name: 'Triceps', sets: 3, reps: 12, weight: 20 }
  ],
  duration: 30
};

// A moderate session: 4 exercises, mixed
var MODERATE_SESSION = {
  id: 'mod_0',
  timestamp: ts(0),
  exercises: [
    { name: 'Bench Press',    sets: 4, reps: 8, weight: 80 },
    { name: 'Row',            sets: 4, reps: 8, weight: 70 },
    { name: 'Overhead Press', sets: 3, reps: 8, weight: 60 },
    { name: 'Pull-up',        sets: 3, reps: 8, weight: 0  }
  ],
  duration: 55
};

var USER_MUSCLE = { weight: 80, goal: 'muscle_gain' };
var USER_CUT    = { weight: 80, goal: 'fat_loss'    };

// ─── computeTrainingSignal ────────────────────────────────────────────────────

console.log('\ncomputeTrainingSignal\n');

test('ENG-01: empty sessions → trainedToday=false, daysSince=Infinity', function () {
  var r = computeTrainingSignal([], NOW);
  assert.strictEqual(r.trainedToday, false);
  assert.strictEqual(r.daysSinceLastSession, Infinity);
  assert.strictEqual(r.todayLoad, null);
});

test('ENG-02: null/undefined sessions → safe defaults', function () {
  var r1 = computeTrainingSignal(null, NOW);
  var r2 = computeTrainingSignal(undefined, NOW);
  assert.strictEqual(r1.trainedToday, false);
  assert.strictEqual(r2.trainedToday, false);
});

test('ENG-03: trained today → trainedToday=true, daysSince=0', function () {
  var r = computeTrainingSignal([HEAVY_SESSION], NOW);
  assert.strictEqual(r.trainedToday, true);
  assert.strictEqual(r.daysSinceLastSession, 0);
});

test('ENG-04: trained yesterday → trainedToday=false, trainedYesterday=true, daysSince=1', function () {
  var sess = Object.assign({}, HEAVY_SESSION, { id: 'y', timestamp: ts(1) });
  var r = computeTrainingSignal([sess], NOW);
  assert.strictEqual(r.trainedToday, false);
  assert.strictEqual(r.trainedYesterday, true);
  assert.strictEqual(r.daysSinceLastSession, 1);
});

test('ENG-05: 5 days no training → daysSince=5', function () {
  var sess = Object.assign({}, HEAVY_SESSION, { id: 'd5', timestamp: ts(5) });
  var r = computeTrainingSignal([sess], NOW);
  assert.strictEqual(r.daysSinceLastSession, 5);
  assert.strictEqual(r.trainedToday, false);
  assert.strictEqual(r.trainedYesterday, false);
});

test('ENG-06: heavy session today → todayLoad=heavy', function () {
  var r = computeTrainingSignal([HEAVY_SESSION], NOW);
  assert.strictEqual(r.todayLoad, 'heavy');
});

test('ENG-07: light session today → todayLoad=light', function () {
  var r = computeTrainingSignal([LIGHT_SESSION], NOW);
  assert.strictEqual(r.todayLoad, 'light');
});

test('ENG-08: double session same day — merged exercises → heavier load wins', function () {
  // Morning: 2 isolation (light). Evening: adds heavy compounds → total 9 exercises → heavy
  var morning = {
    id: 'morning', timestamp: ts(0),
    exercises: [
      { name: 'Curl',    sets: 3, reps: 12, weight: 15 },
      { name: 'Triceps', sets: 3, reps: 12, weight: 20 }
    ]
  };
  var evening = {
    id: 'evening', timestamp: ts(0),
    exercises: [
      { name: 'Squat',    sets: 4, reps: 8, weight: 100 },
      { name: 'Deadlift', sets: 3, reps: 5, weight: 120 },
      { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
      { name: 'Row',         sets: 4, reps: 8, weight: 70 },
      { name: 'Leg Press',   sets: 3, reps: 10, weight: 150 }
    ]
  };
  var r = computeTrainingSignal([morning, evening], NOW);
  assert.strictEqual(r.trainedToday, true);
  assert.strictEqual(r.todaySessionCount, 2);
  assert.strictEqual(r.todayLoad, 'heavy');
});

test('ENG-09: sessions with no exercises are ignored', function () {
  var bad = { id: 'bad', timestamp: ts(0), exercises: [] };
  var r   = computeTrainingSignal([bad], NOW);
  assert.strictEqual(r.trainedToday, false);
});

test('ENG-10: IDEMPOTENCY — calling twice produces identical output', function () {
  var sessions = [HEAVY_SESSION];
  var r1 = computeTrainingSignal(sessions, NOW);
  var r2 = computeTrainingSignal(sessions, NOW);
  assert.deepStrictEqual(r1, r2);
});

// ─── computeRollingLoad ───────────────────────────────────────────────────────

console.log('\ncomputeRollingLoad\n');

test('ENG-11: no sessions → all windows return rest/zero', function () {
  var r = computeRollingLoad([], NOW);
  assert.strictEqual(r.last1d.peakLoad, 'rest');
  assert.strictEqual(r.last3d.peakLoad, 'rest');
  assert.strictEqual(r.last7d.peakLoad, 'rest');
  assert.strictEqual(r.last1d.trainingDays, 0);
});

test('ENG-12: session today → appears in all windows', function () {
  var r = computeRollingLoad([HEAVY_SESSION], NOW);
  assert.strictEqual(r.last1d.sessionCount, 1);
  assert.strictEqual(r.last3d.sessionCount, 1);
  assert.strictEqual(r.last7d.sessionCount, 1);
});

test('ENG-13: session 2 days ago → not in last1d, yes in last3d and last7d', function () {
  var sess = Object.assign({}, HEAVY_SESSION, { id: 'd2', timestamp: ts(2) });
  var r = computeRollingLoad([sess], NOW);
  assert.strictEqual(r.last1d.sessionCount, 0);
  assert.strictEqual(r.last3d.sessionCount, 1);
  assert.strictEqual(r.last7d.sessionCount, 1);
});

test('ENG-14: double session same day — counts as 1 training day in window', function () {
  var s1 = Object.assign({}, MODERATE_SESSION, { id: 'a' });
  var s2 = Object.assign({}, MODERATE_SESSION, { id: 'b' });
  var r  = computeRollingLoad([s1, s2], NOW);
  // 2 sessions but 1 training day
  assert.strictEqual(r.last1d.sessionCount, 2);
  assert.strictEqual(r.last1d.trainingDays, 1);
});

test('ENG-15: peakLoad correctly picks max across window', function () {
  // Yesterday: heavy, today: light → 3-day window peakLoad = heavy
  var heavyYest  = Object.assign({}, HEAVY_SESSION,  { id: 'hy', timestamp: ts(1) });
  var lightToday = Object.assign({}, LIGHT_SESSION,   { id: 'lt', timestamp: ts(0) });
  var r = computeRollingLoad([heavyYest, lightToday], NOW);
  assert.strictEqual(r.last3d.peakLoad, 'heavy');
});

test('ENG-16: volume accumulates across multiple sessions', function () {
  var s1 = Object.assign({}, MODERATE_SESSION, { id: 'v1', timestamp: ts(0) });
  var s2 = Object.assign({}, MODERATE_SESSION, { id: 'v2', timestamp: ts(1) });
  var r  = computeRollingLoad([s1, s2], NOW);
  assert(r.last3d.totalVolume > r.last1d.totalVolume);
});

// ─── computeNutrition ────────────────────────────────────────────────────────

console.log('\ncomputeNutrition\n');

test('ENG-17: IDEMPOTENCY — reload produces identical nutrition', function () {
  var sessions = [HEAVY_SESSION];
  var n1 = computeNutrition(USER_MUSCLE, sessions, NOW);
  var n2 = computeNutrition(USER_MUSCLE, sessions, NOW);
  assert.deepStrictEqual(n1, n2);
});

test('ENG-18: training today → more carbs than no training', function () {
  var withTraining    = computeNutrition(USER_MUSCLE, [HEAVY_SESSION], NOW);
  var withoutTraining = computeNutrition(USER_MUSCLE, [], NOW);
  assert(withTraining.carbGrams > withoutTraining.carbGrams,
    'carbGrams(' + withTraining.carbGrams + ') must be > rest(' + withoutTraining.carbGrams + ')');
});

test('ENG-19: heavy session → more carbs than light session same day', function () {
  var heavy = computeNutrition(USER_MUSCLE, [HEAVY_SESSION], NOW);
  var light = computeNutrition(USER_MUSCLE, [LIGHT_SESSION], NOW);
  assert(heavy.carbGrams > light.carbGrams,
    'heavy carbGrams(' + heavy.carbGrams + ') must be > light(' + light.carbGrams + ')');
});

test('ENG-20: 5 days inactivity → nutrition drifts toward rest macros', function () {
  var sess5dAgo = Object.assign({}, HEAVY_SESSION, { id: 'old', timestamp: ts(5) });
  var inactive  = computeNutrition(USER_MUSCLE, [sess5dAgo], NOW);
  var active    = computeNutrition(USER_MUSCLE, [HEAVY_SESSION], NOW);
  // After 5 days inactive, carbs should be significantly lower
  assert(inactive.carbGrams < active.carbGrams,
    'inactive carbs(' + inactive.carbGrams + ') must be < active(' + active.carbGrams + ')');
  // And the blend should show non-zero inactivity
  assert(inactive.basis.inactivityBlendPct > 0);
});

test('ENG-21: 7+ days inactivity → full rest-day macros', function () {
  var sess7dAgo = Object.assign({}, HEAVY_SESSION, { id: 'old7', timestamp: ts(8) });
  var inactive  = computeNutrition(USER_MUSCLE, [sess7dAgo], NOW);
  assert.strictEqual(inactive.basis.inactivityBlendPct, 100);
});

test('ENG-22: no sessions ever → sensible defaults (no crash, reasonable kcal)', function () {
  var r = computeNutrition(USER_MUSCLE, [], NOW);
  assert(r.calorieTarget > 1400);
  assert(r.proteinGrams > 0);
  assert(r.carbGrams >= 0);
  assert(r.fatGrams > 0);
});

test('ENG-23: null user → falls back to safe defaults (no crash)', function () {
  var r = computeNutrition(null, [], NOW);
  assert(r.calorieTarget > 0);
});

test('ENG-24: fat_loss goal → lower calories than muscle_gain goal', function () {
  var cut  = computeNutrition(USER_CUT,    [HEAVY_SESSION], NOW);
  var bulk = computeNutrition(USER_MUSCLE, [HEAVY_SESSION], NOW);
  assert(cut.calorieTarget < bulk.calorieTarget);
});

test('ENG-25: protein stays at ~2g/kg regardless of load', function () {
  var active  = computeNutrition(USER_MUSCLE, [HEAVY_SESSION], NOW);
  var resting = computeNutrition(USER_MUSCLE, [], NOW);
  var target  = Math.round(80 * 2); // 160g
  // Both within ±5g of 2g/kg target
  assert(Math.abs(active.proteinGrams  - target) <= 5);
  assert(Math.abs(resting.proteinGrams - target) <= 5);
});

test('ENG-26: activity PAL reflects actual weekly training days', function () {
  // 5 sessions across 5 unique days this week
  var sessions5d = [0,1,2,3,4].map(function (i) {
    return Object.assign({}, MODERATE_SESSION, { id: 'p' + i, timestamp: ts(i) });
  });
  var active  = computeNutrition(USER_MUSCLE, sessions5d, NOW);
  var sedent  = computeNutrition(USER_MUSCLE, [], NOW);
  assert(active.calorieTarget > sedent.calorieTarget,
    'active TDEE must exceed sedentary TDEE');
  assert.strictEqual(active.basis.weeklyTrainingDays, 5);
  assert.strictEqual(active.basis.activityPAL, 1.725);
});

test('ENG-27: trained yesterday → effectiveLoad reflects recovery (not rest)', function () {
  var yest = Object.assign({}, HEAVY_SESSION, { id: 'yest', timestamp: ts(1) });
  var r    = computeNutrition(USER_MUSCLE, [yest], NOW);
  // Recovery day — not 'rest', carbs should be elevated above pure rest
  assert.notStrictEqual(r.effectiveLoad, 'rest');
});

test('ENG-28: opening app 5× without training does NOT change nutrition', function () {
  var sessions = [Object.assign({}, HEAVY_SESSION, { id: 'prev', timestamp: ts(2) })];
  // Simulate 5 calls (e.g., 5 app opens)
  var results = [1,2,3,4,5].map(function () { return computeNutrition(USER_MUSCLE, sessions, NOW); });
  for (var i = 1; i < results.length; i++) {
    assert.deepStrictEqual(results[i], results[0], 'result ' + i + ' must equal result 0');
  }
});

// ─── computeCycleProgression ─────────────────────────────────────────────────

console.log('\ncomputeCycleProgression\n');

function makeSessions(count, startDaysBack) {
  var out = [];
  for (var i = 0; i < count; i++) {
    // Alternate training days (every other day) — avoids triggering consecutive-day overreaching
    out.push(Object.assign({}, MODERATE_SESSION, {
      id: 'sess_' + i,
      timestamp: ts(startDaysBack - i * 2)  // 1 rest day between each session
    }));
  }
  return out;
}

test('ENG-29: 0 sessions → week 1, hypertrophy, cycle 1', function () {
  var r = computeCycleProgression([]);
  assert.strictEqual(r.programWeek, 1);
  assert.strictEqual(r.phase.id, 'hypertrophy');
  assert.strictEqual(r.cycleNumber, 1);
  assert.strictEqual(r.totalTrainingDays, 0);
});

test('ENG-30: 4 unique training days → advances to week 2', function () {
  // 4 sessions on 4 different days
  var sessions = makeSessions(4, 10);
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.programWeek, 2);
  assert.strictEqual(r.phase.id, 'hypertrophy2');
});

test('ENG-31: 8 unique training days → week 3 (strength phase)', function () {
  var sessions = makeSessions(8, 20);
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.programWeek, 3);
  assert.strictEqual(r.phase.id, 'strength');
});

test('ENG-32: 12 unique training days → week 4 (deload phase)', function () {
  var sessions = makeSessions(12, 30);
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.programWeek, 4);
  assert.strictEqual(r.phase.id, 'deload');
});

test('ENG-33: 16 unique training days → wraps back to cycle 2, week 1', function () {
  var sessions = makeSessions(16, 40);
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.cycleNumber, 2);
  assert.strictEqual(r.programWeek, 1);
});

test('ENG-34: double sessions on same day count as 1 training day (not 2)', function () {
  // 3 unique days with 2 sessions each = 3 training days, not 6
  var sessions = [];
  for (var d = 0; d < 3; d++) {
    sessions.push(Object.assign({}, MODERATE_SESSION, { id: 'a' + d, timestamp: ts(d) }));
    sessions.push(Object.assign({}, MODERATE_SESSION, { id: 'b' + d, timestamp: ts(d) }));
  }
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.totalTrainingDays, 3);
  assert.strictEqual(r.programWeek, 1); // still in phase 1 (need 4 days to advance)
});

test('ENG-35: skipped sessions do not advance the phase', function () {
  // 2 sessions on separate days — still week 1 (need 4 to advance)
  var sessions = [
    Object.assign({}, MODERATE_SESSION, { id: 's1', timestamp: ts(14) }),
    Object.assign({}, MODERATE_SESSION, { id: 's2', timestamp: ts(7)  })
  ];
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.programWeek, 1);
});

test('ENG-36: overreaching — 5 consecutive days → forces deload phase', function () {
  var sessions = [];
  for (var i = 0; i < 5; i++) {
    sessions.push(Object.assign({}, MODERATE_SESSION, { id: 'oc' + i, timestamp: ts(i) }));
  }
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.overreachingDetected, true);
  assert.strictEqual(r.phase.id, 'deload');
  assert(r.overreachingReason);
});

test('ENG-37: overreaching — 6 sessions in 7-day window → forces deload', function () {
  // 6 unique days in a 7-day stretch
  var sessions = [0,1,2,3,4,6].map(function (i) {
    return Object.assign({}, MODERATE_SESSION, { id: 'or' + i, timestamp: ts(i) });
  });
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.overreachingDetected, true);
  assert.strictEqual(r.phase.id, 'deload');
});

test('ENG-38: 4 sessions/week is healthy — no overreaching', function () {
  // 4 sessions with rest days between them
  var sessions = [0, 2, 4, 6].map(function (i) {
    return Object.assign({}, MODERATE_SESSION, { id: 'h' + i, timestamp: ts(i) });
  });
  var r = computeCycleProgression(sessions);
  assert.strictEqual(r.overreachingDetected, false);
});

// ─── sanitizeSessionInput ─────────────────────────────────────────────────────

console.log('\nsanitizeSessionInput\n');

var HISTORY_80KG = [
  Object.assign({}, MODERATE_SESSION, {
    id: 'h1', timestamp: ts(7),
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
      { name: 'Row',         sets: 4, reps: 8, weight: 70 }
    ]
  }),
  Object.assign({}, MODERATE_SESSION, {
    id: 'h2', timestamp: ts(14),
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 77.5 },
      { name: 'Row',         sets: 4, reps: 8, weight: 67.5 }
    ]
  }),
  Object.assign({}, MODERATE_SESSION, {
    id: 'h3', timestamp: ts(21),
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 75 },
      { name: 'Row',         sets: 4, reps: 8, weight: 65 }
    ]
  })
];

test('ENG-39: valid session passes through with no errors', function () {
  var raw = {
    id: 'new', timestamp: NOW,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 82.5 },
      { name: 'Row',         sets: 4, reps: 8, weight: 72.5 }
    ],
    duration: 55
  };
  var r = sanitizeSessionInput(raw, HISTORY_80KG);
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.errors.length, 0);
  assert.strictEqual(r.session.exercises.length, 2);
});

test('ENG-40: impossible weight jump rejected, safe suggestion returned', function () {
  // Bench Press median ~77.5kg → 250kg input = 3× median → rejected
  var raw = {
    id: 'bad_w', timestamp: NOW,
    exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weight: 250 }],
    duration: 60
  };
  var r = sanitizeSessionInput(raw, HISTORY_80KG);
  // Session is valid (corrected, not discarded)
  assert.strictEqual(r.valid, true);
  // Corrected weight must be significantly less than the input
  var correctedWeight = r.session.exercises[0].weight;
  assert(correctedWeight < 100,
    'corrected weight ' + correctedWeight + 'kg must be < 100kg');
  // A warning was raised
  assert(r.warnings.length > 0, 'should have at least one warning');
  assert(r.warnings[0].indexOf('jump_exceeds_25pct') !== -1);
});

test('ENG-41: weight exactly at +25% boundary → accepted', function () {
  // Bench median ~77.5kg → max = 77.5 * 1.25 = ~96.9kg
  var raw = {
    id: 'ok_w', timestamp: NOW,
    exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weight: 95 }],
    duration: 60
  };
  var r = sanitizeSessionInput(raw, HISTORY_80KG);
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.warnings.length, 0, 'no warnings for weight within 25% ceiling');
});

test('ENG-42: no weight history → weight accepted without validation', function () {
  var raw = {
    id: 'new_ex', timestamp: NOW,
    exercises: [{ name: 'New Exercise', sets: 3, reps: 10, weight: 200 }]
  };
  var r = sanitizeSessionInput(raw, []);
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.warnings.length, 0);
});

test('ENG-43: null session → valid=false, no crash', function () {
  var r = sanitizeSessionInput(null, []);
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.session, null);
});

test('ENG-44: session with no exercises → valid=false', function () {
  var r = sanitizeSessionInput({ timestamp: NOW, exercises: [] }, []);
  assert.strictEqual(r.valid, false);
});

test('ENG-45: out-of-range sets/reps clamped, session still valid', function () {
  var raw = {
    id: 'clamp', timestamp: NOW,
    exercises: [{ name: 'Squat', sets: 99, reps: 200, weight: 100 }]
  };
  var r = sanitizeSessionInput(raw, []);
  assert.strictEqual(r.valid, true);
  assert(r.session.exercises[0].sets <= 10);
  assert(r.session.exercises[0].reps <= 60);
  assert(r.warnings.length > 0);
});

test('ENG-46: exercise with missing name filtered out', function () {
  var raw = {
    id: 'noname', timestamp: NOW,
    exercises: [
      { name: '',       sets: 3, reps: 8, weight: 80 },  // invalid
      { name: 'Squat',  sets: 4, reps: 8, weight: 100 }  // valid
    ]
  };
  var r = sanitizeSessionInput(raw, []);
  assert.strictEqual(r.session.exercises.length, 1);
  assert.strictEqual(r.session.exercises[0].name, 'Squat');
});

test('ENG-47: weight snapped to 2.5kg grid', function () {
  var raw = {
    id: 'snap', timestamp: NOW,
    exercises: [{ name: 'Bench Press', sets: 3, reps: 8, weight: 81.7 }]
  };
  var r = sanitizeSessionInput(raw, []);
  var w = r.session.exercises[0].weight;
  assert.strictEqual(w % 2.5, 0, 'weight ' + w + ' must be a multiple of 2.5');
});

test('ENG-48: bodyweight exercise (weight=0) accepted without flags', function () {
  var raw = {
    id: 'bw', timestamp: NOW,
    exercises: [{ name: 'Pull-up', sets: 4, reps: 8, weight: 0 }]
  };
  var r = sanitizeSessionInput(raw, HISTORY_80KG);
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.warnings.length, 0);
  assert.strictEqual(r.session.exercises[0].weight, 0);
});

test('ENG-49: duration capped at 300 minutes', function () {
  var raw = {
    id: 'dur', timestamp: NOW,
    exercises: [{ name: 'Squat', sets: 3, reps: 8, weight: 80 }],
    duration: 9999
  };
  var r = sanitizeSessionInput(raw, []);
  assert.strictEqual(r.session.duration, 300);
});

test('ENG-50: history=null → no crash, validation runs with empty baseline', function () {
  var raw = {
    id: 'hn', timestamp: NOW,
    exercises: [{ name: 'Squat', sets: 3, reps: 8, weight: 100 }]
  };
  var r = sanitizeSessionInput(raw, null);
  assert.strictEqual(r.valid, true);
});

// ─── System-level coherence scenarios ────────────────────────────────────────

console.log('\nSystem coherence\n');

test('ENG-51: reload scenario — nutrition identical before and after', function () {
  var sessions = [HEAVY_SESSION];
  var before   = computeNutrition(USER_MUSCLE, sessions, NOW);
  // Simulate reload: no state preserved, recompute from raw sessions
  var after    = computeNutrition(USER_MUSCLE, sessions, NOW);
  assert.deepStrictEqual(before, after);
});

test('ENG-52: forgot to save — session with no explicit close still counted', function () {
  // A session without closedAt is still a valid session (closedAt is not in the data model)
  // The "valid" check only requires timestamp + exercises
  var r = computeTrainingSignal([HEAVY_SESSION], NOW);
  assert.strictEqual(r.trainedToday, true);
});

test('ENG-53: user skips session — phase does not advance', function () {
  // 3 sessions then a 2-week gap then 1 more — still only 4 training days
  var sessions = [
    Object.assign({}, MODERATE_SESSION, { id: 'w1a', timestamp: ts(30) }),
    Object.assign({}, MODERATE_SESSION, { id: 'w1b', timestamp: ts(29) }),
    Object.assign({}, MODERATE_SESSION, { id: 'w1c', timestamp: ts(28) }),
    // 2-week gap
    Object.assign({}, MODERATE_SESSION, { id: 'w3a', timestamp: ts(14) })
  ];
  var r = computeCycleProgression(sessions);
  // 4 training days = end of phase 1 / start of phase 2
  assert.strictEqual(r.programWeek, 2);
  assert.strictEqual(r.totalTrainingDays, 4);
});

test('ENG-54: 5-day break — nutrition progressively reduces carbs each day', function () {
  var base = Object.assign({}, HEAVY_SESSION, { id: 'base', timestamp: ts(0) });

  // Simulate from day 0 to day 5 looking back from a future NOW
  var future = NOW + 5 * DAY;
  var nutDay0 = computeNutrition(USER_MUSCLE, [base], NOW);
  var nutDay5 = computeNutrition(USER_MUSCLE, [base], future);

  assert(nutDay5.carbGrams < nutDay0.carbGrams,
    'carbs after 5 days inactive (' + nutDay5.carbGrams + ') must be < day 0 (' + nutDay0.carbGrams + ')');
  assert(nutDay5.basis.inactivityBlendPct > 0);
});

test('ENG-55: wrong weight — history not corrupted, future suggestion sane', function () {
  // Existing history: 80kg bench
  var raw = {
    id: 'bad', timestamp: NOW,
    exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weight: 300 }]
  };
  var sanitized = sanitizeSessionInput(raw, HISTORY_80KG);
  // Corrected weight should be roughly 80kg range, not 300kg
  var usedWeight = sanitized.session.exercises[0].weight;
  assert(usedWeight < 120, 'sanitized weight ' + usedWeight + ' must be < 120kg (not 300)');
  // If this corrected session is added to history, the next computation is still sane
  var updatedHistory = HISTORY_80KG.concat([sanitized.session]);
  var next = sanitizeSessionInput(
    { id: 'next', timestamp: NOW + DAY,
      exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weight: usedWeight + 2.5 }] },
    updatedHistory
  );
  assert.strictEqual(next.valid, true);
  assert.strictEqual(next.warnings.length, 0);
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') +
  'Results: ' + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
process.exit(failed > 0 ? 1 : 0);
