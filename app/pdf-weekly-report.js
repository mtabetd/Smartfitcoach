/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
// pdf-weekly-report.js — Export PDF du rapport hebdomadaire SmartFitCoach.
// POLISH 2026-04 : exploite tous les helpers ajoutés récemment
// (getWeekSessionsSummary, getWellnessAvg, getPersonalRecords,
//  getNutritionTrend, getWeeklyGoalsProgress, detectWeekPatterns)
// pour générer un rapport personnalisé A4 clean style SmartFitCoach.
(function() {
'use strict';

// Layout A4 (mm) — cohérent avec exportSportPDF/exportDayPDF existants
var W = 210, H = 297, M = 15, CW = W - 2 * M;

// Palette (RGB triplets)
var ivory = [250, 250, 247];
var black = [10, 10, 9];
var grey  = [107, 107, 101];
var grey2 = [160, 160, 152];
var green = [26, 74, 26];
var orange = [106, 74, 26];
var red   = [90, 16, 16];

function color(doc, fn, rgb) {
  if (fn === 'fill') doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  else if (fn === 'text') doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  else if (fn === 'draw') doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

// Formate date ISO → "jj/mm/aaaa" (fail-safe)
function fmtDate(iso) {
  if (!iso) return '';
  var s = String(iso).slice(0, 10);
  var p = s.split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
}

// Place un titre de section + ligne sous titre
function section(doc, y, title) {
  color(doc, 'text', black);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text(String(title).toUpperCase(), M, y);
  color(doc, 'draw', black);
  doc.setLineWidth(0.3);
  doc.line(M, y + 1.5, M + CW, y + 1.5);
  return y + 7;
}

// Ligne "label : value" — label en gris, value en noir
function kvLine(doc, y, label, value) {
  color(doc, 'text', grey);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(String(label), M, y);
  color(doc, 'text', black);
  doc.setFont('times', 'normal'); doc.setFontSize(10);
  // Align value à droite
  var txt = String(value);
  var w = doc.getTextWidth(txt);
  doc.text(txt, M + CW - w, y);
  return y + 6;
}

// Check pagination : si on dépasse, add page
function checkPage(doc, y) {
  if (y > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

window.exportWeeklyReportPDF = function() {
  try {
    // Premium gate
    if (window.isPremium && !window.isPremium()) {
      if (window.showPaywall) window.showPaywall('pdf');
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF non disponible. Rechargez la page.');
      return;
    }
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    var S = window.S || {};

    // ═══ HEADER ═══
    color(doc, 'fill', black);
    doc.rect(0, 0, W, 40, 'F');
    color(doc, 'text', ivory);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('SMART FIT COACH', M, 12);
    doc.setFont('times', 'italic'); doc.setFontSize(20);
    doc.text('Rapport hebdomadaire', M, 24);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    var prenom = (typeof window.getDisplayFirstName === 'function') ? window.getDisplayFirstName() : (S.prenom || '');
    var dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    doc.text((prenom ? prenom + '  |  ' : '') + dateStr, M, 32);
    var y = 48;

    // ═══ 1. PROFIL RÉSUMÉ ═══
    y = section(doc, y, 'Profil');
    var profileLines = [];
    if (S.sex) profileLines.push(['Sexe', S.sex === 'homme' ? 'Homme' : 'Femme']);
    if (S.age) profileLines.push(['Âge', S.age + ' ans']);
    if (S.weight) profileLines.push(['Poids actuel', S.weight + ' kg']);
    if (S.height) profileLines.push(['Taille', S.height + ' cm']);
    if (window.GOALS && typeof S.goal === 'number' && window.GOALS[S.goal]) {
      profileLines.push(['Objectif', window.GOALS[S.goal].label || window.GOALS[S.goal].key || '—']);
    }
    profileLines.forEach(function(kv) { y = kvLine(doc, y, kv[0], kv[1]); });
    y += 3;

    // ═══ 2. OBJECTIFS SEMAINE ═══
    y = checkPage(doc, y);
    y = section(doc, y, 'Objectifs de la semaine');
    var goals = (typeof window.getWeeklyGoalsProgress === 'function') ? window.getWeeklyGoalsProgress() : null;
    if (goals) {
      if (goals.sessions) {
        y = kvLine(doc, y, 'Séances', goals.sessions.done + ' / ' + (goals.sessions.planned || '—') + (goals.sessions.pct !== null ? '  (' + goals.sessions.pct + '%)' : ''));
      }
      if (goals.kcalAvg) {
        y = kvLine(doc, y, 'Calories (moy. 7j)', goals.kcalAvg.current + ' / ' + (goals.kcalAvg.target || '—') + ' kcal' + (goals.kcalAvg.pct !== null ? '  (' + goals.kcalAvg.pct + '%)' : ''));
      }
      if (goals.proteinAvg) {
        y = kvLine(doc, y, 'Protéines (moy. 7j)', goals.proteinAvg.current + ' / ' + (goals.proteinAvg.target || '—') + ' g' + (goals.proteinAvg.pct !== null ? '  (' + goals.proteinAvg.pct + '%)' : ''));
      }
      if (goals.wellnessLogged) {
        y = kvLine(doc, y, 'Bilan forme loggés', goals.wellnessLogged.count + ' / 7 j  (' + goals.wellnessLogged.pct + '%)');
      }
    } else {
      color(doc, 'text', grey);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
      doc.text('Aucune donnée disponible pour cette semaine.', M, y);
      y += 6;
    }
    y += 3;

    // ═══ 3. BILAN 7 JOURS ═══
    y = checkPage(doc, y);
    y = section(doc, y, 'Bilan 7 jours');
    var ws = (typeof window.getWeekSessionsSummary === 'function') ? window.getWeekSessionsSummary() : null;
    var wAvg = (typeof window.getWellnessAvg === 'function') ? window.getWellnessAvg(7) : null;
    var wperf = (typeof window.getWeekPerformanceSummary === 'function') ? window.getWeekPerformanceSummary() : null;
    if (ws) {
      y = kvLine(doc, y, 'Séances effectuées', ws.sessions + '  (' + ws.daysActive + ' jours actifs)');
      if (ws.kcalTotal > 0) y = kvLine(doc, y, 'Kcal dépensées', ws.kcalTotal.toLocaleString('fr-FR') + ' kcal');
      if (ws.durationTotal > 0) y = kvLine(doc, y, 'Temps total', ws.durationTotal + ' min');
    }
    if (wAvg && wAvg.sleepAvg !== null) {
      y = kvLine(doc, y, 'Sommeil moyen', wAvg.sleepAvg + ' / 5');
    }
    if (wperf && typeof wperf.rpeAvg === 'number') {
      y = kvLine(doc, y, 'RPE moyen', wperf.rpeAvg + ' / 10');
    }
    y += 3;

    // ═══ 4. PATTERNS DÉTECTÉS ═══
    y = checkPage(doc, y);
    var patterns = (typeof window.detectWeekPatterns === 'function') ? window.detectWeekPatterns() : [];
    if (Array.isArray(patterns) && patterns.length > 0) {
      y = section(doc, y, 'Signaux détectés');
      patterns.slice(0, 5).forEach(function(p) {
        y = checkPage(doc, y);
        var rgbMap = { info: green, warning: orange, alert: red };
        var col = rgbMap[p.severity] || grey;
        // Petit carré couleur + label
        color(doc, 'fill', col);
        doc.rect(M, y - 2.5, 2, 2.5, 'F');
        color(doc, 'text', black);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(String(p.label || p.id || ''), M + 4, y);
        y += 4;
        if (p.advice) {
          color(doc, 'text', grey);
          doc.setFont('times', 'italic'); doc.setFontSize(8);
          // Wrap conseil sur plusieurs lignes si long (max 100 chars/ligne A4)
          var lines = doc.splitTextToSize(String(p.advice), CW - 4);
          doc.text(lines, M + 4, y);
          y += lines.length * 3.5;
        }
        y += 3;
      });
    }
    y += 2;

    // ═══ 5. RECORDS PERSONNELS ═══
    y = checkPage(doc, y);
    var records = (typeof window.getPersonalRecords === 'function') ? window.getPersonalRecords() : null;
    if (records) {
      y = section(doc, y, 'Records personnels');
      if (Array.isArray(records.maxLifts)) {
        records.maxLifts.forEach(function(lift) {
          y = checkPage(doc, y);
          var detail = lift.weight + ' kg';
          if (lift.reps) detail += ' × ' + lift.reps + ' reps';
          if (lift.oneRepMax) detail += '  (1RM ≈ ' + lift.oneRepMax + ' kg)';
          y = kvLine(doc, y, lift.exercise, detail);
        });
      }
      if (records.weightMilestone) {
        y = kvLine(doc, y, records.weightMilestone.goalLabel, records.weightMilestone.weight + ' kg' + (records.weightMilestone.date ? '  (' + fmtDate(records.weightMilestone.date) + ')' : ''));
      } else if (records.weightRange) {
        y = kvLine(doc, y, 'Plage de poids', records.weightRange.min + '–' + records.weightRange.max + ' kg');
      }
      if (records.longestSession) {
        y = kvLine(doc, y, 'Séance la plus longue', records.longestSession.duration + ' min' + (records.longestSession.kcalTotal ? '  (' + records.longestSession.kcalTotal + ' kcal)' : ''));
      }
      if (typeof records.maxStreak === 'number' && records.maxStreak > 0) {
        y = kvLine(doc, y, 'Plus longue série', records.maxStreak + ' jour' + (records.maxStreak > 1 ? 's' : ''));
      }
      y += 3;
    }

    // ═══ 6. FOOTER ═══
    // Disclaimer médical (cohérent avec le modal premier login)
    y = checkPage(doc, y);
    y += 5;
    color(doc, 'draw', grey2);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + CW, y);
    y += 5;
    color(doc, 'text', grey);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7);
    var disclaimerLines = doc.splitTextToSize(
      'Ce rapport est généré à titre informatif et pédagogique. Il ne remplace pas l\'avis '
      + 'd\'un médecin ou d\'un professionnel de santé qualifié. Consulte un pro en cas de '
      + 'doute, de douleur persistante ou de pathologie.',
      CW
    );
    doc.text(disclaimerLines, M, y);
    y += disclaimerLines.length * 3 + 2;

    // Footer page number + génération
    var pageCount = doc.internal.getNumberOfPages();
    for (var pi = 1; pi <= pageCount; pi++) {
      doc.setPage(pi);
      color(doc, 'text', grey);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.text('Smart Fit Coach — ' + new Date().toLocaleDateString('fr-FR'), M, 290);
      var pn = pi + ' / ' + pageCount;
      var pnW = doc.getTextWidth(pn);
      doc.text(pn, W - M - pnW, 290);
    }

    // Nom fichier : rapport-hebdo-YYYY-MM-DD.pdf
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var dateStrFile = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
    doc.save('smartfitcoach-rapport-hebdo-' + dateStrFile + '.pdf');
  } catch(e) {
    console.error('[exportWeeklyReportPDF] Erreur:', e);
    alert('Erreur lors de la génération du PDF. Réessaie ou contacte le support.');
  }
};

})();
