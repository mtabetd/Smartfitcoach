/**
 * Tests — CrossFit Engine SFC
 *
 * Sections :
 *   T01-T06 : getCFWorkingWeight — direct 1RM, alias, back_squat fallback, standards
 *   T07-T12 : generateCrossfitWeek — length, rotation, deload detection
 *   T13-T18 : formatCFMovement — weight, gymnastics, calories, note, plain name
 *   T19-T22 : Level differentiation — scaled vs rx produce different movement text
 *   T23-T27 : CROSSFIT_MIX_SESSIONS — not empty, getMixSessionsForType safe fallback
 */
'use strict';

// ─── Node.js shim: window === global so window.X works ───
global.window = global;

var passed = 0;
var failed = 0;

function assert(name, cond) {
  if (cond) { passed++; process.stdout.write('  ✓ ' + name + '\n'); }
  else       { failed++; process.stderr.write('  ✗ ' + name + '\n'); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data stubs (mirror of production)
// ─────────────────────────────────────────────────────────────────────────────

var CF_STANDARDS = {
  clean:          { m: [40, 60, 80, 100], f: [25, 40, 55, 70] },
  deadlift:       { m: [60, 90, 110, 140], f: [40, 60, 80, 100] },
  front_squat:    { m: [40, 60, 80, 100], f: [25, 40, 55, 70] },
  back_squat:     { m: [50, 70, 100, 130], f: [30, 50, 70, 90] },
  thruster:       { m: [30, 43, 60, 75], f: [20, 30, 43, 55] },
  pullups:        { scaled: 'Ring Rows', inter: 'Pull-ups', rx: 'Chest-to-bar', rx_plus: 'Chest-to-bar + Bar Muscle-ups' },
  hspu:           { scaled: 'Pike Push-ups', inter: 'HSPU (abmat)', rx: 'Strict/Kipping HSPU', rx_plus: 'Strict HSPU (no abmat)' },
  toes_to_bar:    { scaled: 'Hanging Knee Raises', inter: 'Toes-to-bar (kipping)', rx: 'Toes-to-bar (strict ou kipping)', rx_plus: 'Toes-to-bar strict' },
  wall_ball:      { scaled: '4/6kg → 2.7/3m', inter: '6/9kg → 2.7/3m', rx: '9/14kg → 3/3.5m', rx_plus: '9/14kg → 3.5m (cible Games)' },
  box_jump:       { scaled: 'Step-ups 50cm', inter: 'Box Jump 50/60cm', rx: 'Box Jump 60/75cm', rx_plus: 'Box Jump 75/90cm' },
  row_cal:        { cal: [12, 15, 20, 25] },
  assault_bike:   { cal: [8, 12, 15, 20] }
};
window.CF_STANDARDS = CF_STANDARDS;

var CF_LIFT_SCALING_FACTORS = {
  back_squat:     1.00,
  front_squat:    0.85,
  overhead_squat: 0.60,
  squat_clean:    0.75,
  clean:          0.75,
  power_clean:    0.70,
  hang_clean:     0.70,
  snatch:         0.60,
  deadlift:       1.25,
  bench_press:    0.85,
  push_press:     0.65,
  thruster:       0.70
};
window.CF_LIFT_SCALING_FACTORS = CF_LIFT_SCALING_FACTORS;

var CF_LIFT_ALIASES = {
  squat_clean: ['clean'],
  clean:       ['squat_clean', 'power_clean', 'hang_clean'],
  power_clean: ['clean'],
  hang_clean:  ['clean'],
  back_squat:  ['squat'],
  squat:       ['back_squat'],
  bench_press: ['bench', 'dc'],
  shoulder_to_oh: ['push_press', 'jerk'],
  jerk:        ['shoulder_to_oh', 'push_press']
};
window.CF_LIFT_ALIASES = CF_LIFT_ALIASES;

window.isMale = function(sObj) {
  var s = sObj || window.S; if (!s) return false;
  var v = String(s.sex || '').toLowerCase();
  return v === 'homme' || v === 'male' || v === 'm' || v === 'h';
};

// ─── Stub UNITS: identity display ───
window.UNITS = { displayWeight: function(kg) { return kg + 'kg'; } };

// ─── 8 minimal WODs for rotation tests ───
var _FAKE_WODS = (function() {
  var out = [];
  for (var i = 0; i < 8; i++) {
    out.push({
      day: i + 1, name: 'WOD_' + (i + 1),
      wod: { name: 'WOD_' + (i + 1), type: 'AMRAP 15',
             movements: [{name: 'Burpee', reps: 10}] }
    });
  }
  return out;
}());
window.CF_WODS = _FAKE_WODS;

// ─── CF_DAY_TEMPLATES (bilingual labels, current format) ───
var CF_DAY_TEMPLATES = {
  3: [
    {label: {fr: 'Lundi',    en: 'Monday'},    focus: 'Haltéro A + WOD + Gym', hasHaltero: true,  halteroLift: 0},
    {label: {fr: 'Mercredi', en: 'Wednesday'}, focus: 'Haltéro B + WOD + Gym', hasHaltero: true,  halteroLift: 1},
    {label: {fr: 'Vendredi', en: 'Friday'},    focus: 'WOD Compétition + Gym',  hasHaltero: false}
  ],
  4: [
    {label: {fr: 'Lundi',  en: 'Monday'},   focus: 'Haltéro A + WOD', hasHaltero: true,  halteroLift: 0},
    {label: {fr: 'Mardi',  en: 'Tuesday'},  focus: 'Gym + WOD Sprint',     hasHaltero: false},
    {label: {fr: 'Jeudi',  en: 'Thursday'}, focus: 'Haltéro B + WOD', hasHaltero: true,  halteroLift: 1},
    {label: {fr: 'Samedi', en: 'Saturday'}, focus: 'WOD Long + Gym',       hasHaltero: false}
  ]
};

// ─── Mix sessions stubs ───
var MUSCU_MIX_SESSIONS = [
  {name: 'Full Body A', focus: 'Muscu test A', exercises: []},
  {name: 'Full Body B', focus: 'Muscu test B', exercises: []},
  {name: 'Upper',       focus: 'Muscu test C', exercises: []},
  {name: 'Lower',       focus: 'Muscu test D', exercises: []}
];
var CROSSFIT_MIX_SESSIONS = window.CROSSFIT_MIX_SESSIONS || [
  {name: 'AMRAP 15',       focus: 'Conditioning métabolique', exercises: []},
  {name: 'EMOM 20 Force',  focus: 'Force + cardio',                exercises: []},
  {name: 'For Time',       focus: 'Volume + mental',               exercises: []},
  {name: 'Hero WOD Light', focus: 'Conditioning long',             exercises: []}
];
var RUNNING_MIX_SESSIONS = [{name: 'Run Easy', focus: 'Z2', exercises: []}];
var YOGA_MIX_SESSIONS    = [{name: 'Yin Flow', focus: 'Recovery', exercises: []}];
var CALISTHENICS_MIX_SESSIONS = [{name: 'Push BW', focus: 'Push', exercises: []}];

// ─────────────────────────────────────────────────────────────────────────────
// Functions under test (mirrors of production — no logic changes)
// ─────────────────────────────────────────────────────────────────────────────

function getCFWorkingWeight(standardsKey, percentage) {
  var s = window.S;
  if (!s) return '?';
  var sexKey = window.isMale(s) ? 'm' : 'f';
  var cfLvl = s.crossfitLevel;
  if (!cfLvl) {
    if (s.sportLevel === 'pro' || s.sportLevel === 'expert') cfLvl = 'rx_plus';
    else if (s.sportLevel === 'advanced') cfLvl = 'rx';
    else if (s.sportLevel === 'intermediate') cfLvl = 'inter';
    else cfLvl = 'inter';
  }
  var lvlIdx = cfLvl === 'scaled' ? 0 : cfLvl === 'inter' ? 1 : cfLvl === 'rx' ? 2 : cfLvl === 'rx_plus' ? 3 : 1;
  var wodPct = lvlIdx === 0 ? 0.55 : lvlIdx === 1 ? 0.65 : lvlIdx === 2 ? 0.75 : 0.80;

  if (s.crossfit1RM) {
    var rm = s.crossfit1RM[standardsKey];
    if (!rm) {
      var aliases = CF_LIFT_ALIASES[standardsKey] || [];
      for (var ai = 0; ai < aliases.length; ai++) {
        if (s.crossfit1RM[aliases[ai]]) { rm = s.crossfit1RM[aliases[ai]]; break; }
      }
    }
    if (rm) {
      if (percentage) return Math.round(rm * percentage / 100);
      return Math.round(rm * wodPct);
    }
  }

  if (s.crossfit1RM && s.crossfit1RM['back_squat'] && CF_LIFT_SCALING_FACTORS[standardsKey]) {
    var bsRm = s.crossfit1RM['back_squat'];
    var derived1RM = Math.round(bsRm * CF_LIFT_SCALING_FACTORS[standardsKey]);
    if (percentage) return Math.round(derived1RM * percentage / 100);
    return Math.round(derived1RM * wodPct);
  }

  var standards = window.CF_STANDARDS;
  if (standards && standards[standardsKey] && standards[standardsKey][sexKey]) {
    return standards[standardsKey][sexKey][lvlIdx];
  }
  return '?';
}
window.getCFWorkingWeight = getCFWorkingWeight;

function getCFLevelIdx() {
  if (S.crossfitLevel === 'scaled')  return 0;
  if (S.crossfitLevel === 'inter')   return 1;
  if (S.crossfitLevel === 'rx_plus') return 3;
  return 2;
}

function getCFSexKey() {
  return window.isMale(S) ? 'm' : 'f';
}

function formatCFMovement(mov) {
  var levelIdx = getCFLevelIdx();
  var level = S.crossfitLevel;
  var parts = [];

  if (mov.reps) parts.push(mov.reps);

  if (mov.weight) {
    var w = window.getCFWorkingWeight ? window.getCFWorkingWeight(mov.weight) : '?';
    if (w !== '?') {
      parts.push(mov.name + ' @' + (window.UNITS ? window.UNITS.displayWeight(parseFloat(w)) : w + 'kg'));
    } else {
      parts.push(mov.name);
    }
  } else if (mov.gymnastics) {
    var gstd = window.CF_STANDARDS ? window.CF_STANDARDS[mov.gymnastics] : undefined;
    if (gstd && gstd[level]) {
      parts.push(gstd[level]);
    } else {
      parts.push(mov.name);
    }
  } else if (mov.special) {
    var sstd = window.CF_STANDARDS ? window.CF_STANDARDS[mov.special] : undefined;
    if (sstd && sstd.cal) {
      parts.push(mov.name + ' (' + sstd.cal[levelIdx] + ' cal)');
    } else {
      parts.push(mov.name);
    }
  } else if (mov.note) {
    parts.push(mov.note);
  } else {
    parts.push(mov.name);
  }

  return parts.join(' ');
}

function generateCrossfitWeek(weekNumber, daysPerWeek) {
  var allWods = window.CF_WODS || [];
  if (!allWods.length) return [];

  var isDeloadWeek = (weekNumber % 4 === 0);
  var template = CF_DAY_TEMPLATES[daysPerWeek] || CF_DAY_TEMPLATES[4];
  var weekProgram = [];
  var startIdx = ((weekNumber - 1) * daysPerWeek) % allWods.length;

  for (var d = 0; d < template.length; d++) {
    var wodIdx = (startIdx + d) % allWods.length;
    var wod = allWods[wodIdx];
    weekProgram.push({
      dayNumber: d + 1,
      dayLabel: template[d].label,
      focus: template[d].focus,
      hasHaltero: template[d].hasHaltero,
      halteroLift: template[d].halteroLift,
      wod: wod,
      isDeload: isDeloadWeek
    });
  }
  return weekProgram;
}

function getMixSessionsForType(type, days) {
  var d = Math.min(Math.max(days || 1, 1), 4);
  var t = String(type || 'musculation').toLowerCase();
  var source = null;
  if      (t === 'running')       source = RUNNING_MIX_SESSIONS;
  else if (t === 'yoga')          source = YOGA_MIX_SESSIONS;
  else if (t === 'crossfit')      source = CROSSFIT_MIX_SESSIONS;
  else if (t === 'calisthenics')  source = CALISTHENICS_MIX_SESSIONS;
  else                            source = MUSCU_MIX_SESSIONS;
  if (!source || !source.length)  source = MUSCU_MIX_SESSIONS;
  var out = [];
  for (var i = 0; i < d; i++) out.push(source[i % source.length]);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// T01 – T06 : getCFWorkingWeight
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\ngetCFWorkingWeight\n');

// T01: direct 1RM (rx: 75%)
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: { deadlift: 150 } };
var wt01 = getCFWorkingWeight('deadlift');
assert('T01 direct 1RM rx: 150 × 0.75 → 113', wt01 === Math.round(150 * 0.75));

// T02: alias resolution — clean entered, squat_clean requested
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: { clean: 80 } };
var wt02 = getCFWorkingWeight('squat_clean'); // alias → clean
assert('T02 alias squat_clean→clean: 80 × 0.75 = 60', wt02 === 60);

// T03: fallback from back_squat via scaling factor
// front_squat scaling = 0.85; derived1RM = round(100×0.85) = 85; working = round(85×0.75) = 64
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: { back_squat: 100 } };
var wt03 = getCFWorkingWeight('front_squat');
var expected03 = Math.round(Math.round(100 * CF_LIFT_SCALING_FACTORS.front_squat) * 0.75);
assert('T03 back_squat fallback for front_squat = ' + expected03, wt03 === expected03);

// T04: standards fallback — no 1RM, male, rx → CF_STANDARDS.deadlift.m[2] = 110
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: {} };
var wt04 = getCFWorkingWeight('deadlift');
assert('T04 standards fallback male rx = 110', wt04 === 110);

// T05: unknown key returns '?'
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: {} };
var wt05 = getCFWorkingWeight('unknown_lift_xyz');
assert('T05 unknown key returns "?"', wt05 === '?');

// T06: rx_plus (80%) vs rx (75%) — same 1RM produces higher weight
global.S = { crossfitLevel: 'rx_plus', sex: 'm', crossfit1RM: { deadlift: 200 } };
var wtPlus = getCFWorkingWeight('deadlift'); // 200 × 0.80 = 160
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: { deadlift: 200 } };
var wtRx   = getCFWorkingWeight('deadlift'); // 200 × 0.75 = 150
assert('T06 rx_plus > rx working weight (same 1RM)', wtPlus > wtRx);

// ─────────────────────────────────────────────────────────────────────────────
// T07 – T12 : generateCrossfitWeek
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\ngenerateCrossfitWeek\n');

global.S = { crossfitLevel: 'rx', sex: 'm' };

var wk4d = generateCrossfitWeek(1, 4);
assert('T07 4-day week returns 4 days', wk4d.length === 4);

var wk3d = generateCrossfitWeek(1, 3);
assert('T08 3-day week returns 3 days', wk3d.length === 3);

var wk4deload = generateCrossfitWeek(4, 4);
assert('T09 week 4 → isDeload true', wk4deload[0].isDeload === true);

var wk1normal = generateCrossfitWeek(1, 4);
assert('T10 week 1 → isDeload false', wk1normal[0].isDeload === false);

// T11: rotation — week 2 day 1 (4-day) startIdx = (2-1)*4 % 8 = 4 → WOD_5
var wk2 = generateCrossfitWeek(2, 4);
assert('T11 week 2 day 1 rotates to WOD index 4 (WOD_5)', wk2[0].wod.name === 'WOD_5');

// T12: empty CF_WODS returns []
window.CF_WODS = [];
var wkEmpty = generateCrossfitWeek(1, 4);
assert('T12 empty CF_WODS returns []', wkEmpty.length === 0);
window.CF_WODS = _FAKE_WODS; // restore

// ─────────────────────────────────────────────────────────────────────────────
// T13 – T18 : formatCFMovement
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nformatCFMovement\n');

// T13: weight movement — includes @weight and name
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: { deadlift: 150 } };
var fmt13 = formatCFMovement({ name: 'Deadlift', reps: 15, weight: 'deadlift' });
assert('T13 weight: includes reps + name + @weight', fmt13.indexOf('Deadlift @') !== -1 && fmt13.indexOf('15') !== -1);

// T14: gymnastics scaled → standard text, not raw name
global.S = { crossfitLevel: 'scaled', sex: 'm', crossfit1RM: {} };
var fmt14 = formatCFMovement({ name: 'Pull-ups', reps: 10, gymnastics: 'pullups' });
assert('T14 gymnastics scaled = "Ring Rows"', fmt14.indexOf('Ring Rows') !== -1);

// T15: gymnastics rx → rx standard
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: {} };
var fmt15 = formatCFMovement({ name: 'Pull-ups', reps: 10, gymnastics: 'pullups' });
assert('T15 gymnastics rx = "Chest-to-bar"', fmt15.indexOf('Chest-to-bar') !== -1);

// T16: special calories (row_cal scaled → 12 cal)
global.S = { crossfitLevel: 'scaled', sex: 'm', crossfit1RM: {} };
var fmt16 = formatCFMovement({ name: 'Cal Row', reps: null, special: 'row_cal' });
assert('T16 special row_cal scaled = 12 cal', fmt16.indexOf('12 cal') !== -1);

// T17: note movement — returns note text
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: {} };
var fmt17 = formatCFMovement({ name: 'Rest', reps: 1, note: 'Minute de repos' });
assert('T17 note movement includes note text', fmt17.indexOf('Minute de repos') !== -1);

// T18: plain name (no weight/gymnastics/special/note)
global.S = { crossfitLevel: 'rx', sex: 'm', crossfit1RM: {} };
var fmt18 = formatCFMovement({ name: 'Run 400m', reps: 1 });
assert('T18 plain movement returns name', fmt18.indexOf('Run 400m') !== -1);

// ─────────────────────────────────────────────────────────────────────────────
// T19 – T22 : Level differentiation via CF_STANDARDS
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nLevel differentiation\n');

global.S = { crossfitLevel: 'scaled', sex: 'm', crossfit1RM: {} };
var lvl19 = formatCFMovement({ name: 'Pull-ups', reps: 10, gymnastics: 'pullups' });
assert('T19 pullups scaled = "Ring Rows"', lvl19.indexOf('Ring Rows') !== -1);

global.S = { crossfitLevel: 'rx_plus', sex: 'm', crossfit1RM: {} };
var lvl20 = formatCFMovement({ name: 'Pull-ups', reps: 10, gymnastics: 'pullups' });
assert('T20 pullups rx_plus = "Chest-to-bar + Bar Muscle-ups"', lvl20.indexOf('Chest-to-bar + Bar Muscle-ups') !== -1);

global.S = { crossfitLevel: 'scaled', sex: 'm', crossfit1RM: {} };
var lvl21 = formatCFMovement({ name: 'HSPU', reps: 5, gymnastics: 'hspu' });
assert('T21 hspu scaled = "Pike Push-ups"', lvl21.indexOf('Pike Push-ups') !== -1);

global.S = { crossfitLevel: 'inter', sex: 'm', crossfit1RM: {} };
var lvl22 = formatCFMovement({ name: 'Wall Ball', reps: 20, gymnastics: 'wall_ball' });
assert('T22 wall_ball inter contains "6/9kg"', lvl22.indexOf('6/9kg') !== -1);

// ─────────────────────────────────────────────────────────────────────────────
// T23 – T27 : CROSSFIT_MIX_SESSIONS + getMixSessionsForType
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nCROSSFIT_MIX_SESSIONS\n');

assert('T23 CROSSFIT_MIX_SESSIONS is not empty', CROSSFIT_MIX_SESSIONS.length > 0);

var mix24 = getMixSessionsForType('crossfit', 1);
assert('T24 getMixSessions crossfit 1 day → 1 item with name', mix24.length === 1 && !!mix24[0].name);

var mix25 = getMixSessionsForType('crossfit', 4);
assert('T25 getMixSessions crossfit 4 days → 4 items', mix25.length === 4);

var mix26 = getMixSessionsForType('unknown_sport_xyz', 2);
assert('T26 unknown type falls back to MUSCU (returns 2 items)', mix26.length === 2 && mix26[0].name === MUSCU_MIX_SESSIONS[0].name);

var mix27 = getMixSessionsForType('crossfit', 0);
assert('T27 days=0 clamped to 1 → 1 item', mix27.length === 1);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\n' + (failed === 0 ? '✔' : '✖') +
  ' ' + passed + ' passed, ' + failed + ' failed\n\n');
if (failed > 0) process.exit(1);
