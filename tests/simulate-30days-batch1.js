'use strict';

/**
 * SmartFitCoach V3 — 30-Day Simulation, Batch 1
 * Archetypes: Beginner Inconsistent, Disciplined Intermediate, Overtraining User
 * Simulation only — zero production logic changes.
 */

var DDEv3 = require('../app/daily-decision-engine-v3.js');
var decideDailyPlanV3 = DDEv3.decideDailyPlanV3;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

// Sim starts April 1 2026 (Wednesday = dow 0 throughout)
var SIM_ORIGIN = '2026-04-01T12:00:00Z';
var SIM_DAYS   = 30;

// dow mapping: sim day % 7 → Wed=0 Thu=1 Fri=2 Sat=3 Sun=4 Mon=5 Tue=6
var DOW = { Wed:0, Thu:1, Fri:2, Sat:3, Sun:4, Mon:5, Tue:6 };

function simDate(offset) {
  var d = new Date(SIM_ORIGIN);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split('T')[0];
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function r1(v) { return Math.round(v * 10) / 10; }

// Fatigue increment per session intensity
var FAT_DELTA = { low: 0.5, moderate: 1.0, high: 1.5 };

// Build deterministic 30-day boolean train pattern from weekly days + skip rule
// skipEvery: skip every Nth planned session (null = never skip)
function makePattern(weekDays, skipEvery) {
  var pattern = [], count = 0;
  for (var d = 0; d < SIM_DAYS; d++) {
    if (weekDays.indexOf(d % 7) !== -1) {
      count++;
      pattern.push(skipEvery ? (count % skipEvery !== 0) : true);
    } else {
      pattern.push(false);
    }
  }
  return pattern;
}

// ─────────────────────────────────────────────────────────────
// ARCHETYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────

var ARCHETYPES = [
  {
    id:           'beginner_inconsistent',
    label:        'Beginner Inconsistent',
    goal:         'fat_loss',
    phase:        'build',
    targetFreq:   3,
    // Mon/Wed/Fri, but skips every 3rd planned session (realistic ~67% adherence)
    pattern:      makePattern([DOW.Mon, DOW.Wed, DOW.Fri], 3),
    followsRest:  true,
    baseFatigue:  2.0,
    recovery:     0.7,           // fatigue drop per rest day
    sleepFn:      function(d) { return (d % 4 === 0) ? 2 : 3; },
    initialOffset: -7            // last session 7 days before sim start
  },
  {
    id:           'disciplined_intermediate',
    label:        'Disciplined Intermediate',
    goal:         'muscle_gain',
    phase:        'build',
    targetFreq:   4,
    // Mon/Tue/Thu/Fri, no skip
    pattern:      makePattern([DOW.Mon, DOW.Tue, DOW.Thu, DOW.Fri], null),
    followsRest:  true,
    baseFatigue:  2.0,
    recovery:     0.8,
    sleepFn:      function(d) { return 4; },
    initialOffset: -2
  },
  {
    id:           'overtraining',
    label:        'Overtraining User',
    goal:         'muscle_gain',
    phase:        'build',
    targetFreq:   6,
    // Mon–Sat (skips only Sunday), no skip
    pattern:      makePattern([DOW.Mon, DOW.Tue, DOW.Wed, DOW.Thu, DOW.Fri, DOW.Sat], null),
    followsRest:  false,         // NEVER follows rest advice — key trait of this archetype
    baseFatigue:  2.0,
    recovery:     0.5,           // poor recovery
    sleepFn:      function(d) { return (d % 5 === 0) ? 3 : 4; },
    initialOffset: -1
  }
];

// ─────────────────────────────────────────────────────────────
// SIMULATION CORE
// ─────────────────────────────────────────────────────────────

function simulateArchetype(arch) {
  var fatigue          = arch.baseFatigue;
  var sessions         = [];   // { day, intensity }  — only actual training days
  var rolling          = [];   // last 7 daily records { day, fatigue, decision, momentumScore }
  var results          = [];
  var lastSessionTypes = [];   // rolling last-3 session types fed to diversity layer

  // Last session date: walk backward through sessions, fallback to initialOffset
  function lastSessionDate(currentDay) {
    for (var i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].day < currentDay) return simDate(sessions[i].day);
    }
    return simDate(arch.initialOffset);
  }

  // Last 3 intensities (at least 1 entry required by engine)
  function last3Intensity() {
    var s = sessions.slice(-3).map(function(s) { return s.intensity; });
    return s.length ? s : ['low'];
  }

  // Build userProfile from rolling 7-day window
  function buildUserProfile(day) {
    if (!rolling.length) return null;
    var s7 = sessions.filter(function(s) { return s.day >= day - 7 && s.day < day; });
    var avgFat = r1(clamp(
      rolling.reduce(function(a, b) { return a + b.fatigue; }, 0) / rolling.length,
      1, 5
    ));
    var planned7 = 0;
    for (var d = Math.max(0, day - 7); d < day; d++) {
      if (arch.pattern[d]) planned7++;
    }
    var adherence = planned7 > 0
      ? Math.round(clamp(s7.length / planned7, 0, 1) * 100) / 100
      : 0;
    var intensities = s7.map(function(s) { return s.intensity; });
    var p = {
      avgFatigueLast7Days:         avgFat,
      trainingFrequencyLast7Days:  s7.length,
      adherenceScore:              adherence
    };
    if (intensities.length) p.last7SessionsIntensity = intensities;
    return p;
  }

  // Build userHistory from rolling 7-day window
  function buildUserHistory() {
    if (!rolling.length) return null;
    return {
      last7Decisions: rolling.map(function(d) { return d.decision; }),
      last7Momentum:  rolling.map(function(d) { return d.momentumScore || 0; })
    };
  }

  // ── 30-day loop
  for (var day = 0; day < SIM_DAYS; day++) {
    var intends = arch.pattern[day];
    var sleep   = arch.sleepFn(day);
    var fl      = clamp(Math.round(fatigue), 1, 5);

    var inputs = {
      fatigueLevel:           fl,
      last3SessionsIntensity: last3Intensity(),
      lastSessionDate:        lastSessionDate(day),
      goal:                   arch.goal,
      trainingFrequency:      arch.targetFreq,
      sleepQuality:           sleep,
      trainingPhase:          arch.phase
    };

    var up = buildUserProfile(day);
    if (up) inputs.userProfile = up;
    var uh = buildUserHistory();
    if (uh) {
      uh.lastSessionTypes = lastSessionTypes.slice();
      inputs.userHistory = uh;
    } else if (lastSessionTypes.length > 0) {
      inputs.userHistory = { lastSessionTypes: lastSessionTypes.slice() };
    }

    var out;
    try {
      out = decideDailyPlanV3(inputs);
    } catch (e) {
      out = {
        decision: 'rest', recommendedIntensity: null, recommendedSessionType: null,
        profileType: null, momentumScore: null, fatigueEffective: fl,
        priorityApplied: null, predictionInsights: {},
        premiumCoachingMessage: null, error: e.message
      };
    }

    // Update session type history (feeds diversity layer on next iteration)
    var sessionType = out.recommendedSessionType || null;
    lastSessionTypes.push(sessionType);
    if (lastSessionTypes.length > 3) lastSessionTypes.shift();
    console.log('[DEBUG] Day', pad(day + 1, 2), '| sessType:', pad(String(sessionType), 12), '| history:', JSON.stringify(lastSessionTypes));

    // Actual behavior: overtraining user ignores engine rest; others comply
    var actualDecision;
    if (intends) {
      actualDecision = (out.decision === 'rest' && arch.followsRest) ? 'rest' : 'train';
    } else {
      actualDecision = 'rest';
    }
    var actualIntensity = (actualDecision === 'train')
      ? (out.recommendedIntensity || 'moderate')
      : null;

    var pred = out.predictionInsights || {};
    results.push({
      day:            day + 1,
      date:           simDate(day),
      intends:        intends,
      actual:         actualDecision,
      engineDecision: out.decision,
      override:       (intends && out.decision === 'rest' && actualDecision === 'train'),
      fl:             fl,
      sleep:          sleep,
      intensity:      actualIntensity,
      sessionType:    out.recommendedSessionType  || null,
      profile:        out.profileType             || null,
      momentum:       out.momentumScore,
      fatigueEff:     out.fatigueEffective,
      priority:       out.priorityApplied         || null,
      fatigueRisk:    pred.fatigueRisk             || null,
      next2Days:      pred.next2Days               || null,
      message:        out.premiumCoachingMessage   || null,
      error:          out.error                    || null
    });

    // Update session log
    if (actualDecision === 'train') {
      sessions.push({ day: day, intensity: actualIntensity });
    }

    // Update rolling window (max 7 entries)
    rolling.push({ day: day, fatigue: fl, decision: actualDecision, momentumScore: out.momentumScore || 0 });
    if (rolling.length > 7) rolling.shift();

    // Evolve simulated fatigue for next day
    if (actualDecision === 'train') {
      fatigue += FAT_DELTA[actualIntensity] || 1.0;
      if (sleep < 3) fatigue += 0.3;   // poor sleep compounds
    } else {
      fatigue -= arch.recovery;
      if (sleep < 3) fatigue += 0.2;   // poor sleep slows recovery
    }
    fatigue = clamp(fatigue, 1.0, 5.0);
  }

  return results;
}

// ─────────────────────────────────────────────────────────────
// ANALYSIS
// ─────────────────────────────────────────────────────────────

function analyze(results) {
  var trainRows  = results.filter(function(r) { return r.actual === 'train'; });
  var restRows   = results.filter(function(r) { return r.actual === 'rest'; });
  var overrides  = results.filter(function(r) { return r.override; });

  // Max consecutive rest
  var maxConsecRest = 0, cur = 0;
  results.forEach(function(r) {
    cur = (r.actual === 'rest') ? cur + 1 : 0;
    if (cur > maxConsecRest) maxConsecRest = cur;
  });

  // Max consecutive high-intensity sessions
  var maxConsecHigh = 0; cur = 0;
  results.forEach(function(r) {
    cur = (r.intensity === 'high') ? cur + 1 : 0;
    if (cur > maxConsecHigh) maxConsecHigh = cur;
  });

  // Contradictions: high fatigueRisk + actually trained + high intensity
  var contradictions = results.filter(function(r) {
    return r.fatigueRisk === 'high' && r.actual === 'train' && r.intensity === 'high';
  });

  // Profile changes
  var profChanges = 0, prevProf = null;
  results.forEach(function(r) {
    if (r.profile && prevProf && r.profile !== prevProf) profChanges++;
    if (r.profile) prevProf = r.profile;
  });

  // Momentum swings (≥3 pts between consecutive days)
  var momSwings = 0;
  for (var i = 1; i < results.length; i++) {
    var a = results[i].momentum, b = results[i-1].momentum;
    if (a !== null && b !== null && Math.abs(a - b) >= 3) momSwings++;
  }

  // Unique coaching messages
  var msgSet = {};
  results.forEach(function(r) { if (r.message) msgSet[r.message] = (msgSet[r.message] || 0) + 1; });
  var uniqueMsgs = Object.keys(msgSet).length;

  // Longest consecutive identical message
  var maxSameMsg = 0; cur = 0; var prevMsg = null;
  results.forEach(function(r) {
    if (r.message && r.message === prevMsg) cur++;
    else cur = r.message ? 1 : 0;
    if (cur > maxSameMsg) maxSameMsg = cur;
    prevMsg = r.message;
  });
  // Find the most repeated message text
  var topMsg = Object.keys(msgSet).sort(function(a,b) { return msgSet[b] - msgSet[a]; })[0] || null;

  // Intensity distribution (training days only)
  var intDist = { low: 0, moderate: 0, high: 0 };
  trainRows.forEach(function(r) { intDist[r.intensity] = (intDist[r.intensity] || 0) + 1; });

  // Fatigue trajectory
  var fat1  = r1(results.slice(0, 10).reduce(function(s,r) { return s + r.fl; }, 0) / 10);
  var fat3  = r1(results.slice(20).reduce(function(s,r) { return s + r.fl; }, 0) / 10);
  var fatTrend = fat3 >= fat1 + 1.0 ? 'RISING' : fat3 <= fat1 - 0.5 ? 'DECLINING' : 'STABLE';

  // Profile distribution
  var profDist = {};
  results.forEach(function(r) { if (r.profile) profDist[r.profile] = (profDist[r.profile] || 0) + 1; });

  // Engine override rate
  var engineRestCount = results.filter(function(r) { return r.engineDecision === 'rest'; }).length;

  return {
    trainDays:      trainRows.length,
    restDays:       restRows.length,
    overrides:      overrides.length,
    engineRestCount: engineRestCount,
    maxConsecRest:  maxConsecRest,
    maxConsecHigh:  maxConsecHigh,
    contradictions: contradictions,
    profChanges:    profChanges,
    momSwings:      momSwings,
    uniqueMsgs:     uniqueMsgs,
    maxSameMsg:     maxSameMsg,
    topMsg:         topMsg,
    msgDist:        msgSet,
    intDist:        intDist,
    fat1:           fat1,
    fat3:           fat3,
    fatTrend:       fatTrend,
    profDist:       profDist
  };
}

// ─────────────────────────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────────────────────────

function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function lpad(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }
function line(c, n) { var s = ''; for (var i = 0; i < n; i++) s += c; return s; }

var SEP  = line('=', 64);
var sep  = line('-', 64);

function printDayTable(results) {
  console.log('  Day  Date        Act  Eng  Ovr  Fat  Int       Session       Profile        Mom  Risk    Next2');
  console.log('  ' + line('-', 100));
  results.forEach(function(r) {
    var ovr  = r.override ? 'YES' : '   ';
    var mom  = (r.momentum !== null) ? lpad(r.momentum, 2) : ' -';
    var risk = pad(r.fatigueRisk || '-', 6);
    var next = r.next2Days || '-';
    var prof = pad(r.profile || '-', 14);
    var sess = pad(r.sessionType || '-', 13);
    var intt = pad(r.intensity || 'rest', 8);
    var act  = pad(r.actual.toUpperCase(), 5);
    var eng  = pad(r.engineDecision.toUpperCase(), 5);
    var fl   = r.fl;
    console.log(
      '  ' + pad(r.day, 3) + '  ' + r.date + '  ' +
      act + '  ' + eng + '  ' + ovr + '  ' + fl + '    ' +
      intt + '  ' + sess + '  ' + prof + '  ' + mom + '   ' +
      risk + '  ' + next
    );
  });
}

function printSummaryBlock(arch, results, a) {
  console.log('\n' + SEP);
  console.log('ARCHETYPE: ' + arch.label.toUpperCase());
  console.log('Goal: ' + arch.goal + '  |  Phase: ' + arch.phase + '  |  Target: ' + arch.targetFreq + 'x/week  |  Follows rest: ' + arch.followsRest);
  console.log(SEP);

  // ── 30-day table
  console.log('\n--- 30-DAY LOG\n');
  printDayTable(results);

  // ── Per-week breakdown
  console.log('\n--- WEEKLY BREAKDOWN');
  for (var w = 0; w < 4; w++) {
    var weekRows = results.slice(w * 7, w * 7 + 7);
    var wTrain   = weekRows.filter(function(r) { return r.actual === 'train'; }).length;
    var wFat     = r1(weekRows.reduce(function(s, r) { return s + r.fl; }, 0) / weekRows.length);
    var wHigh    = weekRows.filter(function(r) { return r.intensity === 'high'; }).length;
    var wOver    = weekRows.filter(function(r) { return r.override; }).length;
    var wRisk    = weekRows.filter(function(r) { return r.fatigueRisk === 'high'; }).length;
    var profiles = {};
    weekRows.forEach(function(r) { if (r.profile) profiles[r.profile] = 1; });
    var profList = Object.keys(profiles).join('/') || '-';
    console.log('  Week ' + (w+1) + ': train=' + wTrain + '/7  avg_fatigue=' + wFat + '  high_intensity=' + wHigh + '  risk_days=' + wRisk + '  overrides=' + wOver + '  profile=' + profList);
  }

  // ── Stats summary
  console.log('\n--- STATS');
  console.log('  Training days       : ' + a.trainDays + ' / 30');
  console.log('  Rest days           : ' + a.restDays + ' / 30');
  console.log('  Engine said rest    : ' + a.engineRestCount + ' times');
  console.log('  User overrode rest  : ' + a.overrides + ' times');
  console.log('  Max consec. rest    : ' + a.maxConsecRest + ' days');
  console.log('  Max consec. high    : ' + a.maxConsecHigh + ' sessions');
  console.log('  Contradictions      : ' + a.contradictions.length + '  (high risk + train + high intensity)');
  console.log('  Profile changes     : ' + a.profChanges);
  console.log('  Profile distribution: ' + JSON.stringify(a.profDist));
  console.log('  Momentum swings     : ' + a.momSwings + '  (>= 3pt jump)');
  console.log('  Intensity dist.     : low=' + a.intDist.low + '  moderate=' + a.intDist.moderate + '  high=' + a.intDist.high);
  console.log('  Fatigue trajectory  : days 1-10 avg=' + a.fat1 + '  days 21-30 avg=' + a.fat3 + '  → ' + a.fatTrend);
  console.log('  Unique messages     : ' + a.uniqueMsgs);
  console.log('  Max repeat (same msg): ' + a.maxSameMsg + ' consecutive days');
  if (a.topMsg) {
    console.log('  Most common message : "' + a.topMsg.split('\n')[0] + '"');
    console.log('                        (seen ' + a.msgDist[a.topMsg] + ' / 30 days)');
  }

  // ── Message distribution
  console.log('\n--- COACHING MESSAGE DISTRIBUTION');
  var sortedMsgs = Object.keys(a.msgDist).sort(function(x,y) { return a.msgDist[y] - a.msgDist[x]; });
  sortedMsgs.forEach(function(msg) {
    var lines = msg.split('\n');
    console.log('  [' + pad(a.msgDist[msg], 2) + 'x]  L1: ' + lines[0]);
    if (lines[1]) console.log('        L2: ' + lines[1]);
    if (lines[2]) console.log('        L3: ' + lines[2]);
  });

  // ── Contradiction detail
  if (a.contradictions.length > 0) {
    console.log('\n--- CONTRADICTION DETAILS (high risk + train + high intensity)');
    a.contradictions.forEach(function(r) {
      console.log('  Day ' + r.day + ' (' + r.date + '): fatigue=' + r.fl + ' sleep=' + r.sleep + ' profile=' + r.profile + ' momentum=' + r.momentum + ' priority=' + r.priority);
    });
  }
}

// ─────────────────────────────────────────────────────────────
// CROSS-ARCHETYPE ANALYSIS
// ─────────────────────────────────────────────────────────────

function printCrossReport(allData) {
  console.log('\n\n' + SEP);
  console.log('CROSS-ARCHETYPE ANALYSIS');
  console.log(SEP);

  // ── Section: Problems found
  console.log('\n[SECTION: PROBLEMS FOUND]');
  console.log(sep);

  allData.forEach(function(d) {
    var arch = d.arch;
    var a    = d.analysis;
    var found = [];

    // 1. Overrides (engine ignored)
    if (a.overrides >= 5) {
      found.push('ENGINE_OVERRIDDEN ' + a.overrides + 'x — user trains despite rest advice every time they planned to');
    }

    // 2. Fatigue accumulation
    if (a.fat3 >= a.fat1 + 1.0) {
      found.push('FATIGUE_BUILDUP: +' + r1(a.fat3 - a.fat1) + ' pts over 30 days (' + a.fat1 + ' → ' + a.fat3 + ')');
    }

    // 3. Contradictions
    if (a.contradictions.length > 0) {
      found.push('CONTRADICTION ' + a.contradictions.length + 'x: engine flags high risk but user trains at high intensity');
    }

    // 4. Message repetition
    if (a.maxSameMsg >= 5) {
      found.push('MESSAGE_REPEAT: same coaching message for ' + a.maxSameMsg + ' consecutive days');
    }
    if (a.uniqueMsgs <= 3 && a.trainDays >= 12) {
      found.push('BORING_UX: only ' + a.uniqueMsgs + ' unique messages across ' + a.trainDays + ' training days');
    }

    // 5. Excessive consecutive high intensity
    if (a.maxConsecHigh >= 4) {
      found.push('EXCESS_HIGH: ' + a.maxConsecHigh + ' consecutive high-intensity sessions');
    }

    // 6. Excessive rest gap
    if (a.maxConsecRest >= 7) {
      found.push('EXCESS_REST: ' + a.maxConsecRest + ' consecutive rest days');
    }

    // 7. Profile instability
    if (a.profChanges >= 5) {
      found.push('PROFILE_INSTABILITY: ' + a.profChanges + ' profile changes — user oscillates near threshold');
    }

    if (found.length === 0) {
      console.log('\n' + arch.label + ': no issues');
    } else {
      console.log('\n' + arch.label + ':');
      found.forEach(function(f) { console.log('  ! ' + f); });
    }
  });

  // ── Section: Strange patterns
  console.log('\n\n[SECTION: STRANGE PATTERNS]');
  console.log(sep);

  allData.forEach(function(d) {
    var arch = d.arch;
    var a    = d.analysis;
    var r    = d.results;
    var strange = [];

    // Pattern 1: Engine consistently overridden → fatigue still rises
    if (a.overrides >= 10 && a.fatTrend === 'RISING') {
      strange.push('Engine said REST ' + a.engineRestCount + 'x. User trained anyway ' + a.overrides + 'x. Fatigue rose ' + a.fat1 + ' → ' + a.fat3 + '. Engine is correct, user is wrong — but engine cannot enforce.');
    }

    // Pattern 2: Fatigue high but engine still says train
    var highFatigueTrainDays = r.filter(function(row) { return row.fl >= 4 && row.engineDecision === 'train'; });
    if (highFatigueTrainDays.length >= 5) {
      strange.push('Engine recommends TRAIN on ' + highFatigueTrainDays.length + ' days where fatigueLevel >= 4. Priority logic is overriding fatigue signal.');
    }

    // Pattern 3: Profile locks at one type despite varying adherence
    var dominantProf = Object.keys(a.profDist).sort(function(x,y) { return a.profDist[y] - a.profDist[x]; })[0];
    if (dominantProf && a.profDist[dominantProf] >= 25) {
      strange.push('Profile locked at "' + dominantProf + '" for ' + a.profDist[dominantProf] + '/30 days. Profile changes: ' + a.profChanges + '. Almost no differentiation across the month.');
    }

    // Pattern 4: Low momentum despite consistent training
    var lowMomTrainDays = r.filter(function(row) { return row.actual === 'train' && row.momentum !== null && row.momentum <= 3; });
    if (lowMomTrainDays.length >= 5) {
      strange.push('Low momentum (<=3) on ' + lowMomTrainDays.length + ' training days — likely because adherence is low so engine penalizes consistency.');
    }

    // Pattern 5: Momentum null for many days
    var nullMomDays = r.filter(function(row) { return row.momentum === null; });
    if (nullMomDays.length >= 7) {
      strange.push('momentumScore = null for ' + nullMomDays.length + ' days — userProfile not yet available in early simulation (expected, but worth noting).');
    }

    // Pattern 6: Same coaching message dominates
    if (a.topMsg && a.msgDist[a.topMsg] >= 15) {
      strange.push('Single coaching message covers ' + a.msgDist[a.topMsg] + '/30 days (' + Math.round(a.msgDist[a.topMsg]/30*100) + '%). Message diversity is insufficient for a 30-day experience.');
    }

    // Pattern 7: Session type monotony
    var sessTypes = {};
    r.filter(function(row) { return row.sessionType; }).forEach(function(row) { sessTypes[row.sessionType] = (sessTypes[row.sessionType] || 0) + 1; });
    var dominantSess = Object.keys(sessTypes).sort(function(x,y) { return sessTypes[y] - sessTypes[x]; })[0];
    if (dominantSess && sessTypes[dominantSess] >= 20) {
      strange.push('Session type "' + dominantSess + '" dominates: ' + sessTypes[dominantSess] + '/30 days. User sees same session type every day.');
    }

    // Pattern 8: Engine recommendation ignored -> no escalation
    if (a.overrides >= 3) {
      var maxConsecOverride = 0, curOvr = 0;
      r.forEach(function(row) { curOvr = row.override ? curOvr + 1 : 0; if (curOvr > maxConsecOverride) maxConsecOverride = curOvr; });
      if (maxConsecOverride >= 3) {
        strange.push('User overrides rest advice ' + maxConsecOverride + ' consecutive times. Engine has no escalation mechanism — it gives the same rest advice regardless of how many times it was ignored.');
      }
    }

    if (strange.length === 0) {
      console.log('\n' + arch.label + ': no strange patterns');
    } else {
      console.log('\n' + arch.label + ':');
      strange.forEach(function(s) { console.log('  ~ ' + s); });
    }
  });

  // ── Section: Risks
  console.log('\n\n[SECTION: RISKS BEFORE NEXT MODULE]');
  console.log(sep);

  var allIssues = [];
  allData.forEach(function(d) {
    var a = d.analysis;
    if (a.overrides >= 5)              allIssues.push({ sev: 'HIGH',   arch: d.arch.label, msg: 'No guard when engine advice is ignored repeatedly' });
    if (a.fat3 >= a.fat1 + 1.5)       allIssues.push({ sev: 'HIGH',   arch: d.arch.label, msg: 'Fatigue accumulation uncontrolled (' + a.fat1 + ' → ' + a.fat3 + ')' });
    if (a.contradictions.length > 0)   allIssues.push({ sev: 'MEDIUM', arch: d.arch.label, msg: 'High fatigueRisk coexists with train+high intensity on ' + a.contradictions.length + ' day(s)' });
    if (a.maxSameMsg >= 7)             allIssues.push({ sev: 'MEDIUM', arch: d.arch.label, msg: 'Same coaching message ' + a.maxSameMsg + ' days in a row — UX fatigue risk' });
    if (a.uniqueMsgs <= 3 && a.trainDays >= 12)
                                       allIssues.push({ sev: 'MEDIUM', arch: d.arch.label, msg: 'Only ' + a.uniqueMsgs + ' unique messages across 30 days' });
    if (a.profChanges >= 5)            allIssues.push({ sev: 'LOW',    arch: d.arch.label, msg: 'Profile instability: ' + a.profChanges + ' changes (threshold boundary oscillation)' });
    if (a.maxConsecHigh >= 4)          allIssues.push({ sev: 'MEDIUM', arch: d.arch.label, msg: a.maxConsecHigh + ' consecutive high-intensity sessions' });
  });

  var highs   = allIssues.filter(function(i) { return i.sev === 'HIGH'; });
  var mediums = allIssues.filter(function(i) { return i.sev === 'MEDIUM'; });
  var lows    = allIssues.filter(function(i) { return i.sev === 'LOW'; });

  console.log('\n  HIGH RISK (' + highs.length + ')');
  highs.forEach(function(i)   { console.log('  [HIGH]   [' + i.arch + '] ' + i.msg); });

  console.log('\n  MEDIUM RISK (' + mediums.length + ')');
  mediums.forEach(function(i) { console.log('  [MED]    [' + i.arch + '] ' + i.msg); });

  console.log('\n  LOW RISK (' + lows.length + ')');
  lows.forEach(function(i)    { console.log('  [LOW]    [' + i.arch + '] ' + i.msg); });

  // ── Overall verdict for Batch 1
  console.log('\n\n' + SEP);
  console.log('BATCH 1 VERDICT');
  console.log(sep);
  var critCount = highs.length + mediums.length;
  if (critCount === 0) {
    console.log('ALL CLEAR — engine handles these 3 archetypes without critical issues.');
  } else if (highs.length === 0) {
    console.log('PROCEED WITH CAUTION — ' + mediums.length + ' medium issues documented. No blocking safety risk.');
  } else {
    console.log('ATTENTION REQUIRED — ' + highs.length + ' high-severity issue(s) need acknowledgment before expanding simulation.');
  }
  allIssues.filter(function(i) { return i.sev === 'HIGH' || i.sev === 'MEDIUM'; }).forEach(function(i) {
    console.log('  ' + i.sev + ' | ' + i.arch + ': ' + i.msg);
  });
  console.log('\n' + SEP);
  console.log('END OF BATCH 1 SIMULATION');
  console.log('Next: Batch 2 — archetypes 4 (Fat Loss), 5 (Muscle Gain), 6 (High Fatigue)');
  console.log(SEP);
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

console.log(SEP);
console.log('SMARTFITCOACH V3 — 30-DAY SIMULATION  |  BATCH 1 of 4');
console.log('Archetypes: Beginner Inconsistent | Disciplined Intermediate | Overtraining User');
console.log('Sim period : ' + simDate(0) + ' → ' + simDate(29) + '  (' + SIM_DAYS + ' days)');
console.log('Engine     : decideDailyPlanV3  |  All modules 1–9 active');
console.log(SEP);

var allData = ARCHETYPES.map(function(arch) {
  var results  = simulateArchetype(arch);
  var analysis = analyze(results);
  return { arch: arch, results: results, analysis: analysis };
});

// Per-archetype detailed report
allData.forEach(function(d) {
  printSummaryBlock(d.arch, d.results, d.analysis);
});

// Cross-archetype analysis
printCrossReport(allData);
