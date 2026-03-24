/* ═══════════════════════════════════════════════════════════════
   PERF-HISTORY.JS — Performance History & Delta Calculator
   Tracks muscu weights, strength profile (1RM) and CF 1RM over time.
   Provides kg and % variation calculations for all tracked metrics.
   ═══════════════════════════════════════════════════════════════ */
(function() {
'use strict';

var MAX_ENTRIES = 500; // par type de données

/* ─── STORAGE HELPERS ─── */
function uid() {
  try { return (window.AUTH && AUTH.getUser()) ? AUTH.getUser().id : 'anon'; } catch(e) { return 'anon'; }
}
function storageKey(type) {
  return 'mtd_perf_hist_' + type + '_' + uid();
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

/* ─── RECORD FUNCTIONS ─── */

/**
 * Enregistre une charge d'exercice muscu.
 * @param {string} exerciseName  Nom de l'exercice
 * @param {number} weight        Charge en kg
 * @param {string} type          'barre'|'haltere'|'machine'
 */
function recordMuscuWeight(exerciseName, weight, type) {
  if (!exerciseName || isNaN(weight) || weight <= 0) return;
  var history = loadHistory('muscu_weights');
  history.push({
    date: todayISO(),
    ts: Date.now(),
    exercise: exerciseName,
    weight: weight,
    type: type || 'barre'
  });
  saveHistory('muscu_weights', history);
}

/**
 * Enregistre un 1RM (ou poids max) du profil de force muscu.
 * @param {string} key    Clé MUSCU_KEY_EXERCISES (ex: 'bench_press')
 * @param {number} weight Charge en kg
 * @param {number} reps   Nombre de répétitions
 */
function recordMuscuStrength(key, weight, reps) {
  if (!key || isNaN(weight) || weight <= 0) return;
  var history = loadHistory('muscu_strength');
  // Epley 1RM estimation
  var rm1 = reps && reps > 1 ? Math.round(weight * (1 + (reps || 8) / 30)) : weight;
  history.push({
    date: todayISO(),
    ts: Date.now(),
    key: key,
    weight: weight,
    reps: reps || 1,
    estimated1RM: rm1
  });
  saveHistory('muscu_strength', history);
}

/**
 * Enregistre un 1RM CrossFit.
 * @param {string} liftKey  Clé CF_1RM_LIFTS (ex: 'clean', 'snatch')
 * @param {number} weight   Charge en kg
 */
function recordCF1RM(liftKey, weight) {
  if (!liftKey || isNaN(weight) || weight <= 0) return;
  var history = loadHistory('cf_1rm');
  history.push({
    date: todayISO(),
    ts: Date.now(),
    lift: liftKey,
    weight: weight
  });
  saveHistory('cf_1rm', history);
}

/* ─── DELTA CALCULATOR ─── */

/**
 * Calcule la variation entre la valeur la plus récente et une valeur de référence.
 * @param {Array}  history      Tableau d'entrées triées par date
 * @param {string} filterKey    Nom du champ de filtrage ('exercise'|'key'|'lift')
 * @param {string} filterValue  Valeur à filtrer
 * @param {string} valueField   Champ numérique à comparer ('weight'|'estimated1RM')
 * @param {number} compareDays  Comparer avec la valeur il y a N jours (défaut: entrée précédente)
 * @returns {{current, previous, deltaKg, deltaPct, trend, dates}}
 */
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
    // Find most recent entry before the cutoff
    for (var i = filtered.length - 2; i >= 0; i--) {
      if (filtered[i].ts <= cutoff) { previous = filtered[i]; break; }
    }
    // If nothing before cutoff, take the oldest entry
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

function getLatestMuscuWeight(exerciseName) {
  var d = getMuscuWeightDelta(exerciseName);
  return d ? d.current : null;
}

function getLatestCF1RM(liftKey) {
  var d = getCF1RMDelta(liftKey);
  return d ? d.current : null;
}

/* ─── DASHBOARD WIDGET ─── */

function deltaTag(delta, unit) {
  if (!delta || delta.deltaKg === null) return '';
  var sign = delta.deltaKg > 0 ? '+' : '';
  var color = delta.trend === 'up' ? '#27AE60' : delta.trend === 'down' ? '#C0392B' : '#6B6B65';
  var kgStr = sign + delta.deltaKg + (unit || 'kg');
  var pctStr = delta.deltaPct !== null ? ' (' + (delta.deltaPct > 0 ? '+' : '') + delta.deltaPct + '%)' : '';
  return '<span style="font-size:11px;color:' + color + ';font-family:Helvetica Neue,Arial,sans-serif;margin-left:6px">' + kgStr + pctStr + '</span>';
}

function renderProgressionWidget(container) {
  if (!container) return;
  try { _renderProgressionWidget(container); } catch(e) {
    container.innerHTML = '<p style="font-size:12px;color:var(--grey,#6B6B65);padding:8px">Progression non disponible.</p>';
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
    '.ph-label{font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px}',
    '.ph-period{font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-bottom:12px}'
  ].join('');
  container.appendChild(s);

  var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;

  /* ── FORCE MUSCULAIRE ── */
  var strengthHistory = loadHistory('muscu_strength');
  var keyExercises = (window.MUSCU_KEY_EXERCISES) || [
    {key:'bench_press', name:'Développé couché', muscle:'Poitrine'},
    {key:'squat', name:'Squat', muscle:'Jambes'},
    {key:'deadlift', name:'Soulevé de terre', muscle:'Dos'},
    {key:'overhead_press', name:'Développé militaire', muscle:'Épaules'}
  ];
  var strengthRows = [];
  keyExercises.forEach(function(ex) {
    var d = calcDelta(strengthHistory, 'key', ex.key, 'estimated1RM', 30);
    if (d && d.current) strengthRows.push({ex: ex, delta: d});
  });

  var sec1 = document.createElement('div');
  sec1.className = 'ph-section';
  sec1.appendChild(createLabel('Force — 1RM estimé'));
  if (strengthRows.length === 0) {
    sec1.appendChild(createEmpty('Renseignez vos charges dans le module Sport pour voir votre progression.'));
  } else {
    strengthRows.forEach(function(r) {
      sec1.appendChild(createRow(r.ex.name, r.ex.muscle, r.delta, 'kg', '30 jours'));
    });
  }
  container.appendChild(sec1);

  /* ── 1RM CROSSFIT ── */
  var cfHistory = loadHistory('cf_1rm');
  var cfLifts = (window.CF_1RM_LIFTS) || [
    {key:'clean', name:'Clean (Épaulé)'},
    {key:'snatch', name:'Snatch (Arraché)'},
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
    sec2.appendChild(createEmpty('Renseignez vos 1RM CrossFit pour voir votre progression.'));
  } else {
    cfRows.forEach(function(r) {
      sec2.appendChild(createRow(r.lift.name, 'CrossFit', r.delta, 'kg', '30 jours'));
    });
  }
  container.appendChild(sec2);

  /* ── POIDS CORPOREL (depuis weight_history) ── */
  var whKey = user ? 'mtd_weight_history_' + user.id : 'mtd_weight_history_anon';
  var weightHist = [];
  try { weightHist = JSON.parse(localStorage.getItem(whKey) || '[]'); } catch(e) {}

  if (weightHist.length >= 2) {
    var sec3 = document.createElement('div');
    sec3.className = 'ph-section';
    sec3.appendChild(createLabel('Poids corporel'));
    var wHistSorted = weightHist.slice().sort(function(a,b){ return a.date < b.date ? -1 : 1; });
    var wLast = wHistSorted[wHistSorted.length - 1];
    var wPrev = null;
    var cutoff30 = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
    for (var i = wHistSorted.length - 2; i >= 0; i--) {
      if (wHistSorted[i].date <= cutoff30) { wPrev = wHistSorted[i]; break; }
    }
    if (!wPrev) wPrev = wHistSorted[0];
    var wDelta = {
      current: wLast.weight,
      previous: wPrev.weight,
      deltaKg: +(wLast.weight - wPrev.weight).toFixed(2),
      deltaPct: wPrev.weight > 0 ? +(((wLast.weight - wPrev.weight) / wPrev.weight) * 100).toFixed(1) : null,
      trend: wLast.weight > wPrev.weight ? 'up' : wLast.weight < wPrev.weight ? 'down' : 'stable',
      currentDate: wLast.date,
      previousDate: wPrev.date
    };
    sec3.appendChild(createRow('Poids', '', wDelta, 'kg', '30 jours'));
    container.appendChild(sec3);
  }

  /* ── MENSURATIONS ── */
  if (window.MEASUREMENTS) {
    var mLast = MEASUREMENTS.getLast();
    var mPrev = MEASUREMENTS.getPrevious();
    if (mLast && mPrev) {
      var sec4 = document.createElement('div');
      sec4.className = 'ph-section';
      sec4.appendChild(createLabel('Mensurations'));
      var measFields = [
        {key:'waist', label:'Tour de taille'},
        {key:'chest', label:'Poitrine'},
        {key:'hips', label:'Hanches'},
        {key:'arms', label:'Bras'},
        {key:'thighs', label:'Cuisses'}
      ];
      measFields.forEach(function(f) {
        if (mLast[f.key] && mPrev[f.key]) {
          var mDelta = {
            current: mLast[f.key],
            previous: mPrev[f.key],
            deltaKg: +(mLast[f.key] - mPrev[f.key]).toFixed(1),
            deltaPct: mPrev[f.key] > 0 ? +(((mLast[f.key] - mPrev[f.key]) / mPrev[f.key]) * 100).toFixed(1) : null,
            trend: mLast[f.key] > mPrev[f.key] ? 'up' : mLast[f.key] < mPrev[f.key] ? 'down' : 'stable'
          };
          sec4.appendChild(createRow(f.label, '', mDelta, 'cm', ''));
        }
      });
      if (sec4.childElementCount > 1) container.appendChild(sec4);
    }
  }

  if (container.childElementCount <= 1) {
    var emptyNote = document.createElement('p');
    emptyNote.style.cssText = 'font-family:Helvetica Neue,Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);text-align:center;padding:24px 0;font-style:italic';
    emptyNote.textContent = 'Complétez quelques séances pour voir vos progressions apparaître ici.';
    container.appendChild(emptyNote);
  }
}

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
    deltaEl.innerHTML = deltaTag(delta, unit);
    if (periodLabel) {
      var periodEl = document.createTextNode(' vs ' + periodLabel);
      deltaEl.appendChild(periodEl);
    }
    right.appendChild(deltaEl);
  } else {
    var newLabel = document.createElement('div');
    newLabel.style.cssText = 'font-size:10px;color:var(--grey,#6B6B65);font-family:Helvetica Neue,Arial,sans-serif';
    newLabel.textContent = 'Première mesure';
    right.appendChild(newLabel);
  }
  row.appendChild(right);
  return row;
}

/* ─── PUBLIC API ─── */
window.PERF_HISTORY = {
  recordMuscuWeight: recordMuscuWeight,
  recordMuscuStrength: recordMuscuStrength,
  recordCF1RM: recordCF1RM,
  calcDelta: calcDelta,
  getMuscuWeightDelta: getMuscuWeightDelta,
  getMuscuStrengthDelta: getMuscuStrengthDelta,
  getCF1RMDelta: getCF1RMDelta,
  getLatestMuscuWeight: getLatestMuscuWeight,
  getLatestCF1RM: getLatestCF1RM,
  renderProgressionWidget: renderProgressionWidget
};

})();
