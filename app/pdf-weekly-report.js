/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
// pdf-weekly-report.js — Export PDF du rapport hebdomadaire SmartFitCoach.
// POLISH 2026-04 (audit designer luxe 6.5→9.5/10) :
// - Typographie amplifiée (titres Times 14pt italic bold, values Times 13pt bold)
// - Header avec relief (filet d'accent vert sous titre + monogramme SFC)
// - Records en grille 2 colonnes (VIP content)
// - Spacing section rythmé
// - Footer watermark discret
(function() {
'use strict';

// Layout A4 (mm)
var W = 210, H = 297, M = 15, CW = W - 2 * M;

// Palette (RGB triplets)
var ivory  = [250, 250, 247];
var black  = [10, 10, 9];
var grey   = [107, 107, 101];
var grey2  = [160, 160, 152];
var green  = [26, 74, 26];
var orange = [106, 74, 26];
var red    = [90, 16, 16];

function color(doc, fn, rgb) {
  if (fn === 'fill') doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  else if (fn === 'text') doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  else if (fn === 'draw') doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function fmtDate(iso) {
  if (!iso) return '';
  var s = String(iso).slice(0, 10);
  var p = s.split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
}

// Section title — FIX audit luxe : Times 14pt italic bold (vs 7pt UPPERCASE)
// Plus éditorial, plus d'autorité, lisible à 2m.
function sectionTitle(doc, y, title) {
  color(doc, 'text', black);
  doc.setFont('times', 'italic'); doc.setFontSize(14);
  doc.text(String(title), M, y);
  // Double-ligne éditoriale (fine + accent)
  color(doc, 'draw', grey);
  doc.setLineWidth(0.2);
  doc.line(M, y + 2.2, M + CW, y + 2.2);
  color(doc, 'draw', green);
  doc.setLineWidth(0.6);
  doc.line(M, y + 2.2, M + 18, y + 2.2); // accent vert court
  return y + 9;
}

// KvLine — FIX audit luxe : value en Times 13pt bold (vs 10pt normal)
// Data chiffrée pèse visuellement comme dans les rapports Apple/Whoop.
function kvLine(doc, y, label, value, opts) {
  opts = opts || {};
  color(doc, 'text', grey);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(String(label), M, y);
  color(doc, 'text', opts.valueColor || black);
  if (opts.emphasis === false) {
    doc.setFont('times', 'normal'); doc.setFontSize(10);
  } else {
    doc.setFont('times', 'bold'); doc.setFontSize(13);
  }
  var txt = String(value);
  var w = doc.getTextWidth(txt);
  doc.text(txt, M + CW - w, y);
  return y + 8; // +8mm (rythme aéré, était 6)
}

// Pair cell pour grille 2 colonnes (Records)
function gridCell(doc, x, y, colWidth, label, value, detail) {
  color(doc, 'text', grey);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text(String(label).toUpperCase(), x, y);
  color(doc, 'text', black);
  doc.setFont('times', 'bold'); doc.setFontSize(14);
  var valTxt = String(value);
  // Tronquer si trop long pour colonne
  var maxW = colWidth - 4;
  while (doc.getTextWidth(valTxt) > maxW && valTxt.length > 1) {
    valTxt = valTxt.slice(0, -1);
  }
  doc.text(valTxt, x, y + 6.5);
  if (detail) {
    color(doc, 'text', grey2);
    doc.setFont('times', 'italic'); doc.setFontSize(8);
    var detailLines = doc.splitTextToSize(String(detail), maxW);
    doc.text(detailLines, x, y + 11);
    return y + 11 + detailLines.length * 3;
  }
  return y + 12;
}

function checkPage(doc, y) {
  if (y > 270) { doc.addPage(); return 22; }
  return y;
}

window.exportWeeklyReportPDF = function() {
  try {
    if (window.isPremium && !window.isPremium()) {
      if (window.showPaywall) window.showPaywall('pdf');
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? 'Loading PDF…' : 'Chargement du PDF…'), 'info', 2000);
      if (window._lazyLoad) { window._lazyLoad('./jspdf.umd.min.js', window.exportWeeklyReportPDF); }
      return;
    }
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    var S = window.S || {};

    // ═══ HEADER ═══
    // Fond noir + monogramme SFC + titre éditorial + filet d'accent vert
    color(doc, 'fill', black);
    doc.rect(0, 0, W, 46, 'F');

    // Monogramme "SFC" haut-droit (cercle subtil)
    color(doc, 'draw', ivory);
    doc.setLineWidth(0.4);
    doc.circle(W - M - 5, 11, 5, 'S');
    color(doc, 'text', ivory);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('SFC', W - M - 5, 12.5, { align: 'center' });

    // Eyebrow
    color(doc, 'text', ivory);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('SMART FIT COACH', M, 12);
    // Filet gris sous eyebrow
    color(doc, 'draw', grey2);
    doc.setLineWidth(0.2);
    doc.line(M, 14, M + 40, 14);

    // Titre principal — Times 22pt italic (plus impact)
    doc.setFont('times', 'italic'); doc.setFontSize(22);
    doc.text((window.isEnglish && window.isEnglish() ? 'Weekly report' : 'Rapport hebdomadaire'), M, 26);

    // Filet d'accent vert sous titre (marque visuelle)
    color(doc, 'draw', green);
    doc.setLineWidth(1);
    doc.line(M, 30, M + 22, 30);

    // Sous-titre : prénom + date longue
    color(doc, 'text', ivory);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    var prenom = (typeof window.getDisplayFirstName === 'function') ? window.getDisplayFirstName() : (S.prenom || '');
    var dateStr = (typeof window.formatDate === 'function') ? window.formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString(S.lang === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    doc.text((prenom ? prenom + '  ·  ' : '') + dateStr, M, 38);

    var y = 58;

    // ═══ 1. PROFIL ═══
    y = sectionTitle(doc, y, (_pdfEN ? 'Profile' : 'Profil'));
    var _pdfEN = S.lang === 'en';
    if (S.sex) y = kvLine(doc, y, _pdfEN ? 'Sex' : 'Sexe', window.isMale(S) ? (_pdfEN ? 'Male' : 'Homme') : (_pdfEN ? 'Female' : 'Femme'), { emphasis: false });
    if (S.age) y = kvLine(doc, y, _pdfEN ? 'Age' : 'Âge', S.age + (_pdfEN ? ' years' : ' ans'), { emphasis: false });
    if (S.weight) y = kvLine(doc, y, _pdfEN ? 'Current weight' : 'Poids actuel', S.weight + ' kg');
    if (S.height) y = kvLine(doc, y, _pdfEN ? 'Height' : 'Taille', S.height + ' cm', { emphasis: false });
    if (window.GOALS && typeof S.goal === 'number' && window.GOALS[S.goal]) {
      y = kvLine(doc, y, (_pdfEN ? 'Goal' : 'Objectif'), window.GOALS[S.goal].label || window.GOALS[S.goal].key || '—', { emphasis: false });
    }
    y += 5;

    // ═══ 2. OBJECTIFS SEMAINE ═══
    y = checkPage(doc, y);
    y = sectionTitle(doc, y, (_pdfEN ? 'Weekly goals' : 'Objectifs de la semaine'));
    var goals = (typeof window.getWeeklyGoalsProgress === 'function') ? window.getWeeklyGoalsProgress() : null;
    if (goals) {
      function pctColor(pct, low, high) {
        if (pct === null) return black;
        if (low !== undefined && pct < low) return orange;
        if (high !== undefined && pct > high) return orange;
        return green;
      }
      if (goals.sessions) {
        var sessTxt = goals.sessions.done + ' / ' + (goals.sessions.planned || '—') + (goals.sessions.pct !== null ? '   ' + goals.sessions.pct + '%' : '');
        y = kvLine(doc, y, (_pdfEN ? 'Sessions' : 'Séances'), sessTxt, { valueColor: pctColor(goals.sessions.pct, 50) });
      }
      if (goals.kcalAvg) {
        var kPct = goals.kcalAvg.pct;
        var kDiff = kPct !== null ? Math.abs(kPct - 100) : null;
        var kCol = kDiff === null ? black : (kDiff > 25 ? red : (kDiff > 10 ? orange : green));
        var kTxt = goals.kcalAvg.current + ' / ' + (goals.kcalAvg.target || '—') + ' kcal' + (kPct !== null ? '   ' + kPct + '%' : '');
        y = kvLine(doc, y, (_pdfEN ? 'Calories (avg 7d)' : 'Calories (moy. 7j)'), kTxt, { valueColor: kCol });
      }
      if (goals.proteinAvg) {
        var pTxt = goals.proteinAvg.current + ' / ' + (goals.proteinAvg.target || '—') + ' g' + (goals.proteinAvg.pct !== null ? '   ' + goals.proteinAvg.pct + '%' : '');
        y = kvLine(doc, y, (_pdfEN ? 'Protein (avg 7d)' : 'Protéines (moy. 7j)'), pTxt, { valueColor: pctColor(goals.proteinAvg.pct, 80) });
      }
      if (goals.wellnessLogged) {
        y = kvLine(doc, y, (_pdfEN ? 'Wellness logged' : 'Bilan forme loggés'), goals.wellnessLogged.count + ' / 7 j   ' + goals.wellnessLogged.pct + '%', { valueColor: pctColor(goals.wellnessLogged.pct, 50) });
      }
    } else {
      color(doc, 'text', grey);
      doc.setFont('times', 'italic'); doc.setFontSize(10);
      doc.text((_pdfEN ? 'No data available for this week.' : 'Aucune donnée disponible pour cette semaine.'), M, y);
      y += 8;
    }
    y += 5;

    // ═══ 3. BILAN 7 JOURS ═══
    y = checkPage(doc, y);
    y = sectionTitle(doc, y, (_pdfEN ? '7-day summary' : 'Bilan 7 jours'));
    var ws = (typeof window.getWeekSessionsSummary === 'function') ? window.getWeekSessionsSummary() : null;
    var wAvg = (typeof window.getWellnessAvg === 'function') ? window.getWellnessAvg(7) : null;
    var wperf = (typeof window.getWeekPerformanceSummary === 'function') ? window.getWeekPerformanceSummary() : null;
    if (ws) {
      y = kvLine(doc, y, (_pdfEN ? 'Sessions completed' : 'Séances effectuées'), ws.sessions + '   (' + ws.daysActive + (_pdfEN ? ' active days)' : ' jours actifs)'));
      if (ws.kcalTotal > 0) y = kvLine(doc, y, (_pdfEN ? 'Kcal burned' : 'Kcal dépensées'), window.formatNumber(ws.kcalTotal) + ' kcal');
      if (ws.durationTotal > 0) y = kvLine(doc, y, (_pdfEN ? 'Total time' : 'Temps total'), ws.durationTotal + ' min');
    }
    if (wAvg && wAvg.sleepAvg !== null) {
      y = kvLine(doc, y, (_pdfEN ? 'Average sleep' : 'Sommeil moyen'), wAvg.sleepAvg + ' / 5');
    }
    if (wperf && typeof wperf.rpeAvg === 'number') {
      y = kvLine(doc, y, (_pdfEN ? 'Average RPE' : 'RPE moyen'), wperf.rpeAvg + ' / 10');
    }
    y += 5;

    // ═══ 4. SIGNAUX DÉTECTÉS ═══
    y = checkPage(doc, y);
    var patterns = (typeof window.detectWeekPatterns === 'function') ? window.detectWeekPatterns() : [];
    if (Array.isArray(patterns) && patterns.length > 0) {
      y = sectionTitle(doc, y, (_pdfEN ? 'Detected signals' : 'Signaux détectés'));
      patterns.slice(0, 5).forEach(function(p) {
        y = checkPage(doc, y);
        var rgbMap = { info: green, warning: orange, alert: red };
        var col = rgbMap[p.severity] || grey;
        // Marqueur couleur plus généreux (3×3 au lieu de 2×2.5)
        color(doc, 'fill', col);
        doc.rect(M, y - 3, 2.5, 3, 'F');
        color(doc, 'text', black);
        doc.setFont('times', 'bold'); doc.setFontSize(11);
        doc.text(String(p.label || p.id || ''), M + 5, y);
        y += 5;
        if (p.advice) {
          color(doc, 'text', grey);
          doc.setFont('times', 'italic'); doc.setFontSize(9);
          var lines = doc.splitTextToSize(String(p.advice), CW - 5);
          doc.text(lines, M + 5, y);
          y += lines.length * 4;
        }
        y += 4;
      });
      y += 3;
    }

    // ═══ 5. RECORDS PERSONNELS (GRILLE 2 COLONNES) ═══
    y = checkPage(doc, y);
    var records = (typeof window.getPersonalRecords === 'function') ? window.getPersonalRecords() : null;
    if (records) {
      y = sectionTitle(doc, y, (_pdfEN ? 'Personal records' : 'Records personnels'));
      // Grille 2 colonnes — chaque cell 85mm (colWidth)
      var colWidth = (CW - 10) / 2; // 10mm gouttière
      var colX1 = M;
      var colX2 = M + colWidth + 10;
      var cells = []; // { label, value, detail }

      if (Array.isArray(records.maxLifts)) {
        records.maxLifts.forEach(function(lift) {
          var d = [];
          if (lift.reps) d.push(lift.reps + ' reps');
          if (lift.oneRepMax) d.push('1RM ≈ ' + lift.oneRepMax + ' kg');
          if (lift.date) d.push(fmtDate(lift.date));
          cells.push({ label: lift.exercise, value: lift.weight + ' kg', detail: d.join(' · ') });
        });
      }
      if (records.weightMilestone) {
        cells.push({
          label: records.weightMilestone.goalLabel,
          value: records.weightMilestone.weight + ' kg',
          detail: records.weightMilestone.date ? fmtDate(records.weightMilestone.date) : null
        });
      } else if (records.weightRange) {
        cells.push({
          label: (_pdfEN ? 'Weight range' : 'Plage de poids'),
          value: records.weightRange.min + '–' + records.weightRange.max + ' kg',
          detail: null
        });
      }
      if (records.longestSession) {
        var lsD = [];
        if (records.longestSession.kcalTotal) lsD.push(records.longestSession.kcalTotal + ' kcal');
        if (records.longestSession.date) lsD.push(fmtDate(records.longestSession.date));
        cells.push({
          label: (_pdfEN ? 'Longest session' : 'Séance la plus longue'),
          value: records.longestSession.duration + ' min',
          detail: lsD.join(' · ')
        });
      }
      if (typeof records.maxStreak === 'number' && records.maxStreak > 0) {
        cells.push({
          label: (_pdfEN ? 'Longest streak' : 'Plus longue série'),
          value: records.maxStreak + ' ' + window.locPlural(records.maxStreak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}),
          detail: (_pdfEN ? 'Consecutive days' : 'Jours consécutifs')
        });
      }

      // Rendu en 2 colonnes (row by row)
      for (var ri = 0; ri < cells.length; ri += 2) {
        y = checkPage(doc, y);
        var rowStartY = y;
        var y1 = gridCell(doc, colX1, y, colWidth, cells[ri].label, cells[ri].value, cells[ri].detail);
        var y2 = y;
        if (cells[ri + 1]) {
          y2 = gridCell(doc, colX2, y, colWidth, cells[ri + 1].label, cells[ri + 1].value, cells[ri + 1].detail);
        }
        y = Math.max(y1, y2) + 6; // gap row
      }
      y += 3;
    }

    // ═══ 5b. TENDANCE NUTRITION 30J (P1 audit) ═══
    y = checkPage(doc, y);
    var nutTrend = (typeof window.getNutritionTrend === 'function') ? window.getNutritionTrend(30) : null;
    if (nutTrend && nutTrend.loggedDays >= 3) {
      y = sectionTitle(doc, y, (_pdfEN ? 'Nutrition 30 days' : 'Nutrition 30 jours'));
      var kcalVals = (Array.isArray(nutTrend.kcal) ? nutTrend.kcal : []).filter(function(v) { return typeof v === 'number'; });
      var kcalAvg = kcalVals.length ? Math.round(kcalVals.reduce(function(a,b){return a+b;}, 0) / kcalVals.length) : null;
      var pVals = (Array.isArray(nutTrend.protein) ? nutTrend.protein : []).filter(function(v) { return typeof v === 'number'; });
      var pAvg = pVals.length ? Math.round(pVals.reduce(function(a,b){return a+b;}, 0) / pVals.length) : null;
      var tgtKcal = (nutTrend.targets && nutTrend.targets.kcal) ? nutTrend.targets.kcal : null;
      var tgtP = (nutTrend.targets && nutTrend.targets.p) ? nutTrend.targets.p : null;
      if (kcalAvg !== null) {
        y = kvLine(doc, y, (_pdfEN ? 'Avg Kcal (30d)' : 'Kcal moyennes (30j)'),
          window.formatNumber(kcalAvg) + (tgtKcal ? ' / ' + window.formatNumber(tgtKcal) + ' kcal' : ' kcal'));
      }
      if (pAvg !== null) {
        y = kvLine(doc, y, (_pdfEN ? 'Avg Protein (30d)' : 'Protéines moyennes (30j)'),
          pAvg + ' g' + (tgtP ? ' / ' + tgtP + ' g' : ''));
      }
      y = kvLine(doc, y, (_pdfEN ? 'Days logged' : 'Jours loggés'), nutTrend.loggedDays + ' / 30 j', { emphasis: false });
      y += 5;
    }

    // ═══ 5c. PROGRESSION CHARGES 30J (P1 audit) ═══
    y = checkPage(doc, y);
    var strengthTrend = (typeof window.getStrengthTrend === 'function') ? window.getStrengthTrend(30) : null;
    if (strengthTrend && Array.isArray(strengthTrend.datasets) && strengthTrend.datasets.length > 0) {
      y = sectionTitle(doc, y, (_pdfEN ? 'Weight progression 30 days' : 'Progression charges 30 jours'));
      strengthTrend.datasets.forEach(function(ds) {
        y = checkPage(doc, y);
        var deltaTxt = '—';
        var deltaCol = grey;
        if (typeof ds.lastValue === 'number' && typeof ds.firstValue === 'number') {
          var delta = ds.lastValue - ds.firstValue;
          var deltaPct = ds.firstValue > 0 ? (delta / ds.firstValue) * 100 : null;
          var sign = delta > 0 ? '+' : '';
          deltaTxt = ds.lastValue + ' kg   ' + sign + delta.toFixed(1) + ' kg' + (deltaPct !== null ? ' (' + sign + deltaPct.toFixed(1) + '%)' : '');
          deltaCol = (delta > 0) ? green : (delta < 0 ? red : grey);
        }
        y = kvLine(doc, y, ds.name, deltaTxt, { valueColor: deltaCol });
      });
      y += 5;
    }

    // ═══ 5d. CROSSFIT — 1RM + CYCLES (FIX P1 audit user Karim — avant: PDF CF-blind) ═══
    try {
      var _S = window.S || {};
      var isCFUser = _S.sportType === 'crossfit' || _S.sport === 'crossfit';
      if (isCFUser && _S.crossfit1RM && Object.keys(_S.crossfit1RM).length > 0) {
        y = checkPage(doc, y);
        y = sectionTitle(doc, y, 'CrossFit — Records 1RM');
        var lifts = window.CF_1RM_LIFTS || [];
        var levelLabel = _S.crossfitLevel === 'scaled' ? 'Scaled' : _S.crossfitLevel === 'inter' ? 'Intermediate'
                       : _S.crossfitLevel === 'rx' ? 'RX' : _S.crossfitLevel === 'rx_plus' ? 'RX+' : 'Intermediate';
        y = kvLine(doc, y, (_pdfEN ? 'Level' : 'Niveau'), levelLabel);
        lifts.forEach(function(lift) {
          var v = _S.crossfit1RM[lift.key];
          if (typeof v === 'number' && v > 0) {
            y = checkPage(doc, y);
            y = kvLine(doc, y, lift.name, v + ' kg');
          }
        });
        // Cycle haltéro en cours — dérivé depuis HALTERO_CYCLES si pas stocké (audit backend fix).
        var _cycleWk = _S.cfHalteroCycleWeek;
        if (!_cycleWk && window.HALTERO_CYCLES && typeof window.HALTERO_CYCLES.getCurrentCycle === 'function' && typeof _S.crossfitWeek === 'number') {
          try { var _info = window.HALTERO_CYCLES.getCurrentCycle(_S.crossfitWeek); _cycleWk = _info && _info.weekInCycle; } catch(_e) {}
        }
        if (_cycleWk) {
          y = checkPage(doc, y);
          y = kvLine(doc, y, (_pdfEN ? 'Weightlifting cycle' : 'Cycle haltérophilie'), (_pdfEN ? 'Week ' : 'Semaine ') + _cycleWk + ' / 6');
        }
        y += 5;
      }
    } catch(e) { console.warn('[PDF CF section]', e); }

    // ═══ 5e. SECTION MUSCULATION — Records 1RM (FIX SPRINT P2.11) ═══
    // Symétrique avec section CrossFit. Avant : muscu sous-représenté dans le PDF.
    try {
      var _SM = window.S || {};
      var isMuscuPure = _SM.sportType === 'muscu' || _SM.sportType === 'musculation';
      if (isMuscuPure && _SM.muscuStrengthProfile && Object.keys(_SM.muscuStrengthProfile).length > 0) {
        y = checkPage(doc, y);
        y = sectionTitle(doc, y, (_pdfEN ? 'Weight training — 1RM records' : 'Musculation — Records 1RM'));
        var KEY_LIFTS_PDF = [
          { key: 'bench_press',     name: (_pdfEN ? 'Bench press' : 'Développé couché') },
          { key: 'squat',           name: 'Squat' },
          { key: 'deadlift',        name: 'Deadlift' },
          { key: 'overhead_press',  name: (_pdfEN ? 'Overhead press' : 'Développé militaire') },
          { key: 'barbell_row',     name: (_pdfEN ? 'Barbell row' : 'Rowing barre') },
          { key: 'hip_thrust',      name: 'Hip thrust' }
        ];
        var levelLabelM = _SM.sportLevel === 'beginner' ? (_pdfEN ? 'Beginner' : 'Débutant')
                        : _SM.sportLevel === 'intermediate' ? (_pdfEN ? 'Intermediate' : 'Intermédiaire')
                        : _SM.sportLevel === 'advanced' ? (_pdfEN ? 'Advanced' : 'Avancé')
                        : _SM.sportLevel === 'pro' ? 'Pro' : (_pdfEN ? 'Intermediate' : 'Intermédiaire');
        y = kvLine(doc, y, (_pdfEN ? 'Level' : 'Niveau'), levelLabelM);
        if (typeof _SM.muscuWeek === 'number') {
          y = checkPage(doc, y);
          y = kvLine(doc, y, (_pdfEN ? 'Current week' : 'Semaine actuelle'), (_pdfEN ? 'Week ' : 'Semaine ') + _SM.muscuWeek + ' / 12');
        }
        KEY_LIFTS_PDF.forEach(function(lift) {
          var weight = _SM.muscuStrengthProfile[lift.key];
          if (typeof weight === 'number' && weight > 0) {
            var reps = _SM.muscuStrengthProfile[lift.key + '_reps'] || 8;
            var oneRM = Math.round(weight * (1 + reps / 30));
            y = checkPage(doc, y);
            y = kvLine(doc, y, lift.name, weight + ' kg × ' + reps + '  →  1RM ' + oneRM + ' kg');
          }
        });
        // Tonnage hebdo si le helper existe
        if (typeof window.getWeeklyTonnage === 'function') {
          var wt = window.getWeeklyTonnage(7);
          if (wt && wt.tonnage > 0) {
            y = checkPage(doc, y);
            y = kvLine(doc, y, (_pdfEN ? 'Tonnage 7 days' : 'Tonnage 7 jours'), wt.tonnage + ' kg (' + wt.sets + (_pdfEN ? ' sets)' : ' séries)'));
          }
        }
        y += 5;
      }
    } catch(e) { console.warn('[PDF Muscu section]', e); }

    // ═══ 6. FOOTER — DISCLAIMER + WATERMARK ═══
    y = checkPage(doc, y);
    y += 4;
    color(doc, 'draw', grey2);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + CW, y);
    y += 5;
    color(doc, 'text', grey);
    doc.setFont('times', 'italic'); doc.setFontSize(8);
    var disclaimerLines = doc.splitTextToSize(
      (_pdfEN
        ? 'This report is generated for informational and educational purposes. It does not replace the advice of a doctor or qualified health professional. Consult a professional in case of doubt, persistent pain, or pathology.'
        : 'Ce rapport est généré à titre informatif et pédagogique. Il ne remplace pas l\'avis d\'un médecin ou d\'un professionnel de santé qualifié. Consulte un pro en cas de doute, de douleur persistante ou de pathologie.'),
      CW
    );
    doc.text(disclaimerLines, M, y);
    y += disclaimerLines.length * 3.5 + 2;

    // Footer watermark : chaque page — "Smart Fit Coach" + date + pagination
    var pageCount = doc.internal.getNumberOfPages();
    for (var pi = 1; pi <= pageCount; pi++) {
      doc.setPage(pi);
      color(doc, 'draw', grey2);
      doc.setLineWidth(0.2);
      doc.line(M, 286, M + CW, 286);
      color(doc, 'text', grey);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('Smart Fit Coach', M, 291);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5);
      doc.text((typeof window.formatDate === 'function') ? window.formatDate(new Date(), { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString(S.lang === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), M, 294.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      var pn = pi + ' / ' + pageCount;
      var pnW = doc.getTextWidth(pn);
      doc.text(pn, W - M - pnW, 291);
    }

    // Nom fichier
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var dateStrFile = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
    doc.save('smartfitcoach-rapport-hebdo-' + dateStrFile + '.pdf');
  } catch(e) {
    console.error('[exportWeeklyReportPDF] Erreur:', e);
    if (window.showToast) window.showToast((window.isEnglish && window.isEnglish() ? 'Error generating the PDF. Please retry or contact support.' : 'Erreur lors de la g\u00e9n\u00e9ration du PDF. R\u00e9essayez ou contactez le support.'), 'error', 4500);
  }
};

})();
