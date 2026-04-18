/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/* ═══════════════════════════════════════════════════════════════
   ANALYTICS.JS — Onglet "Progrès" (vue analytics dédiée)
   Lit les data existantes (perf-history, S.sessionHistory, etc.)
   et les visualise en tendances 4/8/12 semaines.
   Charte Hermès : Georgia + Helvetica Neue, ivory/noir, border 1px,
   pas d'emoji, micro-caps eyebrow 10px/3px.
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // ─── HELPERS H (DOM sans JSX) ───
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function(k) {
        if (k === 'class') el.className = attrs[k];
        else if (k === 'style') el.style.cssText = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') el.addEventListener(k.slice(2), attrs[k]);
        else el.setAttribute(k, attrs[k]);
      });
    }
    if (typeof children === 'string') el.textContent = children;
    else if (Array.isArray(children)) children.forEach(function(c) { if (c) el.appendChild(c); });
    else if (children && children.nodeType) el.appendChild(children);
    return el;
  }

  // ─── ACCESS DATA ───
  function _uid() {
    try { var u = window.AUTH && window.AUTH.getUser(); return (u && u.id) || 'anon'; } catch(e) { return 'anon'; }
  }

  function _getWeightHistory() {
    // Source : S.weightHistory + mtd_weight_history_<uid>
    var S = window.S || {};
    if (Array.isArray(S.weightHistory) && S.weightHistory.length) return S.weightHistory.slice();
    try {
      var raw = localStorage.getItem('mtd_weight_history_' + _uid());
      if (raw) return JSON.parse(raw) || [];
    } catch(e) {}
    return [];
  }

  function _getSessionHistory() {
    // Source : S.sessionHistory = { 'YYYY-MM-DD': { kcalTotal, duration, date } }
    var S = window.S || {};
    return (S.sessionHistory && typeof S.sessionHistory === 'object') ? S.sessionHistory : {};
  }

  function _getMuscuStrength() {
    // Source : S.muscuStrengthProfile = { 'Exercice': { weight, reps } }
    var S = window.S || {};
    return (S.muscuStrengthProfile && typeof S.muscuStrengthProfile === 'object') ? S.muscuStrengthProfile : {};
  }

  function _getCrossFit1RM() {
    var S = window.S || {};
    return (S.crossfit1RM && typeof S.crossfit1RM === 'object') ? S.crossfit1RM : {};
  }

  function _getRunHistory() {
    try {
      var raw = localStorage.getItem('mtd_run_history_' + _uid());
      if (raw) return JSON.parse(raw) || [];
    } catch(e) {}
    return [];
  }

  function _getFoodJournal() {
    try {
      var raw = localStorage.getItem('mtd_food_journal_' + _uid());
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch(e) { return {}; }
  }

  function _getStreak() {
    try {
      if (window.GAMIFICATION && window.GAMIFICATION.getStreak) return window.GAMIFICATION.getStreak();
      var raw = localStorage.getItem('mtd_streak_' + _uid());
      if (raw) { var s = JSON.parse(raw); return s && s.count ? s.count : 0; }
    } catch(e) {}
    return 0;
  }

  function _getBadges() {
    try {
      var raw = localStorage.getItem('mtd_badges_' + _uid());
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch(e) { return {}; }
  }

  // ─── UTIL DATE ───
  function _daysAgo(n) {
    var d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function _weeksAgo(n) { return _daysAgo(n * 7); }

  function _calcDelta(a, b) {
    if (!a || !b || a === 0) return { abs: 0, pct: 0, arrow: '' };
    var abs = b - a;
    var pct = (abs / a) * 100;
    return { abs: abs, pct: pct, arrow: abs > 0 ? '↑' : (abs < 0 ? '↓' : '→') };
  }

  // ─── STYLE TOKENS ───
  var ST = {
    card: 'background:var(--ivory2,#F4F4F0);border:1px solid var(--line,#D8D8D0);padding:16px;margin-bottom:12px;border-radius:2px;',
    eyebrow: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;',
    title: 'font-family:Georgia,serif;font-size:20px;color:var(--black,#0A0A09);margin-bottom:8px;line-height:1.3;',
    value: 'font-family:Georgia,serif;font-size:28px;color:var(--black,#0A0A09);line-height:1.1;',
    unit: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);margin-left:4px;',
    delta: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;margin-top:4px;',
    row: 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#D8D8D0);',
    sub: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);'
  };

  // ─── SECTION HELPERS ───
  function section(title, kind) {
    var box = h('div', { style: ST.card });
    box.appendChild(h('div', { style: ST.eyebrow }, (kind || 'Progrès') + ' — ' + title));
    return box;
  }

  function metricBig(label, value, unit, deltaObj, period) {
    var wrap = h('div', { style: 'margin-bottom:4px;' });
    wrap.appendChild(h('div', { style: ST.sub + 'margin-bottom:2px;' }, label));
    var line = h('div', { style: 'display:flex;align-items:baseline;' });
    line.appendChild(h('span', { style: ST.value }, String(value)));
    if (unit) line.appendChild(h('span', { style: ST.unit }, unit));
    wrap.appendChild(line);
    if (deltaObj && deltaObj.arrow) {
      var color = deltaObj.abs > 0 ? 'var(--success,#1A4A1A)' : (deltaObj.abs < 0 ? 'var(--warning,#B06A1A)' : 'var(--grey,#6B6B65)');
      wrap.appendChild(h('div', {
        style: ST.delta + 'color:' + color + ';'
      }, deltaObj.arrow + ' ' + (deltaObj.abs > 0 ? '+' : '') + (Math.abs(deltaObj.abs) < 0.1 ? deltaObj.abs.toFixed(2) : deltaObj.abs.toFixed(1)) + (unit || '') + ' (' + (deltaObj.pct > 0 ? '+' : '') + deltaObj.pct.toFixed(1) + '%)' + (period ? ' · ' + period : '')));
    }
    return wrap;
  }

  // ─── RENDER POIDS ───
  function _renderWeight(period) {
    var wh = _getWeightHistory().slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
    var s = section('Poids', 'Évolution');
    if (wh.length === 0) {
      s.appendChild(h('div', { style: ST.sub }, 'Aucune entrée de poids. Enregistrez votre poids depuis le tableau de bord pour suivre votre progression.'));
      return s;
    }
    var last = wh[wh.length - 1];
    var cutoff = _weeksAgo(period || 4);
    // Find first entry at or after cutoff (fallback to oldest)
    var base = null;
    for (var i = 0; i < wh.length; i++) {
      if (wh[i].date && wh[i].date >= cutoff) { base = wh[i]; break; }
    }
    if (!base) base = wh[0];
    var delta = _calcDelta(base.weight, last.weight);
    s.appendChild(metricBig('Aujourd\'hui', last.weight, ' kg', delta, 'il y a ' + (period || 4) + ' sem.'));
    s.appendChild(h('div', { style: ST.sub + 'margin-top:6px;' }, wh.length + ' mesure' + (wh.length > 1 ? 's' : '') + ' enregistrée' + (wh.length > 1 ? 's' : '')));
    return s;
  }

  // ─── RENDER FORCE MUSCU ───
  function _renderForce() {
    var msp = _getMuscuStrength();
    var cf = _getCrossFit1RM();
    var s = section('Force muscu — tes records', '1RM');
    var entries = [];
    Object.keys(msp).forEach(function(k) {
      var e = msp[k];
      if (e && e.weight && e.reps) {
        // Epley : 1RM = w × (1 + r/30)
        var oneRM = Math.round(e.weight * (1 + e.reps / 30) / 2.5) * 2.5;
        entries.push({ name: k, est: oneRM, raw: e.weight + ' × ' + e.reps });
      }
    });
    Object.keys(cf).forEach(function(k) {
      if (cf[k] && cf[k] > 0) entries.push({ name: k + ' (CF)', est: cf[k], raw: '1RM' });
    });
    if (entries.length === 0) {
      s.appendChild(h('div', { style: ST.sub }, 'Commencez à logger vos séances pour voir vos records calculés automatiquement.'));
      return s;
    }
    // Top 6 par est 1RM
    entries.sort(function(a, b) { return b.est - a.est; });
    var top = entries.slice(0, 6);
    top.forEach(function(e) {
      var row = h('div', { style: ST.row });
      row.appendChild(h('div', {}, [
        h('div', { style: 'font-family:Georgia,serif;font-size:14px;color:var(--black,#0A0A09);' }, e.name),
        h('div', { style: ST.sub + 'margin-top:2px;' }, e.raw)
      ]));
      row.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:18px;color:var(--black,#0A0A09);' }, e.est + ' kg'));
      s.appendChild(row);
    });
    return s;
  }

  // ─── RENDER RUNNING ───
  function _renderRunning(period) {
    var rh = _getRunHistory();
    var s = section('Course à pied', 'Running');
    if (!rh.length) {
      s.appendChild(h('div', { style: ST.sub }, 'Aucune course enregistrée.'));
      return s;
    }
    var cutoff = _weeksAgo(period || 4);
    var recent = rh.filter(function(r) { return r && r.date && r.date >= cutoff; });
    if (recent.length === 0) {
      s.appendChild(h('div', { style: ST.sub }, 'Aucune course sur les ' + (period || 4) + ' dernières semaines.'));
      return s;
    }
    var totalKm = 0, totalMin = 0;
    recent.forEach(function(r) {
      totalKm += Number(r.distanceKm) || 0;
      totalMin += Number(r.durationMin) || 0;
    });
    var avgPace = totalKm > 0 ? (totalMin / totalKm) : 0;
    var pMin = Math.floor(avgPace), pSec = Math.round((avgPace - pMin) * 60);
    var paceStr = pMin + ':' + (pSec < 10 ? '0' : '') + pSec + ' /km';
    s.appendChild(metricBig('Distance (' + (period || 4) + ' sem.)', totalKm.toFixed(1), ' km', null, recent.length + ' course' + (recent.length > 1 ? 's' : '')));
    s.appendChild(h('div', { style: 'margin-top:12px;' }));
    s.appendChild(metricBig('Allure moyenne', paceStr, '', null, null));
    return s;
  }

  // ─── RENDER NUTRITION ───
  function _renderNutrition(period) {
    var journal = _getFoodJournal();
    var s = section('Nutrition', 'Macros moyennes');
    var dates = Object.keys(journal).sort();
    if (!dates.length) {
      s.appendChild(h('div', { style: ST.sub }, 'Aucun repas enregistré. Utilisez le Journal du jour pour commencer le suivi.'));
      return s;
    }
    var cutoff = _weeksAgo(period || 4);
    var recentDays = dates.filter(function(d) { return d >= cutoff; });
    if (recentDays.length === 0) {
      s.appendChild(h('div', { style: ST.sub }, 'Aucun repas sur les ' + (period || 4) + ' dernières semaines.'));
      return s;
    }
    var totalK = 0, totalP = 0, totalG = 0, totalL = 0;
    recentDays.forEach(function(d) {
      var entries = journal[d] || [];
      entries.forEach(function(e) {
        if (!e) return;
        totalK += Number(e.kcal) || 0;
        totalP += Number(e.p) || 0;
        totalG += Number(e.g) || 0;
        totalL += Number(e.l) || 0;
      });
    });
    var n = recentDays.length;
    s.appendChild(h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;' }, [
      h('div', { style: 'flex:1;min-width:100px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Kcal / jour'),
        h('div', { style: ST.value }, Math.round(totalK / n))
      ]),
      h('div', { style: 'flex:1;min-width:100px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Protéines'),
        h('div', { style: ST.value }, Math.round(totalP / n) + 'g')
      ]),
      h('div', { style: 'flex:1;min-width:100px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Glucides'),
        h('div', { style: ST.value }, Math.round(totalG / n) + 'g')
      ]),
      h('div', { style: 'flex:1;min-width:100px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Lipides'),
        h('div', { style: ST.value }, Math.round(totalL / n) + 'g')
      ])
    ]));
    s.appendChild(h('div', { style: ST.sub + 'margin-top:10px;' }, 'Moyenne sur ' + n + ' jour' + (n > 1 ? 's' : '') + ' de suivi · ' + (period || 4) + ' dernières semaines'));
    return s;
  }

  // ─── RENDER ACTIVITÉ SPORT ───
  function _renderActivity(period) {
    var sh = _getSessionHistory();
    var s = section('Activité sport', 'Volume');
    var cutoff = _weeksAgo(period || 4);
    var keys = Object.keys(sh).filter(function(k) { return k >= cutoff; });
    if (!keys.length) {
      s.appendChild(h('div', { style: ST.sub }, 'Aucune séance validée sur les ' + (period || 4) + ' dernières semaines.'));
      return s;
    }
    var totalKcal = 0, totalMin = 0;
    keys.forEach(function(k) {
      var e = sh[k];
      if (!e) return;
      totalKcal += Number(e.kcalTotal) || 0;
      totalMin += Number(e.duration) || 0;
    });
    s.appendChild(h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;' }, [
      h('div', { style: 'flex:1;min-width:100px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Séances'),
        h('div', { style: ST.value }, keys.length)
      ]),
      h('div', { style: 'flex:1;min-width:100px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Kcal brûlées'),
        h('div', { style: ST.value }, Math.round(totalKcal))
      ]),
      h('div', { style: 'flex:1;min-width:100px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Durée totale'),
        h('div', { style: ST.value }, Math.round(totalMin) + ' min')
      ])
    ]));
    return s;
  }

  // ─── RENDER STREAKS & BADGES ───
  function _renderStreaks() {
    var streak = _getStreak();
    var badges = _getBadges();
    var badgeCount = Object.keys(badges).filter(function(k) { return badges[k]; }).length;
    var s = section('Régularité', 'Gamification');
    s.appendChild(h('div', { style: 'display:flex;gap:24px;flex-wrap:wrap;' }, [
      h('div', { style: 'flex:1;min-width:120px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Série en cours'),
        h('div', { style: ST.value }, streak),
        h('div', { style: ST.sub }, 'jour' + (streak > 1 ? 's' : '') + ' consécutif' + (streak > 1 ? 's' : ''))
      ]),
      h('div', { style: 'flex:1;min-width:120px;' }, [
        h('div', { style: ST.sub + 'margin-bottom:2px;' }, 'Badges débloqués'),
        h('div', { style: ST.value }, badgeCount)
      ])
    ]));
    return s;
  }

  // ─── PERIOD SELECTOR ───
  function _renderPeriodSelector(currentPeriod, onChange) {
    var row = h('div', { style: 'display:flex;gap:8px;margin-bottom:16px;' });
    [4, 8, 12].forEach(function(w) {
      var isActive = w === currentPeriod;
      var btn = h('button', {
        type: 'button',
        style: 'flex:1;padding:10px 4px;min-height:44px;cursor:pointer;border:1px solid var(--line,#D8D8D0);'
          + 'background:' + (isActive ? 'var(--black,#0A0A09)' : 'transparent') + ';'
          + 'color:' + (isActive ? 'var(--ivory,#FAF9F6)' : 'var(--black,#0A0A09)') + ';'
          + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;'
          + 'border-radius:2px;transition:background 0.18s ease,color 0.18s ease;'
      }, w + ' semaines');
      btn.addEventListener('click', function() { onChange(w); });
      row.appendChild(btn);
    });
    return row;
  }

  // ─── RENDER PRINCIPAL ───
  function render(container) {
    if (!container) return;
    container.innerHTML = '';
    var S = window.S || {};

    // Initialiser la période (mémorisée sur S)
    if (!S._analyticsPeriod) S._analyticsPeriod = 4;
    var period = S._analyticsPeriod;

    // Eyebrow + titre
    container.appendChild(h('div', { style: ST.eyebrow + 'margin-top:8px;' }, 'Progrès — vue d\'ensemble'));
    container.appendChild(h('h1', {
      style: 'font-family:Georgia,serif;font-size:28px;font-weight:normal;margin:0 0 4px;color:var(--black,#0A0A09);letter-spacing:-0.01em;line-height:1.15;'
    }, 'Votre progression'));
    container.appendChild(h('p', {
      style: ST.sub + 'margin:0 0 20px;'
    }, 'Tendances, records et volumes sur les dernières semaines.'));

    // Sélecteur période
    container.appendChild(_renderPeriodSelector(period, function(newP) {
      S._analyticsPeriod = newP;
      render(container);
    }));

    // Sections
    container.appendChild(_renderWeight(period));
    container.appendChild(_renderActivity(period));
    container.appendChild(_renderNutrition(period));
    container.appendChild(_renderForce());
    container.appendChild(_renderRunning(period));
    container.appendChild(_renderStreaks());

    // Footer discret
    container.appendChild(h('p', {
      style: ST.sub + 'text-align:center;margin-top:20px;padding-top:12px;border-top:1px solid var(--line,#D8D8D0);font-style:italic;'
    }, 'Les données affichées proviennent de vos séances et repas enregistrés.'));
  }

  // ─── EXPORT ───
  window.ANALYTICS = {
    render: render,
    // Helpers exposés pour debug/tests
    _getWeightHistory: _getWeightHistory,
    _getSessionHistory: _getSessionHistory,
    _getMuscuStrength: _getMuscuStrength,
    _calcDelta: _calcDelta
  };
})();
