/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
/* ═══════════════════════════════════════════════════════════════
   PERF-HISTORY.JS — Performance History & Delta Calculator
   Tracks: muscu weights, strength 1RM, CF 1RM, Hyrox benchmarks,
   Triathlon paces, daily nutrition (calories/macros).
   Provides kg/% variation calculations for all tracked metrics.
   ═══════════════════════════════════════════════════════════════ */
(function() {
'use strict';

var MAX_ENTRIES = 500;

/* ─── STORAGE HELPERS ─── */
function getUid() {
  try { return (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon'; } catch(e) { return 'anon'; }
}
function storageKey(type) {
  return 'mtd_perf_hist_' + type + '_' + getUid();
}
function loadHistory(type) {
  try { return JSON.parse(localStorage.getItem(storageKey(type)) || '[]'); } catch(e) { return []; }
}
function saveHistory(type, arr) {
  try {
    if (arr.length > MAX_ENTRIES) arr = arr.slice(-MAX_ENTRIES);
    localStorage.setItem(storageKey(type), JSON.stringify(arr));
  } catch(e) {}
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ─── HELPERS ─── */

// Converts "mm:ss" → seconds (returns NaN if invalid)
function mmssToSec(str) {
  if (!str) return NaN;
  var parts = String(str).split(':');
  if (parts.length !== 2) return NaN;
  var m = parseInt(parts[0], 10), s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s)) return NaN;
  return m * 60 + s;
}
// Converts seconds → "mm:ss"
function secToMmss(secs) {
  var m = Math.floor(secs / 60), s = secs % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

/* ═══════════════════════════════════════════════════════════════
   RECORD FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

function recordMuscuWeight(exerciseName, weight, type) {
  if (!exerciseName || isNaN(weight) || weight <= 0) return;
  var history = loadHistory('muscu_weights');
  history.push({ date: todayISO(), ts: Date.now(), exercise: exerciseName, weight: weight, type: type || 'barre' });
  saveHistory('muscu_weights', history);
}

function recordMuscuStrength(key, weight, reps) {
  if (!key || isNaN(weight) || weight <= 0) return;
  var _repsCalc = Math.min(reps || 8, 10); // cap at 10 — Brzycki formula unreliable above
  var rm1 = reps && reps > 1 ? Math.round(weight * (1 + _repsCalc / 30)) : weight;
  var history = loadHistory('muscu_strength');
  history.push({ date: todayISO(), ts: Date.now(), key: key, weight: weight, reps: reps || 1, estimated1RM: rm1 });
  saveHistory('muscu_strength', history);
}

function recordCF1RM(liftKey, weight) {
  if (!liftKey || isNaN(weight) || weight <= 0) return;
  var history = loadHistory('cf_1rm');
  history.push({ date: todayISO(), ts: Date.now(), lift: liftKey, weight: weight });
  saveHistory('cf_1rm', history);
}

function recordHyroxBenchmark(stationId, stationName, timeMmss) {
  if (!stationId || !timeMmss) return;
  var secs = mmssToSec(timeMmss);
  if (isNaN(secs) || secs <= 0) return;
  var history = loadHistory('hyrox');
  history.push({ date: todayISO(), ts: Date.now(), station: stationId, name: stationName || stationId, secs: secs, display: timeMmss });
  saveHistory('hyrox', history);
}

function recordTriathlonPace(discipline, value, unit) {
  // discipline: 'swim' (mm:ss/100m) | 'bike' (km/h) | 'run' (mm:ss/km)
  if (!discipline || !value) return;
  var numericVal;
  if (discipline === 'bike') {
    numericVal = parseFloat(value);
    if (isNaN(numericVal) || numericVal <= 0) return;
  } else {
    numericVal = mmssToSec(value);
    if (isNaN(numericVal) || numericVal <= 0) return;
  }
  var history = loadHistory('triathlon');
  history.push({ date: todayISO(), ts: Date.now(), discipline: discipline, value: numericVal, display: String(value), unit: unit || '' });
  saveHistory('triathlon', history);
}

/**
 * Enregistre une séance de running (distance km, durée min, allure mm:ss/km optionnelle).
 * Liée au profil utilisateur via getUid().
 */
function recordRunSession(distanceKm, durationMin, paceMmss) {
  if (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) return;
  if (!durationMin || isNaN(durationMin) || durationMin <= 0) return;
  var paceDisplay = paceMmss || (function() {
    var paceSec = Math.round((durationMin * 60) / distanceKm);
    return secToMmss(paceSec);
  }());
  var history = loadHistory('running');
  history.push({
    date: todayISO(),
    ts: Date.now(),
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: Math.round(durationMin),
    pace: paceDisplay
  });
  saveHistory('running', history);
}

/**
 * Enregistre les macros journalières — une seule entrée par jour (remplace si même date).
 */
function recordNutrition(kcal, proteins, carbs, fats) {
  if (!kcal || isNaN(kcal) || kcal <= 0) return;
  var history = loadHistory('nutrition');
  var today = todayISO();
  var entry = { date: today, ts: Date.now(), kcal: Math.round(kcal), p: Math.round(proteins || 0), g: Math.round(carbs || 0), l: Math.round(fats || 0) };
  // Replace existing entry for today
  var idx = -1;
  for (var i = 0; i < history.length; i++) { if (history[i].date === today) { idx = i; break; } }
  if (idx >= 0) history[idx] = entry; else history.push(entry);
  saveHistory('nutrition', history);
}

/* ═══════════════════════════════════════════════════════════════
   MIGRATION — Seed history from existing localStorage data
   Called once after login. Safe to call multiple times (no-op if already seeded).
   ═══════════════════════════════════════════════════════════════ */

function migrateExistingData() {
  try {
    var uid = getUid();
    // Use a fixed past date to avoid making all historical entries look like today's data
    var today = '2025-01-01';
    var ts = new Date('2025-01-01').getTime();

    /* CF 1RM */
    if (loadHistory('cf_1rm').length === 0) {
      try {
        var cf1rm = JSON.parse(localStorage.getItem('mtd_cf_1rm_' + uid) || 'null');
        if (cf1rm && typeof cf1rm === 'object') {
          var cfHistory = [];
          Object.keys(cf1rm).forEach(function(liftKey) {
            var v = parseFloat(cf1rm[liftKey]);
            if (!isNaN(v) && v > 0) {
              cfHistory.push({ date: today, ts: ts, lift: liftKey, weight: v });
            }
          });
          if (cfHistory.length > 0) saveHistory('cf_1rm', cfHistory);
        }
      } catch(e) {}
    }

    /* Muscu Strength (1RM estimé) */
    if (loadHistory('muscu_strength').length === 0) {
      try {
        var mStrength = JSON.parse(localStorage.getItem('mtd_muscu_strength_' + uid) || 'null');
        if (mStrength && typeof mStrength === 'object') {
          var sHistory = [];
          var keyExList = (window.MUSCU_KEY_EXERCISES) || [];
          keyExList.forEach(function(ex) {
            var w = parseFloat(mStrength[ex.key]);
            var reps = parseInt(mStrength[ex.key + '_reps']) || 8;
            if (!isNaN(w) && w > 0) {
              var rm1 = reps > 1 ? Math.round(w * (1 + reps / 30)) : w;
              sHistory.push({ date: today, ts: ts, key: ex.key, weight: w, reps: reps, estimated1RM: rm1 });
            }
          });
          // Also migrate any key not in the known list
          Object.keys(mStrength).forEach(function(k) {
            if (k.indexOf('_reps') !== -1) return;
            var alreadyDone = sHistory.some(function(e) { return e.key === k; });
            if (!alreadyDone) {
              var w2 = parseFloat(mStrength[k]);
              var reps2 = parseInt(mStrength[k + '_reps']) || 8;
              if (!isNaN(w2) && w2 > 0) {
                sHistory.push({ date: today, ts: ts, key: k, weight: w2, reps: reps2, estimated1RM: reps2 > 1 ? Math.round(w2 * (1 + reps2 / 30)) : w2 });
              }
            }
          });
          if (sHistory.length > 0) saveHistory('muscu_strength', sHistory);
        }
      } catch(e) {}
    }

    /* Muscu Weights (charges de séance) */
    if (loadHistory('muscu_weights').length === 0) {
      try {
        var mWeights = JSON.parse(localStorage.getItem('mtd_muscu_weights_' + uid) || 'null');
        if (mWeights && typeof mWeights === 'object') {
          var wHistory = [];
          Object.keys(mWeights).forEach(function(exName) {
            var entry = mWeights[exName];
            if (entry && typeof entry.weight === 'number' && entry.weight > 0) {
              wHistory.push({ date: today, ts: ts, exercise: exName, weight: entry.weight, type: entry.type || 'barre' });
            }
          });
          if (wHistory.length > 0) saveHistory('muscu_weights', wHistory);
        }
      } catch(e) {}
    }

  } catch(e) {}
}

/* ═══════════════════════════════════════════════════════════════
   DELTA CALCULATOR
   ═══════════════════════════════════════════════════════════════ */

function calcDelta(history, filterKey, filterValue, valueField, compareDays) {
  if (!history || !history.length) return null;
  var field = valueField || 'weight';
  var filtered = history
    .filter(function(e) { return e[filterKey] === filterValue && typeof e[field] === 'number'; })
    .sort(function(a, b) { return a.ts - b.ts; });
  if (filtered.length === 0) return null;
  var current = filtered[filtered.length - 1];
  var previous = null;
  if (compareDays) {
    var cutoff = Date.now() - compareDays * 86400000;
    for (var i = filtered.length - 2; i >= 0; i--) {
      if (filtered[i].ts <= cutoff) { previous = filtered[i]; break; }
    }
    if (!previous && filtered.length > 1) previous = filtered[0];
  } else {
    if (filtered.length > 1) previous = filtered[filtered.length - 2];
  }
  if (!previous) return { current: current[field], previous: null, deltaKg: null, deltaPct: null, trend: 'stable', currentDate: current.date };
  var dKg = +(current[field] - previous[field]).toFixed(2);
  var dPct = previous[field] > 0 ? +(((current[field] - previous[field]) / previous[field]) * 100).toFixed(1) : null;
  return {
    current: current[field],
    previous: previous[field],
    deltaKg: dKg,
    deltaPct: dPct,
    trend: dKg > 0 ? 'up' : dKg < 0 ? 'down' : 'stable',
    currentDate: current.date,
    previousDate: previous.date
  };
}

/* ─── QUERY HELPERS ─── */
function getMuscuWeightDelta(exerciseName, compareDays) {
  return calcDelta(loadHistory('muscu_weights'), 'exercise', exerciseName, 'weight', compareDays);
}
function getMuscuStrengthDelta(key, compareDays) {
  return calcDelta(loadHistory('muscu_strength'), 'key', key, 'estimated1RM', compareDays);
}
function getCF1RMDelta(liftKey, compareDays) {
  return calcDelta(loadHistory('cf_1rm'), 'lift', liftKey, 'weight', compareDays);
}
function getHyroxDelta(stationId, compareDays) {
  // Lower is better for times — invert sign for display
  return calcDelta(loadHistory('hyrox'), 'station', stationId, 'secs', compareDays);
}
function getNutritionDelta(field, compareDays) {
  // field: 'kcal' | 'p' | 'g' | 'l'
  var history = loadHistory('nutrition');
  if (!history.length) return null;
  var sorted = history.slice().sort(function(a, b) { return a.ts - b.ts; });
  var current = sorted[sorted.length - 1];
  var previous = null;
  if (compareDays) {
    var cutoff = Date.now() - compareDays * 86400000;
    for (var i = sorted.length - 2; i >= 0; i--) {
      if (sorted[i].ts <= cutoff) { previous = sorted[i]; break; }
    }
    if (!previous && sorted.length > 1) previous = sorted[0];
  } else {
    if (sorted.length > 1) previous = sorted[sorted.length - 2];
  }
  if (!current || current[field] === undefined) return null;
  var cVal = current[field], pVal = (previous && typeof previous[field] === 'number') ? previous[field] : null;
  var dVal = pVal !== null ? +(cVal - pVal).toFixed(0) : null;
  var dPct = (pVal && pVal > 0 && dVal !== null) ? +(((cVal - pVal) / pVal) * 100).toFixed(1) : null;
  return { current: cVal, previous: pVal, deltaKg: dVal, deltaPct: dPct, trend: dVal > 0 ? 'up' : dVal < 0 ? 'down' : 'stable', currentDate: current.date };
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD WIDGET
   ═══════════════════════════════════════════════════════════════ */

function deltaTag(delta, unit, invertColors) {
  if (!delta || delta.deltaKg === null) return '';
  var sign = delta.deltaKg > 0 ? '+' : '';
  // For times (Hyrox), lower is better → invert colors
  var isGood = invertColors ? delta.trend === 'down' : delta.trend === 'up';
  var color = delta.deltaKg === 0 ? '#6B6B65' : isGood ? '#27AE60' : '#C0392B';
  var valStr = sign + delta.deltaKg + (unit || 'kg');
  var pctStr = delta.deltaPct !== null ? ' (' + (delta.deltaPct > 0 ? '+' : '') + delta.deltaPct + '%)' : '';
  return '<span style="font-size:11px;color:' + color + ';font-family:Helvetica Neue,Arial,sans-serif;margin-left:6px">' + valStr + pctStr + '</span>';
}

function renderProgressionWidget(container) {
  if (!container) return;
  try { _renderProgressionWidget(container); } catch(e) {
    container.innerHTML = '';
    var _pgErr = document.createElement('p');
    _pgErr.style.cssText = 'font-size:12px;color:var(--grey,#6B6B65);padding:8px';
    _pgErr.textContent = (window.isEnglish && window.isEnglish() ? 'Progression not available.' : 'Progression non disponible.');
    container.appendChild(_pgErr);
  }
}

function _renderProgressionWidget(container) {
  container.innerHTML = '';
  var s = document.createElement('style');
  s.textContent = [
    '.ph-section{margin-bottom:20px}',
    '.ph-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border,#D8D8D0)}',
    '.ph-row:last-child{border-bottom:none}',
    '.ph-name{font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--black,#181818)}',
    '.ph-muscle{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:2px}',
    '.ph-val{font-family:Georgia,serif;font-size:18px;font-style:italic;color:var(--black,#181818);text-align:right}',
    '.ph-empty{font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);font-style:italic;padding:12px 0;text-align:center}',
    '.ph-label{font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px}'
  ].join('');
  container.appendChild(s);

  var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
  var hasData = false;

  /* ── FORCE MUSCULAIRE ── */
  var strengthHistory = loadHistory('muscu_strength');
  var _phEN = window.isEnglish && window.isEnglish();
  var keyExercises = (window.MUSCU_KEY_EXERCISES) || [
    {key:'bench_press', name:(_phEN ? 'Bench Press' : 'Développé couché'), muscle:(_phEN ? 'Chest' : 'Poitrine')},
    {key:'squat', name:'Squat', muscle:(_phEN ? 'Legs' : 'Jambes')},
    {key:'deadlift', name:(_phEN ? 'Deadlift' : 'Soulevé de terre'), muscle:(_phEN ? 'Back' : 'Dos')},
    {key:'overhead_press', name:(_phEN ? 'Military Press' : 'Développé militaire'), muscle:(_phEN ? 'Shoulders' : 'Épaules')}
  ];
  var strengthRows = [];
  keyExercises.forEach(function(ex) {
    var d = calcDelta(strengthHistory, 'key', ex.key, 'estimated1RM', 30);
    if (d && d.current) strengthRows.push({ex: ex, delta: d});
  });
  var sec1 = document.createElement('div');
  sec1.className = 'ph-section';
  sec1.appendChild(createLabel(_phEN ? 'Strength — estimated 1RM' : 'Force — 1RM estimé'));
  if (strengthRows.length === 0) {
    sec1.appendChild(createEmpty(_phEN ? 'Enter your weights in the Sport module to see your progression.' : 'Renseignez vos charges dans le module Sport pour voir votre progression.'));
  } else {
    hasData = true;
    strengthRows.forEach(function(r) {
      sec1.appendChild(createRow(r.ex.name, r.ex.muscle, r.delta, 'kg', (_phEN ? '30 days' : '30 jours')));
    });
  }
  container.appendChild(sec1);

  /* ── 1RM CROSSFIT ── */
  var cfHistory = loadHistory('cf_1rm');
  var cfLifts = (window.CF_1RM_LIFTS) || [
    {key:'clean', name:(_phEN ? 'Clean' : 'Clean (Épaulé)')},
    {key:'snatch', name:(_phEN ? 'Snatch' : 'Snatch (Arraché)')},
    {key:'deadlift', name:'Deadlift'},
    {key:'back_squat', name:'Back Squat'}
  ];
  var cfRows = [];
  cfLifts.forEach(function(lift) {
    var d = calcDelta(cfHistory, 'lift', lift.key, 'weight', 30);
    if (d && d.current) cfRows.push({lift: lift, delta: d});
  });
  var sec2 = document.createElement('div');
  sec2.className = 'ph-section';
  sec2.appendChild(createLabel('CrossFit — 1RM'));
  if (cfRows.length === 0) {
    sec2.appendChild(createEmpty(_phEN ? 'Enter your CrossFit 1RMs to see your progression.' : 'Renseignez vos 1RM CrossFit pour voir votre progression.'));
  } else {
    hasData = true;
    cfRows.forEach(function(r) {
      sec2.appendChild(createRow(r.lift.name, 'CrossFit', r.delta, 'kg', (_phEN ? '30 days' : '30 jours')));
    });
  }
  container.appendChild(sec2);

  /* ── BENCHMARKS HYROX ── */
  var hyroxHistory = loadHistory('hyrox');
  if (hyroxHistory.length > 0) {
    var hyroxStations = (window.HYROX_STATIONS) || [];
    var hyroxRows = [];
    hyroxStations.forEach(function(st) {
      if (st.id === 'run') return;
      var d = calcDelta(hyroxHistory, 'station', st.id, 'secs', 30);
      if (d && d.current) {
        // Convert secs back to display
        var displayDelta = JSON.parse(JSON.stringify(d));
        displayDelta.current = secToMmss(d.current);
        hyroxRows.push({station: st, delta: d, displayDelta: displayDelta});
      }
    });
    if (hyroxRows.length > 0) {
      hasData = true;
      var sec5 = document.createElement('div');
      sec5.className = 'ph-section';
      sec5.appendChild(createLabel('Hyrox — Benchmarks'));
      hyroxRows.forEach(function(r) {
        // For times, lower is better → pass invertColors=true
        sec5.appendChild(createRowTime(r.station.name, 'Hyrox', r.delta, true, (_phEN ? '30 days' : '30 jours')));
      });
      container.appendChild(sec5);
    }
  }

  /* ── TRIATHLON ── */
  var triHistory = loadHistory('triathlon');
  if (triHistory.length > 0) {
    var triDisciplines = [
      {id:'swim', name:(_phEN ? 'Swim (pace /100m)' : 'Nage (allure /100m)'), unit:'s', invertColors: true},
      {id:'bike', name:(_phEN ? 'Bike (speed)' : 'Vélo (vitesse)'), unit:'km/h', invertColors: false},
      {id:'run', name:(_phEN ? 'Run (pace /km)' : 'Course (allure /km)'), unit:'s', invertColors: true}
    ];
    var triRows = [];
    triDisciplines.forEach(function(disc) {
      var d = calcDelta(triHistory, 'discipline', disc.id, 'value', 30);
      if (d && d.current) triRows.push({disc: disc, delta: d});
    });
    if (triRows.length > 0) {
      hasData = true;
      var sec6 = document.createElement('div');
      sec6.className = 'ph-section';
      sec6.appendChild(createLabel(_phEN ? 'Triathlon — Paces' : 'Triathlon — Allures'));
      triRows.forEach(function(r) {
        if (r.disc.id === 'bike') {
          sec6.appendChild(createRow(r.disc.name, 'Triathlon', r.delta, 'km/h', (_phEN ? '30 days' : '30 jours')));
        } else {
          sec6.appendChild(createRowTime(r.disc.name, 'Triathlon', r.delta, true, (_phEN ? '30 days' : '30 jours')));
        }
      });
      container.appendChild(sec6);
    }
  }

  /* ── POIDS CORPOREL ── */
  var whKey = user ? 'mtd_weight_history_' + user.id : 'mtd_weight_history_anon';
  var weightHist = [];
  try { weightHist = JSON.parse(localStorage.getItem(whKey) || '[]'); } catch(e) {}
  if (weightHist.length >= 2) {
    hasData = true;
    var sec3 = document.createElement('div');
    sec3.className = 'ph-section';
    sec3.appendChild(createLabel(_phEN ? 'Body weight' : 'Poids corporel'));
    var wHistSorted = weightHist.slice().sort(function(a,b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var wLast = wHistSorted[wHistSorted.length - 1];
    var wPrev = null;
    var cutoff30 = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
    for (var i = wHistSorted.length - 2; i >= 0; i--) {
      if (wHistSorted[i].date <= cutoff30) { wPrev = wHistSorted[i]; break; }
    }
    if (!wPrev) wPrev = wHistSorted[0];
    if (typeof wLast.weight !== 'number' || typeof wPrev.weight !== 'number') { wPrev = null; }
    var wDelta = wPrev ? {
      current: wLast.weight,
      previous: wPrev.weight,
      deltaKg: +(wLast.weight - wPrev.weight).toFixed(2),
      deltaPct: wPrev.weight > 0 ? +(((wLast.weight - wPrev.weight) / wPrev.weight) * 100).toFixed(1) : null,
      trend: wLast.weight > wPrev.weight ? 'up' : wLast.weight < wPrev.weight ? 'down' : 'stable',
      currentDate: wLast.date
    } : null;
    if (wDelta) sec3.appendChild(createRow((_phEN ? 'Weight' : 'Poids'), '', wDelta, 'kg', (_phEN ? '30 days' : '30 jours')));
    container.appendChild(sec3);
  }

  /* ── MENSURATIONS ── */
  if (window.MEASUREMENTS) {
    var mLast = MEASUREMENTS.getLast();
    var mPrev = MEASUREMENTS.getPrevious();
    if (mLast && mPrev) {
      var sec4 = document.createElement('div');
      sec4.className = 'ph-section';
      sec4.appendChild(createLabel(_phEN ? 'Measurements' : 'Mensurations'));
      [{key:'waist',label:(_phEN?'Waist':'Tour de taille')},{key:'chest',label:(_phEN?'Chest':'Poitrine')},{key:'hips',label:(_phEN?'Hips':'Hanches')},{key:'arms',label:(_phEN?'Arms':'Bras')},{key:'thighs',label:(_phEN?'Thighs':'Cuisses')}].forEach(function(f) {
        if (mLast[f.key] && mPrev[f.key]) {
          var mDelta = {
            current: mLast[f.key],
            previous: mPrev[f.key],
            deltaKg: +(mLast[f.key] - mPrev[f.key]).toFixed(1),
            deltaPct: mPrev[f.key] > 0 ? +(((mLast[f.key] - mPrev[f.key]) / mPrev[f.key]) * 100).toFixed(1) : null,
            trend: mLast[f.key] > mPrev[f.key] ? 'up' : mLast[f.key] < mPrev[f.key] ? 'down' : 'stable'
          };
          sec4.appendChild(createRow(f.label, '', mDelta, 'cm', ''));
          hasData = true;
        }
      });
      if (sec4.childElementCount > 1) container.appendChild(sec4);
    }
  }

  /* ── RUNNING ── */
  var runHistory = loadHistory('running');
  if (runHistory.length >= 1) {
    hasData = true;
    var secRun = document.createElement('div');
    secRun.className = 'ph-section';
    secRun.appendChild(createLabel(_phEN ? 'Running — Sessions' : 'Running — Séances'));
    var runSorted = runHistory.slice().sort(function(a, b) { return a.ts - b.ts; });
    // Show last 3 sessions
    var recentRuns = runSorted.slice(-3).reverse();
    recentRuns.forEach(function(entry) {
      var row = document.createElement('div');
      row.className = 'ph-row';
      var left = document.createElement('div');
      var nameEl = document.createElement('div');
      nameEl.className = 'ph-name';
      nameEl.textContent = entry.date;
      left.appendChild(nameEl);
      var subEl = document.createElement('div');
      subEl.className = 'ph-muscle';
      subEl.textContent = entry.distanceKm + ' km · ' + entry.durationMin + ' min';
      left.appendChild(subEl);
      row.appendChild(left);
      var right = document.createElement('div');
      right.style.textAlign = 'right';
      var valEl = document.createElement('div');
      valEl.className = 'ph-val';
      valEl.textContent = entry.pace + '/km';
      right.appendChild(valEl);
      row.appendChild(right);
      secRun.appendChild(row);
    });
    // Distance delta vs 30 days ago
    if (runSorted.length >= 2) {
      var latestRun = runSorted[runSorted.length - 1];
      var cutoff30run = Date.now() - 30 * 86400000;
      var prevRun = null;
      for (var ri = runSorted.length - 2; ri >= 0; ri--) {
        if (runSorted[ri].ts <= cutoff30run) { prevRun = runSorted[ri]; break; }
      }
      if (!prevRun) prevRun = runSorted[0];
      if (prevRun && prevRun !== latestRun) {
        var distDelta = +(latestRun.distanceKm - prevRun.distanceKm).toFixed(2);
        var summaryRow = document.createElement('div');
        summaryRow.className = 'ph-row';
        var sl = document.createElement('div');
        sl.className = 'ph-name';
        sl.textContent = (_phEN ? 'Distance (vs 30d)' : 'Distance (vs 30j)');
        summaryRow.appendChild(sl);
        var sr = document.createElement('div');
        var sign = distDelta >= 0 ? '+' : '';
        var color = distDelta >= 0 ? '#27AE60' : '#C0392B';
        var span = document.createElement('span');
        span.style.cssText = 'font-size:11px;color:' + color + ';font-family:Helvetica Neue,Arial,sans-serif';
        span.textContent = sign + distDelta + ' km';
        sr.appendChild(span);
        summaryRow.appendChild(sr);
        secRun.appendChild(summaryRow);
      }
    }
    container.appendChild(secRun);
  }

  /* ── NUTRITION ── */
  var nutHistory = loadHistory('nutrition');
  if (nutHistory.length >= 2) {
    hasData = true;
    var sec7 = document.createElement('div');
    sec7.className = 'ph-section';
    sec7.appendChild(createLabel(_phEN ? 'Daily nutrition' : 'Nutrition journalière'));
    [{field:'kcal', label:'Calories', unit:'kcal'},
     {field:'p', label:(_phEN ? 'Proteins' : 'Protéines'), unit:'g'},
     {field:'g', label:(_phEN ? 'Carbs' : 'Glucides'), unit:'g'},
     {field:'l', label:(_phEN ? 'Fats' : 'Lipides'), unit:'g'}].forEach(function(nf) {
      var nd = getNutritionDelta(nf.field, 30);
      if (nd && nd.current) {
        sec7.appendChild(createRow(nf.label, 'Nutrition', nd, nf.unit, (_phEN ? '30 days' : '30 jours')));
      }
    });
    if (sec7.childElementCount > 1) container.appendChild(sec7);
  }

  if (!hasData) {
    var emptyNote = document.createElement('p');
    emptyNote.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);text-align:center;padding:24px 0;font-style:italic';
    emptyNote.textContent = (window.isEnglish && window.isEnglish() ? 'Complete a few sessions to see your progression here.' : 'Complétez quelques séances pour voir vos progressions apparaître ici.');
    container.appendChild(emptyNote);
  }
}

/* ─── ROW BUILDERS ─── */
function createLabel(text) {
  var el = document.createElement('div');
  el.className = 'ph-label';
  el.textContent = text;
  return el;
}
function createEmpty(text) {
  var el = document.createElement('div');
  el.className = 'ph-empty';
  el.textContent = text;
  return el;
}
function createRow(name, sub, delta, unit, periodLabel) {
  var row = document.createElement('div');
  row.className = 'ph-row';
  var left = document.createElement('div');
  var nameEl = document.createElement('div');
  nameEl.className = 'ph-name';
  nameEl.textContent = name;
  left.appendChild(nameEl);
  if (sub) {
    var subEl = document.createElement('div');
    subEl.className = 'ph-muscle';
    subEl.textContent = sub;
    left.appendChild(subEl);
  }
  row.appendChild(left);
  var right = document.createElement('div');
  right.style.textAlign = 'right';
  var valEl = document.createElement('div');
  valEl.className = 'ph-val';
  valEl.textContent = delta.current + (unit || 'kg');
  right.appendChild(valEl);
  if (delta.deltaKg !== null && delta.deltaKg !== undefined) {
    var deltaEl = document.createElement('div');
    // XSS fix: use DOM construction instead of innerHTML for deltaTag output
    var sign = delta.deltaKg > 0 ? '+' : '';
    var isGoodFlag = delta.trend === 'up';
    var tagColor = delta.deltaKg === 0 ? '#6B6B65' : isGoodFlag ? '#27AE60' : '#C0392B';
    var tagSpan = document.createElement('span');
    tagSpan.style.cssText = 'font-size:11px;color:' + tagColor + ';font-family:Helvetica Neue,Arial,sans-serif;margin-left:6px';
    var pctStr = delta.deltaPct !== null ? ' (' + (delta.deltaPct > 0 ? '+' : '') + delta.deltaPct + '%)' : '';
    tagSpan.textContent = sign + delta.deltaKg + (unit || 'kg') + pctStr;
    deltaEl.appendChild(tagSpan);
    if (periodLabel) deltaEl.appendChild(document.createTextNode(' vs ' + periodLabel));
    right.appendChild(deltaEl);
  } else {
    var newLabel = document.createElement('div');
    newLabel.style.cssText = 'font-size:10px;color:var(--grey,#6B6B65);font-family:Helvetica Neue,Arial,sans-serif';
    newLabel.textContent = (window.isEnglish && window.isEnglish() ? 'First measure' : 'Première mesure');
    right.appendChild(newLabel);
  }
  row.appendChild(right);
  return row;
}
// Row for time-based metrics (display mm:ss, delta in seconds)
function createRowTime(name, sub, delta, invertColors, periodLabel) {
  var row = document.createElement('div');
  row.className = 'ph-row';
  var left = document.createElement('div');
  var nameEl = document.createElement('div');
  nameEl.className = 'ph-name';
  nameEl.textContent = name;
  left.appendChild(nameEl);
  if (sub) {
    var subEl = document.createElement('div');
    subEl.className = 'ph-muscle';
    subEl.textContent = sub;
    left.appendChild(subEl);
  }
  row.appendChild(left);
  var right = document.createElement('div');
  right.style.textAlign = 'right';
  var valEl = document.createElement('div');
  valEl.className = 'ph-val';
  valEl.textContent = secToMmss(delta.current);
  right.appendChild(valEl);
  if (delta.deltaKg !== null && delta.deltaKg !== undefined) {
    var dSecs = delta.deltaKg; // deltaKg contains delta in seconds here
    var sign = dSecs > 0 ? '+' : '';
    var isGood = invertColors ? dSecs < 0 : dSecs > 0;
    var color = dSecs === 0 ? '#6B6B65' : isGood ? '#27AE60' : '#C0392B';
    var pctStr = delta.deltaPct !== null ? ' (' + (delta.deltaPct > 0 ? '+' : '') + delta.deltaPct + '%)' : '';
    var deltaEl = document.createElement('div');
    // XSS fix: use DOM construction instead of innerHTML
    var timeSpan = document.createElement('span');
    timeSpan.style.cssText = 'font-size:11px;color:' + color + ';font-family:Helvetica Neue,Arial,sans-serif;margin-left:6px';
    timeSpan.textContent = sign + dSecs + 's' + pctStr;
    deltaEl.appendChild(timeSpan);
    if (periodLabel) deltaEl.appendChild(document.createTextNode(' vs ' + periodLabel));
    right.appendChild(deltaEl);
  } else {
    var newLabel = document.createElement('div');
    newLabel.style.cssText = 'font-size:10px;color:var(--grey,#6B6B65);font-family:Helvetica Neue,Arial,sans-serif';
    newLabel.textContent = (window.isEnglish && window.isEnglish() ? 'First measure' : 'Première mesure');
    right.appendChild(newLabel);
  }
  row.appendChild(right);
  return row;
}

/* ─── MINI CHART (SVG Sparkline) ─── */
function renderMiniChart(exerciseName, container) {
  if (typeof exerciseName !== 'string' || !container) return;
  var history = loadHistory('muscu_weights');
  // Filter by exercise name (case-insensitive)
  var exHistory = history.filter(function(e) {
    return e.exercise && e.exercise.toLowerCase() === exerciseName.toLowerCase();
  });
  if (exHistory.length < 2) return; // Pas assez de données

  // Prendre les 8 dernières entrées
  exHistory = exHistory.slice(-8);

  var weights = exHistory.map(function(e) { return e.weight || 0; });
  var minW = Math.min.apply(null, weights);
  var maxW = Math.max.apply(null, weights);
  var rangeW = maxW - minW;

  // Si toutes les charges sont identiques, afficher quand même
  var svgW = 120, svgH = 28;
  var pts = weights.map(function(w, i) {
    var x = exHistory.length > 1 ? Math.round((i / (exHistory.length - 1)) * (svgW - 8)) + 4 : svgW / 2;
    var y = rangeW > 0 ? Math.round(((maxW - w) / rangeW) * (svgH - 8)) + 4 : svgH / 2;
    return x + ',' + y;
  });

  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '28');
  svg.style.cssText = 'display:block;overflow:visible;';

  // Ligne principale
  var polyline = document.createElementNS(ns, 'polyline');
  polyline.setAttribute('points', pts.join(' '));
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', 'var(--green,#1A4A1A)');
  polyline.setAttribute('stroke-width', '1.5');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);

  // Point final (le plus récent)
  var lastPt = pts[pts.length - 1].split(',');
  var dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('cx', lastPt[0]);
  dot.setAttribute('cy', lastPt[1]);
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', 'var(--green,#1A4A1A)');
  svg.appendChild(dot);

  // Wrapper
  var wrap = document.createElement('div');
  wrap.style.cssText = 'padding:8px 12px;border-top:1px solid var(--border,#E8E6DF);background:var(--ivory2,#F4F4F0);';

  // Labels
  var labelsRow = document.createElement('div');
  labelsRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey,#6B6B65);margin-bottom:2px;letter-spacing:0.5px;';

  var leftLabel = document.createElement('span');
  var _dU = (window.UNITS && window.UNITS.displayWeight) ? window.UNITS.displayWeight : function(v) { return v + ' kg'; };
  leftLabel.textContent = _dU(weights[0]);
  labelsRow.appendChild(leftLabel);

  var centerLabel = document.createElement('span');
  centerLabel.style.textTransform = 'uppercase';
  centerLabel.style.letterSpacing = '1px';
  centerLabel.textContent = exHistory.length + (window.isEnglish && window.isEnglish() ? ' sessions' : ' séances');
  labelsRow.appendChild(centerLabel);

  var rightLabel = document.createElement('span');
  var lastW = weights[weights.length - 1];
  var prevW = weights.length > 1 ? weights[weights.length - 2] : lastW;
  var delta = Math.round((lastW - prevW) * 10) / 10;
  var deltaStr = delta > 0 ? '+' + delta + 'kg' : delta < 0 ? delta + 'kg' : '=' + lastW + 'kg';
  rightLabel.style.color = delta > 0 ? 'var(--green,#1A4A1A)' : delta < 0 ? 'var(--orange,#6A4A1A)' : 'var(--grey,#6B6B65)';
  rightLabel.style.cssText += ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;min-width:0;max-width:50%;';
  rightLabel.textContent = _dU(lastW) + (delta !== 0 ? ' (' + deltaStr + ')' : '');
  labelsRow.appendChild(rightLabel);

  wrap.appendChild(labelsRow);
  wrap.appendChild(svg);
  container.appendChild(wrap);
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════ */
window.PERF_HISTORY = {
  // Record
  recordMuscuWeight: recordMuscuWeight,
  recordMuscuStrength: recordMuscuStrength,
  recordCF1RM: recordCF1RM,
  recordHyroxBenchmark: recordHyroxBenchmark,
  recordTriathlonPace: recordTriathlonPace,
  recordRunSession: recordRunSession,
  recordNutrition: recordNutrition,
  // Migration
  migrateExistingData: migrateExistingData,
  // Query
  calcDelta: calcDelta,
  getMuscuWeightDelta: getMuscuWeightDelta,
  getMuscuStrengthDelta: getMuscuStrengthDelta,
  getCF1RMDelta: getCF1RMDelta,
  getHyroxDelta: getHyroxDelta,
  getNutritionDelta: getNutritionDelta,
  // Widget
  renderProgressionWidget: renderProgressionWidget,
  renderMiniChart: renderMiniChart,
  // Nutrition history
  loadNutritionHistory: function() { return loadHistory('nutrition'); }
};

})();
