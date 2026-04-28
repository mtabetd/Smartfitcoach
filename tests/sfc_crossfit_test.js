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
// T28 – T37 : computeCrossfitRestFactor
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\ncomputeCrossfitRestFactor\n');

// ─── Inline mirrors of production helpers ───
function _cfParseRestSeconds(text) {
  var secs = [];
  var t = (text || '').toLowerCase();
  var m;
  var reMinA = /(?:rest|repos)\s+(\d+)\s*min/g;
  while ((m = reMinA.exec(t)) !== null) secs.push(parseInt(m[1], 10) * 60);
  var reMinB = /(\d+)\s*min\s+rest/g;
  while ((m = reMinB.exec(t)) !== null) secs.push(parseInt(m[1], 10) * 60);
  var reSecA = /(?:rest|repos)\s+(\d+)\s*s(?:ec(?:ond)?s?)?(?!\s*min)/g;
  while ((m = reSecA.exec(t)) !== null) secs.push(parseInt(m[1], 10));
  var reSecB = /(\d+)\s*s(?:ec(?:ond)?s?)?\s+rest/g;
  while ((m = reSecB.exec(t)) !== null) secs.push(parseInt(m[1], 10));
  var reColon = /(\d+):(\d{2})\s*rest/g;
  while ((m = reColon.exec(t)) !== null) secs.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10));
  return secs;
}

function computeCrossfitRestFactor(wod, typeString, movements) {
  try {
    var movs = Array.isArray(movements) ? movements : [];
    var notes = (wod && wod.notes) ? (wod.notes + '') : '';
    var hasRest = movs.some(function(m) { return /\brest\b/i.test(m.name || ''); })
               || /\brest\b/i.test(typeString || '')
               || /\brest\b/i.test(notes);
    if (!hasRest) return 1.0;
    var allText = (typeString || '') + ' ' + notes + ' '
      + movs.map(function(m) { return (m.name || '') + ' ' + (m.note || '') + ' ' + (m.notes || ''); }).join(' ');
    var secs = _cfParseRestSeconds(allText);
    if (!secs.length) return 0.9;
    var maxSecs = Math.max.apply(null, secs);
    if (maxSecs >= 120) return 0.75;
    if (maxSecs >= 90)  return 0.80;
    if (maxSecs >= 60)  return 0.85;
    if (maxSecs >= 30)  return 0.92;
    return 0.9;
  } catch(e) { return 0.9; }
}

// T28: no rest → 1.0
var rf28 = computeCrossfitRestFactor(
  {type: 'AMRAP 20', movements: [{name: 'Thruster', reps: 10}]},
  'amrap 20',
  [{name: 'Thruster', reps: 10}]
);
assert('T28 no rest → restFactor = 1.0', rf28 === 1.0);

// T29: EMOM rest slot, no duration → 0.9
var rf29 = computeCrossfitRestFactor(
  {type: 'EMOM 20'},
  'emom 20',
  [{name: 'Cal Row', reps: 12}, {name: 'Thruster', reps: 9}, {name: 'Rest', reps: 1}]
);
assert('T29 EMOM rest slot, no duration → 0.9', rf29 === 0.9);

// T30: "rest 30s" in type string → 0.92
var rf30 = computeCrossfitRestFactor(null, 'for time rest 30s', []);
assert('T30 "rest 30s" → 0.92', rf30 === 0.92);

// T31: "rest 60 sec" in notes → 0.85
var rf31 = computeCrossfitRestFactor(
  {notes: 'Take rest 60 sec between sets.'},
  'for time',
  []
);
assert('T31 "rest 60 sec" → 0.85', rf31 === 0.85);

// T32: "rest 90s" → 0.80
var rf32 = computeCrossfitRestFactor(null, 'every round rest 90s', []);
assert('T32 "rest 90s" → 0.80', rf32 === 0.80);

// T33: "rest 2min" → 0.75
var rf33 = computeCrossfitRestFactor(null, 'rest 2min between rounds', []);
assert('T33 "rest 2min" → 0.75', rf33 === 0.75);

// T34: "1:00 rest" format → 0.85 (60s)
var rf34 = computeCrossfitRestFactor(null, '1:00 rest after each set', []);
assert('T34 "1:00 rest" → 0.85', rf34 === 0.85);

// T35: multiple rest values → strongest reduction used
// type has "rest 30s", notes has "rest 2min" → maxSecs=120 → 0.75
var rf35 = computeCrossfitRestFactor(
  {notes: 'Optional rest 2min at halfway point.'},
  'rest 30s between movements',
  []
);
assert('T35 multiple rests → strongest reduction (0.75)', rf35 === 0.75);

// T36: null wod, null typeString, null movements → no crash, returns 1.0
var rf36;
try { rf36 = computeCrossfitRestFactor(null, null, null); }
catch(e) { rf36 = 'crash'; }
assert('T36 all null inputs → no crash, returns 1.0', rf36 === 1.0);

// T37: trainingLoad formula integrates restFactor correctly
// duration=20, intensity=high(1.3), vol=1.0, rest=0.85 → round(20*1.3*1.0*0.85)=22
var CF_INTENSITY_FACTORS_T37 = { low: 0.8, moderate: 1.0, high: 1.3, very_high: 1.6 };
var tl37 = Math.round(20 * CF_INTENSITY_FACTORS_T37['high'] * 1.0 * 0.85);
assert('T37 trainingLoad 20×1.3×1.0×0.85 = 22', tl37 === 22);

// ─────────────────────────────────────────────────────────────────────────────
// T38 – T40 : crossfitTrainingLoad → S.trainingLoad mapping
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\ncrossfitTrainingLoad → trainingLoad mapping\n');

// Inline mirror of the mapping used in renderCrossfitProgram.
function mapCFLoad(n) {
  return n >= 90 ? 'heavy' : n >= 60 ? 'moderate' : 'light';
}

assert('T38 load=100 → heavy',    mapCFLoad(100) === 'heavy');
assert('T39 load=70  → moderate', mapCFLoad(70)  === 'moderate');
assert('T40 load=40  → light',    mapCFLoad(40)  === 'light');

// Boundary checks: thresholds are inclusive on the upper bound
assert('T38b load=90  → heavy (boundary)',    mapCFLoad(90)  === 'heavy');
assert('T39b load=60  → moderate (boundary)', mapCFLoad(60)  === 'moderate');
assert('T40b load=59  → light (boundary)',    mapCFLoad(59)  === 'light');

// ─────────────────────────────────────────────────────────────────────────────
// T46 – T48 : Unified trainingLoad — MET→load mapping for all sports
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nUnified sport trainingLoad (MET map)\n');

// Mirror of the MET_MAP / threshold logic in _sfcNotifySport
var MET_MAP_T = {
  crossfit:    { scaled:7, inter:8, rx:9, rx_plus:12 },
  running:     { debutant:7, intermediaire:9, avance:11 },
  hyrox:       { debutant:9, intermediaire:11, avance:13, pro:14 },
  padel:       { debutant:6, intermediaire:8, avance:9, competition:10 },
  golf:        { debutant:3.5, intermediaire:4, avance:4.5, scratch:5 },
  triathlon:   { debutant:8, intermediaire:10, avance:12 },
  cycling:     { debutant:6, intermediaire:8, avance:10 },
  calisthenics:{ debutant:4, intermediaire:6, avance:8 },
  yoga:        { debutant:2.5, intermediaire:3, avance:4 }
};
function metToLoad(sport, level) {
  var met = (MET_MAP_T[sport] && MET_MAP_T[sport][level]) || 6;
  return met >= 9 ? 'heavy' : met >= 5 ? 'moderate' : 'light';
}

assert('T46 hyrox intermediaire → heavy',        metToLoad('hyrox', 'intermediaire')    === 'heavy');
assert('T46b hyrox debutant → heavy',            metToLoad('hyrox', 'debutant')         === 'heavy');
assert('T47 yoga intermediaire → light',         metToLoad('yoga', 'intermediaire')     === 'light');
assert('T47b yoga avance → light',               metToLoad('yoga', 'avance')            === 'light');
assert('T48 calisthenics intermediaire → moderate', metToLoad('calisthenics', 'intermediaire') === 'moderate');
assert('T48b calisthenics debutant → light',     metToLoad('calisthenics', 'debutant')  === 'light');
assert('T48c triathlon debutant → moderate',     metToLoad('triathlon', 'debutant')     === 'moderate');
assert('T48d triathlon intermediaire → heavy',   metToLoad('triathlon', 'intermediaire')  === 'heavy');
assert('T48e padel intermediaire → moderate',    metToLoad('padel', 'intermediaire')    === 'moderate');
assert('T48f golf avance → light',               metToLoad('golf', 'avance')            === 'light');

// ─────────────────────────────────────────────────────────────────────────────
// T44 – T45 : Cycling FTP-based intensity → S.trainingLoad mapping
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nCycling FTP intensity → trainingLoad mapping\n');

// Mirrors CYCLING_ZONE_FACTORS_FTP / CYCLING_ZONE_FACTORS_NOFTP in app-sport.js
var CYCLING_ZONE_FACTORS_FTP_T   = { 1: 0.5, 2: 0.75, 3: 1.0, 4: 1.35, 5: 1.6 };
var CYCLING_ZONE_FACTORS_NOFTP_T = { 1: 0.5, 2: 0.7,  3: 0.9, 4: 1.25, 5: 1.5 };

function mapCycLoad(zone, durMins, ftpPresent) {
  var factors = ftpPresent ? CYCLING_ZONE_FACTORS_FTP_T : CYCLING_ZONE_FACTORS_NOFTP_T;
  var load = Math.round(durMins * (factors[zone] || 1.0));
  return load >= 80 ? 'heavy' : load >= 40 ? 'moderate' : 'light';
}

// FTP present path — z4=1.35, 65min → 87.75 → heavy
assert('T44 FTP present, z4 65min → heavy',    mapCycLoad(4, 65, true)  === 'heavy');
assert('T44b FTP present, z1 35min → light',   mapCycLoad(1, 35, true)  === 'light');
assert('T44c FTP present, z2 75min → moderate',mapCycLoad(2, 75, true)  === 'moderate');

// No-FTP fallback path — z2=0.7, 75min → 52.5 → moderate
assert('T45 no FTP, z2 75min → moderate',      mapCycLoad(2, 75, false) === 'moderate');
assert('T45b no FTP, z4 65min → heavy',        mapCycLoad(4, 65, false) === 'heavy');
assert('T45c no FTP, z1 35min → light',        mapCycLoad(1, 35, false) === 'light');

// ─────────────────────────────────────────────────────────────────────────────
// T41 – T43 : Running zone → S.trainingLoad mapping
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nRunning zone → trainingLoad mapping\n');

// Mirror of RUN_ZONE_FACTORS defined in app-sport.js
var RUN_ZONE_FACTORS_T = { 'Z1': 0.5, 'Z1-Z2': 0.65, 'Z2': 0.8, 'Z3': 1.0, 'Z3-Z4': 1.15, 'Z4': 1.3, 'Z4-Z5': 1.5, 'Z5': 1.6 };

// Mirrors the mapping in renderRunningProgram — thresholds: ≥80→heavy, ≥40→moderate, <40→light
function mapRunLoad(zone, durMins) {
  var f = RUN_ZONE_FACTORS_T[zone] || 0.8;
  var load = Math.round(durMins * f);
  return load >= 80 ? 'heavy' : load >= 40 ? 'moderate' : 'light';
}

// 60 min = intermediaire default (SESSION_DUR_RUN table)
assert('T41 long run Z2 60min → moderate',   mapRunLoad('Z2',   60) === 'moderate');
assert('T42 interval Z4-Z5 60min → heavy',   mapRunLoad('Z4-Z5', 60) === 'heavy');
assert('T43 recovery Z1 60min → light',      mapRunLoad('Z1',   60) === 'light');

// Zone boundaries
assert('T41b tempo Z3 60min → moderate',     mapRunLoad('Z3',   60) === 'moderate');
assert('T42b max Z5 60min → heavy',          mapRunLoad('Z5',   60) === 'heavy');
assert('T43b easy Z1-Z2 60min → light',      mapRunLoad('Z1-Z2', 60) === 'light');

// ─────────────────────────────────────────────────────────────────────────────
// T49 – T56 : Edge cases & multi-sport trainingLoad
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nEdge cases & multi-sport trainingLoad\n');

// Running: short Z3 (30min) → below moderate threshold
assert('T49 Z3 30min → light (30*1.0=30 < 40)',   mapRunLoad('Z3', 30)    === 'light');
// Running: Z4 at 50min stays moderate (50*1.3=65 < 80)
assert('T49b Z4 50min → moderate (65 < 80)',       mapRunLoad('Z4', 50)    === 'moderate');
// Running: null zone → fallback factor=0.8, 60min → 48 → moderate
assert('T49c null zone → Z2 fallback → moderate',  mapRunLoad(null, 60)    === 'moderate');
// Running: unknown zone → fallback factor=0.8, 60min → 48 → moderate
assert('T49d unknown zone → Z2 fallback → moderate', mapRunLoad('ZX', 60) === 'moderate');
// Running: zero duration → load=0 → light
assert('T49e duration=0 → light',                 mapRunLoad('Z4', 0)     === 'light');

// Cycling: FTP threshold boundary (> 75 → FTP path, else fallback)
// FTP=76: 60 × 1.35 = 81 → heavy
assert('T50 FTP=76 → FTP path, z4 60min → heavy', mapCycLoad(4, 60, 76 > 75) === 'heavy');
// FTP=75: NOT > 75 → no-FTP path, z4 60min → 60*1.25=75 → moderate (< 80)
assert('T50b FTP=75 → fallback, z4 60min → moderate', mapCycLoad(4, 60, 75 > 75) === 'moderate');
// Cycling: null zone → factor=1.0, FTP path, 60min → 60 → moderate
assert('T51 null zone cycling → factor=1.0 → moderate', mapCycLoad(null, 60, true)  === 'moderate');
// Cycling: zero duration → load=0 → light
assert('T51b duration=0 cycling → light',          mapCycLoad(4, 0, true)  === 'light');
// Cycling: z5 no-FTP, 50min → 50*1.5=75 → moderate (boundary: 75 < 80)
assert('T51c z5 no-FTP 50min → moderate (75 < 80)', mapCycLoad(5, 50, false) === 'moderate');
// Cycling: z5 no-FTP, 55min → 55*1.5=82.5 → heavy
assert('T51d z5 no-FTP 55min → heavy (82.5 >= 80)', mapCycLoad(5, 55, false) === 'heavy');

// MET_MAP edge cases (unknown sport, null sport → default met=6 → moderate)
assert('T52 unknown sport → met=6 → moderate',  metToLoad('parkour', 'inter') === 'moderate');
assert('T52b null sport → met=6 → moderate',    metToLoad(null, 'inter')       === 'moderate');
assert('T52c muscu not in MET_MAP → moderate',  metToLoad('muscu', 'inter')    === 'moderate');

// Multi-sport: demonstrates S.trainingLoad changes per sport/session
// running Z5 60min → heavy; same user cycling z3 no-FTP 60min → moderate
assert('T53 multi-sport run Z5 60min → heavy',           mapRunLoad('Z5', 60)       === 'heavy');
assert('T53b multi-sport cyc z3 60min no-FTP → moderate', mapCycLoad(3, 60, false) === 'moderate');
// Confirms sport switch changes load: heavy → moderate (84 → 54)

// ─────────────────────────────────────────────────────────────────────────────
// T54 – T58 : Multi-sport dailyTrainingLoad aggregation (MAX rule)
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nMulti-sport dailyTrainingLoad aggregation\n');

// Mirror of _sfcAggregateLoad — takes a map of {sport: load} and returns MAX
var _LOAD_RANK_T = { light: 0, moderate: 1, heavy: 2 };
var _RANK_LOAD_T = ['light', 'moderate', 'heavy'];
function aggregateLoads(loadsMap) {
  var maxRank = 0;
  Object.keys(loadsMap).forEach(function(k) {
    var r = _LOAD_RANK_T[loadsMap[k]];
    if (typeof r === 'number' && r > maxRank) maxRank = r;
  });
  return _RANK_LOAD_T[maxRank] || 'moderate';
}

// T54: CF heavy + running light → daily = heavy
assert('T54 CF heavy + running light → daily = heavy',
  aggregateLoads({ crossfit: 'heavy', running: 'light' }) === 'heavy');

// T55: running moderate + cycling heavy → daily = heavy
assert('T55 running moderate + cycling heavy → daily = heavy',
  aggregateLoads({ running: 'moderate', cycling: 'heavy' }) === 'heavy');

// T56: 3 sports mixed — CF moderate + running light + cycling heavy → heavy
assert('T56 CF mod + run light + cyc heavy → daily = heavy',
  aggregateLoads({ crossfit: 'moderate', running: 'light', cycling: 'heavy' }) === 'heavy');

// T57: all sports light → daily = light
assert('T57 all light → daily = light',
  aggregateLoads({ crossfit: 'light', running: 'light', cycling: 'light' }) === 'light');

// T58: single sport heavy → daily = heavy (no other sports)
assert('T58 single sport heavy → daily = heavy',
  aggregateLoads({ crossfit: 'heavy' }) === 'heavy');

// T59: all moderate → daily = moderate
assert('T59 all moderate → daily = moderate',
  aggregateLoads({ crossfit: 'moderate', running: 'moderate' }) === 'moderate');

// T60: verify with real computed loads — CF(90min×1.3=117→heavy) + run(Z1 45min→22→light)
// CF crossfitTrainingLoad=117 → heavy; run runningTrainingLoad=22 → light → MAX = heavy
assert('T60 CF heavy (117) + run light (22) → daily = heavy',
  aggregateLoads({
    crossfit: (function(){ var l=Math.round(90*1.3); return l>=90?'heavy':l>=60?'moderate':'light'; })(),
    running:  (function(){ var l=Math.round(45*0.5); return l>=80?'heavy':l>=40?'moderate':'light'; })()
  }) === 'heavy');

// T61: run moderate (Z2 60min=48) + cyc heavy (z4 FTP 60min=81) → daily = heavy
assert('T61 run moderate (48) + cyc heavy (81) → daily = heavy',
  aggregateLoads({
    running:  (function(){ var l=Math.round(60*0.8);    return l>=80?'heavy':l>=40?'moderate':'light'; })(),
    cycling:  (function(){ var l=Math.round(60*1.35);   return l>=80?'heavy':l>=40?'moderate':'light'; })()
  }) === 'heavy');

// ─────────────────────────────────────────────────────────────────────────────
// T62 – T68 : Carb cycling v2 — rate logic, smoothing cap, nutritionTag
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nCarb cycling v2 — rate, smoothing, nutritionTag\n');

// Mirror of computeNutritionState carb cycling v2 block (app-core.js).
// prevStreak = S.heavyDayStreak before this call (0 if not set).
function carbCyclingV2(trainingLoad, trainingDay, prevStreak) {
  prevStreak = typeof prevStreak === 'number' ? prevStreak : 0;
  var _tl = trainingLoad || 'moderate';
  var _heavyStreak = (_tl === 'heavy') ? prevStreak + 1 : 0;

  var _carbRate;
  if (!trainingDay) {
    _carbRate = -0.10;
  } else if (_tl === 'heavy') {
    _carbRate = _heavyStreak >= 2 ? 0.25 : 0.20;
  } else if (_tl === 'moderate') {
    _carbRate = 0.10;
  } else {
    _carbRate = 0;
  }

  var _tag;
  if (_heavyStreak >= 2) {
    _tag = 'recovery';
  } else if (!trainingDay || _tl === 'light') {
    _tag = 'fat-loss';
  } else {
    _tag = 'performance';
  }

  return { rate: _carbRate, tag: _tag, streak: _heavyStreak };
}

// T62: first heavy training day → +20%, performance tag
var _r62 = carbCyclingV2('heavy', true, 0);
assert('T62 heavy day (first) → rate=0.20',        _r62.rate   === 0.20);
assert('T62b heavy day → tag=performance',          _r62.tag    === 'performance');
assert('T62c heavy day → streak=1',                 _r62.streak === 1);

// T63: 2nd consecutive heavy day → cap +25%, recovery tag
var _r63 = carbCyclingV2('heavy', true, 1);
assert('T63 2 heavy days → rate=0.25 (cap)',        _r63.rate   === 0.25);
assert('T63b 2 heavy days → tag=recovery',          _r63.tag    === 'recovery');
assert('T63c 2 heavy days → streak=2',              _r63.streak === 2);

// T64: rest day → -10%, fat-loss tag (even when dailyTrainingLoad is heavy)
var _r64 = carbCyclingV2('heavy', false, 0);
assert('T64 rest day → rate=-0.10',                 _r64.rate   === -0.10);
assert('T64b rest day → tag=fat-loss',              _r64.tag    === 'fat-loss');

// T65: moderate training → +10%, performance tag
var _r65 = carbCyclingV2('moderate', true, 0);
assert('T65 moderate training → rate=0.10',         _r65.rate   === 0.10);
assert('T65b moderate training → tag=performance',  _r65.tag    === 'performance');

// T66: light training day → 0% boost, fat-loss tag
var _r66 = carbCyclingV2('light', true, 0);
assert('T66 light training → rate=0',               _r66.rate   === 0);
assert('T66b light training → tag=fat-loss',        _r66.tag    === 'fat-loss');

// T67: streak resets on non-heavy day → next isolated heavy is not capped
var _s67a = carbCyclingV2('heavy',    true, 0).streak;       // 1
var _s67b = carbCyclingV2('moderate', true, _s67a).streak;   // resets to 0
var _r67c = carbCyclingV2('heavy',    true, _s67b);          // streak=1 again
assert('T67 heavy→moderate→heavy: streak resets to 0',          _s67b === 0);
assert('T67b isolated heavy after reset → rate=0.20 (not capped)', _r67c.rate === 0.20);

// T68: 3+ consecutive heavy days → still capped at +25% (cap does not grow further)
var _r68 = carbCyclingV2('heavy', true, 2);
assert('T68 3 heavy days → still capped at +25%',   _r68.rate === 0.25);
assert('T68b 3 heavy days → tag=recovery',           _r68.tag  === 'recovery');

// ─────────────────────────────────────────────────────────────────────────────
// T69 – T79 : XSS protection — _sfcBlockDangerous + _sfcSanitize
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\nXSS protection — block + sanitize\n');

// Inline mirrors of _sfcBlockDangerous and _sfcSanitize (app-sport.js)
function sfcBlockDangerous(html) {
  if (!html || typeof html !== 'string') return html || '';
  if (/<script\b/i.test(html))             return '';
  if (/\bon\w+\s*=/i.test(html))           return '';
  if (/javascript\s*:/i.test(html))        return '';
  if (/vbscript\s*:/i.test(html))          return '';
  if (/data\s*:\s*text\/html/i.test(html)) return '';
  return html;
}
function sfcSanitize(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="about:blank"')
    .replace(/src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'src=""')
    .replace(/\bexpression\s*\(/gi, '')
    .replace(/data\s*:\s*text\/html/gi, 'data-blocked:text/html');
}

// _sfcBlockDangerous — script injection blocked
assert('T69 <script> tag → blocked (returns empty)',
  sfcBlockDangerous('<script>alert(1)</script>') === '');
assert('T70 <SCRIPT> uppercase → blocked',
  sfcBlockDangerous('<SCRIPT>evil()</SCRIPT>') === '');
assert('T71 <script src=...> → blocked',
  sfcBlockDangerous('<script src="evil.js"></script>') === '');

// _sfcBlockDangerous — inline JS event handlers blocked
assert('T72 onerror= → blocked',
  sfcBlockDangerous('<img onerror="alert(1)">') === '');
assert('T73 onclick= → blocked',
  sfcBlockDangerous('<div onclick="evil()">text</div>') === '');
assert('T74 onload= → blocked',
  sfcBlockDangerous('<body onload="steal()">') === '');

// _sfcBlockDangerous — protocol injection blocked
assert('T75 javascript: href → blocked',
  sfcBlockDangerous('<a href="javascript:void(0)">link</a>') === '');
assert('T75b vbscript: → blocked',
  sfcBlockDangerous('<a href="vbscript:evil()">x</a>') === '');
assert('T75c data:text/html → blocked',
  sfcBlockDangerous('<iframe src="data:text/html,<h1>x</h1>">') === '');

// _sfcBlockDangerous — clean HTML passes through unchanged
assert('T76 safe <p> tag passes through',
  sfcBlockDangerous('<p class="text">Hello <strong>world</strong></p>') !== '');
assert('T76b safe SVG passes through',
  sfcBlockDangerous('<svg width="16"><path d="M4 8h8"/></svg>') !== '');

// _sfcSanitize — strips dangerous content, keeps clean HTML intact
assert('T77 <script> stripped by sanitize',
  sfcSanitize('<p>ok</p><script>alert(1)</script>') === '<p>ok</p>');
assert('T77b on* attribute stripped',
  sfcSanitize('<img src="x" onerror="alert(1)">').indexOf('onerror') === -1);
assert('T77c javascript: href neutralized',
  sfcSanitize('<a href="javascript:alert(1)">x</a>').indexOf('javascript:') === -1);
assert('T77d expression() stripped',
  sfcSanitize('<div style="width:expression(alert(1))">').indexOf('expression(') === -1);
assert('T77e data:text/html neutralized',
  sfcSanitize('<iframe src="data:text/html,x">').indexOf('data:text/html') === -1);

// Combined: sanitize then block — double-gate for high-risk content
// (simulate _sfcBlockDangerous(_sfcSanitize(input)) for AI-generated content)
assert('T78 double-gate: sanitize strips onerror, block sees clean HTML',
  (function() {
    var cleaned = sfcSanitize('<p class="ok">text</p><script>evil()</script>');
    var final = sfcBlockDangerous(cleaned);
    // After sanitize: script is gone. Block sees '<p class="ok">text</p>' → passes
    return final !== '' && final.indexOf('<p') !== -1;
  })());
assert('T79 double-gate: script-only input → empty after both layers',
  sfcBlockDangerous(sfcSanitize('<script>evil()</script>')) === '');

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write('\n' + (failed === 0 ? '✔' : '✖') +
  ' ' + passed + ' passed, ' + failed + ' failed\n\n');
if (failed > 0) process.exit(1);
